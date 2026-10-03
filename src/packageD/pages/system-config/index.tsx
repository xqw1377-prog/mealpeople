/**
 * 系统配置页面
 * 展示当前用户的模块权限和平台信息
 * 按照功能分类展示：工作效率、团队协同、HR管理、个人中心
 */

import {ScrollView, Text, View} from '@tarojs/components'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useMemo} from 'react'
import {getModulesByCategory, getUserModules, type UserRole} from '@/config/role-modules'
import {useTenantStore} from '@/store/tenant'
import {getCurrentPlatform, getPlatformName, isH5, isWeapp} from '@/utils/platform'

const SystemConfig: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentUser = useTenantStore((state) => state.currentUser)

  // 获取当前平台信息
  const platformInfo = useMemo(
    () => ({
      type: getCurrentPlatform(),
      name: getPlatformName(),
      isWeapp: isWeapp(),
      isH5: isH5()
    }),
    []
  )

  // 映射角色
  const userRole: UserRole = useMemo(() => {
    if (!currentUser) return 'employee'
    switch (currentUser.role) {
      case 'super_admin':
      case 'tenant_admin':
        return 'admin'
      case 'store_manager':
        return 'manager'
      default:
        return 'employee'
    }
  }, [currentUser])

  // 获取用户模块（按分类）
  const modulesByCategory = useMemo(() => {
    return getModulesByCategory(userRole, platformInfo.type)
  }, [userRole, platformInfo.type])

  // 获取当前平台可用模块
  const _currentPlatformModules = useMemo(() => {
    return getUserModules(userRole, platformInfo.type)
  }, [userRole, platformInfo.type])

  // 角色名称映射
  const getRoleName = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '管理员'
      case 'hr':
        return 'HR'
      case 'manager':
        return '管理者'
      case 'employee':
        return '员工'
      default:
        return '未知'
    }
  }

  // 分类信息
  const categoryInfo = {
    efficiency: {
      name: '工作效率',
      icon: 'i-mdi-lightning-bolt',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      description: '提升工作效率，快速完成任务'
    },
    collaboration: {
      name: '团队协同',
      icon: 'i-mdi-account-multiple',
      color: 'text-green-500',
      bgColor: 'bg-blue-100',
      description: '促进团队协作，互帮互助'
    },
    management: {
      name: 'HR管理',
      icon: 'i-mdi-briefcase',
      color: 'text-purple-500',
      bgColor: 'bg-blue-100',
      description: '人力资源管理功能'
    },
    personal: {
      name: '个人中心',
      icon: 'i-mdi-account-circle',
      color: 'text-orange-500',
      bgColor: 'bg-blue-100',
      description: '个人信息和成长'
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 平台信息 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-md">
            <Text className="text-base font-bold text-foreground mb-3">平台信息</Text>
            <View className="space-y-2">
              <View className="flex items-center justify-between py-2 border-b border-border">
                <Text className="text-sm text-muted-foreground">当前平台</Text>
                <View className="px-3 py-1 bg-blue-100 rounded-full">
                  <Text className="text-sm text-blue-600 font-medium">{platformInfo.name}</Text>
                </View>
              </View>
              <View className="flex items-center justify-between py-2 border-b border-border">
                <Text className="text-sm text-muted-foreground">运行环境</Text>
                <Text className="text-sm text-foreground">
                  {platformInfo.isWeapp ? '微信小程序' : platformInfo.isH5 ? 'H5浏览器' : '未知'}
                </Text>
              </View>
              <View className="flex items-center justify-between py-2">
                <Text className="text-sm text-muted-foreground">用户角色</Text>
                <View className="px-3 py-1 bg-accent/10 rounded-full">
                  <Text className="text-sm text-accent font-medium">{getRoleName(userRole)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 设计理念说明 */}
          <View className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 mb-4">
            <View className="flex items-start gap-2">
              <View className="i-mdi-lightbulb text-xl text-blue-600 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground mb-1">设计理念</Text>
                <Text className="text-xs text-muted-foreground leading-relaxed">
                  {platformInfo.type === 'mobile'
                    ? '移动端以工作效率、团队协同、便捷操作为主线，帮助您高效完成日常工作'
                    : 'WEB端以人力资源管理为主线，提供完整的HR管理功能'}
                </Text>
              </View>
            </View>
          </View>

          {/* 工作效率模块 */}
          {modulesByCategory.efficiency.length > 0 && (
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-md">
              <View className="flex items-center gap-2 mb-3">
                <View className={`${categoryInfo.efficiency.icon} text-xl ${categoryInfo.efficiency.color}`} />
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">{categoryInfo.efficiency.name}</Text>
                  <Text className="text-xs text-muted-foreground">{categoryInfo.efficiency.description}</Text>
                </View>
                <View className={`px-2 py-1 ${categoryInfo.efficiency.bgColor} rounded`}>
                  <Text className={`text-xs ${categoryInfo.efficiency.color}`}>
                    {modulesByCategory.efficiency.length}个
                  </Text>
                </View>
              </View>
              <View className="space-y-2">
                {modulesByCategory.efficiency.map((module) => (
                  <View key={module.id} className="bg-gray-50 rounded-lg p-3">
                    <View className="flex items-center gap-2 mb-1">
                      <View className={`${module.icon} text-lg ${categoryInfo.efficiency.color}`} />
                      <Text className="text-sm font-medium text-foreground">{module.name}</Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">{module.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 团队协同模块 */}
          {modulesByCategory.collaboration.length > 0 && (
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-md">
              <View className="flex items-center gap-2 mb-3">
                <View className={`${categoryInfo.collaboration.icon} text-xl ${categoryInfo.collaboration.color}`} />
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">{categoryInfo.collaboration.name}</Text>
                  <Text className="text-xs text-muted-foreground">{categoryInfo.collaboration.description}</Text>
                </View>
                <View className={`px-2 py-1 ${categoryInfo.collaboration.bgColor} rounded`}>
                  <Text className={`text-xs ${categoryInfo.collaboration.color}`}>
                    {modulesByCategory.collaboration.length}个
                  </Text>
                </View>
              </View>
              <View className="space-y-2">
                {modulesByCategory.collaboration.map((module) => (
                  <View key={module.id} className="bg-gray-50 rounded-lg p-3">
                    <View className="flex items-center gap-2 mb-1">
                      <View className={`${module.icon} text-lg ${categoryInfo.collaboration.color}`} />
                      <Text className="text-sm font-medium text-foreground">{module.name}</Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">{module.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* HR管理模块 */}
          {modulesByCategory.management.length > 0 && (
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-md">
              <View className="flex items-center gap-2 mb-3">
                <View className={`${categoryInfo.management.icon} text-xl ${categoryInfo.management.color}`} />
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">{categoryInfo.management.name}</Text>
                  <Text className="text-xs text-muted-foreground">{categoryInfo.management.description}</Text>
                </View>
                <View className={`px-2 py-1 ${categoryInfo.management.bgColor} rounded`}>
                  <Text className={`text-xs ${categoryInfo.management.color}`}>
                    {modulesByCategory.management.length}个
                  </Text>
                </View>
              </View>
              {platformInfo.type === 'mobile' && (
                <View className="bg-accent/5 rounded-lg p-3 mb-3">
                  <View className="flex items-start gap-2">
                    <View className="i-mdi-information text-lg text-accent mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-xs text-accent">这些模块需要在WEB端（电脑浏览器）访问，移动端暂不支持</Text>
                    </View>
                  </View>
                </View>
              )}
              <View className="space-y-2">
                {modulesByCategory.management.map((module) => (
                  <View key={module.id} className="bg-gray-50 rounded-lg p-3">
                    <View className="flex items-center gap-2 mb-1">
                      <View className={`${module.icon} text-lg ${categoryInfo.management.color}`} />
                      <Text className="text-sm font-medium text-foreground">{module.name}</Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">{module.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 个人中心模块 */}
          {modulesByCategory.personal.length > 0 && (
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-md">
              <View className="flex items-center gap-2 mb-3">
                <View className={`${categoryInfo.personal.icon} text-xl ${categoryInfo.personal.color}`} />
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">{categoryInfo.personal.name}</Text>
                  <Text className="text-xs text-muted-foreground">{categoryInfo.personal.description}</Text>
                </View>
                <View className={`px-2 py-1 ${categoryInfo.personal.bgColor} rounded`}>
                  <Text className={`text-xs ${categoryInfo.personal.color}`}>
                    {modulesByCategory.personal.length}个
                  </Text>
                </View>
              </View>
              <View className="space-y-2">
                {modulesByCategory.personal.map((module) => (
                  <View key={module.id} className="bg-gray-50 rounded-lg p-3">
                    <View className="flex items-center gap-2 mb-1">
                      <View className={`${module.icon} text-lg ${categoryInfo.personal.color}`} />
                      <Text className="text-sm font-medium text-foreground">{module.name}</Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">{module.description}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 底部占位 */}
          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  )
}

export default SystemConfig
