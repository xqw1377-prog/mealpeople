/**
 * 入职文档管理 API
 *
 * 功能：
 * - 获取员工的入职文档列表
 * - 上传入职文档
 * - 更新文档状态
 * - 删除文档
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {supabase} from '@/client/supabase'
import type {OnboardingDocument} from './types-onboarding'

/**
 * 获取员工的入职文档列表
 *
 * @param applicationId - 入职申请ID
 * @returns 文档列表
 */
export async function getOnboardingDocuments(applicationId: string): Promise<OnboardingDocument[]> {
  try {
    const {data, error} = await supabase
      .from('onboarding_documents')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', {ascending: true})

    if (error) {
      console.error('获取入职文档失败:', error)
      return []
    }

    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取入职文档异常:', error)
    return []
  }
}

/**
 * 更新文档上传信息
 *
 * @param documentId - 文档ID
 * @param fileUrl - 文件URL
 * @param filePath - 文件路径（Storage中的路径）
 * @param fileName - 文件名
 * @param fileType - 文件类型
 * @param fileSize - 文件大小
 * @param uploadedBy - 上传人ID
 * @returns 是否更新成功
 */
export async function updateDocumentUpload(
  documentId: string,
  fileUrl: string,
  filePath: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  uploadedBy: string
): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('onboarding_documents')
      .update({
        file_url: filePath, // 存储Storage路径，而不是签名URL
        file_type: fileType,
        file_name: fileName,
        file_size: fileSize,
        document_url: fileUrl, // 保持兼容性
        uploaded_by: uploadedBy,
        uploaded_at: new Date().toISOString(),
        status: 'uploaded',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (error) {
      console.error('更新文档上传信息失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('更新文档上传信息异常:', error)
    return false
  }
}

/**
 * 删除文档上传记录
 *
 * @param documentId - 文档ID
 * @returns 是否删除成功
 */
export async function deleteDocumentUpload(documentId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('onboarding_documents')
      .update({
        file_url: null,
        file_type: null,
        file_name: null,
        file_size: null,
        document_url: null,
        uploaded_by: null,
        uploaded_at: null,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (error) {
      console.error('删除文档上传记录失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('删除文档上传记录异常:', error)
    return false
  }
}

/**
 * 获取单个文档详情
 *
 * @param documentId - 文档ID
 * @returns 文档详情
 */
export async function getOnboardingDocument(documentId: string): Promise<OnboardingDocument | null> {
  try {
    const {data, error} = await supabase.from('onboarding_documents').select('*').eq('id', documentId).maybeSingle()

    if (error) {
      console.error('获取文档详情失败:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('获取文档详情异常:', error)
    return null
  }
}

/**
 * 审核文档
 *
 * @param documentId - 文档ID
 * @param status - 审核状态（verified/rejected）
 * @param verifiedBy - 审核人ID
 * @param notes - 审核备注
 * @returns 是否审核成功
 */
export async function verifyDocument(
  documentId: string,
  status: 'verified' | 'rejected',
  verifiedBy: string,
  notes?: string
): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('onboarding_documents')
      .update({
        status,
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (error) {
      console.error('审核文档失败:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('审核文档异常:', error)
    return false
  }
}
