import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getUserTenantApplications} from '@/db/api'
import type {TenantApplication} from '@/db/types'

const MyApplications: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [applications, setApplications] = useState<TenantApplication[]>([])
  const [loading, setLoading] = useState(true)

  // 加载申请列表
  const loadApplications = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const data = await getUserTenantApplications(user.id)
      setApplications(data)
    } catch (error) {
      console.error('加载申请列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadApplications()
  })

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
        return status
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-600'
      case 'approved':
        return 'bg-green-100 text-muted-foreground'
      case 'rejected':
        return 'bg-red-100 text-red-600'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  // 查看申请详情
  const handleViewApplication = (application: TenantApplication) => {
    const statusText = getStatusText(application.status)
    const content = `租户名称：${application.tenant_name}\n行业：${application.industry}\n公司地址：${application.company_address}\n联系人：${application.contact_person}\n联系电话：${application.contact_phone}\n状态：${statusText}\n申请时间：${new Date(application.created_at).toLocaleString('zh-CN')}${application.rejection_reason ? `\n拒绝原因：${application.rejection_reason}` : ''}${application.reviewed_at ? `\n审核时间：${new Date(application.reviewed_at).toLocaleString('zh-CN')}` : ''}`

    Taro.showModal({
      title: '申请详情',
      content,
      showCancel: false
    })
  }

  // 创建新申请
  const handleCreateApplication = () => {
    Taro.navigateTo({url: '/packageD/pages/create-tenant/index'})
  }

  return (
    <View className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 头部 */}
      <View className="bg-white px-4 py-3 shadow-sm">
        <View className="flex items-center justify-between">
          <Text className="text-lg font-bold text-foreground">我的申请</Text>
          <Button
            className="bg-blue-100 text-white px-4 py-2 rounded-lg text-sm break-keep"
            size="default"
            onClick={handleCreateApplication}>
            创建申请
          </Button>
        </View>
      </View>

      <ScrollView scrollY className="h-screen">
        <View className="p-4">
          {loading ? (
            <View className="text-center py-8">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : applications.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
              <Text className="text-muted-foreground block mb-4">暂无申请记录</Text>
              <Text className="text-sm text-muted-foreground block mb-6">点击右上角"创建申请"按钮提交租户申请</Text>
              <Button
                className="bg-blue-100 text-white px-6 py-3 rounded-xl text-base break-keep"
                size="default"
                onClick={handleCreateApplication}>
                创建我的租户
              </Button>
            </View>
          ) : (
            applications.map((application) => (
              <View
                key={application.id}
                className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-3 shadow-sm"
                onClick={() => handleViewApplication(application)}>
                <View className="flex items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground mb-2">{application.tenant_name}</Text>
                    <Text className="text-sm text-muted-foreground mb-1">行业：{application.industry}</Text>
                    <Text className="text-sm text-muted-foreground mb-1">联系人：{application.contact_person}</Text>
                    <Text className="text-sm text-muted-foreground">联系电话：{application.contact_phone}</Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${getStatusColor(application.status)}`}>
                    <Text className="text-xs font-medium">{getStatusText(application.status)}</Text>
                  </View>
                </View>

                <View className="border-t border-border pt-3">
                  <Text className="text-xs text-muted-foreground mb-2">
                    申请时间：{new Date(application.created_at).toLocaleString('zh-CN')}
                  </Text>

                  {application.status === 'pending' && (
                    <View className="bg-blue-100 p-3 rounded-lg">
                      <Text className="text-sm text-yellow-800">⏳ 申请审核中，请耐心等待超级管理员审核</Text>
                    </View>
                  )}

                  {application.status === 'approved' && (
                    <View className="bg-blue-100 p-3 rounded-lg">
                      <Text className="text-sm text-green-600 block mb-1">✅ 申请已批准</Text>
                      <Text className="text-xs text-muted-foreground">您已成为租户管理员，可以开始使用系统功能</Text>
                    </View>
                  )}

                  {application.status === 'rejected' && application.rejection_reason && (
                    <View className="bg-blue-100 p-3 rounded-lg">
                      <Text className="text-sm text-red-600 block mb-2">❌ 申请已拒绝</Text>
                      <Text className="text-xs text-red-600">拒绝原因：{application.rejection_reason}</Text>
                      <Button
                        className="mt-3 bg-blue-100 text-white rounded-lg py-2 text-sm break-keep"
                        size="default"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCreateApplication()
                        }}>
                        重新申请
                      </Button>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default MyApplications
