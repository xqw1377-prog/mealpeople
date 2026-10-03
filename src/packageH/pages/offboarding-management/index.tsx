/**
 * 离职管理中心页面（HR端）
 *
 * 功能：
 * - 离职申请审批
 * - 离职面谈管理
 * - 工作交接管理
 * - 离职手续办理
 * - 离职数据统计
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import {useTenantStore} from '@/store/tenant'

// 离职统计数据类型
interface OffboardingStatistics {
  pending_applications: number
  pending_interviews: number
  pending_handovers: number
  completed_this_month: number
}

export default function OffboardingManagementPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<OffboardingStatistics | null>(null)

  // 加载统计数据
  const loadStatistics = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 检查权限
      const currentEmployee = await getEmployeeByUserId(user?.id)
      if (!currentEmployee) {
        Taro.showToast({title: '无权限访问', icon: 'none'})
        setLoading(false)
        return
      }

      // 获取待审批的离职申请数量
      const {data: pendingApps, error: appsError} = await supabase
        .from('resignation_applications')
        .select('id')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'pending')

      if (appsError) throw appsError

      // 获取待进行的离职面谈数量
      const {data: pendingInterviews, error: interviewsError} = await supabase
        .from('resignation_interviews')
        .select('id')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'pending')

      if (interviewsError) throw interviewsError

      // 获取待完成的工作交接数量
      const {data: pendingHandovers, error: handoversError} = await supabase
        .from('work_handovers')
        .select('id')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'pending')

      if (handoversError) throw handoversError

      // 获取本月完成的离职数量
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const {data: completedThisMonth, error: completedError} = await supabase
        .from('resignation_applications')
        .select('id')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'completed')
        .gte('completed_date', firstDayOfMonth)
        .lte('completed_date', lastDayOfMonth)

      if (completedError) throw completedError

      const stats: OffboardingStatistics = {
        pending_applications: pendingApps?.length || 0,
        pending_interviews: pendingInterviews?.length || 0,
        pending_handovers: pendingHandovers?.length || 0,
        completed_this_month: completedThisMonth?.length || 0
      }

      setStatistics(stats)
    } catch (error) {
      console.error('加载统计数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useDidShow(() => {
    loadStatistics()
  })

  // 返回上一页
  const handleBack = () => {
    Taro.switchTab({url: '/pages/index/index'})
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #fef2f2, #fee2e2)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">离职管理中心</Text>
            <Text className="text-sm opacity-90 block">管理员工离职全流程</Text>
          </View>
          <View className="i-mdi-account-remove text-5xl opacity-20"></View>
        </View>

        {/* 统计卡片 */}
        {statistics && (
          <View className="bg-white bg-opacity-20 rounded-xl p-4">
            <View className="grid grid-cols-4 gap-2">
              <View className="text-center">
                <Text className="text-2xl font-bold block mb-1">{statistics.pending_applications}</Text>
                <Text className="text-xs opacity-90 block">待审批</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold block mb-1">{statistics.pending_interviews}</Text>
                <Text className="text-xs opacity-90 block">待面谈</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold block mb-1">{statistics.pending_handovers}</Text>
                <Text className="text-xs opacity-90 block">待交接</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold block mb-1">{statistics.completed_this_month}</Text>
                <Text className="text-xs opacity-90 block">本月完成</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 快捷功能 */}
          <View className="mb-6">
            <View className="mb-3">
              <Text className="text-base max-sm:text-sm font-bold text-foreground mb-1 block">快捷功能</Text>
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground">点击进入管理</Text>
            </View>
            <View className="grid grid-cols-2 gap-3 max-sm:gap-2">
              {/* 离职申请审批 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/resignation-approval/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2">
                  <View className="i-mdi-file-document-check text-3xl max-sm:text-2xl text-red-600" />
                </View>
                <Text className="text-sm max-sm:text-xs font-bold text-foreground mb-1 block">离职申请</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">审批离职申请</Text>
              </View>

              {/* 离职面谈管理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/exit-interview-management/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2">
                  <View className="i-mdi-account-voice text-3xl max-sm:text-2xl text-orange-600" />
                </View>
                <Text className="text-sm max-sm:text-xs font-bold text-foreground mb-1 block">离职面谈</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理离职面谈</Text>
              </View>

              {/* 工作交接管理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/handover-management/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-yellow-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2">
                  <View className="i-mdi-swap-horizontal text-3xl max-sm:text-2xl text-yellow-600" />
                </View>
                <Text className="text-sm max-sm:text-xs font-bold text-foreground mb-1 block">工作交接</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理工作交接</Text>
              </View>

              {/* 离职手续办理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/exit-procedures/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2">
                  <View className="i-mdi-clipboard-list text-3xl max-sm:text-2xl text-purple-600" />
                </View>
                <Text className="text-sm max-sm:text-xs font-bold text-foreground mb-1 block">离职手续</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">办理离职手续</Text>
              </View>

              {/* 离职数据统计 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/offboarding-statistics/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2">
                  <View className="i-mdi-chart-bar text-3xl max-sm:text-2xl text-blue-600" />
                </View>
                <Text className="text-sm max-sm:text-xs font-bold text-foreground mb-1 block">数据统计</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">查看离职数据</Text>
              </View>

              {/* 离职员工档案 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/offboarding-archive/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2">
                  <View className="i-mdi-archive text-3xl max-sm:text-2xl text-gray-600" />
                </View>
                <Text className="text-sm max-sm:text-xs font-bold text-foreground mb-1 block">员工档案</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">查看离职档案</Text>
              </View>
            </View>
          </View>

          {/* 待办事项提醒 */}
          {statistics &&
            (statistics.pending_applications > 0 ||
              statistics.pending_interviews > 0 ||
              statistics.pending_handovers > 0) && (
              <View className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
                <View className="flex items-center mb-3">
                  <View className="i-mdi-alert-circle text-2xl text-yellow-600 mr-2"></View>
                  <Text className="text-base font-bold text-yellow-800">待办事项提醒</Text>
                </View>
                <View className="space-y-2">
                  {statistics.pending_applications > 0 && (
                    <View className="flex items-center">
                      <View className="i-mdi-circle-small text-xl text-yellow-600 mr-1"></View>
                      <Text className="text-sm text-yellow-800">
                        有 {statistics.pending_applications} 个离职申请待审批
                      </Text>
                    </View>
                  )}
                  {statistics.pending_interviews > 0 && (
                    <View className="flex items-center">
                      <View className="i-mdi-circle-small text-xl text-yellow-600 mr-1"></View>
                      <Text className="text-sm text-yellow-800">
                        有 {statistics.pending_interviews} 个离职面谈待进行
                      </Text>
                    </View>
                  )}
                  {statistics.pending_handovers > 0 && (
                    <View className="flex items-center">
                      <View className="i-mdi-circle-small text-xl text-yellow-600 mr-1"></View>
                      <Text className="text-sm text-yellow-800">
                        有 {statistics.pending_handovers} 个工作交接待完成
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

          {/* 返回按钮 */}
          <View className="mt-6">
            <View
              onClick={handleBack}
              className="bg-white border-2 border-gray-200 rounded-xl py-3 px-6 flex items-center justify-center active:bg-gray-50">
              <View className="i-mdi-home text-xl text-foreground mr-2"></View>
              <Text className="text-foreground font-medium">返回首页</Text>
            </View>
          </View>

          {/* 底部间距 */}
          <View className="h-6"></View>
        </View>
      )}
    </ScrollView>
  )
}
