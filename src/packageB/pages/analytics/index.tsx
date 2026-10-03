import {ScrollView, Text, View} from '@tarojs/components'
import {navigateTo, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {
  getCostDataByTenantId,
  getEmployeesByTenantId,
  getScheduleLogsByTenantId,
  getScheduleResultsStats,
  getSchedulesByTenantId,
  getStoresByTenantId
} from '@/db/api'
import type {CostData, Employee, Schedule, ScheduleLog, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const Analytics: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // Tab状态
  const [activeTab, setActiveTab] = useState<'overview' | 'cost' | 'schedule'>('overview')

  const [stores, setStores] = useState<Store[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [_schedules, setSchedules] = useState<Schedule[]>([])
  const [logs, setLogs] = useState<ScheduleLog[]>([])
  const [costData, setCostData] = useState<CostData[]>([])
  const [_loading, setLoading] = useState(true)

  // 统计数据
  const [stats, setStats] = useState({
    totalStores: 0,
    totalEmployees: 0,
    totalSchedules: 0,
    totalLogs: 0,
    avgScore: 0,
    excellentRate: 0,
    completionRate: 0
  })

  // 成本统计数据
  const [costStats, setCostStats] = useState({
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
    qualifiedRate: 0,
    avgPlannedStaff: 0,
    avgRestStaff: 0,
    totalPartTimeHours: 0,
    highEfficiencyCount: 0,
    normalEfficiencyCount: 0,
    lowEfficiencyCount: 0
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

      const [storesData, employeesData, schedulesData, logsData, costDataResult, scheduleResultsData] =
        await Promise.all([
          getStoresByTenantId(currentTenant.id),
          getEmployeesByTenantId(currentTenant.id),
          getSchedulesByTenantId(currentTenant.id),
          getScheduleLogsByTenantId(currentTenant.id, {startDate, endDate}),
          getCostDataByTenantId(currentTenant.id, {startDate, endDate}),
          getScheduleResultsStats(currentTenant.id, startDate, endDate)
        ])

      setStores(storesData)
      setEmployees(employeesData)
      setSchedules(schedulesData)
      setLogs(logsData)
      setCostData(costDataResult)

      // 计算统计数据
      const totalLogs = logsData.length
      const excellentLogs = logsData.filter((log) => log.completion_status === 'excellent').length
      const completedLogs = logsData.filter((log) => log.completion_status !== 'poor').length
      const logsWithScore = logsData.filter((log) => log.score !== null)
      const avgScore =
        logsWithScore.length > 0
          ? logsWithScore.reduce((sum, log) => sum + (log.score || 0), 0) / logsWithScore.length
          : 0

      setStats({
        totalStores: storesData.length,
        totalEmployees: employeesData.length,
        totalSchedules: schedulesData.length,
        totalLogs,
        avgScore: Math.round(avgScore * 10) / 10,
        excellentRate: totalLogs > 0 ? Math.round((excellentLogs / totalLogs) * 100) : 0,
        completionRate: totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0
      })

      // 计算成本统计数据
      const totalRevenue = costDataResult.reduce((sum, item) => sum + (item.revenue || 0), 0)
      const totalLaborCost = costDataResult.reduce((sum, item) => sum + (item.labor_cost || 0), 0)
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

      setCostStats({
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
        qualifiedRate: 0,
        avgPlannedStaff: 0,
        avgRestStaff: 0,
        totalPartTimeHours: 0,
        highEfficiencyCount: 0,
        normalEfficiencyCount: 0,
        lowEfficiencyCount: 0
      })

      console.log('=== 数据分析页面数据加载完成 ===', {
        排班记录数: scheduleResultsData.total_days,
        排班总营收: scheduleResultsData.total_revenue,
        排班总成本: scheduleResultsData.total_labor_cost
      })
    } catch (error) {
      console.error('加载数据失败:', error)
      showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  if (!currentTenant) {
    return null
  }

  // 按店铺统计
  const storeStats = stores.map((store) => {
    const storeLogs = logs.filter((log) => log.store_id === store.id)
    const storeEmployees = employees.filter((emp) => emp.store_id === store.id)
    return {
      name: store.name,
      employeeCount: storeEmployees.length,
      logCount: storeLogs.length,
      excellentCount: storeLogs.filter((log) => log.completion_status === 'excellent').length
    }
  })

  // 按员工类型统计
  const regularEmployees = employees.filter((emp) => emp.employee_type === 'full_time')
  const partTimeEmployees = employees.filter((emp) => emp.employee_type === 'part_time')

  // 最近7天成本数据
  const recentCostData = costData.slice(0, 7).reverse()

  // 成本状态评估
  const getCostRatioStatus = (ratio: number) => {
    if (ratio <= 25) return {text: '优秀', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    if (ratio <= 30) return {text: '良好', color: 'text-white', bgColor: 'bg-blue-100'}
    return {text: '偏高', color: 'text-red-600', bgColor: 'bg-blue-100'}
  }

  const costRatioStatus = getCostRatioStatus(costStats.avgCostRatio)

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4 space-y-4">
          {/* 标题 */}
          <View>
            <Text className="text-lg font-bold text-foreground block mb-1">数据分析</Text>
            <Text className="text-sm text-muted-foreground block">近30天数据统计与成本分析</Text>
          </View>

          {/* Tab切换 */}
          <View className="bg-white rounded-lg p-2 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center gap-2">
              <View
                className={`flex-1 text-center py-2 rounded-xl transition-all ${
                  activeTab === 'overview' ? 'bg-green-500' : 'bg-gray-50'
                }`}
                onClick={() => setActiveTab('overview')}>
                <Text
                  className={`text-sm font-semibold ${activeTab === 'overview' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  运营概览
                </Text>
              </View>
              <View
                className={`flex-1 text-center py-2 rounded-xl transition-all ${
                  activeTab === 'schedule' ? 'bg-blue-100' : 'bg-gray-50'
                }`}
                onClick={() => setActiveTab('schedule')}>
                <Text
                  className={`text-sm font-semibold ${activeTab === 'schedule' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  排班数据
                </Text>
              </View>
              <View
                className={`flex-1 text-center py-2 rounded-xl transition-all ${
                  activeTab === 'cost' ? 'bg-blue-100' : 'bg-gray-50'
                }`}
                onClick={() => setActiveTab('cost')}>
                <Text
                  className={`text-sm font-semibold ${activeTab === 'cost' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  成本管控
                </Text>
              </View>
            </View>
          </View>

          {/* 运营概览Tab */}
          {activeTab === 'overview' && (
            <>
              {/* 核心指标 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">核心指标</Text>
                <View className="grid grid-cols-2 gap-3">
                  <View className="bg-blue-100 rounded-xl p-3">
                    <View className="i-mdi-store text-2xl text-blue-500 mb-2"></View>
                    <Text className="text-2xl font-bold text-muted-foreground block">{stats.totalStores}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">店铺数量</Text>
                  </View>
                  <View className="bg-blue-100 rounded-xl p-3">
                    <View className="i-mdi-account-group text-2xl text-green-500 mb-2"></View>
                    <Text className="text-2xl font-bold text-muted-foreground block">{stats.totalEmployees}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">员工数量</Text>
                  </View>
                  <View className="bg-blue-100 rounded-xl p-3">
                    <View className="i-mdi-calendar-clock text-2xl text-purple-500 mb-2"></View>
                    <Text className="text-2xl font-bold text-muted-foreground block">{stats.totalSchedules}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">排班计划</Text>
                  </View>
                  <View className="bg-blue-100 rounded-xl p-3">
                    <View className="i-mdi-clipboard-text text-2xl text-orange-500 mb-2"></View>
                    <Text className="text-2xl font-bold text-muted-foreground block">{stats.totalLogs}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">排班日志</Text>
                  </View>
                </View>
              </View>

              {/* 质量指标 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">质量指标</Text>
                <View className="space-y-3">
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-star text-lg text-yellow-500"></View>
                      <Text className="text-sm text-foreground">平均评分</Text>
                    </View>
                    <Text className="text-lg font-bold text-yellow-600">{stats.avgScore} 分</Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-trophy text-lg text-green-500"></View>
                      <Text className="text-sm text-foreground">优秀率</Text>
                    </View>
                    <Text className="text-lg font-bold text-muted-foreground">{stats.excellentRate}%</Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-check-circle text-lg text-blue-500"></View>
                      <Text className="text-sm text-foreground">完成率</Text>
                    </View>
                    <Text className="text-lg font-bold text-muted-foreground">{stats.completionRate}%</Text>
                  </View>
                </View>
              </View>

              {/* 店铺统计 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">店铺统计</Text>
                {storeStats.length === 0 ? (
                  <Text className="text-sm text-muted-foreground text-center py-4">暂无店铺数据</Text>
                ) : (
                  <View className="space-y-3">
                    {storeStats.map((store, index) => (
                      <View key={index} className="border border-border rounded-xl p-3">
                        <Text className="text-sm font-bold text-foreground block mb-2">{store.name}</Text>
                        <View className="flex items-center justify-between">
                          <View className="flex items-center gap-4">
                            <View>
                              <Text className="text-xs text-muted-foreground block">员工</Text>
                              <Text className="text-base font-bold text-muted-foreground block">
                                {store.employeeCount}
                              </Text>
                            </View>
                            <View>
                              <Text className="text-xs text-muted-foreground block">日志</Text>
                              <Text className="text-base font-bold text-muted-foreground block">{store.logCount}</Text>
                            </View>
                            <View>
                              <Text className="text-xs text-muted-foreground block">优秀</Text>
                              <Text className="text-base font-bold text-muted-foreground block">
                                {store.excellentCount}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* 员工类型统计 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">员工类型统计</Text>
                <View className="grid grid-cols-2 gap-3">
                  <View className="border border-border rounded-xl p-3 text-center">
                    <View className="i-mdi-account-tie text-3xl text-blue-500 mx-auto mb-2"></View>
                    <Text className="text-2xl font-bold text-muted-foreground block">{regularEmployees.length}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">正式员工</Text>
                  </View>
                  <View className="border border-border rounded-xl p-3 text-center">
                    <View className="i-mdi-account-clock text-3xl text-orange-500 mx-auto mb-2"></View>
                    <Text className="text-2xl font-bold text-muted-foreground block">{partTimeEmployees.length}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">兼职员工</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* 成本管控Tab */}
          {activeTab === 'cost' && (
            <>
              {/* 成本概览 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">成本概览</Text>
                <View className="space-y-3">
                  <View className="bg-blue-100 rounded-xl p-3">
                    <View className="flex items-center justify-between">
                      <View>
                        <Text className="text-xs text-muted-foreground block mb-1">总营收</Text>
                        <Text className="text-2xl font-bold text-muted-foreground block">
                          ¥{costStats.totalRevenue.toLocaleString()}
                        </Text>
                      </View>
                      <View className="i-mdi-currency-cny text-3xl text-blue-400"></View>
                    </View>
                  </View>
                  <View className="bg-blue-100 rounded-xl p-3">
                    <View className="flex items-center justify-between">
                      <View>
                        <Text className="text-xs text-muted-foreground block mb-1">总人力成本</Text>
                        <Text className="text-2xl font-bold text-red-600 block">
                          ¥{costStats.totalLaborCost.toLocaleString()}
                        </Text>
                      </View>
                      <View className="i-mdi-cash text-3xl text-red-400"></View>
                    </View>
                  </View>
                </View>
              </View>

              {/* 成本指标 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">成本指标</Text>
                <View className="space-y-3">
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-percent text-lg text-purple-500"></View>
                      <Text className="text-sm text-foreground">平均成本率</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <Text className="text-lg font-bold text-muted-foreground">{costStats.avgCostRatio}%</Text>
                      <View className={`px-2 py-1 rounded ${costRatioStatus.bgColor}`}>
                        <Text className={`text-xs font-semibold ${costRatioStatus.color}`}>{costRatioStatus.text}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-chart-line text-lg text-green-500"></View>
                      <Text className="text-sm text-foreground">平均人效</Text>
                    </View>
                    <Text className="text-lg font-bold text-muted-foreground">¥{costStats.avgEfficiency}</Text>
                  </View>
                </View>
              </View>

              {/* 人员结构 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">人员结构</Text>
                <View className="grid grid-cols-3 gap-3">
                  <View className="text-center">
                    <Text className="text-2xl font-bold text-muted-foreground block">{costStats.totalEmployees}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">总人数</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-2xl font-bold text-muted-foreground block">{costStats.regularEmployees}</Text>
                    <Text className="text-xs text-muted-foreground block mt-1">正式员工</Text>
                  </View>
                  <View className="text-center">
                    <Text className="text-2xl font-bold text-muted-foreground block">
                      {costStats.partTimeEmployees}
                    </Text>
                    <Text className="text-xs text-muted-foreground block mt-1">兼职员工</Text>
                  </View>
                </View>
              </View>

              {/* 成本趋势 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">近7天成本趋势</Text>
                {recentCostData.length === 0 ? (
                  <Text className="text-sm text-muted-foreground text-center py-4">暂无成本数据</Text>
                ) : (
                  <View className="space-y-2">
                    {recentCostData.map((item, index) => {
                      const itemCostRatioStatus = getCostRatioStatus(item.labor_cost_ratio || 0)
                      return (
                        <View key={index} className="border border-border rounded-xl p-3">
                          <View className="flex items-center justify-between mb-2">
                            <Text className="text-xs text-muted-foreground">{item.data_date}</Text>
                            <View className={`px-2 py-1 rounded ${itemCostRatioStatus.bgColor}`}>
                              <Text className={`text-xs font-semibold ${itemCostRatioStatus.color}`}>
                                {itemCostRatioStatus.text}
                              </Text>
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
                              <Text className="text-xs text-muted-foreground block">成本率</Text>
                              <Text className="text-sm font-bold text-muted-foreground block">
                                {(item.labor_cost_ratio || 0).toFixed(1)}%
                              </Text>
                            </View>
                            <View>
                              <Text className="text-xs text-muted-foreground block">人效</Text>
                              <Text className="text-sm font-bold text-muted-foreground block">
                                ¥{Math.round(item.avg_efficiency || 0)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      )
                    })}
                  </View>
                )}
              </View>

              {/* 成本控制建议 */}
              <View className="bg-blue-100 rounded-lg p-4 shadow-sm">
                <View className="flex items-center gap-2 mb-3">
                  <View className="i-mdi-lightbulb text-xl text-muted-foreground"></View>
                  <Text className="text-base font-bold text-foreground">成本控制建议</Text>
                </View>
                <View className="space-y-2">
                  {costStats.avgCostRatio > 30 && (
                    <View className="flex items-start gap-2">
                      <View className="i-mdi-alert-circle text-red-500 mt-0.5"></View>
                      <Text className="text-sm text-foreground flex-1">人力成本率偏高，建议优化排班，提高人效</Text>
                    </View>
                  )}
                  {costStats.avgEfficiency < 1000 && (
                    <View className="flex items-start gap-2">
                      <View className="i-mdi-alert-circle text-orange-500 mt-0.5"></View>
                      <Text className="text-sm text-foreground flex-1">人效较低，建议加强员工培训和激励</Text>
                    </View>
                  )}
                  {costStats.avgCostRatio <= 25 && costStats.avgEfficiency >= 1500 && (
                    <View className="flex items-start gap-2">
                      <View className="i-mdi-check-circle text-green-500 mt-0.5"></View>
                      <Text className="text-sm text-foreground flex-1">成本控制优秀，继续保持！</Text>
                    </View>
                  )}
                  <View className="flex items-start gap-2">
                    <View className="i-mdi-information text-blue-500 mt-0.5"></View>
                    <Text className="text-sm text-foreground flex-1">
                      建议人力成本率控制在20%-25%之间（20%以内为优秀），人效不低于1000元/人
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* 排班数据Tab */}
          {activeTab === 'schedule' && (
            <>
              {/* 排班概览 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">排班概览</Text>
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
                      <View className="flex items-center justify-between">
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-1">成本合格</Text>
                          <Text className="text-xl font-bold text-muted-foreground block">
                            {scheduleStats.qualifiedCount}
                          </Text>
                        </View>
                        <View className="i-mdi-check-circle text-2xl text-green-400"></View>
                      </View>
                    </View>
                    <View className="bg-blue-100 rounded-xl p-3">
                      <View className="flex items-center justify-between">
                        <View>
                          <Text className="text-xs text-muted-foreground block mb-1">合格率</Text>
                          <Text className="text-xl font-bold text-muted-foreground block">
                            {scheduleStats.qualifiedRate.toFixed(1)}%
                          </Text>
                        </View>
                        <View className="i-mdi-percent text-2xl text-purple-400"></View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* 营收与成本 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">营收与成本</Text>
                <View className="space-y-3">
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-currency-cny text-lg text-blue-500"></View>
                      <Text className="text-sm text-foreground">总营收</Text>
                    </View>
                    <Text className="text-lg font-bold text-muted-foreground">
                      ¥{scheduleStats.totalRevenue.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-cash text-lg text-red-500"></View>
                      <Text className="text-sm text-foreground">总人力成本</Text>
                    </View>
                    <Text className="text-lg font-bold text-red-600">
                      ¥{scheduleStats.totalLaborCost.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-percent text-lg text-purple-500"></View>
                      <Text className="text-sm text-foreground">平均成本率</Text>
                    </View>
                    <Text className="text-lg font-bold text-muted-foreground">
                      {scheduleStats.avgLaborCostRate.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* 人员配置 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">人员配置</Text>
                <View className="grid grid-cols-2 gap-3">
                  <View className="bg-blue-100 rounded-xl p-3 text-center">
                    <Text className="text-2xl font-bold text-muted-foreground block">
                      {scheduleStats.avgPlannedStaff.toFixed(1)}
                    </Text>
                    <Text className="text-xs text-muted-foreground block mt-1">平均上岗人数</Text>
                  </View>
                  <View className="bg-blue-100 rounded-xl p-3 text-center">
                    <Text className="text-2xl font-bold text-muted-foreground block">
                      {scheduleStats.avgRestStaff.toFixed(1)}
                    </Text>
                    <Text className="text-xs text-muted-foreground block mt-1">平均排休人数</Text>
                  </View>
                </View>
              </View>

              {/* 兼职工时 */}
              {scheduleStats.totalPartTimeHours > 0 && (
                <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  <Text className="text-base font-bold text-foreground block mb-3">兼职工时</Text>
                  <View className="bg-amber-50 rounded-xl p-3">
                    <View className="flex items-center justify-between">
                      <View>
                        <Text className="text-xs text-muted-foreground block mb-1">总兼职工时</Text>
                        <Text className="text-2xl font-bold text-amber-600 block">
                          {scheduleStats.totalPartTimeHours.toFixed(1)}小时
                        </Text>
                      </View>
                      <View className="i-mdi-clock-outline text-3xl text-amber-400"></View>
                    </View>
                  </View>
                </View>
              )}

              {/* 效能区间分布 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <Text className="text-base font-bold text-foreground block mb-3">效能区间分布</Text>
                <View className="space-y-3">
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="w-3 h-3 rounded-full bg-blue-100"></View>
                      <Text className="text-sm text-foreground">高效区</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <Text className="text-lg font-bold text-muted-foreground">
                        {scheduleStats.highEfficiencyCount}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        (
                        {scheduleStats.totalRecords > 0
                          ? ((scheduleStats.highEfficiencyCount / scheduleStats.totalRecords) * 100).toFixed(1)
                          : 0}
                        %)
                      </Text>
                    </View>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="w-3 h-3 rounded-full bg-blue-100"></View>
                      <Text className="text-sm text-foreground">正常区</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <Text className="text-lg font-bold text-yellow-600">{scheduleStats.normalEfficiencyCount}</Text>
                      <Text className="text-xs text-muted-foreground">
                        (
                        {scheduleStats.totalRecords > 0
                          ? ((scheduleStats.normalEfficiencyCount / scheduleStats.totalRecords) * 100).toFixed(1)
                          : 0}
                        %)
                      </Text>
                    </View>
                  </View>
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="w-3 h-3 rounded-full bg-blue-100"></View>
                      <Text className="text-sm text-foreground">低效区</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <Text className="text-lg font-bold text-red-600">{scheduleStats.lowEfficiencyCount}</Text>
                      <Text className="text-xs text-muted-foreground">
                        (
                        {scheduleStats.totalRecords > 0
                          ? ((scheduleStats.lowEfficiencyCount / scheduleStats.totalRecords) * 100).toFixed(1)
                          : 0}
                        %)
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 排班优化建议 */}
              <View className="bg-blue-100 rounded-lg p-4 shadow-sm">
                <View className="flex items-center gap-2 mb-3">
                  <View className="i-mdi-lightbulb text-xl text-muted-foreground"></View>
                  <Text className="text-base font-bold text-foreground">排班优化建议</Text>
                </View>
                <View className="space-y-2">
                  {scheduleStats.qualifiedRate < 80 && (
                    <View className="flex items-start gap-2">
                      <View className="i-mdi-alert-circle text-red-500 mt-0.5"></View>
                      <Text className="text-sm text-foreground flex-1">
                        成本合格率较低（{scheduleStats.qualifiedRate.toFixed(1)}%），建议优化排班策略
                      </Text>
                    </View>
                  )}
                  {scheduleStats.lowEfficiencyCount > scheduleStats.totalRecords * 0.3 && (
                    <View className="flex items-start gap-2">
                      <View className="i-mdi-alert-circle text-orange-500 mt-0.5"></View>
                      <Text className="text-sm text-foreground flex-1">
                        低效区排班占比较高，建议调整人员配置，提高效能
                      </Text>
                    </View>
                  )}
                  {scheduleStats.qualifiedRate >= 90 &&
                    scheduleStats.highEfficiencyCount > scheduleStats.totalRecords * 0.5 && (
                      <View className="flex items-start gap-2">
                        <View className="i-mdi-check-circle text-green-500 mt-0.5"></View>
                        <Text className="text-sm text-foreground flex-1">排班质量优秀，成本控制良好，继续保持！</Text>
                      </View>
                    )}
                  <View className="flex items-start gap-2">
                    <View className="i-mdi-information text-blue-500 mt-0.5"></View>
                    <Text className="text-sm text-foreground flex-1">
                      建议成本合格率保持在90%以上，高效区排班占比不低于60%
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default Analytics
