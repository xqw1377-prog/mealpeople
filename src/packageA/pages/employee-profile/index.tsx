/**
 * 员工档案管理页面
 *
 * 功能：
 * - 查看员工详细档案信息
 * - 编辑员工基本信息
 * - 查看入职信息和历史记录
 * - 查看学习成就和培训记录
 * - 查看试用期和转正信息
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 员工档案详细信息类型
interface EmployeeProfile extends Employee {
  // 入职信息
  onboarding_date?: string
  probation_end_date?: string
  conversion_date?: string
  // 学习信息
  handbook_progress?: number
  training_progress?: number
  achievement_count?: number
  // 试用期信息
  probation_status?: 'active' | 'completed' | 'extended'
  probation_evaluation?: string
}

export default function EmployeeProfilePage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState<string>('')
  const [profile, setProfile] = useState<EmployeeProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<EmployeeProfile>>({})

  // 从URL参数获取员工ID
  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params
    if (params?.id) {
      setEmployeeId(params.id)
    }
  }, [])

  // 加载员工档案
  const loadProfile = useCallback(async () => {
    if (!employeeId || !currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 获取员工基本信息
      const {data: employee, error: empError} = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .eq('tenant_id', currentTenant.id)
        .maybeSingle()

      if (empError) throw empError
      if (!employee) {
        Taro.showToast({title: '未找到员工信息', icon: 'none'})
        setLoading(false)
        return
      }

      // 获取手册阅读进度
      const {data: handbookProgress} = await supabase
        .from('handbook_reading_progress')
        .select('progress_percentage')
        .eq('employee_id', employeeId)
        .maybeSingle()

      // 获取学习成就数量
      const {data: achievements} = await supabase
        .from('learning_achievements')
        .select('id')
        .eq('employee_id', employeeId)

      // 获取试用期信息
      const {data: probation} = await supabase
        .from('probation_periods')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', {ascending: false})
        .limit(1)
        .maybeSingle()

      // 组合档案信息
      const profileData: EmployeeProfile = {
        ...employee,
        handbook_progress: handbookProgress?.progress_percentage || 0,
        achievement_count: achievements?.length || 0,
        probation_status: probation?.status || undefined,
        probation_evaluation: probation?.evaluation_result || undefined,
        probation_end_date: probation?.end_date || undefined
      }

      setProfile(profileData)
      setEditForm(profileData)
    } catch (error) {
      console.error('加载员工档案失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [employeeId, currentTenant])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useDidShow(() => {
    loadProfile()
  })

  // 保存编辑
  const handleSave = async () => {
    if (!profile || !currentTenant) return

    try {
      setLoading(true)

      // 检查权限 - 简化版，只检查是否登录
      const currentEmployee = await getEmployeeByUserId(user?.id)
      if (!currentEmployee) {
        Taro.showToast({title: '无权限编辑', icon: 'none'})
        return
      }

      // 更新员工信息
      const {error} = await supabase
        .from('employees')
        .update({
          name: editForm.name,
          phone: editForm.phone,
          department: editForm.department,
          position: editForm.position,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      Taro.showToast({title: '保存成功', icon: 'success'})
      setIsEditing(false)
      loadProfile()
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({title: '保存失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  // 取消编辑
  const handleCancel = () => {
    setEditForm(profile || {})
    setIsEditing(false)
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 查看学习成就
  const handleViewAchievements = () => {
    Taro.navigateTo({url: `/pages/my-achievements/index?employeeId=${employeeId}`})
  }

  // 查看试用期详情
  const handleViewProbation = () => {
    Taro.navigateTo({url: `/pages/onboarding/probation-management/index?employeeId=${employeeId}`})
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!profile) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
        <View className="text-center">
          <View className="i-mdi-account-off text-6xl text-muted-foreground mb-4"></View>
          <Text className="text-muted-foreground text-base block mb-4">未找到员工档案</Text>
          <Button
            className="bg-primary text-white py-3 px-6 rounded-xl break-keep text-base"
            size="default"
            onClick={handleBack}>
            返回
          </Button>
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      {/* 头部 */}
      <View className="bg-primary text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">员工档案</Text>
            <Text className="text-sm opacity-90 block">完整的员工信息管理</Text>
          </View>
          <View className="i-mdi-account-box text-5xl opacity-20"></View>
        </View>
      </View>

      <View className="p-4">
        {/* 基本信息卡片 */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">基本信息</Text>
            {!isEditing ? (
              <View onClick={() => setIsEditing(true)} className="flex items-center text-primary">
                <View className="i-mdi-pencil text-lg mr-1"></View>
                <Text className="text-sm">编辑</Text>
              </View>
            ) : (
              <View className="flex items-center gap-2">
                <View onClick={handleCancel} className="flex items-center text-muted-foreground">
                  <View className="i-mdi-close text-lg mr-1"></View>
                  <Text className="text-sm">取消</Text>
                </View>
                <View onClick={handleSave} className="flex items-center text-primary ml-3">
                  <View className="i-mdi-check text-lg mr-1"></View>
                  <Text className="text-sm">保存</Text>
                </View>
              </View>
            )}
          </View>

          {/* 员工头像和姓名 */}
          <View className="flex items-center mb-6">
            <View className="w-20 h-20 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center mr-4">
              <Text className="text-white text-3xl font-bold">{profile.name?.charAt(0) || 'U'}</Text>
            </View>
            <View className="flex-1">
              {isEditing ? (
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    value={editForm.name || ''}
                    onInput={(e) => setEditForm({...editForm, name: e.detail.value})}
                    placeholder="请输入姓名"
                  />
                </View>
              ) : (
                <View>
                  <Text className="text-xl font-bold text-foreground block mb-1">{profile.name || '未命名'}</Text>
                  <Text className="text-sm text-muted-foreground block">
                    {profile.department || '未分配部门'} · {profile.position || '未分配职位'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 详细信息 */}
          <View className="space-y-3">
            {/* 手机号 */}
            <View>
              <Text className="text-sm text-muted-foreground mb-1 block">手机号</Text>
              {isEditing ? (
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    value={editForm.phone || ''}
                    onInput={(e) => setEditForm({...editForm, phone: e.detail.value})}
                    placeholder="请输入手机号"
                  />
                </View>
              ) : (
                <Text className="text-base text-foreground">{profile.phone || '未填写'}</Text>
              )}
            </View>

            {/* 部门 */}
            <View>
              <Text className="text-sm text-muted-foreground mb-1 block">部门</Text>
              <Text className="text-base text-foreground">{profile.department || '未分配'}</Text>
            </View>

            {/* 职位 */}
            <View>
              <Text className="text-sm text-muted-foreground mb-1 block">职位</Text>
              {isEditing ? (
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    value={editForm.position || ''}
                    onInput={(e) => setEditForm({...editForm, position: e.detail.value})}
                    placeholder="请输入职位"
                  />
                </View>
              ) : (
                <Text className="text-base text-foreground">{profile.position || '未分配'}</Text>
              )}
            </View>

            {/* 入职日期 */}
            <View>
              <Text className="text-sm text-muted-foreground mb-1 block">入职日期</Text>
              <Text className="text-base text-foreground">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '未知'}
              </Text>
            </View>
          </View>
        </View>

        {/* 学习进度卡片 */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">学习进度</Text>
            <View onClick={handleViewAchievements} className="flex items-center text-primary">
              <Text className="text-sm mr-1">查看详情</Text>
              <View className="i-mdi-chevron-right text-lg"></View>
            </View>
          </View>

          {/* 手册阅读进度 */}
          <View className="mb-4">
            <View className="flex items-center justify-between mb-2">
              <Text className="text-sm text-foreground">入职手册阅读</Text>
              <Text className="text-sm font-bold text-primary">{profile.handbook_progress?.toFixed(0)}%</Text>
            </View>
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{width: `${profile.handbook_progress || 0}%`}}></View>
            </View>
          </View>

          {/* 学习成就 */}
          <View className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
            <View className="flex items-center">
              <View className="i-mdi-trophy text-2xl text-yellow-600 mr-2"></View>
              <Text className="text-sm text-foreground">学习成就</Text>
            </View>
            <Text className="text-lg font-bold text-yellow-600">{profile.achievement_count || 0} 个</Text>
          </View>
        </View>

        {/* 试用期信息卡片 */}
        {profile.probation_status && (
          <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-lg font-bold text-foreground">试用期信息</Text>
              <View onClick={handleViewProbation} className="flex items-center text-primary">
                <Text className="text-sm mr-1">查看详情</Text>
                <View className="i-mdi-chevron-right text-lg"></View>
              </View>
            </View>

            {/* 试用期状态 */}
            <View className="mb-3">
              <Text className="text-sm text-muted-foreground mb-1 block">状态</Text>
              <View
                className={`inline-flex items-center px-3 py-1 rounded-full ${
                  profile.probation_status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : profile.probation_status === 'extended'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                }`}>
                <Text className="text-sm font-medium">
                  {profile.probation_status === 'completed'
                    ? '已完成'
                    : profile.probation_status === 'extended'
                      ? '已延期'
                      : '进行中'}
                </Text>
              </View>
            </View>

            {/* 试用期结束日期 */}
            {profile.probation_end_date && (
              <View>
                <Text className="text-sm text-muted-foreground mb-1 block">结束日期</Text>
                <Text className="text-base text-foreground">
                  {new Date(profile.probation_end_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 操作按钮 */}
        <View className="mt-6">
          <Button
            className="w-full bg-white border-2 border-gray-200 text-foreground py-3 rounded-xl break-keep text-base"
            size="default"
            onClick={handleBack}>
            <View className="flex items-center justify-center">
              <View className="i-mdi-arrow-left text-xl mr-2"></View>
              <Text>返回</Text>
            </View>
          </Button>
        </View>

        {/* 底部间距 */}
        <View className="h-6"></View>
      </View>
    </ScrollView>
  )
}
