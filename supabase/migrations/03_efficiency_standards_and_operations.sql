/*
# 营收-效能矩阵管控系统数据库结构

## 1. 新增表说明

### efficiency_standards 表（效能标准配置）
用于存储每个店铺或租户的效能标准配置，支持自定义三个营收区间的标准。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 店铺ID（NULL表示租户级别的默认配置）
- low_revenue_max: 低营收区上限（不含）
- low_efficiency_standard: 低营收区人均营收标准
- low_management_motto: 低营收区管理口令
- normal_revenue_min: 正常营收区下限（含）
- normal_revenue_max: 正常营收区上限（不含）
- normal_efficiency_standard: 正常营收区人均营收标准
- normal_management_motto: 正常营收区管理口令
- high_revenue_min: 高营收区下限（含）
- high_efficiency_standard: 高营收区人均营收标准
- high_management_motto: 高营收区管理口令

### daily_operations 表（每日运营记录）
用于记录每日的排班规划、营业中调整和营业后复盘数据。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 店铺ID
- operation_date: 运营日期
- estimated_revenue: 预估营收
- planned_work_hours: 计划工时
- midday_estimated_revenue: 午市后预估营收
- adjusted_work_hours: 调整后工时
- actual_revenue: 实际营收
- actual_work_hours: 实际工时
- per_capita_revenue: 人均营收
- efficiency_rating: 评价结果
- notes: 备注

## 2. 安全策略
- 启用RLS
- 用户只能查看和管理自己租户的数据
*/

-- 创建效能标准配置表
CREATE TABLE IF NOT EXISTS efficiency_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  -- 低营收区配置
  low_revenue_max DECIMAL(10,2) DEFAULT 10000,
  low_efficiency_standard DECIMAL(10,2) DEFAULT 700,
  low_management_motto TEXT DEFAULT '严控成本，生存第一',
  
  -- 正常营收区配置
  normal_revenue_min DECIMAL(10,2) DEFAULT 10000,
  normal_revenue_max DECIMAL(10,2) DEFAULT 18000,
  normal_efficiency_standard DECIMAL(10,2) DEFAULT 850,
  normal_management_motto TEXT DEFAULT '精益运营，效率为王',
  
  -- 高营收区配置
  high_revenue_min DECIMAL(10,2) DEFAULT 18000,
  high_efficiency_standard DECIMAL(10,2) DEFAULT 1000,
  high_management_motto TEXT DEFAULT '保障效能，利润冲刺',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, store_id)
);

-- 创建每日运营记录表
CREATE TABLE IF NOT EXISTS daily_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  operation_date DATE NOT NULL,
  
  -- 排班规划阶段
  estimated_revenue DECIMAL(10,2),
  planned_work_hours DECIMAL(10,2),
  
  -- 营业中调整阶段
  midday_estimated_revenue DECIMAL(10,2),
  adjusted_work_hours DECIMAL(10,2),
  
  -- 营业后复盘阶段
  actual_revenue DECIMAL(10,2),
  actual_work_hours DECIMAL(10,2),
  per_capita_revenue DECIMAL(10,2),
  efficiency_rating TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, store_id, operation_date)
);

-- 启用RLS
ALTER TABLE efficiency_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_operations ENABLE ROW LEVEL SECURITY;

-- 效能标准配置表的RLS策略
CREATE POLICY "用户可以查看自己租户的效能标准配置" ON efficiency_standards
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "用户可以管理自己租户的效能标准配置" ON efficiency_standards
  FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 每日运营记录表的RLS策略
CREATE POLICY "用户可以查看自己租户的每日运营记录" ON daily_operations
  FOR SELECT TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "用户可以管理自己租户的每日运营记录" ON daily_operations
  FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 为每个现有租户创建默认的效能标准配置
INSERT INTO efficiency_standards (tenant_id, store_id)
SELECT id, NULL FROM tenants
ON CONFLICT (tenant_id, store_id) DO NOTHING;
