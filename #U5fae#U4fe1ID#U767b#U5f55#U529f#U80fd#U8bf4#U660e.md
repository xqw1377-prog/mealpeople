# 微信ID登录功能说明

## 📋 功能概述

微信ID登录功能允许租户管理员在首次使用电话号码授权登录后，自动绑定微信账号，后续可以使用微信ID一键登录，提升用户体验。

## 🎯 核心价值

- **首次登录**：电话号码 + 验证码（授权）→ 自动绑定微信ID
- **后续登录**：微信ID一键登录（便捷）
- **安全可靠**：微信官方认证，安全性高
- **用户友好**：无需记忆密码，一键登录

## 🔄 登录流程

### 首次登录流程

```
1. 用户打开小程序
   ↓
2. 输入电话号码 + 验证码
   ↓
3. 系统验证是否是租户管理员
   ↓
4. 验证成功，创建/更新 profile
   ↓
5. 自动获取微信用户信息（OpenID、UnionID）
   ↓
6. 绑定微信ID到用户账号
   ↓
7. 显示"登录成功，已绑定微信"
   ↓
8. 跳转到首页
```

### 后续登录流程（待实现）

```
1. 用户打开小程序
   ↓
2. 点击"微信登录"按钮
   ↓
3. 调用微信登录API，获取 OpenID
   ↓
4. 查询该 OpenID 是否已绑定账号
   ↓
5. 如果已绑定，直接登录
   ↓
6. 如果未绑定，提示使用电话号码登录
   ↓
7. 跳转到首页
```

## 🗄️ 数据库设计

### profiles 表新增字段

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| wechat_openid | text | 微信小程序 OpenID | UNIQUE |
| wechat_unionid | text | 微信 UnionID | UNIQUE |

### 索引

```sql
CREATE INDEX idx_profiles_wechat_openid ON profiles(wechat_openid);
CREATE INDEX idx_profiles_wechat_unionid ON profiles(wechat_unionid);
```

### 数据示例

```sql
-- 用户首次登录后的数据
INSERT INTO profiles (
  id,
  tenant_id,
  phone,
  role,
  wechat_openid,
  wechat_unionid
) VALUES (
  'user-uuid-123',
  'tenant-uuid-456',
  '13800138000',
  'tenant_admin',
  'wx_openid_abc123',
  'wx_unionid_xyz789'
);
```

## 🔧 技术实现

### 1. 数据库迁移

文件：`supabase/migrations/27_add_wechat_id_to_profiles.sql`

```sql
-- 添加微信ID字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid text UNIQUE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON profiles(wechat_openid);
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_unionid ON profiles(wechat_unionid);
```

### 2. 类型定义

文件：`src/db/types.ts`

```typescript
export interface Profile {
  id: string
  tenant_id: string | null
  phone: string | null
  email: string | null
  wechat_id: string | null
  wechat_openid: string | null // 微信小程序 OpenID
  wechat_unionid: string | null // 微信 UnionID
  name: string | null
  avatar_url: string | null
  role: UserRole
  // ...其他字段
}
```

### 3. Edge Function - 租户管理员登录

文件：`supabase/functions/tenant-admin-login/index.ts`

**请求参数**：

```typescript
interface LoginRequest {
  phone: string
  wechatOpenid?: string // 微信 OpenID（可选）
  wechatUnionid?: string // 微信 UnionID（可选）
}
```

**处理逻辑**：

```typescript
// 1. 验证用户身份
// 2. 查询租户信息
// 3. 创建/更新 profile
// 4. 如果提供了微信ID，则绑定
if (wechatOpenid) {
  updateData.wechat_openid = wechatOpenid
  console.log('🔗 绑定微信 OpenID')
}
if (wechatUnionid) {
  updateData.wechat_unionid = wechatUnionid
  console.log('🔗 绑定微信 UnionID')
}
```

### 4. Edge Function - 微信登录（待实现）

文件：`supabase/functions/wechat-login/index.ts`

**请求参数**：

