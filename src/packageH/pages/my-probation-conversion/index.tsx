/**
 * 我的试用期转正申请页面（员工端）
 *
 * 功能：
 * - 查看试用期状态
 * - 提交转正申请
 * - 查看转正申请进度
 * - 查看评估结果
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import {useTenantStore} from '@/store/tenant'

// 试用期信息类型
interface ProbationInfo {
  id: string
  employee_id: string
  employee_name: string
  start_date: string
  end_date: string
  status: 'active' | 'extended' | 'converted' | 'terminated'
  evaluation_score?: number
  evaluation_notes?: string
  conversion_date?: string
  created_at: string
}

// 转正申请类型
interface ConversionApplication {
  id: string
  probation_id: string
  employee_id: string
  application_date: string
  self_evaluation: string
  work_summary: string
  future_plan: string
  status: 'pending' | 'approved' | 'rejected'
  review_notes?: string
  reviewed_at?: string
  created_at: string
}

export default function MyProbationConversionPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [probationInfo, setProbationInfo] = useState<ProbationInfo | null>(null)
  const [application, setApplication] = useState<ConversionApplication | null>(null)
  const [showApplicationForm, setShowApplicationForm] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    selfEvaluation: '',
    workSummary: '',
    futurePlan: ''
  })

  // 加载试用期信息和转正申请
  const loadData = useCallback(async () => {
    if (!currentTenant || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 获取试用期信息
      const {data: probationData, error: probationError} = await supabase
        .from('probation_periods')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('employee_id', employee.id)
        .order('created_at', {ascending: false})
        .maybeSingle()

      if (probationError) throw probationError

      setProbationInfo(probationData)

      // 如果有试用期信息，获取转正申请
      if (probationData) {
        const {data: applicationData, error: applicationError} = await supabase
          .from('probation_conversion_applications')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .eq('probation_id', probationData.id)
          .order('created_at', {ascending: false})
          .maybeSingle()

        if (applicationError && applicationError.code !== 'PGRST116') {
          throw applicationError
        }

        setApplication(applicationData)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useDidShow(() => {
    loadData()
  })

  // 提交转正申请
  const handleSubmitApplication = async () => {
    if (!probationInfo || !currentTenant || !user) return

    // 验证表单
    if (!formData.selfEvaluation.trim()) {
      Taro.showToast({title: '请填写自我评价', icon: 'none'})
      return
    }

    if (!formData.workSummary.trim()) {
      Taro.showToast({title: '请填写工作总结', icon: 'none'})
      return
    }

    if (!formData.futurePlan.trim()) {
      Taro.showToast({title: '请填写未来规划', icon: 'none'})
      return
    }

    try {
      Taro.showLoading({title: '提交中...'})

      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 创建转正申请
      const {error} = await supabase.from('probation_conversion_applications').insert({
        tenant_id: currentTenant.id,
        probation_id: probationInfo.id,
        employee_id: employee.id,
        application_date: new Date().toISOString().split('T')[0],
        self_evaluation: formData.selfEvaluation,
        work_summary: formData.workSummary,
        future_plan: formData.futurePlan,
        status: 'pending'
      })

      if (error) throw error

      Taro.hideLoading()
      Taro.showToast({title: '提交成功', icon: 'success'})

      // 重置表单
      setFormData({
        selfEvaluation: '',
        workSummary: '',
        futurePlan: ''
      })
      setShowApplicationForm(false)

      // 重新加载数据
      loadData()
    } catch (error) {
      console.error('提交申请失败:', error)
      Taro.hideLoading()
      Taro.showToast({title: '提交失败', icon: 'none'})
    }
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '试用中'
      case 'extended':
        return '已延长'
      case 'converted':
        return '已转正'
      case 'terminated':
        return '已终止'
      default:
        return '未知'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-700'
      case 'extended':
        return 'bg-yellow-100 text-yellow-700'
      case 'converted':
        return 'bg-green-100 text-green-700'
      case 'terminated':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // 获取申请状态文本
  const getApplicationStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审批'
      case 'approved':
        return '已通过'
      case 'rejected':
        return '已拒绝'
      default:
        return '未知'
    }
  }

  // 获取申请状态颜色
  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // 计算试用期剩余天数
  const getRemainingDays = (endDate: string) => {
    const today = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">试用期转正</Text>
            <Text className="text-sm opacity-90 block">查看试用期状态，提交转正申请</Text>
          </View>
          <View className="i-mdi-account-convert text-5xl opacity-20"></View>
        </View>
      </View>

      {loading ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {probationInfo ? (
            <View>
              {/* 试用期状态卡片 */}
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <View className="flex items-center justify-between mb-4">
                  <Text className="text-lg font-bold text-foreground">试用期状态</Text>
                  <View className={`px-4 py-1.5 rounded-full ${getStatusColor(probationInfo.status)}`}>
                    <Text className="text-sm font-medium">{getStatusText(probationInfo.status)}</Text>
                  </View>
                </View>

                {/* 试用期信息 */}
                <View className="space-y-3">
                  <View className="bg-blue-50 rounded-xl p-3">
                    <View className="flex items-center justify-between mb-2">
                      <Text className="text-sm text-muted-foreground">开始日期</Text>
                      <Text className="text-sm text-foreground font-medium">{probationInfo.start_date}</Text>
                    </View>
                    <View className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground">结束日期</Text>
                      <Text className="text-sm text-foreground font-medium">{probationInfo.end_date}</Text>
                    </View>
                  </View>

                  {/* 剩余天数 */}
                  {probationInfo.status === 'active' && (
                    <View className="bg-yellow-50 rounded-xl p-3">
                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-muted-foreground">剩余天数</Text>
                        <Text className="text-lg text-foreground font-bold">
                          {getRemainingDays(probationInfo.end_date)} 天
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* 评估信息 */}
                  {probationInfo.evaluation_score !== null && probationInfo.evaluation_score !== undefined && (
                    <View className="bg-green-50 rounded-xl p-3">
                      <View className="flex items-center justify-between mb-2">
                        <Text className="text-sm text-muted-foreground">评估分数</Text>
                        <Text className="text-lg text-foreground font-bold">{probationInfo.evaluation_score} 分</Text>
                      </View>
                      {probationInfo.evaluation_notes && (
                        <View>
                          <Text className="text-sm text-muted-foreground mb-1 block">评估意见</Text>
                          <Text className="text-sm text-foreground">{probationInfo.evaluation_notes}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* 转正日期 */}
                  {probationInfo.conversion_date && (
                    <View className="bg-green-50 rounded-xl p-3">
                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-muted-foreground">转正日期</Text>
                        <Text className="text-sm text-foreground font-medium">{probationInfo.conversion_date}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* 转正申请状态 */}
              {application ? (
                <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                  <View className="flex items-center justify-between mb-4">
                    <Text className="text-lg font-bold text-foreground">转正申请</Text>
                    <View className={`px-4 py-1.5 rounded-full ${getApplicationStatusColor(application.status)}`}>
                      <Text className="text-sm font-medium">{getApplicationStatusText(application.status)}</Text>
                    </View>
                  </View>

                  {/* 申请信息 */}
                  <View className="space-y-3">
                    <View className="bg-blue-50 rounded-xl p-3">
                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-muted-foreground">申请日期</Text>
                        <Text className="text-sm text-foreground font-medium">{application.application_date}</Text>
                      </View>
                    </View>

                    {/* 自我评价 */}
                    <View className="bg-gray-50 rounded-xl p-3">
                      <Text className="text-sm text-muted-foreground mb-2 block">自我评价</Text>
                      <Text className="text-sm text-foreground leading-relaxed">{application.self_evaluation}</Text>
                    </View>

                    {/* 工作总结 */}
                    <View className="bg-gray-50 rounded-xl p-3">
                      <Text className="text-sm text-muted-foreground mb-2 block">工作总结</Text>
                      <Text className="text-sm text-foreground leading-relaxed">{application.work_summary}</Text>
                    </View>

                    {/* 未来规划 */}
                    <View className="bg-gray-50 rounded-xl p-3">
                      <Text className="text-sm text-muted-foreground mb-2 block">未来规划</Text>
                      <Text className="text-sm text-foreground leading-relaxed">{application.future_plan}</Text>
                    </View>

                    {/* 审批意见 */}
                    {application.review_notes && (
                      <View className="bg-yellow-50 rounded-xl p-3">
                        <Text className="text-sm text-muted-foreground mb-2 block">审批意见</Text>
                        <Text className="text-sm text-foreground">{application.review_notes}</Text>
                      </View>
                    )}

                    {/* 审批时间 */}
                    {application.reviewed_at && (
                      <View className="bg-green-50 rounded-xl p-3">
                        <View className="flex items-center justify-between">
                          <Text className="text-sm text-muted-foreground">审批时间</Text>
                          <Text className="text-sm text-foreground font-medium">
                            {new Date(application.reviewed_at).toLocaleString('zh-CN')}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* 重新申请按钮 */}
                  {application.status === 'rejected' && probationInfo.status === 'active' && (
                    <View className="mt-4">
                      <Button
                        className="w-full bg-blue-500 text-white py-3 rounded-xl break-keep text-base"
                        size="default"
                        onClick={() => setShowApplicationForm(true)}>
                        重新提交申请
                      </Button>
                    </View>
                  )}
                </View>
              ) : (
                <View>
                  {/* 提交转正申请 */}
                  {probationInfo.status === 'active' && !showApplicationForm && (
                    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                      <Text className="text-lg font-bold text-foreground mb-4 block">提交转正申请</Text>
                      <Text className="text-sm text-muted-foreground mb-4 block">
                        您的试用期即将结束，可以提交转正申请。请认真填写自我评价、工作总结和未来规划。
                      </Text>
                      <Button
                        className="w-full bg-blue-500 text-white py-3 rounded-xl break-keep text-base"
                        size="default"
                        onClick={() => setShowApplicationForm(true)}>
                        开始填写申请
                      </Button>
                    </View>
                  )}

                  {/* 转正申请表单 */}
                  {showApplicationForm && (
                    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                      <Text className="text-lg font-bold text-foreground mb-4 block">填写转正申请</Text>

                      {/* 自我评价 */}
                      <View className="mb-4">
                        <Text className="text-sm text-foreground font-medium mb-2 block">
                          自我评价 <Text className="text-red-500">*</Text>
                        </Text>
                        <View style={{overflow: 'hidden'}}>
                          <Textarea
                            className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                            placeholder="请评价自己在试用期的表现..."
                            value={formData.selfEvaluation}
                            onInput={(e) => setFormData({...formData, selfEvaluation: e.detail.value})}
                            maxlength={500}
                            style={{minHeight: '100px'}}
                          />
                        </View>
                        <Text className="text-xs text-muted-foreground mt-1 block">
                          {formData.selfEvaluation.length}/500
                        </Text>
                      </View>

                      {/* 工作总结 */}
                      <View className="mb-4">
                        <Text className="text-sm text-foreground font-medium mb-2 block">
                          工作总结 <Text className="text-red-500">*</Text>
                        </Text>
                        <View style={{overflow: 'hidden'}}>
                          <Textarea
                            className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                            placeholder="请总结试用期的工作内容和成果..."
                            value={formData.workSummary}
                            onInput={(e) => setFormData({...formData, workSummary: e.detail.value})}
                            maxlength={500}
                            style={{minHeight: '100px'}}
                          />
                        </View>
                        <Text className="text-xs text-muted-foreground mt-1 block">
                          {formData.workSummary.length}/500
                        </Text>
                      </View>

                      {/* 未来规划 */}
                      <View className="mb-4">
                        <Text className="text-sm text-foreground font-medium mb-2 block">
                          未来规划 <Text className="text-red-500">*</Text>
                        </Text>
                        <View style={{overflow: 'hidden'}}>
                          <Textarea
                            className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                            placeholder="请描述转正后的工作规划和目标..."
                            value={formData.futurePlan}
                            onInput={(e) => setFormData({...formData, futurePlan: e.detail.value})}
                            maxlength={500}
                            style={{minHeight: '100px'}}
                          />
                        </View>
                        <Text className="text-xs text-muted-foreground mt-1 block">
                          {formData.futurePlan.length}/500
                        </Text>
                      </View>

                      {/* 操作按钮 */}
                      <View className="flex gap-3">
                        <Button
                          className="flex-1 bg-gray-200 text-foreground py-3 rounded-xl break-keep text-base"
                          size="default"
                          onClick={() => setShowApplicationForm(false)}>
                          取消
                        </Button>
                        <Button
                          className="flex-1 bg-blue-500 text-white py-3 rounded-xl break-keep text-base"
                          size="default"
                          onClick={handleSubmitApplication}>
                          提交申请
                        </Button>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View>
              {/* 空状态 */}
              <View className="text-center py-12">
                <View className="i-mdi-account-clock text-6xl text-muted-foreground mb-4"></View>
                <Text className="text-muted-foreground text-base block mb-2">您当前不在试用期</Text>
                <Text className="text-sm text-muted-foreground block">如有疑问，请联系HR部门</Text>
              </View>
            </View>
          )}

          {/* 返回按钮 */}
          <View className="mt-6">
            <View
              onClick={handleBack}
              className="bg-white border-2 border-gray-200 rounded-xl py-3 px-6 flex items-center justify-center active:bg-gray-50">
              <View className="i-mdi-arrow-left text-xl text-foreground mr-2"></View>
              <Text className="text-foreground font-medium">返回</Text>
            </View>
          </View>

          {/* 底部间距 */}
          <View className="h-6"></View>
        </View>
      )}
    </ScrollView>
  )
}
