# 功能修复和完善任务清单

## 最新任务（2025-01-06 最终更新 v4）

### ✅ 已完成任务
1. **删除岗位配置模块** - 从管理中心移除岗位配置入口
2. **优化营业区配置** - 完全重写UI，白底黑字，按钮颜色清晰
3. **新增岗位人数字段** - 在营业区配置中添加岗位人数字段
4. **优化创建租户页面** - 删除品牌名称字段，简化申请流程
5. **优化首页品牌选择** - 品牌选择器始终显示，支持多品牌管理
6. **优化排休规则配置** - 完全重写UI，白底黑字，按钮颜色清晰
7. **优化员工管理岗位标记** - 增强岗位标记功能的视觉设计
8. **删除首页租户选择功能** - 简化首页，只保留品牌和门店选择
9. **修复店铺管理品牌选择闪跳** - 优化品牌选择器逻辑，解决闪跳问题
10. **修复排休规则保存失败** - 补充必需字段，确保保存成功
11. **优化首页门店选择器显示** - 增强视觉效果，确保门店选择器清晰可见

### 全部任务已完成 ✅

## 完成的改进详情

### 1. 删除岗位配置模块
- ✅ 从管理中心移除岗位配置入口
- ✅ 岗位功能已在员工管理中实现

### 2. 营业区配置优化
**UI设计改进：**
- ✅ 白色背景使用黑色文字（text-gray-900）
- ✅ 按钮颜色清晰可辨：
  - 编辑按钮：蓝色背景（bg-blue-50）+ 蓝色文字（text-blue-600）
  - 删除按钮：红色背景（bg-red-50）+ 红色文字（text-red-600）
  - 主按钮：蓝色背景（bg-blue-600）+ 白色文字
- ✅ 现代化卡片设计，圆角阴影
- ✅ 按类型分组显示（营业区/制作区）
- ✅ 图标和颜色区分不同类型

**新增功能：**
- ✅ 添加岗位人数字段（position_count）
- ✅ 数据库迁移已完成
- ✅ 类型定义已更新
- ✅ UI表单已添加岗位人数输入
- ✅ 列表显示岗位人数信息

### 3. 创建租户页面优化
**简化申请流程：**
- ✅ 删除品牌名称输入字段
- ✅ 只需填写租户名称
- ✅ 品牌名称自动使用租户名称
- ✅ 添加提示：租户创建后可在管理中心添加多个品牌
- ✅ 优化输入框样式，文字颜色清晰（text-gray-900）

**设计理念：**
- 简化申请流程，降低用户门槛
- 支持一个租户下管理多个品牌
- 品牌管理在管理中心统一配置

### 4. 首页品牌选择优化
**品牌选择器改进：**
- ✅ 品牌选择器始终显示（即使只有一个品牌）
- ✅ 多品牌时显示下拉选择器
- ✅ 单品牌时显示品牌名称（不可选择）
- ✅ 品牌切换后自动过滤门店列表
- ✅ 只显示当前品牌下的门店
- ✅ 自动选择第一个品牌和门店
- ✅ 品牌切换时发送事件通知

**多品牌管理支持：**
- ✅ 支持一个租户下管理多个品牌
- ✅ 品牌和门店的层级关系清晰
- ✅ 品牌切换流畅，用户体验良好

### 5. 排休规则配置优化
**UI设计全面改进：**
- ✅ 完全重写页面，使用现代化设计
- ✅ 白色背景统一使用深黑色文字（text-gray-900）
- ✅ 按钮颜色明确区分：
  - 编辑按钮：蓝色背景（bg-blue-50）+ 蓝色文字（text-blue-600）
  - 删除按钮：红色背景（bg-red-50）+ 红色文字（text-red-600）
  - 保存按钮：蓝色背景（bg-blue-600）+ 白色文字
  - 确定按钮：绿色背景（bg-green-600）+ 白色文字
