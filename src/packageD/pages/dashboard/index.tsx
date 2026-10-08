/**
 * 管理工作台页面
 * 管理者的核心工作界面，提供全局数据概览、关键指标监控、待办事项管理等功能
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getDashboardData, markAlertAsRead} from '@/db/api-dashboard'
import type {AlertSeverity, DashboardAlert, DashboardData, DashboardTodoItem} from '@/db/types-dashboard'

const Dashboard: React.FC = () => {
  const {user} = useAuth({guard: true})

  // 仪表盘数据
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载仪表盘数据
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await getDashboardData(user.id)
      setDashboardData(data)
    } catch (error) {
      console.error('加载仪表盘数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadDashboardData()
  })

  // 处理警报点击
  const handleAlertClick = async (alert: DashboardAlert) => {
    // 标记为已读
    await markAlertAsRead(alert.id)

    // 根据警报类型跳转到相应页面
    const routeMap: Record<string, string> = {
      attendance: '/packageG/pages/working/attendance/index',
      leave: '/packageG/pages/my-leave/index',
      overtime: '/packageG/pages/my-overtime/index',
      performance: '/packageF/pages/my-performance/index',
      promotion: '/packageF/pages/my-promotion/index',
      transfer: '/packageF/pages/my-transfer/index',
      onboarding: '/packageH/pages/my-onboarding/index',
      offboarding: '/packageH/pages/my-offboarding/index'
    }

    const route = routeMap[alert.alert_type]
    if (route) {
      Taro.navigateTo({url: route})
    }

    // 重新加载数据
    loadDashboardData()
  }

  // 处理待办事项点击
  const handleTodoClick = (todo: DashboardTodoItem) => {
    const routeMap: Record<string, string> = {
      leave: '/packageG/pages/my-leave/index',
      overtime: '/packageG/pages/my-overtime/index',
      promotion: '/packageF/pages/my-promotion/index',
      transfer: '/packageF/pages/my-transfer/index',
      onboarding: '/packageH/pages/my-onboarding/index',
      offboarding: '/packageH/pages/my-offboarding/index'
    }

    const route = routeMap[todo.type]
    if (route) {
      Taro.navigateTo({url: route})
    }
  }

  // 获取警报严重程度的颜色
  const getSeverityColor = (severity: AlertSeverity) => {
    const colorMap: Record<AlertSeverity, string> = {
      info: 'bg-blue-50 border-2 border-blue-200',
      warning: 'bg-yellow-50 border-2 border-yellow-300',
      error: 'bg-orange-50 border-2 border-orange-300',
      critical: 'bg-red-50 border-2 border-red-300'
    }
    return colorMap[severity] || colorMap.info
  }

  // 获取警报严重程度的图标
  const getSeverityIcon = (severity: AlertSeverity) => {
    const iconMap: Record<AlertSeverity, string> = {
      info: 'i-mdi-information',
      warning: 'i-mdi-alert',
      error: 'i-mdi-alert-circle',
      critical: 'i-mdi-alert-octagon'
    }
    return iconMap[severity] || iconMap.info
  }

  // 获取警报严重程度的图标颜色
  const getSeverityIconColor = (severity: AlertSeverity) => {
    const colorMap: Record<AlertSeverity, string> = {
      info: 'text-blue-600',
      warning: 'text-yellow-600',
      error: 'text-orange-600',
      critical: 'text-red-600'
    }
    return colorMap[severity] || colorMap.info
  }

  // 获取警报严重程度的文字颜色
  const getSeverityTextColor = (severity: AlertSeverity) => {
    const colorMap: Record<AlertSeverity, string> = {
      info: 'text-blue-900',
      warning: 'text-yellow-900',
      error: 'text-orange-900',
      critical: 'text-red-900'
    }
    return colorMap[severity] || colorMap.info
  }

  // 获取待办事项优先级颜色
  const getPriorityColor = (priority: string) => {
    const colorMap: Record<string, string> = {
      low: 'bg-gray-50',
      medium: 'bg-blue-100',
      high: 'bg-blue-100',
      urgent: 'bg-blue-100'
    }
    return colorMap[priority] || colorMap.medium
  }

  // 获取待办事项优先级文本
  const getPriorityText = (priority: string) => {
    const textMap: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    }
    return textMap[priority] || '中'
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        {/* 使用容器查询支持响应式布局 */}
        <View className="@container">
          <View className="p-4 space-y-4 max-w-7xl mx-auto">
            {/* 顶部欢迎区 - WEB端优化 */}
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
              <View className="flex flex-col @md:flex-row items-start @md:items-center gap-4">
                <View className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-view-dashboard text-4xl text-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-2xl max-sm:text-xl font-bold text-foreground mb-1">管理工作台</Text>
                  <Text className="text-sm text-muted-foreground">欢迎回来，管理者</Text>
                </View>
              </View>
            </View>

            {loading ? (
              <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
                <View className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <View className="i-mdi-loading animate-spin text-4xl text-blue-600" />
                </View>
                <Text className="text-sm text-muted-foreground">加载中...</Text>
              </View>
            ) : dashboardData ? (
              <>
                {/* 关键指标卡片 - 修复小程序显示问题 */}
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
                  <View className="flex items-center gap-3 mb-4">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <View className="i-mdi-chart-line text-2xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-foreground break-keep">关键指标</Text>
                      <Text className="text-xs text-muted-foreground">实时数据概览</Text>
                    </View>
                  </View>
                  {/* 使用2列布局，确保小程序显示正常 */}
                  <View className="grid grid-cols-2 gap-3">
                    {/* 员工总数 */}
                    <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <View className="flex flex-col">
                        <View className="flex items-center justify-between mb-3">
                          <Text className="text-xs text-foreground font-bold break-keep">员工总数</Text>
                          <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <View className="i-mdi-account-group text-lg text-blue-600" />
                          </View>
                        </View>
                        <Text className="text-2xl font-bold text-foreground mb-2">
                          {dashboardData.stats.total_employees}
                        </Text>
                        <Text className="text-xs text-muted-foreground leading-tight">
                          在职 {dashboardData.stats.active_employees} 人
                        </Text>
                      </View>
                    </View>

                    {/* 今日考勤率 */}
                    <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <View className="flex flex-col">
                        <View className="flex items-center justify-between mb-3">
                          <Text className="text-xs text-foreground font-bold break-keep">今日考勤率</Text>
                          <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <View className="i-mdi-clock-check text-lg text-blue-600" />
                          </View>
                        </View>
                        <Text className="text-2xl font-bold text-foreground mb-2">
                          {dashboardData.stats.today_attendance_rate == null ? '--' : dashboardData.stats.today_attendance_rate + '%'}
                        </Text>
                        <Text className="text-xs text-muted-foreground leading-tight">
                          {dashboardData.stats.late_count_today == null ? '迟到 暂无数据' : '迟到 ' + dashboardData.stats.late_count_today + ' 人'}
                        </Text>
                      </View>
                    </View>

                    {/* 待审批请假 */}
                    <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <View className="flex flex-col">
                        <View className="flex items-center justify-between mb-3">
                          <Text className="text-xs text-foreground font-bold break-keep">待审批请假</Text>
                          <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <View className="i-mdi-calendar-remove text-lg text-blue-600" />
                          </View>
                        </View>
                        <Text className="text-2xl font-bold text-foreground mb-2">
                          {dashboardData.stats.pending_leave_count}
                        </Text>
                        <Text className="text-xs text-muted-foreground leading-tight">
                          本月 {dashboardData.stats.total_leave_days_this_month} 天
                        </Text>
                      </View>
                    </View>

                    {/* 平均绩效 */}
                    <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                      <View className="flex flex-col">
                        <View className="flex items-center justify-between mb-3">
                          <Text className="text-xs text-foreground font-bold break-keep">平均绩效</Text>
                          <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <View className="i-mdi-trophy text-lg text-blue-600" />
                          </View>
                        </View>
                        <Text className="text-2xl font-bold text-foreground mb-2">
                          {dashboardData.stats.average_performance_score}
                        </Text>
                        <Text className="text-xs text-muted-foreground leading-tight">
                          优秀 {dashboardData.stats.high_performers_count} 人
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 快捷操作 - WEB端优化 */}
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
                  <View className="flex items-center gap-3 mb-4">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <View className="i-mdi-lightning-bolt text-2xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-lg max-sm:text-base font-bold text-foreground">快捷操作</Text>
                      <Text className="text-xs text-muted-foreground">常用功能快捷入口</Text>
                    </View>
                  </View>
                  {/* WEB端使用6列，移动端使用3列 */}
                  <View className="grid grid-cols-3 @lg:grid-cols-6 gap-3">
                    {/* 排班管理 */}
                    <View
                      className="bg-green-500/10 rounded-lg p-4 active:opacity-80 transition-all border border-border cursor-pointer"
                      onClick={() => Taro.navigateTo({url: '/packageB/pages/schedule-center/index'})}>
                      <View className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                        <View className="i-mdi-calendar-clock text-2xl text-blue-600" />
                      </View>
                      <Text className="text-xs text-purple-700 font-bold text-center">排班管理</Text>
                    </View>

                    {/* 员工管理 */}
                    <View
                      className="bg-green-500/10 rounded-lg p-4 active:opacity-80 transition-all border border-border cursor-pointer"
                      onClick={() => Taro.navigateTo({url: '/pages/employee-hub/index'})}>
                      <View className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                        <View className="i-mdi-account-group text-2xl text-blue-600" />
                      </View>
                      <Text className="text-xs text-blue-600 font-bold text-center">员工管理</Text>
                    </View>

                    {/* 运营管理 */}
                    <View
                      className="bg-blue-100 rounded-lg p-4 active:opacity-80 transition-all border border-border cursor-pointer"
                      onClick={() => Taro.navigateTo({url: '/pages/operations/index'})}>
                      <View className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-2 mx-auto">
                        <View className="i-mdi-chart-line text-2xl text-blue-600" />
                      </View>
                      <Text className="text-xs text-green-600 font-bold text-center">运营管理</Text>
                    </View>
                  </View>
                </View>

                {/* 警报通知 */}
                {dashboardData.alerts.length > 0 && (
                  <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
                    <View className="flex items-center justify-between mb-4">
                      <View className="flex items-center gap-3">
                        <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <View className="i-mdi-bell-alert text-2xl text-blue-600" />
                        </View>
                        <View>
                          <Text className="text-lg font-bold text-foreground">警报通知</Text>
                          <Text className="text-xs text-muted-foreground">需要关注的事项</Text>
                        </View>
                      </View>
                      <View className="bg-blue-100 px-3 py-1 rounded-full">
                        <Text className="text-xs text-foreground font-bold">
                          {dashboardData.alert_stats.unread} 条未读
                        </Text>
                      </View>
                    </View>
                    <View className="space-y-3">
                      {dashboardData.alerts.slice(0, 5).map((alert) => (
                        <View
                          key={alert.id}
                          className={`${getSeverityColor(alert.severity)} rounded-lg p-4 active:opacity-90 transition-all cursor-pointer`}
                          onClick={() => handleAlertClick(alert)}>
                          <View className="flex items-start gap-3">
                            <View className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                              <View
                                className={`${getSeverityIcon(alert.severity)} text-2xl ${getSeverityIconColor(alert.severity)}`}
                              />
                            </View>
                            <View className="flex-1">
                              <Text className={`text-sm font-bold ${getSeverityTextColor(alert.severity)} mb-1`}>
                                {alert.title}
                              </Text>
                              <Text className={`text-xs ${getSeverityTextColor(alert.severity)} opacity-80`}>
                                {alert.message}
                              </Text>
                              <Text className={`text-xs ${getSeverityTextColor(alert.severity)} opacity-60 mt-2`}>
                                {formatTime(alert.created_at)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 待办事项 */}
                {dashboardData.todos.length > 0 && (
                  <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
                    <View className="flex items-center justify-between mb-4">
                      <View className="flex items-center gap-3">
                        <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <View className="i-mdi-checkbox-marked-circle text-2xl text-blue-600" />
                        </View>
                        <View>
                          <Text className="text-lg font-bold text-foreground">待办事项</Text>
                          <Text className="text-xs text-muted-foreground">需要处理的任务</Text>
                        </View>
                      </View>
                      <View className="bg-blue-100 px-3 py-1 rounded-full">
                        <Text className="text-xs text-foreground font-bold">{dashboardData.todos.length} 项</Text>
                      </View>
                    </View>
                    <View className="space-y-3">
                      {dashboardData.todos.map((todo) => (
                        <View
                          key={todo.id}
                          className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all border border-border"
                          onClick={() => handleTodoClick(todo)}>
                          <View className="flex items-start justify-between mb-2">
                            <Text className="text-sm font-bold text-foreground flex-1">{todo.title}</Text>
                            <View className={`${getPriorityColor(todo.priority)} px-2 py-1 rounded-full`}>
                              <Text className="text-xs text-white font-bold">{getPriorityText(todo.priority)}</Text>
                            </View>
                          </View>
                          <Text className="text-xs text-muted-foreground mb-2">{todo.description}</Text>
                          <View className="flex items-center justify-between">
                            <Text className="text-xs text-muted-foreground">申请人: {todo.applicant_name}</Text>
                            <Text className="text-xs text-muted-foreground">{formatTime(todo.created_at)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 团队动态 */}
                {dashboardData.team_activities.length > 0 && (
                  <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-20">
                    <View className="flex items-center gap-3 mb-4">
                      <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <View className="i-mdi-pulse text-2xl text-blue-600" />
                      </View>
                      <View>
                        <Text className="text-lg font-bold text-foreground">团队动态</Text>
                        <Text className="text-xs text-muted-foreground">最新团队活动</Text>
                      </View>
                    </View>
                    <View className="space-y-3">
                      {dashboardData.team_activities.map((activity) => (
                        <View key={activity.id} className="flex items-start gap-3">
                          <View className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <View className="i-mdi-account text-blue-600" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-medium mb-1">{activity.title}</Text>
                            <Text className="text-xs text-muted-foreground mb-1">{activity.description}</Text>
                            <Text className="text-xs text-muted-foreground">{formatTime(activity.created_at)}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View className="bg-white rounded-lg p-8 border-2 border-gray-200">
                <View className="flex flex-col items-center justify-center">
                  <View className="i-mdi-alert-circle text-4xl text-muted-foreground mb-2" />
                  <Text className="text-sm text-muted-foreground">暂无数据</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default Dashboard
