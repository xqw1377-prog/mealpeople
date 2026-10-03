import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {showModal, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {EmptyNotifications} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {
  deleteNotification,
  deleteReadNotifications,
  getNotificationStats,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead
} from '@/db/api-notification'
import type {Notification, NotificationStats} from '@/db/types-notification'

// 获取通知图标和颜色
function getNotificationStyle(type: string): {icon: string; color: string; bgColor: string} {
  switch (type) {
    case 'task':
      return {icon: 'i-mdi-clipboard-check', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    case 'training':
      return {icon: 'i-mdi-school', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    case 'schedule':
      return {icon: 'i-mdi-calendar-clock', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    case 'system':
      return {icon: 'i-mdi-bell', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    case 'contract':
      return {icon: 'i-mdi-file-document-edit', color: 'text-primary', bgColor: 'bg-primary/10'}
    default:
      return {icon: 'i-mdi-information', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }
}

// 格式化时间
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

const Notifications: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byType: {task: 0, training: 0, schedule: 0, system: 0, contract: 0}
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      return
    }

    setLoading(true)
    try {
      const [notificationsData, statsData] = await Promise.all([
        getNotifications(user.id),
        getNotificationStats(user.id)
      ])

      setNotifications(notificationsData)
      setStats(statsData)
    } catch (error) {
      console.error('加载通知失败:', error)
      showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadNotifications()
  })

  // 下拉刷新处理
  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await loadNotifications()
      setTimeout(() => {
        setRefreshing(false)
        showToast({title: '刷新成功', icon: 'success', duration: 1500})
      }, 500)
    } catch (_error) {
      setRefreshing(false)
      showToast({title: '刷新失败', icon: 'error'})
    }
  }

  // 标记为已读
  const handleMarkAsRead = useCallback(async (id: string) => {
    const success = await markNotificationAsRead(id)
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? {...n, is_read: true, read_at: new Date().toISOString()} : n))
      )
      setStats((prev) => ({...prev, unread: Math.max(0, prev.unread - 1)}))
      showToast({title: '已标记为已读', icon: 'success', duration: 1500})
    } else {
      showToast({title: '操作失败', icon: 'none'})
    }
  }, [])

  // 删除通知
  const handleDelete = useCallback(async (id: string) => {
    showModal({
      title: '确认删除',
      content: '确定要删除这条通知吗？',
      success: async (res) => {
        if (res.confirm) {
          const success = await deleteNotification(id)
          if (success) {
            setNotifications((prev) => prev.filter((n) => n.id !== id))
            setStats((prev) => ({
              ...prev,
              total: Math.max(0, prev.total - 1)
            }))
            showToast({title: '已删除', icon: 'success', duration: 1500})
          } else {
            showToast({title: '删除失败', icon: 'none'})
          }
        }
      }
    })
  }, [])

  // 全部标记为已读
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user?.id) return

    const success = await markAllNotificationsAsRead(user.id)
    if (success) {
      setNotifications((prev) => prev.map((n) => ({...n, is_read: true, read_at: new Date().toISOString()})))
      setStats((prev) => ({...prev, unread: 0}))
      showToast({title: '全部已读', icon: 'success', duration: 1500})
    } else {
      showToast({title: '操作失败', icon: 'none'})
    }
  }, [user?.id])

  // 清空已读通知
  const handleClearRead = useCallback(async () => {
    if (!user?.id) return

    showModal({
      title: '确认清空',
      content: '确定要清空所有已读通知吗？',
      success: async (res) => {
        if (res.confirm) {
          const success = await deleteReadNotifications(user.id)
          if (success) {
            setNotifications((prev) => prev.filter((n) => !n.is_read))
            setStats((prev) => ({
              ...prev,
              total: prev.unread
            }))
            showToast({title: '已清空', icon: 'success', duration: 1500})
          } else {
            showToast({title: '清空失败', icon: 'none'})
          }
        }
      }
    })
  }, [user?.id])

  // 处理通知点击
  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      // 标记为已读
      if (!notification.is_read) {
        await handleMarkAsRead(notification.id)
      }

      // 根据通知类型跳转到相关页面
      if (notification.related_type === 'employment_contract' && notification.related_id) {
        // 跳转到合同详情页面
        // 根据通知内容判断跳转到员工端还是HR端
        if (notification.title.includes('待签署') || notification.title.includes('签署完成')) {
          // 员工端：跳转到我的合同签署页面
          Taro.navigateTo({
            url: '/packageH/pages/my-contract-sign/index'
          })
        }
      }
    },
    [handleMarkAsRead]
  )

  // 筛选通知
  const filteredNotifications = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen box-border bg-transparent"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4 space-y-4">
          {/* 统计卡片 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground">消息通知</Text>
              {stats.unread > 0 && (
                <View className="px-3 py-1 bg-blue-100 rounded-full">
                  <Text className="text-xs text-blue-600 font-medium">{stats.unread} 条未读</Text>
                </View>
              )}
            </View>

            <View className="grid grid-cols-4 gap-2">
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">{stats.total}</Text>
                <Text className="text-xs text-muted-foreground mt-1">全部</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">{stats.byType.task}</Text>
                <Text className="text-xs text-muted-foreground mt-1">任务</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">{stats.byType.training}</Text>
                <Text className="text-xs text-muted-foreground mt-1">培训</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">{stats.byType.schedule}</Text>
                <Text className="text-xs text-muted-foreground mt-1">排班</Text>
              </View>
            </View>
          </View>

          {/* 筛选和操作按钮 */}
          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row gap-2">
              <View
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-100 text-white' : 'bg-white text-muted-foreground'}`}
                onClick={() => setFilter('all')}>
                <Text className={`text-sm ${filter === 'all' ? 'text-blue-600' : 'text-muted-foreground'}`}>全部</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-lg ${filter === 'unread' ? 'bg-blue-100 text-white' : 'bg-white text-muted-foreground'}`}
                onClick={() => setFilter('unread')}>
                <Text className={`text-sm ${filter === 'unread' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  未读
                </Text>
              </View>
            </View>

            {stats.unread > 0 && (
              <View className="px-4 py-2 bg-blue-100 rounded-lg active:bg-blue-100" onClick={handleMarkAllAsRead}>
                <Text className="text-sm text-blue-600">全部已读</Text>
              </View>
            )}
          </View>

          {/* 通知列表 */}
          {loading ? (
            <View className="px-4">
              <SkeletonList count={5} />
            </View>
          ) : filteredNotifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            <View className="space-y-3">
              {filteredNotifications.map((notification) => {
                const style = getNotificationStyle(notification.type)
                return (
                  <View
                    key={notification.id}
                    className={`bg-white rounded-lg p-4 shadow-sm ${!notification.is_read ? 'border-l-4 border-primary' : ''}`}
                    onClick={() => handleNotificationClick(notification)}>
                    <View className="flex flex-row items-start">
                      <View className={`w-10 h-10 rounded-full ${style.bgColor} flex items-center justify-center mr-3`}>
                        <View className={`${style.icon} text-xl ${style.color}`} />
                      </View>
                      <View className="flex-1">
                        <View className="flex flex-row items-center justify-between mb-1">
                          <Text className="text-base font-semibold text-foreground">{notification.title}</Text>
                          {!notification.is_read && <View className="w-2 h-2 bg-blue-100 rounded-full" />}
                        </View>
                        <Text className="text-sm text-muted-foreground mb-2">{notification.content}</Text>
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-xs text-muted-foreground">{formatTime(notification.created_at)}</Text>
                          <View className="flex flex-row gap-2">
                            {!notification.is_read && (
                              <View
                                className="px-3 py-1 bg-blue-100 rounded-lg active:bg-blue-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMarkAsRead(notification.id)
                                }}>
                                <Text className="text-xs text-blue-600">标记已读</Text>
                              </View>
                            )}
                            <View
                              className="px-3 py-1 bg-blue-100 rounded-lg active:bg-red-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(notification.id)
                              }}>
                              <Text className="text-xs text-red-600">删除</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          )}

          {/* 清空已读按钮 */}
          {notifications.some((n) => n.is_read) && (
            <Button
              className="w-full bg-muted text-muted-foreground rounded-xl py-4 break-keep text-base"
              size="default"
              onClick={handleClearRead}>
              清空已读通知
            </Button>
          )}

          {/* 底部间距 */}
          <View className="h-4" />
        </View>
      </ScrollView>
    </View>
  )
}

export default Notifications
