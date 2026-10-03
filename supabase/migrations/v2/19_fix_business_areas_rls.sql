/*
# 修复经营区域管理表的RLS策略

## 问题描述
当前business_areas表的RLS策略只允许tenant_admin角色管理，
但实际上store_manager和super_admin也应该有管理权限，
以保持与其他配置表（min_revenue_positions、rest_day_rules）的一致性。

## 修改内容
1. 删除旧的RLS策略
2. 创建新的RLS策略，允许store_manager、tenant_admin和super_admin管理
3. 保持员工可查看的策略不变

## 影响范围
- business_areas表
- area_daily_status表
- area_positions表
- area_staff_assignments表
- area_attendance_overview表
*/

-- ============================================
-- 1. 修复 business_areas 表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "管理员可管理经营区域" ON business_areas;
DROP POLICY IF EXISTS "员工可查看经营区域" ON business_areas;
DROP POLICY IF EXISTS "管理者可管理经营区域" ON business_areas;
DROP POLICY IF EXISTS "租户成员可查看经营区域" ON business_areas;

-- 创建新策略：管理者可以管理（包括store_manager、tenant_admin、super_admin）
CREATE POLICY "管理者可管理经营区域" ON business_areas
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('store_manager', 'tenant_admin', 'super_admin')
        )
    );

-- 创建新策略：所有租户成员可以查看
CREATE POLICY "租户成员可查看经营区域" ON business_areas
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- ============================================
-- 2. 修复 area_daily_status 表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "管理员可管理区域状态" ON area_daily_status;
DROP POLICY IF EXISTS "员工可查看区域状态" ON area_daily_status;
DROP POLICY IF EXISTS "管理者可管理区域状态" ON area_daily_status;
DROP POLICY IF EXISTS "租户成员可查看区域状态" ON area_daily_status;

-- 创建新策略：管理者可以管理
CREATE POLICY "管理者可管理区域状态" ON area_daily_status
    FOR ALL USING (
        area_id IN (
            SELECT id FROM business_areas 
            WHERE tenant_id IN (
                SELECT tenant_id FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('store_manager', 'tenant_admin', 'super_admin')
            )
        )
    );

-- 创建新策略：租户成员可以查看
CREATE POLICY "租户成员可查看区域状态" ON area_daily_status
    FOR SELECT USING (
        area_id IN (
            SELECT id FROM business_areas 
            WHERE tenant_id IN (
                SELECT tenant_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- ============================================
-- 3. 修复 area_positions 表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "管理员可管理区域岗位" ON area_positions;
DROP POLICY IF EXISTS "员工可查看区域岗位" ON area_positions;
DROP POLICY IF EXISTS "管理者可管理区域岗位" ON area_positions;
DROP POLICY IF EXISTS "租户成员可查看区域岗位" ON area_positions;

-- 创建新策略：管理者可以管理
CREATE POLICY "管理者可管理区域岗位" ON area_positions
    FOR ALL USING (
        area_id IN (
            SELECT id FROM business_areas 
            WHERE tenant_id IN (
                SELECT tenant_id FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('store_manager', 'tenant_admin', 'super_admin')
            )
        )
    );

-- 创建新策略：租户成员可以查看
CREATE POLICY "租户成员可查看区域岗位" ON area_positions
    FOR SELECT USING (
        area_id IN (
            SELECT id FROM business_areas 
            WHERE tenant_id IN (
                SELECT tenant_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- ============================================
-- 4. 修复 area_staff_assignments 表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "管理员可管理员工分配" ON area_staff_assignments;
DROP POLICY IF EXISTS "员工可查看员工分配" ON area_staff_assignments;
DROP POLICY IF EXISTS "管理者可管理员工分配" ON area_staff_assignments;
DROP POLICY IF EXISTS "租户成员可查看员工分配" ON area_staff_assignments;

-- 创建新策略：管理者可以管理
CREATE POLICY "管理者可管理员工分配" ON area_staff_assignments
    FOR ALL USING (
        area_id IN (
            SELECT id FROM business_areas 
            WHERE tenant_id IN (
                SELECT tenant_id FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('store_manager', 'tenant_admin', 'super_admin')
            )
        )
    );

-- 创建新策略：租户成员可以查看
CREATE POLICY "租户成员可查看员工分配" ON area_staff_assignments
    FOR SELECT USING (
        area_id IN (
            SELECT id FROM business_areas 
            WHERE tenant_id IN (
                SELECT tenant_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- ============================================
-- 5. 修复 area_attendance_overview 表的RLS策略
-- ============================================

-- 删除旧策略
DROP POLICY IF EXISTS "管理员可管理考勤概览" ON area_attendance_overview;
DROP POLICY IF EXISTS "员工可查看考勤概览" ON area_attendance_overview;
DROP POLICY IF EXISTS "管理者可管理考勤概览" ON area_attendance_overview;
DROP POLICY IF EXISTS "租户成员可查看考勤概览" ON area_attendance_overview;

-- 创建新策略：管理者可以管理
CREATE POLICY "管理者可管理考勤概览" ON area_attendance_overview
    FOR ALL USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE tenant_id IN (
                SELECT tenant_id FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('store_manager', 'tenant_admin', 'super_admin')
            )
        )
    );

-- 创建新策略：租户成员可以查看
CREATE POLICY "租户成员可查看考勤概览" ON area_attendance_overview
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM stores 
            WHERE tenant_id IN (
                SELECT tenant_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- ============================================
-- 6. 添加说明注释
-- ============================================

COMMENT ON POLICY "管理者可管理经营区域" ON business_areas IS '管理者（店经理、租户管理员、超级管理员）可以创建、更新、删除经营区域';
COMMENT ON POLICY "租户成员可查看经营区域" ON business_areas IS '所有租户成员都可以查看经营区域';

COMMENT ON POLICY "管理者可管理区域状态" ON area_daily_status IS '管理者可以管理区域每日状态';
COMMENT ON POLICY "租户成员可查看区域状态" ON area_daily_status IS '租户成员可以查看区域每日状态';

COMMENT ON POLICY "管理者可管理区域岗位" ON area_positions IS '管理者可以管理区域岗位配置';
COMMENT ON POLICY "租户成员可查看区域岗位" ON area_positions IS '租户成员可以查看区域岗位配置';

COMMENT ON POLICY "管理者可管理员工分配" ON area_staff_assignments IS '管理者可以管理员工分配';
COMMENT ON POLICY "租户成员可查看员工分配" ON area_staff_assignments IS '租户成员可以查看员工分配';

COMMENT ON POLICY "管理者可管理考勤概览" ON area_attendance_overview IS '管理者可以管理考勤概览';
COMMENT ON POLICY "租户成员可查看考勤概览" ON area_attendance_overview IS '租户成员可以查看考勤概览';
