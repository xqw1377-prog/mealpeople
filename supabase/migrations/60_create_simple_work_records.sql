/*
# 简化版工作记录表

## 概述
为 V3.17 版本的员工工作记录功能创建简化的数据库表。
设计理念：从员工视角出发，简化记录流程，移除复杂的评分系统。

## 新增表

### simple_work_records（简化版工作记录表）
存储员工的日常工作记录，包括工作类型、内容、状态等。

**字段说明**：
- id: 主键
- tenant_id: 租户ID
- employee_id: 员工ID
- date: 记录日期
- time: 记录时间
- work_type: 工作类型（customer_service/cleaning/inventory/maintenance/training/other）
- work_content: 工作内容
- work_duration: 工作时长（分钟）
- status: 工作状态（completed/in_progress/pending）
- note: 备注
- created_at: 创建时间
- updated_at: 更新时间

## 安全策略（RLS）

### simple_work_records 表
- 员工可以查看和管理自己的工作记录
- 管理员可以查看所有工作记录

## 注意事项
1. 启用了 RLS（行级安全）
2. 使用 UUID 作为主键
3. 时间戳字段使用 TIMESTAMPTZ 类型
4. 外键约束确保数据完整性
*/

-- ============================================
-- 1. 创建简化版工作记录表
-- ============================================

CREATE TABLE IF NOT EXISTS simple_work_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- 记录信息
  date DATE NOT NULL, -- 记录日期
  time TIME NOT NULL, -- 记录时间
  work_type TEXT NOT NULL CHECK (work_type IN ('customer_service', 'cleaning', 'inventory', 'maintenance', 'training', 'other')), -- 工作类型
  work_content TEXT NOT NULL, -- 工作内容
  work_duration INTEGER, -- 工作时长（分钟）
  
  -- 工作状态
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'pending')), -- 工作状态
  
  -- 备注
  note TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_simple_work_records_tenant_id ON simple_work_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_simple_work_records_employee_id ON simple_work_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_simple_work_records_date ON simple_work_records(date);
CREATE INDEX IF NOT EXISTS idx_simple_work_records_work_type ON simple_work_records(work_type);

-- 添加注释
COMMENT ON TABLE simple_work_records IS '简化版工作记录表';
COMMENT ON COLUMN simple_work_records.work_type IS '工作类型：customer_service-接待客户, cleaning-清洁卫生, inventory-库存盘点, maintenance-设备维护, training-培训学习, other-其他工作';
COMMENT ON COLUMN simple_work_records.status IS '工作状态：completed-已完成, in_progress-进行中, pending-待处理';
COMMENT ON COLUMN simple_work_records.work_duration IS '工作时长（分钟）';

-- ============================================
-- 2. 配置 RLS 策略
-- ============================================

-- 启用 RLS
ALTER TABLE simple_work_records ENABLE ROW LEVEL SECURITY;

-- 策略1：员工可以查看自己的工作记录
CREATE POLICY "员工查看自己的工作记录"
  ON simple_work_records
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 策略2：员工可以插入自己的工作记录
CREATE POLICY "员工插入自己的工作记录"
  ON simple_work_records
  FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 策略3：员工可以更新自己的工作记录
CREATE POLICY "员工更新自己的工作记录"
  ON simple_work_records
  FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 策略4：员工可以删除自己的工作记录
CREATE POLICY "员工删除自己的工作记录"
  ON simple_work_records
  FOR DELETE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 策略5：管理员可以查看所有工作记录
CREATE POLICY "管理员查看所有工作记录"
  ON simple_work_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin')
    )
  );

-- 策略6：管理员可以更新所有工作记录
CREATE POLICY "管理员更新所有工作记录"
  ON simple_work_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin')
    )
  );

-- 策略7：管理员可以删除所有工作记录
CREATE POLICY "管理员删除所有工作记录"
  ON simple_work_records
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin')
    )
  );
