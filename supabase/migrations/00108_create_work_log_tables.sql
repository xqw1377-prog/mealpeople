/*
# 工作记录系统数据库设计

## 1. 新增表

### work_log_categories (工作记录类别表)
- `id` (uuid, primary key) - 类别ID
- `tenant_id` (uuid, foreign key) - 租户ID
- `name` (text) - 类别名称
- `icon` (text) - 图标类名
- `color` (text) - 颜色代码
- `sort_order` (integer) - 排序顺序
- `is_active` (boolean) - 是否启用
- `created_at` (timestamptz) - 创建时间
- `updated_at` (timestamptz) - 更新时间

### work_records (工作记录表)
- `id` (uuid, primary key) - 记录ID
- `tenant_id` (uuid, foreign key) - 租户ID
- `employee_id` (uuid, foreign key) - 员工ID
- `category_id` (uuid, foreign key) - 类别ID
- `content` (text) - 记录内容
- `images` (text[]) - 照片URL数组
- `videos` (text[]) - 视频URL数组
- `voice_duration` (integer) - 语音时长（秒）
- `created_at` (timestamptz) - 创建时间
- `updated_at` (timestamptz) - 更新时间

## 2. 安全策略
- 启用RLS
- 员工可以查看和创建自己的记录
- 管理员可以查看所有记录
- 管理员可以管理类别

## 3. 索引
- 按租户ID和员工ID查询记录
- 按租户ID查询类别
- 按创建时间排序

## 4. 默认数据
- 插入8个预设类别
*/

-- 创建工作记录类别表
CREATE TABLE IF NOT EXISTS work_log_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建工作记录表
CREATE TABLE IF NOT EXISTS work_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES work_log_categories(id) ON DELETE RESTRICT,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  voice_duration INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_work_log_categories_tenant ON work_log_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_log_categories_active ON work_log_categories(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_work_records_tenant ON work_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_records_employee ON work_records(tenant_id, employee_id);
CREATE INDEX IF NOT EXISTS idx_work_records_category ON work_records(category_id);
CREATE INDEX IF NOT EXISTS idx_work_records_created ON work_records(tenant_id, created_at DESC);

-- 启用RLS
ALTER TABLE work_log_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;

-- 工作记录类别的RLS策略
-- 所有员工可以查看启用的类别
CREATE POLICY "员工可以查看启用的类别" ON work_log_categories
  FOR SELECT
  USING (is_active = true);

-- 管理员可以管理类别
CREATE POLICY "管理员可以管理类别" ON work_log_categories
  FOR ALL
  USING (is_admin(auth.uid()));

-- 工作记录的RLS策略
-- 员工可以查看自己的记录
CREATE POLICY "员工可以查看自己的记录" ON work_records
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 员工可以创建自己的记录
CREATE POLICY "员工可以创建自己的记录" ON work_records
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 员工可以更新自己的记录
CREATE POLICY "员工可以更新自己的记录" ON work_records
  FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 管理员可以查看所有记录
CREATE POLICY "管理员可以查看所有记录" ON work_records
  FOR SELECT
  USING (is_admin(auth.uid()));

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_work_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_work_log_categories_updated_at
  BEFORE UPDATE ON work_log_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_work_log_updated_at();

CREATE TRIGGER update_work_records_updated_at
  BEFORE UPDATE ON work_records
  FOR EACH ROW
  EXECUTE FUNCTION update_work_log_updated_at();