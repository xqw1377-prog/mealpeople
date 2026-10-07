-- ============================================================
-- P2-S1-A · cancel_schedule_swap（第 6 个 command，D5 矩阵闭合）
-- 依据: AUTHORITY CONTRACT D5「employee → 撤回自己的 pending 请求」
--       B 阶段五命令未覆盖；shift_swap_requests 旧 UPDATE 策略已在 00127 淘汰，
--       员工撤回路径当前不存在 —— P2-S1-A cutover 硬前提
-- 语义: 仅 requester 本人 + 仅 pending → cancelled；其余 DENY
-- ============================================================

CREATE OR REPLACE FUNCTION public.cancel_schedule_swap(
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

  SELECT * INTO r FROM public.shift_swap_requests WHERE id = p_request_id FOR UPDATE;
  IF r IS NULL OR r.status <> 'pending' THEN
    RAISE EXCEPTION 'INVALID: 申请不存在或非 pending';
  END IF;
  IF r.requester_id NOT IN (SELECT private.sched_my_employee_ids(v_uid)) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 只能撤回自己的换班申请';
  END IF;

  UPDATE public.shift_swap_requests
     SET status = 'cancelled', updated_at = now()
   WHERE id = p_request_id;

  RETURN jsonb_build_object('ok', true);
END
$$;

-- owner/ACL 与其他 command 同纪律（CREATE OR REPLACE 后补 owner 与 ACL）
GRANT scheduling_authority_owner TO postgres;
GRANT CREATE ON SCHEMA public TO scheduling_authority_owner;

ALTER FUNCTION public.cancel_schedule_swap(uuid) OWNER TO scheduling_authority_owner;

REVOKE CREATE ON SCHEMA public FROM scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.cancel_schedule_swap(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_schedule_swap(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_schedule_swap(uuid) TO authenticated;
