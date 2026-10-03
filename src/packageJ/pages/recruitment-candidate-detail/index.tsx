/**
 * 候选人详情页面 - 招聘管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getInterviewsByCandidate, updateCandidateStatus} from '@/db/api-lifecycle'
import type {Candidate, Interview} from '@/db/types-lifecycle'

export default function RecruitmentCandidateDetail() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const candidateId = router.params.id || ''

  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)

  // 加载候选人详情
  const loadCandidate = useCallback(async () => {
    if (!candidateId) return

    setLoading(true)
    try {
      // 获取候选人信息
      const {data: candidateData, error: candidateError} = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .maybeSingle()

      if (candidateError) throw candidateError
      setCandidate(candidateData)

      // 获取面试记录
      const interviewData = await getInterviewsByCandidate(candidateId)
      setInterviews(interviewData)
    } catch (error) {
      console.error('加载候选人详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [candidateId])

  useDidShow(() => {
    loadCandidate()
  })

  // 更新候选人状态
  const handleUpdateStatus = async (newStatus: string) => {
    if (!candidate) return

    try {
      await updateCandidateStatus(candidate.id, newStatus)
      Taro.showToast({
        title: '状态更新成功',
        icon: 'success'
      })
      loadCandidate()
    } catch (error) {
      console.error('更新状态失败:', error)
      Taro.showToast({
        title: '更新失败',
        icon: 'none'
      })
    }
  }

  // 获取状态文本和颜色
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      pending: {text: '待处理', color: 'text-muted-foreground', bgColor: 'bg-gray-50'},
      interview: {text: '面试中', color: 'text-accent', bgColor: 'bg-accent/10'},
      offer: {text: '已发Offer', color: 'text-secondary', bgColor: 'bg-secondary/10'},
      hired: {text: '已录用', color: 'text-blue-600', bgColor: 'bg-green-500/10'},
      rejected: {text: '已拒绝', color: 'text-destructive', bgColor: 'bg-destructive/10'}
    }
    return statusMap[status] || {text: '未知', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 获取面试结果文本和颜色
  const getInterviewResultInfo = (result: string) => {
    const resultMap: Record<string, {text: string; color: string}> = {
      pass: {text: '通过', color: 'text-blue-600'},
      fail: {text: '未通过', color: 'text-destructive'},
      pending: {text: '待评估', color: 'text-muted-foreground'}
    }
    return resultMap[result] || {text: '未知', color: 'text-muted-foreground'}
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!candidate) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">候选人不存在</Text>
      </View>
    )
  }

  const statusInfo = getStatusInfo(candidate.status)

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 基本信息卡片 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <View className="i-mdi-account text-4xl max-sm:text-3xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  {candidate.name}
                </Text>
                <View className={`px-2 py-1 rounded-full ${statusInfo.bgColor} inline-block`}>
                  <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                    {statusInfo.text}
                  </Text>
                </View>
              </View>
            </View>

            {/* 联系方式 */}
            <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              {candidate.phone && (
                <View className="flex items-center">
                  <View className="i-mdi-phone text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-3 max-sm:mr-2" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">{candidate.phone}</Text>
                </View>
              )}
              {candidate.email && (
                <View className="flex items-center">
                  <View className="i-mdi-email text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-3 max-sm:mr-2" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">{candidate.email}</Text>
                </View>
              )}
              {candidate.source && (
                <View className="flex items-center">
                  <View className="i-mdi-source-branch text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-3 max-sm:mr-2" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                    来源：{candidate.source}
                  </Text>
                </View>
              )}
            </View>

            {/* 简历链接 */}
            {candidate.resume_url && (
              <View
                className="bg-blue-100 rounded-lg p-3 flex items-center justify-between"
                onClick={() =>
                  Taro.showToast({
                    title: '简历查看功能开发中',
                    icon: 'none'
                  })
                }>
                <View className="flex items-center">
                  <View className="i-mdi-file-document text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 font-medium">查看简历</Text>
                </View>
                <View className="i-mdi-chevron-right text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600" />
              </View>
            )}
          </View>

          {/* 面试记录 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="flex items-center">
                <View className="i-mdi-clipboard-text text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                  面试记录
                </Text>
              </View>
              <View
                className="px-3 max-sm:px-2 py-1 bg-blue-100 rounded-lg"
                onClick={() =>
                  Taro.showToast({
                    title: '添加面试记录功能开发中',
                    icon: 'none'
                  })
                }>
                <Text className="text-xs max-sm:text-[10px] text-blue-600 font-medium">添加记录</Text>
              </View>
            </View>

            {interviews.length === 0 ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-clipboard-outline text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">暂无面试记录</Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {interviews.map((interview) => {
                  const resultInfo = getInterviewResultInfo(interview.result)
                  return (
                    <View key={interview.id} className="bg-gray-50 rounded-lg p-3">
                      <View className="flex items-start justify-between mb-2 max-sm:mb-1.5">
                        <View>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-1">
                            {interview.interview_type}
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                            {interview.interview_date
                              ? new Date(interview.interview_date).toLocaleString()
                              : '时间待定'}
                          </Text>
                        </View>
                        <Text className={`text-xs max-sm:text-[10px] font-medium ${resultInfo.color}`}>
                          {resultInfo.text}
                        </Text>
                      </View>

                      {interview.feedback && (
                        <View className="mt-2">
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">面试反馈：</Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                            {interview.feedback}
                          </Text>
                        </View>
                      )}

                      {interview.score !== null && interview.score !== undefined && (
                        <View className="flex items-center mt-2">
                          <View className="i-mdi-star text-sm max-sm:text-xs max-sm:text-[10px] text-accent mr-1" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-accent font-medium">
                            评分：{interview.score}分
                          </Text>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 操作按钮 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground mb-3 max-sm:mb-2 max-sm:mb-1.5">
              状态操作
            </Text>
            <View className="grid grid-cols-2 gap-3 max-sm:gap-2 max-sm:gap-1.5">
              {candidate.status === 'pending' && (
                <>
                  <View
                    className="bg-accent/10 rounded-lg p-3 flex flex-col items-center justify-center"
                    onClick={() => handleUpdateStatus('interview')}>
                    <View className="i-mdi-calendar-clock text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-accent mb-1" />
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-accent">安排面试</Text>
                  </View>
                  <View
                    className="bg-destructive/10 rounded-lg p-3 flex flex-col items-center justify-center"
                    onClick={() => handleUpdateStatus('rejected')}>
                    <View className="i-mdi-close-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-destructive mb-1" />
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-destructive">拒绝</Text>
                  </View>
                </>
              )}

              {candidate.status === 'interview' && (
                <>
                  <View
                    className="bg-secondary/10 rounded-lg p-3 flex flex-col items-center justify-center"
                    onClick={() => handleUpdateStatus('offer')}>
                    <View className="i-mdi-email-check text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-secondary mb-1" />
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-secondary">
                      发放Offer
                    </Text>
                  </View>
                  <View
                    className="bg-destructive/10 rounded-lg p-3 flex flex-col items-center justify-center"
                    onClick={() => handleUpdateStatus('rejected')}>
                    <View className="i-mdi-close-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-destructive mb-1" />
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-destructive">拒绝</Text>
                  </View>
                </>
              )}

              {candidate.status === 'offer' && (
                <>
                  <View
                    className="bg-blue-100 rounded-lg p-3 flex flex-col items-center justify-center"
                    onClick={() => handleUpdateStatus('hired')}>
                    <View className="i-mdi-check-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mb-1" />
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-blue-600">
                      确认录用
                    </Text>
                  </View>
                  <View
                    className="bg-destructive/10 rounded-lg p-3 flex flex-col items-center justify-center"
                    onClick={() => handleUpdateStatus('rejected')}>
                    <View className="i-mdi-close-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-destructive mb-1" />
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-destructive">拒绝</Text>
                  </View>
                </>
              )}

              {candidate.status === 'hired' && (
                <View className="col-span-2 bg-blue-100 rounded-lg p-3 flex flex-col items-center justify-center">
                  <View className="i-mdi-account-check text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mb-1" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-blue-600">已录用</Text>
                </View>
              )}

              {candidate.status === 'rejected' && (
                <View className="col-span-2 bg-muted rounded-lg p-3 flex flex-col items-center justify-center">
                  <View className="i-mdi-close-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-1" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground">
                    已拒绝
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
