# 🚨 紧急调试：查看 Edge Function 日志

## 📋 问题现状

用户登录后显示：
- **角色**: employee（错误，应该是 tenant_admin）
- **tenant_id**: 为空（错误，应该有值）

## 🎯 调试目标

确认 Edge Function 是否成功更新了用户的角色和租户ID。

## 📍 步骤 1：重新登录

1. **退出当前登录**
   - 点击"退出登录"按钮

2. **清空浏览器缓存**
   - Chrome/Edge: 按 `Ctrl + Shift + Delete`
   - 选择"缓存的图片和文件"
   - 点击"清除数据"

3. **重新登录**
   - 输入电话号码：18373804961
   - 获取验证码
   - 输入验证码
   - 点击"登录"

## 📍 步骤 2：查看浏览器控制台日志

### 2.1 打开开发者工具

- Windows: 按 `F12` 或 `Ctrl + Shift + I`
- Mac: 按 `Cmd + Option + I`

### 2.2 切换到 Console 标签

### 2.3 查找关键日志

**登录成功后，应该看到**：

```
🔐 登录成功，用户信息: {...}
📋 开始获取用户 profile...
📋 Profile 查询结果: {...}
👤 用户 Profile: {id: "...", phone: "18373804961", tenant_id: null, role: "employee"}
📱 用户电话: 18373804961
🔍 开始验证租户管理员身份...
📡 调用 Edge Function: https://...
📡 Edge Function 响应状态: 200
📡 Edge Function 响应结果: {success: true, data: {...}}
✅ 租户管理员验证成功: {...}
📊 返回的租户信息: {id: "...", name: "...", ...}
⏳ 等待1500ms，确保数据库更新完成...
🔄 第 1 次尝试获取 profile...
📋 Profile 查询结果 (尝试 1): {...}
```

**重点关注**：
1. `Edge Function 响应状态` 是否为 200
2. `Edge Function 响应结果` 是否 success: true
3. `Profile 查询结果 (尝试 1)` 中的 role 和 tenant_id

### 2.4 复制完整日志

- 从"🔐 登录成功"开始
- 到"❌ Profile 的 tenant_id 仍然为空"结束
- 全选并复制

## 📍 步骤 3：查看 Edge Function 日志

### 3.1 登录 Supabase Dashboard

1. 打开浏览器，访问：https://supabase.com/dashboard
2. 登录您的账号
3. 选择您的项目

### 3.2 进入 Edge Functions

1. 在左侧菜单中，点击 **Edge Functions**
2. 找到 `tenant-admin-login` 函数
3. 点击进入

### 3.3 查看 Logs

1. 点击顶部的 **Logs** 标签
2. 查看最近的日志记录
3. 找到您刚才登录时的日志

### 3.4 查找关键日志

**应该看到的日志**：

```
🔍 开始处理租户管理员登录请求...
📡 Supabase URL: https://...
🔑 Service Role Key 存在: true
🔐 Authorization Header 存在: true
🎫 Token 长度: ...
👤 用户验证结果: {userId: "...", userPhone: "18373804961", error: null}
📱 请求的电话号码: 18373804961
📱 清理后的电话号码: 18373804961
🔍 查询租户信息...
🏢 租户查询结果: {tenant: {id: "...", name: "..."}, error: null}
✅ 找到租户: {tenantId: "...", tenantName: "..."}
🔍 查询用户 profile...
👤 Profile 查询结果: {profile: {id: "...", phone: "18373804961", role: "employee", tenant_id: null}, error: null}
🔄 更新现有 profile...
📋 当前 Profile 信息: {id: "...", phone: "18373804961", role: "employee", tenant_id: null}
📝 准备更新的数据: {tenant_id: "...", role: "tenant_admin", phone: "18373804961", updated_at: "..."}
📊 更新结果: {data: [...], error: null}
✅ 用户信息已更新: {id: "...", phone: "18373804961", role: "tenant_admin", tenant_id: "..."}
✅ 登录成功，返回响应: {success: true, ...}
```

