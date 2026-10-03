/**
 * 品牌管理页面
 * 租户管理员可以管理多个品牌
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {deleteBrand, getBrandEmployeeCount, getBrandStoreCount, getBrandsByTenantId} from '@/db/api'
import type {Brand} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

interface BrandWithStats extends Brand {
  storeCount?: number
  employeeCount?: number
}

export default function BrandManagement() {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [brands, setBrands] = useState<BrandWithStats[]>([])
  const [loading, setLoading] = useState(false)

  // 加载品牌列表
  const loadBrands = useCallback(async () => {
    if (!currentTenant?.id) return

    setLoading(true)
    try {
      const brandList = await getBrandsByTenantId(currentTenant.id)

      // 加载每个品牌的统计数据
      const brandsWithStats = await Promise.all(
        brandList.map(async (brand) => {
          const [storeCount, employeeCount] = await Promise.all([
            getBrandStoreCount(brand.id),
            getBrandEmployeeCount(brand.id)
          ])
          return {...brand, storeCount, employeeCount}
        })
      )

      setBrands(brandsWithStats)
    } catch (error) {
      console.error('加载品牌列表失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadBrands()
  })

  // 新增品牌
  const handleAddBrand = () => {
    Taro.navigateTo({
      url: '/packageA/pages/brand-add/index'
    })
  }

  // 编辑品牌
  const handleEditBrand = (brand: Brand) => {
    Taro.navigateTo({
      url: `/packageA/pages/brand-edit/index?id=${brand.id}`
    })
  }

  // 删除品牌
  const handleDeleteBrand = async (brand: BrandWithStats) => {
    // 检查是否有门店或员工
    if ((brand.storeCount || 0) > 0 || (brand.employeeCount || 0) > 0) {
      Taro.showModal({
        title: '无法删除',
        content: '该品牌下还有门店或员工，请先删除或转移后再删除品牌',
        showCancel: false
      })
      return
    }

    const result = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除品牌"${brand.name}"吗？`,
      confirmText: '删除',
      confirmColor: '#ef4444'
    })

    if (!result.confirm) return

    Taro.showLoading({title: '删除中...'})
    try {
      const success = await deleteBrand(brand.id)
      Taro.hideLoading()

      if (success) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        loadBrands()
      } else {
        Taro.showToast({title: '删除失败', icon: 'none'})
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('删除品牌失败:', error)
      Taro.showToast({title: '删除失败', icon: 'none'})
    }
  }

  if (!currentTenant) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
        <View className="bg-blue-100 border border-yellow-200 rounded-lg p-4">
          <View className="flex items-center gap-2">
            <View className="i-mdi-alert text-2xl text-yellow-600" />
            <Text className="text-yellow-800">请先在首页选择租户</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground">品牌管理</Text>
            <Text className="text-sm text-muted-foreground mt-1">管理租户下的所有品牌</Text>
          </View>

          {/* 新增品牌按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-blue-100 text-white py-3 rounded-lg break-keep text-base"
              size="default"
              onClick={handleAddBrand}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus text-xl" />
                <Text>新增品牌</Text>
              </View>
            </Button>
          </View>

          {/* 品牌列表 */}
          {loading ? (
            <View className="text-center py-8">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : brands.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-store-off text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-muted-foreground">暂无品牌</Text>
              <Text className="text-sm text-muted-foreground mt-2">点击上方按钮新增品牌</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {brands.map((brand) => (
                <View key={brand.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  {/* 品牌头部 */}
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-1">
                        <Text className="text-lg font-bold text-foreground">{brand.name}</Text>
                        {brand.status === 'active' ? (
                          <View className="bg-green-100 px-2 py-0.5 rounded">
                            <Text className="text-xs text-green-600">活跃</Text>
                          </View>
                        ) : (
                          <View className="bg-muted px-2 py-0.5 rounded">
                            <Text className="text-xs text-foreground">停用</Text>
                          </View>
                        )}
                      </View>
                      {brand.industry && <Text className="text-sm text-muted-foreground">{brand.industry}</Text>}
                    </View>
                  </View>

                  {/* 品牌描述 */}
                  {brand.description && (
                    <View className="mb-3">
                      <Text className="text-sm text-muted-foreground">{brand.description}</Text>
                    </View>
                  )}

                  {/* 统计信息 */}
                  <View className="flex items-center gap-4 mb-3 pb-3 border-b border-border">
                    <View className="flex items-center gap-1">
                      <View className="i-mdi-store text-lg text-blue-500" />
                      <Text className="text-sm text-muted-foreground">{brand.storeCount || 0} 家门店</Text>
                    </View>
                    <View className="flex items-center gap-1">
                      <View className="i-mdi-account-group text-lg text-green-500" />
                      <Text className="text-sm text-muted-foreground">{brand.employeeCount || 0} 名员工</Text>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex gap-2">
                    <Button
                      className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-sm"
                      size="default"
                      onClick={() => handleEditBrand(brand)}>
                      编辑
                    </Button>
                    <Button
                      className="flex-1 bg-blue-100 text-red-600 py-2 rounded break-keep text-sm"
                      size="default"
                      onClick={() => handleDeleteBrand(brand)}>
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
