import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import {createClient} from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface LoginRequest {
  phone: string
  wechatOpenid?: string // 微信 OpenID（可选）
  wechatUnionid?: string // 微信 UnionID（可选）
}

Deno.serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders})
  }

  try {
    console.log('🔍 开始处理租户管理员登录请求...')

    // 创建 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('📡 Supabase URL:', supabaseUrl)
    console.log('🔑 Service Role Key 存在:', !!supabaseKey)

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 配置缺失')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 获取请求头中的授权信息
    const authHeader = req.headers.get('Authorization')
    console.log('🔐 Authorization Header 存在:', !!authHeader)

    if (!authHeader) {
      throw new Error('未提供授权信息')
    }

    // 验证当前用户
    const token = authHeader.replace('Bearer ', '')
    console.log('🎫 Token 长度:', token.length)

    const {
      data: {user},
      error: authError
    } = await supabaseClient.auth.getUser(token)

    console.log('👤 用户验证结果:', {
      userId: user?.id,
      userPhone: user?.phone,
      error: authError?.message
    })

    if (authError || !user) {
      throw new Error(`用户认证失败: ${authError?.message || '未知错误'}`)
    }

    // 解析请求体
    const {phone, wechatOpenid, wechatUnionid}: LoginRequest = await req.json()
    console.log('📱 请求的电话号码:', phone)
    console.log('🔑 微信 OpenID:', wechatOpenid ? '已提供' : '未提供')
    console.log('🔑 微信 UnionID:', wechatUnionid ? '已提供' : '未提供')

    // 清理电话号码（去掉 +86 前缀）
    const cleanPhone = phone.replace(/^\+86/, '').replace(/\s/g, '')
    console.log('📱 清理后的电话号码:', cleanPhone)

    // 查询该电话号码是否是某个租户的管理员
    console.log('🔍 查询租户信息...')
    const {data: tenant, error: tenantError} = await supabaseClient
      .from('tenants')
      .select('*')
      .eq('admin_phone', cleanPhone)
      .eq('status', 'active')
      .maybeSingle()

    console.log('🏢 租户查询结果:', {
      tenant: tenant ? {id: tenant.id, name: tenant.name} : null,
      error: tenantError?.message
    })

    if (tenantError) {
      console.error('❌ 查询租户失败:', tenantError)
      throw new Error(`查询租户失败: ${tenantError.message}`)
    }

    if (!tenant) {
      console.log('❌ 该电话号码未授权:', cleanPhone)
      throw new Error('该手机号未授权，请联系超级管理员')
    }

    console.log('✅ 找到租户:', {
      tenantId: tenant.id,
      tenantName: tenant.name
    })

    // 检查用户 profile 是否存在
    console.log('🔍 查询用户 profile...')
    const {data: existingProfile, error: profileQueryError} = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    console.log('👤 Profile 查询结果:', {
      profile: existingProfile
        ? {
            id: existingProfile.id,
            phone: existingProfile.phone,
            role: existingProfile.role,
            tenant_id: existingProfile.tenant_id
          }
        : null,
      error: profileQueryError?.message
    })

    if (existingProfile) {
      // 更新现有 profile（包括微信ID）
      console.log('🔄 更新现有 profile...')
      console.log('📋 当前 Profile 信息:', {
        id: existingProfile.id,
        phone: existingProfile.phone,
        role: existingProfile.role,
        tenant_id: existingProfile.tenant_id
      })

      const updateData: any = {
        tenant_id: tenant.id,
        role: 'tenant_admin',
        phone: cleanPhone,
        updated_at: new Date().toISOString()
      }

      console.log('📝 准备更新的数据:', updateData)

      // 如果提供了微信ID，则绑定
      if (wechatOpenid) {
        updateData.wechat_openid = wechatOpenid
        console.log('🔗 绑定微信 OpenID')
      }
      if (wechatUnionid) {
        updateData.wechat_unionid = wechatUnionid
        console.log('🔗 绑定微信 UnionID')
      }

      const {data: updatedData, error: updateError} = await supabaseClient
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()

      console.log('📊 更新结果:', {
        data: updatedData,
        error: updateError?.message
      })

      if (updateError) {
        console.error('❌ 更新用户信息失败:', updateError)
        throw new Error(`更新用户信息失败: ${updateError.message}`)
      }

      if (!updatedData || updatedData.length === 0) {
        console.error('❌ 更新成功但没有返回数据')
        throw new Error('更新用户信息失败：没有返回数据')
      }

      console.log('✅ 用户信息已更新:', updatedData[0])
    } else {
      // 创建新 profile（包括微信ID）
      console.log('➕ 创建新 profile...')
      const insertData: any = {
        id: user.id,
        tenant_id: tenant.id,
        role: 'tenant_admin',
        phone: cleanPhone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 如果提供了微信ID，则绑定
      if (wechatOpenid) {
        insertData.wechat_openid = wechatOpenid
        console.log('🔗 绑定微信 OpenID')
      }
      if (wechatUnionid) {
        insertData.wechat_unionid = wechatUnionid
        console.log('🔗 绑定微信 UnionID')
      }

      const {error: insertError} = await supabaseClient.from('profiles').insert(insertData)

      if (insertError) {
        console.error('❌ 创建用户信息失败:', insertError)
        throw new Error(`创建用户信息失败: ${insertError.message}`)
      }

      console.log('✅ 用户信息已创建')
    }

    // 返回成功响应
    const responseData = {
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          phone: cleanPhone,
          role: 'tenant_admin'
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          industry: tenant.industry,
          package_type: tenant.package_type,
          status: tenant.status
        }
      }
    }

    console.log('✅ 登录成功，返回响应:', responseData)

    return new Response(JSON.stringify(responseData), {
      headers: {...corsHeaders, 'Content-Type': 'application/json'},
      status: 200
    })
  } catch (error) {
    console.error('❌ 登录失败:', error)

    const errorMessage = error instanceof Error ? error.message : '登录失败'
    console.error('错误详情:', errorMessage)

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: {...corsHeaders, 'Content-Type': 'application/json'},
        status: 400
      }
    )
  }
})
