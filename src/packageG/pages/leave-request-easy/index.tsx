/**
 * 请假申请页面 - 三易原则优化版
 * 容易学：直观的界面和清晰的引导
 * 容易做：简化流程，智能填充
 * 容易管理：清晰的状态反馈
 */

import {Button, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {createLeaveRequest} from '@/db/api-leave'
import {
  calculateDays,
  calculateWorkDays,
  DATE_SHORTCUTS,
  formatDateFriendly,
  getLeaveTypeConfig,
  getLeaveTypeOptions,
  validateDateRange
} from '@/db/leave-type-config'

export default function LeaveRequestEasy() {
  const {user} = useAuth({guard: true})

  // 表单状态
  const [leaveType, setLeaveType] = useState('annual_leave')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [days, setDays] = useState(0)
  const [workDays, setWorkDays] = useState(0)

  // UI状态
  const [submitting, setSubmitting] = useState(false)
  const [_showDatePicker, _setShowDatePicker] = useState<'start' | 'end' | null>(null)
  const [_showTypePicker, setShowTypePicker] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [warningMessage, setWarningMessage] = useState('')

  // 获取休假类型选项
  const leaveTypeOptions = getLeaveTypeOptions()
  const currentTypeConfig = getLeaveTypeConfig(leaveType)

  // 初始化日期为明天
  useDidShow(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    setStartDate(dateStr)
    setEndDate(dateStr)
    updateDays(dateStr, dateStr)
  })

  // 更新天数计算
  const updateDays = useCallback((start: string, end: string) => {
    if (start && end) {
      const totalDays = calculateDays(start, end)
      const workingDays = calculateWorkDays(start, end)
      setDays(totalDays)
      setWorkDays(workingDays)

      // 验证日期
      const validation = validateDateRange(start, end)
      setValidationMessage(validation.valid ? '' : validation.message || '')
      setWarningMessage(validation.warning || '')
    }
  }, [])

  // 处理日期快捷选择
  const handleDateShortcut = useCallback(
    (shortcut: (typeof DATE_SHORTCUTS)[0]) => {
      const {startDate: start, endDate: end} = shortcut.getValue()
      setStartDate(start)
      setEndDate(end)
      updateDays(start, end)

      Taro.showToast({
        title: `已选择：${shortcut.label}`,
        icon: 'success',
        duration: 1500
      })
    },
    [updateDays]
  )

  // 处理开始日期变更
  const handleStartDateChange = useCallback(
    (e: any) => {
      const newStart = e.detail.value
      setStartDate(newStart)

      // 如果结束日期早于开始日期，自动调整
      if (endDate && newStart > endDate) {
        setEndDate(newStart)
        updateDays(newStart, newStart)
      } else {
        updateDays(newStart, endDate)
      }
    },
    [endDate, updateDays]
  )

  // 处理结束日期变更
  const handleEndDateChange = useCallback(
    (e: any) => {
      const newEnd = e.detail.value
      setEndDate(newEnd)
      updateDays(startDate, newEnd)
    },
    [startDate, updateDays]
  )

  // 处理休假类型变更
  const _handleTypeChange = useCallback(
    (e: any) => {
      const index = e.detail.value
      const selectedType = leaveTypeOptions[index]
      setLeaveType(selectedType.value)
      setShowTypePicker(false)

      // 显示类型提示
      const config = getLeaveTypeConfig(selectedType.value)
      if (config?.tips) {
        Taro.showToast({
          title: config.tips,
          icon: 'none',
          duration: 3000
        })
      }
    },
    [leaveTypeOptions]
  )

  // 提交申请
  const handleSubmit = useCallback(async () => {
    if (!user?.id) {
      Taro.showToast({title: '请先登录', icon: 'error'})
      return
    }

    // 验证表单
    if (!startDate || !endDate) {
      Taro.showToast({title: '请选择日期', icon: 'none'})
      return
    }

    if (validationMessage) {
      Taro.showToast({title: validationMessage, icon: 'none', duration: 2000})
      return
    }

    if (!reason.trim()) {
      Taro.showToast({title: '请填写请假理由', icon: 'none'})
      return
    }

    try {
      setSubmitting(true)

      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        Taro.showToast({title: '未找到员工信息', icon: 'error'})
        return
      }

      // 创建申请
      const result = await createLeaveRequest({
        tenant_id: employee.tenant_id,
        employee_id: employee.id,
        store_id: employee.store_id || '',
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        days,
        reason: reason.trim()
      })

      if (result) {
        Taro.showToast({
          title: '申请提交成功',
          icon: 'success',
          duration: 2000
        })

        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      } else {
        Taro.showToast({title: '提交失败，请重试', icon: 'error'})
      }
    } catch (error) {
      console.error('提交申请失败:', error)
      Taro.showToast({title: '提交失败', icon: 'error'})
    } finally {
      setSubmitting(false)
    }
  }, [user, startDate, endDate, leaveType, reason, days, validationMessage])

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <ScrollView scrollY className="h-screen" style={{background: 'transparent'}}>
        <View className="p-4 space-y-4">
          {/* 页面标题和说明 */}
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex items-center gap-3 mb-3">
              <View className="i-mdi-calendar-edit text-3xl text-blue-600" />
              <Text className="text-xl font-bold text-foreground">申请休假</Text>
            </View>
            <Text className="text-sm text-muted-foreground leading-relaxed">
              填写以下信息提交休假申请，管理员审批后生效
            </Text>
          </View>

          {/* 休假类型选择 */}
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-semibold text-foreground">休假类型</Text>
              <Text className="text-xs text-red-600">* 必选</Text>
            </View>

            <View className="grid grid-cols-2 gap-3">
              {leaveTypeOptions.map((option) => {
                const config = getLeaveTypeConfig(option.value)
                const isSelected = leaveType === option.value

                return (
                  <View
                    key={option.value}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white active:bg-gray-50'
                    }`}
                    onClick={() => setLeaveType(option.value)}>
                    <View className="flex items-center gap-2 mb-2">
                      <View className={`${config?.icon} text-2xl ${config?.color}`} />
                      <Text className={`font-semibold ${isSelected ? 'text-blue-600' : 'text-foreground'}`}>
                        {option.label}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted-foreground leading-relaxed">{option.description}</Text>
                    {option.isPaid && (
                      <View className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 rounded">
                        <View className="i-mdi-check-circle text-xs text-green-600" />
                        <Text className="text-xs text-green-600">带薪</Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>

            {/* 类型提示 */}
            {currentTypeConfig?.tips && (
              <View className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                <View className="i-mdi-lightbulb text-base text-blue-600 mt-0.5" />
                <Text className="text-xs text-blue-700 leading-relaxed flex-1">{currentTypeConfig.tips}</Text>
              </View>
            )}
          </View>

          {/* 日期快捷选择 */}
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-semibold text-foreground">快速选择日期</Text>
              <Text className="text-xs text-muted-foreground">点击快速填充</Text>
            </View>

            <View className="flex flex-wrap gap-2">
              {DATE_SHORTCUTS.map((shortcut) => (
                <View
                  key={shortcut.label}
                  className="px-4 py-2 bg-blue-50 rounded-lg active:bg-blue-100"
                  onClick={() => handleDateShortcut(shortcut)}>
                  <Text className="text-sm text-blue-600 font-medium">{shortcut.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 日期选择 */}
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-semibold text-foreground">请假日期</Text>
              <Text className="text-xs text-red-600">* 必填</Text>
            </View>

            {/* 开始日期 */}
            <View className="mb-4">
              <Text className="text-sm text-muted-foreground mb-2">开始日期</Text>
              <Picker mode="date" value={startDate} onChange={handleStartDateChange}>
                <View className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 active:border-blue-500">
                  <View className="flex items-center gap-3">
                    <View className="i-mdi-calendar-start text-xl text-blue-600" />
                    <View>
                      <Text className="text-base font-medium text-foreground block">{startDate || '请选择'}</Text>
                      {startDate && (
                        <Text className="text-xs text-muted-foreground">{formatDateFriendly(startDate)}</Text>
                      )}
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 结束日期 */}
            <View>
              <Text className="text-sm text-muted-foreground mb-2">结束日期</Text>
              <Picker mode="date" value={endDate} start={startDate} onChange={handleEndDateChange}>
                <View className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200 active:border-blue-500">
                  <View className="flex items-center gap-3">
                    <View className="i-mdi-calendar-end text-xl text-blue-600" />
                    <View>
                      <Text className="text-base font-medium text-foreground block">{endDate || '请选择'}</Text>
                      {endDate && <Text className="text-xs text-muted-foreground">{formatDateFriendly(endDate)}</Text>}
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 天数统计 */}
            {days > 0 && (
              <View className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-2">
                    <View className="i-mdi-calendar-clock text-xl text-blue-600" />
                    <Text className="text-sm text-muted-foreground">请假时长</Text>
                  </View>
                  <View className="flex items-center gap-4">
                    <View>
                      <Text className="text-2xl font-bold text-blue-600">{days}</Text>
                      <Text className="text-xs text-muted-foreground text-center">自然日</Text>
                    </View>
                    <View>
                      <Text className="text-2xl font-bold text-purple-600">{workDays}</Text>
                      <Text className="text-xs text-muted-foreground text-center">工作日</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* 验证提示 */}
            {validationMessage && (
              <View className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
                <View className="i-mdi-alert-circle text-base text-red-600 mt-0.5" />
                <Text className="text-xs text-red-700 leading-relaxed flex-1">{validationMessage}</Text>
              </View>
            )}

            {/* 警告提示 */}
            {warningMessage && !validationMessage && (
              <View className="mt-4 p-3 bg-orange-50 rounded-lg flex items-start gap-2">
                <View className="i-mdi-alert text-base text-orange-600 mt-0.5" />
                <Text className="text-xs text-orange-700 leading-relaxed flex-1">{warningMessage}</Text>
              </View>
            )}
          </View>

          {/* 请假理由 */}
          <View className="bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-base font-semibold text-foreground">请假理由</Text>
              <Text className="text-xs text-red-600">* 必填</Text>
            </View>

            <View className="bg-gray-50 rounded-xl border-2 border-gray-200 p-3">
              <Textarea
                className="w-full text-foreground"
                style={{minHeight: '120px', background: 'transparent', border: 'none'}}
                placeholder="请详细说明请假原因，方便管理员审批..."
                value={reason}
                maxlength={200}
                onInput={(e) => setReason(e.detail.value)}
              />
              <View className="flex justify-end mt-2">
                <Text className="text-xs text-muted-foreground">{reason.length}/200</Text>
              </View>
            </View>

            {/* 理由提示 */}
            <View className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <View className="i-mdi-information text-base text-blue-600 mt-0.5" />
              <Text className="text-xs text-blue-700 leading-relaxed flex-1">
                清晰的理由有助于加快审批速度。如需病假，请说明病情；如需事假，请说明具体事由。
              </Text>
            </View>
          </View>

          {/* 提交按钮 */}
          <View className="pb-8">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-4 rounded-2xl shadow-lg break-keep text-base font-semibold"
              size="default"
              onClick={handleSubmit}
              disabled={submitting || !!validationMessage}>
              {submitting ? (
                <View className="flex items-center justify-center gap-2">
                  <View className="i-mdi-loading animate-spin text-xl" />
                  <Text>提交中...</Text>
                </View>
              ) : (
                <View className="flex items-center justify-center gap-2">
                  <View className="i-mdi-send text-xl" />
                  <Text>提交申请</Text>
                </View>
              )}
            </Button>

            {/* 底部提示 */}
            <View className="mt-4 text-center">
              <Text className="text-xs text-muted-foreground">提交后将通知管理员审批，请耐心等待</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
