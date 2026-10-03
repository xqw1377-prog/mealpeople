/*
# 休假申请功能和角色系统更新

## 1. 角色系统更新

### 1.1 更新角色枚举
将原来的5个角色（user, admin, super_admin, tenant_admin, store_manager）
简化为3个角色（employee, manager, tenant_admin）

角色说明：
- employee: 员工，可以查看自己的排班和申请休假
- manager: 管理者（店长/主管），可以管理本店铺的排班和审批休假
- tenant_admin: 租户管理员，可以管理所有店铺和员工

## 2. 休假申请功能

### 2.1 休假申请表 (leave_requests)
存储员工的休假申请。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 店铺ID
- employee_id: 员工ID
- leave_date: 休假日期
- leave_type: 休假类型（annual=年假, personal=事假, sick=病假, other=其他）
- reason: 休假原因
- status: 申请状态（pending=待审批, approved=已批准, rejected=已拒绝, cancelled=已撤销）
- approver_id: 审批人ID
- approval_comment: 审批意见
- approved_at: 审批时间
- created_at: 创建时间
- updated_at: 更新时间

## 3. 安全策略 (RLS)

### 3.1 休假申请表策略
- 员工可以查看自己的休假申请
- 员工可以创建和撤销自己的休假申请
- 管理者可以查看和审批本店铺的休假申请
- 租户管理员可以查看和审批所有休假申请

## 4. 注意事项
- 休假申请只能选择未来的日期
- 已批准的休假日期不能被排班
- 员工可以撤销待审批的申请
- 管理者审批后不能再修改
*/

-- ============================================
-- 1. 更新角色枚举类型
-- ============================================

-- 创建新的角色枚举类型
DO $$ 
BEGIN
  -- 检查新类型是否已存在
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_new') THEN
    CREATE TYPE user_role_new AS ENUM ('employee', 'manager', 'tenant_admin');
  END IF;
END $$;

-- 先删除默认值
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- 更新profiles表的role字段
ALTER TABLE profiles ALTER COLUMN role TYPE user_role_new USING (
  CASE 
    WHEN role::text IN ('user', 'employee') THEN 'employee'::user_role_new
    WHEN role::text IN ('store_manager', 'manager') THEN 'manager'::user_role_new
    WHEN role::text IN ('admin', 'tenant_admin', 'super_admin') THEN 'tenant_admin'::user_role_new
    ELSE 'employee'::user_role_new
  END
);

-- 设置新的默认值
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'employee'::user_role_new;

-- 删除旧的角色枚举类型
DROP TYPE IF EXISTS user_role CASCADE;

-- 重命名新类型为user_role
ALTER TYPE user_role_new RENAME TO user_role;

-- ============================================
-- 2. 创建休假申请表
-- ============================================

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  store_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  leave_date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'personal', 'sick', 'other')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approver_id UUID,
  approval_comment TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT leave_date_future CHECK (leave_date >= CURRENT_DATE)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_store ON leave_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_date ON leave_requests(leave_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_approver ON leave_requests(approver_id);

-- 启用RLS
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- 创建策略：员工可以查看自己的休假申请
CREATE POLICY "员工可以查看自己的休假申请" ON leave_requests
  FOR SELECT
  USING (
    employee_id = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'tenant_admin')
    )
  );

-- 创建策略：员工可以创建休假申请
CREATE POLICY "员工可以创建休假申请" ON leave_requests
  FOR INSERT
  WITH CHECK (
    employee_id = auth.uid()
    AND status = 'pending'
  );

-- 创建策略：员工可以撤销自己的待审批申请
CREATE POLICY "员工可以撤销自己的待审批申请" ON leave_requests
  FOR UPDATE
  USING (
    employee_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    status = 'cancelled'
  );

-- 创建策略：管理者可以审批本店铺的休假申请
CREATE POLICY "管理者可以审批本店铺的休假申请" ON leave_requests
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'tenant_admin')
    )
    AND status = 'pending'
  )
  WITH CHECK (
    status IN ('approved', 'rejected')
  );

-- ============================================
-- 3. 更新现有RLS策略中的角色判断
-- ============================================

-- 更新system_modules表的策略
DROP POLICY IF EXISTS "超级管理员可管理系统模块" ON system_modules;
CREATE POLICY "租户管理员可管理系统模块" ON system_modules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'tenant_admin'
    )
  );

