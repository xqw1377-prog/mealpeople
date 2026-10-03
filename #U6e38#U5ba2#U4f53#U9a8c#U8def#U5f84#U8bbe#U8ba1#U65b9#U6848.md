# 游客体验路径设计方案

## 📋 需求概述

允许未注册的用户通过电话号码获取验证码，进入系统体验功能，降低注册门槛，提高用户转化率。

## 🎯 设计目标

1. **降低门槛**：无需邀请码，只需手机号即可体验
2. **功能完整**：游客可以体验核心功能
3. **数据隔离**：游客数据与正式租户数据隔离
4. **转化引导**：提供清晰的转化路径
5. **权限控制**：游客只能查看，不能修改

## 🏗️ 架构设计

### 1. 用户角色扩展

#### 当前角色
- `super_admin`：超级管理员
- `tenant_admin`：租户管理员
- `store_manager`：店经理
- `employee`：普通员工

#### 新增角色
- `guest`：游客用户

### 2. 演示租户（Demo Tenant）

创建一个特殊的演示租户，用于游客体验：

```sql
-- 演示租户信息
id: 'demo-tenant-uuid'
name: '演示租户'
industry: '餐饮'
status: 'active'
is_demo: true  -- 标记为演示租户
```

#### 演示租户特点
1. **示例数据**：包含完整的示例数据
   - 3个门店
   - 20个员工
   - 完整的排班记录
   - 历史数据和统计
2. **只读模式**：游客只能查看，不能修改
3. **数据重置**：每天自动重置数据
4. **共享访问**：所有游客共享同一个演示租户

### 3. 登录流程设计

#### 游客登录流程

```
用户打开登录页面
  ↓
输入手机号
  ↓
获取验证码
  ↓
输入验证码
  ↓
点击登录
  ↓
系统检测：用户是否有租户？
  ├─ 有租户 → 正常登录流程
  └─ 无租户 → 游客流程
       ↓
       标记为游客（role = 'guest'）
       ↓
       关联到演示租户
       ↓
       跳转到首页
       ↓
       显示游客欢迎卡片
       ↓
       用户可以体验所有功能（只读）
```

#### 游客转化流程

```
游客在首页看到提示卡片
  ↓
点击"创建我的租户"或"申请加入租户"
  ↓
选择转化方式：
  ├─ 创建租户
  │   ↓
  │   填写租户信息
  │   ↓
  │   创建成功
  │   ↓
  │   角色变更：guest → tenant_admin
  │   ↓
  │   跳转到新租户
  │
  └─ 加入租户
      ↓
      输入邀请码
      ↓
      验证成功
      ↓
      角色变更：guest → employee/store_manager
      ↓
      跳转到对应租户
```

## 💻 技术实现

### 1. 数据库修改

#### 1.1 扩展用户角色

```sql
-- 修改 user_role 枚举类型，添加 guest
ALTER TYPE user_role ADD VALUE 'guest';
```

#### 1.2 创建演示租户

```sql
-- 插入演示租户
INSERT INTO tenants (id, name, industry, status, is_demo, created_at)
VALUES (
  'demo-tenant-uuid',
  '演示租户 - 体验版',
  '餐饮',
  'active',
  true,
  now()
);

-- 添加 is_demo 字段到 tenants 表
ALTER TABLE tenants ADD COLUMN is_demo boolean DEFAULT false;
```

#### 1.3 创建演示数据

```sql
-- 创建演示门店
INSERT INTO stores (tenant_id, name, address, status) VALUES
  ('demo-tenant-uuid', '演示门店A', '北京市朝阳区演示路1号', 'active'),
  ('demo-tenant-uuid', '演示门店B', '北京市海淀区演示路2号', 'active'),
  ('demo-tenant-uuid', '演示门店C', '北京市西城区演示路3号', 'active');

-- 创建演示员工
INSERT INTO employees (tenant_id, store_id, name, phone, position, status) VALUES
  ('demo-tenant-uuid', 'store-a-uuid', '张三', '13800000001', '店长', 'active'),
  ('demo-tenant-uuid', 'store-a-uuid', '李四', '13800000002', '服务员', 'active'),
  -- ... 更多员工
```

#### 1.4 修改 RLS 策略

```sql
-- 游客可以查看演示租户的数据
CREATE POLICY "游客可以查看演示租户数据" ON tenants
  FOR SELECT
  USING (
    is_demo = true 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'guest'::user_role
    )
  );

-- 游客不能修改任何数据
CREATE POLICY "游客不能修改数据" ON tenants
  FOR UPDATE
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'guest'::user_role
    )
  );
```

