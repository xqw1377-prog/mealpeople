/**
 * 培训管理系统类型定义
 * 3.0 版本 - 第三阶段
 */

/**
 * 课程分类
 */
export type TrainingCategory = 'job_skill' | 'company_culture' | 'safety' | 'policy' | 'other'

/**
 * 课程状态
 */
export type CourseStatus = 'draft' | 'published' | 'archived'

/**
 * 培训记录状态
 */
export type TrainingStatus = 'enrolled' | 'in_progress' | 'completed' | 'cancelled'

/**
 * 考核状态
 */
export type ExamStatus = 'pending' | 'passed' | 'failed'

/**
 * 培训课程
 */
export interface TrainingCourse {
  id: string
  tenant_id: string
  title: string
  description: string | null
  category: TrainingCategory
  duration_hours: number
  instructor: string | null
  max_participants: number | null
  status: CourseStatus
  cover_image: string | null
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * 培训记录
 */
export interface TrainingRecord {
  id: string
  tenant_id: string
  course_id: string
  employee_id: string
  status: TrainingStatus
  enrolled_at: string
  started_at: string | null
  completed_at: string | null
  progress: number
  score: number | null
  feedback: string | null
  created_at: string
  updated_at: string
}

/**
 * 培训考核
 */
export interface TrainingExam {
  id: string
  tenant_id: string
  course_id: string
  record_id: string
  employee_id: string
  exam_date: string
  score: number
  pass_score: number
  status: ExamStatus
  examiner: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * 创建培训课程输入
 */
export interface TrainingCourseCreateInput {
  tenant_id: string
  title: string
  description?: string
  category: TrainingCategory
  duration_hours: number
  instructor?: string
  max_participants?: number
  status?: CourseStatus
  cover_image?: string
  created_by: string
}

/**
 * 更新培训课程输入
 */
export interface TrainingCourseUpdateInput {
  title?: string
  description?: string
  category?: TrainingCategory
  duration_hours?: number
  instructor?: string
  max_participants?: number
  status?: CourseStatus
  cover_image?: string
}

/**
 * 创建培训记录输入
 */
export interface TrainingRecordCreateInput {
  tenant_id: string
  course_id: string
  employee_id: string
  status?: TrainingStatus
}

/**
 * 更新培训记录输入
 */
export interface TrainingRecordUpdateInput {
  status?: TrainingStatus
  started_at?: string
  completed_at?: string
  progress?: number
  score?: number
  feedback?: string
}

/**
 * 创建培训考核输入
 */
export interface TrainingExamCreateInput {
  tenant_id: string
  course_id: string
  record_id: string
  employee_id: string
  exam_date: string
  score: number
  pass_score?: number
  status?: ExamStatus
  examiner?: string
  notes?: string
}

/**
 * 更新培训考核输入
 */
export interface TrainingExamUpdateInput {
  exam_date?: string
  score?: number
  pass_score?: number
  status?: ExamStatus
  examiner?: string
  notes?: string
}

/**
 * 培训课程详情（包含统计信息）
 */
export interface TrainingCourseDetail extends TrainingCourse {
  enrolled_count: number
  completed_count: number
  average_score: number | null
}

/**
 * 培训记录详情（包含课程和员工信息）
 */
export interface TrainingRecordDetail extends TrainingRecord {
  course_title: string
  course_category: TrainingCategory
  course_duration_hours: number
  course_instructor: string | null
  course?: {
    title: string
    category: TrainingCategory
    duration_hours: number
    instructor: string | null
  }
  employee?: {
    name: string
    position: string | null
  }
}

/**
 * 员工培训统计
 */
export interface EmployeeTrainingStats {
  total_courses: number
  completed_courses: number
  in_progress_courses: number
  total_hours: number
  average_score: number | null
  completion_rate: number
}

/**
 * 课程分类名称映射
 */
export const TRAINING_CATEGORY_NAMES: Record<TrainingCategory, string> = {
  job_skill: '岗位技能',
  company_culture: '公司文化',
  safety: '安全培训',
  policy: '制度流程',
  other: '其他'
}

/**
 * 课程状态名称映射
 */
export const COURSE_STATUS_NAMES: Record<CourseStatus, string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档'
}

/**
 * 培训状态名称映射
 */
export const TRAINING_STATUS_NAMES: Record<TrainingStatus, string> = {
  enrolled: '已报名',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

/**
 * 考核状态名称映射
 */
export const EXAM_STATUS_NAMES: Record<ExamStatus, string> = {
  pending: '待评定',
  passed: '已通过',
  failed: '未通过'
}

/**
 * 课程分类颜色映射
 */
export const TRAINING_CATEGORY_COLORS: Record<TrainingCategory, string> = {
  job_skill: 'text-blue-600 bg-blue-50',
  company_culture: 'text-purple-600 bg-purple-50',
  safety: 'text-red-600 bg-red-50',
  policy: 'text-green-600 bg-green-50',
  other: 'text-gray-600 bg-gray-50'
}

/**
 * 培训状态颜色映射
 */
export const TRAINING_STATUS_COLORS: Record<TrainingStatus, string> = {
  enrolled: 'text-blue-600 bg-blue-50',
  in_progress: 'text-yellow-600 bg-yellow-50',
  completed: 'text-green-600 bg-green-50',
  cancelled: 'text-gray-600 bg-gray-50'
}

/**
 * 考核状态颜色映射
 */
export const EXAM_STATUS_COLORS: Record<ExamStatus, string> = {
  pending: 'text-yellow-600 bg-yellow-50',
  passed: 'text-green-600 bg-green-50',
  failed: 'text-red-600 bg-red-50'
}
