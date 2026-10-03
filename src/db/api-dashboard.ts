/**
 * 管理工作台API接口
 */

import {supabase} from '@/client/supabase'
import type {
  AlertStats,
  DashboardAlert,
  DashboardData,
  DashboardQuickAction,
  DashboardStats,
  DashboardTeamActivity,
  DashboardTodoItem,
  DashboardWidget
} from './types-dashboard'

// ============================================
// 仪表盘组件管理
// ============================================

/**
 * 获取用户的仪表盘组件配置
 */
export async function getUserWidgets(userId: string): Promise<DashboardWidget[]> {
  const {data, error} = await supabase
    .from('dashboard_widgets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_visible', true)
    .order('position', {ascending: true})

  if (error) {
    console.error('获取仪表盘组件失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 保存仪表盘组件配置
 */
export async function saveWidget(widget: Partial<DashboardWidget>): Promise<DashboardWidget | null> {
  const {data, error} = await supabase.from('dashboard_widgets').insert(widget).select().maybeSingle()

  if (error) {
    console.error('保存仪表盘组件失败:', error)
    return null
  }

  return data
}

/**
 * 更新仪表盘组件配置
 */
export async function updateWidget(id: string, updates: Partial<DashboardWidget>): Promise<boolean> {
  const {error} = await supabase.from('dashboard_widgets').update(updates).eq('id', id)

  if (error) {
    console.error('更新仪表盘组件失败:', error)
    return false
  }

  return true
}

/**
 * 删除仪表盘组件
 */
export async function deleteWidget(id: string): Promise<boolean> {
  const {error} = await supabase.from('dashboard_widgets').delete().eq('id', id)

  if (error) {
    console.error('删除仪表盘组件失败:', error)
    return false
  }

  return true
}

// ============================================
// 警报管理
// ============================================

/**
 * 获取所有警报
 */
export async function getAlerts(limit = 50): Promise<DashboardAlert[]> {
  const {data, error} = await supabase
    .from('dashboard_alerts')
    .select('*')
    .order('created_at', {ascending: false})
    .limit(limit)

  if (error) {
    console.error('获取警报失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取未读警报
 */
export async function getUnreadAlerts(): Promise<DashboardAlert[]> {
  const {data, error} = await supabase
    .from('dashboard_alerts')
    .select('*')
    .eq('is_read', false)
    .eq('is_resolved', false)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取未读警报失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 标记警报为已读
 */
export async function markAlertAsRead(id: string): Promise<boolean> {
  const {error} = await supabase.from('dashboard_alerts').update({is_read: true}).eq('id', id)

  if (error) {
    console.error('标记警报为已读失败:', error)
    return false
  }

  return true
}

/**
 * 标记警报为已解决
 */
export async function markAlertAsResolved(id: string): Promise<boolean> {
  const {error} = await supabase
    .from('dashboard_alerts')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('标记警报为已解决失败:', error)
    return false
  }

  return true
}

/**
 * 获取警报统计
 */
export async function getAlertStats(): Promise<AlertStats> {
  const alerts = await getAlerts()

  const stats: AlertStats = {
    total: alerts.length,
    unread: alerts.filter((a) => !a.is_read && !a.is_resolved).length,
    by_type: {
      attendance: 0,
      performance: 0,
      leave: 0,
      overtime: 0,
      salary: 0,
      promotion: 0,
      transfer: 0,
      onboarding: 0,
      offboarding: 0,
      system: 0
    },
    by_severity: {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0
    }
  }

  alerts.forEach((alert) => {
    if (!alert.is_resolved) {
      stats.by_type[alert.alert_type]++
      stats.by_severity[alert.severity]++
    }
  })

  return stats
}

// ============================================
// 快捷操作管理
// ============================================

/**
 * 获取用户的快捷操作
 */
export async function getQuickActions(userId: string): Promise<DashboardQuickAction[]> {
  const {data, error} = await supabase
    .from('dashboard_quick_actions')
    .select('*')
    .eq('user_id', userId)
    .order('usage_count', {ascending: false})
    .limit(10)

  if (error) {
    console.error('获取快捷操作失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 记录快捷操作使用
 */
export async function recordQuickActionUsage(id: string): Promise<boolean> {
  const {error} = await supabase.rpc('increment_quick_action_usage', {action_id: id})

  if (error) {
    console.error('记录快捷操作使用失败:', error)
    return false
  }

  return true
}

// ============================================
// 统计数据
// ============================================

/**
 * 获取仪表盘统计数据
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // 这里使用示例数据，实际应该从数据库查询
  const stats: DashboardStats = {
    // 员工统计
    total_employees: 156,
    active_employees: 142,
    on_leave_employees: 8,
    new_employees_this_month: 12,

    // 考勤统计
    today_attendance_rate: 96.5,
    this_week_attendance_rate: 94.8,
    late_count_today: 3,
    absent_count_today: 2,

    // 请假统计
    pending_leave_count: 5,
    approved_leave_today: 8,
    total_leave_days_this_month: 45,

    // 加班统计
    pending_overtime_count: 3,
    approved_overtime_today: 6,
    total_overtime_hours_this_month: 128,

    // 绩效统计
    average_performance_score: 85.6,
    high_performers_count: 28,
    low_performers_count: 5,

    // 入职离职统计
    onboarding_in_progress: 4,
    offboarding_in_progress: 2,
    turnover_rate_this_month: 3.2
  }

  return stats
}

/**
 * 获取待办事项列表
 */
export async function getTodoList(): Promise<DashboardTodoItem[]> {
  // 示例数据
  const todos: DashboardTodoItem[] = [
    {
      id: '1',
      type: 'leave',
      title: '请假审批',
      description: '张三申请病假3天',
      priority: 'high',
      due_date: new Date().toISOString(),
      applicant_name: '张三',
      applicant_id: 'emp001',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'overtime',
      title: '加班审批',
      description: '李四申请周末加班',
      priority: 'medium',
      due_date: new Date().toISOString(),
      applicant_name: '李四',
      applicant_id: 'emp002',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'promotion',
      title: '晋升审批',
      description: '王五申请晋升为主管',
      priority: 'high',
      applicant_name: '王五',
      applicant_id: 'emp003',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      type: 'onboarding',
      title: '入职办理',
      description: '赵六明天入职',
      priority: 'urgent',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      applicant_name: '赵六',
      applicant_id: 'emp004',
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '5',
      type: 'offboarding',
      title: '离职办理',
      description: '孙七离职手续办理',
      priority: 'medium',
      applicant_name: '孙七',
      applicant_id: 'emp005',
      created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    }
  ]

  return todos
}

/**
 * 获取团队动态
 */
export async function getTeamActivities(limit = 20): Promise<DashboardTeamActivity[]> {
  // 示例数据
  const activities: DashboardTeamActivity[] = [
    {
      id: '1',
      type: 'attendance',
      title: '考勤打卡',
      description: '张三完成今日打卡',
      employee_name: '张三',
      employee_id: 'emp001',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'performance',
      title: '绩效达成',
      description: '李四本月绩效达成率100%',
      employee_name: '李四',
      employee_id: 'emp002',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'promotion',
      title: '晋升通知',
      description: '王五晋升为主管',
      employee_name: '王五',
      employee_id: 'emp003',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      type: 'onboarding',
      title: '新员工入职',
      description: '赵六加入团队',
      employee_name: '赵六',
      employee_id: 'emp004',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '5',
      type: 'leave',
      title: '请假申请',
      description: '孙七申请年假5天',
      employee_name: '孙七',
      employee_id: 'emp005',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ]

  return activities.slice(0, limit)
}

/**
 * 获取完整的仪表盘数据
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [stats, alerts, alert_stats, todos, team_activities, quick_actions] = await Promise.all([
    getDashboardStats(),
    getUnreadAlerts(),
    getAlertStats(),
    getTodoList(),
    getTeamActivities(),
    getQuickActions(userId)
  ])

  return {
    stats,
    alerts,
    alert_stats,
    todos,
    team_activities,
    quick_actions
  }
}
