import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {approveResignation, getResignationById} from '@/db/api'
import type {EmployeeResignation} from '@/db/types'

const ResignationDetail: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const {id} = router.params

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resignation, setResignation] = useState<EmployeeResignation | null>(null)
  const [comment, setComment] = useState('')
  const [showApprovalPanel, setShowApprovalPanel] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')

  // 加载申请详情
  const loadResignation = useCallback(async () => {
    if (!id) {
      Taro.showToast({title: '缺少申请ID', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const data = await getResignationById(id)
      if (data) {
        setResignation(data)
      } else {
        Taro.showToast({title: '申请不存在', icon: 'none'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('加载离职申请失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadResignation()
  }, [loadResignation])

  // 显示审批面板
  const handleShowApproval = useCallback((action: 'approve' | 'reject') => {
    setApprovalAction(action)
    setComment('')
    setShowApprovalPanel(true)
  }, [])

  // 取消审批
  const handleCancelApproval = useCallback(() => {
    setShowApprovalPanel(false)
    setComment('')
  }, [])

  // 提交审批
  const handleSubmitApproval = useCallback(async () => {
    if (!resignation) return
    if (!user) return

    if (!comment.trim()) {
      Taro.showToast({title: '请填写审批意见', icon: 'none'})
      return
    }

    setSubmitting(true)
    try {
      const approved = approvalAction === 'approve'
      const result = await approveResignation(resignation.id, approved, user.id, comment)

      if (result) {
        Taro.showToast({
          title: approved ? '审批通过' : '已拒绝',
          icon: 'success',
          duration: 2000
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      } else {
        Taro.showToast({title: '操作失败', icon: 'none'})
      }
    } catch (error) {
      console.error('审批失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }, [resignation, user, comment, approvalAction])

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, {text: string; color: string}> = {
      pending: {text: '待审批', color: 'text-yellow-600'},
      approved: {text: '已通过', color: 'text-green-600'},
      rejected: {text: '已拒绝', color: 'text-red-600'},
      completed: {text: '已完成', color: 'text-blue-600'}
    }
    return statusMap[status] || {text: status, color: 'text-gray-600'}
  }

  // 获取离职类型显示
  const getTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      voluntary: '主动离职',
      involuntary: '被动离职',
      contract_end: '合同到期'
    }
    return typeMap[type] || type
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!resignation) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">申请不存在</Text>
      </View>
    )
  }

  const statusDisplay = getStatusDisplay(resignation.status)
  const canApprove = resignation.status === 'pending'

  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          {/* 状态卡片 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <View className="flex flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-muted-foreground mb-1">申请状态</Text>
                <Text className={`text-xl font-bold ${statusDisplay.color}`}>{statusDisplay.text}</Text>
              </View>
              <View
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  resignation.status === 'pending'
                    ? 'bg-yellow-100'
                    : resignation.status === 'approved'
                      ? 'bg-green-100'
                      : resignation.status === 'rejected'
                        ? 'bg-red-100'
                        : 'bg-blue-100'
                }`}>
                <Text className={`text-3xl ${statusDisplay.color}`}>
                  {resignation.status === 'pending'
                    ? '⏳'
                    : resignation.status === 'approved'
                      ? '✓'
                      : resignation.status === 'rejected'
                        ? '✗'
                        : '✓'}
                </Text>
              </View>
            </View>
          </View>

          {/* 员工信息 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">员工信息</Text>

            <View className="mb-0">
              <Text className="text-sm text-muted-foreground mb-1">员工工号</Text>
              <Text className="text-base text-foreground">{resignation.employee_id}</Text>
            </View>
          </View>

          {/* 离职信息 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">离职信息</Text>

            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1">离职类型</Text>
              <Text className="text-base text-foreground">{getTypeDisplay(resignation.resignation_type)}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1">离职原因</Text>
              <Text className="text-base text-foreground">{resignation.resignation_reason}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1">离职日期</Text>
              <Text className="text-base text-foreground">{resignation.resignation_date}</Text>
            </View>

            <View className="mb-0">
              <Text className="text-sm text-muted-foreground mb-1">最后工作日</Text>
              <Text className="text-base text-foreground">{resignation.last_working_day}</Text>
            </View>
          </View>

          {/* 审批信息 */}
          {resignation.approval_comment && (
            <View className="bg-card rounded-lg p-4 mb-4">
              <Text className="text-lg font-semibold text-foreground mb-4">审批意见</Text>
              <Text className="text-base text-foreground">{resignation.approval_comment}</Text>
              {resignation.approved_at && (
                <Text className="text-sm text-muted-foreground mt-2">
                  审批时间：{new Date(resignation.approved_at).toLocaleString('zh-CN')}
                </Text>
              )}
            </View>
          )}

          {/* 申请时间 */}
          <View className="bg-muted rounded-lg p-4 mb-4">
            <Text className="text-sm text-muted-foreground">
              申请时间：{new Date(resignation.created_at).toLocaleString('zh-CN')}
            </Text>
          </View>

          {/* 审批操作按钮 */}
          {canApprove && !showApprovalPanel && (
            <View className="flex flex-row gap-3 mb-8">
              <Button
                className="flex-1 bg-destructive text-destructive-foreground py-4 rounded break-keep text-base"
                size="default"
                onClick={() => handleShowApproval('reject')}>
                拒绝
              </Button>
              <Button
                className="flex-1 bg-primary text-primary-foreground py-4 rounded break-keep text-base"
                size="default"
                onClick={() => handleShowApproval('approve')}>
                通过
              </Button>
            </View>
          )}

          {/* 审批面板 */}
          {showApprovalPanel && (
            <View className="bg-card rounded-lg p-4 mb-8">
              <Text className="text-lg font-semibold text-foreground mb-4">
                {approvalAction === 'approve' ? '审批通过' : '拒绝申请'}
              </Text>

              <View className="mb-4">
                <Text className="text-sm text-foreground mb-2">审批意见 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    placeholder="请填写审批意见"
                    value={comment}
                    onInput={(e) => setComment(e.detail.value)}
                    style={{minHeight: '100px'}}
                    maxlength={500}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">已输入 {comment.length}/500 字</Text>
              </View>

              <View className="flex flex-row gap-3">
                <Button
                  className="flex-1 bg-muted text-foreground py-3 rounded break-keep text-base"
                  size="default"
                  onClick={handleCancelApproval}
                  disabled={submitting}>
                  取消
                </Button>
                <Button
                  className={`flex-1 py-3 rounded break-keep text-base ${
                    approvalAction === 'approve'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-destructive text-destructive-foreground'
                  }`}
                  size="default"
                  onClick={handleSubmitApproval}
                  loading={submitting}
                  disabled={submitting}>
                  {submitting ? '提交中...' : '确认'}
                </Button>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default ResignationDetail
