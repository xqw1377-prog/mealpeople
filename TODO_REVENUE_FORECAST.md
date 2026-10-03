# 营业额预估功能开发计划

## 📋 功能概述

开发营收智能预估系统，支持：
- 智能生成月度营收日历
- 分天分餐段营收预估
- 影响因子调整
- 营收优化功能
- 营收确认流程

## ✅ 已完成

- [x] 数据库表结构设计（07_add_revenue_calendar_system.sql）
- [x] 数据库迁移文件修复
- [x] 数据库API层开发（api-revenue-calendar.ts）
- [x] 核心预测算法（prediction.ts）
- [x] 营收预估服务（revenue-forecast.ts）
- [x] 营收预测页面（revenue-prediction/index.tsx）
- [x] 营收详情编辑页面（revenue-detail/index.tsx）
- [x] 路由配置更新
- [x] 错误处理增强
- [x] 自动删除旧日历功能
- [x] 详细日志记录
- [x] 调试指南文档（REVENUE_FORECAST_DEBUG.md）

## 🚀 待开发功能

### 阶段1：数据库API层（优先级：高）✅ 已完成

- [x] 1.1 创建营收日历API
  - [x] `src/db/api-revenue-calendar.ts` - 营收日历CRUD操作
  - [x] 每日营收明细CRUD操作
  - [x] 营收调整记录
  - [x] 影响因子配置

### 阶段2：核心算法实现（优先级：高）✅ 已完成

- [x] 2.1 智能预测算法
  - [x] `src/services/prediction.ts` - 营收预测核心算法
  - [x] `src/services/revenue-forecast.ts` - 营收预估服务

### 阶段3：页面开发（优先级：中）✅ 基本完成

- [x] 3.1 营收日历管理页面
  - [x] `src/pages/revenue-prediction/index.tsx` - 营收预测页面
    - [x] 月份选择器
    - [x] 智能生成功能
    - [x] 月度统计展示
    - [x] 日度营收列表

- [x] 3.2 营收详情编辑页面
  - [x] `src/pages/revenue-detail/index.tsx` - 营收详情
    - [x] 总营收调整
    - [x] 餐段分配编辑
    - [x] 影响因子选择
    - [x] 自动分配功能
    - [x] 保存功能

- [ ] 3.3 影响因子配置页面（已存在但需增强）
  - [ ] `src/pages/impact-factors/index.tsx` - 因子配置
    - [ ] 因子列表
    - [ ] 添加/编辑因子
    - [ ] 影响率设置
    - [ ] 启用/禁用开关

### 阶段4：功能增强（优先级：低）

- [ ] 4.1 营收优化功能
  - [ ] 总营收反向优化
  - [ ] 批量调整功能
  - [ ] 比例关系保持

- [ ] 4.2 数据可视化
  - [ ] 营收趋势图表
  - [ ] 餐段分布图
  - [ ] 历史对比图

- [ ] 4.3 状态管理
  - [ ] 确认营收日历
  - [ ] 锁定营收日历
  - [ ] 状态流转控制

### 阶段5：集成与测试（优先级：低）

- [x] 5.1 路由配置
  - [x] 更新 `src/app.config.ts` 添加新页面路由

- [ ] 5.2 导航集成
  - [ ] 在管理中心添加营收预估入口

- [ ] 5.3 功能测试
  - [ ] 营收日历生成测试
  - [ ] 影响因子应用测试
  - [ ] 营收调整测试
  - [ ] 状态流转测试

- [ ] 5.4 性能优化
  - [ ] 大数据量加载优化
  - [ ] 算法性能优化
  - [ ] 缓存策略

## 📝 技术要点

### 数据结构

```typescript
// 营收日历
interface RevenueCalendar {
  id: string;
  tenant_id: string;
  store_id: string;
  calendar_month: string; // YYYY-MM
  total_revenue_target: number;
  predicted_total_revenue: number;
  status: 'draft' | 'confirmed' | 'locked';
  generated_by: 'auto' | 'manual';
  confirmed_at?: string;
  confirmed_by?: string;
}

// 每日营收明细
interface DailyRevenueDetail {
  id: string;
  calendar_id: string;
  revenue_date: string; // YYYY-MM-DD
  day_of_week: number; // 0-6
  is_weekend: boolean;
  is_holiday: boolean;
  predicted_revenue: number;
  adjusted_revenue: number;
  breakfast_revenue: number;
  lunch_revenue: number;
  dinner_revenue: number;
  other_revenue: number;
  weather_factor?: string;
  event_factor?: string;
  notes?: string;
}

// 影响因子
interface ImpactFactor {
  id: string;
  tenant_id: string;
  store_id: string;
  factor_type: 'weather' | 'holiday' | 'promotion' | 'event';
  factor_name: string;
  factor_value: string;
  impact_rate: number; // 百分比
  description?: string;
  is_active: boolean;
}
```

### 核心算法

```typescript
// 营收预测算法
function predictRevenue(historicalData: HistoricalRevenue[], targetMonth: string): DailyRevenueDetail[] {
  // 1. 数据预处理
  // 2. 周期性分析
  // 3. 按天预测
  // 4. 按餐段分配
  // 5. 返回预测结果
}

// 影响因子应用
function applyImpactFactors(baseRevenue: number, factors: ImpactFactor[]): number {
  const totalImpactRate = factors.reduce((sum, factor) => sum + factor.impact_rate, 0);
  return baseRevenue * (1 + totalImpactRate / 100);
}

// 营收优化
function optimizeRevenue(
  dailyDetails: DailyRevenueDetail[],
  newTotalTarget: number
): DailyRevenueDetail[] {
  const currentTotal = dailyDetails.reduce((sum, d) => sum + d.adjusted_revenue, 0);
  const ratio = newTotalTarget / currentTotal;
  return dailyDetails.map(d => ({
    ...d,
    adjusted_revenue: d.adjusted_revenue * ratio
  }));
}
```

## 🎨 UI设计要点

### 配色方案
- 主色调：微信品牌蓝色 `bg-primary`
- 成功状态：绿色 `bg-green-500`
- 警告状态：橙色 `bg-orange-500`
- 草稿状态：灰色 `bg-gray-400`

### 交互设计
- 日历视图：点击日期查看/编辑详情
- 营收输入：支持键盘输入和滑块调整
- 因子选择：多选下拉框
- 状态切换：明确的确认对话框

### 响应式设计
- 移动端优先
- 日历视图自适应
- 图表自动缩放

## 📅 开发时间估算

- 阶段1：数据库API层 - 1天
- 阶段2：核心算法实现 - 2天
- 阶段3：页面开发 - 3天
- 阶段4：UI组件开发 - 2天
- 阶段5：集成与测试 - 1天

**总计：9天**

## 🔗 相关文档

- 需求文档：`docs/v2.0-intelligent-systems-design.md`
- 数据库设计：`supabase/migrations/v2/07_add_revenue_calendar_system.sql`
- 快速入门：`docs/快速入门指南.md`

---

**最后更新**：2025-11-12  
**当前状态**：规划中
