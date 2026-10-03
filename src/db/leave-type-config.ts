/**
 * 休假类型配置 - 三易原则优化
 * 容易学：直观的图标和颜色
 * 容易做：快速识别和选择
 * 容易管理：统一的配置管理
 */

export interface LeaveTypeConfig {
  code: string // 数据库存储的代码
  name: string // 中文名称
  icon: string // MDI图标类名
  color: string // 主题色
  bgColor: string // 背景色
  description: string // 说明
  isPaid: boolean // 是否带薪
  maxDays?: number // 最大天数（可选）
  needsProof?: boolean // 是否需要证明（可选）
  tips?: string // 使用提示（可选）
}

/**
 * 休假类型配置表
 * 按使用频率排序，最常用的在前面
 */
export const LEAVE_TYPE_CONFIGS: LeaveTypeConfig[] = [
  {
    code: 'annual_leave',
    name: '年假',
    icon: 'i-mdi-beach',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: '带薪年假，用于休息和旅游',
    isPaid: true,
    tips: '建议提前3天申请，方便安排工作交接'
  },
  {
    code: 'sick_leave',
    name: '病假',
    icon: 'i-mdi-hospital-box',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: '因病需要休息治疗',
    isPaid: true,
    needsProof: true,
    tips: '超过3天需提供医院证明'
  },
  {
    code: 'personal_leave',
    name: '事假',
    icon: 'i-mdi-account-clock',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: '因私事需要请假',
    isPaid: false,
    tips: '事假不带薪，请合理安排'
  },
  {
    code: 'other',
    name: '其他',
    icon: 'i-mdi-dots-horizontal',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: '其他特殊情况',
    isPaid: false,
    tips: '请在申请理由中详细说明'
  }
]

/**
 * 根据代码获取配置
 */
export function getLeaveTypeConfig(code: string): LeaveTypeConfig | undefined {
  return LEAVE_TYPE_CONFIGS.find((config) => config.code === code)
}

/**
 * 获取休假类型选项（用于选择器）
 */
export interface LeaveTypeOption {
  value: string
  label: string
  icon: string
  color: string
  description: string
  isPaid: boolean
}

export function getLeaveTypeOptions(): LeaveTypeOption[] {
  return LEAVE_TYPE_CONFIGS.map((config) => ({
    value: config.code,
    label: config.name,
    icon: config.icon,
    color: config.color,
    description: config.description,
    isPaid: config.isPaid
  }))
}

/**
 * 日期快捷选择配置
 * 容易做：提供常用日期选项
 */
export interface DateShortcut {
  label: string
  getValue: () => {startDate: string; endDate: string; days: number}
}

export const DATE_SHORTCUTS: DateShortcut[] = [
  {
    label: '今天',
    getValue: () => {
      const today = new Date()
      const dateStr = today.toISOString().split('T')[0]
      return {startDate: dateStr, endDate: dateStr, days: 1}
    }
  },
  {
    label: '明天',
    getValue: () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateStr = tomorrow.toISOString().split('T')[0]
      return {startDate: dateStr, endDate: dateStr, days: 1}
    }
  },
  {
    label: '后天',
    getValue: () => {
      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      const dateStr = dayAfterTomorrow.toISOString().split('T')[0]
      return {startDate: dateStr, endDate: dateStr, days: 1}
    }
  },
  {
    label: '本周剩余',
    getValue: () => {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const daysUntilFriday = dayOfWeek === 0 ? 5 : 5 - dayOfWeek

      const startDate = new Date(today)
      startDate.setDate(today.getDate() + 1)

      const endDate = new Date(today)
      endDate.setDate(today.getDate() + daysUntilFriday)

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: daysUntilFriday
      }
    }
  },
  {
    label: '下周',
    getValue: () => {
      const today = new Date()
      const dayOfWeek = today.getDay()
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek

      const startDate = new Date(today)
      startDate.setDate(today.getDate() + daysUntilMonday)

      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 4) // 周一到周五

      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: 5
      }
    }
  }
]

/**
 * 审批意见模板
 * 容易做：提供常用审批意见
 */
export const APPROVAL_TEMPLATES = {
  approve: ['同意', '批准，注意工作交接', '同意，祝早日康复', '批准，注意安全', '同意，按时返岗'],
  reject: ['当前工作繁忙，建议延期', '人员紧张，暂不批准', '请提供相关证明材料', '请重新选择日期', '请先完成手头工作']
}

/**
 * 请假状态配置
 * 容易学：直观的状态显示
 */
export interface LeaveStatusConfig {
  code: string
  name: string
  icon: string
  color: string
  bgColor: string
  description: string
}

export const LEAVE_STATUS_CONFIGS: Record<string, LeaveStatusConfig> = {
  pending: {
    code: 'pending',
    name: '待审批',
    icon: 'i-mdi-clock-outline',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: '等待管理员审批'
  },
  approved: {
    code: 'approved',
    name: '已批准',
    icon: 'i-mdi-check-circle',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    description: '申请已通过'
  },
  rejected: {
    code: 'rejected',
    name: '已拒绝',
    icon: 'i-mdi-close-circle',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: '申请未通过'
  },
  cancelled: {
    code: 'cancelled',
    name: '已取消',
    icon: 'i-mdi-cancel',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    description: '申请已取消'
  }
}

/**
 * 获取状态配置
 */
export function getLeaveStatusConfig(code: string): LeaveStatusConfig {
  return LEAVE_STATUS_CONFIGS[code] || LEAVE_STATUS_CONFIGS.pending
}

/**
 * 计算工作日天数（排除周末）
 * 容易做：智能计算
 */
export function calculateWorkDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)

  let workDays = 0
  const current = new Date(start)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    // 排除周六(6)和周日(0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDays++
    }
    current.setDate(current.getDate() + 1)
  }

  return workDays
}

/**
 * 计算自然日天数
 */
export function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1 // 包含起始日
}

/**
 * 格式化日期显示
 * 容易学：友好的日期格式
 */
export function formatDateFriendly(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  // 重置时间部分用于比较
  today.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)

  if (date.getTime() === today.getTime()) {
    return '今天'
  } else if (date.getTime() === tomorrow.getTime()) {
    return '明天'
  } else {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
    return `${month}月${day}日 ${weekDay}`
  }
}

/**
 * 验证日期范围
 * 容易做：智能验证和提示
 */
export interface DateValidationResult {
  valid: boolean
  message?: string
  warning?: string
}

export function validateDateRange(startDate: string, endDate: string): DateValidationResult {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 检查日期顺序
  if (start > end) {
    return {
      valid: false,
      message: '开始日期不能晚于结束日期'
    }
  }

  // 检查是否是过去的日期
  if (end < today) {
    return {
      valid: false,
      message: '不能申请过去的日期'
    }
  }

  // 检查是否太远的未来
  const maxFutureDays = 90 // 最多提前90天
  const maxFutureDate = new Date(today)
  maxFutureDate.setDate(today.getDate() + maxFutureDays)

  if (start > maxFutureDate) {
    return {
      valid: false,
      message: `最多只能提前${maxFutureDays}天申请`
    }
  }

  // 检查天数是否过长
  const days = calculateDays(startDate, endDate)
  if (days > 30) {
    return {
      valid: false,
      message: '单次请假不能超过30天'
    }
  }

  // 提供友好提示
  if (start.getTime() === today.getTime()) {
    return {
      valid: true,
      warning: '当天请假建议提前通知主管'
    }
  }

  const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntilStart < 3 && days >= 3) {
    return {
      valid: true,
      warning: '请假3天以上建议提前3天申请'
    }
  }

  return {valid: true}
}
