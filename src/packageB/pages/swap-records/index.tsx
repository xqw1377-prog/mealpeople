/**
 * 换班记录页面
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api-employees'
import {cancelSwapRequest, getSwapRequestStatistics, getSwapRequests} from '@/db/api-swap'
import type {ShiftSwapRequest, SwapRequestStatistics} from '@/db/types-swap'

interface SwapRequestDisplay extends ShiftSwapRequest {
  statusName: string
  statusColor: string
  statusIcon: string
}

const SwapRecords: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<SwapRequestDisplay[]>([])
  const [statistics, setStatistics] = useState<SwapRequestStatistics>({
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    rejected_requests: 0,
    cancelled_requests: 0
  })

  // 当前筛选状态
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // 获取状态信息
  const getStatusInfo = useCallback((status: string) => {
    const statusMap: Record<string, {name: string; color: string; icon: string}> = {
      pending: {name: '待审批', color: 'text-muted-foreground', icon: 'i-mdi-clock-outline'},
      approved: {name: '已通过', color: 'text-muted-foreground', icon: 'i-mdi-check-circle'},
      rejected: {name: '已拒绝', color: 'text-red-600', icon: 'i-mdi-close-circle'},
      cancelled: {name: '已取消', color: 'text-muted-foreground', icon: 'i-mdi-cancel'}
    }
    return statusMap[status] || {name: '未知', color: 'text-muted-foreground', icon: 'i-mdi-help-circle'}
  }, [])

  // 加载换班记录
  const loadSwapRecords = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        Taro.showToast({title: '未找到员工信息', icon: 'error'})
        return
      }

      // 获取换班申请列表（作为申请人）
      const allRequests = await getSwapRequests({requester_id: employee.id})

      // 转换为显示格式
      const displayRequests: SwapRequestDisplay[] = allRequests.map((request) => {
        const statusInfo = getStatusInfo(request.status)
        return {
          ...request,
          statusName: statusInfo.name,
          statusColor: statusInfo.color,
          statusIcon: statusInfo.icon
        }
      })

      setRequests(displayRequests)

      // 获取统计数据
      const stats = await getSwapRequestStatistics(employee.id)
      setStatistics(stats)
    } catch (error) {
      console.error('加载换班记录失败:', error)
      Taro.showToast({title: '加载失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }, [user?.id, getStatusInfo])

  useDidShow(() => {
    loadSwapRecords()
  })

  // 取消换班申请
  const handleCancel = async (requestId: string) => {
    const result = await Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个换班申请吗？',
      confirmText: '确定',
      cancelText: '取消'
    })

    if (!result.confirm) return

    try {
      const success = await cancelSwapRequest(requestId)
      if (success) {
        Taro.showToast({title: '取消成功', icon: 'success'})
        loadSwapRecords()
      } else {
        Taro.showToast({title: '取消失败', icon: 'error'})
      }
    } catch (error) {
      console.error('取消换班申请失败:', error)
      Taro.showToast({title: '取消失败', icon: 'error'})
    }
  }

  // 筛选记录
  const filteredRequests = filterStatus === 'all' ? requests : requests.filter((r) => r.status === filterStatus)

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {loading ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-sm">
              <Text className="text-center text-muted-foreground">加载中...</Text>
            </View>
          ) : (
            <>
              {/* 统计卡片 */}
              <View className="bg-blue-100 rounded-lg p-6">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-foreground text-lg font-bold">换班统计</Text>
                  <View className="i-mdi-chart-box text-2xl text-blue-600" />
                </View>

                <View className="grid grid-cols-4 gap-2">
                  <View className="text-center">
                    <Text className="text-blue-600/80 text-xs">总申请</Text>
                    <Text className="text-foreground text-2xl font-bold mt-1">{statistics.total_requests}</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-blue-600/80 text-xs">待审批</Text>
                    <Text className="text-foreground text-2xl font-bold mt-1">{statistics.pending_requests}</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-blue-600/80 text-xs">已通过</Text>
                    <Text className="text-foreground text-2xl font-bold mt-1">{statistics.approved_requests}</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-blue-600/80 text-xs">已拒绝</Text>
                    <Text className="text-foreground text-2xl font-bold mt-1">{statistics.rejected_requests}</Text>
                  </View>
                </View>
              </View>

              {/* 筛选按钮 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <View className="flex flex-row items-center gap-2">
                  <View
                    className={`flex-1 text-center py-2 rounded-lg ${
                      filterStatus === 'all' ? 'bg-green-500 text-white' : 'bg-gray-50/30 text-foreground'
                    }`}
                    onClick={() => setFilterStatus('all')}>
                    <Text className={`text-sm ${filterStatus === 'all' ? 'text-white' : 'text-foreground'}`}>全部</Text>
                  </View>
                  <View
                    className={`flex-1 text-center py-2 rounded-lg ${
                      filterStatus === 'pending' ? 'bg-green-500 text-white' : 'bg-gray-50/30 text-foreground'
                    }`}
                    onClick={() => setFilterStatus('pending')}>
                    <Text className={`text-sm ${filterStatus === 'pending' ? 'text-white' : 'text-foreground'}`}>
                      待审批
                    </Text>
                  </View>
                  <View
                    className={`flex-1 text-center py-2 rounded-lg ${
                      filterStatus === 'approved' ? 'bg-blue-100 text-white' : 'bg-gray-50/30 text-foreground'
                    }`}
                    onClick={() => setFilterStatus('approved')}>
                    <Text className={`text-sm ${filterStatus === 'approved' ? 'text-blue-600' : 'text-foreground'}`}>
                      已通过
                    </Text>
                  </View>
                  <View
                    className={`flex-1 text-center py-2 rounded-lg ${
                      filterStatus === 'rejected' ? 'bg-blue-100 text-white' : 'bg-gray-50/30 text-foreground'
                    }`}
                    onClick={() => setFilterStatus('rejected')}>
                    <Text className={`text-sm ${filterStatus === 'rejected' ? 'text-blue-600' : 'text-foreground'}`}>
                      已拒绝
                    </Text>
                  </View>
                </View>
              </View>

              {/* 换班记录列表 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-foreground">换班记录</Text>
                  <View className="i-mdi-history text-2xl text-blue-600" />
                </View>

                {filteredRequests.length === 0 ? (
                  <View className="text-center py-8">
                    <View className="i-mdi-file-document-outline text-5xl text-muted-foreground mb-2" />
                    <Text className="text-muted-foreground">暂无换班记录</Text>
                  </View>
                ) : (
                  <View className="space-y-3">
                    {filteredRequests.map((request) => (
                      <View key={request.id} className="rounded-xl p-4 bg-gray-50/30 border border-border">
                        {/* 状态标签 */}
                        <View className="flex flex-row items-center justify-between mb-3">
                          <View className="flex flex-row items-center">
                            <View className={`${request.statusIcon} text-xl ${request.statusColor} mr-2`} />
                            <Text className={`text-sm font-bold ${request.statusColor}`}>{request.statusName}</Text>
                          </View>
                          <Text className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </Text>
                        </View>

                        {/* 换班信息 */}
                        <View className="space-y-2">
                          <View className="flex flex-row items-start">
                            <View className="i-mdi-calendar-export text-base text-blue-600 mr-2 mt-0.5" />
                            <View className="flex-1">
                              <Text className="text-xs text-muted-foreground">我的班次</Text>
                              <Text className="text-sm text-foreground">待实现：显示班次详情</Text>
                            </View>
                          </View>

                          <View className="flex flex-row items-start">
                            <View className="i-mdi-calendar-import text-base text-accent mr-2 mt-0.5" />
                            <View className="flex-1">
                              <Text className="text-xs text-muted-foreground">目标班次</Text>
                              <Text className="text-sm text-foreground">待实现：显示班次详情</Text>
                            </View>
                          </View>

                          <View className="flex flex-row items-start">
                            <View className="i-mdi-text-box text-base text-muted-foreground mr-2 mt-0.5" />
                            <View className="flex-1">
                              <Text className="text-xs text-muted-foreground">换班原因</Text>
                              <Text className="text-sm text-foreground">{request.reason}</Text>
                            </View>
                          </View>

                          {request.review_notes && (
                            <View className="flex flex-row items-start">
                              <View className="i-mdi-comment-text text-base text-muted-foreground mr-2 mt-0.5" />
                              <View className="flex-1">
                                <Text className="text-xs text-muted-foreground">审批备注</Text>
                                <Text className="text-sm text-foreground">{request.review_notes}</Text>
                              </View>
                            </View>
                          )}
                        </View>

                        {/* 操作按钮 */}
                        {request.status === 'pending' && (
                          <View className="mt-3 pt-3 border-t border-border">
                            <View
                              className="text-center py-2 bg-blue-100 rounded-lg active:opacity-70"
                              onClick={() => handleCancel(request.id)}>
                              <Text className="text-sm text-red-600">取消申请</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default SwapRecords
