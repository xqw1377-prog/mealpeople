// 调岗管理API接口

import {supabase} from '@/client/supabase'
import type {
  CreateTransferApplicationInput,
  TransferApplication,
  TransferData,
  TransferHistory,
  TransferPosition,
  TransferPositionWithRequirements,
  TransferStatistics
} from './types-transfer'

// ==================== 可调岗位 ====================

/**
 * 获取活跃的可调岗位列表
 */
export async function getActiveTransferPositions(tenantId: string): Promise<TransferPosition[]> {
  const {data, error} = await supabase
    .from('transfer_positions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('department', {ascending: true})
    .order('position_name', {ascending: true})

  if (error) {
    console.error('获取可调岗位失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取可调岗位详情（包含条件）
 */
export async function getTransferPositionWithRequirements(
  positionId: string
): Promise<TransferPositionWithRequirements | null> {
  const {data, error} = await supabase
    .from('transfer_positions')
    .select(
      `
      *,
      requirements_list:transfer_requirements(*)
    `
    )
    .eq('id', positionId)
    .maybeSingle()

  if (error) {
    console.error('获取可调岗位详情失败:', error)
    return null
  }

  return data
}

/**
 * 获取有空缺的可调岗位
 */
export async function getAvailableTransferPositions(tenantId: string): Promise<TransferPositionWithRequirements[]> {
  const {data, error} = await supabase
    .from('transfer_positions')
    .select(
      `
      *,
      requirements_list:transfer_requirements(*)
    `
    )
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .gt('available_slots', 0)
    .order('department', {ascending: true})
    .order('position_name', {ascending: true})

  if (error) {
    console.error('获取可用岗位失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 调岗申请 ====================

/**
 * 获取员工的调岗申请列表
 */
export async function getEmployeeTransferApplications(employeeId: string): Promise<TransferApplication[]> {
  const {data, error} = await supabase
    .from('transfer_applications')
    .select('*')
    .eq('employee_id', employeeId)
    .order('application_date', {ascending: false})

  if (error) {
    console.error('获取调岗申请失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建调岗申请
 */
export async function createTransferApplication(
  input: CreateTransferApplicationInput
): Promise<TransferApplication | null> {
  const {data, error} = await supabase
    .from('transfer_applications')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      transfer_position_id: input.transfer_position_id,
      current_position: input.current_position,
      current_department: input.current_department,
      current_store_id: input.current_store_id || null,
      target_position: input.target_position,
      target_department: input.target_department,
      target_store_id: input.target_store_id || null,
      reason: input.reason || null,
      status: 'pending'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建调岗申请失败:', error)
    return null
  }

  return data
}

/**
 * 取消调岗申请
 */
export async function cancelTransferApplication(applicationId: string): Promise<boolean> {
  const {error} = await supabase
    .from('transfer_applications')
    .update({
      status: 'cancelled'
    })
    .eq('id', applicationId)

  if (error) {
    console.error('取消调岗申请失败:', error)
    return false
  }

  return true
}

// ==================== 调岗历史 ====================

/**
 * 获取员工的调岗历史
 */
export async function getEmployeeTransferHistory(employeeId: string): Promise<TransferHistory[]> {
  const {data, error} = await supabase
    .from('transfer_history')
    .select('*')
    .eq('employee_id', employeeId)
    .order('transfer_date', {ascending: false})

  if (error) {
    console.error('获取调岗历史失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 统计数据 ====================

/**
 * 获取调岗统计
 */
export async function getTransferStatistics(employeeId: string): Promise<TransferStatistics> {
  const applications = await getEmployeeTransferApplications(employeeId)
  const history = await getEmployeeTransferHistory(employeeId)

  const totalApplications = applications.length
  const pendingApplications = applications.filter((a) => a.status === 'pending').length
  const approvedApplications = applications.filter((a) => a.status === 'approved').length
  const rejectedApplications = applications.filter((a) => a.status === 'rejected').length
  const totalTransfers = history.length

  // 跨部门调岗次数
  const crossDepartmentTransfers = history.filter((h) => h.from_department !== h.to_department).length

  // 跨门店调岗次数
  const crossStoreTransfers = history.filter(
    (h) => h.from_store_id && h.to_store_id && h.from_store_id !== h.to_store_id
  ).length

  return {
    total_applications: totalApplications,
    pending_applications: pendingApplications,
    approved_applications: approvedApplications,
    rejected_applications: rejectedApplications,
    total_transfers: totalTransfers,
    cross_department_transfers: crossDepartmentTransfers,
    cross_store_transfers: crossStoreTransfers
  }
}

/**
 * 获取员工调岗数据
 */
export async function getEmployeeTransferData(employeeId: string, tenantId: string): Promise<TransferData | null> {
  try {
    // 获取可用的岗位
    const availablePositions = await getAvailableTransferPositions(tenantId)

    // 获取我的申请
    const myApplications = await getEmployeeTransferApplications(employeeId)

    // 获取调岗历史
    const transferHistory = await getEmployeeTransferHistory(employeeId)

    // 获取统计数据
    const statistics = await getTransferStatistics(employeeId)

    return {
      available_positions: availablePositions,
      my_applications: myApplications,
      transfer_history: transferHistory,
      statistics
    }
  } catch (error) {
    console.error('获取调岗数据失败:', error)
    return null
  }
}

/**
 * 判断是否跨部门调岗
 */
export function isCrossDepartmentTransfer(fromDepartment: string, toDepartment: string): boolean {
  return fromDepartment !== toDepartment
}

/**
 * 判断是否跨门店调岗
 */
export function isCrossStoreTransfer(fromStoreId: string | null, toStoreId: string | null): boolean {
  return !!fromStoreId && !!toStoreId && fromStoreId !== toStoreId
}
