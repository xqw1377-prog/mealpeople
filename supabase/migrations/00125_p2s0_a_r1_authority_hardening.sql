-- ============================================================
-- P2-S0-A-R1 · Authority Hardening（只修裁定指出的两个 blocker）
--   R1-A Helper 收口：4 × sched_* 迁 private schema + 专用 NOLOGIN owner + ACL
--   R1-B 行关系完整性：复合 FK（NOT VALID）——新写入强制真实 tenant/store/employee 关系
-- 依据：P2-S0-A = HOLD-R1 裁定（2026-10-07）
-- 纪律：不动 Advisor 点名的其他历史函数；不动 shift_swap_requests；
--       不写 transactional commands；不整理 301 条 legacy（原样隔离）
-- ============================================================

-- ---------- R1-A · Helper 权限收口 ----------

CREATE SCHEMA IF NOT EXISTS private;

COMMENT ON SCHEMA private IS 'P2-S0: 非暴露 schema（不在 PostgREST db-schemas），仅内部函数';

-- 专用 owner：NOLOGIN + BYPASSRLS + 最小表权限
-- （profiles/employees/stores 三表 RLS 已启用；非表主的 SECURITY DEFINER 若无 BYPASSRLS
--   会被行级安全策略过滤致盲——NOLOGIN 角色仅拥有本组 4 个只读 helper，属最小必要授权）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'scheduling_authority_owner') THEN
    CREATE ROLE scheduling_authority_owner NOLOGIN BYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public, private TO scheduling_authority_owner;
-- 注意：auth schema 归 supabase_admin 所有，postgres 仅 USAGE 无 GRANT OPTION，
-- 无法为 definer owner 授权 auth USAGE —— 由 00126 改为参数化设计（definer 不触碰 auth schema）
GRANT SELECT ON public.profiles, public.employees, public.stores TO scheduling_authority_owner;

-- 4 个 helper 迁 private + 换 owner（范围仅 sched_*，其余历史函数不动）
ALTER FUNCTION public.sched_my_employee_ids() SET SCHEMA private;
ALTER FUNCTION public.sched_my_managed_store_ids() SET SCHEMA private;
ALTER FUNCTION public.sched_is_store_manager() SET SCHEMA private;
ALTER FUNCTION public.sched_is_tenant_admin() SET SCHEMA private;

-- ALTER OWNER 需要执行者 membership（平台 SQL 通道为 postgres）
GRANT scheduling_authority_owner TO postgres;
-- 接收方对目标 schema 需要 CREATE（所有权转移前置条件）
GRANT CREATE ON SCHEMA private TO scheduling_authority_owner;

ALTER FUNCTION private.sched_my_employee_ids() OWNER TO scheduling_authority_owner;
ALTER FUNCTION private.sched_my_managed_store_ids() OWNER TO scheduling_authority_owner;
ALTER FUNCTION private.sched_is_store_manager() OWNER TO scheduling_authority_owner;
ALTER FUNCTION private.sched_is_tenant_admin() OWNER TO scheduling_authority_owner;

-- ACL：PUBLIC/anon 全撤；authenticated 仅保留 RLS 策略执行所需
REVOKE ALL ON FUNCTION private.sched_my_employee_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_my_managed_store_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_is_store_manager() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_is_tenant_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_my_employee_ids() FROM anon;
REVOKE ALL ON FUNCTION private.sched_my_managed_store_ids() FROM anon;
REVOKE ALL ON FUNCTION private.sched_is_store_manager() FROM anon;
REVOKE ALL ON FUNCTION private.sched_is_tenant_admin() FROM anon;

GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.sched_my_employee_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION private.sched_my_managed_store_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION private.sched_is_store_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION private.sched_is_tenant_admin() TO authenticated;

