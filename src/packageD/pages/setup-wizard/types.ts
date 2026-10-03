// 引导式设置的类型定义

export interface BrandInfo {
  name: string
  industry: string
  description?: string
  contact?: string
}

export interface StoreInfo {
  id?: string
  name: string
  address: string
  business_hours?: string
  phone?: string
}

export interface StaffInfo {
  id?: string
  name: string
  position: string
  store_id: string
  base_salary: number
  phone?: string
}

export interface ScheduleConfig {
  high_efficiency_min: number
  high_efficiency_max: number
  standard_efficiency_min: number
  standard_efficiency_max: number
  low_efficiency_min: number
  low_efficiency_max: number
  daily_work_hours: number
  weekly_work_hours: number
  target_cost_rate: number
  warning_threshold?: number
}

export interface SetupWizardState {
  currentStep: number
  completedSteps: number[]
  brandInfo: BrandInfo | null
  stores: StoreInfo[]
  staff: StaffInfo[]
  scheduleConfig: ScheduleConfig | null
}
