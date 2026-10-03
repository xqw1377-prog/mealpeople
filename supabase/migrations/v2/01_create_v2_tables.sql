/*
# 创建2.0版本核心表

## 新增表
1. revenue_predictions - 营收预测表
2. impact_factors - 影响因子表
3. scheduling_optimizations - 排班优化记录表
4. risk_alerts - 风险预警表
5. staff_transfers - 人员调配记录表
6. best_practices - 最佳实践分享表

## 安全策略
- 所有表启用RLS
- 租户数据完全隔离
- 管理员拥有完整权限
*/

-- ==================== 营收预测表 ====================

CREATE TABLE IF NOT EXISTS revenue_predictions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 预测信息
    prediction_type text NOT NULL CHECK (prediction_type IN ('monthly', 'daily')),
    target_period date NOT NULL,
    
    -- 预测结果
    conservative_value decimal(12,2) NOT NULL,
    baseline_value decimal(12,2) NOT NULL,
    optimistic_value decimal(12,2) NOT NULL,
    confidence decimal(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    
    -- 影响因子
    applied_factors jsonb,
    
    -- 准确率追踪
    actual_value decimal(12,2),
    accuracy_rate decimal(5,2),
    
    -- 元数据
    model_version text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_predictions_tenant ON revenue_predictions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_predictions_store ON revenue_predictions(store_id);
CREATE INDEX IF NOT EXISTS idx_predictions_period ON revenue_predictions(target_period);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON revenue_predictions(prediction_type);

-- 启用RLS
ALTER TABLE revenue_predictions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的预测记录" ON revenue_predictions
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "租户管理员可创建预测记录" ON revenue_predictions
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('tenant_admin', 'super_admin')
        )
    );

CREATE POLICY "租户管理员可更新预测记录" ON revenue_predictions
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('tenant_admin', 'super_admin')
        )
    );

-- ==================== 影响因子表 ====================

CREATE TABLE IF NOT EXISTS impact_factors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- 因子信息
    factor_type text NOT NULL CHECK (factor_type IN ('weather', 'holiday', 'event', 'marketing', 'competition', 'internal')),
    factor_name text NOT NULL,
    factor_category text,
    
    -- 影响值
    impact_value decimal(5,4) NOT NULL CHECK (impact_value >= -1.0 AND impact_value <= 1.0),
    confidence decimal(4,3) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    
    -- 生效时间
    effective_date date NOT NULL,
    expiration_date date,
    
    -- 数据来源
    data_source text NOT NULL CHECK (data_source IN ('auto', 'manual', 'api')),
    source_details jsonb,
    
    -- 元数据
    description text,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- 约束：过期日期必须大于生效日期
    CONSTRAINT valid_date_range CHECK (expiration_date IS NULL OR expiration_date >= effective_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_factors_tenant ON impact_factors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_factors_effective ON impact_factors(effective_date);
CREATE INDEX IF NOT EXISTS idx_factors_type ON impact_factors(factor_type);
CREATE INDEX IF NOT EXISTS idx_factors_expiration ON impact_factors(expiration_date);

-- 启用RLS
ALTER TABLE impact_factors ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的影响因子" ON impact_factors
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "租户管理员可管理影响因子" ON impact_factors
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('tenant_admin', 'super_admin')
        )
    );

-- ==================== 排班优化记录表 ====================

CREATE TABLE IF NOT EXISTS scheduling_optimizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    schedule_id uuid NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    
    -- 优化信息
    optimization_type text NOT NULL CHECK (optimization_type IN ('initial', 'adjustment', 'emergency')),
    trigger_reason text,
    
    -- 优化前后对比
    before_data jsonb NOT NULL,
    after_data jsonb NOT NULL,
    improvements jsonb,
    
    -- 优化目标
    objectives jsonb,
    weights jsonb,
    
    -- 结果评估
    cost_impact decimal(10,2),
    efficiency_impact decimal(8,2),
    satisfaction_impact decimal(4,2),
    
    -- 执行状态
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
    applied_at timestamptz,
    applied_by uuid REFERENCES auth.users(id),
    
    created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_optimizations_tenant ON scheduling_optimizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_schedule ON scheduling_optimizations(schedule_id);
