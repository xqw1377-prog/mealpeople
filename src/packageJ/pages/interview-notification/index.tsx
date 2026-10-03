/**
 * 面试通知页面
 *
 * 功能：
 * - 查看待面试通知
 * - 确认参加面试
 * - 申请改期面试
 * - 查看面试准备指南
 * - 查看历史面试记录
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {confirmInterview, getMyInterviews} from '@/db/api-interview'
import {useTenantStore} from '@/store/tenant'

// 临时类型定义
interface InterviewWithDetails {
  id: string
  candidate_id: string
  position_id: string
  interview_date: string
  interview_time: string
  interview_type: string
  type?: string
  location?: string
  interviewer?: string
  interviewer_name?: string
  contact_phone?: string
  notes?: string
  feedback?: string
  status: string
  created_at: string
}

const InterviewNotification: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  // 加载面试列表
  const loadInterviews = useCallback(async () => {
    if (!user?.id || !currentTenant?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const data = await getMyInterviews(user.id)
      setInterviews(data as unknown as InterviewWithDetails[])
    } catch (error) {
      console.error('[面试通知] 加载面试列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, currentTenant?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadInterviews()
  })

  // 确认参加面试
  const handleConfirm = async (interviewId: string) => {
    try {
      const success = await confirmInterview(interviewId)
      if (success) {
        Taro.showToast({
          title: '确认成功',
          icon: 'success'
        })
        loadInterviews()
      } else {
        throw new Error('确认失败')
      }
    } catch (error) {
      console.error('[面试通知] 确认参加失败:', error)
      Taro.showToast({
        title: '确认失败，请重试',
        icon: 'none'
      })
    }
  }

  // 申请改期
  const handleReschedule = async (_interviewId: string) => {
    try {
      // 弹出日期选择器
      const res = await Taro.showModal({
        title: '申请改期',
        content: '请联系HR协商新的面试时间',
        confirmText: '确定',
        cancelText: '取消'
      })

      if (res.confirm) {
        Taro.showToast({
          title: '请联系HR改期',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('[面试通知] 申请改期失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  }

  // 查看面试详情
  const handleViewDetail = (interview: InterviewWithDetails) => {
    Taro.showModal({
      title: '面试详情',
      content: `
面试时间：${new Date(interview.interview_time).toLocaleString()}
面试地点：${interview.location || '待定'}
面试官：${interview.interviewer_name || '待定'}
面试类型：${interview.type === 'initial' ? '初试' : interview.type === 'second' ? '复试' : '终试'}
联系电话：${interview.contact_phone || '无'}
      `,
      showCancel: false
    })
  }

  // 格式化时间
  const formatTime = (timeStr: string) => {
    const time = new Date(timeStr)
    const month = time.getMonth() + 1
    const date = time.getDate()
    const hours = time.getHours().toString().padStart(2, '0')
    const minutes = time.getMinutes().toString().padStart(2, '0')
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[time.getDay()]
    return `${month}月${date}日 ${weekDay} ${hours}:${minutes}`
  }

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-600',
          label: '待面试'
        }
      case 'confirmed':
        return {
          bg: 'bg-blue-100',
          text: 'text-muted-foreground',
          label: '已确认'
        }
      case 'completed':
        return {
          bg: 'bg-gray-50',
          text: 'text-muted-foreground',
          label: '已完成'
        }
      case 'cancelled':
        return {
          bg: 'bg-blue-100',
          text: 'text-red-600',
          label: '已取消'
        }
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-muted-foreground',
          label: '未知'
        }
    }
  }

  // 获取类型样式
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'initial':
        return {
          icon: 'i-mdi-numeric-1-circle',
          color: 'text-muted-foreground',
          label: '初试'
        }
      case 'second':
        return {
          icon: 'i-mdi-numeric-2-circle',
          color: 'text-muted-foreground',
          label: '复试'
        }
      case 'final':
        return {
          icon: 'i-mdi-numeric-3-circle',
          color: 'text-muted-foreground',
          label: '终试'
        }
      default:
        return {
          icon: 'i-mdi-help-circle',
          color: 'text-muted-foreground',
          label: '未知'
        }
    }
  }

  // 如果用户未登录
  if (!user) {
    return (
      <View
        className="min-h-screen flex items-center justify-center"
        style={{background: 'linear-gradient(to bottom, #FFF5F0, #FFFFFF)'}}>
        <View className="text-center">
          <View className="i-mdi-loading text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">正在加载...</Text>
        </View>
      </View>
    )
  }

  // 如果没有选择租户
  if (!currentTenant?.id) {
    return (
      <View
        className="min-h-screen flex items-center justify-center p-6 max-sm:p-4"
        style={{background: 'linear-gradient(to bottom, #FFF5F0, #FFFFFF)'}}>
        <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200 text-center">
          <View className="i-mdi-office-building text-6xl text-blue-600 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
          <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
            请选择租户
          </Text>
          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-6">
            您还没有选择租户，请先选择一个租户
          </Text>
          <View
            className="bg-green-500 text-white py-3 max-sm:py-2 px-6 rounded-lg active:opacity-80"
            onClick={() => Taro.navigateTo({url: '/pages/tenant-select/index'})}>
            <Text className="text-white text-center font-medium">去选择租户</Text>
          </View>
        </View>
      </View>
    )
  }

  // 加载状态
  if (loading) {
    return (
      <View
        className="min-h-screen flex items-center justify-center"
        style={{background: 'linear-gradient(to bottom, #FFF5F0, #FFFFFF)'}}>
        <View className="text-center">
          <View className="i-mdi-loading text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
        </View>
      </View>
    )
  }

  // 分类面试
  const pendingInterviews = interviews.filter((i) => i.status === 'scheduled' || i.status === 'confirmed')
  const completedInterviews = interviews.filter((i) => i.status === 'completed' || i.status === 'cancelled')

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 max-sm:p-3 space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
          {/* 页面标题 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <View className="flex items-center">
              <View className="i-mdi-calendar-account text-3xl max-sm:text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-3 max-sm:mr-2" />
              <View className="flex-1">
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                  面试通知
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                  查看您的面试安排
                </Text>
              </View>
            </View>
          </View>

          {/* 待面试通知 */}
          {pendingInterviews.length > 0 && (
            <View className="bg-white rounded-lg p-4 max-sm:p-3 border-2 border-gray-200">
              <View className="flex items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                <View className="flex items-center">
                  <View className="i-mdi-bell-ring text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                  <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                    待面试通知
                  </Text>
                </View>
                <View className="px-3 max-sm:px-2 py-1 bg-blue-100 rounded-full">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                    {pendingInterviews.length}个
                  </Text>
                </View>
              </View>

              {pendingInterviews.map((interview) => {
                const statusStyle = getStatusStyle(interview.status)
                const typeStyle = getTypeStyle(interview.type)

                return (
                  <View
                    key={interview.id}
                    className="bg-white rounded-xl p-4 max-sm:p-3 border-2 border-gray-200 mb-3 max-sm:mb-2 max-sm:mb-1.5"
                    onClick={() => handleViewDetail(interview)}>
                    {/* 面试头部 */}
                    <View className="flex items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      <View className="flex items-center">
                        <View
                          className={`${typeStyle.icon} text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] ${typeStyle.color} mr-2`}
                        />
                        <Text className={`text-sm max-sm:text-xs max-sm:text-[10px] font-bold ${typeStyle.color}`}>
                          {typeStyle.label}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 ${statusStyle.bg} rounded`}>
                        <Text className={`text-xs max-sm:text-[10px] font-bold ${statusStyle.text}`}>
                          {statusStyle.label}
                        </Text>
                      </View>
                    </View>

                    {/* 面试信息 */}
                    <View className="space-y-2 max-sm:space-y-1.5 mb-3 max-sm:mb-2 max-sm:mb-1.5">
                      <View className="flex items-center">
                        <View className="i-mdi-clock-outline text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                          {formatTime(interview.interview_time)}
                        </Text>
                      </View>
                      {interview.location && (
                        <View className="flex items-center">
                          <View className="i-mdi-map-marker text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                            {interview.location}
                          </Text>
                        </View>
                      )}
                      {interview.interviewer_name && (
                        <View className="flex items-center">
                          <View className="i-mdi-account text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                            面试官：{interview.interviewer_name}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* 操作按钮 */}
                    {interview.status === 'scheduled' && (
                      <View className="flex gap-2 max-sm:gap-1.5">
                        <View
                          className="flex-1 bg-green-500 text-white py-2 rounded-lg active:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConfirm(interview.id)
                          }}>
                          <Text className="text-white text-center text-sm max-sm:text-xs max-sm:text-[10px] font-medium">
                            确认参加
                          </Text>
                        </View>
                        <View
                          className="flex-1 bg-white border border-border py-2 rounded-lg active:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleReschedule(interview.id)
                          }}>
                          <Text className="text-foreground text-center text-sm max-sm:text-xs max-sm:text-[10px] font-medium">
                            申请改期
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* 面试准备指南 */}
          <View className="bg-white rounded-lg p-4 max-sm:p-3 border-2 border-gray-200">
            <View className="flex items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="i-mdi-book-open-page-variant text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2" />
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                面试准备指南
              </Text>
            </View>

            <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              <View className="bg-blue-100 rounded-lg p-3">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mb-2 max-sm:mb-1.5">
                  📋 需要携带的材料
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">• 身份证原件及复印件</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">• 学历证书原件及复印件</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">• 个人简历</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">• 一寸照片2张</Text>
              </View>

              <View className="bg-blue-100 rounded-lg p-3">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mb-2 max-sm:mb-1.5">
                  ✅ 面试注意事项
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">• 提前15分钟到达面试地点</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">• 着装整洁得体</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">• 保持良好的精神状态</Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">• 准备好自我介绍</Text>
              </View>

              <View className="bg-blue-100 rounded-lg p-3">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mb-2 max-sm:mb-1.5">
                  🏢 公司介绍
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                  我们是一家专注于餐饮服务的连锁企业，致力于为客户提供优质的用餐体验。公司拥有完善的培训体系和晋升机制，欢迎您的加入！
                </Text>
              </View>
            </View>
          </View>

          {/* 历史面试记录 */}
          {completedInterviews.length > 0 && (
            <View className="bg-white rounded-lg p-4 max-sm:p-3 border-2 border-gray-200">
              <View className="flex items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                <View className="i-mdi-history text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2" />
                <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                  历史面试记录
                </Text>
              </View>

              {completedInterviews.map((interview) => {
                const statusStyle = getStatusStyle(interview.status)
                const typeStyle = getTypeStyle(interview.type)

                return (
                  <View
                    key={interview.id}
                    className="bg-white rounded-lg p-3 border-2 border-gray-200 mb-3 max-sm:mb-2 max-sm:mb-1.5"
                    onClick={() => handleViewDetail(interview)}>
                    <View className="flex items-center justify-between mb-2 max-sm:mb-1.5">
                      <View className="flex items-center">
                        <View
                          className={`${typeStyle.icon} text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] ${typeStyle.color} mr-2`}
                        />
                        <Text className={`text-sm max-sm:text-xs max-sm:text-[10px] font-bold ${typeStyle.color}`}>
                          {typeStyle.label}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 ${statusStyle.bg} rounded`}>
                        <Text className={`text-xs max-sm:text-[10px] ${statusStyle.text}`}>{statusStyle.label}</Text>
                      </View>
                    </View>
                    <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                      {formatTime(interview.interview_time)}
                    </Text>
                    {interview.feedback && (
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                        反馈：{interview.feedback}
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* 空状态 */}
          {interviews.length === 0 && (
            <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200 text-center">
              <View className="i-mdi-calendar-blank text-6xl text-muted-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
                暂无面试通知
              </Text>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                面试通知将在这里显示
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default InterviewNotification
