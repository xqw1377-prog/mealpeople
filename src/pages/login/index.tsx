/**
 * 登录页面 - 完整版
 * 支持短信验证码登录和微信一键登录
 * 使用 miaoda-auth-taro 提供的 LoginPanel 组件
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {switchTab, useDidShow} from '@tarojs/taro'
import {LoginPanel} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getDemoTenant, getTenantById} from '@/db/api'
import {useTenantStore} from '@/store/tenant'

const Login: React.FC = () => {
  // 使用 selector 方式获取 store 方法，避免 React 上下文问题
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant)
  const setCurrentUser = useTenantStore((state) => state.setCurrentUser)
  const setCurrentStore = useTenantStore((state) => state.setCurrentStore)

  // 协议勾选状态
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // 页面显示时输出调试信息
  useDidShow(() => {
    console.log('========== 登录页面调试信息 ==========')
    console.log('🌐 环境信息:', {
      platform: Taro.getEnv(),
      supabaseUrl: process.env.TARO_APP_SUPABASE_URL,
      hasSupabaseKey: !!process.env.TARO_APP_SUPABASE_ANON_KEY,
      appId: process.env.TARO_APP_APP_ID
    })
    console.log('=====================================')
  })

  // 处理登录成功后的逻辑
  const handleLoginSuccess = useCallback(
    async (user: any) => {
      // 检查是否同意协议
      if (!agreedToTerms) {
        Taro.showModal({
          title: '提示',
          content: '请先阅读并同意《用户服务协议》和《隐私政策》',
          showCancel: false
        })
        return
      }

      try {
        console.log('✅ 登录成功，用户信息:', user)

        // 获取用户ID
        const userId = user.id

        // 获取用户profile
        const {data: profile, error: profileError} = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()

        if (profileError) {
          console.error('❌ 获取用户信息失败:', profileError)
          throw new Error('获取用户信息失败')
        }

        if (!profile) {
          console.error('❌ 用户信息不存在')
          throw new Error('用户信息不存在')
        }

        console.log('✅ 用户信息:', profile)

        // 检查用户是否有租户授权
        const hasAuthorization = profile.tenant_id && profile.role !== 'guest'

        if (!hasAuthorization) {
          // 未授权用户，进入体验模式
          console.log('🎭 用户未授权，进入体验模式')

          // 获取演示租户
          const demoTenant = await getDemoTenant()
          if (!demoTenant) {
            Taro.showModal({
              title: '系统错误',
              content: '无法获取演示租户信息',
              showCancel: false
            })
            return
          }

          // 获取演示租户的第一个门店
          const {data: stores} = await supabase
            .from('stores')
            .select('*')
            .eq('tenant_id', demoTenant.id)
            .eq('status', 'active')
            .limit(1)

          const demoStore = stores && stores.length > 0 ? stores[0] : null

          // 设置租户上下文
          setCurrentTenant(demoTenant)
          setCurrentUser({...profile, role: 'guest'})
          if (demoStore) {
            setCurrentStore(demoStore)
          }

          console.log('✅ 体验模式设置完成', {
            租户: demoTenant.name,
            门店: demoStore?.name || '无',
            用户角色: 'guest'
          })

          // 显示体验模式提示
          Taro.showToast({
            title: '欢迎体验系统',
            icon: 'success',
            duration: 2000
          })

          // 跳转到员工工作台
          setTimeout(() => {
            console.log('🚀 准备跳转到员工工作台')
            switchTab({url: '/packageA/pages/employee-workspace/index'})
          }, 1000)
        } else {
          // 已授权用户，正常登录
          console.log('✅ 用户已授权，正常登录')

          // 获取租户信息
          const tenant = await getTenantById(profile.tenant_id)
          if (!tenant) {
            Taro.showModal({
              title: '登录失败',
              content: '无法获取租户信息',
              showCancel: false
            })
            return
          }

          // 获取租户的第一个门店
          const {data: stores} = await supabase
            .from('stores')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('status', 'active')
            .limit(1)

          const store = stores && stores.length > 0 ? stores[0] : null

          // 设置租户上下文
          setCurrentTenant(tenant)
          setCurrentUser(profile)
          if (store) {
            setCurrentStore(store)
          }

          console.log('✅ 授权模式设置完成', {
            租户: tenant.name,
            门店: store?.name || '无',
            用户角色: profile.role
          })

          // 显示登录成功提示
          Taro.showToast({
            title: '登录成功',
            icon: 'success'
          })

          // 跳转到员工工作台
          setTimeout(() => {
            console.log('🚀 准备跳转到员工工作台')
            switchTab({url: '/packageA/pages/employee-workspace/index'})
          }, 1000)
        }
      } catch (error) {
        console.error('❌ 登录后处理失败:', error)
        Taro.showModal({
          title: '登录失败',
          content: error instanceof Error ? error.message : '未知错误',
          showCancel: false
        })
      }
    },
    [setCurrentTenant, setCurrentUser, setCurrentStore, agreedToTerms]
  )

  // 跳转到用户服务协议
  const handleViewUserAgreement = () => {
    Taro.navigateTo({url: '/pages/user-agreement/index'})
  }

  // 跳转到隐私政策
  const handleViewPrivacyPolicy = () => {
    Taro.navigateTo({url: '/pages/privacy-policy/index'})
  }

  return (
    <ScrollView
      scrollY
      className="h-screen"
      style={{background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)'}}>
      <View className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
        {/* Logo 和标题 */}
        <View className="mb-8 text-center">
          <View className="mb-4 flex justify-center">
            <View className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <View className="i-mdi-briefcase-clock text-5xl text-blue-600" />
            </View>
          </View>
          <Text className="text-3xl font-bold text-white mb-2 block">工作旅途</Text>
          <Text className="text-sm text-white/90 block mb-1">每一刻工作，都值得更好体验</Text>
          <Text className="text-xs text-white/70 block">餐饮员工工作旅途操作系统</Text>
        </View>

        {/* 登录面板 - 使用 miaoda-auth-taro 提供的 LoginPanel */}
        <View className="w-full max-w-md px-4">
          <LoginPanel onLoginSuccess={handleLoginSuccess} />

          {/* 协议勾选 */}
          <View className="mt-4 flex items-start">
            <View
              className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-2 mt-0.5 ${
                agreedToTerms ? 'bg-white border-white' : 'bg-transparent border-white/50'
              }`}
              onClick={() => setAgreedToTerms(!agreedToTerms)}>
              {agreedToTerms && <View className="i-mdi-check text-base text-blue-600" />}
            </View>
            <View className="flex-1">
              <Text className="text-xs text-white/90 leading-relaxed">
                我已阅读并同意
                <Text className="text-white font-semibold underline" onClick={handleViewUserAgreement}>
                  《用户服务协议》
                </Text>
                和
                <Text className="text-white font-semibold underline" onClick={handleViewPrivacyPolicy}>
                  《隐私政策》
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* 提示信息 */}
        <View className="mt-6 px-4 max-w-md w-full">
          <View className="bg-white backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <View className="flex items-start mb-3">
              <View className="i-mdi-information text-xl text-white mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-white block mb-2">登录说明</Text>
                <Text className="text-xs text-white/90 leading-relaxed block mb-2">
                  📱 支持短信验证码登录，安全可靠
                </Text>
                <Text className="text-xs text-white/90 leading-relaxed block mb-2">💬 支持微信一键登录，快速便捷</Text>
                <Text className="text-xs text-white/90 leading-relaxed block mb-2">🎭 首次登录自动创建账号</Text>
                <Text className="text-xs text-white/90 leading-relaxed block mb-2">
                  👑 第一个注册的用户自动成为超级管理员
                </Text>
                <Text className="text-xs text-white/90 leading-relaxed block">
                  👥 后续用户默认为普通员工，可由管理员授权
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 功能特点 */}
        <View className="mt-6 px-4 max-w-md w-full">
          <View className="bg-white backdrop-blur-sm p-4 rounded-lg border border-white/20">
            <Text className="text-sm font-semibold text-white block mb-3">核心功能</Text>
            <View className="space-y-2">
              <View className="flex items-center mb-2">
                <View className="i-mdi-chart-line text-base text-white mr-2" />
                <Text className="text-xs text-white/90">智能营收预测</Text>
              </View>
              <View className="flex items-center mb-2">
                <View className="i-mdi-calendar-check text-base text-white mr-2" />
                <Text className="text-xs text-white/90">科学排班管理</Text>
              </View>
              <View className="flex items-center mb-2">
                <View className="i-mdi-cash-multiple text-base text-white mr-2" />
                <Text className="text-xs text-white/90">精准成本控制</Text>
              </View>
              <View className="flex items-center">
                <View className="i-mdi-chart-box text-base text-white mr-2" />
                <Text className="text-xs text-white/90">全面数据分析</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 底部版权 */}
        <View className="mt-8">
          <Text className="text-xs text-white/60">© 2026 餐饮员工工作旅途操作系统</Text>
        </View>
      </View>
    </ScrollView>
  )
}

export default Login
