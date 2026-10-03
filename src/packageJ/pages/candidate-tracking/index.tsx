/**
 * 候选人全流程追踪页面
 * 从第一次面试到入职完成的完整流程可视化
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useCallback, useState} from 'react'

// 流程阶段
type StageStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'skipped'

// 流程步骤
interface ProcessStep {
  id: string
  name: string
  description: string
  status: StageStatus
  completedAt?: string
  handler?: string
  comment?: string
  action?: string
}

// 流程阶段
interface ProcessStage {
  id: string
  name: string
  icon: string
  status: StageStatus
  steps: ProcessStep[]
}

// 候选人信息
interface CandidateInfo {
  id: string
  name: string
  phone: string
  email: string
  position: string
  department: string
  applyDate: string
  currentStage: string
  currentStatus: string
}

export default function CandidateTracking() {
  const router = useRouter()
  const candidateId = router.params.id || 'candidate_001'

  const [loading, setLoading] = useState(false)
  const [candidate, setCandidate] = useState<CandidateInfo | null>(null)
  const [stages, setStages] = useState<ProcessStage[]>([])

  // 加载候选人流程数据
  const loadCandidateProcess = useCallback(async () => {
    setLoading(true)
    try {
      // 模拟数据 - 实际应从数据库加载
      const mockCandidate: CandidateInfo = {
        id: candidateId,
        name: '张三',
        phone: '138****8888',
        email: 'zhangsan@example.com',
        position: '前端工程师',
        department: '技术部',
        applyDate: '2025-10-15',
        currentStage: '入职阶段',
        currentStatus: '试用期中'
      }

      const mockStages: ProcessStage[] = [
        {
          id: 'recruitment',
          name: '招聘阶段',
          icon: 'i-mdi-account-search',
          status: 'completed',
          steps: [
            {
              id: 'resume_submit',
              name: '简历投递',
              description: '候选人提交简历',
              status: 'completed',
              completedAt: '2025-10-15 10:00:00',
              handler: '张三'
            },
            {
              id: 'resume_screening',
              name: '简历筛选',
              description: 'HR初步筛选简历',
              status: 'completed',
              completedAt: '2025-10-16 14:30:00',
              handler: 'HR-王小姐',
              comment: '简历符合要求，邀约面试'
            },
            {
              id: 'interview_invitation',
              name: '面试邀约',
              description: '发送面试邀请',
              status: 'completed',
              completedAt: '2025-10-17 09:00:00',
              handler: 'HR-王小姐'
            },
            {
              id: 'first_interview',
              name: '初试',
              description: 'HR面试',
              status: 'completed',
              completedAt: '2025-10-18 15:00:00',
              handler: 'HR-王小姐',
              comment: '沟通能力强，基本素质良好，推荐进入复试'
            },
            {
              id: 'second_interview',
              name: '复试',
              description: '技术面试',
              status: 'completed',
              completedAt: '2025-10-20 10:30:00',
              handler: '技术经理-李工',
              comment: '技术能力扎实，项目经验丰富，推荐录用'
            },
            {
              id: 'final_interview',
              name: '终试',
              description: '总经理面试',
              status: 'completed',
              completedAt: '2025-10-22 16:00:00',
              handler: '总经理-陈总',
              comment: '价值观匹配，发展潜力大，同意录用'
            },
            {
              id: 'background_check',
              name: '背景调查',
              description: '核实候选人信息',
              status: 'completed',
              completedAt: '2025-10-24 11:00:00',
              handler: 'HR-王小姐',
              comment: '背景调查通过'
            },
            {
              id: 'hiring_decision',
              name: '录用决策',
              description: '最终录用决定',
              status: 'completed',
              completedAt: '2025-10-25 09:30:00',
              handler: 'HR总监-赵总',
              comment: '同意录用，薪资15K，职级P5'
            }
          ]
        },
        {
          id: 'pre_onboarding',
          name: '入职准备阶段',
          icon: 'i-mdi-file-document-edit',
          status: 'completed',
          steps: [
            {
              id: 'offer_sent',
              name: 'Offer发放',
              description: '发送录用通知',
              status: 'completed',
              completedAt: '2025-10-26 10:00:00',
              handler: 'HR-王小姐'
            },
            {
              id: 'offer_accepted',
              name: 'Offer接受',
              description: '候选人接受Offer',
              status: 'completed',
              completedAt: '2025-10-27 14:00:00',
              handler: '张三',
              comment: '接受Offer，预计11月5日入职'
            },
            {
              id: 'contract_signing',
              name: '合同签订',
              description: '签订劳动合同',
              status: 'completed',
              completedAt: '2025-11-04 15:30:00',
              handler: 'HR-王小姐'
            },
            {
              id: 'onboarding_preparation',
              name: '入职准备',
              description: '准备工位和设备',
              status: 'completed',
              completedAt: '2025-11-04 17:00:00',
              handler: 'IT-小刘、行政-小周'
            }
          ]
        },
        {
          id: 'onboarding',
          name: '入职阶段',
          icon: 'i-mdi-account-plus',
          status: 'processing',
          steps: [
            {
              id: 'checkin',
              name: '入职报到',
              description: '员工到岗报到',
              status: 'completed',
              completedAt: '2025-11-05 09:00:00',
              handler: 'HR-王小姐'
            },
            {
              id: 'documents_submit',
              name: '资料提交',
              description: '提交入职资料',
              status: 'completed',
              completedAt: '2025-11-05 10:30:00',
              handler: '张三'
            },
            {
              id: 'documents_review',
              name: '资料审核',
              description: 'HR审核入职资料',
              status: 'completed',
              completedAt: '2025-11-05 14:00:00',
              handler: 'HR-王小姐',
              comment: '资料齐全，审核通过'
            },
            {
              id: 'orientation_training',
              name: '入职培训',
              description: '公司文化和制度培训',
              status: 'completed',
              completedAt: '2025-11-06 17:00:00',
              handler: '培训部-小张'
            },
            {
              id: 'onboarding_tasks',
              name: '入职任务',
              description: '完成入职任务清单',
              status: 'completed',
              completedAt: '2025-11-08 18:00:00',
              handler: '导师-李工'
            },
            {
              id: 'probation',
              name: '试用期',
              description: '试用期工作表现',
              status: 'processing',
              handler: '直属主管-李经理',
              comment: '试用期进行中，预计2026-02-05转正'
            },
            {
              id: 'probation_evaluation',
              name: '试用期评估',
              description: '评估试用期表现',
              status: 'pending'
            },
            {
              id: 'conversion',
              name: '转正',
              description: '正式转正',
              status: 'pending'
            }
          ]
        },
        {
          id: 'working',
          name: '在职阶段',
          icon: 'i-mdi-briefcase',
          status: 'pending',
          steps: [
            {
              id: 'daily_work',
              name: '日常工作',
              description: '正式员工工作',
              status: 'pending'
            }
          ]
        }
      ]

      setCandidate(mockCandidate)
      setStages(mockStages)
    } catch (error) {
      console.error('加载候选人流程失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [candidateId])

  useDidShow(() => {
    loadCandidateProcess()
  })

  // 获取状态图标
  const getStatusIcon = (status: StageStatus) => {
    const iconMap = {
      pending: 'i-mdi-circle-outline',
      processing: 'i-mdi-progress-clock',
      completed: 'i-mdi-check-circle',
      rejected: 'i-mdi-close-circle',
      skipped: 'i-mdi-minus-circle'
    }
    return iconMap[status]
  }

  // 获取状态颜色
  const getStatusColor = (status: StageStatus) => {
    const colorMap = {
      pending: 'text-gray-400',
      processing: 'text-blue-500',
      completed: 'text-green-500',
      rejected: 'text-red-500',
      skipped: 'text-gray-400'
    }
    return colorMap[status]
  }

  // 获取状态文本
  const getStatusText = (status: StageStatus) => {
    const textMap = {
      pending: '待处理',
      processing: '进行中',
      completed: '已完成',
      rejected: '已驳回',
      skipped: '已跳过'
    }
    return textMap[status]
  }

  if (loading) {
    return (
      <View className="@container min-h-screen bg-gray-50">
        <View className="flex items-center justify-center" style={{height: '100vh'}}>
          <View className="i-mdi-loading animate-spin text-4xl max-sm:text-3xl text-blue-600" />
          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-2">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!candidate) {
    return (
      <View className="@container min-h-screen bg-gray-50">
        <View className="flex flex-col items-center justify-center p-8 max-sm:p-6" style={{height: '100vh'}}>
          <View className="i-mdi-account-off text-6xl text-muted-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
            候选人不存在
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 候选人信息卡片 */}
          <View className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md">
            <View className="flex items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <View className="i-mdi-account text-4xl max-sm:text-3xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground block">
                  {candidate.name}
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground block">
                  {candidate.position}
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mt-1">
                  {candidate.department}
                </Text>
              </View>
            </View>

            <View className="grid grid-cols-2 gap-3 max-sm:gap-2 max-sm:gap-1.5">
              <View className="flex flex-col">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">申请日期</Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mt-1">
                  {candidate.applyDate}
                </Text>
              </View>
              <View className="flex flex-col">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">当前阶段</Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mt-1">
                  {candidate.currentStage}
                </Text>
              </View>
              <View className="flex flex-col">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">联系电话</Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mt-1">
                  {candidate.phone}
                </Text>
              </View>
              <View className="flex flex-col">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">当前状态</Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mt-1">
                  {candidate.currentStatus}
                </Text>
              </View>
            </View>
          </View>

          {/* 流程时间线 */}
          {stages.map((stage, _stageIndex) => (
            <View
              key={stage.id}
              className="bg-white rounded-xl mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5 shadow-md overflow-hidden">
              {/* 阶段标题 */}
              <View className="p-4 max-sm:p-3 border-b border-border flex items-center">
                <View
                  className={`${stage.icon} text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] ${getStatusColor(stage.status)} mr-3 max-sm:mr-2`}
                />
                <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-semibold text-foreground flex-1">
                  {stage.name}
                </Text>
                <View
                  className={`px-2 py-1 rounded ${
                    stage.status === 'completed'
                      ? 'bg-green-100'
                      : stage.status === 'processing'
                        ? 'bg-blue-100'
                        : 'bg-gray-50'
                  }`}>
                  <Text
                    className={`text-xs max-sm:text-[10px] ${
                      stage.status === 'completed'
                        ? 'text-muted-foreground'
                        : stage.status === 'processing'
                          ? 'text-muted-foreground'
                          : 'text-gray-600'
                    }`}>
                    {getStatusText(stage.status)}
                  </Text>
                </View>
              </View>

              {/* 步骤列表 */}
              <View className="p-4 max-sm:p-3">
                {stage.steps.map((step, stepIndex) => (
                  <View key={step.id} className="flex items-start mb-6 last:mb-0">
                    {/* 时间线 */}
                    <View className="relative flex flex-col items-center mr-4">
                      <View
                        className={`${getStatusIcon(step.status)} text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] ${getStatusColor(step.status)}`}
                      />
                      {stepIndex < stage.steps.length - 1 && (
                        <View
                          className={`w-0.5 h-16 mt-2 ${step.status === 'completed' ? 'bg-blue-100' : 'bg-gray-300'}`}
                        />
                      )}
                    </View>

                    {/* 步骤内容 */}
                    <View className="flex-1">
                      <View className="flex items-center justify-between mb-1">
                        <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                          {step.name}
                        </Text>
                        {step.status === 'processing' && (
                          <View className="px-2 py-1 bg-blue-100 rounded">
                            <Text className="text-xs max-sm:text-[10px] text-muted-foreground">进行中</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-2 max-sm:mb-1.5">
                        {step.description}
                      </Text>

                      {step.handler && (
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground">处理人：{step.handler}</Text>
                      )}

                      {step.completedAt && (
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                          完成时间：{step.completedAt}
                        </Text>
                      )}

                      {step.comment && (
                        <View className="mt-2 p-2 bg-blue-100 rounded">
                          <Text className="text-xs max-sm:text-[10px] text-green-600">{step.comment}</Text>
                        </View>
                      )}

                      {step.action && step.status === 'processing' && (
                        <Button
                          className="mt-2 bg-blue-100 text-white py-2 px-4 max-sm:px-3 max-sm:px-2 rounded break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                          size="default"
                          onClick={() => Taro.showToast({title: '功能开发中', icon: 'none'})}>
                          {step.action}
                        </Button>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* 操作按钮 */}
          <View className="mb-2 max-sm:mb-1.50">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px]"
              size="default"
              onClick={() => Taro.navigateBack()}>
              返回
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
