# 微信登录配置指南 - 解决"invalid appid"错误

## 🚨 当前问题

### 问题1：微信一键登录失败
**错误信息**：`微信登录失败: invalid appid, rid: 6915a00a-548c78ba-7f6`

**原因**：微信AppID配置错误或未配置

### 问题2：绑定微信失败
**错误信息**：`网络请求失败，请检查网络`

**原因**：Edge Function未部署或环境变量未配置

---

## ✅ 解决方案

### 第一步：获取微信小程序AppID和AppSecret

1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入"开发" → "开发管理" → "开发设置"
3. 找到"开发者ID"部分
4. 复制以下信息：
   - **AppID (小程序ID)**：例如 `wx1234567890abcdef`
   - **AppSecret (小程序密钥)**：点击"生成"或"重置"获取

**⚠️ 重要提示**：
- AppSecret只显示一次，请妥善保存
- 如果忘记AppSecret，需要重置（会导致旧的失效）

---

### 第二步：配置Supabase环境变量

#### 方法1：使用Supabase CLI（推荐）

```bash
# 1. 登录Supabase
supabase login

# 2. 链接到你的项目
supabase link --project-ref your-project-ref

# 3. 配置微信AppID和AppSecret
supabase secrets set WECHAT_APPID=wx1234567890abcdef
supabase secrets set WECHAT_APPSECRET=你的AppSecret
```

#### 方法2：使用Supabase Dashboard

1. 登录Supabase Dashboard：https://supabase.com/dashboard
2. 选择你的项目
3. 进入"Settings" → "Edge Functions"
4. 找到"Secrets"部分
5. 点击"Add Secret"
6. 添加以下两个密钥：
   - **Name**: `WECHAT_APPID`，**Value**: `wx1234567890abcdef`
   - **Name**: `WECHAT_APPSECRET`，**Value**: `你的AppSecret`

**⚠️ 注意**：
- 密钥名称必须完全一致（区分大小写）
- 配置后需要重新部署Edge Function才能生效

---

### 第三步：部署Edge Function

#### 部署wechat-quick-login（微信一键登录）

```bash
# 部署微信一键登录Edge Function
supabase functions deploy wechat-quick-login
```

#### 部署bind-wechat（绑定微信）

```bash
# 部署绑定微信Edge Function
supabase functions deploy bind-wechat
```

#### 一键部署所有Edge Function

```bash
# 部署所有Edge Function
supabase functions deploy
```

**验证部署**：
```bash
# 查看已部署的Edge Function
supabase functions list
```

---

### 第四步：配置微信小程序服务器域名

1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入"开发" → "开发管理" → "开发设置"
3. 找到"服务器域名"部分
4. 点击"修改"
5. 在"request合法域名"中添加：
   ```
   https://你的Supabase项目URL
   https://api.weixin.qq.com
   ```

**示例**：
```
https://abcdefgh.supabase.co
https://api.weixin.qq.com
```

**⚠️ 注意**：
- 域名必须是https协议
- 不要包含端口号
- 不要包含路径（如/functions/v1）
- 配置后需要等待几分钟生效

---

### 第五步：更新本地.env文件（可选）

如果你需要在本地开发环境测试，需要更新`.env`文件：

```bash
# 编辑.env文件
nano .env
```

修改以下内容：
```env
# 微信小程序配置
TARO_APP_WECHAT_APPID=wx1234567890abcdef
TARO_APP_WECHAT_APPSECRET=你的AppSecret
```

**⚠️ 重要**：
- 不要将真实的AppSecret提交到Git仓库
- 确保.env文件在.gitignore中

---

## 🧪 测试步骤

### 测试1：微信一键登录

1. 打开小程序
2. 进入登录页面
3. 点击"微信一键登录"按钮
4. 观察控制台日志

**预期结果**：
```
🚀 开始微信一键登录...
📱 调用 wx.login()...
✅ 获取到微信 code: 0x1234567...
🔐 调用后端登录接口...
📡 请求 URL: https://xxx.supabase.co/functions/v1/wechat-quick-login
📋 后端响应: {statusCode: 200, success: true}
✅ 登录成功: {userId: "xxx", isNewUser: true}
🔑 设置 Supabase session...
✅ Supabase session 设置成功
```

**如果失败**：
- 查看错误信息
- 检查Edge Function日志
- 验证环境变量配置

### 测试2：绑定微信

1. 使用手机验证码登录
2. 进入"我的"页面
3. 点击"绑定微信"
4. 观察控制台日志

**预期结果**：
```
=== 步骤1：调用微信登录 ===
=== 微信登录成功 === {code: "xxx...", errMsg: "login:ok"}
=== 步骤2：调用绑定接口 === {userId: "xxx"}
=== 开始绑定微信 === {userId: "xxx", hasCode: true}
=== 调用Edge Function === {url: "https://...", userId: "xxx", codeLength: 32}
=== Edge Function响应 === {status: 200, statusText: "OK", ok: true}
=== 绑定微信结果 === {success: true, ...}
=== 绑定接口返回 === {success: true, message: "绑定成功"}
```

---

## 🔍 故障排查

### 问题1：仍然显示"invalid appid"

