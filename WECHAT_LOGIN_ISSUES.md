# 微信登录问题解决方案

## 📋 问题总结

### 问题1：微信一键登录失败
**错误截图**：显示"微信登录失败: invalid appid, rid: 6915a00a-548c78ba-7f6"

**错误原因**：
- 微信AppID配置错误或未配置
- `.env`文件中使用了占位符`your_wechat_appid_here`
- Supabase环境变量未配置

### 问题2：绑定微信失败
**错误提示**：显示"网络请求失败，请检查网络"

**错误原因**：
- Edge Function未部署
- Supabase环境变量未配置
- 微信小程序服务器域名未配置

---

## ✅ 解决方案（3步快速修复）

### 方案A：使用自动化脚本（推荐）

```bash
# 1. 运行配置脚本
./setup-wechat.sh

# 2. 按提示输入微信AppID和AppSecret

# 3. 等待脚本自动完成配置和部署
```

**优点**：
- 自动化配置，减少错误
- 一键部署所有Edge Function
- 自动验证配置结果

---

### 方案B：手动配置（详细步骤）

#### 第1步：获取微信配置

1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入"开发" → "开发管理" → "开发设置"
3. 复制AppID和AppSecret

#### 第2步：配置Supabase环境变量

**使用Supabase CLI**：
```bash
supabase secrets set WECHAT_APPID=你的AppID
supabase secrets set WECHAT_APPSECRET=你的AppSecret
```

**或使用Supabase Dashboard**：
1. 登录Supabase Dashboard
2. 进入Settings → Edge Functions
3. 添加WECHAT_APPID和WECHAT_APPSECRET

#### 第3步：部署Edge Function

```bash
# 部署微信一键登录
supabase functions deploy wechat-quick-login

# 部署绑定微信
supabase functions deploy bind-wechat
```

#### 第4步：配置微信小程序服务器域名

1. 登录微信公众平台
2. 进入"开发" → "开发管理" → "开发设置"
3. 在"request合法域名"中添加：
   - `https://你的Supabase项目URL`
   - `https://api.weixin.qq.com`

---

## 🧪 测试验证

### 测试1：微信一键登录

1. 打开小程序
2. 进入登录页面
3. 点击"微信一键登录"
4. 观察是否成功登录

**成功标志**：
- 显示"欢迎加入！"或"欢迎回来！"
- 自动跳转到首页
- 控制台无错误日志

### 测试2：绑定微信

1. 使用手机验证码登录
2. 进入"我的"页面
3. 点击"绑定微信"
4. 观察是否绑定成功

**成功标志**：
- 显示"绑定成功"
- 显示微信OpenID
- 控制台无错误日志

---

## 🔍 故障排查

### 如果仍然显示"invalid appid"

**检查项**：
1. ✅ AppID是否正确（不是AppSecret）
2. ✅ 环境变量是否配置成功
3. ✅ Edge Function是否重新部署
4. ✅ 是否等待几分钟让配置生效

**验证命令**：
```bash
# 查看环境变量
supabase secrets list

# 查看Edge Function
supabase functions list

# 查看Edge Function日志
supabase functions logs wechat-quick-login
```

### 如果仍然显示"网络请求失败"

**检查项**：
1. ✅ Edge Function是否部署
2. ✅ 服务器域名是否配置
3. ✅ 是否等待域名配置生效
4. ✅ 网络连接是否正常

**临时解决方案**（仅开发阶段）：
1. 打开小程序开发者工具
2. 点击右上角"详情"
3. 进入"本地设置"
4. 勾选"不校验合法域名"

---

## 📊 配置状态检查

### 当前配置状态

| 配置项 | 状态 | 说明 |
|-------|------|------|
| 微信AppID | ⏳ 待配置 | 需要在Supabase中配置 |
| 微信AppSecret | ⏳ 待配置 | 需要在Supabase中配置 |
| wechat-quick-login | ⏳ 待部署 | 需要部署Edge Function |
| bind-wechat | ⏳ 待部署 | 需要部署Edge Function |
| 服务器域名 | ⏳ 待配置 | 需要在微信公众平台配置 |

### 配置完成后的状态

| 配置项 | 状态 | 说明 |
|-------|------|------|
| 微信AppID | ✅ 已配置 | 在Supabase环境变量中 |
| 微信AppSecret | ✅ 已配置 | 在Supabase环境变量中 |
| wechat-quick-login | ✅ 已部署 | Edge Function正常运行 |
| bind-wechat | ✅ 已部署 | Edge Function正常运行 |
| 服务器域名 | ✅ 已配置 | 在微信公众平台中 |

