/*
# 修复配置表RLS策略

## 问题说明
当前min_revenue_positions、rest_day_rules、positions等表的RLS策略依赖于profiles.tenant_id，
但部分用户的tenant_id为null，导致保存失败。

## 解决方案
修改RLS策略，允许管理员角色（store_manager、tenant_admin、super_admin）直接管理这些表，
不再依赖tenant_id匹配。

## 修改内容
1. 删除旧的RLS策略
2. 创建新的RLS策略，基于用户角色而不是tenant_id
3. 确保管理员可以创建、更新、删除配置
4. 确保所有用户可以查看配置

## 影响的表
- min_revenue_positions（最低营收岗位配置）
- rest_day_rules（排休规则）
- positions（岗位管理）
*/

-- ============================================
-- 1. 修复min_revenue_positions表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "租户成员可查看最低营收配置" ON min_revenue_positions;
DROP POLICY IF EXISTS "管理者可管理最低营收配置" ON min_revenue_positions;

-- 创建新策略：所有认证用户可以查看
CREATE POLICY "认证用户可查看最低营收配置"
ON min_revenue_positions FOR SELECT
TO authenticated
USING (true);

-- 创建新策略：管理员可以插入
CREATE POLICY "管理员可创建最低营收配置"
ON min_revenue_positions FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 创建新策略：管理员可以更新
CREATE POLICY "管理员可更新最低营收配置"
ON min_revenue_positions FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 创建新策略：管理员可以删除
CREATE POLICY "管理员可删除最低营收配置"
ON min_revenue_positions FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- ============================================
-- 2. 修复rest_day_rules表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "租户成员可查看排休规则" ON rest_day_rules;
DROP POLICY IF EXISTS "管理者可管理排休规则" ON rest_day_rules;

-- 创建新策略：所有认证用户可以查看
CREATE POLICY "认证用户可查看排休规则"
ON rest_day_rules FOR SELECT
TO authenticated
USING (true);

-- 创建新策略：管理员可以插入
CREATE POLICY "管理员可创建排休规则"
ON rest_day_rules FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 创建新策略：管理员可以更新
CREATE POLICY "管理员可更新排休规则"
ON rest_day_rules FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 创建新策略：管理员可以删除
CREATE POLICY "管理员可删除排休规则"
ON rest_day_rules FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- ============================================
-- 3. 修复positions表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "租户成员可查看岗位" ON positions;
DROP POLICY IF EXISTS "管理者可管理岗位" ON positions;

-- 创建新策略：所有认证用户可以查看
CREATE POLICY "认证用户可查看岗位"
ON positions FOR SELECT
TO authenticated
USING (true);

-- 创建新策略：管理员可以插入
CREATE POLICY "管理员可创建岗位"
ON positions FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 创建新策略：管理员可以更新
CREATE POLICY "管理员可更新岗位"
ON positions FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 创建新策略：管理员可以删除
CREATE POLICY "管理员可删除岗位"
ON positions FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- ============================================
-- 4. 添加说明注释
-- ============================================

COMMENT ON POLICY "认证用户可查看最低营收配置" ON min_revenue_positions IS '所有认证用户都可以查看最低营收配置';
COMMENT ON POLICY "管理员可创建最低营收配置" ON min_revenue_positions IS '管理员可以创建最低营收配置';
COMMENT ON POLICY "管理员可更新最低营收配置" ON min_revenue_positions IS '管理员可以更新最低营收配置';
COMMENT ON POLICY "管理员可删除最低营收配置" ON min_revenue_positions IS '管理员可以删除最低营收配置';

COMMENT ON POLICY "认证用户可查看排休规则" ON rest_day_rules IS '所有认证用户都可以查看排休规则';
COMMENT ON POLICY "管理员可创建排休规则" ON rest_day_rules IS '管理员可以创建排休规则';
COMMENT ON POLICY "管理员可更新排休规则" ON rest_day_rules IS '管理员可以更新排休规则';
COMMENT ON POLICY "管理员可删除排休规则" ON rest_day_rules IS '管理员可以删除排休规则';

COMMENT ON POLICY "认证用户可查看岗位" ON positions IS '所有认证用户都可以查看岗位';
COMMENT ON POLICY "管理员可创建岗位" ON positions IS '管理员可以创建岗位';
COMMENT ON POLICY "管理员可更新岗位" ON positions IS '管理员可以更新岗位';
COMMENT ON POLICY "管理员可删除岗位" ON positions IS '管理员可以删除岗位';