- ✅ 采用现代化卡片设计，圆角阴影效果
- ✅ 规则详情使用彩色背景区分（蓝色、灰色、绿色）
- ✅ 顶岗配置使用绿色主题，视觉清晰

**功能完整性：**
- ✅ 基础规则配置（月休天数、指定日期、存休、连休）
- ✅ 顶岗检查配置（核心岗位、顶岗人员）
- ✅ 顶岗人员选择对话框（多选、复选框）
- ✅ 规则描述和说明

### 6. 员工管理岗位标记优化
**岗位标记功能增强：**
- ✅ 核心岗位标记：
  - 橙色主题（bg-orange-50 + border-orange-200）
  - 星形图标（i-mdi-star-circle）
  - 深黑色标题（text-gray-900）
  - 清晰的说明文字
- ✅ 需固定顶岗标记：
  - 紫色主题（bg-purple-50 + border-purple-200）
  - 切换图标（i-mdi-account-switch）
  - 深黑色标题（text-gray-900）
  - 清晰的说明文字
- ✅ 可顶岗岗位选择：
  - 绿色主题（选中时bg-green-50 + border-green-500）
  - 多选复选框（圆形，带勾选图标）
  - 核心岗位标签（橙色）
  - 已选择数量提示

**输入框优化：**
- ✅ 所有输入框文字颜色统一为text-gray-900
- ✅ 标签文字使用font-medium和text-gray-900
- ✅ Picker选择器文字颜色为text-gray-900
- ✅ 确保白底黑字，清晰易读

### 7. 首页租户选择功能删除
**简化首页布局：**
- ✅ 删除租户信息卡片
- ✅ 删除租户切换按钮
- ✅ 删除租户选择入口
- ✅ 保留品牌选择器
- ✅ 保留门店选择器
- ✅ 门店选择基于当前选中的品牌

**用户体验优化：**
- 首页更简洁，聚焦核心功能
- 品牌和门店选择流程更清晰
- 减少不必要的操作步骤
- 提升操作效率

### 8. 修复店铺管理品牌选择闪跳问题
**问题原因：**
- `loadBrands`函数的依赖项包含`formData.brand_id`
- 每次brand_id变化时都重新加载品牌列表
- 导致Picker组件不断重新渲染，出现闪跳

**修复方案：**
- ✅ 移除`formData.brand_id`依赖，只依赖`currentTenant.id`
- ✅ 优化品牌索引同步逻辑
- ✅ 添加独立的useEffect同步品牌索引
- ✅ 确保编辑模式下正确显示当前品牌

**技术实现：**
```typescript
// 修复前：依赖formData.brand_id导致循环渲染
const loadBrands = useCallback(async () => {
  // ...
}, [currentTenant?.id, formData.brand_id]) // ❌ 错误

// 修复后：只依赖currentTenant.id
const loadBrands = useCallback(async () => {
  // ...
}, [currentTenant?.id]) // ✅ 正确

// 添加独立的索引同步
useEffect(() => {
  if (formData.brand_id && brands.length > 0) {
    const index = brands.findIndex((b) => b.id === formData.brand_id)
    if (index >= 0 && index !== selectedBrandIndex) {
      setSelectedBrandIndex(index)
    }
  }
}, [formData.brand_id, brands, selectedBrandIndex])
```

### 9. 修复排休规则保存失败问题
**问题原因：**
- 保存时缺少必需字段：`blocked_dates`、`is_active`、`applicable_employees`、`priority`
- 数据库表要求这些字段必须提供
- 错误地将`no_same_day_off`作为顶层字段传递，实际应该在`BackupRule`对象中
- 创建`BackupRule`对象时缺少`core_position`和`no_same_day_off`字段

**修复方案：**
- ✅ 补充`blocked_dates: []`（初始化为空数组）
- ✅ 补充`is_active: true`（新规则默认激活）
- ✅ 补充`applicable_employees: []`（空数组表示适用于所有员工）
- ✅ 补充`priority: 0`（默认优先级）
- ✅ 移除顶层的`no_same_day_off`字段
- ✅ 在创建`BackupRule`时添加`core_position`字段
- ✅ 在创建`BackupRule`时添加`no_same_day_off`字段
- ✅ 在编辑顶岗规则时正确加载`no_same_day_off`的值
- ✅ 优化错误提示信息

**技术实现：**
```typescript
// 修复后的保存逻辑
const ruleData: Omit<RestDayRule, 'id' | 'created_at' | 'updated_at'> = {
  tenant_id: currentTenant.id,
  store_id: currentStore.id,
  rule_name: ruleName.trim(),
  monthly_rest_days: monthlyDays,
  blocked_dates: [], // ✅ 新增
  max_specific_date_requests: Number(maxSpecificDateRequests),
  allow_rest_accumulation: allowRestAccumulation,
  max_accumulated_days: Number(maxAccumulatedDays),
  allow_consecutive_rest: allowConsecutiveRest,
  max_consecutive_days: Number(maxConsecutiveDays),
  is_active: true, // ✅ 新增
  applicable_employees: [], // ✅ 新增
  priority: 0, // ✅ 新增
  enable_backup_check: enableBackupCheck,
  backup_rules: backupRules, // ✅ 顶岗规则数组，每个规则内部包含no_same_day_off字段
  description: description.trim() || undefined
  // ✅ 移除了错误的 no_same_day_off 顶层字段
}

// 修复后的顶岗规则创建逻辑
newBackupRules.push({
  core_employee_id: currentCoreEmployee.id,
  core_position: currentCoreEmployee.position || '未知岗位', // ✅ 新增
  backup_employee_ids: selectedBackupIds,
  no_same_day_off: noSameDayOff // ✅ 新增，正确位置
})

// 修复后的编辑加载逻辑
const existingRule = backupRules.find((r) => r.core_employee_id === employee.id)
setSelectedBackupIds(existingRule?.backup_employee_ids || [])
setNoSameDayOff(existingRule?.no_same_day_off ?? true) // ✅ 新增
```

### 10. 首页门店选择功能确认
**功能状态：**
- ✅ 门店选择器已存在并正常工作
- ✅ 位于品牌选择器下方
- ✅ 根据选中的品牌自动过滤门店列表
- ✅ 支持下拉选择切换门店
- ✅ 门店切换后自动刷新运营数据

**UI设计：**
- 渐变背景（from-blue-50 to-indigo-50）
- 门店图标（i-mdi-store）
- 下拉选择器（Picker组件）
- 当前门店名称显示
- 下拉箭头图标

**功能流程：**
1. 用户选择品牌
2. 系统自动过滤该品牌下的门店
3. 用户从门店列表中选择门店
4. 系统加载该门店的运营数据
5. 显示今日运营仪表盘

## 之前完成的任务

### ✅ 任务1：完善岗位配置页面（已完成，后删除）
- [x] 检查现有实现
- [x] 优化UI设计 - 使用现代化卡片布局
- [x] 改进交互流程 - 优化对话框设计
- [x] 添加层级图标和颜色区分
- [x] 优化层级选择体验 - 使用图标按钮
- [x] **已删除** - 功能已在员工管理中实现

### ✅ 任务5：店铺管理品牌选择（已完成）
- [x] 检查店铺表单页面
- [x] 检查stores表brand_id字段（已存在）
- [x] 更新Store类型定义，添加brand_id字段
- [x] 添加品牌选择下拉框
- [x] 加载租户下的品牌列表
- [x] 保存时关联品牌ID
- [x] 编辑时显示当前品牌
- [x] 在店铺列表页显示品牌信息

## 当前状态
✅ **所有任务已完成！**

## 首页选择流程（优化后）

### 简化后的选择流程
1. 用户登录后自动进入当前租户
2. 首页显示品牌选择器
3. 选择品牌后，显示该品牌下的门店列表
4. 选择门店后，显示该门店的运营数据

### 与之前的区别
**之前的流程：**
- 租户选择 → 品牌选择 → 门店选择 → 运营数据

**优化后的流程：**
- 品牌选择 → 门店选择 → 运营数据

**优势：**
- 减少一个选择步骤
- 界面更简洁
- 操作更高效
- 聚焦核心功能

## 技术实现

### 营业区配置数据库变更
```sql
-- 添加岗位人数字段
ALTER TABLE business_area_config 
ADD COLUMN IF NOT EXISTS position_count integer DEFAULT 1 CHECK (position_count >= 0);
```

### 类型定义更新
```typescript
interface BusinessAreaConfig {
  // ... 其他字段
  position_count: number  // 新增：岗位人数
}
```

### 创建租户逻辑变更
```typescript
// 品牌名称自动使用租户名称
const result = await createTenantApplication({
  // ...
  tenant_name: tenantName,
  brand_name: tenantName, // 自动使用租户名称
  // ...
})
```

### 首页UI变更
```typescript
// 删除租户信息卡片和切换按钮
// 保留品牌选择器和门店选择器
{/* 品牌选择器 - 始终显示 */}
{brands.length > 0 && (
  <View className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 mb-3 shadow-sm">
    {/* 品牌选择UI */}
  </View>
)}

{/* 门店选择器 - 基于当前品牌 */}
{filteredStores.length > 0 && (
  <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 mb-3 shadow-sm">
    {/* 门店选择UI */}
  </View>
)}
```

### UI设计规范（统一标准）
**颜色规范：**
- **白色背景文字**：text-gray-900（深黑色）
- **标签文字**：font-medium + text-gray-900
- **编辑按钮**：bg-blue-50 + text-blue-600
- **删除按钮**：bg-red-50 + text-red-600
- **主要按钮**：bg-blue-600 + text-white
- **次要按钮**：bg-gray-100 + text-gray-700
- **成功按钮**：bg-green-600 + text-white

**岗位标记颜色：**
- **核心岗位**：橙色主题（bg-orange-50 + border-orange-200 + text-orange-600）
- **需固定顶岗**：紫色主题（bg-purple-50 + border-purple-200 + text-purple-600）
- **可顶岗岗位**：绿色主题（bg-green-50 + border-green-500 + text-green-600）

**规则详情颜色：**
- **主要信息**：蓝色背景（bg-blue-50）
- **次要信息**：灰色背景（bg-gray-50）
- **特殊功能**：绿色背景（bg-green-50）

## 多品牌管理架构

### 数据层级关系
```
租户（Tenant）- 用户登录后自动关联
  └── 品牌1（Brand）
       └── 门店1-1（Store）
       └── 门店1-2（Store）
  └── 品牌2（Brand）
       └── 门店2-1（Store）
       └── 门店2-2（Store）
```

### 品牌管理流程
1. 租户创建时自动创建默认品牌（使用租户名称）
2. 租户管理员可在管理中心添加更多品牌
3. 每个品牌可以有多个门店
4. 门店必须关联到某个品牌

## 岗位管理功能说明

### 员工岗位标记
1. **核心岗位**：标记关键岗位员工（如店长、厨师长）
2. **需固定顶岗**：标记需要其他人员顶岗的岗位
3. **可顶岗岗位**：选择该员工可以顶岗的其他岗位（多选）

### 排休规则中的顶岗配置
1. **启用顶岗检查**：开启后可配置核心岗位的顶岗规则
2. **不可同时休息**：核心岗位与顶岗人员不可同时休息
3. **顶岗人员配置**：为每个核心岗位员工配置顶岗人员列表

### 功能联动
- 员工标记为核心岗位后，在排休规则配置中可见
- 排休规则中配置的顶岗关系，在排班时自动检查
- 确保核心岗位始终有人值班

## 完成的改进详情

### 1. 删除岗位配置模块
- ✅ 从管理中心移除岗位配置入口
- ✅ 岗位功能已在员工管理中实现

### 2. 营业区配置优化
**UI设计改进：**
- ✅ 白色背景使用黑色文字（text-gray-900）
- ✅ 按钮颜色清晰可辨：
  - 编辑按钮：蓝色背景（bg-blue-50）+ 蓝色文字（text-blue-600）
  - 删除按钮：红色背景（bg-red-50）+ 红色文字（text-red-600）
  - 主按钮：蓝色背景（bg-blue-600）+ 白色文字
- ✅ 现代化卡片设计，圆角阴影
- ✅ 按类型分组显示（营业区/制作区）
- ✅ 图标和颜色区分不同类型

**新增功能：**
- ✅ 添加岗位人数字段（position_count）
- ✅ 数据库迁移已完成
- ✅ 类型定义已更新
- ✅ UI表单已添加岗位人数输入
- ✅ 列表显示岗位人数信息

### 3. 创建租户页面优化
**简化申请流程：**
- ✅ 删除品牌名称输入字段
- ✅ 只需填写租户名称
- ✅ 品牌名称自动使用租户名称
- ✅ 添加提示：租户创建后可在管理中心添加多个品牌
- ✅ 优化输入框样式，文字颜色清晰（text-gray-900）

**设计理念：**
- 简化申请流程，降低用户门槛
- 支持一个租户下管理多个品牌
- 品牌管理在管理中心统一配置

### 4. 首页品牌选择优化
**品牌选择器改进：**
- ✅ 品牌选择器始终显示（即使只有一个品牌）
- ✅ 多品牌时显示下拉选择器
- ✅ 单品牌时显示品牌名称（不可选择）
- ✅ 品牌切换后自动过滤门店列表
- ✅ 只显示当前品牌下的门店
- ✅ 自动选择第一个品牌和门店
- ✅ 品牌切换时发送事件通知

**多品牌管理支持：**
- ✅ 支持一个租户下管理多个品牌
- ✅ 品牌和门店的层级关系清晰
- ✅ 品牌切换流畅，用户体验良好

### 5. 排休规则配置优化
**UI设计全面改进：**
- ✅ 完全重写页面，使用现代化设计
- ✅ 白色背景统一使用深黑色文字（text-gray-900）
- ✅ 按钮颜色明确区分：
  - 编辑按钮：蓝色背景（bg-blue-50）+ 蓝色文字（text-blue-600）
  - 删除按钮：红色背景（bg-red-50）+ 红色文字（text-red-600）
  - 保存按钮：蓝色背景（bg-blue-600）+ 白色文字
  - 确定按钮：绿色背景（bg-green-600）+ 白色文字
- ✅ 采用现代化卡片设计，圆角阴影效果
- ✅ 规则详情使用彩色背景区分（蓝色、灰色、绿色）
- ✅ 顶岗配置使用绿色主题，视觉清晰

**功能完整性：**
- ✅ 基础规则配置（月休天数、指定日期、存休、连休）
- ✅ 顶岗检查配置（核心岗位、顶岗人员）
- ✅ 顶岗人员选择对话框（多选、复选框）
- ✅ 规则描述和说明

### 6. 员工管理岗位标记优化
**岗位标记功能增强：**
- ✅ 核心岗位标记：
  - 橙色主题（bg-orange-50 + border-orange-200）
  - 星形图标（i-mdi-star-circle）
  - 深黑色标题（text-gray-900）
  - 清晰的说明文字
- ✅ 需固定顶岗标记：
  - 紫色主题（bg-purple-50 + border-purple-200）
  - 切换图标（i-mdi-account-switch）
  - 深黑色标题（text-gray-900）
  - 清晰的说明文字
- ✅ 可顶岗岗位选择：
  - 绿色主题（选中时bg-green-50 + border-green-500）
  - 多选复选框（圆形，带勾选图标）
  - 核心岗位标签（橙色）
  - 已选择数量提示

**输入框优化：**
- ✅ 所有输入框文字颜色统一为text-gray-900
- ✅ 标签文字使用font-medium和text-gray-900
- ✅ Picker选择器文字颜色为text-gray-900
- ✅ 确保白底黑字，清晰易读

## 之前完成的任务

