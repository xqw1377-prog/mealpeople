/**
 * 我的成就页面
 *
 * 功能：
 * - 展示已获得的成就
 * - 成就详情查看
 * - 成就统计
 * - 响应式设计
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api-employees'
import {getLearningAchievements} from '@/db/api-onboarding-enhancement'
import type {LearningAchievement} from '@/db/types/onboarding-enhancement'
import {useTenantStore} from '@/store/tenant'

// 成就图标映射
const ACHIEVEMENT_ICONS: Record<string, {icon: string; color: string; bgColor: string}> = {
  handbook_master: {
    icon: 'i-mdi-book-open-page-variant',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  training_master: {
    icon: 'i-mdi-school',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  quick_learner: {
    icon: 'i-mdi-lightning-bolt',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  help_seeker: {
    icon: 'i-mdi-help-circle',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  feedback_provider: {
    icon: 'i-mdi-comment-text',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  }
}

// 成就名称映射
const ACHIEVEMENT_NAMES: Record<string, string> = {
  handbook_master: '手册达人',
  training_master: '培训达人',
  quick_learner: '快速学习者',
  help_seeker: '求知若渴',
  feedback_provider: '反馈达人'
}

// 成就描述映射
const ACHIEVEMENT_DESCRIPTIONS: Record<string, string> = {
  handbook_master: '完成所有入职手册的阅读',
  training_master: '完成所有培训课程',
  quick_learner: '在规定时间内完成所有学习任务',
  help_seeker: '积极使用帮助中心查找问题',
  feedback_provider: '为帮助文章提供有价值的反馈'
}

export default function MyAchievements() {
  const {user} = useAuth()
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<LearningAchievement[]>([])

  // 加载成就列表
  const loadAchievements = useCallback(async () => {
    if (!currentTenant || !user) {
      setLoading(false)
      return
    }

    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        setLoading(false)
        return
      }

      const data = await getLearningAchievements(employee.id)
      setAchievements(data)
    } catch (error) {
      console.error('加载成就失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useEffect(() => {
    loadAchievements()
  }, [loadAchievements])

  useDidShow(() => {
    loadAchievements()
  })

  // 获取成就图标配置
  const getAchievementIcon = (achievementType: string) => {
    return ACHIEVEMENT_ICONS[achievementType] || {icon: 'i-mdi-trophy', color: 'text-gray-600', bgColor: 'bg-gray-100'}
  }

  // 获取成就名称
  const getAchievementName = (achievementType: string) => {
    return ACHIEVEMENT_NAMES[achievementType] || '未知成就'
  }

  // 获取成就描述
  const getAchievementDescription = (achievementType: string) => {
    return ACHIEVEMENT_DESCRIPTIONS[achievementType] || '暂无描述'
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #fef3c7, #fde68a)'}}>
      {/* 头部 */}
      <View className="bg-primary text-white p-6 rounded-b-3xl">
        <View className="flex items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold block mb-2">我的成就</Text>
            <Text className="text-sm opacity-90 block">记录每一次进步</Text>
          </View>
          <View className="i-mdi-trophy text-5xl opacity-20"></View>
        </View>

        {/* 统计卡片 */}
        <View className="bg-white/20 rounded-xl p-4">
          <View className="flex items-center justify-center">
            <View className="text-center">
              <Text className="text-4xl font-bold block mb-1">{achievements.length}</Text>
              <Text className="text-sm opacity-90 block">已获得成就</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 成就列表 */}
      <View className="p-4">
        {loading ? (
          <View className="text-center py-8">
            <Text className="text-muted-foreground">加载中...</Text>
          </View>
        ) : achievements.length === 0 ? (
          <View className="text-center py-8">
            <View className="i-mdi-trophy-outline text-6xl text-muted-foreground/30 mb-4"></View>
            <Text className="text-muted-foreground block mb-2">暂无成就</Text>
            <Text className="text-xs text-muted-foreground block">完成学习任务即可获得成就</Text>
          </View>
        ) : (
          achievements.map((achievement) => {
            const iconConfig = getAchievementIcon(achievement.achievement_type)
            return (
              <View key={achievement.id} className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
                <View className="flex items-start">
                  <View className={`w-16 h-16 rounded-2xl ${iconConfig.bgColor} flex items-center justify-center mr-4`}>
                    <View className={`${iconConfig.icon} text-3xl ${iconConfig.color}`}></View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground block mb-1">
                      {getAchievementName(achievement.achievement_type)}
                    </Text>
                    <Text className="text-sm text-muted-foreground block mb-2">
                      {getAchievementDescription(achievement.achievement_type)}
                    </Text>
                    <View className="flex items-center">
                      <View className="i-mdi-calendar text-sm text-muted-foreground mr-1"></View>
                      <Text className="text-xs text-muted-foreground">
                        {new Date(achievement.earned_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )
          })
        )}
      </View>

      {/* 提示信息 */}
      {achievements.length > 0 && (
        <View className="p-4 pb-8">
          <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <View className="flex items-start">
              <View className="i-mdi-star text-2xl text-yellow-500 mr-3 mt-0.5"></View>
              <View className="flex-1">
                <Text className="text-sm text-yellow-900 block mb-1 font-medium">继续努力</Text>
                <Text className="text-xs text-yellow-700 block">
                  继续完成学习任务，解锁更多成就！每个成就都是你成长的见证。
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
