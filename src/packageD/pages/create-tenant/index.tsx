import {Button, Input, Text, Textarea, View} from '@tarojs/components'
import Taro, {showToast} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useState} from 'react'
import {createTenantApplication} from '@/db/api'

const CreateTenant: React.FC = () => {
  const {user} = useAuth({guard: true})

  const [tenantName, setTenantName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [businessLicense, setBusinessLicense] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    // 验证必填字段
    if (!tenantName.trim()) {
      showToast({title: '请输入租户名称', icon: 'none'})
      return
    }

    if (!industry.trim()) {
      showToast({title: '请选择行业类型', icon: 'none'})
      return
    }

    if (!companyAddress.trim()) {
      showToast({title: '请输入公司地址', icon: 'none'})
      return
    }

    if (!contactPerson.trim()) {
      showToast({title: '请输入联系人', icon: 'none'})
      return
    }

    if (!contactPhone.trim()) {
      showToast({title: '请输入联系电话', icon: 'none'})
      return
    }

    // 验证电话号码格式
    if (!/^1[3-9]\d{9}$/.test(contactPhone.trim())) {
      showToast({title: '请输入正确的手机号码', icon: 'none'})
      return
    }

    if (!user) {
      showToast({title: '用户信息不存在', icon: 'none'})
      return
    }

    setLoading(true)

    try {
      console.log('=== 提交租户申请 ===', {
        tenantName,
        industry,
        companyAddress,
        contactPerson,
        contactPhone,
        userId: user.id,
        userPhone: user.phone
      })

      // 创建租户申请（品牌名称使用租户名称）
      const result = await createTenantApplication({
        user_id: user.id,
        tenant_name: tenantName,
        industry,
        contact_person: contactPerson,
        contact_phone: contactPhone,
        contact_email: undefined,
        reason: description || undefined
      })

      if (!result.success) {
        throw new Error(result.message)
      }

      console.log('✅ 租户申请提交成功')

      showToast({
        title: '申请已提交',
        icon: 'success'
      })

      // 显示成功提示
      setTimeout(() => {
        Taro.showModal({
          title: '申请已提交',
          content: '您的租户申请已提交，请等待超级管理员审核。审核通过后，您将成为租户管理员，可以邀请同伴和配置功能。',
          showCancel: false,
          confirmText: '我知道了',
          success: () => {
            // 返回上一页
            Taro.navigateBack()
          }
        })
      }, 1000)
    } catch (error) {
      console.error('❌ 提交租户申请失败:', error)
      showToast({
        title: error instanceof Error ? error.message : '提交失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
        <Text className="text-xl font-bold text-foreground block mb-2">申请创建租户</Text>
        <Text className="text-sm text-muted-foreground block mb-6">填写完整信息，提交后等待超级管理员审核</Text>

        {/* 租户名称 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground font-medium block mb-2">
            租户名称 <Text className="text-red-500">*</Text>
          </Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="w-full px-4 py-3 border border-border rounded-xl bg-white text-foreground"
              placeholder="请输入租户名称，如：海底捞餐饮集团"
              value={tenantName}
              onInput={(e) => setTenantName(e.detail.value)}
            />
          </View>
          <Text className="text-xs text-muted-foreground mt-1">租户创建后，可在管理中心添加多个品牌</Text>
        </View>

        {/* 行业类型 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground font-medium block mb-2">
            行业类型 <Text className="text-red-500">*</Text>
          </Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="w-full px-4 py-3 border border-border rounded-xl bg-white"
              placeholder="如：餐饮、零售、服务等"
              value={industry}
              onInput={(e) => setIndustry(e.detail.value)}
            />
          </View>
        </View>

        {/* 公司地址 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground font-medium block mb-2">
            公司地址 <Text className="text-red-500">*</Text>
          </Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="w-full px-4 py-3 border border-border rounded-xl bg-white"
              placeholder="请输入公司详细地址"
              value={companyAddress}
              onInput={(e) => setCompanyAddress(e.detail.value)}
            />
          </View>
        </View>

        {/* 营业执照号 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground font-medium block mb-2">营业执照号（可选）</Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="w-full px-4 py-3 border border-border rounded-xl bg-white"
              placeholder="请输入营业执照号"
              value={businessLicense}
              onInput={(e) => setBusinessLicense(e.detail.value)}
            />
          </View>
        </View>

        {/* 联系人 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground font-medium block mb-2">
            联系人 <Text className="text-red-500">*</Text>
          </Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="w-full px-4 py-3 border border-border rounded-xl bg-white"
              placeholder="请输入联系人姓名"
              value={contactPerson}
              onInput={(e) => setContactPerson(e.detail.value)}
            />
          </View>
        </View>

        {/* 联系电话 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground font-medium block mb-2">
            联系电话 <Text className="text-red-500">*</Text>
          </Text>
          <View style={{overflow: 'hidden'}}>
            <Input
              className="w-full px-4 py-3 border border-border rounded-xl bg-white"
              placeholder="请输入11位手机号"
              type="number"
              maxlength={11}
              value={contactPhone}
              onInput={(e) => setContactPhone(e.detail.value)}
            />
          </View>
        </View>

        {/* 租户描述 */}
        <View className="mb-6">
          <Text className="text-sm text-foreground font-medium block mb-2">租户描述（可选）</Text>
          <View style={{overflow: 'hidden'}}>
            <Textarea
              className="w-full px-4 py-3 border border-border rounded-xl bg-white"
              placeholder="请简要描述您的业务范围和需求"
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={200}
              style={{minHeight: '80px'}}
            />
          </View>
        </View>

        <Button
          className="w-full bg-blue-100 text-white rounded-xl py-4 text-base break-keep"
          size="default"
          loading={loading}
          onClick={handleSubmit}>
          提交申请
        </Button>

        <View className="mt-4 p-4 bg-blue-100 rounded-lg">
          <Text className="text-xs text-blue-600 block mb-2">💡 申请流程：</Text>
          <Text className="text-xs text-muted-foreground block mb-1">1. 填写完整的租户信息</Text>
          <Text className="text-xs text-muted-foreground block mb-1">2. 提交申请，等待超级管理员审核</Text>
          <Text className="text-xs text-muted-foreground block mb-1">3. 审核通过后，您将成为租户管理员</Text>
          <Text className="text-xs text-muted-foreground block">4. 可以邀请同伴和配置系统功能</Text>
        </View>
      </View>
    </View>
  )
}

export default CreateTenant
