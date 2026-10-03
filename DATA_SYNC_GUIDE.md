# 排班规划与首页数据同步说明

## 数据同步机制

### 数据流程

```
排班规划页面 → schedule_results表 → 首页仪表盘
```

### 详细说明

1. **排班规划页面保存数据**
   - 用户在"排班规划"页面填写：
     - 预计营收
     - 计划上班人数
     - 兼职工时（可选）
   - 点击"保存排班规划"按钮
   - 数据保存到`schedule_results`表

2. **首页读取数据**
   - 首页"今日运营仪表盘"从`schedule_results`表读取数据
   - 显示内容包括：
     - 当日营收
     - 当日排休人数
     - 当日人效
     - 当日人力成本
     - 千元贡献
     - 成本率

3. **数据同步时机**
   - 排班规划保存成功后，数据立即写入数据库
   - 首页在以下情况会重新加载数据：
     - 页面首次加载
     - 页面重新显示（从其他页面返回）
     - 用户手动下拉刷新

## 测试数据同步

### 测试步骤

#### 步骤1：查看首页初始状态

1. 打开小程序，进入首页
2. 查看"今日运营仪表盘"的数据
3. 记录当前显示的数值：
   - 当日营收：_______
   - 当日排休：_______
   - 当日人效：_______

#### 步骤2：创建排班规划

1. 从首页点击"排班规划"快捷操作
2. 或从底部导航进入"排班"页面
3. 填写排班信息：
   - 选择店铺：选择任意店铺
   - 选择日期：选择今天的日期
   - 预计营收：输入 10000
   - 计划上班人数：输入 5
4. 点击"保存排班规划"按钮
5. 等待提示"保存成功"

#### 步骤3：验证首页数据更新

1. 返回首页（点击底部导航的"首页"）
2. 查看"今日运营仪表盘"的数据
3. 验证数据是否已更新：
   - 当日营收应该显示：¥10000
   - 当日人效应该显示：10000 ÷ 5 = 2000
   - 其他相关数据也应该更新

#### 步骤4：修改排班规划

1. 再次进入"排班规划"页面
2. 选择相同的店铺和日期
3. 修改数据：
   - 预计营收：改为 15000
   - 计划上班人数：改为 6
4. 点击"保存排班规划"
5. 返回首页

#### 步骤5：验证数据再次更新

1. 查看首页数据
2. 验证：
   - 当日营收应该显示：¥15000
   - 当日人效应该显示：15000 ÷ 6 = 2500

### 预期结果

- ✅ 排班规划保存后，首页数据应该立即可见（返回首页时自动刷新）
- ✅ 修改排班规划后，首页数据应该更新为最新值
- ✅ 本月累计数据应该包含所有已保存的排班记录

## 调试数据同步问题

### 查看控制台日志

打开浏览器控制台（F12），查看以下日志：

#### 1. 排班规划保存日志

```
=== 开始保存排班规划 ===
保存运营数据: { tenant_id: "xxx", store_id: "yyy", operation_date: "2025-11-06", ... }
保存成功
```

#### 2. 首页数据加载日志

```
=== getDashboardData 开始 ===
租户ID: xxx-xxx-xxx
查询日期范围: { today: "2025-11-06", firstDay: "2025-11-01" }
今日数据查询结果: [{ id: "...", estimated_revenue: 10000, ... }]
本月数据查询结果数量: 5
今日排班结果: { id: "...", estimated_revenue: 10000, planned_staff_count: 5, ... }
今日计算结果: { revenue: 10000, restCount: 2, plannedStaff: 5, laborCost: 833.33 }
本月累计结果: { daysCount: 5, revenue: 50000, restCount: 10, plannedStaff: 25 }
=== getDashboardData 结束 ===
```

### 常见问题排查

#### 问题1：首页数据没有更新

**可能原因：**
- 排班规划保存失败
- 选择的日期不是今天
- 页面没有重新加载数据

**排查步骤：**
1. 检查控制台是否有"保存成功"提示
2. 确认排班规划选择的日期是今天
3. 尝试手动刷新首页（下拉刷新）
4. 查看控制台日志，确认数据查询是否成功

#### 问题2：数据显示为0或空

**可能原因：**
- 没有为今天创建排班规划
- 数据库查询失败
- 租户ID不匹配

