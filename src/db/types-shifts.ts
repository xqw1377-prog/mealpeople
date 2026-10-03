/**
 * 员工班次相关类型定义
 */

// 班次类型
export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'night' | 'rest'

// 班次状态
export type ShiftStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled'

// 员工班次表
export interface EmployeeShift {
  id: string
  tenant_id: string
  employee_id: string
  store_id: string | null
  shift_date: string // YYYY-MM-DD
  shift_type: ShiftType
  start_time: string | null // HH:MM:SS
  end_time: string | null // HH:MM:SS
  work_hours: number
  position: string | null
  status: ShiftStatus
  notes: string | null
  created_at: string
  updated_at: string
}

// 创建班次输入
export interface CreateShiftInput {
  tenant_id: string
  employee_id: string
  store_id?: string | null
  shift_date: string
  shift_type: ShiftType
  start_time?: string | null
  end_time?: string | null
  work_hours?: number
  position?: string | null
  status?: ShiftStatus
  notes?: string | null
}

// 更新班次输入
export interface UpdateShiftInput {
  shift_type?: ShiftType
  start_time?: string | null
  end_time?: string | null
  work_hours?: number
  position?: string | null
  status?: ShiftStatus
  notes?: string | null
}

// 班次查询条件
export interface ShiftQueryOptions {
  employee_id?: string
  tenant_id?: string
  store_id?: string
  start_date?: string
  end_date?: string
  status?: ShiftStatus
  shift_type?: ShiftType
}

// 班次统计
export interface ShiftStatistics {
  total_shifts: number
  total_hours: number
  completed_shifts: number
  scheduled_shifts: number
  rest_days: number
}

// 班次类型信息
export interface ShiftTypeInfo {
  type: ShiftType
  name: string
  icon: string
  color: string
  defaultStartTime?: string
  defaultEndTime?: string
  defaultHours?: number
}

// 班次状态信息
export interface ShiftStatusInfo {
  status: ShiftStatus
  name: string
  color: string
  icon: string
}
