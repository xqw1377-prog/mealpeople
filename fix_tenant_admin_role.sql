-- 修复租户管理员角色问题
-- 用户ID: 728d8bc1-8c5c-4f55-a012-b3d1cededde8
-- 电话: 18373804961

-- 步骤 1: 查询当前状态
SELECT 
    '=== 当前用户 Profile 状态 ===' AS info;

SELECT 
    id, 
    phone, 
    email, 
    role, 
    tenant_id, 
    created_at, 
    updated_at
FROM profiles
WHERE phone = '18373804961';

-- 步骤 2: 查询租户信息
SELECT 
    '=== 租户信息 ===' AS info;

SELECT 
    id, 
    name, 
    admin_phone, 
    status, 
    industry,
    package_type,
    created_at
FROM tenants
WHERE admin_phone = '18373804961';

-- 步骤 3: 手动更新用户角色和租户ID
-- 注意：需要先从上面的查询结果中获取租户ID，然后替换下面的 'TENANT_ID_HERE'

SELECT 
    '=== 开始更新用户 Profile ===' AS info;

-- 方法 1: 如果知道租户ID，直接更新
-- UPDATE profiles
-- SET 
--     role = 'tenant_admin'::user_role,
--     tenant_id = 'TENANT_ID_HERE',  -- 替换为实际的租户ID
--     updated_at = NOW()
-- WHERE phone = '18373804961';

-- 方法 2: 使用子查询自动获取租户ID
UPDATE profiles
SET 
    role = 'tenant_admin'::user_role,
    tenant_id = (
        SELECT id 
        FROM tenants 
        WHERE admin_phone = '18373804961' 
        AND status = 'active'
        LIMIT 1
    ),
    updated_at = NOW()
WHERE phone = '18373804961';

-- 步骤 4: 验证更新结果
SELECT 
    '=== 更新后的用户 Profile 状态 ===' AS info;

SELECT 
    id, 
    phone, 
    email, 
    role, 
    tenant_id, 
    created_at, 
    updated_at
FROM profiles
WHERE phone = '18373804961';

-- 步骤 5: 验证租户关联
SELECT 
    '=== 验证租户关联 ===' AS info;

SELECT 
    p.id AS profile_id,
    p.phone,
    p.role,
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.admin_phone,
    t.status AS tenant_status
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE p.phone = '18373804961';

-- 步骤 6: 检查 RLS 策略
SELECT 
    '=== profiles 表的 RLS 策略 ===' AS info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
