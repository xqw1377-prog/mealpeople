/**
 * 微信一键登录按钮组件
 *
 * 功能：
 * 1. 调用微信登录 API 获取 code
 * 2. 将 code 发送到后端 Edge Function，后端获取 openid 和用户信息
 * 3. 处理登录成功/失败
 * 4. 显示加载状态
 *
 * 注意：
 * - 使用微信 openid 作为唯一标识
 * - 用户头像和昵称可以在登录后在个人中心完善
 * - 符合微信小程序最新规范
 */

import {Button, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type React from 'react'
import {useState} from 'react'
import {supabase} from '@/client/supabase'

interface WechatLoginButtonProps {
  onLoginSuccess?: (user: any) => void
  onLoginError?: (error: string) => void
}

const WechatLoginButton: React.FC<WechatLoginButtonProps> = ({onLoginSuccess, onLoginError}) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleWechatLogin = async () => {
    if (isLoading) return

    setIsLoading(true)

    try {
      console.log('🚀 开始微信一键登录...')

      // 1. 调用微信登录 API 获取 code
      console.log('📱 调用 wx.login()...')
      const loginRes = await Taro.login()

      if (!loginRes.code) {
        throw new Error('获取微信登录 code 失败')
      }

      console.log('✅ 获取到微信 code:', `${loginRes.code.substring(0, 10)}...`)

      // 2. 调用后端 Edge Function
      // 后端会使用 code 调用微信 API 获取 openid 和 session_key
      console.log('🔐 调用后端登录接口...')
      const supabaseUrl = process.env.TARO_APP_SUPABASE_URL
      const functionUrl = `${supabaseUrl}/functions/v1/wechat-quick-login`

      console.log('📡 请求 URL:', functionUrl)

      const response = await Taro.request({
        url: functionUrl,
        method: 'POST',
        data: {
          code: loginRes.code
        },
        header: {
          'Content-Type': 'application/json'
        }
      })

      console.log('📋 后端响应:', {
        statusCode: response.statusCode,
        success: response.data?.success
      })

      if (response.statusCode !== 200 || !response.data?.success) {
        throw new Error(response.data?.error || '登录失败')
      }

      const {session, user, isNewUser} = response.data

      console.log('✅ 登录成功:', {
        userId: user.id,
        isNewUser
      })

      // 3. 设置 Supabase session
      console.log('🔑 设置 Supabase session...')
      const {error: sessionError} = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      })

      if (sessionError) {
        throw new Error(`设置登录状态失败: ${sessionError.message}`)
      }

      console.log('✅ Supabase session 设置成功')

      // 4. 显示成功提示
      await Taro.showToast({
        title: isNewUser ? '欢迎加入！' : '欢迎回来！',
        icon: 'success',
        duration: 2000
      })

      // 5. 调用成功回调
      if (onLoginSuccess) {
        // 获取完整的用户信息
        const {data: profile} = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()

        onLoginSuccess(profile || user)
      }
    } catch (error) {
      console.error('❌ 微信登录失败:', error)

      const errorMessage = error instanceof Error ? error.message : '登录失败，请重试'

      await Taro.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      })

      if (onLoginError) {
        onLoginError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View className="w-full">
      {/* 微信一键登录按钮 - 使用微信绿色 */}
      <Button
        className="w-full py-4 rounded-xl break-keep text-base font-semibold"
        style={{
          background: 'linear-gradient(135deg, #07c160 0%, #06ae56 100%)',
          color: '#ffffff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(7, 193, 96, 0.3)'
        }}
        size="default"
        onClick={handleWechatLogin}
        disabled={isLoading}>
        <View className="flex items-center justify-center">
          <View className="i-mdi-wechat text-2xl mr-2" style={{color: '#ffffff'}} />
          <Text style={{color: '#ffffff'}}>{isLoading ? '登录中...' : '微信一键登录'}</Text>
        </View>
      </Button>

      <View className="mt-3 text-center">
        <Text className="text-xs text-gray-600 block">
          {isLoading ? '正在验证微信身份...' : '使用微信账号快速登录，安全便捷'}
        </Text>
      </View>

      {/* 提示信息 */}
      <View className="mt-4 p-3 bg-gray-50 rounded-lg">
        <Text className="text-xs text-gray-600 block text-center">💡 登录后可在个人中心完善头像和昵称</Text>
      </View>
    </View>
  )
}

export default WechatLoginButton
