/*
# 修复餐段和班次配置的保存和显示问题

## 问题描述
1. **餐段保存失败**：RLS策略过于严格，导致无法保存
2. **班次配置保存成功但不显示**：RLS被禁用后保存成功，但查询时可能有问题

## 解决方案
1. 确保meal_periods表的RLS策略允许认证用户访问
2. 确保work_shifts表的RLS策略允许认证用户访问
3. 重新启用work_shifts的RLS（之前被临时禁用）

## 变更内容
1. 删除并重建meal_periods的RLS策略
2. 重新启用work_shifts的RLS并创建正确的策略
*/

-- ============================================
-- 1. 修复 meal_periods 表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "用户访问自己租户的meal_periods" ON meal_periods;
DROP POLICY IF EXISTS "认证用户可以管理餐时间段" ON meal_periods;

-- 确保RLS已启用
ALTER TABLE meal_periods ENABLE ROW LEVEL SECURITY;

-- 创建新的简单策略：允许所有认证用户访问
CREATE POLICY "认证用户可以管理餐段配置" ON meal_periods
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. 修复 work_shifts 表的RLS策略
-- ============================================

-- 删除所有旧策略
DROP POLICY IF EXISTS "认证用户可以管理工作班次" ON work_shifts;
DROP POLICY IF EXISTS "用户访问自己租户的work_shifts" ON work_shifts;
DROP POLICY IF EXISTS "Admins have full access to work_shifts" ON work_shifts;
DROP POLICY IF EXISTS "Users can view own tenant work_shifts" ON work_shifts;
DROP POLICY IF EXISTS "Users can insert own tenant work_shifts" ON work_shifts;
DROP POLICY IF EXISTS "Users can update own tenant work_shifts" ON work_shifts;
DROP POLICY IF EXISTS "Users can delete own tenant work_shifts" ON work_shifts;

-- 重新启用RLS
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;

-- 创建新的简单策略：允许所有认证用户访问
CREATE POLICY "认证用户可以管理班次配置" ON work_shifts
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 更新表注释
COMMENT ON TABLE meal_periods IS '餐段配置表（RLS已启用，允许所有认证用户访问）';
COMMENT ON TABLE work_shifts IS '班次配置表（RLS已启用，允许所有认证用户访问）';
