import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getProbationEmployees} from '@/db/api'
import type {EmployeeOnboarding} from '@/db/types'

const ProbationManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<EmployeeOnboarding[]>([])
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring'>('all')

  // 加载试用期员工列表
  const loadEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProbationEmployees()
      setEmployees(data)
    } catch (error) {
      console.error('加载试用期员工失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEmployees()
  }, [loadEmployees])

  // 页面显示时刷新数据
  useDidShow(() => {
    loadEmployees()
  })

  // 计算试用期剩余天数
  const calculateRemainingDays = useCallback((onboardingDate: string, probationMonths: number) => {
    const startDate = new Date(onboardingDate)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + probationMonths)

    const today = new Date()
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return {
      remainingDays: diffDays,
      endDate: endDate.toISOString().split('T')[0],
      isExpiring: diffDays <= 30 && diffDays > 0,
      isExpired: diffDays <= 0
    }
  }, [])

  // 计算试用期进度
  const calculateProgress = useCallback((onboardingDate: string, probationMonths: number) => {
    const startDate = new Date(onboardingDate)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + probationMonths)

    const today = new Date()
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const passedDays = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

    const progress = Math.min(Math.max((passedDays / totalDays) * 100, 0), 100)
    return Math.round(progress)
  }, [])

  // 筛选员工
  const filteredEmployees = employees.filter((emp) => {
    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      const matchName = emp.name.toLowerCase().includes(searchLower)
      const matchPhone = emp.phone.includes(searchText)
      const matchPosition = emp.position?.toLowerCase().includes(searchLower)
      if (!matchName && !matchPhone && !matchPosition) return false
    }

    // 状态过滤
    if (filterStatus !== 'all') {
      const {remainingDays} = calculateRemainingDays(emp.onboarding_date, emp.probation_months || 3)
      if (filterStatus === 'expiring' && remainingDays > 30) return false
      if (filterStatus === 'active' && remainingDays <= 30) return false
    }

    return true
  })

  // 跳转到转正申请
  const handleRegularization = useCallback((employeeId: string) => {
    Taro.navigateTo({
      url: `/packageH/pages/regularization-apply/index?employeeId=${employeeId}`
    })
  }, [])

  // 查看详情
  const handleViewDetail = useCallback((id: string) => {
    Taro.navigateTo({
      url: `/packageH/pages/onboarding-detail/index?id=${id}`
    })
  }, [])

  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground">试用期管理</Text>
            <Text className="text-sm text-muted-foreground mt-1">共 {employees.length} 名试用期员工</Text>
          </View>

          {/* 搜索框 */}
          <View className="mb-4">
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-card text-foreground px-4 py-3 rounded-lg border border-border w-full"
                placeholder="搜索姓名、手机号或岗位"
                value={searchText}
                onInput={(e) => setSearchText(e.detail.value)}
              />
            </View>
          </View>

          {/* 状态筛选 */}
          <View className="flex flex-row gap-2 mb-4">
            <Button
              className={`flex-1 py-2 rounded-lg break-keep text-sm ${
                filterStatus === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
              size="default"
              onClick={() => setFilterStatus('all')}>
              全部
            </Button>
            <Button
              className={`flex-1 py-2 rounded-lg break-keep text-sm ${
                filterStatus === 'active' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
              size="default"
              onClick={() => setFilterStatus('active')}>
              进行中
            </Button>
            <Button
              className={`flex-1 py-2 rounded-lg break-keep text-sm ${
                filterStatus === 'expiring' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
              size="default"
              onClick={() => setFilterStatus('expiring')}>
              即将到期
            </Button>
          </View>

          {/* 员工列表 */}
          {loading ? (
            <View className="flex items-center justify-center py-20">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredEmployees.length === 0 ? (
            <View className="flex items-center justify-center py-20">
              <View className="i-mdi-account-search text-6xl text-muted-foreground mb-4" />
              <Text className="text-muted-foreground">暂无试用期员工</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredEmployees.map((emp) => {
                const {remainingDays, endDate, isExpiring, isExpired} = calculateRemainingDays(
                  emp.onboarding_date,
                  emp.probation_months || 3
                )
                const progress = calculateProgress(emp.onboarding_date, emp.probation_months || 3)

                return (
                  <View key={emp.id} className="bg-card rounded-lg p-4 shadow-sm">
                    {/* 员工基本信息 */}
                    <View className="flex flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex flex-row items-center gap-2 mb-1">
                          <Text className="text-lg font-semibold text-foreground">{emp.name}</Text>
                          {isExpiring && !isExpired && (
                            <View className="bg-yellow-100 px-2 py-0.5 rounded">
                              <Text className="text-xs text-yellow-700">即将到期</Text>
                            </View>
                          )}
                          {isExpired && (
                            <View className="bg-red-100 px-2 py-0.5 rounded">
                              <Text className="text-xs text-red-700">已到期</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm text-muted-foreground">{emp.phone}</Text>
                      </View>
                    </View>

                    {/* 岗位信息 */}
                    <View className="flex flex-row items-center gap-2 mb-3">
                      <View className="i-mdi-briefcase text-lg text-primary" />
                      <Text className="text-sm text-foreground">
                        {emp.position || '未设置'} · {emp.department || '未设置'}
                      </Text>
                    </View>

                    {/* 试用期信息 */}
                    <View className="bg-muted rounded-lg p-3 mb-3">
                      <View className="flex flex-row items-center justify-between mb-2">
                        <Text className="text-sm text-muted-foreground">试用期进度</Text>
                        <Text className="text-sm font-semibold text-foreground">{progress}%</Text>
                      </View>

                      {/* 进度条 */}
                      <View className="w-full h-2 bg-background rounded-full overflow-hidden mb-2">
                        <View
                          className={`h-full rounded-full ${
                            isExpired ? 'bg-red-500' : isExpiring ? 'bg-yellow-500' : 'bg-primary'
                          }`}
                          style={{width: `${progress}%`}}
                        />
                      </View>

                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-muted-foreground">入职日期：{emp.onboarding_date}</Text>
                        <Text className="text-xs text-muted-foreground">到期日期：{endDate}</Text>
                      </View>
                    </View>

                    {/* 剩余天数提示 */}
                    <View className="flex flex-row items-center gap-2 mb-3">
                      <View
                        className={`i-mdi-clock-outline text-lg ${
                          isExpired ? 'text-red-500' : isExpiring ? 'text-yellow-600' : 'text-primary'
                        }`}
                      />
                      <Text
                        className={`text-sm ${
                          isExpired ? 'text-red-600' : isExpiring ? 'text-yellow-700' : 'text-foreground'
                        }`}>
                        {isExpired ? `已超期 ${Math.abs(remainingDays)} 天` : `剩余 ${remainingDays} 天`}
                      </Text>
                    </View>

                    {/* 操作按钮 */}
                    <View className="flex flex-row gap-2">
                      <Button
                        className="flex-1 bg-muted text-foreground py-2 rounded-lg text-sm break-keep"
                        size="default"
                        onClick={() => handleViewDetail(emp.id)}>
                        查看详情
                      </Button>
                      <Button
                        className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm break-keep"
                        size="default"
                        onClick={() => handleRegularization(emp.id)}>
                        申请转正
                      </Button>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default ProbationManagement
