# 排班功能调试指南

## 问题描述
用户反馈以下问题：
1. 首页一直显示"暂无排班数据"
2. 排班日志没有同步排班记录及信息
3. 排班规划完成后没有生成排班结果表

## 已添加的调试日志

### 1. 排班结果保存（upsertScheduleResult）
**位置**: `src/db/api.ts` 第1425-1451行

**日志输出**:
```
=== upsertScheduleResult 开始 ===
输入数据: {tenant_id, store_id, operation_date, ...}
保存排班结果失败: {error}  // 如果失败
错误详情: {message, details, hint, code}  // 如果失败
=== upsertScheduleResult 成功 ===
返回数据: {id, tenant_id, ...}  // 如果成功
```

### 2. 排班任务创建（createSchedule）
**位置**: `src/db/api.ts` 第383-422行

**日志输出**:
```
=== createSchedule 开始 ===
输入数据: {tenant_id, store_id, employee_id, schedule_date, ...}
创建排班失败: {error}  // 如果失败
错误详情: {message, details, hint, code}  // 如果失败
=== createSchedule 成功 ===
返回数据: {id, tenant_id, ...}  // 如果成功
```

### 3. 排班日志创建（createScheduleLog）
**位置**: `src/db/api.ts` 第486-521行

**日志输出**:
```
=== createScheduleLog 开始 ===
输入数据: {tenant_id, schedule_id, employee_id, log_date, ...}
创建排班日志失败: {error}  // 如果失败
错误详情: {message, details, hint, code}  // 如果失败
=== createScheduleLog 成功 ===
返回数据: {id, tenant_id, ...}  // 如果成功
```

### 4. 排班结果加载（loadScheduleResult）
**位置**: `src/pages/schedule-planning/index.tsx` 第140-222行

**日志输出**:
```
=== loadScheduleResult 开始 ===
{tenantId, storeId, date}
=== 查询到的排班结果 ===
{result}
=== 员工和兼职数据 ===
{员工数, 兼职数}
=== 排班记录 ===
[{employee_id}, ...]
=== 上岗员工 ===
{上岗员工数, 上岗员工: [name1, name2, ...]}
=== 成本计算 ===
{正式员工成本, 兼职成本, 总成本}
=== 设置排班结果到state ===
{fullResult}
=== 没有找到排班结果 ===  // 如果没有数据
```

### 5. 首页数据加载（getDashboardData）
**位置**: `src/db/api.ts` 第1492-1630行

**日志输出**:
```
=== getDashboardData 开始 ===
租户ID: {tenantId}
门店ID: {storeId}
查询日期范围: {today, firstDay}
获取今日数据失败: {error}  // 如果失败
今日数据查询结果: {data}
获取本月数据失败: {error}  // 如果失败
本月数据查询结果数量: {count}
今日排班结果: {result}
今日计算结果: {revenue, restCount, plannedStaff, laborCost}
本月累计结果: {daysCount, revenue, restCount, plannedStaff}
=== getDashboardData 结束 ===
```

### 6. 保存排班流程（handleSave）
**位置**: `src/pages/schedule-planning/index.tsx` 第250-458行

**日志输出**:
```
=== 开始保存排班规划 ===
缺少必要信息: tenant_id或store_id为空  // 如果失败
用户未填写完整信息  // 如果失败
数值无效: {revenue, staffCount}  // 如果失败
=== 排班结果数据 ===
{上岗员工数, 正式员工成本, 兼职成本, 总人力成本, 人力成本率, 完整数据}
=== 开始保存排班结果到数据库 ===
=== 排班结果保存完成 ===
{result}
=== 排班结果保存失败，返回null ===  // 如果失败
=== 排班结果已更新到state ===
=== 缺少必要信息，无法生成排班结果 ===  // 如果失败
=== 开始创建排班任务和日志 ===
{上岗员工数, 员工列表}
✓ 已为员工 {name} 创建排班任务和日志  // 每个员工
为员工 {name} 创建排班任务失败: {error}  // 如果失败
=== 排班任务和日志创建完成 ===
=== 开始重新加载排班结果 ===
=== 排班结果加载完成 ===
=== 触发首页数据刷新事件 ===
{date, storeId, tenantId}
=== 事件已触发 ===
保存排班规划时发生异常: {error}  // 如果失败
```

