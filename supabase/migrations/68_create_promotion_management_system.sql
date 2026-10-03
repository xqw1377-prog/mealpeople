/*
# 创建晋升管理系统表

## 1. 新建表
- promotion_paths: 晋升路径表（定义职位晋升路径）
- promotion_requirements: 晋升条件表（晋升所需条件）
- promotion_applications: 晋升申请表（员工晋升申请）
- promotion_reviews: 晋升评审表（评审记录）
- promotion_history: 晋升历史表（晋升记录）

## 2. 安全策略
- 启用RLS
- 员工可以查看自己的晋升申请和历史
- 员工可以查看晋升路径和条件
- 管理员可以管理所有晋升数据
*/

-- 创建晋升路径表
CREATE TABLE IF NOT EXISTS promotion_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  from_position TEXT NOT NULL,
  to_position TEXT NOT NULL,
  from_level INTEGER NOT NULL,
  to_level INTEGER NOT NULL,
  min_tenure_months INTEGER NOT NULL DEFAULT 12,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, from_position, to_position),
  CHECK (to_level > from_level),
  CHECK (min_tenure_months >= 0)
);

-- 创建晋升条件表
CREATE TABLE IF NOT EXISTS promotion_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  promotion_path_id UUID NOT NULL REFERENCES promotion_paths(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL,
  requirement_name TEXT NOT NULL,
  requirement_value TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建晋升申请表
CREATE TABLE IF NOT EXISTS promotion_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  promotion_path_id UUID NOT NULL REFERENCES promotion_paths(id) ON DELETE CASCADE,
  current_position TEXT NOT NULL,
  target_position TEXT NOT NULL,
  current_level INTEGER NOT NULL,
  target_level INTEGER NOT NULL,
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  effective_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (target_level > current_level)
);

-- 创建晋升评审表
CREATE TABLE IF NOT EXISTS promotion_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES promotion_applications(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  review_result TEXT NOT NULL,
  review_score INTEGER,
  review_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (review_score >= 0 AND review_score <= 100)
);

-- 创建晋升历史表
CREATE TABLE IF NOT EXISTS promotion_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  application_id UUID REFERENCES promotion_applications(id) ON DELETE SET NULL,
  from_position TEXT NOT NULL,
  to_position TEXT NOT NULL,
  from_level INTEGER NOT NULL,
  to_level INTEGER NOT NULL,
  promotion_date DATE NOT NULL,
  promotion_type TEXT NOT NULL DEFAULT 'regular',
  salary_increase NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (to_level > from_level)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promotion_paths_tenant ON promotion_paths(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotion_paths_active ON promotion_paths(is_active);

CREATE INDEX IF NOT EXISTS idx_promotion_requirements_path ON promotion_requirements(promotion_path_id);

CREATE INDEX IF NOT EXISTS idx_promotion_applications_employee ON promotion_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_status ON promotion_applications(status);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_date ON promotion_applications(application_date);

CREATE INDEX IF NOT EXISTS idx_promotion_reviews_application ON promotion_reviews(application_id);
CREATE INDEX IF NOT EXISTS idx_promotion_reviews_reviewer ON promotion_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_promotion_history_employee ON promotion_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_promotion_history_date ON promotion_history(promotion_date);

-- 启用RLS
ALTER TABLE promotion_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_history ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "所有人查看活跃的晋升路径" ON promotion_paths;
DROP POLICY IF EXISTS "管理员管理晋升路径" ON promotion_paths;
DROP POLICY IF EXISTS "所有人查看晋升条件" ON promotion_requirements;
DROP POLICY IF EXISTS "管理员管理晋升条件" ON promotion_requirements;
DROP POLICY IF EXISTS "员工查看自己的晋升申请" ON promotion_applications;
DROP POLICY IF EXISTS "员工创建晋升申请" ON promotion_applications;
DROP POLICY IF EXISTS "管理员管理晋升申请" ON promotion_applications;
DROP POLICY IF EXISTS "评审人查看相关评审" ON promotion_reviews;
DROP POLICY IF EXISTS "管理员管理晋升评审" ON promotion_reviews;
DROP POLICY IF EXISTS "员工查看自己的晋升历史" ON promotion_history;
DROP POLICY IF EXISTS "管理员管理晋升历史" ON promotion_history;

-- 晋升路径策略
CREATE POLICY "所有人查看活跃的晋升路径"
  ON promotion_paths
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "管理员管理晋升路径"
  ON promotion_paths
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 晋升条件策略
CREATE POLICY "所有人查看晋升条件"
  ON promotion_requirements
  FOR SELECT
  USING (true);

CREATE POLICY "管理员管理晋升条件"
  ON promotion_requirements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 晋升申请策略
CREATE POLICY "员工查看自己的晋升申请"
  ON promotion_applications
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "员工创建晋升申请"
  ON promotion_applications
  FOR INSERT
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理晋升申请"
  ON promotion_applications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 晋升评审策略
CREATE POLICY "评审人查看相关评审"
  ON promotion_reviews
  FOR SELECT
  USING (
    reviewer_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理晋升评审"
  ON promotion_reviews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 晋升历史策略
CREATE POLICY "员工查看自己的晋升历史"
  ON promotion_history
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理晋升历史"
  ON promotion_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_promotion_paths_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_promotion_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_promotion_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_promotion_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_promotion_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS promotion_paths_updated_at ON promotion_paths;
DROP TRIGGER IF EXISTS promotion_requirements_updated_at ON promotion_requirements;
DROP TRIGGER IF EXISTS promotion_applications_updated_at ON promotion_applications;
DROP TRIGGER IF EXISTS promotion_reviews_updated_at ON promotion_reviews;
DROP TRIGGER IF EXISTS promotion_history_updated_at ON promotion_history;

CREATE TRIGGER promotion_paths_updated_at
  BEFORE UPDATE ON promotion_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_paths_updated_at();

CREATE TRIGGER promotion_requirements_updated_at
  BEFORE UPDATE ON promotion_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_requirements_updated_at();

CREATE TRIGGER promotion_applications_updated_at
  BEFORE UPDATE ON promotion_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_applications_updated_at();

CREATE TRIGGER promotion_reviews_updated_at
  BEFORE UPDATE ON promotion_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_reviews_updated_at();

CREATE TRIGGER promotion_history_updated_at
  BEFORE UPDATE ON promotion_history
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_history_updated_at();

-- 创建自动生成晋升历史的触发器
CREATE OR REPLACE FUNCTION create_promotion_history_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- 当晋升申请被批准时，自动创建晋升历史记录
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO promotion_history (
      tenant_id,
      employee_id,
      application_id,
      from_position,
      to_position,
      from_level,
      to_level,
      promotion_date,
      promotion_type,
      notes
    ) VALUES (
      NEW.tenant_id,
      NEW.employee_id,
      NEW.id,
      NEW.current_position,
      NEW.target_position,
      NEW.current_level,
      NEW.target_level,
      COALESCE(NEW.effective_date, CURRENT_DATE),
      'regular',
      '通过晋升申请自动生成'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_promotion_history_trigger ON promotion_applications;

CREATE TRIGGER create_promotion_history_trigger
  AFTER UPDATE ON promotion_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_promotion_history_on_approval();
