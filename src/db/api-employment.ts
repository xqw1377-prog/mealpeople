/**
 * 劳动合同和社保管理 - API 实现
 *
 * 设计理念：容易学、容易做、容易管
 *
 * 功能模块：
 * 1. 劳动合同管理
 * 2. 社保记录管理
 * 3. 社保缴纳管理
 * 4. 员工状态变更管理
 * 5. 试用期转正流程
 */

import {supabase} from '@/client/supabase'
import type {
  ContractStats,
  CreateEmployeeStatusChangeInput,
  CreateEmploymentContractInput,
  CreateSocialSecurityPaymentInput,
  CreateSocialSecurityRecordInput,
  EmployeeStatusChange,
  EmploymentContract,
  SocialSecurityPayment,
  SocialSecurityRates,
  SocialSecurityRecord,
  SocialSecurityStats,
  UpdateEmploymentContractInput,
  UpdateSocialSecurityRecordInput
} from './types-employment'
import {DEFAULT_SOCIAL_SECURITY_RATES} from './types-employment'

// ==================== 1. 劳动合同管理 ====================

/**
 * 生成唯一的合同编号
 */
export function generateContractNumber(_tenantId: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `CT-${year}${month}-${random}`
}

/**
 * 创建劳动合同
 */
export async function createEmploymentContract(
  input: CreateEmploymentContractInput
): Promise<EmploymentContract | null> {
  try {
    const {data, error} = await supabase.from('employment_contracts').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建劳动合同失败:', error)
      return null
    }

    // 创建成功后，通知员工有新合同待签署
    if (data) {
      await sendContractNotification(data, data.employee_id, 'contract_created')
    }

    return data
  } catch (error) {
    console.error('创建劳动合同异常:', error)
    return null
  }
}

/**
 * 获取员工的劳动合同
 */
