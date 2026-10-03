# 故障排查指南

本文档提供常见问题的排查方法和解决方案。

## 租户授权登录失败

### 问题描述
在租户授权登录页面，输入手机号和验证码后，点击"登录"按钮，提示"登录失败"或"创建租户失败"。

### 最新修复（2025-11-06 - 第2次）
✅ 已修复 profiles 表的 RLS 策略问题（**根本原因**）：
- 添加了 INSERT 策略：允许认证用户创建自己的 profile
- 添加了系统 INSERT 策略：允许 handle_new_user 触发器创建 profile
- 应用了迁移文件：`supabase/migrations/24_fix_profiles_insert_policy.sql`

✅ 已修复 tenants 表的 RLS 策略问题：
- 添加了 INSERT 策略：允许认证用户创建租户
- 添加了 UPDATE 策略：允许租户管理员更新自己的租户
- 添加了 DELETE 策略：只允许超级管理员删除租户
- 应用了迁移文件：`supabase/migrations/23_fix_tenant_insert_policy.sql`

### 问题原因（按发生顺序）
1. **profiles 表缺少 INSERT 策略**（根本原因）
   - `handle_new_user` 触发器无法插入 profile 记录
   - 导致用户登录后没有 profile 记录
   - 后续的 `createTenantWithAdmin` 函数无法找到 profile，整个流程失败

2. **tenants 表缺少 INSERT 策略**
   - 即使 profile 创建成功，也无法创建租户
   - RLS（Row Level Security）阻止了租户的创建操作

### 解决方案
已通过数据库迁移添加了必要的 RLS 策略，现在认证用户可以正常创建租户。

### 验证方法
1. 打开租户授权登录页面
2. 输入手机号（11位数字，不需要 +86）
3. 点击"获取验证码"按钮
4. 输入收到的验证码
5. 点击"登录"按钮
6. ✅ 应该显示"租户创建成功"或"登录成功"
7. ✅ 自动跳转到首页

### 功能说明
- **首次登录**：自动创建租户，用户成为租户管理员
- **再次登录**：直接登录，无需重复创建租户
- **租户命名**：自动命名为"租户_手机号后4位"（例如：租户_1234）
- **权限设置**：首次登录的用户自动获得租户管理员权限

### 排查步骤

1. **检查浏览器控制台日志**
   - 打开浏览器开发者工具（F12）
   - 切换到 Console 标签
   - 查找以下日志：
     - `=== createTenantWithAdmin 开始 ===` - 函数开始执行
     - `现有 profile:` - 显示用户的 profile 信息
     - `创建新租户:` - 显示租户名称
     - `租户创建成功:` - 显示创建的租户信息
     - `更新 profile 失败:` - 如果失败，显示错误信息

2. **检查数据库策略**
   - 登录 Supabase 控制台
   - 进入 SQL Editor
   - 执行以下查询：
     ```sql
     SELECT policyname, cmd 
     FROM pg_policies 
     WHERE tablename = 'tenants'
     ORDER BY cmd;
     ```
   - 确认存在以下策略：
     - INSERT: "认证用户可以创建租户"
     - UPDATE: "租户管理员可以更新自己的租户"
     - DELETE: "超级管理员可以删除租户"

3. **检查用户认证状态**
   - 确认用户已成功通过验证码验证
   - 确认用户的 auth.users 记录存在
   - 确认用户的 profiles 记录已创建

### 常见问题

#### 问题1：提示"创建租户失败"
**可能原因**：
1. 数据库 RLS 策略未正确配置
2. 用户未正确认证
3. 数据库连接问题

**解决方案**：
1. 确认已应用迁移文件 `23_fix_tenant_insert_policy.sql`
2. 重新登录，确保验证码正确
3. 检查浏览器控制台的详细错误信息

#### 问题2：提示"设置管理员失败"
**可能原因**：
1. profiles 表的 RLS 策略阻止了更新操作
2. 用户的 profile 记录不存在

