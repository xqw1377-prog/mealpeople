/*
# 创建薪酬福利管理系统表

## 1. 新建表
- salary_structures: 薪酬结构表（基本工资、绩效工资、津贴等）
- salary_records: 工资记录表（每月工资单）
- benefit_types: 福利类型表（五险一金、商业保险、补贴等）
- employee_benefits: 员工福利表（员工享有的福利）
- benefit_usage_records: 福利使用记录表

## 2. 安全策略
- 启用RLS
- 员工只能查看自己的薪酬福利数据
- 管理员可以管理所有薪酬福利数据
*/

-- 创建薪酬结构表
CREATE TABLE IF NOT EXISTS salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  base_salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  performance_salary NUMERIC(10,2) DEFAULT 0,
  position_allowance NUMERIC(10,2) DEFAULT 0,
  meal_allowance NUMERIC(10,2) DEFAULT 0,
  transport_allowance NUMERIC(10,2) DEFAULT 0,
  housing_allowance NUMERIC(10,2) DEFAULT 0,
  other_allowance NUMERIC(10,2) DEFAULT 0,
  effective_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (base_salary >= 0)
);

-- 创建工资记录表
CREATE TABLE IF NOT EXISTS salary_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  base_salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  performance_salary NUMERIC(10,2) DEFAULT 0,
  allowances NUMERIC(10,2) DEFAULT 0,
  overtime_pay NUMERIC(10,2) DEFAULT 0,
  bonus NUMERIC(10,2) DEFAULT 0,
  deductions NUMERIC(10,2) DEFAULT 0,
  social_insurance NUMERIC(10,2) DEFAULT 0,
  housing_fund NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  net_salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, year, month),
  CHECK (year >= 2000 AND year <= 2100),
  CHECK (month >= 1 AND month <= 12)
);

-- 创建福利类型表
CREATE TABLE IF NOT EXISTS benefit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type_name TEXT NOT NULL,
  type_code TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, type_code)
);

-- 创建员工福利表
CREATE TABLE IF NOT EXISTS employee_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  benefit_type_id UUID NOT NULL REFERENCES benefit_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  amount NUMERIC(10,2),
  quota NUMERIC(10,2),
  used_quota NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, benefit_type_id, start_date)
);

-- 创建福利使用记录表
CREATE TABLE IF NOT EXISTS benefit_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_benefit_id UUID NOT NULL REFERENCES employee_benefits(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (amount > 0)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_salary_structures_employee ON salary_structures(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_active ON salary_structures(is_active);

CREATE INDEX IF NOT EXISTS idx_salary_records_employee ON salary_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_records_year_month ON salary_records(year, month);
CREATE INDEX IF NOT EXISTS idx_salary_records_status ON salary_records(status);

CREATE INDEX IF NOT EXISTS idx_benefit_types_tenant ON benefit_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_benefit_types_active ON benefit_types(is_active);

CREATE INDEX IF NOT EXISTS idx_employee_benefits_employee ON employee_benefits(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_benefits_status ON employee_benefits(status);

CREATE INDEX IF NOT EXISTS idx_benefit_usage_records_employee ON benefit_usage_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_benefit_usage_records_date ON benefit_usage_records(usage_date);

-- 启用RLS
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_usage_records ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "员工查看自己的薪酬结构" ON salary_structures;
DROP POLICY IF EXISTS "管理员管理薪酬结构" ON salary_structures;
DROP POLICY IF EXISTS "员工查看自己的工资记录" ON salary_records;
DROP POLICY IF EXISTS "管理员管理工资记录" ON salary_records;
DROP POLICY IF EXISTS "所有人查看活跃的福利类型" ON benefit_types;
DROP POLICY IF EXISTS "管理员管理福利类型" ON benefit_types;
DROP POLICY IF EXISTS "员工查看自己的福利" ON employee_benefits;
DROP POLICY IF EXISTS "管理员管理员工福利" ON employee_benefits;
DROP POLICY IF EXISTS "员工查看自己的福利使用记录" ON benefit_usage_records;
DROP POLICY IF EXISTS "管理员管理福利使用记录" ON benefit_usage_records;

-- 薪酬结构策略
CREATE POLICY "员工查看自己的薪酬结构"
  ON salary_structures
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理薪酬结构"
  ON salary_structures
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 工资记录策略
CREATE POLICY "员工查看自己的工资记录"
  ON salary_records
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理工资记录"
  ON salary_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 福利类型策略
CREATE POLICY "所有人查看活跃的福利类型"
  ON benefit_types
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "管理员管理福利类型"
  ON benefit_types
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 员工福利策略
CREATE POLICY "员工查看自己的福利"
  ON employee_benefits
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理员工福利"
  ON employee_benefits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 福利使用记录策略
CREATE POLICY "员工查看自己的福利使用记录"
  ON benefit_usage_records
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理福利使用记录"
  ON benefit_usage_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_salary_structures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_salary_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_benefit_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_employee_benefits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_benefit_usage_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS salary_structures_updated_at ON salary_structures;
DROP TRIGGER IF EXISTS salary_records_updated_at ON salary_records;
DROP TRIGGER IF EXISTS benefit_types_updated_at ON benefit_types;
DROP TRIGGER IF EXISTS employee_benefits_updated_at ON employee_benefits;
DROP TRIGGER IF EXISTS benefit_usage_records_updated_at ON benefit_usage_records;

CREATE TRIGGER salary_structures_updated_at
  BEFORE UPDATE ON salary_structures
  FOR EACH ROW
  EXECUTE FUNCTION update_salary_structures_updated_at();

CREATE TRIGGER salary_records_updated_at
  BEFORE UPDATE ON salary_records
  FOR EACH ROW
  EXECUTE FUNCTION update_salary_records_updated_at();

CREATE TRIGGER benefit_types_updated_at
  BEFORE UPDATE ON benefit_types
  FOR EACH ROW
  EXECUTE FUNCTION update_benefit_types_updated_at();

CREATE TRIGGER employee_benefits_updated_at
  BEFORE UPDATE ON employee_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_benefits_updated_at();

CREATE TRIGGER benefit_usage_records_updated_at
  BEFORE UPDATE ON benefit_usage_records
  FOR EACH ROW
  EXECUTE FUNCTION update_benefit_usage_records_updated_at();
