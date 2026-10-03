# 修复说明：27号迁移文件

## 问题描述
执行 `27_add_guest_role_and_demo_tenant.sql` 时报错：
```
column "revenue_per_person" of relation "efficiency_standards" does not exist LINE 148
```

## 问题原因
`efficiency_standards` 表中没有 `revenue_per_person` 字段。该表使用的是以下字段结构：
- `low_efficiency_standard` - 低营收区效能标准
- `normal_efficiency_standard` - 正常营收区效能标准
- `high_efficiency_standard` - 高营收区效能标准

## 修复内容
已将 INSERT 语句修改为使用正确的字段名称，包括：
- 低营收区配置：`low_revenue_max`, `low_efficiency_standard`, `low_management_motto`
- 正常营收区配置：`normal_revenue_min`, `normal_revenue_max`, `normal_efficiency_standard`, `normal_management_motto`
- 高营收区配置：`high_revenue_min`, `high_efficiency_standard`, `high_management_motto`

## 如何重新执行

### 方法1：使用 Supabase CLI（推荐）
```bash
# 如果之前执行失败，先回滚
supabase migration repair --status reverted 27_add_guest_role_and_demo_tenant

# 重新执行迁移
supabase db push
```

### 方法2：直接在 Supabase Dashboard 执行
1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制 `27_add_guest_role_and_demo_tenant.sql` 的内容
4. 执行 SQL

### 方法3：使用 psql 命令行
```bash
psql -h your-project.supabase.co -U postgres -d postgres -f supabase/migrations/27_add_guest_role_and_demo_tenant.sql
```

## 验证修复
执行以下 SQL 验证数据是否正确插入：

```sql
-- 查看效能标准数据
SELECT 
  id,
  tenant_id,
  store_id,
  low_efficiency_standard,
  normal_efficiency_standard,
  high_efficiency_standard
FROM efficiency_standards
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
```

应该看到3条记录，每条记录都有完整的效能标准配置。

## 相关文件
- 修复文件：`supabase/migrations/27_add_guest_role_and_demo_tenant.sql`
- 表结构定义：`supabase/migrations/03_efficiency_standards_and_operations.sql`
- Git提交：`f7d4991`

## 注意事项
- 此修复已提交到 Git 仓库
- 如果您已经手动修改了数据库，请确保数据一致性
- 建议在测试环境先验证后再应用到生产环境
