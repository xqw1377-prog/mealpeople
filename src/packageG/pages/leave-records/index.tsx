/**
 * 请假记录 · P2 重写（command RPC + DS）
 * 员工：自己的请假历史 + 撤回 pending
 * DS：TabHero / StatsStrip / ErrorBanner / tokens
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {ErrorBanner, StatsStrip, TabHero} from '@/components/ds'

interface LeaveRow {
  id: string
  leave_type: string
  start_date: string
  end_date: string
  days: number | null
  reason: string | null
  status: string
  approval_comment: string | null
  created_at: string
}

const TYPE_LABEL: Record<string, string> = {
  annual_leave: '年假',
  sick_leave: '病假',
  personal_leave: '事假',
  other: '其他'
}

const STATUS: Record<string, {text: string; tone: string; icon: string}> = {
  pending: {text: '待审批', tone: 'text-warning-600 bg-warning-50', icon: 'i-mdi-clock-outline'},
  approved: {text: '已通过', tone: 'text-success-600 bg-success-50', icon: 'i-mdi-check-circle'},
  rejected: {text: '已拒绝', tone: 'text-danger-600 bg-danger-50', icon: 'i-mdi-close-circle'},
  cancelled: {text: '已撤回', tone: 'text-gray-500 bg-gray-100', icon: 'i-mdi-cancel'}
}

const md = (d: string) => d.slice(5).replace('-', '月') + '日'

const LeaveRecords: React.FC = () => {
  useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<LeaveRow[]>([])
  const [acting, setActing] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const {data, error: qErr} = await supabase
        .from('leave_requests')
        .select('id, leave_type, start_date, end_date, days, reason, status, approval_comment, created_at')
        .order('created_at', {ascending: false})
        .limit(50)
      if (qErr) throw qErr
      setRows((data || []) as unknown as LeaveRow[])
    } catch (e) {
      console.error('加载请假记录失败:', e)
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    load()
  })

  const cancel = async (id: string) => {
    if (acting) return
    const res = await Taro.showModal({
      title: '撤回申请',
      content: '确定撤回这笔请假申请吗？',
      confirmText: '撤回',
      cancelText: '保留'
    })
    if (!res.confirm) return
    setActing(id)
    try {
      const {error: e} = await supabase.rpc('leave_cancel', {p_request_id: id})
      if (e) {
        Taro.showToast({title: e.message.replace(/^(AUTH_DENIED|INVALID)[^:]*:\s*/, ''), icon: 'none', duration: 3000})
        return
      }
      Taro.showToast({title: '已撤回', icon: 'success'})
      load()
    } finally {
      setActing('')
    }
  }

  const approved = rows.filter((r) => r.status === 'approved').length
  const pending = rows.filter((r) => r.status === 'pending').length
  const rejected = rows.filter((r) => r.status === 'rejected').length

  return (
    <View className="min-h-screen bg-gray-50">
      <TabHero title="请假记录" subtitle="申请历史与审批结果" />
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

          {error && (
            <View className="mt-3">
              <ErrorBanner message={error} onRetry={load} />
            </View>
          )}

          <View className="mt-3 space-y-3">
            {loading ? (
              [0, 1].map((i) => <View key={i} className="bg-white rounded-2xl shadow-sm h-32 animate-pulse" />)
            ) : rows.length === 0 ? (
              <View className="bg-white rounded-2xl shadow-sm py-12 flex flex-col items-center">
                <View className="i-mdi-calendar-remove-outline text-5xl text-gray-200" />
                <Text className="mt-2 text-sm text-gray-400">暂无请假记录</Text>
              </View>
            ) : (
              rows.map((r) => {
                const st = STATUS[r.status] || STATUS.pending
                return (
                  <View key={r.id} className="bg-white rounded-2xl shadow-sm p-4">
                    <View className="flex items-center justify-between mb-3">
                      <View className={`px-2.5 py-1 rounded-full flex items-center gap-1 ${st.tone}`}>
                        <View className={`${st.icon} text-sm`} />
                        <Text className="text-xs font-medium">{st.text}</Text>
                      </View>
                      <Text className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</Text>
                    </View>

                    <View className="bg-gray-50 rounded-xl p-3">
                      <View className="flex items-center justify-between">
                        <Text className="text-sm font-medium text-gray-800">
                          {TYPE_LABEL[r.leave_type] || r.leave_type}
                        </Text>
                        <Text className="text-xs text-gray-400">{r.days || 1} 天</Text>
                      </View>
                      <Text className="text-sm text-gray-600 mt-1">
                        {md(r.start_date)} – {md(r.end_date)}
                      </Text>
                      {r.reason && <Text className="text-xs text-gray-500 mt-1">原因：{r.reason}</Text>}
                      {r.approval_comment && (
                        <Text className="text-xs text-gray-500 mt-0.5">审批：{r.approval_comment}</Text>
                      )}
                    </View>

                    {r.status === 'pending' && (
                      <View
                        className="mt-3 text-center py-2 rounded-lg bg-gray-100 active:opacity-70"
                        onClick={() => cancel(r.id)}>
                        <Text className="text-xs text-gray-600">{acting === r.id ? '处理中…' : '撤回申请'}</Text>
                      </View>
                    )}
                  </View>
                )
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default LeaveRecords
