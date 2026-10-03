/*
# 创建员工入职和离职管理表

## 1. 新建表

### 1.1 员工入职申请表（employee_onboarding）
- 基本信息：姓名、手机、身份证号、紧急联系人
- 入职信息：入职日期、部门、岗位、试用期
- 审批状态：待审批、已通过、已拒绝

### 1.2 入职资料表（onboarding_documents）
- 资料类型、文件URL、上传时间

### 1.3 试用期评估表（probation_evaluation）
- 评估时间、评估内容、评估结果

### 1.4 转正申请表（regularization_application）
- 申请时间、审批状态、转正日期

### 1.5 员工离职申请表（employee_resignation）
- 离职类型：主动离职、被动离职、合同到期
- 离职原因、离职日期、审批状态

### 1.6 离职交接表（resignation_handover）
- 交接事项、交接人、交接状态

### 1.7 离职面谈表（exit_interview）
- 面谈时间、面谈内容、改进建议

## 2. 安全策略
- 所有表启用RLS
- 管理员拥有完整权限
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

-- 4. 创建RLS策略 - 管理员拥有完整权限

-- 4.1 员工入职申请表策略
CREATE POLICY "管理员完整权限_入职申请" ON employee_onboarding
    FOR ALL TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- 4.2 入职资料表策略
CREATE POLICY "管理员完整权限_入职资料" ON onboarding_documents
    FOR ALL TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- 4.3 试用期评估表策略
CREATE POLICY "管理员完整权限_试用期评估" ON probation_evaluation
    FOR ALL TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- 4.4 转正申请表策略
CREATE POLICY "管理员完整权限_转正申请" ON regularization_application
    FOR ALL TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- 4.5 员工离职申请表策略
CREATE POLICY "管理员完整权限_离职申请" ON employee_resignation
    FOR ALL TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- 4.6 离职交接表策略
CREATE POLICY "管理员完整权限_离职交接" ON resignation_handover
    FOR ALL TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));

-- 4.7 离职面谈表策略
CREATE POLICY "管理员完整权限_离职面谈" ON exit_interview
    FOR ALL TO authenticated
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));