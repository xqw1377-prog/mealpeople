/**
 * 我的培训页面
 * 3.0 版本 - 培训管理系统
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {completeTraining, getEmployeeTrainingStats, getTrainingRecords, startTraining} from '@/db/api-training'
import {getEmployeeByUserId} from '@/db/modules/user'
import type {EmployeeTrainingStats, TrainingRecordDetail, TrainingStatus} from '@/db/types-training'
import {
  TRAINING_CATEGORY_COLORS,
  TRAINING_CATEGORY_NAMES,
  TRAINING_STATUS_COLORS,
  TRAINING_STATUS_NAMES
} from '@/db/types-training'
import {useTenantStore} from '@/store/tenant'

const MyTraining: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [records, setRecords] = useState<TrainingRecordDetail[]>([])
  const [stats, setStats] = useState<EmployeeTrainingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | TrainingStatus>('all')

  // 加载培训记录和统计
  const loadTrainingData = useCallback(async () => {
    if (!currentTenant?.id || !user?.id) return

    setLoading(true)
    try {
      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        Taro.showToast({
          title: '未找到员工信息',
          icon: 'none'
        })
        return
      }

      // 加载培训记录
      const recordList = await getTrainingRecords(employee.id)
      setRecords(recordList)

      // 加载培训统计
      const trainingStats = await getEmployeeTrainingStats(employee.id)
      setStats(trainingStats)
    } catch (error) {
      console.error('加载培训数据失败:', error)
      Taro.showToast({
        title: '加载培训数据失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, user?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadTrainingData()
  })

  // 下拉刷新处理
  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await loadTrainingData()
      setTimeout(() => {
        setRefreshing(false)
        Taro.showToast({title: '刷新成功', icon: 'success', duration: 1500})
      }, 500)
    } catch (_error) {
      setRefreshing(false)
      Taro.showToast({title: '刷新失败', icon: 'error'})
    }
  }

  // 开始培训
  const handleStartTraining = async (recordId: string) => {
    try {
      await startTraining(recordId)
      Taro.showToast({
        title: '已开始培训',
        icon: 'success'
      })
      loadTrainingData()
    } catch (error) {
      console.error('开始培训失败:', error)
      Taro.showToast({
        title: '开始培训失败',
        icon: 'none'
      })
    }
  }

  // 完成培训
  const handleCompleteTraining = async (recordId: string) => {
    try {
      await completeTraining(recordId)
      Taro.showToast({
        title: '培训已完成',
        icon: 'success'
      })
      loadTrainingData()
    } catch (error) {
      console.error('完成培训失败:', error)
      Taro.showToast({
        title: '完成培训失败',
        icon: 'none'
      })
    }
  }

  // 筛选记录
  const filteredRecords = activeTab === 'all' ? records : records.filter((r) => r.status === activeTab)

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen box-border bg-transparent"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4">
          {/* 标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的培训</Text>
            <Text className="text-sm text-muted-foreground mt-1">学习成长，持续进步</Text>
          </View>

          {/* 培训统计 */}
          {stats && (
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm mb-4">
              <Text className="text-lg font-bold text-foreground mb-4">培训统计</Text>

              <View className="grid grid-cols-2 gap-4">
                {/* 总课程数 */}
                <View className="text-center p-3 bg-blue-100 rounded-lg">
                  <Text className="text-2xl font-bold text-muted-foreground">{stats.total_courses}</Text>
                  <Text className="text-xs text-muted-foreground mt-1">总课程数</Text>
                </View>

                {/* 已完成 */}
                <View className="text-center p-3 bg-blue-100 rounded-lg">
                  <Text className="text-2xl font-bold text-muted-foreground">{stats.completed_courses}</Text>
                  <Text className="text-xs text-muted-foreground mt-1">已完成</Text>
                </View>

                {/* 总学时 */}
                <View className="text-center p-3 bg-blue-100 rounded-lg">
                  <Text className="text-2xl font-bold text-muted-foreground">{stats.total_hours.toFixed(1)}</Text>
                  <Text className="text-xs text-muted-foreground mt-1">总学时</Text>
                </View>

                {/* 平均分数 */}
                <View className="text-center p-3 bg-blue-100 rounded-lg">
                  <Text className="text-2xl font-bold text-muted-foreground">
                    {stats.average_score ? stats.average_score.toFixed(1) : '-'}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">平均分数</Text>
                </View>
              </View>

              {/* 完成率 */}
              <View className="mt-4 pt-4 border-t border-border">
                <View className="flex flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-muted-foreground">完成率</Text>
                  <Text className="text-sm font-medium text-foreground">{stats.completion_rate.toFixed(1)}%</Text>
                </View>
                <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View className="h-full bg-blue-100 rounded-full" style={{width: `${stats.completion_rate}%`}} />
                </View>
              </View>
            </View>
          )}

          {/* 状态筛选 */}
          <View className="flex flex-row gap-2 mb-4 overflow-x-auto">
            <View
              className={`px-4 py-2 rounded-lg ${activeTab === 'all' ? 'bg-green-500' : 'bg-white'}`}
              onClick={() => setActiveTab('all')}>
              <Text className={activeTab === 'all' ? 'text-white font-medium' : 'text-foreground'}>全部</Text>
            </View>
            <View
              className={`px-4 py-2 rounded-lg ${activeTab === 'enrolled' ? 'bg-green-500' : 'bg-white'}`}
              onClick={() => setActiveTab('enrolled')}>
              <Text className={activeTab === 'enrolled' ? 'text-white font-medium' : 'text-foreground'}>已报名</Text>
            </View>
            <View
              className={`px-4 py-2 rounded-lg ${activeTab === 'in_progress' ? 'bg-yellow-500' : 'bg-white'}`}
              onClick={() => setActiveTab('in_progress')}>
              <Text className={activeTab === 'in_progress' ? 'text-white font-medium' : 'text-foreground'}>进行中</Text>
            </View>
            <View
              className={`px-4 py-2 rounded-lg ${activeTab === 'completed' ? 'bg-blue-100' : 'bg-white'}`}
              onClick={() => setActiveTab('completed')}>
              <Text className={activeTab === 'completed' ? 'text-blue-600 font-medium' : 'text-foreground'}>
                已完成
              </Text>
            </View>
          </View>

          {/* 加载状态 */}
          {loading && (
            <View className="flex items-center justify-center py-20">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          )}

          {/* 空状态 */}
          {!loading && filteredRecords.length === 0 && (
            <View className="flex flex-col items-center justify-center py-20">
              <View className="i-mdi-school-outline text-6xl text-muted-foreground mb-4" />
              <Text className="text-muted-foreground">暂无培训记录</Text>
            </View>
          )}

          {/* 培训记录列表 */}
          {!loading && filteredRecords.length > 0 && (
            <View className="space-y-3">
              {filteredRecords.map((record) => (
                <View key={record.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  {/* 课程标题和状态 */}
                  <View className="flex flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                      <Text className="text-lg font-bold text-foreground mb-1">{record.course_title}</Text>
                      <View className="flex flex-row items-center gap-2">
                        <View className={`px-2 py-1 rounded ${TRAINING_CATEGORY_COLORS[record.course_category]}`}>
                          <Text className="text-xs font-medium">{TRAINING_CATEGORY_NAMES[record.course_category]}</Text>
                        </View>
                        <View className={`px-2 py-1 rounded ${TRAINING_STATUS_COLORS[record.status]}`}>
                          <Text className="text-xs font-medium">{TRAINING_STATUS_NAMES[record.status]}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 课程信息 */}
                  <View className="flex flex-row items-center gap-4 text-sm text-muted-foreground mb-3">
                    <View className="flex flex-row items-center gap-1">
                      <View className="i-mdi-clock-outline text-base" />
                      <Text className="text-xs">{record.course_duration_hours}小时</Text>
                    </View>
                    {record.course_instructor && (
                      <View className="flex flex-row items-center gap-1">
                        <View className="i-mdi-account text-base" />
                        <Text className="text-xs">{record.course_instructor}</Text>
                      </View>
                    )}
                    {record.score !== null && (
                      <View className="flex flex-row items-center gap-1">
                        <View className="i-mdi-star text-base text-yellow-500" />
                        <Text className="text-xs">{record.score}分</Text>
                      </View>
                    )}
                  </View>

                  {/* 进度条 */}
                  {record.status === 'in_progress' && (
                    <View className="mb-3">
                      <View className="flex flex-row items-center justify-between mb-1">
                        <Text className="text-xs text-muted-foreground">学习进度</Text>
                        <Text className="text-xs font-medium text-foreground">{record.progress}%</Text>
                      </View>
                      <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View className="h-full bg-blue-100 rounded-full" style={{width: `${record.progress}%`}} />
                      </View>
                    </View>
                  )}

                  {/* 操作按钮 */}
                  <View className="flex flex-row gap-2 pt-3 border-t border-border">
                    {record.status === 'enrolled' && (
                      <Button
                        className="flex-1 bg-blue-100 text-white py-2 rounded-lg break-keep text-sm"
                        size="default"
                        onClick={() => handleStartTraining(record.id)}>
                        开始学习
                      </Button>
                    )}
                    {record.status === 'in_progress' && (
                      <Button
                        className="flex-1 bg-green-600 text-blue-600 py-2 rounded-lg break-keep text-sm"
                        size="default"
                        onClick={() => handleCompleteTraining(record.id)}>
                        完成培训
                      </Button>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default MyTraining
