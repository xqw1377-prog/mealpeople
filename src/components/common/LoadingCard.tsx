/**
 * 加载卡片组件
 * 用于显示数据加载中的骨架屏效果
 */

import {View} from '@tarojs/components'
import type React from 'react'

export const LoadingCard: React.FC = () => {
  return (
    <View className="bg-card rounded-lg p-6 border-2 border-gray-200 shadow-sm animate-pulse">
      <View className="h-6 bg-muted rounded w-1/3 mb-4" />
      <View className="h-4 bg-muted rounded w-full mb-2" />
      <View className="h-4 bg-muted rounded w-2/3" />
    </View>
  )
}

/**
 * 加载卡片列表组件
 * 显示多个加载卡片
 */
interface LoadingCardsProps {
  count?: number
}

export const LoadingCards: React.FC<LoadingCardsProps> = ({count = 3}) => {
  return (
    <>
      {Array.from({length: count}).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </>
  )
}

/**
 * 加载统计卡片组件
 * 用于统计数据加载中的骨架屏
 */
export const LoadingStatCard: React.FC = () => {
  return (
    <View className="bg-card rounded-lg p-6 border-2 border-gray-200 shadow-sm animate-pulse">
      <View className="flex items-center mb-4">
        <View className="w-8 h-8 bg-muted rounded-full mr-2" />
        <View className="h-5 bg-muted rounded w-1/4" />
      </View>
      <View className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <View key={i} className="text-center p-4 bg-muted rounded-lg">
            <View className="h-8 bg-card rounded w-2/3 mx-auto mb-2" />
            <View className="h-3 bg-card rounded w-full" />
          </View>
        ))}
      </View>
    </View>
  )
}

/**
 * 加载列表项组件
 * 用于列表项加载中的骨架屏
 */
export const LoadingListItem: React.FC = () => {
  return (
    <View className="bg-card rounded-xl p-4 border-2 border-gray-200 shadow-sm animate-pulse">
      <View className="flex items-center justify-between mb-3">
        <View className="h-5 bg-muted rounded w-1/3" />
        <View className="h-4 bg-muted rounded w-16" />
      </View>
      <View className="h-4 bg-muted rounded w-full mb-2" />
      <View className="h-4 bg-muted rounded w-2/3" />
    </View>
  )
}

/**
 * 加载列表组件
 * 显示多个加载列表项
 */
interface LoadingListProps {
  count?: number
}

export const LoadingList: React.FC<LoadingListProps> = ({count = 5}) => {
  return (
    <View className="space-y-3">
      {Array.from({length: count}).map((_, index) => (
        <LoadingListItem key={index} />
      ))}
    </View>
  )
}
