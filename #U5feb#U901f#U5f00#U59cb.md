# 快速开始指南

## 🚀 5分钟快速部署

### 步骤1：执行数据库迁移（1分钟）

在 Supabase SQL Editor 中执行：

```sql
-- 添加 admin_phone 字段
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admin_phone text;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tenants_admin_phone ON tenants(admin_phone);

-- 移除 invitation_code 字段（如果存在）
ALTER TABLE tenants DROP COLUMN IF EXISTS invitation_code;
```

### 步骤2：创建测试租户（1分钟）

```sql
-- 创建测试租户（请替换为您的测试电话号码）
INSERT INTO tenants (
  name,
  admin_phone,
  industry,
  package_type,
  status
) VALUES (
  '测试租户',
  '13800138000',  -- 替换为您的电话号码
  '火锅',
  'basic',
  'active'
);

-- 验证创建成功
SELECT * FROM tenants WHERE admin_phone = '13800138000';
```

### 步骤3：部署 Edge Functions（2分钟）

```bash
# 进入项目目录
cd /workspace/app-7daop8q0sxdt

# 部署 tenant-admin-login
supabase functions deploy tenant-admin-login

# 部署 super-admin-create-tenant
supabase functions deploy super-admin-create-tenant
```

### 步骤4：编译并上传小程序（1分钟）

```bash
# 清除缓存
rm -rf dist .taro_cache node_modules/.cache

# 编译小程序
npm run build:weapp

# 使用微信开发者工具上传
```

### 步骤5：测试登录

1. 打开小程序
2. 输入电话号码：`13800138000`
3. 获取并输入验证码
4. 点击登录
5. 查看控制台日志

## 📋 验证清单

### 数据库验证

```sql
-- 1. 检查字段是否存在
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'tenants' AND column_name = 'admin_phone';

-- 2. 检查租户是否创建
SELECT * FROM tenants WHERE admin_phone = '13800138000';

-- 3. 检查索引是否创建
SELECT indexname FROM pg_indexes 
WHERE tablename = 'tenants' AND indexname = 'idx_tenants_admin_phone';
```

### Edge Functions 验证

在 Supabase Dashboard → Edge Functions 页面：
- ✅ tenant-admin-login 显示为已部署
- ✅ super-admin-create-tenant 显示为已部署

### 前端验证

在微信开发者工具控制台：
- ✅ 看到登录日志输出
- ✅ 没有错误信息
- ✅ 成功跳转到首页或租户选择页面

## 🔍 查看日志

### 前端日志

在微信开发者工具控制台查看：

```
🔐 登录成功，用户信息: {...}
📋 开始获取用户 profile...
👤 用户 Profile: {...}
📱 用户电话: 13800138000
🔍 开始验证租户管理员身份...
📡 调用 Edge Function: https://...
📡 Edge Function 响应状态: 200
✅ 租户管理员验证成功: {...}
```

### Edge Function 日志

在 Supabase Dashboard → Edge Functions → tenant-admin-login → Logs 查看：

```
🔍 开始处理租户管理员登录请求...
📡 Supabase URL: https://...
🔑 Service Role Key 存在: true
🔐 Authorization Header 存在: true
👤 用户验证结果: {...}
📱 请求的电话号码: 13800138000
🔍 查询租户信息...
✅ 找到租户: {...}
✅ 登录成功，返回响应: {...}
```

## ⚠️ 常见问题

### 问题1：登录后跳转到租户选择页面

**原因**：这是降级方案，说明验证失败或 Edge Function 未部署

**解决**：
1. 检查 Edge Function 是否部署
2. 检查租户是否创建
3. 检查 admin_phone 是否正确

### 问题2：验证码发送失败

**原因**：Supabase Auth 配置问题

**解决**：
1. 登录 Supabase Dashboard
2. 进入 Authentication → Settings
3. 启用 Phone Auth
4. 配置短信服务商

### 问题3：Edge Function 404

**原因**：Function 未部署或名称错误

**解决**：
```bash
# 查看已部署的 Functions
supabase functions list

# 重新部署
supabase functions deploy tenant-admin-login
```

## 📚 更多文档

- [新登录流程使用指南](./新登录流程使用指南.md) - 详细的使用说明
- [登录问题调试指南](./登录问题调试指南.md) - 问题排查和解决
- [部署新登录流程](./部署新登录流程.md) - 完整的部署步骤

## 🆘 需要帮助？

如果遇到问题：

1. **查看日志**：前端控制台 + Edge Function 日志
2. **查看文档**：登录问题调试指南
3. **执行 SQL**：验证数据是否正确
4. **联系支持**：提供完整的日志和错误信息

---

**文档版本**：v1.0.0  
**更新日期**：2025-11-11  
**作者**：秒哒AI助手
