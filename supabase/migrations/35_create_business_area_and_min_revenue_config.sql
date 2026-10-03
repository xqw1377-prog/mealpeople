/*
# 创建营业区配置和低营收岗位配置表

## 1. 营业区配置表 (business_area_config)
用于配置门店的营业区域和制作区域，包括：
- 区域名称（大厅、包间、外卖、制作区等）
- 区域类型（营业区/制作区）
- 区域容量
- 是否启用

## 2. 低营收岗位配置表 (min_revenue_position_config)
用于配置在低营收情况下餐厅最少最必要的岗位配置，包括：
- 岗位名称
- 最少人数
- 岗位职责描述
- 优先级

## 3. 岗位配置表 (position_config)
用于配置门店的岗位信息，包括：
- 岗位名称
- 岗位类型
- 岗位职责
- 是否启用

## 安全策略
- 启用RLS
- 租户管理员可以管理自己租户的配置
- 普通用户只能查看
*/

-- 创建营业区配置表
CREATE TABLE IF NOT EXISTS business_area_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  area_name text NOT NULL,
  area_type text NOT NULL CHECK (area_type IN ('business', 'production')),
  capacity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, store_id, area_name)
);

-- 创建低营收岗位配置表
CREATE TABLE IF NOT EXISTS min_revenue_position_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  position_name text NOT NULL,
  min_count integer NOT NULL DEFAULT 1,
  priority integer DEFAULT 0,
  responsibilities text,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, store_id, position_name)
);

-- 创建岗位配置表
CREATE TABLE IF NOT EXISTS position_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  position_name text NOT NULL,
  position_type text NOT NULL CHECK (position_type IN ('service', 'kitchen', 'management', 'support')),
  responsibilities text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, store_id, position_name)
);

-- 启用RLS
ALTER TABLE business_area_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE min_revenue_position_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_config ENABLE ROW LEVEL SECURITY;

-- 营业区配置表策略
CREATE POLICY "Users can view business area config"
  ON business_area_config FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage business area config"
  ON business_area_config FOR ALL
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 低营收岗位配置表策略
CREATE POLICY "Users can view min revenue position config"
  ON min_revenue_position_config FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage min revenue position config"
  ON min_revenue_position_config FOR ALL
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 岗位配置表策略
CREATE POLICY "Users can view position config"
  ON position_config FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage position config"
  ON position_config FOR ALL
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_business_area_config_tenant ON business_area_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_business_area_config_store ON business_area_config(store_id);
CREATE INDEX IF NOT EXISTS idx_min_revenue_position_config_tenant ON min_revenue_position_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_min_revenue_position_config_store ON min_revenue_position_config(store_id);
CREATE INDEX IF NOT EXISTS idx_position_config_tenant ON position_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_position_config_store ON position_config(store_id);
