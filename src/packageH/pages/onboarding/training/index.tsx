/**
 * 我的培训页面
 * 显示员工的培训课程和培训进度
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {EmptyState, LoadingCards, LoadingStatCard, PageHeader, SimpleStatCard} from '@/components/common'
import {getEmployeeByUserId} from '@/db/api'

// 培训记录类型
interface TrainingRecord {
  id: string
  course: {
    title: string
    duration_hours: number
    category: string
  }
  status: string
  progress: number
  completed_at: string | null
}

// 培训进度统计类型
interface TrainingProgress {
  total: number
  completed: number
  inProgress: number
  notStarted: number
  completionRate: number
}

const _MyTraining: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([])
  const [progress, setProgress] = useState<TrainingProgress | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载培训数据
  const loadTrainingData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 这里使用模拟数据，实际应该调用API
      // const [records, progressData] = await Promise.all([
      //   getMyTrainingRecords(employee.id, employee.tenant_id),
      //   getTrainingProgress(employee.id, employee.tenant_id)
      // ])

      // 模拟数据
      const mockRecords: TrainingRecord[] = [
        {
          id: '1',
          course: {
            title: '员工手册学习',
            duration_hours: 2,
            category: '入职培训'
          },
          status: 'completed',
          progress: 100,
          completed_at: '2024-01-25'
        },
        {
          id: '2',
          course: {
            title: '安全培训',
            duration_hours: 1.5,
            category: '安全教育'
          },
          status: 'completed',
          progress: 100,
          completed_at: '2024-01-26'
        },
        {
          id: '3',
          course: {
            title: '岗位技能培训',
            duration_hours: 4,
            category: '技能提升'
          },
          status: 'in_progress',
          progress: 60,
          completed_at: null
        },
        {
          id: '4',
          course: {
            title: '团队协作培训',
            duration_hours: 2,
            category: '团队建设'
          },
          status: 'not_started',
          progress: 0,
          completed_at: null
        }
      ]

      const mockProgress: TrainingProgress = {
        total: 4,
        completed: 2,
        inProgress: 1,
        notStarted: 1,
        completionRate: 50
      }

      setTrainingRecords(mockRecords)
      setProgress(mockProgress)
    } catch (error) {
      console.error('加载培训数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadTrainingData()
  })

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {bg: 'bg-green-100', text: 'text-muted-foreground', label: '已完成'}
      case 'in_progress':
        return {bg: 'bg-blue-100', text: 'text-muted-foreground', label: '进行中'}
      case 'not_started':
        return {bg: 'bg-gray-50', text: 'text-muted-foreground', label: '未开始'}
      default:
        return {bg: 'bg-gray-50', text: 'text-muted-foreground', label: '未知'}
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <PageHeader icon="i-mdi-school" title="我的培训" description="查看您的培训课程和学习进度" />

          {loading ? (
            <>
              {/* 加载状态 */}
              <LoadingStatCard />
              <LoadingCards count={3} />
            </>
          ) : trainingRecords.length === 0 ? (
            <>
              {/* 空状态 */}
              <EmptyState
                icon="i-mdi-school"
                title="暂无培训课程"
                description="您还没有分配的培训课程"
                action={{
                  label: '刷新',
                  onClick: loadTrainingData
                }}
              />
            </>
          ) : (
            <>
              {/* 培训进度概览 */}
              {progress && (
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-center mb-4">
                    <View className="i-mdi-chart-donut text-2xl text-blue-600 mr-2" />
                    <Text className="text-lg font-bold text-foreground">培训进度</Text>
                  </View>
                  <View className="grid grid-cols-3 gap-4">
                    <SimpleStatCard label="已完成" value={progress.completed} color="text-muted-foreground" />
                    <SimpleStatCard label="进行中" value={progress.inProgress} color="text-muted-foreground" />
                    <SimpleStatCard label="未开始" value={progress.notStarted} color="text-muted-foreground" />
                  </View>
                  <View className="mt-4">
                    <View className="flex items-center justify-between mb-2">
                      <Text className="text-sm text-muted-foreground">总体进度</Text>
                      <Text className="text-sm font-bold text-blue-600">{progress.completionRate}%</Text>
                    </View>
                    <View className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <View className="h-full bg-blue-100" style={{width: `${progress.completionRate}%`}} />
                    </View>
                  </View>
                </View>
              )}

              {/* 培训课程列表 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex items-center mb-4">
                  <View className="i-mdi-book-open-page-variant text-2xl text-blue-600 mr-2" />
                  <Text className="text-lg font-bold text-foreground">培训课程</Text>
                </View>
                <View className="space-y-3">
                  {trainingRecords.map((record) => {
                    const statusStyle = getStatusStyle(record.status)
                    return (
                      <View key={record.id} className="p-4 bg-gray-50/30 rounded-lg">
                        <View className="flex items-center justify-between mb-3">
                          <Text className="text-base font-bold text-foreground">{record.course.title}</Text>
                          <View className={`${statusStyle.bg} px-3 py-1 rounded-full`}>
                            <Text className={`text-xs ${statusStyle.text} font-medium`}>{statusStyle.label}</Text>
                          </View>
                        </View>
                        <View className="space-y-2">
                          <View className="flex items-center justify-between">
                            <View className="flex items-center">
                              <View className="i-mdi-clock-outline text-sm text-muted-foreground mr-2" />
                              <Text className="text-sm text-muted-foreground">
                                时长：{record.course.duration_hours}小时
                              </Text>
                            </View>
                            {record.completed_at && (
                              <Text className="text-xs text-muted-foreground">完成于 {record.completed_at}</Text>
                            )}
                          </View>
                          <View className="flex items-center">
                            <View className="i-mdi-tag-outline text-sm text-muted-foreground mr-2" />
                            <Text className="text-sm text-muted-foreground">{record.course.category}</Text>
                          </View>
                          {record.progress > 0 && (
                            <View>
                              <View className="flex items-center justify-between mb-1">
                                <Text className="text-xs text-muted-foreground">学习进度</Text>
                                <Text className="text-xs font-bold text-blue-600">{record.progress}%</Text>
                              </View>
                              <View className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <View className="h-full bg-blue-100" style={{width: `${record.progress}%`}} />
                              </View>
                            </View>
                          )}
                        </View>
                        {record.status !== 'completed' && (
                          <View
                            className="mt-3 bg-green-500 text-white py-2 px-4 rounded-lg active:opacity-80"
                            onClick={() => {
                              Taro.showToast({
                                title: record.status === 'in_progress' ? '继续学习' : '开始学习',
                                icon: 'none'
                              })
                            }}>
                            <Text className="text-white text-center text-sm font-medium">
                              {record.status === 'in_progress' ? '继续学习' : '开始学习'}
                            </Text>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              </View>

              {/* 培训提示 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex items-center mb-4">
                  <View className="i-mdi-lightbulb text-2xl text-blue-600 mr-2" />
                  <Text className="text-lg font-bold text-foreground">温馨提示</Text>
                </View>
                <View className="space-y-2">
                  <View className="flex items-start">
                    <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                    <Text className="text-sm text-muted-foreground flex-1">请按时完成所有培训课程</Text>
                  </View>
                  <View className="flex items-start">
                    <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                    <Text className="text-sm text-muted-foreground flex-1">培训完成后将进行考核</Text>
                  </View>
                  <View className="flex items-start">
                    <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                    <Text className="text-sm text-muted-foreground flex-1">如有疑问请联系培训负责人</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default _MyTraining
