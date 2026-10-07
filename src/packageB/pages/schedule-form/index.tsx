import {Button, Input, Picker, Text, View} from '@tarojs/components'
import Taro, {getCurrentInstance, navigateBack, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeesByStoreId, getScheduleById, getStoresByTenantId} from '@/db/api'
import type {Employee, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const ScheduleForm: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore) // 🔥 获取全局门店
  const setCurrentStore = useTenantStore((state) => state.setCurrentStore) // 🔥 获取设置门店方法
  const [stores, setStores] = useState<Store[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [storeIndex, setStoreIndex] = useState(0)
  const [employeeIndex, setEmployeeIndex] = useState(0)
  const [shiftTypeIndex, setShiftTypeIndex] = useState(0)
  const [formData, setFormData] = useState({
    schedule_date: '',
    start_time: '',
    end_time: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [scheduleId, setScheduleId] = useState<string>('')

  const shiftTypes = ['早班', '中班', '晚班', '全天']
  const shiftTypeValues = ['morning', 'afternoon', 'evening', 'full_day']

  // 获取URL参数
  const instance = getCurrentInstance()
  const params = instance.router?.params

  console.log('=== 排班表单页面渲染 ===', {
    租户: currentTenant?.name,
    门店: currentStore?.name,
    编辑模式: isEditMode
  })

  const loadSchedule = useCallback(
    async (id: string) => {
      try {
        const schedule = await getScheduleById(id)
        if (schedule) {
          setFormData({
            schedule_date: schedule.schedule_date,
            start_time: schedule.start_time || '',
            end_time: schedule.end_time || '',
            notes: schedule.notes || ''
          })

          // 设置班次类型
          const typeIndex = shiftTypeValues.indexOf(schedule.shift_type)
          if (typeIndex !== -1) {
            setShiftTypeIndex(typeIndex)
          }

          // 加载店铺和员工数据后设置选中项
          const storesData = await getStoresByTenantId(currentTenant?.id)
          setStores(storesData)

          const storeIdx = storesData.findIndex((s) => s.id === schedule.store_id)
          if (storeIdx !== -1) {
            setStoreIndex(storeIdx)

            const employeesData = await getEmployeesByStoreId(schedule.store_id)
            setEmployees(employeesData)

            const empIdx = employeesData.findIndex((e) => e.id === schedule.employee_id)
            if (empIdx !== -1) {
              setEmployeeIndex(empIdx)
            }
          }
        }
      } catch (error) {
        console.error('加载排班信息失败:', error)
        showToast({title: '加载失败', icon: 'none'})
      }
    },
    [currentTenant, shiftTypeValues.indexOf]
  )

  const loadEmployees = useCallback(async (storeId: string) => {
    try {
      const employeesData = await getEmployeesByStoreId(storeId)
      setEmployees(employeesData)
    } catch (error) {
      console.error('加载员工列表失败:', error)
      showToast({title: '加载员工失败', icon: 'none'})
    }
  }, [])

  const loadStores = useCallback(async () => {
    if (!currentTenant) return

    try {
      console.log('=== 加载门店列表 ===')
      const storesData = await getStoresByTenantId(currentTenant.id)
      setStores(storesData)

      // 🔥 如果全局状态有门店，使用全局门店
      if (currentStore && storesData.length > 0) {
        const index = storesData.findIndex((s) => s.id === currentStore.id)
        if (index >= 0) {
          console.log('=== 使用全局门店 ===', currentStore.name)
          setStoreIndex(index)
          loadEmployees(currentStore.id)
        } else {
          // 全局门店不在列表中，使用第一个
          console.log('=== 全局门店不在列表中，使用第一个 ===')
          setStoreIndex(0)
          setCurrentStore(storesData[0])
          loadEmployees(storesData[0].id)
          // 🔥 发送门店切换事件
          Taro.eventCenter.trigger('storeChanged', {
            store: storesData[0],
            timestamp: Date.now()
          })
        }
      } else if (storesData.length > 0) {
        // 没有全局门店，使用第一个并设置为全局门店
        console.log('=== 设置第一个门店为全局门店 ===', storesData[0].name)
        setStoreIndex(0)
        setCurrentStore(storesData[0])
        loadEmployees(storesData[0].id)
        // 🔥 发送门店切换事件，通知其他页面
        Taro.eventCenter.trigger('storeChanged', {
          store: storesData[0],
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('加载店铺列表失败:', error)
      showToast({title: '加载店铺失败', icon: 'none'})
    }
  }, [currentTenant, currentStore, setCurrentStore, loadEmployees])

  useEffect(() => {
    // 检查是否为编辑模式
    if (params?.id) {
      setIsEditMode(true)
      setScheduleId(params.id)
      loadSchedule(params.id)
    } else {
      loadStores()
    }
  }, [params, loadStores, loadSchedule])

  // 🔥 监听门店切换事件
  useEffect(() => {
    const handleStoreChange = (data: unknown) => {
      console.log('=== 排班表单收到门店切换事件 ===', String(data))
      // 重新加载门店列表和员工数据
      loadStores()
    }

    Taro.eventCenter.on('storeChanged', handleStoreChange)

    return () => {
      Taro.eventCenter.off('storeChanged', handleStoreChange)
    }
  }, [loadStores])

  // 🔥 页面显示时刷新数据
  useDidShow(() => {
    console.log('=== 排班表单页面显示 ===')
    if (!isEditMode) {
      loadStores()
    }
  })

  const handleStoreChange = (index: number) => {
    setStoreIndex(index)
    setEmployeeIndex(0)
    if (stores[index]) {
      // 🔥 更新全局门店状态
      setCurrentStore(stores[index])
      loadEmployees(stores[index].id)
    }
  }

  // P2-S1-A cutover：提交走 command RPC（publish/update_schedule），
  // 服务端做权限/关系完整性/冲突校验；不再直写 schedules（DB 已封死直写）
  const handleSubmit = async () => {
    if (!currentTenant || !user) return

    if (!formData.schedule_date) {
      showToast({title: '请选择排班日期', icon: 'none'})
      return
    }
    if (stores.length === 0) {
      showToast({title: '请先添加店铺', icon: 'none'})
      return
    }
    if (employees.length === 0) {
      showToast({title: '该店铺暂无员工', icon: 'none'})
      return
    }
    if (!formData.start_time || !formData.end_time) {
      showToast({title: '请选择起止时间', icon: 'none'})
      return
    }
    if (formData.start_time === formData.end_time) {
      showToast({title: '起止时间不得相等', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const {error} = isEditMode
        ? await supabase.rpc('update_schedule', {
            p_schedule_id: scheduleId,
            p_shift_type: shiftTypeValues[shiftTypeIndex],
            p_start_time: formData.start_time,
            p_end_time: formData.end_time,
            p_notes: formData.notes || null
          })
        : await supabase.rpc('publish_schedule', {
            p_employee_id: employees[employeeIndex].id,
            p_schedule_date: formData.schedule_date,
            p_shift_type: shiftTypeValues[shiftTypeIndex],
            p_start_time: formData.start_time,
            p_end_time: formData.end_time,
            p_notes: formData.notes || null
          })

      if (error) {
        // 服务端权威拒绝（AUTH_DENIED/INVALID/CONFLICT）——透出真实原因
        showToast({
          title: error.message.replace(/^(AUTH_DENIED|INVALID|CONFLICT)[^:]*:\s*/, ''),
          icon: 'none',
          duration: 3000
        })
        return
      }
      showToast({title: isEditMode ? '更新成功，员工已收到通知' : '发布成功，员工已收到通知', icon: 'success'})
      setTimeout(() => navigateBack(), 800)
    } catch (error) {
      console.error('操作失败:', error)
      showToast({title: isEditMode ? '更新失败' : '发布失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  if (!currentTenant) {
    return null
  }

  return (
    <View className="min-h-screen bg-muted p-4">
      <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
        {/* 选择店铺 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">
            选择店铺 <Text className="text-red-500">*</Text>
          </Text>
          {stores.length === 0 ? (
            <View className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
              <Text className="text-muted-foreground">暂无店铺，请先添加店铺</Text>
            </View>
          ) : (
            <Picker
              mode="selector"
              range={stores.map((s) => s.name)}
              value={storeIndex}
              onChange={(e) => handleStoreChange(Number(e.detail.value))}>
              <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
                <Text className="text-foreground">{stores[storeIndex]?.name || '请选择店铺'}</Text>
                <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
              </View>
            </Picker>
          )}
        </View>

        {/* 选择员工 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">
            选择员工 <Text className="text-red-500">*</Text>
          </Text>
          {employees.length === 0 ? (
            <View className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
              <Text className="text-muted-foreground">该店铺暂无员工</Text>
            </View>
          ) : (
            <Picker
              mode="selector"
              range={employees.map((e) => e.name)}
              value={employeeIndex}
              onChange={(e) => setEmployeeIndex(Number(e.detail.value))}>
              <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
                <Text className="text-foreground">{employees[employeeIndex]?.name || '请选择员工'}</Text>
                <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
              </View>
            </Picker>
          )}
        </View>

        {/* 排班日期（编辑模式不可改：update_schedule 语义为内容修改） */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">
            排班日期 <Text className="text-red-500">*</Text>
          </Text>
          <Picker
            mode="date"
            value={formData.schedule_date || undefined}
            disabled={isEditMode}
            onChange={(e) => setFormData({...formData, schedule_date: e.detail.value})}>
            <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
              <Text className={formData.schedule_date ? 'text-foreground' : 'text-muted-foreground'}>
                {formData.schedule_date || '请选择日期'}
              </Text>
              <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
            </View>
          </Picker>
        </View>

        {/* 班次类型 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">
            班次类型 <Text className="text-red-500">*</Text>
          </Text>
          <Picker
            mode="selector"
            range={shiftTypes}
            value={shiftTypeIndex}
            onChange={(e) => setShiftTypeIndex(Number(e.detail.value))}>
            <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
              <Text className="text-foreground">{shiftTypes[shiftTypeIndex]}</Text>
              <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
            </View>
          </Picker>
        </View>

        {/* 开始时间 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">
            开始时间 <Text className="text-red-500">*</Text>
          </Text>
          <Picker
            mode="time"
            value={formData.start_time || undefined}
            onChange={(e) => setFormData({...formData, start_time: e.detail.value})}>
            <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
              <Text className={formData.start_time ? 'text-foreground' : 'text-muted-foreground'}>
                {formData.start_time || '请选择开始时间'}
              </Text>
              <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
            </View>
          </Picker>
        </View>

        {/* 结束时间 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">
            结束时间 <Text className="text-red-500">*</Text>
          </Text>
          <Picker
            mode="time"
            value={formData.end_time || undefined}
            onChange={(e) => setFormData({...formData, end_time: e.detail.value})}>
            <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
              <Text className={formData.end_time ? 'text-foreground' : 'text-muted-foreground'}>
                {formData.end_time || '请选择结束时间（晚于开始则跨天班）'}
              </Text>
              <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
            </View>
          </Picker>
        </View>

        {/* 备注 */}
        <View className="mb-6">
          <Text className="text-sm text-foreground block mb-2">备注</Text>
          <Input
            className="w-full px-4 py-3 border border-gray-200 rounded-xl"
            placeholder="请输入备注信息"
            value={formData.notes}
            onInput={(e) => setFormData({...formData, notes: e.detail.value})}
          />
        </View>

        {/* 提交按钮 */}
        <View className="flex gap-3">
          <Button
            className="flex-1 bg-muted text-foreground rounded-xl text-sm break-keep"
            size="default"
            onClick={() => navigateBack()}>
            取消
          </Button>
          <Button
            className="flex-1 bg-blue-100 text-white rounded-xl text-sm break-keep"
            size="default"
            loading={loading}
            disabled={loading || stores.length === 0 || employees.length === 0}
            onClick={handleSubmit}>
            {loading ? '提交中...' : isEditMode ? '确认更新' : '确认创建'}
          </Button>
        </View>
      </View>
    </View>
  )
}

export default ScheduleForm
