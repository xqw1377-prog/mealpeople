import {Button, ScrollView, Text, View} from '@tarojs/components'
import {navigateTo, showModal, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {EmptyState} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {deleteStore, getBrandsByTenantId, getStoresByTenantId} from '@/db/api'
import type {Brand, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

interface StoreWithBrand extends Store {
  brandName?: string
}

const Stores: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [stores, setStores] = useState<StoreWithBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [_brands, setBrands] = useState<Brand[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    if (!currentTenant) {
      navigateTo({url: '/pages/tenant-select/index'})
      return
    }

    setLoading(true)
    try {
      // 并行加载店铺和品牌数据
      const [storeData, brandData] = await Promise.all([
        getStoresByTenantId(currentTenant.id),
        getBrandsByTenantId(currentTenant.id)
      ])

      setBrands(brandData)

      // 为每个店铺添加品牌名称
      const storesWithBrand: StoreWithBrand[] = storeData.map((store) => {
        const brand = brandData.find((b) => b.id === store.brand_id)
        return {
          ...store,
          brandName: brand?.name
        }
      })

      setStores(storesWithBrand)
    } catch (error) {
      console.error('加载店铺列表失败:', error)
      showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentTenant])

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
  }, [loadData])

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const result = await showModal({
        title: '确认删除',
        content: `确定要删除店铺"${name}"吗？`,
        confirmText: '删除',
        cancelText: '取消'
      })

      if (result.confirm) {
        const success = await deleteStore(id)
        if (success) {
          showToast({title: '删除成功', icon: 'success'})
          loadData()
        } else {
          showToast({title: '删除失败', icon: 'none'})
        }
      }
    },
    [loadData]
  )

  if (!currentTenant) {
    return null
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen bg-transparent"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4">
          <View className="flex items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-foreground block mb-1">店铺管理</Text>
              <Text className="text-sm text-muted-foreground block">共 {stores.length} 家店铺</Text>
            </View>
            <Button
              className="bg-blue-100 text-white rounded-xl text-xs break-keep"
              size="mini"
              onClick={() => navigateTo({url: '/packageA/pages/store-form/index'})}>
              添加店铺
            </Button>
          </View>

          {loading ? (
            <SkeletonList count={5} />
          ) : stores.length === 0 ? (
            <EmptyState
              icon="i-mdi-store"
              title="暂无店铺"
              description="点击右上角添加店铺"
              actionText="添加店铺"
              onAction={() => navigateTo({url: '/packageA/pages/store-form/index'})}
            />
          ) : (
            <View className="space-y-3">
              {stores.map((store) => (
                <View key={store.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground block mb-1">{store.name}</Text>
                      {store.brandName && (
                        <View className="flex items-center gap-1 mt-1">
                          <View className="i-mdi-tag text-sm text-blue-500"></View>
                          <Text className="text-xs text-muted-foreground">{store.brandName}</Text>
                        </View>
                      )}
                      {store.address && (
                        <View className="flex items-start gap-1 mt-1">
                          <View className="i-mdi-map-marker text-sm text-muted-foreground mt-0.5"></View>
                          <Text className="text-xs text-muted-foreground flex-1">{store.address}</Text>
                        </View>
                      )}
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${store.status === 'active' ? 'bg-blue-100' : 'bg-gray-50'}`}>
                      <Text
                        className={`text-xs ${store.status === 'active' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        {store.status === 'active' ? '营业中' : '已关闭'}
                      </Text>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <View
                      className="flex-1 bg-blue-100 text-white rounded-xl py-2 flex items-center justify-center gap-1"
                      onClick={() => navigateTo({url: `/packageA/pages/store-form/index?id=${store.id}`})}>
                      <View className="i-mdi-pencil text-base"></View>
                      <Text className="text-sm font-medium text-muted-foreground">编辑</Text>
                    </View>
                    <View
                      className="flex-1 bg-blue-100 text-red-600 rounded-xl py-2 flex items-center justify-center gap-1"
                      onClick={() => handleDelete(store.id, store.name)}>
                      <View className="i-mdi-delete text-base"></View>
                      <Text className="text-sm font-medium text-red-600">删除</Text>
                    </View>
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

export default Stores
