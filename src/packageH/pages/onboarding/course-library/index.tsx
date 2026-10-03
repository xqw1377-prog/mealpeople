/**
 * 培训课程库管理页面
 * 功能：管理培训课程库，包括添加、编辑、删除课程
 */

import {Button, Input, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useEffect, useState} from 'react'
import {
  createTrainingCourse,
  deleteTrainingCourse,
  getTenantTrainingCourses,
  updateTrainingCourse
} from '@/db/api-interview-flow'
import type {CourseType, TrainingCourse} from '@/db/types-interview-flow'
import {useTenantStore} from '@/store/tenant'

export default function CourseLibrary() {
  const {currentTenant} = useTenantStore()
  const [courses, setCourses] = useState<TrainingCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<TrainingCourse | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | CourseType>('all')

  // 表单状态
  const [courseName, setCourseName] = useState('')
  const [courseType, setCourseType] = useState<CourseType>('onboarding')
  const [description, setDescription] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [passingScore, setPassingScore] = useState('60')
  const [content, setContent] = useState('')
  const [isRequired, setIsRequired] = useState(true)
  const [isActive, setIsActive] = useState(true)

  // 加载课程列表
  const loadCourses = useCallback(async () => {
    if (!currentTenant) return

    setLoading(true)
    try {
      const data = await getTenantTrainingCourses(currentTenant.id)
      setCourses(data)
    } catch (error) {
      console.error('加载课程列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadCourses()
  })

  useEffect(() => {
    loadCourses()
  }, [loadCourses])

  // 筛选课程
  const filteredCourses = courses.filter((course) => {
    if (typeFilter === 'all') return true
    return course.course_type === typeFilter
  })

  // 统计数据
  const stats = {
    total: courses.length,
    active: courses.filter((course) => course.is_active).length,
    required: courses.filter((course) => course.is_required).length,
    types: [...new Set(courses.map((course) => course.course_type))].length
  }

  // 打开添加表单
  const handleAdd = () => {
    setEditingCourse(null)
    setCourseName('')
    setCourseType('onboarding')
    setDescription('')
    setDurationHours('')
    setPassingScore('60')
    setContent('')
    setIsRequired(true)
    setIsActive(true)
    setShowAddForm(true)
  }

  // 打开编辑表单
  const handleEdit = (course: TrainingCourse) => {
    setEditingCourse(course)
    setCourseName(course.course_name)
    setCourseType(course.course_type)
    setDescription(course.description || '')
    setDurationHours(course.duration_hours?.toString() || '')
    setPassingScore(course.passing_score.toString())
    setContent(course.content || '')
    setIsRequired(course.is_required)
    setIsActive(course.is_active)
    setShowAddForm(true)
  }

  // 保存课程
  const handleSave = async () => {
    if (!currentTenant) return

    if (!courseName.trim()) {
      Taro.showToast({
        title: '请输入课程名称',
        icon: 'none'
      })
      return
    }

    const score = Number.parseInt(passingScore, 10)
    if (Number.isNaN(score) || score < 0 || score > 100) {
      Taro.showToast({
        title: '及格分数必须在0-100之间',
        icon: 'none'
      })
      return
    }

    const duration = durationHours ? Number.parseFloat(durationHours) : null
    if (duration !== null && (Number.isNaN(duration) || duration <= 0)) {
      Taro.showToast({
        title: '课程时长必须大于0',
        icon: 'none'
      })
      return
    }

    try {
      if (editingCourse) {
        // 编辑模式
        await updateTrainingCourse(editingCourse.id, {
          course_name: courseName,
          course_type: courseType,
          description: description || null,
          duration_hours: duration,
          passing_score: score,
          content: content || null,
          is_required: isRequired,
          is_active: isActive
        })
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        // 添加模式
        await createTrainingCourse({
          tenant_id: currentTenant.id,
          course_name: courseName,
          course_type: courseType,
          description: description || null,
          duration_hours: duration,
          passing_score: score,
          content: content || null,
          is_required: isRequired,
          is_active: isActive
        })
        Taro.showToast({
          title: '添加成功',
          icon: 'success'
        })
      }

      setShowAddForm(false)
      loadCourses()
    } catch (error) {
      console.error('保存课程失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  }

  // 删除课程
  const handleDelete = async (course: TrainingCourse) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除课程"${course.course_name}"吗？此操作不可恢复。`
    })

    if (!result.confirm) return

    try {
      await deleteTrainingCourse(course.id)
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

  // 获取课程类型名称
  const getTypeName = (type: CourseType) => {
    const typeMap: Record<CourseType, string> = {
      onboarding: '入职培训',
      skill: '技能培训',
      safety: '安全培训',
      other: '其他'
    }
    return typeMap[type]
  }

  // 获取课程类型颜色
  const getTypeColor = (type: CourseType) => {
    const colorMap: Record<CourseType, string> = {
      onboarding: 'bg-blue-50 text-blue-600',
      skill: 'bg-green-50 text-green-600',
      safety: 'bg-orange-50 text-orange-600',
      other: 'bg-gray-50 text-gray-600'
    }
    return colorMap[type]
  }

  if (!currentTenant) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <Text className="text-muted-foreground">请先选择租户</Text>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen" style={{background: 'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
        <View className="max-w-7xl mx-auto p-4 pb-20">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl max-sm:text-xl font-bold text-foreground block mb-2">培训课程库管理</Text>
            <Text className="text-sm max-sm:text-xs text-muted-foreground block">
              管理培训课程库，设置课程类型和内容
            </Text>
          </View>

          {/* 统计卡片 */}
          <View className="grid grid-cols-2 @md:grid-cols-4 gap-3 mb-6">
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">课程总数</Text>
              <Text className="text-2xl max-sm:text-xl font-bold text-blue-600 block">{stats.total}</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">启用中</Text>
              <Text className="text-2xl max-sm:text-xl font-bold text-green-600 block">{stats.active}</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">必修课程</Text>
              <Text className="text-2xl max-sm:text-xl font-bold text-orange-600 block">{stats.required}</Text>
            </View>
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground block mb-1">课程类型</Text>
              <Text className="text-2xl max-sm:text-xl font-bold text-purple-600 block">{stats.types}</Text>
            </View>
          </View>

          {/* 操作按钮 */}
          <View className="mb-6">
            <Button
              className="w-full bg-primary text-white py-3 rounded-xl break-keep text-base max-sm:text-sm font-medium cursor-pointer"
              size="default"
              onClick={handleAdd}>
              <View className="i-mdi-plus text-xl mr-2" />
              添加新课程
            </Button>
          </View>

          {/* 类型筛选 */}
          <View className="mb-6">
            <ScrollView scrollX className="whitespace-nowrap">
              <View className="flex gap-2 pb-2">
                <View
                  className={`px-4 py-2 rounded-lg cursor-pointer ${
                    typeFilter === 'all' ? 'bg-primary text-white' : 'bg-white text-foreground'
                  }`}
                  onClick={() => setTypeFilter('all')}>
                  <Text className="text-sm max-sm:text-xs">全部</Text>
                </View>
                {(['onboarding', 'skill', 'safety', 'other'] as CourseType[]).map((type) => (
                  <View
                    key={type}
                    className={`px-4 py-2 rounded-lg cursor-pointer ${
                      typeFilter === type ? 'bg-primary text-white' : 'bg-white text-foreground'
                    }`}
                    onClick={() => setTypeFilter(type)}>
                    <Text className="text-sm max-sm:text-xs">{getTypeName(type)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 课程列表 */}
          {loading ? (
            <View className="text-center py-12">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredCourses.length === 0 ? (
            <View className="text-center py-12">
              <View className="i-mdi-school text-6xl text-muted-foreground mb-4" />
              <Text className="text-muted-foreground block mb-2">暂无课程</Text>
              <Text className="text-sm text-muted-foreground">点击上方按钮添加新课程</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredCourses.map((course) => (
                <View key={course.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-2">
                        <Text className="text-base max-sm:text-sm font-medium text-foreground">
                          {course.course_name}
                        </Text>
                        <View
                          className={`px-2 py-1 rounded text-xs max-sm:text-[10px] ${getTypeColor(course.course_type)}`}>
                          {getTypeName(course.course_type)}
                        </View>
                      </View>
                      {course.description && (
                        <Text className="text-sm max-sm:text-xs text-muted-foreground block mb-2">
                          {course.description}
                        </Text>
                      )}
                      <View className="flex items-center gap-3 flex-wrap">
                        {course.duration_hours && (
                          <View className="flex items-center gap-1">
                            <View className="i-mdi-clock-outline text-base text-muted-foreground" />
                            <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                              {course.duration_hours}小时
                            </Text>
                          </View>
                        )}
                        <View className="flex items-center gap-1">
                          <View className="i-mdi-chart-line text-base text-muted-foreground" />
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                            及格分：{course.passing_score}
                          </Text>
                        </View>
                        <View className="flex items-center gap-1">
                          <View
                            className={`i-mdi-${course.is_required ? 'star' : 'star-outline'} text-base ${
                              course.is_required ? 'text-orange-500' : 'text-gray-400'
                            }`}
                          />
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                            {course.is_required ? '必修' : '选修'}
                          </Text>
                        </View>
                        <View className="flex items-center gap-1">
                          <View
                            className={`i-mdi-${course.is_active ? 'check-circle' : 'close-circle'} text-base ${
                              course.is_active ? 'text-green-500' : 'text-gray-400'
                            }`}
                          />
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                            {course.is_active ? '启用' : '停用'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex gap-2">
                    <Button
                      className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg break-keep text-sm max-sm:text-xs cursor-pointer"
                      size="default"
                      onClick={() => handleEdit(course)}>
                      <View className="i-mdi-pencil text-base mr-1" />
                      编辑
                    </Button>
                    <Button
                      className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg break-keep text-sm max-sm:text-xs cursor-pointer"
                      size="default"
                      onClick={() => handleDelete(course)}>
                      <View className="i-mdi-delete text-base mr-1" />
                      删除
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 添加/编辑表单弹窗 */}
      {showAddForm && (
        <View
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
          onClick={() => setShowAddForm(false)}>
          <View
            className="bg-white rounded-t-3xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <View className="mb-6">
              <Text className="text-xl font-bold text-foreground block">
                {editingCourse ? '编辑课程' : '添加新课程'}
              </Text>
            </View>

            {/* 课程名称 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                课程名称 <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 py-2 rounded-lg border border-border w-full"
                  placeholder="请输入课程名称"
                  value={courseName}
                  onInput={(e) => setCourseName(e.detail.value)}
                />
              </View>
            </View>

            {/* 课程类型 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                课程类型 <Text className="text-red-500">*</Text>
              </Text>
              <View className="grid grid-cols-2 gap-2">
                {(['onboarding', 'skill', 'safety', 'other'] as CourseType[]).map((type) => (
                  <View
                    key={type}
                    className={`px-4 py-3 rounded-lg cursor-pointer text-center ${
                      courseType === type ? 'bg-primary text-white' : 'bg-gray-50 text-foreground border border-border'
                    }`}
                    onClick={() => setCourseType(type)}>
                    <Text className="text-sm">{getTypeName(type)}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 课程描述 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">课程描述</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 py-2 rounded-lg border border-border w-full"
                  placeholder="请输入课程描述（可选）"
                  value={description}
                  onInput={(e) => setDescription(e.detail.value)}
                />
              </View>
            </View>

            {/* 课程时长 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">课程时长（小时）</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 py-2 rounded-lg border border-border w-full"
                  placeholder="请输入课程时长（可选）"
                  type="digit"
                  value={durationHours}
                  onInput={(e) => setDurationHours(e.detail.value)}
                />
              </View>
            </View>

            {/* 及格分数 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                及格分数（0-100） <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 py-2 rounded-lg border border-border w-full"
                  placeholder="请输入及格分数"
                  type="number"
                  value={passingScore}
                  onInput={(e) => setPassingScore(e.detail.value)}
                />
              </View>
            </View>

            {/* 课程内容 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">课程内容</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-input text-foreground px-3 py-2 rounded-lg border border-border w-full"
                  placeholder="请输入课程内容（可选）"
                  value={content}
                  onInput={(e) => setContent(e.detail.value)}
                  style={{minHeight: '100px'}}
                />
              </View>
            </View>

            {/* 是否必修 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">课程性质</Text>
              <View className="flex gap-3">
                <View
                  className={`flex-1 px-4 py-3 rounded-lg cursor-pointer text-center ${
                    isRequired ? 'bg-primary text-white' : 'bg-gray-50 text-foreground border border-border'
                  }`}
                  onClick={() => setIsRequired(true)}>
                  <Text className="text-sm">必修课程</Text>
                </View>
                <View
                  className={`flex-1 px-4 py-3 rounded-lg cursor-pointer text-center ${
                    !isRequired ? 'bg-primary text-white' : 'bg-gray-50 text-foreground border border-border'
                  }`}
                  onClick={() => setIsRequired(false)}>
                  <Text className="text-sm">选修课程</Text>
                </View>
              </View>
            </View>

            {/* 是否启用 */}
            <View className="mb-6">
              <Text className="text-sm text-foreground block mb-2">课程状态</Text>
              <View className="flex gap-3">
                <View
                  className={`flex-1 px-4 py-3 rounded-lg cursor-pointer text-center ${
                    isActive ? 'bg-green-500 text-white' : 'bg-gray-50 text-foreground border border-border'
                  }`}
                  onClick={() => setIsActive(true)}>
                  <Text className="text-sm">启用</Text>
                </View>
                <View
                  className={`flex-1 px-4 py-3 rounded-lg cursor-pointer text-center ${
                    !isActive ? 'bg-gray-500 text-white' : 'bg-gray-50 text-foreground border border-border'
                  }`}
                  onClick={() => setIsActive(false)}>
                  <Text className="text-sm">停用</Text>
                </View>
              </View>
            </View>

            {/* 操作按钮 */}
            <View className="flex gap-3">
              <Button
                className="flex-1 bg-gray-100 text-foreground py-3 rounded-xl break-keep text-base cursor-pointer"
                size="default"
                onClick={() => setShowAddForm(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-primary text-white py-3 rounded-xl break-keep text-base cursor-pointer"
                size="default"
                onClick={handleSave}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
