/**
 * 换班申请页面
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api-employees'
import {getEmployeeWeekShifts} from '@/db/api-shifts'
import {createSwapRequest} from '@/db/api-swap'

interface ShiftOption {
  id: string
  date: string
  dayOfWeek: string
  shiftName: string
  startTime: string
  endTime: string
}

const ShiftSwap: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 我的班次列表
  const [myShifts, setMyShifts] = useState<ShiftOption[]>([])
  const [selectedMyShift, setSelectedMyShift] = useState<string>('')

  // 目标班次（暂时使用模拟数据，后续需要从其他员工的班次中选择）
  const [targetShifts] = useState<ShiftOption[]>([
    {
      id: 'target-1',
      date: '2025-11-07',
      dayOfWeek: '周二',
      shiftName: '早班',
      startTime: '08:00',
      endTime: '16:00'
    },
    {
      id: 'target-2',
      date: '2025-11-08',
      dayOfWeek: '周三',
      shiftName: '晚班',
      startTime: '16:00',
      endTime: '24:00'
    }
  ])
  const [selectedTargetShift, setSelectedTargetShift] = useState<string>('')

  // 换班原因
  const [reason, setReason] = useState('')

  // 加载我的班次
  const loadMyShifts = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        Taro.showToast({title: '未找到员工信息', icon: 'error'})
        return
      }

      const shifts = await getEmployeeWeekShifts(employee.id)

      // 只显示未来的班次，且不是休息日
      const today = new Date().toISOString().split('T')[0]
      const futureShifts = shifts.filter(
        (shift) => shift.shift_date >= today && shift.shift_type !== 'rest' && shift.status !== 'completed'
      )

      const shiftOptions: ShiftOption[] = futureShifts.map((shift) => {
        const date = new Date(shift.shift_date)
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        const dayOfWeek = weekDays[date.getDay()]

        const shiftNames: Record<string, string> = {
          morning: '早班',
          afternoon: '中班',
          evening: '晚班',
          night: '夜班'
        }

        return {
          id: shift.id,
          date: shift.shift_date,
          dayOfWeek,
          shiftName: shiftNames[shift.shift_type] || '未知',
          startTime: shift.start_time?.substring(0, 5) || '',
          endTime: shift.end_time?.substring(0, 5) || ''
        }
      })

      setMyShifts(shiftOptions)
    } catch (error) {
      console.error('加载班次失败:', error)
      Taro.showToast({title: '加载失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadMyShifts()
  })

  // 提交换班申请
  const handleSubmit = async () => {
    if (!selectedMyShift) {
      Taro.showToast({title: '请选择要换的班次', icon: 'none'})
      return
    }

    if (!selectedTargetShift) {
      Taro.showToast({title: '请选择目标班次', icon: 'none'})
      return
    }

    if (!reason.trim()) {
      Taro.showToast({title: '请填写换班原因', icon: 'none'})
      return
    }

    if (!user?.id) return

    try {
      setSubmitting(true)

      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        Taro.showToast({title: '未找到员工信息', icon: 'error'})
        return
      }

      // TODO: 获取目标员工ID（暂时使用模拟数据）
      const targetEmployeeId = 'mock-target-employee-id'

      const result = await createSwapRequest({
        tenant_id: employee.tenant_id,
        requester_id: employee.id,
        target_id: targetEmployeeId,
        requester_shift_id: selectedMyShift,
        target_shift_id: selectedTargetShift,
        reason: reason.trim()
      })

      if (result) {
        Taro.showToast({title: '申请提交成功', icon: 'success'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({title: '申请提交失败', icon: 'error'})
      }
    } catch (error) {
      console.error('提交换班申请失败:', error)
      Taro.showToast({title: '提交失败', icon: 'error'})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {loading ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-sm">
              <Text className="text-center text-muted-foreground">加载中...</Text>
            </View>
          ) : (
            <>
              {/* 选择我的班次 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex flex-row items-center mb-4">
                  <View className="i-mdi-calendar-clock text-2xl text-blue-600 mr-2" />
                  <Text className="text-lg font-semibold text-foreground">选择要换的班次</Text>
                </View>

                {myShifts.length === 0 ? (
                  <View className="text-center py-8">
                    <View className="i-mdi-calendar-blank text-5xl text-muted-foreground mb-2" />
                    <Text className="text-muted-foreground">暂无可换班次</Text>
                  </View>
                ) : (
                  <View className="space-y-2">
                    {myShifts.map((shift) => (
                      <View
                        key={shift.id}
                        className={`rounded-xl p-4 border-2 ${
                          selectedMyShift === shift.id ? 'border-primary bg-blue-100' : 'border-border bg-gray-50/30'
                        }`}
                        onClick={() => setSelectedMyShift(shift.id)}>
                        <View className="flex flex-row items-center justify-between">
                          <View>
                            <Text className="text-sm font-bold text-foreground">
                              {shift.dayOfWeek} {shift.date}
                            </Text>
                            <Text className="text-xs text-muted-foreground mt-1">
                              {shift.shiftName} {shift.startTime} - {shift.endTime}
                            </Text>
                          </View>
                          {selectedMyShift === shift.id && (
                            <View className="i-mdi-check-circle text-2xl text-blue-600" />
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* 选择目标班次 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex flex-row items-center mb-4">
                  <View className="i-mdi-account-switch text-2xl text-accent mr-2" />
                  <Text className="text-lg font-semibold text-foreground">选择目标班次</Text>
                </View>

                <View className="space-y-2">
                  {targetShifts.map((shift) => (
                    <View
                      key={shift.id}
                      className={`rounded-xl p-4 border-2 ${
                        selectedTargetShift === shift.id ? 'border-accent bg-blue-100' : 'border-border bg-gray-50/30'
                      }`}
                      onClick={() => setSelectedTargetShift(shift.id)}>
                      <View className="flex flex-row items-center justify-between">
                        <View>
                          <Text className="text-sm font-bold text-foreground">
                            {shift.dayOfWeek} {shift.date}
                          </Text>
                          <Text className="text-xs text-muted-foreground mt-1">
                            {shift.shiftName} {shift.startTime} - {shift.endTime}
                          </Text>
                        </View>
                        {selectedTargetShift === shift.id && (
                          <View className="i-mdi-check-circle text-2xl text-accent" />
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                <View className="mt-4 p-3 bg-blue-100 rounded-xl">
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-information text-xl text-muted-foreground mr-2 mt-0.5" />
                    <Text className="text-xs text-muted-foreground flex-1">
                      目前显示的是示例班次，实际使用时将显示其他员工的可换班次
                    </Text>
                  </View>
                </View>
              </View>

              {/* 换班原因 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex flex-row items-center mb-4">
                  <View className="i-mdi-text-box text-2xl text-muted-foreground mr-2" />
                  <Text className="text-lg font-semibold text-foreground">换班原因</Text>
                </View>

                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-50/30 text-foreground px-3 py-2 rounded-xl border border-border w-full"
                    placeholder="请详细说明换班原因，以便审批..."
                    value={reason}
                    onInput={(e) => setReason(e.detail.value)}
                    maxlength={200}
                    style={{minHeight: '120px'}}
                  />
                </View>

                <View className="mt-2 flex flex-row justify-end">
                  <Text className="text-xs text-muted-foreground">{reason.length}/200</Text>
                </View>
              </View>

              {/* 提交按钮 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <Button
                  className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
                  size="default"
                  disabled={submitting || !selectedMyShift || !selectedTargetShift || !reason.trim()}
                  onClick={handleSubmit}>
                  {submitting ? '提交中...' : '提交换班申请'}
                </Button>

                <View className="mt-4 p-3 bg-blue-100 rounded-xl">
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-alert-circle text-xl text-muted-foreground mr-2 mt-0.5" />
                    <Text className="text-xs text-muted-foreground flex-1">
                      提交后需要等待管理员审批，审批通过后班次将自动交换
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default ShiftSwap
