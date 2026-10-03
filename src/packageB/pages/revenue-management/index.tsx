/**
 * 营收管理中心页面
 * 整合历史数据导入、月度数据修正、数据查看等功能
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {SkeletonList} from '@/components/Skeleton'
import {getRevenueStats} from '@/db/api'
import {useTenantStore} from '@/store/tenant'

interface RevenueStats {
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
}

export default function RevenueManagement() {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)
  const [stats, setStats] = useState<RevenueStats>({
    today: 0,
    yesterday: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0
  })
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 加载营收统计数据
  const loadStats = useCallback(async () => {
    if (!currentTenant?.id || !currentStore?.id) return

    setLoading(true)
    try {
      const statsData = await getRevenueStats(currentStore.id)
      setStats(statsData)
    } catch (error) {
      console.error('加载营收统计失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentTenant?.id, currentStore?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadStats()
  })

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadStats()
  }, [loadStats])

  // 导航到指定页面
  const navigateTo = (url: string) => {
    Taro.navigateTo({url})
  }

  if (!currentTenant) {
    return (
      <View className="min-h-screen bg-gray-50 p-4">
        <View className="bg-blue-100 border border-yellow-200 rounded-lg p-4">
          <View className="flex items-center gap-2">
            <View className="i-mdi-alert text-2xl text-yellow-600" />
            <Text className="text-yellow-800">请先在首页选择租户</Text>
          </View>
        </View>
      </View>
    )
  }

  if (!currentStore) {
    return (
      <View className="min-h-screen bg-gray-50 p-4">
        <View className="bg-blue-100 border border-yellow-200 rounded-lg p-4">
          <View className="flex items-center gap-2">
            <View className="i-mdi-alert text-2xl text-yellow-600" />
            <Text className="text-yellow-800">请先在首页选择门店</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen box-border"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4">
          {/* 页面说明 */}
          <View className="bg-blue-100 rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex items-start gap-3">
              <View className="i-mdi-information text-3xl text-blue-600" />
              <View className="flex-1">
                <Text className="text-foreground font-bold text-lg block mb-2">营收管理说明</Text>
                <Text className="text-blue-600 text-sm block mb-1">• 历史数据导入：批量导入过去的营收数据</Text>
                <Text className="text-blue-600 text-sm block mb-1">• 月度数据修正：修正已录入的月度营收数据</Text>
                <Text className="text-blue-600 text-sm block">• 数据参考：为营收预测提供历史数据支持</Text>
              </View>
            </View>
          </View>

          {/* 当前门店信息 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center gap-2 mb-2">
              <View className="i-mdi-store text-xl text-muted-foreground" />
              <Text className="text-base font-bold text-gray-800">当前门店</Text>
            </View>
            <Text className="text-lg text-gray-900 font-bold">{currentStore.name}</Text>
          </View>

          {/* 营收数据概览 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-chart-line text-xl text-muted-foreground" />
              <Text className="text-base font-bold text-gray-800">数据概览</Text>
            </View>

            {loading ? (
              <SkeletonList count={3} />
            ) : (
              <View className="space-y-3">
                {/* 今日营收 */}
                <View className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                  <View className="flex items-center gap-2">
                    <View className="i-mdi-cash-multiple text-lg text-muted-foreground" />
                    <Text className="text-sm text-gray-700">今日营收</Text>
                  </View>
                  <Text className="text-lg font-bold text-muted-foreground">¥{stats.today.toFixed(2)}</Text>
                </View>

                {/* 昨日营收 */}
                <View className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                  <View className="flex items-center gap-2">
                    <View className="i-mdi-calendar-today text-lg text-muted-foreground" />
                    <Text className="text-sm text-gray-700">昨日营收</Text>
                  </View>
                  <Text className="text-lg font-bold text-muted-foreground">¥{stats.yesterday.toFixed(2)}</Text>
                </View>

                {/* 本周营收 */}
                <View className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                  <View className="flex items-center gap-2">
                    <View className="i-mdi-calendar-week text-lg text-muted-foreground" />
                    <Text className="text-sm text-gray-700">本周营收</Text>
                  </View>
                  <Text className="text-lg font-bold text-muted-foreground">¥{stats.thisWeek.toFixed(2)}</Text>
                </View>

                {/* 本月营收 */}
                <View className="flex items-center justify-between p-3 bg-blue-100 rounded-lg">
                  <View className="flex items-center gap-2">
                    <View className="i-mdi-calendar-month text-lg text-muted-foreground" />
                    <Text className="text-sm text-gray-700">本月营收</Text>
                  </View>
                  <Text className="text-lg font-bold text-muted-foreground">¥{stats.thisMonth.toFixed(2)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* 功能区域 */}
          <View className="space-y-3">
            {/* 第一部分：数据导入 */}
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-database-import text-xl text-muted-foreground" />
                <Text className="text-base font-bold text-gray-800">数据导入</Text>
              </View>

              <View className="space-y-2">
                {/* 历史数据导入 - 修复：跳转到优化后的revenue-import页面 */}
                <View
                  className="flex items-center justify-between p-3 bg-blue-100 rounded-lg active:scale-98 transition-all"
                  onClick={() => navigateTo('/packageB/pages/revenue-import/index')}>
                  <View className="flex items-center gap-3">
                    <View className="i-mdi-history text-2xl text-muted-foreground" />
                    <View>
                      <Text className="text-base font-bold text-gray-800 block mb-1">历史数据导入</Text>
                      <Text className="text-xs text-gray-500">快速录入过去的营收数据</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-xl text-gray-400" />
                </View>

                {/* Excel导入 */}
                <View
                  className="flex items-center justify-between p-3 bg-blue-100 rounded-lg active:scale-98 transition-all"
                  onClick={() => navigateTo('/packageB/pages/revenue-excel-import/index')}>
                  <View className="flex items-center gap-3">
                    <View className="i-mdi-file-excel text-2xl text-muted-foreground" />
                    <View>
                      <Text className="text-base font-bold text-gray-800 block mb-1">Excel批量导入</Text>
                      <Text className="text-xs text-gray-500">CSV格式批量导入营收数据</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-xl text-gray-400" />
                </View>
              </View>
            </View>

            {/* 第二部分：数据管理 */}
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-database-edit text-xl text-muted-foreground" />
                <Text className="text-base font-bold text-gray-800">数据管理</Text>
              </View>

              <View className="space-y-2">
                {/* 营收明细列表 */}
                <View
                  className="flex items-center justify-between p-3 bg-blue-100 rounded-lg active:scale-98 transition-all"
                  onClick={() => navigateTo('/packageB/pages/revenue-detail-list/index')}>
                  <View className="flex items-center gap-3">
                    <View className="i-mdi-format-list-bulleted text-2xl text-muted-foreground" />
                    <View>
                      <Text className="text-base font-bold text-gray-800 block mb-1">营收明细列表</Text>
                      <Text className="text-xs text-gray-500">查看和修正月度营收数据</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-xl text-gray-400" />
                </View>

                {/* 周历视图 */}
                <View
                  className="flex items-center justify-between p-3 bg-blue-100 rounded-lg active:scale-98 transition-all"
                  onClick={() => navigateTo('/packageB/pages/revenue-weekly-calendar/index')}>
                  <View className="flex items-center gap-3">
                    <View className="i-mdi-calendar-week text-2xl text-indigo-600" />
                    <View>
                      <Text className="text-base font-bold text-gray-800 block mb-1">周历视图</Text>
                      <Text className="text-xs text-gray-500">按周查看营收数据</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-xl text-gray-400" />
                </View>
              </View>
            </View>

            {/* 第三部分：数据分析 */}
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-chart-box text-xl text-muted-foreground" />
                <Text className="text-base font-bold text-gray-800">数据分析</Text>
              </View>

              <View className="space-y-2">
                {/* 营收预测 */}
                <View
                  className="flex items-center justify-between p-3 bg-blue-100 rounded-lg active:scale-98 transition-all"
                  onClick={() => navigateTo('/packageB/pages/revenue-prediction/index')}>
                  <View className="flex items-center gap-3">
                    <View className="i-mdi-chart-timeline-variant text-2xl text-muted-foreground" />
                    <View>
                      <Text className="text-base font-bold text-gray-800 block mb-1">营收预测</Text>
                      <Text className="text-xs text-gray-500">基于历史数据预测未来营收</Text>
                    </View>
                  </View>
                  <View className="i-mdi-chevron-right text-xl text-gray-400" />
                </View>
              </View>
            </View>
          </View>

          {/* 使用提示 */}
          <View className="bg-blue-100 border border-border rounded-lg p-4 mt-4">
            <View className="flex items-start gap-2">
              <View className="i-mdi-lightbulb text-xl text-muted-foreground" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-blue-600 block mb-2">使用建议</Text>
                <Text className="text-xs text-blue-600 block mb-1">1. 首次使用建议先导入历史数据，建立数据基础</Text>
                <Text className="text-xs text-blue-600 block mb-1">2. 定期检查和修正月度数据，确保数据准确性</Text>
                <Text className="text-xs text-blue-600 block">3. 数据越完整，营收预测越准确</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
