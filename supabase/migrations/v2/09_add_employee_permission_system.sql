/*
# 员工权限模块化系统

## 1. 功能说明
实现灵活的员工权限管理系统，支持：
- 功能模块定义和管理
- 员工权限分配
- 租户级别的权限配置
- 按岗位批量分配权限

## 2. 新增表结构

### 2.1 功能模块表 (function_modules)
存储系统所有可用的功能模块
- id: 模块ID
- module_key: 模块唯一标识
- module_name: 模块名称
- module_description: 模块描述
- parent_module_id: 父模块ID（支持层级结构）
- sort_order: 排序顺序
- is_system: 是否系统模块（不可删除）
- created_at: 创建时间

### 2.2 员工权限表 (employee_permissions)
存储员工的功能模块访问权限
- id: 权限ID
- tenant_id: 租户ID
- employee_id: 员工ID
- module_id: 模块ID
- can_view: 是否可查看
- can_edit: 是否可编辑
- can_delete: 是否可删除
- created_at: 创建时间
- updated_at: 更新时间

### 2.3 岗位权限模板表 (position_permission_templates)
存储按岗位预设的权限模板
- id: 模板ID
- tenant_id: 租户ID
- position_name: 岗位名称
- module_id: 模块ID
- can_view: 是否可查看
- can_edit: 是否可编辑
- can_delete: 是否可删除
- created_at: 创建时间

## 3. 安全策略
- 启用RLS
- 租户管理员可以管理本租户的所有权限
- 员工只能查看自己的权限

## 4. 系统预设模块
- 今日排班
- 每月排班
- 数据分析
- 管理中心
- 启动中心
- 员工管理
- 店铺管理
- 租户管理
*/

