// 排班管理系统类型定义

// 排班类型枚举
export type WorkScheduleType = 'daily' | 'weekly' | 'temporary'

// 排班状态枚举
export type WorkScheduleStatus = 'draft' | 'published' | 'completed' | 'cancelled'

// 班次类型枚举
export type WorkShiftType = 'morning' | 'afternoon' | 'evening' | 'full'

// 排班记录状态枚举
export type WorkRecordStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

// 评分类型枚举
export type WorkRatingType = 'self' | 'peer' | 'supervisor'

// 排班配置表
export interface WorkScheduleConfig {
  id: string
  tenant_id: string
  store_id: string
  name: string
  description?: string
  type: WorkScheduleType
  start_date: string // ISO date string
  end_date?: string // ISO date string
  status: WorkScheduleStatus
  created_by: string
  created_at: string
  updated_at: string
}

// 排班记录表
export interface WorkScheduleRecord {
  id: string
  config_id: string
  employee_id: string
  schedule_date: string // ISO date string
  shift_type: WorkShiftType
  start_time: string // HH:mm:ss
  end_time: string // HH:mm:ss
  status: WorkRecordStatus
  actual_start_time?: string
  actual_end_time?: string
  notes?: string
  created_at: string
  updated_at: string
}

// 工作日志表
export interface WorkLog {
  id: string
  schedule_record_id: string
  employee_id: string
  log_date: string // ISO date string
  work_content: string
  achievements?: string
  issues?: string
  suggestions?: string
  quality_score?: number // 1-5
  efficiency_score?: number // 1-5
  attitude_score?: number // 1-5
  total_score?: number
  images?: string[]
  created_at: string
  updated_at: string
}

// 工作评分表
export interface WorkRating {
  id: string
  work_log_id: string
  rater_id: string
  rating_type: WorkRatingType
  quality_score: number // 1-5
  efficiency_score: number // 1-5
  attitude_score: number // 1-5
  total_score: number
  comments?: string
  created_at: string
}

// 创建排班配置的输入类型
export interface CreateWorkScheduleConfigInput {
  tenant_id: string
  store_id: string
  name: string
  description?: string
  type: WorkScheduleType
  start_date: string
  end_date?: string
  created_by: string
}

// 更新排班配置的输入类型
export interface UpdateWorkScheduleConfigInput {
  name?: string
  description?: string
  type?: WorkScheduleType
  start_date?: string
  end_date?: string
  status?: WorkScheduleStatus
}

// 创建排班记录的输入类型
export interface CreateWorkScheduleRecordInput {
  config_id: string
  employee_id: string
  schedule_date: string
  shift_type: WorkShiftType
  start_time: string
  end_time: string
  notes?: string
}

// 更新排班记录的输入类型
export interface UpdateWorkScheduleRecordInput {
  status?: WorkRecordStatus
  actual_start_time?: string
  actual_end_time?: string
  notes?: string
}

// 创建工作日志的输入类型
export interface CreateWorkLogInput {
  schedule_record_id: string
  employee_id: string
  log_date: string
  work_content: string
  achievements?: string
  issues?: string
  suggestions?: string
  quality_score?: number
  efficiency_score?: number
  attitude_score?: number
  images?: string[]
}

// 更新工作日志的输入类型
export interface UpdateWorkLogInput {
  work_content?: string
  achievements?: string
  issues?: string
  suggestions?: string
  quality_score?: number
  efficiency_score?: number
  attitude_score?: number
  images?: string[]
}

// 创建工作评分的输入类型
export interface CreateWorkRatingInput {
  work_log_id: string
  rater_id: string
  rating_type: WorkRatingType
  quality_score: number
  efficiency_score: number
  attitude_score: number
  comments?: string
}

// 排班统计数据
export interface WorkScheduleStats {
  total_schedules: number
  completed_schedules: number
  completion_rate: number
  pending_schedules: number
  in_progress_schedules: number
  cancelled_schedules: number
}

// 工作日志统计数据
export interface WorkLogStats {
  total_logs: number
  average_quality_score: number
  average_efficiency_score: number
  average_attitude_score: number
  average_total_score: number
  excellent_logs: number // 总分 >= 13
  excellent_rate: number
}

// 员工排班统计
export interface EmployeeScheduleStats {
  employee_id: string
  employee_name: string
  total_schedules: number
  completed_schedules: number
  completion_rate: number
  average_score: number
  excellent_count: number
}

// 员工工作日志排行
export interface EmployeeWorkLogRanking {
  employee_id: string
  total_logs: number
  average_score: number
  excellent_logs: number
}

// 排班日志详情（包含员工信息）
export interface WorkLogWithEmployee extends WorkLog {
  employee_name: string
  employee_avatar?: string
  department?: string
  position?: string
}

// 排班记录详情（包含员工和配置信息）
export interface WorkScheduleRecordWithDetails extends WorkScheduleRecord {
  employee_name: string
  config_name: string
  store_name: string
}

// 排班配置详情（包含统计信息）
export interface WorkScheduleConfigWithStats extends WorkScheduleConfig {
  total_records: number
  completed_records: number
  completion_rate: number
  store_name: string
}
