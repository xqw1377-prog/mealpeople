/**
 * 历史班次页面
 * 查看员工的历史班次记录，支持按月/周查看，提供统计分析
 */

import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getWorkScheduleRecordsByEmployeeAndDateRange} from '@/db/api-schedule-record'
import type {WorkScheduleRecord} from '@/db/types-schedule'

// 视图类型
type ViewType = 'month' | 'week'

// 统计数据类型
interface ScheduleStats {
  totalDays: number // 总工作天数
  totalHours: number // 总工作时长
  morningShifts: number // 早班次数
  afternoonShifts: number // 中班次数
  eveningShifts: number // 晚班次数
  nightShifts: number // 夜班次数
}

export default function ScheduleHistory() {
  const {user} = useAuth({guard: true})

  // 视图类型
  const [viewType, setViewType] = useState<ViewType>('month')

  // 当前选择的年月
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)

  // 班次数据
  const [schedules, setSchedules] = useState<WorkScheduleRecord[]>([])
  const [stats, setStats] = useState<ScheduleStats>({
    totalDays: 0,
    totalHours: 0,
    morningShifts: 0,
    afternoonShifts: 0,
    eveningShifts: 0,
    nightShifts: 0
  })

  // 加载状态
  const [loading, setLoading] = useState(false)

  // 年份选择器数据
  const years = Array.from({length: 5}, (_, i) => (new Date().getFullYear() - 2 + i).toString())
  const months = Array.from({length: 12}, (_, i) => (i + 1).toString())

  // 加载班次数据
  const loadSchedules = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // 计算日期范围
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)

      // 格式化为 YYYY-MM-DD
      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // 获取班次数据
      const data = await getWorkScheduleRecordsByEmployeeAndDateRange(user.id, startDateStr, endDateStr)

      setSchedules(data)

      // 计算统计数据
      const newStats: ScheduleStats = {
        totalDays: data.length,
        totalHours: 0,
        morningShifts: 0,
        afternoonShifts: 0,
        eveningShifts: 0,
        nightShifts: 0
      }

      for (const schedule of data) {
        // 计算工作时长
        if (schedule.start_time && schedule.end_time) {
          const start = new Date(`2000-01-01 ${schedule.start_time}`)
          const end = new Date(`2000-01-01 ${schedule.end_time}`)
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
          newStats.totalHours += hours > 0 ? hours : 0
        }

        // 统计班次类型
        const shiftType = schedule.shift_type || ''
        if (shiftType.includes('早班') || shiftType.includes('morning')) {
          newStats.morningShifts++
        } else if (shiftType.includes('中班') || shiftType.includes('afternoon')) {
          newStats.afternoonShifts++
        } else if (shiftType.includes('晚班') || shiftType.includes('evening')) {
          newStats.eveningShifts++
        } else if (shiftType.includes('夜班') || shiftType.includes('night')) {
          newStats.nightShifts++
        }
      }

      setStats(newStats)
    } catch (error) {
      console.error('加载班次数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, selectedYear, selectedMonth])

  // 页面显示时加载数据
  useDidShow(() => {
    loadSchedules()
  })

  // 年份选择
  const handleYearChange = (e: any) => {
    const index = e.detail.value
    setSelectedYear(Number.parseInt(years[index], 10))
  }

  // 月份选择
  const handleMonthChange = (e: any) => {
    const index = e.detail.value
    setSelectedMonth(Number.parseInt(months[index], 10))
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 格式化星期
  const formatWeekday = (dateString: string) => {
    const date = new Date(dateString)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }

  // 获取班次类型标签样式
  const getShiftTypeBadge = (shiftType: string) => {
    if (shiftType.includes('早班') || shiftType.includes('morning')) {
      return {text: '早班', color: 'text-muted-foreground', bg: 'bg-blue-100'}
    }
    if (shiftType.includes('中班') || shiftType.includes('afternoon')) {
      return {text: '中班', color: 'text-white', bg: 'bg-blue-100'}
    }
    if (shiftType.includes('晚班') || shiftType.includes('evening')) {
      return {text: '晚班', color: 'text-muted-foreground', bg: 'bg-blue-100'}
    }
    if (shiftType.includes('夜班') || shiftType.includes('night')) {
      return {text: '夜班', color: 'text-indigo-600', bg: 'bg-blue-100'}
    }
    return {text: shiftType, color: 'text-muted-foreground', bg: 'bg-gray-50'}
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 日期选择器 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-bold text-foreground">选择时间</Text>
              <View className="flex items-center gap-2">
                <View
                  className={`px-3 py-1 rounded-lg ${viewType === 'month' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'}`}
                  onClick={() => setViewType('month')}>
                  <Text className="text-xs">按月</Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-lg ${viewType === 'week' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'}`}
                  onClick={() => setViewType('week')}>
                  <Text className="text-xs">按周</Text>
                </View>
              </View>
            </View>

            <View className="flex items-center gap-3">
              <Picker
                mode="selector"
                range={years}
                onChange={handleYearChange}
                value={years.indexOf(selectedYear.toString())}>
                <View className="flex-1 bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <Text className="text-sm text-foreground">{selectedYear}年</Text>
                  <View className="i-mdi-chevron-down text-lg text-muted-foreground" />
                </View>
              </Picker>

              <Picker
                mode="selector"
                range={months}
                onChange={handleMonthChange}
                value={months.indexOf(selectedMonth.toString())}>
                <View className="flex-1 bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <Text className="text-sm text-foreground">{selectedMonth}月</Text>
                  <View className="i-mdi-chevron-down text-lg text-muted-foreground" />
                </View>
              </Picker>

              <Button
                className="bg-blue-100 text-white px-4 py-2 rounded-lg break-keep text-sm"
                size="mini"
                onClick={loadSchedules}>
                查询
              </Button>
            </View>
          </View>

          {/* 统计卡片 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <Text className="text-base font-bold text-foreground mb-4">统计数据</Text>
            <View className="grid grid-cols-2 gap-3">
              <View className="bg-gray-50 rounded-lg p-3">
                <View className="flex items-center gap-2 mb-1">
                  <View className="i-mdi-calendar-check text-lg text-blue-600" />
                  <Text className="text-xs text-muted-foreground">工作天数</Text>
                </View>
                <Text className="text-xl font-bold text-foreground">{stats.totalDays}</Text>
                <Text className="text-xs text-muted-foreground">天</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <View className="flex items-center gap-2 mb-1">
                  <View className="i-mdi-clock-outline text-lg text-accent" />
                  <Text className="text-xs text-muted-foreground">工作时长</Text>
                </View>
                <Text className="text-xl font-bold text-foreground">{stats.totalHours.toFixed(1)}</Text>
                <Text className="text-xs text-muted-foreground">小时</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <View className="flex items-center gap-2 mb-1">
                  <View className="i-mdi-weather-sunset-up text-lg text-orange-500" />
                  <Text className="text-xs text-muted-foreground">早班</Text>
                </View>
                <Text className="text-xl font-bold text-foreground">{stats.morningShifts}</Text>
                <Text className="text-xs text-muted-foreground">次</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <View className="flex items-center gap-2 mb-1">
                  <View className="i-mdi-weather-night text-lg text-indigo-500" />
                  <Text className="text-xs text-muted-foreground">晚班</Text>
                </View>
                <Text className="text-xl font-bold text-foreground">{stats.eveningShifts + stats.nightShifts}</Text>
                <Text className="text-xs text-muted-foreground">次</Text>
              </View>
            </View>
          </View>

          {/* 班次列表 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-bold text-foreground">班次记录</Text>
              <Text className="text-xs text-muted-foreground">共 {schedules.length} 条</Text>
            </View>

            {loading ? (
              <View className="py-8 flex flex-col items-center justify-center">
                <View className="i-mdi-loading text-3xl text-blue-600 animate-spin mb-2" />
                <Text className="text-sm text-muted-foreground">加载中...</Text>
              </View>
            ) : schedules.length === 0 ? (
              <View className="py-8 flex flex-col items-center justify-center">
                <View className="i-mdi-calendar-blank text-4xl text-muted-foreground mb-2" />
                <Text className="text-sm text-muted-foreground">暂无班次记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {schedules.map((schedule) => {
                  const badge = getShiftTypeBadge(schedule.shift_type || '')
                  return (
                    <View key={schedule.id} className="bg-gray-50 rounded-lg p-3">
                      <View className="flex items-center justify-between mb-2">
                        <View className="flex items-center gap-2">
                          <Text className="text-sm font-medium text-foreground">
                            {formatDate(schedule.schedule_date)}
                          </Text>
                          <Text className="text-xs text-muted-foreground">{formatWeekday(schedule.schedule_date)}</Text>
                        </View>
                        <View className={`px-2 py-1 rounded ${badge.bg}`}>
                          <Text className={`text-xs ${badge.color}`}>{badge.text}</Text>
                        </View>
                      </View>

                      <View className="flex items-center gap-4">
                        <View className="flex items-center gap-1">
                          <View className="i-mdi-clock-start text-sm text-muted-foreground" />
                          <Text className="text-xs text-muted-foreground">{schedule.start_time || '--:--'}</Text>
                        </View>
                        <View className="flex items-center gap-1">
                          <View className="i-mdi-clock-end text-sm text-muted-foreground" />
                          <Text className="text-xs text-muted-foreground">{schedule.end_time || '--:--'}</Text>
                        </View>
                      </View>

                      {schedule.notes && (
                        <View className="mt-2 pt-2 border-t border-border">
                          <Text className="text-xs text-muted-foreground">{schedule.notes}</Text>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 底部占位 */}
          <View className="h-4" />
        </View>
      </ScrollView>
    </View>
  )
}
