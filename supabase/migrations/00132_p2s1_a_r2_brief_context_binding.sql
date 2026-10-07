-- ============================================================
-- P2-S1-A-R2 · Brief Context Binding（对象授权最小化）
-- 依据: P2-S1-A = HOLD-R2 裁定（get_swap_shift_brief 权限边界）
--   R1 版：同店 active 员工可按任意 UUID 查 5 字段（含 legacy）→ 越界
--   R2 版：legacy 恒 0；管理者限本店写权限；员工仅当该班次出现在
--          自己发起的 swap request（requester/target shift）中才可读
-- 仅改本函数；前端无变化（ac80c80 构建证据继续有效）
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_swap_shift_brief(
  p_schedule_id uuid
)
RETURNS TABLE (schedule_id uuid, employee_name text, schedule_date date, start_time time, end_time time)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  s record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  SELECT * INTO s FROM public.schedules WHERE id = p_schedule_id;
  IF s IS NULL OR s.status = 'legacy' THEN
    RETURN;  -- 不存在或 legacy：恒 0 行
  END IF;

  -- 管理者：本店写权限（tenant_admin/store_manager/super_admin + scope）
  IF private.sched_can_write_store(v_uid, s.tenant_id, s.store_id) THEN
    RETURN QUERY
    SELECT s.id, e.name, s.schedule_date, s.start_time, s.end_time
      FROM public.employees e
     WHERE e.id = s.employee_id;
    RETURN;
  END IF;

  -- 员工：仅当该班次绑定于自己发起的换班申请（requester 本人视角）
  IF EXISTS (
      SELECT 1 FROM public.shift_swap_requests r
       WHERE r.requester_id IN (SELECT private.sched_my_employee_ids(v_uid))
         AND p_schedule_id IN (r.requester_shift_id, r.target_shift_id)
  ) THEN
    RETURN QUERY
    SELECT s.id, e.name, s.schedule_date, s.start_time, s.end_time
      FROM public.employees e
     WHERE e.id = s.employee_id;
  END IF;
  RETURN;
END
$$;

-- CREATE OR REPLACE 保留 owner/ACL，此处显式重申（防漂移）
REVOKE ALL ON FUNCTION public.get_swap_shift_brief(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_swap_shift_brief(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_swap_shift_brief(uuid) TO authenticated;
