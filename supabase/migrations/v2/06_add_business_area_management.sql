/*
# 经营区域管理系统数据库迁移

## 概述
创建经营区域管理系统所需的所有数据库表，实现"定岗、定编、定人"的完整配置体系

## 核心功能
1. 经营区域管理 - 定义餐厅的各个经营区域
2. 区域每日状态 - 支持每日开启/关闭经营区域
3. 岗位编制配置 - 定岗+定编（确定岗位和编制人数）
4. 人员分配管理 - 定人（分配具体员工到岗位）
5. 上岗一览 - 可视化展示各区域人员配置情况

## 表结构

### 1. business_areas - 经营区域表
- 定义餐厅的各个经营区域（大厅、包间、后厨等）
- 支持区域类型、容量、楼层等配置
- 支持每日关闭功能

### 2. area_daily_status - 经营区域每日状态表
- 记录每个区域每天的营业状态
- 支持设置营业时间
- 记录关闭原因

### 3. area_positions - 经营区域岗位配置表（定岗+定编）
- 定岗：确定每个区域需要哪些岗位
- 定编：确定每个岗位需要多少人（编制人数）
- 支持最少/最多人数配置

### 4. area_staff_assignments - 经营区域人员分配表（定人）
- 定人：分配具体员工到岗位
- 支持固定分配、临时分配、顶岗分配
- 支持设置分配时间和优先级

### 5. area_attendance_overview - 上岗一览表
- 汇总每日各区域的人员配置情况
- 统计在岗人数、休息人数、缺员数
- 计算配置率

## 安全策略
- 所有表启用RLS
- 管理员拥有完全访问权限
- 员工可查看上岗一览
*/

-- ==================== 1. 经营区域表 ====================

CREATE TABLE IF NOT EXISTS business_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  
  area_code text NOT NULL,
  area_name text NOT NULL,
  area_type text NOT NULL,
  description text,
  
  capacity int,
  floor_number int,
  sort_order int DEFAULT 0,
  
  is_active boolean DEFAULT true,
  can_close_daily boolean DEFAULT true,
  
  revenue_weight decimal(5,2) DEFAULT 1.0,
  
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_business_areas_unique 
  ON business_areas(tenant_id, store_id, area_code);

COMMENT ON TABLE business_areas IS '经营区域表';
COMMENT ON COLUMN business_areas.area_code IS '区域代码（唯一标识）';
COMMENT ON COLUMN business_areas.area_type IS '区域类型：dining/kitchen/bar/takeout/other';
COMMENT ON COLUMN business_areas.can_close_daily IS '是否支持每日关闭';
COMMENT ON COLUMN business_areas.revenue_weight IS '营收权重';

CREATE INDEX idx_business_areas_tenant ON business_areas(tenant_id);
CREATE INDEX idx_business_areas_store ON business_areas(store_id);
CREATE INDEX idx_business_areas_type ON business_areas(area_type);

-- ==================== 2. 经营区域每日状态表 ====================

CREATE TABLE IF NOT EXISTS area_daily_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  area_id uuid NOT NULL REFERENCES business_areas(id) ON DELETE CASCADE,
  
  status_date date NOT NULL,
  
  is_open boolean DEFAULT true,
  open_time time,
  close_time time,
  
  close_reason text,
  
  predicted_customer_count int,
  predicted_revenue decimal(10,2),
  
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_area_daily_status_unique 
  ON area_daily_status(tenant_id, store_id, area_id, status_date);

COMMENT ON TABLE area_daily_status IS '经营区域每日状态表';
COMMENT ON COLUMN area_daily_status.is_open IS '是否营业';
COMMENT ON COLUMN area_daily_status.close_reason IS '关闭原因';
COMMENT ON COLUMN area_daily_status.predicted_customer_count IS '预测客流量';
COMMENT ON COLUMN area_daily_status.predicted_revenue IS '预测营收';

CREATE INDEX idx_area_daily_status_tenant ON area_daily_status(tenant_id);
CREATE INDEX idx_area_daily_status_area ON area_daily_status(area_id);
CREATE INDEX idx_area_daily_status_date ON area_daily_status(status_date);

-- ==================== 3. 经营区域岗位配置表（定岗+定编）====================

CREATE TABLE IF NOT EXISTS area_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  area_id uuid NOT NULL REFERENCES business_areas(id) ON DELETE CASCADE,
  
  position_name text NOT NULL,
  position_level text,
  
  quota_count int NOT NULL DEFAULT 1,
  min_count int NOT NULL DEFAULT 1,
  max_count int,
  
  required_skills text[] DEFAULT '{}',
  work_hours_per_day decimal(4,2),
  
  salary_min decimal(10,2),
  salary_max decimal(10,2),
  
  is_active boolean DEFAULT true,
  
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_area_positions_unique 
  ON area_positions(tenant_id, store_id, area_id, position_name);

COMMENT ON TABLE area_positions IS '经营区域岗位配置表（定岗+定编）';
COMMENT ON COLUMN area_positions.position_name IS '岗位名称';
COMMENT ON COLUMN area_positions.position_level IS '岗位级别：junior/intermediate/senior/manager';
COMMENT ON COLUMN area_positions.quota_count IS '编制人数';
COMMENT ON COLUMN area_positions.min_count IS '最少人数';
COMMENT ON COLUMN area_positions.max_count IS '最多人数';
COMMENT ON COLUMN area_positions.required_skills IS '必需技能';
COMMENT ON COLUMN area_positions.work_hours_per_day IS '每日工作时长';

