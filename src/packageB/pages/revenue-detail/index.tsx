/**
 * 营收详情编辑页面
 * 查看和编辑单日营收明细，包括餐段分配和影响因子
 */

import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  createRevenueAdjustmentLog,
  getDailyRevenueDetails,
  getRevenueCalendarById,
  getRevenueImpactFactors,
  updateDailyRevenueDetail,
  updateRevenueCalendar
} from '@/db/api-revenue-calendar'
import type {DailyRevenueDetail, RevenueCalendar, RevenueImpactFactor} from '@/db/types-v2'
import {useTenantStore} from '@/store/tenant'

const RevenueDetail: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<DailyRevenueDetail | null>(null)
  const [calendar, setCalendar] = useState<RevenueCalendar | null>(null)
  const [_factors, setFactors] = useState<RevenueImpactFactor[]>([])

  // 编辑状态
  const [adjustedRevenue, setAdjustedRevenue] = useState<string>('')
  const [breakfastRevenue, setBreakfastRevenue] = useState<string>('')
  const [lunchRevenue, setLunchRevenue] = useState<string>('')
  const [dinnerRevenue, setDinnerRevenue] = useState<string>('')
  const [otherRevenue, setOtherRevenue] = useState<string>('')
  const [weatherFactor, setWeatherFactor] = useState<string>('')
  const [eventFactor, setEventFactor] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  // 天气因子选项
  const weatherOptions = ['晴天', '多云', '阴天', '小雨', '大雨', '雪天']
  // 事件因子选项
  const eventOptions = ['无', '促销活动', '新品推广', '会员日', '周边活动', '竞争对手活动', '其他']

  // 加载数据
  const loadData = useCallback(async () => {
    const {id, calendarId} = router.params
    if (!id || !calendarId || !currentTenant || !currentStore) return

    setLoading(true)
    try {
      // 加载营收日历
      const cal = await getRevenueCalendarById(calendarId)
      setCalendar(cal)

      // 加载每日明细
      const details = await getDailyRevenueDetails(calendarId)
      const currentDetail = details.find((d) => d.id === id)
      if (currentDetail) {
        setDetail(currentDetail)
        // 初始化编辑状态
        setAdjustedRevenue(String(currentDetail.adjusted_revenue || currentDetail.predicted_revenue))
        setBreakfastRevenue(String(currentDetail.breakfast_revenue || 0))
        setLunchRevenue(String(currentDetail.lunch_revenue || 0))
        setDinnerRevenue(String(currentDetail.dinner_revenue || 0))
        setOtherRevenue(String(currentDetail.other_revenue || 0))
        setWeatherFactor(currentDetail.weather_factor || '')
        setEventFactor(currentDetail.event_factor || '')
        setNotes(currentDetail.notes || '')
      }

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
  }, [router.params, currentTenant, currentStore])

  useDidShow(() => {
    loadData()
  })

  // 自动分配餐段营收
  const handleAutoDistribute = useCallback(() => {
    const total = Number.parseFloat(adjustedRevenue) || 0
    if (total <= 0) {
      Taro.showToast({
        title: '请先输入总营收',
        icon: 'none'
      })
      return
    }

    // 默认比例：早餐15%，午餐40%，晚餐40%，其他5%
    const breakfast = Math.round(total * 0.15)
    const lunch = Math.round(total * 0.4)
    const dinner = Math.round(total * 0.4)
    const other = total - breakfast - lunch - dinner

    setBreakfastRevenue(String(breakfast))
    setLunchRevenue(String(lunch))
    setDinnerRevenue(String(dinner))
    setOtherRevenue(String(other))

    Taro.showToast({
      title: '已自动分配',
      icon: 'success'
    })
  }, [adjustedRevenue])

  // 保存修改
  const handleSave = useCallback(async () => {
    if (!detail || !calendar || !user) return

    // 验证数据
    const totalRevenue = Number.parseFloat(adjustedRevenue) || 0
    const breakfast = Number.parseFloat(breakfastRevenue) || 0
    const lunch = Number.parseFloat(lunchRevenue) || 0
    const dinner = Number.parseFloat(dinnerRevenue) || 0
    const other = Number.parseFloat(otherRevenue) || 0
    const mealTotal = breakfast + lunch + dinner + other

    if (Math.abs(totalRevenue - mealTotal) > 1) {
      Taro.showToast({
        title: '餐段营收总和与总营收不一致',
        icon: 'none',
        duration: 2000
      })
      return
    }

    setSaving(true)
    try {
      // 更新每日明细
      const success = await updateDailyRevenueDetail(detail.id, {
        adjusted_revenue: totalRevenue,
        breakfast_revenue: breakfast,
        lunch_revenue: lunch,
        dinner_revenue: dinner,
        other_revenue: other,
        weather_factor: weatherFactor || null,
        event_factor: eventFactor || null,
        notes: notes || null
      })

      if (!success) {
        throw new Error('更新失败')
      }

      // 记录调整日志
      await createRevenueAdjustmentLog({
        calendar_id: calendar.id,
        daily_detail_id: detail.id,
        adjustment_type: 'daily',
        adjustment_scope: `调整 ${detail.revenue_date} 的营收`,
        old_value: detail.adjusted_revenue || detail.predicted_revenue,
        new_value: totalRevenue,
        adjustment_reason: notes || '手动调整',
        adjusted_by: user.id
      })

      // 重新计算月度总营收
      const allDetails = await getDailyRevenueDetails(calendar.id)
      const newTotal = allDetails.reduce((sum, d) => {
        if (d.id === detail.id) {
          return sum + totalRevenue
        }
        return sum + (d.adjusted_revenue || d.predicted_revenue)
      }, 0)

      // 更新日历总营收
      await updateRevenueCalendar(calendar.id, {
        predicted_total_revenue: newTotal
      })

      Taro.showToast({
        title: '保存成功',
        icon: 'success',
        duration: 2000
      })

      // 延迟返回
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setSaving(false)
    }
  }, [
    detail,
    calendar,
    user,
    adjustedRevenue,
    breakfastRevenue,
    lunchRevenue,
    dinnerRevenue,
    otherRevenue,
    weatherFactor,
    eventFactor,
    notes
  ])

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 获取星期几
  const getWeekday = (dateStr: string) => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const date = new Date(dateStr)
    return `星期${weekdays[date.getDay()]}`
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  if (loading || !detail) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="i-mdi-loading text-4xl text-blue-500 animate-spin" />
        <Text className="text-sm text-gray-500 mt-4">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          {/* 日期信息卡片 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-lg font-bold text-gray-800">{formatDate(detail.revenue_date)}</Text>
              <Text className="text-sm text-gray-500">{getWeekday(detail.revenue_date)}</Text>
            </View>
            <View className="flex items-center gap-2">
              {detail.is_weekend && (
                <View className="px-2 py-1 rounded bg-blue-100">
                  <Text className="text-xs text-muted-foreground">周末</Text>
                </View>
              )}
              {detail.is_holiday && (
                <View className="px-2 py-1 rounded bg-red-100">
                  <Text className="text-xs text-red-600">节假日</Text>
                </View>
              )}
            </View>
          </View>

          {/* 原始预测 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-bold text-gray-800 block mb-3">原始预测</Text>
            <View className="flex items-center justify-between">
              <Text className="text-sm text-gray-600">预测营收</Text>
              <Text className="text-lg font-bold text-muted-foreground">{formatAmount(detail.predicted_revenue)}</Text>
            </View>
          </View>

          {/* 调整后营收 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-bold text-gray-800 block mb-3">调整后营收</Text>
            <View className="mb-3">
              <Text className="text-xs text-gray-600 block mb-2">总营收（元）</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  type="digit"
                  value={adjustedRevenue}
                  onInput={(e) => setAdjustedRevenue(e.detail.value)}
                  placeholder="请输入总营收"
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm"
                />
              </View>
            </View>
          </View>

          {/* 餐段分配 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-sm font-bold text-gray-800">餐段分配</Text>
              <Button
                className="px-3 py-1 bg-blue-100 text-white rounded text-xs break-keep"
                size="mini"
                onClick={handleAutoDistribute}>
                自动分配
              </Button>
            </View>

            <View className="space-y-3">
              <View>
                <Text className="text-xs text-gray-600 block mb-2">早餐营收（元）</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    type="digit"
                    value={breakfastRevenue}
                    onInput={(e) => setBreakfastRevenue(e.detail.value)}
                    placeholder="早餐营收"
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm"
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs text-gray-600 block mb-2">午餐营收（元）</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    type="digit"
                    value={lunchRevenue}
                    onInput={(e) => setLunchRevenue(e.detail.value)}
                    placeholder="午餐营收"
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm"
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs text-gray-600 block mb-2">晚餐营收（元）</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    type="digit"
                    value={dinnerRevenue}
                    onInput={(e) => setDinnerRevenue(e.detail.value)}
                    placeholder="晚餐营收"
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm"
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs text-gray-600 block mb-2">其他时段营收（元）</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    type="digit"
                    value={otherRevenue}
                    onInput={(e) => setOtherRevenue(e.detail.value)}
                    placeholder="其他时段营收"
                    className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm"
                  />
                </View>
              </View>

              {/* 餐段总和提示 */}
              <View className="p-2 bg-blue-100 rounded-lg">
                <Text className="text-xs text-muted-foreground">
                  餐段总和：
                  {formatAmount(
                    (Number.parseFloat(breakfastRevenue) || 0) +
                      (Number.parseFloat(lunchRevenue) || 0) +
                      (Number.parseFloat(dinnerRevenue) || 0) +
                      (Number.parseFloat(otherRevenue) || 0)
                  )}
                </Text>
              </View>
            </View>
          </View>

          {/* 影响因子 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-bold text-gray-800 block mb-3">影响因子</Text>

            <View className="space-y-3">
              <View>
                <Text className="text-xs text-gray-600 block mb-2">天气因子</Text>
                <Picker
                  mode="selector"
                  range={weatherOptions}
                  value={weatherOptions.indexOf(weatherFactor)}
                  onChange={(e) => {
                    const index = e.detail.value
                    setWeatherFactor(weatherOptions[index])
                  }}>
                  <View className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <Text className="text-sm text-gray-800">{weatherFactor || '请选择天气'}</Text>
                    <View className="i-mdi-chevron-down text-base text-gray-400" />
                  </View>
                </Picker>
              </View>

              <View>
                <Text className="text-xs text-gray-600 block mb-2">事件因子</Text>
                <Picker
                  mode="selector"
                  range={eventOptions}
                  value={eventOptions.indexOf(eventFactor)}
                  onChange={(e) => {
                    const index = e.detail.value
                    setEventFactor(eventOptions[index])
                  }}>
                  <View className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <Text className="text-sm text-gray-800">{eventFactor || '请选择事件'}</Text>
                    <View className="i-mdi-chevron-down text-base text-gray-400" />
                  </View>
                </Picker>
              </View>
            </View>
          </View>

          {/* 备注 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-bold text-gray-800 block mb-3">备注</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                value={notes}
                onInput={(e) => setNotes(e.detail.value)}
                placeholder="请输入备注信息"
                className="w-full px-3 py-2 bg-gray-50 rounded-lg text-sm"
              />
            </View>
          </View>

          {/* 保存按钮 */}
          <Button
            className="w-full bg-blue-100 text-white py-3 rounded-lg text-base break-keep mb-4"
            size="default"
            onClick={handleSave}
            disabled={saving}
            loading={saving}>
            {saving ? '保存中...' : '保存修改'}
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

export default RevenueDetail
