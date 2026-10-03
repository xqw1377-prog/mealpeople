/**
 * 工作班次管理API
 */

import {supabase} from '@/client/supabase'

/**
 * 时间段类型
 */
export interface TimePeriod {
  start: string // HH:mm格式，如 "06:00"
  end: string // HH:mm格式，如 "09:00"
}

/**
 * 格式化时间为 HH:MM:SS 格式
 * PostgreSQL TIME类型需要完整的时间格式
 */
function formatTimeForDB(time: string): string {
  // 如果已经是 HH:MM:SS 格式，直接返回
  if (time.split(':').length === 3) {
    return time
  }
  // 如果是 HH:MM 格式，添加秒数
  return `${time}:00`
}

/**
 * 工作班次类型
 */
export interface WorkShift {
  id: string
  tenant_id: string
  store_id?: string
  shift_name: string
  shift_order: number
  start_time: string
  end_time: string
  work_hours: number
  time_periods?: TimePeriod[] | null // 多时间段配置
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * 创建工作班次参数
 */
export interface CreateWorkShiftParams {
  tenant_id: string
  store_id?: string
  shift_name: string
  shift_order: number
  start_time: string
  end_time: string
  work_hours: number
  time_periods?: TimePeriod[] | null // 多时间段配置
  is_active?: boolean
}

/**
 * 获取租户的工作班次列表
 */
export async function getWorkShifts(tenantId: string, storeId?: string): Promise<WorkShift[]> {
  console.log('========== 查询班次 ==========')
  console.log('租户ID:', tenantId)
  console.log('门店ID:', storeId)
  console.log('当前用户ID:', (await supabase.auth.getUser()).data.user?.id)

  let query = supabase.from('work_shifts').select('*').eq('tenant_id', tenantId).order('shift_order', {ascending: true})

  if (storeId) {
    query = query.eq('store_id', storeId)
  } else {
    query = query.is('store_id', null)
  }

  const {data, error} = await query

  if (error) {
    console.error('❌ 查询班次失败')
    console.error('错误信息:', error.message)
    console.error('错误详情:', error.details)
    console.error('错误代码:', error.code)
    console.error('完整错误对象:', JSON.stringify(error, null, 2))
    return []
  }

  if (!data || data.length === 0) {
    console.warn('⚠️ 查询班次成功，但没有数据')
    console.warn('这可能是因为：')
    console.warn('1. 该租户确实没有班次数据')
    console.warn('2. RLS策略阻止了数据返回')
    console.warn('3. 查询条件不匹配')
  } else {
    console.log('✅ 查询班次成功')
    console.log('返回数据数量:', data.length)
    console.log('返回数据:', JSON.stringify(data, null, 2))
  }
  console.log('====================================')

  return data || []
}

/**
 * 创建工作班次
 */
export async function createWorkShift(params: CreateWorkShiftParams): Promise<WorkShift | null> {
  try {
    const insertData = {
      tenant_id: params.tenant_id,
      store_id: params.store_id || null,
      shift_name: params.shift_name,
      shift_order: params.shift_order,
      start_time: formatTimeForDB(params.start_time),
      end_time: formatTimeForDB(params.end_time),
      work_hours: params.work_hours,
      time_periods: params.time_periods || null,
      is_active: params.is_active ?? true
    }

    console.log('========== 创建工作班次 ==========')
    console.log('插入数据:', JSON.stringify(insertData, null, 2))
    console.log('当前用户ID:', (await supabase.auth.getUser()).data.user?.id)

    const {data, error} = await supabase.from('work_shifts').insert(insertData).select().maybeSingle()

    if (error) {
      console.error('❌ 创建工作班次失败')
      console.error('错误信息:', error.message)
      console.error('错误详情:', error.details)
      console.error('错误提示:', error.hint)
      console.error('错误代码:', error.code)
      console.error('完整错误对象:', JSON.stringify(error, null, 2))

      // 显示用户友好的错误信息
      if (error.code === '42501') {
        console.error('权限错误：用户没有插入权限，请检查RLS策略')
      } else if (error.code === '23505') {
        console.error('唯一性约束错误：该班次名称已存在')
      } else if (error.code === '23503') {
        console.error('外键约束错误：租户ID或门店ID不存在')
      }

      return null
    }

    if (!data) {
      console.error('❌ 创建工作班次失败：API返回null但没有错误信息')
      console.error('这通常意味着RLS策略阻止了数据返回')
      return null
    }

    console.log('✅ 创建工作班次成功')
    console.log('返回数据:', JSON.stringify(data, null, 2))
    console.log('====================================')
    return data
  } catch (err) {
    console.error('❌ 创建工作班次异常')
    console.error('异常信息:', err)
    console.error('异常堆栈:', err instanceof Error ? err.stack : '无堆栈信息')
    return null
  }
}

/**
 * 更新工作班次
 */
export async function updateWorkShift(
  id: string,
  updates: Partial<Omit<WorkShift, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<WorkShift | null> {
  try {
    // 格式化时间字段
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    if (updates.start_time) {
      updateData.start_time = formatTimeForDB(updates.start_time)
    }
    if (updates.end_time) {
      updateData.end_time = formatTimeForDB(updates.end_time)
    }

    console.log('更新工作班次，ID:', id, '更新数据:', updateData)

    const {data, error} = await supabase.from('work_shifts').update(updateData).eq('id', id).select().maybeSingle()

    if (error) {
      console.error('更新工作班次失败，错误详情:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return null
    }

    console.log('更新工作班次成功:', data)
    return data
  } catch (err) {
    console.error('更新工作班次异常:', err)
    return null
  }
}

/**
 * 删除工作班次
 */
export async function deleteWorkShift(id: string): Promise<boolean> {
  const {error} = await supabase.from('work_shifts').delete().eq('id', id)

  if (error) {
    console.error('删除工作班次失败:', error)
    return false
  }

  return true
}

/**
 * 批量更新工作班次顺序
 */
export async function updateWorkShiftOrders(shifts: Array<{id: string; shift_order: number}>): Promise<boolean> {
  try {
    for (const shift of shifts) {
      await updateWorkShift(shift.id, {shift_order: shift.shift_order})
    }
    return true
  } catch (error) {
    console.error('批量更新工作班次顺序失败:', error)
    return false
  }
}
