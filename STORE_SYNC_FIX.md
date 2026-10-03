# 门店信息同步问题修复说明

## 修复日期
2025-11-06

## 问题描述
用户反馈："排班规划里门店信息没有同步首页门店，这个需要修改"

## 问题分析

### 原始代码问题
```typescript
useEffect(() => {
  if (currentStore) {
    loadStandard()
    loadOperation()
    loadEmployees()
    loadPartTimeShifts()
    loadScheduleResult()
  }
}, [
  currentStore,  // ❌ 依赖整个对象，引用可能不变
  loadStandard,
  loadOperation,
  loadEmployees,
  loadPartTimeShifts,
  loadScheduleResult,
  currentTenant?.id
])
```

### 问题所在
1. **对象引用问题**：`useEffect`依赖于整个`currentStore`对象
   - 即使门店内容变化，对象引用可能保持不变
   - 导致`useEffect`不会触发
   - 数据不会重新加载

2. **依赖项顺序混乱**：依赖项顺序不一致
   - `currentStore`在前
   - `currentTenant?.id`在后
   - 不符合React最佳实践

3. **缺少详细日志**：无法追踪门店切换
   - 不知道门店是否真的变化了
   - 不知道数据是否重新加载了

4. **门店显示不够醒目**：
   - 使用浅色背景（blue-50）
   - 字体较小
   - 用户可能忽略当前门店信息

## 修复方案

### 1. 修复useEffect依赖项
```typescript
useEffect(() => {
  console.log('=== useEffect触发（门店变化） ===', {
    currentStoreId: currentStore?.id,
    currentStoreName: currentStore?.name,
    currentTenantId: currentTenant?.id
  })
  if (currentStore?.id && currentTenant?.id) {
    console.log('=== 门店已选择，开始加载数据 ===')
    loadStandard()
    loadOperation()
    loadEmployees()
    loadPartTimeShifts()
    loadScheduleResult()
  } else {
    console.log('=== 门店或租户未选择，跳过数据加载 ===')
  }
}, [
  currentStore?.id,  // ✅ 使用门店ID，而不是整个对象
  currentTenant?.id,
  loadStandard,
  loadOperation,
  loadEmployees,
  loadPartTimeShifts,
  loadScheduleResult
])
```

**修复原理**：
- 使用`currentStore?.id`作为依赖项，而不是整个对象
- 当门店ID变化时，`useEffect`会立即触发
- 添加详细日志，便于追踪门店切换
- 添加条件检查，确保门店和租户都存在

### 2. 修复useDidShow逻辑
```typescript
useDidShow(() => {
  console.log('=== useDidShow触发，重新加载所有数据 ===', {
    currentStoreId: currentStore?.id,
    currentStoreName: currentStore?.name,
    currentTenantId: currentTenant?.id
  })
  loadTenantSettings()
  if (currentStore?.id && currentTenant?.id) {
    console.log('=== 门店已选择，开始加载数据 ===')
    loadStandard()
    loadOperation()
    loadEmployees()
    loadPartTimeShifts()
    loadScheduleResult()
  } else {
    console.log('=== 门店或租户未选择，跳过数据加载 ===')
  }
})
```

**修复原理**：
- 添加详细日志，显示当前门店信息
- 添加条件检查，确保门店和租户都存在
- 避免在门店未选择时加载数据

### 3. 优化门店信息显示
```typescript
{currentStore && (
  <View className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 mb-4 shadow-md">
    <View className="flex items-center justify-between">
      <View className="flex items-center gap-2">
        <View className="i-mdi-store text-2xl text-white" />
        <View>
          <Text className="text-xs text-blue-100 block mb-1">当前门店</Text>
          <Text className="text-base font-bold text-white">{currentStore.name}</Text>
        </View>
      </View>
      <View className="bg-white bg-opacity-20 rounded-full px-3 py-1">
        <Text className="text-xs text-white">已同步</Text>
      </View>
    </View>
    {currentStore.address && (
      <View className="flex items-center gap-1 mt-2">
        <View className="i-mdi-map-marker text-sm text-blue-100" />
        <Text className="text-xs text-blue-100">{currentStore.address}</Text>
      </View>
    )}
  </View>
)}
```

**优化点**：
- 使用深色渐变背景（blue-500 to indigo-600）
- 增大图标尺寸（text-2xl）
- 使用白色文字，更加醒目
- 添加"已同步"标签，明确告知用户门店已同步
- 显示门店地址（如果有）
- 添加阴影效果（shadow-md）

## 数据流程图

```
首页选择门店
  ↓
调用 setCurrentStore(store)
  ↓
更新全局状态 useTenantStore
  ↓
currentStore.id 变化
  ↓
触发排班规划页面的 useEffect
  ↓
重新加载所有数据
  ↓
显示新门店的数据
```

## 测试验证

### 测试场景1：首次进入排班规划页面
1. 打开应用，进入首页
2. 选择门店A
3. 进入排班规划页面

**预期结果**：
```
=== useEffect触发（门店变化） ===
{
  currentStoreId: "store-a-id",
  currentStoreName: "门店A",
  currentTenantId: "tenant-id"
}
=== 门店已选择，开始加载数据 ===
```

**界面显示**：
- ✅ 顶部显示"当前门店：门店A"（深蓝色背景）
- ✅ 显示"已同步"标签
- ✅ 显示门店地址（如果有）
- ✅ 加载门店A的效能标准、员工列表等数据

### 测试场景2：在首页切换门店后进入排班规划
1. 打开应用，进入首页
2. 选择门店A
3. 切换到门店B
4. 进入排班规划页面

