/**
 * Agent管理模块
 * 提供Agent（区域经理/督导）的管理功能
 */

import {supabase} from '@/client/supabase'
import type {AgentAssignment, AgentStats, CreateAgentAssignmentInput, Profile} from '../types'

/**
 * 获取租户的所有Agent
 */
export async function getAgentsByTenantId(tenantId: string): Promise<Profile[]> {
  const {data, error} = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('role', 'agent')
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取Agent列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取Agent的分配关系
 */
export async function getAgentAssignments(agentId: string): Promise<AgentAssignment[]> {
  const {data, error} = await supabase
    .from('agent_assignments')
    .select('*')
    .eq('agent_id', agentId)
    .eq('status', 'active')
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取Agent分配关系失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取门店的Agent
 */
export async function getStoreAgents(storeId: string): Promise<Profile[]> {
  const {data, error} = await supabase
    .from('agent_assignments')
    .select('agent_id, profiles(*)')
    .eq('store_id', storeId)
    .eq('status', 'active')

  if (error) {
    console.error('获取门店Agent失败:', error)
    return []
  }

  if (!Array.isArray(data)) return []

  // 提取profiles数据
  return data.map((item: any) => item.profiles).filter(Boolean)
}

/**
 * 创建Agent分配
 */
export async function createAgentAssignment(input: CreateAgentAssignmentInput): Promise<AgentAssignment | null> {
  // 获取租户ID
  const {data: storeData} = await supabase.from('stores').select('tenant_id').eq('id', input.store_id).maybeSingle()

  if (!storeData) {
    console.error('门店不存在')
    return null
  }

  const {data, error} = await supabase
    .from('agent_assignments')
    .insert({
      agent_id: input.agent_id,
      store_id: input.store_id,
      tenant_id: storeData.tenant_id,
      assigned_by: input.assigned_by,
      status: 'active'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建Agent分配失败:', error)
    return null
  }

  return data
}

/**
 * 删除Agent分配
 */
export async function deleteAgentAssignment(assignmentId: string): Promise<boolean> {
  const {error} = await supabase.from('agent_assignments').update({status: 'inactive'}).eq('id', assignmentId)

  if (error) {
    console.error('删除Agent分配失败:', error)
    return false
  }

  return true
}

/**
 * 批量分配Agent到门店
 */
export async function batchAssignAgent(
  agentId: string,
  storeIds: string[],
  assignedBy: string
): Promise<AgentAssignment[]> {
  const assignments: AgentAssignment[] = []

  for (const storeId of storeIds) {
    const assignment = await createAgentAssignment({
      agent_id: agentId,
      store_id: storeId,
      assigned_by: assignedBy
    })

    if (assignment) {
      assignments.push(assignment)
    }
  }

  return assignments
}

/**
 * 获取Agent统计信息
 */
export async function getAgentStats(agentId: string): Promise<AgentStats | null> {
  // 获取Agent信息
  const {data: agent} = await supabase.from('profiles').select('name').eq('id', agentId).maybeSingle()

  if (!agent) return null

  // 获取分配的门店数量
  const {data: assignments} = await supabase
    .from('agent_assignments')
    .select('store_id')
    .eq('agent_id', agentId)
    .eq('status', 'active')

  const storeCount = assignments?.length || 0

  // 获取门店的员工总数
  let employeeCount = 0
  if (assignments && assignments.length > 0) {
    const storeIds = assignments.map((a) => a.store_id)
    const {data: employees} = await supabase.from('employees').select('id').in('store_id', storeIds)
    employeeCount = employees?.length || 0
  }

  return {
    agent_id: agentId,
    agent_name: agent.name || '未命名',
    store_count: storeCount,
    employee_count: employeeCount,
    total_revenue: 0, // 待实现
    avg_efficiency: 0 // 待实现
  }
}

/**
 * 获取租户的所有Agent统计
 */
export async function getTenantAgentStats(tenantId: string): Promise<AgentStats[]> {
  const agents = await getAgentsByTenantId(tenantId)
  const stats: AgentStats[] = []

  for (const agent of agents) {
    const stat = await getAgentStats(agent.id)
    if (stat) {
      stats.push(stat)
    }
  }

  return stats
}

/**
 * 更新Agent角色
 */
export async function updateUserToAgent(userId: string): Promise<boolean> {
  const {error} = await supabase.from('profiles').update({role: 'agent'}).eq('id', userId)

  if (error) {
    console.error('更新用户为Agent失败:', error)
    return false
  }

  return true
}

/**
 * 检查用户是否为Agent
 */
export async function isUserAgent(userId: string): Promise<boolean> {
  const {data} = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle()

  return data?.role === 'agent'
}

/**
 * 获取Agent管理的门店列表（带详细信息）
 */
export async function getAgentStoresWithDetails(agentId: string) {
  const {data, error} = await supabase
    .from('agent_assignments')
    .select(
      `
      id,
      assigned_at,
      stores (
        id,
        name,
        address,
        status,
        created_at
      )
    `
    )
    .eq('agent_id', agentId)
    .eq('status', 'active')
    .order('assigned_at', {ascending: false})

  if (error) {
    console.error('获取Agent门店详情失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}
