/*
# 三大旅程双线数据表

## 1. 设计理念
双线设计 = 员工操作线 + 管理操作线
- 员工线字段：记录员工的操作和状态
- 管理线字段：记录管理者的操作和决策
- 共享字段：双方都需要的基础信息

## 2. 表结构说明

### 入职旅程表
- interviews: 面试双线表
- onboarding_processes: 入职办理双线表
- training_records: 入职训练双线表
- probation_reviews: 试用期双线表

### 在职旅程表
- shift_schedules: 排班考勤双线表
- work_logs: 日常工作双线表
- skill_certifications: 技能提升双线表
- performance_reviews: 绩效薪酬双线表

### 离职旅程表
- resignation_requests: 离职申请双线表
- handover_tasks: 工作交接双线表
- exit_procedures: 手续办理双线表
- alumni_records: 校友关系双线表

## 3. 权限设计
- 员工：只能查看和修改自己相关的数据
- 管理者：可以查看和修改管辖范围内的数据
- 双线交互：通过触发器实现状态同步和通知

*/

-- ============================================
-- 入职旅程表
-- ============================================

-- 面试双线表
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 员工线字段
    candidate_id UUID,
    candidate_name TEXT NOT NULL,
    candidate_phone TEXT,
    candidate_email TEXT,
    confirm_status TEXT DEFAULT 'pending', -- pending/confirmed/rescheduled/declined
    reschedule_reason TEXT,
    interview_attendance TEXT, -- attended/absent/late
    offer_response TEXT, -- accepted/declined/pending
    offer_response_time TIMESTAMPTZ,
    
    -- 管理线字段
    interviewer_id UUID,
    interviewer_name TEXT,
    evaluation_score INTEGER CHECK (evaluation_score >= 0 AND evaluation_score <= 100),
    evaluation_notes TEXT,
    technical_score INTEGER,
    communication_score INTEGER,
    attitude_score INTEGER,
    offer_decision TEXT, -- approved/rejected
    offer_sent_time TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- 共享字段
    position TEXT NOT NULL,
    department TEXT,
    interview_time TIMESTAMPTZ NOT NULL,
    interview_location TEXT,
    interview_type TEXT, -- online/onsite
    status TEXT DEFAULT 'scheduled', -- scheduled/completed/cancelled
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 入职办理双线表
CREATE TABLE IF NOT EXISTS onboarding_processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 员工线字段
    employee_id UUID,
    employee_name TEXT NOT NULL,
    info_completed BOOLEAN DEFAULT FALSE,
    info_submitted_time TIMESTAMPTZ,
    goods_received BOOLEAN DEFAULT FALSE,
    goods_received_time TIMESTAMPTZ,
    dorm_confirmed BOOLEAN DEFAULT FALSE,
    dorm_confirmed_time TIMESTAMPTZ,
    mentor_contacted BOOLEAN DEFAULT FALSE,
    mentor_contact_time TIMESTAMPTZ,
    
    -- 管理线字段
    hr_approver UUID,
    hr_approver_name TEXT,
    goods_issuer UUID,
    goods_issuer_name TEXT,
    dorm_manager UUID,
    dorm_manager_name TEXT,
    mentor_assigner UUID,
    mentor_id UUID,
    mentor_name TEXT,
    info_approved BOOLEAN DEFAULT FALSE,
    info_approved_time TIMESTAMPTZ,
    goods_issued BOOLEAN DEFAULT FALSE,
    goods_issued_time TIMESTAMPTZ,
    dorm_assigned BOOLEAN DEFAULT FALSE,
    dorm_number TEXT,
    dorm_bed_number TEXT,
    mentor_assigned BOOLEAN DEFAULT FALSE,
    mentor_assigned_time TIMESTAMPTZ,
    approval_notes TEXT,
    
    -- 共享字段
    position TEXT NOT NULL,
    department TEXT,
    start_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending/in_progress/completed
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 入职训练双线表
CREATE TABLE IF NOT EXISTS training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 员工线字段
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    course_progress INTEGER DEFAULT 0 CHECK (course_progress >= 0 AND course_progress <= 100),
    study_hours DECIMAL(10, 2) DEFAULT 0,
    test_score INTEGER CHECK (test_score >= 0 AND test_score <= 100),
    test_submitted_time TIMESTAMPTZ,
    certification_applied BOOLEAN DEFAULT FALSE,
    certification_applied_time TIMESTAMPTZ,
    
    -- 管理线字段
    trainer_id UUID,
    trainer_name TEXT,
    course_publisher UUID,
    test_evaluator UUID,
    test_evaluated_time TIMESTAMPTZ,
    cert_approver UUID,
    course_published BOOLEAN DEFAULT FALSE,
    course_published_time TIMESTAMPTZ,
    test_evaluated BOOLEAN DEFAULT FALSE,
    cert_approved BOOLEAN DEFAULT FALSE,
    cert_approved_time TIMESTAMPTZ,
    evaluation_notes TEXT,
    
    -- 共享字段
    course_name TEXT NOT NULL,
    course_type TEXT, -- theory/practical/mixed
    course_duration INTEGER, -- 课程时长（小时）
    passing_score INTEGER DEFAULT 60,
    status TEXT DEFAULT 'not_started', -- not_started/in_progress/completed/failed
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 试用期双线表
CREATE TABLE IF NOT EXISTS probation_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 员工线字段
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    self_assessment TEXT,
    improvement_actions TEXT,
    result_viewed BOOLEAN DEFAULT FALSE,
    result_viewed_time TIMESTAMPTZ,
    
    -- 管理线字段
    reviewer_id UUID,
    reviewer_name TEXT,
    daily_score INTEGER CHECK (daily_score >= 0 AND daily_score <= 100),
    work_quality_score INTEGER,
    work_efficiency_score INTEGER,
    team_cooperation_score INTEGER,
    learning_ability_score INTEGER,
    management_assessment TEXT,
    improvement_suggestions TEXT,
    result_published BOOLEAN DEFAULT FALSE,
    result_published_time TIMESTAMPTZ,
    conversion_decision TEXT, -- approved/rejected/extended
    conversion_decision_time TIMESTAMPTZ,
    
    -- 共享字段
    review_date DATE NOT NULL,
    review_type TEXT, -- daily/weekly/monthly/final
    status TEXT DEFAULT 'pending', -- pending/completed
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 在职旅程表
-- ============================================

