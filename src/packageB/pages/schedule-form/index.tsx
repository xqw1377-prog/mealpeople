/**
 * 创建/修改排班 · P2-S1-B 重设计
 * 主线：谁 → 哪一天 → 什么班段 → 备注 → 发布
 * - 班段 = 类型 + 显式起止时间（或排休 + 餐段粒度）；绝不隐含默认时间
 * - inline 校验贴近字段；服务端 CONFLICT 映射到时间字段旁解释
 * - 编辑模式：员工/日期不可变（update_schedule 语义 = 内容修改）
 * - 提交走 command RPC（publish_schedule / update_schedule），防重复提交
 * DS：TabHero / Field / tokens
 */

import {Picker, Text, Textarea, View} from '@tarojs/components'
import {getCurrentInstance, navigateBack, showToast} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {Field, TabHero} from '@/components/ds'
import {getEmployeesByStoreId, getScheduleById, getStoresByTenantId} from '@/db/api'
import type {Employee, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const SEGMENTS = ['早班', '中班', '晚班', '全天班', '自定义']
const SEGMENT_VALUES = ['morning', 'afternoon', 'evening', 'full_day', 'custom']
// 常用班段快捷时段（仅作为 picker 初始值建议，用户显式选择才生效）
const SEGMENT_HOURS: Record<string, [string, string]> = {
  morning: ['07:00', '15:00'],
  afternoon: ['11:00', '19:00'],
  evening: ['15:00', '23:00'],
  full_day: ['09:00', '21:00']
}
const MEALS = ['全天休息', '早餐段', '午餐段', '晚餐段']
const MEAL_VALUES = ['all_day', 'breakfast', 'lunch', 'dinner']

const ScheduleForm: React.FC = () => {
  useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [stores, setStores] = useState<Store[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [storeIndex, setStoreIndex] = useState(0)
  const [employeeIndex, setEmployeeIndex] = useState(0)

  const [date, setDate] = useState('')
  const [isDayOff, setIsDayOff] = useState(false)
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [mealIndex, setMealIndex] = useState(0)
  const [notes, setNotes] = useState('')

  const [fieldErrors, setFieldErrors] = useState<{date?: string; time?: string; employee?: string}>({})
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [editId, setEditId] = useState('')
  const isEdit = !!editId

  const params = getCurrentInstance().router?.params

  const loadStores = useCallback(async () => {
    if (!currentTenant) return
    try {
      const storesData = await getStoresByTenantId(currentTenant.id)
      setStores(storesData)
      if (storesData.length > 0) {
        const emps = await getEmployeesByStoreId(storesData[0].id)
        setEmployees(emps.filter((e) => e.status === 'active'))
      }
    } catch (e) {
      console.error('加载门店失败:', e)
      setLoadError('门店/员工加载失败，请返回重试')
    }
  }, [currentTenant])

  // 编辑模式：载入既有 published 班次（仅内容字段可改）
  const loadSchedule = useCallback(async (id: string) => {
    try {
      const s = await getScheduleById(id)
      if (!s || s.status !== 'published') {
        setLoadError('班次不存在或不可编辑（仅已发布班次可修改）')
        return
      }
      setDate(String(s.schedule_date).slice(0, 10))
      setIsDayOff(!!s.is_day_off)
      setStartTime(s.start_time ? String(s.start_time).slice(0, 5) : '')
      setEndTime(s.end_time ? String(s.end_time).slice(0, 5) : '')
      setMealIndex(Math.max(0, MEAL_VALUES.indexOf(s.meal_period || 'all_day')))
      setSegmentIndex(s.shift_type === 'day_off' ? 0 : Math.max(0, SEGMENT_VALUES.indexOf(s.shift_type)))
      setNotes(s.notes || '')
    } catch (e) {
      console.error('加载班次失败:', e)
      setLoadError('班次加载失败，请返回重试')
    }
  }, [])

  useEffect(() => {
    if (params?.id) {
      setEditId(params.id)
      loadSchedule(params.id)
    } else {
      loadStores()
    }
  }, [params, loadStores, loadSchedule])

  const onStoreChange = async (i: number) => {
    setStoreIndex(i)
    setEmployeeIndex(0)
    const emps = await getEmployeesByStoreId(stores[i].id)
    setEmployees(emps.filter((e) => e.status === 'active'))
  }

  const applySegment = (i: number) => {
    setSegmentIndex(i)
    const v = SEGMENT_VALUES[i]
    if (v !== 'custom' && SEGMENT_HOURS[v]) {
      setStartTime(SEGMENT_HOURS[v][0])
      setEndTime(SEGMENT_HOURS[v][1])
    }
    setFieldErrors((f) => ({...f, time: undefined}))
  }

  // 服务端错误 → 字段级解释
  const mapServerError = (msg: string) => {
    if (msg.includes('重叠') || msg.includes('overlap')) {
      return {time: `所选时间段与该员工已有班次冲突：${msg}`, date: undefined, employee: undefined}
    }
    if (msg.includes('排休') || msg.includes('rest')) {
      return {time: undefined, date: `当天安排冲突：${msg}`, employee: undefined}
    }
    if (msg.includes('员工') || msg.includes('权限')) {
      return {time: undefined, date: undefined, employee: msg}
    }
    return {time: undefined, date: undefined, employee: undefined}
  }

  const validate = (): boolean => {
    const errs: typeof fieldErrors = {}
    if (!isDayOff && !date) errs.date = '请选择日期'
    if (isDayOff) {
      // 排休只需日期 + 餐段
    } else if (!startTime || !endTime) {
      errs.time = '请选择开始与结束时间'
    } else if (startTime === endTime) {
      errs.time = '起止时间不得相等'
    }
    if (!isEdit && employees.length === 0) errs.employee = '该门店暂无在职员工'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = async () => {
    if (submitting || !validate()) return
    setSubmitting(true)
    try {
      const {error} = isEdit
        ? await supabase.rpc('update_schedule', {
            p_schedule_id: editId,
            p_shift_type: isDayOff ? 'day_off' : SEGMENT_VALUES[segmentIndex],
            p_start_time: isDayOff ? null : startTime,
            p_end_time: isDayOff ? null : endTime,
            p_is_day_off: isDayOff,
            p_meal_period: isDayOff ? MEAL_VALUES[mealIndex] : null,
            p_notes: notes.trim() || null
          })
        : await supabase.rpc('publish_schedule', {
            p_employee_id: employees[employeeIndex].id,
            p_schedule_date: date,
            p_shift_type: isDayOff ? 'day_off' : SEGMENT_VALUES[segmentIndex],
            p_start_time: isDayOff ? null : startTime,
            p_end_time: isDayOff ? null : endTime,
            p_is_day_off: isDayOff,
            p_meal_period: isDayOff ? MEAL_VALUES[mealIndex] : null,
            p_notes: notes.trim() || null
          })

      if (error) {
        const msg = error.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, '')
        setFieldErrors(mapServerError(msg))
        showToast({title: msg.slice(0, 40), icon: 'none', duration: 3000})
        return
      }
      showToast({title: isEdit ? '已修改，员工已收到通知' : '已发布，员工已收到通知', icon: 'success'})
      setTimeout(() => navigateBack(), 1000)
    } catch (e) {
      console.error('提交失败:', e)
      showToast({title: '提交失败，请重试', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }

  const summaryLine = isDayOff
    ? `${date || '未选日期'} · ${MEALS[mealIndex]}`
    : `${date || '未选日期'}${startTime && endTime ? ` ${startTime}–${endTime}` : ' 未选时间'}`

  return (
    <View className="min-h-screen bg-gray-50">
      <TabHero title={isEdit ? '修改排班' : '创建排班'} subtitle="发布即为员工可见的正式班次" />
      <View className="px-4 pb-8 -mt-9">
        {loadError ? (
          <View className="bg-white rounded-2xl shadow-sm p-5">
            <Text className="text-sm text-danger-600">{loadError}</Text>
          </View>
        ) : (
          <>
            {/* 谁 */}
            {!isEdit && (
              <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                <Field label="谁在上班" required error={fieldErrors.employee}>
                  <Picker
                    mode="selector"
                    range={stores.map((s) => s.name)}
                    value={storeIndex}
                    onChange={(e) => onStoreChange(Number(e.detail.value))}>
                    <View className="w-full px-3 py-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                      <Text className={stores[storeIndex] ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                        {stores[storeIndex]?.name || '选择门店'}
                      </Text>
                      <View className="i-mdi-chevron-down text-gray-300" />
                    </View>
                  </Picker>
                  <View className="h-2" />
                  <Picker
                    mode="selector"
                    range={employees.map((e) => `${e.name}${e.position ? ` · ${e.position}` : ''}`)}
                    value={employeeIndex}
                    onChange={(e) => setEmployeeIndex(Number(e.detail.value))}>
                    <View className="w-full px-3 py-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                      <Text className={employees[employeeIndex] ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                        {employees[employeeIndex]?.name || '选择员工'}
                      </Text>
                      <View className="i-mdi-chevron-down text-gray-300" />
                    </View>
                  </Picker>
                </Field>
              </View>
            )}

            {/* 哪一天 */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <Field label="哪一天" required error={fieldErrors.date}>
                <Picker
                  mode="date"
                  value={date || undefined}
                  disabled={isEdit}
                  onChange={(e) => setDate(e.detail.value)}>
                  <View className="w-full px-3 py-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <Text className={date ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                      {date || '选择日期'}
                      {isEdit && '（不可修改）'}
                    </Text>
                    <View className="i-mdi-chevron-down text-gray-300" />
                  </View>
                </Picker>
              </Field>
            </View>

            {/* 什么班段 */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <View className="flex gap-2 mb-3">
                <View
                  className={`flex-1 text-center py-2 rounded-lg ${!isDayOff ? 'bg-primary-500' : 'bg-gray-100'}`}
                  onClick={() => setIsDayOff(false)}>
                  <View className={`i-mdi-clock-outline text-base ${!isDayOff ? 'text-white' : 'text-gray-400'}`} />
                  <Text className={`text-xs ${!isDayOff ? 'text-white' : 'text-gray-500'}`}>工作班</Text>
                </View>
                <View
                  className={`flex-1 text-center py-2 rounded-lg ${isDayOff ? 'bg-success-500' : 'bg-gray-100'}`}
                  onClick={() => setIsDayOff(true)}>
                  <View className={`i-mdi-sleep text-base ${isDayOff ? 'text-white' : 'text-gray-400'}`} />
                  <Text className={`text-xs ${isDayOff ? 'text-white' : 'text-gray-500'}`}>排休</Text>
                </View>
              </View>

              {isDayOff ? (
                <Field label="排休粒度">
                  <Picker
                    mode="selector"
                    range={MEALS}
                    value={mealIndex}
                    onChange={(e) => setMealIndex(Number(e.detail.value))}>
                    <View className="w-full px-3 py-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                      <Text className="text-sm text-gray-800">{MEALS[mealIndex]}</Text>
                      <View className="i-mdi-chevron-down text-gray-300" />
                    </View>
                  </Picker>
                  <Text className="text-2xs text-gray-400 mt-1.5">
                    餐段排休会与同餐段时间窗内的班次互相冲突（服务端裁决）
                  </Text>
                </Field>
              ) : (
                <>
                  <Field label="班段类型">
                    <Picker
                      mode="selector"
                      range={SEGMENTS}
                      value={segmentIndex}
                      onChange={(e) => applySegment(Number(e.detail.value))}>
                      <View className="w-full px-3 py-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                        <Text className="text-sm text-gray-800">{SEGMENTS[segmentIndex]}</Text>
                        <View className="i-mdi-chevron-down text-gray-300" />
                      </View>
                    </Picker>
                    <Text className="text-2xs text-gray-400 mt-1.5">
                      选择常用班段自动带出时间，可再调整；自定义则手动选择
                    </Text>
                  </Field>
                  <View className="h-3" />
                  <Field label="起止时间" required error={fieldErrors.time}>
                    <View className="flex items-center gap-2">
                      <Picker mode="time" value={startTime || undefined} onChange={(e) => setStartTime(e.detail.value)}>
                        <View className="px-3 py-2.5 rounded-xl border border-gray-200">
                          <Text className={startTime ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                            {startTime || '开始'}
                          </Text>
                        </View>
                      </Picker>
                      <Text className="text-gray-300">–</Text>
                      <Picker mode="time" value={endTime || undefined} onChange={(e) => setEndTime(e.detail.value)}>
                        <View className="px-3 py-2.5 rounded-xl border border-gray-200">
                          <Text className={endTime ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                            {endTime || '结束'}
                          </Text>
                        </View>
                      </Picker>
                    </View>
                    <Text className="text-2xs text-gray-400 mt-1.5">
                      结束早于开始视为跨天班；与其他班次端点相接（如 13:00–17:00 接 17:00）合法
                    </Text>
                  </Field>
                </>
              )}
            </View>

            {/* 备注 */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <Field label="备注（可选）">
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 w-full text-sm"
                    placeholder="员工将在通知中看到"
                    value={notes}
                    onInput={(e) => setNotes(e.detail.value)}
                    maxlength={100}
                    style={{minHeight: '72px'}}
                  />
                </View>
              </Field>
            </View>

            {/* 摘要与发布 */}
            <View className="bg-primary-50 rounded-2xl p-4 mb-3 flex items-center gap-2">
              <View className="i-mdi-bullhorn-outline text-lg text-primary-500" />
              <Text className="text-xs text-gray-600 flex-1">
                即将{isEdit ? '修改' : '发布'}：{employees[employeeIndex]?.name || '员工'} · {summaryLine}
              </Text>
            </View>
            <View className="flex gap-3">
              <View
                className="flex-1 bg-white rounded-xl py-3 text-center border border-gray-200 active:opacity-70"
                onClick={() => navigateBack()}>
                <Text className="text-sm text-gray-600">取消</Text>
              </View>
              <View
                className={`flex-1 rounded-xl py-3 text-center ${submitting ? 'bg-gray-200' : 'bg-primary-500 active:opacity-80'}`}
                onClick={submit}>
                <Text className={`text-sm ${submitting ? 'text-gray-400' : 'text-white'}`}>
                  {submitting ? '服务端校验中…' : isEdit ? '保存修改' : '发布排班'}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  )
}

export default ScheduleForm
