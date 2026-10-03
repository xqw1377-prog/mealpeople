/**
 * 员工生命周期管理系统 - 数据库API
 */

import {supabase} from '@/client/supabase'
import type {
  Candidate,
  EmployeeLifecycleEvent,
  ExitInterview,
  Interview,
  OnboardingProcess,
  OnboardingStats,
  OnboardingTask,
  RecruitmentPosition,
  RecruitmentStats,
  ResignationRequest,
  ResignationStats
} from './types-lifecycle'

// ============================================
// 1. 招聘管理API
// ============================================

/**
 * 获取招聘职位列表
 */
export async function getRecruitmentPositions(tenantId: string): Promise<RecruitmentPosition[]> {
  const {data, error} = await supabase
    .from('recruitment_positions')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取招聘职位列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建招聘职位
 */
export async function createRecruitmentPosition(
  position: Omit<RecruitmentPosition, 'id' | 'created_at' | 'updated_at'>
): Promise<RecruitmentPosition | null> {
  const {data, error} = await supabase.from('recruitment_positions').insert(position).select().maybeSingle()

  if (error) {
    console.error('创建招聘职位失败:', error)
    return null
  }

  return data
}

/**
 * 更新招聘职位
 */
export async function updateRecruitmentPosition(
  id: string,
  updates: Partial<RecruitmentPosition>
): Promise<RecruitmentPosition | null> {
  const {data, error} = await supabase.from('recruitment_positions').update(updates).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新招聘职位失败:', error)
    return null
  }

  return data
}

/**
 * 获取候选人列表
 */
