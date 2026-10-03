/**
 * 试用期转正页面
 * HR管理试用期员工转正
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {getEmployeeByUserId, getEmployeesByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'

export default function ProbationConversion() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [probationEmployees, setProbationEmployees] = useState<Employee[]>([])

  // 加载试用期员工
  const loadProbationEmployees = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      const allEmployees = await getEmployeesByTenantId(employee.tenant_id)
      const probationList = allEmployees.filter((emp) => emp.status === 'probation')
      setProbationEmployees(probationList)
    } catch (error) {
      console.error('加载试用期员工失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadProbationEmployees()
  })

  // 发起转正
  const handleStartConversion = (employeeId: string) => {
    Taro.navigateTo({
      url: `/pages/probation-conversion-form/index?employeeId=${employeeId}`
    })
  }

  if (loading) {
    return <LoadingCards />
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #f0fdfa, #ffffff)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center">
              <View className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-account-convert text-3xl text-teal-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground block mb-1">试用期转正</Text>
                <Text className="text-sm text-muted-foreground block">管理试用期员工转正</Text>
              </View>
            </View>
          </View>

          {/* 试用期员工列表 */}
          {probationEmployees.length === 0 ? (
            <View className="bg-white rounded-xl p-8 text-center border border-border">
              <View className="i-mdi-inbox text-6xl text-muted-foreground mb-4" />
              <Text className="text-base text-muted-foreground block">暂无试用期员工</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {probationEmployees.map((emp) => (
                <View key={emp.id} className="bg-white rounded-xl p-4 border border-border">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground block mb-1">{emp.name}</Text>
                      <Text className="text-sm text-muted-foreground block">{emp.position || '未设置职位'}</Text>
                    </View>
                    <View className="px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                      <Text className="text-xs font-medium">试用期</Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-2 mb-3">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-calendar text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        创建: {new Date(emp.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-store text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">门店ID: {emp.store_id}</Text>
                    </View>
                  </View>

                  <Button
                    className="w-full bg-primary text-white py-3 rounded-lg break-keep text-sm"
                    size="default"
                    onClick={() => handleStartConversion(emp.id)}>
                    发起转正
                  </Button>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
