// 薪酬福利管理相关类型定义

// ==================== 薪酬结构 ====================

// 薪酬结构表
export interface SalaryStructure {
  id: string
  tenant_id: string
  employee_id: string
  base_salary: number
  performance_salary: number
  position_allowance: number
  meal_allowance: number
  transport_allowance: number
  housing_allowance: number
  other_allowance: number
  effective_date: string
  end_date: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

// 创建薪酬结构输入
export interface CreateSalaryStructureInput {
  tenant_id: string
  employee_id: string
  base_salary: number
  performance_salary?: number
  position_allowance?: number
  meal_allowance?: number
  transport_allowance?: number
  housing_allowance?: number
  other_allowance?: number
  effective_date: string
  notes?: string
}

// ==================== 工资记录 ====================

// 工资状态
export type SalaryStatus = 'draft' | 'pending' | 'paid' | 'cancelled'

// 工资记录表
export interface SalaryRecord {
  id: string
  tenant_id: string
  employee_id: string
  salary_structure_id: string | null
  year: number
  month: number
  base_salary: number
  performance_salary: number
  allowances: number
  overtime_pay: number
  bonus: number
  deductions: number
  social_insurance: number
  housing_fund: number
  tax: number
  net_salary: number
  status: SalaryStatus
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 创建工资记录输入
export interface CreateSalaryRecordInput {
  tenant_id: string
  employee_id: string
  salary_structure_id?: string
  year: number
  month: number
  base_salary: number
  performance_salary?: number
  allowances?: number
  overtime_pay?: number
  bonus?: number
  deductions?: number
  social_insurance?: number
  housing_fund?: number
  tax?: number
  net_salary: number
  notes?: string
}

// ==================== 福利类型 ====================

// 福利分类
export type BenefitCategory = 'insurance' | 'allowance' | 'welfare' | 'other'

// 福利类型表
export interface BenefitType {
  id: string
  tenant_id: string
  type_name: string
  type_code: string
  category: BenefitCategory
  description: string | null
  is_mandatory: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// 创建福利类型输入
export interface CreateBenefitTypeInput {
  tenant_id: string
  type_name: string
  type_code: string
  category: BenefitCategory
  description?: string
  is_mandatory?: boolean
}

// ==================== 员工福利 ====================

// 福利状态
export type BenefitStatus = 'active' | 'inactive' | 'expired'

// 员工福利表
export interface EmployeeBenefit {
  id: string
  tenant_id: string
  employee_id: string
  benefit_type_id: string
  start_date: string
  end_date: string | null
  amount: number | null
  quota: number | null
  used_quota: number
  status: BenefitStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// 创建员工福利输入
export interface CreateEmployeeBenefitInput {
  tenant_id: string
  employee_id: string
  benefit_type_id: string
  start_date: string
  end_date?: string
  amount?: number
  quota?: number
  notes?: string
}

// ==================== 福利使用记录 ====================

// 福利使用记录表
export interface BenefitUsageRecord {
  id: string
  tenant_id: string
  employee_benefit_id: string
  employee_id: string
  usage_date: string
  amount: number
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

// ==================== 扩展类型 ====================

// 员工福利详情（包含类型信息）
export interface EmployeeBenefitWithType extends EmployeeBenefit {
  benefit_type: BenefitType
}

// 福利使用记录详情（包含福利信息）
export interface BenefitUsageRecordWithBenefit extends BenefitUsageRecord {
  employee_benefit: EmployeeBenefitWithType
}

// ==================== 统计数据 ====================

// 薪酬统计
export interface SalaryStatistics {
  current_month_salary: number
  last_month_salary: number
  year_total_salary: number
  average_monthly_salary: number
  total_records: number
}

// 福利统计
export interface BenefitStatistics {
  total_benefits: number
  active_benefits: number
  total_quota: number
  used_quota: number
  remaining_quota: number
}

// 薪酬福利数据
export interface SalaryBenefitData {
  current_structure: SalaryStructure | null
  recent_records: SalaryRecord[]
  benefits: EmployeeBenefitWithType[]
  salary_statistics: SalaryStatistics
  benefit_statistics: BenefitStatistics
}

// ==================== 常量定义 ====================

// 工资状态显示名称
export const SALARY_STATUS_NAMES: Record<SalaryStatus, string> = {
  draft: '草稿',
  pending: '待发放',
  paid: '已发放',
  cancelled: '已取消'
}

// 工资状态颜色
export const SALARY_STATUS_COLORS: Record<SalaryStatus, string> = {
  draft: 'text-gray-600',
  pending: 'text-orange-600',
  paid: 'text-green-600',
  cancelled: 'text-red-600'
}

// 福利分类显示名称
export const BENEFIT_CATEGORY_NAMES: Record<BenefitCategory, string> = {
  insurance: '保险',
  allowance: '补贴',
  welfare: '福利',
  other: '其他'
}

// 福利状态显示名称
export const BENEFIT_STATUS_NAMES: Record<BenefitStatus, string> = {
  active: '生效中',
  inactive: '未生效',
  expired: '已过期'
}

// 福利状态颜色
export const BENEFIT_STATUS_COLORS: Record<BenefitStatus, string> = {
  active: 'text-green-600',
  inactive: 'text-gray-600',
  expired: 'text-red-600'
}
