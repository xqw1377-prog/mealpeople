/**
 * 电子签名上传工具
 *
 * 功能：
 * - 上传签名图片到 Supabase Storage
 * - 生成唯一的文件名
 * - 返回公开访问 URL
 *
 * 设计理念：容易学、容易做、容易管
 */

import Taro from '@tarojs/taro'
import {supabase} from '@/client/supabase'

/**
 * 上传签名图片到 Supabase Storage
 *
 * @param signatureDataUrl - 签名图片的临时文件路径（来自 Canvas）
 * @param tenantId - 租户ID
 * @param contractId - 合同ID
 * @param signatureType - 签名类型：'employee' 或 'company'
 * @returns 签名图片的公开访问 URL，失败返回 null
 */
export async function uploadSignature(
  signatureDataUrl: string,
  tenantId: string,
  contractId: string,
  signatureType: 'employee' | 'company'
): Promise<string | null> {
  try {
    // 生成唯一的文件名
    const timestamp = Date.now()
    const fileName = `${tenantId}/${contractId}/${timestamp}_${signatureType}.png`

    // 读取临时文件
    const fileSystemManager = Taro.getFileSystemManager()
    const fileData = fileSystemManager.readFileSync(signatureDataUrl, 'base64')

    // 将 base64 转换为 Blob（H5环境）或直接使用（小程序环境）
    let uploadData: any

    // 检查运行环境
    if (typeof window !== 'undefined' && window.Blob) {
      // H5 环境：转换为 Blob
      const byteCharacters = atob(fileData as string)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      uploadData = new Blob([byteArray], {type: 'image/png'})
    } else {
      // 小程序环境：使用临时文件路径
      uploadData = {
        tempFilePath: signatureDataUrl
      }
    }

    // 上传到 Supabase Storage
    const {data, error} = await supabase.storage.from('contract_signatures').upload(fileName, uploadData, {
      contentType: 'image/png',
      upsert: false
    })

    if (error) {
      console.error('上传签名失败:', error)
      return null
    }

    // 获取公开访问 URL
    const {data: urlData} = supabase.storage.from('contract_signatures').getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    console.error('上传签名异常:', error)
    return null
  }
}

/**
 * 删除签名图片
 *
 * @param signatureUrl - 签名图片的公开访问 URL
 * @returns 是否删除成功
 */
export async function deleteSignature(signatureUrl: string): Promise<boolean> {
  try {
    // 从 URL 中提取文件路径
    const url = new URL(signatureUrl)
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.indexOf('contract_signatures')
    if (bucketIndex === -1) {
      console.error('无效的签名 URL')
      return false
    }

    const filePath = pathParts.slice(bucketIndex + 1).join('/')

    // 从 Supabase Storage 删除
    const {error} = await supabase.storage.from('contract_signatures').remove([filePath])

    if (error) {
      console.error('删除签名失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除签名异常:', error)
    return false
  }
}

/**
 * 获取用户IP地址（用于签名记录）
 *
 * @returns IP地址字符串
 */
export async function getUserIpAddress(): Promise<string> {
  try {
    // 在小程序环境中，无法直接获取用户IP
    // 这里返回一个占位符，实际应用中可以通过后端API获取
    return 'unknown'
  } catch (error) {
    console.error('获取IP地址异常:', error)
    return 'unknown'
  }
}
