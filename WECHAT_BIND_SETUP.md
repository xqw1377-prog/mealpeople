# 微信绑定功能配置指南

## 功能概述

绑定微信功能允许用户将其系统账号与微信账号关联，实现：
- 微信一键登录
- 账号安全保护
- 跨设备数据同步

---

## 配置步骤

### 1. 获取微信小程序配置

#### 1.1 登录微信公众平台
访问：https://mp.weixin.qq.com/

#### 1.2 获取AppID和AppSecret
1. 进入"开发" -> "开发管理" -> "开发设置"
2. 找到"开发者ID"部分
3. 复制以下信息：
   - **AppID (小程序ID)**
   - **AppSecret (小程序密钥)**

> ⚠️ **重要提示**：AppSecret非常重要，请妥善保管，不要泄露！

---

### 2. 配置环境变量

#### 2.1 本地开发环境配置

编辑项目根目录的`.env`文件：

```bash
# 微信小程序配置
TARO_APP_WECHAT_APPID=你的微信小程序AppID
TARO_APP_WECHAT_APPSECRET=你的微信小程序AppSecret
```

#### 2.2 Supabase环境变量配置

需要在Supabase项目中配置Edge Function的环境变量：

1. 登录Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单 "Settings" -> "Edge Functions"
4. 添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `WECHAT_APPID` | 你的微信小程序AppID | 用于调用微信API |
| `WECHAT_APPSECRET` | 你的微信小程序AppSecret | 用于调用微信API |

> 💡 **提示**：也可以使用Supabase CLI配置：
> ```bash
> supabase secrets set WECHAT_APPID=你的AppID
> supabase secrets set WECHAT_APPSECRET=你的AppSecret
> ```

---

### 3. 部署Edge Function

#### 3.1 确认Edge Function文件存在

检查以下文件是否存在：
```
supabase/functions/bind-wechat/index.ts
```

#### 3.2 部署Edge Function

使用Supabase CLI部署：

```bash
# 部署bind-wechat函数
supabase functions deploy bind-wechat
```

或者使用项目提供的部署脚本（如果有）。

---

### 4. 数据库配置

#### 4.1 确认数据库字段

确保`profiles`表包含以下字段：

```sql
-- 微信OpenID字段
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid text UNIQUE;

-- 微信UnionID字段（可选）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid text UNIQUE;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON profiles(wechat_openid);
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_unionid ON profiles(wechat_unionid);
```

> ✅ 如果已经运行过迁移文件，这些字段应该已经存在。

---

### 5. 微信小程序配置

#### 5.1 配置服务器域名

在微信公众平台配置合法域名：

1. 进入"开发" -> "开发管理" -> "开发设置"
2. 找到"服务器域名"部分
3. 添加以下域名到"request合法域名"：

```
https://你的Supabase项目URL
https://api.weixin.qq.com
```

例如：
```
https://abcdefgh.supabase.co
https://api.weixin.qq.com
```

#### 5.2 配置业务域名（可选）

如果需要在H5环境中使用，还需要配置业务域名。

---

## 功能测试

### 测试步骤

1. **启动小程序**
   ```bash
   pnpm run dev:weapp
   ```

2. **登录系统**
   - 使用手机号验证码登录

3. **进入"我的"页面**
   - 点击底部导航栏的"我的"

4. **点击"绑定微信"**
   - 进入绑定微信页面

5. **点击"立即绑定微信"**
   - 系统会调用微信授权
   - 绑定成功后显示"绑定成功"提示

6. **验证绑定状态**
   - 返回"我的"页面
   - 绑定状态应显示为"已绑定"
   - 可以看到微信OpenID

### 测试解绑功能

1. **进入绑定微信页面**
2. **点击"解绑微信"**
3. **确认解绑**
4. **验证解绑成功**

---

## 常见问题

### Q1：提示"微信小程序配置缺失"

**原因**：Supabase Edge Function的环境变量未配置

**解决方案**：
1. 检查Supabase Dashboard中的Edge Functions环境变量
2. 确保`WECHAT_APPID`和`WECHAT_APPSECRET`已正确配置
3. 重新部署Edge Function

### Q2：提示"该微信账号已被其他用户绑定"

**原因**：该微信OpenID已经绑定到其他用户账号

**解决方案**：
1. 使用其他微信账号
2. 或者先解绑原有账号

### Q3：提示"此功能仅在微信小程序中可用"

**原因**：在H5环境中使用了小程序专属功能

**解决方案**：
1. 在微信小程序中使用绑定功能
2. H5环境暂不支持微信绑定

### Q4：绑定后无法使用微信登录

**原因**：微信登录功能需要单独配置

**解决方案**：
1. 确保`wechat-login` Edge Function已部署
2. 确保登录页面已集成微信登录按钮
3. 检查微信登录流程是否正确

### Q5：调用微信API失败

**原因**：AppID或AppSecret配置错误

**解决方案**：
1. 检查微信公众平台的AppID和AppSecret
2. 确保复制时没有多余的空格
3. 重新配置环境变量

---

## 安全注意事项

### 1. AppSecret保护
- ❌ 不要将AppSecret提交到代码仓库
- ❌ 不要在前端代码中暴露AppSecret
- ✅ 只在Edge Function中使用AppSecret
- ✅ 使用环境变量管理AppSecret

### 2. OpenID保护
- ✅ OpenID是用户的唯一标识，需要妥善保管
- ✅ 不要在日志中输出完整的OpenID
- ✅ 使用数据库唯一约束防止重复绑定

### 3. 权限控制
- ✅ 只允许用户绑定自己的账号
- ✅ 解绑时需要二次确认
- ✅ 记录绑定和解绑操作日志

---

## 技术架构

### 数据流程

```
用户点击绑定
    ↓
调用Taro.login()获取code
    ↓
发送code到bind-wechat Edge Function
    ↓
Edge Function调用微信API获取openid
    ↓
更新用户profile的wechat_openid字段
    ↓
返回绑定结果
    ↓
显示绑定成功
```

### 涉及的文件

1. **前端页面**
   - `src/pages/bind-wechat/index.tsx` - 绑定微信页面
   - `src/pages/profile/index.tsx` - 我的页面（入口）

2. **API函数**
   - `src/db/api.ts` - `bindWechatToProfile()` 函数

3. **Edge Function**
   - `supabase/functions/bind-wechat/index.ts` - 绑定微信服务

4. **数据库**
   - `profiles`表 - 存储用户信息和微信绑定信息

---

## 开发者文档

### API接口

#### bindWechatToProfile

**功能**：绑定或解绑微信

**参数**：
- `userId: string` - 用户ID
- `code: string | null` - 微信登录code，为null时表示解绑

**返回值**：
```typescript
{
  success: boolean
  message?: string
}
```

**示例**：
```typescript
// 绑定微信
const result = await bindWechatToProfile(userId, code)

// 解绑微信
const result = await bindWechatToProfile(userId, null)
```

### Edge Function接口

#### POST /functions/v1/bind-wechat

**请求体**：
```json
{
  "code": "微信登录code",
  "userId": "用户ID"
}
```

**响应**：
```json
{
  "success": true,
  "message": "绑定微信成功",
  "data": {
    "openid": "微信OpenID",
    "unionid": "微信UnionID（可选）"
  }
}
```

---

## 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2025-11-06 | 1.0 | 初始版本，完成绑定微信功能 |

---

## 联系支持

如有问题或需要帮助，请联系技术支持团队。
