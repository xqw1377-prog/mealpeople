
import {createClient} from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface WechatLoginRequest {
  wechatOpenid: string
  wechatUnionid?: string
}

Deno.serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders})
  }

  try {
    console.log('🔍 开始处理微信ID登录请求...')

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

    console.log('👤 用户认证结果:', {
      userId: user?.id,
      userPhone: user?.phone,
      error: authError?.message
    })

    if (authError || !user) {
      throw new Error(`用户认证失败: ${authError?.message || '未知错误'}`)
    }

    // 解析请求体
    const {wechatOpenid, wechatUnionid}: WechatLoginRequest = await req.json()
    console.log('🔑 收到微信登录请求')

    if (!wechatOpenid) {
      throw new Error('微信 OpenID 不能为空')
    }

    // 查询该微信ID是否已绑定账号
    console.log('🔍 查询微信ID绑定信息...')
    const {data: profile, error: profileError} = await supabaseClient
      .from('profiles')
      .select('*, tenants(*)')
      .eq('wechat_openid', wechatOpenid)
      .maybeSingle()

    console.log('👤 Profile 查询结果:', {
      profile: profile
        ? {
            id: profile.id,
            phone: profile.phone,
            role: profile.role,
            tenant_id: profile.tenant_id
          }
        : null,
      error: profileError?.message
    })

    if (profileError) {
      console.error('❌ 查询用户信息失败:', profileError)
      throw new Error(`查询用户信息失败: ${profileError.message}`)
    }

    if (!profile) {
      console.log('❌ 该微信ID未绑定账号')
      throw new Error('该微信账号未绑定，请先使用手机号登录')
    }

    console.log('✅ 找到绑定账号:', {
      profileId: profile.id,
      tenantId: profile.tenant_id,
      role: profile.role
    })

    // G0-B (P0-SEC-02): openid 属于其他账号时一律拒绝。
    // 旧逻辑会把绑定者的 role/tenant_id/phone 复制到当前调用者——即账号接管，已删除。
    if (user.id !== profile.id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '该微信已绑定其他账号，请先在原账号解除绑定后再试'
        }),
        {
          headers: {...corsHeaders, 'Content-Type': 'application/json'},
          status: 409
        }
      )
    }

    // G0-A-R 不变量: CLIENT NEVER ASSERTS WECHAT IDENTITY。
    // 本函数不再写任何微信身份字段（unionid 写入已删除——客户端声明的值
    // 不可作为身份事实；unionid 只能经 bind-wechat 由服务端 code 换取写入）。
    // 本函数保留只读查询：openid 绑定者非本人时 409 拒绝。

    // 返回成功响应
    const responseData = {
      success: true,
      message: '微信登录成功',
      data: {
        user: {
          id: profile.id,
          phone: profile.phone,
          role: profile.role,
          tenant_id: profile.tenant_id
        },
        tenant: profile.tenants
      }
    }

    console.log('✅ 微信登录成功:', responseData)

    return new Response(JSON.stringify(responseData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    })
  } catch (error) {
    console.error('❌ 微信登录失败:', error)

    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
        error: errorMessage
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    )
  }
})
