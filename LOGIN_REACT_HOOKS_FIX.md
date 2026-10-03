# 登录页面 React Hooks 错误修复

## 错误信息

```
TypeError: null is not an object (evaluating 'dispatcher.useCallback')
    at useCallback (/@fs/data/wechat/node_modules/.pnpm/react@18.3.1/node_modules/react/cjs/react.development.js:1646:20)
    at useStore (/@fs/data/wechat/node_modules/.pnpm/zustand@5.0.8_@types+react@18.3.24_immer@10.1.3_react@18.3.1/node_modules/zustand/esm/react.mjs:8:22)
    at Login (/pages/login/index.tsx:39:40)
```

## 问题分析

### 错误原因
1. **React Hooks 调用时机问题**
   - 在组件顶层直接调用 `useTenantStore` 可能导致 React 上下文问题
   - zustand 的 `useStore` 在某些情况下可能在 React 渲染周期之外被调用
   - 导致 `dispatcher.useCallback` 为 null

2. **调用链分析**
   ```
   Login 组件
   ↓
   useTenantStore (zustand)
   ↓
   useCallback (React)
   ↓
   dispatcher 为 null ❌
   ```

### 问题代码

```typescript
const Login: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isWeApp, setIsWeApp] = useState(false)

  // ❌ 问题：在组件顶层调用 useTenantStore
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant)
  const setCurrentUser = useTenantStore((state) => state.setCurrentUser)

  // ... 其他代码
}
```

## 修复方案

### 解决方法
使用 `useTenantStore.getState()` 在函数内部获取 store 方法，而不是在组件顶层使用 Hook。

### 修复后的代码

```typescript
const Login: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isWeApp, setIsWeApp] = useState(false)

  // ✅ 移除组件顶层的 useTenantStore 调用

  const handleLoginSuccess = async (user: any) => {
    if (isLoggingIn) return
    setIsLoggingIn(true)

    // ✅ 在函数内部使用 getState() 获取 store 方法
    const {setCurrentTenant, setCurrentUser} = useTenantStore.getState()

    try {
      // ... 登录处理逻辑
    } catch (error) {
      // ... 错误处理
    }
  }

  // ... 其他代码
}
```

## 技术说明

### zustand 的两种使用方式

1. **Hook 方式（组件内使用）**
   ```typescript
   const Login: React.FC = () => {
     // 在组件顶层使用，会订阅状态变化
     const currentTenant = useTenantStore((state) => state.currentTenant)
     
     // 组件会在 currentTenant 变化时重新渲染
   }
   ```

2. **getState 方式（函数内使用）**
   ```typescript
   const Login: React.FC = () => {
     const handleClick = () => {
       // 在函数内部使用，不会订阅状态变化
       const {currentTenant} = useTenantStore.getState()
       
       // 只是获取当前值，不会触发重新渲染
     }
   }
   ```

### 为什么使用 getState()？

1. **避免 React Hooks 规则限制**
   - `getState()` 不是 Hook，可以在任何地方调用
   - 不受 React Hooks 调用顺序和位置的限制

2. **性能优化**
   - 不会订阅状态变化
   - 不会导致组件重新渲染
   - 适合在事件处理函数中使用

3. **避免上下文问题**
   - 不依赖 React 的 dispatcher
   - 不会出现 "dispatcher is null" 错误

## 修复效果

### 修复前 ❌
- 登录页面加载时报错
- TypeError: null is not an object
- 无法正常登录

### 修复后 ✅
- 登录页面正常加载
- 登录功能正常工作
- 状态管理正常

## 相关文件

- `src/pages/login/index.tsx` - 登录页面（已修复）
- `src/store/tenant.ts` - 租户状态管理

## 测试验证

### 测试步骤
1. 打开登录页面
2. 确认页面正常加载，无错误
3. 输入手机号和验证码
4. 点击登录
5. 确认登录成功，跳转到首页

### 预期结果
- ✅ 页面加载无错误
- ✅ 登录流程正常
- ✅ 状态管理正常
- ✅ 页面跳转正常

## 经验总结

### 最佳实践

1. **组件顶层使用 Hook**
   - 只在需要订阅状态变化时使用
   - 会导致组件重新渲染

2. **函数内部使用 getState()**
   - 在事件处理函数中使用
   - 不需要订阅状态变化
   - 避免不必要的重新渲染

3. **避免的问题**
   - 不要在条件语句中使用 Hook
   - 不要在循环中使用 Hook
   - 不要在嵌套函数中使用 Hook（除非是自定义 Hook）

### 调试技巧

1. **检查调用栈**
   - 从底部向上查看
   - 找到第一个出错的位置

2. **检查 React 上下文**
   - 确认组件在 React 树中
   - 确认 Provider 正确设置

3. **使用 getState() 替代 Hook**
   - 在事件处理函数中
   - 在异步函数中
   - 在非组件函数中

## 修复时间

- 发现时间：2025-11-06
- 修复时间：2025-11-06
- 修复状态：✅ 已完成
- 测试状态：✅ 已通过

## 相关链接

- [zustand 文档](https://github.com/pmndrs/zustand)
- [React Hooks 规则](https://react.dev/reference/rules/rules-of-hooks)
- [React Context](https://react.dev/reference/react/useContext)
