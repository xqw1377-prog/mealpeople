# 排班数据同步到数据分析和成本管控页面

## 修改日期
2025-11-06

## 修改概述
根据用户反馈，数据分析和成本管控页面还没有同步排班数据。本次修改在这两个页面中集成了排班结果数据，使其能够显示来自`schedule_results`表的真实排班数据。

## 问题分析

### 原有问题
1. **数据分析页面**：只显示`operations_data`表的数据，没有显示排班结果数据
2. **成本管控页面**：只显示`operations_data`表的数据，没有显示排班结果数据
3. **数据来源不一致**：排班规划页面使用`schedule_results`表，但数据分析和成本管控页面没有使用

### 解决方案
1. 在`src/db/api.ts`中添加新函数`getScheduleResultsStats`，用于获取租户级别的排班结果统计
2. 在数据分析页面添加"排班数据"Tab，显示排班结果统计
3. 在成本管控页面添加"排班成本数据"卡片，显示排班结果统计

## 修改详情

### 1. 数据库API函数（src/db/api.ts）

#### 新增函数：getScheduleResultsStats

```typescript
/**
 * 获取租户级别的排班结果统计（用于数据分析和成本管控）
 * @param tenantId 租户ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 排班结果统计数据
 */
export async function getScheduleResultsStats(tenantId: string, startDate: string, endDate: string)
```

**功能说明**：
- 从`schedule_results`表查询指定日期范围内的所有排班记录
- 计算统计数据：
  - 总记录数
  - 总营收
  - 总人力成本
  - 平均人力成本率
  - 成本合格数量和合格率
  - 平均上岗人数和排休人数
  - 总兼职工时
  - 效能区间分布（高效区/正常区/低效区）

**返回数据结构**：
```typescript
{
  records: ScheduleResult[],  // 所有排班记录
  stats: {
    total_records: number,           // 总记录数
    total_revenue: number,           // 总营收
    total_labor_cost: number,        // 总人力成本
    avg_labor_cost_rate: number,     // 平均人力成本率
    qualified_count: number,         // 成本合格数量
    qualified_rate: number,          // 成本合格率
    avg_planned_staff: number,       // 平均上岗人数
    avg_rest_staff: number,          // 平均排休人数
    total_part_time_hours: number,   // 总兼职工时
    high_efficiency_count: number,   // 高效区数量
    normal_efficiency_count: number, // 正常区数量
    low_efficiency_count: number     // 低效区数量
  }
}
```

### 2. 数据分析页面（src/pages/analytics/index.tsx）

#### 修改内容

**1. 导入新函数**
```typescript
import {
  getCostDataByTenantId,
  getEmployeesByTenantId,
  getScheduleLogsByTenantId,
  getSchedulesByTenantId,
  getScheduleResultsStats,  // 新增
  getStoresByTenantId
} from '@/db/api'
```

**2. 添加排班统计状态**
```typescript
const [scheduleStats, setScheduleStats] = useState({
  totalRecords: 0,
  totalRevenue: 0,
  totalLaborCost: 0,
  avgLaborCostRate: 0,
  qualifiedCount: 0,
  qualifiedRate: 0,
  avgPlannedStaff: 0,
  avgRestStaff: 0,
  totalPartTimeHours: 0,
  highEfficiencyCount: 0,
  normalEfficiencyCount: 0,
  lowEfficiencyCount: 0
})
```

**3. 修改Tab状态**
```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'cost' | 'schedule'>('overview')
```

**4. 加载排班数据**
```typescript
const [storesData, employeesData, schedulesData, logsData, costDataResult, scheduleResultsData] =
  await Promise.all([
    getStoresByTenantId(currentTenant.id),
    getEmployeesByTenantId(currentTenant.id),
    getSchedulesByTenantId(currentTenant.id),
    getScheduleLogsByTenantId(currentTenant.id, startDate, endDate),
    getCostDataByTenantId(currentTenant.id, startDate, endDate),
    getScheduleResultsStats(currentTenant.id, startDate, endDate)  // 新增
  ])
```

**5. 设置排班统计数据**
```typescript
setScheduleStats({
  totalRecords: scheduleResultsData.stats.total_records,
  totalRevenue: Math.round(scheduleResultsData.stats.total_revenue),
  totalLaborCost: Math.round(scheduleResultsData.stats.total_labor_cost),
  avgLaborCostRate: Math.round(scheduleResultsData.stats.avg_labor_cost_rate * 100) / 100,
  qualifiedCount: scheduleResultsData.stats.qualified_count,
  qualifiedRate: Math.round(scheduleResultsData.stats.qualified_rate * 10) / 10,
  avgPlannedStaff: Math.round(scheduleResultsData.stats.avg_planned_staff * 10) / 10,
  avgRestStaff: Math.round(scheduleResultsData.stats.avg_rest_staff * 10) / 10,
  totalPartTimeHours: Math.round(scheduleResultsData.stats.total_part_time_hours * 10) / 10,
  highEfficiencyCount: scheduleResultsData.stats.high_efficiency_count,
  normalEfficiencyCount: scheduleResultsData.stats.normal_efficiency_count,
  lowEfficiencyCount: scheduleResultsData.stats.low_efficiency_count
})
```

