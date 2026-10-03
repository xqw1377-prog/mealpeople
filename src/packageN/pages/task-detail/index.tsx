/**
 * 任务详情页面
 * 3.0 版本 - 任务管理系统
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {cancelTask, completeTask, getTaskById, startTask} from '@/db/api-task'
import {
  TASK_PRIORITY_COLORS,
  TASK_PRIORITY_ICONS,
  TASK_PRIORITY_NAMES,
  TASK_STATUS_COLORS,
  TASK_STATUS_NAMES,
  type Task
} from '@/db/types-task'

const TaskDetail: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const taskId = router.params.id

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(false)

  // 加载任务详情
  const loadTask = useCallback(async () => {
    if (!taskId) return

    setLoading(true)
    try {
      const taskData = await getTaskById(taskId)
      setTask(taskData)
    } catch (error) {
      console.error('加载任务详情失败:', error)
      Taro.showToast({
        title: '加载任务详情失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [taskId])

  // 页面显示时加载数据
  useDidShow(() => {
    loadTask()
  })

  // 开始任务
  const handleStartTask = async () => {
    if (!task) return

    try {
      await startTask(task.id)
      Taro.showToast({
        title: '任务已开始',
        icon: 'success'
      })
      loadTask()
    } catch (error) {
      console.error('开始任务失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  // 完成任务
  const handleCompleteTask = async () => {
    if (!task) return

    try {
      await completeTask(task.id)
      Taro.showToast({
        title: '任务已完成',
        icon: 'success'
      })
      loadTask()
    } catch (error) {
      console.error('完成任务失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  // 取消任务
  const handleCancelTask = async () => {
    if (!task) return

    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个任务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cancelTask(task.id)
            Taro.showToast({
              title: '任务已取消',
              icon: 'success'
            })
            loadTask()
          } catch (error) {
            console.error('取消任务失败:', error)
            Taro.showToast({
              title: '操作失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  // 格式化日期时间
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '无'
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '无截止日期'
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

  if (loading || !task) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 任务标题 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm mb-4">
            <Text className="text-2xl font-bold text-foreground mb-4">{task.title}</Text>

            {/* 状态和优先级 */}
            <View className="flex flex-row items-center gap-3 mb-4">
              <View className={`px-3 py-1 rounded-lg ${TASK_STATUS_COLORS[task.status]}`}>
                <Text className="text-sm font-medium">{TASK_STATUS_NAMES[task.status]}</Text>
              </View>
              <View className="flex flex-row items-center gap-1">
                <View
                  className={`${TASK_PRIORITY_ICONS[task.priority]} text-lg ${TASK_PRIORITY_COLORS[task.priority]}`}
                />
                <Text className={`text-sm font-medium ${TASK_PRIORITY_COLORS[task.priority]}`}>
                  {TASK_PRIORITY_NAMES[task.priority]}优先级
                </Text>
              </View>
            </View>

            {/* 截止日期 */}
            {task.due_date && (
              <View className="flex flex-row items-center gap-2 mb-2">
                <View className="i-mdi-calendar-clock text-xl text-muted-foreground" />
                <View>
                  <Text className="text-sm text-muted-foreground">截止日期</Text>
                  <Text className={`text-base font-medium ${isOverdue(task) ? 'text-destructive' : 'text-foreground'}`}>
                    {formatDate(task.due_date)}
                    {isOverdue(task) && ' (已逾期)'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 任务描述 */}
          {task.description && (
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm mb-4">
              <View className="flex flex-row items-center gap-2 mb-3">
                <View className="i-mdi-text-box-outline text-xl text-blue-600" />
                <Text className="text-lg font-semibold text-foreground">任务描述</Text>
              </View>
              <Text className="text-base text-foreground leading-relaxed">{task.description}</Text>
            </View>
          )}

          {/* 任务信息 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm mb-4">
            <View className="flex flex-row items-center gap-2 mb-4">
              <View className="i-mdi-information-outline text-xl text-blue-600" />
              <Text className="text-lg font-semibold text-foreground">任务信息</Text>
            </View>

            <View className="space-y-3">
              {/* 创建时间 */}
              <View className="flex flex-row justify-between">
                <Text className="text-sm text-muted-foreground">创建时间</Text>
                <Text className="text-sm text-foreground">{formatDateTime(task.created_at)}</Text>
              </View>

              {/* 更新时间 */}
              <View className="flex flex-row justify-between">
                <Text className="text-sm text-muted-foreground">更新时间</Text>
                <Text className="text-sm text-foreground">{formatDateTime(task.updated_at)}</Text>
              </View>

              {/* 完成时间 */}
              {task.completed_at && (
                <View className="flex flex-row justify-between">
                  <Text className="text-sm text-muted-foreground">完成时间</Text>
                  <Text className="text-sm text-success">{formatDateTime(task.completed_at)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="space-y-3">
            {task.status === 'pending' && (
              <>
                <Button
                  className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleStartTask}>
                  开始任务
                </Button>
                <Button
                  className="w-full bg-muted text-muted-foreground py-4 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleCancelTask}>
                  取消任务
                </Button>
              </>
            )}

            {task.status === 'in_progress' && (
              <>
                <Button
                  className="w-full bg-success text-blue-600 py-4 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleCompleteTask}>
                  标记完成
                </Button>
                <Button
                  className="w-full bg-muted text-muted-foreground py-4 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleCancelTask}>
                  取消任务
                </Button>
              </>
            )}

            {(task.status === 'completed' || task.status === 'cancelled') && (
              <Button
                className="w-full bg-blue-100 text-blue-600 py-4 rounded-xl break-keep text-base"
                size="default"
                onClick={() => Taro.navigateBack()}>
                返回
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default TaskDetail
