/**
 * 员工中心相关类型定义
 */

// ============================================
// 枚举类型
// ============================================

/**
 * 性别
 */
export type GenderType = 'male' | 'female' | 'other'

/**
 * 用工类型
 */
export type EmploymentType = 'full_time' | 'part_time' | 'intern' | 'contract'

/**
 * 员工状态
 */
export type EmployeeStatus = 'active' | 'on_leave' | 'resigned' | 'terminated'

/**
 * 备注类型
 */
export type NoteType = 'general' | 'performance' | 'discipline' | 'other'

// ============================================
// 数据库表类型
// ============================================

/**
 * 员工档案（基于现有employees表）
 */
export interface Employee {
  id: string
  tenant_id?: string
  store_id?: string
  user_id?: string
  name: string
  phone?: string
  employee_type?: string
  position?: string
  status?: string
  department?: string
  monthly_salary?: number
  daily_work_hours?: number
  is_core_position?: boolean
  position_fixed_backup?: boolean
  can_backup_positions?: string[]
  rest_days_per_month?: number
  brand_id?: string
  created_at: string
  updated_at: string
}

/**
 * 员工标签
 */
export interface EmployeeTag {
  id: string
  employee_id: string
  tag_name: string
  tag_color: string
  created_at: string
}

/**
 * 员工备注
 */
export interface EmployeeNote {
  id: string
  employee_id: string
  note_content: string
  note_type: NoteType
  created_by: string
  created_at: string
}

// ============================================
// 业务类型
// ============================================

/**
 * 员工详细信息（包含标签和备注）
 */
export interface EmployeeDetail extends Employee {
  tags?: EmployeeTag[]
  notes?: EmployeeNote[]
  creator_name?: string
}

/**
 * 员工统计数据
 */
export interface EmployeeStats {
  total: number
  active: number
  on_leave: number
  resigned: number
  by_department: Record<string, number>
  by_position: Record<string, number>
  by_employment_type: Record<string, number>
  new_this_month: number
  resigned_this_month: number
}

/**
 * 员工筛选条件
 */
export interface EmployeeFilter {
  department?: string
  position?: string
  status?: string
  employment_type?: string
  search?: string
}

/**
 * 员工列表响应
 */
export interface EmployeeListResponse {
  employees: EmployeeDetail[]
  total: number
  stats: EmployeeStats
}
