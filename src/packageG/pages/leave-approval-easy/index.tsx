/**
 * 休假审批页面 - 三易原则优化版
 * 容易学：清晰的信息展示
 * 容易做：快速审批，批量操作
 * 容易管理：智能筛选和统计
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {approveLeaveRequest, getPendingLeaveRequests, rejectLeaveRequest} from '@/db/api-leave'
import {APPROVAL_TEMPLATES, formatDateFriendly, getLeaveTypeConfig} from '@/db/leave-type-config'
import type {LeaveRequestWithEmployee} from '@/db/types-leave'

export default function LeaveApprovalEasy() {
  const {user} = useAuth({guard: true})

  // 数据状态
  const [requests, setRequests] = useState<LeaveRequestWithEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // UI状态
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<LeaveRequestWithEmployee | null>(null)
  const [approvalComment, setApprovalComment] = useState('')
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')

  // 加载待审批列表
  const loadRequests = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await getPendingLeaveRequests(user.id)
      setRequests(data || [])
    } catch (error) {
      console.error('加载待审批列表失败:', error)
      Taro.showToast({title: '加载失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadRequests()
  })

  // 打开审批对话框
  const openApprovalDialog = useCallback((request: LeaveRequestWithEmployee, action: 'approve' | 'reject') => {
    setCurrentRequest(request)
    setApprovalAction(action)
    setApprovalComment('')
    setShowApprovalDialog(true)
  }, [])

  // 快速审批（无需填写意见）
  const handleQuickApproval = useCallback(
    async (request: LeaveRequestWithEmployee, action: 'approve' | 'reject') => {
      try {
        const defaultComment = action === 'approve' ? '同意' : '不同意'

        if (action === 'approve') {
          await approveLeaveRequest(request.id, defaultComment)
          Taro.showToast({title: '已批准', icon: 'success'})
        } else {
          await rejectLeaveRequest(request.id, defaultComment)
          Taro.showToast({title: '已拒绝', icon: 'success'})
        }

        loadRequests()
      } catch (error) {
        console.error('审批失败:', error)
        Taro.showToast({title: '操作失败', icon: 'error'})
      }
    },
    [loadRequests]
  )

  // 提交审批
  const handleSubmitApproval = useCallback(async () => {
    if (!currentRequest) return

    if (!approvalComment.trim()) {
      Taro.showToast({title: '请填写审批意见', icon: 'none'})
      return
    }

    try {
      if (approvalAction === 'approve') {
        await approveLeaveRequest(currentRequest.id, approvalComment.trim())
        Taro.showToast({title: '已批准', icon: 'success'})
      } else {
        await rejectLeaveRequest(currentRequest.id, approvalComment.trim())
        Taro.showToast({title: '已拒绝', icon: 'success'})
      }

      setShowApprovalDialog(false)
      loadRequests()
    } catch (error) {
      console.error('审批失败:', error)
      Taro.showToast({title: '操作失败', icon: 'error'})
    }
  }, [currentRequest, approvalAction, approvalComment, loadRequests])

  // 使用模板
  const handleUseTemplate = useCallback((template: string) => {
    setApprovalComment(template)
  }, [])

  // 批量审批
  const handleBatchApproval = useCallback(
    async (action: 'approve' | 'reject') => {
      if (selectedIds.size === 0) {
        Taro.showToast({title: '请先选择申请', icon: 'none'})
        return
      }

      const result = await Taro.showModal({
        title: '确认批量操作',
        content: `确定要${action === 'approve' ? '批准' : '拒绝'}选中的 ${selectedIds.size} 条申请吗？`
      })

      if (!result.confirm) return

      try {
        const defaultComment = action === 'approve' ? '批量批准' : '批量拒绝'

        for (const id of selectedIds) {
          if (action === 'approve') {
            await approveLeaveRequest(id, defaultComment)
          } else {
            await rejectLeaveRequest(id, defaultComment)
          }
        }

        Taro.showToast({
          title: `已${action === 'approve' ? '批准' : '拒绝'} ${selectedIds.size} 条`,
          icon: 'success'
        })

        setSelectedIds(new Set())
        loadRequests()
      } catch (error) {
        console.error('批量审批失败:', error)
        Taro.showToast({title: '操作失败', icon: 'error'})
      }
    },
    [selectedIds, loadRequests]
  )

  // 切换选中状态
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  // 全选/取消全选
  const _toggleSelectAll = useCallback(() => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(requests.map((r) => r.id)))
    }
  }, [requests, selectedIds])

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <ScrollView scrollY className="h-screen" style={{background: 'transparent'}}>
        <View className="p-4 space-y-4">
          {/* 页面标题和统计 */}
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <View className="flex items-center gap-3">
                <View className="i-mdi-clipboard-check text-3xl text-blue-600" />
                <View>
                  <Text className="text-xl font-bold text-foreground block">待审批申请</Text>
                  <Text className="text-sm text-muted-foreground">快速审批，高效管理</Text>
                </View>
              </View>
              <View className="text-right">
                <Text className="text-3xl font-bold text-blue-600 block">{requests.length}</Text>
                <Text className="text-xs text-muted-foreground">待处理</Text>
              </View>
            </View>

            {/* 批量操作栏 */}
            {selectedIds.size > 0 && (
              <View className="mt-4 p-4 bg-blue-50 rounded-xl">
                <View className="flex items-center justify-between">
                  <Text className="text-sm text-blue-700">已选择 {selectedIds.size} 条</Text>
                  <View className="flex gap-2">
                    <Button
                      className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm"
                      size="mini"
                      onClick={() => handleBatchApproval('approve')}>
                      批量批准
                    </Button>
                    <Button
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
                      size="mini"
                      onClick={() => handleBatchApproval('reject')}>
                      批量拒绝
                    </Button>
                    <Button
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm"
                      size="mini"
                      onClick={() => setSelectedIds(new Set())}>
                      取消
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* 快捷操作提示 */}
          <View className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 shadow-lg">
            <View className="flex items-start gap-3">
              <View className="i-mdi-lightbulb-on text-2xl text-white mt-1" />
              <View className="flex-1">
                <Text className="text-white font-semibold mb-2 block">快速审批技巧</Text>
                <Text className="text-white/90 text-sm leading-relaxed">
                  • 点击"快速批准"或"快速拒绝"可一键审批{'\n'}• 点击"详细审批"可填写审批意见{'\n'}•
                  长按卡片可多选，支持批量操作
                </Text>
              </View>
            </View>
          </View>

          {/* 申请列表 */}
          {loading ? (
            <View className="text-center py-12">
              <View className="i-mdi-loading animate-spin text-4xl text-blue-600 mb-3" />
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : requests.length === 0 ? (
            <View className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <View className="i-mdi-check-all text-6xl text-green-500 mb-4" />
              <Text className="text-base font-semibold text-foreground mb-2 block">太棒了！</Text>
              <Text className="text-sm text-muted-foreground">暂无待审批的申请</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {requests.map((request) => {
                const typeConfig = getLeaveTypeConfig(request.leave_type)
                const isSelected = selectedIds.has(request.id)

                return (
                  <View
                    key={request.id}
                    className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                    }`}
                    onLongPress={() => toggleSelection(request.id)}>
                    {/* 选择框 */}
                    {selectedIds.size > 0 && (
                      <View className="mb-3">
                        <View
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                          }`}
                          onClick={() => toggleSelection(request.id)}>
                          {isSelected && <View className="i-mdi-check text-white text-sm" />}
                        </View>
                      </View>
                    )}

                    {/* 员工信息和类型 */}
                    <View className="flex items-center justify-between mb-4">
                      <View className="flex items-center gap-3">
                        <View className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <View className="i-mdi-account text-2xl text-blue-600" />
                        </View>
                        <View>
                          <Text className="text-base font-semibold text-foreground block">{request.employee.name}</Text>
                          {request.employee.phone && (
                            <Text className="text-xs text-muted-foreground">{request.employee.phone}</Text>
                          )}
                        </View>
                      </View>
                      <View className={`px-3 py-1.5 ${typeConfig?.bgColor} rounded-full`}>
                        <Text className={`text-sm font-medium ${typeConfig?.color}`}>{typeConfig?.name}</Text>
                      </View>
                    </View>

                    {/* 日期和天数 */}
                    <View className="bg-gray-50 rounded-xl p-4 mb-4">
                      <View className="flex items-center justify-between mb-2">
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-calendar-range text-lg text-blue-600" />
                          <Text className="text-sm text-muted-foreground">请假时间</Text>
                        </View>
                        <Text className="text-lg font-bold text-blue-600">{request.days} 天</Text>
                      </View>
                      <View className="flex items-center gap-2">
                        <Text className="text-sm text-foreground">{formatDateFriendly(request.start_date)}</Text>
                        <View className="i-mdi-arrow-right text-sm text-muted-foreground" />
                        <Text className="text-sm text-foreground">{formatDateFriendly(request.end_date)}</Text>
                      </View>
                      <Text className="text-xs text-muted-foreground mt-1">
                        {request.start_date} ~ {request.end_date}
                      </Text>
                    </View>

                    {/* 请假理由 */}
                    <View className="mb-4">
                      <View className="flex items-center gap-2 mb-2">
                        <View className="i-mdi-text-box text-base text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">请假理由</Text>
                      </View>
                      <Text className="text-sm text-foreground leading-relaxed pl-6">{request.reason}</Text>
                    </View>

                    {/* 申请时间 */}
                    <View className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
                      <View className="i-mdi-clock-outline text-sm text-muted-foreground" />
                      <Text className="text-xs text-muted-foreground">
                        申请时间：{new Date(request.created_at).toLocaleString('zh-CN')}
                      </Text>
                    </View>

                    {/* 操作按钮 */}
                    <View className="grid grid-cols-2 gap-3">
                      {/* 快速批准 */}
                      <Button
                        className="bg-green-500 text-white py-3 rounded-xl break-keep text-sm font-semibold shadow-sm"
                        size="default"
                        onClick={() => handleQuickApproval(request, 'approve')}>
                        <View className="flex items-center justify-center gap-2">
                          <View className="i-mdi-check-circle text-lg" />
                          <Text>快速批准</Text>
                        </View>
                      </Button>

                      {/* 快速拒绝 */}
                      <Button
                        className="bg-red-500 text-white py-3 rounded-xl break-keep text-sm font-semibold shadow-sm"
                        size="default"
                        onClick={() => handleQuickApproval(request, 'reject')}>
                        <View className="flex items-center justify-center gap-2">
                          <View className="i-mdi-close-circle text-lg" />
                          <Text>快速拒绝</Text>
                        </View>
                      </Button>

                      {/* 详细审批 */}
                      <Button
                        className="col-span-2 bg-blue-500 text-white py-3 rounded-xl break-keep text-sm font-semibold shadow-sm"
                        size="default"
                        onClick={() => openApprovalDialog(request, 'approve')}>
                        <View className="flex items-center justify-center gap-2">
                          <View className="i-mdi-comment-edit text-lg" />
                          <Text>详细审批（填写意见）</Text>
                        </View>
                      </Button>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>

      {/* 审批对话框 */}
      {showApprovalDialog && currentRequest && (
        <View className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <View className="bg-white rounded-2xl w-full max-w-md">
            {/* 对话框标题 */}
            <View className="p-6 border-b border-gray-100">
              <View className="flex items-center gap-3 mb-2">
                <View
                  className={`i-mdi-${approvalAction === 'approve' ? 'check-circle' : 'close-circle'} text-2xl ${approvalAction === 'approve' ? 'text-green-600' : 'text-red-600'}`}
                />
                <Text className="text-lg font-bold text-foreground">
                  {approvalAction === 'approve' ? '批准申请' : '拒绝申请'}
                </Text>
              </View>
              <Text className="text-sm text-muted-foreground">
                {currentRequest.employee.name} 的{getLeaveTypeConfig(currentRequest.leave_type)?.name}申请
              </Text>
            </View>

            {/* 对话框内容 */}
            <View className="p-6">
              {/* 审批意见输入 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2 block">审批意见</Text>
                <View className="bg-gray-50 rounded-xl border-2 border-gray-200 p-3">
                  <Textarea
                    className="w-full text-foreground"
                    style={{minHeight: '100px', background: 'transparent', border: 'none'}}
                    placeholder="请填写审批意见..."
                    value={approvalComment}
                    maxlength={200}
                    onInput={(e) => setApprovalComment(e.detail.value)}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">{approvalComment.length}/200</Text>
              </View>

              {/* 常用模板 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2 block">常用模板</Text>
                <View className="flex flex-wrap gap-2">
                  {(approvalAction === 'approve' ? APPROVAL_TEMPLATES.approve : APPROVAL_TEMPLATES.reject).map(
                    (template) => (
                      <View
                        key={template}
                        className="px-3 py-1.5 bg-blue-50 rounded-lg active:bg-blue-100"
                        onClick={() => handleUseTemplate(template)}>
                        <Text className="text-xs text-blue-600">{template}</Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            </View>

            {/* 对话框按钮 */}
            <View className="p-6 border-t border-gray-100 flex gap-3">
              <Button
                className="flex-1 bg-gray-200 text-foreground py-3 rounded-xl break-keep text-sm"
                size="default"
                onClick={() => setShowApprovalDialog(false)}>
                取消
              </Button>
              <Button
                className={`flex-1 ${approvalAction === 'approve' ? 'bg-green-500' : 'bg-red-500'} text-white py-3 rounded-xl break-keep text-sm font-semibold`}
                size="default"
                onClick={handleSubmitApproval}>
                确认{approvalAction === 'approve' ? '批准' : '拒绝'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
