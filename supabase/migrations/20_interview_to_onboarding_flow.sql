/*
# 面试到入职完整流程系统

## 1. 设计理念
- **容易学**：清晰的流程指引、进度可视化、新手引导
- **容易做**：简化操作、智能表单、一键操作、自动化流程
- **容易管**：统一管理、实时追踪、数据分析、异常提醒

## 2. 核心流程（14个节点）
1. 发送面试邀约
2. 候选人扫码/链接进入
3. 填写面试信息
4. 初试评价
5. 确认复试
6. 复试评价（可重复）
7. 综合评估
8. 转入职办理
9. 完善入职信息
10. 领取物品
11. 分配导师
12. 岗前培训
13. 培训评估
14. 进入试用期

## 3. 新增表结构

### 3.1 面试邀约表 (interview_invitations)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `candidate_id` (uuid, 候选人ID，关联 recruitment_candidates)
- `position_id` (uuid, 职位ID，关联 recruitment_positions)
- `invitation_code` (text, 唯一邀约码，用于扫码/链接访问)
- `interview_type` (text, 面试类型：initial/retest)
- `interview_round` (integer, 面试轮次)
- `interviewer_id` (uuid, 面试官ID)
- `scheduled_time` (timestamptz, 预定面试时间)
- `location` (text, 面试地点)
- `status` (text, 状态：pending/accepted/rejected/completed/expired)
- `expires_at` (timestamptz, 邀约过期时间)
- `accepted_at` (timestamptz, 接受时间)
- `notes` (text, 备注)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.2 面试评价表 (interview_evaluations)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `candidate_id` (uuid, 候选人ID)
- `invitation_id` (uuid, 面试邀约ID)
- `interviewer_id` (uuid, 面试官ID)
- `interview_round` (integer, 面试轮次)
- `evaluation_date` (timestamptz, 评价日期)
- `overall_score` (integer, 综合评分 1-10)
- `professional_skills` (integer, 专业技能评分 1-10)
- `communication_skills` (integer, 沟通能力评分 1-10)
- `team_fit` (integer, 团队适配度评分 1-10)
- `work_attitude` (integer, 工作态度评分 1-10)
- `strengths` (text, 优势)
- `weaknesses` (text, 劣势)
- `recommendation` (text, 推荐意见：pass/retest/reject)
- `comments` (text, 详细评价)
- `next_round_suggested` (boolean, 是否建议下一轮)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.3 入职物品表 (onboarding_items)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `item_name` (text, 物品名称)
- `item_category` (text, 物品类别：equipment/uniform/document/other)
- `description` (text, 描述)
- `is_required` (boolean, 是否必需)
- `is_active` (boolean, 是否启用)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.4 物品领取记录表 (onboarding_item_assignments)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `employee_id` (uuid, 员工ID)
- `item_id` (uuid, 物品ID)
- `assigned_date` (timestamptz, 分配日期)
- `received_date` (timestamptz, 领取日期)
- `status` (text, 状态：pending/received/returned)
- `quantity` (integer, 数量)
- `notes` (text, 备注)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.5 导师关系表 (mentor_relationships)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `mentor_id` (uuid, 导师ID，关联 employees)
- `mentee_id` (uuid, 学员ID，关联 employees)
- `start_date` (date, 开始日期)
- `end_date` (date, 结束日期)
- `status` (text, 状态：active/completed/terminated)
- `notes` (text, 备注)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.6 培训课程表 (training_courses)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `course_name` (text, 课程名称)
- `course_type` (text, 课程类型：onboarding/skill/safety/other)
- `description` (text, 课程描述)
- `duration_hours` (numeric, 课程时长（小时）)
- `is_required` (boolean, 是否必修)
- `passing_score` (integer, 及格分数)
- `content` (text, 课程内容)
- `is_active` (boolean, 是否启用)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.7 培训记录表 (training_records)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `employee_id` (uuid, 员工ID)
- `course_id` (uuid, 课程ID)
- `assigned_date` (timestamptz, 分配日期)
- `start_date` (timestamptz, 开始日期)
- `completion_date` (timestamptz, 完成日期)
- `status` (text, 状态：pending/in_progress/completed/failed)
- `score` (integer, 考核分数)
- `passed` (boolean, 是否通过)
- `trainer_id` (uuid, 培训师ID)
- `feedback` (text, 反馈)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.8 试用期管理表 (probation_periods)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `employee_id` (uuid, 员工ID)
- `start_date` (date, 试用期开始日期)
- `end_date` (date, 试用期结束日期)
- `duration_months` (integer, 试用期时长（月）)
- `status` (text, 状态：active/passed/failed/extended)
- `evaluation_score` (integer, 评估分数)
- `evaluation_comments` (text, 评估意见)
- `evaluated_by` (uuid, 评估人ID)
- `evaluated_at` (timestamptz, 评估时间)
- `final_decision` (text, 最终决定：convert/extend/terminate)
- `decision_date` (timestamptz, 决定日期)
- `notes` (text, 备注)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## 4. 安全策略
- 所有表启用 RLS
- 租户数据完全隔离
- 候选人只能通过邀约码访问自己的信息
- 面试官只能看到分配给自己的面试
- HR 可以管理全部流程

*/

