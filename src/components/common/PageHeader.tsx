/**
 * 页面头部组件
 * 统一的页面标题和返回按钮样式
 */

import {Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type React from 'react'

interface PageHeaderProps {
  /** 图标类名 */
  icon: string
  /** 标题 */
  title: string
  /** 描述文字 */
  description?: string
  /** 返回回调，如果不提供则使用默认的navigateBack */
  onBack?: () => void
  /** 是否显示返回按钮，默认为true */
  showBack?: boolean
  /** 右侧操作按钮 */
  rightAction?: {
    icon: string
    onClick: () => void
  }
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  description,
  onBack,
  showBack = true,
  rightAction
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      Taro.navigateBack()
    }
  }

  return (
    <View className="bg-card rounded-lg p-6 border-2 border-gray-200 shadow-sm">
      <View className="flex items-center justify-between mb-4">
        {/* 左侧：图标和标题 */}
        <View className="flex items-center flex-1">
          <View className={`${icon} text-3xl text-primary mr-3`} />
          <Text className="text-2xl font-bold text-foreground">{title}</Text>
        </View>

        {/* 右侧：操作按钮 */}
        <View className="flex items-center gap-2">
          {rightAction && (
            <View className="bg-muted p-2 rounded-lg active:opacity-70" onClick={rightAction.onClick}>
              <View className={`${rightAction.icon} text-xl text-foreground`} />
            </View>
          )}

          {showBack && (
            <View className="bg-muted p-2 rounded-lg active:opacity-70" onClick={handleBack}>
              <View className="i-mdi-arrow-left text-xl text-foreground" />
            </View>
          )}
        </View>
      </View>

      {/* 描述文字 */}
      {description && <Text className="text-sm text-muted-foreground block">{description}</Text>}
    </View>
  )
}

/**
 * 简单页面头部组件
 * 只包含标题和返回按钮
 */
interface SimplePageHeaderProps {
  title: string
  onBack?: () => void
  showBack?: boolean
}

export const SimplePageHeader: React.FC<SimplePageHeaderProps> = ({title, onBack, showBack = true}) => {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      Taro.navigateBack()
    }
  }

  return (
    <View className="bg-card rounded-lg p-4 border-2 border-gray-200 shadow-sm">
      <View className="flex items-center justify-between">
        <Text className="text-xl font-bold text-foreground">{title}</Text>
        {showBack && (
          <View className="bg-muted p-2 rounded-lg active:opacity-70" onClick={handleBack}>
            <View className="i-mdi-arrow-left text-xl text-foreground" />
          </View>
        )}
      </View>
    </View>
  )
}
