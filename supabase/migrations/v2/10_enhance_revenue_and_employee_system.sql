/*
# 增强营收和员工管理系统

## 1. 营收系统增强

### 1.1 新增营收明细表 (revenue_detail_records)
支持细化到天、餐段、经营区的营收数据，包含来客数和客单价。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 门店ID
- revenue_date: 营收日期
- meal_period: 餐段（breakfast=早餐, lunch=午餐, dinner=晚餐, night=夜宵）
- business_area: 经营区（hall=大厅, private_room=包间, takeout=外卖, other=其他）
- customer_count: 来客数
- avg_price_per_customer: 客单价
- total_revenue: 总营收（来客数 × 客单价）
- notes: 备注
- created_by: 创建人
- created_at: 创建时间
- updated_at: 更新时间

### 1.2 Excel导入记录表 (revenue_import_logs)
记录Excel导入操作的历史。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 门店ID
- import_date: 导入日期
- file_name: 文件名
- total_records: 总记录数
- success_records: 成功记录数
- failed_records: 失败记录数
- error_details: 错误详情（JSON）
- imported_by: 导入人
- imported_at: 导入时间

## 2. 员工管理系统增强

### 2.1 员工表字段说明
已有字段（无需修改）：
- is_core_position: 是否核心岗位
- position_fixed_backup: 岗位是否需要固定顶岗
- can_backup_positions: 可以顶岗的其他岗位列表（JSON数组）

### 2.2 岗位配置表 (position_config)
存储可选的岗位列表，用于员工编辑界面的下拉选择。

字段说明：
- id: 主键
- tenant_id: 租户ID
- position_name: 岗位名称
- position_category: 岗位类别（front=前厅, kitchen=后厨）
- is_core: 是否核心岗位
- display_order: 显示顺序
- is_active: 是否启用
- created_at: 创建时间
- updated_at: 更新时间

## 3. 安全策略
- 所有表启用RLS
- 租户数据完全隔离
- 租户管理员和店经理有完整权限
- 普通员工只读权限

*/

-- ==================== 营收明细记录表 ====================

CREATE TABLE IF NOT EXISTS revenue_detail_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  revenue_date date NOT NULL,
  meal_period text NOT NULL CHECK (meal_period IN ('breakfast', 'lunch', 'dinner', 'night')),
  business_area text NOT NULL CHECK (business_area IN ('hall', 'private_room', 'takeout', 'other')),
  customer_count int NOT NULL DEFAULT 0 CHECK (customer_count >= 0),
  avg_price_per_customer numeric(10,2) NOT NULL DEFAULT 0 CHECK (avg_price_per_customer >= 0),
  total_revenue numeric(12,2) NOT NULL DEFAULT 0 CHECK (total_revenue >= 0),
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- 确保同一天、同一餐段、同一经营区只有一条记录
  UNIQUE(tenant_id, store_id, revenue_date, meal_period, business_area)
);

-- 创建索引
CREATE INDEX idx_revenue_detail_tenant ON revenue_detail_records(tenant_id);
CREATE INDEX idx_revenue_detail_store ON revenue_detail_records(store_id);
CREATE INDEX idx_revenue_detail_date ON revenue_detail_records(revenue_date);
CREATE INDEX idx_revenue_detail_meal ON revenue_detail_records(meal_period);
CREATE INDEX idx_revenue_detail_area ON revenue_detail_records(business_area);

-- 创建触发器：自动计算总营收
CREATE OR REPLACE FUNCTION calculate_total_revenue()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_revenue := NEW.customer_count * NEW.avg_price_per_customer;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_total_revenue
  BEFORE INSERT OR UPDATE ON revenue_detail_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_total_revenue();

-- 启用RLS
ALTER TABLE revenue_detail_records ENABLE ROW LEVEL SECURITY;

-- RLS策略：租户成员可查看
CREATE POLICY "租户成员可查看营收明细" ON revenue_detail_records
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS策略：租户管理员和店经理可创建
CREATE POLICY "租户管理员和店经理可创建营收明细" ON revenue_detail_records
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('tenant_admin', 'store_manager', 'super_admin')
    )
  );

-- RLS策略：租户管理员和店经理可更新
CREATE POLICY "租户管理员和店经理可更新营收明细" ON revenue_detail_records
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('tenant_admin', 'store_manager', 'super_admin')
    )
  );

