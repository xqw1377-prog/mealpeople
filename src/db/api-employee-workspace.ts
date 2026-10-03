/**
 * 员工工作台 API
 */

import {supabase} from '@/client/supabase'
import {getTodayTasksSummary} from './api-task'
import type {
  EmployeeWorkInfo,
  GrowthData,
  MonthlyIncome,
  TodaySchedule,
  WorkAttendance,
  WorkspaceStats
} from './types-employee-workspace'

/**
 * 获取员工工作信息
 * @param employeeId 员工ID
 * @returns 员工工作信息
 */
export async function getEmployeeWorkInfo(employeeId: string): Promise<EmployeeWorkInfo | null> {
  try {
    const {data, error} = await supabase
      .from('employee_work_info')
      .select('*')
      .eq('employee_id', employeeId)
      .maybeSingle()

    if (error) throw error

    return data as EmployeeWorkInfo | null
  } catch (error) {
    console.error('获取员工工作信息失败:', error)
    throw error
  }
}

/**
 * 创建或更新员工工作信息
 * @param workInfo 工作信息
 * @returns 创建或更新的工作信息
 */
export async function upsertEmployeeWorkInfo(
  workInfo: Partial<EmployeeWorkInfo> & {employee_id: string; tenant_id: string}
): Promise<EmployeeWorkInfo> {
  try {
    const {data, error} = await supabase
      .from('employee_work_info')
      .upsert(workInfo, {onConflict: 'employee_id'})
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('创建或更新员工工作信息失败')

    return data as EmployeeWorkInfo
  } catch (error) {
    console.error('创建或更新员工工作信息失败:', error)
    throw error
  }
}

/**
 * 获取今日排班
 * @param employeeId 员工ID
 * @returns 今日排班信息
 */
export async function getTodaySchedule(employeeId: string): Promise<TodaySchedule | null> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const {data, error} = await supabase
      .from('schedule_results')
      .select(
        `
        date,
        hours,
        is_rest_day,
        shift:work_shifts!inner(name, start_time, end_time),
        position:positions!inner(name),
        store:stores!inner(name)
      `
      )
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle()

    if (error) throw error

    if (!data) return null

    // 类型断言，因为 Supabase 的类型推断不够准确
    const scheduleData = data as any

    return {
      date: scheduleData.date,
      shift_name: scheduleData.shift?.name || '未排班',
      start_time: scheduleData.shift?.start_time || '',
      end_time: scheduleData.shift?.end_time || '',
      position: scheduleData.position?.name || '未指定',
      store_name: scheduleData.store?.name || '未指定',
      hours: scheduleData.hours || 0,
      is_rest_day: scheduleData.is_rest_day || false
    } as TodaySchedule
  } catch (error) {
    console.error('获取今日排班失败:', error)
    throw error
  }
}

/**
 * 获取本月收入统计
 * @param employeeId 员工ID
 * @param month 月份 (YYYY-MM)
 * @returns 本月收入统计
 */
export async function getMonthlyIncome(employeeId: string, month: string): Promise<MonthlyIncome> {
  try {
    const monthStart = `${month}-01`
    const monthEnd = `${month}-31`

    const {data, error} = await supabase
      .from('schedule_results')
      .select('salary')
      .eq('employee_id', employeeId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .eq('is_rest_day', false)

    if (error) throw error

    const totalSalary = data?.reduce((sum, item) => sum + (item.salary || 0), 0) || 0
    const workDays = data?.length || 0
    const averageSalary = workDays > 0 ? totalSalary / workDays : 0

    return {
      total: totalSalary,
      days: workDays,
      average: averageSalary
    }
  } catch (error) {
    console.error('获取本月收入失败:', error)
    throw error
  }
}

/**
 * 获取成长数据
 * @param employeeId 员工ID
 * @returns 成长数据
 */
export async function getGrowthData(employeeId: string): Promise<GrowthData> {
  try {
    const workInfo = await getEmployeeWorkInfo(employeeId)

    const skillLevel = workInfo?.skill_level || 0
    const serviceScore = workInfo?.service_score || 0

    // TODO: 计算本月进步（需要历史数据）
    const progress = 0

    // 计算距离下一等级的分数
    const nextLevel = Math.ceil(skillLevel / 10) * 10
    const nextLevelGap = nextLevel - skillLevel

    return {
      skill_level: skillLevel,
      service_score: serviceScore,
      progress,
      next_level: nextLevelGap
    }
  } catch (error) {
    console.error('获取成长数据失败:', error)
    throw error
  }
}

/**
 * 获取工作台统计数据
 * @param employeeId 员工ID
 * @returns 工作台统计数据
 */
export async function getWorkspaceStats(employeeId: string): Promise<WorkspaceStats> {
  try {
    const today = new Date()
    const month = today.toISOString().substring(0, 7)

    const [todaySchedule, monthlyIncome, growthData, todayTasks] = await Promise.all([
      getTodaySchedule(employeeId),
      getMonthlyIncome(employeeId, month),
      getGrowthData(employeeId),
      getTodayTasksSummary(employeeId)
    ])

    return {
      today_schedule: todaySchedule,
      monthly_income: monthlyIncome,
      growth_data: growthData,
      pending_tasks: todayTasks.pending,
      today_tasks: todayTasks
    }
  } catch (error) {
    console.error('获取工作台统计数据失败:', error)
    throw error
  }
}

/**
 * 获取员工考勤记录
 * @param employeeId 员工ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 考勤记录列表
 */
export async function getWorkAttendance(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<WorkAttendance[]> {
  try {
    const {data, error} = await supabase
      .from('work_attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', {ascending: false})

    if (error) throw error

    return (data || []) as WorkAttendance[]
  } catch (error) {
    console.error('获取考勤记录失败:', error)
    throw error
  }
}

/**
 * 创建考勤记录
 * @param attendance 考勤记录
 * @returns 创建的考勤记录
 */
export async function createWorkAttendance(
  attendance: Omit<WorkAttendance, 'id' | 'created_at' | 'updated_at'>
): Promise<WorkAttendance> {
  try {
    const {data, error} = await supabase.from('work_attendance').insert(attendance).select().single()

    if (error) throw error
    if (!data) throw new Error('创建考勤记录失败')

    return data as WorkAttendance
  } catch (error) {
    console.error('创建考勤记录失败:', error)
    throw error
  }
}

/**
 * 更新考勤记录
 * @param id 考勤记录ID
 * @param updates 更新内容
 * @returns 更新后的考勤记录
 */
export async function updateWorkAttendance(id: string, updates: Partial<WorkAttendance>): Promise<WorkAttendance> {
  try {
    const {data, error} = await supabase.from('work_attendance').update(updates).eq('id', id).select().single()

    if (error) throw error
    if (!data) throw new Error('更新考勤记录失败')

    return data as WorkAttendance
  } catch (error) {
    console.error('更新考勤记录失败:', error)
    throw error
  }
}
