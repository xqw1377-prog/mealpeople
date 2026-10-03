/**
 * 每月排班页面
 * 智能生成月度排班方案
 */

import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getEmployeesByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'
import type {MonthlyScheduleResult, ScheduleResult} from '@/db/types-schedule-generation'
import {useTenantStore} from '@/store/tenant'
import {generateMonthlySchedule} from '@/utils/schedule-generator'

const MonthlySchedule: React.FC = () => {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [scheduleResult, setScheduleResult] = useState<MonthlyScheduleResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant) return

    try {
      const employeeList = await getEmployeesByTenantId(currentTenant.id)
      setEmployees(employeeList)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  }, [currentTenant])

  useDidShow(() => {
    loadData()
  })

  // 生成排班
  const handleGenerateSchedule = async () => {
    if (!currentTenant || !currentStore) {
      Taro.showToast({
        title: '请选择店铺',
        icon: 'none'
      })
      return
    }

    if (employees.length === 0) {
      Taro.showToast({
        title: '暂无员工数据',
        icon: 'none'
      })
      return
    }

    try {
      setLoading(true)

      // 构建排班生成请求
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
      const dailyRequirements = []

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dayOfWeek = new Date(date).getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        dailyRequirements.push({
          date,
          day_of_week: dayOfWeek,
          is_weekend: isWeekend,
          is_holiday: false,
          predicted_revenue: isWeekend ? 15000 : 10000, // 简化的营收预测
          required_positions: [
            {position: '服务员', min_count: 3, max_count: 5, is_required: true},
            {position: '厨师', min_count: 2, max_count: 3, is_required: true},
            {position: '收银员', min_count: 1, max_count: 2, is_required: true}
          ],
          min_staff_count: 6,
          max_staff_count: 10,
          target_cost: isWeekend ? 2000 : 1500
        })
      }

      const employeeConstraints = employees.map((emp) => ({
        employee_id: emp.id,
        employee_name: emp.name,
        position: emp.position || '服务员',
        is_core_position: emp.position === '店长' || emp.position === '主厨',
        min_work_days: 20,
        max_work_days: 26,
        rest_day_requests: [],
        preferred_rest_days: [0, 6] // 周日和周六
      }))

      const result = await generateMonthlySchedule({
        config: {
          tenant_id: currentTenant.id,
          store_id: currentStore.id, // 使用全局门店
          year: selectedYear,
          month: selectedMonth,
          max_cost_rate: 30,
          min_rest_days: 4,
          max_consecutive_work_days: 6,
          prefer_weekend_rest: true
        },
        employees: employeeConstraints,
        daily_requirements: dailyRequirements
      })

      setScheduleResult(result)

      Taro.showToast({
        title: '生成成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('生成排班失败:', error)
      Taro.showToast({
        title: '生成失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 渲染日历视图
  const renderCalendarView = () => {
    if (!scheduleResult) return null

    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
    const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay()

    const calendarDays: (ScheduleResult[] | null)[] = []

    // 填充月初空白
    for (let i = 0; i < firstDayOfWeek; i++) {
      calendarDays.push(null)
    }

    // 填充每一天的排班
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const daySchedules = scheduleResult.schedules.filter((s) => s.date === date && s.shift_type === 'work')
      calendarDays.push(daySchedules)
    }

    return (
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
        <View className="grid grid-cols-7 gap-2 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
            <View key={day} className="text-center">
              <Text className="text-xs font-bold text-muted-foreground">{day}</Text>
            </View>
          ))}
        </View>

        <View className="grid grid-cols-7 gap-2">
          {calendarDays.map((daySchedules, index) => {
            if (!daySchedules) {
              return <View key={`empty-${index}`} className="aspect-square" />
            }

            const day = index - firstDayOfWeek + 1
            const isToday =
              day === new Date().getDate() &&
              selectedMonth === new Date().getMonth() + 1 &&
              selectedYear === new Date().getFullYear()

            return (
              <View
                key={index}
                className={`aspect-square border rounded-lg p-1 ${
                  isToday ? 'border-indigo-500 bg-blue-100' : 'border-gray-200'
                }`}>
                <Text className="text-xs font-bold text-foreground block mb-1">{day}</Text>
                <Text className="text-xs text-muted-foreground block">{daySchedules.length}人</Text>
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  // 渲染列表视图
  const renderListView = () => {
    if (!scheduleResult) return null

    // 按员工分组
    const employeeSchedules = new Map<string, ScheduleResult[]>()

    for (const schedule of scheduleResult.schedules) {
      const empSchedules = employeeSchedules.get(schedule.employee_id) || []
      empSchedules.push(schedule)
      employeeSchedules.set(schedule.employee_id, empSchedules)
    }

    return (
      <View className="space-y-3">
        {Array.from(employeeSchedules.entries()).map(([employeeId, schedules]) => {
          const workDays = schedules.filter((s) => s.shift_type === 'work').length
          const restDays = schedules.filter((s) => s.shift_type === 'rest').length
          const _leaveDays = schedules.filter((s) => s.shift_type === 'leave').length

          return (
            <View key={employeeId} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <View className="flex items-center justify-between mb-3">
                <View className="flex items-center gap-2">
                  <View className="i-mdi-account-circle text-2xl text-indigo-500" />
                  <View>
                    <Text className="text-sm font-bold text-foreground block">{schedules[0].employee_name}</Text>
                    <Text className="text-xs text-muted-foreground block">{schedules[0].position}</Text>
                  </View>
                </View>
                <View className="text-right">
                  <Text className="text-xs text-muted-foreground block">工作 {workDays} 天</Text>
                  <Text className="text-xs text-muted-foreground block">休息 {restDays} 天</Text>
                </View>
              </View>

              <View className="flex flex-wrap gap-1">
                {schedules
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((schedule) => {
                    const day = Number.parseInt(schedule.date.split('-')[2], 10)
                    return (
                      <View
                        key={schedule.date}
                        className={`w-8 h-8 rounded flex items-center justify-center ${
                          schedule.shift_type === 'work'
                            ? 'bg-green-100 text-green-600'
                            : schedule.shift_type === 'leave'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                        <Text className="text-xs font-bold">{day}</Text>
                      </View>
                    )
                  })}
              </View>
            </View>
          )
        })}
      </View>
    )
  }

  // 渲染统计信息
  const renderStatistics = () => {
    if (!scheduleResult) return null

    const stats = scheduleResult.statistics

    return (
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm mb-4">
        <Text className="text-sm font-bold text-foreground mb-3">排班统计</Text>

        <View className="grid grid-cols-2 gap-3">
          <View className="bg-blue-100 rounded-lg p-3">
            <Text className="text-xs text-muted-foreground block mb-1">总工作天数</Text>
            <Text className="text-lg font-bold text-muted-foreground">{stats.total_work_days}</Text>
          </View>

          <View className="bg-blue-100 rounded-lg p-3">
            <Text className="text-xs text-muted-foreground block mb-1">总休息天数</Text>
            <Text className="text-lg font-bold text-muted-foreground">{stats.total_rest_days}</Text>
          </View>

          <View className="bg-blue-100 rounded-lg p-3">
            <Text className="text-xs text-muted-foreground block mb-1">总人力成本</Text>
            <Text className="text-lg font-bold text-muted-foreground">¥{stats.total_cost.toFixed(0)}</Text>
          </View>

          <View className="bg-blue-100 rounded-lg p-3">
            <Text className="text-xs text-muted-foreground block mb-1">人力成本率</Text>
            <Text className="text-lg font-bold text-muted-foreground">{stats.cost_rate.toFixed(1)}%</Text>
          </View>

          <View className="bg-blue-100 rounded-lg p-3">
            <Text className="text-xs text-muted-foreground block mb-1">日均成本</Text>
            <Text className="text-lg font-bold text-indigo-600">¥{stats.average_cost_per_day.toFixed(0)}</Text>
          </View>

          <View className="bg-blue-100 rounded-lg p-3">
            <Text className="text-xs text-muted-foreground block mb-1">人员利用率</Text>
            <Text className="text-lg font-bold text-pink-600">{stats.staff_utilization.toFixed(1)}%</Text>
          </View>
        </View>
      </View>
    )
  }

  // 渲染冲突和建议
  const renderConflictsAndSuggestions = () => {
    if (!scheduleResult) return null

    return (
      <View className="space-y-3 mb-4">
        {scheduleResult.conflicts.length > 0 && (
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-alert-circle text-xl text-red-500" />
              <Text className="text-sm font-bold text-foreground">发现 {scheduleResult.conflicts.length} 个问题</Text>
            </View>

            <View className="space-y-2">
              {scheduleResult.conflicts.slice(0, 5).map((conflict, index) => (
                <View
                  key={index}
                  className={`p-3 rounded-lg ${
                    conflict.severity === 'high'
                      ? 'bg-blue-100'
                      : conflict.severity === 'medium'
                        ? 'bg-blue-100'
                        : 'bg-blue-100'
                  }`}>
                  <Text className="text-xs text-foreground block mb-1">{conflict.description}</Text>
                  {conflict.suggestion && (
                    <Text className="text-xs text-muted-foreground block">{conflict.suggestion}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {scheduleResult.suggestions.length > 0 && (
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-lightbulb text-xl text-yellow-500" />
              <Text className="text-sm font-bold text-foreground">优化建议</Text>
            </View>

            <View className="space-y-2">
              {scheduleResult.suggestions.map((suggestion, index) => (
                <View key={index} className="flex items-start gap-2">
                  <View className="i-mdi-check-circle text-sm text-green-500 mt-0.5" />
                  <Text className="text-xs text-foreground flex-1">{suggestion}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    )
  }

  if (!currentTenant) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center mx-4">
          <View className="i-mdi-alert-circle-outline text-6xl text-indigo-500 mx-auto mb-4" />
          <Text className="text-base text-foreground block mb-2">请先选择租户</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          {/* 头部说明 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center gap-3 mb-2">
              <View className="i-mdi-calendar-month text-2xl text-indigo-500" />
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground block mb-1">每月排班</Text>
                <Text className="text-xs text-muted-foreground block">智能生成月度排班方案</Text>
              </View>
            </View>
          </View>

          {/* 配置区域 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-bold text-foreground mb-3">排班配置</Text>

            <View className="space-y-3">
              {/* 当前门店显示 */}
              <View>
                <Text className="text-xs text-muted-foreground mb-2">当前门店</Text>
                <View className="bg-muted rounded-lg p-3 flex items-center justify-between">
                  <Text className="text-sm text-foreground">{currentStore?.name || '未选择门店'}</Text>
                  {!currentStore && <Text className="text-xs text-red-500">请先在首页选择门店</Text>}
                </View>
              </View>

              {/* 年月选择 */}
              <View className="flex gap-2">
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground mb-2">年份</Text>
                  <Picker
                    mode="selector"
                    range={[2024, 2025, 2026]}
                    value={[2024, 2025, 2026].indexOf(selectedYear)}
                    onChange={(e) => {
                      setSelectedYear([2024, 2025, 2026][e.detail.value])
                    }}>
                    <View className="bg-muted rounded-lg p-3 flex items-center justify-between">
                      <Text className="text-sm text-foreground">{selectedYear}年</Text>
                      <View className="i-mdi-chevron-down text-muted-foreground" />
                    </View>
                  </Picker>
                </View>

                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground mb-2">月份</Text>
                  <Picker
                    mode="selector"
                    range={Array.from({length: 12}, (_, i) => i + 1)}
                    value={selectedMonth - 1}
                    onChange={(e) => {
                      const value =
                        typeof e.detail.value === 'number' ? e.detail.value : Number.parseInt(e.detail.value, 10)
                      setSelectedMonth(value + 1)
                    }}>
                    <View className="bg-muted rounded-lg p-3 flex items-center justify-between">
                      <Text className="text-sm text-foreground">{selectedMonth}月</Text>
                      <View className="i-mdi-chevron-down text-muted-foreground" />
                    </View>
                  </Picker>
                </View>
              </View>
            </View>

            <Button
              className="w-full bg-blue-100 text-white py-3 rounded-lg text-sm break-keep mt-4"
              size="default"
              onClick={handleGenerateSchedule}
              disabled={loading}>
              {loading ? '生成中...' : '智能生成排班'}
            </Button>
          </View>

          {/* 排班结果 */}
          {scheduleResult && (
            <>
              {/* 视图切换 */}
              <View className="bg-white rounded-xl p-2 mb-4 shadow-sm flex gap-2 border-2 border-gray-200">
                <Button
                  className={`flex-1 py-2 rounded-lg text-sm break-keep ${
                    viewMode === 'calendar' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  size="default"
                  onClick={() => setViewMode('calendar')}>
                  日历视图
                </Button>
                <Button
                  className={`flex-1 py-2 rounded-lg text-sm break-keep ${
                    viewMode === 'list' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  size="default"
                  onClick={() => setViewMode('list')}>
                  列表视图
                </Button>
              </View>

              {/* 统计信息 */}
              {renderStatistics()}

              {/* 冲突和建议 */}
              {renderConflictsAndSuggestions()}

              {/* 排班视图 */}
              {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default MonthlySchedule