**重点关注**：
1. `📋 当前 Profile 信息` - 更新前的状态
2. `📝 准备更新的数据` - 要更新的内容
3. `📊 更新结果` - 更新是否成功
4. `✅ 用户信息已更新` - 更新后的状态

### 3.5 复制 Edge Function 日志

- 复制完整的日志内容
- 特别是从"🔍 开始处理租户管理员登录请求"到"✅ 登录成功"的部分

## 📍 步骤 4：分析日志

### 情况 A：Edge Function 更新成功

**日志特征**：
```
📊 更新结果: {data: [{...}], error: null}
✅ 用户信息已更新: {id: "...", role: "tenant_admin", tenant_id: "..."}
```

**但是浏览器端仍然显示 role: employee**

**可能原因**：
1. 浏览器缓存了旧的数据
2. 前端查询时机太早
3. RLS 策略阻止了查询

**解决方案**：
1. 清空浏览器缓存
2. 增加前端等待时间
3. 检查 RLS 策略

### 情况 B：Edge Function 更新失败

**日志特征**：
```
📊 更新结果: {data: null, error: "..."}
或
❌ 更新用户信息失败: ...
```

**可能原因**：
1. RLS 策略阻止了更新
2. 数据库权限问题
3. 字段类型不匹配

**解决方案**：
1. 检查 RLS 策略
2. 检查 Service Role Key 权限
3. 检查数据库表结构

### 情况 C：Edge Function 没有返回数据

**日志特征**：
```
📊 更新结果: {data: [], error: null}
❌ 更新成功但没有返回数据
```

**可能原因**：
1. 更新条件不匹配（user.id 不正确）
2. profile 不存在
3. 数据库连接问题

**解决方案**：
1. 检查 user.id 是否正确
2. 手动查询数据库确认 profile 存在
3. 检查数据库连接

## 📍 步骤 5：手动检查数据库

### 5.1 进入 SQL Editor

1. 在 Supabase Dashboard 左侧菜单中
2. 点击 **SQL Editor**
3. 点击 **New query**

### 5.2 查询用户 Profile

```sql
-- 查询用户 profile
SELECT 
    id, 
    phone, 
    email, 
    role, 
    tenant_id, 
    created_at, 
    updated_at
FROM profiles
WHERE phone = '18373804961';
```

**预期结果**：
- 应该返回 1 行数据
- `role` 应该是 `tenant_admin`
- `tenant_id` 应该有值（不是 NULL）

**如果结果不符合预期**：
- 记录当前的 `role` 和 `tenant_id`
- 继续下一步

### 5.3 查询租户信息

```sql
-- 查询租户
SELECT 
    id, 
    name, 
    admin_phone, 
    status, 
    created_at
FROM tenants
WHERE admin_phone = '18373804961';
```

**预期结果**：
- 应该返回 1 行数据
- `status` 应该是 `active`
- 记录 `id`（租户ID）

### 5.4 手动更新 Profile（如果需要）

**如果 Edge Function 更新失败，可以手动更新**：

```sql
-- 手动更新 profile
UPDATE profiles
SET 
    role = 'tenant_admin',
    tenant_id = '这里填写租户ID',
    updated_at = NOW()
WHERE phone = '18373804961';

-- 验证更新
SELECT 
    id, 
    phone, 
    role, 
    tenant_id, 
    updated_at
FROM profiles
WHERE phone = '18373804961';
```

**手动更新后**：
1. 退出登录
2. 重新登录
3. 应该能够正常进入系统

## 📍 步骤 6：检查 RLS 策略

### 6.1 查看 profiles 表的 RLS 策略

```sql
-- 查询 profiles 表的 RLS 策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';
```

**预期结果**：
应该有以下策略：
1. `超级管理员可访问所有用户` - FOR ALL
2. `用户可查看自己的信息` - FOR SELECT
3. `用户可更新自己的信息` - FOR UPDATE

### 6.2 检查更新策略

**重点检查 UPDATE 策略**：

