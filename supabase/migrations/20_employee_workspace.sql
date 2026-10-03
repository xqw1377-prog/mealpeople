/*
# 员工工作台数据库设计

## 概述
为 3.0 版本的员工工作台功能创建必要的数据库表和策略。

## 新增表

### 1. employee_work_info（员工工作信息表）
存储员工的工作相关信息，包括岗位、状态、技能等级等。

**字段说明**：
- id: 主键
- tenant_id: 租户ID
- employee_id: 员工ID（关联 employees 表）
- current_position: 当前岗位
- work_status: 工作状态（active/on_leave/resigned）
- entry_date: 入职日期
- department: 所属部门
- skill_level: 技能等级（0-100）
- service_score: 服务评分（0-100）
- created_at: 创建时间
- updated_at: 更新时间

### 2. work_attendance（工作考勤表）
记录员工的每日考勤情况，包括打卡时间、工作时长等。

**字段说明**：
- id: 主键
- tenant_id: 租户ID
- employee_id: 员工ID
- store_id: 门店ID
- date: 考勤日期
- shift_type: 班次类型（early/middle/late）
- clock_in_time: 打卡上班时间
- clock_out_time: 打卡下班时间
- status: 考勤状态（normal/late/early_leave/absent）
- work_hours: 实际工作小时数
- note: 备注
- created_at: 创建时间
- updated_at: 更新时间

## 安全策略（RLS）

### employee_work_info 表
- 员工可以查看自己的工作信息
- 管理员（tenant_admin、super_admin）可以查看和管理所有工作信息

### work_attendance 表
- 员工可以查看自己的考勤记录
- 管理员（tenant_admin、super_admin、store_manager）可以查看和管理所有考勤记录

## 注意事项
1. 所有表都启用了 RLS（行级安全）
2. 使用 UUID 作为主键
3. 时间戳字段使用 TIMESTAMPTZ 类型
4. 外键约束确保数据完整性
*/

-- ============================================
-- 1. 创建员工工作信息表
-- ============================================

CREATE TABLE IF NOT EXISTS employee_work_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- 工作信息
  current_position TEXT, -- 当前岗位
  work_status TEXT DEFAULT 'active' CHECK (work_status IN ('active', 'on_leave', 'resigned')), -- 工作状态
  entry_date DATE, -- 入职日期
  department TEXT, -- 所属部门
  
  -- 技能信息
  skill_level INTEGER DEFAULT 0 CHECK (skill_level >= 0 AND skill_level <= 100), -- 技能等级（0-100）
  service_score INTEGER DEFAULT 0 CHECK (service_score >= 0 AND service_score <= 100), -- 服务评分（0-100）
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一约束：每个员工只有一条工作信息记录
  UNIQUE(employee_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_employee_work_info_tenant_id ON employee_work_info(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_work_info_employee_id ON employee_work_info(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_work_info_work_status ON employee_work_info(work_status);

-- 添加注释
COMMENT ON TABLE employee_work_info IS '员工工作信息表';
COMMENT ON COLUMN employee_work_info.current_position IS '当前岗位';
COMMENT ON COLUMN employee_work_info.work_status IS '工作状态：active-在职, on_leave-休假, resigned-离职';
COMMENT ON COLUMN employee_work_info.skill_level IS '技能等级（0-100）';
COMMENT ON COLUMN employee_work_info.service_score IS '服务评分（0-100）';

-- ============================================
-- 2. 创建工作考勤表
-- ============================================

CREATE TABLE IF NOT EXISTS work_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  
  -- 考勤信息
  date DATE NOT NULL, -- 考勤日期
  shift_type TEXT CHECK (shift_type IN ('early', 'middle', 'late')), -- 班次类型
  clock_in_time TIMESTAMPTZ, -- 打卡上班时间
  clock_out_time TIMESTAMPTZ, -- 打卡下班时间
  
  -- 考勤状态
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'late', 'early_leave', 'absent')), -- 考勤状态
  work_hours DECIMAL(4,2), -- 实际工作小时数
  
  -- 备注
  note TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一约束：每个员工每天只有一条考勤记录
  UNIQUE(employee_id, date)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_work_attendance_tenant_id ON work_attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_attendance_employee_id ON work_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_attendance_date ON work_attendance(date);
CREATE INDEX IF NOT EXISTS idx_work_attendance_store_id ON work_attendance(store_id);

-- 添加注释
COMMENT ON TABLE work_attendance IS '工作考勤表';
COMMENT ON COLUMN work_attendance.shift_type IS '班次类型：early-早班, middle-中班, late-晚班';
COMMENT ON COLUMN work_attendance.status IS '考勤状态：normal-正常, late-迟到, early_leave-早退, absent-缺勤';
COMMENT ON COLUMN work_attendance.work_hours IS '实际工作小时数';

-- ============================================
-- 3. 配置 RLS 策略
-- ============================================

-- 启用 RLS
ALTER TABLE employee_work_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_attendance ENABLE ROW LEVEL SECURITY;

-- ============================================
-- employee_work_info 表的 RLS 策略
-- ============================================

-- 策略1：员工可以查看自己的工作信息
CREATE POLICY "员工查看自己的工作信息"
  ON employee_work_info
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 策略2：管理员可以查看所有工作信息
CREATE POLICY "管理员查看所有工作信息"
  ON employee_work_info
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin')
    )
  );

