/**
 * HR端入职管理中心
 * 包含候选人管理、面试管理、Offer管理等功能
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {getCandidateStatistics, getTenantCandidates} from '@/db/api-onboarding-complete'
import type {Candidate, CandidateStatistics} from '@/db/types-onboarding-complete'
import {CANDIDATE_STATUS_COLORS, CANDIDATE_STATUS_NAMES} from '@/db/types-onboarding-complete'

export default function OnboardingManagement() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [statistics, setStatistics] = useState<CandidateStatistics | null>(null)
  const [activeTab, setActiveTab] = useState<'candidates' | 'interviews' | 'offers'>('candidates')

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 加载候选人列表
      const candidateList = await getTenantCandidates(employee.tenant_id)
      setCandidates(candidateList)

      // 加载统计数据
      const stats = await getCandidateStatistics(employee.tenant_id)
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

  // 跳转到候选人详情
  const handleCandidateDetail = (candidateId: string) => {
    Taro.navigateTo({
      url: `/pages/candidate-detail/index?id=${candidateId}`
    })
  }

  // 添加候选人
  const handleAddCandidate = () => {
    Taro.navigateTo({
      url: '/pages/candidate-add/index'
    })
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 页面标题 - 优化版 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex flex-row items-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-blue-100 bg-opacity-10 rounded-xl flex items-center justify-center mr-3 max-sm:mr-2">
                <View className="i-mdi-office-building text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                  入职管理中心
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                  全方位管理候选人、面试和Offer
                </Text>
              </View>
            </View>
          </View>

          {/* 统计卡片 - 优化版 */}
          {statistics && (
            <View className="grid grid-cols-2 gap-3 max-sm:gap-2 max-sm:gap-1.5 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3 border-l-4 border-primary">
                <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground font-medium">
                    候选人总数
                  </Text>
                  <View className="w-8 h-8 bg-blue-100 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <View className="i-mdi-account-multiple text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
                  </View>
                </View>
                <Text className="text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                  {statistics.total}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">总计候选人数</Text>
              </View>

              <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3 border-l-4 border-border">
                <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground font-medium">
                    待面试
                  </Text>
                  <View className="w-8 h-8 bg-blue-100 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <View className="i-mdi-calendar-clock text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                  </View>
                </View>
                <Text className="text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">
                  {statistics.by_status.interview_scheduled || 0}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">等待面试安排</Text>
              </View>

              <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3 border-l-4 border-border">
                <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground font-medium">
                    已面试
                  </Text>
                  <View className="w-8 h-8 bg-blue-100 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <View className="i-mdi-account-check text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                  </View>
                </View>
                <Text className="text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">
                  {statistics.by_status.interviewed || 0}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">完成面试评估</Text>
              </View>

              <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3 border-l-4 border-border">
                <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground font-medium">
                    已录用
                  </Text>
                  <View className="w-8 h-8 bg-blue-100 bg-opacity-20 rounded-lg flex items-center justify-center">
                    <View className="i-mdi-check-circle text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                  </View>
                </View>
                <Text className="text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">
                  {statistics.by_status.offer_accepted || 0}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">成功录用人数</Text>
              </View>
            </View>
          )}

          {/* 快捷功能入口 - 优化版 */}
          <View className="mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                快捷功能
              </Text>
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground">点击进入管理</Text>
            </View>
            <View className="grid grid-cols-2 gap-3 max-sm:gap-2 max-sm:gap-1.5">
              {/* 员工列表 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageA/pages/employee-list/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-account-group text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  员工列表
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">查看管理所有员工</Text>
              </View>

              {/* 入职申请审批 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/onboarding-approval/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-file-document-check text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-green-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  入职申请审批
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">审批员工入职申请</Text>
              </View>

              {/* 入职办理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/onboarding-process/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-account-check text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-amber-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  入职办理
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理员工入职流程</Text>
              </View>

              {/* 物品领取 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary cursor-pointer"
                onClick={() => Taro.navigateTo({url: '/pages/onboarding/item-management/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-package-variant text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-indigo-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  物品领取
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理物品发放归还</Text>
              </View>

              {/* 物品库管理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary cursor-pointer"
                onClick={() => Taro.navigateTo({url: '/pages/onboarding/item-library/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-database text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  物品库管理
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理物品定义分类</Text>
              </View>

              {/* 导师分配 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/pages/onboarding/mentor-management/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-account-supervisor text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  导师分配
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理导师带教关系</Text>
              </View>

              {/* 培训管理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary cursor-pointer"
                onClick={() => Taro.navigateTo({url: '/packageJ/pages/training-plan-management/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-yellow-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-school text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-yellow-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  培训计划
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理培训计划</Text>
              </View>

              {/* 培训课程库管理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary cursor-pointer"
                onClick={() => Taro.navigateTo({url: '/pages/onboarding/course-library/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-book-open-page-variant text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-amber-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  课程库管理
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理培训课程库</Text>
              </View>

              {/* 试用期管理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/pages/onboarding/probation-management/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-cyan-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-clock-outline text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-cyan-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  试用期管理
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">监控试用期员工</Text>
              </View>

              {/* 试用期转正 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/pages/onboarding/probation-conversion/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-account-convert text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-teal-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  试用期转正
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理试用期员工转正</Text>
              </View>

              {/* 转正申请审批 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/probation-conversion-approval/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-cyan-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-clipboard-check-outline text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-cyan-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  转正申请审批
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">审批员工转正申请</Text>
              </View>

              {/* 试用期评估 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/probation-evaluation-management/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-clipboard-check text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-green-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  试用期评估
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">评估试用期员工</Text>
              </View>

              {/* 劳动合同管理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/pages/onboarding/contract-management/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-sky-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-file-document-multiple text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-sky-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  劳动合同
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理员工劳动合同</Text>
              </View>

              {/* 社保管理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/pages/onboarding/social-security-management/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-shield-account text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  社保管理
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">管理员工社保信息</Text>
              </View>

              {/* 面试邀约 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageJ/pages/interview-invitation/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-calendar-account text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  面试邀约
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">发送面试邀约链接</Text>
              </View>

              {/* HR留言管理 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageN/pages/hr-message-management/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-message-text text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-red-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  留言管理
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">查看回复员工留言</Text>
              </View>

              {/* 数据统计 */}
              <View
                className="bg-white rounded-xl p-4 max-sm:p-3 active:scale-95 transition-all border-2 border-transparent hover:border-primary"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/onboarding-statistics/index'})}>
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-chart-bar text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-indigo-600" />
                </View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  数据统计
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">查看入职数据分析</Text>
              </View>
            </View>
          </View>

          {/* 功能标签页 - 优化版 */}
          <View className="bg-white rounded-xl p-2 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="flex flex-row items-center gap-2 max-sm:gap-1.5">
              <View
                className={`flex-1 text-center py-3 max-sm:py-2 rounded-lg transition-all ${activeTab === 'candidates' ? 'bg-green-500' : 'bg-transparent'}`}
                onClick={() => setActiveTab('candidates')}>
                <Text
                  className={`text-sm max-sm:text-xs max-sm:text-[10px] font-bold ${activeTab === 'candidates' ? 'text-white' : 'text-muted-foreground'}`}>
                  候选人管理
                </Text>
              </View>
              <View
                className={`flex-1 text-center py-3 max-sm:py-2 rounded-lg transition-all ${activeTab === 'interviews' ? 'bg-blue-100' : 'bg-transparent'}`}
                onClick={() => setActiveTab('interviews')}>
                <Text
                  className={`text-sm max-sm:text-xs max-sm:text-[10px] font-bold ${activeTab === 'interviews' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  面试管理
                </Text>
              </View>
              <View
                className={`flex-1 text-center py-3 max-sm:py-2 rounded-lg transition-all ${activeTab === 'offers' ? 'bg-blue-100' : 'bg-transparent'}`}
                onClick={() => setActiveTab('offers')}>
                <Text
                  className={`text-sm max-sm:text-xs max-sm:text-[10px] font-bold ${activeTab === 'offers' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Offer管理
                </Text>
              </View>
            </View>
          </View>

          {/* 候选人列表 - 优化版 */}
          {activeTab === 'candidates' && (
            <View>
              {/* 添加候选人按钮 - 优化版 */}
              <View
                className="bg-gradient-to-r from-primary to-primary-glow rounded-xl p-4 max-sm:p-3 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 active:scale-98 transition-all"
                onClick={handleAddCandidate}>
                <View className="flex flex-row items-center justify-center">
                  <View className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 max-sm:mr-2">
                    <View className="i-mdi-plus-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-white">
                      添加候选人
                    </Text>
                    <Text className="text-xs max-sm:text-[10px] text-white text-opacity-90 mt-0.5">
                      快速录入新候选人信息
                    </Text>
                  </View>
                  <View className="i-mdi-chevron-right text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-white" />
                </View>
              </View>

              {/* 候选人卡片列表 - 优化版 */}
              {loading ? (
                <View className="bg-white rounded-xl p-12 border-2 border-gray-200 text-center">
                  <View className="i-mdi-loading text-5xl max-sm:text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-3 max-sm:mb-2 max-sm:mb-1.5 mx-auto" />
                  <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-foreground font-medium">
                    加载中...
                  </Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                    正在获取候选人数据
                  </Text>
                </View>
              ) : candidates.length === 0 ? (
                <View className="bg-white rounded-xl p-12 border-2 border-gray-200 text-center">
                  <View className="w-20 h-20 max-sm:w-16 max-sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                    <View className="i-mdi-account-off text-5xl max-sm:text-4xl max-sm:text-3xl text-muted-foreground" />
                  </View>
                  <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
                    暂无候选人
                  </Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                    点击上方按钮添加候选人
                  </Text>
                  <View className="w-16 h-1 bg-blue-100 rounded-full mx-auto" />
                </View>
              ) : (
                <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                  {candidates.map((candidate) => (
                    <View
                      key={candidate.id}
                      className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-transparent hover:border-primary active:scale-98 transition-all"
                      onClick={() => handleCandidateDetail(candidate.id)}>
                      {/* 候选人基本信息 */}
                      <View className="flex flex-row items-start justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex-1">
                          <View className="flex flex-row items-center mb-2 max-sm:mb-1.5">
                            <View className="w-10 h-10 bg-blue-100 bg-opacity-10 rounded-full flex items-center justify-center mr-3 max-sm:mr-2">
                              <View className="i-mdi-account text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
                            </View>
                            <View className="flex-1">
                              <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                                {candidate.name}
                              </Text>
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-0.5">
                                {candidate.position}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View
                          className={`px-3 max-sm:px-2 py-1.5 rounded-full shadow-sm ${CANDIDATE_STATUS_COLORS[candidate.status] || 'bg-gray-50'}`}>
                          <Text className="text-xs max-sm:text-[10px] font-bold text-white">
                            {CANDIDATE_STATUS_NAMES[candidate.status]}
                          </Text>
                        </View>
                      </View>

                      {/* 候选人详细信息 */}
                      <View className="bg-muted bg-opacity-30 rounded-lg p-3 space-y-2 max-sm:space-y-1.5">
                        <View className="flex flex-row items-center">
                          <View className="i-mdi-phone text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                            {candidate.phone}
                          </Text>
                        </View>
                        <View className="flex flex-row items-center">
                          <View className="i-mdi-email text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                            {candidate.email}
                          </Text>
                        </View>
                        <View className="flex flex-row items-center gap-4 max-sm:p-3">
                          <View className="flex flex-row items-center">
                            <View className="i-mdi-office-building text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                              {candidate.department}
                            </Text>
                          </View>
                          {candidate.education && (
                            <View className="flex flex-row items-center">
                              <View className="i-mdi-school text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                                {candidate.education}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* 查看详情提示 */}
                      <View className="flex flex-row items-center justify-end mt-3">
                        <Text className="text-xs max-sm:text-[10px] text-blue-600 font-medium mr-1">查看详情</Text>
                        <View className="i-mdi-chevron-right text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 面试管理 - 优化版 */}
          {activeTab === 'interviews' && (
            <View className="bg-white rounded-xl p-12 border-2 border-gray-200 text-center">
              <View className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                <View className="i-mdi-calendar-check text-6xl text-blue-600" />
              </View>
              <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
                面试管理
              </Text>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                统一管理所有面试安排和评估
              </Text>
              <View className="w-16 h-1 bg-blue-100 rounded-full mx-auto mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
              <View className="bg-muted bg-opacity-50 rounded-lg p-4 max-sm:p-3">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                  功能开发中，敬请期待...
                </Text>
              </View>
            </View>
          )}

          {/* Offer管理 - 优化版 */}
          {activeTab === 'offers' && (
            <View className="bg-white rounded-xl p-12 border-2 border-gray-200 text-center">
              <View className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                <View className="i-mdi-file-document-edit text-6xl text-muted-foreground" />
              </View>
              <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
                Offer管理
              </Text>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                管理录用通知和入职确认
              </Text>
              <View className="w-16 h-1 bg-green-600 rounded-full mx-auto mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
              <View className="bg-muted bg-opacity-50 rounded-lg p-4 max-sm:p-3">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                  功能开发中，敬请期待...
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
