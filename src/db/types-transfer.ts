// 调岗管理相关类型定义

// ==================== 可调岗位 ====================

// 可调岗位表
export interface TransferPosition {
  id: string
  tenant_id: string
  store_id: string | null
  position_name: string
  department: string
  level: number
  description: string | null
  requirements: string | null
  available_slots: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// ==================== 调岗条件 ====================

// 条件类型
export type TransferRequirementType = 'performance' | 'tenure' | 'skill' | 'education' | 'certification' | 'other'

// 调岗条件表
export interface TransferRequirement {
  id: string
  tenant_id: string
  transfer_position_id: string
  requirement_type: TransferRequirementType
  requirement_name: string
  requirement_value: string
  description: string | null
  is_mandatory: boolean
  created_at: string
  updated_at: string
}

// ==================== 调岗申请 ====================

// 申请状态
export type TransferApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'cancelled'

// 调岗申请表
export interface TransferApplication {
  id: string
  tenant_id: string
  employee_id: string
  transfer_position_id: string
  current_position: string
  current_department: string
  current_store_id: string | null
  target_position: string
  target_department: string
  target_store_id: string | null
  application_date: string
  reason: string | null
  status: TransferApplicationStatus
  submitted_at: string
  reviewed_at: string | null
  approved_at: string | null
  effective_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 创建调岗申请输入
export interface CreateTransferApplicationInput {
  tenant_id: string
  employee_id: string
  transfer_position_id: string
  current_position: string
  current_department: string
  current_store_id?: string
  target_position: string
  target_department: string
  target_store_id?: string
  reason?: string
}

// ==================== 调岗评审 ====================

// 评审结果
export type TransferReviewResult = 'pass' | 'fail' | 'pending'

// 调岗评审表
export interface TransferReview {
  id: string
  tenant_id: string
  application_id: string
  reviewer_id: string
  review_date: string
  review_result: TransferReviewResult
  review_score: number | null
  review_comments: string | null
  created_at: string
  updated_at: string
}

// ==================== 调岗历史 ====================

// 调岗类型
export type TransferType = 'regular' | 'urgent' | 'rotation' | 'other'

// 调岗历史表
export interface TransferHistory {
  id: string
  tenant_id: string
  employee_id: string
  application_id: string | null
  from_position: string
  to_position: string
  from_department: string
  to_department: string
  from_store_id: string | null
  to_store_id: string | null
  transfer_date: string
  transfer_type: TransferType
  salary_change: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 扩展类型 ====================

// 可调岗位详情（包含条件）
export interface TransferPositionWithRequirements extends TransferPosition {
  requirements_list: TransferRequirement[]
}

// 调岗申请详情（包含岗位和评审）
export interface TransferApplicationWithDetails extends TransferApplication {
  transfer_position: TransferPosition
  reviews: TransferReview[]
}

// ==================== 统计数据 ====================

// 调岗统计
export interface TransferStatistics {
  total_applications: number
  pending_applications: number
  approved_applications: number
  rejected_applications: number
  total_transfers: number
  cross_department_transfers: number
  cross_store_transfers: number
}

// 调岗数据
export interface TransferData {
  available_positions: TransferPositionWithRequirements[]
  my_applications: TransferApplication[]
  transfer_history: TransferHistory[]
  statistics: TransferStatistics
}

// ==================== 常量定义 ====================

// 申请状态显示名称
export const TRANSFER_APPLICATION_STATUS_NAMES: Record<TransferApplicationStatus, string> = {
  pending: '待审核',
  reviewing: '审核中',
  approved: '已批准',
  rejected: '已拒绝',
  cancelled: '已取消'
}

// 申请状态颜色
export const TRANSFER_APPLICATION_STATUS_COLORS: Record<TransferApplicationStatus, string> = {
  pending: 'text-orange-600',
  reviewing: 'text-blue-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  cancelled: 'text-gray-600'
}

// 条件类型显示名称
export const TRANSFER_REQUIREMENT_TYPE_NAMES: Record<TransferRequirementType, string> = {
  performance: '绩效要求',
  tenure: '任职时长',
  skill: '技能要求',
  education: '学历要求',
  certification: '证书要求',
  other: '其他要求'
}

// 评审结果显示名称
export const TRANSFER_REVIEW_RESULT_NAMES: Record<TransferReviewResult, string> = {
  pass: '通过',
  fail: '不通过',
  pending: '待评审'
}

// 评审结果颜色
export const TRANSFER_REVIEW_RESULT_COLORS: Record<TransferReviewResult, string> = {
  pass: 'text-green-600',
  fail: 'text-red-600',
  pending: 'text-orange-600'
}

// 调岗类型显示名称
export const TRANSFER_TYPE_NAMES: Record<TransferType, string> = {
  regular: '常规调岗',
  urgent: '紧急调岗',
  rotation: '轮岗',
  other: '其他'
}
