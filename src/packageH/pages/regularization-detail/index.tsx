import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {approveRegularization, getRegularizationsByTenant} from '@/db/api'
import type {RegularizationApplication} from '@/db/types'

const RegularizationDetail: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const {id} = router.params

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [regularization, setRegularization] = useState<RegularizationApplication | null>(null)
  const [comment, setComment] = useState('')
  const [showApprovalPanel, setShowApprovalPanel] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')

  // 加载申请详情
  const loadRegularization = useCallback(async () => {
    if (!id) {
      Taro.showToast({title: '缺少申请ID', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const tenantId = '00000000-0000-0000-0000-000000000001'
      const data = await getRegularizationsByTenant(tenantId)
      const found = data.find((item) => item.id === id)
      if (found) {
        setRegularization(found)
      } else {
        Taro.showToast({title: '申请不存在', icon: 'none'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('加载转正申请失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadRegularization()
  }, [loadRegularization])

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
    if (!regularization) return
    if (!user) return

    if (!comment.trim()) {
      Taro.showToast({title: '请填写审批意见', icon: 'none'})
      return
    }

    setSubmitting(true)
    try {
      const approved = approvalAction === 'approve'
      const result = await approveRegularization(regularization.id, approved, user.id, comment)

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
  }, [regularization, user, comment, approvalAction])

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, {text: string; color: string}> = {
      pending: {text: '待审批', color: 'text-yellow-600'},
      approved: {text: '已通过', color: 'text-green-600'},
      rejected: {text: '已拒绝', color: 'text-red-600'}
    }
    return statusMap[status] || {text: status, color: 'text-gray-600'}
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!regularization) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">申请不存在</Text>
      </View>
    )
  }

  const statusDisplay = getStatusDisplay(regularization.status)
  const canApprove = regularization.status === 'pending'

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
                  regularization.status === 'pending'
                    ? 'bg-yellow-100'
                    : regularization.status === 'approved'
                      ? 'bg-green-100'
                      : 'bg-red-100'
                }`}>
                <Text className={`text-3xl ${statusDisplay.color}`}>
                  {regularization.status === 'pending' ? '⏳' : regularization.status === 'approved' ? '✓' : '✗'}
                </Text>
              </View>
            </View>
          </View>

          {/* 员工信息 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">员工信息</Text>

            <View className="mb-0">
              <Text className="text-sm text-muted-foreground mb-1">员工工号</Text>
              <Text className="text-base text-foreground">{regularization.employee_id}</Text>
            </View>
          </View>

          {/* 自我评价 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <View className="i-mdi-account-star text-xl text-primary" />
              <Text className="text-lg font-semibold text-foreground">自我评价</Text>
            </View>
            <Text className="text-base text-foreground leading-relaxed">{regularization.self_evaluation}</Text>
          </View>

          {/* 工作成果 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <View className="i-mdi-trophy text-xl text-primary" />
              <Text className="text-lg font-semibold text-foreground">工作总结</Text>
            </View>
            <Text className="text-base text-foreground leading-relaxed">{regularization.work_summary || '暂无'}</Text>
          </View>

          {/* 审批信息 */}
          {regularization.approval_comment && (
            <View className="bg-card rounded-lg p-4 mb-4">
              <Text className="text-lg font-semibold text-foreground mb-4">审批意见</Text>
              <Text className="text-base text-foreground">{regularization.approval_comment}</Text>
              {regularization.approved_at && (
                <Text className="text-sm text-muted-foreground mt-2">
                  审批时间：{new Date(regularization.approved_at).toLocaleString('zh-CN')}
                </Text>
              )}
            </View>
          )}

          {/* 申请时间 */}
          <View className="bg-muted rounded-lg p-4 mb-4">
            <Text className="text-sm text-muted-foreground">
              申请时间：{new Date(regularization.created_at).toLocaleString('zh-CN')}
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

export default RegularizationDetail
