/**
 * 导师分配管理页面
 * HR管理导师带教关系
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {getEmployeeByUserId, getEmployeesByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'

// 导师关系接口
interface MentorRelationship {
  id: string
  mentor_id: string
  mentor_name: string
  mentee_id: string
  mentee_name: string
  start_date: string
  end_date?: string
  status: 'active' | 'completed'
}

export default function MentorManagement() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [_employees, setEmployees] = useState<Employee[]>([])
  const [relationships, setRelationships] = useState<MentorRelationship[]>([])

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

      // TODO: 从数据库加载导师关系
      const mockRelationships: MentorRelationship[] = []
      setRelationships(mockRelationships)
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

  // 分配导师
  const handleAssignMentor = () => {
    Taro.navigateTo({
      url: '/pages/onboarding/mentor-assign/index'
    })
  }

  if (loading) {
    return <LoadingCards />
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #f3e8ff, #ffffff)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center mb-3">
              <View className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-account-supervisor text-3xl text-purple-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground block mb-1">导师分配</Text>
                <Text className="text-sm text-muted-foreground block">管理导师带教关系</Text>
              </View>
            </View>

            {/* 统计信息 */}
            <View className="grid grid-cols-2 gap-3 mt-4">
              <View className="bg-purple-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-purple-600 block mb-1">
                  {relationships.filter((r) => r.status === 'active').length}
                </Text>
                <Text className="text-xs text-muted-foreground block">进行中</Text>
              </View>
              <View className="bg-gray-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-gray-600 block mb-1">
                  {relationships.filter((r) => r.status === 'completed').length}
                </Text>
                <Text className="text-xs text-muted-foreground block">已完成</Text>
              </View>
            </View>
          </View>

          {/* 分配按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-primary text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={handleAssignMentor}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus-circle text-xl" />
                <Text>分配导师</Text>
              </View>
            </Button>
          </View>

          {/* 导师关系列表 */}
          {relationships.length === 0 ? (
            <View className="bg-white rounded-xl p-8 text-center border border-border">
              <View className="i-mdi-inbox text-6xl text-muted-foreground mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无导师关系</Text>
              <Text className="text-sm text-muted-foreground block">点击上方按钮分配导师</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {relationships.map((rel) => (
                <View key={rel.id} className="bg-white rounded-xl p-4 border border-border">
                  <View className="flex items-center justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-2">
                        <View className="i-mdi-account-tie text-lg text-purple-600" />
                        <Text className="text-base font-bold text-foreground">{rel.mentor_name}</Text>
                        <Text className="text-sm text-muted-foreground">导师</Text>
                      </View>
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-account text-lg text-blue-600" />
                        <Text className="text-base font-bold text-foreground">{rel.mentee_name}</Text>
                        <Text className="text-sm text-muted-foreground">学员</Text>
                      </View>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        rel.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      <Text className="text-xs font-medium">{rel.status === 'active' ? '进行中' : '已完成'}</Text>
                    </View>
                  </View>

                  <View className="flex items-center gap-2 text-sm text-muted-foreground">
                    <View className="i-mdi-calendar text-base" />
                    <Text className="text-sm">开始: {new Date(rel.start_date).toLocaleDateString()}</Text>
                    {rel.end_date && (
                      <>
                        <Text className="text-sm">-</Text>
                        <Text className="text-sm">结束: {new Date(rel.end_date).toLocaleDateString()}</Text>
                      </>
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
