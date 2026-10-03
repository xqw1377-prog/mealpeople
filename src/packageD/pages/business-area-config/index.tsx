import {Button, Input, ScrollView, Text, Textarea, View} from '@tarojs/components'
import {showModal, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {useTenantStore} from '@/store/tenant'

interface BusinessAreaConfig {
  id: string
  tenant_id: string
  store_id: string | null
  area_name: string
  area_type: 'business' | 'production'
  capacity: number
  position_count: number
  is_active: boolean
  display_order: number
  description: string | null
  created_at: string
  updated_at: string
}

const BusinessAreaConfigPage: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [loading, setLoading] = useState(false)
  const [areas, setAreas] = useState<BusinessAreaConfig[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingArea, setEditingArea] = useState<BusinessAreaConfig | null>(null)

  // 表单状态
  const [areaName, setAreaName] = useState('')
  const [areaType, setAreaType] = useState<'business' | 'production'>('business')
  const [capacity, setCapacity] = useState(0)
  const [positionCount, setPositionCount] = useState(1)
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  // 加载营业区配置
  const loadAreas = useCallback(async () => {
    if (!currentTenant?.id) return

    setLoading(true)
    try {
      const {data, error} = await supabase
        .from('business_area_config')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('display_order', {ascending: true})

      if (error) throw error

      setAreas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载营业区配置失败:', error)
      showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id])

  useDidShow(() => {
    loadAreas()
  })

  // 打开新增对话框
  const handleAdd = () => {
    setEditingArea(null)
    setAreaName('')
    setAreaType('business')
    setCapacity(0)
    setPositionCount(1)
    setDescription('')
    setIsActive(true)
    setShowDialog(true)
  }

  // 打开编辑对话框
  const handleEdit = (area: BusinessAreaConfig) => {
    setEditingArea(area)
    setAreaName(area.area_name)
    setAreaType(area.area_type)
    setCapacity(area.capacity)
    setPositionCount(area.position_count || 1)
    setDescription(area.description || '')
    setIsActive(area.is_active)
    setShowDialog(true)
  }

  // 保存营业区配置
  const handleSave = async () => {
    if (!currentTenant?.id) return

    if (!areaName.trim()) {
      showToast({
        title: '请输入区域名称',
        icon: 'none'
      })
      return
    }

    if (positionCount < 1) {
      showToast({
        title: '岗位人数至少为1',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      const areaData = {
        tenant_id: currentTenant.id,
        area_name: areaName.trim(),
        area_type: areaType,
        capacity: capacity || 0,
        position_count: positionCount,
        is_active: isActive,
        display_order: editingArea?.display_order || areas.length,
        description: description.trim() || null
      }

      if (editingArea?.id) {
        // 更新
        const {error} = await supabase.from('business_area_config').update(areaData).eq('id', editingArea.id)

        if (error) throw error

        showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        // 新增
        const {error} = await supabase.from('business_area_config').insert([areaData])

        if (error) throw error

        showToast({
          title: '新增成功',
          icon: 'success'
        })
      }

      setShowDialog(false)
      loadAreas()
    } catch (error) {
      console.error('保存营业区配置失败:', error)
      showToast({
        title: '保存失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 删除营业区配置
  const handleDelete = async (area: BusinessAreaConfig) => {
    const res = await showModal({
      title: '确认删除',
      content: `确定要删除营业区"${area.area_name}"吗？`,
      confirmText: '删除',
      cancelText: '取消'
    })

    if (!res.confirm) return

    setLoading(true)
    try {
      const {error} = await supabase.from('business_area_config').delete().eq('id', area.id)

      if (error) throw error

      showToast({
        title: '删除成功',
        icon: 'success'
      })

      loadAreas()
    } catch (error) {
      console.error('删除营业区配置失败:', error)
      showToast({
        title: '删除失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 按类型分组
  const businessAreas = areas.filter((a) => a.area_type === 'business')
  const productionAreas = areas.filter((a) => a.area_type === 'production')

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground block mb-2">营业区配置</Text>
            <Text className="text-sm text-muted-foreground block">配置营业区和制作区的基本信息</Text>
          </View>

          {/* 新增按钮 */}
          <View className="mb-6">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={handleAdd}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus-circle text-xl text-foreground" />
                <Text className="text-blue-600 font-medium">新增营业区</Text>
              </View>
            </Button>
          </View>

          {/* 营业区列表 */}
          {loading && areas.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
              <View className="i-mdi-loading animate-spin text-4xl text-blue-500 mx-auto mb-3" />
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : areas.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
              <View className="i-mdi-store-settings-outline text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-foreground block mb-2">暂无营业区配置</Text>
              <Text className="text-sm text-muted-foreground block">点击上方按钮新增营业区</Text>
            </View>
          ) : (
            <View className="space-y-6">
              {/* 营业区 */}
              {businessAreas.length > 0 && (
                <View>
                  <View className="flex items-center gap-2 mb-3">
                    <View className="i-mdi-store text-xl text-muted-foreground" />
                    <Text className="text-base font-bold text-foreground">营业区</Text>
                    <View className="ml-auto px-3 py-1 rounded-full bg-blue-100">
                      <Text className="text-xs font-medium text-muted-foreground">{businessAreas.length} 个</Text>
                    </View>
                  </View>

                  {businessAreas.map((area) => (
                    <View
                      key={area.id}
                      className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-3 shadow-sm border-l-4 border-blue-400">
                      <View className="flex items-start justify-between mb-3">
                        <View className="flex-1">
                          <View className="flex items-center gap-2 mb-2">
                            <View className="i-mdi-store text-lg text-muted-foreground" />
                            <Text className="text-lg font-bold text-foreground">{area.area_name}</Text>
                            {!area.is_active && (
                              <View className="px-2 py-0.5 bg-muted rounded">
                                <Text className="text-xs text-muted-foreground">已停用</Text>
                              </View>
                            )}
                          </View>

                          <View className="space-y-1">
                            <View className="flex items-center gap-2">
                              <Text className="text-sm text-muted-foreground">容量：</Text>
                              <Text className="text-sm font-medium text-foreground">{area.capacity} 人</Text>
                            </View>
                            <View className="flex items-center gap-2">
                              <Text className="text-sm text-muted-foreground">岗位人数：</Text>
                              <Text className="text-sm font-medium text-foreground">{area.position_count || 1} 人</Text>
                            </View>
                            {area.description && (
                              <Text className="text-sm text-muted-foreground mt-1">{area.description}</Text>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* 操作按钮 */}
                      <View className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          className="flex-1 bg-blue-100 py-2 rounded-lg text-sm break-keep"
                          size="default"
                          onClick={() => handleEdit(area)}>
                          <View className="flex items-center justify-center gap-1">
                            <View className="i-mdi-pencil text-base text-muted-foreground" />
                            <Text className="text-muted-foreground font-medium">编辑</Text>
                          </View>
                        </Button>
                        <Button
                          className="flex-1 bg-blue-100 py-2 rounded-lg text-sm break-keep"
                          size="default"
                          onClick={() => handleDelete(area)}>
                          <View className="flex items-center justify-center gap-1">
                            <View className="i-mdi-delete text-base text-red-600" />
                            <Text className="text-red-600 font-medium">删除</Text>
                          </View>
                        </Button>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* 制作区 */}
              {productionAreas.length > 0 && (
                <View>
                  <View className="flex items-center gap-2 mb-3">
                    <View className="i-mdi-chef-hat text-xl text-muted-foreground" />
                    <Text className="text-base font-bold text-foreground">制作区</Text>
                    <View className="ml-auto px-3 py-1 rounded-full bg-blue-100">
                      <Text className="text-xs font-medium text-muted-foreground">{productionAreas.length} 个</Text>
                    </View>
                  </View>

                  {productionAreas.map((area) => (
                    <View
                      key={area.id}
                      className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-3 shadow-sm border-l-4 border-green-400">
                      <View className="flex items-start justify-between mb-3">
                        <View className="flex-1">
                          <View className="flex items-center gap-2 mb-2">
                            <View className="i-mdi-chef-hat text-lg text-muted-foreground" />
                            <Text className="text-lg font-bold text-foreground">{area.area_name}</Text>
                            {!area.is_active && (
                              <View className="px-2 py-0.5 bg-muted rounded">
                                <Text className="text-xs text-muted-foreground">已停用</Text>
                              </View>
                            )}
                          </View>

                          <View className="space-y-1">
                            <View className="flex items-center gap-2">
                              <Text className="text-sm text-muted-foreground">容量：</Text>
                              <Text className="text-sm font-medium text-foreground">{area.capacity} 人</Text>
                            </View>
                            <View className="flex items-center gap-2">
                              <Text className="text-sm text-muted-foreground">岗位人数：</Text>
                              <Text className="text-sm font-medium text-foreground">{area.position_count || 1} 人</Text>
                            </View>
                            {area.description && (
                              <Text className="text-sm text-muted-foreground mt-1">{area.description}</Text>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* 操作按钮 */}
                      <View className="flex gap-2 pt-3 border-t border-gray-100">
                        <Button
                          className="flex-1 bg-blue-100 py-2 rounded-lg text-sm break-keep"
                          size="default"
                          onClick={() => handleEdit(area)}>
                          <View className="flex items-center justify-center gap-1">
                            <View className="i-mdi-pencil text-base text-muted-foreground" />
                            <Text className="text-muted-foreground font-medium">编辑</Text>
                          </View>
                        </Button>
                        <Button
                          className="flex-1 bg-blue-100 py-2 rounded-lg text-sm break-keep"
                          size="default"
                          onClick={() => handleDelete(area)}>
                          <View className="flex items-center justify-center gap-1">
                            <View className="i-mdi-delete text-base text-red-600" />
                            <Text className="text-red-600 font-medium">删除</Text>
                          </View>
                        </Button>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 新增/编辑对话框 */}
      {showDialog && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{zIndex: 1000}}
          onClick={() => setShowDialog(false)}>
          <View
            className="bg-white rounded-lg p-6 border-2 border-gray-200 w-full border border-border"
            style={{maxWidth: '500px'}}
            onClick={(e) => e.stopPropagation()}>
            {/* 标题 */}
            <View className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <View className="i-mdi-store-settings text-2xl text-muted-foreground" />
              <Text className="text-xl font-bold text-foreground">{editingArea ? '编辑营业区' : '新增营业区'}</Text>
            </View>

            {/* 区域名称 */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-foreground mb-2 block">
                区域名称 <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-foreground"
                  placeholder="请输入区域名称"
                  value={areaName}
                  onInput={(e) => setAreaName(e.detail.value)}
                />
              </View>
            </View>

            {/* 区域类型 */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-foreground mb-3 block">
                区域类型 <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex gap-3">
                <Button
                  className={`flex-1 py-3 rounded-xl text-sm break-keep transition-all ${
                    areaType === 'business' ? 'bg-blue-100' : 'bg-gray-50'
                  }`}
                  size="default"
                  onClick={() => setAreaType('business')}>
                  <View className="flex flex-col items-center gap-1">
                    <View
                      className={`i-mdi-store text-lg ${areaType === 'business' ? 'text-foreground' : 'text-muted-foreground'}`}
                    />
                    <Text className={areaType === 'business' ? 'text-blue-600 font-medium' : 'text-foreground'}>
                      营业区
                    </Text>
                  </View>
                </Button>
                <Button
                  className={`flex-1 py-3 rounded-xl text-sm break-keep transition-all ${
                    areaType === 'production' ? 'bg-blue-100' : 'bg-gray-50'
                  }`}
                  size="default"
                  onClick={() => setAreaType('production')}>
                  <View className="flex flex-col items-center gap-1">
                    <View
                      className={`i-mdi-chef-hat text-lg ${areaType === 'production' ? 'text-foreground' : 'text-muted-foreground'}`}
                    />
                    <Text className={areaType === 'production' ? 'text-blue-600 font-medium' : 'text-foreground'}>
                      制作区
                    </Text>
                  </View>
                </Button>
              </View>
            </View>

            {/* 容量 */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-foreground mb-2 block">容量（人）</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-foreground"
                  type="number"
                  placeholder="请输入容量"
                  value={String(capacity)}
                  onInput={(e) => setCapacity(Number(e.detail.value) || 0)}
                />
              </View>
            </View>

            {/* 岗位人数 */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-foreground mb-2 block">
                岗位人数 <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-foreground"
                  type="number"
                  placeholder="请输入岗位人数"
                  value={String(positionCount)}
                  onInput={(e) => setPositionCount(Number(e.detail.value) || 1)}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">该区域需要的员工数量</Text>
            </View>

            {/* 描述 */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-foreground mb-2 block">描述</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-foreground"
                  placeholder="请输入描述（选填）"
                  value={description}
                  onInput={(e) => setDescription(e.detail.value)}
                  maxlength={200}
                  style={{height: '100px'}}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">{description.length}/200</Text>
            </View>

            {/* 状态 */}
            <View className="mb-6">
              <View className="flex items-center justify-between">
                <Text className="text-sm font-medium text-foreground">启用状态</Text>
                <Button
                  className={`px-4 py-2 rounded-lg text-sm break-keep ${isActive ? 'bg-blue-100' : 'bg-gray-300'}`}
                  size="default"
                  onClick={() => setIsActive(!isActive)}>
                  <Text className={isActive ? 'text-blue-600 font-medium' : 'text-foreground'}>
                    {isActive ? '已启用' : '已停用'}
                  </Text>
                </Button>
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex gap-3">
              <Button
                className="flex-1 bg-muted py-3 rounded-xl text-base break-keep"
                size="default"
                onClick={() => setShowDialog(false)}>
                <Text className="text-foreground font-medium">取消</Text>
              </Button>
              <Button
                className="flex-1 bg-blue-100 py-3 rounded-xl text-base break-keep"
                size="default"
                onClick={handleSave}
                disabled={loading}>
                <Text className="text-blue-600 font-medium">{loading ? '保存中...' : '保存'}</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default BusinessAreaConfigPage
