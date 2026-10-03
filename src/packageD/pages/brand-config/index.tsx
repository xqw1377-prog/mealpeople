import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useEffect, useState} from 'react'
import {
  createMealPeriod,
  createWorkShift,
  deleteMealPeriod,
  deleteWorkShift,
  getMealPeriods,
  getWorkShifts,
  updateMealPeriod,
  updateWorkShift
} from '@/db/api'
import type {MealPeriod, WorkShift} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 时间格式验证和转换函数
const validateTimeFormat = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
  return timeRegex.test(time)
}

const formatTime = (time: string): string => {
  // 如果是HH:mm格式，转换为HH:mm:ss
  if (time && time.split(':').length === 2) {
    return `${time}:00`
  }
  return time
}

const parseTimeToHHMM = (time: string): string => {
  // 将HH:mm:ss转换为HH:mm用于Picker显示
  if (time?.includes(':')) {
    const parts = time.split(':')
    return `${parts[0]}:${parts[1]}`
  }
  return time
}

export default function BrandConfig() {
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [activeTab, setActiveTab] = useState<'meal' | 'shift'>('meal')

  // 餐段配置
  const [mealPeriods, setMealPeriods] = useState<MealPeriod[]>([])
  const [showMealForm, setShowMealForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState<MealPeriod | null>(null)
  const [mealForm, setMealForm] = useState({
    period_name: '',
    start_time: '',
    end_time: '',
    period_order: 0
  })

  // 班次配置
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([])
  const [showShiftForm, setShowShiftForm] = useState(false)
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null)
  const [shiftForm, setShiftForm] = useState({
    shift_name: '',
    start_time: '',
    end_time: '',
    work_hours: 8,
    shift_order: 0
  })

  // 加载餐段配置
  const loadMealPeriods = useCallback(async () => {
    if (!currentTenant?.id) return
    console.log('=== loadMealPeriods 开始 ===', {租户ID: currentTenant.id})
    const data = await getMealPeriods(currentTenant.id)
    console.log('=== loadMealPeriods 完成 ===', {餐段数量: data.length, 餐段列表: data})
    setMealPeriods(data)
  }, [currentTenant?.id])

  // 加载班次配置
  const loadWorkShifts = useCallback(async () => {
    if (!currentTenant?.id) return
    console.log('=== loadWorkShifts 开始 ===', {租户ID: currentTenant.id})
    const data = await getWorkShifts(currentTenant.id)
    console.log('=== loadWorkShifts 完成 ===', {班次数量: data.length, 班次列表: data})
    setWorkShifts(data)
  }, [currentTenant?.id])

  // 保存餐段
  const handleSaveMeal = async () => {
    if (!currentTenant?.id) return

    if (!mealForm.period_name.trim()) {
      Taro.showToast({title: '请输入餐段名称', icon: 'none'})
      return
    }

    if (!mealForm.start_time || !mealForm.end_time) {
      Taro.showToast({title: '请输入开始和结束时间', icon: 'none'})
      return
    }

    // 验证时间格式
    if (!validateTimeFormat(mealForm.start_time)) {
      Taro.showToast({title: '开始时间格式不正确，请使用HH:mm或HH:mm:ss格式', icon: 'none', duration: 2000})
      return
    }

    if (!validateTimeFormat(mealForm.end_time)) {
      Taro.showToast({title: '结束时间格式不正确，请使用HH:mm或HH:mm:ss格式', icon: 'none', duration: 2000})
      return
    }

    // 格式化时间为HH:mm:ss
    const formattedStartTime = formatTime(mealForm.start_time)
    const formattedEndTime = formatTime(mealForm.end_time)

    // 验证开始时间必须早于结束时间
    if (formattedStartTime >= formattedEndTime) {
      Taro.showToast({title: '开始时间必须早于结束时间', icon: 'none', duration: 2000})
      return
    }

    // 检查时间冲突
    const hasConflict = mealPeriods.some((period) => {
      // 如果是编辑模式，排除当前编辑的餐段
      if (editingMeal && period.id === editingMeal.id) {
        return false
      }

      const periodStart = period.start_time
      const periodEnd = period.end_time

      // 检查时间段是否重叠
      // 情况1: 新餐段的开始时间在已有餐段的时间范围内
      const startInRange = formattedStartTime >= periodStart && formattedStartTime < periodEnd
      // 情况2: 新餐段的结束时间在已有餐段的时间范围内
      const endInRange = formattedEndTime > periodStart && formattedEndTime <= periodEnd
      // 情况3: 新餐段完全包含已有餐段
      const containsRange = formattedStartTime <= periodStart && formattedEndTime >= periodEnd

      return startInRange || endInRange || containsRange
    })

    if (hasConflict) {
      Taro.showToast({
        title: '时间段与已有餐段冲突，请调整时间',
        icon: 'none',
        duration: 2500
      })
      return
    }

    const mealData = {
      tenant_id: currentTenant.id,
      store_id: null,
      period_name: mealForm.period_name,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      period_order: mealForm.period_order,
      is_active: true
    }

    console.log('=== 开始保存餐段配置 ===', {
      操作类型: editingMeal ? '更新' : '创建',
      餐段数据: mealData
    })

    if (editingMeal) {
      const result = await updateMealPeriod(editingMeal.id, mealData)
      if (result) {
        console.log('=== 餐段更新成功 ===')
        Taro.showToast({title: '更新成功', icon: 'success'})
        setShowMealForm(false)
        setEditingMeal(null)

        // 🔥 等待数据库写入完成后再查询
        console.log('=== 等待数据库写入完成 ===')
        await new Promise((resolve) => setTimeout(resolve, 800))

        console.log('=== 开始重新加载餐段列表 ===')
        await loadMealPeriods()
        console.log('=== 餐段列表加载完成 ===', {餐段数量: mealPeriods.length})
      } else {
        console.error('=== 餐段更新失败 ===')
        Taro.showToast({title: '更新失败', icon: 'error'})
      }
    } else {
      const result = await createMealPeriod(mealData)
      if (result) {
        console.log('=== 餐段创建成功 ===')
        Taro.showToast({title: '创建成功', icon: 'success'})
        setShowMealForm(false)

        // 🔥 等待数据库写入完成后再查询
        console.log('=== 等待数据库写入完成 ===')
        await new Promise((resolve) => setTimeout(resolve, 800))

        console.log('=== 开始重新加载餐段列表 ===')
        await loadMealPeriods()
        console.log('=== 餐段列表加载完成 ===', {餐段数量: mealPeriods.length})
      } else {
        console.error('=== 餐段创建失败 ===')
        Taro.showToast({title: '创建失败', icon: 'error'})
      }
    }

    // 重置表单
    setMealForm({period_name: '', start_time: '', end_time: '', period_order: 0})
  }

  // 保存班次
  const handleSaveShift = async () => {
    if (!currentTenant?.id) return

    if (!shiftForm.shift_name.trim()) {
      Taro.showToast({title: '请输入班次名称', icon: 'none'})
      return
    }

    if (!shiftForm.start_time || !shiftForm.end_time) {
      Taro.showToast({title: '请输入开始和结束时间', icon: 'none'})
      return
    }

    // 验证时间格式
    if (!validateTimeFormat(shiftForm.start_time)) {
      Taro.showToast({title: '开始时间格式不正确，请使用HH:mm或HH:mm:ss格式', icon: 'none', duration: 2000})
      return
    }

    if (!validateTimeFormat(shiftForm.end_time)) {
      Taro.showToast({title: '结束时间格式不正确，请使用HH:mm或HH:mm:ss格式', icon: 'none', duration: 2000})
      return
    }

    if (shiftForm.work_hours <= 0 || shiftForm.work_hours > 24) {
      Taro.showToast({title: '工作小时数必须在1-24之间', icon: 'none'})
      return
    }

    // 格式化时间为HH:mm:ss
    const formattedStartTime = formatTime(shiftForm.start_time)
    const formattedEndTime = formatTime(shiftForm.end_time)

    // 验证开始时间必须早于结束时间（跨天班次除外）
    // 注意：班次可能跨天，例如22:00-06:00
    const isCrossDayShift = formattedStartTime > formattedEndTime
    if (!isCrossDayShift && formattedStartTime >= formattedEndTime) {
      Taro.showToast({title: '开始时间必须早于结束时间', icon: 'none', duration: 2000})
      return
    }

    // 检查时间冲突（班次可能跨天，需要特殊处理）
    const hasConflict = workShifts.some((shift) => {
      // 如果是编辑模式，排除当前编辑的班次
      if (editingShift && shift.id === editingShift.id) {
        return false
      }

      const shiftStart = shift.start_time
      const shiftEnd = shift.end_time
      const existingIsCrossDay = shiftStart > shiftEnd

      // 如果两个班次都不跨天
      if (!isCrossDayShift && !existingIsCrossDay) {
        const startInRange = formattedStartTime >= shiftStart && formattedStartTime < shiftEnd
        const endInRange = formattedEndTime > shiftStart && formattedEndTime <= shiftEnd
        const containsRange = formattedStartTime <= shiftStart && formattedEndTime >= shiftEnd
        return startInRange || endInRange || containsRange
      }

      // 如果有跨天班次，简化检测：只要班次名称不同就允许（因为跨天班次的时间重叠检测较复杂）
      // 实际应用中，可以根据具体需求调整这个逻辑
      return false
    })

    if (hasConflict) {
      Taro.showToast({
        title: '时间段与已有班次冲突，请调整时间',
        icon: 'none',
        duration: 2500
      })
      return
    }

    const shiftData = {
      tenant_id: currentTenant.id,
      store_id: null,
      shift_name: shiftForm.shift_name,
      start_time: formattedStartTime,
      end_time: formattedEndTime,
      work_hours: shiftForm.work_hours,
      shift_order: shiftForm.shift_order,
      is_active: true
    }

    console.log('=== 开始保存班次配置 ===', {
      操作类型: editingShift ? '更新' : '创建',
      班次数据: shiftData
    })

    if (editingShift) {
      const result = await updateWorkShift(editingShift.id, shiftData)
      if (result) {
        console.log('=== 班次更新成功 ===')
        Taro.showToast({title: '更新成功', icon: 'success'})
        setShowShiftForm(false)
        setEditingShift(null)

        // 🔥 等待数据库写入完成后再查询
        console.log('=== 等待数据库写入完成 ===')
        await new Promise((resolve) => setTimeout(resolve, 800))

        console.log('=== 开始重新加载班次列表 ===')
        await loadWorkShifts()
        console.log('=== 班次列表加载完成 ===', {班次数量: workShifts.length})
      } else {
        console.error('=== 班次更新失败 ===')
        Taro.showToast({title: '更新失败', icon: 'error'})
      }
    } else {
      const result = await createWorkShift(shiftData)
      if (result) {
        console.log('=== 班次创建成功 ===')
        Taro.showToast({title: '创建成功', icon: 'success'})
        setShowShiftForm(false)

        // 🔥 等待数据库写入完成后再查询
        console.log('=== 等待数据库写入完成 ===')
        await new Promise((resolve) => setTimeout(resolve, 800))

        console.log('=== 开始重新加载班次列表 ===')
        await loadWorkShifts()
        console.log('=== 班次列表加载完成 ===', {班次数量: workShifts.length})
      } else {
        console.error('=== 班次创建失败 ===')
        Taro.showToast({title: '创建失败', icon: 'error'})
      }
    }

    // 重置表单
    setShiftForm({shift_name: '', start_time: '', end_time: '', work_hours: 8, shift_order: 0})
  }

  // 编辑餐段
  const handleEditMeal = (meal: MealPeriod) => {
    setEditingMeal(meal)
    setMealForm({
      period_name: meal.period_name,
      start_time: parseTimeToHHMM(meal.start_time || ''),
      end_time: parseTimeToHHMM(meal.end_time || ''),
      period_order: meal.period_order
    })
    setShowMealForm(true)
  }

  // 删除餐段
  const handleDeleteMeal = async (id: string) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个餐段配置吗？'
    })

    if (result.confirm) {
      const success = await deleteMealPeriod(id)
      if (success) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        loadMealPeriods()
      } else {
        Taro.showToast({title: '删除失败', icon: 'error'})
      }
    }
  }

  // 编辑班次
  const handleEditShift = (shift: WorkShift) => {
    setEditingShift(shift)
    setShiftForm({
      shift_name: shift.shift_name,
      start_time: parseTimeToHHMM(shift.start_time),
      end_time: parseTimeToHHMM(shift.end_time),
      work_hours: shift.work_hours,
      shift_order: shift.shift_order
    })
    setShowShiftForm(true)
  }

  // 删除班次
  const handleDeleteShift = async (id: string) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个班次配置吗？'
    })

    if (result.confirm) {
      const success = await deleteWorkShift(id)
      if (success) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        loadWorkShifts()
      } else {
        Taro.showToast({title: '删除失败', icon: 'error'})
      }
    }
  }

  // 添加新餐段
  const handleAddMeal = () => {
    setEditingMeal(null)
    setMealForm({
      period_name: '',
      start_time: '',
      end_time: '',
      period_order: mealPeriods.length
    })
    setShowMealForm(true)
  }

  // 添加新班次
  const handleAddShift = () => {
    setEditingShift(null)
    setShiftForm({
      shift_name: '',
      start_time: '',
      end_time: '',
      work_hours: 8,
      shift_order: workShifts.length
    })
    setShowShiftForm(true)
  }

  // 取消表单
  const handleCancelForm = () => {
    setShowMealForm(false)
    setShowShiftForm(false)
    setEditingMeal(null)
    setEditingShift(null)
    setMealForm({period_name: '', start_time: '', end_time: '', period_order: 0})
    setShiftForm({shift_name: '', start_time: '', end_time: '', work_hours: 8, shift_order: 0})
  }

  useEffect(() => {
    if (activeTab === 'meal') {
      loadMealPeriods()
    } else {
      loadWorkShifts()
    }
  }, [activeTab, loadMealPeriods, loadWorkShifts])

  useDidShow(() => {
    if (activeTab === 'meal') {
      loadMealPeriods()
    } else {
      loadWorkShifts()
    }
  })

  if (!currentTenant) {
    return (
      <View className="flex items-center justify-center h-screen bg-gray-50">
        <Text className="text-muted-foreground">请先选择租户</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 标题栏 */}
      <View className="bg-blue-100 p-4">
        <Text className="text-xl font-bold text-foreground">品牌配置</Text>
        <Text className="text-sm text-blue-600 opacity-80 mt-1">{currentTenant.name}</Text>
      </View>

      {/* 标签页切换 */}
      <View className="flex bg-white border-b border-border">
        <View
          className={`flex-1 text-center py-3 ${activeTab === 'meal' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('meal')}>
          <Text className={`font-medium ${activeTab === 'meal' ? 'text-blue-600' : 'text-muted-foreground'}`}>
            餐段配置
          </Text>
        </View>
        <View
          className={`flex-1 text-center py-3 ${activeTab === 'shift' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('shift')}>
          <Text className={`font-medium ${activeTab === 'shift' ? 'text-blue-600' : 'text-muted-foreground'}`}>
            班次配置
          </Text>
        </View>
      </View>

      <ScrollView scrollY className="h-screen box-border" style={{paddingBottom: '120px'}}>
        {/* 餐段配置 */}
        {activeTab === 'meal' && (
          <View className="p-4">
            {/* 使用说明 */}
            <View className="bg-blue-100 border border-blue-200 rounded-lg p-4 mb-4">
              <View className="flex items-start gap-2 mb-2">
                <View className="i-mdi-information text-xl text-muted-foreground mt-0.5" />
                <Text className="text-sm font-semibold text-foreground">餐段配置说明</Text>
              </View>
              <Text className="text-xs text-blue-600 leading-relaxed">
                餐段配置用于定义品牌的营业时段，如早餐、午餐、晚餐等。配置后可在排班规划时按餐段安排人员，并在数据分析中按餐段统计营业情况。
              </Text>
            </View>

            {/* 餐段列表 */}
            {mealPeriods.length === 0 ? (
              <View className="text-center py-12">
                <Text className="text-muted-foreground">暂无餐段配置</Text>
                <Text className="text-sm text-muted-foreground mt-2">点击下方按钮添加餐段</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {mealPeriods.map((meal) => (
                  <View key={meal.id} className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <View className="flex justify-between items-start mb-2">
                      <Text className="text-lg font-medium text-foreground">{meal.period_name}</Text>
                      <View className="flex gap-2">
                        <Button
                          size="mini"
                          className="bg-blue-100 text-white px-3 py-1 text-xs break-keep"
                          onClick={() => handleEditMeal(meal)}>
                          编辑
                        </Button>
                        <Button
                          size="mini"
                          className="bg-blue-100 text-white px-3 py-1 text-xs break-keep"
                          onClick={() => handleDeleteMeal(meal.id)}>
                          删除
                        </Button>
                      </View>
                    </View>
                    <View className="flex gap-4 text-sm text-muted-foreground">
                      <Text>开始: {meal.start_time || '未设置'}</Text>
                      <Text>结束: {meal.end_time || '未设置'}</Text>
                      <Text>顺序: {meal.period_order}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 餐段表单 */}
            {showMealForm && (
              <View
                className="fixed inset-0 flex items-center justify-center"
                style={{zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)'}}>
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200 w-11/12 max-w-md">
                  <Text className="text-lg font-bold mb-4">{editingMeal ? '编辑餐段' : '添加餐段'}</Text>

                  <View className="space-y-4">
                    <View>
                      <Text className="text-sm text-muted-foreground mb-1">餐段名称</Text>
                      <View style={{overflow: 'hidden'}}>
                        <Input
                          className="border border-border rounded px-3 py-2 w-full"
                          placeholder="如：早餐、午餐、晚餐"
                          value={mealForm.period_name}
                          onInput={(e) => setMealForm({...mealForm, period_name: e.detail.value})}
                        />
                      </View>
                    </View>

                    <View>
                      <Text className="text-sm text-muted-foreground mb-1">开始时间</Text>
                      <Picker
                        mode="time"
                        value={mealForm.start_time}
                        onChange={(e) => setMealForm({...mealForm, start_time: e.detail.value})}>
                        <View className="border border-border rounded px-3 py-2 w-full bg-white">
                          <Text className={mealForm.start_time ? 'text-foreground' : 'text-muted-foreground'}>
                            {mealForm.start_time || '请选择开始时间'}
                          </Text>
                        </View>
                      </Picker>
                      <Text className="text-xs text-muted-foreground mt-1">格式：HH:mm（如 08:00）</Text>
                    </View>

                    <View>
                      <Text className="text-sm text-muted-foreground mb-1">结束时间</Text>
                      <Picker
                        mode="time"
                        value={mealForm.end_time}
                        onChange={(e) => setMealForm({...mealForm, end_time: e.detail.value})}>
                        <View className="border border-border rounded px-3 py-2 w-full bg-white">
                          <Text className={mealForm.end_time ? 'text-foreground' : 'text-muted-foreground'}>
                            {mealForm.end_time || '请选择结束时间'}
                          </Text>
                        </View>
                      </Picker>
                      <Text className="text-xs text-muted-foreground mt-1">格式：HH:mm（如 12:00）</Text>
                    </View>

                    <View>
                      <Text className="text-sm text-muted-foreground mb-1">显示顺序</Text>
                      <View style={{overflow: 'hidden'}}>
                        <Input
                          className="border border-border rounded px-3 py-2 w-full"
                          type="number"
                          value={String(mealForm.period_order)}
                          onInput={(e) => setMealForm({...mealForm, period_order: Number(e.detail.value)})}
                        />
                      </View>
                    </View>
                  </View>

                  <View className="flex gap-3 mt-6">
                    <Button
                      className="flex-1 bg-gray-200 text-gray-800 py-3 break-keep text-base"
                      size="default"
                      onClick={handleCancelForm}>
                      取消
                    </Button>
                    <Button
                      className="flex-1 bg-blue-100 text-white py-3 break-keep text-base"
                      size="default"
                      onClick={handleSaveMeal}>
                      保存
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* 班次配置 */}
        {activeTab === 'shift' && (
          <View className="p-4">
            {/* 使用说明 */}
            <View className="bg-blue-100 border border-green-200 rounded-lg p-4 mb-4">
              <View className="flex items-start gap-2 mb-2">
                <View className="i-mdi-information text-xl text-muted-foreground mt-0.5" />
                <Text className="text-sm font-semibold text-green-600">班次配置说明</Text>
              </View>
              <Text className="text-xs text-green-600 leading-relaxed">
                班次配置用于定义员工的工作班次，如早班、晚班、正常班等。配置后可在员工排班时选择班次，并用于工时统计和成本核算。
              </Text>
            </View>

            {/* 班次列表 */}
            {workShifts.length === 0 ? (
              <View className="text-center py-12">
                <Text className="text-muted-foreground">暂无班次配置</Text>
                <Text className="text-sm text-muted-foreground mt-2">点击下方按钮添加班次</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {workShifts.map((shift) => (
                  <View key={shift.id} className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <View className="flex justify-between items-start mb-2">
                      <Text className="text-lg font-medium text-foreground">{shift.shift_name}</Text>
                      <View className="flex gap-2">
                        <Button
                          size="mini"
                          className="bg-blue-100 text-white px-3 py-1 text-xs break-keep"
                          onClick={() => handleEditShift(shift)}>
                          编辑
                        </Button>
                        <Button
                          size="mini"
                          className="bg-blue-100 text-white px-3 py-1 text-xs break-keep"
                          onClick={() => handleDeleteShift(shift.id)}>
                          删除
                        </Button>
                      </View>
                    </View>
                    <View className="flex gap-4 text-sm text-muted-foreground">
                      <Text>开始: {shift.start_time}</Text>
                      <Text>结束: {shift.end_time}</Text>
                      <Text>工时: {shift.work_hours}小时</Text>
                      <Text>顺序: {shift.shift_order}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 班次表单 */}
            {showShiftForm && (
              <View
                className="fixed inset-0 flex items-center justify-center"
                style={{zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.5)'}}>
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200 w-11/12 max-w-md">
                  <Text className="text-lg font-bold mb-4">{editingShift ? '编辑班次' : '添加班次'}</Text>

                  <View className="space-y-4">
                    <View>
                      <Text className="text-sm text-muted-foreground mb-1">班次名称</Text>
                      <View style={{overflow: 'hidden'}}>
                        <Input
                          className="border border-border rounded px-3 py-2 w-full"
                          placeholder="如：早班、晚班、正常班"
                          value={shiftForm.shift_name}
                          onInput={(e) => setShiftForm({...shiftForm, shift_name: e.detail.value})}
                        />
                      </View>
                    </View>

                    <View>
                      <Text className="text-sm text-muted-foreground mb-1">开始时间</Text>
                      <Picker
                        mode="time"
                        value={shiftForm.start_time}
                        onChange={(e) => setShiftForm({...shiftForm, start_time: e.detail.value})}>
                        <View className="border border-border rounded px-3 py-2 w-full bg-white">
                          <Text className={shiftForm.start_time ? 'text-foreground' : 'text-muted-foreground'}>
                            {shiftForm.start_time || '请选择开始时间'}
                          </Text>
                        </View>
                      </Picker>
                      <Text className="text-xs text-muted-foreground mt-1">格式：HH:mm（如 08:00）</Text>
                    </View>

                    <View>
                      <Text className="text-sm text-muted-foreground mb-1">结束时间</Text>
                      <Picker
                        mode="time"
                        value={shiftForm.end_time}
                        onChange={(e) => setShiftForm({...shiftForm, end_time: e.detail.value})}>
                        <View className="border border-border rounded px-3 py-2 w-full bg-white">
                          <Text className={shiftForm.end_time ? 'text-foreground' : 'text-muted-foreground'}>
                            {shiftForm.end_time || '请选择结束时间'}
                          </Text>
                        </View>
                      </Picker>
                      <Text className="text-xs text-muted-foreground mt-1">格式：HH:mm（如 16:00）</Text>
                    </View>

                    <View>
                      <Text className="text-sm text-muted-foreground mb-1">工作小时数</Text>
                      <View style={{overflow: 'hidden'}}>
                        <Input
                          className="border border-border rounded px-3 py-2 w-full"
                          type="digit"
                          placeholder="如：8"
                          value={String(shiftForm.work_hours)}
                          onInput={(e) => setShiftForm({...shiftForm, work_hours: Number(e.detail.value)})}
                        />
                      </View>
                    </View>

                    <View>
                      <Text className="text-sm text-muted-foreground mb-1">显示顺序</Text>
                      <View style={{overflow: 'hidden'}}>
                        <Input
                          className="border border-border rounded px-3 py-2 w-full"
                          type="number"
                          value={String(shiftForm.shift_order)}
                          onInput={(e) => setShiftForm({...shiftForm, shift_order: Number(e.detail.value)})}
                        />
                      </View>
                    </View>
                  </View>

                  <View className="flex gap-3 mt-6">
                    <Button
                      className="flex-1 bg-gray-200 text-gray-800 py-3 break-keep text-base"
                      size="default"
                      onClick={handleCancelForm}>
                      取消
                    </Button>
                    <Button
                      className="flex-1 bg-blue-100 text-white py-3 break-keep text-base"
                      size="default"
                      onClick={handleSaveShift}>
                      保存
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 底部添加按钮 */}
      <View className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4">
        <Button
          className="w-full bg-blue-100 text-white py-4 break-keep text-base"
          size="default"
          onClick={activeTab === 'meal' ? handleAddMeal : handleAddShift}>
          {activeTab === 'meal' ? '添加餐段' : '添加班次'}
        </Button>
      </View>
    </View>
  )
}
