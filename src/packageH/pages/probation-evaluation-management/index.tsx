/**
 * 试用期评估管理页面
 *
 * 功能：
 * - 查看所有试用期员工
 * - 创建试用期评估记录
 * - 查看评估历史
 * - 评估结果统计
 * - 转正建议管理
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

// 评估记录类型
interface EvaluationRecord {
  id: string
  employee_id: string
  employee_name: string
  evaluation_date: string
  work_attitude: number
  work_quality: number
  learning_ability: number
  team_cooperation: number
  overall_score: number
  evaluator_comment: string
  recommendation: 'pass' | 'extend' | 'terminate'
  created_at: string
}

// 统计数据类型
interface EvaluationStatistics {
  total_employees: number
  evaluated: number
  pending: number
  pass_rate: number
}

export default function ProbationEvaluationManagementPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [probationEmployees, setProbationEmployees] = useState<Employee[]>([])
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([])
  const [statistics, setStatistics] = useState<EvaluationStatistics | null>(null)
  const [showEvaluationForm, setShowEvaluationForm] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  // 评估表单数据
  const [formData, setFormData] = useState({
    work_attitude: 80,
    work_quality: 80,
    learning_ability: 80,
    team_cooperation: 80,
    evaluator_comment: '',
    recommendation: 'pass' as 'pass' | 'extend' | 'terminate'
  })

  // 建议选项
  const recommendationOptions = ['通过转正', '延长试用期', '终止试用']
  const [recommendationIndex, setRecommendationIndex] = useState(0)

  // 加载试用期员工和评估记录
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

      // 获取试用期员工
      const {data: employees, error: empError} = await supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('status', '试用期')
        .order('hire_date', {ascending: false})

      if (empError) throw empError

      setProbationEmployees(employees || [])

      // 获取评估记录
      const {data: evalData, error: evalError} = await supabase
        .from('probation_evaluations')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('evaluation_date', {ascending: false})

      if (evalError) throw evalError

      setEvaluations(evalData || [])

      // 计算统计数据
      const totalEmployees = employees?.length || 0
      const evaluatedEmployees = new Set(evalData?.map((e) => e.employee_id) || []).size
      const passCount = evalData?.filter((e) => e.recommendation === 'pass').length || 0

      const stats: EvaluationStatistics = {
        total_employees: totalEmployees,
        evaluated: evaluatedEmployees,
        pending: totalEmployees - evaluatedEmployees,
        pass_rate: evaluatedEmployees > 0 ? Math.round((passCount / evaluatedEmployees) * 100) : 0
      }

      setStatistics(stats)
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

  // 显示评估表单
  const handleShowEvaluationForm = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormData({
      work_attitude: 80,
      work_quality: 80,
      learning_ability: 80,
      team_cooperation: 80,
      evaluator_comment: '',
      recommendation: 'pass'
    })
    setRecommendationIndex(0)
    setShowEvaluationForm(true)
  }

  // 保存评估
  const handleSaveEvaluation = async () => {
    if (!currentTenant || !selectedEmployee) return

    // 验证表单
    if (!formData.evaluator_comment.trim()) {
      Taro.showToast({title: '请输入评估意见', icon: 'none'})
      return
    }

    // 计算总分
    const overallScore = Math.round(
      (formData.work_attitude + formData.work_quality + formData.learning_ability + formData.team_cooperation) / 4
    )

    try {
      setLoading(true)

      const {error} = await supabase.from('probation_evaluations').insert({
        tenant_id: currentTenant.id,
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.name,
        evaluation_date: new Date().toISOString().split('T')[0],
        work_attitude: formData.work_attitude,
        work_quality: formData.work_quality,
        learning_ability: formData.learning_ability,
        team_cooperation: formData.team_cooperation,
        overall_score: overallScore,
        evaluator_comment: formData.evaluator_comment,
        recommendation: formData.recommendation
      })

      if (error) throw error

      Taro.showToast({title: '评估保存成功', icon: 'success'})
      setShowEvaluationForm(false)
      loadData()
    } catch (error) {
      console.error('保存评估失败:', error)
      Taro.showToast({title: '保存失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 处理建议选择
  const handleRecommendationChange = (e: any) => {
    const index = e.detail.value
    setRecommendationIndex(index)
    const recommendations: Array<'pass' | 'extend' | 'terminate'> = ['pass', 'extend', 'terminate']
    setFormData({...formData, recommendation: recommendations[index]})
  }

  // 查看员工评估历史
  const handleViewHistory = (employeeId: string) => {
    const employeeEvaluations = evaluations.filter((e) => e.employee_id === employeeId)
    if (employeeEvaluations.length === 0) {
      Taro.showToast({title: '暂无评估记录', icon: 'none'})
      return
    }

    // 显示评估历史
    const historyText = employeeEvaluations
      .map(
        (e) => `${e.evaluation_date}\n综合评分：${e.overall_score}分\n建议：${getRecommendationText(e.recommendation)}`
      )
      .join('\n\n')

    Taro.showModal({
      title: '评估历史',
      content: historyText,
      showCancel: false
    })
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 获取建议文本
  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'pass':
        return '通过转正'
      case 'extend':
        return '延长试用期'
      case 'terminate':
        return '终止试用'
      default:
        return '未知'
    }
  }

  // 获取建议颜色
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'pass':
        return 'bg-green-100 text-green-700'
      case 'extend':
        return 'bg-yellow-100 text-yellow-700'
      case 'terminate':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #f0fdf4, #dcfce7)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">试用期评估</Text>
            <Text className="text-sm opacity-90 block">管理试用期员工评估</Text>
          </View>
          <View className="i-mdi-clipboard-check text-5xl opacity-20"></View>
        </View>

        {/* 统计卡片 */}
        {statistics && (
          <View className="bg-white bg-opacity-20 rounded-xl p-4">
            <View className="grid grid-cols-4 gap-2">
              <View className="text-center">
                <Text className="text-2xl font-bold block mb-1">{statistics.total_employees}</Text>
                <Text className="text-xs opacity-90 block">试用期</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold block mb-1">{statistics.evaluated}</Text>
                <Text className="text-xs opacity-90 block">已评估</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold block mb-1">{statistics.pending}</Text>
                <Text className="text-xs opacity-90 block">待评估</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold block mb-1">{statistics.pass_rate}%</Text>
                <Text className="text-xs opacity-90 block">通过率</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {loading && !showEvaluationForm ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 评估表单 */}
          {showEvaluationForm && selectedEmployee ? (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <Text className="text-lg font-bold text-foreground mb-4 block">评估 {selectedEmployee.name}</Text>

              {/* 工作态度 */}
              <View className="mb-4">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">工作态度</Text>
                  <Text className="text-lg font-bold text-primary">{formData.work_attitude}分</Text>
                </View>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    type="number"
                    value={String(formData.work_attitude)}
                    onInput={(e) =>
                      setFormData({
                        ...formData,
                        work_attitude: Math.min(100, Math.max(0, parseInt(e.detail.value, 10) || 0))
                      })
                    }
                  />
                </View>
              </View>

              {/* 工作质量 */}
              <View className="mb-4">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">工作质量</Text>
                  <Text className="text-lg font-bold text-primary">{formData.work_quality}分</Text>
                </View>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    type="number"
                    value={String(formData.work_quality)}
                    onInput={(e) =>
                      setFormData({
                        ...formData,
                        work_quality: Math.min(100, Math.max(0, parseInt(e.detail.value, 10) || 0))
                      })
                    }
                  />
                </View>
              </View>

              {/* 学习能力 */}
              <View className="mb-4">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">学习能力</Text>
                  <Text className="text-lg font-bold text-primary">{formData.learning_ability}分</Text>
                </View>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    type="number"
                    value={String(formData.learning_ability)}
                    onInput={(e) =>
                      setFormData({
                        ...formData,
                        learning_ability: Math.min(100, Math.max(0, parseInt(e.detail.value, 10) || 0))
                      })
                    }
                  />
                </View>
              </View>

              {/* 团队协作 */}
              <View className="mb-4">
                <View className="flex items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">团队协作</Text>
                  <Text className="text-lg font-bold text-primary">{formData.team_cooperation}分</Text>
                </View>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    type="number"
                    value={String(formData.team_cooperation)}
                    onInput={(e) =>
                      setFormData({
                        ...formData,
                        team_cooperation: Math.min(100, Math.max(0, parseInt(e.detail.value, 10) || 0))
                      })
                    }
                  />
                </View>
              </View>

              {/* 综合评分 */}
              <View className="mb-4 bg-blue-50 rounded-xl p-4">
                <View className="flex items-center justify-between">
                  <Text className="text-sm text-muted-foreground">综合评分</Text>
                  <Text className="text-3xl font-bold text-primary">
                    {Math.round(
                      (formData.work_attitude +
                        formData.work_quality +
                        formData.learning_ability +
                        formData.team_cooperation) /
                        4
                    )}
                    分
                  </Text>
                </View>
              </View>

              {/* 评估意见 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">评估意见 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    value={formData.evaluator_comment}
                    onInput={(e) => setFormData({...formData, evaluator_comment: e.detail.value})}
                    placeholder="请输入详细的评估意见"
                    style={{minHeight: '100px'}}
                  />
                </View>
              </View>

              {/* 转正建议 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">转正建议</Text>
                <Picker
                  mode="selector"
                  range={recommendationOptions}
                  value={recommendationIndex}
                  onChange={handleRecommendationChange}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{recommendationOptions[recommendationIndex]}</Text>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 操作按钮 */}
              <View className="flex items-center gap-3">
                <Button
                  className="flex-1 bg-white border-2 border-gray-200 text-foreground py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={() => setShowEvaluationForm(false)}>
                  取消
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleSaveEvaluation}>
                  保存评估
                </Button>
              </View>
            </View>
          ) : (
            <>
              {/* 试用期员工列表 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-3 block">
                  共 {probationEmployees.length} 名试用期员工
                </Text>
                {probationEmployees.map((employee) => {
                  const employeeEvaluations = evaluations.filter((e) => e.employee_id === employee.id)
                  const latestEvaluation = employeeEvaluations[0]

                  return (
                    <View key={employee.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                      <View className="flex items-center justify-between mb-3">
                        <View className="flex items-center flex-1">
                          {/* 头像 */}
                          <View className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-full flex items-center justify-center mr-3">
                            <Text className="text-white text-lg font-bold">{employee.name?.charAt(0) || 'U'}</Text>
                          </View>

                          {/* 员工信息 */}
                          <View className="flex-1">
                            <Text className="text-base font-bold text-foreground mb-1 block">
                              {employee.name || '未命名'}
                            </Text>
                            <View className="flex items-center">
                              <View className="i-mdi-office-building text-sm text-muted-foreground mr-1"></View>
                              <Text className="text-sm text-muted-foreground mr-3">
                                {employee.department || '未分配'}
                              </Text>
                              <View className="i-mdi-briefcase text-sm text-muted-foreground mr-1"></View>
                              <Text className="text-sm text-muted-foreground">{employee.position || '未分配'}</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* 最新评估信息 */}
                      {latestEvaluation && (
                        <View className="bg-gray-50 rounded-xl p-3 mb-3">
                          <View className="flex items-center justify-between mb-2">
                            <Text className="text-sm text-muted-foreground">最新评估</Text>
                            <View
                              className={`px-2 py-0.5 rounded-full ${getRecommendationColor(latestEvaluation.recommendation)}`}>
                              <Text className="text-xs font-medium">
                                {getRecommendationText(latestEvaluation.recommendation)}
                              </Text>
                            </View>
                          </View>
                          <View className="flex items-center justify-between">
                            <Text className="text-sm text-muted-foreground">综合评分</Text>
                            <Text className="text-xl font-bold text-primary">{latestEvaluation.overall_score}分</Text>
                          </View>
                        </View>
                      )}

                      {/* 操作按钮 */}
                      <View className="flex items-center gap-2">
                        <View
                          onClick={() => handleShowEvaluationForm(employee)}
                          className="flex-1 bg-green-50 rounded-xl py-2 flex items-center justify-center active:bg-green-100">
                          <View className="i-mdi-clipboard-edit text-lg text-green-600 mr-1"></View>
                          <Text className="text-sm text-green-600 font-medium">新建评估</Text>
                        </View>
                        {employeeEvaluations.length > 0 && (
                          <View
                            onClick={() => handleViewHistory(employee.id)}
                            className="flex-1 bg-blue-50 rounded-xl py-2 flex items-center justify-center active:bg-blue-100">
                            <View className="i-mdi-history text-lg text-blue-600 mr-1"></View>
                            <Text className="text-sm text-blue-600 font-medium">评估历史</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>

              {/* 空状态 */}
              {probationEmployees.length === 0 && (
                <View className="text-center py-12">
                  <View className="i-mdi-account-clock text-6xl text-muted-foreground mb-4"></View>
                  <Text className="text-muted-foreground text-base block">暂无试用期员工</Text>
                  <Text className="text-muted-foreground text-sm block mt-2">当前没有需要评估的试用期员工</Text>
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
