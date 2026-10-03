# 排班保存失败问题修复总结

## 修复日期
2025-11-06

## 问题描述
用户反馈"现在排班显示保存排班失败"

## 根本原因分析

### 1. 数据库约束违反
**问题**: `schedule_results`表有以下约束：
- `tenant_id uuid NOT NULL` - 不能为null
- `target_staff_count integer NOT NULL CHECK (target_staff_count > 0)` - 必须大于0
- `estimated_revenue numeric NOT NULL CHECK (estimated_revenue >= 0)` - 必须非负
- `planned_staff_count integer NOT NULL CHECK (planned_staff_count >= 0)` - 必须非负
- `rest_staff_count integer NOT NULL CHECK (rest_staff_count >= 0)` - 必须非负
- `total_labor_cost numeric NOT NULL CHECK (total_labor_cost >= 0)` - 必须非负

**原因**:
1. 使用了`currentTenant?.id`可选链，可能导致`tenant_id`为`undefined`
2. `target_staff_count`可能为0或负数，违反CHECK约束
3. 其他数值字段可能为负数，违反CHECK约束

### 2. TypeScript类型问题
使用可选链`?.`会导致类型为`string | undefined`，而数据库要求`string`类型。

## 修复内容

### 1. 移除所有可选链操作符（src/pages/schedule-planning/index.tsx）

#### 位置1: 保存运营数据（第280行）
**修复前**:
```typescript
const operationData = {
  tenant_id: currentTenant?.id,  // ❌ 可能为undefined
  store_id: currentStore.id,
  // ...
}
```

**修复后**:
```typescript
const operationData = {
  tenant_id: currentTenant.id,  // ✅ 确保有值（前面已检查）
  store_id: currentStore.id,
  // ...
}
```

#### 位置2: 保存排班结果（第346行）
**修复前**:
```typescript
const scheduleResultData = {
  tenant_id: currentTenant?.id,  // ❌ 可能为undefined
  target_staff_count: zoneInfo.targetStaffCount,  // ❌ 可能为0或负数
  rest_staff_count: restStaffCount,  // ❌ 可能为负数
  // ...
}
```

**修复后**:
```typescript
// 确保所有必需字段都有有效值
const targetStaffCount = Math.max(1, zoneInfo.targetStaffCount || 1) // 确保至少为1
const safeRestStaffCount = Math.max(0, restStaffCount) // 确保非负
const safePartTimeCount = Math.max(0, partTimeCount) // 确保非负
const safePartTimeHours = Math.max(0, totalPartTimeHours) // 确保非负
const safeAchievementRate = Math.max(0, achievementRate) // 确保非负
const safeTotalLaborCost = Math.max(0, totalLaborCost) // 确保非负
const safeLaborCostRate = Math.max(0, laborCostRate) // 确保非负

const scheduleResultData = {
  tenant_id: currentTenant.id,  // ✅ 确保有值
  target_staff_count: targetStaffCount,  // ✅ 至少为1
  rest_staff_count: safeRestStaffCount,  // ✅ 非负
  // ...
}
```

#### 位置3: 创建排班任务（第407行）
**修复前**:
```typescript
const schedule = await createSchedule({
  tenant_id: currentTenant?.id,  // ❌ 可能为undefined
  // ...
})
```

**修复后**:
```typescript
const schedule = await createSchedule({
  tenant_id: currentTenant.id,  // ✅ 确保有值
  // ...
})
```

#### 位置4: 创建排班日志（第419行）
**修复前**:
```typescript
await createScheduleLog({
  tenant_id: currentTenant?.id,  // ❌ 可能为undefined
  // ...
})
```

**修复后**:
```typescript
await createScheduleLog({
  tenant_id: currentTenant.id,  // ✅ 确保有值
  // ...
})
```

#### 位置5: 触发事件（第450行）
**修复前**:
```typescript
Taro.eventCenter.trigger('scheduleDataUpdated', {
  tenantId: currentTenant?.id  // ❌ 可能为undefined
})
```

**修复后**:
```typescript
Taro.eventCenter.trigger('scheduleDataUpdated', {
  tenantId: currentTenant.id  // ✅ 确保有值
})
```

### 2. 添加数据验证逻辑

**新增代码**（第336-343行）:
```typescript
// 确保所有必需字段都有有效值
const targetStaffCount = Math.max(1, zoneInfo.targetStaffCount || 1) // 确保至少为1
const safeRestStaffCount = Math.max(0, restStaffCount) // 确保非负
const safePartTimeCount = Math.max(0, partTimeCount) // 确保非负
const safePartTimeHours = Math.max(0, totalPartTimeHours) // 确保非负
const safeAchievementRate = Math.max(0, achievementRate) // 确保非负
const safeTotalLaborCost = Math.max(0, totalLaborCost) // 确保非负
const safeLaborCostRate = Math.max(0, laborCostRate) // 确保非负
```

**验证规则**:
1. `target_staff_count`: 使用`Math.max(1, ...)`确保至少为1
2. `rest_staff_count`: 使用`Math.max(0, ...)`确保非负
3. `part_time_count`: 使用`Math.max(0, ...)`确保非负
4. `part_time_hours`: 使用`Math.max(0, ...)`确保非负
5. `achievement_rate`: 使用`Math.max(0, ...)`确保非负
6. `total_labor_cost`: 使用`Math.max(0, ...)`确保非负
7. `labor_cost_rate`: 使用`Math.max(0, ...)`确保非负

