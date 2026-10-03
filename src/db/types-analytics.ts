/**
 * 数据分析类型定义
 */

/**
 * 培训数据统计
 */
export interface TrainingAnalytics {
  // 课程统计
  total_courses: number
  active_courses: number
  completed_courses: number

  // 学员统计
  total_enrollments: number
  completed_enrollments: number
  in_progress_enrollments: number

  // 完成率
  completion_rate: number

  // 热门课程（前5）
  popular_courses: {
    course_id: string
    course_title: string
    enrollment_count: number
  }[]

  // 最近完成的培训
  recent_completions: {
    employee_name: string
    course_title: string
    completed_at: string
  }[]
}

/**
 * 任务数据统计
 */
export interface TaskAnalytics {
  // 任务统计
  total_tasks: number
  pending_tasks: number
  in_progress_tasks: number
  completed_tasks: number

  // 完成率
  completion_rate: number

  // 优先级分布
  priority_distribution: {
    high: number
    medium: number
    low: number
  }

  // 逾期任务
  overdue_tasks: number

  // 最近完成的任务
  recent_completions: {
    employee_name: string
    task_title: string
    completed_at: string
  }[]
}

/**
 * 员工绩效统计
 */
export interface EmployeePerformance {
  employee_id: string
  employee_name: string

  // 任务统计
  total_tasks: number
  completed_tasks: number
  task_completion_rate: number

  // 培训统计
  total_trainings: number
  completed_trainings: number
  training_completion_rate: number

  // 综合评分
  overall_score: number
}

/**
 * 部门统计
 */
export interface DepartmentStats {
  department: string

  // 员工数量
  employee_count: number

  // 任务统计
  total_tasks: number
  completed_tasks: number
  task_completion_rate: number

  // 培训统计
  total_trainings: number
  completed_trainings: number
  training_completion_rate: number
}

/**
 * 综合数据分析
 */
export interface OverallAnalytics {
  training: TrainingAnalytics
  task: TaskAnalytics
  top_performers: EmployeePerformance[]
  department_stats: DepartmentStats[]
}
