/*
# 创建员工入职和离职管理表

## 1. 新建表

### 1.1 员工入职申请表（employee_onboarding）
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `store_id` (uuid, 门店ID)
- `name` (text, 姓名)
- `phone` (text, 手机号)
- `id_card` (text, 身份证号)
- `email` (text, 邮箱)
- `emergency_contact_name` (text, 紧急联系人姓名)
- `emergency_contact_phone` (text, 紧急联系人电话)
- `department` (text, 部门)
- `position` (text, 岗位)
- `onboarding_date` (date, 入职日期)
- `probation_months` (integer, 试用期月数，默认3个月)
- `expected_salary` (numeric, 期望薪资)
- `status` (text, 状态：pending待审批/approved已通过/rejected已拒绝/completed已完成)
- `approval_comment` (text, 审批意见)
- `approved_by` (uuid, 审批人ID)
- `approved_at` (timestamptz, 审批时间)
- `created_by` (uuid, 创建人ID)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

### 1.2 入职资料表（onboarding_documents）
- `id` (uuid, 主键)
- `onboarding_id` (uuid, 入职申请ID)
- `document_type` (text, 资料类型：id_card身份证/diploma学历证明/health_cert健康证/other其他)
- `document_name` (text, 资料名称)
- `file_url` (text, 文件URL)
- `uploaded_at` (timestamptz, 上传时间)

### 1.3 试用期评估表（probation_evaluation）
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `employee_id` (uuid, 员工ID)
- `evaluation_date` (date, 评估日期)
- `work_attitude_score` (integer, 工作态度评分 1-5)
- `work_ability_score` (integer, 工作能力评分 1-5)
- `team_cooperation_score` (integer, 团队协作评分 1-5)
- `overall_score` (integer, 综合评分 1-5)
- `evaluation_content` (text, 评估内容)
- `improvement_suggestions` (text, 改进建议)
- `evaluator_id` (uuid, 评估人ID)
- `created_at` (timestamptz, 创建时间)

### 1.4 转正申请表（regularization_application）
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `employee_id` (uuid, 员工ID)
- `application_date` (date, 申请日期)
- `expected_regularization_date` (date, 期望转正日期)
- `self_evaluation` (text, 自我评价)
- `work_summary` (text, 工作总结)
- `status` (text, 状态：pending待审批/approved已通过/rejected已拒绝)
- `approval_comment` (text, 审批意见)
- `approved_by` (uuid, 审批人ID)
- `approved_at` (timestamptz, 审批时间)
- `actual_regularization_date` (date, 实际转正日期)
- `created_at` (timestamptz, 创建时间)

### 1.5 员工离职申请表（employee_resignation）
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `store_id` (uuid, 门店ID)
- `employee_id` (uuid, 员工ID)
- `resignation_type` (text, 离职类型：voluntary主动离职/involuntary被动离职/contract_end合同到期)
- `resignation_reason` (text, 离职原因)
- `resignation_date` (date, 离职日期)
- `last_working_day` (date, 最后工作日)
- `status` (text, 状态：pending待审批/approved已通过/rejected已拒绝/completed已完成)
- `approval_comment` (text, 审批意见)
- `approved_by` (uuid, 审批人ID)
- `approved_at` (timestamptz, 审批时间)
- `created_at` (timestamptz, 创建时间)
- `updated_at` (timestamptz, 更新时间)

### 1.6 离职交接表（resignation_handover）
- `id` (uuid, 主键)
- `resignation_id` (uuid, 离职申请ID)
- `handover_item` (text, 交接事项)
- `handover_to_id` (uuid, 交接给谁)
- `handover_status` (text, 交接状态：pending待交接/in_progress进行中/completed已完成)
- `handover_date` (date, 交接日期)
- `notes` (text, 备注)
- `created_at` (timestamptz, 创建时间)

### 1.7 离职面谈表（exit_interview）
- `id` (uuid, 主键)
- `resignation_id` (uuid, 离职申请ID)
- `interview_date` (date, 面谈日期)
- `interviewer_id` (uuid, 面谈人ID)
- `satisfaction_rating` (integer, 满意度评分 1-5)
- `leaving_reason_detail` (text, 详细离职原因)
- `company_feedback` (text, 对公司的反馈)
- `improvement_suggestions` (text, 改进建议)
- `would_recommend` (boolean, 是否推荐他人加入)
- `would_return` (boolean, 是否愿意回来)
- `interview_notes` (text, 面谈记录)
- `created_at` (timestamptz, 创建时间)

## 2. 安全策略
- 所有表启用RLS
- 管理员和店长拥有完整权限
- 员工只能查看和操作自己的申请
*/

