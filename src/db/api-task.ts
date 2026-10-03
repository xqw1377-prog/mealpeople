/**
 * 任务管理 API
 */

import {supabase} from '@/client/supabase'
import {createNotification} from './api-notification'
import type {
  Task,
  TaskCreateInput,
  TaskFilterOptions,
  TaskStats,
  TaskUpdateInput,
  TodayTasksSummary
} from './types-task'

/**
 * 获取任务列表
 * @param employeeId 员工ID
 * @param options 筛选选项
 * @returns 任务列表
 */
export async function getTasks(employeeId: string, options?: TaskFilterOptions): Promise<Task[]> {
  try {
    let query = supabase.from('tasks').select('*').eq('employee_id', employeeId).order('created_at', {ascending: false})

    // 应用筛选条件
    if (options?.status) {
      query = query.eq('status', options.status)
    }

    if (options?.priority) {
      query = query.eq('priority', options.priority)
    }

    if (options?.startDate) {
      query = query.gte('due_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('due_date', options.endDate)
    }

    if (options?.keyword) {
      query = query.or(`title.ilike.%${options.keyword}%,description.ilike.%${options.keyword}%`)
    }

    const {data, error} = await query

    if (error) throw error

    return (data || []) as Task[]
  } catch (error) {
    console.error('获取任务列表失败:', error)
    throw error
  }
}

/**
 * 获取任务详情
 * @param taskId 任务ID
 * @returns 任务详情
 */
export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const {data, error} = await supabase.from('tasks').select('*').eq('id', taskId).maybeSingle()

    if (error) throw error

    return data as Task | null
  } catch (error) {
    console.error('获取任务详情失败:', error)
    throw error
  }
}

/**
 * 创建任务
 * @param taskData 任务数据
 * @returns 创建的任务
 */
export async function createTask(taskData: TaskCreateInput): Promise<Task> {
  try {
    const {data, error} = await supabase.from('tasks').insert(taskData).select().single()

    if (error) throw error
    if (!data) throw new Error('创建任务失败')

    // 自动发送通知给员工
    try {
      await createNotification({
        tenant_id: taskData.tenant_id,
        user_id: taskData.employee_id,
        type: 'task',
        title: '新任务分配',
        content: `您有一个新任务：${taskData.title}`,
        related_id: data.id,
        related_type: 'task'
      })
    } catch (notificationError) {
      console.error('发送任务通知失败:', notificationError)
      // 通知失败不影响任务创建
    }

    return data as Task
  } catch (error) {
    console.error('创建任务失败:', error)
    throw error
  }
}

/**
 * 更新任务
 * @param taskId 任务ID
 * @param updates 更新内容
 * @returns 更新后的任务
 */
export async function updateTask(taskId: string, updates: TaskUpdateInput): Promise<Task> {
  try {
    const {data, error} = await supabase.from('tasks').update(updates).eq('id', taskId).select().single()

    if (error) throw error
    if (!data) throw new Error('更新任务失败')

    return data as Task
  } catch (error) {
    console.error('更新任务失败:', error)
    throw error
  }
}

/**
 * 更新任务状态
 * @param taskId 任务ID
 * @param status 新状态
 * @returns 更新后的任务
 */
export async function updateTaskStatus(taskId: string, status: string): Promise<Task> {
  try {
    const {data, error} = await supabase.from('tasks').update({status}).eq('id', taskId).select().single()

    if (error) throw error
    if (!data) throw new Error('更新任务状态失败')

    return data as Task
  } catch (error) {
    console.error('更新任务状态失败:', error)
    throw error
  }
}

/**
 * 删除任务
 * @param taskId 任务ID
 */
export async function deleteTask(taskId: string): Promise<void> {
  try {
    const {error} = await supabase.from('tasks').delete().eq('id', taskId)

    if (error) throw error
  } catch (error) {
    console.error('删除任务失败:', error)
    throw error
  }
}

/**
 * 获取今日任务
 * @param employeeId 员工ID
 * @returns 今日任务列表
 */
export async function getTodayTasks(employeeId: string): Promise<Task[]> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const {data, error} = await supabase
      .from('tasks')
      .select('*')
      .eq('employee_id', employeeId)
      .lte('due_date', today)
      .in('status', ['pending', 'in_progress'])
      .order('priority', {ascending: true}) // high 优先
      .order('due_date', {ascending: true})

    if (error) throw error

    return (data || []) as Task[]
  } catch (error) {
    console.error('获取今日任务失败:', error)
    throw error
  }
}

/**
 * 获取今日任务摘要
 * @param employeeId 员工ID
 * @returns 今日任务摘要
 */
export async function getTodayTasksSummary(employeeId: string): Promise<TodayTasksSummary> {
  try {
    const today = new Date().toISOString().split('T')[0]

    // 获取今日所有任务
    const {data: allTasks, error: allError} = await supabase
      .from('tasks')
      .select('*')
      .eq('employee_id', employeeId)
      .lte('due_date', today)

    if (allError) throw allError

    const tasks = (allTasks || []) as Task[]

    // 统计
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length

    // 获取最近的3个待处理任务
    const recentTasks = tasks
      .filter((t) => t.status === 'pending' || t.status === 'in_progress')
      .sort((a, b) => {
        // 先按优先级排序
        const priorityOrder = {high: 0, medium: 1, low: 2}
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff

        // 再按截止日期排序
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })
      .slice(0, 3)

    return {
      total,
      completed,
      pending,
      tasks: recentTasks
    }
  } catch (error) {
    console.error('获取今日任务摘要失败:', error)
    throw error
  }
}

/**
 * 获取任务统计
 * @param employeeId 员工ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 任务统计
 */
export async function getTaskStats(employeeId: string, startDate?: string, endDate?: string): Promise<TaskStats> {
  try {
    let query = supabase.from('tasks').select('*').eq('employee_id', employeeId)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const {data, error} = await query

    if (error) throw error

    const tasks = (data || []) as Task[]

    // 统计各状态任务数
    const total = tasks.length
    const pending = tasks.filter((t) => t.status === 'pending').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const cancelled = tasks.filter((t) => t.status === 'cancelled').length

    // 计算完成率
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    // 统计逾期任务
    const today = new Date().toISOString().split('T')[0]
    const overdue = tasks.filter(
      (t) => t.due_date && t.due_date < today && (t.status === 'pending' || t.status === 'in_progress')
    ).length

    return {
      total,
      pending,
      in_progress: inProgress,
      completed,
      cancelled,
      completion_rate: Math.round(completionRate),
      overdue
    }
  } catch (error) {
    console.error('获取任务统计失败:', error)
    throw error
  }
}

/**
 * 标记任务为完成
 * @param taskId 任务ID
 * @returns 更新后的任务
 */
export async function completeTask(taskId: string): Promise<Task> {
  return updateTaskStatus(taskId, 'completed')
}

/**
 * 标记任务为进行中
 * @param taskId 任务ID
 * @returns 更新后的任务
 */
export async function startTask(taskId: string): Promise<Task> {
  return updateTaskStatus(taskId, 'in_progress')
}

/**
 * 取消任务
 * @param taskId 任务ID
 * @returns 更新后的任务
 */
export async function cancelTask(taskId: string): Promise<Task> {
  return updateTaskStatus(taskId, 'cancelled')
}
