/**
 * Agent管理页面
 * 管理区域经理/督导及其门店分配
 */

import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {type AgentStats, getAgentsByTenantId, getCurrentUser, getTenantAgentStats, type Profile} from '@/db/api'
import {useTenantStore} from '@/store/tenant'

export default function AgentManagement() {
  console.log('Agent管理页面开始加载')
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentUser = useTenantStore((state) => state.currentUser)
  const setCurrentUser = useTenantStore((state) => state.setCurrentUser)

  console.log('Agent管理 - 用户信息:', user?.id, '租户:', currentTenant?.id, '当前用户角色:', currentUser?.role)

  const [agents, setAgents] = useState<Profile[]>([])
  const [agentStats, setAgentStats] = useState<AgentStats[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [userLoaded, setUserLoaded] = useState(false)

  // 加载并同步用户信息
  const loadUserInfo = useCallback(async () => {
    console.log('Agent管理 - loadUserInfo开始, user?.id:', user?.id)
    if (!user?.id) {
      console.log('Agent管理 - 没有用户ID，退出loadUserInfo')
      return
    }

    try {
      console.log('Agent管理 - 正在获取当前用户信息...')
      const p = await getCurrentUser()
      console.log('Agent管理 - 获取到用户信息:', p)
      if (p) {
        setCurrentUser(p)
      }
      setUserLoaded(true)
    } catch (error) {
      console.error('Agent管理 - 加载用户信息失败:', error)
      setUserLoaded(true)
    }
  }, [user, setCurrentUser])

  // 加载Agent列表
  const loadAgents = useCallback(async () => {
    if (!currentTenant) return

    setLoading(true)
    try {
      const [agentList, stats] = await Promise.all([
        getAgentsByTenantId(currentTenant.id),
        getTenantAgentStats(currentTenant.id)
      ])

      setAgents(agentList)
      setAgentStats(stats)
    } catch (error) {
      console.error('加载Agent列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  // 页面显示时加载数据
  useDidShow(() => {
    loadUserInfo()
    loadAgents()
  })

  // 刷新数据
  const handleRefresh = () => {
    Taro.showLoading({title: '刷新中...'})
    loadAgents().finally(() => {
      Taro.hideLoading()
      Taro.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    })
  }

  // 搜索过滤
  const filteredAgents = agents.filter((agent) => {
    if (!searchText) return true
    const searchLower = searchText.toLowerCase()
    return (
      agent.name?.toLowerCase().includes(searchLower) ||
      agent.phone?.includes(searchText) ||
      agent.email?.toLowerCase().includes(searchLower)
    )
  })

  // 添加Agent
  const handleAddAgent = () => {
    Taro.navigateTo({
      url: '/packageF/pages/agent-add/index'
    })
  }

  // 查看Agent详情
  const handleViewAgent = (agentId: string) => {
    Taro.navigateTo({
      url: `/pages/agent-detail/index?agentId=${agentId}`
    })
  }

  // 分配门店
  const handleAssignStores = (agentId: string) => {
    Taro.navigateTo({
      url: `/pages/agent-assign-stores/index?agentId=${agentId}`
    })
  }

  // 获取Agent统计信息
  const getAgentStatById = (agentId: string) => {
    return agentStats.find((s) => s.agent_id === agentId)
  }

  // 权限检查 - 等待用户信息加载完成后再检查
  console.log('Agent管理 - 权限检查, userLoaded:', userLoaded, 'currentUser?.role:', currentUser?.role)
  if (!userLoaded) {
    console.log('Agent管理 - 用户信息未加载完成，显示加载界面')
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-8 text-center max-w-md">
          <View className="i-mdi-loading text-6xl text-blue-600 mb-4 animate-spin" />
          <Text className="text-lg font-bold text-gray-900 block mb-2">加载中...</Text>
          <Text className="text-sm text-gray-600 block">正在验证权限</Text>
        </View>
      </View>
    )
  }

  const canManageAgents = currentUser?.role === 'super_admin' || currentUser?.role === 'tenant_admin'
  console.log('Agent管理 - 权限检查结果, canManageAgents:', canManageAgents)

  if (!canManageAgents) {
    console.log('Agent管理 - 权限不足，显示权限不足界面')
    const roleText = currentUser?.role || '未设置'
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-8 text-center max-w-md">
          <View className="i-mdi-shield-lock text-6xl text-gray-400 mb-4" />
          <Text className="text-lg font-bold text-gray-900 block mb-2">权限不足</Text>
          <Text className="text-sm text-gray-600 block mb-4">只有管理员可以访问Agent管理功能</Text>
          <View className="bg-gray-50 rounded-lg p-4 text-left">
            <Text className="text-xs text-gray-500 block mb-1">当前角色</Text>
            <Text className="text-sm font-medium text-gray-900 block mb-3">{roleText}</Text>
            <Text className="text-xs text-gray-500 block mb-1">需要角色</Text>
            <Text className="text-sm font-medium text-gray-900 block">超级管理员 或 租户管理员</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <View className="flex items-center gap-3 mb-2">
              <View className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <View className="i-mdi-account-supervisor text-3xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 block">Agent管理</Text>
                <Text className="text-sm text-gray-600 block">区域经理/督导管理</Text>
              </View>
              {/* 刷新按钮 */}
              <View
                className="w-10 h-10 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center active:opacity-70"
                onClick={handleRefresh}>
                <View className="i-mdi-refresh text-xl text-gray-600" />
              </View>
            </View>
          </View>

          {/* 搜索框 */}
          <View className="mb-4">
            <View className="bg-white rounded-xl border-2 border-gray-200 px-4 py-3 flex items-center gap-2">
              <View className="i-mdi-magnify text-xl text-gray-400" />
              <View style={{overflow: 'hidden'}} className="flex-1">
                <Input
                  className="text-sm text-gray-900"
                  placeholder="搜索Agent姓名、手机号或邮箱"
                  value={searchText}
                  onInput={(e) => setSearchText(e.detail.value)}
                />
              </View>
              {searchText && (
                <View className="i-mdi-close-circle text-xl text-gray-400" onClick={() => setSearchText('')} />
              )}
            </View>
          </View>

          {/* 统计卡片 */}
          <View className="grid grid-cols-2 gap-3 mb-6">
            <View className="bg-white rounded-xl p-4 border-2 border-blue-100">
              <View className="flex items-center gap-2 mb-2">
                <View className="i-mdi-account-supervisor text-xl text-blue-600" />
                <Text className="text-xs text-gray-600">Agent总数</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900 block">{agents.length}</Text>
              {searchText && <Text className="text-xs text-gray-500 mt-1">搜索结果: {filteredAgents.length}</Text>}
            </View>

            <View className="bg-white rounded-xl p-4 border-2 border-green-100">
              <View className="flex items-center gap-2 mb-2">
                <View className="i-mdi-store text-xl text-green-600" />
                <Text className="text-xs text-gray-600">管理门店</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-900 block">
                {agentStats.reduce((sum, s) => sum + s.store_count, 0)}
              </Text>
            </View>
          </View>

          {/* 添加Agent按钮 */}
          <Button
            className="w-full bg-blue-600 text-white py-4 rounded-xl mb-6 break-keep text-base"
            size="default"
            onClick={handleAddAgent}>
            <View className="flex items-center justify-center gap-2">
              <View className="i-mdi-plus-circle text-xl" />
              <Text>添加Agent</Text>
            </View>
          </Button>

          {/* Agent列表 */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 block mb-4">
              Agent列表 {searchText && `(${filteredAgents.length})`}
            </Text>

            {loading ? (
              <View className="bg-white rounded-xl p-8 text-center">
                <Text className="text-sm text-gray-600">加载中...</Text>
              </View>
            ) : filteredAgents.length === 0 ? (
              <View className="bg-white rounded-xl p-8 text-center">
                <View className="i-mdi-account-off text-5xl text-gray-400 mb-3" />
                <Text className="text-base font-semibold text-gray-900 block mb-2">
                  {searchText ? '未找到匹配的Agent' : '暂无Agent'}
                </Text>
                <Text className="text-sm text-gray-600 block">
                  {searchText ? '请尝试其他搜索关键词' : '点击上方按钮添加第一个Agent'}
                </Text>
              </View>
            ) : (
              <View className="space-y-3">
                {filteredAgents.map((agent) => {
                  const stats = getAgentStatById(agent.id)
                  return (
                    <View key={agent.id} className="bg-white rounded-xl p-4 border-2 border-gray-100">
                      <View className="flex items-start gap-3">
                        {/* Agent头像 */}
                        <View className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <View className="i-mdi-account text-2xl text-blue-600" />
                        </View>

                        {/* Agent信息 */}
                        <View className="flex-1">
                          <View className="flex items-center gap-2 mb-1">
                            <Text className="text-base font-bold text-gray-900">{agent.name || '未命名'}</Text>
                            <View className="bg-blue-100 px-2 py-0.5 rounded">
                              <Text className="text-xs text-blue-700 font-semibold">Agent</Text>
                            </View>
                          </View>

                          {agent.phone && <Text className="text-sm text-gray-600 block mb-2">📱 {agent.phone}</Text>}

                          {/* 统计信息 */}
                          {stats && (
                            <View className="flex items-center gap-4 mb-3">
                              <View className="flex items-center gap-1">
                                <View className="i-mdi-store text-sm text-gray-600" />
                                <Text className="text-xs text-gray-600">{stats.store_count}个门店</Text>
                              </View>
                              <View className="flex items-center gap-1">
                                <View className="i-mdi-account-group text-sm text-gray-600" />
                                <Text className="text-xs text-gray-600">{stats.employee_count}名员工</Text>
                              </View>
                            </View>
                          )}

                          {/* 操作按钮 */}
                          <View className="flex gap-2">
                            <Button
                              className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg break-keep text-sm"
                              size="default"
                              onClick={() => handleViewAgent(agent.id)}>
                              查看详情
                            </Button>
                            <Button
                              className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg break-keep text-sm"
                              size="default"
                              onClick={() => handleAssignStores(agent.id)}>
                              分配门店
                            </Button>
                          </View>
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
                <Text className="text-sm font-semibold text-blue-900 block mb-1">什么是Agent？</Text>
                <Text className="text-xs text-blue-800 leading-relaxed block">
                  Agent是区域经理或督导角色，可以管理多个门店，查看所管理门店的运营数据和员工信息，协助租户管理员进行日常管理工作。
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
