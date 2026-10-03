/*
# 创建排班管理系统 V3.9

## 功能说明
本迁移文件创建完整的排班管理系统，包括：
1. 排班配置表（work_schedule_configs）：管理排班计划
2. 排班记录表（work_schedule_records）：记录具体的排班安排
3. 工作日志表（work_logs）：员工工作日志和评分
4. 工作评分表（work_ratings）：多维度评分系统

## 表结构

### 1. work_schedule_configs（排班配置表）
- id: 主键
- tenant_id: 租户ID
- store_id: 门店ID
- name: 排班名称
- description: 排班描述
- type: 排班类型（daily=日常、weekly=周期、temporary=临时）
- start_date: 开始日期
- end_date: 结束日期
- status: 状态（draft=草稿、published=已发布、completed=已完成、cancelled=已取消）
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

### 2. work_schedule_records（排班记录表）
- id: 主键
- config_id: 排班配置ID
- employee_id: 员工ID
- schedule_date: 排班日期
- shift_type: 班次类型（morning=早班、afternoon=中班、evening=晚班、full=全天）
- start_time: 开始时间
- end_time: 结束时间
- status: 状态（pending=待执行、in_progress=进行中、completed=已完成、cancelled=已取消）
- actual_start_time: 实际开始时间
- actual_end_time: 实际结束时间
- notes: 备注
- created_at: 创建时间
- updated_at: 更新时间

### 3. work_logs（工作日志表）
- id: 主键
- schedule_record_id: 排班记录ID
- employee_id: 员工ID
- log_date: 日志日期
- work_content: 工作内容
- achievements: 工作成果
- issues: 遇到的问题
- suggestions: 改进建议
- quality_score: 质量评分（1-5）
- efficiency_score: 效率评分（1-5）
- attitude_score: 态度评分（1-5）
- total_score: 总分
- images: 图片URL数组
- created_at: 创建时间
- updated_at: 更新时间

### 4. work_ratings（工作评分表）
- id: 主键
- work_log_id: 工作日志ID
- rater_id: 评分人ID
- rating_type: 评分类型（self=自评、peer=互评、supervisor=上级评分）
- quality_score: 质量评分
- efficiency_score: 效率评分
- attitude_score: 态度评分
- total_score: 总分
- comments: 评价意见
- created_at: 创建时间

## 安全策略
- 所有表启用RLS
- 管理员拥有完全访问权限
- 员工可以查看自己的排班和日志
- 员工可以创建和更新自己的日志
*/

-- 创建排班类型枚举
DO $$ BEGIN
  CREATE TYPE work_schedule_type AS ENUM ('daily', 'weekly', 'temporary');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建排班状态枚举
