/**
 * 劳动合同PDF生成工具
 * 用于将签署完成的劳动合同生成PDF文件
 */

import {jsPDF} from 'jspdf'
import type {EmploymentContract} from '@/db/types-employment'

/**
 * 生成劳动合同PDF
 * @param contract 合同数据
 * @param employeeName 员工姓名
 * @param companyName 公司名称
 * @returns PDF的Blob对象
 */
export async function generateContractPDF(
  contract: EmploymentContract,
  employeeName: string,
  companyName: string
): Promise<Blob> {
  // 创建PDF文档 (A4尺寸)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // 设置字体（使用内置字体，避免中文字体问题）
  pdf.setFont('helvetica')

  // 页面边距
  const margin = 20
  const pageWidth = 210 // A4宽度
  const pageHeight = 297 // A4高度
  const contentWidth = pageWidth - 2 * margin
  let yPosition = margin

  // 标题
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Labor Contract / Lao Dong He Tong', pageWidth / 2, yPosition, {align: 'center'})
  yPosition += 15

  // 合同编号
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Contract No. / He Tong Bian Hao: ${contract.contract_number || 'N/A'}`, margin, yPosition)
  yPosition += 10

  // 分隔线
  pdf.setLineWidth(0.5)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  // 合同双方信息
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Party A (Employer) / Jia Fang (Gu Zhu):', margin, yPosition)
  yPosition += 7
  pdf.setFont('helvetica', 'normal')
  pdf.text(companyName, margin + 10, yPosition)
  yPosition += 10

  pdf.setFont('helvetica', 'bold')
  pdf.text('Party B (Employee) / Yi Fang (Yuan Gong):', margin, yPosition)
  yPosition += 7
  pdf.setFont('helvetica', 'normal')
  pdf.text(employeeName, margin + 10, yPosition)
  yPosition += 10

  // 合同基本信息
  pdf.setFont('helvetica', 'bold')
  pdf.text('Contract Information / He Tong Xin Xi:', margin, yPosition)
  yPosition += 7
  pdf.setFont('helvetica', 'normal')

  const contractInfo = [
    `Position / Zhi Wei: ${contract.position || 'N/A'}`,
    `Department / Bu Men: ${contract.department || 'N/A'}`,
    `Contract Type / He Tong Lei Xing: ${getContractTypeText(contract.contract_type)}`,
    `Start Date / Kai Shi Ri Qi: ${formatDate(contract.start_date)}`,
    `End Date / Jie Shu Ri Qi: ${contract.end_date ? formatDate(contract.end_date) : 'N/A'}`,
    `Salary / Xin Zi: ${contract.salary || 'N/A'} CNY/month`
  ]

  contractInfo.forEach((info) => {
    pdf.text(info, margin + 10, yPosition)
    yPosition += 6
  })

  yPosition += 5

  // 工作地点
  if (contract.work_location) {
    pdf.setFont('helvetica', 'bold')
    pdf.text('Work Location / Gong Zuo Di Dian:', margin, yPosition)
    yPosition += 7
    pdf.setFont('helvetica', 'normal')

    const lines = pdf.splitTextToSize(contract.work_location, contentWidth - 10)
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
      }
      pdf.text(line, margin + 10, yPosition)
      yPosition += 6
    })
    yPosition += 5
  }

  // 工作地点
  if (contract.work_location) {
    pdf.setFont('helvetica', 'bold')
    pdf.text('Work Location / Gong Zuo Di Dian:', margin, yPosition)
    yPosition += 7
    pdf.setFont('helvetica', 'normal')
    pdf.text(contract.work_location, margin + 10, yPosition)
    yPosition += 10
  }

  // 检查是否需要新页面
  if (yPosition > pageHeight - 80) {
    pdf.addPage()
    yPosition = margin
  }

  // 签名信息
  yPosition += 10
  pdf.setLineWidth(0.5)
  pdf.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 10

  pdf.setFont('helvetica', 'bold')
  pdf.text('Signatures / Qian Ming:', margin, yPosition)
  yPosition += 10

  // 员工签名
  pdf.setFont('helvetica', 'normal')
  pdf.text('Employee Signature / Yuan Gong Qian Ming:', margin, yPosition)
  yPosition += 7

  if (contract.employee_signature_url) {
    try {
      // 添加员工签名图片
      const employeeSignImg = await loadImage(contract.employee_signature_url)
      pdf.addImage(employeeSignImg, 'PNG', margin + 10, yPosition, 40, 20)
    } catch (error) {
      console.error('加载员工签名图片失败:', error)
      pdf.text('[Signature Image]', margin + 10, yPosition + 10)
    }
  }

  if (contract.employee_signature_date) {
    pdf.text(`Date / Ri Qi: ${formatDate(contract.employee_signature_date)}`, margin + 60, yPosition + 10)
  }

  yPosition += 30

  // 公司签名
  pdf.text('Company Signature / Gong Si Qian Ming:', margin, yPosition)
  yPosition += 7

  if (contract.company_signature_url) {
    try {
      // 添加公司签名图片
      const companySignImg = await loadImage(contract.company_signature_url)
      pdf.addImage(companySignImg, 'PNG', margin + 10, yPosition, 40, 20)
    } catch (error) {
      console.error('加载公司签名图片失败:', error)
      pdf.text('[Signature Image]', margin + 10, yPosition + 10)
    }
  }

  if (contract.company_signature_date) {
    pdf.text(`Date / Ri Qi: ${formatDate(contract.company_signature_date)}`, margin + 60, yPosition + 10)
  }

  if (contract.company_signer_name) {
    pdf.text(`Signer / Qian Shu Ren: ${contract.company_signer_name}`, margin + 60, yPosition + 16)
  }

  // 页脚
  const pageCount = pdf.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {align: 'center'})
  }

  // 返回PDF的Blob对象
  return pdf.output('blob')
}

/**
 * 加载图片为Base64
 * @param url 图片URL
 * @returns Base64字符串
 */
async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } else {
        reject(new Error('无法创建Canvas上下文'))
      }
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = url
  })
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期字符串
 */
function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * 获取合同类型文本
 * @param type 合同类型
 * @returns 合同类型文本
 */
function getContractTypeText(type: string | null | undefined): string {
  const typeMap: Record<string, string> = {
    full_time: 'Full-time / Quan Zhi',
    part_time: 'Part-time / Jian Zhi',
    internship: 'Internship / Shi Xi',
    temporary: 'Temporary / Lin Shi'
  }
  return typeMap[type || ''] || 'N/A'
}

/**
 * 上传PDF到Supabase Storage
 * @param pdfBlob PDF的Blob对象
 * @param tenantId 租户ID
 * @param contractId 合同ID
 * @returns PDF的公开URL
 */
export async function uploadContractPDF(pdfBlob: Blob, tenantId: string, contractId: string): Promise<string> {
  const {supabase} = await import('@/client/supabase')

  // 生成文件名
  const fileName = `${tenantId}/${contractId}/contract_${Date.now()}.pdf`

  // 上传到Supabase Storage
  const {data, error} = await supabase.storage.from('app-7daop8q0sxdt_contract_signatures').upload(fileName, pdfBlob, {
    contentType: 'application/pdf',
    upsert: true
  })

  if (error) {
    console.error('上传PDF失败:', error)
    throw new Error('上传PDF失败')
  }

  // 获取公开URL
  const {
    data: {publicUrl}
  } = supabase.storage.from('app-7daop8q0sxdt_contract_signatures').getPublicUrl(fileName)

  return publicUrl
}

/**
 * 生成并上传合同PDF
 * @param contract 合同数据
 * @param employeeName 员工姓名
 * @param companyName 公司名称
 * @param tenantId 租户ID
 * @returns PDF的公开URL
 */
export async function generateAndUploadContractPDF(
  contract: EmploymentContract,
  employeeName: string,
  companyName: string,
  tenantId: string
): Promise<string> {
  // 生成PDF
  const pdfBlob = await generateContractPDF(contract, employeeName, companyName)

  // 上传PDF
  const pdfUrl = await uploadContractPDF(pdfBlob, tenantId, contract.id)

  return pdfUrl
}
