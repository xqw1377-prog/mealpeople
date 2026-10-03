import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getStoresByTenantId} from '@/db/api'
import type {Store} from '@/db/types'
import type {RiskAlert} from '@/services/risk'
import {riskWarningService} from '@/services/risk'
import {useTenantStore} from '@/store/tenant'

export default function RiskAlerts() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [risks, setRisks] = useState<RiskAlert[]>([])
  const [filterType, setFilterType] = useState<'all' | 'personnel' | 'cost' | 'schedule'>('all')
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'low'>('all')

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

  // 加载风险预警
  const loadRisks = useCallback(async () => {
    if (!currentTenant?.id) return

    setLoading(true)
    try {
      const storeId = stores[selectedStoreIndex]?.id === 'all' ? undefined : stores[selectedStoreIndex]?.id

      const result = await riskWarningService.detectRisks(currentTenant.id, storeId)
      const allRisks = [...result.highRisks, ...result.mediumRisks, ...result.lowRisks]
      setRisks(allRisks)
    } catch (error) {
      console.error('加载风险预警失败:', error)
      Taro.showToast({title: '加载失败，请重试', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [stores, selectedStoreIndex, currentTenant?.id])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  useEffect(() => {
    if (stores.length > 0) {
      loadRisks()
    }
  }, [stores, loadRisks])

  useDidShow(() => {
    loadStores()
  })

  // 店铺选择
  const handleStoreChange = useCallback((e) => {
    setSelectedStoreIndex(Number.parseInt(e.detail.value, 10))
  }, [])

  // 获取过滤后的风险列表
  const filteredRisks = risks.filter((risk) => {
    if (filterType !== 'all' && risk.type !== filterType) return false
    if (filterSeverity !== 'all' && risk.severity !== filterSeverity) return false
    return true
  })

  // 获取严重程度颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  // 获取严重程度文本
  const getSeverityText = (severity: string) => {
    switch (severity) {
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

  // 获取风险类型文本
  const getTypeText = (type: string) => {
    switch (type) {
      case 'personnel':
        return '人员风险'
      case 'cost':
        return '成本风险'
      case 'schedule':
        return '排班风险'
      default:
        return '未知风险'
    }
  }

  // 获取风险类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personnel':
        return 'i-mdi-account-alert'
      case 'cost':
        return 'i-mdi-currency-usd-off'
      case 'schedule':
        return 'i-mdi-calendar-alert'
      default:
        return 'i-mdi-alert'
    }
  }

  // 统计数据
  const stats = {
    total: risks.length,
    high: risks.filter((r) => r.severity === 'high').length,
    medium: risks.filter((r) => r.severity === 'medium').length,
    low: risks.filter((r) => r.severity === 'low').length
  }

  return (
    <View className="bg-gray-50" style={{minHeight: '100vh'}}>
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          {/* 2.0标识 */}
          <View className="mb-4 flex items-center justify-center">
            <View className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium">2.0 智能风险预警</Text>
            </View>
          </View>

          {/* 店铺选择 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
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

          {/* 统计卡片 */}
          <View className="grid grid-cols-4 gap-2 mb-4">
            <View className="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm">
              <Text className="text-2xl font-bold text-foreground">{stats.total}</Text>
              <Text className="text-xs text-muted-foreground mt-1">总风险</Text>
            </View>
            <View className="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm">
              <Text className="text-2xl font-bold text-red-500">{stats.high}</Text>
              <Text className="text-xs text-muted-foreground mt-1">高风险</Text>
            </View>
            <View className="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm">
              <Text className="text-2xl font-bold text-orange-500">{stats.medium}</Text>
              <Text className="text-xs text-muted-foreground mt-1">中风险</Text>
            </View>
            <View className="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm">
              <Text className="text-2xl font-bold text-blue-500">{stats.low}</Text>
              <Text className="text-xs text-muted-foreground mt-1">低风险</Text>
            </View>
          </View>

          {/* 筛选器 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-medium text-foreground mb-3">筛选条件</Text>

            <View className="flex flex-wrap gap-2 mb-3">
              <Text className="text-xs text-muted-foreground w-full mb-1">风险类型</Text>
              <View
                className={`px-3 py-1 rounded-full text-xs ${filterType === 'all' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setFilterType('all')}>
                <Text>全部</Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full text-xs ${filterType === 'personnel' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setFilterType('personnel')}>
                <Text>人员</Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full text-xs ${filterType === 'cost' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setFilterType('cost')}>
                <Text>成本</Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full text-xs ${filterType === 'schedule' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setFilterType('schedule')}>
                <Text>排班</Text>
              </View>
            </View>

            <View className="flex flex-wrap gap-2">
              <Text className="text-xs text-muted-foreground w-full mb-1">严重程度</Text>
              <View
                className={`px-3 py-1 rounded-full text-xs ${filterSeverity === 'all' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setFilterSeverity('all')}>
                <Text>全部</Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full text-xs ${filterSeverity === 'high' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setFilterSeverity('high')}>
                <Text>高</Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full text-xs ${filterSeverity === 'medium' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setFilterSeverity('medium')}>
                <Text>中</Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full text-xs ${filterSeverity === 'low' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setFilterSeverity('low')}>
                <Text>低</Text>
              </View>
            </View>
          </View>

          {/* 风险列表 */}
          {loading ? (
            <View className="flex items-center justify-center py-12">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredRisks.length > 0 ? (
            <View className="space-y-3">
              {filteredRisks.map((risk) => (
                <View key={risk.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex items-center gap-2">
                      <View className={`${getTypeIcon(risk.type)} text-xl text-blue-600`} />
                      <Text className="text-base font-medium text-foreground">{getTypeText(risk.type)}</Text>
                    </View>
                    <View className={`${getSeverityColor(risk.severity)} text-white px-2 py-1 rounded text-xs`}>
                      <Text>{getSeverityText(risk.severity)}</Text>
                    </View>
                  </View>

                  <Text className="text-sm text-foreground mb-2">{risk.description}</Text>

                  {risk.suggestion && (
                    <View className="bg-blue-100 rounded p-3 mt-2">
                      <Text className="text-xs text-muted-foreground mb-1">建议措施</Text>
                      <Text className="text-sm text-blue-600">{risk.suggestion}</Text>
                    </View>
                  )}

                  <View className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <Text className="text-xs text-muted-foreground">
                      检测时间：{new Date(risk.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="flex flex-col items-center justify-center py-12">
              <View className="i-mdi-shield-check text-6xl text-green-500/30 mb-4" />
              <Text className="text-muted-foreground">暂无风险预警</Text>
              <Text className="text-xs text-muted-foreground mt-2">系统运行正常</Text>
            </View>
          )}

          {/* 刷新按钮 */}
          <View className="mt-4">
            <Button
              className="w-full bg-blue-100 text-white py-3 rounded break-keep text-base"
              size="default"
              onClick={loadRisks}
              disabled={loading}>
              {loading ? '刷新中...' : '刷新数据'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
