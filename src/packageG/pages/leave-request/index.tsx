/**
 * 休假申请页面
 */

import {Button, Picker, Text, Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {createLeaveRequest} from '@/db/api-leave'
import {LEAVE_TYPE_OPTIONS} from '@/db/types-leave'

const LeaveRequest: React.FC = () => {
  const {user} = useAuth({guard: true})

  // 表单状态
  const [leaveType, setLeaveType] = useState<string>('annual_leave')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [days, setDays] = useState(0)

  // 提交状态
  const [submitting, setSubmitting] = useState(false)

  // 格式化日期
  const formatDate = useCallback((date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  // 初始化日期
  useEffect(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    setStartDate(formatDate(today))
    setEndDate(formatDate(tomorrow))
  }, [formatDate])

  // 计算天数
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      setDays(diffDays > 0 ? diffDays : 0)
    }
  }, [startDate, endDate])

  // 处理休假类型选择
  const handleLeaveTypeChange = (e: any) => {
    const index = e.detail.value
    setLeaveType(LEAVE_TYPE_OPTIONS[index].value)
  }

  // 处理开始日期选择
  const handleStartDateChange = (e: any) => {
    setStartDate(e.detail.value)
  }

  // 处理结束日期选择
  const handleEndDateChange = (e: any) => {
    setEndDate(e.detail.value)
  }

  // 处理原因输入
  const handleReasonChange = (e: any) => {
    setReason(e.detail.value)
  }

  // 提交申请
  const handleSubmit = async () => {
    if (!user?.id) {
      Taro.showToast({title: '用户信息错误', icon: 'error'})
      return
    }

    if (!startDate || !endDate) {
      Taro.showToast({title: '请选择日期', icon: 'error'})
      return
    }

    if (days <= 0) {
      Taro.showToast({title: '日期范围无效', icon: 'error'})
      return
    }

    if (!reason.trim()) {
      Taro.showToast({title: '请填写请假原因', icon: 'error'})
      return
    }

    try {
      setSubmitting(true)

      // 获取租户ID和门店ID
      const tenantId = localStorage.getItem('currentTenantId') || ''
      const storeId = localStorage.getItem('currentStoreId') || ''

      if (!tenantId || !storeId) {
        Taro.showToast({title: '请先选择租户和门店', icon: 'error'})
        return
      }

      await createLeaveRequest({
        tenant_id: tenantId,
        employee_id: user.id,
        store_id: storeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        days,
        reason: reason.trim()
      })

      Taro.showToast({
        title: '申请已提交',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交申请失败:', error)
      Taro.showToast({
        title: '提交失败',
        icon: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const leaveTypeIndex = LEAVE_TYPE_OPTIONS.findIndex((opt) => opt.value === leaveType)

  return (
    <View className="min-h-screen bg-gray-50 p-4">
      {/* 休假类型 */}
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow">
        <Text className="text-sm text-muted-foreground mb-2">休假类型</Text>
        <Picker
          mode="selector"
          range={LEAVE_TYPE_OPTIONS.map((opt) => opt.label)}
          value={leaveTypeIndex}
          onChange={handleLeaveTypeChange}>
          <View className="flex flex-row items-center justify-between py-2">
            <Text className="text-base">{LEAVE_TYPE_OPTIONS[leaveTypeIndex].label}</Text>
            <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
          </View>
        </Picker>
      </View>

      {/* 开始日期 */}
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow">
        <Text className="text-sm text-muted-foreground mb-2">开始日期</Text>
        <Picker mode="date" value={startDate} onChange={handleStartDateChange}>
          <View className="flex flex-row items-center justify-between py-2">
            <Text className="text-base">{startDate}</Text>
            <View className="i-mdi-calendar text-xl text-blue-600" />
          </View>
        </Picker>
      </View>

      {/* 结束日期 */}
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow">
        <Text className="text-sm text-muted-foreground mb-2">结束日期</Text>
        <Picker mode="date" value={endDate} start={startDate} onChange={handleEndDateChange}>
          <View className="flex flex-row items-center justify-between py-2">
            <Text className="text-base">{endDate}</Text>
            <View className="i-mdi-calendar text-xl text-blue-600" />
          </View>
        </Picker>
      </View>

      {/* 请假天数 */}
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow">
        <Text className="text-sm text-muted-foreground mb-2">请假天数</Text>
        <Text className="text-2xl font-bold text-blue-600">{days} 天</Text>
      </View>

      {/* 请假原因 */}
      <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow">
        <Text className="text-sm text-muted-foreground mb-2">请假原因</Text>
        <View style={{overflow: 'hidden'}}>
          <Textarea
            className="w-full bg-gray-50 rounded-lg p-3 text-sm"
            placeholder="请输入请假原因"
            value={reason}
            onInput={handleReasonChange}
            maxlength={200}
            style={{minHeight: '100px'}}
          />
        </View>
        <Text className="text-xs text-muted-foreground mt-2 text-right">{reason.length}/200</Text>
      </View>

      {/* 提交按钮 */}
      <Button
        className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base font-semibold"
        size="default"
        onClick={handleSubmit}
        disabled={submitting || days <= 0 || !reason.trim()}>
        {submitting ? '提交中...' : '提交申请'}
      </Button>
    </View>
  )
}

export default LeaveRequest
