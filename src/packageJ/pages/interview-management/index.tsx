/**
 * 面试管理页面 - 招聘管理
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {useTenantStore} from '@/store/tenant'

interface InterviewWithDetails {
  id: string
  candidate_id: string
  interviewer_id: string
  interview_date: string
  interview_type: string
  feedback: string | null
  score: number | null
  result: string
  created_at: string
  candidates?: {
    name: string
    phone: string
    position: string
    status: string
  }
  interviewer?: {
    name: string
  }
}

export default function InterviewManagement() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'pass' | 'fail'>('all')

  // 加载面试列表
  const loadInterviews = useCallback(async () => {
    if (!currentTenant) return

    setLoading(true)
    try {
      const {data, error} = await supabase
        .from('interviews')
        .select(
          `
          *,
          candidates!inner(
            name,
            phone,
            position,
            status,
            tenant_id
          ),
          interviewer:profiles!interviews_interviewer_id_fkey(name)
        `
        )
        .eq('candidates.tenant_id', currentTenant.id)
        .order('interview_date', {ascending: false})

      if (error) throw error
      setInterviews(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('加载面试列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadInterviews()
  })

  // 筛选面试
  const filteredInterviews = interviews.filter((interview) => {
    if (filter === 'all') return true
    if (filter === 'pending') return interview.result === 'pending'
    if (filter === 'pass') return interview.result === 'pass'
    if (filter === 'fail') return interview.result === 'fail'
    return true
  })

  // 统计数据
  const stats = {
    total: interviews.length,
    pending: interviews.filter((i) => i.result === 'pending').length,
    pass: interviews.filter((i) => i.result === 'pass').length,
    fail: interviews.filter((i) => i.result === 'fail').length
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 获取结果标签样式
  const getResultStyle = (result: string) => {
    switch (result) {
      case 'pass':
        return {bg: 'bg-green-500/10', text: 'text-blue-600', label: '通过'}
      case 'fail':
        return {bg: 'bg-destructive/10', text: 'text-destructive', label: '未通过'}
      case 'pending':
        return {bg: 'bg-accent/10', text: 'text-accent', label: '待定'}
      default:
        return {bg: 'bg-gray-50', text: 'text-muted-foreground', label: '未知'}
    }
  }

  // 跳转到面试详情
  const goToInterviewDetail = (interviewId: string) => {
    Taro.navigateTo({
      url: `/pages/interview-detail/index?id=${interviewId}`
    })
  }

  // 安排新面试
  const scheduleInterview = () => {
    Taro.navigateTo({
      url: '/packageJ/pages/interview-schedule/index'
    })
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 统计卡片 */}
          <View className="grid grid-cols-4 gap-2 max-sm:gap-1.5 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-md">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">总计</Text>
              <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                {stats.total}
              </Text>
            </View>
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-md">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">待定</Text>
              <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-accent">
                {stats.pending}
              </Text>
            </View>
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-md">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">通过</Text>
              <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                {stats.pass}
              </Text>
            </View>
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-md">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">未通过</Text>
              <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-destructive">
                {stats.fail}
              </Text>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <Button
              className="w-full bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
              size="default"
              onClick={scheduleInterview}>
              <View className="flex items-center justify-center gap-1">
                <View className="i-mdi-calendar-plus text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px]" />
                <Text>安排面试</Text>
              </View>
            </Button>
          </View>

          {/* 筛选器 */}
          <View className="flex gap-2 max-sm:gap-1.5 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <Button
              className={`flex-1 py-2 rounded-lg break-keep text-xs max-sm:text-[10px] ${
                filter === 'all' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
              }`}
              size="default"
              onClick={() => setFilter('all')}>
              全部
            </Button>
            <Button
              className={`flex-1 py-2 rounded-lg break-keep text-xs max-sm:text-[10px] ${
                filter === 'pending' ? 'bg-accent text-blue-600' : 'bg-white text-foreground'
              }`}
              size="default"
              onClick={() => setFilter('pending')}>
              待定
            </Button>
            <Button
              className={`flex-1 py-2 rounded-lg break-keep text-xs max-sm:text-[10px] ${
                filter === 'pass' ? 'bg-blue-100 text-white' : 'bg-white text-foreground'
              }`}
              size="default"
              onClick={() => setFilter('pass')}>
              通过
            </Button>
            <Button
              className={`flex-1 py-2 rounded-lg break-keep text-xs max-sm:text-[10px] ${
                filter === 'fail' ? 'bg-destructive text-blue-600' : 'bg-white text-foreground'
              }`}
              size="default"
              onClick={() => setFilter('fail')}>
              未通过
            </Button>
          </View>

          {/* 面试列表 */}
          {loading ? (
            <View className="bg-white rounded-xl p-8 max-sm:p-6 border-2 border-gray-200 text-center">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredInterviews.length === 0 ? (
            <View className="bg-white rounded-xl p-8 max-sm:p-6 border-2 border-gray-200 text-center">
              <View className="i-mdi-calendar-blank text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5 mx-auto" />
              <Text className="text-muted-foreground">暂无面试记录</Text>
            </View>
          ) : (
            <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {filteredInterviews.map((interview) => {
                const resultStyle = getResultStyle(interview.result)
                return (
                  <View
                    key={interview.id}
                    className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 shadow-md"
                    onClick={() => goToInterviewDetail(interview.id)}>
                    {/* 面试头部 */}
                    <View className="flex items-start justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      <View className="flex-1">
                        <View className="flex items-center gap-2 max-sm:gap-1.5 mb-1">
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                            {interview.candidates?.name || '未知候选人'}
                          </Text>
                          <View className={`px-2 py-0.5 rounded ${resultStyle.bg}`}>
                            <Text className={`text-xs max-sm:text-[10px] font-medium ${resultStyle.text}`}>
                              {resultStyle.label}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                          {interview.candidates?.position || '-'}
                        </Text>
                      </View>
                    </View>

                    {/* 面试信息 */}
                    <View className="bg-gray-50/50 rounded-lg p-3 mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      <View className="flex items-center gap-2 max-sm:gap-1.5 mb-2 max-sm:mb-1.5">
                        <View className="i-mdi-calendar text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                          {formatDate(interview.interview_date)}
                        </Text>
                      </View>
                      <View className="flex items-center gap-2 max-sm:gap-1.5 mb-2 max-sm:mb-1.5">
                        <View className="i-mdi-tag text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                          {interview.interview_type}
                        </Text>
                      </View>
                      {interview.interviewer && (
                        <View className="flex items-center gap-2 max-sm:gap-1.5">
                          <View className="i-mdi-account text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                            面试官: {interview.interviewer.name}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 评分 */}
                    {interview.score !== null && (
                      <View className="flex items-center justify-between">
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">评分</Text>
                        <View className="flex items-center gap-1">
                          <View className="i-mdi-star text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-accent" />
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                            {interview.score}
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">/100</Text>
                        </View>
                      </View>
                    )}

                    {/* 反馈预览 */}
                    {interview.feedback && (
                      <View className="mt-3 pt-3 border-t border-border">
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                          {interview.feedback.length > 50
                            ? `${interview.feedback.substring(0, 50)}...`
                            : interview.feedback}
                        </Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
