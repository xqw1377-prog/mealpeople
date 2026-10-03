/**
 * 入职文档上传工具
 *
 * 功能：
 * - 上传入职文档到 Supabase Storage
 * - 支持图片和PDF格式
 * - 生成唯一的文件名
 * - 返回文件访问 URL
 *
 * 设计理念：容易学、容易做、容易管理
 */

import Taro from '@tarojs/taro'
import {supabase} from '@/client/supabase'

/**
 * 文档上传结果
 */
export interface DocumentUploadResult {
  success: boolean
  fileUrl?: string
  filePath?: string
  error?: string
}

/**
 * 上传入职文档到 Supabase Storage
 *
 * @param filePath - 文件的临时路径
 * @param employeeId - 员工ID
 * @param documentType - 文档类型（id_card, diploma, health_certificate等）
 * @param fileName - 原始文件名
 * @param fileType - 文件MIME类型
 * @returns 上传结果
 */
export async function uploadOnboardingDocument(
  filePath: string,
  employeeId: string,
  documentType: string,
  fileName: string,
  fileType: string
): Promise<DocumentUploadResult> {
  try {
    // 生成唯一的文件名
    const timestamp = Date.now()
    const _fileExtension = fileName.split('.').pop() || 'jpg'
    const storagePath = `${employeeId}/${documentType}/${timestamp}_${fileName}`

    // 准备上传数据
    let uploadData: any

    // 检查运行环境
    if (typeof window !== 'undefined' && window.File) {
      // H5 环境：需要将文件转换为 Blob
      try {
        // 尝试使用 fetch 读取文件
        const response = await fetch(filePath)
        uploadData = await response.blob()
      } catch (error) {
        console.error('H5环境读取文件失败:', error)
        return {
          success: false,
          error: '读取文件失败'
        }
      }
    } else {
      // 小程序环境：使用临时文件路径
      uploadData = {
        tempFilePath: filePath
      }
    }

    // 上传到 Supabase Storage
    const {data, error} = await supabase.storage.from('onboarding_documents').upload(storagePath, uploadData, {
      contentType: fileType,
      upsert: false
    })

    if (error) {
      console.error('上传文档失败:', error)
      return {
        success: false,
        error: error.message || '上传失败'
      }
    }

    // 获取文件访问 URL（私有bucket需要使用 createSignedUrl）
    const {data: urlData, error: urlError} = await supabase.storage
      .from('onboarding_documents')
      .createSignedUrl(data.path, 60 * 60 * 24 * 365) // 1年有效期

    if (urlError) {
      console.error('获取文件URL失败:', urlError)
      return {
        success: false,
        error: '获取文件URL失败'
      }
    }

    return {
      success: true,
      fileUrl: urlData.signedUrl,
      filePath: data.path
    }
  } catch (error) {
    console.error('上传文档异常:', error)
    return {
      success: false,
      error: '上传异常'
    }
  }
}

/**
 * 删除入职文档
 *
 * @param filePath - 文件在Storage中的路径
 * @returns 是否删除成功
 */
export async function deleteOnboardingDocument(filePath: string): Promise<boolean> {
  try {
    const {error} = await supabase.storage.from('onboarding_documents').remove([filePath])

    if (error) {
      console.error('删除文档失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除文档异常:', error)
    return false
  }
}

/**
 * 获取文档的签名URL（用于预览）
 *
 * @param filePath - 文件在Storage中的路径
 * @param expiresIn - URL有效期（秒），默认1小时
 * @returns 签名URL
 */
export async function getDocumentSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
  try {
    const {data, error} = await supabase.storage.from('onboarding_documents').createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('获取文档URL失败:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('获取文档URL异常:', error)
    return null
  }
}

/**
 * 选择文件（支持图片和PDF）
 *
 * @returns 选择的文件信息
 */
export async function chooseDocument(): Promise<{
  filePath: string
  fileName: string
  fileType: string
  fileSize: number
} | null> {
  try {
    // 选择图片或文件
    const res = await Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })

    if (res.tempFiles && res.tempFiles.length > 0) {
      const file = res.tempFiles[0]
      return {
        filePath: file.path,
        fileName: `document_${Date.now()}.jpg`,
        fileType: file.type || 'image/jpeg',
        fileSize: file.size || 0
      }
    }

    return null
  } catch (error) {
    console.error('选择文件失败:', error)
    return null
  }
}
