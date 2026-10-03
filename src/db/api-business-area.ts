/**
 * 经营区域管理系统API
 * 实现定岗、定编、定人的完整配置体系
 */

import {supabase} from '@/client/supabase'
import type {
  AreaAttendanceOverview,
  AreaDailyStatus,
  AreaPosition,
  AreaStaffAssignment,
  BusinessArea,
  CreateAreaDailyStatusParams,
  CreateAreaPositionParams,
  CreateAreaStaffAssignmentParams,
  CreateBusinessAreaParams
} from './types-v2'

// ==================== 经营区域管理 ====================

/**
 * 获取租户的所有经营区域
 */
export async function getBusinessAreas(tenantId: string, storeId?: string): Promise<BusinessArea[]> {
  let query = supabase
    .from('business_areas')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order', {ascending: true})
    .order('created_at', {ascending: true})

  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取经营区域失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取单个经营区域
 */
export async function getBusinessArea(id: string): Promise<BusinessArea | null> {
  const {data, error} = await supabase.from('business_areas').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取经营区域失败:', error)
    throw error
  }

  return data
}

/**
 * 创建经营区域
 */
export async function createBusinessArea(params: CreateBusinessAreaParams): Promise<BusinessArea> {
  const {data, error} = await supabase
    .from('business_areas')
    .insert({
      tenant_id: params.tenant_id,
      store_id: params.store_id,
      area_code: params.area_code,
      area_name: params.area_name,
      area_type: params.area_type,
      description: params.description,
      capacity: params.capacity,
      floor_number: params.floor_number,
      sort_order: params.sort_order ?? 0,
      can_close_daily: params.can_close_daily ?? true,
      revenue_weight: params.revenue_weight ?? 1.0,
      created_by: params.created_by
    })
    .select()
    .single()

  if (error) {
    console.error('创建经营区域失败:', error)
    throw error
  }

  return data
}

/**
 * 更新经营区域
 */
export async function updateBusinessArea(id: string, updates: Partial<BusinessArea>): Promise<BusinessArea> {
  const {data, error} = await supabase
    .from('business_areas')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新经营区域失败:', error)
    throw error
  }

  return data
}

/**
 * 删除经营区域
 */
export async function deleteBusinessArea(id: string): Promise<void> {
  const {error} = await supabase.from('business_areas').delete().eq('id', id)

  if (error) {
    console.error('删除经营区域失败:', error)
    throw error
  }
}

// ==================== 经营区域每日状态 ====================

/**
 * 获取区域每日状态
 */
