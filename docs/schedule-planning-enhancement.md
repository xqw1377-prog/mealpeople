# 排班规划功能增强说明

## 版本：v2.25.0
## 日期：2025-11-06

## 概述

本次更新对排班规划功能进行了重大增强，新增了第四步操作（快速排休和增加兼职），并实现了排班结果的自动生成和展示。

## 主要功能

### 1. 效能配置公式优化

#### 更新内容
- 优化了效能配置页面的公式说明，使其更加清晰易懂
- 添加了详细的计算示例

#### 公式说明
```
目标总工时 = 预估营收 ÷ 效能标准
目标人数 = 目标总工时 ÷ 每日工作小时数
```

#### 示例
- 8小时工作制下，2小时工作量 = 0.25人
- 预估营收10000元，效能标准500元/人/日，每日工作8小时
  - 目标总工时 = 10000 ÷ 500 = 20小时
  - 目标人数 = 20 ÷ 8 = 2.5人

### 2. 排班规划第四步：排休与兼职

#### 2.1 快速排休功能
- 提供快速排休入口按钮
- 可以根据餐段反向选择员工进行排休
- 自动计算排休人数

#### 2.2 增加兼职功能
- 支持录入兼职员工信息：
  - 员工姓名（必填）
  - 工作工时（必填，小时）
  - 时薪（必填，元/小时）
  - 餐段（可选：早餐/午餐/晚餐）
  - 备注（可选）
- 自动计算兼职费用：总费用 = 工作工时 × 时薪
- 显示兼职记录列表，包含：
  - 员工姓名和费用
  - 工时和时薪详情
  - 餐段信息
- 显示兼职汇总信息：
  - 总人数
  - 总工时
  - 总费用

### 3. 排班结果自动生成

#### 3.1 结果计算
保存排班规划时，系统会自动计算并生成排班结果，包括：

1. **排休人数**
   - 计算公式：总员工数 - 计划人数
   
2. **排班达成率**
   - 计算公式：(实际总工时 ÷ 目标总工时) × 100%
   - 实际总工时 = 正式工总工时 + 兼职总工时
   - 达成率 ≥ 95% 显示为绿色（优秀）
   - 达成率 < 95% 显示为黄色（需改进）

3. **人力成本总额**
   - 正式工成本 = 计划人数 × 日均工资
   - 兼职成本 = 所有兼职记录的费用总和
   - 总成本 = 正式工成本 + 兼职成本

4. **人力成本率**
   - 计算公式：(人力成本总额 ÷ 预估营收) × 100%
   - 显示百分比形式

5. **成本是否合格**
   - 判断标准：人力成本率 ≤ 30%
   - 合格显示为绿色 ✅
   - 不合格显示为红色 ❌

#### 3.2 结果展示
排班结果以卡片形式展示在排班规划页面，包含以下信息：
- 排休人数
- 排班达成率（带颜色标识）
- 人力成本总额
- 人力成本率
- 成本是否合格（带颜色标识）

## 数据库设计

### 1. 兼职工时记录表（part_time_shifts）

