/**
 * 经营区域管理页面
 * 配置经营区域和岗位编制
 */

import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {createBusinessArea, deleteBusinessArea, getBusinessAreas, updateBusinessArea} from '@/db/api-business-area'
import type {AreaType, BusinessArea} from '@/db/types-v2'
import {useTenantStore} from '@/store/tenant'

const BusinessAreas: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  const [loading, setLoading] = useState(false)
  const [areas, setAreas] = useState<BusinessArea[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingArea, setEditingArea] = useState<BusinessArea | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    areaCode: '',
    areaName: '',
    areaType: 'dining' as AreaType,
    description: '',
    capacity: '',
    staffQuota: '', // 员工编制（原floorNumber）
    revenueWeight: '1.0',
    canCloseDaily: true
  })

  // 区域类型选项
  const areaTypeOptions = [
    {label: '餐饮区', value: 'dining'},
    {label: '厨房', value: 'kitchen'},
    {label: '吧台', value: 'bar'},
    {label: '外卖区', value: 'takeout'},
    {label: '其他', value: 'other'}
  ]

  // 加载经营区域列表
  const loadAreas = useCallback(async () => {
    if (!currentTenant || !currentStore) return

    setLoading(true)
    try {
      const data = await getBusinessAreas(currentTenant.id, currentStore.id)
      setAreas(data)
    } catch (error) {
      console.error('加载经营区域失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant, currentStore])

  useDidShow(() => {
    loadAreas()
  })

  // 重置表单
  const resetForm = () => {
    setFormData({
      areaCode: '',
      areaName: '',
      areaType: 'dining',
      description: '',
      capacity: '',
      staffQuota: '', // 员工编制
      revenueWeight: '1.0',
      canCloseDaily: true
    })
    setEditingArea(null)
  }

  // 打开添加表单
  const handleAdd = () => {
    resetForm()
    setShowAddForm(true)
  }

  // 打开编辑表单
  const handleEdit = (area: BusinessArea) => {
    setFormData({
      areaCode: area.area_code,
      areaName: area.area_name,
      areaType: area.area_type,
      description: area.description || '',
      capacity: area.capacity?.toString() || '',
      staffQuota: area.floor_number?.toString() || '', // 使用floor_number字段存储员工编制
      revenueWeight: area.revenue_weight.toString(),
      canCloseDaily: area.can_close_daily
    })
    setEditingArea(area)
    setShowAddForm(true)
  }

  // 保存经营区域
  const handleSave = async () => {
    if (!currentTenant || !currentStore || !user) return

    if (!formData.areaCode || !formData.areaName) {
      Taro.showToast({
        title: '请填写必填项',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      if (editingArea) {
        // 更新
        console.log('准备更新经营区域:', editingArea.id)
        const result = await updateBusinessArea(editingArea.id, {
          area_code: formData.areaCode,
          area_name: formData.areaName,
          area_type: formData.areaType,
          description: formData.description || undefined,
          capacity: formData.capacity ? Number.parseInt(formData.capacity, 10) : undefined,
          floor_number: formData.staffQuota ? Number.parseInt(formData.staffQuota, 10) : undefined, // 员工编制存储在floor_number
          revenue_weight: Number.parseFloat(formData.revenueWeight),
          can_close_daily: formData.canCloseDaily
        })
        console.log('更新成功:', result)
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        // 创建
        console.log('准备创建经营区域:', {
          tenant_id: currentTenant.id,
          store_id: currentStore.id,
          area_code: formData.areaCode,
          area_name: formData.areaName
        })
        const result = await createBusinessArea({
          tenant_id: currentTenant.id,
          store_id: currentStore.id,
          area_code: formData.areaCode,
          area_name: formData.areaName,
          area_type: formData.areaType,
          description: formData.description || undefined,
          capacity: formData.capacity ? Number.parseInt(formData.capacity, 10) : undefined,
          floor_number: formData.staffQuota ? Number.parseInt(formData.staffQuota, 10) : undefined, // 员工编制存储在floor_number
          revenue_weight: Number.parseFloat(formData.revenueWeight),
          can_close_daily: formData.canCloseDaily,
          sort_order: areas.length,
          created_by: user.id
        })
        console.log('创建成功:', result)
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        })
      }

      // 关闭表单并重置
      setShowAddForm(false)
      setEditingArea(null)
      resetForm()

      // 立即刷新数据列表
      console.log('准备刷新经营区域列表')
      await loadAreas()
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

  // 删除经营区域
  const handleDelete = async (area: BusinessArea) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除"${area.area_name}"吗？`
    })

    if (!result.confirm) return

    try {
      await deleteBusinessArea(area.id)
      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      })
      loadAreas()
    } catch (error) {
      console.error('删除失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'error'
      })
    }
  }

  // 切换状态
  const handleToggleStatus = async (area: BusinessArea) => {
    try {
      await updateBusinessArea(area.id, {
        is_active: !area.is_active
      })
      Taro.showToast({
        title: area.is_active ? '已停用' : '已启用',
        icon: 'success'
      })
      loadAreas()
    } catch (error) {
      console.error('切换状态失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error'
      })
    }
  }

  // 获取区域类型标签
  const getAreaTypeLabel = (type: AreaType) => {
    return areaTypeOptions.find((opt) => opt.value === type)?.label || type
  }

  // 获取区域类型颜色
  const getAreaTypeColor = (type: AreaType) => {
    const colors = {
      dining: 'bg-blue-100 text-muted-foreground',
      kitchen: 'bg-orange-100 text-muted-foreground',
      bar: 'bg-purple-100 text-muted-foreground',
      takeout: 'bg-green-100 text-muted-foreground',
      other: 'bg-muted text-muted-foreground'
    }
    return colors[type] || colors.other
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
          {/* 头部 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground block mb-1">经营区域管理</Text>
                <Text className="text-xs text-muted-foreground block">配置经营区域和岗位编制</Text>
              </View>
              <Button
                className="bg-blue-100 text-white px-4 py-2 rounded-lg text-sm break-keep"
                size="default"
                onClick={handleAdd}>
                <View className="flex items-center gap-1">
                  <View className="i-mdi-plus text-base" />
                  <Text className="text-sm">新增</Text>
                </View>
              </Button>
            </View>
          </View>

          {/* 区域列表 */}
          {loading ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-loading text-4xl text-indigo-500 animate-spin mx-auto mb-4" />
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : areas.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-map-marker-multiple text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无经营区域</Text>
              <Text className="text-sm text-muted-foreground block mb-4">点击"新增"按钮创建第一个经营区域</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {areas.map((area) => (
                <View key={area.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-2">
                        <Text className="text-base font-bold text-foreground">{area.area_name}</Text>
                        <View className={`px-2 py-0.5 rounded text-xs ${getAreaTypeColor(area.area_type)}`}>
                          <Text className="text-xs">{getAreaTypeLabel(area.area_type)}</Text>
                        </View>
                        {!area.is_active && (
                          <View className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600">
                            <Text className="text-xs">已停用</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-muted-foreground block mb-1">编码：{area.area_code}</Text>
                      {area.description && (
                        <Text className="text-xs text-muted-foreground block mb-1">{area.description}</Text>
                      )}
                      <View className="flex items-center gap-3 mt-2">
                        {area.capacity && (
                          <Text className="text-xs text-muted-foreground">容量：{area.capacity}人</Text>
                        )}
                        {area.floor_number && (
                          <Text className="text-xs text-muted-foreground">编制：{area.floor_number}人</Text>
                        )}
                        <Text className="text-xs text-muted-foreground">权重：{area.revenue_weight}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                      className="flex-1 bg-blue-100 text-white py-2 rounded-lg text-xs break-keep"
                      size="default"
                      onClick={() => handleEdit(area)}>
                      编辑
                    </Button>
                    <Button
                      className={`flex-1 py-2 rounded-lg text-xs break-keep ${area.is_active ? 'bg-blue-100 text-muted-foreground' : 'bg-blue-100 text-muted-foreground'}`}
                      size="default"
                      onClick={() => handleToggleStatus(area)}>
                      {area.is_active ? '停用' : '启用'}
                    </Button>
                    <Button
                      className="flex-1 bg-blue-100 text-red-600 py-2 rounded-lg text-xs break-keep"
                      size="default"
                      onClick={() => handleDelete(area)}>
                      删除
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 添加/编辑表单 */}
          {showAddForm && (
            <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mx-4 max-w-md w-full">
                <Text className="text-lg font-bold text-foreground block mb-4">
                  {editingArea ? '编辑区域' : '新增区域'}
                </Text>

                <View className="space-y-3">
                  <View>
                    <Text className="text-xs text-muted-foreground block mb-2">区域编码 *</Text>
                    <Input
                      value={formData.areaCode}
                      onInput={(e) => setFormData({...formData, areaCode: e.detail.value})}
                      placeholder="如：A01"
                      className="border border-gray-300 rounded-lg p-2 bg-muted text-sm w-full"
                    />
                  </View>

                  <View>
                    <Text className="text-xs text-muted-foreground block mb-2">区域名称 *</Text>
                    <Input
                      value={formData.areaName}
                      onInput={(e) => setFormData({...formData, areaName: e.detail.value})}
                      placeholder="如：大厅A区"
                      className="border border-gray-300 rounded-lg p-2 bg-muted text-sm w-full"
                    />
                  </View>

                  <View>
                    <Text className="text-xs text-muted-foreground block mb-2">区域类型</Text>
                    <Picker
                      mode="selector"
                      range={areaTypeOptions}
                      rangeKey="label"
                      value={areaTypeOptions.findIndex((opt) => opt.value === formData.areaType)}
                      onChange={(e) => {
                        const index = e.detail.value
                        setFormData({...formData, areaType: areaTypeOptions[index].value as AreaType})
                      }}>
                      <View className="flex items-center justify-between p-2 bg-muted rounded-lg border border-gray-300">
                        <Text className="text-sm text-foreground">
                          {areaTypeOptions.find((opt) => opt.value === formData.areaType)?.label}
                        </Text>
                        <View className="i-mdi-chevron-down text-base text-muted-foreground" />
                      </View>
                    </Picker>
                  </View>

                  <View>
                    <Text className="text-xs text-muted-foreground block mb-2">描述</Text>
                    <Input
                      value={formData.description}
                      onInput={(e) => setFormData({...formData, description: e.detail.value})}
                      placeholder="区域描述"
                      className="border border-gray-300 rounded-lg p-2 bg-muted text-sm w-full"
                    />
                  </View>

                  <View className="flex gap-3">
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground block mb-2">容量（人）</Text>
                      <Input
                        type="digit"
                        value={formData.capacity}
                        onInput={(e) => setFormData({...formData, capacity: e.detail.value})}
                        placeholder="容量"
                        className="border border-gray-300 rounded-lg p-2 bg-muted text-sm w-full"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground block mb-2">员工编制</Text>
                      <Input
                        type="digit"
                        value={formData.staffQuota}
                        onInput={(e) => setFormData({...formData, staffQuota: e.detail.value})}
                        placeholder="需要配置的员工人数"
                        className="border border-gray-300 rounded-lg p-2 bg-muted text-sm w-full"
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="text-xs text-muted-foreground block mb-2">营收权重</Text>
                    <Input
                      type="digit"
                      value={formData.revenueWeight}
                      onInput={(e) => setFormData({...formData, revenueWeight: e.detail.value})}
                      placeholder="1.0"
                      className="border border-gray-300 rounded-lg p-2 bg-muted text-sm w-full"
                    />
                  </View>

                  <View className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Text className="text-sm text-foreground">允许每日关闭</Text>
                    <View
                      className={`w-12 h-6 rounded-full transition-all ${formData.canCloseDaily ? 'bg-blue-100' : 'bg-gray-300'}`}
                      onClick={() => setFormData({...formData, canCloseDaily: !formData.canCloseDaily})}>
                      <View
                        className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-all ${formData.canCloseDaily ? 'ml-6' : 'ml-0.5'}`}
                      />
                    </View>
                  </View>
                </View>

                <View className="flex gap-3 mt-6">
                  <Button
                    className="flex-1 bg-muted text-foreground py-3 rounded-lg text-sm break-keep"
                    size="default"
                    onClick={() => {
                      setShowAddForm(false)
                      resetForm()
                    }}>
                    取消
                  </Button>
                  <Button
                    className="flex-1 bg-blue-100 text-white py-3 rounded-lg text-sm break-keep"
                    size="default"
                    onClick={handleSave}>
                    保存
                  </Button>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default BusinessAreas
