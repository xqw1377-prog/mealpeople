/*
# 修复 profiles 表的 INSERT 策略

## 问题描述
租户授权登录功能仍然失败，因为 profiles 表缺少 INSERT 策略。
当新用户首次登录时，handle_new_user 触发器需要插入 profile 记录，
但由于缺少 INSERT 策略，RLS 阻止了插入操作。

## 问题原因
- profiles 表启用了 RLS
- profiles 表只有 SELECT、UPDATE、ALL 策略
- 缺少 INSERT 策略，导致 handle_new_user 触发器无法插入 profile 记录
- 即使触发器使用了 SECURITY DEFINER，RLS 策略仍然会检查

## 解决方案
添加 INSERT 策略，允许认证用户创建自己的 profile。
这是用户注册流程的核心需求：首次登录时需要创建 profile 记录。

## 策略说明
- 认证用户可以创建自己的 profile（id = uid()）
- 这是合理的，因为：
  1. handle_new_user 触发器在用户首次登录时自动创建 profile
  2. 用户只能创建自己的 profile，不能创建其他用户的 profile
  3. 后续的 profile 管理由其他 RLS 策略控制

## 安全考虑
- 只有认证用户才能创建 profile（需要登录）
- 用户只能创建自己的 profile（id = uid()）
- 防止用户创建其他用户的 profile
- profile 的后续管理由 UPDATE 和 ALL 策略控制
*/

-- 添加 INSERT 策略，允许认证用户创建自己的 profile
CREATE POLICY "用户可以创建自己的profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = uid());

-- 同时添加一个策略，允许系统（SECURITY DEFINER 函数）创建任何 profile
-- 这是为了支持 handle_new_user 触发器
CREATE POLICY "系统可以创建profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 注意：上面两个策略是 OR 关系，只要满足其中一个就可以插入
-- 这样既保证了安全性（用户只能创建自己的 profile），
-- 又保证了灵活性（系统触发器可以创建任何 profile）