### 2. 前端修改

#### 2.1 登录页面（src/pages/login/index.tsx）

```typescript
// 登录成功后的处理
const handleLoginSuccess = async (user: any) => {
  // ... 现有逻辑
  
  // 获取用户 profile
  const profile = await getProfileById(user.id)
  
  if (!profile.tenant_id) {
    // 用户没有租户，标记为游客
    console.log('🎭 用户没有租户，设置为游客模式')
    
    // 更新用户角色为 guest
    await updateUserRole(user.id, 'guest')
    
    // 获取演示租户
    const demoTenant = await getDemoTenant()
    
    // 设置租户上下文
    setCurrentTenant(demoTenant)
    setCurrentUser({...profile, role: 'guest'})
    
    // 显示游客欢迎提示
    Taro.showToast({
      title: '欢迎体验系统',
      icon: 'success',
      duration: 2000
    })
    
    // 跳转到首页
    setTimeout(() => {
      redirectTo({url: '/pages/home/index'})
    }, 1000)
  } else {
    // 正常登录流程
    // ... 现有逻辑
  }
}
```

#### 2.2 首页（src/pages/home/index.tsx）

```typescript
// 添加游客欢迎卡片
{currentUser?.role === 'guest' && (
  <View className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-4 shadow-lg">
    <View className="flex items-center gap-3 mb-4">
      <View className="i-mdi-account-circle text-4xl text-white" />
      <View className="flex-1">
        <Text className="text-lg font-bold text-white block mb-1">
          欢迎体验系统
        </Text>
        <Text className="text-sm text-blue-100 block">
          您正在使用演示租户，可以查看所有功能
        </Text>
      </View>
    </View>
    
    <View className="flex gap-2">
      <View
        className="flex-1 bg-white bg-opacity-20 rounded-xl p-3 text-center active:bg-opacity-30"
        onClick={() => navigateTo({url: '/pages/create-tenant/index'})}>
        <View className="i-mdi-store-plus text-2xl text-white mx-auto mb-1" />
        <Text className="text-sm text-white block">创建我的租户</Text>
      </View>
      
      <View
        className="flex-1 bg-white bg-opacity-20 rounded-xl p-3 text-center active:bg-opacity-30"
        onClick={() => navigateTo({url: '/pages/join-tenant/index'})}>
        <View className="i-mdi-account-plus text-2xl text-white mx-auto mb-1" />
        <Text className="text-sm text-white block">加入现有租户</Text>
      </View>
    </View>
  </View>
)}
```

#### 2.3 权限控制

```typescript
// 在所有修改操作前检查权限
const checkGuestPermission = () => {
  const currentUser = useTenantStore((state) => state.currentUser)
  
  if (currentUser?.role === 'guest') {
    Taro.showModal({
      title: '游客模式',
      content: '您当前处于游客模式，只能查看数据。\n\n要使用完整功能，请创建您的租户或加入现有租户。',
      showCancel: true,
      cancelText: '继续体验',
      confirmText: '创建租户',
      success: (res) => {
        if (res.confirm) {
          navigateTo({url: '/pages/create-tenant/index'})
        }
      }
    })
    return false
  }
  
  return true
}

// 使用示例
const handleSave = () => {
  if (!checkGuestPermission()) {
    return
  }
  
  // 执行保存操作
  // ...
}
```

### 3. API 修改

#### 3.1 添加游客相关 API（src/db/api.ts）

```typescript
/**
 * 获取演示租户
 */
export async function getDemoTenant(): Promise<Tenant | null> {
  const {data, error} = await supabase
    .from('tenants')
    .select('*')
    .eq('is_demo', true)
    .eq('status', 'active')
    .maybeSingle()
  
  if (error) {
    console.error('获取演示租户失败:', error)
    return null
  }
  
  return data
}

/**
 * 更新用户角色
 */
export async function updateUserRole(
  userId: string,
  role: 'guest' | 'employee' | 'store_manager' | 'tenant_admin' | 'super_admin'
): Promise<boolean> {
  const {error} = await supabase
    .from('profiles')
    .update({role})
    .eq('id', userId)
  
  if (error) {
    console.error('更新用户角色失败:', error)
    return false
  }
  
  return true
}

/**
 * 游客转为租户管理员
 */
export async function convertGuestToTenantAdmin(
  userId: string,
  tenantId: string
): Promise<boolean> {
  const {error} = await supabase
    .from('profiles')
    .update({
      role: 'tenant_admin',
      tenant_id: tenantId
    })
    .eq('id', userId)
  
  if (error) {
    console.error('转换用户角色失败:', error)
    return false
  }
  
  return true
}
```

