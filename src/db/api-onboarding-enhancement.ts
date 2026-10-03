/**
 * 入职功能增强API
 * 包括：手册阅读进度、HR留言、帮助文章反馈、学习成就
 */

import {supabase} from '@/client/supabase'
import type {
  CreateHandbookReadingProgressInput,
  CreateHelpArticleFeedbackInput,
  CreateHRMessageInput,
  CreateLearningAchievementInput,
  HandbookReadingProgress,
  HelpArticleFeedback,
  HRMessage,
  LearningAchievement,
  LearningStats,
  ReplyHRMessageInput
} from './types/onboarding-enhancement'

// ==================== 手册阅读进度 ====================

/**
 * 获取员工的手册阅读进度
 */
export async function getHandbookReadingProgress(employeeId: string): Promise<HandbookReadingProgress[]> {
  const {data, error} = await supabase
    .from('handbook_reading_progress')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取手册阅读进度失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 标记章节为已读
 */
export async function markSectionAsRead(
  input: CreateHandbookReadingProgressInput
): Promise<HandbookReadingProgress | null> {
  const {data, error} = await supabase
    .from('handbook_reading_progress')
    .upsert(
      {
        ...input,
        is_read: true,
        read_at: new Date().toISOString()
      },
      {
        onConflict: 'employee_id,section_id'
      }
    )
    .select()
    .maybeSingle()

  if (error) {
    console.error('标记章节为已读失败:', error)
    return null
  }

  return data
}

/**
 * 获取手册阅读统计
 */
export async function getHandbookReadingStats(
  employeeId: string,
  totalSections: number
): Promise<{readCount: number; totalCount: number; percentage: number}> {
  const {data, error} = await supabase
    .from('handbook_reading_progress')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('is_read', true)

  if (error) {
    console.error('获取手册阅读统计失败:', error)
    return {readCount: 0, totalCount: totalSections, percentage: 0}
  }

  const readCount = Array.isArray(data) ? data.length : 0
  const percentage = totalSections > 0 ? Math.round((readCount / totalSections) * 100) : 0

  return {
    readCount,
    totalCount: totalSections,
    percentage
  }
}

// ==================== HR留言 ====================

/**
 * 创建HR留言
 */
export async function createHRMessage(input: CreateHRMessageInput): Promise<HRMessage | null> {
  const {data, error} = await supabase.from('hr_messages').insert(input).select().maybeSingle()

  if (error) {
    console.error('创建HR留言失败:', error)
    return null
  }

  return data
}

/**
 * 获取员工的HR留言列表
 */
export async function getHRMessages(employeeId: string): Promise<HRMessage[]> {
  const {data, error} = await supabase
    .from('hr_messages')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取HR留言列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取待回复的HR留言（管理员用）
 */
export async function getPendingHRMessages(tenantId: string): Promise<HRMessage[]> {
  const {data, error} = await supabase
    .from('hr_messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .order('created_at', {ascending: true})

  if (error) {
    console.error('获取待回复HR留言失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取所有HR留言（管理员用）
 */
export async function getAllHRMessages(tenantId: string): Promise<HRMessage[]> {
  const {data, error} = await supabase
    .from('hr_messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取所有HR留言失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 回复HR留言
 */
export async function replyHRMessage(messageId: string, input: ReplyHRMessageInput): Promise<HRMessage | null> {
  const {data, error} = await supabase
    .from('hr_messages')
    .update({
      ...input,
      status: input.status || 'replied',
      replied_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('回复HR留言失败:', error)
    return null
  }

  return data
}

/**
 * 关闭HR留言
 */
export async function closeHRMessage(messageId: string): Promise<boolean> {
  const {error} = await supabase.from('hr_messages').update({status: 'closed'}).eq('id', messageId)

  if (error) {
    console.error('关闭HR留言失败:', error)
    return false
  }

  return true
}

// ==================== 帮助文章反馈 ====================

/**
 * 创建帮助文章反馈
 */
export async function createHelpArticleFeedback(
  input: CreateHelpArticleFeedbackInput
): Promise<HelpArticleFeedback | null> {
  const {data, error} = await supabase
    .from('help_article_feedback')
    .upsert(input, {
      onConflict: 'employee_id,article_id'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建帮助文章反馈失败:', error)
    return null
  }

  return data
}

/**
 * 获取文章的反馈统计
 */
export async function getArticleFeedbackStats(
  articleId: string
): Promise<{helpful: number; notHelpful: number; total: number}> {
  const {data, error} = await supabase.from('help_article_feedback').select('is_helpful').eq('article_id', articleId)

  if (error) {
    console.error('获取文章反馈统计失败:', error)
    return {helpful: 0, notHelpful: 0, total: 0}
  }

  const feedbacks = Array.isArray(data) ? data : []
  const helpful = feedbacks.filter((f) => f.is_helpful).length
  const notHelpful = feedbacks.filter((f) => !f.is_helpful).length

  return {
    helpful,
    notHelpful,
    total: feedbacks.length
  }
}

/**
 * 获取员工的文章反馈
 */
export async function getEmployeeArticleFeedback(
  employeeId: string,
  articleId: string
): Promise<HelpArticleFeedback | null> {
  const {data, error} = await supabase
    .from('help_article_feedback')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('article_id', articleId)
    .maybeSingle()

  if (error) {
    console.error('获取员工文章反馈失败:', error)
    return null
  }

  return data
}

// ==================== 学习成就 ====================

/**
 * 创建学习成就
 */
export async function createLearningAchievement(
  input: CreateLearningAchievementInput
): Promise<LearningAchievement | null> {
  const {data, error} = await supabase.from('learning_achievements').insert(input).select().maybeSingle()

  if (error) {
    console.error('创建学习成就失败:', error)
    return null
  }

  return data
}

/**
 * 获取员工的学习成就列表
 */
export async function getLearningAchievements(employeeId: string): Promise<LearningAchievement[]> {
  const {data, error} = await supabase
    .from('learning_achievements')
    .select('*')
    .eq('employee_id', employeeId)
    .order('earned_at', {ascending: false})

  if (error) {
    console.error('获取学习成就列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 检查并授予成就
 * @param employeeId 员工ID
 * @param tenantId 租户ID
 * @param achievementType 成就类型
 * @param achievementName 成就名称
 * @param achievementIcon 成就图标
 */
export async function checkAndGrantAchievement(
  employeeId: string,
  tenantId: string,
  achievementType: string,
  achievementName: string,
  achievementIcon?: string
): Promise<LearningAchievement | null> {
  // 检查是否已经获得该成就
  const {data: existing} = await supabase
    .from('learning_achievements')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('achievement_type', achievementType)
    .maybeSingle()

  if (existing) {
    return null // 已经获得该成就
  }

  // 授予新成就
  return await createLearningAchievement({
    tenant_id: tenantId,
    employee_id: employeeId,
    achievement_type: achievementType,
    achievement_name: achievementName,
    achievement_icon: achievementIcon
  })
}

// ==================== 学习统计 ====================

/**
 * 获取员工的学习统计
 */
export async function getLearningStats(employeeId: string, totalHandbookSections: number = 6): Promise<LearningStats> {
  // 获取培训课程统计
  const {data: trainingRecords} = await supabase.from('training_records').select('status').eq('employee_id', employeeId)

  const records = Array.isArray(trainingRecords) ? trainingRecords : []
  const completedCourses = records.filter((r) => r.status === 'completed').length
  const inProgressCourses = records.filter((r) => r.status === 'in_progress').length
  const totalCourses = records.length

  // 获取手册阅读统计
  const {data: readingSections} = await supabase
    .from('handbook_reading_progress')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('is_read', true)

  const readHandbookSections = Array.isArray(readingSections) ? readingSections.length : 0

  // 获取成就统计
  const {data: achievements} = await supabase.from('learning_achievements').select('id').eq('employee_id', employeeId)

  const totalAchievements = Array.isArray(achievements) ? achievements.length : 0

  // 计算完成率
  const totalItems = totalCourses + totalHandbookSections
  const completedItems = completedCourses + readHandbookSections
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return {
    total_courses: totalCourses,
    completed_courses: completedCourses,
    in_progress_courses: inProgressCourses,
    total_handbook_sections: totalHandbookSections,
    read_handbook_sections: readHandbookSections,
    total_achievements: totalAchievements,
    completion_rate: completionRate
  }
}
