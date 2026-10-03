/**
 * 岗位模块化配置
 *
 * 设计理念：
 * - 移动端：以工作效率、协同、便捷为主线，关注员工日常工作场景
 * - WEB端：以人力资源管理为主线，关注HR管理和数据分析
 */

// 模块定义
export interface ModuleConfig {
  id: string
  name: string
  icon: string
  path: string
  platform: 'mobile' | 'web' | 'both' // 平台类型
  description: string
  category: 'efficiency' | 'collaboration' | 'management' | 'personal' // 模块分类
}

// 角色定义
export type UserRole = 'admin' | 'hr' | 'manager' | 'employee'

// 所有可用模块
export const ALL_MODULES: ModuleConfig[] = [
  // ==================== 移动端模块：工作效率优先 ====================
  {
    id: 'workspace',
    name: '今日工作',
    icon: 'i-mdi-briefcase-check',
    path: '/packageA/pages/employee-workspace/index',
    platform: 'mobile',
    category: 'efficiency',
    description: '今日任务、待办事项、工作进度、快捷操作'
  },
  {
    id: 'my-schedule',
    name: '我的班次',
    icon: 'i-mdi-calendar-today',
    path: '/packageG/pages/my-schedule/index',
    platform: 'mobile',
    category: 'efficiency',
    description: '今日班次、本周排班、换班申请、考勤打卡'
  },
  {
    id: 'work-logs',
    name: '工作记录',
    icon: 'i-mdi-notebook-edit',
    path: '/pages/work-logs/index',
    platform: 'mobile',
    category: 'efficiency',
    description: '快速记录工作内容、工作成果、问题反馈'
  },
  {
    id: 'quick-actions',
    name: '快捷操作',
    icon: 'i-mdi-lightning-bolt',
    path: '/pages/quick-actions/index',
    platform: 'mobile',
    category: 'efficiency',
    description: '常用操作、一键完成、效率工具'
  },

  // ==================== 移动端模块：团队协同 ====================
  {
    id: 'team-collaboration',
    name: '团队协作',
    icon: 'i-mdi-account-multiple',
    path: '/pages/team-collaboration/index',
    platform: 'mobile',
    category: 'collaboration',
    description: '团队成员、工作交接、协作任务、团队动态'
  },
  {
    id: 'shift-handover',
    name: '交接班',
    icon: 'i-mdi-swap-horizontal',
    path: '/pages/shift-handover/index',
    platform: 'mobile',
    category: 'collaboration',
    description: '交接事项、待办提醒、工作交接记录'
  },
  {
    id: 'team-messages',
    name: '团队消息',
    icon: 'i-mdi-message-text',
    path: '/pages/team-messages/index',
    platform: 'mobile',
    category: 'collaboration',
    description: '团队通知、工作提醒、协作消息'
  },
  {
    id: 'help-request',
    name: '求助协助',
    icon: 'i-mdi-hand-heart',
    path: '/pages/help-request/index',
    platform: 'mobile',
    category: 'collaboration',
    description: '发起求助、响应协助、互帮互助'
  },

  // ==================== 移动端模块：个人成长 ====================
  {
    id: 'my-growth',
    name: '我的成长',
    icon: 'i-mdi-chart-line-variant',
    path: '/pages/my-growth/index',
    platform: 'mobile',
    category: 'personal',
    description: '工作成果、技能提升、成长轨迹'
  },
  {
    id: 'my-performance',
    name: '我的绩效',
    icon: 'i-mdi-trophy',
    path: '/packageF/pages/my-performance/index',
    platform: 'mobile',
    category: 'personal',
    description: '绩效数据、工作评价、奖励记录'
  },

  // ==================== WEB端模块：HR管理功能 ====================
  {
    id: 'recruitment',
    name: '招聘管理',
    icon: 'i-mdi-account-search',
    path: '/packageJ/pages/recruitment/index',
    platform: 'web',
    category: 'management',
    description: '职位发布、候选人管理、面试安排'
  },
  {
    id: 'onboarding',
    name: '入职管理',
    icon: 'i-mdi-account-plus',
    path: '/packageH/pages/onboarding/index',
    platform: 'web',
    category: 'management',
    description: '入职流程、入职任务、入职统计'
  },
  {
    id: 'resignation',
    name: '离职管理',
    icon: 'i-mdi-account-minus',
    path: '/pages/resignation/index',
    platform: 'web',
    category: 'management',
    description: '离职申请、离职流程、离职面谈'
  },
  {
    id: 'employee-hub',
    name: '员工档案',
    icon: 'i-mdi-account-multiple',
    path: '/pages/employee-hub/index',
    platform: 'web',
    category: 'management',
    description: '员工档案、员工信息、员工统计'
  },
  {
    id: 'scheduling-management',
    name: '排班管理',
    icon: 'i-mdi-calendar-clock',
    path: '/packageB/pages/scheduling/index',
    platform: 'web',
    category: 'management',
    description: '排班规划、班次配置、排班统计'
  },
  {
    id: 'data-analysis',
    name: '数据分析',
    icon: 'i-mdi-chart-bar',
    path: '/pages/data-analysis/index',
    platform: 'web',
    category: 'management',
    description: '人力数据、成本分析、效能分析'
  },

  // ==================== 双平台模块 ====================
  {
    id: 'profile',
    name: '个人中心',
    icon: 'i-mdi-account-circle',
    path: '/pages/profile/index',
    platform: 'both',
    category: 'personal',
    description: '个人信息、系统设置、帮助中心'
  }
]

