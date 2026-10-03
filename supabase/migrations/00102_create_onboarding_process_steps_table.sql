/*
# 创建入职流程步骤表

## 1. 新增表

### onboarding_process_steps（入职流程步骤表）
- id (uuid, 主键)
- tenant_id (uuid, 租户ID)
- application_id (uuid, 入职申请ID)
- step_name (text, 步骤名称)
- step_order (integer, 步骤顺序)
- description (text, 步骤描述)
- responsible_role (text, 负责角色)
- required (boolean, 是否必需)
- is_completed (boolean, 是否完成)
- completed_at (timestamptz, 完成时间)
- completed_by (uuid, 完成人ID)
- notes (text, 备注)
- created_at (timestamptz, 创建时间)
- updated_at (timestamptz, 更新时间)

## 2. 安全策略
- 启用RLS
- HR管理员可以查看和管理所有步骤
- 员工可以查看自己的入职流程步骤

## 3. 索引
- 为application_id创建索引
- 为tenant_id创建索引
- 为step_order创建索引
*/

-- 创建入职流程步骤表
CREATE TABLE IF NOT EXISTS onboarding_process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  description TEXT,
  responsible_role TEXT NOT NULL,
  required BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_onboarding_process_steps_application 
  ON onboarding_process_steps(application_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_process_steps_tenant 
  ON onboarding_process_steps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_process_steps_order 
  ON onboarding_process_steps(step_order);

-- 启用RLS
ALTER TABLE onboarding_process_steps ENABLE ROW LEVEL SECURITY;

-- RLS策略：管理员可以查看所有步骤
CREATE POLICY "管理员可以查看所有步骤" ON onboarding_process_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN profiles p ON e.user_id = p.id
      WHERE p.id = auth.uid()
        AND e.tenant_id = onboarding_process_steps.tenant_id
        AND p.role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- RLS策略：管理员可以插入步骤
CREATE POLICY "管理员可以插入步骤" ON onboarding_process_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN profiles p ON e.user_id = p.id
      WHERE p.id = auth.uid()
        AND e.tenant_id = onboarding_process_steps.tenant_id
        AND p.role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- RLS策略：管理员可以更新步骤
CREATE POLICY "管理员可以更新步骤" ON onboarding_process_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN profiles p ON e.user_id = p.id
      WHERE p.id = auth.uid()
        AND e.tenant_id = onboarding_process_steps.tenant_id
        AND p.role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- RLS策略：管理员可以删除步骤
CREATE POLICY "管理员可以删除步骤" ON onboarding_process_steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN profiles p ON e.user_id = p.id
      WHERE p.id = auth.uid()
        AND e.tenant_id = onboarding_process_steps.tenant_id
        AND p.role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- RLS策略：员工可以查看自己的入职流程步骤
CREATE POLICY "员工可以查看自己的入职流程步骤" ON onboarding_process_steps
  FOR SELECT USING (
    application_id IN (
      SELECT oa.id FROM onboarding_applications oa
      JOIN employees e ON oa.employee_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_onboarding_process_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_process_steps_updated_at
  BEFORE UPDATE ON onboarding_process_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_process_steps_updated_at();
