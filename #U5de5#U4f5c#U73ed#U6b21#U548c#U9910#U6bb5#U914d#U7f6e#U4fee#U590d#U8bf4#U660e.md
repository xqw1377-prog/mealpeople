# 工作班次和餐段配置修复说明

## 修复概述

本次修复解决了两个关键问题：
1. **工作班次配置**：支持一个班次配置多个不连续的时间段
2. **品牌配置按钮**：修复编辑/删除按钮文字颜色看不见的问题

---

## 问题1：工作班次多时间段支持

### 问题描述
用户反馈：工作班次配置只能设置一个连续的时间段，无法满足实际业务需求。例如，早班需要配置为 6:00～9:00 和 16:00～21:00 两个不连续的时间段。

### 解决方案

#### 1. 数据库层面
**文件：** `supabase/migrations/40_add_time_periods_to_work_shifts.sql`

添加了 `time_periods` 字段（JSONB类型）到 `work_shifts` 表：

```sql
ALTER TABLE work_shifts 
ADD COLUMN IF NOT EXISTS time_periods JSONB DEFAULT NULL;
```

**数据格式：**
```json
[
  {"start": "06:00", "end": "09:00"},
  {"start": "16:00", "end": "21:00"}
]
```

**向后兼容性：**
- 当 `time_periods` 为 NULL 或空时，系统使用原有的 `start_time` 和 `end_time` 字段
- 当 `time_periods` 有值时，优先使用 `time_periods`
- 旧数据无需迁移，继续正常工作

#### 2. 类型定义层面
**文件：** `src/db/api-work-shifts.ts`

新增 `TimePeriod` 接口：
```typescript
export interface TimePeriod {
  start: string // HH:mm格式，如 "06:00"
  end: string   // HH:mm格式，如 "09:00"
}
```

更新 `WorkShift` 接口：
```typescript
export interface WorkShift {
  // ... 其他字段
  time_periods?: TimePeriod[] | null // 多时间段配置
}
```

#### 3. 前端功能层面
**文件：** `src/pages/work-shifts/index.tsx`

**新增功能：**

1. **动态添加时间段**
   - 点击"+ 添加时间段"按钮可以添加新的时间段
   - 每个时间段独立配置开始和结束时间

2. **删除时间段**
   - 每个时间段都有独立的删除按钮
   - 至少保留一个时间段（防止误删）

3. **时间段显示**
   - 单时间段：显示为 "09:00 - 17:00"
   - 多时间段：显示为 "时段1: 06:00 - 09:00" 和 "时段2: 16:00 - 21:00"

4. **数据保存逻辑**
   - 只有一个时间段时：`time_periods` 保存为 NULL，使用 `start_time` 和 `end_time`
   - 多个时间段时：`time_periods` 保存为 JSON 数组

**核心代码片段：**

```typescript
// 添加时间段
const handleAddTimePeriod = () => {
  setFormData({
    ...formData,
    timePeriods: [...formData.timePeriods, {start: '09:00', end: '17:00'}]
  })
}

// 删除时间段
const handleRemoveTimePeriod = (index: number) => {
  if (formData.timePeriods.length <= 1) {
    Taro.showToast({
      title: '至少保留一个时间段',
      icon: 'none'
    })
    return
  }
  const newPeriods = formData.timePeriods.filter((_, i) => i !== index)
  setFormData({...formData, timePeriods: newPeriods})
}

// 更新时间段
const handleUpdateTimePeriod = (index: number, field: 'start' | 'end', value: string) => {
  const newPeriods = [...formData.timePeriods]
  newPeriods[index] = {...newPeriods[index], [field]: value}
  setFormData({...formData, timePeriods: newPeriods})
}
```

### 使用示例

#### 场景1：配置单时间段班次（正常班）
1. 点击"添加班次"
2. 输入班次名称：正常班
3. 配置时间段：09:00 - 17:00
4. 输入工作小时数：8
5. 点击"保存"

