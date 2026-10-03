/**
 * 消息列表页面
 *
 * 显示所有消息，支持分类筛选和搜索
 */

import {Input, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getMyAnnouncements, markAsRead} from '@/db/api-announcement'
import type {AnnouncementCategory, AnnouncementWithReadStatus} from '@/db/types-announcement'
import {useTenantStore} from '@/store/tenant'

export default function AnnouncementList() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [announcements, setAnnouncements] = useState<AnnouncementWithReadStatus[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<AnnouncementWithReadStatus[]>([])
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | 'all'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  // 分类选项
  const categories = [
    {value: 'all', label: '全部', icon: 'i-mdi-all-inclusive', color: 'text-gray-500'},
    {value: 'urgent', label: '紧急', icon: 'i-mdi-alert', color: 'text-red-500'},
    {value: 'announcement', label: '公告', icon: 'i-mdi-bullhorn', color: 'text-blue-500'},
    {value: 'meeting', label: '会议', icon: 'i-mdi-calendar-clock', color: 'text-green-500'},
    {value: 'file', label: '文件', icon: 'i-mdi-file-document', color: 'text-purple-500'}
  ]

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant?.id || !user?.id) return

    try {
      setLoading(true)
      const data = await getMyAnnouncements(user.id, currentTenant.id)
      setAnnouncements(data)
      setFilteredAnnouncements(data)
    } catch (error) {
      console.error('[消息列表] 加载失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 筛选和搜索
  useEffect(() => {
    let result = announcements

    // 按分类筛选
    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category === selectedCategory)
    }

    // 按关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(
        (a) => a.title.toLowerCase().includes(keyword) || a.content.toLowerCase().includes(keyword)
      )
    }

    setFilteredAnnouncements(result)
  }, [announcements, selectedCategory, searchKeyword])

  // 切换分类
  const handleCategoryChange = useCallback((category: AnnouncementCategory | 'all') => {
    setSelectedCategory(category)
  }, [])

  // 搜索
  const handleSearch = useCallback((e: any) => {
    setSearchKeyword(e.detail.value)
  }, [])

  // 查看详情
  const handleViewDetail = useCallback(
    async (announcement: AnnouncementWithReadStatus) => {
      // 如果未读，先标记为已读
      if (!announcement.is_read && currentTenant?.id && user?.id) {
        try {
          await markAsRead(announcement.id, user.id, user.email || '员工')
          // 重新加载数据
          loadData()
        } catch (error) {
          console.error('[消息列表] 标记已读失败:', error)
        }
      }

      // 跳转到详情页
      Taro.navigateTo({
        url: `/pages/announcement-detail/index?id=${announcement.id}`
      })
    },
    [currentTenant?.id, user?.id, user?.email, loadData]
  )

  // 获取消息类型样式
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'urgent':
        return {
          bg: 'bg-blue-100',
          border: 'border-red-500',
          text: 'text-red-600',
          icon: 'i-mdi-alert',
          iconColor: 'text-red-500'
        }
      case 'meeting':
        return {
          bg: 'bg-blue-100',
          border: 'border-green-500',
          text: 'text-green-600',
          icon: 'i-mdi-calendar-clock',
          iconColor: 'text-green-500'
        }
      case 'file':
        return {
          bg: 'bg-blue-100',
          border: 'border-purple-500',
          text: 'text-purple-700',
          icon: 'i-mdi-file-document',
          iconColor: 'text-purple-500'
        }
      default:
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-500',
          text: 'text-blue-600',
          icon: 'i-mdi-bullhorn',
          iconColor: 'text-blue-500'
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

  // 统计未读数量
  const unreadCount = announcements.filter((a) => !a.is_read).length

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 搜索栏 */}
      <View className="bg-white p-4 sticky top-0 z-10">
        <View className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
          <View className="i-mdi-magnify text-xl text-muted-foreground mr-2" />
          <View style={{overflow: 'hidden'}} className="flex-1">
            <Input
              className="text-sm text-foreground"
              placeholder="搜索消息标题或内容"
              value={searchKeyword}
              onInput={handleSearch}
            />
          </View>
          {searchKeyword && (
            <View onClick={() => setSearchKeyword('')} className="i-mdi-close text-xl text-muted-foreground ml-2" />
          )}
        </View>
      </View>

      {/* 分类筛选 */}
      <ScrollView scrollX className="bg-white px-4 py-3">
        <View className="flex gap-2">
          {categories.map((cat) => (
            <View
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value as any)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedCategory === cat.value ? 'bg-blue-100' : 'bg-background'
              }`}>
              <View className="flex items-center">
                <View
                  className={`${cat.icon} text-lg ${selectedCategory === cat.value ? 'text-foreground' : cat.color} mr-1`}
                />
                <Text className={`text-sm ${selectedCategory === cat.value ? 'text-blue-600' : 'text-foreground'}`}>
                  {cat.label}
                </Text>
                {cat.value === 'all' && unreadCount > 0 && (
                  <View className="ml-1 px-2 py-0.5 bg-blue-100 rounded-full">
                    <Text className="text-xs text-blue-600">{unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 消息列表 */}
      <ScrollView scrollY className="flex-1">
        <View className="p-4">
          {loading ? (
            <View className="text-center py-8">
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredAnnouncements.length === 0 ? (
            <View className="text-center py-12">
              <View className="i-mdi-inbox text-6xl text-muted-foreground mb-3" />
              <Text className="text-sm text-muted-foreground">暂无消息</Text>
            </View>
          ) : (
            filteredAnnouncements.map((announcement) => {
              const style = getCategoryStyle(announcement.category)
              return (
                <View
                  key={announcement.id}
                  onClick={() => handleViewDetail(announcement)}
                  className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4 mb-3`}>
                  {/* 消息头部 */}
                  <View className="flex items-center justify-between mb-2">
                    <View className="flex items-center">
                      <View className={`${style.icon} text-lg ${style.iconColor} mr-2`} />
                      {announcement.priority === 'urgent' && (
                        <View className="px-2 py-1 bg-blue-100 rounded mr-2">
                          <Text className="text-xs text-blue-600">紧急</Text>
                        </View>
                      )}
                      {announcement.is_pinned && (
                        <View className="px-2 py-1 bg-blue-100 rounded mr-2">
                          <Text className="text-xs text-blue-600">置顶</Text>
                        </View>
                      )}
                    </View>
                    {!announcement.is_read && <View className="w-2 h-2 rounded-full bg-blue-100" />}
                  </View>

                  {/* 消息标题 */}
                  <Text className={`text-sm font-semibold ${style.text} mb-1`}>{announcement.title}</Text>

                  {/* 消息内容预览 */}
                  <Text className={`text-xs ${style.text} line-clamp-2 mb-2`}>{announcement.content}</Text>

                  {/* 附件提示 */}
                  {announcement.attachments && announcement.attachments.length > 0 && (
                    <View className="flex items-center mb-2">
                      <View className={`i-mdi-paperclip text-sm ${style.iconColor} mr-1`} />
                      <Text className={`text-xs ${style.text}`}>{announcement.attachments.length} 个附件</Text>
                    </View>
                  )}

                  {/* 消息底部 */}
                  <View className="flex items-center justify-between">
                    <Text className={`text-xs ${style.text}`}>{announcement.publisher_name}</Text>
                    <Text className={`text-xs ${style.text}`}>{formatTime(announcement.publish_time)}</Text>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
    </View>
  )
}
