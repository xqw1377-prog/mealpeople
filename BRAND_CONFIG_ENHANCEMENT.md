# 品牌配置功能完善报告

## 完善日期
2025-11-06

## 功能概述

本次完善在原有品牌配置功能的基础上，新增了工作配置和预警配置两大模块，使品牌配置功能更加完整和实用。

---

## 新增功能

### 1. 工作配置模块 ✓

#### 1.1 默认每月工作天数
- **字段名称**：`default_monthly_work_days`
- **数据类型**：数字（1-31）
- **默认值**：26天
- **用途**：用于计算月度人力成本
- **验证规则**：必须在1-31之间

#### 1.2 默认兼职时薪
- **字段名称**：`default_part_time_hourly_rate`
- **数据类型**：数字（元/小时）
- **默认值**：20元/小时
- **用途**：用于计算兼职员工的人力成本
- **验证规则**：必须大于0

---

### 2. 预警配置模块 ✓

#### 2.1 成本预警阈值
- **字段名称**：`cost_warning_threshold`
- **数据类型**：数字（百分比，0-100）
- **默认值**：35%
- **用途**：当人力成本占营收比例超过此值时触发预警
- **验证规则**：必须在0-100之间
- **存储格式**：数据库存储为小数（0.35），界面显示为百分比（35）

#### 2.2 效能预警阈值
- **字段名称**：`efficiency_warning_threshold`
- **数据类型**：数字（百分比，0-100）
- **默认值**：80%
- **用途**：当人效低于此值时触发预警（即每人每小时营收低于标准的80%）
- **验证规则**：必须在0-100之间
- **存储格式**：数据库存储为小数（0.80），界面显示为百分比（80）

---

## 技术实现

### 1. 前端实现

#### 1.1 状态管理
```typescript
// 新增状态变量
const [defaultMonthlyWorkDays, setDefaultMonthlyWorkDays] = useState('26')
const [defaultPartTimeHourlyRate, setDefaultPartTimeHourlyRate] = useState('20')
const [costWarningThreshold, setCostWarningThreshold] = useState('35')
const [efficiencyWarningThreshold, setEfficiencyWarningThreshold] = useState('80')
```

#### 1.2 数据加载
```typescript
// 从数据库加载配置时，将小数转换为百分比
setDefaultMonthlyWorkDays(settings.default_monthly_work_days?.toString() || '26')
setDefaultPartTimeHourlyRate(settings.default_part_time_hourly_rate?.toString() || '20')
setCostWarningThreshold((Number(settings.cost_warning_threshold || 0.35) * 100).toString())
setEfficiencyWarningThreshold((Number(settings.efficiency_warning_threshold || 0.80) * 100).toString())
```

#### 1.3 数据保存
```typescript
// 保存时将百分比转换为小数
const result = await upsertTenantSettings({
  tenant_id: activeTenant.id,
  default_daily_work_hours: hours,
  default_monthly_work_days: workDays,
  default_part_time_hourly_rate: hourlyRate,
  cost_warning_threshold: costThreshold / 100,  // 35 -> 0.35
  efficiency_warning_threshold: efficiencyThreshold / 100,  // 80 -> 0.80
  // ... 其他字段
})
```

#### 1.4 表单验证
```typescript
// 验证每月工作天数
const workDays = Number(defaultMonthlyWorkDays)
if (!workDays || workDays <= 0 || workDays > 31) {
  Taro.showToast({title: '请输入有效的每月工作天数（1-31）', icon: 'none'})
  return
}

// 验证兼职时薪
const hourlyRate = Number(defaultPartTimeHourlyRate)
if (!hourlyRate || hourlyRate <= 0) {
  Taro.showToast({title: '请输入有效的兼职时薪', icon: 'none'})
  return
}

// 验证成本预警阈值
const costThreshold = Number(costWarningThreshold)
if (isNaN(costThreshold) || costThreshold < 0 || costThreshold > 100) {
  Taro.showToast({title: '请输入有效的成本预警阈值（0-100）', icon: 'none'})
  return
}

// 验证效能预警阈值
const efficiencyThreshold = Number(efficiencyWarningThreshold)
if (isNaN(efficiencyThreshold) || efficiencyThreshold < 0 || efficiencyThreshold > 100) {
  Taro.showToast({title: '请输入有效的效能预警阈值（0-100）', icon: 'none'})
  return
}
```

---

### 2. 后端实现

#### 2.1 API函数更新
```typescript
export async function upsertTenantSettings(settings: {
  tenant_id: string
  default_daily_work_hours: number
  default_monthly_work_days?: number  // 新增
  default_part_time_hourly_rate?: number  // 新增
  cost_warning_threshold?: number  // 新增
  efficiency_warning_threshold?: number  // 新增
  brand_name?: string | null
  industry?: string | null
  contact_person?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  logo_url?: string | null
  description?: string | null
})
```

#### 2.2 数据库字段
所有新增字段在`tenant_settings`表中已存在，无需创建新的迁移：
- `default_monthly_work_days` - NUMERIC，默认值26.00
- `default_part_time_hourly_rate` - NUMERIC，默认值20.00
- `cost_warning_threshold` - NUMERIC，默认值0.35
- `efficiency_warning_threshold` - NUMERIC，默认值0.80

---

## UI设计

### 1. 工作配置卡片
```
┌─────────────────────────────────────┐
│ 🕐 工作配置                          │
├─────────────────────────────────────┤
│ 默认每日工作小时数                   │
│ [8                              ]   │
│ 💡 用于计算正式工的工时和人力成本    │
│                                     │
│ 默认每月工作天数                     │
│ [26                             ]   │
│ 💡 用于计算月度人力成本              │
│                                     │
│ 默认兼职时薪（元/小时）              │
│ [20                             ]   │
│ 💡 用于计算兼职员工的人力成本        │
└─────────────────────────────────────┘
```

