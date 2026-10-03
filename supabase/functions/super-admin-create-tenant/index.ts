import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import {createClient} from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface CreateTenantRequest {
  tenantName: string
  adminPhone: string
  industry?: string
  packageType?: string
}

Deno.serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders})
  }

  try {
    // 创建 Supabase 客户端
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 获取请求头中的授权信息
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('未提供授权信息')
    }

    // 验证当前用户
    const token = authHeader.replace('Bearer ', '')
    const {
      data: {user},
      error: authError
    } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('用户认证失败')
    }

    // 验证用户是否是超级管理员
    const {data: profile, error: profileError} = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('获取用户信息失败')
    }

    if (profile.role !== 'super_admin') {
      throw new Error('权限不足：只有超级管理员可以创建租户')
    }

    // 解析请求体
    const {tenantName, adminPhone, industry, packageType}: CreateTenantRequest = await req.json()

    // 验证必填字段
    if (!tenantName || !adminPhone) {
      throw new Error('租户名称和管理员电话号码为必填项')
    }

    // 清理电话号码（去掉 +86 前缀）
    const cleanPhone = adminPhone.replace(/^\+86/, '').replace(/\s/g, '')

    // 验证电话号码格式
    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
      throw new Error('电话号码格式不正确')
    }

    // 检查电话号码是否已被使用
    const {data: existingTenant} = await supabaseClient
      .from('tenants')
      .select('id, name')
      .eq('admin_phone', cleanPhone)
      .single()

    if (existingTenant) {
      throw new Error(`该电话号码已被租户"${existingTenant.name}"使用`)
    }

    // 创建租户
    const {data: tenant, error: tenantError} = await supabaseClient
      .from('tenants')
      .insert({
        name: tenantName,
        admin_phone: cleanPhone,
        industry: industry || null,
        package_type: packageType || 'basic',
        status: 'active',
        store_count: 0,
        employee_count: 0
      })
      .select()
      .single()

    if (tenantError) {
      console.error('创建租户失败:', tenantError)
      throw new Error(`创建租户失败: ${tenantError.message}`)
    }

    console.log('✅ 租户创建成功:', {
      tenantId: tenant.id,
      tenantName: tenant.name,
      adminPhone: cleanPhone
    })

    // 创建租户默认设置
    console.log('创建租户默认设置...')

    const {data: tenantSettings, error: settingsError} = await supabaseClient
      .from('tenant_settings')
      .insert({
        tenant_id: tenant.id,
        default_daily_work_hours: 8,
        default_monthly_work_days: 26,
        default_part_time_hourly_rate: 20,
        cost_warning_threshold: 0.35,
        efficiency_warning_threshold: 0.8
      })
      .select()
      .single()

    if (settingsError) {
      console.error('⚠️ 创建租户设置失败:', settingsError)
      // 不中断流程，只记录错误
    } else {
      console.log('✅ 租户设置创建成功:', tenantSettings)
    }

    // 查找管理员用户（通过电话号码）
    const {data: adminProfile} = await supabaseClient
      .from('profiles')
      .select('id, role, tenant_id')
      .eq('phone', cleanPhone)
      .maybeSingle()

    if (adminProfile) {
      // 用户已存在，更新为租户管理员
      const {error: updateError} = await supabaseClient
        .from('profiles')
        .update({
          tenant_id: tenant.id,
          role: 'tenant_admin'
        })
        .eq('id', adminProfile.id)

      if (updateError) {
        console.error('⚠️ 更新管理员信息失败:', updateError)
      } else {
        console.log('✅ 管理员用户已关联到租户:', {
          userId: adminProfile.id,
          tenantId: tenant.id
        })
      }
    } else {
      console.log('ℹ️ 管理员用户尚未注册，等待用户首次登录后自动关联')
    }

    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        message: '租户创建成功',
        data: {
          tenant: {
            id: tenant.id,
            name: tenant.name,
            admin_phone: tenant.admin_phone,
            industry: tenant.industry,
            package_type: tenant.package_type,
            status: tenant.status
          }
        }
      }),
      {
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ 创建租户失败:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '创建租户失败'
      }),
      {
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
        status: 400
      }
    )
  }
})
