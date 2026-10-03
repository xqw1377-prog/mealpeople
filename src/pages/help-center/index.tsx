/**
 * 帮助中心页面
 * 提供常见问题解答和使用指南
 * 支持问题反馈功能
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api-employees'
import {
  createHelpArticleFeedback,
  getArticleFeedbackStats,
  getEmployeeArticleFeedback
} from '@/db/api-onboarding-enhancement'
import {useTenantStore} from '@/store/tenant'

// 帮助分类
interface HelpCategory {
  id: string
  name: string
  icon: string
  items: HelpItem[]
}

// 帮助项
interface HelpItem {
  id: string
  question: string
  answer: string
}

export default function HelpCenter() {
  const {user} = useAuth()
  const {currentTenant} = useTenantStore()
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState<string>('')
  const [feedbacks, setFeedbacks] = useState<Map<string, boolean>>(new Map())
  const [feedbackStats, setFeedbackStats] = useState<Map<string, {helpful: number; notHelpful: number}>>(new Map())

  // 帮助内容
  const helpCategories: HelpCategory[] = [
    {
      id: 'onboarding',
      name: '入职管理',
      icon: 'i-mdi-account-plus',
      items: [
        {
          id: 'onboarding_1',
          question: '如何查看我的入职流程？',
          answer: '在"我的成长"页面中，点击"我的入职"即可查看完整的入职流程和进度。'
        },
        {
          id: 'onboarding_2',
          question: '入职任务如何完成？',
          answer: '进入"入职任务"页面，按照任务清单逐项完成。完成后点击"标记完成"按钮。'
        },
        {
          id: 'onboarding_3',
          question: '入职资料如何上传？',
          answer: '在"入职资料"页面中，点击对应资料的"上传"按钮，选择文件后上传。请确保文件清晰可见。'
        },
        {
          id: 'onboarding_4',
          question: '如何学习入职手册？',
          answer: '在"我的学习中心"中点击"入职手册"，阅读完每个章节后点击"标记为已读"按钮记录进度。'
        },
        {
          id: 'onboarding_5',
          question: '如何完成培训课程？',
          answer: '在"我的学习中心"中点击"培训课程"，选择课程学习，完成后点击"标记为已完成"按钮。'
        }
      ]
    },
    {
      id: 'work',
      name: '在职管理',
      icon: 'i-mdi-briefcase',
      items: [
        {
          id: 'work_1',
          question: '如何查看我的考勤记录？',
          answer: '在"我的成长"页面中，点击"我的考勤"即可查看详细的考勤记录和统计。'
        },
        {
          id: 'work_2',
          question: '如何申请请假？',
          answer: '在"我的成长"页面中，点击"我的请假"，然后点击"申请请假"按钮，填写请假信息后提交。'
        },
        {
          id: 'work_3',
          question: '如何查看我的绩效？',
          answer: '在"我的成长"页面中，点击"我的绩效"即可查看绩效评分和详细评价。'
        },
        {
          id: 'work_4',
          question: '如何查看我的薪酬？',
          answer: '在"我的成长"页面中，点击"我的薪酬"即可查看薪资明细和历史记录。'
        }
      ]
    },
    {
      id: 'resignation',
      name: '离职管理',
      icon: 'i-mdi-exit-to-app',
      items: [
        {
          id: 'resignation_1',
          question: '如何提交离职申请？',
          answer: '在"我的成长"页面中，点击"离职申请"，填写离职信息后提交。离职申请需要经过审批流程。'
        },
        {
          id: 'resignation_2',
          question: '如何查看离职进度？',
          answer: '提交离职申请后，可以在"离职进度查询"页面查看详细的办理进度和各环节状态。'
        },
        {
          id: 'resignation_3',
          question: '离职流程需要多长时间？',
          answer: '离职流程通常需要30天，包括审批、工作交接、资产归还、离职面谈等环节。'
        }
      ]
    },
    {
      id: 'work_log',
      name: '工作记录',
      icon: 'i-mdi-notebook',
      items: [
        {
          id: 'work_log_1',
          question: '如何记录工作日志？',
          answer: '在"工作记录"页面中，点击"+"按钮，填写工作内容、完成情况等信息后提交。'
        },
        {
          id: 'work_log_2',
          question: '工作日志可以修改吗？',
          answer: '已提交的工作日志可以在当天进行修改，次日后将无法修改。'
        },
        {
          id: 'work_log_3',
          question: '如何查看历史工作日志？',
          answer: '在"工作记录"页面中，使用日期筛选功能可以查看任意日期的工作日志。'
        }
      ]
    },
    {
      id: 'learning',
      name: '学习成长',
      icon: 'i-mdi-school',
      items: [
        {
          id: 'learning_1',
          question: '如何查看我的学习进度？',
          answer: '在"我的学习中心"页面可以查看入职手册、培训课程的学习进度和获得的成就徽章。'
        },
        {
          id: 'learning_2',
          question: '如何获得学习成就？',
          answer: '完成所有入职手册章节可获得"手册达人"成就，完成所有培训课程可获得"培训达人"成就。'
        },
        {
          id: 'learning_3',
          question: '如何联系HR咨询问题？',
          answer: '在"联系HR"页面可以提交在线留言，HR会在1个工作日内回复。紧急事项可直接拨打电话。'
        }
      ]
    }
  ]

  // 加载员工信息和反馈数据
  const loadData = useCallback(async () => {
    if (!currentTenant || !user) return

    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) return

      setEmployeeId(employee.id)

      // 加载所有文章的反馈状态
      const feedbackMap = new Map<string, boolean>()
      const statsMap = new Map<string, {helpful: number; notHelpful: number}>()

      for (const category of helpCategories) {
        for (const item of category.items) {
          // 获取用户的反馈
          const feedback = await getEmployeeArticleFeedback(employee.id, item.id)
          if (feedback) {
            feedbackMap.set(item.id, feedback.is_helpful)
          }

          // 获取文章的反馈统计
          const stats = await getArticleFeedbackStats(item.id)
          statsMap.set(item.id, stats)
        }
      }

      setFeedbacks(feedbackMap)
      setFeedbackStats(statsMap)
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }, [currentTenant, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  // 切换展开/收起
  const toggleItem = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId)
  }

  // 提交反馈
  const handleFeedback = async (articleId: string, isHelpful: boolean) => {
    if (!employeeId || !currentTenant) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    try {
      await createHelpArticleFeedback({
        tenant_id: currentTenant.id,
        employee_id: employeeId,
        article_id: articleId,
        is_helpful: isHelpful
      })

      // 更新本地状态
      setFeedbacks((prev) => new Map(prev).set(articleId, isHelpful))

      // 重新加载统计
      const stats = await getArticleFeedbackStats(articleId)
      setFeedbackStats((prev) => new Map(prev).set(articleId, stats))

      Taro.showToast({
        title: '感谢您的反馈',
        icon: 'success'
      })
    } catch (error) {
      console.error('提交反馈失败:', error)
      Taro.showToast({
        title: '提交失败',
        icon: 'none'
      })
    }
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <ScrollView scrollY className="h-screen" enableBackToTop>
        {/* 头部 */}
        <View className="bg-gradient-to-r from-primary to-primary-glow p-6">
          <View className="flex items-center justify-between mb-4">
            <View className="flex items-center gap-3">
              <View
                className="i-mdi-arrow-left text-2xl text-white cursor-pointer"
                onClick={() => Taro.navigateBack()}></View>
              <Text className="text-2xl font-bold text-white">帮助中心</Text>
            </View>
            <View className="i-mdi-help-circle text-3xl text-white"></View>
          </View>

          <View className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <Text className="text-sm text-white/90 leading-relaxed">
              这里汇总了常见问题和使用指南，如果没有找到答案，可以通过"联系HR"页面提交留言咨询。
            </Text>
          </View>
        </View>

        {/* 内容区域 */}
        <View className="p-6">
          {helpCategories.map((category) => (
            <View key={category.id} className="mb-6">
              {/* 分类标题 */}
              <View className="flex items-center gap-3 mb-4">
                <View className={`${category.icon} text-2xl text-primary`}></View>
                <Text className="text-lg font-semibold text-foreground">{category.name}</Text>
              </View>

              {/* 问题列表 */}
              <View className="space-y-3">
                {category.items.map((item) => {
                  const isExpanded = expandedItem === item.id
                  const userFeedback = feedbacks.get(item.id)
                  const stats = feedbackStats.get(item.id)

                  return (
                    <View key={item.id} className="bg-card rounded-xl shadow-sm overflow-hidden">
                      {/* 问题标题 */}
                      <View
                        className="p-4 flex items-center justify-between cursor-pointer active:bg-muted/30 transition-colors"
                        onClick={() => toggleItem(item.id)}>
                        <View className="flex items-start gap-3 flex-1">
                          <View className="i-mdi-help-circle-outline text-xl text-primary mt-0.5"></View>
                          <Text className="text-sm font-medium text-foreground flex-1">{item.question}</Text>
                        </View>
                        <View
                          className={`i-mdi-chevron-down text-xl text-muted-foreground transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}></View>
                      </View>

                      {/* 答案内容 */}
                      {isExpanded && (
                        <View className="px-4 pb-4">
                          <View className="bg-muted/20 rounded-lg p-4 mb-3">
                            <Text className="text-sm text-foreground leading-relaxed">{item.answer}</Text>
                          </View>

                          {/* 反馈按钮 */}
                          <View className="border-t border-border pt-3">
                            <Text className="text-xs text-muted-foreground mb-3">这个回答对您有帮助吗？</Text>
                            <View className="flex items-center gap-3">
                              <Button
                                className={`flex-1 py-2 rounded-lg break-keep text-sm ${
                                  userFeedback === true ? 'bg-green-500 text-white' : 'bg-muted/30 text-foreground'
                                }`}
                                size="default"
                                onClick={() => handleFeedback(item.id, true)}>
                                <View className="flex items-center justify-center gap-2">
                                  <View className="i-mdi-thumb-up text-base"></View>
                                  <Text className="text-sm">
                                    有帮助 {stats && stats.helpful > 0 ? `(${stats.helpful})` : ''}
                                  </Text>
                                </View>
                              </Button>
                              <Button
                                className={`flex-1 py-2 rounded-lg break-keep text-sm ${
                                  userFeedback === false ? 'bg-orange-500 text-white' : 'bg-muted/30 text-foreground'
                                }`}
                                size="default"
                                onClick={() => handleFeedback(item.id, false)}>
                                <View className="flex items-center justify-center gap-2">
                                  <View className="i-mdi-thumb-down text-base"></View>
                                  <Text className="text-sm">
                                    没帮助 {stats && stats.notHelpful > 0 ? `(${stats.notHelpful})` : ''}
                                  </Text>
                                </View>
                              </Button>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            </View>
          ))}

          {/* 联系HR提示 */}
          <View className="bg-blue-50 rounded-xl p-5 mt-4">
            <View className="flex items-start gap-3">
              <View className="i-mdi-information text-2xl text-blue-600 mt-0.5"></View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-blue-900 mb-2">没有找到答案？</Text>
                <Text className="text-xs text-blue-700 leading-relaxed mb-3">
                  如果以上内容没有解决您的问题，欢迎通过"联系HR"页面提交留言，我们会尽快为您解答。
                </Text>
                <View
                  className="bg-blue-600 rounded-lg py-2 px-4 flex items-center justify-center active:opacity-70"
                  onClick={() => Taro.navigateTo({url: '/packageN/pages/contact-hr/index'})}>
                  <View className="flex items-center gap-2">
                    <View className="i-mdi-message-text text-base text-white"></View>
                    <Text className="text-sm text-white font-medium">联系HR</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 底部间距 */}
        <View className="h-20"></View>
      </ScrollView>
    </View>
  )
}
