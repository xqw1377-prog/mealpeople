/*
# 智能排休系统数据库迁移

## 概述
创建智能排休系统所需的所有数据库表和相关配置，包括：
1. 功能模块表 - 定义系统所有功能模块
2. 岗位模块权限表 - 配置不同岗位的模块访问权限
3. 排休申请表 - 员工排休申请管理
4. 排休权重配置表 - 智能排休算法的权重配置
5. 月度排休计划表 - 存储生成的排休计划
6. 排休生成日志表 - 记录排休生成过程

## 表结构

### 1. modules - 功能模块表
- id: 主键
- code: 模块代码（唯一）
- name: 模块名称
- description: 模块描述
- group_code: 所属分组
- icon: 图标
- route: 路由路径
- sort_order: 排序
- is_system: 是否系统模块
- is_active: 是否启用

### 2. role_module_permissions - 岗位模块权限表
- id: 主键
- tenant_id: 租户ID
- store_id: 店铺ID（可选）
- position: 岗位名称
- module_code: 模块代码
- can_access: 是否可访问
- can_create: 是否可创建
- can_edit: 是否可编辑
- can_delete: 是否可删除
- can_export: 是否可导出

### 3. rest_requests - 排休申请表
- id: 主键
- tenant_id: 租户ID
- store_id: 店铺ID
- employee_id: 申请人ID
- request_month: 申请月份
- requested_dates: 申请的休息日期（JSONB）
- status: 申请状态
- reviewed_by: 审批人
- reviewed_at: 审批时间
- review_notes: 审批备注
- assigned_dates: 最终分配的休息日期

### 4. rest_weight_config - 排休权重配置表
- id: 主键
- tenant_id: 租户ID
- store_id: 店铺ID
- efficiency_weight: 人效权重
- employee_weight: 员工权重
- experience_weight: 体验保障权重
- cost_weight: 钱效权重
- efficiency_config: 人效配置（JSONB）
- employee_config: 员工配置（JSONB）
- experience_config: 体验保障配置（JSONB）
- cost_config: 钱效配置（JSONB）
- constraints: 约束条件（JSONB）

### 5. monthly_rest_schedule - 月度排休计划表
- id: 主键
- tenant_id: 租户ID
- store_id: 店铺ID
- schedule_month: 计划月份
- status: 计划状态
- schedule_data: 排休数据（JSONB）
- generation_method: 生成方法
- algorithm_version: 算法版本
- weight_config_snapshot: 权重配置快照（JSONB）
- total_score: 总得分
- efficiency_score: 人效得分
- employee_score: 员工满意度得分
- experience_score: 体验保障得分
- cost_score: 钱效得分
- total_employees: 总员工数
- total_rest_days: 总休息天数
- avg_rest_days_per_employee: 人均休息天数
- published_by: 发布人
- published_at: 发布时间

### 6. rest_schedule_logs - 排休生成日志表
- id: 主键
- schedule_id: 排休计划ID
- tenant_id: 租户ID
- log_type: 日志类型
- message: 日志消息
- details: 详细信息（JSONB）
- operator_id: 操作人ID
- operator_name: 操作人姓名

## 安全策略
- 所有表启用RLS
- 管理员拥有完全访问权限
- 员工只能查看和操作自己的数据
- 已发布的排休计划对所有员工可见
*/

-- ==================== 1. 功能模块表 ====================

CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  group_code text NOT NULL,
  icon text,
  route text,
  sort_order int DEFAULT 0,
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE modules IS '功能模块表';
COMMENT ON COLUMN modules.code IS '模块代码（唯一标识）';
COMMENT ON COLUMN modules.name IS '模块名称';
COMMENT ON COLUMN modules.group_code IS '所属分组';
COMMENT ON COLUMN modules.is_system IS '是否系统模块（不可删除）';

-- 插入系统模块
INSERT INTO modules (code, name, description, group_code, route, sort_order, is_system) VALUES
-- 基础模块
('home', '首页', '系统首页', 'basic', '/pages/home/index', 1, true),
('profile', '个人中心', '个人信息管理', 'basic', '/pages/profile/index', 2, true),

-- 管理模块
('employee_mgmt', '员工管理', '员工信息管理', 'management', '/pages/employee-management/index', 10, true),
('store_mgmt', '店铺管理', '店铺信息管理', 'management', '/pages/store-management/index', 11, true),
('efficiency_config', '效能配置', '效能标准配置', 'management', '/pages/efficiency-config/index', 12, true),

-- 高级配置模块
('core_backup', '核心岗位顶岗配置', '配置核心岗位的顶岗人员', 'advanced', '/pages/core-position-backup/index', 20, true),
('store_hierarchy', '门店组织架构', '配置排班原则', 'advanced', '/pages/store-hierarchy/index', 21, true),
('min_revenue', '最低营收岗位配置', '配置最低营收场景的必要岗位', 'advanced', '/pages/min-revenue-config/index', 22, true),
('rest_rules', '排休规则配置', '配置排休规则', 'advanced', '/pages/rest-day-rules/index', 23, true),
('rest_weight', '排休权重配置', '配置智能排休算法权重', 'advanced', '/pages/rest-weight-config/index', 24, true),
('impact_factor', '影响因子管理', '管理营收影响因子', 'advanced', '/pages/impact-factors/index', 25, true),

