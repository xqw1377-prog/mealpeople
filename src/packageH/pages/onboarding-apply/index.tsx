import {Button, Input, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {createOnboarding} from '@/db/api'

interface FormData {
  name: string
  id_card: string
  phone: string
  email: string
  emergency_contact_name: string
  emergency_contact_phone: string
  position: string
  department: string
  expected_salary: string
  onboarding_date: string
}

const OnboardingApply: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    id_card: '',
    phone: '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    position: '',
    department: '',
    expected_salary: '',
    onboarding_date: ''
  })

  // 处理输入变化
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({...prev, [field]: value}))
  }, [])

  // 验证表单
  const validateForm = useCallback((): boolean => {
    if (!formData.name.trim()) {
      Taro.showToast({title: '请输入姓名', icon: 'none'})
      return false
    }
    if (!formData.id_card.trim()) {
      Taro.showToast({title: '请输入身份证号', icon: 'none'})
      return false
    }
    if (!formData.phone.trim()) {
      Taro.showToast({title: '请输入手机号', icon: 'none'})
      return false
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      Taro.showToast({title: '手机号格式不正确', icon: 'none'})
      return false
    }
    if (!formData.position.trim()) {
      Taro.showToast({title: '请输入应聘岗位', icon: 'none'})
      return false
    }
    if (!formData.department.trim()) {
      Taro.showToast({title: '请输入所属部门', icon: 'none'})
      return false
    }
    if (!formData.expected_salary.trim()) {
      Taro.showToast({title: '请输入期望薪资', icon: 'none'})
      return false
    }
    if (!formData.onboarding_date.trim()) {
      Taro.showToast({title: '请选择入职日期', icon: 'none'})
      return false
    }
    if (!formData.emergency_contact_name.trim()) {
      Taro.showToast({title: '请输入紧急联系人姓名', icon: 'none'})
      return false
    }
    if (!formData.emergency_contact_phone.trim()) {
      Taro.showToast({title: '请输入紧急联系人电话', icon: 'none'})
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
      const result = await createOnboarding({
        tenant_id: '00000000-0000-0000-0000-000000000001', // 需要从用户信息获取
        store_id: '00000000-0000-0000-0000-000000000001', // 需要从用户信息获取
        name: formData.name,
        id_card: formData.id_card,
        phone: formData.phone,
        email: formData.email || undefined,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        position: formData.position,
        department: formData.department,
        expected_salary: parseFloat(formData.expected_salary),
        onboarding_date: formData.onboarding_date
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
      console.error('提交入职申请失败:', error)
      Taro.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [formData, validateForm])

  return (
    <View className="min-h-screen bg-background p-4">
      {/* 页面标题 */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-foreground">入职申请</Text>
        <Text className="text-sm text-muted-foreground mt-2">请填写完整的入职信息</Text>
      </View>

      {/* 基本信息 */}
      <View className="bg-card rounded-lg p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-4">基本信息</Text>

        {/* 姓名 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">姓名 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请输入姓名"
              value={formData.name}
              onInput={(e) => handleInputChange('name', e.detail.value)}
            />
          </View>
        </View>

        {/* 身份证号 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">身份证号 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请输入身份证号"
              value={formData.id_card}
              onInput={(e) => handleInputChange('id_card', e.detail.value)}
            />
          </View>
        </View>

        {/* 手机号 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">手机号 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请输入手机号"
              type="number"
              value={formData.phone}
              onInput={(e) => handleInputChange('phone', e.detail.value)}
            />
          </View>
        </View>

        {/* 邮箱 */}
        <View className="mb-0">
          <Text className="text-sm text-foreground mb-2">邮箱</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请输入邮箱（选填）"
              value={formData.email}
              onInput={(e) => handleInputChange('email', e.detail.value)}
            />
          </View>
        </View>
      </View>

      {/* 紧急联系人 */}
      <View className="bg-card rounded-lg p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-4">紧急联系人</Text>

        {/* 联系人姓名 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">姓名 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请输入紧急联系人姓名"
              value={formData.emergency_contact_name}
              onInput={(e) => handleInputChange('emergency_contact_name', e.detail.value)}
            />
          </View>
        </View>

        {/* 联系人电话 */}
        <View className="mb-0">
          <Text className="text-sm text-foreground mb-2">电话 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请输入紧急联系人电话"
              type="number"
              value={formData.emergency_contact_phone}
              onInput={(e) => handleInputChange('emergency_contact_phone', e.detail.value)}
            />
          </View>
        </View>
      </View>

      {/* 岗位信息 */}
      <View className="bg-card rounded-lg p-4 mb-4">
        <Text className="text-lg font-semibold text-foreground mb-4">岗位信息</Text>

        {/* 应聘岗位 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">应聘岗位 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请输入应聘岗位"
              value={formData.position}
              onInput={(e) => handleInputChange('position', e.detail.value)}
            />
          </View>
        </View>

        {/* 所属部门 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">所属部门 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请输入所属部门"
              value={formData.department}
              onInput={(e) => handleInputChange('department', e.detail.value)}
            />
          </View>
        </View>

        {/* 期望薪资 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground mb-2">期望薪资（元/月）*</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="请输入期望薪资"
              type="digit"
              value={formData.expected_salary}
              onInput={(e) => handleInputChange('expected_salary', e.detail.value)}
            />
          </View>
        </View>

        {/* 入职日期 */}
        <View className="mb-0">
          <Text className="text-sm text-foreground mb-2">期望入职日期 *</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
              placeholder="格式：2024-01-01"
              value={formData.onboarding_date}
              onInput={(e) => handleInputChange('onboarding_date', e.detail.value)}
            />
          </View>
          <Text className="text-xs text-muted-foreground mt-1">请输入日期格式：YYYY-MM-DD</Text>
        </View>
      </View>

      {/* 提交按钮 */}
      <View className="mt-6 mb-8">
        <Button
          className="w-full bg-primary text-primary-foreground py-4 rounded break-keep text-base"
          size="default"
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}>
          {loading ? '提交中...' : '提交申请'}
        </Button>
      </View>
    </View>
  )
}

export default OnboardingApply