**结果：** 保存为传统的单时间段格式，向后兼容

#### 场景2：配置多时间段班次（早班）
1. 点击"添加班次"
2. 输入班次名称：早班
3. 配置第一个时间段：06:00 - 09:00
4. 点击"+ 添加时间段"
5. 配置第二个时间段：16:00 - 21:00
6. 输入工作小时数：8
7. 点击"保存"

**结果：** 保存为多时间段格式，`time_periods` 字段包含两个时间段

#### 场景3：编辑现有班次
1. 点击班次卡片上的"编辑"按钮
2. 系统自动加载现有时间段（单个或多个）
3. 可以添加、删除或修改时间段
4. 点击"保存"更新

---

## 问题2：品牌配置按钮颜色修复

### 问题描述
用户反馈：品牌配置页面的餐段配置和班次配置中，编辑/删除按钮和确认按钮的文字颜色与背景色都是白色，导致文字看不见。

**原因分析：**
- 按钮使用了 `bg-primary text-white` 样式
- 在某些主题配置下，`primary` 颜色可能被设置为白色或浅色
- 导致白色文字在白色背景上不可见

### 解决方案

#### 修改文件
**文件：** `src/pages/brand-config/index.tsx`

#### 修改内容

**1. 餐段配置按钮**

修改前：
```tsx
<Button className="bg-primary text-white ...">编辑</Button>
<Button className="bg-destructive text-white ...">删除</Button>
<Button className="bg-primary text-white ...">保存</Button>
<Button className="bg-muted text-foreground ...">取消</Button>
```

修改后：
```tsx
<Button className="bg-blue-500 text-white ...">编辑</Button>
<Button className="bg-red-500 text-white ...">删除</Button>
<Button className="bg-blue-500 text-white ...">保存</Button>
<Button className="bg-gray-200 text-gray-800 ...">取消</Button>
```

**2. 班次配置按钮**

修改前：
```tsx
<Button className="bg-primary text-white ...">编辑</Button>
<Button className="bg-destructive text-white ...">删除</Button>
<Button className="bg-primary text-white ...">保存</Button>
<Button className="bg-muted text-foreground ...">取消</Button>
```

修改后：
```tsx
<Button className="bg-green-500 text-white ...">编辑</Button>
<Button className="bg-red-500 text-white ...">删除</Button>
<Button className="bg-green-500 text-white ...">保存</Button>
<Button className="bg-gray-200 text-gray-800 ...">取消</Button>
```

**3. 底部添加按钮**

修改前：
```tsx
<Button className="bg-primary text-white ...">添加餐段/添加班次</Button>
```

修改后：
```tsx
<Button className="bg-blue-500 text-white ...">添加餐段/添加班次</Button>
```

#### 颜色方案说明

| 按钮类型 | 餐段配置 | 班次配置 | 说明 |
|---------|---------|---------|------|
| 编辑按钮 | `bg-blue-500` | `bg-green-500` | 蓝色表示信息操作，绿色表示成功操作 |
| 删除按钮 | `bg-red-500` | `bg-red-500` | 红色表示危险操作 |
| 保存按钮 | `bg-blue-500` | `bg-green-500` | 与编辑按钮保持一致 |
| 取消按钮 | `bg-gray-200` | `bg-gray-200` | 灰色表示中性操作 |
| 添加按钮 | `bg-blue-500` | `bg-blue-500` | 蓝色表示主要操作 |

**优势：**
- 使用具体的 Tailwind CSS 颜色类，不依赖主题变量
- 颜色对比度高，确保文字清晰可见
- 符合用户界面设计规范
- 不同操作类型使用不同颜色，提高可识别性

---

## 测试验证

### 工作班次多时间段测试

#### 测试用例1：创建单时间段班次
1. 进入"启动中心" → "工作班次配置"
2. 点击"添加班次"
3. 输入班次名称：正常班
4. 保持默认单时间段：09:00 - 17:00
5. 输入工作小时数：8
6. 点击"保存"

