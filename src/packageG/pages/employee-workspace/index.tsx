/**
 * 员工工作台首页
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {ErrorState, Loading} from '@/components/common'
import {getEmployeeWorkspaceStats} from '@/db/api-leave'
import type {EmployeeWorkspaceStats} from '@/db/types-leave'

const EmployeeWorkspace: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [stats, setStats] = useState<EmployeeWorkspaceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState('')

  // 获取当前月份
  useEffect(() => {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setCurrentMonth(month)
  }, [])

  // 加载统计数据
  const loadStats = useCallback(async () => {
    if (!user?.id || !currentMonth) return

    try {
      setLoading(true)
      setError(null)
      const data = await getEmployeeWorkspaceStats(user.id, currentMonth)
      setStats(data)
    } catch (err) {
      console.error('加载统计数据失败:', err)
      const errorMessage = err instanceof Error ? err.message : '加载失败，请重试'
      setError(errorMessage)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentMonth])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useDidShow(() => {
    loadStats()
  })

  // 导航到休假申请
  const handleLeaveRequest = () => {
    Taro.navigateTo({
      url: '/packageG/pages/leave-request/index'
    })
  }

  // 导航到我的排班
  const handleMySchedule = () => {
    Taro.navigateTo({
      url: '/packageG/pages/my-schedule/index'
    })
  }

  // 导航到请假记录
  const handleLeaveRecords = () => {
    Taro.navigateTo({
      url: '/packageG/pages/leave-records/index'
    })
  }

  // 加载状态
  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50">
        <Loading text="加载工作台数据..." size="medium" fullscreen />
      </View>
    )
  }

  // 错误状态
  if (error) {
    return (
      <View className="min-h-screen bg-gray-50">
        <ErrorState message="加载失败" description={error} onRetry={loadStats} />
      </View>
    )
  }

  return (
    <ScrollView
      scrollY
      className="min-h-screen bg-gradient-to-b from-primary/5 to-background"
      style={{height: '100vh'}}>
      {/* 头部 */}
      <View className="bg-blue-100 text-white p-6 rounded-b-3xl">
        <Text className="text-2xl font-bold">员工工作台</Text>
        <Text className="text-sm opacity-90 mt-2">{currentMonth} 月度统计</Text>
      </View>

      {/* 统计卡片 */}
      <View className="px-4 -mt-6">
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <View className="flex flex-row justify-between">
            {/* 工作天数 */}
            <View className="flex-1 text-center">
              <Text className="text-3xl font-bold text-blue-600">{stats?.work_days || 0}</Text>
              <Text className="text-xs text-muted-foreground mt-1">工作天数</Text>
            </View>

            {/* 休假天数 */}
            <View className="flex-1 text-center border-l border-r border-border">
              <Text className="text-3xl font-bold text-warning">{stats?.leave_days || 0}</Text>
              <Text className="text-xs text-muted-foreground mt-1">休假天数</Text>
            </View>

            {/* 工作时长 */}
            <View className="flex-1 text-center">
              <Text className="text-3xl font-bold text-success">{stats?.total_hours || 0}</Text>
              <Text className="text-xs text-muted-foreground mt-1">工作时长(h)</Text>
            </View>
          </View>

          {/* 预计薪酬 */}
          <View className="mt-4 pt-4 border-t border-border">
            <View className="flex flex-row justify-between items-center">
              <Text className="text-sm text-muted-foreground">本月预计薪酬</Text>
              <Text className="text-2xl font-bold text-blue-600">¥{stats?.total_salary?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 快速入口 */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-semibold mb-3">快速入口</Text>

        <View className="grid grid-cols-2 gap-3">
          {/* 休假申请 */}
          <View
            className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow active:opacity-70"
            onClick={handleLeaveRequest}>
            <View className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <View className="i-mdi-calendar-clock text-3xl text-blue-600" />
            </View>
            <Text className="font-semibold">休假申请</Text>
            <Text className="text-xs text-muted-foreground mt-1">提交休假申请</Text>
          </View>

          {/* 我的排班 */}
          <View
            className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow active:opacity-70"
            onClick={handleMySchedule}>
            <View className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-3">
              <View className="i-mdi-calendar-month text-3xl text-success" />
            </View>
            <Text className="font-semibold">我的排班</Text>
            <Text className="text-xs text-muted-foreground mt-1">查看排班安排</Text>
          </View>

          {/* 请假记录 */}
          <View
            className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow active:opacity-70"
            onClick={handleLeaveRecords}>
            <View className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mb-3">
              <View className="i-mdi-file-document text-3xl text-warning" />
            </View>
            <Text className="font-semibold">请假记录</Text>
            <Text className="text-xs text-muted-foreground mt-1">查看申请记录</Text>
            {stats && stats.pending_requests > 0 && (
              <View className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center">
                <Text className="text-xs font-bold">{stats.pending_requests}</Text>
              </View>
            )}
          </View>

          {/* 我的合同 */}
          <View
            className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow active:opacity-70"
            onClick={() => {
              Taro.navigateTo({url: '/packageH/pages/my-contract/index'})
            }}>
            <View className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <View className="i-mdi-file-document-edit text-3xl text-muted-foreground" />
            </View>
            <Text className="font-semibold">我的合同</Text>
            <Text className="text-xs text-muted-foreground mt-1">查看劳动合同</Text>
          </View>

          {/* 我的社保 */}
          <View
            className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow active:opacity-70"
            onClick={() => {
              Taro.navigateTo({url: '/packageH/pages/my-social-security/index'})
            }}>
            <View className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <View className="i-mdi-shield-account text-3xl text-muted-foreground" />
            </View>
            <Text className="font-semibold">我的社保</Text>
            <Text className="text-xs text-muted-foreground mt-1">查看社保信息</Text>
          </View>

          {/* 待办事项 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow opacity-50">
            <View className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <View className="i-mdi-bell text-3xl text-muted-foreground" />
            </View>
            <Text className="font-semibold text-muted-foreground">待办事项</Text>
            <Text className="text-xs text-muted-foreground mt-1">即将上线</Text>
          </View>
        </View>
      </View>

      {/* 本月排班预览 */}
      <View className="px-4 mt-6 pb-6">
        <View className="flex flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold">本月排班预览</Text>
          <Text className="text-sm text-blue-600" onClick={handleMySchedule}>
            查看详情 →
          </Text>
        </View>

        <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow">
          <View className="flex flex-row justify-between items-center">
            <View>
              <Text className="text-sm text-muted-foreground">工作</Text>
              <Text className="text-2xl font-bold text-blue-600 mt-1">{stats?.work_days || 0}天</Text>
            </View>
            <View>
              <Text className="text-sm text-muted-foreground">请假</Text>
              <Text className="text-2xl font-bold text-warning mt-1">{stats?.leave_days || 0}天</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default EmployeeWorkspace
