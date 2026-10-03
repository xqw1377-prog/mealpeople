/**
 * 劳动合同和社保管理 - TypeScript 类型定义
 *
 * 设计理念：容易学、容易做、容易管
 *
 * 核心流程：
 * 试用期评估 → 确定转正/终止 → 签订劳动合同 → 社保办理 → 正式入职
 */

// ==================== 劳动合同 ====================

export type ContractType = 'fixed_term' | 'indefinite' | 'project_based'
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated'

export interface EmploymentContract {
  id: string
  tenant_id: string
  employee_id: string
  contract_number: string
  contract_type: ContractType
  start_date: string
  end_date: string | null
  duration_years: number | null
  position: string
  department: string | null
  salary: number
  work_location: string | null
  contract_status: ContractStatus
  signed_date: string | null
  signed_by_employee: boolean
  signed_by_company: boolean
  contract_file_url: string | null
  notes: string | null
  // 电子签名相关字段
  employee_signature_url: string | null
  employee_signature_date: string | null
  employee_signature_ip: string | null
  company_signature_url: string | null
  company_signature_date: string | null
  company_signature_ip: string | null
  company_signer_name: string | null
  company_signer_position: string | null
  contract_pdf_url: string | null
  contract_template_version: string | null
  created_at: string
  updated_at: string
}

// ==================== 社保记录 ====================

export type SocialSecurityStatus = 'active' | 'suspended' | 'terminated'

export interface SocialSecurityRecord {
  id: string
  tenant_id: string
  employee_id: string
  social_security_number: string | null
  start_date: string
  end_date: string | null
  status: SocialSecurityStatus
  pension_base: number
  medical_base: number
  unemployment_base: number
  work_injury_base: number
  maternity_base: number
  housing_fund_base: number
  company_pension: number
  company_medical: number
  company_unemployment: number
  company_work_injury: number
  company_maternity: number
  company_housing_fund: number
  personal_pension: number
  personal_medical: number
  personal_unemployment: number
  personal_housing_fund: number
  total_company_contribution: number
  total_personal_contribution: number
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 社保缴纳记录 ====================

export type PaymentStatus = 'pending' | 'paid' | 'failed'

export interface SocialSecurityPayment {
  id: string
  tenant_id: string
  employee_id: string
  record_id: string
  payment_month: string
  payment_date: string | null
  company_amount: number
  personal_amount: number
  total_amount: number
  payment_status: PaymentStatus
  payment_method: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 员工状态变更记录 ====================

export type EmployeeChangeType = 'probation_to_regular' | 'contract_renewal' | 'termination' | 'resignation'

export interface EmployeeStatusChange {
  id: string
  tenant_id: string
  employee_id: string
  change_type: EmployeeChangeType
  from_status: string
  to_status: string
  change_date: string
  reason: string | null
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 扩展类型（带关联数据） ====================

export interface EmploymentContractWithDetails extends EmploymentContract {
  employee_name?: string
  employee_phone?: string
}

export interface SocialSecurityRecordWithDetails extends SocialSecurityRecord {
  employee_name?: string
  employee_phone?: string
}

export interface SocialSecurityPaymentWithDetails extends SocialSecurityPayment {
  employee_name?: string
  record?: SocialSecurityRecord
}

export interface EmployeeStatusChangeWithDetails extends EmployeeStatusChange {
  employee_name?: string
  approver_name?: string
}

// ==================== 统计数据类型 ====================

export interface ContractStats {
  total_contracts: number
  active_contracts: number
  expiring_soon: number
  expired_contracts: number
  by_type: {
    type: ContractType
    count: number
  }[]
}

export interface SocialSecurityStats {
  total_employees: number
  active_employees: number
  suspended_employees: number
  total_company_contribution: number
  total_personal_contribution: number
  monthly_average: number
}

// ==================== 社保计算配置 ====================

export interface SocialSecurityRates {
  pension_company: number // 养老保险公司比例
  pension_personal: number // 养老保险个人比例
  medical_company: number // 医疗保险公司比例
  medical_personal: number // 医疗保险个人比例
  unemployment_company: number // 失业保险公司比例
  unemployment_personal: number // 失业保险个人比例
  work_injury_company: number // 工伤保险公司比例
  maternity_company: number // 生育保险公司比例
  housing_fund_company: number // 住房公积金公司比例
  housing_fund_personal: number // 住房公积金个人比例
}

// 默认社保缴纳比例（以北京为例）
export const DEFAULT_SOCIAL_SECURITY_RATES: SocialSecurityRates = {
  pension_company: 0.16,
  pension_personal: 0.08,
  medical_company: 0.098,
  medical_personal: 0.02,
  unemployment_company: 0.005,
  unemployment_personal: 0.005,
  work_injury_company: 0.002,
  maternity_company: 0.008,
  housing_fund_company: 0.12,
  housing_fund_personal: 0.12
}

// ==================== 创建/更新输入类型 ====================

export type CreateEmploymentContractInput = Omit<
  EmploymentContract,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'employee_signature_url'
  | 'employee_signature_date'
  | 'employee_signature_ip'
  | 'company_signature_url'
  | 'company_signature_date'
  | 'company_signature_ip'
  | 'company_signer_name'
  | 'company_signer_position'
  | 'contract_pdf_url'
  | 'contract_template_version'
> & {
  // 电子签名字段为可选
  employee_signature_url?: string | null
  employee_signature_date?: string | null
  employee_signature_ip?: string | null
  company_signature_url?: string | null
  company_signature_date?: string | null
  company_signature_ip?: string | null
  company_signer_name?: string | null
  company_signer_position?: string | null
  contract_pdf_url?: string | null
  contract_template_version?: string | null
}

export type UpdateEmploymentContractInput = Partial<Omit<EmploymentContract, 'id' | 'created_at' | 'updated_at'>>

export type CreateSocialSecurityRecordInput = Omit<SocialSecurityRecord, 'id' | 'created_at' | 'updated_at'>
export type UpdateSocialSecurityRecordInput = Partial<Omit<SocialSecurityRecord, 'id' | 'created_at' | 'updated_at'>>

export type CreateSocialSecurityPaymentInput = Omit<SocialSecurityPayment, 'id' | 'created_at' | 'updated_at'>
export type UpdateSocialSecurityPaymentInput = Partial<Omit<SocialSecurityPayment, 'id' | 'created_at' | 'updated_at'>>

export type CreateEmployeeStatusChangeInput = Omit<EmployeeStatusChange, 'id' | 'created_at' | 'updated_at'>
export type UpdateEmployeeStatusChangeInput = Partial<Omit<EmployeeStatusChange, 'id' | 'created_at' | 'updated_at'>>
