/*
# 创建绩效管理系统表

## 1. 新建表
- employee_performance: 员工绩效记录表
- performance_goals: 绩效目标表
- performance_improvements: 绩效改进计划表

## 2. 安全策略
- 启用RLS
- 员工可以查看自己的绩效数据
- 管理员可以管理所有绩效数据
*/

-- 创建员工绩效记录表
CREATE TABLE IF NOT EXISTS employee_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL,
  overall_score NUMERIC(3,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 5),
  service_score NUMERIC(3,1) CHECK (service_score >= 0 AND service_score <= 5),
  efficiency_score NUMERIC(3,1) CHECK (efficiency_score >= 0 AND efficiency_score <= 5),
  teamwork_score NUMERIC(3,1) CHECK (teamwork_score >= 0 AND teamwork_score <= 5),
  attendance_score NUMERIC(3,1) CHECK (attendance_score >= 0 AND attendance_score <= 5),
  rank_in_store INTEGER,
  rank_in_company INTEGER,
  evaluator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  evaluation_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, period_year, period_month)
);

-- 创建绩效目标表
CREATE TABLE IF NOT EXISTS performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  goal_title TEXT NOT NULL,
  goal_description TEXT,
  goal_type TEXT NOT NULL,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  completion_rate INTEGER DEFAULT 0 CHECK (completion_rate >= 0 AND completion_rate <= 100),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建绩效改进计划表
CREATE TABLE IF NOT EXISTS performance_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  performance_id UUID REFERENCES employee_performance(id) ON DELETE CASCADE,
  improvement_area TEXT NOT NULL,
  current_situation TEXT,
  improvement_plan TEXT NOT NULL,
  expected_result TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'planning',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  mentor_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_performance_employee ON employee_performance(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_period ON employee_performance(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_performance_status ON employee_performance(status);

CREATE INDEX IF NOT EXISTS idx_goals_employee ON performance_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON performance_goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_dates ON performance_goals(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_improvements_employee ON performance_improvements(employee_id);
CREATE INDEX IF NOT EXISTS idx_improvements_status ON performance_improvements(status);
CREATE INDEX IF NOT EXISTS idx_improvements_performance ON performance_improvements(performance_id);

-- 启用RLS
ALTER TABLE employee_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_improvements ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "员工查看自己的绩效" ON employee_performance;
DROP POLICY IF EXISTS "管理员管理所有绩效" ON employee_performance;
DROP POLICY IF EXISTS "员工查看自己的目标" ON performance_goals;
DROP POLICY IF EXISTS "管理员管理所有目标" ON performance_goals;
DROP POLICY IF EXISTS "员工查看自己的改进计划" ON performance_improvements;
DROP POLICY IF EXISTS "员工更新自己的改进计划" ON performance_improvements;
DROP POLICY IF EXISTS "管理员管理所有改进计划" ON performance_improvements;

-- 绩效记录策略
CREATE POLICY "员工查看自己的绩效"
  ON employee_performance
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理所有绩效"
  ON employee_performance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 绩效目标策略
CREATE POLICY "员工查看自己的目标"
  ON performance_goals
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理所有目标"
  ON performance_goals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 改进计划策略
CREATE POLICY "员工查看自己的改进计划"
  ON performance_improvements
  FOR SELECT
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "员工更新自己的改进计划"
  ON performance_improvements
  FOR UPDATE
  USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

CREATE POLICY "管理员管理所有改进计划"
  ON performance_improvements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_improvements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS performance_updated_at ON employee_performance;
DROP TRIGGER IF EXISTS goals_updated_at ON performance_goals;
DROP TRIGGER IF EXISTS improvements_updated_at ON performance_improvements;

CREATE TRIGGER performance_updated_at
  BEFORE UPDATE ON employee_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_updated_at();

CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON performance_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();

CREATE TRIGGER improvements_updated_at
  BEFORE UPDATE ON performance_improvements
  FOR EACH ROW
  EXECUTE FUNCTION update_improvements_updated_at();