-- 排班考勤双线表
CREATE TABLE IF NOT EXISTS shift_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 员工线字段
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    shift_viewed BOOLEAN DEFAULT FALSE,
    shift_viewed_time TIMESTAMPTZ,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    attendance_record TEXT, -- on_time/late/early_leave/absent
    swap_applied BOOLEAN DEFAULT FALSE,
    swap_reason TEXT,
    swap_target_employee_id UUID,
    
    -- 管理线字段
    scheduler_id UUID,
    scheduler_name TEXT,
    schedule_published BOOLEAN DEFAULT FALSE,
    schedule_published_time TIMESTAMPTZ,
    attendance_monitor UUID,
    swap_approver UUID,
    swap_approved BOOLEAN,
    swap_approved_time TIMESTAMPTZ,
    swap_rejection_reason TEXT,
    attendance_notes TEXT,
    
    -- 共享字段
    shift_date DATE NOT NULL,
    shift_type TEXT NOT NULL, -- morning/afternoon/evening/night
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'scheduled', -- scheduled/completed/cancelled
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 日常工作双线表
CREATE TABLE IF NOT EXISTS work_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 员工线字段
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    work_content TEXT NOT NULL,
    work_hours DECIMAL(10, 2),
    achievements TEXT,
    difficulties TEXT,
    tomorrow_plan TEXT,
    
    -- 管理线字段
    reviewer_id UUID,
    reviewer_name TEXT,
    review_status TEXT DEFAULT 'pending', -- pending/reviewed
    review_time TIMESTAMPTZ,
    review_comments TEXT,
    review_rating INTEGER CHECK (review_rating >= 1 AND review_rating <= 5),
    
    -- 共享字段
    work_date DATE NOT NULL,
    status TEXT DEFAULT 'submitted', -- draft/submitted/reviewed
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 技能提升双线表
CREATE TABLE IF NOT EXISTS skill_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 员工线字段
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    application_reason TEXT,
    preparation_status TEXT,
    certification_applied BOOLEAN DEFAULT FALSE,
    certification_applied_time TIMESTAMPTZ,
    
    -- 管理线字段
    evaluator_id UUID,
    evaluator_name TEXT,
    evaluation_score INTEGER CHECK (evaluation_score >= 0 AND evaluation_score <= 100),
    evaluation_notes TEXT,
    certification_approved BOOLEAN,
    certification_approved_time TIMESTAMPTZ,
    rejection_reason TEXT,
    development_suggestions TEXT,
    
    -- 共享字段
    skill_name TEXT NOT NULL,
    skill_level TEXT NOT NULL, -- beginner/intermediate/advanced/expert
    certification_type TEXT, -- internal/external
    status TEXT DEFAULT 'pending', -- pending/approved/rejected
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 绩效薪酬双线表
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 员工线字段
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    self_assessment TEXT,
    self_score INTEGER CHECK (self_score >= 0 AND self_score <= 100),
    achievements TEXT,
    result_viewed BOOLEAN DEFAULT FALSE,
    result_viewed_time TIMESTAMPTZ,
    improvement_plan TEXT,
    
    -- 管理线字段
    evaluator_id UUID,
    evaluator_name TEXT,
    management_assessment TEXT,
    management_score INTEGER CHECK (management_score >= 0 AND management_score <= 100),
    work_quality_score INTEGER,
    work_efficiency_score INTEGER,
    team_contribution_score INTEGER,
    innovation_score INTEGER,
    result_published BOOLEAN DEFAULT FALSE,
    result_published_time TIMESTAMPTZ,
    feedback_provided BOOLEAN DEFAULT FALSE,
    salary_adjustment DECIMAL(10, 2),
    bonus_amount DECIMAL(10, 2),
    
    -- 共享字段
    review_period TEXT NOT NULL, -- 2025-01/2025-Q1/2025
    review_type TEXT, -- monthly/quarterly/annual
    final_score INTEGER,
    status TEXT DEFAULT 'pending', -- pending/completed
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 离职旅程表
-- ============================================

