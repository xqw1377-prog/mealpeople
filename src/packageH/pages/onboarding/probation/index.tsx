/**
 * 试用期页面
 * 显示员工的试用期信息和转正进度
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  EmptyState,
  LabeledProgressBar,
  LoadingCard,
  LoadingCards,
  PageHeader,
  SimpleStatCard
} from '@/components/common'
import {getEmployeeByUserId} from '@/db/api'

// 试用期信息类型
interface ProbationInfo {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  total_days: number
  passed_days: number
  remaining_days: number
  progress: number
  status: string
}

// 考核评分类型
interface EvaluationScore {
  id: string
  category: string
  score: number
  max_score: number
  evaluator_name?: string
  evaluation_date: string
  comments?: string
}

const MyProbation: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [probationInfo, setProbationInfo] = useState<ProbationInfo | null>(null)
  const [evaluations, setEvaluations] = useState<EvaluationScore[]>([])
  const [loading, setLoading] = useState(true)

  // 加载试用期数据
  const loadProbationData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 这里使用模拟数据，实际应该调用API
      // const [probation, scores] = await Promise.all([
      //   getProbationInfo(employee.id, employee.tenant_id),
      //   getEvaluationScores(employee.id, employee.tenant_id)
      // ])

      // 模拟试用期数据
      const startDate = new Date('2024-01-25')
      const endDate = new Date('2024-04-25')
      const today = new Date()
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const passedDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const remainingDays = Math.max(0, totalDays - passedDays)
      const progress = Math.min(100, Math.round((passedDays / totalDays) * 100))

      const mockProbation: ProbationInfo = {
        id: '1',
        employee_id: employee.id,
        start_date: '2024-01-25',
        end_date: '2024-04-25',
        total_days: totalDays,
        passed_days: passedDays,
        remaining_days: remainingDays,
        progress: progress,
        status: 'in_progress'
      }

      // 模拟考核评分数据
      const mockEvaluations: EvaluationScore[] = [
        {
          id: '1',
          category: '工作态度',
          score: 95,
          max_score: 100,
          evaluator_name: '张经理',
          evaluation_date: '2024-02-25',
          comments: '工作态度积极主动，责任心强'
        },
        {
          id: '2',
          category: '专业技能',
          score: 88,
          max_score: 100,
          evaluator_name: '李主管',
          evaluation_date: '2024-02-25',
          comments: '专业技能扎实，学习能力强'
        },
        {
          id: '3',
          category: '团队协作',
          score: 92,
          max_score: 100,
          evaluator_name: '王组长',
          evaluation_date: '2024-02-25',
          comments: '团队协作能力优秀，沟通顺畅'
        },
        {
          id: '4',
          category: '学习能力',
          score: 90,
          max_score: 100,
          evaluator_name: '张经理',
          evaluation_date: '2024-02-25',
          comments: '学习能力强，快速适应新环境'
        },
        {
          id: '5',
          category: '工作效率',
          score: 85,
          max_score: 100,
          evaluator_name: '李主管',
          evaluation_date: '2024-02-25',
          comments: '工作效率较高，能按时完成任务'
        }
      ]

      setProbationInfo(mockProbation)
      setEvaluations(mockEvaluations)
    } catch (error) {
      console.error('加载试用期数据失败:', error)
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
    loadProbationData()
  })

  // 获取评分等级
  const getScoreLevel = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return {label: '优秀', color: 'text-muted-foreground', bg: 'bg-green-100'}
    if (percentage >= 80) return {label: '良好', color: 'text-muted-foreground', bg: 'bg-blue-100'}
    if (percentage >= 70) return {label: '合格', color: 'text-yellow-600', bg: 'bg-yellow-100'}
    return {label: '待提升', color: 'text-red-600', bg: 'bg-red-100'}
  }

  // 计算平均分
  const calculateAverageScore = () => {
    if (evaluations.length === 0) return 0
    const totalScore = evaluations.reduce((sum, e) => sum + (e.score / e.max_score) * 100, 0)
    return Math.round(totalScore / evaluations.length)
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <PageHeader icon="i-mdi-clock-check" title="我的试用期" description="查看您的试用期信息和转正进度" />

          {loading ? (
            <>
              {/* 加载状态 */}
              <LoadingCard />
              <LoadingCards count={2} />
            </>
          ) : !probationInfo ? (
            <>
              {/* 空状态 */}
              <EmptyState
                icon="i-mdi-clock-check"
                title="暂无试用期信息"
                description="您还没有试用期记录"
                action={{
                  label: '刷新',
                  onClick: loadProbationData
                }}
              />
            </>
          ) : (
            <>
              {/* 试用期进度卡片 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex items-center mb-4">
                  <View className="i-mdi-progress-clock text-2xl text-blue-600 mr-2" />
                  <Text className="text-lg font-bold text-foreground">试用期进度</Text>
                </View>

                {/* 日期信息 */}
                <View className="grid grid-cols-3 gap-3 mb-4">
                  <SimpleStatCard label="已过天数" value={probationInfo.passed_days} color="text-muted-foreground" />
                  <SimpleStatCard label="剩余天数" value={probationInfo.remaining_days} color="text-muted-foreground" />
                  <SimpleStatCard label="总天数" value={probationInfo.total_days} color="text-muted-foreground" />
                </View>

                {/* 日期范围 */}
                <View className="flex items-center justify-between mb-4 p-3 bg-gray-50/30 rounded-lg">
                  <View>
                    <Text className="text-xs text-muted-foreground">开始日期</Text>
                    <Text className="text-sm font-bold text-foreground mt-1">{probationInfo.start_date}</Text>
                  </View>
                  <View className="i-mdi-arrow-right text-xl text-muted-foreground" />
                  <View className="text-right">
                    <Text className="text-xs text-muted-foreground">结束日期</Text>
                    <Text className="text-sm font-bold text-foreground mt-1">{probationInfo.end_date}</Text>
                  </View>
                </View>

                {/* 进度条 */}
                <View>
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm text-muted-foreground">试用期进度</Text>
                    <Text className="text-sm font-bold text-blue-600">{probationInfo.progress}%</Text>
                  </View>
                  <View className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-100 transition-all duration-300"
                      style={{width: `${probationInfo.progress}%`}}
                    />
                  </View>
                  {probationInfo.remaining_days > 0 && (
                    <Text className="text-xs text-muted-foreground mt-2 text-center">
                      还有 {probationInfo.remaining_days} 天转正
                    </Text>
                  )}
                </View>
              </View>

              {/* 考核评分统计 */}
              {evaluations.length > 0 && (
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-center mb-4">
                    <View className="i-mdi-chart-box text-2xl text-blue-600 mr-2" />
                    <Text className="text-lg font-bold text-foreground">考核统计</Text>
                  </View>
                  <View className="grid grid-cols-2 gap-3">
                    <View className="text-center p-4 bg-blue-100 rounded-lg">
                      <Text className="text-3xl font-bold text-blue-600 block mb-1">{calculateAverageScore()}</Text>
                      <Text className="text-xs text-muted-foreground block">平均分</Text>
                    </View>
                    <View className="text-center p-4 bg-blue-100 rounded-lg">
                      <Text className="text-3xl font-bold text-muted-foreground block mb-1">{evaluations.length}</Text>
                      <Text className="text-xs text-muted-foreground block">考核项</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 转正考核详情 */}
              {evaluations.length > 0 && (
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-center mb-4">
                    <View className="i-mdi-clipboard-check text-2xl text-blue-600 mr-2" />
                    <Text className="text-lg font-bold text-foreground">转正考核</Text>
                  </View>
                  <View className="space-y-3">
                    {evaluations.map((evaluation) => {
                      const level = getScoreLevel(evaluation.score, evaluation.max_score)
                      const percentage = Math.round((evaluation.score / evaluation.max_score) * 100)
                      return (
                        <View key={evaluation.id} className="p-4 bg-gray-50/30 rounded-lg">
                          <View className="flex items-center justify-between mb-3">
                            <Text className="text-base font-bold text-foreground">{evaluation.category}</Text>
                            <View className={`${level.bg} px-3 py-1 rounded-full`}>
                              <Text className={`text-xs ${level.color} font-medium`}>{level.label}</Text>
                            </View>
                          </View>

                          {/* 评分进度条 */}
                          <LabeledProgressBar
                            label={`${evaluation.score}/${evaluation.max_score}分`}
                            progress={percentage}
                            color="bg-blue-100"
                            showPercentage={false}
                          />

                          {/* 评价信息 */}
                          {(evaluation.evaluator_name || evaluation.evaluation_date) && (
                            <View className="flex items-center justify-between mt-2">
                              {evaluation.evaluator_name && (
                                <View className="flex items-center">
                                  <View className="i-mdi-account text-sm text-muted-foreground mr-1" />
                                  <Text className="text-xs text-muted-foreground">{evaluation.evaluator_name}</Text>
                                </View>
                              )}
                              {evaluation.evaluation_date && (
                                <Text className="text-xs text-muted-foreground">{evaluation.evaluation_date}</Text>
                              )}
                            </View>
                          )}

                          {/* 评价意见 */}
                          {evaluation.comments && (
                            <View className="mt-2 p-3 bg-gray-50/50 rounded-lg">
                              <Text className="text-xs text-muted-foreground font-medium mb-1">评价意见：</Text>
                              <Text className="text-sm text-foreground">{evaluation.comments}</Text>
                            </View>
                          )}
                        </View>
                      )
                    })}
                  </View>
                </View>
              )}

              {/* 转正提示 */}
              {probationInfo.remaining_days <= 7 && probationInfo.remaining_days > 0 && (
                <View className="bg-blue-100 rounded-lg p-6 shadow-sm border-2 border-yellow-200">
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-alert-circle text-2xl text-yellow-600 mr-2" />
                    <Text className="text-lg font-bold text-yellow-600">转正提醒</Text>
                  </View>
                  <Text className="text-sm text-yellow-700 leading-relaxed">
                    您的试用期即将结束，还有 {probationInfo.remaining_days}{' '}
                    天。请做好转正准备，如有疑问请及时联系您的直属主管。
                  </Text>
                </View>
              )}

              {/* 已转正提示 */}
              {probationInfo.remaining_days <= 0 && (
                <View className="bg-blue-100 rounded-lg p-6 shadow-sm border-2 border-green-200">
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-check-circle text-2xl text-muted-foreground mr-2" />
                    <Text className="text-lg font-bold text-muted-foreground">恭喜转正</Text>
                  </View>
                  <Text className="text-sm text-green-600 leading-relaxed">
                    恭喜您已完成试用期，正式成为公司的一员！期待您在未来的工作中继续发光发热！
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default MyProbation
