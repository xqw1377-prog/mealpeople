import {createClient} from 'jsr:@supabase/supabase-js@2'

// Edge Function: 创建租户并设置管理员
// 使用 service_role_key，绕过 RLS 策略限制

Deno.serve(async (req: Request) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    })
  }

  try {
    // 获取请求参数
    const {userId, phone} = await req.json()

    console.log('=== Edge Function: create-tenant-with-admin 开始 ===')
    console.log('参数:', {userId, phone})

    // 验证参数
    if (!userId || !phone) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '缺少必要参数'
        }),
        {
          status: 400,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
      )
    }

    // 创建 Supabase 客户端（使用 service_role_key）
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Supabase 客户端创建成功')

    // 1. 检查 profile 是否存在
    const {data: existingProfile, error: profileCheckError} = await supabase
      .from('profiles')
      .select('id, tenant_id, role, name, phone')
      .eq('id', userId)
      .maybeSingle()

    console.log('检查 profile:', existingProfile, '错误:', profileCheckError)

    // 2. 如果 profile 不存在，创建 profile
    if (!existingProfile) {
      console.log('profile 不存在，创建新 profile')

      const {data: newProfile, error: createProfileError} = await supabase
        .from('profiles')
        .insert({
          id: userId,
          phone: phone,
          role: 'employee',
          name: `用户_${phone.slice(-4)}`
        })
        .select()
        .single()

      if (createProfileError) {
        console.error('创建 profile 失败:', createProfileError)
        return new Response(
          JSON.stringify({
            success: false,
            message: '创建用户信息失败',
            error: createProfileError.message
          }),
          {
            status: 500,
            headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
          }
        )
      }

      console.log('profile 创建成功:', newProfile)
    }

    // 3. 检查是否已经有租户
    const {data: profileWithTenant, error: tenantCheckError} = await supabase
      .from('profiles')
      .select('id, tenant_id, role')
      .eq('id', userId)
      .single()

    console.log('检查租户:', profileWithTenant, '错误:', tenantCheckError)

    if (profileWithTenant?.tenant_id) {
      console.log('用户已有租户，直接返回')
      return new Response(
        JSON.stringify({
          success: true,
          isNewTenant: false,
          message: '登录成功'
        }),
        {
          status: 200,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
      )
    }

    // 4. 创建新租户
    const tenantName = `租户_${phone.slice(-4)}`
    console.log('创建新租户:', tenantName)

    const {data: newTenant, error: createTenantError} = await supabase
      .from('tenants')
      .insert({
        name: tenantName,
        status: 'active'
      })
      .select()
      .single()

    if (createTenantError) {
      console.error('创建租户失败:', createTenantError)
      return new Response(
        JSON.stringify({
          success: false,
          message: '创建租户失败',
          error: createTenantError.message
        }),
        {
          status: 500,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
      )
    }

    console.log('租户创建成功:', newTenant)

    // 5. 创建租户默认设置
    console.log('创建租户默认设置')

    const {data: tenantSettings, error: createSettingsError} = await supabase
      .from('tenant_settings')
      .insert({
        tenant_id: newTenant.id,
        default_daily_work_hours: 8,
        default_monthly_work_days: 26,
        default_part_time_hourly_rate: 20,
        cost_warning_threshold: 0.35,
        efficiency_warning_threshold: 0.8
      })
      .select()
      .single()

    if (createSettingsError) {
      console.error('创建租户设置失败:', createSettingsError)
      // 不中断流程，只记录错误
    } else {
      console.log('租户设置创建成功:', tenantSettings)
    }

    // 6. 更新 profile，设置 tenant_id 和 role
    console.log('更新 profile，设置租户和角色')

    const {data: updatedProfile, error: updateProfileError} = await supabase
      .from('profiles')
      .update({
        tenant_id: newTenant.id,
        role: 'tenant_admin'
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateProfileError) {
      console.error('更新 profile 失败:', updateProfileError)
      return new Response(
        JSON.stringify({
          success: false,
          message: '设置管理员失败',
          error: updateProfileError.message
        }),
        {
          status: 500,
          headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
        }
      )
    }

    console.log('profile 更新成功:', updatedProfile)
    console.log('=== Edge Function: create-tenant-with-admin 完成 ===')

    // 7. 返回成功
    return new Response(
      JSON.stringify({
        success: true,
        isNewTenant: true,
        message: '租户创建成功',
        data: {
          tenant: newTenant,
          profile: updatedProfile
        }
      }),
      {
        status: 200,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      }
    )
  } catch (error) {
    console.error('Edge Function 执行失败:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '服务器错误',
        error: error.message
      }),
      {
        status: 500,
        headers: {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}
      }
    )
  }
})
