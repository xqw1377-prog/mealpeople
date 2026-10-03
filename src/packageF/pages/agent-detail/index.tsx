/**
 * Agent详情页面
 * 显示Agent信息和管理的门店列表
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {
  type AgentStats,
  deleteAgentAssignment,
  getAgentStats,
  getAgentStoresWithDetails,
  getProfileByUserId,
  type Profile
} from '@/db/api'

export default function AgentDetail() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const {agentId} = router.params

  const [agent, setAgent] = useState<Profile | null>(null)
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 加载Agent信息
  const loadAgentInfo = useCallback(async () => {
    if (!agentId) return

    setLoading(true)
    try {
      const [agentInfo, agentStats, storeList] = await Promise.all([
        getProfileByUserId(agentId),
        getAgentStats(agentId),
        getAgentStoresWithDetails(agentId)
      ])

      setAgent(agentInfo)
      setStats(agentStats)
      setStores(storeList)
    } catch (error) {
      console.error('加载Agent信息失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [agentId])

  useDidShow(() => {
    loadAgentInfo()
  })

  // 移除门店分配
  const handleRemoveStore = (assignmentId: string, storeName: string) => {
    Taro.showModal({
      title: '确认移除',
      content: `确定要移除 ${storeName} 的分配吗？`,
      success: async (res) => {
        if (res.confirm) {
          const success = await deleteAgentAssignment(assignmentId)
          if (success) {
            Taro.showToast({
              title: '移除成功',
              icon: 'success'
            })
            loadAgentInfo()
          } else {
            Taro.showToast({
              title: '移除失败',
              icon: 'error'
            })
          }
        }
      }
    })
  }

  // 分配更多门店
  const handleAssignMore = () => {
    Taro.navigateTo({
      url: `/pages/agent-assign-stores/index?agentId=${agentId}`
    })
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-sm text-gray-600">加载中...</Text>
      </View>
    )
  }

  if (!agent) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-8 text-center">
          <View className="i-mdi-alert-circle text-6xl text-gray-400 mb-4" />
          <Text className="text-lg font-bold text-gray-900 block mb-2">Agent不存在</Text>
          <Text className="text-sm text-gray-600 block">请检查链接是否正确</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
        <View className="p-4">
          {/* Agent基本信息 */}
          <View className="bg-white rounded-2xl p-6 mb-6 border-2 border-gray-100">
            <View className="flex items-start gap-4 mb-4">
              <View className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <View className="i-mdi-account text-4xl text-blue-600" />
              </View>
              <View className="flex-1">
                <View className="flex items-center gap-2 mb-2">
                  <Text className="text-xl font-bold text-gray-900">{agent.name || '未命名'}</Text>
                  <View className="bg-blue-100 px-2 py-1 rounded">
                    <Text className="text-xs text-blue-700 font-semibold">Agent</Text>
                  </View>
                </View>
                {agent.phone && <Text className="text-sm text-gray-600 block mb-1">📱 {agent.phone}</Text>}
                {agent.email && <Text className="text-sm text-gray-600 block">📧 {agent.email}</Text>}
              </View>
            </View>

            {/* 统计信息 */}
            {stats && (
              <View className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <View className="bg-blue-50 rounded-lg p-3">
                  <View className="flex items-center gap-2 mb-1">
                    <View className="i-mdi-store text-base text-blue-600" />
                    <Text className="text-xs text-blue-800">管理门店</Text>
                  </View>
                  <Text className="text-xl font-bold text-blue-900">{stats.store_count}</Text>
                </View>
                <View className="bg-green-50 rounded-lg p-3">
                  <View className="flex items-center gap-2 mb-1">
                    <View className="i-mdi-account-group text-base text-green-600" />
                    <Text className="text-xs text-green-800">管理员工</Text>
                  </View>
                  <Text className="text-xl font-bold text-green-900">{stats.employee_count}</Text>
                </View>
              </View>
            )}
          </View>

          {/* 分配更多门店按钮 */}
          <Button
            className="w-full bg-blue-600 text-white py-4 rounded-xl mb-6 break-keep text-base"
            size="default"
            onClick={handleAssignMore}>
            <View className="flex items-center justify-center gap-2">
              <View className="i-mdi-plus-circle text-xl" />
              <Text>分配更多门店</Text>
            </View>
          </Button>

          {/* 管理的门店列表 */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 block mb-4">管理的门店</Text>

            {stores.length === 0 ? (
              <View className="bg-white rounded-xl p-8 text-center">
                <View className="i-mdi-store-off text-5xl text-gray-400 mb-3" />
                <Text className="text-base font-semibold text-gray-900 block mb-2">暂未分配门店</Text>
                <Text className="text-sm text-gray-600 block">点击上方按钮为该Agent分配门店</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {stores.map((item: any) => {
                  const store = item.stores
                  if (!store) return null

                  return (
                    <View key={item.id} className="bg-white rounded-xl p-4 border-2 border-gray-100">
                      <View className="flex items-start gap-3">
                        <View className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <View className="i-mdi-store text-2xl text-green-600" />
                        </View>

                        <View className="flex-1">
                          <Text className="text-base font-bold text-gray-900 block mb-1">{store.name}</Text>
                          {store.address && (
                            <Text className="text-sm text-gray-600 block mb-2">📍 {store.address}</Text>
                          )}

                          <View className="flex items-center gap-2 mb-3">
                            <View
                              className={`px-2 py-0.5 rounded ${
                                store.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                              <Text
                                className={`text-xs font-semibold ${
                                  store.status === 'active' ? 'text-green-700' : 'text-gray-700'
                                }`}>
                                {store.status === 'active' ? '营业中' : '已关闭'}
                              </Text>
                            </View>
                            <Text className="text-xs text-gray-500">
                              分配时间：{new Date(item.assigned_at).toLocaleDateString()}
                            </Text>
                          </View>

                          <Button
                            className="w-full bg-red-50 text-red-600 py-2 rounded-lg break-keep text-sm"
                            size="default"
                            onClick={() => handleRemoveStore(item.id, store.name)}>
                            移除分配
                          </Button>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
