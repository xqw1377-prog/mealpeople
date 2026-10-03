/*
# 创建试用期转正申请表

## 功能说明
本迁移创建试用期转正申请表，用于员工提交试用期转正申请，HR进行审批。

## 表结构

### probation_conversion_applications（试用期转正申请表）
- `id` (uuid, 主键) - 申请ID
- `tenant_id` (uuid, 非空) - 租户ID
- `probation_id` (uuid, 非空) - 试用期ID（外键关联probation_periods表）
- `employee_id` (uuid, 非空) - 员工ID（外键关联employees表）
- `application_date` (date, 非空) - 申请日期
- `self_evaluation` (text, 非空) - 自我评价
- `work_summary` (text, 非空) - 工作总结
- `future_plan` (text, 非空) - 未来规划
- `status` (text, 非空, 默认'pending') - 申请状态：pending(待审批)/approved(已通过)/rejected(已拒绝)
- `review_notes` (text, 可空) - 审批意见
- `reviewed_at` (timestamptz, 可空) - 审批时间
- `created_at` (timestamptz, 默认now()) - 创建时间

## 安全策略
- 启用RLS（行级安全）
- 员工可以查看和创建自己的转正申请
- HR管理员可以查看所有申请并进行审批
- 使用租户ID进行数据隔离

## 索引
- tenant_id索引：提高租户数据查询性能
- probation_id索引：提高试用期关联查询性能
- employee_id索引：提高员工关联查询性能
*/

-- 创建试用期转正申请表
CREATE TABLE IF NOT EXISTS probation_conversion_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  probation_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  application_date date NOT NULL,
  self_evaluation text NOT NULL,
  work_summary text NOT NULL,
  future_plan text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_probation_conversion_applications_tenant_id 
  ON probation_conversion_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_probation_conversion_applications_probation_id 
  ON probation_conversion_applications(probation_id);
CREATE INDEX IF NOT EXISTS idx_probation_conversion_applications_employee_id 
  ON probation_conversion_applications(employee_id);

-- 启用RLS
ALTER TABLE probation_conversion_applications ENABLE ROW LEVEL SECURITY;

-- 员工可以查看自己的转正申请
CREATE POLICY "员工可以查看自己的转正申请" ON probation_conversion_applications
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 员工可以创建自己的转正申请
CREATE POLICY "员工可以创建自己的转正申请" ON probation_conversion_applications
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- HR管理员可以查看所有转正申请
CREATE POLICY "HR管理员可以查看所有转正申请" ON probation_conversion_applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN profiles p ON e.user_id = p.id
      WHERE e.user_id = auth.uid()
        AND e.tenant_id = probation_conversion_applications.tenant_id
        AND p.role = 'admin'
    )
  );

-- HR管理员可以更新转正申请（审批）
CREATE POLICY "HR管理员可以更新转正申请" ON probation_conversion_applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN profiles p ON e.user_id = p.id
      WHERE e.user_id = auth.uid()
        AND e.tenant_id = probation_conversion_applications.tenant_id
        AND p.role = 'admin'
    )
  );