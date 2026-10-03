/**
 * 工作交接管理页面
 *
 * 功能：
 * - 查看所有工作交接任务
 * - 创建工作交接任务
 * - 跟踪交接进度
 * - 确认交接完成
 * - 查看交接详情
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 工作交接类型
interface WorkHandover {
  id: string
  from_employee_id: string
  from_employee_name: string
  to_employee_id: string
  to_employee_name: string
  work_items: string
  deadline: string
  status: 'pending' | 'in_progress' | 'completed'
  progress: number
  created_at: string
  completed_at?: string
  notes?: string
}

export default function HandoverManagementPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [handovers, setHandovers] = useState<WorkHandover[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)

  // 表单数据
  const [formData, setFormData] = useState({
    from_employee_id: '',
    to_employee_id: '',
    work_items: '',
    deadline: '',
    notes: ''
  })

  // 员工选择器
  const [fromEmployeeIndex, setFromEmployeeIndex] = useState(0)
  const [toEmployeeIndex, setToEmployeeIndex] = useState(0)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 检查权限
      const currentEmployee = await getEmployeeByUserId(user?.id)
      if (!currentEmployee) {
        Taro.showToast({title: '无权限访问', icon: 'none'})
        setLoading(false)
        return
      }

      // 获取所有员工
      const {data: empData, error: empError} = await supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('name', {ascending: true})

      if (empError) throw empError

      setEmployees(empData || [])

      // 获取工作交接记录
      const {data: handoverData, error: handoverError} = await supabase
        .from('work_handovers')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', {ascending: false})

      if (handoverError) throw handoverError

      setHandovers(handoverData || [])
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useDidShow(() => {
    loadData()
  })

  // 显示创建表单
  const handleShowCreateForm = () => {
    setFormData({
      from_employee_id: '',
      to_employee_id: '',
      work_items: '',
      deadline: '',
      notes: ''
    })
    setFromEmployeeIndex(0)
    setToEmployeeIndex(0)
    setShowCreateForm(true)
  }

  // 创建工作交接
  const handleCreateHandover = async () => {
    if (!currentTenant) return

    // 验证表单
    if (!formData.from_employee_id || !formData.to_employee_id) {
      Taro.showToast({title: '请选择交接人员', icon: 'none'})
      return
    }

    if (formData.from_employee_id === formData.to_employee_id) {
      Taro.showToast({title: '交接人和接收人不能相同', icon: 'none'})
      return
    }

    if (!formData.work_items.trim()) {
      Taro.showToast({title: '请输入工作内容', icon: 'none'})
      return
    }

    if (!formData.deadline) {
      Taro.showToast({title: '请选择截止日期', icon: 'none'})
      return
    }

    try {
      setLoading(true)

      const fromEmployee = employees.find((e) => e.id === formData.from_employee_id)
      const toEmployee = employees.find((e) => e.id === formData.to_employee_id)

      const {error} = await supabase.from('work_handovers').insert({
        tenant_id: currentTenant.id,
        from_employee_id: formData.from_employee_id,
        from_employee_name: fromEmployee?.name || '',
        to_employee_id: formData.to_employee_id,
        to_employee_name: toEmployee?.name || '',
        work_items: formData.work_items,
        deadline: formData.deadline,
        status: 'pending',
        progress: 0,
        notes: formData.notes
      })

      if (error) throw error

      Taro.showToast({title: '创建成功', icon: 'success'})
      setShowCreateForm(false)
      loadData()
    } catch (error) {
      console.error('创建失败:', error)
      Taro.showToast({title: '创建失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 更新交接进度
  const handleUpdateProgress = async (handover: WorkHandover) => {
    Taro.showModal({
      title: '更新进度',
      content: `当前进度：${handover.progress}%\n请输入新的进度（0-100）`,
      success: async (res) => {
        if (res.confirm) {
          // 使用prompt获取输入
          Taro.showModal({
            title: '输入进度',
            content: '请输入0-100的数字',
            success: async (inputRes) => {
              if (inputRes.confirm) {
                // 简化处理：让用户通过按钮选择进度
                const progressOptions = ['25%', '50%', '75%', '100%']
                Taro.showActionSheet({
                  itemList: progressOptions,
                  success: async (sheetRes) => {
                    const progress = parseInt(progressOptions[sheetRes.tapIndex], 10) || 0

                    try {
                      const newStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending'

                      const {error} = await supabase
                        .from('work_handovers')
                        .update({
                          progress,
                          status: newStatus,
                          completed_at: progress === 100 ? new Date().toISOString() : null
                        })
                        .eq('id', handover.id)

                      if (error) throw error

                      Taro.showToast({title: '更新成功', icon: 'success'})
                      loadData()
                    } catch (error) {
                      console.error('更新失败:', error)
                      Taro.showToast({title: '更新失败', icon: 'none'})
                    }
                  }
                })
              }
            }
          })
        }
      }
    })
  }

  // 查看交接详情
  const handleViewDetail = (handover: WorkHandover) => {
    const statusText =
      handover.status === 'pending' ? '待开始' : handover.status === 'in_progress' ? '进行中' : '已完成'

    const content = `交接人：${handover.from_employee_name}\n接收人：${handover.to_employee_name}\n\n工作内容：\n${handover.work_items}\n\n截止日期：${handover.deadline}\n\n当前进度：${handover.progress}%\n状态：${statusText}\n\n创建时间：${new Date(handover.created_at).toLocaleString('zh-CN')}`

    Taro.showModal({
      title: '工作交接详情',
      content,
      showCancel: false
    })
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待开始'
      case 'in_progress':
        return '进行中'
      case 'completed':
        return '已完成'
      default:
        return '未知'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // 统计数据
  const statistics = {
    total: handovers.length,
    pending: handovers.filter((h) => h.status === 'pending').length,
    in_progress: handovers.filter((h) => h.status === 'in_progress').length,
    completed: handovers.filter((h) => h.status === 'completed').length
  }

  // 员工选择器数据
  const employeeNames = employees.map((e) => e.name || '未命名')

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #fffbeb, #fef3c7)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">工作交接管理</Text>
            <Text className="text-sm opacity-90 block">管理员工工作交接</Text>
          </View>
          <View className="i-mdi-swap-horizontal text-5xl opacity-20"></View>
        </View>

        {/* 统计卡片 */}
        <View className="bg-white bg-opacity-20 rounded-xl p-4">
          <View className="grid grid-cols-4 gap-2">
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.total}</Text>
              <Text className="text-xs opacity-90 block">总任务</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.pending}</Text>
              <Text className="text-xs opacity-90 block">待开始</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.in_progress}</Text>
              <Text className="text-xs opacity-90 block">进行中</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.completed}</Text>
              <Text className="text-xs opacity-90 block">已完成</Text>
            </View>
          </View>
        </View>
      </View>

      {loading && !showCreateForm ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 创建表单 */}
          {showCreateForm ? (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <Text className="text-lg font-bold text-foreground mb-4 block">创建工作交接</Text>

              {/* 交接人 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">交接人 *</Text>
                <Picker
                  mode="selector"
                  range={employeeNames}
                  value={fromEmployeeIndex}
                  onChange={(e) => {
                    const index =
                      typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
                    setFromEmployeeIndex(index)
                    setFormData({...formData, from_employee_id: employees[index]?.id || ''})
                  }}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{employeeNames[fromEmployeeIndex] || '请选择交接人'}</Text>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 接收人 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">接收人 *</Text>
                <Picker
                  mode="selector"
                  range={employeeNames}
                  value={toEmployeeIndex}
                  onChange={(e) => {
                    const index =
                      typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
                    setToEmployeeIndex(index)
                    setFormData({...formData, to_employee_id: employees[index]?.id || ''})
                  }}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{employeeNames[toEmployeeIndex] || '请选择接收人'}</Text>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 工作内容 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">工作内容 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    value={formData.work_items}
                    onInput={(e) => setFormData({...formData, work_items: e.detail.value})}
                    placeholder="请详细描述需要交接的工作内容"
                    style={{minHeight: '100px'}}
                  />
                </View>
              </View>

              {/* 截止日期 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">截止日期 *</Text>
                <Picker
                  mode="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.detail.value})}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{formData.deadline || '请选择截止日期'}</Text>
                    <View className="i-mdi-calendar text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 备注 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">备注</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    value={formData.notes}
                    onInput={(e) => setFormData({...formData, notes: e.detail.value})}
                    placeholder="选填"
                  />
                </View>
              </View>

              {/* 操作按钮 */}
              <View className="flex items-center gap-3">
                <Button
                  className="flex-1 bg-white border-2 border-gray-200 text-foreground py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={() => setShowCreateForm(false)}>
                  取消
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 text-white py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleCreateHandover}>
                  创建交接
                </Button>
              </View>
            </View>
          ) : (
            <>
              {/* 创建按钮 */}
              <View className="mb-4">
                <View
                  onClick={handleShowCreateForm}
                  className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl py-3 px-6 flex items-center justify-center active:scale-95 transition-all">
                  <View className="i-mdi-plus-circle text-xl mr-2"></View>
                  <Text className="text-base font-medium">创建工作交接</Text>
                </View>
              </View>

              {/* 交接列表 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-3 block">共 {handovers.length} 个交接任务</Text>
                {handovers.map((handover) => (
                  <View key={handover.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex items-center mb-2">
                          <View className="i-mdi-account-arrow-right text-xl text-yellow-600 mr-2"></View>
                          <Text className="text-base font-bold text-foreground">
                            {handover.from_employee_name} → {handover.to_employee_name}
                          </Text>
                        </View>
                      </View>

                      {/* 状态标签 */}
                      <View className={`px-3 py-1 rounded-full ${getStatusColor(handover.status)}`}>
                        <Text className="text-xs font-medium">{getStatusText(handover.status)}</Text>
                      </View>
                    </View>

                    {/* 工作内容 */}
                    <View className="bg-gray-50 rounded-xl p-3 mb-3">
                      <Text className="text-sm text-muted-foreground mb-1">工作内容</Text>
                      <Text className="text-sm text-foreground mb-2">{handover.work_items}</Text>
                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-muted-foreground">截止日期</Text>
                        <Text className="text-sm text-foreground font-medium">{handover.deadline}</Text>
                      </View>
                    </View>

                    {/* 进度条 */}
                    <View className="mb-3">
                      <View className="flex items-center justify-between mb-2">
                        <Text className="text-sm text-muted-foreground">完成进度</Text>
                        <Text className="text-sm text-primary font-bold">{handover.progress}%</Text>
                      </View>
                      <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-gradient-to-r from-yellow-500 to-amber-500"
                          style={{width: `${handover.progress}%`}}></View>
                      </View>
                    </View>

                    {/* 操作按钮 */}
                    <View className="flex items-center gap-2">
                      {handover.status !== 'completed' && (
                        <View
                          onClick={() => handleUpdateProgress(handover)}
                          className="flex-1 bg-blue-50 rounded-xl py-2 flex items-center justify-center active:bg-blue-100">
                          <View className="i-mdi-progress-check text-lg text-blue-600 mr-1"></View>
                          <Text className="text-sm text-blue-600 font-medium">更新进度</Text>
                        </View>
                      )}
                      <View
                        onClick={() => handleViewDetail(handover)}
                        className="flex-1 bg-gray-50 rounded-xl py-2 flex items-center justify-center active:bg-gray-100">
                        <View className="i-mdi-eye text-lg text-gray-600 mr-1"></View>
                        <Text className="text-sm text-gray-600 font-medium">查看详情</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* 空状态 */}
              {handovers.length === 0 && (
                <View className="text-center py-12">
                  <View className="i-mdi-swap-horizontal-circle text-6xl text-muted-foreground mb-4"></View>
                  <Text className="text-muted-foreground text-base block">暂无工作交接</Text>
                  <Text className="text-muted-foreground text-sm block mt-2">点击上方按钮创建工作交接任务</Text>
                </View>
              )}

              {/* 返回按钮 */}
              <View className="mt-6">
                <View
                  onClick={handleBack}
                  className="bg-white border-2 border-gray-200 rounded-xl py-3 px-6 flex items-center justify-center active:bg-gray-50">
                  <View className="i-mdi-arrow-left text-xl text-foreground mr-2"></View>
                  <Text className="text-foreground font-medium">返回</Text>
                </View>
              </View>
            </>
          )}

          {/* 底部间距 */}
          <View className="h-6"></View>
        </View>
      )}
    </ScrollView>
  )
}
