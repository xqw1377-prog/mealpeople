// 请假管理相关类型定义

// ==================== 请假类型 ====================

// 请假类型表
export interface LeaveType {
  id: string
  tenant_id: string
  type_name: string
  type_code: string
  description: string | null
  max_days_per_year: number | null
  requires_approval: boolean
  is_paid: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// 创建请假类型输入
export interface CreateLeaveTypeInput {
  tenant_id: string
  type_name: string
  type_code: string
  description?: string
  max_days_per_year?: number
  requires_approval?: boolean
  is_paid?: boolean
}

// ==================== 假期余额 ====================

// 假期余额表
export interface LeaveBalance {
  id: string
  tenant_id: string
  employee_id: string
  leave_type_id: string
  year: number
  total_days: number
  used_days: number
  remaining_days: number
  created_at: string
  updated_at: string
}

// 创建假期余额输入
export interface CreateLeaveBalanceInput {
  tenant_id: string
  employee_id: string
  leave_type_id: string
  year: number
  total_days: number
}

// ==================== 请假申请 ====================

// 请假状态
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

// 请假申请表（匹配实际数据库schema）
export interface LeaveRequest {
  id: string
  tenant_id: string
  employee_id: string
  store_id: string
  leave_type: string // TEXT字段，枚举值：'annual_leave' | 'sick_leave' | 'personal_leave' | 'other'
  start_date: string
  end_date: string
  days: number
  reason: string | null
  within_rules: boolean
  rule_id: string | null
  current_month_days: number
  rule_max_days: number | null
  status: LeaveStatus
  approver_id: string | null
  approval_comment: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

// 创建请假申请输入（匹配实际数据库schema）
export interface CreateLeaveRequestInput {
  tenant_id: string
  employee_id: string
  store_id: string
  leave_type: string // TEXT字段：'annual_leave' | 'sick_leave' | 'personal_leave' | 'other'
  start_date: string
  end_date: string
  days: number
  reason?: string
  within_rules?: boolean
  rule_id?: string
  current_month_days?: number
  rule_max_days?: number
}

// 更新请假申请输入
export interface UpdateLeaveRequestInput {
  status?: LeaveStatus
  approver_id?: string
  approved_at?: string
  approval_notes?: string
}

// ==================== 扩展类型 ====================

// 请假申请详情（包含类型信息）
// 注意：leave_type_obj是从TEXT字段映射生成的，不是数据库关联
export interface LeaveRequestWithType extends Omit<LeaveRequest, 'leave_type'> {
  leave_type: string // 原始TEXT字段
  leave_type_obj: {
    id: string
    type_name: string
    type_code: string
    is_paid: boolean
  }
}

// 假期余额详情（包含类型信息）
export interface LeaveBalanceWithType extends LeaveBalance {
  leave_type: LeaveType
}

// ==================== 统计数据 ====================

// 请假统计
export interface LeaveStatistics {
  total_requests: number
  pending_requests: number
  approved_requests: number
  rejected_requests: number
  total_days_used: number
  total_days_remaining: number
}

// 请假数据
export interface LeaveData {
  balances: LeaveBalanceWithType[]
  recent_requests: LeaveRequestWithType[]
  statistics: LeaveStatistics
}

// ==================== 常量定义 ====================

// 请假状态显示名称
export const LEAVE_STATUS_NAMES: Record<LeaveStatus, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  cancelled: '已取消'
}

// 请假状态颜色
export const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  pending: 'text-orange-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  cancelled: 'text-gray-600'
}

// 请假状态背景色
export const LEAVE_STATUS_BG_COLORS: Record<LeaveStatus, string> = {
  pending: 'bg-orange-50',
  approved: 'bg-green-50',
  rejected: 'bg-red-50',
  cancelled: 'bg-gray-50'
}

// 请假类型选项
export interface LeaveTypeOption {
  value: string
  label: string
  code: string
  color?: string
}

// 请假类型选项列表
export const LEAVE_TYPE_OPTIONS: LeaveTypeOption[] = [
  {value: 'annual', label: '年假', code: 'annual'},
  {value: 'sick', label: '病假', code: 'sick'},
  {value: 'personal', label: '事假', code: 'personal'},
  {value: 'marriage', label: '婚假', code: 'marriage'},
  {value: 'maternity', label: '产假', code: 'maternity'},
  {value: 'paternity', label: '陪产假', code: 'paternity'},
  {value: 'bereavement', label: '丧假', code: 'bereavement'},
  {value: 'other', label: '其他', code: 'other'}
]

// 请假类型名称映射（匹配数据库的TEXT枚举值）
export const LEAVE_TYPE_NAMES: Record<string, string> = {
  annual_leave: '年假',
  sick_leave: '病假',
  personal_leave: '事假',
  other: '其他',
  // 兼容旧的命名（无下划线）
  annual: '年假',
  sick: '病假',
  personal: '事假',
  marriage: '婚假',
  maternity: '产假',
  paternity: '陪产假',
  bereavement: '丧假'
}

// ==================== 请假规则检查 ====================

// 请假规则检查结果
export interface LeaveRuleCheckResult {
  valid: boolean
  message: string
  warnings: string[]
}

// ==================== 员工工作台 ====================

// 员工工作台统计
export interface EmployeeWorkspaceStats {
  pending_leaves: number
  approved_leaves: number
  total_leave_days: number
  remaining_annual_leave: number
  pending_approvals: number
  team_on_leave_today: number
  work_days?: number
  leave_days?: number
  total_hours?: number
  total_salary?: number
  pending_requests?: number
}

// ==================== 员工排班 ====================

// 员工排班结果
export interface EmployeeScheduleResult {
  date: string
  shift_type: string
  start_time: string
  end_time: string
  store_name: string
  notes: string | null
}

// ==================== 请假申请（包含员工信息） ====================

// 请假申请（包含员工信息）
export interface LeaveRequestWithEmployee extends Omit<LeaveRequest, 'leave_type'> {
  employee: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  leave_type: string // 原始TEXT字段
  leave_type_obj: {
    id: string
    type_name: string
    type_code: string
    is_paid: boolean
  }
}
