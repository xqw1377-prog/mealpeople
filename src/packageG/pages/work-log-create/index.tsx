/**
 * 工作记录创建页面
 * V3.17 新增功能 - 创建详细工作记录
 * 设计理念：简洁、快速、便捷
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {createWorkRecord, type WorkRecord} from '@/db/api-work-records'

// 工作类型选项
const WORK_TYPE_OPTIONS: Array<{
  value: WorkRecord['work_type']
  label: string
  icon: string
  color: string
}> = [
  {value: 'customer_service', label: '接待客户', icon: 'i-mdi-account-group', color: 'bg-blue-100 text-white'},
  {value: 'cleaning', label: '清洁卫生', icon: 'i-mdi-broom', color: 'bg-blue-100 text-muted-foreground'},
  {value: 'inventory', label: '库存盘点', icon: 'i-mdi-package-variant', color: 'bg-blue-100 text-muted-foreground'},
  {value: 'maintenance', label: '设备维护', icon: 'i-mdi-tools', color: 'bg-blue-100 text-muted-foreground'},
  {value: 'training', label: '培训学习', icon: 'i-mdi-school', color: 'bg-cyan-50 text-cyan-600'},
  {value: 'other', label: '其他工作', icon: 'i-mdi-note-text', color: 'bg-muted text-muted-foreground'}
]

export default function WorkLogCreate() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<WorkRecord['work_type']>('customer_service')
  const [workContent, setWorkContent] = useState('')
  const [note, setNote] = useState('')

  // 从URL参数获取预设类型
  const params = Taro.getCurrentInstance().router?.params
  if (params?.type && !selectedType) {
    setSelectedType(params.type as WorkRecord['work_type'])
  }

  // 提交工作记录
  const handleSubmit = async () => {
    if (!workContent.trim()) {
      Taro.showToast({
        title: '请输入工作内容',
        icon: 'none'
      })
      return
    }

    if (!user?.id) {
      Taro.showToast({
        title: '用户信息错误',
        icon: 'error'
      })
      return
    }

    try {
      setLoading(true)

      // 获取员工ID
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        Taro.showToast({
          title: '未找到员工信息',
          icon: 'error'
        })
        return
      }

      // 创建工作记录
      const record = await createWorkRecord(employee.id, user.id, {
        workType: selectedType,
        workContent: workContent.trim(),
        note: note.trim() || undefined,
        status: 'completed'
      })

      if (record) {
        Taro.showToast({
          title: '记录成功',
          icon: 'success',
          duration: 2000
        })

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({
          title: '记录失败，请重试',
          icon: 'error'
        })
      }
    } catch (error) {
      console.error('创建工作记录失败:', error)
      Taro.showToast({
        title: '记录失败，请重试',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <Text className="text-xl font-bold text-foreground">创建工作记录</Text>
            <Text className="text-sm text-muted-foreground mt-2">记录您的工作内容，留下成长足迹</Text>
          </View>

          {/* 工作类型选择 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-4">工作类型</Text>
            <View className="grid grid-cols-2 gap-3">
              {WORK_TYPE_OPTIONS.map((option) => (
                <View
                  key={option.value}
                  className={`rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70 ${
                    selectedType === option.value ? option.color : 'bg-gray-50/30'
                  }`}
                  onClick={() => setSelectedType(option.value)}>
                  <View
                    className={`${option.icon} text-2xl mb-2 ${
                      selectedType === option.value ? option.color.split(' ')[1] : 'text-muted-foreground'
                    }`}
                  />
                  <Text
                    className={`text-sm font-medium ${
                      selectedType === option.value ? option.color.split(' ')[1] : 'text-muted-foreground'
                    }`}>
                    {option.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 工作内容 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-4">工作内容 *</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-gray-50/30 text-foreground px-4 py-3 rounded-xl border border-border w-full"
                placeholder="请详细描述您的工作内容..."
                value={workContent}
                onInput={(e) => setWorkContent(e.detail.value)}
                maxlength={500}
                style={{minHeight: '120px'}}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-2">{workContent.length}/500</Text>
          </View>

          {/* 备注 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-4">备注（可选）</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-gray-50/30 text-foreground px-4 py-3 rounded-xl border border-border w-full"
                placeholder="添加备注信息..."
                value={note}
                onInput={(e) => setNote(e.detail.value)}
                maxlength={200}
                style={{minHeight: '80px'}}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-2">{note.length}/200</Text>
          </View>

          {/* 提交按钮 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base font-bold"
              size="default"
              onClick={handleSubmit}
              disabled={loading || !workContent.trim()}>
              {loading ? '提交中...' : '提交记录'}
            </Button>
          </View>

          {/* 底部占位 */}
          <View className="h-4" />
        </View>
      </ScrollView>
    </View>
  )
}
