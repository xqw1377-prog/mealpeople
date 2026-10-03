/**
 * 骨架屏组件
 * 用于加载状态的占位显示
 */

import {View} from '@tarojs/components'
import type React from 'react'

interface SkeletonProps {
  width?: string
  height?: string
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  className = '',
  variant = 'rectangular'
}) => {
  const baseClass = 'animate-pulse bg-muted'

  const variantClass = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }[variant]

  return (
    <View
      className={`${baseClass} ${variantClass} ${className}`}
      style={{
        width,
        height
      }}
    />
  )
}

// 卡片骨架屏
export const SkeletonCard: React.FC = () => {
  return (
    <View className="bg-card p-4 rounded-lg shadow-sm mb-3">
      <View className="flex items-center mb-3">
        <Skeleton variant="circular" width="40px" height="40px" />
        <View className="ml-3 flex-1">
          <Skeleton width="60%" height="16px" className="mb-2" />
          <Skeleton width="40%" height="12px" />
        </View>
      </View>
      <Skeleton width="100%" height="14px" className="mb-2" />
      <Skeleton width="80%" height="14px" className="mb-2" />
      <View className="flex justify-between mt-3">
        <Skeleton width="30%" height="12px" />
        <Skeleton width="20%" height="12px" />
      </View>
    </View>
  )
}

// 列表骨架屏
export const SkeletonList: React.FC<{count?: number}> = ({count = 3}) => {
  return (
    <View>
      {Array.from({length: count}).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  )
}

// 统计卡片骨架屏
export const SkeletonStatCard: React.FC = () => {
  return (
    <View className="bg-card p-4 rounded-lg shadow-sm">
      <Skeleton width="50%" height="14px" className="mb-3" />
      <Skeleton width="40%" height="24px" className="mb-2" />
      <Skeleton width="60%" height="12px" />
    </View>
  )
}

// 表格骨架屏
export const SkeletonTable: React.FC<{rows?: number}> = ({rows = 5}) => {
  return (
    <View className="bg-card rounded-lg shadow-sm overflow-hidden">
      {/* 表头 */}
      <View className="flex p-3 border-b border-border">
        <Skeleton width="30%" height="14px" className="mr-2" />
        <Skeleton width="25%" height="14px" className="mr-2" />
        <Skeleton width="25%" height="14px" className="mr-2" />
        <Skeleton width="20%" height="14px" />
      </View>
      {/* 表格行 */}
      {Array.from({length: rows}).map((_, index) => (
        <View key={index} className="flex p-3 border-b border-border">
          <Skeleton width="30%" height="12px" className="mr-2" />
          <Skeleton width="25%" height="12px" className="mr-2" />
          <Skeleton width="25%" height="12px" className="mr-2" />
          <Skeleton width="20%" height="12px" />
        </View>
      ))}
    </View>
  )
}
