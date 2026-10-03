/*
# 修复首次登录时更新 profile 的 RLS 策略

## 问题分析
用户首次登录时，他们的 role 是 `employee`，tenant_id 是 null。
当 createTenantWithAdmin 函数尝试将用户的 role 改为 `tenant_admin` 并设置 tenant_id 时，
现有的 RLS 策略可能会阻止这个操作，因为这被视为权限提升。

## 解决方案
添加一个新的 UPDATE 策略，明确允许用户在首次登录时（tenant_id 为 null）更新自己的 role 和 tenant_id。

## 策略说明
- 策略名称：用户可以在首次登录时设置租户
- 适用操作：UPDATE
- 条件：
  1. 用户正在更新自己的 profile（id = uid()）
  2. 用户当前的 tenant_id 是 null（首次登录）
- 允许的更新：任何字段（包括 role 和 tenant_id）

## 注意事项
- 这个策略只在用户首次登录时生效（tenant_id 为 null）
- 一旦用户设置了 tenant_id，就不能再通过这个策略修改
- 这样可以防止用户随意修改自己的租户归属
*/

-- 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "用户可以在首次登录时设置租户" ON profiles;

-- 创建新的策略
CREATE POLICY "用户可以在首次登录时设置租户"
ON profiles
FOR UPDATE
TO authenticated
USING (
  -- 用户正在更新自己的 profile
  id = auth.uid()
  AND
  -- 用户当前的 tenant_id 是 null（首次登录）
  tenant_id IS NULL
)
WITH CHECK (
  -- 允许更新任何字段
  true
);
