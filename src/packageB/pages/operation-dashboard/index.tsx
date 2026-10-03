/**
 * 今日运营仪表盘（增强版）
 * 提供当日+当月累计的双维度数据展示、数据对比分析、智能分析功能
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {useTenantStore} from '@/store/tenant'

// 运营仪表盘数据类型
interface OperationDashboardData {
  // 今日数据
  today: {
    scheduleCompleted: number // 完成排班数
    scheduleTotal: number // 总排班数
    completionRate: number // 完成率
    excellentCount: number // 优秀排班数
    excellentRate: number // 优秀率
    averageScore: number // 平均分
    participantCount: number // 参与人数
    participationRate: number // 参与率
    delayedCount: number // 延期排班数
    delayedRate: number // 延期率
    needImprovementCount: number // 待改进人数
    averageTime: number // 平均用时（分钟）
    earlyCompletionCount: number // 提前完成数
    earlyCompletionRate: number // 提前完成率
  }
  // 本月累计数据
  month: {
    scheduleCompleted: number
    scheduleTotal: number
    completionRate: number
    excellentCount: number
    excellentRate: number
    averageScore: number
    participantCount: number
    participationRate: number
    delayedCount: number
    delayedRate: number
    needImprovementCount: number
    averageTime: number
    earlyCompletionCount: number
    earlyCompletionRate: number
  }
  // 昨日数据（用于对比）
  yesterday: {
    completionRate: number
    excellentRate: number
    participationRate: number
  }
  // 部门表现
  departments: Array<{
    name: string
    todayScore: number
    monthScore: number
    todayRank: number
    monthRank: number
  }>
  // 智能分析
  insights: {
    todayPattern: string // 今日数据模式
    monthPattern: string // 本月数据模式
    todaySuggestions: string[] // 今日优化建议
    monthSuggestions: string[] // 本月战略建议
    shortTermPrediction: string // 短期预测
    midTermPrediction: string // 中期预测
    goalAchievementRate: number // 月度目标达成预测
  }
}

const OperationDashboard: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const _currentStore = useTenantStore((state) => state.currentStore)

  const [data, setData] = useState<OperationDashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'insights'>('overview')

  // 加载运营仪表盘数据
  const loadDashboardData = useCallback(async () => {
    if (!currentTenant?.id) {
      Taro.showToast({
        title: '请先选择租户',
        icon: 'none'
      })
      return
    }

    try {
      setLoading(true)

      // TODO: 调用API获取数据
      // const result = await getTodayOperationDashboard(currentTenant.id, currentStore?.id)

      // 模拟数据（开发阶段）
      const mockData: OperationDashboardData = {
        today: {
          scheduleCompleted: 45,
          scheduleTotal: 50,
          completionRate: 90,
          excellentCount: 30,
          excellentRate: 66.7,
          averageScore: 85.5,
          participantCount: 48,
          participationRate: 96,
          delayedCount: 3,
          delayedRate: 6,
          needImprovementCount: 5,
          averageTime: 25,
          earlyCompletionCount: 35,
          earlyCompletionRate: 77.8
        },
        month: {
          scheduleCompleted: 1350,
          scheduleTotal: 1500,
          completionRate: 90,
          excellentCount: 900,
          excellentRate: 66.7,
          averageScore: 85.5,
          participantCount: 48,
          participationRate: 96,
          delayedCount: 90,
          delayedRate: 6,
          needImprovementCount: 5,
          averageTime: 25,
          earlyCompletionCount: 1050,
          earlyCompletionRate: 77.8
        },
        yesterday: {
          completionRate: 88,
          excellentRate: 64,
          participationRate: 94
        },
        departments: [
          {name: '前厅部', todayScore: 88, monthScore: 86, todayRank: 1, monthRank: 1},
          {name: '后厨部', todayScore: 85, monthScore: 84, todayRank: 2, monthRank: 2},
          {name: '配送部', todayScore: 82, monthScore: 83, todayRank: 3, monthRank: 3}
        ],
        insights: {
          todayPattern: '今日排班完成情况良好，整体效率较高',
          monthPattern: '本月排班质量稳定，持续保持高水平',
          todaySuggestions: [
            '关注延期排班的3个任务，及时跟进',
            '表扬提前完成的35个优秀排班',
            '对5名待改进人员提供培训支持'
          ],
          monthSuggestions: ['继续保持90%的高完成率', '优化排班流程，减少延期率', '加强部门间协作，提升整体效率'],
          shortTermPrediction: '预计明日完成率将达到92%',
          midTermPrediction: '预计本月目标达成率95%',
          goalAchievementRate: 95
        }
      }

      setData(mockData)
    } catch (error) {
      console.error('加载运营仪表盘数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadDashboardData()
  })

  // 计算对比数据
  const getComparisonData = (todayValue: number, yesterdayValue: number) => {
    const diff = todayValue - yesterdayValue
    const isPositive = diff > 0
    const icon = isPositive ? '↑' : diff < 0 ? '↓' : '→'
    const color = isPositive ? 'text-muted-foreground' : diff < 0 ? 'text-red-600' : 'text-gray-600'
    return {diff: Math.abs(diff).toFixed(1), icon, color}
  }

  // 渲染加载状态
  if (loading && !data) {
    return (
      <View className="min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
          <View className="p-4">
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <View className="flex items-center justify-center py-12">
                <View className="i-mdi-loading text-4xl text-blue-600 animate-spin" />
                <Text className="text-muted-foreground mt-4">加载中...</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // 渲染空状态
  if (!data) {
    return (
      <View className="min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
          <View className="p-4">
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <View className="flex flex-col items-center justify-center py-12">
                <View className="i-mdi-chart-box text-6xl text-muted-foreground mb-4" />
                <Text className="text-muted-foreground">暂无数据</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <View className="flex items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">今日运营仪表盘</Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </Text>
            </View>
            <Button
              size="default"
              className="bg-blue-100 text-white px-4 py-2 rounded-lg break-keep text-sm"
              onClick={loadDashboardData}>
              <View className="flex items-center gap-2">
                <View className="i-mdi-refresh text-lg" />
                <Text>刷新</Text>
              </View>
            </Button>
          </View>

          {/* Tab切换 */}
          <View className="flex gap-2 bg-white rounded-xl p-2 border-2 border-gray-200 shadow-sm">
            <Button
              size="default"
              className={`flex-1 py-3 rounded-lg break-keep text-sm ${
                activeTab === 'overview' ? 'bg-green-500 text-white' : 'bg-transparent text-muted-foreground'
              }`}
              onClick={() => setActiveTab('overview')}>
              概览
            </Button>
            <Button
              size="default"
              className={`flex-1 py-3 rounded-lg break-keep text-sm ${
                activeTab === 'comparison' ? 'bg-green-500 text-white' : 'bg-transparent text-muted-foreground'
              }`}
              onClick={() => setActiveTab('comparison')}>
              对比分析
            </Button>
            <Button
              size="default"
              className={`flex-1 py-3 rounded-lg break-keep text-sm ${
                activeTab === 'insights' ? 'bg-green-500 text-white' : 'bg-transparent text-muted-foreground'
              }`}
              onClick={() => setActiveTab('insights')}>
              智能分析
            </Button>
          </View>

          {/* 概览Tab */}
          {activeTab === 'overview' && (
            <View className="space-y-4">
              {/* 核心指标卡片 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center gap-2 mb-4">
                  <View className="i-mdi-chart-box text-2xl text-blue-600" />
                  <Text className="text-lg font-bold text-foreground">核心指标</Text>
                </View>

                {/* 排班完成情况 */}
                <View className="mb-6">
                  <Text className="text-sm text-muted-foreground mb-3">排班完成情况</Text>
                  <View className="grid grid-cols-2 gap-4">
                    <View className="bg-blue-100 rounded-xl p-4">
                      <Text className="text-xs text-muted-foreground mb-1">今日</Text>
                      <Text className="text-2xl font-bold text-blue-600">
                        {data.today.scheduleCompleted}/{data.today.scheduleTotal}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">完成率 {data.today.completionRate}%</Text>
                    </View>
                    <View className="bg-blue-100 rounded-xl p-4">
                      <Text className="text-xs text-muted-foreground mb-1">本月累计</Text>
                      <Text className="text-2xl font-bold text-purple-700">
                        {data.month.scheduleCompleted}/{data.month.scheduleTotal}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">完成率 {data.month.completionRate}%</Text>
                    </View>
                  </View>
                </View>

                {/* 排班质量情况 */}
                <View className="mb-6">
                  <Text className="text-sm text-muted-foreground mb-3">排班质量情况</Text>
                  <View className="grid grid-cols-2 gap-4">
                    <View className="bg-blue-100 rounded-xl p-4">
                      <Text className="text-xs text-muted-foreground mb-1">今日</Text>
                      <Text className="text-2xl font-bold text-green-600">{data.today.excellentCount}</Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        优秀率 {data.today.excellentRate}% | 平均分 {data.today.averageScore}
                      </Text>
                    </View>
                    <View className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
                      <Text className="text-xs text-teal-600 mb-1">本月累计</Text>
                      <Text className="text-2xl font-bold text-teal-700">{data.month.excellentCount}</Text>
                      <Text className="text-xs text-teal-600 mt-1">
                        优秀率 {data.month.excellentRate}% | 平均分 {data.month.averageScore}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 人员参与情况 */}
                <View>
                  <Text className="text-sm text-muted-foreground mb-3">人员参与情况</Text>
                  <View className="grid grid-cols-2 gap-4">
                    <View className="bg-blue-100 rounded-xl p-4">
                      <Text className="text-xs text-muted-foreground mb-1">今日</Text>
                      <Text className="text-2xl font-bold text-orange-600">{data.today.participantCount}人</Text>
                      <Text className="text-xs text-muted-foreground mt-1">参与率 {data.today.participationRate}%</Text>
                    </View>
                    <View className="bg-blue-100 rounded-xl p-4">
                      <Text className="text-xs text-pink-600 mb-1">本月累计</Text>
                      <Text className="text-2xl font-bold text-pink-700">{data.month.participantCount}人</Text>
                      <Text className="text-xs text-pink-600 mt-1">参与率 {data.month.participationRate}%</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 异常情况监控 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center gap-2 mb-4">
                  <View className="i-mdi-alert-circle text-2xl text-red-600" />
                  <Text className="text-lg font-bold text-foreground">异常情况监控</Text>
                </View>

                <View className="space-y-4">
                  {/* 延期排班 */}
                  <View className="flex items-center justify-between p-4 bg-blue-100 rounded-xl">
                    <View>
                      <Text className="text-sm font-medium text-red-600">延期排班</Text>
                      <Text className="text-xs text-red-600 mt-1">
                        今日 {data.today.delayedCount} 个 | 本月 {data.month.delayedCount} 个
                      </Text>
                    </View>
                    <View className="text-right">
                      <Text className="text-2xl font-bold text-red-600">{data.today.delayedRate}%</Text>
                      <Text className="text-xs text-red-600">延期率</Text>
                    </View>
                  </View>

                  {/* 待改进人员 */}
                  <View className="flex items-center justify-between p-4 bg-blue-100 rounded-xl">
                    <View>
                      <Text className="text-sm font-medium text-yellow-700">待改进人员</Text>
                      <Text className="text-xs text-yellow-600 mt-1">需要培训支持</Text>
                    </View>
                    <View className="text-right">
                      <Text className="text-2xl font-bold text-yellow-700">{data.today.needImprovementCount}人</Text>
                      <Text className="text-xs text-yellow-600">今日</Text>
                    </View>
                  </View>

                  {/* 效率指标 */}
                  <View className="flex items-center justify-between p-4 bg-blue-100 rounded-xl">
                    <View>
                      <Text className="text-sm font-medium text-blue-600">效率指标</Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        提前完成 {data.today.earlyCompletionCount} 个 ({data.today.earlyCompletionRate}%)
                      </Text>
                    </View>
                    <View className="text-right">
                      <Text className="text-2xl font-bold text-blue-600">{data.today.averageTime}分</Text>
                      <Text className="text-xs text-muted-foreground">平均用时</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 部门表现情况 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center gap-2 mb-4">
                  <View className="i-mdi-office-building text-2xl text-blue-600" />
                  <Text className="text-lg font-bold text-foreground">部门表现情况</Text>
                </View>

                <View className="space-y-3">
                  {data.departments.map((dept, index) => (
                    <View key={index} className="p-4 bg-gray-50 rounded-xl">
                      <View className="flex items-center justify-between mb-2">
                        <Text className="text-sm font-medium text-foreground">{dept.name}</Text>
                        <View className="flex items-center gap-2">
                          <View className="px-2 py-1 bg-blue-100 rounded">
                            <Text className="text-xs text-blue-600">今日第{dept.todayRank}名</Text>
                          </View>
                          <View className="px-2 py-1 bg-purple-100 rounded">
                            <Text className="text-xs text-purple-700">本月第{dept.monthRank}名</Text>
                          </View>
                        </View>
                      </View>
                      <View className="flex items-center gap-4">
                        <View className="flex-1">
                          <Text className="text-xs text-muted-foreground mb-1">今日得分</Text>
                          <Text className="text-lg font-bold text-muted-foreground">{dept.todayScore}</Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-xs text-muted-foreground mb-1">本月平均</Text>
                          <Text className="text-lg font-bold text-muted-foreground">{dept.monthScore}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* 对比分析Tab */}
          {activeTab === 'comparison' && (
            <View className="space-y-4">
              {/* 今日vs昨日对比 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center gap-2 mb-4">
                  <View className="i-mdi-compare text-2xl text-blue-600" />
                  <Text className="text-lg font-bold text-foreground">今日 vs 昨日</Text>
                </View>

                <View className="space-y-4">
                  {/* 完成率对比 */}
                  <View className="p-4 bg-blue-100 rounded-xl">
                    <View className="flex items-center justify-between">
                      <View>
                        <Text className="text-sm text-muted-foreground mb-1">完成率</Text>
                        <Text className="text-2xl font-bold text-blue-600">{data.today.completionRate}%</Text>
                      </View>
                      <View className="text-right">
                        {(() => {
                          const comp = getComparisonData(data.today.completionRate, data.yesterday.completionRate)
                          return (
                            <View>
                              <Text className={`text-lg font-bold ${comp.color}`}>
                                {comp.icon} {comp.diff}%
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                vs 昨日 {data.yesterday.completionRate}%
                              </Text>
                            </View>
                          )
                        })()}
                      </View>
                    </View>
                  </View>

                  {/* 优秀率对比 */}
                  <View className="p-4 bg-blue-100 rounded-xl">
                    <View className="flex items-center justify-between">
                      <View>
                        <Text className="text-sm text-muted-foreground mb-1">优秀率</Text>
                        <Text className="text-2xl font-bold text-green-600">{data.today.excellentRate}%</Text>
                      </View>
                      <View className="text-right">
                        {(() => {
                          const comp = getComparisonData(data.today.excellentRate, data.yesterday.excellentRate)
                          return (
                            <View>
                              <Text className={`text-lg font-bold ${comp.color}`}>
                                {comp.icon} {comp.diff}%
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                vs 昨日 {data.yesterday.excellentRate}%
                              </Text>
                            </View>
                          )
                        })()}
                      </View>
                    </View>
                  </View>

                  {/* 参与率对比 */}
                  <View className="p-4 bg-blue-100 rounded-xl">
                    <View className="flex items-center justify-between">
                      <View>
                        <Text className="text-sm text-muted-foreground mb-1">参与率</Text>
                        <Text className="text-2xl font-bold text-orange-600">{data.today.participationRate}%</Text>
                      </View>
                      <View className="text-right">
                        {(() => {
                          const comp = getComparisonData(data.today.participationRate, data.yesterday.participationRate)
                          return (
                            <View>
                              <Text className={`text-lg font-bold ${comp.color}`}>
                                {comp.icon} {comp.diff}%
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                vs 昨日 {data.yesterday.participationRate}%
                              </Text>
                            </View>
                          )
                        })()}
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* 今日vs本月平均对比 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center gap-2 mb-4">
                  <View className="i-mdi-chart-line text-2xl text-blue-600" />
                  <Text className="text-lg font-bold text-foreground">今日 vs 本月平均</Text>
                </View>

                <View className="space-y-4">
                  {/* 完成率对比 */}
                  <View className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <Text className="text-sm text-muted-foreground">完成率</Text>
                    <View className="flex items-center gap-4">
                      <View className="text-center">
                        <Text className="text-xs text-muted-foreground mb-1">今日</Text>
                        <Text className="text-lg font-bold text-muted-foreground">{data.today.completionRate}%</Text>
                      </View>
                      <View className="w-px h-8 bg-border" />
                      <View className="text-center">
                        <Text className="text-xs text-muted-foreground mb-1">本月</Text>
                        <Text className="text-lg font-bold text-muted-foreground">{data.month.completionRate}%</Text>
                      </View>
                    </View>
                  </View>

                  {/* 优秀率对比 */}
                  <View className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <Text className="text-sm text-muted-foreground">优秀率</Text>
                    <View className="flex items-center gap-4">
                      <View className="text-center">
                        <Text className="text-xs text-muted-foreground mb-1">今日</Text>
                        <Text className="text-lg font-bold text-muted-foreground">{data.today.excellentRate}%</Text>
                      </View>
                      <View className="w-px h-8 bg-border" />
                      <View className="text-center">
                        <Text className="text-xs text-muted-foreground mb-1">本月</Text>
                        <Text className="text-lg font-bold text-teal-600">{data.month.excellentRate}%</Text>
                      </View>
                    </View>
                  </View>

                  {/* 平均用时对比 */}
                  <View className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <Text className="text-sm text-muted-foreground">平均用时</Text>
                    <View className="flex items-center gap-4">
                      <View className="text-center">
                        <Text className="text-xs text-muted-foreground mb-1">今日</Text>
                        <Text className="text-lg font-bold text-muted-foreground">{data.today.averageTime}分</Text>
                      </View>
                      <View className="w-px h-8 bg-border" />
                      <View className="text-center">
                        <Text className="text-xs text-muted-foreground mb-1">本月</Text>
                        <Text className="text-lg font-bold text-pink-600">{data.month.averageTime}分</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* 部门对比 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center gap-2 mb-4">
                  <View className="i-mdi-office-building text-2xl text-blue-600" />
                  <Text className="text-lg font-bold text-foreground">部门对比</Text>
                </View>

                <View className="space-y-3">
                  {data.departments.map((dept, index) => (
                    <View key={index} className="p-4 bg-gray-50 rounded-xl">
                      <Text className="text-sm font-medium text-foreground mb-3">{dept.name}</Text>
                      <View className="flex items-center gap-2">
                        <View className="flex-1">
                          <View className="flex items-center justify-between mb-1">
                            <Text className="text-xs text-muted-foreground">今日</Text>
                            <Text className="text-sm font-bold text-muted-foreground">{dept.todayScore}</Text>
                          </View>
                          <View className="h-2 bg-blue-100 rounded-full overflow-hidden">
                            <View className="h-full bg-blue-100 rounded-full" style={{width: `${dept.todayScore}%`}} />
                          </View>
                        </View>
                        <View className="flex-1">
                          <View className="flex items-center justify-between mb-1">
                            <Text className="text-xs text-muted-foreground">本月</Text>
                            <Text className="text-sm font-bold text-muted-foreground">{dept.monthScore}</Text>
                          </View>
                          <View className="h-2 bg-purple-100 rounded-full overflow-hidden">
                            <View
                              className="h-full bg-purple-600 rounded-full"
                              style={{width: `${dept.monthScore}%`}}
                            />
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* 智能分析Tab */}
          {activeTab === 'insights' && (
            <View className="space-y-4">
              {/* 数据模式识别 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center gap-2 mb-4">
                  <View className="i-mdi-brain text-2xl text-blue-600" />
                  <Text className="text-lg font-bold text-foreground">数据模式识别</Text>
                </View>

                <View className="space-y-4">
                  <View className="p-4 bg-blue-100 rounded-xl">
                    <View className="flex items-center gap-2 mb-2">
                      <View className="i-mdi-calendar-today text-lg text-muted-foreground" />
                      <Text className="text-sm font-medium text-blue-600">今日数据模式</Text>
                    </View>
                    <Text className="text-sm text-muted-foreground">{data.insights.todayPattern}</Text>
                  </View>

                  <View className="p-4 bg-blue-100 rounded-xl">
                    <View className="flex items-center gap-2 mb-2">
                      <View className="i-mdi-calendar-month text-lg text-muted-foreground" />
                      <Text className="text-sm font-medium text-purple-700">本月数据模式</Text>
                    </View>
                    <Text className="text-sm text-muted-foreground">{data.insights.monthPattern}</Text>
                  </View>
                </View>
              </View>

              {/* 智能建议 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center gap-2 mb-4">
                  <View className="i-mdi-lightbulb text-2xl text-yellow-600" />
                  <Text className="text-lg font-bold text-foreground">智能建议</Text>
                </View>

                <View className="space-y-4">
                  {/* 今日优化建议 */}
                  <View>
                    <Text className="text-sm font-medium text-foreground mb-2">今日优化建议</Text>
                    <View className="space-y-2">
                      {data.insights.todaySuggestions.map((suggestion, index) => (
                        <View key={index} className="flex items-start gap-2 p-3 bg-blue-100 rounded-lg">
                          <View className="i-mdi-check-circle text-lg text-muted-foreground mt-0.5" />
                          <Text className="flex-1 text-sm text-green-600">{suggestion}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 本月战略建议 */}
                  <View>
                    <Text className="text-sm font-medium text-foreground mb-2">本月战略建议</Text>
                    <View className="space-y-2">
                      {data.insights.monthSuggestions.map((suggestion, index) => (
                        <View key={index} className="flex items-start gap-2 p-3 bg-blue-100 rounded-lg">
                          <View className="i-mdi-star-circle text-lg text-muted-foreground mt-0.5" />
                          <Text className="flex-1 text-sm text-blue-600">{suggestion}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* 预测分析 */}
              <View className="bg-white rounded-lg p-4 border-2 border-gray-200">
                <View className="flex items-center gap-2 mb-4">
                  <View className="i-mdi-crystal-ball text-2xl text-blue-600" />
                  <Text className="text-lg font-bold text-foreground">预测分析</Text>
                </View>

                <View className="space-y-4">
                  {/* 短期预测 */}
                  <View className="p-4 bg-blue-100 rounded-xl">
                    <View className="flex items-center gap-2 mb-2">
                      <View className="i-mdi-clock-fast text-lg text-cyan-600" />
                      <Text className="text-sm font-medium text-cyan-700">短期预测（明日）</Text>
                    </View>
                    <Text className="text-sm text-cyan-600">{data.insights.shortTermPrediction}</Text>
                  </View>

                  {/* 中期预测 */}
                  <View className="p-4 bg-blue-100 rounded-xl">
                    <View className="flex items-center gap-2 mb-2">
                      <View className="i-mdi-clock-outline text-lg text-indigo-600" />
                      <Text className="text-sm font-medium text-indigo-700">中期预测（本月）</Text>
                    </View>
                    <Text className="text-sm text-indigo-600">{data.insights.midTermPrediction}</Text>
                  </View>

                  {/* 月度目标达成预测 */}
                  <View className="p-4 bg-blue-100 rounded-xl">
                    <View className="flex items-center justify-between">
                      <View>
                        <View className="flex items-center gap-2 mb-2">
                          <View className="i-mdi-target text-lg text-muted-foreground" />
                          <Text className="text-sm font-medium text-purple-700">月度目标达成预测</Text>
                        </View>
                        <Text className="text-xs text-muted-foreground">基于当前趋势分析</Text>
                      </View>
                      <View className="text-right">
                        <Text className="text-3xl font-bold text-purple-700">{data.insights.goalAchievementRate}%</Text>
                        <Text className="text-xs text-muted-foreground">预计达成率</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default OperationDashboard
