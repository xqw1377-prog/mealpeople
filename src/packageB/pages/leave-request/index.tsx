/**
 * 员工端休假申请页面
 */

import {Button, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {cancelLeaveRequest, checkLeaveConflict, createLeaveRequest, getEmployeeLeaveRequests} from '@/db/api-leave'
import type {Employee} from '@/db/types'
import type {LeaveRequest, LeaveTypeOption} from '@/db/types-leave'
import {useTenantStore} from '@/store/tenant'

// 休假类型选项
const leaveTypeOptions: LeaveTypeOption[] = [
  {value: 'annual_leave', label: '年假', code: 'annual_leave', color: 'blue'},
  {value: 'sick_leave', label: '病假', code: 'sick_leave', color: 'red'},
  {value: 'personal_leave', label: '事假', code: 'personal_leave', color: 'yellow'},
  {value: 'other', label: '其他', code: 'other', color: 'gray'}
]

// 状态颜色映射
const statusColors = {
  pending: 'text-yellow-600 bg-blue-100',
  approved: 'text-muted-foreground bg-blue-100',
  rejected: 'text-red-600 bg-blue-100',
  cancelled: 'text-muted-foreground bg-gray-50'
}

// 状态文本映射
const statusLabels = {
  pending: '待审批',
  approved: '已同意',
  rejected: '已拒绝',
  cancelled: '已取消'
}

const LeaveRequestPage: React.FC = () => {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  // 员工信息
  const [employee, setEmployee] = useState<Employee | null>(null)

  // 休假申请列表
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(false)

  // 新增申请表单
  const [showDialog, setShowDialog] = useState(false)
  const [leaveTypeIndex, setLeaveTypeIndex] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  // 加载员工信息
  const loadEmployee = useCallback(async () => {
    if (!user) return

    try {
      const emp = await getEmployeeByUserId(user.id)
      setEmployee(emp)
    } catch (error) {
      console.error('加载员工信息失败:', error)
    }
  }, [user])

  // 加载休假申请列表
  const loadRequests = useCallback(async () => {
    if (!employee) return

    try {
      setLoading(true)
      const data = await getEmployeeLeaveRequests(employee.id)
      setRequests(data)
    } catch (error) {
      console.error('加载休假申请失败:', error)
      Taro.showToast({title: '加载失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }, [employee])

  useDidShow(() => {
    loadEmployee()
  })

  // 当员工信息加载后，加载休假申请列表
  useCallback(() => {
    if (employee) {
      loadRequests()
    }
  }, [employee, loadRequests])()

  // 打开新增对话框
  const handleOpenDialog = () => {
    setLeaveTypeIndex(0)
    setStartDate('')
    setEndDate('')
    setReason('')
    setShowDialog(true)
  }

  // 选择开始日期
  const handleSelectStartDate = (e: any) => {
    const selectedDate = e.detail.value
    setStartDate(selectedDate)
  }

  // 选择结束日期
  const handleSelectEndDate = (e: any) => {
    const selectedDate = e.detail.value
    setEndDate(selectedDate)
  }

  // 计算休假天数
  const calculateDays = useCallback((): number => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }, [startDate, endDate])

  // 提交申请
  const handleSubmit = async () => {
    if (!employee || !currentTenant || !currentStore) {
      Taro.showToast({title: '信息不完整', icon: 'none'})
      return
    }

    if (!startDate || !endDate) {
      Taro.showToast({title: '请选择日期', icon: 'none'})
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      Taro.showToast({title: '结束日期不能早于开始日期', icon: 'none'})
      return
    }

    const days = calculateDays()
    if (days <= 0) {
      Taro.showToast({title: '休假天数必须大于0', icon: 'none'})
      return
    }

    try {
      setLoading(true)

      // 检查日期冲突
      const hasConflict = await checkLeaveConflict(employee.id, startDate, endDate)
      if (hasConflict) {
        Taro.showToast({title: '该日期范围内已有休假申请', icon: 'none', duration: 2000})
        return
      }

      // 创建申请
      await createLeaveRequest({
        tenant_id: currentTenant.id,
        employee_id: employee.id,
        store_id: employee.store_id || '',
        leave_type: leaveTypeOptions[leaveTypeIndex].value,
        start_date: startDate,
        end_date: endDate,
        days,
        reason: reason.trim() || ''
      })

      Taro.showToast({title: '申请成功', icon: 'success'})
      setShowDialog(false)
      loadRequests()
    } catch (error) {
      console.error('提交申请失败:', error)
      Taro.showToast({title: '提交失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }

  // 取消申请
  const handleCancel = async (request: LeaveRequest) => {
    if (request.status !== 'pending') {
      Taro.showToast({title: '只能取消待审批的申请', icon: 'none'})
      return
    }

    const result = await Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个休假申请吗？'
    })

    if (!result.confirm) return

    try {
      setLoading(true)
      await cancelLeaveRequest(request.id)
      Taro.showToast({title: '取消成功', icon: 'success'})
      loadRequests()
    } catch (error) {
      console.error('取消申请失败:', error)
      Taro.showToast({title: '取消失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-xl font-bold text-foreground block mb-1">我的休假申请</Text>
            <Text className="text-sm text-foreground block">申请休假、查看审批状态</Text>
          </View>

          {/* 新增申请按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-blue-100 text-white py-3 rounded text-base break-keep"
              size="default"
              onClick={handleOpenDialog}>
              ➕ 申请休假
            </Button>
          </View>

          {/* 休假申请列表 */}
          {loading ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
              <View className="i-mdi-loading text-4xl text-yellow-500 animate-spin mx-auto mb-4" />
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : requests.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
              <View className="i-mdi-calendar-remove text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-muted-foreground block mb-2">暂无休假申请</Text>
              <Text className="text-sm text-muted-foreground block">点击上方按钮申请休假</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {requests.map((request) => {
                const leaveType = leaveTypeOptions.find((t) => t.value === request.leave_type)
                return (
                  <View key={request.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                    {/* 头部 */}
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex items-center gap-2">
                        <View className={`px-2 py-1 rounded bg-${leaveType?.color}-50`}>
                          <Text className={`text-xs text-${leaveType?.color}-600`}>{leaveType?.label}</Text>
                        </View>
                        <View className={`px-2 py-1 rounded ${statusColors[request.status]}`}>
                          <Text className="text-xs">{statusLabels[request.status]}</Text>
                        </View>
                      </View>
                      {request.status === 'pending' && (
                        <Button
                          className="bg-blue-100 text-white rounded text-xs break-keep px-2 py-1"
                          size="mini"
                          onClick={() => handleCancel(request)}>
                          取消
                        </Button>
                      )}
                    </View>

                    {/* 日期信息 */}
                    <View className="space-y-2 mb-3">
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-calendar-start text-base text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">开始日期：</Text>
                        <Text className="text-sm font-semibold text-foreground">{request.start_date}</Text>
                      </View>
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-calendar-end text-base text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">结束日期：</Text>
                        <Text className="text-sm font-semibold text-foreground">{request.end_date}</Text>
                      </View>
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-calendar-clock text-base text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">休假天数：</Text>
                        <Text className="text-sm font-semibold text-yellow-600">{request.days} 天</Text>
                      </View>
                    </View>

                    {/* 申请原因 */}
                    {request.reason && (
                      <View className="bg-muted rounded p-2 mb-3">
                        <Text className="text-xs text-muted-foreground mb-1 block">申请原因：</Text>
                        <Text className="text-sm text-foreground">{request.reason}</Text>
                      </View>
                    )}

                    {/* 审批信息 */}
                    {request.status !== 'pending' && request.status !== 'cancelled' && (
                      <View className="bg-blue-100 rounded p-2">
                        <Text className="text-xs text-muted-foreground mb-1 block">审批意见：</Text>
                        <Text className="text-sm text-foreground">{request.approval_comment || '无'}</Text>
                        {request.approved_at && (
                          <Text className="text-xs text-muted-foreground mt-1 block">
                            审批时间：{new Date(request.approved_at).toLocaleString('zh-CN')}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* 申请时间 */}
                    <Text className="text-xs text-muted-foreground mt-2 block">
                      申请时间：{new Date(request.created_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 新增申请对话框 */}
      {showDialog && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDialog(false)}>
          <View
            className="bg-white rounded-lg p-4 border-2 border-gray-200 m-4 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}>
            <Text className="text-lg font-bold text-foreground mb-4">申请休假</Text>

            <View className="space-y-3">
              {/* 休假类型 */}
              <View>
                <Text className="text-sm text-foreground mb-1 block">休假类型</Text>
                <Picker
                  mode="selector"
                  range={leaveTypeOptions.map((t) => t.label)}
                  value={leaveTypeIndex}
                  onChange={(e) => setLeaveTypeIndex(Number(e.detail.value))}>
                  <View className="bg-muted px-3 py-2 rounded border border-gray-200 flex items-center justify-between">
                    <Text className="text-sm text-foreground">{leaveTypeOptions[leaveTypeIndex].label}</Text>
                    <View className="i-mdi-chevron-down text-base text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 开始日期 */}
              <View>
                <Text className="text-sm text-foreground mb-1 block">开始日期</Text>
                <Picker mode="date" value={startDate || ''} onChange={handleSelectStartDate}>
                  <View className="bg-muted px-3 py-2 rounded border border-gray-200 flex items-center justify-between">
                    <Text className="text-sm text-foreground">{startDate || '请选择日期'}</Text>
                    <View className="i-mdi-calendar text-base text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 结束日期 */}
              <View>
                <Text className="text-sm text-foreground mb-1 block">结束日期</Text>
                <Picker mode="date" value={endDate || ''} start={startDate || ''} onChange={handleSelectEndDate}>
                  <View className="bg-muted px-3 py-2 rounded border border-gray-200 flex items-center justify-between">
                    <Text className="text-sm text-foreground">{endDate || '请选择日期'}</Text>
                    <View className="i-mdi-calendar text-base text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 休假天数 */}
              {startDate && endDate && (
                <View className="bg-blue-100 rounded p-2">
                  <Text className="text-sm text-yellow-700">休假天数：{calculateDays()} 天</Text>
                </View>
              )}

              {/* 申请原因 */}
              <View>
                <Text className="text-sm text-foreground mb-1 block">申请原因（可选）</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-muted text-foreground px-3 py-2 rounded border border-gray-200 w-full"
                    placeholder="请输入申请原因"
                    value={reason}
                    onInput={(e) => setReason(e.detail.value)}
                    maxlength={200}
                  />
                </View>
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex gap-2 mt-4">
              <Button
                className="flex-1 bg-gray-200 text-foreground py-2 rounded text-sm break-keep"
                size="default"
                onClick={() => setShowDialog(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-2 rounded text-sm break-keep"
                size="default"
                onClick={handleSubmit}
                disabled={loading}>
                提交
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default LeaveRequestPage
