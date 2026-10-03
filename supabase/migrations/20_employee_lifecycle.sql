/*
# 员工全生命周期管理系统 - 数据库迁移

## 概述
本迁移文件创建员工全生命周期管理所需的所有表结构，包括：
1. 招聘管理模块
2. 入职管理模块
3. 员工生命周期事件追踪
4. 离职管理模块

## 新增表结构

### 1. 招聘管理模块

#### positions（职位表）
- `id` (uuid, 主键) - 职位ID
- `tenant_id` (uuid, 非空) - 租户ID
- `title` (text, 非空) - 职位名称
- `department` (text) - 部门
- `description` (text) - 职位描述
- `requirements` (text) - 任职要求
- `salary_range` (text) - 薪资范围
- `status` (text, 默认'open') - 状态：'open'(招聘中), 'closed'(已关闭)
- `created_by` (uuid) - 创建人ID
- `created_at` (timestamptz) - 创建时间
- `updated_at` (timestamptz) - 更新时间

#### candidates（候选人表）
- `id` (uuid, 主键) - 候选人ID
- `tenant_id` (uuid, 非空) - 租户ID
- `position_id` (uuid) - 关联职位ID
- `name` (text, 非空) - 姓名
- `phone` (text) - 手机号
- `email` (text) - 邮箱
- `resume_url` (text) - 简历URL
- `status` (text, 默认'pending') - 状态：'pending'(待处理), 'interview'(面试中), 'offer'(已发offer), 'hired'(已录用), 'rejected'(已拒绝)
- `source` (text) - 来源：'内推', '招聘网站', '校园招聘'等
- `created_at` (timestamptz) - 创建时间
- `updated_at` (timestamptz) - 更新时间

#### interviews（面试记录表）
- `id` (uuid, 主键) - 面试记录ID
- `candidate_id` (uuid) - 候选人ID
- `interviewer_id` (uuid) - 面试官ID
- `interview_date` (timestamptz) - 面试时间
- `interview_type` (text) - 面试类型：'初试', '复试', '终试'
- `feedback` (text) - 面试反馈
- `score` (integer) - 评分(1-100)
- `result` (text) - 结果：'pass'(通过), 'fail'(未通过), 'pending'(待定)
- `created_at` (timestamptz) - 创建时间

### 2. 入职管理模块

#### onboarding_processes（入职流程表）
- `id` (uuid, 主键) - 入职流程ID
- `tenant_id` (uuid, 非空) - 租户ID
- `employee_id` (uuid) - 员工ID
- `candidate_id` (uuid) - 候选人ID
- `status` (text, 默认'pending') - 状态：'pending'(待开始), 'in_progress'(进行中), 'completed'(已完成)
- `start_date` (date) - 开始日期
- `expected_completion_date` (date) - 预计完成日期
- `actual_completion_date` (date) - 实际完成日期
- `created_at` (timestamptz) - 创建时间
- `updated_at` (timestamptz) - 更新时间

#### onboarding_tasks（入职任务表）
- `id` (uuid, 主键) - 任务ID
- `process_id` (uuid) - 入职流程ID
- `task_name` (text, 非空) - 任务名称
- `description` (text) - 任务描述
- `task_type` (text) - 任务类型：'资料收集', '培训', '系统开通', '物品领取'
- `status` (text, 默认'pending') - 状态：'pending'(待完成), 'completed'(已完成)
- `completed_at` (timestamptz) - 完成时间
- `completed_by` (uuid) - 完成人ID
- `created_at` (timestamptz) - 创建时间

### 3. 员工生命周期追踪

#### employee_lifecycle_events（员工生命周期事件表）
- `id` (uuid, 主键) - 事件ID
- `employee_id` (uuid, 非空) - 员工ID
- `event_type` (text, 非空) - 事件类型：'applied'(投递简历), 'interviewed'(面试), 'hired'(录用), 'onboarded'(入职), 'promoted'(晋升), 'transferred'(调岗), 'resigned'(离职), 'terminated'(辞退)
- `event_date` (date, 非空) - 事件日期
- `description` (text) - 事件描述
- `metadata` (jsonb) - 额外数据
- `created_by` (uuid) - 创建人ID
- `created_at` (timestamptz) - 创建时间

### 4. 离职管理模块

#### resignation_requests（离职申请表）
- `id` (uuid, 主键) - 离职申请ID
- `tenant_id` (uuid, 非空) - 租户ID
- `employee_id` (uuid, 非空) - 员工ID
- `reason_type` (text) - 离职原因类型：'个人原因', '家庭原因', '职业发展', '薪资待遇', '其他'
- `reason_detail` (text) - 详细原因
- `resignation_date` (date) - 申请日期
- `last_working_day` (date) - 最后工作日
- `status` (text, 默认'pending') - 状态：'pending'(待审批), 'approved'(已批准), 'rejected'(已拒绝), 'completed'(已完成)
- `approved_by` (uuid) - 审批人ID
- `approved_at` (timestamptz) - 审批时间
- `created_at` (timestamptz) - 创建时间

#### exit_interviews（离职面谈表）
- `id` (uuid, 主键) - 离职面谈ID
- `resignation_id` (uuid) - 离职申请ID
- `interviewer_id` (uuid) - 面谈人ID
- `interview_date` (date) - 面谈日期
- `satisfaction_score` (integer) - 满意度评分(1-5)
- `feedback` (text) - 反馈意见
- `suggestions` (text) - 改进建议
- `would_recommend` (boolean) - 是否愿意推荐
- `created_at` (timestamptz) - 创建时间

## 安全策略
- 所有表启用RLS（行级安全）
- 管理员拥有完全访问权限
- 普通用户只能查看与自己相关的数据
*/

