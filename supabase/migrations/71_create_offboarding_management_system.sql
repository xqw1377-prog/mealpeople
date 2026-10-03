/*
# 创建离职管理系统表

## 1. 新建表
- offboarding_applications: 离职申请表
- offboarding_interviews: 离职面谈表
- offboarding_tasks: 离职任务表
- offboarding_handovers: 离职交接表
- offboarding_history: 离职历史表

## 2. 安全策略
- 启用RLS
- 员工可以查看自己的离职信息
- 管理员可以管理所有离职数据
*/

-- ==================== 1. 离职申请表 ====================
CREATE TABLE IF NOT EXISTS offboarding_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  application_date DATE NOT NULL DEFAULT CURRENT_DATE, -- 申请日期
  expected_leave_date DATE NOT NULL, -- 预计离职日期
  resignation_type TEXT NOT NULL, -- 离职类型：voluntary(主动离职)、involuntary(被动离职)、retirement(退休)、contract_end(合同到期)
  resignation_reason TEXT NOT NULL, -- 离职原因
  detailed_reason TEXT, -- 详细原因
  status TEXT NOT NULL DEFAULT 'pending', -- 状态：pending(待审批)、approved(已批准)、rejected(已拒绝)、withdrawn(已撤回)、completed(已完成)
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 提交时间
  approved_by UUID REFERENCES employees(id), -- 审批人ID
  approved_at TIMESTAMP WITH TIME ZONE, -- 审批时间
  actual_leave_date DATE, -- 实际离职日期
  notes TEXT, -- 备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_offboarding_applications_tenant ON offboarding_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_applications_employee ON offboarding_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_applications_status ON offboarding_applications(status);

-- 添加注释
COMMENT ON TABLE offboarding_applications IS '离职申请表';
COMMENT ON COLUMN offboarding_applications.resignation_type IS '离职类型：voluntary(主动离职)、involuntary(被动离职)、retirement(退休)、contract_end(合同到期)';
COMMENT ON COLUMN offboarding_applications.status IS '状态：pending(待审批)、approved(已批准)、rejected(已拒绝)、withdrawn(已撤回)、completed(已完成)';