export async function getCandidates(tenantId: string, status?: string): Promise<Candidate[]> {
  let query = supabase.from('candidates').select('*').eq('tenant_id', tenantId)

  if (status) {
    query = query.eq('status', status)
  }

  const {data, error} = await query.order('created_at', {ascending: false})

  if (error) {
    console.error('获取候选人列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建候选人
 */
export async function createCandidate(
  candidate: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>
): Promise<Candidate | null> {
  const {data, error} = await supabase.from('candidates').insert(candidate).select().maybeSingle()

  if (error) {
    console.error('创建候选人失败:', error)
    return null
  }

  return data
}

/**
 * 更新候选人状态
 */
export async function updateCandidateStatus(id: string, status: string): Promise<Candidate | null> {
  const {data, error} = await supabase.from('candidates').update({status}).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新候选人状态失败:', error)
    return null
  }

  return data
}

/**
 * 创建面试记录
 */
export async function createInterview(interview: Omit<Interview, 'id' | 'created_at'>): Promise<Interview | null> {
  const {data, error} = await supabase.from('interviews').insert(interview).select().maybeSingle()

  if (error) {
    console.error('创建面试记录失败:', error)
    return null
  }

  return data
}

/**
 * 获取候选人的面试记录
 */
export async function getInterviewsByCandidate(candidateId: string): Promise<Interview[]> {
  const {data, error} = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('interview_date', {ascending: false})

  if (error) {
    console.error('获取面试记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取招聘统计数据
 */
export async function getRecruitmentStats(tenantId: string): Promise<RecruitmentStats> {
  // 在招职位数
  const {count: openPositions} = await supabase
    .from('recruitment_positions')
    .select('*', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .eq('status', 'open')

  // 待处理候选人数
  const {count: pendingCandidates} = await supabase
    .from('candidates')
    .select('*', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')

  // 待面试人数
  const {count: interviewScheduled} = await supabase
    .from('candidates')
    .select('*', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .eq('status', 'interview')

  // 待入职人数
  const {count: pendingOnboarding} = await supabase
    .from('candidates')
    .select('*', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .eq('status', 'offer')

  return {
    open_positions: openPositions || 0,
    pending_candidates: pendingCandidates || 0,
    interview_scheduled: interviewScheduled || 0,
    pending_onboarding: pendingOnboarding || 0
  }
}

// ============================================
// 2. 入职管理API
// ============================================

/**
 * 获取入职流程列表
 */
export async function getOnboardingProcesses(tenantId: string, status?: string): Promise<OnboardingProcess[]> {
  console.log('getOnboardingProcesses: 开始查询，租户ID:', tenantId, '状态:', status)
  let query = supabase.from('onboarding_processes').select('*').eq('tenant_id', tenantId)

  if (status) {
    query = query.eq('status', status)
  }

  const {data, error} = await query.order('created_at', {ascending: false})

  if (error) {
    console.error('getOnboardingProcesses: 查询失败:', error)
    return []
  }

  console.log('getOnboardingProcesses: 查询结果数量:', data?.length || 0)
  return Array.isArray(data) ? data : []
}

/**
 * 创建入职流程
 */
export async function createOnboardingProcess(
  process: Omit<OnboardingProcess, 'id' | 'created_at' | 'updated_at'>
): Promise<OnboardingProcess | null> {
  const {data, error} = await supabase.from('onboarding_processes').insert(process).select().maybeSingle()

  if (error) {
    console.error('创建入职流程失败:', error)
    return null
  }

  return data
}

/**
 * 更新入职流程
 */
export async function updateOnboardingProcess(
  id: string,
  updates: Partial<OnboardingProcess>
): Promise<OnboardingProcess | null> {
  const {data, error} = await supabase.from('onboarding_processes').update(updates).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新入职流程失败:', error)
    return null
  }

  return data
}

/**
 * 获取入职任务列表
 */
export async function getOnboardingTasks(processId: string): Promise<OnboardingTask[]> {
  const {data, error} = await supabase
    .from('onboarding_tasks')
    .select('*')
    .eq('process_id', processId)
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取入职任务列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建入职任务
 */
export async function createOnboardingTask(
  task: Omit<OnboardingTask, 'id' | 'created_at'>
): Promise<OnboardingTask | null> {
  const {data, error} = await supabase.from('onboarding_tasks').insert(task).select().maybeSingle()

  if (error) {
    console.error('创建入职任务失败:', error)
    return null
  }

  return data
}

/**
 * 完成入职任务
 */
export async function completeOnboardingTask(id: string, completedBy: string): Promise<OnboardingTask | null> {
  const {data, error} = await supabase
    .from('onboarding_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: completedBy
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('完成入职任务失败:', error)
    return null
  }

  return data
}

/**
 * 获取入职统计数据
 */
export async function getOnboardingStats(tenantId: string): Promise<OnboardingStats> {
  console.log('getOnboardingStats: 开始统计，租户ID:', tenantId)

  // 待开始
  const {count: pending, error: pendingError} = await supabase
    .from('onboarding_processes')
    .select('*', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')

  if (pendingError) {
    console.error('getOnboardingStats: 查询待开始数量失败:', pendingError)
  }

  // 进行中
  const {count: inProgress, error: inProgressError} = await supabase
    .from('onboarding_processes')
    .select('*', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .eq('status', 'in_progress')

  if (inProgressError) {
    console.error('getOnboardingStats: 查询进行中数量失败:', inProgressError)
  }

  // 本月已完成
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const {count: completedThisMonth, error: completedError} = await supabase
    .from('onboarding_processes')
    .select('*', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('actual_completion_date', startOfMonth.toISOString())

  if (completedError) {
    console.error('getOnboardingStats: 查询本月完成数量失败:', completedError)
  }

  const stats = {
    pending: pending || 0,
    in_progress: inProgress || 0,
    completed_this_month: completedThisMonth || 0
  }

  console.log('getOnboardingStats: 统计结果:', stats)
  return stats
}

// ============================================
// 3. 员工生命周期API
// ============================================

/**
 * 获取员工生命周期事件
 */
export async function getEmployeeLifecycleEvents(employeeId: string): Promise<EmployeeLifecycleEvent[]> {
  const {data, error} = await supabase
    .from('employee_lifecycle_events')
    .select('*')
    .eq('employee_id', employeeId)
    .order('event_date', {ascending: true})

  if (error) {
    console.error('获取员工生命周期事件失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建员工生命周期事件
 */
export async function createEmployeeLifecycleEvent(
  event: Omit<EmployeeLifecycleEvent, 'id' | 'created_at'>
): Promise<EmployeeLifecycleEvent | null> {
  const {data, error} = await supabase.from('employee_lifecycle_events').insert(event).select().maybeSingle()

  if (error) {
    console.error('创建员工生命周期事件失败:', error)
    return null
  }

  return data
}

// ============================================
// 4. 离职管理API
// ============================================

/**
 * 获取离职申请列表
 */
export async function getResignationRequests(tenantId: string, status?: string): Promise<ResignationRequest[]> {
  let query = supabase.from('resignation_requests').select('*').eq('tenant_id', tenantId)

  if (status) {
    query = query.eq('status', status)
  }

  const {data, error} = await query.order('created_at', {ascending: false})

  if (error) {
    console.error('获取离职申请列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建离职申请
 */
export async function createResignationRequest(
  request: Omit<ResignationRequest, 'id' | 'created_at'>
): Promise<ResignationRequest | null> {
  const {data, error} = await supabase.from('resignation_requests').insert(request).select().maybeSingle()

  if (error) {
    console.error('创建离职申请失败:', error)
    return null
  }

  return data
}

/**
 * 审批离职申请
 */
export async function approveResignationRequest(
  id: string,
  approvedBy: string,
  approved: boolean
): Promise<ResignationRequest | null> {
  const {data, error} = await supabase
    .from('resignation_requests')
    .update({
      status: approved ? 'approved' : 'rejected',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('审批离职申请失败:', error)
    return null
  }

  return data
}

/**
 * 更新离职申请
 */
export async function updateResignationRequest(
  id: string,
  updates: Partial<ResignationRequest>
): Promise<ResignationRequest | null> {
  const {data, error} = await supabase.from('resignation_requests').update(updates).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新离职申请失败:', error)
    return null
  }

  return data
}

/**
 * 创建离职面谈
 */
export async function createExitInterview(
  interview: Omit<ExitInterview, 'id' | 'created_at'>
): Promise<ExitInterview | null> {
  const {data, error} = await supabase.from('exit_interviews').insert(interview).select().maybeSingle()

  if (error) {
    console.error('创建离职面谈失败:', error)
    return null
  }

  return data
}

/**
 * 获取离职统计数据
 */
export async function getResignationStats(tenantId: string): Promise<ResignationStats> {
  // 待审批
  const {count: pendingApproval} = await supabase
    .from('resignation_requests')
    .select('*', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')

  // 离职中
  const {count: inProgress} = await supabase
    .from('resignation_requests')
    .select('*', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .eq('status', 'approved')

  // 本月已离职
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const {count: completedThisMonth} = await supabase
    .from('resignation_requests')
    .select('*', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('last_working_day', startOfMonth.toISOString())

  // 计算离职率（简化版：本月离职人数 / 总员工数）
  // TODO: 需要从employees表获取总员工数
  const turnoverRate = 0 // 暂时设为0，后续完善

  return {
    pending_approval: pendingApproval || 0,
    in_progress: inProgress || 0,
    completed_this_month: completedThisMonth || 0,
    turnover_rate: turnoverRate
  }
}

// ============================================
// 别名导出（兼容旧代码）
// ============================================

export const createPosition = createRecruitmentPosition
export const updatePosition = updateRecruitmentPosition
export const getPositions = getRecruitmentPositions

// Re-export types for convenience
export type {
  Candidate,
  EmployeeLifecycleEvent,
  ExitInterview,
  Interview,
  OnboardingProcess,
  OnboardingStats,
  OnboardingTask,
  RecruitmentPosition,
  RecruitmentStats,
  ResignationRequest,
  ResignationStats
} from './types-lifecycle'
