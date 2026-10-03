/**
 * 创建排班配置页面
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {createWorkScheduleConfig} from '@/db/api-schedule-config'

export default function ScheduleConfigCreate() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    type: 'daily',
    description: '',
    start_date: '',
    end_date: '',
    target_revenue: '',
    target_cost_ratio: '',
    min_staff: '',
    max_staff: ''
  })

  // 类型选项
  const typeOptions = [
    {label: '日常排班', value: 'daily'},
    {label: '周期排班', value: 'weekly'},
    {label: '临时排班', value: 'temporary'}
  ]

  // 处理类型选择
  const handleTypeChange = (e: any) => {
    const index = e.detail.value
    setFormData({...formData, type: typeOptions[index].value})
  }

  // 处理日期选择
  const handleDateChange = (field: 'start_date' | 'end_date', e: any) => {
    setFormData({...formData, [field]: e.detail.value})
  }

  // 处理输入
  const handleInput = (field: string, e: any) => {
    setFormData({...formData, [field]: e.detail.value})
  }

  // 提交表单
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.name.trim()) {
      Taro.showToast({title: '请输入排班名称', icon: 'none'})
      return
    }

    if (!formData.start_date) {
      Taro.showToast({title: '请选择开始日期', icon: 'none'})
      return
    }

    if (!user?.id) {
      Taro.showToast({title: '请先登录', icon: 'none'})
      return
    }

    try {
      setLoading(true)

      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee || !employee.tenant_id) {
        Taro.showToast({title: '未找到员工信息', icon: 'none'})
        return
      }

      // 创建排班配置
      const config = await createWorkScheduleConfig({
        tenant_id: employee.tenant_id,
        store_id: employee.store_id || '',
        name: formData.name.trim(),
        type: formData.type as 'daily' | 'weekly' | 'temporary',
        description: formData.description.trim() || undefined,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        created_by: user.id
      })

      if (config) {
        Taro.showToast({
          title: '创建成功',
          icon: 'success',
          duration: 2000
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      } else {
        Taro.showToast({title: '创建失败', icon: 'error'})
      }
    } catch (error) {
      console.error('创建排班配置失败:', error)
      Taro.showToast({title: '创建失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">创建排班配置</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">设置排班基本信息和目标参数</Text>
          </View>

          {/* 基本信息 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-information text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-semibold text-foreground">基本信息</Text>
            </View>

            {/* 排班名称 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground mb-2 block">排班名称 *</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-gray-50 text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder="请输入排班名称"
                  value={formData.name}
                  onInput={(e) => handleInput('name', e)}
                />
              </View>
            </View>

            {/* 排班类型 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground mb-2 block">排班类型</Text>
              <Picker mode="selector" range={typeOptions.map((t) => t.label)} onChange={handleTypeChange}>
                <View className="bg-gray-50 text-foreground px-3 py-2 rounded border border-border">
                  <Text>{typeOptions.find((t) => t.value === formData.type)?.label || '请选择'}</Text>
                </View>
              </Picker>
            </View>

            {/* 描述 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground mb-2 block">描述</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-gray-50 text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder="请输入排班描述（可选）"
                  value={formData.description}
                  onInput={(e) => handleInput('description', e)}
                  maxlength={200}
                  style={{minHeight: '80px'}}
                />
              </View>
            </View>

            {/* 开始日期 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground mb-2 block">开始日期 *</Text>
              <Picker mode="date" value={formData.start_date} onChange={(e) => handleDateChange('start_date', e)}>
                <View className="bg-gray-50 text-foreground px-3 py-2 rounded border border-border">
                  <Text>{formData.start_date || '请选择开始日期'}</Text>
                </View>
              </Picker>
            </View>

            {/* 结束日期 */}
            <View className="mb-0">
              <Text className="text-sm text-foreground mb-2 block">结束日期（可选）</Text>
              <Picker mode="date" value={formData.end_date} onChange={(e) => handleDateChange('end_date', e)}>
                <View className="bg-gray-50 text-foreground px-3 py-2 rounded border border-border">
                  <Text>{formData.end_date || '请选择结束日期'}</Text>
                </View>
              </Picker>
            </View>
          </View>

          {/* 目标参数 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-target text-2xl text-accent mr-2" />
              <Text className="text-lg font-semibold text-foreground">目标参数（可选）</Text>
            </View>

            {/* 目标营收 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground mb-2 block">目标营收（元）</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-gray-50 text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder="请输入目标营收"
                  type="number"
                  value={formData.target_revenue}
                  onInput={(e) => handleInput('target_revenue', e)}
                />
              </View>
            </View>

            {/* 目标成本率 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground mb-2 block">目标成本率（%）</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-gray-50 text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder="请输入目标成本率"
                  type="digit"
                  value={formData.target_cost_ratio}
                  onInput={(e) => handleInput('target_cost_ratio', e)}
                />
              </View>
            </View>

            {/* 最少人数 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground mb-2 block">最少人数</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-gray-50 text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder="请输入最少人数"
                  type="number"
                  value={formData.min_staff}
                  onInput={(e) => handleInput('min_staff', e)}
                />
              </View>
            </View>

            {/* 最多人数 */}
            <View className="mb-0">
              <Text className="text-sm text-foreground mb-2 block">最多人数</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-gray-50 text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder="请输入最多人数"
                  type="number"
                  value={formData.max_staff}
                  onInput={(e) => handleInput('max_staff', e)}
                />
              </View>
            </View>
          </View>

          {/* 提交按钮 */}
          <Button
            className="w-full bg-blue-100 text-white py-4 rounded-lg break-keep text-base"
            size="default"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}>
            {loading ? '创建中...' : '创建排班配置'}
          </Button>

          <View className="h-4" />
        </View>
      </ScrollView>
    </View>
  )
}
