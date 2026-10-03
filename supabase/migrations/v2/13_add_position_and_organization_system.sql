/*
# 岗位管理和组织架构系统

## 1. 新增表

### 1.1 岗位表 (positions)
存储租户的岗位信息。

字段说明：
- id: 主键
- tenant_id: 租户ID
- position_name: 岗位名称
- position_level: 岗位层级（1=店长，2=主管，3=员工）
- description: 岗位描述
- sort_order: 排序顺序
- is_active: 是否启用
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

### 1.2 岗位模块权限表 (position_module_permissions)
存储岗位对模块的访问权限。

字段说明：
- id: 主键
- tenant_id: 租户ID
- position_id: 岗位ID
- module_id: 模块ID
- can_view: 是否可查看
- can_create: 是否可创建
- can_edit: 是否可编辑
- can_delete: 是否可删除
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

### 1.3 员工岗位关联表 (employee_positions)
存储员工与岗位的关联关系。

字段说明：
- id: 主键
- tenant_id: 租户ID
- employee_id: 员工ID
- position_id: 岗位ID
- is_primary: 是否主岗位
- effective_date: 生效日期
- expiry_date: 失效日期
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

### 1.4 门店组织架构表 (store_organization)
存储门店的组织架构配置。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 门店ID
- position_id: 岗位ID
- parent_position_id: 上级岗位ID
- position_level: 岗位层级（1=一级，2=二级，3=三级）
- required_count: 该岗位需要的人数
- sort_order: 排序顺序
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

### 1.5 门店岗位人员分配表 (store_position_assignments)
存储门店岗位的人员分配。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 门店ID
- organization_id: 组织架构ID
- employee_id: 员工ID
- is_primary: 是否主岗
- effective_date: 生效日期
- expiry_date: 失效日期
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

### 1.6 顶岗关系配置表 (backup_position_config)
存储岗位之间的顶岗关系。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 门店ID
- primary_position_id: 主岗位ID
- backup_position_id: 可顶岗的岗位ID
- backup_type: 顶岗类型（'up'=向上顶岗，'down'=向下顶岗）
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

## 2. 安全策略 (RLS)

### 2.1 岗位表策略
- 租户内用户可查看本租户的岗位
- 管理员可管理本租户的岗位

### 2.2 岗位权限表策略
- 租户内用户可查看本租户的岗位权限
- 管理员可管理本租户的岗位权限

### 2.3 员工岗位关联表策略
- 员工可查看自己的岗位
- 管理员可查看和管理本租户的员工岗位

### 2.4 组织架构表策略
- 租户内用户可查看本租户的组织架构
- 管理员可管理本租户的组织架构

### 2.5 人员分配表策略
- 员工可查看自己的岗位分配
- 管理员可查看和管理本租户的人员分配

### 2.6 顶岗关系表策略
- 租户内用户可查看本租户的顶岗关系
- 管理员可管理本租户的顶岗关系

## 3. 注意事项
- 所有表都包含租户ID，确保数据隔离
- 使用RLS策略保护数据安全
- 岗位层级用于组织架构的层级展示
- 员工可以有多个岗位，但只能有一个主岗位
- 顶岗关系根据门店的顶岗原则自动生成或手动配置
*/

-- ============================================
-- 1. 创建岗位表
-- ============================================
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  position_name TEXT NOT NULL,
  position_level INTEGER NOT NULL CHECK (position_level >= 1 AND position_level <= 3),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_positions_tenant_id ON positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_positions_level ON positions(position_level);
CREATE INDEX IF NOT EXISTS idx_positions_active ON positions(is_active);

