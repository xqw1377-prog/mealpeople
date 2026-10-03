/**
 * 最低营收岗位配置API
 * 管理低营收情况下的最少必要岗位配置
 */

import {supabase} from '@/client/supabase'
import type {MinRevenuePositions} from './types-v2'

/**
 * 创建最低营收岗位配置
 */
export async function createMinRevenuePositions(
  config: Omit<MinRevenuePositions, 'id' | 'created_at' | 'updated_at'>
): Promise<MinRevenuePositions | null> {
  try {
    console.log('=== API: 创建最低营收配置 ===', config)
    const {data, error} = await supabase.from('min_revenue_positions').insert(config).select().maybeSingle()

    if (error) {
      console.error('=== API: 创建最低营收配置失败 ===', error)
      console.error('错误详情:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    console.log('=== API: 创建最低营收配置成功 ===', data)
    return data
  } catch (error) {
    console.error('=== API: 创建最低营收配置异常 ===', error)
    throw error
  }
}

/**
 * 获取店铺的最低营收岗位配置
 */
export async function getMinRevenuePositions(tenantId: string, storeId?: string): Promise<MinRevenuePositions[]> {
  try {
    console.log('=== API: 获取最低营收配置 ===', {tenantId, storeId})
    let query = supabase
      .from('min_revenue_positions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('min_revenue', {ascending: true})

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const {data, error} = await query

    if (error) {
      console.error('=== API: 获取最低营收配置失败 ===', error)
      console.error('错误详情:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log('=== API: 获取最低营收配置成功 ===', {数量: data?.length || 0, 数据: data})
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('=== API: 获取最低营收配置异常 ===', error)
    return []
  }
}

/**
 * 更新最低营收岗位配置
 */
export async function updateMinRevenuePositions(id: string, updates: Partial<MinRevenuePositions>): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('min_revenue_positions')
      .update({...updates, updated_at: new Date().toISOString()})
      .eq('id', id)

    if (error) {
      console.error('更新最低营收配置失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('更新最低营收配置异常:', error)
    return false
  }
}

/**
 * 删除最低营收岗位配置
 */
export async function deleteMinRevenuePositions(id: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('min_revenue_positions').delete().eq('id', id)

    if (error) {
      console.error('删除最低营收配置失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除最低营收配置异常:', error)
    return false
  }
}
