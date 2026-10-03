/**
 * 我的离职页面 - 员工离职管理
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {
  calculateHandoverCompletionRate,
  calculateProcedureCompletionRate,
  canWithdrawResignationApplication,
  getEmployeeResignationApplication,
  getResignationApplicationDetail,
  withdrawResignationApplication
} from '@/db/api-resignation'
import type {ResignationApplicationDetail} from '@/db/types-resignation'
import {
  HANDOVER_STATUS_COLORS,
  HANDOVER_STATUS_NAMES,
  PROCEDURE_STATUS_COLORS,
  PROCEDURE_STATUS_NAMES,
  RESIGNATION_APPLICATION_STATUS_COLORS,
  RESIGNATION_APPLICATION_STATUS_NAMES,
  RESIGNATION_APPROVAL_STATUS_COLORS,
  RESIGNATION_APPROVAL_STATUS_NAMES,
  RESIGNATION_REASON_NAMES,
  RESIGNATION_TYPE_NAMES
} from '@/db/types-resignation'

export default function MyResignation() {
  const {user} = useAuth({guard: true})
  const [resignationData, setResignationData] = useState<ResignationApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const loadResignationData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 获取员工的离职申请
      const application = await getEmployeeResignationApplication(employee.id)

      if (application) {
        const data = await getResignationApplicationDetail(application.id)
        setResignationData(data)
      } else {
        setResignationData(null)
      }
    } catch (error) {
      console.error('加载离职数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadResignationData()
  })

  // 提交离职申请
  const handleApply = () => {
    Taro.navigateTo({
      url: '/packageH/pages/resignation-apply/index'
    })
  }

  // 撤回离职申请
  const handleWithdraw = async () => {
    if (!resignationData?.application) return

    const result = await Taro.showModal({
      title: '确认撤回',
      content: '确定要撤回离职申请吗？'
    })

    if (result.confirm) {
      const success = await withdrawResignationApplication(resignationData.application.id)
      if (success) {
        Taro.showToast({
          title: '撤回成功',
          icon: 'success'
        })
        loadResignationData()
      } else {
        Taro.showToast({
          title: '撤回失败',
          icon: 'none'
        })
      }
    }
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  // 空状态：没有离职申请
  if (!resignationData || !resignationData.application) {
    return (
      <View className="min-h-screen bg-gray-50">
        <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
          <View className="p-4">
            {/* 页面标题 */}
            <View className="mb-6">
              <Text className="text-2xl font-bold text-foreground">我的离职</Text>
              <Text className="text-sm text-muted-foreground mt-1 block">离职流程管理</Text>
            </View>

            {/* 空状态提示 */}
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-sm text-center">
              <View className="flex items-center justify-center mb-4">
                <View className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                  <View className="i-mdi-exit-to-app text-6xl text-red-600" />
                </View>
              </View>
              <Text className="text-xl font-bold text-foreground mb-2">暂无离职申请</Text>
              <Text className="text-sm text-muted-foreground mb-6">
                您当前还没有提交离职申请。{'\n'}
                如需离职，请点击下方按钮提交申请。
              </Text>
              <Button
                className="w-full bg-red-600 text-white py-4 rounded-lg break-keep text-base"
                size="default"
                onClick={handleApply}>
                <Text className="text-white">提交离职申请</Text>
              </Button>
            </View>

            {/* 离职流程说明 */}
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mt-4 shadow-sm">
              <View className="flex flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">离职流程说明</Text>
                <View className="i-mdi-information text-2xl text-blue-600" />
              </View>
              <View className="space-y-4">
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                    <Text className="text-sm font-bold text-red-600">1</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">提交离职申请</Text>
                    <Text className="text-xs text-muted-foreground mt-1">填写离职原因、期望离职日期等信息</Text>
                  </View>
                </View>
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <Text className="text-sm font-bold text-muted-foreground">2</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">等待审批</Text>
                    <Text className="text-xs text-muted-foreground mt-1">上级领导和HR部门审批</Text>
                  </View>
                </View>
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <Text className="text-sm font-bold text-muted-foreground">3</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">工作交接</Text>
                    <Text className="text-xs text-muted-foreground mt-1">完成工作交接和资料移交</Text>
                  </View>
                </View>
                <View className="flex flex-row items-start">
                  <View className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <Text className="text-sm font-bold text-muted-foreground">4</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">办理手续</Text>
                    <Text className="text-xs text-muted-foreground mt-1">办理离职证明、工资结算等手续</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 注意事项 */}
            <View className="bg-blue-100 rounded-lg p-6 mt-4">
              <View className="flex flex-row items-start">
                <View className="i-mdi-alert text-xl text-muted-foreground mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground mb-2">注意事项</Text>
                  <Text className="text-xs text-muted-foreground">
                    • 请提前30天提交离职申请{'\n'}• 离职前需完成所有工作交接{'\n'}• 请妥善保管离职证明等文件{'\n'}•
                    如有疑问请联系HR部门
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  const {application, approvals, handovers, procedures} = resignationData
  const handoverRate = calculateHandoverCompletionRate(handovers)
  const procedureRate = calculateProcedureCompletionRate(procedures)
  const canWithdraw = canWithdrawResignationApplication(application)

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的离职</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">离职流程管理</Text>
          </View>

          {/* 离职进度卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 mb-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-blue-600/80 text-sm">离职状态</Text>
                <Text className="text-foreground text-2xl font-bold mt-1">
                  {RESIGNATION_APPLICATION_STATUS_NAMES[application.status]}
                </Text>
              </View>
              <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <View className="i-mdi-exit-to-app text-4xl text-blue-600" />
              </View>
            </View>

            <View className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20">
              <View>
                <Text className="text-blue-600/80 text-xs">工作交接</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{handoverRate}%</Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">手续办理</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{procedureRate}%</Text>
              </View>
            </View>
          </View>

          {/* 离职信息卡片 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">离职信息</Text>
              <View
                className={`px-3 py-1 rounded-full ${application.status === 'completed' ? 'bg-gray-50' : application.status === 'approved' ? 'bg-green-100' : application.status === 'rejected' ? 'bg-red-100' : 'bg-orange-100'}`}>
                <Text className={`text-xs font-medium ${RESIGNATION_APPLICATION_STATUS_COLORS[application.status]}`}>
                  {RESIGNATION_APPLICATION_STATUS_NAMES[application.status]}
                </Text>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex flex-row justify-between">
                <Text className="text-sm text-muted-foreground">离职类型</Text>
                <Text className="text-sm font-medium text-foreground">
                  {RESIGNATION_TYPE_NAMES[application.resignation_type]}
                </Text>
              </View>
              <View className="flex flex-row justify-between">
                <Text className="text-sm text-muted-foreground">离职原因</Text>
                <Text className="text-sm font-medium text-foreground">
                  {RESIGNATION_REASON_NAMES[application.resignation_reason]}
                </Text>
              </View>
              <View className="flex flex-row justify-between">
                <Text className="text-sm text-muted-foreground">期望离职日期</Text>
                <Text className="text-sm font-medium text-foreground">
                  {new Date(application.expected_last_day).toLocaleDateString()}
                </Text>
              </View>
              <View className="flex flex-row justify-between">
                <Text className="text-sm text-muted-foreground">提交时间</Text>
                <Text className="text-sm font-medium text-foreground">
                  {new Date(application.submitted_at).toLocaleDateString()}
                </Text>
              </View>
              {application.resignation_reason_detail && (
                <View>
                  <Text className="text-sm text-muted-foreground mb-1">详细原因</Text>
                  <Text className="text-sm text-foreground">{application.resignation_reason_detail}</Text>
                </View>
              )}
            </View>

            {canWithdraw && (
              <Button
                className="w-full bg-muted text-foreground py-3 rounded-lg mt-4 break-keep text-sm"
                size="default"
                onClick={handleWithdraw}>
                <Text className="text-foreground">撤回申请</Text>
              </Button>
            )}
          </View>

          {/* 审批进度 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">审批进度</Text>
              <View className="i-mdi-clipboard-check text-2xl text-blue-600" />
            </View>

            {approvals.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-clipboard-check-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无审批记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {approvals.map((approval, index) => (
                  <View key={approval.id} className="flex flex-row items-start">
                    <View className="flex flex-col items-center mr-3">
                      <View
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          approval.status === 'approved'
                            ? 'bg-green-100'
                            : approval.status === 'rejected'
                              ? 'bg-red-100'
                              : 'bg-orange-100'
                        }`}>
                        <View
                          className={`${
                            approval.status === 'approved'
                              ? 'i-mdi-check'
                              : approval.status === 'rejected'
                                ? 'i-mdi-close'
                                : 'i-mdi-clock-outline'
                          } text-lg ${
                            approval.status === 'approved'
                              ? 'text-muted-foreground'
                              : approval.status === 'rejected'
                                ? 'text-red-600'
                                : 'text-muted-foreground'
                          }`}
                        />
                      </View>
                      {index < approvals.length - 1 && <View className="w-0.5 h-8 bg-gray-200 my-1" />}
                    </View>
                    <View className="flex-1">
                      <View className="flex flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-medium text-foreground">{approval.approver_role}</Text>
                        <View
                          className={`px-2 py-0.5 rounded ${
                            approval.status === 'approved'
                              ? 'bg-green-100'
                              : approval.status === 'rejected'
                                ? 'bg-red-100'
                                : 'bg-orange-100'
                          }`}>
                          <Text className={`text-xs ${RESIGNATION_APPROVAL_STATUS_COLORS[approval.status]}`}>
                            {RESIGNATION_APPROVAL_STATUS_NAMES[approval.status]}
                          </Text>
                        </View>
                      </View>
                      {approval.comments && (
                        <Text className="text-xs text-muted-foreground mt-1">{approval.comments}</Text>
                      )}
                      {approval.approved_at && (
                        <Text className="text-xs text-muted-foreground mt-1">
                          {new Date(approval.approved_at).toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 工作交接 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">工作交接</Text>
              <View className="flex flex-row items-center">
                <Text className="text-sm text-muted-foreground mr-2">完成率</Text>
                <Text className="text-lg font-bold text-blue-600">{handoverRate}%</Text>
              </View>
            </View>

            {handovers.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-swap-horizontal text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无交接任务</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {handovers.map((handover) => (
                  <View key={handover.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground">{handover.handover_item}</Text>
                      <View
                        className={`px-2 py-1 rounded ${
                          handover.status === 'confirmed'
                            ? 'bg-green-100'
                            : handover.status === 'completed'
                              ? 'bg-green-100'
                              : handover.status === 'in_progress'
                                ? 'bg-blue-100'
                                : 'bg-orange-100'
                        }`}>
                        <Text className={`text-xs ${HANDOVER_STATUS_COLORS[handover.status]}`}>
                          {HANDOVER_STATUS_NAMES[handover.status]}
                        </Text>
                      </View>
                    </View>
                    {handover.handover_description && (
                      <Text className="text-xs text-muted-foreground">{handover.handover_description}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 离职手续 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">离职手续</Text>
              <View className="flex flex-row items-center">
                <Text className="text-sm text-muted-foreground mr-2">完成率</Text>
                <Text className="text-lg font-bold text-blue-600">{procedureRate}%</Text>
              </View>
            </View>

            {procedures.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-file-document-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无手续办理</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {procedures.map((procedure) => (
                  <View key={procedure.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground">{procedure.procedure_name}</Text>
                      <View
                        className={`px-2 py-1 rounded ${
                          procedure.status === 'completed'
                            ? 'bg-green-100'
                            : procedure.status === 'in_progress'
                              ? 'bg-blue-100'
                              : 'bg-orange-100'
                        }`}>
                        <Text className={`text-xs ${PROCEDURE_STATUS_COLORS[procedure.status]}`}>
                          {PROCEDURE_STATUS_NAMES[procedure.status]}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted-foreground">负责部门：{procedure.responsible_department}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