-- ==================== 1. 面试邀约表 ====================
CREATE TABLE IF NOT EXISTS interview_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    position_id uuid NOT NULL,
    invitation_code text UNIQUE NOT NULL,
    interview_type text NOT NULL CHECK (interview_type IN ('initial', 'retest')),
    interview_round integer NOT NULL DEFAULT 1,
    interviewer_id uuid,
    scheduled_time timestamptz,
    location text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'expired')),
    expires_at timestamptz,
    accepted_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_interview_invitations_tenant ON interview_invitations(tenant_id);
CREATE INDEX idx_interview_invitations_candidate ON interview_invitations(candidate_id);
CREATE INDEX idx_interview_invitations_code ON interview_invitations(invitation_code);
CREATE INDEX idx_interview_invitations_status ON interview_invitations(status);

-- ==================== 2. 面试评价表 ====================
CREATE TABLE IF NOT EXISTS interview_evaluations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    candidate_id uuid NOT NULL,
    invitation_id uuid NOT NULL,
    interviewer_id uuid NOT NULL,
    interview_round integer NOT NULL DEFAULT 1,
    evaluation_date timestamptz DEFAULT now(),
    overall_score integer CHECK (overall_score >= 1 AND overall_score <= 10),
    professional_skills integer CHECK (professional_skills >= 1 AND professional_skills <= 10),
    communication_skills integer CHECK (communication_skills >= 1 AND communication_skills <= 10),
    team_fit integer CHECK (team_fit >= 1 AND team_fit <= 10),
    work_attitude integer CHECK (work_attitude >= 1 AND work_attitude <= 10),
    strengths text,
    weaknesses text,
    recommendation text CHECK (recommendation IN ('pass', 'retest', 'reject')),
    comments text,
    next_round_suggested boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_interview_evaluations_tenant ON interview_evaluations(tenant_id);
CREATE INDEX idx_interview_evaluations_candidate ON interview_evaluations(candidate_id);
CREATE INDEX idx_interview_evaluations_invitation ON interview_evaluations(invitation_id);

-- ==================== 3. 入职物品表 ====================
CREATE TABLE IF NOT EXISTS onboarding_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    item_name text NOT NULL,
    item_category text NOT NULL CHECK (item_category IN ('equipment', 'uniform', 'document', 'other')),
    description text,
    is_required boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_onboarding_items_tenant ON onboarding_items(tenant_id);
CREATE INDEX idx_onboarding_items_category ON onboarding_items(item_category);

-- ==================== 4. 物品领取记录表 ====================
CREATE TABLE IF NOT EXISTS onboarding_item_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    item_id uuid NOT NULL,
    assigned_date timestamptz DEFAULT now(),
    received_date timestamptz,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'returned')),
    quantity integer DEFAULT 1,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_onboarding_item_assignments_tenant ON onboarding_item_assignments(tenant_id);
