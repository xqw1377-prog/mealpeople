/*
# 完善离职管理系统

## 1. 新建表
- resignation_applications: 离职申请表
- resignation_approvals: 离职审批表
- resignation_handovers: 工作交接表
- resignation_procedures: 离职手续表
- resignation_interviews: 离职面谈表

## 2. 安全策略
- 启用RLS
- 员工可以查看和管理自己的离职申请
- 管理员可以管理所有离职数据
- HR可以管理离职相关数据
- 审批人可以处理自己的审批

## 3. 索引优化
- 为常用查询字段添加索引
- 为外键字段添加索引

## 4. 触发器
- 自动更新updated_at字段
- 自动创建审批流程
*/

-- ==================== 离职申请 ====================

-- 创建离职申请表
CREATE TABLE IF NOT EXISTS resignation_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  resignation_type TEXT NOT NULL,
  resignation_reason TEXT NOT NULL,
  resignation_reason_detail TEXT,
  expected_last_day DATE NOT NULL,
  actual_last_day DATE,
  notice_period INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建离职申请表索引
CREATE INDEX IF NOT EXISTS idx_resignation_applications_tenant_id ON resignation_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resignation_applications_employee_id ON resignation_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_resignation_applications_status ON resignation_applications(status);
CREATE INDEX IF NOT EXISTS idx_resignation_applications_submitted_at ON resignation_applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_resignation_applications_expected_last_day ON resignation_applications(expected_last_day);

-- 离职申请表RLS
ALTER TABLE resignation_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有离职申请" ON resignation_applications
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "HR可以管理离职申请" ON resignation_applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = resignation_applications.tenant_id
    )
  );

CREATE POLICY "员工可以查看和创建自己的离职申请" ON resignation_applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = resignation_applications.employee_id
    )
  );

-- ==================== 离职审批 ====================

-- 创建离职审批表
CREATE TABLE IF NOT EXISTS resignation_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES resignation_applications(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  approver_role TEXT NOT NULL,
  approval_level INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建离职审批表索引
CREATE INDEX IF NOT EXISTS idx_resignation_approvals_tenant_id ON resignation_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resignation_approvals_application_id ON resignation_approvals(application_id);
CREATE INDEX IF NOT EXISTS idx_resignation_approvals_approver_id ON resignation_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_resignation_approvals_status ON resignation_approvals(status);
CREATE INDEX IF NOT EXISTS idx_resignation_approvals_approval_level ON resignation_approvals(approval_level);

-- 离职审批表RLS
ALTER TABLE resignation_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有离职审批" ON resignation_approvals
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "HR可以查看所有离职审批" ON resignation_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = resignation_approvals.tenant_id
    )
  );

CREATE POLICY "审批人可以查看和处理自己的审批" ON resignation_approvals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = resignation_approvals.approver_id
    )
  );

CREATE POLICY "员工可以查看自己申请的审批记录" ON resignation_approvals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resignation_applications ra
      JOIN employees e ON e.id = ra.employee_id
      WHERE e.user_id = auth.uid()
      AND ra.id = resignation_approvals.application_id
    )
  );

-- ==================== 工作交接 ====================

-- 创建工作交接表
CREATE TABLE IF NOT EXISTS resignation_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES resignation_applications(id) ON DELETE CASCADE,
  handover_type TEXT NOT NULL,
  handover_item TEXT NOT NULL,
  handover_description TEXT,
  handover_to_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建工作交接表索引
CREATE INDEX IF NOT EXISTS idx_resignation_handovers_tenant_id ON resignation_handovers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resignation_handovers_application_id ON resignation_handovers(application_id);
CREATE INDEX IF NOT EXISTS idx_resignation_handovers_handover_to_id ON resignation_handovers(handover_to_id);
CREATE INDEX IF NOT EXISTS idx_resignation_handovers_status ON resignation_handovers(status);

-- 工作交接表RLS
ALTER TABLE resignation_handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有工作交接" ON resignation_handovers
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "HR可以管理工作交接" ON resignation_handovers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = resignation_handovers.tenant_id
    )
  );

CREATE POLICY "离职员工可以查看和更新自己的交接" ON resignation_handovers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resignation_applications ra
      JOIN employees e ON e.id = ra.employee_id
      WHERE e.user_id = auth.uid()
      AND ra.id = resignation_handovers.application_id
    )
  );

CREATE POLICY "接收人可以查看和确认交接" ON resignation_handovers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = resignation_handovers.handover_to_id
    )
  );

-- ==================== 离职手续 ====================

-- 创建离职手续表
CREATE TABLE IF NOT EXISTS resignation_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES resignation_applications(id) ON DELETE CASCADE,
  procedure_type TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  procedure_description TEXT,
  responsible_department TEXT NOT NULL,
  responsible_person_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建离职手续表索引
CREATE INDEX IF NOT EXISTS idx_resignation_procedures_tenant_id ON resignation_procedures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resignation_procedures_application_id ON resignation_procedures(application_id);
CREATE INDEX IF NOT EXISTS idx_resignation_procedures_responsible_person_id ON resignation_procedures(responsible_person_id);
CREATE INDEX IF NOT EXISTS idx_resignation_procedures_status ON resignation_procedures(status);
CREATE INDEX IF NOT EXISTS idx_resignation_procedures_procedure_type ON resignation_procedures(procedure_type);

-- 离职手续表RLS
ALTER TABLE resignation_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有离职手续" ON resignation_procedures
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "HR可以管理离职手续" ON resignation_procedures
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = resignation_procedures.tenant_id
    )
  );

CREATE POLICY "负责人可以查看和处理手续" ON resignation_procedures
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = resignation_procedures.responsible_person_id
    )
  );

