/**
 * HR端离职管理中心
 * 包含离职申请管理、审批管理、统计分析等功能
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {
  approveResignationApplication,
  getPendingResignationApprovals,
  getResignationStatistics,
  getTenantResignationApplications,
  rejectResignationApplication
} from '@/db/api-resignation'
import type {ResignationApplication, ResignationApproval, ResignationStatistics} from '@/db/types-resignation'
import {
  RESIGNATION_APPLICATION_STATUS_COLORS,
  RESIGNATION_APPLICATION_STATUS_NAMES,
  RESIGNATION_APPROVAL_STATUS_COLORS,
  RESIGNATION_APPROVAL_STATUS_NAMES,
  RESIGNATION_REASON_NAMES,
  RESIGNATION_TYPE_NAMES
} from '@/db/types-resignation'

export default function ResignationManagement() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<ResignationApplication[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<ResignationApproval[]>([])
  const [statistics, setStatistics] = useState<ResignationStatistics | null>(null)
  const [activeTab, setActiveTab] = useState<'applications' | 'approvals' | 'statistics'>('applications')
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState<ResignationApproval | null>(null)
  const [approvalComments, setApprovalComments] = useState('')
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 加载离职申请列表
      const applicationList = await getTenantResignationApplications(employee.tenant_id)
      setApplications(applicationList)

      // 加载待审批列表
      const pendingList = await getPendingResignationApprovals(employee.id)
      setPendingApprovals(pendingList)

      // 加载统计数据（最近一年）
      const endDate = new Date()
      const startDate = new Date()
      startDate.setFullYear(startDate.getFullYear() - 1)

      const stats = await getResignationStatistics(
        employee.tenant_id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      setStatistics(stats)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadData()
  })

  // 跳转到离职申请详情
  const handleApplicationDetail = (applicationId: string) => {
    Taro.navigateTo({
      url: `/pages/resignation-detail/index?id=${applicationId}`
    })
  }

  // 打开审批弹窗
  const handleOpenApproval = (approval: ResignationApproval, action: 'approve' | 'reject') => {
    setSelectedApproval(approval)
    setApprovalAction(action)
    setApprovalComments('')
    setShowApprovalModal(true)
  }

  // 提交审批
  const handleSubmitApproval = async () => {
    if (!selectedApproval) return

    // 如果是拒绝，必须填写原因
    if (approvalAction === 'reject' && !approvalComments.trim()) {
      Taro.showToast({
        title: '请填写拒绝原因',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      Taro.showLoading({title: '处理中...'})

      let success = false
      if (approvalAction === 'approve') {
        success = await approveResignationApplication(selectedApproval.id, approvalComments)
      } else {
        success = await rejectResignationApplication(selectedApproval.id, approvalComments)
      }

      Taro.hideLoading()

      if (success) {
        Taro.showToast({
          title: approvalAction === 'approve' ? '审批通过' : '已拒绝',
          icon: 'success',
          duration: 2000
        })
        setShowApprovalModal(false)
        setSelectedApproval(null)
        setApprovalComments('')
        // 重新加载数据
        loadData()
      } else {
        Taro.showToast({
          title: '操作失败',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('审批失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground block mb-1">离职管理中心</Text>
            <Text className="text-sm text-muted-foreground">管理离职申请、审批和统计</Text>
          </View>

          {/* 统计卡片 */}
          {statistics && (
            <View className="grid grid-cols-2 gap-3 mb-4">
              <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">离职申请总数</Text>
                  <View className="i-mdi-file-document text-xl text-blue-600" />
                </View>
                <Text className="text-2xl font-bold text-foreground">{statistics.total}</Text>
              </View>

              <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">待审批</Text>
                  <View className="i-mdi-clock-outline text-xl text-orange-500" />
                </View>
                <Text className="text-2xl font-bold text-foreground">{pendingApprovals.length}</Text>
              </View>

              <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">已批准</Text>
                  <View className="i-mdi-check-circle text-xl text-green-500" />
                </View>
                <Text className="text-2xl font-bold text-foreground">
                  {applications.filter((app) => app.status === 'approved').length}
                </Text>
              </View>

              <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">已完成</Text>
                  <View className="i-mdi-check-all text-xl text-blue-500" />
                </View>
                <Text className="text-2xl font-bold text-foreground">
                  {applications.filter((app) => app.status === 'completed').length}
                </Text>
              </View>
            </View>
          )}

          {/* 功能标签页 */}
          <View className="bg-white rounded-xl p-2 border-2 border-gray-200 mb-4 shadow-md">
            <View className="flex items-center gap-2">
              <View
                className={`flex-1 text-center py-2 rounded-lg ${activeTab === 'applications' ? 'bg-green-500' : 'bg-transparent'}`}
                onClick={() => setActiveTab('applications')}>
                <Text
                  className={`text-sm font-medium ${activeTab === 'applications' ? 'text-white' : 'text-muted-foreground'}`}>
                  离职申请
                </Text>
              </View>
              <View
                className={`flex-1 text-center py-2 rounded-lg ${activeTab === 'approvals' ? 'bg-blue-100' : 'bg-transparent'}`}
                onClick={() => setActiveTab('approvals')}>
                <Text
                  className={`text-sm font-medium ${activeTab === 'approvals' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  审批管理
                </Text>
              </View>
              <View
                className={`flex-1 text-center py-2 rounded-lg ${activeTab === 'statistics' ? 'bg-blue-100' : 'bg-transparent'}`}
                onClick={() => setActiveTab('statistics')}>
                <Text
                  className={`text-sm font-medium ${activeTab === 'statistics' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  统计分析
                </Text>
              </View>
            </View>
          </View>

          {/* 离职申请列表 */}
          {activeTab === 'applications' && (
            <View>
              {loading ? (
                <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
                  <Text className="text-muted-foreground">加载中...</Text>
                </View>
              ) : applications.length === 0 ? (
                <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
                  <View className="i-mdi-file-document-off text-5xl text-muted-foreground mb-4 mx-auto" />
                  <Text className="text-base text-foreground block mb-2">暂无离职申请</Text>
                  <Text className="text-sm text-muted-foreground">当前没有员工提交离职申请</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {applications.map((application) => (
                    <View
                      key={application.id}
                      className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md"
                      onClick={() => handleApplicationDetail(application.id)}>
                      {/* 申请状态和类型 */}
                      <View className="flex items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-base font-medium text-foreground block mb-1">
                            {RESIGNATION_TYPE_NAMES[application.resignation_type]}
                          </Text>
                          <Text className="text-sm text-muted-foreground">
                            {RESIGNATION_REASON_NAMES[application.resignation_reason]}
                          </Text>
                        </View>
                        <View
                          className={`px-3 py-1 rounded-full ${RESIGNATION_APPLICATION_STATUS_COLORS[application.status] || 'bg-gray-50'}`}>
                          <Text className="text-xs font-medium text-white">
                            {RESIGNATION_APPLICATION_STATUS_NAMES[application.status]}
                          </Text>
                        </View>
                      </View>

                      {/* 申请详情 */}
                      <View className="space-y-2">
                        <View className="flex items-center">
                          <View className="i-mdi-account text-base text-muted-foreground mr-2" />
                          <Text className="text-sm text-muted-foreground">员工ID: {application.employee_id}</Text>
                        </View>
                        <View className="flex items-center">
                          <View className="i-mdi-calendar text-base text-muted-foreground mr-2" />
                          <Text className="text-sm text-muted-foreground">
                            期望离职日期: {formatDate(application.expected_last_day)}
                          </Text>
                        </View>
                        <View className="flex items-center">
                          <View className="i-mdi-clock text-base text-muted-foreground mr-2" />
                          <Text className="text-sm text-muted-foreground">
                            提交时间: {formatDate(application.submitted_at)}
                          </Text>
                        </View>
                      </View>

                      {/* 查看详情箭头 */}
                      <View className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 审批管理 */}
          {activeTab === 'approvals' && (
            <View>
              {loading ? (
                <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
                  <Text className="text-muted-foreground">加载中...</Text>
                </View>
              ) : pendingApprovals.length === 0 ? (
                <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
                  <View className="i-mdi-clipboard-check text-5xl text-muted-foreground mb-4 mx-auto" />
                  <Text className="text-base text-foreground block mb-2">暂无待审批</Text>
                  <Text className="text-sm text-muted-foreground">当前没有需要您审批的离职申请</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {pendingApprovals.map((approval) => (
                    <View key={approval.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
                      {/* 审批状态 */}
                      <View className="flex items-start justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-base font-medium text-foreground block mb-1">
                            离职申请审批 - 第{approval.approval_level}级
                          </Text>
                          <Text className="text-sm text-muted-foreground">申请ID: {approval.application_id}</Text>
                        </View>
                        <View
                          className={`px-3 py-1 rounded-full ${RESIGNATION_APPROVAL_STATUS_COLORS[approval.status] || 'bg-gray-50'}`}>
                          <Text className="text-xs font-medium text-white">
                            {RESIGNATION_APPROVAL_STATUS_NAMES[approval.status]}
                          </Text>
                        </View>
                      </View>

                      {/* 审批详情 */}
                      <View className="space-y-2 mb-4">
                        <View className="flex items-center">
                          <View className="i-mdi-account text-base text-muted-foreground mr-2" />
                          <Text className="text-sm text-muted-foreground">审批人ID: {approval.approver_id}</Text>
                        </View>
                        <View className="flex items-center">
                          <View className="i-mdi-clock text-base text-muted-foreground mr-2" />
                          <Text className="text-sm text-muted-foreground">
                            创建时间: {formatDate(approval.created_at)}
                          </Text>
                        </View>
                      </View>

                      {/* 审批操作按钮 */}
                      {approval.status === 'pending' && (
                        <View className="flex items-center gap-2">
                          <Button
                            className="flex-1 bg-blue-100 text-white py-2 rounded-lg break-keep text-sm"
                            size="default"
                            onClick={() => handleOpenApproval(approval, 'approve')}>
                            通过
                          </Button>
                          <Button
                            className="flex-1 bg-blue-100 text-white py-2 rounded-lg break-keep text-sm"
                            size="default"
                            onClick={() => handleOpenApproval(approval, 'reject')}>
                            拒绝
                          </Button>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 统计分析 */}
          {activeTab === 'statistics' && statistics && (
            <View>
              {/* 离职原因分布 */}
              <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-md">
                <Text className="text-base font-medium text-foreground block mb-3">离职原因分布</Text>
                <View className="space-y-2">
                  {Object.entries(statistics.by_reason).map(([reason, count]) => (
                    <View key={reason} className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">{RESIGNATION_REASON_NAMES[reason]}</Text>
                      <Text className="text-sm font-medium text-foreground">{count}人</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 离职类型分布 */}
              <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-md">
                <Text className="text-base font-medium text-foreground block mb-3">离职类型分布</Text>
                <View className="space-y-2">
                  {Object.entries(statistics.by_type).map(([type, count]) => (
                    <View key={type} className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">{RESIGNATION_TYPE_NAMES[type]}</Text>
                      <Text className="text-sm font-medium text-foreground">{count}人</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 月度趋势 */}
              <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
                <Text className="text-base font-medium text-foreground block mb-3">月度离职趋势</Text>
                <View className="space-y-2">
                  {Object.entries(statistics.by_month).map(([month, count]) => (
                    <View key={month} className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">{month}</Text>
                      <Text className="text-sm font-medium text-foreground">{count}人</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 离职率 */}
              <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mt-4 shadow-md">
                <Text className="text-base font-medium text-foreground block mb-3">离职率</Text>
                <View className="text-center">
                  <Text className="text-4xl font-bold text-blue-600">{statistics.turnover_rate.toFixed(1)}%</Text>
                  <Text className="text-sm text-muted-foreground mt-2">年度离职率</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 审批弹窗 */}
      {showApprovalModal && selectedApproval && (
        <View className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <View className="bg-white rounded-xl p-6 border-2 border-gray-200 mx-4 w-full max-w-md">
            <Text className="text-xl font-bold text-foreground mb-4">
              {approvalAction === 'approve' ? '审批通过' : '拒绝申请'}
            </Text>

            {/* 审批意见 */}
            <View className="mb-4">
              <Text className="text-sm text-muted-foreground mb-2">
                {approvalAction === 'approve' ? '审批意见（可选）' : '拒绝原因（必填）'}
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder={approvalAction === 'approve' ? '请输入审批意见' : '请输入拒绝原因'}
                  value={approvalComments}
                  onInput={(e) => setApprovalComments(e.detail.value)}
                  maxlength={500}
                />
              </View>
            </View>

            {/* 操作按钮 */}
            <View className="flex items-center gap-2">
              <Button
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg break-keep text-base"
                size="default"
                onClick={() => {
                  setShowApprovalModal(false)
                  setSelectedApproval(null)
                  setApprovalComments('')
                }}>
                取消
              </Button>
              <Button
                className={`flex-1 py-3 rounded-lg break-keep text-base ${approvalAction === 'approve' ? 'bg-blue-100 text-white' : 'bg-blue-100 text-white'}`}
                size="default"
                onClick={handleSubmitApproval}>
                确认{approvalAction === 'approve' ? '通过' : '拒绝'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