**预期结果：**
- ✅ 保存成功
- ✅ 班次列表显示新班次
- ✅ 显示单个时间段：09:00 - 17:00
- ✅ 显示工时：8小时

#### 测试用例2：创建多时间段班次
1. 点击"添加班次"
2. 输入班次名称：早班
3. 配置第一个时间段：06:00 - 09:00
4. 点击"+ 添加时间段"
5. 配置第二个时间段：16:00 - 21:00
6. 输入工作小时数：8
7. 点击"保存"

**预期结果：**
- ✅ 保存成功
- ✅ 班次列表显示新班次
- ✅ 显示两个时间段：
  - 时段1: 06:00 - 09:00
  - 时段2: 16:00 - 21:00
- ✅ 显示工时：8小时

#### 测试用例3：编辑班次添加时间段
1. 点击"正常班"的"编辑"按钮
2. 点击"+ 添加时间段"
3. 配置第二个时间段：19:00 - 22:00
4. 点击"保存"

**预期结果：**
- ✅ 保存成功
- ✅ 班次更新为多时间段显示
- ✅ 显示两个时间段

#### 测试用例4：删除时间段
1. 点击"早班"的"编辑"按钮
2. 点击第二个时间段的"删除"按钮
3. 点击"保存"

**预期结果：**
- ✅ 保存成功
- ✅ 班次更新为单时间段显示
- ✅ 只显示第一个时间段

#### 测试用例5：尝试删除最后一个时间段
1. 点击"正常班"的"编辑"按钮
2. 点击唯一时间段的"删除"按钮

**预期结果：**
- ✅ 显示提示："至少保留一个时间段"
- ✅ 时间段未被删除

### 按钮颜色测试

#### 测试用例1：餐段配置按钮
1. 进入"品牌配置" → "餐段配置"
2. 查看现有餐段的按钮

**预期结果：**
- ✅ 编辑按钮：蓝色背景，白色文字，清晰可见
- ✅ 删除按钮：红色背景，白色文字，清晰可见

3. 点击"添加餐段"
4. 查看表单底部按钮

**预期结果：**
- ✅ 取消按钮：灰色背景，深灰色文字，清晰可见
- ✅ 保存按钮：蓝色背景，白色文字，清晰可见

#### 测试用例2：班次配置按钮
1. 进入"品牌配置" → "班次配置"
2. 查看现有班次的按钮

**预期结果：**
- ✅ 编辑按钮：绿色背景，白色文字，清晰可见
- ✅ 删除按钮：红色背景，白色文字，清晰可见

3. 点击"添加班次"
4. 查看表单底部按钮

**预期结果：**
- ✅ 取消按钮：灰色背景，深灰色文字，清晰可见
- ✅ 保存按钮：绿色背景，白色文字，清晰可见

---

## 技术细节

### 数据库索引优化
为了提高多时间段查询性能，创建了GIN索引：

```sql
CREATE INDEX IF NOT EXISTS idx_work_shifts_time_periods 
ON work_shifts USING GIN (time_periods);
```

**GIN索引优势：**
- 适合JSONB类型字段
- 支持高效的JSON查询
- 提高多时间段数据的检索速度

### 前端状态管理
使用React Hooks管理表单状态：

```typescript
const [formData, setFormData] = useState({
  shiftName: '',
  workHours: '8',
  timePeriods: [{start: '09:00', end: '17:00'}] as TimePeriod[]
})
```

**优势：**
- 类型安全
- 状态更新可预测
- 易于调试和维护

### 数据验证
保存前进行完整的数据验证：

```typescript
// 验证时间段
if (formData.timePeriods.length === 0) {
  Taro.showToast({title: '请至少添加一个时间段', icon: 'none'})
  return
}

// 验证每个时间段
for (const period of formData.timePeriods) {
  if (!period.start || !period.end) {
    Taro.showToast({title: '请完整填写所有时间段', icon: 'none'})
    return
  }
}
```

