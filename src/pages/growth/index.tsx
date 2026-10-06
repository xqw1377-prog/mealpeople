/**
 * 我的成长 Tab · 工作旅途 DS V2（2026-10-06 一期）
 * 结构：page shell + sections（等级/学习/认证/课程/学习中心）
 * 状态：Loading(骨架) / Empty(员工未建档引导) / Error(重试) / Normal
 * 修复：原空态 switchTab 指向非 Tab 页（/packageB/pages/home）为坏路由，改为工作台 Tab
 */
import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {ErrorBanner, StatsStrip, TabHero} from '@/components/ds'
import {getEmployeeByUserId} from '@/db/api'
import {getEmployeeGrowthData} from '@/db/api-growth'
import type {GrowthData} from '@/db/types-growth'

const formatDate = (s: string) => {
  const d = new Date(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const COURSE_STATUS: Record<string, {text: string; cls: string}> = {
  enrolled: {text: '已报名', cls: 'bg-info-50 text-info-600'},
  in_progress: {text: '学习中', cls: 'bg-warning-50 text-warning-600'},
  completed: {text: '已完成', cls: 'bg-success-50 text-success-600'},
  failed: {text: '未通过', cls: 'bg-danger-50 text-danger-600'}
}

function Section(props: {title: string; icon: string; children: React.ReactNode}) {
  return (
    <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <View className="flex items-center justify-between mb-3.5">
        <Text className="text-base font-semibold text-gray-900">{props.title}</Text>
        <Text className={`${props.icon} text-lg text-primary-500`} />
      </View>
      {props.children}
    </View>
  )
}

export default function MyGrowth() {
  const {user} = useAuth({guard: true})
  const [data, setData] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const emp = await getEmployeeByUserId(user.id)
      if (!emp) {
        setData(null)
        setLoading(false)
        return
      }
      setData(await getEmployeeGrowthData(emp.id))
    } catch (e: any) {
      console.error('加载成长数据失败:', e)
      setError(e?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    load()
  })

  // ---- Loading：骨架 ----
  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50">
        <View className="bg-primary-500 pt-10 pb-14 px-4">
          <Text className="text-xl font-bold text-white">我的成长</Text>
        </View>
        <View className="px-4 -mt-9">
          <View className="bg-white rounded-2xl p-5 h-28 animate-pulse" />
          <View className="mt-4 bg-white rounded-2xl p-5 h-36 animate-pulse" />
          <View className="mt-4 bg-white rounded-2xl p-5 h-24 animate-pulse" />
        </View>
      </View>
    )
  }

  // ---- Error：重试 ----
  if (error) {
    return (
      <View className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-8">
        <Text className="i-mdi-cloud-alert-outline text-5xl text-gray-300" />
        <Text className="mt-4 text-sm text-gray-500">{error}</Text>
        <View
          className="mt-6 px-8 py-2.5 rounded-full bg-primary-500 text-white text-sm"
          hoverClass="opacity-80"
          onClick={load}>
          重新加载
        </View>
      </View>
    )
  }

  // ---- Empty：未建档引导（修复原坏路由 switchTab） ----
  if (!data) {
    return (
      <View className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center">
          <Text className="i-mdi-account-child-outline text-5xl text-primary-500" />
        </View>
        <Text className="mt-5 text-lg font-bold text-gray-900">还没有成长档案</Text>
        <Text className="mt-2 text-sm text-gray-400 text-center">您还不是员工，请联系管理员添加后开始成长之旅</Text>
        <View
          className="mt-8 px-10 py-3 rounded-full bg-primary-500 text-white text-sm font-medium"
          hoverClass="opacity-80"
          onClick={() => Taro.switchTab({url: '/pages/index/index'})}>
          回工作台
        </View>
      </View>
    )
  }

  const {level, learning_progress, certifications, recent_courses} = data
  const levelPct = Math.min((level.level_score / level.next_level_score) * 100, 100)

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border">
        {/* 等级 Hero（DS） */}
        <TabHero
          title={level.current_level}
          subtitle={`距 ${level.next_level} 还需 ${level.next_level_score - level.level_score} 积分`}
          right={
            <View className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <Text className="i-mdi-star-four-points-outline text-3xl text-white" />
            </View>
          }>
          <View className="relative mt-4">
            <View className="flex items-center justify-between mb-1.5">
              <Text className="text-2xs text-white/75">等级积分</Text>
              <Text className="text-2xs text-white">
                {level.level_score} / {level.next_level_score}
              </Text>
            </View>
            <View className="h-1.5 bg-white/25 rounded-full overflow-hidden">
              <View className="h-full bg-white rounded-full" style={{width: `${levelPct}%`}} />
            </View>
          </View>
        </TabHero>

        {/* 学习进度统计条（DS） */}
        <StatsStrip
          items={[
            {value: learning_progress.total_courses, label: '总课程'},
            {value: learning_progress.completed_courses, label: '已完成', valueClass: 'text-success-600'},
            {value: learning_progress.in_progress_courses, label: '学习中', valueClass: 'text-info-600'}
          ]}
        />
        <View className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] mt-3 mx-4 py-4">
          <View className="px-4">
            <View className="flex items-center justify-between mb-1.5">
              <Text className="text-2xs text-gray-400">完成率</Text>
              <Text className="text-2xs font-medium text-primary-600">{learning_progress.completion_rate}%</Text>
            </View>
            <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary-500 rounded-full"
                style={{width: `${learning_progress.completion_rate}%`}}
              />
            </View>
            <View className="mt-2.5 flex items-center gap-4">
              <Text className="text-2xs text-gray-400">
                学习时长 <Text className="font-semibold text-gray-700">{learning_progress.total_learning_hours}h</Text>
              </Text>
              <Text className="text-2xs text-gray-400">
                平均分 <Text className="font-semibold text-gray-700">{learning_progress.average_score}</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* 获得认证 */}
        <Section title="获得认证" icon="i-mdi-certificate-outline">
          {certifications.length === 0 ? (
            <View className="py-6 flex flex-col items-center">
              <Text className="i-mdi-certificate-outline text-4xl text-gray-200" />
              <Text className="mt-2 text-xs text-gray-400">暂无认证，完成培训后自动发放</Text>
            </View>
          ) : (
            certifications.map((c) => (
              <View key={c.id} className="flex items-center p-3 bg-gray-50 rounded-xl mb-2.5 last:mb-0">
                <View className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center mr-3">
                  <Text className="i-mdi-certificate-outline text-lg text-primary-600" />
                </View>
                <View className="flex-1">
                  <Text className="block text-sm font-medium text-gray-900">{c.cert_name}</Text>
                  <Text className="block text-2xs text-gray-400 mt-0.5">{formatDate(c.obtain_date)}</Text>
                </View>
                <View
                  className={`px-2 py-0.5 rounded-full ${c.cert_status === 'active' ? 'bg-success-50' : 'bg-gray-100'}`}>
                  <Text className={`text-2xs ${c.cert_status === 'active' ? 'text-success-600' : 'text-gray-400'}`}>
                    {c.cert_status === 'active' ? '有效' : '已过期'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Section>

        {/* 最近课程 */}
        <Section title="最近课程" icon="i-mdi-history">
          {recent_courses.length === 0 ? (
            <View className="py-6 flex flex-col items-center">
              <Text className="i-mdi-book-open-page-variant-outline text-4xl text-gray-200" />
              <Text className="mt-2 text-xs text-gray-400">暂无学习记录</Text>
            </View>
          ) : (
            recent_courses.map((r) => {
              const st = COURSE_STATUS[r.status] || {text: '未知', cls: 'bg-gray-100 text-gray-400'}
              return (
                <View key={r.id} className="p-3 bg-gray-50 rounded-xl mb-2.5 last:mb-0">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm font-medium text-gray-900 flex-1 truncate">
                      课程 {r.course_id.slice(0, 8)}
                    </Text>
                    <View className={`px-2 py-0.5 rounded-full ${st.cls}`}>
                      <Text className="text-2xs">{st.text}</Text>
                    </View>
                  </View>
                  {r.status !== 'completed' && (
                    <View>
                      <View className="flex items-center justify-between mb-1">
                        <Text className="text-2xs text-gray-400">进度</Text>
                        <Text className="text-2xs text-gray-500">{r.progress}%</Text>
                      </View>
                      <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <View className="h-full bg-primary-500 rounded-full" style={{width: `${r.progress}%`}} />
                      </View>
                    </View>
                  )}
                  {r.status === 'completed' && r.score !== null && (
                    <View className="flex items-center">
                      <Text className="i-mdi-star text-xs text-warning-500 mr-1" />
                      <Text className="text-2xs text-gray-500">考核 {r.score} 分</Text>
                    </View>
                  )}
                  <Text className="block text-2xs text-gray-400 mt-1.5">{formatDate(r.created_at)}</Text>
                </View>
              )
            })
          )}
        </Section>

        {/* 学习中心（开发中功能保持 toast 反馈） */}
        <Section title="学习中心" icon="i-mdi-school-outline">
          <View className="grid grid-cols-4 gap-3">
            {[
              {icon: 'i-mdi-book-open-page-variant-outline', label: '浏览课程'},
              {icon: 'i-mdi-file-document-edit-outline', label: '参加考试'},
              {icon: 'i-mdi-calendar-check-outline', label: '学习计划'},
              {icon: 'i-mdi-chart-box-outline', label: '成长报告'}
            ].map((x) => (
              <View
                key={x.label}
                className="flex flex-col items-center"
                hoverClass="opacity-60"
                onClick={() => Taro.showToast({title: '功能开发中', icon: 'none'})}>
                <View className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center">
                  <Text className={`${x.icon} text-xl text-primary-600`} />
                </View>
                <Text className="mt-1.5 text-2xs text-gray-600">{x.label}</Text>
              </View>
            ))}
          </View>
        </Section>
        <View className="h-6" />
      </ScrollView>
    </View>
  )
}
