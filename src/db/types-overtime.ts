// 加班管理相关类型定义

// ==================== 加班类型 ====================

// 加班类型表
export interface OvertimeType {
  id: string
  tenant_id: string
  type_name: string
  type_code: string
  description: string | null
  rate: number
  can_compensate: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// 创建加班类型输入
export interface CreateOvertimeTypeInput {
  tenant_id: string
  type_name: string
  type_code: string
  description?: string
  rate?: number
  can_compensate?: boolean
}

// ==================== 加班申请 ====================

// 加班状态
export type OvertimeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// 加班申请表
export interface OvertimeRequest {
  id: string
  tenant_id: string
  employee_id: string
  overtime_type_id: string
  overtime_date: string
  start_time: string
  end_time: string
  hours: number
  reason: string
  status: OvertimeStatus
  approver_id: string | null
  approved_at: string | null
  approval_notes: string | null
  created_at: string
  updated_at: string
}

// 创建加班申请输入
export interface CreateOvertimeRequestInput {
  tenant_id: string
  employee_id: string
  overtime_type_id: string
  overtime_date: string
  start_time: string
  end_time: string
  hours: number
  reason: string
}

// 更新加班申请输入
export interface UpdateOvertimeRequestInput {
  status?: OvertimeStatus
  approver_id?: string
  approved_at?: string
  approval_notes?: string
}

// ==================== 加班补偿 ====================

// 补偿类型
export type CompensationType = 'time_off' | 'payment'

// 补偿状态
export type CompensationStatus = 'pending' | 'available' | 'used' | 'expired'

// 加班补偿表
export interface OvertimeCompensation {
  id: string
  tenant_id: string
  overtime_request_id: string
  employee_id: string
  compensation_type: CompensationType
  hours: number
  amount: number | null
  status: CompensationStatus
  used_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 扩展类型 ====================

// 加班申请详情（包含类型信息）
export interface OvertimeRequestWithType extends OvertimeRequest {
  overtime_type: OvertimeType
}

// 加班补偿详情（包含申请信息）
export interface OvertimeCompensationWithRequest extends OvertimeCompensation {
  overtime_request: OvertimeRequestWithType
}

// ==================== 统计数据 ====================

// 加班统计
export interface OvertimeStatistics {
  total_requests: number
  pending_requests: number
  approved_requests: number
  rejected_requests: number
  total_hours: number
  total_compensations: number
  available_compensations: number
}

// 加班数据
export interface OvertimeData {
  requests: OvertimeRequestWithType[]
  compensations: OvertimeCompensationWithRequest[]
  statistics: OvertimeStatistics
}

// ==================== 常量定义 ====================

// 加班状态显示名称
export const OVERTIME_STATUS_NAMES: Record<OvertimeStatus, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  cancelled: '已取消'
}

// 加班状态颜色
export const OVERTIME_STATUS_COLORS: Record<OvertimeStatus, string> = {
  pending: 'text-orange-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  cancelled: 'text-gray-600'
}

// 加班状态背景色
export const OVERTIME_STATUS_BG_COLORS: Record<OvertimeStatus, string> = {
  pending: 'bg-orange-50',
  approved: 'bg-green-50',
  rejected: 'bg-red-50',
  cancelled: 'bg-gray-50'
}

// 补偿类型显示名称
export const COMPENSATION_TYPE_NAMES: Record<CompensationType, string> = {
  time_off: '调休',
  payment: '加班费'
}

// 补偿状态显示名称
export const COMPENSATION_STATUS_NAMES: Record<CompensationStatus, string> = {
  pending: '待生效',
  available: '可使用',
  used: '已使用',
  expired: '已过期'
}

// 补偿状态颜色
export const COMPENSATION_STATUS_COLORS: Record<CompensationStatus, string> = {
  pending: 'text-orange-600',
  available: 'text-green-600',
  used: 'text-gray-600',
  expired: 'text-red-600'
}
