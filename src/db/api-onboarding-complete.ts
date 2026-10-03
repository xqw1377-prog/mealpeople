// 完整的入职管理API接口

import {supabase} from '@/client/supabase'
import type {
  Candidate,
  CandidateDetail,
  CandidateStatistics,
  Interview,
  InterviewDetail,
  Offer,
  OfferDetail,
  OnboardingApproval,
  OnboardingTraining,
  ProbationEvaluation
} from './types-onboarding-complete'

// ==================== 候选人管理 ====================

/**
 * 创建候选人
 */
export async function createCandidate(
  data: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>
): Promise<Candidate | null> {
  const {data: result, error} = await supabase.from('candidates').insert(data).select().maybeSingle()

  if (error) {
    console.error('创建候选人失败:', error)
    return null
  }

  return result
}

/**
 * 获取候选人详情
 */
export async function getCandidateDetail(candidateId: string): Promise<CandidateDetail | null> {
  try {
    // 获取候选人信息
    const {data: candidate, error: candidateError} = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .maybeSingle()

    if (candidateError || !candidate) {
      console.error('获取候选人失败:', candidateError)
      return null
    }

    // 获取面试记录
    const interviews = await getCandidateInterviews(candidateId)

    // 获取Offer记录
    const offers = await getCandidateOffers(candidateId)

    // 获取推荐人信息
    let referrer = null
    if (candidate.referrer_id) {
      const {data: referrerData} = await supabase
        .from('employees')
        .select('id, name')
        .eq('id', candidate.referrer_id)
        .maybeSingle()
      referrer = referrerData
    }

    return {
      ...candidate,
      interviews,
      offers,
      referrer
    }
  } catch (error) {
    console.error('获取候选人详情失败:', error)
    return null
  }
}

/**
 * 更新候选人状态
 */
export async function updateCandidateStatus(candidateId: string, status: string): Promise<boolean> {
  const {error} = await supabase.from('candidates').update({status}).eq('id', candidateId)

  if (error) {
    console.error('更新候选人状态失败:', error)
    return false
  }

  return true
}

/**
 * 获取租户的候选人列表
 */
