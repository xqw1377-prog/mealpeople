/**
 * 我的请假页面 - 员工请假管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {cancelLeaveRequest, getEmployeeLeaveData} from '@/db/api-leave'
import type {LeaveData} from '@/db/types-leave'
import {LEAVE_STATUS_BG_COLORS, LEAVE_STATUS_COLORS, LEAVE_STATUS_NAMES, LEAVE_TYPE_NAMES} from '@/db/types-leave'

export default function MyLeave() {
  const {user} = useAuth({guard: true})
  const [leaveData, setLeaveData] = useState<LeaveData | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载请假数据
  const loadLeaveData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 获取请假数据
      const data = await getEmployeeLeaveData(employee.id)
      setLeaveData(data)
    } catch (error) {
      console.error('加载请假数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadLeaveData()
  })

  // 取消请假申请
  const handleCancelRequest = async (requestId: string) => {
    const result = await Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个请假申请吗？'
    })

    if (result.confirm) {
      const success = await cancelLeaveRequest(requestId)
      if (success) {
        Taro.showToast({
          title: '取消成功',
          icon: 'success'
        })
        loadLeaveData()
      } else {
        Taro.showToast({
          title: '取消失败',
          icon: 'none'
        })
      }
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!leaveData) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">暂无请假数据</Text>
      </View>
    )
  }

  const {balances, recent_requests, statistics} = leaveData

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的请假</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">假期管理与申请</Text>
          </View>

          {/* 假期余额卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 mb-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-blue-600/80 text-sm">剩余假期</Text>
                <Text className="text-foreground text-3xl font-bold mt-1">{statistics.total_days_remaining}天</Text>
              </View>
              <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <View className="i-mdi-calendar-clock text-4xl text-blue-600" />
              </View>
            </View>

            <View className="flex flex-row items-center justify-between pt-4 border-t border-white/20">
              <View>
                <Text className="text-blue-600/80 text-xs">已使用</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.total_days_used}天</Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">待审批</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.pending_requests}个</Text>
              </View>
            </View>
          </View>

          {/* 假期余额明细 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">假期余额</Text>
              <View className="i-mdi-calendar-multiple text-2xl text-blue-600" />
            </View>

            {balances.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-calendar-blank text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无假期余额</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {balances.map((balance) => (
                  <View key={balance.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-3">
                      <Text className="text-base font-medium text-foreground">{balance.leave_type.type_name}</Text>
                      <View
                        className={`px-2 py-1 rounded ${balance.leave_type.is_paid ? 'bg-green-100' : 'bg-gray-50'}`}>
                        <Text
                          className={`text-xs ${balance.leave_type.is_paid ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                          {balance.leave_type.is_paid ? '带薪' : '无薪'}
                        </Text>
                      </View>
                    </View>

                    {/* 进度条 */}
                    <View className="mb-3">
                      <View className="flex flex-row items-center justify-between mb-2">
                        <Text className="text-xs text-muted-foreground">使用进度</Text>
                        <Text className="text-xs text-muted-foreground">
                          {balance.used_days}/{balance.total_days}天
                        </Text>
                      </View>
                      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-blue-100 rounded-full"
                          style={{
                            width: `${Math.min((Number(balance.used_days) / Number(balance.total_days)) * 100, 100)}%`
                          }}
                        />
                      </View>
                    </View>

                    <View className="flex flex-row items-center justify-between">
                      <Text className="text-xs text-muted-foreground">剩余: {balance.remaining_days}天</Text>
                      {balance.leave_type.max_days_per_year && (
                        <Text className="text-xs text-muted-foreground">
                          年度上限: {balance.leave_type.max_days_per_year}天
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 请假统计 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">请假统计</Text>
              <View className="i-mdi-chart-bar text-2xl text-blue-600" />
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View className="text-center p-3 bg-blue-100 rounded-lg">
                <Text className="text-2xl font-bold text-muted-foreground">{statistics.total_requests}</Text>
                <Text className="text-xs text-muted-foreground mt-1">总申请</Text>
              </View>
              <View className="text-center p-3 bg-blue-100 rounded-lg">
                <Text className="text-2xl font-bold text-muted-foreground">{statistics.pending_requests}</Text>
                <Text className="text-xs text-muted-foreground mt-1">待审批</Text>
              </View>
              <View className="text-center p-3 bg-blue-100 rounded-lg">
                <Text className="text-2xl font-bold text-muted-foreground">{statistics.approved_requests}</Text>
                <Text className="text-xs text-muted-foreground mt-1">已批准</Text>
              </View>
              <View className="text-center p-3 bg-blue-100 rounded-lg">
                <Text className="text-2xl font-bold text-red-600">{statistics.rejected_requests}</Text>
                <Text className="text-xs text-muted-foreground mt-1">已拒绝</Text>
              </View>
            </View>
          </View>

          {/* 最近申请 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">最近申请</Text>
              <View className="i-mdi-history text-2xl text-blue-600" />
            </View>

            {recent_requests.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-file-document-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无请假申请</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {recent_requests.map((request) => (
                  <View key={request.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground">
                        {request.leave_type_obj?.type_name || LEAVE_TYPE_NAMES[request.leave_type]}
                      </Text>
                      <View className={`px-2 py-1 rounded ${LEAVE_STATUS_BG_COLORS[request.status]}`}>
                        <Text className={`text-xs ${LEAVE_STATUS_COLORS[request.status]}`}>
                          {LEAVE_STATUS_NAMES[request.status]}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xs text-muted-foreground mb-2">{request.reason}</Text>

                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-xs text-muted-foreground">
                        {formatDate(request.start_date)} - {formatDate(request.end_date)}
                      </Text>
                      <Text className="text-xs font-medium text-blue-600">{request.days}天</Text>
                    </View>

                    {request.approval_comment && (
                      <View className="p-2 bg-blue-100 rounded mt-2">
                        <Text className="text-xs text-muted-foreground">审批意见: {request.approval_comment}</Text>
                      </View>
                    )}

                    {request.status === 'pending' && (
                      <View
                        className="mt-3 p-2 bg-blue-100 rounded text-center active:opacity-70"
                        onClick={() => handleCancelRequest(request.id)}>
                        <Text className="text-xs text-red-600 font-medium">取消申请</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 快捷操作 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">请假管理</Text>
              <View className="i-mdi-cog text-2xl text-blue-600" />
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '请假申请功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-file-document-plus text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">申请请假</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '请假历史功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-history text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">请假历史</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '假期规则功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-information text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">假期规则</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '请假报告功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-file-chart text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">请假报告</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
