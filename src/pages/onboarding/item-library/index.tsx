/**
 * 物品库管理页面
 * HR管理物品定义和分类
 */

import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {getEmployeeByUserId} from '@/db/api'

// 物品定义接口
interface ItemDefinition {
  id: string
  name: string
  category: string
  description?: string
  stock_quantity: number
  unit: string
  is_returnable: boolean
  created_at: string
}

export default function ItemLibrary() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ItemDefinition[]>([])
  const [searchText, setSearchText] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // 加载物品库
  const loadItems = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // TODO: 从数据库加载物品库
      // 这里使用模拟数据
      const mockItems: ItemDefinition[] = [
        {
          id: '1',
          name: '工作电脑',
          category: '办公设备',
          description: '笔记本电脑',
          stock_quantity: 10,
          unit: '台',
          is_returnable: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: '工牌',
          category: '证件',
          description: '员工工牌',
          stock_quantity: 50,
          unit: '个',
          is_returnable: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: '办公桌',
          category: '办公家具',
          description: '标准办公桌',
          stock_quantity: 20,
          unit: '张',
          is_returnable: false,
          created_at: new Date().toISOString()
        }
      ]
      setItems(mockItems)
    } catch (error) {
      console.error('加载物品库失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadItems()
  })

  // 获取所有分类
  const categories = Array.from(new Set(items.map((item) => item.category)))

  // 过滤物品
  const filteredItems = items.filter((item) => {
    const matchSearch = searchText === '' || item.name.includes(searchText) || item.description?.includes(searchText)
    const matchCategory = filterCategory === 'all' || item.category === filterCategory
    return matchSearch && matchCategory
  })

  // 添加物品
  const handleAddItem = () => {
    Taro.navigateTo({
      url: '/pages/onboarding/item-add/index'
    })
  }

  // 编辑物品
  const handleEditItem = (itemId: string) => {
    Taro.navigateTo({
      url: `/pages/onboarding/item-edit/index?id=${itemId}`
    })
  }

  // 删除物品
  const handleDeleteItem = (_itemId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确认删除该物品定义？',
      success: (res) => {
        if (res.confirm) {
          // TODO: 删除物品
          Taro.showToast({
            title: '删除成功',
            icon: 'success'
          })
          loadItems()
        }
      }
    })
  }

  if (loading) {
    return <LoadingCards />
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center mb-3">
              <View className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-database text-3xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground block mb-1">物品库管理</Text>
                <Text className="text-sm text-muted-foreground block">管理物品定义和分类</Text>
              </View>
            </View>

            {/* 统计信息 */}
            <View className="grid grid-cols-3 gap-3 mt-4">
              <View className="bg-blue-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-blue-600 block mb-1">{items.length}</Text>
                <Text className="text-xs text-muted-foreground block">物品种类</Text>
              </View>
              <View className="bg-green-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-green-600 block mb-1">{categories.length}</Text>
                <Text className="text-xs text-muted-foreground block">分类数量</Text>
              </View>
              <View className="bg-amber-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-amber-600 block mb-1">
                  {items.reduce((sum, item) => sum + item.stock_quantity, 0)}
                </Text>
                <Text className="text-xs text-muted-foreground block">库存总量</Text>
              </View>
            </View>
          </View>

          {/* 添加按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-primary text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={handleAddItem}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus-circle text-xl" />
                <Text>添加物品</Text>
              </View>
            </Button>
          </View>

          {/* 搜索和筛选 */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-border">
            <View style={{overflow: 'hidden'}} className="mb-3">
              <Input
                className="bg-muted text-foreground px-4 py-3 rounded-lg border border-border w-full"
                placeholder="搜索物品名称或描述"
                value={searchText}
                onInput={(e) => setSearchText(e.detail.value)}
              />
            </View>

            <View className="flex flex-wrap gap-2">
              <View
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  filterCategory === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFilterCategory('all')}>
                <Text className="text-sm">全部</Text>
              </View>
              {categories.map((category) => (
                <View
                  key={category}
                  className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                    filterCategory === category ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  onClick={() => setFilterCategory(category)}>
                  <Text className="text-sm">{category}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 物品列表 */}
          {filteredItems.length === 0 ? (
            <View className="bg-white rounded-xl p-8 text-center border border-border">
              <View className="i-mdi-inbox text-6xl text-muted-foreground mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无物品</Text>
              <Text className="text-sm text-muted-foreground block">点击上方按钮添加物品</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredItems.map((item) => (
                <View key={item.id} className="bg-white rounded-xl p-4 border border-border">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground block mb-1">{item.name}</Text>
                      <Text className="text-sm text-muted-foreground block">{item.description || '无描述'}</Text>
                    </View>
                    <View className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                      <Text className="text-xs font-medium">{item.category}</Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-2 mb-3">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-package text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        库存: {item.stock_quantity} {item.unit}
                      </Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <View
                        className={`${item.is_returnable ? 'i-mdi-check-circle' : 'i-mdi-close-circle'} text-base ${item.is_returnable ? 'text-green-600' : 'text-red-600'}`}
                      />
                      <Text className="text-sm text-muted-foreground">
                        {item.is_returnable ? '需归还' : '无需归还'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex gap-2">
                    <Button
                      className="flex-1 bg-primary text-white py-3 rounded-lg break-keep text-sm"
                      size="default"
                      onClick={() => handleEditItem(item.id)}>
                      编辑
                    </Button>
                    <Button
                      className="flex-1 bg-red-500 text-white py-3 rounded-lg break-keep text-sm"
                      size="default"
                      onClick={() => handleDeleteItem(item.id)}>
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
