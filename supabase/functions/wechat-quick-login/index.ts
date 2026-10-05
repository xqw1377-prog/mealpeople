/**
 * 微信小程序一键登录 Edge Function
 * 
 * 功能：
 * 1. 接收前端传来的微信登录 code
 * 2. 使用 code 向微信服务器换取 openid 和 session_key
 * 3. 查找或创建用户
 * 4. 生成 Supabase session token
 * 5. 返回登录结果
 */


import {createClient} from 'npm:@supabase/supabase-js@2'

// CORS 头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

// 微信 API 配置
const WECHAT_API_URL = 'https://api.weixin.qq.com/sns/jscode2session'

interface WechatLoginRequest {
  code: string // 微信登录 code
  nickname?: string // 微信昵称（可选）
  avatar?: string // 微信头像（可选）
}

interface WechatApiResponse {
  openid?: string
  session_key?: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

Deno.serve(async (req: Request) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    console.log('🚀 开始处理微信一键登录请求...')

    // 1. 解析请求
    const {code, nickname, avatar} = (await req.json()) as WechatLoginRequest

    if (!code) {
      console.error('❌ 缺少微信登录 code')
      return new Response(
        JSON.stringify({
          success: false,
          error: '缺少微信登录 code'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    console.log('📝 收到登录请求:', {
      hasCode: !!code,
      hasNickname: !!nickname,
      hasAvatar: !!avatar
    })

    // 2. 获取环境变量
    const appId = Deno.env.get('WECHAT_APPID')
    const appSecret = Deno.env.get('WECHAT_APPSECRET')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('🔧 环境变量检查:', {
      hasAppId: !!appId,
      hasAppSecret: !!appSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })

    if (!appId || !appSecret) {
      console.error('❌ 微信配置缺失')
      return new Response(
        JSON.stringify({
          success: false,
          error: '微信登录配置错误，请联系管理员'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase 配置缺失')
      return new Response(
        JSON.stringify({
          success: false,
          error: '数据库配置错误，请联系管理员'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 3. 向微信服务器换取 openid
    console.log('🔐 开始向微信服务器换取 openid...')
    const wechatUrl = `${WECHAT_API_URL}?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`

    const wechatResponse = await fetch(wechatUrl)
    const wechatData = (await wechatResponse.json()) as WechatApiResponse

    console.log('📋 微信 API 响应:', {
      hasOpenid: !!wechatData.openid,
      hasUnionid: !!wechatData.unionid,
      errcode: wechatData.errcode,
      errmsg: wechatData.errmsg
    })

    if (wechatData.errcode) {
      console.error('❌ 微信 API 错误:', wechatData.errmsg)
      return new Response(
        JSON.stringify({
          success: false,
          error: `微信登录失败: ${wechatData.errmsg}`
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const {openid, unionid} = wechatData

    if (!openid) {
      console.error('❌ 未获取到 openid')
      return new Response(
        JSON.stringify({
          success: false,
          error: '微信登录失败，未获取到用户标识'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    console.log('✅ 成功获取 openid:', openid.substring(0, 8) + '...')

    // 4. 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 5. 查找或创建用户
    console.log('🔍 查找用户...')
    const {data: existingProfile, error: findError} = await supabase
      .from('profiles')
      .select('*')
      .eq('wechat_openid', openid)
      .maybeSingle()

    if (findError) {
      console.error('❌ 查找用户失败:', findError)
      return new Response(
        JSON.stringify({
          success: false,
          error: '查找用户失败'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    let userId: string
    let isNewUser = false

    if (existingProfile) {
      // 用户已存在
      console.log('👤 找到已存在用户:', existingProfile.id)
      userId = existingProfile.id

      // 更新微信信息（如果提供了）
      if (nickname || avatar) {
        const updateData: any = {}
        if (nickname) updateData.wechat_nickname = nickname
        if (avatar) updateData.wechat_avatar = avatar
        updateData.updated_at = new Date().toISOString()

        const {error: updateError} = await supabase.from('profiles').update(updateData).eq('id', userId)

        if (updateError) {
          console.error('⚠️ 更新用户微信信息失败:', updateError)
        } else {
          console.log('✅ 更新用户微信信息成功')
        }
      }
    } else {
      // 创建新用户
      console.log('🆕 创建新用户...')
      isNewUser = true

      // 先在 auth.users 中创建用户
      const {data: authUser, error: createAuthError} = await supabase.auth.admin.createUser({
        email: `wechat_${openid}@temp.com`, // 临时邮箱
        email_confirm: true,
        user_metadata: {
          wechat_openid: openid,
          wechat_unionid: unionid,
          wechat_nickname: nickname,
          wechat_avatar: avatar
        }
      })

      if (createAuthError || !authUser.user) {
        console.error('❌ 创建 auth 用户失败:', createAuthError)
        return new Response(
          JSON.stringify({
            success: false,
            error: '创建用户失败'
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }

      userId = authUser.user.id
      console.log('✅ 创建 auth 用户成功:', userId)

      // G0-CLOSURE-R1: 移除 first-user super_admin bootstrap
      // （CONTROLLED_PROVISIONING：注册/登录只发行非特权身份，
      //   super_admin 仅经平台受控 provisioning 创建）
      const role = 'guest'

      console.log('👤 用户角色:', role)

      // 在 profiles 表中创建记录
      const {error: createProfileError} = await supabase.from('profiles').insert({
        id: userId,
        wechat_openid: openid,
        wechat_unionid: unionid,
        wechat_nickname: nickname,
        wechat_avatar: avatar,
        name: nickname || '微信用户',
        avatar_url: avatar,
        role: role,
        employment_type: 'full_time',
        daily_work_hours: 8,
        status: 'active'
      })

      if (createProfileError) {
        console.error('❌ 创建 profile 失败:', createProfileError)
        // 删除已创建的 auth 用户
        await supabase.auth.admin.deleteUser(userId)
        return new Response(
          JSON.stringify({
            success: false,
            error: '创建用户资料失败'
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }

      console.log('✅ 创建 profile 成功，角色:', role)
    }

    // 6. 生成 session token
    console.log('🔑 生成 session token...')
    const {data: sessionData, error: sessionError} = await supabase.auth.admin.createSession({
      user_id: userId
    })

    if (sessionError || !sessionData) {
      console.error('❌ 生成 session 失败:', sessionError)
      return new Response(
        JSON.stringify({
          success: false,
          error: '生成登录凭证失败'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    console.log('✅ 微信一键登录成功！')

    // 7. 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        isNewUser,
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          expires_at: sessionData.session.expires_at,
          expires_in: sessionData.session.expires_in
        },
        user: {
          id: userId,
          openid: openid,
          nickname: nickname,
          avatar: avatar
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('❌ 微信登录异常:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
