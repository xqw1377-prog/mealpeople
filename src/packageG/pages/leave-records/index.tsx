/**
 * 请假记录页面
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {Empty, ErrorState, Loading} from '@/components/common'
import {cancelLeaveRequest, getLeaveRequestsByEmployee} from '@/db/api-leave'
import type {LeaveRequest, LeaveStatus} from '@/db/types-leave'
import {LEAVE_STATUS_COLORS, LEAVE_STATUS_NAMES, LEAVE_TYPE_NAMES} from '@/db/types-leave'

const LeaveRecords: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [records, setRecords] = useState<LeaveRequest[]>([])
  const [filteredRecords, setFilteredRecords] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | LeaveStatus>('all')

  // 筛选记录
  const filterRecords = useCallback((data: LeaveRequest[], tab: 'all' | LeaveStatus) => {
    if (tab === 'all') {
      setFilteredRecords(data)
    } else {
      setFilteredRecords(data.filter((r) => r.status === tab))
    }
  }, [])

  // 加载记录
  const loadRecords = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      const data = await getLeaveRequestsByEmployee(user.id)
      setRecords(data)
      filterRecords(data, activeTab)
    } catch (err) {
      console.error('加载记录失败:', err)
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
  }, [user?.id, activeTab, filterRecords])

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  useDidShow(() => {
    loadRecords()
  })

  // 切换标签
  const handleTabChange = (tab: 'all' | LeaveStatus) => {
    setActiveTab(tab)
    filterRecords(records, tab)
  }

  // 取消申请
  const handleCancel = async (requestId: string) => {
    const result = await Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个请假申请吗？'
    })

    if (!result.confirm) return

    try {
      await cancelLeaveRequest(requestId)
      Taro.showToast({
        title: '已取消',
        icon: 'success'
      })
      loadRecords()
    } catch (error) {
      console.error('取消失败:', error)
      Taro.showToast({
        title: '取消失败',
        icon: 'error'
      })
    }
  }

  // 渲染记录卡片
  const renderRecordCard = (record: LeaveRequest) => {
    const statusColor = LEAVE_STATUS_COLORS[record.status]
    const canCancel = record.status === 'pending'

    return (
      <View key={record.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-3 shadow">
        {/* 头部 */}
        <View className="flex flex-row items-center justify-between mb-3">
          <View className="flex flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                record.status === 'pending'
                  ? 'bg-warning'
                  : record.status === 'approved'
                    ? 'bg-success'
                    : record.status === 'rejected'
                      ? 'bg-destructive'
                      : 'bg-gray-50-foreground'
              }`}
            />
            <Text className="font-semibold">{LEAVE_TYPE_NAMES[record.leave_type]}</Text>
          </View>
          <Text className={`text-xs font-medium ${statusColor}`}>{LEAVE_STATUS_NAMES[record.status]}</Text>
        </View>

        {/* 日期和天数 */}
        <View className="flex flex-row items-center mb-2">
          <View className="i-mdi-calendar text-base text-muted-foreground mr-2" />
          <Text className="text-sm text-foreground">
            {record.start_date} ~ {record.end_date}
          </Text>
          <Text className="text-sm text-blue-600 ml-2">({record.days} 天)</Text>
        </View>

        {/* 原因 */}
        {record.reason && (
          <View className="flex flex-row items-start mb-2">
            <View className="i-mdi-text text-base text-muted-foreground mr-2 mt-0.5" />
            <Text className="text-sm text-muted-foreground flex-1">{record.reason}</Text>
          </View>
        )}

        {/* 审批信息 */}
        {record.status !== 'pending' && record.status !== 'cancelled' && (
          <View className="mt-3 pt-3 border-t border-border">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground">
                审批时间: {record.approved_at ? new Date(record.approved_at).toLocaleString('zh-CN') : '-'}
              </Text>
            </View>
            {record.approval_comment && (
              <View className="mt-2">
                <Text className="text-xs text-muted-foreground">审批意见: {record.approval_comment}</Text>
              </View>
            )}
          </View>
        )}

        {/* 操作按钮 */}
        {canCancel && (
          <View className="mt-3 pt-3 border-t border-border">
            <Button
              className="w-full bg-destructive/10 text-destructive py-2 rounded-lg break-keep text-sm"
              size="default"
              onClick={() => handleCancel(record.id)}>
              取消申请
            </Button>
          </View>
        )}

        {/* 创建时间 */}
        <View className="mt-2">
          <Text className="text-xs text-muted-foreground">
            申请时间: {new Date(record.created_at).toLocaleString('zh-CN')}
          </Text>
        </View>
      </View>
    )
  }

  // 统计数量
  const counts = {
    all: records.length,
    pending: records.filter((r) => r.status === 'pending').length,
    approved: records.filter((r) => r.status === 'approved').length,
    rejected: records.filter((r) => r.status === 'rejected').length
  }

  // 加载状态
  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50">
        <Loading text="加载请假记录..." size="medium" fullscreen />
      </View>
    )
  }

  // 错误状态
  if (error) {
    return (
      <View className="min-h-screen bg-gray-50">
        <ErrorState message="加载失败" description={error} onRetry={loadRecords} />
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 标签栏 */}
      <View className="bg-white px-4 py-3 shadow">
        <View className="flex flex-row space-x-2">
          <View
            className={`px-4 py-2 rounded-full ${activeTab === 'all' ? 'bg-green-500 text-white' : 'bg-gray-50'}`}
            onClick={() => handleTabChange('all')}>
            <Text className={`text-sm font-medium ${activeTab === 'all' ? 'text-white' : 'text-muted-foreground'}`}>
              全部 ({counts.all})
            </Text>
          </View>

          <View
            className={`px-4 py-2 rounded-full ${
              activeTab === 'pending' ? 'bg-warning text-warning-foreground' : 'bg-gray-50'
            }`}
            onClick={() => handleTabChange('pending')}>
            <Text
              className={`text-sm font-medium ${
                activeTab === 'pending' ? 'text-warning-foreground' : 'text-muted-foreground'
              }`}>
              待审批 ({counts.pending})
            </Text>
          </View>

          <View
            className={`px-4 py-2 rounded-full ${
              activeTab === 'approved' ? 'bg-success text-success-foreground' : 'bg-gray-50'
            }`}
            onClick={() => handleTabChange('approved')}>
            <Text
              className={`text-sm font-medium ${
                activeTab === 'approved' ? 'text-success-foreground' : 'text-muted-foreground'
              }`}>
              已通过 ({counts.approved})
            </Text>
          </View>

          <View
            className={`px-4 py-2 rounded-full ${
              activeTab === 'rejected' ? 'bg-destructive text-destructive-foreground' : 'bg-gray-50'
            }`}
            onClick={() => handleTabChange('rejected')}>
            <Text
              className={`text-sm font-medium ${
                activeTab === 'rejected' ? 'text-destructive-foreground' : 'text-muted-foreground'
              }`}>
              已拒绝 ({counts.rejected})
            </Text>
          </View>
        </View>
      </View>

      {/* 记录列表 */}
      <ScrollView scrollY className="p-4" style={{height: 'calc(100vh - 60px)'}}>
        {filteredRecords.length === 0 ? (
          <Empty
            icon="i-mdi-file-document-outline"
            text="暂无请假记录"
            description={
              activeTab === 'all'
                ? '您还没有提交过请假申请'
                : `暂无${LEAVE_STATUS_NAMES[activeTab as LeaveStatus]}的记录`
            }
            buttonText="提交申请"
            onButtonClick={() => {
              Taro.navigateTo({url: '/packageG/pages/leave-request/index'})
            }}
          />
        ) : (
          filteredRecords.map((record) => renderRecordCard(record))
        )}
      </ScrollView>
    </View>
  )
}

export default LeaveRecords
