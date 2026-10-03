// 离职管理API接口

import {supabase} from '@/client/supabase'
import type {
  ResignationApplication,
  ResignationApplicationDetail,
  ResignationApproval,
  ResignationHandover,
  ResignationInterview,
  ResignationProcedure,
  ResignationStatistics
} from './types-resignation'

// ==================== 离职申请管理 ====================

/**
 * 创建离职申请
 */
export async function createResignationApplication(
  data: Omit<ResignationApplication, 'id' | 'created_at' | 'updated_at' | 'submitted_at'>
): Promise<ResignationApplication | null> {
  const {data: result, error} = await supabase.from('resignation_applications').insert(data).select().maybeSingle()

  if (error) {
    console.error('创建离职申请失败:', error)
    return null
  }

  return result
}

/**
 * 获取员工的离职申请
 */
export async function getEmployeeResignationApplication(employeeId: string): Promise<ResignationApplication | null> {
  const {data, error} = await supabase
    .from('resignation_applications')
    .select('*')
    .eq('employee_id', employeeId)
    .order('submitted_at', {ascending: false})
    .maybeSingle()

  if (error) {
    console.error('获取离职申请失败:', error)
    return null
  }

  return data
}

/**
 * 获取离职申请详情
 */
export async function getResignationApplicationDetail(
  applicationId: string
): Promise<ResignationApplicationDetail | null> {
  try {
    // 获取申请信息
    const {data: application, error: appError} = await supabase
      .from('resignation_applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle()

    if (appError || !application) {
      console.error('获取离职申请失败:', appError)
      return null
    }

    // 获取员工信息
    const {data: employee} = await supabase
      .from('employees')
      .select('id, name, position, department, hire_date')
      .eq('id', application.employee_id)
      .maybeSingle()

    // 获取审批记录
    const approvals = await getResignationApprovals(applicationId)

    // 获取工作交接
    const handovers = await getResignationHandovers(applicationId)

    // 获取离职手续
    const procedures = await getResignationProcedures(applicationId)

    // 获取离职面谈
    const interviews = await getResignationInterviews(applicationId)

    return {
      application,
      employee: employee || {
        id: application.employee_id,
        name: '未知',
        position: '未知',
        department: '未知',
        hire_date: ''
      },
      approvals,
      handovers,
      procedures,
      interviews
    }
  } catch (error) {
    console.error('获取离职申请详情失败:', error)
    return null
  }
}

/**
 * 更新离职申请状态
 */
export async function updateResignationApplicationStatus(applicationId: string, status: string): Promise<boolean> {
  const {error} = await supabase.from('resignation_applications').update({status}).eq('id', applicationId)

  if (error) {
    console.error('更新离职申请状态失败:', error)
    return false
  }

  return true
}

/**
 * 撤回离职申请
 */
export async function withdrawResignationApplication(applicationId: string): Promise<boolean> {
  const {error} = await supabase.from('resignation_applications').update({status: 'withdrawn'}).eq('id', applicationId)

  if (error) {
    console.error('撤回离职申请失败:', error)
    return false
  }

  return true
}

/**
 * 获取租户的所有离职申请
 */
export async function getTenantResignationApplications(tenantId: string): Promise<ResignationApplication[]> {
  const {data, error} = await supabase
    .from('resignation_applications')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('submitted_at', {ascending: false})

  if (error) {
    console.error('获取离职申请列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 搜索离职申请
 */
export async function searchResignationApplications(
  tenantId: string,
  filters: {
    status?: string
    resignation_type?: string
    resignation_reason?: string
    start_date?: string
    end_date?: string
  }
): Promise<ResignationApplication[]> {
  let query = supabase.from('resignation_applications').select('*').eq('tenant_id', tenantId)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.resignation_type) {
    query = query.eq('resignation_type', filters.resignation_type)
  }

  if (filters.resignation_reason) {
    query = query.eq('resignation_reason', filters.resignation_reason)
  }

  if (filters.start_date) {
    query = query.gte('submitted_at', filters.start_date)
  }

  if (filters.end_date) {
    query = query.lte('submitted_at', filters.end_date)
  }

  const {data, error} = await query.order('submitted_at', {ascending: false})

  if (error) {
    console.error('搜索离职申请失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 离职审批管理 ====================

/**
 * 获取离职申请的审批记录
 */
export async function getResignationApprovals(applicationId: string): Promise<ResignationApproval[]> {
  const {data, error} = await supabase
    .from('resignation_approvals')
    .select('*')
    .eq('application_id', applicationId)
    .order('approval_level', {ascending: true})

  if (error) {
    console.error('获取审批记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 审批离职申请
 */
export async function approveResignationApplication(approvalId: string, comments?: string): Promise<boolean> {
  const {error} = await supabase
    .from('resignation_approvals')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      comments
    })
    .eq('id', approvalId)

  if (error) {
    console.error('审批离职申请失败:', error)
    return false
  }

  return true
}

/**
 * 拒绝离职申请
 */
export async function rejectResignationApplication(approvalId: string, comments: string): Promise<boolean> {
  const {error} = await supabase
    .from('resignation_approvals')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      comments
    })
    .eq('id', approvalId)

  if (error) {
    console.error('拒绝离职申请失败:', error)
    return false
  }

  return true
}

/**
 * 获取待审批的离职申请
 */
export async function getPendingResignationApprovals(approverId: string): Promise<ResignationApproval[]> {
  const {data, error} = await supabase
    .from('resignation_approvals')
    .select('*')
    .eq('approver_id', approverId)
    .eq('status', 'pending')
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取待审批列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 工作交接管理 ====================

/**
 * 获取离职申请的工作交接列表
 */
export async function getResignationHandovers(applicationId: string): Promise<ResignationHandover[]> {
  const {data, error} = await supabase
    .from('resignation_handovers')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取工作交接列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建工作交接
 */
export async function createResignationHandover(
  data: Omit<ResignationHandover, 'id' | 'created_at' | 'updated_at'>
): Promise<ResignationHandover | null> {
  const {data: result, error} = await supabase.from('resignation_handovers').insert(data).select().maybeSingle()

  if (error) {
    console.error('创建工作交接失败:', error)
    return null
  }

  return result
}

/**
 * 更新工作交接状态
 */
export async function updateResignationHandoverStatus(handoverId: string, status: string): Promise<boolean> {
  const {error} = await supabase
    .from('resignation_handovers')
    .update({
      status,
      ...(status === 'completed' ? {completed_at: new Date().toISOString()} : {})
    })
    .eq('id', handoverId)

  if (error) {
    console.error('更新工作交接状态失败:', error)
    return false
  }

  return true
}

/**
 * 确认工作交接
 */
export async function confirmResignationHandover(handoverId: string, confirmedBy: string): Promise<boolean> {
  const {error} = await supabase
    .from('resignation_handovers')
    .update({
      status: 'confirmed',
      confirmed_by: confirmedBy,
      confirmed_at: new Date().toISOString()
    })
    .eq('id', handoverId)

  if (error) {
    console.error('确认工作交接失败:', error)
    return false
  }

  return true
}

/**
 * 批量创建工作交接
 */
export async function batchCreateResignationHandovers(
  handovers: Array<Omit<ResignationHandover, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const {error} = await supabase.from('resignation_handovers').insert(handovers)

  if (error) {
    console.error('批量创建工作交接失败:', error)
    return false
  }

  return true
}

// ==================== 离职手续管理 ====================

/**
 * 获取离职申请的手续列表
 */
export async function getResignationProcedures(applicationId: string): Promise<ResignationProcedure[]> {
  const {data, error} = await supabase
    .from('resignation_procedures')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取离职手续列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建离职手续
 */
export async function createResignationProcedure(
  data: Omit<ResignationProcedure, 'id' | 'created_at' | 'updated_at'>
): Promise<ResignationProcedure | null> {
  const {data: result, error} = await supabase.from('resignation_procedures').insert(data).select().maybeSingle()

  if (error) {
    console.error('创建离职手续失败:', error)
    return null
  }

  return result
}

/**
 * 更新离职手续状态
 */
export async function updateResignationProcedureStatus(procedureId: string, status: string): Promise<boolean> {
  const {error} = await supabase
    .from('resignation_procedures')
    .update({
      status,
      ...(status === 'in_progress' ? {started_at: new Date().toISOString()} : {}),
      ...(status === 'completed' ? {completed_at: new Date().toISOString()} : {})
    })
    .eq('id', procedureId)

  if (error) {
    console.error('更新离职手续状态失败:', error)
    return false
  }

  return true
}

/**
 * 批量创建离职手续
 */
export async function batchCreateResignationProcedures(
  procedures: Array<Omit<ResignationProcedure, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const {error} = await supabase.from('resignation_procedures').insert(procedures)

  if (error) {
    console.error('批量创建离职手续失败:', error)
    return false
  }

  return true
}

// ==================== 离职面谈管理 ====================

/**
 * 获取离职申请的面谈记录
 */
export async function getResignationInterviews(applicationId: string): Promise<ResignationInterview[]> {
  const {data, error} = await supabase
    .from('resignation_interviews')
    .select('*')
    .eq('application_id', applicationId)
    .order('interview_date', {ascending: false})

  if (error) {
    console.error('获取离职面谈记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建离职面谈记录
 */
export async function createResignationInterview(
  data: Omit<ResignationInterview, 'id' | 'created_at' | 'updated_at'>
): Promise<ResignationInterview | null> {
  const {data: result, error} = await supabase.from('resignation_interviews').insert(data).select().maybeSingle()

  if (error) {
    console.error('创建离职面谈记录失败:', error)
    return null
  }

  return result
}

/**
 * 更新离职面谈记录
 */
export async function updateResignationInterview(
  interviewId: string,
  data: Partial<ResignationInterview>
): Promise<boolean> {
  const {error} = await supabase.from('resignation_interviews').update(data).eq('id', interviewId)

  if (error) {
    console.error('更新离职面谈记录失败:', error)
    return false
  }

  return true
}

// ==================== 离职统计分析 ====================

/**
 * 获取离职统计数据
 */
export async function getResignationStatistics(
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<ResignationStatistics> {
  const applications = await searchResignationApplications(tenantId, {
    start_date: startDate,
    end_date: endDate
  })

  const total = applications.length

  // 按类型统计
  const by_type = applications.reduce(
    (acc, app) => {
      acc[app.resignation_type] = (acc[app.resignation_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // 按原因统计
  const by_reason = applications.reduce(
    (acc, app) => {
      acc[app.resignation_reason] = (acc[app.resignation_reason] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // 按部门统计（需要关联员工表）
  const by_department: Record<string, number> = {}
  const by_position: Record<string, number> = {}
  const by_month: Record<string, number> = {}

  // 计算离职率（需要总员工数）
  const turnover_rate = 0 // 需要实际计算

  return {
    total,
    by_type,
    by_reason,
    by_department,
    by_position,
    by_month,
    turnover_rate
  }
}

/**
 * 计算工作交接完成率
 */
export function calculateHandoverCompletionRate(handovers: ResignationHandover[]): number {
  if (handovers.length === 0) return 0
  const completed = handovers.filter((h) => h.status === 'completed' || h.status === 'confirmed').length
  return Math.round((completed / handovers.length) * 100)
}

/**
 * 计算离职手续完成率
 */
export function calculateProcedureCompletionRate(procedures: ResignationProcedure[]): number {
  if (procedures.length === 0) return 0
  const completed = procedures.filter((p) => p.status === 'completed').length
  return Math.round((completed / procedures.length) * 100)
}

/**
 * 判断离职申请是否可以撤回
 */
export function canWithdrawResignationApplication(application: ResignationApplication): boolean {
  return application.status === 'pending' || application.status === 'approved'
}

/**
 * 判断离职申请是否已完成
 */
export function isResignationApplicationCompleted(application: ResignationApplication): boolean {
  return application.status === 'completed'
}
