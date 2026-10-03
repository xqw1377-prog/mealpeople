/**
 * 通知管理 API
 */

import {supabase} from '@/client/supabase'
import type {CreateNotificationInput, Notification, NotificationStats} from './types-notification'

/**
 * 获取用户的通知列表
 */
export async function getNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const {data, error} = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false})
    .limit(limit)

  if (error) {
    console.error('获取通知列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取未读通知列表
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const {data, error} = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取未读通知失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取通知统计
 */
export async function getNotificationStats(userId: string): Promise<NotificationStats> {
  const {data, error} = await supabase.from('notifications').select('type, is_read').eq('user_id', userId)

  if (error) {
    console.error('获取通知统计失败:', error)
    return {
      total: 0,
      unread: 0,
      byType: {task: 0, training: 0, schedule: 0, system: 0, contract: 0}
    }
  }

  const notifications = Array.isArray(data) ? data : []
  const stats: NotificationStats = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.is_read).length,
    byType: {
      task: notifications.filter((n) => n.type === 'task').length,
      training: notifications.filter((n) => n.type === 'training').length,
      schedule: notifications.filter((n) => n.type === 'schedule').length,
      system: notifications.filter((n) => n.type === 'system').length,
      contract: notifications.filter((n) => n.type === 'contract').length
    }
  }

  return stats
}

/**
 * 标记通知为已读
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const {error} = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)

  if (error) {
    console.error('标记通知已读失败:', error)
    return false
  }

  return true
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const {error} = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('标记所有通知已读失败:', error)
    return false
  }

  return true
}

/**
 * 创建通知
 */
export async function createNotification(input: CreateNotificationInput): Promise<Notification | null> {
  const {data, error} = await supabase
    .from('notifications')
    .insert({
      tenant_id: input.tenant_id,
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      content: input.content,
      related_id: input.related_id,
      related_type: input.related_type
    })
    .select()
    .single()

  if (error) {
    console.error('创建通知失败:', error)
    return null
  }

  return data
}

/**
 * 批量创建通知
 */
export async function createNotifications(inputs: CreateNotificationInput[]): Promise<Notification[]> {
  const {data, error} = await supabase.from('notifications').insert(inputs).select()

  if (error) {
    console.error('批量创建通知失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 删除通知
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const {error} = await supabase.from('notifications').delete().eq('id', notificationId)

  if (error) {
    console.error('删除通知失败:', error)
    return false
  }

  return true
}

/**
 * 删除所有已读通知
 */
export async function deleteReadNotifications(userId: string): Promise<boolean> {
  const {error} = await supabase.from('notifications').delete().eq('user_id', userId).eq('is_read', true)

  if (error) {
    console.error('删除已读通知失败:', error)
    return false
  }

  return true
}
