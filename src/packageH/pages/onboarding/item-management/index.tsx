/**
 * 物品领取管理页面（HR端）- 简化版
 *
 * 功能：
 * - 查看所有员工的物品领取记录
 * - 管理物品发放状态
 * - 确认物品归还
 * - 统计物品库存
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  getTenantItemAssignments,
  markItemAsReceived,
  type OnboardingItemAssignmentWithDetails
} from '@/db/api-interview-flow'
import {useTenantStore} from '@/store/tenant'

const ItemManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [assignments, setAssignments] = useState<OnboardingItemAssignmentWithDetails[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'received' | 'returned'>('pending')

  // 加载物品分配记录
  const loadAssignments = useCallback(async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const allAssignments = await getTenantItemAssignments(currentTenant.id)
      setAssignments(allAssignments)
    } catch (error) {
      console.error('加载物品分配记录失败:', error)
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
    loadAssignments()
  })

  // 确认物品已领取
  const handleMarkReceived = async (assignmentId: string) => {
    try {
      Taro.showLoading({title: '处理中...'})
      const success = await markItemAsReceived(assignmentId)
      Taro.hideLoading()

      if (success) {
        Taro.showToast({
          title: '已确认领取',
          icon: 'success',
          duration: 2000
        })
        loadAssignments()
      } else {
        Taro.showToast({
          title: '操作失败',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('确认领取失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 过滤物品分配记录
  const filteredAssignments = assignments.filter((assignment) => {
    if (activeTab === 'pending') return assignment.status === 'pending'
    if (activeTab === 'received') return assignment.status === 'received'
    if (activeTab === 'returned') return assignment.status === 'returned'
    return true
  })

  // 统计数据
  const stats = {
    total: assignments.length,
    pending: assignments.filter((a) => a.status === 'pending').length,
    received: assignments.filter((a) => a.status === 'received').length,
    returned: assignments.filter((a) => a.status === 'returned').length
  }

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return {text: '待领取', color: 'text-amber-600', bg: 'bg-amber-50'}
      case 'received':
        return {text: '已领取', color: 'text-green-600', bg: 'bg-green-50'}
      case 'returned':
        return {text: '已归还', color: 'text-gray-600', bg: 'bg-gray-50'}
      default:
        return {text: '未知', color: 'text-gray-600', bg: 'bg-gray-50'}
    }
  }

  return (
    <View className="bg-gradient-to-b from-blue-50 to-white min-h-screen">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-2xl font-bold text-foreground">物品领取管理</Text>
            </View>
            <Text className="text-sm text-muted-foreground">管理员工物品领取和归还</Text>
          </View>

          {/* 统计卡片 */}
          <View className="grid grid-cols-4 gap-3 mb-4">
            <View className="bg-white rounded-xl p-3 shadow-sm">
              <Text className="text-xs text-muted-foreground mb-1">总数</Text>
              <Text className="text-2xl font-bold text-foreground">{stats.total}</Text>
            </View>
            <View className="bg-amber-50 rounded-xl p-3 shadow-sm">
              <Text className="text-xs text-amber-600 mb-1">待领取</Text>
              <Text className="text-2xl font-bold text-amber-600">{stats.pending}</Text>
            </View>
            <View className="bg-green-50 rounded-xl p-3 shadow-sm">
              <Text className="text-xs text-green-600 mb-1">已领取</Text>
              <Text className="text-2xl font-bold text-green-600">{stats.received}</Text>
            </View>
            <View className="bg-gray-50 rounded-xl p-3 shadow-sm">
              <Text className="text-xs text-gray-600 mb-1">已归还</Text>
              <Text className="text-2xl font-bold text-gray-600">{stats.returned}</Text>
            </View>
          </View>

          {/* 标签页切换 */}
          <View className="flex gap-2 mb-4">
            <Button
              className={`flex-1 py-3 rounded-xl break-keep text-sm ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-muted-foreground border border-border'
              }`}
              size="default"
              onClick={() => setActiveTab('pending')}>
              待领取 ({stats.pending})
            </Button>
            <Button
              className={`flex-1 py-3 rounded-xl break-keep text-sm ${
                activeTab === 'received'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-muted-foreground border border-border'
              }`}
              size="default"
              onClick={() => setActiveTab('received')}>
              已领取 ({stats.received})
            </Button>
            <Button
              className={`flex-1 py-3 rounded-xl break-keep text-sm ${
                activeTab === 'returned'
                  ? 'bg-gray-500 text-white'
                  : 'bg-white text-muted-foreground border border-border'
              }`}
              size="default"
              onClick={() => setActiveTab('returned')}>
              已归还 ({stats.returned})
            </Button>
          </View>

          {/* 物品分配列表 */}
          {loading ? (
            <View className="bg-white rounded-2xl p-8 text-center">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredAssignments.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 text-center">
              <View className="i-mdi-package-variant text-6xl text-muted-foreground mb-4 mx-auto" />
              <Text className="text-muted-foreground">暂无{getStatusDisplay(activeTab).text}记录</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredAssignments.map((assignment) => {
                const statusDisplay = getStatusDisplay(assignment.status)
                return (
                  <View key={assignment.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    {/* 物品信息 */}
                    <View className="flex items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground mb-1">
                          {assignment.item?.item_name || '未知物品'}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          员工：{assignment.employee_name || '未知员工'}
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${statusDisplay.bg}`}>
                        <Text className={`text-xs font-medium ${statusDisplay.color}`}>{statusDisplay.text}</Text>
                      </View>
                    </View>

                    {/* 详细信息 */}
                    <View className="space-y-2 mb-3">
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-calendar text-base text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">分配日期：{assignment.assigned_date}</Text>
                      </View>
                      {assignment.received_date && (
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-check-circle text-base text-green-600" />
                          <Text className="text-sm text-muted-foreground">领取日期：{assignment.received_date}</Text>
                        </View>
                      )}
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-package text-base text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">数量：{assignment.quantity}</Text>
                      </View>
                      {assignment.notes && (
                        <View className="flex items-start gap-2">
                          <View className="i-mdi-note-text text-base text-muted-foreground mt-0.5" />
                          <Text className="text-sm text-muted-foreground flex-1">{assignment.notes}</Text>
                        </View>
                      )}
                    </View>

                    {/* 操作按钮 */}
                    {assignment.status === 'pending' && (
                      <Button
                        className="w-full bg-green-500 text-white py-3 rounded-xl break-keep text-sm"
                        size="default"
                        onClick={() => handleMarkReceived(assignment.id)}>
                        <View className="flex items-center justify-center gap-2">
                          <View className="i-mdi-check text-lg" />
                          <Text className="text-white">确认已领取</Text>
                        </View>
                      </Button>
                    )}
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

export default ItemManagement
