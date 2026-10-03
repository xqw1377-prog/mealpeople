/**
 * 最低营收岗位配置页面
 * 配置最低营收场景下的必要岗位和人数
 */

import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {
  createMinRevenuePositions,
  deleteMinRevenuePositions,
  getMinRevenuePositions,
  updateMinRevenuePositions
} from '@/db/api-min-revenue'
import type {MinRevenuePositions, PositionConfig} from '@/db/types-v2'
import {useTenantStore} from '@/store/tenant'

export default function MinRevenueConfig() {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)
  const [configs, setConfigs] = useState<MinRevenuePositions[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingConfig, setEditingConfig] = useState<MinRevenuePositions | null>(null)

  // 表单状态
  const [scenarioName, setScenarioName] = useState('')
  const [minRevenue, setMinRevenue] = useState('')
  const [positions, setPositions] = useState<PositionConfig[]>([])

  // 加载配置列表
  const loadConfigs = useCallback(async () => {
    if (!currentTenant?.id || !currentStore?.id) {
      console.log('缺少租户或店铺信息', {currentTenant, currentStore})
      return
    }

    try {
      setLoading(true)
      console.log('开始加载配置', {tenantId: currentTenant.id, storeId: currentStore.id})
      const data = await getMinRevenuePositions(currentTenant.id, currentStore.id)
      console.log('加载到的配置数据:', data)
      setConfigs(data)
    } catch (error) {
      console.error('加载最低营收配置失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, currentStore?.id, currentStore, currentTenant])

  useDidShow(() => {
    loadConfigs()
  })

  // 重置表单
  const resetForm = () => {
    setScenarioName('')
    setMinRevenue('')
    setPositions([])
    setEditingConfig(null)
  }

  // 打开新增对话框
  const handleCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  // 打开编辑对话框
  const handleEdit = (config: MinRevenuePositions) => {
    setEditingConfig(config)
    setScenarioName(config.scenario_name)
    setMinRevenue(config.min_revenue.toString())
    setPositions(config.required_positions)
    setShowDialog(true)
  }

  // 添加岗位
  const handleAddPosition = () => {
    setPositions([...positions, {position_name: '', required_count: 1}])
  }

  // 更新岗位
  const handleUpdatePosition = (index: number, field: 'position_name' | 'required_count', value: string | number) => {
    const newPositions = [...positions]
    if (field === 'position_name') {
      newPositions[index].position_name = value as string
    } else {
      newPositions[index].required_count = value as number
    }
    setPositions(newPositions)
  }

  // 删除岗位
  const handleRemovePosition = (index: number) => {
    setPositions(positions.filter((_, i) => i !== index))
  }

  // 保存配置
  const handleSave = async () => {
    if (!currentTenant || !currentStore || !user) return

    if (!scenarioName.trim()) {
      Taro.showToast({
        title: '请输入场景名称',
        icon: 'none'
      })
      return
    }

    const revenueValue = Number.parseFloat(minRevenue)
    if (Number.isNaN(revenueValue) || revenueValue <= 0) {
      Taro.showToast({
        title: '请输入有效的最低营收',
        icon: 'none'
      })
      return
    }

    if (positions.length === 0) {
      Taro.showToast({
        title: '请至少添加一个岗位',
        icon: 'none'
      })
      return
    }

    // 验证岗位信息
    for (const pos of positions) {
      if (!pos.position_name.trim()) {
        Taro.showToast({
          title: '请填写岗位名称',
          icon: 'none'
        })
        return
      }
      if (pos.required_count <= 0) {
        Taro.showToast({
          title: '岗位人数必须大于0',
          icon: 'none'
        })
        return
      }
    }

    setLoading(true)
    try {
      if (editingConfig) {
        // 更新
        console.log('准备更新配置:', editingConfig.id)
        const result = await updateMinRevenuePositions(editingConfig.id, {
          scenario_name: scenarioName.trim(),
          min_revenue: revenueValue,
          required_positions: positions
        })
        console.log('更新成功:', result)
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        // 创建
        console.log('准备创建配置:', {
          tenant_id: currentTenant.id,
          store_id: currentStore.id,
          scenario_name: scenarioName.trim(),
          min_revenue: revenueValue,
          required_positions: positions,
          created_by: user.id
        })
        const result = await createMinRevenuePositions({
          tenant_id: currentTenant.id,
          store_id: currentStore.id,
          scenario_name: scenarioName.trim(),
          min_revenue: revenueValue,
          required_positions: positions,
          created_by: user.id
        })
        console.log('创建成功:', result)
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        })
      }

      // 关闭对话框并重置表单
      setShowDialog(false)
      setEditingConfig(null)
      resetForm()

      // 立即刷新配置列表
      console.log('准备刷新配置列表')
      await loadConfigs()
      console.log('刷新完成')
    } catch (error) {
      console.error('保存失败，详细错误:', error)
      const errorMessage = error instanceof Error ? error.message : '保存失败'
      Taro.showToast({
        title: errorMessage.length > 20 ? '保存失败，请重试' : errorMessage,
        icon: 'none',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  // 删除配置
  const handleDelete = async (config: MinRevenuePositions) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除场景"${config.scenario_name}"吗？`
    })

    if (!res.confirm) return

    try {
      setLoading(true)
      await deleteMinRevenuePositions(config.id)
      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      })
      loadConfigs()
    } catch (error) {
      console.error('删除失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!currentTenant || !currentStore) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center mx-4">
          <View className="i-mdi-alert-circle-outline text-6xl text-indigo-500 mx-auto mb-4" />
          <Text className="text-base text-foreground block mb-2">请先选择租户和门店</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          {/* 头部说明 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-2">
              <View className="flex items-center gap-3 flex-1">
                <View className="i-mdi-account-hard-hat text-2xl text-indigo-500" />
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground block mb-1">最低营收岗位配置</Text>
                  <Text className="text-xs text-muted-foreground block">配置最低营收场景下的必要岗位</Text>
                </View>
              </View>
              <Button
                className="bg-blue-100 text-white px-4 py-2 rounded-lg text-sm break-keep"
                size="default"
                onClick={handleCreate}>
                <View className="flex items-center gap-1">
                  <View className="i-mdi-plus text-base" />
                  <Text className="text-sm">新增</Text>
                </View>
              </Button>
            </View>
          </View>

          {/* 配置列表 */}
          {loading && configs.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-loading text-4xl text-indigo-500 animate-spin mx-auto mb-4" />
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : configs.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-briefcase-outline text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无配置</Text>
              <Text className="text-sm text-muted-foreground block">点击"新增"按钮创建最低营收场景配置</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {configs.map((config) => (
                <View key={config.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                  {/* 场景信息 */}
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground block mb-1">{config.scenario_name}</Text>
                      <Text className="text-sm text-muted-foreground">
                        最低营收：¥{config.min_revenue.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex gap-2">
                      <Button
                        className="bg-blue-100 text-white px-3 py-1 rounded-lg text-xs break-keep"
                        size="default"
                        onClick={() => handleEdit(config)}>
                        编辑
                      </Button>
                      <Button
                        className="bg-blue-100 text-red-600 px-3 py-1 rounded-lg text-xs break-keep"
                        size="default"
                        onClick={() => handleDelete(config)}>
                        删除
                      </Button>
                    </View>
                  </View>

                  {/* 岗位列表 */}
                  <View className="mt-3 pt-3 border-t border-gray-100">
                    <Text className="text-sm text-muted-foreground mb-2">必要岗位：</Text>
                    <View className="space-y-2">
                      {config.required_positions.map((pos, index) => (
                        <View key={index} className="flex items-center justify-between bg-muted rounded-lg p-2">
                          <Text className="text-sm text-foreground">{pos.position_name}</Text>
                          <Text className="text-sm font-semibold text-indigo-600">{pos.required_count}人</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 编辑对话框 */}
      {showDialog && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 m-4 max-w-md w-full max-h-[80vh] overflow-auto">
            <Text className="text-lg font-bold text-foreground mb-4">{editingConfig ? '编辑场景' : '新增场景'}</Text>

            <View className="space-y-3">
              {/* 场景名称 */}
              <View>
                <Text className="text-xs text-muted-foreground block mb-2">场景名称 *</Text>
                <Input
                  value={scenarioName}
                  onInput={(e) => setScenarioName(e.detail.value)}
                  placeholder="如：最低营收场景"
                  className="border border-gray-300 rounded-lg p-2 bg-muted text-sm w-full"
                />
              </View>

              {/* 最低营收 */}
              <View>
                <Text className="text-xs text-muted-foreground block mb-2">最低营收（元）*</Text>
                <Input
                  type="digit"
                  value={minRevenue}
                  onInput={(e) => setMinRevenue(e.detail.value)}
                  placeholder="0"
                  className="border border-gray-300 rounded-lg p-2 bg-muted text-sm w-full"
                />
              </View>

              {/* 岗位列表 */}
              <View>
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-xs text-muted-foreground">必要岗位 *</Text>
                  <Button
                    className="bg-blue-100 text-indigo-600 px-3 py-1 rounded-lg text-xs break-keep"
                    size="default"
                    onClick={handleAddPosition}>
                    <View className="flex items-center gap-1">
                      <View className="i-mdi-plus text-sm" />
                      <Text className="text-xs">添加</Text>
                    </View>
                  </Button>
                </View>

                {positions.length === 0 ? (
                  <View className="bg-muted rounded-lg p-4 text-center">
                    <Text className="text-sm text-muted-foreground">暂无岗位，点击"添加"按钮</Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {positions.map((pos, index) => (
                      <View key={index} className="flex items-center gap-2">
                        <Input
                          value={pos.position_name}
                          onInput={(e) => handleUpdatePosition(index, 'position_name', e.detail.value)}
                          placeholder="岗位名称"
                          className="flex-1 border border-gray-300 rounded-lg p-2 bg-muted text-sm"
                        />
                        <Input
                          type="digit"
                          value={pos.required_count.toString()}
                          onInput={(e) =>
                            handleUpdatePosition(index, 'required_count', Number.parseInt(e.detail.value, 10) || 1)
                          }
                          placeholder="人数"
                          className="w-16 border border-gray-300 rounded-lg p-2 bg-muted text-sm text-center"
                        />
                        <Button
                          className="bg-blue-100 text-red-600 w-8 h-8 rounded-lg flex items-center justify-center"
                          size="default"
                          onClick={() => handleRemovePosition(index)}>
                          <View className="i-mdi-delete text-base" />
                        </Button>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex gap-3 mt-6">
              <Button
                className="flex-1 bg-muted text-foreground py-3 rounded-lg text-sm break-keep"
                size="default"
                onClick={() => {
                  setShowDialog(false)
                  resetForm()
                }}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 rounded-lg text-sm break-keep"
                size="default"
                onClick={handleSave}
                disabled={loading}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
