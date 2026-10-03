/**
 * 候选人详情页
 * 显示候选人完整信息、面试记录、操作按钮
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api'
import type {Candidate} from '@/db/types-onboarding-complete'
import {CANDIDATE_STATUS_COLORS, CANDIDATE_STATUS_NAMES} from '@/db/types-onboarding-complete'

// 面试记录接口
interface Interview {
  id: string
  interview_date: string
  interviewer_name: string
  result: string
  feedback: string
  score: number
}

export default function CandidateDetail() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const candidateId = router.params.id

  const [loading, setLoading] = useState(true)
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])

  // 加载候选人数据
  const loadData = useCallback(async () => {
    if (!user?.id || !candidateId) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 加载候选人信息
      const {data: candidateData, error: candidateError} = await supabase
        .from('candidates')
        .select('*')
        .eq('id', candidateId)
        .single()

      if (candidateError) throw candidateError
      setCandidate(candidateData)

      // 加载面试记录
      const {data: interviewData, error: interviewError} = await supabase
        .from('interviews')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('interview_date', {ascending: false})

      if (interviewError) {
        console.error('加载面试记录失败:', interviewError)
      } else {
        setInterviews(interviewData || [])
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, candidateId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 编辑候选人
  const handleEdit = () => {
    Taro.navigateTo({
      url: `/packageH/pages/candidate-edit/index?id=${candidateId}`
    })
  }

  // 删除候选人
  const handleDelete = async () => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这个候选人吗？'
    })

    if (!res.confirm) return

    try {
      Taro.showLoading({title: '删除中...'})

      const {error} = await supabase.from('candidates').delete().eq('id', candidateId)

      if (error) throw error

      Taro.hideLoading()
      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('删除失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  }

  // 发送Offer
  const handleSendOffer = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 格式化薪资
  const formatSalary = (salary: number) => {
    if (salary >= 10000) {
      return `${(salary / 10000).toFixed(1)}万`
    }
    return `${salary}`
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center min-h-screen bg-gray-50">
        <View className="flex flex-col items-center gap-4">
          <View className="i-mdi-loading animate-spin text-5xl text-primary" />
          <Text className="text-muted-foreground text-sm">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!candidate) {
    return (
      <View className="flex items-center justify-center min-h-screen bg-gray-50">
        <View className="flex flex-col items-center gap-4">
          <View className="i-mdi-alert-circle text-5xl text-red-500" />
          <Text className="text-muted-foreground text-sm">未找到候选人信息</Text>
          <Button className="bg-primary text-white px-6 py-2 rounded-lg" onClick={() => Taro.navigateBack()}>
            返回
          </Button>
        </View>
      </View>
    )
  }

  const statusColor = CANDIDATE_STATUS_COLORS[candidate.status] || 'gray'
  const statusName = CANDIDATE_STATUS_NAMES[candidate.status] || candidate.status

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen">
        <View className="p-4 pb-24">
          {/* 候选人头部卡片 */}
          <View className="bg-white rounded-2xl p-6 mb-4 shadow-md">
            <View className="flex items-center gap-4 mb-4">
              {/* 头像 */}
              <View className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <Text className="text-white text-3xl font-bold">{candidate.name.charAt(0)}</Text>
              </View>

              {/* 基本信息 */}
              <View className="flex-1">
                <View className="flex items-center gap-2 mb-2">
                  <Text className="text-2xl font-bold text-foreground">{candidate.name}</Text>
                  <View className={`px-3 py-1 rounded-full bg-${statusColor}-50`}>
                    <Text className={`text-xs font-medium text-${statusColor}-700`}>{statusName}</Text>
                  </View>
                </View>
                <Text className="text-sm text-muted-foreground mb-1">应聘：{candidate.position}</Text>
                <Text className="text-xs text-muted-foreground">{candidate.department}</Text>
              </View>
            </View>

            {/* 联系方式 */}
            <View className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <View className="flex items-center gap-2">
                <View className="i-mdi-phone text-lg text-primary" />
                <Text className="text-sm text-foreground">{candidate.phone}</Text>
              </View>
              {candidate.email && (
                <View className="flex items-center gap-2">
                  <View className="i-mdi-email text-lg text-primary" />
                  <Text className="text-sm text-foreground">{candidate.email}</Text>
                </View>
              )}
            </View>
          </View>

          {/* 详细信息 */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
            <View className="flex items-center gap-2 mb-4">
              <View className="i-mdi-information text-xl text-primary" />
              <Text className="text-lg font-bold text-foreground">详细信息</Text>
            </View>

            <View className="space-y-3">
              {/* 教育背景 */}
              {candidate.education && (
                <View className="flex items-start gap-3">
                  <View className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <View className="i-mdi-school text-lg text-blue-600" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground mb-1">学历</Text>
                    <Text className="text-sm font-medium text-foreground">{candidate.education}</Text>
                    {candidate.school && (
                      <Text className="text-xs text-muted-foreground mt-1">
                        {candidate.school}
                        {candidate.major && ` · ${candidate.major}`}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* 工作经验 */}
              {candidate.work_experience !== null && (
                <View className="flex items-start gap-3">
                  <View className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <View className="i-mdi-briefcase text-lg text-green-600" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground mb-1">工作经验</Text>
                    <Text className="text-sm font-medium text-foreground">{candidate.work_experience} 年</Text>
                  </View>
                </View>
              )}

              {/* 期望薪资 */}
              {candidate.expected_salary && (
                <View className="flex items-start gap-3">
                  <View className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <View className="i-mdi-currency-cny text-lg text-amber-600" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground mb-1">期望薪资</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {formatSalary(candidate.expected_salary)} 元/月
                    </Text>
                  </View>
                </View>
              )}

              {/* 简历 */}
              {candidate.resume_url && (
                <View className="flex items-start gap-3">
                  <View className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <View className="i-mdi-file-document text-lg text-purple-600" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted-foreground mb-1">简历</Text>
                    <Text
                      className="text-sm font-medium text-primary underline"
                      onClick={() => {
                        Taro.showToast({title: '简历预览功能开发中', icon: 'none'})
                      }}>
                      查看简历
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* 备注信息 */}
          {candidate.notes && (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-note-text text-xl text-primary" />
                <Text className="text-lg font-bold text-foreground">备注信息</Text>
              </View>
              <Text className="text-sm text-gray-700 leading-relaxed">{candidate.notes}</Text>
            </View>
          )}

          {/* 面试记录 */}
          {interviews.length > 0 && (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
              <View className="flex items-center gap-2 mb-4">
                <View className="i-mdi-calendar-clock text-xl text-primary" />
                <Text className="text-lg font-bold text-foreground">面试记录</Text>
                <Text className="text-xs text-muted-foreground">（{interviews.length} 次）</Text>
              </View>

              <View className="space-y-4">
                {interviews.map((interview, index) => (
                  <View key={interview.id} className="relative pl-6">
                    {/* 时间线 */}
                    <View className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
                      <View className="w-3 h-3 bg-primary rounded-full" />
                      {index < interviews.length - 1 && <View className="flex-1 w-0.5 bg-gray-200 mt-1" />}
                    </View>

                    {/* 面试内容 */}
                    <View className="bg-gray-50 rounded-xl p-4">
                      <View className="flex items-center justify-between mb-2">
                        <Text className="text-sm font-bold text-foreground">
                          {formatDate(interview.interview_date)}
                        </Text>
                        <View
                          className={`px-2 py-1 rounded-full ${
                            interview.result === 'passed'
                              ? 'bg-green-50'
                              : interview.result === 'failed'
                                ? 'bg-red-50'
                                : 'bg-gray-50'
                          }`}>
                          <Text
                            className={`text-xs font-medium ${
                              interview.result === 'passed'
                                ? 'text-green-700'
                                : interview.result === 'failed'
                                  ? 'text-red-700'
                                  : 'text-gray-700'
                            }`}>
                            {interview.result === 'passed' ? '通过' : interview.result === 'failed' ? '未通过' : '待定'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-muted-foreground mb-2">面试官：{interview.interviewer_name}</Text>
                      {interview.score && (
                        <Text className="text-xs text-muted-foreground mb-2">评分：{interview.score} 分</Text>
                      )}
                      {interview.feedback && (
                        <Text className="text-sm text-gray-700 leading-relaxed">{interview.feedback}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 时间信息 */}
          <View className="bg-gray-100 rounded-xl p-4">
            <View className="flex items-center justify-between text-xs text-muted-foreground">
              <Text>创建时间：{formatDate(candidate.created_at)}</Text>
              <Text>更新时间：{formatDate(candidate.updated_at)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <View className="flex gap-3">
          <Button
            className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold active:scale-95 transition-all"
            onClick={handleDelete}>
            删除
          </Button>
          <Button
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold active:scale-95 transition-all"
            onClick={handleEdit}>
            编辑
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
            onClick={handleSendOffer}>
            发送Offer
          </Button>
        </View>
      </View>
    </View>
  )
}
