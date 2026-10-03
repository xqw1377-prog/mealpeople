/**
 * 智能排班生成系统类型定义
 */

/**
 * 排班生成配置
 */
export interface ScheduleGenerationConfig {
  tenant_id: string
  store_id: string
  year: number
  month: number
  target_revenue?: number // 目标营收
  max_cost_rate?: number // 最大人力成本率
  min_rest_days?: number // 最少休息天数
  max_consecutive_work_days?: number // 最大连续工作天数
  prefer_weekend_rest?: boolean // 优先周末休息
}

/**
 * 员工排班约束
 */
export interface EmployeeScheduleConstraint {
  employee_id: string
  employee_name: string
  position: string
  is_core_position: boolean // 是否核心岗位
  min_work_days: number // 最少工作天数
  max_work_days: number // 最多工作天数
  rest_day_requests: string[] // 请假日期列表
  preferred_rest_days: number[] // 偏好休息日（1-7，周一到周日）
  cannot_work_with?: string[] // 不能同时排班的员工ID列表
  must_work_with?: string[] // 必须同时排班的员工ID列表
}

/**
 * 日期排班需求
 */
export interface DailyScheduleRequirement {
  date: string
  day_of_week: number // 1-7，周一到周日
  is_weekend: boolean
  is_holiday: boolean
  predicted_revenue: number // 预测营收
  required_positions: PositionRequirement[] // 岗位需求
  min_staff_count: number // 最少人数
  max_staff_count: number // 最多人数
  target_cost: number // 目标成本
}

/**
 * 岗位需求
 */
export interface PositionRequirement {
  position: string
  min_count: number
  max_count: number
  is_required: boolean // 是否必需
}

/**
 * 排班结果
 */
export interface ScheduleResult {
  date: string
  employee_id: string
  employee_name: string
  position: string
  shift_type: 'work' | 'rest' | 'leave' // 上班/休息/请假
  work_hours?: number
  cost?: number
}

/**
 * 月度排班结果
 */
export interface MonthlyScheduleResult {
  tenant_id: string
  store_id: string
  year: number
  month: number
  schedules: ScheduleResult[]
  statistics: ScheduleStatistics
  conflicts: ScheduleConflict[]
  suggestions: string[]
}

/**
 * 排班统计
 */
export interface ScheduleStatistics {
  total_work_days: number
  total_rest_days: number
  total_cost: number
  average_cost_per_day: number
  cost_rate: number // 人力成本率
  staff_utilization: number // 人员利用率
  position_distribution: Record<string, number> // 岗位分布
  employee_work_days: Record<string, number> // 员工工作天数
}

/**
 * 排班冲突
 */
export interface ScheduleConflict {
  type: 'understaffed' | 'overstaffed' | 'constraint_violation' | 'cost_exceeded'
  date: string
  severity: 'low' | 'medium' | 'high'
  description: string
  affected_employees?: string[]
  suggestion?: string
}

/**
 * 排班优化建议
 */
export interface ScheduleOptimizationSuggestion {
  type: 'cost' | 'efficiency' | 'fairness' | 'constraint'
  priority: 'low' | 'medium' | 'high'
  description: string
  expected_improvement: string
  actions: OptimizationAction[]
}

/**
 * 优化操作
 */
export interface OptimizationAction {
  action_type: 'swap' | 'add' | 'remove' | 'adjust'
  date: string
  employee_id: string
  details: string
}

/**
 * 排班生成请求
 */
export interface GenerateScheduleRequest {
  config: ScheduleGenerationConfig
  employees: EmployeeScheduleConstraint[]
  daily_requirements: DailyScheduleRequirement[]
  existing_schedules?: ScheduleResult[] // 已有排班（用于调整）
}

/**
 * 排班生成响应
 */
export interface GenerateScheduleResponse {
  success: boolean
  result?: MonthlyScheduleResult
  error?: string
}

/**
 * 排班调整请求
 */
export interface AdjustScheduleRequest {
  schedule_id: string
  date: string
  employee_id: string
  new_shift_type: 'work' | 'rest' | 'leave'
  reason?: string
}

/**
 * 排班交换请求
 */
export interface SwapScheduleRequest {
  schedule_id: string
  date: string
  employee_id_1: string
  employee_id_2: string
  reason?: string
}
