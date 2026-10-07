-- ============================================================
-- ATT-A2 · Command Authority: attendance_clock_in / attendance_clock_out
-- 依据: ATTENDANCE CONTRACT + Amendment 1 + A2 授权（2026-10-07）
--
-- 客户端仅传 schedule_id；identity/snapshot/时间/偏差全部服务端派生
-- 并发锁围绕 schedule_id（事实单位 = one published schedule → one attendance）
-- 身份取 request.jwt.claims GUC（与排班 command 同模式）
-- late_minutes 于 clock-in 计算；early_leave_minutes 于 clock-out 计算
-- 八态 projection / absent / missing_clock_out / correction = ATT-A3（不做）
-- ============================================================

GRANT scheduling_authority_owner TO postgres;
GRANT CREATE ON SCHEMA public TO scheduling_authority_owner;

-- command owner 表权限（A1 建表未预授；clock 命令需要读写 work_attendance）
GRANT SELECT, INSERT, UPDATE ON public.work_attendance TO scheduling_authority_owner;

-- ---------- attendance_clock_in(schedule_id) ----------
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

  SELECT * INTO s FROM public.schedules WHERE id = p_schedule_id;
  IF s IS NULL OR s.status <> 'published' THEN
    RAISE EXCEPTION 'INVALID: 班次不存在或非 published（cancelled/legacy 不可打卡）';
  END IF;
  IF COALESCE(s.is_day_off, false) THEN
    RAISE EXCEPTION 'INVALID: 排休班次不产生考勤事实';
  END IF;
  IF s.employee_id NOT IN (SELECT private.att_my_employee_ids(v_uid)) THEN
    RAISE EXCEPTION 'AUTH_DENIED: 只能对自己的班次打卡';
  END IF;

  -- 并发锁：围绕 schedule_id（同日多段班互不锁死）
  PERFORM pg_advisory_xact_lock(hashtextextended(p_schedule_id::text, 0));

  IF EXISTS (SELECT 1 FROM public.work_attendance a WHERE a.schedule_id = p_schedule_id) THEN
    RAISE EXCEPTION 'INVALID: 该班次已有考勤事实（UNIQUE(schedule_id) 前置检查）';
  END IF;

  -- planned snapshot：门店时区绝对时刻（跨午夜 end<=start +1 天）
  SELECT timezone INTO v_tz FROM public.stores WHERE id = s.store_id;
  IF v_tz IS NULL OR v_tz = '' THEN
    v_tz := 'Asia/Shanghai';
  END IF;
  v_planned_start := ((s.schedule_date::text || ' ' || s.start_time::text) :: timestamp AT TIME ZONE v_tz);
  v_planned_end   := ((s.schedule_date::text || ' ' || s.end_time::text) :: timestamp AT TIME ZONE v_tz)
                     + CASE WHEN s.end_time <= s.start_time THEN interval '1 day' ELSE interval '0' END;

  -- late_minutes = server now 超出 planned_start 的分钟数（班前打卡记 0）
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

ALTER FUNCTION public.attendance_clock_in(uuid) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.attendance_clock_in(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attendance_clock_in(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.attendance_clock_in(uuid) TO authenticated;

-- ---------- attendance_clock_out(schedule_id) ----------
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

  SELECT * INTO s FROM public.schedules WHERE id = p_schedule_id;
  IF s IS NULL OR s.status <> 'published' THEN
    RAISE EXCEPTION 'INVALID: 班次不存在或非 published';
  END IF;
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

  -- early_leave_minutes = planned_end 超出 server now 的分钟（晚于计划下班记 0）
  v_early := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (a.planned_end_at - now())) / 60.0))::int;

  -- work_hours 服务端推导（跨天自动为正）
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

ALTER FUNCTION public.attendance_clock_out(uuid) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION public.attendance_clock_out(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.attendance_clock_out(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.attendance_clock_out(uuid) TO authenticated;

REVOKE CREATE ON SCHEMA public FROM scheduling_authority_owner;
