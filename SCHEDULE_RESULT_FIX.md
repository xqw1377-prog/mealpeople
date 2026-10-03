# 排班结果显示和数据同步修复总结

## 问题描述

用户反馈：
1. 排班规划页面保存后，没有显示排班结果表（今日排班达标率、排休几人、增添兼职多少工时、今日薪酬总额等）
2. 保存排班后，数据没有同步到今日运营仪表盘
3. **排班规划页面一直闪屏**（循环渲染问题）

## 问题分析

### 问题1：排班结果不显示

**根本原因**：
- 保存排班时，`scheduleResult` state 被设置为包含额外字段的对象（`regular_cost`, `part_time_cost`, `working_employee_count`）
- 保存成功后调用 `loadScheduleResult()` 重新从数据库加载数据
- `loadScheduleResult()` 只返回数据库中的字段，不包含这些额外的计算字段
- 导致重新加载后，排班结果显示不完整

### 问题2：数据未同步到仪表盘

**根本原因**：
- 仪表盘数据加载函数 `getEnhancedDashboardData` 和 `getDashboardData` 只接受 `tenantId` 参数
- 没有按门店过滤数据，导致显示的是所有门店的汇总数据
- 当用户选择特定门店后，仪表盘仍然显示所有门店的数据

### 问题3：排班规划页面闪屏（循环渲染）

**根本原因**：
- `loadScheduleResult` 的依赖项包含 `employees`、`restEmployeeIds`、`partTimeShifts`
- `loadScheduleResult` 在 useEffect 的依赖项中
- 导致循环更新：
  1. `loadEmployees()` 执行 → `employees` 更新
  2. `employees` 更新 → `loadScheduleResult` 重新创建
  3. `loadScheduleResult` 重新创建 → useEffect 重新执行
  4. useEffect 重新执行 → `loadEmployees()` 再次执行
  5. 循环往复，导致闪屏

**修复方案**：
不要在 `loadScheduleResult` 中依赖 state，而是在函数内部重新查询数据：

```typescript
const loadScheduleResult = useCallback(async () => {
  if (!currentTenant?.id || !currentStore?.id || !selectedDate) return

  const result = await getScheduleResultByDate(currentTenant?.id, currentStore.id, selectedDate)

  if (result) {
    // 重新查询员工和兼职数据，避免依赖state导致循环更新
    const employeeList = await getEmployeesByStoreId(currentStore.id)
    const partTimeList = await getPartTimeShiftsByDate(currentTenant?.id, currentStore.id, selectedDate)
    
    // 从数据库中获取排班记录，确定哪些员工排休
    const schedules = await supabase
      .from('schedules')
      .select('employee_id, is_rest')
      .eq('tenant_id', currentTenant?.id)
      .eq('store_id', currentStore.id)
      .eq('schedule_date', selectedDate)
    
    const restEmployeeIdsFromDB = schedules.data
      ? schedules.data.filter(s => s.is_rest).map(s => s.employee_id)
      : []
    
    // 计算上岗员工
    const workingEmployees = employeeList.filter((emp) => !restEmployeeIdsFromDB.includes(emp.id))
    const monthlyDays = 30

    // 计算正式员工成本
    let regularCost = 0
    if (workingEmployees.some((emp) => emp.monthly_salary)) {
      regularCost = workingEmployees.reduce((sum, emp) => {
        const monthlySalary = emp.monthly_salary || 5000
        const dailySalary = monthlySalary / monthlyDays
        return sum + dailySalary
      }, 0)
    } else {
      const avgSalary = 5000
      const dailySalary = avgSalary / monthlyDays
      regularCost = result.planned_staff_count * dailySalary
    }

    // 计算兼职成本
    const partTimeCost = partTimeList.reduce((sum, shift) => sum + shift.total_cost, 0)

    // 设置完整的排班结果
    setScheduleResult({
      ...result,
      regular_cost: regularCost,
      part_time_cost: partTimeCost,
      working_employee_count: workingEmployees.length || result.planned_staff_count
    })
  } else {
    setScheduleResult(null)
  }
}, [currentTenant?.id, selectedDate, currentStore?.id])
```

**关键改进**：
1. ✅ 移除了 `employees`、`restEmployeeIds`、`partTimeShifts` 依赖项
2. ✅ 在函数内部重新查询这些数据
3. ✅ 从数据库查询排班记录，确定排休员工
4. ✅ 避免了循环更新，解决闪屏问题

## 修改的文件

