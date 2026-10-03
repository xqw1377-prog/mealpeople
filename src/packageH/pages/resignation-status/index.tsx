/**
 * 离职进度查询页面
 * 展示员工离职申请的审批进度和办理状态
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {useTenantStore} from '@/store/tenant'

// 离职申请状态
type ResignationStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled'

// 离职流程步骤
interface ResignationStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  completedAt?: string
  handler?: string
  comment?: string
}

// 离职申请信息
interface ResignationApplication {
  id: string
  employeeName: string
  department: string
  position: string
  applyDate: string
  expectedDate: string
  reason: string
  status: ResignationStatus
  currentStep: number
  steps: ResignationStep[]
}

export default function ResignationStatus() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [loading, setLoading] = useState(false)
  const [application, setApplication] = useState<ResignationApplication | null>(null)

  // 加载离职申请数据
  const loadResignationStatus = useCallback(async () => {
    if (!user?.id || !currentTenant?.id) return

    setLoading(true)
    try {
      // 模拟数据 - 实际应从数据库加载
      const mockApplication: ResignationApplication = {
        id: 'resign_001',
        employeeName: '张三',
        department: '技术部',
        position: '前端工程师',
        applyDate: '2025-11-20',
        expectedDate: '2025-12-20',
        reason: '个人发展原因',
        status: 'processing',
        currentStep: 2,
        steps: [
          {
            id: 'submit',
            name: '提交申请',
            description: '员工提交离职申请',
            status: 'completed',
            completedAt: '2025-11-20 10:00:00',
            handler: '张三'
          },
          {
            id: 'direct_manager',
            name: '直属主管审批',
            description: '直属主管审核离职申请',
            status: 'completed',
            completedAt: '2025-11-21 14:30:00',
            handler: '李经理',
            comment: '同意离职，感谢贡献'
          },
          {
            id: 'hr_review',
            name: 'HR审核',
            description: 'HR部门审核离职手续',
            status: 'processing',
            handler: '王HR'
          },
          {
            id: 'handover',
            name: '工作交接',
            description: '完成工作交接和资料移交',
            status: 'pending'
          },
          {
            id: 'asset_return',
            name: '资产归还',
            description: '归还公司资产和证件',
            status: 'pending'
          },
          {
            id: 'exit_interview',
            name: '离职面谈',
            description: '进行离职面谈',
            status: 'pending'
          },
          {
            id: 'final_approval',
            name: '最终审批',
            description: '总经理最终审批',
            status: 'pending'
          },
          {
            id: 'settlement',
            name: '薪资结算',
            description: '结算最后工资和补偿',
            status: 'pending'
          },
          {
            id: 'completed',
            name: '办理完成',
            description: '离职手续全部完成',
            status: 'pending'
          }
        ]
      }

      setApplication(mockApplication)
    } catch (error) {
      console.error('加载离职进度失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [user, currentTenant])

  useDidShow(() => {
    loadResignationStatus()
  })

  // 获取状态文本
  const getStatusText = (status: ResignationStatus) => {
    const statusMap = {
      pending: '待审批',
      approved: '已批准',
      rejected: '已驳回',
      processing: '办理中',
      completed: '已完成',
      cancelled: '已取消'
    }
    return statusMap[status]
  }

  // 获取状态颜色
  const getStatusColor = (status: ResignationStatus) => {
    const colorMap = {
      pending: 'bg-orange-100 text-muted-foreground',
      approved: 'bg-green-100 text-muted-foreground',
      rejected: 'bg-red-100 text-red-600',
      processing: 'bg-blue-100 text-muted-foreground',
      completed: 'bg-green-100 text-muted-foreground',
      cancelled: 'bg-gray-50 text-gray-600'
    }
    return colorMap[status]
  }

  // 获取步骤图标
  const getStepIcon = (status: ResignationStep['status']) => {
    const iconMap = {
      pending: 'i-mdi-circle-outline',
      processing: 'i-mdi-progress-clock',
      completed: 'i-mdi-check-circle',
      rejected: 'i-mdi-close-circle'
    }
    return iconMap[status]
  }

  // 获取步骤颜色
  const getStepColor = (status: ResignationStep['status']) => {
    const colorMap = {
      pending: 'text-gray-400',
      processing: 'text-blue-500',
      completed: 'text-green-500',
      rejected: 'text-red-500'
    }
    return colorMap[status]
  }

  // 撤销申请
  const handleCancel = () => {
    Taro.showModal({
      title: '确认撤销',
      content: '确定要撤销离职申请吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '撤销功能开发中',
            icon: 'none'
          })
        }
      }
    })
  }

  // 联系HR
  const handleContactHR = () => {
    Taro.showToast({
      title: '联系HR功能开发中',
      icon: 'none'
    })
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50">
        <View className="flex items-center justify-center" style={{height: '100vh'}}>
          <View className="i-mdi-loading animate-spin text-4xl text-blue-600" />
          <Text className="text-sm text-muted-foreground mt-2">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!application) {
    return (
      <View className="min-h-screen bg-gray-50">
        <View className="flex flex-col items-center justify-center p-8" style={{height: '100vh'}}>
          <View className="i-mdi-file-document-remove text-6xl text-muted-foreground mb-4" />
          <Text className="text-base text-foreground mb-2">暂无离职申请</Text>
          <Text className="text-sm text-muted-foreground mb-6">您还没有提交离职申请</Text>
          <Button
            className="bg-blue-100 text-white px-8 py-3 rounded break-keep text-base"
            size="default"
            onClick={() => Taro.navigateTo({url: '/packageH/pages/resignation-apply/index'})}>
            提交离职申请
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 申请信息卡片 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">离职申请信息</Text>
              <View className={`px-3 py-1 rounded ${getStatusColor(application.status)}`}>
                <Text className="text-sm font-medium">{getStatusText(application.status)}</Text>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex items-center">
                <View className="i-mdi-account text-lg text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground w-20">姓名</Text>
                <Text className="text-sm text-foreground">{application.employeeName}</Text>
              </View>
              <View className="flex items-center">
                <View className="i-mdi-office-building text-lg text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground w-20">部门</Text>
                <Text className="text-sm text-foreground">{application.department}</Text>
              </View>
              <View className="flex items-center">
                <View className="i-mdi-briefcase text-lg text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground w-20">职位</Text>
                <Text className="text-sm text-foreground">{application.position}</Text>
              </View>
              <View className="flex items-center">
                <View className="i-mdi-calendar text-lg text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground w-20">申请日期</Text>
                <Text className="text-sm text-foreground">{application.applyDate}</Text>
              </View>
              <View className="flex items-center">
                <View className="i-mdi-calendar-check text-lg text-muted-foreground mr-2" />
                <Text className="text-sm text-muted-foreground w-20">预计离职</Text>
                <Text className="text-sm text-foreground">{application.expectedDate}</Text>
              </View>
              <View className="flex items-start">
                <View className="i-mdi-text-box text-lg text-muted-foreground mr-2 mt-0.5" />
                <Text className="text-sm text-muted-foreground w-20">离职原因</Text>
                <Text className="text-sm text-foreground flex-1">{application.reason}</Text>
              </View>
            </View>
          </View>

          {/* 进度时间线 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-foreground mb-4">办理进度</Text>

            <View className="relative">
              {application.steps.map((step, index) => (
                <View key={step.id} className="flex items-start mb-6 last:mb-0">
                  {/* 时间线 */}
                  <View className="relative flex flex-col items-center mr-4">
                    <View className={`${getStepIcon(step.status)} text-2xl ${getStepColor(step.status)}`} />
                    {index < application.steps.length - 1 && (
                      <View
                        className={`w-0.5 h-16 mt-2 ${step.status === 'completed' ? 'bg-blue-100' : 'bg-gray-300'}`}
                      />
                    )}
                  </View>

                  {/* 步骤内容 */}
                  <View className="flex-1 pb-4">
                    <View className="flex items-center justify-between mb-1">
                      <Text className="text-base font-medium text-foreground">{step.name}</Text>
                      {step.status === 'processing' && (
                        <View className="px-2 py-1 bg-blue-100 rounded">
                          <Text className="text-xs text-muted-foreground">进行中</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-muted-foreground mb-2">{step.description}</Text>

                    {step.handler && <Text className="text-xs text-muted-foreground">处理人：{step.handler}</Text>}

                    {step.completedAt && (
                      <Text className="text-xs text-muted-foreground">完成时间：{step.completedAt}</Text>
                    )}

                    {step.comment && (
                      <View className="mt-2 p-2 bg-blue-100 rounded">
                        <Text className="text-xs text-green-600">备注：{step.comment}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 提示信息 */}
          <View className="bg-blue-100 rounded-xl p-4 mb-4">
            <View className="flex items-start">
              <View className="i-mdi-information text-xl text-blue-500 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm text-foreground font-medium block mb-1">温馨提示</Text>
                <Text className="text-xs text-blue-600 block">1. 离职流程通常需要30天，请耐心等待各环节审批</Text>
                <Text className="text-xs text-blue-600 block">2. 请及时完成工作交接和资产归还</Text>
                <Text className="text-xs text-blue-600 block">3. 如有疑问，请及时联系HR部门</Text>
                <Text className="text-xs text-blue-600 block">4. 离职证明将在办理完成后发放</Text>
              </View>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="flex items-center gap-3 mb-20">
            {application.status === 'pending' || application.status === 'processing' ? (
              <>
                <Button
                  className="flex-1 bg-gray-50 text-foreground py-4 rounded break-keep text-base border border-border"
                  size="default"
                  onClick={handleContactHR}>
                  联系HR
                </Button>
                <Button
                  className="flex-1 bg-blue-100 text-white py-4 rounded break-keep text-base"
                  size="default"
                  onClick={handleCancel}>
                  撤销申请
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-blue-100 text-white py-4 rounded break-keep text-base"
                size="default"
                onClick={handleContactHR}>
                联系HR
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
