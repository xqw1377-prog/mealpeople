# 今日仪表盘修复说明

## 修复概述

本次修复解决了今日仪表盘的4个核心问题，确保数据准确性和计算正确性。

## 修复内容

### 1. 营收数据同步问题 ✅

**问题描述：**
- 仪表盘只显示排班规划时的预估营收
- 营业调整和营业复盘的数据没有同步到仪表盘
- 导致仪表盘显示的营收数据不准确

**解决方案：**
- 修改`getDashboardData`函数，从`daily_operations`表获取最新营收
- 实现营收优先级机制：`actual_revenue` > `midday_estimated_revenue` > `estimated_revenue`
- 确保营业调整和营业复盘的数据实时同步到仪表盘

**技术实现：**
```typescript
// 获取最新营收：优先级 actual_revenue > midday_estimated_revenue > estimated_revenue
let todayRevenue = todayResult?.estimated_revenue || 0
if (todayOperation) {
  if (todayOperation.actual_revenue !== null && todayOperation.actual_revenue !== undefined) {
    todayRevenue = todayOperation.actual_revenue
    console.log('使用实际营收:', todayRevenue)
  } else if (
    todayOperation.midday_estimated_revenue !== null &&
    todayOperation.midday_estimated_revenue !== undefined
  ) {
    todayRevenue = todayOperation.midday_estimated_revenue
    console.log('使用中午调整营收:', todayRevenue)
  } else if (
    todayOperation.estimated_revenue !== null &&
    todayOperation.estimated_revenue !== undefined
  ) {
    todayRevenue = todayOperation.estimated_revenue
    console.log('使用预估营收:', todayRevenue)
  }
}
```

**数据流程：**
```
排班规划 → estimated_revenue（预估营收）
    ↓
营业调整 → midday_estimated_revenue（中午调整营收）
    ↓
营业复盘 → actual_revenue（实际营收）
    ↓
仪表盘显示最新营收
```

### 2. 排休人数支持小数 ✅

**问题描述：**
- `rest_staff_count`字段是整数类型
- 无法表示半天排休（如0.5人）
- 计算不够精确

**解决方案：**
- 修改数据库字段类型：`rest_staff_count` → `DECIMAL(10,2)`
- 支持小数人数（如0.5人表示半天排休）
- 更新TypeScript类型定义

**数据库迁移：**
```sql
-- 修改rest_staff_count字段类型为DECIMAL
ALTER TABLE schedule_results 
ALTER COLUMN rest_staff_count TYPE DECIMAL(10,2);
```

**示例：**
- 2人排休4小时 → 0.5人（4小时 ÷ 8小时 = 0.5天）
- 3人排休8小时 → 1.0人（8小时 ÷ 8小时 = 1天）
- 1人排休2小时 → 0.25人（2小时 ÷ 8小时 = 0.25天）

### 3. 人效实时同步 ✅

**问题描述：**
- 人效计算使用的是预估营收
- 没有跟随营业调整和营业复盘的数据更新
- 导致人效数据不准确

**解决方案：**
- 修改人效计算，使用最新营收数据
- 确保人效 = 最新营收 / 上岗人数
- 今日人效和累计人效都使用最新营收

**计算公式：**
```typescript
// 今日人效
const todayEfficiency = todayPlannedStaff > 0 ? todayRevenue / todayPlannedStaff : 0

// 累计人效
const accumulatedEfficiency = accumulatedPlannedStaff > 0 ? accumulatedRevenue / accumulatedPlannedStaff : 0
```

**示例：**
- 排班规划：预估营收10000元，上岗10人 → 人效1000元/人
- 营业调整：调整营收12000元，上岗10人 → 人效1200元/人
- 营业复盘：实际营收11500元，上岗10人 → 人效1150元/人
- 仪表盘显示：1150元/人（使用实际营收）

### 4. 薪酬核算修复 ✅

**问题描述：**
- 日薪计算公式：`日薪 = 月薪 / 30`
- 没有考虑月公休天数
- 不符合劳动法规定

**解决方案：**
- 添加`rest_days_per_month`字段（月公休天数）
- 修改日薪计算公式：`日薪 = 月薪 / (30 - 月公休天数)`
- 默认月公休天数为4天

**数据库迁移：**
```sql
-- 添加月公休天数字段
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS rest_days_per_month INTEGER DEFAULT 4;
```