DO $$ BEGIN
  CREATE TYPE work_schedule_status AS ENUM ('draft', 'published', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建班次类型枚举
DO $$ BEGIN
  CREATE TYPE work_shift_type AS ENUM ('morning', 'afternoon', 'evening', 'full');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建排班记录状态枚举
DO $$ BEGIN
  CREATE TYPE work_record_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 创建评分类型枚举
DO $$ BEGIN
  CREATE TYPE work_rating_type AS ENUM ('self', 'peer', 'supervisor');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. 创建排班配置表
CREATE TABLE IF NOT EXISTS work_schedule_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type work_schedule_type NOT NULL DEFAULT 'daily'::work_schedule_type,
  start_date date NOT NULL,
  end_date date,
  status work_schedule_status NOT NULL DEFAULT 'draft'::work_schedule_status,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 创建排班记录表
CREATE TABLE IF NOT EXISTS work_schedule_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES work_schedule_configs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  schedule_date date NOT NULL,
  shift_type work_shift_type NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status work_record_status NOT NULL DEFAULT 'pending'::work_record_status,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. 创建工作日志表
CREATE TABLE IF NOT EXISTS work_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_record_id uuid NOT NULL REFERENCES work_schedule_records(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  work_content text NOT NULL,
  achievements text,
  issues text,
  suggestions text,
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 5),
  efficiency_score integer CHECK (efficiency_score >= 1 AND efficiency_score <= 5),
  attitude_score integer CHECK (attitude_score >= 1 AND attitude_score <= 5),
  total_score integer,
  images text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. 创建工作评分表
CREATE TABLE IF NOT EXISTS work_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_log_id uuid NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES profiles(id),
  rating_type work_rating_type NOT NULL,
  quality_score integer NOT NULL CHECK (quality_score >= 1 AND quality_score <= 5),
  efficiency_score integer NOT NULL CHECK (efficiency_score >= 1 AND efficiency_score <= 5),
  attitude_score integer NOT NULL CHECK (attitude_score >= 1 AND attitude_score <= 5),
  total_score integer NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_work_schedule_configs_tenant ON work_schedule_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_schedule_configs_store ON work_schedule_configs(store_id);
CREATE INDEX IF NOT EXISTS idx_work_schedule_configs_status ON work_schedule_configs(status);
CREATE INDEX IF NOT EXISTS idx_work_schedule_configs_dates ON work_schedule_configs(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_work_schedule_records_config ON work_schedule_records(config_id);
CREATE INDEX IF NOT EXISTS idx_work_schedule_records_employee ON work_schedule_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_schedule_records_date ON work_schedule_records(schedule_date);
CREATE INDEX IF NOT EXISTS idx_work_schedule_records_status ON work_schedule_records(status);

CREATE INDEX IF NOT EXISTS idx_work_logs_schedule_record ON work_logs(schedule_record_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_employee ON work_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_date ON work_logs(log_date);

CREATE INDEX IF NOT EXISTS idx_work_ratings_log ON work_ratings(work_log_id);
CREATE INDEX IF NOT EXISTS idx_work_ratings_rater ON work_ratings(rater_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_work_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为排班配置表添加更新时间触发器
DROP TRIGGER IF EXISTS work_schedule_configs_updated_at ON work_schedule_configs;
CREATE TRIGGER work_schedule_configs_updated_at
  BEFORE UPDATE ON work_schedule_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_work_schedule_updated_at();

-- 为排班记录表添加更新时间触发器
DROP TRIGGER IF EXISTS work_schedule_records_updated_at ON work_schedule_records;
CREATE TRIGGER work_schedule_records_updated_at
  BEFORE UPDATE ON work_schedule_records
  FOR EACH ROW
  EXECUTE FUNCTION update_work_schedule_updated_at();

-- 为工作日志表添加更新时间触发器
DROP TRIGGER IF EXISTS work_logs_updated_at ON work_logs;
CREATE TRIGGER work_logs_updated_at
  BEFORE UPDATE ON work_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_work_schedule_updated_at();

-- 创建自动计算总分的触发器函数
CREATE OR REPLACE FUNCTION calculate_work_log_total_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quality_score IS NOT NULL AND NEW.efficiency_score IS NOT NULL AND NEW.attitude_score IS NOT NULL THEN
    NEW.total_score = NEW.quality_score + NEW.efficiency_score + NEW.attitude_score;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为工作日志表添加自动计算总分触发器
DROP TRIGGER IF EXISTS work_logs_calculate_total_score ON work_logs;
CREATE TRIGGER work_logs_calculate_total_score
  BEFORE INSERT OR UPDATE ON work_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_work_log_total_score();

-- 启用RLS
ALTER TABLE work_schedule_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedule_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_ratings ENABLE ROW LEVEL SECURITY;

-- 排班配置表的RLS策略
-- 管理员完全访问
DROP POLICY IF EXISTS "管理员可以完全访问排班配置" ON work_schedule_configs;
CREATE POLICY "管理员可以完全访问排班配置" ON work_schedule_configs
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 员工可以查看自己门店的排班配置
DROP POLICY IF EXISTS "员工可以查看自己门店的排班配置" ON work_schedule_configs;
CREATE POLICY "员工可以查看自己门店的排班配置" ON work_schedule_configs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.store_id = work_schedule_configs.store_id
    )
  );

-- 排班记录表的RLS策略
-- 管理员完全访问
DROP POLICY IF EXISTS "管理员可以完全访问排班记录" ON work_schedule_records;
CREATE POLICY "管理员可以完全访问排班记录" ON work_schedule_records
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 员工可以查看自己的排班记录
DROP POLICY IF EXISTS "员工可以查看自己的排班记录" ON work_schedule_records;
CREATE POLICY "员工可以查看自己的排班记录" ON work_schedule_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = work_schedule_records.employee_id
    )
  );

-- 员工可以更新自己的排班记录状态
DROP POLICY IF EXISTS "员工可以更新自己的排班记录" ON work_schedule_records;
CREATE POLICY "员工可以更新自己的排班记录" ON work_schedule_records
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = work_schedule_records.employee_id
    )
  );

-- 工作日志表的RLS策略
-- 管理员完全访问
DROP POLICY IF EXISTS "管理员可以完全访问工作日志" ON work_logs;
CREATE POLICY "管理员可以完全访问工作日志" ON work_logs
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 员工可以查看自己的工作日志
DROP POLICY IF EXISTS "员工可以查看自己的工作日志" ON work_logs;
CREATE POLICY "员工可以查看自己的工作日志" ON work_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = work_logs.employee_id
    )
  );

-- 员工可以创建自己的工作日志
DROP POLICY IF EXISTS "员工可以创建自己的工作日志" ON work_logs;
CREATE POLICY "员工可以创建自己的工作日志" ON work_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = work_logs.employee_id
    )
  );

-- 员工可以更新自己的工作日志
DROP POLICY IF EXISTS "员工可以更新自己的工作日志" ON work_logs;
CREATE POLICY "员工可以更新自己的工作日志" ON work_logs
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.id = work_logs.employee_id
    )
  );

-- 工作评分表的RLS策略
-- 管理员完全访问
DROP POLICY IF EXISTS "管理员可以完全访问工作评分" ON work_ratings;
CREATE POLICY "管理员可以完全访问工作评分" ON work_ratings
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 员工可以查看与自己相关的评分
DROP POLICY IF EXISTS "员工可以查看相关评分" ON work_ratings;
CREATE POLICY "员工可以查看相关评分" ON work_ratings
  FOR SELECT TO authenticated
  USING (
    rater_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM work_logs wl
      JOIN employees e ON e.id = wl.employee_id
      WHERE wl.id = work_ratings.work_log_id
      AND e.user_id = auth.uid()
    )
  );

-- 员工可以创建评分
DROP POLICY IF EXISTS "员工可以创建评分" ON work_ratings;
CREATE POLICY "员工可以创建评分" ON work_ratings
  FOR INSERT TO authenticated
  WITH CHECK (rater_id = auth.uid());

-- 添加注释
COMMENT ON TABLE work_schedule_configs IS '排班配置表：管理排班计划';
COMMENT ON TABLE work_schedule_records IS '排班记录表：记录具体的排班安排';
COMMENT ON TABLE work_logs IS '工作日志表：员工工作日志和评分';
COMMENT ON TABLE work_ratings IS '工作评分表：多维度评分系统';