```sql
CREATE TABLE part_time_shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    store_id uuid NOT NULL,
    operation_date date NOT NULL,
    employee_name text NOT NULL,
    work_hours numeric NOT NULL CHECK (work_hours > 0),
    hourly_rate numeric NOT NULL CHECK (hourly_rate > 0),
    total_cost numeric NOT NULL CHECK (total_cost >= 0),
    meal_period text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

**字段说明：**
- `id`: 主键
- `tenant_id`: 租户ID
- `store_id`: 店铺ID
- `operation_date`: 运营日期
- `employee_name`: 兼职员工姓名
- `work_hours`: 工作工时（小时）
- `hourly_rate`: 时薪（元/小时）
- `total_cost`: 总费用（元）
- `meal_period`: 餐段（早餐/午餐/晚餐）
- `notes`: 备注

### 2. 排班结果表（schedule_results）

```sql
CREATE TABLE schedule_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    store_id uuid NOT NULL,
    operation_date date NOT NULL,
    estimated_revenue numeric NOT NULL CHECK (estimated_revenue >= 0),
    target_staff_count integer NOT NULL CHECK (target_staff_count > 0),
    planned_staff_count integer NOT NULL CHECK (planned_staff_count >= 0),
    rest_staff_count integer NOT NULL CHECK (rest_staff_count >= 0),
    part_time_count integer DEFAULT 0 CHECK (part_time_count >= 0),
    part_time_hours numeric DEFAULT 0 CHECK (part_time_hours >= 0),
    achievement_rate numeric NOT NULL,
    total_labor_cost numeric NOT NULL CHECK (total_labor_cost >= 0),
    labor_cost_rate numeric NOT NULL,
    is_cost_qualified boolean NOT NULL,
    efficiency_zone text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tenant_id, store_id, operation_date)
);
```

**字段说明：**
- `id`: 主键
- `tenant_id`: 租户ID
- `store_id`: 店铺ID
- `operation_date`: 运营日期
- `estimated_revenue`: 预估营收
- `target_staff_count`: 目标人数
- `planned_staff_count`: 计划人数
- `rest_staff_count`: 排休人数
- `part_time_count`: 兼职人数
- `part_time_hours`: 兼职总工时
- `achievement_rate`: 排班达成率（%）
- `total_labor_cost`: 人力成本总额
- `labor_cost_rate`: 人力成本率（%）
- `is_cost_qualified`: 成本是否合格
- `efficiency_zone`: 营收区间（low/normal/high）

## API接口

### 兼职工时相关API

#### 1. createPartTimeShift
创建兼职工时记录

**参数：**
```typescript
{
  tenant_id: string
  store_id: string
  operation_date: string
  employee_name: string
  work_hours: number
  hourly_rate: number
  total_cost: number
  meal_period?: string
  notes?: string
}
```

#### 2. getPartTimeShiftsByDate
获取指定日期的兼职记录

**参数：**
- `tenantId`: 租户ID
- `storeId`: 店铺ID
- `operationDate`: 运营日期（YYYY-MM-DD）

**返回：** PartTimeShift[]

#### 3. updatePartTimeShift
更新兼职工时记录

**参数：**
- `id`: 记录ID
- `updates`: 要更新的字段

#### 4. deletePartTimeShift
删除兼职工时记录

**参数：**
- `id`: 记录ID

### 排班结果相关API

#### 1. upsertScheduleResult
创建或更新排班结果

**参数：**
```typescript
{
  tenant_id: string
  store_id: string
  operation_date: string
  estimated_revenue: number
  target_staff_count: number
  planned_staff_count: number
  rest_staff_count: number
  part_time_count: number
  part_time_hours: number
  achievement_rate: number
  total_labor_cost: number
  labor_cost_rate: number
  is_cost_qualified: boolean
  efficiency_zone: string
}
```

#### 2. getScheduleResultByDate
获取指定日期的排班结果

**参数：**
- `tenantId`: 租户ID
- `storeId`: 店铺ID
- `operationDate`: 运营日期（YYYY-MM-DD）

**返回：** ScheduleResult | null

#### 3. getScheduleResultsByDateRange
获取日期范围内的排班结果

**参数：**
- `tenantId`: 租户ID
- `storeId`: 店铺ID
- `startDate`: 开始日期（YYYY-MM-DD）
- `endDate`: 结束日期（YYYY-MM-DD）

**返回：** ScheduleResult[]

## 使用流程

### 完整排班流程

1. **第一步：预估营收**
   - 输入次日预估营收金额

2. **第二步：查表结果**（如果已配置效能标准）
   - 系统自动计算所属营收区间
   - 显示效能标准
   - 显示目标人数和目标总工时
   - 显示管理口令

3. **第三步：排班人数**
   - 输入正式工人数
   - 输入兼职工时（可选）
   - 系统提示总工时是否在目标范围内

4. **第四步：排休与兼职**
   - 点击"快速排休"按钮进行排休操作
   - 点击"增加兼职"按钮录入兼职信息
   - 查看兼职记录列表和汇总

5. **保存排班规划**
   - 点击"保存排班规划"按钮
   - 系统自动生成排班结果
   - 显示排班结果卡片

6. **查看排班结果**
   - 查看排休人数
   - 查看排班达成率
   - 查看人力成本和成本率
   - 确认成本是否合格

## 注意事项

1. **兼职工时录入**
   - 员工姓名、工作工时、时薪为必填项
   - 工作工时和时薪必须大于0
   - 系统会自动计算总费用

2. **排班结果生成**
   - 只有在配置了效能标准的情况下才会生成完整的排班结果
   - 排班结果会在每次保存时自动更新
   - 人力成本计算基于假设的平均月薪（5000元）

3. **成本控制**
   - 人力成本率标准为30%
   - 超过30%会显示为不合格
   - 建议通过优化排班和控制兼职工时来降低成本率

## 后续优化建议

1. **快速排休功能完善**
   - 实现根据餐段反向选择员工的具体逻辑
   - 添加员工排休历史记录
   - 支持批量排休操作

2. **兼职管理增强**
   - 添加兼职员工库，方便快速选择
   - 支持编辑和删除兼职记录
   - 添加兼职工时统计报表

3. **排班结果分析**
   - 添加历史排班结果对比
   - 生成排班效率趋势图
   - 提供排班优化建议

4. **成本计算优化**
   - 支持配置员工实际工资
   - 支持不同岗位的差异化工资
   - 添加社保、公积金等其他人力成本

## 技术细节

### 类型定义

```typescript
// 兼职工时记录
export interface PartTimeShift {
  id: string
  tenant_id: string
  store_id: string
  operation_date: string
  employee_name: string
  work_hours: number
  hourly_rate: number
  total_cost: number
  meal_period: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 排班结果
export interface ScheduleResult {
  id: string
  tenant_id: string
  store_id: string
  operation_date: string
  estimated_revenue: number
  target_staff_count: number
  planned_staff_count: number
  rest_staff_count: number
  part_time_count: number
  part_time_hours: number
  achievement_rate: number
  total_labor_cost: number
  labor_cost_rate: number
  is_cost_qualified: boolean
  efficiency_zone: string
  created_at: string
  updated_at: string
}
```

### 数据流程

```
用户输入 → 保存排班规划 → 生成排班结果
    ↓              ↓              ↓
预估营收      保存运营数据    计算各项指标
排班人数      加载兼职记录    保存排班结果
兼职工时      加载员工列表    显示结果卡片
```

## 总结

本次更新大幅提升了排班规划功能的完整性和实用性，通过增加兼职管理和排班结果分析，帮助用户更好地进行人力资源规划和成本控制。系统现在能够自动计算关键指标，为管理决策提供数据支持。
