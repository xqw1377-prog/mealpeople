/*
# 2.0版本高级配置功能

## 新增功能
1. 员工管理增强（核心岗位、顶岗配置）
2. 核心岗位顶岗配置模块
3. 门店组织架构配置
4. 门店最低营收岗位配置
5. 历史营收数据导入

## 表结构变更
1. 扩展employees表
2. 创建core_position_backup表
3. 创建store_hierarchy表
4. 创建min_revenue_positions表
5. 创建revenue_history表
*/

-- ==================== 扩展员工表 ====================

-- 添加员工新字段
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_core_position boolean DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_fixed_backup boolean DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS can_backup_positions text[] DEFAULT '{}';

-- 添加注释
COMMENT ON COLUMN employees.is_core_position IS '是否核心岗位';
COMMENT ON COLUMN employees.position_fixed_backup IS '岗位是否需要固定顶岗';
COMMENT ON COLUMN employees.can_backup_positions IS '可以顶岗的其他岗位列表';

-- ==================== 核心岗位顶岗配置表 ====================

CREATE TABLE IF NOT EXISTS core_position_backup (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 核心岗位信息
    core_employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    core_position text NOT NULL,
    
    -- 顶岗人员配置
    backup_employee_ids uuid[] NOT NULL DEFAULT '{}',
    
    -- 约束规则
    no_same_day_off boolean DEFAULT true,
    
    -- 元数据
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_core_backup_tenant ON core_position_backup(tenant_id);
CREATE INDEX IF NOT EXISTS idx_core_backup_store ON core_position_backup(store_id);
CREATE INDEX IF NOT EXISTS idx_core_backup_core_emp ON core_position_backup(core_employee_id);

-- 启用RLS
ALTER TABLE core_position_backup ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的顶岗配置" ON core_position_backup
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "店经理可管理顶岗配置" ON core_position_backup
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- ==================== 门店组织架构配置表 ====================

CREATE TABLE IF NOT EXISTS store_hierarchy (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 排班原则
    scheduling_principle text NOT NULL CHECK (scheduling_principle IN ('top_only', 'top_and_down')),
    
    -- 组织架构数据（JSON格式）
    hierarchy_data jsonb,
    
    -- 元数据
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- 唯一约束：每个店铺只有一个配置
    UNIQUE(store_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_hierarchy_tenant ON store_hierarchy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hierarchy_store ON store_hierarchy(store_id);

-- 启用RLS
ALTER TABLE store_hierarchy ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的组织架构" ON store_hierarchy
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "店经理可管理组织架构" ON store_hierarchy
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- ==================== 最低营收岗位配置表 ====================

CREATE TABLE IF NOT EXISTS min_revenue_positions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 最低营收场景
    min_revenue decimal(12,2) NOT NULL,
    scenario_name text NOT NULL,
    
    -- 必要岗位配置
    required_positions jsonb NOT NULL,
    
    -- 元数据
    description text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_min_revenue_tenant ON min_revenue_positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_min_revenue_store ON min_revenue_positions(store_id);
CREATE INDEX IF NOT EXISTS idx_min_revenue_value ON min_revenue_positions(min_revenue);

-- 启用RLS
ALTER TABLE min_revenue_positions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的最低营收配置" ON min_revenue_positions
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "店经理可管理最低营收配置" ON min_revenue_positions
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- ==================== 历史营收数据表 ====================

CREATE TABLE IF NOT EXISTS revenue_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 日期和营收
    revenue_date date NOT NULL,
    revenue_amount decimal(12,2) NOT NULL,
    
    -- 其他数据
    customer_count integer,
    staff_count integer,
    working_hours decimal(8,2),
    labor_cost decimal(12,2),
    
    -- 数据来源
    data_source text DEFAULT 'import' CHECK (data_source IN ('import', 'manual', 'system')),
    import_batch_id uuid,
    
    -- 元数据
    notes text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    
    -- 唯一约束：每个店铺每天只有一条记录
    UNIQUE(store_id, revenue_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_revenue_history_tenant ON revenue_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_revenue_history_store ON revenue_history(store_id);
CREATE INDEX IF NOT EXISTS idx_revenue_history_date ON revenue_history(revenue_date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_history_batch ON revenue_history(import_batch_id);

-- 启用RLS
ALTER TABLE revenue_history ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的历史营收" ON revenue_history
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "店经理可管理历史营收" ON revenue_history
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- 添加注释
COMMENT ON TABLE core_position_backup IS '核心岗位顶岗配置表';
COMMENT ON TABLE store_hierarchy IS '门店组织架构配置表';
COMMENT ON TABLE min_revenue_positions IS '最低营收岗位配置表';
COMMENT ON TABLE revenue_history IS '历史营收数据表';
