// 请假管理API接口

import {supabase} from '@/client/supabase'
import type {
  CreateLeaveBalanceInput,
  CreateLeaveRequestInput,
  CreateLeaveTypeInput,
  LeaveBalance,
  LeaveBalanceWithType,
  LeaveData,
  LeaveRequest,
  LeaveRequestWithType,
  LeaveStatistics,
  LeaveType,
  UpdateLeaveRequestInput
} from './types-leave'
import {LEAVE_TYPE_NAMES} from './types-leave'

// ==================== 请假类型 ====================

/**
 * 获取活跃的请假类型列表
 */
export async function getActiveLeaveTypes(tenantId: string): Promise<LeaveType[]> {
  const {data, error} = await supabase
    .from('leave_types')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('type_code', {ascending: true})

  if (error) {
    console.error('获取请假类型失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建请假类型
 */
export async function createLeaveType(input: CreateLeaveTypeInput): Promise<LeaveType | null> {
  const {data, error} = await supabase
    .from('leave_types')
    .insert({
      tenant_id: input.tenant_id,
      type_name: input.type_name,
      type_code: input.type_code,
      description: input.description || null,
      max_days_per_year: input.max_days_per_year || null,
      requires_approval: input.requires_approval !== false,
      is_paid: input.is_paid !== false,
      is_active: true
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建请假类型失败:', error)
    return null
  }

  return data
}

// ==================== 假期余额 ====================

/**
 * 获取员工的假期余额列表
 */
export async function getEmployeeLeaveBalances(employeeId: string, year?: number): Promise<LeaveBalanceWithType[]> {
  const currentYear = year || new Date().getFullYear()

  const {data, error} = await supabase
    .from('leave_balances')
    .select(
      `
      *,
      leave_type:leave_type_id(*)
    `
    )
    .eq('employee_id', employeeId)
    .eq('year', currentYear)

  if (error) {
    console.error('获取假期余额失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建假期余额
 */
export async function createLeaveBalance(input: CreateLeaveBalanceInput): Promise<LeaveBalance | null> {
  const {data, error} = await supabase
    .from('leave_balances')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      leave_type_id: input.leave_type_id,
      year: input.year,
      total_days: input.total_days,
      used_days: 0,
      remaining_days: input.total_days
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建假期余额失败:', error)
    return null
  }

  return data
}

/**
 * 初始化员工假期余额
 */
export async function initializeEmployeeLeaveBalances(
  tenantId: string,
  employeeId: string,
  year: number
): Promise<boolean> {
  try {
    // 获取所有活跃的请假类型
    const leaveTypes = await getActiveLeaveTypes(tenantId)

    // 为每种类型创建余额记录
    for (const leaveType of leaveTypes) {
      // 检查是否已存在
      const {data: existing} = await supabase
        .from('leave_balances')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('leave_type_id', leaveType.id)
        .eq('year', year)
        .maybeSingle()

      if (!existing) {
        await createLeaveBalance({
          tenant_id: tenantId,
          employee_id: employeeId,
          leave_type_id: leaveType.id,
          year,
          total_days: leaveType.max_days_per_year || 0
        })
      }
    }

    return true
  } catch (error) {
    console.error('初始化假期余额失败:', error)
    return false
  }
}

// ==================== 请假申请 ====================

/**
 * 获取员工的请假申请列表
 * 注意：数据库使用TEXT字段存储leave_type，不是外键关联
 */
export async function getEmployeeLeaveRequests(employeeId: string): Promise<LeaveRequestWithType[]> {
  const {data: requests, error} = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取请假申请失败:', error)
    return []
  }

  if (!Array.isArray(requests)) {
    return []
  }

  // 将TEXT字段映射为类型对象
  return requests.map((request) => ({
    ...request,
    leave_type_obj: {
      id: request.leave_type,
      type_name: LEAVE_TYPE_NAMES[request.leave_type] || request.leave_type,
      type_code: request.leave_type,
      is_paid: request.leave_type === 'annual_leave' || request.leave_type === 'sick_leave'
    }
  })) as LeaveRequestWithType[]
}

/**
 * 创建请假申请
 * 注意：数据库使用TEXT字段存储leave_type，不是外键
 */
export async function createLeaveRequest(input: CreateLeaveRequestInput): Promise<LeaveRequest | null> {
  const {data, error} = await supabase
    .from('leave_requests')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      store_id: input.store_id,
      leave_type: input.leave_type,
      start_date: input.start_date,
      end_date: input.end_date,
      days: input.days,
      reason: input.reason || '',
      within_rules: input.within_rules || false,
      rule_id: input.rule_id || null,
      current_month_days: input.current_month_days || 0,
      rule_max_days: input.rule_max_days || null,
      status: 'pending'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建请假申请失败:', error)
    return null
  }

  return data
}

/**
 * 更新请假申请
 */
export async function updateLeaveRequest(
  requestId: string,
  input: UpdateLeaveRequestInput
): Promise<LeaveRequest | null> {
  const {data, error} = await supabase.from('leave_requests').update(input).eq('id', requestId).select().maybeSingle()

  if (error) {
    console.error('更新请假申请失败:', error)
    return null
  }

  return data
}

/**
 * 取消请假申请
 */
export async function cancelLeaveRequest(requestId: string): Promise<boolean> {
  const result = await updateLeaveRequest(requestId, {
    status: 'cancelled'
  })

  return result !== null
}

/**
 * 批准请假申请
 */
export async function approveLeaveRequest(requestId: string, approverId: string, notes?: string): Promise<boolean> {
  const result = await updateLeaveRequest(requestId, {
    status: 'approved',
    approver_id: approverId,
    approved_at: new Date().toISOString(),
    approval_notes: notes || null
  })

  return result !== null
}

/**
 * 拒绝请假申请
 */
export async function rejectLeaveRequest(requestId: string, approverId: string, notes?: string): Promise<boolean> {
  const result = await updateLeaveRequest(requestId, {
    status: 'rejected',
    approver_id: approverId,
    approved_at: new Date().toISOString(),
    approval_notes: notes || null
  })

  return result !== null
}

// ==================== 统计数据 ====================

/**
 * 获取请假统计
 */
export async function getLeaveStatistics(employeeId: string): Promise<LeaveStatistics> {
  const requests = await getEmployeeLeaveRequests(employeeId)
  const balances = await getEmployeeLeaveBalances(employeeId)

  const totalRequests = requests.length
  const pendingRequests = requests.filter((r) => r.status === 'pending').length
  const approvedRequests = requests.filter((r) => r.status === 'approved').length
  const rejectedRequests = requests.filter((r) => r.status === 'rejected').length

  const totalDaysUsed = balances.reduce((sum, b) => sum + Number(b.used_days), 0)
  const totalDaysRemaining = balances.reduce((sum, b) => sum + Number(b.remaining_days), 0)

  return {
    total_requests: totalRequests,
    pending_requests: pendingRequests,
    approved_requests: approvedRequests,
    rejected_requests: rejectedRequests,
    total_days_used: totalDaysUsed,
    total_days_remaining: totalDaysRemaining
  }
}

/**
 * 获取员工请假数据
 */
export async function getEmployeeLeaveData(employeeId: string): Promise<LeaveData | null> {
  try {
    // 获取假期余额
    const balances = await getEmployeeLeaveBalances(employeeId)

    // 获取最近的请假申请
    const allRequests = await getEmployeeLeaveRequests(employeeId)
    const recentRequests = allRequests.slice(0, 10)

    // 获取统计数据
    const statistics = await getLeaveStatistics(employeeId)

    return {
      balances,
      recent_requests: recentRequests,
      statistics
    }
  } catch (error) {
    console.error('获取请假数据失败:', error)
    return null
  }
}

/**
 * 计算请假天数（工作日）
 */
export function calculateLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)

  let days = 0
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    // 排除周末（0=周日，6=周六）
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++
    }
    current.setDate(current.getDate() + 1)
  }

  return days
}

