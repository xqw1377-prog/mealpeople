import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import {createClient} from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

interface BindWechatRequest {
  code: string
  userId: string
}

interface WechatSession {
  openid: string
  session_key: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

Deno.serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders})
  }

  try {
    console.log('🔍 开始处理绑定微信请求...')

    // 创建 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 配置缺失')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 解析请求体
    const {code, userId}: BindWechatRequest = await req.json()
    console.log('📝 请求参数:', {code: code?.substring(0, 10) + '...', userId})

    if (!code || !userId) {
      throw new Error('缺少必要参数：code 或 userId')
    }

    // 获取微信小程序配置
    const wechatAppId = Deno.env.get('WECHAT_APPID')
    const wechatAppSecret = Deno.env.get('WECHAT_APPSECRET')

    console.log('🔑 微信配置:', {
      appId: wechatAppId ? wechatAppId.substring(0, 10) + '...' : '未配置',
      appSecret: wechatAppSecret ? '已配置' : '未配置'
    })

    if (!wechatAppId || !wechatAppSecret) {
      throw new Error('微信小程序配置缺失，请联系管理员配置 WECHAT_APPID 和 WECHAT_APPSECRET')
    }

    // 调用微信API获取openid
    const wechatApiUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${wechatAppId}&secret=${wechatAppSecret}&js_code=${code}&grant_type=authorization_code`

    console.log('📡 调用微信API...')
    const wechatResponse = await fetch(wechatApiUrl)
    const wechatData: WechatSession = await wechatResponse.json()

    console.log('📱 微信API响应:', {
      hasOpenid: !!wechatData.openid,
      hasUnionid: !!wechatData.unionid,
      errcode: wechatData.errcode,
      errmsg: wechatData.errmsg
    })

    if (wechatData.errcode) {
      throw new Error(`微信API错误: ${wechatData.errmsg} (${wechatData.errcode})`)
    }

    if (!wechatData.openid) {
      throw new Error('未能获取微信OpenID')
    }

    // 检查该openid是否已被其他用户绑定
    console.log('🔍 检查openid是否已被绑定...')
    const {data: existingProfile, error: checkError} = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('wechat_openid', wechatData.openid)
      .neq('id', userId)
      .maybeSingle()

    if (checkError) {
      console.error('❌ 检查绑定状态失败:', checkError)
      throw new Error(`检查绑定状态失败: ${checkError.message}`)
    }

    if (existingProfile) {
      throw new Error('该微信账号已被其他用户绑定')
    }

    // 更新用户的profile，绑定微信
    console.log('💾 更新用户profile...')
    const updateData: any = {
      wechat_openid: wechatData.openid,
      updated_at: new Date().toISOString()
    }

    if (wechatData.unionid) {
      updateData.wechat_unionid = wechatData.unionid
    }

    const {error: updateError} = await supabaseClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)

    if (updateError) {
      console.error('❌ 更新用户信息失败:', updateError)
      throw new Error(`更新用户信息失败: ${updateError.message}`)
    }

    console.log('✅ 绑定微信成功')

    // 返回成功响应
    return new Response(
      JSON.stringify({
        success: true,
        message: '绑定微信成功',
        data: {
          openid: wechatData.openid,
          unionid: wechatData.unionid
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ 绑定微信失败:', error)

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
