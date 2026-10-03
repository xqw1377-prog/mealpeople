/**
 * 员工权限模块化系统类型定义
 */

/**
 * 功能模块
 */
export interface FunctionModule {
  id: string
  module_key: string
  module_name: string
  module_description?: string
  parent_module_id?: string
  sort_order: number
  is_system: boolean
  icon?: string
  route_path?: string
  created_at: string
}

/**
 * 员工权限
 */
export interface EmployeePermission {
  id: string
  tenant_id: string
  employee_id: string
  module_id: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  created_at: string
  updated_at: string
}

/**
 * 岗位权限模板
 */
export interface PositionPermissionTemplate {
  id: string
  tenant_id: string
  position_name: string
  module_id: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
  created_at: string
}

/**
 * 员工权限详情（包含模块信息）
 */
export interface EmployeePermissionDetail extends EmployeePermission {
  module?: FunctionModule
}

/**
 * 功能模块树节点
 */
export interface FunctionModuleTree extends FunctionModule {
  children?: FunctionModuleTree[]
}

/**
 * 权限类型
 */
export type PermissionType = 'view' | 'edit' | 'delete'

/**
 * 创建员工权限参数
 */
export interface CreateEmployeePermissionInput {
  tenant_id: string
  employee_id: string
  module_id: string
  can_view?: boolean
  can_edit?: boolean
  can_delete?: boolean
}

/**
 * 更新员工权限参数
 */
export interface UpdateEmployeePermissionInput {
  can_view?: boolean
  can_edit?: boolean
  can_delete?: boolean
}

/**
 * 创建岗位权限模板参数
 */
export interface CreatePositionTemplateInput {
  tenant_id: string
  position_name: string
  module_id: string
  can_view?: boolean
  can_edit?: boolean
  can_delete?: boolean
}

/**
 * 批量权限设置
 */
export interface BatchPermissionSetting {
  module_id: string
  can_view: boolean
  can_edit: boolean
  can_delete: boolean
}
