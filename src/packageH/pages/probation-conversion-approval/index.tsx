/**
 * 试用期转正申请审批页面（HR端）
 *
 * 功能：
 * - 查看员工提交的转正申请列表
 * - 查看申请详情（自我评价、工作总结、未来规划）
 * - 审批转正申请（通过/拒绝）
 * - 填写审批意见
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {useTenantStore} from '@/store/tenant'

// 转正申请类型
interface ConversionApplication {
  id: string
  probation_id: string
  employee_id: string
  employee_name: string
  application_date: string
  self_evaluation: string
  work_summary: string
  future_plan: string
  status: 'pending' | 'approved' | 'rejected'
  review_notes?: string
  reviewed_at?: string
  created_at: string
  // 试用期信息
  probation_start_date?: string
  probation_end_date?: string
  probation_status?: string
}

export default function ProbationConversionApprovalPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<ConversionApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<ConversionApplication | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending')

  // 加载转正申请列表
  const loadApplications = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 查询转正申请，关联员工和试用期信息
      const {data, error} = await supabase
        .from('probation_conversion_applications')
        .select(
          `
          *,
          employee:employees!probation_conversion_applications_employee_id_fkey(name),
          probation:probation_periods!probation_conversion_applications_probation_id_fkey(start_date, end_date, status)
        `
        )
        .eq('tenant_id', currentTenant.id)
        .order('created_at', {ascending: false})

      if (error) throw error

      // 转换数据格式
      const formattedData: ConversionApplication[] = (data || []).map((item: any) => ({
        id: item.id,
        probation_id: item.probation_id,
        employee_id: item.employee_id,
        employee_name: item.employee?.name || '未知',
        application_date: item.application_date,
        self_evaluation: item.self_evaluation,
        work_summary: item.work_summary,
        future_plan: item.future_plan,
        status: item.status,
        review_notes: item.review_notes,
        reviewed_at: item.reviewed_at,
        created_at: item.created_at,
        probation_start_date: item.probation?.start_date,
        probation_end_date: item.probation?.end_date,
        probation_status: item.probation?.status
      }))

      setApplications(formattedData)
    } catch (error) {
      console.error('加载转正申请失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadApplications()
  })

  // 打开审批弹窗
  const handleOpenReview = (application: ConversionApplication) => {
    setSelectedApplication(application)
    setReviewNotes('')
    setShowReviewModal(true)
  }

  // 审批申请
  const handleReviewApplication = async (approved: boolean) => {
    if (!selectedApplication || !currentTenant) return

    if (!reviewNotes.trim()) {
      Taro.showToast({title: '请填写审批意见', icon: 'none'})
      return
    }

    try {
      Taro.showLoading({title: '处理中...'})

      // 更新申请状态
      const {error} = await supabase
        .from('probation_conversion_applications')
        .update({
          status: approved ? 'approved' : 'rejected',
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id)

      if (error) throw error

      // 如果通过，更新试用期状态
      if (approved) {
        const {error: probationError} = await supabase
          .from('probation_periods')
          .update({
            status: 'converted',
            conversion_date: new Date().toISOString().split('T')[0]
          })
          .eq('id', selectedApplication.probation_id)

        if (probationError) throw probationError
      }

      Taro.hideLoading()
      Taro.showToast({title: approved ? '已通过' : '已拒绝', icon: 'success'})

      // 关闭弹窗
      setShowReviewModal(false)
      setSelectedApplication(null)
      setReviewNotes('')

      // 重新加载数据
      loadApplications()
    } catch (error) {
      console.error('审批失败:', error)
      Taro.hideLoading()
      Taro.showToast({title: '审批失败', icon: 'none'})
    }
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审批'
      case 'approved':
        return '已通过'
      case 'rejected':
        return '已拒绝'
      default:
        return '未知'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // 过滤申请列表
  const filteredApplications = applications.filter((app) => {
    if (activeTab === 'pending') {
      return app.status === 'pending'
    } else {
      return app.status === 'approved' || app.status === 'rejected'
    }
  })

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">转正申请审批</Text>
            <Text className="text-sm opacity-90 block">审批员工提交的试用期转正申请</Text>
          </View>
          <View className="i-mdi-clipboard-check text-5xl opacity-20"></View>
        </View>

        {/* 统计信息 */}
        <View className="flex gap-4 mt-4">
          <View className="flex-1 bg-white bg-opacity-20 rounded-xl p-3">
            <Text className="text-xs opacity-80 block mb-1">待审批</Text>
            <Text className="text-2xl font-bold block">
              {applications.filter((app) => app.status === 'pending').length}
            </Text>
          </View>
          <View className="flex-1 bg-white bg-opacity-20 rounded-xl p-3">
            <Text className="text-xs opacity-80 block mb-1">已审批</Text>
            <Text className="text-2xl font-bold block">
              {applications.filter((app) => app.status !== 'pending').length}
            </Text>
          </View>
        </View>
      </View>

      {/* 标签页 */}
      <View className="px-4 mb-4">
        <View className="bg-white rounded-xl p-1 flex flex-row">
          <View
            className={`flex-1 py-2 rounded-lg text-center ${activeTab === 'pending' ? 'bg-blue-500' : 'bg-transparent'}`}
            onClick={() => setActiveTab('pending')}>
            <Text className={`text-sm font-medium ${activeTab === 'pending' ? 'text-white' : 'text-foreground'}`}>
              待审批
            </Text>
          </View>
          <View
            className={`flex-1 py-2 rounded-lg text-center ${activeTab === 'reviewed' ? 'bg-blue-500' : 'bg-transparent'}`}
            onClick={() => setActiveTab('reviewed')}>
            <Text className={`text-sm font-medium ${activeTab === 'reviewed' ? 'text-white' : 'text-foreground'}`}>
              已审批
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {filteredApplications.length === 0 ? (
            <View className="text-center py-12">
              <View className="i-mdi-clipboard-text-off text-6xl text-muted-foreground mb-4"></View>
              <Text className="text-muted-foreground text-base block">
                暂无{activeTab === 'pending' ? '待审批' : '已审批'}的申请
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {filteredApplications.map((application) => (
                <View key={application.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  {/* 申请头部 */}
                  <View className="flex items-center justify-between mb-4">
                    <View className="flex items-center">
                      <View className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <View className="i-mdi-account text-2xl text-blue-600"></View>
                      </View>
                      <View>
                        <Text className="text-base font-bold text-foreground block">{application.employee_name}</Text>
                        <Text className="text-xs text-muted-foreground block">
                          申请日期：{application.application_date}
                        </Text>
                      </View>
                    </View>
                    <View className={`px-3 py-1.5 rounded-full ${getStatusColor(application.status)}`}>
                      <Text className="text-xs font-medium">{getStatusText(application.status)}</Text>
                    </View>
                  </View>

                  {/* 试用期信息 */}
                  {application.probation_start_date && application.probation_end_date && (
                    <View className="bg-blue-50 rounded-xl p-3 mb-3">
                      <Text className="text-xs text-muted-foreground mb-2 block">试用期信息</Text>
                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-foreground">
                          {application.probation_start_date} ~ {application.probation_end_date}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 申请内容预览 */}
                  <View className="space-y-2 mb-4">
                    <View className="bg-gray-50 rounded-xl p-3">
                      <Text className="text-xs text-muted-foreground mb-1 block">自我评价</Text>
                      <Text className="text-sm text-foreground line-clamp-2">{application.self_evaluation}</Text>
                    </View>
                    <View className="bg-gray-50 rounded-xl p-3">
                      <Text className="text-xs text-muted-foreground mb-1 block">工作总结</Text>
                      <Text className="text-sm text-foreground line-clamp-2">{application.work_summary}</Text>
                    </View>
                  </View>

                  {/* 审批意见 */}
                  {application.review_notes && (
                    <View className="bg-yellow-50 rounded-xl p-3 mb-3">
                      <Text className="text-xs text-muted-foreground mb-1 block">审批意见</Text>
                      <Text className="text-sm text-foreground">{application.review_notes}</Text>
                      {application.reviewed_at && (
                        <Text className="text-xs text-muted-foreground mt-2 block">
                          审批时间：{new Date(application.reviewed_at).toLocaleString('zh-CN')}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* 操作按钮 */}
                  {application.status === 'pending' && (
                    <View className="flex gap-3">
                      <Button
                        className="flex-1 bg-blue-500 text-white py-3 rounded-xl break-keep text-base"
                        size="default"
                        onClick={() => handleOpenReview(application)}>
                        审批
                      </Button>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* 返回按钮 */}
          <View className="mt-6">
            <View
              onClick={handleBack}
              className="bg-white border-2 border-gray-200 rounded-xl py-3 px-6 flex items-center justify-center active:bg-gray-50">
              <View className="i-mdi-arrow-left text-xl text-foreground mr-2"></View>
              <Text className="text-foreground font-medium">返回</Text>
            </View>
          </View>

          {/* 底部间距 */}
          <View className="h-6"></View>
        </View>
      )}

      {/* 审批弹窗 */}
      {showReviewModal && selectedApplication && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <View className="bg-white rounded-2xl p-6 m-4 max-w-md w-full">
            <Text className="text-xl font-bold text-foreground mb-4 block">审批转正申请</Text>

            {/* 员工信息 */}
            <View className="bg-blue-50 rounded-xl p-3 mb-4">
              <Text className="text-sm text-foreground font-medium block mb-2">
                {selectedApplication.employee_name}
              </Text>
              <Text className="text-xs text-muted-foreground block">
                申请日期：{selectedApplication.application_date}
              </Text>
            </View>

            {/* 申请内容 */}
            <View className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              <View className="bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-muted-foreground mb-1 block">自我评价</Text>
                <Text className="text-sm text-foreground leading-relaxed">{selectedApplication.self_evaluation}</Text>
              </View>
              <View className="bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-muted-foreground mb-1 block">工作总结</Text>
                <Text className="text-sm text-foreground leading-relaxed">{selectedApplication.work_summary}</Text>
              </View>
              <View className="bg-gray-50 rounded-xl p-3">
                <Text className="text-xs text-muted-foreground mb-1 block">未来规划</Text>
                <Text className="text-sm text-foreground leading-relaxed">{selectedApplication.future_plan}</Text>
              </View>
            </View>

            {/* 审批意见 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground font-medium mb-2 block">
                审批意见 <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder="请填写审批意见..."
                  value={reviewNotes}
                  onInput={(e) => setReviewNotes(e.detail.value)}
                  maxlength={500}
                  style={{minHeight: '100px'}}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1 block">{reviewNotes.length}/500</Text>
            </View>

            {/* 操作按钮 */}
            <View className="flex gap-3">
              <Button
                className="flex-1 bg-gray-200 text-foreground py-3 rounded-xl break-keep text-base"
                size="default"
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedApplication(null)
                  setReviewNotes('')
                }}>
                取消
              </Button>
              <Button
                className="flex-1 bg-red-500 text-white py-3 rounded-xl break-keep text-base"
                size="default"
                onClick={() => handleReviewApplication(false)}>
                拒绝
              </Button>
              <Button
                className="flex-1 bg-green-500 text-white py-3 rounded-xl break-keep text-base"
                size="default"
                onClick={() => handleReviewApplication(true)}>
                通过
              </Button>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
