# 全工作旅程系统架构设计

## 设计理念
**以员工为中心，覆盖员工从入职到离职的完整工作旅程**

这不是一个HR管理系统，而是一个帮助员工更好地工作、成长和发展的系统。

---

## 一、核心设计原则

### 1. 员工视角优先
- 所有功能设计从员工的实际需求出发
- 界面简洁友好，易于使用
- 信息透明，员工能清楚了解自己的工作状态

### 2. 全旅程覆盖
```
入职 → 培训 → 日常工作 → 成长发展 → 离职
  ↓      ↓        ↓          ↓         ↓
欢迎   学习    排班/考勤   晋升/奖励   交接
引导   成长    休假/调班   技能提升   回顾
```

### 3. 自助服务
- 员工能自主完成大部分操作
- 减少对管理者的依赖
- 提高工作效率和满意度

---

## 二、员工工作旅程地图

### 阶段1：入职欢迎（Onboarding）
**员工需求**：快速融入团队，了解工作内容

**系统功能**：
- 📱 **入职引导**
  - 欢迎页面，介绍公司文化
  - 新人任务清单（填写资料、领取物品、认识同事）
  - 入职培训课程
  - 导师分配（老员工带新员工）

- 👥 **团队介绍**
  - 查看团队成员
  - 查看组织架构
  - 了解各岗位职责
  - 添加同事联系方式

- 📚 **知识库**
  - 公司制度手册
  - 岗位操作指南
  - 常见问题解答
  - 使用教程

### 阶段2：日常工作（Daily Work）
**员工需求**：清楚知道自己的工作安排，方便处理日常事务

**系统功能**：
- 📅 **我的排班**
  - 查看本月排班日历
  - 查看今日排班详情
  - 查看下月排班预告
  - 排班变更通知

- 🏖️ **休假管理**
  - 申请休假（年假、事假、病假）
  - 查看休假余额
  - 查看休假记录
  - 撤销休假申请

- 🔄 **调班申请**
  - 申请调班
  - 查找可调班同事
  - 调班审批状态
  - 调班历史记录

- ⏰ **考勤打卡**
  - 上班打卡
  - 下班打卡
  - 查看考勤记录
  - 补卡申请

- 💰 **工资查询**
  - 查看工资条
  - 查看工资明细
  - 查看历史工资
  - 下载工资单

### 阶段3：成长发展（Growth）
**员工需求**：看到自己的成长，获得认可和激励

**系统功能**：
- 📊 **我的绩效**
  - 查看绩效评分
  - 查看排班完成情况
  - 查看工作质量评价
  - 查看排行榜

- 🎯 **目标管理**
  - 设置个人目标
  - 跟踪目标进度
  - 完成目标奖励
  - 目标达成记录

- 🏆 **成就系统**
  - 工作徽章（全勤、优秀员工等）
  - 技能认证
  - 荣誉墙
  - 积分系统

- 📈 **技能提升**
  - 在线培训课程
  - 技能测试
  - 学习记录
  - 证书管理

- 💡 **建议反馈**
  - 提交工作建议
  - 反馈问题
  - 查看处理进度
  - 获得反馈奖励

### 阶段4：职业发展（Career）
**员工需求**：了解晋升路径，规划职业发展

**系统功能**：
- 🎓 **职业路径**
  - 查看晋升路径图
  - 查看岗位要求
  - 查看晋升条件
  - 申请晋升

- 📝 **岗位申请**
  - 查看内部岗位
  - 申请岗位调动
  - 查看申请状态
  - 面试安排

- 🌟 **能力评估**
  - 自我评估
  - 360度评估
  - 能力雷达图
  - 改进建议

### 阶段5：离职交接（Offboarding）
**员工需求**：顺利完成离职流程，保持良好关系

**系统功能**：
- 📋 **离职申请**
  - 提交离职申请
  - 查看审批进度
  - 离职面谈预约

- 🔄 **工作交接**
  - 交接清单
  - 交接进度
  - 交接确认

- 💼 **离职手续**
  - 物品归还
  - 证明开具
  - 工资结算
  - 离职证明

---

## 三、系统功能模块重新规划

### 核心模块（员工视角）

#### 1. 🏠 工作台（首页）
**定位**：员工的工作中心

**功能**：
- 今日排班卡片
- 待办事项提醒
- 最新通知
- 快捷入口
- 工作日历
- 个人数据概览

#### 2. 📅 我的排班
**定位**：排班查看和管理

**功能**：
- 月度排班日历
- 今日排班详情
- 下月排班预告
- 休假申请
- 调班申请
- 排班历史

#### 3. ⏰ 考勤打卡
**定位**：考勤管理

**功能**：
- 上下班打卡
- 考勤记录
- 补卡申请
- 加班记录
- 考勤统计

#### 4. 📊 我的绩效
**定位**：个人表现和成长

**功能**：
- 绩效评分
- 排班日志
- 工作质量
- 排行榜
- 成就徽章

#### 5. 📚 学习成长
**定位**：培训和技能提升

**功能**：
- 培训课程
- 技能测试
- 学习记录
- 证书管理
- 知识库

#### 6. 💰 薪资福利
**定位**：薪资和福利查询

**功能**：
- 工资条
- 工资明细
- 历史工资
- 福利查询
- 社保公积金

#### 7. 🎯 目标管理
**定位**：个人目标和计划

**功能**：
- 设置目标
- 跟踪进度
- 完成记录
- 奖励积分

#### 8. 💡 建议反馈
**定位**：员工参与和改进

**功能**：
- 提交建议
- 反馈问题
- 查看进度
- 获得奖励

#### 9. 👤 个人中心
**定位**：个人信息和设置

**功能**：
- 个人资料
- 合同信息
- 紧急联系人
- 账号设置
- 隐私设置

---

## 四、管理者功能（辅助角色）

管理者的功能是为了更好地支持员工，而不是控制员工。

### 1. 团队管理
- 查看团队排班
- 审批休假申请
- 审批调班申请
- 查看团队考勤
- 团队绩效概览

### 2. 排班管理
- 创建排班
- 调整排班
- 发布排班
- 排班优化建议

### 3. 绩效管理
- 评价员工表现
- 查看团队绩效
- 设置团队目标
- 绩效面谈

### 4. 培训管理
- 安排培训
- 跟踪学习进度
- 评估培训效果

---

## 五、数据库架构重新设计

### 员工中心表

#### 1. 员工档案表 (employee_profiles)
```sql
CREATE TABLE employee_profiles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  employee_no TEXT, -- 工号
  name TEXT NOT NULL,
  avatar TEXT,
  phone TEXT,
  email TEXT,
  gender TEXT,
  birth_date DATE,
  id_card TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  hire_date DATE NOT NULL, -- 入职日期
  probation_end_date DATE, -- 试用期结束日期
  regular_date DATE, -- 转正日期
  status TEXT NOT NULL, -- 'probation'=试用期, 'regular'=正式, 'resigned'=离职
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. 员工合同表 (employee_contracts)
```sql
CREATE TABLE employee_contracts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  contract_type TEXT NOT NULL, -- 'labor'=劳动合同, 'service'=劳务合同, 'intern'=实习协议
  contract_no TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. 考勤打卡表 (attendance_records)
```sql
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  store_id UUID NOT NULL,
  check_date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_in_location TEXT,
  check_out_time TIMESTAMPTZ,
  check_out_location TEXT,
  work_hours DECIMAL(5,2), -- 工作时长（小时）
  overtime_hours DECIMAL(5,2), -- 加班时长（小时）
  status TEXT NOT NULL, -- 'normal'=正常, 'late'=迟到, 'early'=早退, 'absent'=缺勤
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4. 补卡申请表 (makeup_attendance_requests)
```sql
CREATE TABLE makeup_attendance_requests (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  attendance_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approver_id UUID,
  approval_comment TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 5. 调班申请表 (shift_swap_requests)
```sql
CREATE TABLE shift_swap_requests (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  requester_id UUID NOT NULL, -- 申请人
  target_employee_id UUID NOT NULL, -- 调班对象
  original_date DATE NOT NULL, -- 原排班日期
  target_date DATE NOT NULL, -- 目标日期
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approver_id UUID,
  approval_comment TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 6. 工资记录表 (salary_records)
```sql
CREATE TABLE salary_records (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  base_salary DECIMAL(10,2), -- 基本工资
  performance_bonus DECIMAL(10,2), -- 绩效奖金
  overtime_pay DECIMAL(10,2), -- 加班费
  attendance_bonus DECIMAL(10,2), -- 全勤奖
  deductions DECIMAL(10,2), -- 扣款
  social_security DECIMAL(10,2), -- 社保
  housing_fund DECIMAL(10,2), -- 公积金
  tax DECIMAL(10,2), -- 个税
  net_salary DECIMAL(10,2), -- 实发工资
  status TEXT NOT NULL, -- 'draft'=草稿, 'published'=已发布, 'paid'=已发放
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 7. 目标管理表 (employee_goals)
```sql
CREATE TABLE employee_goals (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  goal_title TEXT NOT NULL,
  goal_description TEXT,
  target_value DECIMAL(10,2),
  current_value DECIMAL(10,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL, -- 'active'=进行中, 'completed'=已完成, 'cancelled'=已取消
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 8. 成就徽章表 (employee_achievements)
```sql
CREATE TABLE employee_achievements (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  achievement_type TEXT NOT NULL, -- 'attendance'=全勤, 'performance'=绩效, 'skill'=技能
  achievement_name TEXT NOT NULL,
  achievement_icon TEXT,
  earned_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 9. 培训课程表 (training_courses)
```sql
CREATE TABLE training_courses (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  course_name TEXT NOT NULL,
  course_description TEXT,
  course_type TEXT NOT NULL, -- 'onboarding'=入职培训, 'skill'=技能培训, 'safety'=安全培训
  duration_hours DECIMAL(5,2),
  is_required BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 10. 员工培训记录表 (employee_training_records)
```sql
CREATE TABLE employee_training_records (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  course_id UUID NOT NULL,
  start_date DATE,
  completion_date DATE,
  score DECIMAL(5,2),
  status TEXT NOT NULL, -- 'not_started'=未开始, 'in_progress'=进行中, 'completed'=已完成
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 11. 建议反馈表 (employee_suggestions)
```sql
CREATE TABLE employee_suggestions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'improvement'=改进建议, 'problem'=问题反馈, 'idea'=创意想法
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted', -- 'submitted'=已提交, 'reviewing'=审核中, 'adopted'=已采纳, 'rejected'=已拒绝
  handler_id UUID,
  handler_comment TEXT,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 12. 离职申请表 (resignation_requests)
```sql
CREATE TABLE resignation_requests (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  resignation_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approver_id UUID,
  approval_comment TEXT,
  approved_at TIMESTAMPTZ,
  handover_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 六、功能优先级规划

### 第一期：基础工作功能（当前）
✅ 排班查看
✅ 排班日志
🔄 休假申请
⏳ 考勤打卡
⏳ 调班申请

### 第二期：员工服务功能
⏳ 工资查询
⏳ 个人档案
⏳ 合同信息
⏳ 团队查看

### 第三期：成长发展功能
⏳ 绩效查看
⏳ 目标管理
⏳ 成就系统
⏳ 培训学习

### 第四期：高级功能
⏳ 建议反馈
⏳ 职业发展
⏳ 离职管理
⏳ 数据分析

---

## 七、用户体验设计原则

### 1. 移动优先
- 所有功能都要在手机上流畅使用
- 大按钮、清晰的文字
- 简化操作流程

### 2. 信息透明
- 员工能看到自己的所有数据
- 清楚了解审批进度
- 及时收到通知提醒

### 3. 自助服务
- 员工能自主完成大部分操作
- 减少对管理者的依赖
- 提供智能建议和帮助

### 4. 激励导向
- 正向激励为主
- 可视化成长轨迹
- 及时反馈和认可

### 5. 简单易用
- 界面简洁清晰
- 操作流程简单
- 提供使用引导

---

## 八、与现有功能的整合

### 现有功能保留
- ✅ 排班管理（管理者视角）
- ✅ 员工管理（管理者视角）
- ✅ 数据分析（管理者视角）
- ✅ 成本管控（管理者视角）

### 新增员工视角
- 🆕 我的排班（员工视角）
- 🆕 我的考勤（员工视角）
- 🆕 我的绩效（员工视角）
- 🆕 我的成长（员工视角）

### 功能关联
```
管理者创建排班 → 员工查看排班
员工申请休假 → 管理者审批 → 排班自动调整
员工打卡考勤 → 自动统计 → 工资计算
员工完成培训 → 获得徽章 → 晋升条件
```

---

## 九、技术架构考虑

### 1. 数据隔离
- 员工只能看到自己的数据
- 管理者能看到团队数据
- 租户管理员能看到全部数据

### 2. 权限控制
- 基于角色的权限控制
- 细粒度的数据访问控制
- 审计日志记录

### 3. 性能优化
- 数据缓存
- 分页加载
- 异步处理

### 4. 扩展性
- 模块化设计
- 插件化架构
- 支持定制化

---

## 十、总结

这是一个**以员工为中心的全工作旅程系统**，核心目标是：

1. **帮助员工更好地工作**
   - 清楚知道自己的工作安排
   - 方便处理日常事务
   - 减少沟通成本

2. **帮助员工成长发展**
   - 看到自己的进步
   - 获得认可和激励
   - 规划职业发展

3. **提升员工满意度**
   - 信息透明
   - 自助服务
   - 公平公正

4. **降低管理成本**
   - 自动化流程
   - 减少人工干预
   - 提高效率

**这不是一个HR系统，而是一个员工的工作伙伴！** 🎉
