/*
# 排休规则配置表

## 功能说明
配置员工的排休规则，包括：
1. 每月休息天数
2. 不可排休时间
3. 每月最多可以申请特定日子休息天数
4. 不可存休/可存休
5. 不可连休/最多连休天数

## 表结构
- rest_day_rules: 排休规则配置表
*/

-- ==================== 排休规则配置表 ====================

CREATE TABLE IF NOT EXISTS rest_day_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- 规则名称
    rule_name text NOT NULL,
    
    -- 每月休息天数
    monthly_rest_days integer NOT NULL DEFAULT 4,
    
    -- 不可排休时间（JSON数组，存储日期范围或特定日期）
    blocked_dates jsonb DEFAULT '[]',
    
    -- 每月最多可以申请特定日子休息天数
    max_specific_date_requests integer DEFAULT 2,
    
    -- 是否可以存休
    allow_rest_accumulation boolean DEFAULT false,
    
    -- 最大存休天数（如果允许存休）
    max_accumulated_days integer DEFAULT 0,
    
    -- 是否允许连休
    allow_consecutive_rest boolean DEFAULT true,
    
    -- 最多连休天数
    max_consecutive_days integer DEFAULT 2,
    
    -- 是否启用
    is_active boolean DEFAULT true,
    
    -- 适用员工（JSON数组，存储员工ID，空表示适用所有员工）
    applicable_employees jsonb DEFAULT '[]',
    
    -- 优先级（数字越大优先级越高）
    priority integer DEFAULT 0,
    
    -- 备注说明
    description text,
    
    -- 元数据
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rest_rules_tenant ON rest_day_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rest_rules_store ON rest_day_rules(store_id);
CREATE INDEX IF NOT EXISTS idx_rest_rules_active ON rest_day_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_rest_rules_priority ON rest_day_rules(priority DESC);

-- 启用RLS
ALTER TABLE rest_day_rules ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "租户可查看自己的排休规则" ON rest_day_rules
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "店经理可管理排休规则" ON rest_day_rules
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- 添加注释
COMMENT ON TABLE rest_day_rules IS '排休规则配置表';
COMMENT ON COLUMN rest_day_rules.rule_name IS '规则名称';
COMMENT ON COLUMN rest_day_rules.monthly_rest_days IS '每月休息天数';
COMMENT ON COLUMN rest_day_rules.blocked_dates IS '不可排休时间（JSON数组）';
COMMENT ON COLUMN rest_day_rules.max_specific_date_requests IS '每月最多可以申请特定日子休息天数';
COMMENT ON COLUMN rest_day_rules.allow_rest_accumulation IS '是否可以存休';
COMMENT ON COLUMN rest_day_rules.max_accumulated_days IS '最大存休天数';
COMMENT ON COLUMN rest_day_rules.allow_consecutive_rest IS '是否允许连休';
COMMENT ON COLUMN rest_day_rules.max_consecutive_days IS '最多连休天数';
COMMENT ON COLUMN rest_day_rules.is_active IS '是否启用';
COMMENT ON COLUMN rest_day_rules.applicable_employees IS '适用员工（JSON数组）';
COMMENT ON COLUMN rest_day_rules.priority IS '优先级（数字越大优先级越高）';
