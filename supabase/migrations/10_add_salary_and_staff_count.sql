/*
# 添加员工薪酬和排班人数管理功能

## 需求说明
1. 员工管理支持薪酬录入，用于计算实际人力成本
2. 排班数据统一为人数（正式工），而不是工时
3. 兼职工使用工时
4. 正式工工时可配置，默认每天8小时

## 变更内容

### 1. 员工表（profiles）
- 添加 salary（月薪）字段
- 添加 employment_type（雇佣类型：full_time/part_time）字段
- 添加 daily_work_hours（每日工作小时数，仅正式工）字段，默认8小时

### 2. 每日运营记录表（daily_operations）
- 将 planned_work_hours 改为 planned_staff_count（计划正式工人数）
- 添加 planned_part_time_hours（计划兼职工时）
- 将 adjusted_work_hours 改为 adjusted_staff_count（调整后正式工人数）
- 添加 adjusted_part_time_hours（调整后兼职工时）
- 将 actual_work_hours 改为 actual_staff_count（实际正式工人数）
- 添加 actual_part_time_hours（实际兼职工时）
- 添加 planned_labor_cost（计划人力成本）
- 添加 actual_labor_cost（实际人力成本）

### 3. 租户配置表（tenant_settings）
- 创建新表存储租户级别的配置
- 添加 default_daily_work_hours（默认每日工作小时数）
*/

-- ============================================
-- 1. 创建雇佣类型枚举
-- ============================================
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time');

-- ============================================
-- 2. 修改员工表（profiles）
-- ============================================

-- 添加薪酬字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);

-- 添加雇佣类型字段，默认为正式工
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employment_type employment_type DEFAULT 'full_time'::employment_type;

-- 添加每日工作小时数字段，默认8小时（仅正式工使用）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_work_hours DECIMAL(4,2) DEFAULT 8.00;

-- 添加注释
COMMENT ON COLUMN profiles.salary IS '月薪（元），用于计算人力成本';
COMMENT ON COLUMN profiles.employment_type IS '雇佣类型：full_time=正式工，part_time=兼职工';
COMMENT ON COLUMN profiles.daily_work_hours IS '每日工作小时数，默认8小时（仅正式工使用）';

-- ============================================
-- 3. 创建租户配置表
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- 工时配置
    default_daily_work_hours DECIMAL(4,2) DEFAULT 8.00 NOT NULL,
    
    -- 其他配置可以后续添加
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id)
);

COMMENT ON TABLE tenant_settings IS '租户配置表';
COMMENT ON COLUMN tenant_settings.default_daily_work_hours IS '默认每日工作小时数，用于正式工工时计算';

-- 启用RLS
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "认证用户可以管理租户配置" ON tenant_settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 4. 修改每日运营记录表（daily_operations）
-- ============================================

-- 排班规划阶段：将工时改为人数
ALTER TABLE daily_operations RENAME COLUMN planned_work_hours TO planned_staff_count;
ALTER TABLE daily_operations ADD COLUMN IF NOT EXISTS planned_part_time_hours DECIMAL(10,2) DEFAULT 0;
ALTER TABLE daily_operations ADD COLUMN IF NOT EXISTS planned_labor_cost DECIMAL(10,2);

-- 营业中调整阶段：将工时改为人数
ALTER TABLE daily_operations RENAME COLUMN adjusted_work_hours TO adjusted_staff_count;
ALTER TABLE daily_operations ADD COLUMN IF NOT EXISTS adjusted_part_time_hours DECIMAL(10,2) DEFAULT 0;

-- 营业后复盘阶段：将工时改为人数
ALTER TABLE daily_operations RENAME COLUMN actual_work_hours TO actual_staff_count;
ALTER TABLE daily_operations ADD COLUMN IF NOT EXISTS actual_part_time_hours DECIMAL(10,2) DEFAULT 0;
ALTER TABLE daily_operations ADD COLUMN IF NOT EXISTS actual_labor_cost DECIMAL(10,2);

-- 添加注释
COMMENT ON COLUMN daily_operations.planned_staff_count IS '计划正式工人数';
COMMENT ON COLUMN daily_operations.planned_part_time_hours IS '计划兼职工时（小时）';
COMMENT ON COLUMN daily_operations.planned_labor_cost IS '计划人力成本（元）';
COMMENT ON COLUMN daily_operations.adjusted_staff_count IS '调整后正式工人数';
COMMENT ON COLUMN daily_operations.adjusted_part_time_hours IS '调整后兼职工时（小时）';
COMMENT ON COLUMN daily_operations.actual_staff_count IS '实际正式工人数';
COMMENT ON COLUMN daily_operations.actual_part_time_hours IS '实际兼职工时（小时）';
COMMENT ON COLUMN daily_operations.actual_labor_cost IS '实际人力成本（元）';

-- ============================================
-- 5. 为现有租户创建默认配置
-- ============================================
INSERT INTO tenant_settings (tenant_id, default_daily_work_hours)
SELECT id, 8.00
FROM tenants
WHERE id NOT IN (SELECT tenant_id FROM tenant_settings);

-- ============================================
-- 6. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_employment_type ON profiles(employment_type);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_employment ON profiles(tenant_id, employment_type);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant ON tenant_settings(tenant_id);
