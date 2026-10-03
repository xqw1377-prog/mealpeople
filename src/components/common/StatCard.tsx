/**
 * 统计卡片组件
 * 用于显示统计数据
 */

import {Text, View} from '@tarojs/components'
import type React from 'react'

interface StatCardProps {
  /** 图标类名 */
  icon: string
  /** 标题 */
  title: string
  /** 数值 */
  value: string | number
  /** 单位 */
  unit?: string
  /** 变化趋势 */
  trend?: {
    value: string | number
    isUp: boolean
  }
  /** 背景颜色类名 */
  bgColor?: string
  /** 文字颜色类名 */
  textColor?: string
  /** 点击回调 */
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  unit,
  trend,
  bgColor = 'bg-green-500-50',
  textColor = 'text-primary',
  onClick
}) => {
  return (
    <View className={`${bgColor} rounded-xl p-4 ${onClick ? 'active:opacity-70' : ''}`} onClick={onClick}>
      {/* 图标和标题 */}
      <View className="flex items-center mb-3">
        <View className={`${icon} text-xl ${textColor} mr-2`} />
        <Text className={`text-sm ${textColor} font-medium`}>{title}</Text>
      </View>

      {/* 数值 */}
      <View className="flex items-baseline">
        <Text className={`text-3xl font-bold ${textColor}`}>{value}</Text>
        {unit && <Text className={`text-sm ${textColor} ml-1`}>{unit}</Text>}
      </View>

      {/* 趋势 */}
      {trend && (
        <View className="flex items-center mt-2">
          <View
            className={`${trend.isUp ? 'i-mdi-trending-up' : 'i-mdi-trending-down'} text-sm ${
              trend.isUp ? 'text-muted-foreground' : 'text-red-600'
            } mr-1`}
          />
          <Text className={`text-xs ${trend.isUp ? 'text-muted-foreground' : 'text-red-600'}`}>{trend.value}</Text>
        </View>
      )}
    </View>
  )
}

/**
 * 统计卡片网格组件
 * 用于显示多个统计卡片
 */
interface StatCardsGridProps {
  stats: Array<{
    icon: string
    title: string
    value: string | number
    unit?: string
    bgColor?: string
    textColor?: string
    onClick?: () => void
  }>
  columns?: 2 | 3 | 4
}

export const StatCardsGrid: React.FC<StatCardsGridProps> = ({stats, columns = 3}) => {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  }[columns]

  return (
    <View className={`grid ${gridClass} gap-3`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </View>
  )
}

/**
 * 简单统计卡片组件
 * 更简洁的统计卡片样式
 */
interface SimpleStatCardProps {
  label: string
  value: string | number
  color?: string
}

export const SimpleStatCard: React.FC<SimpleStatCardProps> = ({label, value, color = 'text-primary'}) => {
  return (
    <View className="text-center p-4 bg-muted rounded-lg">
      <Text className={`text-3xl font-bold ${color} block mb-1`}>{value}</Text>
      <Text className="text-xs text-muted-foreground block">{label}</Text>
    </View>
  )
}