-- 更新role_module_permissions表的策略
DROP POLICY IF EXISTS "超级管理员和租户管理员可管理角色权限" ON role_module_permissions;
CREATE POLICY "租户管理员可管理角色权限" ON role_module_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'tenant_admin'
    )
  );

-- 更新user_module_permissions表的策略
DROP POLICY IF EXISTS "管理员可查看所有用户权限" ON user_module_permissions;
DROP POLICY IF EXISTS "管理员可管理用户权限" ON user_module_permissions;

CREATE POLICY "管理者可查看所有用户权限" ON user_module_permissions
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'tenant_admin')
    )
  );

CREATE POLICY "管理者可管理用户权限" ON user_module_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'tenant_admin')
    )
  );

-- 更新positions表的策略
DROP POLICY IF EXISTS "管理员可管理本租户的岗位" ON positions;
CREATE POLICY "管理者可管理本租户的岗位" ON positions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'tenant_admin')
    )
  );

-- 更新position_module_permissions表的策略
DROP POLICY IF EXISTS "管理员可管理本租户的岗位权限" ON position_module_permissions;
CREATE POLICY "管理者可管理本租户的岗位权限" ON position_module_permissions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'tenant_admin')
    )
  );

-- 更新employee_positions表的策略
DROP POLICY IF EXISTS "管理员可管理本租户的员工岗位" ON employee_positions;
CREATE POLICY "管理者可管理本租户的员工岗位" ON employee_positions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'tenant_admin')
    )
  );

-- 更新store_organization表的策略
DROP POLICY IF EXISTS "管理员可管理本租户的组织架构" ON store_organization;
CREATE POLICY "管理者可管理本租户的组织架构" ON store_organization
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'tenant_admin')
    )
  );

-- 更新store_position_assignments表的策略
DROP POLICY IF EXISTS "管理员可管理本租户的人员分配" ON store_position_assignments;
CREATE POLICY "管理者可管理本租户的人员分配" ON store_position_assignments
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'tenant_admin')
    )
  );

-- 更新backup_position_config表的策略
DROP POLICY IF EXISTS "管理员可管理本租户的顶岗关系" ON backup_position_config;
CREATE POLICY "管理者可管理本租户的顶岗关系" ON backup_position_config
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('manager', 'tenant_admin')
    )
  );

-- ============================================
-- 4. 创建辅助函数
-- ============================================

-- 检查员工在指定日期是否有已批准的休假
CREATE OR REPLACE FUNCTION has_approved_leave(emp_id UUID, check_date DATE)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM leave_requests
    WHERE employee_id = emp_id
      AND leave_date = check_date
      AND status = 'approved'
  );
$$;

-- 获取员工在指定月份的所有已批准休假日期
CREATE OR REPLACE FUNCTION get_employee_approved_leaves(emp_id UUID, year INTEGER, month INTEGER)
RETURNS TABLE (leave_date DATE, leave_type TEXT) LANGUAGE sql STABLE AS $$
  SELECT leave_date, leave_type
  FROM leave_requests
  WHERE employee_id = emp_id
    AND EXTRACT(YEAR FROM leave_date) = year
    AND EXTRACT(MONTH FROM leave_date) = month
    AND status = 'approved'
  ORDER BY leave_date;
$$;

-- 获取店铺在指定日期的所有已批准休假
CREATE OR REPLACE FUNCTION get_store_approved_leaves(s_id UUID, check_date DATE)
RETURNS TABLE (
  employee_id UUID,
  leave_type TEXT,
  reason TEXT
) LANGUAGE sql STABLE AS $$
  SELECT employee_id, leave_type, reason
  FROM leave_requests
  WHERE store_id = s_id
    AND leave_date = check_date
    AND status = 'approved';
$$;

-- 统计店铺在指定月份的休假申请数量
CREATE OR REPLACE FUNCTION count_store_leave_requests(s_id UUID, year INTEGER, month INTEGER, req_status TEXT DEFAULT NULL)
RETURNS INTEGER LANGUAGE sql STABLE AS $$
  SELECT COUNT(*)::INTEGER
  FROM leave_requests
  WHERE store_id = s_id
    AND EXTRACT(YEAR FROM leave_date) = year
    AND EXTRACT(MONTH FROM leave_date) = month
    AND (req_status IS NULL OR status = req_status);
$$;
