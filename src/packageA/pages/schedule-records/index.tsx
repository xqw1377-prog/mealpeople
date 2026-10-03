// 排班记录管理页面
import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {EmptyState} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {
  cancelWorkScheduleRecord,
  completeWorkScheduleRecord,
  deleteWorkScheduleRecord,
  getAllWorkScheduleRecords,
  getWorkScheduleRecordsByDateRange
} from '@/db/api-schedule-record'
import type {WorkScheduleRecord} from '@/db/types-schedule'

const ScheduleRecords: React.FC = () => {
  const [records, setRecords] = useState<WorkScheduleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all')
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week')

  // 加载排班记录
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true)

      let recordsData: WorkScheduleRecord[] = []

      // 计算日期范围
      if (dateRange === 'all') {
        recordsData = await getAllWorkScheduleRecords()
      } else {
        const endDate = new Date()
        const startDate = new Date()

        if (dateRange === 'today') {
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
        } else if (dateRange === 'week') {
          startDate.setDate(endDate.getDate() - 7)
        } else {
          startDate.setMonth(endDate.getMonth() - 1)
        }

        recordsData = await getWorkScheduleRecordsByDateRange(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        )
      }

      // 按状态筛选
      if (filterType !== 'all') {
        recordsData = recordsData.filter((record) => record.status === filterType)
      }

      // 按日期排序（最新的在前）
      recordsData.sort((a, b) => {
        const dateA = new Date(a.schedule_date).getTime()
        const dateB = new Date(b.schedule_date).getTime()
        return dateB - dateA
      })

      setRecords(recordsData)
    } catch (error) {
      console.error('加载排班记录失败:', error)
      Taro.showToast({title: '加载失败', icon: 'error'})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filterType, dateRange])

  // 页面显示时加载数据
  useDidShow(() => {
    loadRecords()
  })

  // 下拉刷新
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRecords()
  }

  // 完成排班
  const handleComplete = async (id: string) => {
    const result = await Taro.showModal({
      title: '确认完成',
      content: '确认标记这条排班记录为已完成吗？'
    })

    if (result.confirm) {
      const success = await completeWorkScheduleRecord(id)
      if (success) {
        Taro.showToast({title: '操作成功', icon: 'success'})
        loadRecords()
      } else {
        Taro.showToast({title: '操作失败', icon: 'error'})
      }
    }
  }

  // 取消排班
  const handleCancel = async (id: string) => {
    const result = await Taro.showModal({
      title: '确认取消',
      content: '确认取消这条排班记录吗？'
    })

    if (result.confirm) {
      const success = await cancelWorkScheduleRecord(id)
      if (success) {
        Taro.showToast({title: '操作成功', icon: 'success'})
        loadRecords()
      } else {
        Taro.showToast({title: '操作失败', icon: 'error'})
      }
    }
  }

  // 删除排班
  const handleDelete = async (id: string) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条排班记录吗？'
    })

    if (result.confirm) {
      const success = await deleteWorkScheduleRecord(id)
      if (success) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        loadRecords()
      } else {
        Taro.showToast({title: '删除失败', icon: 'error'})
      }
    }
  }

  // 查看详情
  const handleViewDetail = (id: string) => {
    Taro.navigateTo({url: `/packageA/pages/schedule-record-detail/index?id=${id}`})
  }

  // 获取状态信息
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {text: '待执行', color: 'text-orange-500', bg: 'bg-orange-100'}
      case 'completed':
        return {text: '已完成', color: 'text-muted-foreground', bg: 'bg-green-100'}
      case 'cancelled':
        return {text: '已取消', color: 'text-gray-500', bg: 'bg-gray-50'}
      default:
        return {text: '未知', color: 'text-gray-500', bg: 'bg-gray-50'}
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50">
        <SkeletonList count={5} />
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4 space-y-4">
          {/* 筛选器 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-sm font-medium text-foreground">筛选条件</Text>
            </View>

            {/* 状态筛选 */}
            <View className="mb-3">
              <Text className="text-xs text-muted-foreground mb-2">状态</Text>
              <View className="flex gap-2">
                {[
                  {value: 'all', label: '全部'},
                  {value: 'pending', label: '待执行'},
                  {value: 'completed', label: '已完成'},
                  {value: 'cancelled', label: '已取消'}
                ].map((item) => (
                  <Button
                    key={item.value}
                    className={`flex-1 py-2 rounded break-keep text-xs ${
                      filterType === item.value
                        ? 'bg-blue-100 text-white'
                        : 'bg-background text-foreground border border-border'
                    }`}
                    size="mini"
                    onClick={() => setFilterType(item.value as any)}>
                    {item.label}
                  </Button>
                ))}
              </View>
            </View>

            {/* 时间范围筛选 */}
            <View>
              <Text className="text-xs text-muted-foreground mb-2">时间范围</Text>
              <View className="flex gap-2">
                {[
                  {value: 'today', label: '今天'},
                  {value: 'week', label: '本周'},
                  {value: 'month', label: '本月'},
                  {value: 'all', label: '全部'}
                ].map((item) => (
                  <Button
                    key={item.value}
                    className={`flex-1 py-2 rounded break-keep text-xs ${
                      dateRange === item.value
                        ? 'bg-blue-100 text-white'
                        : 'bg-background text-foreground border border-border'
                    }`}
                    size="mini"
                    onClick={() => setDateRange(item.value as any)}>
                    {item.label}
                  </Button>
                ))}
              </View>
            </View>
          </View>

          {/* 统计信息 */}
          <View className="grid grid-cols-3 gap-3">
            <View className="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm border border-border text-center">
              <Text className="text-2xl font-bold text-blue-600">{records.length}</Text>
              <Text className="text-xs text-muted-foreground mt-1">总记录</Text>
            </View>
            <View className="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm border border-border text-center">
              <Text className="text-2xl font-bold text-orange-500">
                {records.filter((r) => r.status === 'pending').length}
              </Text>
              <Text className="text-xs text-muted-foreground mt-1">待执行</Text>
            </View>
            <View className="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-sm border border-border text-center">
              <Text className="text-2xl font-bold text-muted-foreground">
                {records.filter((r) => r.status === 'completed').length}
              </Text>
              <Text className="text-xs text-muted-foreground mt-1">已完成</Text>
            </View>
          </View>

          {/* 排班记录列表 */}
          {records.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-12">
              <EmptyState icon="i-mdi-calendar-check" title="暂无排班记录" description="当前筛选条件下没有排班记录" />
            </View>
          ) : (
            records.map((record) => {
              const statusInfo = getStatusInfo(record.status)
              return (
                <View
                  key={record.id}
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border"
                  onClick={() => handleViewDetail(record.id)}>
                  {/* 头部：日期和状态 */}
                  <View className="flex items-center justify-between mb-3">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-calendar text-blue-600" />
                      <Text className="text-sm font-medium text-foreground">{record.schedule_date}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded ${statusInfo.bg}`}>
                      <Text className={`text-xs ${statusInfo.color}`}>{statusInfo.text}</Text>
                    </View>
                  </View>

                  {/* 时间段 */}
                  {(record.start_time || record.end_time) && (
                    <View className="flex items-center gap-2 mb-2">
                      <View className="i-mdi-clock-outline text-muted-foreground text-sm" />
                      <Text className="text-sm text-muted-foreground">
                        {record.start_time || '--:--'} ~ {record.end_time || '--:--'}
                      </Text>
                    </View>
                  )}

                  {/* 备注 */}
                  {record.notes && (
                    <View className="mb-3">
                      <Text className="text-sm text-foreground line-clamp-2">{record.notes}</Text>
                    </View>
                  )}

                  {/* 操作按钮 */}
                  {record.status === 'pending' && (
                    <View className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-xs"
                        size="mini"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleComplete(record.id)
                        }}>
                        完成
                      </Button>
                      <Button
                        className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-xs"
                        size="mini"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCancel(record.id)
                        }}>
                        取消
                      </Button>
                      <Button
                        className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-xs"
                        size="mini"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(record.id)
                        }}>
                        删除
                      </Button>
                    </View>
                  )}
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default ScheduleRecords
