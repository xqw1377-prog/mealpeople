/**
 * 营收明细列表页面
 * 查看和管理营收明细数据
 */

import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import {navigateTo, showModal, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {deleteRevenueDetailRecord, getRevenueDetailRecords} from '@/db/api-revenue-detail'
import type {BusinessArea, MealPeriodType, RevenueDetailRecord} from '@/db/types'
import {BusinessAreaLabels, MealPeriodTypeLabels} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const RevenueDetailList: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<RevenueDetailRecord[]>([])

  // 筛选条件
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7))
  const [filterMealPeriod, setFilterMealPeriod] = useState<MealPeriodType | ''>('')
  const [filterBusinessArea, setFilterBusinessArea] = useState<BusinessArea | ''>('')

  // 生成月份选项（最近12个月）
  const generateMonthOptions = () => {
    const options: string[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      options.push(date.toISOString().substring(0, 7))
    }
    return options
  }

  const monthOptions = generateMonthOptions()
  const [monthIndex, setMonthIndex] = useState(0)

  // 餐段筛选选项
  const mealPeriodFilterOptions = [
    {value: '', label: '全部餐段'},
    ...Object.entries(MealPeriodTypeLabels).map(([value, label]) => ({
      value: value as MealPeriodType,
      label
    }))
  ]
  const [mealPeriodIndex, setMealPeriodIndex] = useState(0)

  // 经营区筛选选项
  const businessAreaFilterOptions = [
    {value: '', label: '全部经营区'},
    ...Object.entries(BusinessAreaLabels).map(([value, label]) => ({
      value: value as BusinessArea,
      label
    }))
  ]
  const [businessAreaIndex, setBusinessAreaIndex] = useState(0)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant || !currentStore) return

    setLoading(true)
    try {
      const startDate = `${filterMonth}-01`
      const endDate = `${filterMonth}-31`

      const data = await getRevenueDetailRecords({
        tenantId: currentTenant.id,
        storeId: currentStore.id,
        startDate,
        endDate,
        mealPeriod: filterMealPeriod || undefined,
        businessArea: filterBusinessArea || undefined
      })

      setRecords(data)
    } catch (error) {
      console.error('加载数据失败:', error)
      showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, currentStore, filterMonth, filterMealPeriod, filterBusinessArea])

  useDidShow(() => {
    loadData()
  })

  // 删除记录
  const handleDelete = async (record: RevenueDetailRecord) => {
    const result = await showModal({
      title: '确认删除',
      content: `确定要删除 ${record.revenue_date} ${MealPeriodTypeLabels[record.meal_period]} ${BusinessAreaLabels[record.business_area]} 的数据吗？`
    })

    if (result.confirm) {
      try {
        await deleteRevenueDetailRecord(record.id)
        showToast({title: '删除成功', icon: 'success'})
        loadData()
      } catch (error) {
        console.error('删除失败:', error)
        showToast({title: '删除失败', icon: 'none'})
      }
    }
  }

  // 跳转到录入页面
  const handleAdd = () => {
    navigateTo({url: '/packageB/pages/revenue-detail-form/index'})
  }

  // 跳转到Excel导入页面
  const handleExcelImport = () => {
    navigateTo({url: '/packageB/pages/revenue-excel-import/index'})
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  // 格式化金额
  const formatAmount = (amount: number) => {
    return `¥${amount.toLocaleString()}`
  }

  // 计算统计数据
  const calculateStats = () => {
    const totalRevenue = records.reduce((sum, r) => sum + r.total_revenue, 0)
    const totalCustomers = records.reduce((sum, r) => sum + r.customer_count, 0)
    const avgPrice = totalCustomers > 0 ? totalRevenue / totalCustomers : 0

    return {
      totalRevenue,
      totalCustomers,
      avgPrice,
      recordCount: records.length
    }
  }

  const stats = calculateStats()

  if (!currentTenant || !currentStore) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="text-center">
          <View className="i-mdi-alert-circle text-4xl text-yellow-500 mb-4" />
          <Text className="text-sm text-gray-600">请先选择租户和店铺</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 头部信息 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-base font-bold text-gray-800">营收明细列表</Text>
              <View className="flex items-center gap-2">
                <Button
                  className="px-3 py-2 bg-blue-100 text-white rounded-lg text-xs break-keep"
                  size="mini"
                  onClick={handleExcelImport}>
                  <View className="flex items-center gap-1">
                    <View className="i-mdi-file-excel text-base" />
                    <Text>Excel导入</Text>
                  </View>
                </Button>
                <Button
                  className="px-3 py-2 bg-blue-100 text-white rounded-lg text-xs break-keep"
                  size="mini"
                  onClick={handleAdd}>
                  <View className="flex items-center gap-1">
                    <View className="i-mdi-plus text-base" />
                    <Text>录入</Text>
                  </View>
                </Button>
              </View>
            </View>
            <View className="flex items-center gap-2">
              <View className="i-mdi-store text-base text-muted-foreground" />
              <Text className="text-sm text-gray-600">{currentStore.name}</Text>
            </View>
          </View>

          {/* 筛选条件 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-bold text-gray-800 block mb-3">筛选条件</Text>

            {/* 月份选择 */}
            <View className="mb-3">
              <Text className="text-xs text-gray-600 block mb-2">月份</Text>
              <Picker
                mode="selector"
                range={monthOptions}
                value={monthIndex}
                onChange={(e) => {
                  const index = Number(e.detail.value)
                  setMonthIndex(index)
                  setFilterMonth(monthOptions[index])
                }}>
                <View className="w-full px-3 py-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <Text className="text-sm text-gray-800">{filterMonth}</Text>
                  <View className="i-mdi-chevron-down text-base text-gray-400" />
                </View>
              </Picker>
            </View>

            {/* 餐段筛选 */}
            <View className="mb-3">
              <Text className="text-xs text-gray-600 block mb-2">餐段</Text>
              <Picker
                mode="selector"
                range={mealPeriodFilterOptions.map((o) => o.label)}
                value={mealPeriodIndex}
                onChange={(e) => {
                  const index = Number(e.detail.value)
                  setMealPeriodIndex(index)
                  setFilterMealPeriod(mealPeriodFilterOptions[index].value as MealPeriodType | '')
                }}>
                <View className="w-full px-3 py-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <Text className="text-sm text-gray-800">{mealPeriodFilterOptions[mealPeriodIndex].label}</Text>
                  <View className="i-mdi-chevron-down text-base text-gray-400" />
                </View>
              </Picker>
            </View>

            {/* 经营区筛选 */}
            <View className="mb-3">
              <Text className="text-xs text-gray-600 block mb-2">经营区</Text>
              <Picker
                mode="selector"
                range={businessAreaFilterOptions.map((o) => o.label)}
                value={businessAreaIndex}
                onChange={(e) => {
                  const index = Number(e.detail.value)
                  setBusinessAreaIndex(index)
                  setFilterBusinessArea(businessAreaFilterOptions[index].value as BusinessArea | '')
                }}>
                <View className="w-full px-3 py-2 bg-gray-50 rounded-lg flex items-center justify-between">
                  <Text className="text-sm text-gray-800">{businessAreaFilterOptions[businessAreaIndex].label}</Text>
                  <View className="i-mdi-chevron-down text-base text-gray-400" />
                </View>
              </Picker>
            </View>

            {/* 查询按钮 */}
            <Button
              className="w-full bg-blue-100 text-white rounded-lg text-sm break-keep py-2"
              size="default"
              loading={loading}
              onClick={loadData}>
              {loading ? '查询中...' : '查询'}
            </Button>
          </View>

          {/* 统计卡片 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-sm font-bold text-gray-800 block mb-3">统计汇总</Text>
            <View className="grid grid-cols-2 gap-3">
              <View className="p-3 bg-blue-100 rounded-lg">
                <Text className="text-xs text-gray-600 block mb-1">总营收</Text>
                <Text className="text-lg font-bold text-yellow-600">{formatAmount(stats.totalRevenue)}</Text>
              </View>
              <View className="p-3 bg-blue-100 rounded-lg">
                <Text className="text-xs text-gray-600 block mb-1">总来客数</Text>
                <Text className="text-lg font-bold text-muted-foreground">{stats.totalCustomers}人</Text>
              </View>
              <View className="p-3 bg-blue-100 rounded-lg">
                <Text className="text-xs text-gray-600 block mb-1">平均客单价</Text>
                <Text className="text-lg font-bold text-muted-foreground">{formatAmount(stats.avgPrice)}</Text>
              </View>
              <View className="p-3 bg-blue-100 rounded-lg">
                <Text className="text-xs text-gray-600 block mb-1">记录数</Text>
                <Text className="text-lg font-bold text-muted-foreground">{stats.recordCount}条</Text>
              </View>
            </View>
          </View>

          {/* 数据列表 */}
          {loading ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-loading text-4xl text-yellow-500 animate-spin mx-auto mb-4" />
              <Text className="text-sm text-gray-500">加载中...</Text>
            </View>
          ) : records.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-inbox text-4xl text-gray-300 mx-auto mb-4" />
              <Text className="text-sm text-gray-500 block mb-4">暂无数据</Text>
              <Button
                className="px-6 py-2 bg-blue-100 text-white rounded-lg text-sm break-keep"
                size="mini"
                onClick={handleAdd}>
                立即录入
              </Button>
            </View>
          ) : (
            <View className="space-y-3">
              {records.map((record) => (
                <View key={record.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                  {/* 日期和标签 */}
                  <View className="flex items-center justify-between mb-3">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-calendar text-base text-gray-600" />
                      <Text className="text-sm font-medium text-gray-800">{formatDate(record.revenue_date)}</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <View className="px-2 py-1 bg-blue-100 rounded">
                        <Text className="text-xs text-muted-foreground">
                          {MealPeriodTypeLabels[record.meal_period]}
                        </Text>
                      </View>
                      <View className="px-2 py-1 bg-purple-100 rounded">
                        <Text className="text-xs text-muted-foreground">
                          {BusinessAreaLabels[record.business_area]}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 数据详情 */}
                  <View className="grid grid-cols-3 gap-3 mb-3">
                    <View>
                      <Text className="text-xs text-gray-500 block mb-1">来客数</Text>
                      <Text className="text-sm font-medium text-gray-800">{record.customer_count}人</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-gray-500 block mb-1">客单价</Text>
                      <Text className="text-sm font-medium text-gray-800">
                        ¥{record.avg_price_per_customer.toFixed(2)}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs text-gray-500 block mb-1">总营收</Text>
                      <Text className="text-sm font-bold text-yellow-600">{formatAmount(record.total_revenue)}</Text>
                    </View>
                  </View>

                  {/* 备注 */}
                  {record.notes && (
                    <View className="p-2 bg-gray-50 rounded-lg mb-3">
                      <Text className="text-xs text-gray-600">{record.notes}</Text>
                    </View>
                  )}

                  {/* 操作按钮 */}
                  <View className="flex gap-2">
                    <Button
                      className="flex-1 bg-blue-100 text-red-600 rounded-lg text-xs break-keep py-2"
                      size="mini"
                      onClick={() => handleDelete(record)}>
                      删除
                    </Button>
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

export default RevenueDetailList
