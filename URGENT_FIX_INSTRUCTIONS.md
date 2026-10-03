# 紧急修复说明 - 排班保存失败问题

## 问题原因

排班保存失败的根本原因是：**数据库表不存在或RLS策略阻止了数据插入**

## 解决方案

### 步骤1: 检查数据库表是否存在

请在Supabase控制台中执行以下SQL查询，检查表是否存在：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('part_time_shifts', 'schedule_results');
```

**预期结果**:
```
table_name
-----------------
part_time_shifts
schedule_results
```

**如果表不存在**，请继续步骤2。

### 步骤2: 创建数据库表

在Supabase控制台的SQL编辑器中，执行以下SQL脚本：

```sql
-- 创建兼职工时记录表
CREATE TABLE IF NOT EXISTS part_time_shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    store_id uuid NOT NULL,
    operation_date date NOT NULL,
    employee_name text NOT NULL,
    work_hours numeric NOT NULL CHECK (work_hours > 0),
    hourly_rate numeric NOT NULL CHECK (hourly_rate > 0),
    total_cost numeric NOT NULL CHECK (total_cost >= 0),
    meal_period text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建排班结果表
CREATE TABLE IF NOT EXISTS schedule_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    store_id uuid NOT NULL,
    operation_date date NOT NULL,
    estimated_revenue numeric NOT NULL CHECK (estimated_revenue >= 0),
    target_staff_count integer NOT NULL CHECK (target_staff_count > 0),
    planned_staff_count integer NOT NULL CHECK (planned_staff_count >= 0),
    rest_staff_count integer NOT NULL CHECK (rest_staff_count >= 0),
    part_time_count integer DEFAULT 0 CHECK (part_time_count >= 0),
    part_time_hours numeric DEFAULT 0 CHECK (part_time_hours >= 0),
    achievement_rate numeric NOT NULL,
    total_labor_cost numeric NOT NULL CHECK (total_labor_cost >= 0),
    labor_cost_rate numeric NOT NULL,
    is_cost_qualified boolean NOT NULL,
    efficiency_zone text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, store_id, operation_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_part_time_shifts_tenant_store_date 
    ON part_time_shifts(tenant_id, store_id, operation_date);

CREATE INDEX IF NOT EXISTS idx_schedule_results_tenant_store_date 
    ON schedule_results(tenant_id, store_id, operation_date);

-- 启用RLS
ALTER TABLE part_time_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_results ENABLE ROW LEVEL SECURITY;

-- 删除旧的RLS策略（如果存在）
DROP POLICY IF EXISTS "Authenticated users have full access to part_time_shifts" ON part_time_shifts;
DROP POLICY IF EXISTS "Authenticated users have full access to schedule_results" ON schedule_results;
DROP POLICY IF EXISTS "All users have full access to part_time_shifts" ON part_time_shifts;
DROP POLICY IF EXISTS "All users have full access to schedule_results" ON schedule_results;

-- 创建新的RLS策略 - 允许所有用户完全访问
CREATE POLICY "All users have full access to part_time_shifts" ON part_time_shifts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "All users have full access to schedule_results" ON schedule_results
    FOR ALL USING (true) WITH CHECK (true);
```

### 步骤3: 验证表创建成功

执行以下SQL查询，验证表和策略是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('part_time_shifts', 'schedule_results');

-- 检查RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('part_time_shifts', 'schedule_results');
```

**预期结果**:
- 两个表都存在
- 每个表都有一个名为"All users have full access to..."的策略
- 策略的`qual`和`with_check`都是`true`

### 步骤4: 测试排班保存功能

1. 刷新小程序页面
2. 进入"排班规划"页面
3. 填写以下信息：
   - 预估营收：10000
   - 计划人数：5
4. 点击"保存排班规划"
5. 查看浏览器控制台日志

**预期日志**:
```
=== 开始保存排班规划 ===
=== 排班结果数据 ===
=== 开始保存排班结果到数据库 ===
=== upsertScheduleResult 开始 ===
输入数据: {...}
=== upsertScheduleResult 成功 ===
返回数据: {...}
=== 排班结果保存完成 ===
保存排班规划成功！
```

