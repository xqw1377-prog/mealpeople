# 🔧 27号迁移文件执行指南

## ⚠️ 重要说明

由于PostgreSQL的枚举类型限制，**必须分两步执行**此迁移：

### 问题原因
PostgreSQL要求在添加新的枚举值后，必须先提交事务，才能在后续操作中使用该新值。如果在同一个事务中添加并使用新枚举值，会报错：
```
unsafe use of new value "guest" of enum type user_role
HINT: New enum values must be committed before they can be used.
```

### 解决方案
将原来的 `27_add_guest_role_and_demo_tenant.sql` 拆分为两个文件：
- **Part 1**: 添加枚举值和表结构修改
- **Part 2**: 使用新枚举值创建数据

---

## 📋 执行步骤

### 步骤1：执行第一部分（添加枚举值）

**文件**: `27_add_guest_role_part1.sql`

**内容**:
- 添加 `guest` 角色到 `user_role` 枚举类型
- 添加 `is_demo` 字段到 `tenants` 表

**执行方法**:

#### 方法A：Supabase Dashboard
1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 点击 **SQL Editor**
4. 复制 `27_add_guest_role_part1.sql` 的内容
5. 粘贴并点击 **Run**
6. ✅ 等待执行成功

#### 方法B：Supabase CLI
```bash
cd /workspace/app-7daop8q0sxdt
supabase db push --file supabase/migrations/27_add_guest_role_part1.sql
```

#### 方法C：psql命令行
```bash
psql -h your-project.supabase.co -U postgres -d postgres \
     -f supabase/migrations/27_add_guest_role_part1.sql
```

### 步骤2：验证第一部分执行成功

执行以下SQL验证：

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

### 步骤3：执行第二部分（创建测试数据）

**⚠️ 重要**: 必须在步骤1成功后才能执行此步骤！

**文件**: `27_add_guest_role_part2.sql`

**内容**:
- 创建测试餐厅（is_demo = true）
- 创建3个测试门店
- 创建20个测试员工
- 创建效能标准配置
- 设置RLS策略

**执行方法**:

#### 方法A：Supabase Dashboard
1. 在 **SQL Editor** 中
2. 复制 `27_add_guest_role_part2.sql` 的内容
3. 粘贴并点击 **Run**
4. ✅ 等待执行成功

#### 方法B：Supabase CLI
```bash
supabase db push --file supabase/migrations/27_add_guest_role_part2.sql
```

#### 方法C：psql命令行
```bash
psql -h your-project.supabase.co -U postgres -d postgres \
     -f supabase/migrations/27_add_guest_role_part2.sql
```

### 步骤4：验证第二部分执行成功

执行以下SQL验证：

```sql
-- 验证测试餐厅已创建
SELECT id, name, is_demo 
FROM tenants 
WHERE is_demo = true;

-- 应该看到: 测试餐厅

-- 验证测试门店已创建
SELECT id, name, tenant_id 
FROM stores 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- 应该看到: 朝阳店, 海淀店, 西城店

-- 验证测试员工已创建
SELECT COUNT(*) as employee_count
FROM employees 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- 应该看到: 20

-- 验证效能标准已创建
SELECT COUNT(*) as standard_count
FROM efficiency_standards 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- 应该看到: 3
```

---

## ✅ 完整执行脚本（推荐）

如果您使用命令行，可以使用以下脚本一次性执行：

```bash
#!/bin/bash

# 设置数据库连接信息
DB_HOST="your-project.supabase.co"
DB_USER="postgres"
DB_NAME="postgres"

echo "📝 开始执行27号迁移..."

# 步骤1：执行第一部分
echo "🔄 步骤1: 添加枚举值..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
     -f supabase/migrations/27_add_guest_role_part1.sql

if [ $? -eq 0 ]; then
    echo "✅ 步骤1完成"
else
    echo "❌ 步骤1失败，请检查错误信息"
    exit 1
fi

# 等待1秒确保事务提交
sleep 1

# 步骤2：执行第二部分
echo "🔄 步骤2: 创建测试数据..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME \
     -f supabase/migrations/27_add_guest_role_part2.sql

if [ $? -eq 0 ]; then
    echo "✅ 步骤2完成"
    echo "🎉 27号迁移执行成功！"
else
    echo "❌ 步骤2失败，请检查错误信息"
    exit 1
fi
```

---

## 🔄 回滚操作

如果需要回滚此迁移：

```sql
-- 删除测试数据
DELETE FROM efficiency_standards WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM employees WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM stores WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001';

-- 删除 is_demo 字段
ALTER TABLE tenants DROP COLUMN IF EXISTS is_demo;

-- 注意：无法删除已添加的枚举值 'guest'
-- PostgreSQL不支持删除枚举值，只能重建整个枚举类型
```

---

## 📚 相关文件

- `27_add_guest_role_part1.sql` - 第一部分：添加枚举值
- `27_add_guest_role_part2.sql` - 第二部分：创建测试数据
- `27_add_guest_role_and_demo_tenant.sql` - 原始文件（已废弃，不要使用）
- `FIX_27_MIGRATION.md` - 之前的修复说明
- `EXECUTE_27_MIGRATION.md` - 本文档

---

## 🆘 常见问题

### Q1: 为什么不能在一个文件中执行？
**A**: PostgreSQL的枚举类型限制，新添加的枚举值必须在事务提交后才能使用。

### Q2: 如果第一部分执行失败怎么办？
**A**: 检查错误信息，通常是因为枚举值已存在。可以忽略此错误继续执行第二部分。

### Q3: 如果第二部分执行失败怎么办？
**A**: 检查错误信息，确保第一部分已成功执行。如果是数据冲突，可以先删除冲突数据再重试。

### Q4: 可以重复执行吗？
**A**: 可以。两个文件都使用了 `ON CONFLICT` 处理，重复执行不会报错。

---

**最后更新**: 2025-11-12  
**版本**: develop/v2.0
