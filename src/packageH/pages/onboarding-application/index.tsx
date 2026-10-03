/**
 * 入职申请表单页面
 *
 * 功能：
 * - 填写入职申请信息
 * - 上传个人资料
 * - 提交入职申请
 * - 查看申请状态
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import {supabase} from '@/client/supabase'
import {useTenantStore} from '@/store/tenant'

export default function OnboardingApplicationPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male',
    birth_date: '',
    phone: '',
    email: '',
    id_card: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    education: 'bachelor',
    major: '',
    school: '',
    graduation_date: '',
    work_experience: '',
    skills: '',
    expected_position: '',
    expected_department: '',
    expected_salary: '',
    available_date: '',
    self_introduction: '',
    notes: ''
  })

  // 性别选项
  const genderOptions = ['男', '女']
  const genderValues = ['male', 'female']
  const [genderIndex, setGenderIndex] = useState(0)

  // 学历选项
  const educationOptions = ['高中', '大专', '本科', '硕士', '博士']
  const educationValues = ['high_school', 'associate', 'bachelor', 'master', 'doctor']
  const [educationIndex, setEducationIndex] = useState(2)

  // 提交申请
  const handleSubmit = async () => {
    if (!currentTenant || !user) return

    // 验证必填字段
    if (!formData.name.trim()) {
      Taro.showToast({title: '请输入姓名', icon: 'none'})
      return
    }

    if (!formData.phone.trim()) {
      Taro.showToast({title: '请输入手机号', icon: 'none'})
      return
    }

    if (!formData.id_card.trim()) {
      Taro.showToast({title: '请输入身份证号', icon: 'none'})
      return
    }

    if (!formData.expected_position.trim()) {
      Taro.showToast({title: '请输入期望职位', icon: 'none'})
      return
    }

    if (!formData.expected_department.trim()) {
      Taro.showToast({title: '请输入期望部门', icon: 'none'})
      return
    }

    if (!formData.available_date) {
      Taro.showToast({title: '请选择可入职日期', icon: 'none'})
      return
    }

    try {
      setLoading(true)

      // 检查是否已有申请
      const {data: existingApplications, error: checkError} = await supabase
        .from('onboarding_applications')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('applicant_user_id', user.id)
        .eq('status', 'pending')

      if (checkError) throw checkError

      if (existingApplications && existingApplications.length > 0) {
        Taro.showToast({title: '您已有待审批的申请', icon: 'none'})
        setLoading(false)
        return
      }

      // 提交申请
      const {error} = await supabase.from('onboarding_applications').insert({
        tenant_id: currentTenant.id,
        applicant_user_id: user.id,
        name: formData.name,
        gender: formData.gender,
        birth_date: formData.birth_date || null,
        phone: formData.phone,
        email: formData.email || null,
        id_card: formData.id_card,
        address: formData.address || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        education: formData.education,
        major: formData.major || null,
        school: formData.school || null,
        graduation_date: formData.graduation_date || null,
        work_experience: formData.work_experience || null,
        skills: formData.skills || null,
        expected_position: formData.expected_position,
        expected_department: formData.expected_department,
        expected_salary: formData.expected_salary || null,
        available_date: formData.available_date,
        self_introduction: formData.self_introduction || null,
        notes: formData.notes || null,
        status: 'pending'
      })

      if (error) throw error

      Taro.showToast({title: '提交成功', icon: 'success'})

      // 延迟返回
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({title: '提交失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">入职申请</Text>
            <Text className="text-sm opacity-90 block">填写您的个人信息</Text>
          </View>
          <View className="i-mdi-account-plus text-5xl opacity-20"></View>
        </View>
      </View>

      <View className="p-4">
        {/* 基本信息 */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-foreground mb-4 block">基本信息</Text>

          {/* 姓名 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">姓名 *</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.name}
                onInput={(e) => setFormData({...formData, name: e.detail.value})}
                placeholder="请输入您的姓名"
              />
            </View>
          </View>

          {/* 性别 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">性别</Text>
            <Picker
              mode="selector"
              range={genderOptions}
              value={genderIndex}
              onChange={(e) => {
                const index = typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
                setGenderIndex(index)
                setFormData({...formData, gender: genderValues[index]})
              }}>
              <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                <Text className="text-foreground">{genderOptions[genderIndex]}</Text>
                <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
              </View>
            </Picker>
          </View>

          {/* 出生日期 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">出生日期</Text>
            <Picker
              mode="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({...formData, birth_date: e.detail.value as string})}>
              <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                <Text className="text-foreground">{formData.birth_date || '请选择出生日期'}</Text>
                <View className="i-mdi-calendar text-lg text-muted-foreground"></View>
              </View>
            </Picker>
          </View>

          {/* 手机号 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">手机号 *</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                type="number"
                value={formData.phone}
                onInput={(e) => setFormData({...formData, phone: e.detail.value})}
                placeholder="请输入手机号"
              />
            </View>
          </View>

          {/* 邮箱 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">邮箱</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.email}
                onInput={(e) => setFormData({...formData, email: e.detail.value})}
                placeholder="请输入邮箱地址"
              />
            </View>
          </View>

          {/* 身份证号 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">身份证号 *</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.id_card}
                onInput={(e) => setFormData({...formData, id_card: e.detail.value})}
                placeholder="请输入身份证号"
              />
            </View>
          </View>

          {/* 现居住地址 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">现居住地址</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.address}
                onInput={(e) => setFormData({...formData, address: e.detail.value})}
                placeholder="请输入现居住地址"
              />
            </View>
          </View>
        </View>

        {/* 紧急联系人 */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-foreground mb-4 block">紧急联系人</Text>

          {/* 联系人姓名 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">联系人姓名</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.emergency_contact_name}
                onInput={(e) => setFormData({...formData, emergency_contact_name: e.detail.value})}
                placeholder="请输入紧急联系人姓名"
              />
            </View>
          </View>

          {/* 联系人电话 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">联系人电话</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                type="number"
                value={formData.emergency_contact_phone}
                onInput={(e) => setFormData({...formData, emergency_contact_phone: e.detail.value})}
                placeholder="请输入紧急联系人电话"
              />
            </View>
          </View>
        </View>

        {/* 教育背景 */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-foreground mb-4 block">教育背景</Text>

          {/* 学历 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">学历</Text>
            <Picker
              mode="selector"
              range={educationOptions}
              value={educationIndex}
              onChange={(e) => {
                const index = typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
                setEducationIndex(index)
                setFormData({...formData, education: educationValues[index]})
              }}>
              <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                <Text className="text-foreground">{educationOptions[educationIndex]}</Text>
                <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
              </View>
            </Picker>
          </View>

          {/* 专业 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">专业</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.major}
                onInput={(e) => setFormData({...formData, major: e.detail.value})}
                placeholder="请输入专业"
              />
            </View>
          </View>

          {/* 毕业院校 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">毕业院校</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.school}
                onInput={(e) => setFormData({...formData, school: e.detail.value})}
                placeholder="请输入毕业院校"
              />
            </View>
          </View>

          {/* 毕业时间 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">毕业时间</Text>
            <Picker
              mode="date"
              value={formData.graduation_date}
              onChange={(e) => setFormData({...formData, graduation_date: e.detail.value as string})}>
              <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                <Text className="text-foreground">{formData.graduation_date || '请选择毕业时间'}</Text>
                <View className="i-mdi-calendar text-lg text-muted-foreground"></View>
              </View>
            </Picker>
          </View>
        </View>

        {/* 工作经历与技能 */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-foreground mb-4 block">工作经历与技能</Text>

          {/* 工作经历 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">工作经历</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.work_experience}
                onInput={(e) => setFormData({...formData, work_experience: e.detail.value})}
                placeholder="请简要描述您的工作经历"
                style={{minHeight: '100px'}}
              />
            </View>
          </View>

          {/* 专业技能 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">专业技能</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.skills}
                onInput={(e) => setFormData({...formData, skills: e.detail.value})}
                placeholder="请列举您的专业技能"
                style={{minHeight: '80px'}}
              />
            </View>
          </View>
        </View>

        {/* 求职意向 */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-foreground mb-4 block">求职意向</Text>

          {/* 期望职位 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">期望职位 *</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.expected_position}
                onInput={(e) => setFormData({...formData, expected_position: e.detail.value})}
                placeholder="请输入期望职位"
              />
            </View>
          </View>

          {/* 期望部门 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">期望部门 *</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.expected_department}
                onInput={(e) => setFormData({...formData, expected_department: e.detail.value})}
                placeholder="请输入期望部门"
              />
            </View>
          </View>

          {/* 期望薪资 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">期望薪资</Text>
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.expected_salary}
                onInput={(e) => setFormData({...formData, expected_salary: e.detail.value})}
                placeholder="请输入期望薪资（元/月）"
              />
            </View>
          </View>

          {/* 可入职日期 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">可入职日期 *</Text>
            <Picker
              mode="date"
              value={formData.available_date}
              onChange={(e) => setFormData({...formData, available_date: e.detail.value as string})}>
              <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                <Text className="text-foreground">{formData.available_date || '请选择可入职日期'}</Text>
                <View className="i-mdi-calendar text-lg text-muted-foreground"></View>
              </View>
            </Picker>
          </View>

          {/* 自我介绍 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">自我介绍</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.self_introduction}
                onInput={(e) => setFormData({...formData, self_introduction: e.detail.value})}
                placeholder="请简要介绍您自己"
                style={{minHeight: '100px'}}
              />
            </View>
          </View>

          {/* 其他备注 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-2 block">其他备注</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={formData.notes}
                onInput={(e) => setFormData({...formData, notes: e.detail.value})}
                placeholder="选填"
                style={{minHeight: '80px'}}
              />
            </View>
          </View>
        </View>

        {/* 操作按钮 */}
        <View className="flex items-center gap-3 mb-4">
          <Button
            className="flex-1 bg-white border-2 border-gray-200 text-foreground py-3 rounded-xl break-keep text-base"
            size="default"
            onClick={handleBack}
            disabled={loading}>
            取消
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl break-keep text-base"
            size="default"
            onClick={handleSubmit}
            disabled={loading}>
            {loading ? '提交中...' : '提交申请'}
          </Button>
        </View>

        {/* 底部间距 */}
        <View className="h-6"></View>
      </View>
    </ScrollView>
  )
}
