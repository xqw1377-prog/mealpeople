import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {navigateTo, showModal, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {EmptyState} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {deleteSchedule, getSchedulesByTenantId, getStoresByTenantId} from '@/db/api'
import type {Schedule, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const Schedules: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore) // 🔥 获取全局门店
  const setCurrentStore = useTenantStore((state) => state.setCurrentStore) // 🔥 获取设置门店方法
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [_filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 筛选条件
  const [selectedShiftType, setSelectedShiftType] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all')
  const [shiftTypeIndex, setShiftTypeIndex] = useState(0)
  const [dateRangeIndex, setDateRangeIndex] = useState(0)

  console.log('=== 排班管理页面渲染 ===', {
    租户: currentTenant?.name,
    门店: currentStore?.name
  })

  const loadData = useCallback(async () => {
    if (!currentTenant) {
      navigateTo({url: '/pages/tenant-select/index'})
      return
    }

    setLoading(true)
    try {
      const [schedulesData, storesData] = await Promise.all([
        getSchedulesByTenantId(currentTenant.id),
        getStoresByTenantId(currentTenant.id)
      ])
      setSchedules(schedulesData)
      setStores(storesData)
      setFilteredSchedules(schedulesData)

      // 🔥 同步全局门店状态
      if (currentStore && storesData.length > 0) {
        const index = storesData.findIndex((s) => s.id === currentStore.id)
        if (index >= 0) {
          console.log('=== 使用全局门店 ===', currentStore.name)
          setSelectedStoreIndex(index + 1) // +1 因为有"全部门店"选项
        } else {
          console.log('=== 全局门店不在列表中 ===')
          setSelectedStoreIndex(0)
        }
      } else {
        setSelectedStoreIndex(0)
      }
    } catch (error) {
      console.error('加载排班列表失败:', error)
      showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentTenant, currentStore])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 🔥 监听门店切换事件
  useEffect(() => {
    const handleStoreChange = (data: any) => {
      console.log('=== 排班管理收到门店切换事件 ===', data)
      // 重新加载数据
      loadData()
    }

    Taro.eventCenter.on('storeChanged', handleStoreChange)

    return () => {
      Taro.eventCenter.off('storeChanged', handleStoreChange)
    }
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
  }, [loadData])

  // 应用筛选
  useEffect(() => {
    let filtered = [...schedules]

    // 按店铺筛选
    if (selectedStoreIndex > 0) {
      const selectedStoreId = stores[selectedStoreIndex - 1]?.id
      filtered = filtered.filter((schedule) => schedule.store_id === selectedStoreId)
    }

    // 按班次类型筛选
    if (selectedShiftType !== 'all') {
      filtered = filtered.filter((schedule) => schedule.shift_type === selectedShiftType)
    }

    // 按日期范围筛选
    if (selectedDateRange !== 'all') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]

      if (selectedDateRange === 'today') {
        filtered = filtered.filter((schedule) => schedule.schedule_date === todayStr)
      } else if (selectedDateRange === 'week') {
        const weekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
        const weekLaterStr = weekLater.toISOString().split('T')[0]
        filtered = filtered.filter(
          (schedule) => schedule.schedule_date >= todayStr && schedule.schedule_date <= weekLaterStr
        )
      } else if (selectedDateRange === 'month') {
        const monthLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
        const monthLaterStr = monthLater.toISOString().split('T')[0]
        filtered = filtered.filter(
          (schedule) => schedule.schedule_date >= todayStr && schedule.schedule_date <= monthLaterStr
        )
      }
    }

    setFilteredSchedules(filtered)
  }, [schedules, selectedStoreIndex, stores, selectedShiftType, selectedDateRange])

  const handleShiftTypeChange = useCallback((e: any) => {
    const index = Number(e.detail.value)
    setShiftTypeIndex(index)
    const shiftTypes = ['all', 'morning', 'afternoon', 'evening', 'night']
    setSelectedShiftType(shiftTypes[index])
  }, [])

  const handleDateRangeChange = useCallback((e: any) => {
    const index = Number(e.detail.value)
    setDateRangeIndex(index)
    const dateRanges = ['all', 'today', 'week', 'month']
    setSelectedDateRange(dateRanges[index])
  }, [])

  // 🔥 处理门店选择变化
  const handleStorePickerChange = useCallback(
    (e: any) => {
      const index = Number(e.detail.value)
      setSelectedStoreIndex(index)

      // 如果选择了具体门店（不是"全部门店"），更新全局状态
      if (index > 0 && stores[index - 1]) {
        const selectedStore = stores[index - 1]
        console.log('=== 排班管理选择门店 ===', selectedStore.name)
        setCurrentStore(selectedStore)
      }
    },
    [stores, setCurrentStore]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await showModal({
        title: '确认删除',
        content: '确定要删除这条排班记录吗？',
        confirmText: '删除',
        cancelText: '取消'
      })

      if (result.confirm) {
        const success = await deleteSchedule(id)
        if (success) {
          showToast({title: '删除成功', icon: 'success'})
          loadData()
        } else {
          showToast({title: '删除失败', icon: 'none'})
        }
      }
    },
    [loadData]
  )

  if (!currentTenant) {
    return null
  }

  // 根据选择的店铺过滤排班
  const filteredSchedules =
    selectedStoreIndex === 0 ? schedules : schedules.filter((s) => s.store_id === stores[selectedStoreIndex - 1]?.id)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-muted-foreground bg-blue-100'
      case 'confirmed':
        return 'text-white bg-blue-100'
      case 'pending':
        return 'text-yellow-600 bg-blue-100'
      case 'cancelled':
        return 'text-red-600 bg-blue-100'
      default:
        return 'text-muted-foreground bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'confirmed':
        return '已确认'
      case 'pending':
        return '待确认'
      case 'cancelled':
        return '已取消'
      default:
        return '未知'
    }
  }

  const getShiftTypeText = (shiftType: string | null) => {
    switch (shiftType) {
      case 'morning':
        return '早班'
      case 'afternoon':
        return '中班'
      case 'evening':
        return '晚班'
      case 'full_day':
        return '全天'
      default:
        return '未设置'
    }
  }

  const storeOptions = ['全部店铺', ...stores.map((s) => s.name)]

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen bg-transparent"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4">
          {/* 顶部筛选和操作栏 */}
          <View className="mb-4">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground block">排班管理</Text>
              <Button
                className="bg-blue-100 text-white rounded-xl text-xs break-keep"
                size="mini"
                onClick={() => navigateTo({url: '/packageB/pages/schedule-form/index'})}>
                创建排班
              </Button>
            </View>

            {/* 店铺筛选 */}
            {stores.length > 0 && (
              <View className="space-y-2">
                <Picker
                  mode="selector"
                  range={storeOptions}
                  value={selectedStoreIndex}
                  onChange={handleStorePickerChange}>
                  <View className="bg-white rounded-xl px-4 py-2 flex items-center justify-between shadow-sm">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-store text-base text-purple-500"></View>
                      <Text className="text-sm text-foreground">{storeOptions[selectedStoreIndex]}</Text>
                    </View>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>

                {/* 班次类型筛选 */}
                <Picker
                  mode="selector"
                  range={['全部班次', '早班', '午班', '晚班', '夜班']}
                  value={shiftTypeIndex}
                  onChange={handleShiftTypeChange}>
                  <View className="bg-white rounded-xl px-4 py-2 flex items-center justify-between shadow-sm">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-clock-outline text-base text-blue-500"></View>
                      <Text className="text-sm text-foreground">
                        {['全部班次', '早班', '午班', '晚班', '夜班'][shiftTypeIndex]}
                      </Text>
                    </View>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>

                {/* 日期范围筛选 */}
                <Picker
                  mode="selector"
                  range={['全部日期', '今天', '本周', '本月']}
                  value={dateRangeIndex}
                  onChange={handleDateRangeChange}>
                  <View className="bg-white rounded-xl px-4 py-2 flex items-center justify-between shadow-sm">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-calendar-range text-base text-green-500"></View>
                      <Text className="text-sm text-foreground">
                        {['全部日期', '今天', '本周', '本月'][dateRangeIndex]}
                      </Text>
                    </View>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>
            )}
          </View>

          {/* 统计卡片 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-around">
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground block">{filteredSchedules.length}</Text>
                <Text className="text-xs text-muted-foreground block mt-1">总排班</Text>
              </View>
              <View className="w-px h-8 bg-gray-200"></View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground block">
                  {filteredSchedules.filter((s) => s.status === 'completed').length}
                </Text>
                <Text className="text-xs text-muted-foreground block mt-1">已完成</Text>
              </View>
              <View className="w-px h-8 bg-gray-200"></View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-yellow-600 block">
                  {filteredSchedules.filter((s) => s.status === 'pending').length}
                </Text>
                <Text className="text-xs text-muted-foreground block mt-1">待确认</Text>
              </View>
            </View>
          </View>

          {/* 排班列表 */}
          {loading ? (
            <SkeletonList count={5} />
          ) : filteredSchedules.length === 0 ? (
            <EmptyState
              icon="i-mdi-calendar-clock"
              title="暂无排班"
              description={schedules.length === 0 ? '点击右上角创建排班' : '没有符合筛选条件的排班'}
              actionText={schedules.length === 0 ? '创建排班' : undefined}
              onAction={
                schedules.length === 0 ? () => navigateTo({url: '/packageB/pages/schedule-form/index'}) : undefined
              }
            />
          ) : (
            <View className="space-y-3">
              {filteredSchedules.map((schedule) => (
                <View key={schedule.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground block mb-1">{schedule.schedule_date}</Text>
                      <View className="flex items-center gap-2 mt-1">
                        <View className="i-mdi-clock-outline text-sm text-muted-foreground"></View>
                        <Text className="text-xs text-muted-foreground">
                          {getShiftTypeText(schedule.shift_type)}
                          {schedule.start_time && schedule.end_time && (
                            <Text>
                              {' '}
                              · {schedule.start_time} - {schedule.end_time}
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(schedule.status)}`}>
                      <Text className="text-xs font-medium">{getStatusText(schedule.status)}</Text>
                    </View>
                  </View>

                  {schedule.notes && (
                    <View className="pt-3 border-t border-gray-100 mb-3">
                      <Text className="text-xs text-muted-foreground">{schedule.notes}</Text>
                    </View>
                  )}

                  {/* 操作按钮 */}
                  <View className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <View
                      className="flex-1 bg-blue-100 text-white rounded-xl py-2 flex items-center justify-center gap-1"
                      onClick={() => navigateTo({url: `/packageC/pages/schedule-form/index?id=${schedule.id}`})}>
                      <View className="i-mdi-pencil text-base"></View>
                      <Text className="text-sm font-medium text-muted-foreground">编辑</Text>
                    </View>
                    <View
                      className="flex-1 bg-blue-100 text-red-600 rounded-xl py-2 flex items-center justify-center gap-1"
                      onClick={() => handleDelete(schedule.id)}>
                      <View className="i-mdi-delete text-base"></View>
                      <Text className="text-sm font-medium text-red-600">删除</Text>
                    </View>
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

export default Schedules