**排查步骤：**
1. 确认已经为今天创建了排班规划
2. 查看控制台日志中的"今日数据查询结果"
3. 如果查询结果为空数组`[]`，说明数据库中没有今天的记录
4. 检查租户ID是否正确

#### 问题3：累计数据不准确

**可能原因：**
- 本月有多条记录但计算错误
- 日期范围查询有问题

**排查步骤：**
1. 查看控制台日志中的"本月数据查询结果数量"
2. 检查"查询日期范围"是否正确
3. 验证累计数据的计算逻辑

## 数据表结构

### schedule_results 表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | uuid | 主键 |
| tenant_id | uuid | 租户ID |
| store_id | uuid | 店铺ID |
| operation_date | date | 运营日期 |
| estimated_revenue | numeric | 预计营收 |
| target_staff_count | integer | 目标人数 |
| planned_staff_count | integer | 计划上班人数 |
| rest_staff_count | integer | 排休人数 |
| part_time_count | integer | 兼职人数 |
| part_time_hours | numeric | 兼职工时 |
| achievement_rate | numeric | 达成率 |
| total_labor_cost | numeric | 总人力成本 |
| labor_cost_rate | numeric | 人力成本率 |
| is_cost_qualified | boolean | 成本是否合格 |
| efficiency_zone | text | 效能区间 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### 唯一约束

```sql
UNIQUE(tenant_id, store_id, operation_date)
```

这意味着：
- 每个租户的每个店铺在每一天只能有一条排班记录
- 如果重复保存同一天的排班，会更新现有记录而不是创建新记录

## 数据计算公式

### 首页显示的计算公式

1. **当日营收**
   ```
   estimated_revenue
   ```

2. **当日排休人数**
   ```
   rest_staff_count
   ```

3. **当日人效**
   ```
   estimated_revenue ÷ planned_staff_count
   ```

4. **当日人力成本**
   ```
   total_labor_cost
   ```

5. **千元贡献**
   ```
   (estimated_revenue ÷ total_labor_cost) × 1000
   ```

6. **成本率**
   ```
   (total_labor_cost ÷ estimated_revenue) × 100%
   ```

### 本月累计计算

- 累计营收 = 本月所有记录的 estimated_revenue 之和
- 累计排休 = 本月所有记录的 rest_staff_count 之和
- 累计人效 = 累计营收 ÷ 累计计划上班人数
- 累计人力成本 = 本月所有记录的 total_labor_cost 之和
- 累计千元贡献 = (累计营收 ÷ 累计人力成本) × 1000
- 累计成本率 = (累计人力成本 ÷ 累计营收) × 100%

## 数据同步最佳实践

### 1. 及时保存排班规划

- 建议每天早上或前一天晚上完成排班规划
- 确保数据及时保存到数据库

### 2. 定期检查数据

- 每天查看首页仪表盘，确认数据正确
- 如发现异常，及时检查排班规划

### 3. 使用刷新功能

- 如果怀疑数据不是最新的，可以下拉刷新首页
- 刷新会重新从数据库加载最新数据

### 4. 多店铺管理

- 如果有多个店铺，首页显示的是所有店铺的汇总数据
- 每个店铺需要单独创建排班规划

## 技术实现细节

### 数据保存（排班规划页面）

```typescript
// 保存到 schedule_results 表
await upsertScheduleResult({
  tenant_id: currentTenant.id,
  store_id: stores[selectedStoreIndex].id,
  operation_date: selectedDate,
  estimated_revenue: revenue,
  planned_staff_count: staffCount,
  rest_staff_count: restStaffCount,
  // ... 其他字段
})
```

### 数据读取（首页）

```typescript
// 查询今日数据
const {data: todayData} = await supabase
  .from('schedule_results')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('operation_date', todayStr)

// 查询本月累计数据
const {data: monthData} = await supabase
  .from('schedule_results')
  .select('*')
  .eq('tenant_id', tenantId)
  .gte('operation_date', firstDayStr)
  .lte('operation_date', todayStr)
```

### 自动刷新机制

```typescript
// 首页使用 useDidShow 钩子
useDidShow(() => {
  loadData() // 页面显示时自动加载数据
})
```

## 总结

排班规划与首页数据是完全同步的，因为它们使用同一个数据表（`schedule_results`）。只要排班规划保存成功，首页就能读取到最新数据。如果遇到数据不同步的问题，请按照本文档的调试步骤进行排查。
