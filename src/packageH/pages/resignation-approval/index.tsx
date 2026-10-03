/**
 * 离职申请审批页面
 *
 * 功能：
 * - 查看所有离职申请
 * - 审批离职申请（通过/拒绝）
 * - 查看申请详情
 * - 筛选申请状态
 * - 批量审批
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import {useTenantStore} from '@/store/tenant'

// 离职申请类型
interface ResignationApplication {
  id: string
  employee_id: string
  employee_name: string
  department: string
  position: string
  reason: string
  expected_date: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewer_comment?: string
}

export default function ResignationApprovalPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<ResignationApplication[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [selectedApp, setSelectedApp] = useState<ResignationApplication | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved')

  // 加载离职申请
  const loadApplications = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 检查权限
      const currentEmployee = await getEmployeeByUserId(user?.id)
      if (!currentEmployee) {
        Taro.showToast({title: '无权限访问', icon: 'none'})
        setLoading(false)
        return
      }

      // 构建查询
      let query = supabase.from('resignation_applications').select('*').eq('tenant_id', currentTenant.id)

      // 根据筛选条件查询
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const {data, error} = await query.order('created_at', {ascending: false})

      if (error) throw error

      setApplications(data || [])
    } catch (error) {
      console.error('加载离职申请失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user, filterStatus])

  useDidShow(() => {
    loadApplications()
  })

  // 显示审批弹窗
  const handleShowReview = (app: ResignationApplication, action: 'approved' | 'rejected') => {
    setSelectedApp(app)
    setReviewAction(action)
    setReviewComment('')
    setShowReviewModal(true)
  }

  // 提交审批
  const handleSubmitReview = async () => {
    if (!selectedApp || !currentTenant) return

    // 验证审批意见
    if (!reviewComment.trim()) {
      Taro.showToast({title: '请输入审批意见', icon: 'none'})
      return
    }

    try {
      setLoading(true)

      const {error} = await supabase
        .from('resignation_applications')
        .update({
          status: reviewAction,
          reviewed_at: new Date().toISOString(),
          reviewer_comment: reviewComment
        })
        .eq('id', selectedApp.id)

      if (error) throw error

      Taro.showToast({
        title: reviewAction === 'approved' ? '已通过申请' : '已拒绝申请',
        icon: 'success'
      })

      setShowReviewModal(false)
      loadApplications()
    } catch (error) {
      console.error('审批失败:', error)
      Taro.showToast({title: '审批失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 查看申请详情
  const handleViewDetail = (app: ResignationApplication) => {
    const statusText = app.status === 'pending' ? '待审批' : app.status === 'approved' ? '已通过' : '已拒绝'

    const content = `员工：${app.employee_name}\n部门：${app.department}\n职位：${app.position}\n\n离职原因：\n${app.reason}\n\n期望离职日期：${app.expected_date}\n\n申请状态：${statusText}\n申请时间：${new Date(app.created_at).toLocaleString('zh-CN')}`

    Taro.showModal({
      title: '离职申请详情',
      content,
      showCancel: false
    })
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

  // 统计数据
  const statistics = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #fef2f2, #fee2e2)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">离职申请审批</Text>
            <Text className="text-sm opacity-90 block">审批员工离职申请</Text>
          </View>
          <View className="i-mdi-file-document-check text-5xl opacity-20"></View>
        </View>

        {/* 统计卡片 */}
        <View className="bg-white bg-opacity-20 rounded-xl p-4">
          <View className="grid grid-cols-4 gap-2">
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.total}</Text>
              <Text className="text-xs opacity-90 block">总申请</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.pending}</Text>
              <Text className="text-xs opacity-90 block">待审批</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.approved}</Text>
              <Text className="text-xs opacity-90 block">已通过</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.rejected}</Text>
              <Text className="text-xs opacity-90 block">已拒绝</Text>
            </View>
          </View>
        </View>
      </View>

      {loading && !showReviewModal ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 审批弹窗 */}
          {showReviewModal && selectedApp ? (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <Text className="text-lg font-bold text-foreground mb-4 block">
                {reviewAction === 'approved' ? '通过申请' : '拒绝申请'}
              </Text>

              {/* 申请信息 */}
              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <View className="mb-2">
                  <Text className="text-sm text-muted-foreground">员工姓名</Text>
                  <Text className="text-base text-foreground font-medium">{selectedApp.employee_name}</Text>
                </View>
                <View className="mb-2">
                  <Text className="text-sm text-muted-foreground">部门职位</Text>
                  <Text className="text-base text-foreground font-medium">
                    {selectedApp.department} - {selectedApp.position}
                  </Text>
                </View>
                <View>
                  <Text className="text-sm text-muted-foreground">期望离职日期</Text>
                  <Text className="text-base text-foreground font-medium">{selectedApp.expected_date}</Text>
                </View>
              </View>

              {/* 审批意见 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">审批意见 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    value={reviewComment}
                    onInput={(e) => setReviewComment(e.detail.value)}
                    placeholder={
                      reviewAction === 'approved' ? '请输入通过意见（如：同意离职申请，祝工作顺利）' : '请输入拒绝原因'
                    }
                    style={{minHeight: '100px'}}
                  />
                </View>
              </View>

              {/* 操作按钮 */}
              <View className="flex items-center gap-3">
                <Button
                  className="flex-1 bg-white border-2 border-gray-200 text-foreground py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={() => setShowReviewModal(false)}>
                  取消
                </Button>
                <Button
                  className={`flex-1 ${reviewAction === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'} text-white py-3 rounded-xl break-keep text-base`}
                  size="default"
                  onClick={handleSubmitReview}>
                  确认{reviewAction === 'approved' ? '通过' : '拒绝'}
                </Button>
              </View>
            </View>
          ) : (
            <>
              {/* 筛选按钮 */}
              <View className="flex items-center gap-2 mb-4">
                <View
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 rounded-xl py-2 px-3 text-center ${filterStatus === 'all' ? 'bg-red-500 text-white' : 'bg-white text-foreground'} active:scale-95 transition-all`}>
                  <Text className="text-sm font-medium">全部</Text>
                </View>
                <View
                  onClick={() => setFilterStatus('pending')}
                  className={`flex-1 rounded-xl py-2 px-3 text-center ${filterStatus === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-foreground'} active:scale-95 transition-all`}>
                  <Text className="text-sm font-medium">待审批</Text>
                </View>
                <View
                  onClick={() => setFilterStatus('approved')}
                  className={`flex-1 rounded-xl py-2 px-3 text-center ${filterStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-white text-foreground'} active:scale-95 transition-all`}>
                  <Text className="text-sm font-medium">已通过</Text>
                </View>
                <View
                  onClick={() => setFilterStatus('rejected')}
                  className={`flex-1 rounded-xl py-2 px-3 text-center ${filterStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-white text-foreground'} active:scale-95 transition-all`}>
                  <Text className="text-sm font-medium">已拒绝</Text>
                </View>
              </View>

              {/* 申请列表 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-3 block">共 {applications.length} 个申请</Text>
                {applications.map((app) => (
                  <View key={app.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex items-center flex-1">
                        {/* 头像 */}
                        <View className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-400 rounded-full flex items-center justify-center mr-3">
                          <Text className="text-white text-lg font-bold">{app.employee_name?.charAt(0) || 'U'}</Text>
                        </View>

                        {/* 员工信息 */}
                        <View className="flex-1">
                          <Text className="text-base font-bold text-foreground mb-1 block">
                            {app.employee_name || '未命名'}
                          </Text>
                          <View className="flex items-center">
                            <View className="i-mdi-office-building text-sm text-muted-foreground mr-1"></View>
                            <Text className="text-sm text-muted-foreground mr-3">{app.department || '未分配'}</Text>
                            <View className="i-mdi-briefcase text-sm text-muted-foreground mr-1"></View>
                            <Text className="text-sm text-muted-foreground">{app.position || '未分配'}</Text>
                          </View>
                        </View>
                      </View>

                      {/* 状态标签 */}
                      <View className={`px-3 py-1 rounded-full ${getStatusColor(app.status)}`}>
                        <Text className="text-xs font-medium">{getStatusText(app.status)}</Text>
                      </View>
                    </View>

                    {/* 申请信息 */}
                    <View className="bg-gray-50 rounded-xl p-3 mb-3">
                      <View className="flex items-center justify-between mb-2">
                        <Text className="text-sm text-muted-foreground">期望离职日期</Text>
                        <Text className="text-sm text-foreground font-medium">{app.expected_date}</Text>
                      </View>
                      <View className="mb-2">
                        <Text className="text-sm text-muted-foreground mb-1">离职原因</Text>
                        <Text className="text-sm text-foreground">{app.reason}</Text>
                      </View>
                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-muted-foreground">申请时间</Text>
                        <Text className="text-sm text-foreground">
                          {new Date(app.created_at).toLocaleDateString('zh-CN')}
                        </Text>
                      </View>
                    </View>

                    {/* 操作按钮 */}
                    {app.status === 'pending' ? (
                      <View className="flex items-center gap-2">
                        <View
                          onClick={() => handleShowReview(app, 'approved')}
                          className="flex-1 bg-green-50 rounded-xl py-2 flex items-center justify-center active:bg-green-100">
                          <View className="i-mdi-check-circle text-lg text-green-600 mr-1"></View>
                          <Text className="text-sm text-green-600 font-medium">通过</Text>
                        </View>
                        <View
                          onClick={() => handleShowReview(app, 'rejected')}
                          className="flex-1 bg-red-50 rounded-xl py-2 flex items-center justify-center active:bg-red-100">
                          <View className="i-mdi-close-circle text-lg text-red-600 mr-1"></View>
                          <Text className="text-sm text-red-600 font-medium">拒绝</Text>
                        </View>
                        <View
                          onClick={() => handleViewDetail(app)}
                          className="flex-1 bg-blue-50 rounded-xl py-2 flex items-center justify-center active:bg-blue-100">
                          <View className="i-mdi-eye text-lg text-blue-600 mr-1"></View>
                          <Text className="text-sm text-blue-600 font-medium">详情</Text>
                        </View>
                      </View>
                    ) : (
                      <View className="flex items-center gap-2">
                        <View
                          onClick={() => handleViewDetail(app)}
                          className="flex-1 bg-blue-50 rounded-xl py-2 flex items-center justify-center active:bg-blue-100">
                          <View className="i-mdi-eye text-lg text-blue-600 mr-1"></View>
                          <Text className="text-sm text-blue-600 font-medium">查看详情</Text>
                        </View>
                        {app.reviewer_comment && (
                          <View
                            onClick={() =>
                              Taro.showModal({
                                title: '审批意见',
                                content: app.reviewer_comment,
                                showCancel: false
                              })
                            }
                            className="flex-1 bg-gray-50 rounded-xl py-2 flex items-center justify-center active:bg-gray-100">
                            <View className="i-mdi-comment-text text-lg text-gray-600 mr-1"></View>
                            <Text className="text-sm text-gray-600 font-medium">审批意见</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* 空状态 */}
              {applications.length === 0 && (
                <View className="text-center py-12">
                  <View className="i-mdi-file-document-remove text-6xl text-muted-foreground mb-4"></View>
                  <Text className="text-muted-foreground text-base block">暂无离职申请</Text>
                  <Text className="text-muted-foreground text-sm block mt-2">当前没有需要审批的离职申请</Text>
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
            </>
          )}

          {/* 底部间距 */}
          <View className="h-6"></View>
        </View>
      )}
    </ScrollView>
  )
}