**解决方案**：
1. 检查 profiles 表的 UPDATE 策略
2. 确认用户的 profile 记录已创建
3. 查看浏览器控制台的详细错误信息

## 手机验证码收不到

### 问题描述
在登录页面输入手机号后，点击"获取验证码"，但手机收不到验证码短信。

### 最新修复（2025-11-06）
✅ 已启用 Supabase 的手机短信验证码功能：
- 使用 `supabase_verification` 工具启用了 phone OTP 功能
- 现在系统可以正常发送短信验证码
- 验证码有效期为 60 秒

### 问题原因
Supabase Auth 的 OTP（一次性密码）功能默认未启用，需要手动启用才能发送短信验证码。

### 解决方案
已通过 `supabase_verification` 工具启用了手机短信验证码功能。

### 验证方法
1. 打开登录页面
2. 输入手机号（格式：+86 开头的中国大陆手机号）
3. 点击"获取验证码"按钮
4. 等待 5-10 秒，应该能收到验证码短信
5. 输入验证码完成登录

### 常见问题

#### 问题1：仍然收不到验证码
**可能原因**：
1. 手机号格式不正确（需要包含国家代码，如 +8613800138000）
2. 短信发送频率限制（同一手机号 60 秒内只能发送一次）
3. 手机号被运营商拦截（检查垃圾短信箱）
4. Supabase 短信配额用完

**解决方案**：
1. 确认手机号格式正确，包含 +86 国家代码
2. 等待 60 秒后重试
3. 检查手机的垃圾短信箱
4. 联系管理员检查 Supabase 短信配额

#### 问题2：验证码过期
**原因**：验证码有效期为 60 秒

**解决方案**：
1. 重新获取验证码
2. 收到验证码后尽快输入

#### 问题3：验证码错误
**原因**：输入的验证码不正确或已过期

**解决方案**：
1. 仔细核对验证码（6位数字）
2. 确认验证码未过期
3. 重新获取新的验证码

### 技术说明
- 验证码发送使用 Supabase Auth 的 OTP 功能
- 短信通过 Supabase 的短信服务提供商发送
- 验证码为 6 位随机数字
- 有效期为 60 秒
- 同一手机号 60 秒内只能发送一次

## 租户配置保存失败

### 问题描述
在租户配置页面点击"保存配置"后，提示"保存失败"。

### 最新修复（2025-11-06）
✅ 已修复租户配置显示错误的问题：
- 修复了从租户管理页面跳转时，配置页面显示错误租户配置的问题
- 添加了 `targetTenantLoaded` 状态，确保目标租户加载完成后才加载配置
- 添加了详细的控制台日志，方便调试

✅ 已修复租户配置表的 RLS 策略：
- 删除了旧的宽松策略（允许所有认证用户操作）
- 创建了严格的多租户隔离策略
- 超级管理员可以管理所有租户配置
- 租户管理员只能管理自己租户的配置
- 添加了详细的调试日志，显示当前用户信息

### 排查步骤

1. **检查浏览器控制台日志**
   - 打开浏览器开发者工具（F12）
   - 切换到 Console 标签
   - 查找以下日志：
     - `加载目标租户:` - 显示要加载的租户ID
     - `目标租户加载成功:` - 显示加载的租户信息
     - `加载租户配置:` - 显示正在加载配置的租户ID和名称
     - `租户配置加载结果:` - 显示加载的配置数据
     - `准备保存租户配置:` - 显示要保存的数据
     - `=== upsertTenantSettings 开始 ===` - API 函数开始执行
     - `当前认证用户:` - 显示当前登录用户的ID
     - `当前用户 profile:` - 显示用户的租户ID和角色
     - `更新租户配置失败:` - 显示错误详情
     - `租户配置更新成功:` - 显示更新后的数据
     - `=== upsertTenantSettings 完成 ===` - API 函数执行完成
     - `保存租户配置结果:` - 显示保存结果

