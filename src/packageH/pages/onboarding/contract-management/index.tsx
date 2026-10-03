/**
 * 劳动合同管理页面（HR端）
 *
 * 功能：
 * - 查看所有员工的劳动合同
 * - 管理合同签署状态
 * - 查看即将到期的合同
 * - 合同续签提醒
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import ContractPreview from '@/components/signature/ContractPreview'
import SignaturePad from '@/components/signature/SignaturePad'
import {
  createEmploymentContract,
  getContractWithSignatures,
  getExpiringContracts,
  getPendingContractsForCompany,
  getTenantContracts,
  signContractByCompany,
  signContractByCompanyWithSignature
} from '@/db/api-employment'
import type {EmploymentContract} from '@/db/types-employment'
import {useTenantStore} from '@/store/tenant'
import {getUserIpAddress, uploadSignature} from '@/utils/signature-upload'

const ContractManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [contracts, setContracts] = useState<EmploymentContract[]>([])
  const [expiringContracts, setExpiringContracts] = useState<EmploymentContract[]>([])
  const [pendingSignContracts, setPendingSignContracts] = useState<EmploymentContract[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'expiring' | 'pending_sign'>('all')
  const [signerInfo, setSignerInfo] = useState({
    name: '',
    position: ''
  })

  // 新增合同表单
  const [addForm, setAddForm] = useState({
    employee_id: '',
    contract_number: '',
    contract_type: 'fixed_term' as 'fixed_term' | 'indefinite' | 'project_based',
    start_date: '',
    end_date: '',
    duration_years: '',
    position: '',
    department: '',
    salary: '',
    work_location: '',
    notes: ''
  })

  // 续签合同表单
  const [renewForm, setRenewForm] = useState({
    start_date: '',
    end_date: '',
    duration_years: '',
    salary: '',
    notes: ''
  })

  // 加载合同列表
  const loadContracts = useCallback(async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const [allContracts, expiring, pendingSign] = await Promise.all([
        getTenantContracts(currentTenant.id),
        getExpiringContracts(currentTenant.id, 30),
        getPendingContractsForCompany(currentTenant.id)
      ])

      setContracts(allContracts)
      setExpiringContracts(expiring)
      setPendingSignContracts(pendingSign)
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
  }, [currentTenant])

  useDidShow(() => {
    loadContracts()
  })

  // 打开合同详情
  const _handleOpenDetail = (contract: EmploymentContract) => {
    setSelectedContract(contract)
    setShowDetailModal(true)
  }

  // 公司签署合同（旧版本，保留用于兼容）
  const handleSignByCompany = async (contractId: string) => {
    try {
      Taro.showLoading({title: '签署中...'})

      const success = await signContractByCompany(contractId)

      Taro.hideLoading()

      if (success) {
        Taro.showToast({
          title: '签署成功！',
          icon: 'success',
          duration: 2000
        })

        setShowDetailModal(false)
        loadContracts()
      } else {
        Taro.showToast({
          title: '签署失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('签署合同失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 预览合同（新版本，支持电子签名）
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

  // 开始签名（需要先输入签署人信息）
  const handleStartSign = () => {
    // 使用默认的签署人信息
    setSignerInfo({
      name: user?.user_metadata?.name || 'HR经理',
      position: 'HR经理'
    })
    setShowPreview(false)
    setShowSignaturePad(true)
  }

  // 保存签名并提交
  const handleSaveSignature = async (signatureDataUrl: string) => {
    if (!selectedContract || !currentTenant) return

    try {
      Taro.showLoading({title: '签署中...'})

      // 上传签名图片
      const signatureUrl = await uploadSignature(signatureDataUrl, currentTenant.id, selectedContract.id, 'company')

      if (!signatureUrl) {
        throw new Error('签名上传失败')
      }

      // 获取IP地址
      const ipAddress = await getUserIpAddress()

      // 提交签署
      const success = await signContractByCompanyWithSignature(
        selectedContract.id,
        signatureUrl,
        ipAddress,
        signerInfo.name || 'HR经理',
        signerInfo.position || '人力资源部'
      )

      if (success) {
        // 更新加载提示
        Taro.showLoading({title: '生成合同PDF...'})

        // 生成并上传合同PDF
        try {
          const {generateAndUploadContractPDF} = await import('@/utils/contract-pdf-generator')
          const {saveContractPdfUrl} = await import('@/db/api-employment')

          // 重新获取合同详情（包含最新的签名信息）
          const updatedContract = await getContractWithSignatures(selectedContract.id)
          if (updatedContract) {
            // 生成PDF（使用职位作为员工标识）
            const pdfUrl = await generateAndUploadContractPDF(
              updatedContract,
              updatedContract.position || '员工',
              currentTenant.name,
              currentTenant.id
            )

            // 保存PDF URL到数据库
            await saveContractPdfUrl(selectedContract.id, pdfUrl)

            console.log('合同PDF生成成功:', pdfUrl)
          }
        } catch (pdfError) {
          console.error('生成PDF失败:', pdfError)
          // PDF生成失败不影响签署流程，只记录错误
        }

        Taro.hideLoading()

        Taro.showToast({
          title: '签署成功！合同已生效',
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

  // 打开新增合同弹窗
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0]
    // 默认合同期限3年
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 3)
    const endDateStr = endDate.toISOString().split('T')[0]

    setAddForm({
      employee_id: '',
      contract_number: `CT${Date.now()}`,
      contract_type: 'fixed_term',
      start_date: today,
      end_date: endDateStr,
      duration_years: '3',
      position: '',
      department: '',
      salary: '',
      work_location: '',
      notes: ''
    })
    setShowAddModal(true)
  }

  // 提交新增合同
  const handleSubmitAdd = async () => {
    if (!currentTenant) return

    // 验证必填项
    if (
      !addForm.employee_id ||
      !addForm.contract_number ||
      !addForm.start_date ||
      !addForm.position ||
      !addForm.salary
    ) {
      Taro.showToast({
        title: '请填写所有必填项',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      Taro.showLoading({title: '创建中...'})

      const result = await createEmploymentContract({
        tenant_id: currentTenant.id,
        employee_id: addForm.employee_id,
        contract_number: addForm.contract_number,
        contract_type: addForm.contract_type,
        start_date: addForm.start_date,
        end_date: addForm.contract_type === 'indefinite' ? null : addForm.end_date || null,
        duration_years: addForm.duration_years ? Number.parseInt(addForm.duration_years, 10) : null,
        position: addForm.position,
        department: addForm.department || null,
        salary: Number.parseFloat(addForm.salary),
        work_location: addForm.work_location || null,
        contract_status: 'draft',
        signed_date: null,
        signed_by_employee: false,
        signed_by_company: false,
        contract_file_url: null,
        notes: addForm.notes || null
      })

      Taro.hideLoading()

      if (result) {
        Taro.showToast({
          title: '创建成功！',
          icon: 'success',
          duration: 2000
        })

        setShowAddModal(false)
        loadContracts()
      } else {
        Taro.showToast({
          title: '创建失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('创建合同失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 打开续签合同弹窗
  const handleOpenRenew = (contract: EmploymentContract) => {
    const today = new Date().toISOString().split('T')[0]
    // 默认续签3年
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + 3)
    const endDateStr = endDate.toISOString().split('T')[0]

    setSelectedContract(contract)
    setRenewForm({
      start_date: today,
      end_date: endDateStr,
      duration_years: '3',
      salary: contract.salary.toString(),
      notes: ''
    })
    setShowDetailModal(false)
    setShowRenewModal(true)
  }

  // 提交续签合同
  const handleSubmitRenew = async () => {
    if (!currentTenant || !selectedContract) return

    // 验证必填项
    if (!renewForm.start_date || !renewForm.salary) {
      Taro.showToast({
        title: '请填写所有必填项',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      Taro.showLoading({title: '续签中...'})

      // 创建新合同（续签）
      const result = await createEmploymentContract({
        tenant_id: currentTenant.id,
        employee_id: selectedContract.employee_id,
        contract_number: `${selectedContract.contract_number}-R${Date.now()}`,
        contract_type: selectedContract.contract_type,
        start_date: renewForm.start_date,
        end_date: selectedContract.contract_type === 'indefinite' ? null : renewForm.end_date || null,
        duration_years: renewForm.duration_years ? Number.parseInt(renewForm.duration_years, 10) : null,
        position: selectedContract.position,
        department: selectedContract.department,
        salary: Number.parseFloat(renewForm.salary),
        work_location: selectedContract.work_location,
        contract_status: 'draft',
        signed_date: null,
        signed_by_employee: false,
        signed_by_company: false,
        contract_file_url: null,
        notes: renewForm.notes || null
      })

      Taro.hideLoading()

      if (result) {
        Taro.showToast({
          title: '续签成功！',
          icon: 'success',
          duration: 2000
        })

        setShowRenewModal(false)
        loadContracts()
      } else {
        Taro.showToast({
          title: '续签失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('续签合同失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 获取合同类型文本
  const getContractTypeText = (type: string) => {
    const typeMap: Record<string, string> = {
      fixed_term: '固定期限',
      indefinite: '无固定期限',
      project_based: '项目制'
    }
    return typeMap[type] || type
  }

  // 获取合同状态信息
  const getContractStatusInfo = (contract: EmploymentContract) => {
    if (contract.contract_status === 'active') {
      return {text: '生效中', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    }
    if (contract.contract_status === 'draft') {
      if (!contract.signed_by_employee) {
        return {text: '待员工签署', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
      }
      if (!contract.signed_by_company) {
        return {text: '待公司签署', color: 'text-white', bgColor: 'bg-blue-100'}
      }
      return {text: '待生效', color: 'text-white', bgColor: 'bg-blue-100'}
    }
    if (contract.contract_status === 'expired') {
      return {text: '已到期', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
    }
    if (contract.contract_status === 'terminated') {
      return {text: '已终止', color: 'text-red-600', bgColor: 'bg-blue-100'}
    }
    return {text: contract.contract_status, color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 计算剩余天数
  const calculateRemainingDays = (endDate: string | null) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // 获取显示的合同列表
  const displayContracts =
    activeTab === 'all' ? contracts : activeTab === 'pending_sign' ? pendingSignContracts : expiringContracts

  // 租户检查
  if (!currentTenant) {
    return (
      <View className="@container min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border bg-transparent">
          <View className="p-4 max-sm:p-3">
            <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200">
              <View className="flex flex-col items-center justify-center py-12 max-sm:py-8 max-sm:py-6">
                <View className="i-mdi-alert-circle text-6xl text-muted-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
                <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
                  请先选择租户
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-6 text-center">
                  您需要先选择一个租户才能访问劳动合同管理功能
                </Text>
                <Button
                  size="default"
                  className="bg-blue-100 text-white px-6 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                  onClick={() => {
                    Taro.navigateTo({url: '/pages/tenant-select/index'})
                  }}>
                  选择租户
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 max-sm:p-3 space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
          {/* 顶部标题卡片 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="flex flex-row items-center flex-1">
                <View className="i-mdi-file-document-multiple text-4xl max-sm:text-3xl text-blue-600 mr-3 max-sm:mr-2" />
                <View className="flex-1">
                  <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                    劳动合同管理
                  </Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                    管理所有员工的劳动合同
                  </Text>
                </View>
              </View>
              <Button
                className="bg-green-500 text-white active:opacity-80 transition-all px-4 max-sm:px-3 max-sm:px-2 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                size="default"
                onClick={handleOpenAdd}>
                <View className="flex flex-row items-center gap-1">
                  <View className="i-mdi-plus text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px]" />
                  <Text className="text-white">新增</Text>
                </View>
              </Button>
            </View>

            {/* 统计信息 */}
            <View className="flex flex-row gap-4 max-sm:p-3">
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">全部合同</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600 mt-1">
                  {contracts.length}
                </Text>
              </View>
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">生效中</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {contracts.filter((c) => c.contract_status === 'active').length}
                </Text>
              </View>
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">即将到期</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {expiringContracts.length}
                </Text>
              </View>
            </View>
          </View>

          {/* 标签切换 */}
          <View className="flex flex-row gap-2 max-sm:gap-1.5">
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all ${
                activeTab === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-muted-foreground'
              }`}
              size="default"
              onClick={() => setActiveTab('all')}>
              全部合同
            </Button>
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all ${
                activeTab === 'pending_sign' ? 'bg-orange-500 text-white' : 'bg-white text-muted-foreground'
              }`}
              size="default"
              onClick={() => setActiveTab('pending_sign')}>
              待签署 ({pendingSignContracts.length})
            </Button>
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all ${
                activeTab === 'expiring' ? 'bg-red-500 text-white' : 'bg-white text-muted-foreground'
              }`}
              size="default"
              onClick={() => setActiveTab('expiring')}>
              即将到期
            </Button>
          </View>

          {/* 合同列表 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              {activeTab === 'all' ? '合同列表' : activeTab === 'pending_sign' ? '待签署的合同' : '即将到期的合同'}
            </Text>

            {loading ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-loading text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
              </View>
            ) : displayContracts.length === 0 ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-file-document-outline text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                  {activeTab === 'all'
                    ? '暂无劳动合同'
                    : activeTab === 'pending_sign'
                      ? '暂无待签署的合同'
                      : '暂无即将到期的合同'}
                </Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {displayContracts.map((contract) => {
                  const statusInfo = getContractStatusInfo(contract)
                  const remainingDays = calculateRemainingDays(contract.end_date)

                  return (
                    <View key={contract.id} className="border border-border rounded-xl p-4 max-sm:p-3">
                      {/* 合同标题 */}
                      <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex-1">
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                            {contract.position}
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                            合同编号：{contract.contract_number}
                          </Text>
                        </View>
                        <View className={`${statusInfo.bgColor} px-3 max-sm:px-2 py-1 rounded-full`}>
                          <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>

                      {/* 合同信息 */}
                      <View className="space-y-2 max-sm:space-y-1.5 mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            员工ID
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {contract.employee_id.substring(0, 8)}
                          </Text>
                        </View>
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            合同类型
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {getContractTypeText(contract.contract_type)}
                          </Text>
                        </View>
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            开始日期
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {formatDate(contract.start_date)}
                          </Text>
                        </View>
                        {contract.end_date && (
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              结束日期
                            </Text>
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                              {formatDate(contract.end_date)}
                            </Text>
                          </View>
                        )}
                        {remainingDays !== null && remainingDays > 0 && (
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              剩余天数
                            </Text>
                            <Text
                              className={`text-sm max-sm:text-xs max-sm:text-[10px] font-bold ${remainingDays <= 30 ? 'text-muted-foreground' : 'text-blue-600'}`}>
                              {remainingDays}天
                            </Text>
                          </View>
                        )}
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">月薪</Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                            ¥{contract.salary.toLocaleString()}
                          </Text>
                        </View>
                      </View>

                      {/* 操作按钮 */}
                      <View className="flex flex-row gap-2 max-sm:gap-1.5">
                        <Button
                          className="flex-1 bg-blue-100 text-foreground py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                          size="default"
                          onClick={() => handlePreviewContract(contract)}>
                          {activeTab === 'pending_sign' ? '预览并签署' : '查看详情'}
                        </Button>
                        {activeTab === 'pending_sign' && contract.signed_by_employee && !contract.signed_by_company && (
                          <Button
                            className="flex-1 bg-orange-500 text-white py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                            size="default"
                            onClick={() => handlePreviewContract(contract)}>
                            立即签署
                          </Button>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 温馨提示 */}
          <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 font-medium mb-1">
                  温馨提示
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                  • 合同到期前30天会显示在"即将到期"列表{'\n'}• 请及时处理待签署的合同{'\n'}•
                  合同到期后需要及时续签或终止
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 合同详情弹窗 */}
      {showDetailModal && selectedContract && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{zIndex: 1000}}
          onClick={() => setShowDetailModal(false)}>
          <View
            className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mx-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{maxHeight: '80vh', overflowY: 'auto'}}>
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              合同详情
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 基本信息 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  基本信息
                </Text>
                <View className="space-y-2 max-sm:space-y-1.5">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">合同编号</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {selectedContract.contract_number}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">员工ID</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {selectedContract.employee_id.substring(0, 8)}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">岗位</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {selectedContract.position}
                    </Text>
                  </View>
                  {selectedContract.department && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">部门</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        {selectedContract.department}
                      </Text>
                    </View>
                  )}
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">月薪</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                      ¥{selectedContract.salary.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 合同期限 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  合同期限
                </Text>
                <View className="space-y-2 max-sm:space-y-1.5">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">合同类型</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {getContractTypeText(selectedContract.contract_type)}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">开始日期</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {formatDate(selectedContract.start_date)}
                    </Text>
                  </View>
                  {selectedContract.end_date && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">结束日期</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        {formatDate(selectedContract.end_date)}
                      </Text>
                    </View>
                  )}
                  {selectedContract.duration_years && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">合同期限</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        {selectedContract.duration_years}年
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 签署状态 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  签署状态
                </Text>
                <View className="space-y-2 max-sm:space-y-1.5">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">员工签署</Text>
                    <View className="flex flex-row items-center">
                      {selectedContract.signed_by_employee ? (
                        <>
                          <View className="i-mdi-check-circle text-muted-foreground text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] mr-1" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground">
                            已签署
                          </Text>
                        </>
                      ) : (
                        <>
                          <View className="i-mdi-clock-outline text-muted-foreground text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] mr-1" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground">
                            待签署
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">公司签署</Text>
                    <View className="flex flex-row items-center">
                      {selectedContract.signed_by_company ? (
                        <>
                          <View className="i-mdi-check-circle text-muted-foreground text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] mr-1" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground">
                            已签署
                          </Text>
                        </>
                      ) : (
                        <>
                          <View className="i-mdi-clock-outline text-muted-foreground text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] mr-1" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground">
                            待签署
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                  {selectedContract.signed_date && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">签署日期</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        {formatDate(selectedContract.signed_date)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {selectedContract.notes && (
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                    备注
                  </Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                    {selectedContract.notes}
                  </Text>
                </View>
              )}
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
              {selectedContract.contract_status === 'draft' &&
                selectedContract.signed_by_employee &&
                !selectedContract.signed_by_company && (
                  <Button
                    className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                    size="default"
                    onClick={() => handleSignByCompany(selectedContract.id)}>
                    公司签署
                  </Button>
                )}
              {(selectedContract.contract_status === 'active' || selectedContract.contract_status === 'expired') && (
                <Button
                  className="flex-1 bg-green-600 text-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                  size="default"
                  onClick={() => handleOpenRenew(selectedContract)}>
                  续签合同
                </Button>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 新增合同弹窗 */}
      {showAddModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 max-sm:p-3">
          <ScrollView
            scrollY
            className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 w-full max-w-md max-h-[80vh]">
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              新增劳动合同
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 员工ID */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  员工ID <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入员工ID"
                    value={addForm.employee_id}
                    onInput={(e) => setAddForm({...addForm, employee_id: e.detail.value})}
                  />
                </View>
              </View>

              {/* 合同编号 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  合同编号 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入合同编号"
                    value={addForm.contract_number}
                    onInput={(e) => setAddForm({...addForm, contract_number: e.detail.value})}
                  />
                </View>
              </View>

              {/* 合同类型 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  合同类型 <Text className="text-red-500">*</Text>
                </Text>
                <Picker
                  mode="selector"
                  range={['固定期限', '无固定期限', '项目制']}
                  value={addForm.contract_type === 'fixed_term' ? 0 : addForm.contract_type === 'indefinite' ? 1 : 2}
                  onChange={(e) => {
                    const types: ('fixed_term' | 'indefinite' | 'project_based')[] = [
                      'fixed_term',
                      'indefinite',
                      'project_based'
                    ]
                    setAddForm({...addForm, contract_type: types[e.detail.value]})
                  }}>
                  <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                    <Text className="text-foreground">
                      {addForm.contract_type === 'fixed_term'
                        ? '固定期限'
                        : addForm.contract_type === 'indefinite'
                          ? '无固定期限'
                          : '项目制'}
                    </Text>
                  </View>
                </Picker>
              </View>

              {/* 开始日期 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  开始日期 <Text className="text-red-500">*</Text>
                </Text>
                <Picker
                  mode="date"
                  value={addForm.start_date}
                  onChange={(e) => setAddForm({...addForm, start_date: e.detail.value})}>
                  <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                    <Text className="text-foreground">{addForm.start_date || '请选择开始日期'}</Text>
                  </View>
                </Picker>
              </View>

              {/* 结束日期（固定期限才显示） */}
              {addForm.contract_type === 'fixed_term' && (
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                    结束日期
                  </Text>
                  <Picker
                    mode="date"
                    value={addForm.end_date}
                    onChange={(e) => setAddForm({...addForm, end_date: e.detail.value})}>
                    <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                      <Text className="text-foreground">{addForm.end_date || '请选择结束日期'}</Text>
                    </View>
                  </Picker>
                </View>
              )}

              {/* 合同期限（年） */}
              {addForm.contract_type === 'fixed_term' && (
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                    合同期限（年）
                  </Text>
                  <View style={{overflow: 'hidden'}}>
                    <Input
                      className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                      placeholder="请输入合同期限"
                      type="number"
                      value={addForm.duration_years}
                      onInput={(e) => setAddForm({...addForm, duration_years: e.detail.value})}
                    />
                  </View>
                </View>
              )}

              {/* 职位 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  职位 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入职位"
                    value={addForm.position}
                    onInput={(e) => setAddForm({...addForm, position: e.detail.value})}
                  />
                </View>
              </View>

              {/* 部门 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  部门
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入部门"
                    value={addForm.department}
                    onInput={(e) => setAddForm({...addForm, department: e.detail.value})}
                  />
                </View>
              </View>

              {/* 薪资 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  薪资 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入薪资"
                    type="digit"
                    value={addForm.salary}
                    onInput={(e) => setAddForm({...addForm, salary: e.detail.value})}
                  />
                </View>
              </View>

              {/* 工作地点 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  工作地点
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入工作地点"
                    value={addForm.work_location}
                    onInput={(e) => setAddForm({...addForm, work_location: e.detail.value})}
                  />
                </View>
              </View>

              {/* 备注 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  备注
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入备注信息"
                    value={addForm.notes}
                    onInput={(e) => setAddForm({...addForm, notes: e.detail.value})}
                    maxlength={200}
                  />
                </View>
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={handleSubmitAdd}>
                确定
              </Button>
            </View>
          </ScrollView>
        </View>
      )}

      {/* 续签合同弹窗 */}
      {showRenewModal && selectedContract && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 max-sm:p-3">
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 w-full max-w-md">
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              续签劳动合同
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 员工信息 */}
              <View className="bg-blue-100 rounded-lg p-3">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">员工ID</Text>
                <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mt-1">
                  {selectedContract.employee_id.substring(0, 8)}
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-2">原合同编号</Text>
                <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mt-1">
                  {selectedContract.contract_number}
                </Text>
              </View>

              {/* 开始日期 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  开始日期 <Text className="text-red-500">*</Text>
                </Text>
                <Picker
                  mode="date"
                  value={renewForm.start_date}
                  onChange={(e) => setRenewForm({...renewForm, start_date: e.detail.value})}>
                  <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                    <Text className="text-foreground">{renewForm.start_date || '请选择开始日期'}</Text>
                  </View>
                </Picker>
              </View>

              {/* 结束日期 */}
              {selectedContract.contract_type === 'fixed_term' && (
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                    结束日期
                  </Text>
                  <Picker
                    mode="date"
                    value={renewForm.end_date}
                    onChange={(e) => setRenewForm({...renewForm, end_date: e.detail.value})}>
                    <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                      <Text className="text-foreground">{renewForm.end_date || '请选择结束日期'}</Text>
                    </View>
                  </Picker>
                </View>
              )}

              {/* 合同期限（年） */}
              {selectedContract.contract_type === 'fixed_term' && (
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                    合同期限（年）
                  </Text>
                  <View style={{overflow: 'hidden'}}>
                    <Input
                      className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                      placeholder="请输入合同期限"
                      type="number"
                      value={renewForm.duration_years}
                      onInput={(e) => setRenewForm({...renewForm, duration_years: e.detail.value})}
                    />
                  </View>
                </View>
              )}

              {/* 薪资 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  薪资 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入薪资"
                    type="digit"
                    value={renewForm.salary}
                    onInput={(e) => setRenewForm({...renewForm, salary: e.detail.value})}
                  />
                </View>
              </View>

              {/* 备注 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  备注
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入备注信息"
                    value={renewForm.notes}
                    onInput={(e) => setRenewForm({...renewForm, notes: e.detail.value})}
                    maxlength={200}
                  />
                </View>
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={() => setShowRenewModal(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={handleSubmitRenew}>
                确定续签
              </Button>
            </View>
          </View>
        </View>
      )}

      {/* 合同预览弹窗（支持电子签名） */}
      {showPreview && selectedContract && (
        <ContractPreview
          contract={selectedContract}
          employeeName="员工"
          companyName={currentTenant?.name || '公司'}
          onClose={() => setShowPreview(false)}
          onSign={handleStartSign}
          showSignButton={selectedContract.signed_by_employee && !selectedContract.signed_by_company}
          signButtonText="公司签署"
          showDownloadButton={selectedContract.signed_by_company && !!selectedContract.contract_pdf_url}
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

export default ContractManagement
