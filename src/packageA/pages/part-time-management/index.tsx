import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {getEnv, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {getAllEmployees} from '@/db/api-employee-hub'
import type {Employee} from '@/db/types-employee-hub'
import {exportEmployeesToExcel} from '@/utils/export-employee'

/**
 * 兼职管理中心页面
 * 功能：
 * 1. 兼职员工列表展示
 * 2. 工时统计
 * 3. 排班管理
 * 4. 独立统计分析
 */
const PartTimeManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [partTimeEmployees, setPartTimeEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [_selectedPeriod, _setSelectedPeriod] = useState<'week' | 'month'>('week')

  // 加载兼职员工数据
  const loadPartTimeEmployees = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // 获取所有兼职员工
      const allEmployees: Employee[] = await getAllEmployees({
        employment_type: 'part_time',
        status: 'active'
      })
      setPartTimeEmployees(allEmployees)
    } catch (error) {
      console.error('加载兼职员工失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadPartTimeEmployees()
  })

  // 初始加载
  useEffect(() => {
    loadPartTimeEmployees()
  }, [loadPartTimeEmployees])

  // 计算统计数据
  const statistics = {
    total: partTimeEmployees.length,
    activeToday: 0, // 今日在岗（需要从排班数据获取）
    totalHoursWeek: 0, // 本周总工时（需要从排班数据获取）
    totalHoursMonth: 0, // 本月总工时（需要从排班数据获取）
    avgHoursPerPerson: 0 // 人均工时
  }

  // 导出兼职员工数据
  const handleExportEmployees = () => {
    // 检查是否在H5环境
    const env = getEnv()
    if (env !== 'WEB') {
      Taro.showToast({
        title: '导出功能仅支持WEB端',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 检查是否有数据
    if (partTimeEmployees.length === 0) {
      Taro.showToast({
        title: '暂无数据可导出',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      // 导出兼职员工数据
      exportEmployeesToExcel(partTimeEmployees, '兼职员工数据')

      Taro.showToast({
        title: '导出成功',
        icon: 'success',
        duration: 2000
      })
    } catch (error) {
      console.error('导出失败:', error)
      Taro.showToast({
        title: '导出失败，请重试',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 快速操作
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add':
        Taro.showToast({title: '添加兼职员工功能开发中', icon: 'none'})
        break
      case 'schedule':
        Taro.showToast({title: '兼职排班功能开发中', icon: 'none'})
        break
      case 'hours':
        Taro.showToast({title: '工时统计功能开发中', icon: 'none'})
        break
      case 'salary':
        Taro.showToast({title: '薪资计算功能开发中', icon: 'none'})
        break
      case 'export':
        // 导出兼职员工数据
        handleExportEmployees()
        break
      default:
        break
    }
  }

  // 查看员工详情
  const handleEmployeeDetail = (employeeId: string) => {
    Taro.showToast({
      title: `查看员工详情: ${employeeId}`,
      icon: 'none'
    })
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4 max-w-7xl mx-auto">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-2xl max-sm:text-xl font-bold text-foreground block mb-2">兼职管理中心</Text>
            <Text className="text-sm max-sm:text-xs text-muted-foreground">独立管理兼职员工，不计入正式编制</Text>
          </View>

          {/* 统计卡片 */}
          <View className="grid grid-cols-2 @md:grid-cols-4 gap-3 mb-4">
            {/* 兼职总数 */}
            <View className="bg-white rounded-lg p-4 shadow-sm border border-border">
              <View className="flex items-center gap-2 mb-2">
                <View className="i-mdi-account-group text-2xl text-blue-500" />
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">兼职总数</Text>
              </View>
              <Text className="text-3xl max-sm:text-2xl font-bold text-blue-600">{statistics.total}</Text>
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">不计入正式编制</Text>
            </View>

            {/* 今日在岗 */}
            <View className="bg-white rounded-lg p-4 shadow-sm border border-border">
              <View className="flex items-center gap-2 mb-2">
                <View className="i-mdi-account-check text-2xl text-green-500" />
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">今日在岗</Text>
              </View>
              <Text className="text-3xl max-sm:text-2xl font-bold text-green-600">{statistics.activeToday}</Text>
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">当前在岗人数</Text>
            </View>

            {/* 本周工时 */}
            <View className="bg-white rounded-lg p-4 shadow-sm border border-border">
              <View className="flex items-center gap-2 mb-2">
                <View className="i-mdi-clock-outline text-2xl text-orange-500" />
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">本周工时</Text>
              </View>
              <Text className="text-3xl max-sm:text-2xl font-bold text-orange-600">{statistics.totalHoursWeek}</Text>
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">累计工作小时</Text>
            </View>

            {/* 本月工时 */}
            <View className="bg-white rounded-lg p-4 shadow-sm border border-border">
              <View className="flex items-center gap-2 mb-2">
                <View className="i-mdi-calendar-clock text-2xl text-purple-500" />
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">本月工时</Text>
              </View>
              <Text className="text-3xl max-sm:text-2xl font-bold text-purple-600">{statistics.totalHoursMonth}</Text>
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">累计工作小时</Text>
            </View>
          </View>

          {/* 快速操作 */}
          <View className="bg-white rounded-lg p-4 shadow-sm border border-border mb-4">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-lightning-bolt text-2xl text-primary" />
              <Text className="text-base max-sm:text-sm font-semibold text-foreground">快速操作</Text>
            </View>
            <View className="grid grid-cols-2 @md:grid-cols-3 @lg:grid-cols-5 gap-3">
              <Button
                size="default"
                className="bg-blue-50 text-blue-600 py-3 rounded break-keep text-sm max-sm:text-xs cursor-pointer"
                onClick={() => handleQuickAction('add')}>
                <View className="flex flex-col items-center gap-1">
                  <View className="i-mdi-account-plus text-2xl" />
                  <Text>添加兼职</Text>
                </View>
              </Button>
              <Button
                size="default"
                className="bg-green-50 text-green-600 py-3 rounded break-keep text-sm max-sm:text-xs cursor-pointer"
                onClick={() => handleQuickAction('schedule')}>
                <View className="flex flex-col items-center gap-1">
                  <View className="i-mdi-calendar-edit text-2xl" />
                  <Text>兼职排班</Text>
                </View>
              </Button>
              <Button
                size="default"
                className="bg-orange-50 text-orange-600 py-3 rounded break-keep text-sm max-sm:text-xs cursor-pointer"
                onClick={() => handleQuickAction('hours')}>
                <View className="flex flex-col items-center gap-1">
                  <View className="i-mdi-clock-check text-2xl" />
                  <Text>工时统计</Text>
                </View>
              </Button>
              <Button
                size="default"
                className="bg-purple-50 text-purple-600 py-3 rounded break-keep text-sm max-sm:text-xs cursor-pointer"
                onClick={() => handleQuickAction('salary')}>
                <View className="flex flex-col items-center gap-1">
                  <View className="i-mdi-cash text-2xl" />
                  <Text>薪资计算</Text>
                </View>
              </Button>
              <Button
                size="default"
                className="bg-cyan-50 text-cyan-600 py-3 rounded break-keep text-sm max-sm:text-xs cursor-pointer"
                onClick={() => handleQuickAction('export')}>
                <View className="flex flex-col items-center gap-1">
                  <View className="i-mdi-file-excel text-2xl" />
                  <Text>导出数据</Text>
                </View>
              </Button>
            </View>
          </View>

          {/* 兼职员工列表 */}
          <View className="bg-white rounded-lg p-4 shadow-sm border border-border">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <View className="i-mdi-account-multiple text-2xl text-primary" />
                <Text className="text-base max-sm:text-sm font-semibold text-foreground">兼职员工列表</Text>
              </View>
              <Text className="text-sm max-sm:text-xs text-muted-foreground">共 {partTimeEmployees.length} 人</Text>
            </View>

            {loading ? (
              <View className="text-center py-8">
                <Text className="text-sm max-sm:text-xs text-muted-foreground">加载中...</Text>
              </View>
            ) : partTimeEmployees.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-account-off text-6xl text-gray-300 mx-auto mb-4" />
                <Text className="text-base max-sm:text-sm text-muted-foreground block mb-2">暂无兼职员工</Text>
                <Text className="text-sm max-sm:text-xs text-gray-400">点击"添加兼职"按钮添加兼职员工</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {partTimeEmployees.map((employee) => (
                  <View
                    key={employee.id}
                    className="border border-border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleEmployeeDetail(employee.id)}>
                    <View className="flex items-center justify-between mb-2">
                      <View className="flex items-center gap-3">
                        <View className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <View className="i-mdi-account text-2xl text-blue-600" />
                        </View>
                        <View>
                          <Text className="text-base max-sm:text-sm font-semibold text-foreground block">
                            {employee.name}
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                            {employee.position || '未设置岗位'}
                          </Text>
                        </View>
                      </View>
                      <View className="i-mdi-chevron-right text-2xl text-gray-400" />
                    </View>

                    <View className="flex items-center gap-4 text-xs max-sm:text-[10px] text-muted-foreground">
                      <View className="flex items-center gap-1">
                        <View className="i-mdi-phone text-sm" />
                        <Text>{employee.phone}</Text>
                      </View>
                      {employee.department && (
                        <View className="flex items-center gap-1">
                          <View className="i-mdi-office-building text-sm" />
                          <Text>{employee.department}</Text>
                        </View>
                      )}
                    </View>

                    {employee.monthly_salary && (
                      <View className="mt-2 pt-2 border-t border-border">
                        <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                          时薪：¥{(employee.monthly_salary / 160).toFixed(2)}/小时
                        </Text>
                      </View>
                    )}
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

export default PartTimeManagement
