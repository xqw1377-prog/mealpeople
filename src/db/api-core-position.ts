/**
 * 核心岗位顶岗配置API
 * 管理核心岗位的顶岗人员配置
 */

import {supabase} from '@/client/supabase'
import type {CorePositionBackup} from './types-v2'

/**
 * 创建核心岗位顶岗配置
 */
export async function createCorePositionBackup(
  config: Omit<CorePositionBackup, 'id' | 'created_at' | 'updated_at'>
): Promise<CorePositionBackup | null> {
  try {
    const {data, error} = await supabase.from('core_position_backup').insert(config).select().maybeSingle()

    if (error) {
      console.error('创建顶岗配置失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建顶岗配置异常:', error)
    return null
  }
}

/**
 * 获取店铺的核心岗位顶岗配置
 */
export async function getCorePositionBackups(tenantId: string, storeId?: string): Promise<CorePositionBackup[]> {
  try {
    let query = supabase
      .from('core_position_backup')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', {ascending: false})

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取顶岗配置失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取顶岗配置异常:', error)
    return []
  }
}

/**
 * 更新核心岗位顶岗配置
 */
export async function updateCorePositionBackup(id: string, updates: Partial<CorePositionBackup>): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('core_position_backup')
      .update({...updates, updated_at: new Date().toISOString()})
      .eq('id', id)

    if (error) {
      console.error('更新顶岗配置失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('更新顶岗配置异常:', error)
    return false
  }
}

/**
 * 删除核心岗位顶岗配置
 */
export async function deleteCorePositionBackup(id: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('core_position_backup').delete().eq('id', id)

    if (error) {
      console.error('删除顶岗配置失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除顶岗配置异常:', error)
    return false
  }
}
