/*
# 营收智能预估系统

## 1. 功能概述
基于历史数据智能生成月度营收日历，支持分天分餐段预估，支持影响因子调整和优化。

## 2. 新增表结构

### 2.1 月度营收日历表 (revenue_calendar)
存储每月的营收预估日历，包含总体信息和状态。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 门店ID
- calendar_month: 日历月份（YYYY-MM格式）
- total_revenue_target: 总营收目标
- predicted_total_revenue: 预测总营收
- status: 状态（draft=草稿, confirmed=已确认, locked=已锁定）
- generated_by: 生成方式（auto=自动生成, manual=手动创建）
- confirmed_at: 确认时间
- confirmed_by: 确认人
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

### 2.2 每日营收明细表 (daily_revenue_detail)
存储每天的营收预估明细，包含各餐段的营收。

字段说明：
- id: 主键
- calendar_id: 关联营收日历ID
- revenue_date: 营收日期
- day_of_week: 星期几（0=周日, 1=周一, ..., 6=周六）
- is_weekend: 是否周末
- is_holiday: 是否节假日
- predicted_revenue: 预测营收
- adjusted_revenue: 调整后营收
- breakfast_revenue: 早餐营收
- lunch_revenue: 午餐营收
- dinner_revenue: 晚餐营收
- other_revenue: 其他时段营收
- weather_factor: 天气影响因子
- event_factor: 事件影响因子
- notes: 备注
- created_at: 创建时间
- updated_at: 更新时间

### 2.3 营收调整记录表 (revenue_adjustment_log)
记录所有营收调整操作，用于追溯和审计。

字段说明：
- id: 主键
- calendar_id: 关联营收日历ID
- daily_detail_id: 关联每日明细ID（可选）
- adjustment_type: 调整类型（total=总体调整, daily=单日调整, meal=餐段调整）
- adjustment_scope: 调整范围（描述）
- old_value: 调整前值
- new_value: 调整后值
- adjustment_reason: 调整原因
- impact_factors: 影响因子（JSON）
- adjusted_by: 调整人
- adjusted_at: 调整时间

### 2.4 影响因子配置表 (revenue_impact_factors)
存储影响营收的各种因子配置。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 门店ID
- factor_type: 因子类型（weather=天气, holiday=节假日, promotion=促销, event=事件）
- factor_name: 因子名称
- factor_value: 因子值
- impact_rate: 影响率（百分比）
- description: 描述
- is_active: 是否启用
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

## 3. 安全策略
- 所有表启用RLS
- 租户管理员和店经理有完整权限
- 普通员工只读权限

*/

-- ==================== 月度营收日历表 ====================

CREATE TABLE IF NOT EXISTS revenue_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  calendar_month text NOT NULL, -- YYYY-MM格式
  total_revenue_target numeric(12,2) DEFAULT 0,
  predicted_total_revenue numeric(12,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'locked')),
  generated_by text NOT NULL DEFAULT 'auto' CHECK (generated_by IN ('auto', 'manual')),
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES profiles(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, store_id, calendar_month)
);

CREATE INDEX idx_revenue_calendar_tenant ON revenue_calendar(tenant_id);
CREATE INDEX idx_revenue_calendar_store ON revenue_calendar(store_id);
CREATE INDEX idx_revenue_calendar_month ON revenue_calendar(calendar_month);
CREATE INDEX idx_revenue_calendar_status ON revenue_calendar(status);

-- ==================== 每日营收明细表 ====================

CREATE TABLE IF NOT EXISTS daily_revenue_detail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES revenue_calendar(id) ON DELETE CASCADE,
  revenue_date date NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_weekend boolean DEFAULT false,
  is_holiday boolean DEFAULT false,
  predicted_revenue numeric(12,2) DEFAULT 0,
  adjusted_revenue numeric(12,2),
  breakfast_revenue numeric(12,2) DEFAULT 0,
  lunch_revenue numeric(12,2) DEFAULT 0,
  dinner_revenue numeric(12,2) DEFAULT 0,
  other_revenue numeric(12,2) DEFAULT 0,
  weather_factor text,
  event_factor text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(calendar_id, revenue_date)
);

CREATE INDEX idx_daily_revenue_calendar ON daily_revenue_detail(calendar_id);
CREATE INDEX idx_daily_revenue_date ON daily_revenue_detail(revenue_date);
CREATE INDEX idx_daily_revenue_weekend ON daily_revenue_detail(is_weekend);

-- ==================== 营收调整记录表 ====================

CREATE TABLE IF NOT EXISTS revenue_adjustment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES revenue_calendar(id) ON DELETE CASCADE,
  daily_detail_id uuid REFERENCES daily_revenue_detail(id) ON DELETE CASCADE,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('total', 'daily', 'meal')),
  adjustment_scope text,
  old_value numeric(12,2),
  new_value numeric(12,2),
  adjustment_reason text,
  impact_factors jsonb,
  adjusted_by uuid REFERENCES profiles(id),
  adjusted_at timestamptz DEFAULT now()
);

CREATE INDEX idx_revenue_adjustment_calendar ON revenue_adjustment_log(calendar_id);
CREATE INDEX idx_revenue_adjustment_daily ON revenue_adjustment_log(daily_detail_id);
CREATE INDEX idx_revenue_adjustment_type ON revenue_adjustment_log(adjustment_type);

-- ==================== 影响因子配置表 ====================

CREATE TABLE IF NOT EXISTS revenue_impact_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  factor_type text NOT NULL CHECK (factor_type IN ('weather', 'holiday', 'promotion', 'event')),
  factor_name text NOT NULL,
  factor_value text,
  impact_rate numeric(5,2) DEFAULT 0, -- 影响率百分比
  description text,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_impact_factors_tenant ON revenue_impact_factors(tenant_id);
CREATE INDEX idx_impact_factors_store ON revenue_impact_factors(store_id);
CREATE INDEX idx_impact_factors_type ON revenue_impact_factors(factor_type);
CREATE INDEX idx_impact_factors_active ON revenue_impact_factors(is_active);

-- ==================== RLS策略 ====================

ALTER TABLE revenue_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_revenue_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_adjustment_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_impact_factors ENABLE ROW LEVEL SECURITY;

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
