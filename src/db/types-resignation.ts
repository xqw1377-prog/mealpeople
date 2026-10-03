// 离职管理类型定义

// ==================== 离职申请 ====================

/**
 * 离职类型
 */
export type ResignationType =
  | 'voluntary' // 主动离职
  | 'involuntary' // 被动离职
  | 'retirement' // 退休
  | 'contract_end' // 合同到期

/**
 * 离职原因
 */
export type ResignationReason =
  | 'personal' // 个人原因
  | 'family' // 家庭原因
  | 'health' // 健康原因
  | 'career' // 职业发展
  | 'salary' // 薪资待遇
  | 'location' // 工作地点
  | 'culture' // 企业文化
  | 'management' // 管理问题
  | 'other' // 其他原因

/**
 * 离职申请状态
 */
export type ResignationApplicationStatus =
  | 'pending' // 待审批
  | 'approved' // 已通过
  | 'rejected' // 已拒绝
  | 'in_progress' // 进行中
  | 'completed' // 已完成
  | 'withdrawn' // 已撤回

/**
 * 离职申请表
 */
export interface ResignationApplication {
  id: string
  tenant_id: string
  employee_id: string
  resignation_type: ResignationType
  resignation_reason: ResignationReason
  resignation_reason_detail: string | null
  expected_last_day: string
  actual_last_day: string | null
  notice_period: number
  status: ResignationApplicationStatus
  submitted_at: string
  approved_at: string | null
  rejected_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 离职审批 ====================

/**
 * 审批状态
 */
export type ResignationApprovalStatus =
  | 'pending' // 待审批
  | 'approved' // 已通过
  | 'rejected' // 已拒绝
  | 'skipped' // 已跳过

/**
 * 审批人角色
 */
export type ResignationApproverRole = '直属上级' | '部门经理' | 'HR经理' | '总经理' | '其他'

/**
 * 离职审批表
 */
export interface ResignationApproval {
  id: string
  tenant_id: string
  application_id: string
  approver_id: string
  approver_role: ResignationApproverRole
  approval_level: number
  status: ResignationApprovalStatus
  approved_at: string | null
  rejected_at: string | null
  comments: string | null
  created_at: string
}

// ==================== 工作交接 ====================

/**
 * 交接类型
 */
export type HandoverType =
  | 'work' // 工作任务
  | 'project' // 项目交接
  | 'document' // 文档资料
  | 'equipment' // 设备物品
  | 'account' // 账号权限
  | 'client' // 客户关系
  | 'knowledge' // 知识经验

/**
 * 交接状态
 */
export type HandoverStatus =
  | 'pending' // 待交接
  | 'in_progress' // 交接中
  | 'completed' // 已完成
  | 'confirmed' // 已确认

/**
 * 工作交接表
 */
export interface ResignationHandover {
  id: string
  tenant_id: string
  application_id: string
  handover_type: HandoverType
  handover_item: string
  handover_description: string | null
  handover_to_id: string | null
  status: HandoverStatus
  started_at: string | null
  completed_at: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 离职手续 ====================

/**
 * 手续类型
 */
export type ProcedureType =
  | 'certificate' // 离职证明
  | 'salary' // 工资结算
  | 'social_security' // 社保转移
  | 'provident_fund' // 公积金转移
  | 'archive' // 档案转移
  | 'equipment' // 设备归还
  | 'access' // 权限注销
  | 'other' // 其他手续

/**
 * 手续状态
 */
export type ProcedureStatus =
  | 'pending' // 待办理
  | 'in_progress' // 办理中
  | 'completed' // 已完成

/**
 * 离职手续表
 */
export interface ResignationProcedure {
  id: string
  tenant_id: string
  application_id: string
  procedure_type: ProcedureType
  procedure_name: string
  procedure_description: string | null
  responsible_department: string
  responsible_person_id: string | null
  status: ProcedureStatus
  started_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 离职面谈 ====================

/**
 * 面谈类型
 */
export type InterviewType =
  | 'initial' // 初次面谈
  | 'follow_up' // 跟进面谈
  | 'final' // 最终面谈

/**
 * 挽留结果
 */
export type RetentionResult =
  | 'successful' // 挽留成功
  | 'failed' // 挽留失败
  | 'not_attempted' // 未尝试挽留

/**
 * 离职面谈表
 */
export interface ResignationInterview {
  id: string
  tenant_id: string
  application_id: string
  interview_date: string
  interviewer_id: string
  interview_type: InterviewType
  resignation_reason_confirmed: string | null
  satisfaction_score: number | null
  work_environment_score: number | null
  management_score: number | null
  salary_score: number | null
  career_development_score: number | null
  team_atmosphere_score: number | null
  strengths: string | null
  weaknesses: string | null
  suggestions: string | null
  retention_attempted: boolean
  retention_result: RetentionResult | null
  notes: string | null
  created_at: string
  updated_at: string
}

// ==================== 组合类型 ====================

/**
 * 离职申请详情（包含所有关联数据）
 */
export interface ResignationApplicationDetail {
  application: ResignationApplication
  employee: {
    id: string
    name: string
    position: string
    department: string
    hire_date: string
  }
  approvals: ResignationApproval[]
  handovers: ResignationHandover[]
  procedures: ResignationProcedure[]
  interviews: ResignationInterview[]
}

/**
 * 离职审批详情（包含关联数据）
 */
export interface ResignationApprovalDetail extends ResignationApproval {
  application?: ResignationApplication
  approver?: {
    id: string
    name: string
    position: string
  }
}

/**
 * 工作交接详情（包含关联数据）
 */
export interface ResignationHandoverDetail extends ResignationHandover {
  handover_to?: {
    id: string
    name: string
    position: string
  }
}

/**
 * 离职手续详情（包含关联数据）
 */
export interface ResignationProcedureDetail extends ResignationProcedure {
  responsible_person?: {
    id: string
    name: string
  }
}

/**
 * 离职面谈详情（包含关联数据）
 */
export interface ResignationInterviewDetail extends ResignationInterview {
  interviewer?: {
    id: string
    name: string
  }
}

// ==================== 统计类型 ====================

/**
 * 离职统计
 */
export interface ResignationStatistics {
  total: number
  by_type: Record<ResignationType, number>
  by_reason: Record<ResignationReason, number>
  by_department: Record<string, number>
  by_position: Record<string, number>
  by_month: Record<string, number>
  turnover_rate: number
}

/**
 * 离职趋势
 */
export interface ResignationTrend {
  month: string
  total: number
  voluntary: number
  involuntary: number
  turnover_rate: number
}

/**
 * 部门离职统计
 */
export interface DepartmentResignationStatistics {
  department: string
  total_employees: number
  resignations: number
  turnover_rate: number
}

/**
 * 离职原因分析
 */
export interface ResignationReasonAnalysis {
  reason: ResignationReason
  count: number
  percentage: number
  average_satisfaction_score: number
}

/**
 * 离职面谈统计
 */
export interface ResignationInterviewStatistics {
  total: number
  average_satisfaction_score: number
  average_work_environment_score: number
  average_management_score: number
  average_salary_score: number
  average_career_development_score: number
  average_team_atmosphere_score: number
  retention_attempted: number
  retention_successful: number
  retention_success_rate: number
}

// ==================== 常量定义 ====================

/**
 * 离职类型名称
 */
export const RESIGNATION_TYPE_NAMES: Record<ResignationType, string> = {
  voluntary: '主动离职',
  involuntary: '被动离职',
  retirement: '退休',
  contract_end: '合同到期'
}

/**
 * 离职原因名称
 */
export const RESIGNATION_REASON_NAMES: Record<ResignationReason, string> = {
  personal: '个人原因',
  family: '家庭原因',
  health: '健康原因',
  career: '职业发展',
  salary: '薪资待遇',
  location: '工作地点',
  culture: '企业文化',
  management: '管理问题',
  other: '其他原因'
}

/**
 * 离职申请状态名称
 */
export const RESIGNATION_APPLICATION_STATUS_NAMES: Record<ResignationApplicationStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  in_progress: '进行中',
  completed: '已完成',
  withdrawn: '已撤回'
}

/**
 * 离职申请状态颜色
 */
export const RESIGNATION_APPLICATION_STATUS_COLORS: Record<ResignationApplicationStatus, string> = {
  pending: 'text-orange-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  in_progress: 'text-blue-600',
  completed: 'text-gray-600',
  withdrawn: 'text-gray-600'
}

/**
 * 离职审批状态名称
 */
export const RESIGNATION_APPROVAL_STATUS_NAMES: Record<ResignationApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝',
  skipped: '已跳过'
}

/**
 * 离职审批状态颜色
 */
export const RESIGNATION_APPROVAL_STATUS_COLORS: Record<ResignationApprovalStatus, string> = {
  pending: 'text-orange-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  skipped: 'text-gray-600'
}

/**
 * 交接类型名称
 */
export const HANDOVER_TYPE_NAMES: Record<HandoverType, string> = {
  work: '工作任务',
  project: '项目交接',
  document: '文档资料',
  equipment: '设备物品',
  account: '账号权限',
  client: '客户关系',
  knowledge: '知识经验'
}

/**
 * 交接状态名称
 */
export const HANDOVER_STATUS_NAMES: Record<HandoverStatus, string> = {
  pending: '待交接',
  in_progress: '交接中',
  completed: '已完成',
  confirmed: '已确认'
}

/**
 * 交接状态颜色
 */
export const HANDOVER_STATUS_COLORS: Record<HandoverStatus, string> = {
  pending: 'text-orange-600',
  in_progress: 'text-blue-600',
  completed: 'text-green-600',
  confirmed: 'text-green-600'
}

/**
 * 手续类型名称
 */
export const PROCEDURE_TYPE_NAMES: Record<ProcedureType, string> = {
  certificate: '离职证明',
  salary: '工资结算',
  social_security: '社保转移',
  provident_fund: '公积金转移',
  archive: '档案转移',
  equipment: '设备归还',
  access: '权限注销',
  other: '其他手续'
}

/**
 * 手续状态名称
 */
export const PROCEDURE_STATUS_NAMES: Record<ProcedureStatus, string> = {
  pending: '待办理',
  in_progress: '办理中',
  completed: '已完成'
}

/**
 * 手续状态颜色
 */
export const PROCEDURE_STATUS_COLORS: Record<ProcedureStatus, string> = {
  pending: 'text-orange-600',
  in_progress: 'text-blue-600',
  completed: 'text-green-600'
}

/**
 * 面谈类型名称
 */
export const INTERVIEW_TYPE_NAMES: Record<InterviewType, string> = {
  initial: '初次面谈',
  follow_up: '跟进面谈',
  final: '最终面谈'
}

/**
 * 挽留结果名称
 */
export const RETENTION_RESULT_NAMES: Record<RetentionResult, string> = {
  successful: '挽留成功',
  failed: '挽留失败',
  not_attempted: '未尝试挽留'
}

/**
 * 挽留结果颜色
 */
export const RETENTION_RESULT_COLORS: Record<RetentionResult, string> = {
  successful: 'text-green-600',
  failed: 'text-red-600',
  not_attempted: 'text-gray-600'
}
