/*
# 智能排班系统

## 1. 功能概述
基于营收预估结果智能生成月度排班日历，支持排班调整、确认和员工查看。

## 2. 新增表结构

### 2.1 月度排班日历表 (schedule_calendar)
存储每月的排班日历总体信息。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 门店ID
- calendar_month: 日历月份（YYYY-MM格式）
- revenue_calendar_id: 关联营收日历ID
- status: 状态（draft=草稿, confirmed=已确认, published=已发布）
- total_work_hours: 总工时
- total_staff_count: 总人数
- generated_by: 生成方式（auto=自动生成, manual=手动创建）
- confirmed_at: 确认时间
- confirmed_by: 确认人
- published_at: 发布时间
- published_by: 发布人
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

### 2.2 每日排班明细表 (daily_schedule_detail)
存储每天的排班明细，包含各班次的人员配置。

字段说明：
- id: 主键
- calendar_id: 关联排班日历ID
- schedule_date: 排班日期
- day_of_week: 星期几
- is_weekend: 是否周末
- is_holiday: 是否节假日
- predicted_revenue: 预测营收（来自营收日历）
- required_staff_count: 需求人数
- actual_staff_count: 实际排班人数
- morning_shift_count: 早班人数
- afternoon_shift_count: 中班人数
- evening_shift_count: 晚班人数
- notes: 备注
- created_at: 创建时间
- updated_at: 更新时间

### 2.3 员工排班明细表 (employee_schedule_detail)
存储每个员工的具体排班信息。

字段说明：
- id: 主键
- daily_schedule_id: 关联每日排班ID
- employee_id: 员工ID
- schedule_date: 排班日期
- shift_type: 班次类型（morning=早班, afternoon=中班, evening=晚班, full=全天, rest=休息）
- work_hours: 工作时长
- start_time: 开始时间
- end_time: 结束时间
- position: 岗位
- is_core_position: 是否核心岗位
- is_backup: 是否顶岗
- notes: 备注
- created_at: 创建时间
- updated_at: 更新时间

### 2.4 排班调整记录表 (schedule_adjustment_log)
记录所有排班调整操作。

字段说明：
- id: 主键
- calendar_id: 关联排班日历ID
- daily_schedule_id: 关联每日排班ID（可选）
- employee_schedule_id: 关联员工排班ID（可选）
- adjustment_type: 调整类型（add=新增, modify=修改, delete=删除, swap=换班）
- adjustment_scope: 调整范围
- old_value: 调整前值（JSON）
- new_value: 调整后值（JSON）
- adjustment_reason: 调整原因（必填）
- adjusted_by: 调整人
- adjusted_at: 调整时间

### 2.5 员工月度排班视图表 (employee_monthly_schedule)
员工端查看的月度排班汇总。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 门店ID
- employee_id: 员工ID
- calendar_month: 日历月份
- schedule_calendar_id: 关联排班日历ID
- total_work_days: 总工作天数
- total_rest_days: 总休息天数
- total_work_hours: 总工时
- schedule_data: 排班数据（JSON，包含每天的详细信息）
- created_at: 创建时间
- updated_at: 更新时间

## 3. 安全策略
- 所有表启用RLS
- 租户管理员和店经理有完整权限
- 员工可以查看自己的排班

*/

-- ==================== 月度排班日历表 ====================

CREATE TABLE IF NOT EXISTS schedule_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  calendar_month text NOT NULL, -- YYYY-MM格式
  revenue_calendar_id uuid REFERENCES revenue_calendar(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'published')),
  total_work_hours numeric(10,2) DEFAULT 0,
  total_staff_count int DEFAULT 0,
  generated_by text NOT NULL DEFAULT 'auto' CHECK (generated_by IN ('auto', 'manual')),
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES profiles(id),
  published_at timestamptz,
  published_by uuid REFERENCES profiles(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, store_id, calendar_month)
);

CREATE INDEX idx_schedule_calendar_tenant ON schedule_calendar(tenant_id);
CREATE INDEX idx_schedule_calendar_store ON schedule_calendar(store_id);
CREATE INDEX idx_schedule_calendar_month ON schedule_calendar(calendar_month);
CREATE INDEX idx_schedule_calendar_status ON schedule_calendar(status);
CREATE INDEX idx_schedule_calendar_revenue ON schedule_calendar(revenue_calendar_id);

-- ==================== 每日排班明细表 ====================

CREATE TABLE IF NOT EXISTS daily_schedule_detail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES schedule_calendar(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_weekend boolean DEFAULT false,
  is_holiday boolean DEFAULT false,
  predicted_revenue numeric(12,2) DEFAULT 0,
  required_staff_count int DEFAULT 0,
  actual_staff_count int DEFAULT 0,
  morning_shift_count int DEFAULT 0,
  afternoon_shift_count int DEFAULT 0,
  evening_shift_count int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(calendar_id, schedule_date)
);

CREATE INDEX idx_daily_schedule_calendar ON daily_schedule_detail(calendar_id);
CREATE INDEX idx_daily_schedule_date ON daily_schedule_detail(schedule_date);
CREATE INDEX idx_daily_schedule_weekend ON daily_schedule_detail(is_weekend);

-- ==================== 员工排班明细表 ====================

