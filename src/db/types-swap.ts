/**
 * 换班申请相关类型定义
 */

// 换班申请状态
export type SwapRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// 换班申请表
export interface ShiftSwapRequest {
  id: string
  tenant_id: string
  requester_id: string
  target_id: string
  requester_shift_id: string
  target_shift_id: string
  reason: string
  status: SwapRequestStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
}

// 创建换班申请输入
export interface CreateSwapRequestInput {
  tenant_id: string
  requester_id: string
  target_id: string
  requester_shift_id: string
  target_shift_id: string
  reason: string
}

// 审批换班申请输入
export interface ReviewSwapRequestInput {
  status: 'approved' | 'rejected'
  reviewed_by: string
  review_notes?: string
}

// 换班申请查询条件
export interface SwapRequestQueryOptions {
  requester_id?: string
  target_id?: string
  tenant_id?: string
  status?: SwapRequestStatus
  start_date?: string
  end_date?: string
}

// 换班申请详情（包含关联信息）
export interface SwapRequestDetail extends ShiftSwapRequest {
  requester_name?: string
  target_name?: string
  requester_shift_date?: string
  target_shift_date?: string
  requester_shift_type?: string
  target_shift_type?: string
  reviewer_name?: string
}

// 换班申请统计
export interface SwapRequestStatistics {
  total_requests: number
  pending_requests: number
  approved_requests: number
  rejected_requests: number
  cancelled_requests: number
}

// 换班申请状态信息
export interface SwapRequestStatusInfo {
  status: SwapRequestStatus
  name: string
  color: string
  icon: string
}
