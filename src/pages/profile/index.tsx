/**
 * 我的 Tab · 工作旅途 DS V2（2026-10-06 一期）
 * 结构：page shell + Hero用户卡 + MenuSection/ListRow 领域组件
 * 路由 parity：原全部入口保留（设置/管理工作台/快速开始/员工中心/Agent管理/配置中心/
 *   Agent工作台/我的门店/加入团队/帮助中心/关于我们 + 退出登录）
 * 状态：Loading(骨架)/Normal；角色分区 isAdmin/isAgent 条件渲染同原版
 */
import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {ErrorBanner, TabHero} from '@/components/ds'
import {getCurrentUser, getEmployeeByUserId} from '@/db/api'
import type {Employee, Profile as UserProfile} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

interface MenuRow {
  title: string
  desc?: string
  url: string
  icon: string
  tone?: 'primary' | 'success' | 'info' | 'warning'
  badge?: string
}

const TONE_CLS = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  info: 'bg-info-50 text-info-600',
  warning: 'bg-warning-50 text-warning-600'
} as const

function MenuSection(props: {title?: string; rows: MenuRow[]}) {
  return (
    <View className="mx-4 mt-4 bg-white rounded-2xl p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {props.title && <Text className="block px-3 pt-3 pb-1 text-xs font-medium text-gray-400">{props.title}</Text>}
      {props.rows.map((r) => (
        <View
          key={r.title + r.url}
          className="flex items-center px-3 py-3 rounded-xl"
          hoverClass="bg-gray-50"
          onClick={() => Taro.navigateTo({url: r.url})}>
          <View className={`w-9 h-9 rounded-lg flex items-center justify-center ${TONE_CLS[r.tone || 'info']}`}>
            <Text className={`${r.icon} text-lg`} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="block text-sm font-medium text-gray-900">{r.title}</Text>
            {r.desc && <Text className="block text-2xs text-gray-400 mt-0.5">{r.desc}</Text>}
          </View>
          {r.badge && (
            <Text className="px-2 py-0.5 rounded-full bg-primary-50 text-2xs text-primary-600 mr-1">{r.badge}</Text>
          )}
          <Text className="i-mdi-chevron-right text-base text-gray-300" />
        </View>
      ))}
    </View>
  )
}

const ROLE_TEXT: Record<string, string> = {
  super_admin: '超级管理员',
  tenant_admin: 'HR管理员',
  agent: 'Agent',
  store_manager: '店经理',
  employee: '员工',
  guest: '访客'
}

