// 员工成长API接口

import {supabase} from '@/client/supabase'
import type {
  CreateCertificationInput,
  CreateEmployeeLevelInput,
  CreateTrainingRecordInput,
  EmployeeCertification,
  EmployeeLevel,
  GrowthData,
  LearningProgress,
  TrainingCourse,
  TrainingRecord,
  UpdateEmployeeLevelInput,
  UpdateTrainingRecordInput
} from './types-growth'

// ==================== 员工等级 ====================

/**
 * 获取员工等级信息
 */
export async function getEmployeeLevel(employeeId: string): Promise<EmployeeLevel | null> {
  const {data, error} = await supabase.from('employee_levels').select('*').eq('employee_id', employeeId).maybeSingle()

  if (error) {
    console.error('获取员工等级失败:', error)
    return null
  }

  return data
}

/**
 * 创建员工等级
 */
export async function createEmployeeLevel(input: CreateEmployeeLevelInput): Promise<EmployeeLevel | null> {
  const {data, error} = await supabase
    .from('employee_levels')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      current_level: input.current_level || '初级服务员',
      level_score: input.level_score || 0,
      next_level: input.next_level || '中级服务员',
      next_level_score: input.next_level_score || 100
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建员工等级失败:', error)
    return null
  }

  return data
}

/**
 * 更新员工等级
 */
export async function updateEmployeeLevel(
  employeeId: string,
  input: UpdateEmployeeLevelInput
): Promise<EmployeeLevel | null> {
  const {data, error} = await supabase
    .from('employee_levels')
    .update(input)
    .eq('employee_id', employeeId)
    .select()
    .maybeSingle()

  if (error) {
    console.error('更新员工等级失败:', error)
    return null
  }

  return data
}

/**
 * 增加员工积分
 */
export async function addEmployeeScore(employeeId: string, score: number): Promise<boolean> {
  // 获取当前等级信息
  const level = await getEmployeeLevel(employeeId)
  if (!level) return false

  const newScore = level.level_score + score

  // 检查是否需要升级
  if (newScore >= level.next_level_score) {
    // 升级逻辑
    const levelMap: Record<string, {next: string; score: number}> = {
      初级服务员: {next: '中级服务员', score: 200},
      中级服务员: {next: '高级服务员', score: 300},
      高级服务员: {next: '服务导师', score: 500},
      服务导师: {next: '服务专家', score: 1000}
    }

    const nextLevelInfo = levelMap[level.next_level]
    if (nextLevelInfo) {
      await updateEmployeeLevel(employeeId, {
        current_level: level.next_level,
        level_score: newScore,
        next_level: nextLevelInfo.next,
        next_level_score: nextLevelInfo.score
      })
    } else {
      // 已经是最高等级
      await updateEmployeeLevel(employeeId, {
        level_score: newScore
      })
    }
  } else {
    // 只更新积分
    await updateEmployeeLevel(employeeId, {
      level_score: newScore
    })
  }

  return true
}

// ==================== 培训课程 ====================

/**
 * 获取活跃的培训课程列表
 */
