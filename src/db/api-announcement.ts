/**
 * 信息交互仪表盘API
 *
 * 员工线：查看消息、标记已读、确认会议、下载文件
 * 管理线：发布消息、管理消息、查看统计、管理文件
 */

import {supabase} from '@/client/supabase'
import type {
  Announcement,
  AnnouncementWithReadStatus,
  ConfirmMeetingParams,
  CreateAnnouncementParams,
  MeetingConfirmation,
  MeetingConfirmStats,
  QueryAnnouncementParams,
  ReadStats,
  UnreadStats,
  UpdateAnnouncementParams
} from './types-announcement'

// ============================================
// 员工端API
// ============================================

/**
 * 获取我的消息列表
 * @param employeeId 员工ID
 * @param tenantId 租户ID
 * @param category 消息类型（可选）
 */
export async function getMyAnnouncements(
  employeeId: string,
  tenantId: string,
  category?: string
): Promise<AnnouncementWithReadStatus[]> {
  console.log('[消息API] 获取我的消息列表, 员工ID:', employeeId, '类型:', category)

  let query = supabase
    .from('announcements')
    .select(`
      *,
      announcement_reads!left(employee_id)
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'published')

  if (category) {
    query = query.eq('category', category)
  }

  const {data, error} = await query.order('is_pinned', {ascending: false}).order('publish_time', {ascending: false})

  if (error) {
    console.error('[消息API] 查询失败:', error)
    throw new Error(`查询消息列表失败: ${error.message}`)
  }

  // 处理数据，添加 is_read 字段
  const result = (data || []).map((item) => {
    const reads = item.announcement_reads || []
    const isRead = reads.some((read: any) => read.employee_id === employeeId)
    const {announcement_reads, ...rest} = item
    return {
      ...rest,
      is_read: isRead
    } as AnnouncementWithReadStatus
  })

  console.log('[消息API] 查询成功, 数量:', result.length)
  return result
}

/**
 * 获取消息详情
 * @param id 消息ID
 * @param employeeId 员工ID（用于判断是否已读）
 */
export async function getAnnouncementDetail(id: string, employeeId?: string): Promise<AnnouncementWithReadStatus> {
  console.log('[消息API] 获取消息详情, ID:', id)

  const {data, error} = await supabase
    .from('announcements')
    .select(`
      *,
      announcement_reads!left(employee_id)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('[消息API] 查询失败:', error)
    throw new Error(`查询消息详情失败: ${error.message}`)
  }

  // 处理数据，添加 is_read 字段
  const reads = data.announcement_reads || []
  const isRead = employeeId ? reads.some((read: any) => read.employee_id === employeeId) : false
  const {announcement_reads, ...rest} = data

  // 增加查看次数
  await supabase
    .from('announcements')
    .update({view_count: (data.view_count || 0) + 1})
    .eq('id', id)

  console.log('[消息API] 查询成功')
  return {
    ...rest,
    is_read: isRead
  } as AnnouncementWithReadStatus
}

/**
 * 标记消息为已读
 * @param announcementId 消息ID
 * @param employeeId 员工ID
 * @param employeeName 员工姓名
 */
export async function markAsRead(announcementId: string, employeeId: string, employeeName: string): Promise<boolean> {
  console.log('[消息API] 标记已读, 消息ID:', announcementId, '员工:', employeeName)

  // 检查是否已经标记过
  const {data: existing} = await supabase
    .from('announcement_reads')
    .select('id')
    .eq('announcement_id', announcementId)
    .eq('employee_id', employeeId)
    .maybeSingle()

  if (existing) {
    console.log('[消息API] 已经标记过已读')
    return true
  }

  const {error} = await supabase.from('announcement_reads').insert({
    announcement_id: announcementId,
    employee_id: employeeId,
    employee_name: employeeName,
    read_time: new Date().toISOString()
  })

  if (error) {
    console.error('[消息API] 标记失败:', error)
    throw new Error(`标记已读失败: ${error.message}`)
  }

  console.log('[消息API] 标记成功')
  return true
}

/**
 * 获取未读消息数量
 * @param employeeId 员工ID
 * @param tenantId 租户ID
 */
export async function getUnreadCount(employeeId: string, tenantId: string): Promise<UnreadStats> {
  console.log('[消息API] 获取未读数量, 员工ID:', employeeId)

  // 获取所有已发布的消息
  const {data: announcements, error: announcementsError} = await supabase
    .from('announcements')
    .select('id, category')
    .eq('tenant_id', tenantId)
    .eq('status', 'published')

  if (announcementsError) {
    console.error('[消息API] 查询消息失败:', announcementsError)
    throw new Error(`查询消息失败: ${announcementsError.message}`)
  }

  // 获取已读记录
  const {data: reads, error: readsError} = await supabase
    .from('announcement_reads')
    .select('announcement_id')
    .eq('employee_id', employeeId)

  if (readsError) {
    console.error('[消息API] 查询已读记录失败:', readsError)
    throw new Error(`查询已读记录失败: ${readsError.message}`)
  }

  const readIds = new Set((reads || []).map((r) => r.announcement_id))

  // 统计未读数量
  const unreadAnnouncements = (announcements || []).filter((a) => !readIds.has(a.id))

  const stats: UnreadStats = {
    total: unreadAnnouncements.length,
    urgent: unreadAnnouncements.filter((a) => a.category === 'urgent').length,
    announcement: unreadAnnouncements.filter((a) => a.category === 'announcement').length,
    meeting: unreadAnnouncements.filter((a) => a.category === 'meeting').length,
    file: unreadAnnouncements.filter((a) => a.category === 'file').length
  }

  console.log('[消息API] 未读统计:', stats)
  return stats
}

