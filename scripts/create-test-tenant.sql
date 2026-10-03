-- 创建测试租户脚本
-- 用于快速测试新的登录流程

-- 1. 创建测试租户
INSERT INTO tenants (
  name,
  admin_phone,
  industry,
  package_type,
  status,
  store_count,
  employee_count
) VALUES (
  '测试租户',
  '13800138000',  -- 请替换为您的测试电话号码
  '火锅',
  'basic',
  'active',
  0,
  0
) ON CONFLICT DO NOTHING;

-- 2. 查看创建的租户
SELECT 
  id,
  name,
  admin_phone,
  industry,
  package_type,
  status,
  created_at
FROM tenants
WHERE admin_phone = '13800138000';

-- 3. 设置超级管理员（可选）
-- 请替换为您的电话号码或用户ID
UPDATE profiles 
SET 
  role = 'super_admin',
  tenant_id = NULL
WHERE phone = '您的电话号码';

-- 4. 验证超级管理员设置
SELECT 
  id,
  phone,
  role,
  tenant_id
FROM profiles
WHERE role = 'super_admin';

-- 5. 查看所有租户
SELECT 
  id,
  name,
  admin_phone,
  industry,
  package_type,
  status,
  store_count,
  employee_count,
  created_at
FROM tenants
ORDER BY created_at DESC;
