/**
 * 简化版工作记录 API
 * 提供工作记录相关的数据库操作
 */

import {supabase} from '@/client/supabase'

// 工作记录类型
export interface WorkRecord {
  id: string
  tenant_id: string
  employee_id: string
  date: string
  time: string
  work_type: 'customer_service' | 'cleaning' | 'inventory' | 'maintenance' | 'training' | 'other'
  work_content: string
  work_duration?: number
  status: 'completed' | 'in_progress' | 'pending'
  note?: string
  created_at: string
  updated_at: string
}

// 工作类型映射
export const WORK_TYPE_MAP: Record<string, string> = {
  customer_service: '接待客户',
  cleaning: '清洁卫生',
  inventory: '库存盘点',
  maintenance: '设备维护',
  training: '培训学习',
  other: '其他工作'
}

/**
 * 创建工作记录
 */
export async function createWorkRecord(
  employeeId: string,
  tenantId: string,
  data: {
    workType: WorkRecord['work_type']
    workContent: string
    workDuration?: number
    status?: WorkRecord['status']
    note?: string
  }
): Promise<WorkRecord | null> {
  try {
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().split(' ')[0]

    const {data: record, error} = await supabase
      .from('simple_work_records')
      .insert({
        tenant_id: tenantId,
        employee_id: employeeId,
        date,
        time,
        work_type: data.workType,
        work_content: data.workContent,
        work_duration: data.workDuration,
        status: data.status || 'completed',
        note: data.note
      })
      .select()
      .single()

    if (error) {
      console.error('创建工作记录失败:', error)
      return null
    }

    return record
  } catch (error) {
    console.error('创建工作记录异常:', error)
    return null
  }
}

/**
 * 获取工作记录列表
 */
export async function getWorkRecords(employeeId: string, startDate?: string, endDate?: string): Promise<WorkRecord[]> {
  try {
    let query = supabase
      .from('simple_work_records')
      .select('*')
      .eq('employee_id', employeeId)
      .order('date', {ascending: false})
      .order('time', {ascending: false})

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取工作记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取工作记录异常:', error)
    return []
  }
}

/**
 * 获取今日工作记录
 */
export async function getTodayWorkRecords(employeeId: string): Promise<WorkRecord[]> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const {data, error} = await supabase
      .from('simple_work_records')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .order('time', {ascending: false})

    if (error) {
      console.error('获取今日工作记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取今日工作记录异常:', error)
    return []
  }
}

/**
 * 获取今日工作统计
 */
export async function getTodayWorkStats(employeeId: string) {
  try {
    const records = await getTodayWorkRecords(employeeId)

    const totalRecords = records.length
    const completedRecords = records.filter((r) => r.status === 'completed').length
    const inProgressRecords = records.filter((r) => r.status === 'in_progress').length

    return {
      totalRecords,
      completedRecords,
      inProgressRecords
    }
  } catch (error) {
    console.error('获取今日工作统计异常:', error)
    return {
      totalRecords: 0,
      completedRecords: 0,
      inProgressRecords: 0
    }
  }
}

/**
 * 更新工作记录
 */
export async function updateWorkRecord(
  recordId: string,
  data: {
    workContent?: string
    workDuration?: number
    status?: WorkRecord['status']
    note?: string
  }
): Promise<WorkRecord | null> {
  try {
    const {data: record, error} = await supabase
      .from('simple_work_records')
      .update({
        ...data,
        work_content: data.workContent,
        work_duration: data.workDuration,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()
      .single()

    if (error) {
      console.error('更新工作记录失败:', error)
      return null
    }

    return record
  } catch (error) {
    console.error('更新工作记录异常:', error)
    return null
  }
}

/**
 * 删除工作记录
 */
export async function deleteWorkRecord(recordId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('simple_work_records').delete().eq('id', recordId)

    if (error) {
      console.error('删除工作记录失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除工作记录异常:', error)
    return false
  }
}

/**
 * 获取工作记录详情
 */
export async function getWorkRecordById(recordId: string): Promise<WorkRecord | null> {
  try {
    const {data, error} = await supabase.from('simple_work_records').select('*').eq('id', recordId).maybeSingle()

    if (error) {
      console.error('获取工作记录详情失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取工作记录详情异常:', error)
    return null
  }
}
