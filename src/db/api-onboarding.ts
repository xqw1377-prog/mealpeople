// 入职管理API接口

import {supabase} from '@/client/supabase'
import type {
  OnboardingApplication,
  OnboardingData,
  OnboardingDocument,
  OnboardingHistory,
  OnboardingStatistics,
  OnboardingTask
} from './types-onboarding'

// ==================== 入职申请 ====================

/**
 * 获取员工的入职申请
 */
export async function getEmployeeOnboardingApplication(employeeId: string): Promise<OnboardingApplication | null> {
  const {data, error} = await supabase
    .from('onboarding_applications')
    .select('*')
    .eq('employee_id', employeeId)
    .order('application_date', {ascending: false})
    .maybeSingle()

  if (error) {
    console.error('获取入职申请失败:', error)
    return null
  }

  return data
}

// ==================== 入职任务 ====================

/**
 * 获取入职申请的任务列表
 */
export async function getOnboardingTasks(applicationId: string): Promise<OnboardingTask[]> {
  const {data, error} = await supabase
    .from('onboarding_tasks')
    .select('*')
    .eq('application_id', applicationId)
    .order('due_date', {ascending: true})

  if (error) {
    console.error('获取入职任务失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 完成入职任务
 */
export async function completeOnboardingTask(taskId: string, employeeId: string): Promise<boolean> {
  const {error} = await supabase
    .from('onboarding_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: employeeId
    })
    .eq('id', taskId)

  if (error) {
    console.error('完成入职任务失败:', error)
    return false
  }

  return true
}

// ==================== 入职资料 ====================

/**
 * 获取入职申请的资料列表
 */
export async function getOnboardingDocuments(applicationId: string): Promise<OnboardingDocument[]> {
  const {data, error} = await supabase
    .from('onboarding_documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('is_required', {ascending: false})
    .order('document_type', {ascending: true})

  if (error) {
    console.error('获取入职资料失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 入职历史 ====================

/**
 * 获取员工的入职历史
 */
export async function getEmployeeOnboardingHistory(employeeId: string): Promise<OnboardingHistory | null> {
  const {data, error} = await supabase
    .from('onboarding_history')
    .select('*')
    .eq('employee_id', employeeId)
    .order('onboarding_date', {ascending: false})
    .maybeSingle()

  if (error) {
    console.error('获取入职历史失败:', error)
    return null
  }

  return data
}

// ==================== 统计数据 ====================

/**
 * 获取入职统计
 */
export async function getOnboardingStatistics(applicationId: string, startDate: string): Promise<OnboardingStatistics> {
  const tasks = await getOnboardingTasks(applicationId)
  const documents = await getOnboardingDocuments(applicationId)

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length

  const totalDocuments = documents.length
  const uploadedDocuments = documents.filter((d) => d.status === 'uploaded' || d.status === 'verified').length
  const verifiedDocuments = documents.filter((d) => d.status === 'verified').length

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // 计算入职天数
  const start = new Date(startDate)
  const now = new Date()
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    pending_tasks: pendingTasks,
    total_documents: totalDocuments,
    uploaded_documents: uploadedDocuments,
    verified_documents: verifiedDocuments,
    completion_rate: completionRate,
    days_since_start: daysSinceStart
  }
}

/**
 * 获取员工入职数据
 */
export async function getEmployeeOnboardingData(employeeId: string): Promise<OnboardingData | null> {
  try {
    // 获取入职申请
    const application = await getEmployeeOnboardingApplication(employeeId)

    if (!application) {
      return {
        application: null,
        tasks: [],
        documents: [],
        history: null,
        statistics: {
          total_tasks: 0,
          completed_tasks: 0,
          pending_tasks: 0,
          total_documents: 0,
          uploaded_documents: 0,
          verified_documents: 0,
          completion_rate: 0,
          days_since_start: 0
        }
      }
    }

    // 获取任务列表
    const tasks = await getOnboardingTasks(application.id)

    // 获取资料列表
    const documents = await getOnboardingDocuments(application.id)

    // 获取入职历史
    const history = await getEmployeeOnboardingHistory(employeeId)

    // 获取统计数据
    const statistics = await getOnboardingStatistics(application.id, application.expected_start_date)

    return {
      application,
      tasks,
      documents,
      history,
      statistics
    }
  } catch (error) {
    console.error('获取入职数据失败:', error)
    return null
  }
}

/**
 * 计算任务完成率
 */
export function calculateTaskCompletionRate(tasks: OnboardingTask[]): number {
  if (tasks.length === 0) return 0
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  return Math.round((completedTasks / tasks.length) * 100)
}

/**
 * 计算资料上传率
 */
export function calculateDocumentUploadRate(documents: OnboardingDocument[]): number {
  if (documents.length === 0) return 0
  const uploadedDocuments = documents.filter((d) => d.status === 'uploaded' || d.status === 'verified').length
  return Math.round((uploadedDocuments / documents.length) * 100)
}

/**
 * 判断任务是否逾期
 */
export function isTaskOverdue(task: OnboardingTask): boolean {
  if (!task.due_date || task.status === 'completed') return false
  const dueDate = new Date(task.due_date)
  const now = new Date()
  return now > dueDate
}