**6. 添加排班数据Tab**

新增了第三个Tab"排班数据"，包含以下卡片：

- **排班概览**：
  - 排班记录数
  - 成本合格数量
  - 成本合格率

- **营收与成本**：
  - 总营收
  - 总人力成本
  - 平均成本率

- **人员配置**：
  - 平均上岗人数
  - 平均排休人数

- **兼职工时**（如果有）：
  - 总兼职工时

- **效能区间分布**：
  - 高效区数量和占比
  - 正常区数量和占比
  - 低效区数量和占比

- **排班优化建议**：
  - 根据成本合格率和效能区间分布提供智能建议

### 3. 成本管控页面（src/pages/cost-control/index.tsx）

#### 修改内容

**1. 导入新函数**
```typescript
import {getCostDataByTenantId, getEmployeesByTenantId, getScheduleResultsStats} from '@/db/api'
```

**2. 添加排班统计状态**
```typescript
const [scheduleStats, setScheduleStats] = useState({
  totalRecords: 0,
  totalRevenue: 0,
  totalLaborCost: 0,
  avgLaborCostRate: 0,
  qualifiedCount: 0,
  qualifiedRate: 0
})
```

**3. 加载排班数据**
```typescript
const [costDataResult, employeesData, scheduleResultsData] = await Promise.all([
  getCostDataByTenantId(currentTenant.id, startDate, endDate),
  getEmployeesByTenantId(currentTenant.id),
  getScheduleResultsStats(currentTenant.id, startDate, endDate)  // 新增
])
```

**4. 设置排班统计数据**
```typescript
setScheduleStats({
  totalRecords: scheduleResultsData.stats.total_records,
  totalRevenue: Math.round(scheduleResultsData.stats.total_revenue),
  totalLaborCost: Math.round(scheduleResultsData.stats.total_labor_cost),
  avgLaborCostRate: Math.round(scheduleResultsData.stats.avg_labor_cost_rate * 100) / 100,
  qualifiedCount: scheduleResultsData.stats.qualified_count,
  qualifiedRate: Math.round(scheduleResultsData.stats.qualified_rate * 10) / 10
})
```

**5. 添加排班成本数据卡片**

在"人员配置"卡片后面添加了"排班成本数据"卡片，包含：

- 排班记录数
- 排班总营收
- 排班总成本
- 平均成本率
- 成本合格率

## 数据流程

### 1. 排班规划 → 排班结果
```
排班规划页面 (schedule-planning)
    ↓ 保存排班
upsertScheduleResult()
    ↓ 写入
schedule_results 表
```

### 2. 排班结果 → 数据分析
```
schedule_results 表
    ↓ 读取
getScheduleResultsStats()
    ↓ 统计
数据分析页面 (analytics)
    ↓ 显示
排班数据 Tab
```

### 3. 排班结果 → 成本管控
```
schedule_results 表
    ↓ 读取
getScheduleResultsStats()
    ↓ 统计
成本管控页面 (cost-control)
    ↓ 显示
排班成本数据卡片
```

## 数据一致性

### 数据来源统一
- **排班规划页面**：写入`schedule_results`表
- **排班日志页面**：读取`schedule_results`表
- **数据分析页面**：读取`schedule_results`表（新增）
- **成本管控页面**：读取`schedule_results`表（新增）
- **今日运营仪表盘**：读取`schedule_results`表

### 数据同步机制
- 所有页面都使用`useDidShow`钩子，在页面显示时自动刷新数据
- 确保数据始终是最新的
- 避免数据不一致的问题

## 视觉设计

### 数据分析页面 - 排班数据Tab

**配色方案**：
- 排班记录数：蓝色（blue-50背景，blue-600文字）
- 成本合格：绿色（green-50背景，green-600文字）
- 合格率：紫色（purple-50背景，purple-600文字）
- 总营收：蓝色（blue-600）
- 总人力成本：红色（red-600）
- 平均成本率：紫色（purple-600）
- 平均上岗人数：蓝色（blue-50背景，blue-600文字）
- 平均排休人数：橙色（orange-50背景，orange-600文字）
- 总兼职工时：琥珀色（amber-50背景，amber-600文字）
- 高效区：绿色（green-600）
- 正常区：黄色（yellow-600）
- 低效区：红色（red-600）

**布局设计**：
- 卡片式布局，清晰的视觉层次
- 圆角设计，柔和的视觉效果
- 阴影效果，增强层次感
- 图标辅助，增强可读性

### 成本管控页面 - 排班成本数据卡片

**配色方案**：
- 排班记录数：蓝色（blue-50背景，blue-600文字）
- 排班总营收：绿色（green-50背景，green-600文字）
- 排班总成本：红色（red-50背景，red-600文字）
- 平均成本率：紫色（purple-50背景，purple-600文字）
- 成本合格率：靛蓝色（indigo-50背景，indigo-600文字）

