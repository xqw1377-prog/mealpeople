// 薪酬福利管理API接口

import {supabase} from '@/client/supabase'
import type {
  BenefitStatistics,
  BenefitType,
  EmployeeBenefitWithType,
  SalaryBenefitData,
  SalaryRecord,
  SalaryStatistics,
  SalaryStructure
} from './types-salary'

// ==================== 薪酬结构 ====================

/**
 * 获取员工当前薪酬结构
 */
export async function getEmployeeCurrentSalaryStructure(employeeId: string): Promise<SalaryStructure | null> {
  const {data, error} = await supabase
    .from('salary_structures')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .order('effective_date', {ascending: false})
    .maybeSingle()

  if (error) {
    console.error('获取薪酬结构失败:', error)
    return null
  }

  return data
}

// ==================== 工资记录 ====================

/**
 * 获取员工的工资记录列表
 */
export async function getEmployeeSalaryRecords(employeeId: string): Promise<SalaryRecord[]> {
  const {data, error} = await supabase
    .from('salary_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('year', {ascending: false})
    .order('month', {ascending: false})

  if (error) {
    console.error('获取工资记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取员工指定月份的工资记录
 */
export async function getEmployeeSalaryRecord(
  employeeId: string,
  year: number,
  month: number
): Promise<SalaryRecord | null> {
  const {data, error} = await supabase
    .from('salary_records')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  if (error) {
    console.error('获取工资记录失败:', error)
    return null
  }

  return data
}

// ==================== 福利类型 ====================

/**
 * 获取活跃的福利类型列表
 */
export async function getActiveBenefitTypes(tenantId: string): Promise<BenefitType[]> {
  const {data, error} = await supabase
    .from('benefit_types')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('type_code', {ascending: true})

  if (error) {
    console.error('获取福利类型失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 员工福利 ====================

/**
 * 获取员工的福利列表
 */
export async function getEmployeeBenefits(employeeId: string): Promise<EmployeeBenefitWithType[]> {
  const {data, error} = await supabase
    .from('employee_benefits')
    .select(
      `
      *,
      benefit_type:benefit_types(*)
    `
    )
    .eq('employee_id', employeeId)
    .order('start_date', {ascending: false})

  if (error) {
    console.error('获取员工福利失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 统计数据 ====================

/**
 * 获取薪酬统计
 */
export async function getSalaryStatistics(employeeId: string): Promise<SalaryStatistics> {
  const records = await getEmployeeSalaryRecords(employeeId)

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

  // 当月工资
  const currentMonthRecord = records.find((r) => r.year === currentYear && r.month === currentMonth)
  const currentMonthSalary = currentMonthRecord ? Number(currentMonthRecord.net_salary) : 0

  // 上月工资
  const lastMonthRecord = records.find((r) => r.year === lastMonthYear && r.month === lastMonth)
  const lastMonthSalary = lastMonthRecord ? Number(lastMonthRecord.net_salary) : 0

  // 本年度总工资
  const yearRecords = records.filter((r) => r.year === currentYear && r.status === 'paid')
  const yearTotalSalary = yearRecords.reduce((sum, r) => sum + Number(r.net_salary), 0)

  // 平均月工资
  const averageMonthlySalary = yearRecords.length > 0 ? yearTotalSalary / yearRecords.length : 0

  return {
    current_month_salary: currentMonthSalary,
    last_month_salary: lastMonthSalary,
    year_total_salary: yearTotalSalary,
    average_monthly_salary: averageMonthlySalary,
    total_records: records.length
  }
}

/**
 * 获取福利统计
 */
export async function getBenefitStatistics(employeeId: string): Promise<BenefitStatistics> {
  const benefits = await getEmployeeBenefits(employeeId)

  const totalBenefits = benefits.length
  const activeBenefits = benefits.filter((b) => b.status === 'active').length

  const totalQuota = benefits.filter((b) => b.quota !== null).reduce((sum, b) => sum + Number(b.quota), 0)

  const usedQuota = benefits.filter((b) => b.used_quota !== null).reduce((sum, b) => sum + Number(b.used_quota), 0)

  const remainingQuota = totalQuota - usedQuota

  return {
    total_benefits: totalBenefits,
    active_benefits: activeBenefits,
    total_quota: totalQuota,
    used_quota: usedQuota,
    remaining_quota: remainingQuota
  }
}

/**
 * 获取员工薪酬福利数据
 */
export async function getEmployeeSalaryBenefitData(employeeId: string): Promise<SalaryBenefitData | null> {
  try {
    // 获取当前薪酬结构
    const currentStructure = await getEmployeeCurrentSalaryStructure(employeeId)

    // 获取最近的工资记录
    const allRecords = await getEmployeeSalaryRecords(employeeId)
    const recentRecords = allRecords.slice(0, 12)

    // 获取福利列表
    const benefits = await getEmployeeBenefits(employeeId)

    // 获取统计数据
    const salaryStatistics = await getSalaryStatistics(employeeId)
    const benefitStatistics = await getBenefitStatistics(employeeId)

    return {
      current_structure: currentStructure,
      recent_records: recentRecords,
      benefits,
      salary_statistics: salaryStatistics,
      benefit_statistics: benefitStatistics
    }
  } catch (error) {
    console.error('获取薪酬福利数据失败:', error)
    return null
  }
}

/**
 * 计算薪酬总额
 */
export function calculateTotalSalary(structure: SalaryStructure): number {
  return (
    Number(structure.base_salary) +
    Number(structure.performance_salary || 0) +
    Number(structure.position_allowance || 0) +
    Number(structure.meal_allowance || 0) +
    Number(structure.transport_allowance || 0) +
    Number(structure.housing_allowance || 0) +
    Number(structure.other_allowance || 0)
  )
}

/**
 * 格式化金额
 */
export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}
