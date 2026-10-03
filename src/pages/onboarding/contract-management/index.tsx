/**
 * 劳动合同管理页面
 * HR管理员工劳动合同
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {getEmployeeByUserId, getEmployeesByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'

// 合同接口
interface Contract {
  id: string
  employee_id: string
  employee_name: string
  contract_type: string
  start_date: string
  end_date?: string
  status: 'active' | 'expired' | 'terminated'
}

export default function ContractManagement() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [_employees, setEmployees] = useState<Employee[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      const employeeList = await getEmployeesByTenantId(employee.tenant_id)
      setEmployees(employeeList)

      // TODO: 从数据库加载合同数据
      const mockContracts: Contract[] = []
      setContracts(mockContracts)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadData()
  })

  // 添加合同
  const handleAddContract = () => {
    Taro.navigateTo({
      url: '/pages/onboarding/contract-add/index'
    })
  }

  // 查看合同详情
  const handleViewContract = (contractId: string) => {
    Taro.navigateTo({
      url: `/pages/onboarding/contract-detail/index?id=${contractId}`
    })
  }

  if (loading) {
    return <LoadingCards />
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #e0f2fe, #ffffff)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center mb-3">
              <View className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-file-document-multiple text-3xl text-sky-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground block mb-1">劳动合同管理</Text>
                <Text className="text-sm text-muted-foreground block">管理员工劳动合同</Text>
              </View>
            </View>

            {/* 统计信息 */}
            <View className="grid grid-cols-3 gap-3 mt-4">
              <View className="bg-sky-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-sky-600 block mb-1">{contracts.length}</Text>
                <Text className="text-xs text-muted-foreground block">合同总数</Text>
              </View>
              <View className="bg-green-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-green-600 block mb-1">
                  {contracts.filter((c) => c.status === 'active').length}
                </Text>
                <Text className="text-xs text-muted-foreground block">生效中</Text>
              </View>
              <View className="bg-red-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-red-600 block mb-1">
                  {contracts.filter((c) => c.status === 'expired').length}
                </Text>
                <Text className="text-xs text-muted-foreground block">已过期</Text>
              </View>
            </View>
          </View>

          {/* 添加按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-primary text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={handleAddContract}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus-circle text-xl" />
                <Text>添加合同</Text>
              </View>
            </Button>
          </View>

          {/* 合同列表 */}
          {contracts.length === 0 ? (
            <View className="bg-white rounded-xl p-8 text-center border border-border">
              <View className="i-mdi-inbox text-6xl text-muted-foreground mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无合同记录</Text>
              <Text className="text-sm text-muted-foreground block">点击上方按钮添加合同</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {contracts.map((contract) => (
                <View
                  key={contract.id}
                  className="bg-white rounded-xl p-4 border border-border active:opacity-80 transition-all"
                  onClick={() => handleViewContract(contract.id)}>
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground block mb-1">{contract.employee_name}</Text>
                      <Text className="text-sm text-muted-foreground block">{contract.contract_type}</Text>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        contract.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : contract.status === 'expired'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                      <Text className="text-xs font-medium">
                        {contract.status === 'active' ? '生效中' : contract.status === 'expired' ? '已过期' : '已终止'}
                      </Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-2">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-calendar-start text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        开始: {new Date(contract.start_date).toLocaleDateString()}
                      </Text>
                    </View>
                    {contract.end_date && (
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-calendar-end text-base text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">
                          结束: {new Date(contract.end_date).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
