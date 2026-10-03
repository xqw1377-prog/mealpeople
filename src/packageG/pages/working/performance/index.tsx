/**
 * 我的绩效页面 - 员工绩效管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {getEmployeePerformanceData} from '@/db/api-performance'
import type {PerformanceData} from '@/db/types-performance'

export default function MyPerformance() {
  const {user} = useAuth({guard: true})
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载绩效数据
  const loadPerformanceData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 获取绩效数据
      const data = await getEmployeePerformanceData(employee.id)
      setPerformanceData(data)
    } catch (error) {
      console.error('加载绩效数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadPerformanceData()
  })

  // 获取评级文本和颜色
  const getScoreInfo = (score: number) => {
    if (score >= 4.5) return {text: 'A 优秀', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    if (score >= 4.0) return {text: 'B 良好', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    if (score >= 3.5) return {text: 'C 合格', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    return {text: 'D 待改进', color: 'text-red-600', bgColor: 'bg-blue-100'}
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!performanceData) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">暂无绩效数据</Text>
      </View>
    )
  }

  const {current_performance, performance_trend, statistics, goals, goal_statistics, improvements} = performanceData

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的绩效</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">绩效评估与目标管理</Text>
          </View>

          {/* 本月绩效卡片 */}
          {current_performance ? (
            <View className="bg-blue-100 rounded-lg p-6 mb-4">
              <View className="flex flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-blue-600/80 text-sm">
                    {current_performance.period_year}年{current_performance.period_month}月绩效
                  </Text>
                  <Text className="text-foreground text-3xl font-bold mt-1">{current_performance.overall_score}</Text>
                  <Text className="text-blue-600/80 text-xs mt-1">
                    {getScoreInfo(Number(current_performance.overall_score)).text}
                  </Text>
                </View>
                <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                  <View className="i-mdi-trophy text-4xl text-blue-600" />
                </View>
              </View>

              {/* 各项评分 */}
              <View className="grid grid-cols-2 gap-3">
                {current_performance.service_score !== null && (
                  <View className="bg-white rounded-lg p-3 border-2 border-gray-200">
                    <Text className="text-blue-600/80 text-xs">服务质量</Text>
                    <Text className="text-foreground text-lg font-bold mt-1">{current_performance.service_score}</Text>
                  </View>
                )}
                {current_performance.efficiency_score !== null && (
                  <View className="bg-white rounded-lg p-3 border-2 border-gray-200">
                    <Text className="text-blue-600/80 text-xs">工作效率</Text>
                    <Text className="text-foreground text-lg font-bold mt-1">
                      {current_performance.efficiency_score}
                    </Text>
                  </View>
                )}
                {current_performance.teamwork_score !== null && (
                  <View className="bg-white rounded-lg p-3 border-2 border-gray-200">
                    <Text className="text-blue-600/80 text-xs">团队协作</Text>
                    <Text className="text-foreground text-lg font-bold mt-1">{current_performance.teamwork_score}</Text>
                  </View>
                )}
                {current_performance.attendance_score !== null && (
                  <View className="bg-white rounded-lg p-3 border-2 border-gray-200">
                    <Text className="text-blue-600/80 text-xs">考勤表现</Text>
                    <Text className="text-foreground text-lg font-bold mt-1">
                      {current_performance.attendance_score}
                    </Text>
                  </View>
                )}
              </View>

              {/* 排名信息 */}
              {(current_performance.rank_in_store || current_performance.rank_in_company) && (
                <View className="flex flex-row items-center justify-around mt-4 pt-4 border-t border-white/20">
                  {current_performance.rank_in_store && (
                    <View className="text-center">
                      <Text className="text-blue-600/80 text-xs">门店排名</Text>
                      <Text className="text-foreground text-xl font-bold mt-1">
                        #{current_performance.rank_in_store}
                      </Text>
                    </View>
                  )}
                  {current_performance.rank_in_company && (
                    <View className="text-center">
                      <Text className="text-blue-600/80 text-xs">公司排名</Text>
                      <Text className="text-foreground text-xl font-bold mt-1">
                        #{current_performance.rank_in_company}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm text-center">
              <View className="i-mdi-chart-box-outline text-5xl text-muted-foreground/30 mb-2" />
              <Text className="text-sm text-muted-foreground">本月暂无绩效评估</Text>
            </View>
          )}

          {/* 绩效统计 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">绩效统计</Text>
              <View className="i-mdi-chart-bar text-2xl text-blue-600" />
            </View>

            <View className="grid grid-cols-3 gap-3 mb-4">
              <View className="text-center">
                <Text className="text-2xl font-bold text-blue-600">{statistics.total_records}</Text>
                <Text className="text-xs text-muted-foreground mt-1">评估次数</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">{statistics.average_score}</Text>
                <Text className="text-xs text-muted-foreground mt-1">平均分数</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">{statistics.highest_score}</Text>
                <Text className="text-xs text-muted-foreground mt-1">最高分数</Text>
              </View>
            </View>

            {/* 改进率 */}
            {statistics.improvement_rate !== 0 && (
              <View className="flex flex-row items-center justify-center p-3 bg-blue-100 rounded-lg">
                <View
                  className={`i-mdi-trending-${statistics.improvement_rate > 0 ? 'up' : 'down'} text-xl ${statistics.improvement_rate > 0 ? 'text-muted-foreground' : 'text-red-600'} mr-2`}
                />
                <Text
                  className={`text-sm font-medium ${statistics.improvement_rate > 0 ? 'text-muted-foreground' : 'text-red-600'}`}>
                  较上月{statistics.improvement_rate > 0 ? '提升' : '下降'} {Math.abs(statistics.improvement_rate)}%
                </Text>
              </View>
            )}
          </View>

          {/* 绩效趋势 */}
          {performance_trend.length > 0 && (
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
              <View className="flex flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">绩效趋势</Text>
                <View className="i-mdi-chart-line text-2xl text-blue-600" />
              </View>

              <View className="space-y-3">
                {performance_trend.map((trend, index) => (
                  <View key={index} className="flex flex-row items-center">
                    <Text className="text-xs text-muted-foreground w-20">{trend.period}</Text>
                    <View className="flex-1 flex flex-row items-center">
                      <View className="h-2 bg-muted rounded-full flex-1 overflow-hidden">
                        <View
                          className="h-full bg-blue-100 rounded-full"
                          style={{width: `${(trend.overall_score / 5) * 100}%`}}
                        />
                      </View>
                      <Text className="text-sm font-medium text-foreground ml-2 w-8">{trend.overall_score}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 目标管理 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">我的目标</Text>
              <View className="i-mdi-target text-2xl text-blue-600" />
            </View>

            {/* 目标统计 */}
            <View className="grid grid-cols-3 gap-3 mb-4">
              <View className="text-center p-3 bg-blue-100 rounded-lg">
                <Text className="text-xl font-bold text-muted-foreground">{goal_statistics.total_goals}</Text>
                <Text className="text-xs text-muted-foreground mt-1">总目标</Text>
              </View>
              <View className="text-center p-3 bg-blue-100 rounded-lg">
                <Text className="text-xl font-bold text-muted-foreground">{goal_statistics.completed_goals}</Text>
                <Text className="text-xs text-muted-foreground mt-1">已完成</Text>
              </View>
              <View className="text-center p-3 bg-blue-100 rounded-lg">
                <Text className="text-xl font-bold text-muted-foreground">{goal_statistics.in_progress_goals}</Text>
                <Text className="text-xs text-muted-foreground mt-1">进行中</Text>
              </View>
            </View>

            {/* 目标列表 */}
            {goals.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-target-variant text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无进行中的目标</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {goals.map((goal) => (
                  <View key={goal.id} className="p-3 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground flex-1">{goal.goal_title}</Text>
                      <View className="px-2 py-1 rounded bg-blue-100">
                        <Text className="text-xs text-muted-foreground">{goal.completion_rate}%</Text>
                      </View>
                    </View>

                    {/* 进度条 */}
                    <View className="mb-2">
                      <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <View className="h-full bg-blue-100 rounded-full" style={{width: `${goal.completion_rate}%`}} />
                      </View>
                    </View>

                    {/* 目标详情 */}
                    <View className="flex flex-row items-center justify-between">
                      <Text className="text-xs text-muted-foreground">
                        {formatDate(goal.start_date)} - {formatDate(goal.end_date)}
                      </Text>
                      {goal.target_value && (
                        <Text className="text-xs text-muted-foreground">
                          {goal.current_value}/{goal.target_value} {goal.unit}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 改进计划 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">改进计划</Text>
              <View className="i-mdi-lightbulb-on text-2xl text-blue-600" />
            </View>

            {improvements.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-lightbulb-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无改进计划</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {improvements.map((improvement) => (
                  <View key={improvement.id} className="p-3 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground flex-1">{improvement.improvement_area}</Text>
                      <View
                        className={`px-2 py-1 rounded ${
                          improvement.status === 'completed'
                            ? 'bg-green-100'
                            : improvement.status === 'in_progress'
                              ? 'bg-blue-100'
                              : 'bg-gray-50'
                        }`}>
                        <Text
                          className={`text-xs ${
                            improvement.status === 'completed'
                              ? 'text-muted-foreground'
                              : improvement.status === 'in_progress'
                                ? 'text-muted-foreground'
                                : 'text-muted-foreground'
                          }`}>
                          {improvement.status === 'completed'
                            ? '已完成'
                            : improvement.status === 'in_progress'
                              ? '进行中'
                              : '计划中'}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xs text-muted-foreground mb-2">{improvement.improvement_plan}</Text>

                    {/* 进度条 */}
                    {improvement.status !== 'planning' && (
                      <View className="mb-2">
                        <View className="flex flex-row items-center justify-between mb-1">
                          <Text className="text-xs text-muted-foreground">完成进度</Text>
                          <Text className="text-xs text-muted-foreground">{improvement.progress}%</Text>
                        </View>
                        <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-blue-100 rounded-full"
                            style={{width: `${improvement.progress}%`}}
                          />
                        </View>
                      </View>
                    )}

                    {improvement.deadline && (
                      <Text className="text-xs text-muted-foreground">
                        截止日期: {formatDate(improvement.deadline)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 快捷操作 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">绩效管理</Text>
              <View className="i-mdi-cog text-2xl text-blue-600" />
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '目标设置功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-target-variant text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">设置目标</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '绩效历史功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-history text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">绩效历史</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '改进建议功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-lightbulb-on-outline text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">改进建议</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '绩效报告功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-file-chart text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">绩效报告</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
