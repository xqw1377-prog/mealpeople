/*
# 排班规划系统数据库设计

## 1. 新增表

### 1.1 meal_periods（餐段配置表）
- 存储餐段配置信息（早餐/午餐/晚餐等）

### 1.2 schedule_plans（排班计划表）
- 存储排班计划主表信息

### 1.3 schedule_plan_periods（排班计划餐段明细表）
- 存储每个餐段的详细配置

### 1.4 day_off_records（排休记录表）
- 存储员工排休记录

### 1.5 part_time_records（兼职记录表）
- 存储兼职人员工时记录

## 2. 安全策略
- 所有表启用RLS
- 用户只能访问自己租户的数据

*/

-- 创建餐段配置表
CREATE TABLE IF NOT EXISTS meal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    period_name TEXT NOT NULL,
    period_order INTEGER NOT NULL DEFAULT 0,
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, store_id, period_name)
);

-- 创建排班计划表
CREATE TABLE IF NOT EXISTS schedule_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    plan_date DATE NOT NULL,
    total_estimated_revenue NUMERIC(10,2) DEFAULT 0,
    total_required_staff INTEGER DEFAULT 0,
    total_confirmed_staff INTEGER DEFAULT 0,
    total_regular_staff INTEGER DEFAULT 0,
    total_day_off_staff INTEGER DEFAULT 0,
    total_working_staff INTEGER DEFAULT 0,
    total_part_time_staff INTEGER DEFAULT 0,
    total_salary NUMERIC(10,2) DEFAULT 0,
    is_reasonable BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, store_id, plan_date)
);

-- 创建排班计划餐段明细表
CREATE TABLE IF NOT EXISTS schedule_plan_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_plan_id UUID NOT NULL REFERENCES schedule_plans(id) ON DELETE CASCADE,
    period_name TEXT NOT NULL,
    estimated_revenue NUMERIC(10,2) DEFAULT 0,
    required_staff INTEGER DEFAULT 0,
    confirmed_staff INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建排休记录表
CREATE TABLE IF NOT EXISTS day_off_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_plan_id UUID NOT NULL REFERENCES schedule_plans(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    day_off_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建兼职记录表
CREATE TABLE IF NOT EXISTS part_time_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_plan_id UUID NOT NULL REFERENCES schedule_plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    work_hours NUMERIC(5,2) DEFAULT 0,
    hourly_rate NUMERIC(10,2) DEFAULT 0,
    total_cost NUMERIC(10,2) DEFAULT 0,
    work_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 启用RLS
ALTER TABLE meal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_plan_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_off_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_time_records ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略 - meal_periods
CREATE POLICY "用户访问自己租户的meal_periods" ON meal_periods
    FOR ALL TO authenticated USING (
        tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    );

-- 创建RLS策略 - schedule_plans
CREATE POLICY "用户访问自己租户的schedule_plans" ON schedule_plans
    FOR ALL TO authenticated USING (
        tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    );

-- 创建RLS策略 - schedule_plan_periods
CREATE POLICY "用户访问自己租户的schedule_plan_periods" ON schedule_plan_periods
    FOR ALL TO authenticated USING (
        schedule_plan_id IN (
            SELECT id FROM schedule_plans 
            WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        )
    );

-- 创建RLS策略 - day_off_records
CREATE POLICY "用户访问自己租户的day_off_records" ON day_off_records
    FOR ALL TO authenticated USING (
        schedule_plan_id IN (
            SELECT id FROM schedule_plans 
            WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        )
    );

-- 创建RLS策略 - part_time_records
CREATE POLICY "用户访问自己租户的part_time_records" ON part_time_records
    FOR ALL TO authenticated USING (
        schedule_plan_id IN (
            SELECT id FROM schedule_plans 
            WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
        )
    );

-- 创建索引
CREATE INDEX idx_meal_periods_tenant ON meal_periods(tenant_id);
CREATE INDEX idx_meal_periods_store ON meal_periods(store_id);
CREATE INDEX idx_schedule_plans_tenant_store_date ON schedule_plans(tenant_id, store_id, plan_date);
CREATE INDEX idx_schedule_plan_periods_plan ON schedule_plan_periods(schedule_plan_id);
CREATE INDEX idx_day_off_records_plan ON day_off_records(schedule_plan_id);
CREATE INDEX idx_day_off_records_employee ON day_off_records(employee_id);
CREATE INDEX idx_part_time_records_plan ON part_time_records(schedule_plan_id);

-- 插入默认餐段配置（租户级别）
INSERT INTO meal_periods (tenant_id, store_id, period_name, period_order, start_time, end_time, is_active)
SELECT 
    t.id as tenant_id,
    NULL as store_id,
    period.period_name,
    period.period_order,
    period.start_time,
    period.end_time,
    true as is_active
FROM tenants t
CROSS JOIN (
    VALUES 
        ('早餐', 1, '07:00:00'::time, '10:00:00'::time),
        ('午餐', 2, '10:00:00'::time, '14:00:00'::time),
        ('晚餐', 3, '17:00:00'::time, '21:00:00'::time)
) AS period(period_name, period_order, start_time, end_time)
ON CONFLICT (tenant_id, store_id, period_name) DO NOTHING;