-- 离职申请双线表
CREATE TABLE IF NOT EXISTS resignation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 员工线字段
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    resignation_reason TEXT NOT NULL,
    resignation_type TEXT NOT NULL, -- personal/family/career/salary/environment/other
    detailed_reason TEXT,
    expected_date DATE NOT NULL,
    handover_plan TEXT,
    handover_completed BOOLEAN DEFAULT FALSE,
    exit_confirmed BOOLEAN DEFAULT FALSE,
    
    -- 管理线字段
    hr_processor UUID,
    hr_processor_name TEXT,
    resignation_approver UUID,
    approver_name TEXT,
    interview_scheduled BOOLEAN DEFAULT FALSE,
    interview_time TIMESTAMPTZ,
    interview_notes TEXT,
    retention_attempt TEXT,
    resignation_approved BOOLEAN,
    approval_time TIMESTAMPTZ,
    rejection_reason TEXT,
    handover_verifier UUID,
    handover_verified BOOLEAN DEFAULT FALSE,
    handover_verified_time TIMESTAMPTZ,
    exit_processor UUID,
    exit_processed BOOLEAN DEFAULT FALSE,
    exit_processed_time TIMESTAMPTZ,
    
    -- 共享字段
    actual_date DATE,
    status TEXT DEFAULT 'pending', -- pending/approved/rejected/completed
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 工作交接双线表
CREATE TABLE IF NOT EXISTS handover_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    resignation_id UUID REFERENCES resignation_requests(id),
    
    -- 员工线字段
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    task_description TEXT NOT NULL,
    handover_documents TEXT,
    training_completed BOOLEAN DEFAULT FALSE,
    training_notes TEXT,
    employee_confirmed BOOLEAN DEFAULT FALSE,
    employee_confirmed_time TIMESTAMPTZ,
    
    -- 管理线字段
    successor_id UUID,
    successor_name TEXT,
    verifier_id UUID,
    verifier_name TEXT,
    quality_check BOOLEAN DEFAULT FALSE,
    quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
    verification_notes TEXT,
    manager_confirmed BOOLEAN DEFAULT FALSE,
    manager_confirmed_time TIMESTAMPTZ,
    
    -- 共享字段
    task_category TEXT, -- work_content/client_relationship/documents/knowledge
    priority TEXT, -- high/medium/low
    deadline DATE,
    status TEXT DEFAULT 'pending', -- pending/in_progress/completed
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 手续办理双线表
CREATE TABLE IF NOT EXISTS exit_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    resignation_id UUID REFERENCES resignation_requests(id),
    
    -- 员工线字段
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    assets_returned BOOLEAN DEFAULT FALSE,
    assets_return_time TIMESTAMPTZ,
    settlement_confirmed BOOLEAN DEFAULT FALSE,
    certificate_received BOOLEAN DEFAULT FALSE,
    certificate_received_time TIMESTAMPTZ,
    social_security_transferred BOOLEAN DEFAULT FALSE,
    
    -- 管理线字段
    processor_id UUID,
    processor_name TEXT,
    assets_verified BOOLEAN DEFAULT FALSE,
    assets_verification_time TIMESTAMPTZ,
    assets_notes TEXT,
    settlement_calculated BOOLEAN DEFAULT FALSE,
    settlement_amount DECIMAL(10, 2),
    settlement_paid BOOLEAN DEFAULT FALSE,
    settlement_paid_time TIMESTAMPTZ,
    certificate_issued BOOLEAN DEFAULT FALSE,
    certificate_issued_time TIMESTAMPTZ,
    social_security_processed BOOLEAN DEFAULT FALSE,
    social_security_processed_time TIMESTAMPTZ,
    
    -- 共享字段
    procedure_type TEXT NOT NULL, -- assets/settlement/certificate/social_security
    status TEXT DEFAULT 'pending', -- pending/completed
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 校友关系双线表
CREATE TABLE IF NOT EXISTS alumni_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- 员工线字段
    employee_id UUID NOT NULL,
    employee_name TEXT NOT NULL,
    contact_phone TEXT,
    contact_email TEXT,
    contact_wechat TEXT,
    current_company TEXT,
    current_position TEXT,
    willing_to_return BOOLEAN DEFAULT FALSE,
    interested_positions TEXT,
    
    -- 管理线字段
    relationship_manager UUID,
    manager_name TEXT,
    alumni_status TEXT, -- active/inactive
    last_contact_time TIMESTAMPTZ,
    contact_frequency TEXT, -- monthly/quarterly/yearly
    rehire_potential TEXT, -- high/medium/low
    rehire_notes TEXT,
    alumni_value_rating INTEGER CHECK (alumni_value_rating >= 1 AND alumni_value_rating <= 5),
    
    -- 共享字段
    departure_date DATE,
    departure_reason TEXT,
    work_duration INTEGER, -- 工作时长（月）
    status TEXT DEFAULT 'active', -- active/inactive
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 创建索引
-- ============================================

