/**
 * 营业餐段配置页面
 * 配置午餐、晚餐等营业时段
 */

import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  createMealPeriod,
  deleteMealPeriod,
  getMealPeriods,
  type MealPeriod,
  updateMealPeriod
} from '@/db/api-meal-periods'
import {useTenantStore} from '@/store/tenant'
import {runFullDiagnostics} from '@/utils/debug-helper'

const MealPeriods: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [loading, setLoading] = useState(false)
  const [periods, setPeriods] = useState<MealPeriod[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<MealPeriod | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    periodName: '',
    startTime: '11:00',
    endTime: '14:00'
  })

  // 加载营业餐段列表
  const loadPeriods = useCallback(async () => {
    console.log('========== 开始加载餐段列表 ==========')
    console.log('当前租户ID:', currentTenant?.id)
    console.log('当前租户名称:', currentTenant?.name)

    if (!currentTenant) {
      console.warn('⚠️ 当前租户为空，无法加载餐段')
      return
    }

    setLoading(true)
    try {
      console.log('📡 调用API: getMealPeriods')
      const data = await getMealPeriods(currentTenant.id)
      console.log('========== 餐段列表加载完成 ==========')
      console.log('数据数量:', data.length)
      console.log(
        '餐段详情:',
        data.map((p) => ({
          id: p.id,
          name: p.period_name,
          time: `${p.start_time}-${p.end_time}`
        }))
      )

      console.log('🔄 更新状态: setPeriods(', data.length, '条记录)')
      setPeriods(data)
      console.log('✅ 状态更新完成，当前periods长度应为:', data.length)
    } catch (error) {
      console.error('❌ 加载营业餐段失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadPeriods()
  })

  // 重置表单
  const resetForm = () => {
    setFormData({
      periodName: '',
      startTime: '11:00',
      endTime: '14:00'
    })
    setEditingPeriod(null)
  }

  // 打开添加表单
  const handleAdd = () => {
    resetForm()
    setShowAddForm(true)
  }

  // 打开编辑表单
  const handleEdit = (period: MealPeriod) => {
    setFormData({
      periodName: period.period_name,
      startTime: period.start_time || '11:00',
      endTime: period.end_time || '14:00'
    })
    setEditingPeriod(period)
    setShowAddForm(true)
  }

  // 保存营业餐段
  const handleSave = async () => {
    if (!currentTenant || !user) {
      Taro.showToast({
        title: '用户信息缺失',
        icon: 'none'
      })
      return
    }

    if (!formData.periodName) {
      Taro.showToast({
        title: '请填写餐段名称',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      if (editingPeriod) {
        // 更新
        console.log('更新餐段，ID:', editingPeriod.id, '数据:', {
          period_name: formData.periodName,
          start_time: formData.startTime,
          end_time: formData.endTime
        })
        const result = await updateMealPeriod(editingPeriod.id, {
          period_name: formData.periodName,
          start_time: formData.startTime,
          end_time: formData.endTime
        })
        if (!result) {
          throw new Error('更新失败：API返回null，请检查控制台日志')
        }
        console.log('✅ 餐段更新成功，返回数据:', result)
      } else {
        // 创建
        console.log('创建餐段，租户ID:', currentTenant.id, '数据:', {
          period_name: formData.periodName,
          period_order: periods.length,
          start_time: formData.startTime,
          end_time: formData.endTime
        })
        const result = await createMealPeriod({
          tenant_id: currentTenant.id,
          period_name: formData.periodName,
          period_order: periods.length,
          start_time: formData.startTime,
          end_time: formData.endTime
        })
        if (!result) {
          throw new Error('创建失败：API返回null，请检查控制台日志')
        }
        console.log('✅ 餐段创建成功，返回数据:', result)
      }

      // 先刷新列表（在关闭表单之前）
      console.log('🔄 开始刷新餐段列表...')
      await loadPeriods()
      console.log('✅ 餐段列表刷新完成')

      // 显示成功提示
      Taro.showToast({
        title: editingPeriod ? '更新成功' : '创建成功',
        icon: 'success'
      })

      // 延迟关闭表单，确保状态更新完成
      setTimeout(() => {
        setShowAddForm(false)
        resetForm()
      }, 300)
    } catch (error) {
      console.error('保存失败，错误详情:', error)
      const errorMessage = error instanceof Error ? error.message : '保存失败'
      Taro.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  // 删除营业餐段
  const handleDelete = async (period: MealPeriod) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除"${period.period_name}"吗？`
    })

    if (!result.confirm) return

    try {
      const success = await deleteMealPeriod(period.id)
      if (success) {
        Taro.showToast({
          title: '删除成功',
          icon: 'success'
        })
        await loadPeriods()
      } else {
        throw new Error('删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  }

  // 运行诊断
  const handleRunDiagnostics = async () => {
    if (!currentTenant) {
      Taro.showToast({
        title: '请先选择租户',
        icon: 'none'
      })
      return
    }

    Taro.showLoading({title: '正在诊断...'})
    await runFullDiagnostics(currentTenant.id)
    Taro.hideLoading()
  }

  // 处理时间选择
  const handleTimeChange = (field: 'startTime' | 'endTime', e: any) => {
    const value = e.detail.value
    // value是数组 [小时索引, 分钟索引]
    const hours = value[0].toString().padStart(2, '0')
    const minutes = value[1].toString().padStart(2, '0')
    setFormData({
      ...formData,
      [field]: `${hours}:${minutes}`
    })
  }

  // 生成时间选择器的选项
  const generateTimeRange = () => {
    const hours = Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0'))
    const minutes = Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0'))
    return [hours, minutes]
  }

  // 解析时间字符串为选择器索引
  const parseTimeToIndex = (timeStr: string): number[] => {
    if (!timeStr || !timeStr.includes(':')) {
      return [11, 0] // 默认11:00
    }
    const [hours, minutes] = timeStr.split(':')
    const h = Number.parseInt(hours, 10)
    const m = Number.parseInt(minutes, 10)
    return [Number.isNaN(h) ? 11 : h, Number.isNaN(m) ? 0 : m]
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 页面标题 */}
      <View className="bg-white px-6 py-4 mb-4 shadow-sm">
        <Text className="text-xl font-bold text-foreground">营业餐段配置</Text>
        <Text className="text-sm text-muted-foreground mt-1">配置午餐、晚餐等营业时段</Text>
      </View>

      <ScrollView scrollY className="px-4 pb-20" style={{height: 'calc(100vh - 120px)'}}>
        {/* 营业餐段列表 */}
        {periods.length > 0 ? (
          <View className="space-y-3 mb-4">
            {periods.map((period) => (
              <View key={period.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-lg font-bold text-foreground">{period.period_name}</Text>
                  <View className="flex items-center gap-2">
                    <Button
                      onClick={() => handleEdit(period)}
                      size="mini"
                      className="bg-blue-100 text-white px-3 py-1 text-xs break-keep">
                      编辑
                    </Button>
                    <Button
                      onClick={() => handleDelete(period)}
                      size="mini"
                      className="bg-blue-100 text-white px-3 py-1 text-xs break-keep">
                      删除
                    </Button>
                  </View>
                </View>
                <View className="flex items-center gap-2 text-sm text-muted-foreground">
                  <View className="i-mdi-clock-outline text-base" />
                  <Text>
                    {period.start_time || '--:--'} - {period.end_time || '--:--'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
            <View className="i-mdi-calendar-clock text-5xl text-gray-300 mx-auto mb-4" />
            <Text className="text-muted-foreground">暂无营业餐段配置</Text>
            <Text className="text-xs text-muted-foreground mt-2">点击下方按钮添加餐段</Text>
          </View>
        )}

        {/* 添加/编辑表单 */}
        {showAddForm && (
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4">
            <Text className="text-lg font-bold text-foreground mb-4">{editingPeriod ? '编辑餐段' : '新增餐段'}</Text>

            <View className="space-y-3">
              {/* 餐段名称 */}
              <View>
                <Text className="text-sm text-foreground mb-2 block">
                  餐段名称 <Text className="text-red-500">*</Text>
                </Text>
                <Input
                  value={formData.periodName}
                  onInput={(e) => setFormData({...formData, periodName: e.detail.value})}
                  placeholder="如：午餐、晚餐"
                  className="border border-border rounded-lg p-3 bg-gray-50"
                />
              </View>

              {/* 开始时间 */}
              <View>
                <Text className="text-sm text-foreground mb-2 block">开始时间</Text>
                <Picker
                  mode="multiSelector"
                  range={generateTimeRange()}
                  value={parseTimeToIndex(formData.startTime)}
                  onChange={(e) => handleTimeChange('startTime', e)}>
                  <View className="border border-border rounded-lg p-3 bg-muted flex items-center justify-between">
                    <Text className="text-foreground">{formData.startTime}</Text>
                    <View className="i-mdi-clock-outline text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 结束时间 */}
              <View>
                <Text className="text-sm text-foreground mb-2 block">结束时间</Text>
                <Picker
                  mode="multiSelector"
                  range={generateTimeRange()}
                  value={parseTimeToIndex(formData.endTime)}
                  onChange={(e) => handleTimeChange('endTime', e)}>
                  <View className="border border-border rounded-lg p-3 bg-muted flex items-center justify-between">
                    <Text className="text-foreground">{formData.endTime}</Text>
                    <View className="i-mdi-clock-outline text-muted-foreground" />
                  </View>
                </Picker>
              </View>
            </View>

            {/* 按钮组 */}
            <View className="flex gap-3 mt-4">
              <Button
                onClick={() => {
                  setShowAddForm(false)
                  resetForm()
                }}
                className="flex-1 bg-gray-200 text-foreground py-3 text-sm break-keep"
                size="default">
                取消
              </Button>
              <Button
                onClick={handleSave}
                loading={loading}
                className="flex-1 bg-blue-100 text-white py-3 text-sm break-keep"
                size="default">
                保存
              </Button>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 底部添加按钮 */}
      {!showAddForm && (
        <View className="fixed bottom-0 left-0 right-0 p-4 bg-white">
          <View className="flex gap-2">
            <Button
              onClick={handleRunDiagnostics}
              className="flex-1 bg-blue-100 text-white py-3 font-semibold text-base break-keep"
              size="default">
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-bug text-xl" />
                <Text>诊断</Text>
              </View>
            </Button>
            <Button
              onClick={handleAdd}
              className="flex-[2] bg-blue-100 text-white py-3 font-semibold text-base break-keep"
              size="default">
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus text-xl" />
                <Text>添加餐段</Text>
              </View>
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default MealPeriods
