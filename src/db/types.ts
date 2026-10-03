// 数据库类型定义

export type UserRole = 'super_admin' | 'tenant_admin' | 'agent' | 'store_manager' | 'employee' | 'guest'

export type EmploymentType = 'full_time' | 'part_time'

export type DepartmentType = 'front_hall' | 'kitchen'

export interface Tenant {
  id: string
  name: string
  admin_phone: string | null
  industry: string | null
  package_type: string
  status: string
  store_count: number
  employee_count: number
  is_demo: boolean // 是否为体验租户
  created_at: string
  updated_at: string
}

// 品牌
export interface Brand {
  id: string
  tenant_id: string
  name: string
  industry: string | null
  logo_url: string | null
  description: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// 租户申请状态
export type TenantApplicationStatus = 'pending' | 'approved' | 'rejected'

// 租户申请
export interface TenantApplication {
  id: string
  applicant_id: string
  applicant_phone: string
  tenant_name: string
  brand_name: string // 品牌名称
  industry: string
  company_address: string
  business_license: string | null
  contact_person: string
  contact_phone: string
  description: string | null
  status: TenantApplicationStatus
  rejection_reason: string | null
  created_at: string
  updated_at: string
  reviewed_by: string | null
  reviewed_at: string | null
}

export interface TenantSettings {
  id: string
  tenant_id: string
  default_daily_work_hours: number // 默认每日工作小时数
  brand_name: string | null // 品牌名称
  industry: string | null // 行业类型
  contact_person: string | null // 联系人
  contact_phone: string | null // 联系电话
  contact_email: string | null // 联系邮箱
  logo_url: string | null // 品牌Logo URL
  description: string | null // 品牌描述
  created_at: string
  updated_at: string
}

// 邀请码
export interface InvitationCode {
  id: string
  tenant_id: string
  store_id: string | null
  code: string
  role: UserRole
  max_uses: number
  used_count: number
  expires_at: string
  created_by: string | null
  created_at: string
  status: string
}

// 邀请码使用记录
export interface InvitationCodeUse {
  id: string
  invitation_code_id: string
  user_id: string
  used_at: string
}

// 邀请码验证结果
export interface InvitationCodeValidation {
  is_valid: boolean
  tenant_id: string | null
  tenant_name: string | null
  store_id: string | null
  store_name: string | null
  role: UserRole | null
  message: string
}

// 加入租户结果
export interface JoinTenantResult {
  success: boolean
  message: string
  tenant_id: string | null
  store_id: string | null
  role: UserRole | null
}

export interface Profile {
  id: string
  tenant_id: string | null
  phone: string | null
  email: string | null
  wechat_id: string | null
  wechat_openid: string | null // 微信小程序 OpenID
  wechat_unionid: string | null // 微信 UnionID
  wechat_nickname: string | null // 微信昵称
  wechat_avatar: string | null // 微信头像URL
  name: string | null
  avatar_url: string | null
  role: UserRole
  salary: number | null // 月薪（元）
  employment_type: EmploymentType // 雇佣类型
  daily_work_hours: number // 每日工作小时数，默认8小时
  status: string // 用户状态：active, inactive
  created_at: string
  updated_at: string
}

export interface Store {
  id: string
  tenant_id: string
  brand_id: string | null
  name: string
  address: string | null
  manager_id: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  tenant_id: string
  store_id: string
  brand_id: string | null // 品牌ID（新增）
  user_id: string | null
  name: string
  phone: string | null
  employee_type: EmploymentType
  department: DepartmentType // 部门：前厅/后厨
  position: string | null
  status: string
  monthly_salary: number | null
  daily_work_hours: number | null
  rest_days_per_month: number | null // 月公休天数，默认4天
  // 2.0版本新增字段
  is_core_position?: boolean // 是否核心岗位
  position_fixed_backup?: boolean // 岗位是否需要固定顶岗
  can_backup_positions?: string[] // 可以顶岗的其他岗位列表
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  tenant_id: string
  store_id: string
  employee_id: string
  schedule_date: string
  shift_type: string | null
  start_time: string | null
  end_time: string | null
  status: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // 排休相关字段
  is_day_off: boolean // 是否为排休记录
  meal_period: 'all_day' | 'breakfast' | 'lunch' | 'dinner' // 排休餐段
  rest_hours: number // 排休小时数
}

export interface ScheduleLog {
  id: string
  tenant_id: string
  schedule_id: string
  employee_id: string
  store_id: string
  log_date: string
  completion_status: string | null
  completion_time: string | null
  score: number | null
  duration_minutes: number | null
  notes: string | null
  created_at: string
}

export interface OperationsData {
  id: string
  tenant_id: string
  store_id: string | null
  data_date: string
  total_schedules: number
  completed_schedules: number
  excellent_schedules: number
  delayed_schedules: number
  avg_duration_minutes: number
  participation_count: number
  created_at: string
  updated_at: string
}

export interface CostData {
  id: string
  tenant_id: string
  store_id: string | null
  data_date: string
  revenue: number | null
  labor_cost: number | null
  labor_cost_ratio: number | null
  employee_count: number | null
  avg_efficiency: number | null
  created_at: string
  updated_at: string
}

// 扩展类型（用于前端展示）
export interface TenantWithDetails extends Tenant {
  stores?: Store[]
  employees?: Employee[]
}

export interface EmployeeWithDetails extends Employee {
  store?: Store
  user?: Profile
}

export interface ScheduleWithDetails extends Schedule {
  employee?: Employee
  store?: Store
}

export interface ScheduleLogWithDetails extends ScheduleLog {
  employee?: Employee
  store?: Store
  schedule?: Schedule
}

// 效能标准配置
export interface EfficiencyStandard {
  id: string
  tenant_id: string
  store_id: string | null
  // 低营收区配置
  low_revenue_max: number
  low_efficiency_standard: number
  low_management_motto: string
  // 正常营收区配置
  normal_revenue_min: number
  normal_revenue_max: number
  normal_efficiency_standard: number
  normal_management_motto: string
  // 高营收区配置
  high_revenue_min: number
  high_efficiency_standard: number
  high_management_motto: string
  created_at: string
  updated_at: string
}

// 每日运营记录
export interface DailyOperation {
  id: string
  tenant_id: string
  store_id: string
  operation_date: string
  // 排班规划阶段
  estimated_revenue: number | null
  planned_staff_count: number | null // 计划上岗人数
  planned_rest_count: number | null // 计划排休人数
  planned_part_time_hours: number | null // 计划兼职工时
  planned_labor_cost: number | null // 计划人力成本
  // 营业中调整阶段
  midday_estimated_revenue: number | null
  adjusted_staff_count: number | null // 调整后上岗人数
  adjusted_rest_count: number | null // 调整后排休人数
  adjusted_part_time_hours: number | null // 调整后兼职工时
  // 营业后复盘阶段
  actual_revenue: number | null
  actual_staff_count: number | null // 实际上岗人数
  actual_rest_count: number | null // 实际排休人数
  actual_part_time_hours: number | null // 实际兼职工时
  actual_labor_cost: number | null // 实际人力成本
  per_capita_revenue: number | null
  efficiency_rating: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 扩展类型
export interface EfficiencyStandardWithDetails extends EfficiencyStandard {
  store?: Store
}

export interface DailyOperationWithDetails extends DailyOperation {
  store?: Store
}

// 营收区间类型
export type RevenueZone = 'low' | 'normal' | 'high'

// 营收区间信息
export interface RevenueZoneInfo {
  zone: RevenueZone
  zoneName: string
  efficiencyStandard: number
  managementMotto: string
  targetWorkHours: number
}

// 餐段配置
export interface MealPeriod {
  id: string
  tenant_id: string
  store_id: string | null
  period_name: string
  period_order: number
  start_time: string | null
  end_time: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// 排班计划
export interface SchedulePlan {
  id: string
  tenant_id: string
  store_id: string
  plan_date: string
  total_estimated_revenue: number
  total_required_staff: number
  total_confirmed_staff: number
  total_regular_staff: number
  total_day_off_staff: number
  total_working_staff: number
  total_part_time_staff: number
  total_salary: number
  is_reasonable: boolean
  status: string
  created_at: string
  updated_at: string
}

// 排班计划餐段明细
export interface SchedulePlanPeriod {
  id: string
  schedule_plan_id: string
  period_name: string
  estimated_revenue: number
  required_staff: number
  confirmed_staff: number
  created_at: string
  updated_at: string
}

// 排休记录
export interface DayOffRecord {
  id: string
  schedule_plan_id: string
  employee_id: string
  day_off_date: string
  meal_period: 'all_day' | 'breakfast' | 'lunch' | 'dinner' // 餐段
  rest_hours: number // 排休小时数
  reason: string | null
  created_at: string
  updated_at: string
}

// 兼职记录
export interface PartTimeRecord {
  id: string
  schedule_plan_id: string
  name: string
  phone: string | null
  work_hours: number
  hourly_rate: number
  total_cost: number
  work_date: string
  created_at: string
  updated_at: string
}

// 兼职工时记录（新版）
export interface PartTimeShift {
  id: string
  tenant_id: string
  store_id: string
  operation_date: string // date类型，格式：YYYY-MM-DD
  employee_name: string
  phone: string | null // 联系电话
  work_hours: number
  hourly_rate: number
  total_cost: number
  meal_period: string | null // 餐段：早餐/午餐/晚餐
  notes: string | null
  created_at: string
  updated_at: string
}

// 排班结果
// 调整详情数据结构
export interface AdjustmentDetails {
  revenue?: {
    old: number
    new: number
  }
  staffCount?: {
    old: number
    new: number
  }
  restStaff?: {
    old: number
    new: number
  }
  tempWorkers?: {
    old: number
    new: number
  }
}

export interface ScheduleResult {
  id: string
  tenant_id: string
  store_id: string
  operation_date: string // date类型，格式：YYYY-MM-DD
  estimated_revenue: number // 预估营收
  target_staff_count: number // 目标人数
  planned_staff_count: number // 计划人数
  rest_staff_count: number // 排休人数
  rest_days: number // 排休天数（例如：4小时=0.5天，8小时=1天）
  part_time_count: number // 兼职人数
  part_time_hours: number // 兼职总工时
  achievement_rate: number // 排班达成率
  total_labor_cost: number // 人力成本总额
  labor_cost_rate: number // 人力成本率
  is_cost_qualified: boolean // 成本是否合格
  efficiency_zone: string // 营收区间：low/normal/high
  adjustment_type?: string // 调整类型：'首次规划' | '重新规划'
  adjustment_reason?: string | null // 调整原因
  previous_result_id?: string | null // 上一次排班结果ID
  adjustment_details?: AdjustmentDetails | null // 调整详情
  adjusted_by?: string | null // 调整人ID
  is_latest?: boolean // 是否为最新记录
  created_at: string
  updated_at: string
}

// 今日运营仪表盘数据
export interface DashboardData {
  revenue: number // 营收
  rest_count: number // 排休人数
  efficiency: number // 人效（营收/排班人数）
  labor_cost: number // 薪酬
  thousand_yuan_contribution: number // 1000元薪酬贡献
  cost_ratio: number // 人力成本占营收比
  planned_staff_count: number // 排班人数
}

// 今日运营仪表盘汇总数据
export interface DashboardSummary {
  today: DashboardData // 当日数据
  accumulated: DashboardData // 累计数据（本月）
  days_count: number // 累计天数
}

// ==================== 营收明细系统 ====================

// 餐段类型（用于营收明细）
export type MealPeriodType = 'breakfast' | 'lunch' | 'dinner' | 'night'

// 经营区类型
export type BusinessArea = 'hall' | 'private_room' | 'takeout' | 'other'

// 营收明细记录
export interface RevenueDetailRecord {
  id: string
  tenant_id: string
  store_id: string
  revenue_date: string // 日期格式：YYYY-MM-DD
  meal_period: MealPeriodType // 餐段
  business_area: BusinessArea // 经营区
  customer_count: number // 来客数
  avg_price_per_customer: number // 客单价
  total_revenue: number // 总营收（自动计算）
  notes: string | null // 备注
  created_by: string | null
  created_at: string
  updated_at: string
}

// Excel导入记录
export interface RevenueImportLog {
  id: string
  tenant_id: string
  store_id: string | null
  import_date: string
  file_name: string
  total_records: number
  success_records: number
  failed_records: number
  error_details: any | null // JSON格式的错误详情
  imported_by: string | null
  imported_at: string
}

// Excel导入数据行
export interface RevenueImportRow {
  日期: string
  餐段: string
  经营区: string
  来客数: number
  客单价: number
  总营收?: number // 可选，如果没有会自动计算
  备注?: string
}

// 导入结果
export interface RevenueImportResult {
  success: boolean
  total: number
  success_count: number
  failed_count: number
  errors: Array<{
    row: number
    data: RevenueImportRow
    error: string
  }>
}

// ==================== 岗位配置系统 ====================

// 岗位类别
export type PositionCategory = 'front' | 'kitchen'

// 岗位配置
export interface PositionConfig {
  id: string
  tenant_id: string
  position_name: string
  position_category: PositionCategory
  is_core: boolean // 是否核心岗位
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 餐段中文映射
export const MealPeriodTypeLabels: Record<MealPeriodType, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  night: '夜宵'
}

// 经营区中文映射
export const BusinessAreaLabels: Record<BusinessArea, string> = {
  hall: '大厅',
  private_room: '包间',
  takeout: '外卖',
  other: '其他'
}

// 岗位类别中文映射
export const PositionCategoryLabels: Record<PositionCategory, string> = {
  front: '前厅',
  kitchen: '后厨'
}

// 班次配置
export interface WorkShift {
  id: string
  tenant_id: string
  store_id: string | null // 为空表示租户级别配置
  shift_name: string // 班次名称，如：早班、晚班、正常班
  shift_order: number // 显示顺序
  start_time: string // 开始时间 HH:mm:ss
  end_time: string // 结束时间 HH:mm:ss
  work_hours: number // 工作小时数
  is_active: boolean // 是否启用
  created_at: string
  updated_at: string
}

// 餐段配置
export interface MealPeriod {
  id: string
  tenant_id: string
  store_id: string | null // 为空表示租户级别配置
  period_name: string // 餐段名称，如：早餐、午餐、晚餐
  period_order: number // 显示顺序
  start_time: string | null // 开始时间 HH:mm:ss
  end_time: string | null // 结束时间 HH:mm:ss
  is_active: boolean // 是否启用
  created_at: string
  updated_at: string
}

// ==================== 员工入职管理 ====================

// 入职申请状态
export type OnboardingStatus = 'pending' | 'approved' | 'rejected' | 'completed'

// 员工入职申请
export interface EmployeeOnboarding {
  id: string
  tenant_id: string
  store_id: string
  name: string
  phone: string
  id_card: string | null
  email: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  department: string | null
  position: string | null
  onboarding_date: string // date
  probation_months: number
  expected_salary: number | null
  status: OnboardingStatus
  approval_comment: string | null
  approved_by: string | null
  approved_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// 创建入职申请输入
export interface CreateOnboardingInput {
  tenant_id: string
  store_id: string
  name: string
  phone: string
  id_card?: string
  email?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  department?: string
  position?: string
  onboarding_date: string
  probation_months?: number
  expected_salary?: number
  created_by?: string
}

// 入职资料类型
export type DocumentType = 'id_card' | 'diploma' | 'health_cert' | 'other'

// 入职资料
export interface OnboardingDocument {
  id: string
  onboarding_id: string
  document_type: DocumentType
  document_name: string
  file_url: string
  uploaded_at: string
}

// 创建入职资料输入
export interface CreateOnboardingDocumentInput {
  onboarding_id: string
  document_type: DocumentType
  document_name: string
  file_url: string
}

// 试用期评估
export interface ProbationEvaluation {
  id: string
  tenant_id: string
  employee_id: string
  evaluation_date: string // date
  work_attitude_score: number | null
  work_ability_score: number | null
  team_cooperation_score: number | null
  overall_score: number | null
  evaluation_content: string | null
  improvement_suggestions: string | null
  evaluator_id: string | null
  created_at: string
}

// 创建试用期评估输入
export interface CreateProbationEvaluationInput {
  tenant_id: string
  employee_id: string
  evaluation_date: string
  work_attitude_score?: number
  work_ability_score?: number
  team_cooperation_score?: number
  overall_score?: number
  evaluation_content?: string
  improvement_suggestions?: string
  evaluator_id?: string
}

// 转正申请状态
export type RegularizationStatus = 'pending' | 'approved' | 'rejected'

// 转正申请
export interface RegularizationApplication {
  id: string
  tenant_id: string
  employee_id: string
  application_date: string // date
  expected_regularization_date: string // date
  self_evaluation: string | null
  work_summary: string | null
  status: RegularizationStatus
  approval_comment: string | null
  approved_by: string | null
  approved_at: string | null
  actual_regularization_date: string | null // date
  created_at: string
}

// 创建转正申请输入
export interface CreateRegularizationInput {
  tenant_id: string
  employee_id: string
  application_date: string
  expected_regularization_date: string
  self_evaluation?: string
  work_summary?: string
}

// ==================== 员工离职管理 ====================

// 离职类型
export type ResignationType = 'voluntary' | 'involuntary' | 'contract_end'

// 离职申请状态
export type ResignationStatus = 'pending' | 'approved' | 'rejected' | 'completed'

// 员工离职申请
export interface EmployeeResignation {
  id: string
  tenant_id: string
  store_id: string
  employee_id: string
  resignation_type: ResignationType
  resignation_reason: string
  resignation_date: string // date
  last_working_day: string // date
  status: ResignationStatus
  approval_comment: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

// 创建离职申请输入
export interface CreateResignationInput {
  tenant_id: string
  store_id: string
  employee_id: string
  resignation_type: ResignationType
  resignation_reason: string
  resignation_date: string
  last_working_day: string
}

// 离职交接状态
export type HandoverStatus = 'pending' | 'in_progress' | 'completed'

// 离职交接
export interface ResignationHandover {
  id: string
  resignation_id: string
  handover_item: string
  handover_to_id: string | null
  handover_status: HandoverStatus
  handover_date: string | null // date
  notes: string | null
  created_at: string
}

// 创建离职交接输入
export interface CreateHandoverInput {
  resignation_id: string
  handover_item: string
  handover_to_id?: string
  handover_status?: HandoverStatus
  handover_date?: string
  notes?: string
}

// 离职面谈
export interface ExitInterview {
  id: string
  resignation_id: string
  interview_date: string // date
  interviewer_id: string | null
  satisfaction_rating: number | null
  leaving_reason_detail: string | null
  company_feedback: string | null
  improvement_suggestions: string | null
  would_recommend: boolean | null
  would_return: boolean | null
  interview_notes: string | null
  created_at: string
}

// 创建离职面谈输入
export interface CreateExitInterviewInput {
  resignation_id: string
  interview_date: string
  interviewer_id?: string
  satisfaction_rating?: number
  leaving_reason_detail?: string
  company_feedback?: string
  improvement_suggestions?: string
  would_recommend?: boolean
  would_return?: boolean
  interview_notes?: string
}

// Agent分配关系
export interface AgentAssignment {
  id: string
  agent_id: string
  store_id: string
  tenant_id: string
  assigned_at: string
  assigned_by: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// Agent分配输入
export interface CreateAgentAssignmentInput {
  agent_id: string
  store_id: string
  assigned_by: string
}

// Agent统计信息
export interface AgentStats {
  agent_id: string
  agent_name: string
  store_count: number
  employee_count: number
  total_revenue: number
  avg_efficiency: number
}
