/**
 * 工作班次配置页面
 * 配置早班、中班、晚班等工作班次
 * 支持多时间段配置
 */

import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  createWorkShift,
  deleteWorkShift,
  getWorkShifts,
  type TimePeriod,
  updateWorkShift,
  type WorkShift
} from '@/db/api-work-shifts'
import {useTenantStore} from '@/store/tenant'

const WorkShifts: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [loading, setLoading] = useState(false)
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    shiftName: '',
    workHours: '8',
    timePeriods: [{start: '09:00', end: '17:00'}] as TimePeriod[]
  })

  // 加载工作班次列表
  const loadShifts = useCallback(async () => {
    console.log('========== 开始加载班次列表 ==========')
    console.log('当前租户ID:', currentTenant?.id)
    console.log('当前租户名称:', currentTenant?.name)

    if (!currentTenant) {
      console.warn('⚠️ 当前租户为空，无法加载班次')
      return
    }

    setLoading(true)
    try {
      console.log('📡 调用API: getWorkShifts')
      const data = await getWorkShifts(currentTenant.id)
      console.log('========== 班次列表加载完成 ==========')
      console.log('数据数量:', data.length)
      console.log(
        '班次详情:',
        data.map((s) => ({
          id: s.id,
          name: s.shift_name,
          hours: s.work_hours
        }))
      )

      console.log('🔄 更新状态: setShifts(', data.length, '条记录)')
      setShifts(data)
      console.log('✅ 状态更新完成，当前shifts长度应为:', data.length)
    } catch (error) {
      console.error('❌ 加载工作班次失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadShifts()
  })

  // 重置表单
  const resetForm = () => {
    setFormData({
      shiftName: '',
      workHours: '8',
      timePeriods: [{start: '09:00', end: '17:00'}]
    })
    setEditingShift(null)
  }

  // 打开添加表单
  const handleAdd = () => {
    resetForm()
    setShowAddForm(true)
  }

  // 打开编辑表单
  const handleEdit = (shift: WorkShift) => {
    // 如果有多时间段，使用多时间段；否则使用单时间段
    const timePeriods =
      shift.time_periods && shift.time_periods.length > 0
        ? shift.time_periods
        : [{start: shift.start_time, end: shift.end_time}]

    setFormData({
      shiftName: shift.shift_name,
      workHours: shift.work_hours.toString(),
      timePeriods
    })
    setEditingShift(shift)
    setShowAddForm(true)
  }

  // 保存工作班次
  const handleSave = async () => {
    if (!currentTenant || !user) {
      Taro.showToast({
        title: '用户信息缺失',
        icon: 'none'
      })
      return
    }

    if (!formData.shiftName) {
      Taro.showToast({
        title: '请填写班次名称',
        icon: 'none'
      })
      return
    }

    // 验证时间段
    if (formData.timePeriods.length === 0) {
      Taro.showToast({
        title: '请至少添加一个时间段',
        icon: 'none'
      })
      return
    }

    // 验证每个时间段
    for (const period of formData.timePeriods) {
      if (!period.start || !period.end) {
        Taro.showToast({
          title: '请完整填写所有时间段',
          icon: 'none'
        })
        return
      }
    }

    const workHours = Number.parseFloat(formData.workHours)
    if (!workHours || workHours <= 0 || workHours > 24) {
      Taro.showToast({
        title: '请输入有效的工作小时数（1-24）',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      // 计算第一个时间段作为start_time和end_time（向后兼容）
      const firstPeriod = formData.timePeriods[0]

      console.log('准备保存班次:', {
        shiftName: formData.shiftName,
        timePeriods: formData.timePeriods,
        workHours,
        isEditing: !!editingShift
      })

      if (editingShift) {
        // 更新
        console.log('更新班次，ID:', editingShift.id)
        const result = await updateWorkShift(editingShift.id, {
          shift_name: formData.shiftName,
          start_time: firstPeriod.start,
          end_time: firstPeriod.end,
          work_hours: workHours,
          time_periods: formData.timePeriods.length > 1 ? formData.timePeriods : null
        })
        if (!result) {
          throw new Error('更新失败：API返回null')
        }
        console.log('✅ 班次更新成功，返回数据:', result)
      } else {
        // 创建
        console.log('创建新班次，租户ID:', currentTenant.id)
        const result = await createWorkShift({
          tenant_id: currentTenant.id,
          shift_name: formData.shiftName,
          shift_order: shifts.length,
          start_time: firstPeriod.start,
          end_time: firstPeriod.end,
          work_hours: workHours,
          time_periods: formData.timePeriods.length > 1 ? formData.timePeriods : null
        })
        if (!result) {
          throw new Error('创建失败：API返回null，请检查控制台日志')
        }
        console.log('✅ 班次创建成功，返回数据:', result)
      }

      // 先刷新列表（在关闭表单之前）
      console.log('🔄 开始刷新班次列表...')
      await loadShifts()
      console.log('✅ 班次列表刷新完成')

      // 显示成功提示
      Taro.showToast({
        title: editingShift ? '更新成功' : '创建成功',
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

  // 删除工作班次
  const handleDelete = async (shift: WorkShift) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除"${shift.shift_name}"吗？`
    })

    if (!result.confirm) return

    try {
      const success = await deleteWorkShift(shift.id)
      if (success) {
        Taro.showToast({
          title: '删除成功',
          icon: 'success'
        })
        await loadShifts()
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

  // 添加时间段
  const handleAddTimePeriod = () => {
    setFormData({
      ...formData,
      timePeriods: [...formData.timePeriods, {start: '09:00', end: '17:00'}]
    })
  }

  // 删除时间段
  const handleRemoveTimePeriod = (index: number) => {
    if (formData.timePeriods.length <= 1) {
      Taro.showToast({
        title: '至少保留一个时间段',
        icon: 'none'
      })
      return
    }
    const newPeriods = formData.timePeriods.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      timePeriods: newPeriods
    })
  }

  // 更新时间段
  const handleUpdateTimePeriod = (index: number, field: 'start' | 'end', value: string) => {
    const newPeriods = [...formData.timePeriods]
    newPeriods[index] = {
      ...newPeriods[index],
      [field]: value
    }
    setFormData({
      ...formData,
      timePeriods: newPeriods
    })
  }

  // 解析时间字符串为选择器索引
  const _parseTimeToIndex = (timeStr: string): number[] => {
    if (!timeStr || !timeStr.includes(':')) {
      return [8, 0] // 默认08:00
    }
    const [hours, minutes] = timeStr.split(':')
    const h = Number.parseInt(hours, 10)
    const m = Number.parseInt(minutes, 10)
    return [Number.isNaN(h) ? 8 : h, Number.isNaN(m) ? 0 : m]
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* 页面标题 */}
      <View className="bg-white px-6 py-4 mb-4 shadow-sm">
        <Text className="text-xl font-bold text-foreground">工作班次配置</Text>
        <Text className="text-sm text-muted-foreground mt-1">配置早班、中班、晚班等工作班次</Text>
      </View>

      <ScrollView scrollY className="px-4 pb-20" style={{height: 'calc(100vh - 120px)'}}>
        {/* 工作班次列表 */}
        {shifts.length > 0 ? (
          <View className="space-y-3 mb-4">
            {shifts.map((shift) => {
              // 判断是否有多时间段
              const hasMultiplePeriods = shift.time_periods && shift.time_periods.length > 0
              const displayPeriods = hasMultiplePeriods
                ? shift.time_periods
                : [{start: shift.start_time, end: shift.end_time}]

              return (
                <View key={shift.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-lg font-bold text-foreground">{shift.shift_name}</Text>
                    <View className="flex items-center gap-2">
                      <Button
                        onClick={() => handleEdit(shift)}
                        size="mini"
                        className="bg-blue-100 text-white px-3 py-1 text-xs break-keep">
                        编辑
                      </Button>
                      <Button
                        onClick={() => handleDelete(shift)}
                        size="mini"
                        className="bg-blue-100 text-white px-3 py-1 text-xs break-keep">
                        删除
                      </Button>
                    </View>
                  </View>

                  {/* 显示时间段 */}
                  <View className="space-y-1">
                    {displayPeriods?.map((period, idx) => (
                      <View key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <View className="i-mdi-clock-outline text-base" />
                        <Text>
                          {hasMultiplePeriods && `时段${idx + 1}: `}
                          {period.start} - {period.end}
                        </Text>
                      </View>
                    ))}
                    <View className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <View className="i-mdi-timer-outline text-base" />
                      <Text>工时: {shift.work_hours}小时</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        ) : (
          <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
            <View className="i-mdi-clock-time-eight text-5xl text-gray-300 mx-auto mb-4" />
            <Text className="text-muted-foreground">暂无工作班次配置</Text>
            <Text className="text-xs text-muted-foreground mt-2">点击下方按钮添加班次</Text>
          </View>
        )}

        {/* 添加/编辑表单 */}
        {showAddForm && (
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4">
            <Text className="text-lg font-bold text-foreground mb-4">{editingShift ? '编辑班次' : '新增班次'}</Text>

            <View className="space-y-4">
              {/* 班次名称 */}
              <View>
                <Text className="text-sm text-foreground mb-2 block">
                  班次名称 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    value={formData.shiftName}
                    onInput={(e) => setFormData({...formData, shiftName: e.detail.value})}
                    placeholder="如：早班、中班、晚班"
                    className="border border-border rounded-lg p-3 bg-muted w-full"
                  />
                </View>
              </View>

              {/* 时间段配置 */}
              <View>
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-foreground">
                    工作时间段 <Text className="text-red-500">*</Text>
                  </Text>
                  <Button
                    onClick={handleAddTimePeriod}
                    size="mini"
                    className="bg-blue-100 text-white px-3 py-1 text-xs break-keep">
                    + 添加时间段
                  </Button>
                </View>

                {/* 时间段列表 */}
                <View className="space-y-3">
                  {formData.timePeriods.map((period, index) => (
                    <View key={index} className="bg-muted rounded-lg p-3 border border-border">
                      <View className="flex items-center justify-between mb-2">
                        <Text className="text-xs text-muted-foreground font-medium">时段 {index + 1}</Text>
                        {formData.timePeriods.length > 1 && (
                          <Button
                            onClick={() => handleRemoveTimePeriod(index)}
                            size="mini"
                            className="bg-blue-100 text-white px-2 py-0.5 text-xs break-keep">
                            删除
                          </Button>
                        )}
                      </View>

                      <View className="flex items-center gap-2">
                        {/* 开始时间 */}
                        <View className="flex-1">
                          <Text className="text-xs text-muted-foreground mb-1">开始</Text>
                          <Picker
                            mode="time"
                            value={period.start}
                            onChange={(e) => handleUpdateTimePeriod(index, 'start', e.detail.value)}>
                            <View className="border border-border rounded px-2 py-2 bg-white flex items-center justify-between">
                              <Text className="text-sm text-foreground">{period.start}</Text>
                              <View className="i-mdi-clock-outline text-muted-foreground text-sm" />
                            </View>
                          </Picker>
                        </View>

                        <Text className="text-muted-foreground mt-5">-</Text>

                        {/* 结束时间 */}
                        <View className="flex-1">
                          <Text className="text-xs text-muted-foreground mb-1">结束</Text>
                          <Picker
                            mode="time"
                            value={period.end}
                            onChange={(e) => handleUpdateTimePeriod(index, 'end', e.detail.value)}>
                            <View className="border border-border rounded px-2 py-2 bg-white flex items-center justify-between">
                              <Text className="text-sm text-foreground">{period.end}</Text>
                              <View className="i-mdi-clock-outline text-muted-foreground text-sm" />
                            </View>
                          </Picker>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                <Text className="text-xs text-muted-foreground mt-2">
                  💡 支持配置多个不连续的时间段，如早班：6:00-9:00 和 16:00-21:00
                </Text>
              </View>

              {/* 工作小时数 */}
              <View>
                <Text className="text-sm text-foreground mb-2 block">
                  工作小时数 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    type="digit"
                    value={formData.workHours}
                    onInput={(e) => setFormData({...formData, workHours: e.detail.value})}
                    placeholder="请输入工作小时数"
                    className="border border-border rounded-lg p-3 bg-muted w-full"
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">💡 用于计算工时和人力成本</Text>
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
          <Button
            onClick={handleAdd}
            className="w-full bg-blue-100 text-white py-3 font-semibold text-base break-keep"
            size="default">
            <View className="flex items-center justify-center gap-2">
              <View className="i-mdi-plus text-xl" />
              <Text>添加班次</Text>
            </View>
          </Button>
        </View>
      )}
    </View>
  )
}

export default WorkShifts
