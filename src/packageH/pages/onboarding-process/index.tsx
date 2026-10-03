/**
 * 入职流程页面 - 入职管理
 */

import {Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getOnboardingProcesses} from '@/db/api-lifecycle'
import type {OnboardingProcess} from '@/db/types-lifecycle'
import {useTenantStore} from '@/store/tenant'

export default function OnboardingProcessPage() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [processes, setProcesses] = useState<OnboardingProcess[]>([])
  const [filteredProcesses, setFilteredProcesses] = useState<OnboardingProcess[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

  // 加载入职流程列表
  const loadProcesses = useCallback(async () => {
    if (!currentTenant?.id) return

    setLoading(true)
    try {
      const data = await getOnboardingProcesses(currentTenant.id)
      setProcesses(data)
      setFilteredProcesses(data)
    } catch (error) {
      console.error('加载入职流程失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadProcesses()
  })

  // 筛选函数
  const filterProcesses = useCallback(
    (text: string, status: 'all' | 'pending' | 'in_progress' | 'completed') => {
      let filtered = processes

      // 状态筛选
      if (status !== 'all') {
        filtered = filtered.filter((p) => p.status === status)
      }

      // 搜索筛选（这里需要根据employee_id查询员工姓名，暂时跳过）
      if (text) {
        filtered = filtered.filter((p) => p.employee_id?.includes(text))
      }

      setFilteredProcesses(filtered)
    },
    [processes]
  )

  // 搜索和筛选
  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text)
      filterProcesses(text, statusFilter)
    },
    [statusFilter, filterProcesses]
  )

  const handleStatusFilter = useCallback(
    (status: 'all' | 'pending' | 'in_progress' | 'completed') => {
      setStatusFilter(status)
      filterProcesses(searchText, status)
    },
    [searchText, filterProcesses]
  )

  // 获取状态文本和颜色
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      pending: {text: '待开始', color: 'text-muted-foreground', bgColor: 'bg-gray-50'},
      in_progress: {text: '进行中', color: 'text-accent', bgColor: 'bg-accent/10'},
      completed: {text: '已完成', color: 'text-blue-600', bgColor: 'bg-green-500/10'}
    }
    return statusMap[status] || {text: '未知', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 计算进度百分比
  const calculateProgress = (process: OnboardingProcess) => {
    if (process.status === 'completed') return 100
    if (process.status === 'pending') return 0

    // 简单计算：根据开始日期和预期完成日期
    if (process.start_date && process.expected_completion_date) {
      const start = new Date(process.start_date).getTime()
      const expected = new Date(process.expected_completion_date).getTime()
      const now = Date.now()

      if (now >= expected) return 95 // 接近完成
      if (now <= start) return 5 // 刚开始

      const total = expected - start
      const elapsed = now - start
      return Math.min(Math.max(Math.round((elapsed / total) * 100), 5), 95)
    }

    return 50 // 默认50%
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 搜索框 */}
          <View className="bg-white rounded-xl p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-center bg-gray-50 rounded-lg px-3 max-sm:px-2 py-2">
              <View className="i-mdi-magnify text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
              <Input
                className="flex-1 text-sm max-sm:text-xs max-sm:text-[10px] text-foreground"
                placeholder="搜索员工"
                value={searchText}
                onInput={(e) => handleSearch(e.detail.value)}
              />
            </View>
          </View>

          {/* 状态筛选 */}
          <View className="flex gap-2 max-sm:gap-1.5 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View
              className={`flex-1 py-2 px-4 max-sm:px-3 max-sm:px-2 rounded-lg text-center ${
                statusFilter === 'all' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
              }`}
              onClick={() => handleStatusFilter('all')}>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium">全部</Text>
            </View>
            <View
              className={`flex-1 py-2 px-4 max-sm:px-3 max-sm:px-2 rounded-lg text-center ${
                statusFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-foreground'
              }`}
              onClick={() => handleStatusFilter('pending')}>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium">待开始</Text>
            </View>
            <View
              className={`flex-1 py-2 px-4 max-sm:px-3 max-sm:px-2 rounded-lg text-center ${
                statusFilter === 'in_progress' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
              }`}
              onClick={() => handleStatusFilter('in_progress')}>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium">进行中</Text>
            </View>
            <View
              className={`flex-1 py-2 px-4 max-sm:px-3 max-sm:px-2 rounded-lg text-center ${
                statusFilter === 'completed' ? 'bg-green-500 text-white' : 'bg-white text-foreground'
              }`}
              onClick={() => handleStatusFilter('completed')}>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium">已完成</Text>
            </View>
          </View>

          {/* 入职流程列表 */}
          {loading ? (
            <View className="bg-white rounded-xl p-8 max-sm:p-6 border-2 border-gray-200 shadow-md text-center">
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredProcesses.length === 0 ? (
            <View className="bg-white rounded-xl p-8 max-sm:p-6 border-2 border-gray-200 shadow-md text-center">
              <View className="i-mdi-account-clock text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">暂无入职流程</Text>
            </View>
          ) : (
            <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {filteredProcesses.map((process) => {
                const statusInfo = getStatusInfo(process.status)
                const progress = calculateProgress(process)
                return (
                  <View
                    key={process.id}
                    className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 shadow-md"
                    onClick={() =>
                      Taro.navigateTo({
                        url: `/packageH/pages/onboarding-process-detail/index?id=${process.id}`
                      })
                    }>
                    {/* 头部：员工信息和状态 */}
                    <View className="flex items-start justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      <View className="flex items-center gap-3 max-sm:gap-2 max-sm:gap-1.5">
                        <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <View className="i-mdi-account text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
                        </View>
                        <View>
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground mb-1">
                            {process.employee_id || '待分配'}
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                            入职日期：
                            {process.start_date ? new Date(process.start_date).toLocaleDateString() : '未设置'}
                          </Text>
                        </View>
                      </View>
                      <View className={`px-2 py-1 rounded-full ${statusInfo.bgColor}`}>
                        <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                          {statusInfo.text}
                        </Text>
                      </View>
                    </View>

                    {/* 进度条 */}
                    <View className="mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      <View className="flex items-center justify-between mb-2 max-sm:mb-1.5">
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground">入职进度</Text>
                        <Text className="text-xs max-sm:text-[10px] text-blue-600 font-medium">{progress}%</Text>
                      </View>
                      <View className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-blue-100 rounded-full transition-all"
                          style={{width: `${progress}%`}}
                        />
                      </View>
                    </View>

                    {/* 时间信息 */}
                    <View className="space-y-2 max-sm:space-y-1.5 mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      {process.expected_completion_date && (
                        <View className="flex items-center">
                          <View className="i-mdi-calendar-clock text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                            预计完成：{new Date(process.expected_completion_date).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                      {process.actual_completion_date && (
                        <View className="flex items-center">
                          <View className="i-mdi-calendar-check text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600">
                            实际完成：{new Date(process.actual_completion_date).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 底部：操作按钮 */}
                    <View className="flex items-center justify-end gap-2 max-sm:gap-1.5 pt-3 border-t border-border">
                      {process.status === 'in_progress' && (
                        <View
                          className="px-3 max-sm:px-2 py-1 bg-accent/10 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation()
                            Taro.showToast({
                              title: '查看任务功能开发中',
                              icon: 'none'
                            })
                          }}>
                          <Text className="text-xs max-sm:text-[10px] text-accent font-medium">查看任务</Text>
                        </View>
                      )}
                      <View
                        className="px-3 max-sm:px-2 py-1 bg-blue-100 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation()
                          Taro.showToast({
                            title: '查看详情功能开发中',
                            icon: 'none'
                          })
                        }}>
                        <Text className="text-xs max-sm:text-[10px] text-blue-600 font-medium">详情</Text>
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
        onClick={() =>
          Taro.showToast({
            title: '创建入职流程功能开发中',
            icon: 'none'
          })
        }>
        <View className="i-mdi-plus text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
      </View>
    </View>
  )
}
