// Restaurant Workforce Journey OS（餐饮员工工作旅途操作系统）- 页面路由配置（分包优化版 - 8个分包）
// 主包只保留TabBar页面、登录页面和核心入口页面，其他页面全部移到分包

const pages = [
  // ==================== TabBar 页面（必须在主包）====================
  'pages/index/index', // 工作台（首页）
  'pages/work-log/index', // 工作记录
  'pages/work-log/add/index', // 添加工作记录
  'pages/work-log/detail/index', // 工作记录详情
  'pages/work-log/category-settings/index', // 工作记录类别设置
  'pages/growth/index', // 我的成长
  'pages/profile/index', // 我的

  // ==================== 登录和租户（必须在主包）====================
  'pages/login/index', // 登录页
  'pages/tenant-select/index', // 租户选择
  'pages/quick-start/index', // 快速开始向导

  // ==================== 核心入口页面（保留在主包）====================
  'pages/operations/index', // 运营管理（导航页）
  'pages/management/index', // 管理中心（导航页）
  'pages/employee-hub/index', // 员工中心（导航页）

  // ==================== 基础功能页面（保留在主包）====================
  'pages/settings/index', // 设置
  'pages/about/index', // 关于我们
  'pages/help-center/index', // 帮助中心
  'pages/user-agreement/index', // 用户协议
  'pages/privacy-policy/index', // 隐私政策
  'pages/notifications/index' // 通知
]

