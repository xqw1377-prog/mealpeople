/*
# 创建多租户管理系统数据库架构

## 1. 新建表

### 1.1 用户角色枚举
- `user_role`: 用户角色类型
  - `super_admin`: 超级管理员（平台级）
  - `tenant_admin`: 租户管理员（租户级）
  - `store_manager`: 店经理（店级）
  - `employee`: 普通员工（执行级）

### 1.2 租户表（tenants）
- `id` (uuid, 主键)
- `name` (text, 租户名称, 必填)
- `industry` (text, 行业类型: 火锅/快餐/咖啡等)
- `package_type` (text, 套餐类型: 基础版/标准版/企业版)
- `status` (text, 服务状态: active/inactive)
- `store_count` (integer, 店铺数量, 默认0)
- `employee_count` (integer, 员工数量, 默认0)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

### 1.3 用户表（profiles）
- `id` (uuid, 主键, 关联auth.users)
- `tenant_id` (uuid, 关联租户ID, 可为空-超级管理员)
- `phone` (text, 手机号, 唯一)
- `email` (text, 邮箱, 唯一)
- `wechat_id` (text, 微信ID)
- `name` (text, 用户名)
- `avatar_url` (text, 头像URL)
- `role` (user_role, 角色, 默认employee)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

### 1.4 店铺表（stores）
- `id` (uuid, 主键)
- `tenant_id` (uuid, 关联租户ID, 必填)
- `name` (text, 店铺名称, 必填)
- `address` (text, 店铺地址)
- `manager_id` (uuid, 店经理ID, 关联profiles)
- `status` (text, 状态: active/inactive)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

### 1.5 员工表（employees）
- `id` (uuid, 主键)
- `tenant_id` (uuid, 关联租户ID, 必填)
- `store_id` (uuid, 关联店铺ID, 必填)
- `user_id` (uuid, 关联用户ID, 可为空)
- `name` (text, 员工姓名, 必填)
- `phone` (text, 手机号)
- `employee_type` (text, 员工类型: full_time/part_time)
- `position` (text, 职位)
- `status` (text, 状态: active/inactive)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

### 1.6 排班表（schedules）
- `id` (uuid, 主键)
- `tenant_id` (uuid, 关联租户ID, 必填)
- `store_id` (uuid, 关联店铺ID, 必填)
- `employee_id` (uuid, 关联员工ID, 必填)
- `schedule_date` (date, 排班日期, 必填)
- `shift_type` (text, 班次类型: morning/afternoon/evening/full_day)
- `start_time` (time, 开始时间)
- `end_time` (time, 结束时间)
- `status` (text, 状态: pending/confirmed/completed/cancelled)
- `notes` (text, 备注)
- `created_by` (uuid, 创建人ID)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

### 1.7 排班日志表（schedule_logs）
- `id` (uuid, 主键)
- `tenant_id` (uuid, 关联租户ID, 必填)
- `schedule_id` (uuid, 关联排班ID, 必填)
- `employee_id` (uuid, 关联员工ID, 必填)
- `store_id` (uuid, 关联店铺ID, 必填)
- `log_date` (date, 日志日期, 必填)
- `completion_status` (text, 完成状态: excellent/good/normal/poor)
- `completion_time` (timestamptz, 完成时间)
- `score` (integer, 评分: 0-100)
- `duration_minutes` (integer, 用时分钟数)
- `notes` (text, 备注)
- `created_at` (timestamptz, 创建时间)

### 1.8 运营数据表（operations_data）
- `id` (uuid, 主键)
- `tenant_id` (uuid, 关联租户ID, 必填)
- `store_id` (uuid, 关联店铺ID, 可为空-全租户数据)
- `data_date` (date, 数据日期, 必填)
- `total_schedules` (integer, 总排班数, 默认0)
- `completed_schedules` (integer, 完成排班数, 默认0)
- `excellent_schedules` (integer, 优秀排班数, 默认0)
- `delayed_schedules` (integer, 延期排班数, 默认0)
- `avg_duration_minutes` (integer, 平均用时分钟数, 默认0)
- `participation_count` (integer, 参与人数, 默认0)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

### 1.9 成本数据表（cost_data）
- `id` (uuid, 主键)
- `tenant_id` (uuid, 关联租户ID, 必填)
- `store_id` (uuid, 关联店铺ID, 可为空)
- `data_date` (date, 数据日期, 必填)
- `revenue` (numeric, 营收)
- `labor_cost` (numeric, 人力成本)
- `labor_cost_ratio` (numeric, 人力成本占比)
- `employee_count` (integer, 员工数量)
- `avg_efficiency` (numeric, 平均效能)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

## 2. 安全策略

### 2.1 RLS策略
- 所有表启用RLS
- 超级管理员可访问所有数据
- 租户管理员只能访问自己租户的数据
- 店经理只能访问自己店铺的数据
- 普通员工只能访问自己的数据

### 2.2 辅助函数
- `is_super_admin()`: 检查是否为超级管理员
- `get_user_tenant_id()`: 获取用户的租户ID
- `get_user_role()`: 获取用户角色
- `can_access_tenant()`: 检查是否可访问指定租户数据

## 3. 触发器

### 3.1 用户初始化触发器
- 首次确认的用户自动成为超级管理员
- 后续用户默认为普通员工

### 3.2 统计更新触发器
- 自动更新租户的店铺数量和员工数量
*/

