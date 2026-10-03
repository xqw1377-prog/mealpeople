/*
# 修复岗位管理表的RLS策略

## 问题
>RLS策略
2. 创建新的完整RLS策略
3. 使用当前角色系统

*/

-- ============================================
-- 修复 positions 表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "租户内用户可查看本租户的岗位" ON positions;
DROP POLICY IF EXISTS "管理员可管理本租户的岗位" ON positions;

-- 创建新策略：所有租户成员可以查看
CREATE POLICY "租户成员可查看岗位" ON positions
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 创建新策略：管理者可以管理
CREATE POLICY "管理者可管理岗位" ON positions
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- 添加说明注释
COMMENT ON POLICY "租户成员可查看岗位" ON positions IS '所有租户成员都可以查看岗位';
COMMENT ON POLICY "管理者可管理岗位" ON positions IS '管理者可以创建、更新、删除岗位';
