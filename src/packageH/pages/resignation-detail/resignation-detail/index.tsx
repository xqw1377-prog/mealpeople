/**
 * 离职详情页面
 * 显示离职申请的完整信息和审批流程
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {getResignationApplicationDetail, getResignationApprovals} from '@/db/api-resignation'
import type {ResignationApplication, ResignationApproval} from '@/db/types-resignation'
import {
  RESIGNATION_APPLICATION_STATUS_COLORS,
  RESIGNATION_APPLICATION_STATUS_NAMES,
  RESIGNATION_APPROVAL_STATUS_COLORS,
  RESIGNATION_APPROVAL_STATUS_NAMES,
  RESIGNATION_REASON_NAMES,
  RESIGNATION_TYPE_NAMES
} from '@/db/types-resignation'

export default function ResignationDetail() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const {id} = router.params

  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<ResignationApplication | null>(null)
  const [approvals, setApprovals] = useState<ResignationApproval[]>([])

  // 加载离职详情
  const loadData = useCallback(async () => {
    if (!id || !user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 加载离职申请详情
      const detail = await getResignationApplicationDetail(id)
      if (!detail || !detail.application) {
        throw new Error('未找到离职申请')
      }
      setApplication(detail.application)

      // 加载审批记录
      const approvalList = await getResignationApprovals(id)
      setApprovals(approvalList)
    } catch (error) {
      console.error('加载离职详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [id, user?.id])

  useDidShow(() => {
    loadData()
  })

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!application) {
    return (
      <View className="flex items-center justify-center h-screen">
        <View className="text-center">
          <View className="i-mdi-alert-circle text-5xl text-muted-foreground mb-4" />
          <Text className="text-base text-foreground block mb-2">未找到离职申请</Text>
          <Button className="mt-4 bg-blue-100 text-white px-6 py-2 rounded" size="default" onClick={handleBack}>
            返回
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground block mb-1">离职详情</Text>
            <Text className="text-sm text-muted-foreground">查看离职申请的完整信息</Text>
          </View>

          {/* 状态卡片 */}
          <View className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-center mb-4">
              <View
                className={`w-20 h-20 rounded-full flex items-center justify-center ${application.status === 'approved' ? 'bg-green-100' : application.status === 'rejected' ? 'bg-red-100' : 'bg-orange-100'}`}>
                <View
                  className={`text-4xl ${application.status === 'approved' ? 'i-mdi-check-circle text-muted-foreground' : application.status === 'rejected' ? 'i-mdi-close-circle text-red-600' : 'i-mdi-clock-outline text-muted-foreground'}`}
                />
              </View>
            </View>
            <View className="text-center">
              <Text className="text-xl font-bold text-foreground block mb-2">
                {RESIGNATION_APPLICATION_STATUS_NAMES[application.status]}
              </Text>
              <View
                className={`inline-block px-4 py-1 rounded-full ${RESIGNATION_APPLICATION_STATUS_COLORS[application.status] || 'bg-gray-50'}`}>
                <Text className="text-sm font-medium text-white">
                  {RESIGNATION_TYPE_NAMES[application.resignation_type]}
                </Text>
              </View>
            </View>
          </View>

          {/* 基本信息 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-base font-medium text-foreground block mb-3">基本信息</Text>
            <View className="space-y-3">
              <View className="flex items-start">
                <View className="i-mdi-account text-lg text-muted-foreground mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">员工ID</Text>
                  <Text className="text-sm text-foreground mt-1">{application.employee_id}</Text>
                </View>
              </View>

              <View className="flex items-start">
                <View className="i-mdi-tag text-lg text-muted-foreground mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">离职类型</Text>
                  <Text className="text-sm text-foreground mt-1">
                    {RESIGNATION_TYPE_NAMES[application.resignation_type]}
                  </Text>
                </View>
              </View>

              <View className="flex items-start">
                <View className="i-mdi-comment-question text-lg text-muted-foreground mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">离职原因</Text>
                  <Text className="text-sm text-foreground mt-1">
                    {RESIGNATION_REASON_NAMES[application.resignation_reason]}
                  </Text>
                </View>
              </View>

              <View className="flex items-start">
                <View className="i-mdi-calendar text-lg text-muted-foreground mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">期望离职日期</Text>
                  <Text className="text-sm text-foreground mt-1">{formatDate(application.expected_last_day)}</Text>
                </View>
              </View>

              <View className="flex items-start">
                <View className="i-mdi-clock text-lg text-muted-foreground mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground">提交时间</Text>
                  <Text className="text-sm text-foreground mt-1">{formatDateTime(application.submitted_at)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 离职说明 */}
          {application.notes && (
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <Text className="text-base font-medium text-foreground block mb-3">离职说明</Text>
              <View className="bg-muted rounded-lg p-3">
                <Text className="text-sm text-foreground leading-relaxed">{application.notes}</Text>
              </View>
            </View>
          )}

          {/* 审批流程 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-base font-medium text-foreground">审批流程</Text>
              <View className="i-mdi-timeline-text text-xl text-blue-600" />
            </View>

            {approvals.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-clipboard-check-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无审批记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {approvals.map((approval, index) => (
                  <View key={approval.id} className="relative">
                    {/* 时间线连接线 */}
                    {index < approvals.length - 1 && <View className="absolute left-4 top-10 w-0.5 h-full bg-border" />}

                    <View className="flex items-start">
                      {/* 状态图标 */}
                      <View
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 z-10 ${approval.status === 'approved' ? 'bg-green-100' : approval.status === 'rejected' ? 'bg-red-100' : 'bg-orange-100'}`}>
                        <View
                          className={`text-base ${approval.status === 'approved' ? 'i-mdi-check text-muted-foreground' : approval.status === 'rejected' ? 'i-mdi-close text-red-600' : 'i-mdi-clock text-muted-foreground'}`}
                        />
                      </View>

                      {/* 审批信息 */}
                      <View className="flex-1 bg-muted rounded-lg p-3">
                        <View className="flex items-center justify-between mb-2">
                          <Text className="text-sm font-medium text-foreground">审批人: {approval.approver_id}</Text>
                          <View
                            className={`px-2 py-0.5 rounded ${RESIGNATION_APPROVAL_STATUS_COLORS[approval.status] || 'bg-gray-50'}`}>
                            <Text className="text-xs font-medium text-white">
                              {RESIGNATION_APPROVAL_STATUS_NAMES[approval.status]}
                            </Text>
                          </View>
                        </View>

                        {approval.comments && (
                          <Text className="text-xs text-muted-foreground mb-2">{approval.comments}</Text>
                        )}

                        <Text className="text-xs text-muted-foreground">
                          {approval.approved_at ? formatDateTime(approval.approved_at) : '待审批'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 操作按钮 */}
          <View className="flex gap-3 mb-4">
            <Button
              className="flex-1 bg-muted text-foreground py-4 rounded break-keep text-base"
              size="default"
              onClick={handleBack}>
              返回
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
