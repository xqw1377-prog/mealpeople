/**
 * 营收预测页面 - 周日历视图
 * 基于历史数据和影响因子生成月度营收预测
 * 采用周日历形式展示，方便周与周之间的数据对比
 */

import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getMonthlyRevenueWithDetails, getRevenueImpactFactors} from '@/db/api-revenue-calendar'
import type {DailyRevenueDetail, RevenueCalendar, RevenueImpactFactor} from '@/db/types-v2'
import {useTenantStore} from '@/store/tenant'

// 周数据类型
interface WeekData {
  weekNumber: number // 第几周
  days: (DailyRevenueDetail | null)[] // 7天数据，null表示不属于当月
  weekTotal: number // 本周总营收
  weekAvg: number // 本周日均营收
}

const RevenuePrediction: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7))
  const [calendar, setCalendar] = useState<RevenueCalendar | null>(null)
  const [dailyDetails, setDailyDetails] = useState<DailyRevenueDetail[]>([])
  const [factors, setFactors] = useState<RevenueImpactFactor[]>([])

  // 生成月份选项（当前月份及未来6个月）
  const generateMonthOptions = () => {
    const options: {label: string; value: string}[] = []
    const now = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const yearMonth = date.toISOString().substring(0, 7)
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
      options.push({label, value: yearMonth})
    }
    return options
  }

  const monthOptions = generateMonthOptions()

  // 加载营收数据和影响因子
  const loadData = useCallback(async () => {
    if (!currentTenant || !currentStore) return

    setLoading(true)
    try {
      // 加载月度营收数据和日度明细
      const {calendar: cal, details} = await getMonthlyRevenueWithDetails(
        currentTenant.id,
        currentStore.id,
        selectedMonth
      )
      setCalendar(cal)
      setDailyDetails(details)

      // 加载影响因子
      const factorData = await getRevenueImpactFactors(currentTenant.id, currentStore.id)
      setFactors(factorData.filter((f) => f.is_active))
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant, currentStore, selectedMonth])

  useDidShow(() => {
    loadData()
  })

  // 执行生成预测
  const generatePrediction = useCallback(async () => {
    if (!currentTenant || !currentStore || !user) return

    Taro.showLoading({
      title: '生成中...',
      mask: true
    })

    try {
      const {revenueForecastService} = await import('@/services/revenue-forecast')
      const result = await revenueForecastService.generateMonthlyCalendar({
        tenantId: currentTenant.id,
        storeId: currentStore.id,
        targetMonth: selectedMonth,
        userId: user.id,
        useHistoricalData: true
      })

      Taro.hideLoading()

      if (result.success) {
        Taro.showToast({
          title: '生成成功',
          icon: 'success',
          duration: 2000
        })
        // 重新加载数据
        await loadData()
      } else {
        Taro.showToast({
          title: result.message || '生成失败',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('生成预测失败:', error)
      Taro.showToast({
        title: '生成失败',
        icon: 'error',
        duration: 2000
      })
    }
  }, [currentTenant, currentStore, user, selectedMonth, loadData])

  // 生成预测
  const handleGeneratePrediction = useCallback(async () => {
    if (!currentTenant || !currentStore || !user) return

    // 检查是否已存在该月份的营收日历
    if (calendar) {
      Taro.showModal({
        title: '提示',
        content: '该月份已存在营收预测，是否重新生成？',
        success: async (res) => {
          if (res.confirm) {
            await generatePrediction()
          }
        }
      })
    } else {
      await generatePrediction()
    }
  }, [currentTenant, currentStore, user, calendar, generatePrediction])

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  // 格式化日均营收（不保留小数）
  const formatAvgAmount = (amount: number) => {
    return `¥${Math.round(amount).toLocaleString()}`
  }

  // 获取星期几
  const getWeekday = (dateStr: string) => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const date = new Date(dateStr)
    return weekdays[date.getDay()]
  }

  // 计算月度统计
  const calculateMonthlyStats = () => {
    if (!calendar) {
      return {
        totalRevenue: 0,
        avgRevenue: 0,
        totalDays: 0,
        status: 'draft' as const
      }
    }

    const avgRevenue = dailyDetails.length > 0 ? calendar.predicted_total_revenue / dailyDetails.length : 0

    return {
      totalRevenue: calendar.predicted_total_revenue,
      avgRevenue,
      totalDays: dailyDetails.length,
      status: calendar.status
    }
  }

  const stats = calculateMonthlyStats()

  if (!currentTenant || !currentStore) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center mx-4">
          <View className="i-mdi-alert-circle-outline text-6xl text-blue-500 mx-auto mb-4" />
          <Text className="text-base text-foreground block mb-2">请先选择租户和门店</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          {/* 头部卡片 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-3">
              <View>
                <Text className="text-base font-bold text-foreground block">营收预测</Text>
                <Text className="text-xs text-muted-foreground block mt-1">基于历史数据和影响因子的智能预测</Text>
              </View>
            </View>

            {/* 月份选择 */}
            <View className="mb-3">
              <Text className="text-xs text-muted-foreground block mb-2">选择月份</Text>
              <Picker
                mode="selector"
                range={monthOptions}
                rangeKey="label"
                value={monthOptions.findIndex((m) => m.value === selectedMonth)}
                onChange={(e) => {
                  const index = e.detail.value
                  setSelectedMonth(monthOptions[index].value)
                }}>
                <View className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <Text className="text-sm text-foreground">
                    {monthOptions.find((m) => m.value === selectedMonth)?.label}
                  </Text>
                  <View className="i-mdi-chevron-down text-base text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 操作按钮 */}
            <View className="flex gap-2">
              <Button
                className="flex-1 bg-blue-100 text-white py-3 rounded-lg text-sm break-keep"
                size="default"
                onClick={handleGeneratePrediction}>
                生成智能预测
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 rounded-lg text-sm break-keep"
                size="default"
                onClick={() => {
                  Taro.navigateTo({
                    url: '/packageB/pages/revenue-weekly-calendar/index'
                  })
                }}>
                周日历视图
              </Button>
            </View>
          </View>

          {/* 月度统计卡片 */}
          {calendar && (
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <Text className="text-sm font-bold text-foreground block mb-3">月度统计</Text>
              <View className="grid grid-cols-2 gap-3">
                <View className="bg-blue-100 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground block mb-1">预测总营收</Text>
                  <Text className="text-lg font-bold text-blue-600 block">{formatAmount(stats.totalRevenue)}</Text>
                </View>
                <View className="bg-blue-100 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground block mb-1">日均营收</Text>
                  <Text className="text-lg font-bold text-green-600 block">{formatAvgAmount(stats.avgRevenue)}</Text>
                </View>
                <View className="bg-blue-100 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground block mb-1">天数</Text>
                  <Text className="text-lg font-bold text-purple-700 block">{stats.totalDays}天</Text>
                </View>
                <View className="bg-blue-100 rounded-lg p-3">
                  <Text className="text-xs text-muted-foreground block mb-1">状态</Text>
                  <Text className="text-lg font-bold text-orange-600 block">
                    {stats.status === 'draft' ? '草稿' : stats.status === 'confirmed' ? '已确认' : '已锁定'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 影响因子卡片 */}
          {factors.length > 0 && (
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <Text className="text-sm font-bold text-foreground block mb-3">已启用影响因子 ({factors.length})</Text>
              <View className="space-y-2">
                {factors.map((factor) => (
                  <View key={factor.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <View className="flex-1">
                      <Text className="text-sm text-foreground block">{factor.factor_name}</Text>
                      {factor.factor_value && (
                        <Text className="text-xs text-muted-foreground block">{factor.factor_value}</Text>
                      )}
                    </View>
                    <Text
                      className={`text-sm font-semibold ${factor.impact_rate > 0 ? 'text-muted-foreground' : 'text-red-600'}`}>
                      {factor.impact_rate > 0 ? '+' : ''}
                      {(factor.impact_rate * 100).toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 日度营收列表 */}
          {loading ? (
            <View className="flex items-center justify-center py-20">
              <View className="i-mdi-loading text-4xl text-blue-500 animate-spin" />
              <Text className="text-sm text-muted-foreground mt-4">加载中...</Text>
            </View>
          ) : dailyDetails.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-calendar-blank text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无营收数据</Text>
              <Text className="text-sm text-muted-foreground block">点击"生成智能预测"创建营收预测</Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <Text className="text-sm font-bold text-foreground block mb-3">日度营收明细</Text>
              <View className="space-y-2">
                {dailyDetails.map((item) => (
                  <View
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    onClick={() => {
                      // 跳转到详情页面
                      Taro.navigateTo({
                        url: `/packageB/pages/revenue-detail/index?id=${item.id}&calendarId=${calendar?.id}`
                      })
                    }}>
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-1">
                        <Text className="text-sm font-semibold text-foreground">{formatDate(item.revenue_date)}</Text>
                        <Text className="text-xs text-muted-foreground">周{getWeekday(item.revenue_date)}</Text>
                        {item.is_weekend && (
                          <View className="px-2 py-0.5 rounded text-xs bg-blue-100 text-muted-foreground">
                            <Text className="text-xs">周末</Text>
                          </View>
                        )}
                        {item.is_holiday && (
                          <View className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600">
                            <Text className="text-xs">节假日</Text>
                          </View>
                        )}
                      </View>
                      {/* 餐段营收分布 */}
                      <View className="flex items-center gap-2 mt-1">
                        <Text className="text-xs text-muted-foreground">
                          早:{formatAmount(item.breakfast_revenue || 0)}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          午:{formatAmount(item.lunch_revenue || 0)}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          晚:{formatAmount(item.dinner_revenue || 0)}
                        </Text>
                      </View>
                      {(item.weather_factor || item.event_factor) && (
                        <Text className="text-xs text-muted-foreground block mt-1">
                          {[item.weather_factor, item.event_factor].filter(Boolean).join(' · ')}
                        </Text>
                      )}
                    </View>
                    <View className="text-right flex items-center gap-2">
                      <View>
                        <Text className="text-base font-bold text-muted-foreground block">
                          {formatAmount(item.adjusted_revenue || item.predicted_revenue)}
                        </Text>
                        {item.adjusted_revenue && item.adjusted_revenue !== item.predicted_revenue && (
                          <Text className="text-xs text-muted-foreground block line-through">
                            {formatAmount(item.predicted_revenue)}
                          </Text>
                        )}
                      </View>
                      <View className="i-mdi-chevron-right text-lg text-muted-foreground" />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default RevenuePrediction
