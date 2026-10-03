# 微信小程序登录问题诊断指南

## 🚨 问题描述

- **WEB端（秒哒开发平台）**：✅ 可以通过验证码登录
- **微信小程序试用版**：❌ 无法登录

## 🔍 可能的原因分析

### 1. 网络请求域名未配置（最可能）

微信小程序对网络请求有严格的域名白名单限制。如果Supabase的域名没有在小程序后台配置，所有网络请求都会被拦截。

**检查方法**：
1. 打开微信开发者工具
2. 查看控制台（Console）
3. 查找类似以下的错误信息：
   ```
   request:fail url not in domain list
   或
   不在以下 request 合法域名列表中
   ```

**解决方案**：
1. 登录微信小程序后台（https://mp.weixin.qq.com/）
2. 进入"开发" → "开发管理" → "开发设置"
3. 找到"服务器域名"配置
4. 添加以下域名到 **request合法域名**：
   ```
   https://backend.appmiaoda.com
   ```
5. 保存配置（注意：域名配置每月只能修改5次）

### 2. 开发者工具的域名校验设置

在开发阶段，可以临时关闭域名校验：

**步骤**：
1. 打开微信开发者工具
2. 点击右上角"详情"
3. 找到"本地设置"
4. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

**注意**：这只在开发阶段有效，正式版必须配置合法域名。

### 3. 验证码发送服务问题

Supabase的验证码发送可能在小程序环境中有特殊限制。

**检查方法**：
1. 在小程序中输入手机号
2. 点击"获取验证码"
3. 查看控制台是否有错误信息
4. 检查是否收到短信验证码

**可能的错误**：
- `Failed to send OTP`
- `Rate limit exceeded`
- `Invalid phone number format`

### 4. Supabase Auth配置问题

检查Supabase项目的Auth配置是否正确。

**检查项**：
1. 登录Supabase控制台
2. 进入项目设置 → Authentication
3. 检查以下配置：
   - ✅ Enable Phone Auth（启用手机号登录）
   - ✅ Phone OTP Expiry（验证码过期时间）
   - ✅ SMS Provider（短信服务提供商配置）

### 5. 小程序环境变量问题

检查环境变量是否正确加载。

**检查方法**：
在登录页面添加调试代码：
```typescript
console.log('Supabase URL:', process.env.TARO_APP_SUPABASE_URL)
console.log('Supabase Key:', process.env.TARO_APP_SUPABASE_ANON_KEY ? '已配置' : '未配置')
console.log('App ID:', process.env.TARO_APP_APP_ID)
```

### 6. 小程序版本问题

检查小程序的基础库版本是否过低。

**检查方法**：
1. 打开微信开发者工具
2. 点击右上角"详情"
3. 查看"基础库版本"
4. 建议使用 **2.10.0** 或更高版本

## 🛠️ 快速诊断步骤

### 步骤1：检查网络请求

1. 打开微信开发者工具
2. 打开小程序登录页面
3. 打开控制台（Console）
4. 输入手机号，点击"获取验证码"
5. 查看控制台输出

**预期输出**：
```
🔐 开始发送验证码...
📱 手机号: 138****8888
✅ 验证码发送成功
```

**错误输出示例**：
```
❌ request:fail url not in domain list
或
❌ Failed to send OTP: ...
```

### 步骤2：检查域名配置

在微信开发者工具中执行：
```javascript
// 在控制台输入
wx.request({
  url: 'https://backend.appmiaoda.com/projects/supabase244657695024529408/auth/v1/otp',
  method: 'POST',
  success: (res) => console.log('✅ 域名可访问', res),
  fail: (err) => console.log('❌ 域名不可访问', err)
})
```

### 步骤3：检查Supabase连接

在登录页面添加测试代码：
```typescript
import {supabase} from '@/client/supabase'

// 测试Supabase连接
const testConnection = async () => {
  try {
    const {data, error} = await supabase.from('profiles').select('count').limit(1)
    console.log('✅ Supabase连接正常', data)
  } catch (error) {
    console.error('❌ Supabase连接失败', error)
  }
}

// 在组件中调用
useEffect(() => {
  testConnection()
}, [])
```

