/*
# 修复work_shifts表的RLS策略

## 1. 问题
- 原有策略要求profiles表中必须有tenant_id
- 但某些用户可能通过tenant_members表关联租户
- 导致无法创建工作班次

## 2. 解决方案
- 删除原有策略
- 创建新策略，同时检查profiles和tenant_members表
- 确保租户管理员和门店经理都能创建班次

*/

-- 删除原有策略
DROP POLICY IF EXISTS "租户成员可以查看本租户班次配置" ON work_shifts;
DROP POLICY IF EXISTS "租户管理员可以创建班次配置" ON work_shifts;
DROP POLICY IF EXISTS "租户管理员可以更新班次配置" ON work_shifts;
DROP POLICY IF EXISTS "租户管理员可以删除班次配置" ON work_shifts;

-- 创建辅助函数：检查用户是否是租户管理员
CREATE OR REPLACE FUNCTION is_tenant_admin_or_manager(user_id UUID, check_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- 检查profiles表中的角色
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id 
        AND tenant_id = check_tenant_id
        AND role IN ('tenant_admin', 'store_manager')
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- 检查tenant_members表中的角色
    IF EXISTS (
        SELECT 1 FROM tenant_members 
        WHERE user_id = user_id 
        AND tenant_id = check_tenant_id
        AND role IN ('tenant_admin', 'store_manager')
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建辅助函数：获取用户的租户ID列表
CREATE OR REPLACE FUNCTION get_user_tenant_ids(user_id UUID)
RETURNS TABLE(tenant_id UUID) AS $$
BEGIN
    RETURN QUERY
    -- 从profiles表获取
    SELECT p.tenant_id FROM profiles p WHERE p.id = user_id AND p.tenant_id IS NOT NULL
    UNION
    -- 从tenant_members表获取
    SELECT tm.tenant_id FROM tenant_members tm WHERE tm.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新策略：租户成员可以查看本租户班次配置
CREATE POLICY "租户成员可以查看本租户班次配置" ON work_shifts
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (SELECT get_user_tenant_ids(auth.uid()))
    );

-- 新策略：租户管理员可以创建班次配置
CREATE POLICY "租户管理员可以创建班次配置" ON work_shifts
    FOR INSERT TO authenticated
    WITH CHECK (
        is_tenant_admin_or_manager(auth.uid(), tenant_id)
    );

-- 新策略：租户管理员可以更新班次配置
CREATE POLICY "租户管理员可以更新班次配置" ON work_shifts
    FOR UPDATE TO authenticated
    USING (
        is_tenant_admin_or_manager(auth.uid(), tenant_id)
    )
    WITH CHECK (
        is_tenant_admin_or_manager(auth.uid(), tenant_id)
    );

-- 新策略：租户管理员可以删除班次配置
CREATE POLICY "租户管理员可以删除班次配置" ON work_shifts
    FOR DELETE TO authenticated
    USING (
        is_tenant_admin_or_manager(auth.uid(), tenant_id)
    );
