/**
 * 添加候选人页面
 * 创建新的候选人记录
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {chooseImage} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api'

// 学历选项
const EDUCATION_OPTIONS = ['高中', '大专', '本科', '硕士', '博士']

// 候选人状态选项
const STATUS_OPTIONS = [
  {value: 'screening', label: '简历筛选'},
  {value: 'interview_scheduled', label: '面试安排'},
  {value: 'interviewed', label: '已面试'},
  {value: 'offer_sent', label: 'Offer已发'},
  {value: 'offer_accepted', label: 'Offer已接受'},
  {value: 'rejected', label: '已拒绝'},
  {value: 'withdrawn', label: '已撤回'}
]

export default function CandidateAdd() {
  const {user} = useAuth({guard: true})

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    position: '',
    department: '',
    education: '',
    school: '',
    major: '',
    work_experience: '',
    expected_salary: '',
    status: 'screening',
    notes: ''
  })

  const [resumeUrl, setResumeUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 更新表单字段
  const updateField = (field: string, value: string) => {
    setFormData({...formData, [field]: value})
  }

  // 选择简历文件
  const handleChooseResume = async () => {
    try {
      const res = await chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album']
      })

      if (res.tempFiles.length > 0) {
        const file = res.tempFiles[0]
        setResumeUrl(file.path)
        Taro.showToast({
          title: '简历已选择',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('选择简历失败:', error)
    }
  }

  // 验证表单
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Taro.showToast({title: '请输入姓名', icon: 'none'})
      return false
    }

    if (!formData.phone.trim()) {
      Taro.showToast({title: '请输入手机号', icon: 'none'})
      return false
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(formData.phone)) {
      Taro.showToast({title: '手机号格式不正确', icon: 'none'})
      return false
    }

    if (formData.email && !formData.email.includes('@')) {
      Taro.showToast({title: '邮箱格式不正确', icon: 'none'})
      return false
    }

    if (!formData.position.trim()) {
      Taro.showToast({title: '请输入应聘职位', icon: 'none'})
      return false
    }

    if (!formData.department.trim()) {
      Taro.showToast({title: '请输入应聘部门', icon: 'none'})
      return false
    }

    return true
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setSubmitting(true)
      Taro.showLoading({title: '提交中...'})

      const employee = await getEmployeeByUserId(user?.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 上传简历（如果有）
      let uploadedResumeUrl = ''
      if (resumeUrl) {
        // TODO: 实现简历上传到Supabase Storage
        uploadedResumeUrl = resumeUrl
      }

      // 插入候选人记录
      const {error} = await supabase.from('candidates').insert({
        tenant_id: employee.tenant_id,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        position: formData.position.trim(),
        department: formData.department.trim(),
        education: formData.education || null,
        school: formData.school.trim() || null,
        major: formData.major.trim() || null,
        work_experience: formData.work_experience ? parseInt(formData.work_experience, 10) : null,
        expected_salary: formData.expected_salary ? parseInt(formData.expected_salary, 10) : null,
        status: formData.status,
        resume_url: uploadedResumeUrl || null,
        notes: formData.notes.trim() || null
      })

      if (error) throw error

      Taro.hideLoading()
      Taro.showToast({
        title: '添加成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交失败:', error)
      Taro.hideLoading()
      Taro.showToast({
        title: '提交失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen">
        <View className="p-4 pb-24">
          {/* 基本信息 */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
            <View className="flex items-center gap-2 mb-4">
              <View className="i-mdi-account text-xl text-primary" />
              <Text className="text-lg font-bold text-foreground">基本信息</Text>
              <Text className="text-xs text-red-500">*必填</Text>
            </View>

            <View className="space-y-4">
              {/* 姓名 */}
              <View>
                <View className="flex items-center gap-1 mb-2">
                  <Text className="text-sm font-medium text-foreground">姓名</Text>
                  <Text className="text-xs text-red-500">*</Text>
                </View>
                <Input
                  className="bg-gray-50 px-4 py-3 rounded-xl text-sm border-2 border-gray-200 focus:border-primary"
                  placeholder="请输入姓名"
                  value={formData.name}
                  onInput={(e) => updateField('name', e.detail.value)}
                  maxlength={50}
                />
              </View>

              {/* 手机号 */}
              <View>
                <View className="flex items-center gap-1 mb-2">
                  <Text className="text-sm font-medium text-foreground">手机号</Text>
                  <Text className="text-xs text-red-500">*</Text>
                </View>
                <Input
                  className="bg-gray-50 px-4 py-3 rounded-xl text-sm border-2 border-gray-200 focus:border-primary"
                  placeholder="请输入11位手机号"
                  value={formData.phone}
                  onInput={(e) => updateField('phone', e.detail.value)}
                  type="number"
                  maxlength={11}
                />
              </View>

              {/* 邮箱 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">邮箱</Text>
                <Input
                  className="bg-gray-50 px-4 py-3 rounded-xl text-sm border-2 border-gray-200 focus:border-primary"
                  placeholder="请输入邮箱（选填）"
                  value={formData.email}
                  onInput={(e) => updateField('email', e.detail.value)}
                  type="text"
                />
              </View>
            </View>
          </View>

          {/* 应聘信息 */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
            <View className="flex items-center gap-2 mb-4">
              <View className="i-mdi-briefcase text-xl text-primary" />
              <Text className="text-lg font-bold text-foreground">应聘信息</Text>
            </View>

            <View className="space-y-4">
              {/* 应聘职位 */}
              <View>
                <View className="flex items-center gap-1 mb-2">
                  <Text className="text-sm font-medium text-foreground">应聘职位</Text>
                  <Text className="text-xs text-red-500">*</Text>
                </View>
                <Input
                  className="bg-gray-50 px-4 py-3 rounded-xl text-sm border-2 border-gray-200 focus:border-primary"
                  placeholder="请输入应聘职位"
                  value={formData.position}
                  onInput={(e) => updateField('position', e.detail.value)}
                  maxlength={100}
                />
              </View>

              {/* 应聘部门 */}
              <View>
                <View className="flex items-center gap-1 mb-2">
                  <Text className="text-sm font-medium text-foreground">应聘部门</Text>
                  <Text className="text-xs text-red-500">*</Text>
                </View>
                <Input
                  className="bg-gray-50 px-4 py-3 rounded-xl text-sm border-2 border-gray-200 focus:border-primary"
                  placeholder="请输入应聘部门"
                  value={formData.department}
                  onInput={(e) => updateField('department', e.detail.value)}
                  maxlength={100}
                />
              </View>

              {/* 候选人状态 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">候选人状态</Text>
                <Picker
                  mode="selector"
                  range={STATUS_OPTIONS.map((opt) => opt.label)}
                  value={STATUS_OPTIONS.findIndex((opt) => opt.value === formData.status)}
                  onChange={(e) => {
                    const index = e.detail.value as number
                    updateField('status', STATUS_OPTIONS[index].value)
                  }}>
                  <View className="bg-gray-50 px-4 py-3 rounded-xl border-2 border-gray-200 flex items-center justify-between">
                    <Text className="text-sm text-foreground">
                      {STATUS_OPTIONS.find((opt) => opt.value === formData.status)?.label || '请选择状态'}
                    </Text>
                    <View className="i-mdi-chevron-down text-xl text-gray-400" />
                  </View>
                </Picker>
              </View>
            </View>
          </View>

          {/* 教育背景 */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
            <View className="flex items-center gap-2 mb-4">
              <View className="i-mdi-school text-xl text-primary" />
              <Text className="text-lg font-bold text-foreground">教育背景</Text>
            </View>

            <View className="space-y-4">
              {/* 学历 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">学历</Text>
                <Picker
                  mode="selector"
                  range={EDUCATION_OPTIONS}
                  value={EDUCATION_OPTIONS.indexOf(formData.education)}
                  onChange={(e) => {
                    const index = e.detail.value as number
                    updateField('education', EDUCATION_OPTIONS[index])
                  }}>
                  <View className="bg-gray-50 px-4 py-3 rounded-xl border-2 border-gray-200 flex items-center justify-between">
                    <Text className="text-sm text-foreground">{formData.education || '请选择学历'}</Text>
                    <View className="i-mdi-chevron-down text-xl text-gray-400" />
                  </View>
                </Picker>
              </View>

              {/* 毕业院校 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">毕业院校</Text>
                <Input
                  className="bg-gray-50 px-4 py-3 rounded-xl text-sm border-2 border-gray-200 focus:border-primary"
                  placeholder="请输入毕业院校（选填）"
                  value={formData.school}
                  onInput={(e) => updateField('school', e.detail.value)}
                  maxlength={100}
                />
              </View>

              {/* 专业 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">专业</Text>
                <Input
                  className="bg-gray-50 px-4 py-3 rounded-xl text-sm border-2 border-gray-200 focus:border-primary"
                  placeholder="请输入专业（选填）"
                  value={formData.major}
                  onInput={(e) => updateField('major', e.detail.value)}
                  maxlength={100}
                />
              </View>
            </View>
          </View>

          {/* 工作经验 */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
            <View className="flex items-center gap-2 mb-4">
              <View className="i-mdi-briefcase-outline text-xl text-primary" />
              <Text className="text-lg font-bold text-foreground">工作经验</Text>
            </View>

            <View className="space-y-4">
              {/* 工作年限 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">工作年限</Text>
                <Input
                  className="bg-gray-50 px-4 py-3 rounded-xl text-sm border-2 border-gray-200 focus:border-primary"
                  placeholder="请输入工作年限（选填）"
                  value={formData.work_experience}
                  onInput={(e) => updateField('work_experience', e.detail.value)}
                  type="number"
                />
                <Text className="text-xs text-muted-foreground mt-1">单位：年</Text>
              </View>

              {/* 期望薪资 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">期望薪资</Text>
                <Input
                  className="bg-gray-50 px-4 py-3 rounded-xl text-sm border-2 border-gray-200 focus:border-primary"
                  placeholder="请输入期望薪资（选填）"
                  value={formData.expected_salary}
                  onInput={(e) => updateField('expected_salary', e.detail.value)}
                  type="number"
                />
                <Text className="text-xs text-muted-foreground mt-1">单位：元/月</Text>
              </View>
            </View>
          </View>

          {/* 简历上传 */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
            <View className="flex items-center gap-2 mb-4">
              <View className="i-mdi-file-document text-xl text-primary" />
              <Text className="text-lg font-bold text-foreground">简历上传</Text>
            </View>

            <View
              className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center gap-3 active:scale-98 transition-all"
              onClick={handleChooseResume}>
              <View className="i-mdi-cloud-upload text-4xl text-primary" />
              <Text className="text-sm text-foreground font-medium">{resumeUrl ? '已选择简历' : '点击上传简历'}</Text>
              <Text className="text-xs text-muted-foreground">支持PDF、Word、图片格式</Text>
            </View>
          </View>

          {/* 备注信息 */}
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-md">
            <View className="flex items-center gap-2 mb-4">
              <View className="i-mdi-note-text text-xl text-primary" />
              <Text className="text-lg font-bold text-foreground">备注信息</Text>
            </View>

            <Textarea
              className="bg-gray-50 px-4 py-3 rounded-xl text-sm border-2 border-gray-200 focus:border-primary w-full"
              placeholder="请输入备注信息（选填）"
              value={formData.notes}
              onInput={(e) => updateField('notes', e.detail.value)}
              maxlength={500}
              style={{minHeight: '120px'}}
            />
            <Text className="text-xs text-muted-foreground mt-2">{formData.notes.length}/500</Text>
          </View>
        </View>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <View className="flex gap-3">
          <Button
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold active:scale-95 transition-all"
            onClick={() => Taro.navigateBack()}>
            取消
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
            onClick={handleSubmit}
            disabled={submitting}>
            {submitting ? '提交中...' : '提交'}
          </Button>
        </View>
      </View>
    </View>
  )
}