-- 面试表索引
CREATE INDEX idx_interviews_tenant ON interviews(tenant_id);
CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_interviewer ON interviews(interviewer_id);
CREATE INDEX idx_interviews_status ON interviews(status);

-- 入职办理表索引
CREATE INDEX idx_onboarding_tenant ON onboarding_processes(tenant_id);
CREATE INDEX idx_onboarding_employee ON onboarding_processes(employee_id);
CREATE INDEX idx_onboarding_status ON onboarding_processes(status);

-- 训练记录表索引
CREATE INDEX idx_training_tenant ON training_records(tenant_id);
CREATE INDEX idx_training_employee ON training_records(employee_id);
CREATE INDEX idx_training_status ON training_records(status);

-- 试用期表索引
CREATE INDEX idx_probation_tenant ON probation_reviews(tenant_id);
CREATE INDEX idx_probation_employee ON probation_reviews(employee_id);
CREATE INDEX idx_probation_date ON probation_reviews(review_date);

-- 排班表索引
CREATE INDEX idx_shift_tenant ON shift_schedules(tenant_id);
CREATE INDEX idx_shift_employee ON shift_schedules(employee_id);
CREATE INDEX idx_shift_date ON shift_schedules(shift_date);

-- 工作日志表索引
CREATE INDEX idx_work_logs_tenant ON work_logs(tenant_id);
CREATE INDEX idx_work_logs_employee ON work_logs(employee_id);
CREATE INDEX idx_work_logs_date ON work_logs(work_date);

-- 技能认证表索引
CREATE INDEX idx_skill_cert_tenant ON skill_certifications(tenant_id);
CREATE INDEX idx_skill_cert_employee ON skill_certifications(employee_id);
CREATE INDEX idx_skill_cert_status ON skill_certifications(status);

-- 绩效评估表索引
CREATE INDEX idx_performance_tenant ON performance_reviews(tenant_id);
CREATE INDEX idx_performance_employee ON performance_reviews(employee_id);
CREATE INDEX idx_performance_period ON performance_reviews(review_period);

-- 离职申请表索引
CREATE INDEX idx_resignation_tenant ON resignation_requests(tenant_id);
CREATE INDEX idx_resignation_employee ON resignation_requests(employee_id);
CREATE INDEX idx_resignation_status ON resignation_requests(status);

-- 工作交接表索引
CREATE INDEX idx_handover_tenant ON handover_tasks(tenant_id);
CREATE INDEX idx_handover_employee ON handover_tasks(employee_id);
CREATE INDEX idx_handover_resignation ON handover_tasks(resignation_id);

-- 手续办理表索引
CREATE INDEX idx_exit_proc_tenant ON exit_procedures(tenant_id);
CREATE INDEX idx_exit_proc_employee ON exit_procedures(employee_id);
CREATE INDEX idx_exit_proc_resignation ON exit_procedures(resignation_id);

-- 校友记录表索引
CREATE INDEX idx_alumni_tenant ON alumni_records(tenant_id);
CREATE INDEX idx_alumni_employee ON alumni_records(employee_id);
CREATE INDEX idx_alumni_status ON alumni_records(status);
