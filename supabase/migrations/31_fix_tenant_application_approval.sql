/*
# 修复租户申请批准功能

## 问题描述
超级管理员批准租户申请时失败，原因是在批准流程中需要执行以下操作：
1. 创建新租户（tenants表）
2. 更新申请人角色为租户管理员（profiles表）
3. 创建租户配置（tenant_settings表）

但是当前的RLS策略在第3步时会失败，因为：
- 超级管理员的策略检查profiles表中的role是否为super_admin
- 但在批准过程中，这些操作是在同一个事务中进行的
- 可能存在策略检查的时序问题

## 解决方案
简化tenant_settings表的INSERT策略，允许超级管理员直接插入，不需要复杂的子查询检查。

## 变更内容
1. 删除现有的复杂策略
2. 创建简化的策略，使用is_super_admin()函数
*/

-- 删除现有的超级管理员管理策略（FOR ALL包含INSERT）
DROP POLICY IF EXISTS "超级管理员可以管理所有租户配置" ON tenant_settings;

-- 创建简化的INSERT策略
CREATE POLICY "超级管理员可以插入租户配置" ON tenant_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

-- 创建简化的UPDATE策略
CREATE POLICY "超级管理员可以更新所有租户配置" ON tenant_settings
  FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- 创建简化的DELETE策略
CREATE POLICY "超级管理员可以删除租户配置" ON tenant_settings
  FOR DELETE
  TO authenticated
  USING (is_super_admin(auth.uid()));
