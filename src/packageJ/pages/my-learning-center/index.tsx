/**
 * 我的学习中心页面
 * 统一展示所有学习内容、进度和成就
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api-employees'
import {getLearningAchievements, getLearningStats} from '@/db/api-onboarding-enhancement'
import type {LearningAchievement, LearningStats} from '@/db/types/onboarding-enhancement'
import {useTenantStore} from '@/store/tenant'

const MyLearningCenter: React.FC = () => {
  const {user} = useAuth()
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [achievements, setAchievements] = useState<LearningAchievement[]>([])
  const [_employeeId, setEmployeeId] = useState<string>('')

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 获取当前员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        Taro.showToast({title: '未找到员工信息', icon: 'none'})
        setLoading(false)
        return
      }

      setEmployeeId(employee.id)

      // 获取学习统计
      const learningStats = await getLearningStats(employee.id)
      setStats(learningStats)

      // 获取学习成就
      const learningAchievements = await getLearningAchievements(employee.id)
      setAchievements(learningAchievements)
    } catch (error) {
      console.error('加载学习中心数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  // 导航到入职手册
  const handleGoToHandbook = () => {
    Taro.navigateTo({url: '/packageH/pages/onboarding-handbook/index'})
  }

  // 导航到培训课程
  const handleGoToTraining = () => {
    Taro.navigateTo({url: '/packageJ/pages/onboarding-training/index'})
  }

  // 导航到帮助中心
  const handleGoToHelp = () => {
    Taro.navigateTo({url: '/pages/help-center/index'})
  }

  // 导航到排行榜
  const handleGoToLeaderboard = () => {
    Taro.navigateTo({url: '/packageJ/pages/learning-leaderboard/index'})
  }

  // 导航到我的成就
  const _handleGoToAchievements = () => {
    Taro.navigateTo({url: '/packageJ/pages/my-achievements/index'})
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 如果没有租户
  if (!currentTenant) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-6">
        <View className="bg-card rounded-2xl p-8 shadow-lg text-center max-w-sm">
          <View className="i-mdi-alert-circle text-6xl text-warning mb-4"></View>
          <Text className="text-xl font-semibold text-foreground mb-2">未选择租户</Text>
          <Text className="text-muted-foreground mb-6">请先选择一个租户后再访问学习中心</Text>
        </View>
      </View>
    )
  }

  // 加载中
  if (loading) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <View className="text-center">
          <View className="i-mdi-loading animate-spin text-5xl text-primary mb-4"></View>
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <ScrollView scrollY className="h-screen" enableBackToTop>
        {/* 头部 */}
        <View className="bg-gradient-to-r from-primary to-primary-glow p-6 pb-8">
          <View className="flex items-center justify-between mb-6">
            <View className="flex items-center gap-3">
              <View className="i-mdi-arrow-left text-2xl text-white cursor-pointer" onClick={handleBack}></View>
              <Text className="text-2xl font-bold text-white">我的学习中心</Text>
            </View>
            <View className="i-mdi-school text-3xl text-white"></View>
          </View>

          {/* 学习进度卡片 */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <View className="flex items-center justify-between mb-4">
              <Text className="text-white/90 text-base">总体完成度</Text>
              <Text className="text-white font-bold text-2xl">{stats?.completion_rate || 0}%</Text>
            </View>
            <View className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{width: `${stats?.completion_rate || 0}%`}}></View>
            </View>
          </View>
        </View>

        {/* 内容区域 */}
        <View className="p-6 -mt-4">
          {/* 学习统计 */}
          <View className="grid grid-cols-3 gap-3 mb-6">
            <View className="bg-card rounded-xl p-4 shadow-sm text-center">
              <View className="i-mdi-book-open-page-variant text-3xl text-primary mb-2"></View>
              <Text className="text-2xl font-bold text-foreground mb-1">
                {stats?.read_handbook_sections || 0}/{stats?.total_handbook_sections || 6}
              </Text>
              <Text className="text-xs text-muted-foreground">手册章节</Text>
            </View>

            <View className="bg-card rounded-xl p-4 shadow-sm text-center">
              <View className="i-mdi-school-outline text-3xl text-secondary mb-2"></View>
              <Text className="text-2xl font-bold text-foreground mb-1">
                {stats?.completed_courses || 0}/{stats?.total_courses || 6}
              </Text>
              <Text className="text-xs text-muted-foreground">培训课程</Text>
            </View>

            <View className="bg-card rounded-xl p-4 shadow-sm text-center">
              <View className="i-mdi-trophy text-3xl text-accent mb-2"></View>
              <Text className="text-2xl font-bold text-foreground mb-1">{stats?.total_achievements || 0}</Text>
              <Text className="text-xs text-muted-foreground">学习成就</Text>
            </View>
          </View>

          {/* 学习模块 */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">学习模块</Text>

            {/* 入职手册 */}
            <View
              className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-5 mb-3 shadow-sm active:scale-98 transition-transform"
              onClick={handleGoToHandbook}>
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-4">
                  <View className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <View className="i-mdi-book-open-variant text-2xl text-white"></View>
                  </View>
                  <View>
                    <Text className="text-base font-semibold text-foreground mb-1">入职手册</Text>
                    <Text className="text-sm text-muted-foreground">
                      已读 {stats?.read_handbook_sections || 0}/{stats?.total_handbook_sections || 6} 章节
                    </Text>
                  </View>
                </View>
                <View className="i-mdi-chevron-right text-2xl text-muted-foreground"></View>
              </View>
            </View>

            {/* 培训课程 */}
            <View
              className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl p-5 mb-3 shadow-sm active:scale-98 transition-transform"
              onClick={handleGoToTraining}>
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-4">
                  <View className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <View className="i-mdi-school text-2xl text-white"></View>
                  </View>
                  <View>
                    <Text className="text-base font-semibold text-foreground mb-1">培训课程</Text>
                    <Text className="text-sm text-muted-foreground">
                      已完成 {stats?.completed_courses || 0}/{stats?.total_courses || 6} 门课程
                    </Text>
                  </View>
                </View>
                <View className="i-mdi-chevron-right text-2xl text-muted-foreground"></View>
              </View>
            </View>

            {/* 帮助中心 */}
            <View
              className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl p-5 mb-3 shadow-sm active:scale-98 transition-transform"
              onClick={handleGoToHelp}>
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-4">
                  <View className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <View className="i-mdi-help-circle text-2xl text-white"></View>
                  </View>
                  <View>
                    <Text className="text-base font-semibold text-foreground mb-1">帮助中心</Text>
                    <Text className="text-sm text-muted-foreground">常见问题与解答</Text>
                  </View>
                </View>
                <View className="i-mdi-chevron-right text-2xl text-muted-foreground"></View>
              </View>
            </View>

            {/* 学习排行榜 */}
            <View
              className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-xl p-5 shadow-sm active:scale-98 transition-transform"
              onClick={handleGoToLeaderboard}>
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-4">
                  <View className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <View className="i-mdi-trophy-variant text-2xl text-white"></View>
                  </View>
                  <View>
                    <Text className="text-base font-semibold text-foreground mb-1">学习排行榜</Text>
                    <Text className="text-sm text-muted-foreground">看看谁是学习之星</Text>
                  </View>
                </View>
                <View className="i-mdi-chevron-right text-2xl text-muted-foreground"></View>
              </View>
            </View>
          </View>

          {/* 学习成就 */}
          {achievements.length > 0 && (
            <View className="mb-6">
              <View className="flex items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">学习成就</Text>
                <View
                  className="flex items-center text-primary"
                  onClick={() => Taro.navigateTo({url: '/packageJ/pages/my-achievements/index'})}>
                  <Text className="text-sm mr-1">查看全部</Text>
                  <View className="i-mdi-chevron-right text-lg"></View>
                </View>
              </View>
              <View className="grid grid-cols-4 gap-3">
                {achievements.slice(0, 4).map((achievement) => (
                  <View key={achievement.id} className="text-center">
                    <View className="w-16 h-16 bg-gradient-to-br from-accent to-accent/70 rounded-2xl flex items-center justify-center mb-2 mx-auto shadow-md">
                      <View className={`${achievement.achievement_icon || 'i-mdi-trophy'} text-3xl text-white`}></View>
                    </View>
                    <Text className="text-xs text-muted-foreground line-clamp-2">{achievement.achievement_name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 学习提示 */}
          <View className="bg-muted/30 rounded-xl p-5">
            <View className="flex items-start gap-3">
              <View className="i-mdi-lightbulb-on text-2xl text-accent mt-1"></View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-2">学习小贴士</Text>
                <Text className="text-sm text-muted-foreground leading-relaxed">
                  完成所有入职手册和培训课程，可以获得"学习达人"成就徽章！继续加油！
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 底部间距 */}
        <View className="h-20"></View>
      </ScrollView>
    </View>
  )
}

export default MyLearningCenter
