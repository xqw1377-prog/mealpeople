-- ============================================================
-- ATT-A1 · Attendance Data Foundation
-- 依据: ATTENDANCE AUTHORITY CONTRACT v0.1 + Amendment 1（FROZEN）
--   A1-1 stores.timezone NOT NULL DEFAULT Asia/Shanghai（存量回填 + IANA 校验）
--   A1-2 work_attendance identity：UNIQUE(schedule_id)，废 UNIQUE(employee_id,date)
--   A1-3 planned snapshot 列（server-derived / immutable，A2 command 填充）
--   A1-4 RLS baseline：SELECT own/managed/tenant；authenticated 直写全 DENY
--   A1-5 schedule freeze guard：attendance 存在 ⇒ 语义字段 UPDATE DENY（DB 层）
-- 纪律：本批不创建任何 attendance command（A2/A3）；无 legacy 兼容层（表 0 行）
-- ============================================================

-- ---------- A1-1 stores.timezone ----------
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS timezone text;

UPDATE public.stores SET timezone = 'Asia/Shanghai' WHERE timezone IS NULL;

ALTER TABLE public.stores ALTER COLUMN timezone SET NOT NULL;
ALTER TABLE public.stores ALTER COLUMN timezone SET DEFAULT 'Asia/Shanghai';

-- 仅接受有效 IANA 时区（DB 层校验；now() AT TIME ZONE tz 验证真实可用性）
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_timezone_valid;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_timezone_valid
  CHECK ((now() AT TIME ZONE timezone) IS NOT NULL);

-- ---------- A1-2/A1-3 work_attendance identity + planned snapshot ----------
-- 表 0 行：直接重建为合同语义，不留双模型过渡
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
  -- server-derived 偏差与工时（A2/A3 服务端计算，客户端不得提交）
  late_minutes         integer     NOT NULL DEFAULT 0,
  early_leave_minutes  integer     NOT NULL DEFAULT 0,
  work_hours           numeric,
  -- 修正审计锚（A3 attendance_events FK；本批建表不建命令）
  corrected_by         uuid,
  corrected_reason     text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- 合同不变量（DB 层兜底）
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

ALTER TABLE public.work_attendance ENABLE ROW LEVEL SECURITY;

-- 关系完整性：attendance 必须指向真实 published 事实（复合 FK，参照排班域同款）
-- 复合 UNIQUE(id,tenant)/(id,tenant,store) 已由 00125 建立（schedules FK 在用），直接引用
ALTER TABLE public.work_attendance
  ADD CONSTRAINT work_attendance_schedule_fkey
  FOREIGN KEY (schedule_id) REFERENCES public.schedules (id) ON DELETE CASCADE,
  ADD CONSTRAINT work_attendance_store_fkey
  FOREIGN KEY (store_id, tenant_id) REFERENCES public.stores (id, tenant_id),
  ADD CONSTRAINT work_attendance_employee_fkey
  FOREIGN KEY (employee_id, tenant_id, store_id)
  REFERENCES public.employees (id, tenant_id, store_id);

-- ---------- A1-4 RLS baseline（Amendment A3 权威矩阵） ----------
-- 复用排班域 private helpers（同 owner/ACL 纪律；attendance 专用 owner 一并建权）
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

-- SELECT：employee 自己（含 inactive 时期历史）；store_manager 所管店；tenant_admin 本租户
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

-- 直写全封死：不设任何 INSERT/UPDATE/DELETE policy（A2/A3 command 走 definer）
-- GraphQL 暴露面收口（Advisor WARN 处置）：anon 不可 SELECT
REVOKE SELECT ON public.work_attendance FROM anon;

-- A4 immutable 兜底：即便未来误加 UPDATE policy / service 误用，
-- DB trigger 拒绝修改 identity + planned snapshot（correction 也不可改）
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

-- trigger guard 函数：postgres owner（表 trigger 调用，不对外暴露）
REVOKE ALL ON FUNCTION public.att_guard_immutable_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.att_guard_immutable_snapshot() FROM anon;

CREATE TRIGGER trg_att_immutable_snapshot
  BEFORE UPDATE ON public.work_attendance
  FOR EACH ROW EXECUTE FUNCTION public.att_guard_immutable_snapshot();

