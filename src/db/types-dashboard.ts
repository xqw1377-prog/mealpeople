/**
 * 管理工作台相关类型定义
 */

// ============================================
// 枚举类型
// ============================================

/**
 * 组件类型
 */
export type WidgetType = 'stats' | 'chart' | 'list' | 'calendar'

/**
 * 警报类型
 */
export type AlertType =
  | 'attendance' // 考勤相关
  | 'performance' // 绩效相关
  | 'leave' // 请假相关
  | 'overtime' // 加班相关
  | 'salary' // 薪酬相关
  | 'promotion' // 晋升相关
  | 'transfer' // 调岗相关
  | 'onboarding' // 入职相关
  | 'offboarding' // 离职相关
  | 'system' // 系统相关

/**
 * 严重程度
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'

// ============================================
// 数据库表类型
// ============================================

/**
 * 仪表盘组件
 */
export interface DashboardWidget {
  id: string
  user_id: string
  widget_type: WidgetType
  widget_config: Record<string, any>
  position: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

/**
 * 仪表盘警报
 */
export interface DashboardAlert {
  id: string
  alert_type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  related_id?: string
  is_read: boolean
  is_resolved: boolean
  created_at: string
  resolved_at?: string
}

/**
 * 快捷操作
 */
export interface DashboardQuickAction {
  id: string
  user_id: string
  action_type: string
  action_name: string
  action_config: Record<string, any>
  usage_count: number
  last_used_at?: string
  created_at: string
}

// ============================================
// 业务类型
// ============================================

/**
 * 仪表盘统计数据
 */
export interface DashboardStats {
  // 员工统计
  total_employees: number
  active_employees: number
  on_leave_employees: number
  new_employees_this_month: number

  // 考勤统计
  today_attendance_rate: number
  this_week_attendance_rate: number
  late_count_today: number
  absent_count_today: number

  // 请假统计
  pending_leave_count: number
  approved_leave_today: number
  total_leave_days_this_month: number

  // 加班统计
  pending_overtime_count: number
  approved_overtime_today: number
  total_overtime_hours_this_month: number

  // 绩效统计
  average_performance_score: number
  high_performers_count: number
  low_performers_count: number

  // 入职离职统计
  onboarding_in_progress: number
  offboarding_in_progress: number
  turnover_rate_this_month: number
}

/**
 * 待办事项
 */
export interface DashboardTodoItem {
  id: string
  type: 'leave' | 'overtime' | 'promotion' | 'transfer' | 'onboarding' | 'offboarding'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  applicant_name?: string
  applicant_id?: string
  created_at: string
}

/**
 * 团队动态
 */
export interface DashboardTeamActivity {
  id: string
  type: 'attendance' | 'leave' | 'overtime' | 'performance' | 'promotion' | 'transfer' | 'onboarding' | 'offboarding'
  title: string
  description: string
  employee_name: string
  employee_id: string
  created_at: string
}

/**
 * 警报统计
 */
export interface AlertStats {
  total: number
  unread: number
  by_type: Record<AlertType, number>
  by_severity: Record<AlertSeverity, number>
}

/**
 * 仪表盘数据（完整）
 */
export interface DashboardData {
  stats: DashboardStats
  alerts: DashboardAlert[]
  alert_stats: AlertStats
  todos: DashboardTodoItem[]
  team_activities: DashboardTeamActivity[]
  quick_actions: DashboardQuickAction[]
}
