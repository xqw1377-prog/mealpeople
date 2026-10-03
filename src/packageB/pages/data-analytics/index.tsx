/**
 * 数据分析页面 - 重新设计版
 * 采用Tab切换设计，优化数据展示和交互体验
 */

import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {EmptyState} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {getStoresByTenantId} from '@/db/api'
import type {Store} from '@/db/types'
import type {AnalyticsResult, AnomalyDetection, TrendPrediction} from '@/services/analytics'
import {analyticsService} from '@/services/analytics'
import {useTenantStore} from '@/store/tenant'

// Tab类型定义
type TabType = 'overview' | 'revenue' | 'cost' | 'efficiency' | 'schedule' | 'trend' | 'anomaly'

export default function DataAnalytics() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // 分析结果
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null)
  const [trends, setTrends] = useState<TrendPrediction[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([])

  // Tab配置
  const tabs = [
    {key: 'overview', label: '概览', icon: 'i-mdi-view-dashboard'},
    {key: 'revenue', label: '营收', icon: 'i-mdi-currency-cny'},
    {key: 'cost', label: '成本', icon: 'i-mdi-cash-multiple'},
    {key: 'efficiency', label: '效率', icon: 'i-mdi-speedometer'},
    {key: 'schedule', label: '排班', icon: 'i-mdi-calendar-clock'},
    {key: 'trend', label: '趋势', icon: 'i-mdi-chart-line'},
    {key: 'anomaly', label: '异常', icon: 'i-mdi-alert-circle'}
  ]

  // 加载店铺列表
  const loadStores = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      const storeList = await getStoresByTenantId(currentTenant.id)
      setStores([{id: 'all', name: '全部店铺'} as Store, ...storeList])
    } catch (error) {
      console.error('加载店铺列表失败:', error)
      Taro.showToast({title: '加载店铺列表失败', icon: 'none'})
    }
  }, [currentTenant?.id])

  // 加载分析数据
  const loadAnalytics = useCallback(async () => {
    if (!currentTenant?.id) return

    setLoading(true)
    try {
      const storeId = stores[selectedStoreIndex]?.id === 'all' ? undefined : stores[selectedStoreIndex]?.id

      // 执行分析
      const [analyticsResult, trendPredictions, anomalyDetections] = await Promise.all([
        analyticsService.analyzeData(currentTenant.id, storeId, days),
        analyticsService.predictTrends(currentTenant.id, storeId, days),
        analyticsService.detectAnomalies(currentTenant.id, storeId, days)
      ])

      setAnalytics(analyticsResult)
      setTrends(trendPredictions)
      setAnomalies(anomalyDetections)

      Taro.showToast({title: '分析完成', icon: 'success'})
    } catch (error) {
      console.error('分析失败:', error)
      Taro.showToast({title: '分析失败，请重试', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [stores, selectedStoreIndex, days, currentTenant?.id])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  useEffect(() => {
    if (stores.length > 0) {
      loadAnalytics()
    }
  }, [stores, loadAnalytics])

  useDidShow(() => {
    loadStores()
  })

  // 下拉刷新处理
  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await loadStores()
      if (stores.length > 0) {
        await loadAnalytics()
      }
      setTimeout(() => {
        setRefreshing(false)
        Taro.showToast({title: '刷新成功', icon: 'success', duration: 1500})
      }, 500)
    } catch (_error) {
      setRefreshing(false)
      Taro.showToast({title: '刷新失败', icon: 'error'})
    }
  }

  // 店铺选择
  const handleStoreChange = useCallback((e) => {
    setSelectedStoreIndex(Number.parseInt(e.detail.value, 10))
  }, [])

  // 天数选择
  const handleDaysChange = useCallback((e) => {
    const daysOptions = [7, 30, 90]
    setDays(daysOptions[Number.parseInt(e.detail.value, 10)])
  }, [])

  // 获取趋势图标
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'i-mdi-trending-up'
      case 'down':
        return 'i-mdi-trending-down'
      default:
        return 'i-mdi-trending-neutral'
    }
  }

  // 获取趋势颜色
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  // 获取趋势文本
  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'up':
        return '上升'
      case 'down':
        return '下降'
      default:
        return '平稳'
    }
  }

  // 渲染概览Tab
  const renderOverviewTab = () => {
    if (!analytics) return null

    return (
      <View className="space-y-4">
        {/* 核心指标卡片 */}
        <View className="grid grid-cols-2 gap-3">
          {/* 总营收 */}
          <View className="bg-blue-100 rounded-xl p-4 border border-border/20">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-sm text-muted-foreground">总营收</Text>
              <View className="i-mdi-currency-cny text-xl text-blue-500" />
            </View>
            <Text className="text-2xl font-bold text-foreground mb-1">
              ¥{(analytics.revenueAnalysis.total / 10000).toFixed(1)}万
            </Text>
            <View className="flex items-center gap-1">
              <View
                className={`${getTrendIcon(analytics.revenueAnalysis.trend)} text-sm ${getTrendColor(analytics.revenueAnalysis.trend)}`}
              />
              <Text className={`text-xs ${getTrendColor(analytics.revenueAnalysis.trend)}`}>
                {analytics.revenueAnalysis.growth.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* 总成本 */}
          <View className="bg-blue-100 rounded-xl p-4 border border-border/20">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-sm text-muted-foreground">总成本</Text>
              <View className="i-mdi-cash-multiple text-xl text-orange-500" />
            </View>
            <Text className="text-2xl font-bold text-foreground mb-1">
              ¥{(analytics.costAnalysis.total / 10000).toFixed(1)}万
            </Text>
            <View className="flex items-center gap-1">
              <Text className="text-xs text-muted-foreground">占比 {analytics.costAnalysis.ratio.toFixed(1)}%</Text>
            </View>
          </View>

          {/* 平均效率 */}
          <View className="bg-blue-100 rounded-xl p-4 border border-border/20">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-sm text-muted-foreground">平均效率</Text>
              <View className="i-mdi-speedometer text-xl text-green-500" />
            </View>
            <Text className="text-2xl font-bold text-foreground mb-1">
              {analytics.efficiencyAnalysis.average.toFixed(1)}
            </Text>
            <View className="flex items-center gap-1">
              <View
                className={`${getTrendIcon(analytics.efficiencyAnalysis.trend)} text-sm ${getTrendColor(analytics.efficiencyAnalysis.trend)}`}
              />
              <Text className={`text-xs ${getTrendColor(analytics.efficiencyAnalysis.trend)}`}>
                {getTrendText(analytics.efficiencyAnalysis.trend)}
              </Text>
            </View>
          </View>

          {/* 排班完成率 */}
          <View className="bg-blue-100 rounded-xl p-4 border border-border/20">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-sm text-muted-foreground">完成率</Text>
              <View className="i-mdi-calendar-check text-xl text-purple-500" />
            </View>
            <Text className="text-2xl font-bold text-foreground mb-1">
              {analytics.scheduleAnalysis.completionRate.toFixed(1)}%
            </Text>
            <View className="flex items-center gap-1">
              <Text className="text-xs text-muted-foreground">
                优秀率 {analytics.scheduleAnalysis.excellentRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* 异常提醒 */}
        {anomalies.length > 0 && (
          <View className="bg-blue-100 border border-border/20 rounded-xl p-4">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-alert-circle text-xl text-red-500" />
              <Text className="text-base font-semibold text-foreground">发现 {anomalies.length} 个异常</Text>
            </View>
            <View className="space-y-2">
              {anomalies.slice(0, 3).map((anomaly) => (
                <View key={anomaly.id} className="flex items-start gap-2">
                  <View className="i-mdi-circle-small text-red-500 mt-0.5" />
                  <Text className="text-sm text-foreground flex-1">{anomaly.description}</Text>
                </View>
              ))}
            </View>
            {anomalies.length > 3 && (
              <View className="mt-3 pt-3 border-t border-border/20">
                <Text className="text-sm text-red-500 text-center" onClick={() => setActiveTab('anomaly')}>
                  查看全部异常 →
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 快速操作 */}
        <View className="grid grid-cols-3 gap-3">
          <View
            className="bg-white border border-border rounded-xl p-3 flex flex-col items-center gap-2 border-2 border-gray-200"
            onClick={() => setActiveTab('revenue')}>
            <View className="i-mdi-currency-cny text-2xl text-blue-600" />
            <Text className="text-xs text-muted-foreground">营收详情</Text>
          </View>
          <View
            className="bg-white border border-border rounded-xl p-3 flex flex-col items-center gap-2 border-2 border-gray-200"
            onClick={() => setActiveTab('efficiency')}>
            <View className="i-mdi-speedometer text-2xl text-blue-600" />
            <Text className="text-xs text-muted-foreground">效率分析</Text>
          </View>
          <View
            className="bg-white border border-border rounded-xl p-3 flex flex-col items-center gap-2 border-2 border-gray-200"
            onClick={() => setActiveTab('trend')}>
            <View className="i-mdi-chart-line text-2xl text-blue-600" />
            <Text className="text-xs text-muted-foreground">趋势预测</Text>
          </View>
        </View>
      </View>
    )
  }

  // 渲染营收Tab
  const renderRevenueTab = () => {
    if (!analytics) return null

    return (
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
        <Text className="text-lg font-semibold text-foreground mb-4">营收分析</Text>

        <View className="space-y-4">
          {/* 总营收 */}
          <View className="bg-blue-100 rounded-lg p-4">
            <Text className="text-sm text-muted-foreground mb-2">总营收</Text>
            <Text className="text-3xl font-bold text-blue-600 mb-2">
              ¥{analytics.revenueAnalysis.total.toLocaleString()}
            </Text>
            <View className="flex items-center gap-2">
              <View
                className={`${getTrendIcon(analytics.revenueAnalysis.trend)} text-lg ${getTrendColor(analytics.revenueAnalysis.trend)}`}
              />
              <Text className={`text-base font-semibold ${getTrendColor(analytics.revenueAnalysis.trend)}`}>
                {analytics.revenueAnalysis.growth > 0 ? '+' : ''}
                {analytics.revenueAnalysis.growth.toFixed(1)}%
              </Text>
              <Text className="text-sm text-muted-foreground">较上期</Text>
            </View>
          </View>

          {/* 详细数据 */}
          <View className="space-y-3">
            <View className="flex justify-between items-center py-3 border-b border-border">
              <Text className="text-muted-foreground">日均营收</Text>
              <Text className="text-lg font-semibold text-foreground">
                ¥{analytics.revenueAnalysis.average.toLocaleString()}
              </Text>
            </View>

            <View className="flex justify-between items-center py-3 border-b border-border">
              <Text className="text-muted-foreground">增长趋势</Text>
              <View className="flex items-center gap-2">
                <View
                  className={`${getTrendIcon(analytics.revenueAnalysis.trend)} text-lg ${getTrendColor(analytics.revenueAnalysis.trend)}`}
                />
                <Text className={`text-lg font-semibold ${getTrendColor(analytics.revenueAnalysis.trend)}`}>
                  {getTrendText(analytics.revenueAnalysis.trend)}
                </Text>
              </View>
            </View>

            <View className="flex justify-between items-center py-3">
              <Text className="text-muted-foreground">增长率</Text>
              <Text className={`text-lg font-semibold ${getTrendColor(analytics.revenueAnalysis.trend)}`}>
                {analytics.revenueAnalysis.growth.toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // 渲染成本Tab
  const renderCostTab = () => {
    if (!analytics) return null

    return (
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
        <Text className="text-lg font-semibold text-foreground mb-4">成本分析</Text>

        <View className="space-y-4">
          {/* 总成本 */}
          <View className="bg-blue-100 rounded-lg p-4">
            <Text className="text-sm text-muted-foreground mb-2">总成本</Text>
            <Text className="text-3xl font-bold text-orange-500 mb-2">
              ¥{analytics.costAnalysis.total.toLocaleString()}
            </Text>
            <View className="flex items-center gap-2">
              <Text className="text-base font-semibold text-foreground">
                占营收 {analytics.costAnalysis.ratio.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* 详细数据 */}
          <View className="space-y-3">
            <View className="flex justify-between items-center py-3 border-b border-border">
              <Text className="text-muted-foreground">日均成本</Text>
              <Text className="text-lg font-semibold text-foreground">
                ¥{analytics.costAnalysis.average.toLocaleString()}
              </Text>
            </View>

            <View className="flex justify-between items-center py-3 border-b border-border">
              <Text className="text-muted-foreground">成本占比</Text>
              <View className="flex-1 mx-4">
                <View className="h-2 bg-muted rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-100 rounded-full"
                    style={{width: `${Math.min(analytics.costAnalysis.ratio, 100)}%`}}
                  />
                </View>
              </View>
              <Text className="text-lg font-semibold text-foreground">{analytics.costAnalysis.ratio.toFixed(1)}%</Text>
            </View>

            <View className="flex justify-between items-center py-3">
              <Text className="text-muted-foreground">成本趋势</Text>
              <View className="flex items-center gap-2">
                <View
                  className={`${getTrendIcon(analytics.costAnalysis.trend)} text-lg ${getTrendColor(analytics.costAnalysis.trend)}`}
                />
                <Text className={`text-lg font-semibold ${getTrendColor(analytics.costAnalysis.trend)}`}>
                  {getTrendText(analytics.costAnalysis.trend)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // 渲染效率Tab
  const renderEfficiencyTab = () => {
    if (!analytics) return null

    return (
      <View className="space-y-4">
        {/* 平均效率 */}
        <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
          <Text className="text-lg font-semibold text-foreground mb-4">效率概览</Text>

          <View className="bg-blue-100 rounded-lg p-4 mb-4">
            <Text className="text-sm text-muted-foreground mb-2">平均效率</Text>
            <Text className="text-3xl font-bold text-green-500 mb-2">
              {analytics.efficiencyAnalysis.average.toFixed(1)}
            </Text>
            <View className="flex items-center gap-2">
              <View
                className={`${getTrendIcon(analytics.efficiencyAnalysis.trend)} text-lg ${getTrendColor(analytics.efficiencyAnalysis.trend)}`}
              />
              <Text className={`text-base font-semibold ${getTrendColor(analytics.efficiencyAnalysis.trend)}`}>
                {getTrendText(analytics.efficiencyAnalysis.trend)}
              </Text>
            </View>
          </View>
        </View>

        {/* 高效员工TOP5 */}
        {analytics.efficiencyAnalysis.topPerformers.length > 0 && (
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
            <Text className="text-lg font-semibold text-foreground mb-4">高效员工 TOP 5</Text>

            <View className="space-y-3">
              {analytics.efficiencyAnalysis.topPerformers.map((performer, index) => (
                <View key={performer.id} className="flex items-center gap-3 bg-gray-50/30 rounded-lg p-3">
                  {/* 排名 */}
                  <View
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0
                        ? 'bg-blue-100'
                        : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                            ? 'bg-orange-600'
                            : 'bg-blue-100'
                    }`}>
                    <Text className={`text-sm font-bold ${index < 3 ? 'text-foreground' : 'text-blue-600'}`}>
                      {index + 1}
                    </Text>
                  </View>

                  {/* 员工信息 */}
                  <View className="flex-1">
                    <Text className="text-base font-medium text-foreground">{performer.name}</Text>
                  </View>

                  {/* 效率值 */}
                  <View className="flex items-center gap-2">
                    <Text className="text-lg font-bold text-blue-600">{performer.efficiency.toFixed(1)}</Text>
                    <View className="i-mdi-star text-yellow-500" />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    )
  }

  // 渲染排班Tab
  const renderScheduleTab = () => {
    if (!analytics) return null

    return (
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
        <Text className="text-lg font-semibold text-foreground mb-4">排班分析</Text>

        <View className="space-y-4">
          {/* 总排班数 */}
          <View className="bg-blue-100 rounded-lg p-4">
            <Text className="text-sm text-muted-foreground mb-2">总排班数</Text>
            <Text className="text-3xl font-bold text-purple-500 mb-2">{analytics.scheduleAnalysis.totalShifts}</Text>
            <Text className="text-sm text-muted-foreground">分析周期内的总排班次数</Text>
          </View>

          {/* 详细数据 */}
          <View className="space-y-3">
            <View className="py-3 border-b border-border">
              <View className="flex justify-between items-center mb-2">
                <Text className="text-muted-foreground">完成率</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {analytics.scheduleAnalysis.completionRate.toFixed(1)}%
                </Text>
              </View>
              <View className="h-2 bg-muted rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-100 rounded-full"
                  style={{width: `${analytics.scheduleAnalysis.completionRate}%`}}
                />
              </View>
            </View>

            <View className="py-3 border-b border-border">
              <View className="flex justify-between items-center mb-2">
                <Text className="text-muted-foreground">优秀率</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {analytics.scheduleAnalysis.excellentRate.toFixed(1)}%
                </Text>
              </View>
              <View className="h-2 bg-muted rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-100 rounded-full"
                  style={{width: `${analytics.scheduleAnalysis.excellentRate}%`}}
                />
              </View>
            </View>

            <View className="flex justify-between items-center py-3">
              <Text className="text-muted-foreground">平均评分</Text>
              <View className="flex items-center gap-2">
                <Text className="text-lg font-semibold text-blue-600">
                  {analytics.scheduleAnalysis.averageScore.toFixed(1)}
                </Text>
                <View className="i-mdi-star text-yellow-500" />
              </View>
            </View>
          </View>
        </View>
      </View>
    )
  }

  // 渲染趋势Tab
  const renderTrendTab = () => {
    if (trends.length === 0) {
      return (
        <View className="bg-white rounded-xl p-8 border-2 border-gray-200 flex flex-col items-center justify-center">
          <View className="i-mdi-chart-line text-6xl text-muted-foreground/30 mb-4" />
          <Text className="text-muted-foreground">暂无趋势预测数据</Text>
        </View>
      )
    }

    return (
      <View className="space-y-4">
        {trends.map((trend) => (
          <View key={trend.metric} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex justify-between items-start mb-4">
              <Text className="text-lg font-semibold text-foreground">{trend.metric}</Text>
              <View className="flex items-center gap-2">
                <View className={`${getTrendIcon(trend.trend)} text-xl ${getTrendColor(trend.trend)}`} />
                <Text className={`text-base font-semibold ${getTrendColor(trend.trend)}`}>
                  {trend.changeRate > 0 ? '+' : ''}
                  {trend.changeRate.toFixed(1)}%
                </Text>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex justify-between items-center py-2 border-b border-border">
                <Text className="text-muted-foreground">当前值</Text>
                <Text className="text-lg font-semibold text-foreground">{trend.current.toFixed(2)}</Text>
              </View>

              <View className="flex justify-between items-center py-2 border-b border-border">
                <Text className="text-muted-foreground">预测值</Text>
                <Text className="text-lg font-semibold text-blue-600">{trend.predicted.toFixed(2)}</Text>
              </View>

              <View className="flex justify-between items-center py-2">
                <Text className="text-muted-foreground">置信度</Text>
                <View className="flex items-center gap-2">
                  <View className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                    <View className="h-full bg-blue-100 rounded-full" style={{width: `${trend.confidence * 100}%`}} />
                  </View>
                  <Text className="text-sm font-semibold text-blue-600">{(trend.confidence * 100).toFixed(0)}%</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    )
  }

  // 渲染异常Tab
  const renderAnomalyTab = () => {
    if (anomalies.length === 0) {
      return (
        <View className="bg-white rounded-xl p-8 border-2 border-gray-200 flex flex-col items-center justify-center">
          <View className="i-mdi-check-circle text-6xl text-green-500/30 mb-4" />
          <Text className="text-muted-foreground">未发现异常情况</Text>
          <Text className="text-sm text-muted-foreground mt-2">系统运行正常</Text>
        </View>
      )
    }

    return (
      <View className="space-y-4">
        {anomalies.map((anomaly) => (
          <View key={anomaly.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex justify-between items-start mb-3">
              <View className="flex-1 pr-3">
                <Text className="text-base font-semibold text-foreground mb-1">{anomaly.description}</Text>
                <Text className="text-sm text-muted-foreground">{anomaly.date}</Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  anomaly.severity === 'high'
                    ? 'bg-blue-100 text-red-500'
                    : anomaly.severity === 'medium'
                      ? 'bg-blue-100 text-orange-500'
                      : 'bg-blue-100 text-blue-500'
                }`}>
                <Text
                  className={`text-xs font-semibold ${
                    anomaly.severity === 'high'
                      ? 'text-red-500'
                      : anomaly.severity === 'medium'
                        ? 'text-orange-500'
                        : 'text-blue-500'
                  }`}>
                  {anomaly.severity === 'high' ? '高' : anomaly.severity === 'medium' ? '中' : '低'}
                </Text>
              </View>
            </View>

            <View className="space-y-2 bg-gray-50/30 rounded-lg p-3">
              <View className="flex justify-between items-center">
                <Text className="text-sm text-muted-foreground">实际值</Text>
                <Text className="text-sm font-semibold text-foreground">{anomaly.value.toFixed(2)}</Text>
              </View>

              <View className="flex justify-between items-center">
                <Text className="text-sm text-muted-foreground">期望值</Text>
                <Text className="text-sm font-semibold text-foreground">{anomaly.expected.toFixed(2)}</Text>
              </View>

              <View className="flex justify-between items-center pt-2 border-t border-border">
                <Text className="text-sm text-muted-foreground">偏差率</Text>
                <Text className="text-sm font-bold text-red-500">
                  {anomaly.deviation > 0 ? '+' : ''}
                  {anomaly.deviation.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    )
  }

  // 渲染内容区域
  const renderContent = () => {
    if (loading) {
      return <SkeletonList count={5} />
    }

    if (!analytics) {
      return <EmptyState icon="i-mdi-chart-line" title="暂无数据" description="请点击刷新分析按钮获取数据" />
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab()
      case 'revenue':
        return renderRevenueTab()
      case 'cost':
        return renderCostTab()
      case 'efficiency':
        return renderEfficiencyTab()
      case 'schedule':
        return renderScheduleTab()
      case 'trend':
        return renderTrendTab()
      case 'anomaly':
        return renderAnomalyTab()
      default:
        return null
    }
  }

  return (
    <View className="bg-gray-50" style={{minHeight: '100vh'}}>
      <ScrollView
        scrollY
        className="h-screen box-border bg-transparent"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="pb-4">
          {/* 筛选条件 */}
          <View className="bg-white p-4 mb-4 shadow-sm">
            <View className="grid grid-cols-2 gap-3">
              <View>
                <Text className="text-sm text-muted-foreground mb-2">选择店铺</Text>
                <Picker
                  mode="selector"
                  range={stores.map((s) => s.name)}
                  value={selectedStoreIndex}
                  onChange={handleStoreChange}>
                  <View className="bg-input border border-border rounded px-3 py-2">
                    <Text className="text-foreground text-sm">{stores[selectedStoreIndex]?.name || '请选择'}</Text>
                  </View>
                </Picker>
              </View>

              <View>
                <Text className="text-sm text-muted-foreground mb-2">分析周期</Text>
                <Picker
                  mode="selector"
                  range={['7天', '30天', '90天']}
                  value={days === 7 ? 0 : days === 30 ? 1 : 2}
                  onChange={handleDaysChange}>
                  <View className="bg-input border border-border rounded px-3 py-2">
                    <Text className="text-foreground text-sm">{days}天</Text>
                  </View>
                </Picker>
              </View>
            </View>
          </View>

          {/* Tab导航 */}
          <View className="bg-white px-2 py-3 mb-4 shadow-sm">
            <ScrollView scrollX className="box-border">
              <View className="flex flex-row gap-2">
                {tabs.map((tab) => (
                  <View
                    key={tab.key}
                    className={`px-4 py-2 rounded-full flex flex-row items-center gap-2 ${
                      activeTab === tab.key ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => setActiveTab(tab.key as TabType)}>
                    <View className={`${tab.icon} text-base`} />
                    <Text
                      className={`text-sm font-medium whitespace-nowrap ${
                        activeTab === tab.key ? 'text-white' : 'text-muted-foreground'
                      }`}>
                      {tab.label}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 内容区域 */}
          <View className="px-4">{renderContent()}</View>

          {/* 刷新按钮 */}
          <View className="px-4 mt-4">
            <Button
              className="w-full bg-blue-100 text-white py-3 rounded break-keep text-base"
              size="default"
              onClick={loadAnalytics}
              disabled={loading}>
              {loading ? '分析中...' : '刷新分析'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
