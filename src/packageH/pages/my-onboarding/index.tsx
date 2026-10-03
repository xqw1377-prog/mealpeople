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
      <View className="@container min-h-screen bg-gray-50">
        <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
          <View className="p-4 max-sm:p-3">
            {/* 页面标题 */}
            <View className="mb-6">
              <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                我的入职
              </Text>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1 block">
                入职流程管理
              </Text>
            </View>

            {/* 空状态提示 */}
            <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200 text-center">
              <View className="flex items-center justify-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                <View className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <View className="i-mdi-account-plus text-6xl text-muted-foreground" />
                </View>
              </View>
              <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
                暂无入职信息
              </Text>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-6">
                您当前还没有入职申请记录。{'\n'}
                如果您是新员工，请联系HR部门为您创建入职流程。
              </Text>

              {/* 快捷入口 */}
              <View className="mb-6 space-y-3">
                <View
                  className="bg-blue-500 text-white rounded-xl py-3 px-6 flex items-center justify-center active:bg-blue-600"
                  onClick={() => Taro.navigateTo({url: '/packageH/pages/my-onboarding-application/index'})}>
                  <View className="i-mdi-file-document-edit text-xl mr-2"></View>
                  <Text className="text-base font-medium">查看我的入职申请</Text>
                </View>

                <View
                  className="bg-cyan-500 text-white rounded-xl py-3 px-6 flex items-center justify-center active:bg-cyan-600"
                  onClick={() => Taro.navigateTo({url: '/packageH/pages/my-probation-conversion/index'})}>
                  <View className="i-mdi-account-convert text-xl mr-2"></View>
                  <Text className="text-base font-medium">试用期转正申请</Text>
                </View>
              </View>

              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3">
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-3 max-sm:mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-1">
                        入职流程说明
                      </Text>
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                        入职流程包括：提交入职资料、完成入职任务、参加入职培训等环节。
                      </Text>
                    </View>
                  </View>
                </View>
                <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3">
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-phone text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-3 max-sm:mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-1">
                        需要帮助？
                      </Text>
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                        请联系您的HR专员或直接拨打人力资源部电话咨询。
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* 入职流程预览 */}
            <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mt-4">
              <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                  入职流程预览
                </Text>
                <View className="i-mdi-timeline-text text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
              </View>
              <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 max-sm:mr-2">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">1</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      提交入职资料
                    </Text>
                    <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                      上传身份证、学历证明、健康证等必要文件
                    </Text>
                  </View>
                </View>
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 max-sm:mr-2">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">2</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      完成入职任务
                    </Text>
                    <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                      完成系统分配的入职待办事项
                    </Text>
                  </View>
                </View>
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 max-sm:mr-2">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">3</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      参加入职培训
                    </Text>
                    <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                      学习公司文化、规章制度和岗位技能
                    </Text>
                  </View>
                </View>
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 max-sm:mr-2">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">4</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      正式入职
                    </Text>
                    <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                      完成所有流程，正式成为公司一员
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  const {application, tasks, documents, statistics} = onboardingData

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
              我的入职
            </Text>
            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1 block">
              入职流程管理
            </Text>
          </View>

          {/* 入职进度卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 max-sm:p-4 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View>
                <Text className="text-blue-600/80 text-sm max-sm:text-xs max-sm:text-[10px]">入职进度</Text>
                <Text className="text-foreground text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold mt-1">
                  {statistics.completion_rate}%
                </Text>
              </View>
              <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <View className="i-mdi-account-check text-4xl max-sm:text-3xl text-blue-600" />
              </View>
            </View>

            <View className="grid grid-cols-3 gap-3 max-sm:gap-2 max-sm:gap-1.5 pt-4 border-t border-white/20">
              <View>
                <Text className="text-blue-600/80 text-xs max-sm:text-[10px]">入职天数</Text>
                <Text className="text-foreground text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold mt-1">
                  {statistics.days_since_start}天
                </Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs max-sm:text-[10px]">已完成</Text>
                <Text className="text-foreground text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold mt-1">
                  {statistics.completed_tasks}/{statistics.total_tasks}
                </Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs max-sm:text-[10px]">资料上传</Text>
                <Text className="text-foreground text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold mt-1">
                  {statistics.uploaded_documents}/{statistics.total_documents}
                </Text>
              </View>
            </View>
          </View>

          {/* 入职信息卡片 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                入职信息
              </Text>
              <View
                className={`px-2 py-1 rounded ${application.status === 'approved' ? 'bg-green-100' : 'bg-orange-100'}`}>
                <Text
                  className={`text-xs max-sm:text-[10px] ${ONBOARDING_APPLICATION_STATUS_COLORS[application.status]}`}>
                  {ONBOARDING_APPLICATION_STATUS_NAMES[application.status]}
                </Text>
              </View>
            </View>

            <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              <View className="flex flex-row items-center">
                <View className="i-mdi-account text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-3 max-sm:mr-2" />
                <View className="flex-1">
                  <Text className="text-xs max-sm:text-[10px] text-muted-foreground">姓名</Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mt-1">
                    {application.candidate_name}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center">
                <View className="i-mdi-briefcase text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-3 max-sm:mr-2" />
                <View className="flex-1">
                  <Text className="text-xs max-sm:text-[10px] text-muted-foreground">职位</Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mt-1">
                    {application.position} · {application.department}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center">
                <View className="i-mdi-calendar text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-3 max-sm:mr-2" />
                <View className="flex-1">
                  <Text className="text-xs max-sm:text-[10px] text-muted-foreground">入职日期</Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mt-1">
                    {new Date(application.expected_start_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center">
                <View className="i-mdi-phone text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-3 max-sm:mr-2" />
                <View className="flex-1">
                  <Text className="text-xs max-sm:text-[10px] text-muted-foreground">联系电话</Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mt-1">
                    {application.candidate_phone}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 入职任务 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                入职任务
              </Text>
              <View className="i-mdi-clipboard-check text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
            </View>

            {tasks.length === 0 ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-clipboard-check-outline text-5xl max-sm:text-4xl max-sm:text-3xl text-muted-foreground/30 mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">暂无入职任务</Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {tasks.map((task) => (
                  <View key={task.id} className="p-4 max-sm:p-3 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      <View className="flex-1">
                        <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                          {task.task_name}
                        </Text>
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                          {ONBOARDING_TASK_TYPE_NAMES[task.task_type]}
                        </Text>
                      </View>
                      <View className="flex flex-row items-center gap-2 max-sm:gap-1.5">
                        <View
                          className={`px-2 py-1 rounded ${task.priority === 'urgent' ? 'bg-red-100' : task.priority === 'high' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                          <Text
                            className={`text-xs max-sm:text-[10px] ${ONBOARDING_TASK_PRIORITY_COLORS[task.priority]}`}>
                            {ONBOARDING_TASK_PRIORITY_NAMES[task.priority]}
                          </Text>
                        </View>
                        <View
                          className={`px-2 py-1 rounded ${task.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'}`}>
                          <Text className={`text-xs max-sm:text-[10px] ${ONBOARDING_TASK_STATUS_COLORS[task.status]}`}>
                            {ONBOARDING_TASK_STATUS_NAMES[task.status]}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {task.task_description && (
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        {task.task_description}
                      </Text>
                    )}

                    <View className="flex flex-row items-center justify-between">
                      {task.due_date && (
                        <View className="flex flex-row items-center">
                          <View className="i-mdi-clock-outline text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-1" />
                          <Text
                            className={`text-xs max-sm:text-[10px] ${isTaskOverdue(task) ? 'text-red-600' : 'text-muted-foreground'}`}>
                            截止: {new Date(task.due_date).toLocaleDateString()}
                            {isTaskOverdue(task) && ' (已逾期)'}
                          </Text>
                        </View>
                      )}

                      {task.status !== 'completed' && (
                        <View
                          className="bg-green-500 rounded-lg py-1 px-3 max-sm:px-2 active:opacity-70"
                          onClick={() => handleCompleteTask(task.id)}>
                          <Text className="text-xs max-sm:text-[10px] text-white font-medium">完成</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 入职资料 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                入职资料
              </Text>
              <View className="i-mdi-file-document text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
            </View>

            {documents.length === 0 ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-file-document-outline text-5xl max-sm:text-4xl max-sm:text-3xl text-muted-foreground/30 mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">暂无入职资料</Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {documents.map((doc) => (
                  <View key={doc.id} className="p-4 max-sm:p-3 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                      <View className="flex-1">
                        <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                          {doc.document_name}
                        </Text>
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                          {ONBOARDING_DOCUMENT_TYPE_NAMES[doc.document_type]}
                          {doc.is_required && ' (必需)'}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded ${doc.status === 'verified' ? 'bg-green-100' : doc.status === 'uploaded' ? 'bg-blue-100' : 'bg-orange-100'}`}>
                        <Text className={`text-xs max-sm:text-[10px] ${ONBOARDING_DOCUMENT_STATUS_COLORS[doc.status]}`}>
                          {ONBOARDING_DOCUMENT_STATUS_NAMES[doc.status]}
                        </Text>
                      </View>
                    </View>

                    {doc.status === 'pending' && (
                      <View
                        className="mt-3 bg-green-500 rounded-lg py-2 px-4 max-sm:px-3 max-sm:px-2 flex items-center justify-center active:opacity-70 cursor-pointer"
                        onClick={() => {
                          Taro.navigateTo({
                            url: `/pages/document-upload/index?documentId=${doc.id}&applicationId=${application.id}`
                          })
                        }}>
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-white font-medium">
                          上传资料
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 我的学习中心 - 醒目入口 */}
          <View
            className="bg-gradient-to-r from-primary to-primary-glow rounded-2xl p-6 max-sm:p-4 mb-4 max-sm:mb-3 shadow-lg active:scale-98 transition-transform"
            onClick={() => {
              Taro.navigateTo({
                url: '/packageJ/pages/my-learning-center/index'
              })
            }}>
            <View className="flex items-center justify-between">
              <View className="flex-1">
                <View className="flex items-center gap-2 mb-2">
                  <View className="i-mdi-school text-2xl text-white" />
                  <Text className="text-xl max-sm:text-lg font-bold text-white">我的学习中心</Text>
                </View>
                <Text className="text-sm max-sm:text-xs text-white/90 mb-3">查看学习进度、培训课程和成就徽章</Text>
                <View className="flex items-center gap-2">
                  <View className="bg-white/20 rounded-full px-3 py-1">
                    <Text className="text-xs text-white">入职手册</Text>
                  </View>
                  <View className="bg-white/20 rounded-full px-3 py-1">
                    <Text className="text-xs text-white">培训课程</Text>
                  </View>
                  <View className="bg-white/20 rounded-full px-3 py-1">
                    <Text className="text-xs text-white">学习成就</Text>
                  </View>
                </View>
              </View>
              <View className="i-mdi-chevron-right text-3xl text-white ml-4" />
            </View>
          </View>

          {/* 快捷操作 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                入职指南
              </Text>
              <View className="i-mdi-book-open text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
            </View>

            <View className="grid grid-cols-2 gap-3 max-sm:gap-2 max-sm:gap-1.5">
              <View
                className="bg-blue-100 rounded-xl p-4 max-sm:p-3 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.navigateTo({
                    url: '/packageH/pages/onboarding-handbook/index'
                  })
                }}>
                <View className="i-mdi-book-open-page-variant text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground font-medium text-center">
                  入职手册
                </Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 max-sm:p-3 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.navigateTo({
                    url: '/packageJ/pages/onboarding-training/index'
                  })
                }}>
                <View className="i-mdi-school text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground font-medium text-center">
                  培训课程
                </Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 max-sm:p-3 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.navigateTo({
                    url: '/packageH/pages/my-probation-conversion/index'
                  })
                }}>
                <View className="i-mdi-account-convert text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground font-medium text-center">
                  试用期转正
                </Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 max-sm:p-3 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.navigateTo({
                    url: '/packageN/pages/contact-hr/index'
                  })
                }}>
                <View className="i-mdi-account-tie text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground font-medium text-center">联系HR</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 max-sm:p-3 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.navigateTo({
                    url: '/pages/help-center/index'
                  })
                }}>
                <View className="i-mdi-help-circle text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground font-medium text-center">
                  帮助中心
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
