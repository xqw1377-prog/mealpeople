/**
 * 培训课程详情页面
 * 3.0 版本 - 培训管理系统
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {createTrainingRecord, getTrainingCourseById} from '@/db/api-training'
import {getEmployeeByUserId} from '@/db/modules/user'
import type {TrainingCourseDetail as TrainingCourseDetailType} from '@/db/types-training'
import {TRAINING_CATEGORY_COLORS, TRAINING_CATEGORY_NAMES} from '@/db/types-training'
import {useTenantStore} from '@/store/tenant'

const TrainingCourseDetail: React.FC = () => {
  const router = useRouter()
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [course, setCourse] = useState<TrainingCourseDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  // 加载课程详情
  const loadCourseDetail = useCallback(async () => {
    const courseId = router.params.id
    if (!courseId) return

    setLoading(true)
    try {
      const courseDetail = await getTrainingCourseById(courseId)
      setCourse(courseDetail)
    } catch (error) {
      console.error('加载课程详情失败:', error)
      Taro.showToast({
        title: '加载课程详情失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [router.params.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadCourseDetail()
  })

  // 报名课程
  const handleEnroll = async () => {
    if (!course || !currentTenant?.id || !user?.id) return

    setEnrolling(true)
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

      // 创建培训记录
      await createTrainingRecord({
        tenant_id: currentTenant.id,
        course_id: course.id,
        employee_id: employee.id
      })

      Taro.showToast({
        title: '报名成功',
        icon: 'success'
      })

      // 跳转到我的培训页面
      setTimeout(() => {
        Taro.navigateTo({
          url: '/packageJ/pages/my-training/index'
        })
      }, 1500)
    } catch (error) {
      console.error('报名失败:', error)
      Taro.showToast({
        title: '报名失败',
        icon: 'none'
      })
    } finally {
      setEnrolling(false)
    }
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!course) {
    return (
      <View className="flex flex-col items-center justify-center h-screen">
        <View className="i-mdi-alert-circle text-6xl text-muted-foreground mb-4" />
        <Text className="text-muted-foreground">课程不存在</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 课程标题 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm mb-4">
            <View className="flex flex-row items-start justify-between mb-3">
              <Text className="text-2xl font-bold text-foreground flex-1 mr-3">{course.title}</Text>
              <View className={`px-3 py-1 rounded ${TRAINING_CATEGORY_COLORS[course.category]}`}>
                <Text className="text-sm font-medium">{TRAINING_CATEGORY_NAMES[course.category]}</Text>
              </View>
            </View>

            {course.description && (
              <Text className="text-base text-muted-foreground leading-relaxed">{course.description}</Text>
            )}
          </View>

          {/* 课程信息 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm mb-4">
            <Text className="text-lg font-bold text-foreground mb-4">课程信息</Text>

            <View className="space-y-3">
              {/* 课程时长 */}
              <View className="flex flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <View className="i-mdi-clock-outline text-xl text-muted-foreground" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted-foreground">课程时长</Text>
                  <Text className="text-base font-medium text-foreground">{course.duration_hours} 小时</Text>
                </View>
              </View>

              {/* 讲师 */}
              {course.instructor && (
                <View className="flex flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <View className="i-mdi-account text-xl text-muted-foreground" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-muted-foreground">授课讲师</Text>
                    <Text className="text-base font-medium text-foreground">{course.instructor}</Text>
                  </View>
                </View>
              )}

              {/* 人数限制 */}
              {course.max_participants && (
                <View className="flex flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <View className="i-mdi-account-group text-xl text-muted-foreground" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-muted-foreground">人数限制</Text>
                    <Text className="text-base font-medium text-foreground">最多 {course.max_participants} 人</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* 课程统计 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm mb-4">
            <Text className="text-lg font-bold text-foreground mb-4">课程统计</Text>

            <View className="grid grid-cols-3 gap-4">
              {/* 报名人数 */}
              <View className="text-center">
                <Text className="text-2xl font-bold text-blue-600">{course.enrolled_count}</Text>
                <Text className="text-xs text-muted-foreground mt-1">报名人数</Text>
              </View>

              {/* 完成人数 */}
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">{course.completed_count}</Text>
                <Text className="text-xs text-muted-foreground mt-1">完成人数</Text>
              </View>

              {/* 平均分数 */}
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">
                  {course.average_score ? course.average_score.toFixed(1) : '-'}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">平均分数</Text>
              </View>
            </View>
          </View>

          {/* 报名按钮 */}
          <View className="pt-4">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={handleEnroll}
              loading={enrolling}
              disabled={enrolling}>
              {enrolling ? '报名中...' : '立即报名'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default TrainingCourseDetail
