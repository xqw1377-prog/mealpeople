/*
# 创建班次配置表

## 1. 新建表
- `work_shifts` - 班次配置表
  - `id` (uuid, 主键) - 班次ID
  - `tenant_id` (uuid, 外键) - 租户ID
  - `store_id` (uuid, 外键, 可选) - 门店ID（为空表示租户级别配置）
  - `shift_name` (text) - 班次名称（如：早班、晚班、正常班）
  - `shift_order` (integer) - 显示顺序
  - `start_time` (time) - 开始时间
  - `end_time` (time) - 结束时间
  - `work_hours` (numeric) - 工作小时数
  - `is_active` (boolean) - 是否启用
  - `created_at` (timestamptz) - 创建时间
  - `updated_at` (timestamptz) - 更新时间

## 2. 安全策略
- 启用 RLS
- 租户管理员可以管理自己租户的班次配置
- 门店经理可以查看和使用班次配置

## 3. 索引
- 租户ID索引
- 门店ID索引
- 排序索引

*/

-- 创建班次配置表
CREATE TABLE IF NOT EXISTS work_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    shift_name TEXT NOT NULL,
    shift_order INTEGER NOT NULL DEFAULT 0,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    work_hours NUMERIC(4,2) DEFAULT 8.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, store_id, shift_name)
);

-- 创建索引
CREATE INDEX idx_work_shifts_tenant ON work_shifts(tenant_id);
CREATE INDEX idx_work_shifts_store ON work_shifts(store_id);
CREATE INDEX idx_work_shifts_order ON work_shifts(tenant_id, shift_order);

-- 添加注释
COMMENT ON TABLE work_shifts IS '班次配置表';
COMMENT ON COLUMN work_shifts.tenant_id IS '租户ID';
COMMENT ON COLUMN work_shifts.store_id IS '门店ID，为空表示租户级别配置';
COMMENT ON COLUMN work_shifts.shift_name IS '班次名称，如：早班、晚班、正常班';
COMMENT ON COLUMN work_shifts.shift_order IS '显示顺序';
COMMENT ON COLUMN work_shifts.start_time IS '班次开始时间';
COMMENT ON COLUMN work_shifts.end_time IS '班次结束时间';
COMMENT ON COLUMN work_shifts.work_hours IS '工作小时数';
COMMENT ON COLUMN work_shifts.is_active IS '是否启用';

-- 启用 RLS
ALTER TABLE work_shifts ENABLE ROW LEVEL SECURITY;

-- 租户管理员可以查看自己租户的班次配置
CREATE POLICY "租户成员可以查看本租户班次配置" ON work_shifts
    FOR SELECT TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- 租户管理员可以创建班次配置
CREATE POLICY "租户管理员可以创建班次配置" ON work_shifts
    FOR INSERT TO authenticated
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('tenant_admin', 'store_manager')
        )
    );

-- 租户管理员可以更新班次配置
CREATE POLICY "租户管理员可以更新班次配置" ON work_shifts
    FOR UPDATE TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('tenant_admin', 'store_manager')
        )
    )
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('tenant_admin', 'store_manager')
        )
    );

-- 租户管理员可以删除班次配置
CREATE POLICY "租户管理员可以删除班次配置" ON work_shifts
    FOR DELETE TO authenticated
    USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('tenant_admin', 'store_manager')
        )
    );

-- 创建更新时间触发器
CREATE TRIGGER update_work_shifts_updated_at
    BEFORE UPDATE ON work_shifts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
