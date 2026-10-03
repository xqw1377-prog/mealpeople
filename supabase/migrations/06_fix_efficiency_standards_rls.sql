/*
# 修复效能标准配置表的RLS策略

## 问题描述
原有的RLS策略只设置了 USING 子句，没有设置 WITH CHECK 子句，导致 INSERT 操作失败。

## 原因分析
- USING 子句用于检查现有行是否可访问（SELECT, UPDATE, DELETE）
- WITH CHECK 子句用于检查新行或修改后的行是否符合策略（INSERT, UPDATE）
- 对于 INSERT 操作，如果只有 USING 没有 WITH CHECK，会导致策略检查失败

## 解决方案
删除原有策略，重新创建包含 WITH CHECK 子句的策略。

## 变更内容
1. 删除原有的管理策略
2. 创建新的策略，同时包含 USING 和 WITH CHECK 子句
*/

-- 删除原有的管理策略
DROP POLICY IF EXISTS "用户可以管理自己租户的效能标准配置" ON efficiency_standards;

-- 创建新的策略，同时设置 USING 和 WITH CHECK
CREATE POLICY "用户可以管理自己租户的效能标准配置" ON efficiency_standards
  FOR ALL TO authenticated 
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
