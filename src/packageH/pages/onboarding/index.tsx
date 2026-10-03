/**
 * 入职管理主页
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getOnboardingProcesses, getOnboardingStats} from '@/db/api-lifecycle'
import type {OnboardingProcess, OnboardingStats} from '@/db/types-lifecycle'
import {useTenantStore} from '@/store/tenant'

export default function Onboarding() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [stats, setStats] = useState<OnboardingStats>({
    pending: 0,
    in_progress: 0,
    completed_this_month: 0
  })
  const [processes, setProcesses] = useState<OnboardingProcess[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user?.id) {
      console.log('入职页面：用户ID不存在')
      return
    }

    console.log('入职页面：开始加载数据，用户ID:', user.id)
    console.log('入职页面：全局租户:', currentTenant)
    setLoading(true)
    try {
      let tenantId: string | null = null

      // 优先使用全局租户状态
      if (currentTenant?.id) {
        tenantId = currentTenant.id
        console.log('入职页面：使用全局租户ID:', tenantId)
      } else {
        // 如果没有全局租户，尝试从员工信息获取
        const {getEmployeeByUserId} = await import('@/db/api')
        console.log('入职页面：开始获取员工信息')
        const employee = await getEmployeeByUserId(user.id)
        console.log('入职页面：员工信息:', employee)

        if (employee?.tenant_id) {
          tenantId = employee.tenant_id
          console.log('入职页面：从员工信息获取租户ID:', tenantId)
        }
      }

      // 如果还是没有租户ID，提示用户选择租户
      if (!tenantId) {
        console.error('入职页面：无法获取租户ID')
        Taro.showModal({
          title: '提示',
          content: '请先选择租户',
          confirmText: '去选择',
          success: (res) => {
            if (res.confirm) {
              Taro.navigateTo({url: '/pages/tenant-select/index'})
            }
          }
        })
        setLoading(false)
        return
      }

      const [statsData, processesData] = await Promise.all([
        getOnboardingStats(tenantId),
        getOnboardingProcesses(tenantId)
      ])

      console.log('入职页面：统计数据:', statsData)
      console.log('入职页面：流程数据:', processesData)

      setStats(statsData)
      setProcesses(processesData.slice(0, 5))
    } catch (error) {
      console.error('入职页面：加载数据失败:', error)
      Taro.showToast({
        title: `加载失败: ${error instanceof Error ? error.message : '未知错误'}`,
        icon: 'none',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }, [user, currentTenant])

  useDidShow(() => {
    loadData()
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, {text: string; color: string}> = {
      pending: {text: '待开始', color: 'text-muted-foreground bg-gray-50'},
      in_progress: {text: '进行中', color: 'text-accent bg-accent/10'},
      completed: {text: '已完成', color: 'text-blue-600 bg-blue-100'}
    }
    return statusMap[status] || {text: '未知', color: 'text-muted-foreground bg-gray-50'}
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          <View className="mb-6">
            <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
              入职管理
            </Text>
            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1 block">
              资料收集、入职培训、试用期管理
            </Text>
          </View>

          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-sm">
            <View className="flex items-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="i-mdi-chart-box text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                入职概览
              </Text>
            </View>

            <View className="grid grid-cols-3 gap-3 max-sm:gap-2 max-sm:gap-1.5">
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">待入职</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600 mt-1">
                  {stats.pending}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">人</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">入职中</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-accent mt-1">
                  {stats.in_progress}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">人</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">本月已入职</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-secondary mt-1">
                  {stats.completed_this_month}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">人</Text>
              </View>
            </View>
          </View>

          {/* 快速操作 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-sm">
            <View className="flex items-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="i-mdi-lightning-bolt text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-accent mr-2" />
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                快速操作
              </Text>
            </View>
            <View className="grid grid-cols-2 gap-3 max-sm:gap-2 max-sm:gap-1.5">
              <View
                className="bg-blue-100 rounded-lg p-4 max-sm:p-3 flex flex-col items-center justify-center"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/onboarding-process/index'})}>
                <View className="i-mdi-clipboard-list text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-blue-600">入职流程</Text>
              </View>
              <View
                className="bg-accent/10 rounded-lg p-4 max-sm:p-3 flex flex-col items-center justify-center"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/onboarding-tasks/index'})}>
                <View className="i-mdi-checkbox-marked-circle text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-accent mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-accent">入职任务</Text>
              </View>
              <View
                className="bg-secondary/10 rounded-lg p-4 max-sm:p-3 flex flex-col items-center justify-center"
                onClick={() =>
                  Taro.showToast({
                    title: '资料收集功能开发中',
                    icon: 'none'
                  })
                }>
                <View className="i-mdi-file-document text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-secondary mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-secondary">资料收集</Text>
              </View>
              <View
                className="bg-blue-100 rounded-lg p-4 max-sm:p-3 flex flex-col items-center justify-center"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/debug-onboarding/index'})}>
                <View className="i-mdi-bug text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-orange-500 mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-orange-500">调试工具</Text>
              </View>
            </View>
          </View>

          {/* 最近入职流程 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-2 max-sm:mb-1.50 shadow-sm">
            <View className="flex items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="flex items-center">
                <View className="i-mdi-account-multiple text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                  最近入职流程
                </Text>
              </View>
              <Text
                className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/onboarding-process/index'})}>
                查看全部
              </Text>
            </View>

            {loading ? (
              <View className="py-8 max-sm:py-6 flex flex-col items-center justify-center">
                <View className="i-mdi-loading animate-spin text-4xl max-sm:text-3xl text-blue-600 mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
              </View>
            ) : processes.length === 0 ? (
              <View className="py-8 max-sm:py-6 flex flex-col items-center justify-center">
                <View className="i-mdi-inbox text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">暂无入职流程</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                  点击上方"入职流程"开始创建
                </Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {processes.map((process) => {
                  const badge = getStatusBadge(process.status)
                  return (
                    <View
                      key={process.id}
                      className="bg-gray-50 rounded-lg p-3"
                      onClick={() =>
                        Taro.navigateTo({
                          url: `/pages/onboarding-detail/index?id=${process.id}`
                        })
                      }>
                      <View className="flex items-center justify-between mb-2 max-sm:mb-1.5">
                        <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                          员工ID: {process.employee_id || process.candidate_id || '未知'}
                        </Text>
                        <View className={`px-2 py-1 rounded ${badge.color}`}>
                          <Text className="text-xs max-sm:text-[10px]">{badge.text}</Text>
                        </View>
                      </View>
                      <View className="flex items-center text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                        <View className="i-mdi-briefcase text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] mr-1" />
                        <Text className="text-xs max-sm:text-[10px]">入职流程</Text>
                      </View>
                      <View className="flex items-center text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                        <View className="i-mdi-calendar text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] mr-1" />
                        <Text className="text-xs max-sm:text-[10px]">入职日期：{process.start_date || '未设置'}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
