# 入职管理功能完善计划

## 创建时间
2025-12-09

## 任务概述
完善入职管理中心的子模块功能，重点完善候选人管理、入职流程、培训计划等核心功能。

---

## 当前状态分析

### 已完成的功能
1. ✅ 入职管理中心首页（统计卡片+快捷入口）
2. ✅ 入职办理流程列表页
3. ✅ 入职办理流程详情页
4. ✅ 入职流程步骤表（数据库）
5. ✅ 快捷功能模块入口（16个）

### 待完善的功能
1. ⏳ 候选人管理
   - 候选人列表（已有基础）
   - 候选人详情页（待创建）
   - 添加候选人页（待创建）
   - 编辑候选人页（待创建）

2. ⏳ 入职手册
   - 手册内容展示（待完善）
   - 手册内容编辑（待创建）

3. ⏳ 培训计划
   - 培训计划详情（待完善）
   - 培训进度跟踪（待创建）

4. ⏳ 数据统计
   - 可视化图表（待创建）
   - 数据导出（待创建）

---

## 实施计划

### 第1阶段：候选人管理（优先级：高）

#### 1.1 候选人详情页
**页面路径**：`/packageH/pages/candidate-detail/index.tsx`

**功能需求**：
- 显示候选人基本信息
- 显示应聘职位信息
- 显示面试记录
- 显示Offer信息
- 显示入职进度
- 操作按钮：编辑、删除、发送Offer

**数据来源**：
- `candidates` 表
- `interviews` 表
- `offers` 表
- `onboarding_processes` 表

**UI设计**：
- 顶部：候选人头像+姓名+状态
- 信息卡片：基本信息、联系方式、教育背景、工作经历
- 时间线：面试记录、Offer记录、入职记录
- 底部：操作按钮

#### 1.2 添加候选人页
**页面路径**：`/packageH/pages/candidate-add/index.tsx`

**功能需求**：
- 基本信息表单
- 联系方式表单
- 应聘职位选择
- 简历上传
- 备注信息
- 提交按钮

**表单字段**：
```typescript
interface CandidateForm {
  name: string              // 姓名
  phone: string             // 手机号
  email: string             // 邮箱
  position: string          // 应聘职位
  department: string        // 应聘部门
  education: string         // 学历
  school: string            // 毕业院校
  major: string             // 专业
  work_experience: number   // 工作年限
  expected_salary: number   // 期望薪资
  resume_url: string        // 简历URL
  notes: string             // 备注
}
```

**验证规则**：
- 姓名：必填，2-20字符
- 手机号：必填，11位数字
- 邮箱：必填，邮箱格式
- 职位：必填
- 部门：必填

#### 1.3 编辑候选人页
**页面路径**：`/packageH/pages/candidate-edit/index.tsx`

**功能需求**：
- 加载候选人信息
- 编辑表单（同添加页）
- 保存修改
- 取消编辑

---

### 第2阶段：入职手册（优先级：中）

#### 2.1 入职手册详情页
**页面路径**：`/packageH/pages/onboarding-handbook/index.tsx`（已存在，需完善）

**功能需求**：
- 显示手册目录
- 显示手册内容
- 支持章节跳转
- 支持搜索
- 支持收藏

**内容结构**：
```typescript
interface HandbookChapter {
  id: string
  title: string
  content: string
  order: number
  children?: HandbookChapter[]
}
```

**UI设计**：
- 左侧：目录树
- 右侧：内容展示
- 顶部：搜索框
- 底部：上一章/下一章

#### 2.2 入职手册编辑页（管理员）
**页面路径**：`/packageH/pages/onboarding-handbook-edit/index.tsx`

**功能需求**：
- 章节管理（添加、编辑、删除、排序）
- 富文本编辑器
- 图片上传
- 预览功能
- 保存发布

---

### 第3阶段：培训计划（优先级：中）

#### 3.1 培训计划详情页
**页面路径**：`/packageJ/pages/training-plan-detail/index.tsx`

**功能需求**：
- 显示计划基本信息
- 显示课程列表
- 显示学习进度
- 显示考核记录
- 操作按钮：开始学习、提交作业、查看成绩

**数据结构**：
```typescript
interface TrainingPlan {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  courses: TrainingCourse[]
  progress: number
}

interface TrainingCourse {
  id: string
  name: string
  duration: number
  status: 'not_started' | 'in_progress' | 'completed'
  score?: number
}
```

#### 3.2 培训进度跟踪页
**页面路径**：`/packageJ/pages/training-progress/index.tsx`

