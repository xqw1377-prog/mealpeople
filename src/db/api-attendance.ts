/**
 * 考勤打卡 API
 * 提供考勤打卡相关的数据库操作
 */

import {supabase} from '@/client/supabase'

// 考勤记录类型
export interface AttendanceRecord {
  id: string
  tenant_id: string
  employee_id: string
  store_id?: string
  date: string
  shift_type?: 'early' | 'middle' | 'late'
  clock_in_time?: string
  clock_out_time?: string
  status: 'normal' | 'late' | 'early_leave' | 'absent'
  work_hours?: number
  note?: string
  created_at: string
  updated_at: string
}

// 打卡类型
export type ClockType = 'in' | 'out'

/**
 * 获取员工今日考勤记录
 */
export async function getTodayAttendance(employeeId: string): Promise<AttendanceRecord | null> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const {data, error} = await supabase
      .from('work_attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle()

    if (error) {
      console.error('获取今日考勤记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取今日考勤记录异常:', error)
    return null
  }
}

/**
 * 上班打卡
 */
export async function clockIn(
  employeeId: string,
  tenantId: string,
  storeId?: string
): Promise<AttendanceRecord | null> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    // 检查今天是否已经打过卡
    const existing = await getTodayAttendance(employeeId)
    if (existing) {
      console.error('今天已经打过上班卡了')
      return null
    }

    // 创建新的考勤记录
    const {data, error} = await supabase
      .from('work_attendance')
      .insert({
        tenant_id: tenantId,
        employee_id: employeeId,
        store_id: storeId,
        date: today,
        clock_in_time: now,
        status: 'normal'
      })
      .select()
      .single()

    if (error) {
      console.error('上班打卡失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('上班打卡异常:', error)
    return null
  }
}

/**
 * 下班打卡
 */
export async function clockOut(employeeId: string): Promise<AttendanceRecord | null> {
  try {
    const now = new Date().toISOString()

    // 获取今天的考勤记录
    const existing = await getTodayAttendance(employeeId)
    if (!existing) {
      console.error('今天还没有打上班卡')
      return null
    }

    if (existing.clock_out_time) {
      console.error('今天已经打过下班卡了')
      return null
    }

    // 计算工作时长
    const clockInTime = new Date(existing.clock_in_time!)
    const clockOutTime = new Date(now)
    const workHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

    // 更新考勤记录
    const {data, error} = await supabase
      .from('work_attendance')
      .update({
        clock_out_time: now,
        work_hours: Math.round(workHours * 100) / 100, // 保留两位小数
        updated_at: now
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('下班打卡失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('下班打卡异常:', error)
    return null
  }
}

/**
 * 获取员工考勤记录列表
 */
export async function getAttendanceRecords(
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> {
  try {
    let query = supabase
      .from('work_attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .order('date', {ascending: false})

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取考勤记录失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取考勤记录异常:', error)
    return []
  }
}

/**
 * 获取本月考勤统计
 */
export async function getMonthlyAttendanceStats(employeeId: string) {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const records = await getAttendanceRecords(employeeId, startDate, endDate)

    // 统计数据
    const totalDays = records.length
    const normalDays = records.filter((r) => r.status === 'normal').length
    const lateDays = records.filter((r) => r.status === 'late').length
    const earlyLeaveDays = records.filter((r) => r.status === 'early_leave').length
    const absentDays = records.filter((r) => r.status === 'absent').length
    const totalHours = records.reduce((sum, r) => sum + (r.work_hours || 0), 0)

    return {
      totalDays,
      normalDays,
      lateDays,
      earlyLeaveDays,
      absentDays,
      totalHours: Math.round(totalHours * 100) / 100
    }
  } catch (error) {
    console.error('获取本月考勤统计异常:', error)
    return {
      totalDays: 0,
      normalDays: 0,
      lateDays: 0,
      earlyLeaveDays: 0,
      absentDays: 0,
      totalHours: 0
    }
  }
}