export async function getEmployeeContracts(employeeId: string): Promise<EmploymentContract[]> {
  try {
    const {data, error} = await supabase
      .from('employment_contracts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', {ascending: false})

    if (error) {
      console.error('获取员工劳动合同失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取员工劳动合同异常:', error)
    return []
  }
}

/**
 * 获取员工当前有效的劳动合同
 */
export async function getEmployeeActiveContract(employeeId: string): Promise<EmploymentContract | null> {
  try {
    const {data, error} = await supabase
      .from('employment_contracts')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('contract_status', 'active')
      .maybeSingle()

    if (error) {
      console.error('获取员工当前合同失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取员工当前合同异常:', error)
    return null
  }
}

/**
 * 获取租户的所有劳动合同
 */
export async function getTenantContracts(tenantId: string): Promise<EmploymentContract[]> {
  try {
    const {data, error} = await supabase
      .from('employment_contracts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', {ascending: false})

    if (error) {
      console.error('获取租户劳动合同失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取租户劳动合同异常:', error)
    return []
  }
}

/**
 * 更新劳动合同
 */
export async function updateEmploymentContract(
  id: string,
  updates: UpdateEmploymentContractInput
): Promise<EmploymentContract | null> {
  try {
    const {data, error} = await supabase
      .from('employment_contracts')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('更新劳动合同失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('更新劳动合同异常:', error)
    return null
  }
}

/**
 * 公司签署合同（旧版本，已废弃，请使用 signContractByCompanyWithSignature）
 */
export async function signContractByCompany(contractId: string): Promise<boolean> {
  try {
    // 检查员工是否已签署
    const {data: contract} = await supabase.from('employment_contracts').select('*').eq('id', contractId).maybeSingle()

    if (!contract) {
      console.error('合同不存在')
      return false
    }

    const updates: any = {
      signed_by_company: true
    }

    // 如果双方都已签署，激活合同
    if (contract.signed_by_employee) {
      updates.contract_status = 'active'
      if (!contract.signed_date) {
        updates.signed_date = new Date().toISOString().split('T')[0]
      }
    }

    const {error} = await supabase.from('employment_contracts').update(updates).eq('id', contractId)

    if (error) {
      console.error('公司签署合同失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('公司签署合同异常:', error)
    return false
  }
}

/**
 * 获取即将到期的合同
 */
export async function getExpiringContracts(
  tenantId: string,
  daysBeforeExpiry: number = 30
): Promise<EmploymentContract[]> {
  try {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysBeforeExpiry)

    const {data, error} = await supabase
      .from('employment_contracts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('contract_status', 'active')
      .not('end_date', 'is', null)
      .lte('end_date', futureDate.toISOString().split('T')[0])
      .gte('end_date', today.toISOString().split('T')[0])
      .order('end_date', {ascending: true})

    if (error) {
      console.error('获取即将到期合同失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取即将到期合同异常:', error)
    return []
  }
}

// ==================== 2. 社保记录管理 ====================

/**
 * 计算社保缴纳金额
 */
export function calculateSocialSecurity(
  salary: number,
  rates: SocialSecurityRates = DEFAULT_SOCIAL_SECURITY_RATES
): CreateSocialSecurityRecordInput {
  // 社保基数通常等于工资，但可能有上下限
  const base = salary

  return {
    tenant_id: '', // 需要在调用时填充
    employee_id: '', // 需要在调用时填充
    social_security_number: null,
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    status: 'active',
    pension_base: base,
    medical_base: base,
    unemployment_base: base,
    work_injury_base: base,
    maternity_base: base,
    housing_fund_base: base,
    company_pension: Math.round(base * rates.pension_company * 100) / 100,
    company_medical: Math.round(base * rates.medical_company * 100) / 100,
    company_unemployment: Math.round(base * rates.unemployment_company * 100) / 100,
    company_work_injury: Math.round(base * rates.work_injury_company * 100) / 100,
    company_maternity: Math.round(base * rates.maternity_company * 100) / 100,
    company_housing_fund: Math.round(base * rates.housing_fund_company * 100) / 100,
    personal_pension: Math.round(base * rates.pension_personal * 100) / 100,
    personal_medical: Math.round(base * rates.medical_personal * 100) / 100,
    personal_unemployment: Math.round(base * rates.unemployment_personal * 100) / 100,
    personal_housing_fund: Math.round(base * rates.housing_fund_personal * 100) / 100,
    total_company_contribution:
      Math.round(
        (base * rates.pension_company +
          base * rates.medical_company +
          base * rates.unemployment_company +
          base * rates.work_injury_company +
          base * rates.maternity_company +
          base * rates.housing_fund_company) *
          100
      ) / 100,
    total_personal_contribution:
      Math.round(
        (base * rates.pension_personal +
          base * rates.medical_personal +
          base * rates.unemployment_personal +
          base * rates.housing_fund_personal) *
          100
      ) / 100,
    notes: null
  }
}

/**
 * 创建社保记录
 */
export async function createSocialSecurityRecord(
  input: CreateSocialSecurityRecordInput
): Promise<SocialSecurityRecord | null> {
  try {
    const {data, error} = await supabase.from('social_security_records').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建社保记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建社保记录异常:', error)
    return null
  }
}

/**
 * 获取员工的社保记录
 */
export async function getEmployeeSocialSecurityRecord(employeeId: string): Promise<SocialSecurityRecord | null> {
  try {
    const {data, error} = await supabase
      .from('social_security_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error('获取员工社保记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取员工社保记录异常:', error)
    return null
  }
}

/**
 * 获取租户的所有社保记录
 */
export async function getTenantSocialSecurityRecords(tenantId: string): Promise<SocialSecurityRecord[]> {
  try {
    const {data, error} = await supabase
      .from('social_security_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', {ascending: false})

    if (error) {
      console.error('获取租户社保记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取租户社保记录异常:', error)
    return []
  }
}

/**
 * 更新社保记录
 */
export async function updateSocialSecurityRecord(
  id: string,
  updates: UpdateSocialSecurityRecordInput
): Promise<SocialSecurityRecord | null> {
  try {
    const {data, error} = await supabase
      .from('social_security_records')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('更新社保记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('更新社保记录异常:', error)
    return null
  }
}

/**
 * 停止社保
 */
export async function terminateSocialSecurity(recordId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('social_security_records')
      .update({
        status: 'terminated',
        end_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', recordId)

    if (error) {
      console.error('停止社保失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('停止社保异常:', error)
    return false
  }
}

// ==================== 3. 社保缴纳管理 ====================

/**
 * 创建社保缴纳记录
 */
export async function createSocialSecurityPayment(
  input: CreateSocialSecurityPaymentInput
): Promise<SocialSecurityPayment | null> {
  try {
    const {data, error} = await supabase.from('social_security_payments').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建社保缴纳记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建社保缴纳记录异常:', error)
    return null
  }
}

/**
 * 获取员工的社保缴纳记录
 */
export async function getEmployeeSocialSecurityPayments(employeeId: string): Promise<SocialSecurityPayment[]> {
  try {
    const {data, error} = await supabase
      .from('social_security_payments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('payment_month', {ascending: false})

    if (error) {
      console.error('获取员工社保缴纳记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取员工社保缴纳记录异常:', error)
    return []
  }
}

/**
 * 批量生成月度社保缴纳记录
 */
export async function generateMonthlySocialSecurityPayments(
  tenantId: string,
  month: string
): Promise<SocialSecurityPayment[]> {
  try {
    // 获取所有活跃的社保记录
    const {data: records} = await supabase
      .from('social_security_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')

    if (!records || records.length === 0) {
      return []
    }

    // 为每个员工创建缴纳记录
    const payments: CreateSocialSecurityPaymentInput[] = records.map((record) => ({
      tenant_id: tenantId,
      employee_id: record.employee_id,
      record_id: record.id,
      payment_month: month,
      payment_date: null,
      company_amount: record.total_company_contribution,
      personal_amount: record.total_personal_contribution,
      total_amount: record.total_company_contribution + record.total_personal_contribution,
      payment_status: 'pending',
      payment_method: null,
      notes: null
    }))

    const {data, error} = await supabase.from('social_security_payments').insert(payments).select()

    if (error) {
      console.error('批量生成社保缴纳记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('批量生成社保缴纳记录异常:', error)
    return []
  }
}

/**
 * 获取租户的社保缴纳记录（按月份）
 */
export async function getTenantPaymentRecords(tenantId: string, month: string): Promise<SocialSecurityPayment[]> {
  try {
    const {data, error} = await supabase
      .from('social_security_payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('payment_month', month)
      .order('payment_date', {ascending: false})

    if (error) {
      console.error('获取社保缴纳记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取社保缴纳记录异常:', error)
    return []
  }
}

/**
 * 标记社保缴纳完成
 */
export async function markPaymentAsPaid(paymentId: string, paymentMethod: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('social_security_payments')
      .update({
        payment_status: 'paid',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod
      })
      .eq('id', paymentId)

    if (error) {
      console.error('标记社保缴纳完成失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('标记社保缴纳完成异常:', error)
    return false
  }
}

// ==================== 4. 员工状态变更管理 ====================

/**
 * 创建员工状态变更记录
 */
export async function createEmployeeStatusChange(
  input: CreateEmployeeStatusChangeInput
): Promise<EmployeeStatusChange | null> {
  try {
    const {data, error} = await supabase.from('employee_status_changes').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建员工状态变更记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建员工状态变更记录异常:', error)
    return null
  }
}

/**
 * 获取员工的状态变更记录
 */
export async function getEmployeeStatusChanges(employeeId: string): Promise<EmployeeStatusChange[]> {
  try {
    const {data, error} = await supabase
      .from('employee_status_changes')
      .select('*')
      .eq('employee_id', employeeId)
      .order('change_date', {ascending: false})

    if (error) {
      console.error('获取员工状态变更记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取员工状态变更记录异常:', error)
    return []
  }
}

// ==================== 5. 试用期转正流程 ====================

/**
 * 试用期转正（完整流程）
 * 1. 更新试用期状态
 * 2. 创建状态变更记录
 * 3. 生成劳动合同
 * 4. 创建社保记录
 */
export async function convertProbationToRegular(
  tenantId: string,
  employeeId: string,
  probationId: string,
  contractData: {
    position: string
    department: string
    salary: number
    work_location: string
    contract_type: 'fixed_term' | 'indefinite' | 'project_based'
    duration_years?: number
  },
  approvedBy: string
): Promise<{success: boolean; contract?: EmploymentContract; socialSecurity?: SocialSecurityRecord}> {
  try {
    // 1. 更新试用期状态为通过
    const {error: probationError} = await supabase
      .from('probation_periods')
      .update({
        status: 'passed',
        final_decision: 'convert',
        decision_date: new Date().toISOString()
      })
      .eq('id', probationId)

    if (probationError) {
      console.error('更新试用期状态失败:', probationError)
      return {success: false}
    }

    // 2. 创建状态变更记录
    await createEmployeeStatusChange({
      tenant_id: tenantId,
      employee_id: employeeId,
      change_type: 'probation_to_regular',
      from_status: 'probation',
      to_status: 'regular',
      change_date: new Date().toISOString().split('T')[0],
      reason: '试用期考核通过，转为正式员工',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      notes: null
    })

    // 3. 生成劳动合同
    const contractNumber = generateContractNumber(tenantId)
    const startDate = new Date()
    const endDate = contractData.contract_type === 'indefinite' ? null : new Date()
    if (endDate && contractData.duration_years) {
      endDate.setFullYear(endDate.getFullYear() + contractData.duration_years)
    }

    const contract = await createEmploymentContract({
      tenant_id: tenantId,
      employee_id: employeeId,
      contract_number: contractNumber,
      contract_type: contractData.contract_type,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate ? endDate.toISOString().split('T')[0] : null,
      duration_years: contractData.duration_years || null,
      position: contractData.position,
      department: contractData.department,
      salary: contractData.salary,
      work_location: contractData.work_location,
      contract_status: 'draft',
      signed_date: null,
      signed_by_employee: false,
      signed_by_company: false,
      contract_file_url: null,
      notes: '试用期转正自动生成'
    })

    // 4. 创建社保记录
    const socialSecurityData = calculateSocialSecurity(contractData.salary)
    const socialSecurity = await createSocialSecurityRecord({
      ...socialSecurityData,
      tenant_id: tenantId,
      employee_id: employeeId
    })

    return {
      success: true,
      contract: contract || undefined,
      socialSecurity: socialSecurity || undefined
    }
  } catch (error) {
    console.error('试用期转正流程异常:', error)
    return {success: false}
  }
}

// ==================== 6. 统计分析 ====================

/**
 * 获取合同统计
 */
export async function getContractStats(tenantId: string): Promise<ContractStats> {
  try {
    const contracts = await getTenantContracts(tenantId)
    const expiringContracts = await getExpiringContracts(tenantId, 30)

    const totalContracts = contracts.length
    const activeContracts = contracts.filter((c) => c.contract_status === 'active').length
    const expiredContracts = contracts.filter((c) => c.contract_status === 'expired').length

    // 按类型统计
    const byType: {type: any; count: number}[] = []
    const types = [...new Set(contracts.map((c) => c.contract_type))]
    types.forEach((type) => {
      const count = contracts.filter((c) => c.contract_type === type).length
      byType.push({type, count})
    })

    return {
      total_contracts: totalContracts,
      active_contracts: activeContracts,
      expiring_soon: expiringContracts.length,
      expired_contracts: expiredContracts,
      by_type: byType
    }
  } catch (error) {
    console.error('获取合同统计异常:', error)
    return {
      total_contracts: 0,
      active_contracts: 0,
      expiring_soon: 0,
      expired_contracts: 0,
      by_type: []
    }
  }
}

/**
 * 获取社保统计
 */
export async function getSocialSecurityStats(tenantId: string): Promise<SocialSecurityStats> {
  try {
    const records = await getTenantSocialSecurityRecords(tenantId)

    const totalEmployees = records.length
    const activeEmployees = records.filter((r) => r.status === 'active').length
    const suspendedEmployees = records.filter((r) => r.status === 'suspended').length

    const totalCompanyContribution = records.reduce((sum, r) => sum + r.total_company_contribution, 0)
    const totalPersonalContribution = records.reduce((sum, r) => sum + r.total_personal_contribution, 0)
    const monthlyAverage =
      activeEmployees > 0 ? (totalCompanyContribution + totalPersonalContribution) / activeEmployees : 0

    return {
      total_employees: totalEmployees,
      active_employees: activeEmployees,
      suspended_employees: suspendedEmployees,
      total_company_contribution: Math.round(totalCompanyContribution * 100) / 100,
      total_personal_contribution: Math.round(totalPersonalContribution * 100) / 100,
      monthly_average: Math.round(monthlyAverage * 100) / 100
    }
  } catch (error) {
    console.error('获取社保统计异常:', error)
    return {
      total_employees: 0,
      active_employees: 0,
      suspended_employees: 0,
      total_company_contribution: 0,
      total_personal_contribution: 0,
      monthly_average: 0
    }
  }
}

// ==================== 6. 电子签名管理 ====================

/**
 * 员工签署合同
 */
export async function signContractByEmployee(
  contractId: string,
  signatureUrl: string,
  signatureIp: string
): Promise<boolean> {
  try {
    // 先获取合同信息
    const contract = await getContractWithSignatures(contractId)
    if (!contract) {
      console.error('合同不存在')
      return false
    }

    const {error} = await supabase
      .from('employment_contracts')
      .update({
        signed_by_employee: true,
        employee_signature_url: signatureUrl,
        employee_signature_date: new Date().toISOString(),
        employee_signature_ip: signatureIp
      })
      .eq('id', contractId)

    if (error) {
      console.error('员工签署合同失败:', error)
      return false
    }

    // 签署成功后，通知HR需要签署
    // 这里简化处理，实际应该查询租户的HR用户列表
    // 暂时不发送通知，因为需要HR用户ID
    // TODO: 实现获取租户HR用户列表的功能
    // const hrUsers = await getTenantHRUsers(contract.tenant_id)
    // for (const hrUser of hrUsers) {
    //   await sendContractNotification(contract, hrUser.id, 'employee_signed')
    // }

    return true
  } catch (error) {
    console.error('员工签署合同异常:', error)
    return false
  }
}

/**
 * 公司签署合同
 */
export async function signContractByCompanyWithSignature(
  contractId: string,
  signatureUrl: string,
  signatureIp: string,
  signerName: string,
  signerPosition: string
): Promise<boolean> {
  try {
    // 先获取合同信息
    const contract = await getContractWithSignatures(contractId)
    if (!contract) {
      console.error('合同不存在')
      return false
    }

    const {error} = await supabase
      .from('employment_contracts')
      .update({
        signed_by_company: true,
        company_signature_url: signatureUrl,
        company_signature_date: new Date().toISOString(),
        company_signature_ip: signatureIp,
        company_signer_name: signerName,
        company_signer_position: signerPosition,
        signed_date: new Date().toISOString().split('T')[0],
        contract_status: 'active'
      })
      .eq('id', contractId)

    if (error) {
      console.error('公司签署合同失败:', error)
      return false
    }

    // 签署成功后，通知员工合同已完成签署
    await sendContractNotification(contract, contract.employee_id, 'company_signed')

    return true
  } catch (error) {
    console.error('公司签署合同异常:', error)
    return false
  }
}

/**
 * 获取待签署的合同列表（员工端）
 */
export async function getPendingContractsForEmployee(employeeId: string): Promise<EmploymentContract[]> {
  try {
    const {data, error} = await supabase
      .from('employment_contracts')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('signed_by_employee', false)
      .order('created_at', {ascending: false})

    if (error) {
      console.error('获取待签署合同失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取待签署合同异常:', error)
    return []
  }
}

/**
 * 获取待签署的合同列表（HR端）
 */
export async function getPendingContractsForCompany(tenantId: string): Promise<EmploymentContract[]> {
  try {
    const {data, error} = await supabase
      .from('employment_contracts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('signed_by_employee', true)
      .eq('signed_by_company', false)
      .order('employee_signature_date', {ascending: true})

    if (error) {
      console.error('获取待签署合同失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取待签署合同异常:', error)
    return []
  }
}

/**
 * 保存合同PDF URL
 */
export async function saveContractPdfUrl(contractId: string, pdfUrl: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('employment_contracts').update({contract_pdf_url: pdfUrl}).eq('id', contractId)

    if (error) {
      console.error('保存合同PDF URL失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('保存合同PDF URL异常:', error)
    return false
  }
}

/**
 * 获取合同详情（包含签名信息）
 */
export async function getContractWithSignatures(contractId: string): Promise<EmploymentContract | null> {
  try {
    const {data, error} = await supabase.from('employment_contracts').select('*').eq('id', contractId).maybeSingle()

    if (error) {
      console.error('获取合同详情失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取合同详情异常:', error)
    return null
  }
}

/**
 * 发送合同签署通知
 * @param contract 合同信息
 * @param recipientUserId 接收通知的用户ID
 * @param notificationType 通知类型：'employee_signed' | 'company_signed' | 'contract_created' | 'contract_expiring'
 */
export async function sendContractNotification(
  contract: EmploymentContract,
  recipientUserId: string,
  notificationType: 'employee_signed' | 'company_signed' | 'contract_created' | 'contract_expiring'
): Promise<boolean> {
  try {
    const {createNotification} = await import('./api-notification')

    let title = ''
    let content = ''

    switch (notificationType) {
      case 'employee_signed':
        title = '合同待签署提醒'
        content = `员工已完成合同签署，合同编号：${contract.contract_number}，请尽快完成公司签署。`
        break
      case 'company_signed':
        title = '合同签署完成'
        content = `您的劳动合同已完成签署，合同编号：${contract.contract_number}，合同已生效。`
        break
      case 'contract_created':
        title = '新合同待签署'
        content = `您有一份新的劳动合同待签署，合同编号：${contract.contract_number}，请及时查看并签署。`
        break
      case 'contract_expiring':
        title = '合同即将到期提醒'
        content = `您的劳动合同即将到期，合同编号：${contract.contract_number}，到期日期：${contract.end_date}，请及时处理续签事宜。`
        break
    }

    const notification = await createNotification({
      tenant_id: contract.tenant_id,
      user_id: recipientUserId,
      type: 'contract',
      title,
      content,
      related_id: contract.id,
      related_type: 'employment_contract'
    })

    return notification !== null
  } catch (error) {
    console.error('发送合同通知失败:', error)
    return false
  }
}

/**
 * 批量发送合同到期提醒
 * @param tenantId 租户ID
 * @param daysBeforeExpiry 提前多少天提醒（默认30天）
 */
export async function sendExpiringContractNotifications(tenantId: string, daysBeforeExpiry = 30): Promise<number> {
  try {
    // 获取即将到期的合同
    const expiringContracts = await getExpiringContracts(tenantId, daysBeforeExpiry)

    if (expiringContracts.length === 0) {
      return 0
    }

    let successCount = 0

    // 为每份合同发送通知
    for (const contract of expiringContracts) {
      // 发送给员工
      const employeeNotified = await sendContractNotification(contract, contract.employee_id, 'contract_expiring')

      if (employeeNotified) {
        successCount++
      }

      // 发送给HR（需要获取租户的管理员用户）
      // 这里简化处理，实际应该查询租户的HR用户列表
      // const hrUsers = await getTenantHRUsers(tenantId)
      // for (const hrUser of hrUsers) {
      //   await sendContractNotification(contract, hrUser.id, 'contract_expiring')
      // }
    }

    return successCount
  } catch (error) {
    console.error('批量发送合同到期提醒失败:', error)
    return 0
  }
}
