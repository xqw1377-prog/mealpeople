/**
 * 员工班次API
 */

import {supabase} from '@/client/supabase'
import type {
  CreateShiftInput,
  EmployeeShift,
  ShiftQueryOptions,
  ShiftStatistics,
  UpdateShiftInput
} from './types-shifts'

/**
 * 获取员工班次列表
 */
export async function getEmployeeShifts(options: ShiftQueryOptions = {}): Promise<EmployeeShift[]> {
  try {
    let query = supabase.from('employee_shifts').select('*')

    // 应用筛选条件
    if (options.employee_id) {
      query = query.eq('employee_id', options.employee_id)
    }
    if (options.tenant_id) {
      query = query.eq('tenant_id', options.tenant_id)
    }
    if (options.store_id) {
      query = query.eq('store_id', options.store_id)
    }
    if (options.start_date) {
      query = query.gte('shift_date', options.start_date)
    }
    if (options.end_date) {
      query = query.lte('shift_date', options.end_date)
    }
    if (options.status) {
      query = query.eq('status', options.status)
    }
    if (options.shift_type) {
      query = query.eq('shift_type', options.shift_type)
    }

    // 按日期排序
    query = query.order('shift_date', {ascending: true})

    const {data, error} = await query

    if (error) {
      console.error('获取班次列表失败:', error)
      throw error
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取班次列表异常:', error)
    return []
  }
}

/**
 * 获取单个班次详情
 */
export async function getShiftById(shiftId: string): Promise<EmployeeShift | null> {
  try {
    const {data, error} = await supabase.from('employee_shifts').select('*').eq('id', shiftId).maybeSingle()

    if (error) {
      console.error('获取班次详情失败:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('获取班次详情异常:', error)
    return null
  }
}

/**
 * 获取员工本周班次
 */
export async function getEmployeeWeekShifts(employeeId: string): Promise<EmployeeShift[]> {
  try {
    // 获取本周一和周日的日期
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const startDate = monday.toISOString().split('T')[0]
    const endDate = sunday.toISOString().split('T')[0]

    return await getEmployeeShifts({
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate
    })
  } catch (error) {
    console.error('获取本周班次异常:', error)
    return []
  }
}

/**
 * 获取员工本月班次
 */
export async function getEmployeeMonthShifts(employeeId: string): Promise<EmployeeShift[]> {
  try {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

    return await getEmployeeShifts({
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate
    })
  } catch (error) {
    console.error('获取本月班次异常:', error)
    return []
  }
}

/**
 * 创建班次
 */
export async function createShift(input: CreateShiftInput): Promise<EmployeeShift | null> {
  try {
    const {data, error} = await supabase
      .from('employee_shifts')
      .insert({
        tenant_id: input.tenant_id,
        employee_id: input.employee_id,
        store_id: input.store_id || null,
        shift_date: input.shift_date,
        shift_type: input.shift_type,
        start_time: input.start_time || null,
        end_time: input.end_time || null,
        work_hours: input.work_hours || 0,
        position: input.position || null,
        status: input.status || 'scheduled',
        notes: input.notes || null
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('创建班次失败:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('创建班次异常:', error)
    return null
  }
}

/**
 * 更新班次
 */
export async function updateShift(shiftId: string, input: UpdateShiftInput): Promise<boolean> {
  try {
    const {error} = await supabase.from('employee_shifts').update(input).eq('id', shiftId)

    if (error) {
      console.error('更新班次失败:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('更新班次异常:', error)
    return false
  }
}

/**
 * 删除班次
 */
export async function deleteShift(shiftId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('employee_shifts').delete().eq('id', shiftId)

    if (error) {
      console.error('删除班次失败:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('删除班次异常:', error)
    return false
  }
}

/**
 * 获取班次统计
 */
export async function getShiftStatistics(
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<ShiftStatistics> {
  try {
    const shifts = await getEmployeeShifts({
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate
    })

    const statistics: ShiftStatistics = {
      total_shifts: shifts.length,
      total_hours: 0,
      completed_shifts: 0,
      scheduled_shifts: 0,
      rest_days: 0
    }

    shifts.forEach((shift) => {
      statistics.total_hours += shift.work_hours || 0

      if (shift.status === 'completed') {
        statistics.completed_shifts++
      } else if (shift.status === 'scheduled' || shift.status === 'confirmed') {
        statistics.scheduled_shifts++
      }

      if (shift.shift_type === 'rest') {
        statistics.rest_days++
      }
    })

    return statistics
  } catch (error) {
    console.error('获取班次统计异常:', error)
    return {
      total_shifts: 0,
      total_hours: 0,
      completed_shifts: 0,
      scheduled_shifts: 0,
      rest_days: 0
    }
  }
}

/**
 * 批量创建班次
 */
export async function batchCreateShifts(shifts: CreateShiftInput[]): Promise<boolean> {
  try {
    const {error} = await supabase.from('employee_shifts').insert(shifts)

    if (error) {
      console.error('批量创建班次失败:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('批量创建班次异常:', error)
    return false
  }
}

/**
 * 确认班次
 */
export async function confirmShift(shiftId: string): Promise<boolean> {
  return await updateShift(shiftId, {status: 'confirmed'})
}

/**
 * 完成班次
 */
export async function completeShift(shiftId: string): Promise<boolean> {
  return await updateShift(shiftId, {status: 'completed'})
}

/**
 * 取消班次
 */
export async function cancelShift(shiftId: string): Promise<boolean> {
  return await updateShift(shiftId, {status: 'cancelled'})
}
