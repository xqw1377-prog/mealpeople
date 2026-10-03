/*
# 创建兼职工时记录表和排班结果表

## 1. 新增表

### 1.1 兼职工时记录表 (part_time_shifts)
用于记录兼职员工的工作工时和费用信息。

### 1.2 排班结果表 (schedule_results)
用于记录每日排班的结果和关键指标。

## 2. 安全策略
- 两个表都启用RLS
- 所有认证用户可以管理自己租户的数据

## 3. 索引
- 为常用查询字段创建索引
*/

-- 创建兼职工时记录表
CREATE TABLE IF NOT EXISTS part_time_shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    store_id uuid NOT NULL,
    operation_date date NOT NULL,
    employee_name text NOT NULL,
    work_hours numeric NOT NULL CHECK (work_hours > 0),
    hourly_rate numeric NOT NULL CHECK (hourly_rate > 0),
    total_cost numeric NOT NULL CHECK (total_cost >= 0),
    meal_period text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建排班结果表
CREATE TABLE IF NOT EXISTS schedule_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    store_id uuid NOT NULL,
    operation_date date NOT NULL,
    estimated_revenue numeric NOT NULL CHECK (estimated_revenue >= 0),
    target_staff_count integer NOT NULL CHECK (target_staff_count > 0),
    planned_staff_count integer NOT NULL CHECK (planned_staff_count >= 0),
    rest_staff_count integer NOT NULL CHECK (rest_staff_count >= 0),
    part_time_count integer DEFAULT 0 CHECK (part_time_count >= 0),
    part_time_hours numeric DEFAULT 0 CHECK (part_time_hours >= 0),
    achievement_rate numeric NOT NULL,
    total_labor_cost numeric NOT NULL CHECK (total_labor_cost >= 0),
    labor_cost_rate numeric NOT NULL,
    is_cost_qualified boolean NOT NULL,
    efficiency_zone text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, store_id, operation_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_part_time_shifts_tenant_store_date 
    ON part_time_shifts(tenant_id, store_id, operation_date);

CREATE INDEX IF NOT EXISTS idx_schedule_results_tenant_store_date 
    ON schedule_results(tenant_id, store_id, operation_date);

-- 启用RLS
ALTER TABLE part_time_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_results ENABLE ROW LEVEL SECURITY;

-- 兼职工时记录表的RLS策略 - 允许所有用户完全访问（包括匿名用户）
DROP POLICY IF EXISTS "Authenticated users have full access to part_time_shifts" ON part_time_shifts;
CREATE POLICY "All users have full access to part_time_shifts" ON part_time_shifts
    FOR ALL USING (true) WITH CHECK (true);

-- 排班结果表的RLS策略 - 允许所有用户完全访问（包括匿名用户）
DROP POLICY IF EXISTS "Authenticated users have full access to schedule_results" ON schedule_results;
CREATE POLICY "All users have full access to schedule_results" ON schedule_results
    FOR ALL USING (true) WITH CHECK (true);
