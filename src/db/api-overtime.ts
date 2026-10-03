// 加班管理API接口

import {supabase} from '@/client/supabase'
import type {
  CreateOvertimeRequestInput,
  CreateOvertimeTypeInput,
  OvertimeCompensationWithRequest,
  OvertimeData,
  OvertimeRequest,
  OvertimeRequestWithType,
  OvertimeStatistics,
  OvertimeType,
  UpdateOvertimeRequestInput
} from './types-overtime'

// ==================== 加班类型 ====================

/**
 * 获取活跃的加班类型列表
 */
export async function getActiveOvertimeTypes(tenantId: string): Promise<OvertimeType[]> {
  const {data, error} = await supabase
    .from('overtime_types')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('type_code', {ascending: true})

  if (error) {
    console.error('获取加班类型失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建加班类型
 */
export async function createOvertimeType(input: CreateOvertimeTypeInput): Promise<OvertimeType | null> {
  const {data, error} = await supabase
    .from('overtime_types')
    .insert({
      tenant_id: input.tenant_id,
      type_name: input.type_name,
      type_code: input.type_code,
      description: input.description || null,
      rate: input.rate || 1.5,
      can_compensate: input.can_compensate !== false,
      is_active: true
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建加班类型失败:', error)
    return null
  }

  return data
}

// ==================== 加班申请 ====================

/**
 * 获取员工的加班申请列表
 */
export async function getEmployeeOvertimeRequests(employeeId: string): Promise<OvertimeRequestWithType[]> {
  const {data, error} = await supabase
    .from('overtime_requests')
    .select(
      `
      *,
      overtime_type:overtime_types(*)
    `
    )
    .eq('employee_id', employeeId)
    .order('overtime_date', {ascending: false})

  if (error) {
    console.error('获取加班申请失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建加班申请
 */
export async function createOvertimeRequest(input: CreateOvertimeRequestInput): Promise<OvertimeRequest | null> {
  const {data, error} = await supabase
    .from('overtime_requests')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      overtime_type_id: input.overtime_type_id,
      overtime_date: input.overtime_date,
      start_time: input.start_time,
      end_time: input.end_time,
      hours: input.hours,
      reason: input.reason,
      status: 'pending'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建加班申请失败:', error)
    return null
  }

  return data
}

/**
 * 更新加班申请
 */
export async function updateOvertimeRequest(
  requestId: string,
  input: UpdateOvertimeRequestInput
): Promise<OvertimeRequest | null> {
  const {data, error} = await supabase
    .from('overtime_requests')
    .update(input)
    .eq('id', requestId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新加班申请失败:', error)
    return null
  }

  return data
}

/**
 * 取消加班申请
 */
export async function cancelOvertimeRequest(requestId: string): Promise<boolean> {
  const result = await updateOvertimeRequest(requestId, {
    status: 'cancelled'
  })

  return result !== null
}

/**
 * 批准加班申请
 */
export async function approveOvertimeRequest(requestId: string, approverId: string, notes?: string): Promise<boolean> {
  const result = await updateOvertimeRequest(requestId, {
    status: 'approved',
    approver_id: approverId,
    approved_at: new Date().toISOString(),
    approval_notes: notes || null
  })

  return result !== null
}

/**
 * 拒绝加班申请
 */
export async function rejectOvertimeRequest(requestId: string, approverId: string, notes?: string): Promise<boolean> {
  const result = await updateOvertimeRequest(requestId, {
    status: 'rejected',
    approver_id: approverId,
    approved_at: new Date().toISOString(),
    approval_notes: notes || null
  })

  return result !== null
}

// ==================== 加班补偿 ====================

/**
 * 获取员工的加班补偿列表
 */
export async function getEmployeeOvertimeCompensations(employeeId: string): Promise<OvertimeCompensationWithRequest[]> {
  const {data, error} = await supabase
    .from('overtime_compensations')
    .select(
      `
      *,
      overtime_request:overtime_requests(
        *,
        overtime_type:overtime_types(*)
      )
    `
    )
    .eq('employee_id', employeeId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取加班补偿失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 使用加班补偿
 */
export async function useOvertimeCompensation(compensationId: string, notes?: string): Promise<boolean> {
  const {data, error} = await supabase
    .from('overtime_compensations')
    .update({
      status: 'used',
      used_at: new Date().toISOString(),
      notes: notes || null
    })
    .eq('id', compensationId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('使用加班补偿失败:', error)
    return false
  }

  return data !== null
}

// ==================== 统计数据 ====================

/**
 * 获取加班统计
 */
export async function getOvertimeStatistics(employeeId: string): Promise<OvertimeStatistics> {
  const requests = await getEmployeeOvertimeRequests(employeeId)
  const compensations = await getEmployeeOvertimeCompensations(employeeId)

  const totalRequests = requests.length
  const pendingRequests = requests.filter((r) => r.status === 'pending').length
  const approvedRequests = requests.filter((r) => r.status === 'approved').length
  const rejectedRequests = requests.filter((r) => r.status === 'rejected').length

  const totalHours = requests.filter((r) => r.status === 'approved').reduce((sum, r) => sum + Number(r.hours), 0)

  const totalCompensations = compensations.length
  const availableCompensations = compensations.filter((c) => c.status === 'available').length

  return {
    total_requests: totalRequests,
    pending_requests: pendingRequests,
    approved_requests: approvedRequests,
    rejected_requests: rejectedRequests,
    total_hours: totalHours,
    total_compensations: totalCompensations,
    available_compensations: availableCompensations
  }
}

/**
 * 获取员工加班数据
 */
export async function getEmployeeOvertimeData(employeeId: string): Promise<OvertimeData | null> {
  try {
    // 获取加班申请
    const requests = await getEmployeeOvertimeRequests(employeeId)

    // 获取加班补偿
    const compensations = await getEmployeeOvertimeCompensations(employeeId)

    // 获取统计数据
    const statistics = await getOvertimeStatistics(employeeId)

    return {
      requests,
      compensations,
      statistics
    }
  } catch (error) {
    console.error('获取加班数据失败:', error)
    return null
  }
}

/**
 * 计算加班时长
 */
export function calculateOvertimeHours(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01 ${startTime}`)
  const end = new Date(`2000-01-01 ${endTime}`)

  const diffMs = end.getTime() - start.getTime()
  const hours = diffMs / (1000 * 60 * 60)

  return Math.round(hours * 100) / 100
}
