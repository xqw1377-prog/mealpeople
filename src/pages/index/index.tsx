/**
 * 工作台（首页）· 工作旅途 DS 重设计版 V2（2026-10-05）
 * 设计定调样板页：
 *  - 品牌主色 primary（暖橙）贯穿，告别多色渐变堆叠
 *  - 单一视觉重心：HeroHeader + 数据条 + 功能宫格
 *  - 功能全部保留，路径不变；图标统一 iconify
 */
import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

interface QuickAction {
  id: string
  name: string
  icon: string
  tone: 'primary' | 'success' | 'info' | 'warning'
  path: string
}

// 员工常用功能（图标统一 iconify；色调四档轮换，不再逐项渐变）
const CORE_ACTIONS: QuickAction[] = [
  {id: 'work-log', name: '工作记录', icon: 'i-mdi-notebook-edit-outline', tone: 'info', path: '/pages/work-log/index'},
  {id: 'attendance', name: '考勤打卡', icon: 'i-mdi-clock-check-outline', tone: 'success', path: '/packageG/pages/working/attendance/index'},
  {id: 'my-schedule', name: '我的班次', icon: 'i-mdi-calendar-today', tone: 'primary', path: '/packageB/pages/scheduling/index'},
  {id: 'leave', name: '请假申请', icon: 'i-mdi-calendar-clock', tone: 'warning', path: '/packageG/pages/my-leave/index'},
  {id: 'onboarding', name: '我的入职', icon: 'i-mdi-account-check-outline', tone: 'info', path: '/packageH/pages/my-onboarding/index'},
  {id: 'training', name: '我的培训', icon: 'i-mdi-school-outline', tone: 'primary', path: '/packageJ/pages/my-training/index'},
  {id: 'performance', name: '我的绩效', icon: 'i-mdi-chart-line', tone: 'success', path: '/packageF/pages/my-performance/index'},
  {id: 'salary', name: '我的薪酬', icon: 'i-mdi-cash-multiple', tone: 'warning', path: '/packageF/pages/my-salary/index'},
]

// 管理功能（仅店长/经理可见）
const ADMIN_ACTIONS: QuickAction[] = [
  {id: 'employee-manage', name: '员工管理', icon: 'i-mdi-account-group-outline', tone: 'primary', path: '/pages/employee-hub/index'},
  {id: 'onboarding-manage', name: '入职管理', icon: 'i-mdi-account-plus-outline', tone: 'info', path: '/packageH/pages/onboarding-management/index'},
  {id: 'offboarding-manage', name: '离职管理', icon: 'i-mdi-account-remove-outline', tone: 'warning', path: '/packageH/pages/offboarding-management/index'},
  {id: 'schedule-manage', name: '排班管理', icon: 'i-mdi-calendar-month-outline', tone: 'success', path: '/packageB/pages/schedule-center/index'},
]

const TONE_BG: Record<QuickAction['tone'], string> = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  info: 'bg-info-50 text-info-600',
  warning: 'bg-warning-50 text-warning-600',
}

function ActionGrid({actions}: {actions: QuickAction[]}) {
  return (
    <View className='grid grid-cols-4 gap-y-5'>
      {actions.map(a => (
        <View
          key={a.id}
          className='flex flex-col items-center'
          hoverClass='opacity-70'
          onClick={() => Taro.navigateTo({url: a.path})}
        >
          <View className={`w-12 h-12 rounded-xl flex items-center justify-center ${TONE_BG[a.tone]}`}>
            <Text className={`${a.icon} text-2xl`} />
          </View>
          <Text className='mt-1.5 text-xs text-gray-700 leading-tight'>{a.name}</Text>
        </View>
      ))}
    </View>
  )
}

