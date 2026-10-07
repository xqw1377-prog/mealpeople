/**
 * 我的班次 · P2-S1-B 重设计
 * 旅途主线：我今天几点上班 → 下一班 → 本周全貌 → 换班入口
 * 数据：schedules published SSOT（RLS：仅本人；legacy 0 exposure）
 * DS：TabHero / ErrorBanner / tokens；状态完整（骨架/空/错+重试）
 */

import {ScrollView, Text, View} from '@tarojs/components'
import {navigateTo, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {ErrorBanner, TabHero} from '@/components/ds'

interface ScheduleRow {
  id: string
  schedule_date: string
  shift_type: string
  start_time: string | null
  end_time: string | null
  is_day_off: boolean | null
  meal_period: string | null
}

interface DayEntry {
  date: string
  label: string
  isToday: boolean
  rows: ScheduleRow[]
}

const WEEK_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const MEAL_LABEL: Record<string, string> = {all_day: '全天', breakfast: '早餐', lunch: '午餐', dinner: '晚餐'}
const SEGMENT: Record<string, string> = {
  morning: '早班',
  afternoon: '中班',
  evening: '晚班',
  full_day: '全天班',
  regular: '班次',
  day_off: '排休'
}

const hm = (t: string | null) => (t ? t.slice(0, 5) : '')

// 工时（跨天 end<=start 按 +24h）
const hoursOf = (r: ScheduleRow): number => {
  if (!r.start_time || !r.end_time) return 0
  const [sh, sm] = r.start_time.slice(0, 5).split(':').map(Number)
  const [eh, em] = r.end_time.slice(0, 5).split(':').map(Number)
  let diff = eh * 60 + em - (sh * 60 + sm)
  if (diff <= 0) diff += 24 * 60
  return Math.round((diff / 60) * 10) / 10
}

export default function MySchedule() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState<DayEntry[]>([])

  const load = useCallback(async () => {
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
      if (!empRows || empRows.length === 0) {
        setDays([])
        setLoading(false)
        return
      }

      const now = new Date()
      const dow = now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const iso = (d: Date) => d.toISOString().slice(0, 10)

      const {data: rows, error: rowsErr} = await supabase
        .from('schedules')
        .select('id, schedule_date, shift_type, start_time, end_time, is_day_off, meal_period')
        .in(
          'employee_id',
          empRows.map((e: {id: string}) => e.id)
        )
        .eq('status', 'published')
        .gte('schedule_date', iso(monday))
        .lte('schedule_date', iso(sunday))
        .order('schedule_date')
        .order('start_time', {ascending: true, nullsFirst: false})
      if (rowsErr) throw rowsErr
      const list = (rows || []) as unknown as ScheduleRow[]

      const entries: DayEntry[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        const dateStr = iso(d)
        entries.push({
          date: dateStr,
          label: i === 0 ? '周一' : WEEK_CN[d.getDay()],
          isToday: dateStr === iso(now),
          rows: list.filter((r) => r.schedule_date === dateStr)
        })
      }
      setDays(entries)
    } catch (e) {
      console.error('加载班次失败:', e)
      setError('班次加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    load()
  })

  const today = new Date().toISOString().slice(0, 10)
  const todayEntry = days.find((d) => d.date === today)

  // 下一班：今天未开始的班，或未来的第一个班
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  let nextShift: {row: ScheduleRow; date: string} | null = null
  for (const d of days) {
    for (const r of d.rows) {
      if (r.is_day_off || !r.start_time) continue
      const [h, m] = r.start_time.slice(0, 5).split(':').map(Number)
      const past = d.date === today && h * 60 + m <= nowMin
      if (
        !past &&
        (!nextShift ||
          d.date < nextShift.date ||
          (d.date === nextShift.date && (r.start_time || '') < nextShift.row.start_time!))
      ) {
        nextShift = {row: r, date: d.date}
      }
    }
  }

  const goSwap = () => navigateTo({url: '/packageB/pages/shift-swap/index'})
  const goRecords = () => navigateTo({url: '/packageB/pages/swap-records/index'})

  return (
    <View className="min-h-screen bg-gray-50">
      <TabHero title="我的班次" subtitle="本周排班 · 变更即时可见" />
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="px-4 pb-8 -mt-9">
          {error && (
            <View className="mb-3">
              <ErrorBanner message={error} onRetry={load} />
            </View>
          )}

          {loading ? (
            <View className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
              <View className="h-6 w-24 rounded bg-gray-100 animate-pulse" />
              <View className="h-12 w-48 rounded bg-gray-100 animate-pulse" />
              <View className="h-4 w-32 rounded bg-gray-100 animate-pulse" />
            </View>
          ) : (
            <>
              {/* 今日班次 Hero：直接回答"我今天几点上班" */}
              {todayEntry && todayEntry.rows.length > 0 ? (
                (() => {
                  const r = todayEntry.rows.find((x) => !x.is_day_off) || todayEntry.rows[0]
                  return r.is_day_off ? (
                    <View className="bg-success-500 rounded-2xl shadow-md p-6 text-white">
                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-white/80">今日排休</Text>
                        <Text className="text-xs text-white/80">
                          {todayEntry.label} · {todayEntry.date.slice(5)}
                        </Text>
                      </View>
                      <View className="mt-3 flex items-center gap-3">
                        <View className="i-mdi-sleep text-4xl" />
                        <View>
                          <Text className="text-2xl font-bold">{MEAL_LABEL[r.meal_period || 'all_day']}休息</Text>
                          <Text className="text-xs text-white/80 mt-1">好好休息，明天见</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View className="bg-primary-500 rounded-2xl shadow-md p-6 text-white">
                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-white/80">今日班次 · {SEGMENT[r.shift_type] || '班次'}</Text>
                        <Text className="text-xs text-white/80">
                          {todayEntry.label} · {todayEntry.date.slice(5)}
                        </Text>
                      </View>
                      <View className="mt-3 text-4xl font-bold tracking-wide">
                        {hm(r.start_time)} – {hm(r.end_time)}
                      </View>
                      <View className="mt-3 flex items-center gap-2 text-xs text-white/80">
                        <View className="i-mdi-clock-outline" />
                        <Text>
                          {hoursOf(r)} 小时{hm(r.end_time) <= hm(r.start_time) ? ' · 跨天班' : ''}
                        </Text>
                      </View>
                    </View>
                  )
                })()
              ) : (
                <View className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-3">
                  <View className="i-mdi-calendar-blank text-3xl text-gray-300" />
                  <View>
                    <Text className="text-sm font-medium text-gray-700">今日未排班</Text>
                    <Text className="text-xs text-gray-400 mt-0.5">如长期无班次，请联系门店管理员</Text>
                  </View>
                </View>
              )}

              {/* 今日多段班（拆班）补充 */}
              {todayEntry && todayEntry.rows.length > 1 && (
                <View className="mt-3 bg-white rounded-2xl shadow-sm p-4 space-y-2">
                  <Text className="text-xs text-gray-400">今日共 {todayEntry.rows.length} 段安排</Text>
                  {todayEntry.rows.slice(1).map((r) => (
                    <View key={r.id} className="flex items-center justify-between text-sm">
                      <Text className="text-gray-700">
                        {r.is_day_off
                          ? `${MEAL_LABEL[r.meal_period || 'all_day']}排休`
                          : `${hm(r.start_time)} – ${hm(r.end_time)}`}
                      </Text>
                      {!r.is_day_off && <Text className="text-xs text-gray-400">{hoursOf(r)}h</Text>}
                    </View>
                  ))}
                </View>
              )}

              {/* 下一班 */}
              {nextShift && (
                <View className="mt-3 bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between">
                  <View className="flex items-center gap-3">
                    <View className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                      <View className="i-mdi-clock-fast text-xl text-primary-500" />
                    </View>
                    <View>
                      <Text className="text-xs text-gray-400">下一班</Text>
                      <Text className="text-sm font-semibold text-gray-800">
                        {nextShift.date.slice(5).replace('-', '月 ')}日 {hm(nextShift.row.start_time)} –{' '}
                        {hm(nextShift.row.end_time)}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-gray-400">{SEGMENT[nextShift.row.shift_type] || '班次'}</Text>
                </View>
              )}

              {/* 本周排班 */}
              <View className="mt-4 bg-white rounded-2xl shadow-sm p-4">
                <View className="flex items-center justify-between mb-3">
                  <Text className="text-sm font-semibold text-gray-800">本周排班</Text>
                  <Text className="text-xs text-gray-400">
                    共 {days.reduce((n, d) => n + d.rows.length, 0)} 段 ·{' '}
                    {days
                      .reduce((n, d) => n + d.rows.filter((r) => !r.is_day_off).reduce((s, r) => s + hoursOf(r), 0), 0)
                      .toFixed(1)}
                    h
                  </Text>
                </View>
                {days.every((d) => d.rows.length === 0) ? (
                  <View className="py-8 flex flex-col items-center">
                    <View className="i-mdi-calendar-remove-outline text-5xl text-gray-200" />
                    <Text className="mt-2 text-sm text-gray-400">本周暂无排班</Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {days.map((d) => (
                      <View
                        key={d.date}
                        className={`flex items-center gap-3 rounded-xl p-3 ${d.isToday ? 'bg-primary-50' : 'bg-gray-50'}`}>
                        <View className="w-10 text-center">
                          <Text className="text-xs font-semibold text-gray-700">{d.label}</Text>
                          <Text className="text-2xs text-gray-400">{d.date.slice(5)}</Text>
                        </View>
                        <View className="flex-1">
                          {d.rows.length === 0 ? (
                            <Text className="text-xs text-gray-300">未排班</Text>
                          ) : (
                            d.rows.map((r) => (
                              <View key={r.id} className="flex items-center justify-between">
                                <Text className="text-sm text-gray-800">
                                  {r.is_day_off
                                    ? `${MEAL_LABEL[r.meal_period || 'all_day']}排休`
                                    : `${hm(r.start_time)} – ${hm(r.end_time)}`}
                                </Text>
                                {!r.is_day_off && <Text className="text-2xs text-gray-400">{hoursOf(r)}h</Text>}
                              </View>
                            ))
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* 换班入口 */}
              <View className="mt-4 grid grid-cols-2 gap-3">
                <View
                  className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center active:opacity-70"
                  onClick={goSwap}>
                  <View className="i-mdi-swap-horizontal text-2xl text-primary-500" />
                  <Text className="mt-1.5 text-sm font-medium text-gray-800">发起换班</Text>
                </View>
                <View
                  className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center active:opacity-70"
                  onClick={goRecords}>
                  <View className="i-mdi-file-document-outline text-2xl text-primary-500" />
                  <Text className="mt-1.5 text-sm font-medium text-gray-800">换班记录</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
