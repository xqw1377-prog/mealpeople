-- ============================================================
-- P2-S0-B-R1 · 跨日冲突 + swap 语义 + day-off 不变量（最小修复，不重写 00127）
-- 依据: P2-S0-B = HOLD-R1 裁定（2026-10-07）
--
-- B-R1-1 冲突引擎 v2：绝对分钟区间（相对 p_date），查询窗口 ±1 天，
--        跨午夜班（end<=start 视为 +1440）自然覆盖"前日班侵入当日"
--        锁改员工级（publish/update），swap 双员工按 UUID 序加锁防死锁
-- B-R1-2 swap exclude 修正：检查 target 时排除 target 换出的班（ts.id），
--        检查 requester 时排除 requester 换出的班（rs.id）
-- B-R1-3 update work↔day_off 字段归一
-- B-R1-4 meal_periods 精确本店优先（store_id = p_store）→ 租户默认（IS NULL）→ 保守全天
-- B-R1-5 撤 owner 施工权限（CREATE ON public/private）
-- 注：CREATE OR REPLACE 保留既有 owner/ACL，无需重复授权语句
-- ============================================================

-- ---------- B-R1-1/4: 冲突引擎 v2 ----------
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
  v_cs int; v_ce int;   -- 候选工作班绝对区间（相对 p_date 的分钟）
  v_ws int; v_we int;   -- 候选排休窗口（相对 p_date 的分钟）
  r record;
BEGIN
  -- 排休候选：窗口内任何相交的工作班 = 冲突（含前日跨午夜班侵入当日）
  IF p_is_day_off THEN
    IF p_meal_period IS NULL OR p_meal_period = 'all_day' THEN
      v_ws := 0; v_we := 1440;
    ELSE
      SELECT (extract(hour from mp.start_time)*60 + extract(minute from mp.start_time))::int,
             (extract(hour from mp.end_time)*60 + extract(minute from mp.end_time))::int
        INTO v_ws, v_we
        FROM public.meal_periods mp
       WHERE mp.tenant_id = p_tenant AND mp.is_active
         AND (mp.store_id IS NULL OR mp.store_id = p_store)
         AND mp.period_name = CASE p_meal_period
              WHEN 'breakfast' THEN '早餐' WHEN 'lunch' THEN '午餐'
              WHEN 'dinner' THEN '晚餐' ELSE p_meal_period END
       ORDER BY (mp.store_id = p_store) DESC NULLS LAST
       LIMIT 1;
      IF v_ws IS NULL THEN
        v_ws := 0; v_we := 1440;
      END IF;
    END IF;
    RETURN QUERY
    SELECT CASE WHEN v_we - v_ws >= 1440 THEN 'all_day_rest_vs_work' ELSE 'meal_rest_vs_work' END,
           s.id, '班次与排休时间冲突'::text
      FROM public.schedules s
     WHERE s.employee_id = p_employee
       AND s.schedule_date BETWEEN p_date - 1 AND p_date + 1
       AND s.status = 'published' AND (p_exclude_id IS NULL OR s.id <> p_exclude_id)
       AND COALESCE(s.is_day_off, false) = false
       AND s.start_time IS NOT NULL AND s.end_time IS NOT NULL
       AND v_ws < (s.schedule_date - p_date) * 1440
                 + (extract(hour from s.end_time)*60 + extract(minute from s.end_time))::int
                 + CASE WHEN s.end_time <= s.start_time THEN 1440 ELSE 0 END
       AND (s.schedule_date - p_date) * 1440
           + (extract(hour from s.start_time)*60 + extract(minute from s.start_time))::int < v_we;
    RETURN;
  END IF;

  -- 工作班候选：绝对区间
  v_cs := (extract(hour from p_start)*60 + extract(minute from p_start))::int;
  v_ce := (extract(hour from p_end)*60 + extract(minute from p_end))::int
          + CASE WHEN p_end <= p_start THEN 1440 ELSE 0 END;

  -- vs 排修行（排休窗口按其所属日期折算到绝对区间；无配置保守全天）
  FOR r IN
    SELECT s.id, s.meal_period, (s.schedule_date - p_date) * 1440 AS rd,
           (SELECT (extract(hour from mp.start_time)*60 + extract(minute from mp.start_time))::int
              FROM public.meal_periods mp
             WHERE mp.tenant_id = p_tenant AND mp.is_active
               AND (mp.store_id IS NULL OR mp.store_id = p_store)
               AND mp.period_name = CASE s.meal_period
                    WHEN 'breakfast' THEN '早餐' WHEN 'lunch' THEN '午餐'
                    WHEN 'dinner' THEN '晚餐' ELSE s.meal_period END
             ORDER BY (mp.store_id = p_store) DESC NULLS LAST LIMIT 1) AS ws,
           (SELECT (extract(hour from mp.end_time)*60 + extract(minute from mp.end_time))::int
              FROM public.meal_periods mp
             WHERE mp.tenant_id = p_tenant AND mp.is_active
               AND (mp.store_id IS NULL OR mp.store_id = p_store)
               AND mp.period_name = CASE s.meal_period
                    WHEN 'breakfast' THEN '早餐' WHEN 'lunch' THEN '午餐'
                    WHEN 'dinner' THEN '晚餐' ELSE s.meal_period END
             ORDER BY (mp.store_id = p_store) DESC NULLS LAST LIMIT 1) AS we
      FROM public.schedules s
     WHERE s.employee_id = p_employee
       AND s.schedule_date BETWEEN p_date - 1 AND p_date + 1
       AND s.status = 'published' AND (p_exclude_id IS NULL OR s.id <> p_exclude_id)
       AND COALESCE(s.is_day_off, false)
  LOOP
    IF r.ws IS NULL THEN
      r.ws := 0; r.we := 1440;
    END IF;
    IF r.ws = 0 AND r.we = 1440 THEN
      IF v_cs < r.rd + 1440 AND r.rd < v_ce THEN
        RETURN QUERY VALUES ('work_vs_all_day_rest', r.id, '当天已全天排休'::text);
      END IF;
    ELSE
      IF v_cs < r.rd + r.we AND r.rd + r.ws < v_ce THEN
        RETURN QUERY VALUES ('work_vs_meal_rest', r.id, '班次与餐段排休时间冲突'::text);
      END IF;
    END IF;
  END LOOP;

  -- vs 工作班（绝对区间严格不等式 → 端点相接 ALLOW；含前日跨午夜班侵入）
  RETURN QUERY
  SELECT 'work_overlap'::text, s.id, '与已发布班次时间重叠'::text
    FROM public.schedules s
   WHERE s.employee_id = p_employee
     AND s.schedule_date BETWEEN p_date - 1 AND p_date + 1
     AND s.status = 'published' AND (p_exclude_id IS NULL OR s.id <> p_exclude_id)
     AND COALESCE(s.is_day_off, false) = false
     AND s.start_time IS NOT NULL AND s.end_time IS NOT NULL
     AND v_cs < (s.schedule_date - p_date) * 1440
               + (extract(hour from s.end_time)*60 + extract(minute from s.end_time))::int
               + CASE WHEN s.end_time <= s.start_time THEN 1440 ELSE 0 END
     AND (s.schedule_date - p_date) * 1440
         + (extract(hour from s.start_time)*60 + extract(minute from s.start_time))::int < v_ce;
  RETURN;
