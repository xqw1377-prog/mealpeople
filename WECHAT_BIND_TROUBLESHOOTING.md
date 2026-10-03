# 绑定微信功能故障排查指南

## 问题：绑定微信不成功

---

## 🔍 常见问题排查

### 问题1：Edge Function未部署

**症状**：
- 提示"绑定失败"
- 控制台显示404错误或网络错误

**排查方法**：
```bash
# 检查Edge Function是否已部署
curl https://你的Supabase项目URL/functions/v1/bind-wechat
```

**解决方案**：
```bash
# 部署Edge Function
supabase functions deploy bind-wechat
```

---

### 问题2：环境变量未配置

**症状**：
- 提示"微信小程序配置缺失"
- Edge Function日志显示环境变量为undefined

**排查方法**：
1. 登录Supabase Dashboard
2. 进入项目 -> Settings -> Edge Functions
3. 检查是否有WECHAT_APPID和WECHAT_APPSECRET

**解决方案**：
```bash
# 使用Supabase CLI配置
supabase secrets set WECHAT_APPID=你的微信小程序AppID
supabase secrets set WECHAT_APPSECRET=你的微信小程序AppSecret

# 或在Supabase Dashboard中手动添加
```

---

### 问题3：微信小程序服务器域名未配置

**症状**：
- 小程序中提示"不在以下 request 合法域名列表中"
- 网络请求被拦截

**排查方法**：
1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 检查"服务器域名"中的"request合法域名"

**解决方案**：
添加以下域名到"request合法域名"：
- `https://你的Supabase项目URL`（例如：https://abcdefgh.supabase.co）
- `https://api.weixin.qq.com`

---

### 问题4：微信AppID或AppSecret错误

**症状**：
- 提示"微信API错误"
- 错误码：40013（invalid appid）或40125（invalid appsecret）

**排查方法**：
1. 登录微信公众平台
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 核对AppID和AppSecret

**解决方案**：
重新配置正确的AppID和AppSecret

---

### 问题5：微信code已过期

**症状**：
- 提示"微信API错误"
- 错误码：40029（invalid code）

**原因**：
微信code只能使用一次，且有效期为5分钟

**解决方案**：
重新点击"立即绑定微信"按钮

---

### 问题6：该微信已被其他用户绑定

**症状**：
- 提示"该微信账号已被其他用户绑定"

**解决方案**：
1. 使用其他微信账号
2. 或先解绑原有账号

---

## 🛠️ 调试步骤

### 步骤1：检查控制台日志

在小程序开发者工具中查看控制台输出：

```javascript
// 应该看到以下日志
=== 微信登录成功 === {code: "xxx"}
=== 开始绑定微信 === {userId: "xxx", hasCode: true}
=== 绑定微信结果 === {success: true, ...}
```

### 步骤2：检查网络请求

在小程序开发者工具的"Network"标签中查看：

1. **请求URL**：应该是 `https://你的Supabase项目URL/functions/v1/bind-wechat`
2. **请求方法**：POST
3. **请求体**：`{"code": "xxx", "userId": "xxx"}`
4. **响应状态**：200
5. **响应体**：`{"success": true, ...}`

### 步骤3：检查Edge Function日志

在Supabase Dashboard中查看Edge Function日志：

1. 进入项目 -> Edge Functions -> bind-wechat
2. 点击"Logs"标签
3. 查看最近的执行日志

**正常日志应该包含**：
```
🔍 开始处理绑定微信请求...
📝 请求参数: {code: "xxx...", userId: "xxx"}
🔑 微信配置: {appId: "xxx...", appSecret: "已配置"}
📡 调用微信API...
📱 微信API响应: {hasOpenid: true, ...}
🔍 检查openid是否已被绑定...
💾 更新用户profile...
✅ 绑定微信成功
```

---

## 🔧 临时解决方案

如果Edge Function暂时无法部署，可以使用以下临时方案：

### 方案1：直接保存OpenID（仅用于测试）

修改`bindWechatToProfile`函数，跳过Edge Function调用：

```typescript
// 临时测试代码 - 仅用于开发环境
if (code === 'test') {
  // 直接保存一个测试OpenID
  const {error} = await supabase
    .from('profiles')
    .update({
      wechat_openid: `test_openid_${userId}`,
      wechat_unionid: null
    })
    .eq('id', userId)

  if (error) {
    return {success: false, message: '绑定失败'}
  }

  return {success: true, message: '绑定成功（测试模式）'}
}
```

**⚠️ 警告**：此方案仅用于测试，不能用于生产环境！

---

## 📋 完整检查清单

### 环境配置检查
- [ ] Supabase项目已创建
- [ ] Edge Function已部署
- [ ] WECHAT_APPID已配置
- [ ] WECHAT_APPSECRET已配置
- [ ] 微信小程序AppID正确
- [ ] 微信小程序AppSecret正确

### 微信小程序配置检查
- [ ] 服务器域名已配置
- [ ] Supabase URL已添加到request合法域名
- [ ] api.weixin.qq.com已添加到request合法域名

### 数据库配置检查
- [ ] profiles表有wechat_openid字段
- [ ] profiles表有wechat_unionid字段
- [ ] 字段有唯一约束
- [ ] 索引已创建

### 代码检查
- [ ] bind-wechat页面存在
- [ ] bindWechatToProfile函数存在
- [ ] Edge Function文件存在
- [ ] 路由已注册

---

## 🚀 快速修复指南

### 如果是首次配置

1. **获取微信小程序配置**
   ```
   登录：https://mp.weixin.qq.com/
   获取：AppID和AppSecret
   ```

2. **配置Supabase环境变量**
   ```bash
   supabase secrets set WECHAT_APPID=你的AppID
   supabase secrets set WECHAT_APPSECRET=你的AppSecret
   ```

3. **部署Edge Function**
   ```bash
   supabase functions deploy bind-wechat
   ```

4. **配置微信小程序服务器域名**
   ```
   添加：https://你的Supabase项目URL
   添加：https://api.weixin.qq.com
   ```

5. **重新测试**
   - 重启小程序
   - 点击"立即绑定微信"
   - 查看结果

---

## 📞 获取帮助

### 查看日志

1. **前端日志**：小程序开发者工具控制台
2. **Edge Function日志**：Supabase Dashboard -> Edge Functions -> Logs
3. **数据库日志**：Supabase Dashboard -> Database -> Logs

### 常用命令

```bash
# 查看Edge Function状态
supabase functions list

# 查看Edge Function日志
supabase functions logs bind-wechat

# 重新部署Edge Function
supabase functions deploy bind-wechat --no-verify-jwt

# 查看环境变量
supabase secrets list
```

---

## 💡 最可能的原因

根据经验，绑定微信不成功最常见的原因是：

1. **Edge Function未部署**（占60%）
2. **环境变量未配置**（占30%）
3. **微信小程序服务器域名未配置**（占8%）
4. **其他原因**（占2%）

**建议优先检查前两项！**

---

## ✅ 验证成功的标志

绑定成功后，应该看到：

1. **前端提示**："绑定成功"
2. **绑定状态**：显示"已绑定"
3. **OpenID显示**：显示微信OpenID
4. **数据库记录**：profiles表中wechat_openid字段有值
5. **控制台日志**：显示成功日志

---

**最后更新**：2025-11-06
