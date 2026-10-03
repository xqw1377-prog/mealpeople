/*
# 修复租户配置表的 RLS 策略

## 问题
当前的 RLS 策略太宽松：`FOR ALL TO authenticated USING (true) WITH CHECK (true)`
这允许任何认证用户修改任何租户的配置，不符合多租户隔离的要求。

## 修复方案
1. 删除旧的宽松策略
2. 创建新的严格策略：
   - 超级管理员可以管理所有租户的配置
   - 租户管理员只能管理自己租户的配置
   - 店经理只能查看自己租户的配置
   - 普通员工只能查看自己租户的配置

## 安全性
- 确保数据完全隔离
- 防止越权访问
- 符合多租户架构要求
*/

-- 1. 删除旧的宽松策略
DROP POLICY IF EXISTS "认证用户可以管理租户配置" ON tenant_settings;

-- 2. 创建新的严格策略

-- 超级管理员可以查看所有租户配置
CREATE POLICY "超级管理员可以查看所有租户配置" ON tenant_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'::user_role
    )
  );

-- 超级管理员可以管理所有租户配置
CREATE POLICY "超级管理员可以管理所有租户配置" ON tenant_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'::user_role
    )
  );

-- 租户管理员可以查看本租户配置
CREATE POLICY "租户管理员可以查看本租户配置" ON tenant_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = tenant_settings.tenant_id
      AND profiles.role IN ('tenant_admin'::user_role, 'store_manager'::user_role, 'employee'::user_role)
    )
  );

-- 租户管理员可以管理本租户配置
CREATE POLICY "租户管理员可以管理本租户配置" ON tenant_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = tenant_settings.tenant_id
      AND profiles.role = 'tenant_admin'::user_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.tenant_id = tenant_settings.tenant_id
      AND profiles.role = 'tenant_admin'::user_role
    )
  );
