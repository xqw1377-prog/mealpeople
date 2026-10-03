/*
# 劳动合同电子签名功能扩展

## 1. 功能说明
为劳动合同表添加电子签名相关字段，支持：
- 员工电子签名
- 公司/HR电子签名
- 签名时间戳记录
- 签名IP地址记录（用于法律追溯）
- 签名图片存储

## 2. 新增字段

### 2.1 员工签名相关
- `employee_signature_url` (text) - 员工签名图片URL
- `employee_signature_date` (timestamptz) - 员工签名时间
- `employee_signature_ip` (text) - 员工签名IP地址

### 2.2 公司签名相关
- `company_signature_url` (text) - 公司签名图片URL
- `company_signature_date` (timestamptz) - 公司签名时间
- `company_signature_ip` (text) - 公司签名IP地址
- `company_signer_name` (text) - 公司签署人姓名
- `company_signer_position` (text) - 公司签署人职位

### 2.3 合同电子版
- `contract_pdf_url` (text) - 合同PDF文件URL（签署完成后生成）
- `contract_template_version` (text) - 合同模板版本号

## 3. 安全说明
- 签名图片存储在 Supabase Storage 中
- 签名IP地址用于法律追溯和安全审计
- 签名时间戳不可修改，确保法律效力
*/

-- 添加员工签名相关字段
ALTER TABLE employment_contracts
ADD COLUMN IF NOT EXISTS employee_signature_url text,
ADD COLUMN IF NOT EXISTS employee_signature_date timestamptz,
ADD COLUMN IF NOT EXISTS employee_signature_ip text;

-- 添加公司签名相关字段
ALTER TABLE employment_contracts
ADD COLUMN IF NOT EXISTS company_signature_url text,
ADD COLUMN IF NOT EXISTS company_signature_date timestamptz,
ADD COLUMN IF NOT EXISTS company_signature_ip text,
ADD COLUMN IF NOT EXISTS company_signer_name text,
ADD COLUMN IF NOT EXISTS company_signer_position text;

-- 添加合同电子版相关字段
ALTER TABLE employment_contracts
ADD COLUMN IF NOT EXISTS contract_pdf_url text,
ADD COLUMN IF NOT EXISTS contract_template_version text DEFAULT 'v1.0';

-- 添加注释
COMMENT ON COLUMN employment_contracts.employee_signature_url IS '员工电子签名图片URL';
COMMENT ON COLUMN employment_contracts.employee_signature_date IS '员工签名时间戳';
COMMENT ON COLUMN employment_contracts.employee_signature_ip IS '员工签名IP地址（用于法律追溯）';
COMMENT ON COLUMN employment_contracts.company_signature_url IS '公司电子签名图片URL';
COMMENT ON COLUMN employment_contracts.company_signature_date IS '公司签名时间戳';
COMMENT ON COLUMN employment_contracts.company_signature_ip IS '公司签名IP地址（用于法律追溯）';
COMMENT ON COLUMN employment_contracts.company_signer_name IS '公司签署人姓名';
COMMENT ON COLUMN employment_contracts.company_signer_position IS '公司签署人职位';
COMMENT ON COLUMN employment_contracts.contract_pdf_url IS '签署完成后生成的合同PDF文件URL';
COMMENT ON COLUMN employment_contracts.contract_template_version IS '合同模板版本号';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_employment_contracts_employee_signed 
ON employment_contracts(employee_id, signed_by_employee) 
WHERE signed_by_employee = false;

CREATE INDEX IF NOT EXISTS idx_employment_contracts_company_signed 
ON employment_contracts(tenant_id, signed_by_company) 
WHERE signed_by_company = false;

CREATE INDEX IF NOT EXISTS idx_employment_contracts_status 
ON employment_contracts(tenant_id, contract_status);