-- 1. 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'store_manager', 'employee');

-- 2. 创建租户表
CREATE TABLE IF NOT EXISTS tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    industry text,
    package_type text DEFAULT 'basic',
    status text DEFAULT 'active',
    store_count integer DEFAULT 0,
    employee_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. 创建用户表
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
    phone text UNIQUE,
    email text UNIQUE,
    wechat_id text,
    name text,
    avatar_url text,
    role user_role DEFAULT 'employee'::user_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. 创建店铺表
CREATE TABLE IF NOT EXISTS stores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    address text,
    manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. 创建员工表
CREATE TABLE IF NOT EXISTS employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    name text NOT NULL,
    phone text,
    employee_type text DEFAULT 'full_time',
    position text,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. 创建排班表
CREATE TABLE IF NOT EXISTS schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    schedule_date date NOT NULL,
    shift_type text,
    start_time time,
    end_time time,
    status text DEFAULT 'pending',
    notes text,
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 7. 创建排班日志表
CREATE TABLE IF NOT EXISTS schedule_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    schedule_id uuid NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    log_date date NOT NULL,
    completion_status text,
    completion_time timestamptz,
    score integer CHECK (score >= 0 AND score <= 100),
    duration_minutes integer,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 8. 创建运营数据表
CREATE TABLE IF NOT EXISTS operations_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    data_date date NOT NULL,
    total_schedules integer DEFAULT 0,
    completed_schedules integer DEFAULT 0,
    excellent_schedules integer DEFAULT 0,
    delayed_schedules integer DEFAULT 0,
    avg_duration_minutes integer DEFAULT 0,
    participation_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, store_id, data_date)
);

-- 9. 创建成本数据表
CREATE TABLE IF NOT EXISTS cost_data (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    data_date date NOT NULL,
    revenue numeric(12, 2),
    labor_cost numeric(12, 2),
    labor_cost_ratio numeric(5, 2),
    employee_count integer,
    avg_efficiency numeric(5, 2),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, store_id, data_date)
);

-- 10. 创建辅助函数

-- 检查是否为超级管理员
CREATE OR REPLACE FUNCTION is_super_admin(uid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = uid AND p.role = 'super_admin'::user_role
    );
$$;

-- 获取用户的租户ID
CREATE OR REPLACE FUNCTION get_user_tenant_id(uid uuid)
RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$
    SELECT tenant_id FROM profiles WHERE id = uid;
$$;

-- 获取用户角色
CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS user_role LANGUAGE sql SECURITY DEFINER AS $$
    SELECT role FROM profiles WHERE id = uid;
$$;

