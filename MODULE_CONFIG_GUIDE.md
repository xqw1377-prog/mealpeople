# 模块化配置系统使用指南

## 快速开始

### 1. 获取用户可访问的模块

```typescript
import { getUserModules } from '@/config/role-modules'

// 获取当前平台的模块
const modules = getUserModules('manager', 'mobile')

// 在页面中展示
<ModuleGrid modules={modules} columns={2} title="我的功能" />
```

### 2. 检查模块访问权限

```typescript
import { hasModuleAccess } from '@/config/role-modules'

// 在页面加载前检查权限
if (!hasModuleAccess(userRole, 'recruitment')) {
  Taro.showToast({
    title: '无权限访问',
    icon: 'none'
  })
  Taro.navigateBack()
  return
}
```

### 3. 检测当前平台

```typescript
import { getCurrentPlatform, isMobile, isWeb } from '@/utils/platform'

// 根据平台显示不同内容
if (isMobile()) {
  // 移动端逻辑
} else {
  // WEB端逻辑
}
```

---

## 常见场景

### 场景1：添加新功能模块

**步骤**：

1. 在 `src/config/role-modules.ts` 中添加模块定义：

```typescript
{
  id: 'new-module',
  name: '新功能',
  icon: 'i-mdi-star',
  path: '/pages/new-module/index',
  platform: 'mobile',  // 或 'web' 或 'both'
  description: '这是一个新功能模块'
}
```

2. 为相应角色添加权限：

```typescript
export const ROLE_MODULES: Record<UserRole, string[]> = {
  admin: [..., 'new-module'],
  manager: [..., 'new-module'],
  // ...
}
```

3. 创建页面文件：`src/pages/new-module/index.tsx`

4. 在 `app.config.ts` 中注册路由：

```typescript
const pages = [
  // ...
  'pages/new-module/index',
]
```

### 场景2：根据角色显示不同功能

```typescript
import { getUserModules } from '@/config/role-modules'
import { useTenantStore } from '@/store/tenant'

const MyComponent = () => {
  const currentUser = useTenantStore(state => state.currentUser)
  
  // 映射角色
  const userRole = currentUser?.role === 'tenant_admin' ? 'hr' : 'employee'
  
  // 获取模块
  const modules = getUserModules(userRole, 'mobile')
  
  return (
    <ModuleGrid modules={modules} columns={2} />
  )
}
```

### 场景3：按平台分组显示模块

```typescript
import { getModulesByPlatform } from '@/config/role-modules'

const { mobile, web, both } = getModulesByPlatform('manager')

// 分别展示不同平台的模块
<View>
  <Text>移动端模块</Text>
  <ModuleGrid modules={mobile} />
  
  <Text>WEB端模块</Text>
  <ModuleGrid modules={web} />
  
  <Text>双平台模块</Text>
  <ModuleGrid modules={both} />
</View>
```

---

## 角色说明

### admin（管理员）
- **权限**：全部功能
- **使用场景**：系统管理、全局配置

### hr（HR）
- **权限**：HR管理功能 + 基础工作功能
- **使用场景**：招聘、入职、离职、员工档案管理
- **主要平台**：WEB端

### manager（管理者）
- **权限**：团队管理功能
- **使用场景**：团队管理、任务分配、审批
- **主要平台**：移动端

### employee（员工）
- **权限**：基础工作功能
- **使用场景**：日常工作、学习成长
- **主要平台**：移动端

---

## 平台说明

### mobile（移动端）
- 微信小程序
- H5（移动设备）
- 特点：简洁、快速、触控友好

### web（WEB端）
- H5（桌面浏览器）
- 特点：信息密度高、复杂操作、数据分析

### both（双平台）
- 同时支持移动端和WEB端
- 特点：通用功能、跨平台一致

---

## API参考

### getUserModules

获取用户可访问的模块列表

```typescript
function getUserModules(
  role: UserRole,
  platform?: 'mobile' | 'web'
): ModuleConfig[]
```

**参数**：
- `role`: 用户角色
- `platform`: 平台类型（可选，默认为'mobile'）

**返回**：模块配置数组

### hasModuleAccess

检查用户是否有权限访问某个模块

```typescript
function hasModuleAccess(
  role: UserRole,
  moduleId: string
): boolean
```

**参数**：
- `role`: 用户角色
- `moduleId`: 模块ID

**返回**：是否有权限

### getModulesByPlatform

按平台分组获取模块

```typescript
function getModulesByPlatform(role: UserRole): {
  mobile: ModuleConfig[]
  web: ModuleConfig[]
  both: ModuleConfig[]
}
```

**参数**：
- `role`: 用户角色

**返回**：按平台分组的模块对象

### getCurrentPlatform

获取当前平台类型

```typescript
function getCurrentPlatform(): 'mobile' | 'web'
```

**返回**：当前平台类型

### isMobile / isWeb

判断当前是否为移动端/WEB端

```typescript
function isMobile(): boolean
function isWeb(): boolean
```

**返回**：布尔值

---

## 最佳实践

### 1. 权限检查

在页面组件中使用 `useAuth` 和权限检查：

```typescript
import { useAuth } from 'miaoda-auth-taro'
import { hasModuleAccess } from '@/config/role-modules'

const MyPage = () => {
  const { user } = useAuth({ guard: true })
  const currentUser = useTenantStore(state => state.currentUser)
  
  // 检查权限
  useEffect(() => {
    if (!hasModuleAccess(currentUser?.role, 'module-id')) {
      Taro.showToast({
        title: '无权限访问',
        icon: 'none'
      })
      Taro.navigateBack()
    }
  }, [currentUser])
  
  // ...
}
```

### 2. 平台适配

根据平台显示不同内容：

```typescript
import { isMobile, isWeb } from '@/utils/platform'

const MyComponent = () => {
  return (
    <View>
      {isMobile() && (
        <View>移动端内容</View>
      )}
      
      {isWeb() && (
        <View>WEB端内容</View>
      )}
    </View>
  )
}
```

### 3. 模块展示

使用 `ModuleGrid` 组件展示模块：

```typescript
import ModuleGrid from '@/components/module-grid'
import { getUserModules } from '@/config/role-modules'

const MyPage = () => {
  const modules = getUserModules('manager', 'mobile')
  
  return (
    <ModuleGrid 
      modules={modules}
      columns={2}
      title="我的功能"
    />
  )
}
```

---

## 故障排查

### 问题1：模块不显示

**可能原因**：
1. 角色没有该模块的权限
2. 平台类型不匹配
3. 模块ID拼写错误

**解决方法**：
1. 检查 `ROLE_MODULES` 配置
2. 检查模块的 `platform` 属性
3. 检查模块ID是否正确

### 问题2：权限检查失败

**可能原因**：
1. 用户角色未正确映射
2. 模块ID不存在

**解决方法**：
1. 确认角色映射逻辑
2. 检查模块是否在 `ALL_MODULES` 中定义

### 问题3：平台检测不准确

**可能原因**：
1. 浏览器User Agent特殊
2. 屏幕尺寸边界情况

**解决方法**：
1. 查看 `platform.ts` 中的检测逻辑
2. 根据实际情况调整判断条件

---

## 更多信息

- 详细架构说明：[ARCHITECTURE.md](./ARCHITECTURE.md)
- 项目文档：[README.md](./README.md)
- 快速参考：[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

**最后更新**：2025-11-06  
**版本**：V3.16