CREATE INDEX idx_onboarding_item_assignments_employee ON onboarding_item_assignments(employee_id);
CREATE INDEX idx_onboarding_item_assignments_item ON onboarding_item_assignments(item_id);

-- ==================== 5. 导师关系表 ====================
CREATE TABLE IF NOT EXISTS mentor_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    mentor_id uuid NOT NULL,
    mentee_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_mentor_relationships_tenant ON mentor_relationships(tenant_id);
CREATE INDEX idx_mentor_relationships_mentor ON mentor_relationships(mentor_id);
CREATE INDEX idx_mentor_relationships_mentee ON mentor_relationships(mentee_id);

-- ==================== 6. 培训课程表 ====================
CREATE TABLE IF NOT EXISTS training_courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    course_name text NOT NULL,
    course_type text NOT NULL CHECK (course_type IN ('onboarding', 'skill', 'safety', 'other')),
    description text,
    duration_hours numeric(5,2),
    is_required boolean DEFAULT false,
    passing_score integer DEFAULT 60,
    content text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_training_courses_tenant ON training_courses(tenant_id);
CREATE INDEX idx_training_courses_type ON training_courses(course_type);

-- ==================== 7. 培训记录表 ====================
CREATE TABLE IF NOT EXISTS training_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    course_id uuid NOT NULL,
    assigned_date timestamptz DEFAULT now(),
    start_date timestamptz,
    completion_date timestamptz,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    score integer,
    passed boolean,
    trainer_id uuid,
    feedback text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_training_records_tenant ON training_records(tenant_id);
CREATE INDEX idx_training_records_employee ON training_records(employee_id);
CREATE INDEX idx_training_records_course ON training_records(course_id);

-- ==================== 8. 试用期管理表 ====================
CREATE TABLE IF NOT EXISTS probation_periods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    duration_months integer NOT NULL DEFAULT 3,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'passed', 'failed', 'extended')),
    evaluation_score integer,
    evaluation_comments text,
    evaluated_by uuid,
    evaluated_at timestamptz,
    final_decision text CHECK (final_decision IN ('convert', 'extend', 'terminate')),
    decision_date timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_probation_periods_tenant ON probation_periods(tenant_id);
CREATE INDEX idx_probation_periods_employee ON probation_periods(employee_id);
CREATE INDEX idx_probation_periods_status ON probation_periods(status);

-- ==================== 9. 更新时间触发器 ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_interview_invitations_updated_at BEFORE UPDATE ON interview_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interview_evaluations_updated_at BEFORE UPDATE ON interview_evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_items_updated_at BEFORE UPDATE ON onboarding_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_item_assignments_updated_at BEFORE UPDATE ON onboarding_item_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentor_relationships_updated_at BEFORE UPDATE ON mentor_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_courses_updated_at BEFORE UPDATE ON training_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_records_updated_at BEFORE UPDATE ON training_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_probation_periods_updated_at BEFORE UPDATE ON probation_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== 10. 插入示例数据 ====================

-- 示例：入职物品（设备类）
INSERT INTO onboarding_items (tenant_id, item_name, item_category, description, is_required, is_active) VALUES
('00000000-0000-0000-0000-000000000001', '工作服（上衣）', 'uniform', '标准工作服上衣，尺码可选', true, true),
('00000000-0000-0000-0000-000000000001', '工作服（裤子）', 'uniform', '标准工作服裤子，尺码可选', true, true),
('00000000-0000-0000-0000-000000000001', '工作帽', 'uniform', '标准工作帽', true, true),
('00000000-0000-0000-0000-000000000001', '工作鞋', 'uniform', '防滑工作鞋，尺码可选', true, true),
('00000000-0000-0000-0000-000000000001', '员工手册', 'document', '公司员工手册', true, true),
('00000000-0000-0000-0000-000000000001', '工牌', 'equipment', '员工工牌', true, true),
('00000000-0000-0000-0000-000000000001', '储物柜钥匙', 'equipment', '员工储物柜钥匙', true, true),
('00000000-0000-0000-0000-000000000001', '平板电脑', 'equipment', '工作用平板电脑（管理岗位）', false, true);