-- RLS策略：租户管理员和店经理可删除
CREATE POLICY "租户管理员和店经理可删除营收明细" ON revenue_detail_records
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('tenant_admin', 'store_manager', 'super_admin')
    )
  );

-- ==================== Excel导入记录表 ====================

CREATE TABLE IF NOT EXISTS revenue_import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  import_date date NOT NULL,
  file_name text NOT NULL,
  total_records int NOT NULL DEFAULT 0,
  success_records int NOT NULL DEFAULT 0,
  failed_records int NOT NULL DEFAULT 0,
  error_details jsonb,
  imported_by uuid REFERENCES profiles(id),
  imported_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_revenue_import_tenant ON revenue_import_logs(tenant_id);
CREATE INDEX idx_revenue_import_store ON revenue_import_logs(store_id);
CREATE INDEX idx_revenue_import_date ON revenue_import_logs(import_date);

-- 启用RLS
ALTER TABLE revenue_import_logs ENABLE ROW LEVEL SECURITY;

-- RLS策略：租户成员可查看
CREATE POLICY "租户成员可查看导入记录" ON revenue_import_logs
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS策略：租户管理员和店经理可创建
CREATE POLICY "租户管理员和店经理可创建导入记录" ON revenue_import_logs
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('tenant_admin', 'store_manager', 'super_admin')
    )
  );

-- ==================== 岗位配置表 ====================

CREATE TABLE IF NOT EXISTS position_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  position_name text NOT NULL,
  position_category text NOT NULL CHECK (position_category IN ('front', 'kitchen')),
  is_core boolean DEFAULT false,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, position_name)
);

-- 创建索引
CREATE INDEX idx_position_config_tenant ON position_config(tenant_id);
CREATE INDEX idx_position_config_category ON position_config(position_category);
CREATE INDEX idx_position_config_active ON position_config(is_active);

-- 启用RLS
ALTER TABLE position_config ENABLE ROW LEVEL SECURITY;

-- RLS策略：租户成员可查看
CREATE POLICY "租户成员可查看岗位配置" ON position_config
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- RLS策略：租户管理员可管理
CREATE POLICY "租户管理员可管理岗位配置" ON position_config
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('tenant_admin', 'super_admin')
    )
  );

-- ==================== 插入默认岗位配置 ====================

-- 为测试餐厅插入默认岗位配置
INSERT INTO position_config (tenant_id, position_name, position_category, is_core, display_order) 
SELECT 
  t.id,
  position_data.name,
  position_data.category,
  position_data.is_core,
  position_data.display_order
FROM tenants t
CROSS JOIN (
  VALUES
    -- 前厅岗位
    ('店长', 'front', true, 1),
    ('前厅经理', 'front', true, 2),
    ('收银员', 'front', false, 3),
    ('服务员', 'front', false, 4),
    ('传菜员', 'front', false, 5),
    ('迎宾员', 'front', false, 6),
    ('清洁员', 'front', false, 7),
    -- 后厨岗位
    ('厨师长', 'kitchen', true, 8),
    ('主厨', 'kitchen', true, 9),
    ('副厨', 'kitchen', false, 10),
    ('配菜员', 'kitchen', false, 11),
    ('洗碗工', 'kitchen', false, 12),
    ('仓管员', 'kitchen', false, 13)
) AS position_data(name, category, is_core, display_order)
WHERE t.name = '测试餐厅'
ON CONFLICT (tenant_id, position_name) DO NOTHING;

-- ==================== 注释说明 ====================

COMMENT ON TABLE revenue_detail_records IS '营收明细记录表：支持细化到天、餐段、经营区的营收数据';
COMMENT ON TABLE revenue_import_logs IS 'Excel导入记录表：记录营收数据导入历史';
COMMENT ON TABLE position_config IS '岗位配置表：存储可选的岗位列表';

COMMENT ON COLUMN revenue_detail_records.meal_period IS '餐段：breakfast=早餐, lunch=午餐, dinner=晚餐, night=夜宵';
COMMENT ON COLUMN revenue_detail_records.business_area IS '经营区：hall=大厅, private_room=包间, takeout=外卖, other=其他';
COMMENT ON COLUMN revenue_detail_records.customer_count IS '来客数';
COMMENT ON COLUMN revenue_detail_records.avg_price_per_customer IS '客单价';
COMMENT ON COLUMN revenue_detail_records.total_revenue IS '总营收（自动计算：来客数 × 客单价）';