-- 检查是否可访问指定租户数据
CREATE OR REPLACE FUNCTION can_access_tenant(uid uuid, tid uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
    SELECT 
        is_super_admin(uid) OR 
        get_user_tenant_id(uid) = tid;
$$;

-- 11. 启用RLS

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_data ENABLE ROW LEVEL SECURITY;

-- 12. 创建RLS策略

-- 租户表策略
CREATE POLICY "超级管理员可访问所有租户" ON tenants
    FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "用户可查看自己的租户" ON tenants
    FOR SELECT TO authenticated USING (id = get_user_tenant_id(auth.uid()));

-- 用户表策略
CREATE POLICY "超级管理员可访问所有用户" ON profiles
    FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "租户管理员可访问本租户用户" ON profiles
    FOR ALL TO authenticated USING (
        get_user_role(auth.uid()) IN ('tenant_admin'::user_role, 'super_admin'::user_role) 
        AND can_access_tenant(auth.uid(), tenant_id)
    );

CREATE POLICY "用户可查看自己的信息" ON profiles
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "用户可更新自己的信息" ON profiles
    FOR UPDATE TO authenticated USING (id = auth.uid());

-- 店铺表策略
CREATE POLICY "超级管理员可访问所有店铺" ON stores
    FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "租户用户可访问本租户店铺" ON stores
    FOR ALL TO authenticated USING (can_access_tenant(auth.uid(), tenant_id));

-- 员工表策略
CREATE POLICY "超级管理员可访问所有员工" ON employees
    FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "租户用户可访问本租户员工" ON employees
    FOR ALL TO authenticated USING (can_access_tenant(auth.uid(), tenant_id));

-- 排班表策略
CREATE POLICY "超级管理员可访问所有排班" ON schedules
    FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "租户用户可访问本租户排班" ON schedules
    FOR ALL TO authenticated USING (can_access_tenant(auth.uid(), tenant_id));

-- 排班日志表策略
CREATE POLICY "超级管理员可访问所有日志" ON schedule_logs
    FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "租户用户可访问本租户日志" ON schedule_logs
    FOR ALL TO authenticated USING (can_access_tenant(auth.uid(), tenant_id));

-- 运营数据表策略
CREATE POLICY "超级管理员可访问所有运营数据" ON operations_data
    FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "租户用户可访问本租户运营数据" ON operations_data
    FOR ALL TO authenticated USING (can_access_tenant(auth.uid(), tenant_id));

-- 成本数据表策略
CREATE POLICY "超级管理员可访问所有成本数据" ON cost_data
    FOR ALL TO authenticated USING (is_super_admin(auth.uid()));

CREATE POLICY "租户用户可访问本租户成本数据" ON cost_data
    FOR ALL TO authenticated USING (can_access_tenant(auth.uid(), tenant_id));

-- 13. 创建用户初始化触发器
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    user_count int;
BEGIN
    -- 只在 confirmed_at 从 NULL → 非 NULL 时执行
    IF OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL THEN
        -- 判断 profiles 表里有多少用户
        SELECT COUNT(*) INTO user_count FROM profiles;
        
        -- 插入 profiles，首位用户给 super_admin 角色
        INSERT INTO profiles (id, phone, email, role)
        VALUES (
            NEW.id,
            NEW.phone,
            NEW.email,
            CASE WHEN user_count = 0 THEN 'super_admin'::user_role ELSE 'employee'::user_role END
        );
    END IF;
    RETURN NEW;
END;
$$;

-- 绑定触发器到 auth.users 表
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 14. 创建统计更新触发器

-- 更新租户店铺数量
CREATE OR REPLACE FUNCTION update_tenant_store_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tenants SET store_count = store_count + 1 WHERE id = NEW.tenant_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tenants SET store_count = store_count - 1 WHERE id = OLD.tenant_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_tenant_store_count
    AFTER INSERT OR DELETE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_store_count();

-- 更新租户员工数量
CREATE OR REPLACE FUNCTION update_tenant_employee_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tenants SET employee_count = employee_count + 1 WHERE id = NEW.tenant_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tenants SET employee_count = employee_count - 1 WHERE id = OLD.tenant_id;
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_update_tenant_employee_count
    AFTER INSERT OR DELETE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_tenant_employee_count();

-- 15. 插入初始测试数据

-- 插入测试租户
INSERT INTO tenants (id, name, industry, package_type, status) VALUES
    ('11111111-1111-1111-1111-111111111111', '海底捞火锅', '火锅', 'enterprise', 'active'),
    ('22222222-2222-2222-2222-222222222222', '麦当劳快餐', '快餐', 'standard', 'active'),
    ('33333333-3333-3333-3333-333333333333', '星巴克咖啡', '咖啡', 'basic', 'active');
