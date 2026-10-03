# Bug 修复总结

## 问题描述
在开发员工入职和离职管理模块时，IDE 显示以下错误：
```
[plugin:vite:import-analysis] Failed
"src/db/modules/resignation.ts". Do...
import _regenerator from "//wo...
import _asyncToGenerator from "...
```

## 问题原因
导入路径错误。新创建的模块文件使用了错误的 supabase 导入路径：
- ❌ 错误：`import {supabase} from '../supabase'`
- ✅ 正确：`import {supabase} from '@/client/supabase'`

supabase 客户端实际位于 `src/client/supabase.ts`，而不是 `src/db/supabase.ts`。

## 修复内容

### 1. 修复 resignation.ts
**文件**：`src/db/modules/resignation.ts`
**修改**：第3行导入语句
```typescript
// 修改前
import {supabase} from '../supabase'

// 修改后
import {supabase} from '@/client/supabase'
```

### 2. 修复 onboarding.ts
**文件**：`src/db/modules/onboarding.ts`
**修改**：第3行导入语句
```typescript
// 修改前
import {supabase} from '../supabase'

// 修改后
import {supabase} from '@/client/supabase'
```

## 验证结果
✅ 所有文件导入路径正确
✅ 代码语法检查通过
✅ 没有编译错误
✅ 模块可以正常导入和使用

## 注意事项
在项目中导入 supabase 客户端时，始终使用：
```typescript
import {supabase} from '@/client/supabase'
```

不要使用相对路径，因为 supabase.ts 文件位于 `src/client/` 目录下。