CREATE TABLE IF NOT EXISTS employee_schedule_detail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_schedule_id uuid NOT NULL REFERENCES daily_schedule_detail(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  shift_type text NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'full', 'rest')),
  work_hours numeric(5,2) DEFAULT 0,
  start_time time,
  end_time time,
  position text,
  is_core_position boolean DEFAULT false,
  is_backup boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(daily_schedule_id, employee_id)
);

CREATE INDEX idx_employee_schedule_daily ON employee_schedule_detail(daily_schedule_id);
CREATE INDEX idx_employee_schedule_employee ON employee_schedule_detail(employee_id);
CREATE INDEX idx_employee_schedule_date ON employee_schedule_detail(schedule_date);
CREATE INDEX idx_employee_schedule_shift ON employee_schedule_detail(shift_type);

-- ==================== 排班调整记录表 ====================

CREATE TABLE IF NOT EXISTS schedule_adjustment_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id uuid NOT NULL REFERENCES schedule_calendar(id) ON DELETE CASCADE,
  daily_schedule_id uuid REFERENCES daily_schedule_detail(id) ON DELETE CASCADE,
  employee_schedule_id uuid REFERENCES employee_schedule_detail(id) ON DELETE CASCADE,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('add', 'modify', 'delete', 'swap')),
  adjustment_scope text,
  old_value jsonb,
  new_value jsonb,
  adjustment_reason text NOT NULL, -- 必填
  adjusted_by uuid REFERENCES profiles(id),
  adjusted_at timestamptz DEFAULT now()
);

CREATE INDEX idx_schedule_adjustment_calendar ON schedule_adjustment_log(calendar_id);
CREATE INDEX idx_schedule_adjustment_daily ON schedule_adjustment_log(daily_schedule_id);
CREATE INDEX idx_schedule_adjustment_employee ON schedule_adjustment_log(employee_schedule_id);
CREATE INDEX idx_schedule_adjustment_type ON schedule_adjustment_log(adjustment_type);

-- ==================== 员工月度排班视图表 ====================

CREATE TABLE IF NOT EXISTS employee_monthly_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  calendar_month text NOT NULL, -- YYYY-MM格式
  schedule_calendar_id uuid NOT NULL REFERENCES schedule_calendar(id) ON DELETE CASCADE,
  total_work_days int DEFAULT 0,
  total_rest_days int DEFAULT 0,
  total_work_hours numeric(10,2) DEFAULT 0,
  schedule_data jsonb, -- 包含每天的详细排班信息
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, store_id, employee_id, calendar_month)
);

CREATE INDEX idx_employee_monthly_tenant ON employee_monthly_schedule(tenant_id);
CREATE INDEX idx_employee_monthly_store ON employee_monthly_schedule(store_id);
CREATE INDEX idx_employee_monthly_employee ON employee_monthly_schedule(employee_id);
CREATE INDEX idx_employee_monthly_month ON employee_monthly_schedule(calendar_month);
CREATE INDEX idx_employee_monthly_calendar ON employee_monthly_schedule(schedule_calendar_id);

-- ==================== RLS策略 ====================

ALTER TABLE schedule_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_schedule_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedule_detail ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_adjustment_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_monthly_schedule ENABLE ROW LEVEL SECURITY;

-- 排班日历表策略
CREATE POLICY "租户管理员和店经理可以管理排班日历" ON schedule_calendar
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'store_manager')
    )
  );

CREATE POLICY "员工可以查看排班日历" ON schedule_calendar
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 每日排班明细表策略
CREATE POLICY "租户管理员和店经理可以管理每日排班明细" ON daily_schedule_detail
  FOR ALL TO authenticated
  USING (
    calendar_id IN (
      SELECT id FROM schedule_calendar WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'store_manager')
      )
    )
  );

CREATE POLICY "员工可以查看每日排班明细" ON daily_schedule_detail
  FOR SELECT TO authenticated
  USING (
    calendar_id IN (
      SELECT id FROM schedule_calendar WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 员工排班明细表策略
CREATE POLICY "租户管理员和店经理可以管理员工排班明细" ON employee_schedule_detail
  FOR ALL TO authenticated
  USING (
    daily_schedule_id IN (
      SELECT id FROM daily_schedule_detail WHERE calendar_id IN (
        SELECT id FROM schedule_calendar WHERE tenant_id IN (
          SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'store_manager')
        )
      )
    )
  );

CREATE POLICY "员工可以查看自己的排班明细" ON employee_schedule_detail
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 排班调整记录表策略
CREATE POLICY "租户管理员和店经理可以管理排班调整记录" ON schedule_adjustment_log
  FOR ALL TO authenticated
  USING (
    calendar_id IN (
      SELECT id FROM schedule_calendar WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'store_manager')
      )
    )
  );

CREATE POLICY "员工可以查看排班调整记录" ON schedule_adjustment_log
  FOR SELECT TO authenticated
  USING (
    calendar_id IN (
      SELECT id FROM schedule_calendar WHERE tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- 员工月度排班视图表策略
CREATE POLICY "租户管理员和店经理可以管理员工月度排班" ON employee_monthly_schedule
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('tenant_admin', 'store_manager')
    )
  );

CREATE POLICY "员工可以查看自己的月度排班" ON employee_monthly_schedule
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );
