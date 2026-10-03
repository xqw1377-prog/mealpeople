/**
 * HR留言管理页面
 *
 * 功能：
 * - 查看所有员工留言
 * - 回复员工留言
 * - 关闭已处理的留言
 * - 留言统计分析
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api-employees'
import {closeHRMessage, getAllHRMessages, replyHRMessage} from '@/db/api-onboarding-enhancement'
import type {HRMessage} from '@/db/types/onboarding-enhancement'
import {useTenantStore} from '@/store/tenant'

// 留言状态类型
type MessageStatus = 'pending' | 'replied' | 'closed'

export default function HRMessageManagement() {
  const {user} = useAuth()
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<HRMessage[]>([])
  const [filteredMessages, setFilteredMessages] = useState<HRMessage[]>([])
  const [activeTab, setActiveTab] = useState<MessageStatus>('pending')
  const [selectedMessage, setSelectedMessage] = useState<HRMessage | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 根据状态过滤留言
  const filterMessagesByStatus = useCallback((allMessages: HRMessage[], status: MessageStatus) => {
    const filtered = allMessages.filter((msg) => msg.status === status)
    setFilteredMessages(filtered)
  }, [])

  // 加载留言列表
  const loadMessages = useCallback(async () => {
    if (!currentTenant || !user) {
      setLoading(false)
      return
    }

    try {
      // 检查是否是HR或管理员
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        Taro.showToast({title: '未找到员工信息', icon: 'none'})
        setLoading(false)
        return
      }

      // 获取所有留言
      const allMessages = await getAllHRMessages(currentTenant.id)
      setMessages(allMessages)

      // 根据当前标签页过滤留言
      filterMessagesByStatus(allMessages, activeTab)
    } catch (error) {
      console.error('加载留言失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user, activeTab, filterMessagesByStatus])

  // 切换标签页
  const handleTabChange = (status: MessageStatus) => {
    setActiveTab(status)
    filterMessagesByStatus(messages, status)
  }

  // 查看留言详情
  const handleViewMessage = (message: HRMessage) => {
    setSelectedMessage(message)
    setReplyContent('')
  }

  // 返回列表
  const handleBackToList = () => {
    setSelectedMessage(null)
    setReplyContent('')
  }

  // 回复留言
  const handleReply = async () => {
    if (!selectedMessage || !user) return

    if (!replyContent.trim()) {
      Taro.showToast({title: '请输入回复内容', icon: 'none'})
      return
    }

    if (replyContent.length > 500) {
      Taro.showToast({title: '回复内容不能超过500字', icon: 'none'})
      return
    }

    try {
      setSubmitting(true)

      await replyHRMessage(selectedMessage.id, {
        reply: replyContent.trim(),
        replied_by: user.id
      })

      Taro.showToast({title: '回复成功', icon: 'success'})

      // 重新加载留言
      await loadMessages()

      // 返回列表
      handleBackToList()
    } catch (error) {
      console.error('回复失败:', error)
      Taro.showToast({title: '回复失败', icon: 'none'})
    } finally {
      setSubmitting(false)
    }
  }

  // 关闭留言
  const handleClose = async (messageId: string) => {
    try {
      await Taro.showModal({
        title: '确认关闭',
        content: '确定要关闭这条留言吗？关闭后将不再显示在待回复列表中。'
      })

      await closeHRMessage(messageId)

      Taro.showToast({title: '已关闭', icon: 'success'})

      // 重新加载留言
      await loadMessages()

      // 如果当前正在查看这条留言，返回列表
      if (selectedMessage?.id === messageId) {
        handleBackToList()
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'errMsg' in error) {
        // 用户取消了操作
        return
      }
      console.error('关闭失败:', error)
      Taro.showToast({title: '关闭失败', icon: 'none'})
    }
  }

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useDidShow(() => {
    loadMessages()
  })

  // 获取状态标签样式
  const getStatusStyle = (status: MessageStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-600'
      case 'replied':
        return 'bg-green-100 text-green-600'
      case 'closed':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  // 获取状态文本
  const getStatusText = (status: MessageStatus) => {
    switch (status) {
      case 'pending':
        return '待回复'
      case 'replied':
        return '已回复'
      case 'closed':
        return '已关闭'
      default:
        return '未知'
    }
  }

  // 渲染留言列表
  const renderMessageList = () => (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #fef2f2, #fee2e2)'}}>
      {/* 头部 */}
      <View className="bg-primary text-white p-6 rounded-b-3xl">
        <View className="flex items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold block mb-2">留言管理</Text>
            <Text className="text-sm opacity-90 block">及时回复员工留言</Text>
          </View>
          <View className="i-mdi-message-text text-5xl opacity-20"></View>
        </View>

        {/* 统计卡片 */}
        <View className="flex gap-2">
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-xs opacity-80 block mb-1">待回复</Text>
            <Text className="text-2xl font-bold block">{messages.filter((m) => m.status === 'pending').length}</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-xs opacity-80 block mb-1">已回复</Text>
            <Text className="text-2xl font-bold block">{messages.filter((m) => m.status === 'replied').length}</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-xs opacity-80 block mb-1">已关闭</Text>
            <Text className="text-2xl font-bold block">{messages.filter((m) => m.status === 'closed').length}</Text>
          </View>
        </View>
      </View>

      {/* 标签页 */}
      <View className="flex bg-white mx-4 mt-4 rounded-xl p-1 shadow-sm">
        <View
          className={`flex-1 text-center py-2 rounded-lg ${activeTab === 'pending' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
          onClick={() => handleTabChange('pending')}>
          <Text className="text-sm font-medium">待回复</Text>
        </View>
        <View
          className={`flex-1 text-center py-2 rounded-lg ${activeTab === 'replied' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
          onClick={() => handleTabChange('replied')}>
          <Text className="text-sm font-medium">已回复</Text>
        </View>
        <View
          className={`flex-1 text-center py-2 rounded-lg ${activeTab === 'closed' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
          onClick={() => handleTabChange('closed')}>
          <Text className="text-sm font-medium">已关闭</Text>
        </View>
      </View>

      {/* 留言列表 */}
      <View className="p-4">
        {loading ? (
          <View className="text-center py-8">
            <Text className="text-muted-foreground">加载中...</Text>
          </View>
        ) : filteredMessages.length === 0 ? (
          <View className="text-center py-8">
            <View className="i-mdi-message-outline text-6xl text-muted-foreground/30 mb-4"></View>
            <Text className="text-muted-foreground block">暂无留言</Text>
          </View>
        ) : (
          filteredMessages.map((message) => (
            <View
              key={message.id}
              className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
              onClick={() => handleViewMessage(message)}>
              <View className="flex items-start justify-between mb-2">
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground block mb-1">
                    员工ID: {message.employee_id.slice(0, 8)}...
                  </Text>
                  <Text className="text-xs text-muted-foreground block">
                    {new Date(message.created_at).toLocaleString('zh-CN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${getStatusStyle(message.status)}`}>
                  <Text className="text-xs font-medium">{getStatusText(message.status)}</Text>
                </View>
              </View>

              <Text className="text-sm text-foreground block mb-3 line-clamp-2">{message.message}</Text>

              <View className="flex items-center justify-between">
                <View className="flex items-center text-muted-foreground">
                  <View className="i-mdi-message-outline text-base mr-1"></View>
                  <Text className="text-xs">{message.message.length} 字</Text>
                </View>
                <View className="flex items-center text-primary">
                  <Text className="text-sm mr-1">查看详情</Text>
                  <View className="i-mdi-chevron-right text-lg"></View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )

  // 渲染留言详情
  const renderMessageDetail = () => {
    if (!selectedMessage) return null

    return (
      <ScrollView
        scrollY
        className="h-screen box-border"
        style={{background: 'linear-gradient(to bottom, #fef2f2, #fee2e2)'}}>
        {/* 头部 */}
        <View className="bg-primary text-white p-6 rounded-b-3xl">
          <View className="flex items-center mb-4" onClick={handleBackToList}>
            <View className="i-mdi-arrow-left text-2xl mr-2"></View>
            <Text className="text-base">返回</Text>
          </View>
          <View className="flex items-center justify-between">
            <View>
              <Text className="text-xl font-bold block mb-2">留言详情</Text>
              <Text className="text-sm opacity-90 block">
                {new Date(selectedMessage.created_at).toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${getStatusStyle(selectedMessage.status)}`}>
              <Text className="text-xs font-medium">{getStatusText(selectedMessage.status)}</Text>
            </View>
          </View>
        </View>

        {/* 留言内容 */}
        <View className="p-4">
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            <Text className="text-sm font-medium text-foreground block mb-2">员工留言</Text>
            <Text className="text-sm text-foreground block leading-relaxed">{selectedMessage.message}</Text>
          </View>

          {/* HR回复 */}
          {selectedMessage.reply && (
            <View className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-200">
              <View className="flex items-center mb-2">
                <View className="i-mdi-account-tie text-lg text-blue-600 mr-2"></View>
                <Text className="text-sm font-medium text-blue-900">HR回复</Text>
              </View>
              <Text className="text-sm text-blue-800 block leading-relaxed mb-2">{selectedMessage.reply}</Text>
              {selectedMessage.replied_at && (
                <Text className="text-xs text-blue-600">
                  回复时间：
                  {new Date(selectedMessage.replied_at).toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              )}
            </View>
          )}

          {/* 回复表单 */}
          {selectedMessage.status === 'pending' && (
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <Text className="text-sm font-medium text-foreground block mb-3">回复留言</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                  placeholder="请输入回复内容（最多500字）"
                  value={replyContent}
                  onInput={(e) => setReplyContent(e.detail.value)}
                  maxlength={500}
                  style={{minHeight: '120px'}}
                />
              </View>
              <View className="flex items-center justify-between mt-2">
                <Text className="text-xs text-muted-foreground">{replyContent.length}/500</Text>
              </View>
              <Button
                className="w-full bg-primary text-white py-3 rounded-xl mt-3 break-keep text-base"
                size="default"
                onClick={handleReply}
                disabled={submitting}>
                {submitting ? '提交中...' : '提交回复'}
              </Button>
            </View>
          )}

          {/* 操作按钮 */}
          {selectedMessage.status !== 'closed' && (
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Button
                className="w-full bg-gray-100 text-foreground py-3 rounded-xl break-keep text-base"
                size="default"
                onClick={() => handleClose(selectedMessage.id)}>
                关闭留言
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    )
  }

  return selectedMessage ? renderMessageDetail() : renderMessageList()
}
