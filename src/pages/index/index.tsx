/**
 * 员工工作台页面 - 优化版
 * 设计理念：容易学、容易做、容易管
 *
 * 核心优化：
 * 1. 简化功能入口 - 只展示最常用的功能
 * 2. 清晰的视觉层次 - 卡片式布局，一目了然
 * 3. 快速操作 - 一键直达，减少点击次数
 * 4. 智能推荐 - 根据用户角色展示相关功能
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 快捷操作配置
interface QuickAction {
  id: string
  name: string
  desc: string
  icon: string
  iconColor: string
  bgColor: string
  path: string
}

// 核心功能 - 只保留最常用的8个功能
const CORE_ACTIONS: QuickAction[] = [
  {
    id: 'work-log',
    name: '工作记录',
    desc: '记录每日工作',
    icon: 'i-mdi-notebook-edit',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    path: '/pages/work-log/index'
  },
  {
    id: 'attendance',
    name: '考勤打卡',
    desc: '上下班打卡',
    icon: 'i-mdi-clock-check',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    path: '/packageG/pages/working/attendance/index'
  },
  {
    id: 'my-schedule',
    name: '我的班次',
    desc: '查看排班表',
    icon: 'i-mdi-calendar-today',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    path: '/packageB/pages/scheduling/index'
  },
  {
    id: 'leave',
    name: '请假申请',
    desc: '提交请假单',
    icon: 'i-mdi-calendar-clock',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    path: '/packageG/pages/my-leave/index'
  },
  {
    id: 'onboarding',
    name: '我的入职',
    desc: '入职流程跟踪',
    icon: 'i-mdi-account-check',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    path: '/packageH/pages/my-onboarding/index'
  },
  {
    id: 'training',
    name: '我的培训',
    desc: '培训课程学习',
    icon: 'i-mdi-school',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    path: '/packageJ/pages/my-training/index'
  },
  {
    id: 'performance',
    name: '我的绩效',
    desc: '绩效考核查看',
    icon: 'i-mdi-chart-line',
    iconColor: 'text-green-600',
    bgColor: 'bg-blue-100',
    path: '/packageF/pages/my-performance/index'
  },
  {
    id: 'salary',
    name: '我的薪酬',
    desc: '工资明细查询',
    icon: 'i-mdi-cash',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    path: '/packageF/pages/my-salary/index'
  }
]

// 管理功能 - 仅管理员可见
const ADMIN_ACTIONS: QuickAction[] = [
  {
    id: 'employee-manage',
    name: '员工管理',
    desc: '员工全生命周期管理',
    icon: 'i-mdi-account-group',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    path: '/pages/employee-hub/index'
  },
  {
    id: 'onboarding-manage',
    name: '入职管理',
    desc: '入职全流程管理',
    icon: 'i-mdi-account-plus',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    path: '/packageH/pages/onboarding-management/index'
  },
  {
    id: 'offboarding-manage',
    name: '离职管理',
    desc: '离职全流程管理',
    icon: 'i-mdi-account-remove',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    path: '/packageH/pages/offboarding-management/index'
  },
  {
    id: 'schedule-manage',
    name: '排班管理',
    desc: '智能排班配置',
    icon: 'i-mdi-calendar-multiple',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    path: '/packageB/pages/schedule-center/index'
  }
]

const EmployeeWorkspace: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 员工信息
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [_loading, setLoading] = useState(true)

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了'
  }

  // 获取日期字符串
  const getDateString = () => {
    const date = new Date()
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDay = weekDays[date.getDay()]
    return `${year}年${month}月${day}日 ${weekDay}`
  }

  // 加载员工信息
  const loadEmployee = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const data = await getEmployeeByUserId(user.id)
      setEmployee(data)
    } catch (error) {
      console.error('加载员工信息失败:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadEmployee()
  })

  // 刷新数据
  const handleRefresh = () => {
    Taro.showLoading({title: '刷新中...'})
    loadEmployee().finally(() => {
      Taro.hideLoading()
      Taro.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    })
  }

  // 处理功能卡片点击
  const handleActionClick = (path: string) => {
    Taro.navigateTo({url: path})
  }

  // 租户检查
  if (!currentTenant) {
    return (
      <View className="min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border bg-transparent">
          <View className="p-4">
            {/* 空状态卡片 */}
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 mt-20">
              {/* 大图标 */}
              <View className="flex justify-center mb-6">
                <View className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-office-building text-5xl text-muted-foreground" />
                </View>
              </View>

              {/* 标题 */}
              <Text className="text-2xl font-bold text-center text-foreground mb-3">请先选择租户</Text>

              {/* 描述 */}
              <Text className="text-sm text-center text-muted-foreground leading-relaxed mb-6">
                工作台需要在租户上下文中使用{'\n'}
                请先选择一个租户，然后开始您的工作
              </Text>

              {/* 操作按钮 */}
              <View
                className="w-full bg-blue-600 text-white py-4 rounded-xl active:opacity-80"
                onClick={() => {
                  Taro.navigateTo({
                    url: '/pages/tenant-select/index',
                    fail: (err) => {
                      console.error('导航失败:', err)
                      Taro.showToast({title: '页面跳转失败', icon: 'none'})
                    }
                  })
                }}>
                <View className="flex items-center justify-center gap-2">
                  <View className="i-mdi-office-building text-xl text-blue-600" />
                  <Text className="text-base text-white font-medium">选择租户</Text>
                </View>
              </View>

              {/* 帮助提示 */}
              <View className="mt-6 bg-blue-100 rounded-xl p-4">
                <View className="flex items-center gap-2 mb-2">
                  <View className="i-mdi-information text-lg text-muted-foreground" />
                  <Text className="text-sm font-bold text-foreground">温馨提示</Text>
                </View>
                <Text className="text-xs text-muted-foreground leading-relaxed">
                  • 如果您还没有租户，请先创建或加入一个{'\n'}• 租户是系统的基本管理单元{'\n'}•
                  每个租户拥有独立的数据和配置
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 顶部问候卡片 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 relative">
            {/* 刷新按钮 */}
            <View
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center active:opacity-70"
              onClick={handleRefresh}>
              <View className="i-mdi-refresh text-lg text-gray-600" />
            </View>

            <View className="flex items-center justify-between mb-4 pr-10">
              <View className="flex-1">
                <Text className="text-foreground text-2xl font-bold mb-1">{getGreeting()}！</Text>
                <Text className="text-muted-foreground text-sm mb-2">{getDateString()}</Text>
                <Text className="text-foreground text-base">{employee?.name || '员工'}，欢迎使用餐时间工作台</Text>
              </View>
              <View className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <View className="i-mdi-account-circle text-4xl text-blue-600" />
              </View>
            </View>

            {/* 租户信息 */}
            <View className="bg-blue-100 rounded-lg p-4">
              <View className="flex items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-office-building text-lg text-blue-600" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted-foreground mb-0.5">当前租户</Text>
                  <Text className="text-sm font-bold text-foreground">{currentTenant.name}</Text>
                </View>
                <View
                  className="px-3 py-1.5 bg-white rounded-lg shadow-sm active:opacity-70"
                  onClick={() => Taro.navigateTo({url: '/pages/tenant-select/index'})}>
                  <Text className="text-xs text-muted-foreground font-medium">切换</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 快速开始提示卡片 */}
          <View className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200 mb-4">
            <View className="flex items-center gap-3">
              <View className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <View className="i-mdi-rocket-launch text-2xl text-white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground mb-1">新手？快速开始</Text>
                <Text className="text-xs text-muted-foreground">
                  {employee ? '了解系统功能，快速上手' : '完成配置，开始使用系统'}
                </Text>
              </View>
              <View
                className="px-4 py-2 bg-green-500 rounded-lg active:opacity-80"
                onClick={() => Taro.navigateTo({url: '/pages/quick-start/index'})}>
                <Text className="text-sm text-white font-medium">开始</Text>
              </View>
            </View>
          </View>

          {/* 快捷功能区 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4">
            <View className="flex items-center justify-between mb-5">
              <View className="flex items-center gap-3">
                <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-apps text-2xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">常用功能</Text>
                  <Text className="text-xs text-muted-foreground">一键直达，高效办公</Text>
                </View>
              </View>
            </View>

            {/* 功能网格 */}
            <View className="flex flex-row flex-wrap -mx-1.5">
              {CORE_ACTIONS.map((action) => (
                <View key={action.id} className="w-1/4 px-1.5 mb-4">
                  <View className="flex flex-col items-center" onClick={() => handleActionClick(action.path)}>
                    <View
                      className={`w-14 h-14 rounded-lg bg-gradient-to-br ${action.bgColor.replace('bg-', 'from-')} ${action.bgColor.replace('bg-', 'to-').replace('-50', '-100')} flex items-center justify-center mb-2 active:scale-95 transition-all`}>
                      <View className={`${action.icon} text-2xl ${action.iconColor}`} />
                    </View>
                    <Text className="text-xs text-center text-foreground font-medium break-keep leading-tight">
                      {action.name}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 管理功能区 - 仅管理员可见 */}
          {employee?.position === '店长' || employee?.position === '经理' ? (
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4">
              <View className="flex items-center justify-between mb-5">
                <View className="flex items-center gap-3">
                  <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <View className="i-mdi-shield-crown text-2xl text-blue-600" />
                  </View>
                  <View>
                    <Text className="text-lg font-bold text-foreground">管理功能</Text>
                    <Text className="text-xs text-muted-foreground">专属管理工具</Text>
                  </View>
                </View>
                <View className="bg-blue-100 px-3 py-1 rounded-full shadow-sm">
                  <Text className="text-xs text-foreground font-bold">管理员</Text>
                </View>
              </View>

              {/* 管理功能网格 */}
              <View className="flex flex-row flex-wrap -mx-1.5">
                {ADMIN_ACTIONS.map((action) => (
                  <View key={action.id} className="w-1/4 px-1.5 mb-4">
                    <View className="flex flex-col items-center" onClick={() => handleActionClick(action.path)}>
                      <View
                        className={`w-14 h-14 rounded-lg bg-gradient-to-br ${action.bgColor.replace('bg-', 'from-')} ${action.bgColor.replace('bg-', 'to-').replace('-100', '-200')} flex items-center justify-center mb-2 active:scale-95 transition-all`}>
                        <View className={`${action.icon} text-2xl ${action.iconColor}`} />
                      </View>
                      <Text className="text-xs text-center text-foreground font-medium break-keep leading-tight">
                        {action.name}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* 今日提示卡片 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4">
            <View className="flex items-start gap-3">
              <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <View className="i-mdi-lightbulb text-2xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground mb-2">温馨提示</Text>
                <Text className="text-sm text-foreground leading-relaxed">
                  • 记得及时填写工作日志{'\n'}• 完成今日考勤打卡{'\n'}• 如有请假需求，请提前提交申请
                </Text>
              </View>
            </View>
          </View>

          {/* 底部占位 */}
          <View className="h-4" />
        </View>
      </ScrollView>
    </View>
  )
}

export default EmployeeWorkspace
