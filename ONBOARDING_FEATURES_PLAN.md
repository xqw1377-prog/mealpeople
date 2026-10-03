# 入职管理中心功能完善计划

## 📋 任务概览

### 完成时间
2025-11-07

### 任务目标
完善入职管理中心的5个核心功能，提升员工入职体验

### 功能列表
1. ✅ 文档上传功能
2. ✅ 入职手册功能
3. ✅ 培训课程功能
4. ✅ 联系HR功能
5. ✅ 帮助中心功能

---

## 1. 文档上传功能

### 功能描述
员工可以上传入职所需的各类文档资料，支持图片和PDF格式

### 核心功能
- [ ] 文档上传页面
- [ ] 支持多种文档类型（身份证、学历证明、健康证等）
- [ ] 图片/PDF上传
- [ ] 上传进度显示
- [ ] 上传成功/失败提示
- [ ] 文档预览功能
- [ ] 文档删除/重新上传

### 技术实现
- **页面路径**: `/pages/document-upload/index.tsx`
- **Storage Bucket**: 使用现有的 `contract_signatures` bucket 或创建新的 `onboarding_documents` bucket
- **API函数**: 
  - `uploadOnboardingDocument` - 上传文档
  - `deleteOnboardingDocument` - 删除文档
  - `getOnboardingDocuments` - 获取文档列表

### 数据库设计
- 使用现有的 `onboarding_documents` 表
- 添加 `file_url` 字段存储文档URL
- 添加 `file_type` 字段存储文件类型（image/pdf）
- 添加 `file_size` 字段存储文件大小

---

## 2. 入职手册功能

### 功能描述
提供公司入职手册，帮助新员工快速了解公司文化、规章制度等

### 核心功能
- [ ] 入职手册列表页面
- [ ] 手册分类（公司介绍、规章制度、福利待遇、办公指南等）
- [ ] 手册内容展示
- [ ] 阅读进度追踪
- [ ] 收藏功能
- [ ] 搜索功能

### 技术实现
- **页面路径**: `/pages/onboarding-handbook/index.tsx`
- **数据库表**: 
  - `onboarding_handbooks` - 手册内容表
  - `handbook_reading_progress` - 阅读进度表

### 数据库设计
```sql
-- 入职手册表
CREATE TABLE onboarding_handbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- company_intro, rules, benefits, office_guide
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 阅读进度表
CREATE TABLE handbook_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  handbook_id UUID NOT NULL REFERENCES onboarding_handbooks(id),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, handbook_id)
);
```

---

## 3. 培训课程功能

### 功能描述
提供新员工培训课程，包括岗位培训、技能培训等

### 核心功能
- [ ] 培训课程列表页面
- [ ] 课程分类（岗位培训、技能培训、安全培训等）
- [ ] 课程详情展示
- [ ] 学习进度追踪
- [ ] 课程完成标记
- [ ] 培训考核（可选）

### 技术实现
- **页面路径**: `/pages/training-courses/index.tsx`
- **数据库表**:
  - `training_courses` - 培训课程表
  - `course_progress` - 学习进度表

### 数据库设计
```sql
-- 培训课程表
CREATE TABLE training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- position_training, skill_training, safety_training
  description TEXT,
  content TEXT NOT NULL,
  duration_minutes INTEGER, -- 课程时长（分钟）
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学习进度表
CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  course_id UUID NOT NULL REFERENCES training_courses(id),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0, -- 学习进度百分比
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, course_id)
);
```

---

## 4. 联系HR功能

### 功能描述
员工可以直接联系HR，咨询入职相关问题

### 核心功能
- [ ] 联系HR页面
- [ ] HR联系方式展示（电话、邮箱、微信）
- [ ] 在线留言功能
- [ ] 常见问题快速咨询
- [ ] 消息历史记录

### 技术实现
- **页面路径**: `/pages/contact-hr/index.tsx`
- **数据库表**:
  - `hr_contacts` - HR联系方式表
  - `hr_messages` - 留言记录表

### 数据库设计
```sql
-- HR联系方式表
CREATE TABLE hr_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  wechat TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 留言记录表
CREATE TABLE hr_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  hr_id UUID REFERENCES hr_contacts(id),
  message TEXT NOT NULL,
  reply TEXT,
  status TEXT DEFAULT 'pending', -- pending, replied, closed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  replied_at TIMESTAMPTZ
);
```

---

## 5. 帮助中心功能

### 功能描述
提供常见问题解答，帮助员工快速找到答案

### 核心功能
- [ ] 帮助中心页面
- [ ] 问题分类（入职流程、薪资福利、考勤制度、办公设施等）
- [ ] 问题搜索功能
- [ ] 问题详情展示
- [ ] 问题反馈功能
- [ ] 热门问题推荐

### 技术实现
- **页面路径**: `/pages/help-center/index.tsx`
- **数据库表**:
  - `help_articles` - 帮助文章表
  - `help_feedback` - 反馈记录表

### 数据库设计
```sql
-- 帮助文章表
CREATE TABLE help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- onboarding, salary, attendance, facilities
  content TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  is_hot BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 反馈记录表
CREATE TABLE help_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  article_id UUID REFERENCES help_articles(id),
  is_helpful BOOLEAN,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📈 实施计划

### 第一阶段：文档上传功能（优先级最高）
1. 创建文档上传页面
2. 实现文件上传功能
3. 添加文档预览功能
4. 集成到我的入职页面

### 第二阶段：入职手册和培训课程
1. 设计数据库表结构
2. 创建手册和课程页面
3. 实现阅读/学习进度追踪
4. 添加示例数据

### 第三阶段：联系HR和帮助中心
1. 设计数据库表结构
2. 创建联系HR页面
3. 创建帮助中心页面
4. 实现留言和反馈功能

---

## ✅ 完成标准

### 功能完整性
- 所有5个功能全部实现
- 每个功能都有完整的页面和交互
- 数据库表结构设计合理
- API函数完整可用

### 用户体验
- 界面美观，符合设计规范
- 交互流畅，响应及时
- 错误提示友好
- 支持WEB端和小程序端

### 代码质量
- 代码规范，无编译错误
- 类型定义完整
- 注释清晰
- 通过代码检查

---

**开始时间**: 2025-11-07  
**预计完成时间**: 2025-11-07  
**负责人**: 秒哒(Miaoda) AI助手
