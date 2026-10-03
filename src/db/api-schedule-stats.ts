// 排班统计API

import {supabase} from '@/client/supabase'
import type {EmployeeScheduleStats, EmployeeWorkLogRanking, WorkLogStats, WorkScheduleStats} from './types-schedule'

/**
 * 获取排班统计数据
 */
export async function getWorkScheduleStats(): Promise<WorkScheduleStats> {
  const {data, error} = await supabase.from('work_schedule_records').select('status')

  if (error) {
    console.error('获取排班统计失败:', error)
    return {
      total_schedules: 0,
      completed_schedules: 0,
      completion_rate: 0,
      pending_schedules: 0,
      in_progress_schedules: 0,
      cancelled_schedules: 0
    }
  }

  const records = Array.isArray(data) ? data : []
  const totalSchedules = records.length
  const completedSchedules = records.filter((r) => r.status === 'completed').length
  const pendingSchedules = records.filter((r) => r.status === 'pending').length
  const inProgressSchedules = records.filter((r) => r.status === 'in_progress').length
  const cancelledSchedules = records.filter((r) => r.status === 'cancelled').length
  const completionRate = totalSchedules > 0 ? (completedSchedules / totalSchedules) * 100 : 0

  return {
    total_schedules: totalSchedules,
    completed_schedules: completedSchedules,
    completion_rate: Number(completionRate.toFixed(2)),
    pending_schedules: pendingSchedules,
    in_progress_schedules: inProgressSchedules,
    cancelled_schedules: cancelledSchedules
  }
}

/**
 * 根据员工ID获取排班统计
 */
export async function getWorkScheduleStatsByEmployee(employeeId: string): Promise<WorkScheduleStats> {
  const {data, error} = await supabase.from('work_schedule_records').select('status').eq('employee_id', employeeId)

  if (error) {
    console.error('获取员工排班统计失败:', error)
    return {
      total_schedules: 0,
      completed_schedules: 0,
      completion_rate: 0,
      pending_schedules: 0,
      in_progress_schedules: 0,
      cancelled_schedules: 0
    }
  }

  const records = Array.isArray(data) ? data : []
  const totalSchedules = records.length
  const completedSchedules = records.filter((r) => r.status === 'completed').length
  const pendingSchedules = records.filter((r) => r.status === 'pending').length
  const inProgressSchedules = records.filter((r) => r.status === 'in_progress').length
  const cancelledSchedules = records.filter((r) => r.status === 'cancelled').length
  const completionRate = totalSchedules > 0 ? (completedSchedules / totalSchedules) * 100 : 0

  return {
    total_schedules: totalSchedules,
    completed_schedules: completedSchedules,
    completion_rate: Number(completionRate.toFixed(2)),
    pending_schedules: pendingSchedules,
    in_progress_schedules: inProgressSchedules,
    cancelled_schedules: cancelledSchedules
  }
}

/**
 * 获取工作日志统计数据
 */
export async function getWorkLogStats(): Promise<WorkLogStats> {
  const {data, error} = await supabase
    .from('work_logs')
    .select('quality_score, efficiency_score, attitude_score, total_score')

  if (error) {
    console.error('获取工作日志统计失败:', error)
    return {
      total_logs: 0,
      average_quality_score: 0,
      average_efficiency_score: 0,
      average_attitude_score: 0,
      average_total_score: 0,
      excellent_logs: 0,
      excellent_rate: 0
    }
  }

  const logs = Array.isArray(data) ? data : []
  const totalLogs = logs.length

  if (totalLogs === 0) {
    return {
      total_logs: 0,
      average_quality_score: 0,
      average_efficiency_score: 0,
      average_attitude_score: 0,
      average_total_score: 0,
      excellent_logs: 0,
      excellent_rate: 0
    }
  }

  const qualitySum = logs.reduce((sum, log) => sum + (log.quality_score || 0), 0)
  const efficiencySum = logs.reduce((sum, log) => sum + (log.efficiency_score || 0), 0)
  const attitudeSum = logs.reduce((sum, log) => sum + (log.attitude_score || 0), 0)
  const totalSum = logs.reduce((sum, log) => sum + (log.total_score || 0), 0)
  const excellentLogs = logs.filter((log) => (log.total_score || 0) >= 13).length

  return {
    total_logs: totalLogs,
    average_quality_score: Number((qualitySum / totalLogs).toFixed(2)),
    average_efficiency_score: Number((efficiencySum / totalLogs).toFixed(2)),
    average_attitude_score: Number((attitudeSum / totalLogs).toFixed(2)),
    average_total_score: Number((totalSum / totalLogs).toFixed(2)),
    excellent_logs: excellentLogs,
    excellent_rate: Number(((excellentLogs / totalLogs) * 100).toFixed(2))
  }
}

