/**
 * 换班申请API
 */

import {supabase} from '@/client/supabase'
import type {
  CreateSwapRequestInput,
  ReviewSwapRequestInput,
  ShiftSwapRequest,
  SwapRequestQueryOptions,
  SwapRequestStatistics
} from './types-swap'

/**
 * 获取换班申请列表
 */
export async function getSwapRequests(options: SwapRequestQueryOptions = {}): Promise<ShiftSwapRequest[]> {
  try {
    let query = supabase.from('shift_swap_requests').select('*')

    // 应用筛选条件
    if (options.requester_id) {
      query = query.eq('requester_id', options.requester_id)
    }
    if (options.target_id) {
      query = query.eq('target_id', options.target_id)
    }
    if (options.tenant_id) {
      query = query.eq('tenant_id', options.tenant_id)
    }
    if (options.status) {
      query = query.eq('status', options.status)
    }
    if (options.start_date) {
      query = query.gte('created_at', options.start_date)
    }
    if (options.end_date) {
      query = query.lte('created_at', options.end_date)
    }

    // 按创建时间倒序排序
    query = query.order('created_at', {ascending: false})

    const {data, error} = await query

    if (error) {
      console.error('获取换班申请列表失败:', error)
      throw error
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取换班申请列表异常:', error)
    return []
  }
}

/**
 * 获取单个换班申请详情
 */
export async function getSwapRequestById(requestId: string): Promise<ShiftSwapRequest | null> {
  try {
    const {data, error} = await supabase.from('shift_swap_requests').select('*').eq('id', requestId).maybeSingle()

    if (error) {
      console.error('获取换班申请详情失败:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('获取换班申请详情异常:', error)
    return null
  }
}

/**
 * 获取员工的换班申请（作为申请人）
 */
export async function getEmployeeSwapRequests(employeeId: string): Promise<ShiftSwapRequest[]> {
  return await getSwapRequests({requester_id: employeeId})
}

/**
 * 获取员工收到的换班申请（作为目标人）
 */
export async function getEmployeeReceivedSwapRequests(employeeId: string): Promise<ShiftSwapRequest[]> {
  return await getSwapRequests({target_id: employeeId})
}

/**
 * 获取待处理的换班申请
 */
export async function getPendingSwapRequests(tenantId?: string): Promise<ShiftSwapRequest[]> {
  return await getSwapRequests({
    status: 'pending',
    tenant_id: tenantId
  })
}

/**
 * 创建换班申请
 */
export async function createSwapRequest(input: CreateSwapRequestInput): Promise<ShiftSwapRequest | null> {
  try {
    const {data, error} = await supabase
      .from('shift_swap_requests')
      .insert({
        tenant_id: input.tenant_id,
        requester_id: input.requester_id,
        target_id: input.target_id,
        requester_shift_id: input.requester_shift_id,
        target_shift_id: input.target_shift_id,
        reason: input.reason,
        status: 'pending'
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('创建换班申请失败:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('创建换班申请异常:', error)
    return null
  }
}

/**
 * 审批换班申请
 */
export async function reviewSwapRequest(requestId: string, input: ReviewSwapRequestInput): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('shift_swap_requests')
      .update({
        status: input.status,
        reviewed_by: input.reviewed_by,
        reviewed_at: new Date().toISOString(),
        review_notes: input.review_notes || null
      })
      .eq('id', requestId)

    if (error) {
      console.error('审批换班申请失败:', error)
      throw error
    }

    // 如果审批通过，交换班次
    if (input.status === 'approved') {
      const request = await getSwapRequestById(requestId)
      if (request) {
        await swapShifts(request.requester_shift_id, request.target_shift_id)
      }
    }

    return true
  } catch (error) {
    console.error('审批换班申请异常:', error)
    return false
  }
}

/**
 * 取消换班申请
 */
export async function cancelSwapRequest(requestId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('shift_swap_requests')
      .update({status: 'cancelled'})
      .eq('id', requestId)
      .eq('status', 'pending')

    if (error) {
      console.error('取消换班申请失败:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('取消换班申请异常:', error)
    return false
  }
}

/**
 * 交换班次
 */
async function swapShifts(shiftId1: string, shiftId2: string): Promise<boolean> {
  try {
    // 获取两个班次的信息
    const {data: shift1, error: error1} = await supabase
      .from('employee_shifts')
      .select('employee_id')
      .eq('id', shiftId1)
      .maybeSingle()

    const {data: shift2, error: error2} = await supabase
      .from('employee_shifts')
      .select('employee_id')
      .eq('id', shiftId2)
      .maybeSingle()

    if (error1 || error2 || !shift1 || !shift2) {
      console.error('获取班次信息失败')
      return false
    }

    // 交换员工ID
    const {error: updateError1} = await supabase
      .from('employee_shifts')
      .update({employee_id: shift2.employee_id})
      .eq('id', shiftId1)

    const {error: updateError2} = await supabase
      .from('employee_shifts')
      .update({employee_id: shift1.employee_id})
      .eq('id', shiftId2)

    if (updateError1 || updateError2) {
      console.error('交换班次失败')
      return false
    }

    return true
  } catch (error) {
    console.error('交换班次异常:', error)
    return false
  }
}

/**
 * 获取换班申请统计
 */
export async function getSwapRequestStatistics(employeeId?: string, tenantId?: string): Promise<SwapRequestStatistics> {
  try {
    const options: SwapRequestQueryOptions = {}
    if (employeeId) {
      options.requester_id = employeeId
    }
    if (tenantId) {
      options.tenant_id = tenantId
    }

    const requests = await getSwapRequests(options)

    const statistics: SwapRequestStatistics = {
      total_requests: requests.length,
      pending_requests: 0,
      approved_requests: 0,
      rejected_requests: 0,
      cancelled_requests: 0
    }

    requests.forEach((request) => {
      switch (request.status) {
        case 'pending':
          statistics.pending_requests++
          break
        case 'approved':
          statistics.approved_requests++
          break
        case 'rejected':
          statistics.rejected_requests++
          break
        case 'cancelled':
          statistics.cancelled_requests++
          break
      }
    })

    return statistics
  } catch (error) {
    console.error('获取换班申请统计异常:', error)
    return {
      total_requests: 0,
      pending_requests: 0,
      approved_requests: 0,
      rejected_requests: 0,
      cancelled_requests: 0
    }
  }
}

/**
 * 删除换班申请
 */
export async function deleteSwapRequest(requestId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('shift_swap_requests').delete().eq('id', requestId)

    if (error) {
      console.error('删除换班申请失败:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('删除换班申请异常:', error)
    return false
  }
}
