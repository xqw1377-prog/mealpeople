# 🔧 快速修复指南：数据库迁移文件

## ⚠️ 最新修复（2025-11-12）

### 问题6：09号迁移（员工权限系统）- employees 表 role 字段不存在

**错误信息**：
```
ERROR: 42703: column e.role does not exist
```

**原因**：
- 使用了不存在的字段 `e.role`
- `employees` 表中没有 `role` 字段
- 角色信息存储在 `profiles` 表中

**修复状态**：✅ 已完成（提交：82482bf）

**解决方案**：
- 通过 `JOIN profiles` 表获取用户角色
- 将 `e.role = 'admin'` 替换为 `p.role IN ('tenant_admin', 'store_manager')`
- 保持权限检查逻辑的完整性
- 修复了2条RLS策略：
  - 员工权限表（1条）
  - 岗位权限模板表（1条）

---

### 问题5：08号迁移（智能排班系统）- tenant_users 表不存在

**错误信息**：
```
ERROR: 42P01: relation "tenant_users" does not exist
```

**原因**：使用了不存在的表 `tenant_users`，实际架构使用 `profiles` 表管理用户和租户关系

**修复状态**：✅ 已完成（提交：c6e2590）

**解决方案**：
- 将所有 `tenant_users` 引用替换为 `profiles`
- 将 `user_id` 字段替换为 `id`（profiles表的主键）
- 保持角色检查逻辑不变（tenant_admin, store_manager, employee）
- 修复了8条RLS策略：
  - 排班日历表（2条）
  - 每日排班明细表（2条）
  - 员工排班明细表（1条）
  - 排班调整记录表（2条）
  - 员工月度排班表（1条）

---

### 问题4：07号迁移 - tenant_users 表不存在

**错误信息**：
```
ERROR: 42P01: relation "tenant_users" does not exist
```

**原因**：使用了不存在的表 `tenant_users`，实际架构使用 `profiles` 表管理用户和租户关系

**修复状态**：✅ 已完成（提交：73c1e56）

**解决方案**：
- 将所有 `tenant_users` 引用替换为 `profiles`
- 将 `user_id` 字段替换为 `id`（profiles表的主键）
- 保持角色检查逻辑不变（tenant_admin, store_manager, employee）
- 修复了8条RLS策略：
  - 营收日历表（2条）
  - 每日营收明细表（2条）
  - 营收调整记录表（2条）
  - 影响因子配置表（2条）

---

### 问题3：08号迁移 - efficiency_standards 表字段错误

**错误信息**：
```
ERROR: 42703: column "min_revenue" of relation "efficiency_standards" does not exist
```

**原因**：使用了不存在的字段 `min_revenue`, `max_revenue`, `recommended_employees`, `notes`

**修复状态**：✅ 已完成（提交：29c2323）

**解决方案**：
- 使用正确的三区间字段结构：
  - 低营收区：`low_revenue_max`, `low_efficiency_standard`, `low_management_motto`
  - 正常营收区：`normal_revenue_min`, `normal_revenue_max`, `normal_efficiency_standard`, `normal_management_motto`
  - 高营收区：`high_revenue_min`, `high_efficiency_standard`, `high_management_motto`
- 为每个门店创建独立的效能标准配置

---

### 问题2：08号迁移 - schedule_logs 表字段错误

**错误信息**：
```
ERROR: 42703: column "date" of relation "schedule_logs" does not exist
```

**原因**：
- 使用了不存在的字段 `date`（实际字段名是 `log_date`）
- 缺少必需的 `schedule_id` 字段

**修复状态**：✅ 已完成（提交：6f9ba67）

**解决方案**：
- 先创建 `schedules` 记录，获取 `schedule_id`
- 使用正确的字段名 `log_date` 替代 `date`
- 添加所有必需字段并正确映射数据

---

### 问题1：27号迁移 - 枚举类型使用错误

**错误信息**：
```
unsafe use of new value "guest" of enum type user_role
HINT: New enum values must be committed before they can be used.
```

**修复状态**：✅ 已完成（已拆分为两个文件）

---

## 历史问题（已解决）

**之前的错误**：
```
column "revenue_per_person" of relation "efficiency_standards" does not exist LINE 148
```

**修复状态**：✅ 已完成

## 📝 修复内容

已将 `27_add_guest_role_and_demo_tenant.sql` 文件中的字段名称修正为：

| 原字段（错误） | 新字段（正确） |
|--------------|--------------|
| `revenue_per_person` | `low_efficiency_standard`<br>`normal_efficiency_standard`<br>`high_efficiency_standard` |

## 🚀 立即执行（必须分两步）

### ⚠️ 重要：必须按顺序执行两个文件

由于PostgreSQL枚举类型限制，必须分两步执行：

#### 第一步：添加枚举值

**文件**：`27_add_guest_role_part1.sql`

**Supabase Dashboard**：
1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 点击左侧菜单 **SQL Editor**
4. 复制文件内容：`supabase/migrations/27_add_guest_role_part1.sql`
5. 粘贴到编辑器
6. 点击 **Run** 按钮
7. ✅ 等待执行成功

