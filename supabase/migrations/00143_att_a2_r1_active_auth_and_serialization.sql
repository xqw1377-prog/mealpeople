-- ============================================================
-- ATT-A2-R1 · Active Authority + First-Clock-In Serialization
-- 依据: ATT-A2 = HOLD-R1 裁定（两 blocker）
--
-- R1-1 新考勤开始要求 active employment：
--      attendance_clock_in 的 ownership 检查
--      att_my_employee_ids（含 inactive，历史 SELECT 用）
--      → sched_my_employee_ids（active only）
--      attendance_clock_out 保持 ownership helper（完成已开始的考勤不因离职受阻）
--
-- R1-2 首次 clock-in 串行化：
--      schedule 获取改为 SELECT ... FOR UPDATE（与排班域 update/cancel/swap
--      同一行级互斥），在 row lock 内重新验证后再 advisory lock → INSERT，
--      消灭 snapshot 与 schedule 变更之间的 TOCTOU 窗口。
--      保留 schedule_id advisory lock + UNIQUE(schedule_id) 双保险。
-- ============================================================

GRANT scheduling_authority_owner TO postgres;
GRANT CREATE ON SCHEMA public TO scheduling_authority_owner;

-- ---------- R1-1 + R1-2: attendance_clock_in ----------
CREATE OR REPLACE FUNCTION public.attendance_clock_in(
  p_schedule_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  s record;
  v_tz text;
  v_planned_start timestamptz;
  v_planned_end timestamptz;
  v_att_id uuid;
  v_late int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  -- R1-2：行级锁下读取 schedule（与 update/cancel/swap 同互斥）；
  -- 拿到锁后读到的一定是当前已提交的最新事实
  SELECT * INTO s FROM public.schedules WHERE id = p_schedule_id FOR UPDATE;
  IF s IS NULL OR s.status <> 'published' THEN
    RAISE EXCEPTION 'INVALID: 班次不存在或非 published（cancelled/legacy 不可打卡）';
  END IF;
  IF COALESCE(s.is_day_off, false) THEN
    RAISE EXCEPTION 'INVALID: 排休班次不产生考勤事实';
  END IF;
  -- R1-1：开始新考勤要求 active employment（完成已开始的考勤见 clock_out）
  IF s.employee_id NOT IN (SELECT private.sched_my_employee_ids(v_uid)) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 只能对自己的在职班次打卡';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_schedule_id::text, 0));

  IF EXISTS (SELECT 1 FROM public.work_attendance a WHERE a.schedule_id = p_schedule_id) THEN
    RAISE EXCEPTION 'INVALID: 该班次已有考勤事实（UNIQUE(schedule_id) 前置检查）';
  END IF;

  SELECT timezone INTO v_tz FROM public.stores WHERE id = s.store_id;
  IF v_tz IS NULL OR v_tz = '' THEN
    v_tz := 'Asia/Shanghai';
  END IF;
  v_planned_start := ((s.schedule_date::text || ' ' || s.start_time::text) :: timestamp AT TIME ZONE v_tz);
  v_planned_end   := ((s.schedule_date::text || ' ' || s.end_time::text) :: timestamp AT TIME ZONE v_tz)
                     + CASE WHEN s.end_time <= s.start_time THEN interval '1 day' ELSE interval '0' END;

  v_late := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (now() - v_planned_start)) / 60.0))::int;

  INSERT INTO public.work_attendance
    (schedule_id, tenant_id, store_id, employee_id, business_date,
     planned_start_at, planned_end_at, clock_in_at, late_minutes)
  VALUES
    (s.id, s.tenant_id, s.store_id, s.employee_id, s.schedule_date,
     v_planned_start, v_planned_end, now(), v_late)
  RETURNING id INTO v_att_id;

  RETURN jsonb_build_object('ok', true, 'attendance_id', v_att_id,
                            'late_minutes', v_late,
                            'planned_start', v_planned_start,
                            'planned_end', v_planned_end);
END
$$;

-- ---------- R1-2: attendance_clock_out（同样行锁化 schedule 读取） ----------
CREATE OR REPLACE FUNCTION public.attendance_clock_out(
  p_schedule_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_uid uuid := NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'sub';
  s record;
  a record;
  v_early int;
  v_hours numeric;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_DENIED: 未认证';
  END IF;

  SELECT * INTO s FROM public.schedules WHERE id = p_schedule_id FOR UPDATE;
  IF s IS NULL OR s.status <> 'published' THEN
    RAISE EXCEPTION 'INVALID: 班次不存在或非 published';
  END IF;
  -- 裁定：完成已开始的考勤 = ownership 即可（班中被停用不应卡死下班卡）
  IF s.employee_id NOT IN (SELECT private.att_my_employee_ids(v_uid)) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 只能对自己的班次打卡';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_schedule_id::text, 0));

  SELECT * INTO a FROM public.work_attendance WHERE schedule_id = p_schedule_id FOR UPDATE;
  IF a IS NULL THEN
    RAISE EXCEPTION 'INVALID: 尚未打上班卡（考勤事实不存在）';
  END IF;
  IF a.clock_in_at IS NULL THEN
    RAISE EXCEPTION 'INVALID: 考勤事实缺少上班时间';
  END IF;
  IF a.clock_out_at IS NOT NULL THEN
    RAISE EXCEPTION 'INVALID: 已打过下班卡（duplicate clock-out）';
  END IF;

  v_early := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (a.planned_end_at - now())) / 60.0))::int;
  v_hours := ROUND((EXTRACT(EPOCH FROM (now() - a.clock_in_at)) / 3600.0)::numeric, 2);

  UPDATE public.work_attendance
     SET clock_out_at = now(),
         early_leave_minutes = v_early,
         work_hours = v_hours,
         updated_at = now()
   WHERE id = a.id;

  RETURN jsonb_build_object('ok', true,
                            'early_leave_minutes', v_early,
                            'work_hours', v_hours,
                            'clock_out_at', now());
END
$$;

ALTER FUNCTION public.attendance_clock_in(uuid) OWNER TO scheduling_authority_owner;
ALTER FUNCTION public.attendance_clock_out(uuid) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.attendance_clock_in(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attendance_clock_in(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.attendance_clock_out(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attendance_clock_out(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.attendance_clock_in(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attendance_clock_out(uuid) TO authenticated;

REVOKE CREATE ON SCHEMA public FROM scheduling_authority_owner;
