import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import {getCurrentInstance, navigateBack, showToast} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {
  createScheduleLog,
  getEmployeesByTenantId,
  getScheduleLogById,
  getSchedulesByTenantId,
  getStoresByTenantId,
  updateScheduleLog
} from '@/db/api'
import type {Employee, Schedule, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const ScheduleLogForm: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 获取路由参数
  const router = getCurrentInstance().router
  const logId = router?.params?.id || ''
  const isEditMode = !!logId

  // 表单数据
  const [scheduleId, setScheduleId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [storeId, setStoreId] = useState('')
  const [score, setScore] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [completionStatus, setCompletionStatus] = useState('normal')
  const [notes, setNotes] = useState('')

  // 选择器数据
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [scheduleIndex, setScheduleIndex] = useState(0)
  const [employeeIndex, setEmployeeIndex] = useState(0)
  const [storeIndex, setStoreIndex] = useState(0)
  const [statusIndex, setStatusIndex] = useState(2) // 默认"正常"

  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  const statusOptions = [
    {label: '优秀', value: 'excellent'},
    {label: '良好', value: 'good'},
    {label: '正常', value: 'normal'},
    {label: '待改进', value: 'poor'}
  ]

  const loadData = useCallback(async () => {
    if (!currentTenant) return

    setLoading(true)
    try {
      const [schedulesData, employeesData, storesData] = await Promise.all([
        getSchedulesByTenantId(currentTenant.id),
        getEmployeesByTenantId(currentTenant.id),
        getStoresByTenantId(currentTenant.id)
      ])

      setSchedules(schedulesData)
      setEmployees(employeesData)
      setStores(storesData)

      // 如果是编辑模式，加载排班日志数据
      if (isEditMode && logId) {
        const log = await getScheduleLogById(logId)
        if (log) {
          setScheduleId(log.schedule_id)
          setEmployeeId(log.employee_id)
          setStoreId(log.store_id)
          setScore(log.score?.toString() || '')
          setDurationMinutes(log.duration_minutes?.toString() || '')
          setCompletionStatus(log.completion_status || 'normal')
          setNotes(log.notes || '')

          // 设置选择器索引
          const scheduleIdx = schedulesData.findIndex((s) => s.id === log.schedule_id)
          const employeeIdx = employeesData.findIndex((e) => e.id === log.employee_id)
          const storeIdx = storesData.findIndex((s) => s.id === log.store_id)
          const statusIdx = statusOptions.findIndex((s) => s.value === log.completion_status)

          if (scheduleIdx >= 0) setScheduleIndex(scheduleIdx)
          if (employeeIdx >= 0) setEmployeeIndex(employeeIdx)
          if (storeIdx >= 0) setStoreIndex(storeIdx)
          if (statusIdx >= 0) setStatusIndex(statusIdx)
        } else {
          showToast({title: '排班日志不存在', icon: 'none'})
          navigateBack()
        }
      } else {
        // 新建模式，设置默认值
        if (schedulesData.length > 0) setScheduleId(schedulesData[0].id)
        if (employeesData.length > 0) setEmployeeId(employeesData[0].id)
        if (storesData.length > 0) setStoreId(storesData[0].id)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      showToast({title: '加载数据失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, isEditMode, logId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleScheduleChange = useCallback(
    (e: any) => {
      const index = Number(e.detail.value)
      setScheduleIndex(index)
      if (schedules[index]) {
        setScheduleId(schedules[index].id)
      }
    },
    [schedules]
  )

  const handleEmployeeChange = useCallback(
    (e: any) => {
      const index = Number(e.detail.value)
      setEmployeeIndex(index)
      if (employees[index]) {
        setEmployeeId(employees[index].id)
      }
    },
    [employees]
  )

  const handleStoreChange = useCallback(
    (e: any) => {
      const index = Number(e.detail.value)
      setStoreIndex(index)
      if (stores[index]) {
        setStoreId(stores[index].id)
      }
    },
    [stores]
  )

  const handleStatusChange = useCallback((e: any) => {
    const index = Number(e.detail.value)
    setStatusIndex(index)
    setCompletionStatus(statusOptions[index].value)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!currentTenant || !user) {
      showToast({title: '请先登录', icon: 'none'})
      return
    }

    // 验证必填字段
    if (!scheduleId || !employeeId || !storeId) {
      showToast({title: '请填写完整信息', icon: 'none'})
      return
    }

    // 验证评分
    const scoreNum = score ? Number.parseInt(score, 10) : null
    if (scoreNum !== null && (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100)) {
      showToast({title: '评分必须在0-100之间', icon: 'none'})
      return
    }

    // 验证用时
    const durationNum = durationMinutes ? Number.parseInt(durationMinutes, 10) : null
    if (durationNum !== null && (Number.isNaN(durationNum) || durationNum < 0)) {
      showToast({title: '用时必须大于0', icon: 'none'})
      return
    }

    setSubmitting(true)
    try {
      if (isEditMode && logId) {
        // 编辑模式
        await updateScheduleLog(logId, {
          schedule_id: scheduleId,
          employee_id: employeeId,
          store_id: storeId,
          completion_status: completionStatus as 'excellent' | 'good' | 'normal' | 'poor',
          score: scoreNum,
          duration_minutes: durationNum,
          notes: notes.trim() || null
        })
        showToast({title: '更新成功', icon: 'success'})
      } else {
        // 新建模式
        await createScheduleLog({
          tenant_id: currentTenant.id,
          schedule_id: scheduleId,
          employee_id: employeeId,
          store_id: storeId,
          log_date: new Date().toISOString().split('T')[0],
          completion_status: completionStatus as 'excellent' | 'good' | 'normal' | 'poor',
          score: scoreNum,
          duration_minutes: durationNum,
          notes: notes.trim() || null
        })
        showToast({title: '创建成功', icon: 'success'})
      }

      setTimeout(() => {
        navigateBack()
      }, 500)
    } catch (error) {
      console.error('操作失败:', error)
      showToast({title: isEditMode ? '更新失败' : '创建失败', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }, [
    currentTenant,
    user,
    scheduleId,
    employeeId,
    storeId,
    score,
    durationMinutes,
    completionStatus,
    notes,
    isEditMode,
    logId
  ])

  if (!currentTenant) {
    return null
  }

  if (loading) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm space-y-4">
            <View className="mb-2">
              <Text className="text-lg font-bold text-foreground block">
                {isEditMode ? '编辑排班日志' : '创建排班日志'}
              </Text>
              <Text className="text-sm text-muted-foreground block mt-1">记录排班执行情况</Text>
            </View>

            {/* 选择排班 */}
            <View>
              <Text className="text-sm font-medium text-foreground block mb-2">
                <Text className="text-red-500">* </Text>选择排班
              </Text>
              <Picker
                mode="selector"
                range={schedules.map((s) => s.shift_type)}
                value={scheduleIndex}
                onChange={handleScheduleChange}>
                <View className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <Text className="text-foreground">{schedules[scheduleIndex]?.shift_type || '请选择排班'}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
                </View>
              </Picker>
            </View>

            {/* 选择员工 */}
            <View>
              <Text className="text-sm font-medium text-foreground block mb-2">
                <Text className="text-red-500">* </Text>选择员工
              </Text>
              <Picker
                mode="selector"
                range={employees.map((e) => e.name)}
                value={employeeIndex}
                onChange={handleEmployeeChange}>
                <View className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <Text className="text-foreground">{employees[employeeIndex]?.name || '请选择员工'}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
                </View>
              </Picker>
            </View>

            {/* 选择店铺 */}
            <View>
              <Text className="text-sm font-medium text-foreground block mb-2">
                <Text className="text-red-500">* </Text>选择店铺
              </Text>
              <Picker mode="selector" range={stores.map((s) => s.name)} value={storeIndex} onChange={handleStoreChange}>
                <View className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <Text className="text-foreground">{stores[storeIndex]?.name || '请选择店铺'}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
                </View>
              </Picker>
            </View>

            {/* 完成状态 */}
            <View>
              <Text className="text-sm font-medium text-foreground block mb-2">
                <Text className="text-red-500">* </Text>完成状态
              </Text>
              <Picker
                mode="selector"
                range={statusOptions.map((s) => s.label)}
                value={statusIndex}
                onChange={handleStatusChange}>
                <View className="border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <Text className="text-foreground">{statusOptions[statusIndex].label}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
                </View>
              </Picker>
            </View>

            {/* 评分 */}
            <View>
              <Text className="text-sm font-medium text-foreground block mb-2">评分（0-100分）</Text>
              <Input
                type="number"
                value={score}
                onInput={(e) => setScore(e.detail.value)}
                placeholder="请输入评分"
                className="border border-gray-200 rounded-xl px-4 py-3 text-foreground"
              />
            </View>

            {/* 用时 */}
            <View>
              <Text className="text-sm font-medium text-foreground block mb-2">用时（分钟）</Text>
              <Input
                type="number"
                value={durationMinutes}
                onInput={(e) => setDurationMinutes(e.detail.value)}
                placeholder="请输入用时"
                className="border border-gray-200 rounded-xl px-4 py-3 text-foreground"
              />
            </View>

            {/* 备注 */}
            <View>
              <Text className="text-sm font-medium text-foreground block mb-2">备注</Text>
              <Textarea
                value={notes}
                onInput={(e) => setNotes(e.detail.value)}
                placeholder="请输入备注信息"
                className="border border-gray-200 rounded-xl px-4 py-3 text-foreground min-h-24"
                maxlength={500}
              />
            </View>

            {/* 提交按钮 */}
            <View className="flex gap-3 pt-4">
              <Button
                className="flex-1 bg-muted text-foreground rounded-xl"
                onClick={() => navigateBack()}
                disabled={submitting}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white rounded-xl"
                onClick={handleSubmit}
                disabled={submitting}
                loading={submitting}>
                {submitting ? (isEditMode ? '更新中...' : '提交中...') : isEditMode ? '更新' : '提交'}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default ScheduleLogForm
