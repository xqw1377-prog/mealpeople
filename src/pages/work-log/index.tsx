/**
 * 工作记录 Tab · 工作旅途 DS V2 P1-C（2026-10-06 Gate Remediation）
 * P1-1：统计改为独立 count 查询（tenant+employee+日期范围），不再从列表页推导
 * P1-3：TabHero/StatsStrip 从 DS 导入，去手写 Hero
 * 嵌套滚动修复：去掉外层纵向 ScrollView，PullList 独占剩余高度，
 *        确保 onScrollToLower 可触发（>20 条翻页待预览验证）
 * 状态：Loading(骨架)/Empty(引导)/Error(PullList 独立态+重试)/Normal/Long-content(分页)
 */
import {Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useRef, useState} from 'react'
import {supabase} from '@/client/supabase'
import Drawer from '@/components/Drawer'
import {ErrorBanner, PullList, StatsStrip, TabHero} from '@/components/ds'
import type {WorkRecord} from '@/components/WorkLog'
import {AddRecordForm, RecordDetail} from '@/components/WorkLog'
import {getEmployeeByUserId} from '@/db/api'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const PAGE_SIZE = 20

const CATEGORY_TONE: Record<string, string> = {
  blue: 'bg-info-50 text-info-600',
  green: 'bg-success-50 text-success-600',
  orange: 'bg-warning-50 text-warning-600',
  purple: 'bg-primary-50 text-primary-600',
  red: 'bg-danger-50 text-danger-600',
  cyan: 'bg-info-50 text-info-600',
  pink: 'bg-primary-50 text-primary-600',
  gray: 'bg-gray-100 text-gray-500'
}

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const WorkLog: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [baseLoading, setBaseLoading] = useState(true)
  const [baseError, setBaseError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState({today: 0, week: 0, month: 0})
  const [statsLoading, setStatsLoading] = useState(true)
  const [listKey, setListKey] = useState(0)
  const empRef = useRef<string | null>(null)

  const [drawerType, setDrawerType] = useState<'add' | 'detail' | null>(null)
  const [selected, setSelected] = useState<WorkRecord | null>(null)

  // P1-D：统计独立 count 查询（显式检查 Supabase error；自然周/自然月口径）
  const loadStats = useCallback(
    async (empId: string) => {
      if (!currentTenant) return
      setStatsLoading(true)
      try {
        const now = new Date()
        // 今日=今天00:00；本周=本周一00:00；本月=本月1日00:00（自然口径）
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const weekStart = new Date(todayStart)
        weekStart.setDate(weekStart.getDate() - ((now.getDay() + 6) % 7)) // 周一
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const q = async (gte: Date) => {
          const {count, error} = await supabase
            .from('work_records')
            .select('id', {count: 'exact', head: true})
            .eq('tenant_id', currentTenant.id)
            .eq('employee_id', empId)
            .gte('created_at', gte.toISOString())
          if (error) throw error
          return count ?? 0
        }
        const [today, week, month] = await Promise.all([q(todayStart), q(weekStart), q(monthStart)])
        setStats({today, week, month})
      } catch (e) {
        console.error('统计查询失败:', e)
        setStats({today: -1, week: -1, month: -1}) // -1 = 未知（显示 -）
      } finally {
        setStatsLoading(false)
      }
    },
    [currentTenant]
  )

  const loadBase = useCallback(async () => {
    if (!user || !currentTenant) {
      setBaseLoading(false)
      return
    }
    setBaseLoading(true)
    setBaseError(null)
    try {
      const emp = await getEmployeeByUserId(user.id)
      setEmployee(emp || null) // null = 无员工档案（真实 Empty，非骨架）
      if (emp) {
        if (empRef.current !== emp.id) empRef.current = emp.id
        loadStats(emp.id)
      }
      const {data: profile, error: roleError} = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (roleError) throw roleError
      setIsAdmin(profile?.role === 'admin' || profile?.role === 'tenant_admin' || profile?.role === 'super_admin')
    } catch (e) {
      console.error('加载基础信息失败:', e)
      setBaseError('基础信息加载失败，请重试')
    } finally {
      setBaseLoading(false)
    }
  }, [user, currentTenant, loadStats])

  useDidShow(() => {
    loadBase()
  })

  // PullList 分页取数（range 真分页）
  const fetchPage = useCallback(
    async (page: number): Promise<WorkRecord[]> => {
      if (!user || !currentTenant || !employee) return []
      const {data, error} = await supabase
        .from('work_records')
        .select(`id, content, images, videos, voice_duration, created_at,
               category:work_log_categories(id, name, icon, color)`)
        .eq('tenant_id', currentTenant.id)
        .eq('employee_id', employee.id)
        .order('created_at', {ascending: false})
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
      if (error) throw error
      return (data || []).map((r: any) => ({
        id: r.id,
        content: r.content,
        images: r.images || [],
        videos: r.videos || [],
        voice_duration: r.voice_duration || 0,
        created_at: r.created_at,
        category: Array.isArray(r.category)
          ? r.category[0] || {id: '', name: '未分类', icon: 'i-mdi-file-document-outline', color: 'gray'}
          : r.category || {id: '', name: '未分类', icon: 'i-mdi-file-document-outline', color: 'gray'}
      }))
    },
    [user, currentTenant, employee]
  )

  const reload = () => {
    setListKey((k) => k + 1)
    if (empRef.current) loadStats(empRef.current)
  }

  const openAdd = () => setDrawerType('add')
  const openDetail = (r: WorkRecord) => {
    setSelected(r)
    setDrawerType('detail')
  }
  const closeDrawer = () => {
    setDrawerType(null)
    setSelected(null)
  }
  const onSuccess = () => {
    closeDrawer()
    reload()
  }

  const statVal = (n: number) => (statsLoading ? '…' : n < 0 ? '-' : String(n))

  return (
    <View className="h-screen overflow-hidden bg-gray-50 flex flex-col">
      {/* 品牌头（DS）+ 统计条（DS，真实 count） */}
      <TabHero
        title="工作记录"
        subtitle="随手记录，看见成长"
        right={
          <View className="flex items-center gap-1.5" hoverClass="opacity-70" onClick={openAdd}>
            <Text className="i-mdi-plus text-lg text-white" />
            <Text className="text-xs text-white/90">记一笔</Text>
          </View>
        }
      />
      <StatsStrip
        items={[
          {value: statVal(stats.today), label: '今日'},
          {value: statVal(stats.week), label: '本周'},
          {value: statVal(stats.month), label: '本月'}
        ]}
      />

      {/* 管理入口（admin） */}
      {isAdmin && (
        <View
          className="mx-4 mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-gray-100"
          hoverClass="opacity-70"
          onClick={() => Taro.navigateTo({url: '/pages/work-log/category-settings/index'})}>
          <Text className="i-mdi-tag-outline text-base text-info-500" />
          <Text className="flex-1 text-xs text-gray-600">类别设置（管理分类）</Text>
          <Text className="i-mdi-chevron-right text-base text-gray-300" />
        </View>
      )}

      {/* 主体：baseLoading 骨架 / baseError / 无租户引导 / 无档案 Empty / PullList(flex-1 min-h-0) */}
      {baseLoading ? (
        <View className="px-4 mt-3">
          {[0, 1, 2].map((i) => (
            <View key={i} className="mb-3 h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </View>
      ) : baseError ? (
        <ErrorBanner message={baseError} onRetry={loadBase} />
      ) : !currentTenant ? (
        <View className="flex-1 flex flex-col items-center justify-center px-8">
          <Text className="i-mdi-office-building-outline text-5xl text-gray-300" />
          <Text className="mt-4 text-sm font-semibold text-gray-700">请先选择企业</Text>
          <Text className="mt-1 text-xs text-gray-400">工作记录需要在企业上下文中使用</Text>
          <View
            className="mt-6 px-8 py-2.5 rounded-full bg-primary-500 text-white text-sm"
            hoverClass="opacity-80"
            onClick={() => Taro.navigateTo({url: '/pages/tenant-select/index'})}>
            选择企业
          </View>
        </View>
      ) : !employee ? (
        <View className="flex-1 flex flex-col items-center justify-center px-8">
          <Text className="i-mdi-account-off-outline text-5xl text-gray-300" />
          <Text className="mt-4 text-sm font-semibold text-gray-700">暂无员工档案</Text>
          <Text className="mt-1 text-xs text-gray-400">请联系管理员将您添加为员工后再使用工作记录</Text>
        </View>
      ) : (
        <View className="flex-1 min-h-0 mt-3">
          <PullList<WorkRecord>
            key={listKey}
            fetchPage={fetchPage}
            emptyText="还没有工作记录"
            emptyIcon="i-mdi-notebook-outline"
            emptyAction={{text: '添加第一条记录', onClick: openAdd}}
            className="h-full"
            renderItem={(r) => (
              <View
                className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                hoverClass="opacity-80"
                onClick={() => openDetail(r)}>
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-2.5">
                    <View
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${CATEGORY_TONE[r.category.color] || CATEGORY_TONE.gray}`}>
                      <Text className={`${r.category.icon} text-lg`} />
                    </View>
                    <View>
                      <Text className="block text-sm font-semibold text-gray-900">{r.category.name}</Text>
                      <Text className="block text-2xs text-gray-400 mt-0.5">{formatTime(r.created_at)}</Text>
                    </View>
                  </View>
                  <Text className="i-mdi-chevron-right text-base text-gray-300" />
                </View>
                {r.content && (
                  <Text className="block mt-2.5 text-xs text-gray-600 leading-relaxed line-clamp-3">{r.content}</Text>
                )}
                {(r.images.length > 0 || r.videos.length > 0 || r.voice_duration > 0) && (
                  <View className="mt-2.5 flex items-center gap-2 flex-wrap">
                    {r.images.length > 0 && (
                      <View className="flex items-center gap-1 bg-info-50 px-2.5 py-1 rounded-full">
                        <Text className="i-mdi-image-outline text-xs text-info-600" />
                        <Text className="text-2xs text-info-600">{r.images.length} 图</Text>
                      </View>
                    )}
                    {r.videos.length > 0 && (
                      <View className="flex items-center gap-1 bg-primary-50 px-2.5 py-1 rounded-full">
                        <Text className="i-mdi-video-outline text-xs text-primary-600" />
                        <Text className="text-2xs text-primary-600">视频</Text>
                      </View>
                    )}
                    {r.voice_duration > 0 && (
                      <View className="flex items-center gap-1 bg-success-50 px-2.5 py-1 rounded-full">
                        <Text className="i-mdi-microphone text-xs text-success-600" />
                        <Text className="text-2xs text-success-600">{r.voice_duration}秒</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
            keyExtractor={(r) => r.id}
          />
        </View>
      )}

      {/* 悬浮添加 */}
      <View
        className="fixed bottom-24 right-4 p-3.5 rounded-full bg-primary-500 shadow-lg flex items-center justify-center"
        hoverClass="opacity-80"
        onClick={openAdd}>
        <Text className="i-mdi-plus text-2xl text-white" />
      </View>

      <Drawer visible={drawerType === 'add'} onClose={closeDrawer} title="添加记录" height="85vh">
        <AddRecordForm onSuccess={onSuccess} onCancel={closeDrawer} />
      </Drawer>
      <Drawer visible={drawerType === 'detail'} onClose={closeDrawer} title="记录详情" height="80vh">
        <RecordDetail record={selected} onDelete={() => onSuccess()} onClose={closeDrawer} />
      </Drawer>
    </View>
  )
}

export default WorkLog
