/**
 * 2.0版本数据库类型定义
 * 包含营收预测、影响因子、排班优化、风险预警等新功能的类型
 */

// ==================== 营收预测相关 ====================

/**
 * 营收预测记录
 */
export interface RevenuePrediction {
  id: string
  tenant_id: string
  store_id?: string
  prediction_type: 'monthly' | 'daily'
  target_period: string
  conservative_value: number
  baseline_value: number
  optimistic_value: number
  confidence: number
  applied_factors?: any
  actual_value?: number
  accuracy_rate?: number
  model_version?: string
  created_at: string
  updated_at: string
}

/**
 * 预测结果
 */
export interface PredictionResult {
  conservative: number
  baseline: number
  optimistic: number
  confidence: number
  factors?: ImpactFactor[]
}

// ==================== 影响因子相关 ====================

/**
 * 影响因子类型
 */
export type FactorType = 'weather' | 'holiday' | 'event' | 'marketing' | 'competition' | 'internal'

/**
 * 影响因子
 */
export interface ImpactFactor {
  id: string
  tenant_id: string
  factor_type: FactorType
  factor_name: string
  factor_category?: string
  impact_value: number // -1.0 到 +1.0
  confidence: number // 0.0 到 1.0
  effective_date: string
  expiration_date?: string
  data_source: 'auto' | 'manual' | 'api'
  source_details?: any
  description?: string
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 影响因子创建参数
 */
export interface CreateImpactFactorParams {
  tenant_id: string
  factor_type: FactorType
  factor_name: string
  factor_category?: string
  impact_value: number
  confidence?: number
  effective_date: string
  expiration_date?: string
  data_source: 'auto' | 'manual' | 'api'
  description?: string
}

// ==================== 排班优化相关 ====================

/**
 * 排班优化记录
 */
export interface SchedulingOptimization {
  id: string
  tenant_id: string
  schedule_id: string
  optimization_type: 'initial' | 'adjustment' | 'emergency'
  trigger_reason?: string
  before_data: any
  after_data: any
  improvements?: any
  objectives?: any
  weights?: any
  cost_impact?: number
  efficiency_impact?: number
  satisfaction_impact?: number
  status: 'pending' | 'applied' | 'rejected'
  applied_at?: string
  applied_by?: string
  created_at: string
}

/**
 * 优化建议
 */
export interface OptimizationSuggestion {
  type: 'add_employee' | 'remove_employee' | 'adjust_hours' | 'swap_shift'
  employee_id?: string
  employee_name?: string
  position?: string
  hours?: number
  cost_impact: number
  revenue_impact: number
  roi: number
  priority: number
  reason: string
}

/**
 * 休假推荐
 */
export interface RestRecommendation {
  employee_id: string
  employee_name: string
  position: string
  score: number
  reasons: string[]
  substitutes?: Array<{
    id: string
    name: string
    skill_match: number
  }>
  cost_saving: number
  risk_level: 'low' | 'medium' | 'high'
}

// ==================== 风险预警相关 ====================

/**
 * 风险类型
 */
export type RiskType = 'personnel' | 'cost' | 'operation'

/**
 * 风险等级
 */
export type RiskLevel = 'high' | 'medium' | 'low'

/**
 * 风险预警
 */
export interface RiskAlert {
  id: string
  tenant_id: string
  store_id?: string
  risk_type: RiskType
  risk_level: RiskLevel
  risk_category: string
  risk_title: string
  risk_description?: string
  risk_impact?: any
  recommendations?: any
  status: 'active' | 'acknowledged' | 'resolved' | 'ignored'
  acknowledged_at?: string
  acknowledged_by?: string
  resolved_at?: string
  resolution_notes?: string
  detected_at: string
  created_at: string
  updated_at: string
}

/**
 * 风险预警创建参数
 */
export interface CreateRiskAlertParams {
  tenant_id: string
  store_id?: string
  risk_type: RiskType
  risk_level: RiskLevel
  risk_category: string
  risk_title: string
  risk_description?: string
  risk_impact?: any
  recommendations?: any
}

// ==================== 智能分析相关 ====================

/**
 * 数据洞察
 */
export interface DataInsight {
  id: string
  title: string
  description: string
  insight_type: 'efficiency' | 'cost' | 'personnel' | 'trend'
  metrics: {
    current: number
    target?: number
    change?: number
    unit: string
  }
  recommendations: string[]
  potential_value: number
  confidence: number
  priority: number
  created_at: string
}

/**
 * 趋势分析
 */
export interface TrendAnalysis {
  metric: string
  current_value: number
  previous_value: number
  change_rate: number
  trend: 'up' | 'down' | 'stable'
  forecast_value?: number
  forecast_confidence?: number
}

// ==================== 连锁协同相关 ====================

/**
 * 人员调配记录
 */
export interface StaffTransfer {
  id: string
  tenant_id: string
  from_store_id: string
  to_store_id: string
  employee_id: string
  transfer_date: string
  transfer_hours: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  cost: number
  approved_by?: string
  approved_at?: string
  created_by: string
  created_at: string
}

/**
 * 最佳实践分享
 */
export interface BestPractice {
  id: string
  tenant_id: string
  store_id: string
  title: string
  category: string
  description: string
  results: {
    revenue_growth?: number
    cost_reduction?: number
    efficiency_improvement?: number
  }
  applied_count: number
  rating: number
  created_by: string
  created_at: string
}

// ==================== 高级配置相关 ====================

/**
 * 核心岗位顶岗配置
 */
export interface CorePositionBackup {
  id: string
  tenant_id: string
  store_id: string
  core_employee_id: string
  core_position: string
  backup_employee_ids: string[]
  no_same_day_off: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 门店组织架构配置
 */
export interface StoreHierarchy {
  id: string
  tenant_id: string
  store_id: string
  scheduling_principle: 'top_only' | 'top_and_down'
  hierarchy_data?: any
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 岗位配置
 */
export interface PositionConfig {
  position_name: string
  required_count: number
}

/**
 * 最低营收岗位配置
 */
export interface MinRevenuePositions {
  id: string
  tenant_id: string
  store_id: string
  min_revenue: number
  scenario_name: string
  required_positions: PositionConfig[]
  description?: string
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 历史营收数据
 */
export interface RevenueHistory {
  id: string
  tenant_id: string
  store_id: string
  revenue_date: string
  revenue_amount: number
  customer_count?: number
  staff_count?: number
  working_hours?: number
  labor_cost?: number
  data_source: 'import' | 'manual' | 'system'
  import_batch_id?: string
  notes?: string
  created_by?: string
  created_at: string
}

/**
 * Excel导入结果
 */
export interface ImportResult {
  success: boolean
  total: number
  imported: number
  failed: number
  errors?: Array<{
    row: number
    error: string
  }>
  batch_id?: string
}

// ==================== 排休规则相关 ====================

/**
 * 不可排休日期类型
 */
export interface BlockedDate {
  type: 'single' | 'range'
  date?: string // 单个日期
  start_date?: string // 日期范围开始
  end_date?: string // 日期范围结束
  reason?: string // 原因说明
}

/**
 * 顶岗规则配置
 */
export interface BackupRule {
  core_employee_id: string // 核心岗位员工ID
  core_position: string // 核心岗位名称
  backup_employee_ids: string[] // 顶岗人员ID列表
  no_same_day_off: boolean // 是否禁止同休
}

/**
 * 排休规则配置
 */
export interface RestDayRule {
  id: string
  tenant_id: string
  store_id: string
  rule_name: string
  monthly_rest_days: number
  blocked_dates: BlockedDate[]
  max_specific_date_requests: number
  allow_rest_accumulation: boolean
  max_accumulated_days: number
  allow_consecutive_rest: boolean
  max_consecutive_days: number
  is_active: boolean
  applicable_employees: string[]
  priority: number
  description?: string
  backup_rules: BackupRule[] // 顶岗规则配置
  enable_backup_check: boolean // 是否启用顶岗检查
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 创建排休规则参数
 */
export interface CreateRestDayRuleParams {
  tenant_id: string
  store_id: string
  rule_name: string
  monthly_rest_days: number
  blocked_dates?: BlockedDate[]
  max_specific_date_requests?: number
  allow_rest_accumulation?: boolean
  max_accumulated_days?: number
  allow_consecutive_rest?: boolean
  max_consecutive_days?: number
  is_active?: boolean
  applicable_employees?: string[]
  priority?: number
  description?: string
  backup_rules?: BackupRule[] // 顶岗规则配置
  enable_backup_check?: boolean // 是否启用顶岗检查
  created_by?: string
}

// ==================== 经营区域管理系统 ====================

/**
 * 经营区域类型
 */
export type AreaType = 'dining' | 'kitchen' | 'bar' | 'takeout' | 'other'

/**
 * 经营区域
 */
export interface BusinessArea {
  id: string
  tenant_id: string
  store_id: string
  area_code: string
  area_name: string
  area_type: AreaType
  description?: string
  capacity?: number
  floor_number?: number
  sort_order: number
  is_active: boolean
  can_close_daily: boolean
  revenue_weight: number
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 创建经营区域参数
 */
export interface CreateBusinessAreaParams {
  tenant_id: string
  store_id: string
  area_code: string
  area_name: string
  area_type: AreaType
  description?: string
  capacity?: number
  floor_number?: number
  sort_order?: number
  can_close_daily?: boolean
  revenue_weight?: number
  created_by?: string
}

/**
 * 经营区域每日状态
 */
export interface AreaDailyStatus {
  id: string
  tenant_id: string
  store_id: string
  area_id: string
  status_date: string // YYYY-MM-DD
  is_open: boolean
  open_time?: string // HH:mm
  close_time?: string // HH:mm
  close_reason?: string
  predicted_customer_count?: number
  predicted_revenue?: number
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 创建区域每日状态参数
 */
export interface CreateAreaDailyStatusParams {
  tenant_id: string
  store_id: string
  area_id: string
  status_date: string
  is_open: boolean
  open_time?: string
  close_time?: string
  close_reason?: string
  predicted_customer_count?: number
  predicted_revenue?: number
  created_by?: string
}

/**
 * 岗位级别
 */
export type PositionLevel = 'junior' | 'intermediate' | 'senior' | 'manager'

/**
 * 经营区域岗位配置（定岗+定编）
 */
export interface AreaPosition {
  id: string
  tenant_id: string
  store_id: string
  area_id: string
  position_name: string
  position_level?: PositionLevel
  quota_count: number // 编制人数
  min_count: number // 最少人数
  max_count?: number // 最多人数
  required_skills?: string[]
  work_hours_per_day?: number
  salary_min?: number
  salary_max?: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 创建区域岗位配置参数
 */
export interface CreateAreaPositionParams {
  tenant_id: string
  store_id: string
  area_id: string
  position_name: string
  position_level?: PositionLevel
  quota_count: number
  min_count: number
  max_count?: number
  required_skills?: string[]
  work_hours_per_day?: number
  salary_min?: number
  salary_max?: number
  created_by?: string
}

/**
 * 分配类型
 */
export type AssignmentType = 'permanent' | 'temporary' | 'backup'

/**
 * 经营区域人员分配（定人）
 */
export interface AreaStaffAssignment {
  id: string
  tenant_id: string
  store_id: string
  area_id: string
  area_position_id: string
  employee_id: string
  assignment_type: AssignmentType
  start_date: string // YYYY-MM-DD
  end_date?: string // YYYY-MM-DD
  work_schedule?: any // 工作时间安排
  priority: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 创建人员分配参数
 */
export interface CreateAreaStaffAssignmentParams {
  tenant_id: string
  store_id: string
  area_id: string
  area_position_id: string
  employee_id: string
  assignment_type?: AssignmentType
  start_date: string
  end_date?: string
  work_schedule?: any
  priority?: number
  created_by?: string
}

/**
 * 上岗一览数据
 */
export interface AreaAttendanceOverview {
  id: string
  tenant_id: string
  store_id: string
  overview_date: string // YYYY-MM-DD
  overview_data: AreaAttendanceData
  total_areas: number
  open_areas: number
  total_positions: number
  total_staff_required: number
  total_staff_assigned: number
  total_staff_on_duty: number
  total_staff_on_rest: number
  is_complete: boolean
  generated_at: string
}

/**
 * 上岗一览详细数据
 */
export interface AreaAttendanceData {
  date: string
  areas: AreaAttendanceDetail[]
  summary: AttendanceSummary
}

/**
 * 区域上岗详情
 */
export interface AreaAttendanceDetail {
  area_id: string
  area_name: string
  area_type: AreaType
  is_open: boolean
  close_reason?: string
  positions: PositionAttendanceDetail[]
  area_summary: {
    total_positions: number
    total_required: number
    total_assigned: number
    total_on_duty: number
    total_on_rest: number
    fill_rate: number // 配置率
  }
}

/**
 * 岗位上岗详情
 */
export interface PositionAttendanceDetail {
  position_id: string
  position_name: string
  position_level?: PositionLevel
  quota_count: number
  min_count: number
  assigned_staff: StaffAttendanceInfo[]
  on_duty_count: number
  on_rest_count: number
  shortage_count: number // 缺员数
  is_adequate: boolean // 是否充足
}

/**
 * 员工上岗信息
 */
export interface StaffAttendanceInfo {
  employee_id: string
  employee_name: string
  assignment_type: AssignmentType
  is_on_duty: boolean // 是否在岗
  is_on_rest: boolean // 是否休息
  rest_reason?: string // 休息原因
  work_hours?: number // 工作时长
}

/**
 * 上岗汇总
 */
export interface AttendanceSummary {
  total_areas: number
  open_areas: number
  closed_areas: number
  total_positions: number
  total_required: number
  total_assigned: number
  total_on_duty: number
  total_on_rest: number
  overall_fill_rate: number // 总体配置率
  shortage_positions: ShortagePosition[] // 缺员岗位
}

/**
 * 缺员岗位
 */
export interface ShortagePosition {
  area_name: string
  position_name: string
  required: number
  assigned: number
  shortage: number
}

// ==================== 营收智能预估系统 ====================

/**
 * 月度营收日历
 */
export interface RevenueCalendar {
  id: string
  tenant_id: string
  store_id: string
  calendar_month: string // YYYY-MM格式
  total_revenue_target: number
  predicted_total_revenue: number
  status: 'draft' | 'confirmed' | 'locked'
  generated_by: 'auto' | 'manual'
  confirmed_at?: string
  confirmed_by?: string
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 每日营收明细
 */
export interface DailyRevenueDetail {
  id: string
  calendar_id: string
  revenue_date: string
  day_of_week: number // 0=周日, 1=周一, ..., 6=周六
  is_weekend: boolean
  is_holiday: boolean
  predicted_revenue: number
  adjusted_revenue?: number
  breakfast_revenue: number
  lunch_revenue: number
  dinner_revenue: number
  other_revenue: number
  weather_factor?: string
  event_factor?: string
  notes?: string
  created_at: string
  updated_at: string
}

/**
 * 营收调整记录
 */
export interface RevenueAdjustmentLog {
  id: string
  calendar_id: string
  daily_detail_id?: string
  adjustment_type: 'total' | 'daily' | 'meal'
  adjustment_scope?: string
  old_value?: number
  new_value?: number
  adjustment_reason?: string
  impact_factors?: any
  adjusted_by?: string
  adjusted_at: string
}

/**
 * 营收影响因子
 */
export interface RevenueImpactFactor {
  id: string
  tenant_id: string
  store_id: string
  factor_type: 'weather' | 'holiday' | 'promotion' | 'event'
  factor_name: string
  factor_value?: string
  impact_rate: number // 影响率百分比
  description?: string
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 创建营收日历参数
 */
export interface CreateRevenueCalendarParams {
  tenant_id: string
  store_id: string
  calendar_month: string
  total_revenue_target?: number
  predicted_total_revenue?: number
  generated_by?: 'auto' | 'manual'
  created_by?: string
}

/**
 * 创建每日营收明细参数
 */
export interface CreateDailyRevenueDetailParams {
  calendar_id: string
  revenue_date: string
  day_of_week: number
  is_weekend?: boolean
  is_holiday?: boolean
  predicted_revenue?: number
  adjusted_revenue?: number
  breakfast_revenue?: number
  lunch_revenue?: number
  dinner_revenue?: number
  other_revenue?: number
  weather_factor?: string | null
  event_factor?: string | null
  notes?: string | null
}

// ==================== 智能排班系统 ====================

/**
 * 月度排班日历
 */
export interface ScheduleCalendar {
  id: string
  tenant_id: string
  store_id: string
  calendar_month: string // YYYY-MM格式
  revenue_calendar_id?: string
  status: 'draft' | 'confirmed' | 'published'
  total_work_hours: number
  total_staff_count: number
  generated_by: 'auto' | 'manual'
  confirmed_at?: string
  confirmed_by?: string
  published_at?: string
  published_by?: string
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 每日排班明细
 */
export interface DailyScheduleDetail {
  id: string
  calendar_id: string
  schedule_date: string
  day_of_week: number
  is_weekend: boolean
  is_holiday: boolean
  predicted_revenue: number
  required_staff_count: number
  actual_staff_count: number
  morning_shift_count: number
  afternoon_shift_count: number
  evening_shift_count: number
  notes?: string
  created_at: string
  updated_at: string
}

/**
 * 员工排班明细
 */
export interface EmployeeScheduleDetail {
  id: string
  daily_schedule_id: string
  employee_id: string
  schedule_date: string
  shift_type: 'morning' | 'afternoon' | 'evening' | 'full' | 'rest'
  work_hours: number
  start_time?: string
  end_time?: string
  position?: string
  is_core_position: boolean
  is_backup: boolean
  notes?: string
  created_at: string
  updated_at: string
}

/**
 * 排班调整记录
 */
export interface ScheduleAdjustmentLog {
  id: string
  calendar_id: string
  daily_schedule_id?: string
  employee_schedule_id?: string
  adjustment_type: 'add' | 'modify' | 'delete' | 'swap'
  adjustment_scope?: string
  old_value?: any
  new_value?: any
  adjustment_reason: string // 必填
  adjusted_by?: string
  adjusted_at: string
}

/**
 * 员工月度排班视图
 */
export interface EmployeeMonthlySchedule {
  id: string
  tenant_id: string
  store_id: string
  employee_id: string
  calendar_month: string
  schedule_calendar_id: string
  total_work_days: number
  total_rest_days: number
  total_work_hours: number
  schedule_data?: any // JSON格式的详细排班数据
  created_at: string
  updated_at: string
}

/**
 * 创建排班日历参数
 */
export interface CreateScheduleCalendarParams {
  tenant_id: string
  store_id: string
  calendar_month: string
  revenue_calendar_id?: string
  generated_by?: 'auto' | 'manual'
  created_by?: string
}

/**
 * 创建每日排班明细参数
 */
export interface CreateDailyScheduleDetailParams {
  calendar_id: string
  schedule_date: string
  day_of_week: number
  is_weekend?: boolean
  is_holiday?: boolean
  predicted_revenue?: number
  required_staff_count?: number
}

/**
 * 创建员工排班明细参数
 */
export interface CreateEmployeeScheduleDetailParams {
  daily_schedule_id: string
  employee_id: string
  schedule_date: string
  shift_type: 'morning' | 'afternoon' | 'evening' | 'full' | 'rest'
  work_hours?: number
  start_time?: string
  end_time?: string
  position?: string
  is_core_position?: boolean
  is_backup?: boolean
  notes?: string
}