## 🔧 解决方案汇总

### 方案1：配置合法域名（推荐）

**适用场景**：正式发布的小程序

**步骤**：
1. 登录微信小程序后台
2. 配置服务器域名：`https://backend.appmiaoda.com`
3. 等待配置生效（通常立即生效）
4. 重新编译小程序
5. 测试登录功能

### 方案2：关闭域名校验（开发阶段）

**适用场景**：开发和测试阶段

**步骤**：
1. 打开微信开发者工具
2. 详情 → 本地设置
3. 勾选"不校验合法域名"
4. 重新编译
5. 测试登录功能

### 方案3：使用体验版（临时方案）

**适用场景**：快速测试

**步骤**：
1. 在微信开发者工具中点击"上传"
2. 填写版本号和项目备注
3. 上传成功后，在小程序后台设置为体验版
4. 扫码体验
5. 体验版会使用开发者工具的域名配置

### 方案4：修改project.config.json（不推荐）

**注意**：这个方案只在开发阶段有效，不影响正式版。

```json
{
  "setting": {
    "urlCheck": false  // 改为 false
  }
}
```

## 📋 完整的调试检查清单

- [ ] 检查微信开发者工具控制台是否有错误
- [ ] 检查是否有"域名不在白名单"的错误
- [ ] 检查小程序后台是否配置了合法域名
- [ ] 检查开发者工具是否关闭了域名校验
- [ ] 检查环境变量是否正确加载
- [ ] 检查Supabase Auth配置是否正确
- [ ] 检查手机号格式是否正确
- [ ] 检查是否能收到短信验证码
- [ ] 检查小程序基础库版本是否过低
- [ ] 检查网络连接是否正常

## 🎯 最可能的解决方案

根据您的描述，最可能的原因是 **小程序后台没有配置合法域名**。

**立即执行以下步骤**：

1. **登录微信小程序后台**
   - 访问：https://mp.weixin.qq.com/
   - 使用管理员微信扫码登录

2. **配置服务器域名**
   - 进入：开发 → 开发管理 → 开发设置
   - 找到：服务器域名
   - 在"request合法域名"中添加：
     ```
     https://backend.appmiaoda.com
     ```
   - 点击"保存并提交"

3. **等待配置生效**
   - 通常立即生效
   - 如果不生效，等待5-10分钟

4. **重新测试**
   - 关闭微信开发者工具
   - 重新打开项目
   - 重新编译
   - 测试登录功能

## 📞 如果问题仍然存在

请提供以下信息：

1. **微信开发者工具控制台的完整错误日志**
2. **小程序后台的域名配置截图**
3. **是否能收到短信验证码**
4. **小程序基础库版本**
5. **是否在开发者工具中关闭了域名校验**

## 🔍 高级调试技巧

### 使用vconsole调试

在小程序中启用vconsole，可以在真机上查看日志：

```typescript
// 在 app.tsx 中添加
import Taro from '@tarojs/taro'

if (process.env.NODE_ENV === 'development') {
  Taro.setEnableDebug({
    enableDebug: true
  })
}
```

### 抓包分析

使用Charles或Fiddler抓包，查看网络请求：

1. 配置手机代理
2. 安装证书
3. 打开小程序
4. 尝试登录
5. 查看网络请求是否发送成功

### 查看Supabase日志

在Supabase控制台查看Auth日志：

1. 登录Supabase控制台
2. 进入项目
3. 点击左侧"Authentication"
4. 查看"Users"和"Logs"
5. 检查是否有登录尝试记录

## ✅ 验证修复成功

修复后，应该能看到以下现象：

1. ✅ 输入手机号后，点击"获取验证码"，按钮变为倒计时
2. ✅ 手机收到验证码短信
3. ✅ 输入验证码后，点击"登录"，显示"登录成功"
4. ✅ 自动跳转到首页或租户选择页面
5. ✅ 控制台没有错误信息

---

**最后更新**: 2025-11-12
**版本**: v2.0
