/**
 * 社保管理页面
 * HR管理员工社保信息
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {getEmployeeByUserId, getEmployeesByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'

// 社保记录接口
interface SocialSecurityRecord {
  id: string
  employee_id: string
  employee_name: string
  social_security_number?: string
  start_date: string
  status: 'active' | 'suspended' | 'terminated'
  monthly_amount?: number
}

export default function SocialSecurityManagement() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [_employees, setEmployees] = useState<Employee[]>([])
  const [records, setRecords] = useState<SocialSecurityRecord[]>([])

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

      // TODO: 从数据库加载社保记录
      const mockRecords: SocialSecurityRecord[] = []
      setRecords(mockRecords)
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

  // 添加社保记录
  const handleAddRecord = () => {
    Taro.navigateTo({
      url: '/pages/onboarding/social-security-add/index'
    })
  }

  // 查看社保详情
  const handleViewRecord = (recordId: string) => {
    Taro.navigateTo({
      url: `/pages/onboarding/social-security-detail/index?id=${recordId}`
    })
  }

  if (loading) {
    return <LoadingCards />
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #f0fdf4, #ffffff)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center mb-3">
              <View className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-shield-account text-3xl text-green-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground block mb-1">社保管理</Text>
                <Text className="text-sm text-muted-foreground block">管理员工社保信息</Text>
              </View>
            </View>

            {/* 统计信息 */}
            <View className="grid grid-cols-3 gap-3 mt-4">
              <View className="bg-green-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-green-600 block mb-1">{records.length}</Text>
                <Text className="text-xs text-muted-foreground block">社保记录</Text>
              </View>
              <View className="bg-blue-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-blue-600 block mb-1">
                  {records.filter((r) => r.status === 'active').length}
                </Text>
                <Text className="text-xs text-muted-foreground block">正常缴纳</Text>
              </View>
              <View className="bg-amber-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-amber-600 block mb-1">
                  {records.filter((r) => r.status === 'suspended').length}
                </Text>
                <Text className="text-xs text-muted-foreground block">暂停缴纳</Text>
              </View>
            </View>
          </View>

          {/* 添加按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-primary text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={handleAddRecord}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus-circle text-xl" />
                <Text>添加社保记录</Text>
              </View>
            </Button>
          </View>

          {/* 社保记录列表 */}
          {records.length === 0 ? (
            <View className="bg-white rounded-xl p-8 text-center border border-border">
              <View className="i-mdi-inbox text-6xl text-muted-foreground mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无社保记录</Text>
              <Text className="text-sm text-muted-foreground block">点击上方按钮添加社保记录</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {records.map((record) => (
                <View
                  key={record.id}
                  className="bg-white rounded-xl p-4 border border-border active:opacity-80 transition-all"
                  onClick={() => handleViewRecord(record.id)}>
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground block mb-1">{record.employee_name}</Text>
                      <Text className="text-sm text-muted-foreground block">
                        {record.social_security_number || '未设置社保号'}
                      </Text>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        record.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : record.status === 'suspended'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}>
                      <Text className="text-xs font-medium">
                        {record.status === 'active'
                          ? '正常缴纳'
                          : record.status === 'suspended'
                            ? '暂停缴纳'
                            : '已终止'}
                      </Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-2">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-calendar text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        开始: {new Date(record.start_date).toLocaleDateString()}
                      </Text>
                    </View>
                    {record.monthly_amount && (
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-currency-cny text-base text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">月缴: ¥{record.monthly_amount}</Text>
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
