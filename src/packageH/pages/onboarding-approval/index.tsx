/**
 * 入职申请审批管理页面
 *
 * 功能：
 * - 查看所有入职申请
 * - 审批入职申请（通过/拒绝）
 * - 查看申请详情
 * - 按状态筛选申请
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import {useTenantStore} from '@/store/tenant'

// 入职申请类型
interface OnboardingApplication {
  id: string
  applicant_user_id: string
  name: string
  gender: string
  birth_date?: string
  phone: string
  email?: string
  id_card: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  education: string
  major?: string
  school?: string
  graduation_date?: string
  work_experience?: string
  skills?: string
  expected_position: string
  expected_department: string
  expected_salary?: string
  available_date: string
  self_introduction?: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  review_comment?: string
  created_at: string
}

export default function OnboardingApprovalPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<OnboardingApplication[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [_showReviewModal, setShowReviewModal] = useState(false)
  const [_selectedApplication, setSelectedApplication] = useState<OnboardingApplication | null>(null)
  const [reviewComment, setReviewComment] = useState('')

  // 加载申请列表
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

      // 获取入职申请列表
      const {data, error} = await supabase
        .from('onboarding_applications')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', {ascending: false})

      if (error) throw error

      setApplications(data || [])
    } catch (error) {
      console.error('加载申请列表失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useDidShow(() => {
    loadApplications()
  })

  // 显示审批弹窗
  const handleShowReview = (application: OnboardingApplication, action: 'approve' | 'reject') => {
    setSelectedApplication(application)
    setReviewComment('')
    setShowReviewModal(true)

    const actionText = action === 'approve' ? '通过' : '拒绝'
    Taro.showModal({
      title: `${actionText}申请`,
      content: `确定要${actionText}${application.name}的入职申请吗？`,
      success: async (res) => {
        if (res.confirm) {
          await handleReview(application, action)
        }
      }
    })
  }

  // 审批申请
  const handleReview = async (application: OnboardingApplication, action: 'approve' | 'reject') => {
    if (!user) return

    try {
      setLoading(true)

      const currentEmployee = await getEmployeeByUserId(user.id)
      const newStatus = action === 'approve' ? 'approved' : 'rejected'

      const {error} = await supabase
        .from('onboarding_applications')
        .update({
          status: newStatus,
          reviewed_by: currentEmployee?.name || '',
          reviewed_at: new Date().toISOString(),
          review_comment: reviewComment || null
        })
        .eq('id', application.id)

      if (error) throw error

      // 如果通过，创建员工记录
      if (action === 'approve') {
        const {error: empError} = await supabase.from('employees').insert({
          tenant_id: currentTenant?.id,
          user_id: application.applicant_user_id,
          name: application.name,
          gender: application.gender,
          birth_date: application.birth_date || null,
          phone: application.phone,
          email: application.email || null,
          id_card: application.id_card,
          address: application.address || null,
          emergency_contact_name: application.emergency_contact_name || null,
          emergency_contact_phone: application.emergency_contact_phone || null,
          education: application.education,
          major: application.major || null,
          school: application.school || null,
          graduation_date: application.graduation_date || null,
          position: application.expected_position,
          department: application.expected_department,
          hire_date: new Date().toISOString().split('T')[0],
          status: 'probation',
          probation_start_date: new Date().toISOString().split('T')[0],
          probation_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })

        if (empError) {
          console.error('创建员工记录失败:', empError)
          Taro.showToast({title: '审批成功，但创建员工记录失败', icon: 'none'})
        }
      }

      Taro.showToast({title: action === 'approve' ? '已通过' : '已拒绝', icon: 'success'})
      setShowReviewModal(false)
      setSelectedApplication(null)
      loadApplications()
    } catch (error) {
      console.error('审批失败:', error)
      Taro.showToast({title: '审批失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 查看申请详情
  const handleViewDetail = (application: OnboardingApplication) => {
    const genderText = application.gender === 'male' ? '男' : '女'
    const educationMap: Record<string, string> = {
      high_school: '高中',
      associate: '大专',
      bachelor: '本科',
      master: '硕士',
      doctor: '博士'
    }
    const educationText = educationMap[application.education] || application.education

    let content = `姓名：${application.name}\n性别：${genderText}\n手机：${application.phone}\n身份证：${application.id_card}\n\n教育背景：\n学历：${educationText}`

    if (application.major) content += `\n专业：${application.major}`
    if (application.school) content += `\n院校：${application.school}`

    content += `\n\n求职意向：\n期望职位：${application.expected_position}\n期望部门：${application.expected_department}`

    if (application.expected_salary) content += `\n期望薪资：${application.expected_salary}元/月`
    content += `\n可入职日期：${application.available_date}`

    if (application.work_experience) content += `\n\n工作经历：\n${application.work_experience}`
    if (application.skills) content += `\n\n专业技能：\n${application.skills}`
    if (application.self_introduction) content += `\n\n自我介绍：\n${application.self_introduction}`

    if (application.status !== 'pending') {
      const statusText = application.status === 'approved' ? '已通过' : '已拒绝'
      content += `\n\n审批状态：${statusText}\n审批人：${application.reviewed_by || '未知'}\n审批时间：${application.reviewed_at ? new Date(application.reviewed_at).toLocaleString('zh-CN') : '未知'}`
      if (application.review_comment) content += `\n审批意见：${application.review_comment}`
    }

    Taro.showModal({
      title: '申请详情',
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

  // 筛选申请列表
  const filteredApplications = applications.filter((app) => {
    if (filterStatus === 'all') return true
    return app.status === filterStatus
  })

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
      style={{background: 'linear-gradient(to bottom, #f0fdf4, #dcfce7)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">入职申请审批</Text>
            <Text className="text-sm opacity-90 block">审批员工入职申请</Text>
          </View>
          <View className="i-mdi-account-check text-5xl opacity-20"></View>
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

      {loading ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 筛选器 */}
          <View className="flex items-center gap-2 mb-4">
            <View
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-xl ${filterStatus === 'all' ? 'bg-green-500 text-white' : 'bg-white text-foreground'}`}>
              <Text className="text-sm font-medium">全部({statistics.total})</Text>
            </View>
            <View
              onClick={() => setFilterStatus('pending')}
              className={`px-4 py-2 rounded-xl ${filterStatus === 'pending' ? 'bg-yellow-500 text-white' : 'bg-white text-foreground'}`}>
              <Text className="text-sm font-medium">待审批({statistics.pending})</Text>
            </View>
            <View
              onClick={() => setFilterStatus('approved')}
              className={`px-4 py-2 rounded-xl ${filterStatus === 'approved' ? 'bg-green-600 text-white' : 'bg-white text-foreground'}`}>
              <Text className="text-sm font-medium">已通过({statistics.approved})</Text>
            </View>
            <View
              onClick={() => setFilterStatus('rejected')}
              className={`px-4 py-2 rounded-xl ${filterStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-white text-foreground'}`}>
              <Text className="text-sm font-medium">已拒绝({statistics.rejected})</Text>
            </View>
          </View>

          {/* 申请列表 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-3 block">共 {filteredApplications.length} 个申请</Text>
            {filteredApplications.map((application) => (
              <View key={application.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex items-center justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex items-center mb-2">
                      <View className="i-mdi-account-circle text-xl text-green-600 mr-2"></View>
                      <Text className="text-base font-bold text-foreground">{application.name}</Text>
                    </View>
                    <Text className="text-sm text-muted-foreground">{application.phone}</Text>
                  </View>

                  {/* 状态标签 */}
                  <View className={`px-3 py-1 rounded-full ${getStatusColor(application.status)}`}>
                    <Text className="text-xs font-medium">{getStatusText(application.status)}</Text>
                  </View>
                </View>

                {/* 申请信息 */}
                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm text-muted-foreground">期望职位</Text>
                    <Text className="text-sm text-foreground font-medium">{application.expected_position}</Text>
                  </View>
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm text-muted-foreground">期望部门</Text>
                    <Text className="text-sm text-foreground font-medium">{application.expected_department}</Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">可入职日期</Text>
                    <Text className="text-sm text-foreground font-medium">{application.available_date}</Text>
                  </View>
                </View>

                {/* 审批信息（已审批的申请） */}
                {application.status !== 'pending' && (
                  <View className="bg-blue-50 rounded-xl p-3 mb-3">
                    <View className="flex items-center justify-between mb-2">
                      <Text className="text-sm text-muted-foreground">审批人</Text>
                      <Text className="text-sm text-foreground font-medium">{application.reviewed_by || '未知'}</Text>
                    </View>
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">审批时间</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {application.reviewed_at ? new Date(application.reviewed_at).toLocaleString('zh-CN') : '未知'}
                      </Text>
                    </View>
                    {application.review_comment && (
                      <View className="mt-2 pt-2 border-t border-gray-200">
                        <Text className="text-sm text-muted-foreground mb-1">审批意见</Text>
                        <Text className="text-sm text-foreground">{application.review_comment}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 操作按钮 */}
                <View className="flex items-center gap-2">
                  {application.status === 'pending' && (
                    <>
                      <View
                        onClick={() => handleShowReview(application, 'approve')}
                        className="flex-1 bg-green-50 rounded-xl py-2 flex items-center justify-center active:bg-green-100">
                        <View className="i-mdi-check-circle text-lg text-green-600 mr-1"></View>
                        <Text className="text-sm text-green-600 font-medium">通过</Text>
                      </View>
                      <View
                        onClick={() => handleShowReview(application, 'reject')}
                        className="flex-1 bg-red-50 rounded-xl py-2 flex items-center justify-center active:bg-red-100">
                        <View className="i-mdi-close-circle text-lg text-red-600 mr-1"></View>
                        <Text className="text-sm text-red-600 font-medium">拒绝</Text>
                      </View>
                    </>
                  )}
                  <View
                    onClick={() => handleViewDetail(application)}
                    className="flex-1 bg-gray-50 rounded-xl py-2 flex items-center justify-center active:bg-gray-100">
                    <View className="i-mdi-eye text-lg text-gray-600 mr-1"></View>
                    <Text className="text-sm text-gray-600 font-medium">查看详情</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* 空状态 */}
          {filteredApplications.length === 0 && (
            <View className="text-center py-12">
              <View className="i-mdi-file-document-outline text-6xl text-muted-foreground mb-4"></View>
              <Text className="text-muted-foreground text-base block">暂无申请</Text>
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
    </ScrollView>
  )
}
