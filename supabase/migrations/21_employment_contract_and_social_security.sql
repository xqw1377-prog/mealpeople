/*
# 劳动合同和社保管理系统

## 1. 设计理念
- **容易学**：清晰的合同管理流程、简单的社保办理步骤
- **容易做**：自动化合同生成、智能社保计算、一键办理
- **容易管**：统一管理界面、实时状态追踪、到期提醒

## 2. 核心流程
1. 试用期评估 → 2. 确定转正/终止 → 3. 签订劳动合同 → 4. 社保办理 → 5. 正式入职

## 3. 新增表结构

### 3.1 劳动合同表 (employment_contracts)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `employee_id` (uuid, 员工ID)
- `contract_number` (text, 合同编号，唯一)
- `contract_type` (text, 合同类型：fixed_term/indefinite/project_based)
- `start_date` (date, 合同开始日期)
- `end_date` (date, 合同结束日期，无固定期限为null)
- `duration_years` (numeric, 合同期限（年）)
- `position` (text, 岗位)
- `department` (text, 部门)
- `salary` (numeric, 月薪)
- `work_location` (text, 工作地点)
- `contract_status` (text, 合同状态：draft/active/expired/terminated)
- `signed_date` (date, 签订日期)
- `signed_by_employee` (boolean, 员工是否已签署)
- `signed_by_company` (boolean, 公司是否已签署)
- `contract_file_url` (text, 合同文件URL)
- `notes` (text, 备注)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.2 社保记录表 (social_security_records)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `employee_id` (uuid, 员工ID)
- `social_security_number` (text, 社保号)
- `start_date` (date, 参保开始日期)
- `end_date` (date, 参保结束日期)
- `status` (text, 状态：active/suspended/terminated)
- `pension_base` (numeric, 养老保险基数)
- `medical_base` (numeric, 医疗保险基数)
- `unemployment_base` (numeric, 失业保险基数)
- `work_injury_base` (numeric, 工伤保险基数)
- `maternity_base` (numeric, 生育保险基数)
- `housing_fund_base` (numeric, 住房公积金基数)
- `company_pension` (numeric, 公司养老保险缴纳额)
- `company_medical` (numeric, 公司医疗保险缴纳额)
- `company_unemployment` (numeric, 公司失业保险缴纳额)
- `company_work_injury` (numeric, 公司工伤保险缴纳额)
- `company_maternity` (numeric, 公司生育保险缴纳额)
- `company_housing_fund` (numeric, 公司住房公积金缴纳额)
- `personal_pension` (numeric, 个人养老保险缴纳额)
- `personal_medical` (numeric, 个人医疗保险缴纳额)
- `personal_unemployment` (numeric, 个人失业保险缴纳额)
- `personal_housing_fund` (numeric, 个人住房公积金缴纳额)
- `total_company_contribution` (numeric, 公司总缴纳额)
- `total_personal_contribution` (numeric, 个人总缴纳额)
- `notes` (text, 备注)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.3 社保缴纳记录表 (social_security_payments)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `employee_id` (uuid, 员工ID)
- `record_id` (uuid, 社保记录ID)
- `payment_month` (text, 缴纳月份，格式：YYYY-MM)
- `payment_date` (date, 缴纳日期)
- `company_amount` (numeric, 公司缴纳金额)
- `personal_amount` (numeric, 个人缴纳金额)
- `total_amount` (numeric, 总缴纳金额)
- `payment_status` (text, 缴纳状态：pending/paid/failed)
- `payment_method` (text, 缴纳方式)
- `notes` (text, 备注)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3.4 员工状态变更记录表 (employee_status_changes)
- `id` (uuid, 主键)
- `tenant_id` (uuid, 租户ID)
- `employee_id` (uuid, 员工ID)
- `change_type` (text, 变更类型：probation_to_regular/contract_renewal/termination/resignation)
- `from_status` (text, 原状态)
- `to_status` (text, 新状态)
- `change_date` (date, 变更日期)
- `reason` (text, 变更原因)
- `approved_by` (uuid, 审批人ID)
- `approved_at` (timestamptz, 审批时间)
- `notes` (text, 备注)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## 4. 安全策略
- 所有表启用 RLS
- 租户数据完全隔离
- 员工只能查看自己的合同和社保信息
- HR 可以管理全部数据

*/

-- ==================== 1. 劳动合同表 ====================
CREATE TABLE IF NOT EXISTS employment_contracts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    contract_number text UNIQUE NOT NULL,
    contract_type text NOT NULL CHECK (contract_type IN ('fixed_term', 'indefinite', 'project_based')),
    start_date date NOT NULL,
    end_date date,
    duration_years numeric(5,2),
    position text NOT NULL,
    department text,
    salary numeric(12,2) NOT NULL,
    work_location text,
    contract_status text NOT NULL DEFAULT 'draft' CHECK (contract_status IN ('draft', 'active', 'expired', 'terminated')),
    signed_date date,
    signed_by_employee boolean DEFAULT false,
    signed_by_company boolean DEFAULT false,
    contract_file_url text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_employment_contracts_tenant ON employment_contracts(tenant_id);
CREATE INDEX idx_employment_contracts_employee ON employment_contracts(employee_id);
CREATE INDEX idx_employment_contracts_number ON employment_contracts(contract_number);
CREATE INDEX idx_employment_contracts_status ON employment_contracts(contract_status);

