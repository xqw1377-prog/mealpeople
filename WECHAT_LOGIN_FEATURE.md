# 微信ID一键登录功能说明

## 功能概述

为了解决用户每次登录都需要输入手机号和短信验证码的麻烦，我们实现了**微信ID一键登录**功能。现在用户可以直接使用微信账号快速登录，无需任何输入，真正实现一键登录！

## 功能特点

### 🚀 一键登录
- **无需输入**：不需要输入手机号和验证码
- **快速便捷**：点击按钮即可完成登录
- **自动识别**：系统自动识别用户身份

### 🔐 安全可靠
- **微信官方认证**：使用微信官方登录API
- **数据加密**：所有数据传输使用HTTPS加密
- **隐私保护**：AppSecret只在后端使用，不暴露给前端
- **一次性Code**：微信登录code只能使用一次，防止重放攻击

### 🎨 智能适配
- **小程序优先**：在微信小程序环境中，默认显示微信登录
- **H5降级**：在H5浏览器环境中，自动切换到手机号登录
- **灵活切换**：用户可以在两种登录方式之间自由切换

### 👤 用户体验
- **首次登录**：自动创建账号，无需注册
- **再次登录**：自动识别，秒速登录
- **昵称头像**：自动获取微信昵称和头像（需用户授权）

## 使用方法

### 用户端使用

#### 1. 小程序环境登录

1. 打开小程序，进入登录页面
2. 看到"🚀 微信一键登录"按钮
3. 点击按钮
4. 首次登录时，会弹出授权窗口，点击"允许"
5. 登录成功！

**提示**：
- 如果想使用手机号登录，点击"使用手机号登录 →"切换
- 登录成功后会显示"欢迎加入！"（首次）或"欢迎回来！"（再次登录）

#### 2. H5浏览器环境登录

1. 在浏览器中打开应用
2. 自动显示手机号登录方式
3. 输入手机号和验证码登录

### 开发者配置

#### 1. 获取微信小程序配置

