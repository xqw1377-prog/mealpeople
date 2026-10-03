/*
# 修复超级管理员登录问题

用户反馈：换了电脑后无法登录
手机号：18674821377
身份：超级管理员

## 问题分析
1. 检查用户是否存在于auth.users表
2. 检查用户是否存在于profiles表
3. 检查用户角色是否正确
4. 确保用户可以正常登录

## 解决方案
1. 查询用户状态
2. 如果需要，重置用户状态
3. 确保超级管理员权限
*/

-- 1. 查询auth.users表中的用户信息
SELECT 
    id,
    phone,
    email,
    confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE phone = '18674821377' OR phone = '+8618674821377';

-- 2. 查询profiles表中的用户信息
SELECT 
    id,
    tenant_id,
    phone,
    email,
    name,
    role,
    created_at
FROM profiles
WHERE phone = '18674821377' OR phone = '+8618674821377';

-- 3. 如果用户存在但无法登录，可能需要重置confirmed_at
-- 注意：这个操作需要根据实际情况执行
-- UPDATE auth.users 
-- SET confirmed_at = now()
-- WHERE phone = '18674821377' OR phone = '+8618674821377';

-- 4. 确保用户是超级管理员
-- UPDATE profiles 
-- SET role = 'super_admin'::user_role
-- WHERE phone = '18674821377' OR phone = '+8618674821377';

-- 5. 查询用户所属的租户
SELECT 
    t.id,
    t.name,
    t.status,
    p.role
FROM tenants t
JOIN profiles p ON p.tenant_id = t.id
WHERE p.phone = '18674821377' OR p.phone = '+8618674821377';
