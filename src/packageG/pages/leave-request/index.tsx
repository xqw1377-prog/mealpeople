/**
 * 休假申请 · P2 重写（command RPC + DS）
 * 主线：类型 → 日期范围 → 原因 → 提交
 * DS：TabHero / Field / tokens；inline 校验；服务端冲突原因透出
 */

import {Picker, Text, Textarea, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {Field, TabHero} from '@/components/ds'

const TYPES = [
  {value: 'annual_leave', label: '年假'},
  {value: 'sick_leave', label: '病假'},
  {value: 'personal_leave', label: '事假'},
  {value: 'other', label: '其他'}
]

const LeaveRequest: React.FC = () => {
  useAuth({guard: true})

  const [typeIndex, setTypeIndex] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<{date?: string}>({})

  useEffect(() => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    setStartDate(fmt(today))
    setEndDate(fmt(tomorrow))
  }, [])

  const days = useCallback(() => {
    if (!startDate || !endDate) return 0
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime()
    return Math.max(0, Math.ceil(diff / 86400000) + 1)
  }, [startDate, endDate])

  const submit = async () => {
    if (submitting) return
    const errs: typeof fieldError = {}
    if (!startDate || !endDate) errs.date = '请选择日期范围'
    else if (endDate < startDate) errs.date = '结束日期不能早于开始日期'
    setFieldError(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const {error} = await supabase.rpc('leave_request', {
        p_leave_type: TYPES[typeIndex].value,
        p_start_date: startDate,
        p_end_date: endDate,
        p_reason: reason.trim() || null
      })
      if (error) {
        setSubmitError(error.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, ''))
        return
      }
      Taro.showToast({title: '申请已提交，等待审批', icon: 'success'})
      setTimeout(() => Taro.navigateBack(), 1200)
    } catch (e) {
      console.error('提交请假失败:', e)
      setSubmitError('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <TabHero title="休假申请" subtitle="提交后等待管理者审批" />
      <View className="px-4 pb-8 -mt-9">
        {/* 类型 */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <Field label="请假类型" required>
            <Picker
              mode="selector"
              range={TYPES.map((t) => t.label)}
              value={typeIndex}
              onChange={(e) => setTypeIndex(Number(e.detail.value))}>
              <View className="w-full px-3 py-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                <Text className="text-sm text-gray-800">{TYPES[typeIndex].label}</Text>
                <View className="i-mdi-chevron-down text-gray-300" />
              </View>
            </Picker>
          </Field>
        </View>

        {/* 日期 */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <Field label="起止日期" required error={fieldError.date}>
            <View className="flex items-center gap-2">
              <Picker mode="date" value={startDate} onChange={(e) => setStartDate(e.detail.value)}>
                <View className="px-3 py-2.5 rounded-xl border border-gray-200">
                  <Text className={startDate ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                    {startDate || '开始'}
                  </Text>
                </View>
              </Picker>
              <Text className="text-gray-300">–</Text>
              <Picker mode="date" value={endDate} onChange={(e) => setEndDate(e.detail.value)}>
                <View className="px-3 py-2.5 rounded-xl border border-gray-200">
                  <Text className={endDate ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                    {endDate || '结束'}
                  </Text>
                </View>
              </Picker>
            </View>
          </Field>
          {startDate && endDate && endDate >= startDate && (
            <Text className="text-2xs text-gray-400 mt-1.5">共 {days()} 天（含首尾）</Text>
          )}
        </View>

        {/* 原因 */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <Field label="请假原因（可选）">
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 w-full text-sm"
                placeholder="补充说明有助于审批…"
                value={reason}
                onInput={(e) => setReason(e.detail.value)}
                maxlength={200}
                style={{minHeight: '80px'}}
              />
            </View>
          </Field>
        </View>

        {submitError && (
          <View className="bg-danger-50 rounded-xl p-3 flex items-start gap-2 mb-3">
            <View className="i-mdi-alert-circle-outline text-lg text-danger-500 mt-0.5" />
            <Text className="text-xs text-danger-600 flex-1">{submitError}</Text>
          </View>
        )}

        <View className="bg-primary-50 rounded-xl p-3 mb-3 flex items-center gap-2">
          <View className="i-mdi-information-outline text-lg text-primary-500" />
          <Text className="text-xs text-gray-500 flex-1">提交后通知管理者审批；审批时服务端会检查日期重叠</Text>
        </View>

        <View
          className={`rounded-xl py-3 text-center ${submitting ? 'bg-gray-200' : 'bg-primary-500 active:opacity-80'}`}
          onClick={submit}>
          <Text className={`text-sm ${submitting ? 'text-gray-400' : 'text-white'}`}>
            {submitting ? '提交中…' : '提交申请'}
          </Text>
        </View>
      </View>
    </View>
  )
}

export default LeaveRequest
