/**
 * 工作记录 Tab · 工作旅途 DS V2（2026-10-06 一期）
 * 结构：page shell + sections + 既有领域组件(Drawer/AddRecordForm/RecordDetail) + DS(PullList/StatCard)
 * 状态：Loading(骨架)/Empty(引导)/Error(提示+下拉重试)/Normal/Long-content(真分页)
 */
import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import Drawer from '@/components/Drawer'
import {PullList} from '@/components/ds'
import type {WorkRecord} from '@/components/WorkLog'
import {AddRecordForm, RecordDetail} from '@/components/WorkLog'
import {getEmployeeByUserId} from '@/db/api'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const PAGE_SIZE = 20

// 类别色 → token 映射（不再使用散落色值）
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
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState({today: 0, week: 0, month: 0})
  const [listKey, setListKey] = useState(0) // 重置 PullList

  const [drawerType, setDrawerType] = useState<'add' | 'detail' | null>(null)
  const [selected, setSelected] = useState<WorkRecord | null>(null)

  const loadBase = useCallback(async () => {
    if (!user || !currentTenant) return
    try {
      const emp = await getEmployeeByUserId(user.id)
      if (!emp) return
      setEmployee(emp)
      const {data: profile} = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      setIsAdmin(profile?.role === 'admin' || profile?.role === 'tenant_admin' || profile?.role === 'super_admin')
    } catch (e) {
      console.error('加载基础信息失败:', e)
    }
  }, [user, currentTenant])

  useDidShow(() => {
    loadBase()
  })

  // PullList 分页取数（range 真分页，解决 301 行全量渲染）
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
      const rows: WorkRecord[] = (data || []).map((r: any) => ({
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
      // 首页时同步统计
      if (page === 1) {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
        setStats({
          today: rows.filter((r) => new Date(r.created_at).getTime() >= today).length,
          week: rows.filter((r) => new Date(r.created_at).getTime() >= today - 7 * 864e5).length,
          month: rows.filter((r) => new Date(r.created_at).getTime() >= today - 30 * 864e5).length
        })
      }
      return rows
    },
    [user, currentTenant, employee]
  )

  const reload = () => {
    setListKey((k) => k + 1)
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

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border">
        {/* 品牌头 + 统计条 */}
        <View className="relative overflow-hidden bg-primary-500 px-4 pt-10 pb-14">
          <View className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10" />
          <View className="relative flex items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-white">工作记录</Text>
              <Text className="mt-1 text-xs text-white/75">随手记录，看见成长</Text>
            </View>
            <View className="flex items-center gap-1.5" hoverClass="opacity-70" onClick={openAdd}>
              <Text className="i-mdi-plus text-lg text-white" />
              <Text className="text-xs text-white/90">记一笔</Text>
            </View>
          </View>
        </View>

        <View className="px-4 -mt-9 relative z-10">
          <View className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] grid grid-cols-3 py-4">
            <View className="text-center">
              <Text className="text-xl font-bold text-gray-900">{stats.today}</Text>
              <Text className="block mt-0.5 text-2xs text-gray-400">今日</Text>
            </View>
            <View className="text-center border-l border-r border-gray-100">
              <Text className="text-xl font-bold text-gray-900">{stats.week}</Text>
              <Text className="block mt-0.5 text-2xs text-gray-400">本周</Text>
            </View>
            <View className="text-center">
              <Text className="text-xl font-bold text-gray-900">{stats.month}</Text>
              <Text className="block mt-0.5 text-2xs text-gray-400">本月</Text>
            </View>
          </View>
        </View>

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

        {/* 记录列表：PullList（骨架/空态引导/下拉刷新/触底分页）；员工信息未就绪时骨架 */}
        <View className="mt-3">
          {!employee ? (
            <View className="px-4">
              {[0, 1, 2].map((i) => (
                <View key={i} className="mb-3 h-24 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </View>
          ) : (
            <PullList<WorkRecord>
              key={listKey}
              fetchPage={fetchPage}
              emptyText="还没有工作记录"
              emptyIcon="i-mdi-notebook-outline"
              emptyAction={{text: '添加第一条记录', onClick: openAdd}}
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
          )}
        </View>
        <View className="h-6" />
      </ScrollView>

      {/* 悬浮添加 */}
      <View
        className="fixed bottom-24 right-4 w-13 h-13 p-3.5 rounded-full bg-primary-500 shadow-lg flex items-center justify-center"
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
