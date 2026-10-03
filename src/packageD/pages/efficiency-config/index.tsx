import {Button, Input, Picker, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {
  getStoreEfficiencyStandard,
  getStoresByTenantId,
  getTenantEfficiencyStandard,
  upsertEfficiencyStandard
} from '@/db/api'
import type {EfficiencyStandard, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

export default function EfficiencyConfig() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore) // ✅ 获取当前选择的门店
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    lowRevenueMax: '10000',
    lowEfficiencyStandard: '700',
    lowManagementMotto: '严控成本，生存第一',
    normalRevenueMin: '10000',
    normalRevenueMax: '18000',
    normalEfficiencyStandard: '850',
    normalManagementMotto: '精益运营，效率为王',
    highRevenueMin: '18000',
    highEfficiencyStandard: '1000',
    highManagementMotto: '保障效能，利润冲刺'
  })

  // 加载店铺列表
  const loadStores = useCallback(async () => {
    if (!currentTenant?.id) return

    const storeList = await getStoresByTenantId(currentTenant.id)
    // 添加"租户默认"选项
    const allStores = [{id: '', name: '租户默认配置', tenant_id: currentTenant.id} as Store, ...storeList]
    setStores(allStores)

    // ✅ 修复：优先使用用户在首页选择的门店作为默认值
    if (currentStore && storeList.some((s) => s.id === currentStore.id)) {
      // 如果当前门店存在于门店列表中，自动选中它（+1是因为第一个是"租户默认配置"）
      const index = storeList.findIndex((s) => s.id === currentStore.id)
      if (index !== -1) {
        setSelectedStoreIndex(index + 1) // +1 是因为第一个是"租户默认配置"
      }
    } else {
      // 否则默认选择"租户默认配置"
      setSelectedStoreIndex(0)
    }
  }, [currentTenant?.id, currentStore]) // ✅ 添加 currentStore 到依赖项

  // 加载效能标准配置
  const loadConfig = useCallback(async () => {
    if (!currentTenant?.id) return

    setLoading(true)
    try {
      const selectedStore = stores[selectedStoreIndex]
      let config: EfficiencyStandard | null = null

      if (selectedStore?.id) {
        // 加载店铺配置
        config = await getStoreEfficiencyStandard(currentTenant.id, selectedStore.id)
      } else {
        // 加载租户默认配置
        config = await getTenantEfficiencyStandard(currentTenant.id)
      }

      if (config) {
        setFormData({
          lowRevenueMax: config.low_revenue_max.toString(),
          lowEfficiencyStandard: config.low_efficiency_standard.toString(),
          lowManagementMotto: config.low_management_motto,
          normalRevenueMin: config.normal_revenue_min.toString(),
          normalRevenueMax: config.normal_revenue_max.toString(),
          normalEfficiencyStandard: config.normal_efficiency_standard.toString(),
          normalManagementMotto: config.normal_management_motto,
          highRevenueMin: config.high_revenue_min.toString(),
          highEfficiencyStandard: config.high_efficiency_standard.toString(),
          highManagementMotto: config.high_management_motto
        })
      }
    } finally {
      setLoading(false)
    }
  }, [stores, selectedStoreIndex, currentTenant.id])

  // 保存配置
  const handleSave = async () => {
    if (!currentTenant?.id) return

    // 验证数据
    const lowMax = Number(formData.lowRevenueMax)
    const normalMin = Number(formData.normalRevenueMin)
    const normalMax = Number(formData.normalRevenueMax)
    const highMin = Number(formData.highRevenueMin)

    // 验证营收区间的合理性
    if (lowMax <= 0 || normalMin <= 0 || normalMax <= 0 || highMin <= 0) {
      Taro.showToast({title: '营收金额必须大于0', icon: 'none'})
      return
    }

    if (lowMax !== normalMin) {
      Taro.showToast({title: '低营收区上限必须等于正常营收区下限', icon: 'none'})
      return
    }

    if (normalMax !== highMin) {
      Taro.showToast({title: '正常营收区上限必须等于高营收区下限', icon: 'none'})
      return
    }

    if (lowMax >= normalMax) {
      Taro.showToast({title: '低营收区上限必须小于正常营收区上限', icon: 'none'})
      return
    }

    // 验证效能标准
    const lowStd = Number(formData.lowEfficiencyStandard)
    const normalStd = Number(formData.normalEfficiencyStandard)
    const highStd = Number(formData.highEfficiencyStandard)

    if (lowStd <= 0 || normalStd <= 0 || highStd <= 0) {
      Taro.showToast({title: '效能标准必须大于0', icon: 'none'})
      return
    }

    console.log('=== 开始保存效能标准配置 ===')
    console.log('当前租户:', currentTenant)
    console.log('当前用户:', user)

    setSaving(true)
    try {
      const selectedStore = stores[selectedStoreIndex]
      console.log('选中的店铺:', selectedStore)

      const config: Partial<EfficiencyStandard> = {
        tenant_id: currentTenant.id,
        store_id: selectedStore?.id && selectedStore.id !== '' ? selectedStore.id : null,
        low_revenue_max: lowMax,
        low_efficiency_standard: Number(formData.lowEfficiencyStandard),
        low_management_motto: formData.lowManagementMotto,
        normal_revenue_min: normalMin,
        normal_revenue_max: normalMax,
        normal_efficiency_standard: Number(formData.normalEfficiencyStandard),
        normal_management_motto: formData.normalManagementMotto,
        high_revenue_min: highMin,
        high_efficiency_standard: Number(formData.highEfficiencyStandard),
        high_management_motto: formData.highManagementMotto
      }

      console.log('准备保存的配置:', config)

      const result = await upsertEfficiencyStandard(config)

      console.log('保存结果:', result)

      if (result) {
        Taro.showToast({title: '保存成功', icon: 'success'})

        // 验证保存：立即查询数据库确认数据已保存
        console.log('=== 验证保存 ===')
        if (config.store_id) {
          const verified = await getStoreEfficiencyStandard(currentTenant.id, config.store_id)
          console.log('验证查询（店铺级别）:', verified)
        } else {
          const verified = await getTenantEfficiencyStandard(currentTenant.id)
          console.log('验证查询（租户级别）:', verified)
        }
        console.log('=== 验证完成 ===')

        // 重新加载配置
        await loadConfig()
      } else {
        console.error('保存失败：API返回null')
        Taro.showToast({
          title: '保存失败，请查看控制台了解详情',
          icon: 'none',
          duration: 3000
        })
      }
    } catch (err) {
      console.error('保存配置时发生异常:', err)
      Taro.showToast({
        title: `保存失败: ${err instanceof Error ? err.message : '未知错误'}`,
        icon: 'none',
        duration: 3000
      })
    } finally {
      setSaving(false)
    }
  }

  // 重置为默认值
  const handleReset = () => {
    setFormData({
      lowRevenueMax: '10000',
      lowEfficiencyStandard: '700',
      lowManagementMotto: '严控成本，生存第一',
      normalRevenueMin: '10000',
      normalRevenueMax: '18000',
      normalEfficiencyStandard: '850',
      normalManagementMotto: '精益运营，效率为王',
      highRevenueMin: '18000',
      highEfficiencyStandard: '1000',
      highManagementMotto: '保障效能，利润冲刺'
    })
    Taro.showToast({title: '已重置为默认值', icon: 'success'})
  }

  useEffect(() => {
    loadStores()
  }, [loadStores])

  useEffect(() => {
    if (stores.length > 0) {
      loadConfig()
    }
  }, [stores, loadConfig])

  useDidShow(() => {
    loadStores()
  })

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="p-4">
        {/* 头部说明 */}
        <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
          <Text className="text-base font-bold text-foreground block mb-1">效能配置</Text>
          <Text className="text-xs text-muted-foreground block">配置营收效能标准，系统将根据营收自动匹配效能要求</Text>
        </View>

        {/* 店铺选择 */}
        <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
          <Text className="text-sm font-semibold text-foreground block mb-3">选择配置对象</Text>
          <Picker
            mode="selector"
            range={stores.map((s) => s.name)}
            value={selectedStoreIndex}
            onChange={(e) => setSelectedStoreIndex(Number(e.detail.value))}>
            <View className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Text className="text-sm text-foreground">{stores[selectedStoreIndex]?.name || '请选择'}</Text>
              <View className="i-mdi-chevron-down text-base text-muted-foreground" />
            </View>
          </Picker>
          <Text className="text-xs text-muted-foreground block mt-2">
            💡 提示：租户默认配置将应用于所有未单独配置的店铺
          </Text>
        </View>

        {loading ? (
          <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
            <View className="i-mdi-loading text-4xl text-green-500 animate-spin mx-auto mb-4" />
            <Text className="text-sm text-muted-foreground">加载中...</Text>
          </View>
        ) : (
          <>
            {/* 低营收区配置 */}
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <View className="flex items-center mb-3">
                <View className="i-mdi-alert-circle text-xl text-red-500 mr-2" />
                <Text className="text-sm font-semibold text-foreground">低营收区配置</Text>
              </View>

              <View className="mb-3">
                <Text className="text-sm text-muted-foreground mb-2">营收上限（不含）</Text>
                <Input
                  type="digit"
                  value={formData.lowRevenueMax}
                  onInput={(e) => setFormData({...formData, lowRevenueMax: e.detail.value})}
                  placeholder="请输入营收上限"
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm text-muted-foreground mb-2">人均营收标准（元/人/日）</Text>
                <Input
                  type="digit"
                  value={formData.lowEfficiencyStandard}
                  onInput={(e) => setFormData({...formData, lowEfficiencyStandard: e.detail.value})}
                  placeholder="请输入效能标准"
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                />
              </View>

              <View className="mb-0">
                <Text className="text-sm text-muted-foreground mb-2">管理口令</Text>
                <Input
                  value={formData.lowManagementMotto}
                  onInput={(e) => setFormData({...formData, lowManagementMotto: e.detail.value})}
                  placeholder="请输入管理口令"
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                />
              </View>
            </View>

            {/* 正常营收区配置 */}
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <View className="flex items-center mb-3">
                <View className="i-mdi-check-circle text-xl text-blue-500 mr-2" />
                <Text className="text-sm font-semibold text-foreground">正常营收区配置</Text>
              </View>

              <View className="mb-3">
                <Text className="text-xs text-muted-foreground block mb-2">营收下限（含）</Text>
                <Input
                  type="digit"
                  value={formData.normalRevenueMin}
                  onInput={(e) => setFormData({...formData, normalRevenueMin: e.detail.value})}
                  placeholder="请输入营收下限"
                  className="border border-gray-300 rounded-lg p-2 bg-muted text-sm"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs text-muted-foreground block mb-2">营收上限（不含）</Text>
                <Input
                  type="digit"
                  value={formData.normalRevenueMax}
                  onInput={(e) => setFormData({...formData, normalRevenueMax: e.detail.value})}
                  placeholder="请输入营收上限"
                  className="border border-gray-300 rounded-lg p-2 bg-muted text-sm"
                />
              </View>

              <View className="mb-3">
                <Text className="text-xs text-muted-foreground block mb-2">人均营收标准（元/人/日）</Text>
                <Input
                  type="digit"
                  value={formData.normalEfficiencyStandard}
                  onInput={(e) => setFormData({...formData, normalEfficiencyStandard: e.detail.value})}
                  placeholder="请输入效能标准"
                  className="border border-gray-300 rounded-lg p-2 bg-muted text-sm"
                />
              </View>

              <View className="mb-0">
                <Text className="text-xs text-muted-foreground block mb-2">管理口令</Text>
                <Input
                  value={formData.normalManagementMotto}
                  onInput={(e) => setFormData({...formData, normalManagementMotto: e.detail.value})}
                  placeholder="请输入管理口令"
                  className="border border-gray-300 rounded-lg p-2 bg-muted text-sm"
                />
              </View>
            </View>

            {/* 高营收区配置 */}
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <View className="flex items-center mb-3">
                <View className="i-mdi-star-circle text-xl text-green-500 mr-2" />
                <Text className="text-sm font-semibold text-foreground">高营收区配置</Text>
              </View>

              <View className="mb-3">
                <Text className="text-xs text-muted-foreground block mb-2">营收下限（含）</Text>
                <Input
                  type="digit"
                  value={formData.highRevenueMin}
                  onInput={(e) => setFormData({...formData, highRevenueMin: e.detail.value})}
                  placeholder="请输入营收下限"
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm text-muted-foreground mb-2">人均营收标准（元/人/日）</Text>
                <Input
                  type="digit"
                  value={formData.highEfficiencyStandard}
                  onInput={(e) => setFormData({...formData, highEfficiencyStandard: e.detail.value})}
                  placeholder="请输入效能标准"
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                />
              </View>

              <View className="mb-0">
                <Text className="text-sm text-muted-foreground mb-2">管理口令</Text>
                <Input
                  value={formData.highManagementMotto}
                  onInput={(e) => setFormData({...formData, highManagementMotto: e.detail.value})}
                  placeholder="请输入管理口令"
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                />
              </View>
            </View>

            {/* 说明 */}
            <View className="bg-blue-100 rounded-lg p-4 mb-4">
              <Text className="text-sm font-semibold text-blue-600 mb-2">📋 配置说明</Text>
              <View className="mb-1">
                <Text className="text-xs text-blue-600">1. 营收临界点遵循"含上不含下"原则</Text>
              </View>
              <View className="mb-1">
                <Text className="text-xs text-blue-600">2. 低营收区上限 = 正常营收区下限</Text>
              </View>
              <View className="mb-1">
                <Text className="text-xs text-blue-600">3. 正常营收区上限 = 高营收区下限</Text>
              </View>
              <View className="mb-1">
                <Text className="text-xs text-blue-600">4. 计算公式：</Text>
              </View>
              <View className="ml-4 mb-1">
                <Text className="text-xs text-blue-600">• 目标总工时 = 预估营收 ÷ 效能标准</Text>
              </View>
              <View className="ml-4 mb-1">
                <Text className="text-xs text-blue-600">• 目标人数 = 目标总工时 ÷ 每日工作小时数</Text>
              </View>
              <View className="ml-4">
                <Text className="text-xs text-blue-600">• 示例：8小时工作制，2小时 = 0.25人</Text>
              </View>
            </View>

            {/* 操作按钮 */}
            <View className="flex gap-3 mb-4">
              <View className="flex-1">
                <Button onClick={handleReset} className="bg-muted text-foreground rounded-lg">
                  <Text className="text-sm">重置默认</Text>
                </Button>
              </View>
              <View className="flex-1">
                <Button onClick={handleSave} loading={saving} className="bg-blue-100 text-white rounded-lg">
                  <Text className="text-sm">保存配置</Text>
                </Button>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  )
}
