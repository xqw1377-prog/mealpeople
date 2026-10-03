# 综合开发任务清单

## 任务概述

本文档包含三个主要开发任务：
1. 修复营收日历创建失败问题
2. 重新设计数据分析模块
3. 完善员工信息收集设计

---

## 任务1：修复营收日历创建失败问题

### 问题分析

#### 根本原因
数据库RLS（行级安全）策略过于严格，导致创建营收日历时权限不足。

#### 具体问题
1. 原有策略要求用户必须是 `tenant_admin` 或 `store_manager` 角色
2. 策略中的权限判断逻辑不够灵活
3. 缺少超级管理员的完整权限支持
4. 店经理的权限判断不够准确

### 解决方案

#### ✅ 已完成
- [x] 分析RLS策略问题
- [x] 创建新的迁移文件 `08_fix_revenue_calendar_rls.sql`
- [x] 优化RLS策略，添加以下改进：
  - 超级管理员拥有所有表的完整权限
  - 租户管理员可以管理本租户的所有数据
  - 店经理可以管理所属门店的数据（通过 `stores.manager_id` 判断）
  - 普通员工只能查看本租户的数据
- [x] 在服务层添加自动删除旧日历的逻辑
- [x] 增强错误日志记录

#### 🔄 待执行
- [ ] 应用新的数据库迁移
- [ ] 测试创建营收日历功能
- [ ] 验证不同角色的权限是否正确

### 测试步骤

1. **应用数据库迁移**
   ```bash
   # 在Supabase控制台执行
   # 文件: supabase/migrations/v2/08_fix_revenue_calendar_rls.sql
   ```

2. **测试超级管理员权限**
   - 登录超级管理员账号
   - 尝试创建营收日历
   - 验证是否成功

3. **测试租户管理员权限**
   - 登录租户管理员账号
   - 尝试创建本租户的营收日历
   - 验证是否成功

4. **测试店经理权限**
   - 登录店经理账号
   - 尝试创建所属门店的营收日历
   - 验证是否成功

5. **测试普通员工权限**
   - 登录普通员工账号
   - 尝试创建营收日历（应该失败）
   - 尝试查看营收日历（应该成功）

---

## 任务2：重新设计数据分析模块

### 设计目标

根据2.0版本功能规划，数据分析模块需要从"基础统计报表"升级到"智能洞察建议"，提升决策效率60%。

### 核心功能

#### 2.1 效率分析
- **人效趋势分析**：展示人效的时间趋势（日、周、月）
- **时段效率对比**：对比不同时段的人效表现
- **岗位效率评估**：分析不同岗位的效率差异
- **团队协作效率**：评估团队整体协作效率

#### 2.2 成本分析
- **人力成本结构**：展示人力成本的构成（工资、社保、福利等）
- **成本趋势预测**：基于历史数据预测未来成本趋势
- **成本优化空间**：识别成本优化的机会点
- **ROI分析**：计算人力投入的投资回报率

#### 2.3 人员分析
- **员工绩效评估**：基于多维度数据评估员工绩效
- **技能缺口分析**：识别团队技能短板
- **培训需求识别**：根据绩效数据识别培训需求
- **流失风险预警**：预测员工流失风险

#### 2.4 智能洞察
- **自动发现问题**：AI自动识别数据中的异常和问题
- **生成优化建议**：基于数据分析生成可执行的优化建议
- **预测潜在收益**：量化优化建议的预期收益
- **可视化展示**：直观的图表和数据可视化

### 数据库设计

#### 2.5 新增表结构

```sql
-- 数据分析报告表
CREATE TABLE data_analysis_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  store_id uuid REFERENCES stores(id),
  report_type text NOT NULL, -- 'efficiency', 'cost', 'personnel', 'insight'
  report_period text NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  start_date date NOT NULL,
  end_date date NOT NULL,
  report_data jsonb NOT NULL, -- 报告数据（JSON格式）
  insights jsonb, -- 智能洞察（JSON格式）
  recommendations jsonb, -- 优化建议（JSON格式）
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 数据分析指标表
CREATE TABLE analysis_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  store_id uuid REFERENCES stores(id),
  metric_date date NOT NULL,
  metric_type text NOT NULL, -- 'efficiency', 'cost', 'performance'
  metric_name text NOT NULL,
  metric_value numeric(12,2) NOT NULL,
  metric_unit text, -- '元', '人', '%', '元/人'
  comparison_value numeric(12,2), -- 对比值（环比、同比）
  comparison_type text, -- 'mom', 'yoy', 'target'
  created_at timestamptz DEFAULT now()
);

-- 智能洞察记录表
CREATE TABLE intelligent_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  store_id uuid REFERENCES stores(id),
  insight_type text NOT NULL, -- 'opportunity', 'risk', 'trend', 'anomaly'
  insight_title text NOT NULL,
  insight_description text NOT NULL,
  impact_level text NOT NULL, -- 'high', 'medium', 'low'
  potential_value numeric(12,2), -- 潜在价值（元/月）
  confidence_score numeric(3,2), -- 置信度（0-1）
  related_data jsonb, -- 相关数据
  recommendations jsonb, -- 建议措施
  status text DEFAULT 'pending', -- 'pending', 'applied', 'dismissed'
  applied_at timestamptz,
  applied_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
```