### 1. src/pages/schedule-planning/index.tsx
- 添加 `supabase` 导入
- 修改 `loadScheduleResult` 函数：
  - 移除 `employees`、`restEmployeeIds`、`partTimeShifts` 依赖项
  - 在函数内部重新查询员工、兼职、排班数据
  - 从数据库查询排班记录，确定排休员工
  - 重新计算额外的显示字段

### 2. src/db/api.ts
- 修改 `getDashboardData` 函数签名，添加可选的 `storeId` 参数
- 修改查询逻辑，支持按门店过滤今日数据和本月累计数据
- 修改 `getEnhancedDashboardData` 函数签名，添加可选的 `storeId` 参数
- 修改查询逻辑，支持按门店过滤排班日志、员工统计、排班结果

### 3. src/pages/home/index.tsx
- 修改 `loadData` 函数，传递 `currentStore?.id` 参数给 `getEnhancedDashboardData`

## 功能验证

### 排班结果显示验证
1. 进入排班规划页面
2. 选择日期，输入预估营收
3. 选择排休员工，添加兼职
4. 点击"保存排班规划"
5. **预期结果**：
   - ✅ 页面不再闪屏
   - ✅ 显示排班结果卡片
   - ✅ 显示上岗人数、排休人数、兼职人数
   - ✅ 显示正式员工薪酬、兼职薪酬、总人力成本
   - ✅ 显示排班达成率、人力成本率、成本是否合格

### 仪表盘数据同步验证
1. 在首页选择租户和门店
2. 进入排班规划页面，保存排班
3. 返回首页
4. **预期结果**：
   - ✅ 仪表盘数据自动刷新
   - ✅ 显示当前门店的今日数据（营收、排休人数、人效、人力成本等）
   - ✅ 显示当前门店的本月累计数据
   - ✅ 排班完成情况、排班质量情况、人员参与情况等统计数据更新

### 闪屏问题验证
1. 进入排班规划页面
2. **预期结果**：
   - ✅ 页面稳定，不再闪屏
   - ✅ 数据正常加载
   - ✅ 没有循环渲染

## 数据流程

```
排班规划页面保存
    ↓
1. 保存排班结果到数据库（schedule_results表）
2. 创建排班任务（schedules表）
3. 创建排班日志（schedule_logs表）
4. 触发事件：scheduleDataUpdated
    ↓
首页监听事件
    ↓
重新加载仪表盘数据
    ↓
调用 getEnhancedDashboardData(tenantId, storeId)
    ↓
按门店过滤数据
    ↓
显示更新后的仪表盘数据
```

## 技术要点

### 1. 避免循环渲染的关键原则
- ❌ **错误做法**：在 useCallback 中依赖频繁变化的 state
- ✅ **正确做法**：在函数内部重新查询数据，只依赖稳定的参数

### 2. useCallback 依赖项管理
```typescript
// ❌ 错误：依赖频繁变化的state
const loadData = useCallback(async () => {
  // 使用 employees, restEmployeeIds, partTimeShifts
}, [employees, restEmployeeIds, partTimeShifts])

// ✅ 正确：只依赖稳定的参数，内部重新查询
const loadData = useCallback(async () => {
  const employees = await getEmployees()
  const partTimeShifts = await getPartTimeShifts()
  // 使用查询到的数据
}, [tenantId, storeId, date])
```

### 3. 数据查询策略
- 对于显示用的计算字段，在加载时重新查询原始数据
- 避免在多个地方维护相同的数据状态
- 使用数据库作为单一数据源

## 注意事项

1. **额外字段计算**：`regular_cost`、`part_time_cost`、`working_employee_count` 这些字段不存在于数据库中，需要在前端计算
2. **门店过滤**：所有数据查询都需要支持按门店过滤，确保数据隔离
3. **事件监听**：首页已经监听了 `scheduleDataUpdated` 事件，保存排班后会自动刷新
4. **依赖项管理**：`loadScheduleResult` 只依赖 `tenantId`、`storeId`、`selectedDate`，避免循环更新
5. **数据查询**：在 `loadScheduleResult` 内部重新查询员工、兼职、排班数据，确保数据最新

## 代码质量

- ✅ 所有代码通过 `pnpm run lint` 检查
- ✅ TypeScript 类型检查通过
- ✅ 没有语法错误
- ✅ 遵循React Hooks规则
- ✅ 正确处理异步数据加载
- ✅ 正确处理可选参数
- ✅ 避免了循环渲染问题
- ✅ 性能优化：减少不必要的重新渲染