**可能原因**：
1. AppID配置错误
2. Edge Function未重新部署
3. 环境变量未生效

**解决方法**：
```bash
# 1. 验证环境变量
supabase secrets list

# 2. 重新部署Edge Function
supabase functions deploy wechat-quick-login --no-verify-jwt

# 3. 查看Edge Function日志
supabase functions logs wechat-quick-login
```

### 问题2：网络请求失败

**可能原因**：
1. Edge Function未部署
2. 服务器域名未配置
3. 网络连接问题

**解决方法**：
```bash
# 1. 检查Edge Function是否部署
supabase functions list

# 2. 测试Edge Function是否可访问
curl https://你的Supabase项目URL/functions/v1/bind-wechat

# 3. 查看Edge Function日志
supabase functions logs bind-wechat
```

### 问题3：开发阶段临时解决方案

如果你只是想快速测试，可以在小程序开发者工具中：

1. 点击右上角"详情"
2. 进入"本地设置"
3. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"

**⚠️ 注意**：
- 这只适用于开发阶段
- 正式发布前必须配置正确的服务器域名

---

## 📋 配置检查清单

在测试之前，请确认以下所有项目都已完成：

### Supabase配置
- [ ] 已配置WECHAT_APPID环境变量
- [ ] 已配置WECHAT_APPSECRET环境变量
- [ ] 已部署wechat-quick-login Edge Function
- [ ] 已部署bind-wechat Edge Function
- [ ] Edge Function可以正常访问

### 微信小程序配置
- [ ] 已获取正确的AppID
- [ ] 已获取正确的AppSecret
- [ ] 已配置服务器域名（Supabase URL）
- [ ] 已配置服务器域名（api.weixin.qq.com）
- [ ] 服务器域名已生效（等待几分钟）

### 本地开发配置（可选）
- [ ] 已更新.env文件中的WECHAT_APPID
- [ ] 已更新.env文件中的WECHAT_APPSECRET
- [ ] .env文件在.gitignore中

### 测试验证
- [ ] 微信一键登录功能正常
- [ ] 绑定微信功能正常
- [ ] 控制台无错误日志
- [ ] Edge Function日志正常

---

## 🚀 快速配置脚本

如果你有Supabase CLI访问权限，可以使用以下脚本快速配置：

```bash
#!/bin/bash

echo "🔧 开始配置微信登录功能..."

# 1. 输入微信配置
read -p "请输入微信小程序AppID: " WECHAT_APPID
read -p "请输入微信小程序AppSecret: " WECHAT_APPSECRET

# 2. 配置Supabase环境变量
echo "🔑 配置Supabase环境变量..."
supabase secrets set WECHAT_APPID=$WECHAT_APPID
supabase secrets set WECHAT_APPSECRET=$WECHAT_APPSECRET

# 3. 部署Edge Function
echo "📦 部署Edge Function..."
supabase functions deploy wechat-quick-login
supabase functions deploy bind-wechat

# 4. 验证部署
echo "✅ 验证部署..."
supabase functions list

echo ""
echo "✅ 配置完成！"
echo ""
echo "⚠️  请记得在微信公众平台配置服务器域名："
echo "   1. 登录 https://mp.weixin.qq.com/"
echo "   2. 进入 开发 → 开发管理 → 开发设置"
echo "   3. 在 request合法域名 中添加："
echo "      - https://你的Supabase项目URL"
echo "      - https://api.weixin.qq.com"
echo ""
echo "🧪 配置完成后，请测试微信登录功能"
```

保存为`setup-wechat.sh`，然后运行：
```bash
chmod +x setup-wechat.sh
./setup-wechat.sh
```

---

## 📞 仍然无法解决？

### 收集以下信息：

1. **错误截图**：完整的错误提示
2. **控制台日志**：完整的控制台输出
3. **Edge Function日志**：
   ```bash
   supabase functions logs wechat-quick-login --limit 50
   supabase functions logs bind-wechat --limit 50
   ```
4. **环境变量验证**：
   ```bash
   supabase secrets list
   ```
5. **Edge Function列表**：
   ```bash
   supabase functions list
   ```

### 常见错误代码

| 错误代码 | 错误信息 | 原因 | 解决方法 |
|---------|---------|------|---------|
| 40013 | invalid appid | AppID错误 | 检查AppID是否正确 |
| 40125 | invalid appsecret | AppSecret错误 | 检查AppSecret是否正确 |
| 40029 | code无效 | code已使用或过期 | 重新获取code |
| 40163 | code已使用 | code只能使用一次 | 重新获取code |
| -1 | 系统繁忙 | 微信服务器问题 | 稍后重试 |

---

## 📚 相关文档

- 微信登录配置指南：`WECHAT_CONFIG_GUIDE.md`（本文档）
- 绑定微信快速修复：`WECHAT_BIND_QUICK_FIX.md`
- 绑定微信配置指南：`WECHAT_BIND_SETUP.md`
- 绑定微信故障排查：`WECHAT_BIND_TROUBLESHOOTING.md`
- 微信功能文档索引：`WECHAT_BIND_README.md`

---

**最后更新**：2025-11-06
**版本**：1.0
**状态**：待配置
