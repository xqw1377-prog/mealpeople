// 营收明细和岗位配置相关API

import {supabase} from '@/client/supabase'
import type {
  BusinessArea,
  MealPeriodType,
  PositionCategory,
  PositionConfig,
  RevenueDetailRecord,
  RevenueImportLog,
  RevenueImportResult,
  RevenueImportRow
} from './types'

// ==================== 营收明细记录 ====================

/**
 * 获取营收明细记录列表
 */
export async function getRevenueDetailRecords(params: {
  tenantId: string
  storeId?: string
  startDate?: string
  endDate?: string
  mealPeriod?: MealPeriodType
  businessArea?: BusinessArea
}): Promise<RevenueDetailRecord[]> {
  let query = supabase
    .from('revenue_detail_records')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .order('revenue_date', {ascending: false})
    .order('meal_period', {ascending: true})

  if (params.storeId) {
    query = query.eq('store_id', params.storeId)
  }

  if (params.startDate) {
    query = query.gte('revenue_date', params.startDate)
  }

  if (params.endDate) {
    query = query.lte('revenue_date', params.endDate)
  }

  if (params.mealPeriod) {
    query = query.eq('meal_period', params.mealPeriod)
  }

  if (params.businessArea) {
    query = query.eq('business_area', params.businessArea)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取营收明细记录失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建营收明细记录
 */
export async function createRevenueDetailRecord(
  record: Omit<RevenueDetailRecord, 'id' | 'total_revenue' | 'created_at' | 'updated_at'>
): Promise<RevenueDetailRecord> {
  const {data, error} = await supabase.from('revenue_detail_records').insert(record).select().maybeSingle()

  if (error) {
    console.error('创建营收明细记录失败:', error)
    throw error
  }

  if (!data) {
    throw new Error('创建营收明细记录失败：未返回数据')
  }

  return data
}

/**
 * 更新营收明细记录
 */
export async function updateRevenueDetailRecord(
  id: string,
  updates: Partial<Omit<RevenueDetailRecord, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<RevenueDetailRecord> {
  const {data, error} = await supabase
    .from('revenue_detail_records')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新营收明细记录失败:', error)
    throw error
  }

  if (!data) {
    throw new Error('更新营收明细记录失败：未返回数据')
  }

  return data
}

/**
 * 删除营收明细记录
 */
export async function deleteRevenueDetailRecord(id: string): Promise<void> {
  const {error} = await supabase.from('revenue_detail_records').delete().eq('id', id)

  if (error) {
    console.error('删除营收明细记录失败:', error)
    throw error
  }
}

/**
 * 批量创建营收明细记录
 */
export async function batchCreateRevenueDetailRecords(
  records: Array<Omit<RevenueDetailRecord, 'id' | 'total_revenue' | 'created_at' | 'updated_at'>>
): Promise<RevenueDetailRecord[]> {
  const {data, error} = await supabase.from('revenue_detail_records').insert(records).select()

  if (error) {
    console.error('批量创建营收明细记录失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

// ==================== Excel导入功能 ====================

/**
 * 解析Excel数据并导入
 */
export async function importRevenueFromExcel(params: {
  tenantId: string
  storeId: string
  userId: string
  fileName: string
  rows: RevenueImportRow[]
}): Promise<RevenueImportResult> {
  const result: RevenueImportResult = {
    success: true,
    total: params.rows.length,
    success_count: 0,
    failed_count: 0,
    errors: []
  }

  const validRecords: Array<Omit<RevenueDetailRecord, 'id' | 'total_revenue' | 'created_at' | 'updated_at'>> = []

  // 验证和转换数据
  for (let i = 0; i < params.rows.length; i++) {
    const row = params.rows[i]
    const rowNumber = i + 2 // Excel行号（从2开始，因为第1行是表头）

    try {
      // 验证必填字段
      if (!row.日期) {
        throw new Error('日期不能为空')
      }
      if (!row.餐段) {
        throw new Error('餐段不能为空')
      }
      if (!row.经营区) {
        throw new Error('经营区不能为空')
      }
      if (row.来客数 === undefined || row.来客数 === null) {
        throw new Error('来客数不能为空')
      }
      if (row.客单价 === undefined || row.客单价 === null) {
        throw new Error('客单价不能为空')
      }

      // 验证数值
      if (row.来客数 < 0) {
        throw new Error('来客数不能为负数')
      }
      if (row.客单价 < 0) {
        throw new Error('客单价不能为负数')
      }

      // 转换餐段
      const mealPeriodMap: Record<string, MealPeriodType> = {
        早餐: 'breakfast',
        午餐: 'lunch',
        晚餐: 'dinner',
        夜宵: 'night'
      }
      const mealPeriod = mealPeriodMap[row.餐段]
      if (!mealPeriod) {
        throw new Error(`无效的餐段：${row.餐段}，请使用：早餐、午餐、晚餐、夜宵`)
      }

      // 转换经营区
      const businessAreaMap: Record<string, BusinessArea> = {
        大厅: 'hall',
        包间: 'private_room',
        外卖: 'takeout',
        其他: 'other'
      }
      const businessArea = businessAreaMap[row.经营区]
      if (!businessArea) {
        throw new Error(`无效的经营区：${row.经营区}，请使用：大厅、包间、外卖、其他`)
      }

      // 验证日期格式
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(row.日期)) {
        throw new Error(`无效的日期格式：${row.日期}，请使用 YYYY-MM-DD 格式`)
      }

      // 创建记录
      validRecords.push({
        tenant_id: params.tenantId,
        store_id: params.storeId,
        revenue_date: row.日期,
        meal_period: mealPeriod,
        business_area: businessArea,
        customer_count: row.来客数,
        avg_price_per_customer: row.客单价,
        notes: row.备注 || null,
        created_by: params.userId
      })
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        data: row,
        error: error instanceof Error ? error.message : '未知错误'
      })
      result.failed_count++
    }
  }

  // 批量插入有效记录
  if (validRecords.length > 0) {
    try {
      await batchCreateRevenueDetailRecords(validRecords)
      result.success_count = validRecords.length
    } catch (error) {
      console.error('批量插入营收记录失败:', error)
      result.success = false
      result.errors.push({
        row: 0,
        data: {} as RevenueImportRow,
        error: error instanceof Error ? error.message : '批量插入失败'
      })
    }
  }

  // 记录导入日志
  try {
    await createRevenueImportLog({
      tenant_id: params.tenantId,
      store_id: params.storeId,
      import_date: new Date().toISOString().split('T')[0],
      file_name: params.fileName,
      total_records: result.total,
      success_records: result.success_count,
      failed_records: result.failed_count,
      error_details: result.errors.length > 0 ? result.errors : null,
      imported_by: params.userId
    })
  } catch (error) {
    console.error('记录导入日志失败:', error)
  }

  result.success = result.failed_count === 0

  return result
}

/**
 * 创建导入日志
 */
export async function createRevenueImportLog(
  log: Omit<RevenueImportLog, 'id' | 'imported_at'>
): Promise<RevenueImportLog> {
  const {data, error} = await supabase.from('revenue_import_logs').insert(log).select().maybeSingle()

  if (error) {
    console.error('创建导入日志失败:', error)
    throw error
  }

  if (!data) {
    throw new Error('创建导入日志失败：未返回数据')
  }

  return data
}

/**
 * 获取导入日志列表
 */
export async function getRevenueImportLogs(params: {
  tenantId: string
  storeId?: string
  limit?: number
}): Promise<RevenueImportLog[]> {
  let query = supabase
    .from('revenue_import_logs')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .order('imported_at', {ascending: false})

  if (params.storeId) {
    query = query.eq('store_id', params.storeId)
  }

  if (params.limit) {
    query = query.limit(params.limit)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取导入日志失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

// ==================== 岗位配置 ====================

/**
 * 获取岗位配置列表
 */
export async function getPositionConfigs(params: {
  tenantId: string
  category?: PositionCategory
  isActive?: boolean
}): Promise<PositionConfig[]> {
  let query = supabase
    .from('position_config')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .order('display_order', {ascending: true})

  if (params.category) {
    query = query.eq('position_category', params.category)
  }

  if (params.isActive !== undefined) {
    query = query.eq('is_active', params.isActive)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取岗位配置失败:', error)
    throw error
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建岗位配置
 */
export async function createPositionConfig(
  config: Omit<PositionConfig, 'id' | 'created_at' | 'updated_at'>
): Promise<PositionConfig> {
  const {data, error} = await supabase.from('position_config').insert(config).select().maybeSingle()

  if (error) {
    console.error('创建岗位配置失败:', error)
    throw error
  }

  if (!data) {
    throw new Error('创建岗位配置失败：未返回数据')
  }

  return data
}

/**
 * 更新岗位配置
 */
export async function updatePositionConfig(
  id: string,
  updates: Partial<Omit<PositionConfig, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<PositionConfig> {
  const {data, error} = await supabase.from('position_config').update(updates).eq('id', id).select().maybeSingle()

  if (error) {
    console.error('更新岗位配置失败:', error)
    throw error
  }

  if (!data) {
    throw new Error('更新岗位配置失败：未返回数据')
  }

  return data
}

/**
 * 删除岗位配置
 */
export async function deletePositionConfig(id: string): Promise<void> {
  const {error} = await supabase.from('position_config').delete().eq('id', id)

  if (error) {
    console.error('删除岗位配置失败:', error)
    throw error
  }
}
