// 完整的入职管理类型定义

// ==================== 候选人管理 ====================

/**
 * 候选人状态
 */
export type CandidateStatus =
  | 'screening' // 简历筛选
  | 'pending' // 待处理
  | 'interview_scheduled' // 已安排面试
  | 'interviewed' // 已面试
  | 'offer_sent' // 已发Offer
  | 'offer_accepted' // 已接受Offer
  | 'onboarding' // 入职中
  | 'rejected' // 已拒绝
  | 'withdrawn' // 已撤回

/**
 * 候选人来源
 */
export type CandidateSource =
  | 'recruitment_website' // 招聘网站
  | 'social_media' // 社交媒体
  | 'referral' // 内部推荐
  | 'campus' // 校园招聘
  | 'headhunter' // 猎头
  | 'walk_in' // 主动投递
  | 'other' // 其他

/**
 * 候选人表
 */
export interface Candidate {
  id: string
  tenant_id: string
  name: string
  phone: string
  email: string | null
  gender: string | null
  birth_date: string | null
  education: string | null
  major: string | null
  school: string | null
  work_experience: string | null
  expected_salary: number | null
  position: string
  department: string
  store_id: string | null
  resume_url: string | null
  status: CandidateStatus
  source: CandidateSource | null
  referrer_id: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ==================== 面试管理 ====================

/**
 * 面试类型
 */
export type InterviewType =
  | 'phone' // 电话面试
  | 'video' // 视频面试
  | 'onsite' // 现场面试
  | 'technical' // 技术面试
  | 'hr' // HR面试
  | 'final' // 终面

/**
 * 面试状态
 */
export type InterviewStatus =
  | 'scheduled' // 已安排
  | 'completed' // 已完成
  | 'cancelled' // 已取消
  | 'rescheduled' // 已改期

/**
 * 面试结果
 */
export type InterviewResult =
  | 'passed' // 通过
  | 'failed' // 未通过
  | 'pending' // 待定

/**
 * 面试表
 */
export interface Interview {
  id: string
  tenant_id: string
  candidate_id: string
  interview_type: InterviewType
  interview_date: string
  interview_location: string | null
  interviewer_ids: string[]
  status: InterviewStatus
  result: InterviewResult | null
  score: number | null
  feedback: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ==================== Offer管理 ====================

/**
 * 合同类型
 */
export type ContractType =
  | 'full_time' // 全职
  | 'part_time' // 兼职
  | 'contract' // 合同工
  | 'intern' // 实习生

/**
 * Offer状态
 */
export type OfferStatus =
  | 'pending' // 待回复
  | 'accepted' // 已接受
  | 'rejected' // 已拒绝
  | 'expired' // 已过期
  | 'withdrawn' // 已撤回

/**
 * Offer表
 */
export interface Offer {
  id: string
  tenant_id: string
  candidate_id: string
  position: string
  department: string
  store_id: string | null
  salary: number
  bonus: string | null
  benefits: string | null
  start_date: string
  probation_period: number
  contract_type: ContractType
  status: OfferStatus
  sent_date: string
  response_deadline: string | null
  accepted_date: string | null
  rejected_date: string | null
  rejection_reason: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// ==================== 入职审批 ====================

/**
 * 审批状态
 */
export type ApprovalStatus =
  | 'pending' // 待审批
  | 'approved' // 已通过
  | 'rejected' // 已拒绝
  | 'skipped' // 已跳过

/**
 * 审批人角色
 */
export type ApproverRole = '直属上级' | '部门经理' | 'HR经理' | '总经理' | '其他'

/**
 * 入职审批表
 */
export interface OnboardingApproval {
  id: string
  tenant_id: string
  application_id: string
  approver_id: string
  approver_role: ApproverRole
  approval_level: number
  status: ApprovalStatus
  approved_at: string | null
  rejected_at: string | null
  comments: string | null
  created_at: string
}

// ==================== 入职培训 ====================

/**
 * 培训类型
 */
export type TrainingType =
  | 'orientation' // 入职培训
  | 'company_culture' // 企业文化
  | 'rules_regulations' // 规章制度
  | 'job_skills' // 岗位技能
  | 'safety' // 安全培训
  | 'other' // 其他

/**
 * 培训状态
 */
export type TrainingStatus =
  | 'scheduled' // 已安排
  | 'in_progress' // 进行中
  | 'completed' // 已完成
  | 'cancelled' // 已取消

/**
 * 出勤状态
 */
export type AttendanceStatus =
  | 'present' // 出席
  | 'absent' // 缺席
  | 'late' // 迟到
  | 'leave_early' // 早退

/**
 * 入职培训表
 */
export interface OnboardingTraining {
  id: string
  tenant_id: string
  application_id: string
  training_name: string
  training_type: TrainingType
  training_date: string
  training_location: string | null
  trainer_id: string | null
  duration: number | null
  status: TrainingStatus
  attendance_status: AttendanceStatus | null
  score: number | null
  passed: boolean | null
  certificate_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 试用期评估 ====================

/**
 * 评估建议
 */
export type EvaluationRecommendation =
  | 'pass' // 通过转正
  | 'extend' // 延长试用期
  | 'terminate' // 终止试用

/**
 * 评估状态
 */
export type EvaluationStatus =
  | 'pending' // 待审批
  | 'approved' // 已通过
  | 'rejected' // 已拒绝

/**
 * 试用期评估表
 */
export interface ProbationEvaluation {
  id: string
  tenant_id: string
  employee_id: string
  evaluation_date: string
  evaluator_id: string
  work_performance: number
  work_attitude: number
  team_collaboration: number
  learning_ability: number
  overall_score: number
  strengths: string | null
  weaknesses: string | null
  improvement_suggestions: string | null
  recommendation: EvaluationRecommendation
  status: EvaluationStatus
  approved_by: string | null
  approved_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 组合类型 ====================

/**
 * 候选人详情（包含关联数据）
 */
export interface CandidateDetail extends Candidate {
  interviews?: Interview[]
  offers?: Offer[]
  referrer?: {
    id: string
    name: string
  }
}

/**
 * 面试详情（包含关联数据）
 */
export interface InterviewDetail extends Interview {
  candidate?: Candidate
  interviewers?: Array<{
    id: string
    name: string
  }>
}

/**
 * Offer详情（包含关联数据）
 */
export interface OfferDetail extends Offer {
  candidate?: Candidate
}

/**
 * 入职申请详情（包含审批、培训等）
 */
export interface OnboardingApplicationDetail {
  application: any // 使用现有的OnboardingApplication类型
  approvals: OnboardingApproval[]
  trainings: OnboardingTraining[]
  tasks: any[] // 使用现有的OnboardingTask类型
  documents: any[] // 使用现有的OnboardingDocument类型
}

/**
 * 试用期评估详情（包含关联数据）
 */
export interface ProbationEvaluationDetail extends ProbationEvaluation {
  employee?: {
    id: string
    name: string
    position: string
    department: string
  }
  evaluator?: {
    id: string
    name: string
  }
}

// ==================== 统计类型 ====================

/**
 * 候选人统计
 */
export interface CandidateStatistics {
  total: number
  by_status: Record<CandidateStatus, number>
  by_source: Record<string, number>
  by_position: Record<string, number>
  by_department: Record<string, number>
}

/**
 * 面试统计
 */
export interface InterviewStatistics {
  total: number
  scheduled: number
  completed: number
  passed: number
  failed: number
  average_score: number
}

/**
 * Offer统计
 */
export interface OfferStatistics {
  total: number
  pending: number
  accepted: number
  rejected: number
  acceptance_rate: number
}

/**
 * 培训统计
 */
export interface TrainingStatistics {
  total: number
  completed: number
  average_score: number
  pass_rate: number
}

/**
 * 试用期统计
 */
export interface ProbationStatistics {
  total: number
  passed: number
  extended: number
  terminated: number
  pass_rate: number
}

// ==================== 常量定义 ====================

/**
 * 候选人状态名称
 */
export const CANDIDATE_STATUS_NAMES: Record<CandidateStatus, string> = {
  screening: '简历筛选',
  pending: '待处理',
  interview_scheduled: '已安排面试',
  interviewed: '已面试',
  offer_sent: '已发Offer',
  offer_accepted: '已接受Offer',
  onboarding: '入职中',
  rejected: '已拒绝',
  withdrawn: '已撤回'
}

/**
 * 候选人状态颜色
 */
export const CANDIDATE_STATUS_COLORS: Record<CandidateStatus, string> = {
  screening: 'text-yellow-600',
  pending: 'text-gray-600',
  interview_scheduled: 'text-blue-600',
  interviewed: 'text-purple-600',
  offer_sent: 'text-orange-600',
  offer_accepted: 'text-green-600',
  onboarding: 'text-cyan-600',
  rejected: 'text-red-600',
  withdrawn: 'text-gray-600'
}

/**
 * 面试类型名称
 */
export const INTERVIEW_TYPE_NAMES: Record<InterviewType, string> = {
  phone: '电话面试',
  video: '视频面试',
  onsite: '现场面试',
  technical: '技术面试',
  hr: 'HR面试',
  final: '终面'
}

/**
 * 面试状态名称
 */
export const INTERVIEW_STATUS_NAMES: Record<InterviewStatus, string> = {
  scheduled: '已安排',
  completed: '已完成',
  cancelled: '已取消',
  rescheduled: '已改期'
}

/**
 * 面试结果名称
 */
export const INTERVIEW_RESULT_NAMES: Record<InterviewResult, string> = {
  passed: '通过',
  failed: '未通过',
  pending: '待定'
}

/**
 * Offer状态名称
 */
export const OFFER_STATUS_NAMES: Record<OfferStatus, string> = {
  pending: '待回复',
  accepted: '已接受',
  rejected: '已拒绝',
  expired: '已过期',
  withdrawn: '已撤回'
}

/**
 * Offer状态颜色
 */
export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
  pending: 'text-orange-600',
  accepted: 'text-green-600',
  rejected: 'text-red-600',
  expired: 'text-gray-600',
  withdrawn: 'text-gray-600'
}

/**
 * 审批状态名称
 */
export const APPROVAL_STATUS_NAMES: Record<ApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  skipped: '已跳过'
}

/**
 * 审批状态颜色
 */
export const APPROVAL_STATUS_COLORS: Record<ApprovalStatus, string> = {
  pending: 'text-orange-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  skipped: 'text-gray-600'
}

/**
 * 培训类型名称
 */
export const TRAINING_TYPE_NAMES: Record<TrainingType, string> = {
  orientation: '入职培训',
  company_culture: '企业文化',
  rules_regulations: '规章制度',
  job_skills: '岗位技能',
  safety: '安全培训',
  other: '其他'
}

/**
 * 培训状态名称
 */
export const TRAINING_STATUS_NAMES: Record<TrainingStatus, string> = {
  scheduled: '已安排',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

/**
 * 评估建议名称
 */
export const EVALUATION_RECOMMENDATION_NAMES: Record<EvaluationRecommendation, string> = {
  pass: '通过转正',
  extend: '延长试用期',
  terminate: '终止试用'
}

/**
 * 评估建议颜色
 */
export const EVALUATION_RECOMMENDATION_COLORS: Record<EvaluationRecommendation, string> = {
  pass: 'text-green-600',
  extend: 'text-orange-600',
  terminate: 'text-red-600'
}
