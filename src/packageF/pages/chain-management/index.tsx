import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import type {ChainComparison, StaffTransferSuggestion, StoreDataSummary} from '@/services/chain'
import {chainManagementService} from '@/services/chain'
import {useTenantStore} from '@/store/tenant'

export default function ChainManagement() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'comparison' | 'transfer'>('summary')

  // 数据状态
  const [storeSummaries, setStoreSummaries] = useState<StoreDataSummary[]>([])
  const [comparisons, setComparisons] = useState<ChainComparison[]>([])
  const [transferSuggestions, setTransferSuggestions] = useState<StaffTransferSuggestion[]>([])

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant?.id) return

    setLoading(true)
    try {
      const [summaries, comparisonData, suggestions] = await Promise.all([
        chainManagementService.getStoresSummary(currentTenant.id, 30),
        chainManagementService.compareStores(currentTenant.id, 30),
        chainManagementService.generateTransferSuggestions(currentTenant.id, 30)
      ])

      setStoreSummaries(summaries)
      setComparisons(comparisonData)
      setTransferSuggestions(suggestions)

      Taro.showToast({title: '加载完成', icon: 'success'})
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({title: '加载失败，请重试', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-blue-100'
      case 'medium':
        return 'bg-blue-100'
      case 'low':
        return 'bg-blue-100'
      default:
        return 'bg-gray-50'
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
    <View
      className="bg-gray-50"
      style={{
        minHeight: '100vh'
      }}>
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 2.0标识 */}
          <View className="mb-4 flex items-center justify-center">
            <View className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium">2.0 连锁店协同管理</Text>
            </View>
          </View>

          {/* 标签页切换 */}
          <View className="bg-white rounded-lg p-2 mb-4 shadow-sm flex gap-2 border-2 border-gray-200">
            <View
              className={`flex-1 py-2 rounded text-center ${activeTab === 'summary' ? 'bg-green-500 text-white' : 'bg-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('summary')}>
              <Text className="text-sm font-medium">店铺汇总</Text>
            </View>
            <View
              className={`flex-1 py-2 rounded text-center ${activeTab === 'comparison' ? 'bg-green-500 text-white' : 'bg-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('comparison')}>
              <Text className="text-sm font-medium">对比分析</Text>
            </View>
            <View
              className={`flex-1 py-2 rounded text-center ${activeTab === 'transfer' ? 'bg-green-500 text-white' : 'bg-transparent text-muted-foreground'}`}
              onClick={() => setActiveTab('transfer')}>
              <Text className="text-sm font-medium">人员调配</Text>
            </View>
          </View>

          {loading ? (
            <View className="flex items-center justify-center py-12">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : (
            <>
              {/* 店铺汇总 */}
              {activeTab === 'summary' && (
                <View className="space-y-3">
                  {storeSummaries.length > 0 ? (
                    storeSummaries.map((store) => (
                      <View key={store.storeId} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                        <Text className="text-lg font-semibold text-foreground mb-4">{store.storeName}</Text>

                        <View className="grid grid-cols-2 gap-3">
                          {/* 营收数据 */}
                          <View className="bg-gray-50/30 rounded p-3">
                            <Text className="text-xs text-muted-foreground mb-1">总营收</Text>
                            <Text className="text-lg font-bold text-blue-600">¥{store.totalRevenue.toFixed(0)}</Text>
                            <Text className="text-xs text-muted-foreground mt-1">
                              增长 {store.revenueGrowth > 0 ? '+' : ''}
                              {store.revenueGrowth.toFixed(1)}%
                            </Text>
                          </View>

                          {/* 成本数据 */}
                          <View className="bg-gray-50/30 rounded p-3">
                            <Text className="text-xs text-muted-foreground mb-1">成本占比</Text>
                            <Text className="text-lg font-bold text-foreground">{store.costRatio.toFixed(1)}%</Text>
                            <Text className="text-xs text-muted-foreground mt-1">¥{store.totalCost.toFixed(0)}</Text>
                          </View>

                          {/* 人员数据 */}
                          <View className="bg-gray-50/30 rounded p-3">
                            <Text className="text-xs text-muted-foreground mb-1">员工数量</Text>
                            <Text className="text-lg font-bold text-foreground">{store.employeeCount} 人</Text>
                            <Text className="text-xs text-muted-foreground mt-1">
                              效率 {store.avgEfficiency.toFixed(1)}
                            </Text>
                          </View>

                          {/* 排班数据 */}
                          <View className="bg-gray-50/30 rounded p-3">
                            <Text className="text-xs text-muted-foreground mb-1">排班完成率</Text>
                            <Text className="text-lg font-bold text-foreground">
                              {store.completionRate.toFixed(1)}%
                            </Text>
                            <Text className="text-xs text-muted-foreground mt-1">
                              优秀率 {store.excellentRate.toFixed(1)}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="flex flex-col items-center justify-center py-12">
                      <View className="i-mdi-store text-6xl text-muted-foreground/30 mb-4" />
                      <Text className="text-muted-foreground">暂无店铺数据</Text>
                    </View>
                  )}
                </View>
              )}

              {/* 对比分析 */}
              {activeTab === 'comparison' && (
                <View className="space-y-3">
                  {comparisons.length > 0 ? (
                    comparisons.map((comparison) => (
                      <View
                        key={comparison.metric}
                        className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                        <Text className="text-lg font-semibold text-foreground mb-4">{comparison.metric}</Text>

                        {/* 平均值 */}
                        <View className="bg-blue-100 rounded p-3 mb-3">
                          <View className="flex justify-between items-center">
                            <Text className="text-sm text-muted-foreground">平均值</Text>
                            <Text className="text-lg font-bold text-blue-600">{comparison.average.toFixed(2)}</Text>
                          </View>
                        </View>

                        {/* 最佳和最差 */}
                        <View className="grid grid-cols-2 gap-3 mb-3">
                          <View className="bg-blue-100 rounded p-3">
                            <Text className="text-xs text-muted-foreground mb-1">最佳</Text>
                            <Text className="text-sm font-medium text-foreground mb-1">
                              {comparison.best.storeName}
                            </Text>
                            <Text className="text-lg font-bold text-green-500">{comparison.best.value.toFixed(2)}</Text>
                          </View>

                          <View className="bg-blue-100 rounded p-3">
                            <Text className="text-xs text-muted-foreground mb-1">最差</Text>
                            <Text className="text-sm font-medium text-foreground mb-1">
                              {comparison.worst.storeName}
                            </Text>
                            <Text className="text-lg font-bold text-red-500">{comparison.worst.value.toFixed(2)}</Text>
                          </View>
                        </View>

                        {/* 排名列表 */}
                        <View className="space-y-2">
                          {comparison.stores.map((store) => (
                            <View
                              key={store.storeId}
                              className="flex items-center justify-between bg-gray-50/30 rounded p-2">
                              <View className="flex items-center gap-2">
                                <Text className="text-sm font-medium text-blue-600">#{store.rank}</Text>
                                <Text className="text-sm text-foreground">{store.storeName}</Text>
                              </View>
                              <Text className="text-sm font-semibold text-foreground">{store.value.toFixed(2)}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="flex flex-col items-center justify-center py-12">
                      <View className="i-mdi-chart-bar text-6xl text-muted-foreground/30 mb-4" />
                      <Text className="text-muted-foreground">暂无对比数据</Text>
                    </View>
                  )}
                </View>
              )}

              {/* 人员调配建议 */}
              {activeTab === 'transfer' && (
                <View className="space-y-3">
                  {transferSuggestions.length > 0 ? (
                    transferSuggestions.map((suggestion) => (
                      <View key={suggestion.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                        <View className="flex justify-between items-start mb-3">
                          <Text className="text-base font-semibold text-foreground flex-1">人员调配建议</Text>
                          <View
                            className={`${getPriorityColor(suggestion.priority)} text-white px-2 py-1 rounded text-xs`}>
                            <Text>{getPriorityText(suggestion.priority)}</Text>
                          </View>
                        </View>

                        {/* 调配方向 */}
                        <View className="bg-gray-50/30 rounded p-3 mb-3">
                          <View className="flex items-center justify-between">
                            <View className="flex-1">
                              <Text className="text-xs text-muted-foreground mb-1">来源店铺</Text>
                              <Text className="text-sm font-medium text-foreground">{suggestion.fromStore.name}</Text>
                            </View>
                            <View className="i-mdi-arrow-right text-2xl text-blue-600 mx-2" />
                            <View className="flex-1">
                              <Text className="text-xs text-muted-foreground mb-1">目标店铺</Text>
                              <Text className="text-sm font-medium text-foreground">{suggestion.toStore.name}</Text>
                            </View>
                          </View>
                        </View>

                        {/* 调配人员 */}
                        <View className="mb-3">
                          <Text className="text-sm text-muted-foreground mb-2">建议调配人员</Text>
                          <View className="space-y-2">
                            {suggestion.employees.map((emp) => (
                              <View key={emp.id} className="bg-gray-50/30 rounded p-2">
                                <View className="flex justify-between items-start mb-1">
                                  <Text className="text-sm font-medium text-foreground">{emp.name}</Text>
                                  <Text className="text-xs text-muted-foreground">{emp.position}</Text>
                                </View>
                                <Text className="text-xs text-muted-foreground">{emp.reason}</Text>
                              </View>
                            ))}
                          </View>
                        </View>

                        {/* 调配原因 */}
                        <View className="bg-gray-50/30 rounded p-3 mb-3">
                          <Text className="text-xs text-muted-foreground mb-1">调配原因</Text>
                          <Text className="text-sm text-foreground">{suggestion.reason}</Text>
                        </View>

                        {/* 预期收益 */}
                        <View className="bg-blue-100 rounded p-3">
                          <Text className="text-xs text-muted-foreground mb-1">预期收益</Text>
                          <Text className="text-sm text-blue-600">{suggestion.expectedBenefit}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="flex flex-col items-center justify-center py-12">
                      <View className="i-mdi-account-switch text-6xl text-muted-foreground/30 mb-4" />
                      <Text className="text-muted-foreground">暂无调配建议</Text>
                      <Text className="text-xs text-muted-foreground mt-2">当前人员配置合理</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {/* 刷新按钮 */}
          <View className="mt-4">
            <Button
              className="w-full bg-blue-100 text-white py-3 rounded break-keep text-base"
              size="default"
              onClick={loadData}
              disabled={loading}>
              {loading ? '加载中...' : '刷新数据'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
