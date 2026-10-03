/**
 * 兼职管理模块
 * 包含兼职工时记录、兼职班次管理等功能
 */

import {supabase} from '@/client/supabase'
import type {PartTimeShift} from '../types'

// ==================== 兼职工时记录 API ====================

/**
 * 创建兼职班次
 */
export async function createPartTimeShift(shift: Omit<PartTimeShift, 'id' | 'created_at' | 'updated_at'>) {
  const {data, error} = await supabase.from('part_time_shifts').insert(shift).select().maybeSingle()

  if (error) {
    console.error('创建兼职班次失败:', error)
    return null
  }
  return data
}

/**
 * 根据日期获取兼职班次
 */
export async function getPartTimeShiftsByDate(tenantId: string, storeId: string, operationDate: string) {
  const {data, error} = await supabase
    .from('part_time_shifts')
    .select('*, employees(name)')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .eq('operation_date', operationDate)
    .order('shift_start', {ascending: true})

  if (error) {
    console.error('获取兼职班次失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新兼职班次
 */
export async function updatePartTimeShift(id: string, updates: Partial<PartTimeShift>) {
  const {data, error} = await supabase
    .from('part_time_shifts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新兼职班次失败:', error)
    return null
  }

  return data
}

/**
 * 删除兼职班次
 */
export async function deletePartTimeShift(id: string) {
  const {error} = await supabase.from('part_time_shifts').delete().eq('id', id)

  if (error) {
    console.error('删除兼职班次失败:', error)
    return false
  }
  return true
}
