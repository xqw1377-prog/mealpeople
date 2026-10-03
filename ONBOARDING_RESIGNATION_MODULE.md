# 员工入职和离职管理模块开发文档

## 模块概述

本模块为餐时间日人力成本管控助手系统新增了完整的员工入职流程管理和离职管理功能，提升了人力资源管理的完整性和规范性。

## 已完成功能

### 1. 数据库设计 ✅

#### 1.1 入职管理相关表
- **employee_onboarding**: 员工入职申请表
  - 包含基本信息、入职信息、审批状态等字段
  - 支持待审批、已通过、已拒绝、已完成四种状态
  
- **onboarding_documents**: 入职资料表
  - 支持身份证、学历证明、健康证等多种资料类型
  - 记录文件URL和上传时间
  
- **probation_evaluation**: 试用期评估表
  - 包含工作态度、工作能力、团队协作等多维度评分
  - 支持评估内容和改进建议
  
- **regularization_application**: 转正申请表
  - 包含自我评价和工作总结
  - 支持审批流程和转正日期记录

#### 1.2 离职管理相关表
- **employee_resignation**: 员工离职申请表
  - 支持主动离职、被动离职、合同到期三种类型
  - 记录离职原因、离职日期、最后工作日
  
- **resignation_handover**: 离职交接表
  - 记录交接事项、交接人、交接状态
  - 支持待交接、进行中、已完成三种状态
  
- **exit_interview**: 离职面谈表
  - 包含满意度评分、详细离职原因
  - 记录对公司的反馈和改进建议

### 2. API接口开发 ✅

#### 2.1 入职管理API（src/db/modules/onboarding.ts）
- `createOnboarding`: 创建入职申请
- `getOnboardingsByTenant`: 查询租户的入职申请列表
- `getOnboardingsByStore`: 查询门店的入职申请列表
- `getOnboardingById`: 查询入职申请详情
- `approveOnboarding`: 审批入职申请
- `completeOnboarding`: 完成入职流程
- `createOnboardingDocument`: 上传入职资料
- `getOnboardingDocuments`: 查询入职资料列表
- `deleteOnboardingDocument`: 删除入职资料
- `createProbationEvaluation`: 创建试用期评估
- `getProbationEvaluations`: 查询试用期评估列表
- `createRegularization`: 创建转正申请
- `getRegularizationsByTenant`: 查询转正申请列表
- `approveRegularization`: 审批转正申请

#### 2.2 离职管理API（src/db/modules/resignation.ts）
- `createResignation`: 创建离职申请
- `getResignationsByTenant`: 查询租户的离职申请列表
- `getResignationsByStore`: 查询门店的离职申请列表
- `getResignationById`: 查询离职申请详情
- `approveResignation`: 审批离职申请
- `completeResignation`: 完成离职流程
- `updateEmployeeStatusToResigned`: 更新员工状态为离职
- `createHandover`: 创建离职交接
- `getHandoversByResignation`: 查询离职交接列表
- `updateHandoverStatus`: 更新交接状态
- `deleteHandover`: 删除离职交接
- `createExitInterview`: 创建离职面谈
- `getExitInterviewByResignation`: 查询离职面谈
- `updateExitInterview`: 更新离职面谈

### 3. 前端页面开发 ✅

#### 3.1 入职管理页面
- **入职申请列表页面**（src/packageH/pages/onboarding-list/index.tsx）
  - 显示所有入职申请
  - 支持按状态筛选（全部、待审批、已通过、已拒绝、已完成）
  - 显示申请人基本信息、岗位信息、入职日期等
  - 支持查看详情和快速审批操作
  - 实时数据刷新

#### 3.2 离职管理页面
- **离职申请列表页面**（src/packageH/pages/resignation-list/index.tsx）
  - 显示所有离职申请
  - 支持按状态筛选（全部、待审批、已通过、已拒绝、已完成）
  - 显示离职类型、离职原因、离职日期等
  - 支持查看详情和快速审批操作
  - 实时数据刷新

#### 3.3 入口集成
- 在员工管理页面（src/packageA/pages/employees/index.tsx）添加了入职和离职管理的快捷入口按钮
- 使用醒目的颜色区分：入职（绿色）、离职（橙色）

### 4. 路由配置 ✅

在 `src/app.config.ts` 中新增 packageH 分包：
```typescript
{
  root: 'packageH',
  name: 'onboarding-resignation',
  pages: [
    'pages/onboarding-list/index',
    'pages/resignation-list/index'
  ]
}
```

## 技术特点

### 1. 数据安全
- 所有表启用了 Row Level Security (RLS)
- 管理员拥有完整的数据访问权限
- 使用 Supabase 的安全策略保护敏感数据

### 2. 用户体验
- 清晰的状态标识（颜色编码）
- 实时数据刷新
- 友好的空状态提示
- 快速审批操作
- 响应式设计

### 3. 代码质量
- TypeScript 类型安全
- 模块化设计
- 统一的 API 导出
- 完善的错误处理
- 代码注释清晰

## 使用指南

### 入职管理流程
1. 管理员在员工管理页面点击"📝 入职"按钮
2. 进入入职申请列表页面
3. 点击"新建申请"创建入职申请（待开发）
4. 查看申请列表，可按状态筛选
5. 点击"通过"或"拒绝"进行审批
6. 点击"查看详情"查看完整信息（待开发）

### 离职管理流程
1. 管理员在员工管理页面点击"👋 离职"按钮
2. 进入离职申请列表页面
3. 点击"新建申请"创建离职申请（待开发）
4. 查看申请列表，可按状态筛选
5. 点击"通过"或"拒绝"进行审批
6. 点击"查看详情"查看完整信息（待开发）

## 待完善功能

### 高优先级
1. 入职申请表单页面（创建新申请）
2. 离职申请表单页面（创建新申请）
3. 入职申请详情页面（查看完整信息）
4. 离职申请详情页面（查看完整信息）

### 中优先级
1. 试用期管理页面
2. 转正申请管理页面
3. 离职交接管理页面
4. 离职面谈管理页面

### 低优先级
1. 数据统计和报表
2. 批量操作功能
3. 导出功能
4. 消息通知功能

## 文件清单

### 数据库迁移
- `supabase/migrations/*_create_employee_onboarding_and_resignation_tables_fixed.sql`

### 类型定义
- `src/db/types.ts` (新增入职和离职相关类型)

### API模块
- `src/db/modules/onboarding.ts` (入职管理API)
- `src/db/modules/resignation.ts` (离职管理API)
- `src/db/api.ts` (统一导出)

### 前端页面
- `src/packageH/pages/onboarding-list/index.tsx`
- `src/packageH/pages/onboarding-list/index.config.ts`
- `src/packageH/pages/resignation-list/index.tsx`
- `src/packageH/pages/resignation-list/index.config.ts`

### 配置文件
- `src/app.config.ts` (新增 packageH 分包配置)

### 修改的文件
- `src/packageA/pages/employees/index.tsx` (添加入口按钮)

## 总结

本次开发完成了员工入职和离职管理模块的核心功能，包括：
- ✅ 完整的数据库表结构设计（7张表）
- ✅ 全面的API接口开发（30+个函数）
- ✅ 核心前端页面开发（2个列表页面）
- ✅ 路由配置和入口集成

系统现在具备了基本的入职和离职申请管理能力，管理员可以查看、筛选和审批申请。后续可以根据实际需求继续完善表单页面、详情页面和其他高级功能。
