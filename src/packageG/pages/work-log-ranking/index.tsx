// 工作日志排行榜页面
import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {EmptyState} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {getEmployeeWorkLogRanking} from '@/db/api-schedule-stats'
import type {EmployeeWorkLogRanking} from '@/db/types-schedule'

const WorkLogRanking: React.FC = () => {
  const [ranking, setRanking] = useState<EmployeeWorkLogRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')

  // 加载排行榜数据
  const loadRanking = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getEmployeeWorkLogRanking(50)
      setRanking(data)
    } catch (error) {
      console.error('加载排行榜失败:', error)
      Taro.showToast({title: '加载失败', icon: 'error'})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // 页面显示时加载数据
  useDidShow(() => {
    loadRanking()
  })

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRanking()
  }

  // 获取排名样式
  const getRankStyle = (rank: number) => {
    if (rank === 1) {
      return {
        icon: 'i-mdi-medal',
        iconColor: 'text-yellow-500',
        bgColor: 'bg-gradient-to-r from-yellow-50 to-transparent',
        borderColor: 'border-yellow-200'
      }
    }
    if (rank === 2) {
      return {
        icon: 'i-mdi-medal',
        iconColor: 'text-gray-400',
        bgColor: 'bg-gradient-to-r from-gray-50 to-transparent',
        borderColor: 'border-border'
      }
    }
    if (rank === 3) {
      return {
        icon: 'i-mdi-medal',
        iconColor: 'text-muted-foreground',
        bgColor: 'bg-gradient-to-r from-orange-50 to-transparent',
        borderColor: 'border-border'
      }
    }
    return {
      icon: 'i-mdi-account-circle',
      iconColor: 'text-muted-foreground',
      bgColor: 'bg-background',
      borderColor: 'border-border'
    }
  }

  // 获取等级标签
  const getLevelBadge = (averageScore: number) => {
    if (averageScore >= 13) {
      return {text: '优秀', color: 'bg-blue-100 text-white'}
    }
    if (averageScore >= 10) {
      return {text: '良好', color: 'bg-blue-100 text-white'}
    }
    if (averageScore >= 7) {
      return {text: '合格', color: 'bg-blue-100 text-white'}
    }
    return {text: '待改进', color: 'bg-blue-100 text-white'}
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 p-4">
        <SkeletonList count={10} />
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
          {/* 顶部说明 */}
          <View className="bg-gradient-to-r from-primary/10 to-primary-glow/10 rounded-lg p-4 border border-primary/20">
            <View className="flex items-center gap-2 mb-2">
              <View className="i-mdi-trophy text-2xl text-blue-600" />
              <Text className="text-base font-bold text-foreground">工作日志排行榜</Text>
            </View>
            <Text className="text-sm text-muted-foreground">
              根据优秀日志数量和平均评分进行排名，激励员工提升工作质量
            </Text>
          </View>

          {/* 时间范围选择 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border">
            <Text className="text-sm font-medium text-foreground mb-3">时间范围</Text>
            <View className="flex gap-2">
              {[
                {value: 'week', label: '最近7天'},
                {value: 'month', label: '最近30天'},
                {value: 'all', label: '全部时间'}
              ].map((item) => (
                <Button
                  key={item.value}
                  className={`flex-1 py-2 rounded break-keep text-sm ${
                    timeRange === item.value
                      ? 'bg-blue-100 text-white'
                      : 'bg-background text-foreground border border-border'
                  }`}
                  size="default"
                  onClick={() => setTimeRange(item.value as any)}>
                  {item.label}
                </Button>
              ))}
            </View>
          </View>

          {/* 排行榜列表 */}
          {ranking.length === 0 ? (
            <EmptyState icon="i-mdi-trophy-outline" title="暂无排行数据" description="还没有员工提交工作日志" />
          ) : (
            <View className="space-y-3">
              {ranking.map((item, index) => {
                const rank = index + 1
                const style = getRankStyle(rank)
                const level = getLevelBadge(item.average_score)

                return (
                  <View
                    key={item.employee_id}
                    className={`${style.bgColor} rounded-lg p-4 border ${style.borderColor} shadow-sm`}>
                    <View className="flex items-center gap-3">
                      {/* 排名 */}
                      <View className="flex-shrink-0 w-12 text-center">
                        {rank <= 3 ? (
                          <View className={`${style.icon} ${style.iconColor} text-3xl`} />
                        ) : (
                          <Text className="text-2xl font-bold text-muted-foreground">{rank}</Text>
                        )}
                      </View>

                      {/* 员工信息 */}
                      <View className="flex-1">
                        <View className="flex items-center gap-2 mb-2">
                          <Text className="text-base font-semibold text-foreground">
                            员工 {item.employee_id.slice(0, 8)}
                          </Text>
                          <View className={`px-2 py-0.5 rounded text-xs ${level.color}`}>{level.text}</View>
                        </View>

                        {/* 统计数据 */}
                        <View className="flex items-center gap-4">
                          <View className="flex items-center gap-1">
                            <View className="i-mdi-notebook text-sm text-muted-foreground" />
                            <Text className="text-xs text-muted-foreground">{item.total_logs} 条日志</Text>
                          </View>
                          <View className="flex items-center gap-1">
                            <View className="i-mdi-star text-sm text-yellow-500" />
                            <Text className="text-xs text-muted-foreground">
                              平均 {item.average_score.toFixed(1)} 分
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* 优秀日志数 */}
                      <View className="flex-shrink-0 text-center">
                        <Text className="text-2xl font-bold text-muted-foreground">{item.excellent_logs}</Text>
                        <Text className="text-xs text-muted-foreground mt-1">优秀</Text>
                      </View>
                    </View>

                    {/* 进度条 */}
                    {item.total_logs > 0 && (
                      <View className="mt-3 pt-3 border-t border-border">
                        <View className="flex items-center justify-between mb-1">
                          <Text className="text-xs text-muted-foreground">优秀率</Text>
                          <Text className="text-xs font-medium text-foreground">
                            {((item.excellent_logs / item.total_logs) * 100).toFixed(1)}%
                          </Text>
                        </View>
                        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-blue-100"
                            style={{
                              width: `${(item.excellent_logs / item.total_logs) * 100}%`
                            }}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* 底部说明 */}
          {ranking.length > 0 && (
            <View className="bg-gray-50/50 rounded-lg p-4">
              <Text className="text-xs text-muted-foreground text-center">
                排名规则：优先按优秀日志数量排序，相同时按平均分排序
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default WorkLogRanking