### 2. 预警配置卡片
```
┌─────────────────────────────────────┐
│ ⚠️ 预警配置                          │
├─────────────────────────────────────┤
│ 成本预警阈值（%）                    │
│ [35                             ]   │
│ 💡 当人力成本占营收比例超过此值时    │
│    触发预警，默认为35%               │
│                                     │
│ 效能预警阈值（%）                    │
│ [80                             ]   │
│ 💡 当人效低于此值时触发预警，默认    │
│    为80%（即每人每小时营收低于标准   │
│    的80%）                          │
└─────────────────────────────────────┘
```

---

## 配置说明更新

原有说明：
- • 品牌信息用于展示和识别您的企业
- • 行业类型影响系统的默认配置和建议
- • 联系信息用于系统通知和客服支持
- • 工作配置影响排班规划中的人数计算

更新后说明：
- • 品牌信息：用于展示和识别您的企业，Logo将显示在系统各处
- • 行业信息：影响系统的默认配置和建议
- • 联系信息：用于系统通知和客服支持
- • 工作配置：影响排班规划中的人数计算和成本核算
- • 预警配置：帮助您及时发现成本和效能异常

---

## 应用场景

### 1. 工作配置应用场景

#### 场景1：计算月度人力成本
```
月度人力成本 = 员工月薪 / 默认每月工作天数 × 实际工作天数
```

#### 场景2：计算兼职员工成本
```
兼职员工成本 = 默认兼职时薪 × 工作小时数
```

#### 场景3：排班规划
```
所需人数 = 预计营收 / (默认每日工作小时数 × 人均时薪)
```

---

### 2. 预警配置应用场景

#### 场景1：成本预警
```
当日人力成本占比 = 当日人力成本 / 当日营收 × 100%

如果 当日人力成本占比 > 成本预警阈值（35%）
则 触发成本预警通知
```

#### 场景2：效能预警
```
当日人效 = 当日营收 / (员工数 × 工作小时数)
标准人效 = 历史平均人效

效能达成率 = 当日人效 / 标准人效 × 100%

如果 效能达成率 < 效能预警阈值（80%）
则 触发效能预警通知
```

---

## 数据流转

### 1. 配置保存流程
```
用户输入
  ↓
前端验证（格式、范围）
  ↓
数据转换（百分比→小数）
  ↓
API调用（upsertTenantSettings）
  ↓
数据库保存（tenant_settings表）
  ↓
保存成功反馈
  ↓
重新加载配置
```

### 2. 配置加载流程
```
页面加载
  ↓
获取租户ID
  ↓
API调用（getTenantSettings）
  ↓
数据库查询（tenant_settings表）
  ↓
数据转换（小数→百分比）
  ↓
更新界面状态
```

---

## 测试建议

### 1. 功能测试

#### 工作配置测试
- [ ] 测试默认每日工作小时数保存和加载
- [ ] 测试默认每月工作天数保存和加载
- [ ] 测试默认兼职时薪保存和加载
- [ ] 测试边界值（0、负数、超大值）
- [ ] 测试小数输入

#### 预警配置测试
- [ ] 测试成本预警阈值保存和加载
- [ ] 测试效能预警阈值保存和加载
- [ ] 测试百分比与小数的转换
- [ ] 测试边界值（0、100、负数、超过100）
- [ ] 测试小数输入

---

### 2. 验证测试

#### 输入验证测试
- [ ] 测试空值输入
- [ ] 测试非数字输入
- [ ] 测试负数输入
- [ ] 测试超出范围的值
- [ ] 测试小数点后多位数

#### 错误提示测试
- [ ] 验证每个字段的错误提示是否清晰
- [ ] 验证错误提示的显示时长
- [ ] 验证多个错误的处理顺序

---

### 3. 集成测试

#### 与其他模块的集成
- [ ] 测试配置在排班规划中的应用
- [ ] 测试配置在成本计算中的应用
- [ ] 测试配置在预警系统中的应用
- [ ] 测试配置在数据分析中的应用

---

## 修改的文件

### 前端文件
1. **src/pages/tenant-settings/index.tsx**
   - 添加4个新状态变量
   - 更新loadSettings函数
   - 更新handleSave函数
   - 添加4个新的表单验证
   - 添加工作配置UI卡片
   - 添加预警配置UI卡片
   - 更新配置说明

### 后端文件
1. **src/db/api.ts**
   - 更新upsertTenantSettings函数签名
   - 添加4个新的可选参数

---

## 总结

### 完成的工作
1. ✅ 添加了4个新的配置项
2. ✅ 实现了完整的表单验证
3. ✅ 实现了数据格式转换（百分比↔小数）
4. ✅ 优化了UI布局和说明文案
5. ✅ 更新了API函数支持新字段
6. ✅ 提供了详细的应用场景说明

### 功能价值
1. **工作配置**：为人力成本计算提供基础参数
2. **预警配置**：帮助管理者及时发现成本和效能异常
3. **灵活性**：支持不同行业、不同规模企业的个性化配置
4. **易用性**：清晰的说明和合理的默认值降低使用门槛

### 下一步建议
1. 在排班规划模块中应用这些配置参数
2. 在成本分析模块中应用这些配置参数
3. 实现预警通知功能
4. 添加配置历史记录功能
5. 添加配置导入导出功能