## 调试步骤

### 步骤1: 检查保存排班流程
1. 打开排班规划页面
2. 填写预估营收和计划人数
3. 选择排休员工（可选）
4. 添加兼职排班（可选）
5. 点击"保存排班规划"按钮
6. **打开浏览器控制台**，查看日志输出

**预期日志顺序**:
```
=== 开始保存排班规划 ===
=== 排班结果数据 ===
=== 开始保存排班结果到数据库 ===
=== upsertScheduleResult 开始 ===
输入数据: {...}
=== upsertScheduleResult 成功 ===
返回数据: {...}
=== 排班结果保存完成 ===
=== 排班结果已更新到state ===
=== 开始创建排班任务和日志 ===
=== createSchedule 开始 ===
输入数据: {...}
=== createSchedule 成功 ===
返回数据: {...}
=== createScheduleLog 开始 ===
输入数据: {...}
=== createScheduleLog 成功 ===
返回数据: {...}
✓ 已为员工 xxx 创建排班任务和日志
... (重复每个上岗员工)
=== 排班任务和日志创建完成 ===
=== 开始重新加载排班结果 ===
=== loadScheduleResult 开始 ===
=== 查询到的排班结果 ===
=== 员工和兼职数据 ===
=== 排班记录 ===
=== 上岗员工 ===
=== 成本计算 ===
=== 设置排班结果到state ===
=== 排班结果加载完成 ===
=== 触发首页数据刷新事件 ===
=== 事件已触发 ===
```

### 步骤2: 检查排班结果显示
1. 保存排班后，检查排班规划页面
2. 向下滚动，查找"排班结果"卡片
3. 查找"排班结构表"卡片

**如果没有显示**:
- 检查控制台日志，查找`=== 设置排班结果到state ===`
- 检查`scheduleResult`的值是否为null
- 检查是否有错误日志

### 步骤3: 检查首页数据同步
1. 保存排班后，返回首页
2. 检查"今日运营仪表盘"是否显示数据
3. **打开浏览器控制台**，查看日志输出

**预期日志顺序**:
```
收到排班数据更新事件，重新加载数据
=== getDashboardData 开始 ===
租户ID: xxx
门店ID: xxx
查询日期范围: {today, firstDay}
今日数据查询结果: {...}
本月数据查询结果数量: x
今日排班结果: {...}
今日计算结果: {...}
本月累计结果: {...}
=== getDashboardData 结束 ===
```

**如果显示"暂无排班数据"**:
- 检查`今日数据查询结果`是否为空数组`[]`
- 检查`今日排班结果`是否为`null`
- 检查租户ID和门店ID是否正确

### 步骤4: 检查排班日志
1. 进入"排班日志"页面
2. 选择保存排班的日期
3. 检查是否显示排班日志记录

**如果没有显示**:
- 检查控制台日志，查找`createScheduleLog`相关日志
- 检查是否有错误日志
- 检查`log_date`字段是否正确

## 常见问题排查

### 问题1: 保存排班结果失败
**症状**: 控制台显示`=== 排班结果保存失败，返回null ===`

**可能原因**:
1. **数据库连接问题**: 检查Supabase配置是否正确
2. **数据格式错误**: 检查`错误详情`中的`message`和`hint`
3. **权限问题**: 检查RLS策略是否正确
4. **唯一约束冲突**: 检查是否已存在相同日期的排班结果

**排查步骤**:
1. 检查`.env`文件中的`TARO_APP_SUPABASE_URL`和`TARO_APP_SUPABASE_ANON_KEY`
2. 检查控制台中的`错误详情`日志
3. 检查数据库中的`schedule_results`表是否存在
4. 检查RLS策略是否允许插入数据

### 问题2: 创建排班任务失败
**症状**: 控制台显示`为员工 xxx 创建排班任务失败`

**可能原因**:
1. **外键约束**: `employee_id`、`store_id`或`tenant_id`不存在
2. **数据格式错误**: `schedule_date`格式不正确
3. **权限问题**: RLS策略不允许插入

**排查步骤**:
1. 检查`输入数据`中的所有ID是否有效
2. 检查`schedule_date`格式是否为`YYYY-MM-DD`
3. 检查`错误详情`中的`message`

### 问题3: 创建排班日志失败
**症状**: 控制台显示`创建排班日志失败`