**功能需求**：
- 显示所有员工的培训进度
- 筛选功能（部门、状态）
- 进度可视化（进度条、图表）
- 导出功能

---

### 第4阶段：数据统计（优先级：低）

#### 4.1 数据统计页
**页面路径**：`/packageH/pages/onboarding-statistics/index.tsx`

**功能需求**：
- 候选人统计（按状态、按部门）
- 入职统计（按月份、按部门）
- 培训统计（完成率、平均分）
- 图表展示（柱状图、饼图、折线图）
- 数据导出（Excel）

**图表类型**：
- 候选人状态分布（饼图）
- 月度入职趋势（折线图）
- 部门入职人数（柱状图）
- 培训完成率（进度条）

---

## 数据库设计

### 候选人表（已存在）
```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  position VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  education VARCHAR(50),
  school VARCHAR(100),
  major VARCHAR(100),
  work_experience INTEGER,
  expected_salary INTEGER,
  resume_url TEXT,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 入职手册表（待创建）
```sql
CREATE TABLE onboarding_handbook_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parent_id UUID REFERENCES onboarding_handbook_chapters(id),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  order_num INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 培训计划表（待创建）
```sql
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE training_plan_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES training_plans(id),
  course_id UUID NOT NULL REFERENCES training_courses(id),
  order_num INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE training_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  course_id UUID NOT NULL REFERENCES training_courses(id),
  status VARCHAR(50) NOT NULL,
  progress INTEGER DEFAULT 0,
  score INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 实施步骤

### 步骤1：创建候选人详情页（2小时）
- [ ] 创建页面文件
- [ ] 实现数据加载
- [ ] 实现UI布局
- [ ] 实现操作功能
- [ ] 测试功能

### 步骤2：创建添加候选人页（2小时）
- [ ] 创建页面文件
- [ ] 实现表单布局
- [ ] 实现表单验证
- [ ] 实现简历上传
- [ ] 实现提交功能
- [ ] 测试功能

### 步骤3：创建编辑候选人页（1小时）
- [ ] 创建页面文件
- [ ] 复用添加页表单
- [ ] 实现数据加载
- [ ] 实现保存功能
- [ ] 测试功能

### 步骤4：完善入职手册页（3小时）
- [ ] 创建数据库表
- [ ] 实现目录树组件
- [ ] 实现内容展示
- [ ] 实现搜索功能
- [ ] 实现编辑功能（管理员）
- [ ] 测试功能

### 步骤5：完善培训计划页（3小时）
- [ ] 创建数据库表
- [ ] 实现计划详情页
- [ ] 实现进度跟踪页
- [ ] 实现图表展示
- [ ] 测试功能

### 步骤6：创建数据统计页（2小时）
- [ ] 创建页面文件
- [ ] 实现数据统计
- [ ] 实现图表展示
- [ ] 实现数据导出
- [ ] 测试功能

---

## 技术选型

### UI组件
- 表单：Taro原生组件
- 图表：ECharts for Taro
- 富文本编辑器：Taro Editor
- 文件上传：Supabase Storage

### 状态管理
- 本地状态：React useState
- 全局状态：Zustand
- 数据缓存：React Query（可选）

### 数据验证
- 表单验证：自定义验证函数
- 类型检查：TypeScript

---

## 测试计划

### 功能测试
- [ ] 候选人管理：添加、编辑、删除、查看
- [ ] 入职手册：查看、搜索、编辑
- [ ] 培训计划：查看、学习、考核
- [ ] 数据统计：查看、导出

### 兼容性测试
- [ ] 微信小程序
- [ ] H5浏览器
- [ ] iOS设备
- [ ] Android设备

### 性能测试
- [ ] 页面加载速度 < 2秒
- [ ] 列表滚动流畅
- [ ] 图表渲染流畅
- [ ] 文件上传稳定

---

## 风险评估

### 技术风险
- ⚠️ 富文本编辑器兼容性
- ⚠️ 图表库性能问题
- ⚠️ 文件上传大小限制

### 解决方案
- ✅ 使用成熟的编辑器库
- ✅ 优化图表数据量
- ✅ 限制文件大小和格式

---

## 优先级排序

### P0（必须完成）
1. 候选人详情页
2. 添加候选人页

### P1（重要）
3. 编辑候选人页
4. 入职手册详情页

### P2（可选）
5. 培训计划详情页
6. 数据统计页

---

**创建时间**：2025-12-09  
**创建人员**：秒哒(Miaoda) AI Assistant  
**版本**：V1.0  
**状态**：计划中
