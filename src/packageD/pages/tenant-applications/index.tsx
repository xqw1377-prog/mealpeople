/**
 * 租户申请管理页面
 * 用于超级管理员查看和处理租户加入申请
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {EmptyState} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {approveTenantApplication, getAllTenantApplications, rejectTenantApplication} from '@/db/api'
import type {TenantApplication} from '@/db/types'

export default function TenantApplications() {
  const {user} = useAuth({guard: true})
  const [applications, setApplications] = useState<TenantApplication[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  // 拒绝申请相关状态
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingApplication, setRejectingApplication] = useState<TenantApplication | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // 加载申请列表
  const loadApplications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllTenantApplications()
      setApplications(data)
    } catch (error) {
      console.error('加载申请列表失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // 页面显示时加载数据
  useDidShow(() => {
    loadApplications()
  })

  // 下拉刷新
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadApplications()
  }, [loadApplications])

  // 筛选申请
  const filteredApplications = applications.filter((app) => {
    if (filter === 'all') return true
    return app.status === filter
  })

  // 获取待审核数量
  const pendingCount = applications.filter((app) => app.status === 'pending').length

  // 批准申请
  const handleApprove = async (application: TenantApplication) => {
    if (!user?.id) return

    const result = await Taro.showModal({
      title: '确认批准',
      content: `确定要批准 "${application.tenant_name}" 的租户申请吗？`,
      confirmText: '批准',
      cancelText: '取消'
    })

    if (!result.confirm) return

    Taro.showLoading({title: '处理中...'})
    try {
      const response = await approveTenantApplication(application.id, user.id)
      Taro.hideLoading()

      if (response.success) {
        Taro.showToast({title: '批准成功', icon: 'success'})
        loadApplications()
      } else {
        Taro.showToast({title: response.message || '批准失败', icon: 'none'})
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('批准申请失败:', error)
      Taro.showToast({title: '批准失败', icon: 'none'})
    }
  }

  // 打开拒绝弹窗
  const handleRejectClick = (application: TenantApplication) => {
    setRejectingApplication(application)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  // 确认拒绝
  const handleRejectConfirm = async () => {
    if (!user?.id || !rejectingApplication) return

    if (!rejectionReason.trim()) {
      Taro.showToast({title: '请输入拒绝原因', icon: 'none'})
      return
    }

    Taro.showLoading({title: '处理中...'})
    try {
      const response = await rejectTenantApplication(rejectingApplication.id, user.id, rejectionReason)
      Taro.hideLoading()

      if (response.success) {
        Taro.showToast({title: '已拒绝', icon: 'success'})
        setShowRejectModal(false)
        setRejectingApplication(null)
        setRejectionReason('')
        loadApplications()
      } else {
        Taro.showToast({title: response.message || '拒绝失败', icon: 'none'})
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('拒绝申请失败:', error)
      Taro.showToast({title: '拒绝失败', icon: 'none'})
    }
  }

  // 取消拒绝
  const handleRejectCancel = () => {
    setShowRejectModal(false)
    setRejectingApplication(null)
    setRejectionReason('')
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 获取状态标签样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'approved':
        return 'bg-green-100 text-green-600'
      case 'rejected':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-muted text-foreground'
    }
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审核'
      case 'approved':
        return '已批准'
      case 'rejected':
        return '已拒绝'
      default:
        return '未知'
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen box-border bg-transparent"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4">
          {/* 头部统计 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-between mb-3">
              <Text className="text-base font-bold text-foreground">租户申请管理</Text>
              {pendingCount > 0 && (
                <View className="bg-blue-100 rounded-full px-3 py-1">
                  <Text className="text-xs text-foreground font-bold">{pendingCount} 条待审核</Text>
                </View>
              )}
            </View>
            <View className="flex items-center gap-2">
              <View className="i-mdi-file-document-multiple text-base text-muted-foreground" />
              <Text className="text-sm text-muted-foreground">共 {applications.length} 条申请</Text>
            </View>
          </View>

          {/* 筛选标签 */}
          <View className="bg-white rounded-xl p-3 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center gap-2">
              <Button
                className={`flex-1 text-xs break-keep py-2 ${filter === 'pending' ? 'bg-blue-100 text-white' : 'bg-muted text-foreground'}`}
                size="mini"
                onClick={() => setFilter('pending')}>
                待审核
              </Button>
              <Button
                className={`flex-1 text-xs break-keep py-2 ${filter === 'approved' ? 'bg-blue-100 text-white' : 'bg-muted text-foreground'}`}
                size="mini"
                onClick={() => setFilter('approved')}>
                已批准
              </Button>
              <Button
                className={`flex-1 text-xs break-keep py-2 ${filter === 'rejected' ? 'bg-blue-100 text-white' : 'bg-muted text-foreground'}`}
                size="mini"
                onClick={() => setFilter('rejected')}>
                已拒绝
              </Button>
              <Button
                className={`flex-1 text-xs break-keep py-2 ${filter === 'all' ? 'bg-blue-100 text-white' : 'bg-muted text-foreground'}`}
                size="mini"
                onClick={() => setFilter('all')}>
                全部
              </Button>
            </View>
          </View>

          {/* 加载状态 */}
          {loading && (
            <View className="text-center py-8">
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          )}

          {/* 申请列表 */}
          {loading ? (
            <SkeletonList count={5} />
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              icon="i-mdi-inbox"
              title="暂无申请"
              description={filter === 'pending' ? '暂无待审核的申请' : `暂无${getStatusText(filter)}的申请`}
            />
          ) : (
            filteredApplications.map((application) => (
              <View key={application.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-3 shadow-sm">
                {/* 申请头部 */}
                <View className="flex items-center justify-between mb-3">
                  <Text className="text-base font-bold text-foreground">{application.tenant_name}</Text>
                  <View className={`px-3 py-1 rounded-full ${getStatusStyle(application.status)}`}>
                    <Text className="text-xs font-semibold">{getStatusText(application.status)}</Text>
                  </View>
                </View>

                {/* 申请信息 */}
                <View className="space-y-2 mb-3">
                  <View className="flex items-start">
                    <View className="i-mdi-domain text-base text-muted-foreground mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground block mb-0.5">行业类型</Text>
                      <Text className="text-sm text-foreground">{application.industry || '未填写'}</Text>
                    </View>
                  </View>

                  <View className="flex items-start">
                    <View className="i-mdi-account text-base text-muted-foreground mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground block mb-0.5">联系人</Text>
                      <Text className="text-sm text-foreground">{application.contact_person || '未填写'}</Text>
                    </View>
                  </View>

                  <View className="flex items-start">
                    <View className="i-mdi-phone text-base text-muted-foreground mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground block mb-0.5">联系电话</Text>
                      <Text className="text-sm text-foreground">{application.contact_phone || '未填写'}</Text>
                    </View>
                  </View>

                  {application.description && (
                    <View className="flex items-start">
                      <View className="i-mdi-text text-base text-muted-foreground mr-2 mt-0.5" />
                      <View className="flex-1">
                        <Text className="text-xs text-muted-foreground block mb-0.5">申请说明</Text>
                        <Text className="text-sm text-foreground">{application.description}</Text>
                      </View>
                    </View>
                  )}

                  <View className="flex items-start">
                    <View className="i-mdi-clock-outline text-base text-muted-foreground mr-2 mt-0.5" />
                    <View className="flex-1">
                      <Text className="text-xs text-muted-foreground block mb-0.5">申请时间</Text>
                      <Text className="text-sm text-foreground">{formatDate(application.created_at)}</Text>
                    </View>
                  </View>

                  {application.status === 'rejected' && application.rejection_reason && (
                    <View className="flex items-start">
                      <View className="i-mdi-alert-circle text-base text-red-500 mr-2 mt-0.5" />
                      <View className="flex-1">
                        <Text className="text-xs text-red-500 block mb-0.5">拒绝原因</Text>
                        <Text className="text-sm text-red-600">{application.rejection_reason}</Text>
                      </View>
                    </View>
                  )}

                  {application.reviewed_at && (
                    <View className="flex items-start">
                      <View className="i-mdi-check-circle text-base text-muted-foreground mr-2 mt-0.5" />
                      <View className="flex-1">
                        <Text className="text-xs text-muted-foreground block mb-0.5">审核时间</Text>
                        <Text className="text-sm text-foreground">{formatDate(application.reviewed_at)}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* 操作按钮 */}
                {application.status === 'pending' && (
                  <View className="flex gap-2 pt-3 border-t border-gray-100">
                    <Button
                      className="flex-1 bg-blue-100 text-white rounded-lg text-sm break-keep py-2"
                      size="mini"
                      onClick={() => handleApprove(application)}>
                      <View className="flex items-center justify-center gap-1">
                        <View className="i-mdi-check text-base" />
                        <Text>批准</Text>
                      </View>
                    </Button>
                    <Button
                      className="flex-1 bg-blue-100 text-white rounded-lg text-sm break-keep py-2"
                      size="mini"
                      onClick={() => handleRejectClick(application)}>
                      <View className="flex items-center justify-center gap-1">
                        <View className="i-mdi-close text-base" />
                        <Text>拒绝</Text>
                      </View>
                    </Button>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 拒绝申请弹窗 */}
      {showRejectModal && (
        <View
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{background: 'rgba(0, 0, 0, 0.5)'}}>
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mx-4 w-full max-w-md">
            <Text className="text-lg font-bold text-foreground block mb-4">拒绝申请</Text>

            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">租户名称：{rejectingApplication?.tenant_name}</Text>
              <Text className="text-sm text-muted-foreground block mb-3">请输入拒绝原因：</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm"
                  placeholder="请输入拒绝原因（必填）"
                  value={rejectionReason}
                  onInput={(e) => setRejectionReason(e.detail.value)}
                  maxlength={200}
                  style={{minHeight: '100px'}}
                />
              </View>
              <Text className="text-xs text-muted-foreground block mt-1">{rejectionReason.length}/200</Text>
            </View>

            <View className="flex gap-3">
              <Button
                className="flex-1 bg-muted text-foreground rounded-lg text-sm break-keep py-3"
                size="default"
                onClick={handleRejectCancel}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white rounded-lg text-sm break-keep py-3"
                size="default"
                onClick={handleRejectConfirm}>
                确认拒绝
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
