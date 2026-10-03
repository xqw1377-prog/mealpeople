import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {getEnv, navigateBack, showToast} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {bindWechatToProfile, getProfileByUserId} from '@/db/api'

const BindWechat: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [bound, setBound] = useState(false)

  // 加载用户信息
  const loadProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      const profileData = await getProfileByUserId(user.id)
      setProfile(profileData)
      setBound(!!profileData?.wechat_openid)
    } catch (error) {
      console.error('加载用户信息失败:', error)
    }
  }, [user])

  // 页面加载时获取用户信息
  Taro.useDidShow(() => {
    loadProfile()
  })

  // 绑定微信
  const handleBindWechat = async () => {
    if (!user?.id) {
      showToast({title: '用户信息不存在', icon: 'none'})
      return
    }

    // 检查是否在微信小程序环境
    const env = getEnv()
    if (env !== 'WEAPP') {
      showToast({
        title: '此功能仅在微信小程序中可用',
        icon: 'none',
        duration: 2000
      })
      return
    }

    setLoading(true)
    try {
      // 调用微信登录获取code
      console.log('=== 步骤1：调用微信登录 ===')
      const loginRes = await Taro.login()
      console.log('=== 微信登录成功 ===', {
        code: `${loginRes.code?.substring(0, 10)}...`,
        errMsg: loginRes.errMsg
      })

      if (!loginRes.code) {
        throw new Error('获取微信授权码失败')
      }

      // 调用后端接口绑定微信
      console.log('=== 步骤2：调用绑定接口 ===', {userId: user.id})
      const result = await bindWechatToProfile(user.id, loginRes.code)
      console.log('=== 绑定接口返回 ===', result)

      if (result.success) {
        showToast({
          title: '绑定成功',
          icon: 'success',
          duration: 2000
        })
        setBound(true)
        // 刷新用户信息
        await loadProfile()
        // 延迟返回
        setTimeout(() => {
          navigateBack()
        }, 2000)
      } else {
        // 显示详细的错误信息
        const errorMsg = result.message || '绑定失败'
        console.error('=== 绑定失败 ===', errorMsg)
        showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        })
      }
    } catch (error) {
      console.error('=== 绑定微信异常 ===', error)
      const errorMsg = error instanceof Error ? error.message : '绑定失败，请重试'
      showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  // 解绑微信
  const handleUnbindWechat = async () => {
    const confirmRes = await Taro.showModal({
      title: '确认解绑',
      content: '解绑后将无法使用微信一键登录，确定要解绑吗？'
    })

    if (!confirmRes.confirm) return

    setLoading(true)
    try {
      // 调用后端接口解绑微信
      const result = await bindWechatToProfile(user?.id, null)

      if (result.success) {
        showToast({
          title: '解绑成功',
          icon: 'success',
          duration: 2000
        })
        setBound(false)
        await loadProfile()
      } else {
        showToast({
          title: result.message || '解绑失败',
          icon: 'none',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('解绑微信失败:', error)
      showToast({
        title: error instanceof Error ? error.message : '解绑失败，请重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          {/* 标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground block mb-2">绑定微信</Text>
            <Text className="text-sm text-muted-foreground block">绑定微信后，可以使用微信一键登录，更加便捷安全</Text>
          </View>

          {/* 微信图标 */}
          <View className="flex justify-center mb-8">
            <View className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
              <View className="i-mdi-wechat text-5xl text-blue-600"></View>
            </View>
          </View>

          {/* 绑定状态卡片 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-bold text-foreground block">绑定状态</Text>
              <View className={`px-3 py-1 rounded-full ${bound ? 'bg-blue-100' : 'bg-gray-50'}`}>
                <Text className={`text-xs font-medium ${bound ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                  {bound ? '已绑定' : '未绑定'}
                </Text>
              </View>
            </View>

            {bound && profile?.wechat_openid && (
              <View className="pt-4 border-t border-border">
                <Text className="text-sm text-muted-foreground block mb-2">微信OpenID</Text>
                <Text className="text-xs text-muted-foreground font-mono block break-all">{profile.wechat_openid}</Text>
              </View>
            )}
          </View>

          {/* 功能说明 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-6 shadow-sm">
            <Text className="text-base font-bold text-foreground block mb-4">功能说明</Text>
            <View className="space-y-3">
              <View className="flex items-start gap-3">
                <View className="i-mdi-check-circle text-lg text-muted-foreground mt-0.5"></View>
                <View className="flex-1">
                  <Text className="text-sm text-foreground block mb-1 font-medium">一键登录</Text>
                  <Text className="text-xs text-muted-foreground block">
                    绑定后可使用微信一键登录，无需输入手机号和验证码
                  </Text>
                </View>
              </View>

              <View className="flex items-start gap-3">
                <View className="i-mdi-shield-check text-lg text-muted-foreground mt-0.5"></View>
                <View className="flex-1">
                  <Text className="text-sm text-foreground block mb-1 font-medium">安全可靠</Text>
                  <Text className="text-xs text-muted-foreground block">使用微信官方授权，保护您的账号安全</Text>
                </View>
              </View>

              <View className="flex items-start gap-3">
                <View className="i-mdi-account-sync text-lg text-muted-foreground mt-0.5"></View>
                <View className="flex-1">
                  <Text className="text-sm text-foreground block mb-1 font-medium">数据同步</Text>
                  <Text className="text-xs text-muted-foreground block">绑定后自动同步微信头像和昵称</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="space-y-3">
            {!bound ? (
              <Button
                className="w-full bg-blue-100 text-white rounded-xl text-base break-keep py-4"
                size="default"
                loading={loading}
                disabled={loading}
                onClick={handleBindWechat}>
                {loading ? '绑定中...' : '立即绑定微信'}
              </Button>
            ) : (
              <Button
                className="w-full bg-blue-100 text-white rounded-xl text-base break-keep py-4"
                size="default"
                loading={loading}
                disabled={loading}
                onClick={handleUnbindWechat}>
                {loading ? '解绑中...' : '解绑微信'}
              </Button>
            )}

            <Button
              className="w-full bg-muted text-foreground rounded-xl text-base break-keep py-4"
              size="default"
              onClick={() => navigateBack()}>
              返回
            </Button>
          </View>

          {/* 温馨提示 */}
          <View className="mt-6 bg-blue-100 rounded-xl p-4">
            <View className="flex items-start gap-2">
              <View className="i-mdi-information text-lg text-muted-foreground mt-0.5"></View>
              <View className="flex-1">
                <Text className="text-xs text-blue-600 block mb-1 font-medium">温馨提示</Text>
                <Text className="text-xs text-blue-600 block leading-relaxed">
                  • 一个微信账号只能绑定一个系统账号{'\n'}• 绑定后可随时解绑，但解绑后需重新绑定才能使用微信登录{'\n'}•
                  此功能仅在微信小程序中可用
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default BindWechat
