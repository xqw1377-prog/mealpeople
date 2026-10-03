/**
 * 学习排行榜页面
 *
 * 功能：
 * - 展示租户内所有员工的学习排名
 * - 按学习成就数量排序
 * - 显示个人排名和进度
 * - 激励员工学习
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import {useTenantStore} from '@/store/tenant'

// 排行榜数据类型
interface LeaderboardEntry {
  employeeId: string
  employeeName: string
  achievementCount: number
  handbookProgress: number
  trainingProgress: number
  totalScore: number
  rank: number
}

export default function LearningLeaderboard() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null)

  // 加载排行榜数据
  const loadLeaderboard = useCallback(async () => {
    if (!currentTenant || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 获取当前员工信息
      const currentEmployee = await getEmployeeByUserId(user.id)
      if (!currentEmployee) {
        Taro.showToast({title: '未找到员工信息', icon: 'none'})
        setLoading(false)
        return
      }

      // 获取租户下所有员工
      const {data: employees, error: empError} = await supabase
        .from('employees')
        .select('id, name')
        .eq('tenant_id', currentTenant.id)

      if (empError) throw empError

      // 为每个员工计算学习分数
      const entries: LeaderboardEntry[] = []

      for (const employee of employees || []) {
        // 获取成就数量
        const {data: achievements} = await supabase
          .from('learning_achievements')
          .select('id')
          .eq('employee_id', employee.id)

        const achievementCount = achievements?.length || 0

        // 获取手册阅读进度
        const {data: handbookProgress} = await supabase
          .from('handbook_reading_progress')
          .select('progress_percentage')
          .eq('employee_id', employee.id)
          .maybeSingle()

        const handbookProgressValue = handbookProgress?.progress_percentage || 0

        // 获取培训进度（假设有培训记录表）
        const trainingProgressValue = 0 // 暂时设为0，后续可以从培训记录表获取

        // 计算总分：成就数 * 100 + 手册进度 + 培训进度
        const totalScore = achievementCount * 100 + handbookProgressValue + trainingProgressValue

        entries.push({
          employeeId: employee.id,
          employeeName: employee.name || '未命名',
          achievementCount,
          handbookProgress: handbookProgressValue,
          trainingProgress: trainingProgressValue,
          totalScore,
          rank: 0
        })
      }

      // 按总分排序并分配排名
      entries.sort((a, b) => b.totalScore - a.totalScore)
      entries.forEach((entry, index) => {
        entry.rank = index + 1
      })

      setLeaderboard(entries)

      // 找到当前用户的排名
      const myEntry = entries.find((e) => e.employeeId === currentEmployee.id)
      setMyRank(myEntry || null)
    } catch (error) {
      console.error('加载排行榜失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  useDidShow(() => {
    loadLeaderboard()
  })

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 获取排名图标
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return 'i-mdi-trophy text-yellow-500'
      case 2:
        return 'i-mdi-medal text-gray-400'
      case 3:
        return 'i-mdi-medal text-orange-600'
      default:
        return 'i-mdi-account-circle text-muted-foreground'
    }
  }

  // 获取排名颜色
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300'
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300'
      case 3:
        return 'bg-gradient-to-r from-orange-100 to-orange-50 border-orange-300'
      default:
        return 'bg-white border-gray-200'
    }
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)'}}>
      {/* 头部 */}
      <View className="bg-primary text-white p-6 rounded-b-3xl">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">学习排行榜</Text>
            <Text className="text-sm opacity-90 block">看看谁是学习之星</Text>
          </View>
          <View className="i-mdi-trophy-variant text-5xl opacity-20"></View>
        </View>
      </View>

      {loading ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 我的排名卡片 */}
          {myRank && (
            <View className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 mb-6 shadow-lg">
              <Text className="text-white text-sm opacity-90 mb-2 block">我的排名</Text>
              <View className="flex flex-row items-center justify-between">
                <View className="flex flex-row items-center">
                  <View className="bg-white bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                    <Text className="text-white text-xl font-bold">#{myRank.rank}</Text>
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg block">{myRank.employeeName}</Text>
                    <Text className="text-white text-sm opacity-90 block">{myRank.achievementCount} 个成就</Text>
                  </View>
                </View>
                <View className="text-right">
                  <Text className="text-white text-2xl font-bold block">{myRank.totalScore}</Text>
                  <Text className="text-white text-xs opacity-90 block">总分</Text>
                </View>
              </View>
            </View>
          )}

          {/* 排行榜列表 */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-foreground mb-4">全部排名</Text>
            {leaderboard.map((entry) => (
              <View
                key={entry.employeeId}
                className={`${getRankColor(entry.rank)} rounded-2xl p-4 mb-3 border-2 shadow-sm`}>
                <View className="flex flex-row items-center justify-between">
                  <View className="flex flex-row items-center flex-1">
                    {/* 排名 */}
                    <View className="w-12 h-12 flex items-center justify-center mr-3">
                      {entry.rank <= 3 ? (
                        <View className={`${getRankIcon(entry.rank)} text-3xl`}></View>
                      ) : (
                        <Text className="text-muted-foreground text-lg font-bold">#{entry.rank}</Text>
                      )}
                    </View>

                    {/* 员工信息 */}
                    <View className="flex-1">
                      <Text className="text-foreground font-bold text-base block mb-1">{entry.employeeName}</Text>
                      <View className="flex flex-row items-center">
                        <View className="i-mdi-trophy-outline text-sm text-muted-foreground mr-1"></View>
                        <Text className="text-muted-foreground text-xs">{entry.achievementCount} 个成就</Text>
                        <Text className="text-muted-foreground text-xs mx-2">•</Text>
                        <View className="i-mdi-book-open-page-variant text-sm text-muted-foreground mr-1"></View>
                        <Text className="text-muted-foreground text-xs">{entry.handbookProgress.toFixed(0)}% 手册</Text>
                      </View>
                    </View>
                  </View>

                  {/* 总分 */}
                  <View className="text-right ml-3">
                    <Text className="text-primary text-xl font-bold block">{entry.totalScore}</Text>
                    <Text className="text-muted-foreground text-xs block">总分</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* 空状态 */}
          {leaderboard.length === 0 && (
            <View className="text-center py-12">
              <View className="i-mdi-trophy-broken text-6xl text-muted-foreground mb-4"></View>
              <Text className="text-muted-foreground text-base block">暂无排行榜数据</Text>
              <Text className="text-muted-foreground text-sm block mt-2">完成学习任务后即可上榜</Text>
            </View>
          )}

          {/* 返回按钮 */}
          <View className="mt-6">
            <View
              onClick={handleBack}
              className="bg-white border-2 border-gray-200 rounded-xl py-3 px-6 flex items-center justify-center active:bg-gray-50">
              <View className="i-mdi-arrow-left text-xl text-foreground mr-2"></View>
              <Text className="text-foreground font-medium">返回</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
