/**
 * 离职面谈管理页面
 *
 * 功能：
 * - 查看待面谈员工列表
 * - 安排离职面谈
 * - 记录面谈内容
 * - 查看面谈历史
 * - 分析离职原因
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 离职面谈类型
interface ExitInterview {
  id: string
  employee_id: string
  employee_name: string
  department: string
  position: string
  interview_date: string
  interviewer_id: string
  interviewer_name: string
  status: 'scheduled' | 'completed' | 'cancelled'
  resignation_reason: string
  satisfaction_rating: number
  work_environment_rating: number
  management_rating: number
  salary_rating: number
  development_rating: number
  suggestions: string
  would_recommend: boolean
  would_return: boolean
  notes: string
  created_at: string
}

export default function ExitInterviewManagementPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState<ExitInterview[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<ExitInterview | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed'>('all')

  // 安排面谈表单数据
  const [scheduleFormData, setScheduleFormData] = useState({
    employee_id: '',
    interview_date: '',
    notes: ''
  })

  // 面谈记录表单数据
  const [recordFormData, setRecordFormData] = useState({
    resignation_reason: '',
    satisfaction_rating: 5,
    work_environment_rating: 5,
    management_rating: 5,
    salary_rating: 5,
    development_rating: 5,
    suggestions: '',
    would_recommend: true,
    would_return: true,
    notes: ''
  })

  // 员工选择器
  const [employeeIndex, setEmployeeIndex] = useState(0)

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

      // 获取离职面谈记录
      const {data: interviewData, error: interviewError} = await supabase
        .from('exit_interviews')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('interview_date', {ascending: false})

      if (interviewError) throw interviewError

      setInterviews(interviewData || [])
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

  // 显示安排面谈表单
  const handleShowScheduleForm = () => {
    setScheduleFormData({
      employee_id: '',
      interview_date: '',
      notes: ''
    })
    setEmployeeIndex(0)
    setShowScheduleForm(true)
  }

  // 安排面谈
  const handleScheduleInterview = async () => {
    if (!currentTenant || !user) return

    // 验证表单
    if (!scheduleFormData.employee_id) {
      Taro.showToast({title: '请选择员工', icon: 'none'})
      return
    }

    if (!scheduleFormData.interview_date) {
      Taro.showToast({title: '请选择面谈日期', icon: 'none'})
      return
    }

    try {
      setLoading(true)

      const employee = employees.find((e) => e.id === scheduleFormData.employee_id)
      const currentEmployee = await getEmployeeByUserId(user.id)

      const {error} = await supabase.from('exit_interviews').insert({
        tenant_id: currentTenant.id,
        employee_id: scheduleFormData.employee_id,
        employee_name: employee?.name || '',
        department: employee?.department || '',
        position: employee?.position || '',
        interview_date: scheduleFormData.interview_date,
        interviewer_id: user.id,
        interviewer_name: currentEmployee?.name || '',
        status: 'scheduled',
        resignation_reason: '',
        satisfaction_rating: 0,
        work_environment_rating: 0,
        management_rating: 0,
        salary_rating: 0,
        development_rating: 0,
        suggestions: '',
        would_recommend: false,
        would_return: false,
        notes: scheduleFormData.notes
      })

      if (error) throw error

      Taro.showToast({title: '安排成功', icon: 'success'})
      setShowScheduleForm(false)
      loadData()
    } catch (error) {
      console.error('安排失败:', error)
      Taro.showToast({title: '安排失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 显示记录面谈表单
  const handleShowRecordForm = (interview: ExitInterview) => {
    setSelectedInterview(interview)
    setRecordFormData({
      resignation_reason: interview.resignation_reason || '',
      satisfaction_rating: interview.satisfaction_rating || 5,
      work_environment_rating: interview.work_environment_rating || 5,
      management_rating: interview.management_rating || 5,
      salary_rating: interview.salary_rating || 5,
      development_rating: interview.development_rating || 5,
      suggestions: interview.suggestions || '',
      would_recommend: interview.would_recommend || true,
      would_return: interview.would_return || true,
      notes: interview.notes || ''
    })
    setShowRecordForm(true)
  }

  // 记录面谈结果
  const handleRecordInterview = async () => {
    if (!selectedInterview) return

    // 验证表单
    if (!recordFormData.resignation_reason.trim()) {
      Taro.showToast({title: '请填写离职原因', icon: 'none'})
      return
    }

    try {
      setLoading(true)

      const {error} = await supabase
        .from('exit_interviews')
        .update({
          status: 'completed',
          resignation_reason: recordFormData.resignation_reason,
          satisfaction_rating: recordFormData.satisfaction_rating,
          work_environment_rating: recordFormData.work_environment_rating,
          management_rating: recordFormData.management_rating,
          salary_rating: recordFormData.salary_rating,
          development_rating: recordFormData.development_rating,
          suggestions: recordFormData.suggestions,
          would_recommend: recordFormData.would_recommend,
          would_return: recordFormData.would_return,
          notes: recordFormData.notes
        })
        .eq('id', selectedInterview.id)

      if (error) throw error

      Taro.showToast({title: '记录成功', icon: 'success'})
      setShowRecordForm(false)
      setSelectedInterview(null)
      loadData()
    } catch (error) {
      console.error('记录失败:', error)
      Taro.showToast({title: '记录失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 查看面谈详情
  const handleViewDetail = (interview: ExitInterview) => {
    const statusText =
      interview.status === 'scheduled' ? '已安排' : interview.status === 'completed' ? '已完成' : '已取消'

    let content = `员工：${interview.employee_name}\n部门：${interview.department}\n职位：${interview.position}\n\n面谈日期：${interview.interview_date}\n面谈人：${interview.interviewer_name}\n状态：${statusText}`

    if (interview.status === 'completed') {
      content += `\n\n离职原因：${interview.resignation_reason}\n\n满意度评分：\n- 整体满意度：${interview.satisfaction_rating}/10\n- 工作环境：${interview.work_environment_rating}/10\n- 管理水平：${interview.management_rating}/10\n- 薪资待遇：${interview.salary_rating}/10\n- 发展机会：${interview.development_rating}/10\n\n是否推荐：${interview.would_recommend ? '是' : '否'}\n是否愿意回归：${interview.would_return ? '是' : '否'}`

      if (interview.suggestions) {
        content += `\n\n改进建议：${interview.suggestions}`
      }
    }

    Taro.showModal({
      title: '面谈详情',
      content,
      showCancel: false
    })
  }

  // 取消面谈
  const handleCancelInterview = async (interview: ExitInterview) => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这次面谈吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const {error} = await supabase.from('exit_interviews').update({status: 'cancelled'}).eq('id', interview.id)

            if (error) throw error

            Taro.showToast({title: '已取消', icon: 'success'})
            loadData()
          } catch (error) {
            console.error('取消失败:', error)
            Taro.showToast({title: '取消失败', icon: 'none'})
          }
        }
      }
    })
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '已安排'
      case 'completed':
        return '已完成'
      case 'cancelled':
        return '已取消'
      default:
        return '未知'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // 筛选面谈列表
  const filteredInterviews = interviews.filter((interview) => {
    if (filterStatus === 'all') return true
    return interview.status === filterStatus
  })

  // 统计数据
  const statistics = {
    total: interviews.length,
    scheduled: interviews.filter((i) => i.status === 'scheduled').length,
    completed: interviews.filter((i) => i.status === 'completed').length,
    cancelled: interviews.filter((i) => i.status === 'cancelled').length
  }

  // 员工选择器数据
  const employeeNames = employees.map((e) => e.name || '未命名')

  // 评分选项
  const ratingOptions = ['1分', '2分', '3分', '4分', '5分', '6分', '7分', '8分', '9分', '10分']

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #fef3c7, #fde68a)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">离职面谈管理</Text>
            <Text className="text-sm opacity-90 block">了解离职原因，改进管理</Text>
          </View>
          <View className="i-mdi-account-voice text-5xl opacity-20"></View>
        </View>

        {/* 统计卡片 */}
        <View className="bg-white bg-opacity-20 rounded-xl p-4">
          <View className="grid grid-cols-4 gap-2">
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.total}</Text>
              <Text className="text-xs opacity-90 block">总面谈</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.scheduled}</Text>
              <Text className="text-xs opacity-90 block">已安排</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.completed}</Text>
              <Text className="text-xs opacity-90 block">已完成</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.cancelled}</Text>
              <Text className="text-xs opacity-90 block">已取消</Text>
            </View>
          </View>
        </View>
      </View>

      {loading && !showScheduleForm && !showRecordForm ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 安排面谈表单 */}
          {showScheduleForm ? (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <Text className="text-lg font-bold text-foreground mb-4 block">安排离职面谈</Text>

              {/* 选择员工 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">选择员工 *</Text>
                <Picker
                  mode="selector"
                  range={employeeNames}
                  value={employeeIndex}
                  onChange={(e) => {
                    const index =
                      typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
                    setEmployeeIndex(index)
                    setScheduleFormData({...scheduleFormData, employee_id: employees[index]?.id || ''})
                  }}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{employeeNames[employeeIndex] || '请选择员工'}</Text>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 面谈日期 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">面谈日期 *</Text>
                <Picker
                  mode="date"
                  value={scheduleFormData.interview_date}
                  onChange={(e) =>
                    setScheduleFormData({...scheduleFormData, interview_date: e.detail.value as string})
                  }>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{scheduleFormData.interview_date || '请选择面谈日期'}</Text>
                    <View className="i-mdi-calendar text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 备注 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">备注</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    value={scheduleFormData.notes}
                    onInput={(e) => setScheduleFormData({...scheduleFormData, notes: e.detail.value})}
                    placeholder="选填"
                    style={{minHeight: '80px'}}
                  />
                </View>
              </View>

              {/* 操作按钮 */}
              <View className="flex items-center gap-3">
                <Button
                  className="flex-1 bg-white border-2 border-gray-200 text-foreground py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={() => setShowScheduleForm(false)}>
                  取消
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleScheduleInterview}>
                  确认安排
                </Button>
              </View>
            </View>
          ) : showRecordForm && selectedInterview ? (
            <ScrollView scrollY className="bg-white rounded-2xl p-5 mb-4 shadow-sm" style={{maxHeight: '70vh'}}>
              <Text className="text-lg font-bold text-foreground mb-4 block">记录面谈结果</Text>

              {/* 员工信息 */}
              <View className="bg-gray-50 rounded-xl p-3 mb-4">
                <Text className="text-sm text-muted-foreground mb-1">面谈员工</Text>
                <Text className="text-base font-bold text-foreground">{selectedInterview.employee_name}</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  {selectedInterview.department} · {selectedInterview.position}
                </Text>
              </View>

              {/* 离职原因 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">离职原因 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    value={recordFormData.resignation_reason}
                    onInput={(e) => setRecordFormData({...recordFormData, resignation_reason: e.detail.value})}
                    placeholder="请详细记录员工的离职原因"
                    style={{minHeight: '100px'}}
                  />
                </View>
              </View>

              {/* 满意度评分 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">整体满意度（1-10分）</Text>
                <Picker
                  mode="selector"
                  range={ratingOptions}
                  value={recordFormData.satisfaction_rating - 1}
                  onChange={(e) => {
                    const index =
                      typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
                    setRecordFormData({...recordFormData, satisfaction_rating: index + 1})
                  }}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{recordFormData.satisfaction_rating}分</Text>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 工作环境评分 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">工作环境（1-10分）</Text>
                <Picker
                  mode="selector"
                  range={ratingOptions}
                  value={recordFormData.work_environment_rating - 1}
                  onChange={(e) => {
                    const index =
                      typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
                    setRecordFormData({...recordFormData, work_environment_rating: index + 1})
                  }}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{recordFormData.work_environment_rating}分</Text>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 管理水平评分 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">管理水平（1-10分）</Text>
                <Picker
                  mode="selector"
                  range={ratingOptions}
                  value={recordFormData.management_rating - 1}
                  onChange={(e) => {
                    const index =
                      typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
                    setRecordFormData({...recordFormData, management_rating: index + 1})
                  }}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{recordFormData.management_rating}分</Text>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 薪资待遇评分 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">薪资待遇（1-10分）</Text>
                <Picker
                  mode="selector"
                  range={ratingOptions}
                  value={recordFormData.salary_rating - 1}
                  onChange={(e) => {
                    const index =
                      typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
                    setRecordFormData({...recordFormData, salary_rating: index + 1})
                  }}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{recordFormData.salary_rating}分</Text>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 发展机会评分 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">发展机会（1-10分）</Text>
                <Picker
                  mode="selector"
                  range={ratingOptions}
                  value={recordFormData.development_rating - 1}
                  onChange={(e) => {
                    const index =
                      typeof e.detail.value === 'number' ? e.detail.value : parseInt(String(e.detail.value), 10)
                    setRecordFormData({...recordFormData, development_rating: index + 1})
                  }}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{recordFormData.development_rating}分</Text>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 是否推荐 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">是否愿意推荐他人加入</Text>
                <View className="flex items-center gap-3">
                  <View
                    onClick={() => setRecordFormData({...recordFormData, would_recommend: true})}
                    className={`flex-1 rounded-xl py-3 text-center ${recordFormData.would_recommend ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Text
                      className={`font-medium ${recordFormData.would_recommend ? 'text-green-700' : 'text-gray-600'}`}>
                      是
                    </Text>
                  </View>
                  <View
                    onClick={() => setRecordFormData({...recordFormData, would_recommend: false})}
                    className={`flex-1 rounded-xl py-3 text-center ${!recordFormData.would_recommend ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <Text
                      className={`font-medium ${!recordFormData.would_recommend ? 'text-red-700' : 'text-gray-600'}`}>
                      否
                    </Text>
                  </View>
                </View>
              </View>

              {/* 是否愿意回归 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">未来是否愿意回归</Text>
                <View className="flex items-center gap-3">
                  <View
                    onClick={() => setRecordFormData({...recordFormData, would_return: true})}
                    className={`flex-1 rounded-xl py-3 text-center ${recordFormData.would_return ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Text className={`font-medium ${recordFormData.would_return ? 'text-green-700' : 'text-gray-600'}`}>
                      愿意
                    </Text>
                  </View>
                  <View
                    onClick={() => setRecordFormData({...recordFormData, would_return: false})}
                    className={`flex-1 rounded-xl py-3 text-center ${!recordFormData.would_return ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <Text className={`font-medium ${!recordFormData.would_return ? 'text-red-700' : 'text-gray-600'}`}>
                      不愿意
                    </Text>
                  </View>
                </View>
              </View>

              {/* 改进建议 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">改进建议</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    value={recordFormData.suggestions}
                    onInput={(e) => setRecordFormData({...recordFormData, suggestions: e.detail.value})}
                    placeholder="员工对公司的改进建议"
                    style={{minHeight: '80px'}}
                  />
                </View>
              </View>

              {/* 其他备注 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">其他备注</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    value={recordFormData.notes}
                    onInput={(e) => setRecordFormData({...recordFormData, notes: e.detail.value})}
                    placeholder="选填"
                    style={{minHeight: '80px'}}
                  />
                </View>
              </View>

              {/* 操作按钮 */}
              <View className="flex items-center gap-3">
                <Button
                  className="flex-1 bg-white border-2 border-gray-200 text-foreground py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={() => {
                    setShowRecordForm(false)
                    setSelectedInterview(null)
                  }}>
                  取消
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleRecordInterview}>
                  保存记录
                </Button>
              </View>
            </ScrollView>
          ) : (
            <>
              {/* 操作按钮 */}
              <View className="mb-4">
                <View
                  onClick={handleShowScheduleForm}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-xl py-3 px-6 flex items-center justify-center active:scale-95 transition-all">
                  <View className="i-mdi-calendar-plus text-xl mr-2"></View>
                  <Text className="text-base font-medium">安排离职面谈</Text>
                </View>
              </View>

              {/* 筛选器 */}
              <View className="flex items-center gap-2 mb-4">
                <View
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-xl ${filterStatus === 'all' ? 'bg-amber-500 text-white' : 'bg-white text-foreground'}`}>
                  <Text className="text-sm font-medium">全部({statistics.total})</Text>
                </View>
                <View
                  onClick={() => setFilterStatus('scheduled')}
                  className={`px-4 py-2 rounded-xl ${filterStatus === 'scheduled' ? 'bg-blue-500 text-white' : 'bg-white text-foreground'}`}>
                  <Text className="text-sm font-medium">已安排({statistics.scheduled})</Text>
                </View>
                <View
                  onClick={() => setFilterStatus('completed')}
                  className={`px-4 py-2 rounded-xl ${filterStatus === 'completed' ? 'bg-green-500 text-white' : 'bg-white text-foreground'}`}>
                  <Text className="text-sm font-medium">已完成({statistics.completed})</Text>
                </View>
              </View>

              {/* 面谈列表 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-3 block">共 {filteredInterviews.length} 个面谈</Text>
                {filteredInterviews.map((interview) => (
                  <View key={interview.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex items-center mb-2">
                          <View className="i-mdi-account-voice text-xl text-amber-600 mr-2"></View>
                          <Text className="text-base font-bold text-foreground">{interview.employee_name}</Text>
                        </View>
                        <Text className="text-sm text-muted-foreground">
                          {interview.department} · {interview.position}
                        </Text>
                      </View>

                      {/* 状态标签 */}
                      <View className={`px-3 py-1 rounded-full ${getStatusColor(interview.status)}`}>
                        <Text className="text-xs font-medium">{getStatusText(interview.status)}</Text>
                      </View>
                    </View>

                    {/* 面谈信息 */}
                    <View className="bg-gray-50 rounded-xl p-3 mb-3">
                      <View className="flex items-center justify-between mb-2">
                        <Text className="text-sm text-muted-foreground">面谈日期</Text>
                        <Text className="text-sm text-foreground font-medium">{interview.interview_date}</Text>
                      </View>
                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-muted-foreground">面谈人</Text>
                        <Text className="text-sm text-foreground font-medium">{interview.interviewer_name}</Text>
                      </View>
                    </View>

                    {/* 满意度评分（已完成的面谈） */}
                    {interview.status === 'completed' && (
                      <View className="bg-amber-50 rounded-xl p-3 mb-3">
                        <Text className="text-sm text-muted-foreground mb-2">满意度评分</Text>
                        <View className="grid grid-cols-5 gap-2">
                          <View className="text-center">
                            <Text className="text-lg font-bold text-amber-600 block">
                              {interview.satisfaction_rating}
                            </Text>
                            <Text className="text-xs text-muted-foreground">整体</Text>
                          </View>
                          <View className="text-center">
                            <Text className="text-lg font-bold text-amber-600 block">
                              {interview.work_environment_rating}
                            </Text>
                            <Text className="text-xs text-muted-foreground">环境</Text>
                          </View>
                          <View className="text-center">
                            <Text className="text-lg font-bold text-amber-600 block">
                              {interview.management_rating}
                            </Text>
                            <Text className="text-xs text-muted-foreground">管理</Text>
                          </View>
                          <View className="text-center">
                            <Text className="text-lg font-bold text-amber-600 block">{interview.salary_rating}</Text>
                            <Text className="text-xs text-muted-foreground">薪资</Text>
                          </View>
                          <View className="text-center">
                            <Text className="text-lg font-bold text-amber-600 block">
                              {interview.development_rating}
                            </Text>
                            <Text className="text-xs text-muted-foreground">发展</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* 操作按钮 */}
                    <View className="flex items-center gap-2">
                      {interview.status === 'scheduled' && (
                        <>
                          <View
                            onClick={() => handleShowRecordForm(interview)}
                            className="flex-1 bg-green-50 rounded-xl py-2 flex items-center justify-center active:bg-green-100">
                            <View className="i-mdi-pencil text-lg text-green-600 mr-1"></View>
                            <Text className="text-sm text-green-600 font-medium">记录结果</Text>
                          </View>
                          <View
                            onClick={() => handleCancelInterview(interview)}
                            className="flex-1 bg-red-50 rounded-xl py-2 flex items-center justify-center active:bg-red-100">
                            <View className="i-mdi-close-circle text-lg text-red-600 mr-1"></View>
                            <Text className="text-sm text-red-600 font-medium">取消面谈</Text>
                          </View>
                        </>
                      )}
                      <View
                        onClick={() => handleViewDetail(interview)}
                        className="flex-1 bg-gray-50 rounded-xl py-2 flex items-center justify-center active:bg-gray-100">
                        <View className="i-mdi-eye text-lg text-gray-600 mr-1"></View>
                        <Text className="text-sm text-gray-600 font-medium">查看详情</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* 空状态 */}
              {filteredInterviews.length === 0 && (
                <View className="text-center py-12">
                  <View className="i-mdi-account-voice-off text-6xl text-muted-foreground mb-4"></View>
                  <Text className="text-muted-foreground text-base block">暂无面谈记录</Text>
                  <Text className="text-muted-foreground text-sm block mt-2">点击上方按钮安排离职面谈</Text>
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
