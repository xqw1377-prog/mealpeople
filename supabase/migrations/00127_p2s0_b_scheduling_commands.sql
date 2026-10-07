-- ============================================================
-- P2-S0-B · Transactional Scheduling Commands + Conflict Authority
-- 依据: AUTHORITY CONTRACT D1-D5 + P2-S0-B 授权（2026-10-07）
--
-- 五个 command（public schema RPC，仅 authenticated EXECUTE）:
--   publish_schedule / update_schedule / cancel_schedule
--   request_schedule_swap / review_schedule_swap
-- 每个 command: AUTH → scope → validate → LOCK → CONFLICT CHECK
--               → WRITE → NOTIFICATION → COMMIT（异常即整体 ROLLBACK）
--
-- B 阶段不变量:
--   * command 上线后 authenticated 对 schedules 直写 = DENY
--     （本 migration 撤销全部 INSERT/UPDATE policy，SELECT 保留）
--   * 冲突检查并发安全: pg_advisory_xact_lock(employee+date) + 同事务检查
--   * RPC 内身份取自 request.jwt.claims GUC（不调 auth.uid()——definer owner
--     无 auth schema USAGE，R1 实测不可授权；GUC 直读为 G0 g0_jwt_sub 同模式）
--   * 换班仅限同店（复合 FK (employee,tenant,store) 的必然推论）
--
-- 不触碰: 301 legacy / NOT VALID FK / Phase 1 UI / Journey V4
-- ============================================================

-- ---------- 0. owner 权限扩展（命令层写路径 + schema 前提） ----------
GRANT CREATE ON SCHEMA public TO scheduling_authority_owner;  -- public 内函数转 owner 的前置条件
GRANT SELECT, INSERT, UPDATE ON public.schedules TO scheduling_authority_owner;  -- SELECT 供冲突引擎/行锁读取
GRANT INSERT ON public.notifications TO scheduling_authority_owner;
GRANT SELECT, INSERT, UPDATE ON public.shift_swap_requests TO scheduling_authority_owner;
GRANT SELECT ON public.meal_periods TO scheduling_authority_owner;

