/**
 * 任务列表页面
 * 3.0 版本 - 任务管理系统
 */

import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {EmptySearchResults, EmptyTasks} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {getEmployeeByUserId} from '@/db/api'
import {completeTask, getTasks} from '@/db/api-task'
import type {Employee} from '@/db/types'
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_ICONS,
  TASK_PRIORITY_NAMES,
  TASK_STATUS_COLORS,
  TASK_STATUS_NAMES,
  type Task,
  type TaskStatus
} from '@/db/types-task'
import {useTenantStore} from '@/store/tenant'

const Tasks: React.FC = () => {
  const {user} = useAuth({guard: true})
  const _currentTenant = useTenantStore((state) => state.currentTenant)

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')

  // 加载员工信息
  const loadEmployee = useCallback(async () => {
    if (!user?.id) return

    try {
      const emp = await getEmployeeByUserId(user.id)
      setEmployee(emp)
    } catch (error) {
      console.error('加载员工信息失败:', error)
      Taro.showToast({
        title: '加载员工信息失败',
        icon: 'none'
      })
    }
  }, [user?.id])

  // 加载任务列表
  const loadTasks = useCallback(async () => {
    if (!employee?.id) return

    setLoading(true)
    try {
      const options = activeTab !== 'all' ? {status: activeTab} : undefined
      const taskList = await getTasks(employee.id, options)
      setTasks(taskList)
    } catch (error) {
      console.error('加载任务列表失败:', error)
      Taro.showToast({
        title: '加载任务列表失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [employee?.id, activeTab])

  // 页面显示时加载数据
  useDidShow(() => {
    loadEmployee()
  })

  // 员工信息加载后，加载任务列表
  useEffect(() => {
    if (employee) {
      loadTasks()
    }
  }, [employee, loadTasks])

  // 状态筛选变化时，重新加载任务
  useEffect(() => {
    if (employee) {
      loadTasks()
    }
  }, [employee, loadTasks])

  // 下拉刷新处理
  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await loadEmployee()
      await loadTasks()
      setTimeout(() => {
        setRefreshing(false)
        Taro.showToast({title: '刷新成功', icon: 'success', duration: 1500})
      }, 500)
    } catch (_error) {
      setRefreshing(false)
      Taro.showToast({title: '刷新失败', icon: 'error'})
    }
  }

  // 完成任务
  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId)
      Taro.showToast({
        title: '任务已完成',
        icon: 'success'
      })
      loadTasks()
    } catch (error) {
      console.error('完成任务失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  // 清空搜索
  const handleClearSearch = () => {
    setSearchKeyword('')
  }

  // 查看任务详情
  const handleViewTask = (taskId: string) => {
    Taro.navigateTo({url: `/pages/task-detail/index?id=${taskId}`})
  }

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '无截止日期'
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return '今天'
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return '明天'
    }
    return dateStr
  }

  // 判断是否逾期
  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed' || task.status === 'cancelled') {
      return false
    }
    const today = new Date().toISOString().split('T')[0]
    return task.due_date < today
  }

  // 筛选和搜索任务
  const displayTasks = useMemo(() => {
    // 先按状态筛选
    let result = tasks.filter((task) => {
      if (activeTab === 'all') return true
      return task.status === activeTab
    })

    // 再按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim()
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(keyword) ||
          task.description?.toLowerCase().includes(keyword) ||
          TASK_PRIORITY_NAMES[task.priority].toLowerCase().includes(keyword) ||
          TASK_STATUS_NAMES[task.status].toLowerCase().includes(keyword)
      )
    }

    return result
  }, [tasks, activeTab, searchKeyword])

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen box-border bg-transparent"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4">
          {/* 标题 */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground">任务管理</Text>
            <Text className="text-sm text-muted-foreground mt-1">管理您的日常工作任务</Text>
          </View>

          {/* 搜索框 */}
          <View className="mb-4">
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 flex flex-row items-center">
              <View className="i-mdi-magnify text-xl text-muted-foreground mr-2" />
              <View className="flex-1" style={{overflow: 'hidden'}}>
                <Input
                  className="text-sm text-foreground"
                  placeholder="搜索任务标题、描述、优先级..."
                  value={searchKeyword}
                  onInput={(e) => setSearchKeyword(e.detail.value)}
                />
              </View>
              {searchKeyword && (
                <View className="i-mdi-close-circle text-xl text-muted-foreground ml-2" onClick={handleClearSearch} />
              )}
            </View>
            {searchKeyword && (
              <Text className="text-xs text-muted-foreground mt-2">找到 {displayTasks.length} 个相关任务</Text>
            )}
          </View>

          {/* 状态筛选标签 */}
          <View className="flex flex-row gap-2 mb-6 overflow-x-auto">
            <View
              className={`px-4 py-2 rounded-full ${activeTab === 'all' ? 'bg-green-500 text-white' : 'bg-white text-foreground'}`}
              onClick={() => setActiveTab('all')}>
              <Text className={activeTab === 'all' ? 'text-white' : 'text-foreground'}>全部</Text>
            </View>
            <View
              className={`px-4 py-2 rounded-full ${activeTab === 'pending' ? 'bg-green-500 text-white' : 'bg-white text-foreground'}`}
              onClick={() => setActiveTab('pending')}>
              <Text className={activeTab === 'pending' ? 'text-white' : 'text-foreground'}>待开始</Text>
            </View>
            <View
              className={`px-4 py-2 rounded-full ${activeTab === 'in_progress' ? 'bg-yellow-500 text-white' : 'bg-white text-foreground'}`}
              onClick={() => setActiveTab('in_progress')}>
              <Text className={activeTab === 'in_progress' ? 'text-white' : 'text-foreground'}>进行中</Text>
            </View>
            <View
              className={`px-4 py-2 rounded-full ${activeTab === 'completed' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'}`}
              onClick={() => setActiveTab('completed')}>
              <Text className={activeTab === 'completed' ? 'text-blue-600' : 'text-foreground'}>已完成</Text>
            </View>
          </View>

          {/* 任务列表 */}
          {loading ? (
            <View className="px-4">
              <SkeletonList count={5} />
            </View>
          ) : displayTasks.length === 0 ? (
            searchKeyword ? (
              <EmptySearchResults keyword={searchKeyword} />
            ) : (
              <EmptyTasks />
            )
          ) : (
            <View className="space-y-3">
              {displayTasks.map((task) => (
                <View key={task.id} className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  {/* 任务头部 */}
                  <View className="flex flex-row items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">{task.title}</Text>
                      {task.description && (
                        <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>
                          {task.description}
                        </Text>
                      )}
                    </View>
                    <View className="flex flex-row items-center gap-1 ml-2">
                      <View
                        className={`${TASK_PRIORITY_ICONS[task.priority]} text-xl ${TASK_PRIORITY_COLORS[task.priority]}`}
                      />
                    </View>
                  </View>

                  {/* 任务信息 */}
                  <View className="flex flex-row items-center gap-4 mb-3">
                    {/* 状态 */}
                    <View className="flex flex-row items-center gap-1">
                      <View className={`px-2 py-1 rounded ${TASK_STATUS_COLORS[task.status]}`}>
                        <Text className="text-xs">{TASK_STATUS_NAMES[task.status]}</Text>
                      </View>
                    </View>

                    {/* 优先级 */}
                    <View className="flex flex-row items-center gap-1">
                      <Text className={`text-xs ${TASK_PRIORITY_COLORS[task.priority]}`}>
                        {TASK_PRIORITY_NAMES[task.priority]}优先级
                      </Text>
                    </View>

                    {/* 截止日期 */}
                    {task.due_date && (
                      <View className="flex flex-row items-center gap-1">
                        <View className="i-mdi-calendar-clock text-sm text-muted-foreground" />
                        <Text className={`text-xs ${isOverdue(task) ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {formatDate(task.due_date)}
                          {isOverdue(task) && ' (逾期)'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex flex-row gap-2">
                    <Button
                      className="flex-1 bg-blue-100 text-blue-600 py-2 rounded-lg break-keep text-sm"
                      size="default"
                      onClick={() => handleViewTask(task.id)}>
                      查看详情
                    </Button>
                    {task.status !== 'completed' && task.status !== 'cancelled' && (
                      <Button
                        className="flex-1 bg-success/10 text-success py-2 rounded-lg break-keep text-sm"
                        size="default"
                        onClick={() => handleCompleteTask(task.id)}>
                        标记完成
                      </Button>
                    )}
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

export default Tasks