-- 1.1 创建员工入职申请表
CREATE TABLE IF NOT EXISTS employee_onboarding (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text NOT NULL,
    id_card text,
    email text,
    emergency_contact_name text,
    emergency_contact_phone text,
    department text,
    position text,
    onboarding_date date NOT NULL,
    probation_months integer DEFAULT 3,
    expected_salary numeric(10, 2),
    status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    approval_comment text,
    approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at timestamptz,
    created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 1.2 创建入职资料表
CREATE TABLE IF NOT EXISTS onboarding_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    onboarding_id uuid NOT NULL REFERENCES employee_onboarding(id) ON DELETE CASCADE,
    document_type text NOT NULL CHECK (document_type IN ('id_card', 'diploma', 'health_cert', 'other')),
    document_name text NOT NULL,
    file_url text NOT NULL,
    uploaded_at timestamptz DEFAULT now()
);

-- 1.3 创建试用期评估表
CREATE TABLE IF NOT EXISTS probation_evaluation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    evaluation_date date NOT NULL,
    work_attitude_score integer CHECK (work_attitude_score >= 1 AND work_attitude_score <= 5),
    work_ability_score integer CHECK (work_ability_score >= 1 AND work_ability_score <= 5),
    team_cooperation_score integer CHECK (team_cooperation_score >= 1 AND team_cooperation_score <= 5),
    overall_score integer CHECK (overall_score >= 1 AND overall_score <= 5),
    evaluation_content text,
    improvement_suggestions text,
    evaluator_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

-- 1.4 创建转正申请表
CREATE TABLE IF NOT EXISTS regularization_application (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    application_date date NOT NULL,
    expected_regularization_date date NOT NULL,
    self_evaluation text,
    work_summary text,
    status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'approved', 'rejected')),
    approval_comment text,
    approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at timestamptz,
    actual_regularization_date date,
    created_at timestamptz DEFAULT now()
);

-- 1.5 创建员工离职申请表
CREATE TABLE IF NOT EXISTS employee_resignation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    resignation_type text NOT NULL CHECK (resignation_type IN ('voluntary', 'involuntary', 'contract_end')),
    resignation_reason text NOT NULL,
    resignation_date date NOT NULL,
    last_working_day date NOT NULL,
    status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    approval_comment text,
    approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 1.6 创建离职交接表
CREATE TABLE IF NOT EXISTS resignation_handover (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resignation_id uuid NOT NULL REFERENCES employee_resignation(id) ON DELETE CASCADE,
    handover_item text NOT NULL,
    handover_to_id uuid REFERENCES employees(id) ON DELETE SET NULL,
    handover_status text DEFAULT 'pending'::text CHECK (handover_status IN ('pending', 'in_progress', 'completed')),
    handover_date date,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- 1.7 创建离职面谈表
CREATE TABLE IF NOT EXISTS exit_interview (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    resignation_id uuid NOT NULL REFERENCES employee_resignation(id) ON DELETE CASCADE,
    interview_date date NOT NULL,
    interviewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    satisfaction_rating integer CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    leaving_reason_detail text,
    company_feedback text,
    improvement_suggestions text,
    would_recommend boolean,
    would_return boolean,
    interview_notes text,
    created_at timestamptz DEFAULT now()
);

-- 2. 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_employee_onboarding_tenant ON employee_onboarding(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_onboarding_store ON employee_onboarding(store_id);
CREATE INDEX IF NOT EXISTS idx_employee_onboarding_status ON employee_onboarding(status);
CREATE INDEX IF NOT EXISTS idx_probation_evaluation_employee ON probation_evaluation(employee_id);
CREATE INDEX IF NOT EXISTS idx_regularization_application_employee ON regularization_application(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_resignation_tenant ON employee_resignation(tenant_id);
CREATE INDEX IF NOT EXISTS idx_employee_resignation_employee ON employee_resignation(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_resignation_status ON employee_resignation(status);

-- 3. 启用RLS
ALTER TABLE employee_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE probation_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE regularization_application ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_resignation ENABLE ROW LEVEL SECURITY;
ALTER TABLE resignation_handover ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_interview ENABLE ROW LEVEL SECURITY;

-- 4. 创建RLS策略

-- 4.1 员工入职申请表策略
CREATE POLICY "管理员可以查看所有入职申请" ON employee_onboarding
    FOR SELECT TO authenticated
    USING (is_admin(auth.uid()));

CREATE POLICY "管理员可以创建入职申请" ON employee_onboarding
    FOR INSERT TO authenticated
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "管理员可以更新入职申请" ON employee_onboarding
    FOR UPDATE TO authenticated
    USING (is_admin(auth.uid()));

CREATE POLICY "管理员可以删除入职申请" ON employee_onboarding
    FOR DELETE TO authenticated
    USING (is_admin(auth.uid()));

-- 4.2 入职资料表策略
CREATE POLICY "管理员可以查看所有入职资料" ON onboarding_documents
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employee_onboarding
            WHERE employee_onboarding.id = onboarding_documents.onboarding_id
            AND is_admin(auth.uid())
        )
    );

CREATE POLICY "管理员可以上传入职资料" ON onboarding_documents
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employee_onboarding
            WHERE employee_onboarding.id = onboarding_documents.onboarding_id
            AND is_admin(auth.uid())
        )
    );

