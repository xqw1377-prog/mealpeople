-- 测试工作班次权限
-- 检查当前用户的角色和租户信息

-- 1. 查看当前用户的profile信息
SELECT 
    id,
    phone,
    email,
    role,
    tenant_id,
    created_at
FROM profiles 
WHERE id = auth.uid();

-- 2. 查看当前用户所属的租户
SELECT 
    t.id,
    t.tenant_name,
    t.is_active
FROM tenants t
WHERE t.id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
);

-- 3. 测试是否可以查看work_shifts
SELECT COUNT(*) as work_shifts_count
FROM work_shifts
WHERE tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
);

-- 4. 测试插入权限（不实际插入，只检查策略）
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('tenant_admin', 'store_manager')
        ) THEN '有创建权限'
        ELSE '无创建权限'
    END as insert_permission;
