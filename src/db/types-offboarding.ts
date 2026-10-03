// 离职管理相关类型定义

// ==================== 离职申请 ====================

// 离职类型
export type ResignationType = 'voluntary' | 'involuntary' | 'retirement' | 'contract_end' | 'other'

// 离职原因
export type ResignationReason =
  | 'career_development'
  | 'salary'
  | 'work_environment'
  | 'personal_reason'
  | 'relocation'
  | 'health'
  | 'family'
  | 'other'

// 申请状态
export type OffboardingApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// 离职申请表
export interface OffboardingApplication {
  id: string
  tenant_id: string
  employee_id: string
  application_date: string
  expected_leave_date: string
  resignation_type: ResignationType
  resignation_reason: ResignationReason
  detailed_reason: string | null
  status: OffboardingApplicationStatus
  submitted_at: string
  approved_by: string | null
  approved_at: string | null
  actual_leave_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 创建离职申请输入
export interface CreateOffboardingApplicationInput {
  tenant_id: string
  employee_id: string
  expected_leave_date: string
  resignation_type: ResignationType
  resignation_reason: ResignationReason
  detailed_reason?: string
}

// ==================== 离职面谈 ====================

// 离职面谈表
export interface OffboardingInterview {
  id: string
  tenant_id: string
  application_id: string
  employee_id: string
  interviewer_id: string
  interview_date: string
  interview_duration: number | null
  satisfaction_score: number | null
  would_recommend: boolean | null
  would_return: boolean | null
  feedback: string | null
  suggestions: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 离职任务 ====================

// 任务状态
export type OffboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// 任务类型
export type OffboardingTaskType = 'handover' | 'equipment_return' | 'document' | 'clearance' | 'interview' | 'other'

// 任务优先级
export type OffboardingTaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// 离职任务表
export interface OffboardingTask {
  id: string
  tenant_id: string
  application_id: string
  task_name: string
  task_description: string | null
  task_type: OffboardingTaskType
  assigned_to: string | null
  due_date: string | null
  status: OffboardingTaskStatus
  completed_at: string | null
  completed_by: string | null
  priority: OffboardingTaskPriority
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 离职交接 ====================

// 交接类型
export type HandoverType = 'work' | 'project' | 'client' | 'document' | 'equipment' | 'other'

// 交接状态
export type HandoverStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// 离职交接表
export interface OffboardingHandover {
  id: string
  tenant_id: string
  application_id: string
  employee_id: string
  handover_to: string
  handover_type: HandoverType
  handover_item: string
  handover_description: string | null
  handover_date: string | null
  status: HandoverStatus
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 离职历史 ====================

// 离职历史表
export interface OffboardingHistory {
  id: string
  tenant_id: string
  employee_id: string
  application_id: string | null
  employee_name: string
  position: string
  department: string
  store_id: string | null
  join_date: string
  leave_date: string
  tenure_months: number | null
  resignation_type: ResignationType
  resignation_reason: ResignationReason
  final_salary: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 统计数据 ====================

// 离职统计
export interface OffboardingStatistics {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  total_handovers: number
  completed_handovers: number
  pending_handovers: number
  completion_rate: number
  days_until_leave: number
}

// 离职数据
export interface OffboardingData {
  application: OffboardingApplication | null
  tasks: OffboardingTask[]
  handovers: OffboardingHandover[]
  interview: OffboardingInterview | null
  statistics: OffboardingStatistics
}

// ==================== 常量定义 ====================

// 离职类型显示名称
export const RESIGNATION_TYPE_NAMES: Record<ResignationType, string> = {
  voluntary: '主动离职',
  involuntary: '被动离职',
  retirement: '退休',
  contract_end: '合同到期',
  other: '其他'
}

// 离职原因显示名称
export const RESIGNATION_REASON_NAMES: Record<ResignationReason, string> = {
  career_development: '职业发展',
  salary: '薪资待遇',
  work_environment: '工作环境',
  personal_reason: '个人原因',
  relocation: '搬迁',
  health: '健康原因',
  family: '家庭原因',
  other: '其他'
}

// 申请状态显示名称
export const OFFBOARDING_APPLICATION_STATUS_NAMES: Record<OffboardingApplicationStatus, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  cancelled: '已取消'
}

// 申请状态颜色
export const OFFBOARDING_APPLICATION_STATUS_COLORS: Record<OffboardingApplicationStatus, string> = {
  pending: 'text-orange-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  cancelled: 'text-gray-600'
}

// 任务状态显示名称
export const OFFBOARDING_TASK_STATUS_NAMES: Record<OffboardingTaskStatus, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

// 任务状态颜色
export const OFFBOARDING_TASK_STATUS_COLORS: Record<OffboardingTaskStatus, string> = {
  pending: 'text-orange-600',
  in_progress: 'text-blue-600',
  completed: 'text-green-600',
  cancelled: 'text-gray-600'
}

// 任务类型显示名称
export const OFFBOARDING_TASK_TYPE_NAMES: Record<OffboardingTaskType, string> = {
  handover: '工作交接',
  equipment_return: '设备归还',
  document: '文档处理',
  clearance: '离职清算',
  interview: '离职面谈',
  other: '其他任务'
}

// 任务优先级显示名称
export const OFFBOARDING_TASK_PRIORITY_NAMES: Record<OffboardingTaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
}

// 任务优先级颜色
export const OFFBOARDING_TASK_PRIORITY_COLORS: Record<OffboardingTaskPriority, string> = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600'
}

// 交接类型显示名称
export const HANDOVER_TYPE_NAMES: Record<HandoverType, string> = {
  work: '工作交接',
  project: '项目交接',
  client: '客户交接',
  document: '文档交接',
  equipment: '设备交接',
  other: '其他交接'
}

// 交接状态显示名称
export const HANDOVER_STATUS_NAMES: Record<HandoverStatus, string> = {
  pending: '待交接',
  in_progress: '交接中',
  completed: '已完成',
  cancelled: '已取消'
}

// 交接状态颜色
export const HANDOVER_STATUS_COLORS: Record<HandoverStatus, string> = {
  pending: 'text-orange-600',
  in_progress: 'text-blue-600',
  completed: 'text-green-600',
  cancelled: 'text-gray-600'
}