export async function getActiveCourses(tenantId: string): Promise<TrainingCourse[]> {
  const {data, error} = await supabase
    .from('training_courses')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取培训课程失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取课程详情
 */
export async function getCourseById(courseId: string): Promise<TrainingCourse | null> {
  const {data, error} = await supabase.from('training_courses').select('*').eq('id', courseId).maybeSingle()

  if (error) {
    console.error('获取课程详情失败:', error)
    return null
  }

  return data
}

// ==================== 学习记录 ====================

/**
 * 获取员工的学习记录
 */
export async function getEmployeeTrainingRecords(employeeId: string): Promise<TrainingRecord[]> {
  const {data, error} = await supabase
    .from('training_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', {ascending: false})

  if (error) {
    console.error('获取学习记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建学习记录（报名课程）
 */
export async function enrollCourse(input: CreateTrainingRecordInput): Promise<TrainingRecord | null> {
  const {data, error} = await supabase
    .from('training_records')
    .insert({
      tenant_id: input.tenant_id,
      course_id: input.course_id,
      employee_id: input.employee_id,
      status: 'enrolled',
      progress: 0
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('报名课程失败:', error)
    return null
  }

  return data
}

/**
 * 更新学习记录
 */
export async function updateTrainingRecord(
  recordId: string,
  input: UpdateTrainingRecordInput
): Promise<TrainingRecord | null> {
  const {data, error} = await supabase.from('training_records').update(input).eq('id', recordId).select().maybeSingle()

  if (error) {
    console.error('更新学习记录失败:', error)
    return null
  }

  return data
}

/**
 * 开始学习课程
 */
export async function startCourse(recordId: string): Promise<boolean> {
  const result = await updateTrainingRecord(recordId, {
    status: 'in_progress',
    started_at: new Date().toISOString()
  })

  return result !== null
}

/**
 * 完成课程
 */
export async function completeCourse(recordId: string, score: number, employeeId: string): Promise<boolean> {
  const result = await updateTrainingRecord(recordId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    progress: 100,
    score
  })

  if (result) {
    // 增加员工积分
    await addEmployeeScore(employeeId, Math.floor(score / 10))
  }

  return result !== null
}

// ==================== 员工认证 ====================

/**
 * 获取员工的认证列表
 */
export async function getEmployeeCertifications(employeeId: string): Promise<EmployeeCertification[]> {
  const {data, error} = await supabase
    .from('employee_certifications')
    .select('*')
    .eq('employee_id', employeeId)
    .order('obtain_date', {ascending: false})

  if (error) {
    console.error('获取认证列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建认证
 */
export async function createCertification(input: CreateCertificationInput): Promise<EmployeeCertification | null> {
  const {data, error} = await supabase
    .from('employee_certifications')
    .insert({
      tenant_id: input.tenant_id,
      employee_id: input.employee_id,
      cert_name: input.cert_name,
      cert_type: input.cert_type,
      cert_level: input.cert_level || null,
      obtain_date: input.obtain_date,
      expire_date: input.expire_date || null,
      cert_status: 'active'
    })
    .select()
    .maybeSingle()

  if (error) {
    console.error('创建认证失败:', error)
    return null
  }

  return data
}

// ==================== 统计数据 ====================

/**
 * 获取学习进度统计
 */
export async function getLearningProgress(employeeId: string): Promise<LearningProgress> {
  const records = await getEmployeeTrainingRecords(employeeId)

  const totalCourses = records.length
  const enrolledCourses = records.filter((r) => r.status === 'enrolled').length
  const inProgressCourses = records.filter((r) => r.status === 'in_progress').length
  const completedCourses = records.filter((r) => r.status === 'completed').length
  const completionRate = totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0

  // 计算总学习时长（从课程信息中获取）
  let totalLearningHours = 0
  for (const record of records.filter((r) => r.status === 'completed')) {
    const course = await getCourseById(record.course_id)
    if (course) {
      totalLearningHours += Number(course.duration_hours)
    }
  }

  // 计算平均分数
  const completedWithScore = records.filter((r) => r.status === 'completed' && r.score !== null)
  const averageScore =
    completedWithScore.length > 0
      ? completedWithScore.reduce((sum, r) => sum + Number(r.score || 0), 0) / completedWithScore.length
      : 0

  return {
    total_courses: totalCourses,
    enrolled_courses: enrolledCourses,
    in_progress_courses: inProgressCourses,
    completed_courses: completedCourses,
    completion_rate: Math.round(completionRate),
    total_learning_hours: totalLearningHours,
    average_score: Math.round(averageScore * 10) / 10
  }
}

/**
 * 获取员工成长数据
 */
export async function getEmployeeGrowthData(employeeId: string): Promise<GrowthData | null> {
  try {
    console.log('🔍 [getEmployeeGrowthData] 开始获取成长数据，员工ID:', employeeId)

    // 获取等级信息
    console.log('📊 [getEmployeeGrowthData] 正在获取等级信息...')
    let level = await getEmployeeLevel(employeeId)
    console.log('✅ [getEmployeeGrowthData] 等级信息:', level)

    // 如果没有等级信息，创建一个默认的
    if (!level) {
      console.log('⚠️ [getEmployeeGrowthData] 等级信息不存在，正在创建默认等级...')
      const {data: employee} = await supabase.from('employees').select('tenant_id').eq('id', employeeId).maybeSingle()
      console.log('✅ [getEmployeeGrowthData] 员工租户信息:', employee)

      if (employee) {
        level = await createEmployeeLevel({
          tenant_id: employee.tenant_id,
          employee_id: employeeId
        })
        console.log('✅ [getEmployeeGrowthData] 已创建默认等级:', level)
      } else {
        console.error('❌ [getEmployeeGrowthData] 无法获取员工租户信息')
      }
    }

    if (!level) {
      console.error('❌ [getEmployeeGrowthData] 无法获取或创建等级信息')
      return null
    }

    // 获取学习进度
    console.log('📚 [getEmployeeGrowthData] 正在获取学习进度...')
    const learningProgress = await getLearningProgress(employeeId)
    console.log('✅ [getEmployeeGrowthData] 学习进度:', learningProgress)

    // 获取认证列表
    console.log('🎓 [getEmployeeGrowthData] 正在获取认证列表...')
    const certifications = await getEmployeeCertifications(employeeId)
    console.log('✅ [getEmployeeGrowthData] 认证列表:', certifications)

    // 获取最近的课程记录
    console.log('📖 [getEmployeeGrowthData] 正在获取课程记录...')
    const recentCourses = await getEmployeeTrainingRecords(employeeId)
    console.log('✅ [getEmployeeGrowthData] 课程记录:', recentCourses)

    const result = {
      level,
      learning_progress: learningProgress,
      certifications,
      recent_courses: recentCourses.slice(0, 5)
    }

    console.log('🎉 [getEmployeeGrowthData] 成长数据获取成功:', result)
    return result
  } catch (error) {
    console.error('❌ [getEmployeeGrowthData] 获取成长数据失败:', error)
    return null
  }
}
