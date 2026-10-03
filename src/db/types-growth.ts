// 员工成长相关类型定义

// ==================== 员工等级 ====================

// 员工等级表
export interface EmployeeLevel {
  id: string
  tenant_id: string
  employee_id: string
  current_level: string
  level_score: number
  next_level: string
  next_level_score: number
  created_at: string
  updated_at: string
}

// 创建员工等级输入
export interface CreateEmployeeLevelInput {
  tenant_id: string
  employee_id: string
  current_level?: string
  level_score?: number
  next_level?: string
  next_level_score?: number
}

// 更新员工等级输入
export interface UpdateEmployeeLevelInput {
  current_level?: string
  level_score?: number
  next_level?: string
  next_level_score?: number
}

// ==================== 培训课程 ====================

// 课程类型
export type CourseCategory = 'service' | 'safety' | 'product' | 'management' | 'other'

// 课程状态
export type CourseStatus = 'draft' | 'active' | 'archived'

// 培训课程表（使用现有表）
export interface TrainingCourse {
  id: string
  tenant_id: string
  title: string
  description: string | null
  category: CourseCategory
  duration_hours: number
  instructor: string | null
  max_participants: number | null
  status: CourseStatus
  cover_image: string | null
  created_by: string
  created_at: string
  updated_at: string
}

// ==================== 学习记录 ====================

// 学习状态
export type TrainingStatus = 'enrolled' | 'in_progress' | 'completed' | 'failed'

// 学习记录表（使用现有表）
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

// 创建学习记录输入
export interface CreateTrainingRecordInput {
  tenant_id: string
  course_id: string
  employee_id: string
}

// 更新学习记录输入
export interface UpdateTrainingRecordInput {
  status?: TrainingStatus
  started_at?: string
  completed_at?: string
  progress?: number
  score?: number
  feedback?: string
}

// ==================== 员工认证 ====================

// 认证状态
export type CertStatus = 'active' | 'expired'

// 员工认证表
export interface EmployeeCertification {
  id: string
  tenant_id: string
  employee_id: string
  cert_name: string
  cert_type: string
  cert_level: string | null
  obtain_date: string
  expire_date: string | null
  cert_status: CertStatus
  created_at: string
  updated_at: string
}

// 创建认证输入
export interface CreateCertificationInput {
  tenant_id: string
  employee_id: string
  cert_name: string
  cert_type: string
  cert_level?: string
  obtain_date: string
  expire_date?: string
}

// ==================== 统计数据 ====================

// 学习进度统计
export interface LearningProgress {
  total_courses: number
  enrolled_courses: number
  in_progress_courses: number
  completed_courses: number
  completion_rate: number
  total_learning_hours: number
  average_score: number
}

// 课程类型统计
export interface CourseTypeStats {
  required_total: number
  required_completed: number
  required_rate: number
  advanced_total: number
  advanced_completed: number
  advanced_rate: number
  management_total: number
  management_completed: number
  management_rate: number
}

// 成长数据
export interface GrowthData {
  level: EmployeeLevel
  learning_progress: LearningProgress
  certifications: EmployeeCertification[]
  recent_courses: TrainingRecord[]
}
