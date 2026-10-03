// 排班配置API

import {supabase} from '@/client/supabase'
import type {
  CreateWorkScheduleConfigInput,
  UpdateWorkScheduleConfigInput,
  WorkScheduleConfig,
  WorkScheduleConfigWithStats
} from './types-schedule'

/**
 * 获取所有排班配置
 */
export async function getAllWorkScheduleConfigs(): Promise<WorkScheduleConfig[]> {
  const {data, error} = await supabase.from('work_schedule_configs').select('*').order('created_at', {ascending: false})

  if (error) {
    console.error('获取排班配置失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据门店ID获取排班配置
 */
export async function getWorkScheduleConfigsByStore(storeId: string): Promise<WorkScheduleConfig[]> {
  const {data, error} = await supabase
    .from('work_schedule_configs')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取门店排班配置失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据状态获取排班配置
 */
export async function getWorkScheduleConfigsByStatus(status: string): Promise<WorkScheduleConfig[]> {
  const {data, error} = await supabase
    .from('work_schedule_configs')
    .select('*')
    .eq('status', status)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取排班配置失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取排班配置
 */
export async function getWorkScheduleConfigById(id: string): Promise<WorkScheduleConfig | null> {
  const {data, error} = await supabase.from('work_schedule_configs').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取排班配置失败:', error)
    return null
  }

  return data
}

/**
 * 获取排班配置详情（包含统计信息）
 */
export async function getWorkScheduleConfigWithStats(id: string): Promise<WorkScheduleConfigWithStats | null> {
  // 获取配置信息
  const config = await getWorkScheduleConfigById(id)
  if (!config) return null

  // 获取门店名称
  const {data: storeData} = await supabase.from('stores').select('name').eq('id', config.store_id).maybeSingle()

  // 获取排班记录统计
  const {data: recordsData} = await supabase.from('work_schedule_records').select('status').eq('config_id', id)

  const records = Array.isArray(recordsData) ? recordsData : []
  const totalRecords = records.length
  const completedRecords = records.filter((r) => r.status === 'completed').length
  const completionRate = totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0

  return {
    ...config,
    total_records: totalRecords,
    completed_records: completedRecords,
    completion_rate: Number(completionRate.toFixed(2)),
    store_name: storeData?.name || '未知门店'
  }
}

/**
 * 创建排班配置
 */
export async function createWorkScheduleConfig(
  input: CreateWorkScheduleConfigInput
): Promise<WorkScheduleConfig | null> {
  const {data, error} = await supabase
    .from('work_schedule_configs')
    .insert({
      tenant_id: input.tenant_id,
      store_id: input.store_id,
      name: input.name,
      description: input.description,
      type: input.type,
      start_date: input.start_date,
      end_date: input.end_date,
      created_by: input.created_by,
      status: 'draft'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建排班配置失败:', error)
    return null
  }

  return data
}

/**
 * 更新排班配置
 */
export async function updateWorkScheduleConfig(
  id: string,
  input: UpdateWorkScheduleConfigInput
): Promise<WorkScheduleConfig | null> {
  const {data, error} = await supabase.from('work_schedule_configs').update(input).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新排班配置失败:', error)
    return null
  }

  return data
}

/**
 * 发布排班配置
 */
export async function publishWorkScheduleConfig(id: string): Promise<boolean> {
  const {error} = await supabase.from('work_schedule_configs').update({status: 'published'}).eq('id', id)

  if (error) {
    console.error('发布排班配置失败:', error)
    return false
  }

  return true
}

/**
 * 完成排班配置
 */
export async function completeWorkScheduleConfig(id: string): Promise<boolean> {
  const {error} = await supabase.from('work_schedule_configs').update({status: 'completed'}).eq('id', id)

  if (error) {
    console.error('完成排班配置失败:', error)
    return false
  }

  return true
}

/**
 * 取消排班配置
 */
export async function cancelWorkScheduleConfig(id: string): Promise<boolean> {
  const {error} = await supabase.from('work_schedule_configs').update({status: 'cancelled'}).eq('id', id)

  if (error) {
    console.error('取消排班配置失败:', error)
    return false
  }

  return true
}

/**
 * 删除排班配置
 */
export async function deleteWorkScheduleConfig(id: string): Promise<boolean> {
  const {error} = await supabase.from('work_schedule_configs').delete().eq('id', id)

  if (error) {
    console.error('删除排班配置失败:', error)
    return false
  }

  return true
}
