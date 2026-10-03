# 效能标准配置保存问题修复说明

## 问题描述

用户在效能配置页面保存配置后，系统显示"保存成功"，但在排班规划页面仍然显示"未配置效能标准"。

## 问题原因

### 技术背景

1. **数据库表结构**：`efficiency_standards`表有一个唯一约束`UNIQUE(tenant_id, store_id)`
2. **租户级别配置**：当配置应用于整个租户时，`store_id`字段为`NULL`
3. **Supabase upsert问题**：Supabase的`upsert`操作在处理包含NULL值的唯一约束时存在问题

### 具体原因

在PostgreSQL中，`NULL != NULL`，这意味着：
- 多个`store_id`为`NULL`的记录可以共存（不违反唯一约束）
- 但Supabase的`upsert`操作使用`onConflict: 'tenant_id,store_id'`时，无法正确识别和更新`store_id`为`NULL`的记录
- 这导致每次保存都可能创建新记录，而不是更新现有记录

## 解决方案

### 修改前的代码

```typescript
export async function upsertEfficiencyStandard(standard: Partial<EfficiencyStandard>) {
  const cleanedStandard = {
    ...standard,
    store_id: standard.store_id || null,
    updated_at: new Date().toISOString()
  }

  const {data, error} = await supabase
    .from('efficiency_standards')
    .upsert(cleanedStandard, {
      onConflict: 'tenant_id,store_id'  // 这里对NULL值处理有问题
    })
    .select()
    .maybeSingle()

  return data
}
```

### 修改后的代码

```typescript
export async function upsertEfficiencyStandard(standard: Partial<EfficiencyStandard>) {
  const cleanedStandard = {
    ...standard,
    store_id: standard.store_id || null,
    updated_at: new Date().toISOString()
  }

  // 先查询是否已存在
  let query = supabase
    .from('efficiency_standards')
    .select('id')
    .eq('tenant_id', cleanedStandard.tenant_id!)

  if (cleanedStandard.store_id) {
    query = query.eq('store_id', cleanedStandard.store_id)
  } else {
    query = query.is('store_id', null)  // 明确处理NULL值
  }

  const {data: existing} = await query.maybeSingle()

  if (existing) {
    // 更新现有记录
    const {data, error} = await supabase
      .from('efficiency_standards')
      .update(cleanedStandard)
      .eq('id', existing.id)
      .select()
      .maybeSingle()
    return data
  } else {
    // 插入新记录
    const {data, error} = await supabase
      .from('efficiency_standards')
      .insert(cleanedStandard)
      .select()
      .maybeSingle()
    return data
  }
}
```

### 关键改进

1. **显式查询**：先查询是否存在匹配的记录，使用`.is('store_id', null)`明确处理NULL值
2. **条件更新/插入**：根据查询结果决定是更新还是插入
3. **详细日志**：添加了详细的调试日志，便于追踪问题

## 调试日志

为了便于追踪问题，我们在以下位置添加了详细的日志：

### 1. 保存配置时（`upsertEfficiencyStandard`）

```typescript
console.log('准备保存效能标准配置:', cleanedStandard)
console.log('查询已存在的配置:', existing)
console.log('更新现有配置，ID:', existing.id)  // 或 '插入新配置'
console.log('保存效能标准配置成功:', result)
```

### 2. 加载租户配置时（`getTenantEfficiencyStandard`）

```typescript
console.log('getTenantEfficiencyStandard: 查询租户级别配置', {tenantId})
console.log('getTenantEfficiencyStandard: 查询结果', data)
```

### 3. 加载店铺配置时（`getStoreEfficiencyStandard`）

```typescript
console.log('getStoreEfficiencyStandard: 查询店铺级别配置', {tenantId, storeId})
console.log('getStoreEfficiencyStandard: 店铺级别查询结果', data)
console.log('getStoreEfficiencyStandard: 店铺无配置，尝试获取租户级别配置')
```

### 4. 排班规划页面加载配置时（`loadStandard`）

```typescript
console.log('loadStandard: 缺少必要参数', {tenantId, storeId})
console.log('loadStandard: 开始加载效能标准', {tenantId, storeId})
console.log('loadStandard: 加载结果', config)
```

## 测试建议

### 测试场景1：租户级别配置

1. 进入效能配置页面
2. 选择"租户默认配置"
3. 修改配置并保存
4. 查看控制台日志，确认：
   - `store_id`为`null`
   - 如果是首次保存，应该显示"插入新配置"
   - 如果是更新，应该显示"更新现有配置，ID: xxx"
5. 进入排班规划页面
6. 查看控制台日志，确认：
   - 成功加载租户级别配置
   - 不再显示"未配置效能标准"

### 测试场景2：店铺级别配置

1. 进入效能配置页面
2. 选择具体店铺
3. 修改配置并保存
4. 查看控制台日志，确认：
   - `store_id`为具体的UUID
   - 保存成功
5. 进入排班规划页面
6. 选择同一店铺
7. 查看控制台日志，确认：
   - 成功加载店铺级别配置
   - 不再显示"未配置效能标准"

### 测试场景3：配置继承

1. 只配置租户级别配置，不配置店铺级别配置
2. 进入排班规划页面
3. 选择任意店铺
4. 查看控制台日志，确认：
   - 先尝试加载店铺级别配置（返回null）
   - 然后加载租户级别配置（返回配置数据）
   - 不再显示"未配置效能标准"

## 相关文件

- `src/db/api.ts`：数据库API函数
- `src/pages/efficiency-config/index.tsx`：效能配置页面
- `src/pages/schedule-planning/index.tsx`：排班规划页面
- `supabase/migrations/03_efficiency_standards_and_operations.sql`：数据库表定义

## 版本信息

- 修复版本：v2.24.1
- 修复日期：2025-11-06
