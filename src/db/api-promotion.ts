// 晋升管理API接口

import {supabase} from '@/client/supabase'
import type {
  CreatePromotionApplicationInput,
  PromotionApplication,
  PromotionData,
  PromotionHistory,
  PromotionPath,
  PromotionPathWithRequirements,
  PromotionStatistics
} from './types-promotion'

// ==================== 晋升路径 ====================

/**
 * 获取活跃的晋升路径列表
 */
export async function getActivePromotionPaths(tenantId: string): Promise<PromotionPath[]> {
  const {data, error} = await supabase
    .from('promotion_paths')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('from_level', {ascending: true})

  if (error) {
    console.error('获取晋升路径失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取晋升路径详情（包含条件）
 */
export async function getPromotionPathWithRequirements(pathId: string): Promise<PromotionPathWithRequirements | null> {
  const {data, error} = await supabase
    .from('promotion_paths')
    .select(
      `
      *,
      requirements:promotion_requirements(*)
    `
    )
    .eq('id', pathId)
    .maybeSingle()

  if (error) {
    console.error('获取晋升路径详情失败:', error)
    return null
  }

  return data
}

/**
 * 获取员工可用的晋升路径
 */
export async function getAvailablePromotionPaths(
  tenantId: string,
  currentPosition: string,
  currentLevel: number
): Promise<PromotionPathWithRequirements[]> {
  const {data, error} = await supabase
    .from('promotion_paths')
    .select(
      `
      *,
      requirements:promotion_requirements(*)
    `
    )
    .eq('tenant_id', tenantId)
    .eq('from_position', currentPosition)
    .eq('from_level', currentLevel)
    .eq('is_active', true)
    .order('to_level', {ascending: true})

  if (error) {
    console.error('获取可用晋升路径失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 晋升申请 ====================

/**
 * 获取员工的晋升申请列表
 */
export async function getEmployeePromotionApplications(employeeId: string): Promise<PromotionApplication[]> {
  const {data, error} = await supabase
    .from('promotion_applications')
    .select('*')
    .eq('employee_id', employeeId)
    .order('application_date', {ascending: false})

  if (error) {
    console.error('获取晋升申请失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建晋升申请
 */
export async function createPromotionApplication(
  input: CreatePromotionApplicationInput
): Promise<PromotionApplication | null> {
  const {data, error} = await supabase
    .from('promotion_applications')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      promotion_path_id: input.promotion_path_id,
      current_position: input.current_position,
      target_position: input.target_position,
      current_level: input.current_level,
      target_level: input.target_level,
      reason: input.reason || null,
      status: 'pending'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建晋升申请失败:', error)
    return null
  }

  return data
}

/**
 * 取消晋升申请
 */
export async function cancelPromotionApplication(applicationId: string): Promise<boolean> {
  const {error} = await supabase
    .from('promotion_applications')
    .update({
      status: 'cancelled'
    })
    .eq('id', applicationId)

  if (error) {
    console.error('取消晋升申请失败:', error)
    return false
  }

  return true
}

// ==================== 晋升历史 ====================

/**
 * 获取员工的晋升历史
 */
export async function getEmployeePromotionHistory(employeeId: string): Promise<PromotionHistory[]> {
  const {data, error} = await supabase
    .from('promotion_history')
    .select('*')
    .eq('employee_id', employeeId)
    .order('promotion_date', {ascending: false})

  if (error) {
    console.error('获取晋升历史失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

// ==================== 统计数据 ====================

/**
 * 获取晋升统计
 */
export async function getPromotionStatistics(employeeId: string): Promise<PromotionStatistics> {
  const applications = await getEmployeePromotionApplications(employeeId)
  const history = await getEmployeePromotionHistory(employeeId)

  const totalApplications = applications.length
  const pendingApplications = applications.filter((a) => a.status === 'pending').length
  const approvedApplications = applications.filter((a) => a.status === 'approved').length
  const rejectedApplications = applications.filter((a) => a.status === 'rejected').length
  const totalPromotions = history.length

  // 计算平均任职时长
  let averageTenureMonths = 0
  if (history.length > 1) {
    const tenures: number[] = []
    for (let i = 0; i < history.length - 1; i++) {
      const current = new Date(history[i].promotion_date)
      const next = new Date(history[i + 1].promotion_date)
      const months = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24 * 30))
      tenures.push(months)
    }
    averageTenureMonths = Math.floor(tenures.reduce((sum, t) => sum + t, 0) / tenures.length)
  }

  return {
    total_applications: totalApplications,
    pending_applications: pendingApplications,
    approved_applications: approvedApplications,
    rejected_applications: rejectedApplications,
    total_promotions: totalPromotions,
    average_tenure_months: averageTenureMonths
  }
}

/**
 * 获取员工晋升数据
 */
export async function getEmployeePromotionData(
  employeeId: string,
  tenantId: string,
  currentPosition: string,
  currentLevel: number
): Promise<PromotionData | null> {
  try {
    // 获取可用的晋升路径
    const availablePaths = await getAvailablePromotionPaths(tenantId, currentPosition, currentLevel)

    // 获取我的申请
    const myApplications = await getEmployeePromotionApplications(employeeId)

    // 获取晋升历史
    const promotionHistory = await getEmployeePromotionHistory(employeeId)

    // 获取统计数据
    const statistics = await getPromotionStatistics(employeeId)

    return {
      available_paths: availablePaths,
      my_applications: myApplications,
      promotion_history: promotionHistory,
      statistics
    }
  } catch (error) {
    console.error('获取晋升数据失败:', error)
    return null
  }
}

/**
 * 计算职级差距
 */
export function calculateLevelGap(fromLevel: number, toLevel: number): number {
  return toLevel - fromLevel
}

/**
 * 格式化任职时长
 */
export function formatTenure(months: number): string {
  if (months < 12) {
    return `${months}个月`
  }
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) {
    return `${years}年`
  }
  return `${years}年${remainingMonths}个月`
}
