/**
 * 通知系统类型定义
 */

/**
 * 通知类型
 */
export type NotificationType = 'task' | 'training' | 'schedule' | 'system' | 'contract'

/**
 * 通知对象
 */
export interface Notification {
  id: string
  tenant_id: string
  user_id: string
  type: NotificationType
  title: string
  content: string
  related_id?: string
  related_type?: string
  is_read: boolean
  read_at?: string
  created_at: string
}

/**
 * 创建通知的输入参数
 */
export interface CreateNotificationInput {
  tenant_id: string
  user_id: string
  type: NotificationType
  title: string
  content: string
  related_id?: string
  related_type?: string
}

/**
 * 通知统计
 */
export interface NotificationStats {
  total: number
  unread: number
  byType: {
    task: number
    training: number
    schedule: number
    system: number
    contract: number
  }
}