END
$$;

-- ---------- B-R1-1/3: publish_schedule（员工级锁） ----------
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

  -- 员工级锁（B-R1-1：天然覆盖跨日竞争）
  PERFORM pg_advisory_xact_lock(hashtextextended(p_employee_id::text, 0));

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

-- ---------- B-R1-1/3: update_schedule（员工级锁 + work↔day_off 字段归一） ----------
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

  s.is_day_off := COALESCE(p_is_day_off, s.is_day_off);
  s.notes      := COALESCE(p_notes, s.notes);

  IF s.is_day_off THEN
    -- B-R1-3：切为排休 → 强制清工作班字段，类型归一
    s.meal_period := COALESCE(p_meal_period, s.meal_period);
    IF s.meal_period IS NULL OR s.meal_period NOT IN ('all_day', 'breakfast', 'lunch', 'dinner') THEN
      RAISE EXCEPTION 'INVALID: meal_period 必须为 all_day/breakfast/lunch/dinner';
    END IF;
    s.start_time := NULL;
    s.end_time   := NULL;
    s.shift_type := 'day_off';
    s.rest_hours := COALESCE(p_rest_hours, s.rest_hours);
  ELSE
    -- B-R1-3：工作班 → 必须有起止（从排休切回须显式提供），清排休字段
    s.start_time := COALESCE(p_start_time, s.start_time);
    s.end_time   := COALESCE(p_end_time, s.end_time);
    s.shift_type := COALESCE(p_shift_type, s.shift_type);
    IF s.shift_type = 'day_off' THEN
      s.shift_type := 'regular';
    END IF;
    IF s.start_time IS NULL OR s.end_time IS NULL THEN
      RAISE EXCEPTION 'INVALID: 工作班必须提供起止时间';
    END IF;
    IF s.start_time = s.end_time THEN
      RAISE EXCEPTION 'INVALID: 起止时间不得相等';
    END IF;
    s.meal_period := NULL;
    s.rest_hours  := NULL;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(s.employee_id::text, 0));

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

-- ---------- B-R1-1/2: review_schedule_swap（员工级锁按 UUID 序 + exclude 修正） ----------
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
    -- 员工级锁，按 UUID 固定顺序加锁（防死锁）
    PERFORM pg_advisory_xact_lock(hashtextextended(LEAST(r.requester_id, r.target_id)::text, 0));
    PERFORM pg_advisory_xact_lock(hashtextextended(GREATEST(r.requester_id, r.target_id)::text, 0));

    -- B-R1-2：target 接 requester 的班 → 排除 target 自己换出的班（ts.id）
    FOR v_conflict IN
      SELECT * FROM private.sched_find_conflicts(
        rs.tenant_id, rs.store_id, r.target_id, rs.schedule_date,
        rs.start_time, rs.end_time, rs.is_day_off, rs.meal_period, ts.id)
    LOOP
      RAISE EXCEPTION 'CONFLICT(swap_target): %', v_conflict.detail;
    END LOOP;
    -- B-R1-2：requester 接 target 的班 → 排除 requester 自己换出的班（rs.id）
    FOR v_conflict IN
      SELECT * FROM private.sched_find_conflicts(
        rs.tenant_id, rs.store_id, r.requester_id, ts.schedule_date,
        ts.start_time, ts.end_time, ts.is_day_off, ts.meal_period, rs.id)
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

-- ---------- B-R1-5: 撤施工权限 ----------
REVOKE CREATE ON SCHEMA public FROM scheduling_authority_owner;
REVOKE CREATE ON SCHEMA private FROM scheduling_authority_owner;
