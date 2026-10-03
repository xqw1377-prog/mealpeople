/**
 * 员工权限管理API
 */

import {supabase} from '@/client/supabase'
import type {
  BatchPermissionSetting,
  CreateEmployeePermissionInput,
  CreatePositionTemplateInput,
  EmployeePermission,
  EmployeePermissionDetail,
  FunctionModule,
  FunctionModuleTree,
  PositionPermissionTemplate,
  UpdateEmployeePermissionInput
} from './types-permission'

// ============================================
// 功能模块管理
// ============================================

/**
 * 获取所有功能模块
 */
export async function getAllFunctionModules(): Promise<FunctionModule[]> {
  console.log('=== API: 开始获取所有功能模块 ===')
  const {data, error} = await supabase.from('function_modules').select('*').order('sort_order', {ascending: true})

  if (error) {
    console.error('=== API: 获取功能模块失败 ===', error)
    throw error
  }

  console.log('=== API: 功能模块获取成功 ===', {数量: data?.length || 0})
  return Array.isArray(data) ? data : []
}

/**
 * 获取功能模块树
 */
export async function getFunctionModuleTree(): Promise<FunctionModuleTree[]> {
  console.log('=== API: 开始构建功能模块树 ===')
  const modules = await getAllFunctionModules()
  console.log('=== API: 获取到的模块数据 ===', modules)

  // 构建树形结构
  const moduleMap = new Map<string, FunctionModuleTree>()
  const rootModules: FunctionModuleTree[] = []

  // 初始化所有模块
  for (const module of modules) {
    moduleMap.set(module.id, {...module, children: []})
  }

  // 构建父子关系
  for (const module of modules) {
    const treeNode = moduleMap.get(module.id)
    if (!treeNode) continue

    if (module.parent_module_id) {
      const parent = moduleMap.get(module.parent_module_id)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(treeNode)
      }
    } else {
      rootModules.push(treeNode)
    }
  }

  return rootModules
}

/**
 * 根据模块key获取模块
 */
export async function getFunctionModuleByKey(moduleKey: string): Promise<FunctionModule | null> {
  const {data, error} = await supabase.from('function_modules').select('*').eq('module_key', moduleKey).maybeSingle()

  if (error) throw error
  return data
}

// ============================================
// 员工权限管理
// ============================================

/**
 * 获取员工的所有权限
 */
export async function getEmployeePermissions(employeeId: string): Promise<EmployeePermissionDetail[]> {
  const {data, error} = await supabase
    .from('employee_permissions')
    .select(
      `
      *,
      module:function_modules(*)
    `
    )
    .eq('employee_id', employeeId)

  if (error) throw error
  return Array.isArray(data) ? data : []
}

/**
 * 获取租户下所有员工的权限
 */
export async function getTenantEmployeePermissions(tenantId: string): Promise<EmployeePermissionDetail[]> {
  const {data, error} = await supabase
    .from('employee_permissions')
    .select(
      `
      *,
      module:function_modules(*)
    `
    )
    .eq('tenant_id', tenantId)

  if (error) throw error
  return Array.isArray(data) ? data : []
}

/**
 * 创建员工权限
 */
