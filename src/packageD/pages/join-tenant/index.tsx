import {Button, Input, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useState} from 'react'
import {joinTenantWithCode, validateInvitationCode} from '@/db/api'

interface InvitationCodeValidation {
  valid: boolean
  message?: string
  data?: any
}

const JoinTenant: React.FC = () => {
  const {user} = useAuth({guard: true})

  const [code, setCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [validation, setValidation] = useState<InvitationCodeValidation | null>(null)

  // 验证邀请码
  const handleValidate = async () => {
    if (!code.trim()) {
      Taro.showToast({title: '请输入邀请码', icon: 'none'})
      return
    }

    setValidating(true)
    try {
      const result = await validateInvitationCode(code.trim().toUpperCase())
      setValidation(result)

      if (!result.valid) {
        Taro.showToast({title: result.message || '邀请码无效', icon: 'none'})
      }
    } catch (error) {
      console.error('验证邀请码失败:', error)
      Taro.showToast({title: '验证失败', icon: 'none'})
    } finally {
      setValidating(false)
    }
  }

  // 加入租户
  const handleJoin = async () => {
    if (!user?.id) {
      Taro.showToast({title: '请先登录', icon: 'none'})
      return
    }

    if (!validation?.valid) {
      Taro.showToast({title: '请先验证邀请码', icon: 'none'})
      return
    }

    setJoining(true)
    try {
      const result = await joinTenantWithCode(code.trim().toUpperCase(), user.id, user.email || '新员工')

      if (result.success) {
        Taro.showToast({
          title: '加入成功',
          icon: 'success',
          duration: 2000
        })

        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          Taro.reLaunch({url: '/pages/tenant-select/index'})
        }, 2000)
      } else {
        Taro.showToast({title: result.message, icon: 'none'})
      }
    } catch (error) {
      console.error('加入租户失败:', error)
      Taro.showToast({title: '加入失败', icon: 'none'})
    } finally {
      setJoining(false)
    }
  }

  // 获取角色标签
  const getRoleLabel = (role: string | null) => {
    const roleMap: Record<string, string> = {
      employee: '普通员工',
      store_manager: '店经理',
      tenant_admin: '租户管理员'
    }
    return role ? roleMap[role] || role : '未知'
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="p-4 space-y-4">
        {/* 标题 */}
        <View className="text-center pt-8 pb-4">
          <View className="i-mdi-account-multiple-plus text-6xl text-blue-500 mx-auto mb-4"></View>
          <Text className="text-2xl font-bold text-foreground block mb-2">加入团队</Text>
          <Text className="text-sm text-muted-foreground block">输入邀请码加入您的团队</Text>
        </View>

        {/* 输入邀请码 */}
        <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
          <Text className="text-base font-bold text-foreground block mb-3">输入邀请码</Text>

          <View className="space-y-3">
            <Input
              value={code}
              onInput={(e) => {
                setCode(e.detail.value.toUpperCase())
                setValidation(null)
              }}
              placeholder="请输入邀请码"
              maxlength={8}
              className="border-2 border-blue-300 rounded-xl p-4 bg-blue-100 text-center text-2xl font-bold tracking-widest"
            />

            <Button
              onClick={handleValidate}
              loading={validating}
              disabled={!code.trim()}
              className="w-full bg-blue-100 text-white rounded-xl py-3 font-semibold text-base">
              {validating ? '验证中...' : '验证邀请码'}
            </Button>
          </View>
        </View>

        {/* 验证结果 */}
        {validation && (
          <View
            className={`rounded-lg p-6 shadow-sm ${validation.valid ? 'bg-blue-100 border-2 border-green-200' : 'bg-blue-100 border-2 border-red-200'}`}>
            {validation.valid ? (
              <>
                <View className="flex items-center gap-2 mb-4">
                  <View className="i-mdi-check-circle text-3xl text-muted-foreground"></View>
                  <Text className="text-lg font-bold text-green-600">邀请码有效</Text>
                </View>

                <View className="space-y-3 mb-4">
                  <View className="bg-white rounded-xl p-3 border-2 border-gray-200">
                    <Text className="text-xs text-muted-foreground block mb-1">租户名称</Text>
                    <Text className="text-base font-semibold text-foreground">
                      {validation.data?.tenants?.name || '未知'}
                    </Text>
                  </View>

                  <View className="bg-white rounded-xl p-3 border-2 border-gray-200">
                    <Text className="text-xs text-muted-foreground block mb-1">店铺名称</Text>
                    <Text className="text-base font-semibold text-foreground">
                      {validation.data?.store_name || '未知'}
                    </Text>
                  </View>

                  <View className="bg-white rounded-xl p-3 border-2 border-gray-200">
                    <Text className="text-xs text-muted-foreground block mb-1">加入后角色</Text>
                    <Text className="text-base font-semibold text-foreground">
                      {getRoleLabel(validation.data?.role || 'employee')}
                    </Text>
                  </View>
                </View>

                <Button
                  onClick={handleJoin}
                  loading={joining}
                  className="w-full bg-blue-100 text-white rounded-xl py-3 font-semibold text-base">
                  {joining ? '加入中...' : '确认加入'}
                </Button>
              </>
            ) : (
              <>
                <View className="flex items-center gap-2 mb-2">
                  <View className="i-mdi-alert-circle text-3xl text-red-600"></View>
                  <Text className="text-lg font-bold text-red-600">邀请码无效</Text>
                </View>
                <Text className="text-sm text-red-600">{validation.message}</Text>
              </>
            )}
          </View>
        )}

        {/* 使用说明 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <Text className="text-sm font-semibold text-foreground mb-2 block">📋 使用说明</Text>
          <View className="space-y-1">
            <Text className="text-xs text-foreground block">• 向您的管理员获取邀请码</Text>
            <Text className="text-xs text-foreground block">• 输入邀请码并点击验证</Text>
            <Text className="text-xs text-foreground block">• 验证通过后点击确认加入</Text>
            <Text className="text-xs text-foreground block">• 加入成功后即可开始使用系统</Text>
          </View>
        </View>

        {/* 帮助信息 */}
        <View className="text-center">
          <Text className="text-xs text-muted-foreground block">遇到问题？</Text>
          <Text className="text-xs text-muted-foreground block mt-1">联系您的管理员获取帮助</Text>
        </View>
      </View>
    </View>
  )
}

export default JoinTenant