// 分包配置（优化到8个分包）
const subPackages = [
  // ==================== 分包1：员工和门店管理 ====================
  {
    root: 'packageA',
    name: 'employee-store',
    pages: [
      'pages/brand-add/index',
      'pages/brand-edit/index',
      'pages/brand-management/index',
      'pages/employee-detail/index',
      'pages/employee-form/index',
      'pages/employee-import/employee-import/index',
      'pages/employee-import/index',
      'pages/employee-list/index',
      'pages/employee-profile/index',
      'pages/employee-workspace/index',
      'pages/employees/index',
      'pages/part-time-management/index',
      'pages/position-management/index',
      'pages/schedule-config-create/index',
      'pages/schedule-config/index',
      'pages/schedule-records/index',
      'pages/schedule-stats/index',
      'pages/store-form/index',
      'pages/stores/index',
      'pages/team-management/index',
      'pages/temp-worker-form/index',
      'pages/temp-workers/index'
    ]
  },
  // ==================== 分包2：营收分析 + 排班管理 ====================
  {
    root: 'packageB',
    name: 'revenue-schedule',
    pages: [
      // 营收分析相关
      'pages/analytics/analytics/index',
      'pages/analytics/index',
      'pages/cost-control/index',
      'pages/data-analytics/index',
      'pages/data-export/index',
      'pages/home/index',
      'pages/impact-factors/index',
      'pages/operation-adjustment/index',
      'pages/operation-dashboard/index',
      'pages/operation-review/index',
      'pages/revenue-detail-form/index',
      'pages/revenue-detail-list/index',
      'pages/revenue-detail/index',
      'pages/revenue-excel-import/index',
      'pages/revenue-history-import/index',
      'pages/revenue-import/index',
      'pages/revenue-management/index',
      'pages/revenue-prediction/index',
      'pages/revenue-weekly-calendar/index',
      // 排班管理相关
      'pages/debug-work-shifts/index',
      'pages/leave-request/index',
      'pages/monthly-schedule/index',
      'pages/schedule-center/index',
      'pages/schedule-form/index',
      'pages/schedule-history/index',
      'pages/schedule-log-form/index',
      'pages/schedule-logs/index',
      'pages/schedule-optimization/index',
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
      // 配置中心相关
      'pages/bind-wechat/index',
      'pages/brand-config/index',
      'pages/business-area-config/index',
      'pages/business-areas/index',
      'pages/config-center/index',
      'pages/department-form/index',
      'pages/department-management/index',
      'pages/diagnostic/index',
      'pages/efficiency-config/index',
      'pages/meal-periods/index',
      'pages/min-revenue-config/index',
      'pages/position-management/index',
      'pages/quick-reference/index',
      'pages/rest-day-rules/index',
      'pages/setup-wizard/index',
      'pages/startup-center/index',
      'pages/store-management/index',
      'pages/system-config/index',
      'pages/tenant-settings/index',
      // 租户和管理员相关
      'pages/admin/index',
      'pages/create-tenant/index',
      'pages/dashboard/index',
      'pages/invite-employee/index',
      'pages/join-tenant/index',
      'pages/my-applications/index',
      'pages/permission-management/index',
      'pages/super-admin-tenants/index',
      'pages/tenant-applications/index',
      'pages/tenant-management/index',
      'pages/user-management/index'
    ]
  },
  // ==================== 分包4：绩效 + Agent + 高级功能 ====================
  {
    root: 'packageF',
    name: 'performance-agent',
    pages: [
      // 高级功能
      'pages/chain-management/index',
      'pages/core-position-backup/index',
      'pages/risk-alerts/index',
      'pages/store-hierarchy/index',
      'pages/tutorial/index',
      // Agent管理
      'pages/agent-add/index',
      'pages/agent-assign-stores/index',
      'pages/agent-detail/index',
      'pages/agent-management/index',
      'pages/agent-workspace/index',
      // 绩效管理
      'pages/my-performance/index',
      'pages/my-promotion/index',
      'pages/my-salary/index',
      'pages/my-transfer/index'
    ]
  },
  // ==================== 分包5：工作日志 + 考勤管理 ====================
  {
    root: 'packageG',
    name: 'work-attendance',
    pages: [
      // 工作日志相关
      'pages/employee-workspace/index',
      'pages/leave-approval/index',
      'pages/leave-approval-easy/index', // 三易原则优化版审批页面
      'pages/leave-records/index',
      'pages/leave-request/index',
      'pages/leave-request-easy/index', // 三易原则优化版申请页面
      'pages/my-schedule/index',
      'pages/work-log-create/index',
      'pages/work-log-detail/index',
      'pages/work-log-ranking/index',
      // 考勤管理相关
      'pages/attendance/index',
      'pages/my-leave/index',
      'pages/my-overtime/index',
      'pages/working/attendance/index',
      'pages/working/leave/index',
      'pages/working/overtime/index',
      'pages/working/performance/index',
      'pages/working/promotion/index',
      'pages/working/salary/index',
      'pages/working/skill/index',
      'pages/working/transfer/index'
    ]
  },
  // ==================== 分包6：入职离职全流程 ====================
  {
    root: 'packageH',
    name: 'hr-lifecycle',
    pages: [
      'pages/debug-onboarding/index',
      'pages/document-upload/index',
      'pages/exit-interview-management/index',
      'pages/exit-procedures/index',
      'pages/handover-management/index',
      'pages/my-contract-sign/index',
      'pages/my-contract/index',
      'pages/my-offboarding/index',
      'pages/my-onboarding-application/index',
      'pages/my-onboarding/index',
      'pages/my-probation-conversion/index',
      'pages/my-resignation/index',
      'pages/my-social-security/index',
      'pages/offboarding-archive/index',
      'pages/offboarding-management/index',
      'pages/offboarding-statistics/index',
      'pages/offboarding/alumni/index',
      'pages/offboarding/exit/index',
      'pages/offboarding/handover/index',
      'pages/offboarding/resignation/index',
      'pages/onboarding-application/index',
      'pages/onboarding-apply/index',
      'pages/onboarding-approval/index',
      'pages/onboarding-detail/index',
      'pages/onboarding-detail/onboarding-detail/index',
      'pages/onboarding-documents/index',
      'pages/onboarding-handbook/index',
      'pages/onboarding-list/index',
      'pages/onboarding-management/index',
      'pages/onboarding-process/index',
      'pages/onboarding-process-detail/index',
      'pages/onboarding-statistics/index',
      'pages/onboarding-tasks/index',
      'pages/candidate-detail/index', // 候选人详情
      'pages/candidate-add/index', // 添加候选人
      'pages/candidate-edit/index', // 编辑候选人
      'pages/onboarding/contract-management/index',
      'pages/onboarding/course-library/index',
      'pages/onboarding/index',
      'pages/onboarding/interview/index',
      'pages/onboarding/item-library/index',
      'pages/onboarding/item-management/index',
      'pages/onboarding/mentor-management/index',
      'pages/onboarding/onboarding-process-management/index',
      'pages/onboarding/onboarding/index',
      'pages/onboarding/probation-conversion/index',
      'pages/onboarding/probation-management/index',
      'pages/onboarding/probation/index',
      'pages/onboarding/social-security-management/index',
      'pages/onboarding/training-management/index',
      'pages/onboarding/training/index',
      'pages/probation-conversion-approval/index',
      'pages/probation-evaluation-management/index',
      'pages/probation-management/index',
      'pages/regularization-apply/index',
      'pages/regularization-detail/index',
      'pages/regularization-list/index',
      'pages/resignation-apply/index',
      'pages/resignation-apply/resignation-apply/index',
      'pages/resignation-approval/index',
      'pages/resignation-detail/index',
      'pages/resignation-detail/resignation-detail/index',
      'pages/resignation-form/index',
      'pages/resignation-interview/index',
      'pages/resignation-list/index',
      'pages/resignation-management/index',
      'pages/resignation-process/index',
      'pages/resignation-status/index',
      'pages/resignation/index'
    ]
  },
  // ==================== 分包7：招聘 + 培训 ====================
  {
    root: 'packageJ',
    name: 'hr-operations',
    pages: [
      // 招聘管理
      'pages/candidate-list/index',
      'pages/candidate-tracking/index',
      'pages/interview-detail/index',
      'pages/interview-evaluation/index',
      'pages/interview-form/index',
      'pages/interview-invitation/index',
      'pages/interview-management/index',
      'pages/interview-notification/index',
      'pages/interview-progress/index',
      'pages/interview-schedule/index',
      'pages/recruitment-candidate-detail/index',
      'pages/recruitment-candidate-list/index',
      'pages/recruitment-position-form/index',
      'pages/recruitment-position-list/index',
      'pages/recruitment/index',
      // 培训管理
      'pages/learning-leaderboard/index',
      'pages/my-achievements/index',
      'pages/my-learning-center/index',
      'pages/my-training/index',
      'pages/onboarding-training/index',
      'pages/training-admin/index',
      'pages/training-course-create/index',
      'pages/training-course-detail/index',
      'pages/training-course-edit/index',
      'pages/training-courses/index',
      'pages/training-plan-management/index',
      'pages/training-record-detail/index'
    ]
  },
  // ==================== 分包8：任务和消息 ====================
  {
    root: 'packageN',
    name: 'tasks-messages',
    pages: [
      'pages/announcement-detail/index',
      'pages/announcement-list/index',
      'pages/announcement/detail/index',
      'pages/announcement/list/index',
      'pages/contact-hr/index',
      'pages/hr-message-management/index',
      'pages/task-create/index',
      'pages/task-detail/index',
      'pages/tasks/index'
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