/**
 * 检查请假冲突
 */
export async function checkLeaveConflict(employeeId: string, startDate: string, endDate: string): Promise<boolean> {
  const {data, error} = await supabase
    .from('leave_requests')
    .select('id')
    .eq('employee_id', employeeId)
    .in('status', ['pending', 'approved'])
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

  if (error) {
    console.error('检查请假冲突失败:', error)
    return false
  }

  return Array.isArray(data) && data.length > 0
}

/**
 * 检查请假规则
 */
export async function checkLeaveRules(
  _tenantId: string,
  employeeId: string,
  leaveTypeId: string,
  days: number
): Promise<import('./types-leave').LeaveRuleCheckResult> {
  try {
    // 获取请假类型
    const {data: leaveType} = await supabase.from('leave_types').select('*').eq('id', leaveTypeId).maybeSingle()

    if (!leaveType) {
      return {
        valid: false,
        message: '请假类型不存在',
        warnings: []
      }
    }

    // 获取假期余额
    const {data: balance} = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', new Date().getFullYear())
      .maybeSingle()

    const warnings: string[] = []

    // 检查余额
    if (balance && balance.remaining_days < days) {
      return {
        valid: false,
        message: `假期余额不足，剩余${balance.remaining_days}天`,
        warnings
      }
    }

    // 检查年度限制
    if (leaveType.max_days_per_year && days > leaveType.max_days_per_year) {
      warnings.push(`单次请假天数超过年度限制（${leaveType.max_days_per_year}天）`)
    }

    return {
      valid: true,
      message: '请假申请符合规则',
      warnings
    }
  } catch (error) {
    console.error('检查请假规则失败:', error)
    return {
      valid: false,
      message: '检查请假规则失败',
      warnings: []
    }
  }
}

