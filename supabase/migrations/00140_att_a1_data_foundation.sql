-- ============================================================
-- ATT-A1 · Attendance Data Foundation（canonical baseline）
-- 依据: ATTENDANCE AUTHORITY CONTRACT v0.1 + Amendment 1（FROZEN）
--
-- A1-1 stores.timezone NOT NULL DEFAULT Asia/Shanghai（存量回填 + IANA 校验）
-- A1-2 work_attendance identity：UNIQUE(schedule_id)（表原 0 行，直接按合同重建）
-- A1-3 planned snapshot 列 + 语义约束 + 复合关系完整性
-- A1-4 RLS baseline：SELECT own/managed/tenant；写 policy 为零；anon 收口
-- A1-5 schedule freeze guard + attendance immutable snapshot（表级 trigger）
--
-- 注意：本文件是可重放的 canonical 版本（live 于 2026-10-07 经 00140 原版
-- 分段应用 + 00141 hardening 达到相同终态；本文件已按最终形态整理，
-- 不应再对 live 重跑，仅作为 baseline 记录与环境重建之用）。
--
-- guard trigger 函数 ACL = DB internal（全角色 EXECUTE false，00141 定稿）。
-- schedule FK = ON DELETE RESTRICT（00141 定稿）。
-- ============================================================

-- ---------- A1-1 stores.timezone ----------
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS timezone text;
UPDATE public.stores SET timezone = 'Asia/Shanghai' WHERE timezone IS NULL;
ALTER TABLE public.stores ALTER COLUMN timezone SET NOT NULL;
ALTER TABLE public.stores ALTER COLUMN timezone SET DEFAULT 'Asia/Shanghai';

-- IANA 校验：格式正则 + AT TIME ZONE 真伪（无效时区使 cast 抛错 → 违反约束）
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_timezone_valid;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_timezone_valid
  CHECK (timezone ~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+)+$'
         AND (now() AT TIME ZONE timezone) IS NOT NULL);

-- ---------- A1-2/A1-3 work_attendance（合同语义重建；复合 UNIQUE 引用 00125 既有定义） ----------
DROP TABLE IF EXISTS public.work_attendance CASCADE;

CREATE TABLE public.work_attendance (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- identity + planned snapshot（A2 command 服务端派生；A4 immutable）
  schedule_id          uuid        NOT NULL,
  tenant_id            uuid        NOT NULL,
  store_id             uuid        NOT NULL,
  employee_id          uuid        NOT NULL,
  business_date        date        NOT NULL,   -- = schedules.schedule_date
  planned_start_at     timestamptz NOT NULL,   -- 门店时区绝对时刻
  planned_end_at       timestamptz NOT NULL,
  -- actual facts（A2 command server-time 写入；A3 correction 仅可改这两列）
  clock_in_at          timestamptz,
  clock_out_at         timestamptz,
  -- server-derived 偏差与工时（客户端不得提交）
  late_minutes         integer     NOT NULL DEFAULT 0,
  early_leave_minutes  integer     NOT NULL DEFAULT 0,
  work_hours           numeric,
  -- 修正审计锚（A3）
  corrected_by         uuid,
  corrected_reason     text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT work_attendance_schedule_id_key UNIQUE (schedule_id),
  CONSTRAINT work_attendance_snapshot_sane
    CHECK (planned_end_at > planned_start_at),
  CONSTRAINT work_attendance_clock_sane
    CHECK (clock_out_at IS NULL OR clock_in_at IS NULL OR clock_out_at > clock_in_at)
);

CREATE INDEX idx_work_attendance_employee ON public.work_attendance (employee_id);
CREATE INDEX idx_work_attendance_business_date ON public.work_attendance (business_date);
CREATE INDEX idx_work_attendance_store ON public.work_attendance (store_id);
CREATE INDEX idx_work_attendance_tenant ON public.work_attendance (tenant_id);

-- 关系完整性：stores(id,tenant) / employees(id,tenant,store) 复合 UNIQUE 由 00125 建立
ALTER TABLE public.work_attendance
  ADD CONSTRAINT work_attendance_schedule_fkey
  FOREIGN KEY (schedule_id) REFERENCES public.schedules (id) ON DELETE RESTRICT,
  ADD CONSTRAINT work_attendance_store_fkey
  FOREIGN KEY (store_id, tenant_id) REFERENCES public.stores (id, tenant_id),
  ADD CONSTRAINT work_attendance_employee_fkey
  FOREIGN KEY (employee_id, tenant_id, store_id)
  REFERENCES public.employees (id, tenant_id, store_id);

-- updated_at 维护（通用函数）
CREATE TRIGGER update_work_attendance_updated_at
  BEFORE UPDATE ON public.work_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.work_attendance ENABLE ROW LEVEL SECURITY;

