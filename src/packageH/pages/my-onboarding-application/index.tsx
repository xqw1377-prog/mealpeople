/**
 * 我的入职申请页面（员工端）
 *
 * 功能：
 * - 查看自己的入职申请状态
 * - 查看申请详情
 * - 查看审批意见
 * - 提交新的入职申请
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {useTenantStore} from '@/store/tenant'

// 入职申请类型
interface OnboardingApplication {
  id: string
  name: string
  gender: string
  birth_date: string
  phone: string
  email?: string
  id_card?: string
  address?: string
  education: string
  school?: string
  major?: string
  graduation_date?: string
  work_experience?: string
  desired_position: string
  desired_department: string
  expected_salary?: string
  available_date: string
  status: 'pending' | 'approved' | 'rejected'
  review_notes?: string
  reviewed_at?: string
  created_at: string
}

export default function MyOnboardingApplicationPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState<OnboardingApplication | null>(null)

  // 加载我的入职申请
  const loadMyApplication = useCallback(async () => {
    if (!currentTenant || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 获取我的入职申请
      const {data, error} = await supabase
        .from('onboarding_applications')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('user_id', user.id)
        .order('created_at', {ascending: false})
        .maybeSingle()

      if (error) throw error

      setApplication(data)
    } catch (error) {
      console.error('加载入职申请失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useDidShow(() => {
    loadMyApplication()
  })

  // 提交新申请
  const handleNewApplication = () => {
    if (application && application.status === 'pending') {
      Taro.showToast({
        title: '您已有待审批的申请',
        icon: 'none'
      })
      return
    }

    Taro.navigateTo({url: '/packageH/pages/onboarding-application/index'})
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

  // 获取性别文本
  const getGenderText = (gender: string) => {
    return gender === 'male' ? '男' : '女'
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #eff6ff, #dbeafe)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">我的入职申请</Text>
            <Text className="text-sm opacity-90 block">查看申请状态</Text>
          </View>
          <View className="i-mdi-file-document-edit text-5xl opacity-20"></View>
        </View>
      </View>

      {loading ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {application ? (
            <View>
              {/* 申请状态卡片 */}
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <View className="flex items-center justify-between mb-4">
                  <Text className="text-lg font-bold text-foreground">申请状态</Text>
                  <View className={`px-4 py-1.5 rounded-full ${getStatusColor(application.status)}`}>
                    <Text className="text-sm font-medium">{getStatusText(application.status)}</Text>
                  </View>
                </View>

                {/* 申请时间 */}
                <View className="bg-blue-50 rounded-xl p-3 mb-3">
                  <View className="flex items-center justify-between">
                    <Text className="text-sm text-muted-foreground">申请时间</Text>
                    <Text className="text-sm text-foreground font-medium">
                      {new Date(application.created_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                </View>

                {/* 审批时间 */}
                {application.reviewed_at && (
                  <View className="bg-green-50 rounded-xl p-3 mb-3">
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">审批时间</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {new Date(application.reviewed_at).toLocaleString('zh-CN')}
                      </Text>
                    </View>
                  </View>
                )}

                {/* 审批意见 */}
                {application.review_notes && (
                  <View className="bg-yellow-50 rounded-xl p-3">
                    <Text className="text-sm text-muted-foreground mb-2 block">审批意见</Text>
                    <Text className="text-sm text-foreground">{application.review_notes}</Text>
                  </View>
                )}
              </View>

              {/* 基本信息 */}
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <Text className="text-lg font-bold text-foreground mb-4 block">基本信息</Text>

                <View className="space-y-3">
                  <View className="flex items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-muted-foreground">姓名</Text>
                    <Text className="text-sm text-foreground font-medium">{application.name}</Text>
                  </View>

                  <View className="flex items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-muted-foreground">性别</Text>
                    <Text className="text-sm text-foreground font-medium">{getGenderText(application.gender)}</Text>
                  </View>

                  <View className="flex items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-muted-foreground">出生日期</Text>
                    <Text className="text-sm text-foreground font-medium">{application.birth_date}</Text>
                  </View>

                  <View className="flex items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-muted-foreground">手机号</Text>
                    <Text className="text-sm text-foreground font-medium">{application.phone}</Text>
                  </View>

                  {application.email && (
                    <View className="flex items-center justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-muted-foreground">邮箱</Text>
                      <Text className="text-sm text-foreground font-medium">{application.email}</Text>
                    </View>
                  )}

                  {application.id_card && (
                    <View className="flex items-center justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-muted-foreground">身份证号</Text>
                      <Text className="text-sm text-foreground font-medium">{application.id_card}</Text>
                    </View>
                  )}

                  {application.address && (
                    <View className="flex items-center justify-between py-2">
                      <Text className="text-sm text-muted-foreground">地址</Text>
                      <Text className="text-sm text-foreground font-medium">{application.address}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 教育背景 */}
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <Text className="text-lg font-bold text-foreground mb-4 block">教育背景</Text>

                <View className="space-y-3">
                  <View className="flex items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-muted-foreground">学历</Text>
                    <Text className="text-sm text-foreground font-medium">{application.education}</Text>
                  </View>

                  {application.school && (
                    <View className="flex items-center justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-muted-foreground">毕业院校</Text>
                      <Text className="text-sm text-foreground font-medium">{application.school}</Text>
                    </View>
                  )}

                  {application.major && (
                    <View className="flex items-center justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-muted-foreground">专业</Text>
                      <Text className="text-sm text-foreground font-medium">{application.major}</Text>
                    </View>
                  )}

                  {application.graduation_date && (
                    <View className="flex items-center justify-between py-2">
                      <Text className="text-sm text-muted-foreground">毕业时间</Text>
                      <Text className="text-sm text-foreground font-medium">{application.graduation_date}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 工作经历 */}
              {application.work_experience && (
                <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                  <Text className="text-lg font-bold text-foreground mb-4 block">工作经历</Text>
                  <Text className="text-sm text-foreground leading-relaxed">{application.work_experience}</Text>
                </View>
              )}

              {/* 求职意向 */}
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <Text className="text-lg font-bold text-foreground mb-4 block">求职意向</Text>

                <View className="space-y-3">
                  <View className="flex items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-muted-foreground">期望职位</Text>
                    <Text className="text-sm text-foreground font-medium">{application.desired_position}</Text>
                  </View>

                  <View className="flex items-center justify-between py-2 border-b border-gray-100">
                    <Text className="text-sm text-muted-foreground">期望部门</Text>
                    <Text className="text-sm text-foreground font-medium">{application.desired_department}</Text>
                  </View>

                  {application.expected_salary && (
                    <View className="flex items-center justify-between py-2 border-b border-gray-100">
                      <Text className="text-sm text-muted-foreground">期望薪资</Text>
                      <Text className="text-sm text-foreground font-medium">{application.expected_salary}</Text>
                    </View>
                  )}

                  <View className="flex items-center justify-between py-2">
                    <Text className="text-sm text-muted-foreground">可到岗日期</Text>
                    <Text className="text-sm text-foreground font-medium">{application.available_date}</Text>
                  </View>
                </View>
              </View>

              {/* 操作按钮 */}
              {application.status === 'rejected' && (
                <View className="mb-4">
                  <Button
                    className="w-full bg-blue-500 text-white py-3 rounded-xl break-keep text-base"
                    size="default"
                    onClick={handleNewApplication}>
                    重新提交申请
                  </Button>
                </View>
              )}
            </View>
          ) : (
            <View>
              {/* 空状态 */}
              <View className="text-center py-12">
                <View className="i-mdi-file-document-outline text-6xl text-muted-foreground mb-4"></View>
                <Text className="text-muted-foreground text-base block mb-6">您还没有提交入职申请</Text>
                <Button
                  className="bg-blue-500 text-white py-3 px-8 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleNewApplication}>
                  提交入职申请
                </Button>
              </View>
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