**可能原因**:
1. **外键约束**: `schedule_id`不存在（排班任务创建失败）
2. **数据格式错误**: `log_date`格式不正确
3. **权限问题**: RLS策略不允许插入

**排查步骤**:
1. 检查上一步的`createSchedule`是否成功
2. 检查`schedule_id`是否有效
3. 检查`log_date`格式是否为`YYYY-MM-DD`

### 问题4: 首页显示"暂无排班数据"
**症状**: 首页一直显示"暂无排班数据"

**可能原因**:
1. **数据库中没有数据**: 排班结果保存失败
2. **查询条件错误**: 租户ID或门店ID不匹配
3. **日期不匹配**: 查询的日期与保存的日期不一致

**排查步骤**:
1. 检查`getDashboardData`日志中的`今日数据查询结果`
2. 检查租户ID和门店ID是否与保存时一致
3. 检查`operation_date`是否为今天的日期
4. 直接查询数据库`schedule_results`表，确认数据是否存在

### 问题5: 排班结果表不显示
**症状**: 保存排班后，排班结果表不显示

**可能原因**:
1. **排班结果保存失败**: `scheduleResult`为null
2. **组件渲染条件**: `scheduleResult &&`条件不满足
3. **数据加载失败**: `loadScheduleResult`函数执行失败

**排查步骤**:
1. 检查`loadScheduleResult`日志
2. 检查`=== 设置排班结果到state ===`日志
3. 检查`scheduleResult`的值
4. 检查是否有React渲染错误

## 数据库直接查询

如果日志无法定位问题，可以直接查询数据库：

### 查询排班结果
```sql
SELECT * FROM schedule_results 
WHERE tenant_id = 'xxx' 
  AND store_id = 'xxx' 
  AND operation_date = '2025-11-06'
ORDER BY created_at DESC;
```

### 查询排班任务
```sql
SELECT * FROM schedules 
WHERE tenant_id = 'xxx' 
  AND store_id = 'xxx' 
  AND schedule_date = '2025-11-06'
ORDER BY created_at DESC;
```

### 查询排班日志
```sql
SELECT * FROM schedule_logs 
WHERE tenant_id = 'xxx' 
  AND store_id = 'xxx' 
  AND log_date = '2025-11-06'
ORDER BY created_at DESC;
```

### 查询RLS策略
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('schedule_results', 'schedules', 'schedule_logs');
```

## 错误代码参考

### Supabase错误代码
- `23505`: 唯一约束冲突（UNIQUE constraint violation）
- `23503`: 外键约束冲突（FOREIGN KEY constraint violation）
- `42P01`: 表不存在（relation does not exist）
- `42501`: 权限不足（insufficient privilege）
- `PGRST116`: RLS策略阻止访问（Row Level Security policy violation）

## 联系支持

如果以上步骤无法解决问题，请提供以下信息：
1. 完整的控制台日志（从点击保存到显示结果）
2. 租户ID和门店ID
3. 保存的日期
4. 数据库查询结果（如果可以访问）
5. 错误详情（如果有）

## 修复历史

### 2025-11-06 修复记录
1. ✅ 修复`getEnhancedDashboardData`函数中的字段名错误
   - `schedule_date` → `log_date`
   - `status` → `completion_status`
   - `quality_rating` → `score >= 90`

2. ✅ 修复`loadScheduleResult`函数中的排班记录查询
   - 移除不存在的`is_rest`字段
   - 改为查询有排班记录的员工（上岗员工）

3. ✅ 新增排班结构表功能
   - 显示上岗员工列表
   - 显示排休员工列表
   - 显示兼职排班列表

4. ✅ 添加详细的调试日志
   - `upsertScheduleResult`函数
   - `createSchedule`函数
   - `createScheduleLog`函数
   - `loadScheduleResult`函数
   - `getDashboardData`函数
   - `handleSave`函数

5. ✅ 改进错误处理
   - 保存失败时抛出异常
   - 显示详细的错误信息
   - 记录完整的错误详情

## 下一步

请按照"调试步骤"执行操作，并查看控制台日志。根据日志输出，可以快速定位问题所在。

如果发现任何错误日志，请参考"常见问题排查"部分进行排查。

如果问题仍然存在，请提供完整的控制台日志，以便进一步分析。