1. 访问 [微信公众平台](https://mp.weixin.qq.com/)
2. 登录您的小程序账号
3. 进入"开发" → "开发管理" → "开发设置"
4. 找到"开发者ID"部分：
   - **AppID (小程序ID)**：复制这个值
   - **AppSecret (小程序密钥)**：点击"生成"或"重置"获取

#### 2. 配置环境变量

在项目根目录的 `.env` 文件中，更新以下配置：

```env
# 微信小程序配置
TARO_APP_WECHAT_APPID=你的AppID
TARO_APP_WECHAT_APPSECRET=你的AppSecret
```

**重要提示**：
- AppSecret 是敏感信息，请妥善保管
- 不要将 AppSecret 提交到代码仓库
- 建议在生产环境使用环境变量管理

#### 3. 配置 Supabase Secrets

在 Supabase 项目中设置以下 secrets：

```bash
# 使用 Supabase CLI 或管理后台设置
WECHAT_APPID=你的AppID
WECHAT_APPSECRET=你的AppSecret
```

#### 4. 部署 Edge Function

Edge Function 已经部署，名称为 `wechat-quick-login`。

如需重新部署：

```bash
supabase functions deploy wechat-quick-login
```

## 技术实现

### 登录流程

```
┌─────────────┐
│   用户点击   │
│ 微信登录按钮 │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  调用微信API │
│ wx.login()  │
│  获取 code  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 发送 code 到 │
│ Edge Function│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Edge Function│
│ 调用微信服务器│
│ 换取 openid │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 查找或创建  │
│   用户账号   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   生成并返回 │
│ Session Token│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  设置登录状态│
│  跳转到首页  │
└─────────────┘
```

### 数据库设计

在 `profiles` 表中添加了以下字段：

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| `wechat_openid` | text | 微信小程序 OpenID | UNIQUE |
| `wechat_unionid` | text | 微信开放平台 UnionID | UNIQUE |
| `wechat_nickname` | text | 微信昵称 | - |
| `wechat_avatar` | text | 微信头像URL | - |

### API 接口

#### Edge Function: wechat-quick-login

**URL**: `{SUPABASE_URL}/functions/v1/wechat-quick-login`

**Method**: `POST`

**请求参数**:
```json
{
  "code": "微信登录code（必填）",
  "nickname": "用户昵称（可选）",
  "avatar": "用户头像URL（可选）"
}
```

**成功响应**:
```json
{
  "success": true,
  "isNewUser": false,
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_at": 1234567890,
    "expires_in": 3600
  },
  "user": {
    "id": "...",
    "openid": "...",
    "nickname": "...",
    "avatar": "..."
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "错误信息"
}
```

### 前端组件

#### WechatLoginButton 组件

位置：`src/components/wechat/WechatLoginButton.tsx`

**Props**:
```typescript
interface WechatLoginButtonProps {
  onLoginSuccess?: (user: any) => void  // 登录成功回调
  onLoginError?: (error: string) => void  // 登录失败回调
}
```

**使用示例**:
```tsx
import WechatLoginButton from '@/components/wechat/WechatLoginButton'

<WechatLoginButton 
  onLoginSuccess={(user) => {
    console.log('登录成功:', user)
    // 处理登录成功逻辑
  }}
  onLoginError={(error) => {
    console.error('登录失败:', error)
    // 处理登录失败逻辑
  }}
/>
```

## 常见问题

### Q1: 为什么在H5环境看不到微信登录按钮？

**A**: 微信登录只在微信小程序环境中可用。在H5浏览器环境中，系统会自动切换到手机号登录方式。这是因为微信的 `wx.login()` API 只在小程序环境中可用。

### Q2: 首次登录需要授权吗？

**A**: 首次登录时，系统会尝试获取用户的昵称和头像，这需要用户授权。但即使用户拒绝授权，登录流程仍然可以继续，只是不会获取到昵称和头像信息。

### Q3: 微信登录和手机号登录有什么区别？

**A**: 
- **微信登录**：使用微信账号作为身份标识，无需输入任何信息，一键登录
- **手机号登录**：使用手机号作为身份标识，需要输入手机号和短信验证码

两种方式都可以正常使用系统的所有功能。

### Q4: 如果我换了手机，还能用微信登录吗？

**A**: 可以！微信登录使用的是微信账号的 OpenID，只要你的微信账号不变，无论在哪台设备上登录，都能识别出你的账号。

### Q5: 微信登录安全吗？

**A**: 非常安全！我们使用了以下安全措施：
- 使用微信官方登录API
- 所有数据传输使用HTTPS加密
- AppSecret只在后端使用，不暴露给前端
- 微信登录code只能使用一次
- Session token有过期时间

### Q6: 配置了 AppID 和 AppSecret 后还是无法登录？

**A**: 请检查以下几点：
1. AppID 和 AppSecret 是否正确
2. 是否在 Supabase 中设置了 secrets
3. Edge Function 是否已部署
4. 查看浏览器控制台和 Edge Function 日志，查找具体错误信息

### Q7: 如何查看 Edge Function 日志？

**A**: 
1. 登录 Supabase 管理后台
2. 进入"Edge Functions"
3. 选择 `wechat-quick-login` 函数
4. 查看"Logs"标签页

## 更新日志

### v1.0.0 (2025-11-06)

**新增功能**:
- ✨ 实现微信ID一键登录
- ✨ 支持自动创建用户账号
- ✨ 支持获取微信昵称和头像
- ✨ 支持登录方式切换

**数据库更新**:
- 📦 添加 wechat_openid 字段
- 📦 添加 wechat_unionid 字段
- 📦 添加 wechat_nickname 字段
- 📦 添加 wechat_avatar 字段

**后端实现**:
- 🔧 创建 wechat-quick-login Edge Function
- 🔧 实现微信 code 换取 openid
- 🔧 实现用户自动创建/查找
- 🔧 实现 Session token 生成

**前端实现**:
- 🎨 创建 WechatLoginButton 组件
- 🎨 更新登录页面UI
- 🎨 添加登录方式切换功能

**安全特性**:
- 🔐 AppSecret 后端保护
- 🔐 HTTPS 加密传输
- 🔐 一次性 code 验证
- 🔐 Session token 过期机制

## 技术支持

如有问题或建议，请联系开发团队。

---

**开发团队**：餐时间日人力成本管控助手
**更新时间**：2025-11-06
**版本号**：v1.0.0
