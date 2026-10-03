/*
# 权限管理系统

## 1. 功能概述
实现基于角色和用户的细粒度权限控制系统，支持模块级别的权限配置。

## 2. 新增表结构

### 2.1 系统模块表 (system_modules)
存储系统所有可用的功能模块。

字段说明：
- id: 主键
- module_key: 模块唯一标识（如：dashboard, schedule, employee）
- module_name: 模块名称
- module_description: 模块描述
- parent_module_id: 父模块ID（用于层级结构）
- icon: 模块图标
- route_path: 路由路径
- sort_order: 排序顺序
- is_active: 是否启用
- created_at: 创建时间
- updated_at: 更新时间

### 2.2 角色模块权限表 (role_module_permissions)
存储角色对模块的访问权限。

字段说明：
- id: 主键
- role: 角色类型
- module_id: 模块ID
- can_view: 是否可查看
- can_create: 是否可创建
- can_edit: 是否可编辑
- can_delete: 是否可删除
- created_at: 创建时间
- updated_at: 更新时间

### 2.3 用户模块权限表 (user_module_permissions)
存储用户个性化的模块权限（覆盖角色权限）。

字段说明：
- id: 主键
- user_id: 用户ID
- module_id: 模块ID
- can_view: 是否可查看
- can_create: 是否可创建
- can_edit: 是否可编辑
- can_delete: 是否可删除
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

## 3. 安全策略
- 所有表启用RLS
- 超级管理员和租户管理员有完整权限
- 普通用户只能查看自己的权限

*/

-- ==================== 系统模块表 ====================

