/**
 * 智能排班系统API
 * 实现排班日历的创建、查询、更新和智能生成功能
 */

import {supabase} from '@/client/supabase'
import type {
  CreateDailyScheduleDetailParams,
  CreateEmployeeScheduleDetailParams,
  CreateScheduleCalendarParams,
  DailyScheduleDetail,
  EmployeeMonthlySchedule,
  EmployeeScheduleDetail,
  ScheduleAdjustmentLog,
  ScheduleCalendar
} from './types-v2'

// ==================== 排班日历管理 ====================

/**
 * 创建月度排班日历
 */
export async function createScheduleCalendar(params: CreateScheduleCalendarParams): Promise<ScheduleCalendar | null> {
  const {data, error} = await supabase
    .from('schedule_calendar')
    .insert({
      tenant_id: params.tenant_id,
      store_id: params.store_id,
      calendar_month: params.calendar_month,
      revenue_calendar_id: params.revenue_calendar_id,
      generated_by: params.generated_by || 'manual',
      created_by: params.created_by,
      status: 'draft',
      total_work_hours: 0,
      total_staff_count: 0
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建排班日历失败:', error)
    return null
  }

  return data
}

/**
 * 获取租户的排班日历列表
 */
export async function getScheduleCalendarsByTenant(tenantId: string, storeId?: string): Promise<ScheduleCalendar[]> {
  let query = supabase
    .from('schedule_calendar')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('calendar_month', {ascending: false})

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取排班日历列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取排班日历
 */
export async function getScheduleCalendarById(calendarId: string): Promise<ScheduleCalendar | null> {
  const {data, error} = await supabase.from('schedule_calendar').select('*').eq('id', calendarId).maybeSingle()

  if (error) {
    console.error('获取排班日历失败:', error)
    return null
  }

  return data
}

/**
 * 更新排班日历
 */
export async function updateScheduleCalendar(calendarId: string, updates: Partial<ScheduleCalendar>): Promise<boolean> {
  const {error} = await supabase
    .from('schedule_calendar')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', calendarId)

  if (error) {
    console.error('更新排班日历失败:', error)
    return false
  }

  return true
}

/**
 * 确认排班日历
 */
export async function confirmScheduleCalendar(calendarId: string, userId: string): Promise<boolean> {
  const {error} = await supabase
    .from('schedule_calendar')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmed_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', calendarId)

  if (error) {
    console.error('确认排班日历失败:', error)
    return false
  }

  return true
}

/**
 * 发布排班日历
 */
export async function publishScheduleCalendar(calendarId: string, userId: string): Promise<boolean> {
  const {error} = await supabase
    .from('schedule_calendar')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      published_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', calendarId)

  if (error) {
    console.error('发布排班日历失败:', error)
    return false
  }

  // 发布后生成员工月度排班视图
  await generateEmployeeMonthlySchedules(calendarId)

  return true
}

/**
 * 删除排班日历
 */
export async function deleteScheduleCalendar(calendarId: string): Promise<boolean> {
  const {error} = await supabase.from('schedule_calendar').delete().eq('id', calendarId)

  if (error) {
    console.error('删除排班日历失败:', error)
    return false
  }

  return true
}

// ==================== 每日排班明细管理 ====================

/**
 * 批量创建每日排班明细
 */
export async function createDailyScheduleDetails(details: CreateDailyScheduleDetailParams[]): Promise<boolean> {
  const {error} = await supabase.from('daily_schedule_detail').insert(details)

  if (error) {
    console.error('批量创建每日排班明细失败:', error)
    return false
  }

  return true
}

/**
 * 获取排班日历的每日明细
 */
export async function getDailyScheduleDetails(calendarId: string): Promise<DailyScheduleDetail[]> {
  const {data, error} = await supabase
    .from('daily_schedule_detail')
    .select('*')
    .eq('calendar_id', calendarId)
    .order('schedule_date', {ascending: true})

  if (error) {
    console.error('获取每日排班明细失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新每日排班明细
 */
export async function updateDailyScheduleDetail(
  detailId: string,
  updates: Partial<DailyScheduleDetail>
): Promise<boolean> {
  const {error} = await supabase
    .from('daily_schedule_detail')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', detailId)

  if (error) {
    console.error('更新每日排班明细失败:', error)
    return false
  }

  return true
}

// ==================== 员工排班明细管理 ====================

/**
 * 批量创建员工排班明细
 */
export async function createEmployeeScheduleDetails(details: CreateEmployeeScheduleDetailParams[]): Promise<boolean> {
  const {error} = await supabase.from('employee_schedule_detail').insert(details)

  if (error) {
    console.error('批量创建员工排班明细失败:', error)
    return false
  }

  return true
}

/**
 * 获取每日排班的员工明细
 */
export async function getEmployeeScheduleDetails(dailyScheduleId: string): Promise<EmployeeScheduleDetail[]> {
  const {data, error} = await supabase
    .from('employee_schedule_detail')
    .select('*')
    .eq('daily_schedule_id', dailyScheduleId)
    .order('employee_id', {ascending: true})

  if (error) {
    console.error('获取员工排班明细失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取员工在某个排班日历中的所有排班
 */
export async function getEmployeeSchedulesByCalendar(
  calendarId: string,
  employeeId: string
): Promise<EmployeeScheduleDetail[]> {
  const {data, error} = await supabase
    .from('employee_schedule_detail')
    .select('*, daily_schedule_detail!inner(*)')
    .eq('daily_schedule_detail.calendar_id', calendarId)
    .eq('employee_id', employeeId)
    .order('schedule_date', {ascending: true})

  if (error) {
    console.error('获取员工排班失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新员工排班明细
 */
export async function updateEmployeeScheduleDetail(
  detailId: string,
  updates: Partial<EmployeeScheduleDetail>
): Promise<boolean> {
  const {error} = await supabase
    .from('employee_schedule_detail')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', detailId)

  if (error) {
    console.error('更新员工排班明细失败:', error)
    return false
  }

  return true
}

/**
 * 删除员工排班明细
 */
export async function deleteEmployeeScheduleDetail(detailId: string): Promise<boolean> {
  const {error} = await supabase.from('employee_schedule_detail').delete().eq('id', detailId)

  if (error) {
    console.error('删除员工排班明细失败:', error)
    return false
  }

  return true
}

// ==================== 排班调整记录 ====================

/**
 * 创建排班调整记录
 */
export async function createScheduleAdjustmentLog(params: {
  calendar_id: string
  daily_schedule_id?: string
  employee_schedule_id?: string
  adjustment_type: 'add' | 'modify' | 'delete' | 'swap'
  adjustment_scope?: string
  old_value?: any
  new_value?: any
  adjustment_reason: string
  adjusted_by?: string
}): Promise<boolean> {
  const {error} = await supabase.from('schedule_adjustment_log').insert({
    ...params,
    adjusted_at: new Date().toISOString()
  })

  if (error) {
    console.error('创建排班调整记录失败:', error)
    return false
  }

  return true
}

/**
 * 获取排班日历的调整记录
 */
export async function getScheduleAdjustmentLogs(calendarId: string): Promise<ScheduleAdjustmentLog[]> {
  const {data, error} = await supabase
    .from('schedule_adjustment_log')
    .select('*')
    .eq('calendar_id', calendarId)
    .order('adjusted_at', {ascending: false})

  if (error) {
    console.error('获取排班调整记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 员工月度排班视图 ====================

/**
 * 生成员工月度排班视图
 */
export async function generateEmployeeMonthlySchedules(calendarId: string): Promise<boolean> {
  try {
    // 1. 获取排班日历信息
    const calendar = await getScheduleCalendarById(calendarId)
    if (!calendar) {
      return false
    }

    // 2. 获取所有每日排班明细
    const dailyDetails = await getDailyScheduleDetails(calendarId)

    // 3. 获取所有员工排班明细
    const allEmployeeSchedules: EmployeeScheduleDetail[] = []
    for (const daily of dailyDetails) {
      const schedules = await getEmployeeScheduleDetails(daily.id)
      allEmployeeSchedules.push(...schedules)
    }

    // 4. 按员工分组
    const employeeScheduleMap = new Map<string, EmployeeScheduleDetail[]>()
    for (const schedule of allEmployeeSchedules) {
      if (!employeeScheduleMap.has(schedule.employee_id)) {
        employeeScheduleMap.set(schedule.employee_id, [])
      }
      employeeScheduleMap.get(schedule.employee_id)?.push(schedule)
    }

    // 5. 为每个员工生成月度排班视图
    for (const [employeeId, schedules] of employeeScheduleMap) {
      const workDays = schedules.filter((s) => s.shift_type !== 'rest').length
      const restDays = schedules.filter((s) => s.shift_type === 'rest').length
      const totalHours = schedules.reduce((sum, s) => sum + (s.work_hours || 0), 0)

      const scheduleData = schedules.map((s) => ({
        date: s.schedule_date,
        shift_type: s.shift_type,
        work_hours: s.work_hours,
        start_time: s.start_time,
        end_time: s.end_time,
        position: s.position,
        is_core_position: s.is_core_position,
        is_backup: s.is_backup
      }))

      // 插入或更新员工月度排班视图
      const {error} = await supabase.from('employee_monthly_schedule').upsert({
        tenant_id: calendar.tenant_id,
        store_id: calendar.store_id,
        employee_id: employeeId,
        calendar_month: calendar.calendar_month,
        schedule_calendar_id: calendarId,
        total_work_days: workDays,
        total_rest_days: restDays,
        total_work_hours: totalHours,
        schedule_data: scheduleData,
        updated_at: new Date().toISOString()
      })

      if (error) {
        console.error('生成员工月度排班视图失败:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('生成员工月度排班视图失败:', error)
    return false
  }
}

/**
 * 获取员工的月度排班视图
 */
export async function getEmployeeMonthlySchedule(
  employeeId: string,
  calendarMonth: string
): Promise<EmployeeMonthlySchedule | null> {
  const {data, error} = await supabase
    .from('employee_monthly_schedule')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('calendar_month', calendarMonth)
    .maybeSingle()

  if (error) {
    console.error('获取员工月度排班视图失败:', error)
    return null
  }

  return data
}

/**
 * 获取门店所有员工的月度排班视图
 */
export async function getStoreEmployeeMonthlySchedules(
  storeId: string,
  calendarMonth: string
): Promise<EmployeeMonthlySchedule[]> {
  const {data, error} = await supabase
    .from('employee_monthly_schedule')
    .select('*')
    .eq('store_id', storeId)
    .eq('calendar_month', calendarMonth)
    .order('employee_id', {ascending: true})

  if (error) {
    console.error('获取门店员工月度排班视图失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 智能排班算法 ====================

/**
 * 基于营收预测生成月度排班
 */
export async function generateMonthlySchedule(params: {
  tenantId: string
  storeId: string
  targetMonth: string
  revenueCalendarId: string
}): Promise<{
  calendar: ScheduleCalendar | null
  dailyDetails: DailyScheduleDetail[]
  employeeDetails: EmployeeScheduleDetail[]
}> {
  // TODO: 实现智能排班算法
  // 1. 获取营收预测数据
  // 2. 计算每日人力需求
  // 3. 获取员工信息和约束
  // 4. 应用排班规则
  // 5. 生成排班方案

  console.log('生成月度排班:', params)

  // 暂时返回空数据，后续实现算法
  return {
    calendar: null,
    dailyDetails: [],
    employeeDetails: []
  }
}

/**
 * 验证排班是否满足约束条件
 */
export async function validateSchedule(_calendarId: string): Promise<{
  valid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  // TODO: 实现约束验证
  // 1. 检查最低人数要求
  // 2. 检查排休规则
  // 3. 检查核心岗位配置
  // 4. 检查连续工作天数

  return {
    valid: errors.length === 0,
    errors
  }
}
