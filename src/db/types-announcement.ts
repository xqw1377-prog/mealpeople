/**
 * 信息交互仪表盘类型定义
 */

// ============================================
// 基础类型
// ============================================

/**
 * 消息类型
 */
export type AnnouncementCategory = 'announcement' | 'meeting' | 'file' | 'urgent'

/**
 * 重要程度
 */
export type AnnouncementPriority = 'urgent' | 'high' | 'normal' | 'low'

/**
 * 消息状态
 */
export type AnnouncementStatus = 'draft' | 'published' | 'archived'

/**
 * 发布范围类型
 */
export type TargetType = 'all' | 'department' | 'store' | 'specific'

/**
 * 会议确认状态
 */
export type MeetingConfirmStatus = 'pending' | 'confirmed' | 'declined'

// ============================================
// 附件类型
// ============================================

/**
 * 附件信息
 */
export interface Attachment {
  name: string // 文件名
  url: string // 下载链接
  size: number // 文件大小（字节）
  type: string // 文件类型（pdf/doc/xls等）
}

// ============================================
// 主要类型
// ============================================

/**
 * 消息公告
 */
export interface Announcement {
  id: string
  tenant_id: string

  // 基本信息
  title: string
  content: string
  category: AnnouncementCategory
  priority: AnnouncementPriority

  // 发布信息
  publisher_id: string
  publisher_name: string
  publish_time: string

  // 发布范围
  target_type: TargetType
  target_ids?: string[] // 目标部门/门店/员工ID列表

  // 附件信息
  attachments?: Attachment[]

  // 会议信息（仅会议类型）
  meeting_time?: string
  meeting_location?: string
  meeting_participants?: string[] // 参会人员ID列表

  // 状态
  status: AnnouncementStatus
  is_pinned: boolean // 是否置顶

  // 统计信息
  view_count: number // 查看次数
  read_count: number // 已读人数

  created_at: string
  updated_at: string
}

/**
 * 阅读记录
 */
export interface AnnouncementRead {
  id: string
  announcement_id: string
  employee_id: string
  employee_name: string
  read_time: string
  created_at: string
}

/**
 * 会议确认
 */
export interface MeetingConfirmation {
  id: string
  announcement_id: string
  employee_id: string
  employee_name: string
  status: MeetingConfirmStatus
  confirm_time?: string
  decline_reason?: string
  created_at: string
  updated_at: string
}

/**
 * 文件分类
 */
export interface FileCategory {
  id: string
  tenant_id: string
  name: string
  description?: string
  parent_id?: string
  sort_order: number
  icon?: string
  created_at: string
  updated_at: string
}

/**
 * 消息评论
 */
export interface AnnouncementComment {
  id: string
  announcement_id: string
  employee_id: string
  employee_name: string
  content: string
  parent_id?: string // 回复评论
  created_at: string
  updated_at: string
}

/**
 * 消息收藏
 */
export interface AnnouncementFavorite {
  id: string
  announcement_id: string
  employee_id: string
  created_at: string
}

// ============================================
// 扩展类型（带额外信息）
// ============================================

/**
 * 消息公告（带阅读状态）
 */
export interface AnnouncementWithReadStatus extends Announcement {
  is_read: boolean // 是否已读
  is_favorite?: boolean // 是否收藏
}

/**
 * 消息公告（带统计信息）
 */
export interface AnnouncementWithStats extends Announcement {
  total_target_count: number // 目标人数
  read_rate: number // 阅读率
  unread_employees?: string[] // 未读人员列表
}

/**
 * 会议消息（带确认信息）
 */
export interface MeetingAnnouncement extends Announcement {
  confirmed_count: number // 已确认人数
  declined_count: number // 已拒绝人数
  pending_count: number // 待确认人数
  confirm_rate: number // 确认率
  my_confirmation?: MeetingConfirmation // 我的确认状态
}

// ============================================
// 请求参数类型
// ============================================

/**
 * 创建消息参数
 */
export interface CreateAnnouncementParams {
  tenant_id: string
  title: string
  content: string
  category: AnnouncementCategory
  priority?: AnnouncementPriority
  publisher_id: string
  publisher_name: string
  target_type: TargetType
  target_ids?: string[]
  attachments?: Attachment[]
  meeting_time?: string
  meeting_location?: string
  meeting_participants?: string[]
  is_pinned?: boolean
  status?: AnnouncementStatus
}

/**
 * 更新消息参数
 */
export interface UpdateAnnouncementParams {
  title?: string
  content?: string
  category?: AnnouncementCategory
  priority?: AnnouncementPriority
  target_type?: TargetType
  target_ids?: string[]
  attachments?: Attachment[]
  meeting_time?: string
  meeting_location?: string
  meeting_participants?: string[]
  is_pinned?: boolean
  status?: AnnouncementStatus
}

/**
 * 查询消息参数
 */
export interface QueryAnnouncementParams {
  tenant_id: string
  category?: AnnouncementCategory
  priority?: AnnouncementPriority
  status?: AnnouncementStatus
  is_pinned?: boolean
  keyword?: string // 搜索关键词
  start_date?: string // 开始日期
  end_date?: string // 结束日期
  limit?: number
  offset?: number
}

/**
 * 确认会议参数
 */
export interface ConfirmMeetingParams {
  announcement_id: string
  employee_id: string
  employee_name: string
  status: MeetingConfirmStatus
  decline_reason?: string
}

// ============================================
// 响应类型
// ============================================

/**
 * 未读消息统计
 */
export interface UnreadStats {
  total: number // 总未读数
  urgent: number // 紧急通知
  announcement: number // 公告通知
  meeting: number // 会议通知
  file: number // 文件资料
}

/**
 * 阅读统计
 */
export interface ReadStats {
  total_count: number // 总人数
  read_count: number // 已读人数
  unread_count: number // 未读人数
  read_rate: number // 阅读率
  read_list: Array<{
    employee_id: string
    employee_name: string
    read_time: string
  }>
  unread_list: Array<{
    employee_id: string
    employee_name: string
  }>
}

/**
 * 会议确认统计
 */
export interface MeetingConfirmStats {
  total_count: number // 总人数
  confirmed_count: number // 已确认人数
  declined_count: number // 已拒绝人数
  pending_count: number // 待确认人数
  confirm_rate: number // 确认率
  confirmed_list: MeetingConfirmation[]
  declined_list: MeetingConfirmation[]
  pending_list: Array<{
    employee_id: string
    employee_name: string
  }>
}

/**
 * 消息列表响应
 */
export interface AnnouncementListResponse {
  data: AnnouncementWithReadStatus[]
  total: number
  page: number
  page_size: number
}
