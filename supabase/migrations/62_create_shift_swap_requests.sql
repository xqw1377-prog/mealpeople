/*
# 创建换班申请表

## 1. 新建表
- `shift_swap_requests` - 换班申请表
  - `id` (uuid, 主键)
  - `tenant_id` (uuid, 租户ID)
  - `requester_id` (uuid, 申请人员工ID)
  - `target_id` (uuid, 目标人员工ID)
  - `requester_shift_id` (uuid, 申请人班次ID)
  - `target_shift_id` (uuid, 目标人班次ID)
  - `reason` (text, 换班原因)
  - `status` (text, 状态: pending/approved/rejected/cancelled)
  - `reviewed_by` (uuid, 审批人ID)
  - `reviewed_at` (timestamptz, 审批时间)
  - `review_notes` (text, 审批备注)
  - `created_at` (timestamptz, 创建时间)
  - `updated_at` (timestamptz, 更新时间)

## 2. 安全策略
- 启用RLS
- 员工可以查看自己相关的换班申请
- 员工可以创建换班申请
- 管理员可以审批换班申请
*/

-- 创建换班申请状态枚举
DO $$ BEGIN
  CREATE TYPE swap_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建换班申请表
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- 申请人信息
  requester_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  requester_shift_id UUID NOT NULL REFERENCES employee_shifts(id) ON DELETE CASCADE,
  
  -- 目标人信息
  target_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  target_shift_id UUID NOT NULL REFERENCES employee_shifts(id) ON DELETE CASCADE,
  
  -- 申请信息
  reason TEXT NOT NULL,
  status swap_request_status DEFAULT 'pending'::swap_request_status NOT NULL,
  
  -- 审批信息
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 约束：申请人和目标人不能相同
  CHECK (requester_id != target_id),
  CHECK (requester_shift_id != target_shift_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_requester ON shift_swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_target ON shift_swap_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_status ON shift_swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_tenant ON shift_swap_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_created ON shift_swap_requests(created_at);

-- 启用RLS
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "员工查看相关的换班申请" ON shift_swap_requests;
DROP POLICY IF EXISTS "员工创建换班申请" ON shift_swap_requests;
DROP POLICY IF EXISTS "员工取消自己的换班申请" ON shift_swap_requests;
DROP POLICY IF EXISTS "管理员查看所有换班申请" ON shift_swap_requests;
DROP POLICY IF EXISTS "管理员审批换班申请" ON shift_swap_requests;

-- 员工可以查看自己相关的换班申请（作为申请人或目标人）
CREATE POLICY "员工查看相关的换班申请"
  ON shift_swap_requests
  FOR SELECT
  USING (
    requester_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR target_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- 员工可以创建换班申请
CREATE POLICY "员工创建换班申请"
  ON shift_swap_requests
  FOR INSERT
  WITH CHECK (
    requester_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- 员工可以取消自己的换班申请
CREATE POLICY "员工取消自己的换班申请"
  ON shift_swap_requests
  FOR UPDATE
  USING (
    requester_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    AND status = 'pending'::swap_request_status
  )
  WITH CHECK (
    status = 'cancelled'::swap_request_status
  );

-- 管理员可以查看所有换班申请
CREATE POLICY "管理员查看所有换班申请"
  ON shift_swap_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 管理员可以审批换班申请
CREATE POLICY "管理员审批换班申请"
  ON shift_swap_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_shift_swap_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shift_swap_requests_updated_at ON shift_swap_requests;

CREATE TRIGGER shift_swap_requests_updated_at
  BEFORE UPDATE ON shift_swap_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_shift_swap_requests_updated_at();
