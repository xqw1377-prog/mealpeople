/**
 * 入职数据统计页面（增强版）
 *
 * 功能：
 * - 入职完成率统计
 * - 候选人状态分布
 * - 入职流程进度
 * - 数据趋势分析
 * - 时间范围筛选
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api'

// 时间范围类型
type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'all'

// 统计数据类型
interface OnboardingStatistics {
  totalCandidates: number
  newCandidates: number
  interviewScheduled: number
  offerSent: number
  onboarding: number
  completed: number
  rejected: number
}

export default function OnboardingStatistics() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [statistics, setStatistics] = useState<OnboardingStatistics>({
    totalCandidates: 0,
    newCandidates: 0,
    interviewScheduled: 0,
    offerSent: 0,
    onboarding: 0,
    completed: 0,
    rejected: 0
  })

  // 加载统计数据
  const loadStatistics = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) return

      // 计算时间范围
      const now = new Date()
      let startDate = new Date()

      switch (timeRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3)
          break
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1)
          break
        case 'all':
          startDate = new Date('2000-01-01')
          break
      }

      // 查询候选人数据
      const {data: candidates} = await supabase
        .from('candidates')
        .select('*')
        .eq('tenant_id', employee.tenant_id)
        .gte('created_at', startDate.toISOString())

      if (candidates) {
        const stats: OnboardingStatistics = {
          totalCandidates: candidates.length,
          newCandidates: candidates.filter((c) => c.status === 'new').length,
          interviewScheduled: candidates.filter((c) => c.status === 'interview_scheduled').length,
          offerSent: candidates.filter((c) => c.status === 'offer_sent').length,
          onboarding: candidates.filter((c) => c.status === 'onboarding').length,
          completed: candidates.filter((c) => c.status === 'hired').length,
          rejected: candidates.filter((c) => c.status === 'rejected').length
        }
        setStatistics(stats)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, timeRange])

  useEffect(() => {
    loadStatistics()
  }, [loadStatistics])

  // 计算完成率
  const completionRate = useMemo(() => {
    if (statistics.totalCandidates === 0) return 0
    return Math.round((statistics.completed / statistics.totalCandidates) * 100)
  }, [statistics])

  // 计算拒绝率
  const rejectionRate = useMemo(() => {
    if (statistics.totalCandidates === 0) return 0
    return Math.round((statistics.rejected / statistics.totalCandidates) * 100)
  }, [statistics])

  // 时间范围选项
  const timeRangeOptions = [
    {label: '本周', value: 'week'},
    {label: '本月', value: 'month'},
    {label: '本季度', value: 'quarter'},
    {label: '本年', value: 'year'},
    {label: '全部', value: 'all'}
  ]

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <View className="text-center">
          <View className="i-mdi-loading animate-spin text-4xl text-primary mb-2" />
          <Text className="text-sm text-muted-foreground">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh'}}>
        <View className="p-4 max-sm:p-3">
          {/* 页面标题 */}
          <View className="bg-white rounded-2xl p-6 max-sm:p-4 shadow-lg mb-4">
            <View className="flex flex-row items-center mb-4">
              <View className="w-14 h-14 max-sm:w-12 max-sm:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4 shadow-md">
                <View className="i-mdi-chart-bar text-3xl max-sm:text-2xl text-white" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl max-sm:text-xl font-bold text-gray-900 mb-1">入职数据统计</Text>
                <Text className="text-sm max-sm:text-xs text-gray-600">全面了解入职情况和趋势</Text>
              </View>
            </View>

            {/* 时间范围选择 */}
            <View className="flex flex-row items-center gap-2 overflow-x-auto">
              {timeRangeOptions.map((option) => (
                <View
                  key={option.value}
                  className={`px-4 py-2 rounded-xl transition-all active:scale-95 whitespace-nowrap ${
                    timeRange === option.value
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => setTimeRange(option.value as TimeRange)}>
                  <Text
                    className={`text-sm font-medium ${timeRange === option.value ? 'text-white' : 'text-gray-700'}`}>
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 核心指标卡片 */}
          <View className="grid grid-cols-2 gap-3 max-sm:gap-2 mb-4">
            {/* 总候选人数 */}
            <View className="bg-white rounded-2xl p-4 max-sm:p-3 shadow-lg">
              <View className="flex flex-row items-center justify-between mb-3">
                <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <View className="i-mdi-account-multiple text-2xl text-blue-600" />
                </View>
                <View className="px-2 py-1 bg-blue-50 rounded-lg">
                  <Text className="text-xs text-blue-600 font-medium">总数</Text>
                </View>
              </View>
              <Text className="text-3xl max-sm:text-2xl font-bold text-gray-900 mb-1">
                {statistics.totalCandidates}
              </Text>
              <Text className="text-xs text-gray-600">候选人总数</Text>
            </View>

            {/* 新增候选人 */}
            <View className="bg-white rounded-2xl p-4 max-sm:p-3 shadow-lg">
              <View className="flex flex-row items-center justify-between mb-3">
                <View className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <View className="i-mdi-account-plus text-2xl text-green-600" />
                </View>
                <View className="px-2 py-1 bg-green-50 rounded-lg">
                  <Text className="text-xs text-green-600 font-medium">新增</Text>
                </View>
              </View>
              <Text className="text-3xl max-sm:text-2xl font-bold text-gray-900 mb-1">{statistics.newCandidates}</Text>
              <Text className="text-xs text-gray-600">新增候选人</Text>
            </View>

            {/* 已完成 */}
            <View className="bg-white rounded-2xl p-4 max-sm:p-3 shadow-lg">
              <View className="flex flex-row items-center justify-between mb-3">
                <View className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <View className="i-mdi-check-circle text-2xl text-purple-600" />
                </View>
                <View className="px-2 py-1 bg-purple-50 rounded-lg">
                  <Text className="text-xs text-purple-600 font-medium">{completionRate}%</Text>
                </View>
              </View>
              <Text className="text-3xl max-sm:text-2xl font-bold text-gray-900 mb-1">{statistics.completed}</Text>
              <Text className="text-xs text-gray-600">成功入职</Text>
            </View>

            {/* 已拒绝 */}
            <View className="bg-white rounded-2xl p-4 max-sm:p-3 shadow-lg">
              <View className="flex flex-row items-center justify-between mb-3">
                <View className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <View className="i-mdi-close-circle text-2xl text-red-600" />
                </View>
                <View className="px-2 py-1 bg-red-50 rounded-lg">
                  <Text className="text-xs text-red-600 font-medium">{rejectionRate}%</Text>
                </View>
              </View>
              <Text className="text-3xl max-sm:text-2xl font-bold text-gray-900 mb-1">{statistics.rejected}</Text>
              <Text className="text-xs text-gray-600">已拒绝</Text>
            </View>
          </View>

          {/* 流程状态分布 */}
          <View className="bg-white rounded-2xl p-6 max-sm:p-4 shadow-lg mb-4">
            <View className="flex flex-row items-center mb-4">
              <View className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-chart-pie text-2xl text-indigo-600" />
              </View>
              <Text className="text-lg max-sm:text-base font-bold text-gray-900">流程状态分布</Text>
            </View>

            <View className="space-y-3">
              {/* 面试安排 */}
              <View>
                <View className="flex flex-row items-center justify-between mb-2">
                  <View className="flex flex-row items-center">
                    <View className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
                    <Text className="text-sm text-gray-700">面试安排</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">{statistics.interviewScheduled}</Text>
                </View>
                <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{
                      width:
                        statistics.totalCandidates > 0
                          ? `${(statistics.interviewScheduled / statistics.totalCandidates) * 100}%`
                          : '0%'
                    }}
                  />
                </View>
              </View>

              {/* Offer发送 */}
              <View>
                <View className="flex flex-row items-center justify-between mb-2">
                  <View className="flex flex-row items-center">
                    <View className="w-3 h-3 bg-amber-500 rounded-full mr-2" />
                    <Text className="text-sm text-gray-700">Offer发送</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">{statistics.offerSent}</Text>
                </View>
                <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{
                      width:
                        statistics.totalCandidates > 0
                          ? `${(statistics.offerSent / statistics.totalCandidates) * 100}%`
                          : '0%'
                    }}
                  />
                </View>
              </View>

              {/* 入职办理 */}
              <View>
                <View className="flex flex-row items-center justify-between mb-2">
                  <View className="flex flex-row items-center">
                    <View className="w-3 h-3 bg-cyan-500 rounded-full mr-2" />
                    <Text className="text-sm text-gray-700">入职办理</Text>
                  </View>
                  <Text className="text-sm font-bold text-gray-900">{statistics.onboarding}</Text>
                </View>
                <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-cyan-500 rounded-full transition-all"
                    style={{
                      width:
                        statistics.totalCandidates > 0
                          ? `${(statistics.onboarding / statistics.totalCandidates) * 100}%`
                          : '0%'
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 完成率分析 */}
          <View className="bg-white rounded-2xl p-6 max-sm:p-4 shadow-lg mb-4">
            <View className="flex flex-row items-center mb-4">
              <View className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-chart-line text-2xl text-green-600" />
              </View>
              <Text className="text-lg max-sm:text-base font-bold text-gray-900">完成率分析</Text>
            </View>

            <View className="flex flex-row items-center justify-center mb-4">
              <View className="relative w-32 h-32">
                {/* 圆形进度条背景 */}
                <View className="absolute inset-0 rounded-full border-8 border-gray-100" />
                {/* 圆形进度条 */}
                <View
                  className="absolute inset-0 rounded-full border-8 border-green-500"
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((completionRate / 100) * 2 * Math.PI)}% ${
                      50 - 50 * Math.cos((completionRate / 100) * 2 * Math.PI)
                    }%)`
                  }}
                />
                {/* 中心文字 */}
                <View className="absolute inset-0 flex items-center justify-center">
                  <View className="text-center">
                    <Text className="text-3xl font-bold text-gray-900">{completionRate}%</Text>
                    <Text className="text-xs text-gray-600">完成率</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View className="bg-green-50 rounded-xl p-3">
                <Text className="text-sm text-gray-700 mb-1">成功入职</Text>
                <Text className="text-2xl font-bold text-green-600">{statistics.completed}</Text>
              </View>
              <View className="bg-red-50 rounded-xl p-3">
                <Text className="text-sm text-gray-700 mb-1">已拒绝</Text>
                <Text className="text-2xl font-bold text-red-600">{statistics.rejected}</Text>
              </View>
            </View>
          </View>

          {/* 数据洞察 */}
          <View className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 max-sm:p-4 shadow-lg">
            <View className="flex flex-row items-center mb-3">
              <View className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-lightbulb-on text-2xl text-white" />
              </View>
              <Text className="text-lg max-sm:text-base font-bold text-white">数据洞察</Text>
            </View>

            <View className="space-y-2">
              {completionRate >= 80 && (
                <View className="flex flex-row items-start">
                  <View className="i-mdi-check-circle text-lg text-white mr-2 mt-0.5" />
                  <Text className="text-sm text-white flex-1">入职完成率表现优秀，继续保持！</Text>
                </View>
              )}
              {completionRate < 50 && (
                <View className="flex flex-row items-start">
                  <View className="i-mdi-alert-circle text-lg text-white mr-2 mt-0.5" />
                  <Text className="text-sm text-white flex-1">入职完成率偏低，建议优化招聘流程</Text>
                </View>
              )}
              {statistics.interviewScheduled > statistics.offerSent * 2 && (
                <View className="flex flex-row items-start">
                  <View className="i-mdi-information text-lg text-white mr-2 mt-0.5" />
                  <Text className="text-sm text-white flex-1">面试转化率较低，建议提升面试质量</Text>
                </View>
              )}
              {statistics.newCandidates > 0 && (
                <View className="flex flex-row items-start">
                  <View className="i-mdi-trending-up text-lg text-white mr-2 mt-0.5" />
                  <Text className="text-sm text-white flex-1">
                    本期新增 {statistics.newCandidates} 位候选人，招聘活跃
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
