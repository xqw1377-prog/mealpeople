/**
 * 培训管理系统 API
 * 3.0 版本 - 第三阶段
 */

import {supabase} from '@/client/supabase'
import {createNotification} from './api-notification'
import type {
  EmployeeTrainingStats,
  ExamStatus,
  TrainingCourse,
  TrainingCourseCreateInput,
  TrainingCourseDetail,
  TrainingCourseUpdateInput,
  TrainingExam,
  TrainingExamCreateInput,
  TrainingExamUpdateInput,
  TrainingRecord,
  TrainingRecordCreateInput,
  TrainingRecordDetail,
  TrainingRecordUpdateInput,
  TrainingStatus
} from './types-training'

/**
 * 获取培训课程列表
 */
export async function getTrainingCourses(tenantId: string, status?: string): Promise<TrainingCourse[]> {
  try {
    let query = supabase
      .from('training_courses')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', {ascending: false})

    if (status) {
      query = query.eq('status', status)
    }

    const {data, error} = await query

    if (error) throw error
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取培训课程列表失败:', error)
    return []
  }
}

/**
 * 获取培训课程详情
 */
export async function getTrainingCourseById(courseId: string): Promise<TrainingCourseDetail | null> {
  try {
    // 获取课程基本信息
    const {data: course, error: courseError} = await supabase
      .from('training_courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle()

    if (courseError) throw courseError
    if (!course) return null

    // 获取统计信息
    const {data: records} = await supabase.from('training_records').select('status, score').eq('course_id', courseId)

    const enrolledCount = records?.length || 0
    const completedCount = records?.filter((r) => r.status === 'completed').length || 0
    const scores = records?.filter((r) => r.score !== null).map((r) => r.score) || []
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length : null

    return {
      ...course,
      enrolled_count: enrolledCount,
      completed_count: completedCount,
      average_score: averageScore
    }
  } catch (error) {
    console.error('获取培训课程详情失败:', error)
    return null
  }
}

/**
 * 创建培训课程
 */
export async function createTrainingCourse(input: TrainingCourseCreateInput): Promise<TrainingCourse | null> {
  try {
    const {data, error} = await supabase.from('training_courses').insert(input).select().maybeSingle()

    if (error) throw error
    return data
  } catch (error) {
    console.error('创建培训课程失败:', error)
    throw error
  }
}

/**
 * 更新培训课程
 */
export async function updateTrainingCourse(courseId: string, input: TrainingCourseUpdateInput): Promise<boolean> {
  try {
    const {error} = await supabase.from('training_courses').update(input).eq('id', courseId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('更新培训课程失败:', error)
    throw error
  }
}

/**
 * 删除培训课程
 */
export async function deleteTrainingCourse(courseId: string): Promise<boolean> {
  try {
    const {error} = await supabase.from('training_courses').delete().eq('id', courseId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('删除培训课程失败:', error)
    throw error
  }
}

/**
 * 获取培训记录列表
 */
export async function getTrainingRecords(employeeId: string, status?: TrainingStatus): Promise<TrainingRecordDetail[]> {
  try {
    let query = supabase
      .from('training_records')
      .select(
        `
        *,
        training_courses!inner(
          title,
          category,
          duration_hours,
          instructor
        )
      `
      )
      .eq('employee_id', employeeId)
      .order('enrolled_at', {ascending: false})

    if (status) {
      query = query.eq('status', status)
    }

    const {data, error} = await query

    if (error) throw error

    // 转换数据格式
    const records: TrainingRecordDetail[] =
      data?.map((record: any) => ({
        ...record,
        course_title: record.training_courses.title,
        course_category: record.training_courses.category,
        course_duration_hours: record.training_courses.duration_hours,
        course_instructor: record.training_courses.instructor
      })) || []

    return records
  } catch (error) {
    console.error('获取培训记录列表失败:', error)
    return []
  }
}

/**
 * 获取培训记录详情
 */
export async function getTrainingRecordById(recordId: string): Promise<TrainingRecordDetail | null> {
  try {
    const {data, error} = await supabase
      .from('training_records')
      .select(
        `
        *,
        training_courses!inner(
          title,
          category,
          duration_hours,
          instructor
        )
      `
      )
      .eq('id', recordId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      ...data,
      course_title: data.training_courses.title,
      course_category: data.training_courses.category,
      course_duration_hours: data.training_courses.duration_hours,
      course_instructor: data.training_courses.instructor
    }
  } catch (error) {
    console.error('获取培训记录详情失败:', error)
    return null
  }
}

/**
 * 创建培训记录（报名课程）
 */
export async function createTrainingRecord(input: TrainingRecordCreateInput): Promise<TrainingRecord | null> {
  try {
    const {data, error} = await supabase.from('training_records').insert(input).select().maybeSingle()

    if (error) throw error

    // 获取课程信息用于通知
    if (data) {
      try {
        const {data: courseData} = await supabase
          .from('training_courses')
          .select('title, tenant_id')
          .eq('id', input.course_id)
          .maybeSingle()

        if (courseData) {
          // 自动发送通知给员工
          await createNotification({
            tenant_id: courseData.tenant_id,
            user_id: input.employee_id,
            type: 'training',
            title: '培训课程报名成功',
            content: `您已成功报名课程：${courseData.title}`,
            related_id: data.id,
            related_type: 'training_record'
          })
        }
      } catch (notificationError) {
        console.error('发送培训通知失败:', notificationError)
        // 通知失败不影响报名
      }
    }

    return data
  } catch (error) {
    console.error('创建培训记录失败:', error)
    throw error
  }
}

/**
 * 更新培训记录
 */
export async function updateTrainingRecord(recordId: string, input: TrainingRecordUpdateInput): Promise<boolean> {
  try {
    const {error} = await supabase.from('training_records').update(input).eq('id', recordId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('更新培训记录失败:', error)
    throw error
  }
}

/**
 * 开始培训
 */
export async function startTraining(recordId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('training_records')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', recordId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('开始培训失败:', error)
    throw error
  }
}

/**
 * 完成培训
 */
export async function completeTraining(recordId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('training_records')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        progress: 100
      })
      .eq('id', recordId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('完成培训失败:', error)
    throw error
  }
}

/**
 * 取消培训
 */
export async function cancelTraining(recordId: string): Promise<boolean> {
  try {
    const {error} = await supabase
      .from('training_records')
      .update({
        status: 'cancelled'
      })
      .eq('id', recordId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('取消培训失败:', error)
    throw error
  }
}

/**
 * 获取培训考核列表
 */
export async function getTrainingExams(employeeId: string, status?: ExamStatus): Promise<TrainingExam[]> {
  try {
    let query = supabase
      .from('training_exams')
      .select('*')
      .eq('employee_id', employeeId)
      .order('exam_date', {ascending: false})

    if (status) {
      query = query.eq('status', status)
    }

    const {data, error} = await query

    if (error) throw error
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('获取培训考核列表失败:', error)
    return []
  }
}

/**
 * 创建培训考核
 */
export async function createTrainingExam(input: TrainingExamCreateInput): Promise<TrainingExam | null> {
  try {
    // 自动判断考核状态
    const status: ExamStatus = input.score >= (input.pass_score || 60) ? 'passed' : 'failed'

    const {data, error} = await supabase
      .from('training_exams')
      .insert({
        ...input,
        status
      })
      .select()
      .maybeSingle()

    if (error) throw error

    // 更新培训记录的分数
    if (data) {
      await supabase.from('training_records').update({score: input.score}).eq('id', input.record_id)
    }

    return data
  } catch (error) {
    console.error('创建培训考核失败:', error)
    throw error
  }
}

/**
 * 更新培训考核
 */
export async function updateTrainingExam(examId: string, input: TrainingExamUpdateInput): Promise<boolean> {
  try {
    const {error} = await supabase.from('training_exams').update(input).eq('id', examId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('更新培训考核失败:', error)
    throw error
  }
}

/**
 * 获取员工培训统计
 */
export async function getEmployeeTrainingStats(employeeId: string): Promise<EmployeeTrainingStats> {
  try {
    const {data: records} = await supabase
      .from('training_records')
      .select(
        `
        *,
        training_courses!inner(duration_hours)
      `
      )
      .eq('employee_id', employeeId)

    const totalCourses = records?.length || 0
    const completedCourses = records?.filter((r) => r.status === 'completed').length || 0
    const inProgressCourses = records?.filter((r) => r.status === 'in_progress').length || 0
    const totalHours = records?.reduce((sum, r: any) => sum + (r.training_courses?.duration_hours || 0), 0) || 0
    const scores = records?.filter((r) => r.score !== null).map((r) => r.score) || []
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + (score || 0), 0) / scores.length : null
    const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0

    return {
      total_courses: totalCourses,
      completed_courses: completedCourses,
      in_progress_courses: inProgressCourses,
      total_hours: totalHours,
      average_score: averageScore,
      completion_rate: completionRate
    }
  } catch (error) {
    console.error('获取员工培训统计失败:', error)
    return {
      total_courses: 0,
      completed_courses: 0,
      in_progress_courses: 0,
      total_hours: 0,
      average_score: null,
      completion_rate: 0
    }
  }
}
