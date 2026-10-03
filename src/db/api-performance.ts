// 绩效管理API接口

import {supabase} from '@/client/supabase'
import type {
  CreateGoalInput,
  CreateImprovementInput,
  CreatePerformanceInput,
  EmployeePerformance,
  GoalStatistics,
  PerformanceData,
  PerformanceGoal,
  PerformanceImprovement,
  PerformanceStatistics,
  PerformanceTrend,
  UpdateGoalInput,
  UpdateImprovementInput
} from './types-performance'

// ==================== 员工绩效记录 ====================

/**
 * 获取员工的绩效记录列表
 */
export async function getEmployeePerformanceRecords(employeeId: string): Promise<EmployeePerformance[]> {
  const {data, error} = await supabase
    .from('employee_performance')
    .select('*')
    .eq('employee_id', employeeId)
    .order('period_year', {ascending: false})
    .order('period_month', {ascending: false})

  if (error) {
    console.error('获取绩效记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取当前月份的绩效记录
 */
export async function getCurrentPerformance(employeeId: string): Promise<EmployeePerformance | null> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const {data, error} = await supabase
    .from('employee_performance')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('period_year', year)
    .eq('period_month', month)
    .maybeSingle()

  if (error) {
    console.error('获取当前绩效失败:', error)
    return null
  }

  return data
}

/**
 * 创建绩效记录
 */
export async function createPerformance(input: CreatePerformanceInput): Promise<EmployeePerformance | null> {
  const {data, error} = await supabase
    .from('employee_performance')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      period_year: input.period_year,
      period_month: input.period_month,
      overall_score: input.overall_score,
      service_score: input.service_score || null,
      efficiency_score: input.efficiency_score || null,
      teamwork_score: input.teamwork_score || null,
      attendance_score: input.attendance_score || null,
      rank_in_store: input.rank_in_store || null,
      rank_in_company: input.rank_in_company || null,
      evaluator_id: input.evaluator_id || null,
      evaluation_notes: input.evaluation_notes || null,
      status: 'draft'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建绩效记录失败:', error)
    return null
  }

  return data
}

// ==================== 绩效目标 ====================

/**
 * 获取员工的目标列表
 */
export async function getEmployeeGoals(employeeId: string): Promise<PerformanceGoal[]> {
  const {data, error} = await supabase
    .from('performance_goals')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取目标列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取进行中的目标
 */
export async function getActiveGoals(employeeId: string): Promise<PerformanceGoal[]> {
  const {data, error} = await supabase
    .from('performance_goals')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'in_progress')
    .order('end_date', {ascending: true})

  if (error) {
    console.error('获取进行中的目标失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建目标
 */
export async function createGoal(input: CreateGoalInput): Promise<PerformanceGoal | null> {
  const {data, error} = await supabase
    .from('performance_goals')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      goal_title: input.goal_title,
      goal_description: input.goal_description || null,
      goal_type: input.goal_type,
      target_value: input.target_value || null,
      unit: input.unit || null,
      start_date: input.start_date,
      end_date: input.end_date,
      created_by: input.created_by || null,
      status: 'in_progress'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建目标失败:', error)
    return null
  }

  return data
}

/**
 * 更新目标
 */
export async function updateGoal(goalId: string, input: UpdateGoalInput): Promise<PerformanceGoal | null> {
  const {data, error} = await supabase.from('performance_goals').update(input).eq('id', goalId).select().maybeSingle()

  if (error) {
    console.error('更新目标失败:', error)
    return null
  }

  return data
}

// ==================== 绩效改进计划 ====================

/**
 * 获取员工的改进计划列表
 */
export async function getEmployeeImprovements(employeeId: string): Promise<PerformanceImprovement[]> {
  const {data, error} = await supabase
    .from('performance_improvements')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取改进计划失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建改进计划
 */
export async function createImprovement(input: CreateImprovementInput): Promise<PerformanceImprovement | null> {
  const {data, error} = await supabase
    .from('performance_improvements')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      performance_id: input.performance_id || null,
      improvement_area: input.improvement_area,
      current_situation: input.current_situation || null,
      improvement_plan: input.improvement_plan,
      expected_result: input.expected_result || null,
      deadline: input.deadline || null,
      mentor_id: input.mentor_id || null,
      status: 'planning'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建改进计划失败:', error)
    return null
  }

  return data
}

/**
 * 更新改进计划
 */
export async function updateImprovement(
  improvementId: string,
  input: UpdateImprovementInput
): Promise<PerformanceImprovement | null> {
  const {data, error} = await supabase
    .from('performance_improvements')
    .update(input)
    .eq('id', improvementId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新改进计划失败:', error)
    return null
  }

  return data
}

// ==================== 统计数据 ====================

/**
 * 获取绩效趋势数据（最近6个月）
 */
export async function getPerformanceTrend(employeeId: string): Promise<PerformanceTrend[]> {
  const records = await getEmployeePerformanceRecords(employeeId)

  // 只取最近6个月的数据
  const recentRecords = records.slice(0, 6).reverse()

  return recentRecords.map((record) => ({
    period: `${record.period_year}-${String(record.period_month).padStart(2, '0')}`,
    overall_score: Number(record.overall_score),
    service_score: Number(record.service_score || 0),
    efficiency_score: Number(record.efficiency_score || 0),
    teamwork_score: Number(record.teamwork_score || 0),
    attendance_score: Number(record.attendance_score || 0)
  }))
}

/**
 * 获取绩效统计
 */
export async function getPerformanceStatistics(employeeId: string): Promise<PerformanceStatistics> {
  const records = await getEmployeePerformanceRecords(employeeId)

  if (records.length === 0) {
    return {
      total_records: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0,
      current_rank_in_store: null,
      current_rank_in_company: null,
      improvement_rate: 0
    }
  }

  const scores = records.map((r) => Number(r.overall_score))
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const highestScore = Math.max(...scores)
  const lowestScore = Math.min(...scores)

  // 计算改进率（最近一个月vs上个月）
  let improvementRate = 0
  if (records.length >= 2) {
    const currentScore = Number(records[0].overall_score)
    const previousScore = Number(records[1].overall_score)
    improvementRate = ((currentScore - previousScore) / previousScore) * 100
  }

  return {
    total_records: records.length,
    average_score: Math.round(averageScore * 10) / 10,
    highest_score: highestScore,
    lowest_score: lowestScore,
    current_rank_in_store: records[0]?.rank_in_store || null,
    current_rank_in_company: records[0]?.rank_in_company || null,
    improvement_rate: Math.round(improvementRate * 10) / 10
  }
}

/**
 * 获取目标统计
 */
export async function getGoalStatistics(employeeId: string): Promise<GoalStatistics> {
  const goals = await getEmployeeGoals(employeeId)

  const totalGoals = goals.length
  const completedGoals = goals.filter((g) => g.status === 'completed').length
  const inProgressGoals = goals.filter((g) => g.status === 'in_progress').length
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0

  // 计算平均完成率
  const averageCompletionRate =
    goals.length > 0 ? goals.reduce((sum, g) => sum + g.completion_rate, 0) / goals.length : 0

  return {
    total_goals: totalGoals,
    completed_goals: completedGoals,
    in_progress_goals: inProgressGoals,
    completion_rate: Math.round(completionRate),
    average_completion_rate: Math.round(averageCompletionRate)
  }
}

/**
 * 获取员工绩效数据
 */
export async function getEmployeePerformanceData(employeeId: string): Promise<PerformanceData | null> {
  try {
    // 获取当前绩效
    const currentPerformance = await getCurrentPerformance(employeeId)

    // 获取绩效趋势
    const performanceTrend = await getPerformanceTrend(employeeId)

    // 获取绩效统计
    const statistics = await getPerformanceStatistics(employeeId)

    // 获取目标列表
    const goals = await getActiveGoals(employeeId)

    // 获取目标统计
    const goalStatistics = await getGoalStatistics(employeeId)

    // 获取改进计划
    const improvements = await getEmployeeImprovements(employeeId)

    return {
      current_performance: currentPerformance,
      performance_trend: performanceTrend,
      statistics,
      goals,
      goal_statistics: goalStatistics,
      improvements: improvements.slice(0, 5)
    }
  } catch (error) {
    console.error('获取绩效数据失败:', error)
    return null
  }
}
