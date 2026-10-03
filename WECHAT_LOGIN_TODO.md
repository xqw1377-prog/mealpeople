# 微信ID一键登录功能实现计划

## 目标
实现微信ID一键登录，替代繁琐的手机号+短信验证码登录方式

## 实现步骤

### 1. 数据库设计
- [x] 在 profiles 表中添加 wechat_openid 字段
- [x] 在 profiles 表中添加 wechat_unionid 字段（可选，用于跨应用识别）
- [x] 在 profiles 表中添加 wechat_nickname 字段（微信昵称）
- [x] 在 profiles 表中添加 wechat_avatar 字段（微信头像）
- [x] 创建数据库迁移文件

### 2. 创建微信登录 Edge Function
- [x] 创建 wechat-quick-login Edge Function
- [x] 实现微信 code 换取 openid 的逻辑
- [x] 实现用户创建/查找逻辑
- [x] 返回 Supabase session token
- [x] 部署 Edge Function

### 3. 前端微信登录组件
- [x] 创建 WechatLoginButton 组件
- [x] 实现 wx.login() 调用
- [x] 实现 code 发送到后端
- [x] 处理登录成功/失败
- [x] 添加加载状态和错误提示

### 4. 更新登录页面
- [x] 在登录页面添加微信登录按钮
- [x] 优先显示微信登录（小程序环境）
- [x] 保留手机号登录作为备选方案
- [x] 优化UI布局
- [x] 添加登录方式切换功能

### 5. 环境变量配置
- [x] 添加微信小程序 AppID
- [x] 添加微信小程序 AppSecret
- [x] 更新 .env 文件
- [x] 在 Supabase 中设置 secrets

### 6. 测试
- [ ] 测试首次微信登录
- [ ] 测试重复微信登录
- [ ] 测试错误处理
- [ ] 测试跨平台兼容性（H5降级）

## 技术要点

### 微信登录流程
1. 前端调用 wx.login() 获取 code ✅
2. 前端将 code 发送到后端 Edge Function ✅
3. 后端使用 code + AppID + AppSecret 调用微信 API 获取 openid ✅
4. 后端查找或创建用户 ✅
5. 后端生成 Supabase session token ✅
6. 前端使用 token 登录 ✅

### 安全考虑
- AppSecret 只在后端使用，不暴露给前端 ✅
- 使用 HTTPS 传输 ✅
- code 只能使用一次 ✅
- session token 有过期时间 ✅

## 注意事项
- 微信登录只在小程序环境可用 ✅
- H5 环境需要降级到手机号登录 ✅
- 需要微信小程序的 AppID 和 AppSecret ⚠️

## 配置说明

### 获取微信小程序 AppID 和 AppSecret

1. 访问微信公众平台：https://mp.weixin.qq.com/
2. 登录您的小程序账号
3. 进入"开发" → "开发管理" → "开发设置"
4. 找到"开发者ID"部分：
   - AppID (小程序ID)
   - AppSecret (小程序密钥)
5. 将这两个值更新到 `.env` 文件中：
   ```
   TARO_APP_WECHAT_APPID=你的AppID
   TARO_APP_WECHAT_APPSECRET=你的AppSecret
   ```

### 更新 Supabase Secrets

在 Supabase 项目中设置以下 secrets：
- `WECHAT_APPID`: 微信小程序 AppID
- `WECHAT_APPSECRET`: 微信小程序 AppSecret

## 使用说明

### 用户体验

1. **小程序环境**：
   - 打开登录页面，默认显示"微信一键登录"按钮
   - 点击按钮即可快速登录，无需输入手机号
   - 首次登录会请求用户授权获取昵称和头像
   - 如需使用手机号登录，可点击"使用手机号登录"切换

2. **H5 环境**：
   - 自动显示手机号登录方式
   - 不显示微信登录按钮

### 开发者说明

1. **Edge Function URL**：
   ```
   POST {SUPABASE_URL}/functions/v1/wechat-quick-login
   ```

2. **请求参数**：
   ```json
   {
     "code": "微信登录code",
     "nickname": "用户昵称（可选）",
     "avatar": "用户头像URL（可选）"
   }
   ```

3. **响应格式**：
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

## 完成状态

✅ 数据库结构已更新
✅ Edge Function 已创建并部署
✅ 前端组件已实现
✅ 登录页面已更新
✅ 环境变量已配置
⚠️ 需要配置真实的微信 AppID 和 AppSecret
⏳ 等待测试验证
