# 门店选择功能实现总结

## 已完成的修改

### 1. ✅ 全局门店状态管理 (src/store/tenant.ts)
- 添加了 `currentStore` 状态用于存储当前选择的门店
- 添加了 `setCurrentStore` 方法用于设置当前门店
- 修改了 `clearTenantContext` 方法，清空时也清空门店状态

### 2. ✅ 首页门店选择功能 (src/pages/home/index.tsx)
- 添加了门店选择器UI组件
- 实现了 `loadStores` 方法加载门店列表
- 实现了 `handleStoreChange` 方法处理门店选择
- 添加了门店信息显示区域
- 添加了未选择门店时的提示界面
- 修改了数据加载逻辑，必须选择门店后才加载数据
- **修复了React Hooks规则违规问题**：移除了在hooks之后的early return，改用条件渲染

### 3. ✅ 员工管理页面 (src/pages/employees/index.tsx)
- 删除了门店选择器，改为使用全局门店
- 添加了当前门店显示区域
- 修改了数据加载逻辑，使用 `currentStore` 替代 `stores[selectedStoreIndex]`
- 删除了门店筛选功能，只保留员工类型和部门筛选
- 添加了未选择门店时的提示

### 4. ✅ 排班规划页面 (src/pages/schedule-planning/index.tsx)
- 删除了门店选择器，改为使用全局门店
- 添加了当前门店显示区域
- 删除了 `loadStores` 函数
- 删除了 `stores` 和 `selectedStoreIndex` 状态
- 修改了所有使用 `stores[selectedStoreIndex]` 的地方，改为使用 `currentStore`
- 修改了 `useEffect` 和 `useDidShow` 钩子，删除了 `loadStores` 调用
- 添加了未选择门店时的提示界面
- **修复了JSX结构错误**：正确闭合了所有Fragment和条件渲染

### 5. ✅ 排班结果表结构验证
- 确认了 `schedule_results` 表已包含 `total_labor_cost` 字段（当日排班薪酬）
- 确认了保存排班的逻辑正确计算并保存了薪酬数据：
  - 计算上岗员工的日薪总和（基于月薪/30天）
  - 计算兼职成本（基于工时和时薪）
  - 计算总人力成本 = 正式员工成本 + 兼职成本
  - 计算人力成本率 = (总人力成本 / 预估营收) × 100%
  - 判断成本是否合格（人力成本率 ≤ 30%）

## 功能说明

### 门店选择流程
1. 用户在首页选择品牌后，会看到门店选择器
2. 选择门店后，门店信息会保存到全局状态
3. 所有其他页面（员工管理、排班规划等）都会使用这个全局门店
4. 如果用户没有选择门店，相关页面会显示提示信息

### 排班薪酬计算
1. 正式员工成本：根据员工的月薪计算日薪（月薪/30天），然后累加所有上岗员工的日薪
2. 兼职成本：根据兼职记录的工时和时薪计算（工时 × 时薪）
3. 总人力成本：正式员工成本 + 兼职成本
4. 人力成本率：(总人力成本 / 预估营收) × 100%
5. 成本合格判断：人力成本率 ≤ 30%

## 数据库表结构

### schedule_results 表字段
- `total_labor_cost`: 人力成本总额（当日排班薪酬）
- `labor_cost_rate`: 人力成本率（百分比）
- `is_cost_qualified`: 成本是否合格（布尔值）
- 其他字段：预估营收、目标人数、计划人数、排休人数、兼职人数、兼职工时、达成率、营收区间等

## 代码质量
- ✅ 所有代码通过 `pnpm run lint` 检查
- ✅ TypeScript 类型检查通过
- ✅ 没有语法错误
- ✅ JSX 结构正确
- ✅ 遵循React Hooks规则

## 重要修复

### React Hooks规则修复
在首页中，原本有一个在hooks之后的early return检查：
```typescript
// ❌ 错误：在hooks之后使用early return
useDidShow(() => { ... })

if (!currentTenant) {
  return null
}
```

修复为使用条件渲染：
```typescript
// ✅ 正确：使用条件渲染
return (
  <View>
    {!currentTenant ? (
      <View>请先选择租户</View>
    ) : (
      <>
        {/* 所有内容 */}
      </>
    )}
  </View>
)
```

这个修复解决了"404 page not found"的黑屏问题。

## 注意事项
1. 员工管理页面不再有门店选择入口，完全依赖首页选择的门店
2. 所有功能都以首页选择的门店为准，确保数据一致性
3. 排班结果表已包含完整的薪酬计算数据，可用于成本分析和报表
4. 必须遵循React Hooks规则：所有hooks必须在条件判断和early return之前调用
