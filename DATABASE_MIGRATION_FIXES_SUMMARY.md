# 📊 数据库迁移文件修复总结

## 🎯 修复概览

**修复日期**：2025-11-12  
**分支**：develop/v2.0  
**修复文件数量**：5个迁移文件  
**修复问题数量**：5个主要问题  
**提交数量**：8个提交  

---

## ✅ 已修复问题列表

### 1. 枚举类型使用错误（27号迁移）

**文件**：`supabase/migrations/27_add_guest_role_and_demo_tenant.sql`

**问题**：
```
ERROR: unsafe use of new value "guest" of enum type user_role
HINT: New enum values must be committed before they can be used.
```

**原因**：PostgreSQL 不允许在同一事务中添加枚举值并立即使用

**解决方案**：
- 将迁移文件拆分为两部分：
  - `27_add_guest_role_part1.sql`：添加枚举值
  - `27_add_guest_role_part2.sql`：使用新枚举值创建数据
- 创建详细的执行指南：`supabase/migrations/EXECUTE_27_MIGRATION.md`

**提交**：
- c0b4c68 - 修复枚举类型问题（拆分为两个文件）
- 4057371 - 更新快速修复指南：添加枚举类型问题的解决方案
- e53a058 - 添加27号迁移文件简明执行说明

---

### 2. schedule_logs 表字段错误（08号迁移 - 演示数据）

**文件**：`supabase/migrations/08_generate_demo_data.sql`

**问题**：
```
ERROR: 42703: column "date" of relation "schedule_logs" does not exist
```

**原因**：
- 使用了不存在的字段 `date`（实际字段名是 `log_date`）
- 缺少必需的 `schedule_id` 字段

**解决方案**：
- 先创建 `schedules` 记录，获取 `schedule_id`
- 使用正确的字段名 `log_date` 替代 `date`
- 添加所有必需字段并正确映射数据：
  - `schedule_id`：从 schedules 表获取
  - `log_date`：排班日期
  - `employee_id`：员工ID
  - `shift_type`：班次类型
  - `status`：状态
  - `quality_score`：质量分数（从质量等级转换）
  - `work_duration`：工作时长（小时转分钟）
  - `notes`：备注

**提交**：
- 6f9ba67 - 修复08号迁移文件：schedule_logs表字段错误

---

### 3. efficiency_standards 表字段错误（08号迁移 - 演示数据）

**文件**：`supabase/migrations/08_generate_demo_data.sql`

**问题**：
```
ERROR: 42703: column "min_revenue" of relation "efficiency_standards" does not exist
```

**原因**：使用了不存在的字段 `min_revenue`, `max_revenue`, `recommended_employees`, `notes`

**解决方案**：
- 使用正确的三区间字段结构：
  - **低营收区**：`low_revenue_max`, `low_efficiency_standard`, `low_management_motto`
  - **正常营收区**：`normal_revenue_min`, `normal_revenue_max`, `normal_efficiency_standard`, `normal_management_motto`
  - **高营收区**：`high_revenue_min`, `high_efficiency_standard`, `high_management_motto`
- 为每个门店创建独立的效能标准配置（3个门店 = 3条记录）
- 使用合理的默认值：
  - 低营收区：≤10000元，效能标准700，"严控成本，生存第一"
  - 正常营收区：10000-18000元，效能标准850，"精益运营，效率为王"
  - 高营收区：≥18000元，效能标准1000，"保障效能，利润冲刺"

**提交**：
- 29c2323 - 修复efficiency_standards表字段结构

---

### 4. tenant_users 表不存在（07号迁移 - 营收日历系统）

**文件**：`supabase/migrations/v2/07_add_revenue_calendar_system.sql`

**问题**：
```
ERROR: 42P01: relation "tenant_users" does not exist
```

**原因**：使用了不存在的表 `tenant_users`，实际架构使用 `profiles` 表管理用户和租户关系

**解决方案**：
- 将所有 `tenant_users` 引用替换为 `profiles`
- 将 `user_id` 字段替换为 `id`（profiles表的主键）
- 保持角色检查逻辑不变（tenant_admin, store_manager, employee）
- 修复了8条RLS策略：
  - 营收日历表（2条）
  - 每日营收明细表（2条）
  - 营收调整记录表（2条）
  - 影响因子配置表（2条）

**提交**：
- 73c1e56 - 修复07号迁移文件：tenant_users表不存在错误

---

### 5. tenant_users 表不存在（08号迁移 - 智能排班系统）

**文件**：`supabase/migrations/v2/08_add_intelligent_schedule_system.sql`

**问题**：
```
ERROR: 42P01: relation "tenant_users" does not exist
```

**原因**：使用了不存在的表 `tenant_users`，实际架构使用 `profiles` 表管理用户和租户关系

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

**提交**：
- c6e2590 - 修复08号迁移文件（智能排班系统）：tenant_users表不存在错误

---

## 📝 修复模式总结

### 模式1：表不存在错误

**识别特征**：
```
ERROR: 42P01: relation "table_name" does not exist
```

**解决步骤**：
1. 查找实际使用的表名（通过查看其他迁移文件）
2. 替换所有引用
3. 调整相关字段名

**示例**：
- `tenant_users` → `profiles`
- `user_id` → `id`

---

### 模式2：字段不存在错误

**识别特征**：
```
ERROR: 42703: column "field_name" of relation "table_name" does not exist
```

**解决步骤**：
1. 查看表的实际结构定义
2. 找到正确的字段名
3. 更新INSERT/UPDATE语句
4. 调整数据映射逻辑

**示例**：
- `date` → `log_date`
- `min_revenue` → `low_revenue_max`, `normal_revenue_min`, `high_revenue_min`

---

### 模式3：枚举类型使用错误

**识别特征**：
```
ERROR: unsafe use of new value "value" of enum type type_name
```

**解决步骤**：
1. 将迁移拆分为两个文件
2. 第一个文件：添加枚举值
3. 第二个文件：使用新枚举值
4. 创建执行指南

---

## 🔍 验证方法

### 1. 检查表是否存在
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'your_table_name';
```

### 2. 检查表结构
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'your_table_name'
ORDER BY ordinal_position;
```

### 3. 检查枚举类型
```sql
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;
```

---

## 📚 相关文档

- **快速修复指南**：`QUICK_FIX_GUIDE.md`
- **27号迁移执行指南**：`supabase/migrations/EXECUTE_27_MIGRATION.md`
- **数据库架构文档**：`supabase/migrations/01_create_multi_tenant_schema.sql`

---

## 🎓 经验教训

### 1. 架构一致性
- 确保所有迁移文件使用相同的表名和字段名
- 在创建新迁移前，先查看现有架构

### 2. 枚举类型限制
- PostgreSQL 不允许在同一事务中添加和使用枚举值
- 需要拆分为多个迁移文件

### 3. 字段命名规范
- 使用清晰、一致的字段命名
- 避免使用保留字（如 `date`）

### 4. RLS策略维护
- 修改表名时，记得更新所有相关的RLS策略
- 使用批量替换工具（如 sed）提高效率

---

## ✨ 下一步建议

### 1. 创建迁移文件检查清单
- [ ] 表名是否存在
- [ ] 字段名是否正确
- [ ] 枚举值是否已添加
- [ ] RLS策略是否更新

### 2. 建立迁移文件命名规范
- 使用描述性名称
- 包含版本号和日期
- 标注依赖关系

### 3. 自动化测试
- 创建迁移文件验证脚本
- 在提交前自动检查常见错误

---

**最后更新**：2025-11-12  
**维护者**：开发团队  
**状态**：✅ 所有已知问题已修复
