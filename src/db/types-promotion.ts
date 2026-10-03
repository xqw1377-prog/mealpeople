// 晋升管理相关类型定义

// ==================== 晋升路径 ====================

// 晋升路径表
export interface PromotionPath {
  id: string
  tenant_id: string
  from_position: string
  to_position: string
  from_level: number
  to_level: number
  min_tenure_months: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ==================== 晋升条件 ====================

// 条件类型
export type RequirementType = 'performance' | 'tenure' | 'skill' | 'education' | 'certification' | 'other'

// 晋升条件表
export interface PromotionRequirement {
  id: string
  tenant_id: string
  promotion_path_id: string
  requirement_type: RequirementType
  requirement_name: string
  requirement_value: string
  description: string | null
  is_mandatory: boolean
  created_at: string
  updated_at: string
}

// ==================== 晋升申请 ====================

// 申请状态
export type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'cancelled'

// 晋升申请表
export interface PromotionApplication {
  id: string
  tenant_id: string
  employee_id: string
  promotion_path_id: string
  current_position: string
  target_position: string
  current_level: number
  target_level: number
  application_date: string
  reason: string | null
  status: ApplicationStatus
  submitted_at: string
  reviewed_at: string | null
  approved_at: string | null
  effective_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 创建晋升申请输入
export interface CreatePromotionApplicationInput {
  tenant_id: string
  employee_id: string
  promotion_path_id: string
  current_position: string
  target_position: string
  current_level: number
  target_level: number
  reason?: string
}

// ==================== 晋升评审 ====================

// 评审结果
export type ReviewResult = 'pass' | 'fail' | 'pending'

// 晋升评审表
export interface PromotionReview {
  id: string
  tenant_id: string
  application_id: string
  reviewer_id: string
  review_date: string
  review_result: ReviewResult
  review_score: number | null
  review_comments: string | null
  created_at: string
  updated_at: string
}

// ==================== 晋升历史 ====================

// 晋升类型
export type PromotionType = 'regular' | 'exceptional' | 'transfer' | 'other'

// 晋升历史表
export interface PromotionHistory {
  id: string
  tenant_id: string
  employee_id: string
  application_id: string | null
  from_position: string
  to_position: string
  from_level: number
  to_level: number
  promotion_date: string
  promotion_type: PromotionType
  salary_increase: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 扩展类型 ====================

// 晋升路径详情（包含条件）
export interface PromotionPathWithRequirements extends PromotionPath {
  requirements: PromotionRequirement[]
}

// 晋升申请详情（包含路径和评审）
export interface PromotionApplicationWithDetails extends PromotionApplication {
  promotion_path: PromotionPath
  reviews: PromotionReview[]
}

// ==================== 统计数据 ====================

// 晋升统计
export interface PromotionStatistics {
  total_applications: number
  pending_applications: number
  approved_applications: number
  rejected_applications: number
  total_promotions: number
  average_tenure_months: number
}

// 晋升数据
export interface PromotionData {
  available_paths: PromotionPathWithRequirements[]
  my_applications: PromotionApplication[]
  promotion_history: PromotionHistory[]
  statistics: PromotionStatistics
}

// ==================== 常量定义 ====================

// 申请状态显示名称
export const APPLICATION_STATUS_NAMES: Record<ApplicationStatus, string> = {
  pending: '待审核',
  reviewing: '审核中',
  approved: '已批准',
  rejected: '已拒绝',
  cancelled: '已取消'
}

// 申请状态颜色
export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: 'text-orange-600',
  reviewing: 'text-blue-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  cancelled: 'text-gray-600'
}

// 条件类型显示名称
export const REQUIREMENT_TYPE_NAMES: Record<RequirementType, string> = {
  performance: '绩效要求',
  tenure: '任职时长',
  skill: '技能要求',
  education: '学历要求',
  certification: '证书要求',
  other: '其他要求'
}

// 评审结果显示名称
export const REVIEW_RESULT_NAMES: Record<ReviewResult, string> = {
  pass: '通过',
  fail: '不通过',
  pending: '待评审'
}

// 评审结果颜色
export const REVIEW_RESULT_COLORS: Record<ReviewResult, string> = {
  pass: 'text-green-600',
  fail: 'text-red-600',
  pending: 'text-orange-600'
}

// 晋升类型显示名称
export const PROMOTION_TYPE_NAMES: Record<PromotionType, string> = {
  regular: '常规晋升',
  exceptional: '破格晋升',
  transfer: '调岗晋升',
  other: '其他'
}