-- ============================================
-- 辅助函数：检查用户是否为管理员
-- ============================================

-- 创建is_admin函数，用于检查用户是否具有管理员权限
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid AND role = 'admin'::user_role
  );
$$;

-- ============================================
-- 1. 招聘管理模块
-- ============================================

-- 职位表
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 候选人表
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'interview', 'offer', 'hired', 'rejected')),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 面试记录表
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  interviewer_id UUID,
  interview_date TIMESTAMPTZ,
  interview_type TEXT,
  feedback TEXT,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  result TEXT CHECK (result IN ('pass', 'fail', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 入职管理模块
-- ============================================

-- 入职流程表
CREATE TABLE IF NOT EXISTS onboarding_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  start_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 入职任务表
CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES onboarding_processes(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  task_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 员工生命周期追踪
-- ============================================

-- 员工生命周期事件表
CREATE TABLE IF NOT EXISTS employee_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('applied', 'interviewed', 'hired', 'onboarded', 'promoted', 'transferred', 'resigned', 'terminated')),
  event_date DATE NOT NULL,
  description TEXT,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 离职管理模块
-- ============================================

-- 离职申请表
CREATE TABLE IF NOT EXISTS resignation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  reason_type TEXT,
  reason_detail TEXT,
  resignation_date DATE,
  last_working_day DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 离职面谈表
CREATE TABLE IF NOT EXISTS exit_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resignation_id UUID REFERENCES resignation_requests(id) ON DELETE CASCADE,
  interviewer_id UUID,
  interview_date DATE,
  satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  feedback TEXT,
  suggestions TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. 创建索引以提高查询性能
-- ============================================

-- 职位表索引
CREATE INDEX IF NOT EXISTS idx_positions_tenant_id ON positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);

-- 候选人表索引
CREATE INDEX IF NOT EXISTS idx_candidates_tenant_id ON candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidates_position_id ON candidates(position_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);

-- 面试记录表索引
CREATE INDEX IF NOT EXISTS idx_interviews_candidate_id ON interviews(candidate_id);

-- 入职流程表索引
CREATE INDEX IF NOT EXISTS idx_onboarding_processes_tenant_id ON onboarding_processes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_processes_employee_id ON onboarding_processes(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_processes_status ON onboarding_processes(status);

-- 入职任务表索引
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_process_id ON onboarding_tasks(process_id);

-- 员工生命周期事件表索引
CREATE INDEX IF NOT EXISTS idx_employee_lifecycle_events_employee_id ON employee_lifecycle_events(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_lifecycle_events_event_type ON employee_lifecycle_events(event_type);

-- 离职申请表索引
CREATE INDEX IF NOT EXISTS idx_resignation_requests_tenant_id ON resignation_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_resignation_requests_employee_id ON resignation_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_resignation_requests_status ON resignation_requests(status);

-- 离职面谈表索引
CREATE INDEX IF NOT EXISTS idx_exit_interviews_resignation_id ON exit_interviews(resignation_id);

-- ============================================
-- 6. 启用行级安全（RLS）
-- ============================================

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE resignation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_interviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. 创建RLS策略
-- ============================================

-- 管理员完全访问所有表
CREATE POLICY "管理员完全访问职位" ON positions FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "管理员完全访问候选人" ON candidates FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "管理员完全访问面试记录" ON interviews FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "管理员完全访问入职流程" ON onboarding_processes FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "管理员完全访问入职任务" ON onboarding_tasks FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "管理员完全访问生命周期事件" ON employee_lifecycle_events FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "管理员完全访问离职申请" ON resignation_requests FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "管理员完全访问离职面谈" ON exit_interviews FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- 员工可以查看自己相关的数据
CREATE POLICY "员工查看自己的生命周期事件" ON employee_lifecycle_events 
  FOR SELECT TO authenticated 
  USING (employee_id = auth.uid());

CREATE POLICY "员工查看自己的离职申请" ON resignation_requests 
  FOR SELECT TO authenticated 
  USING (employee_id = auth.uid());

-- 员工可以创建自己的离职申请
CREATE POLICY "员工创建离职申请" ON resignation_requests 
  FOR INSERT TO authenticated 
  WITH CHECK (employee_id = auth.uid());

-- ============================================
-- 8. 创建触发器：自动更新updated_at字段
-- ============================================

-- 创建更新时间戳函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_processes_updated_at BEFORE UPDATE ON onboarding_processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. 插入初始数据（示例）
-- ============================================

-- 注意：这里不插入实际数据，因为需要根据具体租户ID来插入
-- 实际使用时，应用程序会根据当前租户动态创建数据
