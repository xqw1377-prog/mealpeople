// Restaurant Workforce Journey OS - 页面路由配置（收敛版：245→~130 页）
// 主包只保留 TabBar/登录/核心入口，其他页面在分包；死页面已全部摘除
// 依据：LONG_TAIL_CONVERGENCE_MAP.md（KEEP 93 / MERGE 9 / REDIRECT 15 / RETIRE 115）

const pages = [
  // ==================== TabBar 页面（必须在主包）====================
  'pages/index/index', // 工作台（首页）
  'pages/work-log/index', // 工作记录
  'pages/work-log/category-settings/index', // 工作记录类别设置
  'pages/growth/index', // 我的成长
  'pages/profile/index', // 我的

  // ==================== 登录和租户（必须在主包）====================
  'pages/login/index', // 登录页
  'pages/tenant-select/index', // 租户选择
  'pages/quick-start/index', // 快速开始向导

  // ==================== 核心入口页面（保留在主包）====================
  'pages/operations/index', // 运营管理（导航页）
  'pages/employee-hub/index', // 员工中心（导航页）

  // ==================== 基础功能页面 ====================
  'pages/settings/index',
  'pages/about/index',
  'pages/help-center/index',
  'pages/user-agreement/index',
  'pages/privacy-policy/index',
  'pages/notifications/index'
]

// 分包配置
const subPackages = [
  // ==================== 分包1：员工和门店管理 ====================
  {
    root: 'packageA',
    name: 'employee-store',
    pages: [
      'pages/brand-add/index',
      'pages/brand-edit/index',
      'pages/brand-management/index',
      'pages/employee-form/index',
      'pages/employee-import/index',
      'pages/employee-list/index',
      'pages/employees/index',
      'pages/part-time-management/index',
      'pages/schedule-records/index',
      'pages/schedule-stats/index',
      'pages/temp-workers/index'
    ]
  },
  // ==================== 分包2：营收分析 + 排班管理 ====================
  {
    root: 'packageB',
    name: 'revenue-schedule',
    pages: [
      'pages/analytics/index',
      'pages/cost-control/index',
      'pages/home/index',
      'pages/revenue-detail/index',
      'pages/revenue-prediction/index',
      'pages/revenue-weekly-calendar/index',
      'pages/schedule-center/index',
      'pages/schedule-form/index',
      'pages/schedule-logs/index',
      'pages/schedule-planning/index',
      'pages/schedules/index',
      'pages/scheduling/index',
      'pages/shift-swap/index',
      'pages/swap-records/index',
      'pages/work-shifts/index'
    ]
  },
  // ==================== 分包3：配置中心 + 租户管理 ====================
  {
    root: 'packageD',
    name: 'config-admin',
    pages: [
      'pages/config-center/index',
      'pages/department-form/index',
      'pages/department-management/index',
      'pages/diagnostic/index',
      'pages/efficiency-config/index',
      'pages/meal-periods/index',
      'pages/position-management/index',
      'pages/store-management/index',
      'pages/tenant-settings/index',
      'pages/create-tenant/index',
      'pages/dashboard/index',
      'pages/invite-employee/index',
      'pages/super-admin-tenants/index',
      'pages/tenant-applications/index'
    ]
  },
  // ==================== 分包4：绩效 + Agent ====================
  {
    root: 'packageF',
    name: 'performance-agent',
    pages: [
      'pages/chain-management/index',
      'pages/risk-alerts/index',
      'pages/agent-add/index',
      'pages/agent-management/index',
      'pages/agent-workspace/index',
      'pages/my-performance/index',
      'pages/my-promotion/index',
      'pages/my-salary/index',
      'pages/my-transfer/index'
    ]
  },
  // ==================== 分包5：考勤 + 请假 ====================
  {
    root: 'packageG',
    name: 'work-attendance',
    pages: [
      'pages/leave-approval/index',
      'pages/leave-records/index',
      'pages/leave-request/index',
      'pages/work-log-ranking/index',
      'pages/my-leave/index',
      'pages/my-overtime/index',
      'pages/working/attendance/index'
    ]
  },
  // ==================== 分包6：入职离职全流程 ====================
  {
    root: 'packageH',
    name: 'hr-lifecycle',
    pages: [
      'pages/exit-interview-management/index',
      'pages/exit-procedures/index',
      'pages/handover-management/index',
      'pages/my-contract-sign/index',
      'pages/my-offboarding/index',
      'pages/my-onboarding/index',
      'pages/my-probation-conversion/index',
      'pages/offboarding-archive/index',
      'pages/offboarding-management/index',
      'pages/offboarding-statistics/index',
      'pages/onboarding-approval/index',
      'pages/onboarding-detail/index',
      'pages/onboarding-handbook/index',
      'pages/onboarding-list/index',
      'pages/onboarding-management/index',
      'pages/onboarding-process/index',
      'pages/onboarding-process-detail/index',
      'pages/onboarding-statistics/index',
      'pages/onboarding/probation-conversion/index',
      'pages/probation-conversion-approval/index',
      'pages/probation-evaluation-management/index',
      'pages/resignation-apply/index',
      'pages/resignation-approval/index',
      'pages/resignation-detail/index',
      'pages/resignation-list/index',
      'pages/resignation-management/index'
    ]
  },
  // ==================== 分包7：培训 ====================
  {
    root: 'packageJ',
    name: 'hr-operations',
    pages: [
      'pages/interview-invitation/index',
      'pages/learning-leaderboard/index',
      'pages/my-achievements/index',
      'pages/my-learning-center/index',
      'pages/my-training/index',
      'pages/onboarding-training/index',
      'pages/training-plan-management/index'
    ]
  },
  // ==================== 分包8：消息 ====================
  {
    root: 'packageN',
    name: 'tasks-messages',
    pages: [
      'pages/contact-hr/index',
      'pages/hr-message-management/index'
    ]
  }
]

export default defineAppConfig({
  pages,
  subPackages,
  tabBar: {
    color: '#999999',
    selectedColor: '#FF6600', // 爱马仕橙
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '工作台',
        iconPath: './assets/images/unselected/today-work.png',
        selectedIconPath: './assets/images/selected/today-work.png'
      },
      {
        pagePath: 'pages/work-log/index',
        text: '工作记录',
        iconPath: './assets/images/unselected/work-logs.png',
        selectedIconPath: './assets/images/selected/work-logs.png'
      },
      {
        pagePath: 'pages/growth/index',
        text: '我的成长',
        iconPath: './assets/images/unselected/my-growth.png',
        selectedIconPath: './assets/images/selected/my-growth.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/images/unselected/profile.png',
        selectedIconPath: './assets/images/selected/profile.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF6C00',
    navigationBarTitleText: '工作旅途',
    navigationBarTextStyle: 'white'
  },
  animation: true
})
