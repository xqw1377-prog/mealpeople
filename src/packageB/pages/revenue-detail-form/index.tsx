/**
 * 营收明细录入页面
 * 支持按日期、餐段、经营区录入营收数据
 */

import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import {navigateBack, showToast} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useState} from 'react'
import {createRevenueDetailRecord} from '@/db/api-revenue-detail'
import type {BusinessArea, MealPeriodType} from '@/db/types'
import {BusinessAreaLabels, MealPeriodTypeLabels} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const RevenueDetailForm: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  const [loading, setLoading] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    revenue_date: new Date().toISOString().substring(0, 10),
    meal_period: 'lunch' as MealPeriodType,
    business_area: 'hall' as BusinessArea,
    customer_count: '',
    avg_price_per_customer: '',
    notes: ''
  })

  // 餐段选项
  const mealPeriodOptions = Object.entries(MealPeriodTypeLabels).map(([value, label]) => ({
    value: value as MealPeriodType,
    label
  }))
  const [mealPeriodIndex, setMealPeriodIndex] = useState(1) // 默认午餐

  // 经营区选项
  const businessAreaOptions = Object.entries(BusinessAreaLabels).map(([value, label]) => ({
    value: value as BusinessArea,
    label
  }))
  const [businessAreaIndex, setBusinessAreaIndex] = useState(0) // 默认大厅

  // 计算总营收
  const calculateTotalRevenue = () => {
    const customerCount = Number(formData.customer_count) || 0
    const avgPrice = Number(formData.avg_price_per_customer) || 0
    return customerCount * avgPrice
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!currentTenant || !currentStore || !user) {
      showToast({title: '请先选择店铺', icon: 'none'})
      return
    }

    // 验证必填字段
    if (!formData.revenue_date) {
      showToast({title: '请选择日期', icon: 'none'})
      return
    }

    if (!formData.customer_count || Number(formData.customer_count) < 0) {
      showToast({title: '请输入有效的来客数', icon: 'none'})
      return
    }

    if (!formData.avg_price_per_customer || Number(formData.avg_price_per_customer) < 0) {
      showToast({title: '请输入有效的客单价', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const result = await createRevenueDetailRecord({
        tenant_id: currentTenant.id,
        store_id: currentStore.id,
        revenue_date: formData.revenue_date,
        meal_period: formData.meal_period,
        business_area: formData.business_area,
        customer_count: Number(formData.customer_count),
        avg_price_per_customer: Number(formData.avg_price_per_customer),
        notes: formData.notes || null,
        created_by: user.id
      })

      if (result) {
        showToast({title: '录入成功', icon: 'success'})
        setTimeout(() => {
          navigateBack()
        }, 1000)
      } else {
        showToast({title: '录入失败', icon: 'none'})
      }
    } catch (error: any) {
      console.error('录入失败:', error)
      if (error.message?.includes('duplicate')) {
        showToast({
          title: '该日期、餐段、经营区的数据已存在',
          icon: 'none',
          duration: 2500
        })
      } else {
        showToast({
          title: `录入失败: ${error.message || '未知错误'}`,
          icon: 'none',
          duration: 2500
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // 重置表单
  const handleReset = () => {
    setFormData({
      revenue_date: new Date().toISOString().substring(0, 10),
      meal_period: 'lunch',
      business_area: 'hall',
      customer_count: '',
      avg_price_per_customer: '',
      notes: ''
    })
    setMealPeriodIndex(1)
    setBusinessAreaIndex(0)
    showToast({title: '已重置', icon: 'success'})
  }

  if (!currentTenant || !currentStore) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="text-center">
          <View className="i-mdi-alert-circle text-4xl text-yellow-500 mb-4" />
          <Text className="text-sm text-muted-foreground">请先选择租户和店铺</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 头部说明 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <Text className="text-base font-bold text-foreground block mb-1">营收明细录入</Text>
            <Text className="text-xs text-muted-foreground block">
              录入营收数据，系统将自动计算总营收（来客数 × 客单价）
            </Text>
          </View>

          {/* 当前店铺信息 */}
          <View className="bg-blue-100 rounded-xl p-3 mb-4">
            <View className="flex items-center gap-2">
              <View className="i-mdi-store text-lg text-muted-foreground" />
              <Text className="text-sm text-blue-600 font-medium">{currentStore.name}</Text>
            </View>
          </View>

          {/* 表单卡片 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
            {/* 日期选择 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                日期 <Text className="text-red-500">*</Text>
              </Text>
              <Picker
                mode="date"
                value={formData.revenue_date}
                onChange={(e) => setFormData({...formData, revenue_date: e.detail.value})}>
                <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
                  <Text className="text-foreground">{formData.revenue_date}</Text>
                  <View className="i-mdi-calendar text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 餐段选择 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                餐段 <Text className="text-red-500">*</Text>
              </Text>
              <Picker
                mode="selector"
                range={mealPeriodOptions.map((o) => o.label)}
                value={mealPeriodIndex}
                onChange={(e) => {
                  const index = Number(e.detail.value)
                  setMealPeriodIndex(index)
                  setFormData({...formData, meal_period: mealPeriodOptions[index].value})
                }}>
                <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
                  <Text className="text-foreground">{mealPeriodOptions[mealPeriodIndex].label}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 经营区选择 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                经营区 <Text className="text-red-500">*</Text>
              </Text>
              <Picker
                mode="selector"
                range={businessAreaOptions.map((o) => o.label)}
                value={businessAreaIndex}
                onChange={(e) => {
                  const index = Number(e.detail.value)
                  setBusinessAreaIndex(index)
                  setFormData({...formData, business_area: businessAreaOptions[index].value})
                }}>
                <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
                  <Text className="text-foreground">{businessAreaOptions[businessAreaIndex].label}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 来客数 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                来客数 <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  type="number"
                  placeholder="请输入来客数"
                  value={formData.customer_count}
                  onInput={(e) => setFormData({...formData, customer_count: e.detail.value})}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">单位：人</Text>
            </View>

            {/* 客单价 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                客单价 <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  type="digit"
                  placeholder="请输入客单价"
                  value={formData.avg_price_per_customer}
                  onInput={(e) => setFormData({...formData, avg_price_per_customer: e.detail.value})}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">单位：元</Text>
            </View>

            {/* 总营收预览 */}
            <View className="mb-4 p-4 bg-blue-100 rounded-xl">
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <View className="i-mdi-calculator text-lg text-yellow-600" />
                  <Text className="text-sm text-foreground">总营收</Text>
                </View>
                <Text className="text-lg font-bold text-yellow-600">¥{calculateTotalRevenue().toLocaleString()}</Text>
              </View>
              <Text className="text-xs text-muted-foreground mt-2">
                {formData.customer_count && formData.avg_price_per_customer
                  ? `${formData.customer_count} 人 × ¥${formData.avg_price_per_customer} = ¥${calculateTotalRevenue().toLocaleString()}`
                  : '请输入来客数和客单价'}
              </Text>
            </View>

            {/* 备注 */}
            <View className="mb-6">
              <Text className="text-sm text-foreground block mb-2">备注</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                  placeholder="选填，如：促销活动、特殊情况等"
                  value={formData.notes}
                  onInput={(e) => setFormData({...formData, notes: e.detail.value})}
                />
              </View>
            </View>

            {/* 操作按钮 */}
            <View className="flex gap-3">
              <Button
                className="flex-1 bg-muted text-foreground rounded-xl text-sm break-keep py-3"
                size="default"
                onClick={handleReset}>
                重置
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white rounded-xl text-sm break-keep py-3"
                size="default"
                loading={loading}
                disabled={loading}
                onClick={handleSubmit}>
                {loading ? '提交中...' : '确认录入'}
              </Button>
            </View>
          </View>

          {/* 提示信息 */}
          <View className="mt-4 p-3 bg-blue-100 rounded-xl">
            <View className="flex items-start gap-2">
              <View className="i-mdi-information text-base text-muted-foreground mt-0.5" />
              <View className="flex-1">
                <Text className="text-xs text-blue-600 block mb-1 font-medium">温馨提示</Text>
                <Text className="text-xs text-blue-600 block">• 同一天、同一餐段、同一经营区只能录入一条数据</Text>
                <Text className="text-xs text-blue-600 block">• 总营收 = 来客数 × 客单价（自动计算）</Text>
                <Text className="text-xs text-blue-600 block">• 数据录入后可在营收明细列表中查看和管理</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default RevenueDetailForm