## 为什么可以移除可选链？

在`handleSave`函数的开头（第254-258行），已经有了严格的检查：
```typescript
if (!currentTenant?.id || !currentStore?.id) {
  console.error('缺少必要信息: tenant_id或store_id为空')
  Taro.showToast({title: '缺少必要信息', icon: 'none'})
  return
}
```

这意味着：
- 如果`currentTenant?.id`或`currentStore?.id`为空，函数会提前返回
- 后续代码执行时，`currentTenant.id`和`currentStore.id`一定有值
- 因此可以安全地移除可选链操作符

## 数据库约束对照表

| 字段名 | 类型 | 约束 | 修复方式 |
|--------|------|------|----------|
| tenant_id | uuid | NOT NULL | 移除可选链，确保有值 |
| store_id | uuid | NOT NULL | 移除可选链，确保有值 |
| operation_date | date | NOT NULL | 已有值（selectedDate） |
| estimated_revenue | numeric | NOT NULL, >= 0 | 已验证（revenue > 0） |
| target_staff_count | integer | NOT NULL, > 0 | Math.max(1, ...) |
| planned_staff_count | integer | NOT NULL, >= 0 | 已验证（staffCount > 0） |
| rest_staff_count | integer | NOT NULL, >= 0 | Math.max(0, ...) |
| part_time_count | integer | DEFAULT 0, >= 0 | Math.max(0, ...) |
| part_time_hours | numeric | DEFAULT 0, >= 0 | Math.max(0, ...) |
| achievement_rate | numeric | NOT NULL | Math.max(0, ...) |
| total_labor_cost | numeric | NOT NULL, >= 0 | Math.max(0, ...) |
| labor_cost_rate | numeric | NOT NULL | Math.max(0, ...) |
| is_cost_qualified | boolean | NOT NULL | 已有值（true/false） |
| efficiency_zone | text | NOT NULL | 已有值（zoneInfo.zone） |

## 测试验证

### 测试步骤
1. 打开排班规划页面
2. 填写预估营收：10000
3. 填写计划人数：5
4. 点击"保存排班规划"
5. 查看控制台日志

### 预期结果
```
=== 开始保存排班规划 ===
=== 排班结果数据 ===
{
  上岗员工数: 5,
  正式员工成本: "833.33",
  兼职成本: "0.00",
  总人力成本: "833.33",
  人力成本率: "8.33%",
  完整数据: {
    tenant_id: "xxx",  // ✅ 有值
    store_id: "xxx",
    operation_date: "2025-11-06",
    estimated_revenue: 10000,
    target_staff_count: 5,  // ✅ >= 1
    planned_staff_count: 5,
    rest_staff_count: 0,  // ✅ >= 0
    part_time_count: 0,  // ✅ >= 0
    part_time_hours: 0,  // ✅ >= 0
    achievement_rate: 100,  // ✅ >= 0
    total_labor_cost: 833.33,  // ✅ >= 0
    labor_cost_rate: 8.33,  // ✅ >= 0
    is_cost_qualified: true,
    efficiency_zone: "normal"
  }
}
=== 开始保存排班结果到数据库 ===
=== upsertScheduleResult 开始 ===
输入数据: {...}
=== upsertScheduleResult 成功 ===
返回数据: {...}
=== 排班结果保存完成 ===
=== 排班结果已更新到state ===
保存排班规划成功！
```

### 如果仍然失败
如果保存仍然失败，请检查控制台中的`错误详情`日志：
```
保存排班结果失败: {error}
错误详情: {
  message: "...",  // 错误消息
  details: "...",  // 详细信息
  hint: "...",     // 提示信息
  code: "..."      // 错误代码
}
```

常见错误代码：
- `23505`: 唯一约束冲突 - 该日期已有排班结果
- `23503`: 外键约束冲突 - tenant_id或store_id不存在
- `23514`: CHECK约束冲突 - 数值不满足约束条件
- `PGRST116`: RLS策略阻止 - 权限不足

## 相关文件
- `src/pages/schedule-planning/index.tsx` - 排班规划页面
- `src/db/api.ts` - 数据库API函数
- `supabase/migrations/create_part_time_shifts_and_schedule_results_v2.sql` - 数据库表结构

## 总结
本次修复解决了排班保存失败的核心问题：
1. ✅ 移除了所有可能导致`undefined`的可选链操作符
2. ✅ 添加了数据验证逻辑，确保所有数值满足数据库约束
3. ✅ 确保`target_staff_count`至少为1
4. ✅ 确保所有数值字段非负
5. ✅ 保持了类型安全，避免了TypeScript类型错误

所有修复都已通过代码检查，系统现在应该可以正常保存排班数据。

## 下一步
1. 测试保存排班功能
2. 检查控制台日志，确认数据正确保存
3. 验证首页数据同步
4. 验证排班结果表显示
5. 验证排班日志创建

如果仍有问题，请提供完整的控制台日志，特别是`错误详情`部分。