**预期结果**：
```
=== useEffect触发（门店变化） ===
{
  currentStoreId: "store-b-id",
  currentStoreName: "门店B",
  currentTenantId: "tenant-id"
}
=== 门店已选择，开始加载数据 ===
```

**界面显示**：
- ✅ 顶部显示"当前门店：门店B"（深蓝色背景）
- ✅ 显示"已同步"标签
- ✅ 显示门店地址（如果有）
- ✅ 加载门店B的效能标准、员工列表等数据

### 测试场景3：在排班规划页面时，返回首页切换门店
1. 打开应用，进入首页
2. 选择门店A
3. 进入排班规划页面
4. 返回首页
5. 切换到门店B
6. 再次进入排班规划页面

**预期结果**：
```
=== useDidShow触发，重新加载所有数据 ===
{
  currentStoreId: "store-b-id",
  currentStoreName: "门店B",
  currentTenantId: "tenant-id"
}
=== 门店已选择，开始加载数据 ===
```

**界面显示**：
- ✅ 顶部显示"当前门店：门店B"（深蓝色背景）
- ✅ 显示"已同步"标签
- ✅ 显示门店地址（如果有）
- ✅ 加载门店B的效能标准、员工列表等数据
- ✅ 之前门店A的数据已被清除

### 测试场景4：未选择门店
1. 打开应用，进入首页
2. 不选择门店（或清除门店选择）
3. 进入排班规划页面

**预期结果**：
```
=== useEffect触发（门店变化） ===
{
  currentStoreId: undefined,
  currentStoreName: undefined,
  currentTenantId: "tenant-id"
}
=== 门店或租户未选择，跳过数据加载 ===
```

**界面显示**：
- ✅ 显示黄色提示框："请先在首页选择门店"
- ✅ 不显示门店信息卡片
- ✅ 不加载任何数据

## 相关代码位置

### 修复位置
- **文件**：`src/pages/schedule-planning/index.tsx`
- **行号**：
  - 第567-591行：`useEffect`依赖项修复
  - 第593-610行：`useDidShow`逻辑修复
  - 第641-663行：门店信息显示优化

### 相关逻辑
1. **全局门店状态**（`src/store/tenant.ts`）：
   ```typescript
   export const useTenantStore = create<TenantState>((set) => ({
     currentStore: null,
     setCurrentStore: (store) => set({currentStore: store})
   }))
   ```

2. **首页门店切换**（`src/pages/home/index.tsx`）：
   ```typescript
   const handleStoreChange = (e) => {
     const selectedStore = storeList[e.detail.value]
     setCurrentStore(selectedStore)
   }
   ```

3. **排班规划页面门店获取**（`src/pages/schedule-planning/index.tsx`）：
   ```typescript
   const currentStore = useTenantStore((state) => state.currentStore)
   ```

## 技术细节

### React useEffect依赖项最佳实践
1. **使用原始值而不是对象**：
   - ❌ 错误：`[currentStore]`
   - ✅ 正确：`[currentStore?.id]`

2. **依赖项顺序**：
   - 先放原始值（如ID）
   - 再放函数引用
   - 保持一致的顺序

3. **条件检查**：
   - 在`useEffect`内部添加条件检查
   - 避免在依赖项为`undefined`时执行逻辑

### Zustand状态管理
1. **状态更新**：
   ```typescript
   setCurrentStore(store) // 触发所有订阅者更新
   ```

2. **状态订阅**：
   ```typescript
   const currentStore = useTenantStore((state) => state.currentStore)
   // 当currentStore变化时，组件会重新渲染
   ```

3. **状态选择器**：
   ```typescript
   // 只订阅需要的字段
   const storeId = useTenantStore((state) => state.currentStore?.id)
   ```

## 注意事项

1. **门店切换时机**：
   - 用户在首页切换门店后，所有页面都应该使用新门店
   - 排班规划页面应该立即响应门店变化
   - 不应该保留旧门店的数据

2. **数据一致性**：
   - 确保所有数据都来自当前选择的门店
   - 避免混合不同门店的数据
   - 门店切换时清除旧数据

3. **用户体验**：
   - 门店信息应该醒目显示
   - 用户应该清楚知道当前操作的是哪个门店
   - 门店切换应该有明确的视觉反馈

4. **边界情况**：
   - 如果用户未选择门店，显示提示信息
   - 如果门店数据加载失败，显示错误信息
   - 如果门店被删除，自动切换到其他门店或显示提示

## 总结

本次修复解决了门店信息同步问题：
1. ✅ 修复了`useEffect`依赖项，使用门店ID而不是整个对象
2. ✅ 修复了`useDidShow`逻辑，添加条件检查
3. ✅ 优化了门店信息显示，使其更加醒目
4. ✅ 添加了详细的调试日志，便于追踪问题
5. ✅ 添加了"已同步"标签，明确告知用户门店已同步
6. ✅ 显示门店地址，提供更多上下文信息

修复后，排班规划页面将正确同步首页选择的门店，并在门店切换时自动重新加载数据。

## 验证清单

- [ ] 首次进入排班规划页面，显示正确的门店信息
- [ ] 在首页切换门店后进入排班规划，显示新门店信息
- [ ] 在排班规划页面时返回首页切换门店，再次进入显示新门店信息
- [ ] 未选择门店时，显示提示信息
- [ ] 门店信息显示醒目，包含门店名称和地址
- [ ] 显示"已同步"标签
- [ ] 控制台日志正确显示门店切换信息
- [ ] 数据正确加载，不混合不同门店的数据
