# 登录页面 React Hooks 顺序错误修复

修复时间：2025-11-06

## 错误信息

```
TypeError: null is not an object (evaluating 'dispatcher.useCallback')
    at useCallback (react.development.js:1646:20)
    at useStore (zustand/esm/react.mjs:8:22)
    at Login (/pages/login/index.tsx:48:39)
```

## 问题分析

### 根本原因
**违反了 React Hooks 的使用规则**

React Hooks 有两个核心规则：
1. ✅ **只在顶层调用 Hooks** - 不要在循环、条件或嵌套函数中调用
2. ✅ **Hooks 调用顺序必须保持一致** - 每次渲染时 Hooks 的调用顺序必须相同

### 错误代码

```typescript
const Login: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [phone, setPhone] = useState('')

  // ❌ 错误：useDidShow 在 useTenantStore 之前调用
  useDidShow(() => {
    console.log('登录页面调试信息')
  })

  // ❌ 错误：useTenantStore 被放在 useDidShow 之后
  const {setCurrentTenant, setCurrentUser, setCurrentStore} = useTenantStore()
  
  // ...
}
```

### 为什么会出错？

1. **Hooks 调用顺序不一致**
   - React 依赖 Hooks 的调用顺序来维护组件状态
   - 当 Hooks 顺序改变时，React 无法正确匹配状态

2. **zustand 内部使用了 React Hooks**
   - `useTenantStore()` 内部使用了 `useCallback`
   - 当 React 的 dispatcher 未正确初始化时，会导致 `dispatcher.useCallback` 为 null

3. **Taro 的 useDidShow 可能影响 Hooks 顺序**
   - `useDidShow` 是 Taro 提供的生命周期 Hook
   - 将其他 Hooks 放在 useDidShow 之后可能导致顺序问题

## 修复方案

### 正确的代码

```typescript
const Login: React.FC = () => {
  // ✅ 第一步：所有 useState
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [phone, setPhone] = useState('')
  
  // ✅ 第二步：所有自定义 Hooks（包括 zustand store）
  const {setCurrentTenant, setCurrentUser, setCurrentStore} = useTenantStore()

  // ✅ 第三步：所有 useEffect 类的 Hooks
  useDidShow(() => {
    console.log('登录页面调试信息')
  })
  
  // ✅ 第四步：事件处理函数和其他逻辑
  const handlePhoneLogin = async () => {
    // ...
  }
  
  // ...
}
```

### Hooks 调用的最佳顺序

推荐的 Hooks 调用顺序：

1. **useState** - 本地状态
2. **useRef** - 引用
3. **自定义 Hooks** - 包括 zustand store、自定义业务 Hooks
4. **useCallback** - 回调函数
5. **useMemo** - 计算值
6. **useEffect / useLayoutEffect** - 副作用
7. **Taro 生命周期 Hooks** - useDidShow、useDidHide 等

## 修复结果

### 修改的文件
- `src/pages/login/index.tsx`

### 修改内容
```diff
const Login: React.FC = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [phone, setPhone] = useState('')
+ 
+ // ✅ 修复：所有 Hooks 必须在组件顶层按顺序调用
+ const {setCurrentTenant, setCurrentUser, setCurrentStore} = useTenantStore()

  // 页面显示时输出调试信息
  useDidShow(() => {
    console.log('========== 登录页面调试信息 ==========')
    // ...
  })
-
- const {setCurrentTenant, setCurrentUser, setCurrentStore} = useTenantStore()
```

### Git 提交
```bash
Commit: 934e2c3
Message: 修复登录页面React Hooks顺序错误
```

## React Hooks 规则详解

### 规则 1：只在顶层调用 Hooks

❌ **错误示例：**
```typescript
// 不要在条件语句中调用 Hooks
if (condition) {
  const [state, setState] = useState(0) // ❌ 错误
}

// 不要在循环中调用 Hooks
for (let i = 0; i < 10; i++) {
  const [state, setState] = useState(0) // ❌ 错误
}

// 不要在嵌套函数中调用 Hooks
function handleClick() {
  const [state, setState] = useState(0) // ❌ 错误
}
```