/**
 * 确认参加会议
 * @param params 确认参数
 */
export async function confirmMeeting(params: ConfirmMeetingParams): Promise<boolean> {
  console.log('[消息API] 确认会议, 参数:', params)

  // 检查是否已经确认过
  const {data: existing} = await supabase
    .from('meeting_confirmations')
    .select('id')
    .eq('announcement_id', params.announcement_id)
    .eq('employee_id', params.employee_id)
    .maybeSingle()

  if (existing) {
    // 更新确认状态
    const {error} = await supabase
      .from('meeting_confirmations')
      .update({
        status: params.status,
        confirm_time: new Date().toISOString(),
        decline_reason: params.decline_reason
      })
      .eq('id', existing.id)

    if (error) {
      console.error('[消息API] 更新确认失败:', error)
      throw new Error(`更新会议确认失败: ${error.message}`)
    }
  } else {
    // 新增确认记录
    const {error} = await supabase.from('meeting_confirmations').insert({
      announcement_id: params.announcement_id,
      employee_id: params.employee_id,
      employee_name: params.employee_name,
      status: params.status,
      confirm_time: new Date().toISOString(),
      decline_reason: params.decline_reason
    })

    if (error) {
      console.error('[消息API] 确认失败:', error)
      throw new Error(`确认会议失败: ${error.message}`)
    }
  }

  console.log('[消息API] 确认成功')
  return true
}

/**
 * 获取我的会议确认状态
 * @param announcementId 消息ID
 * @param employeeId 员工ID
 */
export async function getMyMeetingConfirmation(
  announcementId: string,
  employeeId: string
): Promise<MeetingConfirmation | null> {
  console.log('[消息API] 获取会议确认状态, 消息ID:', announcementId, '员工ID:', employeeId)

  const {data, error} = await supabase
    .from('meeting_confirmations')
    .select('*')
    .eq('announcement_id', announcementId)
    .eq('employee_id', employeeId)
    .maybeSingle()

  if (error) {
    console.error('[消息API] 查询失败:', error)
    throw new Error(`查询会议确认状态失败: ${error.message}`)
  }

  console.log('[消息API] 查询成功:', data ? '已确认' : '未确认')
  return data
}

// ============================================
// 管理端API
// ============================================

/**
 * 创建消息
 * @param params 消息参数
 */
export async function createAnnouncement(params: CreateAnnouncementParams): Promise<Announcement> {
  console.log('[消息API] 创建消息, 参数:', params)

  const {data, error} = await supabase
    .from('announcements')
    .insert({
      ...params,
      status: params.status || 'published',
      is_pinned: params.is_pinned || false,
      view_count: 0,
      read_count: 0,
      publish_time: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('[消息API] 创建失败:', error)
    throw new Error(`创建消息失败: ${error.message}`)
  }

  console.log('[消息API] 创建成功, ID:', data.id)
  return data
}

/**
 * 更新消息
 * @param id 消息ID
 * @param params 更新参数
 */
export async function updateAnnouncement(id: string, params: UpdateAnnouncementParams): Promise<boolean> {
  console.log('[消息API] 更新消息, ID:', id, '参数:', params)

  const {error} = await supabase.from('announcements').update(params).eq('id', id)

  if (error) {
    console.error('[消息API] 更新失败:', error)
    throw new Error(`更新消息失败: ${error.message}`)
  }

  console.log('[消息API] 更新成功')
  return true
}

/**
 * 删除消息
 * @param id 消息ID
 */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  console.log('[消息API] 删除消息, ID:', id)

  const {error} = await supabase.from('announcements').delete().eq('id', id)

  if (error) {
    console.error('[消息API] 删除失败:', error)
    throw new Error(`删除消息失败: ${error.message}`)
  }

  console.log('[消息API] 删除成功')
  return true
}

/**
 * 获取消息列表（管理端）
 * @param params 查询参数
 */