-- ============================================
-- 1. 创建功能模块表
-- ============================================
CREATE TABLE IF NOT EXISTS function_modules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    module_key text UNIQUE NOT NULL,
    module_name text NOT NULL,
    module_description text,
    parent_module_id uuid REFERENCES function_modules(id) ON DELETE CASCADE,
    sort_order integer DEFAULT 0,
    is_system boolean DEFAULT false,
    icon text,
    route_path text,
    created_at timestamptz DEFAULT now()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_function_modules_parent ON function_modules(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_function_modules_key ON function_modules(module_key);

-- ============================================
-- 2. 创建员工权限表
-- ============================================
CREATE TABLE IF NOT EXISTS employee_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    module_id uuid NOT NULL REFERENCES function_modules(id) ON DELETE CASCADE,
    can_view boolean DEFAULT true,
    can_edit boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, employee_id, module_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_employee_permissions_tenant ON employee_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_employee ON employee_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_module ON employee_permissions(module_id);

-- ============================================
-- 3. 创建岗位权限模板表
-- ============================================
CREATE TABLE IF NOT EXISTS position_permission_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    position_name text NOT NULL,
    module_id uuid NOT NULL REFERENCES function_modules(id) ON DELETE CASCADE,
    can_view boolean DEFAULT true,
    can_edit boolean DEFAULT false,
    can_delete boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, position_name, module_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_position_templates_tenant ON position_permission_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_position_templates_position ON position_permission_templates(position_name);

-- ============================================
-- 4. 插入系统预设功能模块
-- ============================================

-- 一级模块
INSERT INTO function_modules (module_key, module_name, module_description, sort_order, is_system, icon, route_path) VALUES
('home', '首页', '系统首页', 1, true, 'i-mdi-home', '/pages/index/index'),
('today_schedule', '今日排班', '今日排班管理', 2, true, 'i-mdi-calendar-today', '/pages/today-schedule/index'),
('monthly_schedule', '每月排班', '每月排班管理', 3, true, 'i-mdi-calendar-month', '/pages/monthly-schedule/index'),
('data_analysis', '数据分析', '数据分析与报表', 4, true, 'i-mdi-chart-line', '/pages/data-analysis/index'),
('management', '管理中心', '系统管理中心', 5, true, 'i-mdi-cog', '/pages/management/index'),
('launch_center', '启动中心', '系统配置中心', 6, true, 'i-mdi-rocket-launch', '/pages/launch-center/index')
ON CONFLICT (module_key) DO NOTHING;

-- 今日排班子模块
INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'schedule_planning', '排班规划', '今日排班规划', id, 1, true, 'i-mdi-calendar-edit', '/pages/schedule-planning/index'
FROM function_modules WHERE module_key = 'today_schedule'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'business_adjustment', '营业调整', '营业中的排班调整', id, 2, true, 'i-mdi-account-switch', '/pages/business-adjustment/index'
FROM function_modules WHERE module_key = 'today_schedule'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'business_review', '营业复盘', '营业结束后的复盘', id, 3, true, 'i-mdi-clipboard-check', '/pages/business-review/index'
FROM function_modules WHERE module_key = 'today_schedule'
ON CONFLICT (module_key) DO NOTHING;

-- 每月排班子模块
INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'revenue_forecast', '营收预测', '智能营收预测', id, 1, true, 'i-mdi-crystal-ball', '/pages/revenue-forecast/index'
FROM function_modules WHERE module_key = 'monthly_schedule'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'monthly_planning', '每月排班', '月度排班生成', id, 2, true, 'i-mdi-calendar-month-outline', '/pages/monthly-planning/index'
FROM function_modules WHERE module_key = 'monthly_schedule'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'schedule_analysis', '数据分析', '排班数据分析', id, 3, true, 'i-mdi-chart-bar', '/pages/schedule-analysis/index'
FROM function_modules WHERE module_key = 'monthly_schedule'
ON CONFLICT (module_key) DO NOTHING;

-- 管理中心子模块
INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'employee_management', '员工管理', '员工信息管理', id, 1, true, 'i-mdi-account-group', '/pages/employee-management/index'
FROM function_modules WHERE module_key = 'management'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'store_management', '店铺管理', '店铺信息管理', id, 2, true, 'i-mdi-store', '/pages/store-management/index'
FROM function_modules WHERE module_key = 'management'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'tenant_management', '租户管理', '租户信息管理', id, 3, true, 'i-mdi-domain', '/pages/tenant-management/index'
FROM function_modules WHERE module_key = 'management'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'permission_management', '权限管理', '员工权限配置', id, 4, true, 'i-mdi-shield-account', '/pages/permission-management/index'
FROM function_modules WHERE module_key = 'management'
ON CONFLICT (module_key) DO NOTHING;

-- 启动中心子模块
INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'efficiency_config', '效能配置', '营收-效能标准配置', id, 1, true, 'i-mdi-chart-line', '/pages/efficiency-config/index'
FROM function_modules WHERE module_key = 'launch_center'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'influence_factor', '影响因子配置', '营收影响因子配置', id, 2, true, 'i-mdi-weather-partly-cloudy', '/pages/influence-factor/index'
FROM function_modules WHERE module_key = 'launch_center'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'business_areas', '经营区域管理', '经营区域和岗位配置', id, 3, true, 'i-mdi-floor-plan', '/pages/business-areas/index'
FROM function_modules WHERE module_key = 'launch_center'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'revenue_import', '历史营收导入', '历史营收数据导入', id, 4, true, 'i-mdi-database-import', '/pages/revenue-import/index'
FROM function_modules WHERE module_key = 'launch_center'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'core_position_backup', '核心岗位顶岗', '核心岗位顶岗配置', id, 5, true, 'i-mdi-account-switch', '/pages/core-position-backup/index'
FROM function_modules WHERE module_key = 'launch_center'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'store_hierarchy', '门店组织架构', '门店组织架构配置', id, 6, true, 'i-mdi-sitemap', '/pages/store-hierarchy/index'
FROM function_modules WHERE module_key = 'launch_center'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'min_revenue_config', '最低营收配置', '最低营收岗位配置', id, 7, true, 'i-mdi-account-hard-hat', '/pages/min-revenue-config/index'
FROM function_modules WHERE module_key = 'launch_center'
ON CONFLICT (module_key) DO NOTHING;

INSERT INTO function_modules (module_key, module_name, module_description, parent_module_id, sort_order, is_system, icon, route_path)
SELECT 'rest_day_rules', '排休规则配置', '员工排休规则配置', id, 8, true, 'i-mdi-calendar-clock', '/pages/rest-day-rules/index'
FROM function_modules WHERE module_key = 'launch_center'
ON CONFLICT (module_key) DO NOTHING;

-- ============================================
-- 5. 启用RLS
-- ============================================
ALTER TABLE function_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_permission_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. 创建RLS策略
-- ============================================

-- 功能模块表：所有人都可以查看系统模块
CREATE POLICY "Anyone can view function modules"
    ON function_modules FOR SELECT
    USING (true);

-- 员工权限表：租户管理员可以管理本租户的所有权限
CREATE POLICY "Tenant admins can manage employee permissions"
    ON employee_permissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN profiles p ON e.user_id = p.id
            WHERE e.id = (SELECT id FROM employees WHERE user_id = auth.uid() LIMIT 1)
            AND e.tenant_id = employee_permissions.tenant_id
            AND p.role IN ('tenant_admin', 'store_manager')
        )
    );

