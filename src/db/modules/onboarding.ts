// 员工入职管理API

import {supabase} from '@/client/supabase'
import type {
  CreateOnboardingDocumentInput,
  CreateOnboardingInput,
  CreateProbationEvaluationInput,
  CreateRegularizationInput,
  EmployeeOnboarding,
  OnboardingDocument,
  ProbationEvaluation,
  RegularizationApplication
} from '../types'

// ==================== 入职申请管理 ====================

/**
 * 创建入职申请
 */
export async function createOnboarding(input: CreateOnboardingInput): Promise<EmployeeOnboarding | null> {
  const {data, error} = await supabase
    .from('employee_onboarding')
    .insert({
      tenant_id: input.tenant_id,
      store_id: input.store_id,
      name: input.name,
      phone: input.phone,
      id_card: input.id_card || null,
      email: input.email || null,
      emergency_contact_name: input.emergency_contact_name || null,
      emergency_contact_phone: input.emergency_contact_phone || null,
      department: input.department || null,
      position: input.position || null,
      onboarding_date: input.onboarding_date,
      probation_months: input.probation_months || 3,
      expected_salary: input.expected_salary || null,
      created_by: input.created_by || null,
      status: 'pending'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建入职申请失败:', error)
    return null
  }

  return data
}

/**
 * 查询入职申请列表（按租户）
 */
export async function getOnboardingsByTenant(tenantId: string): Promise<EmployeeOnboarding[]> {
  const {data, error} = await supabase
    .from('employee_onboarding')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('查询入职申请列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 查询入职申请列表（按门店）
 */
export async function getOnboardingsByStore(storeId: string): Promise<EmployeeOnboarding[]> {
  const {data, error} = await supabase
    .from('employee_onboarding')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('查询入职申请列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 查询入职申请详情
 */
export async function getOnboardingById(id: string): Promise<EmployeeOnboarding | null> {
  const {data, error} = await supabase.from('employee_onboarding').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('查询入职申请详情失败:', error)
    return null
  }

  return data
}

/**
 * 查询试用期员工列表（状态为approved的入职申请）
 */
export async function getProbationEmployees(tenantId?: string): Promise<EmployeeOnboarding[]> {
  let query = supabase
    .from('employee_onboarding')
    .select('*')
    .eq('status', 'approved')
    .order('onboarding_date', {ascending: false})

  if (tenantId) {
    query = query.eq('tenant_id', tenantId)
  }

  const {data, error} = await query

  if (error) {
    console.error('查询试用期员工列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 审批入职申请
 */
export async function approveOnboarding(
  id: string,
  approved: boolean,
  approvedBy: string,
  comment?: string
): Promise<boolean> {
  const {error} = await supabase
    .from('employee_onboarding')
    .update({
      status: approved ? 'approved' : 'rejected',
      approval_comment: comment || null,
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('审批入职申请失败:', error)
    return false
  }

  return true
}

/**
 * 完成入职流程（创建员工记录）
 */
export async function completeOnboarding(onboardingId: string, _employeeId: string): Promise<boolean> {
  const {error} = await supabase
    .from('employee_onboarding')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', onboardingId)

  if (error) {
    console.error('完成入职流程失败:', error)
    return false
  }

  return true
}

// ==================== 入职资料管理 ====================

/**
 * 上传入职资料
 */
export async function createOnboardingDocument(
  input: CreateOnboardingDocumentInput
): Promise<OnboardingDocument | null> {
  const {data, error} = await supabase
    .from('onboarding_documents')
    .insert({
      onboarding_id: input.onboarding_id,
      document_type: input.document_type,
      document_name: input.document_name,
      file_url: input.file_url
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('上传入职资料失败:', error)
    return null
  }

  return data
}

/**
 * 查询入职资料列表
 */
export async function getOnboardingDocuments(onboardingId: string): Promise<OnboardingDocument[]> {
  const {data, error} = await supabase
    .from('onboarding_documents')
    .select('*')
    .eq('onboarding_id', onboardingId)
    .order('uploaded_at', {ascending: false})

  if (error) {
    console.error('查询入职资料列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 删除入职资料
 */
export async function deleteOnboardingDocument(id: string): Promise<boolean> {
  const {error} = await supabase.from('onboarding_documents').delete().eq('id', id)

  if (error) {
    console.error('删除入职资料失败:', error)
    return false
  }

  return true
}

// ==================== 试用期评估管理 ====================

/**
 * 创建试用期评估
 */
export async function createProbationEvaluation(
  input: CreateProbationEvaluationInput
): Promise<ProbationEvaluation | null> {
  const {data, error} = await supabase
    .from('probation_evaluation')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      evaluation_date: input.evaluation_date,
      work_attitude_score: input.work_attitude_score || null,
      work_ability_score: input.work_ability_score || null,
      team_cooperation_score: input.team_cooperation_score || null,
      overall_score: input.overall_score || null,
      evaluation_content: input.evaluation_content || null,
      improvement_suggestions: input.improvement_suggestions || null,
      evaluator_id: input.evaluator_id || null
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建试用期评估失败:', error)
    return null
  }

  return data
}

/**
 * 查询员工的试用期评估列表
 */
export async function getProbationEvaluations(employeeId: string): Promise<ProbationEvaluation[]> {
  const {data, error} = await supabase
    .from('probation_evaluation')
    .select('*')
    .eq('employee_id', employeeId)
    .order('evaluation_date', {ascending: false})

  if (error) {
    console.error('查询试用期评估列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 查询试用期评估详情
 */
export async function getProbationEvaluationById(id: string): Promise<ProbationEvaluation | null> {
  const {data, error} = await supabase.from('probation_evaluation').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('查询试用期评估详情失败:', error)
    return null
  }

  return data
}

// ==================== 转正申请管理 ====================

/**
 * 创建转正申请
 */
export async function createRegularization(
  input: CreateRegularizationInput
): Promise<RegularizationApplication | null> {
  const {data, error} = await supabase
    .from('regularization_application')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      application_date: input.application_date,
      expected_regularization_date: input.expected_regularization_date,
      self_evaluation: input.self_evaluation || null,
      work_summary: input.work_summary || null,
      status: 'pending'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建转正申请失败:', error)
    return null
  }

  return data
}

/**
 * 查询转正申请列表（按租户）
 */
export async function getRegularizationsByTenant(tenantId: string): Promise<RegularizationApplication[]> {
  const {data, error} = await supabase
    .from('regularization_application')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('application_date', {ascending: false})

  if (error) {
    console.error('查询转正申请列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 查询员工的转正申请
 */
export async function getRegularizationByEmployee(employeeId: string): Promise<RegularizationApplication | null> {
  const {data, error} = await supabase
    .from('regularization_application')
    .select('*')
    .eq('employee_id', employeeId)
    .order('application_date', {ascending: false})
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('查询员工转正申请失败:', error)
    return null
  }

  return data
}

/**
 * 审批转正申请
 */
export async function approveRegularization(
  id: string,
  approved: boolean,
  approvedBy: string,
  comment?: string,
  actualDate?: string
): Promise<boolean> {
  const {error} = await supabase
    .from('regularization_application')
    .update({
      status: approved ? 'approved' : 'rejected',
      approval_comment: comment || null,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      actual_regularization_date: actualDate || null
    })
    .eq('id', id)

  if (error) {
    console.error('审批转正申请失败:', error)
    return false
  }

  return true
}
