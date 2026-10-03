import {Button, Input, Picker, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {
  evaluateEfficiency,
  getDailyOperation,
  getStoreEfficiencyStandard,
  getStoresByTenantId,
  upsertDailyOperation
} from '@/db/api'
import type {DailyOperation, EfficiencyStandard, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

export default function OperationReview() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [actualRevenue, setActualRevenue] = useState('')
  const [actualStaffCount, setActualStaffCount] = useState('')
  const [actualRestCount, setActualRestCount] = useState('') // 添加实际排休人数
  const [actualPartTimeHours, setActualPartTimeHours] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [standard, setStandard] = useState<EfficiencyStandard | null>(null)
  const [operation, setOperation] = useState<DailyOperation | null>(null)
  const [evaluation, setEvaluation] = useState<any>(null)

  // 加载店铺列表
  const loadStores = useCallback(async () => {
    if (!currentTenant?.id) return
    const storeList = await getStoresByTenantId(currentTenant?.id)
    setStores(storeList)
  }, [currentTenant?.id])

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
        setActualRevenue(op.actual_revenue?.toString() || '')
        setActualStaffCount(op.actual_staff_count?.toString() || '')
        setActualPartTimeHours(op.actual_part_time_hours?.toString() || '')
        setNotes(op.notes || '')
      } else {
        setActualRevenue('')
        setActualStaffCount('')
        setActualPartTimeHours('')
        setNotes('')
      }
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, stores, selectedStoreIndex, selectedDate])

  // 计算评估结果
  useEffect(() => {
    if (actualRevenue && actualStaffCount && standard) {
      const revenue = Number(actualRevenue)
      const staffCount = Number(actualStaffCount)

      if (revenue > 0 && staffCount > 0) {
        const result = evaluateEfficiency(revenue, staffCount, standard)
        setEvaluation(result)
      } else {
        setEvaluation(null)
      }
    } else {
      setEvaluation(null)
    }
  }, [actualRevenue, actualStaffCount, standard])

  // 保存复盘
  const handleSave = async () => {
    if (!currentTenant?.id || !stores[selectedStoreIndex]?.id) return

    if (!actualRevenue || !actualStaffCount) {
      Taro.showToast({title: '请填写完整信息', icon: 'none'})
      return
    }

    const revenue = Number(actualRevenue)
    const staffCount = Number(actualStaffCount)
    const restCount = actualRestCount ? Number(actualRestCount) : 0 // 获取排休人数
    const partTimeHours = actualPartTimeHours ? Number(actualPartTimeHours) : 0

    if (revenue <= 0 || staffCount <= 0) {
      Taro.showToast({title: '请输入有效的数值', icon: 'none'})
      return
    }

    if (!evaluation) {
      Taro.showToast({title: '评估数据异常', icon: 'none'})
      return
    }

    setSaving(true)
    try {
      const result = await upsertDailyOperation({
        tenant_id: currentTenant?.id,
        store_id: stores[selectedStoreIndex].id,
        operation_date: selectedDate,
        ...(operation || {}),
        actual_revenue: revenue,
        actual_staff_count: staffCount,
        actual_rest_count: restCount, // 保存实际排休人数
        actual_part_time_hours: partTimeHours || null,
        per_capita_revenue: evaluation.perCapitaRevenue,
        efficiency_rating: evaluation.rating,
        notes
      })

      if (result) {
        Taro.showToast({title: '保存成功', icon: 'success'})

        // 🔥 触发数据更新事件，通知首页刷新仪表盘
        console.log('=== 复盘结果保存成功，触发数据更新事件 ===')
        Taro.eventCenter.trigger('scheduleDataUpdated', {
          source: 'operation-review',
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

  const getRatingBgColor = (rating: string) => {
    switch (rating) {
      case '优秀':
        return 'bg-blue-100'
      case '合格':
        return 'bg-blue-100'
      case '未达标':
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
              onChange={(e) => setSelectedStoreIndex(Number(e.detail.value))}>
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
        ) : (
          <>
            {/* 规划数据回顾 */}
            {operation?.estimated_revenue && (
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <View className="flex items-center mb-3">
                  <View className="i-mdi-history text-2xl text-muted-foreground mr-2" />
                  <Text className="text-base font-semibold text-foreground">规划数据回顾</Text>
                </View>

                <View className="space-y-2">
                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">预估营收</Text>
                    <Text className="text-base text-foreground">¥{operation.estimated_revenue.toLocaleString()}</Text>
                  </View>

                  {operation.planned_staff_count && (
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">计划正式工</Text>
                      <Text className="text-base text-foreground">{operation.planned_staff_count}人</Text>
                    </View>
                  )}

                  {operation.planned_part_time_hours && operation.planned_part_time_hours > 0 && (
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">计划兼职工时</Text>
                      <Text className="text-base text-foreground">{operation.planned_part_time_hours}小时</Text>
                    </View>
                  )}

                  {operation.midday_estimated_revenue && (
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">午市后预估</Text>
                      <Text className="text-base text-foreground">
                        ¥{operation.midday_estimated_revenue.toLocaleString()}
                      </Text>
                    </View>
                  )}

                  {operation.adjusted_staff_count && (
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">调整后正式工</Text>
                      <Text className="text-base text-foreground">{operation.adjusted_staff_count}人</Text>
                    </View>
                  )}

                  {operation.adjusted_part_time_hours && operation.adjusted_part_time_hours > 0 && (
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">调整后兼职工时</Text>
                      <Text className="text-base text-foreground">{operation.adjusted_part_time_hours}小时</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* 实际数据录入 */}
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <View className="flex items-center mb-3">
                <View className="i-mdi-file-document-edit text-2xl text-blue-500 mr-2" />
                <Text className="text-base font-semibold text-foreground">实际数据录入</Text>
              </View>

              <View className="mb-3">
                <Text className="text-sm text-muted-foreground mb-2">实际营收（元）</Text>
                <Input
                  type="digit"
                  value={actualRevenue}
                  onInput={(e) => setActualRevenue(e.detail.value)}
                  placeholder="请输入实际营收"
                  className="border border-gray-300 rounded-lg p-3 bg-muted text-lg"
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm text-muted-foreground mb-2">实际正式工人数</Text>
                <Input
                  type="digit"
                  value={actualStaffCount}
                  onInput={(e) => setActualStaffCount(e.detail.value)}
                  placeholder="请输入实际正式工人数"
                  className="border border-gray-300 rounded-lg p-3 bg-muted text-lg"
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm text-muted-foreground mb-2">实际排休人数（支持小数）</Text>
                <Input
                  type="digit"
                  value={actualRestCount}
                  onInput={(e) => setActualRestCount(e.detail.value)}
                  placeholder="请输入实际排休人数，如0.5表示半天"
                  className="border border-gray-300 rounded-lg p-3 bg-muted text-lg"
                />
              </View>

              <View className="mb-0">
                <Text className="text-sm text-muted-foreground mb-2">实际兼职工时（小时）</Text>
                <Input
                  type="digit"
                  value={actualPartTimeHours}
                  onInput={(e) => setActualPartTimeHours(e.detail.value)}
                  placeholder="请输入实际兼职工时"
                  className="border border-gray-300 rounded-lg p-3 bg-muted text-lg"
                />
              </View>
            </View>

            {/* 评估结果 */}
            {evaluation && (
              <View className={`rounded-lg p-4 mb-4 shadow-sm ${getRatingBgColor(evaluation.rating)}`}>
                <View className="flex items-center mb-3">
                  <View className="i-mdi-chart-box text-2xl text-foreground mr-2" />
                  <Text className="text-base font-semibold text-foreground">评估结果</Text>
                </View>

                <View className="space-y-3">
                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">所属区间</Text>
                    <Text className={`text-base font-semibold ${getZoneColor(evaluation.zone)}`}>
                      {evaluation.zoneName}
                    </Text>
                  </View>

                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">效能标准</Text>
                    <Text className="text-base font-semibold text-foreground">
                      {evaluation.efficiencyStandard}元/人/日
                    </Text>
                  </View>

                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">人均营收</Text>
                    <Text className="text-lg font-bold text-muted-foreground">
                      {evaluation.perCapitaRevenue}元/人/日
                    </Text>
                  </View>

                  <View className="border-t border-gray-200 pt-3 mt-3">
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">评价结果</Text>
                      <View className="flex items-center">
                        <Text className="text-2xl mr-2">{evaluation.ratingIcon}</Text>
                        <Text className={`text-xl font-bold ${evaluation.ratingColor}`}>{evaluation.rating}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 评价说明 */}
            {evaluation && (
              <View className={`rounded-lg p-4 mb-4 ${getZoneBgColor(evaluation.zone)}`}>
                <Text className="text-sm font-semibold text-foreground mb-2">📊 评价说明</Text>
                {evaluation.rating === '优秀' && (
                  <Text className="text-sm text-foreground">
                    在{evaluation.zoneName}内，人均营收达到或超过效能标准，表现优秀！
                  </Text>
                )}
                {evaluation.rating === '合格' && (
                  <Text className="text-sm text-foreground">
                    在{evaluation.zoneName}内，人均营收接近效能标准（≥90%），表现合格，仍有提升空间。
                  </Text>
                )}
                {evaluation.rating === '未达标' && (
                  <Text className="text-sm text-foreground">
                    在{evaluation.zoneName}内，人均营收低于效能标准的90%，未达标，需要复盘原因并改进。
                  </Text>
                )}
              </View>
            )}

            {/* 备注 */}
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <View className="flex items-center mb-3">
                <View className="i-mdi-note-text text-2xl text-muted-foreground mr-2" />
                <Text className="text-base font-semibold text-foreground">复盘备注</Text>
              </View>

              <Input
                value={notes}
                onInput={(e) => setNotes(e.detail.value)}
                placeholder="记录复盘要点、问题和改进措施..."
                className="border border-gray-300 rounded-lg p-3 bg-gray-50"
              />
            </View>

            {/* 保存按钮 */}
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!actualRevenue || !actualStaffCount}
              className="bg-blue-100 text-white rounded-lg w-full">
              <Text className="text-base">保存复盘</Text>
            </Button>
          </>
        )}
      </View>
    </View>
  )
}
