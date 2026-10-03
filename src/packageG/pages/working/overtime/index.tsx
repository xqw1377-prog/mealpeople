/**
 * 我的加班页面 - 员工加班管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {cancelOvertimeRequest, getEmployeeOvertimeData} from '@/db/api-overtime'
import type {OvertimeData} from '@/db/types-overtime'
import {
  COMPENSATION_STATUS_COLORS,
  COMPENSATION_STATUS_NAMES,
  COMPENSATION_TYPE_NAMES,
  OVERTIME_STATUS_BG_COLORS,
  OVERTIME_STATUS_COLORS,
  OVERTIME_STATUS_NAMES
} from '@/db/types-overtime'

export default function MyOvertime() {
  const {user} = useAuth({guard: true})
  const [overtimeData, setOvertimeData] = useState<OvertimeData | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载加班数据
  const loadOvertimeData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 获取加班数据
      const data = await getEmployeeOvertimeData(employee.id)
      setOvertimeData(data)
    } catch (error) {
      console.error('加载加班数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadOvertimeData()
  })

  // 取消加班申请
  const handleCancelRequest = async (requestId: string) => {
    const result = await Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个加班申请吗？'
    })

    if (result.confirm) {
      const success = await cancelOvertimeRequest(requestId)
      if (success) {
        Taro.showToast({
          title: '取消成功',
          icon: 'success'
        })
        loadOvertimeData()
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

  if (!overtimeData) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">暂无加班数据</Text>
      </View>
    )
  }

  const {requests, compensations, statistics} = overtimeData

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的加班</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">加班管理与补偿</Text>
          </View>

          {/* 加班统计卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 mb-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-blue-600/80 text-sm">累计加班</Text>
                <Text className="text-foreground text-3xl font-bold mt-1">{statistics.total_hours}小时</Text>
              </View>
              <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <View className="i-mdi-clock-plus text-4xl text-blue-600" />
              </View>
            </View>

            <View className="flex flex-row items-center justify-between pt-4 border-t border-white/20">
              <View>
                <Text className="text-blue-600/80 text-xs">可用补偿</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.available_compensations}个</Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">待审批</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.pending_requests}个</Text>
              </View>
            </View>
          </View>

          {/* 加班申请统计 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">加班统计</Text>
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

          {/* 加班补偿 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">加班补偿</Text>
              <View className="i-mdi-gift text-2xl text-blue-600" />
            </View>

            {compensations.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-gift-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无加班补偿</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {compensations.slice(0, 5).map((compensation) => (
                  <View key={compensation.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground">
                        {COMPENSATION_TYPE_NAMES[compensation.compensation_type]}
                      </Text>
                      <View
                        className={`px-2 py-1 rounded ${compensation.status === 'available' ? 'bg-green-100' : 'bg-gray-50'}`}>
                        <Text className={`text-xs ${COMPENSATION_STATUS_COLORS[compensation.status]}`}>
                          {COMPENSATION_STATUS_NAMES[compensation.status]}
                        </Text>
                      </View>
                    </View>

                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-xs text-muted-foreground">
                        {compensation.overtime_request.overtime_type.type_name}
                      </Text>
                      <Text className="text-xs font-medium text-blue-600">{compensation.hours}小时</Text>
                    </View>

                    <Text className="text-xs text-muted-foreground">
                      加班日期: {formatDate(compensation.overtime_request.overtime_date)}
                    </Text>

                    {compensation.used_at && (
                      <Text className="text-xs text-muted-foreground mt-1">
                        使用时间: {formatDate(compensation.used_at)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 最近申请 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">最近申请</Text>
              <View className="i-mdi-history text-2xl text-blue-600" />
            </View>

            {requests.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-file-document-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无加班申请</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {requests.slice(0, 10).map((request) => (
                  <View key={request.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground">{request.overtime_type.type_name}</Text>
                      <View className={`px-2 py-1 rounded ${OVERTIME_STATUS_BG_COLORS[request.status]}`}>
                        <Text className={`text-xs ${OVERTIME_STATUS_COLORS[request.status]}`}>
                          {OVERTIME_STATUS_NAMES[request.status]}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-xs text-muted-foreground mb-2">{request.reason}</Text>

                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-xs text-muted-foreground">
                        {formatDate(request.overtime_date)} {request.start_time}-{request.end_time}
                      </Text>
                      <Text className="text-xs font-medium text-blue-600">{request.hours}小时</Text>
                    </View>

                    {request.approval_notes && (
                      <View className="p-2 bg-blue-100 rounded mt-2">
                        <Text className="text-xs text-muted-foreground">审批意见: {request.approval_notes}</Text>
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
              <Text className="text-lg font-semibold text-foreground">加班管理</Text>
              <View className="i-mdi-cog text-2xl text-blue-600" />
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '加班申请功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-file-document-plus text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">申请加班</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '加班历史功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-history text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">加班历史</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '补偿管理功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-gift text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">补偿管理</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '加班报告功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-file-chart text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">加班报告</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
