/**
 * 联系HR页面
 *
 * 功能：
 * - 在线留言功能
 * - 查看留言历史
 * - 查看HR回复
 * - 展示HR联系方式
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api-employees'
import {createHRMessage, getHRMessages} from '@/db/api-onboarding-enhancement'
import type {HRMessage} from '@/db/types/onboarding-enhancement'
import {useTenantStore} from '@/store/tenant'

export default function ContactHR() {
  const {user} = useAuth()
  const {currentTenant} = useTenantStore()
  const [employeeId, setEmployeeId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<HRMessage[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')

  // 加载留言历史
  const loadMessages = useCallback(async () => {
    if (!currentTenant || !user) {
      setLoading(false)
      return
    }

    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        setLoading(false)
        return
      }

      setEmployeeId(employee.id)

      // 获取留言历史
      const messageList = await getHRMessages(employee.id)
      setMessages(messageList)
    } catch (error) {
      console.error('加载留言历史失败:', error)
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useDidShow(() => {
    loadMessages()
  })

  // 提交留言
  const handleSubmit = async () => {
    if (!message.trim()) {
      Taro.showToast({
        title: '请输入留言内容',
        icon: 'none'
      })
      return
    }

    if (!employeeId || !currentTenant) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    try {
      setSubmitting(true)

      const result = await createHRMessage({
        tenant_id: currentTenant.id,
        employee_id: employeeId,
        message: message.trim()
      })

      if (result) {
        Taro.showToast({
          title: '留言提交成功',
          icon: 'success'
        })

        setMessage('')
        setActiveTab('history')
        await loadMessages()
      } else {
        Taro.showToast({
          title: '提交失败，请重试',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('提交留言失败:', error)
      Taro.showToast({
        title: '提交失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 拨打电话
  const handleCall = () => {
    Taro.makePhoneCall({
      phoneNumber: '138-0000-0001'
    }).catch((error) => {
      console.error('拨打电话失败:', error)
      Taro.showToast({
        title: '拨打电话失败',
        icon: 'none'
      })
    })
  }

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return `今天 ${date.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}`
    } else if (days === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})}`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN', {month: '2-digit', day: '2-digit'})
    }
  }

  // 获取状态文本和颜色
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {text: '待回复', color: 'text-orange-600', bgColor: 'bg-orange-100'}
      case 'replied':
        return {text: '已回复', color: 'text-green-600', bgColor: 'bg-green-100'}
      case 'closed':
        return {text: '已关闭', color: 'text-gray-600', bgColor: 'bg-gray-100'}
      default:
        return {text: '未知', color: 'text-gray-600', bgColor: 'bg-gray-100'}
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <View className="text-center">
          <View className="i-mdi-loading animate-spin text-5xl text-primary mb-4"></View>
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <ScrollView scrollY className="h-screen" enableBackToTop>
        {/* 头部 */}
        <View className="bg-gradient-to-r from-primary to-primary-glow p-6">
          <View className="flex items-center justify-between mb-4">
            <View className="flex items-center gap-3">
              <View
                className="i-mdi-arrow-left text-2xl text-white cursor-pointer"
                onClick={() => Taro.navigateBack()}></View>
              <Text className="text-2xl font-bold text-white">联系HR</Text>
            </View>
            <View className="i-mdi-account-tie text-3xl text-white"></View>
          </View>

          {/* HR信息卡片 */}
          <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
            <View className="flex items-center gap-4 mb-4">
              <View className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <View className="i-mdi-account-circle text-4xl text-white"></View>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-white mb-1">张经理</Text>
                <Text className="text-sm text-white/80">HR经理 · 周一至周五 9:00-18:00</Text>
              </View>
            </View>
            <View
              className="bg-white/20 rounded-xl py-3 px-4 flex items-center justify-center active:opacity-70"
              onClick={handleCall}>
              <View className="flex items-center gap-2">
                <View className="i-mdi-phone text-xl text-white"></View>
                <Text className="text-base text-white font-medium">拨打电话</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 标签页切换 */}
        <View className="bg-white border-b border-border px-6 pt-4">
          <View className="flex items-center gap-4">
            <View
              className={`pb-3 px-2 cursor-pointer ${activeTab === 'new' ? 'border-b-2 border-primary' : ''}`}
              onClick={() => setActiveTab('new')}>
              <Text
                className={`text-base font-medium ${activeTab === 'new' ? 'text-primary' : 'text-muted-foreground'}`}>
                新留言
              </Text>
            </View>
            <View
              className={`pb-3 px-2 cursor-pointer ${activeTab === 'history' ? 'border-b-2 border-primary' : ''}`}
              onClick={() => setActiveTab('history')}>
              <Text
                className={`text-base font-medium ${
                  activeTab === 'history' ? 'text-primary' : 'text-muted-foreground'
                }`}>
                留言历史 {messages.length > 0 && `(${messages.length})`}
              </Text>
            </View>
          </View>
        </View>

        {/* 内容区域 */}
        <View className="p-6">
          {activeTab === 'new' ? (
            // 新留言表单
            <View>
              <View className="bg-card rounded-2xl p-6 shadow-sm mb-4">
                <Text className="text-base font-semibold text-foreground mb-4">留言内容</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-muted/30 text-foreground px-4 py-3 rounded-xl border border-border w-full min-h-[200px]"
                    placeholder="请输入您想咨询的问题或反馈的意见..."
                    value={message}
                    onInput={(e) => setMessage(e.detail.value)}
                    maxlength={500}
                  />
                </View>
                <View className="flex items-center justify-between mt-3">
                  <Text className="text-sm text-muted-foreground">{message.length}/500</Text>
                  <Text className="text-xs text-muted-foreground">HR会在1个工作日内回复</Text>
                </View>
              </View>

              <Button
                className="w-full bg-primary text-white py-4 rounded-xl break-keep text-base font-medium"
                size="default"
                onClick={handleSubmit}
                disabled={submitting || !message.trim()}>
                {submitting ? '提交中...' : '提交留言'}
              </Button>

              {/* 温馨提示 */}
              <View className="bg-blue-50 rounded-xl p-4 mt-4">
                <View className="flex items-start gap-3">
                  <View className="i-mdi-information text-xl text-blue-600 mt-0.5"></View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-blue-900 mb-2">温馨提示</Text>
                    <Text className="text-xs text-blue-700 leading-relaxed">
                      • 留言提交后，HR会在1个工作日内回复{'\n'}• 紧急事项请直接拨打电话联系{'\n'}•
                      您可以在"留言历史"中查看回复
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            // 留言历史
            <View>
              {messages.length === 0 ? (
                <View className="text-center py-20">
                  <View className="i-mdi-message-text-outline text-6xl text-muted-foreground mb-4"></View>
                  <Text className="text-muted-foreground">暂无留言记录</Text>
                </View>
              ) : (
                <View className="space-y-4">
                  {messages.map((msg) => {
                    const statusInfo = getStatusInfo(msg.status)
                    return (
                      <View key={msg.id} className="bg-card rounded-2xl p-5 shadow-sm">
                        {/* 留言头部 */}
                        <View className="flex items-center justify-between mb-3">
                          <Text className="text-sm text-muted-foreground">{formatTime(msg.created_at)}</Text>
                          <View className={`${statusInfo.bgColor} rounded-full px-3 py-1`}>
                            <Text className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</Text>
                          </View>
                        </View>

                        {/* 我的留言 */}
                        <View className="bg-primary/5 rounded-xl p-4 mb-3">
                          <View className="flex items-start gap-2 mb-2">
                            <View className="i-mdi-account-circle text-xl text-primary"></View>
                            <Text className="text-sm font-medium text-foreground">我的留言</Text>
                          </View>
                          <Text className="text-sm text-foreground leading-relaxed">{msg.message}</Text>
                        </View>

                        {/* HR回复 */}
                        {msg.reply && (
                          <View className="bg-green-50 rounded-xl p-4">
                            <View className="flex items-start gap-2 mb-2">
                              <View className="i-mdi-account-tie text-xl text-green-600"></View>
                              <View className="flex-1">
                                <Text className="text-sm font-medium text-foreground">HR回复</Text>
                                {msg.replied_at && (
                                  <Text className="text-xs text-muted-foreground mt-1">
                                    {formatTime(msg.replied_at)}
                                  </Text>
                                )}
                              </View>
                            </View>
                            <Text className="text-sm text-foreground leading-relaxed">{msg.reply}</Text>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* 底部间距 */}
        <View className="h-20"></View>
      </ScrollView>
    </View>
  )
}