-- ==================== 2. 离职面谈表 ====================
CREATE TABLE IF NOT EXISTS offboarding_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES offboarding_applications(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  interviewer_id UUID NOT NULL REFERENCES employees(id), -- 面谈人ID
  interview_date DATE NOT NULL, -- 面谈日期
  interview_duration INTEGER, -- 面谈时长（分钟）
  satisfaction_score INTEGER, -- 满意度评分（1-5）
  would_recommend BOOLEAN, -- 是否推荐公司
  would_return BOOLEAN, -- 是否愿意回来
  feedback TEXT, -- 反馈意见
  suggestions TEXT, -- 改进建议
  notes TEXT, -- 备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_offboarding_interviews_tenant ON offboarding_interviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_interviews_application ON offboarding_interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_interviews_employee ON offboarding_interviews(employee_id);

-- 添加注释
COMMENT ON TABLE offboarding_interviews IS '离职面谈表';

-- ==================== 3. 离职任务表 ====================
CREATE TABLE IF NOT EXISTS offboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES offboarding_applications(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL, -- 任务名称
  task_description TEXT, -- 任务描述
  task_type TEXT NOT NULL, -- 任务类型：document(文档)、equipment(设备)、access(权限)、handover(交接)、other(其他)
  assigned_to UUID REFERENCES employees(id), -- 负责人ID
  due_date DATE, -- 截止日期
  status TEXT NOT NULL DEFAULT 'pending', -- 状态：pending(待处理)、in_progress(进行中)、completed(已完成)、cancelled(已取消)
  completed_at TIMESTAMP WITH TIME ZONE, -- 完成时间
  completed_by UUID REFERENCES employees(id), -- 完成人ID
  priority TEXT DEFAULT 'medium', -- 优先级：low(低)、medium(中)、high(高)
  notes TEXT, -- 备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_offboarding_tasks_tenant ON offboarding_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_tasks_application ON offboarding_tasks(application_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_tasks_status ON offboarding_tasks(status);

-- 添加注释
COMMENT ON TABLE offboarding_tasks IS '离职任务表';
COMMENT ON COLUMN offboarding_tasks.task_type IS '任务类型：document(文档)、equipment(设备)、access(权限)、handover(交接)、other(其他)';
COMMENT ON COLUMN offboarding_tasks.status IS '状态：pending(待处理)、in_progress(进行中)、completed(已完成)、cancelled(已取消)';

-- ==================== 4. 离职交接表 ====================
CREATE TABLE IF NOT EXISTS offboarding_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES offboarding_applications(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id), -- 交接人ID（离职员工）
  handover_to UUID NOT NULL REFERENCES employees(id), -- 接收人ID
  handover_type TEXT NOT NULL, -- 交接类型：work(工作)、project(项目)、client(客户)、document(文档)、equipment(设备)
  handover_item TEXT NOT NULL, -- 交接项目
  handover_description TEXT, -- 交接说明
  handover_date DATE, -- 交接日期
  status TEXT NOT NULL DEFAULT 'pending', -- 状态：pending(待交接)、in_progress(交接中)、completed(已完成)
  completed_at TIMESTAMP WITH TIME ZONE, -- 完成时间
  notes TEXT, -- 备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_offboarding_handovers_tenant ON offboarding_handovers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_handovers_application ON offboarding_handovers(application_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_handovers_employee ON offboarding_handovers(employee_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_handovers_to ON offboarding_handovers(handover_to);

-- 添加注释
COMMENT ON TABLE offboarding_handovers IS '离职交接表';
COMMENT ON COLUMN offboarding_handovers.handover_type IS '交接类型：work(工作)、project(项目)、client(客户)、document(文档)、equipment(设备)';
COMMENT ON COLUMN offboarding_handovers.status IS '状态：pending(待交接)、in_progress(交接中)、completed(已完成)';

-- ==================== 5. 离职历史表 ====================
CREATE TABLE IF NOT EXISTS offboarding_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  application_id UUID REFERENCES offboarding_applications(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL, -- 员工姓名
  position TEXT NOT NULL, -- 职位
  department TEXT NOT NULL, -- 部门
  store_id UUID REFERENCES stores(id), -- 门店ID
  join_date DATE NOT NULL, -- 入职日期
  leave_date DATE NOT NULL, -- 离职日期
  tenure_months INTEGER, -- 在职月数
  resignation_type TEXT NOT NULL, -- 离职类型
  resignation_reason TEXT NOT NULL, -- 离职原因
  final_salary NUMERIC, -- 最终薪资
  notes TEXT, -- 备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_offboarding_history_tenant ON offboarding_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_history_employee ON offboarding_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_history_application ON offboarding_history(application_id);

-- 添加注释
COMMENT ON TABLE offboarding_history IS '离职历史表 - 存储已完成的离职记录';

-- ==================== 6. 启用RLS ====================
ALTER TABLE offboarding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding_history ENABLE ROW LEVEL SECURITY;

-- ==================== 7. 创建RLS策略 ====================

-- 离职申请表策略
CREATE POLICY "员工可以查看自己的离职申请"
  ON offboarding_applications FOR SELECT
  USING (employee_id = auth.uid()::uuid);

CREATE POLICY "员工可以创建自己的离职申请"
  ON offboarding_applications FOR INSERT
  WITH CHECK (employee_id = auth.uid()::uuid);

CREATE POLICY "员工可以更新自己的离职申请"
  ON offboarding_applications FOR UPDATE
  USING (employee_id = auth.uid()::uuid);

-- 离职面谈表策略
CREATE POLICY "员工可以查看自己的离职面谈"
  ON offboarding_interviews FOR SELECT
  USING (employee_id = auth.uid()::uuid OR interviewer_id = auth.uid()::uuid);

-- 离职任务表策略
CREATE POLICY "员工可以查看相关的离职任务"
  ON offboarding_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM offboarding_applications
      WHERE offboarding_applications.id = offboarding_tasks.application_id
      AND offboarding_applications.employee_id = auth.uid()::uuid
    )
    OR assigned_to = auth.uid()::uuid
  );

-- 离职交接表策略
CREATE POLICY "员工可以查看相关的离职交接"
  ON offboarding_handovers FOR SELECT
  USING (employee_id = auth.uid()::uuid OR handover_to = auth.uid()::uuid);

-- 离职历史表策略
CREATE POLICY "员工可以查看自己的离职历史"
  ON offboarding_history FOR SELECT
  USING (employee_id = auth.uid()::uuid);

-- ==================== 8. 创建触发器函数 ====================

-- 更新updated_at字段的触发器函数
CREATE OR REPLACE FUNCTION update_offboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为各表创建触发器
CREATE TRIGGER update_offboarding_applications_updated_at
  BEFORE UPDATE ON offboarding_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

CREATE TRIGGER update_offboarding_interviews_updated_at
  BEFORE UPDATE ON offboarding_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

CREATE TRIGGER update_offboarding_tasks_updated_at
  BEFORE UPDATE ON offboarding_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

CREATE TRIGGER update_offboarding_handovers_updated_at
  BEFORE UPDATE ON offboarding_handovers
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();

CREATE TRIGGER update_offboarding_history_updated_at
  BEFORE UPDATE ON offboarding_history
  FOR EACH ROW
  EXECUTE FUNCTION update_offboarding_updated_at();