CREATE INDEX IF NOT EXISTS idx_optimizations_status ON scheduling_optimizations(status);
CREATE INDEX IF NOT EXISTS idx_optimizations_created ON scheduling_optimizations(created_at DESC);

-- 启用RLS
ALTER TABLE scheduling_optimizations ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的优化记录" ON scheduling_optimizations
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "店经理可创建优化记录" ON scheduling_optimizations
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- ==================== 风险预警表 ====================

CREATE TABLE IF NOT EXISTS risk_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 风险信息
    risk_type text NOT NULL CHECK (risk_type IN ('personnel', 'cost', 'operation')),
    risk_level text NOT NULL CHECK (risk_level IN ('high', 'medium', 'low')),
    risk_category text NOT NULL,
    
    -- 风险详情
    risk_title text NOT NULL,
    risk_description text,
    risk_impact jsonb,
    
    -- 建议措施
    recommendations jsonb,
    
    -- 处理状态
    status text DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'ignored')),
    acknowledged_at timestamptz,
    acknowledged_by uuid REFERENCES auth.users(id),
    resolved_at timestamptz,
    resolution_notes text,
    
    -- 元数据
    detected_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_alerts_tenant ON risk_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_store ON risk_alerts(store_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON risk_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON risk_alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON risk_alerts(risk_type);
CREATE INDEX IF NOT EXISTS idx_alerts_detected ON risk_alerts(detected_at DESC);

-- 启用RLS
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的风险预警" ON risk_alerts
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "店经理可管理风险预警" ON risk_alerts
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- ==================== 人员调配记录表 ====================

CREATE TABLE IF NOT EXISTS staff_transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    to_store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- 调配信息
    transfer_date date NOT NULL,
    transfer_hours decimal(4,2) NOT NULL,
    reason text NOT NULL,
    
    -- 状态
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    cost decimal(10,2),
    
    -- 审批信息
    approved_by uuid REFERENCES auth.users(id),
    approved_at timestamptz,
    
    -- 创建信息
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    
    -- 约束：不能调配到同一店铺
    CONSTRAINT different_stores CHECK (from_store_id != to_store_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_transfers_tenant ON staff_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from_store ON staff_transfers(from_store_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_store ON staff_transfers(to_store_id);
CREATE INDEX IF NOT EXISTS idx_transfers_employee ON staff_transfers(employee_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON staff_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON staff_transfers(status);

-- 启用RLS
ALTER TABLE staff_transfers ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的调配记录" ON staff_transfers
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "店经理可创建调配申请" ON staff_transfers
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- ==================== 最佳实践分享表 ====================

CREATE TABLE IF NOT EXISTS best_practices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 实践信息
    title text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    
    -- 成果数据
    results jsonb,
    
    -- 统计信息
    applied_count integer DEFAULT 0,
    rating decimal(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    
    -- 创建信息
    created_by uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_practices_tenant ON best_practices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_practices_store ON best_practices(store_id);
CREATE INDEX IF NOT EXISTS idx_practices_category ON best_practices(category);
CREATE INDEX IF NOT EXISTS idx_practices_rating ON best_practices(rating DESC);
CREATE INDEX IF NOT EXISTS idx_practices_created ON best_practices(created_at DESC);

-- 启用RLS
ALTER TABLE best_practices ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的最佳实践" ON best_practices
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "店经理可分享最佳实践" ON best_practices
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- 添加注释
COMMENT ON TABLE revenue_predictions IS '营收预测表 - 存储AI预测的营收数据';
COMMENT ON TABLE impact_factors IS '影响因子表 - 存储影响营收的各类因子';
COMMENT ON TABLE scheduling_optimizations IS '排班优化记录表 - 存储排班优化的历史记录';
COMMENT ON TABLE risk_alerts IS '风险预警表 - 存储系统检测到的各类风险';
COMMENT ON TABLE staff_transfers IS '人员调配记录表 - 存储跨店人员调配记录';
COMMENT ON TABLE best_practices IS '最佳实践分享表 - 存储各店的优秀经验分享';
