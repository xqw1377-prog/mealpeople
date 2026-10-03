import {Button, Input, Picker, Text, Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {createResignation} from '@/db/api'
import type {ResignationType} from '@/db/types'

interface FormData {
  employee_id: string
  resignation_type: ResignationType
  resignation_reason: string
  resignation_date: string
  last_working_day: string
}

const ResignationApply: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    employee_id: '',
    resignation_type: 'voluntary',
    resignation_reason: '',
    resignation_date: '',
    last_working_day: ''
  })

  const resignationTypeOptions = ['主动离职', '被动离职', '合同到期']
  const [resignationTypeIndex, setResignationTypeIndex] = useState(0)

  // 处理离职类型选择
  const handleResignationTypeChange = useCallback((e: any) => {
    const index = e.detail.value
    setResignationTypeIndex(index)
    const typeMap: Array<'voluntary' | 'involuntary' | 'contract_end'> = ['voluntary', 'involuntary', 'contract_end']
    setFormData((prev) => ({
      ...prev,
      resignation_type: typeMap[index]
    }))
  }, [])

  // 处理输入变化
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({...prev, [field]: value}))
  }, [])

  // 验证表单
  const validateForm = useCallback((): boolean => {
    if (!formData.employee_id.trim()) {
      Taro.showToast({title: '请输入员工工号', icon: 'none'})
      return false
    }
    if (!formData.resignation_reason.trim()) {
      Taro.showToast({title: '请输入离职原因', icon: 'none'})
      return false
    }
    if (formData.resignation_reason.trim().length < 10) {
      Taro.showToast({title: '离职原因至少10个字', icon: 'none'})
      return false
    }
    if (!formData.resignation_date.trim()) {
      Taro.showToast({title: '请选择离职日期', icon: 'none'})
      return false
    }
    if (!formData.last_working_day.trim()) {
      Taro.showToast({title: '请选择最后工作日', icon: 'none'})
      return false
    }
    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(formData.resignation_date)) {
      Taro.showToast({title: '离职日期格式不正确', icon: 'none'})
      return false
    }
    if (!dateRegex.test(formData.last_working_day)) {
      Taro.showToast({title: '最后工作日格式不正确', icon: 'none'})
      return false
    }
    // 验证最后工作日不能晚于离职日期
    if (formData.last_working_day > formData.resignation_date) {
      Taro.showToast({title: '最后工作日不能晚于离职日期', icon: 'none'})
      return false
    }
    return true
  }, [formData])

  // 提交申请
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      // 这里需要从用户信息中获取 tenant_id 和 store_id
      // 暂时使用固定值，实际应该从用户上下文获取
      const result = await createResignation({
        tenant_id: '00000000-0000-0000-0000-000000000001', // 需要从用户信息获取
        store_id: '00000000-0000-0000-0000-000000000001', // 需要从用户信息获取
        employee_id: formData.employee_id,
        resignation_type: formData.resignation_type,
        resignation_reason: formData.resignation_reason,
        resignation_date: formData.resignation_date,
        last_working_day: formData.last_working_day
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
        Taro.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('提交离职申请失败:', error)
      Taro.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [formData, validateForm])

  // 选择日期
  const handleDatePick = useCallback(() => {
    Taro.showModal({
      title: '提示',
      content: '请输入日期格式：YYYY-MM-DD',
      showCancel: false
    })
  }, [])

  return (
    <View className="min-h-screen bg-background p-4">
      {/* 页面标题 */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground">离职申请</Text>
        <Text className="text-sm text-muted-foreground mt-2">请填写完整的离职信息</Text>
      </View>

      {/* 员工信息 */}
      <View className="bg-card rounded-lg p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-4">员工信息</Text>

        {/* 员工工号 */}
        <View className="mb-0">
          <Text className="text-sm text-foreground mb-2">员工工号 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请输入员工工号"
              value={formData.employee_id}
              onInput={(e) => handleInputChange('employee_id', e.detail.value)}
            />
          </View>
          <Text className="text-xs text-muted-foreground mt-1">请输入您的员工工号，可在个人信息中查看</Text>
        </View>
      </View>

      {/* 离职信息 */}
      <View className="bg-card rounded-lg p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-4">离职信息</Text>

        {/* 离职类型 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">离职类型 *</Text>
          <Picker
            mode="selector"
            range={resignationTypeOptions}
            value={resignationTypeIndex}
            onChange={handleResignationTypeChange}>
            <View className="bg-input text-foreground px-3 py-2 rounded border border-border">
              <Text className="text-foreground">{resignationTypeOptions[resignationTypeIndex]}</Text>
            </View>
          </Picker>
        </View>

        {/* 离职原因 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">离职原因 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Textarea
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请详细说明离职原因（至少10个字）"
              value={formData.resignation_reason}
              onInput={(e) => handleInputChange('resignation_reason', e.detail.value)}
              style={{minHeight: '120px'}}
              maxlength={500}
            />
          </View>
          <Text className="text-xs text-muted-foreground mt-1">已输入 {formData.resignation_reason.length}/500 字</Text>
        </View>

        {/* 离职日期 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">离职日期 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="格式：2024-01-01"
              value={formData.resignation_date}
              onInput={(e) => handleInputChange('resignation_date', e.detail.value)}
              onClick={handleDatePick}
            />
          </View>
          <Text className="text-xs text-muted-foreground mt-1">预计正式离职的日期</Text>
        </View>

        {/* 最后工作日 */}
        <View className="mb-0">
          <Text className="text-sm text-foreground mb-2">最后工作日 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="格式：2024-01-01"
              value={formData.last_working_day}
              onInput={(e) => handleInputChange('last_working_day', e.detail.value)}
              onClick={handleDatePick}
            />
          </View>
          <Text className="text-xs text-muted-foreground mt-1">最后一天在岗工作的日期</Text>
        </View>
      </View>

      {/* 温馨提示 */}
      <View className="bg-muted rounded-lg p-4 mb-4">
        <View className="flex flex-row items-start">
          <Text className="text-lg mr-2">💡</Text>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground mb-2">温馨提示</Text>
            <View className="mb-1">
              <Text className="text-xs text-muted-foreground">1. 请提前30天提交离职申请</Text>
            </View>
            <View className="mb-1">
              <Text className="text-xs text-muted-foreground">2. 离职前需完成工作交接</Text>
            </View>
            <View className="mb-1">
              <Text className="text-xs text-muted-foreground">3. 请确保所有公司财物已归还</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">4. 离职证明将在离职后3个工作日内开具</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 提交按钮 */}
      <View className="mt-6 mb-8">
        <Button
          className="w-full bg-destructive text-destructive-foreground py-4 rounded break-keep text-base"
          size="default"
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}>
          {loading ? '提交中...' : '提交离职申请'}
        </Button>
      </View>
    </View>
  )
}

export default ResignationApply
