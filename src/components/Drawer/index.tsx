/**
 * 底部抽屉组件
 * 用于显示添加记录、记录详情等内容
 */

import {ScrollView, Text, View} from '@tarojs/components'
import type React from 'react'
import {useEffect, useState} from 'react'

export interface DrawerProps {
  /** 是否显示抽屉 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 标题 */
  title: string
  /** 高度 */
  height?: string
  /** 子元素 */
  children: React.ReactNode
  /** 是否显示关闭按钮 */
  showClose?: boolean
}

export const Drawer: React.FC<DrawerProps> = ({
  visible,
  onClose,
  title,
  height = '80vh',
  children,
  showClose = true
}) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (visible) {
      setShouldRender(true)
      // 延迟一帧，确保DOM已渲染
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      // 等待动画结束后再卸载
      setTimeout(() => setShouldRender(false), 300)
    }
  }, [visible])

  if (!shouldRender) return null

  return (
    <>
      {/* 遮罩层 */}
      <View
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
          isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />

      {/* 抽屉内容 */}
      <View
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 transition-transform duration-300 ${
          isAnimating ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{height, maxHeight: '90vh'}}
        onClick={(e) => e.stopPropagation()}>
        {/* 顶部拖动条 */}
        <View className="flex justify-center py-3">
          <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </View>

        {/* 头部 */}
        <View className="flex items-center justify-between px-5 pb-4 border-b border-gray-100">
          <Text className="text-lg font-bold text-foreground">{title}</Text>
          {showClose && (
            <View
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:scale-90 transition-all"
              onClick={onClose}>
              <View className="i-mdi-close text-xl text-gray-600" />
            </View>
          )}
        </View>

        {/* 内容区域 */}
        <ScrollView scrollY className="flex-1" style={{height: `calc(${height} - 80px)`}}>
          {children}
        </ScrollView>
      </View>
    </>
  )
}

export default Drawer
