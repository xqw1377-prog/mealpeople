/*
# 创建品牌表（多品牌架构）

## 1. 架构说明
实现租户-品牌-门店的三层架构：
- 租户（Tenant）：公司/组织，一个租户可以管理多个品牌
- 品牌（Brand）：业务品牌，一个品牌下有多个门店和员工
- 门店（Store）：具体门店，属于某个品牌

## 2. 新建表
- `brands` - 品牌表
  - `id` (uuid, 主键) - 品牌ID
  - `tenant_id` (uuid, 外键) - 所属租户ID
  - `name` (text, 必填) - 品牌名称
  - `industry` (text) - 行业类型
  - `logo_url` (text) - 品牌Logo URL
  - `description` (text) - 品牌描述
  - `status` (text) - 状态：active(活跃)/inactive(停用)
  - `created_at` (timestamptz) - 创建时间
  - `updated_at` (timestamptz) - 更新时间

## 3. 安全策略
- 启用 RLS
- 超级管理员可以访问所有品牌
- 租户管理员可以管理本租户下的所有品牌
- 店经理和员工可以查看本租户下的品牌

## 4. 数据迁移
- 为每个现有租户创建一个默认品牌
- 品牌名称使用tenant_settings中的brand_name
- 如果brand_name为空，使用租户名称
*/

-- 创建品牌表
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  logo_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_brands_tenant ON brands(tenant_id);
CREATE INDEX idx_brands_status ON brands(status);
CREATE INDEX idx_brands_created ON brands(created_at DESC);

-- 启用 RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- 超级管理员可以访问所有品牌
CREATE POLICY "超级管理员可以访问所有品牌" ON brands
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- 租户管理员可以管理本租户的品牌
CREATE POLICY "租户管理员可以管理本租户品牌" ON brands
  FOR ALL TO authenticated
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) = 'tenant_admin'::user_role
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) = 'tenant_admin'::user_role
  );

-- 店经理和员工可以查看本租户的品牌
CREATE POLICY "店经理和员工可以查看本租户品牌" ON brands
  FOR SELECT TO authenticated
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND get_user_role(auth.uid()) IN ('store_manager'::user_role, 'employee'::user_role)
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_brands_updated_at();

-- 数据迁移：为每个现有租户创建默认品牌
INSERT INTO brands (tenant_id, name, industry, status)
SELECT 
  t.id AS tenant_id,
  COALESCE(ts.brand_name, t.name) AS name,
  t.industry,
  'active' AS status
FROM tenants t
LEFT JOIN tenant_settings ts ON ts.tenant_id = t.id
WHERE NOT EXISTS (
  SELECT 1 FROM brands b WHERE b.tenant_id = t.id
);
