# 品牌配置和权限管理功能修复

## 🐛 问题描述

### 问题1：品牌配置功能无法使用
**现象**：
- 无法进行餐段配置
- 无法进行班次配置
- 点击"添加餐段"或"添加班次"按钮后，表单弹窗可能不显示或被遮挡

### 问题2：权限管理无法进行模块配置
**现象**：
- 权限管理页面无法显示功能模块
- 无法配置员工权限
- 无法配置岗位模板

---

## 🔍 问题分析

### 品牌配置问题根因

1. **表单弹窗层级问题**
   - 原代码使用了`z-50`的z-index
   - 可能被其他元素遮挡
   - Tailwind的`bg-opacity-50`在某些情况下不生效

2. **表单弹窗样式问题**
   ```tsx
   // 问题代码
   <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
   ```

### 权限管理问题根因

1. **功能模块表缺失**
   - 数据库中没有`function_modules`表
   - 导致无法加载功能模块数据
   - 权限配置功能无法使用

2. **相关表缺失**
   - `employee_permissions`表缺失
   - `position_templates`表缺失

---

## ✅ 解决方案

### 修复1：品牌配置表单弹窗样式

#### 修改内容

**文件**：`src/pages/brand-config/index.tsx`

**餐段表单弹窗**：
```tsx
// 修复前
<View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

// 修复后
<View className="fixed inset-0 flex items-center justify-center" style={{zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)'}}>
```

**班次表单弹窗**：
```tsx
// 修复前
<View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

// 修复后
<View className="fixed inset-0 flex items-center justify-center" style={{zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)'}}>
```

#### 修复要点

1. **提高z-index层级**
   - 从`z-50`提升到`9999`
   - 确保弹窗在最上层显示

2. **使用内联样式**
   - 使用`style`属性设置`zIndex`
   - 使用`rgba`设置半透明背景
   - 避免Tailwind类名的兼容性问题

3. **保持居中布局**
   - 保留`flex items-center justify-center`
   - 确保弹窗内容居中显示

### 修复2：创建功能模块表和权限系统

#### 数据库迁移文件

**文件**：`supabase/migrations/32_create_function_modules.sql`

#### 创建的表结构

1. **function_modules - 功能模块表**
   ```sql
   CREATE TABLE function_modules (
     id uuid PRIMARY KEY,
     module_key text UNIQUE NOT NULL,
     module_name text NOT NULL,
     parent_id uuid REFERENCES function_modules(id),
     sort_order integer DEFAULT 0,
     description text,
     created_at timestamptz DEFAULT now()
   );
   ```

2. **employee_permissions - 员工权限表**
   ```sql
   CREATE TABLE employee_permissions (
     id uuid PRIMARY KEY,
     employee_id uuid REFERENCES employees(id),
     module_id uuid REFERENCES function_modules(id),
     can_view boolean DEFAULT false,
     can_edit boolean DEFAULT false,
     can_delete boolean DEFAULT false,
     created_at timestamptz DEFAULT now()
   );
   ```

3. **position_templates - 岗位权限模板表**
   ```sql
   CREATE TABLE position_templates (
     id uuid PRIMARY KEY,
     tenant_id uuid REFERENCES tenants(id),
     position_name text NOT NULL,
     module_id uuid REFERENCES function_modules(id),
     can_view boolean DEFAULT false,
     can_edit boolean DEFAULT false,
     can_delete boolean DEFAULT false,
     created_at timestamptz DEFAULT now()
   );
   ```

#### 功能模块初始数据

系统预置了以下功能模块：

**一级模块**：
1. 首页 - 系统首页和今日运营仪表盘
2. 管理中心 - 员工、门店、租户等基础管理
3. 排班管理 - 排班规划、执行和优化
4. 成本管控 - 人力成本分析和控制
5. 数据分析 - 营收分析和数据报表
6. 排班日志 - 排班执行记录和排行榜
7. 系统设置 - 品牌配置、效能标准等设置

**二级模块**（部分示例）：
- 管理中心
  - 员工管理
  - 兼职管理
  - 门店管理
  - 岗位管理
  - 业务区域
  - 租户管理

- 排班管理
  - 排班规划
  - 月度排班
  - 排班优化
  - 请假管理

