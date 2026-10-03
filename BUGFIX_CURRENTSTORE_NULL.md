# BUG修复：currentStore为null导致的错误

## 错误描述

**错误信息**：
```
TypeError: null is not an object (evaluating 'currentStore.id')
```

**错误位置**：
`/pages/schedule-planning/index.tsx:198:115`

**错误原因**：
在 `schedule-planning` 页面中，多个 `useCallback` 的依赖数组中直接使用了 `currentStore` 对象或 `currentStore.id`，而没有使用可选链操作符 `?.`。当 `currentStore` 为 `null` 时，React 在比较依赖项时会尝试访问 `currentStore.id`，导致报错。

## 问题分析

### 根本原因
React 的 `useCallback` 和 `useEffect` 在比较依赖项时，会访问依赖数组中的每个值。如果依赖数组中包含 `currentStore.id`，而 `currentStore` 为 `null`，就会抛出 `TypeError`。

### 受影响的代码位置

1. **第87行** - `loadStandard` 的依赖数组
   ```typescript
   // 错误写法
   }, [currentTenant?.id, currentStore])
   
   // 正确写法
   }, [currentTenant?.id, currentStore?.id])
   ```

2. **第108行** - `loadOperation` 的依赖数组
   ```typescript
   // 错误写法
   }, [currentTenant?.id, selectedDate, currentStore.id])
   
   // 正确写法
   }, [currentTenant?.id, selectedDate, currentStore?.id])
   ```

3. **第131行** - `loadEmployees` 的依赖数组
   ```typescript
   // 错误写法
   }, [currentStore.id, currentStore.name])
   
   // 正确写法
   }, [currentStore?.id, currentStore?.name])
   ```

4. **第138行** - `loadPartTimeShifts` 的依赖数组
   ```typescript
   // 错误写法
   }, [currentTenant?.id, selectedDate, currentStore.id])
   
   // 正确写法
   }, [currentTenant?.id, selectedDate, currentStore?.id])
   ```

## 修复方案

### 修复内容
在所有 `useCallback` 的依赖数组中，将 `currentStore.id` 和 `currentStore.name` 改为使用可选链操作符：
- `currentStore.id` → `currentStore?.id`
- `currentStore.name` → `currentStore?.name`
- `currentStore` → `currentStore?.id`（当只需要ID时）

### 修复后的代码

#### 1. loadStandard
```typescript
const loadStandard = useCallback(async () => {
  if (!currentTenant?.id || !currentStore?.id) {
    console.log('loadStandard: 缺少必要参数', {
      tenantId: currentTenant?.id,
      storeId: currentStore?.id
    })
    return
  }

  console.log('loadStandard: 开始加载效能标准', {
    tenantId: currentTenant?.id,
    storeId: currentStore.id
  })

  const config = await getStoreEfficiencyStandard(currentTenant?.id, currentStore.id)
  console.log('loadStandard: 加载结果', config)
  setStandard(config)
}, [currentTenant?.id, currentStore?.id]) // ✅ 修复：使用 currentStore?.id
```

#### 2. loadOperation
```typescript
const loadOperation = useCallback(async () => {
  if (!currentTenant?.id || !currentStore?.id || !selectedDate) return

  setLoading(true)
  try {
    const operation = await getDailyOperation(currentTenant?.id, currentStore.id, selectedDate)
    if (operation) {
      setEstimatedRevenue(operation.estimated_revenue?.toString() || '')
      setPlannedStaffCount(operation.planned_staff_count?.toString() || '')
      setPlannedPartTimeHours(operation.planned_part_time_hours?.toString() || '0')
    } else {
      setEstimatedRevenue('')
      setPlannedStaffCount('')
      setPlannedPartTimeHours('0')
    }
  } finally {
    setLoading(false)
  }
}, [currentTenant?.id, selectedDate, currentStore?.id]) // ✅ 修复：使用 currentStore?.id
```