-- 员工权限表：员工可以查看自己的权限
CREATE POLICY "Employees can view own permissions"
    ON employee_permissions FOR SELECT
    USING (
        employee_id = (SELECT id FROM employees WHERE user_id = auth.uid() LIMIT 1)
    );

-- 岗位权限模板表：租户管理员可以管理本租户的模板
CREATE POLICY "Tenant admins can manage position templates"
    ON position_permission_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN profiles p ON e.user_id = p.id
            WHERE e.id = (SELECT id FROM employees WHERE user_id = auth.uid() LIMIT 1)
            AND e.tenant_id = position_permission_templates.tenant_id
            AND p.role IN ('tenant_admin', 'store_manager')
        )
    );

-- ============================================
-- 7. 创建辅助函数
-- ============================================

-- 检查员工是否有模块访问权限
CREATE OR REPLACE FUNCTION check_employee_permission(
    p_employee_id uuid,
    p_module_key text,
    p_permission_type text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_has_permission boolean;
    v_module_id uuid;
BEGIN
    -- 获取模块ID
    SELECT id INTO v_module_id
    FROM function_modules
    WHERE module_key = p_module_key;
    
    IF v_module_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- 检查权限
    SELECT 
        CASE p_permission_type
            WHEN 'view' THEN can_view
            WHEN 'edit' THEN can_edit
            WHEN 'delete' THEN can_delete
            ELSE false
        END INTO v_has_permission
    FROM employee_permissions
    WHERE employee_id = p_employee_id
    AND module_id = v_module_id;
    
    RETURN COALESCE(v_has_permission, false);
END;
$$;

-- 批量为员工分配岗位权限模板
CREATE OR REPLACE FUNCTION apply_position_template_to_employee(
    p_tenant_id uuid,
    p_employee_id uuid,
    p_position_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 删除员工现有权限
    DELETE FROM employee_permissions
    WHERE tenant_id = p_tenant_id
    AND employee_id = p_employee_id;
    
    -- 根据岗位模板创建新权限
    INSERT INTO employee_permissions (
        tenant_id,
        employee_id,
        module_id,
        can_view,
        can_edit,
        can_delete
    )
    SELECT
        p_tenant_id,
        p_employee_id,
        module_id,
        can_view,
        can_edit,
        can_delete
    FROM position_permission_templates
    WHERE tenant_id = p_tenant_id
    AND position_name = p_position_name;
END;
$$;

-- ============================================
-- 8. 创建更新时间触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_employee_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_permissions_updated_at
    BEFORE UPDATE ON employee_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_permissions_updated_at();

-- ============================================
-- 9. 添加注释
-- ============================================
COMMENT ON TABLE function_modules IS '功能模块表：存储系统所有可用的功能模块';
COMMENT ON TABLE employee_permissions IS '员工权限表：存储员工的功能模块访问权限';
COMMENT ON TABLE position_permission_templates IS '岗位权限模板表：存储按岗位预设的权限模板';
COMMENT ON FUNCTION check_employee_permission IS '检查员工是否有模块访问权限';
COMMENT ON FUNCTION apply_position_template_to_employee IS '批量为员工分配岗位权限模板';