/**
 * 根据员工ID获取工作日志统计
 */
export async function getWorkLogStatsByEmployee(employeeId: string): Promise<WorkLogStats> {
  const {data, error} = await supabase
    .from('work_logs')
    .select('quality_score, efficiency_score, attitude_score, total_score')
    .eq('employee_id', employeeId)

  if (error) {
    console.error('获取员工工作日志统计失败:', error)
    return {
      total_logs: 0,
      average_quality_score: 0,
      average_efficiency_score: 0,
      average_attitude_score: 0,
      average_total_score: 0,
      excellent_logs: 0,
      excellent_rate: 0
    }
  }

  const logs = Array.isArray(data) ? data : []
  const totalLogs = logs.length

  if (totalLogs === 0) {
    return {
      total_logs: 0,
      average_quality_score: 0,
      average_efficiency_score: 0,
      average_attitude_score: 0,
      average_total_score: 0,
      excellent_logs: 0,
      excellent_rate: 0
    }
  }

  const qualitySum = logs.reduce((sum, log) => sum + (log.quality_score || 0), 0)
  const efficiencySum = logs.reduce((sum, log) => sum + (log.efficiency_score || 0), 0)
  const attitudeSum = logs.reduce((sum, log) => sum + (log.attitude_score || 0), 0)
  const totalSum = logs.reduce((sum, log) => sum + (log.total_score || 0), 0)
  const excellentLogs = logs.filter((log) => (log.total_score || 0) >= 13).length

  return {
    total_logs: totalLogs,
    average_quality_score: Number((qualitySum / totalLogs).toFixed(2)),
    average_efficiency_score: Number((efficiencySum / totalLogs).toFixed(2)),
    average_attitude_score: Number((attitudeSum / totalLogs).toFixed(2)),
    average_total_score: Number((totalSum / totalLogs).toFixed(2)),
    excellent_logs: excellentLogs,
    excellent_rate: Number(((excellentLogs / totalLogs) * 100).toFixed(2))
  }
}

/**
 * 获取员工排班统计排行榜
 */
export async function getEmployeeScheduleStatsRanking(): Promise<EmployeeScheduleStats[]> {
  // 获取所有员工
  const {data: employees, error: employeesError} = await supabase.from('employees').select('id, name')

  if (employeesError || !employees) {
    console.error('获取员工列表失败:', employeesError)
    return []
  }

  // 获取所有排班记录
  const {data: records, error: recordsError} = await supabase
    .from('work_schedule_records')
    .select('employee_id, status')

  if (recordsError) {
    console.error('获取排班记录失败:', recordsError)
    return []
  }

  const recordsList = Array.isArray(records) ? records : []

  // 获取所有工作日志
  const {data: logs, error: logsError} = await supabase.from('work_logs').select('employee_id, total_score')

  if (logsError) {
    console.error('获取工作日志失败:', logsError)
    return []
  }

  const logsList = Array.isArray(logs) ? logs : []

  // 计算每个员工的统计数据
  const stats: EmployeeScheduleStats[] = employees.map((employee) => {
    const employeeRecords = recordsList.filter((r) => r.employee_id === employee.id)
    const employeeLogs = logsList.filter((l) => l.employee_id === employee.id)

    const totalSchedules = employeeRecords.length
    const completedSchedules = employeeRecords.filter((r) => r.status === 'completed').length
    const completionRate = totalSchedules > 0 ? (completedSchedules / totalSchedules) * 100 : 0

    const totalScore = employeeLogs.reduce((sum, log) => sum + (log.total_score || 0), 0)
    const averageScore = employeeLogs.length > 0 ? totalScore / employeeLogs.length : 0
    const excellentCount = employeeLogs.filter((log) => (log.total_score || 0) >= 13).length

    return {
      employee_id: employee.id,
      employee_name: employee.name,
      total_schedules: totalSchedules,
      completed_schedules: completedSchedules,
      completion_rate: Number(completionRate.toFixed(2)),
      average_score: Number(averageScore.toFixed(2)),
      excellent_count: excellentCount
    }
  })

  // 按平均分数降序排序
  return stats.sort((a, b) => b.average_score - a.average_score)
}

/**
 * 根据日期范围获取排班统计
 */
