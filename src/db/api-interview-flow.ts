/**
 * 面试到入职完整流程 - API 实现
 *
 * 设计理念：容易学、容易做、容易管
 *
 * 功能模块：
 * 1. 面试邀约管理
 * 2. 面试评价管理
 * 3. 入职物品管理
 * 4. 物品领取管理
 * 5. 导师关系管理
 * 6. 培训课程管理
 * 7. 培训记录管理
 * 8. 试用期管理
 */

import {supabase} from '@/client/supabase'
import type {
  CreateInterviewEvaluationInput,
  CreateInterviewInvitationInput,
  CreateMentorRelationshipInput,
  CreateOnboardingItemAssignmentInput,
  CreateOnboardingItemInput,
  CreateProbationPeriodInput,
  CreateTrainingCourseInput,
  CreateTrainingRecordInput,
  InterviewEvaluation,
  InterviewFlowStats,
  InterviewInvitation,
  InterviewInvitationWithDetails,
  MentorRelationship,
  OnboardingItem,
  OnboardingItemAssignment,
  OnboardingItemAssignmentWithDetails,
  OnboardingProgressStats,
  ProbationPeriod,
  TrainingCourse,
  TrainingRecord,
  TrainingRecordWithDetails,
  TrainingStats,
  UpdateInterviewEvaluationInput,
  UpdateInterviewInvitationInput,
  UpdateMentorRelationshipInput,
  UpdateOnboardingItemAssignmentInput,
  UpdateOnboardingItemInput,
  UpdateProbationPeriodInput,
  UpdateTrainingCourseInput,
  UpdateTrainingRecordInput
} from './types-interview-flow'

// ==================== 1. 面试邀约管理 ====================

/**
 * 生成唯一的面试邀约码
 */
export function generateInvitationCode(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `IV-${timestamp}-${random}`.toUpperCase()
}

/**
 * 创建面试邀约
 */
export async function createInterviewInvitation(
  input: CreateInterviewInvitationInput
): Promise<InterviewInvitation | null> {
  try {
    const {data, error} = await supabase.from('interview_invitations').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建面试邀约失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建面试邀约异常:', error)
    return null
  }
}

/**
 * 通过邀约码获取面试邀约
 */
