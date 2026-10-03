/**
 * 试用期管理页面（HR端）
 *
 * 功能：
 * - 查看所有试用期记录
 * - 监控试用期进度
 * - 新增试用期记录
 * - 完成试用期评估
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  createProbationPeriod,
  getTenantProbationPeriods,
  type ProbationPeriod,
  updateProbationPeriod
} from '@/db/api-interview-flow'
import {useTenantStore} from '@/store/tenant'

const ProbationManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [periods, setPeriods] = useState<ProbationPeriod[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [selectedPeriod, setSelectedPeriod] = useState<ProbationPeriod | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // 新增试用期表单
  const [addForm, setAddForm] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    evaluated_by: '',
    notes: ''
  })

  // 加载试用期记录
  const loadPeriods = useCallback(async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const allPeriods = await getTenantProbationPeriods(currentTenant.id)
      setPeriods(allPeriods)
    } catch (error) {
      console.error('加载试用期记录失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadPeriods()
  })

  // 打开详情
  const handleOpenDetail = (period: ProbationPeriod) => {
    setSelectedPeriod(period)
    setShowDetailModal(true)
  }

  // 打开新增弹窗
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0]
    // 默认试用期3个月
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 3)
    const endDateStr = endDate.toISOString().split('T')[0]

    setAddForm({
      employee_id: '',
      start_date: today,
      end_date: endDateStr,
      evaluated_by: '',
      notes: ''
    })
    setShowAddModal(true)
  }

  // 提交新增试用期
  const handleSubmitAdd = async () => {
    if (!currentTenant) return

    // 验证必填项
    if (!addForm.employee_id || !addForm.start_date || !addForm.end_date) {
      Taro.showToast({
        title: '请填写所有必填项',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 计算试用期月数
    const start = new Date(addForm.start_date)
    const end = new Date(addForm.end_date)
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))

    try {
      Taro.showLoading({title: '创建中...'})

      const result = await createProbationPeriod({
        tenant_id: currentTenant.id,
        employee_id: addForm.employee_id,
        start_date: addForm.start_date,
        end_date: addForm.end_date,
        duration_months: months,
        status: 'active',
        evaluation_score: null,
        evaluation_comments: null,
        evaluated_by: addForm.evaluated_by || null,
        evaluated_at: null,
        final_decision: null,
        decision_date: null,
        notes: addForm.notes || null
      })

      Taro.hideLoading()

      if (result) {
        Taro.showToast({
          title: '创建成功！',
          icon: 'success',
          duration: 2000
        })

        setShowAddModal(false)
        loadPeriods()
      } else {
        Taro.showToast({
          title: '创建失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('创建试用期失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 完成试用期
  const handleCompleteProbation = async (periodId: string) => {
    try {
      const result = await Taro.showModal({
        title: '确认完成',
        content: '确定该试用期已完成吗？',
        confirmText: '确定',
        cancelText: '取消'
      })

      if (!result.confirm) return

      Taro.showLoading({title: '处理中...'})

      const success = await updateProbationPeriod(periodId, {
        status: 'passed',
        evaluated_at: new Date().toISOString().split('T')[0],
        final_decision: 'convert',
        decision_date: new Date().toISOString().split('T')[0]
      })

      Taro.hideLoading()

      if (success) {
        Taro.showToast({
          title: '试用期已完成！',
          icon: 'success',
          duration: 2000
        })

        setShowDetailModal(false)
        loadPeriods()
      } else {
        Taro.showToast({
          title: '操作失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('完成试用期失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 计算试用期剩余天数
  const calculateRemainingDays = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // 获取状态信息
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {label: '进行中', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
      case 'passed':
        return {label: '已通过', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
      case 'failed':
        return {label: '未通过', color: 'text-red-600', bgColor: 'bg-blue-100'}
      case 'extended':
        return {label: '已延期', color: 'text-white', bgColor: 'bg-blue-100'}
      default:
        return {label: '未知', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
    }
  }

  // 获取剩余天数颜色
  const getRemainingDaysColor = (days: number) => {
    if (days < 0) return 'text-red-600'
    if (days <= 7) return 'text-muted-foreground'
    if (days <= 30) return 'text-muted-foreground'
    return 'text-muted-foreground'
  }

  // 计算统计数据
  const stats = {
    total: periods.length,
    active: periods.filter((p) => p.status === 'active').length,
    passed: periods.filter((p) => p.status === 'passed').length,
    expiring: periods.filter((p) => {
      if (p.status !== 'active') return false
      const remaining = calculateRemainingDays(p.end_date)
      return remaining <= 7 && remaining >= 0
    }).length
  }

  // 筛选显示的记录
  const filteredPeriods = periods.filter((period) => {
    if (activeTab === 'active') return period.status === 'active'
    if (activeTab === 'completed') return period.status === 'passed' || period.status === 'failed'
    return true
  })

  // 如果没有选择租户
  if (!currentTenant) {
    return (
      <View className="@container min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border bg-transparent">
          <View className="p-4 max-sm:p-3">
            <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 text-center">
              <View className="i-mdi-alert-circle text-6xl text-orange-500 mx-auto mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                未选择租户
              </Text>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                您需要先选择一个租户才能访问试用期管理功能
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 max-sm:p-3 space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
          {/* 顶部标题卡片 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="flex flex-row items-center flex-1">
                <View className="i-mdi-account-clock text-4xl max-sm:text-3xl text-muted-foreground mr-3 max-sm:mr-2" />
                <View className="flex-1">
                  <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">
                    试用期管理
                  </Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                    监控员工试用期进度和评估
                  </Text>
                </View>
              </View>
              <Button
                className="bg-green-500 text-white active:opacity-80 transition-all px-4 max-sm:px-3 max-sm:px-2 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                size="default"
                onClick={handleOpenAdd}>
                <View className="flex flex-row items-center gap-1">
                  <View className="i-mdi-plus text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px]" />
                  <Text className="text-white">新增</Text>
                </View>
              </Button>
            </View>

            {/* 统计信息 */}
            <View className="grid grid-cols-2 gap-3 max-sm:gap-2 max-sm:gap-1.5">
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">全部试用期</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600 mt-1">
                  {stats.total}
                </Text>
              </View>
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">进行中</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.active}
                </Text>
              </View>
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">已通过</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.passed}
                </Text>
              </View>
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">即将到期</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-red-600 mt-1">
                  {stats.expiring}
                </Text>
              </View>
            </View>
          </View>

          {/* 标签切换 */}
          <View className="flex flex-row gap-2 max-sm:gap-1.5">
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all ${
                activeTab === 'active'
                  ? 'bg-blue-100 text-white'
                  : 'bg-white text-muted-foreground border border-border'
              }`}
              size="default"
              onClick={() => setActiveTab('active')}>
              进行中
            </Button>
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all ${
                activeTab === 'completed'
                  ? 'bg-blue-100 text-white'
                  : 'bg-white text-muted-foreground border border-border'
              }`}
              size="default"
              onClick={() => setActiveTab('completed')}>
              已完成
            </Button>
          </View>

          {/* 试用期列表 */}
          <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
            {loading ? (
              <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200 text-center">
                <Text className="text-muted-foreground">加载中...</Text>
              </View>
            ) : filteredPeriods.length === 0 ? (
              <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200 text-center">
                <View className="i-mdi-inbox text-6xl text-muted-foreground mx-auto mb-3 max-sm:mb-2 max-sm:mb-1.5" />
                <Text className="text-muted-foreground">暂无试用期记录</Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {filteredPeriods.map((period) => {
                  const statusInfo = getStatusInfo(period.status)
                  const remainingDays = calculateRemainingDays(period.end_date)

                  return (
                    <View
                      key={period.id}
                      className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 hover:shadow-lg transition-all">
                      {/* 员工信息 */}
                      <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex-1">
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                            员工ID: {period.employee_id.substring(0, 8)}
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                            {formatDate(period.start_date)} - {formatDate(period.end_date)}
                          </Text>
                        </View>
                        <View className={`${statusInfo.bgColor} px-3 max-sm:px-2 py-1 rounded-full`}>
                          <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </Text>
                        </View>
                      </View>

                      {/* 进度信息 */}
                      {period.status === 'active' && (
                        <View className="mb-3 max-sm:mb-2 max-sm:mb-1.5">
                          <View className="flex flex-row items-center justify-between mb-1">
                            <Text className="text-xs max-sm:text-[10px] text-muted-foreground">剩余天数</Text>
                            <Text
                              className={`text-sm max-sm:text-xs max-sm:text-[10px] font-bold ${getRemainingDaysColor(remainingDays)}`}>
                              {remainingDays > 0 ? `${remainingDays}天` : remainingDays === 0 ? '今天到期' : '已过期'}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* 操作按钮 */}
                      <View className="flex flex-row gap-2 max-sm:gap-1.5">
                        <Button
                          className="flex-1 bg-blue-100 text-white py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                          size="default"
                          onClick={() => handleOpenDetail(period)}>
                          查看详情
                        </Button>
                        {period.status === 'active' && (
                          <Button
                            className="flex-1 bg-green-600 text-blue-600 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                            size="default"
                            onClick={() => handleCompleteProbation(period.id)}>
                            完成试用期
                          </Button>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 详情弹窗 */}
      {showDetailModal && selectedPeriod && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 max-sm:p-3">
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              试用期详情
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 基本信息 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  基本信息
                </Text>
                <View className="space-y-2 max-sm:space-y-1.5">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">员工ID</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {selectedPeriod.employee_id.substring(0, 8)}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">开始日期</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {formatDate(selectedPeriod.start_date)}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">结束日期</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {formatDate(selectedPeriod.end_date)}
                    </Text>
                  </View>
                  {selectedPeriod.evaluated_by && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">评估人ID</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        {selectedPeriod.evaluated_by.substring(0, 8)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 评估信息 */}
              {selectedPeriod.evaluation_score && (
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                    评估信息
                  </Text>
                  <View className="space-y-2 max-sm:space-y-1.5">
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">评估分数</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                        {selectedPeriod.evaluation_score}分
                      </Text>
                    </View>
                    {selectedPeriod.evaluated_at && (
                      <View className="flex flex-row justify-between">
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                          评估日期
                        </Text>
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                          {formatDate(selectedPeriod.evaluated_at)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* 状态信息 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  状态信息
                </Text>
                <View className="space-y-2 max-sm:space-y-1.5">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">当前状态</Text>
                    <Text
                      className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium ${getStatusInfo(selectedPeriod.status).color}`}>
                      {getStatusInfo(selectedPeriod.status).label}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 备注 */}
              {selectedPeriod.notes && (
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                    备注
                  </Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                    {selectedPeriod.notes}
                  </Text>
                </View>
              )}
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
              {selectedPeriod.status === 'active' && (
                <Button
                  className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                  size="default"
                  onClick={() => handleCompleteProbation(selectedPeriod.id)}>
                  完成试用期
                </Button>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 新增试用期弹窗 */}
      {showAddModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 max-sm:p-3">
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 w-full max-w-md">
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              新增试用期记录
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 员工ID */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  员工ID <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入员工ID"
                    value={addForm.employee_id}
                    onInput={(e) => setAddForm({...addForm, employee_id: e.detail.value})}
                  />
                </View>
              </View>

              {/* 开始日期 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  开始日期 <Text className="text-red-500">*</Text>
                </Text>
                <Picker
                  mode="date"
                  value={addForm.start_date}
                  onChange={(e) => setAddForm({...addForm, start_date: e.detail.value})}>
                  <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                    <Text className="text-foreground">{addForm.start_date || '请选择开始日期'}</Text>
                  </View>
                </Picker>
              </View>

              {/* 结束日期 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  结束日期 <Text className="text-red-500">*</Text>
                </Text>
                <Picker
                  mode="date"
                  value={addForm.end_date}
                  onChange={(e) => setAddForm({...addForm, end_date: e.detail.value})}>
                  <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                    <Text className="text-foreground">{addForm.end_date || '请选择结束日期'}</Text>
                  </View>
                </Picker>
              </View>

              {/* 评估人ID */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  评估人ID
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入评估人ID（选填）"
                    value={addForm.evaluated_by}
                    onInput={(e) => setAddForm({...addForm, evaluated_by: e.detail.value})}
                  />
                </View>
              </View>

              {/* 备注 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  备注
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入备注信息"
                    value={addForm.notes}
                    onInput={(e) => setAddForm({...addForm, notes: e.detail.value})}
                    maxlength={200}
                  />
                </View>
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={handleSubmitAdd}>
                确定
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default ProbationManagement
