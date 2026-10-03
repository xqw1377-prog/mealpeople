/*
# 创建部门管理表

## 说明
创建departments表，用于管理组织架构和部门信息，支持多租户和层级结构

## 表结构
1. departments表
   - id (uuid, 主键): 部门ID
   - tenant_id (uuid, 必填): 租户ID
   - name (text, 必填): 部门名称
   - code (text, 可选): 部门编码
   - parent_id (uuid, 可选): 父部门ID，支持层级结构
   - manager_id (uuid, 可选): 部门负责人ID（关联employees表）
   - description (text, 可选): 部门描述
   - status (text, 必填): 状态（active/inactive）
   - sort_order (integer, 必填): 排序顺序
   - created_at (timestamptz): 创建时间
   - updated_at (timestamptz): 更新时间

## 安全策略
- 启用RLS
- 管理员可以管理所有部门
- 普通用户只能查看本租户的部门信息
*/

-- 创建departments表
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  parent_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_departments_tenant_id ON departments(tenant_id);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
CREATE INDEX idx_departments_manager_id ON departments(manager_id);
CREATE INDEX idx_departments_status ON departments(status);
CREATE INDEX idx_departments_sort_order ON departments(sort_order);

-- 创建唯一约束（同一租户下部门名称唯一）
CREATE UNIQUE INDEX idx_departments_tenant_name ON departments(tenant_id, name) WHERE status = 'active';

-- 创建唯一约束（同一租户下部门编码唯一）
CREATE UNIQUE INDEX idx_departments_tenant_code ON departments(tenant_id, code) WHERE code IS NOT NULL AND status = 'active';

-- 添加注释
COMMENT ON TABLE departments IS '部门管理表';
COMMENT ON COLUMN departments.id IS '部门ID';
COMMENT ON COLUMN departments.tenant_id IS '租户ID';
COMMENT ON COLUMN departments.name IS '部门名称';
COMMENT ON COLUMN departments.code IS '部门编码';
COMMENT ON COLUMN departments.parent_id IS '父部门ID';
COMMENT ON COLUMN departments.manager_id IS '部门负责人ID';
COMMENT ON COLUMN departments.description IS '部门描述';
COMMENT ON COLUMN departments.status IS '状态：active=启用, inactive=停用';
COMMENT ON COLUMN departments.sort_order IS '排序顺序';

-- 启用RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 管理员可以管理所有部门
CREATE POLICY "管理员可以管理所有部门" ON departments
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 普通用户可以查看本租户的部门
CREATE POLICY "用户可以查看本租户部门" ON departments
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_departments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_departments_updated_at();