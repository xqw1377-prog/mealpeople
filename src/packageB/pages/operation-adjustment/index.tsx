import {Button, Input, Picker, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {
  calculateRevenueZone,
  getDailyOperation,
  getStoreEfficiencyStandard,
  getStoresByTenantId,
  upsertDailyOperation
} from '@/db/api'
import type {DailyOperation, EfficiencyStandard, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

export default function OperationAdjustment() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)
  const setCurrentStore = useTenantStore((state) => state.setCurrentStore)
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [middayEstimatedRevenue, setMiddayEstimatedRevenue] = useState('')
  const [adjustedStaffCount, setAdjustedStaffCount] = useState('')
  const [adjustedRestCount, setAdjustedRestCount] = useState('') // 添加调整后排休人数
  const [adjustedPartTimeHours, setAdjustedPartTimeHours] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [standard, setStandard] = useState<EfficiencyStandard | null>(null)
  const [operation, setOperation] = useState<DailyOperation | null>(null)
  const [originalZoneInfo, setOriginalZoneInfo] = useState<any>(null)
  const [newZoneInfo, setNewZoneInfo] = useState<any>(null)

  // 加载店铺列表
  const loadStores = useCallback(async () => {
    if (!currentTenant?.id) return
    const storeList = await getStoresByTenantId(currentTenant?.id)
    setStores(storeList)

    // 同步首页的门店选择
    if (storeList.length > 0) {
      if (currentStore) {
        // 如果首页已选择门店，同步到这里
        const index = storeList.findIndex((s) => s.id === currentStore.id)
        if (index >= 0) {
          setSelectedStoreIndex(index)
        } else {
          // 如果首页选择的门店不在列表中，选择第一个
          setSelectedStoreIndex(0)
          setCurrentStore(storeList[0])
        }
      } else {
        // 如果首页没有选择门店，选择第一个并同步到首页
        setSelectedStoreIndex(0)
        setCurrentStore(storeList[0])
      }
    }
  }, [currentTenant?.id, currentStore, setCurrentStore])

  // 加载效能标准
  const loadStandard = useCallback(async () => {
    if (!currentTenant?.id || !stores[selectedStoreIndex]?.id) return
    const config = await getStoreEfficiencyStandard(currentTenant?.id, stores[selectedStoreIndex].id)
    setStandard(config)
  }, [currentTenant?.id, stores, selectedStoreIndex])

  // 加载运营记录
  const loadOperation = useCallback(async () => {
    if (!currentTenant?.id || !stores[selectedStoreIndex]?.id || !selectedDate) return

    setLoading(true)
    try {
      const op = await getDailyOperation(currentTenant?.id, stores[selectedStoreIndex].id, selectedDate)
      setOperation(op)

      if (op) {
        setMiddayEstimatedRevenue(op.midday_estimated_revenue?.toString() || '')
        setAdjustedStaffCount(op.adjusted_staff_count?.toString() || '')
        setAdjustedPartTimeHours(op.adjusted_part_time_hours?.toString() || '')

        // 计算原始区间信息
        if (op.estimated_revenue && standard) {
          const info = calculateRevenueZone(op.estimated_revenue, standard)
          setOriginalZoneInfo(info)
        }
      } else {
        setMiddayEstimatedRevenue('')
        setAdjustedStaffCount('')
        setAdjustedPartTimeHours('')
        setOriginalZoneInfo(null)
      }
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, stores, selectedStoreIndex, selectedDate, standard])

  // 计算新的营收区间信息
  useEffect(() => {
    if (middayEstimatedRevenue && standard) {
      const revenue = Number(middayEstimatedRevenue)
      if (revenue > 0) {
        const info = calculateRevenueZone(revenue, standard)
        setNewZoneInfo(info)
      } else {
        setNewZoneInfo(null)
      }
    } else {
      setNewZoneInfo(null)
    }
  }, [middayEstimatedRevenue, standard])

  // 保存调整
  const handleSave = async () => {
    if (!currentTenant?.id || !stores[selectedStoreIndex]?.id || !operation) return

    if (!middayEstimatedRevenue || !adjustedStaffCount) {
      Taro.showToast({title: '请填写完整信息', icon: 'none'})
      return
    }

    const revenue = Number(middayEstimatedRevenue)
    const staffCount = Number(adjustedStaffCount)
    const restCount = adjustedRestCount ? Number(adjustedRestCount) : 0 // 获取排休人数
    const partTimeHours = adjustedPartTimeHours ? Number(adjustedPartTimeHours) : 0

    if (revenue <= 0 || staffCount <= 0) {
      Taro.showToast({title: '请输入有效的数值', icon: 'none'})
      return
    }

    setSaving(true)
    try {
      const result = await upsertDailyOperation({
        ...operation,
        midday_estimated_revenue: revenue,
        adjusted_staff_count: staffCount,
        adjusted_rest_count: restCount, // 保存调整后排休人数
        adjusted_part_time_hours: partTimeHours || null
      })

      if (result) {
        Taro.showToast({title: '保存成功', icon: 'success'})

        // 🔥 触发数据更新事件，通知首页刷新仪表盘
        console.log('=== 营业调整保存成功，触发数据更新事件 ===')
        Taro.eventCenter.trigger('scheduleDataUpdated', {
          source: 'operation-adjustment',
          timestamp: Date.now()
        })
      } else {
        Taro.showToast({title: '保存失败', icon: 'error'})
      }
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    loadStores()
  }, [loadStores])

  useEffect(() => {
    if (stores.length > 0) {
      loadStandard()
    }
  }, [stores, loadStandard])

  useEffect(() => {
    if (standard) {
      loadOperation()
    }
  }, [standard, loadOperation])

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
      <View className="p-4">
        {/* 店铺和日期选择 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
          <View className="mb-3">
            <Text className="text-sm text-muted-foreground mb-2">选择店铺</Text>
            <Picker
              mode="selector"
              range={stores.map((s) => s.name)}
              value={selectedStoreIndex}
              onChange={(e) => {
                const newIndex = Number(e.detail.value)
                setSelectedStoreIndex(newIndex)
                // 同步到首页
                if (stores[newIndex]) {
                  setCurrentStore(stores[newIndex])
                }
              }}>
              <View className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <Text className="text-foreground">{stores[selectedStoreIndex]?.name || '请选择店铺'}</Text>
                <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
              </View>
            </Picker>
          </View>

          <View>
            <Text className="text-sm text-muted-foreground mb-2">选择日期</Text>
            <Picker mode="date" value={selectedDate} onChange={(e) => setSelectedDate(e.detail.value)}>
              <View className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <Text className="text-foreground">{selectedDate}</Text>
                <View className="i-mdi-calendar text-xl text-muted-foreground" />
              </View>
            </Picker>
          </View>
        </View>

        {loading ? (
          <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
            <Text className="text-muted-foreground">加载中...</Text>
          </View>
        ) : !operation ? (
          <View className="bg-blue-100 rounded-lg p-6 text-center">
            <View className="i-mdi-alert-circle text-4xl text-yellow-600 mb-3" />
            <Text className="text-foreground">该日期暂无排班规划记录</Text>
            <Text className="text-sm text-muted-foreground mt-2">请先在"排班规划"页面创建规划</Text>
          </View>
        ) : (
          <>
            {/* 早班规划信息 */}
            {originalZoneInfo && (
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <View className="flex items-center mb-3">
                  <View className="i-mdi-weather-sunny text-2xl text-orange-500 mr-2" />
                  <Text className="text-base font-semibold text-foreground">早班规划</Text>
                </View>

                <View className="space-y-2">
                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">预估营收</Text>
                    <Text className="text-base font-semibold text-foreground">
                      ¥{operation.estimated_revenue?.toLocaleString()}
                    </Text>
                  </View>

                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">所属区间</Text>
                    <Text className={`text-base font-semibold ${getZoneColor(originalZoneInfo.zone)}`}>
                      {originalZoneInfo.zoneName}
                    </Text>
                  </View>

                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">计划正式工</Text>
                    <Text className="text-base font-semibold text-foreground">
                      {operation.planned_staff_count || 0}人
                    </Text>
                  </View>

                  {operation.planned_part_time_hours && operation.planned_part_time_hours > 0 && (
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">计划兼职工时</Text>
                      <Text className="text-base font-semibold text-foreground">
                        {operation.planned_part_time_hours}小时
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 午市后预估 */}
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <View className="flex items-center mb-3">
                <View className="i-mdi-update text-2xl text-blue-500 mr-2" />
                <Text className="text-base font-semibold text-foreground">午市后预估</Text>
              </View>

              <View className="mb-2">
                <Text className="text-sm text-muted-foreground mb-2">全天营收预估（元）</Text>
                <Input
                  type="digit"
                  value={middayEstimatedRevenue}
                  onInput={(e) => setMiddayEstimatedRevenue(e.detail.value)}
                  placeholder="请输入午市后的全天营收预估"
                  className="border border-border rounded-lg p-3 bg-muted text-lg"
                />
              </View>

              {middayEstimatedRevenue && (
                <View className="bg-blue-100 rounded-lg p-3 mt-3">
                  <Text className="text-sm text-blue-600">
                    💡 午市后预估：¥{Number(middayEstimatedRevenue).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            {/* 标准切换提示 */}
            {newZoneInfo && originalZoneInfo && newZoneInfo.zone !== originalZoneInfo.zone && (
              <View className="bg-blue-100 rounded-lg p-4 mb-4">
                <View className="flex items-center mb-2">
                  <View className="i-mdi-alert text-2xl text-muted-foreground mr-2" />
                  <Text className="text-base font-semibold text-orange-600">标准切换提醒</Text>
                </View>
                <Text className="text-sm text-orange-600">
                  营收区间从 {originalZoneInfo.zoneName} 切换到 {newZoneInfo.zoneName}
                </Text>
                <Text className="text-sm text-orange-600 mt-1">
                  效能标准从 {originalZoneInfo.efficiencyStandard}元/人/日 调整为 {newZoneInfo.efficiencyStandard}
                  元/人/日
                </Text>
              </View>
            )}

            {/* 新的区间信息 */}
            {newZoneInfo && (
              <View className={`rounded-lg p-4 mb-4 shadow-sm ${getZoneBgColor(newZoneInfo.zone)}`}>
                <View className="flex items-center mb-3">
                  <View className="i-mdi-chart-line text-2xl text-foreground mr-2" />
                  <Text className="text-base font-semibold text-foreground">新的标准</Text>
                </View>

                <View className="space-y-3">
                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">所属区间</Text>
                    <Text className={`text-base font-semibold ${getZoneColor(newZoneInfo.zone)}`}>
                      {newZoneInfo.zoneName}
                    </Text>
                  </View>

                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">效能标准</Text>
                    <Text className="text-base font-semibold text-foreground">
                      {newZoneInfo.efficiencyStandard}元/人/日
                    </Text>
                  </View>

                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">新目标工时</Text>
                    <Text className="text-lg font-bold text-muted-foreground">{newZoneInfo.targetWorkHours}小时</Text>
                  </View>

                  <View className="bg-white bg-opacity-70 rounded-lg p-3 border-2 border-gray-200 mt-2">
                    <Text className="text-sm font-semibold text-foreground mb-1">管理口令</Text>
                    <Text className="text-base text-foreground">{newZoneInfo.managementMotto}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 快速排休 */}
            {newZoneInfo && (
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <View className="flex items-center mb-3">
                  <View className="i-mdi-calendar-clock text-2xl text-green-500 mr-2" />
                  <Text className="text-base font-semibold text-foreground">快速排休</Text>
                </View>

                <View className="mb-3">
                  <Text className="text-sm text-muted-foreground mb-2">调整后正式工人数</Text>
                  <Input
                    type="digit"
                    value={adjustedStaffCount}
                    onInput={(e) => setAdjustedStaffCount(e.detail.value)}
                    placeholder="请输入调整后的正式工人数"
                    className="border border-border rounded-lg p-3 bg-muted text-lg"
                  />
                </View>

                <View className="mb-3">
                  <Text className="text-sm text-muted-foreground mb-2">调整后排休人数（支持小数）</Text>
                  <Input
                    type="digit"
                    value={adjustedRestCount}
                    onInput={(e) => setAdjustedRestCount(e.detail.value)}
                    placeholder="请输入调整后的排休人数，如0.5表示半天"
                    className="border border-border rounded-lg p-3 bg-muted text-lg"
                  />
                </View>

                <View className="mb-2">
                  <Text className="text-sm text-muted-foreground mb-2">调整后兼职工时（小时）</Text>
                  <Input
                    type="digit"
                    value={adjustedPartTimeHours}
                    onInput={(e) => setAdjustedPartTimeHours(e.detail.value)}
                    placeholder="请输入调整后的兼职工时"
                    className="border border-border rounded-lg p-3 bg-muted text-lg"
                  />
                </View>

                {adjustedStaffCount && operation.planned_staff_count && (
                  <View className="mt-3">
                    {Number(adjustedStaffCount) < operation.planned_staff_count ? (
                      <View className="bg-blue-100 rounded-lg p-3">
                        <Text className="text-sm text-green-600">
                          ✅ 减少了 {operation.planned_staff_count - Number(adjustedStaffCount)}
                          名正式工
                        </Text>
                      </View>
                    ) : Number(adjustedStaffCount) > operation.planned_staff_count ? (
                      <View className="bg-blue-100 rounded-lg p-3">
                        <Text className="text-sm text-blue-600">
                          📈 增加了 {Number(adjustedStaffCount) - operation.planned_staff_count}
                          名正式工
                        </Text>
                      </View>
                    ) : (
                      <View className="bg-muted rounded-lg p-3">
                        <Text className="text-sm text-foreground">⚖️ 工时未变化</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 进入快速排休按钮 */}
                <Button
                  onClick={() => {
                    // 跳转到排班规划页面
                    Taro.navigateTo({
                      url: `/packageB/pages/schedule-planning/index?storeId=${stores[selectedStoreIndex]?.id}&date=${selectedDate}&revenue=${middayEstimatedRevenue}`
                    })
                  }}
                  className="bg-blue-100 text-white rounded-lg w-full mt-4 py-3 break-keep text-base"
                  size="default">
                  <Text className="text-base">进入快速排休</Text>
                </Button>
              </View>
            )}

            {/* 调整建议 */}
            {/* 保存按钮 */}
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!middayEstimatedRevenue || !adjustedStaffCount}
              className="bg-blue-100 text-white rounded-lg w-full">
              <Text className="text-base">保存调整</Text>
            </Button>
          </>
        )}
      </View>
    </View>
  )
}
