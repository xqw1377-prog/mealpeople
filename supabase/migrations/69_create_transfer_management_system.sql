/*
# 创建调岗管理系统表

## 1. 新建表
- transfer_positions: 可调岗位表（定义可调岗位信息）
- transfer_requirements: 调岗条件表（调岗所需条件）
- transfer_applications: 调岗申请表（员工调岗申请）
- transfer_reviews: 调岗评审表（评审记录）
- transfer_history: 调岗历史表（调岗记录）

## 2. 安全策略
- 启用RLS
- 员工可以查看自己的调岗申请和历史
- 员工可以查看可调岗位和条件
- 管理员可以管理所有调岗数据
*/

-- 创建可调岗位表
CREATE TABLE IF NOT EXISTS transfer_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  position_name TEXT NOT NULL,
  department TEXT NOT NULL,
  level INTEGER NOT NULL,
  description TEXT,
  requirements TEXT,
  available_slots INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (available_slots >= 0)
);

-- 创建调岗条件表
CREATE TABLE IF NOT EXISTS transfer_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transfer_position_id UUID NOT NULL REFERENCES transfer_positions(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL,
  requirement_name TEXT NOT NULL,
  requirement_value TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建调岗申请表
CREATE TABLE IF NOT EXISTS transfer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  transfer_position_id UUID NOT NULL REFERENCES transfer_positions(id) ON DELETE CASCADE,
  current_position TEXT NOT NULL,
  current_department TEXT NOT NULL,
  current_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  target_position TEXT NOT NULL,
  target_department TEXT NOT NULL,
  target_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  effective_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建调岗评审表
CREATE TABLE IF NOT EXISTS transfer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES transfer_applications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_result TEXT NOT NULL,
  review_score INTEGER,
  review_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (review_score >= 0 AND review_score <= 100)
);

-- 创建调岗历史表
CREATE TABLE IF NOT EXISTS transfer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  application_id UUID REFERENCES transfer_applications(id) ON DELETE SET NULL,
  from_position TEXT NOT NULL,
  to_position TEXT NOT NULL,
  from_department TEXT NOT NULL,
  to_department TEXT NOT NULL,
  from_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  to_store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  transfer_date DATE NOT NULL,
  transfer_type TEXT NOT NULL DEFAULT 'regular',
  salary_change NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transfer_positions_tenant ON transfer_positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfer_positions_store ON transfer_positions(store_id);
CREATE INDEX IF NOT EXISTS idx_transfer_positions_active ON transfer_positions(is_active);

CREATE INDEX IF NOT EXISTS idx_transfer_requirements_position ON transfer_requirements(transfer_position_id);

CREATE INDEX IF NOT EXISTS idx_transfer_applications_employee ON transfer_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_transfer_applications_status ON transfer_applications(status);
CREATE INDEX IF NOT EXISTS idx_transfer_applications_date ON transfer_applications(application_date);

CREATE INDEX IF NOT EXISTS idx_transfer_reviews_application ON transfer_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_transfer_reviews_reviewer ON transfer_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_transfer_history_employee ON transfer_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_transfer_history_date ON transfer_history(transfer_date);

-- 启用RLS
ALTER TABLE transfer_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_history ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "所有人查看活跃的可调岗位" ON transfer_positions;
DROP POLICY IF EXISTS "管理员管理可调岗位" ON transfer_positions;
DROP POLICY IF EXISTS "所有人查看调岗条件" ON transfer_requirements;
DROP POLICY IF EXISTS "管理员管理调岗条件" ON transfer_requirements;
DROP POLICY IF EXISTS "员工查看自己的调岗申请" ON transfer_applications;
DROP POLICY IF EXISTS "员工创建调岗申请" ON transfer_applications;
DROP POLICY IF EXISTS "管理员管理调岗申请" ON transfer_applications;
DROP POLICY IF EXISTS "评审人查看相关评审" ON transfer_reviews;
DROP POLICY IF EXISTS "管理员管理调岗评审" ON transfer_reviews;
DROP POLICY IF EXISTS "员工查看自己的调岗历史" ON transfer_history;
DROP POLICY IF EXISTS "管理员管理调岗历史" ON transfer_history;

-- 可调岗位策略
CREATE POLICY "所有人查看活跃的可调岗位"
  ON transfer_positions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "管理员管理可调岗位"
  ON transfer_positions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 调岗条件策略
CREATE POLICY "所有人查看调岗条件"
  ON transfer_requirements
  FOR SELECT
  USING (true);

CREATE POLICY "管理员管理调岗条件"
  ON transfer_requirements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 调岗申请策略
CREATE POLICY "员工查看自己的调岗申请"
  ON transfer_applications
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "员工创建调岗申请"
  ON transfer_applications
  FOR INSERT
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理调岗申请"
  ON transfer_applications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 调岗评审策略
CREATE POLICY "评审人查看相关评审"
  ON transfer_reviews
  FOR SELECT
  USING (
    reviewer_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理调岗评审"
  ON transfer_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 调岗历史策略
CREATE POLICY "员工查看自己的调岗历史"
  ON transfer_history
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理调岗历史"
  ON transfer_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_transfer_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_transfer_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_transfer_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_transfer_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_transfer_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transfer_positions_updated_at ON transfer_positions;
DROP TRIGGER IF EXISTS transfer_requirements_updated_at ON transfer_requirements;
DROP TRIGGER IF EXISTS transfer_applications_updated_at ON transfer_applications;
DROP TRIGGER IF EXISTS transfer_reviews_updated_at ON transfer_reviews;
DROP TRIGGER IF EXISTS transfer_history_updated_at ON transfer_history;

CREATE TRIGGER transfer_positions_updated_at
  BEFORE UPDATE ON transfer_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_positions_updated_at();

CREATE TRIGGER transfer_requirements_updated_at
  BEFORE UPDATE ON transfer_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_requirements_updated_at();

CREATE TRIGGER transfer_applications_updated_at
  BEFORE UPDATE ON transfer_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_applications_updated_at();

CREATE TRIGGER transfer_reviews_updated_at
  BEFORE UPDATE ON transfer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_reviews_updated_at();

CREATE TRIGGER transfer_history_updated_at
  BEFORE UPDATE ON transfer_history
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_history_updated_at();

-- 创建自动生成调岗历史的触发器
CREATE OR REPLACE FUNCTION create_transfer_history_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- 当调岗申请被批准时，自动创建调岗历史记录
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO transfer_history (
      tenant_id,
      employee_id,
      application_id,
      from_position,
      to_position,
      from_department,
      to_department,
      from_store_id,
      to_store_id,
      transfer_date,
      transfer_type,
      notes
    ) VALUES (
      NEW.tenant_id,
      NEW.employee_id,
      NEW.id,
      NEW.current_position,
      NEW.target_position,
      NEW.current_department,
      NEW.target_department,
      NEW.current_store_id,
      NEW.target_store_id,
      COALESCE(NEW.effective_date, CURRENT_DATE),
      'regular',
      '通过调岗申请自动生成'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_transfer_history_trigger ON transfer_applications;

CREATE TRIGGER create_transfer_history_trigger
  AFTER UPDATE ON transfer_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_transfer_history_on_approval();
