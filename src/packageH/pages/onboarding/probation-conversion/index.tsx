/**
 * 试用期转正管理页面（HR端）
 *
 * 功能：
 * - 查看试用期员工列表
 * - 评估试用期表现
 * - 一键转正（生成合同+办理社保）
 * - 延长试用期或终止试用
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {convertProbationToRegular} from '@/db/api-employment'
import {getTenantProbationPeriods, type ProbationPeriod} from '@/db/api-interview-flow'
import {useTenantStore} from '@/store/tenant'

const ProbationConversion: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [probationList, setProbationList] = useState<ProbationPeriod[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProbation, setSelectedProbation] = useState<ProbationPeriod | null>(null)
  const [showConversionModal, setShowConversionModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')

  // 转正表单
  const [conversionForm, setConversionForm] = useState({
    position: '',
    department: '',
    salary: '',
    work_location: '',
    contract_type: 'fixed_term' as 'fixed_term' | 'indefinite' | 'project_based',
    duration_years: '3'
  })

  // 加载试用期列表
  const loadProbationList = useCallback(async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const data = await getTenantProbationPeriods(currentTenant.id)
      // 加载所有试用期记录（包括已完成的）
      setProbationList(data)
    } catch (error) {
      console.error('加载试用期列表失败:', error)
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
    loadProbationList()
  })

  // 打开转正弹窗
  const handleOpenConversion = (probation: ProbationPeriod) => {
    setSelectedProbation(probation)
    setShowConversionModal(true)
  }

  // 提交转正
  const handleSubmitConversion = async () => {
    if (!selectedProbation || !currentTenant) return

    // 验证必填项
    if (!conversionForm.position || !conversionForm.salary) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none',
        duration: 2000
      })
      return
    }

    const salary = parseFloat(conversionForm.salary)
    if (Number.isNaN(salary) || salary <= 0) {
      Taro.showToast({
        title: '请输入有效的薪资',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      Taro.showLoading({title: '处理中...'})

      const result = await convertProbationToRegular(
        currentTenant.id,
        selectedProbation.employee_id,
        selectedProbation.id,
        {
          position: conversionForm.position,
          department: conversionForm.department,
          salary: salary,
          work_location: conversionForm.work_location,
          contract_type: conversionForm.contract_type,
          duration_years:
            conversionForm.contract_type === 'fixed_term' ? parseFloat(conversionForm.duration_years) : undefined
        },
        currentTenant.id // TODO: 使用实际的审批人ID
      )

      Taro.hideLoading()

      if (result.success) {
        Taro.showToast({
          title: '转正成功！',
          icon: 'success',
          duration: 2000
        })

        setShowConversionModal(false)
        setSelectedProbation(null)
        loadProbationList()
      } else {
        Taro.showToast({
          title: '转正失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('转正失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 计算剩余天数
  const calculateRemainingDays = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // 计算统计数据
  const stats = {
    total: probationList.length,
    pending: probationList.filter((p) => p.status === 'active').length,
    completed: probationList.filter((p) => p.status === 'passed' || p.status === 'failed').length,
    expiringSoon: probationList.filter((p) => {
      if (p.status !== 'active') return false
      const remaining = calculateRemainingDays(p.end_date)
      return remaining <= 7 && remaining >= 0
    }).length
  }

  // 获取显示的列表
  const displayList =
    activeTab === 'pending'
      ? probationList.filter((p) => p.status === 'active')
      : probationList.filter((p) => p.status === 'passed' || p.status === 'failed')

  // 租户检查
  if (!currentTenant) {
    return (
      <View className="@container min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border bg-transparent">
          <View className="p-4 max-sm:p-3">
            <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200">
              <View className="flex flex-col items-center justify-center py-12 max-sm:py-8 max-sm:py-6">
                <View className="i-mdi-alert-circle text-6xl text-muted-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
                <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
                  请先选择租户
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-6 text-center">
                  您需要先选择一个租户才能访问试用期转正功能
                </Text>
                <Button
                  size="default"
                  className="bg-blue-100 text-white px-6 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                  onClick={() => {
                    Taro.navigateTo({url: '/pages/tenant-select/index'})
                  }}>
                  选择租户
                </Button>
              </View>
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
            <View className="flex flex-row items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="i-mdi-account-convert text-4xl max-sm:text-3xl text-blue-600 mr-3 max-sm:mr-2" />
              <View className="flex-1">
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                  试用期转正管理
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                  一键转正，自动生成合同和社保
                </Text>
              </View>
            </View>

            {/* 统计信息 */}
            <View className="grid grid-cols-2 gap-3 max-sm:gap-2 max-sm:gap-1.5">
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">试用期总数</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.total}
                </Text>
              </View>
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">待转正</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.pending}
                </Text>
              </View>
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">已转正</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.completed}
                </Text>
              </View>
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">即将到期</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-red-600 mt-1">
                  {stats.expiringSoon}
                </Text>
              </View>
            </View>
          </View>

          {/* Tab切换 */}
          <View className="bg-white rounded-lg p-2 border-2 border-gray-200">
            <View className="flex flex-row gap-2 max-sm:gap-1.5">
              <View
                className={`flex-1 text-center py-3 max-sm:py-2 rounded-lg ${activeTab === 'pending' ? 'bg-green-500' : 'bg-transparent'}`}
                onClick={() => setActiveTab('pending')}>
                <Text
                  className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium ${activeTab === 'pending' ? 'text-white' : 'text-muted-foreground'}`}>
                  待转正 ({stats.pending})
                </Text>
              </View>
              <View
                className={`flex-1 text-center py-3 max-sm:py-2 rounded-lg ${activeTab === 'completed' ? 'bg-blue-100' : 'bg-transparent'}`}
                onClick={() => setActiveTab('completed')}>
                <Text
                  className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium ${activeTab === 'completed' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  已转正 ({stats.completed})
                </Text>
              </View>
            </View>
          </View>

          {/* 试用期员工列表 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              {activeTab === 'pending' ? '待转正员工' : '已转正员工'}
            </Text>

            {loading ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-loading text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
              </View>
            ) : displayList.length === 0 ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-account-clock text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                  {activeTab === 'pending' ? '暂无待转正员工' : '暂无已转正记录'}
                </Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {displayList.map((probation) => {
                  const remainingDays = calculateRemainingDays(probation.end_date)
                  const isExpiringSoon = remainingDays <= 7 && remainingDays >= 0
                  const isPending = probation.status === 'active'

                  return (
                    <View key={probation.id} className="border border-border rounded-xl p-4 max-sm:p-3">
                      {/* 员工信息 */}
                      <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex-1">
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                            员工ID: {probation.employee_id.substring(0, 8)}
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                            试用期：{probation.duration_months}个月
                          </Text>
                        </View>
                        {isPending && isExpiringSoon && (
                          <View className="bg-blue-100 px-3 max-sm:px-2 py-1 rounded-full">
                            <Text className="text-xs max-sm:text-[10px] font-medium text-muted-foreground">
                              即将到期
                            </Text>
                          </View>
                        )}
                        {!isPending && (
                          <View className="bg-blue-100 px-3 max-sm:px-2 py-1 rounded-full">
                            <Text className="text-xs max-sm:text-[10px] font-medium text-muted-foreground">已转正</Text>
                          </View>
                        )}
                      </View>

                      {/* 试用期信息 */}
                      <View className="space-y-2 max-sm:space-y-1.5 mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            开始日期
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {formatDate(probation.start_date)}
                          </Text>
                        </View>
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            结束日期
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {formatDate(probation.end_date)}
                          </Text>
                        </View>
                        {isPending && (
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              剩余天数
                            </Text>
                            <Text
                              className={`text-sm max-sm:text-xs max-sm:text-[10px] font-bold ${remainingDays <= 7 ? 'text-muted-foreground' : 'text-blue-600'}`}>
                              {remainingDays}天
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 操作按钮 */}
                      {isPending && (
                        <View className="flex flex-row gap-2 max-sm:gap-1.5">
                          <Button
                            className="flex-1 bg-blue-100 text-white py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                            size="default"
                            onClick={() => handleOpenConversion(probation)}>
                            转正办理
                          </Button>
                          <Button
                            className="flex-1 bg-muted text-muted-foreground py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                            size="default"
                            onClick={() => {
                              Taro.showToast({
                                title: '功能开发中',
                                icon: 'none',
                                duration: 2000
                              })
                            }}>
                            查看详情
                          </Button>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 温馨提示 */}
          <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 font-medium mb-1">
                  转正流程说明
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                  • 点击"转正办理"填写员工信息{'\n'}• 系统自动生成劳动合同{'\n'}• 系统自动计算并办理社保{'\n'}•
                  完成后员工即可签署合同
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 转正弹窗 */}
      {showConversionModal && selectedProbation && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{zIndex: 1000}}
          onClick={() => setShowConversionModal(false)}>
          <View
            className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mx-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{maxHeight: '80vh', overflowY: 'auto'}}>
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              转正办理
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 岗位 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                  岗位 <Text className="text-destructive">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入岗位名称"
                    value={conversionForm.position}
                    onInput={(e) => setConversionForm({...conversionForm, position: e.detail.value})}
                  />
                </View>
              </View>

              {/* 部门 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                  部门
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入部门名称"
                    value={conversionForm.department}
                    onInput={(e) => setConversionForm({...conversionForm, department: e.detail.value})}
                  />
                </View>
              </View>

              {/* 月薪 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                  月薪（元） <Text className="text-destructive">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入月薪"
                    type="digit"
                    value={conversionForm.salary}
                    onInput={(e) => setConversionForm({...conversionForm, salary: e.detail.value})}
                  />
                </View>
              </View>

              {/* 工作地点 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                  工作地点
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入工作地点"
                    value={conversionForm.work_location}
                    onInput={(e) => setConversionForm({...conversionForm, work_location: e.detail.value})}
                  />
                </View>
              </View>

              {/* 合同类型 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                  合同类型
                </Text>
                <Picker
                  mode="selector"
                  range={['固定期限', '无固定期限', '项目制']}
                  value={
                    conversionForm.contract_type === 'fixed_term'
                      ? 0
                      : conversionForm.contract_type === 'indefinite'
                        ? 1
                        : 2
                  }
                  onChange={(e) => {
                    const types: ('fixed_term' | 'indefinite' | 'project_based')[] = [
                      'fixed_term',
                      'indefinite',
                      'project_based'
                    ]
                    setConversionForm({...conversionForm, contract_type: types[e.detail.value]})
                  }}>
                  <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                    <Text>
                      {conversionForm.contract_type === 'fixed_term'
                        ? '固定期限'
                        : conversionForm.contract_type === 'indefinite'
                          ? '无固定期限'
                          : '项目制'}
                    </Text>
                  </View>
                </Picker>
              </View>

              {/* 合同期限（仅固定期限显示） */}
              {conversionForm.contract_type === 'fixed_term' && (
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                    合同期限（年）
                  </Text>
                  <View style={{overflow: 'hidden'}}>
                    <Input
                      className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                      placeholder="请输入合同期限"
                      type="digit"
                      value={conversionForm.duration_years}
                      onInput={(e) => setConversionForm({...conversionForm, duration_years: e.detail.value})}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={() => setShowConversionModal(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={handleSubmitConversion}>
                确认转正
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default ProbationConversion
