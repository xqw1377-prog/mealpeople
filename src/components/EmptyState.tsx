/**
 * 空状态组件
 * 用于显示无数据时的友好提示
 */

import {Button, Text, View} from '@tarojs/components'
import type React from 'react'

interface EmptyStateProps {
  icon?: string
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'i-mdi-inbox',
  title = '暂无数据',
  description = '当前没有任何内容',
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <View className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* 图标 */}
      <View className={`${icon} text-6xl text-muted-foreground mb-4`} />

      {/* 标题 */}
      <Text className="text-lg font-semibold text-foreground mb-2">{title}</Text>

      {/* 描述 */}
      <Text className="text-sm text-muted-foreground text-center mb-6">{description}</Text>

      {/* 操作按钮 */}
      {actionText && onAction && (
        <Button
          className="bg-blue-100 text-primary-foreground px-6 py-2 rounded-lg break-keep text-sm"
          size="default"
          onClick={onAction}>
          {actionText}
        </Button>
      )}
    </View>
  )
}

// 预设的空状态组件

// 无任务
export const EmptyTasks: React.FC<{onAction?: () => void}> = ({onAction}) => {
  return (
    <EmptyState
      icon="i-mdi-clipboard-check-outline"
      title="暂无任务"
      description="当前没有任何任务，开始创建第一个任务吧"
      actionText={onAction ? '创建任务' : undefined}
      onAction={onAction}
    />
  )
}

// 无培训课程
export const EmptyTraining: React.FC<{onAction?: () => void}> = ({onAction}) => {
  return (
    <EmptyState
      icon="i-mdi-school-outline"
      title="暂无培训课程"
      description="当前没有任何培训课程，开始创建第一个课程吧"
      actionText={onAction ? '创建课程' : undefined}
      onAction={onAction}
    />
  )
}

// 无员工
export const EmptyEmployees: React.FC<{onAction?: () => void}> = ({onAction}) => {
  return (
    <EmptyState
      icon="i-mdi-account-group-outline"
      title="暂无员工"
      description="当前没有任何员工，开始添加第一个员工吧"
      actionText={onAction ? '添加员工' : undefined}
      onAction={onAction}
    />
  )
}

// 无通知
export const EmptyNotifications: React.FC = () => {
  return <EmptyState icon="i-mdi-bell-outline" title="暂无通知" description="当前没有任何通知消息" />
}

// 无搜索结果
export const EmptySearchResults: React.FC<{keyword?: string}> = ({keyword}) => {
  return (
    <EmptyState
      icon="i-mdi-magnify"
      title="未找到结果"
      description={keyword ? `没有找到与"${keyword}"相关的内容` : '没有找到相关内容'}
    />
  )
}

// 无数据
export const EmptyData: React.FC = () => {
  return <EmptyState icon="i-mdi-database-outline" title="暂无数据" description="当前没有任何数据记录" />
}
