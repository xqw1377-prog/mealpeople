/**
 * 快速开始向导页面
 * 根据用户角色提供不同的引导流程
 * 设计理念：易学、易做、易管
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {getCurrentUser, getEmployeeByUserId} from '@/db/api'
import type {Employee, Profile} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 配置步骤接口
interface SetupStep {
  id: string
  title: string
  description: string
  icon: string
  action: string
  actionText: string
  completed: boolean
  order: number
}

export default function QuickStart() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [_employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState<SetupStep[]>([])

  // 根据角色生成配置步骤
  const generateSteps = useCallback(
    (role: string, emp: Employee | null) => {
      let stepList: SetupStep[] = []

      if (role === 'super_admin') {
        // 超级管理员 - 平台管理
        stepList = [
          {
            id: 'tenants',
            title: '管理租户',
            description: '查看和管理所有租户',
            icon: 'i-mdi-domain',
            action: '/packageD/pages/super-admin-tenants/index',
            actionText: '进入租户管理',
            completed: false,
            order: 1
          },
          {
            id: 'applications',
            title: '审核申请',
            description: '处理租户申请和审核',
            icon: 'i-mdi-file-document-check',
            action: '/packageD/pages/tenant-applications/index',
            actionText: '查看申请列表',
            completed: false,
            order: 2
          }
        ]
      } else if (role === 'tenant_admin') {
        // 租户管理员 - 系统配置
        stepList = [
          {
            id: 'tenant-info',
            title: '第1步：完善租户信息',
            description: '设置企业名称、行业类型等基本信息',
            icon: 'i-mdi-office-building',
            action: '/packageD/pages/tenant-settings/index',
            actionText: '配置租户信息',
            completed: !!currentTenant.name,
            order: 1
          },
          {
            id: 'stores',
            title: '第2步：添加门店',
            description: '创建门店，设置店经理',
            icon: 'i-mdi-store',
            action: '/packageD/pages/store-management/index',
            actionText: '管理门店',
            completed: false,
            order: 2
          },
          {
            id: 'positions',
            title: '第3步：配置岗位',
            description: '设置岗位信息和职级体系',
            icon: 'i-mdi-briefcase',
            action: '/packageD/pages/position-management/index',
            actionText: '管理岗位',
            completed: false,
            order: 3
          },
          {
            id: 'employees',
            title: '第4步：导入员工',
            description: '批量导入或手动添加员工',
            icon: 'i-mdi-account-multiple-plus',
            action: '/packageA/pages/employees/index',
            actionText: '管理员工',
            completed: false,
            order: 4
          },
          {
            id: 'config',
            title: '第5步：完成配置',
            description: '查看配置中心，完善其他设置',
            icon: 'i-mdi-check-circle',
            action: '/packageD/pages/config-center/index',
            actionText: '进入配置中心',
            completed: false,
            order: 5
          }
        ]
      } else if (role === 'agent') {
        // Agent（区域经理/督导）- 区域管理
        stepList = [
          {
            id: 'workspace',
            title: '查看我的门店',
            description: '了解分配给我的门店',
            icon: 'i-mdi-store-check',
            action: '/packageF/pages/agent-workspace/index',
            actionText: '进入工作台',
            completed: false,
            order: 1
          },
          {
            id: 'employees',
            title: '员工管理',
            description: '查看和管理门店员工',
            icon: 'i-mdi-account-group',
            action: '/packageA/pages/employee-list/index',
            actionText: '查看员工',
            completed: false,
            order: 2
          },
          {
            id: 'analytics',
            title: '数据分析',
            description: '查看运营数据和成本分析',
            icon: 'i-mdi-chart-line',
            action: '/pages/operations/index',
            actionText: '查看数据',
            completed: false,
            order: 3
          }
        ]
      } else if (role === 'store_manager') {
        // 店经理 - 门店管理
        stepList = [
          {
            id: 'employees',
            title: '查看员工',
            description: '了解门店员工信息',
            icon: 'i-mdi-account-group',
            action: '/packageA/pages/employees/index',
            actionText: '查看员工列表',
            completed: false,
            order: 1
          },
          {
            id: 'schedule',
            title: '排班管理',
            description: '创建和管理员工排班',
            icon: 'i-mdi-calendar-clock',
            action: '/packageA/pages/schedule-management/index',
            actionText: '进入排班管理',
            completed: false,
            order: 2
          },
          {
            id: 'attendance',
            title: '考勤管理',
            description: '查看员工考勤记录',
            icon: 'i-mdi-clock-check',
            action: '/packageA/pages/attendance-management/index',
            actionText: '查看考勤',
            completed: false,
            order: 3
          }
        ]
      } else {
        // 普通员工 - 日常使用
        stepList = [
          {
            id: 'profile',
            title: '完善个人信息',
            description: '查看和更新个人资料',
            icon: 'i-mdi-account-circle',
            action: '/pages/profile/index',
            actionText: '查看个人信息',
            completed: !!emp,
            order: 1
          },
          {
            id: 'schedule',
            title: '查看我的班次',
            description: '了解本周排班安排',
            icon: 'i-mdi-calendar-today',
            action: '/packageB/pages/scheduling/index',
            actionText: '查看排班',
            completed: false,
            order: 2
          },
          {
            id: 'work-log',
            title: '记录工作日志',
            description: '每日工作记录和总结',
            icon: 'i-mdi-notebook-edit',
            action: '/pages/work-log/index',
            actionText: '写工作日志',
            completed: false,
            order: 3
          }
        ]
      }

      setSteps(stepList)
    },
    [currentTenant]
  )

  // 加载用户信息
  const loadUserInfo = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // 获取用户profile
      const p = await getCurrentUser()
      setProfile(p)

      // 获取员工信息
      const emp = await getEmployeeByUserId(user.id)
      setEmployee(emp)

      // 根据角色生成步骤
      if (p) {
        generateSteps(p.role, emp)
      }
    } catch (error) {
      console.error('加载用户信息失败:', error)
      Taro.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user, generateSteps])

  useDidShow(() => {
    loadUserInfo()
  })

  // 刷新数据
  const handleRefresh = () => {
    Taro.showLoading({title: '刷新中...'})
    loadUserInfo().finally(() => {
      Taro.hideLoading()
      Taro.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    })
  }

  // 执行步骤操作
  const handleStepAction = (step: SetupStep) => {
    Taro.navigateTo({
      url: step.action
    })
  }

  // 跳过向导
  const handleSkip = () => {
    Taro.showModal({
      title: '跳过向导',
      content: '您可以随时在"我的"页面重新打开快速开始向导',
      confirmText: '确定跳过',
      cancelText: '继续配置',
      success: (res) => {
        if (res.confirm) {
          Taro.switchTab({url: '/pages/index/index'})
        }
      }
    })
  }

  if (loading) {
    return <LoadingCards />
  }

  // 获取角色名称
  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      super_admin: '超级管理员',
      tenant_admin: '租户管理员',
      agent: 'Agent',
      store_manager: '店经理',
      employee: '员工',
      guest: '访客'
    }
    return roleMap[role] || '用户'
  }

  // 获取欢迎语
  const getWelcomeMessage = (role: string) => {
    const messageMap: Record<string, string> = {
      super_admin: '您可以管理所有租户和系统配置',
      tenant_admin: '让我们用5步完成系统配置，开始使用',
      agent: '管理您的门店，查看运营数据',
      store_manager: '了解门店管理的核心功能',
      employee: '欢迎使用，让我们快速了解系统功能',
      guest: '请联系管理员分配角色'
    }
    return messageMap[role] || '欢迎使用系统'
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 欢迎卡片 */}
          <View className="bg-white rounded-2xl p-6 mb-6 shadow-sm relative">
            {/* 刷新按钮 */}
            <View
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:opacity-70"
              onClick={handleRefresh}>
              <View className="i-mdi-refresh text-lg text-gray-600" />
            </View>

            <View className="flex items-center gap-4 mb-4 pr-10">
              <View className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <View className="i-mdi-hand-wave text-4xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 block mb-1">
                  欢迎，{profile?.role ? getRoleName(profile.role) : '用户'}
                </Text>
                <Text className="text-sm text-gray-600 block">
                  {profile?.role ? getWelcomeMessage(profile.role) : '加载中...'}
                </Text>
              </View>
            </View>

            {/* 角色标识 */}
            <View className="bg-blue-50 rounded-lg p-3 flex flex-row items-center gap-2">
              <View className="i-mdi-shield-account text-xl text-blue-600" />
              <Text className="text-sm text-blue-900">
                当前角色：<Text className="font-semibold">{profile?.role ? getRoleName(profile.role) : '未知'}</Text>
              </Text>
            </View>
          </View>

          {/* 配置步骤列表 */}
          <View className="mb-6">
            <View className="mb-4">
              <Text className="text-lg font-bold text-gray-900 block mb-1">
                {profile?.role === 'tenant_admin' ? '配置向导' : '快速开始'}
              </Text>
              <Text className="text-sm text-gray-600 block">
                {profile?.role === 'tenant_admin' ? '按照步骤完成配置，即可开始使用系统' : '了解核心功能，快速上手'}
              </Text>
            </View>

            {steps.map((step, index) => (
              <View key={step.id} className="mb-3">
                <View className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100">
                  <View className="flex items-start gap-3">
                    {/* 步骤图标 */}
                    <View
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        step.completed ? 'bg-green-100' : 'bg-blue-50'
                      }`}>
                      <View
                        className={`${step.icon} text-2xl ${step.completed ? 'text-green-600' : 'text-blue-600'}`}
                      />
                    </View>

                    {/* 步骤内容 */}
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-1">
                        <Text className="text-base font-semibold text-gray-900">{step.title}</Text>
                        {step.completed && (
                          <View className="bg-green-100 px-2 py-0.5 rounded">
                            <Text className="text-xs text-green-700">已完成</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm text-gray-600 block mb-3">{step.description}</Text>

                      {/* 操作按钮 */}
                      <Button
                        className="bg-blue-600 text-white py-2 px-4 rounded-lg break-keep text-sm"
                        size="default"
                        onClick={() => handleStepAction(step)}>
                        {step.actionText}
                      </Button>
                    </View>
                  </View>
                </View>

                {/* 连接线 */}
                {index < steps.length - 1 && (
                  <View className="ml-6 h-4 w-0.5 bg-gray-200" style={{marginLeft: '24px'}} />
                )}
              </View>
            ))}
          </View>

          {/* 底部操作 */}
          <View className="flex flex-col gap-3">
            <Button
              className="w-full bg-blue-600 text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={() => Taro.switchTab({url: '/pages/index/index'})}>
              进入工作台
            </Button>

            <Button
              className="w-full bg-white text-gray-600 py-4 rounded-lg break-keep text-base border-2 border-gray-200"
              size="default"
              onClick={handleSkip}>
              跳过向导
            </Button>
          </View>

          {/* 帮助提示 */}
          <View className="bg-yellow-50 rounded-lg p-4 mt-6">
            <View className="flex items-start gap-2">
              <View className="i-mdi-lightbulb text-xl text-yellow-600 flex-shrink-0 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-yellow-900 block mb-1">温馨提示</Text>
                <Text className="text-xs text-yellow-800 leading-relaxed">
                  {profile?.role === 'tenant_admin'
                    ? '建议按照步骤顺序完成配置，这样可以确保系统正常运行。如有疑问，可以查看配置中心的"快速参考"。'
                    : '您可以随时在"我的"页面找到快速开始向导。如需帮助，请联系管理员。'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
