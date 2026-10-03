/**
 * 营收智能预估系统API
 * 实现营收日历的创建、查询、更新和智能预测功能
 */

import {supabase} from '@/client/supabase'
import type {
  CreateDailyRevenueDetailParams,
  CreateRevenueCalendarParams,
  DailyRevenueDetail,
  RevenueAdjustmentLog,
  RevenueCalendar,
  RevenueImpactFactor
} from './types-v2'

// ==================== 营收日历管理 ====================

/**
 * 创建月度营收日历
 */
export async function createRevenueCalendar(params: CreateRevenueCalendarParams): Promise<RevenueCalendar | null> {
  console.log('开始创建营收日历，参数:', params)

  const {data, error} = await supabase
    .from('revenue_calendar')
    .insert({
      tenant_id: params.tenant_id,
      store_id: params.store_id,
      calendar_month: params.calendar_month,
      total_revenue_target: params.total_revenue_target || 0,
      predicted_total_revenue: params.predicted_total_revenue || 0,
      generated_by: params.generated_by || 'manual',
      created_by: params.created_by,
      status: 'draft'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建营收日历失败，错误详情:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      params
    })
    return null
  }

  console.log('营收日历创建成功:', data)
  return data
}

/**
 * 获取租户的营收日历列表
 */
export async function getRevenueCalendarsByTenant(tenantId: string, storeId?: string): Promise<RevenueCalendar[]> {
  let query = supabase
    .from('revenue_calendar')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('calendar_month', {ascending: false})

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取营收日历列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取营收日历
 */
export async function getRevenueCalendarById(calendarId: string): Promise<RevenueCalendar | null> {
  const {data, error} = await supabase.from('revenue_calendar').select('*').eq('id', calendarId).maybeSingle()

  if (error) {
    console.error('获取营收日历失败:', error)
    return null
  }

  return data
}

/**
 * 更新营收日历
 */
export async function updateRevenueCalendar(calendarId: string, updates: Partial<RevenueCalendar>): Promise<boolean> {
  const {error} = await supabase
    .from('revenue_calendar')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', calendarId)

  if (error) {
    console.error('更新营收日历失败:', error)
    return false
  }

  return true
}

/**
 * 确认营收日历
 */
export async function confirmRevenueCalendar(calendarId: string, userId: string): Promise<boolean> {
  const {error} = await supabase
    .from('revenue_calendar')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmed_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq('id', calendarId)

  if (error) {
    console.error('确认营收日历失败:', error)
    return false
  }

  return true
}

/**
 * 锁定营收日历
 */
export async function lockRevenueCalendar(calendarId: string): Promise<boolean> {
  const {error} = await supabase
    .from('revenue_calendar')
    .update({
      status: 'locked',
      updated_at: new Date().toISOString()
    })
    .eq('id', calendarId)

  if (error) {
    console.error('锁定营收日历失败:', error)
    return false
  }

  return true
}

/**
 * 删除营收日历
 */
export async function deleteRevenueCalendar(calendarId: string): Promise<boolean> {
  const {error} = await supabase.from('revenue_calendar').delete().eq('id', calendarId)

  if (error) {
    console.error('删除营收日历失败:', error)
    return false
  }

  return true
}

// ==================== 每日营收明细管理 ====================

/**
 * 批量创建每日营收明细
 */
export async function createDailyRevenueDetails(details: CreateDailyRevenueDetailParams[]): Promise<boolean> {
  const {error} = await supabase.from('daily_revenue_detail').insert(details)

  if (error) {
    console.error('批量创建每日营收明细失败:', error)
    return false
  }

  return true
}

/**
 * 获取营收日历的每日明细
 */
export async function getDailyRevenueDetails(calendarId: string): Promise<DailyRevenueDetail[]> {
  const {data, error} = await supabase
    .from('daily_revenue_detail')
    .select('*')
    .eq('calendar_id', calendarId)
    .order('revenue_date', {ascending: true})

  if (error) {
    console.error('获取每日营收明细失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新每日营收明细
 */
export async function updateDailyRevenueDetail(
  detailId: string,
  updates: Partial<DailyRevenueDetail>
): Promise<boolean> {
  const {error} = await supabase
    .from('daily_revenue_detail')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', detailId)

  if (error) {
    console.error('更新每日营收明细失败:', error)
    return false
  }

  return true
}

/**
 * 批量更新每日营收明细
 */
export async function batchUpdateDailyRevenueDetails(
  updates: Array<{id: string; data: Partial<DailyRevenueDetail>}>
): Promise<boolean> {
  try {
    for (const update of updates) {
      const success = await updateDailyRevenueDetail(update.id, update.data)
      if (!success) {
        return false
      }
    }
    return true
  } catch (error) {
    console.error('批量更新每日营收明细失败:', error)
    return false
  }
}

// ==================== 营收调整记录 ====================

/**
 * 创建营收调整记录
 */
export async function createRevenueAdjustmentLog(params: {
  calendar_id: string
  daily_detail_id?: string
  adjustment_type: 'total' | 'daily' | 'meal'
  adjustment_scope?: string
  old_value?: number
  new_value?: number
  adjustment_reason?: string
  impact_factors?: any
  adjusted_by?: string
}): Promise<boolean> {
  const {error} = await supabase.from('revenue_adjustment_log').insert({
    ...params,
    adjusted_at: new Date().toISOString()
  })

  if (error) {
    console.error('创建营收调整记录失败:', error)
    return false
  }

  return true
}

/**
 * 获取营收日历的调整记录
 */
export async function getRevenueAdjustmentLogs(calendarId: string): Promise<RevenueAdjustmentLog[]> {
  const {data, error} = await supabase
    .from('revenue_adjustment_log')
    .select('*')
    .eq('calendar_id', calendarId)
    .order('adjusted_at', {ascending: false})

  if (error) {
    console.error('获取营收调整记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 影响因子管理 ====================

/**
 * 创建影响因子
 */
export async function createRevenueImpactFactor(params: {
  tenant_id: string
  store_id: string
  factor_type: 'weather' | 'holiday' | 'promotion' | 'event'
  factor_name: string
  factor_value?: string
  impact_rate: number
  description?: string
  created_by?: string
}): Promise<RevenueImpactFactor | null> {
  const {data, error} = await supabase
    .from('revenue_impact_factors')
    .insert({
      ...params,
      is_active: true
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建影响因子失败:', error)
    return null
  }

  return data
}

/**
 * 获取影响因子列表
 */
export async function getRevenueImpactFactors(tenantId: string, storeId?: string): Promise<RevenueImpactFactor[]> {
  let query = supabase
    .from('revenue_impact_factors')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取影响因子列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新影响因子
 */
export async function updateRevenueImpactFactor(
  factorId: string,
  updates: Partial<RevenueImpactFactor>
): Promise<boolean> {
  const {error} = await supabase
    .from('revenue_impact_factors')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', factorId)

  if (error) {
    console.error('更新影响因子失败:', error)
    return false
  }

  return true
}

/**
 * 删除影响因子
 */
export async function deleteRevenueImpactFactor(factorId: string): Promise<boolean> {
  const {error} = await supabase.from('revenue_impact_factors').delete().eq('id', factorId)

  if (error) {
    console.error('删除影响因子失败:', error)
    return false
  }

  return true
}

// ==================== 智能预测算法 ====================

/**
 * 基于历史数据生成月度营收预测
 */
export async function generateMonthlyRevenuePrediction(params: {
  tenantId: string
  storeId: string
  targetMonth: string // YYYY-MM格式
}): Promise<{
  calendar: RevenueCalendar | null
  dailyDetails: DailyRevenueDetail[]
}> {
  // TODO: 实现智能预测算法
  // 1. 获取历史营收数据
  // 2. 分析周期性规律
  // 3. 计算预测值
  // 4. 生成每日明细

  console.log('生成月度营收预测:', params)

  // 暂时返回空数据，后续实现算法
  return {
    calendar: null,
    dailyDetails: []
  }
}

/**
 * 应用影响因子调整营收预测
 */
export async function applyImpactFactorsToRevenue(params: {
  dailyDetailId: string
  factors: Array<{
    factor_id: string
    impact_rate: number
  }>
}): Promise<boolean> {
  // TODO: 实现影响因子应用逻辑
  console.log('应用影响因子:', params)
  return true
}

/**
 * 反向优化：根据总营收目标调整每日营收
 */
export async function optimizeRevenueByTotal(params: {
  calendarId: string
  newTotalTarget: number
  userId: string
}): Promise<boolean> {
  try {
    // 1. 获取当前日历和每日明细
    const calendar = await getRevenueCalendarById(params.calendarId)
    if (!calendar) {
      return false
    }

    const dailyDetails = await getDailyRevenueDetails(params.calendarId)
    if (dailyDetails.length === 0) {
      return false
    }

    // 2. 计算调整系数
    const currentTotal = dailyDetails.reduce(
      (sum, detail) => sum + (detail.adjusted_revenue || detail.predicted_revenue),
      0
    )
    const adjustmentRatio = params.newTotalTarget / currentTotal

    // 3. 按比例调整每日营收
    const updates = dailyDetails.map((detail) => ({
      id: detail.id,
      data: {
        adjusted_revenue:
          Math.round((detail.adjusted_revenue || detail.predicted_revenue) * adjustmentRatio * 100) / 100
      }
    }))

    // 4. 批量更新
    const success = await batchUpdateDailyRevenueDetails(updates)
    if (!success) {
      return false
    }

    // 5. 更新日历总营收
    await updateRevenueCalendar(params.calendarId, {
      total_revenue_target: params.newTotalTarget,
      predicted_total_revenue: params.newTotalTarget
    })

    // 6. 记录调整日志
    await createRevenueAdjustmentLog({
      calendar_id: params.calendarId,
      adjustment_type: 'total',
      adjustment_scope: '总营收反向优化',
      old_value: currentTotal,
      new_value: params.newTotalTarget,
      adjustment_reason: `将总营收从 ${currentTotal} 调整为 ${params.newTotalTarget}`,
      adjusted_by: params.userId
    })

    return true
  } catch (error) {
    console.error('反向优化失败:', error)
    return false
  }
}

// ==================== 便捷查询函数 ====================

/**
 * 获取指定月份的营收日历及其日度明细
 */
export async function getMonthlyRevenueWithDetails(
  tenantId: string,
  storeId: string,
  month: string
): Promise<{calendar: RevenueCalendar | null; details: DailyRevenueDetail[]}> {
  // 获取月度日历
  const {data: calendar, error: calendarError} = await supabase
    .from('revenue_calendar')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .eq('calendar_month', month)
    .maybeSingle()

  if (calendarError) {
    console.error('获取月度营收日历失败:', calendarError)
    return {calendar: null, details: []}
  }

  if (!calendar) {
    return {calendar: null, details: []}
  }

  // 获取日度明细
  const details = await getDailyRevenueDetails(calendar.id)

  return {calendar, details}
}
