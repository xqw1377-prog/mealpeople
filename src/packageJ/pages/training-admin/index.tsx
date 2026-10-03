/**
 * 培训管理页面（管理员）
 * 3.0 版本 - 培训管理系统
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {deleteTrainingCourse, getTrainingCourses, getTrainingRecords} from '@/db/api-training'
import type {TrainingCourse, TrainingRecordDetail} from '@/db/types-training'
import {
  TRAINING_CATEGORY_COLORS,
  TRAINING_CATEGORY_NAMES,
  TRAINING_STATUS_COLORS,
  TRAINING_STATUS_NAMES
} from '@/db/types-training'
import {useTenantStore} from '@/store/tenant'

const TrainingAdmin: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'courses' | 'records'>('courses')
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [records, setRecords] = useState<TrainingRecordDetail[]>([])

  // 加载培训课程
  const loadCourses = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      const data = await getTrainingCourses(currentTenant.id)
      setCourses(data)
    } catch (error) {
      console.error('加载培训课程失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  }, [currentTenant?.id])

  // 加载培训记录
  const loadRecords = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      const data = await getTrainingRecords(currentTenant.id)
      setRecords(data)
    } catch (error) {
      console.error('加载培训记录失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  }, [currentTenant?.id])

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant?.id || !user?.id) return

    setLoading(true)
    try {
      // 同时加载课程和记录数据，用于统计
      await Promise.all([loadCourses(), loadRecords()])
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, user?.id, loadCourses, loadRecords])

  useDidShow(() => {
    loadData()
  })

  // 删除课程
  const handleDeleteCourse = async (courseId: string) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个培训课程吗？删除后无法恢复。'
    })

    if (!result.confirm) return

    try {
      await deleteTrainingCourse(courseId)
      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      })
      loadCourses()
    } catch (error) {
      console.error('删除课程失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'none'
      })
    }
  }

  // 创建课程
  const handleCreateCourse = () => {
    Taro.navigateTo({url: '/packageJ/pages/training-course-create/index'})
  }

  // 编辑课程
  const handleEditCourse = (courseId: string) => {
    Taro.navigateTo({url: `/pages/training-course-edit/index?id=${courseId}`})
  }

  // 查看课程详情
  const handleViewCourse = (courseId: string) => {
    Taro.navigateTo({url: `/pages/training-course-detail/index?id=${courseId}`})
  }

  // 查看培训记录详情
  const handleViewRecord = (recordId: string) => {
    Taro.navigateTo({url: `/pages/training-record-detail/index?id=${recordId}`})
  }

  // 计算统计数据
  const stats = {
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.status === 'published').length,
    totalRecords: records.length,
    completedRecords: records.filter((r) => r.status === 'completed').length,
    inProgressRecords: records.filter((r) => r.status === 'in_progress').length,
    averageProgress:
      records.length > 0 ? Math.round(records.reduce((sum, r) => sum + r.progress, 0) / records.length) : 0
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
            <View className="flex flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-foreground">培训管理</Text>
                <Text className="text-sm text-muted-foreground mt-1">管理培训课程和员工培训记录</Text>
              </View>
              <View className="i-mdi-school text-4xl text-blue-600" />
            </View>
          </View>

          {/* 数据统计卡片 */}
          <View className="grid grid-cols-2 gap-3">
            {/* 课程统计 */}
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <View className="flex flex-row items-center gap-2 mb-2">
                <View className="i-mdi-book-open-variant text-xl text-blue-500" />
                <Text className="text-sm text-muted-foreground">总课程数</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">{stats.totalCourses}</Text>
              <Text className="text-xs text-muted-foreground mt-1">已发布 {stats.publishedCourses} 门</Text>
            </View>

            {/* 培训记录统计 */}
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <View className="flex flex-row items-center gap-2 mb-2">
                <View className="i-mdi-clipboard-text text-xl text-green-500" />
                <Text className="text-sm text-muted-foreground">培训记录</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">{stats.totalRecords}</Text>
              <Text className="text-xs text-muted-foreground mt-1">已完成 {stats.completedRecords} 条</Text>
            </View>

            {/* 进行中统计 */}
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <View className="flex flex-row items-center gap-2 mb-2">
                <View className="i-mdi-progress-clock text-xl text-orange-500" />
                <Text className="text-sm text-muted-foreground">进行中</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">{stats.inProgressRecords}</Text>
              <Text className="text-xs text-muted-foreground mt-1">培训进行中</Text>
            </View>

            {/* 平均进度统计 */}
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200">
              <View className="flex flex-row items-center gap-2 mb-2">
                <View className="i-mdi-chart-line text-xl text-purple-500" />
                <Text className="text-sm text-muted-foreground">平均进度</Text>
              </View>
              <Text className="text-2xl font-bold text-foreground">{stats.averageProgress}%</Text>
              <Text className="text-xs text-muted-foreground mt-1">整体完成度</Text>
            </View>
          </View>

          {/* 标签页切换 */}
          <View className="flex flex-row gap-2">
            <View
              className={`flex-1 py-3 rounded-xl text-center ${activeTab === 'courses' ? 'bg-green-500' : 'bg-white'}`}
              onClick={() => setActiveTab('courses')}>
              <Text className={`font-medium ${activeTab === 'courses' ? 'text-white' : 'text-foreground'}`}>
                培训课程
              </Text>
            </View>
            <View
              className={`flex-1 py-3 rounded-xl text-center ${activeTab === 'records' ? 'bg-blue-100' : 'bg-white'}`}
              onClick={() => setActiveTab('records')}>
              <Text className={`font-medium ${activeTab === 'records' ? 'text-blue-600' : 'text-foreground'}`}>
                培训记录
              </Text>
            </View>
          </View>

          {loading ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-loading animate-spin text-4xl text-blue-600 mb-2" />
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : (
            <>
              {/* 培训课程列表 */}
              {activeTab === 'courses' && (
                <View className="space-y-4">
                  {/* 创建课程按钮 */}
                  <Button
                    className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
                    size="default"
                    onClick={handleCreateCourse}>
                    <View className="flex flex-row items-center justify-center gap-2">
                      <View className="i-mdi-plus-circle text-xl" />
                      <Text className="text-blue-600">创建培训课程</Text>
                    </View>
                  </Button>

                  {courses.length > 0 ? (
                    <View className="space-y-3">
                      {courses.map((course) => (
                        <View key={course.id} className="bg-white rounded-lg p-4 border-2 border-gray-200">
                          {/* 课程标题和状态 */}
                          <View className="flex flex-row items-start justify-between mb-3">
                            <View className="flex-1">
                              <Text className="text-lg font-semibold text-foreground">{course.title}</Text>
                              <View className="flex flex-row items-center gap-2 mt-1">
                                <View className={`px-2 py-1 rounded ${TRAINING_CATEGORY_COLORS[course.category]}`}>
                                  <Text className="text-xs text-white">{TRAINING_CATEGORY_NAMES[course.category]}</Text>
                                </View>
                                <View
                                  className={`px-2 py-1 rounded ${
                                    course.status === 'published' ? 'bg-blue-100' : 'bg-gray-400'
                                  }`}>
                                  <Text className="text-xs text-blue-600">
                                    {course.status === 'published'
                                      ? '已发布'
                                      : course.status === 'draft'
                                        ? '草稿'
                                        : '已归档'}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          {/* 课程信息 */}
                          <View className="space-y-2 mb-3">
                            <View className="flex flex-row items-center gap-2">
                              <View className="i-mdi-clock-outline text-base text-muted-foreground" />
                              <Text className="text-sm text-muted-foreground">时长：{course.duration_hours}小时</Text>
                            </View>
                            <View className="flex flex-row items-center gap-2">
                              <View className="i-mdi-account-tie text-base text-muted-foreground" />
                              <Text className="text-sm text-muted-foreground">讲师：{course.instructor}</Text>
                            </View>
                            {course.max_participants && (
                              <View className="flex flex-row items-center gap-2">
                                <View className="i-mdi-account-group text-base text-muted-foreground" />
                                <Text className="text-sm text-muted-foreground">
                                  人数限制：{course.max_participants}人
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* 操作按钮 */}
                          <View className="flex flex-row gap-2">
                            <View
                              className="flex-1 py-2 bg-blue-100 rounded-lg text-center"
                              onClick={() => handleViewCourse(course.id)}>
                              <Text className="text-muted-foreground text-sm">查看</Text>
                            </View>
                            <View
                              className="flex-1 py-2 bg-blue-100 rounded-lg text-center"
                              onClick={() => handleEditCourse(course.id)}>
                              <Text className="text-muted-foreground text-sm">编辑</Text>
                            </View>
                            <View
                              className="flex-1 py-2 bg-blue-100 rounded-lg text-center"
                              onClick={() => handleDeleteCourse(course.id)}>
                              <Text className="text-red-600 text-sm">删除</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
                      <View className="i-mdi-book-open-page-variant text-4xl text-muted-foreground mb-2" />
                      <Text className="text-muted-foreground">暂无培训课程</Text>
                      <Text className="text-xs text-muted-foreground mt-2">点击上方按钮创建第一个课程</Text>
                    </View>
                  )}
                </View>
              )}

              {/* 培训记录列表 */}
              {activeTab === 'records' && (
                <View className="space-y-3">
                  {records.length > 0 ? (
                    records.map((record) => (
                      <View
                        key={record.id}
                        className="bg-white rounded-lg p-4 border-2 border-gray-200"
                        onClick={() => handleViewRecord(record.id)}>
                        {/* 员工和课程信息 */}
                        <View className="flex flex-row items-start justify-between mb-3">
                          <View className="flex-1">
                            <Text className="text-base font-semibold text-foreground">
                              {record.employee?.name || '未知员工'}
                            </Text>
                            <Text className="text-sm text-muted-foreground mt-1">{record.course?.title}</Text>
                          </View>
                          <View className={`px-2 py-1 rounded ${TRAINING_STATUS_COLORS[record.status]}`}>
                            <Text className="text-xs text-white">{TRAINING_STATUS_NAMES[record.status]}</Text>
                          </View>
                        </View>

                        {/* 培训信息 */}
                        <View className="space-y-2">
                          <View className="flex flex-row items-center gap-2">
                            <View className="i-mdi-calendar text-base text-muted-foreground" />
                            <Text className="text-sm text-muted-foreground">
                              报名时间：{new Date(record.enrolled_at).toLocaleDateString()}
                            </Text>
                          </View>
                          {record.started_at && (
                            <View className="flex flex-row items-center gap-2">
                              <View className="i-mdi-play-circle text-base text-muted-foreground" />
                              <Text className="text-sm text-muted-foreground">
                                开始时间：{new Date(record.started_at).toLocaleDateString()}
                              </Text>
                            </View>
                          )}
                          {record.completed_at && (
                            <View className="flex flex-row items-center gap-2">
                              <View className="i-mdi-check-circle text-base text-muted-foreground" />
                              <Text className="text-sm text-muted-foreground">
                                完成时间：{new Date(record.completed_at).toLocaleDateString()}
                              </Text>
                            </View>
                          )}
                          {record.progress !== null && (
                            <View className="flex flex-row items-center gap-2">
                              <View className="i-mdi-progress-check text-base text-muted-foreground" />
                              <Text className="text-sm text-muted-foreground">学习进度：{record.progress}%</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
                      <View className="i-mdi-clipboard-text-outline text-4xl text-muted-foreground mb-2" />
                      <Text className="text-muted-foreground">暂无培训记录</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default TrainingAdmin