2. **检查数据库表是否存在**
   - 登录 Supabase 控制台
   - 进入 Table Editor
   - 确认 `tenant_settings` 表存在
   - 确认表结构包含以下字段：
     - `id` (uuid)
     - `tenant_id` (uuid)
     - `default_daily_work_hours` (numeric)
     - `brand_name` (text)
     - `industry` (text)
     - `contact_person` (text)
     - `contact_phone` (text)
     - `contact_email` (text)
     - `description` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

3. **检查 RLS 策略**
   - 在 Supabase 控制台，进入 Authentication > Policies
   - 确认 `tenant_settings` 表有以下策略：
     - `认证用户可以管理租户配置` (FOR ALL TO authenticated)
   - 如果策略不存在，执行以下 SQL：
     ```sql
     ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
     
     CREATE POLICY "认证用户可以管理租户配置" ON tenant_settings
       FOR ALL TO authenticated
       USING (true)
       WITH CHECK (true);
     ```

4. **检查用户权限**
   - 确认当前用户已登录
   - 确认用户是租户管理员或超级管理员
   - 在控制台查看 `auth.uid()` 是否有值

### 常见错误及解决方案

#### 错误：`relation "tenant_settings" does not exist`
**原因**：数据库表未创建

**解决方案**：
1. 检查迁移文件是否已应用：`supabase/migrations/10_add_salary_and_staff_count.sql`
2. 手动执行迁移 SQL 创建表

#### 错误：`new row violates row-level security policy`
**原因**：RLS 策略阻止了插入/更新操作

**解决方案**：
1. 确认当前用户的角色和租户ID
   - 查看控制台日志中的 `当前用户 profile:` 信息
   - 确认 `role` 字段的值（应该是 `tenant_admin` 或 `super_admin`）
   - 确认 `tenant_id` 与要保存配置的租户ID一致
2. 如果是超级管理员，应该可以管理所有租户的配置
3. 如果是租户管理员，只能管理自己租户的配置
4. 如果角色或租户ID不匹配，需要在权限管理页面修改用户角色
5. 确认迁移文件 `20_fix_tenant_settings_rls.sql` 已应用
6. 临时禁用 RLS 测试（仅用于调试）：
   ```sql
   ALTER TABLE tenant_settings DISABLE ROW LEVEL SECURITY;
   ```

#### 错误：`duplicate key value violates unique constraint`
**原因**：尝试为同一租户创建多条配置记录

**解决方案**：
- 这是正常的，upsert 操作会自动处理
- 如果仍然失败，检查 `onConflict: 'tenant_id'` 配置是否正确

#### 错误：用户未认证
**原因**：用户未登录或会话已过期

**解决方案**：
1. 查看控制台日志中的 `当前认证用户:` 信息
2. 如果显示 `undefined` 或 `null`，说明用户未登录
3. 重新登录系统
4. 检查 Supabase 配置是否正确（`.env` 文件中的 `TARO_APP_SUPABASE_URL` 和 `TARO_APP_SUPABASE_ANON_KEY`）
5. 检查浏览器是否阻止了 Cookie 或本地存储

## 邀请码生成失败

### 问题描述
在邀请员工页面点击"生成邀请码"后，提示"生成失败"。

### 最新修复（2025-11-06）

✅ **修复3：RLS 策略支持超级管理员**（最新）
- **问题**：超级管理员的 `tenant_id` 是 `null`，旧的 RLS 策略要求 `tenant_id` 必须匹配，导致无法创建邀请码
- **解决方案**：
  - 修改 INSERT/UPDATE/DELETE/SELECT 策略
  - 允许超级管理员（`role = 'super_admin'`）创建任何租户的邀请码
  - 允许租户管理员（`role = 'tenant_admin'`）创建自己租户的邀请码
  - 应用了迁移文件：`supabase/migrations/22_fix_invitation_codes_rls.sql`
- **影响**：超级管理员现在可以正常创建邀请码了

✅ **修复2：邀请码生成函数的字段名错误**
- 将函数中的字段名从 `invitation_code` 改为 `code`
- 修复了邀请码生成失败的问题
- 确保函数正确检查邀请码的唯一性
- 应用了迁移文件：`supabase/migrations/21_fix_invitation_code_function.sql`

