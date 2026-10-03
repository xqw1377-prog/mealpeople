/**
 * 离职申请表单页面 - 离职管理
 */

import {Button, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import {createResignationRequest} from '@/db/api-lifecycle'
import {useTenantStore} from '@/store/tenant'

export default function ResignationForm() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [resignationType, setResignationType] = useState('voluntary')
  const [resignationReason, setResignationReason] = useState('')
  const [lastWorkingDate, setLastWorkingDate] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 离职类型选项
  const resignationTypes = [
    {label: '主动离职', value: 'voluntary'},
    {label: '被动离职', value: 'involuntary'},
    {label: '退休', value: 'retirement'},
    {label: '合同到期', value: 'contract_end'}
  ]

  // 离职原因选项
  const resignationReasons = ['个人发展', '薪资待遇', '工作环境', '家庭原因', '健康原因', '继续深造', '创业', '其他']

  // 处理离职类型选择
  const handleTypeChange = (e: any) => {
    const index = e.detail.value
    setResignationType(resignationTypes[index].value)
  }

  // 处理离职原因选择
  const handleReasonChange = (e: any) => {
    const index = e.detail.value
    setResignationReason(resignationReasons[index])
  }

  // 处理日期选择
  const handleDateChange = (e: any) => {
    setLastWorkingDate(e.detail.value)
  }

  // 提交离职申请
  const handleSubmit = async () => {
    if (!user || !currentTenant) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    if (!resignationReason) {
      Taro.showToast({
        title: '请选择离职原因',
        icon: 'none'
      })
      return
    }

    if (!lastWorkingDate) {
      Taro.showToast({
        title: '请选择最后工作日',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)
    try {
      await createResignationRequest({
        tenant_id: currentTenant.id,
        employee_id: user.id,
        reason_type: resignationType,
        reason_detail: resignationReason,
        last_working_day: lastWorkingDate,
        status: 'pending'
      })

      Taro.showToast({
        title: '提交成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交离职申请失败:', error)
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
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 提示信息 */}
          <View className="bg-destructive/10 rounded-xl p-4 mb-4 border border-destructive/20">
            <View className="flex items-start">
              <View className="i-mdi-information text-2xl text-destructive mr-3 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-destructive mb-1">离职申请须知</Text>
                <Text className="text-xs text-destructive/80">
                  1. 请提前30天提交离职申请{'\n'}
                  2. 离职申请提交后需等待审批{'\n'}
                  3. 请确保工作交接完成{'\n'}
                  4. 离职手续办理完成后方可离职
                </Text>
              </View>
            </View>
          </View>

          {/* 离职类型 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-semibold text-foreground mb-3">离职类型</Text>
            <Picker mode="selector" range={resignationTypes.map((t) => t.label)} onChange={handleTypeChange}>
              <View className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <Text className="text-sm text-foreground">
                  {resignationTypes.find((t) => t.value === resignationType)?.label || '请选择'}
                </Text>
                <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
              </View>
            </Picker>
          </View>

          {/* 离职原因 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-semibold text-foreground mb-3">离职原因</Text>
            <Picker mode="selector" range={resignationReasons} onChange={handleReasonChange}>
              <View className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <Text className="text-sm text-foreground">{resignationReason || '请选择'}</Text>
                <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
              </View>
            </Picker>
          </View>

          {/* 最后工作日 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-semibold text-foreground mb-3">最后工作日</Text>
            <Picker mode="date" value={lastWorkingDate} onChange={handleDateChange}>
              <View className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <Text className="text-sm text-foreground">{lastWorkingDate || '请选择日期'}</Text>
                <View className="i-mdi-calendar text-xl text-muted-foreground" />
              </View>
            </Picker>
          </View>

          {/* 补充说明 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-semibold text-foreground mb-3">补充说明（可选）</Text>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-gray-50 text-foreground px-3 py-2 rounded-lg border border-border w-full"
                placeholder="请输入补充说明..."
                value={additionalNotes}
                onInput={(e) => setAdditionalNotes(e.detail.value)}
                maxlength={500}
                style={{minHeight: '120px'}}
              />
            </View>
            <Text className="text-xs text-muted-foreground mt-2">{additionalNotes.length}/500</Text>
          </View>

          {/* 提交按钮 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Button
              className="w-full bg-destructive text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={handleSubmit}
              disabled={submitting}>
              {submitting ? '提交中...' : '提交离职申请'}
            </Button>
          </View>

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}
