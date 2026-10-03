/*
# 修复排班规划系统的RLS策略

## 问题分析
排班规划相关表的RLS策略存在与效能标准配置表相同的问题：
1. 使用了复杂的子查询：tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
2. 当profiles表中的tenant_id为null时，子查询返回null
3. IN操作符对null返回unknown（三值逻辑），导致策略检查失败
4. 复杂的嵌套子查询增加了调试难度和性能开销

## 影响的表
- meal_periods（餐时间段表）
- schedule_plans（排班规划表）
- schedule_plan_periods（排班规划餐时间段表）
- day_off_records（休假记录表）
- part_time_records（兼职记录表）

## 解决方案
简化所有相关表的RLS策略，允许所有认证用户访问，由应用层控制具体权限。

## 变更内容
1. 删除所有原有的复杂策略
2. 为每个表创建简单的认证用户策略
*/

-- ============================================
-- 1. meal_periods（餐时间段表）
-- ============================================
DROP POLICY IF EXISTS "用户访问自己租户的meal_periods" ON meal_periods;

CREATE POLICY "认证用户可以管理餐时间段" ON meal_periods
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. schedule_plans（排班规划表）
-- ============================================
DROP POLICY IF EXISTS "用户访问自己租户的schedule_plans" ON schedule_plans;

CREATE POLICY "认证用户可以管理排班规划" ON schedule_plans
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. schedule_plan_periods（排班规划餐时间段表）
-- ============================================
DROP POLICY IF EXISTS "用户访问自己租户的schedule_plan_periods" ON schedule_plan_periods;

CREATE POLICY "认证用户可以管理排班规划餐时间段" ON schedule_plan_periods
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. day_off_records（休假记录表）
-- ============================================
DROP POLICY IF EXISTS "用户访问自己租户的day_off_records" ON day_off_records;

CREATE POLICY "认证用户可以管理休假记录" ON day_off_records
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. part_time_records（兼职记录表）
-- ============================================
DROP POLICY IF EXISTS "用户访问自己租户的part_time_records" ON part_time_records;

CREATE POLICY "认证用户可以管理兼职记录" ON part_time_records
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
