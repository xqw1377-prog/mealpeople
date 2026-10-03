/*
# 创建最低营收岗位配置表

## 表结构说明
min_revenue_positions 表用于存储不同营收场景下的岗位配置方案。
每个配置方案包含：
- 场景名称
- 最低营收阈值
- 所需岗位列表（JSON格式）
- 场景描述

## 安全策略
- 启用RLS
- 租户用户可以管理自己租户的配置
*/

-- 创建最低营收岗位配置表
CREATE TABLE IF NOT EXISTS min_revenue_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  min_revenue numeric(10,2) NOT NULL DEFAULT 0,
  scenario_name text NOT NULL,
  required_positions jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, store_id, scenario_name)
);

-- 启用RLS
ALTER TABLE min_revenue_positions ENABLE ROW LEVEL SECURITY;

-- RLS策略
CREATE POLICY "Users can view min revenue positions"
  ON min_revenue_positions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can manage min revenue positions"
  ON min_revenue_positions FOR ALL
  TO authenticated
  USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );
