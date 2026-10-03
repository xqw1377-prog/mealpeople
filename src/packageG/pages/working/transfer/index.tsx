/**
 * 我的调岗页面 - 员工调岗管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {getEmployeeTransferData, isCrossDepartmentTransfer, isCrossStoreTransfer} from '@/db/api-transfer'
import type {TransferData} from '@/db/types-transfer'
import {
  TRANSFER_APPLICATION_STATUS_COLORS,
  TRANSFER_APPLICATION_STATUS_NAMES,
  TRANSFER_REQUIREMENT_TYPE_NAMES,
  TRANSFER_TYPE_NAMES
} from '@/db/types-transfer'

export default function MyTransfer() {
  const {user} = useAuth({guard: true})
  const [transferData, setTransferData] = useState<TransferData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTransferData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      const data = await getEmployeeTransferData(employee.id, employee.tenant_id)
      setTransferData(data)
    } catch (error) {
      console.error('加载调岗数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadTransferData()
  })

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!transferData) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">暂无调岗数据</Text>
      </View>
    )
  }

  const {available_positions, my_applications, transfer_history, statistics} = transferData

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的调岗</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">岗位调动管理</Text>
          </View>

          {/* 调岗统计卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 mb-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-blue-600/80 text-sm">调岗次数</Text>
                <Text className="text-foreground text-3xl font-bold mt-1">{statistics.total_transfers}</Text>
              </View>
              <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <View className="i-mdi-swap-horizontal text-4xl text-blue-600" />
              </View>
            </View>

            <View className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
              <View>
                <Text className="text-blue-600/80 text-xs">总申请</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.total_applications}</Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">跨部门</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.cross_department_transfers}</Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">跨门店</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.cross_store_transfers}</Text>
              </View>
            </View>
          </View>

          {/* 可用岗位 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">可用岗位</Text>
              <View className="i-mdi-briefcase text-2xl text-blue-600" />
            </View>

            {available_positions.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-briefcase-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无可用岗位</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {available_positions.map((position) => (
                  <View key={position.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">{position.position_name}</Text>
                        <Text className="text-xs text-muted-foreground mt-1">
                          {position.department} · L{position.level}
                        </Text>
                      </View>
                      <View className="px-3 py-1 bg-green-100 rounded">
                        <Text className="text-xs text-muted-foreground">{position.available_slots}个空缺</Text>
                      </View>
                    </View>

                    {position.description && (
                      <Text className="text-xs text-muted-foreground mb-3">{position.description}</Text>
                    )}

                    {position.requirements_list && position.requirements_list.length > 0 && (
                      <View className="space-y-2 mb-3">
                        <Text className="text-xs font-medium text-foreground">岗位要求：</Text>
                        {position.requirements_list.slice(0, 3).map((req) => (
                          <View key={req.id} className="flex flex-row items-start">
                            <View className="i-mdi-check-circle text-sm text-muted-foreground mt-0.5 mr-2" />
                            <Text className="text-xs text-foreground flex-1">
                              {TRANSFER_REQUIREMENT_TYPE_NAMES[req.requirement_type]}: {req.requirement_name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    <View
                      className="bg-green-500 rounded-lg py-2 px-4 flex items-center justify-center active:opacity-70"
                      onClick={() => {
                        Taro.showToast({
                          title: '申请调岗功能开发中',
                          icon: 'none'
                        })
                      }}>
                      <Text className="text-sm text-white font-medium">申请调岗</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 我的申请 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">我的申请</Text>
              <View className="i-mdi-file-document text-2xl text-blue-600" />
            </View>

            {my_applications.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-file-document-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无申请记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {my_applications.map((application) => (
                  <View key={application.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">
                          {application.current_position} → {application.target_position}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-1">
                          {application.current_department} → {application.target_department}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded ${application.status === 'approved' ? 'bg-green-100' : application.status === 'rejected' ? 'bg-red-100' : 'bg-orange-100'}`}>
                        <Text className={`text-xs ${TRANSFER_APPLICATION_STATUS_COLORS[application.status]}`}>
                          {TRANSFER_APPLICATION_STATUS_NAMES[application.status]}
                        </Text>
                      </View>
                    </View>

                    {application.reason && (
                      <View className="mb-3">
                        <Text className="text-xs text-muted-foreground">申请理由：</Text>
                        <Text className="text-xs text-foreground mt-1">{application.reason}</Text>
                      </View>
                    )}

                    <View className="flex flex-row items-center justify-between">
                      <Text className="text-xs text-muted-foreground">
                        申请时间: {new Date(application.application_date).toLocaleDateString()}
                      </Text>
                      {application.status === 'pending' && (
                        <View
                          className="active:opacity-70"
                          onClick={() => {
                            Taro.showToast({
                              title: '取消申请功能开发中',
                              icon: 'none'
                            })
                          }}>
                          <Text className="text-xs text-red-600">取消申请</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 调岗历史 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">调岗历史</Text>
              <View className="i-mdi-history text-2xl text-blue-600" />
            </View>

            {transfer_history.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-history text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无调岗历史</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {transfer_history.map((history, index) => (
                  <View key={history.id} className="relative">
                    {index < transfer_history.length - 1 && (
                      <View className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-200" />
                    )}

                    <View className="flex flex-row items-start">
                      <View className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <View className="i-mdi-swap-horizontal text-lg text-muted-foreground" />
                      </View>

                      <View className="flex-1 pb-4">
                        <View className="flex flex-row items-center justify-between mb-2">
                          <Text className="text-base font-medium text-foreground">
                            {history.from_position} → {history.to_position}
                          </Text>
                          <View className="px-2 py-1 bg-purple-100 rounded">
                            <Text className="text-xs text-muted-foreground">
                              {TRANSFER_TYPE_NAMES[history.transfer_type]}
                            </Text>
                          </View>
                        </View>

                        <Text className="text-xs text-muted-foreground mb-2">
                          {history.from_department} → {history.to_department}
                        </Text>

                        {isCrossDepartmentTransfer(history.from_department, history.to_department) && (
                          <View className="px-2 py-1 bg-orange-100 rounded inline-block mb-2">
                            <Text className="text-xs text-muted-foreground">跨部门调岗</Text>
                          </View>
                        )}

                        {isCrossStoreTransfer(history.from_store_id, history.to_store_id) && (
                          <View className="px-2 py-1 bg-cyan-100 rounded inline-block mb-2 ml-2">
                            <Text className="text-xs text-cyan-600">跨门店调岗</Text>
                          </View>
                        )}

                        {history.salary_change && Number(history.salary_change) !== 0 && (
                          <Text
                            className={`text-xs mb-2 ${Number(history.salary_change) > 0 ? 'text-muted-foreground' : 'text-red-600'}`}>
                            薪资变化: {Number(history.salary_change) > 0 ? '+' : ''}¥
                            {Number(history.salary_change).toFixed(2)}
                          </Text>
                        )}

                        <Text className="text-xs text-muted-foreground">
                          调岗日期: {new Date(history.transfer_date).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
