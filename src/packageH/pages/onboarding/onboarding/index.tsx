/**
 * 我的入职页面 - 员工入职管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {completeOnboardingTask, getEmployeeOnboardingData, isTaskOverdue} from '@/db/api-onboarding'
import type {OnboardingData} from '@/db/types-onboarding'
import {
  ONBOARDING_APPLICATION_STATUS_COLORS,
  ONBOARDING_APPLICATION_STATUS_NAMES,
  ONBOARDING_DOCUMENT_STATUS_COLORS,
  ONBOARDING_DOCUMENT_STATUS_NAMES,
  ONBOARDING_DOCUMENT_TYPE_NAMES,
  ONBOARDING_TASK_PRIORITY_COLORS,
  ONBOARDING_TASK_PRIORITY_NAMES,
  ONBOARDING_TASK_STATUS_COLORS,
  ONBOARDING_TASK_STATUS_NAMES,
  ONBOARDING_TASK_TYPE_NAMES
} from '@/db/types-onboarding'

export default function MyOnboarding() {
  const {user} = useAuth({guard: true})
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadOnboardingData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      const data = await getEmployeeOnboardingData(employee.id)
      setOnboardingData(data)
    } catch (error) {
      console.error('加载入职数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadOnboardingData()
  })

  const handleCompleteTask = async (taskId: string) => {
    if (!user?.id) return

    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) return

      const success = await completeOnboardingTask(taskId, employee.id)
      if (success) {
        Taro.showToast({
          title: '任务已完成',
          icon: 'success'
        })
        loadOnboardingData()
      } else {
        Taro.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('完成任务失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!onboardingData || !onboardingData.application) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">暂无入职信息</Text>
      </View>
    )
  }

  const {application, tasks, documents, statistics} = onboardingData

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的入职</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">入职流程管理</Text>
          </View>

          {/* 入职进度卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 mb-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-blue-600/80 text-sm">入职进度</Text>
                <Text className="text-foreground text-3xl font-bold mt-1">{statistics.completion_rate}%</Text>
              </View>
              <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <View className="i-mdi-account-check text-4xl text-blue-600" />
              </View>
            </View>

            <View className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
              <View>
                <Text className="text-blue-600/80 text-xs">入职天数</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.days_since_start}天</Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">已完成</Text>
                <Text className="text-foreground text-lg font-bold mt-1">
                  {statistics.completed_tasks}/{statistics.total_tasks}
                </Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">资料上传</Text>
                <Text className="text-foreground text-lg font-bold mt-1">
                  {statistics.uploaded_documents}/{statistics.total_documents}
                </Text>
              </View>
            </View>
          </View>

          {/* 入职信息卡片 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">入职信息</Text>
              <View
                className={`px-2 py-1 rounded ${application.status === 'approved' ? 'bg-green-100' : 'bg-orange-100'}`}>
                <Text className={`text-xs ${ONBOARDING_APPLICATION_STATUS_COLORS[application.status]}`}>
                  {ONBOARDING_APPLICATION_STATUS_NAMES[application.status]}
                </Text>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex flex-row items-center">
                <View className="i-mdi-account text-xl text-blue-600 mr-3" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">姓名</Text>
                  <Text className="text-sm text-foreground mt-1">{application.candidate_name}</Text>
                </View>
              </View>

              <View className="flex flex-row items-center">
                <View className="i-mdi-briefcase text-xl text-blue-600 mr-3" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">职位</Text>
                  <Text className="text-sm text-foreground mt-1">
                    {application.position} · {application.department}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center">
                <View className="i-mdi-calendar text-xl text-blue-600 mr-3" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">入职日期</Text>
                  <Text className="text-sm text-foreground mt-1">
                    {new Date(application.expected_start_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center">
                <View className="i-mdi-phone text-xl text-blue-600 mr-3" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">联系电话</Text>
                  <Text className="text-sm text-foreground mt-1">{application.candidate_phone}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 入职任务 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">入职任务</Text>
              <View className="i-mdi-clipboard-check text-2xl text-blue-600" />
            </View>

            {tasks.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-clipboard-check-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无入职任务</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {tasks.map((task) => (
                  <View key={task.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">{task.task_name}</Text>
                        <Text className="text-xs text-muted-foreground mt-1">
                          {ONBOARDING_TASK_TYPE_NAMES[task.task_type]}
                        </Text>
                      </View>
                      <View className="flex flex-row items-center gap-2">
                        <View
                          className={`px-2 py-1 rounded ${task.priority === 'urgent' ? 'bg-red-100' : task.priority === 'high' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                          <Text className={`text-xs ${ONBOARDING_TASK_PRIORITY_COLORS[task.priority]}`}>
                            {ONBOARDING_TASK_PRIORITY_NAMES[task.priority]}
                          </Text>
                        </View>
                        <View
                          className={`px-2 py-1 rounded ${task.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'}`}>
                          <Text className={`text-xs ${ONBOARDING_TASK_STATUS_COLORS[task.status]}`}>
                            {ONBOARDING_TASK_STATUS_NAMES[task.status]}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {task.task_description && (
                      <Text className="text-xs text-muted-foreground mb-3">{task.task_description}</Text>
                    )}

                    <View className="flex flex-row items-center justify-between">
                      {task.due_date && (
                        <View className="flex flex-row items-center">
                          <View className="i-mdi-clock-outline text-sm text-muted-foreground mr-1" />
                          <Text className={`text-xs ${isTaskOverdue(task) ? 'text-red-600' : 'text-muted-foreground'}`}>
                            截止: {new Date(task.due_date).toLocaleDateString()}
                            {isTaskOverdue(task) && ' (已逾期)'}
                          </Text>
                        </View>
                      )}

                      {task.status !== 'completed' && (
                        <View
                          className="bg-green-500 rounded-lg py-1 px-3 active:opacity-70"
                          onClick={() => handleCompleteTask(task.id)}>
                          <Text className="text-xs text-white font-medium">完成</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 入职资料 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">入职资料</Text>
              <View className="i-mdi-file-document text-2xl text-blue-600" />
            </View>

            {documents.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-file-document-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无入职资料</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {documents.map((doc) => (
                  <View key={doc.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">{doc.document_name}</Text>
                        <Text className="text-xs text-muted-foreground mt-1">
                          {ONBOARDING_DOCUMENT_TYPE_NAMES[doc.document_type]}
                          {doc.is_required && ' (必需)'}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded ${doc.status === 'verified' ? 'bg-green-100' : doc.status === 'uploaded' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                        <Text className={`text-xs ${ONBOARDING_DOCUMENT_STATUS_COLORS[doc.status]}`}>
                          {ONBOARDING_DOCUMENT_STATUS_NAMES[doc.status]}
                        </Text>
                      </View>
                    </View>

                    {doc.status === 'pending' && (
                      <View
                        className="mt-3 bg-green-500 rounded-lg py-2 px-4 flex items-center justify-center active:opacity-70"
                        onClick={() => {
                          Taro.showToast({
                            title: '上传功能开发中',
                            icon: 'none'
                          })
                        }}>
                        <Text className="text-sm text-white font-medium">上传资料</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 快捷操作 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">入职指南</Text>
              <View className="i-mdi-book-open text-2xl text-blue-600" />
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '入职手册功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-book-open-page-variant text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">入职手册</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '培训课程功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-school text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">培训课程</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '联系HR功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-account-tie text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">联系HR</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '帮助中心功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-help-circle text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">帮助中心</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