-- 策略3：管理员可以插入工作信息
CREATE POLICY "管理员插入工作信息"
  ON employee_work_info
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin')
    )
  );

-- 策略4：管理员可以更新工作信息
CREATE POLICY "管理员更新工作信息"
  ON employee_work_info
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin')
    )
  );

-- 策略5：管理员可以删除工作信息
CREATE POLICY "管理员删除工作信息"
  ON employee_work_info
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin')
    )
  );

-- ============================================
-- work_attendance 表的 RLS 策略
-- ============================================

-- 策略1：员工可以查看自己的考勤记录
CREATE POLICY "员工查看自己的考勤"
  ON work_attendance
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- 策略2：管理员可以查看所有考勤记录
CREATE POLICY "管理员查看所有考勤"
  ON work_attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin', 'store_manager')
    )
  );

-- 策略3：管理员可以插入考勤记录
CREATE POLICY "管理员插入考勤"
  ON work_attendance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin', 'store_manager')
    )
  );

-- 策略4：管理员可以更新考勤记录
CREATE POLICY "管理员更新考勤"
  ON work_attendance
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin', 'store_manager')
    )
  );

-- 策略5：管理员可以删除考勤记录
CREATE POLICY "管理员删除考勤"
  ON work_attendance
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('tenant_admin', 'super_admin', 'store_manager')
    )
  );

-- ============================================
-- 4. 创建触发器：自动更新 updated_at 字段
-- ============================================

-- 创建触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 employee_work_info 表创建触发器
DROP TRIGGER IF EXISTS update_employee_work_info_updated_at ON employee_work_info;
CREATE TRIGGER update_employee_work_info_updated_at
  BEFORE UPDATE ON employee_work_info
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 work_attendance 表创建触发器
DROP TRIGGER IF EXISTS update_work_attendance_updated_at ON work_attendance;
CREATE TRIGGER update_work_attendance_updated_at
  BEFORE UPDATE ON work_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 插入初始数据（可选）
-- ============================================

-- 为现有员工创建工作信息记录
INSERT INTO employee_work_info (tenant_id, employee_id, work_status, skill_level, service_score)
SELECT 
  e.tenant_id,
  e.id,
  'active'::TEXT,
  50, -- 默认技能等级
  50  -- 默认服务评分
FROM employees e
WHERE NOT EXISTS (
  SELECT 1 FROM employee_work_info WHERE employee_id = e.id
)
ON CONFLICT (employee_id) DO NOTHING;
