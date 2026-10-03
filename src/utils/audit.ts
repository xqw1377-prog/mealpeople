/**
 * 审计日志工具
 * 用于记录关键操作、创建数据快照、查询审计日志
 */

import {supabase} from '@/client/supabase'
import {APP_VERSION, ENABLE_AUDIT_LOG} from './version'

export interface AuditLogParams {
  operationType: 'INSERT' | 'UPDATE' | 'DELETE' | 'RESTORE'
  tableName: string
  recordId?: string
  oldData?: any
  newData?: any
  tenantId?: string
  context?: Record<string, any>
}

export interface AuditLog {
  id: string
  app_version: string
  operation_type: string
  table_name: string
  record_id: string
  old_data: any
  new_data: any
  changes: any
  user_id: string
  tenant_id: string
  operation_context: any
  created_at: string
}

/**
 * 记录审计日志
 */
export async function logAuditEvent(params: AuditLogParams): Promise<string | null> {
  if (!ENABLE_AUDIT_LOG) {
    return null
  }

  try {
    const {
      data: {user}
    } = await supabase.auth.getUser()

    const {data, error} = await supabase.rpc('log_audit_event', {
      p_app_version: APP_VERSION,
      p_operation_type: params.operationType,
      p_table_name: params.tableName,
      p_record_id: params.recordId || null,
      p_old_data: params.oldData ? JSON.stringify(params.oldData) : null,
      p_new_data: params.newData ? JSON.stringify(params.newData) : null,
      p_user_id: user?.id || null,
      p_tenant_id: params.tenantId || null
    })

    if (error) {
      console.error('记录审计日志失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('记录审计日志异常:', error)
    return null
  }
}

/**
 * 创建数据快照
 */
export async function createSnapshot(
  snapshotName: string,
  tableNames: string[],
  snapshotType: 'manual' | 'auto' | 'pre-migration' = 'manual'
): Promise<string | null> {
  try {
    const {
      data: {user}
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('用户未登录')
    }

    const {data, error} = await supabase.rpc('create_data_snapshot', {
      p_snapshot_name: snapshotName,
      p_app_version: APP_VERSION,
      p_snapshot_type: snapshotType,
      p_table_names: tableNames,
      p_user_id: user.id
    })

    if (error) {
      console.error('创建快照失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建快照异常:', error)
    return null
  }
}

/**
 * 查询审计日志
 */
export async function getAuditLogs(filters?: {
  tableName?: string
  userId?: string
  tenantId?: string
  startDate?: string
  endDate?: string
  limit?: number
}): Promise<AuditLog[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('app_version', APP_VERSION)
      .order('created_at', {ascending: false})

    if (filters?.tableName) {
      query = query.eq('table_name', filters.tableName)
    }

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters?.tenantId) {
      query = query.eq('tenant_id', filters.tenantId)
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const {data, error} = await query

    if (error) {
      console.error('查询审计日志失败:', error)
      return []
    }

    return (data || []) as AuditLog[]
  } catch (error) {
    console.error('查询审计日志异常:', error)
    return []
  }
}

/**
 * 获取审计日志统计
 */
export async function getAuditLogsSummary() {
  try {
    const {data, error} = await supabase
      .from('audit_logs_summary')
      .select('*')
      .eq('app_version', APP_VERSION)
      .order('operation_date', {ascending: false})
      .limit(30)

    if (error) {
      console.error('查询审计统计失败:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('查询审计统计异常:', error)
    return []
  }
}

/**
 * 批量记录审计日志（用于批量操作）
 */
export async function logBatchAuditEvents(events: AuditLogParams[]): Promise<number> {
  let successCount = 0

  for (const event of events) {
    const result = await logAuditEvent(event)
    if (result) {
      successCount++
    }
  }

  return successCount
}
