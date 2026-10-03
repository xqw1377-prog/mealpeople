/*
# 创建员工班次表

## 1. 新建表
- `employee_shifts` - 员工班次表
  - `id` (uuid, 主键)
  - `tenant_id` (uuid, 租户ID)
  - `employee_id` (uuid, 员工ID)
  - `store_id` (uuid, 门店ID)
  - `shift_date` (date, 班次日期)
  - `shift_type` (text, 班次类型: morning/afternoon/evening/night/rest)
  - `start_time` (time, 开始时间)
  - `end_time` (time, 结束时间)
  - `work_hours` (numeric, 工作时长)
  - `position` (text, 岗位)
  - `status` (text, 状态: scheduled/confirmed/completed/cancelled)
  - `notes` (text, 备注)
  - `created_at` (timestamptz, 创建时间)
  - `updated_at` (timestamptz, 更新时间)

## 2. 安全策略
- 启用RLS
- 员工可以查看自己的班次
- 管理员可以管理所有班次
*/

-- 创建班次类型枚举
DO $$ BEGIN
  CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'evening', 'night', 'rest');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建班次状态枚举
DO $$ BEGIN
  CREATE TYPE shift_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建员工班次表
CREATE TABLE IF NOT EXISTS employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  
  -- 班次信息
  shift_date DATE NOT NULL,
  shift_type shift_type NOT NULL,
  start_time TIME,
  end_time TIME,
  work_hours NUMERIC(4,2) DEFAULT 0,
  position TEXT,
  
  -- 状态和备注
  status shift_status DEFAULT 'scheduled'::shift_status,
  notes TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一约束：同一员工同一天只能有一个班次
  UNIQUE(employee_id, shift_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_date ON employee_shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_tenant ON employee_shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_store ON employee_shifts(store_id);

-- 启用RLS
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "员工查看自己的班次" ON employee_shifts;
DROP POLICY IF EXISTS "管理员查看所有班次" ON employee_shifts;
DROP POLICY IF EXISTS "管理员插入班次" ON employee_shifts;
DROP POLICY IF EXISTS "管理员更新班次" ON employee_shifts;
DROP POLICY IF EXISTS "管理员删除班次" ON employee_shifts;

-- 员工可以查看自己的班次
CREATE POLICY "员工查看自己的班次"
  ON employee_shifts
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 管理员可以查看所有班次
CREATE POLICY "管理员查看所有班次"
  ON employee_shifts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 管理员可以插入班次
CREATE POLICY "管理员插入班次"
  ON employee_shifts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 管理员可以更新班次
CREATE POLICY "管理员更新班次"
  ON employee_shifts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 管理员可以删除班次
CREATE POLICY "管理员删除班次"
  ON employee_shifts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('tenant_admin'::user_role, 'store_manager'::user_role)
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_employee_shifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employee_shifts_updated_at ON employee_shifts;

CREATE TRIGGER employee_shifts_updated_at
  BEFORE UPDATE ON employee_shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_shifts_updated_at();
