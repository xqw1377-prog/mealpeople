/**
 * 添加工作记录表单组件
 * 用于在抽屉中添加工作记录
 */

import {Button, Image, Text, Textarea, Video, View} from '@tarojs/components'
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

export interface AddRecordFormProps {
  /** 提交成功回调 */
  onSuccess: () => void
  /** 取消回调 */
  onCancel?: () => void
}

export const AddRecordForm: React.FC<AddRecordFormProps> = ({onSuccess, onCancel}) => {
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

      // 默认选择第一个类别
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

      const newImages: UploadFile[] = res.tempFiles.map((file) => ({
        path: file.path,
        size: file.size,
        type: 'image' as const
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
        maxDuration: 60
      })

      if (res.tempFiles.length > 0) {
        const file = res.tempFiles[0]
        const newVideo: UploadFile = {
          path: file.tempFilePath,
          size: file.size,
          type: 'video'
        }
        setVideos([newVideo])
      }
    } catch (error) {
      console.error('选择视频失败:', error)
    }
  }

  // 删除照片
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // 删除视频
  const handleRemoveVideo = (_index: number) => {
    setVideos([])
  }

  // 开始录音
  const handleStartRecord = () => {
    try {
      setIsRecording(true)
      setVoiceDuration(0)

      // 开始录音
      recorderManager.start({
        duration: 60000,
        format: 'mp3'
      })

      // 录音计时
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
      setIsRecording(false)
    }
  }

  // 停止录音
  const handleStopRecord = () => {
    try {
      recorderManager.stop()
      setIsRecording(false)
    } catch (error) {
      console.error('停止录音失败:', error)
    }
  }

  // 上传文件到Supabase
  const uploadFile = async (file: UploadFile): Promise<string> => {
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}`
    const filePath = `${currentTenant?.id}/${employee?.id}/${fileName}`

    const {data, error} = await supabase.storage.from('app-7daop8q0sxdt_work_logs').upload(filePath, file.path)

    if (error) throw error

    const {data: urlData} = supabase.storage.from('app-7daop8q0sxdt_work_logs').getPublicUrl(data.path)

    return urlData.publicUrl
  }

  // 提交记录
  const handleSubmit = async () => {
    if (!selectedCategory) {
      Taro.showToast({title: '请选择类别', icon: 'none'})
      return
    }

    if (!employee) {
      Taro.showToast({title: '员工信息加载失败', icon: 'none'})
      return
    }

    try {
      setUploading(true)
      Taro.showLoading({title: '提交中...'})

      // 上传图片
      const imageUrls: string[] = []
      for (const img of images) {
        const url = await uploadFile(img)
        imageUrls.push(url)
      }

      // 上传视频
      const videoUrls: string[] = []
      for (const vid of videos) {
        const url = await uploadFile(vid)
        videoUrls.push(url)
      }

      // 插入记录
      const {error} = await supabase.from('work_records').insert({
        tenant_id: currentTenant?.id,
        employee_id: employee.id,
        category_id: selectedCategory,
        content: content || null,
        images: imageUrls,
        videos: videoUrls,
        voice_duration: voiceDuration > 0 ? voiceDuration : null
      })

      if (error) throw error

      Taro.hideLoading()
      Taro.showToast({title: '添加成功', icon: 'success'})

      // 重置表单
      setSelectedCategory(categories[0]?.id || '')
      setContent('')
      setImages([])
      setVideos([])
      setVoiceDuration(0)

      // 调用成功回调
      onSuccess()
    } catch (error) {
      console.error('提交失败:', error)
      Taro.hideLoading()
      Taro.showToast({title: '提交失败', icon: 'none'})
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center py-12">
        <View className="i-mdi-loading animate-spin text-4xl text-primary mb-3" />
        <Text className="text-muted-foreground text-sm">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="p-4 pb-6">
      {/* 选择类别 */}
      {categories.length > 0 && (
        <View className="mb-6">
          <View className="flex items-center gap-2 mb-3">
            <View className="i-mdi-tag text-lg text-primary" />
            <Text className="text-base font-bold text-foreground">选择类别</Text>
            <Text className="text-xs text-red-500">*</Text>
          </View>
          <View className="grid grid-cols-4 gap-3">
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
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl active:scale-95 transition-all ${
                    isSelected ? `${selectedColors} border-2 shadow-lg` : 'bg-white border-2 border-gray-200 shadow-sm'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}>
                  <View className={`${category.icon} text-2xl`} />
                  <Text className={`text-xs text-center ${isSelected ? 'font-bold' : ''}`}>{category.name}</Text>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* 无类别提示 */}
      {categories.length === 0 && (
        <View className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 mb-6 shadow-sm">
          <View className="flex items-center gap-2 mb-2">
            <View className="i-mdi-alert text-xl text-yellow-600" />
            <Text className="text-yellow-900 text-sm font-bold">暂无可用类别</Text>
          </View>
          <Text className="text-yellow-800 text-xs">请联系管理员添加工作类别后再使用此功能</Text>
        </View>
      )}

      {/* 拍照/视频 */}
      <View className="mb-6">
        <View className="flex items-center gap-2 mb-3">
          <View className="i-mdi-image-multiple text-lg text-primary" />
          <Text className="text-base font-bold text-foreground">照片/视频</Text>
          <Text className="text-xs text-muted-foreground">（选填）</Text>
        </View>
        <View className="grid grid-cols-3 gap-3">
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
              className="aspect-square bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              onClick={handleChooseImage}>
              <View className="i-mdi-camera text-3xl text-primary" />
              <Text className="text-xs text-gray-600 font-medium">拍照</Text>
            </View>
          )}

          {/* 添加视频按钮 */}
          {videos.length < 1 && (
            <View
              className="aspect-square bg-white border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              onClick={handleChooseVideo}>
              <View className="i-mdi-video text-3xl text-primary" />
              <Text className="text-xs text-gray-600 font-medium">录视频</Text>
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
      <View className="mb-6">
        <View className="flex items-center gap-2 mb-3">
          <View className="i-mdi-microphone text-lg text-primary" />
          <Text className="text-base font-bold text-foreground">语音输入</Text>
          <Text className="text-xs text-muted-foreground">（选填）</Text>
        </View>
        <View
          className={`flex items-center justify-center gap-3 p-6 rounded-2xl active:scale-98 transition-all shadow-md ${
            isRecording ? 'bg-red-50 border-2 border-red-400 shadow-red-100' : 'bg-white border-2 border-gray-200'
          }`}
          onClick={isRecording ? handleStopRecord : handleStartRecord}>
          <View
            className={`${isRecording ? 'i-mdi-stop-circle' : 'i-mdi-microphone'} text-5xl ${
              isRecording ? 'text-red-500 animate-pulse' : 'text-primary'
            }`}
          />
          <View className="flex flex-col items-start">
            <Text className={`text-lg font-bold ${isRecording ? 'text-red-900' : 'text-gray-900'}`}>
              {isRecording ? '点击停止录音' : '点击开始录音'}
            </Text>
            {isRecording && <Text className="text-sm text-red-600 font-medium">{voiceDuration} 秒</Text>}
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
      <View className="mb-6">
        <View className="flex items-center gap-2 mb-3">
          <View className="i-mdi-text text-lg text-primary" />
          <Text className="text-base font-bold text-foreground">文字描述</Text>
          <Text className="text-xs text-muted-foreground">（选填）</Text>
        </View>
        <View style={{overflow: 'hidden'}}>
          <Textarea
            className="bg-white text-foreground px-4 py-3 rounded-2xl border-2 border-gray-200 w-full text-sm shadow-sm"
            placeholder="请输入工作内容描述..."
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={500}
            style={{minHeight: '120px'}}
          />
        </View>
        <View className="flex items-center justify-between mt-2">
          <Text className="text-xs text-muted-foreground">支持输入文字、表情符号等</Text>
          <Text className={`text-xs font-medium ${content.length >= 450 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {content.length}/500
          </Text>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className="flex gap-3">
        {onCancel && (
          <Button
            className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl text-sm font-bold active:scale-98 transition-all"
            onClick={onCancel}>
            取消
          </Button>
        )}
        <Button
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-2xl text-sm font-bold shadow-lg active:scale-98 transition-all"
          onClick={handleSubmit}
          disabled={uploading || categories.length === 0}>
          {uploading ? '提交中...' : '提交记录'}
        </Button>
      </View>
    </View>
  )
}

export default AddRecordForm