const EmployeeWorkspace: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 6) return '夜深了'
    if (h < 9) return '早上好'
    if (h < 12) return '上午好'
    if (h < 14) return '中午好'
    if (h < 18) return '下午好'
    if (h < 22) return '晚上好'
    return '夜深了'
  }

  const getDateString = () => {
    const d = new Date()
    const w = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
    return `${d.getMonth() + 1}月${d.getDate()}日 ${w}`
  }

  const loadEmployee = useCallback(async () => {
    if (!user?.id) return
    try {
      setEmployee(await getEmployeeByUserId(user.id))
    } catch (e) {
      console.error('加载员工信息失败:', e)
    }
  }, [user?.id])

  useDidShow(() => { loadEmployee() })

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadEmployee()
    setRefreshing(false)
    Taro.showToast({title: '已刷新', icon: 'success', duration: 1200})
  }

  const isAdmin = employee?.position === '店长' || employee?.position === '经理'

  // ---- 未选租户：引导空态 ----
  if (!currentTenant) {
    return (
      <View className='min-h-screen bg-gray-50 flex flex-col items-center justify-center px-8'>
        <View className='w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center'>
          <Text className='i-mdi-office-building-outline text-5xl text-primary-500' />
        </View>
        <Text className='mt-5 text-lg font-bold text-gray-900'>请先选择企业</Text>
        <Text className='mt-2 text-sm text-gray-400 text-center leading-relaxed'>
          工作台需要在企业上下文中使用{'\n'}选择一个企业后开始工作
        </Text>
        <View
          className='mt-8 px-10 py-3 rounded-full bg-primary-500 text-white text-sm font-medium'
          hoverClass='opacity-80'
          onClick={() => Taro.navigateTo({url: '/pages/tenant-select/index'})}
        >
          选择企业
        </View>
      </View>
    )
  }

  // ---- 主界面 ----
  return (
    <View className='min-h-screen bg-gray-50'>
      <ScrollView scrollY className='h-screen box-border bg-transparent'>
        {/* 沉浸式品牌头 */}
        <View className='relative overflow-hidden bg-primary-500 px-4 pt-12 pb-16'>
          <View className='absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10' />
          <View className='absolute top-8 right-20 w-20 h-20 rounded-full bg-white/5' />
          <View className='relative flex items-start justify-between'>
            <View>
              <View className='flex items-center'>
                <Text className='text-xl font-bold text-white'>{getGreeting()}，{employee?.name || '同事'}</Text>
              </View>
              <Text className='mt-1 text-xs text-white/75'>{getDateString()} · {currentTenant.name}</Text>
            </View>
            <View className='flex items-center gap-1.5' onClick={handleRefresh}>
              <Text className={`i-mdi-refresh text-lg text-white/90 ${refreshing ? 'animate-spin' : ''}`} />
              <Text className='text-xs text-white/75'>刷新</Text>
            </View>
          </View>
        </View>

        {/* 今日概况条（叠加在 Hero 底沿） */}
        <View className='px-4 -mt-10 relative z-10'>
          <View className='bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center'>
            <View className='flex-1 text-center'>
              <Text className='i-mdi-calendar-check-outline text-base text-primary-500' />
              <Text className='block mt-1 text-xs text-gray-400'>今日班次</Text>
              <Text className='text-sm font-semibold text-gray-900'>待查询</Text>
            </View>
            <View className='w-px h-8 bg-gray-100' />
            <View className='flex-1 text-center'>
              <Text className='i-mdi-clock-fast text-base text-success-500' />
              <Text className='block mt-1 text-xs text-gray-400'>打卡状态</Text>
              <Text className='text-sm font-semibold text-gray-900'>未打卡</Text>
            </View>
            <View className='w-px h-8 bg-gray-100' />
            <View
              className='flex-1 text-center'
              onClick={() => Taro.navigateTo({url: '/pages/quick-start/index'})}
              hoverClass='opacity-70'
            >
              <Text className='i-mdi-rocket-launch-outline text-base text-warning-500' />
              <Text className='block mt-1 text-xs text-gray-400'>新手引导</Text>
              <Text className='text-sm font-semibold text-primary-600'>去开始</Text>
            </View>
          </View>
        </View>

        {/* 常用功能 */}
        <View className='mx-4 mt-4 bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'>
          <View className='flex items-center justify-between mb-4'>
            <Text className='text-base font-semibold text-gray-900'>常用功能</Text>
            <Text className='text-2xs text-gray-400'>一键直达</Text>
          </View>
          <ActionGrid actions={CORE_ACTIONS} />
        </View>

        {/* 管理功能 */}
        {isAdmin && (
          <View className='mx-4 mt-4 bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]'>
            <View className='flex items-center justify-between mb-4'>
              <View className='flex items-center'>
                <Text className='text-base font-semibold text-gray-900'>管理功能</Text>
                <Text className='ml-2 px-2 py-0.5 rounded-full bg-primary-50 text-2xs text-primary-600 font-medium'>管理</Text>
              </View>
            </View>
            <ActionGrid actions={ADMIN_ACTIONS} />
          </View>
        )}

        {/* 今日待办提示（轻量一行式，替代原大卡片） */}
        <View className='mx-4 mt-4 mb-6 flex items-center gap-2 px-3.5 py-3 rounded-xl bg-white border border-gray-100'>
          <Text className='i-mdi-lightbulb-on-outline text-base text-warning-500' />
          <Text className='flex-1 text-xs text-gray-500 leading-relaxed'>
            今日事今日毕：填写工作日志 · 完成考勤打卡 · 请假提前申请
          </Text>
          <View hoverClass='opacity-60' onClick={() => Taro.navigateTo({url: '/pages/notifications/index'})}>
            <Text className='i-mdi-chevron-right text-base text-gray-300' />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default EmployeeWorkspace