**命令行**：
```bash
cd /workspace/app-7daop8q0sxdt
psql -h your-project.supabase.co -U postgres -d postgres \
     -f supabase/migrations/27_add_guest_role_part1.sql
```

#### 第二步：创建测试数据

**⚠️ 必须在第一步成功后才能执行！**

**文件**：`27_add_guest_role_part2.sql`

**Supabase Dashboard**：
1. 在 **SQL Editor** 中
2. 复制文件内容：`supabase/migrations/27_add_guest_role_part2.sql`
3. 粘贴到编辑器
4. 点击 **Run** 按钮
5. ✅ 等待执行成功

**命令行**：
```bash
psql -h your-project.supabase.co -U postgres -d postgres \
     -f supabase/migrations/27_add_guest_role_part2.sql
```

### 一键执行脚本（推荐）

```bash
#!/bin/bash
DB_HOST="your-project.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"

echo "🔄 步骤1: 添加枚举值..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
     -f supabase/migrations/27_add_guest_role_part1.sql

if [ $? -eq 0 ]; then
    echo "✅ 步骤1完成"
    sleep 1
    echo "🔄 步骤2: 创建测试数据..."
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
         -f supabase/migrations/27_add_guest_role_part2.sql
    
    if [ $? -eq 0 ]; then
        echo "🎉 迁移执行成功！"
    else
        echo "❌ 步骤2失败"
        exit 1
    fi
else
    echo "❌ 步骤1失败"
    exit 1
fi
```

## ✔️ 验证修复

### 验证第一步（枚举值）

```sql
-- 验证 guest 角色已添加
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumlabel;
-- 应该看到: admin, guest, tenant_admin, user

-- 验证 is_demo 字段已添加
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'tenants' AND column_name = 'is_demo';
-- 应该看到: is_demo | boolean | false
```

### 验证第二步（测试数据）

```sql
-- 查看测试餐厅
SELECT id, name, is_demo 
FROM tenants 
WHERE is_demo = true;
-- 应该看到: 测试餐厅

-- 查看测试门店
SELECT id, name 
FROM stores 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
-- 应该看到: 朝阳店, 海淀店, 西城店

-- 查看测试员工数量
SELECT COUNT(*) as employee_count
FROM employees 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
-- 应该看到: 20

-- 查看效能标准数据
SELECT 
  id,
  tenant_id,
  store_id,
  low_efficiency_standard,
  normal_efficiency_standard,
  high_efficiency_standard
FROM efficiency_standards
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 3;
```

**预期结果**：
- 3条效能标准记录
- `low_efficiency_standard`: 700.00
- `normal_efficiency_standard`: 850.00
- `high_efficiency_standard`: 1000.00

## 📚 相关文档

- **详细执行指南**：`supabase/migrations/EXECUTE_27_MIGRATION.md`（推荐阅读）
- 第一部分SQL：`supabase/migrations/27_add_guest_role_part1.sql`
- 第二部分SQL：`supabase/migrations/27_add_guest_role_part2.sql`
- 原始文件（已废弃）：`supabase/migrations/27_add_guest_role_and_demo_tenant.sql.deprecated`
- 表结构定义：`supabase/migrations/03_efficiency_standards_and_operations.sql`
- Git提交记录：`f7d4991`, `4b68f6f`, `c0b4c68`

## 💡 提示

- ✅ 修复已提交到Git仓库
- ✅ 必须按顺序执行两个文件
- ✅ 可以重复执行（使用了ON CONFLICT处理）
- ⚠️ 不要使用原始的 `.deprecated` 文件
- ⚠️ 建议先在测试环境验证

## 🆘 常见问题

### Q1: 为什么要拆分成两个文件？
**A**: PostgreSQL的枚举类型限制，新添加的枚举值必须在事务提交后才能使用。

### Q2: 可以跳过第一步直接执行第二步吗？
**A**: 不可以。如果 `guest` 角色不存在，第二步会报错。

### Q3: 如果第一步已经执行过了，可以直接执行第二步吗？
**A**: 可以。第一步使用了检查逻辑，重复执行不会报错。

### Q4: 执行失败怎么办？
**A**: 
- 检查错误信息
- 确保第一步已成功执行
- 查看 `EXECUTE_27_MIGRATION.md` 获取详细帮助
- 如果是数据冲突，可以先删除冲突数据再重试

---

**最后更新**：2025-11-12  
**版本**：develop/v2.0  
**修复提交**：
- f7d4991 - 修复27号迁移：字段名称错误
- 4b68f6f - 添加修复说明文档
- a48bed4 - 添加快速修复指南
- c0b4c68 - 修复枚举类型问题（拆分为两个文件）
- 6f9ba67 - 修复08号迁移：schedule_logs表字段错误
- 29c2323 - 修复08号迁移：efficiency_standards表字段错误
- 73c1e56 - 修复07号迁移：tenant_users表不存在错误
- c6e2590 - 修复08号迁移（智能排班系统）：tenant_users表不存在错误
- 82482bf - 修复09号迁移（员工权限系统）：employees表role字段不存在错误
