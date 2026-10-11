-- ============================================================
-- ATT-A3 · Projection + Correction + Immutable Audit Events
-- 依据: ATTENDANCE CONTRACT + Amendment 1（八态/correction/events）
--
-- A3-1 attendance_projection(text)：八态 server 投影
--    absent/missing_clock_out 为班次结束后的派生事实（查询时计算，不落新行）
-- A3-2 attendance_correct(...)：管理者修正（store_manager/tenant_admin + scope）；
--    仅可改 clock_in_at/clock_out_at；reason 必填；同事务追加不可变 event
-- attendance_events 表：不可变审计事件（INSERT only）
-- ============================================================

GRANT scheduling_authority_owner TO postgres;
GRANT CREATE ON SCHEMA public TO scheduling_authority_owner;
GRANT CREATE ON SCHEMA private TO scheduling_authority_owner;
GRANT SELECT, INSERT, UPDATE ON public.work_attendance TO scheduling_authority_owner;

-- ---------- attendance_events（不可变审计） ----------
CREATE TABLE IF NOT EXISTS public.attendance_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id   uuid        NOT NULL REFERENCES public.work_attendance (id) ON DELETE CASCADE,
  event_type      text        NOT NULL,
  actor           uuid        NOT NULL,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  old_clock_in_at    timestamptz,
  old_clock_out_at   timestamptz,
  new_clock_in_at    timestamptz,
  new_clock_out_at   timestamptz,
  reason          text        NOT NULL
);

ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS att_evt_select_own ON public.attendance_events;
CREATE POLICY att_evt_select_own ON public.attendance_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.work_attendance a
     WHERE a.id = attendance_events.attendance_id
       AND a.employee_id IN (SELECT private.att_my_employee_ids(auth.uid()))
  ));

DROP POLICY IF EXISTS att_evt_select_managed ON public.attendance_events;
CREATE POLICY att_evt_select_managed ON public.attendance_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.work_attendance a
     WHERE a.id = attendance_events.attendance_id
       AND private.sched_is_store_manager(auth.uid())
       AND a.store_id IN (SELECT private.sched_my_managed_store_ids(auth.uid()))
  ));

DROP POLICY IF EXISTS att_evt_select_tenant ON public.attendance_events;
CREATE POLICY att_evt_select_tenant ON public.attendance_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.work_attendance a
     WHERE a.id = attendance_events.attendance_id
       AND private.sched_is_tenant_admin(auth.uid())
       AND a.tenant_id = public.get_user_tenant_id(auth.uid())
  ));

REVOKE SELECT ON public.attendance_events FROM anon;

GRANT SELECT, INSERT ON public.attendance_events TO scheduling_authority_owner;

-- ---------- A3-1 八态投影 ----------
CREATE OR REPLACE FUNCTION private.attendance_projection(a public.work_attendance)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT CASE
    WHEN a.clock_in_at IS NULL AND now() < a.planned_start_at THEN 'not_started'
    WHEN a.clock_in_at IS NOT NULL AND a.clock_out_at IS NULL AND now() < a.planned_end_at THEN 'in_progress'
    WHEN a.clock_in_at IS NULL AND now() >= a.planned_start_at THEN 'absent'
    WHEN a.clock_in_at IS NOT NULL AND a.clock_out_at IS NULL AND now() >= a.planned_end_at THEN 'missing_clock_out'
    WHEN a.late_minutes > 0 AND a.early_leave_minutes > 0 THEN 'late_early_leave'
    WHEN a.late_minutes > 0 THEN 'late'
    WHEN a.early_leave_minutes > 0 THEN 'early_leave'
    ELSE 'normal'
  END
$$;

ALTER FUNCTION private.attendance_projection(public.work_attendance) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION private.attendance_projection(public.work_attendance) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.attendance_projection(public.work_attendance) FROM anon;

