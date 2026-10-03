/**
 * 数据分析 API
 */

import {supabase} from '@/client/supabase'
import type {DepartmentStats, EmployeePerformance, TaskAnalytics, TrainingAnalytics} from './types-analytics'

/**
 * 获取培训数据统计
 */
export async function getTrainingAnalytics(tenantId: string): Promise<TrainingAnalytics> {
  try {
    // 获取课程统计
    const {data: courses} = await supabase.from('training_courses').select('id, status').eq('tenant_id', tenantId)

    const totalCourses = courses?.length || 0
    const activeCourses = courses?.filter((c) => c.status === 'active').length || 0
    const completedCourses = courses?.filter((c) => c.status === 'completed').length || 0

    // 获取培训记录统计
    const {data: records} = await supabase
      .from('training_records')
      .select('id, status, course_id, employee_id, completed_at')
      .eq('tenant_id', tenantId)

    const totalEnrollments = records?.length || 0
    const completedEnrollments = records?.filter((r) => r.status === 'completed').length || 0
    const inProgressEnrollments = records?.filter((r) => r.status === 'in_progress').length || 0
    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0

    // 获取热门课程
    const courseEnrollments = new Map<string, number>()
    records?.forEach((record) => {
      const count = courseEnrollments.get(record.course_id) || 0
      courseEnrollments.set(record.course_id, count + 1)
    })

    const {data: coursesData} = await supabase.from('training_courses').select('id, title').eq('tenant_id', tenantId)

    const popularCourses = Array.from(courseEnrollments.entries())
      .map(([courseId, count]) => {
        const course = coursesData?.find((c) => c.id === courseId)
        return {
          course_id: courseId,
          course_title: course?.title || '未知课程',
          enrollment_count: count
        }
      })
      .sort((a, b) => b.enrollment_count - a.enrollment_count)
      .slice(0, 5)

    // 获取最近完成的培训
    const {data: recentData} = await supabase
      .from('training_records')
      .select(
        `
        completed_at,
        employees:employee_id (name),
        training_courses:course_id (title)
      `
      )
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', {ascending: false})
      .limit(5)

    const recentCompletions =
      recentData?.map((item: any) => ({
        employee_name: item.employees?.name || '未知员工',
        course_title: item.training_courses?.title || '未知课程',
        completed_at: item.completed_at
      })) || []

    return {
      total_courses: totalCourses,
      active_courses: activeCourses,
      completed_courses: completedCourses,
      total_enrollments: totalEnrollments,
      completed_enrollments: completedEnrollments,
      in_progress_enrollments: inProgressEnrollments,
      completion_rate: Math.round(completionRate * 10) / 10,
      popular_courses: popularCourses,
      recent_completions: recentCompletions
    }
  } catch (error) {
    console.error('获取培训数据统计失败:', error)
    return {
      total_courses: 0,
      active_courses: 0,
      completed_courses: 0,
      total_enrollments: 0,
      completed_enrollments: 0,
      in_progress_enrollments: 0,
      completion_rate: 0,
      popular_courses: [],
      recent_completions: []
    }
  }
}

/**
 * 获取任务数据统计
 */
export async function getTaskAnalytics(tenantId: string): Promise<TaskAnalytics> {
  try {
    // 获取任务统计
    const {data: tasks} = await supabase
      .from('tasks')
      .select('id, status, priority, due_date')
      .eq('tenant_id', tenantId)

    const totalTasks = tasks?.length || 0
    const pendingTasks = tasks?.filter((t) => t.status === 'pending').length || 0
    const inProgressTasks = tasks?.filter((t) => t.status === 'in_progress').length || 0
    const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // 优先级分布
    const highPriority = tasks?.filter((t) => t.priority === 'high').length || 0
    const mediumPriority = tasks?.filter((t) => t.priority === 'medium').length || 0
    const lowPriority = tasks?.filter((t) => t.priority === 'low').length || 0

    // 逾期任务
    const now = new Date().toISOString()
    const overdueTasks = tasks?.filter((t) => t.status !== 'completed' && t.due_date && t.due_date < now).length || 0

    // 获取最近完成的任务
    const {data: recentData} = await supabase
      .from('tasks')
      .select(
        `
        title,
        completed_at,
        employees:employee_id (name)
      `
      )
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', {ascending: false})
      .limit(5)

    const recentCompletions =
      recentData?.map((item: any) => ({
        employee_name: item.employees?.name || '未知员工',
        task_title: item.title,
        completed_at: item.completed_at
      })) || []

    return {
      total_tasks: totalTasks,
      pending_tasks: pendingTasks,
      in_progress_tasks: inProgressTasks,
      completed_tasks: completedTasks,
      completion_rate: Math.round(completionRate * 10) / 10,
      priority_distribution: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      },
      overdue_tasks: overdueTasks,
      recent_completions: recentCompletions
    }
  } catch (error) {
    console.error('获取任务数据统计失败:', error)
    return {
      total_tasks: 0,
      pending_tasks: 0,
      in_progress_tasks: 0,
      completed_tasks: 0,
      completion_rate: 0,
      priority_distribution: {
        high: 0,
        medium: 0,
        low: 0
      },
      overdue_tasks: 0,
      recent_completions: []
    }
  }
}

/**
 * 获取员工绩效排行
 */
export async function getTopPerformers(tenantId: string, limit = 10): Promise<EmployeePerformance[]> {
  try {
    const {data: employees} = await supabase.from('employees').select('id, name').eq('tenant_id', tenantId)

    if (!employees || employees.length === 0) {
      return []
    }

    const performances: EmployeePerformance[] = []

    for (const employee of employees) {
      // 获取任务统计
      const {data: tasks} = await supabase.from('tasks').select('id, status').eq('employee_id', employee.id)

      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // 获取培训统计
      const {data: trainings} = await supabase
        .from('training_records')
        .select('id, status')
        .eq('employee_id', employee.id)

      const totalTrainings = trainings?.length || 0
      const completedTrainings = trainings?.filter((t) => t.status === 'completed').length || 0
      const trainingCompletionRate = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0

      // 计算综合评分（任务完成率 60% + 培训完成率 40%）
      const overallScore = taskCompletionRate * 0.6 + trainingCompletionRate * 0.4

      performances.push({
        employee_id: employee.id,
        employee_name: employee.name,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        task_completion_rate: Math.round(taskCompletionRate * 10) / 10,
        total_trainings: totalTrainings,
        completed_trainings: completedTrainings,
        training_completion_rate: Math.round(trainingCompletionRate * 10) / 10,
        overall_score: Math.round(overallScore * 10) / 10
      })
    }

    // 按综合评分排序
    return performances.sort((a, b) => b.overall_score - a.overall_score).slice(0, limit)
  } catch (error) {
    console.error('获取员工绩效排行失败:', error)
    return []
  }
}

/**
 * 获取部门统计
 */
export async function getDepartmentStats(tenantId: string): Promise<DepartmentStats[]> {
  try {
    const {data: employees} = await supabase.from('employees').select('id, department').eq('tenant_id', tenantId)

    if (!employees || employees.length === 0) {
      return []
    }

    // 按部门分组
    const departmentMap = new Map<string, string[]>()
    employees.forEach((emp) => {
      const dept = emp.department || '未分配部门'
      const empIds = departmentMap.get(dept) || []
      empIds.push(emp.id)
      departmentMap.set(dept, empIds)
    })

    const stats: DepartmentStats[] = []

    for (const [department, employeeIds] of departmentMap.entries()) {
      // 获取部门任务统计
      const {data: tasks} = await supabase.from('tasks').select('id, status').in('employee_id', employeeIds)

      const totalTasks = tasks?.length || 0
      const completedTasks = tasks?.filter((t) => t.status === 'completed').length || 0
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // 获取部门培训统计
      const {data: trainings} = await supabase
        .from('training_records')
        .select('id, status')
        .in('employee_id', employeeIds)

      const totalTrainings = trainings?.length || 0
      const completedTrainings = trainings?.filter((t) => t.status === 'completed').length || 0
      const trainingCompletionRate = totalTrainings > 0 ? (completedTrainings / totalTrainings) * 100 : 0

      stats.push({
        department,
        employee_count: employeeIds.length,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        task_completion_rate: Math.round(taskCompletionRate * 10) / 10,
        total_trainings: totalTrainings,
        completed_trainings: completedTrainings,
        training_completion_rate: Math.round(trainingCompletionRate * 10) / 10
      })
    }

    return stats.sort((a, b) => b.employee_count - a.employee_count)
  } catch (error) {
    console.error('获取部门统计失败:', error)
    return []
  }
}