### 界面设计

#### 2.6 数据分析主页

```
┌─────────────────────────────────────────────────────┐
│ 📊 数据分析中心                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📈 快速概览                                          │
│ ┌─────────────┬─────────────┬─────────────┐        │
│ │ 本月人效     │ 人力成本     │ 员工绩效     │        │
│ │ ¥850/人     │ ¥84,000     │ 4.2/5.0     │        │
│ │ +5.2% ↑     │ +2.4% ↑     │ +0.3 ↑      │        │
│ └─────────────┴─────────────┴─────────────┘        │
│                                                     │
│ 💡 智能洞察（3条新发现）                             │
│ ┌───────────────────────────────────────────┐      │
│ │ 🔴 高优先级：周末人效显著高于工作日          │      │
│ │    潜在节省：¥3,200/月                      │      │
│ │    【查看详情】 【应用建议】                 │      │
│ ├───────────────────────────────────────────┤      │
│ │ 🟡 中优先级：晚市时段存在人员冗余            │      │
│ │    潜在节省：¥2,800/月                      │      │
│ │    【查看详情】 【应用建议】                 │      │
│ └───────────────────────────────────────────┘      │
│                                                     │
│ 📊 分析报告                                          │
│ ┌─────────┬─────────┬─────────┬─────────┐          │
│ │ 效率分析 │ 成本分析 │ 人员分析 │ 趋势预测 │          │
│ └─────────┴─────────┴─────────┴─────────┘          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 开发任务

#### 🔄 待开发
- [ ] 创建数据库迁移文件（分析相关表）
- [ ] 开发数据分析API层
- [ ] 开发数据分析服务层
- [ ] 实现效率分析功能
- [ ] 实现成本分析功能
- [ ] 实现人员分析功能
- [ ] 实现智能洞察引擎
- [ ] 开发数据分析主页
- [ ] 开发各类分析报告页面
- [ ] 开发数据可视化图表
- [ ] 添加报告导出功能（PDF、Excel）

---

## 任务3：完善员工信息收集设计

### 当前问题

现有的员工管理系统信息收集不够完善，需要扩展员工信息字段，支持更全面的员工管理。

### 设计目标

1. **基础信息完善**：姓名、性别、年龄、联系方式等
2. **岗位信息**：岗位、职级、入职日期、合同类型等
3. **技能信息**：技能标签、技能等级、培训记录等
4. **绩效信息**：绩效评分、考勤记录、奖惩记录等
5. **薪酬信息**：基本工资、绩效工资、社保福利等

### 数据库设计

#### 3.1 扩展员工表

```sql
-- 扩展员工基础信息表
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_card text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_phone text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address text;

-- 员工岗位信息表
CREATE TABLE employee_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  store_id uuid REFERENCES stores(id),
  position_name text NOT NULL, -- 岗位名称
  position_level text, -- 职级
  employment_type text NOT NULL, -- 'full_time', 'part_time', 'intern', 'contract'
  join_date date NOT NULL,
  contract_start_date date,
  contract_end_date date,
  probation_end_date date,
  status text DEFAULT 'active', -- 'active', 'resigned', 'suspended'
  resignation_date date,
  resignation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 员工技能信息表
CREATE TABLE employee_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  skill_level text NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
  skill_category text, -- 'service', 'cooking', 'management', 'technical'
  acquired_date date,
  certification text, -- 证书名称
  certification_date date,
  certification_expiry date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 员工培训记录表
CREATE TABLE employee_trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  training_name text NOT NULL,
  training_type text, -- 'onboarding', 'skill', 'safety', 'management'
  training_date date NOT NULL,
  training_duration numeric(5,2), -- 小时
  trainer text,
  training_result text, -- 'passed', 'failed', 'pending'
  training_score numeric(5,2),
  certificate_issued boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 员工绩效记录表