### 4. 创建租户页面

创建新页面：`src/pages/create-tenant/index.tsx`

```typescript
import {Input, Text, View, Button} from '@tarojs/components'
import Taro, {navigateTo, showToast} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useState} from 'react'
import {createTenant, convertGuestToTenantAdmin} from '@/db/api'
import {useTenantStore} from '@/store/tenant'

const CreateTenant: React.FC = () => {
  const {user} = useAuth({guard: true})
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant)
  const setCurrentUser = useTenantStore((state) => state.setCurrentUser)
  
  const [tenantName, setTenantName] = useState('')
  const [industry, setIndustry] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleCreate = async () => {
    if (!tenantName.trim()) {
      showToast({title: '请输入租户名称', icon: 'none'})
      return
    }
    
    setLoading(true)
    
    try {
      // 创建租户
      const tenant = await createTenant({
        name: tenantName,
        industry: industry || '其他',
        admin_phone: user.phone
      })
      
      if (!tenant) {
        throw new Error('创建租户失败')
      }
      
      // 转换用户角色
      const success = await convertGuestToTenantAdmin(user.id, tenant.id)
      
      if (!success) {
        throw new Error('更新用户角色失败')
      }
      
      // 更新租户上下文
      setCurrentTenant(tenant)
      setCurrentUser({
        ...user,
        role: 'tenant_admin',
        tenant_id: tenant.id
      })
      
      showToast({
        title: '创建成功',
        icon: 'success'
      })
      
      // 跳转到首页
      setTimeout(() => {
        Taro.switchTab({url: '/pages/home/index'})
      }, 1500)
    } catch (error) {
      console.error('创建租户失败:', error)
      showToast({
        title: error instanceof Error ? error.message : '创建失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <View className="bg-white rounded-2xl p-6 shadow-sm">
        <Text className="text-xl font-bold text-gray-800 block mb-6">
          创建我的租户
        </Text>
        
        <View className="mb-4">
          <Text className="text-sm text-gray-600 block mb-2">
            租户名称 *
          </Text>
          <Input
            className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            placeholder="请输入租户名称"
            value={tenantName}
            onInput={(e) => setTenantName(e.detail.value)}
          />
        </View>
        
        <View className="mb-6">
          <Text className="text-sm text-gray-600 block mb-2">
            行业类型
          </Text>
          <Input
            className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            placeholder="如：餐饮、零售、服务等"
            value={industry}
            onInput={(e) => setIndustry(e.detail.value)}
          />
        </View>
        
        <Button
          className="w-full bg-blue-600 text-white rounded-xl"
          loading={loading}
          onClick={handleCreate}>
          创建租户
        </Button>
      </View>
    </View>
  )
}

export default CreateTenant
```

## 📊 用户体验流程

### 游客体验流程

```
1. 打开小程序
   ↓
2. 进入登录页面
   ↓
3. 输入手机号 + 验证码
   ↓
4. 登录成功
   ↓
5. 系统检测：无租户 → 游客模式
   ↓
6. 自动关联演示租户
   ↓
7. 进入首页
   ↓
8. 看到游客欢迎卡片
   ├─ "创建我的租户"
   └─ "加入现有租户"
   ↓
9. 体验系统功能（只读）
   ├─ 查看今日运营数据
   ├─ 查看排班日志
   ├─ 查看员工管理
   ├─ 查看店铺管理
   └─ 查看数据分析
   ↓
10. 尝试修改数据
    ↓
11. 弹出提示："游客模式，只能查看"
    ├─ 继续体验
    └─ 创建租户
    ↓
12. 点击"创建我的租户"
    ↓
13. 填写租户信息
    ↓
14. 创建成功
    ↓
15. 角色变更：guest → tenant_admin
    ↓
16. 进入自己的租户
    ↓
17. 可以使用所有功能
```

### 转化路径

#### 路径1：创建租户
```
游客 → 点击"创建我的租户" → 填写信息 → 创建成功 → 租户管理员
```

#### 路径2：加入租户
```
游客 → 点击"加入现有租户" → 输入邀请码 → 验证成功 → 员工/店经理
```

## 🎨 UI 设计

### 游客欢迎卡片

