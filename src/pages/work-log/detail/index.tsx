/**
 * 工作记录详情页面
 * 功能：查看工作记录的详细信息
 */

import {Image, ScrollView, Text, Video, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {useTenantStore} from '@/store/tenant'

// 工作记录接口
interface WorkRecord {
  id: string
  content: string
  images: string[]
  videos: string[]
  voice_duration: number
  created_at: string
  employee: {
    name: string
    avatar_url?: string
  }
  category: {
    id: string
    name: string
    icon: string
    color: string
  }
}

const WorkLogDetail: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const router = useRouter()

  const [record, setRecord] = useState<WorkRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [_previewImageIndex, _setPreviewImageIndex] = useState(-1)

  // 获取记录ID
  const recordId = router.params.id

  // 加载记录详情
  const loadRecord = useCallback(async () => {
    if (!recordId || !currentTenant) return

    try {
      setLoading(true)

      const {data, error} = await supabase
        .from('work_records')
        .select(
          `
          id,
          content,
          images,
          videos,
          voice_duration,
          created_at,
          employee:employees(name, avatar_url),
          category:work_log_categories(id, name, icon, color)
        `
        )
        .eq('id', recordId)
        .eq('tenant_id', currentTenant.id)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        Taro.showToast({title: '记录不存在', icon: 'none'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
        return
      }

      const formattedRecord: WorkRecord = {
        id: data.id,
        content: data.content,
        images: data.images || [],
        videos: data.videos || [],
        voice_duration: data.voice_duration || 0,
        created_at: data.created_at,
        employee: Array.isArray(data.employee)
          ? data.employee[0] || {name: '未知员工'}
          : data.employee || {name: '未知员工'},
        category: Array.isArray(data.category)
          ? data.category[0] || {id: '', name: '未分类', icon: 'i-mdi-file-document', color: 'gray'}
          : data.category || {id: '', name: '未分类', icon: 'i-mdi-file-document', color: 'gray'}
      }

      setRecord(formattedRecord)
    } catch (error) {
      console.error('加载记录失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [recordId, currentTenant])

  useEffect(() => {
    loadRecord()
  }, [loadRecord])

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day} ${hour}:${minute}`
  }

  // 预览图片
  const handlePreviewImage = (index: number) => {
    if (!record) return

    Taro.previewImage({
      urls: record.images,
      current: record.images[index]
    })
  }

  // 删除记录
  const handleDelete = async () => {
    if (!record) return

    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条工作记录吗？'
    })

    if (!result.confirm) return

    try {
      const {error} = await supabase.from('work_records').delete().eq('id', record.id)

      if (error) throw error

      Taro.showToast({title: '删除成功', icon: 'success'})

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('删除记录失败:', error)
      Taro.showToast({title: '删除失败', icon: 'none'})
    }
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center min-h-screen bg-background">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!record) {
    return (
      <View className="flex items-center justify-center min-h-screen bg-background">
        <Text className="text-muted-foreground">记录不存在</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4 max-sm:p-3">
          {/* 头部信息 */}
          <View className="bg-white rounded-2xl p-6 max-sm:p-4 mb-4 max-sm:mb-3">
            {/* 类别 */}
            <View className="flex items-center gap-3 max-sm:gap-2 mb-4 max-sm:mb-3">
              <View
                className={`w-16 h-16 max-sm:w-14 max-sm:h-14 bg-${record.category.color}-100 rounded-2xl flex items-center justify-center`}>
                <View
                  className={`${record.category.icon} text-4xl max-sm:text-3xl text-${record.category.color}-600`}
                />
              </View>
              <View className="flex-1">
                <Text className="text-xl max-sm:text-lg font-bold text-foreground mb-1">{record.category.name}</Text>
                <Text className="text-sm max-sm:text-xs text-muted-foreground">{formatTime(record.created_at)}</Text>
              </View>
            </View>

            {/* 员工信息 */}
            <View className="flex items-center gap-2 max-sm:gap-1.5 pt-4 max-sm:pt-3 border-t border-border">
              {record.employee.avatar_url ? (
                <Image
                  src={record.employee.avatar_url}
                  mode="aspectFill"
                  className="w-8 h-8 max-sm:w-7 max-sm:h-7 rounded-full"
                />
              ) : (
                <View className="w-8 h-8 max-sm:w-7 max-sm:h-7 bg-gray-200 rounded-full flex items-center justify-center">
                  <View className="i-mdi-account text-lg max-sm:text-base text-gray-500" />
                </View>
              )}
              <Text className="text-sm max-sm:text-xs text-muted-foreground">记录人：{record.employee.name}</Text>
            </View>
          </View>

          {/* 文字内容 */}
          {record.content && (
            <View className="bg-white rounded-2xl p-6 max-sm:p-4 mb-4 max-sm:mb-3">
              <View className="flex items-center gap-2 max-sm:gap-1.5 mb-3 max-sm:mb-2">
                <View className="i-mdi-text text-xl max-sm:text-lg text-primary" />
                <Text className="text-base max-sm:text-sm font-bold text-foreground">工作内容</Text>
              </View>
              <Text className="text-sm max-sm:text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {record.content}
              </Text>
            </View>
          )}

          {/* 照片 */}
          {record.images.length > 0 && (
            <View className="bg-white rounded-2xl p-6 max-sm:p-4 mb-4 max-sm:mb-3">
              <View className="flex items-center gap-2 max-sm:gap-1.5 mb-3 max-sm:mb-2">
                <View className="i-mdi-image text-xl max-sm:text-lg text-primary" />
                <Text className="text-base max-sm:text-sm font-bold text-foreground">
                  照片 ({record.images.length})
                </Text>
              </View>
              <View className="grid grid-cols-3 gap-3 max-sm:gap-2">
                {record.images.map((img, index) => (
                  <View key={index} className="relative aspect-square" onClick={() => handlePreviewImage(index)}>
                    <Image src={img} mode="aspectFill" className="w-full h-full rounded-xl" />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 视频 */}
          {record.videos.length > 0 && (
            <View className="bg-white rounded-2xl p-6 max-sm:p-4 mb-4 max-sm:mb-3">
              <View className="flex items-center gap-2 max-sm:gap-1.5 mb-3 max-sm:mb-2">
                <View className="i-mdi-video text-xl max-sm:text-lg text-primary" />
                <Text className="text-base max-sm:text-sm font-bold text-foreground">视频</Text>
              </View>
              {record.videos.map((vid, index) => (
                <Video key={index} src={vid} className="w-full rounded-xl mb-3 max-sm:mb-2" style={{height: '240px'}} />
              ))}
            </View>
          )}

          {/* 语音时长 */}
          {record.voice_duration > 0 && (
            <View className="bg-white rounded-2xl p-6 max-sm:p-4 mb-4 max-sm:mb-3">
              <View className="flex items-center gap-2 max-sm:gap-1.5">
                <View className="i-mdi-microphone text-xl max-sm:text-lg text-primary" />
                <Text className="text-base max-sm:text-sm font-bold text-foreground">语音记录</Text>
              </View>
              <View className="mt-3 max-sm:mt-2 flex items-center gap-2 max-sm:gap-1.5">
                <View className="flex-1 h-2 bg-blue-100 rounded-full">
                  <View className="h-full bg-blue-500 rounded-full" style={{width: '100%'}} />
                </View>
                <Text className="text-sm max-sm:text-xs text-muted-foreground">{record.voice_duration}秒</Text>
              </View>
            </View>
          )}

          {/* 操作按钮 */}
          <View className="bg-white rounded-2xl p-4 max-sm:p-3">
            <View
              className="flex items-center justify-center gap-2 max-sm:gap-1.5 py-3 max-sm:py-2 bg-red-50 rounded-xl active:scale-95 transition-all"
              onClick={handleDelete}>
              <View className="i-mdi-delete text-xl max-sm:text-lg text-red-600" />
              <Text className="text-base max-sm:text-sm font-bold text-red-600">删除记录</Text>
            </View>
          </View>
        </View>

        {/* 底部占位 */}
        <View className="h-8" />
      </ScrollView>
    </View>
  )
}

export default WorkLogDetail
