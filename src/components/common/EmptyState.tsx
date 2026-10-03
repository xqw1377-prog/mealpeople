/**
 * 空状态组件
 * 用于显示无数据时的友好提示
 */

import {Text, View} from '@tarojs/components'
import type React from 'react'

interface EmptyStateProps {
  /** 图标类名，默认为 i-mdi-inbox */
  icon?: string
  /** 标题 */
  title: string
  /** 描述文字 */
  description?: string
  /** 操作按钮 */
  action?: {
    label: string
    onClick: () => void
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({icon = 'i-mdi-inbox', title, description, action}) => {
  return (
    <View className="text-center py-12 px-6">
      {/* 图标 */}
      <View className={`${icon} text-6xl text-muted-foreground mb-4 mx-auto`} />

      {/* 标题 */}
      <Text className="text-lg font-bold text-foreground mb-2 block">{title}</Text>

      {/* 描述 */}
      {description && <Text className="text-sm text-muted-foreground mb-6 block">{description}</Text>}

      {/* 操作按钮 */}
      {action && (
        <View className="flex justify-center">
          <View className="bg-green-500 px-6 py-2 rounded-lg active:opacity-70" onClick={action.onClick}>
            <Text className="text-white text-sm">{action.label}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

/**
 * 错误状态组件
 * 用于显示加载失败时的提示
 */
interface ErrorStateProps {
  /** 错误信息 */
  message?: string
  /** 重试回调 */
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({message = '加载失败，请重试', onRetry}) => {
  return (
    <View className="text-center py-12 px-6">
      {/* 错误图标 */}
      <View className="i-mdi-alert-circle text-6xl text-destructive mb-4 mx-auto" />

      {/* 错误信息 */}
      <Text className="text-lg font-bold text-foreground mb-2 block">{message}</Text>

      {/* 重试按钮 */}
      {onRetry && (
        <View className="flex justify-center mt-6">
          <View className="bg-green-500 px-6 py-2 rounded-lg active:opacity-70" onClick={onRetry}>
            <Text className="text-white text-sm">重试</Text>
          </View>
        </View>
      )}
    </View>
  )
}

/**
 * 无权限状态组件
 * 用于显示无权限访问时的提示
 */
interface NoPermissionStateProps {
  /** 提示信息 */
  message?: string
}

export const NoPermissionState: React.FC<NoPermissionStateProps> = ({message = '您没有权限访问此内容'}) => {
  return (
    <View className="text-center py-12 px-6">
      {/* 无权限图标 */}
      <View className="i-mdi-lock text-6xl text-muted-foreground mb-4 mx-auto" />

      {/* 提示信息 */}
      <Text className="text-lg font-bold text-foreground mb-2 block">{message}</Text>
      <Text className="text-sm text-muted-foreground block">请联系管理员获取访问权限</Text>
    </View>
  )
}
