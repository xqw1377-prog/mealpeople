/**
 * 入职办理管理页面
 * HR管理员工入职流程
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {getEmployeeByUserId} from '@/db/api'

// 简化的状态颜色映射
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-gray-100 text-gray-700',
  rejected: 'bg-red-100 text-red-700'
}

// 简化的状态名称映射
const STATUS_NAMES: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  processing: '办理中',
  completed: '已完成',
  rejected: '已拒绝'
}

// 简化的申请接口
interface SimpleApplication {
  id: string
  name: string
  phone: string
  position?: string
  expected_onboarding_date?: string
  status: string
}

export default function OnboardingProcessManagement() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<SimpleApplication[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // 加载入职申请列表
  const loadApplications = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // TODO: 从数据库加载入职申请
      // 这里使用模拟数据
      const mockApplications: SimpleApplication[] = []
      setApplications(mockApplications)
    } catch (error) {
      console.error('加载入职申请失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadApplications()
  })

  // 过滤申请列表
  const filteredApplications = applications.filter((app) => {
    if (filterStatus === 'all') return true
    return app.status === filterStatus
  })

  // 跳转到入职办理详情
  const handleProcessDetail = (applicationId: string) => {
    Taro.navigateTo({
      url: `/packageH/pages/onboarding-process-detail/index?id=${applicationId}`
    })
  }

  // 开始办理入职
  const handleStartProcess = (applicationId: string) => {
    Taro.showModal({
      title: '开始办理',
      content: '确认开始办理该员工的入职流程？',
      success: (res) => {
        if (res.confirm) {
          handleProcessDetail(applicationId)
        }
      }
    })
  }

  if (loading) {
    return <LoadingCards />
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center mb-3">
              <View className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-account-check text-3xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground block mb-1">入职办理</Text>
                <Text className="text-sm text-muted-foreground block">管理员工入职流程</Text>
              </View>
            </View>
          </View>

          {/* 状态筛选 */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-border">
            <Text className="text-sm font-medium text-foreground block mb-3">筛选状态</Text>
            <View className="flex flex-wrap gap-2">
              <View
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  filterStatus === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFilterStatus('all')}>
                <Text className="text-sm">全部 ({applications.length})</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  filterStatus === 'approved' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFilterStatus('approved')}>
                <Text className="text-sm">待办理 ({applications.filter((a) => a.status === 'approved').length})</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  filterStatus === 'processing' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFilterStatus('processing')}>
                <Text className="text-sm">办理中 ({applications.filter((a) => a.status === 'processing').length})</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all ${
                  filterStatus === 'completed' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}
                onClick={() => setFilterStatus('completed')}>
                <Text className="text-sm">已完成 ({applications.filter((a) => a.status === 'completed').length})</Text>
              </View>
            </View>
          </View>

          {/* 入职申请列表 */}
          {filteredApplications.length === 0 ? (
            <View className="bg-white rounded-xl p-8 text-center border border-border">
              <View className="i-mdi-inbox text-6xl text-muted-foreground mb-4" />
              <Text className="text-base text-muted-foreground block">暂无入职申请</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredApplications.map((app) => (
                <View
                  key={app.id}
                  className="bg-white rounded-xl p-4 border border-border active:opacity-80 transition-all"
                  onClick={() => handleProcessDetail(app.id)}>
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground block mb-1">{app.name}</Text>
                      <Text className="text-sm text-muted-foreground block">{app.phone}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${STATUS_COLORS[app.status] || 'bg-gray-100'}`}>
                      <Text className="text-xs font-medium">{STATUS_NAMES[app.status] || app.status}</Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-2 mb-3">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-briefcase text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">{app.position || '未设置'}</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-calendar text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">
                        {app.expected_onboarding_date
                          ? new Date(app.expected_onboarding_date).toLocaleDateString()
                          : '未设置'}
                      </Text>
                    </View>
                  </View>

                  {app.status === 'approved' && (
                    <Button
                      className="w-full bg-primary text-white py-3 rounded-lg break-keep text-sm"
                      size="default"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartProcess(app.id)
                      }}>
                      开始办理
                    </Button>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
