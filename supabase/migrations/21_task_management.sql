/*
# 任务管理系统数据库设计

## 概述
为 3.0 版本的任务管理系统创建必要的数据库表和策略。

## 新增表

### 1. tasks（任务表）
存储员工的工作任务信息，支持任务的创建、分配、跟踪和完成。

**字段说明**：
- id: 主键
- tenant_id: 租户ID
- employee_id: 员工ID（任务执行者）
- title: 任务标题
- description: 任务描述
- priority: 优先级（high/medium/low）
- status: 状态（pending/in_progress/completed/cancelled）
- due_date: 截止日期
- completed_at: 完成时间
- created_by: 创建者ID
- assigned_by: 分配者ID
- created_at: 创建时间
- updated_at: 更新时间

## 安全策略（RLS）

### tasks 表
- 员工可以查看分配给自己的任务
- 员工可以更新自己的任务状态和描述
- 管理员可以创建、查看、更新、删除所有任务
- 店长可以为自己店的员工创建和管理任务

## 注意事项
1. 所有表都启用了 RLS（行级安全）
2. 使用 UUID 作为主键
3. 时间戳字段使用 TIMESTAMPTZ 类型
4. 外键约束确保数据完整性
5. 索引优化查询性能
*/

-- ============================================
-- 1. 创建任务表
-- ============================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- 任务基本信息
  title TEXT NOT NULL, -- 任务标题
  description TEXT, -- 任务描述
  
  -- 任务属性
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')), -- 优先级
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')), -- 状态
  
  -- 时间信息
  due_date DATE, -- 截止日期
  completed_at TIMESTAMPTZ, -- 完成时间
  
  -- 创建和分配信息
  created_by UUID NOT NULL REFERENCES profiles(id), -- 创建者
  assigned_by UUID REFERENCES profiles(id), -- 分配者
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_employee_id ON tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);

-- 添加注释
COMMENT ON TABLE tasks IS '任务表';
COMMENT ON COLUMN tasks.title IS '任务标题';
COMMENT ON COLUMN tasks.description IS '任务描述';
COMMENT ON COLUMN tasks.priority IS '优先级：high-高, medium-中, low-低';
COMMENT ON COLUMN tasks.status IS '状态：pending-待开始, in_progress-进行中, completed-已完成, cancelled-已取消';
COMMENT ON COLUMN tasks.due_date IS '截止日期';
COMMENT ON COLUMN tasks.completed_at IS '完成时间';
COMMENT ON COLUMN tasks.created_by IS '创建者ID';
COMMENT ON COLUMN tasks.assigned_by IS '分配者ID';

-- ============================================
-- 2. 配置 RLS 策略
-- ============================================

-- 启用 RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- tasks 表的 RLS 策略
-- ============================================

-- 策略1：员工可以查看分配给自己的任务
CREATE POLICY "员工查看自己的任务"
  ON tasks
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 策略2：管理员可以查看所有任务
CREATE POLICY "管理员查看所有任务"
  ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin')
    )
  );

-- 策略3：店长可以查看自己店员工的任务
CREATE POLICY "店长查看本店员工任务"
  ON tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN employees e ON e.user_id = p.id
      WHERE p.id = auth.uid()
      AND p.role = 'store_manager'
      AND tasks.employee_id IN (
        SELECT id FROM employees WHERE store_id = e.store_id
      )
    )
  );

-- 策略4：员工可以更新自己的任务状态和描述
CREATE POLICY "员工更新自己的任务"
  ON tasks
  FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 策略5：管理员可以创建任务
CREATE POLICY "管理员创建任务"
  ON tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin', 'store_manager')
    )
  );

-- 策略6：管理员可以更新所有任务
CREATE POLICY "管理员更新所有任务"
  ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin')
    )
  );

-- 策略7：店长可以更新本店员工的任务
CREATE POLICY "店长更新本店员工任务"
  ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN employees e ON e.user_id = p.id
      WHERE p.id = auth.uid()
      AND p.role = 'store_manager'
      AND tasks.employee_id IN (
        SELECT id FROM employees WHERE store_id = e.store_id
      )
    )
  );

-- 策略8：管理员可以删除任务
CREATE POLICY "管理员删除任务"
  ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin')
    )
  );

-- 策略9：店长可以删除本店员工的任务
CREATE POLICY "店长删除本店员工任务"
  ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN employees e ON e.user_id = p.id
      WHERE p.id = auth.uid()
      AND p.role = 'store_manager'
      AND tasks.employee_id IN (
        SELECT id FROM employees WHERE store_id = e.store_id
      )
    )
  );

-- ============================================
-- 3. 创建触发器：自动更新 updated_at 字段
-- ============================================

-- 为 tasks 表创建触发器
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. 创建触发器：自动设置完成时间
-- ============================================

-- 创建触发器函数：当任务状态变为 completed 时，自动设置 completed_at
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果状态从非 completed 变为 completed，设置完成时间
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
  END IF;
  
  -- 如果状态从 completed 变为其他状态，清除完成时间
  IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 tasks 表创建触发器
DROP TRIGGER IF EXISTS set_task_completed_at_trigger ON tasks;
CREATE TRIGGER set_task_completed_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION set_task_completed_at();

-- ============================================
-- 5. 插入示例数据（可选）
-- ============================================

-- 为现有员工创建一些示例任务
-- 注意：这里只是示例，实际使用时可以删除或修改

-- 获取第一个租户和第一个员工
DO $$
DECLARE
  v_tenant_id UUID;
  v_employee_id UUID;
  v_admin_id UUID;
BEGIN
  -- 获取第一个租户
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  
  -- 获取第一个员工
  SELECT id INTO v_employee_id FROM employees WHERE tenant_id = v_tenant_id LIMIT 1;
  
  -- 获取第一个管理员
  SELECT id INTO v_admin_id FROM profiles WHERE role IN ('tenant_admin', 'super_admin') LIMIT 1;
  
  -- 如果找到了租户、员工和管理员，创建示例任务
  IF v_tenant_id IS NOT NULL AND v_employee_id IS NOT NULL AND v_admin_id IS NOT NULL THEN
    -- 创建高优先级任务
    INSERT INTO tasks (tenant_id, employee_id, title, description, priority, status, due_date, created_by, assigned_by)
    VALUES (
      v_tenant_id,
      v_employee_id,
      '完成月度销售报表',
      '整理本月的销售数据，生成月度报表并提交给财务部门。',
      'high',
      'in_progress',
      CURRENT_DATE + INTERVAL '2 days',
      v_admin_id,
      v_admin_id
    );
    
    -- 创建中优先级任务
    INSERT INTO tasks (tenant_id, employee_id, title, description, priority, status, due_date, created_by, assigned_by)
    VALUES (
      v_tenant_id,
      v_employee_id,
      '整理库存清单',
      '盘点仓库库存，更新库存管理系统。',
      'medium',
      'pending',
      CURRENT_DATE + INTERVAL '5 days',
      v_admin_id,
      v_admin_id
    );
    
    -- 创建低优先级任务
    INSERT INTO tasks (tenant_id, employee_id, title, description, priority, status, due_date, created_by, assigned_by)
    VALUES (
      v_tenant_id,
      v_employee_id,
      '清洁工作区域',
      '定期清洁和整理工作区域，保持环境整洁。',
      'low',
      'pending',
      CURRENT_DATE + INTERVAL '7 days',
      v_admin_id,
      v_admin_id
    );
  END IF;
END $$;