-- 数据管理模块
('revenue_import', '历史营收导入', '导入历史营收数据', 'data', '/pages/revenue-import/index', 30, true),

-- 排休管理模块
('rest_request', '排休申请', '员工申请排休', 'rest', '/pages/rest-request/index', 40, true),
('rest_approval', '排休审批', '审批员工排休申请', 'rest', '/pages/rest-approval/index', 41, true),
('rest_schedule_view', '排休计划查看', '查看排休计划', 'rest', '/pages/rest-schedule-view/index', 42, true),
('rest_manage', '排休计划管理', '管理和生成排休计划', 'rest', '/pages/rest-schedule-manage/index', 43, true),

-- 排班管理模块
('schedule_plan', '排班规划', '排班规划管理', 'schedule', '/pages/schedule-planning/index', 50, true),
('schedule_view', '排班查看', '查看排班信息', 'schedule', '/pages/schedule-view/index', 51, true),

-- 数据分析模块
('revenue_analysis', '营收分析', '营收数据分析', 'analysis', '/pages/revenue-analysis/index', 60, true),
('efficiency_analysis', '效能分析', '效能数据分析', 'analysis', '/pages/efficiency-analysis/index', 61, true),
('cost_analysis', '成本分析', '成本数据分析', 'analysis', '/pages/cost-analysis/index', 62, true),

-- 报表模块
('reports', '报表中心', '各类报表查看和导出', 'reports', '/pages/reports/index', 70, true)
ON CONFLICT (code) DO NOTHING;

-- ==================== 2. 岗位模块权限表 ====================

CREATE TABLE IF NOT EXISTS role_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid,
  position text NOT NULL,
  module_code text NOT NULL,
  can_access boolean DEFAULT true,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_export boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建唯一索引（处理NULL值）
CREATE UNIQUE INDEX idx_role_permissions_unique 
  ON role_module_permissions(tenant_id, COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid), position, module_code);

COMMENT ON TABLE role_module_permissions IS '岗位模块权限表';
COMMENT ON COLUMN role_module_permissions.position IS '岗位名称';
COMMENT ON COLUMN role_module_permissions.module_code IS '模块代码';
COMMENT ON COLUMN role_module_permissions.can_access IS '是否可访问';
COMMENT ON COLUMN role_module_permissions.can_create IS '是否可创建';
COMMENT ON COLUMN role_module_permissions.can_edit IS '是否可编辑';
COMMENT ON COLUMN role_module_permissions.can_delete IS '是否可删除';
COMMENT ON COLUMN role_module_permissions.can_export IS '是否可导出';

CREATE INDEX idx_role_permissions_tenant ON role_module_permissions(tenant_id);
CREATE INDEX idx_role_permissions_position ON role_module_permissions(position);
CREATE INDEX idx_role_permissions_module ON role_module_permissions(module_code);

-- ==================== 3. 排休申请表 ====================

CREATE TABLE IF NOT EXISTS rest_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  request_month text NOT NULL,
  
  requested_dates jsonb NOT NULL DEFAULT '[]'::jsonb,
  
  status text DEFAULT 'pending',
  
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  
  assigned_dates text[] DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, store_id, employee_id, request_month)
);

COMMENT ON TABLE rest_requests IS '排休申请表';
COMMENT ON COLUMN rest_requests.request_month IS '申请月份 YYYY-MM';
COMMENT ON COLUMN rest_requests.requested_dates IS '申请的休息日期 [{date, priority, reason}]';
COMMENT ON COLUMN rest_requests.status IS '申请状态 pending/approved/rejected/cancelled';
COMMENT ON COLUMN rest_requests.assigned_dates IS '最终分配的休息日期';

CREATE INDEX idx_rest_requests_tenant ON rest_requests(tenant_id);
CREATE INDEX idx_rest_requests_employee ON rest_requests(employee_id);
CREATE INDEX idx_rest_requests_month ON rest_requests(request_month);
CREATE INDEX idx_rest_requests_status ON rest_requests(status);

-- ==================== 4. 排休权重配置表 ====================

CREATE TABLE IF NOT EXISTS rest_weight_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  
  efficiency_weight int DEFAULT 40,
  employee_weight int DEFAULT 30,
  experience_weight int DEFAULT 20,
  cost_weight int DEFAULT 10,
  
  efficiency_config jsonb DEFAULT '{}'::jsonb,
  employee_config jsonb DEFAULT '{}'::jsonb,
  experience_config jsonb DEFAULT '{}'::jsonb,
  cost_config jsonb DEFAULT '{}'::jsonb,
  
  constraints jsonb DEFAULT '{}'::jsonb,
  
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, store_id),
  CONSTRAINT check_weight_sum CHECK (efficiency_weight + employee_weight + experience_weight + cost_weight = 100)
);

