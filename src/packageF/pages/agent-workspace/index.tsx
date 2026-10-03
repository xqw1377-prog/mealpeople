/**
 * Agent工作台
 * Agent角色专用的工作台，显示管理的门店和数据概览
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {type AgentStats, getAgentStats, getAgentStoresWithDetails} from '@/db/api'

export default function AgentWorkspace() {
  const {user} = useAuth({guard: true})

  const [stats, setStats] = useState<AgentStats | null>(null)
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 加载Agent数据
  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const [agentStats, storeList] = await Promise.all([getAgentStats(user.id), getAgentStoresWithDetails(user.id)])

      setStats(agentStats)
      setStores(storeList)
    } catch (error) {
      console.error('加载Agent数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadData()
  })

  // 刷新数据
  const handleRefresh = () => {
    Taro.showLoading({title: '刷新中...'})
    loadData().finally(() => {
      Taro.hideLoading()
      Taro.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    })
  }

  // 查看门店详情
  const handleViewStore = (storeId: string) => {
    Taro.navigateTo({
      url: `/packageD/pages/store-management/index?storeId=${storeId}`
    })
  }

  // 查看运营数据
  const handleViewOperations = () => {
    Taro.navigateTo({url: '/pages/operations/index'})
  }

  // 查看员工列表
  const handleViewEmployees = () => {
    Taro.navigateTo({url: '/packageA/pages/employee-list/index'})
  }

  // 查看排班中心
  const handleViewSchedule = () => {
    Taro.navigateTo({url: '/packageB/pages/schedule-center/index'})
  }

  // 查看成本数据（跳转到运营数据页面）
  const handleViewCost = () => {
    Taro.navigateTo({url: '/pages/operations/index'})
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #f0f9ff, #ffffff)'}}>
      <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
        <View className="p-4">
          {/* 欢迎卡片 */}
          <View className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-6 text-white relative">
            {/* 刷新按钮 */}
            <View
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center active:opacity-70"
              onClick={handleRefresh}>
              <View className="i-mdi-refresh text-lg text-white" />
            </View>

            <View className="flex items-center gap-3 mb-4">
              <View className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <View className="i-mdi-account-supervisor text-4xl text-white" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-white text-opacity-90 block mb-1">Agent工作台</Text>
                <Text className="text-2xl font-bold text-white block">{stats?.agent_name || '加载中...'}</Text>
              </View>
            </View>

            {/* 统计数据 */}
            {stats && (
              <View className="grid grid-cols-2 gap-3">
                <View className="bg-white bg-opacity-20 rounded-xl p-3">
                  <View className="flex items-center gap-2 mb-1">
                    <View className="i-mdi-store text-base text-white" />
                    <Text className="text-xs text-white text-opacity-90">管理门店</Text>
                  </View>
                  <Text className="text-2xl font-bold text-white">{stats.store_count}</Text>
                </View>
                <View className="bg-white bg-opacity-20 rounded-xl p-3">
                  <View className="flex items-center gap-2 mb-1">
                    <View className="i-mdi-account-group text-base text-white" />
                    <Text className="text-xs text-white text-opacity-90">管理员工</Text>
                  </View>
                  <Text className="text-2xl font-bold text-white">{stats.employee_count}</Text>
                </View>
              </View>
            )}
          </View>

          {/* 快捷功能 */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 block mb-4">快捷功能</Text>
            <View className="grid grid-cols-2 gap-3">
              <View
                className="bg-white rounded-xl p-4 border-2 border-gray-100 active:opacity-70"
                onClick={handleViewOperations}>
                <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                  <View className="i-mdi-chart-line text-2xl text-blue-600" />
                </View>
                <Text className="text-sm font-bold text-gray-900 block mb-1">运营数据</Text>
                <Text className="text-xs text-gray-600">查看门店运营</Text>
              </View>

              <View
                className="bg-white rounded-xl p-4 border-2 border-gray-100 active:opacity-70"
                onClick={handleViewEmployees}>
                <View className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <View className="i-mdi-account-group text-2xl text-green-600" />
                </View>
                <Text className="text-sm font-bold text-gray-900 block mb-1">员工管理</Text>
                <Text className="text-xs text-gray-600">查看员工信息</Text>
              </View>

              <View
                className="bg-white rounded-xl p-4 border-2 border-gray-100 active:opacity-70"
                onClick={handleViewSchedule}>
                <View className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                  <View className="i-mdi-calendar-clock text-2xl text-purple-600" />
                </View>
                <Text className="text-sm font-bold text-gray-900 block mb-1">排班管理</Text>
                <Text className="text-xs text-gray-600">查看排班情况</Text>
              </View>

              <View
                className="bg-white rounded-xl p-4 border-2 border-gray-100 active:opacity-70"
                onClick={handleViewCost}>
                <View className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
                  <View className="i-mdi-currency-usd text-2xl text-orange-600" />
                </View>
                <Text className="text-sm font-bold text-gray-900 block mb-1">成本分析</Text>
                <Text className="text-xs text-gray-600">查看成本数据</Text>
              </View>
            </View>
          </View>

          {/* 管理的门店列表 */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 block mb-4">我管理的门店</Text>

            {loading ? (
              <View className="bg-white rounded-xl p-8 text-center">
                <Text className="text-sm text-gray-600">加载中...</Text>
              </View>
            ) : stores.length === 0 ? (
              <View className="bg-white rounded-xl p-8 text-center">
                <View className="i-mdi-store-off text-5xl text-gray-400 mb-3" />
                <Text className="text-base font-semibold text-gray-900 block mb-2">暂无分配门店</Text>
                <Text className="text-sm text-gray-600 block">请联系管理员为您分配门店</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {stores.map((item: any) => {
                  const store = item.stores
                  if (!store) return null

                  return (
                    <View key={item.id} className="bg-white rounded-xl p-4 border-2 border-gray-100">
                      <View className="flex items-start gap-3">
                        <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <View className="i-mdi-store text-2xl text-blue-600" />
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
                          </View>

                          <Button
                            className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg break-keep text-sm"
                            size="default"
                            onClick={() => handleViewStore(store.id)}>
                            查看详情
                          </Button>
                        </View>
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 帮助提示 */}
          <View className="bg-blue-50 rounded-xl p-4">
            <View className="flex items-start gap-2">
              <View className="i-mdi-information text-xl text-blue-600 flex-shrink-0 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-blue-900 block mb-1">Agent职责</Text>
                <Text className="text-xs text-blue-800 leading-relaxed block">
                  作为Agent，您可以查看和管理所分配门店的运营数据、员工信息、排班情况等，协助租户管理员进行日常管理工作。
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
