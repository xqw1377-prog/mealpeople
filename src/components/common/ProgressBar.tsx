/**
 * 进度条组件
 * 用于显示进度信息
 */

import {Text, View} from '@tarojs/components'
import type React from 'react'

interface ProgressBarProps {
  /** 当前进度（0-100） */
  progress: number
  /** 是否显示百分比文字 */
  showPercentage?: boolean
  /** 进度条高度 */
  height?: 'sm' | 'md' | 'lg'
  /** 进度条颜色 */
  color?: string
  /** 背景颜色 */
  bgColor?: string
  /** 是否显示动画 */
  animated?: boolean
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = true,
  height = 'md',
  color = 'bg-blue-100',
  bgColor = 'bg-muted',
  animated = true
}) => {
  const heightClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }[height]

  const safeProgress = Math.min(100, Math.max(0, progress))

  return (
    <View className="w-full">
      {/* 进度条 */}
      <View className={`${bgColor} rounded-full overflow-hidden ${heightClass}`}>
        <View
          className={`${color} h-full rounded-full ${animated ? 'transition-all duration-300' : ''}`}
          style={{width: `${safeProgress}%`}}
        />
      </View>

      {/* 百分比文字 */}
      {showPercentage && <Text className="text-xs text-muted-foreground mt-1 block text-right">{safeProgress}%</Text>}
    </View>
  )
}

/**
 * 带标签的进度条组件
 */
interface LabeledProgressBarProps {
  /** 标签 */
  label: string
  /** 当前进度（0-100） */
  progress: number
  /** 进度条颜色 */
  color?: string
  /** 是否显示百分比 */
  showPercentage?: boolean
}

export const LabeledProgressBar: React.FC<LabeledProgressBarProps> = ({
  label,
  progress,
  color = 'bg-blue-100',
  showPercentage = true
}) => {
  const safeProgress = Math.min(100, Math.max(0, progress))

  return (
    <View className="w-full">
      {/* 标签和百分比 */}
      <View className="flex items-center justify-between mb-2">
        <Text className="text-sm text-foreground font-medium">{label}</Text>
        {showPercentage && <Text className="text-sm text-muted-foreground">{safeProgress}%</Text>}
      </View>

      {/* 进度条 */}
      <View className="bg-muted rounded-full overflow-hidden h-2">
        <View
          className={`${color} h-full rounded-full transition-all duration-300`}
          style={{width: `${safeProgress}%`}}
        />
      </View>
    </View>
  )
}

/**
 * 圆形进度条组件
 */
interface CircularProgressProps {
  /** 当前进度（0-100） */
  progress: number
  /** 大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 进度条颜色 */
  color?: string
  /** 是否显示百分比 */
  showPercentage?: boolean
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 'md',
  color = 'text-primary',
  showPercentage = true
}) => {
  const sizeClass = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }[size]

  const textSizeClass = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  }[size]

  const safeProgress = Math.min(100, Math.max(0, progress))

  return (
    <View className={`${sizeClass} relative flex items-center justify-center`}>
      {/* 背景圆环 */}
      <View className="absolute inset-0 rounded-full border-4 border-muted" />

      {/* 进度圆环 */}
      <View
        className={`absolute inset-0 rounded-full border-4 ${color} border-t-transparent border-r-transparent`}
        style={{
          transform: `rotate(${(safeProgress / 100) * 360}deg)`,
          transition: 'transform 0.3s ease'
        }}
      />

      {/* 百分比文字 */}
      {showPercentage && <Text className={`${textSizeClass} font-bold ${color}`}>{safeProgress}%</Text>}
    </View>
  )
}

/**
 * 步骤进度条组件
 */
interface StepProgressProps {
  /** 当前步骤（从0开始） */
  currentStep: number
  /** 总步骤数 */
  totalSteps: number
  /** 步骤标签 */
  labels?: string[]
}

export const StepProgress: React.FC<StepProgressProps> = ({currentStep, totalSteps, labels}) => {
  return (
    <View className="w-full">
      {/* 步骤指示器 */}
      <View className="flex items-center justify-between mb-2">
        {Array.from({length: totalSteps}).map((_, index) => (
          <View key={index} className="flex-1 flex items-center">
            {/* 步骤圆点 */}
            <View
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                index <= currentStep ? 'bg-blue-100' : 'bg-muted'
              }`}>
              <Text className={`text-sm font-bold ${index <= currentStep ? 'text-blue-900' : 'text-muted-foreground'}`}>
                {index + 1}
              </Text>
            </View>

            {/* 连接线 */}
            {index < totalSteps - 1 && (
              <View className={`flex-1 h-1 mx-2 ${index < currentStep ? 'bg-blue-100' : 'bg-muted'}`} />
            )}
          </View>
        ))}
      </View>

      {/* 步骤标签 */}
      {labels && labels.length === totalSteps && (
        <View className="flex items-center justify-between">
          {labels.map((label, index) => (
            <Text
              key={index}
              className={`text-xs ${index <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}
