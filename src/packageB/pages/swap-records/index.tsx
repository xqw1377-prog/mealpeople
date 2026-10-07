/**
 * 换班记录页面
 * P2-S1-A cutover：
 * - 列表直查 shift_swap_requests（RLS：员工见自己的，管理者见本店/本租户的）
 * - 班次详情来自 schedules 真实数据（embed，替换原「待实现」占位）
 * - 员工撤回 → cancel_schedule_swap；管理者审批 → review_schedule_swap
 * - 冲突与否由服务端在审批事务内裁决，UI 只解释结果
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'

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
  requester_shift: {schedule_date: string; start_time: string | null; end_time: string | null} | null
  target_shift: {schedule_date: string; start_time: string | null; end_time: string | null} | null
}

interface SwapDisplay extends SwapRow {
  statusName: string
  statusColor: string
  statusIcon: string
}

const fmtShift = (s: SwapRow['requester_shift']) =>
  s
    ? `${String(s.schedule_date).slice(5)} ${(s.start_time || '').slice(0, 5)}-${(s.end_time || '').slice(0, 5)}`
    : '班次已不可用'

const SwapRecords: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<SwapDisplay[]>([])
  const [myEmployeeIds, setMyEmployeeIds] = useState<string[]>([])
  const [acting, setActing] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const getStatusInfo = useCallback((status: string) => {
    const statusMap: Record<string, {name: string; color: string; icon: string}> = {
      pending: {name: '待审批', color: 'text-muted-foreground', icon: 'i-mdi-clock-outline'},
      approved: {name: '已通过', color: 'text-muted-foreground', icon: 'i-mdi-check-circle'},
      rejected: {name: '已拒绝', color: 'text-red-600', icon: 'i-mdi-close-circle'},
      cancelled: {name: '已取消', color: 'text-muted-foreground', icon: 'i-mdi-cancel'}
    }
    return statusMap[status] || {name: '未知', color: 'text-muted-foreground', icon: 'i-mdi-help-circle'}
  }, [])

  const loadSwapRecords = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const {data: empRows, error: empErr} = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
      if (empErr) throw empErr
      const empIds = (empRows || []).map((e: {id: string}) => e.id)
      setMyEmployeeIds(empIds)

      // RLS 决定可见性：自己的申请 + （管理者）本店/本租户全部
      // 双 FK 同表 → 别名 + !约束名 消歧（PGRST200）
      const {data: rows, error} = await supabase
        .from('shift_swap_requests')
        .select(
          'id, status, reason, review_notes, created_at, requester_id, target_id, ' +
            'requester_shift_id, target_shift_id, ' +
            'requester:employees!shift_swap_requests_requester_id_fkey(name), ' +
            'target:employees!shift_swap_requests_target_id_fkey(name), ' +
            'requester_shift:schedules!shift_swap_requests_requester_shift_fkey(schedule_date, start_time, end_time), ' +
            'target_shift:schedules!shift_swap_requests_target_shift_fkey(schedule_date, start_time, end_time)'
        )
        .order('created_at', {ascending: false})
        .limit(100)
      if (error) throw error
      const list = (rows || []) as unknown as (SwapRow & {requester_shift_id?: string; target_shift_id?: string})[]

      // P2-S1-A-R1：schedules 表级 RLS 收紧后，员工侧同事班次的 embed 会被过滤为 null
      // → 用专用最小读 RPC get_swap_shift_brief 补齐（仅日期/起止，无内部字段）
      const briefCache = new Map<
        string,
        {schedule_date: string; start_time: string | null; end_time: string | null} | null
      >()
      const fetchBrief = async (sid?: string) => {
        if (!sid) return null
        if (briefCache.has(sid)) return briefCache.get(sid) ?? null
        const {data} = await supabase.rpc('get_swap_shift_brief', {p_schedule_id: sid})
        const brief =
          ((data as unknown as {schedule_date: string; start_time: string; end_time: string}[] | null) || [])[0] || null
        briefCache.set(sid, brief)
        return brief
      }
      for (const r of list) {
        if (!r.requester_shift) r.requester_shift = await fetchBrief(r.requester_shift_id)
        if (!r.target_shift) r.target_shift = await fetchBrief(r.target_shift_id)
      }

      setRequests(
        list.map((r) => {
          const info = getStatusInfo(r.status)
          return {...r, statusName: info.name, statusColor: info.color, statusIcon: info.icon}
        })
      )
    } catch (e: unknown) {
      console.error('加载换班记录失败:', e)
      Taro.showToast({title: '加载失败，请重试', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user?.id, getStatusInfo])

  useDidShow(() => {
    loadSwapRecords()
  })

  // 员工撤回自己的 pending（command：仅 requester 本人）
  const handleCancel = async (requestId: string) => {
    const result = await Taro.showModal({
      title: '确认撤回',
      content: '确定要撤回这个换班申请吗？',
      confirmText: '撤回',
      cancelText: '保留'
    })
    if (!result.confirm || acting) return
    try {
      setActing(requestId)
      const {error} = await supabase.rpc('cancel_schedule_swap', {p_request_id: requestId})
      if (error) {
        Taro.showToast({title: error.message, icon: 'none', duration: 3000})
        return
      }
      Taro.showToast({title: '已撤回', icon: 'success'})
      loadSwapRecords()
    } finally {
      setActing('')
    }
  }

  // 管理者审批（command：服务端事务内做双方冲突校验）
  const handleReview = async (requestId: string, approve: boolean) => {
    if (acting) return
    const result = await Taro.showModal({
      title: approve ? '通过换班' : '拒绝换班',
      content: approve ? '通过后两位员工的班次将自动交换（服务端将校验交换后是否冲突）' : '确定拒绝该换班申请吗？',
      confirmText: approve ? '通过' : '拒绝',
      cancelText: '再想想'
    })
    if (!result.confirm) return
    try {
      setActing(requestId)
      const {error} = await supabase.rpc('review_schedule_swap', {
        p_request_id: requestId,
        p_approve: approve,
        p_review_notes: null
      })
      if (error) {
        // CONFLICT/INVALID/AUTH 原因透出
        Taro.showToast({
          title: error.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, ''),
          icon: 'none',
          duration: 3000
        })
        return
      }
      Taro.showToast({title: approve ? '已通过，班次已交换' : '已拒绝', icon: 'success'})
      loadSwapRecords()
    } finally {
      setActing('')
    }
  }

  const filteredRequests = filterStatus === 'all' ? requests : requests.filter((r) => r.status === filterStatus)
  const pendingCount = requests.filter((r) => r.status === 'pending').length
  const isMyRequest = (r: SwapDisplay) => myEmployeeIds.includes(r.requester_id)

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
              {/* 统计卡片 */}
              <View className="bg-blue-100 rounded-lg p-6">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-foreground text-lg font-bold">换班统计</Text>
                  <View className="i-mdi-chart-box text-2xl text-blue-600" />
                </View>
                <View className="grid grid-cols-4 gap-2">
                  <View className="text-center">
                    <Text className="text-blue-600/80 text-xs">总申请</Text>
                    <Text className="text-foreground text-2xl font-bold mt-1">{requests.length}</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-blue-600/80 text-xs">待审批</Text>
                    <Text className="text-foreground text-2xl font-bold mt-1">{pendingCount}</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-blue-600/80 text-xs">已通过</Text>
                    <Text className="text-foreground text-2xl font-bold mt-1">
                      {requests.filter((r) => r.status === 'approved').length}
                    </Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-blue-600/80 text-xs">已拒绝</Text>
                    <Text className="text-foreground text-2xl font-bold mt-1">
                      {requests.filter((r) => r.status === 'rejected').length}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 筛选按钮 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <View className="flex flex-row items-center gap-2">
                  {[
                    {k: 'all', label: '全部'},
                    {k: 'pending', label: '待审批'},
                    {k: 'approved', label: '已通过'},
                    {k: 'rejected', label: '已拒绝'}
                  ].map((f) => (
                    <View
                      key={f.k}
                      className={`flex-1 text-center py-2 rounded-lg ${
                        filterStatus === f.k ? 'bg-green-500' : 'bg-gray-50/30'
                      }`}
                      onClick={() => setFilterStatus(f.k)}>
                      <Text className={`text-sm ${filterStatus === f.k ? 'text-white' : 'text-foreground'}`}>
                        {f.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* 列表 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-foreground">换班记录</Text>
                  <View className="i-mdi-history text-2xl text-blue-600" />
                </View>

                {filteredRequests.length === 0 ? (
                  <View className="text-center py-8">
                    <View className="i-mdi-file-document-outline text-5xl text-muted-foreground mb-2" />
                    <Text className="text-muted-foreground">暂无换班记录</Text>
                  </View>
                ) : (
                  <View className="space-y-3">
                    {filteredRequests.map((request) => (
                      <View key={request.id} className="rounded-xl p-4 bg-gray-50/30 border border-border">
                        <View className="flex flex-row items-center justify-between mb-3">
                          <View className="flex flex-row items-center">
                            <View className={`${request.statusIcon} text-xl ${request.statusColor} mr-2`} />
                            <Text className={`text-sm font-bold ${request.statusColor}`}>{request.statusName}</Text>
                          </View>
                          <Text className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </Text>
                        </View>

                        <View className="space-y-2">
                          <View className="flex flex-row items-start">
                            <View className="i-mdi-calendar-export text-base text-blue-600 mr-2 mt-0.5" />
                            <View className="flex-1">
                              <Text className="text-xs text-muted-foreground">
                                {request.requester?.name || '发起人'} · 让出班次
                              </Text>
                              <Text className="text-sm text-foreground">{fmtShift(request.requester_shift)}</Text>
                            </View>
                          </View>

                          <View className="flex flex-row items-start">
                            <View className="i-mdi-calendar-import text-base text-accent mr-2 mt-0.5" />
                            <View className="flex-1">
                              <Text className="text-xs text-muted-foreground">
                                {request.target?.name || '目标同事'} · 接手班次
                              </Text>
                              <Text className="text-sm text-foreground">{fmtShift(request.target_shift)}</Text>
                            </View>
                          </View>

                          {request.reason && (
                            <View className="flex flex-row items-start">
                              <View className="i-mdi-text-box text-base text-muted-foreground mr-2 mt-0.5" />
                              <View className="flex-1">
                                <Text className="text-xs text-muted-foreground">换班原因</Text>
                                <Text className="text-sm text-foreground">{request.reason}</Text>
                              </View>
                            </View>
                          )}

                          {request.review_notes && (
                            <View className="flex flex-row items-start">
                              <View className="i-mdi-comment-text text-base text-muted-foreground mr-2 mt-0.5" />
                              <View className="flex-1">
                                <Text className="text-xs text-muted-foreground">审批备注</Text>
                                <Text className="text-sm text-foreground">{request.review_notes}</Text>
                              </View>
                            </View>
                          )}
                        </View>

                        {/* 操作：员工撤回自己的；管理者审批（非本人申请） */}
                        {request.status === 'pending' && (
                          <View className="mt-3 pt-3 border-t border-border flex flex-row gap-2">
                            {isMyRequest(request) && (
                              <View
                                className="flex-1 text-center py-2 bg-blue-100 rounded-lg active:opacity-70"
                                onClick={() => handleCancel(request.id)}>
                                <Text className="text-sm text-red-600">
                                  {acting === request.id ? '处理中...' : '撤回申请'}
                                </Text>
                              </View>
                            )}
                            {!isMyRequest(request) && (
                              <>
                                <View
                                  className="flex-1 text-center py-2 bg-green-500 rounded-lg active:opacity-70"
                                  onClick={() => handleReview(request.id, true)}>
                                  <Text className="text-sm text-white">
                                    {acting === request.id ? '校验中...' : '通过并交换'}
                                  </Text>
                                </View>
                                <View
                                  className="flex-1 text-center py-2 bg-blue-100 rounded-lg active:opacity-70"
                                  onClick={() => handleReview(request.id, false)}>
                                  <Text className="text-sm text-red-600">拒绝</Text>
                                </View>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
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

export default SwapRecords
