/*
# 修复营收日历系统Guest访问权限

## 问题
Guest用户（体验模式）无法创建和访问营收日历，因为RLS策略没有考虑guest角色。

## 修复内容
1. 为guest用户添加访问demo租户数据的权限
2. 允许guest用户创建、查看和修改demo租户的营收数据
3. 确保guest用户只能访问demo租户的数据

## 策略说明
- Guest用户可以完整访问demo租户的所有营收数据
- Guest用户不能访问其他租户的数据
*/

-- ==================== 营收日历表 ====================

-- Guest用户可以管理demo租户的营收日历
CREATE POLICY "Guest用户可以管理demo租户营收日历" ON revenue_calendar
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN tenants t ON t.id = revenue_calendar.tenant_id
      WHERE p.id = auth.uid() 
        AND p.role = 'guest'
        AND t.is_demo = true
    )
  );

-- ==================== 每日营收明细表 ====================

-- Guest用户可以管理demo租户的每日营收明细
CREATE POLICY "Guest用户可以管理demo租户每日营收明细" ON daily_revenue_detail
  FOR ALL TO authenticated
  USING (
    calendar_id IN (
      SELECT rc.id FROM revenue_calendar rc
      INNER JOIN tenants t ON t.id = rc.tenant_id
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'guest' AND t.is_demo = true
    )
  );

-- ==================== 营收调整记录表 ====================

-- Guest用户可以管理demo租户的营收调整记录
CREATE POLICY "Guest用户可以管理demo租户营收调整记录" ON revenue_adjustment_log
  FOR ALL TO authenticated
  USING (
    calendar_id IN (
      SELECT rc.id FROM revenue_calendar rc
      INNER JOIN tenants t ON t.id = rc.tenant_id
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE p.role = 'guest' AND t.is_demo = true
    )
  );

-- ==================== 影响因子配置表 ====================

-- Guest用户可以管理demo租户的影响因子
CREATE POLICY "Guest用户可以管理demo租户影响因子" ON revenue_impact_factors
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN tenants t ON t.id = revenue_impact_factors.tenant_id
      WHERE p.id = auth.uid() 
        AND p.role = 'guest'
        AND t.is_demo = true
    )
  );
