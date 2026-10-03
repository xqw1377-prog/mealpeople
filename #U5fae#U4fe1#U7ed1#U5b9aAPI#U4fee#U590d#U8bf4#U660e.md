# 微信绑定 API 修复说明

## 📋 修复内容

修复 `src/db/api.ts` 中的 `bindWechatToProfile` 方法，将 fetch 请求改为支持微信小程序的 Taro 请求，同时使用用户的 JWT token 进行身份验证。

## 🔍 问题分析

### 原有问题

1. **不兼容微信小程序环境**
   - 使用了浏览器的 `fetch` API
   - 微信小程序不支持 `fetch`，需要使用 Taro.request

2. **安全性问题**
   - 使用了 `TARO_APP_SUPABASE_ANON_KEY`（匿名密钥）
   - 应该使用用户的 JWT token 进行身份验证
   - 匿名密钥权限过大，存在安全风险

3. **错误处理不完整**
   - fetch 的错误信息不适用于 Taro.request
   - 缺少会话验证

## ✅ 解决方案

### 1. 添加 Taro 导入

**修改文件：** `src/db/api.ts`

**添加导入：**
```typescript
import Taro from '@tarojs/taro'
```

### 2. 获取用户 JWT Token

**添加会话验证：**
```typescript
// 获取用户的 JWT token
const {
  data: {session}
} = await supabase.auth.getSession()

if (!session?.access_token) {
  console.error('=== 未找到用户会话 ===')
  return {success: false, message: '用户未登录，请先登录'}
}
```

**改进说明：**
- ✅ 从 Supabase 获取当前用户的会话
- ✅ 验证会话是否存在
- ✅ 提取用户的 JWT access_token
- ✅ 提供友好的错误提示

### 3. 使用 Taro.request 替代 fetch

**原有代码：**
```typescript
const response = await fetch(functionUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.TARO_APP_SUPABASE_ANON_KEY}` // ❌ 使用匿名密钥
  },
  body: JSON.stringify({code, userId})
})