// 角色模块配置
export const ROLE_MODULES: Record<UserRole, string[]> = {
  // 管理员：全部权限
  admin: [
    // 移动端：工作效率
    'workspace',
    'my-schedule',
    'work-logs',
    'quick-actions',
    // 移动端：团队协同
    'team-collaboration',
    'shift-handover',
    'team-messages',
    'help-request',
    // 移动端：个人成长
    'my-growth',
    'my-performance',
    // WEB端：HR管理
    'recruitment',
    'onboarding',
    'resignation',
    'employee-hub',
    'scheduling-management',
    'data-analysis',
    // 双平台
    'profile'
  ],

  // HR：HR管理功能（WEB端）+ 基础移动端功能
  hr: [
    // 移动端：基础工作
    'workspace',
    'my-schedule',
    'work-logs',
    'team-messages',
    // WEB端：HR管理
    'recruitment',
    'onboarding',
    'resignation',
    'employee-hub',
    'scheduling-management',
    'data-analysis',
    // 双平台
    'profile'
  ],

  // 管理者：团队协同功能（移动端为主）
  manager: [
    // 移动端：工作效率
    'workspace',
    'my-schedule',
    'work-logs',
    'quick-actions',
    // 移动端：团队协同
    'team-collaboration',
    'shift-handover',
    'team-messages',
    'help-request',
    // 移动端：个人成长
    'my-growth',
    'my-performance',
    // 双平台
    'profile'
  ],

  // 员工：工作效率和协同功能（移动端）
  employee: [
    // 移动端：工作效率
    'workspace',
    'my-schedule',
    'work-logs',
    'quick-actions',
    // 移动端：团队协同
    'team-collaboration',
    'shift-handover',
    'team-messages',
    'help-request',
    // 移动端：个人成长
    'my-growth',
    'my-performance',
    // 双平台
    'profile'
  ]
}

// 获取用户可访问的模块
export function getUserModules(role: UserRole, platform: 'mobile' | 'web' = 'mobile'): ModuleConfig[] {
  const moduleIds = ROLE_MODULES[role] || []
  return ALL_MODULES.filter(
    (module) => moduleIds.includes(module.id) && (module.platform === platform || module.platform === 'both')
  )
}

// 检查用户是否有权限访问某个模块
export function hasModuleAccess(role: UserRole, moduleId: string): boolean {
  const moduleIds = ROLE_MODULES[role] || []
  return moduleIds.includes(moduleId)
}

// 获取模块信息
export function getModuleById(moduleId: string): ModuleConfig | undefined {
  return ALL_MODULES.find((module) => module.id === moduleId)
}

// 按平台分组模块
export function getModulesByPlatform(role: UserRole): {
  mobile: ModuleConfig[]
  web: ModuleConfig[]
  both: ModuleConfig[]
} {
  const userModules = ROLE_MODULES[role] || []
  return {
    mobile: ALL_MODULES.filter((m) => m.platform === 'mobile' && userModules.includes(m.id)),
    web: ALL_MODULES.filter((m) => m.platform === 'web' && userModules.includes(m.id)),
    both: ALL_MODULES.filter((m) => m.platform === 'both' && userModules.includes(m.id))
  }
}

// 按分类分组模块
export function getModulesByCategory(
  role: UserRole,
  platform: 'mobile' | 'web' = 'mobile'
): {
  efficiency: ModuleConfig[]
  collaboration: ModuleConfig[]
  management: ModuleConfig[]
  personal: ModuleConfig[]
} {
  const modules = getUserModules(role, platform)
  return {
    efficiency: modules.filter((m) => m.category === 'efficiency'),
    collaboration: modules.filter((m) => m.category === 'collaboration'),
    management: modules.filter((m) => m.category === 'management'),
    personal: modules.filter((m) => m.category === 'personal')
  }
}