```sql
-- 查看 UPDATE 策略的详细信息
SELECT 
    policyname,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'UPDATE';
```

**预期结果**：
- `using_expression` 应该是 `(id = auth.uid())`
- 这意味着用户只能更新自己的 profile

**问题**：
- Edge Function 使用 Service Role Key
- Service Role Key 应该可以绕过 RLS
- 但是如果没有正确配置，可能会被阻止

### 6.3 测试 Service Role Key 权限

**在 Edge Function 中，Service Role Key 应该有完全权限**。

如果 Edge Function 仍然无法更新，可能需要：

1. **检查 Service Role Key 是否正确**
   - 在 Supabase Dashboard 中
   - 进入 Settings → API
   - 确认 Service Role Key 是否正确

2. **检查 Edge Function 的环境变量**
   - 在 Edge Functions 页面
   - 点击 Settings
   - 确认 `SUPABASE_SERVICE_ROLE_KEY` 是否设置

## 📊 完整的调试检查清单

- [ ] 步骤 1：重新登录
- [ ] 步骤 2：查看浏览器控制台日志
  - [ ] 复制完整日志
  - [ ] 确认 Edge Function 响应状态
  - [ ] 确认 Profile 查询结果
- [ ] 步骤 3：查看 Edge Function 日志
  - [ ] 登录 Supabase Dashboard
  - [ ] 进入 Edge Functions
  - [ ] 查看 Logs
  - [ ] 复制完整日志
  - [ ] 确认更新结果
- [ ] 步骤 4：分析日志
  - [ ] 确定是哪种情况（A/B/C）
  - [ ] 记录错误信息
- [ ] 步骤 5：手动检查数据库
  - [ ] 查询用户 Profile
  - [ ] 查询租户信息
  - [ ] 如果需要，手动更新 Profile
- [ ] 步骤 6：检查 RLS 策略
  - [ ] 查看 profiles 表的 RLS 策略
  - [ ] 检查 UPDATE 策略
  - [ ] 测试 Service Role Key 权限

## 📝 需要提供的信息

如果问题仍然存在，请提供：

### 1. 浏览器控制台日志
```
[粘贴完整的控制台日志]
```

### 2. Edge Function 日志
```
[粘贴完整的 Edge Function 日志]
```

### 3. 数据库查询结果

**用户 Profile**：
```
[粘贴查询结果]
```

**租户信息**：
```
[粘贴查询结果]
```

**RLS 策略**：
```
[粘贴查询结果]
```

### 4. 错误截图

- 租户选择页面的错误信息截图
- 调试信息截图

## ✅ 预期的正常流程

### 正常的 Edge Function 日志：
```
🔍 开始处理租户管理员登录请求...
✅ 找到租户: {tenantId: "...", tenantName: "..."}
🔄 更新现有 profile...
📋 当前 Profile 信息: {role: "employee", tenant_id: null}
📝 准备更新的数据: {role: "tenant_admin", tenant_id: "..."}
📊 更新结果: {data: [{role: "tenant_admin", tenant_id: "..."}], error: null}
✅ 用户信息已更新: {role: "tenant_admin", tenant_id: "..."}
✅ 登录成功
```

### 正常的浏览器日志：
```
✅ 租户管理员验证成功
⏳ 等待1500ms，确保数据库更新完成...
🔄 第 1 次尝试获取 profile...
✅ 成功获取到 tenant_id: ...
👤 最终的 Profile: {role: "tenant_admin", tenant_id: "..."}
✅ 用户已有租户，直接跳转到首页
```

### 正常的数据库状态：
```sql
-- profiles 表
id: 728d8bc1-8c5c-4f55-a012-b3d1cededde8
phone: 18373804961
role: tenant_admin  ← 应该是这个
tenant_id: [租户ID]  ← 应该有值
```

---

**文档版本**：v1.0.0  
**更新日期**：2025-11-11  
**作者**：秒哒AI助手  
**状态**：🚨 紧急调试中，需要查看日志
