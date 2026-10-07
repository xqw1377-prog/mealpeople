/**
 * 排班规划 · P2-S1-B 重构（替代 2057 行旧页）
 * 冻结流：经营需求 → 需要多少人 → 给哪些人 → 为每个人指定实际班段 → 确认发布
 * - 班段由管理者显式选择（快捷时段仅作 picker 建议，可见可改）；绝无隐含默认时间
 * - 发布逐人走 publish_schedule command：服务端权限/关系/冲突权威；
 *   结果按人反馈（成功 / 冲突原因），不做部分静默
 * - 旧页的排休弹窗/兼职/效能区间/规划落库（schedule_results 等）不再由本页承担，
 *   排休走「创建排班-排休」；规划产物链路另行裁定（见 P2S1 证据登记）
 * DS：TabHero / Field / ErrorBanner / tokens
 */

import {Input, Picker, Text, View} from '@tarojs/components'
import {showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {ErrorBanner, Field, TabHero} from '@/components/ds'
import {getEmployeesByStoreId, getStoresByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const SEGMENTS = ['早班', '中班', '晚班', '全天班', '自定义']
const SEGMENT_VALUES = ['morning', 'afternoon', 'evening', 'full_day', 'custom']
const SEGMENT_HOURS: Record<string, [string, string]> = {
  morning: ['07:00', '15:00'],
  afternoon: ['11:00', '19:00'],
  evening: ['15:00', '23:00'],
  full_day: ['09:00', '21:00']
}

interface Assignment {
  segment: number
  start: string
  end: string
}

interface PublishResult {
  name: string
  ok: boolean
  detail: string
}

const SchedulePlanning: React.FC = () => {
  useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const globalStore = useTenantStore((state) => state.currentStore)
  const setCurrentStore = useTenantStore((state) => state.setCurrentStore)
  const [currentStore, setCurrentStoreState] = useState(globalStore)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [date, setDate] = useState('')
  const [revenue, setRevenue] = useState('')
  const [headcount, setHeadcount] = useState('')

  const [picked, setPicked] = useState<string[]>([]) // employee ids
  const [assign, setAssign] = useState<Record<string, Assignment>>({})

  const [bulkSegment, setBulkSegment] = useState(-1)
  const [publishing, setPublishing] = useState(false)
  const [results, setResults] = useState<PublishResult[]>([])

  const load = useCallback(async () => {
    // 会话未选过门店时解析默认门店（与租户上下文一致）并同步全局
    // 注意用局部变量承接，避免 setState 闭包陈旧值导致提前 return
    let store = currentStore
    if (!store && currentTenant) {
      try {
        const stores = await getStoresByTenantId(currentTenant.id)
        if (stores.length > 0) {
          store = stores[0]
          setCurrentStore(store)
          setCurrentStoreState(store)
        }
      } catch (e) {
        console.error('解析默认门店失败:', e)
      }
    }
    if (!store) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setLoadError(null)
      const list = await getEmployeesByStoreId(store.id)
      setEmployees(list.filter((e) => e.status === 'active'))
    } catch (e) {
      console.error('加载员工失败:', e)
      setLoadError('员工列表加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [currentStore, currentTenant, setCurrentStore])

  useDidShow(() => {
    load()
  })

  const toggle = (id: string) => {
    setResults([])
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const setSeg = (id: string, i: number) => {
    setResults([])
    const v = SEGMENT_VALUES[i]
    const hours = v !== 'custom' ? SEGMENT_HOURS[v] : null
    setAssign((a) => ({
      ...a,
      [id]: {segment: i, start: hours ? hours[0] : a[id]?.start || '', end: hours ? hours[1] : a[id]?.end || ''}
    }))
  }

  const setTime = (id: string, k: 'start' | 'end', v: string) => {
    setResults([])
    setAssign((a) => ({...a, [id]: {...(a[id] || {segment: 4, start: '', end: ''}), [k]: v}}))
  }

  const applyBulk = (i: number) => {
    setBulkSegment(i)
    if (i < 0) return
    setResults([])
    for (const id of picked) setSeg(id, i)
  }

  const validate = (): string | null => {
    if (!date) return '请先选择日期'
    if (picked.length === 0) return '请选择要排班的员工'
    for (const id of picked) {
      const a = assign[id]
      const name = employees.find((e) => e.id === id)?.name || '员工'
      if (!a) return `请为 ${name} 指定班段时间`
      if (!a.start || !a.end) return `${name} 的班段时间未选择完整`
      if (a.start === a.end) return `${name} 的起止时间不得相等`
    }
    return null
  }

  const publish = async () => {
    if (publishing) return
    const err = validate()
    if (err) {
      showToast({title: err, icon: 'none'})
      return
    }
    setPublishing(true)
    setResults([])
    const out: PublishResult[] = []
    for (const id of picked) {
      const emp = employees.find((e) => e.id === id)
      const a = assign[id]
      try {
        const {error} = await supabase.rpc('publish_schedule', {
          p_employee_id: id,
          p_schedule_date: date,
          p_shift_type: SEGMENT_VALUES[a.segment],
          p_start_time: a.start,
          p_end_time: a.end,
          p_notes: revenue.trim() ? `排班发布 · 预估营收 ¥${revenue.trim()}` : '排班发布'
        })
        if (error) {
          const msg = error.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, '')
          out.push({name: emp?.name || '员工', ok: false, detail: msg})
        } else {
          out.push({name: emp?.name || '员工', ok: true, detail: `${a.start}–${a.end} 已发布，员工已收到通知`})
        }
      } catch (e) {
        out.push({name: emp?.name || '员工', ok: false, detail: e instanceof Error ? e.message : '发布异常'})
      }
    }
    setResults(out)
    setPublishing(false)
    const okN = out.filter((x) => x.ok).length
    showToast({title: `发布成功 ${okN}/${out.length}`, icon: okN > 0 ? 'success' : 'none', duration: 2500})
  }

  const stepTitle = (n: number, t: string) => (
    <View className="flex items-center gap-2 mb-3">
      <View className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
        <Text className="text-2xs text-white font-bold">{n}</Text>
      </View>
      <Text className="text-sm font-semibold text-gray-800">{t}</Text>
    </View>
  )

  return (
    <View className="min-h-screen bg-gray-50">
      <TabHero title="排班规划" subtitle={currentStore ? `${currentStore.name} · 按班段发布` : '请先选择门店'} />
      <View className="px-4 pb-8 -mt-9">
        {!currentStore ? (
          <View className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center">
            <View className="i-mdi-store-off-outline text-5xl text-gray-200" />
            <Text className="mt-2 text-sm text-gray-400">请先在首页选择门店</Text>
          </View>
        ) : (
          <>
            {loadError && (
              <View className="mb-3">
                <ErrorBanner message={loadError} onRetry={load} />
              </View>
            )}

            {/* ① 经营需求 */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              {stepTitle(1, '经营需求')}
              <Field label="日期" required>
                <Picker mode="date" value={date || undefined} onChange={(e) => setDate(e.detail.value)}>
                  <View className="w-full px-3 py-2.5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <Text className={date ? 'text-sm text-gray-800' : 'text-sm text-gray-400'}>
                      {date || '选择日期'}
                    </Text>
                    <View className="i-mdi-chevron-down text-gray-300" />
                  </View>
                </Picker>
              </Field>
              <View className="h-3" />
              <Field label="预估营收（选填，随班次备注留痕）">
                <Input
                  type="digit"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  placeholder="如 12000"
                  value={revenue}
                  onInput={(e) => setRevenue(e.detail.value)}
                />
              </Field>
            </View>

            {/* ② 需要多少人 */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              {stepTitle(2, '需要多少人')}
              <Field label="当日目标在岗人数（选填，用于对照选择）">
                <Input
                  type="number"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
                  placeholder="如 6"
                  value={headcount}
                  onInput={(e) => setHeadcount(e.detail.value)}
                />
              </Field>
              {headcount && (
                <Text
                  className={`text-2xs mt-1.5 ${picked.length === Number(headcount) ? 'text-success-600' : 'text-warning-600'}`}>
                  已选 {picked.length} 人 / 目标 {headcount} 人
                </Text>
              )}
            </View>

            {/* ③ 给哪些人 */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              {stepTitle(3, '给哪些人')}
              {loading ? (
                <View className="h-24 rounded-xl bg-gray-100 animate-pulse" />
              ) : employees.length === 0 ? (
                <View className="py-6 flex flex-col items-center">
                  <View className="i-mdi-account-off-outline text-4xl text-gray-200" />
                  <Text className="mt-2 text-xs text-gray-400">本店暂无在职员工</Text>
                </View>
              ) : (
                <View className="flex flex-wrap gap-2">
                  {employees.map((e) => {
                    const on = picked.includes(e.id)
                    return (
                      <View
                        key={e.id}
                        className={`px-3 py-2 rounded-full flex items-center gap-1 ${on ? 'bg-primary-500' : 'bg-gray-100'}`}
                        onClick={() => toggle(e.id)}>
                        {on && <View className="i-mdi-check text-xs text-white" />}
                        <Text className={`text-xs ${on ? 'text-white' : 'text-gray-600'}`}>{e.name}</Text>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>

            {/* ④ 班段 */}
            {picked.length > 0 && (
              <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                {stepTitle(4, '每人班段')}
                <View className="flex items-center gap-2 mb-3">
                  <Text className="text-2xs text-gray-400">统一应用：</Text>
                  <Picker
                    mode="selector"
                    range={SEGMENTS}
                    value={bulkSegment < 0 ? 0 : bulkSegment}
                    onChange={(e) => applyBulk(Number(e.detail.value))}>
                    <View className="px-3 py-1.5 rounded-lg bg-gray-100 flex items-center gap-1">
                      <View className="i-mdi-flash text-xs text-primary-500" />
                      <Text className="text-xs text-gray-600">
                        {bulkSegment < 0 ? '选择班段' : SEGMENTS[bulkSegment]}
                      </Text>
                    </View>
                  </Picker>
                  <Text className="text-2xs text-gray-300 flex-1">（可对单人再单独调整）</Text>
                </View>
                <View className="space-y-3">
                  {picked.map((id) => {
                    const emp = employees.find((e) => e.id === id)
                    const a = assign[id]
                    return (
                      <View key={id} className="rounded-xl border border-gray-200 p-3">
                        <View className="flex items-center justify-between mb-2">
                          <Text className="text-sm font-medium text-gray-800">{emp?.name}</Text>
                          <Picker
                            mode="selector"
                            range={SEGMENTS}
                            value={a?.segment ?? 0}
                            onChange={(e) => setSeg(id, Number(e.detail.value))}>
                            <View className="px-2.5 py-1 rounded-lg bg-primary-50 flex items-center gap-1">
                              <Text className="text-xs text-primary-600">{a ? SEGMENTS[a.segment] : '选择班段'}</Text>
                              <View className="i-mdi-chevron-down text-xs text-primary-400" />
                            </View>
                          </Picker>
                        </View>
                        <View className="flex items-center gap-2">
                          <Picker
                            mode="time"
                            value={a?.start || undefined}
                            onChange={(e) => setTime(id, 'start', e.detail.value)}>
                            <View className="px-3 py-1.5 rounded-lg border border-gray-200">
                              <Text className={a?.start ? 'text-xs text-gray-700' : 'text-xs text-gray-400'}>
                                {a?.start || '开始'}
                              </Text>
                            </View>
                          </Picker>
                          <Text className="text-gray-300 text-xs">–</Text>
                          <Picker
                            mode="time"
                            value={a?.end || undefined}
                            onChange={(e) => setTime(id, 'end', e.detail.value)}>
                            <View className="px-3 py-1.5 rounded-lg border border-gray-200">
                              <Text className={a?.end ? 'text-xs text-gray-700' : 'text-xs text-gray-400'}>
                                {a?.end || '结束'}
                              </Text>
                            </View>
                          </Picker>
                          {a?.start && a?.end ? (
                            <View className="i-mdi-check-circle text-success-500" />
                          ) : (
                            <Text className="text-2xs text-warning-600">未指定</Text>
                          )}
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            )}

            {/* ⑤ 发布与结果 */}
            {picked.length > 0 && (
              <View className="bg-white rounded-2xl shadow-sm p-4">
                {stepTitle(5, '确认发布')}
                <Text className="text-2xs text-gray-400 mb-3">
                  发布 = 写入正式班次事实，员工即时可见并收到通知；冲突由服务端逐一裁决
                </Text>
                <View
                  className={`rounded-xl py-3 text-center ${publishing || !date ? 'bg-gray-200' : 'bg-primary-500 active:opacity-80'}`}
                  onClick={publish}>
                  <Text className={`text-sm ${publishing || !date ? 'text-gray-400' : 'text-white'}`}>
                    {publishing ? '逐人发布与校验中…' : `发布 ${picked.length} 人的班次`}
                  </Text>
                </View>

                {results.length > 0 && (
                  <View className="mt-3 space-y-2">
                    {results.map((r, i) => (
                      <View
                        key={i}
                        className={`rounded-xl p-3 flex items-start gap-2 ${r.ok ? 'bg-success-50' : 'bg-danger-50'}`}>
                        <View
                          className={`i-mdi-${r.ok ? 'check-circle' : 'alert-circle-outline'} text-base mt-0.5 ${r.ok ? 'text-success-500' : 'text-danger-500'}`}
                        />
                        <View className="flex-1">
                          <Text className="text-xs font-medium text-gray-800">{r.name}</Text>
                          <Text className={`text-2xs mt-0.5 ${r.ok ? 'text-success-700' : 'text-danger-600'}`}>
                            {r.detail}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  )
}

export default SchedulePlanning
