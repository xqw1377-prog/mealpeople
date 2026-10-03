/**
 * 通用空状态组件
 * 用于展示无数据状态
 */

import {Button, Text, View} from '@tarojs/components'
import type React from 'react'

interface EmptyProps {
  /** 图标类名 */
  icon?: string
  /** 提示文本 */
  text?: string
  /** 描述文本 */
  description?: string
  /** 按钮文本 */
  buttonText?: string
  /** 按钮点击事件 */
  onButtonClick?: () => void
}

const Empty: React.FC<EmptyProps> = ({
  icon = 'i-mdi-inbox',
  text = '暂无数据',
  description,
  buttonText,
  onButtonClick
}) => {
  return (
    <View className="flex flex-col items-center justify-center py-12 px-4">
      {/* 图标 */}
      <View className={`${icon} text-6xl text-gray-300 mb-4`} />

      {/* 提示文本 */}
      <Text className="text-base text-gray-600 mb-2 block">{text}</Text>

      {/* 描述文本 */}
      {description && <Text className="text-sm text-gray-400 mb-4 block text-center">{description}</Text>}

      {/* 操作按钮 */}
      {buttonText && onButtonClick && (
        <Button
          className="bg-blue-100 text-white px-6 py-2 rounded-lg text-sm break-keep mt-2"
          size="mini"
          onClick={onButtonClick}>
          {buttonText}
        </Button>
      )}
    </View>
  )
}

export default Empty
