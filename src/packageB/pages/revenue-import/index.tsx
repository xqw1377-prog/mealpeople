/**
 * 历史营收数据导入页面（优化版）
 * 采用表格录入形式，提高录入效率
 * 支持批量录入，可选填写
 */

import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {getMealPeriods, type MealPeriod} from '@/db/api-meal-periods'
import {
  createDailyRevenueDetails,
  createRevenueCalendar,
  getDailyRevenueDetails,
  getMonthlyRevenueWithDetails
} from '@/db/api-revenue-calendar'
import type {DailyRevenueDetail} from '@/db/types-v2'
import {useTenantStore} from '@/store/tenant'

const RevenueImport: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7))
  const [dailyData, setDailyData] = useState<DailyRevenueDetail[]>([])

  // ✅ 新增：餐段配置
  const [_mealPeriods, setMealPeriods] = useState<MealPeriod[]>([])
  const [mealPeriodNames, setMealPeriodNames] = useState<string[]>([])

  // ✅ 优化：表格录入表单数据（只选择日期，其他固定）
  const [formData, setFormData] = useState({
    date: new Date().toISOString().substring(0, 10)
  })

  // ✅ 新增：餐段营收数据（动态生成）
  const [revenueData, setRevenueData] = useState<Record<string, string>>({
    breakfast: '',
    lunch: '',
    dinner: '',
    other: ''
  })

  // 生成月份选项（过去12个月）
  const generateMonthOptions = () => {
    const options: {label: string; value: string}[] = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yearMonth = date.toISOString().substring(0, 7)
      const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
      options.push({label, value: yearMonth})
    }
    return options
  }

  const monthOptions = generateMonthOptions()

  // ✅ 新增：加载餐段配置
  const loadMealPeriods = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      // 优先加载门店级别的餐段配置，如果没有则加载租户级别的
      let periods = await getMealPeriods(currentTenant.id, currentStore?.id)

      // 如果门店级别没有配置，尝试加载租户级别的
      if (periods.length === 0 && currentStore?.id) {
        periods = await getMealPeriods(currentTenant.id)
      }

      // 过滤出激活的餐段
      const activePeriods = periods.filter((p) => p.is_active)
      setMealPeriods(activePeriods)

      // 提取餐段名称
      const names = activePeriods.map((p) => p.period_name)
      setMealPeriodNames(names)

      // 初始化餐段营收数据
      const initialData: Record<string, string> = {}
      names.forEach((name) => {
        initialData[name] = ''
      })
      initialData.other = '' // 始终包含"其他"
      setRevenueData(initialData)

      console.log('✅ 加载餐段配置成功:', {
        租户ID: currentTenant.id,
        门店ID: currentStore?.id,
        餐段数量: activePeriods.length,
        餐段列表: names
      })
    } catch (error) {
      console.error('❌ 加载餐段配置失败:', error)
      // 如果加载失败，使用默认餐段
      setMealPeriodNames([])
      setRevenueData({other: ''})
    }
  }, [currentTenant?.id, currentStore?.id])

  // ✅ 页面加载时加载餐段配置
  useEffect(() => {
    loadMealPeriods()
  }, [loadMealPeriods])

  // 加载月度数据
  const loadMonthData = useCallback(async () => {
    if (!currentTenant || !currentStore) return

    setLoading(true)
    try {
      const {calendar, details} = await getMonthlyRevenueWithDetails(currentTenant.id, currentStore.id, selectedMonth)

      if (calendar) {
        setDailyData(details)
      } else {
        setDailyData([])
      }
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
    loadMonthData()
  })

  // ✅ 优化：重置表单
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().substring(0, 10)
    })
    // 重置所有餐段营收数据
    const initialData: Record<string, string> = {}
    mealPeriodNames.forEach((name) => {
      initialData[name] = ''
    })
    initialData.other = ''
    setRevenueData(initialData)
  }

  // 打开添加表单
  const handleAdd = () => {
    resetForm()
    setShowAddForm(true)
  }

  // ✅ 优化：保存数据（支持动态餐段）
  const handleSave = async () => {
    if (!currentTenant || !currentStore || !user) return

    // 计算总营收
    let total = 0
    const revenueByPeriod: Record<string, number> = {}

    // 处理配置的餐段
    mealPeriodNames.forEach((name) => {
      const value = Number.parseFloat(revenueData[name]) || 0
      revenueByPeriod[name] = value
      total += value
    })

    // 处理"其他"营收
    const otherRevenue = Number.parseFloat(revenueData.other) || 0
    total += otherRevenue

    if (total <= 0) {
      Taro.showToast({
        title: '请至少输入一项营收',
        icon: 'none'
      })
      return
    }

    try {
      // 检查该月份的日历是否存在
      const month = formData.date.substring(0, 7)
      let {calendar} = await getMonthlyRevenueWithDetails(currentTenant.id, currentStore.id, month)

      // 如果不存在，创建月度日历
      if (!calendar) {
        calendar = await createRevenueCalendar({
          tenant_id: currentTenant.id,
          store_id: currentStore.id,
          calendar_month: month,
          total_revenue_target: 0,
          predicted_total_revenue: 0,
          generated_by: 'manual',
          created_by: user.id
        })

        if (!calendar) {
          throw new Error('创建月度日历失败')
        }
      }

      // 检查该日期是否已存在
      const existingDetails = await getDailyRevenueDetails(calendar.id)
      const exists = existingDetails.some((d) => d.revenue_date === formData.date)

      if (exists) {
        Taro.showToast({
          title: '该日期数据已存在',
          icon: 'none'
        })
        return
      }

      // 创建日度数据
      const date = new Date(formData.date)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      // ✅ 使用固定字段存储（兼容现有数据库结构）
      await createDailyRevenueDetails([
        {
          calendar_id: calendar.id,
          revenue_date: formData.date,
          day_of_week: dayOfWeek,
          is_weekend: isWeekend,
          is_holiday: false,
          predicted_revenue: total,
          breakfast_revenue: revenueByPeriod.breakfast || revenueByPeriod.早餐 || 0,
          lunch_revenue: revenueByPeriod.lunch || revenueByPeriod.午餐 || revenueByPeriod.中餐 || 0,
          dinner_revenue: revenueByPeriod.dinner || revenueByPeriod.晚餐 || 0,
          other_revenue: otherRevenue
        }
      ])

      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setShowAddForm(false)
      resetForm()
      loadMonthData()
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'error'
      })
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  // 获取星期几
  const getWeekday = (dateStr: string) => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const date = new Date(dateStr)
    return weekdays[date.getDay()]
  }

  if (!currentTenant || !currentStore) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center mx-4">
          <View className="i-mdi-alert-circle-outline text-6xl text-orange-500 mx-auto mb-4" />
          <Text className="text-base text-foreground block mb-2">请先选择租户和门店</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          {/* 头部 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-3">
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground block mb-1">历史营收数据导入</Text>
                <Text className="text-xs text-muted-foreground block">手动录入历史营收数据用于智能预测</Text>
              </View>
              <Button
                className="bg-blue-100 text-white px-4 py-2 rounded-lg text-sm break-keep"
                size="default"
                onClick={handleAdd}>
                <View className="flex items-center gap-1">
                  <View className="i-mdi-plus text-base" />
                  <Text className="text-sm">录入</Text>
                </View>
              </Button>
            </View>

            {/* 月份选择 */}
            <View>
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
          </View>

          {/* 数据列表 */}
          {loading ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-loading text-4xl text-orange-500 animate-spin mx-auto mb-4" />
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : dailyData.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-database-import text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无数据</Text>
              <Text className="text-sm text-muted-foreground block">点击"录入"按钮添加历史营收数据</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {dailyData.map((item) => {
                const total = item.breakfast_revenue + item.lunch_revenue + item.dinner_revenue + item.other_revenue
                return (
                  <View key={item.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex items-center gap-2">
                        <Text className="text-base font-bold text-foreground">{formatDate(item.revenue_date)}</Text>
                        <Text className="text-xs text-muted-foreground">周{getWeekday(item.revenue_date)}</Text>
                        {item.is_weekend && (
                          <View className="px-2 py-0.5 rounded text-xs bg-blue-100 text-muted-foreground">
                            <Text className="text-xs">周末</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-lg font-bold text-muted-foreground">{formatAmount(total)}</Text>
                    </View>

                    <View className="grid grid-cols-2 gap-2">
                      <View className="bg-blue-100 rounded-lg p-2">
                        <Text className="text-xs text-yellow-600 block mb-1">早餐</Text>
                        <Text className="text-sm font-semibold text-yellow-700">
                          {formatAmount(item.breakfast_revenue)}
                        </Text>
                      </View>
                      <View className="bg-blue-100 rounded-lg p-2">
                        <Text className="text-xs text-muted-foreground block mb-1">午餐</Text>
                        <Text className="text-sm font-semibold text-green-600">{formatAmount(item.lunch_revenue)}</Text>
                      </View>
                      <View className="bg-blue-100 rounded-lg p-2">
                        <Text className="text-xs text-muted-foreground block mb-1">晚餐</Text>
                        <Text className="text-sm font-semibold text-blue-600">{formatAmount(item.dinner_revenue)}</Text>
                      </View>
                      <View className="bg-blue-100 rounded-lg p-2">
                        <Text className="text-xs text-muted-foreground block mb-1">其他</Text>
                        <Text className="text-sm font-semibold text-purple-700">
                          {formatAmount(item.other_revenue)}
                        </Text>
                      </View>
                    </View>

                    {item.notes && (
                      <View className="mt-3 pt-3 border-t border-border">
                        <Text className="text-xs text-muted-foreground">{item.notes}</Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* ✅ 优化：表格录入表单 */}
          {showAddForm && (
            <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 w-full max-w-md max-h-[80vh] overflow-y-auto">
                <View className="flex items-center justify-between mb-4">
                  <Text className="text-lg font-bold text-foreground">快速录入营收</Text>
                  <View className="i-mdi-table text-xl text-orange-500" />
                </View>

                <View className="mb-4 p-3 bg-blue-100 rounded-lg">
                  <Text className="text-xs text-blue-600">
                    💡 提示：只需选择日期，门店自动使用当前门店，可选择性填写餐段营收
                  </Text>
                </View>

                {/* 日期选择 */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground block mb-2">📅 选择日期 *</Text>
                  <Picker mode="date" value={formData.date} onChange={(e) => setFormData({date: e.detail.value})}>
                    <View className="flex items-center justify-between p-3 bg-blue-100 rounded-lg border-2 border-border">
                      <Text className="text-base font-medium text-foreground">{formData.date}</Text>
                      <View className="i-mdi-calendar text-xl text-orange-500" />
                    </View>
                  </Picker>
                </View>

                {/* 门店信息（固定，不可选择） */}
                <View className="mb-4 p-3 bg-muted rounded-lg border border-border">
                  <View className="flex items-center gap-2 mb-1">
                    <View className="i-mdi-store text-base text-muted-foreground" />
                    <Text className="text-xs text-muted-foreground">当前门店</Text>
                  </View>
                  <Text className="text-sm font-medium text-foreground">{currentStore?.name}</Text>
                </View>

                {/* ✅ 表格形式：餐段营收录入 */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground block mb-3">💰 餐段营收（元）</Text>

                  <View className="border border-border rounded-lg overflow-hidden">
                    {/* 表头 */}
                    <View className="flex bg-blue-100 p-2">
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-blue-600">餐段</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-blue-600 text-right">营收金额</Text>
                      </View>
                    </View>

                    {/* ✅ 动态生成餐段行 */}
                    {mealPeriodNames.map((periodName, index) => (
                      <View
                        key={periodName}
                        className={`flex items-center p-2 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } border-t border-border`}>
                        <View className="flex-1">
                          <Text className="text-sm text-foreground">{periodName}</Text>
                        </View>
                        <View className="flex-1">
                          <Input
                            type="digit"
                            value={revenueData[periodName] || ''}
                            onInput={(e) =>
                              setRevenueData({
                                ...revenueData,
                                [periodName]: e.detail.value
                              })
                            }
                            placeholder="0"
                            className="text-right text-sm text-foreground bg-transparent border-b border-border px-2 py-1"
                          />
                        </View>
                      </View>
                    ))}

                    {/* 其他营收行 */}
                    <View className="flex items-center p-2 bg-blue-100 border-t border-border">
                      <View className="flex-1">
                        <Text className="text-sm text-foreground">其他</Text>
                      </View>
                      <View className="flex-1">
                        <Input
                          type="digit"
                          value={revenueData.other || ''}
                          onInput={(e) =>
                            setRevenueData({
                              ...revenueData,
                              other: e.detail.value
                            })
                          }
                          placeholder="0"
                          className="text-right text-sm text-foreground bg-transparent border-b border-border px-2 py-1"
                        />
                      </View>
                    </View>

                    {/* 合计行 */}
                    <View className="flex items-center p-2 bg-blue-100 border-t-2 border-border">
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-green-600">合计</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-right text-base font-bold text-green-600">
                          ¥
                          {(
                            mealPeriodNames.reduce(
                              (sum, name) => sum + (Number.parseFloat(revenueData[name]) || 0),
                              0
                            ) + (Number.parseFloat(revenueData.other) || 0)
                          ).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View className="flex gap-3 mt-6">
                  <Button
                    className="flex-1 bg-muted text-foreground py-3 rounded-lg text-sm break-keep"
                    size="default"
                    onClick={() => {
                      setShowAddForm(false)
                      resetForm()
                    }}>
                    取消
                  </Button>
                  <Button
                    className="flex-1 bg-blue-100 text-white py-3 rounded-lg text-sm break-keep font-semibold"
                    size="default"
                    onClick={handleSave}>
                    💾 保存
                  </Button>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default RevenueImport