- 系统设置
  - 品牌配置
  - 效能标准
  - 最低营收
  - 影响因子
  - 休息日规则
  - 权限管理

#### 安全策略

1. **功能模块表**
   - 所有认证用户可读
   - 支持树形结构查询

2. **员工权限表**
   - 管理员可管理所有权限
   - 员工只能查看自己的权限

3. **岗位权限模板表**
   - 管理员可管理所有模板
   - 员工可查看本租户的模板

---

## 🚀 部署步骤

### 步骤1：应用数据库迁移

```bash
# 使用Supabase CLI应用迁移
supabase db push

# 或者手动执行SQL
# 1. 登录Supabase Dashboard
# 2. 进入SQL Editor
# 3. 复制并执行 supabase/migrations/32_create_function_modules.sql
```

### 步骤2：验证数据库

```sql
-- 检查功能模块表
SELECT COUNT(*) FROM function_modules;
-- 应该返回约30条记录

-- 检查一级模块
SELECT module_key, module_name, sort_order 
FROM function_modules 
WHERE parent_id IS NULL 
ORDER BY sort_order;

-- 检查二级模块
SELECT m.module_name as parent, c.module_name as child
FROM function_modules c
JOIN function_modules m ON c.parent_id = m.id
ORDER BY m.sort_order, c.sort_order;
```

### 步骤3：重新编译前端

```bash
# 清理缓存
rm -rf dist

# 重新编译
pnpm run dev:weapp
```

### 步骤4：测试功能

#### 测试品牌配置

1. **测试餐段配置**
   - 进入"品牌配置"页面
   - 点击"添加餐段"按钮
   - 验证表单弹窗正确显示
   - 填写餐段信息并保存
   - 验证餐段列表正确显示

2. **测试班次配置**
   - 切换到"班次配置"标签
   - 点击"添加班次"按钮
   - 验证表单弹窗正确显示
   - 填写班次信息并保存
   - 验证班次列表正确显示

#### 测试权限管理

1. **测试员工权限配置**
   - 进入"权限管理"页面
   - 选择"员工权限"标签
   - 选择一个员工
   - 验证功能模块树正确显示
   - 配置权限并保存
   - 验证权限保存成功

2. **测试岗位模板配置**
   - 切换到"岗位模板"标签
   - 选择一个岗位
   - 验证功能模块树正确显示
   - 配置权限并保存
   - 验证模板保存成功

---

## 🧪 测试验证

### 品牌配置测试用例

| 测试项 | 操作步骤 | 预期结果 |
|--------|---------|---------|
| 添加餐段 | 点击"添加餐段" | 弹窗正确显示，不被遮挡 |
| 编辑餐段 | 点击餐段的"编辑"按钮 | 弹窗显示，表单填充现有数据 |
| 删除餐段 | 点击餐段的"删除"按钮 | 显示确认对话框，删除成功 |
| 添加班次 | 点击"添加班次" | 弹窗正确显示，不被遮挡 |
| 编辑班次 | 点击班次的"编辑"按钮 | 弹窗显示，表单填充现有数据 |
| 删除班次 | 点击班次的"删除"按钮 | 显示确认对话框，删除成功 |

### 权限管理测试用例

| 测试项 | 操作步骤 | 预期结果 |
|--------|---------|---------|
| 加载功能模块 | 进入权限管理页面 | 功能模块树正确显示 |
| 选择员工 | 点击员工按钮 | 加载员工权限，显示权限配置 |
| 配置查看权限 | 勾选"查看"复选框 | 权限状态更新 |
| 配置编辑权限 | 勾选"编辑"复选框 | 需要先勾选"查看" |
| 配置删除权限 | 勾选"删除"复选框 | 需要先勾选"查看" |
| 保存员工权限 | 点击"保存权限"按钮 | 权限保存成功 |
| 选择岗位 | 点击岗位按钮 | 加载岗位模板，显示权限配置 |
| 保存岗位模板 | 点击"保存模板"按钮 | 模板保存成功 |
| 应用岗位模板 | 点击"快速应用岗位模板" | 员工权限更新为模板权限 |

---

## 📋 影响范围

### 修改的文件

