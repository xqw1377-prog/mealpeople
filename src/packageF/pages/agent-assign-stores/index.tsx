/**
 * Agent分配门店页面
 * 为Agent分配管理的门店
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {batchAssignAgent, getAgentAssignments, getStoresByTenantId, type Store} from '@/db/api'
import {useTenantStore} from '@/store/tenant'

export default function AgentAssignStores() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const {agentId} = router.params
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [stores, setStores] = useState<Store[]>([])
  const [assignedStoreIds, setAssignedStoreIds] = useState<Set<string>>(new Set())
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // 加载门店列表和已分配的门店
  const loadStores = useCallback(async () => {
    if (!currentTenant || !agentId) return

    try {
      const [allStores, assignments] = await Promise.all([
        getStoresByTenantId(currentTenant.id),
        getAgentAssignments(agentId)
      ])

      setStores(allStores)
      setAssignedStoreIds(new Set(assignments.map((a) => a.store_id)))
    } catch (error) {
      console.error('加载门店列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  }, [currentTenant, agentId])

  useEffect(() => {
    loadStores()
  }, [loadStores])

  // 切换门店选择
  const toggleStore = (storeId: string) => {
    const newSelected = new Set(selectedStoreIds)
    if (newSelected.has(storeId)) {
      newSelected.delete(storeId)
    } else {
      newSelected.add(storeId)
    }
    setSelectedStoreIds(newSelected)
  }

  // 提交分配
  const handleSubmit = async () => {
    if (selectedStoreIds.size === 0) {
      Taro.showToast({
        title: '请选择门店',
        icon: 'none'
      })
      return
    }

    if (!user?.id) {
      Taro.showToast({
        title: '用户信息错误',
        icon: 'error'
      })
      return
    }

    setLoading(true)
    try {
      const storeIdsArray = Array.from(selectedStoreIds)
      await batchAssignAgent(agentId!, storeIdsArray, user.id)

      Taro.showToast({
        title: '分配成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('分配门店失败:', error)
      Taro.showToast({
        title: '分配失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 可分配的门店（排除已分配的）
  const availableStores = stores.filter((store) => !assignedStoreIds.has(store.id))

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <View className="flex items-center gap-3 mb-2">
              <View className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <View className="i-mdi-store-plus text-3xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 block">分配门店</Text>
                <Text className="text-sm text-gray-600 block">选择要分配给Agent的门店</Text>
              </View>
            </View>
          </View>

          {/* 选择统计 */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <View className="flex items-center justify-between">
              <Text className="text-sm text-blue-900">
                已选择 <Text className="font-bold text-lg">{selectedStoreIds.size}</Text> 个门店
              </Text>
              {selectedStoreIds.size > 0 && (
                <Button
                  className="bg-blue-100 text-blue-600 px-4 py-1 rounded-lg break-keep text-xs"
                  size="default"
                  onClick={() => setSelectedStoreIds(new Set())}>
                  清空选择
                </Button>
              )}
            </View>
          </View>

          {/* 门店列表 */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 block mb-4">可分配门店</Text>

            {availableStores.length === 0 ? (
              <View className="bg-white rounded-xl p-8 text-center">
                <View className="i-mdi-store-off text-5xl text-gray-400 mb-3" />
                <Text className="text-base font-semibold text-gray-900 block mb-2">暂无可分配门店</Text>
                <Text className="text-sm text-gray-600 block">所有门店都已分配给该Agent</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {availableStores.map((store) => {
                  const isSelected = selectedStoreIds.has(store.id)
                  return (
                    <View
                      key={store.id}
                      className={`bg-white rounded-xl p-4 border-2 ${
                        isSelected ? 'border-blue-500' : 'border-gray-100'
                      }`}
                      onClick={() => toggleStore(store.id)}>
                      <View className="flex items-start gap-3">
                        {/* 选择框 */}
                        <View
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                          }`}>
                          {isSelected && <View className="i-mdi-check text-base text-white" />}
                        </View>

                        {/* 门店信息 */}
                        <View className="flex-1">
                          <Text className="text-base font-bold text-gray-900 block mb-1">{store.name}</Text>
                          {store.address && (
                            <Text className="text-sm text-gray-600 block mb-2">📍 {store.address}</Text>
                          )}
                          <View
                            className={`inline-flex px-2 py-0.5 rounded ${
                              store.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                            <Text
                              className={`text-xs font-semibold ${
                                store.status === 'active' ? 'text-green-700' : 'text-gray-700'
                              }`}>
                              {store.status === 'active' ? '营业中' : '已关闭'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 提交按钮 */}
          {availableStores.length > 0 && (
            <Button
              className="w-full bg-blue-600 text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={handleSubmit}
              disabled={loading || selectedStoreIds.size === 0}>
              {loading ? '提交中...' : `确认分配 (${selectedStoreIds.size})`}
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
