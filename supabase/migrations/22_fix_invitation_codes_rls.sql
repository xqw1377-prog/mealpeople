/*
# 修复邀请码表的 RLS 策略

## 问题描述
当前的 RLS 策略要求用户的 tenant_id 必须与邀请码的 tenant_id 匹配，
但是超级管理员的 tenant_id 是 null，导致无法创建邀请码。

## 解决方案
1. 修改 INSERT 策略，允许超级管理员创建任何租户的邀请码
2. 修改 INSERT 策略，允许租户管理员创建自己租户的邀请码
3. 确保策略正确处理 tenant_id 为 null 的超级管理员

## 策略说明
- 超级管理员（role = 'super_admin'）可以创建任何租户的邀请码
- 租户管理员（role = 'tenant_admin'）只能创建自己租户的邀请码
- 其他角色无法创建邀请码

## 修改内容
1. 删除旧的 INSERT 策略
2. 创建新的 INSERT 策略，正确处理超级管理员和租户管理员
*/

-- 删除旧的 INSERT 策略
DROP POLICY IF EXISTS "租户管理员可以创建本租户邀请码" ON invitation_codes;

-- 创建新的 INSERT 策略
-- 超级管理员可以创建任何租户的邀请码
-- 租户管理员只能创建自己租户的邀请码
CREATE POLICY "管理员可以创建邀请码" ON invitation_codes
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = uid()
        AND (
          -- 超级管理员可以创建任何租户的邀请码
          profiles.role = 'super_admin'::user_role
          OR
          -- 租户管理员只能创建自己租户的邀请码
          (
            profiles.role = 'tenant_admin'::user_role
            AND profiles.tenant_id = invitation_codes.tenant_id
          )
        )
    )
  );

-- 同样修复 UPDATE 和 DELETE 策略
DROP POLICY IF EXISTS "租户管理员可以更新本租户邀请码" ON invitation_codes;
DROP POLICY IF EXISTS "租户管理员可以删除本租户邀请码" ON invitation_codes;

CREATE POLICY "管理员可以更新邀请码" ON invitation_codes
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = uid()
        AND (
          profiles.role = 'super_admin'::user_role
          OR
          (
            profiles.role = 'tenant_admin'::user_role
            AND profiles.tenant_id = invitation_codes.tenant_id
          )
        )
    )
  );

CREATE POLICY "管理员可以删除邀请码" ON invitation_codes
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = uid()
        AND (
          profiles.role = 'super_admin'::user_role
          OR
          (
            profiles.role = 'tenant_admin'::user_role
            AND profiles.tenant_id = invitation_codes.tenant_id
          )
        )
    )
  );

-- 修复 SELECT 策略，允许管理员查看邀请码
DROP POLICY IF EXISTS "租户管理员可以查看本租户邀请码" ON invitation_codes;

CREATE POLICY "管理员可以查看邀请码" ON invitation_codes
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = uid()
        AND (
          profiles.role = 'super_admin'::user_role
          OR
          (
            profiles.role = 'tenant_admin'::user_role
            AND profiles.tenant_id = invitation_codes.tenant_id
          )
        )
    )
  );
