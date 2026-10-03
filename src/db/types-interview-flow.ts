/**
 * 面试到入职完整流程 - TypeScript 类型定义
 *
 * 设计理念：容易学、容易做、容易管
 *
 * 核心流程：
 * 1. 发送面试邀约 → 2. 候选人填写信息 → 3. 初试评价 → 4. 复试评价（可重复）
 * → 5. 综合评估 → 6. 转入职办理 → 7. 完善入职信息 → 8. 领取物品
 * → 9. 分配导师 → 10. 岗前培训 → 11. 培训评估 → 12. 进入试用期
 */

// ==================== 面试邀约 ====================

export type InterviewType = 'initial' | 'retest'
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired'

export interface InterviewInvitation {
  id: string
  tenant_id: string
  candidate_id: string
  position_id: string
  invitation_code: string
  interview_type: InterviewType
  interview_round: number
  interviewer_id: string | null
  scheduled_time: string | null
  location: string | null
  status: InvitationStatus
  expires_at: string | null
  accepted_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 面试评价 ====================

export type EvaluationRecommendation = 'pass' | 'retest' | 'reject'

export interface InterviewEvaluation {
  id: string
  tenant_id: string
  candidate_id: string
  invitation_id: string
  interviewer_id: string
  interview_round: number
  evaluation_date: string
  overall_score: number | null
  professional_skills: number | null
  communication_skills: number | null
  team_fit: number | null
  work_attitude: number | null
  strengths: string | null
  weaknesses: string | null
  recommendation: EvaluationRecommendation | null
  comments: string | null
  next_round_suggested: boolean
  created_at: string
  updated_at: string
}

// ==================== 入职物品 ====================

export type ItemCategory = 'equipment' | 'uniform' | 'document' | 'other'

export interface OnboardingItem {
  id: string
  tenant_id: string
  item_name: string
  item_category: ItemCategory
  description: string | null
  is_required: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// ==================== 物品领取记录 ====================

export type ItemAssignmentStatus = 'pending' | 'received' | 'returned'

export interface OnboardingItemAssignment {
  id: string
  tenant_id: string
  employee_id: string
  item_id: string
  assigned_date: string
  received_date: string | null
  status: ItemAssignmentStatus
  quantity: number
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 导师关系 ====================

export type MentorshipStatus = 'active' | 'completed' | 'terminated'

export interface MentorRelationship {
  id: string
  tenant_id: string
  mentor_id: string
  mentee_id: string
  start_date: string
  end_date: string | null
  status: MentorshipStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 培训课程 ====================

export type CourseType = 'onboarding' | 'skill' | 'safety' | 'other'

export interface TrainingCourse {
  id: string
  tenant_id: string
  course_name: string
  course_type: CourseType
  description: string | null
  duration_hours: number | null
  is_required: boolean
  passing_score: number
  content: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ==================== 培训记录 ====================

export type TrainingStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface TrainingRecord {
  id: string
  tenant_id: string
  employee_id: string
  course_id: string
  assigned_date: string
  start_date: string | null
  completion_date: string | null
  status: TrainingStatus
  score: number | null
  passed: boolean | null
  trainer_id: string | null
  feedback: string | null
  created_at: string
  updated_at: string
}

// ==================== 试用期管理 ====================

export type ProbationStatus = 'active' | 'passed' | 'failed' | 'extended'
export type ProbationDecision = 'convert' | 'extend' | 'terminate'

export interface ProbationPeriod {
  id: string
  tenant_id: string
  employee_id: string
  start_date: string
  end_date: string
  duration_months: number
  status: ProbationStatus
  evaluation_score: number | null
  evaluation_comments: string | null
  evaluated_by: string | null
  evaluated_at: string | null
  final_decision: ProbationDecision | null
  decision_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 扩展类型（带关联数据） ====================

export interface InterviewInvitationWithDetails extends InterviewInvitation {
  candidate_name?: string
  position_title?: string
  interviewer_name?: string
}

export interface InterviewEvaluationWithDetails extends InterviewEvaluation {
  candidate_name?: string
  interviewer_name?: string
  invitation?: InterviewInvitation
}

export interface OnboardingItemAssignmentWithDetails extends OnboardingItemAssignment {
  item?: OnboardingItem
  employee_name?: string
}

export interface MentorRelationshipWithDetails extends MentorRelationship {
  mentor_name?: string
  mentee_name?: string
}

export interface TrainingRecordWithDetails extends TrainingRecord {
  course?: TrainingCourse
  employee_name?: string
  trainer_name?: string
}

export interface ProbationPeriodWithDetails extends ProbationPeriod {
  employee_name?: string
  evaluator_name?: string
}

// ==================== 统计数据类型 ====================

export interface InterviewFlowStats {
  total_invitations: number
  pending_invitations: number
  completed_interviews: number
  pass_rate: number
  average_score: number
  by_round: {
    round: number
    count: number
    pass_count: number
  }[]
}

export interface OnboardingProgressStats {
  total_employees: number
  info_completed: number
  items_received: number
  mentor_assigned: number
  training_completed: number
  in_probation: number
}

export interface TrainingStats {
  total_courses: number
  total_records: number
  completed_count: number
  pass_rate: number
  average_score: number
  by_type: {
    type: CourseType
    count: number
    pass_count: number
  }[]
}

// ==================== 创建/更新输入类型 ====================

export type CreateInterviewInvitationInput = Omit<InterviewInvitation, 'id' | 'created_at' | 'updated_at'>
export type UpdateInterviewInvitationInput = Partial<Omit<InterviewInvitation, 'id' | 'created_at' | 'updated_at'>>

export type CreateInterviewEvaluationInput = Omit<InterviewEvaluation, 'id' | 'created_at' | 'updated_at'>
export type UpdateInterviewEvaluationInput = Partial<Omit<InterviewEvaluation, 'id' | 'created_at' | 'updated_at'>>

export type CreateOnboardingItemInput = Omit<OnboardingItem, 'id' | 'created_at' | 'updated_at'>
export type UpdateOnboardingItemInput = Partial<Omit<OnboardingItem, 'id' | 'created_at' | 'updated_at'>>

export type CreateOnboardingItemAssignmentInput = Omit<OnboardingItemAssignment, 'id' | 'created_at' | 'updated_at'>
export type UpdateOnboardingItemAssignmentInput = Partial<
  Omit<OnboardingItemAssignment, 'id' | 'created_at' | 'updated_at'>
>

export type CreateMentorRelationshipInput = Omit<MentorRelationship, 'id' | 'created_at' | 'updated_at'>
export type UpdateMentorRelationshipInput = Partial<Omit<MentorRelationship, 'id' | 'created_at' | 'updated_at'>>

export type CreateTrainingCourseInput = Omit<TrainingCourse, 'id' | 'created_at' | 'updated_at'>
export type UpdateTrainingCourseInput = Partial<Omit<TrainingCourse, 'id' | 'created_at' | 'updated_at'>>

export type CreateTrainingRecordInput = Omit<TrainingRecord, 'id' | 'created_at' | 'updated_at'>
export type UpdateTrainingRecordInput = Partial<Omit<TrainingRecord, 'id' | 'created_at' | 'updated_at'>>

export type CreateProbationPeriodInput = Omit<ProbationPeriod, 'id' | 'created_at' | 'updated_at'>
export type UpdateProbationPeriodInput = Partial<Omit<ProbationPeriod, 'id' | 'created_at' | 'updated_at'>>
