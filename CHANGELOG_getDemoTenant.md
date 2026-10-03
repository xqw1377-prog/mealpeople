# getDemoTenant 函数优化

## 修改时间
2025-11-06

## 修改内容

### 问题描述
原 `getDemoTenant` 函数使用 `name='体验租户'` 作为查询条件，这种方式依赖于租户名称的硬编码，不够灵活且容易出错。

### 解决方案
将查询条件从 `name='体验租户'` 改为 `is_demo=true`，使用专门的布尔字段来标识体验租户。

### 修改文件

#### 1. src/db/modules/tenant.ts
**修改前**：
```typescript
export async function getDemoTenant(): Promise<Tenant | null> {
  const {data, error} = await supabase
    .from('tenants')
    .select('*')
    .eq('name', '体验租户')  // ❌ 硬编码名称
    .eq('status', 'active')
    .maybeSingle()
  // ...
}
```

**修改后**：
```typescript
export async function getDemoTenant(): Promise<Tenant | null> {
  const {data, error} = await supabase
    .from('tenants')
    .select('*')
    .eq('is_demo', true)  // ✅ 使用布尔字段
    .eq('status', 'active')
    .maybeSingle()
  // ...
}
```

#### 2. src/db/types.ts
**修改前**：
```typescript
export interface Tenant {
  id: string
  name: string
  // ... 其他字段
  created_at: string
  updated_at: string
}
```

**修改后**：
```typescript
export interface Tenant {
  id: string
  name: string
  // ... 其他字段
  is_demo: boolean // ✅ 新增字段
  created_at: string
  updated_at: string
}
```

## 优势

### 1. 更加灵活
- ✅ 不依赖租户名称
- ✅ 可以有多个体验租户
- ✅ 租户名称可以随意修改

### 2. 更加可靠
- ✅ 避免名称拼写错误
- ✅ 避免名称被意外修改
- ✅ 查询条件更明确

### 3. 更加规范
- ✅ 使用专门的标识字段
- ✅ 符合数据库设计最佳实践
- ✅ 便于后续扩展

## 数据库支持

`is_demo` 字段已在数据库迁移文件中定义：
- **文件**：`supabase/migrations/27_add_guest_role_part2.sql`
- **字段类型**：`boolean`
- **默认值**：`false`
- **测试数据**：已创建 `is_demo=true` 的测试餐厅

## 影响范围

### 直接影响
- ✅ `getDemoTenant()` 函数
- ✅ `Tenant` 类型定义

### 间接影响
- ✅ 登录页面（使用 getDemoTenant）
- ✅ 体验模式相关功能

### 无影响
- ✅ 其他租户查询功能
- ✅ 租户创建和更新功能
- ✅ 现有租户数据

## 测试建议

### 1. 功能测试
```typescript
// 测试获取体验租户
const demoTenant = await getDemoTenant()
console.log('体验租户:', demoTenant)
// 预期：返回 is_demo=true 的租户
```

### 2. 边界测试
```typescript
// 测试无体验租户的情况
// 1. 将所有租户的 is_demo 设为 false
// 2. 调用 getDemoTenant()
// 预期：返回 null
```

### 3. 多租户测试
```typescript
// 测试多个体验租户的情况
// 1. 创建多个 is_demo=true 的租户
// 2. 调用 getDemoTenant()
// 预期：返回第一个匹配的租户（使用 maybeSingle）
```

## 后续优化建议

### 1. 添加索引
```sql
-- 为 is_demo 字段添加索引，提升查询性能
CREATE INDEX idx_tenants_is_demo ON tenants(is_demo) WHERE is_demo = true;
```

### 2. 添加唯一约束（可选）
```sql
-- 如果只允许一个体验租户，可以添加唯一约束
CREATE UNIQUE INDEX idx_tenants_single_demo 
ON tenants(is_demo) 
WHERE is_demo = true;
```

### 3. 添加数据验证
```typescript
// 在创建租户时验证 is_demo 字段
export async function createTenant(data: CreateTenantInput) {
  // 如果是体验租户，检查是否已存在
  if (data.is_demo) {
    const existing = await getDemoTenant()
    if (existing) {
      throw new Error('体验租户已存在')
    }
  }
  // ... 创建逻辑
}
```

## 总结

本次优化将 `getDemoTenant` 函数的查询条件从硬编码的名称改为专门的布尔字段，提升了代码的灵活性、可靠性和规范性。修改简单、影响范围小、向后兼容，是一次成功的代码优化。

---

**修改状态**：✅ 已完成  
**测试状态**：✅ 类型检查通过  
**文档状态**：✅ 已更新