CREATE POLICY "员工可以查看自己的离职手续" ON resignation_procedures
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM resignation_applications ra
      JOIN employees e ON e.id = ra.employee_id
      WHERE e.user_id = auth.uid()
      AND ra.id = resignation_procedures.application_id
    )
  );

-- ==================== 离职面谈 ====================

-- 创建离职面谈表
CREATE TABLE IF NOT EXISTS resignation_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES resignation_applications(id) ON DELETE CASCADE,
  interview_date DATE NOT NULL,
  interviewer_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL,
  resignation_reason_confirmed TEXT,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 0 AND satisfaction_score <= 100),
  work_environment_score INTEGER CHECK (work_environment_score >= 0 AND work_environment_score <= 100),
  management_score INTEGER CHECK (management_score >= 0 AND management_score <= 100),
  salary_score INTEGER CHECK (salary_score >= 0 AND salary_score <= 100),
  career_development_score INTEGER CHECK (career_development_score >= 0 AND career_development_score <= 100),
  team_atmosphere_score INTEGER CHECK (team_atmosphere_score >= 0 AND team_atmosphere_score <= 100),
  strengths TEXT,
  weaknesses TEXT,
  suggestions TEXT,
  retention_attempted BOOLEAN DEFAULT FALSE,
  retention_result TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建离职面谈表索引
CREATE INDEX IF NOT EXISTS idx_resignation_interviews_tenant_id ON resignation_interviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resignation_interviews_application_id ON resignation_interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_resignation_interviews_interviewer_id ON resignation_interviews(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_resignation_interviews_interview_date ON resignation_interviews(interview_date);

-- 离职面谈表RLS
ALTER TABLE resignation_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可以管理所有离职面谈" ON resignation_interviews
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "HR可以管理离职面谈" ON resignation_interviews
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.department = 'HR'
      AND e.tenant_id = resignation_interviews.tenant_id
    )
  );

CREATE POLICY "面谈人可以创建和查看面谈记录" ON resignation_interviews
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = resignation_interviews.interviewer_id
    )
  );

-- ==================== 更新触发器 ====================

-- 离职申请表更新时间触发器
CREATE OR REPLACE FUNCTION update_resignation_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resignation_applications_updated_at
  BEFORE UPDATE ON resignation_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_resignation_applications_updated_at();

-- 工作交接表更新时间触发器
CREATE OR REPLACE FUNCTION update_resignation_handovers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resignation_handovers_updated_at
  BEFORE UPDATE ON resignation_handovers
  FOR EACH ROW
  EXECUTE FUNCTION update_resignation_handovers_updated_at();

-- 离职手续表更新时间触发器
CREATE OR REPLACE FUNCTION update_resignation_procedures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resignation_procedures_updated_at
  BEFORE UPDATE ON resignation_procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_resignation_procedures_updated_at();

-- 离职面谈表更新时间触发器
CREATE OR REPLACE FUNCTION update_resignation_interviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_resignation_interviews_updated_at
  BEFORE UPDATE ON resignation_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_resignation_interviews_updated_at();

-- ==================== 自动创建审批流程触发器 ====================

-- 当创建离职申请时，自动创建审批流程
CREATE OR REPLACE FUNCTION create_resignation_approval_workflow()
RETURNS TRIGGER AS $$
DECLARE
  direct_manager_id UUID;
  department_manager_id UUID;
  hr_manager_id UUID;
  general_manager_id UUID;
BEGIN
  -- 获取直属上级
  SELECT manager_id INTO direct_manager_id
  FROM employees
  WHERE id = NEW.employee_id;

  -- 获取部门经理
  SELECT id INTO department_manager_id
  FROM employees
  WHERE tenant_id = NEW.tenant_id
  AND department = (SELECT department FROM employees WHERE id = NEW.employee_id)
  AND position LIKE '%经理%'
  AND id != direct_manager_id
  LIMIT 1;

  -- 获取HR经理
  SELECT id INTO hr_manager_id
  FROM employees
  WHERE tenant_id = NEW.tenant_id
  AND department = 'HR'
  AND position LIKE '%经理%'
  LIMIT 1;

  -- 获取总经理
  SELECT id INTO general_manager_id
  FROM employees
  WHERE tenant_id = NEW.tenant_id
  AND position LIKE '%总经理%'
  LIMIT 1;

  -- 创建审批流程
  -- 第1级：直属上级审批
  IF direct_manager_id IS NOT NULL THEN
    INSERT INTO resignation_approvals (tenant_id, application_id, approver_id, approver_role, approval_level)
    VALUES (NEW.tenant_id, NEW.id, direct_manager_id, '直属上级', 1);
  END IF;

  -- 第2级：部门经理审批
  IF department_manager_id IS NOT NULL AND department_manager_id != direct_manager_id THEN
    INSERT INTO resignation_approvals (tenant_id, application_id, approver_id, approver_role, approval_level)
    VALUES (NEW.tenant_id, NEW.id, department_manager_id, '部门经理', 2);
  END IF;

  -- 第3级：HR经理审批
  IF hr_manager_id IS NOT NULL THEN
    INSERT INTO resignation_approvals (tenant_id, application_id, approver_id, approver_role, approval_level)
    VALUES (NEW.tenant_id, NEW.id, hr_manager_id, 'HR经理', 3);
  END IF;

  -- 第4级：总经理审批
  IF general_manager_id IS NOT NULL THEN
    INSERT INTO resignation_approvals (tenant_id, application_id, approver_id, approver_role, approval_level)
    VALUES (NEW.tenant_id, NEW.id, general_manager_id, '总经理', 4);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_resignation_approval_workflow
  AFTER INSERT ON resignation_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_resignation_approval_workflow();