export async function getAreaDailyStatus(tenantId: string, storeId: string, date: string): Promise<AreaDailyStatus[]> {
  const {data, error} = await supabase
    .from('area_daily_status')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .eq('status_date', date)
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取区域每日状态失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取区域的状态（单个区域）
 */
export async function getAreaStatus(areaId: string, date: string): Promise<AreaDailyStatus | null> {
  const {data, error} = await supabase
    .from('area_daily_status')
    .select('*')
    .eq('area_id', areaId)
    .eq('status_date', date)
    .maybeSingle()

  if (error) {
    console.error('获取区域状态失败:', error)
    throw error
  }

  return data
}

/**
 * 创建或更新区域每日状态
 */
export async function upsertAreaDailyStatus(params: CreateAreaDailyStatusParams): Promise<AreaDailyStatus> {
  const {data, error} = await supabase
    .from('area_daily_status')
    .upsert(
      {
        tenant_id: params.tenant_id,
        store_id: params.store_id,
        area_id: params.area_id,
        status_date: params.status_date,
        is_open: params.is_open,
        open_time: params.open_time,
        close_time: params.close_time,
        close_reason: params.close_reason,
        predicted_customer_count: params.predicted_customer_count,
        predicted_revenue: params.predicted_revenue,
        created_by: params.created_by,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'tenant_id,store_id,area_id,status_date'
      }
    )
    .select()
    .single()

  if (error) {
    console.error('创建/更新区域每日状态失败:', error)
    throw error
  }

  return data
}

/**
 * 批量更新区域每日状态
 */
export async function batchUpsertAreaDailyStatus(
  statusList: CreateAreaDailyStatusParams[]
): Promise<AreaDailyStatus[]> {
  const {data, error} = await supabase
    .from('area_daily_status')
    .upsert(
      statusList.map((params) => ({
        tenant_id: params.tenant_id,
        store_id: params.store_id,
        area_id: params.area_id,
        status_date: params.status_date,
        is_open: params.is_open,
        open_time: params.open_time,
        close_time: params.close_time,
        close_reason: params.close_reason,
        predicted_customer_count: params.predicted_customer_count,
        predicted_revenue: params.predicted_revenue,
        created_by: params.created_by,
        updated_at: new Date().toISOString()
      })),
      {
        onConflict: 'tenant_id,store_id,area_id,status_date'
      }
    )
    .select()

  if (error) {
    console.error('批量更新区域每日状态失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

// ==================== 经营区域岗位配置（定岗+定编）====================

/**
 * 获取区域的所有岗位配置
 */
export async function getAreaPositions(areaId: string): Promise<AreaPosition[]> {
  const {data, error} = await supabase
    .from('area_positions')
    .select('*')
    .eq('area_id', areaId)
    .eq('is_active', true)
    .order('position_name', {ascending: true})

  if (error) {
    console.error('获取区域岗位配置失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取单个岗位配置
 */
export async function getAreaPosition(id: string): Promise<AreaPosition | null> {
  const {data, error} = await supabase.from('area_positions').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取岗位配置失败:', error)
    throw error
  }

  return data
}

/**
 * 创建岗位配置
 */
export async function createAreaPosition(params: CreateAreaPositionParams): Promise<AreaPosition> {
  const {data, error} = await supabase
    .from('area_positions')
    .insert({
      tenant_id: params.tenant_id,
      store_id: params.store_id,
      area_id: params.area_id,
      position_name: params.position_name,
      position_level: params.position_level,
      quota_count: params.quota_count,
      min_count: params.min_count,
      max_count: params.max_count,
      required_skills: params.required_skills,
      work_hours_per_day: params.work_hours_per_day,
      salary_min: params.salary_min,
      salary_max: params.salary_max,
      created_by: params.created_by
    })
    .select()
    .single()

  if (error) {
    console.error('创建岗位配置失败:', error)
    throw error
  }

  return data
}

/**
 * 更新岗位配置
 */
export async function updateAreaPosition(id: string, updates: Partial<AreaPosition>): Promise<AreaPosition> {
  const {data, error} = await supabase
    .from('area_positions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新岗位配置失败:', error)
    throw error
  }

  return data
}

/**
 * 删除岗位配置
 */
export async function deleteAreaPosition(id: string): Promise<void> {
  const {error} = await supabase.from('area_positions').delete().eq('id', id)

  if (error) {
    console.error('删除岗位配置失败:', error)
    throw error
  }
}

// ==================== 经营区域人员分配（定人）====================

/**
 * 获取岗位的所有人员分配
 */
export async function getAreaStaffAssignments(positionId: string): Promise<AreaStaffAssignment[]> {
  const {data, error} = await supabase
    .from('area_staff_assignments')
    .select('*')
    .eq('area_position_id', positionId)
    .eq('is_active', true)
    .order('priority', {ascending: false})
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取人员分配失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取员工的所有分配
 */
export async function getEmployeeAssignments(employeeId: string): Promise<AreaStaffAssignment[]> {
  const {data, error} = await supabase
    .from('area_staff_assignments')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('is_active', true)
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取员工分配失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建人员分配
 */
export async function createAreaStaffAssignment(params: CreateAreaStaffAssignmentParams): Promise<AreaStaffAssignment> {
  const {data, error} = await supabase
    .from('area_staff_assignments')
    .insert({
      tenant_id: params.tenant_id,
      store_id: params.store_id,
      area_id: params.area_id,
      area_position_id: params.area_position_id,
      employee_id: params.employee_id,
      assignment_type: params.assignment_type ?? 'permanent',
      start_date: params.start_date,
      end_date: params.end_date,
      work_schedule: params.work_schedule,
      priority: params.priority ?? 0,
      created_by: params.created_by
    })
    .select()
    .single()

  if (error) {
    console.error('创建人员分配失败:', error)
    throw error
  }

  return data
}

/**
 * 更新人员分配
 */
export async function updateAreaStaffAssignment(
  id: string,
  updates: Partial<AreaStaffAssignment>
): Promise<AreaStaffAssignment> {
  const {data, error} = await supabase
    .from('area_staff_assignments')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新人员分配失败:', error)
    throw error
  }

  return data
}

/**
 * 删除人员分配
 */
export async function deleteAreaStaffAssignment(id: string): Promise<void> {
  const {error} = await supabase.from('area_staff_assignments').delete().eq('id', id)

  if (error) {
    console.error('删除人员分配失败:', error)
    throw error
  }
}

// ==================== 上岗一览 ====================

/**
 * 获取上岗一览
 */
export async function getAreaAttendanceOverview(
  tenantId: string,
  storeId: string,
  date: string
): Promise<AreaAttendanceOverview | null> {
  const {data, error} = await supabase
    .from('area_attendance_overview')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .eq('overview_date', date)
    .maybeSingle()

  if (error) {
    console.error('获取上岗一览失败:', error)
    throw error
  }

  return data
}

/**
 * 生成上岗一览
 * 这是一个复杂的函数，需要汇总多个数据源
 */
export async function generateAreaAttendanceOverview(
  _tenantId: string,
  _storeId: string,
  _date: string
): Promise<AreaAttendanceOverview> {
  // TODO: 实现上岗一览生成逻辑
  // 1. 获取所有经营区域
  // 2. 获取当日区域状态
  // 3. 获取所有岗位配置
  // 4. 获取人员分配信息
  // 5. 获取排休计划
  // 6. 计算在岗人数、休息人数、缺员数
  // 7. 生成汇总数据
  // 8. 保存到数据库

  throw new Error('generateAreaAttendanceOverview 功能待实现')
}
