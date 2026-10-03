/**
 * 劳动合同预览组件
 *
 * 功能：
 * - 显示合同完整内容
 * - 显示电子签名
 * - 支持导出PDF（未来功能）
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import type React from 'react'
import type {EmploymentContract} from '@/db/types-employment'
import {useSignatureViewUrl} from '@/utils/signature-view'

interface ContractPreviewProps {
  contract: EmploymentContract
  employeeName?: string
  companyName?: string
  onClose: () => void
  onSign?: () => void
  showSignButton?: boolean
  signButtonText?: string
  showDownloadButton?: boolean
}

const ContractPreview: React.FC<ContractPreviewProps> = ({
  contract,
  employeeName = '员工姓名',
  companyName = '公司名称',
  onClose,
  onSign,
  showSignButton = false,
  signButtonText = '立即签署',
  showDownloadButton = false
}) => {
  // G0-E: 签名 bucket 私有化后，存量 URL 需在运行时换取签名 URL
  const companySignatureView = useSignatureViewUrl(contract?.company_signature_url)
  const employeeSignatureView = useSignatureViewUrl(contract?.employee_signature_url)

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '____年__月__日'
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 下载PDF
  const handleDownloadPDF = () => {
    if (!contract.contract_pdf_url) {
      Taro.showToast({
        title: 'PDF文件不存在',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 在H5环境中，直接打开PDF链接
    if (process.env.TARO_ENV === 'h5') {
      window.open(contract.contract_pdf_url, '_blank')
    } else {
      // 在小程序环境中，提示用户
      Taro.showModal({
        title: '下载提示',
        content: '请在H5端下载PDF文件',
        showCancel: false
      })
    }
  }

  // 格式化合同类型
  const formatContractType = (type: string) => {
    const typeMap = {
      fixed_term: '固定期限劳动合同',
      indefinite: '无固定期限劳动合同',
      project_based: '以完成一定工作任务为期限的劳动合同'
    }
    return typeMap[type as keyof typeof typeMap] || type
  }

  return (
    <View className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <View className="bg-white rounded-2xl w-full h-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* 标题栏 */}
        <View className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center justify-between">
          <View>
            <Text className="text-lg font-bold text-white">劳动合同预览</Text>
            <Text className="text-xs text-white/80 mt-1">合同编号：{contract.contract_number}</Text>
          </View>
          <View className="i-mdi-close text-2xl text-white" onClick={onClose} />
        </View>

        {/* 合同内容 */}
        <ScrollView scrollY className="flex-1 p-6 bg-gray-50">
          <View className="bg-white rounded-lg p-6 shadow-sm">
            {/* 合同标题 */}
            <View className="text-center mb-6">
              <Text className="text-2xl font-bold text-foreground">劳动合同</Text>
              <Text className="text-sm text-muted-foreground mt-2">{formatContractType(contract.contract_type)}</Text>
            </View>

            {/* 合同编号 */}
            <View className="mb-6 pb-4 border-b border-gray-200">
              <Text className="text-sm text-muted-foreground">合同编号：{contract.contract_number}</Text>
            </View>

            {/* 甲方信息 */}
            <View className="mb-6">
              <Text className="text-base font-bold text-foreground mb-3">甲方（用人单位）</Text>
              <View className="space-y-2">
                <View>
                  <Text className="text-sm text-foreground">单位名称：{companyName}</Text>
                </View>
                <View>
                  <Text className="text-sm text-foreground">法定代表人：__________</Text>
                </View>
                <View>
                  <Text className="text-sm text-foreground">地址：__________</Text>
                </View>
              </View>
            </View>

            {/* 乙方信息 */}
            <View className="mb-6">
              <Text className="text-base font-bold text-foreground mb-3">乙方（劳动者）</Text>
              <View className="space-y-2">
                <View>
                  <Text className="text-sm text-foreground">姓名：{employeeName}</Text>
                </View>
                <View>
                  <Text className="text-sm text-foreground">身份证号：__________</Text>
                </View>
                <View>
                  <Text className="text-sm text-foreground">联系电话：__________</Text>
                </View>
                <View>
                  <Text className="text-sm text-foreground">地址：__________</Text>
                </View>
              </View>
            </View>

            {/* 合同条款 */}
            <View className="mb-6">
              <Text className="text-base font-bold text-foreground mb-3">合同条款</Text>

              {/* 第一条：合同期限 */}
              <View className="mb-4">
                <Text className="text-sm font-bold text-foreground mb-2">第一条 合同期限</Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  本合同为{formatContractType(contract.contract_type)}，合同期限自 {formatDate(contract.start_date)}{' '}
                  起至 {contract.end_date ? formatDate(contract.end_date) : '完成工作任务时'} 止
                  {contract.duration_years ? `，期限为 ${contract.duration_years} 年` : ''}。
                </Text>
              </View>

              {/* 第二条：工作内容和工作地点 */}
              <View className="mb-4">
                <Text className="text-sm font-bold text-foreground mb-2">第二条 工作内容和工作地点</Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  1. 乙方同意根据甲方工作需要，担任 {contract.position} 岗位工作。
                </Text>
                {contract.department && (
                  <Text className="text-sm text-foreground leading-relaxed">2. 工作部门：{contract.department}</Text>
                )}
                {contract.work_location && (
                  <Text className="text-sm text-foreground leading-relaxed">3. 工作地点：{contract.work_location}</Text>
                )}
              </View>

              {/* 第三条：劳动报酬 */}
              <View className="mb-4">
                <Text className="text-sm font-bold text-foreground mb-2">第三条 劳动报酬</Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  甲方按月支付乙方工资，月工资为人民币 {contract.salary.toFixed(2)} 元（税前）。工资发放时间为每月 ____
                  日。
                </Text>
              </View>

              {/* 第四条：工作时间和休息休假 */}
              <View className="mb-4">
                <Text className="text-sm font-bold text-foreground mb-2">第四条 工作时间和休息休假</Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  1. 甲方实行标准工时制度，乙方每日工作时间不超过8小时，每周工作时间不超过40小时。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  2. 乙方享有国家规定的法定节假日、年休假、婚假、产假等带薪假期。
                </Text>
              </View>

              {/* 第五条：社会保险 */}
              <View className="mb-4">
                <Text className="text-sm font-bold text-foreground mb-2">第五条 社会保险</Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  甲方依法为乙方办理养老保险、医疗保险、失业保险、工伤保险、生育保险和住房公积金。
                </Text>
              </View>

              {/* 第六条：劳动保护和劳动条件 */}
              <View className="mb-4">
                <Text className="text-sm font-bold text-foreground mb-2">第六条 劳动保护和劳动条件</Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  甲方根据生产岗位的需要，按照国家有关劳动安全、卫生的规定为乙方配备必要的安全防护措施，发放必要的劳动保护用品。
                </Text>
              </View>

              {/* 第七条：合同的变更、解除和终止 */}
              <View className="mb-4">
                <Text className="text-sm font-bold text-foreground mb-2">第七条 合同的变更、解除和终止</Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  1. 经甲乙双方协商一致，可以变更本合同约定的内容。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  2. 符合法律规定情形的，甲乙双方可以解除本合同。
                </Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  3. 本合同期满或者双方约定的合同终止条件出现，本合同即行终止。
                </Text>
              </View>

              {/* 第八条：违约责任 */}
              <View className="mb-4">
                <Text className="text-sm font-bold text-foreground mb-2">第八条 违约责任</Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  甲乙双方应当按照本合同约定全面履行各自的义务。任何一方违反本合同约定，给对方造成损失的，应当依法承担赔偿责任。
                </Text>
              </View>

              {/* 第九条：争议解决 */}
              <View className="mb-4">
                <Text className="text-sm font-bold text-foreground mb-2">第九条 争议解决</Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  双方因履行本合同发生争议，应当协商解决；协商不成的，可以向劳动争议仲裁委员会申请仲裁。
                </Text>
              </View>

              {/* 第十条：其他约定 */}
              {contract.notes && (
                <View className="mb-4">
                  <Text className="text-sm font-bold text-foreground mb-2">第十条 其他约定</Text>
                  <Text className="text-sm text-foreground leading-relaxed">{contract.notes}</Text>
                </View>
              )}
            </View>

            {/* 签署信息 */}
            <View className="mt-8 pt-6 border-t-2 border-gray-300">
              <View className="grid grid-cols-2 gap-8">
                {/* 甲方签署 */}
                <View>
                  <Text className="text-sm font-bold text-foreground mb-4">甲方（盖章）：</Text>
                  {contract.company_signature_url ? (
                    <View>
                      <Image
                        src={companySignatureView || undefined}
                        mode="aspectFit"
                        className="w-32 h-20 border border-gray-300 rounded"
                      />
                      <Text className="text-xs text-muted-foreground mt-2">
                        签署人：{contract.company_signer_name || '未知'}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        职位：{contract.company_signer_position || '未知'}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        签署时间：{formatDate(contract.company_signature_date)}
                      </Text>
                    </View>
                  ) : (
                    <View className="w-32 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <Text className="text-xs text-muted-foreground">未签署</Text>
                    </View>
                  )}
                </View>

                {/* 乙方签署 */}
                <View>
                  <Text className="text-sm font-bold text-foreground mb-4">乙方（签字）：</Text>
                  {contract.employee_signature_url ? (
                    <View>
                      <Image
                        src={employeeSignatureView || undefined}
                        mode="aspectFit"
                        className="w-32 h-20 border border-gray-300 rounded"
                      />
                      <Text className="text-xs text-muted-foreground mt-2">
                        签署时间：{formatDate(contract.employee_signature_date)}
                      </Text>
                    </View>
                  ) : (
                    <View className="w-32 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <Text className="text-xs text-muted-foreground">未签署</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 签订日期 */}
              <View className="mt-6 text-center">
                <Text className="text-sm text-foreground">签订日期：{formatDate(contract.signed_date)}</Text>
              </View>
            </View>

            {/* 法律声明 */}
            <View className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Text className="text-xs text-blue-800 leading-relaxed">
                本合同一式两份，甲乙双方各执一份，具有同等法律效力。本合同自双方签字盖章之日起生效。
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 底部操作按钮 */}
        <View className="p-4 border-t border-gray-200 bg-white flex gap-3">
          <Button
            className="flex-1 bg-gray-100 text-foreground py-3 rounded-lg break-keep text-sm"
            size="default"
            onClick={onClose}>
            关闭
          </Button>
          {showDownloadButton && contract.contract_pdf_url && (
            <Button
              className="flex-1 bg-green-600 text-white py-3 rounded-lg break-keep text-sm"
              size="default"
              onClick={handleDownloadPDF}>
              下载PDF
            </Button>
          )}
          {showSignButton && onSign && (
            <Button
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg break-keep text-sm"
              size="default"
              onClick={onSign}>
              {signButtonText}
            </Button>
          )}
        </View>
      </View>
    </View>
  )
}

export default ContractPreview
