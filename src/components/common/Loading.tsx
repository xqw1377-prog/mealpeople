/**
 * 通用加载组件
 * 提供统一的加载状态展示
 */

import {Text, View} from '@tarojs/components'
import type React from 'react'

interface LoadingProps {
  /** 加载提示文本 */
  text?: string
  /** 是否显示 */
  show?: boolean
  /** 尺寸：small | medium | large */
  size?: 'small' | 'medium' | 'large'
  /** 是否全屏 */
  fullscreen?: boolean
}

const Loading: React.FC<LoadingProps> = ({text = '加载中...', show = true, size = 'medium', fullscreen = false}) => {
  if (!show) return null

  // 根据尺寸设置图标大小
  const iconSize = {
    small: 'text-xl',
    medium: 'text-3xl',
    large: 'text-5xl'
  }[size]

  // 根据尺寸设置文本大小
  const textSize = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }[size]

  const content = (
    <View className="flex flex-col items-center justify-center gap-3">
      {/* 加载动画图标 */}
      <View className={`i-mdi-loading ${iconSize} text-primary animate-spin`} />
      {/* 加载文本 */}
      {text && <Text className={`${textSize} text-gray-600`}>{text}</Text>}
    </View>
  )

  // 全屏模式
  if (fullscreen) {
    return (
      <View
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{background: 'rgba(255, 255, 255, 0.9)'}}>
        {content}
      </View>
    )
  }

  // 普通模式
  return <View className="py-8">{content}</View>
}

export default Loading
