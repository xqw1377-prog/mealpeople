/*
# 清理work_shifts表的冗余RLS策略

## 问题
work_shifts表存在多个RLS策略，包括：
1. 租户成员可以查看本租户班次配置
2. 租户管理员可以创建班次配置
3. 租户管理员可以删除班次配置
4. 租户管理员可以更新班次配置
5. 认证用户可以管理班次配置（新策略）

这些策略可能会相互冲突，导致权限问题。

## 解决方案
删除所有旧策略，只保留最新的简单策略。
*/

-- 删除所有旧策略
DROP POLICY IF EXISTS "租户成员可以查看本租户班次配置" ON work_shifts;
DROP POLICY IF EXISTS "租户管理员可以创建班次配置" ON work_shifts;
DROP POLICY IF EXISTS "租户管理员可以删除班次配置" ON work_shifts;
DROP POLICY IF EXISTS "租户管理员可以更新班次配置" ON work_shifts;

-- 确保只有一个简单的策略
-- "认证用户可以管理班次配置" 策略已经在上一个迁移中创建
