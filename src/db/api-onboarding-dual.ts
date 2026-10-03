/**
 * 入职办理API - 双线设计
 *
 * 员工线：填写信息、确认物品、查看宿舍、联系师傅
 * 管理线：审核信息、发放物品、安排宿舍、分配师傅
 */

import {supabase} from '@/client/supabase'
import type {OnboardingProcess} from './types-dual-line'

// ============================================
// 员工端API
// ============================================

/**
 * 获取我的入职流程
 * @param employeeId 员工ID
 */
export async function getMyOnboarding(employeeId: string): Promise<OnboardingProcess | null> {
  console.log('[入职API] 获取我的入职流程, 员工ID:', employeeId)

  const {data, error} = await supabase
    .from('onboarding_processes')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', {ascending: false})
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[入职API] 查询失败:', error)
    throw new Error(`查询入职流程失败: ${error.message}`)
  }

  console.log('[入职API] 查询成功:', data ? '找到记录' : '未找到记录')
  return data
}

/**
 * 提交个人信息
 * @param id 入职流程ID
 */
export async function submitPersonalInfo(id: string): Promise<boolean> {
  console.log('[入职API] 提交个人信息, ID:', id)

  const {error} = await supabase
    .from('onboarding_processes')
    .update({
      info_completed: true,
      info_submitted_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[入职API] 提交失败:', error)
    throw new Error(`提交个人信息失败: ${error.message}`)
  }

  console.log('[入职API] 提交成功')
  return true
}

/**
 * 确认物品领取
 * @param id 入职流程ID
 */
export async function confirmGoodsReceived(id: string): Promise<boolean> {
  console.log('[入职API] 确认物品领取, ID:', id)

  const {error} = await supabase
    .from('onboarding_processes')
    .update({
      goods_received: true,
      goods_received_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[入职API] 确认失败:', error)
    throw new Error(`确认物品领取失败: ${error.message}`)
  }

  console.log('[入职API] 确认成功')
  return true
}

/**
 * 确认宿舍安排
 * @param id 入职流程ID
 */
export async function confirmDorm(id: string): Promise<boolean> {
  console.log('[入职API] 确认宿舍安排, ID:', id)

  const {error} = await supabase
    .from('onboarding_processes')
    .update({
      dorm_confirmed: true,
      dorm_confirmed_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[入职API] 确认失败:', error)
    throw new Error(`确认宿舍安排失败: ${error.message}`)
  }

  console.log('[入职API] 确认成功')
  return true
}

/**
 * 联系师傅
 * @param id 入职流程ID
 */
export async function contactMentor(id: string): Promise<boolean> {
  console.log('[入职API] 联系师傅, ID:', id)

  const {error} = await supabase
    .from('onboarding_processes')
    .update({
      mentor_contacted: true,
      mentor_contact_time: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[入职API] 联系失败:', error)
    throw new Error(`联系师傅失败: ${error.message}`)
  }

  console.log('[入职API] 联系成功')
  return true
}

// ============================================
// 管理端API
// ============================================

/**
 * 获取入职流程列表
 * @param tenantId 租户ID
 * @param status 状态筛选（可选）
 */
export async function getOnboardingList(tenantId: string, status?: string): Promise<OnboardingProcess[]> {
  console.log('[入职API] 获取入职流程列表, 租户ID:', tenantId, '状态:', status)

  let query = supabase.from('onboarding_processes').select('*').eq('tenant_id', tenantId)

  if (status) {
    query = query.eq('status', status)
  }

  const {data, error} = await query.order('start_date', {ascending: true})

  if (error) {
    console.error('[入职API] 查询失败:', error)
    throw new Error(`查询入职流程列表失败: ${error.message}`)
  }

  console.log('[入职API] 查询成功, 数量:', data?.length || 0)
  return Array.isArray(data) ? data : []
}

/**
 * 创建入职流程
 * @param data 入职流程数据
 */
export async function createOnboarding(data: Partial<OnboardingProcess>): Promise<OnboardingProcess> {
  console.log('[入职API] 创建入职流程, 数据:', data)

  const {data: result, error} = await supabase
    .from('onboarding_processes')
    .insert({
      ...data,
      status: 'pending',
      info_completed: false,
      goods_received: false,
      dorm_confirmed: false,
      mentor_contacted: false,
      info_approved: false,
      goods_issued: false,
      dorm_assigned: false,
      mentor_assigned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('[入职API] 创建失败:', error)
    throw new Error(`创建入职流程失败: ${error.message}`)
  }

  console.log('[入职API] 创建成功, ID:', result.id)
  return result
}

/**
 * 审核个人信息
 * @param id 入职流程ID
 * @param approverId 审核人ID
 * @param approverName 审核人姓名
 * @param notes 审核备注（可选）
 */
export async function approvePersonalInfo(
  id: string,
  approverId: string,
  approverName: string,
  notes?: string
): Promise<boolean> {
  console.log('[入职API] 审核个人信息, ID:', id, '审核人:', approverName)

  const {error} = await supabase
    .from('onboarding_processes')
    .update({
      info_approved: true,
      info_approved_time: new Date().toISOString(),
      hr_approver: approverId,
      hr_approver_name: approverName,
      approval_notes: notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[入职API] 审核失败:', error)
    throw new Error(`审核个人信息失败: ${error.message}`)
  }

  console.log('[入职API] 审核成功')
  return true
}

/**
 * 发放物品
 * @param id 入职流程ID
 * @param issuerId 发放人ID
 * @param issuerName 发放人姓名
 */
export async function issueGoods(id: string, issuerId: string, issuerName: string): Promise<boolean> {
  console.log('[入职API] 发放物品, ID:', id, '发放人:', issuerName)

  const {error} = await supabase
    .from('onboarding_processes')
    .update({
      goods_issued: true,
      goods_issued_time: new Date().toISOString(),
      goods_issuer: issuerId,
      goods_issuer_name: issuerName,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[入职API] 发放失败:', error)
    throw new Error(`发放物品失败: ${error.message}`)
  }

  console.log('[入职API] 发放成功')
  return true
}

/**
 * 安排宿舍
 * @param id 入职流程ID
 * @param managerId 管理员ID
 * @param dormNumber 宿舍号
 * @param bedNumber 床位号
 */
export async function assignDorm(
  id: string,
  managerId: string,
  dormNumber: string,
  bedNumber: string
): Promise<boolean> {
  console.log('[入职API] 安排宿舍, ID:', id, '宿舍:', dormNumber, '床位:', bedNumber)

  const {error} = await supabase
    .from('onboarding_processes')
    .update({
      dorm_assigned: true,
      dorm_number: dormNumber,
      dorm_bed_number: bedNumber,
      dorm_manager: managerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[入职API] 安排失败:', error)
    throw new Error(`安排宿舍失败: ${error.message}`)
  }

  console.log('[入职API] 安排成功')
  return true
}

/**
 * 分配师傅
 * @param id 入职流程ID
 * @param assignerId 分配人ID
 * @param mentorId 师傅ID
 * @param mentorName 师傅姓名
 */
export async function assignMentor(
  id: string,
  assignerId: string,
  mentorId: string,
  mentorName: string
): Promise<boolean> {
  console.log('[入职API] 分配师傅, ID:', id, '师傅:', mentorName)

  const {error} = await supabase
    .from('onboarding_processes')
    .update({
      mentor_assigned: true,
      mentor_assigned_time: new Date().toISOString(),
      mentor_assigner: assignerId,
      mentor_id: mentorId,
      mentor_name: mentorName,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[入职API] 分配失败:', error)
    throw new Error(`分配师傅失败: ${error.message}`)
  }

  console.log('[入职API] 分配成功')
  return true
}

/**
 * 获取待审核的入职信息
 * @param tenantId 租户ID
 */
export async function getPendingApprovalOnboarding(tenantId: string): Promise<OnboardingProcess[]> {
  console.log('[入职API] 获取待审核入职信息, 租户ID:', tenantId)

  const {data, error} = await supabase
    .from('onboarding_processes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('info_completed', true)
    .eq('info_approved', false)
    .order('info_submitted_time', {ascending: true})

  if (error) {
    console.error('[入职API] 查询失败:', error)
    throw new Error(`查询待审核入职信息失败: ${error.message}`)
  }

  console.log('[入职API] 查询成功, 数量:', data?.length || 0)
  return Array.isArray(data) ? data : []
}

/**
 * 获取待发放物品的入职流程
 * @param tenantId 租户ID
 */
export async function getPendingGoodsIssuance(tenantId: string): Promise<OnboardingProcess[]> {
  console.log('[入职API] 获取待发放物品, 租户ID:', tenantId)

  const {data, error} = await supabase
    .from('onboarding_processes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('info_approved', true)
    .eq('goods_issued', false)
    .order('info_approved_time', {ascending: true})

  if (error) {
    console.error('[入职API] 查询失败:', error)
    throw new Error(`查询待发放物品失败: ${error.message}`)
  }

  console.log('[入职API] 查询成功, 数量:', data?.length || 0)
  return Array.isArray(data) ? data : []
}

/**
 * 更新入职流程状态
 * @param id 入职流程ID
 * @param status 新状态
 */
export async function updateOnboardingStatus(
  id: string,
  status: 'pending' | 'in_progress' | 'completed'
): Promise<boolean> {
  console.log('[入职API] 更新入职状态, ID:', id, '状态:', status)

  const {error} = await supabase
    .from('onboarding_processes')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('[入职API] 更新失败:', error)
    throw new Error(`更新入职状态失败: ${error.message}`)
  }

  console.log('[入职API] 更新成功')
  return true
}
