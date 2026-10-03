/**
 * 离职数据统计页面
 *
 * 功能：
 * - 离职趋势分析
 * - 离职原因统计
 * - 部门离职率
 * - 月度离职数据
 * - 离职员工画像
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import {useTenantStore} from '@/store/tenant'

// 统计数据类型
interface OffboardingStatistics {
  total_resignations: number
  this_month: number
  last_month: number
  avg_tenure: number
  turnover_rate: number
  reasons: {reason: string; count: number}[]
  departments: {department: string; count: number; rate: number}[]
  monthly_trend: {month: string; count: number}[]
}

export default function OffboardingStatisticsPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [statistics, setStatistics] = useState<OffboardingStatistics | null>(null)
  const [timeRange, setTimeRange] = useState<'3months' | '6months' | '12months'>('6months')
  const [timeRangeIndex, setTimeRangeIndex] = useState(1)

  const timeRangeOptions = ['近3个月', '近6个月', '近12个月']
  const timeRangeValues: Array<'3months' | '6months' | '12months'> = ['3months', '6months', '12months']

  // 加载统计数据
  const loadStatistics = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 检查权限
      const currentEmployee = await getEmployeeByUserId(user?.id)
      if (!currentEmployee) {
        Taro.showToast({title: '无权限访问', icon: 'none'})
        setLoading(false)
        return
      }

      // 计算时间范围
      const now = new Date()
      const monthsAgo = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12
      const startDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1).toISOString().split('T')[0]

      // 获取离职申请数据
      const {data: resignations, error: resignError} = await supabase
        .from('resignation_applications')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'completed')
        .gte('completed_date', startDate)

      if (resignError) throw resignError

      // 获取所有员工数据（用于计算离职率）
      const {data: allEmployees, error: empError} = await supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', currentTenant.id)

      if (empError) throw empError

      // 计算统计数据
      const totalResignations = resignations?.length || 0
      const totalEmployees = allEmployees?.length || 0

      // 本月离职数
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const thisMonth = resignations?.filter((r) => r.completed_date >= thisMonthStart).length || 0

      // 上月离职数
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      const lastMonth =
        resignations?.filter((r) => r.completed_date >= lastMonthStart && r.completed_date <= lastMonthEnd).length || 0

      // 离职率
      const turnoverRate = totalEmployees > 0 ? Math.round((totalResignations / totalEmployees) * 100) : 0

      // 离职原因统计
      const reasonMap = new Map<string, number>()
      resignations?.forEach((r) => {
        const reason = r.reason || '未填写'
        const shortReason = reason.length > 10 ? `${reason.substring(0, 10)}...` : reason
        reasonMap.set(shortReason, (reasonMap.get(shortReason) || 0) + 1)
      })
      const reasons = Array.from(reasonMap.entries())
        .map(([reason, count]) => ({reason, count}))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // 部门离职统计
      const deptMap = new Map<string, number>()
      resignations?.forEach((r) => {
        const dept = r.department || '未分配'
        deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
      })
      const departments = Array.from(deptMap.entries())
        .map(([department, count]) => {
          const deptEmployees = allEmployees?.filter((e) => e.department === department).length || 1
          const rate = Math.round((count / deptEmployees) * 100)
          return {department, count, rate}
        })
        .sort((a, b) => b.count - a.count)

      // 月度趋势
      const monthlyMap = new Map<string, number>()
      resignations?.forEach((r) => {
        const month = r.completed_date.substring(0, 7)
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1)
      })
      const monthlyTrend = Array.from(monthlyMap.entries())
        .map(([month, count]) => ({month, count}))
        .sort((a, b) => a.month.localeCompare(b.month))

      const stats: OffboardingStatistics = {
        total_resignations: totalResignations,
        this_month: thisMonth,
        last_month: lastMonth,
        avg_tenure: 0,
        turnover_rate: turnoverRate,
        reasons,
        departments,
        monthly_trend: monthlyTrend
      }

      setStatistics(stats)
    } catch (error) {
      console.error('加载统计数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user, timeRange])

  useDidShow(() => {
    loadStatistics()
  })

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #fef2f2, #fee2e2)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">离职数据统计</Text>
            <Text className="text-sm opacity-90 block">分析离职趋势和原因</Text>
          </View>
          <View className="i-mdi-chart-bar text-5xl opacity-20"></View>
        </View>

        {/* 时间范围选择 */}
        <View className="bg-white bg-opacity-20 rounded-xl p-3">
          <Picker
            mode="selector"
            range={timeRangeOptions}
            value={timeRangeIndex}
            onChange={(e) => {
              const index = typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
              setTimeRangeIndex(index)
              setTimeRange(timeRangeValues[index])
            }}>
            <View className="flex items-center justify-between">
              <Text className="text-sm opacity-90">统计时间范围</Text>
              <View className="flex items-center">
                <Text className="text-base font-bold mr-2">{timeRangeOptions[timeRangeIndex]}</Text>
                <View className="i-mdi-chevron-down text-lg"></View>
              </View>
            </View>
          </Picker>
        </View>
      </View>

      {loading ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : statistics ? (
        <View className="p-4">
          {/* 核心指标 */}
          <View className="mb-6">
            <Text className="text-base font-bold text-foreground mb-3 block">核心指标</Text>
            <View className="grid grid-cols-2 gap-3">
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">总离职人数</Text>
                  <View className="i-mdi-account-remove text-xl text-red-500"></View>
                </View>
                <Text className="text-3xl font-bold text-foreground block">{statistics.total_resignations}</Text>
                <Text className="text-xs text-muted-foreground mt-1">人</Text>
              </View>

              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">离职率</Text>
                  <View className="i-mdi-percent text-xl text-orange-500"></View>
                </View>
                <Text className="text-3xl font-bold text-foreground block">{statistics.turnover_rate}%</Text>
                <Text className="text-xs text-muted-foreground mt-1">占比</Text>
              </View>

              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">本月离职</Text>
                  <View className="i-mdi-calendar-month text-xl text-blue-500"></View>
                </View>
                <Text className="text-3xl font-bold text-foreground block">{statistics.this_month}</Text>
                <Text className="text-xs text-muted-foreground mt-1">人</Text>
              </View>

              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">上月离职</Text>
                  <View className="i-mdi-calendar-arrow-left text-xl text-purple-500"></View>
                </View>
                <Text className="text-3xl font-bold text-foreground block">{statistics.last_month}</Text>
                <View className="flex items-center mt-1">
                  {statistics.this_month > statistics.last_month ? (
                    <>
                      <View className="i-mdi-arrow-up text-sm text-red-500 mr-1"></View>
                      <Text className="text-xs text-red-500">环比上升</Text>
                    </>
                  ) : statistics.this_month < statistics.last_month ? (
                    <>
                      <View className="i-mdi-arrow-down text-sm text-green-500 mr-1"></View>
                      <Text className="text-xs text-green-500">环比下降</Text>
                    </>
                  ) : (
                    <Text className="text-xs text-muted-foreground">环比持平</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* 离职原因统计 */}
          {statistics.reasons.length > 0 && (
            <View className="mb-6">
              <Text className="text-base font-bold text-foreground mb-3 block">离职原因TOP5</Text>
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                {statistics.reasons.map((item, index) => (
                  <View key={index} className="mb-3 last:mb-0">
                    <View className="flex items-center justify-between mb-2">
                      <View className="flex items-center flex-1">
                        <View className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-2">
                          <Text className="text-xs font-bold text-red-600">{index + 1}</Text>
                        </View>
                        <Text className="text-sm text-foreground flex-1">{item.reason}</Text>
                      </View>
                      <Text className="text-sm font-bold text-primary ml-2">{item.count}人</Text>
                    </View>
                    <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-gradient-to-r from-red-500 to-rose-500"
                        style={{width: `${(item.count / statistics.total_resignations) * 100}%`}}></View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 部门离职统计 */}
          {statistics.departments.length > 0 && (
            <View className="mb-6">
              <Text className="text-base font-bold text-foreground mb-3 block">部门离职统计</Text>
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                {statistics.departments.map((item, index) => (
                  <View key={index} className="mb-3 last:mb-0">
                    <View className="flex items-center justify-between mb-2">
                      <Text className="text-sm text-foreground">{item.department}</Text>
                      <View className="flex items-center">
                        <Text className="text-sm font-bold text-primary mr-2">{item.count}人</Text>
                        <View className="px-2 py-0.5 bg-red-100 rounded-full">
                          <Text className="text-xs text-red-600 font-medium">{item.rate}%</Text>
                        </View>
                      </View>
                    </View>
                    <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                        style={{width: `${item.rate}%`}}></View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 月度趋势 */}
          {statistics.monthly_trend.length > 0 && (
            <View className="mb-6">
              <Text className="text-base font-bold text-foreground mb-3 block">月度离职趋势</Text>
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                {statistics.monthly_trend.map((item, index) => (
                  <View
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <Text className="text-sm text-muted-foreground">{item.month}</Text>
                    <View className="flex items-center">
                      <View className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden mr-3">
                        <View
                          className="h-full bg-gradient-to-r from-red-500 to-rose-500"
                          style={{
                            width: `${(item.count / Math.max(...statistics.monthly_trend.map((m) => m.count))) * 100}%`
                          }}></View>
                      </View>
                      <Text className="text-sm font-bold text-primary w-8 text-right">{item.count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 返回按钮 */}
          <View className="mt-6">
            <View
              onClick={handleBack}
              className="bg-white border-2 border-gray-200 rounded-xl py-3 px-6 flex items-center justify-center active:bg-gray-50">
              <View className="i-mdi-arrow-left text-xl text-foreground mr-2"></View>
              <Text className="text-foreground font-medium">返回</Text>
            </View>
          </View>

          {/* 底部间距 */}
          <View className="h-6"></View>
        </View>
      ) : (
        <View className="text-center py-12">
          <View className="i-mdi-chart-line text-6xl text-muted-foreground mb-4"></View>
          <Text className="text-muted-foreground text-base block">暂无统计数据</Text>
        </View>
      )}
    </ScrollView>
  )
}
