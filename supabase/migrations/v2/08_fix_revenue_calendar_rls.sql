/*
# 修复营收日历系统RLS策略

## 问题
原有的RLS策略过于严格，导致创建营收日历失败。

## 修复内容
1. 删除旧的RLS策略
2. 创建新的更灵活的RLS策略
3. 添加超级管理员的完整权限
4. 优化租户管理员和店经理的权限判断逻辑

## 新策略说明
- 超级管理员：拥有所有表的完整权限
- 租户管理员：可以管理本租户的所有数据
- 店经理：可以管理所属门店的数据
- 普通员工：只能查看本租户的数据
*/

-- ==================== 删除旧策略 ====================

-- 营收日历表
DROP POLICY IF EXISTS "租户管理员和店经理可以管理营收日历" ON revenue_calendar;
DROP POLICY IF EXISTS "员工可以查看营收日历" ON revenue_calendar;
DROP POLICY IF EXISTS "超级管理员可以管理所有营收日历" ON revenue_calendar;
DROP POLICY IF EXISTS "租户管理员可以管理本租户营收日历" ON revenue_calendar;
DROP POLICY IF EXISTS "店经理可以管理所属门店营收日历" ON revenue_calendar;
DROP POLICY IF EXISTS "员工可以查看本租户营收日历" ON revenue_calendar;

-- 每日营收明细表
DROP POLICY IF EXISTS "租户管理员和店经理可以管理每日营收明细" ON daily_revenue_detail;
DROP POLICY IF EXISTS "员工可以查看每日营收明细" ON daily_revenue_detail;
DROP POLICY IF EXISTS "超级管理员可以管理所有每日营收明细" ON daily_revenue_detail;

-- 营收调整记录表
DROP POLICY IF EXISTS "租户管理员和店经理可以管理营收调整记录" ON revenue_adjustment_log;
DROP POLICY IF EXISTS "员工可以查看营收调整记录" ON revenue_adjustment_log;
DROP POLICY IF EXISTS "超级管理员可以管理所有营收调整记录" ON revenue_adjustment_log;

-- 影响因子配置表
DROP POLICY IF EXISTS "租户管理员和店经理可以管理影响因子" ON revenue_impact_factors;
DROP POLICY IF EXISTS "员工可以查看影响因子" ON revenue_impact_factors;
DROP POLICY IF EXISTS "超级管理员可以管理所有影响因子" ON revenue_impact_factors;
DROP POLICY IF EXISTS "租户管理员可以管理本租户影响因子" ON revenue_impact_factors;
DROP POLICY IF EXISTS "店经理可以管理所属门店影响因子" ON revenue_impact_factors;
DROP POLICY IF EXISTS "员工可以查看本租户影响因子" ON revenue_impact_factors;

-- ==================== 创建新策略 ====================

-- 营收日历表策略
-- 超级管理员拥有所有权限
CREATE POLICY "超级管理员可以管理所有营收日历" ON revenue_calendar
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 租户管理员可以管理本租户的营收日历
CREATE POLICY "租户管理员可以管理本租户营收日历" ON revenue_calendar
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'tenant_admin'
    )
  );

-- 店经理可以管理所属门店的营收日历
CREATE POLICY "店经理可以管理所属门店营收日历" ON revenue_calendar
  FOR ALL TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE manager_id = auth.uid()
    )
  );

-- 员工可以查看本租户的营收日历
CREATE POLICY "员工可以查看本租户营收日历" ON revenue_calendar
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 每日营收明细表策略
-- 超级管理员拥有所有权限
CREATE POLICY "超级管理员可以管理所有每日营收明细" ON daily_revenue_detail
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 租户管理员和店经理可以管理每日营收明细
CREATE POLICY "租户管理员和店经理可以管理每日营收明细" ON daily_revenue_detail
  FOR ALL TO authenticated
  USING (
    calendar_id IN (
      SELECT rc.id FROM revenue_calendar rc
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE (
        (p.role = 'tenant_admin' AND rc.tenant_id = p.tenant_id)
        OR (p.role = 'store_manager' AND rc.store_id IN (SELECT id FROM stores WHERE manager_id = auth.uid()))
      )
    )
  );

-- 员工可以查看每日营收明细
CREATE POLICY "员工可以查看每日营收明细" ON daily_revenue_detail
  FOR SELECT TO authenticated
  USING (
    calendar_id IN (
      SELECT id FROM revenue_calendar WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 营收调整记录表策略
-- 超级管理员拥有所有权限
CREATE POLICY "超级管理员可以管理所有营收调整记录" ON revenue_adjustment_log
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 租户管理员和店经理可以管理营收调整记录
CREATE POLICY "租户管理员和店经理可以管理营收调整记录" ON revenue_adjustment_log
  FOR ALL TO authenticated
  USING (
    calendar_id IN (
      SELECT rc.id FROM revenue_calendar rc
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE (
        (p.role = 'tenant_admin' AND rc.tenant_id = p.tenant_id)
        OR (p.role = 'store_manager' AND rc.store_id IN (SELECT id FROM stores WHERE manager_id = auth.uid()))
      )
    )
  );

-- 员工可以查看营收调整记录
CREATE POLICY "员工可以查看营收调整记录" ON revenue_adjustment_log
  FOR SELECT TO authenticated
  USING (
    calendar_id IN (
      SELECT id FROM revenue_calendar WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 影响因子配置表策略
-- 超级管理员拥有所有权限
CREATE POLICY "超级管理员可以管理所有影响因子" ON revenue_impact_factors
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 租户管理员可以管理本租户的影响因子
CREATE POLICY "租户管理员可以管理本租户影响因子" ON revenue_impact_factors
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'tenant_admin'
    )
  );

-- 店经理可以管理所属门店的影响因子
CREATE POLICY "店经理可以管理所属门店影响因子" ON revenue_impact_factors
  FOR ALL TO authenticated
  USING (
    store_id IN (
      SELECT id FROM stores WHERE manager_id = auth.uid()
    )
  );

-- 员工可以查看本租户的影响因子
CREATE POLICY "员工可以查看本租户影响因子" ON revenue_impact_factors
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );
