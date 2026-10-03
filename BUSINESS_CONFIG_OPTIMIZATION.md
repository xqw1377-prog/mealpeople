# 业务配置优化文档

## 概述
本次优化主要完成了以下工作：
1. 删除了排班速查表功能
2. 添加了营业区及制作区配置功能
3. 添加了低营收下餐厅最少必要岗位配置功能

## 数据库变更

### 1. 营业区配置表 (business_area_config)
用于配置门店的营业区域和制作区域。

**字段说明：**
- `id`: 主键
- `tenant_id`: 租户ID
- `store_id`: 门店ID（可选）
- `area_name`: 区域名称（如：大厅、包间、外卖区、厨房等）
- `area_type`: 区域类型（business: 营业区, production: 制作区）
- `capacity`: 容量（区域可容纳人数）
- `is_active`: 是否启用
- `display_order`: 显示顺序
- `description`: 描述
- `created_at`: 创建时间
- `updated_at`: 更新时间

**迁移文件：** `supabase/migrations/35_create_business_area_and_min_revenue_config.sql`

### 2. 低营收岗位配置表 (min_revenue_position_config)
用于配置低营收情况下餐厅最少必要的岗位配置。

**字段说明：**
- `id`: 主键
- `tenant_id`: 租户ID
- `store_id`: 门店ID（可选）
- `position_name`: 岗位名称
- `min_count`: 最少人数
- `priority`: 优先级（数字越小优先级越高）
- `responsibilities`: 岗位职责
- `is_required`: 是否必需
- `created_at`: 创建时间
- `updated_at`: 更新时间

**迁移文件：** `supabase/migrations/35_create_business_area_and_min_revenue_config.sql`

### 3. 岗位配置表 (position_config)
用于存储岗位的基本配置信息。

**字段说明：**
- `id`: 主键
- `tenant_id`: 租户ID
- `store_id`: 门店ID（可选）
- `position_name`: 岗位名称
- `position_type`: 岗位类型
- `min_count`: 最少人数
- `max_count`: 最多人数
- `is_active`: 是否启用
- `created_at`: 创建时间
- `updated_at`: 更新时间

**迁移文件：** `supabase/migrations/35_create_business_area_and_min_revenue_config.sql`

### 4. 最低营收岗位配置方案表 (min_revenue_positions)
用于存储不同营收场景下的岗位配置方案。

**字段说明：**
- `id`: 主键
- `tenant_id`: 租户ID
- `store_id`: 门店ID（可选）
- `min_revenue`: 最低营收阈值
- `scenario_name`: 场景名称
- `required_positions`: 所需岗位列表（JSON格式）
- `description`: 场景描述
- `created_by`: 创建人
- `created_at`: 创建时间
- `updated_at`: 更新时间

**迁移文件：** `supabase/migrations/36_create_min_revenue_positions.sql`

## API变更

### 新增API函数

#### 1. hasBusinessAreaConfig
检查租户是否已配置营业区。

```typescript
export async function hasBusinessAreaConfig(tenantId: string): Promise<boolean>
```

#### 2. hasMinRevenueConfig
检查租户是否已配置低营收岗位。

```typescript
export async function hasMinRevenueConfig(tenantId: string): Promise<boolean>
```

#### 3. getConfigCompletionStats (更新)
更新了配置完成度统计，新增了营业区和低营收配置的检查。

```typescript
export async function getConfigCompletionStats(tenantId: string): Promise<{
  total: number
  completed: number
  percentage: number
  details: {
    hasBrand: boolean
    hasStore: boolean
    hasEmployee: boolean
    hasMealPeriod: boolean
    hasEfficiency: boolean
    hasPosition: boolean
    hasBusinessArea: boolean
    hasMinRevenue: boolean
  }
}>
```

## 页面变更

### 1. 管理中心页面 (pages/management/index.tsx)

#### 删除功能
- 删除了"排班速查表"功能入口

#### 新增功能
- 在业务配置部分添加了"营业区配置"入口
- 在业务配置部分添加了"低营收配置"入口

#### 更新内容
- 更新了 `ConfigStatus` 接口，添加了 `hasBusinessArea` 和 `hasMinRevenue` 字段
- 更新了 `checkConfigStatus` 函数，添加了新配置项的检查
- 更新了业务配置完成度计算，从3项增加到5项

### 2. 营业区配置页面 (pages/business-area-config/index.tsx)

**新建页面**，提供以下功能：
- 查看营业区配置列表
- 新增营业区配置
- 编辑营业区配置
- 删除营业区配置
- 启用/停用营业区

**页面特点：**
- 支持配置营业区和制作区两种类型
- 支持设置区域容量和显示顺序
- 提供清晰的配置说明
- 按显示顺序排序展示

### 3. 低营收配置页面 (pages/min-revenue-config/index.tsx)

**已存在页面**，提供以下功能：
- 查看低营收岗位配置方案列表
- 新增配置方案
- 编辑配置方案
- 删除配置方案
- 设置岗位为必需/可选

**页面特点：**
- 支持配置场景名称和最低营收阈值
- 支持配置所需岗位列表（JSON格式）
- 支持设置岗位优先级
- 提供清晰的配置说明

## 配置流程

### 营业区配置流程
1. 进入管理中心
2. 点击"营业区配置"
3. 点击"新增营业区"
4. 填写区域信息：
   - 区域名称（必填）
   - 区域类型（营业区/制作区）
   - 容量
   - 显示顺序
   - 描述
5. 保存配置

### 低营收配置流程
1. 进入管理中心
2. 点击"低营收配置"
3. 点击"新增岗位配置"
4. 填写岗位信息：
   - 岗位名称（必填）
   - 最少人数（必填）
   - 优先级
   - 岗位职责
5. 保存配置

## 配置完成度统计

### 基础配置（3项）
1. 品牌配置
2. 门店配置
3. 员工配置

### 业务配置（5项）
1. 品牌配置（餐段时间和班次）
2. 效能标准
3. 岗位配置
4. **营业区配置**（新增）
5. **低营收配置**（新增）

### 高级功能（可选）
- 营收管理
- 品牌管理
- 用户管理

## 数据安全

### RLS策略
所有新建表都启用了行级安全（RLS），确保：
1. 用户只能查看和管理自己租户的数据
2. 数据隔离，防止跨租户访问
3. 符合多租户架构的安全要求

### 权限控制
- 所有配置功能都需要用户登录
- 使用 `useAuth({guard: true})` 进行身份验证
- 自动过滤当前租户的数据

## 技术实现

### 前端技术栈
- React + TypeScript
- Taro（支持小程序和H5）
- Tailwind CSS
- Zustand（状态管理）

### 后端技术栈
- Supabase（数据库 + 认证）
- PostgreSQL
- Row Level Security (RLS)

### 代码组织
- 页面组件：`src/pages/`
- API函数：`src/db/api.ts`
- 类型定义：`src/db/types.ts`
- 数据库迁移：`supabase/migrations/`

## 测试建议

### 营业区配置测试
1. 测试新增营业区
2. 测试新增制作区
3. 测试编辑配置
4. 测试删除配置
5. 测试启用/停用功能
6. 测试显示顺序排序

### 低营收配置测试
1. 测试新增岗位配置
2. 测试编辑配置
3. 测试删除配置
4. 测试设置必需/可选
5. 测试优先级排序

### 配置完成度测试
1. 测试配置完成度统计
2. 测试配置检查清单
3. 测试配置建议功能
4. 测试快速开始引导

## 后续优化建议

### 功能增强
1. 支持批量导入营业区配置
2. 支持营业区配置模板
3. 支持低营收配置方案复制
4. 支持配置历史记录查看

### 用户体验
1. 添加配置向导，引导用户完成配置
2. 提供配置示例和最佳实践
3. 添加配置验证和提示
4. 优化移动端显示效果

### 数据分析
1. 统计营业区使用情况
2. 分析低营收场景出现频率
3. 提供配置优化建议
4. 生成配置报表

## 相关文档
- [TODO.md](./TODO.md) - 任务清单
- [MULTI_BRAND_PLAN.md](./MULTI_BRAND_PLAN.md) - 多品牌架构计划
- [REVENUE_MANAGEMENT_OPTIMIZATION.md](./REVENUE_MANAGEMENT_OPTIMIZATION.md) - 营收管理优化
