/**
 * 我的离职页面 - 员工离职管理
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {createOffboardingApplication, getEmployeeOffboardingData} from '@/db/api-offboarding'
import type {OffboardingData} from '@/db/types-offboarding'
import {
  HANDOVER_STATUS_COLORS,
  HANDOVER_STATUS_NAMES,
  HANDOVER_TYPE_NAMES,
  OFFBOARDING_APPLICATION_STATUS_COLORS,
  OFFBOARDING_APPLICATION_STATUS_NAMES,
  OFFBOARDING_TASK_STATUS_COLORS,
  OFFBOARDING_TASK_STATUS_NAMES,
  OFFBOARDING_TASK_TYPE_NAMES,
  RESIGNATION_REASON_NAMES,
  RESIGNATION_TYPE_NAMES
} from '@/db/types-offboarding'

export default function MyOffboarding() {
  const {user} = useAuth({guard: true})
  const [offboardingData, setOffboardingData] = useState<OffboardingData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadOffboardingData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      const data = await getEmployeeOffboardingData(employee.id)
      setOffboardingData(data)
    } catch (error) {
      console.error('加载离职数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadOffboardingData()
  })

  const handleCreateApplication = async () => {
    Taro.showModal({
      title: '提交离职申请',
      content: '确定要提交离职申请吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const employee = await getEmployeeByUserId(user?.id)
            if (!employee) return

            // 计算预期离职日期（30天后）
            const expectedDate = new Date()
            expectedDate.setDate(expectedDate.getDate() + 30)

            const result = await createOffboardingApplication({
              tenant_id: employee.tenant_id,
              employee_id: employee.id,
              expected_leave_date: expectedDate.toISOString().split('T')[0],
              resignation_type: 'voluntary',
              resignation_reason: 'career_development',
              detailed_reason: '个人职业发展需要'
            })

            if (result) {
              Taro.showToast({
                title: '申请已提交',
                icon: 'success'
              })
              loadOffboardingData()
            } else {
              Taro.showToast({
                title: '提交失败',
                icon: 'none'
              })
            }
          } catch (error) {
            console.error('创建离职申请失败:', error)
            Taro.showToast({
              title: '提交失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  // 如果没有离职申请，显示创建入口
  if (!offboardingData || !offboardingData.application) {
    return (
      <View className="min-h-screen bg-gray-50">
        <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
          <View className="p-4">
            {/* 页面标题 */}
            <View className="mb-6">
              <Text className="text-2xl font-bold text-foreground">我的离职</Text>
              <Text className="text-sm text-muted-foreground mt-1 block">离职流程管理</Text>
            </View>

            {/* 空状态 */}
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
              <View className="i-mdi-account-arrow-right text-6xl text-muted-foreground/30 mb-4" />
              <Text className="text-lg font-medium text-foreground mb-2 block">暂无离职申请</Text>
              <Text className="text-sm text-muted-foreground mb-6 block">如需提交离职申请，请点击下方按钮</Text>
              <Button
                className="bg-blue-100 text-white py-3 rounded-xl break-keep text-base"
                size="default"
                onClick={handleCreateApplication}>
                提交离职申请
              </Button>
            </View>

            {/* 离职须知 */}
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mt-4 shadow-sm">
              <View className="flex flex-row items-center mb-4">
                <View className="i-mdi-information text-2xl text-muted-foreground mr-2" />
                <Text className="text-lg font-semibold text-foreground">离职须知</Text>
              </View>

              <View className="space-y-3">
                <View className="flex flex-row">
                  <Text className="text-blue-600 mr-2">•</Text>
                  <Text className="text-sm text-muted-foreground flex-1">提前30天提交离职申请</Text>
                </View>
                <View className="flex flex-row">
                  <Text className="text-blue-600 mr-2">•</Text>
                  <Text className="text-sm text-muted-foreground flex-1">完成工作交接和设备归还</Text>
                </View>
                <View className="flex flex-row">
                  <Text className="text-blue-600 mr-2">•</Text>
                  <Text className="text-sm text-muted-foreground flex-1">参加离职面谈</Text>
                </View>
                <View className="flex flex-row">
                  <Text className="text-blue-600 mr-2">•</Text>
                  <Text className="text-sm text-muted-foreground flex-1">办理离职手续</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  const {application, tasks, handovers, statistics} = offboardingData

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的离职</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">离职流程管理</Text>
          </View>

          {/* 离职进度卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 mb-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-blue-600/80 text-sm">离职进度</Text>
                <Text className="text-foreground text-3xl font-bold mt-1">{statistics.completion_rate}%</Text>
              </View>
              <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <View className="i-mdi-account-arrow-right text-4xl text-blue-600" />
              </View>
            </View>

            <View className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
              <View>
                <Text className="text-blue-600/80 text-xs">剩余天数</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.days_until_leave}天</Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">待办任务</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.pending_tasks}项</Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">待交接</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.pending_handovers}项</Text>
              </View>
            </View>
          </View>

          {/* 离职申请信息 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">离职申请</Text>
              <View
                className={`px-2 py-1 rounded ${application.status === 'approved' ? 'bg-green-100' : 'bg-orange-100'}`}>
                <Text className={`text-xs ${OFFBOARDING_APPLICATION_STATUS_COLORS[application.status]}`}>
                  {OFFBOARDING_APPLICATION_STATUS_NAMES[application.status]}
                </Text>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex flex-row items-center">
                <View className="i-mdi-calendar text-xl text-blue-600 mr-3" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">预期离职日期</Text>
                  <Text className="text-sm text-foreground mt-1">
                    {new Date(application.expected_leave_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center">
                <View className="i-mdi-tag text-xl text-blue-600 mr-3" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">离职类型</Text>
                  <Text className="text-sm text-foreground mt-1">
                    {RESIGNATION_TYPE_NAMES[application.resignation_type]}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center">
                <View className="i-mdi-comment-text text-xl text-blue-600 mr-3" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">离职原因</Text>
                  <Text className="text-sm text-foreground mt-1">
                    {RESIGNATION_REASON_NAMES[application.resignation_reason]}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center">
                <View className="i-mdi-clock text-xl text-blue-600 mr-3" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">申请日期</Text>
                  <Text className="text-sm text-foreground mt-1">
                    {new Date(application.application_date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 离职任务 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">离职任务</Text>
              <View className="i-mdi-clipboard-check text-2xl text-blue-600" />
            </View>

            {tasks.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-clipboard-check-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无离职任务</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {tasks.map((task) => (
                  <View key={task.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">{task.task_name}</Text>
                        <Text className="text-xs text-muted-foreground mt-1">
                          {OFFBOARDING_TASK_TYPE_NAMES[task.task_type]}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded ${task.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <Text className={`text-xs ${OFFBOARDING_TASK_STATUS_COLORS[task.status]}`}>
                          {OFFBOARDING_TASK_STATUS_NAMES[task.status]}
                        </Text>
                      </View>
                    </View>

                    {task.due_date && (
                      <View className="flex flex-row items-center mt-2">
                        <View className="i-mdi-clock-outline text-sm text-muted-foreground mr-1" />
                        <Text className="text-xs text-muted-foreground">
                          截止: {new Date(task.due_date).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 工作交接 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">工作交接</Text>
              <View className="i-mdi-swap-horizontal text-2xl text-blue-600" />
            </View>

            {handovers.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-swap-horizontal text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无交接事项</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {handovers.map((handover) => (
                  <View key={handover.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">{handover.handover_item}</Text>
                        <Text className="text-xs text-muted-foreground mt-1">
                          {HANDOVER_TYPE_NAMES[handover.handover_type]}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded ${handover.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <Text className={`text-xs ${HANDOVER_STATUS_COLORS[handover.status]}`}>
                          {HANDOVER_STATUS_NAMES[handover.status]}
                        </Text>
                      </View>
                    </View>

                    {handover.handover_date && (
                      <View className="flex flex-row items-center mt-2">
                        <View className="i-mdi-calendar text-sm text-muted-foreground mr-1" />
                        <Text className="text-xs text-muted-foreground">
                          交接日期: {new Date(handover.handover_date).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
