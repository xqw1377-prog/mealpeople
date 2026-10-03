/**
 * 编辑培训课程页面
 * 3.0 版本 - 培训管理系统
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getTrainingCourseById, updateTrainingCourse} from '@/db/api-training'
import type {TrainingCategory, TrainingCourseDetail, TrainingCourseUpdateInput} from '@/db/types-training'
import {TRAINING_CATEGORY_NAMES} from '@/db/types-training'

const TrainingCourseEdit: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const courseId = router.params.id || ''

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [course, setCourse] = useState<TrainingCourseDetail | null>(null)

  // 表单数据
  const [formData, setFormData] = useState<TrainingCourseUpdateInput>({
    title: '',
    description: '',
    category: 'job_skill',
    duration_hours: 1,
    instructor: '',
    max_participants: null,
    status: 'draft'
  })

  // 分类选项
  const categoryOptions = Object.entries(TRAINING_CATEGORY_NAMES).map(([value, label]) => ({
    value,
    label
  }))

  const [categoryIndex, setCategoryIndex] = useState(0)

  // 加载课程数据
  const loadCourse = useCallback(async () => {
    if (!courseId) return

    setLoading(true)
    try {
      const data = await getTrainingCourseById(courseId)
      if (data) {
        setCourse(data)
        setFormData({
          title: data.title,
          description: data.description,
          category: data.category,
          duration_hours: data.duration_hours,
          instructor: data.instructor,
          max_participants: data.max_participants,
          status: data.status
        })

        // 设置分类索引
        const index = categoryOptions.findIndex((o) => o.value === data.category)
        if (index >= 0) {
          setCategoryIndex(index)
        }
      }
    } catch (error) {
      console.error('加载课程失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [courseId, categoryOptions.findIndex])

  useDidShow(() => {
    loadCourse()
  })

  // 处理分类选择
  const handleCategoryChange = (e: any) => {
    const index = e.detail.value
    setCategoryIndex(index)
    setFormData({
      ...formData,
      category: categoryOptions[index].value as TrainingCategory
    })
  }

  // 提交表单
  const handleSubmit = async () => {
    // 验证表单
    if (!formData.title.trim()) {
      Taro.showToast({
        title: '请输入课程标题',
        icon: 'none'
      })
      return
    }

    if (!formData.description.trim()) {
      Taro.showToast({
        title: '请输入课程描述',
        icon: 'none'
      })
      return
    }

    if (!formData.instructor.trim()) {
      Taro.showToast({
        title: '请输入讲师姓名',
        icon: 'none'
      })
      return
    }

    if (formData.duration_hours <= 0) {
      Taro.showToast({
        title: '课程时长必须大于0',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)
    try {
      await updateTrainingCourse(courseId, formData)

      Taro.showToast({
        title: '更新成功',
        icon: 'success'
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('更新课程失败:', error)
      Taro.showToast({
        title: '更新失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50">
        <View className="p-4">
          <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
            <View className="i-mdi-loading animate-spin text-4xl text-blue-600 mb-2" />
            <Text className="text-muted-foreground">加载中...</Text>
          </View>
        </View>
      </View>
    )
  }

  if (!course) {
    return (
      <View className="min-h-screen bg-gray-50">
        <View className="p-4">
          <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
            <View className="i-mdi-alert-circle text-4xl text-red-500 mb-2" />
            <Text className="text-muted-foreground">课程不存在</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex flex-row items-center gap-3">
              <View className="i-mdi-book-edit text-3xl text-blue-600" />
              <View>
                <Text className="text-2xl font-bold text-foreground">编辑培训课程</Text>
                <Text className="text-sm text-muted-foreground mt-1">修改课程信息</Text>
              </View>
            </View>
          </View>

          {/* 表单 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm space-y-4">
            {/* 课程标题 */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">课程标题 *</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 bg-muted rounded-lg text-foreground"
                  placeholder="请输入课程标题"
                  value={formData.title}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      title: e.detail.value
                    })
                  }
                />
              </View>
            </View>

            {/* 课程分类 */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">课程分类 *</Text>
              <Picker mode="selector" range={categoryOptions.map((o) => o.label)} onChange={handleCategoryChange}>
                <View className="w-full px-4 py-3 bg-muted rounded-lg flex flex-row items-center justify-between">
                  <Text className="text-foreground">{categoryOptions[categoryIndex].label}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 课程描述 */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">课程描述 *</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="w-full px-4 py-3 bg-muted rounded-lg text-foreground"
                  placeholder="请输入课程描述"
                  value={formData.description}
                  maxlength={500}
                  style={{height: '120px'}}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      description: e.detail.value
                    })
                  }
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">{formData.description.length}/500</Text>
            </View>

            {/* 课程时长 */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">课程时长（小时）*</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 bg-muted rounded-lg text-foreground"
                  type="number"
                  placeholder="请输入课程时长"
                  value={formData.duration_hours.toString()}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      duration_hours: Number.parseFloat(e.detail.value) || 0
                    })
                  }
                />
              </View>
            </View>

            {/* 讲师姓名 */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">讲师姓名 *</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 bg-muted rounded-lg text-foreground"
                  placeholder="请输入讲师姓名"
                  value={formData.instructor}
                  onInput={(e) =>
                    setFormData({
                      ...formData,
                      instructor: e.detail.value
                    })
                  }
                />
              </View>
            </View>

            {/* 人数限制 */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">人数限制（可选）</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 bg-muted rounded-lg text-foreground"
                  type="number"
                  placeholder="不填则不限制人数"
                  value={formData.max_participants?.toString() || ''}
                  onInput={(e) => {
                    const value = e.detail.value
                    setFormData({
                      ...formData,
                      max_participants: value ? Number.parseInt(value, 10) : null
                    })
                  }}
                />
              </View>
            </View>

            {/* 发布状态 */}
            <View>
              <View className="flex flex-row items-center justify-between">
                <Text className="text-sm font-medium text-foreground">发布状态</Text>
                <View
                  className={`w-12 h-6 rounded-full flex items-center ${
                    formData.status === 'published' ? 'bg-blue-100 justify-end' : 'bg-gray-300 justify-start'
                  } px-1`}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      status: formData.status === 'published' ? 'draft' : 'published'
                    })
                  }>
                  <View className="w-4 h-4 bg-white rounded-full" />
                </View>
              </View>
              <Text className="text-xs text-muted-foreground mt-1">
                {formData.status === 'published' ? '课程对员工可见' : '课程为草稿状态'}
              </Text>
            </View>
          </View>

          {/* 提交按钮 */}
          <View className="space-y-2 pb-4">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
              size="default"
              disabled={submitting}
              onClick={handleSubmit}>
              {submitting ? '保存中...' : '保存修改'}
            </Button>
            <Button
              className="w-full bg-white text-foreground py-4 rounded-xl break-keep text-base border border-border"
              size="default"
              onClick={() => Taro.navigateBack()}>
              取消
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default TrainingCourseEdit
