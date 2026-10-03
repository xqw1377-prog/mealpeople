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
import {getEmployeeByUserId} from '@/db/api'
import {getEmployeeWeekShifts, getShiftStatistics} from '@/db/api-shifts'
import type {EmployeeShift, ShiftStatistics} from '@/db/types-shifts'

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

export default function MySchedule() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [weekSchedule, setWeekSchedule] = useState<ShiftDisplayData[]>([])
  const [statistics, setStatistics] = useState<ShiftStatistics>({
    total_shifts: 0,
    total_hours: 0,
    completed_shifts: 0,
    scheduled_shifts: 0,
    rest_days: 0
  })

  // 获取状态信息
  const getStatusInfo = useCallback((status: string) => {
    const statusMap: Record<string, {text: string; color: string}> = {
      scheduled: {text: '已排班', color: 'text-accent'},
      confirmed: {text: '已确认', color: 'text-blue-600'},
      completed: {text: '已完成', color: 'text-muted-foreground'},
      cancelled: {text: '已取消', color: 'text-muted-foreground'}
    }
    return statusMap[status] || {text: '未知', color: 'text-muted-foreground'}
  }, [])

  // 转换班次数据为显示格式
  const convertShiftsToDisplayData = useCallback(
    (shifts: EmployeeShift[]): ShiftDisplayData[] => {
      const today = new Date().toISOString().split('T')[0]
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

      return shifts.map((shift) => {
        const date = new Date(shift.shift_date)
        const dayOfWeek = weekDays[date.getDay()]
        const isToday = shift.shift_date === today
        const isRestDay = shift.shift_type === 'rest'

        // 获取班次名称
        const shiftNames: Record<string, string> = {
          morning: '早班',
          afternoon: '中班',
          evening: '晚班',
          night: '夜班',
          rest: '休息'
        }

        // 获取状态信息
        const statusInfo = getStatusInfo(shift.status)

        return {
          date: shift.shift_date,
          dayOfWeek,
          shiftName: shiftNames[shift.shift_type] || '未知',
          startTime: shift.start_time?.substring(0, 5) || '',
          endTime: shift.end_time?.substring(0, 5) || '',
          hours: shift.work_hours || 0,
          storeName: '门店', // TODO: 从store_id获取门店名称
          position: shift.position || '未指定',
          isToday,
          isRestDay,
          status: statusInfo.text,
          statusColor: statusInfo.color
        }
      })
    },
    [getStatusInfo]
  )

  // 加载班次数据
  const loadShifts = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        Taro.showToast({title: '未找到员工信息', icon: 'none'})
        setLoading(false)
        return
      }

      // 获取本周班次
      const shifts = await getEmployeeWeekShifts(employee.id)

      // 获取本周统计
      const today = new Date()
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      const startDate = monday.toISOString().split('T')[0]
      const endDate = sunday.toISOString().split('T')[0]

      const stats = await getShiftStatistics(employee.id, startDate, endDate)
      setStatistics(stats)

      // 转换为显示数据
      const displayData = convertShiftsToDisplayData(shifts)
      setWeekSchedule(displayData)
    } catch (error) {
      console.error('加载班次失败:', error)
      Taro.showToast({title: '加载失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }, [user, convertShiftsToDisplayData])

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
                  {displaySchedule.map((shift, index) => (
                    <View
                      key={index}
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
