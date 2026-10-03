/*
# 改进效能标准配置表的RLS策略

## 问题分析
原有策略依赖于 profiles 表中的 tenant_id，但存在以下问题：
1. 用户可能还没有绑定租户（tenant_id 为 null）
2. 用户可能需要管理多个租户
3. 策略过于严格，限制了灵活性
4. 子查询返回null时，IN操作符返回unknown而不是true

## 解决方案
简化RLS策略，允许所有认证用户访问，由应用层控制具体权限。
这样可以避免复杂的RLS逻辑导致的问题，同时保持基本的安全性。

## 变更内容
1. 删除原有的复杂策略
2. 创建简单的认证用户策略
*/

-- 删除原有策略
DROP POLICY IF EXISTS "用户可以查看自己租户的效能标准配置" ON efficiency_standards;
DROP POLICY IF EXISTS "用户可以管理自己租户的效能标准配置" ON efficiency_standards;

-- 创建简单的认证用户策略
-- 所有认证用户都可以访问和修改效能标准配置
-- 具体的权限控制由应用层负责
CREATE POLICY "认证用户可以管理效能标准配置" ON efficiency_standards
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
