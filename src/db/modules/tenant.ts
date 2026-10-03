/**
 * 租户管理模块
 * 包含租户的增删改查、租户申请、邀请码管理等功能
 */

import {supabase} from '@/client/supabase'
import type {Tenant, UserRole} from '../types'

// ==================== 租户基础 API ====================

/**
 * 获取所有租户列表
 */
export async function getTenants(): Promise<Tenant[]> {
  const {data, error} = await supabase.from('tenants').select('*').order('created_at', {ascending: false})

  if (error) {
    console.error('获取租户列表失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 根据ID获取租户详情
 */
export async function getTenantById(id: string): Promise<Tenant | null> {
  const {data, error} = await supabase.from('tenants').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取租户详情失败:', error)
    return null
  }
  return data
}

/**
 * 创建租户
 */
export async function createTenant(tenant: Partial<Tenant>): Promise<Tenant | null> {
  const {data, error} = await supabase
    .from('tenants')
    .insert({
      name: tenant.name,
      admin_phone: tenant.admin_phone,
      industry: tenant.industry || '餐饮',
      package_type: tenant.package_type || 'basic',
      status: tenant.status || 'active',
      store_count: tenant.store_count || 0,
      employee_count: tenant.employee_count || 0
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建租户失败:', error)
    return null
  }
  return data
}

/**
 * 创建租户并设置管理员
 */
export async function createTenantWithAdmin(
  tenantData: Partial<Tenant>,
  adminUserId: string
): Promise<{tenant: Tenant | null; success: boolean; message?: string}> {
  try {
    // 1. 创建租户
    const {data: tenant, error: tenantError} = await supabase
      .from('tenants')
      .insert({
        name: tenantData.name,
        admin_phone: tenantData.admin_phone,
        industry: tenantData.industry || '餐饮',
        package_type: tenantData.package_type || 'basic',
        status: 'active',
        store_count: 0,
        employee_count: 0
      })
      .select()
      .maybeSingle()

    if (tenantError || !tenant) {
      console.error('创建租户失败:', tenantError)
      return {
        tenant: null,
        success: false,
        message: `创建租户失败: ${tenantError?.message || '未知错误'}`
      }
    }

    // 2. 更新用户为租户管理员
    const {error: updateError} = await supabase
      .from('profiles')
      .update({
        tenant_id: tenant.id,
        role: 'tenant_admin' as UserRole
      })
      .eq('id', adminUserId)

    if (updateError) {
      console.error('更新用户角色失败:', updateError)
      // 回滚：删除刚创建的租户
      await supabase.from('tenants').delete().eq('id', tenant.id)
      return {
        tenant: null,
        success: false,
        message: `设置管理员失败: ${updateError.message}`
      }
    }

    return {
      tenant,
      success: true,
      message: '租户创建成功'
    }
  } catch (error) {
    console.error('创建租户异常:', error)
    return {
      tenant: null,
      success: false,
      message: error instanceof Error ? error.message : '创建租户失败'
    }
  }
}

/**
 * 更新租户信息
 */
export async function updateTenant(id: string, updates: Partial<Tenant>): Promise<boolean> {
  const {error} = await supabase.from('tenants').update(updates).eq('id', id)

  if (error) {
    console.error('更新租户失败:', error)
    return false
  }
  return true
}

/**
 * 删除租户
 */
export async function deleteTenant(id: string): Promise<boolean> {
  const {error} = await supabase.from('tenants').delete().eq('id', id)
  return !error
}

// ==================== 租户设置 API ====================

/**
 * 获取租户设置
 */
export async function getTenantSettings(tenantId: string) {
  const {data, error} = await supabase.from('tenant_settings').select('*').eq('tenant_id', tenantId).maybeSingle()

  if (error) {
    console.error('获取租户设置失败:', error)
    return null
  }
  return data
}

/**
 * 更新或插入租户设置
 */
export async function upsertTenantSettings(settings: {
  tenant_id: string
  brand_name?: string
  brand_logo?: string
  industry_type?: string
  business_model?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  work_days_per_week?: number
  daily_work_hours?: number
  overtime_threshold?: number
  rest_day_rules?: any
}) {
  const {data, error} = await supabase
    .from('tenant_settings')
    .upsert(
      {
        tenant_id: settings.tenant_id,
        brand_name: settings.brand_name,
        brand_logo: settings.brand_logo,
        industry_type: settings.industry_type,
        business_model: settings.business_model,
        contact_person: settings.contact_person,
        contact_phone: settings.contact_phone,
        contact_email: settings.contact_email,
        work_days_per_week: settings.work_days_per_week,
        daily_work_hours: settings.daily_work_hours,
        overtime_threshold: settings.overtime_threshold,
        rest_day_rules: settings.rest_day_rules,
        updated_at: new Date().toISOString()
      },
      {onConflict: 'tenant_id'}
    )
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新租户设置失败:', error)
    return null
  }
  return data
}

// ==================== 体验模式 API ====================

/**
 * 获取体验租户
 */
export async function getDemoTenant(): Promise<Tenant | null> {
  const {data, error} = await supabase
    .from('tenants')
    .select('*')
    .eq('is_demo', true)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    console.error('获取体验租户失败:', error)
    return null
  }

  return data
}

// ==================== 租户申请 API ====================

/**
 * 创建租户申请
 */
export async function createTenantApplication(application: {
  user_id: string
  tenant_name: string
  industry: string
  contact_person: string
  contact_phone: string
  contact_email?: string
  reason?: string
}): Promise<{success: boolean; message?: string; data?: any}> {
  try {
    // 获取用户信息以获取手机号
    const {data: profile, error: profileError} = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', application.user_id)
      .maybeSingle()

    if (profileError || !profile) {
      console.error('获取用户信息失败:', profileError)
      return {
        success: false,
        message: '获取用户信息失败，请确保已登录'
      }
    }

    const {data, error} = await supabase
      .from('tenant_applications')
      .insert({
        applicant_id: application.user_id,
        applicant_phone: profile.phone || application.contact_phone,
        tenant_name: application.tenant_name,
        brand_name: application.tenant_name, // 品牌名称默认使用租户名称
        industry: application.industry,
        company_address: '待补充', // 默认值，后续可以在审批时补充
        business_license: null,
        contact_person: application.contact_person,
        contact_phone: application.contact_phone,
        description: application.reason,
        status: 'pending'
      })
      .select()
      .maybeSingle()

    if (error) {
      console.error('创建租户申请失败:', error)
      return {
        success: false,
        message: error.message || '创建租户申请失败'
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('创建租户申请异常:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '创建租户申请失败'
    }
  }
}

/**
 * 获取用户的租户申请
 */
export async function getUserTenantApplications(userId: string) {
  const {data, error} = await supabase
    .from('tenant_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取用户租户申请失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 获取待审核的租户申请
 */
export async function getPendingTenantApplications() {
  const {data, error} = await supabase
    .from('tenant_applications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取待审核租户申请失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 获取所有租户申请
 */
export async function getAllTenantApplications() {
  const {data, error} = await supabase.from('tenant_applications').select('*').order('created_at', {ascending: false})

  if (error) {
    console.error('获取所有租户申请失败:', error)
    return []
  }
  return Array.isArray(data) ? data : []
}

/**
 * 批准租户申请
 */
export async function approveTenantApplication(
  applicationId: string,
  reviewerId: string
): Promise<{success: boolean; message?: string; tenant?: Tenant}> {
  try {
    // 1. 获取申请信息
    const {data: application, error: fetchError} = await supabase
      .from('tenant_applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle()

    if (fetchError || !application) {
      return {success: false, message: '申请不存在'}
    }

    if (application.status !== 'pending') {
      return {success: false, message: '申请已处理'}
    }

    // 2. 创建租户
    const {data: tenant, error: tenantError} = await supabase
      .from('tenants')
      .insert({
        name: application.tenant_name,
        industry: application.industry,
        status: 'active',
        max_stores: 10,
        max_employees: 100
      })
      .select()
      .maybeSingle()

    if (tenantError || !tenant) {
      return {success: false, message: `创建租户失败: ${tenantError?.message}`}
    }

    // 3. 更新用户为租户管理员
    const {error: updateUserError} = await supabase
      .from('profiles')
      .update({
        tenant_id: tenant.id,
        role: 'tenant_admin' as UserRole
      })
      .eq('id', application.user_id)

    if (updateUserError) {
      // 回滚：删除租户
      await supabase.from('tenants').delete().eq('id', tenant.id)
      return {success: false, message: `更新用户失败: ${updateUserError.message}`}
    }

    // 4. 更新申请状态
    const {error: updateAppError} = await supabase
      .from('tenant_applications')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        tenant_id: tenant.id
      })
      .eq('id', applicationId)

    if (updateAppError) {
      console.error('更新申请状态失败:', updateAppError)
    }

    return {success: true, message: '申请已批准', tenant}
  } catch (error) {
    console.error('批准租户申请异常:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '批准失败'
    }
  }
}

/**
 * 拒绝租户申请
 */
export async function rejectTenantApplication(
  applicationId: string,
  reviewerId: string,
  rejectReason?: string
): Promise<{success: boolean; message?: string}> {
  try {
    // 1. 获取申请信息
    const {data: application, error: fetchError} = await supabase
      .from('tenant_applications')
      .select('*')
      .eq('id', applicationId)
      .maybeSingle()

    if (fetchError || !application) {
      return {success: false, message: '申请不存在'}
    }

    if (application.status !== 'pending') {
      return {success: false, message: '申请已处理'}
    }

    // 2. 更新申请状态
    const {error: updateError} = await supabase
      .from('tenant_applications')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        reject_reason: rejectReason
      })
      .eq('id', applicationId)

    if (updateError) {
      return {success: false, message: `更新失败: ${updateError.message}`}
    }

    return {success: true, message: '申请已拒绝'}
  } catch (error) {
    console.error('拒绝租户申请异常:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '拒绝失败'
    }
  }
}

// ==================== 邀请码管理 API ====================

/**
 * 生成邀请码
 */
export async function generateInvitationCode(
  tenantId: string,
  createdBy: string,
  options?: {
    maxUses?: number
    expiresAt?: string
    role?: UserRole
  }
) {
  // G0-Z-R2: 邀请码由服务端 RPC 签发——CSPRNG token、DB 只存 hash、
  // 明文仅本次返回；角色固定 employee（管理角色须管理员指派）
  const {data, error} = await supabase.rpc('create_invitation', {
    p_max_uses: options?.maxUses ?? 1,
    p_expires_at: options?.expiresAt ?? new Date(Date.now() + 7 * 86400000).toISOString(),
    p_store_id: null
  })

  if (error) {
    console.error('生成邀请码失败:', error)
    return null
  }

  return data as {
    code: string
    hint: string
    role: string
    max_uses: number
    expires_at: string
  }
}

/**
 * 验证邀请码
 *
 * G0-A-R: 邀请码信息不再对客户端预读（防枚举）。这里仅做本地格式校验，
 * 真实有效性（存在/未过期/未用尽/角色）由 join_tenant_with_code 在
 * 兑换时于服务端校验。
 */
export async function validateInvitationCode(code: string) {
  const normalized = code.trim().toUpperCase()
  if (!/^[A-Z0-9]{4,16}$/.test(normalized)) {
    return {valid: false, message: '邀请码格式不正确'}
  }
  return {valid: true, message: '', data: null}
}

/**
 * 获取租户的邀请码列表
 */
export async function getInvitationCodesByTenantId(tenantId: string) {
  const {data, error} = await supabase
    .from('invitation_codes')
    .select('*, profiles!invitation_codes_created_by_fkey(name, phone)')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取邀请码列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 停用邀请码
 */
export async function deactivateInvitationCode(codeId: string) {
  const {error} = await supabase.from('invitation_codes').update({status: 'inactive'}).eq('id', codeId)

  if (error) {
    console.error('停用邀请码失败:', error)
    return false
  }
  return true
}

// ==================== 租户用户管理 API ====================

/**
 * 获取租户的所有用户
 */
export async function getTenantUsers(tenantId: string) {
  const {data, error} = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取租户用户失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 通过邀请码加入租户
 * @param code 邀请码
 * @param userId 用户ID
 * @param userName 用户名称
 * @returns 加入结果
 */
export async function joinTenantWithCode(code: string, userId: string, userName: string) {
  console.log('=== joinTenantWithCode 开始 ===', {code, userId, userName})

  const {data, error} = await supabase.rpc('join_tenant_with_code', {
    p_code: code,
    p_user_id: userId,
    p_user_name: userName
  })

  if (error) {
    console.error('加入租户失败:', error)
    return {
      success: false,
      message: '加入失败',
      tenant_id: null,
      store_id: null,
      role: null
    }
  }

  const result = Array.isArray(data) && data.length > 0 ? data[0] : data
  console.log('=== joinTenantWithCode 完成 ===', result)
  return result
}
