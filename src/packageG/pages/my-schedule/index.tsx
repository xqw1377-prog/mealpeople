/**
 * 我的排班页面
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {getEmployeeSchedule} from '@/db/api-leave'
import type {EmployeeScheduleResult} from '@/db/types-leave'

const MySchedule: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [schedules, setSchedules] = useState<EmployeeScheduleResult[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 初始化当前月份
  useEffect(() => {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setCurrentMonth(month)
  }, [])

  // 加载排班数据
  const loadSchedules = useCallback(async () => {
    if (!user?.id || !currentMonth) return

    try {
      setLoading(true)
      // 计算月份的开始和结束日期
      const [year, month] = currentMonth.split('-')
      const startDate = `${year}-${month}-01`
      const lastDay = new Date(Number(year), Number(month), 0).getDate()
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

      const data = await getEmployeeSchedule(user.id, startDate, endDate)
      setSchedules(data)
    } catch (error) {
      console.error('加载排班失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentMonth])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  useDidShow(() => {
    loadSchedules()
  })

  // 切换月份
  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    setCurrentMonth(`${prevYear}-${String(prevMonth).padStart(2, '0')}`)
  }

  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    setCurrentMonth(`${nextYear}-${String(nextMonth).padStart(2, '0')}`)
  }

  // 生成日历数据
  const generateCalendar = () => {
    const [year, month] = currentMonth.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const calendar: Array<{date: string; day: number} | null> = []

    // 填充月初空白
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push(null)
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      calendar.push({date: dateStr, day})
    }

    return calendar
  }

  // 获取日期的排班信息
  const getScheduleForDate = (date: string) => {
    return schedules.find((s) => s.date === date)
  }

  // 渲染日期单元格
  const renderDateCell = (item: {date: string; day: number} | null) => {
    if (!item) {
      return <View key={`empty-${Math.random()}`} className="w-1/7 aspect-square" />
    }

    const schedule = getScheduleForDate(item.date)
    const isToday = item.date === new Date().toISOString().split('T')[0]
    const isSelected = item.date === selectedDate

    let bgColor = 'bg-white'
    let textColor = 'text-foreground'
    let badge = ''

    if (schedule) {
      // 使用shift_type字段
      bgColor = 'bg-green-500/10'
      textColor = 'text-blue-600'
      badge = schedule.shift_type?.substring(0, 1) || '班'
    }

    return (
      <View key={item.date} className={`w-1/7 aspect-square p-1`} onClick={() => setSelectedDate(item.date)}>
        <View
          className={`w-full h-full rounded-lg flex flex-col items-center justify-center ${bgColor} ${
            isSelected ? 'ring-2 ring-primary' : ''
          } ${isToday ? 'ring-2 ring-destructive' : ''}`}>
          <Text className={`text-xs font-semibold ${textColor}`}>{item.day}</Text>
          {badge && <Text className={`text-xs mt-1 ${textColor}`}>{badge}</Text>}
        </View>
      </View>
    )
  }

  // 渲染选中日期的详情
  const renderSelectedDetails = () => {
    if (!selectedDate) return null

    const schedule = getScheduleForDate(selectedDate)
    if (!schedule) {
      return (
        <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mt-4">
          <Text className="text-sm text-muted-foreground text-center">该日期暂无排班信息</Text>
        </View>
      )
    }

    return (
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mt-4 shadow">
        <View className="flex flex-row items-center justify-between mb-4">
          <Text className="text-lg font-semibold">{selectedDate}</Text>
          <View className="px-3 py-1 rounded-full bg-green-500/10">
            <Text className="text-xs font-medium text-blue-600">{schedule.shift_type}</Text>
          </View>
        </View>

        <View className="space-y-3">
          {schedule.start_time && schedule.end_time && (
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-muted-foreground">工作时间</Text>
              <Text className="text-sm font-medium">
                {schedule.start_time} - {schedule.end_time}
              </Text>
            </View>
          )}
          {schedule.store_name && (
            <View className="flex flex-row justify-between">
              <Text className="text-sm text-muted-foreground">门店</Text>
              <Text className="text-sm font-medium">{schedule.store_name}</Text>
            </View>
          )}
          {schedule.notes && (
            <View className="mt-3 pt-3 border-t border-border">
              <Text className="text-sm text-muted-foreground mb-1">备注</Text>
              <Text className="text-sm">{schedule.notes}</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  // 计算统计（简化版本，因为EmployeeScheduleResult没有type字段）
  const stats = {
    total: schedules.length,
    hours: 0,
    salary: 0
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  const calendar = generateCalendar()

  return (
    <ScrollView scrollY className="min-h-screen bg-gray-50" style={{height: '100vh'}}>
      {/* 月份选择器 */}
      <View className="bg-white p-4 shadow">
        <View className="flex flex-row items-center justify-between">
          <View
            className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center active:opacity-70"
            onClick={handlePrevMonth}>
            <View className="i-mdi-chevron-left text-2xl text-blue-600" />
          </View>

          <Text className="text-xl font-bold">{currentMonth}</Text>

          <View
            className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center active:opacity-70"
            onClick={handleNextMonth}>
            <View className="i-mdi-chevron-right text-2xl text-blue-600" />
          </View>
        </View>
      </View>

      {/* 星期标题 */}
      <View className="flex flex-row bg-white border-t border-border">
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <View key={day} className="w-1/7 py-2">
            <Text className="text-xs text-muted-foreground text-center">{day}</Text>
          </View>
        ))}
      </View>

      {/* 日历 */}
      <View className="bg-white p-2">
        <View className="flex flex-row flex-wrap">{calendar.map((item, _index) => renderDateCell(item))}</View>
      </View>

      {/* 选中日期详情 */}
      <View className="p-4">{renderSelectedDetails()}</View>

      {/* 月度统计 */}
      <View className="px-4 pb-6">
        <Text className="text-lg font-semibold mb-3">本月统计</Text>

        <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow">
          <View className="flex flex-row justify-between mb-4">
            <View className="flex-1 text-center">
              <Text className="text-2xl font-bold text-blue-600">{stats.total}</Text>
              <Text className="text-xs text-muted-foreground mt-1">排班天数</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default MySchedule
