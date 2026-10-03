import {ScrollView, Text, View} from '@tarojs/components'
import {navigateTo, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {EmptyState} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {getCostDataByTenantId, getEmployeesByTenantId, getScheduleResultsStats} from '@/db/api'
import type {CostData, Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const CostControl: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [costData, setCostData] = useState<CostData[]>([])
  const [_employees, setEmployees] = useState<Employee[]>([])
  const [_loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 统计数据
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalLaborCost: 0,
    avgCostRatio: 0,
    avgEfficiency: 0,
    totalEmployees: 0,
    regularEmployees: 0,
    partTimeEmployees: 0
  })

  // 排班统计数据
  const [scheduleStats, setScheduleStats] = useState({
    totalRecords: 0,
    totalRevenue: 0,
    totalLaborCost: 0,
    avgLaborCostRate: 0,
    qualifiedCount: 0,
    qualifiedRate: 0
  })

  const loadData = useCallback(async () => {
    if (!currentTenant) {
      navigateTo({url: '/pages/tenant-select/index'})
      return
    }

    setLoading(true)
    try {
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      const startDate = thirtyDaysAgo.toISOString().split('T')[0]
      const endDate = today.toISOString().split('T')[0]

      const [costDataResult, employeesData, scheduleResultsData] = await Promise.all([
        getCostDataByTenantId(currentTenant.id, {startDate, endDate}),
        getEmployeesByTenantId(currentTenant.id),
        getScheduleResultsStats(currentTenant.id, startDate, endDate)
      ])

      setCostData(costDataResult)
      setEmployees(employeesData)

      // 计算统计数据
      const totalRevenue = costDataResult.reduce((sum, item) => sum + (item.total_revenue || 0), 0)
      const totalLaborCost = costDataResult.reduce((sum, item) => sum + (item.total_labor_cost || 0), 0)
      const avgCostRatio =
        costDataResult.length > 0
          ? costDataResult.reduce((sum, item) => sum + (item.labor_cost_ratio || 0), 0) / costDataResult.length
          : 0
      const avgEfficiency =
        costDataResult.length > 0
          ? costDataResult.reduce((sum, item) => sum + (item.avg_efficiency || 0), 0) / costDataResult.length
          : 0

      const regularEmployees = employeesData.filter((emp) => emp.employee_type === 'full_time')
      const partTimeEmployees = employeesData.filter((emp) => emp.employee_type === 'part_time')

      setStats({
        totalRevenue: Math.round(totalRevenue),
        totalLaborCost: Math.round(totalLaborCost),
        avgCostRatio: Math.round(avgCostRatio * 100) / 100,
        avgEfficiency: Math.round(avgEfficiency),
        totalEmployees: employeesData.length,
        regularEmployees: regularEmployees.length,
        partTimeEmployees: partTimeEmployees.length
      })

      // 设置排班统计数据
      setScheduleStats({
        totalRecords: scheduleResultsData.total_days,
        totalRevenue: Math.round(scheduleResultsData.total_revenue),
        totalLaborCost: Math.round(scheduleResultsData.total_labor_cost),
        avgLaborCostRate: Math.round(scheduleResultsData.avg_labor_cost_rate * 100) / 100,
        qualifiedCount: 0,
        qualifiedRate: 0
      })

      console.log('=== 成本管控页面数据加载完成 ===', {
        排班记录数: scheduleResultsData.total_days,
        排班总营收: scheduleResultsData.total_revenue,
        排班总成本: scheduleResultsData.total_labor_cost
      })
    } catch (error) {
      console.error('加载数据失败:', error)
      showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentTenant])

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  if (!currentTenant) {
    return null
  }

  // 最近7天数据
  const recentData = costData.slice(0, 7).reverse()

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen bg-transparent"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4 space-y-4">
          {/* 标题 */}
          <View>
            <Text className="text-lg font-bold text-foreground block mb-1">成本管控</Text>
            <Text className="text-sm text-muted-foreground block">近30天成本数据分析</Text>
          </View>

          {_loading ? (
            <SkeletonList count={5} />
          ) : costData.length === 0 ? (
            <EmptyState icon="i-mdi-cash-multiple" title="暂无成本数据" description="还没有成本数据记录" />
          ) : (
            <>
              {/* 核心指标 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">核心指标</Text>
                <View className="space-y-3">
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-currency-cny text-lg text-green-500"></View>
                      <Text className="text-sm text-foreground">总营收</Text>
                    </View>
                    <Text className="text-lg font-bold text-muted-foreground">
                      ¥{stats.totalRevenue.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-cash text-lg text-red-500"></View>
                      <Text className="text-sm text-foreground">人力成本</Text>
                    </View>
                    <Text className="text-lg font-bold text-red-600">¥{stats.totalLaborCost.toLocaleString()}</Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-percent text-lg text-orange-500"></View>
                      <Text className="text-sm text-foreground">平均成本占比</Text>
                    </View>
                    <Text className="text-lg font-bold text-muted-foreground">{stats.avgCostRatio}%</Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-chart-line text-lg text-blue-500"></View>
                      <Text className="text-sm text-foreground">平均效能</Text>
                    </View>
                    <Text className="text-lg font-bold text-muted-foreground">{stats.avgEfficiency}</Text>
                  </View>
                </View>
              </View>

              {/* 人员配置 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">人员配置</Text>
                <View className="grid grid-cols-3 gap-3">
                  <View className="bg-blue-100 rounded-xl p-3 text-center">
                    <View className="i-mdi-account-group text-2xl text-blue-500 mx-auto mb-2"></View>
                    <Text className="text-2xl font-bold text-muted-foreground block">{stats.totalEmployees}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">总员工</Text>
                  </View>
                  <View className="bg-blue-100 rounded-xl p-3 text-center">
                    <View className="i-mdi-account-tie text-2xl text-green-500 mx-auto mb-2"></View>
                    <Text className="text-2xl font-bold text-muted-foreground block">{stats.regularEmployees}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">正式</Text>
                  </View>
                  <View className="bg-blue-100 rounded-xl p-3 text-center">
                    <View className="i-mdi-account-clock text-2xl text-orange-500 mx-auto mb-2"></View>
                    <Text className="text-2xl font-bold text-muted-foreground block">{stats.partTimeEmployees}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">兼职</Text>
                  </View>
                </View>
              </View>

              {/* 排班成本数据 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">排班成本数据</Text>
                <View className="space-y-3">
                  <View className="bg-blue-100 rounded-xl p-3">
                    <View className="flex items-center justify-between">
                      <View>
                        <Text className="text-xs text-muted-foreground block mb-1">排班记录数</Text>
                        <Text className="text-2xl font-bold text-muted-foreground block">
                          {scheduleStats.totalRecords}
                        </Text>
                      </View>
                      <View className="i-mdi-calendar-check text-3xl text-blue-400"></View>
                    </View>
                  </View>
                  <View className="grid grid-cols-2 gap-3">
                    <View className="bg-blue-100 rounded-xl p-3">
                      <Text className="text-xs text-muted-foreground block mb-1">排班总营收</Text>
                      <Text className="text-lg font-bold text-muted-foreground block">
                        ¥{scheduleStats.totalRevenue.toLocaleString()}
                      </Text>
                    </View>
                    <View className="bg-blue-100 rounded-xl p-3">
                      <Text className="text-xs text-muted-foreground block mb-1">排班总成本</Text>
                      <Text className="text-lg font-bold text-red-600 block">
                        ¥{scheduleStats.totalLaborCost.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  <View className="grid grid-cols-2 gap-3">
                    <View className="bg-blue-100 rounded-xl p-3">
                      <Text className="text-xs text-muted-foreground block mb-1">平均成本率</Text>
                      <Text className="text-lg font-bold text-muted-foreground block">
                        {scheduleStats.avgLaborCostRate.toFixed(2)}%
                      </Text>
                    </View>
                    <View className="bg-blue-100 rounded-xl p-3">
                      <Text className="text-xs text-muted-foreground block mb-1">成本合格率</Text>
                      <Text className="text-lg font-bold text-indigo-600 block">
                        {scheduleStats.qualifiedRate.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 趋势分析 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">近7天趋势</Text>
                {recentData.length === 0 ? (
                  <Text className="text-sm text-muted-foreground text-center py-4">暂无数据</Text>
                ) : (
                  <View className="space-y-3">
                    {recentData.map((item, index) => (
                      <View key={index} className="border border-border rounded-xl p-3">
                        <View className="flex items-center justify-between mb-2">
                          <Text className="text-sm font-bold text-foreground">{item.data_date}</Text>
                          <View className="flex items-center gap-2">
                            <Text className="text-xs text-muted-foreground">成本占比</Text>
                            <Text className="text-sm font-bold text-muted-foreground">{item.labor_cost_ratio}%</Text>
                          </View>
                        </View>
                        <View className="flex items-center justify-between">
                          <View>
                            <Text className="text-xs text-muted-foreground block">营收</Text>
                            <Text className="text-sm font-bold text-muted-foreground block">
                              ¥{(item.revenue || 0).toLocaleString()}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-xs text-muted-foreground block">成本</Text>
                            <Text className="text-sm font-bold text-red-600 block">
                              ¥{(item.labor_cost || 0).toLocaleString()}
                            </Text>
                          </View>
                          <View>
                            <Text className="text-xs text-muted-foreground block">效能</Text>
                            <Text className="text-sm font-bold text-muted-foreground block">{item.avg_efficiency}</Text>
                          </View>
                          <View>
                            <Text className="text-xs text-muted-foreground block">人数</Text>
                            <Text className="text-sm font-bold text-muted-foreground block">{item.employee_count}</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* 成本分析建议 */}
              <View className="bg-blue-100 rounded-lg p-4 shadow-sm">
                <View className="flex items-center gap-2 mb-3">
                  <View className="i-mdi-lightbulb text-xl text-blue-500"></View>
                  <Text className="text-base font-bold text-foreground">成本优化建议</Text>
                </View>
                <View className="space-y-2">
                  {stats.avgCostRatio > 30 && (
                    <View className="flex items-start gap-2">
                      <View className="i-mdi-alert-circle text-base text-orange-500 mt-0.5"></View>
                      <Text className="text-sm text-foreground flex-1">成本占比偏高，建议优化排班计划，提高人效</Text>
                    </View>
                  )}
                  {stats.avgEfficiency < 50 && (
                    <View className="flex items-start gap-2">
                      <View className="i-mdi-alert-circle text-base text-orange-500 mt-0.5"></View>
                      <Text className="text-sm text-foreground flex-1">
                        平均效能偏低，建议加强员工培训，提升工作效率
                      </Text>
                    </View>
                  )}
                  {stats.partTimeEmployees > stats.regularEmployees && (
                    <View className="flex items-start gap-2">
                      <View className="i-mdi-information text-base text-blue-500 mt-0.5"></View>
                      <Text className="text-sm text-foreground flex-1">
                        兼职员工占比较高，建议平衡正式与兼职员工比例
                      </Text>
                    </View>
                  )}
                  {stats.avgCostRatio <= 30 && stats.avgEfficiency >= 50 && (
                    <View className="flex items-start gap-2">
                      <View className="i-mdi-check-circle text-base text-green-500 mt-0.5"></View>
                      <Text className="text-sm text-foreground flex-1">成本控制良好，继续保持当前运营策略</Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default CostControl
