/**
 * 入职功能增强相关类型定义
 */

// 手册阅读进度
export interface HandbookReadingProgress {
  id: string
  tenant_id: string
  employee_id: string
  section_id: string
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

// 创建手册阅读进度的输入类型
export interface CreateHandbookReadingProgressInput {
  tenant_id: string
  employee_id: string
  section_id: string
  is_read?: boolean
  read_at?: string
}

// HR留言
export interface HRMessage {
  id: string
  tenant_id: string
  employee_id: string
  message: string
  images: string[] | null
  status: 'pending' | 'replied' | 'closed'
  reply: string | null
  replied_by: string | null
  replied_at: string | null
  created_at: string
  updated_at: string
}

// 创建HR留言的输入类型
export interface CreateHRMessageInput {
  tenant_id: string
  employee_id: string
  message: string
  images?: string[]
}

// 回复HR留言的输入类型
export interface ReplyHRMessageInput {
  reply: string
  replied_by: string
  status?: 'replied' | 'closed'
}

// 帮助文章反馈
export interface HelpArticleFeedback {
  id: string
  tenant_id: string
  employee_id: string
  article_id: string
  is_helpful: boolean
  feedback_text: string | null
  created_at: string
}

// 创建帮助文章反馈的输入类型
export interface CreateHelpArticleFeedbackInput {
  tenant_id: string
  employee_id: string
  article_id: string
  is_helpful: boolean
  feedback_text?: string
}

// 学习成就
export interface LearningAchievement {
  id: string
  tenant_id: string
  employee_id: string
  achievement_type: string
  achievement_name: string
  achievement_icon: string | null
  earned_at: string
  created_at: string
}

// 创建学习成就的输入类型
export interface CreateLearningAchievementInput {
  tenant_id: string
  employee_id: string
  achievement_type: string
  achievement_name: string
  achievement_icon?: string
}

// 学习统计
export interface LearningStats {
  total_courses: number
  completed_courses: number
  in_progress_courses: number
  total_handbook_sections: number
  read_handbook_sections: number
  total_achievements: number
  completion_rate: number
}

// 章节信息
export interface HandbookSection {
  id: string
  title: string
  icon: string
  content: string
  is_required?: boolean
}
