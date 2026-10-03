/**
 * 微信集成模块
 * 包含微信绑定、微信登录等功能
 */

import Taro from '@tarojs/taro'
import {supabase} from '@/client/supabase'

// ==================== 微信绑定 API ====================

/**
 * 绑定微信到用户账号
 */
export async function bindWechatToProfile(
  userId: string,
  code: string | null
): Promise<{success: boolean; message?: string}> {
  try {
    console.log('=== 开始绑定微信 ===', {userId, hasCode: !!code})

    if (code === null) {
      // 解绑微信
      console.log('=== 执行解绑操作 ===')
      const {error} = await supabase
        .from('profiles')
        .update({
          wechat_openid: null,
          wechat_unionid: null
        })
        .eq('id', userId)

      if (error) {
        console.error('解绑微信失败:', error)
        return {success: false, message: `解绑失败: ${error.message}`}
      }

      console.log('=== 解绑成功 ===')
      return {success: true, message: '解绑成功'}
    }

    // 获取用户的 JWT token
    const {
      data: {session}
    } = await supabase.auth.getSession()

    if (!session?.access_token) {
      console.error('=== 未找到用户会话 ===')
      return {success: false, message: '用户未登录，请先登录'}
    }

    // 调用Edge Function进行微信绑定
    const supabaseUrl = process.env.TARO_APP_SUPABASE_URL
    const functionUrl = `${supabaseUrl}/functions/v1/bind-wechat`

    console.log('=== 调用Edge Function ===', {
      url: functionUrl,
      userId,
      codeLength: code.length,
      hasToken: !!session.access_token
    })

    // 使用 Taro.request 替代 fetch
    const response = await Taro.request({
      url: functionUrl,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}` // 使用用户的 JWT token
      },
      data: {
        code,
        userId
      },
      timeout: 30000 // 30秒超时
    })

    console.log('=== Edge Function响应 ===', {
      statusCode: response.statusCode,
      data: response.data
    })

    // Taro.request 的响应结构不同于 fetch
    const result = response.data

    if (response.statusCode !== 200 || !result.success) {
      const errorMsg = result.message || result.error || '绑定失败'
      console.error('=== 绑定失败 ===', {
        statusCode: response.statusCode,
        message: errorMsg
      })
      return {
        success: false,
        message: errorMsg
      }
    }

    console.log('=== 绑定成功 ===')
    return {success: true, message: '绑定成功'}
  } catch (error) {
    console.error('=== 绑定微信异常 ===', error)

    // 提供更详细的错误信息
    let errorMessage = '绑定失败'
    if (error instanceof Error) {
      errorMessage = error.message
      // 网络错误
      if (errorMessage.includes('request:fail') || errorMessage.includes('network')) {
        errorMessage = '网络请求失败，请检查网络连接'
      }
      // 超时错误
      if (errorMessage.includes('timeout')) {
        errorMessage = '请求超时，请重试'
      }
    }

    return {
      success: false,
      message: errorMessage
    }
  }
}

/**
 * 检查微信是否已绑定
 */
export async function isWechatBound(userId: string): Promise<boolean> {
  try {
    const {data, error} = await supabase.from('profiles').select('wechat_openid').eq('id', userId).maybeSingle()

    if (error) {
      console.error('检查微信绑定状态失败:', error)
      return false
    }

    return !!data?.wechat_openid
  } catch (error) {
    console.error('检查微信绑定状态异常:', error)
    return false
  }
}
