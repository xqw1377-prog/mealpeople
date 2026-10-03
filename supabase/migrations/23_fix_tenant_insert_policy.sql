/*
# 修复租户表的 INSERT 策略

## 问题描述
租户授权登录功能失败，因为 tenants 表缺少 INSERT 策略。
当新用户首次登录时，系统需要自动创建租户，但由于缺少 INSERT 策略，
RLS 阻止了租户的创建操作。

## 问题原因
- tenants 表只有两个策略：
  1. 超级管理员可以访问所有租户（ALL 操作）
  2. 用户可以查看自己的租户（SELECT 操作）
- 缺少 INSERT 策略，导致普通认证用户无法创建租户

## 解决方案
添加 INSERT 策略，允许认证用户创建租户。
这是租户授权登录功能的核心需求：首次登录的用户需要自动创建租户。

## 策略说明
- 所有认证用户都可以创建租户
- 这是合理的，因为：
  1. 首次登录的用户需要自动创建租户
  2. 创建租户后，用户会被设置为该租户的管理员
  3. 后续的租户管理由租户管理员和超级管理员控制

## 安全考虑
- 只有认证用户才能创建租户（需要登录）
- 创建租户后，用户会被设置为该租户的管理员
- 租户的后续管理由 RLS 策略控制
*/

-- 添加 INSERT 策略，允许认证用户创建租户
CREATE POLICY "认证用户可以创建租户" ON tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 同时添加 UPDATE 策略，允许租户管理员更新自己的租户
CREATE POLICY "租户管理员可以更新自己的租户" ON tenants
  FOR UPDATE
  TO authenticated
  USING (
    id = get_user_tenant_id(uid())
    AND get_user_role(uid()) = ANY (ARRAY['tenant_admin'::user_role, 'super_admin'::user_role])
  );

-- 添加 DELETE 策略，只允许超级管理员删除租户
CREATE POLICY "超级管理员可以删除租户" ON tenants
  FOR DELETE
  TO authenticated
  USING (is_super_admin(uid()));
