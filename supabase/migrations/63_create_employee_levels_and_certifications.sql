/*
# 创建员工等级和认证表

## 1. 新建表
- employee_levels: 员工等级表
- employee_certifications: 员工认证表

## 2. 安全策略
- 启用RLS
- 员工可以查看自己的数据
- 管理员可以管理所有数据
*/

-- 创建员工等级表
CREATE TABLE IF NOT EXISTS employee_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  current_level TEXT NOT NULL DEFAULT '初级服务员',
  level_score INTEGER NOT NULL DEFAULT 0,
  next_level TEXT NOT NULL DEFAULT '中级服务员',
  next_level_score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id)
);

-- 创建员工认证表
CREATE TABLE IF NOT EXISTS employee_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  cert_name TEXT NOT NULL,
  cert_type TEXT NOT NULL,
  cert_level TEXT,
  obtain_date DATE NOT NULL,
  expire_date DATE,
  cert_status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_employee_levels_employee ON employee_levels(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_levels_tenant ON employee_levels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_certifications_employee ON employee_certifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON employee_certifications(cert_status);

-- 启用RLS
ALTER TABLE employee_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_certifications ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "员工查看自己的等级" ON employee_levels;
DROP POLICY IF EXISTS "管理员管理所有等级" ON employee_levels;
DROP POLICY IF EXISTS "员工查看自己的认证" ON employee_certifications;
DROP POLICY IF EXISTS "管理员管理所有认证" ON employee_certifications;

-- 员工等级策略
CREATE POLICY "员工查看自己的等级"
  ON employee_levels
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理所有等级"
  ON employee_levels
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 认证策略
CREATE POLICY "员工查看自己的认证"
  ON employee_certifications
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理所有认证"
  ON employee_certifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_employee_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_certifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employee_levels_updated_at ON employee_levels;
DROP TRIGGER IF EXISTS certifications_updated_at ON employee_certifications;

CREATE TRIGGER employee_levels_updated_at
  BEFORE UPDATE ON employee_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_levels_updated_at();

CREATE TRIGGER certifications_updated_at
  BEFORE UPDATE ON employee_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_certifications_updated_at();
