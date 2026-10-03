/**
 * 运营数据模块
 * 包含运营数据、每日运营记录、仪表盘等功能
 */

import {supabase} from '@/client/supabase'
import type {DailyOperation, OperationsData} from '../types'

// ==================== 运营数据 API ====================

/**
 * 获取租户的运营数据
 */
export async function getOperationsDataByTenantId(
  tenantId: string,
  options?: {
    startDate?: string
    endDate?: string
  }
): Promise<OperationsData[]> {
  let query = supabase.from('operations_data').select('*').eq('tenant_id', tenantId)

  if (options?.startDate) {
    query = query.gte('data_date', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('data_date', options.endDate)
  }

  const {data, error} = await query.order('data_date', {ascending: false})

  if (error) {
    console.error('获取运营数据失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 获取今日运营数据
 */
export async function getTodayOperationsData(tenantId: string): Promise<OperationsData | null> {
  const today = new Date().toISOString().split('T')[0]

  const {data, error} = await supabase
    .from('operations_data')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('data_date', today)
    .maybeSingle()

  if (error) {
    console.error('获取今日运营数据失败:', error)
    return null
  }

  return data
}

/**
 * 获取月度运营数据
 */
export async function getMonthOperationsData(tenantId: string, year: number, month: number): Promise<OperationsData[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`
  return getOperationsDataByTenantId(tenantId, {startDate, endDate})
}

/**
 * 创建或更新运营数据
 */
export async function upsertOperationsData(data: Partial<OperationsData>): Promise<boolean> {
  const {error} = await supabase.from('operations_data').upsert(
    {
      tenant_id: data.tenant_id,
      store_id: data.store_id,
      data_date: data.data_date,
      total_schedules: data.total_schedules,
      completed_schedules: data.completed_schedules,
      excellent_schedules: data.excellent_schedules,
      delayed_schedules: data.delayed_schedules,
      avg_duration_minutes: data.avg_duration_minutes,
      participation_count: data.participation_count,
      updated_at: new Date().toISOString()
    },
    {onConflict: 'tenant_id,store_id,data_date'}
  )

  if (error) {
    console.error('保存运营数据失败:', error)
    return false
  }
  return true
}

// ==================== 每日运营记录 API ====================

/**
 * 获取每日运营记录
 */
export async function getDailyOperation(tenantId: string, storeId: string, operationDate: string) {
  const {data, error} = await supabase
    .from('daily_operations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .eq('operation_date', operationDate)
    .maybeSingle()

  if (error) {
    console.error('获取每日运营记录失败:', error)
    return null
  }
  return data
}

/**
 * 获取每日运营记录列表
 */
export async function getDailyOperations(tenantId: string, storeId?: string, startDate?: string, endDate?: string) {
  let query = supabase.from('daily_operations').select('*, stores(name)').eq('tenant_id', tenantId)

  if (storeId) {
    query = query.eq('store_id', storeId)
  }
  if (startDate) {
    query = query.gte('operation_date', startDate)
  }
  if (endDate) {
    query = query.lte('operation_date', endDate)
  }

  const {data, error} = await query.order('operation_date', {ascending: false})

  if (error) {
    console.error('获取每日运营记录列表失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 创建或更新每日运营记录
 */
export async function upsertDailyOperation(operation: Partial<DailyOperation>) {
  const {data, error} = await supabase
    .from('daily_operations')
    .upsert(
      {
        tenant_id: operation.tenant_id,
        store_id: operation.store_id,
        operation_date: operation.operation_date,
        estimated_revenue: operation.estimated_revenue,
        planned_staff_count: operation.planned_staff_count,
        planned_rest_count: operation.planned_rest_count,
        planned_part_time_hours: operation.planned_part_time_hours,
        planned_labor_cost: operation.planned_labor_cost,
        midday_estimated_revenue: operation.midday_estimated_revenue,
        adjusted_staff_count: operation.adjusted_staff_count,
        adjusted_rest_count: operation.adjusted_rest_count,
        adjusted_part_time_hours: operation.adjusted_part_time_hours,
        actual_revenue: operation.actual_revenue,
        actual_staff_count: operation.actual_staff_count,
        actual_rest_count: operation.actual_rest_count,
        actual_part_time_hours: operation.actual_part_time_hours,
        actual_labor_cost: operation.actual_labor_cost,
        per_capita_revenue: operation.per_capita_revenue,
        efficiency_rating: operation.efficiency_rating,
        notes: operation.notes,
        updated_at: new Date().toISOString()
      },
      {onConflict: 'tenant_id,store_id,operation_date'}
    )
    .select()
    .maybeSingle()

  if (error) {
    console.error('保存每日运营记录失败:', error)
    return null
  }
  return data
}

/**
 * 删除每日运营记录
 */
export async function deleteDailyOperation(id: string) {
  const {error} = await supabase.from('daily_operations').delete().eq('id', id)

  if (error) {
    console.error('删除每日运营记录失败:', error)
    return false
  }
  return true
}

// ==================== 今日运营仪表盘 API ====================

/**
 * 获取仪表盘数据
 */
export async function getDashboardData(
  tenantId: string,
  options?: {
    date?: string
    storeId?: string
  }
) {
  const targetDate = options?.date || new Date().toISOString().split('T')[0]

  // 获取排班日志数据
  let logsQuery = supabase
    .from('schedule_logs')
    .select('*, employees(name), stores(name)')
    .eq('tenant_id', tenantId)
    .eq('schedule_date', targetDate)

  if (options?.storeId) {
    logsQuery = logsQuery.eq('store_id', options.storeId)
  }

  const {data: logs, error: logsError} = await logsQuery.order('id', {ascending: true})

  if (logsError) {
    console.error('获取排班日志失败:', logsError)
    return null
  }

  // 统计数据
  const totalSchedules = logs?.length || 0
  const completedSchedules = logs?.filter((log) => log.status === 'completed').length || 0
  const excellentSchedules = logs?.filter((log) => (log.quality_score || 0) >= 90).length || 0
  const delayedSchedules = logs?.filter((log) => log.status === 'delayed').length || 0

  const completionRate = totalSchedules > 0 ? (completedSchedules / totalSchedules) * 100 : 0
  const excellentRate = totalSchedules > 0 ? (excellentSchedules / totalSchedules) * 100 : 0
  const delayedRate = totalSchedules > 0 ? (delayedSchedules / totalSchedules) * 100 : 0

  // 参与人员统计
  const participants = new Set(logs?.map((log) => log.employee_id)).size

  // 部门表现（按门店统计）
  const storeStats = new Map()
  logs?.forEach((log) => {
    const storeId = log.store_id
    if (!storeStats.has(storeId)) {
      storeStats.set(storeId, {
        store_id: storeId,
        store_name: (log as any).stores?.name || '未知',
        total: 0,
        completed: 0,
        excellent: 0
      })
    }
    const stats = storeStats.get(storeId)
    stats.total++
    if (log.status === 'completed') stats.completed++
    if ((log.quality_score || 0) >= 90) stats.excellent++
  })

  const departmentPerformance = Array.from(storeStats.values()).map((stats) => ({
    ...stats,
    completion_rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
    excellent_rate: stats.total > 0 ? (stats.excellent / stats.total) * 100 : 0
  }))

  return {
    date: targetDate,
    total_schedules: totalSchedules,
    completed_schedules: completedSchedules,
    completion_rate: completionRate,
    excellent_schedules: excellentSchedules,
    excellent_rate: excellentRate,
    delayed_schedules: delayedSchedules,
    delayed_rate: delayedRate,
    participants: participants,
    department_performance: departmentPerformance,
    logs: logs || []
  }
}

/**
 * 获取增强版仪表盘数据（包含当日和当月累计）
 * 返回格式：{basic: {today, accumulated, days_count}}
 */
export async function getEnhancedDashboardData(
  tenantId: string,
  options?: {
    date?: string
    storeId?: string
  }
) {
  const targetDate = options?.date || new Date().toISOString().split('T')[0]
  const year = parseInt(targetDate.split('-')[0], 10)
  const month = parseInt(targetDate.split('-')[1], 10)

  console.log('=== getEnhancedDashboardData 开始 ===', {
    tenantId,
    targetDate,
    storeId: options?.storeId
  })

  // 获取当月数据范围
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = targetDate

  // 查询当日的排班结果
  let todayResultQuery = supabase
    .from('schedule_results')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('operation_date', targetDate) // 🔥 修改为 operation_date
    .eq('is_latest', true) // 🔥 只查询最新的记录

  if (options?.storeId) {
    todayResultQuery = todayResultQuery.eq('store_id', options.storeId)
  }

  const {data: todayResults, error: todayError} = await todayResultQuery.maybeSingle()

  console.log('=== 当日排班结果 ===', {
    找到数据: !!todayResults,
    错误: todayError?.message,
    数据详情: todayResults
  })

  // 查询当月的所有排班结果
  let monthResultsQuery = supabase
    .from('schedule_results')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_latest', true) // 🔥 只查询最新的记录
    .gte('operation_date', startDate) // 🔥 修改为 operation_date
    .lte('operation_date', endDate) // 🔥 修改为 operation_date

  if (options?.storeId) {
    monthResultsQuery = monthResultsQuery.eq('store_id', options.storeId)
  }

  const {data: monthResults, error: monthError} = await monthResultsQuery.order('operation_date', {
    ascending: true
  }) // 🔥 修改为 operation_date

  console.log('=== 当月排班结果 ===', {
    数据条数: monthResults?.length || 0,
    错误: monthError?.message,
    数据详情: monthResults
  })

  // 计算当日数据
  const todayData = {
    revenue: todayResults?.estimated_revenue || 0,
    rest_count: todayResults?.rest_employee_count || 0,
    rest_days: 0, // 排休天数（当日固定为0）
    efficiency:
      todayResults?.estimated_revenue && todayResults?.planned_staff_count
        ? todayResults.estimated_revenue / todayResults.planned_staff_count
        : 0,
    labor_cost: todayResults?.total_labor_cost || 0,
    cost_ratio:
      todayResults?.estimated_revenue && todayResults?.total_labor_cost
        ? (todayResults.total_labor_cost / todayResults.estimated_revenue) * 100
        : 0,
    thousand_yuan_contribution:
      todayResults?.estimated_revenue && todayResults?.total_labor_cost
        ? (todayResults.total_labor_cost / todayResults.estimated_revenue) * 1000
        : 0
  }

  // 计算当月累计数据
  const daysCount = monthResults?.length || 0
  const accumulatedRevenue = monthResults?.reduce((sum, r) => sum + (r.estimated_revenue || 0), 0) || 0
  const accumulatedRestCount = monthResults?.reduce((sum, r) => sum + (r.rest_employee_count || 0), 0) || 0
  const accumulatedRestDays = 0 // 累计排休天数（暂时为0）
  const accumulatedLaborCost = monthResults?.reduce((sum, r) => sum + (r.total_labor_cost || 0), 0) || 0

  // 计算累计人效（总营收 / 总计划人数）
  const totalPlannedStaff = monthResults?.reduce((sum, r) => sum + (r.planned_staff_count || 0), 0) || 0
  const accumulatedEfficiency = totalPlannedStaff > 0 ? accumulatedRevenue / totalPlannedStaff : 0

  // 计算累计千元贡献
  const accumulatedThousandYuanContribution =
    accumulatedRevenue > 0 ? (accumulatedLaborCost / accumulatedRevenue) * 1000 : 0

  // 计算累计成本率
  const accumulatedCostRatio = accumulatedRevenue > 0 ? (accumulatedLaborCost / accumulatedRevenue) * 100 : 0

  const accumulatedData = {
    revenue: accumulatedRevenue,
    rest_count: accumulatedRestCount,
    rest_days: accumulatedRestDays,
    efficiency: accumulatedEfficiency,
    labor_cost: accumulatedLaborCost,
    cost_ratio: accumulatedCostRatio,
    thousand_yuan_contribution: accumulatedThousandYuanContribution
  }

  console.log('=== 仪表盘数据计算完成 ===', {
    当日营收: todayData.revenue,
    累计营收: accumulatedData.revenue,
    天数: daysCount
  })

  // 确保返回的数据结构完整，即使没有数据也要返回正确的结构
  const result = {
    basic: {
      today: todayData,
      accumulated: accumulatedData,
      days_count: daysCount
    }
  }

  console.log('=== 返回数据结构 ===', JSON.stringify(result, null, 2))

  return result
}

/**
 * 获取营收统计
 */
export async function getRevenueStats(storeId: string): Promise<{
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
}> {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  // 本周
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay())
  const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0]

  // 上周
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekStartStr = lastWeekStart.toISOString().split('T')[0]
  const lastWeekEnd = new Date(thisWeekStart)
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1)
  const lastWeekEndStr = lastWeekEnd.toISOString().split('T')[0]

  // 本月
  const thisMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`

  // 上月
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthStart = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
  const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0]

  // 查询今日
  const {data: todayData} = await supabase
    .from('daily_operations')
    .select('actual_revenue')
    .eq('store_id', storeId)
    .eq('operation_date', todayStr)
    .maybeSingle()

  // 查询昨日
  const {data: yesterdayData} = await supabase
    .from('daily_operations')
    .select('actual_revenue')
    .eq('store_id', storeId)
    .eq('operation_date', yesterdayStr)
    .maybeSingle()

  // 查询本周
  const {data: thisWeekData} = await supabase
    .from('daily_operations')
    .select('actual_revenue')
    .eq('store_id', storeId)
    .gte('operation_date', thisWeekStartStr)
    .lte('operation_date', todayStr)

  // 查询上周
  const {data: lastWeekData} = await supabase
    .from('daily_operations')
    .select('actual_revenue')
    .eq('store_id', storeId)
    .gte('operation_date', lastWeekStartStr)
    .lte('operation_date', lastWeekEndStr)

  // 查询本月
  const {data: thisMonthData} = await supabase
    .from('daily_operations')
    .select('actual_revenue')
    .eq('store_id', storeId)
    .gte('operation_date', thisMonthStart)
    .lte('operation_date', todayStr)

  // 查询上月
  const {data: lastMonthData} = await supabase
    .from('daily_operations')
    .select('actual_revenue')
    .eq('store_id', storeId)
    .gte('operation_date', lastMonthStart)
    .lte('operation_date', lastMonthEndStr)

  return {
    today: todayData?.actual_revenue || 0,
    yesterday: yesterdayData?.actual_revenue || 0,
    thisWeek: thisWeekData?.reduce((sum, item) => sum + (item.actual_revenue || 0), 0) || 0,
    lastWeek: lastWeekData?.reduce((sum, item) => sum + (item.actual_revenue || 0), 0) || 0,
    thisMonth: thisMonthData?.reduce((sum, item) => sum + (item.actual_revenue || 0), 0) || 0,
    lastMonth: lastMonthData?.reduce((sum, item) => sum + (item.actual_revenue || 0), 0) || 0
  }
}