✅ **修复1：添加详细的调试日志**
- 显示当前认证用户ID
- 显示当前用户的 profile 信息（tenant_id, role）
- 显示准备插入的邀请码数据
- 显示详细的错误信息（message, details, hint, code）

### 排查步骤

1. **检查浏览器控制台日志**
   - 打开浏览器开发者工具（F12）
   - 切换到 Console 标签
   - 查找以下日志：
     - `准备生成邀请码:` - 显示生成参数
     - `=== generateInvitationCode 开始 ===` - API 函数开始执行
     - `当前认证用户:` - 显示当前登录用户的ID
     - `当前用户 profile:` - 显示用户的租户ID和角色
     - `生成的邀请码:` - 显示生成的邀请码
     - `准备插入邀请码记录:` - 显示要插入的数据
     - `保存邀请码失败:` - 显示详细错误信息
     - `=== generateInvitationCode 完成 ===` - 显示最终结果

2. **检查数据库函数是否存在**
   - 登录 Supabase 控制台
   - 进入 SQL Editor
   - 执行以下查询：
     ```sql
     SELECT proname, prosrc 
     FROM pg_proc 
     WHERE proname = 'generate_invitation_code';
     ```
   - 确认函数存在且返回结果

3. **检查数据库表是否存在**
   - 确认 `invitation_codes` 表存在
   - 确认表结构包含以下字段：
     - `id` (uuid)
     - `tenant_id` (uuid)
     - `store_id` (uuid, nullable)
     - `code` (text, unique)
     - `role` (user_role)
     - `max_uses` (integer)
     - `used_count` (integer)
     - `expires_at` (timestamptz)
     - `created_by` (uuid)
     - `created_at` (timestamptz)
     - `status` (text)

4. **检查 RLS 策略**
   - 确认 `invitation_codes` 表有以下策略：
     - `租户管理员可以创建本租户邀请码` (FOR INSERT)
   - 确认当前用户是租户管理员或超级管理员

5. **测试数据库函数**
   - 在 SQL Editor 中执行：
     ```sql
     SELECT generate_invitation_code();
     ```
   - 应该返回一个 8 位随机字符串
   - 如果失败，检查函数定义

### 常见错误及解决方案

#### 错误：`function generate_invitation_code() does not exist`
**原因**：数据库函数未创建

**解决方案**：
1. 检查迁移文件是否已应用：`supabase/migrations/19_create_invitation_code_function.sql`
2. 手动执行迁移 SQL 创建函数

#### 错误：`new row violates row-level security policy`
**原因**：RLS 策略阻止了插入操作

**解决方案**：
1. 确认当前用户的角色是 `tenant_admin` 或 `super_admin`
   - 查看控制台日志中的 `当前用户 profile:` 信息
   - 确认 `role` 字段的值
2. 确认用户的 `tenant_id` 与要创建邀请码的 `tenant_id` 一致
   - 查看控制台日志中的 `当前用户 profile:` 信息
   - 对比 `准备插入邀请码记录:` 中的 `tenant_id`
3. 如果角色或租户ID不匹配，需要在权限管理页面修改用户角色
4. 检查 RLS 策略中的子查询是否正确：
   ```sql
   SELECT * FROM profiles WHERE id = auth.uid();
   ```

#### 错误：`duplicate key value violates unique constraint "invitation_codes_code_key"`
**原因**：生成的邀请码已存在（极低概率）

**解决方案**：
- 重试生成
- 如果频繁出现，检查 `generate_invitation_code` 函数的随机性

#### 错误：`无法生成唯一邀请码，请稍后重试`
**原因**：连续 10 次生成的邀请码都已存在

**解决方案**：
- 这种情况极其罕见
- 检查 `invitation_codes` 表中的数据量
- 考虑增加邀请码长度或字符集

## 租户授权登录