```
┌─────────────────────────────────────┐
│  👤  欢迎体验系统                    │
│      您正在使用演示租户，可以查看所有功能 │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ 🏪       │  │ 👥       │        │
│  │ 创建我的  │  │ 加入现有  │        │
│  │ 租户     │  │ 租户     │        │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

### 游客模式提示

```
┌─────────────────────────────────────┐
│  游客模式                            │
│                                     │
│  您当前处于游客模式，只能查看数据。    │
│                                     │
│  要使用完整功能，请创建您的租户或      │
│  加入现有租户。                       │
│                                     │
│  [继续体验]  [创建租户]              │
└─────────────────────────────────────┘
```

## 🔒 权限控制

### 游客权限

| 功能模块 | 查看 | 创建 | 修改 | 删除 |
|---------|------|------|------|------|
| 今日运营 | ✅ | ❌ | ❌ | ❌ |
| 排班日志 | ✅ | ❌ | ❌ | ❌ |
| 员工管理 | ✅ | ❌ | ❌ | ❌ |
| 店铺管理 | ✅ | ❌ | ❌ | ❌ |
| 排班管理 | ✅ | ❌ | ❌ | ❌ |
| 数据分析 | ✅ | ❌ | ❌ | ❌ |
| 系统设置 | ❌ | ❌ | ❌ | ❌ |

### 权限检查点

1. **页面级别**：进入页面时检查权限
2. **操作级别**：点击按钮时检查权限
3. **API级别**：调用API时检查权限
4. **数据库级别**：RLS策略控制

## 📈 数据管理

### 演示数据重置

每天凌晨自动重置演示租户的数据：

```sql
-- 创建定时任务（使用 pg_cron）
SELECT cron.schedule(
  'reset-demo-data',
  '0 0 * * *',  -- 每天凌晨0点
  $$
  -- 删除演示租户的排班记录
  DELETE FROM schedule_logs WHERE tenant_id = 'demo-tenant-uuid';
  
  -- 重置演示数据
  -- ... 其他重置操作
  $$
);
```

### 数据隔离

1. **物理隔离**：演示租户有独立的 tenant_id
2. **逻辑隔离**：通过 is_demo 字段标记
3. **访问隔离**：RLS 策略控制访问权限

## 🚀 实施步骤

### 第一阶段：数据库准备
1. ✅ 添加 guest 角色到 user_role 枚举
2. ✅ 添加 is_demo 字段到 tenants 表
3. ✅ 创建演示租户
4. ✅ 创建演示数据（门店、员工、排班等）
5. ✅ 配置 RLS 策略

### 第二阶段：后端开发
1. ✅ 添加游客相关 API
2. ✅ 修改登录逻辑
3. ✅ 添加权限检查函数
4. ✅ 添加角色转换函数

### 第三阶段：前端开发
1. ✅ 修改登录页面
2. ✅ 修改首页，添加游客欢迎卡片
3. ✅ 创建"创建租户"页面
4. ✅ 创建"加入租户"页面
5. ✅ 添加权限检查到所有修改操作
6. ✅ 添加游客模式提示

### 第四阶段：测试
1. ✅ 游客登录测试
2. ✅ 游客体验测试
3. ✅ 权限控制测试
4. ✅ 转化流程测试
5. ✅ 数据隔离测试

### 第五阶段：上线
1. ✅ 部署数据库迁移
2. ✅ 部署前端代码
3. ✅ 监控游客转化率
4. ✅ 收集用户反馈
5. ✅ 持续优化

## 📊 效果评估

### 关键指标

1. **游客转化率**：游客 → 正式用户的转化率
2. **体验时长**：游客在系统中的停留时间
3. **功能使用率**：游客使用各功能的比例
4. **转化路径**：创建租户 vs 加入租户的比例

### 目标

- 游客转化率：≥ 30%
- 平均体验时长：≥ 5分钟
- 功能使用率：≥ 60%

## 🎯 总结

### 优势

1. ✅ **降低门槛**：无需邀请码，手机号即可体验
2. ✅ **功能完整**：可以体验所有核心功能
3. ✅ **数据安全**：演示数据与正式数据完全隔离
4. ✅ **转化清晰**：提供明确的转化路径
5. ✅ **权限可控**：游客只能查看，不能修改

### 注意事项

1. ⚠️ **性能优化**：演示租户可能被大量游客访问
2. ⚠️ **数据重置**：定期重置演示数据
3. ⚠️ **权限控制**：严格控制游客权限
4. ⚠️ **转化引导**：在关键位置提示转化
5. ⚠️ **用户体验**：确保游客体验流畅

---

**文档版本**：v1.0.0  
**创建日期**：2025-11-11  
**作者**：秒哒AI助手  
**状态**：设计方案，待实施
