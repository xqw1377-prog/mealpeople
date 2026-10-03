/**
 * 招聘管理相关类型定义
 */

// ============================================
// 枚举类型
// ============================================

/**
 * 职位状态
 */
export type PositionStatus = 'draft' | 'published' | 'closed'

/**
 * 优先级
 */
export type PriorityLevel = 'high' | 'medium' | 'low'

/**
 * 候选人状态
 */
export type CandidateStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'

/**
 * 面试类型
 */
export type InterviewType = 'phone' | 'video' | 'onsite' | 'group'

/**
 * 面试状态
 */
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

/**
 * 面试结果
 */
export type InterviewResult = 'pass' | 'fail' | 'pending'

// ============================================
// 数据库表类型
// ============================================

/**
 * 招聘职位（基于现有表结构）
 */
export interface RecruitmentPosition {
  id: string
  tenant_id?: string
  title: string
  department?: string
  description?: string
  requirements?: string
  salary_range?: string
  status?: string
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * 候选人
 */
export interface Candidate {
  id: string
  name: string
  gender?: string
  phone?: string
  email?: string
  birth_date?: string
  education?: string
  major?: string
  work_experience?: string
  resume_url?: string
  source?: string
  status?: CandidateStatus
  applied_position_id?: string
  current_stage?: string
  tags?: string[]
  notes?: string
  created_at: string
  updated_at: string
}

/**
 * 面试记录
 */
export interface Interview {
  id: string
  candidate_id: string
  position_id?: string
  interview_type?: InterviewType
  interview_round?: number
  interview_date?: string
  interviewer_ids?: string[]
  location?: string
  status?: InterviewStatus
  score?: number
  feedback?: string
  result?: InterviewResult
  created_at: string
  updated_at: string
}

/**
 * 招聘统计
 */
export interface RecruitmentStats {
  id: string
  date: string
  total_positions: number
  active_positions: number
  total_candidates: number
  new_candidates: number
  interviews_scheduled: number
  interviews_completed: number
  offers_sent: number
  candidates_hired: number
  created_at: string
}

// ============================================
// 业务类型
// ============================================

/**
 * 招聘职位详情（包含候选人数量）
 */
export interface RecruitmentPositionDetail extends RecruitmentPosition {
  candidate_count?: number
  interview_count?: number
}

/**
 * 候选人详情（包含面试记录）
 */
export interface CandidateDetail extends Candidate {
  interviews?: Interview[]
  position_title?: string
}

/**
 * 面试详情（包含候选人和职位信息）
 */
export interface InterviewDetail extends Interview {
  candidate_name?: string
  position_title?: string
  interviewer_names?: string[]
}

/**
 * 招聘概览数据
 */
export interface RecruitmentOverview {
  total_positions: number
  active_positions: number
  total_candidates: number
  new_candidates_this_week: number
  interviews_this_week: number
  offers_this_month: number
  hired_this_month: number
  conversion_rate: number
}

/**
 * 招聘漏斗数据
 */
export interface RecruitmentFunnel {
  stage: string
  count: number
  percentage: number
}

/**
 * 招聘筛选条件
 */
export interface RecruitmentFilter {
  status?: string
  department?: string
  search?: string
}

/**
 * 候选人筛选条件
 */
export interface CandidateFilter {
  status?: CandidateStatus
  position_id?: string
  source?: string
  search?: string
}
