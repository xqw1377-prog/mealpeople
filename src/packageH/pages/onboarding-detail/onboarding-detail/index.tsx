/**
 * 入职详情页面 - 入职管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getOnboardingTasks, updateOnboardingProcess} from '@/db/api-lifecycle'
import type {OnboardingProcess, OnboardingProcessStatus, OnboardingTask} from '@/db/types-lifecycle'

export default function OnboardingDetail() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const processId = router.params.id || ''

  const [process, setProcess] = useState<OnboardingProcess | null>(null)
  const [tasks, setTasks] = useState<OnboardingTask[]>([])
  const [loading, setLoading] = useState(true)

  // 加载入职详情
  const loadProcess = useCallback(async () => {
    if (!processId) return

    setLoading(true)
    try {
      // 获取入职流程信息
      const {data: processData, error: processError} = await supabase
        .from('onboarding_processes')
        .select('*, candidates(*)')
        .eq('id', processId)
        .maybeSingle()

      if (processError) throw processError
      setProcess(processData)

      // 获取入职任务
      const taskData = await getOnboardingTasks(processId)
      setTasks(taskData)
    } catch (error) {
      console.error('加载入职详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [processId])

  useDidShow(() => {
    loadProcess()
  })

  // 更新入职状态
  const handleUpdateStatus = async (newStatus: OnboardingProcessStatus) => {
    if (!process) return

    try {
      await updateOnboardingProcess(process.id, {status: newStatus})
      Taro.showToast({
        title: '状态更新成功',
        icon: 'success'
      })
      loadProcess()
    } catch (error) {
      console.error('更新状态失败:', error)
      Taro.showToast({
        title: '更新失败',
        icon: 'none'
      })
    }
  }

  // 获取状态文本和颜色
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      pending: {text: '待开始', color: 'text-muted-foreground', bgColor: 'bg-gray-50'},
      in_progress: {text: '进行中', color: 'text-accent', bgColor: 'bg-accent/10'},
      completed: {text: '已完成', color: 'text-blue-600', bgColor: 'bg-green-500/10'}
    }
    return statusMap[status] || {text: '未知', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 计算任务完成进度
  const calculateProgress = () => {
    if (tasks.length === 0) return 0
    const completedTasks = tasks.filter((task) => task.status === 'completed').length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!process) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">入职流程不存在</Text>
      </View>
    )
  }

  const statusInfo = getStatusInfo(process.status)
  const progress = calculateProgress()

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 候选人信息卡片 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <View className="i-mdi-account text-4xl max-sm:text-3xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  员工ID: {process.employee_id || process.candidate_id || '未知'}
                </Text>
                <View className={`px-2 py-1 rounded-full ${statusInfo.bgColor} inline-block`}>
                  <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                    {statusInfo.text}
                  </Text>
                </View>
              </View>
            </View>

            {/* 入职信息 */}
            <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {process.start_date && (
                <View className="flex items-center">
                  <View className="i-mdi-calendar text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-3 max-sm:mr-2" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                    入职日期：{new Date(process.start_date).toLocaleDateString()}
                  </Text>
                </View>
              )}
              {process.expected_completion_date && (
                <View className="flex items-center">
                  <View className="i-mdi-briefcase text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-3 max-sm:mr-2" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                    预计完成：{new Date(process.expected_completion_date).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 入职进度 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="flex items-center">
                <View className="i-mdi-chart-line text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                  入职进度
                </Text>
              </View>
              <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                {progress}%
              </Text>
            </View>

            {/* 进度条 */}
            <View className="bg-muted rounded-full h-3 mb-3 max-sm:mb-2 max-sm:mb-1.5 overflow-hidden">
              <View className="bg-blue-100 h-full rounded-full transition-all" style={{width: `${progress}%`}} />
            </View>

            <View className="flex items-center justify-between text-xs max-sm:text-[10px] text-muted-foreground">
              <Text>
                已完成 {tasks.filter((t) => t.status === 'completed').length} / {tasks.length} 项任务
              </Text>
              {process.expected_completion_date && (
                <Text>预计完成：{new Date(process.expected_completion_date).toLocaleDateString()}</Text>
              )}
            </View>
          </View>

          {/* 入职任务列表 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="flex items-center">
                <View className="i-mdi-checkbox-marked-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                  入职任务
                </Text>
              </View>
              <View
                className="px-3 max-sm:px-2 py-1 bg-blue-100 rounded-lg"
                onClick={() =>
                  Taro.showToast({
                    title: '添加任务功能开发中',
                    icon: 'none'
                  })
                }>
                <Text className="text-xs max-sm:text-[10px] text-blue-600 font-medium">添加任务</Text>
              </View>
            </View>

            {tasks.length === 0 ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-clipboard-outline text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">暂无入职任务</Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {tasks.map((task) => (
                  <View
                    key={task.id}
                    className="bg-gray-50 rounded-lg p-3 flex items-start"
                    onClick={() =>
                      Taro.showToast({
                        title: '任务详情功能开发中',
                        icon: 'none'
                      })
                    }>
                    <View
                      className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 max-sm:mr-2 mt-0.5 ${
                        task.status === 'completed' ? 'bg-green-500' : 'bg-gray-50'
                      }`}>
                      {task.status === 'completed' && (
                        <View className="i-mdi-check text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium mb-1 ${
                          task.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'
                        }`}>
                        {task.task_name}
                      </Text>
                      {task.description && (
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5">
                          {task.description}
                        </Text>
                      )}
                      <View className="flex items-center justify-between">
                        {task.status === 'completed' && task.completed_at && (
                          <Text className="text-xs max-sm:text-[10px] text-blue-600">
                            已完成 {new Date(task.completed_at).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 操作按钮 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground mb-3 max-sm:mb-2 max-sm:mb-1.5">
              状态操作
            </Text>
            <View className="grid grid-cols-2 gap-3 max-sm:gap-2 max-sm:gap-1.5">
              {process.status === 'pending' && (
                <View
                  className="col-span-2 bg-accent/10 rounded-lg p-3 flex flex-col items-center justify-center"
                  onClick={() => handleUpdateStatus('in_progress')}>
                  <View className="i-mdi-play-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-accent mb-1" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-accent">开始入职</Text>
                </View>
              )}

              {process.status === 'in_progress' && (
                <>
                  <View
                    className="bg-blue-100 rounded-lg p-3 flex flex-col items-center justify-center"
                    onClick={() => handleUpdateStatus('completed')}>
                    <View className="i-mdi-check-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mb-1" />
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-blue-600">
                      完成入职
                    </Text>
                  </View>
                  <View
                    className="bg-muted rounded-lg p-3 flex flex-col items-center justify-center"
                    onClick={() => handleUpdateStatus('pending')}>
                    <View className="i-mdi-pause-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-1" />
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground">
                      暂停
                    </Text>
                  </View>
                </>
              )}

              {process.status === 'completed' && (
                <View className="col-span-2 bg-blue-100 rounded-lg p-3 flex flex-col items-center justify-center">
                  <View className="i-mdi-check-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mb-1" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-blue-600">
                    入职已完成
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
