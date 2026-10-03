/**
 * 添加工作记录页面
 * 功能：拍照/视频、语音转文字、分类选择
 */

import {Button, Image, ScrollView, Text, Textarea, Video, View} from '@tarojs/components'
import Taro, {chooseImage, chooseMedia, getRecorderManager} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 类别接口
interface WorkLogCategory {
  id: string
  name: string
  icon: string
  color: string
}

// 文件接口
interface UploadFile {
  path: string
  size: number
  type: 'image' | 'video'
  originalFileObj?: File
}

const AddWorkLog: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [categories, setCategories] = useState<WorkLogCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<UploadFile[]>([])
  const [videos, setVideos] = useState<UploadFile[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [voiceDuration, setVoiceDuration] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  // 录音管理器
  const recorderManager = getRecorderManager()

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user || !currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 1. 加载员工信息
      const emp = await getEmployeeByUserId(user.id)
      setEmployee(emp)

      // 2. 加载类别列表
      const {data, error} = await supabase
        .from('work_log_categories')
        .select('id, name, icon, color')
        .eq('tenant_id', currentTenant.id)
        .eq('is_active', true)
        .order('sort_order', {ascending: true})

      if (error) {
        console.error('查询类别失败:', error)
        throw error
      }

      const cats = Array.isArray(data) ? data : []
      console.log('加载到的类别:', cats)
      setCategories(cats)

      // 默认选择第一个类别（只在初始加载时设置）
      if (cats.length > 0) {
        setSelectedCategory(cats[0].id)
      }

      if (cats.length === 0) {
        Taro.showToast({title: '暂无可用类别，请联系管理员', icon: 'none', duration: 2000})
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user, currentTenant])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 选择照片
  const handleChooseImage = async () => {
    try {
      const res = await chooseImage({
        count: 9 - images.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      const newImages: UploadFile[] = res.tempFiles.map((file, _index) => ({
        path: file.path,
        size: file.size || 0,
        type: 'image' as const,
        originalFileObj: (file as any).originalFileObj
      }))

      setImages([...images, ...newImages])
    } catch (error) {
      console.error('选择照片失败:', error)
    }
  }

  // 选择视频
  const handleChooseVideo = async () => {
    try {
      const res = await chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        camera: 'back'
      })

      if (res.tempFiles && res.tempFiles.length > 0) {
        const file = res.tempFiles[0]
        const newVideo: UploadFile = {
          path: file.tempFilePath,
          size: file.size || 0,
          type: 'video'
        }

        setVideos([...videos, newVideo])
      }
    } catch (error) {
      console.error('选择视频失败:', error)
    }
  }

  // 删除图片
  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
  }

  // 删除视频
  const handleRemoveVideo = (index: number) => {
    const newVideos = videos.filter((_, i) => i !== index)
    setVideos(newVideos)
  }

  // 开始录音
  const handleStartRecord = () => {
    try {
      recorderManager.start({
        duration: 60000,
        format: 'mp3'
      })
      setIsRecording(true)
      setVoiceDuration(0)

      // 模拟计时
      const timer = setInterval(() => {
        setVoiceDuration((prev) => {
          if (prev >= 60) {
            clearInterval(timer)
            handleStopRecord()
            return 60
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error('开始录音失败:', error)
      Taro.showToast({title: '录音失败', icon: 'none'})
    }
  }

  // 停止录音
  const handleStopRecord = () => {
    try {
      recorderManager.stop()
      setIsRecording(false)

      // 这里应该调用语音识别API，暂时使用提示
      Taro.showToast({
        title: '语音识别功能需要配置API',
        icon: 'none',
        duration: 2000
      })
    } catch (error) {
      console.error('停止录音失败:', error)
    }
  }

  // 上传文件到Supabase
  const uploadFile = async (file: UploadFile): Promise<string | null> => {
    if (!currentTenant) return null

    try {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${file.type === 'image' ? 'jpg' : 'mp4'}`
      const filePath = `${currentTenant.id}/work-logs/${fileName}`

      // 根据环境处理文件内容
      const fileContent = file.originalFileObj || ({tempFilePath: file.path} as any)

      const {data, error} = await supabase.storage.from('app-7daop8q0sxdt_work_logs').upload(filePath, fileContent)

      if (error) throw error

      // 获取公共URL
      const {data: urlData} = supabase.storage.from('app-7daop8q0sxdt_work_logs').getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('上传文件失败:', error)
      return null
    }
  }

  // 提交记录
  const handleSubmit = async () => {
    if (!currentTenant || !employee || !user) return

    if (!selectedCategory) {
      Taro.showToast({title: '请选择类别', icon: 'none'})
      return
    }

    if (!content.trim() && images.length === 0 && videos.length === 0) {
      Taro.showToast({title: '请输入内容或添加照片/视频', icon: 'none'})
      return
    }

    try {
      setUploading(true)

      // 上传图片
      const imageUrls: string[] = []
      for (const img of images) {
        const url = await uploadFile(img)
        if (url) imageUrls.push(url)
      }

      // 上传视频
      const videoUrls: string[] = []
      for (const vid of videos) {
        const url = await uploadFile(vid)
        if (url) videoUrls.push(url)
      }

      // 保存记录
      const {error} = await supabase.from('work_records').insert({
        tenant_id: currentTenant.id,
        employee_id: employee.id,
        category_id: selectedCategory,
        content: content.trim(),
        images: imageUrls,
        videos: videoUrls,
        voice_duration: voiceDuration
      })

      if (error) throw error

      Taro.showToast({title: '添加成功', icon: 'success'})

      // 延迟返回
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('提交失败:', error)
      Taro.showToast({title: '提交失败', icon: 'none'})
    } finally {
      setUploading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4 max-sm:p-3 pb-28">
          {/* 加载状态 */}
          {loading && (
            <View className="flex items-center justify-center py-12">
              <View className="i-mdi-loading animate-spin text-4xl text-primary mb-3" />
              <Text className="text-muted-foreground text-sm">加载中...</Text>
            </View>
          )}

          {/* 选择类别 */}
          {!loading && categories.length > 0 && (
            <View className="mb-6 max-sm:mb-4">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-tag text-lg text-primary" />
                <Text className="text-base max-sm:text-sm font-bold text-foreground">选择类别</Text>
                <Text className="text-xs text-red-500">*</Text>
              </View>
              <View className="grid grid-cols-4 gap-3 max-sm:gap-2">
                {categories.map((category) => {
                  const isSelected = selectedCategory === category.id
                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-50 border-blue-400 shadow-blue-100',
                    green: 'bg-green-50 border-green-400 shadow-green-100',
                    orange: 'bg-orange-50 border-orange-400 shadow-orange-100',
                    purple: 'bg-purple-50 border-purple-400 shadow-purple-100',
                    red: 'bg-red-50 border-red-400 shadow-red-100',
                    cyan: 'bg-cyan-50 border-cyan-400 shadow-cyan-100',
                    pink: 'bg-pink-50 border-pink-400 shadow-pink-100',
                    gray: 'bg-gray-50 border-gray-400 shadow-gray-100'
                  }
                  const selectedColors = colorMap[category.color] || colorMap.gray

                  return (
                    <View
                      key={category.id}
                      className={`flex flex-col items-center gap-2 max-sm:gap-1.5 p-3 max-sm:p-2.5 rounded-2xl active:scale-95 transition-all ${
                        isSelected
                          ? `${selectedColors} border-2 shadow-lg`
                          : 'bg-white border-2 border-gray-200 shadow-sm'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}>
                      <View className={`${category.icon} text-2xl max-sm:text-xl`} />
                      <Text className={`text-xs max-sm:text-[10px] text-center ${isSelected ? 'font-bold' : ''}`}>
                        {category.name}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* 无类别提示 */}
          {!loading && categories.length === 0 && (
            <View className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 mb-6 shadow-sm">
              <View className="flex items-center gap-2 mb-2">
                <View className="i-mdi-alert text-xl text-yellow-600" />
                <Text className="text-yellow-900 text-sm font-bold">暂无可用类别</Text>
              </View>
              <Text className="text-yellow-800 text-xs">请联系管理员添加工作类别后再使用此功能</Text>
            </View>
          )}

          {/* 拍照/视频 */}
          <View className="mb-6 max-sm:mb-4">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-image-multiple text-lg text-primary" />
              <Text className="text-base max-sm:text-sm font-bold text-foreground">照片/视频</Text>
              <Text className="text-xs text-muted-foreground">（选填）</Text>
            </View>
            <View className="grid grid-cols-3 gap-3 max-sm:gap-2">
              {/* 已选择的图片 */}
              {images.map((img, index) => (
                <View key={`img-${index}`} className="relative aspect-square">
                  <Image src={img.path} mode="aspectFill" className="w-full h-full rounded-2xl shadow-md" />
                  <View
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                    onClick={() => handleRemoveImage(index)}>
                    <View className="i-mdi-close text-base text-white" />
                  </View>
                  <View className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded-full">
                    <Text className="text-white text-[10px]">{index + 1}/9</Text>
                  </View>
                </View>
              ))}

              {/* 已选择的视频 */}
              {videos.map((vid, index) => (
                <View key={`vid-${index}`} className="relative aspect-square">
                  <Video src={vid.path} className="w-full h-full rounded-2xl shadow-md" />
                  <View
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all"
                    onClick={() => handleRemoveVideo(index)}>
                    <View className="i-mdi-close text-base text-white" />
                  </View>
                  <View className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded-full flex items-center gap-1">
                    <View className="i-mdi-play text-white text-xs" />
                    <Text className="text-white text-[10px]">视频</Text>
                  </View>
                </View>
              ))}

              {/* 添加照片按钮 */}
              {images.length < 9 && (
                <View
                  className="aspect-square bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 max-sm:gap-1.5 active:scale-95 transition-all shadow-sm"
                  onClick={handleChooseImage}>
                  <View className="i-mdi-camera text-3xl max-sm:text-2xl text-primary" />
                  <Text className="text-xs max-sm:text-[10px] text-gray-600 font-medium">拍照</Text>
                </View>
              )}

              {/* 添加视频按钮 */}
              {videos.length < 1 && (
                <View
                  className="aspect-square bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 max-sm:gap-1.5 active:scale-95 transition-all shadow-sm"
                  onClick={handleChooseVideo}>
                  <View className="i-mdi-video text-3xl max-sm:text-2xl text-primary" />
                  <Text className="text-xs max-sm:text-[10px] text-gray-600 font-medium">录视频</Text>
                </View>
              )}
            </View>
            {(images.length > 0 || videos.length > 0) && (
              <Text className="text-xs text-muted-foreground mt-2">
                已添加 {images.length} 张照片{videos.length > 0 ? '，1 个视频' : ''}
              </Text>
            )}
          </View>

          {/* 语音输入 */}
          <View className="mb-6 max-sm:mb-4">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-microphone text-lg text-primary" />
              <Text className="text-base max-sm:text-sm font-bold text-foreground">语音输入</Text>
              <Text className="text-xs text-muted-foreground">（选填）</Text>
            </View>
            <View
              className={`flex items-center justify-center gap-3 max-sm:gap-2 p-6 max-sm:p-5 rounded-2xl active:scale-98 transition-all shadow-md ${
                isRecording ? 'bg-red-50 border-2 border-red-400 shadow-red-100' : 'bg-white border-2 border-gray-200'
              }`}
              onClick={isRecording ? handleStopRecord : handleStartRecord}>
              <View
                className={`${isRecording ? 'i-mdi-stop-circle' : 'i-mdi-microphone'} text-5xl max-sm:text-4xl ${
                  isRecording ? 'text-red-500 animate-pulse' : 'text-primary'
                }`}
              />
              <View className="flex flex-col items-start">
                <Text
                  className={`text-lg max-sm:text-base font-bold ${isRecording ? 'text-red-900' : 'text-gray-900'}`}>
                  {isRecording ? '点击停止录音' : '点击开始录音'}
                </Text>
                {isRecording && (
                  <Text className="text-sm max-sm:text-xs text-red-600 font-medium">{voiceDuration} 秒</Text>
                )}
                {!isRecording && voiceDuration > 0 && (
                  <Text className="text-xs text-green-600">已录制 {voiceDuration} 秒</Text>
                )}
              </View>
            </View>
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-3">
              <View className="flex items-start gap-2">
                <View className="i-mdi-information text-blue-600 text-base mt-0.5" />
                <Text className="text-xs text-blue-800 flex-1">
                  语音识别功能需要配置API，当前仅支持录音。录音时长最长60秒。
                </Text>
              </View>
            </View>
          </View>

          {/* 文字描述 */}
          <View className="mb-6 max-sm:mb-4">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-text text-lg text-primary" />
              <Text className="text-base max-sm:text-sm font-bold text-foreground">文字描述</Text>
              <Text className="text-xs text-muted-foreground">（选填）</Text>
            </View>
            <View style={{overflow: 'hidden'}}>
              <Textarea
                className="bg-white text-foreground px-4 max-sm:px-3 py-3 max-sm:py-2.5 rounded-2xl border-2 border-gray-200 w-full text-sm max-sm:text-xs shadow-sm"
                placeholder="请输入工作内容描述..."
                value={content}
                onInput={(e) => setContent(e.detail.value)}
                maxlength={500}
                style={{minHeight: '140px'}}
              />
            </View>
            <View className="flex items-center justify-between mt-2">
              <Text className="text-xs text-muted-foreground">支持输入文字、表情符号等</Text>
              <Text
                className={`text-xs font-medium ${content.length >= 450 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {content.length}/500
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 提交按钮 */}
      <View className="fixed bottom-0 left-0 right-0 p-4 max-sm:p-3 bg-white border-t-2 border-gray-100 shadow-2xl">
        <Button
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 max-sm:py-3.5 rounded-2xl break-keep text-base max-sm:text-sm font-bold shadow-lg active:scale-98 transition-all"
          size="default"
          onClick={handleSubmit}
          disabled={uploading}>
          {uploading ? '提交中...' : '提交记录'}
        </Button>
      </View>
    </View>
  )
}

export default AddWorkLog
