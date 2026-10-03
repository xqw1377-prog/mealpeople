/**
 * 配置中心 - 统一配置管理
 * 集中管理所有系统配置，包括基础配置和排班配置
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {
  getBrandsByTenantId,
  getCurrentUser,
  getEmployeesByTenantId,
  getPositionsByTenantId,
  getStoresByTenantId
} from '@/db/api'
import {getDepartmentsByTenantId} from '@/db/api-department'
import type {Profile} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 配置步骤接口
interface ConfigStep {
  id: string
  title: string
  description: string
  icon: string
  url: string
  completed: boolean
  required: boolean
  order: number
  count?: number
  category: 'basic' | 'schedule' | 'advanced'
}

// 配置项组件（简约风格）
interface ConfigStepItemProps {
  step: ConfigStep
  onNavigate: (url: string) => void
}

const ConfigStepItem: React.FC<ConfigStepItemProps> = ({step, onNavigate}) => {
  return (
    <View
      className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-3 active:opacity-70 transition-all border border-border"
      onClick={() => onNavigate(step.url)}>
      <View className="flex items-center gap-3">
        {/* 图标 */}
        <View
          className={`w-10 h-10 rounded-lg ${step.completed ? 'bg-green-500/10' : 'bg-gray-50'} flex items-center justify-center flex-shrink-0`}>
          <View className={`${step.icon} text-xl ${step.completed ? 'text-blue-600' : 'text-muted-foreground'}`} />
        </View>

        {/* 内容 */}
        <View className="flex-1">
          <View className="flex items-center gap-2 mb-0.5">
            <Text className={`text-sm font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.title}
            </Text>
            {step.completed && step.count !== undefined && (
              <Text className="text-xs text-muted-foreground">({step.count})</Text>
            )}
          </View>
          <Text className="text-xs text-muted-foreground">{step.description}</Text>
        </View>

        {/* 状态指示 */}
        {step.completed ? (
          <View className="i-mdi-check-circle text-lg text-blue-600 flex-shrink-0" />
        ) : (
          <View className="i-mdi-chevron-right text-lg text-muted-foreground flex-shrink-0" />
        )}
      </View>
    </View>
  )
}

export default function ConfigCenter() {
  console.log('配置中心页面开始加载')
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const setCurrentUser = useTenantStore((state) => state.setCurrentUser)
  const [_profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [configSteps, setConfigSteps] = useState<ConfigStep[]>([])

  console.log('配置中心 - 用户信息:', user?.id, '租户:', currentTenant?.id)

  // 加载配置状态
  const loadConfigStatus = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      // 检查各项配置的完成状态
      const [brands, stores, employees, positions, departments] = await Promise.all([
        getBrandsByTenantId(currentTenant.id),
        getStoresByTenantId(currentTenant.id),
        getEmployeesByTenantId(currentTenant.id),
        getPositionsByTenantId(currentTenant.id),
        getDepartmentsByTenantId(currentTenant.id)
      ])

      // 定义配置步骤（分类管理）
      const steps: ConfigStep[] = [
        // 基础配置
        {
          id: 'tenant',
          title: '租户设置',
          description: '配置租户基本信息和系统参数',
          icon: 'i-mdi-office-building',
          url: '/packageD/pages/tenant-settings/index',
          completed: !!currentTenant.name,
          required: true,
          order: 1,
          category: 'basic'
        },
        {
          id: 'brand',
          title: '品牌管理',
          description: '创建和管理品牌信息',
          icon: 'i-mdi-tag-multiple',
          url: '/packageA/pages/brand-management/index',
          completed: brands.length > 0,
          required: true,
          order: 2,
          count: brands.length,
          category: 'basic'
        },
        {
          id: 'store',
          title: '门店管理',
          description: '添加门店信息和店经理',
          icon: 'i-mdi-store',
          url: '/packageD/pages/store-management/index',
          completed: stores.length > 0,
          required: true,
          order: 3,
          count: stores.length,
          category: 'basic'
        },
        {
          id: 'position',
          title: '岗位管理',
          description: '配置岗位信息和职级体系',
          icon: 'i-mdi-briefcase',
          url: '/packageD/pages/position-management/index',
          completed: positions.length > 0,
          required: true,
          order: 4,
          count: positions.length,
          category: 'basic'
        },
        {
          id: 'employee',
          title: '员工管理',
          description: '录入员工信息和岗位分配',
          icon: 'i-mdi-account-group',
          url: '/packageA/pages/employees/index',
          completed: employees.length > 0,
          required: true,
          order: 5,
          count: employees.length,
          category: 'basic'
        },
        {
          id: 'department',
          title: '部门管理',
          description: '组织架构和部门设置',
          icon: 'i-mdi-sitemap',
          url: '/packageD/pages/department-management/index',
          completed: departments.length > 0,
          required: false,
          order: 6,
          count: departments.length,
          category: 'basic'
        },
        // 排班配置
        {
          id: 'schedule-config',
          title: '排班配置',
          description: '配置智能排班规则和参数',
          icon: 'i-mdi-cog',
          url: '/packageA/pages/schedule-config/index',
          completed: false,
          required: false,
          order: 7,
          category: 'schedule'
        },
        {
          id: 'schedule-template',
          title: '排班模板',
          description: '创建和管理排班模板',
          icon: 'i-mdi-file-document',
          url: '/packageA/pages/schedule-config-create/index',
          completed: false,
          required: false,
          order: 8,
          category: 'schedule'
        },
        // 高级配置
        {
          id: 'cost-config',
          title: '成本配置',
          description: '配置人力成本计算规则',
          icon: 'i-mdi-currency-usd',
          url: '/packageB/pages/cost-control/index',
          completed: false,
          required: false,
          order: 9,
          category: 'advanced'
        },
        {
          id: 'efficiency-config',
          title: '效能配置',
          description: '配置人效标准和目标',
          icon: 'i-mdi-chart-line',
          url: '/packageD/pages/efficiency-config/index',
          completed: false,
          required: false,
          order: 10,
          category: 'advanced'
        },
        {
          id: 'diagnostic',
          title: '系统诊断',
          description: '检查账号和员工关联状态',
          icon: 'i-mdi-stethoscope',
          url: '/packageD/pages/diagnostic/index',
          completed: false,
          required: false,
          order: 11,
          category: 'advanced'
        }
      ]

      setConfigSteps(steps)
    } catch (error) {
      console.error('加载配置状态失败:', error)
    }
  }, [currentTenant])

  const loadProfile = useCallback(async () => {
    console.log('配置中心 - loadProfile开始, user?.id:', user?.id)
    if (!user?.id) {
      console.log('配置中心 - 没有用户ID，退出loadProfile')
      return
    }

    setLoading(true)
    try {
      console.log('配置中心 - 正在获取当前用户信息...')
      const p = await getCurrentUser()
      console.log('配置中心 - 获取到用户信息:', p)
      setProfile(p)

      // 同步更新zustand store中的用户信息，确保数据一致性
      if (p) {
        setCurrentUser(p)
      }

      // 检查权限 - 允许超级管理员、租户管理员和店经理访问
      const allowedRoles = ['super_admin', 'tenant_admin', 'store_manager']
      console.log('配置中心 - 检查权限, 用户角色:', p?.role, '允许的角色:', allowedRoles)
      if (p?.role && allowedRoles.includes(p.role)) {
        console.log('配置中心 - 权限检查通过')
        setHasPermission(true)
        // 加载配置状态
        await loadConfigStatus()
      } else {
        console.log('配置中心 - 权限检查失败')
        setHasPermission(false)
        const roleText = p?.role || '未设置'
        Taro.showModal({
          title: '权限不足',
          content: `只有管理员可以访问配置中心\n\n当前角色：${roleText}\n需要角色：超级管理员、租户管理员或店经理`,
          showCancel: false,
          success: () => {
            Taro.navigateBack({
              fail: () => {
                Taro.switchTab({url: '/pages/index/index'})
              }
            })
          }
        })
      }
    } catch (error) {
      console.error('配置中心 - 加载用户信息失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user, loadConfigStatus, setCurrentUser])

  useDidShow(() => {
    loadProfile()
  })

  // 处理导航
  const handleNavigate = (url: string) => {
    Taro.navigateTo({
      url,
      fail: () => {
        Taro.showToast({
          title: '该功能正在开发中',
          icon: 'none'
        })
      }
    })
  }

  // 计算完成度
  const requiredSteps = configSteps.filter((s) => s.required)
  const completedRequired = requiredSteps.filter((s) => s.completed).length
  const totalRequired = requiredSteps.length
  const completionRate = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0

  // 找到下一个未完成的必须步骤
  const _nextStep = requiredSteps.find((s) => !s.completed)

  if (loading) {
    return (
      <View className="bg-gray-50 min-h-screen">
        <ScrollView scrollY className="h-screen box-border">
          <View className="p-4">
            <View className="mb-6">
              <Text className="text-xl font-bold text-foreground">配置中心</Text>
              <Text className="text-sm text-muted-foreground mt-1">统一配置管理</Text>
            </View>
            <LoadingCards count={5} />
          </View>
        </ScrollView>
      </View>
    )
  }

  if (!hasPermission) {
    return (
      <View className="bg-gray-50 min-h-screen">
        <ScrollView scrollY className="h-screen box-border">
          <View className="p-4">
            {/* 顶部标题栏 */}
            <View className="mb-6">
              <Text className="text-xl font-bold text-foreground">配置中心</Text>
              <Text className="text-sm text-muted-foreground mt-1">统一配置管理</Text>
            </View>

            {/* 权限不足提示 */}
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mt-20">
              <View className="flex justify-center mb-4">
                <View className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <View className="i-mdi-shield-lock text-3xl text-muted-foreground" />
                </View>
              </View>
              <Text className="text-lg font-semibold text-center text-foreground mb-2">权限不足</Text>
              <Text className="text-sm text-center text-muted-foreground mb-6">只有管理员可以访问配置中心</Text>
              <Button
                className="w-full bg-blue-100 text-white py-3 rounded-lg break-keep text-sm"
                size="default"
                onClick={() => Taro.switchTab({url: '/pages/index/index'})}>
                返回首页
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // 检查是否需要选择租户
  if (!currentTenant?.id) {
    return (
      <View className="bg-gray-50 min-h-screen">
        <ScrollView scrollY className="h-screen box-border">
          <View className="p-4">
            {/* 顶部标题栏 */}
            <View className="mb-6">
              <Text className="text-xl font-bold text-foreground">配置中心</Text>
              <Text className="text-sm text-muted-foreground mt-1">统一配置管理</Text>
            </View>

            {/* 空状态卡片 */}
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mt-20">
              <View className="flex justify-center mb-4">
                <View className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <View className="i-mdi-office-building text-3xl text-muted-foreground" />
                </View>
              </View>
              <Text className="text-lg font-semibold text-center text-foreground mb-2">请先选择租户</Text>
              <Text className="text-sm text-center text-muted-foreground mb-6">配置中心需要在租户上下文中使用</Text>
              <Button
                className="w-full bg-blue-100 text-white py-3 rounded-lg break-keep text-sm"
                size="default"
                onClick={() => {
                  Taro.navigateTo({
                    url: '/pages/tenant-select/index',
                    fail: (err) => {
                      console.error('导航失败:', err)
                      Taro.showToast({
                        title: '页面跳转失败',
                        icon: 'none'
                      })
                    }
                  })
                }}>
                选择租户
              </Button>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // 按类别分组配置项
  const basicSteps = configSteps.filter((s) => s.category === 'basic')
  const scheduleSteps = configSteps.filter((s) => s.category === 'schedule')
  const advancedSteps = configSteps.filter((s) => s.category === 'advanced')

  return (
    <View className="bg-gray-50 min-h-screen">
      <ScrollView scrollY className="box-border" style={{height: '100vh'}}>
        <View className="p-4">
          {/* 顶部标题栏 */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground">配置中心</Text>
            <Text className="text-sm text-muted-foreground mt-1">统一配置管理</Text>
          </View>

          {/* 进度卡片 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-6 border border-border">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-sm font-medium text-foreground">配置完成度</Text>
              <Text className="text-2xl font-bold text-blue-600">{completionRate}%</Text>
            </View>
            <View className="bg-muted h-2 rounded-full overflow-hidden">
              <View className="bg-blue-100 h-full transition-all" style={{width: `${completionRate}%`}} />
            </View>
            <Text className="text-xs text-muted-foreground mt-2">
              已完成 {completedRequired}/{totalRequired} 项必须配置
            </Text>
          </View>

          {/* 基础配置 */}
          <View className="mb-6">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-cog text-lg text-foreground" />
              <Text className="text-base font-semibold text-foreground">基础配置</Text>
            </View>
            {basicSteps.map((step) => (
              <ConfigStepItem key={step.id} step={step} onNavigate={handleNavigate} />
            ))}
          </View>

          {/* 排班配置 */}
          <View className="mb-6">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-calendar-clock text-lg text-foreground" />
              <Text className="text-base font-semibold text-foreground">排班配置</Text>
            </View>
            {scheduleSteps.map((step) => (
              <ConfigStepItem key={step.id} step={step} onNavigate={handleNavigate} />
            ))}
          </View>

          {/* 高级配置 */}
          <View className="mb-6">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-tune text-lg text-foreground" />
              <Text className="text-base font-semibold text-foreground">高级配置</Text>
            </View>
            {advancedSteps.map((step) => (
              <ConfigStepItem key={step.id} step={step} onNavigate={handleNavigate} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
