/**
 * 消息详情页面
 *
 * 显示消息的完整内容、附件、会议信息等
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {confirmMeeting, getAnnouncementDetail, getMyMeetingConfirmation, markAsRead} from '@/db/api-announcement'
import type {AnnouncementWithReadStatus, MeetingConfirmation} from '@/db/types-announcement'
import {useTenantStore} from '@/store/tenant'

export default function AnnouncementDetail() {
  const router = useRouter()
  const {user} = useAuth({guard: true})
  const _currentTenant = useTenantStore((state) => state.currentTenant)
  const [announcement, setAnnouncement] = useState<AnnouncementWithReadStatus | null>(null)
  const [myConfirmation, setMyConfirmation] = useState<MeetingConfirmation | null>(null)
  const [loading, setLoading] = useState(true)

  const announcementId = router.params.id || ''

  // 加载数据
  const loadData = useCallback(async () => {
    if (!announcementId || !user?.id) return

    try {
      setLoading(true)

      // 加载消息详情
      const data = await getAnnouncementDetail(announcementId, user.id)
      setAnnouncement(data)

      // 如果是会议类型，加载我的确认状态
      if (data.category === 'meeting') {
        const confirmation = await getMyMeetingConfirmation(announcementId, user.id)
        setMyConfirmation(confirmation)
      }

      // 如果未读，标记为已读
      if (!data.is_read) {
        await markAsRead(announcementId, user.id, user.email || '员工')
      }
    } catch (error) {
      console.error('[消息详情] 加载失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [announcementId, user?.id, user?.email])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 确认参加会议
  const handleConfirmMeeting = useCallback(
    async (status: 'confirmed' | 'declined') => {
      if (!user?.id || !announcement) return

      try {
        Taro.showLoading({title: '提交中...'})

        let declineReason: string | undefined

        // 如果是拒绝，询问原因
        if (status === 'declined') {
          const result = await Taro.showModal({
            title: '拒绝参加',
            content: '请输入拒绝原因'
          })

          if (!result.confirm) {
            Taro.hideLoading()
            return
          }

          declineReason = '用户拒绝'
        }

        await confirmMeeting({
          announcement_id: announcement.id,
          employee_id: user.id,
          employee_name: user.email || '员工',
          status,
          decline_reason: declineReason
        })

        Taro.hideLoading()
        Taro.showToast({
          title: status === 'confirmed' ? '已确认参加' : '已拒绝参加',
          icon: 'success'
        })

        // 重新加载数据
        loadData()
      } catch (error) {
        console.error('[消息详情] 确认会议失败:', error)
        Taro.hideLoading()
        Taro.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    },
    [user?.id, user?.email, announcement, loadData]
  )

  // 下载附件
  const handleDownloadAttachment = useCallback((url: string, name: string) => {
    Taro.showToast({
      title: '开始下载',
      icon: 'none'
    })
    // TODO: 实现文件下载功能
    console.log('下载文件:', url, name)
  }, [])

  // 获取消息类型样式
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'urgent':
        return {
          bg: 'bg-blue-100',
          text: 'text-red-600',
          icon: 'i-mdi-alert',
          iconColor: 'text-red-500',
          label: '紧急通知'
        }
      case 'meeting':
        return {
          bg: 'bg-blue-100',
          text: 'text-green-600',
          icon: 'i-mdi-calendar-clock',
          iconColor: 'text-green-500',
          label: '会议通知'
        }
      case 'file':
        return {
          bg: 'bg-blue-100',
          text: 'text-purple-700',
          icon: 'i-mdi-file-document',
          iconColor: 'text-purple-500',
          label: '文件资料'
        }
      default:
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          icon: 'i-mdi-bullhorn',
          iconColor: 'text-blue-500',
          label: '公告通知'
        }
    }
  }

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const time = new Date(timeStr)
    return time.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取文件图标
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'i-mdi-file-pdf-box'
    if (type.includes('word') || type.includes('doc')) return 'i-mdi-file-word-box'
    if (type.includes('excel') || type.includes('xls')) return 'i-mdi-file-excel-box'
    if (type.includes('ppt') || type.includes('powerpoint')) return 'i-mdi-file-powerpoint-box'
    if (type.includes('image') || type.includes('png') || type.includes('jpg')) return 'i-mdi-file-image'
    return 'i-mdi-file-document'
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 p-4">
        <Text className="text-sm text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!announcement) {
    return (
      <View className="min-h-screen bg-gray-50 p-4">
        <Text className="text-sm text-muted-foreground">消息不存在</Text>
      </View>
    )
  }

  const style = getCategoryStyle(announcement.category)

  return (
    <ScrollView scrollY className="min-h-screen bg-gray-50">
      <View className="p-4">
        {/* 消息类型标签 */}
        <View className={`${style.bg} rounded-lg p-3 mb-4`}>
          <View className="flex items-center">
            <View className={`${style.icon} text-2xl ${style.iconColor} mr-2`} />
            <Text className={`text-sm font-bold ${style.text}`}>{style.label}</Text>
            {announcement.priority === 'urgent' && (
              <View className="ml-2 px-2 py-1 bg-blue-100 rounded">
                <Text className="text-xs text-blue-600">紧急</Text>
              </View>
            )}
            {announcement.is_pinned && (
              <View className="ml-2 px-2 py-1 bg-blue-100 rounded">
                <Text className="text-xs text-blue-600">置顶</Text>
              </View>
            )}
          </View>
        </View>

        {/* 消息标题 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4">
          <Text className="text-xl font-bold text-foreground mb-3">{announcement.title}</Text>

          {/* 发布信息 */}
          <View className="flex items-center justify-between border-t border-border pt-3">
            <View className="flex items-center">
              <View className="i-mdi-account-circle text-lg text-muted-foreground mr-1" />
              <Text className="text-sm text-muted-foreground">{announcement.publisher_name}</Text>
            </View>
            <View className="flex items-center">
              <View className="i-mdi-clock-outline text-lg text-muted-foreground mr-1" />
              <Text className="text-sm text-muted-foreground">{formatTime(announcement.publish_time)}</Text>
            </View>
          </View>

          {/* 阅读统计 */}
          <View className="flex items-center justify-between border-t border-border pt-3 mt-3">
            <View className="flex items-center">
              <View className="i-mdi-eye text-lg text-muted-foreground mr-1" />
              <Text className="text-sm text-muted-foreground">查看 {announcement.view_count}</Text>
            </View>
            <View className="flex items-center">
              <View className="i-mdi-check-circle text-lg text-muted-foreground mr-1" />
              <Text className="text-sm text-muted-foreground">已读 {announcement.read_count}</Text>
            </View>
          </View>
        </View>

        {/* 会议信息 */}
        {announcement.category === 'meeting' && (
          <View className="bg-blue-100 rounded-lg p-4 mb-4">
            <View className="flex items-center mb-3">
              <View className="i-mdi-calendar-clock text-xl text-muted-foreground mr-2" />
              <Text className="text-base font-bold text-green-600">会议信息</Text>
            </View>

            {announcement.meeting_time && (
              <View className="flex items-center mb-2">
                <View className="i-mdi-clock-outline text-lg text-muted-foreground mr-2" />
                <Text className="text-sm text-green-600">时间：{formatTime(announcement.meeting_time)}</Text>
              </View>
            )}

            {announcement.meeting_location && (
              <View className="flex items-center mb-3">
                <View className="i-mdi-map-marker text-lg text-muted-foreground mr-2" />
                <Text className="text-sm text-green-600">地点：{announcement.meeting_location}</Text>
              </View>
            )}

            {/* 我的确认状态 */}
            {myConfirmation ? (
              <View className="bg-white rounded-lg p-3 border-2 border-gray-200">
                {myConfirmation.status === 'confirmed' && (
                  <View className="flex items-center">
                    <View className="i-mdi-check-circle text-xl text-green-500 mr-2" />
                    <Text className="text-sm text-green-600">您已确认参加</Text>
                  </View>
                )}
                {myConfirmation.status === 'declined' && (
                  <View>
                    <View className="flex items-center mb-2">
                      <View className="i-mdi-close-circle text-xl text-red-500 mr-2" />
                      <Text className="text-sm text-red-600">您已拒绝参加</Text>
                    </View>
                    {myConfirmation.decline_reason && (
                      <Text className="text-xs text-muted-foreground">原因：{myConfirmation.decline_reason}</Text>
                    )}
                  </View>
                )}
                {myConfirmation.status === 'pending' && (
                  <View className="flex items-center">
                    <View className="i-mdi-clock-outline text-xl text-orange-500 mr-2" />
                    <Text className="text-sm text-orange-600">待确认</Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="flex gap-2">
                <Button
                  className="flex-1 bg-blue-100 text-white py-3 rounded text-sm"
                  size="default"
                  onClick={() => handleConfirmMeeting('confirmed')}>
                  确认参加
                </Button>
                <Button
                  className="flex-1 bg-gray-500 text-blue-600 py-3 rounded text-sm"
                  size="default"
                  onClick={() => handleConfirmMeeting('declined')}>
                  拒绝参加
                </Button>
              </View>
            )}
          </View>
        )}

        {/* 消息内容 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4">
          <Text className="text-base text-foreground leading-relaxed whitespace-pre-wrap">{announcement.content}</Text>
        </View>

        {/* 附件列表 */}
        {announcement.attachments && announcement.attachments.length > 0 && (
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4">
            <View className="flex items-center mb-3">
              <View className="i-mdi-paperclip text-xl text-blue-600 mr-2" />
              <Text className="text-base font-bold text-foreground">附件 ({announcement.attachments.length})</Text>
            </View>

            {announcement.attachments.map((attachment, index) => (
              <View
                key={index}
                onClick={() => handleDownloadAttachment(attachment.url, attachment.name)}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-2">
                <View className="flex items-center flex-1">
                  <View className={`${getFileIcon(attachment.type)} text-2xl text-blue-600 mr-3`} />
                  <View className="flex-1">
                    <Text className="text-sm text-foreground mb-1">{attachment.name}</Text>
                    <Text className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</Text>
                  </View>
                </View>
                <View className="i-mdi-download text-xl text-blue-600" />
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}
