/**
 * 考勤打卡 · P2 重写（command RPC + DS）
 * 旅途主线：我今天上什么班 → 上班卡 → 下班卡 → 我的考勤记录
 * 数据：attendance_clock_in/out command + get_my_attendance 投影
 * DS：TabHero / ErrorBanner / tokens；状态完整
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {ErrorBanner, TabHero} from '@/components/ds'

interface MyAttendance {
  id: string
  schedule_id: string
  business_date: string
  planned_start_at: string
  planned_end_at: string
  clock_in_at: string | null
  clock_out_at: string | null
  late_minutes: number
  early_leave_minutes: number
  work_hours: number | null
  projection: string
}

const PROJ_LABEL: Record<string, {text: string; tone: string; icon: string}> = {
  not_started: {text: '未开始', tone: 'text-gray-500 bg-gray-100', icon: 'i-mdi-clock-outline'},
  in_progress: {text: '进行中', tone: 'text-info-600 bg-info-50', icon: 'i-mdi-play-circle-outline'},
  normal: {text: '正常', tone: 'text-success-600 bg-success-50', icon: 'i-mdi-check-circle'},
  late: {text: '迟到', tone: 'text-warning-600 bg-warning-50', icon: 'i-mdi-clock-alert-outline'},
  early_leave: {text: '早退', tone: 'text-warning-600 bg-warning-50', icon: 'i-mdi-clock-end'},
  late_early_leave: {text: '迟到+早退', tone: 'text-warning-600 bg-warning-50', icon: 'i-mdi-clock-alert-outline'},
  absent: {text: '缺勤', tone: 'text-danger-600 bg-danger-50', icon: 'i-mdi-close-circle'},
  missing_clock_out: {text: '缺下班卡', tone: 'text-danger-600 bg-danger-50', icon: 'i-mdi-help-circle-outline'}
}

const hm = (t: string | null) =>
  t ? new Date(t).toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit', hour12: false}) : ''
const md = (d: string) => d.slice(5).replace('-', '月') + '日'

export default function Attendance() {
  useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [records, setRecords] = useState<MyAttendance[]>([])
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const {data, error: rpcErr} = await supabase.rpc('get_my_attendance', {})
      if (rpcErr) throw rpcErr
      setRecords((data as unknown as MyAttendance[]) || [])
    } catch (e) {
      console.error('加载考勤失败:', e)
      setError('考勤加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    load()
  })

  const today = new Date().toISOString().slice(0, 10)
  const todayRecords = records.filter((r) => r.business_date === today)
  // 可打卡的班次：今天 published + 尚未打上班卡
  const clockableShifts = todayRecords.filter((r) => r.projection === 'not_started' || r.projection === 'in_progress')

  const clockIn = async (scheduleId: string) => {
    if (acting) return
    setActing(true)
    setActionError(null)
    try {
      const {error: e} = await supabase.rpc('attendance_clock_in', {p_schedule_id: scheduleId})
      if (e) {
        setActionError(e.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, ''))
        return
      }
      Taro.showToast({title: '上班打卡成功', icon: 'success'})
      load()
    } finally {
      setActing(false)
    }
  }

  const clockOut = async (scheduleId: string) => {
    if (acting) return
    setActing(true)
    setActionError(null)
    try {
      const {error: e} = await supabase.rpc('attendance_clock_out', {p_schedule_id: scheduleId})
      if (e) {
        setActionError(e.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, ''))
        return
      }
      Taro.showToast({title: '下班打卡成功', icon: 'success'})
      load()
    } finally {
      setActing(false)
    }
  }

  const nowTime = new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit', hour12: false})

  return (
    <View className="min-h-screen bg-gray-50">
      <TabHero title="考勤打卡" subtitle="按排班打卡 · 服务端记录" />
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
              <View className="h-12 w-32 rounded bg-gray-100 animate-pulse" />
            </View>
          ) : (
            <>
              {/* 今日班次与打卡 */}
              <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
                <View className="flex items-center justify-between mb-3">
                  <Text className="text-sm font-semibold text-gray-800">今日考勤</Text>
                  <Text className="text-xs text-gray-400">当前 {nowTime}</Text>
                </View>

                {todayRecords.length === 0 ? (
                  <View className="py-8 flex flex-col items-center">
                    <View className="i-mdi-calendar-blank text-5xl text-gray-200" />
                    <Text className="mt-2 text-sm text-gray-400">今日无排班，无需打卡</Text>
                    <Text className="mt-1 text-xs text-gray-300">排班发布后这里会出现打卡入口</Text>
                  </View>
                ) : (
                  <View className="space-y-3">
                    {todayRecords.map((r) => {
                      const proj = PROJ_LABEL[r.projection] || PROJ_LABEL.not_started
                      const canClockIn = r.projection === 'not_started'
                      const canClockOut = r.projection === 'in_progress'
                      return (
                        <View key={r.id} className="rounded-xl border border-gray-200 p-3">
                          <View className="flex items-center justify-between mb-2">
                            <View>
                              <Text className="text-sm font-medium text-gray-800">
                                {hm(r.planned_start_at)} – {hm(r.planned_end_at)}
                              </Text>
                              <Text className="text-xs text-gray-400 mt-0.5">
                                {r.clock_in_at ? `上班 ${hm(r.clock_in_at)}` : '未打上班卡'}
                                {r.clock_out_at ? ` · 下班 ${hm(r.clock_out_at)}` : ''}
                                {r.work_hours ? ` · ${r.work_hours}h` : ''}
                              </Text>
                            </View>
                            <View className={`px-2.5 py-1 rounded-full flex items-center gap-1 ${proj.tone}`}>
                              <View className={`${proj.icon} text-sm`} />
                              <Text className="text-xs font-medium">{proj.text}</Text>
                            </View>
                          </View>

                          {(r.late_minutes > 0 || r.early_leave_minutes > 0) && (
                            <View className="flex gap-3 text-xs text-warning-600 mb-2">
                              {r.late_minutes > 0 && <Text>迟到 {r.late_minutes} 分钟</Text>}
                              {r.early_leave_minutes > 0 && <Text>早退 {r.early_leave_minutes} 分钟</Text>}
                            </View>
                          )}

                          {(canClockIn || canClockOut) && (
                            <View
                              className={`mt-2 rounded-xl py-3 text-center ${acting ? 'bg-gray-200' : canClockIn ? 'bg-primary-500 active:opacity-80' : 'bg-success-500 active:opacity-80'}`}
                              onClick={() => (canClockIn ? clockIn(r.schedule_id) : clockOut(r.schedule_id))}>
                              <Text className={`text-sm font-medium ${acting ? 'text-gray-400' : 'text-white'}`}>
                                {acting ? '打卡中…' : canClockIn ? '上班打卡' : '下班打卡'}
                              </Text>
                            </View>
                          )}
                        </View>
                      )
                    })}
                  </View>
                )}

                {actionError && (
                  <View className="mt-3 bg-danger-50 rounded-lg p-2.5 flex items-start gap-1.5">
                    <View className="i-mdi-alert-circle-outline text-sm text-danger-500 mt-0.5" />
                    <Text className="text-xs text-danger-600 flex-1">{actionError}</Text>
                  </View>
                )}
              </View>

              {/* 考勤记录 */}
              <View className="bg-white rounded-2xl shadow-sm p-4">
                <Text className="text-sm font-semibold text-gray-800 mb-3">考勤记录</Text>
                {records.length === 0 ? (
                  <View className="py-6 flex flex-col items-center">
                    <View className="i-mdi-file-document-outline text-4xl text-gray-200" />
                    <Text className="mt-2 text-xs text-gray-400">暂无考勤记录</Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {records.slice(0, 10).map((r) => {
                      const proj = PROJ_LABEL[r.projection] || PROJ_LABEL.not_started
                      return (
                        <View
                          key={r.id}
                          className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                          <View>
                            <Text className="text-sm text-gray-800">{md(r.business_date)}</Text>
                            <Text className="text-xs text-gray-400 mt-0.5">
                              {hm(r.planned_start_at)}–{hm(r.planned_end_at)}
                              {r.clock_in_at ? ` · ${hm(r.clock_in_at)}` : ''}
                              {r.clock_out_at ? `–${hm(r.clock_out_at)}` : ''}
                            </Text>
                          </View>
                          <View className={`px-2 py-0.5 rounded-full ${proj.tone}`}>
                            <Text className="text-2xs font-medium">{proj.text}</Text>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
