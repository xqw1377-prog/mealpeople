import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {
  approveTenantApplication,
  getAllTenantApplications,
  getPendingTenantApplications,
  rejectTenantApplication
} from '@/db/api'
import type {Tenant, TenantApplication} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const SuperAdminTenants: React.FC = () => {
  const {user} = useAuth({guard: true})
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant)

  // 标签页状态
  const [activeTab, setActiveTab] = useState<'tenants' | 'applications'>('tenants')

  // 租户列表状态
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // 申请列表状态
  const [applications, setApplications] = useState<TenantApplication[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(true)
  const [showAllApplications, setShowAllApplications] = useState(false)

  // 表单数据
  const [tenantName, setTenantName] = useState('')
  const [adminPhone, setAdminPhone] = useState('')
  const [_industry, _setIndustry] = useState('')
  const [_packageType, _setPackageType] = useState('basic')

  // 行业选项
  const industryOptions = [['火锅', '快餐', '咖啡', '茶饮', '烘焙', '其他']]
  const [industryIndex, setIndustryIndex] = useState([0])

  // 套餐选项
  const packageOptions = [['基础版', '标准版', '企业版']]
  const [packageIndex, setPackageIndex] = useState([0])

  // 加载租户列表
  const loadTenants = useCallback(async () => {
    try {
      setLoading(true)
      const {data, error} = await supabase.from('tenants').select('*').order('created_at', {ascending: false})

      if (error) throw error

      setTenants(data || [])
    } catch (error) {
      console.error('加载租户列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // 加载申请列表
  const loadApplications = useCallback(async () => {
    try {
      setApplicationsLoading(true)
      const data = showAllApplications ? await getAllTenantApplications() : await getPendingTenantApplications()
      setApplications(data)
    } catch (error) {
      console.error('加载申请列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setApplicationsLoading(false)
    }
  }, [showAllApplications])

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  useEffect(() => {
    if (activeTab === 'applications') {
      loadApplications()
    }
  }, [activeTab, loadApplications])

  // 创建租户
  const handleCreateTenant = async () => {
    if (!tenantName.trim()) {
      Taro.showToast({
        title: '请输入租户名称',
        icon: 'none'
      })
      return
    }

    if (!adminPhone.trim()) {
      Taro.showToast({
        title: '请输入管理员电话',
        icon: 'none'
      })
      return
    }

    // 验证电话号码格式
    const cleanPhone = adminPhone.replace(/^\+86/, '').replace(/\s/g, '')
    if (!/^1[3-9]\d{9}$/.test(cleanPhone)) {
      Taro.showToast({
        title: '电话号码格式不正确',
        icon: 'none'
      })
      return
    }

    try {
      Taro.showLoading({title: '创建中...'})

      const {data: sessionData} = await supabase.auth.getSession()
      if (!sessionData.session) {
        throw new Error('未登录')
      }

      const response = await fetch(`${process.env.TARO_APP_SUPABASE_URL}/functions/v1/super-admin-create-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({
          tenantName: tenantName.trim(),
          adminPhone: cleanPhone,
          industry: industryOptions[0][industryIndex[0]],
          packageType: packageIndex[0] === 0 ? 'basic' : packageIndex[0] === 1 ? 'standard' : 'enterprise'
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '创建失败')
      }

      Taro.hideLoading()
      Taro.showToast({
        title: '创建成功',
        icon: 'success'
      })

      // 重置表单
      setTenantName('')
      setAdminPhone('')
      setIndustryIndex([0])
      setPackageIndex([0])
      setShowCreateForm(false)

      // 刷新列表
      loadTenants()
    } catch (error) {
      Taro.hideLoading()
      console.error('创建租户失败:', error)
      Taro.showToast({
        title: error instanceof Error ? error.message : '创建失败',
        icon: 'none',
        duration: 3000
      })
    }
  }

  // 进入租户系统
  const handleEnterTenant = async (tenant: Tenant) => {
    try {
      // 设置当前租户
      setCurrentTenant(tenant)

      Taro.showToast({
        title: `已切换到${tenant.name}`,
        icon: 'success'
      })

      // 跳转到员工工作台
      setTimeout(() => {
        Taro.switchTab({url: '/pages/index/index'})
      }, 1000)
    } catch (error) {
      console.error('进入租户系统失败:', error)
      Taro.showToast({
        title: '进入失败',
        icon: 'error'
      })
    }
  }

  // 查看租户详情
  const handleViewTenant = (tenant: Tenant) => {
    Taro.showModal({
      title: tenant.name,
      content: `管理员电话：${tenant.admin_phone || '未设置'}\n行业：${tenant.industry || '未设置'}\n套餐：${tenant.package_type}\n状态：${tenant.status === 'active' ? '活跃' : '停用'}\n店铺数：${tenant.store_count}\n员工数：${tenant.employee_count}`,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '进入系统',
      success: (res) => {
        if (res.confirm) {
          handleEnterTenant(tenant)
        }
      }
    })
  }

  // 批准申请
  const handleApproveApplication = async (application: TenantApplication) => {
    if (!user) return

    Taro.showModal({
      title: '确认批准',
      content: `确认批准"${application.tenant_name}"的租户申请吗？`,
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({title: '处理中...'})
          try {
            const result = await approveTenantApplication(application.id, user.id)

            Taro.hideLoading()

            if (result.success) {
              Taro.showToast({
                title: '已批准',
                icon: 'success'
              })
              // 重新加载列表
              loadApplications()
              loadTenants()
            } else {
              Taro.showToast({
                title: result.message,
                icon: 'none'
              })
            }
          } catch (error) {
            Taro.hideLoading()
            console.error('批准申请失败:', error)
            Taro.showToast({
              title: '批准失败',
              icon: 'error'
            })
          }
        }
      }
    })
  }

  // 拒绝申请
  const handleRejectApplication = async (application: TenantApplication) => {
    if (!user) return

    // 使用 showActionSheet 让用户选择拒绝原因
    Taro.showActionSheet({
      itemList: ['信息不完整', '不符合要求', '重复申请', '其他原因'],
      success: async (res) => {
        const reasons = ['信息不完整', '不符合要求', '重复申请', '其他原因']
        const rejectionReason = reasons[res.tapIndex]

        Taro.showLoading({title: '处理中...'})
        try {
          const result = await rejectTenantApplication(application.id, user.id, rejectionReason)

          Taro.hideLoading()

          if (result.success) {
            Taro.showToast({
              title: '已拒绝',
              icon: 'success'
            })
            // 重新加载列表
            loadApplications()
          } else {
            Taro.showToast({
              title: result.message,
              icon: 'none'
            })
          }
        } catch (error) {
          Taro.hideLoading()
          console.error('拒绝申请失败:', error)
          Taro.showToast({
            title: '拒绝失败',
            icon: 'error'
          })
        }
      }
    })
  }

  // 查看申请详情
  const handleViewApplication = (application: TenantApplication) => {
    const statusText =
      application.status === 'pending' ? '待审核' : application.status === 'approved' ? '已批准' : '已拒绝'
    const content = `申请人电话：${application.applicant_phone}\n行业：${application.industry}\n公司地址：${application.company_address}\n联系人：${application.contact_person}\n联系电话：${application.contact_phone}\n状态：${statusText}${application.rejection_reason ? `\n拒绝原因：${application.rejection_reason}` : ''}`

    Taro.showModal({
      title: application.tenant_name,
      content,
      showCancel: false
    })
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
        return 'bg-gray-50 text-gray-600'
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-800">超级管理员</Text>
          {activeTab === 'tenants' && (
            <Button
              className="bg-blue-100 text-white px-4 py-2 rounded-lg text-sm"
              onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? '取消' : '创建租户'}
            </Button>
          )}
          {activeTab === 'applications' && (
            <Button
              className="bg-gray-500 text-blue-600 px-4 py-2 rounded-lg text-sm"
              onClick={() => {
                setShowAllApplications(!showAllApplications)
                loadApplications()
              }}>
              {showAllApplications ? '仅待审核' : '全部申请'}
            </Button>
          )}
        </View>

        {/* 标签页 */}
        <View className="flex">
          <View
            className={`flex-1 text-center py-3 ${activeTab === 'tenants' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('tenants')}>
            <Text className={`text-base ${activeTab === 'tenants' ? 'text-blue-500 font-bold' : 'text-gray-600'}`}>
              租户列表
            </Text>
          </View>
          <View
            className={`flex-1 text-center py-3 ${activeTab === 'applications' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('applications')}>
            <Text className={`text-base ${activeTab === 'applications' ? 'text-blue-500 font-bold' : 'text-gray-600'}`}>
              租户申请
              {applications.filter((app) => app.status === 'pending').length > 0 && (
                <Text className="text-xs text-red-500 ml-1">
                  ({applications.filter((app) => app.status === 'pending').length})
                </Text>
              )}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView scrollY className="h-screen">
        {activeTab === 'tenants' ? (
          <>
            {/* 创建表单 */}
            {showCreateForm && (
              <View className="bg-white m-4 p-4 rounded-lg shadow-sm">
                <Text className="text-base font-bold text-gray-800 mb-4">创建新租户</Text>

                <View className="mb-4">
                  <Text className="text-sm text-gray-600 mb-2">租户名称 *</Text>
                  <Input
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="请输入租户名称"
                    value={tenantName}
                    onInput={(e) => setTenantName(e.detail.value)}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm text-gray-600 mb-2">管理员电话 *</Text>
                  <Input
                    className="border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="请输入11位手机号"
                    type="number"
                    maxlength={11}
                    value={adminPhone}
                    onInput={(e) => setAdminPhone(e.detail.value)}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm text-gray-600 mb-2">行业类型</Text>
                  <Picker
                    mode="selector"
                    range={industryOptions[0]}
                    value={industryIndex[0]}
                    onChange={(e) => setIndustryIndex([Number(e.detail.value)])}>
                    <View className="border border-gray-300 rounded-lg px-3 py-2">
                      <Text>{industryOptions[0][industryIndex[0]]}</Text>
                    </View>
                  </Picker>
                </View>

                <View className="mb-4">
                  <Text className="text-sm text-gray-600 mb-2">套餐类型</Text>
                  <Picker
                    mode="selector"
                    range={packageOptions[0]}
                    value={packageIndex[0]}
                    onChange={(e) => setPackageIndex([Number(e.detail.value)])}>
                    <View className="border border-gray-300 rounded-lg px-3 py-2">
                      <Text>{packageOptions[0][packageIndex[0]]}</Text>
                    </View>
                  </Picker>
                </View>

                <Button
                  className="bg-blue-100 text-white w-full py-3 rounded-lg font-bold"
                  onClick={handleCreateTenant}>
                  确认创建
                </Button>
              </View>
            )}

            {/* 租户列表 */}
            <View className="p-4">
              {loading ? (
                <View className="text-center py-8">
                  <Text className="text-gray-500">加载中...</Text>
                </View>
              ) : tenants.length === 0 ? (
                <View className="text-center py-8">
                  <Text className="text-gray-500">暂无租户</Text>
                </View>
              ) : (
                tenants.map((tenant) => (
                  <View
                    key={tenant.id}
                    className="bg-white p-4 rounded-lg shadow-sm mb-3"
                    onClick={() => handleViewTenant(tenant)}>
                    <View className="flex items-center justify-between mb-2">
                      <Text className="text-base font-bold text-gray-800">{tenant.name}</Text>
                      <View
                        className={`px-2 py-1 rounded ${tenant.status === 'active' ? 'bg-green-100' : 'bg-gray-50'}`}>
                        <Text
                          className={`text-xs ${tenant.status === 'active' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                          {tenant.status === 'active' ? '活跃' : '停用'}
                        </Text>
                      </View>
                    </View>

                    <View className="space-y-1">
                      <Text className="text-sm text-gray-600">管理员：{tenant.admin_phone || '未设置'}</Text>
                      <Text className="text-sm text-gray-600">
                        行业：{tenant.industry || '未设置'} | 套餐：{tenant.package_type}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        店铺：{tenant.store_count} | 员工：{tenant.employee_count}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        创建时间：{new Date(tenant.created_at).toLocaleString('zh-CN')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <>
            {/* 申请列表 */}
            <View className="p-4">
              {applicationsLoading ? (
                <View className="text-center py-8">
                  <Text className="text-gray-500">加载中...</Text>
                </View>
              ) : applications.length === 0 ? (
                <View className="text-center py-8">
                  <Text className="text-gray-500">{showAllApplications ? '暂无申请记录' : '暂无待审核申请'}</Text>
                </View>
              ) : (
                applications.map((application) => (
                  <View
                    key={application.id}
                    className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-3 shadow-sm"
                    onClick={() => handleViewApplication(application)}>
                    <View className="flex items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-bold text-gray-800 mb-1">{application.tenant_name}</Text>
                        <Text className="text-sm text-gray-600 mb-1">行业：{application.industry}</Text>
                        <Text className="text-sm text-gray-600 mb-1">联系人：{application.contact_person}</Text>
                        <Text className="text-sm text-gray-600">联系电话：{application.contact_phone}</Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${getStatusColor(application.status)}`}>
                        <Text className="text-xs font-medium">{getStatusText(application.status)}</Text>
                      </View>
                    </View>

                    <View className="border-t border-gray-100 pt-3">
                      <Text className="text-xs text-gray-500 mb-2">
                        申请时间：{new Date(application.created_at).toLocaleString('zh-CN')}
                      </Text>

                      {application.status === 'pending' && (
                        <View className="flex gap-2">
                          <Button
                            className="flex-1 bg-blue-100 text-white rounded-lg py-2 text-sm break-keep"
                            size="default"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApproveApplication(application)
                            }}>
                            批准
                          </Button>
                          <Button
                            className="flex-1 bg-blue-100 text-white rounded-lg py-2 text-sm break-keep"
                            size="default"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRejectApplication(application)
                            }}>
                            拒绝
                          </Button>
                        </View>
                      )}

                      {application.status === 'rejected' && application.rejection_reason && (
                        <View className="bg-blue-100 p-2 rounded">
                          <Text className="text-xs text-red-600">拒绝原因：{application.rejection_reason}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

export default SuperAdminTenants
