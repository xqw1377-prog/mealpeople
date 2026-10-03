import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {approveOnboarding, getOnboardingById} from '@/db/api'
import type {EmployeeOnboarding} from '@/db/types'

const OnboardingDetail: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const {id} = router.params

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [onboarding, setOnboarding] = useState<EmployeeOnboarding | null>(null)
  const [comment, setComment] = useState('')
  const [showApprovalPanel, setShowApprovalPanel] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')

  // 加载申请详情
  const loadOnboarding = useCallback(async () => {
    if (!id) {
      Taro.showToast({title: '缺少申请ID', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const data = await getOnboardingById(id)
      if (data) {
        setOnboarding(data)
      } else {
        Taro.showToast({title: '申请不存在', icon: 'none'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('加载入职申请失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadOnboarding()
  }, [loadOnboarding])

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
    if (!onboarding) return
    if (!user) return

    if (!comment.trim()) {
      Taro.showToast({title: '请填写审批意见', icon: 'none'})
      return
    }

    setSubmitting(true)
    try {
      const approved = approvalAction === 'approve'
      const result = await approveOnboarding(onboarding.id, approved, user.id, comment)

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
  }, [onboarding, user, comment, approvalAction])

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

  if (loading) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!onboarding) {
    return (
      <View className="min-h-screen bg-background flex items-center justify-center">
        <Text className="text-muted-foreground">申请不存在</Text>
      </View>
    )
  }

  const statusDisplay = getStatusDisplay(onboarding.status)
  const canApprove = onboarding.status === 'pending'

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
                  onboarding.status === 'pending'
                    ? 'bg-yellow-100'
                    : onboarding.status === 'approved'
                      ? 'bg-green-100'
                      : onboarding.status === 'rejected'
                        ? 'bg-red-100'
                        : 'bg-blue-100'
                }`}>
                <Text className={`text-3xl ${statusDisplay.color}`}>
                  {onboarding.status === 'pending'
                    ? '⏳'
                    : onboarding.status === 'approved'
                      ? '✓'
                      : onboarding.status === 'rejected'
                        ? '✗'
                        : '✓'}
                </Text>
              </View>
            </View>
          </View>

          {/* 基本信息 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">基本信息</Text>

            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1">姓名</Text>
              <Text className="text-base text-foreground">{onboarding.name}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1">身份证号</Text>
              <Text className="text-base text-foreground">{onboarding.id_card || '-'}</Text>
            </View>

            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1">手机号</Text>
              <Text className="text-base text-foreground">{onboarding.phone}</Text>
            </View>

            {onboarding.email && (
              <View className="mb-0">
                <Text className="text-sm text-muted-foreground mb-1">邮箱</Text>
                <Text className="text-base text-foreground">{onboarding.email}</Text>
              </View>
            )}
          </View>

          {/* 紧急联系人 */}
          {(onboarding.emergency_contact_name || onboarding.emergency_contact_phone) && (
            <View className="bg-card rounded-lg p-4 mb-4">
              <Text className="text-lg font-semibold text-foreground mb-4">紧急联系人</Text>

              {onboarding.emergency_contact_name && (
                <View className="mb-3">
                  <Text className="text-sm text-muted-foreground mb-1">姓名</Text>
                  <Text className="text-base text-foreground">{onboarding.emergency_contact_name}</Text>
                </View>
              )}

              {onboarding.emergency_contact_phone && (
                <View className="mb-0">
                  <Text className="text-sm text-muted-foreground mb-1">电话</Text>
                  <Text className="text-base text-foreground">{onboarding.emergency_contact_phone}</Text>
                </View>
              )}
            </View>
          )}

          {/* 岗位信息 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-foreground mb-4">岗位信息</Text>

            {onboarding.position && (
              <View className="mb-3">
                <Text className="text-sm text-muted-foreground mb-1">应聘岗位</Text>
                <Text className="text-base text-foreground">{onboarding.position}</Text>
              </View>
            )}

            {onboarding.department && (
              <View className="mb-3">
                <Text className="text-sm text-muted-foreground mb-1">所属部门</Text>
                <Text className="text-base text-foreground">{onboarding.department}</Text>
              </View>
            )}

            {onboarding.expected_salary && (
              <View className="mb-3">
                <Text className="text-sm text-muted-foreground mb-1">期望薪资</Text>
                <Text className="text-base text-foreground">¥{onboarding.expected_salary}/月</Text>
              </View>
            )}

            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1">期望入职日期</Text>
              <Text className="text-base text-foreground">{onboarding.onboarding_date}</Text>
            </View>

            <View className="mb-0">
              <Text className="text-sm text-muted-foreground mb-1">试用期</Text>
              <Text className="text-base text-foreground">{onboarding.probation_months || 3}个月</Text>
            </View>
          </View>

          {/* 审批信息 */}
          {onboarding.approval_comment && (
            <View className="bg-card rounded-lg p-4 mb-4">
              <Text className="text-lg font-semibold text-foreground mb-4">审批意见</Text>
              <Text className="text-base text-foreground">{onboarding.approval_comment}</Text>
              {onboarding.approved_at && (
                <Text className="text-sm text-muted-foreground mt-2">
                  审批时间：{new Date(onboarding.approved_at).toLocaleString('zh-CN')}
                </Text>
              )}
            </View>
          )}

          {/* 申请时间 */}
          <View className="bg-muted rounded-lg p-4 mb-4">
            <Text className="text-sm text-muted-foreground">
              申请时间：{new Date(onboarding.created_at).toLocaleString('zh-CN')}
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

export default OnboardingDetail
