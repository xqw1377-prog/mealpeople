/**
 * 我的劳动合同页面（员工端）
 *
 * 功能：
 * - 查看我的劳动合同列表
 * - 查看合同详情
 * - 签署合同
 * - 下载合同
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getEmployeeContracts} from '@/db/api-employment'
import type {EmploymentContract} from '@/db/types-employment'

const MyContract: React.FC = () => {
  const {user} = useAuth({guard: true})

  // 状态管理
  const [contracts, setContracts] = useState<EmploymentContract[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedContract, setSelectedContract] = useState<EmploymentContract | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // 加载合同列表
  const loadContracts = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getEmployeeContracts(user.id)
      setContracts(data)
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
  }, [user])

  useDidShow(() => {
    loadContracts()
  })

  // 打开合同详情
  const handleOpenDetail = (contract: EmploymentContract) => {
    setSelectedContract(contract)
    setShowDetailModal(true)
  }

  // 跳转到合同签署页面
  const _handleGoToSign = () => {
    Taro.navigateTo({
      url: '/packageH/pages/my-contract-sign/index'
    })
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

  // 获取合同状态文本和样式
  const getContractStatusInfo = (contract: EmploymentContract) => {
    if (contract.contract_status === 'active') {
      return {text: '生效中', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    }
    if (contract.contract_status === 'draft') {
      if (!contract.signed_by_employee) {
        return {text: '待签署', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
      }
      return {text: '待公司签署', color: 'text-white', bgColor: 'bg-blue-100'}
    }
    if (contract.contract_status === 'expired') {
      return {text: '已到期', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
    }
    if (contract.contract_status === 'terminated') {
      return {text: '已终止', color: 'text-red-600', bgColor: 'bg-blue-100'}
    }
    return {text: contract.contract_status, color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 顶部标题卡片 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex flex-row items-center mb-4">
              <View className="i-mdi-file-document text-4xl text-blue-600 mr-3" />
              <View className="flex-1">
                <Text className="text-2xl font-bold text-blue-600">我的劳动合同</Text>
                <Text className="text-sm text-muted-foreground mt-1">查看和签署劳动合同</Text>
              </View>
            </View>

            {/* 统计信息 */}
            <View className="flex flex-row gap-4">
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs text-muted-foreground">全部合同</Text>
                <Text className="text-2xl font-bold text-blue-600 mt-1">{contracts.length}</Text>
              </View>
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs text-muted-foreground">生效中</Text>
                <Text className="text-2xl font-bold text-muted-foreground mt-1">
                  {contracts.filter((c) => c.contract_status === 'active').length}
                </Text>
              </View>
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs text-muted-foreground">待签署</Text>
                <Text className="text-2xl font-bold text-muted-foreground mt-1">
                  {contracts.filter((c) => c.contract_status === 'draft' && !c.signed_by_employee).length}
                </Text>
              </View>
            </View>
          </View>

          {/* 合同列表 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-4">合同列表</Text>

            {loading ? (
              <View className="text-center py-8">
                <View className="i-mdi-loading text-4xl text-blue-600 animate-spin mb-2" />
                <Text className="text-sm text-muted-foreground">加载中...</Text>
              </View>
            ) : contracts.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-file-document-outline text-4xl text-muted-foreground mb-2" />
                <Text className="text-sm text-muted-foreground">暂无劳动合同</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {contracts.map((contract) => {
                  const statusInfo = getContractStatusInfo(contract)

                  return (
                    <View key={contract.id} className="border border-border rounded-xl p-4">
                      {/* 合同标题 */}
                      <View className="flex flex-row items-center justify-between mb-3">
                        <View className="flex-1">
                          <Text className="text-base font-bold text-foreground">{contract.position}</Text>
                          <Text className="text-xs text-muted-foreground mt-1">
                            合同编号：{contract.contract_number}
                          </Text>
                        </View>
                        <View className={`${statusInfo.bgColor} px-3 py-1 rounded-full`}>
                          <Text className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</Text>
                        </View>
                      </View>

                      {/* 合同信息 */}
                      <View className="space-y-2 mb-3">
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm text-muted-foreground">合同类型</Text>
                          <Text className="text-sm font-medium text-foreground">
                            {getContractTypeText(contract.contract_type)}
                          </Text>
                        </View>
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm text-muted-foreground">开始日期</Text>
                          <Text className="text-sm font-medium text-foreground">{formatDate(contract.start_date)}</Text>
                        </View>
                        {contract.end_date && (
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm text-muted-foreground">结束日期</Text>
                            <Text className="text-sm font-medium text-foreground">{formatDate(contract.end_date)}</Text>
                          </View>
                        )}
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm text-muted-foreground">月薪</Text>
                          <Text className="text-sm font-bold text-blue-600">¥{contract.salary.toLocaleString()}</Text>
                        </View>
                      </View>

                      {/* 操作按钮 */}
                      <View className="flex flex-row gap-2">
                        <Button
                          className="flex-1 bg-blue-100 text-white py-2 rounded-lg break-keep text-sm"
                          size="default"
                          onClick={() => handleOpenDetail(contract)}>
                          查看详情
                        </Button>
                        {contract.contract_status === 'draft' && !contract.signed_by_employee && (
                          <Button
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg break-keep text-sm"
                            size="default"
                            onClick={_handleGoToSign}>
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
          <View className="bg-blue-100 rounded-xl p-4">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-xl text-blue-600 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm text-blue-600 font-medium mb-1">温馨提示</Text>
                <Text className="text-xs text-muted-foreground">
                  • 请仔细阅读合同条款后再签署{'\n'}• 签署后合同将具有法律效力{'\n'}• 如有疑问请联系HR部门
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
            className="bg-white rounded-lg p-6 border-2 border-gray-200 mx-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{maxHeight: '80vh', overflowY: 'auto'}}>
            <Text className="text-xl font-bold text-foreground mb-4">合同详情</Text>

            <View className="space-y-4">
              {/* 基本信息 */}
              <View>
                <Text className="text-sm font-medium text-muted-foreground mb-2">基本信息</Text>
                <View className="space-y-2">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">合同编号</Text>
                    <Text className="text-sm font-medium text-foreground">{selectedContract.contract_number}</Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">岗位</Text>
                    <Text className="text-sm font-medium text-foreground">{selectedContract.position}</Text>
                  </View>
                  {selectedContract.department && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">部门</Text>
                      <Text className="text-sm font-medium text-foreground">{selectedContract.department}</Text>
                    </View>
                  )}
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">月薪</Text>
                    <Text className="text-sm font-bold text-blue-600">¥{selectedContract.salary.toLocaleString()}</Text>
                  </View>
                </View>
              </View>

              {/* 合同期限 */}
              <View>
                <Text className="text-sm font-medium text-muted-foreground mb-2">合同期限</Text>
                <View className="space-y-2">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">合同类型</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {getContractTypeText(selectedContract.contract_type)}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">开始日期</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {formatDate(selectedContract.start_date)}
                    </Text>
                  </View>
                  {selectedContract.end_date && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">结束日期</Text>
                      <Text className="text-sm font-medium text-foreground">
                        {formatDate(selectedContract.end_date)}
                      </Text>
                    </View>
                  )}
                  {selectedContract.duration_years && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">合同期限</Text>
                      <Text className="text-sm font-medium text-foreground">{selectedContract.duration_years}年</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 签署状态 */}
              <View>
                <Text className="text-sm font-medium text-muted-foreground mb-2">签署状态</Text>
                <View className="space-y-2">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">员工签署</Text>
                    <View className="flex flex-row items-center">
                      {selectedContract.signed_by_employee ? (
                        <>
                          <View className="i-mdi-check-circle text-muted-foreground text-base mr-1" />
                          <Text className="text-sm font-medium text-muted-foreground">已签署</Text>
                        </>
                      ) : (
                        <>
                          <View className="i-mdi-clock-outline text-muted-foreground text-base mr-1" />
                          <Text className="text-sm font-medium text-muted-foreground">待签署</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-sm text-muted-foreground">公司签署</Text>
                    <View className="flex flex-row items-center">
                      {selectedContract.signed_by_company ? (
                        <>
                          <View className="i-mdi-check-circle text-muted-foreground text-base mr-1" />
                          <Text className="text-sm font-medium text-muted-foreground">已签署</Text>
                        </>
                      ) : (
                        <>
                          <View className="i-mdi-clock-outline text-muted-foreground text-base mr-1" />
                          <Text className="text-sm font-medium text-muted-foreground">待签署</Text>
                        </>
                      )}
                    </View>
                  </View>
                  {selectedContract.signed_date && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">签署日期</Text>
                      <Text className="text-sm font-medium text-foreground">
                        {formatDate(selectedContract.signed_date)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {selectedContract.notes && (
                <View>
                  <Text className="text-sm font-medium text-muted-foreground mb-2">备注</Text>
                  <Text className="text-sm text-foreground">{selectedContract.notes}</Text>
                </View>
              )}
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 rounded-lg break-keep text-base"
                size="default"
                onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
              {selectedContract.contract_status === 'draft' && !selectedContract.signed_by_employee && (
                <Button
                  className="flex-1 bg-blue-100 text-white py-3 rounded-lg break-keep text-base"
                  size="default"
                  onClick={_handleGoToSign}>
                  立即签署
                </Button>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default MyContract
