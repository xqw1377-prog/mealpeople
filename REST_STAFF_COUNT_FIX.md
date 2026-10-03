# 排休人数显示问题修复说明

## 修复日期
2025-11-06

## 问题描述
用户反馈："排班规划里，排休人数数据没有反馈出来"

## 问题分析

### 原始代码（错误）
```typescript
const totalEmployees = employees.length
const restStaffCount = totalEmployees - staffCount
```

### 问题所在
1. **计算逻辑错误**：使用`totalEmployees - staffCount`计算排休人数
   - `totalEmployees`：所有员工的总数（例如：10人）
   - `staffCount`：用户输入的计划上岗人数（例如：5人）
   - 计算结果：10 - 5 = 5人

2. **忽略了用户选择**：用户通过"快速排休"功能选择的排休员工被忽略了
   - 用户可能选择了3个员工排休
   - 但系统计算的是5个员工排休
   - 导致显示的排休人数与实际选择不符

3. **数据不一致**：
   - 排班任务只为上岗员工创建（基于`restEmployeeIds`）
   - 但排班结果中的`rest_staff_count`使用的是计算值
   - 导致数据不一致

## 修复方案

### 修复后的代码
```typescript
const totalEmployees = employees.length

// 排休人数应该使用实际选择的排休员工数量
const restStaffCount = restEmployeeIds.length

console.log('=== 排班人员统计 ===', {
  总员工数: totalEmployees,
  计划上岗人数: staffCount,
  实际排休人数: restStaffCount,
  排休员工IDs: restEmployeeIds,
  排休员工名单: employees.filter(e => restEmployeeIds.includes(e.id)).map(e => e.name)
})
```

### 修复原理
1. **使用实际选择**：直接使用`restEmployeeIds.length`作为排休人数
   - `restEmployeeIds`：用户通过"快速排休"选择的员工ID数组
   - 例如：用户选择了3个员工，`restEmployeeIds.length`就是3

2. **数据一致性**：确保排班结果与排班任务一致
   - 排班任务：只为不在`restEmployeeIds`中的员工创建
   - 排班结果：`rest_staff_count`使用`restEmployeeIds.length`
   - 两者完全一致

3. **添加调试日志**：便于验证数据正确性
   - 显示总员工数
   - 显示计划上岗人数
   - 显示实际排休人数
   - 显示排休员工名单

## 测试验证

### 测试场景1：选择排休员工
1. 进入排班规划页面
2. 填写预估营收：10000
3. 填写计划人数：5
4. 点击"快速排休"按钮
5. 选择3个员工排休
6. 点击"确认排休"
7. 点击"保存排班规划"

**预期结果**：
```
=== 排班人员统计 ===
{
  总员工数: 10,
  计划上岗人数: 5,
  实际排休人数: 3,  // ✅ 显示实际选择的3人
  排休员工IDs: ["id1", "id2", "id3"],
  排休员工名单: ["张三", "李四", "王五"]
}
```

**界面显示**：
- 上岗人数：5人
- 排休人数：3人 ✅（正确显示）
- 兼职人数：0人

### 测试场景2：不选择排休员工
1. 进入排班规划页面
2. 填写预估营收：10000
3. 填写计划人数：5
4. 不点击"快速排休"按钮
5. 直接点击"保存排班规划"

**预期结果**：
```
=== 排班人员统计 ===
{
  总员工数: 10,
  计划上岗人数: 5,
  实际排休人数: 0,  // ✅ 没有选择排休员工
  排休员工IDs: [],
  排休员工名单: []
}
```

**界面显示**：
- 上岗人数：5人
- 排休人数：0人 ✅（正确显示）
- 兼职人数：0人

### 测试场景3：修改排休员工
1. 进入排班规划页面
2. 填写预估营收：10000
3. 填写计划人数：5
4. 点击"快速排休"，选择3个员工
5. 点击"确认排休"
6. 再次点击"快速排休"，取消1个员工的选择
7. 点击"确认排休"
8. 点击"保存排班规划"

**预期结果**：
```
=== 排班人员统计 ===
{
  总员工数: 10,
  计划上岗人数: 5,
  实际排休人数: 2,  // ✅ 显示修改后的2人
  排休员工IDs: ["id1", "id2"],
  排休员工名单: ["张三", "李四"]
}
```

**界面显示**：
- 上岗人数：5人
- 排休人数：2人 ✅（正确显示修改后的数量）
- 兼职人数：0人

## 相关代码位置

### 修复位置
- **文件**：`src/pages/schedule-planning/index.tsx`
- **行号**：第295行
- **函数**：`handleSave`

### 相关逻辑
1. **排休员工选择**（第525-532行）：
   ```typescript
   const toggleRestEmployee = (employeeId: string) => {
     setRestEmployeeIds((prev) => {
       if (prev.includes(employeeId)) {
         return prev.filter((id) => id !== employeeId)
       }
       return [...prev, employeeId]
     })
   }
   ```

2. **上岗员工过滤**（第306行）：
   ```typescript
   const workingEmployees = employees.filter((emp) => !restEmployeeIds.includes(emp.id))
   ```

3. **排班任务创建**（第403-432行）：
   ```typescript
   const workingEmployees = employees.filter((emp) => !restEmployeeIds.includes(emp.id))
   for (const employee of workingEmployees) {
     // 只为上岗员工创建排班任务
   }
   ```

4. **排休人数显示**（第924-929行）：
   ```typescript
   <View className="flex items-center justify-between mt-1">
     <Text className="text-xs text-blue-600">排休人数</Text>
     <Text className="text-xs font-semibold text-blue-800">
       {scheduleResult.rest_staff_count} 人
     </Text>
   </View>
   ```

## 数据流程图

```
用户操作
  ↓
点击"快速排休" → 选择员工 → 更新restEmployeeIds
  ↓
点击"保存排班规划"
  ↓
计算排休人数：restStaffCount = restEmployeeIds.length
  ↓
保存到数据库：schedule_results.rest_staff_count
  ↓
从数据库读取：scheduleResult.rest_staff_count
  ↓
界面显示：{scheduleResult.rest_staff_count} 人
```

## 注意事项

1. **数据一致性**：
   - 排休人数必须与实际选择的排休员工数量一致
   - 上岗员工数量 = 总员工数 - 排休员工数量
   - 排班任务只为上岗员工创建

2. **用户体验**：
   - 用户选择排休员工后，立即在界面上反馈
   - 保存后，排休人数应该正确显示
   - 修改排休员工后，数据应该实时更新

3. **边界情况**：
   - 如果用户不选择排休员工，排休人数应该为0
   - 如果用户选择所有员工排休，排休人数应该等于总员工数
   - 如果用户修改排休员工，排休人数应该实时更新

## 总结

本次修复解决了排休人数显示不正确的问题：
1. ✅ 修复了排休人数的计算逻辑
2. ✅ 使用实际选择的排休员工数量
3. ✅ 确保数据一致性
4. ✅ 添加了详细的调试日志
5. ✅ 提供了完整的测试场景

修复后，排休人数将正确反映用户的选择，并在界面上正确显示。
