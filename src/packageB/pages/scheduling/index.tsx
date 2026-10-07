/**
 * 我的班次页面
 * V3.17 优化版 - 员工视角的班次管理
 * 设计理念：简洁、清晰、便捷
 * 数据持久化：连接Supabase数据库
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'

/**
 * P2-S1-A cutover：数据源由 employee_shifts 切至 schedules（published SSOT）。
 * 读取受 RLS schedules_select_own_published 约束：仅本人 + published，
 * legacy 0 exposure；统计由同批数据前端推导，不再读第二张表。
 */

interface ScheduleRow {
  id: string
  schedule_date: string
  shift_type: string
  start_time: string | null
  end_time: string | null
  is_day_off: boolean | null
  meal_period: string | null
}

// 班次显示数据类型
interface ShiftDisplayData {
  date: string
  dayOfWeek: string
  shiftName: string
  startTime: string
  endTime: string
  hours: number
  storeName: string
  position: string
  isToday: boolean
  isRestDay: boolean
  status: string
  statusColor: string
}

const MEAL_LABEL: Record<string, string> = {
  all_day: '全天',
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐'
}

export default function MySchedule() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [weekSchedule, setWeekSchedule] = useState<ShiftDisplayData[]>([])
  const [statistics, setStatistics] = useState({
    total_shifts: 0,
    total_hours: 0,
    completed_shifts: 0,
    scheduled_shifts: 0,
    rest_days: 0
  })

  // 转换 schedules 行为显示格式（含工时推导：跨天 end<=start 按 +24h 计）
  const convertSchedulesToDisplayData = useCallback((rows: ScheduleRow[]): ShiftDisplayData[] => {
    const today = new Date().toISOString().split('T')[0]
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

    return rows.map((row) => {
      const date = new Date(row.schedule_date)
      const isRest = !!row.is_day_off
      const s = (row.start_time || '').slice(0, 5)
      const e = (row.end_time || '').slice(0, 5)
      let hours = 0
      if (!isRest && s && e) {
        const [sh, sm] = s.split(':').map(Number)
        const [eh, em] = e.split(':').map(Number)
        let diff = eh * 60 + em - (sh * 60 + sm)
        if (diff <= 0) diff += 24 * 60
        hours = Math.round((diff / 60) * 10) / 10
      }
      return {
        date: row.schedule_date,
        dayOfWeek: weekDays[date.getDay()],
        shiftName: isRest
          ? `休息（${MEAL_LABEL[row.meal_period || 'all_day'] || '全天'}）`
          : row.start_time
            ? '班次'
            : '班次',
        startTime: s,
        endTime: e,
        hours,
        storeName: '',
        position: '',
        isToday: row.schedule_date === today,
        isRestDay: isRest,
        status: '已发布',
        statusColor: 'text-accent'
      }
    })
  }, [])

  // 加载班次数据（schedules published SSOT）
  const loadShifts = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // 本人全部在职员工身份（User→Employee 为 1:N）
      const {data: empRows, error: empErr} = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
      if (empErr) throw empErr
      if (!empRows || empRows.length === 0) {
        setWeekSchedule([])
        setStatistics({total_shifts: 0, total_hours: 0, completed_shifts: 0, scheduled_shifts: 0, rest_days: 0})
        setLoading(false)
        return
      }
      const employeeIds = empRows.map((e: {id: string}) => e.id)

      // 本周区间（周一至周日）
      const today = new Date()
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const startDate = monday.toISOString().split('T')[0]
      const endDate = sunday.toISOString().split('T')[0]

      // schedules published（RLS：仅本人 + published，legacy 天然不可见）
      const {data: rows, error: rowsErr} = await supabase
        .from('schedules')
        .select('id, schedule_date, shift_type, start_time, end_time, is_day_off, meal_period')
        .in('employee_id', employeeIds)
        .eq('status', 'published')
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .order('schedule_date', {ascending: true})
        .order('start_time', {ascending: true, nullsFirst: false})
      if (rowsErr) throw rowsErr

      const displayData = convertSchedulesToDisplayData((rows || []) as ScheduleRow[])
      setWeekSchedule(displayData)

      // 统计由同一批事实推导
      const workRows = displayData.filter((d) => !d.isRestDay)
      setStatistics({
        total_shifts: displayData.length,
        total_hours: Math.round(workRows.reduce((sum, d) => sum + d.hours, 0) * 10) / 10,
        completed_shifts: 0,
        scheduled_shifts: workRows.length,
        rest_days: displayData.length - workRows.length
      })
    } catch (error) {
      console.error('加载班次失败:', error)
      Taro.showToast({title: '加载失败，请重试', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user, convertSchedulesToDisplayData])

  // 页面显示时加载数据
  useDidShow(() => {
    loadShifts()
  })

  // 如果没有班次数据，生成空白的本周日期
  const getEmptyWeekSchedule = (): ShiftDisplayData[] => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const emptySchedule: ShiftDisplayData[] = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const todayStr = new Date().toISOString().split('T')[0]

      emptySchedule.push({
        date: dateStr,
        dayOfWeek: weekDays[i],
        shiftName: '未排班',
        startTime: '',
        endTime: '',
        hours: 0,
        storeName: '',
        position: '',
        isToday: dateStr === todayStr,
        isRestDay: false,
        status: '未排班',
        statusColor: 'text-muted-foreground'
      })
    }

    return emptySchedule
  }

  // 使用实际数据或空白数据
  const displaySchedule = weekSchedule.length > 0 ? weekSchedule : getEmptyWeekSchedule()

  // 今日班次
  const todayShift = displaySchedule.find((shift) => shift.isToday)

  // 换班申请
  const handleSwapShift = () => {
    Taro.navigateTo({
      url: '/packageB/pages/shift-swap/index'
    })
  }

  // 查看换班记录
  const handleViewSwapRecords = () => {
    Taro.navigateTo({
      url: '/packageB/pages/swap-records/index'
    })
  }

  // 请假申请
  const handleLeaveRequest = () => {
    Taro.navigateTo({
      url: '/packageB/pages/leave-request/index'
    })
  }

  // 查看历史班次
  const handleViewHistory = () => {
    Taro.showToast({
      title: '历史班次功能开发中',
      icon: 'none'
    })
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {loading ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200">
              <Text className="text-center text-muted-foreground">加载中...</Text>
            </View>
          ) : (
            <>
              {/* 今日班次卡片 */}
              {todayShift && (
                <View className="bg-blue-100 rounded-lg p-6">
                  <View className="flex flex-row items-center justify-between mb-4">
                    <Text className="text-foreground text-lg font-bold">今日班次</Text>
                    <View className="bg-white rounded-full px-3 py-1">
                      <Text className="text-blue-600 text-xs">{todayShift.date}</Text>
                    </View>
                  </View>

                  {todayShift.isRestDay ? (
                    <View className="text-center py-4">
                      <View className="i-mdi-sleep text-5xl text-blue-600 mb-2" />
                      <Text className="text-foreground text-xl font-bold">今日休息</Text>
                      <Text className="text-blue-600/80 text-sm mt-2">享受轻松的一天吧！</Text>
                    </View>
                  ) : (
                    <View className="space-y-3">
                      <View className="flex flex-row items-center">
                        <View className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                          <View className="i-mdi-clock-outline text-2xl text-blue-600" />
                        </View>
                        <View>
                          <Text className="text-blue-600/80 text-xs">班次时间</Text>
                          <Text className="text-foreground text-lg font-bold">
                            {todayShift.shiftName} {todayShift.startTime} - {todayShift.endTime}
                          </Text>
                        </View>
                      </View>

                      <View className="flex flex-row items-center">
                        <View className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                          <View className="i-mdi-store text-2xl text-blue-600" />
                        </View>
                        <View>
                          <Text className="text-blue-600/80 text-xs">工作地点</Text>
                          <Text className="text-blue-600 text-base font-medium">{todayShift.storeName}</Text>
                        </View>
                      </View>

                      <View className="flex flex-row items-center">
                        <View className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                          <View className="i-mdi-account-tie text-2xl text-blue-600" />
                        </View>
                        <View>
                          <Text className="text-blue-600/80 text-xs">工作岗位</Text>
                          <Text className="text-blue-600 text-base font-medium">{todayShift.position}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* 快捷操作 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-foreground">快捷操作</Text>
                  <View className="i-mdi-lightning-bolt text-2xl text-blue-600" />
                </View>
                <View className="grid grid-cols-4 gap-3">
                  <View
                    className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                    onClick={handleSwapShift}>
                    <View className="i-mdi-swap-horizontal text-3xl text-muted-foreground mb-2" />
                    <Text className="text-xs text-muted-foreground font-medium text-center">换班申请</Text>
                  </View>

                  <View
                    className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                    onClick={handleLeaveRequest}>
                    <View className="i-mdi-calendar-remove text-3xl text-muted-foreground mb-2" />
                    <Text className="text-xs text-muted-foreground font-medium text-center">请假申请</Text>
                  </View>

                  <View
                    className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                    onClick={handleViewSwapRecords}>
                    <View className="i-mdi-file-document-outline text-3xl text-muted-foreground mb-2" />
                    <Text className="text-xs text-muted-foreground font-medium text-center">换班记录</Text>
                  </View>

                  <View
                    className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                    onClick={handleViewHistory}>
                    <View className="i-mdi-history text-3xl text-muted-foreground mb-2" />
                    <Text className="text-xs text-muted-foreground font-medium text-center">历史班次</Text>
                  </View>
                </View>
              </View>

              {/* 本周班次 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-foreground">本周班次</Text>
                  <View className="i-mdi-calendar-week text-2xl text-blue-600" />
                </View>

                <View className="space-y-3">
                  {displaySchedule.map((shift) => (
                    <View
                      key={shift.date}
                      className={`rounded-xl p-4 ${
                        shift.isToday ? 'bg-blue-100 border-2 border-border' : 'bg-gray-50/30'
                      }`}>
                      <View className="flex flex-row items-center justify-between mb-2">
                        <View className="flex flex-row items-center">
                          <Text
                            className={`text-sm font-bold ${shift.isToday ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {shift.dayOfWeek}
                          </Text>
                          <Text className="text-xs text-muted-foreground ml-2">{shift.date}</Text>
                          {shift.isToday && (
                            <View className="bg-blue-100 rounded-full px-2 py-0.5 ml-2">
                              <Text className="text-blue-600 text-xs">今天</Text>
                            </View>
                          )}
                        </View>
                        <View className="flex flex-row items-center">
                          {!shift.isRestDay && (
                            <Text className="text-xs text-muted-foreground mr-2">{shift.hours}小时</Text>
                          )}
                          <Text className={`text-xs ${shift.statusColor}`}>{shift.status}</Text>
                        </View>
                      </View>

                      {shift.isRestDay ? (
                        <View className="flex flex-row items-center">
                          <View className="i-mdi-sleep text-xl text-muted-foreground mr-2" />
                          <Text className="text-sm text-muted-foreground">休息日</Text>
                        </View>
                      ) : shift.shiftName === '未排班' ? (
                        <View className="flex flex-row items-center">
                          <View className="i-mdi-calendar-blank text-xl text-muted-foreground mr-2" />
                          <Text className="text-sm text-muted-foreground">未排班</Text>
                        </View>
                      ) : (
                        <View className="space-y-1">
                          <View className="flex flex-row items-center">
                            <View className="i-mdi-clock-outline text-base text-blue-600 mr-2" />
                            <Text className="text-sm text-foreground">
                              {shift.shiftName} {shift.startTime} - {shift.endTime}
                            </Text>
                          </View>
                          {shift.storeName && (
                            <View className="flex flex-row items-center">
                              <View className="i-mdi-store text-base text-blue-600 mr-2" />
                              <Text className="text-xs text-muted-foreground">{shift.storeName}</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* 本周统计 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-foreground">本周统计</Text>
                  <View className="i-mdi-chart-bar text-2xl text-blue-600" />
                </View>

                <View className="grid grid-cols-3 gap-3">
                  <View className="bg-blue-100 rounded-xl p-3 text-center">
                    <Text className="text-xs text-muted-foreground">工作天数</Text>
                    <Text className="text-2xl font-bold text-muted-foreground mt-1">
                      {statistics.total_shifts - statistics.rest_days}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1">天</Text>
                  </View>

                  <View className="bg-blue-100 rounded-xl p-3 text-center">
                    <Text className="text-xs text-muted-foreground">工作时长</Text>
                    <Text className="text-2xl font-bold text-muted-foreground mt-1">{statistics.total_hours}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">小时</Text>
                  </View>

                  <View className="bg-blue-100 rounded-xl p-3 text-center">
                    <Text className="text-xs text-muted-foreground">休息天数</Text>
                    <Text className="text-2xl font-bold text-muted-foreground mt-1">{statistics.rest_days}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">天</Text>
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
