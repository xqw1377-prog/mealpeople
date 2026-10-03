/**
 * 离职面谈页面 - 离职管理
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import {supabase} from '@/client/supabase'

export default function ResignationInterview() {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const resignationId = router.params.id || ''

  // 表单状态
  const [formData, setFormData] = useState({
    interview_date: new Date().toISOString().split('T')[0],
    satisfaction_score: 3, // 1-5分
    feedback: '',
    suggestions: '',
    would_recommend: true
  })

  const [submitting, setSubmitting] = useState(false)

  // 提交面谈记录
  const handleSubmit = async () => {
    if (!resignationId) {
      Taro.showToast({
        title: '参数错误',
        icon: 'none'
      })
      return
    }

    // 验证必填项
    if (!formData.feedback.trim()) {
      Taro.showToast({
        title: '请填写面谈反馈',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)
    try {
      const {error} = await supabase.from('exit_interviews').insert({
        resignation_id: resignationId,
        interviewer_id: user?.id,
        interview_date: formData.interview_date,
        satisfaction_score: formData.satisfaction_score,
        feedback: formData.feedback,
        suggestions: formData.suggestions,
        would_recommend: formData.would_recommend
      })

      if (error) throw error

      Taro.showToast({
        title: '提交成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交面谈记录失败:', error)
      Taro.showToast({
        title: '提交失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 渲染评分选择器
  const renderScoreSelector = () => {
    return (
      <View className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((score) => (
          <View
            key={score}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              formData.satisfaction_score === score ? 'bg-blue-100' : 'bg-muted border-2 border-border'
            }`}
            onClick={() => setFormData({...formData, satisfaction_score: score})}>
            <Text
              className={`text-lg font-bold ${
                formData.satisfaction_score === score ? 'text-blue-600' : 'text-muted-foreground'
              }`}>
              {score}
            </Text>
          </View>
        ))}
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 说明 */}
          <View className="bg-accent/10 rounded-xl p-4 mb-4">
            <View className="flex items-start gap-2">
              <View className="i-mdi-information text-xl text-accent mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm text-accent font-medium mb-1">面谈说明</Text>
                <Text className="text-xs text-accent/80">
                  离职面谈是了解员工真实想法、改进公司管理的重要途径。请真诚沟通，记录员工的反馈和建议。
                </Text>
              </View>
            </View>
          </View>

          {/* 满意度评分 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-2">整体满意度评分</Text>
            <Text className="text-xs text-muted-foreground mb-3">请对员工在公司的整体工作体验进行评分（1-5分）</Text>
            {renderScoreSelector()}
            <View className="flex items-center justify-between mt-2">
              <Text className="text-xs text-muted-foreground">非常不满意</Text>
              <Text className="text-xs text-muted-foreground">非常满意</Text>
            </View>
          </View>

          {/* 面谈反馈 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-3">面谈反馈</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-input text-foreground px-3 py-2 rounded-lg border border-border w-full"
                placeholder="请记录员工的离职原因、工作感受、对公司的看法等"
                value={formData.feedback}
                onInput={(e) => setFormData({...formData, feedback: e.detail.value})}
                maxlength={1000}
                style={{minHeight: '150px'}}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-1">{formData.feedback.length}/1000</Text>
          </View>

          {/* 改进建议 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-3">改进建议</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-input text-foreground px-3 py-2 rounded-lg border border-border w-full"
                placeholder="请记录员工对公司的改进建议和意见"
                value={formData.suggestions}
                onInput={(e) => setFormData({...formData, suggestions: e.detail.value})}
                maxlength={1000}
                style={{minHeight: '120px'}}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-1">{formData.suggestions.length}/1000</Text>
          </View>

          {/* 推荐意愿 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-3">推荐意愿</Text>
            <Text className="text-sm text-muted-foreground mb-3">员工是否愿意向朋友推荐公司？</Text>
            <View className="flex gap-3">
              <View
                className={`flex-1 py-3 rounded-lg flex items-center justify-center ${
                  formData.would_recommend ? 'bg-blue-100 border-2 border-primary' : 'bg-muted border-2 border-border'
                }`}
                onClick={() => setFormData({...formData, would_recommend: true})}>
                <Text
                  className={`text-sm font-medium ${
                    formData.would_recommend ? 'text-blue-600' : 'text-muted-foreground'
                  }`}>
                  愿意推荐
                </Text>
              </View>
              <View
                className={`flex-1 py-3 rounded-lg flex items-center justify-center ${
                  !formData.would_recommend ? 'bg-accent/10 border-2 border-accent' : 'bg-muted border-2 border-border'
                }`}
                onClick={() => setFormData({...formData, would_recommend: false})}>
                <Text
                  className={`text-sm font-medium ${
                    !formData.would_recommend ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                  不愿意推荐
                </Text>
              </View>
            </View>
          </View>

          {/* 提交按钮 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={handleSubmit}
              disabled={submitting}>
              {submitting ? '提交中...' : '提交面谈记录'}
            </Button>
          </View>

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
