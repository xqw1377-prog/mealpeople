/**
 * 数据分析页面
 * 展示培训和任务的统计数据
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getDepartmentStats, getTaskAnalytics, getTopPerformers, getTrainingAnalytics} from '@/db/api-analytics'
import type {DepartmentStats, EmployeePerformance, TaskAnalytics, TrainingAnalytics} from '@/db/types-analytics'
import {useTenantStore} from '@/store/tenant'

const Analytics: React.FC = () => {
  useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 统计数据
  const [trainingStats, setTrainingStats] = useState<TrainingAnalytics | null>(null)
  const [taskStats, setTaskStats] = useState<TaskAnalytics | null>(null)
  const [topPerformers, setTopPerformers] = useState<EmployeePerformance[]>([])
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([])

  // 加载状态
  const [loading, setLoading] = useState(true)

  // 当前选中的标签页
  const [activeTab, setActiveTab] = useState<'overview' | 'training' | 'task' | 'performance'>('overview')

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      setLoading(true)
      const [training, task, performers, departments] = await Promise.all([
        getTrainingAnalytics(currentTenant.id),
        getTaskAnalytics(currentTenant.id),
        getTopPerformers(currentTenant.id, 10),
        getDepartmentStats(currentTenant.id)
      ])

      setTrainingStats(training)
      setTaskStats(task)
      setTopPerformers(performers)
      setDepartmentStats(departments)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({title: '加载数据失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadData()
  })

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    return `${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  // 渲染概览标签页
  const renderOverview = () => (
    <View className="space-y-4">
      {/* 培训概览 */}
      <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-foreground">培训概览</Text>
          <View className="i-mdi-school text-2xl text-blue-600" />
        </View>

        <View className="grid grid-cols-3 gap-4">
          <View className="text-center">
            <Text className="text-2xl font-bold text-blue-600">{trainingStats?.total_courses || 0}</Text>
            <Text className="text-sm text-muted-foreground mt-1">总课程</Text>
          </View>
          <View className="text-center">
            <Text className="text-2xl font-bold text-muted-foreground">{trainingStats?.active_courses || 0}</Text>
            <Text className="text-sm text-muted-foreground mt-1">进行中</Text>
          </View>
          <View className="text-center">
            <Text className="text-2xl font-bold text-muted-foreground">{trainingStats?.total_enrollments || 0}</Text>
            <Text className="text-sm text-muted-foreground mt-1">总报名</Text>
          </View>
        </View>

        <View className="mt-4 pt-4 border-t border-border">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">完成率</Text>
            <Text className="text-lg font-semibold text-blue-600">{trainingStats?.completion_rate || 0}%</Text>
          </View>
        </View>
      </View>

      {/* 任务概览 */}
      <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold text-foreground">任务概览</Text>
          <View className="i-mdi-clipboard-check text-2xl text-blue-600" />
        </View>

        <View className="grid grid-cols-3 gap-4">
          <View className="text-center">
            <Text className="text-2xl font-bold text-blue-600">{taskStats?.total_tasks || 0}</Text>
            <Text className="text-sm text-muted-foreground mt-1">总任务</Text>
          </View>
          <View className="text-center">
            <Text className="text-2xl font-bold text-muted-foreground">{taskStats?.in_progress_tasks || 0}</Text>
            <Text className="text-sm text-muted-foreground mt-1">进行中</Text>
          </View>
          <View className="text-center">
            <Text className="text-2xl font-bold text-red-600">{taskStats?.overdue_tasks || 0}</Text>
            <Text className="text-sm text-muted-foreground mt-1">已逾期</Text>
          </View>
        </View>

        <View className="mt-4 pt-4 border-t border-border">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">完成率</Text>
            <Text className="text-lg font-semibold text-blue-600">{taskStats?.completion_rate || 0}%</Text>
          </View>
        </View>
      </View>
    </View>
  )

  // 渲染培训详情标签页
  const renderTraining = () => (
    <View className="space-y-4">
      {/* 热门课程 */}
      <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <View className="flex flex-row items-center mb-4">
          <View className="i-mdi-fire text-2xl text-muted-foreground mr-2" />
          <Text className="text-lg font-semibold text-foreground">热门课程</Text>
        </View>

        {trainingStats?.popular_courses && trainingStats.popular_courses.length > 0 ? (
          <View className="space-y-3">
            {trainingStats.popular_courses.map((course, index) => (
              <View key={course.course_id} className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center flex-1">
                  <View
                    className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-50' : 'bg-orange-100'
                    }`}>
                    <Text
                      className={`text-sm font-bold ${
                        index === 0
                          ? 'text-yellow-600'
                          : index === 1
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground'
                      }`}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text className="text-foreground flex-1" numberOfLines={1}>
                    {course.course_title}
                  </Text>
                </View>
                <View className="flex flex-row items-center ml-2">
                  <View className="i-mdi-account-multiple text-lg text-blue-600 mr-1" />
                  <Text className="text-sm font-semibold text-blue-600">{course.enrollment_count}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="text-center py-8">
            <View className="i-mdi-inbox text-4xl text-muted-foreground mb-2" />
            <Text className="text-muted-foreground">暂无数据</Text>
          </View>
        )}
      </View>

      {/* 最近完成 */}
      <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <View className="flex flex-row items-center mb-4">
          <View className="i-mdi-check-circle text-2xl text-muted-foreground mr-2" />
          <Text className="text-lg font-semibold text-foreground">最近完成</Text>
        </View>

        {trainingStats?.recent_completions && trainingStats.recent_completions.length > 0 ? (
          <View className="space-y-3">
            {trainingStats.recent_completions.map((item, index) => (
              <View key={`${item.employee_name}-${index}`} className="border-l-4 border-green-500 pl-3 py-2">
                <Text className="text-foreground font-medium">{item.employee_name}</Text>
                <Text className="text-sm text-muted-foreground mt-1">{item.course_title}</Text>
                <Text className="text-xs text-muted-foreground mt-1">{formatDate(item.completed_at)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="text-center py-8">
            <View className="i-mdi-inbox text-4xl text-muted-foreground mb-2" />
            <Text className="text-muted-foreground">暂无数据</Text>
          </View>
        )}
      </View>
    </View>
  )

  // 渲染任务详情标签页
  const renderTask = () => (
    <View className="space-y-4">
      {/* 优先级分布 */}
      <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <View className="flex flex-row items-center mb-4">
          <View className="i-mdi-chart-pie text-2xl text-blue-600 mr-2" />
          <Text className="text-lg font-semibold text-foreground">优先级分布</Text>
        </View>

        <View className="space-y-3">
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-blue-100 mr-2" />
              <Text className="text-foreground">高优先级</Text>
            </View>
            <Text className="text-lg font-semibold text-foreground">{taskStats?.priority_distribution.high || 0}</Text>
          </View>

          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-blue-100 mr-2" />
              <Text className="text-foreground">中优先级</Text>
            </View>
            <Text className="text-lg font-semibold text-foreground">
              {taskStats?.priority_distribution.medium || 0}
            </Text>
          </View>

          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-blue-100 mr-2" />
              <Text className="text-foreground">低优先级</Text>
            </View>
            <Text className="text-lg font-semibold text-foreground">{taskStats?.priority_distribution.low || 0}</Text>
          </View>
        </View>
      </View>

      {/* 最近完成 */}
      <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <View className="flex flex-row items-center mb-4">
          <View className="i-mdi-check-circle text-2xl text-muted-foreground mr-2" />
          <Text className="text-lg font-semibold text-foreground">最近完成</Text>
        </View>

        {taskStats?.recent_completions && taskStats.recent_completions.length > 0 ? (
          <View className="space-y-3">
            {taskStats.recent_completions.map((item, index) => (
              <View key={`${item.employee_name}-${index}`} className="border-l-4 border-green-500 pl-3 py-2">
                <Text className="text-foreground font-medium">{item.employee_name}</Text>
                <Text className="text-sm text-muted-foreground mt-1">{item.task_title}</Text>
                <Text className="text-xs text-muted-foreground mt-1">{formatDate(item.completed_at)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="text-center py-8">
            <View className="i-mdi-inbox text-4xl text-muted-foreground mb-2" />
            <Text className="text-muted-foreground">暂无数据</Text>
          </View>
        )}
      </View>
    </View>
  )

  // 渲染绩效排行标签页
  const renderPerformance = () => (
    <View className="space-y-4">
      {/* 员工绩效排行 */}
      <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <View className="flex flex-row items-center mb-4">
          <View className="i-mdi-trophy text-2xl text-yellow-600 mr-2" />
          <Text className="text-lg font-semibold text-foreground">员工绩效排行</Text>
        </View>

        {topPerformers.length > 0 ? (
          <View className="space-y-3">
            {topPerformers.map((performer, index) => (
              <View key={performer.employee_id} className="border border-border rounded-xl p-4">
                <View className="flex flex-row items-center justify-between mb-3">
                  <View className="flex flex-row items-center">
                    <View
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        index === 0
                          ? 'bg-yellow-100'
                          : index === 1
                            ? 'bg-gray-50'
                            : index === 2
                              ? 'bg-orange-100'
                              : 'bg-blue-100'
                      }`}>
                      <Text
                        className={`text-base font-bold ${
                          index === 0
                            ? 'text-yellow-600'
                            : index === 1
                              ? 'text-muted-foreground'
                              : index === 2
                                ? 'text-muted-foreground'
                                : 'text-muted-foreground'
                        }`}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text className="text-foreground font-semibold">{performer.employee_name}</Text>
                  </View>
                  <Text className="text-xl font-bold text-blue-600">{performer.overall_score}</Text>
                </View>

                <View className="grid grid-cols-2 gap-3">
                  <View>
                    <Text className="text-xs text-muted-foreground">任务完成率</Text>
                    <Text className="text-sm font-semibold text-foreground mt-1">
                      {performer.task_completion_rate}%
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted-foreground">培训完成率</Text>
                    <Text className="text-sm font-semibold text-foreground mt-1">
                      {performer.training_completion_rate}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="text-center py-8">
            <View className="i-mdi-inbox text-4xl text-muted-foreground mb-2" />
            <Text className="text-muted-foreground">暂无数据</Text>
          </View>
        )}
      </View>

      {/* 部门统计 */}
      <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
        <View className="flex flex-row items-center mb-4">
          <View className="i-mdi-office-building text-2xl text-blue-600 mr-2" />
          <Text className="text-lg font-semibold text-foreground">部门统计</Text>
        </View>

        {departmentStats.length > 0 ? (
          <View className="space-y-3">
            {departmentStats.map((dept) => (
              <View key={dept.department} className="border border-border rounded-xl p-4">
                <View className="flex flex-row items-center justify-between mb-3">
                  <Text className="text-foreground font-semibold">{dept.department}</Text>
                  <View className="flex flex-row items-center">
                    <View className="i-mdi-account-multiple text-lg text-blue-600 mr-1" />
                    <Text className="text-sm text-blue-600">{dept.employee_count}人</Text>
                  </View>
                </View>

                <View className="grid grid-cols-2 gap-3">
                  <View>
                    <Text className="text-xs text-muted-foreground">任务完成率</Text>
                    <Text className="text-sm font-semibold text-foreground mt-1">{dept.task_completion_rate}%</Text>
                  </View>
                  <View>
                    <Text className="text-xs text-muted-foreground">培训完成率</Text>
                    <Text className="text-sm font-semibold text-foreground mt-1">{dept.training_completion_rate}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="text-center py-8">
            <View className="i-mdi-inbox text-4xl text-muted-foreground mb-2" />
            <Text className="text-muted-foreground">暂无数据</Text>
          </View>
        )}
      </View>
    </View>
  )

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        {/* 使用容器查询支持WEB端响应式 */}
        <View className="@container">
          <View className="p-4 max-w-7xl mx-auto space-y-4">
            {/* 页面标题 - WEB端优化 */}
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
              <View className="flex flex-row items-center justify-between">
                <View>
                  <Text className="text-2xl max-sm:text-xl font-bold text-blue-600">数据分析</Text>
                  <Text className="text-sm text-muted-foreground mt-1">查看培训和任务统计数据</Text>
                </View>
                <View className="i-mdi-chart-bar text-3xl text-blue-600" />
              </View>
            </View>

            {/* 标签页切换 - WEB端优化 */}
            <View className="bg-white rounded-lg p-2 border-2 border-gray-200">
              <View className="grid grid-cols-4 gap-2">
                <View
                  className={`py-3 rounded-xl cursor-pointer transition-all ${activeTab === 'overview' ? 'bg-green-500' : 'bg-transparent'}`}
                  onClick={() => setActiveTab('overview')}>
                  <Text
                    className={`text-center text-sm ${activeTab === 'overview' ? 'text-white font-semibold' : 'text-muted-foreground'}`}>
                    概览
                  </Text>
                </View>
                <View
                  className={`py-3 rounded-xl cursor-pointer transition-all ${activeTab === 'training' ? 'bg-blue-100' : 'bg-transparent'}`}
                  onClick={() => setActiveTab('training')}>
                  <Text
                    className={`text-center text-sm ${activeTab === 'training' ? 'text-blue-600 font-semibold' : 'text-muted-foreground'}`}>
                    培训
                  </Text>
                </View>
                <View
                  className={`py-3 rounded-xl cursor-pointer transition-all ${activeTab === 'task' ? 'bg-blue-100' : 'bg-transparent'}`}
                  onClick={() => setActiveTab('task')}>
                  <Text
                    className={`text-center text-sm ${activeTab === 'task' ? 'text-blue-600 font-semibold' : 'text-muted-foreground'}`}>
                    任务
                  </Text>
                </View>
                <View
                  className={`py-3 rounded-xl cursor-pointer transition-all ${activeTab === 'performance' ? 'bg-blue-100' : 'bg-transparent'}`}
                  onClick={() => setActiveTab('performance')}>
                  <Text
                    className={`text-center text-sm ${activeTab === 'performance' ? 'text-blue-600 font-semibold' : 'text-muted-foreground'}`}>
                    绩效
                  </Text>
                </View>
              </View>
            </View>

            {/* 内容区域 */}
            {loading ? (
              <View className="bg-white rounded-lg p-8 border-2 border-gray-200">
                <Text className="text-center text-muted-foreground">加载中...</Text>
              </View>
            ) : (
              <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'training' && renderTraining()}
                {activeTab === 'task' && renderTask()}
                {activeTab === 'performance' && renderPerformance()}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default Analytics
