/*
# 添加Agent角色和分配关系表

## 1. 更新用户角色枚举
- 在user_role枚举中添加'agent'角色

## 2. 新建表
- `agent_assignments` - Agent与门店的分配关系表
  - `id` (uuid, primary key) - 主键
  - `agent_id` (uuid, not null) - Agent用户ID，外键关联profiles表
  - `store_id` (uuid, not null) - 门店ID，外键关联stores表
  - `tenant_id` (uuid, not null) - 租户ID，外键关联tenants表
  - `assigned_at` (timestamptz, default: now()) - 分配时间
  - `assigned_by` (uuid, not null) - 分配人ID，外键关联profiles表
  - `status` (text, default: 'active') - 状态：active/inactive
  - `created_at` (timestamptz, default: now()) - 创建时间
  - `updated_at` (timestamptz, default: now()) - 更新时间

## 3. 安全策略
- 启用RLS
- 租户管理员可以管理本租户的Agent分配
- Agent可以查看自己的分配关系
- 超级管理员拥有完全访问权限

## 4. 索引
- agent_id索引，用于快速查询Agent的分配
- store_id索引，用于快速查询门店的Agent
- tenant_id索引，用于租户隔离
*/

-- 1. 更新user_role枚举，添加agent角色
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'agent';

-- 2. 创建agent_assignments表
CREATE TABLE IF NOT EXISTS agent_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid NOT NULL REFERENCES profiles(id),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, store_id)
);

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON agent_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_store_id ON agent_assignments(store_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_tenant_id ON agent_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_assignments(status);

-- 4. 启用RLS
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;

-- 5. 创建RLS策略

-- 超级管理员拥有完全访问权限
CREATE POLICY "超级管理员可以管理所有Agent分配" ON agent_assignments
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()));

-- 租户管理员可以管理本租户的Agent分配
CREATE POLICY "租户管理员可以管理本租户Agent分配" ON agent_assignments
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role = 'tenant_admin'
    )
  );

-- Agent可以查看自己的分配关系
CREATE POLICY "Agent可以查看自己的分配" ON agent_assignments
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid());

-- 6. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_agent_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_assignments_updated_at
  BEFORE UPDATE ON agent_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_assignments_updated_at();
