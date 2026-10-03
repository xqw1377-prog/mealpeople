/**
 * 品牌和门店管理模块
 * 包含品牌和门店的增删改查功能
 */

import {supabase} from '@/client/supabase'
import type {Brand, Store} from '../types'

// ==================== 品牌管理 API ====================

/**
 * 获取租户的所有品牌
 */
export async function getBrandsByTenantId(tenantId: string): Promise<Brand[]> {
  const {data, error} = await supabase
    .from('brands')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取品牌列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取品牌信息
 */
export async function getBrandById(brandId: string): Promise<Brand | null> {
  const {data, error} = await supabase.from('brands').select('*').eq('id', brandId).maybeSingle()

  if (error) {
    console.error('获取品牌信息失败:', error)
    return null
  }

  return data
}

/**
 * 创建品牌
 */
export async function createBrand(brand: {
  tenant_id: string
  name: string
  description?: string
  logo?: string
  industry?: string
}): Promise<Brand | null> {
  // 检查品牌名称是否已存在
  const {data: existing} = await supabase
    .from('brands')
    .select('id')
    .eq('tenant_id', brand.tenant_id)
    .eq('name', brand.name)
    .maybeSingle()

  if (existing) {
    console.error('品牌名称已存在')
    return null
  }

  const {data, error} = await supabase
    .from('brands')
    .insert({
      tenant_id: brand.tenant_id,
      name: brand.name,
      description: brand.description,
      logo: brand.logo,
      industry: brand.industry || '餐饮'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建品牌失败:', error)
    return null
  }

  return data
}

/**
 * 更新品牌信息
 */
export async function updateBrand(
  brandId: string,
  updates: {
    name?: string
    description?: string
    logo?: string
    industry?: string
  }
): Promise<boolean> {
  // 如果更新名称，检查是否重复
  if (updates.name) {
    const {data: brand} = await supabase.from('brands').select('tenant_id').eq('id', brandId).maybeSingle()

    if (brand) {
      const {data: existing} = await supabase
        .from('brands')
        .select('id')
        .eq('tenant_id', brand.tenant_id)
        .eq('name', updates.name)
        .neq('id', brandId)
        .maybeSingle()

      if (existing) {
        console.error('品牌名称已存在')
        return false
      }
    }
  }

  const {error} = await supabase
    .from('brands')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', brandId)

  if (error) {
    console.error('更新品牌失败:', error)
    return false
  }

  return true
}

/**
 * 删除品牌
 */
export async function deleteBrand(brandId: string): Promise<boolean> {
  // 检查是否有关联的门店
  const {data: stores} = await supabase.from('stores').select('id').eq('brand_id', brandId).limit(1)

  if (stores && stores.length > 0) {
    console.error('品牌下有门店，无法删除')
    return false
  }

  const {error} = await supabase.from('brands').delete().eq('id', brandId)

  if (error) {
    console.error('删除品牌失败:', error)
    return false
  }

  return true
}

/**
 * 获取品牌的门店数量
 */
export async function getBrandStoreCount(brandId: string): Promise<number> {
  const {data, error} = await supabase.from('stores').select('id', {count: 'exact'}).eq('brand_id', brandId)

  if (error) {
    console.error('获取品牌门店数量失败:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * 获取品牌的员工数量
 */
export async function getBrandEmployeeCount(brandId: string): Promise<number> {
  const {data, error} = await supabase.from('employees').select('id', {count: 'exact'}).eq('brand_id', brandId)

  if (error) {
    console.error('获取品牌员工数量失败:', error)
    return 0
  }

  return data?.length || 0
}

// ==================== 门店管理 API ====================

/**
 * 获取租户的所有门店
 */
export async function getStoresByTenantId(tenantId: string): Promise<Store[]> {
  console.log('=== getStoresByTenantId 被调用 ===', {租户ID: tenantId})

  const {data, error} = await supabase
    .from('stores')
    .select('*, brands(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('=== 获取门店列表失败 ===', {
      租户ID: tenantId,
      错误信息: error.message,
      错误详情: error
    })
    return []
  }

  console.log('=== 获取门店列表成功 ===', {
    租户ID: tenantId,
    门店数量: data?.length || 0,
    门店列表: data?.map((s) => ({id: s.id, name: s.name, brand_id: s.brand_id}))
  })

  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取门店信息
 */
export async function getStoreById(id: string): Promise<Store | null> {
  const {data, error} = await supabase.from('stores').select('*, brands(name)').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取门店信息失败:', error)
    return null
  }
  return data
}

/**
 * 创建门店
 */
export async function createStore(store: Partial<Store>): Promise<Store | null> {
  // 检查门店名称是否已存在
  const {data: existing} = await supabase
    .from('stores')
    .select('id')
    .eq('tenant_id', store.tenant_id!)
    .eq('name', store.name!)
    .maybeSingle()

  if (existing) {
    console.error('门店名称已存在')
    return null
  }

  const {data, error} = await supabase.from('stores').insert(store).select().maybeSingle()

  if (error) {
    console.error('创建门店失败:', error)
    return null
  }
  return data
}

/**
 * 更新门店信息
 */
export async function updateStore(id: string, updates: Partial<Store>): Promise<boolean> {
  // 如果更新名称，检查是否重复
  if (updates.name) {
    const {data: store} = await supabase.from('stores').select('tenant_id').eq('id', id).maybeSingle()

    if (store) {
      const {data: existing} = await supabase
        .from('stores')
        .select('id')
        .eq('tenant_id', store.tenant_id)
        .eq('name', updates.name)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        console.error('门店名称已存在')
        return false
      }
    }
  }

  const {error} = await supabase.from('stores').update(updates).eq('id', id)

  if (error) {
    console.error('更新门店失败:', error)
    return false
  }
  return true
}

/**
 * 删除门店
 */
export async function deleteStore(id: string): Promise<boolean> {
  const {error} = await supabase.from('stores').delete().eq('id', id)
  return !error
}