COMMENT ON TABLE rest_weight_config IS '排休权重配置表';
COMMENT ON COLUMN rest_weight_config.efficiency_weight IS '人效权重 0-100';
COMMENT ON COLUMN rest_weight_config.employee_weight IS '员工权重 0-100';
COMMENT ON COLUMN rest_weight_config.experience_weight IS '体验保障权重 0-100';
COMMENT ON COLUMN rest_weight_config.cost_weight IS '钱效权重 0-100';
COMMENT ON COLUMN rest_weight_config.efficiency_config IS '人效配置详情';
COMMENT ON COLUMN rest_weight_config.employee_config IS '员工配置详情';
COMMENT ON COLUMN rest_weight_config.experience_config IS '体验保障配置详情';
COMMENT ON COLUMN rest_weight_config.cost_config IS '钱效配置详情';
COMMENT ON COLUMN rest_weight_config.constraints IS '约束条件';

CREATE INDEX idx_rest_weight_tenant ON rest_weight_config(tenant_id);
CREATE INDEX idx_rest_weight_store ON rest_weight_config(store_id);

-- ==================== 5. 月度排休计划表 ====================

CREATE TABLE IF NOT EXISTS monthly_rest_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  schedule_month text NOT NULL,
  
  status text DEFAULT 'draft',
  
  schedule_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  generation_method text,
  algorithm_version text,
  weight_config_snapshot jsonb,
  
  total_score decimal(10,2),
  efficiency_score decimal(10,2),
  employee_score decimal(10,2),
  experience_score decimal(10,2),
  cost_score decimal(10,2),
  
  total_employees int,
  total_rest_days int,
  avg_rest_days_per_employee decimal(10,2),
  
  published_by uuid,
  published_at timestamptz,
  
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, store_id, schedule_month)
);

COMMENT ON TABLE monthly_rest_schedule IS '月度排休计划表';
COMMENT ON COLUMN monthly_rest_schedule.schedule_month IS '计划月份 YYYY-MM';
COMMENT ON COLUMN monthly_rest_schedule.status IS '计划状态 draft/published/archived';
COMMENT ON COLUMN monthly_rest_schedule.schedule_data IS '详细排休数据';
COMMENT ON COLUMN monthly_rest_schedule.generation_method IS '生成方法 manual/auto/hybrid';
COMMENT ON COLUMN monthly_rest_schedule.algorithm_version IS '算法版本';
COMMENT ON COLUMN monthly_rest_schedule.weight_config_snapshot IS '使用的权重配置快照';

CREATE INDEX idx_monthly_rest_tenant ON monthly_rest_schedule(tenant_id);
CREATE INDEX idx_monthly_rest_store ON monthly_rest_schedule(store_id);
CREATE INDEX idx_monthly_rest_month ON monthly_rest_schedule(schedule_month);
CREATE INDEX idx_monthly_rest_status ON monthly_rest_schedule(status);

-- ==================== 6. 排休生成日志表 ====================

CREATE TABLE IF NOT EXISTS rest_schedule_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES monthly_rest_schedule(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  
  log_type text NOT NULL,
  message text NOT NULL,
  details jsonb,
  
  operator_id uuid,
  operator_name text,
  
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE rest_schedule_logs IS '排休生成日志表';
COMMENT ON COLUMN rest_schedule_logs.log_type IS '日志类型 generation/adjustment/approval/publish';
COMMENT ON COLUMN rest_schedule_logs.message IS '日志消息';
COMMENT ON COLUMN rest_schedule_logs.details IS '详细信息';

CREATE INDEX idx_rest_logs_schedule ON rest_schedule_logs(schedule_id);
CREATE INDEX idx_rest_logs_tenant ON rest_schedule_logs(tenant_id);
CREATE INDEX idx_rest_logs_type ON rest_schedule_logs(log_type);

-- ==================== RLS策略 ====================

-- modules表
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "所有人可查看模块" ON modules 
  FOR SELECT USING (true);

CREATE POLICY "管理员可管理模块" ON modules 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

-- role_module_permissions表
ALTER TABLE role_module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可管理权限配置" ON role_module_permissions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

-- rest_requests表
ALTER TABLE rest_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "员工可查看自己的申请" ON rest_requests 
  FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "员工可创建申请" ON rest_requests 
  FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "员工可更新自己的待审批申请" ON rest_requests 
  FOR UPDATE USING (
    employee_id = auth.uid() AND status = 'pending'
  );

CREATE POLICY "管理员可查看所有申请" ON rest_requests 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

CREATE POLICY "管理员可审批申请" ON rest_requests 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

-- rest_weight_config表
ALTER TABLE rest_weight_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可管理权重配置" ON rest_weight_config 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

-- monthly_rest_schedule表
ALTER TABLE monthly_rest_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "员工可查看已发布的排休计划" ON monthly_rest_schedule 
  FOR SELECT USING (status = 'published');

CREATE POLICY "管理员可管理排休计划" ON monthly_rest_schedule 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

-- rest_schedule_logs表
ALTER TABLE rest_schedule_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可查看日志" ON rest_schedule_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

CREATE POLICY "管理员可创建日志" ON rest_schedule_logs 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );
