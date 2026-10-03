/**
 * 用户管理模块
 * 包含用户信息、员工管理、权限管理等功能
 */

import {supabase} from '@/client/supabase'
import type {Employee, Profile, UserRole} from '../types'

// ==================== 用户基础 API ====================

/**
 * 获取当前登录用户信息
 */
export async function getCurrentUser(): Promise<Profile | null> {
  const {
    data: {user}
  } = await supabase.auth.getUser()

  if (!user) return null

  const {data, error} = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()

  if (error) {
    console.error('获取当前用户失败:', error)
    return null
  }
  return data
}

/**
 * 根据用户ID获取用户信息
 */
export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  const {data, error} = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
  return data
}

/**
 * 获取租户的所有用户
 */
export async function getUsersByTenantId(tenantId: string): Promise<Profile[]> {
  const {data, error} = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取租户用户失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 获取所有用户（超级管理员）
 */
export async function getAllProfiles(): Promise<Profile[]> {
  const {data, error} = await supabase.from('profiles').select('*').order('created_at', {ascending: false})

  if (error) {
    console.error('获取所有用户失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 更新用户状态
 */
export async function updateUserStatus(userId: string, status: string): Promise<boolean> {
  const {error} = await supabase
    .from('profiles')
    .update({
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('更新用户状态失败:', error)
    return false
  }
  return true
}

/**
 * 删除用户
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    // 1. 删除关联的员工记录
    await supabase.from('employees').delete().eq('user_id', userId)

    // 2. 删除用户记录
    const {error} = await supabase.from('profiles').delete().eq('id', userId)

    if (error) {
      console.error('删除用户失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除用户异常:', error)
    return false
  }
}

/**
 * 更新用户信息
 */
export async function updateUserProfile(id: string, updates: Partial<Profile>): Promise<boolean> {
  const {error} = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('更新用户信息失败:', error)
    return false
  }
  return true
}

/**
 * 更新用户角色
 */
export async function updateUserRole(userId: string, role: UserRole): Promise<boolean> {
  // G0-Z1: profiles.role 为 protected column，前端直写已被列级权限拒绝；
  // 一律走服务端受控指派 RPC（白名单/本租户/不可自改/审计）
  const {error} = await supabase.rpc('admin_assign_member_role', {
    p_target_user: userId,
    p_new_role: role
  })

  if (error) {
    console.error('更新用户角色失败:', error)
    return false
  }
  return true
}

/**
 * 将游客转换为租户管理员
 */
export async function convertGuestToTenantAdmin(userId: string, tenantId: string): Promise<boolean> {
  const {error} = await supabase
    .from('profiles')
    .update({
      role: 'tenant_admin' as UserRole,
      tenant_id: tenantId
    })
    .eq('id', userId)

  if (error) {
    console.error('转换用户角色失败:', error)
    return false
  }
  return true
}

// ==================== 员工管理 API ====================

/**
 * 获取租户的所有员工
 */
export async function getEmployeesByTenantId(tenantId: string): Promise<Employee[]> {
  const {data, error} = await supabase
    .from('employees')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

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
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取门店员工失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取员工信息
 */
export async function getEmployeeById(id: string): Promise<Employee | null> {
  const {data, error} = await supabase
    .from('employees')
    .select('*, stores(name), brands(name)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('获取员工信息失败:', error)
    return null
  }
  return data
}

/**
 * 根据用户ID获取员工信息
 */
export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  console.log('getEmployeeByUserId: 开始查询，用户ID:', userId)
  const {data, error} = await supabase.from('employees').select('*').eq('user_id', userId).maybeSingle()

  if (error) {
    console.error('getEmployeeByUserId: 查询失败:', error)
    return null
  }

  console.log('getEmployeeByUserId: 查询结果:', data)
  return data
}

/**
 * 创建员工
 */
export async function createEmployee(employee: Partial<Employee>): Promise<Employee | null> {
  // 检查是否已存在同名员工
  const {data: existing} = await supabase
    .from('employees')
    .select('id')
    .eq('tenant_id', employee.tenant_id!)
    .eq('name', employee.name!)
    .maybeSingle()

  if (existing) {
    console.error('员工已存在')
    return null
  }

  const {data, error} = await supabase
    .from('employees')
    .insert({
      tenant_id: employee.tenant_id,
      store_id: employee.store_id,
      brand_id: employee.brand_id,
      user_id: employee.user_id,
      name: employee.name,
      phone: employee.phone,
      position: employee.position,
      employee_type: employee.employee_type || 'full_time',
      department: employee.department || 'front',
      status: employee.status || 'active',
      monthly_salary: employee.monthly_salary,
      daily_work_hours: employee.daily_work_hours,
      rest_days_per_month: employee.rest_days_per_month
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建员工失败:', error)
    return null
  }
  return data
}

/**
 * 更新员工信息
 */
export async function updateEmployee(id: string, updates: Partial<Employee>): Promise<boolean> {
  // 如果更新名称，检查是否重复
  if (updates.name) {
    const {data: employee} = await supabase.from('employees').select('tenant_id').eq('id', id).maybeSingle()

    if (employee) {
      const {data: existing} = await supabase
        .from('employees')
        .select('id')
        .eq('tenant_id', employee.tenant_id)
        .eq('name', updates.name)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        console.error('员工名称已存在')
        return false
      }
    }
  }

  const {error} = await supabase
    .from('employees')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('更新员工失败:', error)
    return false
  }
  return true
}

/**
 * 删除员工
 */
export async function deleteEmployee(id: string): Promise<boolean> {
  try {
    // 检查是否有关联的排班记录
    const {data: schedules} = await supabase.from('schedules').select('id').eq('employee_id', id).limit(1)

    if (schedules && schedules.length > 0) {
      console.error('员工有关联的排班记录，无法删除')
      return false
    }

    // 删除员工
    const {error} = await supabase.from('employees').delete().eq('id', id)

    if (error) {
      console.error('删除员工失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除员工异常:', error)
    return false
  }
}

/**
 * 批量导入员工
 */
export async function batchImportEmployees(
  employees: Partial<Employee>[],
  tenantId: string,
  importedBy: string
): Promise<{
  success: boolean
  successCount: number
  failCount: number
  errors: string[]
}> {
  const errors: string[] = []
  let successCount = 0
  let failCount = 0

  for (const emp of employees) {
    try {
      // 检查必填字段
      if (!emp.name || !emp.store_id) {
        errors.push(`员工 ${emp.name || '未知'}: 缺少必填字段`)
        failCount++
        continue
      }

      // 检查是否已存在
      const {data: existing} = await supabase
        .from('employees')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('name', emp.name)
        .maybeSingle()

      if (existing) {
        errors.push(`员工 ${emp.name}: 已存在`)
        failCount++
        continue
      }

      // 创建员工
      const {error} = await supabase.from('employees').insert({
        tenant_id: tenantId,
        store_id: emp.store_id,
        brand_id: emp.brand_id,
        name: emp.name,
        phone: emp.phone,
        position: emp.position,
        employee_type: emp.employee_type || 'full_time',
        department: emp.department || 'front',
        status: emp.status || 'active',
        monthly_salary: emp.monthly_salary,
        daily_work_hours: emp.daily_work_hours,
        rest_days_per_month: emp.rest_days_per_month
      })

      if (error) {
        errors.push(`员工 ${emp.name}: ${error.message}`)
        failCount++
      } else {
        successCount++
      }
    } catch (error) {
      errors.push(`员工 ${emp.name || '未知'}: ${error instanceof Error ? error.message : '未知错误'}`)
      failCount++
    }
  }

  // 记录导入日志
  await supabase.from('employee_import_logs').insert({
    tenant_id: tenantId,
    imported_by: importedBy,
    total_count: employees.length,
    success_count: successCount,
    fail_count: failCount,
    errors: errors.length > 0 ? errors : null
  })

  return {
    success: failCount === 0,
    successCount,
    failCount,
    errors
  }
}

/**
 * 获取正式员工数量
 */
export async function getRegularEmployeeCount(tenantId: string, storeId: string) {
  const {data, error} = await supabase
    .from('employees')
    .select('id', {count: 'exact'})
    .eq('tenant_id', tenantId)
    .eq('store_id', storeId)
    .eq('employment_type', 'full_time')
    .eq('status', 'active')

  if (error) {
    console.error('获取正式员工数量失败:', error)
    return 0
  }

  return data?.length || 0
}
