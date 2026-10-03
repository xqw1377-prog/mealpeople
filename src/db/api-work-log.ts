// 工作日志API

import {supabase} from '@/client/supabase'
import type {CreateWorkLogInput, UpdateWorkLogInput, WorkLog, WorkLogWithEmployee} from './types-schedule'

/**
 * 获取所有工作日志
 */
export async function getAllWorkLogs(): Promise<WorkLog[]> {
  const {data, error} = await supabase.from('work_logs').select('*').order('log_date', {ascending: false})

  if (error) {
    console.error('获取工作日志失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据排班记录ID获取工作日志
 */
export async function getWorkLogsByScheduleRecord(scheduleRecordId: string): Promise<WorkLog[]> {
  const {data, error} = await supabase
    .from('work_logs')
    .select('*')
    .eq('schedule_record_id', scheduleRecordId)
    .order('log_date', {ascending: false})

  if (error) {
    console.error('获取工作日志失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据员工ID获取工作日志
 */
export async function getWorkLogsByEmployee(employeeId: string): Promise<WorkLog[]> {
  const {data, error} = await supabase
    .from('work_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .order('log_date', {ascending: false})

  if (error) {
    console.error('获取员工工作日志失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据日期获取工作日志
 */
export async function getWorkLogsByDate(date: string): Promise<WorkLog[]> {
  const {data, error} = await supabase
    .from('work_logs')
    .select('*')
    .eq('log_date', date)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取工作日志失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据日期范围获取工作日志
 */
export async function getWorkLogsByDateRange(startDate: string, endDate: string): Promise<WorkLog[]> {
  const {data, error} = await supabase
    .from('work_logs')
    .select('*')
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', {ascending: false})

  if (error) {
    console.error('获取工作日志失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取工作日志
 */
export async function getWorkLogById(id: string): Promise<WorkLog | null> {
  const {data, error} = await supabase.from('work_logs').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取工作日志失败:', error)
    return null
  }

  return data
}

/**
 * 获取工作日志详情（包含员工信息）
 */
export async function getWorkLogWithEmployee(id: string): Promise<WorkLogWithEmployee | null> {
  const log = await getWorkLogById(id)
  if (!log) return null

  // 获取员工信息
  const {data: employeeData} = await supabase
    .from('employees')
    .select('name, avatar, department, position')
    .eq('id', log.employee_id)
    .maybeSingle()

  return {
    ...log,
    employee_name: employeeData?.name || '未知员工',
    employee_avatar: employeeData?.avatar,
    department: employeeData?.department,
    position: employeeData?.position
  }
}

/**
 * 获取所有工作日志（包含员工信息）
 */
export async function getAllWorkLogsWithEmployee(): Promise<WorkLogWithEmployee[]> {
  const {data, error} = await supabase
    .from('work_logs')
    .select(
      `
      *,
      employees:employee_id (
        name,
        avatar,
        department,
        position
      )
    `
    )
    .order('log_date', {ascending: false})

  if (error) {
    console.error('获取工作日志失败:', error)
    return []
  }

  if (!Array.isArray(data)) return []

  return data.map((item) => ({
    ...item,
    employee_name: item.employees?.name || '未知员工',
    employee_avatar: item.employees?.avatar,
    department: item.employees?.department,
    position: item.employees?.position
  }))
}

/**
 * 创建工作日志
 */
export async function createWorkLog(input: CreateWorkLogInput): Promise<WorkLog | null> {
  const {data, error} = await supabase
    .from('work_logs')
    .insert({
      schedule_record_id: input.schedule_record_id,
      employee_id: input.employee_id,
      log_date: input.log_date,
      work_content: input.work_content,
      achievements: input.achievements,
      issues: input.issues,
      suggestions: input.suggestions,
      quality_score: input.quality_score,
      efficiency_score: input.efficiency_score,
      attitude_score: input.attitude_score,
      images: input.images
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建工作日志失败:', error)
    return null
  }

  return data
}

/**
 * 更新工作日志
 */
export async function updateWorkLog(id: string, input: UpdateWorkLogInput): Promise<WorkLog | null> {
  const {data, error} = await supabase.from('work_logs').update(input).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新工作日志失败:', error)
    return null
  }

  return data
}

/**
 * 删除工作日志
 */
export async function deleteWorkLog(id: string): Promise<boolean> {
  const {error} = await supabase.from('work_logs').delete().eq('id', id)

  if (error) {
    console.error('删除工作日志失败:', error)
    return false
  }

  return true
}

/**
 * 获取优秀工作日志（总分>=13）
 */
export async function getExcellentWorkLogs(): Promise<WorkLog[]> {
  const {data, error} = await supabase
    .from('work_logs')
    .select('*')
    .gte('total_score', 13)
    .order('total_score', {ascending: false})
    .order('log_date', {ascending: false})

  if (error) {
    console.error('获取优秀工作日志失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取员工的优秀工作日志数量
 */
export async function getEmployeeExcellentLogCount(employeeId: string): Promise<number> {
  const {count, error} = await supabase
    .from('work_logs')
    .select('id', {count: 'exact', head: true})
    .eq('employee_id', employeeId)
    .gte('total_score', 13)

  if (error) {
    console.error('获取优秀工作日志数量失败:', error)
    return 0
  }

  return count || 0
}
