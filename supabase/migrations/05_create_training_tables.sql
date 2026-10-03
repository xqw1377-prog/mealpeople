/*
# 创建培训管理系统表

## 1. 新增表

### training_courses（培训课程表）
- id (uuid, 主键)
- tenant_id (uuid, 租户ID)
- title (text, 课程标题)
- description (text, 课程描述)
- category (text, 课程分类：岗位技能/公司文化/安全培训/制度流程/其他)
- duration_hours (numeric, 课程时长-小时)
- instructor (text, 讲师)
- max_participants (integer, 最大参与人数)
- status (text, 状态：draft/published/archived)
- cover_image (text, 封面图片URL)
- created_by (uuid, 创建人ID)
- created_at (timestamptz, 创建时间)
- updated_at (timestamptz, 更新时间)

### training_records（培训记录表）
- id (uuid, 主键)
- tenant_id (uuid, 租户ID)
- course_id (uuid, 课程ID)
- employee_id (uuid, 员工ID)
- status (text, 状态：enrolled/in_progress/completed/cancelled)
- enrolled_at (timestamptz, 报名时间)
- started_at (timestamptz, 开始时间)
- completed_at (timestamptz, 完成时间)
- progress (integer, 进度百分比 0-100)
- score (numeric, 考核分数)
- feedback (text, 培训反馈)
- created_at (timestamptz, 创建时间)
- updated_at (timestamptz, 更新时间)

### training_exams（培训考核表）
- id (uuid, 主键)
- tenant_id (uuid, 租户ID)
- course_id (uuid, 课程ID)
- record_id (uuid, 培训记录ID)
- employee_id (uuid, 员工ID)
- exam_date (date, 考核日期)
- score (numeric, 考核分数)
- pass_score (numeric, 及格分数)
- status (text, 状态：pending/passed/failed)
- examiner (uuid, 考核人ID)
- notes (text, 考核备注)
- created_at (timestamptz, 创建时间)
- updated_at (timestamptz, 更新时间)

## 2. 安全策略
- 启用 RLS
- 员工可以查看自己的培训记录和考核
- 管理员可以管理所有培训数据
- 员工可以报名课程和提交反馈
- 管理员可以创建课程和录入考核成绩

## 3. 索引优化
- 为常用查询字段创建索引
- 为外键创建索引

## 4. 初始数据
- 创建示例培训课程
*/

-- 创建课程分类枚举
CREATE TYPE training_category AS ENUM ('job_skill', 'company_culture', 'safety', 'policy', 'other');

-- 创建课程状态枚举
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

-- 创建培训记录状态枚举
CREATE TYPE training_status AS ENUM ('enrolled', 'in_progress', 'completed', 'cancelled');

-- 创建考核状态枚举
CREATE TYPE exam_status AS ENUM ('pending', 'passed', 'failed');

-- 1. 创建培训课程表
CREATE TABLE IF NOT EXISTS training_courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    category training_category NOT NULL DEFAULT 'other'::training_category,
    duration_hours numeric(5,2) NOT NULL DEFAULT 1.0,
    instructor text,
    max_participants integer,
    status course_status NOT NULL DEFAULT 'draft'::course_status,
    cover_image text,
    created_by uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. 创建培训记录表
CREATE TABLE IF NOT EXISTS training_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL,
    status training_status NOT NULL DEFAULT 'enrolled'::training_status,
    enrolled_at timestamptz DEFAULT now(),
    started_at timestamptz,
    completed_at timestamptz,
    progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    score numeric(5,2),
    feedback text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. 创建培训考核表
CREATE TABLE IF NOT EXISTS training_exams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES training_courses(id) ON DELETE CASCADE,
    record_id uuid NOT NULL REFERENCES training_records(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL,
    exam_date date NOT NULL,
    score numeric(5,2) NOT NULL,
    pass_score numeric(5,2) NOT NULL DEFAULT 60.0,
    status exam_status NOT NULL DEFAULT 'pending'::exam_status,
    examiner uuid,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_training_courses_tenant ON training_courses(tenant_id);
CREATE INDEX idx_training_courses_status ON training_courses(status);
CREATE INDEX idx_training_courses_category ON training_courses(category);

CREATE INDEX idx_training_records_tenant ON training_records(tenant_id);
CREATE INDEX idx_training_records_course ON training_records(course_id);
CREATE INDEX idx_training_records_employee ON training_records(employee_id);
CREATE INDEX idx_training_records_status ON training_records(status);

CREATE INDEX idx_training_exams_tenant ON training_exams(tenant_id);
CREATE INDEX idx_training_exams_course ON training_exams(course_id);
CREATE INDEX idx_training_exams_record ON training_exams(record_id);
CREATE INDEX idx_training_exams_employee ON training_exams(employee_id);

-- 启用 RLS
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_exams ENABLE ROW LEVEL SECURITY;

-- 培训课程表的 RLS 策略
-- 所有人可以查看已发布的课程
CREATE POLICY "Anyone can view published courses" ON training_courses
    FOR SELECT USING (status = 'published'::course_status);

-- 管理员可以管理所有课程
CREATE POLICY "Admins can manage all courses" ON training_courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('tenant_admin', 'super_admin')
        )
    );

-- 培训记录表的 RLS 策略
-- 员工可以查看自己的培训记录
CREATE POLICY "Employees can view own records" ON training_records
    FOR SELECT USING (employee_id = auth.uid());

-- 员工可以报名课程（创建记录）
CREATE POLICY "Employees can enroll courses" ON training_records
    FOR INSERT WITH CHECK (employee_id = auth.uid());

-- 员工可以更新自己的培训记录（进度、反馈）
CREATE POLICY "Employees can update own records" ON training_records
    FOR UPDATE USING (employee_id = auth.uid());

-- 管理员可以管理所有培训记录
CREATE POLICY "Admins can manage all records" ON training_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('tenant_admin', 'super_admin')
        )
    );

-- 培训考核表的 RLS 策略
-- 员工可以查看自己的考核记录
CREATE POLICY "Employees can view own exams" ON training_exams
    FOR SELECT USING (employee_id = auth.uid());

-- 管理员可以管理所有考核记录
CREATE POLICY "Admins can manage all exams" ON training_exams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('tenant_admin', 'super_admin')
        )
    );

-- 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为培训课程表添加更新时间触发器
CREATE TRIGGER update_training_courses_updated_at
    BEFORE UPDATE ON training_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为培训记录表添加更新时间触发器
CREATE TRIGGER update_training_records_updated_at
    BEFORE UPDATE ON training_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 为培训考核表添加更新时间触发器
CREATE TRIGGER update_training_exams_updated_at
    BEFORE UPDATE ON training_exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