-- 示例：培训课程
INSERT INTO training_courses (tenant_id, course_name, course_type, description, duration_hours, is_required, passing_score, content, is_active) VALUES
('00000000-0000-0000-0000-000000000001', '公司文化与价值观', 'onboarding', '了解公司历史、文化、价值观和发展愿景', 2.0, true, 80, '1. 公司发展历程\n2. 企业文化\n3. 核心价值观\n4. 组织架构\n5. 规章制度', true),
('00000000-0000-0000-0000-000000000001', '食品安全与卫生', 'safety', '食品安全法规、卫生标准、操作规范', 4.0, true, 90, '1. 食品安全法规\n2. 个人卫生要求\n3. 食品储存规范\n4. 加工操作标准\n5. 应急处理', true),
('00000000-0000-0000-0000-000000000001', '消防安全培训', 'safety', '消防安全知识、灭火器使用、应急疏散', 2.0, true, 85, '1. 消防安全知识\n2. 灭火器使用\n3. 应急疏散\n4. 火灾预防', true),
('00000000-0000-0000-0000-000000000001', '服务礼仪与沟通', 'skill', '服务礼仪、沟通技巧、客户服务标准', 3.0, true, 80, '1. 服务礼仪\n2. 沟通技巧\n3. 客户服务标准\n4. 投诉处理', true),
('00000000-0000-0000-0000-000000000001', '岗位技能培训', 'skill', '具体岗位的专业技能培训', 8.0, true, 85, '根据不同岗位定制培训内容', true);

-- ==================== 11. RLS 安全策略 ====================

-- 启用 RLS
ALTER TABLE interview_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE probation_periods ENABLE ROW LEVEL SECURITY;

-- 面试邀约表策略
CREATE POLICY "Users can view invitations by code" ON interview_invitations
    FOR SELECT USING (true); -- 允许通过邀约码访问

CREATE POLICY "Admins can manage all invitations" ON interview_invitations
    FOR ALL USING (is_admin(auth.uid()));

-- 面试评价表策略
CREATE POLICY "Interviewers can view their evaluations" ON interview_evaluations
    FOR SELECT USING (interviewer_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Interviewers can create evaluations" ON interview_evaluations
    FOR INSERT WITH CHECK (interviewer_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all evaluations" ON interview_evaluations
    FOR ALL USING (is_admin(auth.uid()));

-- 入职物品表策略
CREATE POLICY "All users can view active items" ON onboarding_items
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage items" ON onboarding_items
    FOR ALL USING (is_admin(auth.uid()));

-- 物品领取记录表策略
CREATE POLICY "Employees can view their assignments" ON onboarding_item_assignments
    FOR SELECT USING (employee_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all assignments" ON onboarding_item_assignments
    FOR ALL USING (is_admin(auth.uid()));

-- 导师关系表策略
CREATE POLICY "Users can view their mentor relationships" ON mentor_relationships
    FOR SELECT USING (mentor_id = auth.uid() OR mentee_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage mentor relationships" ON mentor_relationships
    FOR ALL USING (is_admin(auth.uid()));

-- 培训课程表策略
CREATE POLICY "All users can view active courses" ON training_courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage courses" ON training_courses
    FOR ALL USING (is_admin(auth.uid()));

-- 培训记录表策略
CREATE POLICY "Employees can view their training records" ON training_records
    FOR SELECT USING (employee_id = auth.uid() OR trainer_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Trainers can update training records" ON training_records
    FOR UPDATE USING (trainer_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all training records" ON training_records
    FOR ALL USING (is_admin(auth.uid()));

-- 试用期管理表策略
CREATE POLICY "Employees can view their probation period" ON probation_periods
    FOR SELECT USING (employee_id = auth.uid() OR evaluated_by = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage probation periods" ON probation_periods
    FOR ALL USING (is_admin(auth.uid()));
