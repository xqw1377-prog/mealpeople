import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {supabase} from '@/client/supabase'
import {useTenantStore} from '@/store/tenant'

// 排班记录类型
interface ScheduleRecord {
  id: string
  operation_date: string
  created_at: string
  created_by_name: string
  store_name: string
  // 计划数据（排班规划）
  estimated_revenue: number
  target_staff_count: number
  planned_staff_count: number
  rest_staff_count: number
  rest_days: number
  part_time_count: number
  part_time_hours: number
  achievement_rate: number
  total_labor_cost: number
  labor_cost_rate: number
  is_cost_qualified: boolean
  efficiency_zone: string
  // 调整数据（营业调整）
  adjusted_revenue?: number | null
  adjusted_staff_count?: number | null
  adjusted_rest_count?: number | null
  adjusted_part_time_hours?: number | null
  // 实际数据（营业复盘）
  actual_revenue?: number | null
  actual_staff_count?: number | null
  actual_rest_count?: number | null
  actual_part_time_hours?: number | null
  per_capita_revenue?: number | null
  efficiency_rating?: string | null
}

const ScheduleLogs: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)
  const [records, setRecords] = useState<ScheduleRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null)

  // 🎯 新增：快捷筛选状态
  const [quickFilter, setQuickFilter] = useState<'today' | 'week' | 'month' | 'all'>('today')

  // 🔥 添加调试日志
  console.log('========== 排班日志页面状态 ==========')
  console.log('当前租户:', currentTenant?.name, currentTenant?.id)
  console.log('当前门店:', currentStore?.name, currentStore?.id)
  console.log('记录数量:', records.length)
  console.log('加载状态:', loading)

  // 🎯 新增：计算统计数据
  const statistics = useMemo(() => {
    if (records.length === 0) return null

    const totalCount = records.length
    const avgAchievementRate = records.reduce((sum, r) => sum + r.achievement_rate, 0) / totalCount
    const avgCostRate = records.reduce((sum, r) => sum + r.labor_cost_rate, 0) / totalCount
    const excellentCount = records.filter((r) => r.achievement_rate >= 0.95 && r.is_cost_qualified).length
    const qualifiedCount = records.filter((r) => r.is_cost_qualified).length

    return {
      totalCount,
      avgAchievementRate,
      avgCostRate,
      excellentCount,
      qualifiedCount,
      excellentRate: totalCount > 0 ? excellentCount / totalCount : 0,
      qualifiedRate: totalCount > 0 ? qualifiedCount / totalCount : 0
    }
  }, [records])

  // 🎯 新增：快捷筛选处理函数
  const handleQuickFilter = useCallback((filter: 'today' | 'week' | 'month' | 'all') => {
    setQuickFilter(filter)

    const today = new Date()
    let startDate: string
    const endDate: string = today.toISOString().split('T')[0]

    switch (filter) {
      case 'today':
        startDate = endDate
        setViewMode('today')
        setSelectedDate(startDate)
        break
      case 'week': {
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        startDate = weekStart.toISOString().split('T')[0]
        setViewMode('all')
        break
      }
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        startDate = monthStart.toISOString().split('T')[0]
        setViewMode('all')
        break
      }
      case 'all':
        setViewMode('all')
        break
    }
  }, [])

  // 加载排班记录
  const loadRecords = useCallback(async () => {
    console.log('========== loadRecords 被调用 ==========')
    console.log('租户ID:', currentTenant?.id)
    console.log('门店ID:', currentStore?.id)

    if (!currentTenant?.id || !currentStore?.id) {
      console.log('⚠️ 缺少租户或门店信息，跳过加载')
      console.log('  - 租户存在:', !!currentTenant?.id)
      console.log('  - 门店存在:', !!currentStore?.id)
      return
    }

    setLoading(true)
    try {
      console.log('========== 开始加载排班记录 ==========')
      console.log('租户ID:', currentTenant.id)
      console.log('门店ID:', currentStore.id)
      console.log('查看模式:', viewMode)
      console.log('选择日期:', selectedDate)

      // 第一步：查询排班结果
      let scheduleQuery = supabase
        .from('schedule_results')
        .select(
          `
          id,
          operation_date,
          created_at,
          estimated_revenue,
          target_staff_count,
          planned_staff_count,
          rest_staff_count,
          rest_days,
          part_time_count,
          part_time_hours,
          achievement_rate,
          total_labor_cost,
          labor_cost_rate,
          is_cost_qualified,
          efficiency_zone
        `
        )
        .eq('tenant_id', currentTenant.id)
        .eq('store_id', currentStore.id)

      // 根据查看模式筛选
      if (viewMode === 'today') {
        scheduleQuery = scheduleQuery.eq('operation_date', selectedDate)
      }

      scheduleQuery = scheduleQuery.order('operation_date', {ascending: false}).order('created_at', {ascending: false})

      const {data: scheduleData, error: scheduleError} = await scheduleQuery

      if (scheduleError) {
        console.error('❌ 加载排班记录失败:', scheduleError)
        Taro.showToast({title: '加载失败', icon: 'none'})
        return
      }

      console.log('========== 排班记录查询结果 ==========')
      console.log('记录数量:', scheduleData?.length || 0)
      if (scheduleData && scheduleData.length > 0) {
        console.log(
          '记录详情:',
          scheduleData.map((r) => ({
            日期: r.operation_date,
            创建时间: r.created_at,
            计划人数: r.planned_staff_count,
            排休人数: r.rest_staff_count
          }))
        )
      } else {
        console.log('⚠️ 没有找到排班记录')
      }

      // 第二步：查询对应的运营数据（营业调整和营业复盘）
      const operationDates = (scheduleData || []).map((record) => record.operation_date)
      let operationsData: any[] = []

      if (operationDates.length > 0) {
        const {data: opsData, error: opsError} = await supabase
          .from('daily_operations')
          .select(
            `
            operation_date,
            midday_estimated_revenue,
            adjusted_staff_count,
            adjusted_rest_count,
            adjusted_part_time_hours,
            actual_revenue,
            actual_staff_count,
            actual_rest_count,
            actual_part_time_hours,
            per_capita_revenue,
            efficiency_rating
          `
          )
          .eq('tenant_id', currentTenant.id)
          .eq('store_id', currentStore.id)
          .in('operation_date', operationDates)

        if (!opsError && opsData) {
          operationsData = opsData
        }
      }

      console.log('=== 加载到的运营数据 ===', operationsData)

      // 第三步：合并数据
      const operationMap = new Map(operationsData.map((op) => [op.operation_date, op]))

      const formattedRecords: ScheduleRecord[] = (scheduleData || []).map((record) => {
        const operation = operationMap.get(record.operation_date)
        return {
          ...record,
          created_by_name: '管理员', // TODO: 从用户表获取
          store_name: currentStore.name,
          // 调整数据
          adjusted_revenue: operation?.midday_estimated_revenue || null,
          adjusted_staff_count: operation?.adjusted_staff_count || null,
          adjusted_rest_count: operation?.adjusted_rest_count || null,
          adjusted_part_time_hours: operation?.adjusted_part_time_hours || null,
          // 实际数据
          actual_revenue: operation?.actual_revenue || null,
          actual_staff_count: operation?.actual_staff_count || null,
          actual_rest_count: operation?.actual_rest_count || null,
          actual_part_time_hours: operation?.actual_part_time_hours || null,
          per_capita_revenue: operation?.per_capita_revenue || null,
          efficiency_rating: operation?.efficiency_rating || null
        }
      })

      setRecords(formattedRecords)
    } catch (error) {
      console.error('加载排班记录异常:', error)
      Taro.showToast({title: '加载异常', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, currentStore?.id, currentStore?.name, viewMode, selectedDate])

  // 🔥 监听门店切换事件
  useEffect(() => {
    const handleStoreChange = (data: any) => {
      console.log('=== 排班日志收到门店切换事件 ===', data)
      // 重新加载数据
      loadRecords()
    }

    Taro.eventCenter.on('storeChanged', handleStoreChange)

    return () => {
      Taro.eventCenter.off('storeChanged', handleStoreChange)
    }
  }, [loadRecords])

  // 🔥 监听门店状态变化，自动加载数据
  useEffect(() => {
    console.log('=== 门店状态变化 ===')
    console.log('当前门店:', currentStore?.name, currentStore?.id)

    if (currentStore?.id) {
      console.log('✅ 门店已选择，自动加载数据')
      loadRecords()
    } else {
      console.log('⚠️ 门店未选择，清空记录')
      setRecords([])
    }
  }, [currentStore?.id, loadRecords, currentStore?.name])

  // 页面显示时加载数据
  useDidShow(() => {
    console.log('=== 排班日志页面显示 ===')
    console.log('当前门店:', currentStore?.name, currentStore?.id)

    // 只有当有门店时才重新加载
    if (currentStore?.id) {
      loadRecords()
    }
  })

  // 切换展开/折叠
  const toggleExpand = (recordId: string) => {
    setExpandedRecordId(expandedRecordId === recordId ? null : recordId)
  }

  // 格式化日期时间
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 获取效能区间颜色
  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'low':
        return 'text-red-600'
      case 'normal':
        return 'text-yellow-600'
      case 'high':
        return 'text-muted-foreground'
      default:
        return 'text-gray-600'
    }
  }

  // 获取效能区间名称
  const getZoneName = (zone: string) => {
    switch (zone) {
      case 'low':
        return '低效区'
      case 'normal':
        return '正常区'
      case 'high':
        return '高效区'
      default:
        return '未知'
    }
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4 max-w-7xl mx-auto">
          {/* 当前门店显示 */}
          {currentStore && (
            <View className="bg-blue-100 rounded-lg p-4 mb-4 shadow-md">
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <View className="i-mdi-store text-2xl text-blue-600" />
                  <View>
                    <Text className="text-xs text-blue-100 block mb-1">当前门店</Text>
                    <Text className="text-base max-sm:text-sm font-bold text-foreground">{currentStore.name}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {!currentStore ? (
            <View className="bg-blue-100 rounded-lg p-8 text-center mb-4">
              <View className="i-mdi-alert-circle-outline text-6xl text-yellow-500 mx-auto mb-4" />
              <Text className="text-base max-sm:text-sm text-gray-700 block mb-2">请先在首页选择门店</Text>
              <Text className="text-sm max-sm:text-xs text-gray-500 block">选择门店后即可查看排班日志</Text>
            </View>
          ) : (
            <>
              {/* 🎯 新增：快捷筛选按钮 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <View className="flex items-center mb-3">
                  <View className="i-mdi-filter text-2xl text-blue-500 mr-2" />
                  <Text className="text-base max-sm:text-sm font-semibold text-gray-800">快捷筛选</Text>
                </View>
                <View className="flex gap-2 @md:grid @md:grid-cols-4">
                  <Button
                    size="default"
                    className={`flex-1 py-2 rounded break-keep text-sm max-sm:text-xs cursor-pointer ${quickFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => handleQuickFilter('today')}>
                    今日
                  </Button>
                  <Button
                    size="default"
                    className={`flex-1 py-2 rounded break-keep text-sm max-sm:text-xs cursor-pointer ${quickFilter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => handleQuickFilter('week')}>
                    本周
                  </Button>
                  <Button
                    size="default"
                    className={`flex-1 py-2 rounded break-keep text-sm max-sm:text-xs cursor-pointer ${quickFilter === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => handleQuickFilter('month')}>
                    本月
                  </Button>
                  <Button
                    size="default"
                    className={`flex-1 py-2 rounded break-keep text-sm max-sm:text-xs cursor-pointer ${quickFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    onClick={() => handleQuickFilter('all')}>
                    全部
                  </Button>
                </View>
              </View>

              {/* 🎯 新增：数据统计面板 */}
              {statistics && (
                <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-chart-box text-2xl text-blue-500 mr-2" />
                    <Text className="text-base max-sm:text-sm font-semibold text-gray-800">数据统计</Text>
                  </View>
                  <View className="grid grid-cols-2 @md:grid-cols-4 gap-3">
                    {/* 总记录数 */}
                    <View className="bg-blue-50 rounded-lg p-3">
                      <Text className="text-xs max-sm:text-[10px] text-gray-600 block mb-1">总记录数</Text>
                      <Text className="text-2xl max-sm:text-xl font-bold text-blue-600 block">
                        {statistics.totalCount}
                      </Text>
                    </View>

                    {/* 平均达成率 */}
                    <View className="bg-green-50 rounded-lg p-3">
                      <Text className="text-xs max-sm:text-[10px] text-gray-600 block mb-1">平均达成率</Text>
                      <Text className="text-2xl max-sm:text-xl font-bold text-green-600 block">
                        {(statistics.avgAchievementRate * 100).toFixed(1)}%
                      </Text>
                    </View>

                    {/* 平均成本率 */}
                    <View className="bg-orange-50 rounded-lg p-3">
                      <Text className="text-xs max-sm:text-[10px] text-gray-600 block mb-1">平均成本率</Text>
                      <Text className="text-2xl max-sm:text-xl font-bold text-orange-600 block">
                        {(statistics.avgCostRate * 100).toFixed(1)}%
                      </Text>
                    </View>

                    {/* 优秀记录 */}
                    <View className="bg-purple-50 rounded-lg p-3">
                      <Text className="text-xs max-sm:text-[10px] text-gray-600 block mb-1">优秀记录</Text>
                      <Text className="text-2xl max-sm:text-xl font-bold text-purple-600 block">
                        {statistics.excellentCount}
                        <Text className="text-sm max-sm:text-xs text-gray-500 ml-1">
                          ({(statistics.excellentRate * 100).toFixed(0)}%)
                        </Text>
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 查看模式切换 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <View className="flex items-center mb-3">
                  <View className="i-mdi-calendar-clock text-2xl text-blue-500 mr-2" />
                  <Text className="text-base max-sm:text-sm font-semibold text-gray-800">查看模式</Text>
                </View>
                <View className="flex gap-2">
                  <Button
                    size="default"
                    className={`flex-1 py-2 rounded break-keep text-sm max-sm:text-xs cursor-pointer ${viewMode === 'today' ? 'bg-blue-100 text-white' : 'bg-gray-50 text-gray-700'}`}
                    onClick={() => {
                      setViewMode('today')
                      loadRecords()
                    }}>
                    当日记录
                  </Button>
                  <Button
                    size="default"
                    className={`flex-1 py-2 rounded break-keep text-sm max-sm:text-xs cursor-pointer ${viewMode === 'all' ? 'bg-blue-100 text-white' : 'bg-gray-50 text-gray-700'}`}
                    onClick={() => {
                      setViewMode('all')
                      loadRecords()
                    }}>
                    累计记录
                  </Button>
                </View>
              </View>

              {/* 日期选择（仅当日模式显示） */}
              {viewMode === 'today' && (
                <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <Text className="text-sm max-sm:text-xs text-gray-600 mb-2">选择日期</Text>
                  <Picker
                    mode="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.detail.value)
                      loadRecords()
                    }}>
                    <View className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                      <Text className="text-gray-700 text-sm max-sm:text-xs">{selectedDate}</Text>
                      <View className="i-mdi-calendar text-xl text-gray-400" />
                    </View>
                  </Picker>
                </View>
              )}

              {/* 排班记录列表 */}
              {loading ? (
                // 🎯 新增：骨架屏加载状态
                <View>
                  {[1, 2, 3].map((i) => (
                    <View key={i} className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-3 animate-pulse">
                      <View className="flex items-center justify-between mb-3">
                        <View className="h-4 bg-gray-200 rounded w-1/3" />
                        <View className="h-6 bg-gray-200 rounded w-16" />
                      </View>
                      <View className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                      <View className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                      <View className="h-3 bg-gray-200 rounded w-3/4" />
                    </View>
                  ))}
                </View>
              ) : records.length === 0 ? (
                <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
                  <View className="i-mdi-file-document-outline text-6xl text-gray-300 mx-auto mb-4" />
                  <Text className="text-base max-sm:text-sm text-gray-500 block mb-2">暂无排班记录</Text>
                  <Text className="text-sm max-sm:text-xs text-gray-400 block">
                    {viewMode === 'today' ? '当日还没有排班记录' : '还没有任何排班记录'}
                  </Text>
                </View>
              ) : (
                <View className="space-y-3">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm max-sm:text-xs text-gray-600">
                      共 <Text className="text-muted-foreground font-semibold">{records.length}</Text> 条记录
                    </Text>
                  </View>

                  {records.map((record) => {
                    const isExpanded = expandedRecordId === record.id
                    return (
                      <View key={record.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {/* 记录头部 */}
                        <View className="p-4 cursor-pointer" onClick={() => toggleExpand(record.id)}>
                          <View className="flex items-center justify-between mb-2">
                            <View className="flex items-center gap-2">
                              <View className="i-mdi-calendar-check text-xl text-blue-500" />
                              <Text className="text-base max-sm:text-sm font-semibold text-gray-800">
                                {record.operation_date}
                              </Text>
                            </View>
                            <View className={`i-mdi-chevron-${isExpanded ? 'up' : 'down'} text-2xl text-gray-400`} />
                          </View>

                          <View className="flex items-center gap-4 text-xs max-sm:text-[10px] text-gray-500">
                            <View className="flex items-center gap-1">
                              <View className="i-mdi-clock-outline text-sm" />
                              <Text>{formatDateTime(record.created_at)}</Text>
                            </View>
                            <View className="flex items-center gap-1">
                              <View className="i-mdi-account text-sm" />
                              <Text>{record.created_by_name}</Text>
                            </View>
                          </View>

                          {/* 简要信息 */}
                          <View className="flex items-center gap-4 @md:gap-6 mt-3">
                            <View className="flex-1 bg-blue-100 rounded-lg p-2">
                              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">
                                上岗人数
                              </Text>
                              <Text className="text-base max-sm:text-sm font-bold text-blue-600">
                                {record.planned_staff_count} 人
                              </Text>
                            </View>
                            <View className="flex-1 bg-blue-100 rounded-lg p-2">
                              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">
                                排休人数
                              </Text>
                              <Text className="text-base max-sm:text-sm font-bold text-orange-600">
                                {record.rest_staff_count} 人{record.rest_days > 0 && ` / ${record.rest_days}天`}
                              </Text>
                            </View>
                            <View className="flex-1 bg-blue-100 rounded-lg p-2">
                              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">
                                成本合格
                              </Text>
                              <Text className="text-base max-sm:text-sm font-bold text-green-600">
                                {record.is_cost_qualified ? '是' : '否'}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* 展开的详细信息 */}
                        {isExpanded && (
                          <View className="border-t border-border p-4 bg-gray-50">
                            <Text className="text-sm max-sm:text-xs font-semibold text-gray-700 mb-3">
                              排班全流程追踪
                            </Text>

                            {/* 【计划】排班规划数据 */}
                            <View className="bg-blue-100 rounded-lg p-3 mb-3 border-l-4 border-border">
                              <View className="flex items-center gap-2 mb-2">
                                <View className="i-mdi-clipboard-text text-lg text-muted-foreground" />
                                <Text className="text-sm max-sm:text-xs font-semibold text-blue-600">
                                  【计划】排班规划
                                </Text>
                              </View>
                              <View className="space-y-1">
                                <View className="flex items-center justify-between">
                                  <Text className="text-xs max-sm:text-[10px] text-blue-600">预估营收</Text>
                                  <Text className="text-sm max-sm:text-xs font-semibold text-foreground">
                                    ¥{record.estimated_revenue.toFixed(2)}
                                  </Text>
                                </View>
                                <View className="flex items-center justify-between">
                                  <Text className="text-xs max-sm:text-[10px] text-blue-600">计划上岗</Text>
                                  <Text className="text-sm max-sm:text-xs font-semibold text-foreground">
                                    {record.planned_staff_count} 人
                                  </Text>
                                </View>
                                <View className="flex items-center justify-between">
                                  <Text className="text-xs max-sm:text-[10px] text-blue-600">计划排休</Text>
                                  <Text className="text-sm max-sm:text-xs font-semibold text-foreground">
                                    {record.rest_staff_count} 人{record.rest_days > 0 && ` / ${record.rest_days}天`}
                                  </Text>
                                </View>
                                {record.part_time_hours > 0 && (
                                  <View className="flex items-center justify-between">
                                    <Text className="text-xs text-blue-600">兼职工时</Text>
                                    <Text className="text-sm font-semibold text-foreground">
                                      {record.part_time_hours.toFixed(1)} 小时
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            {/* 【调整】营业调整数据 */}
                            {(record.adjusted_revenue ||
                              record.adjusted_staff_count ||
                              record.adjusted_rest_count ||
                              record.adjusted_part_time_hours) && (
                              <View className="bg-blue-100 rounded-lg p-3 mb-3 border-l-4 border-border">
                                <View className="flex items-center gap-2 mb-2">
                                  <View className="i-mdi-pencil text-lg text-muted-foreground" />
                                  <Text className="text-sm font-semibold text-orange-600">【调整】营业调整</Text>
                                </View>
                                <View className="space-y-1">
                                  {record.adjusted_revenue && (
                                    <View className="flex items-center justify-between">
                                      <Text className="text-xs text-orange-600">调整营收</Text>
                                      <Text className="text-sm font-semibold text-orange-600">
                                        ¥{record.adjusted_revenue.toFixed(2)}
                                        {record.estimated_revenue && (
                                          <Text
                                            className={`text-xs ml-1 ${record.adjusted_revenue > record.estimated_revenue ? 'text-muted-foreground' : 'text-red-600'}`}>
                                            ({record.adjusted_revenue > record.estimated_revenue ? '+' : ''}
                                            {(record.adjusted_revenue - record.estimated_revenue).toFixed(2)})
                                          </Text>
                                        )}
                                      </Text>
                                    </View>
                                  )}
                                  {record.adjusted_staff_count !== null &&
                                    record.adjusted_staff_count !== undefined && (
                                      <View className="flex items-center justify-between">
                                        <Text className="text-xs text-orange-600">调整上岗</Text>
                                        <Text className="text-sm font-semibold text-orange-600">
                                          {record.adjusted_staff_count} 人
                                          {record.planned_staff_count && (
                                            <Text
                                              className={`text-xs ml-1 ${record.adjusted_staff_count > record.planned_staff_count ? 'text-red-600' : 'text-muted-foreground'}`}>
                                              ({record.adjusted_staff_count > record.planned_staff_count ? '+' : ''}
                                              {record.adjusted_staff_count - record.planned_staff_count})
                                            </Text>
                                          )}
                                        </Text>
                                      </View>
                                    )}
                                  {record.adjusted_rest_count !== null && record.adjusted_rest_count !== undefined && (
                                    <View className="flex items-center justify-between">
                                      <Text className="text-xs text-orange-600">调整排休</Text>
                                      <Text className="text-sm font-semibold text-orange-600">
                                        {record.adjusted_rest_count.toFixed(2)} 人
                                        {record.rest_staff_count && (
                                          <Text
                                            className={`text-xs ml-1 ${record.adjusted_rest_count > record.rest_staff_count ? 'text-muted-foreground' : 'text-red-600'}`}>
                                            ({record.adjusted_rest_count > record.rest_staff_count ? '+' : ''}
                                            {(record.adjusted_rest_count - record.rest_staff_count).toFixed(2)})
                                          </Text>
                                        )}
                                      </Text>
                                    </View>
                                  )}
                                  {record.adjusted_part_time_hours !== null &&
                                    record.adjusted_part_time_hours !== undefined && (
                                      <View className="flex items-center justify-between">
                                        <Text className="text-xs text-orange-600">调整兼职</Text>
                                        <Text className="text-sm font-semibold text-orange-600">
                                          {record.adjusted_part_time_hours.toFixed(1)} 小时
                                          {record.part_time_hours && (
                                            <Text
                                              className={`text-xs ml-1 ${record.adjusted_part_time_hours > record.part_time_hours ? 'text-red-600' : 'text-muted-foreground'}`}>
                                              ({record.adjusted_part_time_hours > record.part_time_hours ? '+' : ''}
                                              {(record.adjusted_part_time_hours - record.part_time_hours).toFixed(1)})
                                            </Text>
                                          )}
                                        </Text>
                                      </View>
                                    )}
                                </View>
                              </View>
                            )}

                            {/* 【实际】营业复盘数据 */}
                            {(record.actual_revenue ||
                              record.actual_staff_count ||
                              record.actual_rest_count ||
                              record.actual_part_time_hours) && (
                              <View className="bg-blue-100 rounded-lg p-3 mb-3 border-l-4 border-border">
                                <View className="flex items-center gap-2 mb-2">
                                  <View className="i-mdi-check-circle text-lg text-muted-foreground" />
                                  <Text className="text-sm font-semibold text-green-600">【实际】营业复盘</Text>
                                </View>
                                <View className="space-y-1">
                                  {record.actual_revenue && (
                                    <View className="flex items-center justify-between">
                                      <Text className="text-xs text-green-600">实际营收</Text>
                                      <Text className="text-sm font-semibold text-green-600">
                                        ¥{record.actual_revenue.toFixed(2)}
                                        {record.estimated_revenue && (
                                          <Text
                                            className={`text-xs ml-1 ${record.actual_revenue > record.estimated_revenue ? 'text-muted-foreground' : 'text-red-600'}`}>
                                            ({record.actual_revenue > record.estimated_revenue ? '+' : ''}
                                            {(record.actual_revenue - record.estimated_revenue).toFixed(2)})
                                          </Text>
                                        )}
                                      </Text>
                                    </View>
                                  )}
                                  {record.actual_staff_count !== null && record.actual_staff_count !== undefined && (
                                    <View className="flex items-center justify-between">
                                      <Text className="text-xs text-green-600">实际上岗</Text>
                                      <Text className="text-sm font-semibold text-green-600">
                                        {record.actual_staff_count} 人
                                        {record.planned_staff_count && (
                                          <Text
                                            className={`text-xs ml-1 ${record.actual_staff_count > record.planned_staff_count ? 'text-red-600' : 'text-muted-foreground'}`}>
                                            ({record.actual_staff_count > record.planned_staff_count ? '+' : ''}
                                            {record.actual_staff_count - record.planned_staff_count})
                                          </Text>
                                        )}
                                      </Text>
                                    </View>
                                  )}
                                  {record.actual_rest_count !== null && record.actual_rest_count !== undefined && (
                                    <View className="flex items-center justify-between">
                                      <Text className="text-xs text-green-600">实际排休</Text>
                                      <Text className="text-sm font-semibold text-green-600">
                                        {record.actual_rest_count.toFixed(2)} 人
                                        {record.rest_staff_count && (
                                          <Text
                                            className={`text-xs ml-1 ${record.actual_rest_count > record.rest_staff_count ? 'text-muted-foreground' : 'text-red-600'}`}>
                                            ({record.actual_rest_count > record.rest_staff_count ? '+' : ''}
                                            {(record.actual_rest_count - record.rest_staff_count).toFixed(2)})
                                          </Text>
                                        )}
                                      </Text>
                                    </View>
                                  )}
                                  {record.actual_part_time_hours !== null &&
                                    record.actual_part_time_hours !== undefined && (
                                      <View className="flex items-center justify-between">
                                        <Text className="text-xs text-green-600">实际兼职</Text>
                                        <Text className="text-sm font-semibold text-green-600">
                                          {record.actual_part_time_hours.toFixed(1)} 小时
                                          {record.part_time_hours && (
                                            <Text
                                              className={`text-xs ml-1 ${record.actual_part_time_hours > record.part_time_hours ? 'text-red-600' : 'text-muted-foreground'}`}>
                                              ({record.actual_part_time_hours > record.part_time_hours ? '+' : ''}
                                              {(record.actual_part_time_hours - record.part_time_hours).toFixed(1)})
                                            </Text>
                                          )}
                                        </Text>
                                      </View>
                                    )}
                                  {record.per_capita_revenue && (
                                    <View className="flex items-center justify-between">
                                      <Text className="text-xs text-green-600">人均营收</Text>
                                      <Text className="text-sm font-semibold text-green-600">
                                        ¥{record.per_capita_revenue.toFixed(2)}
                                      </Text>
                                    </View>
                                  )}
                                  {record.efficiency_rating && (
                                    <View className="flex items-center justify-between">
                                      <Text className="text-xs text-green-600">效能评级</Text>
                                      <Text className="text-sm font-semibold text-green-600">
                                        {record.efficiency_rating}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            )}

                            {/* 【达成情况】差额和达成率 */}
                            {record.actual_revenue && record.estimated_revenue && (
                              <View className="bg-blue-100 rounded-lg p-3 mb-3 border-l-4 border-border">
                                <View className="flex items-center gap-2 mb-2">
                                  <View className="i-mdi-chart-line text-lg text-muted-foreground" />
                                  <Text className="text-sm font-semibold text-purple-800">【达成情况】</Text>
                                </View>
                                <View className="space-y-1">
                                  {/* 营收达成率 */}
                                  <View className="flex items-center justify-between">
                                    <Text className="text-xs text-purple-700">营收达成率</Text>
                                    <Text
                                      className={`text-sm font-semibold ${(record.actual_revenue / record.estimated_revenue) * 100 >= 100 ? 'text-muted-foreground' : 'text-red-600'}`}>
                                      {((record.actual_revenue / record.estimated_revenue) * 100).toFixed(2)}%
                                      <Text className="text-xs ml-1">
                                        ({record.actual_revenue > record.estimated_revenue ? '+' : ''}
                                        {(record.actual_revenue - record.estimated_revenue).toFixed(2)})
                                      </Text>
                                    </Text>
                                  </View>

                                  {/* 人效达成率 */}
                                  {record.actual_staff_count &&
                                    record.actual_staff_count > 0 &&
                                    record.planned_staff_count &&
                                    record.planned_staff_count > 0 && (
                                      <View className="flex items-center justify-between">
                                        <Text className="text-xs text-purple-700">人效达成率</Text>
                                        <Text
                                          className={`text-sm font-semibold ${(() => {
                                            const plannedEfficiency =
                                              record.estimated_revenue / record.planned_staff_count
                                            const actualEfficiency = record.actual_revenue / record.actual_staff_count
                                            const achievement = (actualEfficiency / plannedEfficiency) * 100
                                            return achievement >= 100 ? 'text-muted-foreground' : 'text-red-600'
                                          })()}`}>
                                          {(() => {
                                            const plannedEfficiency =
                                              record.estimated_revenue / record.planned_staff_count
                                            const actualEfficiency = record.actual_revenue / record.actual_staff_count
                                            const achievement = (actualEfficiency / plannedEfficiency) * 100
                                            return achievement.toFixed(2)
                                          })()}%
                                          <Text className="text-xs ml-1">
                                            (计划: ¥{(record.estimated_revenue / record.planned_staff_count).toFixed(2)}
                                            , 实际: ¥{(record.actual_revenue / record.actual_staff_count).toFixed(2)})
                                          </Text>
                                        </Text>
                                      </View>
                                    )}

                                  {/* 实际人力成本率 */}
                                  {record.actual_revenue &&
                                    record.actual_revenue > 0 &&
                                    record.total_labor_cost &&
                                    record.total_labor_cost > 0 && (
                                      <View className="flex items-center justify-between">
                                        <Text className="text-xs text-purple-700">实际人力成本率</Text>
                                        <Text
                                          className={`text-sm font-semibold ${(() => {
                                            const actualCostRate =
                                              (record.total_labor_cost / record.actual_revenue) * 100
                                            return actualCostRate <= 20
                                              ? 'text-muted-foreground'
                                              : actualCostRate <= 25
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                          })()}`}>
                                          {((record.total_labor_cost / record.actual_revenue) * 100).toFixed(2)}%
                                          <Text className="text-xs ml-1">
                                            ({(() => {
                                              const actualCostRate =
                                                (record.total_labor_cost / record.actual_revenue) * 100
                                              return actualCostRate <= 20
                                                ? '优秀'
                                                : actualCostRate <= 25
                                                  ? '合格'
                                                  : '需优化'
                                            })()})
                                          </Text>
                                        </Text>
                                      </View>
                                    )}

                                  {/* 排休达成率 */}
                                  {record.actual_rest_count !== null &&
                                    record.actual_rest_count !== undefined &&
                                    record.rest_staff_count > 0 && (
                                      <View className="flex items-center justify-between">
                                        <Text className="text-xs text-purple-700">排休达成率</Text>
                                        <Text
                                          className={`text-sm font-semibold ${(record.actual_rest_count / record.rest_staff_count) * 100 >= 100 ? 'text-muted-foreground' : 'text-red-600'}`}>
                                          {((record.actual_rest_count / record.rest_staff_count) * 100).toFixed(2)}%
                                          <Text className="text-xs ml-1">
                                            ({record.actual_rest_count > record.rest_staff_count ? '+' : ''}
                                            {(record.actual_rest_count - record.rest_staff_count).toFixed(2)}人)
                                          </Text>
                                        </Text>
                                      </View>
                                    )}
                                </View>
                              </View>
                            )}

                            {/* 成本与效率（原有数据） */}
                            <View className="bg-white rounded-lg p-3 border-2 border-gray-200 mb-3">
                              <Text className="text-xs text-gray-500 mb-2">成本与效率</Text>
                              <View className="space-y-2">
                                <View className="flex items-center justify-between">
                                  <Text className="text-xs text-gray-600">总人力成本</Text>
                                  <Text className="text-sm font-semibold text-gray-800">
                                    ¥{record.total_labor_cost.toFixed(2)}
                                  </Text>
                                </View>
                                <View className="flex items-center justify-between">
                                  <Text className="text-xs text-gray-600">人力成本率</Text>
                                  <Text
                                    className={`text-sm font-semibold ${record.is_cost_qualified ? 'text-muted-foreground' : 'text-red-600'}`}>
                                    {record.labor_cost_rate.toFixed(2)}%
                                  </Text>
                                </View>
                                <View className="flex items-center justify-between">
                                  <Text className="text-xs text-gray-600">达成率</Text>
                                  <Text className="text-sm font-semibold text-gray-800">
                                    {record.achievement_rate.toFixed(2)}%
                                  </Text>
                                </View>
                                <View className="flex items-center justify-between">
                                  <Text className="text-xs text-gray-600">效能区间</Text>
                                  <Text className={`text-sm font-semibold ${getZoneColor(record.efficiency_zone)}`}>
                                    {getZoneName(record.efficiency_zone)}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* 成本合格状态 */}
                            <View
                              className={`rounded-lg p-3 ${(() => {
                                const costRate = record.labor_cost_rate
                                return costRate <= 20 ? 'bg-blue-100' : costRate <= 25 ? 'bg-blue-100' : 'bg-blue-100'
                              })()}`}>
                              <View className="flex items-center gap-2">
                                <View
                                  className={`${(() => {
                                    const costRate = record.labor_cost_rate
                                    return costRate <= 25 ? 'i-mdi-check-circle' : 'i-mdi-alert-circle'
                                  })()} text-xl ${(() => {
                                    const costRate = record.labor_cost_rate
                                    return costRate <= 20
                                      ? 'text-muted-foreground'
                                      : costRate <= 25
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                  })()}`}
                                />
                                <Text
                                  className={`text-sm font-semibold ${(() => {
                                    const costRate = record.labor_cost_rate
                                    return costRate <= 20
                                      ? 'text-green-600'
                                      : costRate <= 25
                                        ? 'text-yellow-700'
                                        : 'text-red-600'
                                  })()}`}>
                                  {(() => {
                                    const costRate = record.labor_cost_rate
                                    return costRate <= 20
                                      ? '成本控制优秀'
                                      : costRate <= 25
                                        ? '成本控制合格'
                                        : '成本控制需优化'
                                  })()}
                                </Text>
                              </View>
                              <Text
                                className={`text-xs mt-1 ${(() => {
                                  const costRate = record.labor_cost_rate
                                  return costRate <= 20
                                    ? 'text-muted-foreground'
                                    : costRate <= 25
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                                })()}`}>
                                {(() => {
                                  const costRate = record.labor_cost_rate
                                  return costRate <= 20
                                    ? '人力成本率优秀（≤20%）'
                                    : costRate <= 25
                                      ? '人力成本率合格（≤25%）'
                                      : '人力成本率超出合理范围（>25%），需要优化'
                                })()}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default ScheduleLogs
