/**
 * 排班管理模块
 * 包含排班计划、排班日志、排班结果等功能
 */

import {supabase} from '@/client/supabase'
import type {
  DayOffRecord,
  PartTimeRecord,
  Schedule,
  ScheduleLog,
  SchedulePlan,
  SchedulePlanPeriod,
  ScheduleResult
} from '../types'

// ==================== 排班基础 API ====================

/**
 * 获取租户的排班列表
 */
export async function getSchedulesByTenantId(
  tenantId: string,
  options?: {
    startDate?: string
    endDate?: string
    storeId?: string
  }
): Promise<Schedule[]> {
  let query = supabase.from('schedules').select('*, employees(name), stores(name)').eq('tenant_id', tenantId)

  if (options?.startDate) {
    query = query.gte('schedule_date', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('schedule_date', options.endDate)
  }
  if (options?.storeId) {
    query = query.eq('store_id', options.storeId)
  }

  const {data, error} = await query.order('schedule_date', {ascending: false})

  if (error) {
    console.error('获取排班列表失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 获取门店的排班列表
 */
export async function getSchedulesByStoreId(
  storeId: string,
  options?: {
    startDate?: string
    endDate?: string
  }
): Promise<Schedule[]> {
  let query = supabase.from('schedules').select('*, employees(name)').eq('store_id', storeId)

  if (options?.startDate) {
    query = query.gte('schedule_date', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('schedule_date', options.endDate)
  }

  const {data, error} = await query.order('schedule_date', {ascending: false})

  if (error) {
    console.error('获取门店排班失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取排班详情
 */
export async function getScheduleById(id: string): Promise<Schedule | null> {
  const {data, error} = await supabase
    .from('schedules')
    .select('*, employees(name), stores(name)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('获取排班详情失败:', error)
    return null
  }
  return data
}

/**
 * 创建排班
 */
export async function createSchedule(schedule: Partial<Schedule>): Promise<Schedule | null> {
  // 检查是否已存在相同日期的排班
  const {data: existing} = await supabase
    .from('schedules')
    .select('*')
    .eq('tenant_id', schedule.tenant_id!)
    .eq('store_id', schedule.store_id!)
    .eq('employee_id', schedule.employee_id!)
    .eq('schedule_date', schedule.schedule_date!)
    .maybeSingle()

  if (existing) {
    console.log('该员工在此日期已有排班，返回现有记录:', existing.id)
    return existing
  }

  const {data, error} = await supabase
    .from('schedules')
    .insert({
      tenant_id: schedule.tenant_id,
      store_id: schedule.store_id,
      employee_id: schedule.employee_id,
      schedule_date: schedule.schedule_date,
      shift_type: schedule.shift_type,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      status: schedule.status || 'pending',
      notes: schedule.notes
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建排班失败:', error)
    return null
  }
  return data
}

/**
 * 创建休息日排班
 */
export async function createDayOffSchedule(dayOff: {
  tenant_id: string
  store_id: string
  employee_id: string
  schedule_date: string
  reason?: string
}): Promise<Schedule | null> {
  // 检查是否已存在排班
  const {data: existing} = await supabase
    .from('schedules')
    .select('id')
    .eq('tenant_id', dayOff.tenant_id)
    .eq('store_id', dayOff.store_id)
    .eq('employee_id', dayOff.employee_id)
    .eq('schedule_date', dayOff.schedule_date)
    .maybeSingle()

  if (existing) {
    console.error('该员工在此日期已有排班')
    return null
  }

  const {data, error} = await supabase
    .from('schedules')
    .insert({
      tenant_id: dayOff.tenant_id,
      store_id: dayOff.store_id,
      employee_id: dayOff.employee_id,
      schedule_date: dayOff.schedule_date,
      shift_type: 'day_off',
      start_time: null,
      end_time: null,
      work_hours: 0,
      status: 'confirmed',
      notes: dayOff.reason
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建休息日排班失败:', error)
    return null
  }
  return data
}

/**
 * 获取休息日排班列表
 */
export async function getDayOffSchedules(tenantId: string, storeId: string, scheduleDate: string): Promise<Schedule[]> {
  const {data, error} = await supabase
    .from('schedules')
    .select('*, employees(name)')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .eq('schedule_date', scheduleDate)
    .eq('shift_type', 'day_off')
    .order('id', {ascending: true})

  if (error) {
    console.error('获取休息日排班失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 删除休息日排班
 */
export async function deleteDayOffSchedule(id: string): Promise<boolean> {
  const {error} = await supabase.from('schedules').delete().eq('id', id).eq('shift_type', 'day_off')

  if (error) {
    console.error('删除休息日排班失败:', error)
    return false
  }
  return true
}

/**
 * 更新排班
 */
export async function updateSchedule(id: string, updates: Partial<Schedule>): Promise<boolean> {
  const {error} = await supabase.from('schedules').update(updates).eq('id', id)

  if (error) {
    console.error('更新排班失败:', error)
    return false
  }
  return true
}

/**
 * 删除排班
 */
export async function deleteSchedule(id: string): Promise<boolean> {
  const {error} = await supabase.from('schedules').delete().eq('id', id)
  return !error
}

// ==================== 排班日志 API ====================

/**
 * 获取租户的排班日志列表
 */
export async function getScheduleLogsByTenantId(
  tenantId: string,
  options?: {
    startDate?: string
    endDate?: string
    storeId?: string
    employeeId?: string
  }
): Promise<ScheduleLog[]> {
  let query = supabase.from('schedule_logs').select('*, employees(name), stores(name)').eq('tenant_id', tenantId)

  if (options?.startDate) {
    query = query.gte('log_date', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('log_date', options.endDate)
  }
  if (options?.storeId) {
    query = query.eq('store_id', options.storeId)
  }
  if (options?.employeeId) {
    query = query.eq('employee_id', options.employeeId)
  }

  const {data, error} = await query.order('log_date', {ascending: false})

  if (error) {
    console.error('获取排班日志失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取排班日志详情
 */
export async function getScheduleLogById(id: string): Promise<ScheduleLog | null> {
  const {data, error} = await supabase
    .from('schedule_logs')
    .select('*, employees(name), stores(name)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('获取排班日志详情失败:', error)
    return null
  }
  return data
}

/**
 * 创建排班日志
 */
export async function createScheduleLog(log: Partial<ScheduleLog>): Promise<ScheduleLog | null> {
  // 检查是否已存在相同日期的日志
  const {data: existing} = await supabase
    .from('schedule_logs')
    .select('*')
    .eq('tenant_id', log.tenant_id!)
    .eq('store_id', log.store_id!)
    .eq('employee_id', log.employee_id!)
    .eq('log_date', log.log_date!)
    .maybeSingle()

  if (existing) {
    console.log('该员工在此日期已有排班日志，返回现有记录:', existing.id)
    return existing
  }

  const {data, error} = await supabase
    .from('schedule_logs')
    .insert({
      tenant_id: log.tenant_id,
      store_id: log.store_id,
      employee_id: log.employee_id,
      schedule_id: log.schedule_id,
      log_date: log.log_date,
      completion_status: log.completion_status,
      completion_time: log.completion_time,
      score: log.score,
      duration_minutes: log.duration_minutes,
      notes: log.notes
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建排班日志失败:', error)
    return null
  }
  return data
}

/**
 * 获取排班日志排行榜
 */
export async function getScheduleLogsRanking(
  tenantId: string,
  options?: {
    startDate?: string
    endDate?: string
    storeId?: string
    limit?: number
  }
) {
  // 构建查询
  let query = supabase
    .from('schedule_logs')
    .select('employee_id, employees(name), store_id, stores(name), completion_status, score')
    .eq('tenant_id', tenantId)

  if (options?.startDate) {
    query = query.gte('log_date', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('log_date', options.endDate)
  }
  if (options?.storeId) {
    query = query.eq('store_id', options.storeId)
  }

  const {data: logs, error} = await query.order('id', {ascending: true})

  if (error) {
    console.error('获取排班日志失败:', error)
    return []
  }

  if (!logs || logs.length === 0) {
    return []
  }

  // 按员工分组统计
  const employeeStats = new Map()

  for (const log of logs) {
    const key = log.employee_id
    if (!employeeStats.has(key)) {
      employeeStats.set(key, {
        employee_id: log.employee_id,
        employee_name: (log as any).employees?.name || '未知',
        store_id: log.store_id,
        store_name: (log as any).stores?.name || '未知',
        total_count: 0,
        completed_count: 0,
        excellent_count: 0,
        total_score: 0
      })
    }

    const stats = employeeStats.get(key)
    stats.total_count++

    if ((log as any).completion_status === 'completed') {
      stats.completed_count++
    }

    const score = (log as any).score || 0
    if (score >= 90) {
      stats.excellent_count++
    }

    stats.total_score += score
  }

  // 计算排名指标
  const ranking = Array.from(employeeStats.values()).map((stats) => ({
    ...stats,
    completion_rate: stats.total_count > 0 ? (stats.completed_count / stats.total_count) * 100 : 0,
    excellent_rate: stats.total_count > 0 ? (stats.excellent_count / stats.total_count) * 100 : 0,
    average_score: stats.total_count > 0 ? stats.total_score / stats.total_count : 0
  }))

  // 按平均分排序
  ranking.sort((a, b) => b.average_score - a.average_score)

  // 限制返回数量
  if (options?.limit) {
    return ranking.slice(0, options.limit)
  }

  return ranking
}

/**
 * 更新排班日志
 */
export async function updateScheduleLog(id: string, updates: Partial<ScheduleLog>): Promise<ScheduleLog | null> {
  const {data, error} = await supabase
    .from('schedule_logs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新排班日志失败:', error)
    return null
  }

  return data
}

/**
 * 删除排班日志
 */
export async function deleteScheduleLog(id: string): Promise<boolean> {
  const {error} = await supabase.from('schedule_logs').delete().eq('id', id)
  return !error
}

// ==================== 排班规划 API ====================

/**
 * 创建或更新排班计划
 */
export async function upsertSchedulePlan(plan: Partial<SchedulePlan>) {
  const {data, error} = await supabase
    .from('schedule_plans')
    .upsert(
      {
        tenant_id: plan.tenant_id,
        store_id: plan.store_id,
        plan_date: plan.plan_date,
        total_estimated_revenue: plan.total_estimated_revenue,
        total_required_staff: plan.total_required_staff,
        total_confirmed_staff: plan.total_confirmed_staff,
        total_regular_staff: plan.total_regular_staff,
        total_day_off_staff: plan.total_day_off_staff,
        total_working_staff: plan.total_working_staff,
        total_part_time_staff: plan.total_part_time_staff,
        total_salary: plan.total_salary,
        is_reasonable: plan.is_reasonable,
        status: plan.status || 'draft',
        updated_at: new Date().toISOString()
      },
      {onConflict: 'tenant_id,store_id,plan_date'}
    )
    .select()
    .maybeSingle()

  if (error) {
    console.error('保存排班计划失败:', error)
    return null
  }
  return data
}

/**
 * 获取排班计划
 */
export async function getSchedulePlan(tenantId: string, storeId: string, planDate: string) {
  const {data, error} = await supabase
    .from('schedule_plans')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .eq('plan_date', planDate)
    .maybeSingle()

  if (error) {
    console.error('获取排班计划失败:', error)
    return null
  }
  return data
}

/**
 * 创建排班计划时段
 */
export async function createSchedulePlanPeriods(periods: Partial<SchedulePlanPeriod>[]) {
  const {data, error} = await supabase.from('schedule_plan_periods').insert(periods).select()

  if (error) {
    console.error('创建排班计划时段失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 获取排班计划时段
 */
export async function getSchedulePlanPeriods(schedulePlanId: string) {
  const {data, error} = await supabase
    .from('schedule_plan_periods')
    .select('*')
    .eq('schedule_plan_id', schedulePlanId)
    .order('period_start', {ascending: true})

  if (error) {
    console.error('获取排班计划时段失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 删除排班计划时段
 */
export async function deleteSchedulePlanPeriods(schedulePlanId: string) {
  const {error} = await supabase.from('schedule_plan_periods').delete().eq('schedule_plan_id', schedulePlanId)

  if (error) {
    console.error('删除排班计划时段失败:', error)
    return false
  }
  return true
}

/**
 * 创建休息日记录
 */
export async function createDayOffRecords(records: Partial<DayOffRecord>[]) {
  const {data, error} = await supabase.from('day_off_records').insert(records).select()

  if (error) {
    console.error('创建休息日记录失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 获取休息日记录
 */
export async function getDayOffRecords(schedulePlanId: string) {
  const {data, error} = await supabase
    .from('day_off_records')
    .select('*, employees(name)')
    .eq('schedule_plan_id', schedulePlanId)
    .order('id', {ascending: true})

  if (error) {
    console.error('获取休息日记录失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 删除休息日记录
 */
export async function deleteDayOffRecords(schedulePlanId: string) {
  const {error} = await supabase.from('day_off_records').delete().eq('schedule_plan_id', schedulePlanId)

  if (error) {
    console.error('删除休息日记录失败:', error)
    return false
  }
  return true
}

/**
 * 创建兼职记录
 */
export async function createPartTimeRecords(records: Partial<PartTimeRecord>[]) {
  const {data, error} = await supabase.from('part_time_records').insert(records).select()

  if (error) {
    console.error('创建兼职记录失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 获取兼职记录
 */
export async function getPartTimeRecords(schedulePlanId: string) {
  const {data, error} = await supabase
    .from('part_time_records')
    .select('*, employees(name)')
    .eq('schedule_plan_id', schedulePlanId)
    .order('id', {ascending: true})

  if (error) {
    console.error('获取兼职记录失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 删除兼职记录
 */
export async function deletePartTimeRecords(schedulePlanId: string) {
  const {error} = await supabase.from('part_time_records').delete().eq('schedule_plan_id', schedulePlanId)

  if (error) {
    console.error('删除兼职记录失败:', error)
    return false
  }
  return true
}

// ==================== 排班结果 API ====================

/**
 * 创建或更新排班结果
 */
export async function upsertScheduleResult(result: Omit<ScheduleResult, 'id' | 'created_at' | 'updated_at'>) {
  // 先检查是否存在
  const {data: existing} = await supabase
    .from('schedule_results')
    .select('id')
    .eq('tenant_id', result.tenant_id)
    .eq('store_id', result.store_id)
    .eq('operation_date', result.operation_date)
    .maybeSingle()

  if (existing) {
    // 更新
    const {data, error} = await supabase
      .from('schedule_results')
      .update({
        ...result,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('更新排班结果失败:', error)
      return null
    }
    return data
  } else {
    // 插入
    const {data, error} = await supabase.from('schedule_results').insert(result).select().maybeSingle()

    if (error) {
      console.error('创建排班结果失败:', error)
      return null
    }
    return data
  }
}

/**
 * 插入排班结果
 */
export async function insertScheduleResult(result: Omit<ScheduleResult, 'id' | 'created_at' | 'updated_at'>) {
  // 🔥 在插入新记录之前，先将同一天的旧记录的 is_latest 设置为 false
  const {error: updateError} = await supabase
    .from('schedule_results')
    .update({is_latest: false})
    .eq('tenant_id', result.tenant_id)
    .eq('store_id', result.store_id)
    .eq('operation_date', result.operation_date)
    .eq('is_latest', true)

  if (updateError) {
    console.warn('更新旧记录的 is_latest 状态失败:', updateError)
    // 不抛出错误，继续插入新记录
  }

  // 插入新记录
  const {data, error} = await supabase.from('schedule_results').insert(result).select().maybeSingle()

  if (error) {
    console.error('插入排班结果失败:', error)
    return null
  }
  return data
}

/**
 * 根据日期获取排班结果
 */
export async function getScheduleResultByDate(tenantId: string, storeId: string, operationDate: string) {
  const {data, error} = await supabase
    .from('schedule_results')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .eq('operation_date', operationDate)
    .eq('is_latest', true) // 🔥 只查询最新的记录
    .order('created_at', {ascending: false}) // 🔥 按创建时间倒序排序
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('获取排班结果失败:', error)
    return null
  }
  return data
}

/**
 * 根据日期范围获取排班结果
 */
export async function getScheduleResultsByDateRange(
  tenantId: string,
  storeId: string,
  startDate: string,
  endDate: string
) {
  const {data, error} = await supabase
    .from('schedule_results')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .gte('operation_date', startDate)
    .lte('operation_date', endDate)
    .order('operation_date', {ascending: true})

  if (error) {
    console.error('获取排班结果列表失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 获取排班调整历史
 */
export async function getScheduleAdjustmentHistory(
  tenantId: string,
  storeId: string,
  startDate: string,
  endDate: string
) {
  const {data, error} = await supabase
    .from('schedule_results')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .gte('operation_date', startDate)
    .lte('operation_date', endDate)
    .not('adjustment_type', 'is', null) // 🔥 修改为 adjustment_type
    .order('created_at', {ascending: false}) // 🔥 按创建时间倒序排序，确保最新的在前面

  if (error) {
    console.error('获取排班调整历史失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 获取排班结果统计
 */
export async function getScheduleResultsStats(tenantId: string, startDate: string, endDate: string) {
  const {data, error} = await supabase
    .from('schedule_results')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('operation_date', startDate)
    .lte('operation_date', endDate)
    .order('id', {ascending: true})

  if (error) {
    console.error('获取排班结果统计失败:', error)
    return {
      total_days: 0,
      total_revenue: 0,
      total_labor_cost: 0,
      avg_efficiency: 0,
      avg_labor_cost_rate: 0,
      adjustment_count: 0
    }
  }

  if (!data || data.length === 0) {
    return {
      total_days: 0,
      total_revenue: 0,
      total_labor_cost: 0,
      avg_efficiency: 0,
      avg_labor_cost_rate: 0,
      adjustment_count: 0
    }
  }

  const totalDays = data.length
  const totalRevenue = data.reduce((sum, item) => sum + (item.actual_revenue || 0), 0)
  const totalLaborCost = data.reduce((sum, item) => sum + (item.actual_labor_cost || 0), 0)
  const totalEfficiency = data.reduce((sum, item) => sum + (item.actual_efficiency || 0), 0)
  const totalLaborCostRate = data.reduce((sum, item) => sum + (item.actual_labor_cost_rate || 0), 0)
  const adjustmentCount = data.filter((item) => item.adjustment_reason).length

  return {
    total_days: totalDays,
    total_revenue: totalRevenue,
    total_labor_cost: totalLaborCost,
    avg_efficiency: totalDays > 0 ? totalEfficiency / totalDays : 0,
    avg_labor_cost_rate: totalDays > 0 ? totalLaborCostRate / totalDays : 0,
    adjustment_count: adjustmentCount
  }
}
