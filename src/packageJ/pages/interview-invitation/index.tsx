/**
 * 面试邀约入口页面
 *
 * 功能：
 * - 候选人通过链接/二维码访问
 * - 显示面试邀约详情
 * - 接受/拒绝面试邀约
 * - 填写候选人信息
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Input, Text, Textarea, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {acceptInvitation, getInvitationByCode, type InterviewInvitationWithDetails} from '@/db/api-interview-flow'

const InterviewInvitation: React.FC = () => {
  const router = useRouter()
  const {code} = router.params // 从URL参数获取邀约码

  // 状态管理
  const [invitation, setInvitation] = useState<InterviewInvitationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  // 候选人信息表单
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    phone: '',
    email: '',
    education: '',
    experience: '',
    self_introduction: ''
  })

  // 加载面试邀约
  const loadInvitation = useCallback(async () => {
    if (!code) {
      Taro.showToast({
        title: '邀约码无效',
        icon: 'error',
        duration: 2000
      })
      return
    }

    try {
      setLoading(true)
      const data = await getInvitationByCode(code)

      if (!data) {
        Taro.showToast({
          title: '邀约不存在或已过期',
          icon: 'error',
          duration: 2000
        })
        return
      }

      setInvitation(data)
    } catch (error) {
      console.error('加载面试邀约失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => {
    loadInvitation()
  }, [loadInvitation])

  // 接受邀约
  const handleAccept = async () => {
    if (!invitation) return

    // 验证必填信息
    if (!candidateInfo.name || !candidateInfo.phone) {
      Taro.showToast({
        title: '请填写姓名和手机号',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      setAccepting(true)

      // 接受邀约
      const success = await acceptInvitation(invitation.id)

      if (success) {
        Taro.showToast({
          title: '已接受面试邀约',
          icon: 'success',
          duration: 2000
        })

        // 跳转到面试进度页面
        setTimeout(() => {
          Taro.redirectTo({
            url: `/pages/interview-progress/index?candidateId=${invitation.candidate_id}`
          })
        }, 2000)
      } else {
        Taro.showToast({
          title: '操作失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('接受邀约失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setAccepting(false)
    }
  }

  // 拒绝邀约
  const handleReject = () => {
    Taro.showModal({
      title: '确认拒绝',
      content: '确定要拒绝这个面试邀约吗？',
      success: async (res) => {
        if (res.confirm && invitation) {
          // TODO: 实现拒绝邀约的API
          Taro.showToast({
            title: '已拒绝面试邀约',
            icon: 'success',
            duration: 2000
          })
        }
      }
    })
  }

  // 格式化日期时间
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '待定'
    const date = new Date(dateStr)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 加载中状态
  if (loading) {
    return (
      <View
        className="min-h-screen flex items-center justify-center"
        style={{background: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff)'}}>
        <View className="text-center">
          <View className="i-mdi-loading text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
        </View>
      </View>
    )
  }

  // 邀约不存在
  if (!invitation) {
    return (
      <View
        className="min-h-screen flex items-center justify-center p-6 max-sm:p-4"
        style={{background: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff)'}}>
        <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200 text-center max-w-md">
          <View className="i-mdi-alert-circle text-6xl text-destructive mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
          <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
            邀约无效
          </Text>
          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-6">
            该面试邀约不存在或已过期
          </Text>
        </View>
      </View>
    )
  }

  // 已接受状态
  if (invitation.status === 'accepted') {
    return (
      <View
        className="min-h-screen flex items-center justify-center p-6 max-sm:p-4"
        style={{background: 'linear-gradient(to bottom, #e0f2fe, #f0f9ff)'}}>
        <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200 text-center max-w-md">
          <View className="i-mdi-check-circle text-6xl text-blue-600 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
          <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
            已接受邀约
          </Text>
          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-6">
            您已接受此面试邀约，请按时参加面试
          </Text>
          <Button
            className="w-full bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
            size="default"
            onClick={() =>
              Taro.redirectTo({
                url: `/pages/interview-progress/index?candidateId=${invitation.candidate_id}`
              })
            }>
            查看面试进度
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <View className="p-4 max-sm:p-3 space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
        {/* 顶部欢迎卡片 */}
        <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
          <View className="flex flex-row items-center mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            <View className="i-mdi-email-open text-4xl max-sm:text-3xl text-blue-600 mr-3 max-sm:mr-2" />
            <View className="flex-1">
              <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                面试邀约
              </Text>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                诚挚邀请您参加面试
              </Text>
            </View>
          </View>
        </View>

        {/* 面试信息卡片 */}
        <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
          <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            面试信息
          </Text>

          <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
            {/* 职位信息 */}
            <View className="flex flex-row items-start">
              <View className="i-mdi-briefcase text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-3 max-sm:mr-2 mt-1" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">应聘职位</Text>
                <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mt-1">
                  {invitation.position_title || '未指定'}
                </Text>
              </View>
            </View>

            {/* 面试类型 */}
            <View className="flex flex-row items-start">
              <View className="i-mdi-format-list-numbered text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-3 max-sm:mr-2 mt-1" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">面试轮次</Text>
                <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mt-1">
                  {invitation.interview_type === 'initial' ? '初试' : '复试'} - 第{invitation.interview_round}轮
                </Text>
              </View>
            </View>

            {/* 面试时间 */}
            <View className="flex flex-row items-start">
              <View className="i-mdi-clock-outline text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-3 max-sm:mr-2 mt-1" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">面试时间</Text>
                <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mt-1">
                  {formatDateTime(invitation.scheduled_time)}
                </Text>
              </View>
            </View>

            {/* 面试地点 */}
            {invitation.location && (
              <View className="flex flex-row items-start">
                <View className="i-mdi-map-marker text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-3 max-sm:mr-2 mt-1" />
                <View className="flex-1">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">面试地点</Text>
                  <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mt-1">
                    {invitation.location}
                  </Text>
                </View>
              </View>
            )}

            {/* 备注 */}
            {invitation.notes && (
              <View className="flex flex-row items-start">
                <View className="i-mdi-note-text text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-3 max-sm:mr-2 mt-1" />
                <View className="flex-1">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">备注</Text>
                  <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mt-1">
                    {invitation.notes}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 候选人信息填写卡片 */}
        <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
          <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
            请完善您的信息
          </Text>

          <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
            {/* 姓名 */}
            <View>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                姓名 <Text className="text-destructive">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                  placeholder="请输入您的姓名"
                  value={candidateInfo.name}
                  onInput={(e) => setCandidateInfo({...candidateInfo, name: e.detail.value})}
                />
              </View>
            </View>

            {/* 手机号 */}
            <View>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                手机号 <Text className="text-destructive">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                  placeholder="请输入您的手机号"
                  type="number"
                  value={candidateInfo.phone}
                  onInput={(e) => setCandidateInfo({...candidateInfo, phone: e.detail.value})}
                />
              </View>
            </View>

            {/* 邮箱 */}
            <View>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">邮箱</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                  placeholder="请输入您的邮箱"
                  value={candidateInfo.email}
                  onInput={(e) => setCandidateInfo({...candidateInfo, email: e.detail.value})}
                />
              </View>
            </View>

            {/* 学历 */}
            <View>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">学历</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                  placeholder="如：本科、硕士等"
                  value={candidateInfo.education}
                  onInput={(e) => setCandidateInfo({...candidateInfo, education: e.detail.value})}
                />
              </View>
            </View>

            {/* 工作经验 */}
            <View>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                工作经验
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                  placeholder="请简要描述您的工作经验"
                  value={candidateInfo.experience}
                  onInput={(e) => setCandidateInfo({...candidateInfo, experience: e.detail.value})}
                  maxlength={500}
                />
              </View>
            </View>

            {/* 自我介绍 */}
            <View>
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground mb-2 max-sm:mb-1.5">
                自我介绍
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                  placeholder="请简要介绍一下自己"
                  value={candidateInfo.self_introduction}
                  onInput={(e) => setCandidateInfo({...candidateInfo, self_introduction: e.detail.value})}
                  maxlength={500}
                />
              </View>
            </View>
          </View>
        </View>

        {/* 操作按钮 */}
        <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
          <Button
            className="w-full bg-blue-100 text-white py-4 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
            size="default"
            onClick={handleAccept}
            disabled={accepting}>
            {accepting ? '处理中...' : '接受邀约并提交信息'}
          </Button>

          <Button
            className="w-full bg-muted text-muted-foreground py-4 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
            size="default"
            onClick={handleReject}>
            拒绝邀约
          </Button>
        </View>

        {/* 温馨提示 */}
        <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3">
          <View className="flex flex-row items-start">
            <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 mr-2 mt-0.5" />
            <View className="flex-1">
              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-blue-600 font-medium mb-1">温馨提示</Text>
              <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                • 请确保填写的信息真实准确{'\n'}• 接受邀约后，请按时参加面试{'\n'}• 如有疑问，请联系HR
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default InterviewInvitation