export async function getTenantCandidates(tenantId: string): Promise<Candidate[]> {
  const {data, error} = await supabase
    .from('candidates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取候选人列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 搜索候选人
 */
export async function searchCandidates(
  tenantId: string,
  filters: {
    status?: string
    position?: string
    department?: string
    source?: string
  }
): Promise<Candidate[]> {
  let query = supabase.from('candidates').select('*').eq('tenant_id', tenantId)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.position) {
    query = query.eq('position', filters.position)
  }

  if (filters.department) {
    query = query.eq('department', filters.department)
  }

  if (filters.source) {
    query = query.eq('source', filters.source)
  }

  const {data, error} = await query.order('created_at', {ascending: false})

  if (error) {
    console.error('搜索候选人失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新候选人信息
 */
export async function updateCandidate(candidateId: string, data: Partial<Candidate>): Promise<boolean> {
  const {error} = await supabase.from('candidates').update(data).eq('id', candidateId)

  if (error) {
    console.error('更新候选人信息失败:', error)
    return false
  }

  return true
}

/**
 * 删除候选人
 */
export async function deleteCandidate(candidateId: string): Promise<boolean> {
  const {error} = await supabase.from('candidates').delete().eq('id', candidateId)

  if (error) {
    console.error('删除候选人失败:', error)
    return false
  }

  return true
}

// ==================== 面试管理 ====================

/**
 * 创建面试
 */
export async function createInterview(
  data: Omit<Interview, 'id' | 'created_at' | 'updated_at'>
): Promise<Interview | null> {
  const {data: result, error} = await supabase.from('interviews').insert(data).select().maybeSingle()

  if (error) {
    console.error('创建面试失败:', error)
    return null
  }

  return result
}

/**
 * 获取候选人的面试记录
 */
export async function getCandidateInterviews(candidateId: string): Promise<Interview[]> {
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
 * 更新面试信息
 */
export async function updateInterview(interviewId: string, data: Partial<Interview>): Promise<boolean> {
  const {error} = await supabase.from('interviews').update(data).eq('id', interviewId)

  if (error) {
    console.error('更新面试信息失败:', error)
    return false
  }

  return true
}

/**
 * 获取面试详情
 */
export async function getInterviewDetail(interviewId: string): Promise<InterviewDetail | null> {
  try {
    const {data: interview, error} = await supabase.from('interviews').select('*').eq('id', interviewId).maybeSingle()

    if (error || !interview) {
      console.error('获取面试详情失败:', error)
      return null
    }

    // 获取候选人信息
    const {data: candidate} = await supabase
      .from('candidates')
      .select('*')
      .eq('id', interview.candidate_id)
      .maybeSingle()

    // 获取面试官信息
    const interviewers: Array<{id: string; name: string}> = []
    if (interview.interviewer_ids && interview.interviewer_ids.length > 0) {
      const {data: interviewersData} = await supabase
        .from('employees')
        .select('id, name')
        .in('id', interview.interviewer_ids)

      if (interviewersData) {
        interviewers.push(...interviewersData)
      }
    }

    return {
      ...interview,
      candidate: candidate || undefined,
      interviewers
    }
  } catch (error) {
    console.error('获取面试详情失败:', error)
    return null
  }
}

/**
 * 删除面试
 */
export async function deleteInterview(interviewId: string): Promise<boolean> {
  const {error} = await supabase.from('interviews').delete().eq('id', interviewId)

  if (error) {
    console.error('删除面试失败:', error)
    return false
  }

  return true
}

// ==================== Offer管理 ====================

/**
 * 创建Offer
 */
export async function createOffer(data: Omit<Offer, 'id' | 'created_at' | 'updated_at'>): Promise<Offer | null> {
  const {data: result, error} = await supabase.from('offers').insert(data).select().maybeSingle()

  if (error) {
    console.error('创建Offer失败:', error)
    return null
  }

  return result
}

/**
 * 获取候选人的Offer记录
 */
export async function getCandidateOffers(candidateId: string): Promise<Offer[]> {
  const {data, error} = await supabase
    .from('offers')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('sent_date', {ascending: false})

  if (error) {
    console.error('获取Offer记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新Offer状态
 */
export async function updateOfferStatus(offerId: string, status: string): Promise<boolean> {
  const updateData: any = {status}

  if (status === 'accepted') {
    updateData.accepted_date = new Date().toISOString()
  } else if (status === 'rejected') {
    updateData.rejected_date = new Date().toISOString()
  }

  const {error} = await supabase.from('offers').update(updateData).eq('id', offerId)

  if (error) {
    console.error('更新Offer状态失败:', error)
    return false
  }

  return true
}

/**
 * 获取Offer详情
 */
export async function getOfferDetail(offerId: string): Promise<OfferDetail | null> {
  try {
    const {data: offer, error} = await supabase.from('offers').select('*').eq('id', offerId).maybeSingle()

    if (error || !offer) {
      console.error('获取Offer详情失败:', error)
      return null
    }

    // 获取候选人信息
    const {data: candidate} = await supabase.from('candidates').select('*').eq('id', offer.candidate_id).maybeSingle()

    return {
      ...offer,
      candidate: candidate || undefined
    }
  } catch (error) {
    console.error('获取Offer详情失败:', error)
    return null
  }
}

/**
 * 更新Offer信息
 */
export async function updateOffer(offerId: string, data: Partial<Offer>): Promise<boolean> {
  const {error} = await supabase.from('offers').update(data).eq('id', offerId)

  if (error) {
    console.error('更新Offer信息失败:', error)
    return false
  }

  return true
}

/**
 * 删除Offer
 */
export async function deleteOffer(offerId: string): Promise<boolean> {
  const {error} = await supabase.from('offers').delete().eq('id', offerId)

  if (error) {
    console.error('删除Offer失败:', error)
    return false
  }

  return true
}

// ==================== 入职审批管理 ====================

/**
 * 获取入职申请的审批记录
 */
export async function getOnboardingApprovals(applicationId: string): Promise<OnboardingApproval[]> {
  const {data, error} = await supabase
    .from('onboarding_approvals')
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
 * 审批入职申请
 */
export async function approveOnboardingApplication(approvalId: string, comments?: string): Promise<boolean> {
  const {error} = await supabase
    .from('onboarding_approvals')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      comments
    })
    .eq('id', approvalId)

  if (error) {
    console.error('审批入职申请失败:', error)
    return false
  }

  return true
}

/**
 * 拒绝入职申请
 */
export async function rejectOnboardingApplication(approvalId: string, comments: string): Promise<boolean> {
  const {error} = await supabase
    .from('onboarding_approvals')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      comments
    })
    .eq('id', approvalId)

  if (error) {
    console.error('拒绝入职申请失败:', error)
    return false
  }

  return true
}

/**
 * 获取待审批的入职申请
 */
export async function getPendingOnboardingApprovals(approverId: string): Promise<OnboardingApproval[]> {
  const {data, error} = await supabase
    .from('onboarding_approvals')
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

// ==================== 入职培训管理 ====================

/**
 * 创建入职培训
 */
export async function createOnboardingTraining(
  data: Omit<OnboardingTraining, 'id' | 'created_at' | 'updated_at'>
): Promise<OnboardingTraining | null> {
  const {data: result, error} = await supabase.from('onboarding_trainings').insert(data).select().maybeSingle()

  if (error) {
    console.error('创建入职培训失败:', error)
    return null
  }

  return result
}

/**
 * 获取入职申请的培训记录
 */
export async function getOnboardingTrainings(applicationId: string): Promise<OnboardingTraining[]> {
  const {data, error} = await supabase
    .from('onboarding_trainings')
    .select('*')
    .eq('application_id', applicationId)
    .order('training_date', {ascending: true})

  if (error) {
    console.error('获取培训记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新培训信息
 */
export async function updateOnboardingTraining(
  trainingId: string,
  data: Partial<OnboardingTraining>
): Promise<boolean> {
  const {error} = await supabase.from('onboarding_trainings').update(data).eq('id', trainingId)

  if (error) {
    console.error('更新培训信息失败:', error)
    return false
  }

  return true
}

/**
 * 更新培训状态
 */
export async function updateTrainingStatus(trainingId: string, status: string): Promise<boolean> {
  const {error} = await supabase.from('onboarding_trainings').update({status}).eq('id', trainingId)

  if (error) {
    console.error('更新培训状态失败:', error)
    return false
  }

  return true
}

/**
 * 删除培训
 */
export async function deleteOnboardingTraining(trainingId: string): Promise<boolean> {
  const {error} = await supabase.from('onboarding_trainings').delete().eq('id', trainingId)

  if (error) {
    console.error('删除培训失败:', error)
    return false
  }

  return true
}

/**
 * 批量创建入职培训
 */
export async function batchCreateOnboardingTrainings(
  trainings: Array<Omit<OnboardingTraining, 'id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const {error} = await supabase.from('onboarding_trainings').insert(trainings)

  if (error) {
    console.error('批量创建培训失败:', error)
    return false
  }

  return true
}

// ==================== 试用期管理 ====================

/**
 * 创建试用期评估
 */
export async function createProbationEvaluation(
  data: Omit<ProbationEvaluation, 'id' | 'created_at' | 'updated_at'>
): Promise<ProbationEvaluation | null> {
  const {data: result, error} = await supabase.from('probation_evaluations').insert(data).select().maybeSingle()

  if (error) {
    console.error('创建试用期评估失败:', error)
    return null
  }

  return result
}

/**
 * 获取员工的试用期评估记录
 */
export async function getEmployeeProbationEvaluations(employeeId: string): Promise<ProbationEvaluation[]> {
  const {data, error} = await supabase
    .from('probation_evaluations')
    .select('*')
    .eq('employee_id', employeeId)
    .order('evaluation_date', {ascending: false})

  if (error) {
    console.error('获取试用期评估记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新试用期评估
 */
export async function updateProbationEvaluation(
  evaluationId: string,
  data: Partial<ProbationEvaluation>
): Promise<boolean> {
  const {error} = await supabase.from('probation_evaluations').update(data).eq('id', evaluationId)

  if (error) {
    console.error('更新试用期评估失败:', error)
    return false
  }

  return true
}

/**
 * 审批试用期评估
 */
export async function approveProbationEvaluation(evaluationId: string, approvedBy: string): Promise<boolean> {
  const {error} = await supabase
    .from('probation_evaluations')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
    .eq('id', evaluationId)

  if (error) {
    console.error('审批试用期评估失败:', error)
    return false
  }

  return true
}

/**
 * 删除试用期评估
 */
export async function deleteProbationEvaluation(evaluationId: string): Promise<boolean> {
  const {error} = await supabase.from('probation_evaluations').delete().eq('id', evaluationId)

  if (error) {
    console.error('删除试用期评估失败:', error)
    return false
  }

  return true
}

// ==================== 统计分析 ====================

/**
 * 获取候选人统计数据
 */
export async function getCandidateStatistics(tenantId: string): Promise<CandidateStatistics> {
  const candidates = await getTenantCandidates(tenantId)

  const total = candidates.length

  // 按状态统计
  const by_status = candidates.reduce(
    (acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // 按来源统计
  const by_source = candidates.reduce(
    (acc, candidate) => {
      const source = candidate.source || 'unknown'
      acc[source] = (acc[source] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // 按职位统计
  const by_position = candidates.reduce(
    (acc, candidate) => {
      acc[candidate.position] = (acc[candidate.position] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // 按部门统计
  const by_department = candidates.reduce(
    (acc, candidate) => {
      acc[candidate.department] = (acc[candidate.department] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return {
    total,
    by_status,
    by_source,
    by_position,
    by_department
  }
}

/**
 * 计算培训完成率
 */
export function calculateTrainingCompletionRate(trainings: OnboardingTraining[]): number {
  if (trainings.length === 0) return 0
  const completed = trainings.filter((t) => t.status === 'completed').length
  return Math.round((completed / trainings.length) * 100)
}

/**
 * 计算培训通过率
 */
export function calculateTrainingPassRate(trainings: OnboardingTraining[]): number {
  const completedTrainings = trainings.filter((t) => t.status === 'completed' && t.passed !== null)
  if (completedTrainings.length === 0) return 0
  const passed = completedTrainings.filter((t) => t.passed === true).length
  return Math.round((passed / completedTrainings.length) * 100)
}

/**
 * 判断候选人是否可以发送Offer
 */
export function canSendOffer(candidate: Candidate, interviews: Interview[]): boolean {
  // 至少有一次面试通过
  const hasPassedInterview = interviews.some((i) => i.result === 'passed')
  // 候选人状态为已面试
  const isInterviewed = candidate.status === 'interviewed'

  return hasPassedInterview && isInterviewed
}

/**
 * 判断是否可以开始入职
 */
export function canStartOnboarding(offer: Offer): boolean {
  return offer.status === 'accepted'
}
