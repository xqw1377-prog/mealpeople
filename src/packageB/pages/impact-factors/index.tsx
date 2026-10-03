/**
 * 影响因子配置页面
 * 配置营收影响因子和权重
 */

import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  createRevenueImpactFactor,
  deleteRevenueImpactFactor,
  getRevenueImpactFactors,
  updateRevenueImpactFactor
} from '@/db/api-revenue-calendar'
import type {RevenueImpactFactor} from '@/db/types-v2'
import {useTenantStore} from '@/store/tenant'

const ImpactFactors: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  const [factors, setFactors] = useState<RevenueImpactFactor[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    factorType: 'weather' as 'weather' | 'holiday' | 'promotion' | 'event',
    factorName: '',
    factorValue: '',
    impactRate: 0,
    description: ''
  })

  // 因子类型选项
  const factorTypes = [
    {label: '天气', value: 'weather'},
    {label: '节假日', value: 'holiday'},
    {label: '促销活动', value: 'promotion'},
    {label: '特殊事件', value: 'event'}
  ]

  // 加载因子列表
  const loadFactors = useCallback(async () => {
    if (!currentTenant || !currentStore) return

    setLoading(true)
    try {
      const data = await getRevenueImpactFactors(currentTenant.id, currentStore.id)
      setFactors(data)
    } catch (error) {
      console.error('加载影响因子失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant, currentStore])

  useDidShow(() => {
    loadFactors()
  })

  // 添加因子
  const handleAdd = useCallback(async () => {
    if (!currentTenant || !currentStore || !user) return

    if (!formData.factorName.trim()) {
      Taro.showToast({
        title: '请输入因子名称',
        icon: 'error'
      })
      return
    }

    if (formData.impactRate === 0) {
      Taro.showToast({
        title: '请设置影响系数',
        icon: 'error'
      })
      return
    }

    try {
      await createRevenueImpactFactor({
        tenant_id: currentTenant.id,
        store_id: currentStore.id,
        factor_type: formData.factorType,
        factor_name: formData.factorName,
        factor_value: formData.factorValue || undefined,
        impact_rate: formData.impactRate / 100, // 转换为小数
        description: formData.description || undefined,
        created_by: user.id
      })

      Taro.showToast({
        title: '添加成功',
        icon: 'success'
      })

      // 重置表单
      setFormData({
        factorType: 'weather',
        factorName: '',
        factorValue: '',
        impactRate: 0,
        description: ''
      })
      setShowAddForm(false)

      // 刷新列表
      loadFactors()
    } catch (error) {
      console.error('添加因子失败:', error)
      Taro.showToast({
        title: '添加失败',
        icon: 'error'
      })
    }
  }, [currentTenant, currentStore, user, formData, loadFactors])

  // 删除因子
  const handleDelete = useCallback(
    async (factorId: string) => {
      const result = await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这个影响因子吗？'
      })

      if (!result.confirm) return

      try {
        await deleteRevenueImpactFactor(factorId)
        Taro.showToast({
          title: '删除成功',
          icon: 'success'
        })
        loadFactors()
      } catch (error) {
        console.error('删除因子失败:', error)
        Taro.showToast({
          title: '删除失败',
          icon: 'error'
        })
      }
    },
    [loadFactors]
  )

  // 切换激活状态
  const handleToggleActive = useCallback(
    async (factor: RevenueImpactFactor) => {
      try {
        await updateRevenueImpactFactor(factor.id, {
          is_active: !factor.is_active
        })
        Taro.showToast({
          title: factor.is_active ? '已停用' : '已启用',
          icon: 'success'
        })
        loadFactors()
      } catch (error) {
        console.error('更新因子状态失败:', error)
        Taro.showToast({
          title: '操作失败',
          icon: 'error'
        })
      }
    },
    [loadFactors]
  )

  // 获取因子类型文本
  const getFactorTypeText = (type: string) => {
    const item = factorTypes.find((t) => t.value === type)
    return item?.label || type
  }

  // 获取因子类型颜色
  const getFactorTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      weather: 'bg-blue-100 text-muted-foreground',
      holiday: 'bg-red-100 text-red-600',
      promotion: 'bg-green-100 text-muted-foreground',
      event: 'bg-purple-100 text-muted-foreground'
    }
    return colors[type] || 'bg-muted text-muted-foreground'
  }

  // 格式化影响系数
  const formatImpact = (value: number) => {
    const percent = (value * 100).toFixed(1)
    return value > 0 ? `+${percent}%` : `${percent}%`
  }

  if (!currentTenant || !currentStore) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center mx-4">
          <View className="i-mdi-alert-circle-outline text-6xl text-yellow-500 mx-auto mb-4" />
          <Text className="text-base text-foreground block mb-2">请先选择租户和门店</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          {/* 头部卡片 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-base font-bold text-foreground block">影响因子配置</Text>
                <Text className="text-xs text-muted-foreground block mt-1">配置营收影响因子和权重</Text>
              </View>
              <Button
                className="px-3 py-2 bg-teal-500 text-white rounded-lg text-xs break-keep"
                size="mini"
                onClick={() => setShowAddForm(!showAddForm)}>
                {showAddForm ? '取消' : '添加'}
              </Button>
            </View>
          </View>

          {/* 添加表单 */}
          {showAddForm && (
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <Text className="text-sm font-bold text-foreground block mb-3">添加影响因子</Text>

              {/* 因子类型 */}
              <View className="mb-3">
                <Text className="text-xs text-muted-foreground block mb-2">因子类型</Text>
                <Picker
                  mode="selector"
                  range={factorTypes}
                  rangeKey="label"
                  value={factorTypes.findIndex((t) => t.value === formData.factorType)}
                  onChange={(e) => {
                    const index = e.detail.value
                    setFormData({
                      ...formData,
                      factorType: factorTypes[index].value as 'weather' | 'holiday' | 'promotion' | 'event'
                    })
                  }}>
                  <View className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <Text className="text-sm text-foreground">{getFactorTypeText(formData.factorType)}</Text>
                    <View className="i-mdi-chevron-down text-base text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 因子名称 */}
              <View className="mb-3">
                <Text className="text-xs text-muted-foreground block mb-2">因子名称</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-muted text-foreground px-3 py-2 rounded-lg border border-gray-200 w-full text-sm"
                    placeholder="例如：春节假期、会员日活动"
                    value={formData.factorName}
                    onInput={(e) => setFormData({...formData, factorName: e.detail.value})}
                  />
                </View>
              </View>

              {/* 因子值（可选） */}
              <View className="mb-3">
                <Text className="text-xs text-muted-foreground block mb-2">因子值（可选）</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-muted text-foreground px-3 py-2 rounded-lg border border-gray-200 w-full text-sm"
                    placeholder="例如：晴天、雨天、国庆节"
                    value={formData.factorValue}
                    onInput={(e) => setFormData({...formData, factorValue: e.detail.value})}
                  />
                </View>
              </View>

              {/* 影响系数 */}
              <View className="mb-3">
                <Text className="text-xs text-muted-foreground block mb-2">
                  影响系数 ({formData.impactRate > 0 ? '+' : ''}
                  {formData.impactRate}%)
                </Text>
                <View className="flex items-center gap-2">
                  <Button
                    className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-xs break-keep"
                    size="mini"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        impactRate: Math.max(-50, formData.impactRate - 5)
                      })
                    }>
                    -5%
                  </Button>
                  <View style={{overflow: 'hidden'}} className="flex-1">
                    <Input
                      className="bg-muted text-foreground px-3 py-2 rounded-lg border border-gray-200 w-full text-center text-sm"
                      type="number"
                      value={formData.impactRate.toString()}
                      onInput={(e) => {
                        const value = Number.parseInt(e.detail.value, 10) || 0
                        setFormData({...formData, impactRate: Math.max(-50, Math.min(100, value))})
                      }}
                    />
                  </View>
                  <Button
                    className="px-3 py-1 bg-muted text-muted-foreground rounded-lg text-xs break-keep"
                    size="mini"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        impactRate: Math.min(100, formData.impactRate + 5)
                      })
                    }>
                    +5%
                  </Button>
                </View>
              </View>

              {/* 描述 */}
              <View className="mb-3">
                <Text className="text-xs text-muted-foreground block mb-2">描述（可选）</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-muted text-foreground px-3 py-2 rounded-lg border border-gray-200 w-full text-sm"
                    placeholder="简要描述该因子的影响"
                    value={formData.description}
                    onInput={(e) => setFormData({...formData, description: e.detail.value})}
                  />
                </View>
              </View>

              {/* 提交按钮 */}
              <Button
                className="w-full bg-teal-500 text-white py-3 rounded-lg text-sm break-keep"
                size="default"
                onClick={handleAdd}>
                添加因子
              </Button>
            </View>
          )}

          {/* 因子列表 */}
          {loading ? (
            <View className="flex items-center justify-center py-20">
              <View className="i-mdi-loading text-4xl text-teal-500 animate-spin" />
              <Text className="text-sm text-muted-foreground mt-4">加载中...</Text>
            </View>
          ) : factors.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-tune text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无影响因子</Text>
              <Text className="text-sm text-muted-foreground block">点击右上角"添加"按钮创建第一个影响因子</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {factors.map((factor) => (
                <View key={factor.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-start justify-between mb-2">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-2">
                        <View className={`px-2 py-1 rounded text-xs ${getFactorTypeColor(factor.factor_type)}`}>
                          <Text className="text-xs">{getFactorTypeText(factor.factor_type)}</Text>
                        </View>
                        {!factor.is_active && (
                          <View className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
                            <Text className="text-xs">已停用</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-base font-semibold text-foreground block mb-1">{factor.factor_name}</Text>
                      {factor.factor_value && (
                        <Text className="text-xs text-muted-foreground block mb-1">值：{factor.factor_value}</Text>
                      )}
                      {factor.description && (
                        <Text className="text-xs text-muted-foreground block">{factor.description}</Text>
                      )}
                    </View>
                    <View className="text-right">
                      <Text
                        className={`text-lg font-bold block ${factor.impact_rate > 0 ? 'text-muted-foreground' : 'text-red-600'}`}>
                        {formatImpact(factor.impact_rate)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Button
                      className={`flex-1 py-2 rounded-lg text-xs break-keep ${factor.is_active ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-muted-foreground'}`}
                      size="mini"
                      onClick={() => handleToggleActive(factor)}>
                      {factor.is_active ? '停用' : '启用'}
                    </Button>
                    <Button
                      className="flex-1 bg-blue-100 text-red-600 py-2 rounded-lg text-xs break-keep"
                      size="mini"
                      onClick={() => handleDelete(factor.id)}>
                      删除
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default ImpactFactors
