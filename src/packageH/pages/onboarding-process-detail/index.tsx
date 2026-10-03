/**
 * 入职办理流程详情页面
 *
 * 功能：
 * - 显示入职流程的详细信息
 * - 展示各个办理步骤
 * - 支持步骤完成标记
 * - 显示办理进度
 * - 添加备注和附件
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import {useTenantStore} from '@/store/tenant'

// 入职流程步骤类型
interface ProcessStep {
  id: string
  step_name: string
  step_order: number
  description: string
  responsible_role: string
  is_completed: boolean
  completed_at?: string
  completed_by?: string
  notes?: string
  required: boolean
}

// 入职流程详情类型
interface OnboardingProcessDetail {
  id: string
  employee_id: string
  employee_name: string
  employee_phone: string
  position: string
  department: string
  hire_date: string
  status: 'pending' | 'in_progress' | 'completed'
  progress: number
  steps: ProcessStep[]
  created_at: string
  updated_at: string
}

export default function OnboardingProcessDetailPage() {
  const router = useRouter()
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [processDetail, setProcessDetail] = useState<OnboardingProcessDetail | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedStep, setSelectedStep] = useState<ProcessStep | null>(null)
  const [noteText, setNoteText] = useState('')

  // 从URL获取申请ID
  const applicationId = router.params.id

  // 创建默认步骤
  const createDefaultSteps = useCallback(
    async (appId: string): Promise<ProcessStep[]> => {
      const defaultSteps = [
        {
          step_name: '资料审核',
          step_order: 1,
          description: '审核员工提交的入职资料是否完整准确',
          responsible_role: 'HR',
          required: true
        },
        {
          step_name: '劳动合同签订',
          step_order: 2,
          description: '与员工签订劳动合同',
          responsible_role: 'HR',
          required: true
        },
        {
          step_name: '社保办理',
          step_order: 3,
          description: '为员工办理社保和公积金',
          responsible_role: 'HR',
          required: true
        },
        {
          step_name: '工位安排',
          step_order: 4,
          description: '安排员工工位和办公设备',
          responsible_role: '行政',
          required: true
        },
        {
          step_name: '系统账号开通',
          step_order: 5,
          description: '开通员工所需的各类系统账号',
          responsible_role: 'IT',
          required: true
        },
        {
          step_name: '入职培训',
          step_order: 6,
          description: '组织新员工入职培训',
          responsible_role: 'HR',
          required: true
        },
        {
          step_name: '导师分配',
          step_order: 7,
          description: '为新员工分配导师',
          responsible_role: '部门经理',
          required: false
        },
        {
          step_name: '入职手续完成',
          step_order: 8,
          description: '确认所有入职手续已完成',
          responsible_role: 'HR',
          required: true
        }
      ]

      const stepsToInsert = defaultSteps.map((step) => ({
        ...step,
        application_id: appId,
        tenant_id: currentTenant?.id,
        is_completed: false
      }))

      const {data, error} = await supabase.from('onboarding_process_steps').insert(stepsToInsert).select()

      if (error) {
        console.error('创建默认步骤失败:', error)
        return []
      }

      return data || []
    },
    [currentTenant]
  )

  // 加载入职流程详情
  const loadProcessDetail = useCallback(async () => {
    if (!applicationId || !currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 检查权限
      const currentEmployee = await getEmployeeByUserId(user?.id)
      if (!currentEmployee) {
        Taro.showToast({title: '无权限访问', icon: 'none'})
        setLoading(false)
        return
      }

      // 获取入职申请信息
      const {data: application, error: appError} = await supabase
        .from('onboarding_applications')
        .select('*')
        .eq('id', applicationId)
        .eq('tenant_id', currentTenant.id)
        .single()

      if (appError) throw appError

      if (!application) {
        Taro.showToast({title: '未找到入职申请', icon: 'none'})
        setLoading(false)
        return
      }

      // 获取入职流程步骤
      const {data: steps, error: stepsError} = await supabase
        .from('onboarding_process_steps')
        .select('*')
        .eq('application_id', applicationId)
        .order('step_order', {ascending: true})

      if (stepsError) throw stepsError

      // 如果没有步骤，创建默认步骤
      let processSteps: ProcessStep[] = steps || []
      if (processSteps.length === 0) {
        processSteps = await createDefaultSteps(applicationId)
      }

      // 计算进度
      const completedSteps = processSteps.filter((s) => s.is_completed).length
      const progress = processSteps.length > 0 ? Math.round((completedSteps / processSteps.length) * 100) : 0

      // 确定状态
      let status: 'pending' | 'in_progress' | 'completed' = 'pending'
      if (completedSteps === processSteps.length && processSteps.length > 0) {
        status = 'completed'
      } else if (completedSteps > 0) {
        status = 'in_progress'
      }

      // 构建详情对象
      const detail: OnboardingProcessDetail = {
        id: application.id,
        employee_id: application.applicant_user_id,
        employee_name: application.name,
        employee_phone: application.phone,
        position: application.expected_position,
        department: application.expected_department,
        hire_date: application.available_date,
        status,
        progress,
        steps: processSteps,
        created_at: application.created_at,
        updated_at: application.created_at
      }

      setProcessDetail(detail)
    } catch (error) {
      console.error('加载入职流程详情失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [applicationId, currentTenant, user, createDefaultSteps])

  useDidShow(() => {
    loadProcessDetail()
  })

  // 切换步骤完成状态
  const toggleStepCompletion = async (step: ProcessStep) => {
    if (!currentTenant) return

    try {
      const newCompletedStatus = !step.is_completed
      const updateData: any = {
        is_completed: newCompletedStatus
      }

      if (newCompletedStatus) {
        updateData.completed_at = new Date().toISOString()
        updateData.completed_by = user?.id
      } else {
        updateData.completed_at = null
        updateData.completed_by = null
      }

      const {error} = await supabase.from('onboarding_process_steps').update(updateData).eq('id', step.id)

      if (error) throw error

      Taro.showToast({
        title: newCompletedStatus ? '已标记完成' : '已取消完成',
        icon: 'success'
      })

      // 重新加载数据
      loadProcessDetail()
    } catch (error) {
      console.error('更新步骤状态失败:', error)
      Taro.showToast({title: '操作失败', icon: 'none'})
    }
  }

  // 添加备注
  const handleAddNote = (step: ProcessStep) => {
    setSelectedStep(step)
    setNoteText(step.notes || '')
    setShowNoteModal(true)
  }

  // 保存备注
  const saveNote = async () => {
    if (!selectedStep) return

    try {
      const {error} = await supabase
        .from('onboarding_process_steps')
        .update({notes: noteText})
        .eq('id', selectedStep.id)

      if (error) throw error

      Taro.showToast({title: '备注已保存', icon: 'success'})
      setShowNoteModal(false)
      loadProcessDetail()
    } catch (error) {
      console.error('保存备注失败:', error)
      Taro.showToast({title: '保存失败', icon: 'none'})
    }
  }

  // 完成整个流程
  const completeProcess = async () => {
    if (!processDetail || !currentTenant) return

    // 检查是否所有必需步骤都已完成
    const requiredSteps = processDetail.steps.filter((s) => s.required)
    const completedRequiredSteps = requiredSteps.filter((s) => s.is_completed)

    if (completedRequiredSteps.length < requiredSteps.length) {
      Taro.showModal({
        title: '提示',
        content: '还有必需步骤未完成，无法完成入职流程',
        showCancel: false
      })
      return
    }

    Taro.showModal({
      title: '确认完成',
      content: '确认完成该员工的入职流程？完成后将无法修改。',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 更新申请状态
            const {error} = await supabase
              .from('onboarding_applications')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', processDetail.id)

            if (error) throw error

            Taro.showToast({
              title: '入职流程已完成',
              icon: 'success'
            })

            // 返回上一页
            setTimeout(() => {
              Taro.navigateBack()
            }, 1500)
          } catch (error) {
            console.error('完成流程失败:', error)
            Taro.showToast({title: '操作失败', icon: 'none'})
          }
        }
      }
    })
  }

  // 获取状态信息
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      pending: {text: '待开始', color: 'text-muted-foreground', bgColor: 'bg-gray-100'},
      in_progress: {text: '进行中', color: 'text-blue-600', bgColor: 'bg-blue-100'},
      completed: {text: '已完成', color: 'text-green-600', bgColor: 'bg-green-100'}
    }
    return statusMap[status] || {text: '未知', color: 'text-muted-foreground', bgColor: 'bg-gray-100'}
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-8 text-center max-w-md">
          <View className="i-mdi-loading text-6xl text-blue-600 mb-4 animate-spin" />
          <Text className="text-lg font-bold text-gray-900 block mb-2">加载中...</Text>
          <Text className="text-sm text-gray-600 block">正在加载入职流程详情</Text>
        </View>
      </View>
    )
  }

  if (!processDetail) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <View className="bg-white rounded-2xl p-8 text-center max-w-md">
          <View className="i-mdi-alert-circle text-6xl text-red-600 mb-4" />
          <Text className="text-lg font-bold text-gray-900 block mb-2">未找到入职流程</Text>
          <Text className="text-sm text-gray-600 block mb-4">请检查入职申请是否存在</Text>
          <Button
            className="w-full bg-primary text-white py-3 rounded-lg break-keep text-sm"
            size="default"
            onClick={() => Taro.navigateBack()}>
            返回
          </Button>
        </View>
      </View>
    )
  }

  const statusInfo = getStatusInfo(processDetail.status)

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 员工信息卡片 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center mb-4">
              <View className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <View className="i-mdi-account text-4xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground block mb-1">{processDetail.employee_name}</Text>
                <Text className="text-sm text-muted-foreground block">{processDetail.employee_phone}</Text>
              </View>
              <View className={`px-4 py-2 rounded-full ${statusInfo.bgColor}`}>
                <Text className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.text}</Text>
              </View>
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View>
                <Text className="text-xs text-muted-foreground block mb-1">应聘职位</Text>
                <Text className="text-sm font-medium text-foreground block">{processDetail.position}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted-foreground block mb-1">所属部门</Text>
                <Text className="text-sm font-medium text-foreground block">{processDetail.department}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted-foreground block mb-1">入职日期</Text>
                <Text className="text-sm font-medium text-foreground block">
                  {new Date(processDetail.hire_date).toLocaleDateString()}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted-foreground block mb-1">办理进度</Text>
                <Text className="text-sm font-medium text-blue-600 block">{processDetail.progress}%</Text>
              </View>
            </View>
          </View>

          {/* 进度条 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground">办理进度</Text>
              <Text className="text-sm text-muted-foreground">
                {processDetail.steps.filter((s) => s.is_completed).length} / {processDetail.steps.length} 已完成
              </Text>
            </View>
            <View className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <View className="h-full bg-blue-600 transition-all" style={{width: `${processDetail.progress}%`}} />
            </View>
          </View>

          {/* 办理步骤列表 */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-foreground block mb-3">办理步骤</Text>
            <View className="space-y-3">
              {processDetail.steps.map((step, index) => (
                <View
                  key={step.id}
                  className={`bg-white rounded-xl p-4 border-2 transition-all ${
                    step.is_completed ? 'border-green-500' : 'border-border'
                  }`}>
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex items-start flex-1">
                      <View
                        className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          step.is_completed ? 'bg-green-500' : 'bg-gray-200'
                        }`}>
                        {step.is_completed ? (
                          <View className="i-mdi-check text-xl text-white" />
                        ) : (
                          <Text className="text-sm font-bold text-gray-600">{index + 1}</Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="flex items-center gap-2 mb-1">
                          <Text className="text-base font-bold text-foreground">{step.step_name}</Text>
                          {step.required && (
                            <View className="px-2 py-0.5 bg-red-100 rounded">
                              <Text className="text-xs text-red-600">必需</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm text-muted-foreground block mb-2">{step.description}</Text>
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-account-tie text-sm text-muted-foreground" />
                          <Text className="text-xs text-muted-foreground">负责人：{step.responsible_role}</Text>
                        </View>
                        {step.completed_at && (
                          <View className="flex items-center gap-2 mt-1">
                            <View className="i-mdi-clock-outline text-sm text-green-600" />
                            <Text className="text-xs text-green-600">
                              完成时间：{new Date(step.completed_at).toLocaleString()}
                            </Text>
                          </View>
                        )}
                        {step.notes && (
                          <View className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                            <Text className="text-xs text-amber-800">{step.notes}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View className="flex gap-2">
                    <Button
                      className={`flex-1 py-2 rounded-lg break-keep text-sm ${
                        step.is_completed ? 'bg-gray-200 text-gray-600' : 'bg-blue-600 text-white'
                      }`}
                      size="default"
                      onClick={() => toggleStepCompletion(step)}>
                      {step.is_completed ? '取消完成' : '标记完成'}
                    </Button>
                    <Button
                      className="flex-1 bg-amber-100 text-amber-700 py-2 rounded-lg break-keep text-sm"
                      size="default"
                      onClick={() => handleAddNote(step)}>
                      {step.notes ? '编辑备注' : '添加备注'}
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 完成按钮 */}
          {processDetail.status !== 'completed' && (
            <View className="bg-white rounded-xl p-4 border border-border">
              <Button
                className="w-full bg-green-600 text-white py-4 rounded-lg break-keep text-base"
                size="default"
                onClick={completeProcess}>
                完成入职流程
              </Button>
              <Text className="text-xs text-muted-foreground text-center block mt-2">
                完成后将无法修改，请确认所有必需步骤已完成
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 备注弹窗 */}
      {showNoteModal && selectedStep && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{zIndex: 1000}}
          onClick={() => setShowNoteModal(false)}>
          <View className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <View className="flex items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">添加备注</Text>
              <View
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer"
                onClick={() => setShowNoteModal(false)}>
                <View className="i-mdi-close text-xl text-gray-600" />
              </View>
            </View>

            <Text className="text-sm text-muted-foreground block mb-3">{selectedStep.step_name}</Text>

            <View style={{overflow: 'hidden'}} className="mb-4">
              <Textarea
                className="w-full bg-gray-50 rounded-lg p-3 text-sm border border-border"
                placeholder="请输入备注内容..."
                value={noteText}
                onInput={(e) => setNoteText(e.detail.value)}
                maxlength={500}
                style={{minHeight: '120px'}}
              />
            </View>

            <View className="flex gap-3">
              <Button
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg break-keep text-sm"
                size="default"
                onClick={() => setShowNoteModal(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-primary text-white py-3 rounded-lg break-keep text-sm"
                size="default"
                onClick={saveNote}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
