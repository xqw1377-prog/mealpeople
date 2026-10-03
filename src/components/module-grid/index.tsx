/**
 * 模块网格组件
 * 根据用户角色和平台显示可访问的功能模块
 */

import {Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type React from 'react'
import type {ModuleConfig} from '@/config/role-modules'

interface ModuleGridProps {
  modules: ModuleConfig[]
  columns?: 2 | 3 | 4
  title?: string
}

const ModuleGrid: React.FC<ModuleGridProps> = ({modules, columns = 2, title}) => {
  // 处理模块点击
  const handleModuleClick = (module: ModuleConfig) => {
    // 检查是否为TabBar页面
    const tabBarPages = [
      '/packageA/pages/employee-workspace/index',
      '/pages/work-logs/index',
      '/pages/my-growth/index',
      '/pages/profile/index'
    ]

    if (tabBarPages.includes(module.path)) {
      Taro.switchTab({url: module.path})
    } else {
      Taro.navigateTo({url: module.path})
    }
  }

  // 获取平台标签
  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'mobile':
        return {text: '移动端', color: 'bg-blue-100 text-primary'}
      case 'web':
        return {text: 'WEB端', color: 'bg-accent/10 text-accent'}
      case 'both':
        return {text: '双平台', color: 'bg-secondary/10 text-secondary'}
      default:
        return {text: '未知', color: 'bg-muted text-muted-foreground'}
    }
  }

  if (modules.length === 0) {
    return null
  }

  return (
    <View className="space-y-3">
      {title && <Text className="text-sm font-semibold text-foreground px-2">{title}</Text>}
      <View className="bg-card rounded-lg p-4 border-2 border-gray-200 shadow-sm">
        <View className={`grid grid-cols-${columns} gap-3`}>
          {modules.map((module) => {
            const platformBadge = getPlatformBadge(module.platform)
            return (
              <View
                key={module.id}
                className="bg-gray-50 rounded-lg p-4 flex flex-col items-center relative"
                onClick={() => handleModuleClick(module)}>
                {/* 平台标签 */}
                <View className={`absolute top-1 right-1 px-2 py-0.5 rounded ${platformBadge.color}`}>
                  <Text className="text-xs">{platformBadge.text}</Text>
                </View>

                {/* 图标 */}
                <View className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                  <View className={`${module.icon} text-2xl text-primary`} />
                </View>

                {/* 名称 */}
                <Text className="text-sm text-foreground font-medium text-center">{module.name}</Text>

                {/* 描述 */}
                {module.description && (
                  <Text className="text-xs text-muted-foreground text-center mt-1 line-clamp-2">
                    {module.description}
                  </Text>
                )}
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

export default ModuleGrid
