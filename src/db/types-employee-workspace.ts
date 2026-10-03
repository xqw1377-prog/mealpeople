/**
 * 员工工作台类型定义
 */

import type {TodayTasksSummary} from './types-task'

/**
 * 工作状态
 */
export type WorkStatus = 'active' | 'on_leave' | 'resigned'

/**
 * 班次类型
 */
export type ShiftType = 'early' | 'middle' | 'late'

/**
 * 考勤状态
 */
export type AttendanceStatus = 'normal' | 'late' | 'early_leave' | 'absent'

/**
 * 员工工作信息
 */
export interface EmployeeWorkInfo {
  id: string
  tenant_id: string
  employee_id: string
  current_position: string | null
  work_status: WorkStatus
  entry_date: string | null
  department: string | null
  skill_level: number
  service_score: number
  created_at: string
  updated_at: string
}

/**
 * 工作考勤记录
 */
export interface WorkAttendance {
  id: string
  tenant_id: string
  employee_id: string
  store_id: string | null
  date: string
  shift_type: ShiftType | null
  clock_in_time: string | null
  clock_out_time: string | null
  status: AttendanceStatus
  work_hours: number | null
  note: string | null
  created_at: string
  updated_at: string
}

/**
 * 今日排班信息
 */
export interface TodaySchedule {
  date: string
  shift_name: string
  start_time: string
  end_time: string
  position: string
  store_name: string
  hours: number
  is_rest_day: boolean
}

/**
 * 本月收入统计
 */
export interface MonthlyIncome {
  total: number // 总收入
  days: number // 工作天数
  average: number // 日均收入
}

/**
 * 成长数据
 */
export interface GrowthData {
  skill_level: number // 技能等级（0-100）
  service_score: number // 服务评分（0-100）
  progress: number // 本月进步
  next_level: number // 距离下一等级
}

/**
 * 工作台统计数据
 */
export interface WorkspaceStats {
  today_schedule: TodaySchedule | null
  monthly_income: MonthlyIncome
  growth_data: GrowthData
  pending_tasks: number // 待处理任务数
  today_tasks: TodayTasksSummary // 今日任务摘要
}

/**
 * 工作状态显示名称映射
 */
export const WORK_STATUS_NAMES: Record<WorkStatus, string> = {
  active: '在职',
  on_leave: '休假',
  resigned: '离职'
}

/**
 * 工作状态颜色映射
 */
export const WORK_STATUS_COLORS: Record<WorkStatus, string> = {
  active: 'text-success',
  on_leave: 'text-warning',
  resigned: 'text-muted-foreground'
}

/**
 * 班次类型显示名称映射
 */
export const SHIFT_TYPE_NAMES: Record<ShiftType, string> = {
  early: '早班',
  middle: '中班',
  late: '晚班'
}

/**
 * 考勤状态显示名称映射
 */
export const ATTENDANCE_STATUS_NAMES: Record<AttendanceStatus, string> = {
  normal: '正常',
  late: '迟到',
  early_leave: '早退',
  absent: '缺勤'
}

/**
 * 考勤状态颜色映射
 */
export const ATTENDANCE_STATUS_COLORS: Record<AttendanceStatus, string> = {
  normal: 'text-success',
  late: 'text-warning',
  early_leave: 'text-warning',
  absent: 'text-destructive'
}
