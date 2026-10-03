/**
 * 离职管理主页
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getResignationRequests, getResignationStats} from '@/db/api-lifecycle'
import type {ResignationRequest, ResignationStats} from '@/db/types-lifecycle'

export default function Resignation() {
  const {user} = useAuth({guard: true})
  const [stats, setStats] = useState<ResignationStats>({
    pending_approval: 0,
    in_progress: 0,
    completed_this_month: 0,
    turnover_rate: 0
  })
  const [requests, setRequests] = useState<ResignationRequest[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const tenantId = user.id
      const [statsData, requestsData] = await Promise.all([
        getResignationStats(tenantId),
        getResignationRequests(tenantId)
      ])

      setStats(statsData)
      setRequests(requestsData.slice(0, 5))
    } catch (error) {
      console.error('加载离职数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadData()
  })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, {text: string; color: string}> = {
      pending: {text: '待审批', color: 'text-accent bg-accent/10'},
      approved: {text: '已批准', color: 'text-blue-600 bg-green-500/10'},
      rejected: {text: '已拒绝', color: 'text-destructive bg-destructive/10'},
      completed: {text: '已完成', color: 'text-muted-foreground bg-gray-50'}
    }
    return statusMap[status] || {text: '未知', color: 'text-muted-foreground bg-gray-50'}
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">离职管理</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">离职申请、工作交接、离职面谈</Text>
          </View>

          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-chart-box text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-semibold text-foreground">离职概览</Text>
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs text-muted-foreground">待审批</Text>
                <Text className="text-2xl font-bold text-accent mt-1">{stats.pending_approval}</Text>
                <Text className="text-xs text-muted-foreground mt-1">人</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs text-muted-foreground">离职中</Text>
                <Text className="text-2xl font-bold text-blue-600 mt-1">{stats.in_progress}</Text>
                <Text className="text-xs text-muted-foreground mt-1">人</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs text-muted-foreground">本月已离职</Text>
                <Text className="text-2xl font-bold text-secondary mt-1">{stats.completed_this_month}</Text>
                <Text className="text-xs text-muted-foreground mt-1">人</Text>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <Text className="text-xs text-muted-foreground">离职率</Text>
                <Text className="text-2xl font-bold text-destructive mt-1">{stats.turnover_rate.toFixed(1)}%</Text>
                <Text className="text-xs text-muted-foreground mt-1">本月</Text>
              </View>
            </View>
          </View>

          {/* 快速操作 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-lightning-bolt text-2xl text-accent mr-2" />
              <Text className="text-lg font-semibold text-foreground">快速操作</Text>
            </View>
            <View className="grid grid-cols-2 gap-3">
              <View
                className="bg-destructive/10 rounded-lg p-4 flex flex-col items-center justify-center"
                onClick={() => Taro.navigateTo({url: '/packageH/pages/resignation-form/index'})}>
                <View className="i-mdi-file-document-edit text-3xl text-destructive mb-2" />
                <Text className="text-sm font-medium text-destructive">申请离职</Text>
              </View>
              <View
                className="bg-blue-100 rounded-lg p-4 flex flex-col items-center justify-center"
                onClick={() =>
                  Taro.showToast({
                    title: '离职列表功能开发中',
                    icon: 'none'
                  })
                }>
                <View className="i-mdi-format-list-bulleted text-3xl text-blue-600 mb-2" />
                <Text className="text-sm font-medium text-blue-600">离职列表</Text>
              </View>
              <View
                className="bg-secondary/10 rounded-lg p-4 flex flex-col items-center justify-center"
                onClick={() =>
                  Taro.showToast({
                    title: '工作交接功能开发中',
                    icon: 'none'
                  })
                }>
                <View className="i-mdi-swap-horizontal text-3xl text-secondary mb-2" />
                <Text className="text-sm font-medium text-secondary">工作交接</Text>
              </View>
              <View
                className="bg-accent/10 rounded-lg p-4 flex flex-col items-center justify-center"
                onClick={() =>
                  Taro.showToast({
                    title: '离职面谈功能开发中',
                    icon: 'none'
                  })
                }>
                <View className="i-mdi-account-voice text-3xl text-accent mb-2" />
                <Text className="text-sm font-medium text-accent">离职面谈</Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center">
                <View className="i-mdi-file-document text-2xl text-blue-600 mr-2" />
                <Text className="text-lg font-semibold text-foreground">离职申请</Text>
              </View>
            </View>

            {loading ? (
              <View className="text-center py-8">
                <Text className="text-sm text-muted-foreground">加载中...</Text>
              </View>
            ) : requests.length === 0 ? (
              <View className="text-center py-8">
                <Text className="text-sm text-muted-foreground">暂无离职申请</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {requests.map((request) => {
                  const statusBadge = getStatusBadge(request.status)
                  return (
                    <View
                      key={request.id}
                      className="bg-gray-50 rounded-lg p-3"
                      onClick={() => Taro.navigateTo({url: `/pages/resignation-detail/index?id=${request.id}`})}>
                      <View className="flex items-center justify-between mb-2">
                        <View className="flex items-center gap-2">
                          <Text className="text-sm font-medium text-foreground">员工ID: {request.employee_id}</Text>
                          <View className={`px-2 py-0.5 rounded text-xs ${statusBadge.color}`}>
                            <Text>{statusBadge.text}</Text>
                          </View>
                        </View>
                        <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
                      </View>
                      <View className="space-y-1">
                        {request.reason_type && (
                          <Text className="text-xs text-muted-foreground">原因：{request.reason_type}</Text>
                        )}
                        {request.last_working_day && (
                          <Text className="text-xs text-muted-foreground">最后工作日：{request.last_working_day}</Text>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          <View className="h-4" />
        </View>
      </ScrollView>
    </View>
  )
}