CREATE TABLE employee_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  store_id uuid REFERENCES stores(id),
  evaluation_period text NOT NULL, -- 'YYYY-MM'
  evaluation_date date NOT NULL,
  evaluator_id uuid REFERENCES profiles(id),
  overall_score numeric(3,2), -- 0-5分
  work_quality_score numeric(3,2),
  work_efficiency_score numeric(3,2),
  teamwork_score numeric(3,2),
  attendance_score numeric(3,2),
  customer_satisfaction_score numeric(3,2),
  strengths text,
  improvements text,
  goals text,
  status text DEFAULT 'draft', -- 'draft', 'submitted', 'approved'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 员工薪酬信息表
CREATE TABLE employee_compensation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  effective_date date NOT NULL,
  base_salary numeric(10,2) NOT NULL,
  performance_salary numeric(10,2) DEFAULT 0,
  allowances numeric(10,2) DEFAULT 0, -- 补贴
  social_insurance numeric(10,2) DEFAULT 0, -- 社保
  housing_fund numeric(10,2) DEFAULT 0, -- 公积金
  other_benefits text, -- 其他福利（JSON）
  payment_method text, -- 'bank_transfer', 'cash', 'other'
  bank_account text,
  bank_name text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 界面设计

#### 3.2 员工信息编辑页面

```
┌─────────────────────────────────────────────────────┐
│ 👤 员工信息编辑                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📋 基础信息                                          │
│ ┌───────────────────────────────────────────┐      │
│ │ 姓名：[张三        ]  性别：[男 ▼]         │      │
│ │ 出生日期：[1995-06-15]  身份证：[***]      │      │
│ │ 手机号：[138****8888]                      │      │
│ │ 紧急联系人：[李四]  电话：[139****9999]    │      │
│ │ 地址：[北京市朝阳区...]                    │      │
│ └───────────────────────────────────────────┘      │
│                                                     │
│ 💼 岗位信息                                          │
│ ┌───────────────────────────────────────────┐      │
│ │ 岗位：[服务员 ▼]  职级：[初级 ▼]           │      │
│ │ 雇佣类型：[全职 ▼]                         │      │
│ │ 入职日期：[2024-01-15]                     │      │
│ │ 合同期限：[2024-01-15] 至 [2026-01-14]     │      │
│ │ 试用期至：[2024-04-15]                     │      │
│ │ 状态：[在职 ▼]                             │      │
│ └───────────────────────────────────────────┘      │
│                                                     │
│ 🎯 技能信息                                          │
│ ┌───────────────────────────────────────────┐      │
│ │ 已有技能：                                  │      │
│ │ • 客户服务（高级）✓ 已认证                 │      │
│ │ • 点餐系统（中级）                         │      │
│ │ • 食品安全（初级）✓ 已认证                 │      │
│ │ 【添加技能】                               │      │
│ └───────────────────────────────────────────┘      │
│                                                     │
│ 💰 薪酬信息                                          │
│ ┌───────────────────────────────────────────┐      │
│ │ 基本工资：[5000]元/月                      │      │
│ │ 绩效工资：[1000]元/月                      │      │
│ │ 补贴：[500]元/月                           │      │
│ │ 社保：[800]元/月                           │      │
│ │ 公积金：[600]元/月                         │      │
│ │ 银行账号：[6222****8888]                   │      │
│ │ 开户行：[中国工商银行]                     │      │
│ └───────────────────────────────────────────┘      │
│                                                     │
│ 【保存】 【取消】                                    │
└─────────────────────────────────────────────────────┘
```

### 开发任务

#### 🔄 待开发
- [ ] 创建数据库迁移文件（员工信息扩展）
- [ ] 更新员工类型定义
- [ ] 开发员工信息API层
- [ ] 开发员工信息编辑页面
- [ ] 实现基础信息编辑
- [ ] 实现岗位信息管理
- [ ] 实现技能信息管理
- [ ] 实现培训记录管理
- [ ] 实现绩效记录管理
- [ ] 实现薪酬信息管理
- [ ] 添加数据验证和权限控制
- [ ] 添加敏感信息加密保护

---

## 开发优先级

### 高优先级（本周完成）
1. ✅ 修复营收日历创建失败问题
2. 应用数据库迁移并测试

### 中优先级（下周完成）
3. 完善员工信息收集设计
4. 开发员工信息管理功能

### 低优先级（后续迭代）
5. 重新设计数据分析模块
6. 开发智能洞察功能

---

## 注意事项

1. **数据安全**：员工薪酬、身份证等敏感信息需要加密存储
2. **权限控制**：不同角色对员工信息的访问权限需要严格控制
3. **数据完整性**：确保数据的完整性和一致性
4. **用户体验**：界面设计要简洁易用，表单验证要友好
5. **性能优化**：大量数据查询需要优化性能
6. **测试覆盖**：每个功能都需要充分测试

---

## 更新日志

- 2025-11-12：创建综合开发任务清单
- 2025-11-12：完成营收日历RLS策略修复