-- 员工自读投影（含历史；走 attendance RLS）
CREATE OR REPLACE FUNCTION public.get_my_attendance(
  p_start_date date DEFAULT NULL,
  p_end_date   date DEFAULT NULL
)
RETURNS TABLE (id uuid, schedule_id uuid, business_date date,
              planned_start_at timestamptz, planned_end_at timestamptz,
              clock_in_at timestamptz, clock_out_at timestamptz,
              late_minutes int, early_leave_minutes int, work_hours numeric,
              projection text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;
  RETURN QUERY
  SELECT a.id, a.schedule_id, a.business_date,
         a.planned_start_at, a.planned_end_at,
         a.clock_in_at, a.clock_out_at,
         a.late_minutes, a.early_leave_minutes, a.work_hours,
         private.attendance_projection(a)
    FROM public.work_attendance a
   WHERE a.employee_id IN (SELECT private.att_my_employee_ids(v_uid))
     AND (p_start_date IS NULL OR a.business_date >= p_start_date)
     AND (p_end_date IS NULL OR a.business_date <= p_end_date)
   ORDER BY a.business_date DESC, a.planned_start_at;
END
$$;

ALTER FUNCTION public.get_my_attendance(date, date) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.get_my_attendance(date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_attendance(date, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_attendance(date, date) TO authenticated;

-- 管理者门店日投影
CREATE OR REPLACE FUNCTION public.get_store_attendance(
  p_store_id uuid,
  p_date date
)
RETURNS TABLE (id uuid, employee_name text, business_date date,
              planned_start_at timestamptz, planned_end_at timestamptz,
              clock_in_at timestamptz, clock_out_at timestamptz,
              late_minutes int, early_leave_minutes int, work_hours numeric,
              projection text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;
  RETURN QUERY
  SELECT a.id, e.name, a.business_date,
         a.planned_start_at, a.planned_end_at,
         a.clock_in_at, a.clock_out_at,
         a.late_minutes, a.early_leave_minutes, a.work_hours,
         private.attendance_projection(a)
    FROM public.work_attendance a
    JOIN public.employees e ON e.id = a.employee_id
   WHERE a.store_id = p_store_id AND a.business_date = p_date
     AND ((private.sched_is_tenant_admin(v_uid) AND a.tenant_id = public.get_user_tenant_id(v_uid))
          OR (private.sched_is_store_manager(v_uid) AND a.store_id IN (SELECT private.sched_my_managed_store_ids(v_uid))))
   ORDER BY a.planned_start_at;
END
$$;

ALTER FUNCTION public.get_store_attendance(uuid, date) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.get_store_attendance(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_store_attendance(uuid, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_store_attendance(uuid, date) TO authenticated;

-- ---------- A3-2 attendance_correct ----------
CREATE OR REPLACE FUNCTION public.attendance_correct(
  p_attendance_id uuid,
  p_clock_in_at  timestamptz DEFAULT NULL,
  p_clock_out_at timestamptz DEFAULT NULL,
  p_reason       text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  a record;
  v_late int;
  v_early int;
  v_hours numeric;
  v_touched boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'INVALID: 修正必须填写 reason';
  END IF;

  SELECT * INTO a FROM public.work_attendance WHERE id = p_attendance_id FOR UPDATE;
  IF a IS NULL THEN
    RAISE EXCEPTION 'INVALID: 考勤事实不存在';
  END IF;

  IF NOT private.sched_can_write_store(v_uid, a.tenant_id, a.store_id) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 无该门店考勤修正权限';
  END IF;

  IF p_clock_in_at IS NOT NULL AND (a.clock_in_at IS NULL OR p_clock_in_at <> a.clock_in_at) THEN
    v_touched := true;
  END IF;
  IF p_clock_out_at IS NOT NULL AND (a.clock_out_at IS NULL OR p_clock_out_at <> a.clock_out_at) THEN
    v_touched := true;
  END IF;
  IF NOT v_touched THEN
    RAISE EXCEPTION 'INVALID: 未提供任何修改';
  END IF;

  v_late := CASE WHEN p_clock_in_at IS NOT NULL
             THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (p_clock_in_at - a.planned_start_at)) / 60.0))::int
             ELSE a.late_minutes END;
  v_early := CASE WHEN p_clock_out_at IS NOT NULL
              THEN GREATEST(0, CEIL(EXTRACT(EPOCH FROM (a.planned_end_at - p_clock_out_at)) / 60.0))::int
              ELSE a.early_leave_minutes END;
  v_hours := CASE WHEN p_clock_in_at IS NOT NULL AND p_clock_out_at IS NOT NULL
              THEN ROUND((EXTRACT(EPOCH FROM (p_clock_out_at - p_clock_in_at)) / 3600.0)::numeric, 2)
              WHEN p_clock_out_at IS NOT NULL AND a.clock_in_at IS NOT NULL
              THEN ROUND((EXTRACT(EPOCH FROM (p_clock_out_at - a.clock_in_at)) / 3600.0)::numeric, 2)
              ELSE a.work_hours END;

  UPDATE public.work_attendance SET
    clock_in_at = COALESCE(p_clock_in_at, clock_in_at),
    clock_out_at = COALESCE(p_clock_out_at, clock_out_at),
    late_minutes = v_late,
    early_leave_minutes = v_early,
    work_hours = v_hours,
    corrected_by = v_uid,
    corrected_reason = btrim(p_reason),
    updated_at = now()
  WHERE id = p_attendance_id;

  INSERT INTO public.attendance_events
    (attendance_id, event_type, actor,
     old_clock_in_at, old_clock_out_at,
     new_clock_in_at, new_clock_out_at, reason)
  VALUES
    (p_attendance_id, 'corrected', v_uid,
     a.clock_in_at, a.clock_out_at,
     COALESCE(p_clock_in_at, a.clock_in_at), COALESCE(p_clock_out_at, a.clock_out_at),
     btrim(p_reason));

  RETURN jsonb_build_object('ok', true,
                            'late_minutes', v_late,
                            'early_leave_minutes', v_early,
                            'work_hours', v_hours);
END
$$;

ALTER FUNCTION public.attendance_correct(uuid, timestamptz, timestamptz, text) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.attendance_correct(uuid, timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attendance_correct(uuid, timestamptz, timestamptz, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.attendance_correct(uuid, timestamptz, timestamptz, text) TO authenticated;

REVOKE CREATE ON SCHEMA public FROM scheduling_authority_owner;
REVOKE CREATE ON SCHEMA private FROM scheduling_authority_owner;
