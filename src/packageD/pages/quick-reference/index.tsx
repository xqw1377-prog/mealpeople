import {Picker, ScrollView, Text, View} from '@tarojs/components'
import {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {calculateRevenueZone, getStoreEfficiencyStandard, getStoresByTenantId} from '@/db/api'
import type {EfficiencyStandard, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

interface QuickReferenceRow {
  revenue: number
  zone: string
  zoneName: string
  standard: number
  targetWorkHours: number
  motto: string
}

// 辅助函数
function getZoneName(zone: 'low' | 'normal' | 'high'): string {
  const names = {
    low: '低营收区',
    normal: '正常区',
    high: '高营收区'
  }
  return names[zone]
}

function calculateTargetWorkHours(revenue: number, efficiency: number): number {
  return efficiency > 0 ? Math.round(revenue / efficiency) : 0
}

export default function QuickReference() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [standard, setStandard] = useState<EfficiencyStandard | null>(null)
  const [referenceData, setReferenceData] = useState<QuickReferenceRow[]>([])

  // 加载店铺列表
  const loadStores = useCallback(async () => {
    if (!currentTenant?.id) return
    const storeList = await getStoresByTenantId(currentTenant?.id)
    setStores(storeList)
  }, [currentTenant?.id])

  // 加载效能标准
  const loadStandard = useCallback(async () => {
    if (!currentTenant?.id || !stores[selectedStoreIndex]?.id) return

    setLoading(true)
    try {
      const config = await getStoreEfficiencyStandard(currentTenant?.id, stores[selectedStoreIndex].id)
      setStandard(config)

      if (config) {
        // 生成速查表数据
        const data: QuickReferenceRow[] = []
        const revenues = [
          5000, 8000, 10000, 12000, 14000, 16000, 18000, 20000, 22000, 25000, 28000, 30000, 35000, 40000, 45000, 50000
        ]

        for (const revenue of revenues) {
          const info = calculateRevenueZone(revenue, config)
          data.push({
            revenue,
            zone: info.zone,
            zoneName: getZoneName(info.zone),
            standard: info.efficiency,
            targetWorkHours: calculateTargetWorkHours(revenue, info.efficiency),
            motto: info.motto
          })
        }

        setReferenceData(data)
      }
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, stores, selectedStoreIndex])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  useEffect(() => {
    if (stores.length > 0) {
      loadStandard()
    }
  }, [stores, loadStandard])

  useDidShow(() => {
    loadStores()
  })

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'low':
        return 'text-red-600'
      case 'normal':
        return 'text-muted-foreground'
      case 'high':
        return 'text-muted-foreground'
      default:
        return 'text-muted-foreground'
    }
  }

  const getZoneBgColor = (zone: string) => {
    switch (zone) {
      case 'low':
        return 'bg-blue-100'
      case 'normal':
        return 'bg-blue-100'
      case 'high':
        return 'bg-blue-100'
      default:
        return 'bg-gray-50'
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="bg-transparent">
        <View className="p-4">
          {/* 店铺选择 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm text-muted-foreground mb-2">选择店铺</Text>
            <Picker
              mode="selector"
              range={stores.map((s) => s.name)}
              value={selectedStoreIndex}
              onChange={(e) => setSelectedStoreIndex(Number(e.detail.value))}>
              <View className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <Text className="text-foreground">{stores[selectedStoreIndex]?.name || '请选择店铺'}</Text>
                <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
              </View>
            </Picker>
          </View>

          {loading ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : standard ? (
            <>
              {/* 效能标准概览 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <View className="flex items-center mb-3">
                  <View className="i-mdi-information text-2xl text-blue-500 mr-2" />
                  <Text className="text-base font-semibold text-foreground">效能标准概览</Text>
                </View>

                <View className="space-y-2">
                  <View className="bg-blue-100 rounded-lg p-3">
                    <View className="flex items-center justify-between mb-1">
                      <Text className="text-sm font-semibold text-red-600">低营收区</Text>
                      <Text className="text-sm text-red-600">&lt; ¥{standard.low_revenue_max.toLocaleString()}</Text>
                    </View>
                    <Text className="text-xs text-red-600">标准：{standard.low_efficiency_standard}元/人/日</Text>
                  </View>

                  <View className="bg-blue-100 rounded-lg p-3">
                    <View className="flex items-center justify-between mb-1">
                      <Text className="text-sm font-semibold text-blue-600">正常营收区</Text>
                      <Text className="text-sm text-muted-foreground">
                        ¥{standard.normal_revenue_min.toLocaleString()} ~ ¥
                        {standard.normal_revenue_max.toLocaleString()}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">
                      标准：{standard.normal_efficiency_standard}元/人/日
                    </Text>
                  </View>

                  <View className="bg-blue-100 rounded-lg p-3">
                    <View className="flex items-center justify-between mb-1">
                      <Text className="text-sm font-semibold text-green-600">高营收区</Text>
                      <Text className="text-sm text-muted-foreground">
                        ≥ ¥{standard.high_revenue_min.toLocaleString()}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">
                      标准：{standard.high_efficiency_standard}元/人/日
                    </Text>
                  </View>
                </View>
              </View>

              {/* 速查表 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <View className="flex items-center mb-3">
                  <View className="i-mdi-table text-2xl text-green-500 mr-2" />
                  <Text className="text-base font-semibold text-foreground">排班速查表</Text>
                </View>

                {/* 表头 */}
                <View className="flex bg-muted rounded-t-lg p-2 border-b border-border">
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground text-center">预估营收</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground text-center">所属区间</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground text-center">效能标准</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-foreground text-center">目标工时</Text>
                  </View>
                </View>

                {/* 表格内容 */}
                {referenceData.map((row, index) => (
                  <View key={index} className={`flex p-2 border-b border-border ${getZoneBgColor(row.zone)}`}>
                    <View className="flex-1">
                      <Text className="text-xs text-foreground text-center">¥{row.revenue.toLocaleString()}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`text-xs font-semibold text-center ${getZoneColor(row.zone)}`}>
                        {row.zoneName}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-foreground text-center">{row.standard}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-muted-foreground text-center">
                        {row.targetWorkHours}h
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* 使用说明 */}
              <View className="bg-blue-100 rounded-lg p-4 mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">📖 使用说明</Text>
                <View className="mb-1">
                  <Text className="text-xs text-foreground">1. 根据预估营收查找对应行</Text>
                </View>
                <View className="mb-1">
                  <Text className="text-xs text-foreground">2. 查看所属区间和效能标准</Text>
                </View>
                <View className="mb-1">
                  <Text className="text-xs text-foreground">3. 目标工时 = 预估营收 ÷ 效能标准</Text>
                </View>
                <View>
                  <Text className="text-xs text-foreground">4. 排班总工时不得超过目标工时</Text>
                </View>
              </View>

              {/* 管理口令 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <View className="flex items-center mb-3">
                  <View className="i-mdi-message-text text-2xl text-purple-500 mr-2" />
                  <Text className="text-base font-semibold text-foreground">管理口令</Text>
                </View>

                <View className="space-y-2">
                  <View className="bg-blue-100 rounded-lg p-3">
                    <Text className="text-sm font-semibold text-red-600 mb-1">低营收区</Text>
                    <Text className="text-sm text-red-600">{standard.low_management_motto}</Text>
                  </View>

                  <View className="bg-blue-100 rounded-lg p-3">
                    <Text className="text-sm font-semibold text-blue-600 mb-1">正常营收区</Text>
                    <Text className="text-sm text-muted-foreground">{standard.normal_management_motto}</Text>
                  </View>

                  <View className="bg-blue-100 rounded-lg p-3">
                    <Text className="text-sm font-semibold text-green-600 mb-1">高营收区</Text>
                    <Text className="text-sm text-muted-foreground">{standard.high_management_motto}</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View className="bg-blue-100 rounded-lg p-6 text-center">
              <View className="i-mdi-alert-circle text-4xl text-yellow-600 mb-3" />
              <Text className="text-foreground">暂无效能标准配置</Text>
              <Text className="text-sm text-muted-foreground mt-2">请先在"效能标准配置"页面进行配置</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
