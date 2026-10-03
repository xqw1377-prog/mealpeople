/**
 * 2.0版本数据库API
 * 包含营收预测、影响因子、排班优化、风险预警等功能的数据库操作
 */

import {supabase} from '@/client/supabase'
import type {
  BestPractice,
  CorePositionBackup,
  CreateImpactFactorParams,
  CreateRestDayRuleParams,
  CreateRiskAlertParams,
  ImpactFactor,
  ImportResult,
  MinRevenuePositions,
  RestDayRule,
  RevenueHistory,
  RevenuePrediction,
  RiskAlert,
  SchedulingOptimization,
  StaffTransfer,
  StoreHierarchy
} from './types-v2'

// ==================== 营收预测相关 ====================

/**
 * 创建营收预测记录
 */
export async function createRevenuePrediction(
  prediction: Omit<RevenuePrediction, 'id' | 'created_at' | 'updated_at'>
): Promise<RevenuePrediction | null> {
  try {
    const {data, error} = await supabase.from('revenue_predictions').insert(prediction).select().maybeSingle()

    if (error) {
      console.error('创建营收预测失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建营收预测异常:', error)
    return null
  }
}

/**
 * 获取租户的营收预测记录
 */
export async function getRevenuePredictions(
  tenantId: string,
  filters?: {
    storeId?: string
    predictionType?: 'monthly' | 'daily'
    startDate?: string
    endDate?: string
  }
): Promise<RevenuePrediction[]> {
  try {
    let query = supabase
      .from('revenue_predictions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('target_period', {ascending: false})

    if (filters?.storeId) {
      query = query.eq('store_id', filters.storeId)
    }

    if (filters?.predictionType) {
      query = query.eq('prediction_type', filters.predictionType)
    }

    if (filters?.startDate) {
      query = query.gte('target_period', filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte('target_period', filters.endDate)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取营收预测失败:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('获取营收预测异常:', error)
    return []
  }
}

/**
 * 更新预测的实际值和准确率
 */
export async function updatePredictionActual(predictionId: string, actualValue: number): Promise<boolean> {
  try {
    // 先获取预测记录
    const {data: prediction, error: fetchError} = await supabase
      .from('revenue_predictions')
      .select('baseline_value')
      .eq('id', predictionId)
      .maybeSingle()

    if (fetchError || !prediction) {
      console.error('获取预测记录失败:', fetchError)
      return false
    }

    // 计算准确率
    const accuracyRate = (1 - Math.abs(actualValue - prediction.baseline_value) / prediction.baseline_value) * 100

    // 更新记录
    const {error: updateError} = await supabase
      .from('revenue_predictions')
      .update({
        actual_value: actualValue,
        accuracy_rate: Math.max(0, Math.min(100, accuracyRate)),
        updated_at: new Date().toISOString()
      })
      .eq('id', predictionId)

    if (updateError) {
      console.error('更新预测实际值失败:', updateError)
      return false
    }

    return true
  } catch (error) {
    console.error('更新预测实际值异常:', error)
    return false
  }
}

// ==================== 影响因子相关 ====================

/**
 * 创建影响因子
 */
export async function createImpactFactor(params: CreateImpactFactorParams): Promise<ImpactFactor | null> {
  try {
    const {
      data: {user}
    } = await supabase.auth.getUser()

    const {data, error} = await supabase
      .from('impact_factors')
      .insert({
        ...params,
        created_by: user?.id
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('创建影响因子失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建影响因子异常:', error)
    return null
  }
}

/**
 * 获取租户的影响因子
 */
export async function getImpactFactors(
  tenantId: string,
  filters?: {
    factorType?: string
    effectiveDate?: string
    includeExpired?: boolean
  }
): Promise<ImpactFactor[]> {
  try {
    let query = supabase
      .from('impact_factors')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', {ascending: false})

    if (filters?.factorType) {
      query = query.eq('factor_type', filters.factorType)
    }

    if (filters?.effectiveDate && !filters?.includeExpired) {
      query = query.lte('effective_date', filters.effectiveDate)
      query = query.or(`expiration_date.is.null,expiration_date.gte.${filters.effectiveDate}`)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取影响因子失败:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('获取影响因子异常:', error)
    return []
  }
}

/**
 * 获取生效中的影响因子
 */
export async function getActiveImpactFactors(tenantId: string, targetDate: string): Promise<ImpactFactor[]> {
  try {
    const {data, error} = await supabase
      .from('impact_factors')
      .select('*')
      .eq('tenant_id', tenantId)
      .lte('effective_date', targetDate)
      .or(`expiration_date.is.null,expiration_date.gte.${targetDate}`)
      .order('impact_value', {ascending: false})

    if (error) {
      console.error('获取生效影响因子失败:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('获取生效影响因子异常:', error)
    return []
  }
}

/**
 * 更新影响因子
 */
export async function updateImpactFactor(factorId: string, updates: Partial<ImpactFactor>): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('impact_factors')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', factorId)

    if (error) {
      console.error('更新影响因子失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('更新影响因子异常:', error)
    return false
  }
}

/**
 * 删除影响因子
 */
export async function deleteImpactFactor(factorId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('impact_factors').delete().eq('id', factorId)

    if (error) {
      console.error('删除影响因子失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除影响因子异常:', error)
    return false
  }
}

// ==================== 排班优化相关 ====================

/**
 * 创建排班优化记录
 */
export async function createSchedulingOptimization(
  optimization: Omit<SchedulingOptimization, 'id' | 'created_at'>
): Promise<SchedulingOptimization | null> {
  try {
    const {data, error} = await supabase.from('scheduling_optimizations').insert(optimization).select().maybeSingle()

    if (error) {
      console.error('创建排班优化记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建排班优化记录异常:', error)
    return null
  }
}

/**
 * 获取排班优化记录
 */
export async function getSchedulingOptimizations(
  tenantId: string,
  filters?: {
    scheduleId?: string
    optimizationType?: string
    status?: string
  }
): Promise<SchedulingOptimization[]> {
  try {
    let query = supabase
      .from('scheduling_optimizations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', {ascending: false})

    if (filters?.scheduleId) {
      query = query.eq('schedule_id', filters.scheduleId)
    }

    if (filters?.optimizationType) {
      query = query.eq('optimization_type', filters.optimizationType)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取排班优化记录失败:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('获取排班优化记录异常:', error)
    return []
  }
}

/**
 * 应用排班优化
 */
export async function applySchedulingOptimization(optimizationId: string): Promise<boolean> {
  try {
    const {
      data: {user}
    } = await supabase.auth.getUser()

    const {error} = await supabase
      .from('scheduling_optimizations')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString(),
        applied_by: user?.id
      })
      .eq('id', optimizationId)

    if (error) {
      console.error('应用排班优化失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('应用排班优化异常:', error)
    return false
  }
}

// ==================== 风险预警相关 ====================

/**
 * 创建风险预警
 */
export async function createRiskAlert(params: CreateRiskAlertParams): Promise<RiskAlert | null> {
  try {
    const {data, error} = await supabase
      .from('risk_alerts')
      .insert({
        ...params,
        detected_at: new Date().toISOString()
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('创建风险预警失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建风险预警异常:', error)
    return null
  }
}

/**
 * 获取风险预警列表
 */
export async function getRiskAlerts(
  tenantId: string,
  filters?: {
    storeId?: string
    riskType?: string
    riskLevel?: string
    status?: string
  }
): Promise<RiskAlert[]> {
  try {
    let query = supabase
      .from('risk_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('detected_at', {ascending: false})

    if (filters?.storeId) {
      query = query.eq('store_id', filters.storeId)
    }

    if (filters?.riskType) {
      query = query.eq('risk_type', filters.riskType)
    }

    if (filters?.riskLevel) {
      query = query.eq('risk_level', filters.riskLevel)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取风险预警失败:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('获取风险预警异常:', error)
    return []
  }
}

/**
 * 确认风险预警
 */
export async function acknowledgeRiskAlert(alertId: string): Promise<boolean> {
  try {
    const {
      data: {user}
    } = await supabase.auth.getUser()

    const {error} = await supabase
      .from('risk_alerts')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (error) {
      console.error('确认风险预警失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('确认风险预警异常:', error)
    return false
  }
}

/**
 * 解决风险预警
 */
export async function resolveRiskAlert(alertId: string, resolutionNotes: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('risk_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (error) {
      console.error('解决风险预警失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('解决风险预警异常:', error)
    return false
  }
}

/**
 * 忽略风险预警
 */
export async function ignoreRiskAlert(alertId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('risk_alerts')
      .update({
        status: 'ignored',
        updated_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (error) {
      console.error('忽略风险预警失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('忽略风险预警异常:', error)
    return false
  }
}

// ==================== 连锁协同相关 ====================

/**
 * 创建人员调配记录
 */
export async function createStaffTransfer(
  transfer: Omit<StaffTransfer, 'id' | 'created_at'>
): Promise<StaffTransfer | null> {
  try {
    const {data, error} = await supabase.from('staff_transfers').insert(transfer).select().maybeSingle()

    if (error) {
      console.error('创建人员调配记录失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建人员调配记录异常:', error)
    return null
  }
}

/**
 * 获取人员调配记录
 */
export async function getStaffTransfers(
  tenantId: string,
  filters?: {
    storeId?: string
    status?: string
  }
): Promise<StaffTransfer[]> {
  try {
    let query = supabase
      .from('staff_transfers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', {ascending: false})

    if (filters?.storeId) {
      query = query.or(`from_store_id.eq.${filters.storeId},to_store_id.eq.${filters.storeId}`)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取人员调配记录失败:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('获取人员调配记录异常:', error)
    return []
  }
}

/**
 * 创建最佳实践分享
 */
export async function createBestPractice(
  practice: Omit<BestPractice, 'id' | 'applied_count' | 'rating' | 'created_at'>
): Promise<BestPractice | null> {
  try {
    const {data, error} = await supabase
      .from('best_practices')
      .insert({
        ...practice,
        applied_count: 0,
        rating: 0
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('创建最佳实践失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建最佳实践异常:', error)
    return null
  }
}

/**
 * 获取最佳实践列表
 */
export async function getBestPractices(
  tenantId: string,
  filters?: {
    category?: string
    minRating?: number
  }
): Promise<BestPractice[]> {
  try {
    let query = supabase
      .from('best_practices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('rating', {ascending: false})

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.minRating) {
      query = query.gte('rating', filters.minRating)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取最佳实践失败:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('获取最佳实践异常:', error)
    return []
  }
}

// ==================== 高级配置相关API ====================

/**
 * 创建核心岗位顶岗配置
 */
export async function createCorePositionBackup(
  config: Omit<CorePositionBackup, 'id' | 'created_at' | 'updated_at'>
): Promise<CorePositionBackup | null> {
  try {
    const {data, error} = await supabase.from('core_position_backup').insert(config).select().maybeSingle()

    if (error) {
      console.error('创建顶岗配置失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('创建顶岗配置异常:', error)
    return null
  }
}

/**
 * 获取店铺的核心岗位顶岗配置
 */
export async function getCorePositionBackups(tenantId: string, storeId?: string): Promise<CorePositionBackup[]> {
  try {
    let query = supabase
      .from('core_position_backup')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', {ascending: false})

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取顶岗配置失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取顶岗配置异常:', error)
    return []
  }
}

/**
 * 更新核心岗位顶岗配置
 */
export async function updateCorePositionBackup(id: string, updates: Partial<CorePositionBackup>): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('core_position_backup')
      .update({...updates, updated_at: new Date().toISOString()})
      .eq('id', id)

    if (error) {
      console.error('更新顶岗配置失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('更新顶岗配置异常:', error)
    return false
  }
}

/**
 * 删除核心岗位顶岗配置
 */
export async function deleteCorePositionBackup(id: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('core_position_backup').delete().eq('id', id)

    if (error) {
      console.error('删除顶岗配置失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除顶岗配置异常:', error)
    return false
  }
}

/**
 * 创建或更新门店组织架构配置
 */
export async function upsertStoreHierarchy(
  config: Omit<StoreHierarchy, 'id' | 'created_at' | 'updated_at'>
): Promise<StoreHierarchy | null> {
  try {
    const {data, error} = await supabase
      .from('store_hierarchy')
      .upsert(config, {onConflict: 'store_id'})
      .select()
      .maybeSingle()

    if (error) {
      console.error('保存组织架构配置失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('保存组织架构配置异常:', error)
    return null
  }
}

/**
 * 获取门店组织架构配置
 */
export async function getStoreHierarchy(storeId: string): Promise<StoreHierarchy | null> {
  try {
    const {data, error} = await supabase.from('store_hierarchy').select('*').eq('store_id', storeId).maybeSingle()

    if (error) {
      console.error('获取组织架构配置失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取组织架构配置异常:', error)
    return null
  }
}

/**
 * 创建最低营收岗位配置
 */
export async function createMinRevenuePositions(
  config: Omit<MinRevenuePositions, 'id' | 'created_at' | 'updated_at'>
): Promise<MinRevenuePositions | null> {
  try {
    console.log('=== API: 创建最低营收配置 ===', config)
    const {data, error} = await supabase.from('min_revenue_positions').insert(config).select().maybeSingle()

    if (error) {
      console.error('=== API: 创建最低营收配置失败 ===', error)
      console.error('错误详情:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    console.log('=== API: 创建最低营收配置成功 ===', data)
    return data
  } catch (error) {
    console.error('=== API: 创建最低营收配置异常 ===', error)
    throw error
  }
}

/**
 * 获取店铺的最低营收岗位配置
 */
export async function getMinRevenuePositions(tenantId: string, storeId?: string): Promise<MinRevenuePositions[]> {
  try {
    console.log('=== API: 获取最低营收配置 ===', {tenantId, storeId})
    let query = supabase
      .from('min_revenue_positions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('min_revenue', {ascending: true})

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const {data, error} = await query

    if (error) {
      console.error('=== API: 获取最低营收配置失败 ===', error)
      console.error('错误详情:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log('=== API: 获取最低营收配置成功 ===', {数量: data?.length || 0, 数据: data})
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('=== API: 获取最低营收配置异常 ===', error)
    return []
  }
}

/**
 * 更新最低营收岗位配置
 */
export async function updateMinRevenuePositions(id: string, updates: Partial<MinRevenuePositions>): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('min_revenue_positions')
      .update({...updates, updated_at: new Date().toISOString()})
      .eq('id', id)

    if (error) {
      console.error('更新最低营收配置失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('更新最低营收配置异常:', error)
    return false
  }
}

/**
 * 删除最低营收岗位配置
 */
export async function deleteMinRevenuePositions(id: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('min_revenue_positions').delete().eq('id', id)

    if (error) {
      console.error('删除最低营收配置失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除最低营收配置异常:', error)
    return false
  }
}

/**
 * 批量导入历史营收数据
 */
export async function importRevenueHistory(
  records: Array<Omit<RevenueHistory, 'id' | 'created_at'>>,
  batchId: string
): Promise<ImportResult> {
  try {
    const recordsWithBatch = records.map((r) => ({
      ...r,
      import_batch_id: batchId
    }))

    const {data, error} = await supabase
      .from('revenue_history')
      .upsert(recordsWithBatch, {onConflict: 'store_id,revenue_date'})
      .select()

    if (error) {
      console.error('导入历史营收数据失败:', error)
      return {
        success: false,
        total: records.length,
        imported: 0,
        failed: records.length,
        errors: [{row: 0, error: error.message}]
      }
    }

    return {
      success: true,
      total: records.length,
      imported: data?.length || 0,
      failed: records.length - (data?.length || 0),
      batch_id: batchId
    }
  } catch (error: any) {
    console.error('导入历史营收数据异常:', error)
    return {
      success: false,
      total: records.length,
      imported: 0,
      failed: records.length,
      errors: [{row: 0, error: error.message}]
    }
  }
}

/**
 * 获取历史营收数据
 */
export async function getRevenueHistory(
  tenantId: string,
  storeId?: string,
  startDate?: string,
  endDate?: string
): Promise<RevenueHistory[]> {
  try {
    let query = supabase
      .from('revenue_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('revenue_date', {ascending: false})

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    if (startDate) {
      query = query.gte('revenue_date', startDate)
    }

    if (endDate) {
      query = query.lte('revenue_date', endDate)
    }

    const {data, error} = await query

    if (error) {
      console.error('获取历史营收数据失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取历史营收数据异常:', error)
    return []
  }
}

/**
 * 删除历史营收数据（按批次）
 */
export async function deleteRevenueHistoryBatch(batchId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('revenue_history').delete().eq('import_batch_id', batchId)

    if (error) {
      console.error('删除历史营收数据失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除历史营收数据异常:', error)
    return false
  }
}

// ==================== 排休规则相关API ====================

/**
 * 创建排休规则
 */
export async function createRestDayRule(params: CreateRestDayRuleParams): Promise<RestDayRule | null> {
  try {
    console.log('=== API: 创建排休规则 ===', params)
    const {data, error} = await supabase.from('rest_day_rules').insert(params).select().maybeSingle()

    if (error) {
      console.error('=== API: 创建排休规则失败 ===', error)
      console.error('错误详情:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    console.log('=== API: 创建排休规则成功 ===', data)
    return data
  } catch (error) {
    console.error('=== API: 创建排休规则异常 ===', error)
    throw error
  }
}

/**
 * 获取店铺的排休规则列表
 */
export async function getRestDayRules(tenantId: string, storeId?: string, activeOnly = false): Promise<RestDayRule[]> {
  try {
    console.log('=== API: 获取排休规则 ===', {tenantId, storeId, activeOnly})
    let query = supabase
      .from('rest_day_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('priority', {ascending: false})
      .order('created_at', {ascending: false})

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const {data, error} = await query

    if (error) {
      console.error('=== API: 获取排休规则失败 ===', error)
      console.error('错误详情:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return []
    }

    console.log('=== API: 获取排休规则成功 ===', {数量: data?.length || 0, 数据: data})
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('=== API: 获取排休规则异常 ===', error)
    return []
  }
}

/**
 * 获取单个排休规则
 */
export async function getRestDayRule(ruleId: string): Promise<RestDayRule | null> {
  try {
    const {data, error} = await supabase.from('rest_day_rules').select('*').eq('id', ruleId).maybeSingle()

    if (error) {
      console.error('获取排休规则失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取排休规则异常:', error)
    return null
  }
}

/**
 * 更新排休规则
 */
export async function updateRestDayRule(ruleId: string, updates: Partial<RestDayRule>): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('rest_day_rules')
      .update({...updates, updated_at: new Date().toISOString()})
      .eq('id', ruleId)

    if (error) {
      console.error('更新排休规则失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('更新排休规则异常:', error)
    return false
  }
}

/**
 * 删除排休规则
 */
export async function deleteRestDayRule(ruleId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('rest_day_rules').delete().eq('id', ruleId)

    if (error) {
      console.error('删除排休规则失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除排休规则异常:', error)
    return false
  }
}

/**
 * 切换排休规则启用状态
 */
export async function toggleRestDayRuleStatus(ruleId: string, isActive: boolean): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('rest_day_rules')
      .update({is_active: isActive, updated_at: new Date().toISOString()})
      .eq('id', ruleId)

    if (error) {
      console.error('切换排休规则状态失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('切换排休规则状态异常:', error)
    return false
  }
}

/**
 * 获取员工适用的排休规则（按优先级）
 */
export async function getApplicableRestDayRules(
  tenantId: string,
  storeId: string,
  employeeId: string
): Promise<RestDayRule[]> {
  try {
    const {data, error} = await supabase
      .from('rest_day_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('priority', {ascending: false})

    if (error) {
      console.error('获取适用排休规则失败:', error)
      return []
    }

    if (!data) return []

    // 筛选适用于该员工的规则
    const applicableRules = data.filter((rule) => {
      const employees = rule.applicable_employees as string[]
      // 如果applicable_employees为空，表示适用所有员工
      return !employees || employees.length === 0 || employees.includes(employeeId)
    })

    return applicableRules
  } catch (error) {
    console.error('获取适用排休规则异常:', error)
    return []
  }
}
