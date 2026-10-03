/*
# 最终修复经营区域表RLS策略

## 问题说明
business_areas表的RLS策略仍然依赖于profiles.tenant_id，
但部分用户的tenant_id为null，导致保存失败。

## 解决方案
修改RLS策略，允许管理员角色（store_manager、tenant_admin、super_admin）直接管理，
不再依赖tenant_id匹配。

## 修改内容
1. 删除旧的RLS策略
2. 创建新的RLS策略，基于用户角色而不是tenant_id
3. 确保管理员可以创建、更新、删除经营区域
4. 确保所有认证用户可以查看经营区域
*/

-- ============================================
-- 修复business_areas表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "租户成员可查看经营区域" ON business_areas;
DROP POLICY IF EXISTS "管理者可管理经营区域" ON business_areas;

-- 创建新策略：所有认证用户可以查看
CREATE POLICY "认证用户可查看经营区域"
ON business_areas FOR SELECT
TO authenticated
USING (true);

-- 创建新策略：管理员可以插入
CREATE POLICY "管理员可创建经营区域"
ON business_areas FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 创建新策略：管理员可以更新
CREATE POLICY "管理员可更新经营区域"
ON business_areas FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 创建新策略：管理员可以删除
CREATE POLICY "管理员可删除经营区域"
ON business_areas FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);

-- 添加说明注释
COMMENT ON POLICY "认证用户可查看经营区域" ON business_areas IS '所有认证用户都可以查看经营区域';
COMMENT ON POLICY "管理员可创建经营区域" ON business_areas IS '管理员可以创建经营区域';
COMMENT ON POLICY "管理员可更新经营区域" ON business_areas IS '管理员可以更新经营区域';
COMMENT ON POLICY "管理员可删除经营区域" ON business_areas IS '管理员可以删除经营区域';
