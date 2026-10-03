/*
# 创建功能模块表和权限系统

## 说明
创建功能模块表，用于权限管理系统。定义系统中所有可用的功能模块，支持树形结构。

## 表结构

### function_modules - 功能模块表
- id (uuid): 主键
- module_key (text): 模块唯一标识
- module_name (text): 模块名称
- parent_id (uuid): 父模块ID（支持树形结构）
- sort_order (integer): 排序顺序
- description (text): 模块描述
- created_at (timestamptz): 创建时间

### employee_permissions - 员工权限表
- id (uuid): 主键
- employee_id (uuid): 员工ID
- module_id (uuid): 模块ID
- can_view (boolean): 查看权限
- can_edit (boolean): 编辑权限
- can_delete (boolean): 删除权限
- created_at (timestamptz): 创建时间

### position_templates - 岗位权限模板表
- id (uuid): 主键
- tenant_id (uuid): 租户ID
- position_name (text): 岗位名称
- module_id (uuid): 模块ID
- can_view (boolean): 查看权限
- can_edit (boolean): 编辑权限
- can_delete (boolean): 删除权限
- created_at (timestamptz): 创建时间

## 安全策略
- 所有表启用RLS
- 管理员拥有完全访问权限
- 员工只能查看自己的权限
*/

-- 创建功能模块表
CREATE TABLE IF NOT EXISTS function_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text UNIQUE NOT NULL,
  module_name text NOT NULL,
  parent_id uuid REFERENCES function_modules(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 创建员工权限表
CREATE TABLE IF NOT EXISTS employee_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES function_modules(id) ON DELETE CASCADE,
  can_view boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, module_id)
);

-- 创建岗位权限模板表
CREATE TABLE IF NOT EXISTS position_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  position_name text NOT NULL,
  module_id uuid NOT NULL REFERENCES function_modules(id) ON DELETE CASCADE,
  can_view boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, position_name, module_id)
);

-- 启用RLS
ALTER TABLE function_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_templates ENABLE ROW LEVEL SECURITY;

-- 功能模块表策略（所有人可读）
CREATE POLICY "Anyone can view function modules"
  ON function_modules FOR SELECT
  TO authenticated
  USING (true);

-- 员工权限表策略
CREATE POLICY "Admins can manage all employee permissions"
  ON employee_permissions FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Employees can view own permissions"
  ON employee_permissions FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 岗位权限模板表策略
CREATE POLICY "Admins can manage position templates"
  ON position_templates FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view position templates in their tenant"
  ON position_templates FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 插入功能模块初始数据
-- 一级模块
INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description) VALUES
('home', '首页', NULL, 1, '系统首页和今日运营仪表盘'),
('management', '管理中心', NULL, 2, '员工、门店、租户等基础管理'),
('schedule', '排班管理', NULL, 3, '排班规划、执行和优化'),
('cost', '成本管控', NULL, 4, '人力成本分析和控制'),
('analytics', '数据分析', NULL, 5, '营收分析和数据报表'),
('logs', '排班日志', NULL, 6, '排班执行记录和排行榜'),
('settings', '系统设置', NULL, 7, '品牌配置、效能标准等设置');

-- 二级模块 - 管理中心
INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'employees', '员工管理', id, 1, '员工信息管理和导入'
FROM function_modules WHERE module_key = 'management';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'temp_workers', '兼职管理', id, 2, '兼职员工管理'
FROM function_modules WHERE module_key = 'management';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'stores', '门店管理', id, 3, '门店信息和层级管理'
FROM function_modules WHERE module_key = 'management';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'positions', '岗位管理', id, 4, '岗位配置和管理'
FROM function_modules WHERE module_key = 'management';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'business_areas', '业务区域', id, 5, '业务区域配置'
FROM function_modules WHERE module_key = 'management';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'tenant_management', '租户管理', id, 6, '租户信息和设置'
FROM function_modules WHERE module_key = 'management';

-- 二级模块 - 排班管理
INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'schedule_planning', '排班规划', id, 1, '智能排班规划'
FROM function_modules WHERE module_key = 'schedule';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'monthly_schedule', '月度排班', id, 2, '月度排班查看和管理'
FROM function_modules WHERE module_key = 'schedule';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'schedule_optimization', '排班优化', id, 3, '排班方案优化建议'
FROM function_modules WHERE module_key = 'schedule';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'leave_request', '请假管理', id, 4, '员工请假申请和审批'
FROM function_modules WHERE module_key = 'schedule';

-- 二级模块 - 成本管控
INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'cost_control', '成本分析', id, 1, '人力成本分析和预警'
FROM function_modules WHERE module_key = 'cost';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'revenue_prediction', '营收预测', id, 2, '营收预测和分析'
FROM function_modules WHERE module_key = 'cost';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'operation_review', '运营复盘', id, 3, '运营数据复盘分析'
FROM function_modules WHERE module_key = 'cost';

-- 二级模块 - 数据分析
INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'data_analytics', '数据分析', id, 1, '综合数据分析'
FROM function_modules WHERE module_key = 'analytics';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'revenue_detail', '营收明细', id, 2, '营收数据录入和查看'
FROM function_modules WHERE module_key = 'analytics';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'data_export', '数据导出', id, 3, '数据报表导出'
FROM function_modules WHERE module_key = 'analytics';

-- 二级模块 - 排班日志
INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'schedule_logs', '日志记录', id, 1, '排班执行日志记录'
FROM function_modules WHERE module_key = 'logs';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'schedule_ranking', '排行榜', id, 2, '排班执行排行榜'
FROM function_modules WHERE module_key = 'logs';

-- 二级模块 - 系统设置
INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'brand_config', '品牌配置', id, 1, '餐段和班次配置'
FROM function_modules WHERE module_key = 'settings';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'efficiency_config', '效能标准', id, 2, '效能标准配置'
FROM function_modules WHERE module_key = 'settings';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'min_revenue_config', '最低营收', id, 3, '最低营收配置'
FROM function_modules WHERE module_key = 'settings';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'impact_factors', '影响因子', id, 4, '营收影响因子配置'
FROM function_modules WHERE module_key = 'settings';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'rest_day_rules', '休息日规则', id, 5, '休息日规则配置'
FROM function_modules WHERE module_key = 'settings';

INSERT INTO function_modules (module_key, module_name, parent_id, sort_order, description)
SELECT 'permission_management', '权限管理', id, 6, '员工权限和岗位模板管理'
FROM function_modules WHERE module_key = 'settings';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_function_modules_parent_id ON function_modules(parent_id);
CREATE INDEX IF NOT EXISTS idx_function_modules_sort_order ON function_modules(sort_order);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_employee_id ON employee_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_module_id ON employee_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_position_templates_tenant_id ON position_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_position_templates_position_name ON position_templates(position_name);