**布局设计**：
- 与其他卡片保持一致的设计风格
- 使用网格布局，信息紧凑
- 图标辅助，增强可读性

## 智能建议功能

### 数据分析页面 - 排班优化建议

**建议规则**：
1. **成本合格率 < 80%**：
   - 提示：成本合格率较低，建议优化排班策略
   - 图标：红色警告圆圈

2. **低效区占比 > 30%**：
   - 提示：低效区排班占比较高，建议调整人员配置，提高效能
   - 图标：橙色警告圆圈

3. **成本合格率 ≥ 90% 且 高效区占比 > 50%**：
   - 提示：排班质量优秀，成本控制良好，继续保持！
   - 图标：绿色勾选圆圈

4. **通用建议**：
   - 提示：建议成本合格率保持在90%以上，高效区排班占比不低于60%
   - 图标：蓝色信息圆圈

## 测试验证

### 测试场景1：查看数据分析页面的排班数据
1. 打开数据分析页面
2. 点击"排班数据"Tab
3. 查看排班统计数据

**预期结果**：
- ✅ 显示排班记录数
- ✅ 显示成本合格数量和合格率
- ✅ 显示总营收和总人力成本
- ✅ 显示平均成本率
- ✅ 显示平均上岗人数和排休人数
- ✅ 显示兼职工时（如果有）
- ✅ 显示效能区间分布
- ✅ 显示排班优化建议

### 测试场景2：查看成本管控页面的排班数据
1. 打开成本管控页面
2. 滚动到"排班成本数据"卡片
3. 查看排班统计数据

**预期结果**：
- ✅ 显示排班记录数
- ✅ 显示排班总营收
- ✅ 显示排班总成本
- ✅ 显示平均成本率
- ✅ 显示成本合格率

### 测试场景3：数据一致性验证
1. 在排班规划页面保存一个新的排班
2. 打开数据分析页面，查看排班数据Tab
3. 打开成本管控页面，查看排班成本数据卡片
4. 打开排班日志页面，查看排班记录

**预期结果**：
- ✅ 所有页面显示的排班数据一致
- ✅ 排班记录数相同
- ✅ 总营收和总成本相同
- ✅ 平均成本率相同

### 测试场景4：数据刷新验证
1. 打开数据分析页面
2. 切换到其他页面
3. 在排班规划页面保存一个新的排班
4. 返回数据分析页面

**预期结果**：
- ✅ 数据自动刷新
- ✅ 显示最新的排班统计数据

## 修改的文件列表

### 1. 数据库API文件
- `src/db/api.ts` - 添加`getScheduleResultsStats`函数

### 2. 页面文件
- `src/pages/analytics/index.tsx` - 添加排班数据Tab
- `src/pages/cost-control/index.tsx` - 添加排班成本数据卡片

### 3. 文档文件
- `SCHEDULE_DATA_INTEGRATION.md` - 本文档

## 优势总结

### 1. 数据一致性
- ✅ 所有页面使用相同的数据源（`schedule_results`表）
- ✅ 避免数据不一致的问题
- ✅ 确保数据的准确性和可靠性

### 2. 功能完整性
- ✅ 数据分析页面现在包含排班数据
- ✅ 成本管控页面现在包含排班成本数据
- ✅ 所有页面都能查看排班相关的统计信息

### 3. 用户体验
- ✅ 数据自动刷新，无需手动操作
- ✅ 视觉设计统一，易于理解
- ✅ 智能建议功能，帮助用户优化排班

### 4. 可维护性
- ✅ 代码结构清晰，易于维护
- ✅ 数据流程简单，易于理解
- ✅ 统一的数据访问接口

## 下一步建议

### 1. 数据导出功能（可选）
如果需要导出排班数据，可以考虑：
- 在数据分析页面添加导出按钮
- 支持导出Excel/PDF格式
- 包含排班统计数据和详细记录

### 2. 数据可视化（可选）
如果需要更直观的数据展示，可以考虑：
- 添加图表展示排班趋势
- 添加饼图展示效能区间分布
- 添加折线图展示成本变化趋势

### 3. 数据对比功能（可选）
如果需要对比不同时间段的数据，可以考虑：
- 添加日期范围选择器
- 支持对比不同时间段的排班数据
- 显示数据变化趋势和百分比

## 总结

本次修改成功地将排班数据集成到数据分析和成本管控页面，实现了以下目标：

1. ✅ 数据分析页面添加了"排班数据"Tab，显示完整的排班统计信息
2. ✅ 成本管控页面添加了"排班成本数据"卡片，显示排班成本统计
3. ✅ 所有页面使用统一的数据源（`schedule_results`表）
4. ✅ 数据自动刷新，确保数据一致性
5. ✅ 视觉设计统一，用户体验良好
6. ✅ 智能建议功能，帮助用户优化排班
7. ✅ 代码通过lint检查，质量有保障

现在，用户可以在数据分析和成本管控页面查看真实的排班数据，所有数据都来自`schedule_results`表，确保了数据的一致性和准确性。

---

**修改完成时间**：2025-11-06
**代码检查状态**：✅ 通过
**测试状态**：待用户验收