export async function getWorkScheduleStatsByDateRange(startDate: string, endDate: string): Promise<WorkScheduleStats> {
  const {data, error} = await supabase
    .from('work_schedule_records')
    .select('status')
    .gte('schedule_date', startDate)
    .lte('schedule_date', endDate)

  if (error) {
    console.error('获取排班统计失败:', error)
    return {
      total_schedules: 0,
      completed_schedules: 0,
      completion_rate: 0,
      pending_schedules: 0,
      in_progress_schedules: 0,
      cancelled_schedules: 0
    }
  }

  const records = Array.isArray(data) ? data : []
  const totalSchedules = records.length
  const completedSchedules = records.filter((r) => r.status === 'completed').length
  const pendingSchedules = records.filter((r) => r.status === 'pending').length
  const inProgressSchedules = records.filter((r) => r.status === 'in_progress').length
  const cancelledSchedules = records.filter((r) => r.status === 'cancelled').length
  const completionRate = totalSchedules > 0 ? (completedSchedules / totalSchedules) * 100 : 0

  return {
    total_schedules: totalSchedules,
    completed_schedules: completedSchedules,
    completion_rate: Number(completionRate.toFixed(2)),
    pending_schedules: pendingSchedules,
    in_progress_schedules: inProgressSchedules,
    cancelled_schedules: cancelledSchedules
  }
}

/**
 * 根据日期范围获取工作日志统计
 */
export async function getWorkLogStatsByDateRange(startDate: string, endDate: string): Promise<WorkLogStats> {
  const {data, error} = await supabase
    .from('work_logs')
    .select('quality_score, efficiency_score, attitude_score, total_score')
    .gte('log_date', startDate)
    .lte('log_date', endDate)

  if (error) {
    console.error('获取工作日志统计失败:', error)
    return {
      total_logs: 0,
      average_quality_score: 0,
      average_efficiency_score: 0,
      average_attitude_score: 0,
      average_total_score: 0,
      excellent_logs: 0,
      excellent_rate: 0
    }
  }

  const logs = Array.isArray(data) ? data : []
  const totalLogs = logs.length

  if (totalLogs === 0) {
    return {
      total_logs: 0,
      average_quality_score: 0,
      average_efficiency_score: 0,
      average_attitude_score: 0,
      average_total_score: 0,
      excellent_logs: 0,
      excellent_rate: 0
    }
  }

  const qualitySum = logs.reduce((sum, log) => sum + (log.quality_score || 0), 0)
  const efficiencySum = logs.reduce((sum, log) => sum + (log.efficiency_score || 0), 0)
  const attitudeSum = logs.reduce((sum, log) => sum + (log.attitude_score || 0), 0)
  const totalSum = logs.reduce((sum, log) => sum + (log.total_score || 0), 0)
  const excellentLogs = logs.filter((log) => (log.total_score || 0) >= 13).length

  return {
    total_logs: totalLogs,
    average_quality_score: Number((qualitySum / totalLogs).toFixed(2)),
    average_efficiency_score: Number((efficiencySum / totalLogs).toFixed(2)),
    average_attitude_score: Number((attitudeSum / totalLogs).toFixed(2)),
    average_total_score: Number((totalSum / totalLogs).toFixed(2)),
    excellent_logs: excellentLogs,
    excellent_rate: Number(((excellentLogs / totalLogs) * 100).toFixed(2))
  }
}

/**
 * 获取员工工作日志排行
 */
export async function getEmployeeWorkLogRanking(limit = 20): Promise<EmployeeWorkLogRanking[]> {
  const {data, error} = await supabase
    .from('work_logs')
    .select('employee_id, quality_score, efficiency_score, attitude_score, total_score')

  if (error) {
    console.error('获取员工排行失败:', error)
    return []
  }

  const logs = Array.isArray(data) ? data : []

  // 按员工分组统计
  const employeeMap = new Map<string, {total_logs: number; total_score: number; excellent_logs: number}>()

  for (const log of logs) {
    const employeeId = log.employee_id
    const existing = employeeMap.get(employeeId) || {total_logs: 0, total_score: 0, excellent_logs: 0}

    existing.total_logs++
    existing.total_score += log.total_score || 0
    if ((log.total_score || 0) >= 13) {
      existing.excellent_logs++
    }

    employeeMap.set(employeeId, existing)
  }

  // 转换为数组并排序
  const ranking: EmployeeWorkLogRanking[] = Array.from(employeeMap.entries()).map(([employeeId, stats]) => ({
    employee_id: employeeId,
    total_logs: stats.total_logs,
    average_score: Number((stats.total_score / stats.total_logs).toFixed(2)),
    excellent_logs: stats.excellent_logs
  }))

  // 按优秀日志数降序排序，再按平均分降序
  ranking.sort((a, b) => {
    if (b.excellent_logs !== a.excellent_logs) {
      return b.excellent_logs - a.excellent_logs
    }
    return b.average_score - a.average_score
  })

  return ranking.slice(0, limit)
}
