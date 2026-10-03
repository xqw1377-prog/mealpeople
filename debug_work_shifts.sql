-- 调试工作班次权限问题
-- 请在Supabase SQL编辑器中以登录用户身份执行

-- 1. 查看当前用户信息
SELECT 
    '当前用户信息' as 检查项,
    auth.uid() as 用户ID,
    auth.email() as 邮箱;

-- 2. 查看profiles表中的用户信息
SELECT 
    'profiles表信息' as 检查项,
    id as 用户ID,
    phone as 手机号,
    email as 邮箱,
    role as 角色,
    tenant_id as 租户ID,
    created_at as 创建时间
FROM profiles 
WHERE id = auth.uid();

-- 3. 查看tenant_members表中的用户信息
SELECT 
    'tenant_members表信息' as 检查项,
    user_id as 用户ID,
    tenant_id as 租户ID,
    role as 角色,
    joined_at as 加入时间
FROM tenant_members 
WHERE user_id = auth.uid();

-- 4. 测试权限检查函数
SELECT 
    '权限检查函数测试' as 检查项,
    tenant_id,
    is_tenant_admin_or_manager(auth.uid(), tenant_id) as 是否有管理权限
FROM tenants
WHERE id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
    UNION
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
);

-- 5. 查看现有的工作班次
SELECT 
    '现有工作班次' as 检查项,
    id,
    tenant_id as 租户ID,
    shift_name as 班次名称,
    start_time as 开始时间,
    end_time as 结束时间,
    work_hours as 工作小时数,
    time_periods as 时间段配置,
    is_active as 是否启用
FROM work_shifts
WHERE tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
    UNION
    SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
)
ORDER BY shift_order;

-- 6. 测试插入权限（不实际插入）
SELECT 
    '插入权限测试' as 检查项,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('tenant_admin', 'store_manager')
        ) THEN 'profiles表中有权限'
        WHEN EXISTS (
            SELECT 1 FROM tenant_members 
            WHERE user_id = auth.uid() 
            AND role IN ('tenant_admin', 'store_manager')
        ) THEN 'tenant_members表中有权限'
        ELSE '无权限'
    END as 权限状态;

-- 7. 查看work_shifts表的RLS策略
SELECT 
    'RLS策略信息' as 检查项,
    schemaname as 模式名,
    tablename as 表名,
    policyname as 策略名,
    permissive as 是否宽松,
    roles as 角色,
    cmd as 命令类型,
    qual as 使用条件,
    with_check as 检查条件
FROM pg_policies 
WHERE tablename = 'work_shifts';
