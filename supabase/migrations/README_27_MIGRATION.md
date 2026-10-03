# 27号迁移文件执行说明

## 📌 快速开始

27号迁移已拆分为两个文件，**必须按顺序执行**：

### 1️⃣ 第一步：添加枚举值
```bash
# 执行文件：27_add_guest_role_part1.sql
# 功能：添加 guest 角色和 is_demo 字段
```

### 2️⃣ 第二步：创建测试数据
```bash
# 执行文件：27_add_guest_role_part2.sql
# 功能：创建测试餐厅、门店、员工和效能标准
```

## ⚠️ 为什么要分两步？

PostgreSQL不允许在同一事务中添加并使用新的枚举值，会报错：
```
unsafe use of new value "guest" of enum type user_role
```

## 📖 详细文档

- **完整执行指南**：[EXECUTE_27_MIGRATION.md](./EXECUTE_27_MIGRATION.md)
- **快速修复指南**：[/QUICK_FIX_GUIDE.md](../../QUICK_FIX_GUIDE.md)

## 🚀 一键执行（Supabase Dashboard）

### 步骤1
1. 打开 SQL Editor
2. 复制 `27_add_guest_role_part1.sql` 内容
3. 点击 Run
4. ✅ 等待成功

### 步骤2
1. 复制 `27_add_guest_role_part2.sql` 内容
2. 点击 Run
3. ✅ 等待成功

## ✔️ 验证

```sql
-- 验证 guest 角色
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- 验证测试餐厅
SELECT name, is_demo FROM tenants WHERE is_demo = true;

-- 验证测试门店
SELECT COUNT(*) FROM stores 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
-- 应该返回: 3

-- 验证测试员工
SELECT COUNT(*) FROM employees 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
-- 应该返回: 20
```

## 📝 文件说明

| 文件 | 状态 | 说明 |
|------|------|------|
| `27_add_guest_role_part1.sql` | ✅ 使用 | 第一步：添加枚举值 |
| `27_add_guest_role_part2.sql` | ✅ 使用 | 第二步：创建数据 |
| `27_add_guest_role_and_demo_tenant.sql.deprecated` | ❌ 废弃 | 原始文件（不要使用） |

## 🆘 遇到问题？

查看详细文档：
- [EXECUTE_27_MIGRATION.md](./EXECUTE_27_MIGRATION.md) - 完整执行指南
- [QUICK_FIX_GUIDE.md](../../QUICK_FIX_GUIDE.md) - 快速修复指南

---

**版本**：develop/v2.0  
**最后更新**：2025-11-12
