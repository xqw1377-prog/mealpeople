/*
# 创建休假管理相关表

## 1. 新增表

### 1.1 leave_requests（休假申请表）
- 员工休假申请的完整信息
- 包含规则检查和审批流程

### 1.2 approval_logs（审批记录表）
- 记录所有审批操作
- 用于审计和追溯

## 2. 安全策略
- 启用RLS
- 员工可以查看和创建自己的请假申请
- 员工可以取消自己的待审批申请
- 管理员可以审批所有请假申请

*/

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS approval_logs CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP FUNCTION IF EXISTS is_user_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_leave_requests_updated_at() CASCADE;

-- 创建辅助函数：检查用户是否是管理员
CREATE OR REPLACE FUNCTION is_user_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建休假申请表
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  store_id UUID NOT NULL,
  
  -- 申请信息
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual_leave', 'sick_leave', 'personal_leave', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days DECIMAL(10,2) NOT NULL CHECK (days > 0),
  reason TEXT,
  
  -- 规则检查
  within_rules BOOLEAN NOT NULL DEFAULT false,
  rule_id UUID,
  current_month_days DECIMAL(10,2) DEFAULT 0,
  rule_max_days DECIMAL(10,2),
  
  -- 审批信息
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approver_id UUID,
  approval_comment TEXT,
  approved_at TIMESTAMPTZ,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 约束
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 创建审批记录表
CREATE TABLE approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  
  -- 关联信息
  request_type TEXT NOT NULL,
  request_id UUID NOT NULL,
  
  -- 审批信息
  approver_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  comment TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_store ON leave_requests(store_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_created ON leave_requests(created_at DESC);

CREATE INDEX idx_approval_logs_tenant ON approval_logs(tenant_id);
CREATE INDEX idx_approval_logs_request ON approval_logs(request_type, request_id);
CREATE INDEX idx_approval_logs_approver ON approval_logs(approver_id);
CREATE INDEX idx_approval_logs_created ON approval_logs(created_at DESC);

-- 启用RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;

-- leave_requests 的RLS策略

-- 员工可以查看自己的请假申请，管理员可以查看所有
CREATE POLICY "员工可以查看自己的请假申请" ON leave_requests
  FOR SELECT USING (
    employee_id = auth.uid() OR
    is_user_admin(auth.uid())
  );

-- 员工可以创建请假申请
CREATE POLICY "员工可以创建请假申请" ON leave_requests
  FOR INSERT WITH CHECK (
    employee_id = auth.uid()
  );

-- 员工可以更新自己的待审批申请（取消）
CREATE POLICY "员工可以取消自己的待审批申请" ON leave_requests
  FOR UPDATE USING (
    employee_id = auth.uid() AND status = 'pending'
  ) WITH CHECK (
    employee_id = auth.uid() AND status IN ('pending', 'cancelled')
  );

-- 管理员可以审批所有请假申请
CREATE POLICY "管理员可以审批请假申请" ON leave_requests
  FOR UPDATE USING (
    is_user_admin(auth.uid())
  );

-- 管理员可以删除请假申请
CREATE POLICY "管理员可以删除请假申请" ON leave_requests
  FOR DELETE USING (
    is_user_admin(auth.uid())
  );

-- approval_logs 的RLS策略

-- 管理员可以查看所有审批记录
CREATE POLICY "管理员可以查看审批记录" ON approval_logs
  FOR SELECT USING (
    is_user_admin(auth.uid())
  );

-- 管理员可以创建审批记录
CREATE POLICY "管理员可以创建审批记录" ON approval_logs
  FOR INSERT WITH CHECK (
    is_user_admin(auth.uid())
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_requests_updated_at();

-- 添加注释
COMMENT ON TABLE leave_requests IS '休假申请表';
COMMENT ON TABLE approval_logs IS '审批记录表';

COMMENT ON COLUMN leave_requests.leave_type IS '休假类型: annual_leave(年假), sick_leave(病假), personal_leave(事假), other(其他)';
COMMENT ON COLUMN leave_requests.status IS '状态: pending(待审批), approved(已批准), rejected(已拒绝), cancelled(已取消)';
COMMENT ON COLUMN leave_requests.within_rules IS '是否在休假规则范围内';
COMMENT ON COLUMN approval_logs.request_type IS '申请类型: leave_request(休假申请), schedule_change(排班变更)等';
COMMENT ON COLUMN approval_logs.action IS '审批动作: approved(批准), rejected(拒绝)';