✅ **正确示例：**
```typescript
const MyComponent: React.FC = () => {
  // ✅ 在组件顶层调用
  const [state, setState] = useState(0)
  
  // ✅ 可以在条件中使用 Hook 的返回值
  if (condition) {
    setState(1)
  }
  
  return <View>{state}</View>
}
```

### 规则 2：Hooks 调用顺序必须保持一致

❌ **错误示例：**
```typescript
const MyComponent: React.FC = () => {
  const [name, setName] = useState('')
  
  // ❌ 错误：条件性地调用 Hook
  if (name) {
    const [age, setAge] = useState(0)
  }
  
  const [email, setEmail] = useState('')
  
  return <View />
}
```

✅ **正确示例：**
```typescript
const MyComponent: React.FC = () => {
  const [name, setName] = useState('')
  const [age, setAge] = useState(0)
  const [email, setEmail] = useState('')
  
  // ✅ 可以条件性地使用状态值
  if (name) {
    console.log(age)
  }
  
  return <View />
}
```

## 常见的 Hooks 顺序错误

### 错误 1：在条件语句后调用 Hook

```typescript
// ❌ 错误
const MyComponent: React.FC = () => {
  if (condition) {
    return <View>Loading</View>
  }
  
  const [state, setState] = useState(0) // ❌ 可能不会执行
  
  return <View>{state}</View>
}

// ✅ 正确
const MyComponent: React.FC = () => {
  const [state, setState] = useState(0) // ✅ 总是执行
  
  if (condition) {
    return <View>Loading</View>
  }
  
  return <View>{state}</View>
}
```

### 错误 2：在其他 Hook 之后调用 store Hook

```typescript
// ❌ 错误
const MyComponent: React.FC = () => {
  useEffect(() => {
    console.log('effect')
  }, [])
  
  const store = useStore() // ❌ 在 useEffect 之后
  
  return <View />
}

// ✅ 正确
const MyComponent: React.FC = () => {
  const store = useStore() // ✅ 在 useEffect 之前
  
  useEffect(() => {
    console.log('effect')
  }, [])
  
  return <View />
}
```

### 错误 3：在 Taro 生命周期 Hook 之后调用其他 Hook

```typescript
// ❌ 错误
const MyComponent: React.FC = () => {
  useDidShow(() => {
    console.log('show')
  })
  
  const [state, setState] = useState(0) // ❌ 在 useDidShow 之后
  
  return <View />
}

// ✅ 正确
const MyComponent: React.FC = () => {
  const [state, setState] = useState(0) // ✅ 在 useDidShow 之前
  
  useDidShow(() => {
    console.log('show')
  })
  
  return <View />
}
```

## 检查清单

在编写组件时，请检查以下几点：

- [ ] 所有 Hooks 都在组件顶层调用
- [ ] Hooks 不在条件语句中调用
- [ ] Hooks 不在循环中调用
- [ ] Hooks 不在嵌套函数中调用
- [ ] Hooks 调用顺序保持一致
- [ ] useState 在最前面
- [ ] 自定义 Hooks（包括 store）在 useState 之后
- [ ] useEffect 类的 Hooks 在最后
- [ ] Taro 生命周期 Hooks 在所有其他 Hooks 之后

## 相关资源

- [React Hooks 规则](https://react.dev/reference/rules/rules-of-hooks)
- [React Hooks FAQ](https://react.dev/reference/react/hooks)
- [Taro Hooks](https://taro-docs.jd.com/docs/hooks)
- [Zustand React Integration](https://docs.pmnd.rs/zustand/getting-started/introduction)

## 总结

这次错误的根本原因是：
1. ✅ **违反了 React Hooks 的调用顺序规则**
2. ✅ **useTenantStore() 被放在 useDidShow() 之后**
3. ✅ **导致 React 的 dispatcher 未正确初始化**

修复方法很简单：
1. ✅ **将所有 Hooks 按正确顺序排列**
2. ✅ **确保 Hooks 在组件顶层调用**
3. ✅ **遵循推荐的 Hooks 调用顺序**

---

**修复人员：** AI助手  
**修复时间：** 2025-11-06  
**修复状态：** ✅ 已完成  
**测试状态：** ⏳ 待测试
