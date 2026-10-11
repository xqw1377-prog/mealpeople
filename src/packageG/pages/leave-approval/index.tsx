/**
 * 请假审批 · P2 重写（command RPC + DS）
 * 管理者：看 pending 申请 → 审批（通过/拒绝 + 备注）
 * DS：TabHero / StatsStrip / ErrorBanner / tokens
 */

import {ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {ErrorBanner, StatsStrip, TabHero} from '@/components/ds'

interface PendingRow {
  id: string
  leave_type: string
  start_date: string
  end_date: string
  days: number | null
  reason: string | null
  status: string
  employees?: {name?: string} | {name?: string}[] | null
}

const TYPE_LABEL: Record<string, string> = {
  annual_leave: '年假',
  sick_leave: '病假',
  personal_leave: '事假',
  other: '其他'
}

const empName = (e: PendingRow['employees']) => (Array.isArray(e) ? e[0]?.name : e?.name) || '员工'
const md = (d: string) => d.slice(5).replace('-', '月') + '日'

const LeaveApproval: React.FC = () => {
  useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<PendingRow[]>([])
  const [comments, setComments] = useState<Record<string, string>>({})
  const [acting, setActing] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const {data, error: qErr} = await supabase
        .from('leave_requests')
        .select('id, leave_type, start_date, end_date, days, reason, status, employees(name)')
        .eq('status', 'pending')
        .order('created_at', {ascending: false})
        .limit(50)
      if (qErr) throw qErr
      setRows((data || []) as unknown as PendingRow[])
    } catch (e) {
      console.error('加载待审批失败:', e)
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    load()
  })

  const review = async (id: string, approve: boolean) => {
    if (acting) return
    const res = await Taro.showModal({
      title: approve ? '通过申请' : '拒绝申请',
      content: approve ? '确定通过这笔请假申请吗？' : '确定拒绝这笔请假申请吗？',
      confirmText: approve ? '通过' : '拒绝',
      cancelText: '再想想'
    })
    if (!res.confirm) return
    setActing(id)
    setActionError(null)
    try {
      const {error: e} = await supabase.rpc('leave_review', {
        p_request_id: id,
        p_approve: approve,
        p_comment: comments[id]?.trim() || null
      })
      if (e) {
        setActionError(e.message.replace(/^(AUTH_DENIED|INVALID)[^:]*:\s*/, ''))
        return
      }
      Taro.showToast({title: approve ? '已通过' : '已拒绝', icon: 'success'})
      load()
    } finally {
      setActing('')
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <TabHero title="请假审批" subtitle="待处理申请 · 服务端裁决" />
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="px-4 pb-8 -mt-9">
          <StatsStrip
            items={[
              {value: rows.length, label: '待审批'},
              {value: rows.filter((r) => r.leave_type === 'annual_leave').length, label: '年假'},
              {value: rows.filter((r) => r.leave_type === 'sick_leave').length, label: '病假'},
              {
                value: rows.filter((r) => r.leave_type === 'personal_leave' || r.leave_type === 'other').length,
                label: '其他'
              }
            ]}
          />

          {error && (
            <View className="mt-3">
              <ErrorBanner message={error} onRetry={load} />
            </View>
          )}

          {actionError && (
            <View className="mt-3 bg-danger-50 rounded-xl p-3 flex items-start gap-2">
              <View className="i-mdi-alert-circle-outline text-lg text-danger-500 mt-0.5" />
              <Text className="text-xs text-danger-600 flex-1">{actionError}</Text>
            </View>
          )}

          <View className="mt-3 space-y-3">
            {loading ? (
              [0, 1].map((i) => <View key={i} className="bg-white rounded-2xl shadow-sm h-40 animate-pulse" />)
            ) : rows.length === 0 ? (
              <View className="bg-white rounded-2xl shadow-sm py-12 flex flex-col items-center">
                <View className="i-mdi-check-all text-5xl text-gray-200" />
                <Text className="mt-2 text-sm text-gray-400">暂无待审批的请假申请</Text>
              </View>
            ) : (
              rows.map((r) => (
                <View key={r.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <View className="flex items-center justify-between mb-3">
                    <View className="flex items-center gap-2">
                      <View className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                        <View className="i-mdi-account-outline text-lg text-primary-500" />
                      </View>
                      <View>
                        <Text className="text-sm font-semibold text-gray-800">{empName(r.employees)}</Text>
                        <Text className="text-xs text-gray-400">
                          {TYPE_LABEL[r.leave_type] || r.leave_type} · {r.days || 1} 天
                        </Text>
                      </View>
                    </View>
                    <View className="px-2.5 py-1 rounded-full bg-warning-50">
                      <View className="i-mdi-clock-outline text-sm text-warning-600" />
                      <Text className="text-xs text-warning-600 ml-1">待审批</Text>
                    </View>
                  </View>

                  <View className="bg-gray-50 rounded-xl p-3">
                    <Text className="text-sm text-gray-800">
                      {md(r.start_date)} – {md(r.end_date)}
                    </Text>
                    {r.reason && <Text className="text-xs text-gray-500 mt-1">原因：{r.reason}</Text>}
                  </View>

                  <View className="mt-3">
                    <Textarea
                      className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 w-full"
                      placeholder="审批备注（可选）…"
                      value={comments[r.id] || ''}
                      onInput={(e) => setComments((prev) => ({...prev, [r.id]: e.detail.value}))}
                      maxlength={100}
                      style={{minHeight: '56px'}}
                    />
                  </View>

                  <View className="mt-3 flex gap-2">
                    <View
                      className="flex-1 text-center py-2.5 rounded-lg bg-success-500 active:opacity-80"
                      onClick={() => review(r.id, true)}>
                      <Text className="text-xs text-white">{acting === r.id ? '处理中…' : '通过'}</Text>
                    </View>
                    <View
                      className="flex-1 text-center py-2.5 rounded-lg bg-gray-100 active:opacity-70"
                      onClick={() => review(r.id, false)}>
                      <Text className="text-xs text-danger-600">拒绝</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default LeaveApproval
