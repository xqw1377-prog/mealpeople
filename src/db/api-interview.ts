/**
 * 面试管理API - 双线设计
 *
 * 员工线：查看面试通知、确认参加、查看结果、响应Offer
 * 管理线：安排面试、评估候选人、发送Offer、跟踪状态
 */

import {supabase} from '@/client/supabase'
import type {Interview} from './types-dual-line'

// ============================================
// 员工端API
// ============================================

/**
 * 获取我的面试列表
 * @param candidateId 候选人ID
 */
export async function getMyInterviews(candidateId: string): Promise<Interview[]> {
  console.log('[面试API] 获取我的面试列表, 候选人ID:', candidateId)

  const {data, error} = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('interview_time', {ascending: true})

  if (error) {
    console.error('[面试API] 查询失败:', error)
    throw new Error(`查询面试列表失败: ${error.message}`)
  }

  console.log('[面试API] 查询成功, 数量:', data?.length || 0)
  return Array.isArray(data) ? data : []
}

/**
 * 确认参加面试
 * @param id 面试ID
 */
export async function confirmInterview(id: string): Promise<boolean> {
  console.log('[面试API] 确认参加面试, ID:', id)

  const {error} = await supabase
    .from('interviews')
    .update({
      confirm_status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[面试API] 确认失败:', error)
    throw new Error(`确认面试失败: ${error.message}`)
  }

  console.log('[面试API] 确认成功')
  return true
}

/**
 * 申请改期面试
 * @param id 面试ID
 * @param reason 改期原因
 */
export async function rescheduleInterview(id: string, reason: string): Promise<boolean> {
  console.log('[面试API] 申请改期, ID:', id, '原因:', reason)

  const {error} = await supabase
    .from('interviews')
    .update({
      confirm_status: 'rescheduled',
      reschedule_reason: reason,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[面试API] 改期申请失败:', error)
    throw new Error(`申请改期失败: ${error.message}`)
  }

  console.log('[面试API] 改期申请成功')
  return true
}

/**
 * 响应Offer
 * @param id 面试ID
 * @param response 响应结果（accepted/declined）
 */
export async function respondToOffer(id: string, response: 'accepted' | 'declined'): Promise<boolean> {
  console.log('[面试API] 响应Offer, ID:', id, '结果:', response)

  const {error} = await supabase
    .from('interviews')
    .update({
      offer_response: response,
      offer_response_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[面试API] 响应失败:', error)
    throw new Error(`响应Offer失败: ${error.message}`)
  }

  console.log('[面试API] 响应成功')
  return true
}

// ============================================
// 管理端API
// ============================================

/**
 * 获取面试列表
 * @param tenantId 租户ID
 * @param status 状态筛选（可选）
 */
export async function getInterviewList(tenantId: string, status?: string): Promise<Interview[]> {
  console.log('[面试API] 获取面试列表, 租户ID:', tenantId, '状态:', status)

  let query = supabase.from('interviews').select('*').eq('tenant_id', tenantId)

  if (status) {
    query = query.eq('status', status)
  }

  const {data, error} = await query.order('interview_time', {ascending: true})

  if (error) {
    console.error('[面试API] 查询失败:', error)
    throw new Error(`查询面试列表失败: ${error.message}`)
  }

  console.log('[面试API] 查询成功, 数量:', data?.length || 0)
  return Array.isArray(data) ? data : []
}

/**
 * 安排面试
 * @param data 面试数据
 */
export async function scheduleInterview(data: Partial<Interview>): Promise<Interview> {
  console.log('[面试API] 安排面试, 数据:', data)

  const {data: result, error} = await supabase
    .from('interviews')
    .insert({
      ...data,
      status: 'scheduled',
      confirm_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('[面试API] 安排失败:', error)
    throw new Error(`安排面试失败: ${error.message}`)
  }

  console.log('[面试API] 安排成功, ID:', result.id)
  return result
}

/**
 * 评估面试
 * @param id 面试ID
 * @param evaluation 评估数据
 */
export async function evaluateInterview(
  id: string,
  evaluation: {
    interviewer_id: string
    interviewer_name: string
    evaluation_score: number
    evaluation_notes?: string
    technical_score?: number
    communication_score?: number
    attitude_score?: number
  }
): Promise<boolean> {
  console.log('[面试API] 评估面试, ID:', id, '评估:', evaluation)

  const {error} = await supabase
    .from('interviews')
    .update({
      ...evaluation,
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[面试API] 评估失败:', error)
    throw new Error(`评估面试失败: ${error.message}`)
  }

  console.log('[面试API] 评估成功')
  return true
}

/**
 * 发送Offer
 * @param id 面试ID
 * @param decision 决定（approved/rejected）
 * @param rejectionReason 拒绝原因（可选）
 */
export async function sendOffer(
  id: string,
  decision: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<boolean> {
  console.log('[面试API] 发送Offer, ID:', id, '决定:', decision)

  const updateData: any = {
    offer_decision: decision,
    offer_sent_time: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  if (decision === 'approved') {
    updateData.offer_response = 'pending'
  }

  if (decision === 'rejected' && rejectionReason) {
    updateData.rejection_reason = rejectionReason
  }

  const {error} = await supabase.from('interviews').update(updateData).eq('id', id)

  if (error) {
    console.error('[面试API] 发送失败:', error)
    throw new Error(`发送Offer失败: ${error.message}`)
  }

  console.log('[面试API] 发送成功')
  return true
}

/**
 * 获取Offer状态列表
 * @param tenantId 租户ID
 */
export async function getOfferStatus(tenantId: string): Promise<Interview[]> {
  console.log('[面试API] 获取Offer状态, 租户ID:', tenantId)

  const {data, error} = await supabase
    .from('interviews')
    .select('*')
    .eq('tenant_id', tenantId)
    .not('offer_decision', 'is', null)
    .order('offer_sent_time', {ascending: false})

  if (error) {
    console.error('[面试API] 查询失败:', error)
    throw new Error(`查询Offer状态失败: ${error.message}`)
  }

  console.log('[面试API] 查询成功, 数量:', data?.length || 0)
  return Array.isArray(data) ? data : []
}

/**
 * 获取待确认的面试列表
 * @param tenantId 租户ID
 */
export async function getPendingConfirmInterviews(tenantId: string): Promise<Interview[]> {
  console.log('[面试API] 获取待确认面试, 租户ID:', tenantId)

  const {data, error} = await supabase
    .from('interviews')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('confirm_status', 'pending')
    .eq('status', 'scheduled')
    .order('interview_time', {ascending: true})

  if (error) {
    console.error('[面试API] 查询失败:', error)
    throw new Error(`查询待确认面试失败: ${error.message}`)
  }

  console.log('[面试API] 查询成功, 数量:', data?.length || 0)
  return Array.isArray(data) ? data : []
}

/**
 * 获取待评估的面试列表
 * @param tenantId 租户ID
 */
export async function getPendingEvaluationInterviews(tenantId: string): Promise<Interview[]> {
  console.log('[面试API] 获取待评估面试, 租户ID:', tenantId)

  const {data, error} = await supabase
    .from('interviews')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('confirm_status', 'confirmed')
    .eq('status', 'scheduled')
    .order('interview_time', {ascending: true})

  if (error) {
    console.error('[面试API] 查询失败:', error)
    throw new Error(`查询待评估面试失败: ${error.message}`)
  }

  console.log('[面试API] 查询成功, 数量:', data?.length || 0)
  return Array.isArray(data) ? data : []
}