export async function getInvitationByCode(code: string): Promise<InterviewInvitationWithDetails | null> {
  try {
    const {data, error} = await supabase
      .from('interview_invitations')
      .select('*')
      .eq('invitation_code', code)
      .maybeSingle()

    if (error) {
      console.error('获取面试邀约失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取面试邀约异常:', error)
    return null
  }
}

/**
 * 获取候选人的所有面试邀约
 */
export async function getCandidateInvitations(candidateId: string): Promise<InterviewInvitation[]> {
  try {
    const {data, error} = await supabase
      .from('interview_invitations')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', {ascending: false})

    if (error) {
      console.error('获取候选人面试邀约失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取候选人面试邀约异常:', error)
    return []
  }
}

/**
 * 更新面试邀约
 */
export async function updateInterviewInvitation(
  id: string,
  updates: UpdateInterviewInvitationInput
): Promise<InterviewInvitation | null> {
  try {
    const {data, error} = await supabase
      .from('interview_invitations')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('更新面试邀约失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('更新面试邀约异常:', error)
    return null
  }
}

/**
 * 接受面试邀约
 */
export async function acceptInvitation(id: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('interview_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('接受面试邀约失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('接受面试邀约异常:', error)
    return false
  }
}

/**
 * 获取租户的所有面试邀约
 */
export async function getTenantInvitations(tenantId: string): Promise<InterviewInvitation[]> {
  try {
    const {data, error} = await supabase
      .from('interview_invitations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', {ascending: false})

    if (error) {
      console.error('获取租户面试邀约失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取租户面试邀约异常:', error)
    return []
  }
}

// ==================== 2. 面试评价管理 ====================

/**
 * 创建面试评价
 */
export async function createInterviewEvaluation(
  input: CreateInterviewEvaluationInput
): Promise<InterviewEvaluation | null> {
  try {
    const {data, error} = await supabase.from('interview_evaluations').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建面试评价失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建面试评价异常:', error)
    return null
  }
}

/**
 * 获取候选人的所有面试评价
 */
export async function getCandidateEvaluations(candidateId: string): Promise<InterviewEvaluation[]> {
  try {
    const {data, error} = await supabase
      .from('interview_evaluations')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('interview_round', {ascending: true})

    if (error) {
      console.error('获取候选人面试评价失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取候选人面试评价异常:', error)
    return []
  }
}

/**
 * 获取面试邀约的评价
 */
export async function getInvitationEvaluation(invitationId: string): Promise<InterviewEvaluation | null> {
  try {
    const {data, error} = await supabase
      .from('interview_evaluations')
      .select('*')
      .eq('invitation_id', invitationId)
      .maybeSingle()

    if (error) {
      console.error('获取面试评价失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取面试评价异常:', error)
    return null
  }
}

/**
 * 更新面试评价
 */
export async function updateInterviewEvaluation(
  id: string,
  updates: UpdateInterviewEvaluationInput
): Promise<InterviewEvaluation | null> {
  try {
    const {data, error} = await supabase
      .from('interview_evaluations')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('更新面试评价失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('更新面试评价异常:', error)
    return null
  }
}

/**
 * 计算候选人的平均分数
 */
export async function calculateCandidateAverageScore(candidateId: string): Promise<number> {
  try {
    const evaluations = await getCandidateEvaluations(candidateId)
    if (evaluations.length === 0) return 0

    const totalScore = evaluations.reduce((sum, evaluation) => sum + (evaluation.overall_score || 0), 0)
    return Math.round((totalScore / evaluations.length) * 10) / 10
  } catch (error) {
    console.error('计算候选人平均分数异常:', error)
    return 0
  }
}

// ==================== 3. 入职物品管理 ====================

/**
 * 创建入职物品
 */
export async function createOnboardingItem(input: CreateOnboardingItemInput): Promise<OnboardingItem | null> {
  try {
    const {data, error} = await supabase.from('onboarding_items').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建入职物品失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建入职物品异常:', error)
    return null
  }
}

/**
 * 获取租户的所有入职物品
 */
export async function getTenantOnboardingItems(tenantId: string): Promise<OnboardingItem[]> {
  try {
    const {data, error} = await supabase
      .from('onboarding_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('item_category', {ascending: true})

    if (error) {
      console.error('获取租户入职物品失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取租户入职物品异常:', error)
    return []
  }
}

/**
 * 更新入职物品
 */
export async function updateOnboardingItem(
  id: string,
  updates: UpdateOnboardingItemInput
): Promise<OnboardingItem | null> {
  try {
    const {data, error} = await supabase.from('onboarding_items').update(updates).eq('id', id).select().maybeSingle()

    if (error) {
      console.error('更新入职物品失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('更新入职物品异常:', error)
    return null
  }
}

/**
 * 删除入职物品（软删除）
 */
export async function deleteOnboardingItem(id: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('onboarding_items').update({is_active: false}).eq('id', id)

    if (error) {
      console.error('删除入职物品失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除入职物品异常:', error)
    return false
  }
}

// ==================== 4. 物品领取管理 ====================

/**
 * 为员工分配入职物品
 */
export async function assignItemsToEmployee(employeeId: string, tenantId: string): Promise<OnboardingItemAssignment[]> {
  try {
    // 获取所有必需的物品
    const items = await getTenantOnboardingItems(tenantId)
    const requiredItems = items.filter((item) => item.is_required)

    // 为每个必需物品创建分配记录
    const assignments: CreateOnboardingItemAssignmentInput[] = requiredItems.map((item) => ({
      tenant_id: tenantId,
      employee_id: employeeId,
      item_id: item.id,
      assigned_date: new Date().toISOString(),
      status: 'pending',
      quantity: 1,
      notes: null,
      received_date: null
    }))

    const {data, error} = await supabase.from('onboarding_item_assignments').insert(assignments).select()

    if (error) {
      console.error('分配入职物品失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('分配入职物品异常:', error)
    return []
  }
}

/**
 * 获取员工的物品领取记录
 */
export async function getEmployeeItemAssignments(employeeId: string): Promise<OnboardingItemAssignmentWithDetails[]> {
  try {
    const {data, error} = await supabase
      .from('onboarding_item_assignments')
      .select('*')
      .eq('employee_id', employeeId)
      .order('assigned_date', {ascending: false})

    if (error) {
      console.error('获取员工物品领取记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取员工物品领取记录异常:', error)
    return []
  }
}

/**
 * 获取租户的所有物品分配记录（HR端）
 */
export async function getTenantItemAssignments(tenantId: string): Promise<OnboardingItemAssignmentWithDetails[]> {
  try {
    const {data, error} = await supabase
      .from('onboarding_item_assignments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('assigned_date', {ascending: false})

    if (error) {
      console.error('获取租户物品分配记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取租户物品分配记录异常:', error)
    return []
  }
}

/**
 * 标记物品已领取
 */
export async function markItemAsReceived(assignmentId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('onboarding_item_assignments')
      .update({
        status: 'received',
        received_date: new Date().toISOString()
      })
      .eq('id', assignmentId)

    if (error) {
      console.error('标记物品已领取失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('标记物品已领取异常:', error)
    return false
  }
}

/**
 * 更新物品领取记录
 */
export async function updateItemAssignment(
  id: string,
  updates: UpdateOnboardingItemAssignmentInput
): Promise<OnboardingItemAssignment | null> {
  try {
    const {data, error} = await supabase
      .from('onboarding_item_assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('更新物品领取记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('更新物品领取记录异常:', error)
    return null
  }
}

// ==================== 5. 导师关系管理 ====================

/**
 * 创建导师关系
 */
export async function createMentorRelationship(
  input: CreateMentorRelationshipInput
): Promise<MentorRelationship | null> {
  try {
    const {data, error} = await supabase.from('mentor_relationships').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建导师关系失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建导师关系异常:', error)
    return null
  }
}

/**
 * 获取员工的导师
 */
export async function getEmployeeMentor(employeeId: string): Promise<MentorRelationship | null> {
  try {
    const {data, error} = await supabase
      .from('mentor_relationships')
      .select('*')
      .eq('mentee_id', employeeId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error('获取员工导师失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取员工导师异常:', error)
    return null
  }
}

/**
 * 获取导师的所有学员
 */
export async function getMentorMentees(mentorId: string): Promise<MentorRelationship[]> {
  try {
    const {data, error} = await supabase
      .from('mentor_relationships')
      .select('*')
      .eq('mentor_id', mentorId)
      .eq('status', 'active')
      .order('start_date', {ascending: false})

    if (error) {
      console.error('获取导师学员失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取导师学员异常:', error)
    return []
  }
}

/**
 * 获取租户的所有导师关系
 */
export async function getTenantMentorRelationships(tenantId: string): Promise<MentorRelationship[]> {
  try {
    const {data, error} = await supabase
      .from('mentor_relationships')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('start_date', {ascending: false})

    if (error) {
      console.error('获取租户导师关系失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取租户导师关系异常:', error)
    return []
  }
}

/**
 * 更新导师关系
 */
export async function updateMentorRelationship(
  id: string,
  updates: UpdateMentorRelationshipInput
): Promise<MentorRelationship | null> {
  try {
    const {data, error} = await supabase
      .from('mentor_relationships')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('更新导师关系失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('更新导师关系异常:', error)
    return null
  }
}

/**
 * 结束导师关系
 */
export async function completeMentorRelationship(id: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('mentor_relationships')
      .update({
        status: 'completed',
        end_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', id)

    if (error) {
      console.error('结束导师关系失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('结束导师关系异常:', error)
    return false
  }
}

// ==================== 6. 培训课程管理 ====================

/**
 * 创建培训课程
 */
export async function createTrainingCourse(input: CreateTrainingCourseInput): Promise<TrainingCourse | null> {
  try {
    const {data, error} = await supabase.from('training_courses').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建培训课程失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建培训课程异常:', error)
    return null
  }
}

/**
 * 获取租户的所有培训课程
 */
export async function getTenantTrainingCourses(tenantId: string): Promise<TrainingCourse[]> {
  try {
    const {data, error} = await supabase
      .from('training_courses')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('course_type', {ascending: true})

    if (error) {
      console.error('获取租户培训课程失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取租户培训课程异常:', error)
    return []
  }
}

/**
 * 获取必修课程
 */
export async function getRequiredCourses(tenantId: string): Promise<TrainingCourse[]> {
  try {
    const {data, error} = await supabase
      .from('training_courses')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_required', true)
      .eq('is_active', true)
      .order('course_type', {ascending: true})

    if (error) {
      console.error('获取必修课程失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取必修课程异常:', error)
    return []
  }
}

/**
 * 更新培训课程
 */
export async function updateTrainingCourse(
  id: string,
  updates: UpdateTrainingCourseInput
): Promise<TrainingCourse | null> {
  try {
    const {data, error} = await supabase.from('training_courses').update(updates).eq('id', id).select().maybeSingle()

    if (error) {
      console.error('更新培训课程失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('更新培训课程异常:', error)
    return null
  }
}

/**
 * 删除培训课程（软删除）
 */
export async function deleteTrainingCourse(id: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('training_courses').update({is_active: false}).eq('id', id)

    if (error) {
      console.error('删除培训课程失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除培训课程异常:', error)
    return false
  }
}

// ==================== 7. 培训记录管理 ====================

/**
 * 为员工分配培训课程
 */
export async function assignCoursesToEmployee(employeeId: string, tenantId: string): Promise<TrainingRecord[]> {
  try {
    // 获取所有必修课程
    const courses = await getRequiredCourses(tenantId)

    // 为每个必修课程创建培训记录
    const records: CreateTrainingRecordInput[] = courses.map((course) => ({
      tenant_id: tenantId,
      employee_id: employeeId,
      course_id: course.id,
      assigned_date: new Date().toISOString(),
      status: 'pending',
      score: null,
      passed: null,
      trainer_id: null,
      feedback: null,
      start_date: null,
      completion_date: null
    }))

    const {data, error} = await supabase.from('training_records').insert(records).select()

    if (error) {
      console.error('分配培训课程失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('分配培训课程异常:', error)
    return []
  }
}

/**
 * 获取员工的培训记录
 */
export async function getEmployeeTrainingRecords(employeeId: string): Promise<TrainingRecordWithDetails[]> {
  try {
    const {data, error} = await supabase
      .from('training_records')
      .select('*')
      .eq('employee_id', employeeId)
      .order('assigned_date', {ascending: false})

    if (error) {
      console.error('获取员工培训记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取员工培训记录异常:', error)
    return []
  }
}

/**
 * 获取租户的所有培训记录
 */
export async function getTenantTrainingRecords(tenantId: string): Promise<TrainingRecord[]> {
  try {
    const {data, error} = await supabase
      .from('training_records')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('assigned_date', {ascending: false})

    if (error) {
      console.error('获取租户培训记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取租户培训记录异常:', error)
    return []
  }
}

/**
 * 创建培训记录
 */
export async function createTrainingRecord(input: CreateTrainingRecordInput): Promise<TrainingRecord | null> {
  try {
    const {data, error} = await supabase.from('training_records').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建培训记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建培训记录异常:', error)
    return null
  }
}

/**
 * 更新培训记录
 */
export async function updateTrainingRecord(
  id: string,
  updates: UpdateTrainingRecordInput
): Promise<TrainingRecord | null> {
  try {
    const {data, error} = await supabase.from('training_records').update(updates).eq('id', id).select().maybeSingle()

    if (error) {
      console.error('更新培训记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('更新培训记录异常:', error)
    return null
  }
}

/**
 * 开始培训
 */
export async function startTraining(recordId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('training_records')
      .update({
        status: 'in_progress',
        start_date: new Date().toISOString()
      })
      .eq('id', recordId)

    if (error) {
      console.error('开始培训失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('开始培训异常:', error)
    return false
  }
}

/**
 * 完成培训并评分
 */
export async function completeTraining(recordId: string, score: number, feedback?: string): Promise<boolean> {
  try {
    // 获取培训记录和课程信息
    const {data: record} = await supabase
      .from('training_records')
      .select('*, course:course_id(*)')
      .eq('id', recordId)
      .maybeSingle()

    if (!record) {
      console.error('培训记录不存在')
      return false
    }

    const course = record.course as any
    const passed = score >= (course?.passing_score || 60)

    const {error} = await supabase
      .from('training_records')
      .update({
        status: passed ? 'completed' : 'failed',
        completion_date: new Date().toISOString(),
        score,
        passed,
        feedback: feedback || null
      })
      .eq('id', recordId)

    if (error) {
      console.error('完成培训失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('完成培训异常:', error)
    return false
  }
}

// ==================== 8. 试用期管理 ====================

/**
 * 创建试用期记录
 */
export async function createProbationPeriod(input: CreateProbationPeriodInput): Promise<ProbationPeriod | null> {
  try {
    const {data, error} = await supabase.from('probation_periods').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建试用期记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建试用期记录异常:', error)
    return null
  }
}

/**
 * 获取员工的试用期记录
 */
export async function getEmployeeProbationPeriod(employeeId: string): Promise<ProbationPeriod | null> {
  try {
    const {data, error} = await supabase
      .from('probation_periods')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      console.error('获取员工试用期记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取员工试用期记录异常:', error)
    return null
  }
}

/**
 * 获取租户的所有试用期记录
 */
export async function getTenantProbationPeriods(tenantId: string): Promise<ProbationPeriod[]> {
  try {
    const {data, error} = await supabase
      .from('probation_periods')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('start_date', {ascending: false})

    if (error) {
      console.error('获取租户试用期记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取租户试用期记录异常:', error)
    return []
  }
}

/**
 * 更新试用期记录
 */
export async function updateProbationPeriod(
  id: string,
  updates: UpdateProbationPeriodInput
): Promise<ProbationPeriod | null> {
  try {
    const {data, error} = await supabase.from('probation_periods').update(updates).eq('id', id).select().maybeSingle()

    if (error) {
      console.error('更新试用期记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('更新试用期记录异常:', error)
    return null
  }
}

/**
 * 评估试用期
 */
export async function evaluateProbation(
  id: string,
  score: number,
  comments: string,
  decision: 'convert' | 'extend' | 'terminate',
  evaluatorId: string
): Promise<boolean> {
  try {
    const status = decision === 'convert' ? 'passed' : decision === 'extend' ? 'extended' : 'failed'

    const {error} = await supabase
      .from('probation_periods')
      .update({
        status,
        evaluation_score: score,
        evaluation_comments: comments,
        evaluated_by: evaluatorId,
        evaluated_at: new Date().toISOString(),
        final_decision: decision,
        decision_date: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('评估试用期失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('评估试用期异常:', error)
    return false
  }
}

// ==================== 9. 统计分析 ====================

/**
 * 获取面试流程统计
 */
export async function getInterviewFlowStats(tenantId: string): Promise<InterviewFlowStats> {
  try {
    const invitations = await getTenantInvitations(tenantId)
    const evaluations = await supabase.from('interview_evaluations').select('*').eq('tenant_id', tenantId)

    const totalInvitations = invitations.length
    const pendingInvitations = invitations.filter((inv) => inv.status === 'pending').length
    const completedInterviews = invitations.filter((inv) => inv.status === 'completed').length

    const evalData = Array.isArray(evaluations.data) ? evaluations.data : []
    const passCount = evalData.filter((e) => e.recommendation === 'pass').length
    const passRate = evalData.length > 0 ? Math.round((passCount / evalData.length) * 100) : 0

    const totalScore = evalData.reduce((sum, e) => sum + (e.overall_score || 0), 0)
    const averageScore = evalData.length > 0 ? Math.round((totalScore / evalData.length) * 10) / 10 : 0

    // 按轮次统计
    const byRound: {round: number; count: number; pass_count: number}[] = []
    const rounds = [...new Set(evalData.map((e) => e.interview_round))]
    rounds.forEach((round) => {
      const roundEvals = evalData.filter((e) => e.interview_round === round)
      const roundPassCount = roundEvals.filter((e) => e.recommendation === 'pass').length
      byRound.push({
        round,
        count: roundEvals.length,
        pass_count: roundPassCount
      })
    })

    return {
      total_invitations: totalInvitations,
      pending_invitations: pendingInvitations,
      completed_interviews: completedInterviews,
      pass_rate: passRate,
      average_score: averageScore,
      by_round: byRound
    }
  } catch (error) {
    console.error('获取面试流程统计异常:', error)
    return {
      total_invitations: 0,
      pending_invitations: 0,
      completed_interviews: 0,
      pass_rate: 0,
      average_score: 0,
      by_round: []
    }
  }
}

/**
 * 获取入职进度统计
 */
export async function getOnboardingProgressStats(_tenantId: string): Promise<OnboardingProgressStats> {
  try {
    // 这里需要根据实际的员工表结构来实现
    // 暂时返回模拟数据
    return {
      total_employees: 0,
      info_completed: 0,
      items_received: 0,
      mentor_assigned: 0,
      training_completed: 0,
      in_probation: 0
    }
  } catch (error) {
    console.error('获取入职进度统计异常:', error)
    return {
      total_employees: 0,
      info_completed: 0,
      items_received: 0,
      mentor_assigned: 0,
      training_completed: 0,
      in_probation: 0
    }
  }
}

/**
 * 获取培训统计
 */
export async function getTrainingStats(tenantId: string): Promise<TrainingStats> {
  try {
    const courses = await getTenantTrainingCourses(tenantId)
    const {data: records} = await supabase.from('training_records').select('*').eq('tenant_id', tenantId)

    const recordsData = Array.isArray(records) ? records : []
    const completedCount = recordsData.filter((r) => r.status === 'completed').length
    const passCount = recordsData.filter((r) => r.passed === true).length
    const passRate = recordsData.length > 0 ? Math.round((passCount / recordsData.length) * 100) : 0

    const totalScore = recordsData.reduce((sum, r) => sum + (r.score || 0), 0)
    const averageScore = recordsData.length > 0 ? Math.round((totalScore / recordsData.length) * 10) / 10 : 0

    // 按类型统计
    const byType: {type: any; count: number; pass_count: number}[] = []
    const types = [...new Set(courses.map((c) => c.course_type))]
    types.forEach((type) => {
      const typeCourses = courses.filter((c) => c.course_type === type)
      const typeRecords = recordsData.filter((r) => typeCourses.some((c) => c.id === r.course_id))
      const typePassCount = typeRecords.filter((r) => r.passed === true).length
      byType.push({
        type,
        count: typeRecords.length,
        pass_count: typePassCount
      })
    })

    return {
      total_courses: courses.length,
      total_records: recordsData.length,
      completed_count: completedCount,
      pass_rate: passRate,
      average_score: averageScore,
      by_type: byType
    }
  } catch (error) {
    console.error('获取培训统计异常:', error)
    return {
      total_courses: 0,
      total_records: 0,
      completed_count: 0,
      pass_rate: 0,
      average_score: 0,
      by_type: []
    }
  }
}

// Re-export types for convenience
export type {
  ProbationPeriod,
  CreateProbationPeriodInput,
  UpdateProbationPeriodInput,
  InterviewInvitation,
  InterviewInvitationWithDetails,
  CreateInterviewInvitationInput,
  UpdateInterviewInvitationInput,
  InterviewEvaluation,
  CreateInterviewEvaluationInput,
  UpdateInterviewEvaluationInput,
  MentorRelationship,
  CreateMentorRelationshipInput,
  UpdateMentorRelationshipInput,
  OnboardingItem,
  OnboardingItemAssignment,
  OnboardingItemAssignmentWithDetails,
  CreateOnboardingItemInput,
  UpdateOnboardingItemInput,
  CreateOnboardingItemAssignmentInput,
  UpdateOnboardingItemAssignmentInput,
  TrainingCourse,
  TrainingRecord,
  TrainingRecordWithDetails,
  CreateTrainingCourseInput,
  UpdateTrainingCourseInput,
  CreateTrainingRecordInput,
  UpdateTrainingRecordInput,
  InterviewFlowStats,
  OnboardingProgressStats,
  TrainingStats
}
