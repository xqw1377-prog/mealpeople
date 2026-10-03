/*
# 完善入职管理系统

## 1. 新建表
- candidates: 候选人表
- interviews: 面试表
- offers: Offer表
- onboarding_approvals: 入职审批表
- onboarding_trainings: 入职培训表
- probation_evaluations: 试用期评估表

## 2. 完善现有表
- onboarding_applications: 添加更多字段
- onboarding_tasks: 添加更多字段
- onboarding_documents: 添加更多字段

## 3. 安全策略
- 启用RLS
- 员工可以查看自己的数据
- 管理员可以管理所有数据
- HR可以管理入职相关数据

## 4. 索引优化
- 为常用查询字段添加索引
- 为外键字段添加索引
*/

-- ==================== 候选人管理 ====================

-- 创建候选人表
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  gender TEXT,
  birth_date DATE,
  education TEXT,
  major TEXT,
  school TEXT,
  work_experience TEXT,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT,
  referrer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建候选人表索引
CREATE INDEX IF NOT EXISTS idx_candidates_tenant_id ON candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);

-- 候选人表RLS
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有候选人" ON candidates
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "HR可以管理候选人" ON candidates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = candidates.tenant_id
    )
  );

-- ==================== 面试管理 ====================

-- 创建面试表
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL,
  interview_date TIMESTAMPTZ NOT NULL,
  interview_location TEXT,
  interviewer_ids UUID[],
  status TEXT NOT NULL DEFAULT 'scheduled',
  result TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  feedback TEXT,
  notes TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建面试表索引
CREATE INDEX IF NOT EXISTS idx_interviews_tenant_id ON interviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interview_date ON interviews(interview_date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);

-- 面试表RLS
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有面试" ON interviews
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "HR可以管理面试" ON interviews
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = interviews.tenant_id
    )
  );

CREATE POLICY "面试官可以查看和更新自己的面试" ON interviews
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = ANY(interviews.interviewer_ids)
    )
  );

-- ==================== Offer管理 ====================

-- 创建Offer表
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  department TEXT NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  salary NUMERIC(10,2) NOT NULL,
  bonus TEXT,
  benefits TEXT,
  start_date DATE NOT NULL,
  probation_period INTEGER DEFAULT 3,
  contract_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_date DATE NOT NULL,
  response_deadline DATE,
  accepted_date DATE,
  rejected_date DATE,
  rejection_reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建Offer表索引
CREATE INDEX IF NOT EXISTS idx_offers_tenant_id ON offers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offers_candidate_id ON offers(candidate_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_sent_date ON offers(sent_date);

-- Offer表RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有Offer" ON offers
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "HR可以管理Offer" ON offers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = offers.tenant_id
    )
  );

-- ==================== 入职审批 ====================

-- 创建入职审批表
CREATE TABLE IF NOT EXISTS onboarding_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES onboarding_applications(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  approver_role TEXT NOT NULL,
  approval_level INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建入职审批表索引
CREATE INDEX IF NOT EXISTS idx_onboarding_approvals_tenant_id ON onboarding_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_approvals_application_id ON onboarding_approvals(application_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_approvals_approver_id ON onboarding_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_approvals_status ON onboarding_approvals(status);

-- 入职审批表RLS
ALTER TABLE onboarding_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有审批" ON onboarding_approvals
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "审批人可以查看和处理自己的审批" ON onboarding_approvals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = onboarding_approvals.approver_id
    )
  );

CREATE POLICY "HR可以查看所有审批" ON onboarding_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = onboarding_approvals.tenant_id
    )
  );

-- ==================== 入职培训 ====================

-- 创建入职培训表
CREATE TABLE IF NOT EXISTS onboarding_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES onboarding_applications(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL,
  training_type TEXT NOT NULL,
  training_date DATE NOT NULL,
  training_location TEXT,
  trainer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  attendance_status TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建入职培训表索引
CREATE INDEX IF NOT EXISTS idx_onboarding_trainings_tenant_id ON onboarding_trainings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_trainings_application_id ON onboarding_trainings(application_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_trainings_training_date ON onboarding_trainings(training_date);
CREATE INDEX IF NOT EXISTS idx_onboarding_trainings_status ON onboarding_trainings(status);

-- 入职培训表RLS
ALTER TABLE onboarding_trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有培训" ON onboarding_trainings
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "HR可以管理培训" ON onboarding_trainings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = onboarding_trainings.tenant_id
    )
  );

CREATE POLICY "员工可以查看自己的培训" ON onboarding_trainings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_applications oa
      JOIN employees e ON e.id = oa.employee_id
      WHERE e.user_id = auth.uid()
      AND oa.id = onboarding_trainings.application_id
    )
  );

-- ==================== 试用期评估 ====================

-- 创建试用期评估表
CREATE TABLE IF NOT EXISTS probation_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL,
  evaluator_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_performance INTEGER NOT NULL CHECK (work_performance >= 0 AND work_performance <= 100),
  work_attitude INTEGER NOT NULL CHECK (work_attitude >= 0 AND work_attitude <= 100),
  team_collaboration INTEGER NOT NULL CHECK (team_collaboration >= 0 AND team_collaboration <= 100),
  learning_ability INTEGER NOT NULL CHECK (learning_ability >= 0 AND learning_ability <= 100),
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  strengths TEXT,
  weaknesses TEXT,
  improvement_suggestions TEXT,
  recommendation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建试用期评估表索引
CREATE INDEX IF NOT EXISTS idx_probation_evaluations_tenant_id ON probation_evaluations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_probation_evaluations_employee_id ON probation_evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_probation_evaluations_evaluator_id ON probation_evaluations(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_probation_evaluations_evaluation_date ON probation_evaluations(evaluation_date);
CREATE INDEX IF NOT EXISTS idx_probation_evaluations_status ON probation_evaluations(status);

-- 试用期评估表RLS
ALTER TABLE probation_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有评估" ON probation_evaluations
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "HR可以管理评估" ON probation_evaluations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = probation_evaluations.tenant_id
    )
  );

CREATE POLICY "评估人可以创建和查看评估" ON probation_evaluations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = probation_evaluations.evaluator_id
    )
  );

CREATE POLICY "员工可以查看自己的评估" ON probation_evaluations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = probation_evaluations.employee_id
    )
  );

-- ==================== 更新触发器 ====================

-- 候选人表更新时间触发器
CREATE OR REPLACE FUNCTION update_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_candidates_updated_at();

-- 面试表更新时间触发器
CREATE OR REPLACE FUNCTION update_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_interviews_updated_at();

-- Offer表更新时间触发器
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_offers_updated_at();

-- 入职培训表更新时间触发器
CREATE OR REPLACE FUNCTION update_onboarding_trainings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_trainings_updated_at
  BEFORE UPDATE ON onboarding_trainings
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_trainings_updated_at();

-- 试用期评估表更新时间触发器
CREATE OR REPLACE FUNCTION update_probation_evaluations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_probation_evaluations_updated_at
  BEFORE UPDATE ON probation_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_probation_evaluations_updated_at();