---

## 向后兼容性

### 数据兼容
- 旧数据（只有 `start_time` 和 `end_time`）继续正常工作
- 新数据可以选择使用单时间段或多时间段
- 系统自动判断使用哪种格式

### 显示兼容
```typescript
// 判断是否有多时间段
const hasMultiplePeriods = shift.time_periods && shift.time_periods.length > 0
const displayPeriods = hasMultiplePeriods
  ? shift.time_periods
  : [{start: shift.start_time, end: shift.end_time}]
```

### 保存兼容
```typescript
// 只有一个时间段时，time_periods保存为null
time_periods: formData.timePeriods.length > 1 ? formData.timePeriods : null
```

---

## 用户指南

### 如何配置多时间段班次

1. **进入配置页面**
   - 打开小程序
   - 进入"启动中心"
   - 点击"工作班次配置"

2. **创建新班次**
   - 点击底部"添加班次"按钮
   - 输入班次名称（如：早班）

3. **配置第一个时间段**
   - 点击"开始"时间选择器，选择开始时间（如：06:00）
   - 点击"结束"时间选择器，选择结束时间（如：09:00）

4. **添加更多时间段**
   - 点击"+ 添加时间段"按钮
   - 配置新时间段的开始和结束时间（如：16:00 - 21:00）
   - 可以继续添加更多时间段

5. **设置工作小时数**
   - 输入总工作小时数（如：8）
   - 这个数值用于计算工时和人力成本

6. **保存配置**
   - 点击"保存"按钮
   - 系统会验证数据并保存

### 如何编辑班次

1. 在班次列表中找到要编辑的班次
2. 点击"编辑"按钮
3. 修改班次信息：
   - 修改班次名称
   - 修改现有时间段
   - 添加新时间段
   - 删除不需要的时间段（至少保留一个）
   - 修改工作小时数
4. 点击"保存"按钮

### 如何删除时间段

1. 点击班次的"编辑"按钮
2. 找到要删除的时间段
3. 点击该时间段右上角的"删除"按钮
4. 注意：至少需要保留一个时间段
5. 点击"保存"按钮

---

## 常见问题

### Q1: 为什么我删除不了最后一个时间段？
**A:** 系统要求每个班次至少有一个时间段。如果只剩一个时间段，删除按钮会被禁用，并提示"至少保留一个时间段"。

### Q2: 多时间段的工作小时数如何计算？
**A:** 工作小时数需要手动输入，系统不会自动计算。建议根据实际工作时长填写，这个数值会用于工时统计和人力成本计算。

### Q3: 旧的班次数据会受影响吗？
**A:** 不会。旧的班次数据会继续正常工作，系统会自动兼容。您可以选择编辑旧班次，将其转换为多时间段格式。

### Q4: 时间段可以重叠吗？
**A:** 系统目前不会阻止时间段重叠，但建议配置不重叠的时间段，以便更准确地反映实际工作安排。

### Q5: 最多可以添加多少个时间段？
**A:** 理论上没有限制，但建议不超过5个时间段，以保持配置的清晰性和可管理性。

---

## 总结

本次修复完成了以下工作：

1. ✅ 数据库层面支持多时间段存储
2. ✅ 类型定义完整且类型安全
3. ✅ 前端UI支持动态添加/删除时间段
4. ✅ 保持向后兼容性
5. ✅ 修复所有按钮颜色问题
6. ✅ 提供完整的用户指南和测试用例

**影响范围：**
- 工作班次配置页面
- 品牌配置页面（餐段配置和班次配置）
- 数据库 work_shifts 表
- 相关API和类型定义

**用户体验提升：**
- 支持更灵活的班次配置
- 按钮清晰可见，操作更直观
- 界面友好，易于理解和使用
