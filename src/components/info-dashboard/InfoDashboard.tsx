/**
 * 信息交互仪表盘组件
 *
 * 显示在首页首要区域，展示重要消息和通知
 */

import {Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getMyAnnouncements, getUnreadCount, markAsRead} from '@/db/api-announcement'
import type {AnnouncementWithReadStatus, UnreadStats} from '@/db/types-announcement'
import {useTenantStore} from '@/store/tenant'

interface InfoDashboardProps {
  maxItems?: number // 最多显示几条消息
}

export default function InfoDashboard({maxItems = 3}: InfoDashboardProps) {
  const {user} = useAuth()
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [announcements, setAnnouncements] = useState<AnnouncementWithReadStatus[]>([])
  const [unreadStats, setUnreadStats] = useState<UnreadStats>({
    total: 0,
    urgent: 0,
    announcement: 0,
    meeting: 0,
    file: 0
  })
  const [loading, setLoading] = useState(true)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant?.id || !user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 并行加载消息列表和未读统计
      const [announcementsData, unreadData] = await Promise.all([
        getMyAnnouncements(user.id, currentTenant.id),
        getUnreadCount(user.id, currentTenant.id)
      ])

      // 只显示前几条
      setAnnouncements(announcementsData.slice(0, maxItems))
      setUnreadStats(unreadData)
    } catch (error) {
      console.error('[信息仪表盘] 加载数据失败:', error)
      // 不显示错误提示，静默失败
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, user?.id, maxItems])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 查看消息详情
  const handleViewDetail = useCallback(
    async (announcement: AnnouncementWithReadStatus) => {
      if (!user?.id) return

      // 如果未读，先标记为已读
      if (!announcement.is_read && currentTenant?.id) {
        try {
          await markAsRead(announcement.id, user.id, user.email || '员工')
          // 重新加载数据
          loadData()
        } catch (error) {
          console.error('[信息仪表盘] 标记已读失败:', error)
        }
      }

      // 跳转到详情页
      Taro.navigateTo({
        url: `/pages/announcement/detail/index?id=${announcement.id}`
      })
    },
    [currentTenant?.id, user?.id, user?.email, loadData]
  )

  // 查看更多
  const handleViewMore = useCallback(() => {
    Taro.navigateTo({
      url: '/pages/announcement/list/index'
    })
  }, [])

  // 获取消息类型样式
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'urgent':
        return {
          bg: 'bg-blue-100',
          border: 'border-red-500',
          text: 'text-red-700',
          icon: 'i-mdi-alert',
          iconColor: 'text-red-500',
          label: '紧急通知'
        }
      case 'meeting':
        return {
          bg: 'bg-blue-100',
          border: 'border-green-500',
          text: 'text-green-700',
          icon: 'i-mdi-calendar-clock',
          iconColor: 'text-green-500',
          label: '会议通知'
        }
      case 'file':
        return {
          bg: 'bg-blue-100',
          border: 'border-purple-500',
          text: 'text-purple-700',
          icon: 'i-mdi-file-document',
          iconColor: 'text-purple-500',
          label: '文件资料'
        }
      default:
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          text: 'text-blue-700',
          icon: 'i-mdi-bullhorn',
          iconColor: 'text-blue-500',
          label: '公告通知'
        }
    }
  }

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const time = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return time.toLocaleDateString()
  }

  if (loading) {
    return (
      <View className="bg-card rounded-lg p-4 border-2 border-gray-200 shadow-sm">
        <View className="flex items-center justify-center py-4">
          <View className="i-mdi-loading text-2xl text-primary animate-spin mr-2" />
          <Text className="text-sm text-muted-foreground">加载消息中...</Text>
        </View>
      </View>
    )
  }

  // 如果没有租户或用户信息，不显示
  if (!currentTenant?.id || !user?.id) {
    return null
  }

  return (
    <View className="bg-card rounded-lg p-4 border-2 border-gray-200 shadow-sm">
      {/* 标题栏 */}
      <View className="flex items-center justify-between mb-3">
        <View className="flex items-center">
          <View className="i-mdi-message-text text-2xl text-primary mr-2" />
          <Text className="text-lg font-bold text-foreground">信息中心</Text>
          {unreadStats.total > 0 && (
            <View className="ml-2 px-2 py-1 bg-blue-100 rounded-full">
              <Text className="text-xs text-blue-900 font-bold">{unreadStats.total}</Text>
            </View>
          )}
        </View>
        <View onClick={handleViewMore} className="flex items-center active:opacity-70">
          <Text className="text-sm text-primary mr-1">查看更多</Text>
          <View className="i-mdi-chevron-right text-lg text-primary" />
        </View>
      </View>

      {/* 消息列表 */}
      {announcements.length === 0 ? (
        <View className="bg-gray-50 rounded-lg p-8 text-center">
          <View className="i-mdi-inbox text-5xl text-muted-foreground mb-3" />
          <Text className="text-sm text-muted-foreground mb-1">暂无新消息</Text>
          <Text className="text-xs text-muted-foreground">公司公告、会议通知将在这里显示</Text>
        </View>
      ) : (
        <View>
          {announcements.map((announcement) => {
            const style = getCategoryStyle(announcement.category)
            return (
              <View
                key={announcement.id}
                onClick={() => handleViewDetail(announcement)}
                className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4 mb-3 active:opacity-80`}>
                {/* 消息头部 */}
                <View className="flex items-center justify-between mb-2">
                  <View className="flex items-center">
                    <View className={`${style.icon} text-xl ${style.iconColor} mr-2`} />
                    <Text className={`text-xs font-bold ${style.text}`}>{style.label}</Text>
                    {announcement.priority === 'urgent' && (
                      <View className="ml-2 px-2 py-1 bg-blue-100 rounded">
                        <Text className="text-xs text-blue-700">紧急</Text>
                      </View>
                    )}
                    {announcement.is_pinned && (
                      <View className="ml-2 px-2 py-1 bg-blue-100 rounded">
                        <Text className="text-xs text-blue-700">置顶</Text>
                      </View>
                    )}
                  </View>
                  {!announcement.is_read && <View className="w-2 h-2 rounded-full bg-blue-100" />}
                </View>

                {/* 消息标题 */}
                <Text className={`text-sm font-semibold ${style.text} mb-1`}>{announcement.title}</Text>

                {/* 消息内容预览 */}
                <Text className={`text-xs ${style.text} line-clamp-2 mb-2`}>{announcement.content}</Text>

                {/* 会议信息 */}
                {announcement.category === 'meeting' && announcement.meeting_time && (
                  <View className="flex items-center mb-2">
                    <View className={`i-mdi-clock-outline text-sm ${style.iconColor} mr-1`} />
                    <Text className={`text-xs ${style.text}`}>{formatTime(announcement.meeting_time)}</Text>
                    {announcement.meeting_location && (
                      <>
                        <View className={`i-mdi-map-marker text-sm ${style.iconColor} ml-3 mr-1`} />
                        <Text className={`text-xs ${style.text}`}>{announcement.meeting_location}</Text>
                      </>
                    )}
                  </View>
                )}

                {/* 消息底部 */}
                <View className="flex items-center justify-between">
                  <Text className={`text-xs ${style.text}`}>{announcement.publisher_name}</Text>
                  <Text className={`text-xs ${style.text}`}>{formatTime(announcement.publish_time)}</Text>
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* 统计信息 */}
      {unreadStats.total > 0 && (
        <View className="flex items-center justify-around bg-card rounded-lg p-3 border-2 border-gray-200 mt-3">
          {unreadStats.urgent > 0 && (
            <View className="text-center">
              <Text className="text-lg font-bold text-red-500">{unreadStats.urgent}</Text>
              <Text className="text-xs text-muted-foreground">紧急</Text>
            </View>
          )}
          {unreadStats.announcement > 0 && (
            <View className="text-center">
              <Text className="text-lg font-bold text-blue-500">{unreadStats.announcement}</Text>
              <Text className="text-xs text-muted-foreground">公告</Text>
            </View>
          )}
          {unreadStats.meeting > 0 && (
            <View className="text-center">
              <Text className="text-lg font-bold text-green-500">{unreadStats.meeting}</Text>
              <Text className="text-xs text-muted-foreground">会议</Text>
            </View>
          )}
          {unreadStats.file > 0 && (
            <View className="text-center">
              <Text className="text-lg font-bold text-purple-500">{unreadStats.file}</Text>
              <Text className="text-xs text-muted-foreground">文件</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}