### ✅ 任务1：完善岗位配置页面（已完成，后删除）
- [x] 检查现有实现
- [x] 优化UI设计 - 使用现代化卡片布局
- [x] 改进交互流程 - 优化对话框设计
- [x] 添加层级图标和颜色区分
- [x] 优化层级选择体验 - 使用图标按钮
- [x] **已删除** - 功能已在员工管理中实现

### ✅ 任务5：店铺管理品牌选择（已完成）
- [x] 检查店铺表单页面
- [x] 检查stores表brand_id字段（已存在）
- [x] 更新Store类型定义，添加brand_id字段
- [x] 添加品牌选择下拉框
- [x] 加载租户下的品牌列表
- [x] 保存时关联品牌ID
- [x] 编辑时显示当前品牌
- [x] 在店铺列表页显示品牌信息

## 当前状态
✅ **所有任务已完成！**

## 技术实现

### 营业区配置数据库变更
```sql
-- 添加岗位人数字段
ALTER TABLE business_area_config 
ADD COLUMN IF NOT EXISTS position_count integer DEFAULT 1 CHECK (position_count >= 0);
```

### 类型定义更新
```typescript
interface BusinessAreaConfig {
  // ... 其他字段
  position_count: number  // 新增：岗位人数
}
```

### 创建租户逻辑变更
```typescript
// 品牌名称自动使用租户名称
const result = await createTenantApplication({
  // ...
  tenant_name: tenantName,
  brand_name: tenantName, // 自动使用租户名称
  // ...
})
```

### UI设计规范（统一标准）
**颜色规范：**
- **白色背景文字**：text-gray-900（深黑色）
- **标签文字**：font-medium + text-gray-900
- **编辑按钮**：bg-blue-50 + text-blue-600
- **删除按钮**：bg-red-50 + text-red-600
- **主要按钮**：bg-blue-600 + text-white
- **次要按钮**：bg-gray-100 + text-gray-700
- **成功按钮**：bg-green-600 + text-white

**岗位标记颜色：**
- **核心岗位**：橙色主题（bg-orange-50 + border-orange-200 + text-orange-600）
- **需固定顶岗**：紫色主题（bg-purple-50 + border-purple-200 + text-purple-600）
- **可顶岗岗位**：绿色主题（bg-green-50 + border-green-500 + text-green-600）

**规则详情颜色：**
- **主要信息**：蓝色背景（bg-blue-50）
- **次要信息**：灰色背景（bg-gray-50）
- **特殊功能**：绿色背景（bg-green-50）

## 多品牌管理架构

### 数据层级关系
```
租户（Tenant）
  └── 品牌1（Brand）
       └── 门店1-1（Store）
       └── 门店1-2（Store）
  └── 品牌2（Brand）
       └── 门店2-1（Store）
       └── 门店2-2（Store）
```

### 首页选择流程
1. 用户登录后选择租户
2. 显示租户下的所有品牌
3. 选择品牌后，只显示该品牌下的门店
4. 选择门店后，显示该门店的运营数据

### 品牌管理流程
1. 租户创建时自动创建默认品牌（使用租户名称）
2. 租户管理员可在管理中心添加更多品牌
3. 每个品牌可以有多个门店
4. 门店必须关联到某个品牌

## 岗位管理功能说明

### 员工岗位标记
1. **核心岗位**：标记关键岗位员工（如店长、厨师长）
2. **需固定顶岗**：标记需要其他人员顶岗的岗位
3. **可顶岗岗位**：选择该员工可以顶岗的其他岗位（多选）

### 排休规则中的顶岗配置
1. **启用顶岗检查**：开启后可配置核心岗位的顶岗规则
2. **不可同时休息**：核心岗位与顶岗人员不可同时休息
3. **顶岗人员配置**：为每个核心岗位员工配置顶岗人员列表

### 功能联动
- 员工标记为核心岗位后，在排休规则配置中可见
- 排休规则中配置的顶岗关系，在排班时自动检查
- 确保核心岗位始终有人值班
