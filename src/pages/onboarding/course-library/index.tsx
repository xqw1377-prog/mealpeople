/**
 * 课程库管理页面
 * HR管理培训课程库
 */

import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards} from '@/components/common'
import {getEmployeeByUserId} from '@/db/api'

// 课程接口
interface Course {
  id: string
  name: string
  category: string
  duration: number // 分钟
  description?: string
  instructor?: string
  created_at: string
}

export default function CourseLibrary() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<Course[]>([])
  const [searchText, setSearchText] = useState('')

  // 加载课程库
  const loadCourses = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // TODO: 从数据库加载课程库
      const mockCourses: Course[] = [
        {
          id: '1',
          name: '新员工入职培训',
          category: '入职培训',
          duration: 120,
          description: '公司文化、规章制度、工作流程介绍',
          instructor: '人力资源部',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: '安全生产培训',
          category: '安全培训',
          duration: 60,
          description: '安全生产知识和应急处理',
          instructor: '安全部',
          created_at: new Date().toISOString()
        }
      ]
      setCourses(mockCourses)
    } catch (error) {
      console.error('加载课程库失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadCourses()
  })

  // 过滤课程
  const filteredCourses = courses.filter(
    (course) =>
      searchText === '' ||
      course.name.includes(searchText) ||
      course.category.includes(searchText) ||
      course.description?.includes(searchText)
  )

  // 添加课程
  const handleAddCourse = () => {
    Taro.navigateTo({
      url: '/pages/onboarding/course-add/index'
    })
  }

  // 编辑课程
  const handleEditCourse = (courseId: string) => {
    Taro.navigateTo({
      url: `/pages/onboarding/course-edit/index?id=${courseId}`
    })
  }

  if (loading) {
    return <LoadingCards />
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #fef3c7, #ffffff)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-xl p-6 mb-4 border border-border">
            <View className="flex items-center mb-3">
              <View className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-book-open-page-variant text-3xl text-amber-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-foreground block mb-1">课程库管理</Text>
                <Text className="text-sm text-muted-foreground block">管理培训课程库</Text>
              </View>
            </View>

            {/* 统计信息 */}
            <View className="grid grid-cols-2 gap-3 mt-4">
              <View className="bg-amber-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-amber-600 block mb-1">{courses.length}</Text>
                <Text className="text-xs text-muted-foreground block">课程总数</Text>
              </View>
              <View className="bg-blue-50 rounded-lg p-3 text-center">
                <Text className="text-2xl font-bold text-blue-600 block mb-1">
                  {Math.round(courses.reduce((sum, c) => sum + c.duration, 0) / 60)}
                </Text>
                <Text className="text-xs text-muted-foreground block">总时长(小时)</Text>
              </View>
            </View>
          </View>

          {/* 添加按钮 */}
          <View className="mb-4">
            <Button
              className="w-full bg-primary text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={handleAddCourse}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus-circle text-xl" />
                <Text>添加课程</Text>
              </View>
            </Button>
          </View>

          {/* 搜索 */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-border">
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-muted text-foreground px-4 py-3 rounded-lg border border-border w-full"
                placeholder="搜索课程名称、分类或描述"
                value={searchText}
                onInput={(e) => setSearchText(e.detail.value)}
              />
            </View>
          </View>

          {/* 课程列表 */}
          {filteredCourses.length === 0 ? (
            <View className="bg-white rounded-xl p-8 text-center border border-border">
              <View className="i-mdi-inbox text-6xl text-muted-foreground mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无课程</Text>
              <Text className="text-sm text-muted-foreground block">点击上方按钮添加课程</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredCourses.map((course) => (
                <View
                  key={course.id}
                  className="bg-white rounded-xl p-4 border border-border active:opacity-80 transition-all"
                  onClick={() => handleEditCourse(course.id)}>
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground block mb-1">{course.name}</Text>
                      <Text className="text-sm text-muted-foreground block">{course.description || '无描述'}</Text>
                    </View>
                    <View className="px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                      <Text className="text-xs font-medium">{course.category}</Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-2 gap-2">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-clock-outline text-base text-muted-foreground" />
                      <Text className="text-sm text-muted-foreground">{course.duration}分钟</Text>
                    </View>
                    {course.instructor && (
                      <View className="flex items-center gap-2">
                        <View className="i-mdi-account text-base text-muted-foreground" />
                        <Text className="text-sm text-muted-foreground">{course.instructor}</Text>
                      </View>
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
