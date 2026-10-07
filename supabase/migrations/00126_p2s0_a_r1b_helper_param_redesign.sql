-- ============================================================
-- P2-S0-A-R1b · helper 参数化重设计
-- 背景：auth schema 归 supabase_admin，postgres 无 GRANT OPTION，
--       无法授权 definer owner 访问 auth（00125 实测）。
-- 方案：auth.uid() 由 policy 层（authenticated 有 auth USAGE）求值后作参数传入；
--       definer 函数体不再触碰 auth schema —— 消除该依赖而非申请权限。
-- 同时：零参旧版（private.sched_*()）删除，避免双版本漂移。
-- ============================================================

-- 新签名（uid 参数；STABLE / SECURITY DEFINER / 固定 search_path 不变）
CREATE OR REPLACE FUNCTION private.sched_my_employee_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT e.id FROM public.employees e
   WHERE e.user_id = uid AND e.status = 'active'
$$;

CREATE OR REPLACE FUNCTION private.sched_my_managed_store_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT s.id FROM public.stores s
   WHERE s.manager_id = uid
     AND s.tenant_id = public.get_user_tenant_id(uid)
$$;

CREATE OR REPLACE FUNCTION private.sched_is_store_manager(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = uid AND p.role = 'store_manager'
  )
$$;

CREATE OR REPLACE FUNCTION private.sched_is_tenant_admin(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = uid AND p.role = 'tenant_admin' AND p.tenant_id IS NOT NULL
  )
$$;

-- owner 与 ACL 与 00125 同纪律
GRANT scheduling_authority_owner TO postgres;

ALTER FUNCTION private.sched_my_employee_ids(uuid) OWNER TO scheduling_authority_owner;
ALTER FUNCTION private.sched_my_managed_store_ids(uuid) OWNER TO scheduling_authority_owner;
ALTER FUNCTION private.sched_is_store_manager(uuid) OWNER TO scheduling_authority_owner;
ALTER FUNCTION private.sched_is_tenant_admin(uuid) OWNER TO scheduling_authority_owner;

REVOKE ALL ON FUNCTION private.sched_my_employee_ids(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_my_managed_store_ids(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_is_store_manager(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_is_tenant_admin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.sched_my_employee_ids(uuid) FROM anon;
REVOKE ALL ON FUNCTION private.sched_my_managed_store_ids(uuid) FROM anon;
REVOKE ALL ON FUNCTION private.sched_is_store_manager(uuid) FROM anon;
REVOKE ALL ON FUNCTION private.sched_is_tenant_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION private.sched_my_employee_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.sched_my_managed_store_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.sched_is_store_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.sched_is_tenant_admin(uuid) TO authenticated;

-- 策略重建：auth.uid() 在 policy 上下文求值（authenticated 原生可访问 auth schema）
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
  USING (status = 'published' AND employee_id IN (SELECT private.sched_my_employee_ids(auth.uid())));

CREATE POLICY schedules_select_managed_stores ON public.schedules
  FOR SELECT TO authenticated
  USING (private.sched_is_store_manager(auth.uid()) AND store_id IN (SELECT private.sched_my_managed_store_ids(auth.uid())));

CREATE POLICY schedules_select_own_tenant_admin ON public.schedules
  FOR SELECT TO authenticated
  USING (private.sched_is_tenant_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY schedules_select_super_admin ON public.schedules
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY schedules_insert_tenant_admin ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    private.sched_is_tenant_admin(auth.uid())
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND status = 'published'
  );

CREATE POLICY schedules_insert_store_manager ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    private.sched_is_store_manager(auth.uid())
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND store_id IN (SELECT private.sched_my_managed_store_ids(auth.uid()))
    AND status = 'published'
  );

CREATE POLICY schedules_insert_super_admin ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()) AND status = 'published');

CREATE POLICY schedules_update_tenant_admin ON public.schedules
  FOR UPDATE TO authenticated
  USING (private.sched_is_tenant_admin(auth.uid()) AND tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (
    private.sched_is_tenant_admin(auth.uid())
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND status IN ('published', 'cancelled')
  );

CREATE POLICY schedules_update_store_manager ON public.schedules
  FOR UPDATE TO authenticated
  USING (
    private.sched_is_store_manager(auth.uid())
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND store_id IN (SELECT private.sched_my_managed_store_ids(auth.uid()))
  )
  WITH CHECK (
    private.sched_is_store_manager(auth.uid())
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND store_id IN (SELECT private.sched_my_managed_store_ids(auth.uid()))
    AND status IN ('published', 'cancelled')
  );

CREATE POLICY schedules_update_super_admin ON public.schedules
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()) AND status IN ('published', 'cancelled'));

-- 删除零参旧版（含其 ACL）
DROP FUNCTION IF EXISTS private.sched_my_employee_ids();
DROP FUNCTION IF EXISTS private.sched_my_managed_store_ids();
DROP FUNCTION IF EXISTS private.sched_is_store_manager();
DROP FUNCTION IF EXISTS private.sched_is_tenant_admin();
