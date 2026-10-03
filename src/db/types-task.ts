/**
 * 任务管理系统类型定义
 */

/**
 * 任务优先级
 */
export type TaskPriority = 'high' | 'medium' | 'low'

/**
 * 任务状态
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

/**
 * 任务
 */
export interface Task {
  id: string
  tenant_id: string
  employee_id: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  created_by: string
  assigned_by: string | null
  created_at: string
  updated_at: string
}

/**
 * 任务统计
 */
export interface TaskStats {
  total: number // 总任务数
  pending: number // 待开始
  in_progress: number // 进行中
  completed: number // 已完成
  cancelled: number // 已取消
  completion_rate: number // 完成率（百分比）
  overdue: number // 逾期任务数
}

/**
 * 今日任务摘要
 */
export interface TodayTasksSummary {
  total: number // 今日总任务
  completed: number // 已完成
  pending: number // 待处理
  tasks: Task[] // 任务列表（最多3个）
}

/**
 * 任务优先级显示名称映射
 */
export const TASK_PRIORITY_NAMES: Record<TaskPriority, string> = {
  high: '高',
  medium: '中',
  low: '低'
}

/**
 * 任务优先级颜色映射
 */
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-muted-foreground'
}

/**
 * 任务优先级图标映射
 */
export const TASK_PRIORITY_ICONS: Record<TaskPriority, string> = {
  high: 'i-mdi-alert-circle',
  medium: 'i-mdi-alert',
  low: 'i-mdi-information'
}

/**
 * 任务状态显示名称映射
 */
export const TASK_STATUS_NAMES: Record<TaskStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

/**
 * 任务状态颜色映射
 */
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'text-muted-foreground bg-muted',
  in_progress: 'text-primary bg-primary/10',
  completed: 'text-success bg-success/10',
  cancelled: 'text-muted-foreground bg-muted'
}

/**
 * 任务状态图标映射
 */
export const TASK_STATUS_ICONS: Record<TaskStatus, string> = {
  pending: 'i-mdi-clock-outline',
  in_progress: 'i-mdi-progress-clock',
  completed: 'i-mdi-check-circle',
  cancelled: 'i-mdi-close-circle'
}

/**
 * 任务筛选选项
 */
export interface TaskFilterOptions {
  status?: TaskStatus
  priority?: TaskPriority
  startDate?: string
  endDate?: string
  keyword?: string
}

/**
 * 任务创建输入
 */
export interface TaskCreateInput {
  tenant_id: string
  employee_id: string
  title: string
  description?: string
  priority?: TaskPriority
  due_date?: string
  created_by: string
  assigned_by?: string
}

/**
 * 任务更新输入
 */
export interface TaskUpdateInput {
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string
}
