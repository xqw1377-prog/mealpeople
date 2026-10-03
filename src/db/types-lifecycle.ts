/**
 * 员工生命周期管理系统 - TypeScript类型定义
 */

// ============================================
// 1. 招聘管理模块
// ============================================

/**
 * 招聘职位状态
 */
export type RecruitmentPositionStatus = 'open' | 'closed'

/**
 * 招聘职位
 */
export interface RecruitmentPosition {
  id: string
  tenant_id: string
  title: string // 职位名称
  department?: string // 部门
  description?: string // 职位描述
  requirements?: string // 任职要求
  salary_range?: string // 薪资范围
  status: RecruitmentPositionStatus // 状态
  created_by?: string // 创建人ID
  created_at: string
  updated_at: string
}

/**
 * 候选人状态
 */
export type CandidateStatus = 'pending' | 'interview' | 'offer' | 'hired' | 'rejected'

/**
 * 候选人
 */
export interface Candidate {
  id: string
  tenant_id: string
  position_id?: string // 关联职位ID
  name: string // 姓名
  phone?: string // 手机号
  email?: string // 邮箱
  resume_url?: string // 简历URL
  status: CandidateStatus // 状态
  source?: string // 来源
  created_at: string
  updated_at: string
}

/**
 * 面试结果
 */
export type InterviewResult = 'pass' | 'fail' | 'pending'

/**
 * 面试记录
 */
export interface Interview {
  id: string
  candidate_id: string // 候选人ID
  interviewer_id?: string // 面试官ID
  interview_date?: string // 面试时间
  interview_type?: string // 面试类型：'初试', '复试', '终试'
  feedback?: string // 面试反馈
  score?: number // 评分(0-100)
  result?: InterviewResult // 结果
  created_at: string
}

// ============================================
// 2. 入职管理模块
// ============================================

/**
 * 入职流程状态
 */
export type OnboardingProcessStatus = 'pending' | 'in_progress' | 'completed'

/**
 * 入职流程
 */
export interface OnboardingProcess {
  id: string
  tenant_id: string
  employee_id?: string // 员工ID
  candidate_id?: string // 候选人ID
  status: OnboardingProcessStatus // 状态
  start_date?: string // 开始日期
  expected_completion_date?: string // 预计完成日期
  actual_completion_date?: string // 实际完成日期
  created_at: string
  updated_at: string
}

/**
 * 入职任务状态
 */
export type OnboardingTaskStatus = 'pending' | 'completed'

/**
 * 入职任务
 */
export interface OnboardingTask {
  id: string
  process_id: string // 入职流程ID
  task_name: string // 任务名称
  description?: string // 任务描述
  task_type?: string // 任务类型：'资料收集', '培训', '系统开通', '物品领取'
  status: OnboardingTaskStatus // 状态
  completed_at?: string // 完成时间
  completed_by?: string // 完成人ID
  created_at: string
}

// ============================================
// 3. 员工生命周期追踪
// ============================================

/**
 * 员工生命周期事件类型
 */
export type EmployeeLifecycleEventType =
  | 'applied' // 投递简历
  | 'interviewed' // 面试
  | 'hired' // 录用
  | 'onboarded' // 入职
  | 'promoted' // 晋升
  | 'transferred' // 调岗
  | 'resigned' // 离职
  | 'terminated' // 辞退

/**
 * 员工生命周期事件
 */
export interface EmployeeLifecycleEvent {
  id: string
  employee_id: string // 员工ID
  event_type: EmployeeLifecycleEventType // 事件类型
  event_date: string // 事件日期
  description?: string // 事件描述
  metadata?: Record<string, any> // 额外数据
  created_by?: string // 创建人ID
  created_at: string
}

// ============================================
// 4. 离职管理模块
// ============================================

/**
 * 离职申请状态
 */
export type ResignationRequestStatus = 'pending' | 'approved' | 'rejected' | 'completed'

/**
 * 离职申请
 */
export interface ResignationRequest {
  id: string
  tenant_id: string
  employee_id: string // 员工ID
  reason_type?: string // 离职原因类型：'个人原因', '家庭原因', '职业发展', '薪资待遇', '其他'
  reason_detail?: string // 详细原因
  resignation_date?: string // 申请日期
  last_working_day?: string // 最后工作日
  status: ResignationRequestStatus // 状态
  approved_by?: string // 审批人ID
  approved_at?: string // 审批时间
  created_at: string
}

/**
 * 离职面谈
 */
export interface ExitInterview {
  id: string
  resignation_id: string // 离职申请ID
  interviewer_id?: string // 面谈人ID
  interview_date?: string // 面谈日期
  satisfaction_score?: number // 满意度评分(1-5)
  feedback?: string // 反馈意见
  suggestions?: string // 改进建议
  would_recommend?: boolean // 是否愿意推荐
  created_at: string
}

// ============================================
// 5. 扩展类型（带关联数据）
// ============================================

/**
 * 候选人（带职位信息）
 */
export interface CandidateWithPosition extends Candidate {
  position?: RecruitmentPosition
}

/**
 * 面试记录（带候选人信息）
 */
export interface InterviewWithCandidate extends Interview {
  candidate?: Candidate
}

/**
 * 入职流程（带任务列表）
 */
export interface OnboardingProcessWithTasks extends OnboardingProcess {
  tasks?: OnboardingTask[]
}

/**
 * 离职申请（带面谈信息）
 */
export interface ResignationRequestWithInterview extends ResignationRequest {
  exit_interview?: ExitInterview
}

// ============================================
// 6. 统计数据类型
// ============================================

/**
 * 招聘统计
 */
export interface RecruitmentStats {
  open_positions: number // 在招职位数
  pending_candidates: number // 待处理候选人数
  interview_scheduled: number // 待面试人数
  pending_onboarding: number // 待入职人数
}

/**
 * 入职统计
 */
export interface OnboardingStats {
  pending: number // 待开始
  in_progress: number // 进行中
  completed_this_month: number // 本月已完成
}

/**
 * 离职统计
 */
export interface ResignationStats {
  pending_approval: number // 待审批
  in_progress: number // 离职中
  completed_this_month: number // 本月已离职
  turnover_rate: number // 离职率
}
