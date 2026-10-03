/**
 * 物品库管理页面
 * 功能：管理入职物品库，包括添加、编辑、删除物品
 */

import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useEffect, useState} from 'react'
import {
  createOnboardingItem,
  deleteOnboardingItem,
  getTenantOnboardingItems,
  updateOnboardingItem
} from '@/db/api-interview-flow'
import type {ItemCategory, OnboardingItem} from '@/db/types-interview-flow'
import {useTenantStore} from '@/store/tenant'

export default function ItemLibrary() {
  const {currentTenant} = useTenantStore()
  const [items, setItems] = useState<OnboardingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<OnboardingItem | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<'all' | ItemCategory>('all')

  // 表单状态
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState<ItemCategory>('equipment')
  const [description, setDescription] = useState('')
  const [isRequired, setIsRequired] = useState(true)
  const [isActive, setIsActive] = useState(true)

  // 加载物品列表
  const loadItems = useCallback(async () => {
    if (!currentTenant) return

    setLoading(true)
    try {
      const data = await getTenantOnboardingItems(currentTenant.id)
      setItems(data)
    } catch (error) {
      console.error('加载物品列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadItems()
  })

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // 筛选物品
  const filteredItems = items.filter((item) => {
    if (categoryFilter === 'all') return true
    return item.item_category === categoryFilter
  })

  // 统计数据
  const stats = {
    total: items.length,
    active: items.filter((item) => item.is_active).length,
    required: items.filter((item) => item.is_required).length,
    categories: [...new Set(items.map((item) => item.item_category))].length
  }

  // 打开添加表单
  const handleAdd = () => {
    setEditingItem(null)
    setItemName('')
    setItemCategory('equipment')
    setDescription('')
    setIsRequired(true)
    setIsActive(true)
    setShowAddForm(true)
  }

  // 打开编辑表单
  const handleEdit = (item: OnboardingItem) => {
    setEditingItem(item)
    setItemName(item.item_name)
    setItemCategory(item.item_category)
    setDescription(item.description || '')
    setIsRequired(item.is_required)
    setIsActive(item.is_active)
    setShowAddForm(true)
  }

  // 保存物品
  const handleSave = async () => {
    if (!currentTenant) return

    if (!itemName.trim()) {
      Taro.showToast({
        title: '请输入物品名称',
        icon: 'none'
      })
      return
    }

    try {
      if (editingItem) {
        // 编辑模式
        await updateOnboardingItem(editingItem.id, {
          item_name: itemName,
          item_category: itemCategory,
          description: description || null,
          is_required: isRequired,
          is_active: isActive
        })
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        // 添加模式
        await createOnboardingItem({
          tenant_id: currentTenant.id,
          item_name: itemName,
          item_category: itemCategory,
          description: description || null,
          is_required: isRequired,
          is_active: isActive
        })
        Taro.showToast({
          title: '添加成功',
          icon: 'success'
        })
      }

      setShowAddForm(false)
      loadItems()
    } catch (error) {
      console.error('保存物品失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  }

  // 删除物品
  const handleDelete = async (item: OnboardingItem) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除物品"${item.item_name}"吗？此操作不可恢复。`
    })

    if (!result.confirm) return

    try {
      await deleteOnboardingItem(item.id)
      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      })
      loadItems()
    } catch (error) {
      console.error('删除物品失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  }

  // 获取分类名称
  const getCategoryName = (category: ItemCategory) => {
    const categoryMap: Record<ItemCategory, string> = {
      equipment: '设备物品',
      uniform: '工作服装',
      document: '文档资料',
      other: '其他'
    }
    return categoryMap[category]
  }

  // 获取分类颜色
  const getCategoryColor = (category: ItemCategory) => {
    const colorMap: Record<ItemCategory, string> = {
      equipment: 'bg-blue-50 text-blue-600',
      uniform: 'bg-purple-50 text-purple-600',
      document: 'bg-orange-50 text-orange-600',
      other: 'bg-gray-50 text-gray-600'
    }
    return colorMap[category]
  }

  if (!currentTenant) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Text className="text-muted-foreground">请先选择租户</Text>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen" style={{background: 'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
        <View className="max-w-7xl mx-auto p-4 pb-20">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl max-sm:text-xl font-bold text-foreground block mb-2">物品库管理</Text>
            <Text className="text-sm max-sm:text-xs text-muted-foreground block">
              管理入职物品库，设置物品分类和属性
            </Text>
          </View>

          {/* 统计卡片 */}
          <View className="grid grid-cols-2 @md:grid-cols-4 gap-3 mb-6">
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">物品总数</Text>
              <Text className="text-2xl max-sm:text-xl font-bold text-blue-600 block">{stats.total}</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">启用中</Text>
              <Text className="text-2xl max-sm:text-xl font-bold text-green-600 block">{stats.active}</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">必需物品</Text>
              <Text className="text-2xl max-sm:text-xl font-bold text-orange-600 block">{stats.required}</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">物品分类</Text>
              <Text className="text-2xl max-sm:text-xl font-bold text-purple-600 block">{stats.categories}</Text>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="mb-6">
            <Button
              className="w-full bg-primary text-white py-3 rounded-xl break-keep text-base max-sm:text-sm font-medium cursor-pointer"
              size="default"
              onClick={handleAdd}>
              <View className="i-mdi-plus text-xl mr-2" />
              添加新物品
            </Button>
          </View>

          {/* 分类筛选 */}
          <View className="mb-6">
            <ScrollView scrollX className="whitespace-nowrap">
              <View className="flex gap-2 pb-2">
                <View
                  className={`px-4 py-2 rounded-lg cursor-pointer ${
                    categoryFilter === 'all' ? 'bg-primary text-white' : 'bg-white text-foreground'
                  }`}
                  onClick={() => setCategoryFilter('all')}>
                  <Text className="text-sm max-sm:text-xs">全部</Text>
                </View>
                {(['equipment', 'uniform', 'document', 'other'] as ItemCategory[]).map((category) => (
                  <View
                    key={category}
                    className={`px-4 py-2 rounded-lg cursor-pointer ${
                      categoryFilter === category ? 'bg-primary text-white' : 'bg-white text-foreground'
                    }`}
                    onClick={() => setCategoryFilter(category)}>
                    <Text className="text-sm max-sm:text-xs">{getCategoryName(category)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 物品列表 */}
          {loading ? (
            <View className="text-center py-12">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View className="text-center py-12">
              <View className="i-mdi-package-variant text-6xl text-muted-foreground mb-4" />
              <Text className="text-muted-foreground block mb-2">暂无物品</Text>
              <Text className="text-sm text-muted-foreground">点击上方按钮添加新物品</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredItems.map((item) => (
                <View key={item.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-2">
                        <Text className="text-base max-sm:text-sm font-medium text-foreground">{item.item_name}</Text>
                        <View
                          className={`px-2 py-1 rounded text-xs max-sm:text-[10px] ${getCategoryColor(item.item_category)}`}>
                          {getCategoryName(item.item_category)}
                        </View>
                      </View>
                      {item.description && (
                        <Text className="text-sm max-sm:text-xs text-muted-foreground block mb-2">
                          {item.description}
                        </Text>
                      )}
                      <View className="flex items-center gap-3">
                        <View className="flex items-center gap-1">
                          <View
                            className={`i-mdi-${item.is_required ? 'star' : 'star-outline'} text-base ${
                              item.is_required ? 'text-orange-500' : 'text-gray-400'
                            }`}
                          />
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                            {item.is_required ? '必需' : '可选'}
                          </Text>
                        </View>
                        <View className="flex items-center gap-1">
                          <View
                            className={`i-mdi-${item.is_active ? 'check-circle' : 'close-circle'} text-base ${
                              item.is_active ? 'text-green-500' : 'text-gray-400'
                            }`}
                          />
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                            {item.is_active ? '启用' : '停用'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex gap-2">
                    <Button
                      className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg break-keep text-sm max-sm:text-xs cursor-pointer"
                      size="default"
                      onClick={() => handleEdit(item)}>
                      <View className="i-mdi-pencil text-base mr-1" />
                      编辑
                    </Button>
                    <Button
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg break-keep text-sm max-sm:text-xs cursor-pointer"
                      size="default"
                      onClick={() => handleDelete(item)}>
                      <View className="i-mdi-delete text-base mr-1" />
                      删除
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 添加/编辑表单弹窗 */}
      {showAddForm && (
        <View
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setShowAddForm(false)}>
          <View
            className="bg-white rounded-t-3xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <View className="mb-6">
              <Text className="text-xl font-bold text-foreground block">{editingItem ? '编辑物品' : '添加新物品'}</Text>
            </View>

            {/* 物品名称 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                物品名称 <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 py-2 rounded-lg border border-border w-full"
                  placeholder="请输入物品名称"
                  value={itemName}
                  onInput={(e) => setItemName(e.detail.value)}
                />
              </View>
            </View>

            {/* 物品分类 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                物品分类 <Text className="text-red-500">*</Text>
              </Text>
              <View className="grid grid-cols-2 gap-2">
                {(['equipment', 'uniform', 'document', 'other'] as ItemCategory[]).map((category) => (
                  <View
                    key={category}
                    className={`px-4 py-3 rounded-lg cursor-pointer text-center ${
                      itemCategory === category
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 text-foreground border border-border'
                    }`}
                    onClick={() => setItemCategory(category)}>
                    <Text className="text-sm">{getCategoryName(category)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 物品描述 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">物品描述</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 py-2 rounded-lg border border-border w-full"
                  placeholder="请输入物品描述（可选）"
                  value={description}
                  onInput={(e) => setDescription(e.detail.value)}
                />
              </View>
            </View>

            {/* 是否必需 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">是否必需</Text>
              <View className="flex gap-3">
                <View
                  className={`flex-1 px-4 py-3 rounded-lg cursor-pointer text-center ${
                    isRequired ? 'bg-primary text-white' : 'bg-gray-50 text-foreground border border-border'
                  }`}
                  onClick={() => setIsRequired(true)}>
                  <Text className="text-sm">必需物品</Text>
                </View>
                <View
                  className={`flex-1 px-4 py-3 rounded-lg cursor-pointer text-center ${
                    !isRequired ? 'bg-primary text-white' : 'bg-gray-50 text-foreground border border-border'
                  }`}
                  onClick={() => setIsRequired(false)}>
                  <Text className="text-sm">可选物品</Text>
                </View>
              </View>
            </View>

            {/* 是否启用 */}
            <View className="mb-6">
              <Text className="text-sm text-foreground block mb-2">物品状态</Text>
              <View className="flex gap-3">
                <View
                  className={`flex-1 px-4 py-3 rounded-lg cursor-pointer text-center ${
                    isActive ? 'bg-green-500 text-white' : 'bg-gray-50 text-foreground border border-border'
                  }`}
                  onClick={() => setIsActive(true)}>
                  <Text className="text-sm">启用</Text>
                </View>
                <View
                  className={`flex-1 px-4 py-3 rounded-lg cursor-pointer text-center ${
                    !isActive ? 'bg-gray-500 text-white' : 'bg-gray-50 text-foreground border border-border'
                  }`}
                  onClick={() => setIsActive(false)}>
                  <Text className="text-sm">停用</Text>
                </View>
              </View>
            </View>

            {/* 操作按钮 */}
            <View className="flex gap-3">
              <Button
                className="flex-1 bg-gray-100 text-foreground py-3 rounded-xl break-keep text-base cursor-pointer"
                size="default"
                onClick={() => setShowAddForm(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-primary text-white py-3 rounded-xl break-keep text-base cursor-pointer"
                size="default"
                onClick={handleSave}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
