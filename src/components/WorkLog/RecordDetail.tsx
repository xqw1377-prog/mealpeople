/**
 * 工作记录详情组件
 * 用于在抽屉中显示记录详情
 */

import {Button, Image, Text, Video, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type React from 'react'
import {useState} from 'react'
import {supabase} from '@/client/supabase'

// 工作记录接口
export interface WorkRecord {
  id: string
  content: string
  images: string[]
  videos: string[]
  voice_duration: number
  created_at: string
  category: {
    id: string
    name: string
    icon: string
    color: string
  }
}

export interface RecordDetailProps {
  /** 记录数据 */
  record: WorkRecord | null
  /** 删除回调 */
  onDelete: (id: string) => void
  /** 关闭回调 */
  onClose?: () => void
}

export const RecordDetail: React.FC<RecordDetailProps> = ({record, onDelete, onClose}) => {
  const [deleting, setDeleting] = useState(false)

  if (!record) {
    return (
      <View className="flex items-center justify-center py-12">
        <Text className="text-muted-foreground">暂无数据</Text>
      </View>
    )
  }

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 预览图片
  const handlePreviewImage = (current: string) => {
    Taro.previewImage({
      current,
      urls: record.images
    })
  }

  // 删除记录
  const handleDelete = async () => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？'
    })

    if (!res.confirm) return

    try {
      setDeleting(true)
      Taro.showLoading({title: '删除中...'})

      const {error} = await supabase.from('work_records').delete().eq('id', record.id)

      if (error) throw error

      Taro.hideLoading()
      Taro.showToast({title: '删除成功', icon: 'success'})

      // 调用删除回调
      onDelete(record.id)

      // 关闭抽屉
      if (onClose) {
        setTimeout(() => onClose(), 500)
      }
    } catch (error) {
      console.error('删除失败:', error)
      Taro.hideLoading()
      Taro.showToast({title: '删除失败', icon: 'none'})
    } finally {
      setDeleting(false)
    }
  }

  // 颜色映射
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    cyan: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    pink: 'bg-pink-50 border-pink-200 text-pink-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700'
  }
  const categoryColors = colorMap[record.category.color] || colorMap.gray

  return (
    <View className="p-4 pb-6">
      {/* 类别信息 */}
      <View className={`${categoryColors} rounded-2xl p-5 mb-6 border-2`}>
        <View className="flex items-center gap-3 mb-3">
          <View className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
            <View className={`${record.category.icon} text-3xl`} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold mb-1">{record.category.name}</Text>
            <Text className="text-xs opacity-80">{formatTime(record.created_at)}</Text>
          </View>
        </View>
      </View>

      {/* 文字内容 */}
      {record.content && (
        <View className="mb-6">
          <View className="flex items-center gap-2 mb-3">
            <View className="i-mdi-text text-lg text-primary" />
            <Text className="text-base font-bold text-foreground">内容描述</Text>
          </View>
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <Text className="text-sm text-gray-700 leading-relaxed">{record.content}</Text>
          </View>
        </View>
      )}

      {/* 照片 */}
      {record.images.length > 0 && (
        <View className="mb-6">
          <View className="flex items-center gap-2 mb-3">
            <View className="i-mdi-image-multiple text-lg text-primary" />
            <Text className="text-base font-bold text-foreground">照片</Text>
            <Text className="text-xs text-muted-foreground">（{record.images.length} 张）</Text>
          </View>
          <View className="grid grid-cols-3 gap-3">
            {record.images.map((img, index) => (
              <View key={index} className="relative aspect-square">
                <Image
                  src={img}
                  mode="aspectFill"
                  className="w-full h-full rounded-2xl shadow-md"
                  onClick={() => handlePreviewImage(img)}
                />
                <View className="absolute bottom-2 right-2 bg-black bg-opacity-60 px-2 py-1 rounded-full">
                  <Text className="text-white text-[10px]">
                    {index + 1}/{record.images.length}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 视频 */}
      {record.videos.length > 0 && (
        <View className="mb-6">
          <View className="flex items-center gap-2 mb-3">
            <View className="i-mdi-video text-lg text-primary" />
            <Text className="text-base font-bold text-foreground">视频</Text>
          </View>
          <View className="rounded-2xl overflow-hidden shadow-md">
            <Video src={record.videos[0]} className="w-full" style={{height: '240px'}} controls />
          </View>
        </View>
      )}

      {/* 语音 */}
      {record.voice_duration > 0 && (
        <View className="mb-6">
          <View className="flex items-center gap-2 mb-3">
            <View className="i-mdi-microphone text-lg text-primary" />
            <Text className="text-base font-bold text-foreground">语音</Text>
          </View>
          <View className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 flex items-center gap-3">
            <View className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <View className="i-mdi-play text-2xl text-white" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-green-900 mb-1">语音记录</Text>
              <Text className="text-xs text-green-700">时长：{record.voice_duration} 秒</Text>
            </View>
          </View>
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-3">
            <View className="flex items-start gap-2">
              <View className="i-mdi-information text-blue-600 text-base mt-0.5" />
              <Text className="text-xs text-blue-800 flex-1">语音播放功能需要配置API，当前仅显示时长。</Text>
            </View>
          </View>
        </View>
      )}

      {/* 删除按钮 */}
      <View className="mt-8">
        <Button
          className="w-full bg-red-500 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg active:scale-98 transition-all"
          onClick={handleDelete}
          disabled={deleting}>
          {deleting ? '删除中...' : '删除记录'}
        </Button>
        <Text className="text-xs text-muted-foreground text-center mt-3">删除后无法恢复，请谨慎操作</Text>
      </View>
    </View>
  )
}

export default RecordDetail
