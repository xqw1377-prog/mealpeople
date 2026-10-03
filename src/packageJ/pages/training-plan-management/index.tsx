/**
 * 培训计划管理页面
 *
 * 功能：
 * - 查看所有培训计划
 * - 创建新的培训计划
 * - 编辑培训计划
 * - 查看培训计划详情
 * - 分配培训计划给员工
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import {useTenantStore} from '@/store/tenant'

// 培训计划类型
interface TrainingPlan {
  id: string
  tenant_id: string
  title: string
  description: string
  duration_days: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// 培训计划统计
interface TrainingStatistics {
  total: number
  active: number
  inactive: number
}

export default function TrainingPlanManagementPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<TrainingPlan[]>([])
  const [statistics, setStatistics] = useState<TrainingStatistics | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null)

  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_days: 30,
    status: 'active' as 'active' | 'inactive'
  })

  // 状态选项
  const statusOptions = ['启用', '停用']
  const [statusIndex, setStatusIndex] = useState(0)

  // 加载培训计划列表
  const loadPlans = useCallback(async () => {
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

      // 获取培训计划列表
      const {data: planList, error} = await supabase
        .from('training_plans')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', {ascending: false})

      if (error) throw error

      setPlans(planList || [])

      // 计算统计数据
      const stats: TrainingStatistics = {
        total: planList?.length || 0,
        active: planList?.filter((p) => p.status === 'active').length || 0,
        inactive: planList?.filter((p) => p.status === 'inactive').length || 0
      }

      setStatistics(stats)
    } catch (error) {
      console.error('加载培训计划失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useDidShow(() => {
    loadPlans()
  })

  // 显示添加表单
  const handleShowAddForm = () => {
    setFormData({
      title: '',
      description: '',
      duration_days: 30,
      status: 'active'
    })
    setEditingPlan(null)
    setStatusIndex(0)
    setShowAddForm(true)
  }

  // 显示编辑表单
  const handleShowEditForm = (plan: TrainingPlan) => {
    setFormData({
      title: plan.title,
      description: plan.description,
      duration_days: plan.duration_days,
      status: plan.status
    })
    setEditingPlan(plan)
    setStatusIndex(plan.status === 'active' ? 0 : 1)
    setShowAddForm(true)
  }

  // 保存培训计划
  const handleSave = async () => {
    if (!currentTenant) return

    // 验证表单
    if (!formData.title.trim()) {
      Taro.showToast({title: '请输入培训计划名称', icon: 'none'})
      return
    }

    if (!formData.description.trim()) {
      Taro.showToast({title: '请输入培训计划描述', icon: 'none'})
      return
    }

    if (formData.duration_days <= 0) {
      Taro.showToast({title: '培训周期必须大于0', icon: 'none'})
      return
    }

    try {
      setLoading(true)

      if (editingPlan) {
        // 更新培训计划
        const {error} = await supabase
          .from('training_plans')
          .update({
            title: formData.title,
            description: formData.description,
            duration_days: formData.duration_days,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPlan.id)

        if (error) throw error

        Taro.showToast({title: '更新成功', icon: 'success'})
      } else {
        // 创建新培训计划
        const {error} = await supabase.from('training_plans').insert({
          tenant_id: currentTenant.id,
          title: formData.title,
          description: formData.description,
          duration_days: formData.duration_days,
          status: formData.status
        })

        if (error) throw error

        Taro.showToast({title: '创建成功', icon: 'success'})
      }

      setShowAddForm(false)
      loadPlans()
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({title: '保存失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 删除培训计划
  const handleDelete = async (planId: string) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个培训计划吗？此操作不可恢复。'
    })

    if (!result.confirm) return

    try {
      setLoading(true)

      const {error} = await supabase.from('training_plans').delete().eq('id', planId)

      if (error) throw error

      Taro.showToast({title: '删除成功', icon: 'success'})
      loadPlans()
    } catch (error) {
      console.error('删除失败:', error)
      Taro.showToast({title: '删除失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 处理状态选择
  const handleStatusChange = (e: any) => {
    const index = e.detail.value
    setStatusIndex(index)
    setFormData({...formData, status: index === 0 ? 'active' : 'inactive'})
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    return status === 'active' ? '启用' : '停用'
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #fef3c7, #fef9c3)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">培训计划管理</Text>
            <Text className="text-sm opacity-90 block">创建和管理培训计划</Text>
          </View>
          <View className="i-mdi-school text-5xl opacity-20"></View>
        </View>

        {/* 统计卡片 */}
        {statistics && (
          <View className="bg-white bg-opacity-20 rounded-xl p-4">
            <View className="flex items-center justify-between">
              <View className="text-center flex-1">
                <Text className="text-3xl font-bold block mb-1">{statistics.total}</Text>
                <Text className="text-xs opacity-90 block">总计划数</Text>
              </View>
              <View className="w-px h-12 bg-white bg-opacity-30"></View>
              <View className="text-center flex-1">
                <Text className="text-3xl font-bold block mb-1">{statistics.active}</Text>
                <Text className="text-xs opacity-90 block">启用中</Text>
              </View>
              <View className="w-px h-12 bg-white bg-opacity-30"></View>
              <View className="text-center flex-1">
                <Text className="text-3xl font-bold block mb-1">{statistics.inactive}</Text>
                <Text className="text-xs opacity-90 block">已停用</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {loading && !showAddForm ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 添加/编辑表单 */}
          {showAddForm ? (
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <Text className="text-lg font-bold text-foreground mb-4 block">
                {editingPlan ? '编辑培训计划' : '创建培训计划'}
              </Text>

              {/* 计划名称 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">计划名称 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    value={formData.title}
                    onInput={(e) => setFormData({...formData, title: e.detail.value})}
                    placeholder="请输入培训计划名称"
                  />
                </View>
              </View>

              {/* 计划描述 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">计划描述 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    value={formData.description}
                    onInput={(e) => setFormData({...formData, description: e.detail.value})}
                    placeholder="请输入培训计划描述"
                    style={{minHeight: '100px'}}
                  />
                </View>
              </View>

              {/* 培训周期 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">培训周期（天） *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                    type="number"
                    value={String(formData.duration_days)}
                    onInput={(e) => setFormData({...formData, duration_days: parseInt(e.detail.value, 10) || 0})}
                    placeholder="请输入培训周期"
                  />
                </View>
              </View>

              {/* 状态 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">状态</Text>
                <Picker mode="selector" range={statusOptions} value={statusIndex} onChange={handleStatusChange}>
                  <View className="bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                    <Text className="text-foreground">{statusOptions[statusIndex]}</Text>
                    <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                  </View>
                </Picker>
              </View>

              {/* 操作按钮 */}
              <View className="flex items-center gap-3">
                <Button
                  className="flex-1 bg-white border-2 border-gray-200 text-foreground py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={() => setShowAddForm(false)}>
                  取消
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleSave}>
                  保存
                </Button>
              </View>
            </View>
          ) : (
            <>
              {/* 添加按钮 */}
              <View className="mb-4">
                <Button
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 rounded-xl break-keep text-base"
                  size="default"
                  onClick={handleShowAddForm}>
                  <View className="flex items-center justify-center">
                    <View className="i-mdi-plus text-xl mr-2"></View>
                    <Text>创建培训计划</Text>
                  </View>
                </Button>
              </View>

              {/* 培训计划列表 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-3 block">共 {plans.length} 个培训计划</Text>
                {plans.map((plan) => (
                  <View key={plan.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                    <View className="flex items-start justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex items-center mb-2">
                          <Text className="text-lg font-bold text-foreground mr-2">{plan.title}</Text>
                          <View className={`px-2 py-0.5 rounded-full ${getStatusColor(plan.status)}`}>
                            <Text className="text-xs font-medium">{getStatusText(plan.status)}</Text>
                          </View>
                        </View>
                        <Text className="text-sm text-muted-foreground block mb-2">{plan.description}</Text>
                        <View className="flex items-center">
                          <View className="i-mdi-calendar text-sm text-muted-foreground mr-1"></View>
                          <Text className="text-sm text-muted-foreground">培训周期：{plan.duration_days} 天</Text>
                        </View>
                      </View>
                    </View>

                    {/* 操作按钮 */}
                    <View className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <View
                        onClick={() => handleShowEditForm(plan)}
                        className="flex-1 bg-blue-50 rounded-xl py-2 flex items-center justify-center active:bg-blue-100">
                        <View className="i-mdi-pencil text-lg text-blue-600 mr-1"></View>
                        <Text className="text-sm text-blue-600 font-medium">编辑</Text>
                      </View>
                      <View
                        onClick={() => handleDelete(plan.id)}
                        className="flex-1 bg-red-50 rounded-xl py-2 flex items-center justify-center active:bg-red-100">
                        <View className="i-mdi-delete text-lg text-red-600 mr-1"></View>
                        <Text className="text-sm text-red-600 font-medium">删除</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* 空状态 */}
              {plans.length === 0 && (
                <View className="text-center py-12">
                  <View className="i-mdi-school-outline text-6xl text-muted-foreground mb-4"></View>
                  <Text className="text-muted-foreground text-base block">暂无培训计划</Text>
                  <Text className="text-muted-foreground text-sm block mt-2">点击上方按钮创建第一个培训计划</Text>
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
