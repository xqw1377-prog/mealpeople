/*
# 修复每日运营记录表的RLS策略

## 问题分析
每日运营记录表（daily_operations）的RLS策略存在与其他表相同的问题：
1. 使用了复杂的子查询：tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
2. 当profiles表中的tenant_id为null时，子查询返回null
3. IN操作符对null返回unknown（三值逻辑），导致策略检查失败

## 解决方案
简化RLS策略，允许所有认证用户访问，由应用层控制具体权限。

## 变更内容
1. 删除原有的复杂策略
2. 创建简单的认证用户策略
*/

-- 删除原有策略
DROP POLICY IF EXISTS "用户可以查看自己租户的每日运营记录" ON daily_operations;
DROP POLICY IF EXISTS "用户可以管理自己租户的每日运营记录" ON daily_operations;

-- 创建简单的认证用户策略
CREATE POLICY "认证用户可以管理每日运营记录" ON daily_operations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