## 如果仍然失败

### 检查1: 查看详细错误信息

在浏览器控制台中，查找以下日志：
```
保存排班结果失败: {error}
错误详情: {
  message: "...",
  details: "...",
  hint: "...",
  code: "..."
}
```

### 检查2: 常见错误代码

| 错误代码 | 含义 | 解决方案 |
|---------|------|---------|
| 42P01 | 表不存在 | 执行步骤2创建表 |
| 42501 | 权限不足 | 执行步骤2创建RLS策略 |
| PGRST116 | RLS策略阻止 | 执行步骤2修复RLS策略 |
| 23505 | 唯一约束冲突 | 该日期已有排班结果，请选择其他日期 |
| 23503 | 外键约束冲突 | tenant_id或store_id不存在 |
| 23514 | CHECK约束冲突 | 数值不满足约束条件 |

### 检查3: 验证Supabase连接

在浏览器控制台中执行：
```javascript
import {supabase} from '@/client/supabase'

// 测试连接
const {data, error} = await supabase.from('schedule_results').select('count')
console.log('连接测试:', {data, error})
```

**预期结果**: 
- 如果表存在且RLS策略正确，应该返回`{data: [{count: 0}], error: null}`
- 如果表不存在，应该返回错误代码`42P01`
- 如果RLS策略阻止，应该返回错误代码`PGRST116`

### 检查4: 验证数据格式

在浏览器控制台中，查找以下日志：
```
=== 排班结果数据 ===
{
  完整数据: {
    tenant_id: "xxx",  // 必须有值，不能是undefined
    store_id: "xxx",
    operation_date: "2025-11-06",
    estimated_revenue: 10000,  // 必须 >= 0
    target_staff_count: 5,  // 必须 > 0
    planned_staff_count: 5,  // 必须 >= 0
    rest_staff_count: 0,  // 必须 >= 0
    part_time_count: 0,  // 必须 >= 0
    part_time_hours: 0,  // 必须 >= 0
    achievement_rate: 100,  // 必须有值
    total_labor_cost: 833.33,  // 必须 >= 0
    labor_cost_rate: 8.33,  // 必须有值
    is_cost_qualified: true,  // 必须有值
    efficiency_zone: "normal"  // 必须有值
  }
}
```

确保所有字段都有有效值，且满足数据库约束。

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

1. **数据库表检查结果**（步骤1的SQL查询结果）
2. **RLS策略检查结果**（步骤3的SQL查询结果）
3. **完整的控制台日志**（从点击保存到显示错误的所有日志）
4. **错误详情**（`错误详情`日志中的完整内容）
5. **Supabase项目ID**（从`.env`文件中的`TARO_APP_SUPABASE_URL`获取）

## 重要提示

1. **数据库迁移**: 所有数据库更改都应该通过迁移文件进行，不要直接在Supabase控制台中修改表结构
2. **RLS策略**: 当前RLS策略允许所有用户访问，这在生产环境中可能不安全，需要根据实际需求调整
3. **数据验证**: 代码中已添加了数据验证逻辑，确保所有数值满足数据库约束
4. **错误处理**: 代码中已添加了详细的错误日志，便于调试问题

## 修复历史

### 2025-11-06 修复记录

1. ✅ 修复了数据库字段名错误
2. ✅ 修复了排班结果加载逻辑
3. ✅ 新增了排班结构表功能
4. ✅ 添加了详细的调试日志
5. ✅ 移除了可能导致undefined的可选链操作符
6. ✅ 添加了数据验证逻辑
7. ✅ 修复了RLS策略（允许所有用户访问）
8. ✅ 重命名了迁移文件（按正确顺序编号）

## 下一步

请按照上述步骤执行，特别是**步骤2**（创建数据库表和RLS策略）。

执行完成后，请测试排班保存功能，并查看控制台日志。

如果仍有问题，请提供详细的错误信息。