/**
 * 获取待审批的请假申请
 */
export async function getPendingLeaveRequests(
  tenantId: string,
  approverId?: string
): Promise<import('./types-leave').LeaveRequestWithEmployee[]> {
  const query = supabase
    .from('leave_requests')
    .select(
      `
      *,
      employee:employees!leave_requests_employee_id_fkey(id, name, phone, email),
      leave_type:leave_type_id(*)
    `
    )
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('created_at', {ascending: false})

  if (approverId) {
    // 如果指定了审批人，可以添加额外的过滤条件
    // 这里暂时不做过滤，返回所有待审批的请假
  }

  const {data, error} = await query

  if (error) {
    console.error('获取待审批请假申请失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取员工的请假申请（按员工ID）
 * 注意：数据库使用TEXT字段存储leave_type，不是外键关联
 */
export async function getLeaveRequestsByEmployee(
  employeeId: string,
  status?: import('./types-leave').LeaveStatus
): Promise<import('./types-leave').LeaveRequestWithType[]> {
  let query = supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', {ascending: false})

  if (status) {
    query = query.eq('status', status)
  }

  const {data: requests, error} = await query

  if (error) {
    console.error('获取员工请假申请失败:', error)
    return []
  }

  if (!Array.isArray(requests)) {
    return []
  }

  // 将TEXT字段映射为类型对象
  return requests.map((request) => ({
    ...request,
    leave_type_obj: {
      id: request.leave_type,
      type_name: LEAVE_TYPE_NAMES[request.leave_type] || request.leave_type,
      type_code: request.leave_type,
      is_paid: request.leave_type === 'annual_leave' || request.leave_type === 'sick_leave'
    }
  })) as import('./types-leave').LeaveRequestWithType[]
}

/**
 * 获取员工工作台统计
 */
export async function getEmployeeWorkspaceStats(
  employeeId: string,
  tenantId: string
): Promise<import('./types-leave').EmployeeWorkspaceStats> {
  try {
    // 获取请假申请
    const requests = await getEmployeeLeaveRequests(employeeId)

    // 获取假期余额
    const balances = await getEmployeeLeaveBalances(employeeId)

    // 计算统计数据
    const pendingLeaves = requests.filter((r) => r.status === 'pending').length
    const approvedLeaves = requests.filter((r) => r.status === 'approved').length
    const totalLeaveDays = requests.filter((r) => r.status === 'approved').reduce((sum, r) => sum + Number(r.days), 0)

    // 获取年假余额
    const annualLeaveBalance = balances.find((b) => b.leave_type.type_code === 'annual')
    const remainingAnnualLeave = annualLeaveBalance ? Number(annualLeaveBalance.remaining_days) : 0

    // 获取待审批数量（如果是管理者）
    const pendingApprovals = 0 // 这里需要根据实际权限查询

    // 获取今日团队请假人数
    const today = new Date().toISOString().split('T')[0]
    const {data: teamOnLeave} = await supabase
      .from('leave_requests')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'approved')
      .lte('start_date', today)
      .gte('end_date', today)

    const teamOnLeaveToday = Array.isArray(teamOnLeave) ? teamOnLeave.length : 0

    return {
      pending_leaves: pendingLeaves,
      approved_leaves: approvedLeaves,
      total_leave_days: totalLeaveDays,
      remaining_annual_leave: remainingAnnualLeave,
      pending_approvals: pendingApprovals,
      team_on_leave_today: teamOnLeaveToday
    }
  } catch (error) {
    console.error('获取员工工作台统计失败:', error)
    return {
      pending_leaves: 0,
      approved_leaves: 0,
      total_leave_days: 0,
      remaining_annual_leave: 0,
      pending_approvals: 0,
      team_on_leave_today: 0
    }
  }
}

/**
 * 获取员工排班
 */
export async function getEmployeeSchedule(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<import('./types-leave').EmployeeScheduleResult[]> {
  const {data, error} = await supabase
    .from('schedules')
    .select(
      `
      *,
      store:stores(name)
    `
    )
    .eq('employee_id', employeeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', {ascending: true})

  if (error) {
    console.error('获取员工排班失败:', error)
    return []
  }

  if (!Array.isArray(data)) {
    return []
  }

  return data.map((schedule) => ({
    date: schedule.date,
    shift_type: schedule.shift_type || '常规班',
    start_time: schedule.start_time || '09:00',
    end_time: schedule.end_time || '18:00',
    store_name: schedule.store?.name || '未知店铺',
    notes: schedule.notes || null
  }))
}