// 需要手动解析 JSON
let result: any
try {
  result = await response.json()
} catch (parseError) {
  // 错误处理
}
```

**修复代码：**
```typescript
// 使用 Taro.request 替代 fetch
const response = await Taro.request({
  url: functionUrl,
  method: 'POST',
  header: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}` // ✅ 使用用户的 JWT token
  },
  data: {
    code,
    userId
  },
  timeout: 30000 // 30秒超时
})

// Taro.request 自动解析 JSON
const result = response.data
```

**改进说明：**
- ✅ 使用 Taro.request，兼容微信小程序和 H5
- ✅ 使用用户的 JWT token，提高安全性
- ✅ 自动解析 JSON 响应，简化代码
- ✅ 设置 30 秒超时，避免长时间等待
- ✅ 响应结构更简洁（response.data 直接是解析后的数据）

### 4. 适配响应结构

**原有代码：**
```typescript
console.log('=== Edge Function响应 ===', {
  status: response.status,
  statusText: response.statusText,
  ok: response.ok
})

if (!response.ok || !result.success) {
  // 错误处理
}
```

**修复代码：**
```typescript
console.log('=== Edge Function响应 ===', {
  statusCode: response.statusCode,
  data: response.data
})

// Taro.request 的响应结构不同于 fetch
const result = response.data

if (response.statusCode !== 200 || !result.success) {
  // 错误处理
}
```

**改进说明：**
- ✅ 使用 `response.statusCode` 替代 `response.status`
- ✅ 使用 `response.data` 替代 `response.json()`
- ✅ 适配 Taro.request 的响应结构
- ✅ 日志更清晰，便于调试

### 5. 优化错误处理

**原有代码：**
```typescript
if (errorMessage.includes('fetch')) {
  errorMessage = '网络请求失败，请检查网络连接'
}
```

**修复代码：**
```typescript
// 网络错误
if (errorMessage.includes('request:fail') || errorMessage.includes('network')) {
  errorMessage = '网络请求失败，请检查网络连接'
}
// 超时错误
if (errorMessage.includes('timeout')) {
  errorMessage = '请求超时，请重试'
}
```

**改进说明：**
- ✅ 适配 Taro.request 的错误信息格式
- ✅ 识别 `request:fail` 错误（Taro 特有）
- ✅ 识别网络错误和超时错误
- ✅ 提供更友好的错误提示

## 🔒 安全性提升

### 1. 使用用户 JWT Token

**安全优势：**
- ✅ **身份验证**：确保请求来自已登录的用户
- ✅ **权限控制**：JWT token 包含用户角色和权限信息
- ✅ **防止滥用**：匿名密钥可以被任何人使用，JWT token 只能由特定用户使用
- ✅ **审计追踪**：可以追踪是哪个用户发起的请求

### 2. 会话验证

**安全检查：**
```typescript
if (!session?.access_token) {
  console.error('=== 未找到用户会话 ===')
  return {success: false, message: '用户未登录，请先登录'}
}
```

**安全优势：**
- ✅ 确保用户已登录
- ✅ 防止未授权访问
- ✅ 提供明确的错误提示

### 3. 日志记录

**安全日志：**
```typescript
console.log('=== 调用Edge Function ===', {
  url: functionUrl,
  userId,
  codeLength: code.length,
  hasToken: !!session.access_token // 只记录是否有 token，不记录 token 内容
})
```

**安全优势：**
- ✅ 记录关键操作
- ✅ 不泄露敏感信息（token 内容）
- ✅ 便于安全审计

## 🔄 完整流程

### 微信绑定流程

```
1. 用户点击"绑定微信"按钮
   ↓
2. 调用 bindWechatToProfile(userId, code)
   ↓
3. 获取用户的 JWT token
   - 调用 supabase.auth.getSession()
   - 验证 session 是否存在
   - 提取 access_token
   ↓
4. 使用 Taro.request 调用 Edge Function
   - URL: /functions/v1/bind-wechat
   - Method: POST
   - Header: Authorization: Bearer {JWT_TOKEN}
   - Data: {code, userId}
   ↓
5. Edge Function 验证 JWT token
   - 验证 token 有效性
   - 验证用户权限
   - 验证 userId 匹配
   ↓
6. Edge Function 调用微信 API
   - 使用 code 换取 openid 和 unionid
   - 验证微信用户信息
   ↓
7. Edge Function 更新数据库
   - 更新 profiles 表
   - 保存 wechat_openid 和 wechat_unionid
   ↓
8. 返回绑定结果
   - 成功：{success: true, message: '绑定成功'}
   - 失败：{success: false, message: '错误信息'}
```

### 微信解绑流程

```
1. 用户点击"解绑微信"按钮
   ↓
2. 调用 bindWechatToProfile(userId, null)
   ↓
3. 直接更新数据库
   - 清空 wechat_openid
   - 清空 wechat_unionid
   ↓
4. 返回解绑结果
```

## 🧪 测试指南

### 测试场景 1：绑定微信

```
步骤1: 登录用户账号
步骤2: 进入个人设置页面
步骤3: 点击"绑定微信"按钮
步骤4: 授权微信登录
步骤5: 验证绑定成功提示
步骤6: 验证个人信息显示微信头像和昵称
```

**预期结果：**
- ✅ 显示"绑定成功"提示
- ✅ 个人信息显示微信头像
- ✅ 个人信息显示微信昵称
- ✅ 控制台日志显示完整流程

### 测试场景 2：解绑微信

```
步骤1: 登录已绑定微信的账号
步骤2: 进入个人设置页面
步骤3: 点击"解绑微信"按钮
步骤4: 确认解绑
步骤5: 验证解绑成功提示
步骤6: 验证个人信息不再显示微信信息
```

**预期结果：**
- ✅ 显示"解绑成功"提示
- ✅ 个人信息不再显示微信头像
- ✅ 个人信息不再显示微信昵称
- ✅ 可以重新绑定微信

### 测试场景 3：未登录状态

```
步骤1: 退出登录
步骤2: 尝试调用绑定接口
步骤3: 验证错误提示
```

**预期结果：**
- ✅ 显示"用户未登录，请先登录"提示
- ✅ 不会调用 Edge Function
- ✅ 不会泄露敏感信息

### 测试场景 4：网络错误

```
步骤1: 关闭网络连接
步骤2: 尝试绑定微信
步骤3: 验证错误提示
```

**预期结果：**
- ✅ 显示"网络请求失败，请检查网络连接"提示
- ✅ 不会崩溃
- ✅ 可以重试

### 测试场景 5：控制台日志验证

```
步骤1: 打开浏览器开发者工具
步骤2: 切换到Console标签
步骤3: 执行绑定操作
步骤4: 观察控制台输出
```

**预期日志：**
```
=== 开始绑定微信 === {userId: "xxx", hasCode: true}
=== 调用Edge Function === {url: "xxx", userId: "xxx", codeLength: 32, hasToken: true}
=== Edge Function响应 === {statusCode: 200, data: {success: true, message: "绑定成功"}}
=== 绑定成功 ===
```

## 📊 技术细节

### Taro.request vs fetch

| 特性 | fetch | Taro.request |
|------|-------|--------------|
| 微信小程序支持 | ❌ 不支持 | ✅ 支持 |
| H5 支持 | ✅ 支持 | ✅ 支持 |
| JSON 解析 | 手动 `response.json()` | 自动解析 `response.data` |
| 响应状态 | `response.status` | `response.statusCode` |
| 请求体 | `body: JSON.stringify(data)` | `data: {...}` |
| 请求头 | `headers: {...}` | `header: {...}` |
| 超时设置 | 需要额外配置 | `timeout: 30000` |

### JWT Token vs 匿名密钥

| 特性 | 匿名密钥 | JWT Token |
|------|----------|-----------|
| 安全性 | ⚠️ 低 | ✅ 高 |
| 身份验证 | ❌ 无 | ✅ 有 |
| 权限控制 | ⚠️ 固定权限 | ✅ 动态权限 |
| 审计追踪 | ❌ 无法追踪用户 | ✅ 可追踪用户 |
| 过期机制 | ❌ 永不过期 | ✅ 自动过期 |
| 适用场景 | 公开 API | 需要身份验证的 API |

### 响应结构对比

**fetch 响应：**
```typescript
{
  status: 200,
  statusText: 'OK',
  ok: true,
  headers: Headers,
  body: ReadableStream,
  json: () => Promise<any>
}
```

**Taro.request 响应：**
```typescript
{
  statusCode: 200,
  data: any,  // 已解析的数据
  header: object,
  cookies: string[]
}
```

## 💡 最佳实践

### 1. 使用 Taro.request

- ✅ 兼容微信小程序和 H5
- ✅ 自动处理 JSON 解析
- ✅ 统一的错误处理
- ✅ 更好的超时控制

### 2. 使用 JWT Token

- ✅ 提高安全性
- ✅ 实现身份验证
- ✅ 支持权限控制
- ✅ 便于审计追踪

### 3. 会话验证

- ✅ 确保用户已登录
- ✅ 防止未授权访问
- ✅ 提供友好的错误提示

### 4. 完善的日志

- ✅ 记录关键操作
- ✅ 不泄露敏感信息
- ✅ 便于问题排查
- ✅ 支持安全审计

### 5. 错误处理

- ✅ 识别不同类型的错误
- ✅ 提供友好的错误提示
- ✅ 避免应用崩溃
- ✅ 支持错误重试

## ✅ 修复总结

### 修改的文件

1. **API 文件** - `src/db/api.ts`
   - 添加 Taro 导入
   - 修改 bindWechatToProfile 方法
   - 添加会话验证
   - 使用 Taro.request 替代 fetch
   - 使用 JWT token 替代匿名密钥
   - 优化错误处理

### 核心改进

- ✅ 兼容微信小程序环境
- ✅ 提高安全性（使用 JWT token）
- ✅ 简化代码（自动 JSON 解析）
- ✅ 完善错误处理
- ✅ 增强日志记录

### 安全性提升

- 🔒 使用用户 JWT token 进行身份验证
- 🔒 添加会话验证，防止未授权访问
- 🔒 不在日志中泄露敏感信息
- 🔒 支持审计追踪
- 🔒 自动过期机制

### 用户价值

- 🎯 微信小程序中可以正常绑定微信
- 🎯 更安全的身份验证机制
- 🎯 更友好的错误提示
- 🎯 更稳定的网络请求
- 🎯 更好的用户体验

---

**修复完成时间：** 2025-11-15
**修复人员：** 秒哒 AI
**测试状态：** 待用户测试验证
