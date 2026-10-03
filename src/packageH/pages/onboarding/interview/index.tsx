/**
 * 我的面试页面
 * 显示员工的面试记录和面试安排
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {EmptyState, LoadingCards, PageHeader} from '@/components/common'
import {getEmployeeByUserId} from '@/db/api'

// 面试记录类型
interface InterviewRecord {
  id: string
  interview_type: string
  interview_date: string
  interviewer_id: string
  interviewer_name?: string
  score: number
  result: string
  feedback: string
}

const MyInterview: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [interviews, setInterviews] = useState<InterviewRecord[]>([])
  const [loading, setLoading] = useState(true)

  // 加载面试数据
  const loadInterviewData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 这里使用模拟数据，实际应该调用API
      // const interviewData = await getMyInterviews(employee.id)

      // 模拟数据
      const mockInterviews: InterviewRecord[] = [
        {
          id: '1',
          interview_type: '初试',
          interview_date: '2024-01-15',
          interviewer_id: '1',
          interviewer_name: '张经理',
          score: 95,
          result: 'passed',
          feedback: '表现优秀，专业技能扎实，沟通能力强'
        },
        {
          id: '2',
          interview_type: '复试',
          interview_date: '2024-01-20',
          interviewer_id: '2',
          interviewer_name: '李总监',
          score: 92,
          result: 'passed',
          feedback: '综合素质良好，团队协作能力强，符合岗位要求'
        }
      ]

      setInterviews(mockInterviews)
    } catch (error) {
      console.error('加载面试数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadInterviewData()
  })

  // 获取结果样式
  const getResultStyle = (result: string) => {
    switch (result) {
      case 'passed':
        return {bg: 'bg-green-100', text: 'text-muted-foreground', label: '已通过'}
      case 'failed':
        return {bg: 'bg-red-100', text: 'text-red-600', label: '未通过'}
      case 'pending':
        return {bg: 'bg-yellow-100', text: 'text-yellow-600', label: '待定'}
      default:
        return {bg: 'bg-gray-50', text: 'text-muted-foreground', label: '未知'}
    }
  }

  // 获取评分等级
  const getScoreLevel = (score: number) => {
    if (score >= 90) return {label: '优秀', color: 'text-muted-foreground'}
    if (score >= 80) return {label: '良好', color: 'text-muted-foreground'}
    if (score >= 70) return {label: '中等', color: 'text-yellow-600'}
    if (score >= 60) return {label: '及格', color: 'text-muted-foreground'}
    return {label: '不及格', color: 'text-red-600'}
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 max-sm:p-3 space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
          {/* 页面标题 */}
          <PageHeader icon="i-mdi-calendar-account" title="我的面试" description="查看您的面试记录和面试安排" />

          {loading ? (
            <>
              {/* 加载状态 */}
              <LoadingCards count={3} />
            </>
          ) : interviews.length === 0 ? (
            <>
              {/* 空状态 */}
              <EmptyState
                icon="i-mdi-calendar-account"
                title="暂无面试记录"
                description="您还没有面试记录"
                action={{
                  label: '刷新',
                  onClick: loadInterviewData
                }}
              />
            </>
          ) : (
            <>
              {/* 面试状态卡片 */}
              <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 shadow-sm">
                <View className="flex items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-information text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                  <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                    面试状态
                  </Text>
                </View>
                <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                  {interviews.every((i) => i.result === 'passed') ? (
                    <View className="flex items-center justify-between p-4 max-sm:p-3 bg-blue-100 rounded-lg">
                      <View className="flex items-center">
                        <View className="i-mdi-check-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-3 max-sm:mr-2" />
                        <View>
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">
                            面试已通过
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                            恭喜您通过面试！
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : interviews.some((i) => i.result === 'pending') ? (
                    <View className="flex items-center justify-between p-4 max-sm:p-3 bg-blue-100 rounded-lg">
                      <View className="flex items-center">
                        <View className="i-mdi-clock-outline text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-yellow-600 mr-3 max-sm:mr-2" />
                        <View>
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-yellow-600">
                            面试进行中
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-yellow-600 mt-1">请耐心等待面试结果</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View className="flex items-center justify-between p-4 max-sm:p-3 bg-blue-100 rounded-lg">
                      <View className="flex items-center">
                        <View className="i-mdi-close-circle text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-red-600 mr-3 max-sm:mr-2" />
                        <View>
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-red-600">
                            面试未通过
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-red-600 mt-1">感谢您的参与</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* 面试记录 */}
              <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 shadow-sm">
                <View className="flex items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <View className="i-mdi-history text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                  <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                    面试记录
                  </Text>
                </View>
                <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                  {interviews.map((interview) => {
                    const resultStyle = getResultStyle(interview.result)
                    const scoreLevel = getScoreLevel(interview.score)
                    return (
                      <View key={interview.id} className="p-4 max-sm:p-3 bg-gray-50/30 rounded-lg">
                        <View className="flex items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                            {interview.interview_type}
                          </Text>
                          <View className={`${resultStyle.bg} px-3 max-sm:px-2 py-1 rounded-full`}>
                            <Text className={`text-xs max-sm:text-[10px] ${resultStyle.text} font-medium`}>
                              {resultStyle.label}
                            </Text>
                          </View>
                        </View>
                        <View className="space-y-2 max-sm:space-y-1.5">
                          <View className="flex items-center">
                            <View className="i-mdi-calendar text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              面试时间：{interview.interview_date}
                            </Text>
                          </View>
                          {interview.interviewer_name && (
                            <View className="flex items-center">
                              <View className="i-mdi-account text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                                面试官：{interview.interviewer_name}
                              </Text>
                            </View>
                          )}
                          <View className="flex items-center">
                            <View className="i-mdi-star text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              评分：{interview.score}分 ({scoreLevel.label})
                            </Text>
                          </View>
                          {interview.feedback && (
                            <View className="mt-2 p-3 bg-gray-50/50 rounded-lg">
                              <Text className="text-xs max-sm:text-[10px] text-muted-foreground font-medium mb-1">
                                面试反馈：
                              </Text>
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                                {interview.feedback}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default MyInterview