export async function getAnnouncementList(params: QueryAnnouncementParams): Promise<Announcement[]> {
  console.log('[消息API] 获取消息列表（管理端）, 参数:', params)

  let query = supabase.from('announcements').select('*').eq('tenant_id', params.tenant_id)

  if (params.category) {
    query = query.eq('category', params.category)
  }

  if (params.priority) {
    query = query.eq('priority', params.priority)
  }

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.is_pinned !== undefined) {
    query = query.eq('is_pinned', params.is_pinned)
  }

  if (params.keyword) {
    query = query.or(`title.ilike.%${params.keyword}%,content.ilike.%${params.keyword}%`)
  }

  if (params.start_date) {
    query = query.gte('publish_time', params.start_date)
  }

  if (params.end_date) {
    query = query.lte('publish_time', params.end_date)
  }

  const {data, error} = await query.order('is_pinned', {ascending: false}).order('publish_time', {ascending: false})

  if (error) {
    console.error('[消息API] 查询失败:', error)
    throw new Error(`查询消息列表失败: ${error.message}`)
  }

  console.log('[消息API] 查询成功, 数量:', data?.length || 0)
  return Array.isArray(data) ? data : []
}

/**
 * 获取消息阅读统计
 * @param announcementId 消息ID
 */
export async function getReadStats(announcementId: string): Promise<ReadStats> {
  console.log('[消息API] 获取阅读统计, 消息ID:', announcementId)

  // 获取消息信息
  const {data: announcement, error: announcementError} = await supabase
    .from('announcements')
    .select('target_type, target_ids, read_count')
    .eq('id', announcementId)
    .single()

  if (announcementError) {
    console.error('[消息API] 查询消息失败:', announcementError)
    throw new Error(`查询消息失败: ${announcementError.message}`)
  }

  // 获取已读记录
  const {data: reads, error: readsError} = await supabase
    .from('announcement_reads')
    .select('employee_id, employee_name, read_time')
    .eq('announcement_id', announcementId)
    .order('read_time', {ascending: false})

  if (readsError) {
    console.error('[消息API] 查询已读记录失败:', readsError)
    throw new Error(`查询已读记录失败: ${readsError.message}`)
  }

  const readList = (reads || []).map((r) => ({
    employee_id: r.employee_id,
    employee_name: r.employee_name,
    read_time: r.read_time
  }))

  // TODO: 根据 target_type 和 target_ids 计算总人数和未读人员
  // 这里简化处理，实际需要查询员工表
  const totalCount = 100 // 示例值
  const readCount = announcement.read_count || 0
  const unreadCount = totalCount - readCount
  const readRate = totalCount > 0 ? (readCount / totalCount) * 100 : 0

  const stats: ReadStats = {
    total_count: totalCount,
    read_count: readCount,
    unread_count: unreadCount,
    read_rate: Math.round(readRate * 100) / 100,
    read_list: readList,
    unread_list: [] // TODO: 计算未读人员列表
  }

  console.log('[消息API] 阅读统计:', stats)
  return stats
}

/**
 * 获取会议确认统计
 * @param announcementId 消息ID
 */
export async function getMeetingConfirmStats(announcementId: string): Promise<MeetingConfirmStats> {
  console.log('[消息API] 获取会议确认统计, 消息ID:', announcementId)

  // 获取会议信息
  const {data: announcement, error: announcementError} = await supabase
    .from('announcements')
    .select('meeting_participants')
    .eq('id', announcementId)
    .single()

  if (announcementError) {
    console.error('[消息API] 查询会议失败:', announcementError)
    throw new Error(`查询会议失败: ${announcementError.message}`)
  }

  // 获取确认记录
  const {data: confirmations, error: confirmationsError} = await supabase
    .from('meeting_confirmations')
    .select('*')
    .eq('announcement_id', announcementId)
    .order('confirm_time', {ascending: false})

  if (confirmationsError) {
    console.error('[消息API] 查询确认记录失败:', confirmationsError)
    throw new Error(`查询确认记录失败: ${confirmationsError.message}`)
  }

  const confirmedList = (confirmations || []).filter((c) => c.status === 'confirmed')
  const declinedList = (confirmations || []).filter((c) => c.status === 'declined')
  const pendingList = [] // TODO: 计算待确认人员列表

  const totalCount = (announcement.meeting_participants || []).length
  const confirmedCount = confirmedList.length
  const declinedCount = declinedList.length
  const pendingCount = totalCount - confirmedCount - declinedCount
  const confirmRate = totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0

  const stats: MeetingConfirmStats = {
    total_count: totalCount,
    confirmed_count: confirmedCount,
    declined_count: declinedCount,
    pending_count: pendingCount,
    confirm_rate: Math.round(confirmRate * 100) / 100,
    confirmed_list: confirmedList,
    declined_list: declinedList,
    pending_list: pendingList
  }

  console.log('[消息API] 会议确认统计:', stats)
  return stats
}

/**
 * 置顶/取消置顶消息
 * @param id 消息ID
 * @param isPinned 是否置顶
 */
export async function togglePinAnnouncement(id: string, isPinned: boolean): Promise<boolean> {
  console.log('[消息API] 切换置顶状态, ID:', id, '置顶:', isPinned)

  const {error} = await supabase.from('announcements').update({is_pinned: isPinned}).eq('id', id)

  if (error) {
    console.error('[消息API] 切换失败:', error)
    throw new Error(`切换置顶状态失败: ${error.message}`)
  }

  console.log('[消息API] 切换成功')
  return true
}
