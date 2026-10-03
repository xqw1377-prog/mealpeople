/**
 * 面试评价表单页面（面试官端）
 *
 * 功能：
 * - 填写面试评价
 * - 多维度评分（专业技能、沟通能力、团队适配、工作态度）
 * - 记录优势和劣势
 * - 给出推荐意见（通过/复试/拒绝）
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, ScrollView, Slider, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {
  createInterviewEvaluation,
  getInvitationByCode,
  type InterviewInvitationWithDetails,
  updateInterviewInvitation
} from '@/db/api-interview-flow'
import {useTenantStore} from '@/store/tenant'

const InterviewEvaluation: React.FC = () => {
  const router = useRouter()
  const {invitationId, code} = router.params
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [invitation, setInvitation] = useState<InterviewInvitationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 评价表单
  const [evaluation, setEvaluation] = useState({
    overall_score: 7,
    professional_skills: 7,
    communication_skills: 7,
    team_fit: 7,
    work_attitude: 7,
    strengths: '',
    weaknesses: '',
    recommendation: 'pass' as 'pass' | 'retest' | 'reject',
    comments: '',
    next_round_suggested: false
  })

  // 加载面试邀约
  const loadInvitation = useCallback(async () => {
    if (!code) {
      Taro.showToast({
        title: '参数错误',
        icon: 'error',
        duration: 2000
      })
      return
    }

    try {
      setLoading(true)
      const data = await getInvitationByCode(code)

      if (!data) {
        Taro.showToast({
          title: '面试邀约不存在',
          icon: 'error',
          duration: 2000
        })
        return
      }

      setInvitation(data)
    } catch (error) {
      console.error('加载面试邀约失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    loadInvitation()
  }, [loadInvitation])

  // 提交评价
  const handleSubmit = async () => {
    if (!invitation || !currentTenant) {
      Taro.showToast({
        title: '参数错误',
        icon: 'error',
        duration: 2000
      })
      return
    }

    // 验证必填项
    if (!evaluation.comments) {
      Taro.showToast({
        title: '请填写评价意见',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      setSubmitting(true)

      // 创建评价记录
      const evaluationData = await createInterviewEvaluation({
        tenant_id: currentTenant.id,
        candidate_id: invitation.candidate_id,
        invitation_id: invitation.id,
        interviewer_id: currentTenant.id, // TODO: 使用实际的面试官ID
        interview_round: invitation.interview_round,
        evaluation_date: new Date().toISOString(),
        ...evaluation
      })

      if (!evaluationData) {
        Taro.showToast({
          title: '提交失败',
          icon: 'error',
          duration: 2000
        })
        return
      }

      // 更新邀约状态为已完成
      await updateInterviewInvitation(invitation.id, {
        status: 'completed'
      })

      Taro.showToast({
        title: '评价提交成功',
        icon: 'success',
        duration: 2000
      })

      // 返回上一页
      setTimeout(() => {
        Taro.navigateBack()
      }, 2000)
    } catch (error) {
      console.error('提交评价失败:', error)
      Taro.showToast({
        title: '提交失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setSubmitting(false)
    }
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

  if (!invitation) {
    return (
      <View
        className="min-h-screen flex items-center justify-center p-6 max-sm:p-4"
        style={{background: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff)'}}>
        <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200 text-center">
          <View className="i-mdi-alert-circle text-6xl text-destructive mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
          <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
            面试邀约不存在
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 max-sm:p-3 space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
          {/* 顶部标题卡片 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <View className="flex flex-row items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="i-mdi-clipboard-text text-4xl max-sm:text-3xl text-blue-600 mr-3 max-sm:mr-2" />
              <View className="flex-1">
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                  面试评价
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                  请认真填写面试评价
                </Text>
              </View>
            </View>
          </View>

          {/* 候选人信息卡片 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              候选人信息
            </Text>
            <View className="space-y-2 max-sm:space-y-1.5">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">应聘职位</Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                  {invitation.position_title || '未指定'}
                </Text>
              </View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">面试轮次</Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                  {invitation.interview_type === 'initial' ? '初试' : '复试'} - 第{invitation.interview_round}轮
                </Text>
              </View>
            </View>
          </View>

          {/* 综合评分 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              综合评分
            </Text>
            <View className="space-y-6">
              {/* 综合评分 */}
              <View>
                <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">综合评分</Text>
                  <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                    {evaluation.overall_score}/10
                  </Text>
                </View>
                <Slider
                  value={evaluation.overall_score * 10}
                  min={10}
                  max={100}
                  step={10}
                  activeColor="#3b82f6"
                  backgroundColor="#e5e7eb"
                  blockSize={20}
                  onChange={(e) => setEvaluation({...evaluation, overall_score: Math.round(e.detail.value / 10)})}
                />
              </View>

              {/* 专业技能 */}
              <View>
                <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">专业技能</Text>
                  <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                    {evaluation.professional_skills}/10
                  </Text>
                </View>
                <Slider
                  value={evaluation.professional_skills * 10}
                  min={10}
                  max={100}
                  step={10}
                  activeColor="#3b82f6"
                  backgroundColor="#e5e7eb"
                  blockSize={20}
                  onChange={(e) => setEvaluation({...evaluation, professional_skills: Math.round(e.detail.value / 10)})}
                />
              </View>

              {/* 沟通能力 */}
              <View>
                <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">沟通能力</Text>
                  <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                    {evaluation.communication_skills}/10
                  </Text>
                </View>
                <Slider
                  value={evaluation.communication_skills * 10}
                  min={10}
                  max={100}
                  step={10}
                  activeColor="#3b82f6"
                  backgroundColor="#e5e7eb"
                  blockSize={20}
                  onChange={(e) =>
                    setEvaluation({...evaluation, communication_skills: Math.round(e.detail.value / 10)})
                  }
                />
              </View>

              {/* 团队适配 */}
              <View>
                <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">团队适配</Text>
                  <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                    {evaluation.team_fit}/10
                  </Text>
                </View>
                <Slider
                  value={evaluation.team_fit * 10}
                  min={10}
                  max={100}
                  step={10}
                  activeColor="#3b82f6"
                  backgroundColor="#e5e7eb"
                  blockSize={20}
                  onChange={(e) => setEvaluation({...evaluation, team_fit: Math.round(e.detail.value / 10)})}
                />
              </View>

              {/* 工作态度 */}
              <View>
                <View className="flex flex-row items-center justify-between mb-2 max-sm:mb-1.5">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">工作态度</Text>
                  <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                    {evaluation.work_attitude}/10
                  </Text>
                </View>
                <Slider
                  value={evaluation.work_attitude * 10}
                  min={10}
                  max={100}
                  step={10}
                  activeColor="#3b82f6"
                  backgroundColor="#e5e7eb"
                  blockSize={20}
                  onChange={(e) => setEvaluation({...evaluation, work_attitude: Math.round(e.detail.value / 10)})}
                />
              </View>
            </View>
          </View>

          {/* 优势和劣势 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              优势与待提升
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 优势 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                  优势
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请描述候选人的优势"
                    value={evaluation.strengths}
                    onInput={(e) => setEvaluation({...evaluation, strengths: e.detail.value})}
                    maxlength={500}
                  />
                </View>
              </View>

              {/* 劣势 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                  待提升
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请描述候选人需要提升的方面"
                    value={evaluation.weaknesses}
                    onInput={(e) => setEvaluation({...evaluation, weaknesses: e.detail.value})}
                    maxlength={500}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 推荐意见 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              推荐意见
            </Text>

            <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 推荐选项 */}
              <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5">
                <View
                  className={`flex-1 p-4 rounded-xl border-2 ${evaluation.recommendation === 'pass' ? 'border-green-500 bg-blue-100' : 'border-border bg-white'}`}
                  onClick={() => setEvaluation({...evaluation, recommendation: 'pass'})}>
                  <View className="flex flex-col items-center">
                    <View
                      className={`i-mdi-check-circle text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] mb-2 max-sm:mb-1.5 ${evaluation.recommendation === 'pass' ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                    />
                    <Text
                      className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium ${evaluation.recommendation === 'pass' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      通过
                    </Text>
                  </View>
                </View>

                <View
                  className={`flex-1 p-4 rounded-xl border-2 ${evaluation.recommendation === 'retest' ? 'border-blue-500 bg-blue-100' : 'border-border bg-white'}`}
                  onClick={() => setEvaluation({...evaluation, recommendation: 'retest'})}>
                  <View className="flex flex-col items-center">
                    <View
                      className={`i-mdi-refresh text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] mb-2 max-sm:mb-1.5 ${evaluation.recommendation === 'retest' ? 'text-muted-foreground' : 'text-muted-foreground'}`}
                    />
                    <Text
                      className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium ${evaluation.recommendation === 'retest' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      复试
                    </Text>
                  </View>
                </View>

                <View
                  className={`flex-1 p-4 rounded-xl border-2 ${evaluation.recommendation === 'reject' ? 'border-red-500 bg-blue-100' : 'border-border bg-white'}`}
                  onClick={() => setEvaluation({...evaluation, recommendation: 'reject'})}>
                  <View className="flex flex-col items-center">
                    <View
                      className={`i-mdi-close-circle text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] mb-2 max-sm:mb-1.5 ${evaluation.recommendation === 'reject' ? 'text-red-600' : 'text-muted-foreground'}`}
                    />
                    <Text
                      className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium ${evaluation.recommendation === 'reject' ? 'text-red-600' : 'text-muted-foreground'}`}>
                      拒绝
                    </Text>
                  </View>
                </View>
              </View>

              {/* 详细评价 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                  详细评价 <Text className="text-destructive">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请填写详细的评价意见"
                    value={evaluation.comments}
                    onInput={(e) => setEvaluation({...evaluation, comments: e.detail.value})}
                    maxlength={1000}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 提交按钮 */}
          <View className="pb-4">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
              size="default"
              onClick={handleSubmit}
              disabled={submitting}>
              {submitting ? '提交中...' : '提交评价'}
            </Button>
          </View>

          {/* 温馨提示 */}
          <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 font-medium mb-1">
                  温馨提示
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                  • 请客观公正地评价候选人{'\n'}• 评价将作为录用决策的重要依据{'\n'}• 提交后不可修改
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default InterviewEvaluation
