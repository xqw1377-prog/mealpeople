/**
 * 门店管理页面
 * 添加、编辑和管理门店信息
 */

import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {EmptyState, LoadingCards, PageHeader} from '@/components/common'
import {createStore, deleteStore, getCurrentUser, getStoresByTenantId, updateStore} from '@/db/api'
import type {Profile, Store} from '@/db/types'

export default function StoreManagement() {
  const {user} = useAuth({guard: true})
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // 表单数据
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [storeStatus, setStoreStatus] = useState<number>(0)

  const statusOptions = ['正常营业', '暂停营业', '已关闭']
  const statusValues = ['active', 'suspended', 'closed']

  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const p = await getCurrentUser()
      setProfile(p)

      // 检查权限
      if (p?.role !== 'super_admin' && p?.role !== 'tenant_admin' && p?.role !== 'store_manager') {
        Taro.showModal({
          title: '权限不足',
          content: '只有管理员可以访问此页面',
          showCancel: false,
          success: () => {
            Taro.navigateBack()
          }
        })
        return
      }

      // 加载门店列表
      if (p?.tenant_id) {
        const storeList = await getStoresByTenantId(p.tenant_id)
        setStores(storeList)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadData()
  })

  const handleAdd = () => {
    setEditingStore(null)
    setStoreName('')
    setStoreAddress('')
    setStoreStatus(0)
    setShowAddForm(true)
  }

  const handleEdit = (store: Store) => {
    setEditingStore(store)
    setStoreName(store.name || '')
    setStoreAddress(store.address || '')
    setStoreStatus(statusValues.indexOf(store.status || 'active'))
    setShowAddForm(true)
  }

  const handleSave = async () => {
    if (!profile?.tenant_id) {
      Taro.showToast({
        title: '租户信息不存在',
        icon: 'none'
      })
      return
    }

    if (!storeName.trim()) {
      Taro.showToast({
        title: '请输入门店名称',
        icon: 'none'
      })
      return
    }

    try {
      if (editingStore) {
        // 更新门店
        await updateStore(editingStore.id, {
          name: storeName.trim(),
          address: storeAddress.trim() || null,
          status: statusValues[storeStatus]
        })
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        // 创建门店
        await createStore({
          tenant_id: profile.tenant_id,
          name: storeName.trim(),
          address: storeAddress.trim() || null,
          status: statusValues[storeStatus]
        })
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        })
      }

      setShowAddForm(false)
      loadData()
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  }

  const handleDelete = (store: Store) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除门店"${store.name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteStore(store.id)
            Taro.showToast({
              title: '删除成功',
              icon: 'success'
            })
            loadData()
          } catch (error) {
            console.error('删除失败:', error)
            Taro.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border bg-transparent">
          <View className="p-4 space-y-4">
            <PageHeader icon="i-mdi-store" title="门店管理" description="添加、编辑和管理门店信息" />
            <LoadingCards count={3} />
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          <PageHeader icon="i-mdi-store" title="门店管理" description="添加、编辑和管理门店信息" />

          {/* 添加按钮 */}
          {!showAddForm && (
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded break-keep text-base mb-4"
              size="default"
              onClick={handleAdd}>
              <View className="flex items-center justify-center">
                <View className="i-mdi-plus text-xl mr-2" />
                <Text>添加门店</Text>
              </View>
            </Button>
          )}

          {/* 添加/编辑表单 */}
          {showAddForm && (
            <View className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm">
              <View className="flex items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">{editingStore ? '编辑门店' : '添加门店'}</Text>
                <View className="i-mdi-close text-xl text-muted-foreground" onClick={() => setShowAddForm(false)} />
              </View>

              {/* 门店名称 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">门店名称 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    placeholder="请输入门店名称"
                    value={storeName}
                    onInput={(e) => setStoreName(e.detail.value)}
                  />
                </View>
              </View>

              {/* 门店地址 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">门店地址</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    placeholder="请输入门店地址"
                    value={storeAddress}
                    onInput={(e) => setStoreAddress(e.detail.value)}
                  />
                </View>
              </View>

              {/* 状态 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">状态</Text>
                <Picker
                  mode="selector"
                  range={statusOptions}
                  value={storeStatus}
                  onChange={(e) => setStoreStatus(Number(e.detail.value))}>
                  <View className="bg-input text-foreground px-3 py-2 rounded border border-border flex items-center justify-between">
                    <Text className="text-foreground">{statusOptions[storeStatus]}</Text>
                    <View className="i-mdi-chevron-down text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 保存按钮 */}
              <Button
                className="w-full bg-blue-100 text-white py-4 rounded break-keep text-base"
                size="default"
                onClick={handleSave}>
                保存
              </Button>
            </View>
          )}

          {/* 门店列表 */}
          {stores.length === 0 ? (
            <EmptyState icon="i-mdi-store-outline" title="暂无门店" description="点击上方按钮添加第一个门店" />
          ) : (
            <View className="space-y-3">
              {stores.map((store) => (
                <View key={store.id} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                  <View className="flex items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground mb-1">{store.name}</Text>
                      {store.address && (
                        <View className="flex items-start mb-1">
                          <View className="i-mdi-map-marker text-sm text-muted-foreground mr-1 mt-0.5" />
                          <Text className="text-sm text-muted-foreground flex-1">{store.address}</Text>
                        </View>
                      )}
                      <View className="flex items-center">
                        <View
                          className={`px-2 py-0.5 rounded ${
                            store.status === 'active'
                              ? 'bg-green-100'
                              : store.status === 'suspended'
                                ? 'bg-yellow-100'
                                : 'bg-gray-50'
                          }`}>
                          <Text
                            className={`text-xs ${
                              store.status === 'active'
                                ? 'text-muted-foreground'
                                : store.status === 'suspended'
                                  ? 'text-yellow-600'
                                  : 'text-muted-foreground'
                            }`}>
                            {statusOptions[statusValues.indexOf(store.status || 'active')]}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex gap-2 mt-3">
                    <Button
                      className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-sm"
                      size="default"
                      onClick={() => handleEdit(store)}>
                      编辑
                    </Button>
                    <Button
                      className="flex-1 bg-blue-100 text-red-600 py-2 rounded break-keep text-sm"
                      size="default"
                      onClick={() => handleDelete(store)}>
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
