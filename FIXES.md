# Bug Fixes Log

## 2025-11-06 - Export Issues Fixed

### Issue 1: Missing `updatePosition` Export

**问题描述**: 
- `recruitment-position-form/index.tsx` 导入 `updatePosition` 从 `api-lifecycle.ts`
- 函数存在但名称为 `updateRecruitmentPosition`，未以预期名称导出

**解决方案**:
在 `src/db/api-lifecycle.ts` 中添加别名导出：

```typescript
// 别名导出（兼容旧代码）
export const createPosition = createRecruitmentPosition
export const updatePosition = updateRecruitmentPosition
export const getPositions = getRecruitmentPositions
```

**修改文件**:
- `src/db/api-lifecycle.ts`

---

### Issue 2: Missing `getEmployees` Export

**问题描述**:
- `team-management/index.tsx` 导入 `getEmployees` 从 `api.ts`
- 函数存在但名称为 `getEmployeesByTenantId`，未以预期名称导出

**解决方案**:
在 `src/db/api.ts` 中添加别名导出：

```typescript
// 别名导出（兼容旧代码）
export {getEmployeesByTenantId as getEmployees} from './modules/user'
```

**修改文件**:
- `src/db/api.ts`

---

### Issue 3: Missing `updateResignationRequest` Export

**问题描述**:
- `resignation-detail/index.tsx` 导入 `updateResignationRequest` 从 `api-lifecycle.ts`
- 函数不存在，需要创建通用的更新函数

**解决方案**:
在 `src/db/api-lifecycle.ts` 中添加新函数：

```typescript
/**
 * 更新离职申请
 */
export async function updateResignationRequest(
  id: string,
  updates: Partial<ResignationRequest>
): Promise<ResignationRequest | null> {
  const {data, error} = await supabase
    .from('resignation_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新离职申请失败:', error)
    return null
  }

  return data
}
```

**修改文件**:
- `src/db/api-lifecycle.ts`

---

## 最佳实践

### 1. 统一命名规范

创建数据库API函数时，使用统一的命名规范：
- ✅ 推荐: `getEmployeesByTenantId`, `createRecruitmentPosition`
- ❌ 避免: 混用短名称（`getEmployees`）和长名称

### 2. 提供别名导出以保持兼容性

重构函数名称时，提供别名导出：

```typescript
// 新名称（推荐）
export async function getEmployeesByTenantId(tenantId: string) { ... }

// 别名（向后兼容）
export const getEmployees = getEmployeesByTenantId
```

### 3. 重构前检查导入

重命名导出函数前：
1. 搜索所有导入: `grep -r "import.*functionName" src/`
2. 更新所有导入语句
3. 或提供别名导出

### 4. TypeScript 编译检查

修改后始终运行 TypeScript 检查：

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "is not exported by"
```

### 5. 完整的CRUD操作

为每个资源提供完整的CRUD操作：
- ✅ Create: `createXxx`
- ✅ Read: `getXxx`, `getXxxById`
- ✅ Update: `updateXxx`
- ✅ Delete: `deleteXxx`

---

## 验证结果

所有导出问题已解决。未发现更多 "is not exported by" 错误。

**最后更新**: 2025-11-06  
**状态**: ✅ 全部修复完成

