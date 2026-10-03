/**
 * 入职办理管理页面（HR端）
 *
 * 功能：
 * - 查看所有待入职和已入职的员工
 * - 管理入职流程状态
 * - 办理入职手续
 * - 查看入职进度
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  createOnboardingProcess,
  getOnboardingProcesses,
  type OnboardingProcess,
  updateOnboardingProcess
} from '@/db/api-lifecycle'
import {useTenantStore} from '@/store/tenant'

const OnboardingProcessManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [processes, setProcesses] = useState<OnboardingProcess[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending')
  const [selectedProcess, setSelectedProcess] = useState<OnboardingProcess | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // 新增入职流程表单
  const [addForm, setAddForm] = useState({
    employee_id: '',
    start_date: '',
    expected_completion_date: ''
  })

  // 加载入职流程列表
  const loadProcesses = useCallback(async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const allProcesses = await getOnboardingProcesses(currentTenant.id)
      setProcesses(allProcesses)
    } catch (error) {
      console.error('加载入职流程列表失败:', error)
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
    loadProcesses()
  })

  // 打开详情
  const handleOpenDetail = (process: OnboardingProcess) => {
    setSelectedProcess(process)
    setShowDetailModal(true)
  }

  // 打开新增弹窗
  const handleOpenAdd = () => {
    setAddForm({
      employee_id: '',
      start_date: '',
      expected_completion_date: ''
    })
    setShowAddModal(true)
  }

  // 提交新增入职流程
  const handleSubmitAdd = async () => {
    if (!currentTenant) return

    // 验证必填项
    if (!addForm.employee_id || !addForm.start_date) {
      Taro.showToast({
        title: '请填写必填项',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      Taro.showLoading({title: '创建中...'})

      const result = await createOnboardingProcess({
        tenant_id: currentTenant.id,
        employee_id: addForm.employee_id,
        start_date: addForm.start_date,
        expected_completion_date: addForm.expected_completion_date || addForm.start_date,
        status: 'pending'
      })

      Taro.hideLoading()

      if (result) {
        Taro.showToast({
          title: '创建成功！',
          icon: 'success',
          duration: 2000
        })

        setShowAddModal(false)
        loadProcesses()
      } else {
        Taro.showToast({
          title: '创建失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('创建入职流程失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 完成入职办理
  const handleCompleteOnboarding = async (processId: string) => {
    try {
      const result = await Taro.showModal({
        title: '确认完成',
        content: '确定要完成该员工的入职办理吗？',
        confirmText: '确定',
        cancelText: '取消'
      })

      if (!result.confirm) return

      Taro.showLoading({title: '处理中...'})

      const success = await updateOnboardingProcess(processId, {status: 'completed'})

      Taro.hideLoading()

      if (success) {
        Taro.showToast({
          title: '入职办理完成！',
          icon: 'success',
          duration: 2000
        })

        setShowDetailModal(false)
        loadProcesses()
      } else {
        Taro.showToast({
          title: '操作失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('完成入职办理失败:', error)
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

  // 获取状态信息
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      pending: {text: '待办理', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      in_progress: {text: '办理中', color: 'text-white', bgColor: 'bg-blue-100'},
      completed: {text: '已完成', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      cancelled: {text: '已取消', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
    }
    return statusMap[status] || {text: status, color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 获取显示的流程列表
  const displayProcesses =
    activeTab === 'pending'
      ? processes.filter((p) => p.status === 'pending' || p.status === 'in_progress')
      : processes.filter((p) => p.status === 'completed')

  // 计算统计数据
  const stats = {
    total: processes.length,
    pending: processes.filter((p) => p.status === 'pending').length,
    inProgress: processes.filter((p) => p.status === 'in_progress').length,
    completed: processes.filter((p) => p.status === 'completed').length
  }

  // 租户检查
  if (!currentTenant) {
    return (
      <View className="min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border bg-transparent">
          <View className="p-4">
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200">
              <View className="flex flex-col items-center justify-center py-12">
                <View className="i-mdi-alert-circle text-6xl text-blue-600 mb-4" />
                <Text className="text-xl font-bold text-foreground mb-2">请先选择租户</Text>
                <Text className="text-sm text-muted-foreground mb-6 text-center">
                  您需要先选择一个租户才能访问入职办理管理功能
                </Text>
                <Button
                  size="default"
                  className="bg-green-500 text-white px-6 py-3 rounded-lg break-keep text-base active:opacity-80"
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
        <View className="p-4 max-sm:p-3 space-y-4 max-sm:space-y-3">
          {/* 顶部标题卡片 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3">
              <View className="flex flex-row items-center flex-1">
                <View className="w-12 h-12 max-sm:w-10 max-sm:h-10 bg-blue-100 bg-opacity-10 rounded-xl flex items-center justify-center mr-3 max-sm:mr-2">
                  <View className="i-mdi-account-check text-3xl max-sm:text-2xl text-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-2xl max-sm:text-xl font-bold text-foreground">入职办理管理</Text>
                  <Text className="text-sm max-sm:text-xs text-muted-foreground mt-1">管理员工入职办理流程</Text>
                </View>
              </View>
            </View>

            {/* 统计信息 */}
            <View className="flex flex-row gap-3 max-sm:gap-2">
              <View className="flex-1 bg-blue-100 rounded-xl p-4 max-sm:p-3 shadow-sm">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">全部流程</Text>
                <Text className="text-3xl max-sm:text-2xl font-bold text-blue-600">{stats.total}</Text>
              </View>
              <View className="flex-1 bg-blue-100 rounded-xl p-4 max-sm:p-3 shadow-sm">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">待办理</Text>
                <Text className="text-3xl max-sm:text-2xl font-bold text-muted-foreground">{stats.pending}</Text>
              </View>
              <View className="flex-1 bg-blue-100 rounded-xl p-4 max-sm:p-3 shadow-sm">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mb-1">已完成</Text>
                <Text className="text-3xl max-sm:text-2xl font-bold text-muted-foreground">{stats.completed}</Text>
              </View>
            </View>
          </View>

          {/* 标签切换 */}
          <View className="flex flex-row gap-3 max-sm:gap-2 bg-white rounded-xl p-2 border-2 border-gray-200">
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm transition-all ${
                activeTab === 'pending'
                  ? 'bg-blue-100 text-white'
                  : 'bg-transparent text-muted-foreground hover:bg-gray-50'
              }`}
              size="default"
              onClick={() => setActiveTab('pending')}>
              待办理
            </Button>
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm transition-all ${
                activeTab === 'completed'
                  ? 'bg-blue-100 text-white'
                  : 'bg-transparent text-muted-foreground hover:bg-gray-50'
              }`}
              size="default"
              onClick={() => setActiveTab('completed')}>
              已完成
            </Button>
          </View>

          {/* 入职流程列表 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3">
              <Text className="text-lg max-sm:text-base font-bold text-foreground">
                {activeTab === 'pending' ? '待办理的入职流程' : '已完成的入职流程'}
              </Text>
              <Button
                className="bg-green-500 text-white px-4 max-sm:px-3 py-2 rounded-lg break-keep text-sm max-sm:text-xs active:opacity-80"
                size="default"
                onClick={handleOpenAdd}>
                <View className="flex flex-row items-center gap-1">
                  <View className="i-mdi-plus text-lg max-sm:text-base" />
                  <Text className="text-white">新增</Text>
                </View>
              </Button>
            </View>

            {loading ? (
              <View className="text-center py-12 max-sm:py-8">
                <View className="i-mdi-loading text-5xl max-sm:text-4xl text-blue-600 animate-spin mb-3 max-sm:mb-2" />
                <Text className="text-sm max-sm:text-xs text-muted-foreground">加载中...</Text>
              </View>
            ) : displayProcesses.length === 0 ? (
              <View className="text-center py-12 max-sm:py-8">
                <View className="w-20 h-20 max-sm:w-16 max-sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 max-sm:mb-3">
                  <View className="i-mdi-inbox text-5xl max-sm:text-4xl text-muted-foreground" />
                </View>
                <Text className="text-base max-sm:text-sm font-medium text-foreground mb-2">
                  {activeTab === 'pending' ? '暂无待办理的入职流程' : '暂无已完成的入职流程'}
                </Text>
                <Text className="text-sm max-sm:text-xs text-muted-foreground">
                  {activeTab === 'pending' ? '点击右上角"新增"按钮添加入职流程' : '完成的入职流程将在这里显示'}
                </Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2">
                {displayProcesses.map((process) => {
                  const statusInfo = getStatusInfo(process.status)

                  return (
                    <View
                      key={process.id}
                      className="border-2 border-border rounded-xl p-4 max-sm:p-3 shadow-sm hover:shadow-md transition-all active:opacity-90">
                      {/* 流程标题 */}
                      <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2">
                        <View className="flex-1">
                          <Text className="text-base max-sm:text-sm font-bold text-foreground">
                            员工ID: {process.employee_id?.substring(0, 8) || '未知'}
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                            开始日期：{formatDate(process.start_date || null)}
                          </Text>
                        </View>
                        <View
                          className={`${statusInfo.bgColor} px-3 max-sm:px-2 py-1.5 max-sm:py-1 rounded-full shadow-sm`}>
                          <Text className={`text-xs max-sm:text-[10px] font-bold ${statusInfo.color}`}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>

                      {/* 流程信息 */}
                      <View className="space-y-2 max-sm:space-y-1.5 mb-3 max-sm:mb-2 bg-muted bg-opacity-30 rounded-lg p-3 max-sm:p-2">
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs text-muted-foreground">状态</Text>
                          <Text className="text-sm max-sm:text-xs font-medium text-foreground">{statusInfo.text}</Text>
                        </View>
                        {process.expected_completion_date && (
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs text-muted-foreground">预计完成</Text>
                            <Text className="text-sm max-sm:text-xs font-medium text-foreground">
                              {formatDate(process.expected_completion_date)}
                            </Text>
                          </View>
                        )}
                        {process.actual_completion_date && (
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs text-muted-foreground">实际完成</Text>
                            <Text className="text-sm max-sm:text-xs font-medium text-foreground">
                              {formatDate(process.actual_completion_date)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 操作按钮 */}
                      <View className="flex flex-row gap-2 max-sm:gap-1.5">
                        <Button
                          className="flex-1 bg-green-500 text-white py-2.5 max-sm:py-2 rounded-lg break-keep text-sm max-sm:text-xs active:opacity-80"
                          size="default"
                          onClick={() => handleOpenDetail(process)}>
                          查看详情
                        </Button>
                        {process.status === 'pending' && (
                          <Button
                            className="flex-1 bg-green-600 text-white py-2.5 max-sm:py-2 rounded-lg break-keep text-sm max-sm:text-xs active:opacity-80"
                            size="default"
                            onClick={() => handleCompleteOnboarding(process.id)}>
                            完成办理
                          </Button>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 温馨提示 */}
          <View className="bg-blue-100 rounded-lg p-5 border-l-4 border-primary">
            <View className="flex flex-row items-start">
              <View className="w-10 h-10 bg-blue-100 bg-opacity-10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <View className="i-mdi-lightbulb text-xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground mb-2">温馨提示</Text>
                <View className="space-y-1.5">
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-check-circle text-sm text-blue-600 mr-2 mt-0.5" />
                    <Text className="text-sm text-muted-foreground flex-1">
                      入职办理包括：资料审核、合同签订、系统录入等
                    </Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-check-circle text-sm text-blue-600 mr-2 mt-0.5" />
                    <Text className="text-sm text-muted-foreground flex-1">完成入职办理后，员工即可正式开始工作</Text>
                  </View>
                  <View className="flex flex-row items-start">
                    <View className="i-mdi-check-circle text-sm text-blue-600 mr-2 mt-0.5" />
                    <Text className="text-sm text-muted-foreground flex-1">请确保所有入职手续都已完成</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 详情弹窗 */}
      {showDetailModal && selectedProcess && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{zIndex: 1000}}
          onClick={() => setShowDetailModal(false)}>
          <View
            className="bg-white rounded-lg p-6 border-2 border-gray-200 mx-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{maxHeight: '80vh', overflowY: 'auto'}}>
            <Text className="text-xl font-bold text-foreground mb-4">入职流程详情</Text>

            <View className="space-y-4">
              {/* 基本信息 */}
              <View>
                <Text className="text-sm font-medium text-muted-foreground mb-2">基本信息</Text>
                <View className="space-y-2">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">员工ID</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {selectedProcess.employee_id?.substring(0, 8) || '未知'}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">开始日期</Text>
                    <Text className="text-sm font-medium text-foreground">
                      {formatDate(selectedProcess.start_date || null)}
                    </Text>
                  </View>
                  {selectedProcess.expected_completion_date && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">预计完成日期</Text>
                      <Text className="text-sm font-medium text-foreground">
                        {formatDate(selectedProcess.expected_completion_date)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 状态信息 */}
              <View>
                <Text className="text-sm font-medium text-muted-foreground mb-2">状态信息</Text>
                <View className="space-y-2">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm text-muted-foreground">当前状态</Text>
                    <Text className={`text-sm font-medium ${getStatusInfo(selectedProcess.status).color}`}>
                      {getStatusInfo(selectedProcess.status).text}
                    </Text>
                  </View>
                  {selectedProcess.actual_completion_date && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm text-muted-foreground">完成日期</Text>
                      <Text className="text-sm font-medium text-foreground">
                        {formatDate(selectedProcess.actual_completion_date)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 rounded-lg break-keep text-base"
                size="default"
                onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
              {selectedProcess.status === 'pending' && (
                <Button
                  className="flex-1 bg-blue-100 text-white py-3 rounded-lg break-keep text-base"
                  size="default"
                  onClick={() => handleCompleteOnboarding(selectedProcess.id)}>
                  完成办理
                </Button>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 新增入职流程弹窗 */}
      {showAddModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 w-full max-w-md">
            <Text className="text-xl font-bold text-foreground mb-4">新增入职流程</Text>

            <View className="space-y-4">
              {/* 员工ID */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  员工ID <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    placeholder="请输入员工ID"
                    value={addForm.employee_id}
                    onInput={(e) => setAddForm({...addForm, employee_id: e.detail.value})}
                  />
                </View>
              </View>

              {/* 入职日期 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  入职日期 <Text className="text-red-500">*</Text>
                </Text>
                <Picker
                  mode="date"
                  value={addForm.start_date}
                  onChange={(e) => setAddForm({...addForm, start_date: e.detail.value as string})}>
                  <View className="bg-input text-foreground px-3 py-2 rounded border border-border w-full">
                    <Text className={addForm.start_date ? 'text-foreground' : 'text-muted-foreground'}>
                      {addForm.start_date || '请选择入职日期'}
                    </Text>
                  </View>
                </Picker>
              </View>

              {/* 预计完成日期 */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">预计完成日期</Text>
                <Picker
                  mode="date"
                  value={addForm.expected_completion_date}
                  onChange={(e) => setAddForm({...addForm, expected_completion_date: e.detail.value as string})}>
                  <View className="bg-input text-foreground px-3 py-2 rounded border border-border w-full">
                    <Text className={addForm.expected_completion_date ? 'text-foreground' : 'text-muted-foreground'}>
                      {addForm.expected_completion_date || '请选择预计完成日期'}
                    </Text>
                  </View>
                </Picker>
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 rounded-lg break-keep text-base"
                size="default"
                onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 rounded-lg break-keep text-base"
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

export default OnboardingProcessManagement