-- 策略重建：引用 private. 限定名（原 public.sched_* 已迁移，旧引用失效）
DROP POLICY IF EXISTS schedules_select_own_published ON public.schedules;
DROP POLICY IF EXISTS schedules_select_managed_stores ON public.schedules;
DROP POLICY IF EXISTS schedules_select_own_tenant_admin ON public.schedules;
DROP POLICY IF EXISTS schedules_select_super_admin ON public.schedules;
DROP POLICY IF EXISTS schedules_insert_tenant_admin ON public.schedules;
DROP POLICY IF EXISTS schedules_insert_store_manager ON public.schedules;
DROP POLICY IF EXISTS schedules_insert_super_admin ON public.schedules;
DROP POLICY IF EXISTS schedules_update_tenant_admin ON public.schedules;
DROP POLICY IF EXISTS schedules_update_store_manager ON public.schedules;
DROP POLICY IF EXISTS schedules_update_super_admin ON public.schedules;

CREATE POLICY schedules_select_own_published ON public.schedules
  FOR SELECT TO authenticated
  USING (status = 'published' AND employee_id IN (SELECT private.sched_my_employee_ids()));

CREATE POLICY schedules_select_managed_stores ON public.schedules
  FOR SELECT TO authenticated
  USING (private.sched_is_store_manager() AND store_id IN (SELECT private.sched_my_managed_store_ids()));

CREATE POLICY schedules_select_own_tenant_admin ON public.schedules
  FOR SELECT TO authenticated
  USING (private.sched_is_tenant_admin() AND tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY schedules_select_super_admin ON public.schedules
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY schedules_insert_tenant_admin ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    private.sched_is_tenant_admin()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND status = 'published'
  );

CREATE POLICY schedules_insert_store_manager ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    private.sched_is_store_manager()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND store_id IN (SELECT private.sched_my_managed_store_ids())
    AND status = 'published'
  );

CREATE POLICY schedules_insert_super_admin ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()) AND status = 'published');

CREATE POLICY schedules_update_tenant_admin ON public.schedules
  FOR UPDATE TO authenticated
  USING (private.sched_is_tenant_admin() AND tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (
    private.sched_is_tenant_admin()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND status IN ('published', 'cancelled')
  );

CREATE POLICY schedules_update_store_manager ON public.schedules
  FOR UPDATE TO authenticated
  USING (
    private.sched_is_store_manager()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND store_id IN (SELECT private.sched_my_managed_store_ids())
  )
  WITH CHECK (
    private.sched_is_store_manager()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND store_id IN (SELECT private.sched_my_managed_store_ids())
    AND status IN ('published', 'cancelled')
  );

CREATE POLICY schedules_update_super_admin ON public.schedules
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()) AND status IN ('published', 'cancelled'));

-- ---------- R1-B · 行关系完整性（复合 FK，NOT VALID） ----------
-- 语义：不再只信 tenant_id 字段标签——新写入的 store/employee 必须真实属于该 tenant
--       （store ↔ tenant / employee ↔ tenant+store 由数据库强制）
-- NOT VALID：现存 301 legacy（含 4 处 store↔tenant / 4 处 employee↔tenant 历史错配）
--       不扫描、不修复、不破坏，原样隔离；仅约束今后 INSERT/UPDATE 的新行

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stores_id_tenant_key' AND conrelid = 'public.stores'::regclass) THEN
    ALTER TABLE public.stores ADD CONSTRAINT stores_id_tenant_key UNIQUE (id, tenant_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_id_tenant_store_key' AND conrelid = 'public.employees'::regclass) THEN
    ALTER TABLE public.employees ADD CONSTRAINT employees_id_tenant_store_key UNIQUE (id, tenant_id, store_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_store_tenant_fkey' AND conrelid = 'public.schedules'::regclass) THEN
    ALTER TABLE public.schedules
      ADD CONSTRAINT schedules_store_tenant_fkey
      FOREIGN KEY (store_id, tenant_id) REFERENCES public.stores (id, tenant_id) NOT VALID;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'schedules_employee_tenant_store_fkey' AND conrelid = 'public.schedules'::regclass) THEN
    ALTER TABLE public.schedules
      ADD CONSTRAINT schedules_employee_tenant_store_fkey
      FOREIGN KEY (employee_id, tenant_id, store_id) REFERENCES public.employees (id, tenant_id, store_id) NOT VALID;
  END IF;
END
$$;
