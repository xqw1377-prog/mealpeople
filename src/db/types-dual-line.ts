/**
 * 三大旅程双线数据类型定义
 *
 * 双线设计理念：
 * - 员工线：员工视角的操作和状态
 * - 管理线：管理者视角的操作和决策
 * - 共享字段：双方都需要的基础信息
 */

// ============================================
// 入职旅程类型
// ============================================

/**
 * 面试记录（双线）
 */
export interface Interview {
  id: string
  tenant_id: string

  // 员工线字段
  candidate_id?: string
  candidate_name: string
  candidate_phone?: string
  candidate_email?: string
  confirm_status: 'pending' | 'confirmed' | 'rescheduled' | 'declined'
  reschedule_reason?: string
  interview_attendance?: 'attended' | 'absent' | 'late'
  offer_response?: 'accepted' | 'declined' | 'pending'
  offer_response_time?: string

  // 管理线字段
  interviewer_id?: string
  interviewer_name?: string
  evaluation_score?: number
  evaluation_notes?: string
  technical_score?: number
  communication_score?: number
  attitude_score?: number
  offer_decision?: 'approved' | 'rejected'
  offer_sent_time?: string
  rejection_reason?: string

  // 共享字段
  position: string
  department?: string
  interview_time: string
  interview_location?: string
  interview_type?: 'online' | 'onsite'
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string

  created_at: string
  updated_at: string
}

/**
 * 入职流程（双线）
 */
export interface OnboardingProcess {
  id: string
  tenant_id: string

  // 员工线字段
  employee_id?: string
  employee_name: string
  info_completed: boolean
  info_submitted_time?: string
  goods_received: boolean
  goods_received_time?: string
  dorm_confirmed: boolean
  dorm_confirmed_time?: string
  mentor_contacted: boolean
  mentor_contact_time?: string

  // 管理线字段
  hr_approver?: string
  hr_approver_name?: string
  goods_issuer?: string
  goods_issuer_name?: string
  dorm_manager?: string
  dorm_manager_name?: string
  mentor_assigner?: string
  mentor_id?: string
  mentor_name?: string
  info_approved: boolean
  info_approved_time?: string
  goods_issued: boolean
  goods_issued_time?: string
  dorm_assigned: boolean
  dorm_number?: string
  dorm_bed_number?: string
  mentor_assigned: boolean
  mentor_assigned_time?: string
  approval_notes?: string

  // 共享字段
  position: string
  department?: string
  start_date: string
  status: 'pending' | 'in_progress' | 'completed'

  created_at: string
  updated_at: string
}

/**
 * 培训记录（双线）
 */
export interface TrainingRecord {
  id: string
  tenant_id: string

  // 员工线字段
  employee_id: string
  employee_name: string
  course_progress: number
  study_hours: number
  test_score?: number
  test_submitted_time?: string
  certification_applied: boolean
  certification_applied_time?: string

  // 管理线字段
  trainer_id?: string
  trainer_name?: string
  course_publisher?: string
  test_evaluator?: string
  test_evaluated_time?: string
  cert_approver?: string
  course_published: boolean
  course_published_time?: string
  test_evaluated: boolean
  cert_approved: boolean
  cert_approved_time?: string
  evaluation_notes?: string

  // 共享字段
  course_name: string
  course_type?: 'theory' | 'practical' | 'mixed'
  course_duration?: number
  passing_score: number
  status: 'not_started' | 'in_progress' | 'completed' | 'failed'

  created_at: string
  updated_at: string
}

/**
 * 试用期评估（双线）
 */
export interface ProbationReview {
  id: string
  tenant_id: string

  // 员工线字段
  employee_id: string
  employee_name: string
  self_assessment?: string
  improvement_actions?: string
  result_viewed: boolean
  result_viewed_time?: string

  // 管理线字段
  reviewer_id?: string
  reviewer_name?: string
  daily_score?: number
  work_quality_score?: number
  work_efficiency_score?: number
  team_cooperation_score?: number
  learning_ability_score?: number
  management_assessment?: string
  improvement_suggestions?: string
  result_published: boolean
  result_published_time?: string
  conversion_decision?: 'approved' | 'rejected' | 'extended'
  conversion_decision_time?: string

  // 共享字段
  review_date: string
  review_type: 'daily' | 'weekly' | 'monthly' | 'final'
  status: 'pending' | 'completed'

  created_at: string
  updated_at: string
}

// ============================================
// 在职旅程类型
// ============================================

/**
 * 排班记录（双线）
 */
export interface ShiftSchedule {
  id: string
  tenant_id: string

  // 员工线字段
  employee_id: string
  employee_name: string
  shift_viewed: boolean
  shift_viewed_time?: string
  check_in_time?: string
  check_out_time?: string
  attendance_record?: 'on_time' | 'late' | 'early_leave' | 'absent'
  swap_applied: boolean
  swap_reason?: string
  swap_target_employee_id?: string

  // 管理线字段
  scheduler_id?: string
  scheduler_name?: string
  schedule_published: boolean
  schedule_published_time?: string
  attendance_monitor?: string
  swap_approver?: string
  swap_approved?: boolean
  swap_approved_time?: string
  swap_rejection_reason?: string
  attendance_notes?: string

  // 共享字段
  shift_date: string
  shift_type: 'morning' | 'afternoon' | 'evening' | 'night'
  start_time: string
  end_time: string
  location?: string
  status: 'scheduled' | 'completed' | 'cancelled'

  created_at: string
  updated_at: string
}

/**
 * 工作日志（双线）
 */
export interface WorkLog {
  id: string
  tenant_id: string

  // 员工线字段
  employee_id: string
  employee_name: string
  work_content: string
  work_hours?: number
  achievements?: string
  difficulties?: string
  tomorrow_plan?: string