-- ==================== 2. 社保记录表 ====================
CREATE TABLE IF NOT EXISTS social_security_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    social_security_number text,
    start_date date NOT NULL,
    end_date date,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
    pension_base numeric(12,2) NOT NULL,
    medical_base numeric(12,2) NOT NULL,
    unemployment_base numeric(12,2) NOT NULL,
    work_injury_base numeric(12,2) NOT NULL,
    maternity_base numeric(12,2) NOT NULL,
    housing_fund_base numeric(12,2) NOT NULL,
    company_pension numeric(12,2) NOT NULL,
    company_medical numeric(12,2) NOT NULL,
    company_unemployment numeric(12,2) NOT NULL,
    company_work_injury numeric(12,2) NOT NULL,
    company_maternity numeric(12,2) NOT NULL,
    company_housing_fund numeric(12,2) NOT NULL,
    personal_pension numeric(12,2) NOT NULL,
    personal_medical numeric(12,2) NOT NULL,
    personal_unemployment numeric(12,2) NOT NULL,
    personal_housing_fund numeric(12,2) NOT NULL,
    total_company_contribution numeric(12,2) NOT NULL,
    total_personal_contribution numeric(12,2) NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_social_security_records_tenant ON social_security_records(tenant_id);
CREATE INDEX idx_social_security_records_employee ON social_security_records(employee_id);
CREATE INDEX idx_social_security_records_status ON social_security_records(status);

-- ==================== 3. 社保缴纳记录表 ====================
CREATE TABLE IF NOT EXISTS social_security_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    record_id uuid NOT NULL,
    payment_month text NOT NULL,
    payment_date date,
    company_amount numeric(12,2) NOT NULL,
    personal_amount numeric(12,2) NOT NULL,
    total_amount numeric(12,2) NOT NULL,
    payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    payment_method text,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_social_security_payments_tenant ON social_security_payments(tenant_id);
CREATE INDEX idx_social_security_payments_employee ON social_security_payments(employee_id);
CREATE INDEX idx_social_security_payments_record ON social_security_payments(record_id);
CREATE INDEX idx_social_security_payments_month ON social_security_payments(payment_month);
CREATE INDEX idx_social_security_payments_status ON social_security_payments(payment_status);

-- ==================== 4. 员工状态变更记录表 ====================
CREATE TABLE IF NOT EXISTS employee_status_changes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL,
    employee_id uuid NOT NULL,
    change_type text NOT NULL CHECK (change_type IN ('probation_to_regular', 'contract_renewal', 'termination', 'resignation')),
    from_status text NOT NULL,
    to_status text NOT NULL,
    change_date date NOT NULL,
    reason text,
    approved_by uuid,
    approved_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_employee_status_changes_tenant ON employee_status_changes(tenant_id);
CREATE INDEX idx_employee_status_changes_employee ON employee_status_changes(employee_id);
CREATE INDEX idx_employee_status_changes_type ON employee_status_changes(change_type);

-- ==================== 5. 更新时间触发器 ====================
CREATE TRIGGER update_employment_contracts_updated_at BEFORE UPDATE ON employment_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_security_records_updated_at BEFORE UPDATE ON social_security_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_security_payments_updated_at BEFORE UPDATE ON social_security_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_status_changes_updated_at BEFORE UPDATE ON employee_status_changes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== 6. 插入示例数据 ====================

-- 示例：社保缴纳比例配置（可以根据实际地区调整）
-- 这里使用注释说明标准比例，实际计算在应用层完成
/*
标准社保缴纳比例（以北京为例）：
- 养老保险：公司16%，个人8%
- 医疗保险：公司9.8%，个人2%
- 失业保险：公司0.5%，个人0.5%
- 工伤保险：公司0.2%-1.9%（根据行业），个人0%
- 生育保险：公司0.8%，个人0%
- 住房公积金：公司5%-12%，个人5%-12%（比例相同）
*/

-- ==================== 7. RLS 安全策略 ====================

-- 启用 RLS
ALTER TABLE employment_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_security_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_security_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_status_changes ENABLE ROW LEVEL SECURITY;

-- 劳动合同表策略
CREATE POLICY "员工可以查看自己的合同" ON employment_contracts
    FOR SELECT USING (employee_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "管理员可以管理所有合同" ON employment_contracts
    FOR ALL USING (is_admin(auth.uid()));

-- 社保记录表策略
CREATE POLICY "员工可以查看自己的社保记录" ON social_security_records
    FOR SELECT USING (employee_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "管理员可以管理所有社保记录" ON social_security_records
    FOR ALL USING (is_admin(auth.uid()));

-- 社保缴纳记录表策略
CREATE POLICY "员工可以查看自己的社保缴纳记录" ON social_security_payments
    FOR SELECT USING (employee_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "管理员可以管理所有社保缴纳记录" ON social_security_payments
    FOR ALL USING (is_admin(auth.uid()));

-- 员工状态变更记录表策略
CREATE POLICY "员工可以查看自己的状态变更记录" ON employee_status_changes
    FOR SELECT USING (employee_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "管理员可以管理所有状态变更记录" ON employee_status_changes
    FOR ALL USING (is_admin(auth.uid()));
