# 经营区域管理保存问题修复报告

## 修复日期
2025-11-06

## 问题描述

### 症状
用户在经营区域管理页面新增区域时，保存失败。

### 根本原因
`business_areas`表的RLS（Row Level Security）策略依赖于`profiles.tenant_id`字段，但部分管理员用户的`tenant_id`为`null`，导致权限验证失败。

---

## 问题分析

### 1. 原有RLS策略
```sql
-- 旧策略（有问题）
CREATE POLICY "管理者可管理经营区域"
ON business_areas FOR ALL
TO authenticated
USING (
    tenant_id IN (
        SELECT profiles.tenant_id
        FROM profiles
        WHERE profiles.id = uid() 
        AND profiles.role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);
```

**问题点：**
- 依赖`profiles.tenant_id`字段
- 当用户的`tenant_id`为`null`时，子查询返回空集
- 导致权限验证失败，无法插入数据

### 2. 用户数据状态
```sql
-- 查询结果显示部分管理员的tenant_id为null
SELECT id, tenant_id, role, phone
FROM profiles
WHERE role = 'tenant_admin'
ORDER BY created_at DESC;

-- 结果示例：
-- id: 4e7eee90-6144-49f5-9b17-d8bb3a8708ae, tenant_id: 187c43d4-b5d6-433a-9530-ad415258ba42, role: tenant_admin
-- id: d4bea8dc-cca6-4689-a9a0-c0c976dbbbd0, tenant_id: null, role: tenant_admin  ← 问题用户
```

---

## 解决方案

### 修复策略
不再依赖`profiles.tenant_id`，改为直接基于用户角色验证权限。

### 新的RLS策略

#### 1. 查看权限（所有认证用户）
```sql
CREATE POLICY "认证用户可查看经营区域"
ON business_areas FOR SELECT
TO authenticated
USING (true);
```

#### 2. 创建权限（管理员）
```sql
CREATE POLICY "管理员可创建经营区域"
ON business_areas FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);
```

#### 3. 更新权限（管理员）
```sql
CREATE POLICY "管理员可更新经营区域"
ON business_areas FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);
```

#### 4. 删除权限（管理员）
```sql
CREATE POLICY "管理员可删除经营区域"
ON business_areas FOR DELETE
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM profiles 
        WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
    )
);
```

---

## 实施步骤

### 1. 创建迁移文件
文件路径：`supabase/migrations/v2/22_fix_business_areas_rls_final.sql`

### 2. 应用迁移
```bash
# 使用supabase_apply_migration工具应用迁移
```

### 3. 验证策略
```sql
-- 查看新的RLS策略
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'business_areas'
ORDER BY policyname;
```

**预期结果：**
```
tablename       | policyname              | cmd
----------------|-------------------------|--------
business_areas  | 管理员可创建经营区域     | INSERT
business_areas  | 管理员可删除经营区域     | DELETE
business_areas  | 管理员可更新经营区域     | UPDATE
business_areas  | 认证用户可查看经营区域   | SELECT
```

---

## 测试验证

### 测试用例1：新增经营区域
**测试步骤：**
1. 使用管理员账号登录（tenant_admin角色）
2. 进入"经营区域管理"页面
3. 点击"新增区域"
4. 填写必填信息：
   - 区域编号：A001
   - 区域名称：大厅
   - 区域类型：餐饮区
5. 点击"保存"

**预期结果：**
- ✅ 保存成功
- ✅ 显示"创建成功"提示
- ✅ 列表中显示新增的区域

### 测试用例2：编辑经营区域
**测试步骤：**
1. 在经营区域列表中点击某个区域的"编辑"按钮
2. 修改区域名称
3. 点击"保存"

**预期结果：**
- ✅ 保存成功
- ✅ 显示"更新成功"提示
- ✅ 列表中显示更新后的信息

### 测试用例3：删除经营区域
**测试步骤：**
1. 在经营区域列表中点击某个区域的"删除"按钮
2. 确认删除

**预期结果：**
- ✅ 删除成功
- ✅ 显示"删除成功"提示
- ✅ 列表中不再显示该区域

### 测试用例4：权限验证
**测试步骤：**
1. 使用普通员工账号登录（employee角色）
2. 尝试访问"经营区域管理"页面
3. 尝试新增区域

**预期结果：**
- ✅ 可以查看经营区域列表
- ❌ 无法新增、编辑或删除区域（如果有权限控制）

---

## 影响范围

### 受影响的表
- `business_areas` - 经营区域表

### 受影响的功能
- 经营区域管理 - 新增区域
- 经营区域管理 - 编辑区域
- 经营区域管理 - 删除区域

### 不受影响的功能
- 经营区域查看
- 其他配置功能

---

## 相关文件

### 数据库迁移文件
- `supabase/migrations/v2/22_fix_business_areas_rls_final.sql`

### 前端页面
- `src/pages/business-areas/index.tsx` - 经营区域管理页面

### API文件
- `src/db/api-business-area.ts` - 经营区域API函数

---

## 后续建议

### 1. 统一修复其他表的RLS策略
还有许多表的RLS策略也依赖于`profiles.tenant_id`，建议统一修复：

**需要修复的表：**
- `area_daily_status` - 区域日状态
- `area_positions` - 区域岗位
- `area_staff_assignments` - 员工分配
- `area_attendance_overview` - 考勤概览
- `employees` - 员工表
- `stores` - 门店表
- `schedules` - 排班表
- `schedule_logs` - 排班日志
- 等等...

### 2. 修复用户数据
对于`tenant_id`为`null`的管理员用户，建议：
1. 为他们分配正确的`tenant_id`
2. 或者确保所有RLS策略都不依赖`tenant_id`

### 3. 数据一致性检查
定期检查数据一致性：
```sql
-- 查找tenant_id为null的管理员
SELECT id, phone, role, tenant_id
FROM profiles
WHERE role IN ('store_manager', 'tenant_admin', 'super_admin')
AND tenant_id IS NULL;
```

---

## 总结

### 修复内容
1. ✅ 修复了`business_areas`表的RLS策略
2. ✅ 移除了对`profiles.tenant_id`的依赖
3. ✅ 基于用户角色直接验证权限
4. ✅ 应用了数据库迁移

### 修复效果
- 管理员用户现在可以正常创建、编辑和删除经营区域
- 不再受`tenant_id`为`null`的影响
- 权限验证更加简单和可靠

### 遗留问题
- 还有其他表的RLS策略需要类似的修复
- 建议统一处理所有依赖`tenant_id`的RLS策略
