// 排班记录API

import {supabase} from '@/client/supabase'
import type {
  CreateWorkScheduleRecordInput,
  UpdateWorkScheduleRecordInput,
  WorkScheduleRecord,
  WorkScheduleRecordWithDetails
} from './types-schedule'

/**
 * 获取所有排班记录
 */
export async function getAllWorkScheduleRecords(): Promise<WorkScheduleRecord[]> {
  const {data, error} = await supabase
    .from('work_schedule_records')
    .select('*')
    .order('schedule_date', {ascending: false})

  if (error) {
    console.error('获取排班记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据配置ID获取排班记录
 */
export async function getWorkScheduleRecordsByConfig(configId: string): Promise<WorkScheduleRecord[]> {
  const {data, error} = await supabase
    .from('work_schedule_records')
    .select('*')
    .eq('config_id', configId)
    .order('schedule_date', {ascending: false})

  if (error) {
    console.error('获取排班记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据员工ID获取排班记录
 */
export async function getWorkScheduleRecordsByEmployee(employeeId: string): Promise<WorkScheduleRecord[]> {
  const {data, error} = await supabase
    .from('work_schedule_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('schedule_date', {ascending: false})

  if (error) {
    console.error('获取员工排班记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据日期获取排班记录
 */
export async function getWorkScheduleRecordsByDate(date: string): Promise<WorkScheduleRecord[]> {
  const {data, error} = await supabase
    .from('work_schedule_records')
    .select('*')
    .eq('schedule_date', date)
    .order('start_time', {ascending: true})

  if (error) {
    console.error('获取排班记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据状态获取排班记录
 */
export async function getWorkScheduleRecordsByStatus(status: string): Promise<WorkScheduleRecord[]> {
  const {data, error} = await supabase
    .from('work_schedule_records')
    .select('*')
    .eq('status', status)
    .order('schedule_date', {ascending: false})

  if (error) {
    console.error('获取排班记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据日期范围获取排班记录
 */
export async function getWorkScheduleRecordsByDateRange(
  startDate: string,
  endDate: string
): Promise<WorkScheduleRecord[]> {
  const {data, error} = await supabase
    .from('work_schedule_records')
    .select('*')
    .gte('schedule_date', startDate)
    .lte('schedule_date', endDate)
    .order('schedule_date', {ascending: false})

  if (error) {
    console.error('获取排班记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据员工ID和日期范围获取排班记录
 */
export async function getWorkScheduleRecordsByEmployeeAndDateRange(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<WorkScheduleRecord[]> {
  const {data, error} = await supabase
    .from('work_schedule_records')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('schedule_date', startDate)
    .lte('schedule_date', endDate)
    .order('schedule_date', {ascending: false})

  if (error) {
    console.error('获取员工排班记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取排班记录
 */
export async function getWorkScheduleRecordById(id: string): Promise<WorkScheduleRecord | null> {
  const {data, error} = await supabase.from('work_schedule_records').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取排班记录失败:', error)
    return null
  }

  return data
}

/**
 * 获取排班记录详情（包含员工和配置信息）
 */
export async function getWorkScheduleRecordWithDetails(id: string): Promise<WorkScheduleRecordWithDetails | null> {
  const record = await getWorkScheduleRecordById(id)
  if (!record) return null

  // 获取员工信息
  const {data: employeeData} = await supabase
    .from('employees')
    .select('name')
    .eq('id', record.employee_id)
    .maybeSingle()

  // 获取配置信息
  const {data: configData} = await supabase
    .from('work_schedule_configs')
    .select('name')
    .eq('id', record.config_id)
    .maybeSingle()

  // 获取门店信息
  const {data: storeData} = await supabase
    .from('work_schedule_configs')
    .select('store_id')
    .eq('id', record.config_id)
    .maybeSingle()

  let storeName = '未知门店'
  if (storeData?.store_id) {
    const {data: store} = await supabase.from('stores').select('name').eq('id', storeData.store_id).maybeSingle()
    storeName = store?.name || '未知门店'
  }

  return {
    ...record,
    employee_name: employeeData?.name || '未知员工',
    config_name: configData?.name || '未知配置',
    store_name: storeName
  }
}

/**
 * 创建排班记录
 */
export async function createWorkScheduleRecord(
  input: CreateWorkScheduleRecordInput
): Promise<WorkScheduleRecord | null> {
  const {data, error} = await supabase
    .from('work_schedule_records')
    .insert({
      config_id: input.config_id,
      employee_id: input.employee_id,
      schedule_date: input.schedule_date,
      shift_type: input.shift_type,
      start_time: input.start_time,
      end_time: input.end_time,
      notes: input.notes,
      status: 'pending'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建排班记录失败:', error)
    return null
  }

  return data
}

/**
 * 批量创建排班记录
 */
export async function createWorkScheduleRecordsBatch(
  inputs: CreateWorkScheduleRecordInput[]
): Promise<WorkScheduleRecord[]> {
  const records = inputs.map((input) => ({
    config_id: input.config_id,
    employee_id: input.employee_id,
    schedule_date: input.schedule_date,
    shift_type: input.shift_type,
    start_time: input.start_time,
    end_time: input.end_time,
    notes: input.notes,
    status: 'pending'
  }))

  const {data, error} = await supabase.from('work_schedule_records').insert(records).select()

  if (error) {
    console.error('批量创建排班记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 更新排班记录
 */
export async function updateWorkScheduleRecord(
  id: string,
  input: UpdateWorkScheduleRecordInput
): Promise<WorkScheduleRecord | null> {
  const {data, error} = await supabase.from('work_schedule_records').update(input).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新排班记录失败:', error)
    return null
  }

  return data
}

/**
 * 开始排班
 */
export async function startWorkScheduleRecord(id: string): Promise<boolean> {
  const {error} = await supabase
    .from('work_schedule_records')
    .update({
      status: 'in_progress',
      actual_start_time: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('开始排班失败:', error)
    return false
  }

  return true
}

/**
 * 完成排班
 */
export async function completeWorkScheduleRecord(id: string): Promise<boolean> {
  const {error} = await supabase
    .from('work_schedule_records')
    .update({
      status: 'completed',
      actual_end_time: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('完成排班失败:', error)
    return false
  }

  return true
}

/**
 * 取消排班
 */
export async function cancelWorkScheduleRecord(id: string): Promise<boolean> {
  const {error} = await supabase.from('work_schedule_records').update({status: 'cancelled'}).eq('id', id)

  if (error) {
    console.error('取消排班失败:', error)
    return false
  }

  return true
}

/**
 * 删除排班记录
 */
export async function deleteWorkScheduleRecord(id: string): Promise<boolean> {
  const {error} = await supabase.from('work_schedule_records').delete().eq('id', id)

  if (error) {
    console.error('删除排班记录失败:', error)
    return false
  }

  return true
}