### 功能说明
租户授权登录页面（`/pages/tenant-auth-login/index`）用于平台管理员授权的手机号首次登录。

### 最新修复（2025-11-06）
✅ 已修复租户授权登录逻辑：
- 修复了使用 `employees` 表而不是 `profiles` 表的问题
- 现在正确使用 `profiles` 表来管理用户和租户关系
- 首次登录会自动创建租户并设置用户为租户管理员
- 添加了详细的控制台日志，方便调试

### 登录流程

1. **首次登录**：
   - 用户输入平台管理员授权的手机号
   - 接收并输入短信验证码
   - 系统验证验证码
   - 自动创建新租户（命名为"租户_手机号后4位"）
   - 自动创建用户 profile 记录（通过触发器）
   - 将用户设置为租户管理员（role = 'tenant_admin'）
   - 跳转到首页

2. **再次登录**：
   - 用户输入手机号和验证码
   - 系统验证验证码
   - 检测到用户已有租户
   - 直接登录，跳转到首页

### 调试日志

查看浏览器控制台日志：
- `=== createTenantWithAdmin 开始 ===` - 开始创建租户
- `现有 profile:` - 显示用户的 profile 信息
- `用户已有租户，直接登录` - 用户已有租户
- `创建新租户:` - 显示要创建的租户名称
- `租户创建成功:` - 显示创建的租户信息
- `更新 profile 失败:` - 显示更新失败的错误
- `=== createTenantWithAdmin 完成 ===` - 创建完成

### 常见问题

#### 问题：首次登录后没有创建租户
**排查步骤**：
1. 检查控制台日志，查看 `createTenantWithAdmin` 的执行过程
2. 确认 `profiles` 表的触发器是否正常工作
3. 检查 `tenants` 表的 RLS 策略是否允许插入

#### 问题：用户角色不是租户管理员
**排查步骤**：
1. 检查控制台日志中的 `更新 profile 失败:` 错误
2. 确认 `profiles` 表的 RLS 策略是否允许更新
3. 手动在 Supabase 控制台更新用户角色：
   ```sql
   UPDATE profiles 
   SET role = 'tenant_admin' 
   WHERE id = '<用户ID>';
   ```

## 权限管理功能

### 功能说明
权限管理页面（`/pages/user-management/index`）已经支持以下功能：

1. **查看用户列表**
   - 显示租户内所有用户
   - 显示用户角色、状态、联系方式

2. **修改用户角色**
   - 点击"修改角色"按钮
   - 选择新角色：普通员工、店经理、租户管理员
   - 确认后立即生效

3. **启用/停用用户**
   - 点击"启用"或"停用"按钮
   - 确认后立即生效
   - 停用的用户无法登录

4. **删除用户**
   - 点击"删除"按钮
   - 确认后删除用户及其关联数据
   - 不能删除自己

### 访问权限
- 仅租户管理员和超级管理员可以访问
- 其他角色访问会显示"您没有权限访问此页面"

## 通用调试技巧

### 1. 查看 Supabase 日志
- 登录 Supabase 控制台
- 进入 Logs > API Logs
- 查看最近的请求和错误

### 2. 检查网络请求
- 打开浏览器开发者工具（F12）
- 切换到 Network 标签
- 筛选 XHR/Fetch 请求
- 查看请求和响应内容

### 3. 验证环境变量
- 检查 `.env` 文件
- 确认 `TARO_APP_SUPABASE_URL` 和 `TARO_APP_SUPABASE_ANON_KEY` 正确
- 重启开发服务器使环境变量生效

### 4. 清除缓存
- 清除浏览器缓存
- 清除 localStorage
- 重新登录

### 5. 检查数据库迁移
- 确认所有迁移文件已应用
- 检查迁移顺序是否正确
- 查看 Supabase 控制台的 Migrations 页面

## 联系支持

如果以上方法都无法解决问题，请提供以下信息：

1. 完整的错误日志（浏览器控制台）
2. Supabase API 日志截图
3. 操作步骤和预期结果
4. 当前用户角色和租户信息
