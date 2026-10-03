import {Button, ScrollView, Text, View} from '@tarojs/components'
import {navigateTo, showModal, switchTab} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useTenantStore} from '@/store/tenant'

const Profile: React.FC = () => {
  const {user, logout} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentUser = useTenantStore((state) => state.currentUser)
  const clearTenantContext = useTenantStore((state) => state.clearTenantContext)

  const handleLogout = () => {
    showModal({
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

  const getRoleText = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '超级管理员'
      case 'tenant_admin':
        return 'HR管理员'
      case 'store_manager':
        return '店经理'
      case 'employee':
        return '员工'
      default:
        return '未知'
    }
  }

  // 判断用户角色
  const isSuperAdmin = currentUser?.role === 'super_admin'
  const isHR = currentUser?.role === 'tenant_admin'
  const isManager = currentUser?.role === 'store_manager'
  const _isEmployee = currentUser?.role === 'employee'

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4 space-y-4">
          {/* 用户信息卡片 */}
          <View className="bg-card rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center gap-4 mb-4">
              <View className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <View className="i-mdi-account text-3xl text-primary" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground mb-1">{currentUser?.name || '未设置姓名'}</Text>
                <Text className="text-sm text-muted-foreground">
                  {currentUser?.phone || currentUser?.email || '未绑定联系方式'}
                </Text>
              </View>
            </View>

            <View className="pt-4 border-t border-border">
              <View className="flex items-center justify-between">
                <Text className="text-sm text-muted-foreground">角色权限</Text>
                <View className="px-3 py-1 bg-blue-100 rounded-full">
                  <Text className="text-xs text-primary font-medium">
                    {currentUser ? getRoleText(currentUser.role) : '未知'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 当前租户 */}
          {currentTenant && (
            <View className="bg-card rounded-lg p-4 border-2 border-gray-200 shadow-sm">
              <View className="flex items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground mb-1">当前租户</Text>
                  <Text className="text-base font-bold text-foreground">{currentTenant.name}</Text>
                </View>
                <View
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 rounded-full"
                  onClick={() => navigateTo({url: '/pages/tenant-select/index'})}>
                  <Text className="text-xs text-primary">切换</Text>
                  <View className="i-mdi-swap-horizontal text-sm text-primary" />
                </View>
              </View>
            </View>
          )}

          {/* HR管理功能（仅HR可见） */}
          {isHR && (
            <View className="space-y-3">
              <Text className="text-sm font-semibold text-foreground px-2">人力资源管理</Text>
              <View className="bg-card rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <View className="grid grid-cols-2 gap-3">
                  <View
                    className="bg-gray-50 rounded-lg p-4 flex flex-col items-center"
                    onClick={() => navigateTo({url: '/packageJ/pages/recruitment/index'})}>
                    <View className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                      <View className="i-mdi-account-search text-2xl text-primary" />
                    </View>
                    <Text className="text-sm text-foreground font-medium">招聘管理</Text>
                  </View>

                  <View
                    className="bg-gray-50 rounded-lg p-4 flex flex-col items-center"
                    onClick={() => navigateTo({url: '/packageH/pages/onboarding/index'})}>
                    <View className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-2">
                      <View className="i-mdi-account-plus text-2xl text-accent" />
                    </View>
                    <Text className="text-sm text-foreground font-medium">入职管理</Text>
                  </View>

                  <View
                    className="bg-gray-50 rounded-lg p-4 flex flex-col items-center"
                    onClick={() => navigateTo({url: '/pages/employee-hub/index'})}>
                    <View className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-2">
                      <View className="i-mdi-account-group text-2xl text-secondary" />
                    </View>
                    <Text className="text-sm text-foreground font-medium">员工档案</Text>
                  </View>

                  <View
                    className="bg-gray-50 rounded-lg p-4 flex flex-col items-center"
                    onClick={() => navigateTo({url: '/packageH/pages/resignation/index'})}>
                    <View className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mb-2">
                      <View className="i-mdi-account-remove text-2xl text-destructive" />
                    </View>
                    <Text className="text-sm text-foreground font-medium">离职管理</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 管理者功能（仅管理者可见） */}
          {isManager && (
            <View className="space-y-3">
              <Text className="text-sm font-semibold text-foreground px-2">团队管理</Text>
              <View className="bg-card rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <View className="grid grid-cols-2 gap-3">
                  <View
                    className="bg-gray-50 rounded-lg p-4 flex flex-col items-center"
                    onClick={() => navigateTo({url: '/packageA/pages/team-management/index'})}>
                    <View className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                      <View className="i-mdi-account-multiple text-2xl text-primary" />
                    </View>
                    <Text className="text-sm text-foreground font-medium">团队管理</Text>
                  </View>

                  <View
                    className="bg-gray-50 rounded-lg p-4 flex flex-col items-center"
                    onClick={() => navigateTo({url: '/packageB/pages/scheduling/index'})}>
                    <View className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-2">
                      <View className="i-mdi-calendar-clock text-2xl text-accent" />
                    </View>
                    <Text className="text-sm text-foreground font-medium">排班管理</Text>
                  </View>

                  <View
                    className="bg-gray-50 rounded-lg p-4 flex flex-col items-center"
                    onClick={() => navigateTo({url: '/packageB/pages/analytics/index'})}>
                    <View className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-2">
                      <View className="i-mdi-chart-bar text-2xl text-secondary" />
                    </View>
                    <Text className="text-sm text-foreground font-medium">数据分析</Text>
                  </View>

                  <View
                    className="bg-gray-50 rounded-lg p-4 flex flex-col items-center"
                    onClick={() => navigateTo({url: '/packageN/pages/task-create/index'})}>
                    <View className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                      <View className="i-mdi-plus-circle text-2xl text-primary" />
                    </View>
                    <Text className="text-sm text-foreground font-medium">分配任务</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 我的功能区（所有用户） */}
          <View className="space-y-3">
            <Text className="text-sm font-semibold text-foreground px-2">我的功能</Text>
            <View className="bg-card rounded-lg overflow-hidden shadow-sm">
              <View
                className="flex items-center justify-between p-4 border-b border-border"
                onClick={() => switchTab({url: '/pages/work-logs/index'})}>
                <View className="flex items-center gap-3">
                  <View className="i-mdi-notebook text-xl text-primary" />
                  <Text className="text-sm text-foreground">工作日志</Text>
                </View>
                <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
              </View>

              <View
                className="flex items-center justify-between p-4 border-b border-border"
                onClick={() => navigateTo({url: '/packageG/pages/work-log-ranking/index'})}>
                <View className="flex items-center gap-3">
                  <View className="i-mdi-trophy text-xl text-accent" />
                  <Text className="text-sm text-foreground">工作排行榜</Text>
                </View>
                <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
              </View>

              <View
                className="flex items-center justify-between p-4 border-b border-border"
                onClick={() => switchTab({url: '/pages/my-growth/index'})}>
                <View className="flex items-center gap-3">
                  <View className="i-mdi-chart-line text-xl text-secondary" />
                  <Text className="text-sm text-foreground">我的成长</Text>
                </View>
                <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
              </View>

              <View
                className="flex items-center justify-between p-4"
                onClick={() => navigateTo({url: '/pages/notifications/index'})}>
                <View className="flex items-center gap-3">
                  <View className="i-mdi-bell text-xl text-primary" />
                  <Text className="text-sm text-foreground">消息通知</Text>
                </View>
                <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
              </View>
            </View>
          </View>

          {/* 系统设置 */}
          <View className="space-y-3">
            <Text className="text-sm font-semibold text-foreground px-2">系统设置</Text>
            <View className="bg-card rounded-lg overflow-hidden shadow-sm">
              {isSuperAdmin && (
                <View
                  className="flex items-center justify-between p-4 border-b border-border"
                  onClick={() => navigateTo({url: '/packageE/pages/super-admin-tenants/index'})}>
                  <View className="flex items-center gap-3">
                    <View className="i-mdi-shield-account text-xl text-primary" />
                    <Text className="text-sm text-foreground">系统管理</Text>
                  </View>
                  <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
                </View>
              )}

              <View
                className="flex items-center justify-between p-4 border-b border-border"
                onClick={() => navigateTo({url: '/packageD/pages/system-config/index'})}>
                <View className="flex items-center gap-3">
                  <View className="i-mdi-cog text-xl text-primary" />
                  <Text className="text-sm text-foreground">系统配置</Text>
                </View>
                <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
              </View>

              <View
                className="flex items-center justify-between p-4 border-b border-border"
                onClick={() => navigateTo({url: '/packageD/pages/bind-wechat/index'})}>
                <View className="flex items-center gap-3">
                  <View className="i-mdi-wechat text-xl text-secondary" />
                  <Text className="text-sm text-foreground">绑定微信</Text>
                </View>
                <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
              </View>

              <View
                className="flex items-center justify-between p-4 border-b border-border"
                onClick={() => navigateTo({url: '/pages/user-agreement/index'})}>
                <View className="flex items-center gap-3">
                  <View className="i-mdi-file-document text-xl text-primary" />
                  <Text className="text-sm text-foreground">用户服务协议</Text>
                </View>
                <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
              </View>

              <View
                className="flex items-center justify-between p-4"
                onClick={() => navigateTo({url: '/pages/privacy-policy/index'})}>
                <View className="flex items-center gap-3">
                  <View className="i-mdi-shield-lock text-xl text-accent" />
                  <Text className="text-sm text-foreground">隐私政策</Text>
                </View>
                <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
              </View>
            </View>
          </View>

          {/* 退出登录 */}
          <View className="pb-4">
            <Button
              className="w-full bg-destructive text-white py-4 rounded-lg break-keep text-base"
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

export default Profile
