/**
 * 部门管理API
 * 提供部门的增删改查和统计功能
 */

import {supabase} from '@/client/supabase'
import type {
  Department,
  DepartmentFormData,
  DepartmentStats,
  DepartmentTreeNode,
  DepartmentWithDetails
} from './types-department'

/**
 * 获取租户的所有部门
 */
export async function getDepartmentsByTenantId(tenantId: string): Promise<Department[]> {
  const {data, error} = await supabase
    .from('departments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('sort_order', {ascending: true})
    .order('name', {ascending: true})

  if (error) {
    console.error('[部门管理] 获取部门列表失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取部门详情（包含关联信息）
 */
export async function getDepartmentWithDetails(departmentId: string): Promise<DepartmentWithDetails | null> {
  const {data, error} = await supabase
    .from('departments')
    .select(
      `
      *,
      parent:departments!parent_id(name),
      manager:employees!manager_id(name)
    `
    )
    .eq('id', departmentId)
    .maybeSingle()

  if (error) {
    console.error('[部门管理] 获取部门详情失败:', error)
    throw error
  }

  if (!data) return null

  // 获取员工数量
  const {count} = await supabase
    .from('employees')
    .select('id', {count: 'exact', head: true})
    .eq('department_id', departmentId)

  return {
    ...data,
    parent_name: data.parent?.name,
    manager_name: data.manager?.name,
    employee_count: count || 0
  }
}

/**
 * 创建部门
 */
export async function createDepartment(tenantId: string, formData: DepartmentFormData): Promise<Department> {
  const {data, error} = await supabase
    .from('departments')
    .insert({
      tenant_id: tenantId,
      ...formData
    })
    .select()
    .single()

  if (error) {
    console.error('[部门管理] 创建部门失败:', error)
    throw error
  }

  return data
}

/**
 * 更新部门
 */
export async function updateDepartment(
  departmentId: string,
  formData: Partial<DepartmentFormData>
): Promise<Department> {
  const {data, error} = await supabase.from('departments').update(formData).eq('id', departmentId).select().single()

  if (error) {
    console.error('[部门管理] 更新部门失败:', error)
    throw error
  }

  return data
}

/**
 * 删除部门
 */
export async function deleteDepartment(departmentId: string): Promise<boolean> {
  // 检查是否有子部门
  const {data: children} = await supabase.from('departments').select('id').eq('parent_id', departmentId).limit(1)

  if (children && children.length > 0) {
    throw new Error('该部门下有子部门，无法删除')
  }

  // 检查是否有员工
  const {data: employees} = await supabase.from('employees').select('id').eq('department_id', departmentId).limit(1)

  if (employees && employees.length > 0) {
    throw new Error('该部门下有员工，无法删除')
  }

  const {error} = await supabase.from('departments').delete().eq('id', departmentId)

  if (error) {
    console.error('[部门管理] 删除部门失败:', error)
    throw error
  }

  return true
}

/**
 * 停用/启用部门
 */
export async function toggleDepartmentStatus(departmentId: string, status: 'active' | 'inactive'): Promise<boolean> {
  const {error} = await supabase.from('departments').update({status}).eq('id', departmentId)

  if (error) {
    console.error('[部门管理] 更新部门状态失败:', error)
    throw error
  }

  return true
}

/**
 * 获取部门树结构
 */
export async function getDepartmentTree(tenantId: string): Promise<DepartmentTreeNode[]> {
  const departments = await getDepartmentsByTenantId(tenantId)

  // 获取每个部门的员工数量
  const {data: employeeCounts} = await supabase
    .from('employees')
    .select('department_id')
    .eq('tenant_id', tenantId)
    .not('department_id', 'is', null)

  const countMap = new Map<string, number>()
  if (Array.isArray(employeeCounts)) {
    employeeCounts.forEach((item) => {
      const deptId = item.department_id
      if (deptId) {
        countMap.set(deptId, (countMap.get(deptId) || 0) + 1)
      }
    })
  }

  // 获取部门负责人信息
  const managerIds = departments.filter((d) => d.manager_id).map((d) => d.manager_id!)
  const {data: managers} = await supabase.from('employees').select('id, name').in('id', managerIds)

  const managerMap = new Map<string, string>()
  if (Array.isArray(managers)) {
    managers.forEach((m) => {
      managerMap.set(m.id, m.name)
    })
  }

  // 构建树结构
  const buildTree = (parentId: string | null | undefined, level: number): DepartmentTreeNode[] => {
    return departments
      .filter((d) => d.parent_id === parentId)
      .map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        parent_id: d.parent_id,
        manager_id: d.manager_id,
        manager_name: d.manager_id ? managerMap.get(d.manager_id) : undefined,
        employee_count: countMap.get(d.id) || 0,
        children: buildTree(d.id, level + 1),
        level
      }))
  }

  return buildTree(null, 0)
}

/**
 * 获取部门统计信息
 */
export async function getDepartmentStats(tenantId: string): Promise<DepartmentStats> {
  const departments = await getDepartmentsByTenantId(tenantId)

  const {count: employeeCount} = await supabase
    .from('employees')
    .select('id', {count: 'exact', head: true})
    .eq('tenant_id', tenantId)
    .not('department_id', 'is', null)

  return {
    total_departments: departments.length,
    active_departments: departments.filter((d) => d.status === 'active').length,
    inactive_departments: departments.filter((d) => d.status === 'inactive').length,
    total_employees: employeeCount || 0,
    departments_with_manager: departments.filter((d) => d.manager_id).length,
    departments_without_manager: departments.filter((d) => !d.manager_id).length
  }
}

/**
 * 获取可选的父部门列表（排除自己和子孙部门）
 */
export async function getAvailableParentDepartments(
  tenantId: string,
  currentDepartmentId?: string
): Promise<Department[]> {
  const allDepartments = await getDepartmentsByTenantId(tenantId)

  if (!currentDepartmentId) {
    return allDepartments
  }

  // 获取所有子孙部门ID
  const getDescendantIds = (deptId: string): string[] => {
    const children = allDepartments.filter((d) => d.parent_id === deptId)
    const childIds = children.map((c) => c.id)
    const descendantIds = children.flatMap((c) => getDescendantIds(c.id))
    return [...childIds, ...descendantIds]
  }

  const excludeIds = [currentDepartmentId, ...getDescendantIds(currentDepartmentId)]

  return allDepartments.filter((d) => !excludeIds.includes(d.id))
}

/**
 * 更新部门排序
 */
export async function updateDepartmentOrder(departmentId: string, sortOrder: number): Promise<boolean> {
  const {error} = await supabase.from('departments').update({sort_order: sortOrder}).eq('id', departmentId)

  if (error) {
    console.error('[部门管理] 更新部门排序失败:', error)
    throw error
  }

  return true
}

/**
 * 批量更新部门排序
 */
export async function batchUpdateDepartmentOrder(orders: {id: string; sort_order: number}[]): Promise<boolean> {
  const promises = orders.map((order) => updateDepartmentOrder(order.id, order.sort_order))

  await Promise.all(promises)

  return true
}