CREATE TABLE IF NOT EXISTS system_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL UNIQUE,
  module_name text NOT NULL,
  module_description text,
  parent_module_id uuid REFERENCES system_modules(id) ON DELETE CASCADE,
  icon text,
  route_path text,
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_modules_key ON system_modules(module_key);
CREATE INDEX IF NOT EXISTS idx_system_modules_parent ON system_modules(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_system_modules_active ON system_modules(is_active);

-- ==================== 角色模块权限表 ====================

CREATE TABLE IF NOT EXISTS role_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'store_manager', 'employee', 'guest')),
  module_id uuid NOT NULL REFERENCES system_modules(id) ON DELETE CASCADE,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(role, module_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_module_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON role_module_permissions(module_id);

-- ==================== 用户模块权限表 ====================

CREATE TABLE IF NOT EXISTS user_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES system_modules(id) ON DELETE CASCADE,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_module_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_module ON user_module_permissions(module_id);

-- ==================== 插入系统模块数据 ====================

-- 一级模块
INSERT INTO system_modules (module_key, module_name, module_description, icon, route_path, sort_order) VALUES
('dashboard', '今日运营', '查看今日运营数据和关键指标', 'i-mdi-view-dashboard', '/pages/home/index', 1),
('schedule', '排班管理', '管理员工排班和班次', 'i-mdi-calendar-clock', '/pages/schedule-planning/index', 2),
('employee', '员工管理', '管理员工信息和档案', 'i-mdi-account-group', '/pages/management-center/index', 3),
('cost', '成本管控', '管理和分析成本数据', 'i-mdi-cash-multiple', '/pages/cost-control/index', 4),
('analytics', '数据分析', '查看数据分析和报表', 'i-mdi-chart-line', '/pages/data-analytics/index', 5),
('revenue', '营收预测', '查看和管理营收预测', 'i-mdi-currency-cny', '/pages/revenue-prediction/index', 6),
('settings', '系统设置', '配置系统参数和选项', 'i-mdi-cog', '/pages/settings/index', 7),
('tutorial', '使用教程', '查看系统使用教程', 'i-mdi-book-open-variant', '/pages/tutorial/index', 8);

-- 二级模块（排班管理下的子模块）
INSERT INTO system_modules (module_key, module_name, module_description, parent_module_id, icon, route_path, sort_order)
SELECT 'schedule_planning', '排班规划', '创建和编辑排班计划', id, 'i-mdi-calendar-edit', '/pages/schedule-planning/index', 1
FROM system_modules WHERE module_key = 'schedule';

INSERT INTO system_modules (module_key, module_name, module_description, parent_module_id, icon, route_path, sort_order)
SELECT 'schedule_logs', '排班日志', '查看排班执行日志', id, 'i-mdi-clipboard-text', '/pages/schedule-logs/index', 2
FROM system_modules WHERE module_key = 'schedule';

INSERT INTO system_modules (module_key, module_name, module_description, parent_module_id, icon, route_path, sort_order)
SELECT 'schedule_optimization', '智能优化', '使用AI优化排班', id, 'i-mdi-brain', '/pages/schedule-optimization/index', 3
FROM system_modules WHERE module_key = 'schedule';

-- 二级模块（员工管理下的子模块）
INSERT INTO system_modules (module_key, module_name, module_description, parent_module_id, icon, route_path, sort_order)
SELECT 'employee_list', '员工列表', '查看和管理员工列表', id, 'i-mdi-account-multiple', '/pages/management-center/index', 1
FROM system_modules WHERE module_key = 'employee';

INSERT INTO system_modules (module_key, module_name, module_description, parent_module_id, icon, route_path, sort_order)
SELECT 'employee_import', '员工导入', '批量导入员工数据', id, 'i-mdi-file-import', '/pages/employee-import/index', 2
FROM system_modules WHERE module_key = 'employee';

INSERT INTO system_modules (module_key, module_name, module_description, parent_module_id, icon, route_path, sort_order)
SELECT 'store_hierarchy', '门店架构', '配置门店组织架构', id, 'i-mdi-sitemap', '/pages/store-hierarchy/index', 3
FROM system_modules WHERE module_key = 'employee';

-- ==================== 插入默认角色权限 ====================

-- 超级管理员：所有模块的所有权限
INSERT INTO role_module_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'super_admin', id, true, true, true, true
FROM system_modules;

-- 租户管理员：大部分模块的所有权限
INSERT INTO role_module_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'tenant_admin', id, true, true, true, true
FROM system_modules
WHERE module_key NOT IN ('settings'); -- 系统设置只有超级管理员可以访问

-- 店经理：店铺相关模块的权限
INSERT INTO role_module_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'store_manager', id, true, true, true, false
FROM system_modules
WHERE module_key IN ('dashboard', 'schedule', 'schedule_planning', 'schedule_logs', 'employee', 'employee_list', 'cost', 'analytics', 'tutorial');

-- 普通员工：基础查看权限
INSERT INTO role_module_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'employee', id, true, false, false, false
FROM system_modules
WHERE module_key IN ('dashboard', 'schedule_logs', 'tutorial');

-- Guest：体验模式权限
INSERT INTO role_module_permissions (role, module_id, can_view, can_create, can_edit, can_delete)
SELECT 'guest', id, true, true, true, false
FROM system_modules
WHERE module_key IN ('dashboard', 'schedule', 'schedule_planning', 'schedule_logs', 'employee', 'employee_list', 'cost', 'analytics', 'revenue', 'tutorial');

-- ==================== RLS策略 ====================

ALTER TABLE system_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_permissions ENABLE ROW LEVEL SECURITY;

-- 系统模块表策略：所有认证用户可查看
CREATE POLICY "所有认证用户可查看系统模块" ON system_modules
  FOR SELECT TO authenticated
  USING (true);

-- 超级管理员可管理系统模块
CREATE POLICY "超级管理员可管理系统模块" ON system_modules
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 角色模块权限表策略：所有认证用户可查看
CREATE POLICY "所有认证用户可查看角色权限" ON role_module_permissions
  FOR SELECT TO authenticated
  USING (true);

-- 超级管理员和租户管理员可管理角色权限
CREATE POLICY "管理员可管理角色权限" ON role_module_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin')
    )
  );

-- 用户模块权限表策略：用户可查看自己的权限
CREATE POLICY "用户可查看自己的权限" ON user_module_permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 管理员可查看所有用户权限
CREATE POLICY "管理员可查看所有用户权限" ON user_module_permissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin')
    )
  );

-- 管理员可管理用户权限
CREATE POLICY "管理员可管理用户权限" ON user_module_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin')
    )
  );
