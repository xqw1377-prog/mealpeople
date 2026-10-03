/**
 * 入职任务页面 - 入职管理
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {useTenantStore} from '@/store/tenant'

interface OnboardingTaskWithProcess {
  id: string
  process_id: string
  task_name: string
  description: string | null
  task_type: string | null
  status: string
  completed_at: string | null
  created_at: string
  onboarding_processes?: {
    candidate_id: string
    status: string
    expected_completion_date: string | null
    candidates?: {
      name: string
      position: string
      department: string
    }
  }
}

export default function OnboardingTasks() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [tasks, setTasks] = useState<OnboardingTaskWithProcess[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  // 加载任务列表
  const loadTasks = useCallback(async () => {
    if (!currentTenant) return

    setLoading(true)
    try {
      const {data, error} = await supabase
        .from('onboarding_tasks')
        .select(
          `
          *,
          onboarding_processes!inner(
            candidate_id,
            status,
            expected_completion_date,
            tenant_id,
            candidates(name, position, department)
          )
        `
        )
        .eq('onboarding_processes.tenant_id', currentTenant.id)
        .order('created_at', {ascending: false})

      if (error) throw error
      setTasks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载任务列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadTasks()
  })

  // 切换任务完成状态
  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      const {error} = await supabase
        .from('onboarding_tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          completed_by: newStatus === 'completed' ? user?.id : null
        })
        .eq('id', taskId)

      if (error) throw error

      Taro.showToast({
        title: newStatus === 'completed' ? '任务已完成' : '已取消完成',
        icon: 'success'
      })

      loadTasks()
    } catch (error) {
      console.error('更新任务状态失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  // 筛选任务
  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true
    if (filter === 'pending') return task.status === 'pending'
    if (filter === 'completed') return task.status === 'completed'
    return true
  })

  // 统计数据
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    completed: tasks.filter((t) => t.status === 'completed').length
  }

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 统计卡片 */}
          <View className="grid grid-cols-3 gap-3 max-sm:gap-2 max-sm:gap-1.5 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-md">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">总任务</Text>
              <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                {stats.total}
              </Text>
            </View>
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-md">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">待完成</Text>
              <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-accent">
                {stats.pending}
              </Text>
            </View>
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-md">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">已完成</Text>
              <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                {stats.completed}
              </Text>
            </View>
          </View>

          {/* 筛选器 */}
          <View className="flex gap-2 max-sm:gap-1.5 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <Button
              className={`flex-1 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px] ${
                filter === 'all' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
              }`}
              size="default"
              onClick={() => setFilter('all')}>
              全部
            </Button>
            <Button
              className={`flex-1 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px] ${
                filter === 'pending' ? 'bg-accent text-blue-600' : 'bg-white text-foreground'
              }`}
              size="default"
              onClick={() => setFilter('pending')}>
              待完成
            </Button>
            <Button
              className={`flex-1 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px] ${
                filter === 'completed' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
              }`}
              size="default"
              onClick={() => setFilter('completed')}>
              已完成
            </Button>
          </View>

          {/* 任务列表 */}
          {loading ? (
            <View className="bg-white rounded-xl p-8 max-sm:p-6 border-2 border-gray-200 text-center">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredTasks.length === 0 ? (
            <View className="bg-white rounded-xl p-8 max-sm:p-6 border-2 border-gray-200 text-center">
              <View className="i-mdi-clipboard-text-outline text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5 mx-auto" />
              <Text className="text-muted-foreground">暂无任务</Text>
            </View>
          ) : (
            <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {filteredTasks.map((task) => (
                <View key={task.id} className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 shadow-md">
                  {/* 任务头部 */}
                  <View className="flex items-start justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                    <View className="flex-1">
                      <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground mb-1">
                        {task.task_name}
                      </Text>
                      {task.description && (
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                          {task.description}
                        </Text>
                      )}
                    </View>
                    <View
                      className={`px-3 max-sm:px-2 py-1 rounded-full ${
                        task.status === 'completed' ? 'bg-green-500/10' : 'bg-accent/10'
                      }`}>
                      <Text
                        className={`text-xs max-sm:text-[10px] font-medium ${
                          task.status === 'completed' ? 'text-blue-600' : 'text-accent'
                        }`}>
                        {task.status === 'completed' ? '已完成' : '待完成'}
                      </Text>
                    </View>
                  </View>

                  {/* 员工信息 */}
                  {task.onboarding_processes?.candidates && (
                    <View className="bg-gray-50/50 rounded-lg p-3 mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      <View className="flex items-center gap-2 max-sm:gap-1.5 mb-1">
                        <View className="i-mdi-account text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                          {task.onboarding_processes.candidates.name}
                        </Text>
                      </View>
                      <View className="flex items-center gap-2 max-sm:gap-1.5">
                        <View className="i-mdi-briefcase text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                          {task.onboarding_processes.candidates.department} -{' '}
                          {task.onboarding_processes.candidates.position}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 任务详情 */}
                  <View className="flex items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                    {task.task_type && (
                      <View className="flex items-center gap-1">
                        <View className="i-mdi-tag text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground">{task.task_type}</Text>
                      </View>
                    )}
                    {task.onboarding_processes?.expected_completion_date && (
                      <View className="flex items-center gap-1">
                        <View className="i-mdi-calendar text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                          预计完成: {formatDate(task.onboarding_processes.expected_completion_date)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* 操作按钮 */}
                  <Button
                    className={`w-full py-3 max-sm:py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px] ${
                      task.status === 'completed' ? 'bg-muted text-muted-foreground' : 'bg-blue-100 text-white'
                    }`}
                    size="default"
                    onClick={() => toggleTaskStatus(task.id, task.status)}>
                    {task.status === 'completed' ? '取消完成' : '标记为完成'}
                  </Button>
                </View>
              ))}
            </View>
          )}

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