-- ---------- A1-5 schedule freeze guard（合同 A5，DB 层最后防线） ----------
-- 存在 attendance(schedule_id=S) ⇒ S 的考勤语义字段 UPDATE 一律 DENY（含 service 角色）
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

-- trigger guard 函数：postgres owner（表 trigger 调用，不对外暴露）
REVOKE ALL ON FUNCTION public.att_guard_schedule_freeze() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.att_guard_schedule_freeze() FROM anon;

CREATE TRIGGER trg_att_schedule_freeze
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.att_guard_schedule_freeze();

REVOKE CREATE ON SCHEMA private FROM scheduling_authority_owner;
REVOKE CREATE ON SCHEMA public FROM scheduling_authority_owner;

         AND (now() AT TIME ZONE timezone) IS NOT NULL);

-- ---------- A1-2/A1-3 work_attendance identity + planned snapshot ----------
-- 表 0 行：直接重建为合同语义，不留双模型过渡
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
  -- server-derived 偏差与工时（A2/A3 服务端计算，客户端不得提交）
  late_minutes         integer     NOT NULL DEFAULT 0,
  early_leave_minutes  integer     NOT NULL DEFAULT 0,
  work_hours           numeric,
  -- 修正审计锚（A3 attendance_events FK；本批建表不建命令）
  corrected_by         uuid,
  corrected_reason     text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- 合同不变量（DB 层兜底）
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

ALTER TABLE public.work_attendance ENABLE ROW LEVEL SECURITY;

-- 关系完整性：attendance 必须指向真实 published 事实（复合 FK，参照排班域同款）
ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_id_tenant_key;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_id_tenant_key UNIQUE (id, tenant_id);

ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_id_tenant_store_key;
ALTER TABLE public.employees
  ADD CONSTRAINT employees_id_tenant_store_key UNIQUE (id, tenant_id, store_id);

ALTER TABLE public.work_attendance
  ADD CONSTRAINT work_attendance_schedule_fkey
  FOREIGN KEY (schedule_id) REFERENCES public.schedules (id) ON DELETE CASCADE,
  ADD CONSTRAINT work_attendance_store_fkey
  FOREIGN KEY (store_id, tenant_id) REFERENCES public.stores (id, tenant_id),
  ADD CONSTRAINT work_attendance_employee_fkey
  FOREIGN KEY (employee_id, tenant_id, store_id)
  REFERENCES public.employees (id, tenant_id, store_id);

-- ---------- A1-4 RLS baseline（Amendment A3 权威矩阵） ----------
-- 复用排班域 private helpers（同 owner/ACL 纪律；attendance 专用 owner 一并建权）
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

-- SELECT：employee 自己（含 inactive 时期历史）；store_manager 所管店；tenant_admin 本租户
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

-- 直写全封死：不设任何 INSERT/UPDATE/DELETE policy（A2/A3 command 走 definer）

-- A4 immutable 兜底：即便未来误加 UPDATE policy / service 误用，
-- DB trigger 拒绝修改 identity + planned snapshot（correction 也不可改）
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

-- trigger guard 函数：postgres owner（表 trigger 调用，不对外暴露）
REVOKE ALL ON FUNCTION public.att_guard_immutable_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.att_guard_immutable_snapshot() FROM anon;

CREATE TRIGGER trg_att_immutable_snapshot
  BEFORE UPDATE ON public.work_attendance
  FOR EACH ROW EXECUTE FUNCTION public.att_guard_immutable_snapshot();

-- ---------- A1-5 schedule freeze guard（合同 A5，DB 层最后防线） ----------
-- 存在 attendance(schedule_id=S) ⇒ S 的考勤语义字段 UPDATE 一律 DENY（含 service 角色）
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

-- trigger guard 函数：postgres owner（表 trigger 调用，不对外暴露）
REVOKE ALL ON FUNCTION public.att_guard_schedule_freeze() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.att_guard_schedule_freeze() FROM anon;

CREATE TRIGGER trg_att_schedule_freeze
  BEFORE UPDATE ON public.schedules
  FOR EACH ROW EXECUTE FUNCTION public.att_guard_schedule_freeze();

REVOKE CREATE ON SCHEMA private FROM scheduling_authority_owner;
REVOKE CREATE ON SCHEMA public FROM scheduling_authority_owner;
