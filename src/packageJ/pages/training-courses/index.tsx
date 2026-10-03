/**
 * 培训课程列表页面
 * 3.0 版本 - 培训管理系统
 */

import {Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useMemo, useState} from 'react'
import {EmptySearchResults, EmptyTraining} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {getTrainingCourses} from '@/db/api-training'
import type {TrainingCourse} from '@/db/types-training'
import {TRAINING_CATEGORY_COLORS, TRAINING_CATEGORY_NAMES} from '@/db/types-training'
import {useTenantStore} from '@/store/tenant'

const TrainingCourses: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')

  // 加载培训课程列表
  const loadCourses = useCallback(async () => {
    if (!currentTenant?.id) return

    setLoading(true)
    try {
      const courseList = await getTrainingCourses(currentTenant.id, 'published')
      setCourses(courseList)
    } catch (error) {
      console.error('加载培训课程失败:', error)
      Taro.showToast({
        title: '加载培训课程失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadCourses()
  })

  // 下拉刷新处理
  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await loadCourses()
      setTimeout(() => {
        setRefreshing(false)
        Taro.showToast({title: '刷新成功', icon: 'success', duration: 1500})
      }, 500)
    } catch (_error) {
      setRefreshing(false)
      Taro.showToast({title: '刷新失败', icon: 'error'})
    }
  }

  // 过滤课程列表
  const filteredCourses = useMemo(() => {
    if (!searchKeyword.trim()) {
      return courses
    }

    const keyword = searchKeyword.toLowerCase().trim()
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(keyword) ||
        course.description?.toLowerCase().includes(keyword) ||
        course.instructor?.toLowerCase().includes(keyword) ||
        TRAINING_CATEGORY_NAMES[course.category].toLowerCase().includes(keyword)
    )
  }, [courses, searchKeyword])

  // 查看课程详情
  const handleViewCourse = (courseId: string) => {
    Taro.navigateTo({
      url: `/pages/training-course-detail/index?id=${courseId}`
    })
  }

  // 清空搜索
  const handleClearSearch = () => {
    setSearchKeyword('')
  }

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
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground">培训课程</Text>
            <Text className="text-sm text-muted-foreground mt-1">提升技能，成就未来</Text>
          </View>

          {/* 搜索框 */}
          <View className="mb-4">
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 flex flex-row items-center">
              <View className="i-mdi-magnify text-xl text-muted-foreground mr-2" />
              <View className="flex-1" style={{overflow: 'hidden'}}>
                <Input
                  className="text-sm text-foreground"
                  placeholder="搜索课程名称、讲师、分类..."
                  value={searchKeyword}
                  onInput={(e) => setSearchKeyword(e.detail.value)}
                />
              </View>
              {searchKeyword && (
                <View className="i-mdi-close-circle text-xl text-muted-foreground ml-2" onClick={handleClearSearch} />
              )}
            </View>
            {searchKeyword && (
              <Text className="text-xs text-muted-foreground mt-2">找到 {filteredCourses.length} 个相关课程</Text>
            )}
          </View>

          {/* 加载状态 */}
          {loading && (
            <View className="px-4">
              <SkeletonList count={5} />
            </View>
          )}

          {/* 空状态 */}
          {!loading &&
            filteredCourses.length === 0 &&
            (searchKeyword ? <EmptySearchResults keyword={searchKeyword} /> : <EmptyTraining />)}

          {/* 课程列表 */}
          {!loading && filteredCourses.length > 0 && (
            <View className="space-y-3">
              {filteredCourses.map((course) => (
                <View
                  key={course.id}
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:scale-98 transition-all"
                  onClick={() => handleViewCourse(course.id)}>
                  {/* 课程标题和分类 */}
                  <View className="flex flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                      <Text className="text-lg font-bold text-foreground mb-1">{course.title}</Text>
                      {course.description && (
                        <Text className="text-sm text-muted-foreground line-clamp-2">{course.description}</Text>
                      )}
                    </View>
                    <View className={`px-2 py-1 rounded ${TRAINING_CATEGORY_COLORS[course.category]}`}>
                      <Text className="text-xs font-medium">{TRAINING_CATEGORY_NAMES[course.category]}</Text>
                    </View>
                  </View>

                  {/* 课程信息 */}
                  <View className="flex flex-row items-center gap-4 text-sm text-muted-foreground">
                    {/* 课程时长 */}
                    <View className="flex flex-row items-center gap-1">
                      <View className="i-mdi-clock-outline text-base" />
                      <Text className="text-xs">{course.duration_hours}小时</Text>
                    </View>

                    {/* 讲师 */}
                    {course.instructor && (
                      <View className="flex flex-row items-center gap-1">
                        <View className="i-mdi-account text-base" />
                        <Text className="text-xs">{course.instructor}</Text>
                      </View>
                    )}

                    {/* 人数限制 */}
                    {course.max_participants && (
                      <View className="flex flex-row items-center gap-1">
                        <View className="i-mdi-account-group text-base" />
                        <Text className="text-xs">限{course.max_participants}人</Text>
                      </View>
                    )}
                  </View>

                  {/* 查看详情按钮 */}
                  <View className="flex flex-row items-center justify-end mt-3 pt-3 border-t border-border">
                    <Text className="text-sm text-blue-600 font-medium">查看详情</Text>
                    <View className="i-mdi-chevron-right text-lg text-blue-600 ml-1" />
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

export default TrainingCourses
