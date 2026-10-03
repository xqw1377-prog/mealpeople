// 离职管理API接口

import {supabase} from '@/client/supabase'
import type {
  CreateOffboardingApplicationInput,
  OffboardingApplication,
  OffboardingData,
  OffboardingHandover,
  OffboardingInterview,
  OffboardingStatistics,
  OffboardingTask
} from './types-offboarding'

// ==================== 离职申请 ====================

/**
 * 获取员工的离职申请
 */
export async function getEmployeeOffboardingApplication(employeeId: string): Promise<OffboardingApplication | null> {
  const {data, error} = await supabase
    .from('offboarding_applications')
    .select('*')
    .eq('employee_id', employeeId)
    .order('application_date', {ascending: false})
    .maybeSingle()

  if (error) {
    console.error('获取离职申请失败:', error)
    return null
  }

  return data
}

/**
 * 创建离职申请
 */
export async function createOffboardingApplication(
  input: CreateOffboardingApplicationInput
): Promise<OffboardingApplication | null> {
  const {data, error} = await supabase
    .from('offboarding_applications')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      expected_leave_date: input.expected_leave_date,
      resignation_type: input.resignation_type,
      resignation_reason: input.resignation_reason,
      detailed_reason: input.detailed_reason || null,
      status: 'pending'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建离职申请失败:', error)
    return null
  }

  return data
}

// ==================== 离职任务 ====================

/**
 * 获取离职申请的任务列表
 */
export async function getOffboardingTasks(applicationId: string): Promise<OffboardingTask[]> {
  const {data, error} = await supabase
    .from('offboarding_tasks')
    .select('*')
    .eq('application_id', applicationId)
    .order('due_date', {ascending: true})

  if (error) {
    console.error('获取离职任务失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 离职交接 ====================

/**
 * 获取离职申请的交接列表
 */
export async function getOffboardingHandovers(applicationId: string): Promise<OffboardingHandover[]> {
  const {data, error} = await supabase
    .from('offboarding_handovers')
    .select('*')
    .eq('application_id', applicationId)
    .order('handover_date', {ascending: true})

  if (error) {
    console.error('获取离职交接失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 离职面谈 ====================

/**
 * 获取离职面谈
 */
export async function getOffboardingInterview(applicationId: string): Promise<OffboardingInterview | null> {
  const {data, error} = await supabase
    .from('offboarding_interviews')
    .select('*')
    .eq('application_id', applicationId)
    .maybeSingle()

  if (error) {
    console.error('获取离职面谈失败:', error)
    return null
  }

  return data
}

// ==================== 统计数据 ====================

/**
 * 获取离职统计
 */
export async function getOffboardingStatistics(
  applicationId: string,
  expectedLeaveDate: string
): Promise<OffboardingStatistics> {
  const tasks = await getOffboardingTasks(applicationId)
  const handovers = await getOffboardingHandovers(applicationId)

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length

  const totalHandovers = handovers.length
  const completedHandovers = handovers.filter((h) => h.status === 'completed').length
  const pendingHandovers = handovers.filter((h) => h.status === 'pending').length

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // 计算距离离职天数
  const leaveDate = new Date(expectedLeaveDate)
  const now = new Date()
  const daysUntilLeave = Math.ceil((leaveDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    pending_tasks: pendingTasks,
    total_handovers: totalHandovers,
    completed_handovers: completedHandovers,
    pending_handovers: pendingHandovers,
    completion_rate: completionRate,
    days_until_leave: daysUntilLeave
  }
}

/**
 * 获取员工离职数据
 */
export async function getEmployeeOffboardingData(employeeId: string): Promise<OffboardingData | null> {
  try {
    // 获取离职申请
    const application = await getEmployeeOffboardingApplication(employeeId)

    if (!application) {
      return {
        application: null,
        tasks: [],
        handovers: [],
        interview: null,
        statistics: {
          total_tasks: 0,
          completed_tasks: 0,
          pending_tasks: 0,
          total_handovers: 0,
          completed_handovers: 0,
          pending_handovers: 0,
          completion_rate: 0,
          days_until_leave: 0
        }
      }
    }

    // 获取任务列表
    const tasks = await getOffboardingTasks(application.id)

    // 获取交接列表
    const handovers = await getOffboardingHandovers(application.id)

    // 获取离职面谈
    const interview = await getOffboardingInterview(application.id)

    // 获取统计数据
    const statistics = await getOffboardingStatistics(application.id, application.expected_leave_date)

    return {
      application,
      tasks,
      handovers,
      interview,
      statistics
    }
  } catch (error) {
    console.error('获取离职数据失败:', error)
    return null
  }
}
