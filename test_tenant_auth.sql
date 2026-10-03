-- 测试租户授权登录流程
-- 这个脚本用于测试整个登录流程是否正常

-- 1. 检查 profiles 表的策略
SELECT '=== profiles 表的策略 ===' AS info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY cmd, policyname;

-- 2. 检查 tenants 表的策略
SELECT '=== tenants 表的策略 ===' AS info;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'tenants' 
ORDER BY cmd, policyname;

-- 3. 检查 handle_new_user 触发器
SELECT '=== handle_new_user 触发器 ===' AS info;
SELECT 
    t.tgname AS trigger_name,
    c.relname AS table_name,
    p.proname AS function_name,
    t.tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_confirmed';

-- 4. 检查最近的 auth.users 记录
SELECT '=== 最近的 auth.users 记录 ===' AS info;
SELECT id, phone, email, confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. 检查最近的 profiles 记录
SELECT '=== 最近的 profiles 记录 ===' AS info;
SELECT id, phone, email, role, tenant_id, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. 检查最近的 tenants 记录
SELECT '=== 最近的 tenants 记录 ===' AS info;
SELECT id, name, created_at 
FROM tenants 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. 检查 auth.users 和 profiles 的关联
SELECT '=== auth.users 和 profiles 的关联 ===' AS info;
SELECT 
    u.id AS user_id,
    u.phone AS user_phone,
    u.confirmed_at,
    p.id AS profile_id,
    p.phone AS profile_phone,
    p.role,
    p.tenant_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