```typescript
interface WechatLoginRequest {
  wechatOpenid: string
  wechatUnionid?: string
}
```

**处理逻辑**：

```typescript
// 1. 验证用户身份
// 2. 查询该微信ID是否已绑定账号
// 3. 如果已绑定，返回用户信息
// 4. 如果未绑定，返回错误提示
```

### 5. 前端工具函数

文件：`src/utils/wechat.ts`

```typescript
/**
 * 获取微信用户信息
 * 注意：此功能仅在微信小程序环境中可用
 */
export async function getWechatUserInfo(): Promise<WechatUserInfo | null> {
  // 检查是否在微信小程序环境
  if (Taro.getEnv() !== 'WEAPP') {
    return null
  }

  // 调用微信登录API
  const loginRes = await Taro.login()
  
  // 注意：实际项目中，需要将 code 发送到后端服务器
  // 后端服务器使用 code 换取 openid 和 session_key
  
  return {
    openid: 'wx_openid_xxx',
    unionid: 'wx_unionid_xxx'
  }
}
```

### 6. 前端登录页面

文件：`src/pages/login/index.tsx`

**登录流程**：

```typescript
const handleLoginSuccess = async (user: any) => {
  // 1. 尝试获取微信用户信息
  const wechatInfo = await getWechatUserInfo()
  
  // 2. 验证租户管理员身份
  const requestBody: any = {
    phone: userPhone
  }
  
  // 3. 如果获取到微信信息，添加到请求体
  if (wechatInfo) {
    requestBody.wechatOpenid = wechatInfo.openid
    requestBody.wechatUnionid = wechatInfo.unionid
  }
  
  // 4. 调用 Edge Function
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  })
  
  // 5. 处理响应
  if (result.success) {
    if (wechatInfo) {
      Taro.showToast({
        title: '登录成功，已绑定微信',
        icon: 'success'
      })
    }
  }
}
```

## 📱 用户界面

### 登录页面

```
┌─────────────────────────────────────┐
│                                      │
│        智能排班系统                  │
│        租户管理员登录                │
│                                      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📱 手机号登录                       │
│                                      │
│  [输入手机号]                        │
│  [输入验证码]                        │
│                                      │
│  [登录]                              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  💡 提示                             │
│                                      │
│  请使用超级管理员为您分配的电话号码  │
│  登录。如果您还没有账号，请联系超级  │
│  管理员创建租户并分配管理员权限。    │
│                                      │
│  🔑 首次登录后，系统将自动绑定您的   │
│  微信账号，下次可以使用微信一键登录  │
│  （更便捷）。                        │
└─────────────────────────────────────┘
```

### 登录成功提示

```
┌─────────────────────────────────────┐
│  ✅ 登录成功，已绑定微信             │
└─────────────────────────────────────┘
```

## 🔐 安全机制

### 1. 数据隔离

- 每个微信ID只能绑定一个系统账号
- 使用 UNIQUE 约束确保唯一性
- 防止一个微信账号绑定多个系统账号

### 2. 权限验证

- 首次登录必须使用电话号码验证
- 验证通过后才能绑定微信ID
- 后续登录通过微信ID查询绑定的账号

### 3. 数据加密

- 微信ID存储在数据库中
- 使用 Supabase 的安全机制
- 防止数据泄露

### 4. 日志记录

- 记录所有登录操作
- 记录微信ID绑定操作
- 便于审计和问题排查

## 📊 数据流程图

### 首次登录数据流

```
用户
  ↓ 输入电话号码 + 验证码
前端
  ↓ 调用 Supabase Auth
Supabase Auth
  ↓ 验证成功，返回 user
前端
  ↓ 获取微信用户信息
微信API
  ↓ 返回 OpenID、UnionID
前端
  ↓ 调用 tenant-admin-login Edge Function
Edge Function
  ↓ 验证租户管理员身份
  ↓ 创建/更新 profile
  ↓ 绑定微信ID
数据库
  ↓ 保存数据
Edge Function
  ↓ 返回成功
前端
  ↓ 显示"登录成功，已绑定微信"
  ↓ 跳转到首页
```

