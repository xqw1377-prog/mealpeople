/**
 * 试用期管理页面
 * HR监控试用期员工
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {getEmployeeByUserId, getEmployeesByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'

export default function ProbationManagement() {
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
      // 筛选试用期员工（status为probation）
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

  // 查看员工详情
  const handleViewEmployee = (employeeId: string) => {
    Taro.navigateTo({
      url: `/packageA/pages/employee-detail/index?id=${employeeId}`
    })
  }

  // 计算剩余天数
  const calculateRemainingDays = (createdAt: string) => {
    const created = new Date(createdAt)
    const probationEnd = new Date(created.getTime() + 90 * 24 * 60 * 60 * 1000) // 假设试用期90天
    const today = new Date()
    const remaining = Math.ceil((probationEnd.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    return remaining
  }

  if (loading) {
    return <LoadingCards />
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #ecfdf5, #ffffff)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center mb-3">
              <View className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-clock-outline text-3xl text-cyan-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground block mb-1">试用期管理</Text>
                <Text className="text-sm text-muted-foreground block">监控试用期员工</Text>
              </View>
            </View>

            {/* 统计信息 */}
            <View className="bg-cyan-50 rounded-lg p-4 mt-4 text-center">
              <Text className="text-3xl font-bold text-cyan-600 block mb-1">{probationEmployees.length}</Text>
              <Text className="text-sm text-muted-foreground block">试用期员工</Text>
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
              {probationEmployees.map((emp) => {
                const remainingDays = calculateRemainingDays(emp.created_at)
                return (
                  <View
                    key={emp.id}
                    className="bg-white rounded-xl p-4 border border-border active:opacity-80 transition-all"
                    onClick={() => handleViewEmployee(emp.id)}>
                    <View className="flex items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-foreground block mb-1">{emp.name}</Text>
                        <Text className="text-sm text-muted-foreground block">{emp.position || '未设置职位'}</Text>
                      </View>
                      <View
                        className={`px-3 py-1 rounded-full ${
                          remainingDays > 30
                            ? 'bg-green-100 text-green-700'
                            : remainingDays > 7
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}>
                        <Text className="text-xs font-medium">剩余{remainingDays}天</Text>
                      </View>
                    </View>

                    <View className="grid grid-cols-2 gap-2">
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
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