---

## 📚 相关文档

### 配置文档
- **配置指南**：`WECHAT_CONFIG_GUIDE.md` - 详细的配置步骤
- **配置脚本**：`setup-wechat.sh` - 自动化配置脚本

### 故障排查文档
- **快速修复**：`WECHAT_BIND_QUICK_FIX.md` - 常见问题快速修复
- **故障排查**：`WECHAT_BIND_TROUBLESHOOTING.md` - 深度故障排查
- **文档索引**：`WECHAT_BIND_README.md` - 所有文档索引

### 开发文档
- **配置指南**：`WECHAT_BIND_SETUP.md` - 绑定微信配置
- **开发总结**：`WECHAT_BIND_SUMMARY.md` - 功能实现总结
- **检查清单**：`WECHAT_BIND_CHECKLIST.md` - 功能检查清单

---

## 🎯 推荐操作流程

### 新用户（首次配置）

1. **阅读配置指南**
   ```bash
   cat WECHAT_CONFIG_GUIDE.md
   ```

2. **运行配置脚本**
   ```bash
   ./setup-wechat.sh
   ```

3. **配置服务器域名**
   - 登录微信公众平台
   - 添加Supabase URL

4. **测试功能**
   - 测试微信一键登录
   - 测试绑定微信

### 遇到问题（故障排查）

1. **查看快速修复指南**
   ```bash
   cat WECHAT_BIND_QUICK_FIX.md
   ```

2. **按照检查清单排查**
   - 检查环境变量
   - 检查Edge Function
   - 检查服务器域名

3. **查看详细故障排查**
   ```bash
   cat WECHAT_BIND_TROUBLESHOOTING.md
   ```

4. **收集日志信息**
   ```bash
   supabase functions logs wechat-quick-login
   supabase functions logs bind-wechat
   ```

---

## 💡 重要提示

### ⚠️ 安全注意事项

1. **不要泄露AppSecret**
   - 不要提交到Git仓库
   - 不要在前端代码中使用
   - 只在Edge Function中使用

2. **使用环境变量**
   - 在Supabase中配置
   - 不要硬编码在代码中

3. **定期更新AppSecret**
   - 定期重置AppSecret
   - 更新后重新部署Edge Function

### 📱 开发调试技巧

1. **查看控制台日志**
   - 打开小程序开发者工具
   - 查看Console标签
   - 观察详细的日志输出

2. **查看Edge Function日志**
   ```bash
   # 实时查看日志
   supabase functions logs wechat-quick-login --follow
   ```

3. **使用开发模式**
   - 勾选"不校验合法域名"
   - 方便本地调试
   - 正式发布前取消勾选

### 🚀 性能优化建议

1. **缓存用户信息**
   - 登录后缓存用户信息
   - 减少重复请求

2. **错误重试机制**
   - 网络错误自动重试
   - 提供友好的错误提示

3. **加载状态提示**
   - 显示加载动画
   - 防止重复点击

---

## 📞 获取帮助

### 问题反馈

如果按照以上步骤仍然无法解决问题，请提供以下信息：

1. **错误截图**
2. **控制台日志**
3. **Edge Function日志**
4. **配置验证结果**：
   ```bash
   supabase secrets list
   supabase functions list
   ```

### 常见错误代码

| 错误代码 | 错误信息 | 解决方法 |
|---------|---------|---------|
| 40013 | invalid appid | 检查AppID配置 |
| 40125 | invalid appsecret | 检查AppSecret配置 |
| 40029 | code无效 | 重新获取code |
| 40163 | code已使用 | 重新获取code |
| -1 | 系统繁忙 | 稍后重试 |

---

## 🎉 配置成功标志

当你看到以下情况时，说明配置成功：

### 微信一键登录成功
- ✅ 点击"微信一键登录"按钮
- ✅ 显示"欢迎加入！"或"欢迎回来！"
- ✅ 自动跳转到首页
- ✅ 可以正常使用所有功能

### 绑定微信成功
- ✅ 点击"绑定微信"按钮
- ✅ 显示"绑定成功"
- ✅ 显示微信OpenID
- ✅ 下次可以使用微信一键登录

---

**最后更新**：2025-11-06
**版本**：1.0
**状态**：待配置

**下一步行动**：
1. 运行`./setup-wechat.sh`配置脚本
2. 配置微信小程序服务器域名
3. 测试微信登录功能
