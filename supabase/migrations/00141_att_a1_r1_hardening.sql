-- ============================================================
-- ATT-A1-R1 · live hardening（Blocker 1/2 处置）
--   R1-2a guard trigger 函数收口为 DB internal（全角色 EXECUTE = false，owner 保留）
--   R1-2b schedule FK：ON DELETE CASCADE → RESTRICT（已开考班物理删除 → DENY，
--        考勤事实不再被级联抹掉）
-- ============================================================

-- a) guard 函数 EXECUTE 收口
REVOKE EXECUTE ON FUNCTION public.att_guard_immutable_snapshot() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.att_guard_immutable_snapshot() FROM anon;
REVOKE EXECUTE ON FUNCTION public.att_guard_immutable_snapshot() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.att_guard_immutable_snapshot() FROM service_role;

REVOKE EXECUTE ON FUNCTION public.att_guard_schedule_freeze() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.att_guard_schedule_freeze() FROM anon;
REVOKE EXECUTE ON FUNCTION public.att_guard_schedule_freeze() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.att_guard_schedule_freeze() FROM service_role;

-- b) FK 语义修正：attendance 存在 ⇒ schedule 不可物理删除
ALTER TABLE public.work_attendance
  DROP CONSTRAINT work_attendance_schedule_fkey;
ALTER TABLE public.work_attendance
  ADD CONSTRAINT work_attendance_schedule_fkey
  FOREIGN KEY (schedule_id) REFERENCES public.schedules (id) ON DELETE RESTRICT;
