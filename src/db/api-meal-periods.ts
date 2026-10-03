/**
 * 营业餐段管理API
 */

import {supabase} from '@/client/supabase'

/**
 * 营业餐段类型
 */
export interface MealPeriod {
  id: string
  tenant_id: string
  store_id?: string
  period_name: string
  period_order: number
  start_time?: string
  end_time?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 创建营业餐段参数
 */
export interface CreateMealPeriodParams {
  tenant_id: string
  store_id?: string
  period_name: string
  period_order: number
  start_time?: string
  end_time?: string
  is_active?: boolean
}

/**
 * 获取租户的营业餐段列表
 */
export async function getMealPeriods(tenantId: string, storeId?: string): Promise<MealPeriod[]> {
  console.log('========== 查询餐段 ==========')
  console.log('租户ID:', tenantId)
  console.log('门店ID:', storeId)
  console.log('当前用户ID:', (await supabase.auth.getUser()).data.user?.id)

  let query = supabase
    .from('meal_periods')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('period_order', {ascending: true})

  if (storeId) {
    query = query.eq('store_id', storeId)
  } else {
    query = query.is('store_id', null)
  }

  const {data, error} = await query

  if (error) {
    console.error('❌ 查询餐段失败')
    console.error('错误信息:', error.message)
    console.error('错误详情:', error.details)
    console.error('错误代码:', error.code)
    console.error('完整错误对象:', JSON.stringify(error, null, 2))
    return []
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ 查询餐段成功，但没有数据')
    console.warn('这可能是因为：')
    console.warn('1. 该租户确实没有餐段数据')
    console.warn('2. RLS策略阻止了数据返回')
    console.warn('3. 查询条件不匹配')
  } else {
    console.log('✅ 查询餐段成功')
    console.log('返回数据数量:', data.length)
    console.log('返回数据:', JSON.stringify(data, null, 2))
  }
  console.log('====================================')

  return data || []
}

/**
 * 创建营业餐段
 */
export async function createMealPeriod(params: CreateMealPeriodParams): Promise<MealPeriod | null> {
  try {
    const insertData = {
      tenant_id: params.tenant_id,
      store_id: params.store_id || null,
      period_name: params.period_name,
      period_order: params.period_order,
      start_time: params.start_time,
      end_time: params.end_time,
      is_active: params.is_active ?? true
    }

    console.log('========== 创建餐段 ==========')
    console.log('插入数据:', JSON.stringify(insertData, null, 2))
    console.log('当前用户ID:', (await supabase.auth.getUser()).data.user?.id)

    const {data, error} = await supabase.from('meal_periods').insert(insertData).select().maybeSingle()

    if (error) {
      console.error('❌ 创建餐段失败')
      console.error('错误信息:', error.message)
      console.error('错误详情:', error.details)
      console.error('错误提示:', error.hint)
      console.error('错误代码:', error.code)
      console.error('完整错误对象:', JSON.stringify(error, null, 2))

      // 显示用户友好的错误信息
      if (error.code === '42501') {
        console.error('权限错误：用户没有插入权限，请检查RLS策略')
      } else if (error.code === '23505') {
        console.error('唯一性约束错误：该餐段名称已存在')
      } else if (error.code === '23503') {
        console.error('外键约束错误：租户ID或门店ID不存在')
      }

      return null
    }

    if (!data) {
      console.error('❌ 创建餐段失败：API返回null但没有错误信息')
      console.error('这通常意味着RLS策略阻止了数据返回')
      return null
    }

    console.log('✅ 创建餐段成功')
    console.log('返回数据:', JSON.stringify(data, null, 2))
    console.log('====================================')
    return data
  } catch (err) {
    console.error('❌ 创建餐段异常')
    console.error('异常信息:', err)
    console.error('异常堆栈:', err instanceof Error ? err.stack : '无堆栈信息')
    return null
  }
}

/**
 * 更新营业餐段
 */
export async function updateMealPeriod(
  id: string,
  updates: Partial<Omit<MealPeriod, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<MealPeriod | null> {
  const {data, error} = await supabase
    .from('meal_periods')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新营业餐段失败:', error)
    return null
  }

  return data
}

/**
 * 删除营业餐段
 */
export async function deleteMealPeriod(id: string): Promise<boolean> {
  const {error} = await supabase.from('meal_periods').delete().eq('id', id)

  if (error) {
    console.error('删除营业餐段失败:', error)
    return false
  }

  return true
}

/**
 * 批量更新营业餐段顺序
 */
export async function updateMealPeriodOrders(periods: Array<{id: string; period_order: number}>): Promise<boolean> {
  try {
    for (const period of periods) {
      await updateMealPeriod(period.id, {period_order: period.period_order})
    }
    return true
  } catch (error) {
    console.error('批量更新营业餐段顺序失败:', error)
    return false
  }
}
