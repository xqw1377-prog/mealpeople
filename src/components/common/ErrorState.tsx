/**
 * 通用错误状态组件
 * 用于展示错误信息和重试操作
 */

import {Button, Text, View} from '@tarojs/components'
import type React from 'react'

interface ErrorStateProps {
  /** 错误信息 */
  message?: string
  /** 详细描述 */
  description?: string
  /** 是否显示重试按钮 */
  showRetry?: boolean
  /** 重试按钮文本 */
  retryText?: string
  /** 重试回调 */
  onRetry?: () => void
}

const ErrorState: React.FC<ErrorStateProps> = ({
  message = '加载失败',
  description = '请检查网络连接后重试',
  showRetry = true,
  retryText = '重试',
  onRetry
}) => {
  return (
    <View className="flex flex-col items-center justify-center py-12 px-4">
      {/* 错误图标 */}
      <View className="i-mdi-alert-circle text-6xl text-red-400 mb-4" />

      {/* 错误信息 */}
      <Text className="text-base text-gray-800 mb-2 block font-semibold">{message}</Text>

      {/* 详细描述 */}
      {description && <Text className="text-sm text-gray-500 mb-4 block text-center">{description}</Text>}

      {/* 重试按钮 */}
      {showRetry && onRetry && (
        <Button
          className="bg-blue-100 text-white px-6 py-2 rounded-lg text-sm break-keep mt-2"
          size="mini"
          onClick={onRetry}>
          <View className="flex items-center gap-1">
            <View className="i-mdi-refresh text-base" />
            <Text>{retryText}</Text>
          </View>
        </Button>
      )}
    </View>
  )
}

export default ErrorState