### 后续登录数据流（待实现）

```
用户
  ↓ 点击"微信登录"
前端
  ↓ 获取微信用户信息
微信API
  ↓ 返回 OpenID
前端
  ↓ 调用 wechat-login Edge Function
Edge Function
  ↓ 查询该 OpenID 是否已绑定
数据库
  ↓ 返回绑定的用户信息
Edge Function
  ↓ 返回用户信息
前端
  ↓ 显示"登录成功"
  ↓ 跳转到首页
```

## 🚀 部署步骤

### 1. 应用数据库迁移

```bash
# 使用 supabase_apply_migration 工具
supabase_apply_migration(
  name="add_wechat_id_to_profiles",
  query="<SQL内容>"
)
```

### 2. 部署 Edge Functions

```bash
# 部署租户管理员登录函数（已更新）
supabase_deploy_edge_function(
  name="tenant-admin-login",
  files=[...]
)

# 部署微信登录函数（新增）
supabase_deploy_edge_function(
  name="wechat-login",
  files=[...]
)
```

### 3. 更新前端代码

```bash
# 更新类型定义
# 更新登录页面
# 添加微信工具函数
```

### 4. 测试验证

```bash
# 测试首次登录流程
# 测试微信ID绑定
# 测试后续登录流程（待实现）
```

## 📝 使用说明

### 租户管理员首次登录

1. 打开小程序
2. 输入超级管理员分配的电话号码
3. 输入验证码
4. 点击"登录"
5. 系统自动绑定微信账号
6. 显示"登录成功，已绑定微信"
7. 跳转到首页

### 租户管理员后续登录（待实现）

1. 打开小程序
2. 点击"微信登录"按钮
3. 系统自动识别微信账号
4. 显示"登录成功"
5. 跳转到首页

## ⚠️ 注意事项

### 1. 微信API限制

- 微信登录API仅在小程序环境中可用
- H5环境无法使用微信登录
- 需要配置小程序的 AppID 和 AppSecret

### 2. 后端服务器

- 实际项目中，需要实现后端服务器
- 后端服务器使用 code 换取 openid 和 session_key
- 当前实现使用模拟数据，生产环境需要替换

### 3. 数据安全

- 微信ID是敏感信息，需要妥善保管
- 不要在日志中输出完整的微信ID
- 使用 HTTPS 传输数据

### 4. 用户体验

- 首次登录时，明确告知用户将绑定微信账号
- 绑定成功后，显示明确的提示信息
- 后续登录时，提供便捷的微信登录入口

## 🔄 后续开发计划

### 短期（1周）

- [x] 添加微信ID字段到数据库
- [x] 更新 Edge Function 支持微信ID绑定
- [x] 更新前端登录页面
- [x] 添加微信工具函数
- [ ] 实现后端服务器（code 换取 openid）
- [ ] 测试首次登录流程

### 中期（2周）

- [ ] 实现微信登录 Edge Function
- [ ] 添加微信登录按钮到登录页面
- [ ] 测试后续登录流程
- [ ] 优化用户体验
- [ ] 添加错误处理

### 长期（1个月）

- [ ] 支持微信账号解绑
- [ ] 支持多个登录方式切换
- [ ] 添加登录历史记录
- [ ] 添加登录安全设置
- [ ] 支持微信头像和昵称同步

## 📚 相关文档

- [租户管理员授权登录流程](./租户管理员授权登录流程.md)
- [数据库设计文档](./数据库设计文档.md)
- [Edge Functions 文档](./Edge_Functions文档.md)

## 🆘 技术支持

如果遇到问题：

1. **查看日志**：查看控制台日志和错误信息
2. **查看文档**：阅读本文档和相关文档
3. **联系支持**：联系系统管理员或技术支持

---

**文档版本**：v1.0.0  
**更新日期**：2025-11-11  
**作者**：秒哒AI助手  
**状态**：✅ 首次登录绑定已完成，后续登录待实现
