// 绩效管理相关类型定义

// ==================== 员工绩效记录 ====================

// 绩效状态
export type PerformanceStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

// 员工绩效记录表
export interface EmployeePerformance {
  id: string
  tenant_id: string
  employee_id: string
  period_year: number
  period_month: number
  overall_score: number
  service_score: number | null
  efficiency_score: number | null
  teamwork_score: number | null
  attendance_score: number | null
  rank_in_store: number | null
  rank_in_company: number | null
  evaluator_id: string | null
  evaluation_notes: string | null
  status: PerformanceStatus
  created_at: string
  updated_at: string
}

// 创建绩效记录输入
export interface CreatePerformanceInput {
  tenant_id: string
  employee_id: string
  period_year: number
  period_month: number
  overall_score: number
  service_score?: number
  efficiency_score?: number
  teamwork_score?: number
  attendance_score?: number
  rank_in_store?: number
  rank_in_company?: number
  evaluator_id?: string
  evaluation_notes?: string
}

// ==================== 绩效目标 ====================

// 目标类型
export type GoalType = 'service' | 'sales' | 'efficiency' | 'learning' | 'other'

// 目标状态
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled'

// 绩效目标表
export interface PerformanceGoal {
  id: string
  tenant_id: string
  employee_id: string
  goal_title: string
  goal_description: string | null
  goal_type: GoalType
  target_value: number | null
  current_value: number
  unit: string | null
  start_date: string
  end_date: string
  status: GoalStatus
  completion_rate: number
  created_by: string | null
  created_at: string
  updated_at: string
}

// 创建目标输入
export interface CreateGoalInput {
  tenant_id: string
  employee_id: string
  goal_title: string
  goal_description?: string
  goal_type: GoalType
  target_value?: number
  unit?: string
  start_date: string
  end_date: string
  created_by?: string
}

// 更新目标输入
export interface UpdateGoalInput {
  current_value?: number
  status?: GoalStatus
  completion_rate?: number
}

// ==================== 绩效改进计划 ====================

// 改进状态
export type ImprovementStatus = 'planning' | 'in_progress' | 'completed' | 'cancelled'

// 绩效改进计划表
export interface PerformanceImprovement {
  id: string
  tenant_id: string
  employee_id: string
  performance_id: string | null
  improvement_area: string
  current_situation: string | null
  improvement_plan: string
  expected_result: string | null
  deadline: string | null
  status: ImprovementStatus
  progress: number
  mentor_id: string | null
  created_at: string
  updated_at: string
}

// 创建改进计划输入
export interface CreateImprovementInput {
  tenant_id: string
  employee_id: string
  performance_id?: string
  improvement_area: string
  current_situation?: string
  improvement_plan: string
  expected_result?: string
  deadline?: string
  mentor_id?: string
}

// 更新改进计划输入
export interface UpdateImprovementInput {
  status?: ImprovementStatus
  progress?: number
  improvement_plan?: string
  expected_result?: string
}

// ==================== 统计数据 ====================

// 绩效趋势数据
export interface PerformanceTrend {
  period: string
  overall_score: number
  service_score: number
  efficiency_score: number
  teamwork_score: number
  attendance_score: number
}

// 绩效统计
export interface PerformanceStatistics {
  total_records: number
  average_score: number
  highest_score: number
  lowest_score: number
  current_rank_in_store: number | null
  current_rank_in_company: number | null
  improvement_rate: number
}

// 目标统计
export interface GoalStatistics {
  total_goals: number
  completed_goals: number
  in_progress_goals: number
  completion_rate: number
  average_completion_rate: number
}

// 绩效数据
export interface PerformanceData {
  current_performance: EmployeePerformance | null
  performance_trend: PerformanceTrend[]
  statistics: PerformanceStatistics
  goals: PerformanceGoal[]
  goal_statistics: GoalStatistics
  improvements: PerformanceImprovement[]
}