  // 管理线字段
  reviewer_id?: string
  reviewer_name?: string
  review_status: 'pending' | 'reviewed'
  review_time?: string
  review_comments?: string
  review_rating?: number

  // 共享字段
  work_date: string
  status: 'draft' | 'submitted' | 'reviewed'

  created_at: string
  updated_at: string
}

/**
 * 技能认证（双线）
 */
export interface SkillCertification {
  id: string
  tenant_id: string

  // 员工线字段
  employee_id: string
  employee_name: string
  application_reason?: string
  preparation_status?: string
  certification_applied: boolean
  certification_applied_time?: string

  // 管理线字段
  evaluator_id?: string
  evaluator_name?: string
  evaluation_score?: number
  evaluation_notes?: string
  certification_approved?: boolean
  certification_approved_time?: string
  rejection_reason?: string
  development_suggestions?: string

  // 共享字段
  skill_name: string
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  certification_type?: 'internal' | 'external'
  status: 'pending' | 'approved' | 'rejected'

  created_at: string
  updated_at: string
}

/**
 * 绩效评估（双线）
 */
export interface PerformanceReview {
  id: string
  tenant_id: string

  // 员工线字段
  employee_id: string
  employee_name: string
  self_assessment?: string
  self_score?: number
  achievements?: string
  result_viewed: boolean
  result_viewed_time?: string
  improvement_plan?: string

  // 管理线字段
  evaluator_id?: string
  evaluator_name?: string
  management_assessment?: string
  management_score?: number
  work_quality_score?: number
  work_efficiency_score?: number
  team_contribution_score?: number
  innovation_score?: number
  result_published: boolean
  result_published_time?: string
  feedback_provided: boolean
  salary_adjustment?: number
  bonus_amount?: number

  // 共享字段
  review_period: string
  review_type?: 'monthly' | 'quarterly' | 'annual'
  final_score?: number
  status: 'pending' | 'completed'

  created_at: string
  updated_at: string
}

// ============================================
// 离职旅程类型
// ============================================

/**
 * 离职申请（双线）
 */
export interface ResignationRequest {
  id: string
  tenant_id: string

  // 员工线字段
  employee_id: string
  employee_name: string
  resignation_reason: string
  resignation_type: 'personal' | 'family' | 'career' | 'salary' | 'environment' | 'other'
  detailed_reason?: string
  expected_date: string
  handover_plan?: string
  handover_completed: boolean
  exit_confirmed: boolean

  // 管理线字段
  hr_processor?: string
  hr_processor_name?: string
  resignation_approver?: string
  approver_name?: string
  interview_scheduled: boolean
  interview_time?: string
  interview_notes?: string
  retention_attempt?: string
  resignation_approved?: boolean
  approval_time?: string
  rejection_reason?: string
  handover_verifier?: string
  handover_verified: boolean
  handover_verified_time?: string
  exit_processor?: string
  exit_processed: boolean
  exit_processed_time?: string

  // 共享字段
  actual_date?: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'

  created_at: string
  updated_at: string
}

/**
 * 工作交接（双线）
 */
export interface HandoverTask {
  id: string
  tenant_id: string
  resignation_id?: string

  // 员工线字段
  employee_id: string
  employee_name: string
  task_description: string
  handover_documents?: string
  training_completed: boolean
  training_notes?: string
  employee_confirmed: boolean
  employee_confirmed_time?: string

  // 管理线字段
  successor_id?: string
  successor_name?: string
  verifier_id?: string
  verifier_name?: string
  quality_check: boolean
  quality_score?: number
  verification_notes?: string
  manager_confirmed: boolean
  manager_confirmed_time?: string

  // 共享字段
  task_category: 'work_content' | 'client_relationship' | 'documents' | 'knowledge'
  priority: 'high' | 'medium' | 'low'
  deadline?: string
  status: 'pending' | 'in_progress' | 'completed'

  created_at: string
  updated_at: string
}

/**
 * 离职手续（双线）
 */
export interface ExitProcedure {
  id: string
  tenant_id: string
  resignation_id?: string

  // 员工线字段
  employee_id: string
  employee_name: string
  assets_returned: boolean
  assets_return_time?: string
  settlement_confirmed: boolean
  certificate_received: boolean
  certificate_received_time?: string
  social_security_transferred: boolean

  // 管理线字段
  processor_id?: string
  processor_name?: string
  assets_verified: boolean
  assets_verification_time?: string
  assets_notes?: string
  settlement_calculated: boolean
  settlement_amount?: number
  settlement_paid: boolean
  settlement_paid_time?: string
  certificate_issued: boolean
  certificate_issued_time?: string
  social_security_processed: boolean
  social_security_processed_time?: string

  // 共享字段
  procedure_type: 'assets' | 'settlement' | 'certificate' | 'social_security'
  status: 'pending' | 'completed'

  created_at: string
  updated_at: string
}

/**
 * 校友记录（双线）
 */
export interface AlumniRecord {
  id: string
  tenant_id: string

  // 员工线字段
  employee_id: string
  employee_name: string
  contact_phone?: string
  contact_email?: string
  contact_wechat?: string
  current_company?: string
  current_position?: string
  willing_to_return: boolean
  interested_positions?: string

  // 管理线字段
  relationship_manager?: string
  manager_name?: string
  alumni_status: 'active' | 'inactive'
  last_contact_time?: string
  contact_frequency?: 'monthly' | 'quarterly' | 'yearly'
  rehire_potential?: 'high' | 'medium' | 'low'
  rehire_notes?: string
  alumni_value_rating?: number

  // 共享字段
  departure_date?: string
  departure_reason?: string
  work_duration?: number
  status: 'active' | 'inactive'

  created_at: string
  updated_at: string
}
