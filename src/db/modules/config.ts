/**
 * 配置管理模块
 * 包含班次配置、餐段配置、岗位配置等功能
 */

import {supabase} from '@/client/supabase'
import type {MealPeriod, PositionConfig, WorkShift} from '../types'

// ==================== 班次配置管理 API ====================

/**
 * 获取班次配置
 */
export async function getWorkShifts(tenantId: string, storeId?: string) {
  let query = supabase.from('work_shifts').select('*').eq('tenant_id', tenantId)

  if (storeId) {
    query = query.or(`store_id.eq.${storeId},store_id.is.null`)
  } else {
    query = query.is('store_id', null)
  }

  const {data, error} = await query.order('shift_start', {ascending: true})

  if (error) {
    console.error('获取班次配置失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建班次配置
 */
export async function createWorkShift(shift: Partial<WorkShift>) {
  const {data, error} = await supabase.from('work_shifts').insert(shift).select().maybeSingle()

  if (error) {
    console.error('创建班次配置失败:', error)
    return null
  }
  return data
}

/**
 * 更新班次配置
 */
export async function updateWorkShift(id: string, shift: Partial<WorkShift>) {
  const {data, error} = await supabase.from('work_shifts').update(shift).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新班次配置失败:', error)
    return null
  }
  return data
}

/**
 * 删除班次配置
 */
export async function deleteWorkShift(id: string) {
  const {error} = await supabase.from('work_shifts').delete().eq('id', id)

  if (error) {
    console.error('删除班次配置失败:', error)
    return false
  }
  return true
}

// ==================== 餐段配置管理 API ====================

/**
 * 获取餐段配置
 */
export async function getMealPeriods(tenantId: string, storeId?: string) {
  let query = supabase.from('meal_periods').select('*').eq('tenant_id', tenantId)

  if (storeId) {
    // 获取门店专属配置或租户通用配置
    query = query.or(`store_id.eq.${storeId},store_id.is.null`)
  } else {
    // 只获取租户通用配置
    query = query.is('store_id', null)
  }

  const {data, error} = await query.order('period_start', {ascending: true})

  if (error) {
    console.error('获取餐段配置失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建餐段配置
 */
export async function createMealPeriod(period: Partial<MealPeriod>) {
  const {data, error} = await supabase.from('meal_periods').insert(period).select().maybeSingle()

  if (error) {
    console.error('创建餐段配置失败:', error)
    return null
  }
  return data
}

/**
 * 更新餐段配置
 */
export async function updateMealPeriod(id: string, period: Partial<MealPeriod>) {
  const {data, error} = await supabase.from('meal_periods').update(period).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新餐段配置失败:', error)
    return null
  }
  return data
}

/**
 * 删除餐段配置
 */
export async function deleteMealPeriod(id: string) {
  const {error} = await supabase.from('meal_periods').delete().eq('id', id)

  if (error) {
    console.error('删除餐段配置失败:', error)
    return false
  }
  return true
}

/**
 * 检查是否有餐段配置
 */
export async function hasMealPeriodConfig(tenantId: string): Promise<boolean> {
  const {data, error} = await supabase.from('meal_periods').select('id').eq('tenant_id', tenantId).limit(1)

  if (error) {
    console.error('检查餐段配置失败:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * 检查租户是否有班次配置
 */
export async function hasWorkShiftConfig(tenantId: string): Promise<boolean> {
  const {data, error} = await supabase.from('work_shifts').select('id').eq('tenant_id', tenantId).limit(1)

  if (error) {
    console.error('检查班次配置失败:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * 检查品牌配置是否完成（餐段和班次都需要配置）
 */
export async function hasBrandConfig(tenantId: string): Promise<boolean> {
  console.log('=== 检查品牌配置完成状态 ===', {租户ID: tenantId})

  const [hasMealPeriod, hasWorkShift] = await Promise.all([hasMealPeriodConfig(tenantId), hasWorkShiftConfig(tenantId)])

  const isComplete = hasMealPeriod && hasWorkShift

  console.log('=== 品牌配置检查结果 ===', {
    餐段配置: hasMealPeriod ? '已完成' : '未完成',
    班次配置: hasWorkShift ? '已完成' : '未完成',
    整体状态: isComplete ? '已完成' : '未完成'
  })

  return isComplete
}

// ==================== 岗位配置管理 API ====================

/**
 * 获取租户的岗位配置
 */
export async function getPositionsByTenantId(tenantId: string): Promise<PositionConfig[]> {
  const {data, error} = await supabase
    .from('position_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取岗位配置失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建岗位配置
 */
export async function createPosition(position: Partial<PositionConfig>) {
  const {data, error} = await supabase.from('position_config').insert(position).select().maybeSingle()

  if (error) {
    console.error('创建岗位配置失败:', error)
    return null
  }
  return data
}

/**
 * 更新岗位配置
 */
export async function updatePosition(id: string, position: Partial<PositionConfig>) {
  const {data, error} = await supabase.from('position_config').update(position).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新岗位配置失败:', error)
    return null
  }
  return data
}

/**
 * 删除岗位配置
 */
export async function deletePosition(id: string) {
  const {error} = await supabase.from('position_config').delete().eq('id', id)

  if (error) {
    console.error('删除岗位配置失败:', error)
    return false
  }
  return true
}

/**
 * 检查是否有岗位配置
 */
export async function hasPositionConfig(tenantId: string): Promise<boolean> {
  const {data, error} = await supabase.from('position_config').select('id').eq('tenant_id', tenantId).limit(1)

  if (error) {
    console.error('检查岗位配置失败:', error)
    return false
  }

  return data && data.length > 0
}

// ==================== 配置状态检查 API ====================

/**
 * 检查是否有业务区域配置
 */
export async function hasBusinessAreaConfig(tenantId: string): Promise<boolean> {
  // 检查是否有门店
  const {data, error} = await supabase.from('stores').select('id').eq('tenant_id', tenantId).limit(1)

  if (error) {
    console.error('检查业务区域配置失败:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * 检查是否有最低营收配置
 */
export async function hasMinRevenueConfig(tenantId: string): Promise<boolean> {
  const {data, error} = await supabase.from('min_revenue_positions').select('id').eq('tenant_id', tenantId).limit(1)

  if (error) {
    console.error('检查最低营收配置失败:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * 检查是否有休息日规则
 */
export async function hasRestDayRules(tenantId: string): Promise<boolean> {
  const {data, error} = await supabase.from('rest_day_rules').select('id').eq('tenant_id', tenantId).limit(1)

  if (error) {
    console.error('检查休息日规则失败:', error)
    return false
  }

  return data && data.length > 0
}

/**
 * 获取配置完成度统计
 */
export async function getConfigCompletionStats(tenantId: string): Promise<{
  total: number
  completed: number
  completion_rate: number
  items: {
    name: string
    completed: boolean
  }[]
}> {
  const items = [
    {
      name: '效能标准',
      completed: await supabase
        .from('efficiency_standards')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1)
        .then(({data}) => !!data && data.length > 0)
    },
    {name: '岗位配置', completed: await hasPositionConfig(tenantId)},
    {name: '业务区域', completed: await hasBusinessAreaConfig(tenantId)},
    {name: '餐段配置', completed: await hasMealPeriodConfig(tenantId)},
    {name: '班次配置', completed: await hasWorkShiftConfig(tenantId)},
    {name: '低营收配置', completed: await hasMinRevenueConfig(tenantId)},
    {name: '排休规则', completed: await hasRestDayRules(tenantId)}
  ]

  const total = items.length
  const completed = items.filter((item) => item.completed).length
  // 四舍五入到整数，避免显示过多小数位
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    total,
    completed,
    completion_rate: completionRate,
    items
  }
}