#### 3. loadEmployees
```typescript
const loadEmployees = useCallback(async () => {
  if (!currentStore?.id) {
    console.log('=== loadEmployees: 缺少store_id，跳过加载 ===', {
      storeId: currentStore?.id
    })
    return
  }

  console.log('=== 开始加载员工数据 ===', {
    storeId: currentStore.id,
    storeName: currentStore.name
  })

  const employeeList = await getEmployeesByStoreId(currentStore.id)
  console.log('=== 员工数据加载完成 ===', {
    员工数量: employeeList.length,
    员工列表: employeeList
  })

  setEmployees(employeeList)
}, [currentStore?.id, currentStore?.name]) // ✅ 修复：使用 currentStore?.id 和 currentStore?.name
```

#### 4. loadPartTimeShifts
```typescript
const loadPartTimeShifts = useCallback(async () => {
  if (!currentTenant?.id || !currentStore?.id || !selectedDate) return
  const shifts = await getPartTimeShiftsByDate(currentTenant?.id, currentStore.id, selectedDate)
  setPartTimeShifts(shifts)
}, [currentTenant?.id, selectedDate, currentStore?.id]) // ✅ 修复：使用 currentStore?.id
```

## 为什么这样修复

### React依赖数组的工作原理
React 在每次渲染时都会比较依赖数组中的值，以决定是否需要重新创建回调函数。比较过程使用 `Object.is()` 进行浅比较。

### 问题场景
```typescript
// 当 currentStore 为 null 时
const deps = [currentTenant?.id, currentStore.id]
//                                ^^^^^^^^^^^^^^
//                                这里会抛出 TypeError
```

### 解决方案
```typescript
// 使用可选链操作符
const deps = [currentTenant?.id, currentStore?.id]
//                                ^^^^^^^^^^^^^^^
//                                安全访问，返回 undefined 而不是抛出错误
```

## 测试验证

### 测试场景
1. ✅ 页面首次加载时，`currentStore` 为 `null`
2. ✅ 切换租户时，`currentStore` 可能暂时为 `null`
3. ✅ 切换门店时，`currentStore` 正常更新
4. ✅ 所有数据加载功能正常工作

### 验证结果
- ✅ 代码检查通过（`pnpm run lint`）
- ✅ 不再出现 `TypeError: null is not an object` 错误
- ✅ 页面可以正常加载和使用

## 最佳实践

### 1. 使用可选链操作符
在依赖数组中访问对象属性时，始终使用可选链操作符：
```typescript
// ❌ 错误
}, [user.id, store.name])

// ✅ 正确
}, [user?.id, store?.name])
```

### 2. 函数体内的空值检查
即使依赖数组使用了可选链，函数体内仍需要进行空值检查：
```typescript
const loadData = useCallback(async () => {
  // 必须的空值检查
  if (!currentStore?.id) return
  
  // 安全使用
  const data = await fetchData(currentStore.id)
}, [currentStore?.id]) // 依赖数组也使用可选链
```

### 3. 避免在依赖数组中使用整个对象
```typescript
// ❌ 不推荐：使用整个对象
}, [currentStore])

// ✅ 推荐：只使用需要的属性
}, [currentStore?.id, currentStore?.name])
```

原因：
- 使用整个对象会导致不必要的重新渲染
- 对象引用变化时，即使属性值没变，也会触发重新创建
- 使用具体属性可以更精确地控制依赖

## 相关文件

- **修复文件**：`src/pages/schedule-planning/index.tsx`
- **修复行数**：第87行、第108行、第131行、第138行

## 总结

这是一个典型的 React Hooks 依赖数组使用不当导致的错误。通过在依赖数组中使用可选链操作符，可以安全地处理可能为 `null` 或 `undefined` 的对象，避免运行时错误。

**核心要点**：
1. ✅ 依赖数组中使用可选链：`currentStore?.id`
2. ✅ 函数体内进行空值检查：`if (!currentStore?.id) return`
3. ✅ 避免使用整个对象作为依赖：使用具体属性
4. ✅ 保持依赖数组的精确性：只包含实际使用的值

修复完成后，系统运行稳定，不再出现 `currentStore` 相关的空值错误！🎉
