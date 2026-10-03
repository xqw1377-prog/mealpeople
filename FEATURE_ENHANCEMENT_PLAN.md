# 功能完善开发计划

## 📋 开发时间
2025-12-07

## 🎯 开发目标
在已完成的入职管理功能基础上，添加数据持久化和高级功能，提升用户体验

---

## 一、入职手册功能增强

### 当前状态
✅ 已完成基础页面和UI
- 6个章节内容展示
- 章节导航和切换
- 响应式设计

### 待完善功能
- [ ] **阅读进度追踪**
  - 记录用户阅读的章节
  - 显示阅读进度百分比
  - 标记已读/未读状态
  
- [ ] **数据持久化**
  - 使用现有的 training_records 表或创建新表
  - 记录阅读时间和进度
  - 支持跨设备同步

- [ ] **必读章节提醒**
  - 标记必读章节
  - 未读完成时显示提醒
  - 完成后显示徽章

---

## 二、培训课程功能增强

### 当前状态
✅ 已完成基础页面和UI
- 6门培训课程展示
- 课程进度显示
- 课程详情弹窗

### 待完善功能
- [ ] **学习进度持久化**
  - 使用 training_records 表
  - 记录学习状态（未开始/进行中/已完成）
  - 记录学习进度百分比
  - 记录完成时间

- [ ] **课程学习页面**
  - 创建课程学习详情页
  - 支持课程内容分步展示
  - 支持标记完成
  - 支持学习笔记

- [ ] **学习统计**
  - 显示总学习时长
  - 显示完成课程数
  - 显示学习排名

---

## 三、联系HR功能增强

### 当前状态
✅ 已完成基础页面和UI
- HR联系方式展示
- 一键拨打电话
- 常见问题FAQ

### 待完善功能
- [ ] **在线留言功能**
  - 创建留言表单页面
  - 支持文字留言
  - 支持图片上传
  - 留言状态追踪

- [ ] **留言历史记录**
  - 显示历史留言列表
  - 显示HR回复
  - 支持留言删除

- [ ] **HR动态配置**
  - 从数据库读取HR信息
  - 支持多个HR联系人
  - 支持HR在线状态

---

## 四、帮助中心功能增强

### 当前状态
✅ 已完成基础页面和UI
- 问题分类导航
- 搜索功能
- 文章展开/收起

### 待完善功能
- [ ] **问题反馈功能**
  - 添加"有帮助"/"无帮助"按钮
  - 记录反馈统计
  - 显示帮助度评分

- [ ] **热门问题推荐**
  - 基于浏览量排序
  - 显示热门标签
  - 首页推荐热门问题

- [ ] **浏览历史**
  - 记录用户浏览的文章
  - 显示最近浏览
  - 支持快速返回

---

## 五、新增功能模块

### 5.1 我的学习中心
- [ ] **创建学习中心页面**
  - 统一展示所有学习内容
  - 包括入职手册、培训课程
  - 显示学习进度和统计
  - 显示学习成就

- [ ] **学习成就系统**
  - 完成课程获得徽章
  - 学习时长统计
  - 学习排行榜
  - 分享学习成果

### 5.2 入职任务清单
- [ ] **创建任务清单页面**
  - 显示所有入职任务
  - 任务分类（必做/选做）
  - 任务进度追踪
  - 任务完成提醒

- [ ] **任务管理功能**
  - 标记任务完成
  - 任务备注
  - 任务提醒
  - 任务统计

---

## 📊 实施优先级

### P0 - 最高优先级（立即实施）
1. ✅ 培训课程学习进度持久化
2. ✅ 入职手册阅读进度追踪
3. ✅ 我的学习中心页面

### P1 - 高优先级（本周完成）
4. ⏳ 课程学习详情页面
5. ⏳ 在线留言功能
6. ⏳ 问题反馈功能

### P2 - 中优先级（下周完成）
7. ⏳ 学习成就系统
8. ⏳ 入职任务清单
9. ⏳ 热门问题推荐

---

## 🗄️ 数据库设计

### 新增表结构

#### 1. handbook_reading_progress（手册阅读进度表）
```sql
CREATE TABLE handbook_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  section_id TEXT NOT NULL, -- 章节ID
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, section_id)
);
```

#### 2. hr_messages（HR留言表）
```sql
CREATE TABLE hr_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  message TEXT NOT NULL,
  images TEXT[], -- 图片URL数组
  status TEXT DEFAULT 'pending', -- pending/replied/closed
  reply TEXT,
  replied_by UUID REFERENCES profiles(id),
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3. help_article_feedback（帮助文章反馈表）
```sql
CREATE TABLE help_article_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  article_id TEXT NOT NULL, -- 文章ID
  is_helpful BOOLEAN NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, article_id)
);
```

#### 4. learning_achievements（学习成就表）
```sql
CREATE TABLE learning_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  achievement_type TEXT NOT NULL, -- course_complete/handbook_read/fast_learner
  achievement_name TEXT NOT NULL,
  achievement_icon TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ 完成标准

### 功能完整性
- 所有P0优先级功能全部实现
- 数据持久化正常工作
- 跨设备数据同步正常

### 用户体验
- 界面美观，交互流畅
- 加载速度快
- 错误提示友好
- 支持离线缓存

### 代码质量
- 通过代码检查
- 类型定义完整
- 注释清晰
- 无编译错误

---

**开始时间**: 2025-12-07  
**预计完成时间**: 2025-12-07  
**负责人**: 秒哒(Miaoda) AI助手
