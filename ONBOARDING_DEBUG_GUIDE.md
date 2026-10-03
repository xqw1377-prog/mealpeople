# 入职页面加载失败调试指南

## 问题描述
用户反馈入职页面加载失败

## 已添加的调试日志

### 1. 入职页面日志 (`src/pages/onboarding/index.tsx`)

在入职页面的 `loadData` 函数中添加了详细的日志输出：

```typescript
console.log('入职页面：开始加载数据，用户ID:', user.id)
console.log('入职页面：开始获取员工信息')
console.log('入职页面：员工信息:', employee)
console.log('入职页面：租户ID:', tenantId)
console.log('入职页面：统计数据:', statsData)
console.log('入职页面：流程数据:', processesData)
```

### 2. 员工查询日志 (`src/db/modules/user.ts`)

在 `getEmployeeByUserId` 函数中添加了详细的日志输出：

```typescript
console.log('getEmployeeByUserId: 开始查询，用户ID:', userId)
console.log('getEmployeeByUserId: 查询结果:', data)
```

## 调试步骤

### 步骤1：检查用户登录状态
1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签
3. 刷新入职页面
4. 查看是否有 "入职页面：用户ID不存在" 的日志
   - 如果有，说明用户未登录或登录状态丢失
   - 解决方案：重新登录

### 步骤2：检查员工信息查询
1. 查看控制台日志中的 "getEmployeeByUserId: 开始查询，用户ID:" 
2. 确认用户ID是否正确
3. 查看 "getEmployeeByUserId: 查询结果:" 的输出
   - 如果结果为 `null`，说明数据库中没有该用户的员工记录
   - 如果有错误信息，说明数据库查询失败

### 步骤3：检查员工记录是否存在
如果员工信息为 null，需要检查数据库：

```sql
-- 查询用户的员工记录
SELECT * FROM employees WHERE user_id = '用户ID';

-- 查询用户的基本信息
SELECT * FROM profiles WHERE id = '用户ID';
```

### 步骤4：检查租户ID
1. 查看控制台日志中的 "入职页面：员工信息:"
2. 确认员工信息中是否包含 `tenant_id` 字段
3. 如果没有 `tenant_id`，会看到错误提示："员工信息不完整，请联系管理员"

## 常见问题及解决方案

### 问题1：未找到员工信息
**现象**：页面显示 "未找到员工信息，请先完善个人资料"

**原因**：
- 用户在 `profiles` 表中存在，但在 `employees` 表中没有对应记录
- 用户可能是通过手机验证码登录的新用户，还没有创建员工记录

**解决方案**：
1. 管理员需要在员工管理页面为该用户创建员工记录
2. 或者用户需要先完成入职申请流程

### 问题2：员工信息不完整
**现象**：页面显示 "员工信息不完整，请联系管理员"

**原因**：
- 员工记录存在，但 `tenant_id` 字段为空
- 数据迁移或导入时可能遗漏了租户ID

**解决方案**：
管理员需要更新员工记录，添加正确的租户ID：

```sql
UPDATE employees 
SET tenant_id = '正确的租户ID' 
WHERE user_id = '用户ID';
```

### 问题3：数据库查询失败
**现象**：控制台显示 "getEmployeeByUserId: 查询失败"

**原因**：
- 数据库连接问题
- 权限配置问题（RLS策略）
- 表结构不匹配

**解决方案**：
1. 检查 Supabase 连接配置
2. 检查 RLS 策略是否正确
3. 确认 `employees` 表结构是否完整

## 数据库表结构检查

### employees 表必需字段
```sql
CREATE TABLE employees (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL,  -- 必需字段
    store_id uuid NOT NULL,
    user_id uuid,             -- 关联到 profiles 表
    name text NOT NULL,
    phone text,
    employee_type text,
    position text,
    status text,
    created_at timestamptz,
    updated_at timestamptz
);
```

### 检查RLS策略
```sql
-- 查看 employees 表的 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'employees';
```

## 临时解决方案

如果需要快速让用户能够访问入职页面，可以：

### 方案1：创建员工记录
```sql
INSERT INTO employees (
    tenant_id,
    store_id,
    user_id,
    name,
    phone,
    employee_type,
    position,
    status
) VALUES (
    '租户ID',
    '门店ID',
    '用户ID',
    '用户姓名',
    '手机号',
    'full_time',
    '职位',
    'active'
);
```

### 方案2：修改页面逻辑（不推荐）
如果确实没有员工记录，可以考虑使用用户的 `tenant_id`（如果 profiles 表有这个字段）：

```typescript
// 先尝试从员工表获取
let employee = await getEmployeeByUserId(user.id)

// 如果没有员工记录，尝试从用户表获取租户ID
if (!employee) {
  const profile = await getProfileByUserId(user.id)
  if (profile?.tenant_id) {
    // 使用用户表的租户ID
    tenantId = profile.tenant_id
  }
}
```

## 预防措施

### 1. 完善用户注册流程
确保用户注册时自动创建员工记录：

```typescript
// 在用户注册成功后
async function onUserRegistered(userId: string, tenantId: string) {
  await createEmployee({
    user_id: userId,
    tenant_id: tenantId,
    store_id: defaultStoreId,
    name: userName,
    phone: userPhone,
    employee_type: 'full_time',
    status: 'active'
  })
}
```

### 2. 添加数据完整性检查
在关键页面加载前检查数据完整性：

```typescript
async function checkUserDataIntegrity(userId: string) {
  const profile = await getProfileByUserId(userId)
  const employee = await getEmployeeByUserId(userId)
  
  if (!employee && profile) {
    // 自动创建员工记录
    await createEmployeeFromProfile(profile)
  }
}
```

### 3. 优化错误提示
提供更明确的错误信息和操作指引：

```typescript
if (!employee) {
  Taro.showModal({
    title: '提示',
    content: '您还没有员工档案，是否前往完善资料？',
    success: (res) => {
      if (res.confirm) {
        Taro.navigateTo({url: '/pages/profile-setup/index'})
      }
    }
  })
}
```

## 后续优化建议

1. **统一数据模型**
   - 考虑是否需要同时维护 `profiles` 和 `employees` 两张表
   - 如果可以，将租户信息统一存储在一个地方

2. **改进入职流程**
   - 新用户注册后自动引导完成员工信息填写
   - 提供清晰的入职步骤指引

3. **增强错误处理**
   - 为每种错误情况提供具体的解决方案
   - 添加"联系管理员"的快捷入口

4. **数据同步机制**
   - 确保 `profiles` 和 `employees` 表的数据一致性
   - 添加数据同步触发器或定时任务

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

1. 控制台完整的错误日志
2. 用户ID
3. 数据库查询结果截图
4. 用户的操作步骤

---

**文档版本**：1.0  
**更新日期**：2025-11-06  
**维护人员**：秒哒AI助手
