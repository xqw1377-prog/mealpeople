import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {navigateTo, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  getBrandsByTenantId,
  getConfigCompletionStats,
  getEmployeesByTenantId,
  getStoresByTenantId,
  hasBrandConfig,
  hasBusinessAreaConfig,
  hasEfficiencyStandard,
  hasMealPeriodConfig,
  hasMinRevenueConfig,
  hasPositionConfig,
  hasRestDayRules,
  hasWorkShiftConfig
} from '@/db/api'
import {useTenantStore} from '@/store/tenant'

interface ConfigStatus {
  hasBrands: boolean
  hasStores: boolean
  hasEmployees: boolean
  brandCount: number
  storeCount: number
  employeeCount: number
  hasBrandConfig: boolean
  hasEfficiency: boolean
  hasPosition: boolean
  hasBusinessArea: boolean
  hasMealPeriod: boolean
  hasWorkShift: boolean
  hasMinRevenue: boolean
  hasRestRules: boolean
}

const _Management: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentUser = useTenantStore((state) => state.currentUser)
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    hasBrands: false,
    hasStores: false,
    hasEmployees: false,
    brandCount: 0,
    storeCount: 0,
    employeeCount: 0,
    hasBrandConfig: false,
    hasEfficiency: false,
    hasPosition: false,
    hasBusinessArea: false,
    hasMealPeriod: false,
    hasWorkShift: false,
    hasMinRevenue: false,
    hasRestRules: false
  })
  const [_loading, setLoading] = useState(true)
  const [completionStats, setCompletionStats] = useState<{
    total: number
    completed: number
    completion_rate: number
    items: {name: string; completed: boolean}[]
  }>({
    total: 0,
    completed: 0,
    completion_rate: 0,
    items: []
  })
  const [showChecklist, setShowChecklist] = useState(false)

  // 检查配置状态
  const checkConfigStatus = useCallback(async () => {
    if (!currentTenant?.id) {
      console.log('=== 管理中心：租户ID不存在，跳过检查 ===')
      return
    }

    console.log('=== 管理中心：开始检查配置状态 ===', {
      租户ID: currentTenant.id,
      租户名称: currentTenant.name
    })

    setLoading(true)
    try {
      const [
        brands,
        stores,
        employees,
        brandConfig,
        efficiency,
        position,
        businessArea,
        mealPeriod,
        workShift,
        minRevenue,
        restRules,
        stats
      ] = await Promise.all([
        getBrandsByTenantId(currentTenant.id),
        getStoresByTenantId(currentTenant.id),
        getEmployeesByTenantId(currentTenant.id),
        hasBrandConfig(currentTenant.id),
        hasEfficiencyStandard(currentTenant.id),
        hasPositionConfig(currentTenant.id),
        hasBusinessAreaConfig(currentTenant.id),
        hasMealPeriodConfig(currentTenant.id),
        hasWorkShiftConfig(currentTenant.id),
        hasMinRevenueConfig(currentTenant.id),
        hasRestDayRules(currentTenant.id),
        getConfigCompletionStats(currentTenant.id)
      ])

      console.log('=== 管理中心：配置状态检查完成 ===', {
        品牌数量: brands.length,
        门店数量: stores.length,
        员工数量: employees.length,
        品牌配置: brandConfig ? '已完成' : '未完成',
        效能标准: efficiency ? '已完成' : '未完成',
        餐段配置: mealPeriod ? '已完成' : '未完成',
        班次配置: workShift ? '已完成' : '未完成'
      })

      setConfigStatus({
        hasBrands: brands.length > 0,
        hasStores: stores.length > 0,
        hasEmployees: employees.length > 0,
        brandCount: brands.length,
        storeCount: stores.length,
        employeeCount: employees.length,
        hasBrandConfig: brandConfig,
        hasEfficiency: efficiency,
        hasPosition: position,
        hasBusinessArea: businessArea,
        hasMealPeriod: mealPeriod,
        hasWorkShift: workShift,
        hasMinRevenue: minRevenue,
        hasRestRules: restRules
      })

      setCompletionStats(stats)
    } catch (error) {
      console.error('=== 管理中心：检查配置状态失败 ===', error)
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, currentTenant?.name])

  useDidShow(() => {
    checkConfigStatus()
  })

  if (!currentTenant) {
    return null
  }

  // 计算完成进度
  const basicConfigProgress = [configStatus.hasBrands, configStatus.hasStores, configStatus.hasEmployees].filter(
    Boolean
  ).length
  const basicConfigTotal = 3
  const basicConfigPercent = Math.round((basicConfigProgress / basicConfigTotal) * 100)

  // 第一阶段：基础配置（必须完成）
  const basicConfigItems = [
    {
      title: '品牌管理',
      icon: 'i-mdi-tag-multiple',
      path: '/packageA/pages/brand-management/index',
      description: '创建和管理品牌信息',
      completed: configStatus.hasBrands,
      count: configStatus.brandCount,
      countLabel: '个品牌'
    },
    {
      title: '门店管理',
      icon: 'i-mdi-store',
      path: '/packageA/pages/stores/index',
      description: '添加门店信息和店经理',
      completed: configStatus.hasStores,
      count: configStatus.storeCount,
      countLabel: '家门店'
    },
    {
      title: '员工管理',
      icon: 'i-mdi-account-group',
      path: '/packageA/pages/employees/index',
      description: '录入员工信息和岗位',
      completed: configStatus.hasEmployees,
      count: configStatus.employeeCount,
      countLabel: '名员工'
    }
  ]

  // 第二阶段：业务配置（推荐完成）
  const businessConfigItems = [
    {
      title: '餐段配置',
      icon: 'i-mdi-clock-time-four',
      path: '/packageD/pages/meal-periods/index',
      description: '配置营业餐段时间',
      completed: configStatus.hasMealPeriod
    },
    {
      title: '班次配置',
      icon: 'i-mdi-calendar-clock',
      path: '/packageB/pages/work-shifts/index',
      description: '配置工作班次安排',
      completed: configStatus.hasWorkShift
    },
    {
      title: '效能标准',
      icon: 'i-mdi-speedometer',
      path: '/packageD/pages/efficiency-config/index',
      description: '设置营收-效能标准',
      completed: configStatus.hasEfficiency
    },
    {
      title: '营业区配置',
      icon: 'i-mdi-store-settings',
      path: '/packageD/pages/business-area-config/index',
      description: '配置营业区及制作区',
      completed: configStatus.hasBusinessArea
    },
    {
      title: '低营收配置',
      icon: 'i-mdi-cash-minus',
      path: '/packageD/pages/min-revenue-config/index',
      description: '设置低营收下最少必要岗位',
      completed: configStatus.hasMinRevenue
    },
    {
      title: '排休规则',
      icon: 'i-mdi-calendar-clock',
      path: '/packageD/pages/rest-day-rules/index',
      description: '配置排休规则和顶岗原则',
      completed: configStatus.hasRestRules
    }
  ]

  // 第三阶段：高级功能（可选）
  const advancedItems = [
    {
      title: '配置中心',
      icon: 'i-mdi-cog-outline',
      path: '/packageD/pages/config-center/index',
      description: '系统配置总览和快速配置入口',
      adminOnly: true
    },
    {
      title: 'Agent管理',
      icon: 'i-mdi-account-supervisor',
      path: '/packageF/pages/agent-management/index',
      description: 'Agent账号管理和门店分配',
      adminOnly: true
    },
    {
      title: '员工工作台',
      icon: 'i-mdi-account-hard-hat',
      path: '/packageA/pages/employee-workspace/index',
      description: '员工视角的工作中心（3.0新功能）'
    },
    {
      title: '任务管理',
      icon: 'i-mdi-clipboard-list',
      path: '/packageN/pages/task-create/index',
      description: '创建和分配员工任务（管理员）',
      adminOnly: true
    },
    {
      title: '培训管理',
      icon: 'i-mdi-school',
      path: '/packageJ/pages/training-admin/index',
      description: '培训课程管理和员工培训记录（3.0新功能）',
      adminOnly: true
    },
    {
      title: '请假审批',
      icon: 'i-mdi-clipboard-check',
      path: '/packageG/pages/leave-approval/index',
      description: '审批员工休假申请（管理员）',
      adminOnly: true
    },
    {
      title: '租户信息',
      icon: 'i-mdi-domain',
      path: '/packageD/pages/tenant-settings/index',
      description: '查看和修改租户基本信息、品牌配置'
    },
    {
      title: '邀请员工',
      icon: 'i-mdi-account-multiple-plus',
      path: '/packageD/pages/invite-employee/index',
      description: '生成邀请码，邀请员工加入'
    },
    {
      title: '营收管理',
      icon: 'i-mdi-cash-register',
      path: '/packageB/pages/revenue-management/index',
      description: '历史数据导入、月度数据修正、营收预测'
    },
    {
      title: '数据导出',
      icon: 'i-mdi-database-export',
      path: '/packageB/pages/data-export/index',
      description: '导出各类数据报表'
    }
  ]

  // 超级管理员功能
  const superAdminItems =
    currentUser?.role === 'super_admin'
      ? [
          {
            title: '租户管理',
            icon: 'i-mdi-domain',
            path: '/packageD/pages/tenant-management/index',
            description: '创建、编辑和删除租户'
          }
        ]
      : []

  // 快速开始引导
  const handleQuickStart = () => {
    if (!configStatus.hasBrands) {
      Taro.showModal({
        title: '开始配置',
        content: '让我们从创建第一个品牌开始吧！',
        confirmText: '立即创建',
        success: (res) => {
          if (res.confirm) {
            navigateTo({url: '/packageA/pages/brand-management/index'})
          }
        }
      })
    } else if (!configStatus.hasStores) {
      Taro.showModal({
        title: '继续配置',
        content: '品牌已创建，接下来添加门店信息',
        confirmText: '添加门店',
        success: (res) => {
          if (res.confirm) {
            navigateTo({url: '/packageA/pages/stores/index'})
          }
        }
      })
    } else if (!configStatus.hasEmployees) {
      Taro.showModal({
        title: '继续配置',
        content: '门店已添加，接下来录入员工信息',
        confirmText: '添加员工',
        success: (res) => {
          if (res.confirm) {
            navigateTo({url: '/packageA/pages/employees/index'})
          }
        }
      })
    } else {
      Taro.showModal({
        title: '配置完成',
        content: '基础配置已完成！您可以继续完成业务配置，或开始使用系统。',
        confirmText: '业务配置',
        cancelText: '开始使用',
        success: (res) => {
          if (res.confirm) {
            navigateTo({url: '/packageD/pages/brand-config/index'})
          }
        }
      })
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border">
        {/* 使用容器查询支持WEB端响应式 */}
        <View className="@container">
          <View className="p-4 max-w-7xl mx-auto">
            {/* 页面标题 - WEB端优化 */}
            <View className="mb-6">
              <Text className="text-2xl max-sm:text-xl font-bold text-foreground">管理中心</Text>
              <Text className="text-sm text-muted-foreground mt-1">{currentTenant.name}</Text>
            </View>

            {/* 总体配置完成度 */}
            <View className="mb-4 bg-white rounded-lg p-4 border-2 border-gray-200">
              <View className="flex items-center justify-between mb-3">
                <View>
                  <Text className="text-base font-semibold text-foreground">配置完成度</Text>
                  <Text className="text-xs text-muted-foreground mt-0.5">系统配置进度</Text>
                </View>
                <Text className="text-2xl font-bold text-blue-600">{completionStats.completion_rate}%</Text>
              </View>

              {/* 总体进度条 */}
              <View className="bg-muted h-2 rounded-full mb-3 overflow-hidden">
                <View
                  className="bg-blue-100 h-full transition-all"
                  style={{width: `${completionStats.completion_rate}%`}}
                />
              </View>

              {/* 统计信息 */}
              <View className="bg-muted rounded-lg p-3">
                <View className="flex items-center justify-between">
                  <Text className="text-sm text-muted-foreground">已完成配置项</Text>
                  <Text className="text-sm font-semibold text-foreground">
                    {completionStats.completed} / {completionStats.total}
                  </Text>
                </View>
              </View>
            </View>

            {/* 配置检查清单 */}
            <View className="mb-4">
              <View
                className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all"
                onClick={() => setShowChecklist(!showChecklist)}>
                <View className="flex items-center justify-between">
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <View className="i-mdi-clipboard-check text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-foreground">配置检查清单</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">查看详细配置状态</Text>
                    </View>
                  </View>
                  <View className={`i-mdi-chevron-${showChecklist ? 'up' : 'down'} text-xl text-muted-foreground`} />
                </View>
              </View>

              {showChecklist && (
                <View className="mt-3 bg-white rounded-lg p-4 border-2 border-gray-200">
                  {/* 基础配置清单 */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-foreground mb-3">基础配置</Text>
                    <View className="space-y-2">
                      <View className="flex items-center gap-3 py-2">
                        <View
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${configStatus.hasBrands ? 'bg-blue-100' : 'bg-gray-50'}`}>
                          <View
                            className={`i-mdi-${configStatus.hasBrands ? 'check' : 'circle-outline'} text-sm ${configStatus.hasBrands ? 'text-white' : 'text-muted-foreground'}`}
                          />
                        </View>
                        <Text
                          className={`text-sm flex-1 ${configStatus.hasBrands ? 'text-foreground' : 'text-muted-foreground'}`}>
                          创建品牌信息
                          {configStatus.hasBrands && ` (${configStatus.brandCount}个)`}
                        </Text>
                      </View>
                      <View className="flex items-center gap-3 py-2">
                        <View
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${configStatus.hasStores ? 'bg-blue-100' : 'bg-gray-50'}`}>
                          <View
                            className={`i-mdi-${configStatus.hasStores ? 'check' : 'circle-outline'} text-sm ${configStatus.hasStores ? 'text-white' : 'text-muted-foreground'}`}
                          />
                        </View>
                        <Text
                          className={`text-sm flex-1 ${configStatus.hasStores ? 'text-foreground' : 'text-muted-foreground'}`}>
                          添加门店信息
                          {configStatus.hasStores && ` (${configStatus.storeCount}家)`}
                        </Text>
                      </View>
                      <View className="flex items-center gap-3 py-2">
                        <View
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${configStatus.hasEmployees ? 'bg-blue-100' : 'bg-gray-50'}`}>
                          <View
                            className={`i-mdi-${configStatus.hasEmployees ? 'check' : 'circle-outline'} text-sm ${configStatus.hasEmployees ? 'text-white' : 'text-muted-foreground'}`}
                          />
                        </View>
                        <Text
                          className={`text-sm flex-1 ${configStatus.hasEmployees ? 'text-foreground' : 'text-muted-foreground'}`}>
                          录入员工信息
                          {configStatus.hasEmployees && ` (${configStatus.employeeCount}名)`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* 业务配置清单 */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">业务配置</Text>
                    <View className="space-y-2">
                      <View className="flex items-center gap-2">
                        <View
                          className={`i-mdi-${configStatus.hasBrandConfig ? 'check-circle' : 'circle-outline'} text-base ${configStatus.hasBrandConfig ? 'text-blue-600' : 'text-muted-foreground'}`}
                        />
                        <Text
                          className={`text-xs ${configStatus.hasBrandConfig ? 'text-foreground' : 'text-muted-foreground'}`}>
                          配置餐段时间和班次
                        </Text>
                      </View>
                      <View className="flex items-center gap-2">
                        <View
                          className={`i-mdi-${configStatus.hasEfficiency ? 'check-circle' : 'circle-outline'} text-base ${configStatus.hasEfficiency ? 'text-blue-600' : 'text-muted-foreground'}`}
                        />
                        <Text
                          className={`text-xs ${configStatus.hasEfficiency ? 'text-foreground' : 'text-muted-foreground'}`}>
                          设置效能标准
                        </Text>
                      </View>
                      <View className="flex items-center gap-2">
                        <View
                          className={`i-mdi-${configStatus.hasPosition ? 'check-circle' : 'circle-outline'} text-base ${configStatus.hasPosition ? 'text-blue-600' : 'text-muted-foreground'}`}
                        />
                        <Text
                          className={`text-xs ${configStatus.hasPosition ? 'text-foreground' : 'text-muted-foreground'}`}>
                          配置岗位信息
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* 快速开始按钮 */}
            {basicConfigProgress < basicConfigTotal && (
              <View className="mb-4">
                <Button
                  className="w-full bg-blue-100 text-white py-3 rounded-lg break-keep text-sm"
                  size="default"
                  onClick={handleQuickStart}>
                  快速开始配置
                </Button>
              </View>
            )}

            {/* 第一阶段：基础配置 */}
            <View className="mb-4">
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center justify-between mb-4">
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <View className="i-mdi-numeric-1-circle text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-base font-semibold text-foreground">基础配置</Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">必须完成的基础设置</Text>
                    </View>
                  </View>
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-xs text-white font-semibold">必须</Text>
                  </View>
                </View>

                {/* 进度条 */}
                <View className="bg-muted h-2 rounded-full mb-5 overflow-hidden">
                  <View className="bg-blue-100 h-full transition-all" style={{width: `${basicConfigPercent}%`}} />
                </View>

                {/* 基础配置项 - WEB端优化为2列布局 */}
                <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                  {basicConfigItems.map((item, index) => (
                    <View
                      key={index}
                      className="bg-muted rounded-lg p-4 active:opacity-80 transition-all border border-border cursor-pointer"
                      onClick={() => navigateTo({url: item.path})}>
                      <View className="flex items-center gap-3">
                        {/* 完成状态图标 */}
                        {item.completed ? (
                          <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center  flex-shrink-0">
                            <View className="i-mdi-check-circle text-xl text-white" />
                          </View>
                        ) : (
                          <View className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center  flex-shrink-0">
                            <View className={`${item.icon} text-2xl text-muted-foreground`} />
                          </View>
                        )}

                        {/* 内容 */}
                        <View className="flex-1">
                          <View className="flex items-center gap-2 mb-1">
                            <Text className="text-base max-sm:text-sm font-bold text-foreground">{item.title}</Text>
                            {item.completed && item.count > 0 && (
                              <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                                <Text className="text-xs text-white">
                                  {item.count} {item.countLabel}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-xs text-muted-foreground">{item.description}</Text>
                        </View>

                        {/* 箭头 */}
                        <View className="i-mdi-chevron-right text-2xl text-muted-foreground flex-shrink-0" />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 第二阶段：业务配置 */}
            <View className="mb-4">
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center justify-between mb-4">
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center ">
                      <View className="i-mdi-numeric-2-circle text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-foreground">业务配置</Text>
                      <Text className="text-xs text-muted-foreground">推荐完成的业务设置</Text>
                    </View>
                  </View>
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-xs text-white font-semibold">推荐</Text>
                  </View>
                </View>

                {/* 进度条 */}
                <View className="bg-muted h-2 rounded-full mb-5 overflow-hidden">
                  <View
                    className="bg-blue-100 h-full transition-all"
                    style={{width: `${completionStats.completion_rate}%`}}
                  />
                </View>

                {/* 业务配置项 - WEB端优化为2列布局 */}
                <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                  {businessConfigItems.map((item, index) => (
                    <View
                      key={index}
                      className="bg-muted rounded-lg p-4 active:opacity-80 transition-all border border-border cursor-pointer"
                      onClick={() => navigateTo({url: item.path})}>
                      <View className="flex items-center gap-3">
                        {/* 完成状态图标 */}
                        {item.completed ? (
                          <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center  flex-shrink-0">
                            <View className="i-mdi-check-circle text-xl text-white" />
                          </View>
                        ) : (
                          <View className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center  flex-shrink-0">
                            <View className={`${item.icon} text-2xl text-muted-foreground`} />
                          </View>
                        )}

                        <View className="flex-1">
                          <Text className="text-base max-sm:text-sm font-bold text-foreground mb-1">{item.title}</Text>
                          <Text className="text-xs text-muted-foreground">{item.description}</Text>
                        </View>
                        <View className="i-mdi-chevron-right text-2xl text-muted-foreground flex-shrink-0" />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* 第三阶段：高级功能 */}
            <View className="mb-4">
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center justify-between mb-4">
                  <View className="flex items-center gap-3">
                    <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center ">
                      <View className="i-mdi-numeric-3-circle text-xl text-blue-600" />
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-foreground">高级功能</Text>
                      <Text className="text-xs text-muted-foreground">可选的高级功能</Text>
                    </View>
                  </View>
                  <View className="bg-blue-100 px-3 py-1 rounded-full">
                    <Text className="text-xs text-white font-semibold">可选</Text>
                  </View>
                </View>

                {/* 高级功能项 - WEB端优化为2列布局 */}
                <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                  {advancedItems
                    .filter(
                      (item) =>
                        !item.adminOnly ||
                        currentUser?.role === 'tenant_admin' ||
                        currentUser?.role === 'super_admin' ||
                        currentUser?.role === 'store_manager'
                    )
                    .map((item, index) => (
                      <View
                        key={index}
                        className="bg-muted rounded-lg p-4 active:opacity-80 transition-all border border-border cursor-pointer"
                        onClick={() => {
                          console.log('点击高级功能项:', item.title, '路径:', item.path)
                          Taro.showToast({
                            title: `正在打开${item.title}...`,
                            icon: 'loading',
                            duration: 1000
                          })
                          navigateTo({url: item.path}).catch((err) => {
                            console.error('导航失败:', err)
                            Taro.showToast({
                              title: '页面打开失败',
                              icon: 'error'
                            })
                          })
                        }}>
                        <View className="flex items-center gap-3">
                          <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center  flex-shrink-0">
                            <View className={`${item.icon} text-xl text-blue-600`} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-base max-sm:text-sm font-bold text-foreground mb-1">
                              {item.title}
                            </Text>
                            <Text className="text-xs text-muted-foreground">{item.description}</Text>
                          </View>
                          <View className="i-mdi-chevron-right text-2xl text-muted-foreground flex-shrink-0" />
                        </View>
                      </View>
                    ))}
                </View>
              </View>
            </View>

            {/* 超级管理员功能 - WEB端优化 */}
            {superAdminItems.length > 0 && (
              <View className="mb-6">
                <View className="flex items-center gap-2 mb-3">
                  <View className="i-mdi-shield-crown text-2xl text-muted-foreground" />
                  <Text className="text-lg max-sm:text-base font-bold text-foreground">超级管理员</Text>
                </View>

                {/* WEB端优化为2列布局 */}
                <View className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                  {superAdminItems.map((item, index) => (
                    <View
                      key={index}
                      className="bg-white rounded-xl p-4 border-2 border-gray-200 active:scale-98 transition-all cursor-pointer"
                      onClick={() => navigateTo({url: item.path})}>
                      <View className="flex items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <View className={`${item.icon} text-2xl text-muted-foreground`} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base max-sm:text-sm font-bold text-foreground block mb-1">
                            {item.title}
                          </Text>
                          <Text className="text-xs text-muted-foreground block">{item.description}</Text>
                        </View>
                        <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 配置建议 */}
            {completionStats.completion_rate < 100 && (
              <View className="bg-blue-100 border border-border rounded-xl p-4 mb-4">
                <View className="flex items-start gap-3">
                  <View className="i-mdi-lightbulb text-2xl text-muted-foreground" />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-blue-600 block mb-2">配置建议</Text>
                    {basicConfigProgress < basicConfigTotal && (
                      <View className="mb-2">
                        <Text className="text-xs text-blue-600 block">
                          • 请先完成基础配置（品牌、门店、员工），这是使用系统的前提条件
                        </Text>
                      </View>
                    )}
                    {basicConfigProgress === basicConfigTotal && completionStats.completed < completionStats.total && (
                      <View className="mb-2">
                        <Text className="text-xs text-blue-600 block">
                          • 建议完成业务配置（餐段、效能标准、岗位），以便更好地使用排班功能
                        </Text>
                      </View>
                    )}
                    <Text className="text-xs text-muted-foreground block mt-2">
                      💡 提示：点击"快速开始配置"按钮，系统会引导您逐步完成配置
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 底部提示 */}
            {completionStats.completion_rate === 100 ? (
              <View className="bg-blue-100 border border-border rounded-xl p-4 mb-4">
                <View className="flex items-start gap-3">
                  <View className="i-mdi-trophy text-3xl text-yellow-500" />
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground block mb-1">🎉 恭喜！所有配置已完成</Text>
                    <Text className="text-xs text-foreground block mb-2">
                      您已完成所有基础配置和业务配置，现在可以开始使用系统的全部功能了！
                    </Text>
                    <Text className="text-xs text-muted-foreground block">
                      💡 建议：返回首页开始创建排班计划，或查看数据分析了解运营情况
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              basicConfigProgress === basicConfigTotal && (
                <View className="bg-blue-100 border border-border rounded-xl p-4 mb-4">
                  <View className="flex items-start gap-3">
                    <View className="i-mdi-check-circle text-2xl text-muted-foreground" />
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-green-600 block mb-1">基础配置已完成！</Text>
                      <Text className="text-xs text-green-600 block">
                        您可以继续完成业务配置，或直接开始使用系统进行排班管理。
                      </Text>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default _Management