**计算公式：**
```typescript
const monthlySalary = emp.monthly_salary || 5000
const restDaysPerMonth = emp.rest_days_per_month || 4
// 日薪 = 月薪总额 / (月总天数 - 月公休天数)
const dailySalary = monthlySalary / (30 - restDaysPerMonth)
```

**示例：**
- 月薪6000元，月公休4天
- 日薪 = 6000 / (30 - 4) = 6000 / 26 = 230.77元

**对比：**
- 旧算法：6000 / 30 = 200元/天
- 新算法：6000 / 26 = 230.77元/天
- 差异：+30.77元/天（+15.4%）

## 数据库变更

### 1. schedule_results表
```sql
-- 修改rest_staff_count字段类型
ALTER TABLE schedule_results 
ALTER COLUMN rest_staff_count TYPE DECIMAL(10,2);
```

### 2. employees表
```sql
-- 添加月公休天数字段
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS rest_days_per_month INTEGER DEFAULT 4;
```

## 代码变更

### 1. src/db/api.ts
- 修改`getDashboardData`函数
- 添加`daily_operations`表查询
- 实现营收优先级机制
- 使用最新营收计算人效

### 2. src/db/types.ts
- 添加`rest_days_per_month`字段到`Employee`接口

### 3. src/pages/schedule-planning/index.tsx
- 修改日薪计算逻辑
- 使用新的计算公式

## 测试验证

### 测试场景1：营收数据同步

**步骤：**
1. 创建排班规划，预估营收10000元
2. 进行营业调整，调整营收为12000元
3. 查看仪表盘

**预期结果：**
- 仪表盘显示营收：12000元
- 人效使用12000元计算

### 测试场景2：排休人数小数

**步骤：**
1. 选择2名员工
2. 设置排休4小时
3. 查看排班结果

**预期结果：**
- 排休人数：2人
- 排休天数：0.5天
- 数据库存储：rest_staff_count = 2.00

### 测试场景3：人效实时同步

**步骤：**
1. 创建排班规划，预估营收10000元，上岗10人
2. 进行营业复盘，实际营收11500元
3. 查看仪表盘

**预期结果：**
- 今日人效：1150元/人（使用实际营收11500元）
- 不是1000元/人（预估营收10000元）

### 测试场景4：薪酬核算

**步骤：**
1. 员工月薪6000元，月公休4天
2. 创建排班规划
3. 查看人力成本

**预期结果：**
- 日薪：230.77元（6000 / 26）
- 不是200元（6000 / 30）

## 影响范围

### 直接影响
1. **今日仪表盘**：营收、人效、成本数据更准确
2. **排班规划**：人力成本计算更准确
3. **排班结果**：支持小数排休人数

### 间接影响
1. **数据分析**：基于准确数据的分析更可靠
2. **成本管控**：成本计算更符合实际
3. **绩效评估**：人效数据更真实

## 注意事项

### 1. 数据兼容性
- 旧数据的`rest_staff_count`会自动转换为小数格式（如2 → 2.00）
- 旧数据的`rest_days_per_month`默认为4天

### 2. 营收优先级
- 必须严格按照优先级：`actual_revenue` > `midday_estimated_revenue` > `estimated_revenue`
- 如果没有调整或复盘数据，使用预估营收

### 3. 日薪计算
- 月总天数固定为30天
- 月公休天数默认为4天
- 可以在员工信息中修改月公休天数

### 4. 小数精度
- 排休人数保留2位小数
- 排休天数保留2位小数
- 日薪保留2位小数

## 后续优化建议

### 1. 前端输入优化
- 在快速排休功能中，支持直接输入小数人数
- 添加输入验证，确保小数格式正确

### 2. 数据展示优化
- 在仪表盘中，明确标注使用的是哪种营收（预估/调整/实际）
- 添加营收变化趋势图

### 3. 薪酬管理优化
- 在员工管理页面，添加月公休天数的编辑功能
- 提供批量设置月公休天数的功能

### 4. 数据校验
- 添加营收数据的合理性校验
- 添加排休人数的范围校验（0-员工总数）
- 添加月公休天数的范围校验（0-30天）

## 总结

本次修复解决了今日仪表盘的4个核心问题：

1. ✅ **营收数据同步**：实时同步营业调整和营业复盘的数据
2. ✅ **排休人数小数**：支持小数人数，计算更精确
3. ✅ **人效实时同步**：使用最新营收计算人效
4. ✅ **薪酬核算修复**：符合劳动法规定的日薪计算

所有修改已完成并提交到代码库，可以进行测试验证。
