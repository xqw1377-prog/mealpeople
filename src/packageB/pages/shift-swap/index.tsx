/**
 * 换班申请页面
 * P2-S1-A cutover：候选班次与提交全部走 schedules 真实数据 + command RPC。
 * - 我的班次：本人 schedules published（RLS 隔离 legacy/他人）
 * - 目标班次：同门店其他同事的 published 班次（schedules_select_store_published）
 * - 提交：request_schedule_swap（服务端校验同店/在职/pending 重复，错误原因透出）
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'

interface ShiftOption {
  id: string
  date: string
  dayOfWeek: string
  ownerName: string
  startTime: string
  endTime: string
  storeId: string
}

const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const ShiftSwap: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [myShifts, setMyShifts] = useState<ShiftOption[]>([])
  const [selectedMyShift, setSelectedMyShift] = useState<ShiftOption | null>(null)

  const [targetShifts, setTargetShifts] = useState<ShiftOption[]>([])
  const [targetsLoading, setTargetsLoading] = useState(false)
  const [selectedTargetShift, setSelectedTargetShift] = useState<ShiftOption | null>(null)

  const [reason, setReason] = useState('')

  interface SchedQueryRow {
    id: string
    schedule_date: string
    start_time: string | null
    end_time: string | null
    store_id: string
    // 别名 embed 的运行时形状是对象；supabase-js 类型推断给数组，取 name 前统一收敛
    employees?: {name?: string} | {name?: string}[] | null
  }
  const mapRow = (row: SchedQueryRow): ShiftOption => ({
    id: row.id,
    date: String(row.schedule_date).slice(0, 10),
    dayOfWeek: WEEK_DAYS[new Date(row.schedule_date).getDay()],
    ownerName: (Array.isArray(row.employees) ? row.employees[0]?.name : row.employees?.name) || '',
    startTime: (row.start_time || '').slice(0, 5),
    endTime: (row.end_time || '').slice(0, 5),
    storeId: row.store_id
  })

  // 我的班次：本人 published、今天起、非排休
  const loadMyShifts = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      setSelectedMyShift(null)
      setSelectedTargetShift(null)
      setTargetShifts([])

      const {data: empRows, error: empErr} = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
      if (empErr) throw empErr

      const today = new Date().toISOString().split('T')[0]
      const {data: rows, error} = await supabase
        .from('schedules')
        .select('id, schedule_date, start_time, end_time, store_id, employees(name)')
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

      setMyShifts(((rows || []) as unknown as SchedQueryRow[]).map(mapRow))
    } catch (e: unknown) {
      console.error('加载班次失败:', e)
      Taro.showToast({title: '加载失败，请重试', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadMyShifts()
  })

  // 目标候选：专用最小读 RPC（P2-S1-A-R1：不再放宽表级 RLS；
  // 服务端验证本人 published 班次，仅返回 schedule_id/姓名/日期/起止时间）
  const loadTargets = useCallback(async (my: ShiftOption) => {
    try {
      setTargetsLoading(true)
      setSelectedTargetShift(null)
      const {data: rows, error} = await supabase.rpc('list_schedule_swap_candidates', {
        p_requester_schedule_id: my.id
      })
      if (error) throw error
      setTargetShifts(
        (
          (rows || []) as unknown as {
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
          ownerName: r.employee_name || '',
          startTime: (r.start_time || '').slice(0, 5),
          endTime: (r.end_time || '').slice(0, 5),
          storeId: ''
        }))
      )
    } catch (e: unknown) {
      console.error('加载候选班次失败:', e)
      Taro.showToast({title: '候选加载失败，请重试', icon: 'none'})
    } finally {
      setTargetsLoading(false)
    }
  }, [])

  const handleSelectMy = (shift: ShiftOption) => {
    setSelectedMyShift(shift)
    loadTargets(shift)
  }

  const handleSubmit = async () => {
    if (!selectedMyShift || !selectedTargetShift) {
      Taro.showToast({title: '请先选择双方班次', icon: 'none'})
      return
    }
    if (!reason.trim()) {
      Taro.showToast({title: '请填写换班原因', icon: 'none'})
      return
    }
    if (submitting) return

    try {
      setSubmitting(true)
      const {error} = await supabase.rpc('request_schedule_swap', {
        p_requester_schedule_id: selectedMyShift.id,
        p_target_schedule_id: selectedTargetShift.id,
        p_reason: reason.trim()
      })
      if (error) {
        // 服务端权威拒绝：透出真实原因（同店/在职/pending 重复等）
        Taro.showToast({
          title: error.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, ''),
          icon: 'none',
          duration: 3000
        })
        return
      }
      Taro.showToast({title: '申请已提交，等待审批', icon: 'success'})
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (e: unknown) {
      console.error('提交换班申请失败:', e)
      Taro.showToast({title: '提交失败，请重试', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {loading ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-sm">
              <Text className="text-center text-muted-foreground">加载中...</Text>
            </View>
          ) : (
            <>
              {/* 选择我的班次 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex flex-row items-center mb-4">
                  <View className="i-mdi-calendar-clock text-2xl text-blue-600 mr-2" />
                  <Text className="text-lg font-semibold text-foreground">选择要换的班次</Text>
                </View>

                {myShifts.length === 0 ? (
                  <View className="text-center py-8">
                    <View className="i-mdi-calendar-blank text-5xl text-muted-foreground mb-2" />
                    <Text className="text-muted-foreground">暂无可换班次</Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {myShifts.map((shift) => (
                      <View
                        key={shift.id}
                        className={`rounded-xl p-4 border-2 ${
                          selectedMyShift?.id === shift.id
                            ? 'border-primary bg-blue-100'
                            : 'border-border bg-gray-50/30'
                        }`}
                        onClick={() => handleSelectMy(shift)}>
                        <View className="flex flex-row items-center justify-between">
                          <View>
                            <Text className="text-sm font-bold text-foreground">
                              {shift.dayOfWeek} {shift.date}
                            </Text>
                            <Text className="text-xs text-muted-foreground mt-1">
                              {shift.startTime} - {shift.endTime}
                            </Text>
                          </View>
                          {selectedMyShift?.id === shift.id && (
                            <View className="i-mdi-check-circle text-2xl text-blue-600" />
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* 选择目标班次（真实候选：同门店同事的已发布班次） */}
              {selectedMyShift && (
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                  <View className="flex flex-row items-center mb-4">
                    <View className="i-mdi-account-switch text-2xl text-accent mr-2" />
                    <Text className="text-lg font-semibold text-foreground">选择目标班次（同门店同事）</Text>
                  </View>

                  {targetsLoading ? (
                    <Text className="text-center text-muted-foreground py-4">候选加载中...</Text>
                  ) : targetShifts.length === 0 ? (
                    <View className="text-center py-8">
                      <View className="i-mdi-account-search text-5xl text-muted-foreground mb-2" />
                      <Text className="text-muted-foreground">该门店暂无可换的同事班次</Text>
                    </View>
                  ) : (
                    <View className="space-y-2">
                      {targetShifts.map((shift) => (
                        <View
                          key={shift.id}
                          className={`rounded-xl p-4 border-2 ${
                            selectedTargetShift?.id === shift.id
                              ? 'border-accent bg-blue-100'
                              : 'border-border bg-gray-50/30'
                          }`}
                          onClick={() => setSelectedTargetShift(shift)}>
                          <View className="flex flex-row items-center justify-between">
                            <View>
                              <Text className="text-sm font-bold text-foreground">
                                {shift.ownerName || '同事'} · {shift.dayOfWeek} {shift.date}
                              </Text>
                              <Text className="text-xs text-muted-foreground mt-1">
                                {shift.startTime} - {shift.endTime}
                              </Text>
                            </View>
                            {selectedTargetShift?.id === shift.id && (
                              <View className="i-mdi-check-circle text-2xl text-accent" />
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View className="mt-4 p-3 bg-blue-100 rounded-xl">
                    <View className="flex flex-row items-start">
                      <View className="i-mdi-information text-xl text-muted-foreground mr-2 mt-0.5" />
                      <Text className="text-xs text-muted-foreground flex-1">
                        候选为同门店同事已发布的真实班次；是否可换由服务端在审批时做冲突校验
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 换班原因 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex flex-row items-center mb-4">
                  <View className="i-mdi-text-box text-2xl text-muted-foreground mr-2" />
                  <Text className="text-lg font-semibold text-foreground">换班原因</Text>
                </View>

                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-50/30 text-foreground px-3 py-2 rounded-xl border border-border w-full"
                    placeholder="请详细说明换班原因，以便审批..."
                    value={reason}
                    onInput={(e) => setReason(e.detail.value)}
                    maxlength={200}
                    style={{minHeight: '120px'}}
                  />
                </View>

                <View className="mt-2 flex flex-row justify-end">
                  <Text className="text-xs text-muted-foreground">{reason.length}/200</Text>
                </View>
              </View>

              {/* 提交按钮 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <Button
                  className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
                  size="default"
                  disabled={submitting || !selectedMyShift || !selectedTargetShift || !reason.trim()}
                  onClick={handleSubmit}>
                  {submitting ? '提交中...' : '提交换班申请'}
                </Button>

                <View className="mt-4 p-3 bg-blue-100 rounded-xl">
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-alert-circle text-xl text-muted-foreground mr-2 mt-0.5" />
                    <Text className="text-xs text-muted-foreground flex-1">
                      提交后等待门店/租户管理者审批；审批时服务端会校验交换后双方是否冲突，通过后自动交换
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default ShiftSwap
