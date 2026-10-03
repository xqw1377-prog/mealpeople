/**
 * 招聘管理API接口
 */

import {supabase} from '@/client/supabase'
import type {
  Candidate,
  CandidateDetail,
  CandidateFilter,
  Interview,
  RecruitmentFilter,
  RecruitmentOverview,
  RecruitmentPosition,
  RecruitmentPositionDetail
} from './types-recruitment'

// ============================================
// 招聘职位管理
// ============================================

/**
 * 获取所有招聘职位
 */
export async function getAllPositions(filter?: RecruitmentFilter): Promise<RecruitmentPosition[]> {
  let query = supabase.from('recruitment_positions').select('*').order('created_at', {ascending: false})

  // 应用筛选条件
  if (filter?.status) {
    query = query.eq('status', filter.status)
  }
  if (filter?.department) {
    query = query.eq('department', filter.department)
  }
  if (filter?.search) {
    query = query.or(`title.ilike.%${filter.search}%,department.ilike.%${filter.search}%`)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取招聘职位失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取招聘职位详情
 */
export async function getPositionDetail(id: string): Promise<RecruitmentPositionDetail | null> {
  const {data, error} = await supabase.from('recruitment_positions').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取职位详情失败:', error)
    return null
  }

  if (!data) return null

  // 获取候选人数量
  const {count: candidateCount} = await supabase
    .from('candidates')
    .select('*', {count: 'exact', head: true})
    .eq('applied_position_id', id)

  // 获取面试数量
  const {count: interviewCount} = await supabase
    .from('interviews')
    .select('*', {count: 'exact', head: true})
    .eq('position_id', id)

  return {
    ...data,
    candidate_count: candidateCount || 0,
    interview_count: interviewCount || 0
  }
}

/**
 * 创建招聘职位
 */
export async function createPosition(position: Partial<RecruitmentPosition>): Promise<RecruitmentPosition | null> {
  const {data, error} = await supabase.from('recruitment_positions').insert(position).select().maybeSingle()

  if (error) {
    console.error('创建招聘职位失败:', error)
    return null
  }

  return data
}

/**
 * 更新招聘职位
 */
export async function updatePosition(id: string, updates: Partial<RecruitmentPosition>): Promise<boolean> {
  const {error} = await supabase.from('recruitment_positions').update(updates).eq('id', id)

  if (error) {
    console.error('更新招聘职位失败:', error)
    return false
  }

  return true
}

/**
 * 删除招聘职位
 */
export async function deletePosition(id: string): Promise<boolean> {
  const {error} = await supabase.from('recruitment_positions').delete().eq('id', id)

  if (error) {
    console.error('删除招聘职位失败:', error)
    return false
  }

  return true
}

// ============================================
// 候选人管理
// ============================================

/**
 * 获取所有候选人
 */
export async function getAllCandidates(filter?: CandidateFilter): Promise<Candidate[]> {
  let query = supabase.from('candidates').select('*').order('created_at', {ascending: false})

  // 应用筛选条件
  if (filter?.status) {
    query = query.eq('status', filter.status)
  }
  if (filter?.position_id) {
    query = query.eq('applied_position_id', filter.position_id)
  }
  if (filter?.source) {
    query = query.eq('source', filter.source)
  }
  if (filter?.search) {
    query = query.or(`name.ilike.%${filter.search}%,phone.ilike.%${filter.search}%,email.ilike.%${filter.search}%`)
  }

  const {data, error} = await query

  if (error) {
    console.error('获取候选人列表失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取候选人详情
 */
export async function getCandidateDetail(id: string): Promise<CandidateDetail | null> {
  const {data: candidate, error} = await supabase.from('candidates').select('*').eq('id', id).maybeSingle()

  if (error) {
    console.error('获取候选人详情失败:', error)
    return null
  }

  if (!candidate) return null

  // 获取面试记录
  const {data: interviews} = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', id)
    .order('interview_date', {ascending: false})

  // 获取职位标题
  let positionTitle = ''
  if (candidate.applied_position_id) {
    const {data: position} = await supabase
      .from('recruitment_positions')
      .select('title')
      .eq('id', candidate.applied_position_id)
      .maybeSingle()
    positionTitle = position?.title || ''
  }

  return {
    ...candidate,
    interviews: Array.isArray(interviews) ? interviews : [],
    position_title: positionTitle
  }
}

/**
 * 创建候选人
 */
export async function createCandidate(candidate: Partial<Candidate>): Promise<Candidate | null> {
  const {data, error} = await supabase.from('candidates').insert(candidate).select().maybeSingle()

  if (error) {
    console.error('创建候选人失败:', error)
    return null
  }

  return data
}

/**
 * 更新候选人信息
 */
export async function updateCandidate(id: string, updates: Partial<Candidate>): Promise<boolean> {
  const {error} = await supabase.from('candidates').update(updates).eq('id', id)

  if (error) {
    console.error('更新候选人信息失败:', error)
    return false
  }

  return true
}

/**
 * 删除候选人
 */
export async function deleteCandidate(id: string): Promise<boolean> {
  const {error} = await supabase.from('candidates').delete().eq('id', id)

  if (error) {
    console.error('删除候选人失败:', error)
    return false
  }

  return true
}

// ============================================
// 面试管理
// ============================================

/**
 * 获取所有面试记录
 */
export async function getAllInterviews(): Promise<Interview[]> {
  const {data, error} = await supabase.from('interviews').select('*').order('interview_date', {ascending: false})

  if (error) {
    console.error('获取面试记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 获取候选人的面试记录
 */
export async function getCandidateInterviews(candidateId: string): Promise<Interview[]> {
  const {data, error} = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('interview_date', {ascending: false})

  if (error) {
    console.error('获取候选人面试记录失败:', error)
    return []
  }

  return Array.isArray(data) ? data : []
}

/**
 * 创建面试记录
 */
export async function createInterview(interview: Partial<Interview>): Promise<Interview | null> {
  const {data, error} = await supabase.from('interviews').insert(interview).select().maybeSingle()

  if (error) {
    console.error('创建面试记录失败:', error)
    return null
  }

  return data
}

/**
 * 更新面试记录
 */
export async function updateInterview(id: string, updates: Partial<Interview>): Promise<boolean> {
  const {error} = await supabase.from('interviews').update(updates).eq('id', id)

  if (error) {
    console.error('更新面试记录失败:', error)
    return false
  }

  return true
}

// ============================================
// 招聘统计
// ============================================

/**
 * 获取招聘概览数据
 */
export async function getRecruitmentOverview(): Promise<RecruitmentOverview> {
  const [positions, candidates, interviews] = await Promise.all([
    getAllPositions(),
    getAllCandidates(),
    getAllInterviews()
  ])

  // 本周新增候选人
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const newCandidatesThisWeek = candidates.filter((c) => new Date(c.created_at) >= oneWeekAgo).length

  // 本周面试
  const interviewsThisWeek = interviews.filter((i) => {
    if (!i.interview_date) return false
    return new Date(i.interview_date) >= oneWeekAgo
  }).length

  // 本月Offer
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  const offersThisMonth = candidates.filter((c) => c.status === 'offer' && new Date(c.updated_at) >= oneMonthAgo).length

  // 本月入职
  const hiredThisMonth = candidates.filter((c) => c.status === 'hired' && new Date(c.updated_at) >= oneMonthAgo).length

  // 转化率
  const conversionRate = candidates.length > 0 ? (hiredThisMonth / candidates.length) * 100 : 0

  return {
    total_positions: positions.length,
    active_positions: positions.filter((p) => p.status === 'published').length,
    total_candidates: candidates.length,
    new_candidates_this_week: newCandidatesThisWeek,
    interviews_this_week: interviewsThisWeek,
    offers_this_month: offersThisMonth,
    hired_this_month: hiredThisMonth,
    conversion_rate: Math.round(conversionRate * 10) / 10
  }
}

/**
 * 获取部门列表
 */
export async function getRecruitmentDepartments(): Promise<string[]> {
  const {data, error} = await supabase.from('recruitment_positions').select('department').not('department', 'is', null)

  if (error) {
    console.error('获取部门列表失败:', error)
    return []
  }

  const departments = Array.isArray(data) ? data.map((item) => item.department).filter((d): d is string => !!d) : []

  // 去重
  return Array.from(new Set(departments))
}
