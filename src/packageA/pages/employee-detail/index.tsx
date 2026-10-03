/**
 * 员工详情页面 - 展示员工完整信息和生命周期时间轴
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeById} from '@/db/api'
import {getEmployeeLifecycleEvents} from '@/db/api-lifecycle'
import type {Employee} from '@/db/types'
import type {EmployeeLifecycleEvent} from '@/db/types-lifecycle'

export default function EmployeeDetail() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const employeeId = router.params.id || ''

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [lifecycleEvents, setLifecycleEvents] = useState<EmployeeLifecycleEvent[]>([])
  const [loading, setLoading] = useState(true)

  // 加载员工信息
  const loadEmployeeData = useCallback(async () => {
    if (!employeeId) {
      Taro.showToast({
        title: '员工ID不存在',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      const [empData, events] = await Promise.all([getEmployeeById(employeeId), getEmployeeLifecycleEvents(employeeId)])

      setEmployee(empData)
      setLifecycleEvents(events)
    } catch (error) {
      console.error('加载员工信息失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [employeeId])

  useDidShow(() => {
    loadEmployeeData()
  })

  // 获取事件类型图标和文本
  const getEventInfo = (eventType: string) => {
    const eventMap: Record<string, {icon: string; text: string; color: string}> = {
      applied: {icon: 'i-mdi-file-document', text: '投递简历', color: 'text-muted-foreground'},
      interviewed: {icon: 'i-mdi-account-voice', text: '面试', color: 'text-accent'},
      hired: {icon: 'i-mdi-check-circle', text: '录用', color: 'text-blue-600'},
      onboarded: {icon: 'i-mdi-account-plus', text: '入职', color: 'text-blue-600'},
      promoted: {icon: 'i-mdi-arrow-up-bold', text: '晋升', color: 'text-secondary'},
      transferred: {icon: 'i-mdi-swap-horizontal', text: '调岗', color: 'text-accent'},
      resigned: {icon: 'i-mdi-account-remove', text: '离职', color: 'text-destructive'},
      terminated: {icon: 'i-mdi-close-circle', text: '辞退', color: 'text-destructive'}
    }
    return eventMap[eventType] || {icon: 'i-mdi-circle', text: '未知事件', color: 'text-muted-foreground'}
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 获取员工状态标签
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return {text: '正式员工', color: 'text-blue-600 bg-blue-100'}
      case 'probation':
        return {text: '试用期', color: 'text-accent bg-accent/10'}
      case 'resigned':
        return {text: '已离职', color: 'text-muted-foreground bg-gray-50'}
      default:
        return {text: '未知', color: 'text-muted-foreground bg-gray-50'}
    }
  }

  // 计算工龄
  const _calculateWorkAge = (hireDate?: string) => {
    if (!hireDate) return '未知'
    const hire = new Date(hireDate)
    const now = new Date()
    const months = (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth())
    if (months < 1) return '不足1个月'
    if (months < 12) return `${months}个月`
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12
    return remainingMonths > 0 ? `${years}年${remainingMonths}个月` : `${years}年`
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!employee) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">员工不存在</Text>
      </View>
    )
  }

  const statusBadge = getStatusBadge(employee.status)

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 基本信息卡片 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <View className="i-mdi-account text-3xl text-blue-600" />
              </View>
              <View className="flex-1">
                <View className="flex items-center gap-2 mb-1">
                  <Text className="text-xl font-bold text-foreground">{employee.name || '未命名'}</Text>
                  <View className={`px-2 py-1 rounded text-xs ${statusBadge.color}`}>
                    <Text>{statusBadge.text}</Text>
                  </View>
                </View>
                <Text className="text-sm text-muted-foreground">{employee.phone || '无手机号'}</Text>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex items-center">
                <View className="i-mdi-badge-account text-xl text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground mr-2">员工ID：</Text>
                <Text className="text-sm text-foreground">{employee.id || '未设置'}</Text>
              </View>

              <View className="flex items-center">
                <View className="i-mdi-office-building text-xl text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground mr-2">部门：</Text>
                <Text className="text-sm text-foreground">{employee.department || '未分配'}</Text>
              </View>

              <View className="flex items-center">
                <View className="i-mdi-briefcase text-xl text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground mr-2">岗位：</Text>
                <Text className="text-sm text-foreground">{employee.position || '未设置'}</Text>
              </View>

              <View className="flex items-center">
                <View className="i-mdi-clock-outline text-xl text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground mr-2">创建时间：</Text>
                <Text className="text-sm text-foreground">{employee.created_at?.substring(0, 10) || '未知'}</Text>
              </View>
            </View>
          </View>

          {/* 生命周期时间轴 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-timeline-text text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-semibold text-foreground">生命周期时间轴</Text>
            </View>

            {lifecycleEvents.length === 0 ? (
              <View className="text-center py-8">
                <Text className="text-sm text-muted-foreground">暂无生命周期记录</Text>
              </View>
            ) : (
              <View className="space-y-4">
                {lifecycleEvents.map((event, index) => {
                  const eventInfo = getEventInfo(event.event_type)
                  const isLast = index === lifecycleEvents.length - 1

                  return (
                    <View key={event.id} className="flex">
                      {/* 时间轴线 */}
                      <View className="flex flex-col items-center mr-3">
                        <View
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${eventInfo.color} bg-current/10`}>
                          <View className={`${eventInfo.icon} text-lg`} />
                        </View>
                        {!isLast && <View className="w-0.5 flex-1 bg-border mt-2" style={{minHeight: '40px'}} />}
                      </View>

                      {/* 事件内容 */}
                      <View className="flex-1 pb-4">
                        <View className="flex items-center justify-between mb-1">
                          <Text className={`text-sm font-medium ${eventInfo.color}`}>{eventInfo.text}</Text>
                          <Text className="text-xs text-muted-foreground">{formatDate(event.event_date)}</Text>
                        </View>
                        {event.description && (
                          <Text className="text-sm text-muted-foreground mt-1">{event.description}</Text>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 工作记录 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-chart-box text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-semibold text-foreground">工作记录</Text>
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs text-muted-foreground">本月排班</Text>
                <Text className="text-2xl font-bold text-blue-600 mt-1">22</Text>
                <Text className="text-xs text-muted-foreground mt-1">天</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs text-muted-foreground">本月培训</Text>
                <Text className="text-2xl font-bold text-accent mt-1">3</Text>
                <Text className="text-xs text-muted-foreground mt-1">次</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs text-muted-foreground">本月任务</Text>
                <Text className="text-2xl font-bold text-secondary mt-1">15</Text>
                <Text className="text-xs text-muted-foreground mt-1">个</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs text-muted-foreground">绩效评分</Text>
                <Text className="text-2xl font-bold text-blue-600 mt-1">4.5</Text>
                <Text className="text-xs text-muted-foreground mt-1">/5.0</Text>
              </View>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="space-y-3 mb-4">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={() => Taro.navigateTo({url: `/packageB/pages/scheduling/index?employeeId=${employeeId}`})}>
              查看排班
            </Button>

            {employee.status !== 'resigned' && (
              <Button
                className="w-full bg-gray-50 text-destructive py-4 rounded-lg break-keep text-base border border-destructive"
                size="default"
                onClick={() =>
                  Taro.navigateTo({url: `/packageH/pages/resignation-form/index?employeeId=${employeeId}`})
                }>
                申请离职
              </Button>
            )}
          </View>

          {/* 底部占位 */}
          <View className="h-4" />
        </View>
      </ScrollView>
    </View>
  )
}
