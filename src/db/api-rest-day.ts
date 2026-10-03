/**
 * 排休规则API
 * 管理员工排休规则配置
 */

import {supabase} from '@/client/supabase'
import type {CreateRestDayRuleParams, RestDayRule} from './types-v2'

/**
 * 创建排休规则
 */
export async function createRestDayRule(params: CreateRestDayRuleParams): Promise<RestDayRule | null> {
  try {
    console.log('=== API: 创建排休规则 ===', params)
    const {data, error} = await supabase.from('rest_day_rules').insert(params).select().maybeSingle()

    if (error) {
      console.error('=== API: 创建排休规则失败 ===', error)
      console.error('错误详情:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    console.log('=== API: 创建排休规则成功 ===', data)
    return data
  } catch (error) {
    console.error('=== API: 创建排休规则异常 ===', error)
    throw error
  }
}

/**
 * 获取店铺的排休规则列表
 */
export async function getRestDayRules(tenantId: string, storeId?: string, activeOnly = false): Promise<RestDayRule[]> {
  try {
    console.log('=== API: 获取排休规则 ===', {tenantId, storeId, activeOnly})
    let query = supabase
      .from('rest_day_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('priority', {ascending: false})
      .order('created_at', {ascending: false})

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const {data, error} = await query

    if (error) {
      console.error('=== API: 获取排休规则失败 ===', error)
      console.error('错误详情:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log('=== API: 获取排休规则成功 ===', {数量: data?.length || 0, 数据: data})
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('=== API: 获取排休规则异常 ===', error)
    return []
  }
}

/**
 * 获取单个排休规则
 */
export async function getRestDayRule(ruleId: string): Promise<RestDayRule | null> {
  try {
    const {data, error} = await supabase.from('rest_day_rules').select('*').eq('id', ruleId).maybeSingle()

    if (error) {
      console.error('获取排休规则失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取排休规则异常:', error)
    return null
  }
}

/**
 * 更新排休规则
 */
export async function updateRestDayRule(ruleId: string, updates: Partial<RestDayRule>): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('rest_day_rules')
      .update({...updates, updated_at: new Date().toISOString()})
      .eq('id', ruleId)

    if (error) {
      console.error('更新排休规则失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('更新排休规则异常:', error)
    return false
  }
}

/**
 * 删除排休规则
 */
export async function deleteRestDayRule(ruleId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('rest_day_rules').delete().eq('id', ruleId)

    if (error) {
      console.error('删除排休规则失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除排休规则异常:', error)
    return false
  }
}

/**
 * 切换排休规则启用状态
 */
export async function toggleRestDayRuleStatus(ruleId: string, isActive: boolean): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('rest_day_rules')
      .update({is_active: isActive, updated_at: new Date().toISOString()})
      .eq('id', ruleId)

    if (error) {
      console.error('切换排休规则状态失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('切换排休规则状态异常:', error)
    return false
  }
}

/**
 * 获取员工适用的排休规则（按优先级）
 */
export async function getApplicableRestDayRules(
  tenantId: string,
  storeId: string,
  employeeId: string
): Promise<RestDayRule[]> {
  try {
    const {data, error} = await supabase
      .from('rest_day_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('priority', {ascending: false})

    if (error) {
      console.error('获取适用排休规则失败:', error)
      return []
    }

    if (!data) return []

    // 筛选适用于该员工的规则
    const applicableRules = data.filter((rule) => {
      const employees = rule.applicable_employees as string[]
      // 如果applicable_employees为空，表示适用所有员工
      return !employees || employees.length === 0 || employees.includes(employeeId)
    })

    return applicableRules
  } catch (error) {
    console.error('获取适用排休规则异常:', error)
    return []
  }
}
