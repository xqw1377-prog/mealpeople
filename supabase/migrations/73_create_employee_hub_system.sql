/*
# 员工中心系统数据库设计

## 1. 概述
员工中心是HR管理员查看和管理所有员工的核心页面，提供员工档案、在职状态、绩效概览等功能。

## 2. 表结构设计

### 2.1 employees（员工档案表）
存储员工的基本信息和档案
- `id` (uuid): 主键
- `user_id` (uuid): 关联用户ID
- `employee_no` (text): 工号
- `name` (text): 姓名
- `gender` (text): 性别
- `birth_date` (date): 出生日期
- `phone` (text): 手机号
- `email` (text): 邮箱
- `id_card` (text): 身份证号
- `department` (text): 部门
- `position` (text): 岗位
- `level` (text): 职级
- `employment_type` (text): 用工类型（全职/兼职/实习）
- `entry_date` (date): 入职日期
- `probation_end_date` (date): 试用期结束日期
- `contract_start_date` (date): 合同开始日期
- `contract_end_date` (date): 合同结束日期
- `status` (text): 在职状态（active/on_leave/resigned）
- `avatar_url` (text): 头像URL
- `emergency_contact` (text): 紧急联系人
- `emergency_phone` (text): 紧急联系电话
- `address` (text): 住址
- `bank_account` (text): 银行账号
- `bank_name` (text): 开户行
- `created_at` (timestamptz): 创建时间
- `updated_at` (timestamptz): 更新时间

### 2.2 employee_tags（员工标签表）
为员工添加标签，便于分类管理
- `id` (uuid): 主键
- `employee_id` (uuid): 员工ID
- `tag_name` (text): 标签名称
- `tag_color` (text): 标签颜色
- `created_at` (timestamptz): 创建时间

### 2.3 employee_notes（员工备注表）
HR对员工的备注记录
- `id` (uuid): 主键
- `employee_id` (uuid): 员工ID
- `note_content` (text): 备注内容
- `note_type` (text): 备注类型（general/performance/discipline/other）
- `created_by` (uuid): 创建人ID
- `created_at` (timestamptz): 创建时间

## 3. 安全策略
- 仅管理员可以查看和管理员工档案
- 员工只能查看自己的档案信息
- 敏感信息（身份证、银行账号）需要特殊权限

## 4. 索引优化
- employee_no索引：快速查询工号
- department索引：按部门筛选
- status索引：按在职状态筛选
- name索引：按姓名搜索

*/

-- ============================================
-- 1. 创建枚举类型
-- ============================================

-- 性别
DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 用工类型
DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'intern', 'contract');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 员工状态
DO $$ BEGIN
  CREATE TYPE employee_status AS ENUM ('active', 'on_leave', 'resigned', 'terminated');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 备注类型
