// 员工管理API接口

import {supabase} from '@/client/supabase'
import type {Employee} from './types'

/**
 * 获取租户的所有员工
 */
export async function getEmployeesByTenantId(tenantId: string): Promise<Employee[]> {
  const {data, error} = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', {ascending: true})

  if (error) {
    console.error('获取员工列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取门店的所有员工
 */
export async function getEmployeesByStoreId(storeId: string): Promise<Employee[]> {
  const {data, error} = await supabase
    .from('employees')
    .select('*')
    .eq('store_id', storeId)
    .order('name', {ascending: true})

  if (error) {
    console.error('获取门店员工列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取员工信息
 */
export async function getEmployeeById(employeeId: string): Promise<Employee | null> {
  const {data, error} = await supabase.from('employees').select('*').eq('id', employeeId).maybeSingle()

  if (error) {
    console.error('获取员工信息失败:', error)
    return null
  }

  return data
}

/**
 * 搜索员工（按姓名或手机号）
 */
export async function searchEmployees(tenantId: string, keyword: string): Promise<Employee[]> {
  const {data, error} = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .or(`name.ilike.%${keyword}%,phone.ilike.%${keyword}%`)
    .order('name', {ascending: true})

  if (error) {
    console.error('搜索员工失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据用户ID获取员工信息
 */
export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  const {data, error} = await supabase.from('employees').select('*').eq('user_id', userId).maybeSingle()

  if (error) {
    console.error('根据用户ID获取员工信息失败:', error)
    return null
  }

  return data
}
