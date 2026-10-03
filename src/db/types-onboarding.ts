// 入职管理相关类型定义

// ==================== 入职申请 ====================

// 申请状态
export type OnboardingApplicationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// 入职申请表
export interface OnboardingApplication {
  id: string
  tenant_id: string
  candidate_name: string
  candidate_phone: string
  candidate_email: string | null
  position: string
  department: string
  store_id: string | null
  expected_start_date: string
  salary: number | null
  application_date: string
  status: OnboardingApplicationStatus
  submitted_by: string | null
  approved_by: string | null
  approved_at: string | null
  employee_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 入职流程 ====================

// 入职流程表
export interface OnboardingProcess {
  id: string
  tenant_id: string
  process_name: string
  description: string | null
  position_type: string | null
  department: string | null
  duration_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ==================== 入职任务 ====================

// 任务状态
export type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// 任务类型
export type OnboardingTaskType = 'document' | 'training' | 'meeting' | 'system' | 'other'

// 任务优先级
export type OnboardingTaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// 入职任务表
export interface OnboardingTask {
  id: string
  tenant_id: string
  application_id: string
  process_id: string | null
  task_name: string
  task_description: string | null
  task_type: OnboardingTaskType
  assigned_to: string | null
  due_date: string | null
  status: OnboardingTaskStatus
  completed_at: string | null
  completed_by: string | null
  priority: OnboardingTaskPriority
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 入职资料 ====================

// 资料状态
export type OnboardingDocumentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected'

// 资料类型
export type OnboardingDocumentType = 'id_card' | 'diploma' | 'certificate' | 'contract' | 'photo' | 'other'

// 入职资料表
export interface OnboardingDocument {
  id: string
  tenant_id: string
  application_id: string
  document_name: string
  document_type: OnboardingDocumentType
  document_url: string | null
  file_size: number | null
  uploaded_by: string | null
  uploaded_at: string
  is_required: boolean
  status: OnboardingDocumentStatus
  verified_by: string | null
  verified_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // 新增字段（用于文档上传功能）
  file_url?: string | null // 文档文件URL（Supabase Storage路径）
  file_type?: string | null // 文件类型（image/jpeg, image/png, application/pdf）
  file_name?: string | null // 原始文件名
}

// ==================== 入职历史 ====================

// 入职状态
export type OnboardingHistoryStatus = 'in_progress' | 'completed' | 'cancelled'

// 入职历史表
export interface OnboardingHistory {
  id: string
  tenant_id: string
  employee_id: string
  application_id: string | null
  candidate_name: string
  position: string
  department: string
  store_id: string | null
  start_date: string
  onboarding_date: string
  completion_date: string | null
  onboarding_duration_days: number | null
  status: OnboardingHistoryStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 扩展类型 ====================

// 入职申请详情（包含任务和资料）
export interface OnboardingApplicationWithDetails extends OnboardingApplication {
  tasks: OnboardingTask[]
  documents: OnboardingDocument[]
}

// ==================== 统计数据 ====================

// 入职统计
export interface OnboardingStatistics {
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  total_documents: number
  uploaded_documents: number
  verified_documents: number
  completion_rate: number
  days_since_start: number
}

// 入职数据
export interface OnboardingData {
  application: OnboardingApplication | null
  tasks: OnboardingTask[]
  documents: OnboardingDocument[]
  history: OnboardingHistory | null
  statistics: OnboardingStatistics
}

// ==================== 常量定义 ====================

// 申请状态显示名称
export const ONBOARDING_APPLICATION_STATUS_NAMES: Record<OnboardingApplicationStatus, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  cancelled: '已取消'
}

// 申请状态颜色
export const ONBOARDING_APPLICATION_STATUS_COLORS: Record<OnboardingApplicationStatus, string> = {
  pending: 'text-orange-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  cancelled: 'text-gray-600'
}

// 任务状态显示名称
export const ONBOARDING_TASK_STATUS_NAMES: Record<OnboardingTaskStatus, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

// 任务状态颜色
export const ONBOARDING_TASK_STATUS_COLORS: Record<OnboardingTaskStatus, string> = {
  pending: 'text-orange-600',
  in_progress: 'text-blue-600',
  completed: 'text-green-600',
  cancelled: 'text-gray-600'
}

// 任务类型显示名称
export const ONBOARDING_TASK_TYPE_NAMES: Record<OnboardingTaskType, string> = {
  document: '文档提交',
  training: '培训学习',
  meeting: '会议参加',
  system: '系统操作',
  other: '其他任务'
}

// 任务优先级显示名称
export const ONBOARDING_TASK_PRIORITY_NAMES: Record<OnboardingTaskPriority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
}

// 任务优先级颜色
export const ONBOARDING_TASK_PRIORITY_COLORS: Record<OnboardingTaskPriority, string> = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600'
}

// 资料状态显示名称
export const ONBOARDING_DOCUMENT_STATUS_NAMES: Record<OnboardingDocumentStatus, string> = {
  pending: '待上传',
  uploaded: '已上传',
  verified: '已审核',
  rejected: '已拒绝'
}

// 资料状态颜色
export const ONBOARDING_DOCUMENT_STATUS_COLORS: Record<OnboardingDocumentStatus, string> = {
  pending: 'text-orange-600',
  uploaded: 'text-blue-600',
  verified: 'text-green-600',
  rejected: 'text-red-600'
}

// 资料类型显示名称
export const ONBOARDING_DOCUMENT_TYPE_NAMES: Record<OnboardingDocumentType, string> = {
  id_card: '身份证',
  diploma: '学历证书',
  certificate: '资格证书',
  contract: '劳动合同',
  photo: '证件照',
  other: '其他资料'
}

// 入职历史状态显示名称
export const ONBOARDING_HISTORY_STATUS_NAMES: Record<OnboardingHistoryStatus, string> = {
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

// 入职历史状态颜色
export const ONBOARDING_HISTORY_STATUS_COLORS: Record<OnboardingHistoryStatus, string> = {
  in_progress: 'text-blue-600',
  completed: 'text-green-600',
  cancelled: 'text-gray-600'
}
