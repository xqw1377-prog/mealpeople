-- ============================================================
-- G0-D: 为 5 张无 RLS 的生产表补齐隔离（P0-SEC-03）
-- 背景：candidates / interviews / exit_interviews / resignation_requests /
--       employee_lifecycle_events 在生产库（schema.sql 快照）中
--       既未 ENABLE RLS、也无任何策略——招聘候选人 PII（姓名/手机号）
--       对 anon 直读。历史迁移中写过 ENABLE 但未在生产库生效（已漂移）。
--
-- 策略形态与 8 张核心表一致；无 tenant_id 的 3 张经父表关联判定。
-- 员工自见策略保留 20 号迁移的设计意图（employee_id -> employees.user_id）。
-- ============================================================

-- ---------- 1. candidates 候选人（含 PII，有 tenant_id） ----------
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户成员可访问本租户候选人" ON candidates
  FOR ALL TO authenticated
  USING (public.can_access_tenant(auth.uid(), tenant_id))
  WITH CHECK (public.can_access_tenant(auth.uid(), tenant_id));

-- ---------- 2. resignation_requests 离职申请（有 tenant_id） ----------
ALTER TABLE resignation_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户成员可访问本租户离职申请" ON resignation_requests
  FOR ALL TO authenticated
  USING (public.can_access_tenant(auth.uid(), tenant_id))
  WITH CHECK (public.can_access_tenant(auth.uid(), tenant_id));

-- ---------- 3. interviews 面试记录（无 tenant_id，经 candidates 关联） ----------
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户成员可访问本租户面试记录" ON interviews
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_id
      AND public.can_access_tenant(auth.uid(), c.tenant_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM candidates c
    WHERE c.id = candidate_id
      AND public.can_access_tenant(auth.uid(), c.tenant_id)
  ));

-- ---------- 4. exit_interviews 离职面谈（无 tenant_id，经 resignation_requests 关联） ----------
ALTER TABLE exit_interviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户成员可访问本租户离职面谈" ON exit_interviews
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM resignation_requests rr
    WHERE rr.id = resignation_id
      AND public.can_access_tenant(auth.uid(), rr.tenant_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM resignation_requests rr
    WHERE rr.id = resignation_id
      AND public.can_access_tenant(auth.uid(), rr.tenant_id)
  ));

-- ---------- 5. employee_lifecycle_events 生命周期事件（无 tenant_id，经 employees 关联） ----------
ALTER TABLE employee_lifecycle_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "租户成员可访问本租户生命周期事件" ON employee_lifecycle_events
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = employee_id
      AND public.can_access_tenant(auth.uid(), e.tenant_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = employee_id
      AND public.can_access_tenant(auth.uid(), e.tenant_id)
  ));

-- 员工自见：无论角色如何，本人事件始终可见（还原 20 号迁移设计意图）
CREATE POLICY "员工可查看自己的生命周期事件" ON employee_lifecycle_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = employee_id
      AND e.user_id = auth.uid()
  ));
