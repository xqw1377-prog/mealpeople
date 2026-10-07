-- ============================================================
-- P2-S0-A · Scheduling Authority Baseline
-- 依据: SCHEDULING_AUTHORITY_CONTRACT v0.1 + AMENDMENT 1 (FROZEN)
--   S0-A1 Legacy Cutover   : 301 pending → legacy（唯一允许的批量状态迁移）
--   S0-A2 Status Contract  : DROP DEFAULT 'pending' / NOT NULL / CHECK 三值
--   S0-A3 RLS Baseline     : role + tenant + store + ownership（DB 权威）
-- 授权关系（取自现存数据模型，无新造字段）:
--   ownership    : schedules.employee_id → employees.id (user_id = auth.uid(), status='active')
--   store scope  : stores.manager_id → profiles.id（schema 既有 FK）+ profiles.role='store_manager'
--   tenant scope : profiles.tenant_id（经 get_user_tenant_id）
-- 不变量:
--   employee 经 JWT 对 schedules 无任何写路径（无 INSERT/UPDATE/DELETE policy）
--   所有 JWT 写路径 WITH CHECK 限定 status ∈ {published, cancelled} → legacy 不可经 JWT 进入/修改
--   无 DELETE policy → 物理删除仅 service 层
-- ============================================================

-- ---------- S0-A1 · Legacy Cutover ----------
UPDATE public.schedules
   SET status = 'legacy'
 WHERE status = 'pending';

-- ---------- S0-A2 · Status Contract ----------
ALTER TABLE public.schedules ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.schedules ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS schedules_status_check;

ALTER TABLE public.schedules
  ADD CONSTRAINT schedules_status_check
  CHECK (status IN ('legacy', 'published', 'cancelled'));

-- ---------- S0-A3 · RLS Baseline ----------
DROP POLICY IF EXISTS "租户用户可访问本租户排班" ON public.schedules;
DROP POLICY IF EXISTS "超级管理员可访问所有排班" ON public.schedules;

-- 授权辅助函数（SECURITY DEFINER / STABLE / 固定 search_path，与既有 G0 helper 同纪律）
CREATE OR REPLACE FUNCTION public.sched_my_employee_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT e.id FROM public.employees e
   WHERE e.user_id = auth.uid() AND e.status = 'active'
$$;

CREATE OR REPLACE FUNCTION public.sched_my_managed_store_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT s.id FROM public.stores s
   WHERE s.manager_id = auth.uid()
     AND s.tenant_id = public.get_user_tenant_id(auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.sched_is_store_manager()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = auth.uid() AND p.role = 'store_manager'
  )
$$;

CREATE OR REPLACE FUNCTION public.sched_is_tenant_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = auth.uid() AND p.role = 'tenant_admin' AND p.tenant_id IS NOT NULL
  )
$$;

-- SELECT：员工仅本人的 published（A4 隔离：legacy 0 exposure）
CREATE POLICY schedules_select_own_published ON public.schedules
  FOR SELECT TO authenticated
  USING (
    status = 'published'
    AND employee_id IN (SELECT public.sched_my_employee_ids())
  );

-- SELECT：店长看本店全状态（管理视野）
CREATE POLICY schedules_select_managed_stores ON public.schedules
  FOR SELECT TO authenticated
  USING (
    public.sched_is_store_manager()
    AND store_id IN (SELECT public.sched_my_managed_store_ids())
  );

-- SELECT：租户管理员看本租户全状态
CREATE POLICY schedules_select_own_tenant_admin ON public.schedules
  FOR SELECT TO authenticated
  USING (
    public.sched_is_tenant_admin()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
  );

-- SELECT：超级管理员
CREATE POLICY schedules_select_super_admin ON public.schedules
  FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- INSERT：租户管理员（本租户 + 显式 published）
CREATE POLICY schedules_insert_tenant_admin ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    public.sched_is_tenant_admin()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND status = 'published'
  );

-- INSERT：店长（本租户 + 所管门店 + 显式 published）
CREATE POLICY schedules_insert_store_manager ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    public.sched_is_store_manager()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND store_id IN (SELECT public.sched_my_managed_store_ids())
    AND status = 'published'
  );

-- INSERT：超级管理员（显式 published）
CREATE POLICY schedules_insert_super_admin ON public.schedules
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin(auth.uid())
    AND status = 'published'
  );

-- UPDATE：租户管理员（legacy 不可改：WITH CHECK 限 published/cancelled）
CREATE POLICY schedules_update_tenant_admin ON public.schedules
  FOR UPDATE TO authenticated
  USING (
    public.sched_is_tenant_admin()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
  )
  WITH CHECK (
    public.sched_is_tenant_admin()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND status IN ('published', 'cancelled')
  );

-- UPDATE：店长（所管门店；legacy 不可改）
CREATE POLICY schedules_update_store_manager ON public.schedules
  FOR UPDATE TO authenticated
  USING (
    public.sched_is_store_manager()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND store_id IN (SELECT public.sched_my_managed_store_ids())
  )
  WITH CHECK (
    public.sched_is_store_manager()
    AND tenant_id = public.get_user_tenant_id(auth.uid())
    AND store_id IN (SELECT public.sched_my_managed_store_ids())
    AND status IN ('published', 'cancelled')
  );

-- UPDATE：超级管理员（legacy 不可改）
CREATE POLICY schedules_update_super_admin ON public.schedules
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (
    public.is_super_admin(auth.uid())
    AND status IN ('published', 'cancelled')
  );

-- DELETE：不设任何 policy —— 全部 JWT 角色物理删除 = DENY，留待 command layer 语义
