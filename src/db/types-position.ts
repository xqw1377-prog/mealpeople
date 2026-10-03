/**
 * 岗位管理和组织架构相关类型定义
 */

// ============================================
// 岗位相关类型
// ============================================

/**
 * 岗位层级
 */
export type PositionLevel = 1 | 2 | 3

/**
 * 岗位信息
 */
export interface Position {
  id: string
  tenant_id: string
  position_name: string
  position_level: PositionLevel
  description?: string
  sort_order: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 岗位模块权限
 */
export interface PositionModulePermission {
  id: string
  tenant_id: string
  position_id: string
  module_id: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 员工岗位关联
 */
export interface EmployeePosition {
  id: string
  tenant_id: string
  employee_id: string
  position_id: string
  is_primary: boolean
  effective_date: string
  expiry_date?: string
  created_by?: string
  created_at: string
  updated_at: string
}

// ============================================
// 组织架构相关类型
// ============================================

/**
 * 门店组织架构
 */
export interface StoreOrganization {
  id: string
  tenant_id: string
  store_id: string
  position_id: string
  parent_position_id?: string
  position_level: PositionLevel
  required_count: number
  sort_order: number
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 门店岗位人员分配
 */
export interface StorePositionAssignment {
  id: string
  tenant_id: string
  store_id: string
  organization_id: string
  employee_id: string
  is_primary: boolean
  effective_date: string
  expiry_date?: string
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 顶岗类型
 */
export type BackupType = 'up' | 'down'

/**
 * 顶岗关系配置
 */
export interface BackupPositionConfig {
  id: string
  tenant_id: string
  store_id: string
  primary_position_id: string
  backup_position_id: string
  backup_type: BackupType
  created_by?: string
  created_at: string
  updated_at: string
}

// ============================================
// 扩展类型（包含关联数据）
// ============================================

/**
 * 岗位（包含权限信息）
 */
export interface PositionWithPermissions extends Position {
  permissions: PositionModulePermission[]
}

/**
 * 组织架构节点（包含岗位和人员信息）
 */
export interface OrganizationNode extends StoreOrganization {
  position: Position
  current_count: number
  is_understaffed: boolean
  assignments: (StorePositionAssignment & {
    employee_name?: string
    employee_avatar?: string
  })[]
  children: OrganizationNode[]
}

/**
 * 员工岗位信息（包含岗位详情）
 */
export interface EmployeePositionWithDetails extends EmployeePosition {
  position: Position
}

// ============================================
// 表单输入类型
// ============================================

/**
 * 创建岗位输入
 */
export interface CreatePositionInput {
  tenant_id: string
  position_name: string
  position_level: PositionLevel
  description?: string
  sort_order?: number
  created_by?: string
}

/**
 * 更新岗位输入
 */
export interface UpdatePositionInput {
  position_name?: string
  position_level?: PositionLevel
  description?: string
  sort_order?: number
  is_active?: boolean
}

/**
 * 配置岗位权限输入
 */
export interface ConfigurePositionPermissionInput {
  tenant_id: string
  position_id: string
  module_id: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  created_by?: string
}

/**
 * 批量配置岗位权限输入
 */
export interface BatchConfigurePositionPermissionInput {
  tenant_id: string
  position_id: string
  permissions: {
    module_id: string
    can_view: boolean
    can_create: boolean
    can_edit: boolean
    can_delete: boolean
  }[]
  created_by?: string
}

/**
 * 分配员工岗位输入
 */
export interface AssignEmployeePositionInput {
  tenant_id: string
  employee_id: string
  position_id: string
  is_primary: boolean
  effective_date: string
  expiry_date?: string
  created_by?: string
}

/**
 * 创建组织架构节点输入
 */
export interface CreateOrganizationNodeInput {
  tenant_id: string
  store_id: string
  position_id: string
  parent_position_id?: string
  position_level: PositionLevel
  required_count: number
  sort_order?: number
  created_by?: string
}

/**
 * 更新组织架构节点输入
 */
export interface UpdateOrganizationNodeInput {
  parent_position_id?: string
  position_level?: PositionLevel
  required_count?: number
  sort_order?: number
}

/**
 * 分配岗位人员输入
 */
export interface AssignPositionStaffInput {
  tenant_id: string
  store_id: string
  organization_id: string
  employee_id: string
  is_primary: boolean
  effective_date: string
  expiry_date?: string
  created_by?: string
}

/**
 * 配置顶岗关系输入
 */
export interface ConfigureBackupPositionInput {
  tenant_id: string
  store_id: string
  primary_position_id: string
  backup_position_id: string
  backup_type: BackupType
  created_by?: string
}
