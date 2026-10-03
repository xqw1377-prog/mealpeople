/**
 * 员工离职申请
 * 使用新的离职管理API和类型定义
 */

import {Button, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {createResignationApplication} from '@/db/api-resignation'
import type {ResignationReason, ResignationType} from '@/db/types-resignation'
import {RESIGNATION_REASON_NAMES, RESIGNATION_TYPE_NAMES} from '@/db/types-resignation'

export default function ResignationApply() {
  const {user} = useAuth({guard: true})
  const [reasonDetail, setReasonDetail] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [resignationType, setResignationType] = useState<ResignationType>('voluntary')
  const [resignationReason, setResignationReason] = useState<ResignationReason>('personal')
  const [submitting, setSubmitting] = useState(false)

  // 离职类型选项
  const resignationTypes: ResignationType[] = ['voluntary', 'involuntary', 'retirement', 'contract_end']
  const resignationTypeNames = resignationTypes.map((type) => RESIGNATION_TYPE_NAMES[type])

  // 离职原因选项
  const resignationReasons: ResignationReason[] = [
    'personal',
    'family',
    'health',
    'career',
    'salary',
    'location',
    'culture',
    'management',
    'other'
  ]
  const resignationReasonNames = resignationReasons.map((reason) => RESIGNATION_REASON_NAMES[reason])

  // 获取最小日期（30天后）
  const getMinDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  }

  // 提交离职申请
  const handleSubmit = async () => {
    // 验证表单
    if (!reasonDetail.trim()) {
      Taro.showToast({
        title: '请填写离职原因详情',
        icon: 'none'
      })
      return
    }

    if (!expectedDate) {
      Taro.showToast({
        title: '请选择期望离职日期',
        icon: 'none'
      })
      return
    }

    // 验证日期是否在30天后
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 30)
    const selectedDate = new Date(expectedDate)
    if (selectedDate < minDate) {
      Taro.showToast({
        title: '离职日期需在30天后',
        icon: 'none'
      })
      return
    }

    // 确认提交
    const confirmResult = await Taro.showModal({
      title: '确认提交',
      content: '提交后将进入离职审批流程，是否确认提交？'
    })

    if (!confirmResult.confirm) {
      return
    }

    setSubmitting(true)
    try {
      // 获取员工信息
      const employee = await getEmployeeByUserId(user?.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 调用API提交离职申请
      const result = await createResignationApplication({
        tenant_id: employee.tenant_id,
        employee_id: employee.id,
        resignation_type: resignationType,
        resignation_reason: resignationReason,
        resignation_reason_detail: reasonDetail.trim(),
        expected_last_day: expectedDate,
        actual_last_day: null,
        notice_period: 30,
        status: 'pending',
        approved_at: null,
        rejected_at: null,
        completed_at: null,
        notes: null
      })

      if (!result) {
        throw new Error('提交失败')
      }

      await Taro.showModal({
        title: '提交成功',
        content: '您的离职申请已提交，请等待审批。审批结果将通过系统通知您。',
        showCancel: false,
        success: () => {
          Taro.navigateBack()
        }
      })
    } catch (error) {
      console.error('提交离职申请失败:', error)
      Taro.showToast({
        title: error instanceof Error ? error.message : '提交失败',
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
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">提交离职申请</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">请认真填写离职信息</Text>
          </View>

          {/* 温馨提示 */}
          <View className="bg-blue-100 border border-orange-200 rounded-lg p-4 mb-4">
            <View className="flex items-start">
              <View className="i-mdi-information text-xl text-orange-500 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-orange-600 block mb-1">温馨提示</Text>
                <Text className="text-xs text-orange-600 block">
                  1. 根据劳动合同法规定，正式员工需提前30天提交离职申请
                </Text>
                <Text className="text-xs text-orange-600 block">2. 试用期员工需提前3天提交离职申请</Text>
                <Text className="text-xs text-orange-600 block">3. 提交后请等待HR审批，审批通过后将进入离职流程</Text>
                <Text className="text-xs text-orange-600 block">4. 离职期间请做好工作交接，确保工作顺利移交</Text>
              </View>
            </View>
          </View>

          {/* 表单 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            {/* 离职类型 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2 block">
                离职类型 <Text className="text-red-500">*</Text>
              </Text>
              <Picker
                mode="selector"
                range={resignationTypeNames}
                value={resignationTypes.indexOf(resignationType)}
                onChange={(e) => setResignationType(resignationTypes[e.detail.value])}>
                <View className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <Text className="text-sm text-foreground">{RESIGNATION_TYPE_NAMES[resignationType]}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 离职原因类型 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2 block">
                离职原因类型 <Text className="text-red-500">*</Text>
              </Text>
              <Picker
                mode="selector"
                range={resignationReasonNames}
                value={resignationReasons.indexOf(resignationReason)}
                onChange={(e) => setResignationReason(resignationReasons[e.detail.value])}>
                <View className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <Text className="text-sm text-foreground">{RESIGNATION_REASON_NAMES[resignationReason]}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 详细原因 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2 block">
                详细原因 <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-gray-50 text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder="请详细说明您的离职原因（至少20字）"
                  value={reasonDetail}
                  onInput={(e) => setReasonDetail(e.detail.value)}
                  maxlength={500}
                  style={{minHeight: '120px'}}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1 block">{reasonDetail.length}/500</Text>
            </View>

            {/* 期望离职日期 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2 block">
                期望离职日期 <Text className="text-red-500">*</Text>
              </Text>
              <Picker
                mode="date"
                start={getMinDate()}
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.detail.value)}>
                <View className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <View className="flex items-center">
                    <View className="i-mdi-calendar text-xl text-blue-600 mr-2" />
                    <Text className="text-sm text-foreground">{expectedDate || '请选择日期'}</Text>
                  </View>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                </View>
              </Picker>
              <Text className="text-xs text-muted-foreground mt-1 block">最早可选日期：{getMinDate()}（30天后）</Text>
            </View>
          </View>

          {/* 离职流程说明 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-foreground mb-3">离职流程说明</Text>
            <View className="space-y-3">
              <View className="flex items-start">
                <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <Text className="text-xs font-medium text-blue-600">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground block">提交申请</Text>
                  <Text className="text-xs text-muted-foreground block">填写离职信息并提交</Text>
                </View>
              </View>

              <View className="flex items-start">
                <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <Text className="text-xs font-medium text-blue-600">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground block">HR审批</Text>
                  <Text className="text-xs text-muted-foreground block">等待HR审批您的离职申请</Text>
                </View>
              </View>

              <View className="flex items-start">
                <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <Text className="text-xs font-medium text-blue-600">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground block">工作交接</Text>
                  <Text className="text-xs text-muted-foreground block">完成工作交接和资产归还</Text>
                </View>
              </View>

              <View className="flex items-start">
                <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <Text className="text-xs font-medium text-blue-600">4</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground block">离职面谈</Text>
                  <Text className="text-xs text-muted-foreground block">与HR进行离职面谈</Text>
                </View>
              </View>

              <View className="flex items-start">
                <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                  <Text className="text-xs font-medium text-blue-600">5</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground block">办理离职</Text>
                  <Text className="text-xs text-muted-foreground block">完成离职手续，领取离职证明</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 提交按钮 */}
          <View className="mb-20">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded break-keep text-base"
              size="default"
              onClick={handleSubmit}
              disabled={submitting}>
              {submitting ? '提交中...' : '提交离职申请'}
            </Button>
            <Text className="text-xs text-muted-foreground text-center mt-2 block">
              提交即表示您已阅读并同意离职流程
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
