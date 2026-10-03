/**
 * 成本管理模块
 * 包含成本数据、效能标准配置等功能
 */

import {supabase} from '@/client/supabase'
import type {CostData, EfficiencyStandard} from '../types'

// ==================== 成本数据 API ====================

/**
 * 获取租户的成本数据
 */
export async function getCostDataByTenantId(
  tenantId: string,
  options?: {
    startDate?: string
    endDate?: string
    storeId?: string
  }
) {
  let query = supabase.from('cost_data').select('*, stores(name)').eq('tenant_id', tenantId)

  if (options?.startDate) {
    query = query.gte('data_date', options.startDate)
  }
  if (options?.endDate) {
    query = query.lte('data_date', options.endDate)
  }
  if (options?.storeId) {
    query = query.eq('store_id', options.storeId)
  }

  const {data, error} = await query.order('data_date', {ascending: false})

  if (error) {
    console.error('获取成本数据失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 创建或更新成本数据
 */
export async function upsertCostData(data: Partial<CostData>): Promise<boolean> {
  const {error} = await supabase.from('cost_data').upsert(
    {
      tenant_id: data.tenant_id,
      store_id: data.store_id,
      data_date: data.data_date,
      revenue: data.revenue,
      labor_cost: data.labor_cost,
      labor_cost_ratio: data.labor_cost_ratio,
      employee_count: data.employee_count,
      avg_efficiency: data.avg_efficiency,
      updated_at: new Date().toISOString()
    },
    {onConflict: 'tenant_id,store_id,data_date'}
  )

  if (error) {
    console.error('保存成本数据失败:', error)
    return false
  }
  return true
}

// ==================== 效能标准配置 API ====================

/**
 * 获取租户的效能标准
 */
export async function getTenantEfficiencyStandard(tenantId: string) {
  const {data, error} = await supabase
    .from('efficiency_standards')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('store_id', null)
    .maybeSingle()

  if (error) {
    console.error('获取租户效能标准失败:', error)
    return null
  }

  return data
}

/**
 * 获取门店的效能标准
 */
export async function getStoreEfficiencyStandard(tenantId: string, storeId: string) {
  // 先查询门店专属标准
  const {data: storeStandard} = await supabase
    .from('efficiency_standards')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .maybeSingle()

  if (storeStandard) {
    return storeStandard
  }

  // 如果没有门店专属标准，返回租户标准
  const {data: tenantStandard} = await supabase
    .from('efficiency_standards')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('store_id', null)
    .maybeSingle()

  return tenantStandard
}

/**
 * 创建或更新效能标准
 */
export async function upsertEfficiencyStandard(standard: Partial<EfficiencyStandard>) {
  const {data, error} = await supabase
    .from('efficiency_standards')
    .upsert(
      {
        tenant_id: standard.tenant_id,
        store_id: standard.store_id,
        low_revenue_max: standard.low_revenue_max,
        low_efficiency_standard: standard.low_efficiency_standard,
        low_management_motto: standard.low_management_motto,
        normal_revenue_min: standard.normal_revenue_min,
        normal_revenue_max: standard.normal_revenue_max,
        normal_efficiency_standard: standard.normal_efficiency_standard,
        normal_management_motto: standard.normal_management_motto,
        high_revenue_min: standard.high_revenue_min,
        high_efficiency_standard: standard.high_efficiency_standard,
        high_management_motto: standard.high_management_motto,
        updated_at: new Date().toISOString()
      },
      {onConflict: standard.store_id ? 'tenant_id,store_id' : 'tenant_id'}
    )
    .select()
    .maybeSingle()

  if (error) {
    console.error('保存效能标准失败:', error)
    return null
  }
  return data
}

/**
 * 计算营收区间
 */
export function calculateRevenueZone(
  revenue: number,
  standard: EfficiencyStandard
): {
  zone: 'low' | 'normal' | 'high'
  efficiency: number
  motto: string
} {
  // 判断营收区间
  if (revenue <= (standard.low_revenue_max || 0)) {
    return {
      zone: 'low',
      efficiency: standard.low_efficiency_standard || 0,
      motto: standard.low_management_motto || ''
    }
  } else if (revenue >= (standard.normal_revenue_min || 0) && revenue <= (standard.normal_revenue_max || 0)) {
    return {
      zone: 'normal',
      efficiency: standard.normal_efficiency_standard || 0,
      motto: standard.normal_management_motto || ''
    }
  } else {
    return {
      zone: 'high',
      efficiency: standard.high_efficiency_standard || 0,
      motto: standard.high_management_motto || ''
    }
  }
}

/**
 * 评估效能
 */
export function evaluateEfficiency(
  actualRevenue: number,
  actualLaborCost: number,
  standard: EfficiencyStandard
): {
  expectedEfficiency: number
  actualEfficiency: number
  efficiencyGap: number
  evaluation: 'excellent' | 'good' | 'normal' | 'poor'
  zone: 'low' | 'normal' | 'high'
  motto: string
} {
  // 计算实际效能
  const actualEfficiency = actualLaborCost > 0 ? actualRevenue / actualLaborCost : 0

  // 获取标准值
  const zoneInfo = calculateRevenueZone(actualRevenue, standard)
  const expectedEfficiency = zoneInfo.efficiency

  // 计算差距
  const efficiencyGap = actualEfficiency - expectedEfficiency

  // 评估等级
  let evaluation: 'excellent' | 'good' | 'normal' | 'poor'
  if (efficiencyGap >= 100) {
    evaluation = 'excellent'
  } else if (efficiencyGap >= 0) {
    evaluation = 'good'
  } else if (efficiencyGap >= -100) {
    evaluation = 'normal'
  } else {
    evaluation = 'poor'
  }

  return {
    expectedEfficiency,
    actualEfficiency,
    efficiencyGap,
    evaluation,
    zone: zoneInfo.zone,
    motto: zoneInfo.motto
  }
}

/**
 * 检查是否有效能标准配置
 */
export async function hasEfficiencyStandard(tenantId: string): Promise<boolean> {
  const {data, error} = await supabase.from('efficiency_standards').select('id').eq('tenant_id', tenantId).limit(1)

  if (error) {
    console.error('检查效能标准失败:', error)
    return false
  }

  return data && data.length > 0
}