1. **前端代码**
   - `src/pages/brand-config/index.tsx` - 修复表单弹窗样式

2. **数据库迁移**
   - `supabase/migrations/32_create_function_modules.sql` - 新增

### 新增的数据库表

1. `function_modules` - 功能模块表
2. `employee_permissions` - 员工权限表
3. `position_templates` - 岗位权限模板表

### 受影响的功能

✅ **品牌配置**
- 餐段配置
- 班次配置

✅ **权限管理**
- 员工权限配置
- 岗位模板配置
- 权限应用

---

## 🔧 技术细节

### 为什么使用内联样式

1. **z-index优先级**
   - Tailwind的`z-50`可能不够高
   - 内联样式的`zIndex: 9999`确保最高优先级

2. **背景透明度**
   - Tailwind的`bg-opacity-50`在某些环境下不生效
   - `rgba(0,0,0,0.5)`更可靠

3. **跨平台兼容性**
   - 内联样式在小程序和H5环境下都能正常工作
   - 避免Tailwind类名的编译问题

### 功能模块树形结构

```typescript
interface FunctionModuleTree {
  id: string
  module_key: string
  module_name: string
  parent_id: string | null
  sort_order: number
  description: string
  children?: FunctionModuleTree[]
}
```

**特点**：
- 支持无限层级
- 通过`parent_id`建立父子关系
- 通过`sort_order`控制显示顺序
- 递归渲染子模块

### 权限控制逻辑

```typescript
// 权限依赖关系
can_edit → 依赖 can_view
can_delete → 依赖 can_view

// 权限检查
if (!can_view) {
  can_edit = false
  can_delete = false
}
```

---

## 📝 后续优化建议

### 短期优化

1. **品牌配置**
   - 添加表单验证增强
   - 支持批量导入餐段和班次
   - 添加配置模板功能

2. **权限管理**
   - 添加权限预览功能
   - 支持批量配置权限
   - 添加权限变更日志

### 长期优化

1. **权限系统增强**
   - 支持更细粒度的权限控制
   - 添加数据权限（行级权限）
   - 支持权限继承和覆盖

2. **用户体验优化**
   - 添加权限配置向导
   - 提供权限配置建议
   - 添加权限冲突检测

3. **性能优化**
   - 权限数据缓存
   - 懒加载功能模块树
   - 优化权限查询性能

---

## 🐛 已知问题

### 无已知问题

当前修复已经解决了品牌配置和权限管理的主要问题。

### 如果仍然有问题

#### 品牌配置问题排查

1. **表单弹窗不显示**
   ```bash
   # 检查控制台是否有错误
   # 检查showMealForm或showShiftForm状态
   # 验证onClick事件是否触发
   ```

2. **表单弹窗被遮挡**
   ```bash
   # 检查其他元素的z-index
   # 验证fixed定位是否正确
   # 检查父元素的overflow属性
   ```

#### 权限管理问题排查

1. **功能模块不显示**
   ```sql
   -- 检查数据库
   SELECT COUNT(*) FROM function_modules;
   
   -- 检查RLS策略
   SELECT * FROM function_modules LIMIT 1;
   ```

2. **权限保存失败**
   ```bash
   # 检查控制台错误
   # 验证数据库连接
   # 检查RLS策略
   ```

---

## 📞 问题反馈

如果修复后仍然有问题，请提供：

1. **品牌配置问题**
   - 操作步骤截图
   - 浏览器控制台日志
   - 点击按钮后的反应

2. **权限管理问题**
   - 页面显示截图
   - 控制台错误信息
   - 数据库查询结果

3. **环境信息**
   - 微信小程序版本
   - 开发者工具版本
   - Supabase项目信息

---

## 📚 相关文档

- **登录输入框修复**：`LOGIN_INPUT_FIX.md`
- **微信登录配置**：`WECHAT_CONFIG_GUIDE.md`
- **微信登录问题**：`WECHAT_LOGIN_ISSUES.md`

---

**修复时间**：2025-11-06
**修复文件**：
- `src/pages/brand-config/index.tsx`
- `supabase/migrations/32_create_function_modules.sql`
**状态**：✅ 已修复
**测试状态**：⏳ 待测试
