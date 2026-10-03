/**
 * 门店组织架构API
 * 管理门店的组织架构配置
 */

import {supabase} from '@/client/supabase'
import type {StoreHierarchy} from './types-v2'

/**
 * 创建或更新门店组织架构配置
 */
export async function upsertStoreHierarchy(
  config: Omit<StoreHierarchy, 'id' | 'created_at' | 'updated_at'>
): Promise<StoreHierarchy | null> {
  try {
    const {data, error} = await supabase
      .from('store_hierarchy')
      .upsert(config, {onConflict: 'store_id'})
      .select()
      .maybeSingle()

    if (error) {
      console.error('保存组织架构配置失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('保存组织架构配置异常:', error)
    return null
  }
}

/**
 * 获取门店组织架构配置
 */
export async function getStoreHierarchy(storeId: string): Promise<StoreHierarchy | null> {
  try {
    const {data, error} = await supabase.from('store_hierarchy').select('*').eq('store_id', storeId).maybeSingle()

    if (error) {
      console.error('获取组织架构配置失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取组织架构配置异常:', error)
    return null
  }
}
