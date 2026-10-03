/**
 * 培训课程页面
 *
 * 功能：
 * - 展示培训课程列表
 * - 课程详情查看
 * - 响应式设计
 *
 * 注意：本页面暂不支持学习进度持久化
 * 如需持久化功能，请使用完整的培训管理系统
 */

import {ScrollView, Text, View} from '@tarojs/components'
import {useState} from 'react'

// 课程信息
interface TrainingCourse {
  id: string
  title: string
  description: string
  duration: string
  icon: string
  iconColor: string
  content: string[]
}

// 培训课程列表
const TRAINING_COURSES: TrainingCourse[] = [
  {
    id: 'company_culture',
    title: '公司文化与价值观',
    description: '了解公司的使命、愿景和核心价值观',
    duration: '2小时',
    icon: 'i-mdi-domain',
    iconColor: 'text-blue-500',
    content: ['公司发展历程', '企业文化理念', '核心价值观', '行为准则', '团队精神']
  },
  {
    id: 'rules_regulations',
    title: '规章制度培训',
    description: '学习公司的各项规章制度和管理规定',
    duration: '3小时',
    icon: 'i-mdi-file-document-outline',
    iconColor: 'text-green-500',
    content: ['考勤制度', '请假流程', '薪酬福利', '绩效考核', '奖惩制度']
  },
  {
    id: 'safety_training',
    title: '安全培训',
    description: '掌握工作场所的安全知识和应急处理',
    duration: '1.5小时',
    icon: 'i-mdi-shield-check-outline',
    iconColor: 'text-red-500',
    content: ['消防安全', '用电安全', '应急疏散', '急救知识', '安全责任']
  },
  {
    id: 'professional_skills',
    title: '专业技能培训',
    description: '提升岗位所需的专业技能和知识',
    duration: '4小时',
    icon: 'i-mdi-school-outline',
    iconColor: 'text-purple-500',
    content: ['岗位职责', '工作流程', '专业知识', '技能要求', '质量标准']
  },
  {
    id: 'office_systems',
    title: '办公系统使用',
    description: '熟悉公司的各类办公系统和工具',
    duration: '2.5小时',
    icon: 'i-mdi-monitor',
    iconColor: 'text-orange-500',
    content: ['办公系统使用指南', '邮件与即时通讯工具', '文档协作平台', '项目管理工具', '数据报表系统']
  }
]

export default function OnboardingTraining() {
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null)

  // 查看课程详情
  const handleViewCourse = (course: TrainingCourse) => {
    setSelectedCourse(course)
  }

  // 返回课程列表
  const handleBackToList = () => {
    setSelectedCourse(null)
  }

  // 渲染课程列表
  const renderCourseList = () => (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #eff6ff, #dbeafe)'}}>
      {/* 头部 */}
      <View className="bg-primary text-white p-6 rounded-b-3xl">
        <View className="flex items-center justify-between">
          <View>
            <Text className="text-2xl font-bold block mb-2">培训课程</Text>
            <Text className="text-sm opacity-90 block">提升技能，成就未来</Text>
          </View>
          <View className="i-mdi-school text-5xl opacity-20"></View>
        </View>
      </View>

      {/* 课程列表 */}
      <View className="p-4">
        {TRAINING_COURSES.map((course) => (
          <View
            key={course.id}
            className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
            onClick={() => handleViewCourse(course)}>
            <View className="flex items-start">
              <View className={`${course.icon} text-4xl ${course.iconColor} mr-4 mt-1`}></View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground block mb-1">{course.title}</Text>
                <Text className="text-sm text-muted-foreground block mb-2">{course.description}</Text>
                <View className="flex items-center justify-between">
                  <View className="flex items-center">
                    <View className="i-mdi-clock-outline text-base text-muted-foreground mr-1"></View>
                    <Text className="text-sm text-muted-foreground">{course.duration}</Text>
                  </View>
                  <View className="flex items-center text-primary">
                    <Text className="text-sm mr-1">查看详情</Text>
                    <View className="i-mdi-chevron-right text-lg"></View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* 提示信息 */}
      <View className="p-4 pb-8">
        <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <View className="flex items-start">
            <View className="i-mdi-information-outline text-2xl text-blue-500 mr-3 mt-0.5"></View>
            <View className="flex-1">
              <Text className="text-sm text-blue-900 block mb-1 font-medium">学习提示</Text>
              <Text className="text-xs text-blue-700 block">
                请按照课程顺序学习，确保掌握每个模块的核心内容。如有疑问，请及时联系HR或培训负责人。
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )

  // 渲染课程详情
  const renderCourseDetail = () => {
    if (!selectedCourse) return null

    return (
      <ScrollView
        scrollY
        className="h-screen box-border"
        style={{background: 'linear-gradient(to bottom, #eff6ff, #dbeafe)'}}>
        {/* 头部 */}
        <View className="bg-primary text-white p-6 rounded-b-3xl">
          <View className="flex items-center mb-4" onClick={handleBackToList}>
            <View className="i-mdi-arrow-left text-2xl mr-2"></View>
            <Text className="text-base">返回</Text>
          </View>
          <View className="flex items-center">
            <View className={`${selectedCourse.icon} text-5xl mr-4`}></View>
            <View className="flex-1">
              <Text className="text-2xl font-bold block mb-2">{selectedCourse.title}</Text>
              <View className="flex items-center">
                <View className="i-mdi-clock-outline text-base mr-1"></View>
                <Text className="text-sm opacity-90">{selectedCourse.duration}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 课程描述 */}
        <View className="p-4">
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-medium text-foreground block mb-2">课程简介</Text>
            <Text className="text-sm text-muted-foreground block leading-relaxed">{selectedCourse.description}</Text>
          </View>

          {/* 课程内容 */}
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-base font-medium text-foreground block mb-3">课程内容</Text>
            {selectedCourse.content.map((item, index) => (
              <View key={index} className="flex items-start mb-3 last:mb-0">
                <View className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-0.5">
                  <Text className="text-xs text-primary font-medium">{index + 1}</Text>
                </View>
                <Text className="flex-1 text-sm text-foreground leading-relaxed">{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 底部提示 */}
        <View className="p-4 pb-8">
          <View className="bg-green-50 rounded-xl p-4 border border-green-200">
            <View className="flex items-start">
              <View className="i-mdi-lightbulb-on-outline text-2xl text-green-500 mr-3 mt-0.5"></View>
              <View className="flex-1">
                <Text className="text-sm text-green-900 block mb-1 font-medium">学习建议</Text>
                <Text className="text-xs text-green-700 block">
                  建议您认真学习每个知识点，并在实际工作中加以应用。遇到问题时，可以随时查阅课程内容或咨询相关负责人。
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    )
  }

  return selectedCourse ? renderCourseDetail() : renderCourseList()
}
