# 营收日历创建失败 - 快速修复指南

## 🚨 问题描述

创建营收日历时失败，错误信息可能包含：
- "创建营收日历失败"
- "权限不足"
- "RLS policy violation"

## 🔍 问题原因

数据库的行级安全（RLS）策略过于严格，导致即使是管理员也无法创建营收日历。

## ✅ 解决方案

### 步骤1：应用数据库迁移

1. **打开Supabase控制台**
   - 访问您的Supabase项目
   - 进入 SQL Editor

2. **执行以下SQL脚本**

复制并执行文件 `supabase/migrations/v2/08_fix_revenue_calendar_rls.sql` 中的内容：

```sql
/*
# 修复营收日历系统RLS策略
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
```

3. **点击"Run"执行SQL**

### 步骤2：验证修复

1. **刷新应用页面**
   - 清除浏览器缓存（Ctrl+Shift+R 或 Cmd+Shift+R）
   - 重新登录系统

2. **测试创建营收日历**
   - 进入"管理中心" → "营收预测"
   - 选择月份
   - 点击"生成智能预测"
   - 查看是否成功创建

3. **查看控制台日志**
   - 打开浏览器开发者工具（F12）
   - 查看Console标签页
   - 应该看到类似以下的成功日志：
     ```
     开始创建营收日历，参数: {...}
     创建营收日历参数: {...}
     营收日历创建成功: <calendar_id>
     准备创建 31 条每日明细
     每日营收明细创建成功
     ```

## 🔧 如果仍然失败

### 检查用户角色

在Supabase SQL Editor中执行：

```sql
-- 查看当前用户的角色
SELECT id, name, email, phone, role, tenant_id 
FROM profiles 
WHERE id = auth.uid();
```

确保您的角色是以下之一：
- `super_admin`（超级管理员）
- `tenant_admin`（租户管理员）
- `store_manager`（店经理）

### 检查租户和门店关联

```sql
-- 查看当前用户的租户和门店信息
SELECT 
  p.id as user_id,
  p.name as user_name,
  p.role,
  p.tenant_id,
  t.name as tenant_name,
  s.id as store_id,
  s.name as store_name
FROM profiles p
LEFT JOIN tenants t ON t.id = p.tenant_id
LEFT JOIN stores s ON s.manager_id = p.id
WHERE p.id = auth.uid();
```

### 手动设置用户为管理员

如果您的角色不正确，可以手动修改：

```sql
-- 将用户设置为超级管理员
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = '<your_user_id>';

-- 或设置为租户管理员
UPDATE profiles 
SET role = 'tenant_admin', tenant_id = '<your_tenant_id>' 
WHERE id = '<your_user_id>';
```

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. **浏览器控制台的完整错误日志**
2. **当前用户的角色和租户信息**（执行上面的查询SQL）
3. **尝试创建的月份**
4. **错误截图**

## ✨ 修复后的改进

修复后，系统将具有以下改进：

1. **更灵活的权限控制**
   - 超级管理员拥有所有权限
   - 租户管理员可以管理本租户的所有数据
   - 店经理可以管理所属门店的数据

2. **自动删除旧日历**
   - 如果同一月份已存在营收日历，系统会自动删除旧的
   - 避免唯一约束冲突

3. **详细的错误日志**
   - 每个关键步骤都有日志输出
   - 便于快速定位问题

4. **更好的用户体验**
   - 清晰的错误提示
   - 友好的操作引导

## 🎉 成功标志

修复成功后，您应该能够：

1. ✅ 成功创建营收日历
2. ✅ 查看每日营收明细
3. ✅ 编辑单日营收数据
4. ✅ 查看和管理影响因子
5. ✅ 生成智能预测

---

**最后更新**: 2025-11-12
**版本**: v2.0
