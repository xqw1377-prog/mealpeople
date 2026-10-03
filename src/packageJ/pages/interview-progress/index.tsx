/**
 * 面试进度查看页面
 *
 * 功能：
 * - 显示面试流程进度
 * - 查看所有面试轮次
 * - 查看面试评价结果
 * - 显示下一步操作提示
 *
 * 设计理念：容易学、容易做、容易管
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {
  getCandidateEvaluations,
  getCandidateInvitations,
  type InterviewEvaluation,
  type InterviewInvitation
} from '@/db/api-interview-flow'

const InterviewProgress: React.FC = () => {
  const router = useRouter()
  const {candidateId} = router.params

  // 状态管理
  const [invitations, setInvitations] = useState<InterviewInvitation[]>([])
  const [evaluations, setEvaluations] = useState<InterviewEvaluation[]>([])
  const [loading, setLoading] = useState(true)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!candidateId) {
      Taro.showToast({
        title: '参数错误',
        icon: 'error',
        duration: 2000
      })
      return
    }

    try {
      setLoading(true)

      // 并行加载邀约和评价
      const [invitationsData, evaluationsData] = await Promise.all([
        getCandidateInvitations(candidateId),
        getCandidateEvaluations(candidateId)
      ])

      setInvitations(invitationsData)
      setEvaluations(evaluationsData)
    } catch (error) {
      console.error('加载面试进度失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }, [candidateId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 格式化日期时间
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '待定'
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 获取状态文本和颜色
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {text: '待接受', color: 'text-yellow-600', bgColor: 'bg-blue-100'}
      case 'accepted':
        return {text: '已接受', color: 'text-white', bgColor: 'bg-blue-100'}
      case 'completed':
        return {text: '已完成', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
      case 'rejected':
        return {text: '已拒绝', color: 'text-red-600', bgColor: 'bg-blue-100'}
      case 'expired':
        return {text: '已过期', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
      default:
        return {text: status, color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
    }
  }

  // 获取推荐结果文本和颜色
  const getRecommendationInfo = (recommendation: string | null) => {
    switch (recommendation) {
      case 'pass':
        return {text: '通过', color: 'text-muted-foreground', icon: 'i-mdi-check-circle'}
      case 'retest':
        return {text: '建议复试', color: 'text-muted-foreground', icon: 'i-mdi-refresh'}
      case 'reject':
        return {text: '未通过', color: 'text-red-600', icon: 'i-mdi-close-circle'}
      default:
        return {text: '待评价', color: 'text-muted-foreground', icon: 'i-mdi-clock-outline'}
    }
  }

  // 计算整体进度
  const calculateProgress = () => {
    if (invitations.length === 0) return 0
    const completedCount = invitations.filter((inv) => inv.status === 'completed').length
    return Math.round((completedCount / invitations.length) * 100)
  }

  // 获取下一步提示
  const getNextStepHint = () => {
    const pendingInvitation = invitations.find((inv) => inv.status === 'pending')
    if (pendingInvitation) {
      return '您有待接受的面试邀约，请尽快确认'
    }

    const acceptedInvitation = invitations.find((inv) => inv.status === 'accepted')
    if (acceptedInvitation) {
      return '请按时参加面试，祝您面试顺利！'
    }

    const lastEvaluation = evaluations[evaluations.length - 1]
    if (lastEvaluation) {
      if (lastEvaluation.recommendation === 'pass') {
        return '恭喜！您已通过面试，请等待HR联系'
      } else if (lastEvaluation.recommendation === 'retest') {
        return '请等待复试通知'
      } else if (lastEvaluation.recommendation === 'reject') {
        return '感谢您的参与，期待未来有机会合作'
      }
    }

    return '请等待面试结果'
  }

  // 加载中状态
  if (loading) {
    return (
      <View
        className="min-h-screen flex items-center justify-center"
        style={{background: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff)'}}>
        <View className="text-center">
          <View className="i-mdi-loading text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
        </View>
      </View>
    )
  }

  const progress = calculateProgress()
  const nextStepHint = getNextStepHint()

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 max-sm:p-3 space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
          {/* 顶部进度卡片 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <View className="flex flex-row items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="i-mdi-chart-timeline-variant text-4xl max-sm:text-3xl text-blue-600 mr-3 max-sm:mr-2" />
              <View className="flex-1">
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                  面试进度
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                  实时追踪您的面试状态
                </Text>
              </View>
            </View>

            {/* 进度条 */}
            <View className="mt-4">
              <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">整体进度</Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">{progress}%</Text>
              </View>
              <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <View className="h-full bg-blue-100 rounded-full" style={{width: `${progress}%`}} />
              </View>
            </View>
          </View>

          {/* 下一步提示卡片 */}
          <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3">
            <View className="flex flex-row items-start">
              <View className="i-mdi-lightbulb-on text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 font-medium mb-1">下一步</Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">{nextStepHint}</Text>
              </View>
            </View>
          </View>

          {/* 面试轮次列表 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              面试轮次
            </Text>

            {invitations.length === 0 ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-calendar-blank text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">暂无面试记录</Text>
              </View>
            ) : (
              <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {invitations.map((invitation, index) => {
                  const statusInfo = getStatusInfo(invitation.status)
                  const evaluation = evaluations.find((e) => e.invitation_id === invitation.id)
                  const recommendationInfo = evaluation ? getRecommendationInfo(evaluation.recommendation) : null

                  return (
                    <View key={invitation.id} className="border border-border rounded-xl p-4 max-sm:p-3">
                      {/* 轮次标题 */}
                      <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex flex-row items-center">
                          <View className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                            <Text className="text-foreground text-sm max-sm:text-xs max-sm:text-[10px] font-bold">
                              {index + 1}
                            </Text>
                          </View>
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                            {invitation.interview_type === 'initial' ? '初试' : '复试'}
                          </Text>
                        </View>
                        <View className={`px-3 max-sm:px-2 py-1 rounded-full ${statusInfo.bgColor}`}>
                          <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>

                      {/* 面试信息 */}
                      <View className="space-y-2 max-sm:space-y-1.5">
                        <View className="flex flex-row items-center">
                          <View className="i-mdi-clock-outline text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            {formatDateTime(invitation.scheduled_time)}
                          </Text>
                        </View>

                        {invitation.location && (
                          <View className="flex flex-row items-center">
                            <View className="i-mdi-map-marker text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              {invitation.location}
                            </Text>
                          </View>
                        )}

                        {invitation.notes && (
                          <View className="flex flex-row items-start">
                            <View className="i-mdi-note-text text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2 mt-0.5" />
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground flex-1">
                              {invitation.notes}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 评价结果 */}
                      {evaluation && recommendationInfo && (
                        <View className="mt-3 pt-3 border-t border-border">
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              面试结果
                            </Text>
                            <View className="flex flex-row items-center">
                              <View
                                className={`${recommendationInfo.icon} text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] ${recommendationInfo.color} mr-1`}
                              />
                              <Text
                                className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium ${recommendationInfo.color}`}>
                                {recommendationInfo.text}
                              </Text>
                            </View>
                          </View>

                          {evaluation.overall_score && (
                            <View className="flex flex-row items-center justify-between mt-2">
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                                综合评分
                              </Text>
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                                {evaluation.overall_score}/10
                              </Text>
                            </View>
                          )}

                          {evaluation.comments && (
                            <View className="mt-2">
                              <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                                评价：{evaluation.comments}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 详细评价（如果有） */}
          {evaluations.length > 0 && (
            <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                详细评价
              </Text>

              <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {evaluations.map((evaluation, index) => (
                  <View key={evaluation.id} className="border border-border rounded-xl p-4 max-sm:p-3">
                    <View className="flex flex-row items-center mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      <View className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <Text className="text-foreground text-xs max-sm:text-[10px] font-bold">{index + 1}</Text>
                      </View>
                      <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                        第{evaluation.interview_round}轮面试
                      </Text>
                    </View>

                    {/* 评分详情 */}
                    <View className="space-y-2 max-sm:space-y-1.5">
                      {evaluation.professional_skills && (
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            专业技能
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {evaluation.professional_skills}/10
                          </Text>
                        </View>
                      )}

                      {evaluation.communication_skills && (
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            沟通能力
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {evaluation.communication_skills}/10
                          </Text>
                        </View>
                      )}

                      {evaluation.team_fit && (
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            团队适配
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {evaluation.team_fit}/10
                          </Text>
                        </View>
                      )}

                      {evaluation.work_attitude && (
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            工作态度
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {evaluation.work_attitude}/10
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 优势和劣势 */}
                    {(evaluation.strengths || evaluation.weaknesses) && (
                      <View className="mt-3 pt-3 border-t border-border space-y-2 max-sm:space-y-1.5">
                        {evaluation.strengths && (
                          <View>
                            <Text className="text-xs max-sm:text-[10px] text-muted-foreground font-medium mb-1">
                              优势
                            </Text>
                            <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                              {evaluation.strengths}
                            </Text>
                          </View>
                        )}

                        {evaluation.weaknesses && (
                          <View>
                            <Text className="text-xs max-sm:text-[10px] text-muted-foreground font-medium mb-1">
                              待提升
                            </Text>
                            <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                              {evaluation.weaknesses}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 温馨提示 */}
          <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 font-medium mb-1">
                  温馨提示
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                  • 请保持手机畅通，及时查看面试通知{'\n'}• 面试前请做好充分准备{'\n'}• 如有疑问，请及时联系HR
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default InterviewProgress
