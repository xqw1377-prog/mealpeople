/*
# 创建休假申请表

## 功能说明
1. 员工可以申请休假
2. 管理者可以审批休假申请
3. 休假与排班联动

## 表结构

### leave_requests 表
存储员工的休假申请记录。

字段说明：
- id: 主键
- tenant_id: 租户ID
- store_id: 店铺ID
- employee_id: 员工ID
- leave_type: 休假类型（annual_leave=年假, sick_leave=病假, personal_leave=事假, other=其他）
- start_date: 开始日期
- end_date: 结束日期
- days: 休假天数
- reason: 申请原因
- status: 审批状态（pending=待审批, approved=已同意, rejected=已拒绝, cancelled=已取消）
- reviewer_id: 审批人ID
- review_comment: 审批意见
- reviewed_at: 审批时间
- created_at: 创建时间
- updated_at: 更新时间

## 安全策略
1. 员工可以查看自己的休假申请
2. 员工可以创建休假申请
3. 员工可以取消自己的待审批申请
4. 管理者可以查看所有休假申请
5. 管理者可以审批休假申请

*/

-- ============================================
-- 1. 创建休假类型枚举
-- ============================================
DO $$ BEGIN
    CREATE TYPE leave_type AS ENUM ('annual_leave', 'sick_leave', 'personal_leave', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. 创建审批状态枚举
-- ============================================
DO $$ BEGIN
    CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. 创建休假申请表
-- ============================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days integer NOT NULL,
    reason text,
    status leave_status DEFAULT 'pending'::leave_status NOT NULL,
    reviewer_id uuid REFERENCES profiles(id),
    review_comment text,
    reviewed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_days CHECK (days > 0)
);

-- ============================================
-- 4. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_store ON leave_requests(store_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ============================================
-- 5. 启用RLS
-- ============================================
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. 创建RLS策略
-- ============================================

-- 员工可以查看自己的休假申请
CREATE POLICY "员工可查看自己的休假申请" ON leave_requests
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
    );

-- 员工可以创建休假申请
CREATE POLICY "员工可创建休假申请" ON leave_requests
    FOR INSERT WITH CHECK (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
    );

-- 员工可以取消自己的待审批申请
CREATE POLICY "员工可取消待审批申请" ON leave_requests
    FOR UPDATE USING (
        employee_id IN (
            SELECT id FROM employees WHERE user_id = auth.uid()
        )
        AND status = 'pending'::leave_status
    )
    WITH CHECK (
        status = 'cancelled'::leave_status
    );

-- 管理者可以查看所有休假申请
CREATE POLICY "管理者可查看所有休假申请" ON leave_requests
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- 管理者可以审批休假申请
CREATE POLICY "管理者可审批休假申请" ON leave_requests
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    )
    WITH CHECK (
        status IN ('approved'::leave_status, 'rejected'::leave_status)
    );

-- ============================================
-- 7. 创建更新时间触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leave_requests_updated_at ON leave_requests;
CREATE TRIGGER trigger_update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_leave_requests_updated_at();

-- ============================================
-- 8. 添加注释
-- ============================================
COMMENT ON TABLE leave_requests IS '员工休假申请表';
COMMENT ON COLUMN leave_requests.id IS '主键';
COMMENT ON COLUMN leave_requests.tenant_id IS '租户ID';
COMMENT ON COLUMN leave_requests.store_id IS '店铺ID';
COMMENT ON COLUMN leave_requests.employee_id IS '员工ID';
COMMENT ON COLUMN leave_requests.leave_type IS '休假类型：annual_leave=年假, sick_leave=病假, personal_leave=事假, other=其他';
COMMENT ON COLUMN leave_requests.start_date IS '开始日期';
COMMENT ON COLUMN leave_requests.end_date IS '结束日期';
COMMENT ON COLUMN leave_requests.days IS '休假天数';
COMMENT ON COLUMN leave_requests.reason IS '申请原因';
COMMENT ON COLUMN leave_requests.status IS '审批状态：pending=待审批, approved=已同意, rejected=已拒绝, cancelled=已取消';
COMMENT ON COLUMN leave_requests.reviewer_id IS '审批人ID';
COMMENT ON COLUMN leave_requests.review_comment IS '审批意见';
COMMENT ON COLUMN leave_requests.reviewed_at IS '审批时间';
COMMENT ON COLUMN leave_requests.created_at IS '创建时间';
COMMENT ON COLUMN leave_requests.updated_at IS '更新时间';