export async function createEmployeePermission(input: CreateEmployeePermissionInput): Promise<EmployeePermission> {
  const {data, error} = await supabase
    .from('employee_permissions')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      module_id: input.module_id,
      can_view: input.can_view ?? true,
      can_edit: input.can_edit ?? false,
      can_delete: input.can_delete ?? false
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 更新员工权限
 */
export async function updateEmployeePermission(
  permissionId: string,
  input: UpdateEmployeePermissionInput
): Promise<EmployeePermission> {
  const {data, error} = await supabase
    .from('employee_permissions')
    .update({
      can_view: input.can_view,
      can_edit: input.can_edit,
      can_delete: input.can_delete
    })
    .eq('id', permissionId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 删除员工权限
 */
export async function deleteEmployeePermission(permissionId: string): Promise<void> {
  const {error} = await supabase.from('employee_permissions').delete().eq('id', permissionId)

  if (error) throw error
}

/**
 * 批量设置员工权限
 */
export async function batchSetEmployeePermissions(
  tenantId: string,
  employeeId: string,
  permissions: BatchPermissionSetting[]
): Promise<void> {
  // 先删除员工现有权限
  await supabase.from('employee_permissions').delete().eq('tenant_id', tenantId).eq('employee_id', employeeId)

  // 批量插入新权限
  const insertData = permissions.map((p) => ({
    tenant_id: tenantId,
    employee_id: employeeId,
    module_id: p.module_id,
    can_view: p.can_view,
    can_edit: p.can_edit,
    can_delete: p.can_delete
  }))

  const {error} = await supabase.from('employee_permissions').insert(insertData)

  if (error) throw error
}

/**
 * 检查员工是否有模块权限
 */
export async function checkEmployeePermission(
  employeeId: string,
  moduleKey: string,
  permissionType: 'view' | 'edit' | 'delete' = 'view'
): Promise<boolean> {
  const {data, error} = await supabase.rpc('check_employee_permission', {
    p_employee_id: employeeId,
    p_module_key: moduleKey,
    p_permission_type: permissionType
  })

  if (error) throw error
  return data ?? false
}

// ============================================
// 岗位权限模板管理
// ============================================

/**
 * 获取租户的所有岗位权限模板
 */
export async function getPositionTemplates(tenantId: string): Promise<PositionPermissionTemplate[]> {
  const {data, error} = await supabase
    .from('position_permission_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('position_name', {ascending: true})

  if (error) throw error
  return Array.isArray(data) ? data : []
}

/**
 * 获取指定岗位的权限模板
 */
export async function getPositionTemplatesByName(
  tenantId: string,
  positionName: string
): Promise<PositionPermissionTemplate[]> {
  const {data, error} = await supabase
    .from('position_permission_templates')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('position_name', positionName)

  if (error) throw error
  return Array.isArray(data) ? data : []
}

/**
 * 创建岗位权限模板
 */
export async function createPositionTemplate(input: CreatePositionTemplateInput): Promise<PositionPermissionTemplate> {
  const {data, error} = await supabase
    .from('position_permission_templates')
    .insert({
      tenant_id: input.tenant_id,
      position_name: input.position_name,
      module_id: input.module_id,
      can_view: input.can_view ?? true,
      can_edit: input.can_edit ?? false,
      can_delete: input.can_delete ?? false
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * 批量设置岗位权限模板
 */
export async function batchSetPositionTemplate(
  tenantId: string,
  positionName: string,
  permissions: BatchPermissionSetting[]
): Promise<void> {
  // 先删除该岗位的现有模板
  await supabase
    .from('position_permission_templates')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('position_name', positionName)

  // 批量插入新模板
  const insertData = permissions.map((p) => ({
    tenant_id: tenantId,
    position_name: positionName,
    module_id: p.module_id,
    can_view: p.can_view,
    can_edit: p.can_edit,
    can_delete: p.can_delete
  }))

  const {error} = await supabase.from('position_permission_templates').insert(insertData)

  if (error) throw error
}

/**
 * 删除岗位权限模板
 */
export async function deletePositionTemplate(templateId: string): Promise<void> {
  const {error} = await supabase.from('position_permission_templates').delete().eq('id', templateId)

  if (error) throw error
}

/**
 * 应用岗位模板到员工
 */
export async function applyPositionTemplateToEmployee(
  tenantId: string,
  employeeId: string,
  positionName: string
): Promise<void> {
  const {error} = await supabase.rpc('apply_position_template_to_employee', {
    p_tenant_id: tenantId,
    p_employee_id: employeeId,
    p_position_name: positionName
  })

  if (error) throw error
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取员工可访问的模块列表
 */
export async function getEmployeeAccessibleModules(employeeId: string): Promise<FunctionModule[]> {
  const permissions = await getEmployeePermissions(employeeId)
  const accessibleModuleIds = permissions.filter((p) => p.can_view).map((p) => p.module_id)

  if (accessibleModuleIds.length === 0) {
    return []
  }

  const {data, error} = await supabase
    .from('function_modules')
    .select('*')
    .in('id', accessibleModuleIds)
    .order('sort_order', {ascending: true})

  if (error) throw error
  return Array.isArray(data) ? data : []
}

/**
 * 获取租户的所有岗位名称（去重）
 */
export async function getTenantPositionNames(tenantId: string): Promise<string[]> {
  console.log('=== API: 开始获取租户岗位列表 ===', {tenantId})
  const {data, error} = await supabase
    .from('position_permission_templates')
    .select('position_name')
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('=== API: 获取岗位列表失败 ===', error)
    throw error
  }

  if (!Array.isArray(data)) {
    console.log('=== API: 岗位列表为空 ===')
    return []
  }

  // 去重
  const uniquePositions = [...new Set(data.map((item) => item.position_name))]
  console.log('=== API: 岗位列表获取成功 ===', {数量: uniquePositions.length, 岗位: uniquePositions})
  return uniquePositions.sort()
}
