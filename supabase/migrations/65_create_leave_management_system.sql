/*
# 创建请假管理系统表

## 1. 新建表
- leave_types: 请假类型表（年假、病假、事假等）
- leave_balances: 员工假期余额表
- leave_requests: 请假申请表

## 2. 安全策略
- 启用RLS
- 员工可以查看和创建自己的请假申请
- 管理员可以管理所有请假数据
*/

-- 创建请假类型表
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type_name TEXT NOT NULL,
  type_code TEXT NOT NULL,
  description TEXT,
  max_days_per_year INTEGER,
  requires_approval BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, type_code)
);

-- 创建员工假期余额表
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  used_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  remaining_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, leave_type_id, year)
);

-- 创建请假申请表
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(5,1) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (end_date >= start_date),
  CHECK (days > 0)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_leave_types_tenant ON leave_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_types_active ON leave_types(is_active);

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON leave_balances(year);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- 启用RLS
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "所有人查看活跃的请假类型" ON leave_types;
DROP POLICY IF EXISTS "管理员管理请假类型" ON leave_types;
DROP POLICY IF EXISTS "员工查看自己的假期余额" ON leave_balances;
DROP POLICY IF EXISTS "管理员管理假期余额" ON leave_balances;
DROP POLICY IF EXISTS "员工查看自己的请假申请" ON leave_requests;
DROP POLICY IF EXISTS "员工创建自己的请假申请" ON leave_requests;
DROP POLICY IF EXISTS "员工更新自己的待审批请假" ON leave_requests;
DROP POLICY IF EXISTS "管理员管理所有请假申请" ON leave_requests;

-- 请假类型策略
CREATE POLICY "所有人查看活跃的请假类型"
  ON leave_types
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "管理员管理请假类型"
  ON leave_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 假期余额策略
CREATE POLICY "员工查看自己的假期余额"
  ON leave_balances
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理假期余额"
  ON leave_balances
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 请假申请策略
CREATE POLICY "员工查看自己的请假申请"
  ON leave_requests
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "员工创建自己的请假申请"
  ON leave_requests
  FOR INSERT
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "员工更新自己的待审批请假"
  ON leave_requests
  FOR UPDATE
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "管理员管理所有请假申请"
  ON leave_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_leave_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_leave_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_types_updated_at ON leave_types;
DROP TRIGGER IF EXISTS leave_balances_updated_at ON leave_balances;
DROP TRIGGER IF EXISTS leave_requests_updated_at ON leave_requests;

CREATE TRIGGER leave_types_updated_at
  BEFORE UPDATE ON leave_types
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_types_updated_at();

CREATE TRIGGER leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balances_updated_at();

CREATE TRIGGER leave_requests_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_requests_updated_at();

-- 创建自动更新余额的触发器
CREATE OR REPLACE FUNCTION update_leave_balance_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- 当请假申请被批准时，更新假期余额
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE leave_balances
    SET 
      used_days = used_days + NEW.days,
      remaining_days = total_days - (used_days + NEW.days)
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;
  
  -- 当请假申请被拒绝或取消时，如果之前是批准状态，需要恢复余额
  IF (NEW.status = 'rejected' OR NEW.status = 'cancelled') AND OLD.status = 'approved' THEN
    UPDATE leave_balances
    SET 
      used_days = used_days - NEW.days,
      remaining_days = total_days - (used_days - NEW.days)
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_balance_update ON leave_requests;

CREATE TRIGGER leave_balance_update
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance_on_approval();