-- 4.3 试用期评估表策略
CREATE POLICY "管理员可以查看所有试用期评估" ON probation_evaluation
    FOR SELECT TO authenticated
    USING (is_admin(auth.uid()));

CREATE POLICY "管理员可以创建试用期评估" ON probation_evaluation
    FOR INSERT TO authenticated
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "管理员可以更新试用期评估" ON probation_evaluation
    FOR UPDATE TO authenticated
    USING (is_admin(auth.uid()));

-- 4.4 转正申请表策略
CREATE POLICY "管理员可以查看所有转正申请" ON regularization_application
    FOR SELECT TO authenticated
    USING (is_admin(auth.uid()));

CREATE POLICY "管理员可以创建转正申请" ON regularization_application
    FOR INSERT TO authenticated
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "管理员可以更新转正申请" ON regularization_application
    FOR UPDATE TO authenticated
    USING (is_admin(auth.uid()));

-- 4.5 员工离职申请表策略
CREATE POLICY "管理员可以查看所有离职申请" ON employee_resignation
    FOR SELECT TO authenticated
    USING (is_admin(auth.uid()));

CREATE POLICY "管理员可以创建离职申请" ON employee_resignation
    FOR INSERT TO authenticated
    WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "管理员可以更新离职申请" ON employee_resignation
    FOR UPDATE TO authenticated
    USING (is_admin(auth.uid()));

CREATE POLICY "管理员可以删除离职申请" ON employee_resignation
    FOR DELETE TO authenticated
    USING (is_admin(auth.uid()));

-- 4.6 离职交接表策略
CREATE POLICY "管理员可以查看所有离职交接" ON resignation_handover
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employee_resignation
            WHERE employee_resignation.id = resignation_handover.resignation_id
            AND is_admin(auth.uid())
        )
    );

CREATE POLICY "管理员可以创建离职交接" ON resignation_handover
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employee_resignation
            WHERE employee_resignation.id = resignation_handover.resignation_id
            AND is_admin(auth.uid())
        )
    );

CREATE POLICY "管理员可以更新离职交接" ON resignation_handover
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employee_resignation
            WHERE employee_resignation.id = resignation_handover.resignation_id
            AND is_admin(auth.uid())
        )
    );

-- 4.7 离职面谈表策略
CREATE POLICY "管理员可以查看所有离职面谈" ON exit_interview
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employee_resignation
            WHERE employee_resignation.id = exit_interview.resignation_id
            AND is_admin(auth.uid())
        )
    );

CREATE POLICY "管理员可以创建离职面谈" ON exit_interview
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employee_resignation
            WHERE employee_resignation.id = exit_interview.resignation_id
            AND is_admin(auth.uid())
        )
    );

CREATE POLICY "管理员可以更新离职面谈" ON exit_interview
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM employee_resignation
            WHERE employee_resignation.id = exit_interview.resignation_id
            AND is_admin(auth.uid())
        )
    );