-- ---------- 1. 冲突引擎（private，纯参数，无 auth 依赖） ----------
-- 返回 (员工, 日期) 上与给定候选行冲突的已发布行；p_exclude_id 排除自身（编辑场景）
-- 语义（合同 D4 冻结）:
--   全天排休 vs 任何工作班 = 冲突
--   餐段排休 vs 窗口相交工作班 = 冲突（无租户餐段配置时保守按全天）
--   工作班 vs 工作班 = 时间重叠冲突（端点相接 ALLOW；end<=start 视为跨天 +24h）
CREATE OR REPLACE FUNCTION private.sched_find_conflicts(
  p_tenant uuid,
  p_store uuid,
  p_employee uuid,
  p_date date,
  p_start time,
  p_end time,
  p_is_day_off boolean,
  p_meal_period text,
  p_exclude_id uuid DEFAULT NULL
)
RETURNS TABLE (kind text, schedule_id uuid, detail text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_ws int; v_we int;  -- 餐段窗口（分钟）
  v_s int; v_e int;    -- 候选工作班区间（分钟，跨天 +1440）
  r record;
BEGIN
  -- helper: 把 time 折算成分钟
  IF p_is_day_off THEN
    IF p_meal_period = 'all_day' OR p_meal_period IS NULL THEN
      -- 全天排休：当天存在任何工作班即冲突
      RETURN QUERY
      SELECT 'all_day_rest_vs_work'::text, s.id, '当天已存在工作班次'::text
        FROM public.schedules s
       WHERE s.employee_id = p_employee AND s.schedule_date = p_date
         AND s.status = 'published' AND (p_exclude_id IS NULL OR s.id <> p_exclude_id)
         AND COALESCE(s.is_day_off, false) = false;
      RETURN;
    END IF;
    -- 餐段排休：取本租户该餐段窗口（门店级优先；无配置保守按全天）
    SELECT (extract(hour from mp.start_time)*60 + extract(minute from mp.start_time))::int,
           (extract(hour from mp.end_time)*60 + extract(minute from mp.end_time))::int
      INTO v_ws, v_we
      FROM public.meal_periods mp
     WHERE mp.tenant_id = p_tenant AND mp.is_active
       AND mp.period_name = CASE p_meal_period
            WHEN 'breakfast' THEN '早餐' WHEN 'lunch' THEN '午餐'
            WHEN 'dinner' THEN '晚餐' ELSE p_meal_period END
     ORDER BY (mp.store_id IS NOT NULL) DESC, mp.period_order
     LIMIT 1;
    IF v_ws IS NULL THEN
      v_ws := 0; v_we := 1440;
    END IF;
    RETURN QUERY
    SELECT 'meal_rest_vs_work'::text, s.id, '班次与餐段排休时间冲突'::text
      FROM public.schedules s
     WHERE s.employee_id = p_employee AND s.schedule_date = p_date
       AND s.status = 'published' AND (p_exclude_id IS NULL OR s.id <> p_exclude_id)
       AND COALESCE(s.is_day_off, false) = false
       AND s.start_time IS NOT NULL AND s.end_time IS NOT NULL
       AND v_ws < (extract(hour from s.end_time)*60 + extract(minute from s.end_time))::int
                   + CASE WHEN s.end_time <= s.start_time THEN 1440 ELSE 0 END
       AND (extract(hour from s.start_time)*60 + extract(minute from s.start_time))::int < v_we;
    RETURN;
  END IF;

  -- 候选为工作班
  v_s := (extract(hour from p_start)*60 + extract(minute from p_start))::int;
  v_e := (extract(hour from p_end)*60 + extract(minute from p_end))::int
         + CASE WHEN p_end <= p_start THEN 1440 ELSE 0 END;

  -- vs 全天排休
  RETURN QUERY
  SELECT 'work_vs_all_day_rest'::text, s.id, '当天已全天排休'::text
    FROM public.schedules s
   WHERE s.employee_id = p_employee AND s.schedule_date = p_date
     AND s.status = 'published' AND (p_exclude_id IS NULL OR s.id <> p_exclude_id)
     AND COALESCE(s.is_day_off, false) AND COALESCE(s.meal_period, 'all_day') = 'all_day';

  -- vs 餐段排休（窗口无配置保守按全天）
  FOR r IN
    SELECT s.id,
           (SELECT (extract(hour from mp.start_time)*60 + extract(minute from mp.start_time))::int
              FROM public.meal_periods mp
             WHERE mp.tenant_id = p_tenant AND mp.is_active
               AND mp.period_name = CASE s.meal_period
                    WHEN 'breakfast' THEN '早餐' WHEN 'lunch' THEN '午餐'
                    WHEN 'dinner' THEN '晚餐' ELSE s.meal_period END
             ORDER BY (mp.store_id IS NOT NULL) DESC, mp.period_order LIMIT 1) AS ws,
           (SELECT (extract(hour from mp.end_time)*60 + extract(minute from mp.end_time))::int
              FROM public.meal_periods mp
             WHERE mp.tenant_id = p_tenant AND mp.is_active
               AND mp.period_name = CASE s.meal_period
                    WHEN 'breakfast' THEN '早餐' WHEN 'lunch' THEN '午餐'
                    WHEN 'dinner' THEN '晚餐' ELSE s.meal_period END
             ORDER BY (mp.store_id IS NOT NULL) DESC, mp.period_order LIMIT 1) AS we
      FROM public.schedules s
     WHERE s.employee_id = p_employee AND s.schedule_date = p_date
       AND s.status = 'published' AND (p_exclude_id IS NULL OR s.id <> p_exclude_id)
       AND COALESCE(s.is_day_off, false)
       AND COALESCE(s.meal_period, 'all_day') <> 'all_day'
  LOOP
    IF r.ws IS NULL THEN
      RETURN QUERY VALUES ('work_vs_meal_rest', r.id, '当天已排餐段休息(未配置窗口按全天)'::text);
    ELSIF r.ws < v_e AND v_s < r.we THEN
      RETURN QUERY VALUES ('work_vs_meal_rest', r.id, '班次与餐段排休时间冲突'::text);
    END IF;
  END LOOP;

  -- vs 工作班（严格不等式 → 端点相接 ALLOW）
  RETURN QUERY
  SELECT 'work_overlap'::text, s.id, '与已发布班次时间重叠'::text
    FROM public.schedules s
   WHERE s.employee_id = p_employee AND s.schedule_date = p_date
     AND s.status = 'published' AND (p_exclude_id IS NULL OR s.id <> p_exclude_id)
     AND COALESCE(s.is_day_off, false) = false
     AND s.start_time IS NOT NULL AND s.end_time IS NOT NULL
     AND v_s < (extract(hour from s.end_time)*60 + extract(minute from s.end_time))::int
               + CASE WHEN s.end_time <= s.start_time THEN 1440 ELSE 0 END
     AND (extract(hour from s.start_time)*60 + extract(minute from s.start_time))::int < v_e;
  RETURN;
END
$$;

ALTER FUNCTION private.sched_find_conflicts(uuid, uuid, uuid, date, time, time, boolean, text, uuid)
  OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION private.sched_find_conflicts(uuid, uuid, uuid, date, time, time, boolean, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_find_conflicts(uuid, uuid, uuid, date, time, time, boolean, text, uuid) FROM anon;

-- ---------- 2. 写权限门 ----------
CREATE OR REPLACE FUNCTION private.sched_can_write_store(
  p_uid uuid, p_tenant uuid, p_store uuid
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT public.is_super_admin(p_uid)
      OR (private.sched_is_tenant_admin(p_uid)
          AND p_tenant = public.get_user_tenant_id(p_uid))
      OR (private.sched_is_store_manager(p_uid)
          AND p_tenant = public.get_user_tenant_id(p_uid)
          AND p_store IN (SELECT private.sched_my_managed_store_ids(p_uid)))
$$;

ALTER FUNCTION private.sched_can_write_store(uuid, uuid, uuid) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION private.sched_can_write_store(uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_can_write_store(uuid, uuid, uuid) FROM anon;

-- ---------- 3. 通知投递 ----------
CREATE OR REPLACE FUNCTION private.sched_notify(
  p_user uuid, p_tenant uuid, p_title text, p_content text, p_related uuid
)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = 'public'
AS $$
  -- 员工未绑定登录用户时静默跳过（notifications.user_id NOT NULL，NULL 会炸掉整个 command 事务）
  INSERT INTO public.notifications (tenant_id, user_id, type, title, content, related_id, related_type, is_read)
  SELECT p_tenant, p_user, 'schedule', p_title, p_content, p_related, 'schedule', false
   WHERE p_user IS NOT NULL
$$;

ALTER FUNCTION private.sched_notify(uuid, uuid, text, text, uuid) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION private.sched_notify(uuid, uuid, text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_notify(uuid, uuid, text, text, uuid) FROM anon;

-- ---------- 4. swap 表 FK 切换（rows=0，直接迁语义） ----------
ALTER TABLE public.shift_swap_requests
  DROP CONSTRAINT IF EXISTS shift_swap_requests_requester_shift_id_fkey,
  DROP CONSTRAINT IF EXISTS shift_swap_requests_target_shift_id_fkey;

ALTER TABLE public.shift_swap_requests
  ADD CONSTRAINT shift_swap_requests_requester_shift_fkey
  FOREIGN KEY (requester_shift_id) REFERENCES public.schedules (id) ON DELETE CASCADE;
ALTER TABLE public.shift_swap_requests
  ADD CONSTRAINT shift_swap_requests_target_shift_fkey
  FOREIGN KEY (target_shift_id) REFERENCES public.schedules (id) ON DELETE CASCADE;

-- 旧无 scope 策略淘汰；换班读写仅经 command RPC，SELECT 留最小可见性
DROP POLICY IF EXISTS "员工创建换班申请" ON public.shift_swap_requests;
DROP POLICY IF EXISTS "员工取消自己的换班申请" ON public.shift_swap_requests;
DROP POLICY IF EXISTS "员工查看相关的换班申请" ON public.shift_swap_requests;
DROP POLICY IF EXISTS "管理员审批换班申请" ON public.shift_swap_requests;
DROP POLICY IF EXISTS "管理员查看所有换班申请" ON public.shift_swap_requests;

CREATE POLICY swap_select_own_or_manager ON public.shift_swap_requests
  FOR SELECT TO authenticated
  USING (
    requester_id IN (SELECT private.sched_my_employee_ids(auth.uid()))
    OR (private.sched_is_tenant_admin(auth.uid())
        AND tenant_id = public.get_user_tenant_id(auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.schedules s
       WHERE s.id IN (shift_swap_requests.requester_shift_id, shift_swap_requests.target_shift_id)
         AND s.store_id IN (SELECT private.sched_my_managed_store_ids(auth.uid()))
    )
  );

-- ---------- 5. Command: publish_schedule ----------
CREATE OR REPLACE FUNCTION public.publish_schedule(
  p_employee_id uuid,
  p_schedule_date date,
  p_shift_type text DEFAULT 'regular',
  p_start_time time DEFAULT NULL,
  p_end_time time DEFAULT NULL,
  p_is_day_off boolean DEFAULT false,
  p_meal_period text DEFAULT NULL,
  p_rest_hours numeric DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  v_emp record;
  v_conflict record;
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  SELECT e.tenant_id, e.store_id, e.user_id, e.status INTO v_emp
    FROM public.employees e WHERE e.id = p_employee_id;
  IF v_emp IS NULL OR v_emp.status <> 'active' THEN
    RAISE EXCEPTION 'INVALID: 员工不存在或非在职';
  END IF;

  IF NOT private.sched_can_write_store(v_uid, v_emp.tenant_id, v_emp.store_id) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 无该门店排班权限';
  END IF;

  IF p_is_day_off THEN
    IF p_meal_period IS NULL OR p_meal_period NOT IN ('all_day', 'breakfast', 'lunch', 'dinner') THEN
      RAISE EXCEPTION 'INVALID: meal_period 必须为 all_day/breakfast/lunch/dinner';
    END IF;
    IF p_start_time IS NOT NULL OR p_end_time IS NOT NULL THEN
      RAISE EXCEPTION 'INVALID: 排休行不得携带起止时间';
    END IF;
  ELSE
    IF p_start_time IS NULL OR p_end_time IS NULL THEN
      RAISE EXCEPTION 'INVALID: 工作班必须提供起止时间';
    END IF;
    IF p_start_time = p_end_time THEN
      RAISE EXCEPTION 'INVALID: 起止时间不得相等';
    END IF;
  END IF;

  -- 并发串行化：同 (员工, 日期) 排队检查
  PERFORM pg_advisory_xact_lock(
    hashtextextended(p_employee_id::text || ':' || p_schedule_date::text, 0));

  FOR v_conflict IN
    SELECT * FROM private.sched_find_conflicts(
      v_emp.tenant_id, v_emp.store_id, p_employee_id, p_schedule_date,
      p_start_time, p_end_time, p_is_day_off, p_meal_period, NULL)
  LOOP
    RAISE EXCEPTION 'CONFLICT(%): %', v_conflict.kind, v_conflict.detail;
  END LOOP;

  INSERT INTO public.schedules
    (tenant_id, store_id, employee_id, schedule_date, shift_type,
     start_time, end_time, status, is_day_off, meal_period, rest_hours, notes, created_by)
  VALUES
    (v_emp.tenant_id, v_emp.store_id, p_employee_id, p_schedule_date,
     CASE WHEN p_is_day_off THEN 'day_off' ELSE p_shift_type END,
     p_start_time, p_end_time, 'published', p_is_day_off,
     CASE WHEN p_is_day_off THEN p_meal_period END, p_rest_hours, p_notes, v_uid)
  RETURNING id INTO v_id;

  IF v_emp.user_id IS NOT NULL THEN
    PERFORM private.sched_notify(v_emp.user_id, v_emp.tenant_id, '排班已发布',
      '你的 ' || to_char(p_schedule_date, 'MM-DD') ||
      CASE WHEN p_is_day_off THEN ' 排休（' || p_meal_period || '）'
           ELSE ' 班次 ' || p_start_time || '-' || p_end_time END || ' 已发布',
      v_id);
  END IF;

  RETURN jsonb_build_object('ok', true, 'schedule_id', v_id);
END
$$;

ALTER FUNCTION public.publish_schedule(uuid, date, text, time, time, boolean, text, numeric, text)
  OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.publish_schedule(uuid, date, text, time, time, boolean, text, numeric, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_schedule(uuid, date, text, time, time, boolean, text, numeric, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.publish_schedule(uuid, date, text, time, time, boolean, text, numeric, text) TO authenticated;

-- ---------- 6. Command: update_schedule ----------
CREATE OR REPLACE FUNCTION public.update_schedule(
  p_schedule_id uuid,
  p_start_time time DEFAULT NULL,
  p_end_time time DEFAULT NULL,
  p_shift_type text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_is_day_off boolean DEFAULT NULL,
  p_meal_period text DEFAULT NULL,
  p_rest_hours numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  s record;
  v_conflict record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  SELECT * INTO s FROM public.schedules WHERE id = p_schedule_id FOR UPDATE;
  IF s IS NULL OR s.status <> 'published' THEN
    RAISE EXCEPTION 'INVALID: 排班不存在或非 published（legacy/cancelled 不可修改）';
  END IF;

  IF NOT private.sched_can_write_store(v_uid, s.tenant_id, s.store_id) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 无该门店排班权限';
  END IF;

  s.start_time  := COALESCE(p_start_time, s.start_time);
  s.end_time    := COALESCE(p_end_time, s.end_time);
  s.shift_type  := COALESCE(p_shift_type, s.shift_type);
  s.is_day_off  := COALESCE(p_is_day_off, s.is_day_off);
  s.meal_period := COALESCE(p_meal_period, s.meal_period);
  s.rest_hours  := COALESCE(p_rest_hours, s.rest_hours);
  s.notes       := COALESCE(p_notes, s.notes);

  IF s.is_day_off THEN
    IF s.meal_period IS NULL OR s.meal_period NOT IN ('all_day', 'breakfast', 'lunch', 'dinner') THEN
      RAISE EXCEPTION 'INVALID: meal_period 必须为 all_day/breakfast/lunch/dinner';
    END IF;
  ELSE
    IF s.start_time IS NULL OR s.end_time IS NULL THEN
      RAISE EXCEPTION 'INVALID: 工作班必须提供起止时间';
    END IF;
    IF s.start_time = s.end_time THEN
      RAISE EXCEPTION 'INVALID: 起止时间不得相等';
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(s.employee_id::text || ':' || s.schedule_date::text, 0));

  -- 排除自身后再检（B5）
  FOR v_conflict IN
    SELECT * FROM private.sched_find_conflicts(
      s.tenant_id, s.store_id, s.employee_id, s.schedule_date,
      s.start_time, s.end_time, s.is_day_off, s.meal_period, p_schedule_id)
  LOOP
    RAISE EXCEPTION 'CONFLICT(%): %', v_conflict.kind, v_conflict.detail;
  END LOOP;

  UPDATE public.schedules SET
    start_time = s.start_time, end_time = s.end_time, shift_type = s.shift_type,
    is_day_off = s.is_day_off, meal_period = s.meal_period,
    rest_hours = s.rest_hours, notes = s.notes,
    updated_at = now()
  WHERE id = p_schedule_id;

  PERFORM private.sched_notify(
    (SELECT e.user_id FROM public.employees e WHERE e.id = s.employee_id),
    s.tenant_id, '排班已修改',
    '你的 ' || to_char(s.schedule_date, 'MM-DD') || ' 排班已被修改', p_schedule_id);

  RETURN jsonb_build_object('ok', true);
END
$$;

ALTER FUNCTION public.update_schedule(uuid, time, time, text, text, boolean, text, numeric)
  OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.update_schedule(uuid, time, time, text, text, boolean, text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_schedule(uuid, time, time, text, text, boolean, text, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_schedule(uuid, time, time, text, text, boolean, text, numeric) TO authenticated;

-- ---------- 7. Command: cancel_schedule ----------
CREATE OR REPLACE FUNCTION public.cancel_schedule(
  p_schedule_id uuid, p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  s record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  SELECT * INTO s FROM public.schedules WHERE id = p_schedule_id FOR UPDATE;
  IF s IS NULL OR s.status <> 'published' THEN
    RAISE EXCEPTION 'INVALID: 排班不存在或非 published';
  END IF;

  IF NOT private.sched_can_write_store(v_uid, s.tenant_id, s.store_id) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 无该门店排班权限';
  END IF;

  UPDATE public.schedules SET status = 'cancelled', updated_at = now()
   WHERE id = p_schedule_id;

  PERFORM private.sched_notify(
    (SELECT e.user_id FROM public.employees e WHERE e.id = s.employee_id),
    s.tenant_id, '排班已取消',
    '你的 ' || to_char(s.schedule_date, 'MM-DD') || ' 排班已取消' ||
    COALESCE('：' || p_reason, ''), p_schedule_id);

  RETURN jsonb_build_object('ok', true);
END
$$;

ALTER FUNCTION public.cancel_schedule(uuid, text) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.cancel_schedule(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_schedule(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_schedule(uuid, text) TO authenticated;

-- ---------- 8. Command: request_schedule_swap ----------
CREATE OR REPLACE FUNCTION public.request_schedule_swap(
  p_requester_schedule_id uuid,
  p_target_schedule_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  rs record; ts record;
  v_req_id uuid;
  appr record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  SELECT * INTO rs FROM public.schedules WHERE id = p_requester_schedule_id FOR UPDATE;
  SELECT * INTO ts FROM public.schedules WHERE id = p_target_schedule_id FOR UPDATE;
  IF rs IS NULL OR ts IS NULL OR rs.status <> 'published' OR ts.status <> 'published' THEN
    RAISE EXCEPTION 'INVALID: 相关班次不存在或非 published';
  END IF;
  IF rs.employee_id = ts.employee_id THEN
    RAISE EXCEPTION 'INVALID: 不能与自己换班';
  END IF;
  IF rs.store_id <> ts.store_id OR rs.tenant_id <> ts.tenant_id THEN
    RAISE EXCEPTION 'INVALID: 换班仅限同门店班次';
  END IF;
  IF rs.employee_id NOT IN (SELECT private.sched_my_employee_ids(v_uid)) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 只能发起本人班次的换班';
  END IF;
  -- 复合 FK 前置：双方均须为该门店在职员工记录（交换后 (employee,tenant,store) 仍成立）
  IF (SELECT count(*) FROM public.employees e
       WHERE e.id IN (rs.employee_id, ts.employee_id)
         AND e.store_id = rs.store_id AND e.tenant_id = rs.tenant_id
         AND e.status = 'active') <> 2 THEN
    RAISE EXCEPTION 'INVALID: 双方均须为该门店在职员工记录';
  END IF;
  IF EXISTS (SELECT 1 FROM public.shift_swap_requests r
              WHERE r.status = 'pending'
                AND (r.requester_shift_id IN (rs.id, ts.id)
                     OR r.target_shift_id IN (rs.id, ts.id))) THEN
    RAISE EXCEPTION 'INVALID: 相关班次已有待审批换班申请';
  END IF;

  INSERT INTO public.shift_swap_requests
    (tenant_id, requester_id, requester_shift_id, target_id, target_shift_id, reason, status)
  VALUES
    (rs.tenant_id, rs.employee_id, rs.id, ts.employee_id, ts.id, p_reason, 'pending')
  RETURNING id INTO v_req_id;

  -- 通知审批人：门店经理（如配置）+ 本租户管理员
  FOR appr IN
    SELECT p.id FROM public.profiles p
     WHERE p.tenant_id = rs.tenant_id AND p.role = 'tenant_admin'
    UNION
    SELECT st.manager_id FROM public.stores st
     WHERE st.id = rs.store_id AND st.manager_id IS NOT NULL
  LOOP
    PERFORM private.sched_notify(appr.id, rs.tenant_id, '收到换班申请',
      '有一笔换班申请待审批', v_req_id);
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'request_id', v_req_id);
END
$$;

ALTER FUNCTION public.request_schedule_swap(uuid, uuid, text) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.request_schedule_swap(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_schedule_swap(uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.request_schedule_swap(uuid, uuid, text) TO authenticated;

-- ---------- 9. Command: review_schedule_swap ----------
-- VERIFY → CONFLICT CHECK → SWAP → APPROVE → NOTIFICATION → COMMIT（单事务，异常全回滚）
CREATE OR REPLACE FUNCTION public.review_schedule_swap(
  p_request_id uuid,
  p_approve boolean,
  p_review_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  r record; rs record; ts record;
  v_conflict record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  SELECT * INTO r FROM public.shift_swap_requests WHERE id = p_request_id FOR UPDATE;
  IF r IS NULL OR r.status <> 'pending' THEN
    RAISE EXCEPTION 'INVALID: 申请不存在或非 pending';
  END IF;

  SELECT * INTO rs FROM public.schedules WHERE id = r.requester_shift_id FOR UPDATE;
  SELECT * INTO ts FROM public.schedules WHERE id = r.target_shift_id FOR UPDATE;
  IF rs IS NULL OR ts IS NULL OR rs.status <> 'published' OR ts.status <> 'published' THEN
    RAISE EXCEPTION 'INVALID: 相关班次已不可用';
  END IF;

  IF NOT private.sched_can_write_store(v_uid, rs.tenant_id, rs.store_id) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 无该门店审批权限';
  END IF;

  IF p_approve THEN
    -- 交换后：target 员工接 requester 的班（requester 日期）；反之亦然
    PERFORM pg_advisory_xact_lock(
      hashtextextended(r.target_id::text || ':' || rs.schedule_date::text, 0));
    PERFORM pg_advisory_xact_lock(
      hashtextextended(r.requester_id::text || ':' || ts.schedule_date::text, 0));

    FOR v_conflict IN
      SELECT * FROM private.sched_find_conflicts(
        rs.tenant_id, rs.store_id, r.target_id, rs.schedule_date,
        rs.start_time, rs.end_time, rs.is_day_off, rs.meal_period, rs.id)
    LOOP
      RAISE EXCEPTION 'CONFLICT(swap_target): %', v_conflict.detail;
    END LOOP;
    FOR v_conflict IN
      SELECT * FROM private.sched_find_conflicts(
        rs.tenant_id, rs.store_id, r.requester_id, ts.schedule_date,
        ts.start_time, ts.end_time, ts.is_day_off, ts.meal_period, ts.id)
    LOOP
      RAISE EXCEPTION 'CONFLICT(swap_requester): %', v_conflict.detail;
    END LOOP;

    UPDATE public.schedules SET employee_id = r.target_id, updated_at = now() WHERE id = rs.id;
    UPDATE public.schedules SET employee_id = r.requester_id, updated_at = now() WHERE id = ts.id;
    UPDATE public.shift_swap_requests
       SET status = 'approved', reviewed_by = v_uid, reviewed_at = now(), review_notes = p_review_notes
     WHERE id = p_request_id;

    PERFORM private.sched_notify(
      (SELECT e.user_id FROM public.employees e WHERE e.id = r.requester_id),
      r.tenant_id, '换班结果', '你的换班申请已通过，班次已交换', p_request_id);
    PERFORM private.sched_notify(
      (SELECT e.user_id FROM public.employees e WHERE e.id = r.target_id),
      r.tenant_id, '换班结果', '你被换入新班次，请查看我的班次', p_request_id);
  ELSE
    UPDATE public.shift_swap_requests
       SET status = 'rejected', reviewed_by = v_uid, reviewed_at = now(), review_notes = p_review_notes
     WHERE id = p_request_id;
    PERFORM private.sched_notify(
      (SELECT e.user_id FROM public.employees e WHERE e.id = r.requester_id),
      r.tenant_id, '换班结果', '你的换班申请被拒绝', p_request_id);
  END IF;

  RETURN jsonb_build_object('ok', true);
END
$$;

ALTER FUNCTION public.review_schedule_swap(uuid, boolean, text) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.review_schedule_swap(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_schedule_swap(uuid, boolean, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.review_schedule_swap(uuid, boolean, text) TO authenticated;

-- ---------- 10. B7: 直写封死（撤销 authenticated 全部 INSERT/UPDATE policy） ----------
DROP POLICY IF EXISTS schedules_insert_tenant_admin ON public.schedules;
DROP POLICY IF EXISTS schedules_insert_store_manager ON public.schedules;
DROP POLICY IF EXISTS schedules_insert_super_admin ON public.schedules;
DROP POLICY IF EXISTS schedules_update_tenant_admin ON public.schedules;
DROP POLICY IF EXISTS schedules_update_store_manager ON public.schedules;
DROP POLICY IF EXISTS schedules_update_super_admin ON public.schedules;
