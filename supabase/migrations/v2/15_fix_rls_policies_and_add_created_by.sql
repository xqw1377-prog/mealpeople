/*
# 修复RLS策略

## 问题描述
1. rest_day_rules 和 min_revenue_positions 表的RLS策略过于严格
2. 需要允许所有租户成员查看，管理者可以管理

## 修复内容
1. 删除旧的RLS策略
2. 创建新的RLS策略
3. 使用当前的角色系统：super_admin, tenant_admin, store_manager, employee, guest

*/

-- ============================================
-- 1. 修复 rest_day_rules 表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "租户可查看自己的排休规则" ON rest_day_rules;
DROP POLICY IF EXISTS "店经理可管理排休规则" ON rest_day_rules;
DROP POLICY IF EXISTS "租户成员可查看排休规则" ON rest_day_rules;
DROP POLICY IF EXISTS "管理者可管理排休规则" ON rest_day_rules;

-- 创建新策略：所有租户成员可以查看
CREATE POLICY "租户成员可查看排休规则" ON rest_day_rules
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 创建新策略：管理者可以管理
CREATE POLICY "管理者可管理排休规则" ON rest_day_rules
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- ============================================
-- 2. 修复 min_revenue_positions 表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "租户可查看自己的最低营收配置" ON min_revenue_positions;
DROP POLICY IF EXISTS "店经理可管理最低营收配置" ON min_revenue_positions;
DROP POLICY IF EXISTS "租户成员可查看最低营收配置" ON min_revenue_positions;
DROP POLICY IF EXISTS "管理者可管理最低营收配置" ON min_revenue_positions;

-- 创建新策略：所有租户成员可以查看
CREATE POLICY "租户成员可查看最低营收配置" ON min_revenue_positions
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 创建新策略：管理者可以管理
CREATE POLICY "管理者可管理最低营收配置" ON min_revenue_positions
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- ============================================
-- 3. 添加说明注释
-- ============================================

COMMENT ON POLICY "租户成员可查看排休规则" ON rest_day_rules IS '所有租户成员都可以查看排休规则';
COMMENT ON POLICY "管理者可管理排休规则" ON rest_day_rules IS '管理者可以创建、更新、删除排休规则';

COMMENT ON POLICY "租户成员可查看最低营收配置" ON min_revenue_positions IS '所有租户成员都可以查看最低营收配置';
COMMENT ON POLICY "管理者可管理最低营收配置" ON min_revenue_positions IS '管理者可以创建、更新、删除最低营收配置';