DO $$ BEGIN
  CREATE TYPE note_type AS ENUM ('general', 'performance', 'discipline', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. 创建表
-- ============================================

-- 2.1 员工档案表
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  employee_no text UNIQUE NOT NULL,
  name text NOT NULL,
  gender gender_type,
  birth_date date,
  phone text,
  email text,
  id_card text,
  department text,
  position text,
  level text,
  employment_type employment_type DEFAULT 'full_time',
  entry_date date NOT NULL,
  probation_end_date date,
  contract_start_date date,
  contract_end_date date,
  status employee_status DEFAULT 'active',
  avatar_url text,
  emergency_contact text,
  emergency_phone text,
  address text,
  bank_account text,
  bank_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.2 员工标签表
CREATE TABLE IF NOT EXISTS employee_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  tag_name text NOT NULL,
  tag_color text DEFAULT '#3B82F6',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.3 员工备注表
CREATE TABLE IF NOT EXISTS employee_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  note_content text NOT NULL,
  note_type note_type DEFAULT 'general',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 3. 创建索引
-- ============================================

CREATE INDEX idx_employees_employee_no ON employees(employee_no);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_name ON employees(name);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employee_tags_employee_id ON employee_tags(employee_id);
CREATE INDEX idx_employee_notes_employee_id ON employee_notes(employee_id);

-- ============================================
-- 4. 创建触发器
-- ============================================

-- 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_employees_updated_at();

-- ============================================
-- 5. 行级安全策略（RLS）
-- ============================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_notes ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有员工
CREATE POLICY "管理员可以查看所有员工"
  ON employees FOR SELECT
  USING (is_admin(auth.uid()));

-- 管理员可以创建员工
CREATE POLICY "管理员可以创建员工"
  ON employees FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- 管理员可以更新员工信息
CREATE POLICY "管理员可以更新员工"
  ON employees FOR UPDATE
  USING (is_admin(auth.uid()));

-- 员工可以查看自己的档案
CREATE POLICY "员工可以查看自己的档案"
  ON employees FOR SELECT
  USING (auth.uid() = user_id);

-- 管理员可以管理员工标签
CREATE POLICY "管理员可以查看所有标签"
  ON employee_tags FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "管理员可以创建标签"
  ON employee_tags FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "管理员可以删除标签"
  ON employee_tags FOR DELETE
  USING (is_admin(auth.uid()));

-- 管理员可以管理员工备注
CREATE POLICY "管理员可以查看所有备注"
  ON employee_notes FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "管理员可以创建备注"
  ON employee_notes FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- ============================================
-- 6. 插入示例数据
-- ============================================

-- 插入示例员工数据
INSERT INTO employees (employee_no, name, gender, phone, email, department, position, level, employment_type, entry_date, status) VALUES
  ('EMP001', '张三', 'male', '13800138001', 'zhangsan@example.com', '前厅部', '服务员', 'P1', 'full_time', '2024-01-15', 'active'),
  ('EMP002', '李四', 'female', '13800138002', 'lisi@example.com', '后厨部', '厨师', 'P2', 'full_time', '2024-02-01', 'active'),
  ('EMP003', '王五', 'male', '13800138003', 'wangwu@example.com', '前厅部', '主管', 'M1', 'full_time', '2023-06-10', 'active'),
  ('EMP004', '赵六', 'female', '13800138004', 'zhaoliu@example.com', '后厨部', '帮厨', 'P1', 'part_time', '2024-03-20', 'active'),
  ('EMP005', '孙七', 'male', '13800138005', 'sunqi@example.com', '前厅部', '服务员', 'P1', 'full_time', '2024-04-01', 'on_leave'),
  ('EMP006', '周八', 'female', '13800138006', 'zhouba@example.com', '后厨部', '厨师长', 'M2', 'full_time', '2022-08-15', 'active'),
  ('EMP007', '吴九', 'male', '13800138007', 'wujiu@example.com', '前厅部', '服务员', 'P1', 'intern', '2024-05-10', 'active'),
  ('EMP008', '郑十', 'female', '13800138008', 'zhengshi@example.com', '后厨部', '厨师', 'P2', 'full_time', '2023-11-20', 'active');

-- 插入示例标签数据
INSERT INTO employee_tags (employee_id, tag_name, tag_color)
SELECT id, '优秀员工', '#10B981' FROM employees WHERE employee_no = 'EMP001';

INSERT INTO employee_tags (employee_id, tag_name, tag_color)
SELECT id, '新员工', '#3B82F6' FROM employees WHERE employee_no = 'EMP007';

INSERT INTO employee_tags (employee_id, tag_name, tag_color)
SELECT id, '骨干员工', '#F59E0B' FROM employees WHERE employee_no = 'EMP003';

-- 插入示例备注数据
INSERT INTO employee_notes (employee_id, note_content, note_type, created_by)
SELECT 
  e.id, 
  '工作表现优秀，客户满意度高', 
  'performance', 
  p.id
FROM employees e, profiles p
WHERE e.employee_no = 'EMP001' AND p.role = 'admin'
LIMIT 1;
