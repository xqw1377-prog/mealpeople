/**
 * 我的页面 - 重构版
 * 按照员工生命周期组织功能模块
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getCurrentUser, getEmployeeByUserId} from '@/db/api'
import type {Employee, Profile} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 菜单项组件
interface MenuItemProps {
  title: string
  url: string
  icon: string
  color?: string
  badge?: string | number
}

const MenuItem: React.FC<MenuItemProps> = ({title, url, icon, color = 'text-primary', badge}) => {
  return (
    <View className="bg-gray-50 rounded-lg p-3 flex items-center" onClick={() => Taro.navigateTo({url})}>
      <View className={`${icon} text-xl ${color} mr-3`} />
      <Text className="text-sm text-foreground flex-1">{title}</Text>
      {badge && (
        <View className="px-2 py-0.5 bg-blue-100 rounded-full mr-2">
          <Text className="text-xs text-blue-700">{badge}</Text>
        </View>
      )}
      <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
    </View>
  )
}

// 可折叠分组组件
interface CollapsibleSectionProps {
  title: string
  icon: string
  color: string
  badge?: string
  defaultCollapsed?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  color,
  badge,
  defaultCollapsed = false,
  children
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <View className="bg-card rounded-xl p-4 border-2 border-gray-200 shadow-sm">
      <View className="flex items-center justify-between" onClick={() => setCollapsed(!collapsed)}>
        <View className="flex items-center">
          <Text className="text-lg font-semibold text-foreground">
            {icon} {title}
          </Text>
          {badge && (
            <View className={`ml-2 px-2 py-1 ${color} rounded`}>
              <Text className="text-xs">{badge}</Text>
            </View>
          )}
        </View>
        <View className={`i-mdi-chevron-${collapsed ? 'down' : 'up'} text-xl text-muted-foreground`} />
      </View>

      {!collapsed && <View className="mt-4 space-y-2">{children}</View>}
    </View>
  )
}

export default function ProfileNew() {
  const {user, logout} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const _currentUser = useTenantStore((state) => state.currentUser)
  const clearTenantContext = useTenantStore((state) => state.clearTenantContext)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)

  // 加载用户数据
  const _loadData = useCallback(async () => {
    if (!user?.id) return

    try {
      const [p, e] = await Promise.all([getCurrentUser(), getEmployeeByUserId(user.id)])

      setProfile(p)
      setEmployee(e)

      // 检查入职状态
      if (e) {
        // TODO: 从数据库查询入职流程状态
        // const onboarding = await getOnboardingProcessByEmployeeId(e.id)
        // setOnboardingCompleted(onboarding?.status === 'completed')
        setOnboardingCompleted(false) // 临时设置为false，显示入职模块
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
    }
  }, [user])

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
      admin: '管理员',
      tenant_admin: 'HR管理员',
      store_manager: '店经理',
      user: '员工',
      guest: '访客'
    }
    return roleMap[role] || '未知'
  }

  // 判断是否是管理员
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'tenant_admin'

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 用户信息卡片 */}
          <View className="bg-card rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center">
              {/* 头像 */}
              <View className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <View className="i-mdi-account text-4xl text-primary" />
              </View>

              {/* 用户信息 */}
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground block">{employee?.name || '未设置姓名'}</Text>
                <View className="flex items-center mt-1">
                  <View className="px-2 py-0.5 bg-blue-100 rounded mr-2">
                    <Text className="text-xs text-primary">{getRoleText(profile?.role || 'user')}</Text>
                  </View>
                  {employee?.position && (
                    <View className="px-2 py-0.5 bg-secondary/10 rounded">
                      <Text className="text-xs text-secondary">{employee.position}</Text>
                    </View>
                  )}
                </View>
                {currentTenant && (
                  <Text className="text-xs text-muted-foreground mt-1 block">{currentTenant.name}</Text>
                )}
              </View>

              {/* 设置按钮 */}
              <View
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                onClick={() => Taro.navigateTo({url: '/pages/settings/index'})}>
                <View className="i-mdi-cog text-xl text-foreground" />
              </View>
            </View>
          </View>

          {/* 🔵 入职信息（可折叠） */}
          <CollapsibleSection
            title="入职信息"
            icon="🔵"
            color="bg-blue-100"
            badge={onboardingCompleted ? '已完成' : '进行中'}
            defaultCollapsed={onboardingCompleted}>
            <MenuItem
              title="我的入职流程"
              url="/pages/my-onboarding/index"
              icon="i-mdi-clipboard-list"
              color="text-blue-500"
            />
            <MenuItem
              title="入职任务清单"
              url="/pages/onboarding-tasks/index"
              icon="i-mdi-checkbox-marked-circle"
              color="text-blue-500"
            />
            <MenuItem
              title="入职资料"
              url="/pages/onboarding-documents/index"
              icon="i-mdi-file-document"
              color="text-blue-500"
            />
          </CollapsibleSection>

          {/* 📊 在职管理（始终展开） */}
          <View className="bg-card rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">📊 在职管理</Text>
            </View>
            <View className="space-y-2">
              <MenuItem
                title="我的考勤"
                url="/pages/attendance/index"
                icon="i-mdi-clock-outline"
                color="text-blue-500"
              />
              <MenuItem
                title="我的请假"
                url="/pages/my-leave/index"
                icon="i-mdi-calendar-remove"
                color="text-orange-500"
              />
              <MenuItem title="我的加班" url="/pages/my-overtime/index" icon="i-mdi-clock-plus" color="text-red-500" />
              <MenuItem
                title="我的绩效"
                url="/pages/my-performance/index"
                icon="i-mdi-chart-line"
                color="text-green-500"
              />
              <MenuItem
                title="我的薪酬"
                url="/pages/my-salary/index"
                icon="i-mdi-currency-usd"
                color="text-yellow-500"
              />
              <MenuItem
                title="我的晋升"
                url="/pages/my-promotion/index"
                icon="i-mdi-trending-up"
                color="text-purple-500"
              />
              <MenuItem
                title="我的调岗"
                url="/pages/my-transfer/index"
                icon="i-mdi-swap-horizontal"
                color="text-indigo-500"
              />
            </View>
          </View>

          {/* 🔴 离职申请（简化） */}
          <View className="bg-card rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">🔴 离职申请</Text>
            </View>
            <MenuItem
              title="提交离职申请"
              url="/pages/resignation-apply/index"
              icon="i-mdi-exit-to-app"
              color="text-red-500"
            />
          </View>

          {/* 管理功能（仅管理员可见） */}
          {isAdmin && (
            <View className="bg-card rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <View className="flex items-center mb-4">
                <Text className="text-lg font-semibold text-foreground">⚙️ 管理功能</Text>
              </View>
              <View className="space-y-2">
                <MenuItem
                  title="管理工作台"
                  url="/pages/dashboard/index"
                  icon="i-mdi-view-dashboard"
                  color="text-primary"
                />
                <MenuItem
                  title="员工中心"
                  url="/pages/employee-hub/index"
                  icon="i-mdi-account-group"
                  color="text-green-500"
                />
                <MenuItem
                  title="配置中心"
                  url="/packageD/pages/config-center/index"
                  icon="i-mdi-cog"
                  color="text-gray-500"
                />
              </View>
            </View>
          )}

          {/* 其他功能 */}
          <View className="bg-card rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">其他</Text>
            </View>
            <View className="space-y-2">
              <MenuItem
                title="帮助中心"
                url="/pages/help-center/index"
                icon="i-mdi-help-circle"
                color="text-blue-500"
              />
              <MenuItem title="关于我们" url="/pages/about/index" icon="i-mdi-information" color="text-gray-500" />
              <MenuItem title="调试工具" url="/pages/debug-onboarding/index" icon="i-mdi-bug" color="text-orange-500" />
            </View>
          </View>

          {/* 退出登录 */}
          <View className="mb-20">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded break-keep text-base"
              size="default"
              onClick={handleLogout}>
              退出登录
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
