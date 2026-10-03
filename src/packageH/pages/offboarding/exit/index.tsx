/**
 * 离职手续页面
 * 显示员工的离职手续办理进度
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useState} from 'react'

const ExitProcedure: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [_loading, _setLoading] = useState(false)

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 离职手续清单
  const procedures = [
    {
      id: 1,
      name: '工作交接',
      description: '完成工作交接清单',
      status: 'completed',
      department: '直属部门',
      completedDate: '2024-03-20'
    },
    {
      id: 2,
      name: '物品归还',
      description: '归还公司物品',
      status: 'completed',
      department: '行政部',
      completedDate: '2024-03-21'
    },
    {
      id: 3,
      name: '财务结算',
      description: '工资结算、报销审核',
      status: 'in-progress',
      department: '财务部',
      completedDate: null
    },
    {
      id: 4,
      name: 'HR审核',
      description: '人事档案整理',
      status: 'pending',
      department: '人力资源部',
      completedDate: null
    },
    {
      id: 5,
      name: '离职证明',
      description: '开具离职证明',
      status: 'pending',
      department: '人力资源部',
      completedDate: null
    }
  ]

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: 'i-mdi-check-circle',
          color: 'text-muted-foreground',
          bg: 'bg-green-100',
          label: '已完成'
        }
      case 'in-progress':
        return {
          icon: 'i-mdi-progress-clock',
          color: 'text-muted-foreground',
          bg: 'bg-blue-100',
          label: '进行中'
        }
      case 'pending':
        return {
          icon: 'i-mdi-clock-outline',
          color: 'text-muted-foreground',
          bg: 'bg-gray-50',
          label: '待办理'
        }
      default:
        return {
          icon: 'i-mdi-help-circle',
          color: 'text-muted-foreground',
          bg: 'bg-gray-50',
          label: '未知'
        }
    }
  }

  // 计算进度
  const calculateProgress = () => {
    const completedCount = procedures.filter((p) => p.status === 'completed').length
    return Math.round((completedCount / procedures.length) * 100)
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <View className="flex items-center">
                <View className="i-mdi-clipboard-check text-3xl text-blue-600 mr-3" />
                <Text className="text-2xl font-bold text-foreground">离职手续</Text>
              </View>
              <View className="bg-muted p-2 rounded-lg active:opacity-70" onClick={handleBack}>
                <View className="i-mdi-arrow-left text-xl text-foreground" />
              </View>
            </View>
            <Text className="text-sm text-muted-foreground">办理离职手续，完成离职流程</Text>
          </View>

          {/* 办理进度 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-progress-check text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">办理进度</Text>
            </View>
            <View>
              <View className="flex items-center justify-between mb-2">
                <Text className="text-sm text-muted-foreground">总体进度</Text>
                <Text className="text-sm font-bold text-blue-600">{calculateProgress()}%</Text>
              </View>
              <View className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <View className="h-full bg-blue-100" style={{width: `${calculateProgress()}%`}} />
              </View>
              <View className="grid grid-cols-3 gap-4 mt-4">
                <View className="text-center p-3 bg-blue-100 rounded-lg">
                  <Text className="text-2xl font-bold text-muted-foreground">
                    {procedures.filter((p) => p.status === 'completed').length}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">已完成</Text>
                </View>
                <View className="text-center p-3 bg-blue-100 rounded-lg">
                  <Text className="text-2xl font-bold text-muted-foreground">
                    {procedures.filter((p) => p.status === 'in-progress').length}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">进行中</Text>
                </View>
                <View className="text-center p-3 bg-muted rounded-lg">
                  <Text className="text-2xl font-bold text-muted-foreground">
                    {procedures.filter((p) => p.status === 'pending').length}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">待办理</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 手续清单 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-format-list-checks text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">手续清单</Text>
            </View>
            <View className="space-y-3">
              {procedures.map((procedure, index) => {
                const statusStyle = getStatusStyle(procedure.status)
                return (
                  <View key={procedure.id} className="relative">
                    {/* 连接线 */}
                    {index < procedures.length - 1 && (
                      <View className="absolute left-6 top-12 w-0.5 h-full bg-gray-50" style={{height: '100%'}} />
                    )}
                    <View className="p-4 bg-gray-50/30 rounded-lg relative">
                      <View className="flex items-start">
                        <View
                          className={`${statusStyle.icon} text-2xl ${statusStyle.color} mr-3 relative z-10 bg-white`}
                        />
                        <View className="flex-1">
                          <View className="flex items-center justify-between mb-2">
                            <Text className="text-base font-bold text-foreground">{procedure.name}</Text>
                            <View className={`${statusStyle.bg} px-3 py-1 rounded-full`}>
                              <Text className={`text-xs ${statusStyle.color} font-medium`}>{statusStyle.label}</Text>
                            </View>
                          </View>
                          <Text className="text-sm text-muted-foreground mb-2">{procedure.description}</Text>
                          <View className="flex items-center justify-between">
                            <View className="flex items-center">
                              <View className="i-mdi-office-building text-sm text-muted-foreground mr-1" />
                              <Text className="text-xs text-muted-foreground">{procedure.department}</Text>
                            </View>
                            {procedure.completedDate && (
                              <Text className="text-xs text-muted-foreground">{procedure.completedDate}</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          {/* 离职信息 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-information text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">离职信息</Text>
            </View>
            <View className="space-y-3">
              <View className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                <Text className="text-sm text-muted-foreground">离职类型</Text>
                <Text className="text-sm font-bold text-muted-foreground">主动离职</Text>
              </View>
              <View className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                <Text className="text-sm text-muted-foreground">申请日期</Text>
                <Text className="text-sm font-bold text-muted-foreground">2024-03-15</Text>
              </View>
              <View className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                <Text className="text-sm text-muted-foreground">最后工作日</Text>
                <Text className="text-sm font-bold text-muted-foreground">2024-03-31</Text>
              </View>
            </View>
          </View>

          {/* 注意事项 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-alert-circle text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">注意事项</Text>
            </View>
            <View className="space-y-2">
              <View className="flex items-start">
                <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                <Text className="text-sm text-muted-foreground flex-1">请按顺序完成所有离职手续</Text>
              </View>
              <View className="flex items-start">
                <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                <Text className="text-sm text-muted-foreground flex-1">离职证明将在所有手续完成后开具</Text>
              </View>
              <View className="flex items-start">
                <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                <Text className="text-sm text-muted-foreground flex-1">工资将在最后工作日后结算</Text>
              </View>
              <View className="flex items-start">
                <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2 mt-0.5" />
                <Text className="text-sm text-muted-foreground flex-1">如有疑问请联系人力资源部</Text>
              </View>
            </View>
          </View>

          {/* 联系方式 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center mb-4">
              <View className="i-mdi-phone text-2xl text-blue-600 mr-2" />
              <Text className="text-lg font-bold text-foreground">联系方式</Text>
            </View>
            <View className="p-4 bg-blue-100 rounded-lg">
              <View className="space-y-2">
                <View className="flex items-center">
                  <View className="i-mdi-account text-lg text-muted-foreground mr-2" />
                  <Text className="text-sm text-muted-foreground">人力资源部：王经理</Text>
                </View>
                <View className="flex items-center">
                  <View className="i-mdi-phone text-lg text-muted-foreground mr-2" />
                  <Text className="text-sm text-muted-foreground">电话：010-12345678</Text>
                </View>
                <View className="flex items-center">
                  <View className="i-mdi-email text-lg text-muted-foreground mr-2" />
                  <Text className="text-sm text-muted-foreground">邮箱：hr@company.com</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default ExitProcedure