-- 启用RLS
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "租户内用户可查看本租户的岗位" ON positions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "管理员可管理本租户的岗位" ON positions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- ============================================
-- 2. 创建岗位模块权限表
-- ============================================
CREATE TABLE IF NOT EXISTS position_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES system_modules(id) ON DELETE CASCADE,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(position_id, module_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_position_permissions_tenant ON position_module_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_position_permissions_position ON position_module_permissions(position_id);
CREATE INDEX IF NOT EXISTS idx_position_permissions_module ON position_module_permissions(module_id);

-- 启用RLS
ALTER TABLE position_module_permissions ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "租户内用户可查看本租户的岗位权限" ON position_module_permissions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "管理员可管理本租户的岗位权限" ON position_module_permissions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- ============================================
-- 3. 创建员工岗位关联表
-- ============================================
CREATE TABLE IF NOT EXISTS employee_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_employee_positions_tenant ON employee_positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_positions_employee ON employee_positions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_positions_position ON employee_positions(position_id);
CREATE INDEX IF NOT EXISTS idx_employee_positions_dates ON employee_positions(effective_date, expiry_date);

-- 启用RLS
ALTER TABLE employee_positions ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "员工可查看自己的岗位" ON employee_positions
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

CREATE POLICY "管理员可管理本租户的员工岗位" ON employee_positions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- ============================================
-- 4. 创建门店组织架构表
-- ============================================
CREATE TABLE IF NOT EXISTS store_organization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  parent_position_id UUID REFERENCES store_organization(id) ON DELETE SET NULL,
  position_level INTEGER NOT NULL CHECK (position_level >= 1 AND position_level <= 3),
  required_count INTEGER DEFAULT 1 CHECK (required_count > 0),
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_store_org_tenant ON store_organization(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_org_store ON store_organization(store_id);
CREATE INDEX IF NOT EXISTS idx_store_org_position ON store_organization(position_id);
CREATE INDEX IF NOT EXISTS idx_store_org_parent ON store_organization(parent_position_id);
CREATE INDEX IF NOT EXISTS idx_store_org_level ON store_organization(position_level);

-- 启用RLS
ALTER TABLE store_organization ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "租户内用户可查看本租户的组织架构" ON store_organization
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "管理员可管理本租户的组织架构" ON store_organization
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- ============================================
-- 5. 创建门店岗位人员分配表
-- ============================================
CREATE TABLE IF NOT EXISTS store_position_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES store_organization(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_store_assignments_tenant ON store_position_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_store_assignments_store ON store_position_assignments(store_id);
CREATE INDEX IF NOT EXISTS idx_store_assignments_org ON store_position_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_store_assignments_employee ON store_position_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_store_assignments_dates ON store_position_assignments(effective_date, expiry_date);

-- 启用RLS
ALTER TABLE store_position_assignments ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "员工可查看自己的岗位分配" ON store_position_assignments
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

CREATE POLICY "管理员可管理本租户的人员分配" ON store_position_assignments
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- ============================================
-- 6. 创建顶岗关系配置表
-- ============================================
CREATE TABLE IF NOT EXISTS backup_position_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL,
  primary_position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  backup_position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('up', 'down')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, primary_position_id, backup_position_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_backup_config_tenant ON backup_position_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_config_store ON backup_position_config(store_id);
CREATE INDEX IF NOT EXISTS idx_backup_config_primary ON backup_position_config(primary_position_id);
CREATE INDEX IF NOT EXISTS idx_backup_config_backup ON backup_position_config(backup_position_id);

-- 启用RLS
ALTER TABLE backup_position_config ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "租户内用户可查看本租户的顶岗关系" ON backup_position_config
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "管理员可管理本租户的顶岗关系" ON backup_position_config
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin', 'store_manager')
    )
  );

-- ============================================
-- 7. 插入默认岗位数据（示例）
-- ============================================
-- 注意：这里不插入默认数据，由租户自行创建岗位

-- ============================================
-- 8. 创建辅助函数
-- ============================================

-- 获取员工的所有有效岗位
CREATE OR REPLACE FUNCTION get_employee_active_positions(emp_id UUID)
RETURNS TABLE (
  position_id UUID,
  position_name TEXT,
  position_level INTEGER,
  is_primary BOOLEAN
) LANGUAGE sql STABLE AS $$
  SELECT 
    p.id,
    p.position_name,
    p.position_level,
    ep.is_primary
  FROM employee_positions ep
  JOIN positions p ON ep.position_id = p.id
  WHERE ep.employee_id = emp_id
    AND ep.effective_date <= CURRENT_DATE
    AND (ep.expiry_date IS NULL OR ep.expiry_date >= CURRENT_DATE)
    AND p.is_active = true
  ORDER BY ep.is_primary DESC, p.position_level ASC;
$$;

-- 获取岗位的当前人员数量
CREATE OR REPLACE FUNCTION get_position_current_count(org_id UUID)
RETURNS INTEGER LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::INTEGER
  FROM store_position_assignments
  WHERE organization_id = org_id
    AND effective_date <= CURRENT_DATE
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE);
$$;

-- 检查岗位是否缺人
CREATE OR REPLACE FUNCTION is_position_understaffed(org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT 
    COALESCE(get_position_current_count(org_id), 0) < so.required_count
  FROM store_organization so
  WHERE so.id = org_id;
$$;
