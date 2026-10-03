/**
 * 请假审批页面（管理员）
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {approveLeaveRequest, getPendingLeaveRequests, rejectLeaveRequest} from '@/db/api-leave'
import type {LeaveRequestWithEmployee} from '@/db/types-leave'
import {LEAVE_TYPE_NAMES} from '@/db/types-leave'

const LeaveApproval: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [requests, setRequests] = useState<LeaveRequestWithEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [commentMap, setCommentMap] = useState<Record<string, string>>({})

  // 加载待审批申请
  const loadRequests = useCallback(async () => {
    try {
      setLoading(true)

      // 获取租户ID
      const tenantId = localStorage.getItem('currentTenantId') || ''
      if (!tenantId) {
        Taro.showToast({title: '请先选择租户', icon: 'error'})
        return
      }

      const data = await getPendingLeaveRequests(tenantId)
      setRequests(data)
    } catch (error) {
      console.error('加载待审批申请失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  useDidShow(() => {
    loadRequests()
  })

  // 处理审批意见输入
  const handleCommentChange = (requestId: string, value: string) => {
    setCommentMap((prev) => ({
      ...prev,
      [requestId]: value
    }))
  }

  // 批准申请
  const handleApprove = async (requestId: string) => {
    if (!user?.id) return

    const result = await Taro.showModal({
      title: '确认批准',
      content: '确定要批准这个请假申请吗？'
    })

    if (!result.confirm) return

    try {
      setProcessingId(requestId)

      await approveLeaveRequest(requestId, user.id, commentMap[requestId])

      Taro.showToast({
        title: '已批准',
        icon: 'success'
      })

      // 清除评论
      setCommentMap((prev) => {
        const newMap = {...prev}
        delete newMap[requestId]
        return newMap
      })

      loadRequests()
    } catch (error) {
      console.error('批准失败:', error)
      Taro.showToast({
        title: '批准失败',
        icon: 'error'
      })
    } finally {
      setProcessingId(null)
    }
  }

  // 拒绝申请
  const handleReject = async (requestId: string) => {
    if (!user?.id) return

    const comment = commentMap[requestId]
    if (!comment?.trim()) {
      Taro.showToast({
        title: '请填写拒绝原因',
        icon: 'error'
      })
      return
    }

    const result = await Taro.showModal({
      title: '确认拒绝',
      content: '确定要拒绝这个请假申请吗？'
    })

    if (!result.confirm) return

    try {
      setProcessingId(requestId)

      await rejectLeaveRequest(requestId, user.id, comment.trim())

      Taro.showToast({
        title: '已拒绝',
        icon: 'success'
      })

      // 清除评论
      setCommentMap((prev) => {
        const newMap = {...prev}
        delete newMap[requestId]
        return newMap
      })

      loadRequests()
    } catch (error) {
      console.error('拒绝失败:', error)
      Taro.showToast({
        title: '拒绝失败',
        icon: 'error'
      })
    } finally {
      setProcessingId(null)
    }
  }

  // 渲染申请卡片
  const renderRequestCard = (request: LeaveRequestWithEmployee) => {
    const isProcessing = processingId === request.id
    const comment = commentMap[request.id] || ''

    return (
      <View key={request.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow">
        {/* 员工信息 */}
        <View className="flex flex-row items-center justify-between mb-3">
          <View className="flex flex-row items-center">
            <View className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <View className="i-mdi-account text-2xl text-blue-600" />
            </View>
            <View>
              <Text className="font-semibold">{request.employee.name}</Text>
              {request.employee.phone && (
                <Text className="text-xs text-muted-foreground mt-0.5">{request.employee.phone}</Text>
              )}
            </View>
          </View>
          <View className="px-3 py-1 bg-blue-100 rounded-full">
            <Text className="text-xs font-medium text-blue-600">
              {request.leave_type_obj?.type_name || LEAVE_TYPE_NAMES[request.leave_type]}
            </Text>
          </View>
        </View>

        {/* 日期和天数 */}
        <View className="flex flex-row items-center mb-2">
          <View className="i-mdi-calendar text-base text-muted-foreground mr-2" />
          <Text className="text-sm text-foreground">
            {request.start_date} ~ {request.end_date}
          </Text>
          <Text className="text-sm text-blue-600 ml-2 font-medium">({request.days} 天)</Text>
        </View>

        {/* 请假原因 */}
        {request.reason && (
          <View className="bg-gray-50/50 rounded-lg p-3 mb-3">
            <Text className="text-xs text-muted-foreground mb-1">请假原因</Text>
            <Text className="text-sm text-foreground">{request.reason}</Text>
          </View>
        )}

        {/* 审批意见 */}
        <View className="mb-3">
          <Text className="text-xs text-muted-foreground mb-2">审批意见</Text>
          <View style={{overflow: 'hidden'}}>
            <Textarea
              className="w-full bg-gray-50 rounded-lg p-3 text-sm"
              placeholder="请输入审批意见（选填）"
              value={comment}
              onInput={(e) => handleCommentChange(request.id, e.detail.value)}
              maxlength={200}
              style={{minHeight: '80px'}}
            />
          </View>
          <Text className="text-xs text-muted-foreground mt-1 text-right">{comment.length}/200</Text>
        </View>

        {/* 操作按钮 */}
        <View className="flex flex-row space-x-3">
          <Button
            className="flex-1 bg-success text-success-foreground py-3 rounded-lg break-keep text-sm font-semibold"
            size="default"
            onClick={() => handleApprove(request.id)}
            disabled={isProcessing}>
            {isProcessing ? '处理中...' : '✓ 批准'}
          </Button>

          <Button
            className="flex-1 bg-destructive text-destructive-foreground py-3 rounded-lg break-keep text-sm font-semibold"
            size="default"
            onClick={() => handleReject(request.id)}
            disabled={isProcessing}>
            {isProcessing ? '处理中...' : '✗ 拒绝'}
          </Button>
        </View>

        {/* 申请时间 */}
        <View className="mt-3 pt-3 border-t border-border">
          <Text className="text-xs text-muted-foreground">
            申请时间: {new Date(request.created_at).toLocaleString('zh-CN')}
          </Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部统计 */}
      <View className="bg-blue-100 text-white p-4">
        <Text className="text-sm opacity-90">待审批申请</Text>
        <Text className="text-3xl font-bold mt-1">{requests.length}</Text>
      </View>

      {/* 申请列表 */}
      <ScrollView scrollY className="p-4" style={{height: 'calc(100vh - 100px)'}}>
        {requests.length === 0 ? (
          <View className="flex items-center justify-center py-20">
            <View className="i-mdi-check-circle-outline text-6xl text-success mb-4" />
            <Text className="text-muted-foreground">暂无待审批申请</Text>
          </View>
        ) : (
          requests.map((request) => renderRequestCard(request))
        )}
      </ScrollView>
    </View>
  )
}

export default LeaveApproval
