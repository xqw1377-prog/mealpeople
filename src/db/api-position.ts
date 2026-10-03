/**
 * 岗位管理和组织架构API
 */

import {supabase} from '@/client/supabase'
import type {
  AssignEmployeePositionInput,
  AssignPositionStaffInput,
  BackupPositionConfig,
  BatchConfigurePositionPermissionInput,
  ConfigureBackupPositionInput,
  ConfigurePositionPermissionInput,
  CreateOrganizationNodeInput,
  CreatePositionInput,
  EmployeePosition,
  EmployeePositionWithDetails,
  OrganizationNode,
  Position,
  PositionModulePermission,
  PositionWithPermissions,
  StoreOrganization,
  StorePositionAssignment,
  UpdateOrganizationNodeInput,
  UpdatePositionInput
} from './types-position'

// ============================================
// 岗位管理API
// ============================================

/**
 * 创建岗位
 */
export async function createPosition(input: CreatePositionInput): Promise<Position | null> {
  try {
    console.log('=== API: 创建岗位 ===')
    console.log('输入数据:', input)

    const {data, error} = await supabase.from('positions').insert(input).select().maybeSingle()

    if (error) {
      console.error('❌ 创建岗位失败 - Supabase错误:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    console.log('✅ 创建岗位成功:', data)
    return data
  } catch (error) {
    console.error('❌ 创建岗位异常:', error)
    return null
  }
}

/**
 * 获取租户的所有岗位
 */
export async function getPositionsByTenant(tenantId: string): Promise<Position[]> {
  try {
    const {data, error} = await supabase
      .from('positions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('position_level', {ascending: true})
      .order('sort_order', {ascending: true})

    if (error) {
      console.error('获取岗位列表失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取岗位列表异常:', error)
    return []
  }
}

/**
 * 获取岗位详情
 */
export async function getPositionById(positionId: string): Promise<Position | null> {
  try {
    const {data, error} = await supabase.from('positions').select('*').eq('id', positionId).maybeSingle()

    if (error) {
      console.error('获取岗位详情失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取岗位详情异常:', error)
    return null
  }
}

/**
 * 更新岗位
 */
export async function updatePosition(positionId: string, input: UpdatePositionInput): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('positions')
      .update({...input, updated_at: new Date().toISOString()})
      .eq('id', positionId)

    if (error) {
      console.error('更新岗位失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('更新岗位异常:', error)
    return false
  }
}

/**
 * 删除岗位（软删除）
 */
export async function deletePosition(positionId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('positions')
      .update({is_active: false, updated_at: new Date().toISOString()})
      .eq('id', positionId)

    if (error) {
      console.error('删除岗位失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除岗位异常:', error)
    return false
  }
}

// ============================================
// 岗位权限管理API
// ============================================

/**
 * 配置岗位权限（单个模块）
 */
export async function configurePositionPermission(
  input: ConfigurePositionPermissionInput
): Promise<PositionModulePermission | null> {
  try {
    const {data, error} = await supabase
      .from('position_module_permissions')
      .upsert(input, {onConflict: 'position_id,module_id'})
      .select()
      .maybeSingle()

    if (error) {
      console.error('配置岗位权限失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('配置岗位权限异常:', error)
    return null
  }
}

/**
 * 批量配置岗位权限
 */
export async function batchConfigurePositionPermissions(
  input: BatchConfigurePositionPermissionInput
): Promise<boolean> {
  try {
    // 先删除该岗位的所有权限
    const {error: deleteError} = await supabase
      .from('position_module_permissions')
      .delete()
      .eq('position_id', input.position_id)

    if (deleteError) {
      console.error('删除旧权限失败:', deleteError)
      return false
    }

    // 插入新权限
    const permissions = input.permissions.map((p) => ({
      tenant_id: input.tenant_id,
      position_id: input.position_id,
      module_id: p.module_id,
      can_view: p.can_view,
      can_create: p.can_create,
      can_edit: p.can_edit,
      can_delete: p.can_delete,
      created_by: input.created_by
    }))

    const {error: insertError} = await supabase.from('position_module_permissions').insert(permissions)

    if (insertError) {
      console.error('插入新权限失败:', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('批量配置岗位权限异常:', error)
    return false
  }
}

/**
 * 获取岗位的所有权限
 */
export async function getPositionPermissions(positionId: string): Promise<PositionModulePermission[]> {
  try {
    const {data, error} = await supabase.from('position_module_permissions').select('*').eq('position_id', positionId)

    if (error) {
      console.error('获取岗位权限失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取岗位权限异常:', error)
    return []
  }
}

/**
 * 获取岗位及其权限
 */
export async function getPositionWithPermissions(positionId: string): Promise<PositionWithPermissions | null> {
  try {
    const position = await getPositionById(positionId)
    if (!position) return null

    const permissions = await getPositionPermissions(positionId)

    return {
      ...position,
      permissions
    }
  } catch (error) {
    console.error('获取岗位及权限异常:', error)
    return null
  }
}

// ============================================
// 员工岗位分配API
// ============================================

/**
 * 分配员工岗位
 */
export async function assignEmployeePosition(input: AssignEmployeePositionInput): Promise<EmployeePosition | null> {
  try {
    const {data, error} = await supabase.from('employee_positions').insert(input).select().maybeSingle()

    if (error) {
      console.error('分配员工岗位失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('分配员工岗位异常:', error)
    return null
  }
}

/**
 * 获取员工的所有岗位
 */
export async function getEmployeePositions(employeeId: string): Promise<EmployeePositionWithDetails[]> {
  try {
    const {data, error} = await supabase
      .from('employee_positions')
      .select(
        `
        *,
        position:positions(*)
      `
      )
      .eq('employee_id', employeeId)
      .order('is_primary', {ascending: false})
      .order('effective_date', {ascending: false})

    if (error) {
      console.error('获取员工岗位失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取员工岗位异常:', error)
    return []
  }
}

/**
 * 获取员工的当前有效岗位
 */
export async function getEmployeeActivePositions(employeeId: string): Promise<EmployeePositionWithDetails[]> {
  try {
    const today = new Date().toISOString().split('T')[0]

    const {data, error} = await supabase
      .from('employee_positions')
      .select(
        `
        *,
        position:positions(*)
      `
      )
      .eq('employee_id', employeeId)
      .lte('effective_date', today)
      .or(`expiry_date.is.null,expiry_date.gte.${today}`)
      .order('is_primary', {ascending: false})

    if (error) {
      console.error('获取员工当前岗位失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取员工当前岗位异常:', error)
    return []
  }
}

/**
 * 移除员工岗位
 */
export async function removeEmployeePosition(assignmentId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('employee_positions').delete().eq('id', assignmentId)

    if (error) {
      console.error('移除员工岗位失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('移除员工岗位异常:', error)
    return false
  }
}

// ============================================
// 组织架构管理API
// ============================================

/**
 * 创建组织架构节点
 */
export async function createOrganizationNode(input: CreateOrganizationNodeInput): Promise<StoreOrganization | null> {
  try {
    const {data, error} = await supabase.from('store_organization').insert(input).select().maybeSingle()

    if (error) {
      console.error('创建组织架构节点失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建组织架构节点异常:', error)
    return null
  }
}

/**
 * 获取门店的组织架构
 */
export async function getStoreOrganization(storeId: string): Promise<StoreOrganization[]> {
  try {
    const {data, error} = await supabase
      .from('store_organization')
      .select('*')
      .eq('store_id', storeId)
      .order('position_level', {ascending: true})
      .order('sort_order', {ascending: true})

    if (error) {
      console.error('获取组织架构失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取组织架构异常:', error)
    return []
  }
}

/**
 * 获取门店的组织架构树（包含人员信息）
 */
export async function getStoreOrganizationTree(storeId: string): Promise<OrganizationNode[]> {
  try {
    // 获取组织架构
    const orgData = await getStoreOrganization(storeId)
    if (orgData.length === 0) return []

    // 获取所有岗位信息
    const positionIds = [...new Set(orgData.map((o) => o.position_id))]
    const {data: positions} = await supabase.from('positions').select('*').in('id', positionIds)

    // 获取所有人员分配
    const {data: assignments} = await supabase
      .from('store_position_assignments')
      .select('*')
      .eq('store_id', storeId)
      .lte('effective_date', new Date().toISOString().split('T')[0])
      .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().split('T')[0]}`)

    // 构建节点映射
    const nodeMap = new Map<string, OrganizationNode>()
    for (const org of orgData) {
      const position = positions?.find((p) => p.id === org.position_id)
      const orgAssignments = assignments?.filter((a) => a.organization_id === org.id) || []
      const currentCount = orgAssignments.length

      nodeMap.set(org.id, {
        ...org,
        position: position!,
        current_count: currentCount,
        is_understaffed: currentCount < org.required_count,
        assignments: orgAssignments,
        children: []
      })
    }

    // 构建树形结构
    const rootNodes: OrganizationNode[] = []
    for (const node of nodeMap.values()) {
      if (node.parent_position_id) {
        const parent = nodeMap.get(node.parent_position_id)
        if (parent) {
          parent.children.push(node)
        }
      } else {
        rootNodes.push(node)
      }
    }

    return rootNodes
  } catch (error) {
    console.error('获取组织架构树异常:', error)
    return []
  }
}

/**
 * 更新组织架构节点
 */
export async function updateOrganizationNode(nodeId: string, input: UpdateOrganizationNodeInput): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('store_organization')
      .update({...input, updated_at: new Date().toISOString()})
      .eq('id', nodeId)

    if (error) {
      console.error('更新组织架构节点失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('更新组织架构节点异常:', error)
    return false
  }
}

/**
 * 删除组织架构节点
 */
export async function deleteOrganizationNode(nodeId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('store_organization').delete().eq('id', nodeId)

    if (error) {
      console.error('删除组织架构节点失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除组织架构节点异常:', error)
    return false
  }
}

// ============================================
// 岗位人员分配API
// ============================================

/**
 * 分配岗位人员
 */
export async function assignPositionStaff(input: AssignPositionStaffInput): Promise<StorePositionAssignment | null> {
  try {
    const {data, error} = await supabase.from('store_position_assignments').insert(input).select().maybeSingle()

    if (error) {
      console.error('分配岗位人员失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('分配岗位人员异常:', error)
    return null
  }
}

/**
 * 获取岗位的人员分配
 */
export async function getPositionAssignments(organizationId: string): Promise<StorePositionAssignment[]> {
  try {
    const {data, error} = await supabase
      .from('store_position_assignments')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_primary', {ascending: false})

    if (error) {
      console.error('获取岗位人员分配失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取岗位人员分配异常:', error)
    return []
  }
}

/**
 * 移除岗位人员
 */
export async function removePositionStaff(assignmentId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('store_position_assignments').delete().eq('id', assignmentId)

    if (error) {
      console.error('移除岗位人员失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('移除岗位人员异常:', error)
    return false
  }
}

// ============================================
// 顶岗关系配置API
// ============================================

/**
 * 配置顶岗关系
 */
export async function configureBackupPosition(
  input: ConfigureBackupPositionInput
): Promise<BackupPositionConfig | null> {
  try {
    const {data, error} = await supabase.from('backup_position_config').insert(input).select().maybeSingle()

    if (error) {
      console.error('配置顶岗关系失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('配置顶岗关系异常:', error)
    return null
  }
}

/**
 * 获取门店的顶岗关系配置
 */
export async function getStoreBackupConfig(storeId: string): Promise<BackupPositionConfig[]> {
  try {
    const {data, error} = await supabase.from('backup_position_config').select('*').eq('store_id', storeId)

    if (error) {
      console.error('获取顶岗关系配置失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取顶岗关系配置异常:', error)
    return []
  }
}

/**
 * 删除顶岗关系
 */
export async function deleteBackupConfig(configId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('backup_position_config').delete().eq('id', configId)

    if (error) {
      console.error('删除顶岗关系失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除顶岗关系异常:', error)
    return false
  }
}
