# 营收-效能矩阵管控系统开发计划

## 📋 需求概述

实现基于营收-效能矩阵的标准化管理系统，包括：
1. 效能标准配置（支持按店铺配置）
2. 排班规划工具（预估营收 → 查表 → 计算工时）
3. 营业中调整工具（动态切换标准）
4. 营业后复盘工具（区间考核）
5. 排班与复盘速查表

## 🎯 核心概念

### 营收区间
- **低营收区**：< ¥10,000，标准700元/人/日，口令：严控成本，生存第一
- **正常营收区**：¥10,000 ~ ¥18,000，标准850元/人/日，口令：精益运营，效率为王
- **高营收区**：≥ ¥18,000，标准1000元/人/日，口令：保障效能，利润冲刺

### 管理流程
1. **排班规划**：预估营收 → 查表 → 计算目标工时
2. **营业中调整**：实时预估 → 动态切换标准 → 调整排班
3. **营业后复盘**：实际数据 → 对比标准 → 评价结果

## 📝 开发任务

### 阶段1: 数据库设计 ✅
- [x] 1.1 设计效能标准配置表
- [x] 1.2 创建数据库迁移文件
- [x] 1.3 添加测试数据

### 阶段2: 效能标准配置 ✅
- [x] 2.1 创建效能标准配置页面
- [x] 2.2 实现配置表单
- [x] 2.3 支持按店铺配置
- [x] 2.4 实现配置的增删改查

### 阶段3: 排班规划工具 ✅
- [x] 3.1 创建排班规划页面
- [x] 3.2 实现预估营收输入
- [x] 3.3 实现自动查表和计算
- [x] 3.4 显示目标工时和排班建议

### 阶段4: 营业中调整工具 ✅
- [x] 4.1 创建营业调整页面
- [x] 4.2 实现实时营收更新
- [x] 4.3 实现动态标准切换
- [x] 4.4 提供调整建议

### 阶段5: 营业后复盘工具 ✅
- [x] 5.1 创建复盘页面
- [x] 5.2 实现实际数据录入
- [x] 5.3 实现自动计算和对比
- [x] 5.4 显示评价结果

### 阶段6: 速查表 ✅
- [x] 6.1 创建速查表页面
- [x] 6.2 实现快速查询功能
- [x] 6.3 支持导出速查表

### 阶段7: 集成和优化 ✅
- [x] 7.1 在管理中心添加入口
- [x] 7.2 更新路由配置
- [x] 7.3 代码检查和优化
- [x] 7.4 更新文档

## 📊 数据库设计

### efficiency_standards 表（效能标准配置）
```sql
CREATE TABLE efficiency_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID REFERENCES stores(id),  -- NULL表示租户级别的默认配置
  
  -- 低营收区配置
  low_revenue_max DECIMAL(10,2) DEFAULT 10000,  -- 上限（不含）
  low_efficiency_standard DECIMAL(10,2) DEFAULT 700,  -- 人均营收标准
  low_management_motto TEXT DEFAULT '严控成本，生存第一',
  
  -- 正常营收区配置
  normal_revenue_min DECIMAL(10,2) DEFAULT 10000,  -- 下限（含）
  normal_revenue_max DECIMAL(10,2) DEFAULT 18000,  -- 上限（不含）
  normal_efficiency_standard DECIMAL(10,2) DEFAULT 850,
  normal_management_motto TEXT DEFAULT '精益运营，效率为王',
  
  -- 高营收区配置
  high_revenue_min DECIMAL(10,2) DEFAULT 18000,  -- 下限（含）
  high_efficiency_standard DECIMAL(10,2) DEFAULT 1000,
  high_management_motto TEXT DEFAULT '保障效能，利润冲刺',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### daily_operations 表（每日运营记录）
```sql
CREATE TABLE daily_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  operation_date DATE NOT NULL,
  
  -- 排班规划阶段
  estimated_revenue DECIMAL(10,2),  -- 预估营收
  planned_work_hours DECIMAL(10,2),  -- 计划工时
  
  -- 营业中调整阶段
  midday_estimated_revenue DECIMAL(10,2),  -- 午市后预估营收
  adjusted_work_hours DECIMAL(10,2),  -- 调整后工时
  
  -- 营业后复盘阶段
  actual_revenue DECIMAL(10,2),  -- 实际营收
  actual_work_hours DECIMAL(10,2),  -- 实际工时
  per_capita_revenue DECIMAL(10,2),  -- 人均营收
  efficiency_rating TEXT,  -- 评价结果（优秀/合格/未达标）
  
  notes TEXT,  -- 备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, store_id, operation_date)
);
```

## 🎨 页面设计

### 1. 效能标准配置页面
- 店铺选择（或租户默认）
- 三个营收区间的配置表单
- 保存和重置按钮

### 2. 排班规划页面
- 店铺选择
- 日期选择
- 预估营收输入
- 自动显示：所属区间、效能标准、目标工时
- 排班建议

### 3. 营业调整页面
- 店铺选择
- 日期选择
- 显示早班预估和计划工时
- 午市后预估营收输入
- 自动显示：新区间、新标准、新目标工时
- 调整建议

### 4. 营业复盘页面
- 店铺选择
- 日期选择
- 实际营收和工时输入
- 自动显示：所属区间、效能标准、人均营收、评价结果

### 5. 速查表页面
- 店铺选择
- 显示不同营收对应的区间、标准、目标工时
- 支持导出

## 📌 注意事项

1. 所有配置支持按店铺独立设置
2. 营收临界点遵循"含上不含下"原则
3. 计算结果保留1位小数
4. 提供清晰的视觉反馈和操作指引
5. 支持历史数据查询和统计
