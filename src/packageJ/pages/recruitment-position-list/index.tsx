/**
 * 职位列表页面 - 招聘管理
 */

import {Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getRecruitmentPositions} from '@/db/api-lifecycle'
import type {RecruitmentPosition} from '@/db/types-lifecycle'
import {useTenantStore} from '@/store/tenant'

export default function RecruitmentPositionList() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [positions, setPositions] = useState<RecruitmentPosition[]>([])
  const [filteredPositions, setFilteredPositions] = useState<RecruitmentPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')

  // 加载职位列表
  const loadPositions = useCallback(async () => {
    if (!currentTenant?.id) return

    setLoading(true)
    try {
      const data = await getRecruitmentPositions(currentTenant.id)
      setPositions(data)
      setFilteredPositions(data)
    } catch (error) {
      console.error('加载职位列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadPositions()
  })

  // 筛选职位
  const filterPositions = useCallback(
    (text: string, status: 'all' | 'open' | 'closed') => {
      let filtered = positions

      // 状态筛选
      if (status !== 'all') {
        filtered = filtered.filter((p) => p.status === status)
      }

      // 搜索筛选
      if (text) {
        filtered = filtered.filter(
          (p) =>
            p.title?.toLowerCase().includes(text.toLowerCase()) ||
            p.department?.toLowerCase().includes(text.toLowerCase())
        )
      }

      setFilteredPositions(filtered)
    },
    [positions]
  )

  // 搜索和筛选
  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text)
      filterPositions(text, statusFilter)
    },
    [statusFilter, filterPositions]
  )

  const handleStatusFilter = useCallback(
    (status: 'all' | 'open' | 'closed') => {
      setStatusFilter(status)
      filterPositions(searchText, status)
    },
    [searchText, filterPositions]
  )

  // 获取状态文本和颜色
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string}> = {
      open: {text: '招聘中', color: 'text-blue-600'},
      closed: {text: '已关闭', color: 'text-muted-foreground'}
    }
    return statusMap[status] || {text: '未知', color: 'text-muted-foreground'}
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 搜索框 */}
          <View className="bg-white rounded-xl p-3 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
              <View className="i-mdi-magnify text-xl text-muted-foreground mr-2" />
              <Input
                className="flex-1 text-sm text-foreground"
                placeholder="搜索职位名称或部门"
                value={searchText}
                onInput={(e) => handleSearch(e.detail.value)}
              />
            </View>
          </View>

          {/* 状态筛选 */}
          <View className="flex gap-2 mb-4">
            <View
              className={`flex-1 py-2 px-4 rounded-lg text-center ${
                statusFilter === 'all' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
              }`}
              onClick={() => handleStatusFilter('all')}>
              <Text className="text-sm font-medium">全部</Text>
            </View>
            <View
              className={`flex-1 py-2 px-4 rounded-lg text-center ${
                statusFilter === 'open' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
              }`}
              onClick={() => handleStatusFilter('open')}>
              <Text className="text-sm font-medium">招聘中</Text>
            </View>
            <View
              className={`flex-1 py-2 px-4 rounded-lg text-center ${
                statusFilter === 'closed' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
              }`}
              onClick={() => handleStatusFilter('closed')}>
              <Text className="text-sm font-medium">已关闭</Text>
            </View>
          </View>

          {/* 职位列表 */}
          {loading ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 shadow-sm text-center">
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredPositions.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 shadow-sm text-center">
              <View className="i-mdi-briefcase-outline text-4xl text-muted-foreground mb-2" />
              <Text className="text-sm text-muted-foreground">暂无职位</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredPositions.map((position) => {
                const statusInfo = getStatusInfo(position.status)
                return (
                  <View
                    key={position.id}
                    className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm"
                    onClick={() =>
                      Taro.showToast({
                        title: '职位详情功能开发中',
                        icon: 'none'
                      })
                    }>
                    <View className="flex items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground mb-1">{position.title}</Text>
                        <View className="flex items-center gap-2">
                          <View className="flex items-center">
                            <View className="i-mdi-office-building text-sm text-muted-foreground mr-1" />
                            <Text className="text-xs text-muted-foreground">{position.department || '未分配'}</Text>
                          </View>
                        </View>
                      </View>
                      <View className={`px-2 py-1 rounded-full ${statusInfo.color} bg-current/10`}>
                        <Text className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</Text>
                      </View>
                    </View>

                    {position.description && (
                      <Text className="text-sm text-muted-foreground mb-3 line-clamp-2">{position.description}</Text>
                    )}

                    {position.salary_range && (
                      <View className="flex items-center mb-3">
                        <View className="i-mdi-currency-cny text-sm text-accent mr-1" />
                        <Text className="text-sm text-accent font-medium">{position.salary_range}</Text>
                      </View>
                    )}

                    <View className="flex items-center justify-between pt-3 border-t border-border">
                      <Text className="text-xs text-muted-foreground">
                        发布时间：{new Date(position.created_at).toLocaleDateString()}
                      </Text>
                      <View className="flex items-center gap-2">
                        <View
                          className="px-3 py-1 bg-blue-100 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            Taro.navigateTo({
                              url: `/pages/recruitment-position-form/index?id=${position.id}`
                            })
                          }}>
                          <Text className="text-xs text-blue-600 font-medium">编辑</Text>
                        </View>
                        <View
                          className="px-3 py-1 bg-accent/10 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            Taro.navigateTo({url: '/packageJ/pages/recruitment-candidate-list/index'})
                          }}>
                          <Text className="text-xs text-accent font-medium">查看候选人</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>

      {/* 悬浮添加按钮 */}
      <View
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shadow-lg"
        style={{zIndex: 100}}
        onClick={() => Taro.navigateTo({url: '/packageJ/pages/recruitment-position-form/index'})}>
        <View className="i-mdi-plus text-3xl text-blue-600" />
      </View>
    </View>
  )
}
