import {Button, Input, Picker, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getStoresByTenantId} from '@/db/api'
import type {Store} from '@/db/types'
import type {OptimizationSuggestionDisplay, SchedulingResult, VacationRecommendation} from '@/services/scheduling'
import {schedulingService} from '@/services/scheduling'
import {useTenantStore} from '@/store/tenant'

export default function ScheduleOptimization() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [targetRevenue, setTargetRevenue] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)

  // 计算结果
  const [schedulingResult, setSchedulingResult] = useState<SchedulingResult | null>(null)
  const [vacationRecommendations, setVacationRecommendations] = useState<VacationRecommendation[]>([])
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestionDisplay[]>([])

  // 加载店铺列表
  const loadStores = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      const storeList = await getStoresByTenantId(currentTenant.id)
      setStores(storeList)
    } catch (error) {
      console.error('加载店铺列表失败:', error)
      Taro.showToast({title: '加载店铺列表失败', icon: 'none'})
    }
  }, [currentTenant?.id])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  useDidShow(() => {
    loadStores()
  })

  // 计算排班需求
  const handleCalculate = useCallback(async () => {
    if (!currentTenant?.id) return
    if (!targetRevenue || !targetDate) {
      Taro.showToast({title: '请填写完整信息', icon: 'none'})
      return
    }

    const revenue = Number.parseFloat(targetRevenue)
    if (Number.isNaN(revenue) || revenue <= 0) {
      Taro.showToast({title: '请输入有效的营收目标', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const storeId = stores[selectedStoreIndex]?.id

      // 计算排班需求
      const result = await schedulingService.calculateSchedulingNeeds(currentTenant.id, revenue, targetDate, storeId)
      setSchedulingResult(result)

      // 获取休假推荐
      const vacations = await schedulingService.recommendVacations(currentTenant.id, targetDate, storeId)
      setVacationRecommendations(vacations)

      // 获取优化建议
      const suggestions = await schedulingService.optimizeScheduling(currentTenant.id, targetDate, storeId)
      setOptimizationSuggestions(suggestions)

      Taro.showToast({title: '计算完成', icon: 'success'})
    } catch (error) {
      console.error('计算失败:', error)
      Taro.showToast({title: '计算失败，请重试', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [targetRevenue, targetDate, stores, selectedStoreIndex, currentTenant?.id])

  // 日期选择
  const handleDateChange = useCallback((e) => {
    setTargetDate(e.detail.value)
  }, [])

  // 店铺选择
  const handleStoreChange = useCallback((e) => {
    setSelectedStoreIndex(Number.parseInt(e.detail.value, 10))
  }, [])

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-orange-500'
      case 'low':
        return 'text-blue-500'
      default:
        return 'text-muted-foreground'
    }
  }

  // 获取优先级文本
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高'
      case 'medium':
        return '中'
      case 'low':
        return '低'
      default:
        return '未知'
    }
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      {/* 输入表单 */}
      <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
        <Text className="text-lg font-semibold text-foreground mb-4">排班计算</Text>

        {/* 店铺选择 */}
        <View className="mb-4">
          <Text className="text-sm text-muted-foreground mb-2">选择店铺</Text>
          <Picker
            mode="selector"
            range={stores.map((s) => s.name)}
            value={selectedStoreIndex}
            onChange={handleStoreChange}>
            <View className="bg-input border border-border rounded px-3 py-2">
              <Text className="text-foreground">{stores[selectedStoreIndex]?.name || '请选择店铺'}</Text>
            </View>
          </Picker>
        </View>

        {/* 营收目标 */}
        <View className="mb-4">
          <Text className="text-sm text-muted-foreground mb-2">营收目标（元）</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input border border-border rounded px-3 py-2 text-foreground"
              type="digit"
              placeholder="请输入营收目标"
              value={targetRevenue}
              onInput={(e) => setTargetRevenue(e.detail.value)}
            />
          </View>
        </View>

        {/* 目标日期 */}
        <View className="mb-4">
          <Text className="text-sm text-muted-foreground mb-2">目标日期</Text>
          <Picker mode="date" value={targetDate} onChange={handleDateChange}>
            <View className="bg-input border border-border rounded px-3 py-2">
              <Text className="text-foreground">{targetDate || '请选择日期'}</Text>
            </View>
          </Picker>
        </View>

        {/* 计算按钮 */}
        <Button
          className="w-full bg-blue-100 text-white py-3 rounded break-keep text-base"
          size="default"
          onClick={handleCalculate}
          disabled={loading}>
          {loading ? '计算中...' : '开始计算'}
        </Button>
      </View>

      {/* 排班需求结果 */}
      {schedulingResult && (
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-foreground mb-4">排班需求</Text>

          <View className="space-y-3">
            <View className="flex justify-between items-center py-2 border-b border-border">
              <Text className="text-muted-foreground">所需人数</Text>
              <Text className="text-xl font-bold text-blue-600">{schedulingResult.requiredStaff} 人</Text>
            </View>

            <View className="flex justify-between items-center py-2 border-b border-border">
              <Text className="text-muted-foreground">预计人力成本</Text>
              <Text className="text-lg font-semibold text-foreground">
                ¥{schedulingResult.estimatedCost.toFixed(2)}
              </Text>
            </View>

            <View className="flex justify-between items-center py-2 border-b border-border">
              <Text className="text-muted-foreground">成本占比</Text>
              <Text className="text-lg font-semibold text-foreground">{schedulingResult.costRatio.toFixed(1)}%</Text>
            </View>

            <View className="flex justify-between items-center py-2">
              <Text className="text-muted-foreground">可行性</Text>
              <Text
                className={`text-lg font-semibold ${schedulingResult.feasible ? 'text-green-500' : 'text-red-500'}`}>
                {schedulingResult.feasible ? '可行' : '不可行'}
              </Text>
            </View>

            {schedulingResult.reason && (
              <View className="bg-gray-50/50 rounded p-3 mt-2">
                <Text className="text-sm text-muted-foreground">{schedulingResult.reason}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 休假推荐 */}
      {vacationRecommendations.length > 0 && (
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-foreground mb-4">休假推荐</Text>

          <View className="space-y-3">
            {vacationRecommendations.map((rec) => (
              <View key={rec.employeeId} className="bg-gray-50/30 rounded-lg p-3">
                <View className="flex justify-between items-start mb-2">
                  <Text className="text-base font-medium text-foreground">{rec.employeeName}</Text>
                  <Text className={`text-xs px-2 py-1 rounded ${getPriorityColor(rec.priority)}`}>
                    {getPriorityText(rec.priority)}
                  </Text>
                </View>

                <View className="space-y-1">
                  <View className="flex items-center">
                    <Text className="text-sm text-muted-foreground">推荐日期：</Text>
                    <Text className="text-sm text-foreground ml-1">{rec.recommendedDate}</Text>
                  </View>

                  <View className="flex items-center">
                    <Text className="text-sm text-muted-foreground">推荐天数：</Text>
                    <Text className="text-sm text-foreground ml-1">{rec.days} 天</Text>
                  </View>

                  <View className="mt-2">
                    <Text className="text-xs text-muted-foreground">{rec.reason}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 优化建议 */}
      {optimizationSuggestions.length > 0 && (
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-foreground mb-4">优化建议</Text>

          <View className="space-y-3">
            {optimizationSuggestions.map((suggestion) => (
              <View key={suggestion.id} className="bg-gray-50/30 rounded-lg p-3">
                <View className="flex justify-between items-start mb-2">
                  <Text className="text-base font-medium text-foreground">{suggestion.title}</Text>
                  <Text className={`text-xs px-2 py-1 rounded ${getPriorityColor(suggestion.priority)}`}>
                    {getPriorityText(suggestion.priority)}
                  </Text>
                </View>

                <Text className="text-sm text-muted-foreground mb-2">{suggestion.description}</Text>

                {suggestion.expected_benefit && (
                  <View className="bg-blue-100 rounded p-2 mt-2">
                    <Text className="text-xs text-blue-600">预期收益：{suggestion.expected_benefit}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 空状态 */}
      {!schedulingResult && !loading && (
        <View className="flex flex-col items-center justify-center py-12">
          <View className="i-mdi-calendar-clock text-6xl text-muted-foreground/30 mb-4" />
          <Text className="text-muted-foreground">请输入信息并开始计算</Text>
        </View>
      )}
    </View>
  )
}