CREATE INDEX idx_area_positions_tenant ON area_positions(tenant_id);
CREATE INDEX idx_area_positions_area ON area_positions(area_id);
CREATE INDEX idx_area_positions_name ON area_positions(position_name);

-- ==================== 4. 经营区域人员分配表（定人）====================

CREATE TABLE IF NOT EXISTS area_staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  area_id uuid NOT NULL REFERENCES business_areas(id) ON DELETE CASCADE,
  area_position_id uuid NOT NULL REFERENCES area_positions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL,
  
  assignment_type text DEFAULT 'permanent',
  start_date date NOT NULL,
  end_date date,
  
  work_schedule jsonb DEFAULT '{}'::jsonb,
  priority int DEFAULT 0,
  
  is_active boolean DEFAULT true,
  
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_area_staff_assignments_unique 
  ON area_staff_assignments(tenant_id, store_id, area_position_id, employee_id, start_date);

COMMENT ON TABLE area_staff_assignments IS '经营区域人员分配表（定人）';
COMMENT ON COLUMN area_staff_assignments.assignment_type IS '分配类型：permanent固定/temporary临时/backup顶岗';
COMMENT ON COLUMN area_staff_assignments.start_date IS '开始日期';
COMMENT ON COLUMN area_staff_assignments.end_date IS '结束日期';
COMMENT ON COLUMN area_staff_assignments.work_schedule IS '工作时间安排';
COMMENT ON COLUMN area_staff_assignments.priority IS '优先级（用于顶岗排序）';

CREATE INDEX idx_area_assignments_tenant ON area_staff_assignments(tenant_id);
CREATE INDEX idx_area_assignments_area ON area_staff_assignments(area_id);
CREATE INDEX idx_area_assignments_position ON area_staff_assignments(area_position_id);
CREATE INDEX idx_area_assignments_employee ON area_staff_assignments(employee_id);
CREATE INDEX idx_area_assignments_date ON area_staff_assignments(start_date, end_date);

-- ==================== 5. 上岗一览表 ====================

CREATE TABLE IF NOT EXISTS area_attendance_overview (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  store_id uuid NOT NULL,
  overview_date date NOT NULL,
  
  overview_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  total_areas int DEFAULT 0,
  open_areas int DEFAULT 0,
  total_positions int DEFAULT 0,
  total_staff_required int DEFAULT 0,
  total_staff_assigned int DEFAULT 0,
  total_staff_on_duty int DEFAULT 0,
  total_staff_on_rest int DEFAULT 0,
  
  is_complete boolean DEFAULT false,
  
  generated_at timestamptz DEFAULT now()
);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_attendance_overview_unique 
  ON area_attendance_overview(tenant_id, store_id, overview_date);

COMMENT ON TABLE area_attendance_overview IS '上岗一览表';
COMMENT ON COLUMN area_attendance_overview.overview_data IS '详细上岗数据（JSONB格式）';
COMMENT ON COLUMN area_attendance_overview.total_areas IS '总区域数';
COMMENT ON COLUMN area_attendance_overview.open_areas IS '营业区域数';
COMMENT ON COLUMN area_attendance_overview.total_positions IS '总岗位数';
COMMENT ON COLUMN area_attendance_overview.total_staff_required IS '总需求人数';
COMMENT ON COLUMN area_attendance_overview.total_staff_assigned IS '总分配人数';
COMMENT ON COLUMN area_attendance_overview.total_staff_on_duty IS '总在岗人数';
COMMENT ON COLUMN area_attendance_overview.total_staff_on_rest IS '总休息人数';
COMMENT ON COLUMN area_attendance_overview.is_complete IS '是否完整（所有岗位都有人）';

CREATE INDEX idx_attendance_overview_tenant ON area_attendance_overview(tenant_id);
CREATE INDEX idx_attendance_overview_store ON area_attendance_overview(store_id);
CREATE INDEX idx_attendance_overview_date ON area_attendance_overview(overview_date);

-- ==================== RLS策略 ====================

-- business_areas表
ALTER TABLE business_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可管理经营区域" ON business_areas 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

CREATE POLICY "员工可查看经营区域" ON business_areas 
  FOR SELECT USING (true);

-- area_daily_status表
ALTER TABLE area_daily_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可管理区域状态" ON area_daily_status 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

CREATE POLICY "员工可查看区域状态" ON area_daily_status 
  FOR SELECT USING (true);

-- area_positions表
ALTER TABLE area_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可管理岗位配置" ON area_positions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

CREATE POLICY "员工可查看岗位配置" ON area_positions 
  FOR SELECT USING (true);

-- area_staff_assignments表
ALTER TABLE area_staff_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可管理人员分配" ON area_staff_assignments 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

CREATE POLICY "员工可查看自己的分配" ON area_staff_assignments 
  FOR SELECT USING (
    employee_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

-- area_attendance_overview表
ALTER TABLE area_attendance_overview ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可管理上岗一览" ON area_attendance_overview 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'tenant_admin'::user_role
    )
  );

CREATE POLICY "员工可查看上岗一览" ON area_attendance_overview 
  FOR SELECT USING (true);
