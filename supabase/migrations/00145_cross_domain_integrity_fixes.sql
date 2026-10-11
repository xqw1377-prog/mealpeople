-- ============================================================
-- Cross-Domain Integrity Fixes（work_records + leave_requests）
-- 依据：工作记录审计 + 请假审计 S0 项
--
-- 1. is_user_admin：死枚举值 'admin' → 正确三角色
--    （毒化 work_logs/work_ratings/leave_requests/approval_logs 共 9 条策略）
-- 2. work_records 补 DELETE 策略（员工删自己的）+ 管理员策略加 tenant 隔离
-- 3. leave_requests 丢弃引用已删列 leave_type_id 的坏触发器
-- ============================================================

-- 1) is_user_admin 修复（保留参数名 user_id）
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND role IN ('super_admin','tenant_admin','store_manager')) $$;

-- 2) work_records 策略修复
DROP POLICY IF EXISTS "管理员可以查看所有记录" ON public.work_records;
DROP POLICY IF EXISTS admin_tenant_read ON public.work_records;
CREATE POLICY admin_tenant_read ON public.work_records
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = auth.uid()
       AND p.role IN ('super_admin','tenant_admin','store_manager')
       AND (p.role = 'super_admin' OR p.tenant_id = work_records.tenant_id)
  ));

DROP POLICY IF EXISTS wr_delete_own ON public.work_records;
CREATE POLICY wr_delete_own ON public.work_records
  FOR DELETE TO authenticated
  USING (employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid()));

-- 3) 丢弃坏触发器（引用 v2 已删列 leave_type_id）
DROP TRIGGER IF EXISTS leave_balance_update ON public.leave_requests;
