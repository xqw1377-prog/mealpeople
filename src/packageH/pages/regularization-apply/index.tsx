import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {createRegularization, getOnboardingById} from '@/db/api'
import type {EmployeeOnboarding} from '@/db/types'

interface FormData {
  employee_id: string
  self_evaluation: string
  work_achievements: string
  future_plans: string
}

const RegularizationApply: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const {employeeId} = router.params

  const [loading, setLoading] = useState(false)
  const [employee, setEmployee] = useState<EmployeeOnboarding | null>(null)
  const [formData, setFormData] = useState<FormData>({
    employee_id: employeeId || '',
    self_evaluation: '',
    work_achievements: '',
    future_plans: ''
  })

  // 加载员工信息
  const loadEmployee = useCallback(async (id: string) => {
    try {
      const data = await getOnboardingById(id)
      if (data) {
        setEmployee(data)
      }
    } catch (error) {
      console.error('加载员工信息失败:', error)
    }
  }, [])

  useEffect(() => {
    if (employeeId) {
      loadEmployee(employeeId)
    }
  }, [employeeId, loadEmployee])

  // 表单验证
  const validateForm = useCallback((): boolean => {
    if (!formData.employee_id.trim()) {
      Taro.showToast({title: '请选择员工', icon: 'none'})
      return false
    }

    if (!formData.self_evaluation.trim()) {
      Taro.showToast({title: '请填写自我评价', icon: 'none'})
      return false
    }

    if (formData.self_evaluation.length < 50) {
      Taro.showToast({title: '自我评价至少50字', icon: 'none'})
      return false
    }

    if (!formData.work_achievements.trim()) {
      Taro.showToast({title: '请填写工作成果', icon: 'none'})
      return false
    }

    if (formData.work_achievements.length < 50) {
      Taro.showToast({title: '工作成果至少50字', icon: 'none'})
      return false
    }

    if (!formData.future_plans.trim()) {
      Taro.showToast({title: '请填写未来计划', icon: 'none'})
      return false
    }

    if (formData.future_plans.length < 30) {
      Taro.showToast({title: '未来计划至少30字', icon: 'none'})
      return false
    }

    return true
  }, [formData])

  // 提交申请
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return
    if (!user) return
    if (!employee) return

    setLoading(true)
    try {
      // 计算预期转正日期（入职日期 + 试用期月数）
      const onboardingDate = new Date(employee.onboarding_date)
      const expectedDate = new Date(onboardingDate)
      expectedDate.setMonth(expectedDate.getMonth() + (employee.probation_months || 3))

      const result = await createRegularization({
        tenant_id: '00000000-0000-0000-0000-000000000001',
        employee_id: formData.employee_id,
        application_date: new Date().toISOString().split('T')[0],
        expected_regularization_date: expectedDate.toISOString().split('T')[0],
        self_evaluation: formData.self_evaluation,
        work_summary: formData.work_achievements
      })

      if (result) {
        Taro.showToast({
          title: '提交成功',
          icon: 'success',
          duration: 2000
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      } else {
        Taro.showToast({title: '提交失败', icon: 'none'})
      }
    } catch (error) {
      console.error('提交转正申请失败:', error)
      Taro.showToast({title: '提交失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [formData, user, employee, validateForm])

  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">转正申请</Text>
            <Text className="text-sm text-muted-foreground mt-1">请认真填写转正申请信息</Text>
          </View>

          {/* 员工信息卡片 */}
          {employee && (
            <View className="bg-card rounded-lg p-4 mb-4">
              <Text className="text-base font-semibold text-foreground mb-3">员工信息</Text>
              <View className="space-y-2">
                <View className="flex flex-row items-center gap-2">
                  <View className="i-mdi-account text-lg text-primary" />
                  <Text className="text-sm text-foreground">姓名：{employee.name}</Text>
                </View>
                <View className="flex flex-row items-center gap-2">
                  <View className="i-mdi-briefcase text-lg text-primary" />
                  <Text className="text-sm text-foreground">岗位：{employee.position || '未设置'}</Text>
                </View>
                <View className="flex flex-row items-center gap-2">
                  <View className="i-mdi-office-building text-lg text-primary" />
                  <Text className="text-sm text-foreground">部门：{employee.department || '未设置'}</Text>
                </View>
                <View className="flex flex-row items-center gap-2">
                  <View className="i-mdi-calendar text-lg text-primary" />
                  <Text className="text-sm text-foreground">入职日期：{employee.onboarding_date}</Text>
                </View>
              </View>
            </View>
          )}

          {/* 自我评价 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <View className="i-mdi-account-star text-xl text-primary" />
              <Text className="text-base font-semibold text-foreground">自我评价 *</Text>
            </View>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                placeholder="请对试用期的工作表现进行自我评价（至少50字）"
                value={formData.self_evaluation}
                onInput={(e) => setFormData({...formData, self_evaluation: e.detail.value})}
                style={{minHeight: '120px'}}
                maxlength={1000}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-1">
              已输入 {formData.self_evaluation.length}/1000 字（至少50字）
            </Text>
          </View>

          {/* 工作成果 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <View className="i-mdi-trophy text-xl text-primary" />
              <Text className="text-base font-semibold text-foreground">工作成果 *</Text>
            </View>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                placeholder="请详细描述试用期内的主要工作成果和贡献（至少50字）"
                value={formData.work_achievements}
                onInput={(e) => setFormData({...formData, work_achievements: e.detail.value})}
                style={{minHeight: '120px'}}
                maxlength={1000}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-1">
              已输入 {formData.work_achievements.length}/1000 字（至少50字）
            </Text>
          </View>

          {/* 未来计划 */}
          <View className="bg-card rounded-lg p-4 mb-4">
            <View className="flex flex-row items-center gap-2 mb-3">
              <View className="i-mdi-target text-xl text-primary" />
              <Text className="text-base font-semibold text-foreground">未来计划 *</Text>
            </View>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                placeholder="请描述转正后的工作计划和目标（至少30字）"
                value={formData.future_plans}
                onInput={(e) => setFormData({...formData, future_plans: e.detail.value})}
                style={{minHeight: '100px'}}
                maxlength={500}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-1">
              已输入 {formData.future_plans.length}/500 字（至少30字）
            </Text>
          </View>

          {/* 温馨提示 */}
          <View className="bg-blue-50 rounded-lg p-4 mb-6">
            <View className="flex flex-row items-start gap-2">
              <View className="i-mdi-information text-xl text-blue-600 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-blue-900 mb-2">温馨提示</Text>
                <View className="space-y-1">
                  <Text className="text-xs text-blue-800">1. 请如实填写各项内容</Text>
                  <Text className="text-xs text-blue-800">2. 转正申请提交后将进入审批流程</Text>
                  <Text className="text-xs text-blue-800">3. 审批通过后将正式转为正式员工</Text>
                  <Text className="text-xs text-blue-800">4. 如有疑问请联系人事部门</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 提交按钮 */}
          <Button
            className="w-full bg-primary text-primary-foreground py-4 rounded-lg break-keep text-base"
            size="default"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}>
            {loading ? '提交中...' : '提交申请'}
          </Button>
        </View>
      </ScrollView>
    </View>
  )
}

export default RegularizationApply
