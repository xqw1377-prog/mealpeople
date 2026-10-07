/**
 * 换班申请 · P2-S1-B 重设计（三步流程）
 * 1 选择我的班 → 2 选择同事班（purpose-built 候选 RPC）→ 3 原因 + 确认
 * 选中后直呈「我的 ⇅ 交换」对照；服务端拒绝原因贴近提交处解释
 * DS：TabHero / ErrorBanner / tokens；防重复提交
 */

import {ScrollView, Text, Textarea, View} from '@tarojs/components'
import {navigateBack, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {ErrorBanner, TabHero} from '@/components/ds'

interface ShiftOption {
  id: string
  date: string
  dayOfWeek: string
  ownerName: string
  startTime: string
  endTime: string
}

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const ShiftSwap: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [targetsLoading, setTargetsLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [myShifts, setMyShifts] = useState<ShiftOption[]>([])
  const [selectedMyShift, setSelectedMyShift] = useState<ShiftOption | null>(null)
  const [targetShifts, setTargetShifts] = useState<ShiftOption[]>([])
  const [selectedTargetShift, setSelectedTargetShift] = useState<ShiftOption | null>(null)
  const [reason, setReason] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  // 步骤 1 数据：本人 published、今天起、非排休
  const loadMyShifts = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const {data: empRows, error: empErr} = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
      if (empErr) throw empErr

      const today = new Date().toISOString().slice(0, 10)
      const {data: rows, error} = await supabase
        .from('schedules')
        .select('id, schedule_date, start_time, end_time')
        .in(
          'employee_id',
          (empRows || []).map((e: {id: string}) => e.id)
        )
        .eq('status', 'published')
        .eq('is_day_off', false)
        .gte('schedule_date', today)
        .order('schedule_date')
        .order('start_time')
      if (error) throw error

      setMyShifts(
        (
          (rows || []) as unknown as {
            id: string
            schedule_date: string
            start_time: string | null
            end_time: string | null
          }[]
        ).map((r) => ({
          id: r.id,
          date: String(r.schedule_date).slice(0, 10),
          dayOfWeek: WEEK_DAYS[new Date(r.schedule_date).getDay()],
          ownerName: '我',
          startTime: (r.start_time || '').slice(0, 5),
          endTime: (r.end_time || '').slice(0, 5)
        }))
      )
    } catch (e) {
      console.error('加载班次失败:', e)
      setError('班次加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadMyShifts()
  })

  // 步骤 2 数据：候选 RPC（最小字段，服务端验证本人班次）
  const loadTargets = useCallback(async (my: ShiftOption) => {
    setTargetsLoading(true)
    setError(null)
    try {
      const {data, error: rpcErr} = await supabase.rpc('list_schedule_swap_candidates', {
        p_requester_schedule_id: my.id
      })
      if (rpcErr) throw rpcErr
      setTargetShifts(
        (
          (data || []) as unknown as {
            schedule_id: string
            employee_name: string
            schedule_date: string
            start_time: string
            end_time: string
          }[]
        ).map((r) => ({
          id: r.schedule_id,
          date: String(r.schedule_date).slice(0, 10),
          dayOfWeek: WEEK_DAYS[new Date(r.schedule_date).getDay()],
          ownerName: r.employee_name || '同事',
          startTime: (r.start_time || '').slice(0, 5),
          endTime: (r.end_time || '').slice(0, 5)
        }))
      )
    } catch (e) {
      console.error('加载候选失败:', e)
      setError('候选加载失败，请重试')
    } finally {
      setTargetsLoading(false)
    }
  }, [])

  const pickMine = (s: ShiftOption) => {
    setSelectedMyShift(s)
    setSelectedTargetShift(null)
    setStep(2)
    loadTargets(s)
  }

  const pickTarget = (s: ShiftOption) => {
    setSelectedTargetShift(s)
    setStep(3)
  }

  const submit = async () => {
    if (!selectedMyShift || !selectedTargetShift || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const {error: rpcErr} = await supabase.rpc('request_schedule_swap', {
        p_requester_schedule_id: selectedMyShift.id,
        p_target_schedule_id: selectedTargetShift.id,
        p_reason: reason.trim()
      })
      if (rpcErr) {
        setSubmitError(rpcErr.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, ''))
        return
      }
      showToast({title: '已提交，等待审批', icon: 'success'})
      setTimeout(() => navigateBack(), 1200)
    } catch (e) {
      console.error('提交换班失败:', e)
      setSubmitError('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const optionCard = (s: ShiftOption, selected: boolean, onTap: () => void) => (
    <View
      key={s.id}
      className={`rounded-xl border p-4 ${selected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'}`}
      onClick={onTap}>
      <View className="flex items-center justify-between">
        <View>
          <Text className="text-sm font-semibold text-gray-800">
            {s.ownerName} · {s.dayOfWeek} {s.date.slice(5)}
          </Text>
          <Text className="text-xs text-gray-500 mt-1">
            {s.startTime} – {s.endTime}
          </Text>
        </View>
        {selected && <View className="i-mdi-check-circle text-2xl text-primary-500" />}
      </View>
    </View>
  )

  const stepTab = (n: number, label: string) => (
    <View
      className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg ${step === n ? 'bg-primary-500' : step > n ? 'bg-primary-100' : 'bg-gray-100'}`}>
      {step > n && <View className="i-mdi-check text-sm text-primary-600" />}
      <Text className={`text-xs ${step === n ? 'text-white' : step > n ? 'text-primary-600' : 'text-gray-400'}`}>
        {label}
      </Text>
    </View>
  )

  return (
    <View className="min-h-screen bg-gray-50">
      <TabHero title="发起换班" subtitle="选择双方班次 · 等待管理者审批" />
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="px-4 pb-8 -mt-9">
          {/* 步骤指示 */}
          <View className="flex gap-2 mb-4">
            {stepTab(1, '我的班')}
            <View className="i-mdi-chevron-right text-gray-300 self-center" />
            {stepTab(2, '同事班')}
            <View className="i-mdi-chevron-right text-gray-300 self-center" />
            {stepTab(3, '确认')}
          </View>

          {error && (
            <View className="mb-3">
              <ErrorBanner
                message={error}
                onRetry={() => (step === 2 && selectedMyShift ? loadTargets(selectedMyShift) : loadMyShifts())}
              />
            </View>
          )}

          {/* 已选对照卡：我的 ⇅ 交换 */}
          {step > 1 && selectedMyShift && (
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <View className="flex items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-gray-400">我的班次</Text>
                  <Text className="text-sm font-semibold text-gray-800 mt-1">
                    {selectedMyShift.date.slice(5).replace('-', '月 ')}日
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {selectedMyShift.startTime} – {selectedMyShift.endTime}
                  </Text>
                </View>
                <View className="mx-2 i-mdi-swap-horizontal-circle text-3xl text-primary-500" />
                <View className="flex-1 text-right">
                  {selectedTargetShift ? (
                    <>
                      <Text className="text-xs text-gray-400">交换 · {selectedTargetShift.ownerName}</Text>
                      <Text className="text-sm font-semibold text-gray-800 mt-1">
                        {selectedTargetShift.date.slice(5).replace('-', '月 ')}日
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {selectedTargetShift.startTime} – {selectedTargetShift.endTime}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-xs text-gray-300">待选择同事班次</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Step 1 */}
          {step === 1 &&
            (loading ? (
              <View className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <View key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </View>
            ) : myShifts.length === 0 ? (
              <View className="bg-white rounded-2xl shadow-sm py-10 flex flex-col items-center">
                <View className="i-mdi-calendar-blank text-5xl text-gray-200" />
                <Text className="mt-2 text-sm text-gray-400">暂无可换的班次</Text>
                <Text className="mt-1 text-xs text-gray-300">仅显示今天起的已发布工作班</Text>
              </View>
            ) : (
              <View className="space-y-2">
                <Text className="text-xs text-gray-400 px-1">选择你要换出的班次</Text>
                {myShifts.map((s) => optionCard(s, false, () => pickMine(s)))}
              </View>
            ))}

          {/* Step 2 */}
          {step === 2 && (
            <View className="space-y-2">
              <View className="flex items-center justify-between px-1">
                <Text className="text-xs text-gray-400">选择同门店同事的班次</Text>
                <Text className="text-xs text-primary-500" onClick={() => setStep(1)}>
                  重选我的班
                </Text>
              </View>
              {targetsLoading ? (
                <View className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <View key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
                  ))}
                </View>
              ) : targetShifts.length === 0 ? (
                <View className="bg-white rounded-2xl shadow-sm py-10 flex flex-col items-center">
                  <View className="i-mdi-account-search text-5xl text-gray-200" />
                  <Text className="mt-2 text-sm text-gray-400">该门店暂无可换的同事班次</Text>
                </View>
              ) : (
                targetShifts.map((s) => optionCard(s, false, () => pickTarget(s)))
              )}
            </View>
          )}

          {/* Step 3 */}
          {step === 3 && selectedTargetShift && (
            <View className="space-y-3">
              <View className="bg-white rounded-2xl shadow-sm p-4">
                <Text className="text-sm font-semibold text-gray-800 mb-2">换班原因</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 w-full text-sm"
                    placeholder="请说明换班原因，便于管理者审批…"
                    value={reason}
                    onInput={(e) => setReason(e.detail.value)}
                    maxlength={200}
                    style={{minHeight: '100px'}}
                  />
                </View>
                <View className="mt-1 flex justify-end">
                  <Text className="text-2xs text-gray-400">{reason.length}/200</Text>
                </View>
              </View>

              {submitError && (
                <View className="bg-danger-50 rounded-xl p-3 flex items-start gap-2">
                  <View className="i-mdi-alert-circle-outline text-lg text-danger-500 mt-0.5" />
                  <Text className="text-xs text-danger-600 flex-1">{submitError}</Text>
                </View>
              )}

              <View className="flex gap-3">
                <View
                  className="flex-1 bg-white rounded-xl py-3 text-center border border-gray-200 active:opacity-70"
                  onClick={() => setStep(2)}>
                  <Text className="text-sm text-gray-600">重选同事班</Text>
                </View>
                <View
                  className={`flex-1 rounded-xl py-3 text-center ${reason.trim() && !submitting ? 'bg-primary-500 active:opacity-80' : 'bg-gray-200'}`}
                  onClick={submit}>
                  <Text className={`text-sm ${reason.trim() && !submitting ? 'text-white' : 'text-gray-400'}`}>
                    {submitting ? '提交中…' : '提交申请'}
                  </Text>
                </View>
              </View>

              <View className="bg-primary-50 rounded-xl p-3 flex items-start gap-2">
                <View className="i-mdi-information-outline text-lg text-primary-500 mt-0.5" />
                <Text className="text-xs text-gray-500 flex-1">
                  提交后等待门店管理者审批；审批时服务端会校验交换后双方是否冲突，通过后班次自动交换并通知双方
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default ShiftSwap
