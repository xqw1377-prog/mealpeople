/**
 * 考勤打卡页面
 * V3.17 新增功能 - 员工考勤打卡
 * 设计理念：简洁、快速、便捷
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {type AttendanceRecord, clockIn, clockOut, getAttendanceRecords, getTodayAttendance} from '@/db/api-attendance'

export default function Attendance() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(false)
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([])
  const [employeeId, setEmployeeId] = useState<string>('')

  // 获取当前时间
  const getCurrentTime = () => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // 获取当前日期
  const getCurrentDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 格式化时间（从ISO字符串提取时分）
  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--'
    const date = new Date(isoString)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[date.getDay()]
    return `${month}月${day}日 ${weekDay}`
  }

  // 加载今日打卡记录
  const loadTodayRecord = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      // 获取员工ID
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        console.error('未找到员工信息')
        return
      }

      setEmployeeId(employee.id)

      // 加载今日打卡记录
      const record = await getTodayAttendance(employee.id)
      setTodayRecord(record)

      // 加载最近7天的打卡记录
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const startDate = sevenDaysAgo.toISOString().split('T')[0]
      const records = await getAttendanceRecords(employee.id, startDate)
      setRecentRecords(records.slice(0, 5)) // 只显示最近5条
    } catch (error) {
      console.error('加载打卡记录失败:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadTodayRecord()
  })

  // 上班打卡
  const handleClockIn = async () => {
    if (!user?.id) {
      Taro.showToast({
        title: '请先登录',
        icon: 'error'
      })
      return
    }

    try {
      setLoading(true)

      // 获取完整的员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        Taro.showToast({
          title: '未找到员工信息',
          icon: 'error'
        })
        return
      }

      // 调用打卡接口，传递正确的tenant_id
      const record = await clockIn(
        employee.id, // 员工UUID
        employee.tenant_id, // ✅ 租户UUID（从员工记录获取）
        employee.store_id || undefined // 门店UUID
      )

      if (record) {
        setTodayRecord(record)
        setEmployeeId(employee.id)
        Taro.showToast({
          title: '上班打卡成功',
          icon: 'success',
          duration: 2000
        })
        // 重新加载数据
        await loadTodayRecord()
      } else {
        Taro.showToast({
          title: '打卡失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('打卡失败:', error)
      Taro.showToast({
        title: '打卡失败，请重试',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  // 下班打卡
  const handleClockOut = async () => {
    if (!user?.id) {
      Taro.showToast({
        title: '请先登录',
        icon: 'error'
      })
      return
    }

    // 如果员工ID还未加载，先加载
    let empId = employeeId
    if (!empId) {
      try {
        const employee = await getEmployeeByUserId(user.id)
        if (!employee) {
          Taro.showToast({
            title: '未找到员工信息',
            icon: 'error'
          })
          return
        }
        empId = employee.id
        setEmployeeId(empId)
      } catch (error) {
        console.error('获取员工信息失败:', error)
        Taro.showToast({
          title: '获取员工信息失败',
          icon: 'error'
        })
        return
      }
    }

    try {
      setLoading(true)

      // 调用打卡接口
      const record = await clockOut(empId)

      if (record) {
        setTodayRecord(record)
        Taro.showToast({
          title: '下班打卡成功',
          icon: 'success',
          duration: 2000
        })
        // 重新加载数据
        await loadTodayRecord()
      } else {
        Taro.showToast({
          title: '打卡失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('打卡失败:', error)
      Taro.showToast({
        title: '打卡失败，请重试',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取状态文字
  const getStatusText = (status: string) => {
    switch (status) {
      case 'normal':
        return '正常'
      case 'late':
        return '迟到'
      case 'early_leave':
        return '早退'
      case 'absent':
        return '缺勤'
      default:
        return '未知'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-muted-foreground'
      case 'late':
        return 'text-muted-foreground'
      case 'early_leave':
        return 'text-muted-foreground'
      case 'absent':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 当前时间卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 text-center">
            <Text className="text-blue-600/80 text-sm mb-2">当前时间</Text>
            <Text className="text-foreground text-4xl font-bold mb-1">{getCurrentTime()}</Text>
            <Text className="text-blue-600/80 text-sm">{getCurrentDate()}</Text>
          </View>

          {/* 打卡按钮 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
            {todayRecord ? (
              <View className="space-y-4">
                {/* 已打上班卡 */}
                <View className="bg-blue-100 rounded-xl p-4">
                  <View className="flex flex-row items-center justify-between mb-2">
                    <Text className="text-sm text-muted-foreground">上班打卡</Text>
                    <View className="bg-green-600 rounded-full px-3 py-1">
                      <Text className="text-blue-600 text-xs">已打卡</Text>
                    </View>
                  </View>
                  <Text className="text-2xl font-bold text-muted-foreground">
                    {formatTime(todayRecord.clock_in_time)}
                  </Text>
                </View>

                {/* 下班打卡按钮 */}
                {!todayRecord.clock_out_time ? (
                  <Button
                    className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base font-bold"
                    size="default"
                    onClick={handleClockOut}
                    disabled={loading}>
                    {loading ? '打卡中...' : '下班打卡'}
                  </Button>
                ) : (
                  <View className="bg-blue-100 rounded-xl p-4">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-sm text-muted-foreground">下班打卡</Text>
                      <View className="bg-blue-100 rounded-full px-3 py-1">
                        <Text className="text-blue-600 text-xs">已打卡</Text>
                      </View>
                    </View>
                    <Text className="text-2xl font-bold text-muted-foreground">
                      {formatTime(todayRecord.clock_out_time)}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Button
                className="w-full bg-green-600 text-white py-6 rounded-xl break-keep text-lg font-bold"
                size="default"
                onClick={handleClockIn}
                disabled={loading}>
                {loading ? '打卡中...' : '上班打卡'}
              </Button>
            )}
          </View>

          {/* 今日统计 */}
          {todayRecord && (
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
              <View className="flex flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">今日统计</Text>
                <View className="i-mdi-chart-bar text-2xl text-blue-600" />
              </View>

              <View className="grid grid-cols-3 gap-3">
                <View className="bg-blue-100 rounded-xl p-3 text-center">
                  <Text className="text-xs text-muted-foreground">上班时间</Text>
                  <Text className="text-lg font-bold text-muted-foreground mt-1">
                    {formatTime(todayRecord.clock_in_time)}
                  </Text>
                </View>

                <View className="bg-blue-100 rounded-xl p-3 text-center">
                  <Text className="text-xs text-muted-foreground">下班时间</Text>
                  <Text className="text-lg font-bold text-muted-foreground mt-1">
                    {formatTime(todayRecord.clock_out_time)}
                  </Text>
                </View>

                <View className="bg-blue-100 rounded-xl p-3 text-center">
                  <Text className="text-xs text-muted-foreground">工作时长</Text>
                  <Text className="text-lg font-bold text-muted-foreground mt-1">
                    {todayRecord.work_hours ? `${todayRecord.work_hours}h` : '--'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 最近打卡记录 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">最近打卡</Text>
              <View className="i-mdi-history text-2xl text-blue-600" />
            </View>

            {recentRecords.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-calendar-blank text-6xl text-muted-foreground mb-2" />
                <Text className="text-sm text-muted-foreground">暂无打卡记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {recentRecords.map((record) => (
                  <View key={record.id} className="bg-gray-50/30 rounded-xl p-4">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground">{formatDate(record.date)}</Text>
                      <Text className={`text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </Text>
                    </View>

                    <View className="flex flex-row items-center justify-between text-xs text-muted-foreground">
                      <View className="flex flex-row items-center">
                        <View className="i-mdi-login text-base mr-1" />
                        <Text>{formatTime(record.clock_in_time)}</Text>
                      </View>

                      <View className="flex flex-row items-center">
                        <View className="i-mdi-logout text-base mr-1" />
                        <Text>{formatTime(record.clock_out_time)}</Text>
                      </View>

                      <View className="flex flex-row items-center">
                        <View className="i-mdi-clock-outline text-base mr-1" />
                        <Text>{record.work_hours ? `${record.work_hours}h` : '--'}</Text>
                      </View>
                    </View>
                  </View>
                ))}
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
