/*
# 添加租户管理员电话字段

## 修改内容
1. 在 tenants 表添加 admin_phone 字段
2. 添加索引以提高查询性能
3. 移除 invitation_code 字段（不再使用邀约码）

## 使用场景
- 超级管理员创建租户时指定管理员电话
- 租户管理员使用电话号码登录
- 系统验证电话号码是否是租户管理员
*/

-- 1. 添加租户管理员电话字段
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS admin_phone text;

-- 2. 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tenants_admin_phone ON tenants(admin_phone);

-- 3. 添加注释
COMMENT ON COLUMN tenants.admin_phone IS '租户管理员电话号码';

-- 4. 移除 invitation_code 字段（如果存在）
ALTER TABLE tenants 
DROP COLUMN IF EXISTS invitation_code;