-- ---------- A1-4 RLS baseline ----------
GRANT scheduling_authority_owner TO postgres;
GRANT CREATE ON SCHEMA private TO scheduling_authority_owner;

CREATE OR REPLACE FUNCTION private.att_my_employee_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT e.id FROM public.employees e WHERE e.user_id = uid
$$;

ALTER FUNCTION private.att_my_employee_ids(uuid) OWNER TO scheduling_authority_owner;
REVOKE ALL ON FUNCTION private.att_my_employee_ids(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.att_my_employee_ids(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.att_my_employee_ids(uuid) TO authenticated;

CREATE POLICY att_select_own ON public.work_attendance
  FOR SELECT TO authenticated
  USING (employee_id IN (SELECT private.att_my_employee_ids(auth.uid())));

CREATE POLICY att_select_managed_stores ON public.work_attendance
  FOR SELECT TO authenticated
  USING (
    private.sched_is_store_manager(auth.uid())
    AND store_id IN (SELECT private.sched_my_managed_store_ids(auth.uid()))
  );

CREATE POLICY att_select_own_tenant_admin ON public.work_attendance
  FOR SELECT TO authenticated
  USING (
    private.sched_is_tenant_admin(auth.uid())
    AND tenant_id = public.get_user_tenant_id(auth.uid())
  );

-- 写路径：零 INSERT/UPDATE/DELETE policy（A2/A3 command 走 definer）
-- GraphQL 暴露面收口
REVOKE SELECT ON public.work_attendance FROM anon;

-- ---------- A4 immutable snapshot trigger ----------
CREATE OR REPLACE FUNCTION public.att_guard_immutable_snapshot()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF NEW.schedule_id      IS DISTINCT FROM OLD.schedule_id
  OR NEW.tenant_id        IS DISTINCT FROM OLD.tenant_id
  OR NEW.store_id         IS DISTINCT FROM OLD.store_id
  OR NEW.employee_id      IS DISTINCT FROM OLD.employee_id
  OR NEW.business_date    IS DISTINCT FROM OLD.business_date
  OR NEW.planned_start_at IS DISTINCT FROM OLD.planned_start_at
  OR NEW.planned_end_at   IS DISTINCT FROM OLD.planned_end_at THEN
    RAISE EXCEPTION 'IMMUTABLE: attendance identity/planned snapshot 不可修改（合同 A4）';
  END IF;
  RETURN NEW;
END
$$;

-- trigger 函数 = DB internal：全角色 EXECUTE 撤销（00141 定稿，此处为 canonical 记录）
REVOKE ALL ON FUNCTION public.att_guard_immutable_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.att_guard_immutable_snapshot() FROM anon;
REVOKE ALL ON FUNCTION public.att_guard_immutable_snapshot() FROM authenticated;
REVOKE ALL ON FUNCTION public.att_guard_immutable_snapshot() FROM service_role;

CREATE TRIGGER trg_att_immutable_snapshot
  BEFORE UPDATE ON public.work_attendance
  FOR EACH ROW EXECUTE FUNCTION public.att_guard_immutable_snapshot();

-- ---------- A1-5 schedule freeze guard ----------
CREATE OR REPLACE FUNCTION public.att_guard_schedule_freeze()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.work_attendance a WHERE a.schedule_id = OLD.id) THEN
    IF NEW.tenant_id     IS DISTINCT FROM OLD.tenant_id
    OR NEW.store_id      IS DISTINCT FROM OLD.store_id
    OR NEW.employee_id   IS DISTINCT FROM OLD.employee_id
    OR NEW.schedule_date IS DISTINCT FROM OLD.schedule_date
    OR NEW.start_time    IS DISTINCT FROM OLD.start_time
    OR NEW.end_time      IS DISTINCT FROM OLD.end_time
    OR NEW.is_day_off    IS DISTINCT FROM OLD.is_day_off
    OR NEW.status        IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'FROZEN: 该班次已开始考勤，考勤语义字段不可修改（合同 A5；notes 可改）';
    END IF;
  END IF;
  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION public.att_guard_schedule_freeze() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.att_guard_schedule_freeze() FROM anon;
REVOKE ALL ON FUNCTION public.att_guard_schedule_freeze() FROM authenticated;
REVOKE ALL ON FUNCTION public.att_guard_schedule_freeze() FROM service_role;

CREATE TRIGGER trg_att_schedule_freeze
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.att_guard_schedule_freeze();

REVOKE CREATE ON SCHEMA private FROM scheduling_authority_owner;
REVOKE CREATE ON SCHEMA public FROM scheduling_authority_owner;