export default function Profile() {
  const {user, logout} = useAuth({guard: true})
  const currentTenant = useTenantStore((s) => s.currentTenant)
  const clearTenantContext = useTenantStore((s) => s.clearTenantContext)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [p, e] = await Promise.all([getCurrentUser(), getEmployeeByUserId(user.id)])
      setProfile(p)
      setEmployee(e)
    } catch (e) {
      console.error('加载用户数据失败:', e)
      setLoadError('用户数据加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadData()
  })

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          clearTenantContext()
          logout()
        }
      }
    })
  }

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'tenant_admin'
  const isAgent = profile?.role === 'agent'

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border">
        {/* 用户 Hero（DS） */}
        <TabHero title="我的" subtitle="账号与设置">
          <View className="relative flex items-center mt-4">
            {loading ? (
              <View className="w-16 h-16 rounded-2xl bg-white/25 animate-pulse" />
            ) : (
              <View className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Text className="i-mdi-account-outline text-4xl text-white" />
              </View>
            )}
            <View className="flex-1 ml-3.5">
              <Text className="text-lg font-bold text-white">
                {employee?.name || profile?.name || (loading ? '…' : '未设置姓名')}
              </Text>
              {!loading && !employee && (
                <Text className="block text-2xs text-white/60 mt-0.5">暂无员工档案，请联系管理员添加</Text>
              )}
              <View className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <Text className="px-2 py-0.5 rounded-full bg-white/20 text-2xs text-white">
                  {ROLE_TEXT[profile?.role || 'employee'] || '员工'}
                </Text>
                {employee?.position && (
                  <Text className="px-2 py-0.5 rounded-full bg-white/20 text-2xs text-white">{employee.position}</Text>
                )}
                {currentTenant ? (
                  <Text className="text-2xs text-white/70">{currentTenant.name}</Text>
                ) : (
                  <Text className="px-2 py-0.5 rounded-full bg-white/15 text-2xs text-white/80">未加入企业</Text>
                )}
              </View>
            </View>
            <View
              className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center"
              hoverClass="opacity-60"
              onClick={() => Taro.navigateTo({url: '/pages/settings/index'})}>
              <Text className="i-mdi-cog-outline text-lg text-white" />
            </View>
          </View>
        </TabHero>
        {loadError && <ErrorBanner message={loadError} onRetry={loadData} />}

        {/* 管理功能（isAdmin，路由 parity 全保留） */}
        {isAdmin && (
          <MenuSection
            rows={[
              {
                title: '管理工作台',
                desc: '系统概览与数据统计',
                url: '/packageD/pages/dashboard/index',
                icon: 'i-mdi-view-dashboard-outline',
                tone: 'primary'
              },
              {
                title: '快速开始',
                desc: '新手引导和配置向导',
                url: '/pages/quick-start/index',
                icon: 'i-mdi-rocket-launch-outline',
                tone: 'success',
                badge: '推荐'
              },
              {
                title: '员工中心',
                desc: '管理员工信息和权限',
                url: '/pages/employee-hub/index',
                icon: 'i-mdi-account-group-outline',
                tone: 'info'
              },
              {
                title: 'Agent管理',
                desc: '管理区域经理和督导',
                url: '/packageF/pages/agent-management/index',
                icon: 'i-mdi-account-supervisor-outline',
                tone: 'primary'
              },
              {
                title: '配置中心',
                desc: '系统配置和参数设置',
                url: '/packageD/pages/config-center/index',
                icon: 'i-mdi-cog-outline',
                tone: 'info'
              }
            ]}
          />
        )}

        {/* Agent 功能（isAgent，路由 parity 全保留） */}
        {isAgent && (
          <MenuSection
            rows={[
              {
                title: 'Agent工作台',
                desc: '查看管理的门店和数据',
                url: '/pages/agent-workspace/index',
                icon: 'i-mdi-view-dashboard-outline',
                tone: 'primary',
                badge: '推荐'
              },
              {
                title: '我的门店',
                desc: '查看分配给我的门店',
                url: '/pages/agent-workspace/index',
                icon: 'i-mdi-store-outline',
                tone: 'info'
              }
            ]}
          />
        )}

        {/* 常用功能（路由 parity 全保留） */}
        <MenuSection
          rows={[
            ...(!currentTenant
              ? [
                  {
                    title: '加入团队',
                    desc: '使用邀请码加入企业团队',
                    url: '/packageE/pages/join-tenant/index',
                    icon: 'i-mdi-account-multiple-plus-outline',
                    tone: 'success' as const,
                    badge: '推荐'
                  }
                ]
              : []),
            {
              title: '快速开始',
              desc: '新手引导和功能介绍',
              url: '/pages/quick-start/index',
              icon: 'i-mdi-rocket-launch-outline',
              tone: 'success'
            },
            {
              title: '帮助中心',
              desc: '查看使用帮助和常见问题',
              url: '/pages/help-center/index',
              icon: 'i-mdi-help-circle-outline',
              tone: 'info'
            },
            {
              title: '关于我们',
              desc: '了解应用信息和版本',
              url: '/pages/about/index',
              icon: 'i-mdi-information-outline',
              tone: 'info'
            },
            ...(!isAdmin
              ? [
                  {
                    title: '配置中心',
                    desc: '需要管理员权限访问',
                    url: '/packageD/pages/config-center/index',
                    icon: 'i-mdi-cog-outline',
                    tone: 'info' as const,
                    badge: '需权限'
                  }
                ]
              : [])
          ]}
        />

        {/* 退出登录 */}
        <View className="mx-4 mt-4 mb-8">
          <View
            className="bg-white rounded-2xl py-3.5 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
            hoverClass="opacity-70"
            onClick={handleLogout}>
            <Text className="i-mdi-logout text-base text-danger-500 mr-1.5" />
            <Text className="text-sm text-danger-500 font-medium">退出登录</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
