/**
 * 员工中心API接口
 */

import {supabase} from '@/client/supabase'
import type {Employee, EmployeeDetail, EmployeeFilter, EmployeeListResponse, EmployeeStats} from './types-employee-hub'

// ============================================
// 员工管理
// ============================================

/**
 * 获取所有员工列表
 */
export async function getAllEmployees(filter?: EmployeeFilter): Promise<Employee[]> {
  let query = supabase.from('employees').select('*').order('created_at', {ascending: false})

  // 应用筛选条件
  if (filter?.department) {
    query = query.eq('department', filter.department)
  }
  if (filter?.position) {
    query = query.eq('position', filter.position)
  }
  if (filter?.status) {
    query = query.eq('status', filter.status)
  }
  if (filter?.employment_type) {
    query = query.eq('employee_type', filter.employment_type)
  }
  if (filter?.search) {
    query = query.or(`name.ilike.%${filter.search}%,phone.ilike.%${filter.search}%`)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取员工列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取员工详情
 */
export async function getEmployeeDetail(id: string): Promise<EmployeeDetail | null> {
  const {data, error} = await supabase.from('employees').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取员工详情失败:', error)
    return null
  }

  return data
}

/**
 * 创建员工
 */
export async function createEmployee(employee: Partial<Employee>): Promise<Employee | null> {
  const {data, error} = await supabase.from('employees').insert(employee).select().maybeSingle()

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
  const {error} = await supabase.from('employees').update(updates).eq('id', id)

  if (error) {
    console.error('更新员工信息失败:', error)
    return false
  }

  return true
}

/**
 * 删除员工
 */
export async function deleteEmployee(id: string): Promise<boolean> {
  const {error} = await supabase.from('employees').delete().eq('id', id)

  if (error) {
    console.error('删除员工失败:', error)
    return false
  }

  return true
}

// ============================================
// 员工统计
// ============================================

/**
 * 获取员工统计数据
 */
export async function getEmployeeStats(): Promise<EmployeeStats> {
  const employees = await getAllEmployees()

  const stats: EmployeeStats = {
    total: employees.length,
    active: employees.filter((e) => e.status === 'active').length,
    on_leave: employees.filter((e) => e.status === 'on_leave').length,
    resigned: employees.filter((e) => e.status === 'resigned').length,
    by_department: {},
    by_position: {},
    by_employment_type: {},
    new_this_month: 0,
    resigned_this_month: 0
  }

  // 按部门统计
  employees.forEach((emp) => {
    if (emp.department) {
      stats.by_department[emp.department] = (stats.by_department[emp.department] || 0) + 1
    }
  })

  // 按岗位统计
  employees.forEach((emp) => {
    if (emp.position) {
      stats.by_position[emp.position] = (stats.by_position[emp.position] || 0) + 1
    }
  })

  // 按用工类型统计
  employees.forEach((emp) => {
    if (emp.employee_type) {
      stats.by_employment_type[emp.employee_type] = (stats.by_employment_type[emp.employee_type] || 0) + 1
    }
  })

  // 本月新入职
  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)
  thisMonthStart.setHours(0, 0, 0, 0)

  stats.new_this_month = employees.filter((emp) => {
    const createdAt = new Date(emp.created_at)
    return createdAt >= thisMonthStart && emp.status === 'active'
  }).length

  // 本月离职
  stats.resigned_this_month = employees.filter((emp) => {
    const updatedAt = new Date(emp.updated_at)
    return updatedAt >= thisMonthStart && emp.status === 'resigned'
  }).length

  return stats
}

/**
 * 获取员工列表（包含统计）
 */
export async function getEmployeeListWithStats(filter?: EmployeeFilter): Promise<EmployeeListResponse> {
  const [employees, stats] = await Promise.all([getAllEmployees(filter), getEmployeeStats()])

  return {
    employees,
    total: employees.length,
    stats
  }
}

// ============================================
// 部门和岗位
// ============================================

/**
 * 获取所有部门列表
 */
export async function getDepartments(): Promise<string[]> {
  const {data, error} = await supabase.from('employees').select('department').not('department', 'is', null)

  if (error) {
    console.error('获取部门列表失败:', error)
    return []
  }

  const departments = Array.isArray(data) ? data.map((item) => item.department).filter((d): d is string => !!d) : []

  // 去重
  return Array.from(new Set(departments))
}

/**
 * 获取所有岗位列表
 */
export async function getPositions(): Promise<string[]> {
  const {data, error} = await supabase.from('employees').select('position').not('position', 'is', null)

  if (error) {
    console.error('获取岗位列表失败:', error)
    return []
  }

  const positions = Array.isArray(data) ? data.map((item) => item.position).filter((p): p is string => !!p) : []

  // 去重
  return Array.from(new Set(positions))
}

// ============================================
// 批量操作
// ============================================

/**
 * 批量创建员工
 */
export async function batchCreateEmployees(
  employees: Omit<Employee, 'id' | 'created_at' | 'updated_at'>[]
): Promise<Employee[]> {
  const {data, error} = await supabase.from('employees').insert(employees).select()

  if (error) {
    console.error('批量创建员工失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}
