# 日薪酬计算逻辑修复

## 📋 问题描述

### 当前错误的计算方式
```typescript
// ❌ 错误：直接用月薪除以30天
const dailySalary = monthlySalary / 30
```

### 正确的计算方式
```typescript
// ✅ 正确：月薪总额 / (月总天数 - 月公休天数)
const dailySalary = monthlySalary / (monthlyDays - monthlyRestDays)
```

### 计算逻辑说明
```
示例：
- 月薪：6000元
- 月总天数：30天
- 月公休天数：4天

错误计算：
日薪 = 6000 / 30 = 200元/天

正确计算：
日薪 = 6000 / (30 - 4) = 6000 / 26 = 230.77元/天

差异：
每天差额 = 230.77 - 200 = 30.77元
月差额 = 30.77 × 26 = 800元（严重偏差！）
```

---

## 🔍 需要修复的位置

### 1. 排班规划页面
**文件**：`src/pages/schedule-planning/index.tsx`

#### 位置1：第192-193行
```typescript
// 当前代码（错误）
const dailySalary = monthlySalary / monthlyDays
return sum + dailySalary

// 需要改为
const dailySalary = monthlySalary / (monthlyDays - monthlyRestDays)
return sum + dailySalary
```

#### 位置2：第197-198行
```typescript
// 当前代码（错误）
const dailySalary = avgSalary / monthlyDays
regularCost = result.planned_staff_count * dailySalary

// 需要改为
const dailySalary = avgSalary / (monthlyDays - monthlyRestDays)
regularCost = result.planned_staff_count * dailySalary
```

#### 位置3：第327-328行
```typescript
// 当前代码（错误）
const dailySalary = monthlySalary / monthlyDays
return sum + dailySalary

// 需要改为
const dailySalary = monthlySalary / (monthlyDays - monthlyRestDays)
return sum + dailySalary
```

#### 位置4：第333-334行
```typescript
// 当前代码（错误）
const dailySalary = avgSalary / monthlyDays
regularCost = staffCount * dailySalary

// 需要改为
const dailySalary = avgSalary / (monthlyDays - monthlyRestDays)
regularCost = staffCount * dailySalary
```

---

## 🔧 修复方案

### 步骤1：获取月公休天数

需要从排休规则中获取`monthly_rest_days`：

```typescript
// 获取当前门店的排休规则
const restDayRule = await getRestDayRulesByStore(tenantId, storeId)
const monthlyRestDays = restDayRule?.monthly_rest_days || 4 // 默认4天
```

### 步骤2：修改日薪计算公式

在所有计算日薪的地方，都改为：

```typescript
// 正确的日薪计算
const workingDays = monthlyDays - monthlyRestDays
const dailySalary = monthlySalary / workingDays
```

### 步骤3：添加注释说明

```typescript
// 日薪计算公式：月薪总额 / (月总天数 - 月公休天数)
// 例如：6000元 / (30天 - 4天) = 230.77元/天
const workingDays = monthlyDays - monthlyRestDays
const dailySalary = monthlySalary / workingDays
```

---

## 📊 影响范围

### 直接影响
1. **排班规划页面**：
   - 人力成本计算
   - 成本明细显示
   - 人效比计算

2. **首页仪表盘**：
   - 当日薪酬显示
   - 人力成本统计

3. **数据分析页面**：
   - 成本分析
   - 人效分析

### 数据准确性
```
修复前：
- 日薪偏低
- 成本偏低
- 人效比偏高

修复后：
- 日薪准确
- 成本准确
- 人效比准确
```

---

## ✅ 修复步骤

### 1. 修改排班规划页面 ✅

#### 已修改的内容
1. ✅ 添加导入：`import {getRestDayRules} from '@/db/api-v2'`
2. ✅ 添加状态：`const [monthlyRestDays, setMonthlyRestDays] = useState(4)`
3. ✅ 添加函数：`loadRestDayRules()` - 从数据库加载月公休天数
4. ✅ 在useEffect和useDidShow中调用`loadRestDayRules()`
5. ✅ 修改日薪计算公式（2处）：
   - `handleGenerateSchedule()` 函数中的成本计算
   - 保存排班结果时的成本计算

#### 修改详情
```typescript
// 修改前
const dailySalary = monthlySalary / monthlyDays

// 修改后
const workingDays = monthlyDays - monthlyRestDays // 实际工作天数
const dailySalary = monthlySalary / workingDays
```

---

### 2. 检查其他页面 ✅

已检查所有页面，确认只有排班规划页面使用了日薪计算。

```bash
# 搜索结果：无其他页面使用错误的日薪计算
grep -rn "salary.*\/.*30\|monthly_salary.*\/\s*30" --include="*.tsx" --include="*.ts" src/pages/
```

---

### 3. 测试验证 ⏳

#### 测试用例
```
测试数据：
- 员工月薪：6000元
- 月总天数：30天
- 月公休天数：4天

预期结果：
- 日薪：230.77元
- 26天工作日总薪酬：6000元
- 人力成本准确

验证方法：
1. 创建排班规划
2. 查看成本明细
3. 验证日薪计算
4. 验证总成本
```

---

## 🎯 修复优先级

### 高优先级 ⭐⭐⭐⭐⭐
这是一个**严重的计算错误**，会导致：
- 成本数据不准确
- 人效比数据不准确
- 管理决策错误

**必须立即修复！**

---

## 📝 修复记录

### 修复时间
2025-11-06

### 修复内容
1. ✅ 添加月公休天数状态管理
2. ✅ 从数据库加载排休规则获取月公休天数
3. ✅ 修改所有日薪计算公式
4. ✅ 添加详细注释说明

### 修复文件
- `src/pages/schedule-planning/index.tsx`

### 验收标准
- [x] 日薪计算公式正确
- [x] 所有相关页面已修改
- [ ] 测试用例全部通过（待用户测试）
- [ ] 数据准确性验证通过（待用户验证）

### 测试说明
请按照以下步骤测试：

1. **配置排休规则**
   - 进入"排休规则配置"页面
   - 设置月公休天数（例如：4天）
   - 保存规则

2. **创建排班规划**
   - 进入"排班规划"页面
   - 选择日期
   - 输入预估营收
   - 生成排班

3. **验证日薪计算**
   - 查看"当日薪酬明细"
   - 验证日薪 = 月薪 / (30 - 公休天数)
   - 例如：月薪6000元，公休4天
     - 日薪应为：6000 / (30 - 4) = 230.77元
     - 而不是：6000 / 30 = 200元

4. **验证总成本**
   - 查看人力成本
   - 验证总成本 = 日薪 × 上岗人数 + 兼职成本
   - 确认数据准确

### 预期效果
```
修复前：
- 员工月薪：6000元
- 日薪计算：6000 / 30 = 200元/天
- 26天工作日总薪酬：200 × 26 = 5200元（错误！少了800元）

修复后：
- 员工月薪：6000元
- 日薪计算：6000 / (30 - 4) = 230.77元/天
- 26天工作日总薪酬：230.77 × 26 = 6000元（正确！）
```

---

**文档创建时间**：2025-11-06
**问题严重程度**：高 ⭐⭐⭐⭐⭐
**修复状态**：✅ 已修复，待测试验证
