/**
 * 文档上传页面
 *
 * 功能：
 * - 选择并上传入职文档
 * - 支持图片和PDF格式
 * - 显示上传进度
 * - 预览已上传的文档
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useLoad, useRouter} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {getOnboardingDocument, updateDocumentUpload} from '@/db/api-onboarding-documents'
import type {OnboardingDocument} from '@/db/types-onboarding'
import {ONBOARDING_DOCUMENT_TYPE_NAMES} from '@/db/types-onboarding'
import {chooseDocument, getDocumentSignedUrl, uploadOnboardingDocument} from '@/utils/document-upload'

export default function DocumentUpload() {
  const router = useRouter()
  const {documentId, applicationId} = router.params

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [document, setDocument] = useState<OnboardingDocument | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<{
    filePath: string
    fileName: string
    fileType: string
    fileSize: number
  } | null>(null)

  // 加载文档信息
  const loadDocument = useCallback(async () => {
    if (!documentId) {
      Taro.showToast({
        title: '缺少文档ID',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    const doc = await getOnboardingDocument(documentId)
    setDocument(doc)

    // 如果已上传，获取预览URL
    if (doc?.file_url) {
      const signedUrl = await getDocumentSignedUrl(doc.file_url)
      if (signedUrl) {
        setPreviewUrl(signedUrl)
      }
    }

    setLoading(false)
  }, [documentId])

  useLoad(() => {
    loadDocument()
  })

  // 选择文件
  const handleChooseFile = async () => {
    try {
      const file = await chooseDocument()
      if (file) {
        setSelectedFile(file)
        // 显示预览
        setPreviewUrl(file.filePath)
      }
    } catch (error) {
      console.error('选择文件失败:', error)
      Taro.showToast({
        title: '选择文件失败',
        icon: 'none'
      })
    }
  }

  // 上传文件
  const handleUpload = async () => {
    if (!selectedFile || !document) {
      Taro.showToast({
        title: '请先选择文件',
        icon: 'none'
      })
      return
    }

    // 检查文件大小（5MB限制）
    if (selectedFile.fileSize > 5 * 1024 * 1024) {
      Taro.showToast({
        title: '文件大小不能超过5MB',
        icon: 'none',
        duration: 2000
      })
      return
    }

    setUploading(true)

    try {
      // 获取当前用户ID
      const {
        data: {user}
      } = await Taro.getStorageSync('supabase.auth.token')
      const userId = user?.id || 'unknown'

      // 上传文件到Storage
      const result = await uploadOnboardingDocument(
        selectedFile.filePath,
        userId,
        document.document_type,
        selectedFile.fileName,
        selectedFile.fileType
      )

      if (!result.success || !result.fileUrl || !result.filePath) {
        throw new Error(result.error || '上传失败')
      }

      // 更新数据库记录
      const updateSuccess = await updateDocumentUpload(
        document.id,
        result.fileUrl,
        result.filePath,
        selectedFile.fileName,
        selectedFile.fileType,
        selectedFile.fileSize,
        userId
      )

      if (!updateSuccess) {
        throw new Error('更新数据库失败')
      }

      Taro.showToast({
        title: '上传成功',
        icon: 'success'
      })

      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('上传失败:', error)
      Taro.showToast({
        title: error instanceof Error ? error.message : '上传失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      setUploading(false)
    }
  }

  // 取消选择
  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(document?.file_url ? '' : '')
    if (document?.file_url) {
      // 重新加载已上传的文档预览
      loadDocument()
    }
  }

  if (loading) {
    return (
      <View className="@container min-h-screen bg-gray-50 flex items-center justify-center">
        <View className="text-center">
          <View className="i-mdi-loading text-4xl text-primary animate-spin mb-2" />
          <Text className="text-sm text-muted-foreground">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!document) {
    return (
      <View className="@container min-h-screen bg-gray-50 flex items-center justify-center">
        <View className="text-center">
          <View className="i-mdi-file-document-alert text-5xl text-muted-foreground/30 mb-2" />
          <Text className="text-sm text-muted-foreground">文档不存在</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 max-sm:p-3">
          {/* 页面标题 */}
          <View className="mb-6 max-sm:mb-4">
            <Text className="text-2xl max-sm:text-xl font-bold text-foreground">上传文档</Text>
            <Text className="text-sm max-sm:text-xs text-muted-foreground mt-1 block">
              {document.document_name} - {ONBOARDING_DOCUMENT_TYPE_NAMES[document.document_type]}
            </Text>
          </View>

          {/* 文档信息卡片 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mb-4 max-sm:mb-3">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3">
              <Text className="text-lg max-sm:text-base font-semibold text-foreground">文档信息</Text>
              {document.is_required && (
                <View className="px-2 py-1 bg-red-100 rounded">
                  <Text className="text-xs max-sm:text-[10px] text-red-600">必需</Text>
                </View>
              )}
            </View>

            <View className="space-y-3 max-sm:space-y-2">
              <View>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">文档名称</Text>
                <Text className="text-sm max-sm:text-xs text-foreground mt-1">{document.document_name}</Text>
              </View>
              <View>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">文档类型</Text>
                <Text className="text-sm max-sm:text-xs text-foreground mt-1">
                  {ONBOARDING_DOCUMENT_TYPE_NAMES[document.document_type]}
                </Text>
              </View>
              {document.notes && (
                <View>
                  <Text className="text-xs max-sm:text-[10px] text-muted-foreground">备注说明</Text>
                  <Text className="text-sm max-sm:text-xs text-foreground mt-1">{document.notes}</Text>
                </View>
              )}
            </View>
          </View>

          {/* 文件预览区域 */}
          {previewUrl && (
            <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mb-4 max-sm:mb-3">
              <Text className="text-lg max-sm:text-base font-semibold text-foreground mb-4 max-sm:mb-3">文件预览</Text>
              <View className="bg-muted rounded-lg overflow-hidden">
                <Image
                  src={previewUrl}
                  mode="widthFix"
                  className="w-full"
                  onError={() => {
                    Taro.showToast({
                      title: '图片加载失败',
                      icon: 'none'
                    })
                  }}
                />
              </View>
              {selectedFile && (
                <View className="mt-3 max-sm:mt-2">
                  <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                    文件大小: {(selectedFile.fileSize / 1024).toFixed(2)} KB
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 上传提示 */}
          {!selectedFile && !document.file_url && (
            <View className="bg-blue-50 rounded-lg p-4 max-sm:p-3 mb-4 max-sm:mb-3">
              <View className="flex flex-row items-start">
                <View className="i-mdi-information text-xl max-sm:text-lg text-blue-600 mr-2 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-sm max-sm:text-xs text-blue-900 font-medium">上传说明</Text>
                  <Text className="text-xs max-sm:text-[10px] text-blue-700 mt-1 block">• 支持图片格式：JPG、PNG</Text>
                  <Text className="text-xs max-sm:text-[10px] text-blue-700 mt-1 block">• 支持文档格式：PDF</Text>
                  <Text className="text-xs max-sm:text-[10px] text-blue-700 mt-1 block">• 文件大小不超过5MB</Text>
                  <Text className="text-xs max-sm:text-[10px] text-blue-700 mt-1 block">• 请确保文件清晰可见</Text>
                </View>
              </View>
            </View>
          )}

          {/* 操作按钮 */}
          <View className="space-y-3 max-sm:space-y-2">
            {!selectedFile && !document.file_url && (
              <View
                className="bg-primary rounded-lg py-3 max-sm:py-2 px-4 max-sm:px-3 flex items-center justify-center active:opacity-70 cursor-pointer"
                onClick={handleChooseFile}>
                <View className="flex flex-row items-center">
                  <View className="i-mdi-file-upload text-xl max-sm:text-lg text-white mr-2" />
                  <Text className="text-base max-sm:text-sm text-white font-medium">选择文件</Text>
                </View>
              </View>
            )}

            {selectedFile && (
              <>
                <View
                  className={`rounded-lg py-3 max-sm:py-2 px-4 max-sm:px-3 flex items-center justify-center cursor-pointer ${
                    uploading ? 'bg-gray-400' : 'bg-green-500 active:opacity-70'
                  }`}
                  onClick={uploading ? undefined : handleUpload}>
                  <View className="flex flex-row items-center">
                    {uploading ? (
                      <>
                        <View className="i-mdi-loading text-xl max-sm:text-lg text-white mr-2 animate-spin" />
                        <Text className="text-base max-sm:text-sm text-white font-medium">上传中...</Text>
                      </>
                    ) : (
                      <>
                        <View className="i-mdi-cloud-upload text-xl max-sm:text-lg text-white mr-2" />
                        <Text className="text-base max-sm:text-sm text-white font-medium">确认上传</Text>
                      </>
                    )}
                  </View>
                </View>

                {!uploading && (
                  <View
                    className="bg-gray-200 rounded-lg py-3 max-sm:py-2 px-4 max-sm:px-3 flex items-center justify-center active:opacity-70 cursor-pointer"
                    onClick={handleCancel}>
                    <Text className="text-base max-sm:text-sm text-gray-700 font-medium">取消</Text>
                  </View>
                )}
              </>
            )}

            {document.file_url && !selectedFile && (
              <View
                className="bg-primary rounded-lg py-3 max-sm:py-2 px-4 max-sm:px-3 flex items-center justify-center active:opacity-70 cursor-pointer"
                onClick={handleChooseFile}>
                <View className="flex flex-row items-center">
                  <View className="i-mdi-file-replace text-xl max-sm:text-lg text-white mr-2" />
                  <Text className="text-base max-sm:text-sm text-white font-medium">重新上传</Text>
                </View>
              </View>
            )}

            <View
              className="bg-gray-200 rounded-lg py-3 max-sm:py-2 px-4 max-sm:px-3 flex items-center justify-center active:opacity-70 cursor-pointer"
              onClick={() => Taro.navigateBack()}>
              <Text className="text-base max-sm:text-sm text-gray-700 font-medium">返回</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
