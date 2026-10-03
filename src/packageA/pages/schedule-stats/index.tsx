// 排班统计分析页面
import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {SkeletonStatCard} from '@/components/Skeleton'
import {
  getEmployeeWorkLogRanking,
  getWorkLogStats,
  getWorkLogStatsByDateRange,
  getWorkScheduleStats,
  getWorkScheduleStatsByDateRange
} from '@/db/api-schedule-stats'
import type {EmployeeWorkLogRanking, WorkLogStats, WorkScheduleStats} from '@/db/types-schedule'

const ScheduleStats: React.FC = () => {
  const [scheduleStats, setScheduleStats] = useState<WorkScheduleStats | null>(null)
  const [logStats, setLogStats] = useState<WorkLogStats | null>(null)
  const [ranking, setRanking] = useState<EmployeeWorkLogRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month')
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'log' | 'ranking'>('overview')

  // 加载统计数据
  const loadStats = useCallback(async () => {
    try {
      setLoading(true)

      // 计算日期范围
      let startDate: string | undefined
      let endDate: string | undefined

      if (dateRange !== 'all') {
        const end = new Date()
        const start = new Date()

        if (dateRange === 'week') {
          start.setDate(end.getDate() - 7)
        } else {
          start.setMonth(end.getMonth() - 1)
        }

        startDate = start.toISOString().split('T')[0]
        endDate = end.toISOString().split('T')[0]
      }

      // 加载数据
      const [scheduleData, logData, rankingData] = await Promise.all([
        startDate && endDate ? getWorkScheduleStatsByDateRange(startDate, endDate) : getWorkScheduleStats(),
        startDate && endDate ? getWorkLogStatsByDateRange(startDate, endDate) : getWorkLogStats(),
        getEmployeeWorkLogRanking(20)
      ])

      setScheduleStats(scheduleData)
      setLogStats(logData)
      setRanking(rankingData)
    } catch (error) {
      console.error('加载统计数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'error'})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateRange])

  // 页面显示时加载数据
  useDidShow(() => {
    loadStats()
  })

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadStats()
  }

  // 获取排名奖牌图标
  const getRankIcon = (rank: number) => {
    if (rank === 1) return 'i-mdi-medal text-yellow-500'
    if (rank === 2) return 'i-mdi-medal text-gray-400'
    if (rank === 3) return 'i-mdi-medal text-muted-foreground'
    return `i-mdi-numeric-${rank}-circle text-muted-foreground`
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 p-4">
        <SkeletonStatCard />
        <SkeletonStatCard />
        <SkeletonStatCard />
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4 space-y-4">
          {/* 时间范围选择 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border">
            <Text className="text-sm font-medium text-foreground mb-3">时间范围</Text>
            <View className="flex gap-2">
              {[
                {value: 'week', label: '最近7天'},
                {value: 'month', label: '最近30天'},
                {value: 'all', label: '全部'}
              ].map((item) => (
                <Button
                  key={item.value}
                  className={`flex-1 py-2 rounded break-keep text-sm ${
                    dateRange === item.value
                      ? 'bg-blue-100 text-white'
                      : 'bg-background text-foreground border border-border'
                  }`}
                  size="default"
                  onClick={() => setDateRange(item.value as any)}>
                  {item.label}
                </Button>
              ))}
            </View>
          </View>

          {/* 标签页 */}
          <View className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
            <View className="flex border-b border-border">
              {[
                {value: 'overview', label: '概览', icon: 'i-mdi-view-dashboard'},
                {value: 'schedule', label: '排班', icon: 'i-mdi-calendar-check'},
                {value: 'log', label: '日志', icon: 'i-mdi-notebook'},
                {value: 'ranking', label: '排行', icon: 'i-mdi-trophy'}
              ].map((tab) => (
                <Button
                  key={tab.value}
                  className={`flex-1 py-3 break-keep text-sm ${
                    activeTab === tab.value
                      ? 'bg-blue-100 text-blue-600 border-b-2 border-primary'
                      : 'bg-transparent text-muted-foreground'
                  }`}
                  size="default"
                  onClick={() => setActiveTab(tab.value as any)}>
                  <View className="flex flex-col items-center gap-1">
                    <View className={`${tab.icon} text-lg`} />
                    <Text className="text-xs">{tab.label}</Text>
                  </View>
                </Button>
              ))}
            </View>

            {/* 概览标签页 */}
            {activeTab === 'overview' && (
              <View className="p-4 space-y-4">
                {/* 排班统计 */}
                {scheduleStats && (
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-3">排班统计</Text>
                    <View className="grid grid-cols-2 gap-3">
                      <View className="bg-gray-50 rounded-lg p-3 border border-border">
                        <Text className="text-xs text-muted-foreground">总排班</Text>
                        <Text className="text-2xl font-bold text-blue-600 mt-1">{scheduleStats.total_schedules}</Text>
                      </View>
                      <View className="bg-gray-50 rounded-lg p-3 border border-border">
                        <Text className="text-xs text-muted-foreground">已完成</Text>
                        <Text className="text-2xl font-bold text-muted-foreground mt-1">
                          {scheduleStats.completed_schedules}
                        </Text>
                      </View>
                      <View className="bg-gray-50 rounded-lg p-3 border border-border">
                        <Text className="text-xs text-muted-foreground">待执行</Text>
                        <Text className="text-2xl font-bold text-orange-500 mt-1">
                          {scheduleStats.pending_schedules}
                        </Text>
                      </View>
                      <View className="bg-gray-50 rounded-lg p-3 border border-border">
                        <Text className="text-xs text-muted-foreground">完成率</Text>
                        <Text className="text-2xl font-bold text-blue-600 mt-1">{scheduleStats.completion_rate}%</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* 日志统计 */}
                {logStats && (
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-3">日志统计</Text>
                    <View className="grid grid-cols-2 gap-3">
                      <View className="bg-gray-50 rounded-lg p-3 border border-border">
                        <Text className="text-xs text-muted-foreground">总日志</Text>
                        <Text className="text-2xl font-bold text-blue-600 mt-1">{logStats.total_logs}</Text>
                      </View>
                      <View className="bg-gray-50 rounded-lg p-3 border border-border">
                        <Text className="text-xs text-muted-foreground">优秀日志</Text>
                        <Text className="text-2xl font-bold text-muted-foreground mt-1">{logStats.excellent_logs}</Text>
                      </View>
                      <View className="bg-gray-50 rounded-lg p-3 border border-border">
                        <Text className="text-xs text-muted-foreground">平均分</Text>
                        <Text className="text-2xl font-bold text-blue-600 mt-1">
                          {logStats.average_total_score?.toFixed(1) || '0.0'}
                        </Text>
                      </View>
                      <View className="bg-gray-50 rounded-lg p-3 border border-border">
                        <Text className="text-xs text-muted-foreground">优秀率</Text>
                        <Text className="text-2xl font-bold text-muted-foreground mt-1">
                          {logStats.excellent_rate}%
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* 排班标签页 */}
            {activeTab === 'schedule' && scheduleStats && (
              <View className="p-4 space-y-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="bg-gradient-to-br from-primary to-primary-glow rounded-lg p-4 text-white">
                    <Text className="text-xs opacity-90">总排班数</Text>
                    <Text className="text-3xl font-bold mt-2">{scheduleStats.total_schedules}</Text>
                  </View>
                  <View className="bg-blue-100 rounded-lg p-4 text-white">
                    <Text className="text-xs opacity-90">已完成</Text>
                    <Text className="text-3xl font-bold mt-2">{scheduleStats.completed_schedules}</Text>
                  </View>
                  <View className="bg-blue-100 rounded-lg p-4 text-white">
                    <Text className="text-xs opacity-90">待执行</Text>
                    <Text className="text-3xl font-bold mt-2">{scheduleStats.pending_schedules}</Text>
                  </View>
                  <View className="bg-muted rounded-lg p-4 text-white">
                    <Text className="text-xs opacity-90">已取消</Text>
                    <Text className="text-3xl font-bold mt-2">{scheduleStats.cancelled_schedules}</Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-lg p-4 border border-border">
                  <Text className="text-sm font-semibold text-foreground mb-3">完成率</Text>
                  <View className="flex items-center gap-3">
                    <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-gradient-to-r from-primary to-primary-glow"
                        style={{width: `${scheduleStats.completion_rate}%`}}
                      />
                    </View>
                    <Text className="text-lg font-bold text-blue-600">{scheduleStats.completion_rate}%</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 日志标签页 */}
            {activeTab === 'log' && logStats && (
              <View className="p-4 space-y-4">
                <View className="grid grid-cols-2 gap-3">
                  <View className="bg-gradient-to-br from-primary to-primary-glow rounded-lg p-4 text-white">
                    <Text className="text-xs opacity-90">总日志数</Text>
                    <Text className="text-3xl font-bold mt-2">{logStats.total_logs}</Text>
                  </View>
                  <View className="bg-blue-100 rounded-lg p-4 text-white">
                    <Text className="text-xs opacity-90">优秀日志</Text>
                    <Text className="text-3xl font-bold mt-2">{logStats.excellent_logs}</Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-lg p-4 border border-border">
                  <Text className="text-sm font-semibold text-foreground mb-3">平均评分</Text>
                  <View className="flex items-center justify-center py-4">
                    <View className="text-center">
                      <Text className="text-5xl font-bold text-blue-600">
                        {logStats.average_total_score?.toFixed(1) || '0.0'}
                      </Text>
                      <Text className="text-sm text-muted-foreground mt-2">/ 15.0</Text>
                    </View>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-lg p-4 border border-border">
                  <Text className="text-sm font-semibold text-foreground mb-3">优秀率</Text>
                  <View className="flex items-center gap-3">
                    <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <View className="h-full bg-blue-100" style={{width: `${logStats.excellent_rate}%`}} />
                    </View>
                    <Text className="text-lg font-bold text-muted-foreground">{logStats.excellent_rate}%</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 排行标签页 */}
            {activeTab === 'ranking' && (
              <View className="p-4">
                {ranking.length === 0 ? (
                  <View className="text-center py-8">
                    <View className="i-mdi-trophy-outline text-6xl text-muted-foreground mb-2" />
                    <Text className="text-sm text-muted-foreground">暂无排行数据</Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {ranking.map((item, index) => (
                      <View
                        key={item.employee_id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          index < 3 ? 'bg-gradient-to-r from-primary/10 to-transparent' : 'bg-background'
                        } border border-border`}>
                        <View className={`${getRankIcon(index + 1)} text-2xl`} />
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-foreground">
                            员工 {item.employee_id.slice(0, 8)}
                          </Text>
                          <Text className="text-xs text-muted-foreground mt-1">
                            {item.total_logs} 条日志 · 平均 {item.average_score?.toFixed(1)} 分
                          </Text>
                        </View>
                        <View className="text-right">
                          <Text className="text-lg font-bold text-blue-600">{item.excellent_logs}</Text>
                          <Text className="text-xs text-muted-foreground">优秀</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default ScheduleStats
