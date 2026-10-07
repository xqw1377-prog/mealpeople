-- ============================================================
-- P2-S1-A-R1 · 权限面收敛：撤 00130 宽策略，换专用最小读 RPC
-- 依据: P2-S1-A = HOLD-R1 裁定（Blocker 1）
--   00130 让员工可整行读同店所有人 published schedules —— 权限面过宽；
--   换班候选只需 5 个最小字段 → purpose-built RPC，表级 RLS 不再放宽
-- ============================================================

-- 1. 撤宽策略与其专用 helper（仅该策略使用）
DROP POLICY IF EXISTS schedules_select_store_published ON public.schedules;
DROP FUNCTION IF EXISTS private.sched_my_store_ids(uuid);

-- 2. 专用读 RPC：换班候选（仅最小字段，服务端验证本人 published 班次）
CREATE OR REPLACE FUNCTION public.list_schedule_swap_candidates(
  p_requester_schedule_id uuid
)
RETURNS TABLE (schedule_id uuid, employee_name text, schedule_date date, start_time time, end_time time)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  rs record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  SELECT * INTO rs FROM public.schedules WHERE id = p_requester_schedule_id;
  IF rs IS NULL OR rs.status <> 'published' THEN
    RAISE EXCEPTION 'INVALID: 班次不存在或非 published';
  END IF;
  IF rs.employee_id NOT IN (SELECT private.sched_my_employee_ids(v_uid)) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 只能以本人班次发起';
  END IF;

  RETURN QUERY
  SELECT s.id, e.name, s.schedule_date, s.start_time, s.end_time
    FROM public.schedules s
    JOIN public.employees e ON e.id = s.employee_id
   WHERE s.tenant_id = rs.tenant_id
     AND s.store_id = rs.store_id
     AND s.status = 'published'
     AND COALESCE(s.is_day_off, false) = false
     AND s.id <> rs.id
     AND s.employee_id <> rs.employee_id
     AND s.schedule_date >= current_date
     AND e.status = 'active'
   ORDER BY s.schedule_date, s.start_time;
END
$$;

-- 3. 专用读 RPC：换班记录班次简报（撤宽策略后，员工侧 embed 不可见的两行补时段时间；
--    仅最小字段；仅本店在职员工或本店管理者可读）
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
  IF s IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
      SELECT 1 FROM public.employees e
       WHERE e.user_id = v_uid AND e.status = 'active'
         AND e.store_id = s.store_id AND e.tenant_id = s.tenant_id)
     AND NOT private.sched_can_write_store(v_uid, s.tenant_id, s.store_id) THEN
    RETURN;  -- 无本店语境则不返回
  END IF;

  RETURN QUERY
  SELECT s.id, e.name, s.schedule_date, s.start_time, s.end_time
    FROM public.employees e
   WHERE e.id = s.employee_id;
END
$$;

-- owner/ACL 与既有 command 同纪律
GRANT scheduling_authority_owner TO postgres;
GRANT CREATE ON SCHEMA public TO scheduling_authority_owner;

ALTER FUNCTION public.list_schedule_swap_candidates(uuid) OWNER TO scheduling_authority_owner;
ALTER FUNCTION public.get_swap_shift_brief(uuid) OWNER TO scheduling_authority_owner;

REVOKE CREATE ON SCHEMA public FROM scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.list_schedule_swap_candidates(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_schedule_swap_candidates(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.get_swap_shift_brief(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_swap_shift_brief(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.list_schedule_swap_candidates(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_swap_shift_brief(uuid) TO authenticated;
