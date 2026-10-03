/**
 * API 统一导出入口
 *
 * 代码组织结构：
 * - src/db/modules/tenant.ts - 租户管理（租户、租户申请、邀请码）
 * - src/db/modules/user.ts - 用户管理（用户、员工、权限）
 * - src/db/modules/brand-store.ts - 品牌和门店管理
 * - src/db/modules/schedule.ts - 排班管理（排班、排班日志、排班规划、排班结果）
 * - src/db/modules/cost.ts - 成本管理（成本数据、效能标准）
 * - src/db/modules/operations.ts - 运营数据（运营数据、每日运营、仪表盘）
 * - src/db/modules/parttime.ts - 兼职管理（兼职工时记录）
 * - src/db/modules/config.ts - 配置管理（班次、餐段、岗位配置）
 * - src/db/modules/wechat.ts - 微信集成（微信绑定）
 * - src/db/modules/onboarding.ts - 入职管理（入职申请、试用期评估、转正申请）
 * - src/db/modules/resignation.ts - 离职管理（离职申请、离职交接、离职面谈）
 *
 * 所有 API 通过此文件统一导出，保持向后兼容
 */

// ==================== 重新导出所有业务模块 ====================

// Agent管理模块
export {
  batchAssignAgent,
  createAgentAssignment,
  deleteAgentAssignment,
  getAgentAssignments,
  getAgentStats,
  getAgentStoresWithDetails,
  getAgentsByTenantId,
  getStoreAgents,
  getTenantAgentStats,
  isUserAgent,
  updateUserToAgent
} from './modules/agent'
// 品牌和门店管理模块
export {
  createBrand,
  createStore,
  deleteBrand,
  deleteStore,
  getBrandById,
  getBrandEmployeeCount,
  getBrandStoreCount,
  // 品牌管理
  getBrandsByTenantId,
  getStoreById,
  // 门店管理
  getStoresByTenantId,
  updateBrand,
  updateStore
} from './modules/brand-store'
// 配置管理模块
export {
  createMealPeriod,
  createPosition,
  createWorkShift,
  deleteMealPeriod,
  deletePosition,
  deleteWorkShift,
  getConfigCompletionStats,
  // 餐段配置
  getMealPeriods,
  // 岗位配置
  getPositionsByTenantId,
  // 班次配置
  getWorkShifts,
  // 配置状态检查
  hasBrandConfig,
  hasBusinessAreaConfig,
  hasMealPeriodConfig,
  hasMinRevenueConfig,
  hasPositionConfig,
  hasRestDayRules,
  hasWorkShiftConfig,
  updateMealPeriod,
  updatePosition,
  updateWorkShift
} from './modules/config'
// 成本管理模块
export {
  calculateRevenueZone,
  evaluateEfficiency,
  // 成本数据
  getCostDataByTenantId,
  getStoreEfficiencyStandard,
  // 效能标准
  getTenantEfficiencyStandard,
  hasEfficiencyStandard,
  upsertCostData,
  upsertEfficiencyStandard
} from './modules/cost'
// 入职管理模块
export {
  approveOnboarding,
  approveRegularization,
  completeOnboarding,
  createOnboarding,
  createOnboardingDocument,
  createProbationEvaluation,
  createRegularization,
  deleteOnboardingDocument,
  getOnboardingById,
  getOnboardingDocuments,
  getOnboardingsByStore,
  getOnboardingsByTenant,
  getProbationEmployees,
  getProbationEvaluationById,
  getProbationEvaluations,
  getRegularizationByEmployee,
  getRegularizationsByTenant
} from './modules/onboarding'
// 运营数据模块
export {
  deleteDailyOperation,
  // 每日运营
  getDailyOperation,
  getDailyOperations,
  // 仪表盘
  getDashboardData,
  getEnhancedDashboardData,
  getMonthOperationsData,
  // 运营数据
  getOperationsDataByTenantId,
  getRevenueStats,
  getTodayOperationsData,
  upsertDailyOperation,
  upsertOperationsData
} from './modules/operations'
// 兼职管理模块
export {
  // 兼职工时
  createPartTimeShift,
  deletePartTimeShift,
  getPartTimeShiftsByDate,
  updatePartTimeShift
} from './modules/parttime'
// 离职管理模块
export {
  approveResignation,
  completeResignation,
  createExitInterview,
  createHandover,
  createResignation,
  deleteHandover,
  getExitInterviewByResignation,
  getExitInterviewsByTenant,
  getHandoversByResignation,
  getResignationByEmployee,
  getResignationById,
  getResignationsByStore,
  getResignationsByTenant,
  updateEmployeeStatusToResigned,
  updateExitInterview,
  updateHandoverStatus
} from './modules/resignation'
// 排班管理模块
export {
  createDayOffRecords,
  createDayOffSchedule,
  createPartTimeRecords,
  createSchedule,
  createScheduleLog,
  createSchedulePlanPeriods,
  deleteDayOffRecords,
  deleteDayOffSchedule,
  deletePartTimeRecords,
  deleteSchedule,
  deleteScheduleLog,
  deleteSchedulePlanPeriods,
  getDayOffRecords,
  getDayOffSchedules,
  getPartTimeRecords,
  getScheduleAdjustmentHistory,
  getScheduleById,
  getScheduleLogById,
  // 排班日志
  getScheduleLogsByTenantId,
  getScheduleLogsRanking,
  getSchedulePlan,
  getSchedulePlanPeriods,
  getScheduleResultByDate,
  getScheduleResultsByDateRange,
  getScheduleResultsStats,
  getSchedulesByStoreId,
  // 排班基础
  getSchedulesByTenantId,
  insertScheduleResult,
  updateSchedule,
  updateScheduleLog,
  // 排班规划
  upsertSchedulePlan,
  // 排班结果
  upsertScheduleResult
} from './modules/schedule'
// 租户管理模块
export {
  approveTenantApplication,
  createTenant,
  // 租户申请
  createTenantApplication,
  createTenantWithAdmin,
  deactivateInvitationCode,
  deleteTenant,
  // 邀请码管理
  generateInvitationCode,
  getAllTenantApplications,
  // 体验模式
  getDemoTenant,
  getInvitationCodesByTenantId,
  getPendingTenantApplications,
  getTenantById,
  // 租户设置
  getTenantSettings,
  // 租户基础
  getTenants,
  // 租户用户
  getTenantUsers,
  getUserTenantApplications,
  // 加入租户
  joinTenantWithCode,
  rejectTenantApplication,
  updateTenant,
  upsertTenantSettings,
  validateInvitationCode
} from './modules/tenant'
// 用户管理模块
export {
  batchImportEmployees,
  convertGuestToTenantAdmin,
  createEmployee,
  deleteEmployee,
  deleteUser,
  getAllProfiles,
  // 用户基础
  getCurrentUser,
  getEmployeeById,
  getEmployeeByUserId,
  getEmployeesByStoreId,
  // 员工管理
  getEmployeesByTenantId,
  getProfileByUserId,
  getRegularEmployeeCount,
  getUsersByTenantId,
  updateEmployee,
  updateUserProfile,
  updateUserRole,
  updateUserStatus
} from './modules/user'
// 微信集成模块
export {
  // 微信绑定
  bindWechatToProfile,
  isWechatBound
} from './modules/wechat'

// ==================== 别名导出（兼容旧代码） ====================

export {getEmployeesByTenantId as getEmployees} from './modules/user'

// ==================== 类型导出 ====================

export type * from './types'
