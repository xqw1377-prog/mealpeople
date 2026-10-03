/**
 * 我的成长页面 - 员工培训发展体系
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {getEmployeeGrowthData} from '@/db/api-growth'
import type {GrowthData} from '@/db/types-growth'

export default function MyGrowth() {
  const {user} = useAuth({guard: true})
  const [growthData, setGrowthData] = useState<GrowthData | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载成长数据
  const loadGrowthData = useCallback(async () => {
    if (!user?.id) {
      console.log('⚠️ [我的成长] 用户未登录')
      return
    }

    setLoading(true)
    try {
      console.log('🔍 [我的成长] 开始加载成长数据，用户ID:', user.id)

      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      console.log('👤 [我的成长] 员工信息:', employee)

      if (!employee) {
        console.error('❌ [我的成长] 未找到员工信息')
        Taro.showToast({
          title: '您还不是员工，请联系管理员添加',
          icon: 'none',
          duration: 3000
        })
        setLoading(false)
        return
      }

      // 获取成长数据
      console.log('📊 [我的成长] 开始获取成长数据，员工ID:', employee.id)
      const data = await getEmployeeGrowthData(employee.id)
      console.log('✅ [我的成长] 成长数据:', data)

      setGrowthData(data)
    } catch (error) {
      console.error('❌ [我的成长] 加载成长数据失败:', error)
      Taro.showToast({
        title: `加载失败: ${error instanceof Error ? error.message : '未知错误'}`,
        icon: 'none',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadGrowthData()
  })

  // 获取课程状态信息
  const getCourseStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      enrolled: {text: '已报名', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      in_progress: {text: '学习中', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      completed: {text: '已完成', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      failed: {text: '未通过', color: 'text-red-600', bgColor: 'bg-blue-100'}
    }
    return statusMap[status] || {text: '未知', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <View className="text-center">
          <View className="i-mdi-loading text-5xl text-primary animate-spin mb-4" />
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      </View>
    )
  }

  if (!growthData) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <View className="text-center">
          <View className="i-mdi-account-alert text-6xl text-muted-foreground/30 mb-4" />
          <Text className="text-lg font-semibold text-foreground mb-2 block">暂无成长数据</Text>
          <Text className="text-sm text-muted-foreground mb-6 block">您还不是员工或数据加载失败</Text>
          <View
            className="bg-primary text-white px-6 py-3 rounded-lg active:opacity-70"
            onClick={() => {
              Taro.switchTab({url: '/packageB/pages/home/index'})
            }}>
            <Text className="text-white text-sm font-medium">返回首页</Text>
          </View>
        </View>
      </View>
    )
  }

  const {level, learning_progress, certifications, recent_courses} = growthData

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的成长</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">培训发展与职业成长</Text>
          </View>

          {/* 当前等级卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 mb-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-blue-600/80 text-sm">当前等级</Text>
                <Text className="text-foreground text-2xl font-bold mt-1">{level.current_level}</Text>
              </View>
              <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <View className="i-mdi-star text-4xl text-blue-600" />
              </View>
            </View>

            {/* 等级进度 */}
            <View className="mb-2">
              <View className="flex flex-row items-center justify-between mb-2">
                <Text className="text-blue-600/80 text-xs">等级积分</Text>
                <Text className="text-blue-600 text-xs">
                  {level.level_score} / {level.next_level_score}
                </Text>
              </View>
              <View className="h-2 bg-white rounded-full overflow-hidden">
                <View
                  className="h-full bg-white rounded-full"
                  style={{
                    width: `${Math.min((level.level_score / level.next_level_score) * 100, 100)}%`
                  }}
                />
              </View>
            </View>

            <Text className="text-blue-600/80 text-xs mt-2">
              距离 {level.next_level} 还需 {level.next_level_score - level.level_score} 积分
            </Text>
          </View>

          {/* 学习进度统计 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">学习进度</Text>
              <View className="i-mdi-chart-line text-2xl text-blue-600" />
            </View>

            <View className="grid grid-cols-3 gap-3 mb-4">
              <View className="text-center">
                <Text className="text-2xl font-bold text-blue-600">{learning_progress.total_courses}</Text>
                <Text className="text-xs text-muted-foreground mt-1">总课程</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">{learning_progress.completed_courses}</Text>
                <Text className="text-xs text-muted-foreground mt-1">已完成</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">
                  {learning_progress.in_progress_courses}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">学习中</Text>
              </View>
            </View>

            {/* 完成率进度条 */}
            <View className="mb-3">
              <View className="flex flex-row items-center justify-between mb-2">
                <Text className="text-sm text-muted-foreground">完成率</Text>
                <Text className="text-sm font-medium text-blue-600">{learning_progress.completion_rate}%</Text>
              </View>
              <View className="h-2 bg-gray-50 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-100 rounded-full"
                  style={{width: `${learning_progress.completion_rate}%`}}
                />
              </View>
            </View>

            {/* 学习统计 */}
            <View className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <View>
                <Text className="text-xs text-muted-foreground">学习时长</Text>
                <Text className="text-lg font-semibold text-foreground mt-1">
                  {learning_progress.total_learning_hours}h
                </Text>
              </View>
              <View>
                <Text className="text-xs text-muted-foreground">平均分数</Text>
                <Text className="text-lg font-semibold text-foreground mt-1">{learning_progress.average_score}分</Text>
              </View>
            </View>
          </View>

          {/* 获得认证 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">获得认证</Text>
              <View className="i-mdi-certificate text-2xl text-blue-600" />
            </View>

            {certifications.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-certificate-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无认证</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {certifications.map((cert) => (
                  <View key={cert.id} className="flex flex-row items-center p-3 bg-blue-100 rounded-xl">
                    <View className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <View className="i-mdi-certificate text-xl text-muted-foreground" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-foreground">{cert.cert_name}</Text>
                      <Text className="text-xs text-muted-foreground mt-1">{formatDate(cert.obtain_date)}</Text>
                    </View>
                    <View
                      className={`px-2 py-1 rounded ${cert.cert_status === 'active' ? 'bg-green-100' : 'bg-gray-50'}`}>
                      <Text
                        className={`text-xs ${cert.cert_status === 'active' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                        {cert.cert_status === 'active' ? '有效' : '已过期'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 最近课程 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">最近课程</Text>
              <View className="i-mdi-history text-2xl text-blue-600" />
            </View>

            {recent_courses.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-book-open-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无学习记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {recent_courses.map((record) => {
                  const statusInfo = getCourseStatusInfo(record.status)
                  return (
                    <View key={record.id} className="p-3 bg-gray-50 rounded-xl">
                      <View className="flex flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-medium text-foreground flex-1">
                          课程ID: {record.course_id.slice(0, 8)}...
                        </Text>
                        <View className={`px-2 py-1 rounded ${statusInfo.bgColor}`}>
                          <Text className={`text-xs ${statusInfo.color}`}>{statusInfo.text}</Text>
                        </View>
                      </View>

                      {/* 进度条 */}
                      {record.status !== 'completed' && (
                        <View className="mb-2">
                          <View className="flex flex-row items-center justify-between mb-1">
                            <Text className="text-xs text-muted-foreground">学习进度</Text>
                            <Text className="text-xs text-muted-foreground">{record.progress}%</Text>
                          </View>
                          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <View className="h-full bg-blue-100 rounded-full" style={{width: `${record.progress}%`}} />
                          </View>
                        </View>
                      )}

                      {/* 分数 */}
                      {record.status === 'completed' && record.score !== null && (
                        <View className="flex flex-row items-center">
                          <View className="i-mdi-star text-sm text-yellow-500 mr-1" />
                          <Text className="text-xs text-muted-foreground">考核分数: {record.score}分</Text>
                        </View>
                      )}

                      <Text className="text-xs text-muted-foreground mt-1">{formatDate(record.created_at)}</Text>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 快捷操作 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">学习中心</Text>
              <View className="i-mdi-school text-2xl text-blue-600" />
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '培训课程功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-book-open-page-variant text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">浏览课程</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '考试功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-file-document-edit text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">参加考试</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '学习计划功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-calendar-check text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">学习计划</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '成长报告功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-chart-box text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">成长报告</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
