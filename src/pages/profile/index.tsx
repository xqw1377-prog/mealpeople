/**
 * 我的页面 - 优化版
 * 统一设计风格，容易学、容易做、容易管理
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getCurrentUser, getEmployeeByUserId} from '@/db/api'
import type {Employee, Profile as UserProfile} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 列表项组件
interface ListItemProps {
  title: string
  url: string
  icon: string
  iconBg: string
  badge?: string
  description?: string
}

const ListItem: React.FC<ListItemProps> = ({title, url, icon, iconBg, badge, description}) => {
  return (
    <View
      className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-3 active:opacity-70 transition-all border border-border cursor-pointer"
      onClick={() => Taro.navigateTo({url})}>
      <View className="flex items-center gap-3">
        <View className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <View className={`${icon} text-2xl text-white`} />
        </View>
        <View className="flex-1">
          <Text className="text-base max-sm:text-sm font-bold text-foreground mb-0.5">{title}</Text>
          {description && <Text className="text-xs text-muted-foreground">{description}</Text>}
        </View>
        {badge && (
          <View className="bg-blue-100 px-2 py-1 rounded-full mr-2">
            <Text className="text-xs text-blue-600 font-medium">{badge}</Text>
          </View>
        )}
        <View className="i-mdi-chevron-right text-2xl text-muted-foreground flex-shrink-0" />
      </View>
    </View>
  )
}

export default function Profile() {
  const {user, logout} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const clearTenantContext = useTenantStore((state) => state.clearTenantContext)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [p, e] = await Promise.all([getCurrentUser(), getEmployeeByUserId(user.id)])
      setProfile(p)
      setEmployee(e)
    } catch (error) {
      console.error('加载用户数据失败:', error)
    }
  }, [user])

  useDidShow(() => {
    loadData()
  })

  // 刷新数据
  const handleRefresh = () => {
    Taro.showLoading({title: '刷新中...'})
    loadData().finally(() => {
      Taro.hideLoading()
      Taro.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    })
  }

  // 退出登录
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

  // 获取角色文本
  const getRoleText = (role: string) => {
    const roleMap: Record<string, string> = {
      super_admin: '超级管理员',
      tenant_admin: 'HR管理员',
      agent: 'Agent',
      store_manager: '店经理',
      employee: '员工',
      guest: '访客'
    }
    return roleMap[role] || '未知'
  }

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'tenant_admin'
  const isAgent = profile?.role === 'agent'

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        {/* 使用容器查询支持WEB端响应式 */}
        <View className="@container">
          <View className="p-4 max-w-7xl mx-auto">
            {/* 用户信息卡片 */}
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 border border-border">
              <View className="flex items-center gap-4">
                {/* 头像 */}
                <View className="w-20 h-20 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <View className="i-mdi-account text-5xl text-blue-600" />
                </View>

                {/* 用户信息 */}
                <View className="flex-1">
                  <Text className="text-xl max-sm:text-lg font-bold text-foreground mb-2">
                    {employee?.name || '未设置姓名'}
                  </Text>
                  <View className="flex items-center gap-2 mb-2">
                    <View className="bg-blue-100 px-3 py-1 rounded-full">
                      <Text className="text-xs text-foreground font-bold">
                        {getRoleText(profile?.role || 'employee')}
                      </Text>
                    </View>
                    {employee?.position && (
                      <View className="bg-blue-100 px-3 py-1 rounded-full">
                        <Text className="text-xs text-foreground font-bold">{employee.position}</Text>
                      </View>
                    )}
                  </View>
                  {currentTenant && (
                    <View className="flex items-center gap-1">
                      <View className="i-mdi-domain text-sm text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">{currentTenant.name}</Text>
                    </View>
                  )}
                </View>

                {/* 刷新按钮 */}
                <View
                  className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 active:opacity-80 transition-all cursor-pointer"
                  onClick={handleRefresh}>
                  <View className="i-mdi-refresh text-2xl text-gray-600" />
                </View>

                {/* 设置按钮 */}
                <View
                  className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 active:opacity-80 transition-all cursor-pointer"
                  onClick={() => Taro.navigateTo({url: '/pages/settings/index'})}>
                  <View className="i-mdi-cog text-2xl text-gray-600" />
                </View>
              </View>
            </View>

            {/* 管理功能 */}
            {isAdmin && (
              <View className="mb-4">
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
                  <View className="flex items-center gap-3 mb-4">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <View className="i-mdi-shield-crown text-2xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-foreground">管理功能</Text>
                      <Text className="text-xs text-muted-foreground">管理员专属功能</Text>
                    </View>
                  </View>

                  <ListItem
                    title="管理工作台"
                    description="查看系统概览和数据统计"
                    url="/packageD/pages/dashboard/index"
                    icon="i-mdi-view-dashboard"
                    iconBg="bg-blue-100"
                  />
                  <ListItem
                    title="快速开始"
                    description="新手引导和配置向导"
                    url="/pages/quick-start/index"
                    icon="i-mdi-rocket-launch"
                    iconBg="bg-green-500"
                    badge="推荐"
                  />
                  <ListItem
                    title="员工中心"
                    description="管理员工信息和权限"
                    url="/pages/employee-hub/index"
                    icon="i-mdi-account-group"
                    iconBg="bg-blue-100"
                  />
                  <ListItem
                    title="Agent管理"
                    description="管理区域经理和督导"
                    url="/packageF/pages/agent-management/index"
                    icon="i-mdi-account-supervisor"
                    iconBg="bg-purple-500"
                  />
                  <ListItem
                    title="配置中心"
                    description="系统配置和参数设置"
                    url="/packageD/pages/config-center/index"
                    icon="i-mdi-cog"
                    iconBg="bg-blue-100"
                  />
                </View>
              </View>
            )}

            {/* Agent功能 */}
            {isAgent && (
              <View className="mb-4">
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
                  <View className="flex items-center gap-3 mb-4">
                    <View className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <View className="i-mdi-account-supervisor text-2xl text-purple-600" />
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-foreground">Agent功能</Text>
                      <Text className="text-xs text-muted-foreground">区域经理专属功能</Text>
                    </View>
                  </View>

                  <ListItem
                    title="Agent工作台"
                    description="查看管理的门店和数据"
                    url="/pages/agent-workspace/index"
                    icon="i-mdi-view-dashboard"
                    iconBg="bg-purple-500"
                    badge="推荐"
                  />
                  <ListItem
                    title="我的门店"
                    description="查看分配给我的门店"
                    url="/pages/agent-workspace/index"
                    icon="i-mdi-store"
                    iconBg="bg-blue-100"
                  />
                </View>
              </View>
            )}

            {/* 常用功能 */}
            <View className="mb-4">
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
                <View className="flex items-center gap-3 mb-4">
                  <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <View className="i-mdi-apps text-2xl text-blue-600" />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-foreground">常用功能</Text>
                    <Text className="text-xs text-muted-foreground">快速访问常用功能</Text>
                  </View>
                </View>

                {/* 如果用户没有加入团队，显示加入团队入口 */}
                {!currentTenant && (
                  <ListItem
                    title="加入团队"
                    description="使用邀请码加入企业团队"
                    url="/packageE/pages/join-tenant/index"
                    icon="i-mdi-account-multiple-plus"
                    iconBg="bg-green-500"
                    badge="推荐"
                  />
                )}

                <ListItem
                  title="快速开始"
                  description="新手引导和功能介绍"
                  url="/pages/quick-start/index"
                  icon="i-mdi-rocket-launch"
                  iconBg="bg-green-500"
                />
                <ListItem
                  title="帮助中心"
                  description="查看使用帮助和常见问题"
                  url="/pages/help-center/index"
                  icon="i-mdi-help-circle"
                  iconBg="bg-blue-100"
                />
                <ListItem
                  title="关于我们"
                  description="了解应用信息和版本"
                  url="/pages/about/index"
                  icon="i-mdi-information"
                  iconBg="bg-gray-50"
                />
                {!isAdmin && (
                  <ListItem
                    title="配置中心"
                    description="需要管理员权限访问"
                    url="/packageD/pages/config-center/index"
                    icon="i-mdi-cog"
                    iconBg="bg-blue-100"
                    badge="需权限"
                  />
                )}
              </View>
            </View>

            {/* 退出登录 */}
            <View className="mb-20">
              <Button
                className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base active:opacity-90 transition-all cursor-pointer"
                size="default"
                onClick={handleLogout}>
                <View className="flex items-center justify-center gap-2">
                  <View className="i-mdi-logout text-xl text-foreground" />
                  <Text className="text-blue-600">退出登录</Text>
                </View>
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
