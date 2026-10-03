// 员工离职管理API

import {supabase} from '@/client/supabase'
import type {
  CreateExitInterviewInput,
  CreateHandoverInput,
  CreateResignationInput,
  EmployeeResignation,
  ExitInterview,
  ResignationHandover
} from '../types'

// ==================== 离职申请管理 ====================

/**
 * 创建离职申请
 */
export async function createResignation(input: CreateResignationInput): Promise<EmployeeResignation | null> {
  const {data, error} = await supabase
    .from('employee_resignation')
    .insert({
      tenant_id: input.tenant_id,
      store_id: input.store_id,
      employee_id: input.employee_id,
      resignation_type: input.resignation_type,
      resignation_reason: input.resignation_reason,
      resignation_date: input.resignation_date,
      last_working_day: input.last_working_day,
      status: 'pending'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建离职申请失败:', error)
    return null
  }

  return data
}

/**
 * 查询离职申请列表（按租户）
 */
export async function getResignationsByTenant(tenantId: string): Promise<EmployeeResignation[]> {
  const {data, error} = await supabase
    .from('employee_resignation')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('查询离职申请列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 查询离职申请列表（按门店）
 */
export async function getResignationsByStore(storeId: string): Promise<EmployeeResignation[]> {
  const {data, error} = await supabase
    .from('employee_resignation')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('查询离职申请列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 查询员工的离职申请
 */
export async function getResignationByEmployee(employeeId: string): Promise<EmployeeResignation | null> {
  const {data, error} = await supabase
    .from('employee_resignation')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('查询员工离职申请失败:', error)
    return null
  }

  return data
}

/**
 * 查询离职申请详情
 */
export async function getResignationById(id: string): Promise<EmployeeResignation | null> {
  const {data, error} = await supabase.from('employee_resignation').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('查询离职申请详情失败:', error)
    return null
  }

  return data
}

/**
 * 审批离职申请
 */
export async function approveResignation(
  id: string,
  approved: boolean,
  approvedBy: string,
  comment?: string
): Promise<boolean> {
  const {error} = await supabase
    .from('employee_resignation')
    .update({
      status: approved ? 'approved' : 'rejected',
      approval_comment: comment || null,
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('审批离职申请失败:', error)
    return false
  }

  return true
}

/**
 * 完成离职流程（更新员工状态）
 */
export async function completeResignation(resignationId: string): Promise<boolean> {
  const {error} = await supabase
    .from('employee_resignation')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', resignationId)

  if (error) {
    console.error('完成离职流程失败:', error)
    return false
  }

  return true
}

/**
 * 更新员工状态为离职
 */
export async function updateEmployeeStatusToResigned(employeeId: string): Promise<boolean> {
  const {error} = await supabase
    .from('employees')
    .update({
      status: 'resigned',
      updated_at: new Date().toISOString()
    })
    .eq('id', employeeId)

  if (error) {
    console.error('更新员工状态失败:', error)
    return false
  }

  return true
}

// ==================== 离职交接管理 ====================

/**
 * 创建离职交接
 */
export async function createHandover(input: CreateHandoverInput): Promise<ResignationHandover | null> {
  const {data, error} = await supabase
    .from('resignation_handover')
    .insert({
      resignation_id: input.resignation_id,
      handover_item: input.handover_item,
      handover_to_id: input.handover_to_id || null,
      handover_status: input.handover_status || 'pending',
      handover_date: input.handover_date || null,
      notes: input.notes || null
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建离职交接失败:', error)
    return null
  }

  return data
}

/**
 * 查询离职交接列表
 */
export async function getHandoversByResignation(resignationId: string): Promise<ResignationHandover[]> {
  const {data, error} = await supabase
    .from('resignation_handover')
    .select('*')
    .eq('resignation_id', resignationId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('查询离职交接列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新交接状态
 */
export async function updateHandoverStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'completed',
  handoverDate?: string
): Promise<boolean> {
  const {error} = await supabase
    .from('resignation_handover')
    .update({
      handover_status: status,
      handover_date: handoverDate || null
    })
    .eq('id', id)

  if (error) {
    console.error('更新交接状态失败:', error)
    return false
  }

  return true
}

/**
 * 删除离职交接
 */
export async function deleteHandover(id: string): Promise<boolean> {
  const {error} = await supabase.from('resignation_handover').delete().eq('id', id)

  if (error) {
    console.error('删除离职交接失败:', error)
    return false
  }

  return true
}

// ==================== 离职面谈管理 ====================

/**
 * 创建离职面谈
 */
export async function createExitInterview(input: CreateExitInterviewInput): Promise<ExitInterview | null> {
  const {data, error} = await supabase
    .from('exit_interview')
    .insert({
      resignation_id: input.resignation_id,
      interview_date: input.interview_date,
      interviewer_id: input.interviewer_id || null,
      satisfaction_rating: input.satisfaction_rating || null,
      leaving_reason_detail: input.leaving_reason_detail || null,
      company_feedback: input.company_feedback || null,
      improvement_suggestions: input.improvement_suggestions || null,
      would_recommend: input.would_recommend || null,
      would_return: input.would_return || null,
      interview_notes: input.interview_notes || null
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建离职面谈失败:', error)
    return null
  }

  return data
}

/**
 * 查询离职面谈
 */
export async function getExitInterviewByResignation(resignationId: string): Promise<ExitInterview | null> {
  const {data, error} = await supabase
    .from('exit_interview')
    .select('*')
    .eq('resignation_id', resignationId)
    .maybeSingle()

  if (error) {
    console.error('查询离职面谈失败:', error)
    return null
  }

  return data
}

/**
 * 更新离职面谈
 */
export async function updateExitInterview(id: string, input: Partial<CreateExitInterviewInput>): Promise<boolean> {
  const {error} = await supabase.from('exit_interview').update(input).eq('id', id)

  if (error) {
    console.error('更新离职面谈失败:', error)
    return false
  }

  return true
}

/**
 * 查询所有离职面谈（按租户）
 */
export async function getExitInterviewsByTenant(tenantId: string): Promise<ExitInterview[]> {
  const {data, error} = await supabase
    .from('exit_interview')
    .select(
      `
      *,
      employee_resignation!inner(tenant_id)
    `
    )
    .eq('employee_resignation.tenant_id', tenantId)
    .order('interview_date', {ascending: false})

  if (error) {
    console.error('查询离职面谈列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}
