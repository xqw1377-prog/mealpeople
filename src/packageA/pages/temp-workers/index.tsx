import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import type {PartTimeShift} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

/**
 * 临时工管理页面
 * 功能：
 * 1. 查看所有临时工信息（从兼职记录中自动同步）
 * 2. 查看临时工的工作记录
 * 3. 删除临时工的所有记录
 */
const TempWorkers: React.FC = () => {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  // 状态管理
  const [loading, setLoading] = useState(false)
  const [tempWorkers, setTempWorkers] = useState<
    Array<{
      employee_name: string
      phone: string | null
      total_hours: number
      total_cost: number
      work_count: number
      last_work_date: string
    }>
  >([])
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null)
  const [workerDetails, setWorkerDetails] = useState<PartTimeShift[]>([])

  // 加载临时工列表（从兼职记录中自动同步）
  const loadTempWorkers = useCallback(async () => {
    if (!currentTenant?.id || !currentStore?.id) return

    setLoading(true)
    try {
      // 查询所有兼职记录，按员工姓名分组统计
      const {data, error} = await supabase
        .from('part_time_shifts')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('store_id', currentStore.id)
        .order('operation_date', {ascending: false})

      if (error) throw error

      // 按员工姓名分组统计
      const workerMap = new Map<
        string,
        {
          employee_name: string
          phone: string | null
          total_hours: number
          total_cost: number
          work_count: number
          last_work_date: string
        }
      >()

      data?.forEach((shift) => {
        const key = shift.employee_name
        if (workerMap.has(key)) {
          const worker = workerMap.get(key)!
          worker.total_hours += shift.work_hours
          worker.total_cost += shift.total_cost
          worker.work_count += 1
          if (shift.operation_date > worker.last_work_date) {
            worker.last_work_date = shift.operation_date
            worker.phone = shift.phone || worker.phone
          }
        } else {
          workerMap.set(key, {
            employee_name: shift.employee_name,
            phone: shift.phone,
            total_hours: shift.work_hours,
            total_cost: shift.total_cost,
            work_count: 1,
            last_work_date: shift.operation_date
          })
        }
      })

      setTempWorkers(Array.from(workerMap.values()))
    } catch (err) {
      console.error('加载临时工列表失败:', err)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, currentStore?.id])

  // 查看临时工详情
  const viewWorkerDetails = useCallback(
    async (workerName: string) => {
      if (!currentTenant?.id || !currentStore?.id) return

      try {
        const {data, error} = await supabase
          .from('part_time_shifts')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .eq('store_id', currentStore.id)
          .eq('employee_name', workerName)
          .order('operation_date', {ascending: false})

        if (error) throw error

        setWorkerDetails(data || [])
        setSelectedWorker(workerName)
        setShowDetailModal(true)
      } catch (err) {
        console.error('加载临时工详情失败:', err)
        Taro.showToast({title: '加载失败', icon: 'none'})
      }
    },
    [currentTenant?.id, currentStore?.id]
  )

  // 删除临时工的所有记录
  const handleDeleteWorker = async (workerName: string) => {
    try {
      const result = await Taro.showModal({
        title: '确认删除',
        content: `确定要删除临时工"${workerName}"的所有工作记录吗？此操作不可恢复。`,
        confirmText: '删除',
        cancelText: '取消'
      })

      if (result.confirm) {
        const {error} = await supabase
          .from('part_time_shifts')
          .delete()
          .eq('tenant_id', currentTenant?.id)
          .eq('store_id', currentStore?.id)
          .eq('employee_name', workerName)

        if (error) throw error

        Taro.showToast({title: '删除成功', icon: 'success'})
        await loadTempWorkers()
      }
    } catch (err) {
      console.error('删除临时工失败:', err)
      Taro.showToast({title: '删除失败', icon: 'none'})
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 页面显示时加载数据
  useDidShow(() => {
    loadTempWorkers()
  })

  useEffect(() => {
    loadTempWorkers()
  }, [loadTempWorkers])

  if (!user) return null

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <ScrollView scrollY className="h-screen">
        <View className="p-4 pb-20">
          {/* 页面标题 */}
          <View className="mb-4">
            <View className="flex items-center mb-2">
              <View className="i-mdi-account-group text-3xl text-muted-foreground mr-2" />
              <Text className="text-2xl font-bold text-foreground">临时工管理</Text>
            </View>
            <Text className="text-sm text-muted-foreground">管理所有临时工信息和工作记录</Text>
            <View className="mt-2 bg-blue-100 rounded-lg p-3">
              <Text className="text-xs text-blue-600">
                💡 提示：临时工数据自动从排班规划中的兼职记录同步，可在排班规划页面添加兼职
              </Text>
            </View>
          </View>

          {/* 临时工列表 */}
          {loading ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-loading text-4xl text-blue-500 animate-spin mx-auto mb-4" />
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : tempWorkers.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-account-off text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无临时工</Text>
              <Text className="text-sm text-muted-foreground block">
                在排班规划页面添加兼职后，临时工信息会自动同步到这里
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {tempWorkers.map((worker, index) => (
                <View key={index} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground block mb-1">{worker.employee_name}</Text>
                      {worker.phone && <Text className="text-sm text-muted-foreground block">📞 {worker.phone}</Text>}
                    </View>
                    <View className="text-right">
                      <Text className="text-lg font-bold text-muted-foreground block">
                        ¥{worker.total_cost.toFixed(2)}
                      </Text>
                      <Text className="text-xs text-muted-foreground">总费用</Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-3 gap-2 mb-3">
                    <View className="bg-blue-100 rounded-lg p-2 text-center">
                      <Text className="text-xs text-muted-foreground block mb-1">工作次数</Text>
                      <Text className="text-sm font-semibold text-blue-600">{worker.work_count}次</Text>
                    </View>
                    <View className="bg-blue-100 rounded-lg p-2 text-center">
                      <Text className="text-xs text-muted-foreground block mb-1">总工时</Text>
                      <Text className="text-sm font-semibold text-green-600">{worker.total_hours}小时</Text>
                    </View>
                    <View className="bg-blue-100 rounded-lg p-2 text-center">
                      <Text className="text-xs text-muted-foreground block mb-1">最近工作</Text>
                      <Text className="text-sm font-semibold text-purple-700">{formatDate(worker.last_work_date)}</Text>
                    </View>
                  </View>

                  <View className="flex gap-2">
                    <Button
                      onClick={() => viewWorkerDetails(worker.employee_name)}
                      className="flex-1 bg-blue-100 text-white py-2"
                      size="default">
                      <Text className="text-sm">查看详情</Text>
                    </Button>
                    <Button
                      onClick={() => handleDeleteWorker(worker.employee_name)}
                      className="flex-1 bg-blue-100 text-red-600 py-2"
                      size="default">
                      <Text className="text-sm">删除</Text>
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 统计信息 */}
          {tempWorkers.length > 0 && (
            <View className="mt-4 bg-blue-100 rounded-xl p-4 text-white">
              <Text className="text-sm opacity-90 block mb-2">总计统计</Text>
              <View className="flex items-center justify-between">
                <View>
                  <Text className="text-2xl font-bold block">{tempWorkers.length}</Text>
                  <Text className="text-xs opacity-90">临时工人数</Text>
                </View>
                <View>
                  <Text className="text-2xl font-bold block">
                    {tempWorkers.reduce((sum, w) => sum + w.total_hours, 0).toFixed(1)}
                  </Text>
                  <Text className="text-xs opacity-90">总工时</Text>
                </View>
                <View>
                  <Text className="text-2xl font-bold block">
                    ¥{tempWorkers.reduce((sum, w) => sum + w.total_cost, 0).toFixed(2)}
                  </Text>
                  <Text className="text-xs opacity-90">总费用</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 临时工详情弹窗 */}
      {showDetailModal && selectedWorker && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 m-4 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">{selectedWorker} 的工作记录</Text>
              <Button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedWorker(null)
                  setWorkerDetails([])
                }}
                className="bg-gray-200 text-muted-foreground px-3 py-1"
                size="mini">
                <Text className="text-xs">关闭</Text>
              </Button>
            </View>

            <View className="space-y-2">
              {workerDetails.map((detail) => (
                <View key={detail.id} className="bg-muted rounded-lg p-3">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm font-semibold text-foreground">{formatDate(detail.operation_date)}</Text>
                    <Text className="text-sm text-muted-foreground">¥{detail.total_cost.toFixed(2)}</Text>
                  </View>
                  <View className="flex items-center justify-between text-xs text-muted-foreground">
                    <Text>
                      {detail.work_hours}小时 × ¥{detail.hourly_rate}/小时
                    </Text>
                    {detail.meal_period && <Text>{detail.meal_period}</Text>}
                  </View>
                  {detail.notes && <Text className="text-xs text-muted-foreground mt-1">备注：{detail.notes}</Text>}
                </View>
              ))}
            </View>

            <View className="mt-4 bg-blue-100 rounded-lg p-3">
              <Text className="text-xs text-blue-600">
                共 {workerDetails.length} 次工作，总工时 {workerDetails.reduce((sum, d) => sum + d.work_hours, 0)}{' '}
                小时，总费用 ¥{workerDetails.reduce((sum, d) => sum + d.total_cost, 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default TempWorkers
