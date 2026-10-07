/**
 * 换班记录与审批 · P2-S1-B 重设计
 * 员工：自己的申请/撤回；管理者：审批（通过并交换 / 拒绝）
 * 审批卡直呈「张三 ⇅ 李四」班次对照；服务端冲突结论内联解释，不 toast 完事
 * 数据：shift_swap_requests（RLS 定可见性）+ get_swap_shift_brief 最小补齐
 * DS：TabHero / StatsStrip / ErrorBanner / tokens
 */

import {ScrollView, Text, View} from '@tarojs/components'
import {showModal, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {ErrorBanner, StatsStrip, TabHero} from '@/components/ds'

interface ShiftBrief {
  schedule_id: string
  employee_name: string
  schedule_date: string
  start_time: string | null
  end_time: string | null
}

interface ShiftDisplay {
  schedule_date: string
  start_time: string | null
  end_time: string | null
}

interface SwapRow {
  id: string
  status: string
  reason: string | null
  review_notes: string | null
  created_at: string
  requester_id: string
  target_id: string
  requester: {name: string} | null
  target: {name: string} | null
  requester_shift: ShiftDisplay | null
  target_shift: ShiftDisplay | null
}

interface DisplayRow extends SwapRow {
  statusName: string
  statusTone: string
  statusIcon: string
  actionError: string | null
}

const fmtDate = (s?: string) => (s ? s.slice(5).replace('-', '月 ') + '日' : '')
const fmtShift = (s?: ShiftDisplay | null) =>
  s && s.start_time
    ? `${fmtDate(s.schedule_date)} ${(s.start_time || '').slice(0, 5)}–${(s.end_time || '').slice(0, 5)}`
    : '班次已不可用'

const STATUS: Record<string, {name: string; tone: string; icon: string}> = {
  pending: {name: '待审批', tone: 'text-warning-600 bg-warning-50', icon: 'i-mdi-clock-outline'},
  approved: {name: '已通过', tone: 'text-success-600 bg-success-50', icon: 'i-mdi-check-circle'},
  rejected: {name: '已拒绝', tone: 'text-danger-600 bg-danger-50', icon: 'i-mdi-close-circle'},
  cancelled: {name: '已撤回', tone: 'text-gray-500 bg-gray-100', icon: 'i-mdi-cancel'}
}

const SwapRecords: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<DisplayRow[]>([])
  const [myIds, setMyIds] = useState<string[]>([])
  const [acting, setActing] = useState('')
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const {data: empRows} = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
      const ids = (empRows || []).map((e: {id: string}) => e.id)
      setMyIds(ids)

      const {data, error: qErr} = await supabase
        .from('shift_swap_requests')
        .select(
          'id, status, reason, review_notes, created_at, requester_id, target_id, requester_shift_id, target_shift_id, ' +
            'requester:employees!shift_swap_requests_requester_id_fkey(name), ' +
            'target:employees!shift_swap_requests_target_id_fkey(name), ' +
            'requester_shift:schedules!shift_swap_requests_requester_shift_fkey(schedule_date, start_time, end_time), ' +
            'target_shift:schedules!shift_swap_requests_target_shift_fkey(schedule_date, start_time, end_time)'
        )
        .order('created_at', {ascending: false})
        .limit(100)
      if (qErr) throw qErr

      // 员工侧同事班次 embed 被 RLS 过滤 → brief RPC 最小补齐（swap-context 绑定）
      const briefCache = new Map<string, ShiftDisplay | null>()
      const briefOf = async (sid?: string) => {
        if (!sid) return null
        if (briefCache.has(sid)) return briefCache.get(sid) ?? null
        const {data: b} = await supabase.rpc('get_swap_shift_brief', {p_schedule_id: sid})
        const row = ((b as unknown as ShiftBrief[] | null) || [])[0] || null
        const v: ShiftDisplay | null = row
          ? {schedule_date: String(row.schedule_date).slice(0, 10), start_time: row.start_time, end_time: row.end_time}
          : null
        briefCache.set(sid, v)
        return v
      }
      const list = (data || []) as unknown as (SwapRow & {requester_shift_id?: string; target_shift_id?: string})[]
      for (const r of list) {
        if (!r.requester_shift) r.requester_shift = await briefOf(r.requester_shift_id)
        if (!r.target_shift) r.target_shift = await briefOf(r.target_shift_id)
      }

      setRows(
        list.map((r) => {
          const s = STATUS[r.status] || STATUS.pending
          return {...r, statusName: s.name, statusTone: s.tone, statusIcon: s.icon, actionError: null}
        })
      )
    } catch (e) {
      console.error('加载换班记录失败:', e)
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    load()
  })

  const setRowError = (id: string, msg: string | null) =>
    setRows((prev) => prev.map((r) => (r.id === id ? {...r, actionError: msg} : r)))

  const handleCancel = async (id: string) => {
    if (acting) return
    const res = await showModal({
      title: '撤回申请',
      content: '确定撤回这条换班申请吗？',
      confirmText: '撤回',
      cancelText: '保留'
    })
    if (!res.confirm) return
    try {
      setActing(id)
      const {error: e} = await supabase.rpc('cancel_schedule_swap', {p_request_id: id})
      if (e) {
        setRowError(id, e.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, ''))
        return
      }
      showToast({title: '已撤回', icon: 'success'})
      load()
    } finally {
      setActing('')
    }
  }

  const handleReview = async (id: string, approve: boolean) => {
    if (acting) return
    const res = await showModal({
      title: approve ? '通过换班' : '拒绝换班',
      content: approve ? '通过后双方班次自动交换；服务端将校验交换后是否冲突' : '确定拒绝该申请吗？',
      confirmText: approve ? '通过' : '拒绝',
      cancelText: '再想想'
    })
    if (!res.confirm) return
    try {
      setActing(id)
      const {error: e} = await supabase.rpc('review_schedule_swap', {
        p_request_id: id,
        p_approve: approve,
        p_review_notes: null
      })
      if (e) {
        setRowError(id, e.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, ''))
        return
      }
      showToast({title: approve ? '已通过，班次已交换' : '已拒绝', icon: 'success'})
      load()
    } finally {
      setActing('')
    }
  }

  const isMine = (r: DisplayRow) => myIds.includes(r.requester_id)
  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter)
  const pending = rows.filter((r) => r.status === 'pending').length
  const approved = rows.filter((r) => r.status === 'approved').length
  const rejected = rows.filter((r) => r.status === 'rejected').length

  const personBlock = (name: string, shiftText: string) => (
    <View className="flex-1">
      <View className="flex items-center gap-1">
        <View className="i-mdi-account-outline text-sm text-gray-400" />
        <Text className="text-xs font-medium text-gray-600">{name}</Text>
      </View>
      <Text className="text-sm font-semibold mt-1 text-gray-800">{shiftText}</Text>
    </View>
  )

  return (
    <View className="min-h-screen bg-gray-50">
      <TabHero title="换班" subtitle="记录与审批 · 冲突由服务端裁决" />
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="px-4 pb-8 -mt-9">
          <StatsStrip
            items={[
              {value: rows.length, label: '全部'},
              {value: pending, label: '待审批', valueClass: pending > 0 ? 'text-warning-600' : ''},
              {value: approved, label: '已通过', valueClass: 'text-success-600'},
              {value: rejected, label: '已拒绝', valueClass: 'text-danger-600'}
            ]}
          />

          <View className="mt-3 flex gap-2">
            {[
              {k: 'all', label: '全部'},
              {k: 'pending', label: '待审批'},
              {k: 'approved', label: '已通过'},
              {k: 'rejected', label: '已拒绝'}
            ].map((f) => (
              <View
                key={f.k}
                className={`flex-1 text-center py-1.5 rounded-lg ${filter === f.k ? 'bg-primary-500' : 'bg-white'}`}
                onClick={() => setFilter(f.k)}>
                <Text className={`text-xs ${filter === f.k ? 'text-white' : 'text-gray-500'}`}>{f.label}</Text>
              </View>
            ))}
          </View>

          {error && (
            <View className="mt-3">
              <ErrorBanner message={error} onRetry={load} />
            </View>
          )}

          <View className="mt-3 space-y-3">
            {loading ? (
              [0, 1].map((i) => <View key={i} className="bg-white rounded-2xl shadow-sm h-36 animate-pulse" />)
            ) : filtered.length === 0 ? (
              <View className="bg-white rounded-2xl shadow-sm py-12 flex flex-col items-center">
                <View className="i-mdi-swap-horizontal-off text-5xl text-gray-200" />
                <Text className="mt-2 text-sm text-gray-400">
                  {filter === 'pending' ? '暂无待审批的换班申请' : '暂无换班记录'}
                </Text>
                <Text className="mt-1 text-xs text-gray-300">员工可在「我的班次」发起换班</Text>
              </View>
            ) : (
              filtered.map((r) => (
                <View key={r.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <View className="flex items-center justify-between mb-3">
                    <View className={`px-2.5 py-1 rounded-full flex items-center gap-1 ${r.statusTone}`}>
                      <View className={`${r.statusIcon} text-sm`} />
                      <Text className="text-xs font-medium">{r.statusName}</Text>
                    </View>
                    <Text className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</Text>
                  </View>

                  {/* 交换对照：张三 ⇅ 李四 */}
                  <View className="bg-gray-50 rounded-xl p-3 flex items-center">
                    {personBlock(r.requester?.name || '发起人', fmtShift(r.requester_shift))}
                    <View className="mx-2 i-mdi-swap-vertical text-2xl text-primary-400" />
                    {personBlock(r.target?.name || '同事', fmtShift(r.target_shift))}
                  </View>

                  {r.reason && (
                    <View className="mt-2 flex items-start gap-1.5">
                      <View className="i-mdi-text-box-outline text-sm text-gray-300 mt-0.5" />
                      <Text className="text-xs text-gray-500 flex-1">{r.reason}</Text>
                    </View>
                  )}
                  {r.review_notes && (
                    <View className="mt-1 flex items-start gap-1.5">
                      <View className="i-mdi-comment-text-outline text-sm text-gray-300 mt-0.5" />
                      <Text className="text-xs text-gray-500 flex-1">审批备注：{r.review_notes}</Text>
                    </View>
                  )}

                  {r.actionError && (
                    <View className="mt-2 bg-danger-50 rounded-lg p-2.5 flex items-start gap-1.5">
                      <View className="i-mdi-alert-circle-outline text-sm text-danger-500 mt-0.5" />
                      <Text className="text-xs text-danger-600 flex-1">{r.actionError}</Text>
                    </View>
                  )}

                  {r.status === 'pending' && (
                    <View className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                      {isMine(r) && (
                        <View
                          className="flex-1 text-center py-2 rounded-lg bg-gray-100 active:opacity-70"
                          onClick={() => handleCancel(r.id)}>
                          <Text className="text-xs text-gray-600">{acting === r.id ? '处理中…' : '撤回申请'}</Text>
                        </View>
                      )}
                      {!isMine(r) && (
                        <>
                          <View
                            className="flex-1 text-center py-2 rounded-lg bg-success-500 active:opacity-80"
                            onClick={() => handleReview(r.id, true)}>
                            <Text className="text-xs text-white">
                              {acting === r.id ? '服务端校验中…' : '通过并交换'}
                            </Text>
                          </View>
                          <View
                            className="flex-1 text-center py-2 rounded-lg bg-gray-100 active:opacity-70"
                            onClick={() => handleReview(r.id, false)}>
                            <Text className="text-xs text-danger-600">拒绝</Text>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default SwapRecords
