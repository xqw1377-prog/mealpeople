/*
# 创建加班管理系统表

## 1. 新建表
- overtime_types: 加班类型表（工作日加班、周末加班、节假日加班等）
- overtime_requests: 加班申请表
- overtime_compensations: 加班补偿表（调休、加班费等）

## 2. 安全策略
- 启用RLS
- 员工可以查看和创建自己的加班申请
- 管理员可以管理所有加班数据
*/

-- 创建加班类型表
CREATE TABLE IF NOT EXISTS overtime_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type_name TEXT NOT NULL,
  type_code TEXT NOT NULL,
  description TEXT,
  rate NUMERIC(3,2) NOT NULL DEFAULT 1.5,
  can_compensate BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, type_code)
);

-- 创建加班申请表
CREATE TABLE IF NOT EXISTS overtime_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  overtime_type_id UUID NOT NULL REFERENCES overtime_types(id) ON DELETE CASCADE,
  overtime_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours NUMERIC(4,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (end_time > start_time),
  CHECK (hours > 0)
);

-- 创建加班补偿表
CREATE TABLE IF NOT EXISTS overtime_compensations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  overtime_request_id UUID NOT NULL REFERENCES overtime_requests(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  compensation_type TEXT NOT NULL,
  hours NUMERIC(4,2) NOT NULL,
  amount NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'pending',
  used_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (hours > 0)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_overtime_types_tenant ON overtime_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_overtime_types_active ON overtime_types(is_active);

CREATE INDEX IF NOT EXISTS idx_overtime_requests_employee ON overtime_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_requests_status ON overtime_requests(status);
CREATE INDEX IF NOT EXISTS idx_overtime_requests_date ON overtime_requests(overtime_date);

CREATE INDEX IF NOT EXISTS idx_overtime_compensations_employee ON overtime_compensations(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_compensations_status ON overtime_compensations(status);

-- 启用RLS
ALTER TABLE overtime_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_compensations ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "所有人查看活跃的加班类型" ON overtime_types;
DROP POLICY IF EXISTS "管理员管理加班类型" ON overtime_types;
DROP POLICY IF EXISTS "员工查看自己的加班申请" ON overtime_requests;
DROP POLICY IF EXISTS "员工创建自己的加班申请" ON overtime_requests;
DROP POLICY IF EXISTS "员工更新自己的待审批加班" ON overtime_requests;
DROP POLICY IF EXISTS "管理员管理所有加班申请" ON overtime_requests;
DROP POLICY IF EXISTS "员工查看自己的加班补偿" ON overtime_compensations;
DROP POLICY IF EXISTS "管理员管理加班补偿" ON overtime_compensations;

-- 加班类型策略
CREATE POLICY "所有人查看活跃的加班类型"
  ON overtime_types
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "管理员管理加班类型"
  ON overtime_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 加班申请策略
CREATE POLICY "员工查看自己的加班申请"
  ON overtime_requests
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "员工创建自己的加班申请"
  ON overtime_requests
  FOR INSERT
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "员工更新自己的待审批加班"
  ON overtime_requests
  FOR UPDATE
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "管理员管理所有加班申请"
  ON overtime_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 加班补偿策略
CREATE POLICY "员工查看自己的加班补偿"
  ON overtime_compensations
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理加班补偿"
  ON overtime_compensations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_overtime_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_overtime_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_overtime_compensations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS overtime_types_updated_at ON overtime_types;
DROP TRIGGER IF EXISTS overtime_requests_updated_at ON overtime_requests;
DROP TRIGGER IF EXISTS overtime_compensations_updated_at ON overtime_compensations;

CREATE TRIGGER overtime_types_updated_at
  BEFORE UPDATE ON overtime_types
  FOR EACH ROW
  EXECUTE FUNCTION update_overtime_types_updated_at();

CREATE TRIGGER overtime_requests_updated_at
  BEFORE UPDATE ON overtime_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_overtime_requests_updated_at();

CREATE TRIGGER overtime_compensations_updated_at
  BEFORE UPDATE ON overtime_compensations
  FOR EACH ROW
  EXECUTE FUNCTION update_overtime_compensations_updated_at();

-- 创建自动生成补偿记录的触发器
CREATE OR REPLACE FUNCTION create_overtime_compensation()
RETURNS TRIGGER AS $$
DECLARE
  v_overtime_type overtime_types%ROWTYPE;
BEGIN
  -- 当加班申请被批准时，自动创建补偿记录
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- 获取加班类型信息
    SELECT * INTO v_overtime_type
    FROM overtime_types
    WHERE id = NEW.overtime_type_id;
    
    -- 如果允许补偿，创建补偿记录
    IF v_overtime_type.can_compensate THEN
      INSERT INTO overtime_compensations (
        tenant_id,
        overtime_request_id,
        employee_id,
        compensation_type,
        hours,
        status
      ) VALUES (
        NEW.tenant_id,
        NEW.id,
        NEW.employee_id,
        'time_off',
        NEW.hours * v_overtime_type.rate,
        'available'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS overtime_compensation_create ON overtime_requests;

CREATE TRIGGER overtime_compensation_create
  AFTER UPDATE ON overtime_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_overtime_compensation();
