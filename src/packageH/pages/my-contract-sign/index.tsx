/**
 * 我的合同签署页面（员工端）
 *
 * 功能：
 * - 查看待签署的合同列表
 * - 预览合同内容
 * - 电子签名
 * - 查看已签署的合同
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import ContractPreview from '@/components/signature/ContractPreview'
import SignaturePad from '@/components/signature/SignaturePad'
import {
  getContractWithSignatures,
  getEmployeeContracts,
  getPendingContractsForEmployee,
  signContractByEmployee
} from '@/db/api-employment'
import type {EmploymentContract} from '@/db/types-employment'
import {useTenantStore} from '@/store/tenant'
import {getUserIpAddress, uploadSignature} from '@/utils/signature-upload'

const MyContractSign: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [pendingContracts, setPendingContracts] = useState<EmploymentContract[]>([])
  const [signedContracts, setSignedContracts] = useState<EmploymentContract[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'signed'>('pending')

  // 合同预览和签名
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSignaturePad, setShowSignaturePad] = useState(false)

  // 加载合同列表
  const loadContracts = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      const [pending, all] = await Promise.all([getPendingContractsForEmployee(user.id), getEmployeeContracts(user.id)])

      setPendingContracts(pending)
      setSignedContracts(all.filter((c) => c.signed_by_employee))
    } catch (error) {
      console.error('加载合同列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadContracts()
  })

  // 预览合同
  const handlePreviewContract = async (contract: EmploymentContract) => {
    try {
      Taro.showLoading({title: '加载中...'})

      // 获取最新的合同数据（包含签名信息）
      const latestContract = await getContractWithSignatures(contract.id)

      Taro.hideLoading()

      if (latestContract) {
        setSelectedContract(latestContract)
        setShowPreview(true)
      } else {
        Taro.showToast({
          title: '合同不存在',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('加载合同详情失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 开始签名
  const handleStartSign = () => {
    setShowPreview(false)
    setShowSignaturePad(true)
  }

  // 保存签名并提交
  const handleSaveSignature = async (signatureDataUrl: string) => {
    if (!selectedContract || !currentTenant) return

    try {
      Taro.showLoading({title: '签署中...'})

      // 上传签名图片
      const signatureUrl = await uploadSignature(signatureDataUrl, currentTenant.id, selectedContract.id, 'employee')

      if (!signatureUrl) {
        throw new Error('签名上传失败')
      }

      // 获取IP地址
      const ipAddress = await getUserIpAddress()

      // 提交签署
      const success = await signContractByEmployee(selectedContract.id, signatureUrl, ipAddress)

      Taro.hideLoading()

      if (success) {
        Taro.showToast({
          title: '签署成功！',
          icon: 'success',
          duration: 2000
        })

        setShowSignaturePad(false)

        // 刷新合同列表
        await loadContracts()

        // 重新加载合同详情并显示预览
        const updatedContract = await getContractWithSignatures(selectedContract.id)
        if (updatedContract) {
          setSelectedContract(updatedContract)
          setShowPreview(true)
        }
      } else {
        throw new Error('签署失败')
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('签署合同失败:', error)
      Taro.showToast({
        title: '签署失败，请重试',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '未知'
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 格式化合同类型
  const formatContractType = (type: string) => {
    const typeMap = {
      fixed_term: '固定期限',
      indefinite: '无固定期限',
      project_based: '项目制'
    }
    return typeMap[type as keyof typeof typeMap] || type
  }

  // 获取合同状态标签
  const getStatusBadge = (contract: EmploymentContract) => {
    if (contract.signed_by_employee && contract.signed_by_company) {
      return <View className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">已生效</View>
    }
    if (contract.signed_by_employee) {
      return <View className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">待公司签署</View>
    }
    return <View className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">待签署</View>
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <ScrollView scrollY className="h-screen" style={{background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的劳动合同</Text>
            <Text className="text-sm text-muted-foreground mt-1">查看和签署劳动合同</Text>
          </View>

          {/* 标签页切换 */}
          <View className="flex gap-2 mb-4">
            <View
              className={`flex-1 py-3 rounded-lg text-center transition-all ${
                activeTab === 'pending' ? 'bg-blue-500 text-white' : 'bg-white text-foreground border-2 border-gray-200'
              }`}
              onClick={() => setActiveTab('pending')}>
              <Text className={activeTab === 'pending' ? 'text-white font-bold' : 'text-foreground'}>
                待签署 ({pendingContracts.length})
              </Text>
            </View>
            <View
              className={`flex-1 py-3 rounded-lg text-center transition-all ${
                activeTab === 'signed' ? 'bg-blue-500 text-white' : 'bg-white text-foreground border-2 border-gray-200'
              }`}
              onClick={() => setActiveTab('signed')}>
              <Text className={activeTab === 'signed' ? 'text-white font-bold' : 'text-foreground'}>
                已签署 ({signedContracts.length})
              </Text>
            </View>
          </View>

          {/* 待签署合同列表 */}
          {activeTab === 'pending' && (
            <View>
              {loading ? (
                <View className="text-center py-12">
                  <Text className="text-muted-foreground">加载中...</Text>
                </View>
              ) : pendingContracts.length === 0 ? (
                <View className="bg-white rounded-lg p-8 text-center">
                  <View className="i-mdi-file-document-outline text-6xl text-gray-300 mx-auto mb-4" />
                  <Text className="text-muted-foreground">暂无待签署的合同</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {pendingContracts.map((contract) => (
                    <View key={contract.id} className="bg-white rounded-lg p-4 shadow-sm border-2 border-gray-200">
                      {/* 合同头部 */}
                      <View className="flex items-center justify-between mb-3">
                        <View className="flex items-center gap-2">
                          <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <View className="i-mdi-file-document text-2xl text-blue-600" />
                          </View>
                          <View>
                            <Text className="text-base font-bold text-foreground">{contract.position}</Text>
                            <Text className="text-xs text-muted-foreground">编号：{contract.contract_number}</Text>
                          </View>
                        </View>
                        {getStatusBadge(contract)}
                      </View>

                      {/* 合同信息 */}
                      <View className="space-y-2 mb-3">
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-calendar text-base text-muted-foreground" />
                          <Text className="text-sm text-foreground">
                            {formatDate(contract.start_date)} 至 {formatDate(contract.end_date)}
                          </Text>
                        </View>
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-file-document-outline text-base text-muted-foreground" />
                          <Text className="text-sm text-foreground">{formatContractType(contract.contract_type)}</Text>
                        </View>
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-currency-cny text-base text-muted-foreground" />
                          <Text className="text-sm text-foreground">月薪：¥{contract.salary.toFixed(2)}</Text>
                        </View>
                      </View>

                      {/* 操作按钮 */}
                      <View className="flex gap-2">
                        <Button
                          className="flex-1 bg-gray-100 text-foreground py-2 rounded-lg break-keep text-sm"
                          size="default"
                          onClick={() => handlePreviewContract(contract)}>
                          预览合同
                        </Button>
                        <Button
                          className="flex-1 bg-blue-500 text-white py-2 rounded-lg break-keep text-sm"
                          size="default"
                          onClick={() => handlePreviewContract(contract)}>
                          立即签署
                        </Button>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* 已签署合同列表 */}
          {activeTab === 'signed' && (
            <View>
              {loading ? (
                <View className="text-center py-12">
                  <Text className="text-muted-foreground">加载中...</Text>
                </View>
              ) : signedContracts.length === 0 ? (
                <View className="bg-white rounded-lg p-8 text-center">
                  <View className="i-mdi-file-document-check-outline text-6xl text-gray-300 mx-auto mb-4" />
                  <Text className="text-muted-foreground">暂无已签署的合同</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {signedContracts.map((contract) => (
                    <View key={contract.id} className="bg-white rounded-lg p-4 shadow-sm border-2 border-gray-200">
                      {/* 合同头部 */}
                      <View className="flex items-center justify-between mb-3">
                        <View className="flex items-center gap-2">
                          <View className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <View className="i-mdi-file-document-check text-2xl text-green-600" />
                          </View>
                          <View>
                            <Text className="text-base font-bold text-foreground">{contract.position}</Text>
                            <Text className="text-xs text-muted-foreground">编号：{contract.contract_number}</Text>
                          </View>
                        </View>
                        {getStatusBadge(contract)}
                      </View>

                      {/* 合同信息 */}
                      <View className="space-y-2 mb-3">
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-calendar text-base text-muted-foreground" />
                          <Text className="text-sm text-foreground">
                            {formatDate(contract.start_date)} 至 {formatDate(contract.end_date)}
                          </Text>
                        </View>
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-file-document-outline text-base text-muted-foreground" />
                          <Text className="text-sm text-foreground">{formatContractType(contract.contract_type)}</Text>
                        </View>
                        {contract.employee_signature_date && (
                          <View className="flex items-center gap-2">
                            <View className="i-mdi-check-circle text-base text-green-600" />
                            <Text className="text-sm text-green-600">
                              已签署于 {formatDate(contract.employee_signature_date)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 签名预览 */}
                      {contract.employee_signature_url && (
                        <View className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <Text className="text-xs text-muted-foreground mb-2">我的签名：</Text>
                          <Image
                            src={contract.employee_signature_url}
                            mode="aspectFit"
                            className="w-24 h-16 border border-gray-300 rounded"
                          />
                        </View>
                      )}

                      {/* 操作按钮 */}
                      <Button
                        className="w-full bg-blue-500 text-white py-2 rounded-lg break-keep text-sm"
                        size="default"
                        onClick={() => handlePreviewContract(contract)}>
                        查看合同
                      </Button>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 合同预览弹窗 */}
      {showPreview && selectedContract && (
        <ContractPreview
          contract={selectedContract}
          employeeName={user?.user_metadata?.name || '员工'}
          companyName={currentTenant?.name || '公司'}
          onClose={() => setShowPreview(false)}
          onSign={handleStartSign}
          showSignButton={!selectedContract.signed_by_employee}
          signButtonText="立即签署"
        />
      )}

      {/* 签名画板弹窗 */}
      {showSignaturePad && (
        <SignaturePad
          onSave={handleSaveSignature}
          onCancel={() => {
            setShowSignaturePad(false)
            setShowPreview(true)
          }}
        />
      )}
    </View>
  )
}

export default MyContractSign
