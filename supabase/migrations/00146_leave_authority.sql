-- ============================================================
-- LEAVE-A · Command Authority + RLS Rebuild
-- 依据: LEAVE AUTHORITY CONTRACT v0.1
--
-- 1. 废除 9 条旧 RLS 策略 → 重建 SELECT-only 权威矩阵
-- 2. leave_request / leave_review / leave_cancel 三 command RPC
-- 3. 服务端冲突检查（AND 语义）
-- 4. 通知（申请→审批人；结果→员工）
-- ============================================================

GRANT scheduling_authority_owner TO postgres;
GRANT CREATE ON SCHEMA public TO scheduling_authority_owner;
GRANT SELECT, INSERT, UPDATE ON public.leave_requests TO scheduling_authority_owner;

-- ---------- RLS 重建 ----------
DROP POLICY IF EXISTS "员工可以创建请假申请" ON public.leave_requests;
DROP POLICY IF EXISTS "员工创建自己的请假申请" ON public.leave_requests;
DROP POLICY IF EXISTS "员工可以查看自己的请假申请" ON public.leave_requests;
DROP POLICY IF EXISTS "员工查看自己的请假申请" ON public.leave_requests;
DROP POLICY IF EXISTS "员工可以取消自己的待审批申请" ON public.leave_requests;
DROP POLICY IF EXISTS "员工更新自己的待审批请假" ON public.leave_requests;
DROP POLICY IF EXISTS "管理员可以审批请假申请" ON public.leave_requests;
DROP POLICY IF EXISTS "管理员可以删除请假申请" ON public.leave_requests;
DROP POLICY IF EXISTS "管理员管理所有请假申请" ON public.leave_requests;

-- SELECT-only（写路径全走 command definer）
CREATE POLICY lv_select_own ON public.leave_requests
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT private.att_my_employee_ids(auth.uid())));

CREATE POLICY lv_select_managed ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    private.sched_is_store_manager(auth.uid())
    AND store_id IN (SELECT private.sched_my_managed_store_ids(auth.uid()))
  );

CREATE POLICY lv_select_tenant ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    private.sched_is_tenant_admin(auth.uid())
    AND tenant_id = public.get_user_tenant_id(auth.uid())
  );

REVOKE SELECT ON public.leave_requests FROM anon;

-- ---------- leave_request ----------
CREATE OR REPLACE FUNCTION public.leave_request(
  p_leave_type text,
  p_start_date date,
  p_end_date date,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  e record;
  v_conflict int;
  v_id uuid;
  v_days int;
  appr record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;
  IF p_leave_type NOT IN ('annual_leave','sick_leave','personal_leave','other') THEN
    RAISE EXCEPTION 'INVALID: 请假类型必须为 annual_leave/sick_leave/personal_leave/other';
  END IF;
  IF p_start_date IS NULL OR p_end_date IS NULL OR p_end_date < p_start_date THEN
    RAISE EXCEPTION 'INVALID: 日期无效';
  END IF;

  SELECT id, tenant_id, store_id INTO e
    FROM public.employees
   WHERE user_id = v_uid AND status = 'active'
   ORDER BY created_at LIMIT 1;
  IF e.id IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 无在职员工身份';
  END IF;

  -- 冲突检查（AND 语义：同员工日期范围真重叠）
  SELECT count(*) INTO v_conflict
    FROM public.leave_requests lr
   WHERE lr.employee_id = e.id
     AND lr.status IN ('pending','approved')
     AND lr.start_date <= p_end_date
     AND lr.end_date >= p_start_date;
  IF v_conflict > 0 THEN
    RAISE EXCEPTION 'CONFLICT: 日期范围与已有请假重叠';
  END IF;

  v_days := (p_end_date - p_start_date) + 1;
  INSERT INTO public.leave_requests
    (tenant_id, employee_id, store_id, leave_type, start_date, end_date, days, reason, status)
  VALUES
    (e.tenant_id, e.id, e.store_id, p_leave_type, p_start_date, p_end_date, v_days, p_reason, 'pending')
  RETURNING id INTO v_id;

  -- 通知审批人
  FOR appr IN
    SELECT p.id FROM public.profiles p
     WHERE p.tenant_id = e.tenant_id AND p.role = 'tenant_admin'
  LOOP
    INSERT INTO public.notifications (tenant_id, user_id, type, title, content, related_id, related_type, is_read)
    VALUES (e.tenant_id, appr.id, 'system', '收到请假申请', '有一笔请假申请待审批', v_id, 'leave', false);
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'request_id', v_id);
END
$$;

-- ---------- leave_review ----------
CREATE OR REPLACE FUNCTION public.leave_review(
  p_request_id uuid,
  p_approve boolean,
  p_comment text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  r record;
  v_emp_user uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  SELECT * INTO r FROM public.leave_requests WHERE id = p_request_id FOR UPDATE;
  IF r IS NULL OR r.status <> 'pending' THEN
    RAISE EXCEPTION 'INVALID: 申请不存在或非 pending';
  END IF;

  IF NOT private.sched_can_write_store(v_uid, r.tenant_id, r.store_id) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 无审批权限';
  END IF;

  UPDATE public.leave_requests
     SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
         approval_comment = p_comment,
         approver_id = v_uid,
         approved_at = now(),
         updated_at = now()
   WHERE id = p_request_id;

  -- 通知员工
  SELECT user_id INTO v_emp_user FROM public.employees WHERE id = r.employee_id;
  IF v_emp_user IS NOT NULL THEN
    INSERT INTO public.notifications (tenant_id, user_id, type, title, content, related_id, related_type, is_read)
    VALUES (r.tenant_id, v_emp_user, 'system', '请假审批结果',
            CASE WHEN p_approve THEN '你的请假申请已通过' ELSE '你的请假申请被拒绝' END,
            p_request_id, 'leave', false);
  END IF;

  RETURN jsonb_build_object('ok', true);
END
$$;

-- ---------- leave_cancel ----------
CREATE OR REPLACE FUNCTION public.leave_cancel(
  p_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  r record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  SELECT * INTO r FROM public.leave_requests WHERE id = p_request_id FOR UPDATE;
  IF r IS NULL OR r.status <> 'pending' THEN
    RAISE EXCEPTION 'INVALID: 申请不存在或非 pending';
  END IF;
  IF r.employee_id NOT IN (SELECT private.sched_my_employee_ids(v_uid)) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 只能撤回自己的申请';
  END IF;

  UPDATE public.leave_requests
     SET status = 'cancelled', updated_at = now()
   WHERE id = p_request_id;

  RETURN jsonb_build_object('ok', true);
END
$$;

ALTER FUNCTION public.leave_request(text, date, date, text) OWNER TO scheduling_authority_owner;
ALTER FUNCTION public.leave_review(uuid, boolean, text) OWNER TO scheduling_authority_owner;
ALTER FUNCTION public.leave_cancel(uuid) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.leave_request(text, date, date, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_request(text, date, date, text) FROM anon;
REVOKE ALL ON FUNCTION public.leave_review(uuid, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_review(uuid, boolean, text) FROM anon;
REVOKE ALL ON FUNCTION public.leave_cancel(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_cancel(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.leave_request(text, date, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_review(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_cancel(uuid) TO authenticated;

REVOKE CREATE ON SCHEMA public FROM scheduling_authority_owner;
