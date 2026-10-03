/**
 * 面试详情页面 - 招聘管理
 */

import {Button, Input, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'

interface InterviewDetail {
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
    email: string
    position: string
    department: string
    status: string
  }
  interviewer?: {
    name: string
  }
}

export default function InterviewDetail() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const interviewId = router.params.id || ''

  const [interview, setInterview] = useState<InterviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 编辑表单状态
  const [formData, setFormData] = useState({
    feedback: '',
    score: 0,
    result: 'pending'
  })

  // 加载面试详情
  const loadInterview = useCallback(async () => {
    if (!interviewId) return

    setLoading(true)
    try {
      const {data, error} = await supabase
        .from('interviews')
        .select(
          `
          *,
          candidates(name, phone, email, position, department, status),
          interviewer:profiles!interviews_interviewer_id_fkey(name)
        `
        )
        .eq('id', interviewId)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setInterview(data)
        setFormData({
          feedback: data.feedback || '',
          score: data.score || 0,
          result: data.result
        })
      }
    } catch (error) {
      console.error('加载面试详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [interviewId])

  // 页面显示时加载数据
  Taro.useDidShow(() => {
    loadInterview()
  })

  // 保存面试评价
  const saveEvaluation = async () => {
    if (!interview) return

    // 验证评分
    if (formData.score < 0 || formData.score > 100) {
      Taro.showToast({
        title: '评分范围为0-100',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)
    try {
      const {error} = await supabase
        .from('interviews')
        .update({
          feedback: formData.feedback,
          score: formData.score,
          result: formData.result
        })
        .eq('id', interview.id)

      if (error) throw error

      // 如果面试通过，更新候选人状态
      if (formData.result === 'pass') {
        await supabase.from('candidates').update({status: 'offer'}).eq('id', interview.candidate_id)
      }

      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setEditing(false)
      loadInterview()
    } catch (error) {
      console.error('保存面试评价失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
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

  if (loading) {
    return (
      <View className="flex items-center justify-center" style={{minHeight: '100vh'}}>
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!interview) {
    return (
      <View className="flex items-center justify-center" style={{minHeight: '100vh'}}>
        <Text className="text-muted-foreground">面试记录不存在</Text>
      </View>
    )
  }

  const resultStyle = getResultStyle(interview.result)

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 候选人信息 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-start justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="flex-1">
                <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-1">
                  {interview.candidates?.name || '未知候选人'}
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                  {interview.candidates?.department || '-'} - {interview.candidates?.position || '-'}
                </Text>
              </View>
              <View className={`px-3 max-sm:px-2 py-1 rounded-full ${resultStyle.bg}`}>
                <Text className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium ${resultStyle.text}`}>
                  {resultStyle.label}
                </Text>
              </View>
            </View>

            <View className="space-y-2 max-sm:space-y-1.5">
              {interview.candidates?.phone && (
                <View className="flex items-center gap-2 max-sm:gap-1.5">
                  <View className="i-mdi-phone text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                    {interview.candidates.phone}
                  </Text>
                </View>
              )}
              {interview.candidates?.email && (
                <View className="flex items-center gap-2 max-sm:gap-1.5">
                  <View className="i-mdi-email text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                    {interview.candidates.email}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 面试信息 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground mb-3 max-sm:mb-2 max-sm:mb-1.5">
              面试信息
            </Text>
            <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              <View className="flex items-center gap-2 max-sm:gap-1.5">
                <View className="i-mdi-calendar text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                  {formatDate(interview.interview_date)}
                </Text>
              </View>
              <View className="flex items-center gap-2 max-sm:gap-1.5">
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
          </View>

          {/* 面试评价 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                面试评价
              </Text>
              {!editing && (
                <Button
                  className="bg-blue-100 text-blue-600 px-3 max-sm:px-2 py-1 rounded break-keep text-xs max-sm:text-[10px]"
                  size="mini"
                  onClick={() => setEditing(true)}>
                  编辑
                </Button>
              )}
            </View>

            {editing ? (
              <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {/* 评分 */}
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5">
                    评分（0-100）
                  </Text>
                  <View style={{overflow: 'hidden'}}>
                    <Input
                      className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded-lg border border-border w-full"
                      type="number"
                      value={String(formData.score)}
                      onInput={(e) => setFormData({...formData, score: parseInt(e.detail.value, 10) || 0})}
                      placeholder="请输入评分"
                    />
                  </View>
                </View>

                {/* 面试结果 */}
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5">
                    面试结果
                  </Text>
                  <View className="flex gap-2 max-sm:gap-1.5">
                    <Button
                      className={`flex-1 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px] ${
                        formData.result === 'pass' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
                      }`}
                      size="default"
                      onClick={() => setFormData({...formData, result: 'pass'})}>
                      通过
                    </Button>
                    <Button
                      className={`flex-1 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px] ${
                        formData.result === 'pending' ? 'bg-accent text-blue-600' : 'bg-muted text-muted-foreground'
                      }`}
                      size="default"
                      onClick={() => setFormData({...formData, result: 'pending'})}>
                      待定
                    </Button>
                    <Button
                      className={`flex-1 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px] ${
                        formData.result === 'fail' ? 'bg-destructive text-blue-600' : 'bg-muted text-muted-foreground'
                      }`}
                      size="default"
                      onClick={() => setFormData({...formData, result: 'fail'})}>
                      未通过
                    </Button>
                  </View>
                </View>

                {/* 面试反馈 */}
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5">
                    面试反馈
                  </Text>
                  <View style={{overflow: 'hidden'}}>
                    <Textarea
                      className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded-lg border border-border w-full"
                      value={formData.feedback}
                      onInput={(e) => setFormData({...formData, feedback: e.detail.value})}
                      placeholder="请输入面试反馈"
                      maxlength={1000}
                      style={{minHeight: '120px'}}
                    />
                  </View>
                  <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                    {formData.feedback.length}/1000
                  </Text>
                </View>

                {/* 操作按钮 */}
                <View className="flex gap-2 max-sm:gap-1.5">
                  <Button
                    className="flex-1 bg-muted text-foreground py-3 max-sm:py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                    size="default"
                    onClick={() => {
                      setEditing(false)
                      setFormData({
                        feedback: interview.feedback || '',
                        score: interview.score || 0,
                        result: interview.result
                      })
                    }}>
                    取消
                  </Button>
                  <Button
                    className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                    size="default"
                    onClick={saveEvaluation}
                    disabled={submitting}>
                    {submitting ? '保存中...' : '保存'}
                  </Button>
                </View>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {/* 评分显示 */}
                <View className="flex items-center justify-between bg-gray-50/50 rounded-lg p-3">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">评分</Text>
                  <View className="flex items-center gap-1">
                    <View className="i-mdi-star text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-accent" />
                    <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground">
                      {interview.score || 0}
                    </Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">/100</Text>
                  </View>
                </View>

                {/* 反馈显示 */}
                {interview.feedback ? (
                  <View className="bg-gray-50/50 rounded-lg p-3">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                      {interview.feedback}
                    </Text>
                  </View>
                ) : (
                  <View className="bg-gray-50/50 rounded-lg p-3 text-center">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                      暂无面试反馈
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
