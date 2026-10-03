/**
 * 部门管理相关类型定义
 */

// 部门状态
export type DepartmentStatus = 'active' | 'inactive'

// 部门基础信息
export interface Department {
  id: string
  tenant_id: string
  name: string
  code?: string
  parent_id?: string
  manager_id?: string
  description?: string
  status: DepartmentStatus
  sort_order: number
  created_at: string
  updated_at: string
}

// 部门详情（包含关联信息）
export interface DepartmentWithDetails extends Department {
  parent_name?: string
  manager_name?: string
  employee_count?: number
  children?: DepartmentWithDetails[]
}

// 部门树节点
export interface DepartmentTreeNode {
  id: string
  name: string
  code?: string
  parent_id?: string
  manager_id?: string
  manager_name?: string
  employee_count: number
  children: DepartmentTreeNode[]
  level: number
}

// 部门表单数据
export interface DepartmentFormData {
  name: string
  code?: string
  parent_id?: string
  manager_id?: string
  description?: string
  status: DepartmentStatus
  sort_order: number
}

// 部门统计信息
export interface DepartmentStats {
  total_departments: number
  active_departments: number
  inactive_departments: number
  total_employees: number
  departments_with_manager: number
  departments_without_manager: number
}
