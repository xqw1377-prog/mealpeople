import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {showToast, switchTab} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getCurrentUser, getTenants} from '@/db/api'
import type {Tenant} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const TenantSelect: React.FC = () => {
  const {user, logout} = useAuth({guard: true})
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [errorInfo, setErrorInfo] = useState<string>('')

  // 延迟获取 store 方法，确保 React 上下文已初始化
  const [storeReady, setStoreReady] = useState(false)

  useEffect(() => {
    // 在组件挂载后标记 store 为可用
    setStoreReady(true)
  }, [])

  const handleSelectTenant = useCallback(
    (tenant: Tenant) => {
      if (!storeReady) {
        console.warn('Store 尚未就绪')
        return
      }

      console.log('=== 开始选择租户 ===', {
        租户ID: tenant.id,
        租户名称: tenant.name,
        门店数量: tenant.store_count,
        员工数量: tenant.employee_count
      })

      const {setCurrentTenant, setCurrentStore} = useTenantStore.getState()

      // 🔥 切换租户时，清空当前门店状态
      console.log('=== 切换租户，清空门店状态 ===')
      setCurrentStore(null)

      // 设置新租户
      console.log('=== 设置新租户到 Store ===')
      setCurrentTenant(tenant)

      // 验证租户是否设置成功
      const currentTenant = useTenantStore.getState().currentTenant
      console.log('=== 验证租户设置 ===', {
        设置成功: !!currentTenant,
        租户ID: currentTenant?.id,
        租户名称: currentTenant?.name
      })

      // 🔥 发送租户切换事件，通知其他页面
      console.log('=== 发送租户切换事件 ===', {
        tenantId: tenant.id,
        tenantName: tenant.name,
        timestamp: Date.now()
      })
      Taro.eventCenter.trigger('tenantChanged', {
        tenant: tenant,
        timestamp: Date.now()
      })

      showToast({title: `已选择 ${tenant.name}`, icon: 'success'})

      console.log('=== 准备跳转到员工工作台 ===')
      setTimeout(() => {
        console.log('=== 执行跳转到员工工作台 ===')
        switchTab({url: '/pages/index/index'})
          .then(() => {
            console.log('=== 跳转成功 ===')
          })
          .catch((error) => {
            console.error('=== 跳转失败 ===', error)
            showToast({
              title: '跳转失败，请重试',
              icon: 'none',
              duration: 2000
            })
          })
      }, 500)
    },
    [storeReady]
  )

  const loadData = useCallback(async () => {
    if (!user || !storeReady) return

    setLoading(true)
    setErrorInfo('')
    try {
      console.log('🔍 开始加载租户数据...')
      console.log('👤 当前用户 ID:', user.id)

      // 先获取用户信息
      const userData = await getCurrentUser()
      console.log('👤 用户数据:', userData)

      if (userData) {
        const {setCurrentUser} = useTenantStore.getState()
        setCurrentUser(userData)

        console.log('🏢 用户的 tenant_id:', userData.tenant_id)
        console.log('👤 用户的角色:', userData.role)

        // 如果用户已有租户，直接获取该租户信息
        if (userData.tenant_id) {
          console.log('🔍 查询用户的租户...')

          // 直接查询用户的租户
          const {data: userTenant, error: tenantError} = await supabase
            .from('tenants')
            .select('*')
            .eq('id', userData.tenant_id)
            .maybeSingle()

          console.log('🏢 直接查询租户结果:', {tenant: userTenant, error: tenantError?.message})

          if (tenantError) {
            console.error('❌ 查询租户失败:', tenantError)
            setErrorInfo(`查询租户失败: ${tenantError.message}`)
          }

          if (userTenant) {
            console.log('✅ 找到用户的租户:', userTenant.name)
            setTenants([userTenant])
            handleSelectTenant(userTenant)
            return
          } else {
            console.warn('⚠️ 未找到用户的租户')
            setErrorInfo(
              `未找到租户信息\n\n用户ID: ${user.id}\n租户ID: ${userData.tenant_id}\n角色: ${userData.role}\n\n可能原因：\n1. 租户已被删除\n2. 数据库权限问题\n3. 租户状态异常`
            )

            // 尝试使用 getTenants 查询
            console.log('🔄 尝试使用 getTenants 查询...')
            const tenantsData = await getTenants()
            console.log('🏢 getTenants 查询结果:', tenantsData)
            setTenants(tenantsData)
          }
        } else {
          console.warn('⚠️ 用户没有 tenant_id')
          setErrorInfo(
            `用户未关联租户\n\n用户ID: ${user.id}\n电话: ${userData.phone || '未设置'}\n角色: ${userData.role}\n\n请联系管理员分配租户`
          )

          // 尝试获取所有租户
          const tenantsData = await getTenants()
          console.log('🏢 查询到的租户列表:', tenantsData)
          setTenants(tenantsData)
        }
      } else {
        console.error('❌ 未获取到用户数据')
        setErrorInfo('未获取到用户数据，请重新登录')
      }
    } catch (error) {
      console.error('❌ 加载数据失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setErrorInfo(`加载失败: ${errorMessage}`)
      showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [user, storeReady, handleSelectTenant])

  useEffect(() => {
    if (storeReady) {
      loadData()
    }
  }, [storeReady, loadData])

  if (loading) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-lg">
          <View className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <View className="i-mdi-loading text-4xl text-blue-600 animate-spin" />
          </View>
          <Text className="text-foreground text-center font-medium">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6 bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <View className="flex items-center gap-3">
              <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <View className="i-mdi-office-building text-3xl text-blue-600" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-foreground">选择租户</Text>
                <Text className="text-sm text-muted-foreground">请选择您要管理的租户</Text>
              </View>
            </View>
          </View>

          {tenants.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 shadow-md text-center">
              <View className="w-24 h-24 rounded-lg bg-gray-50 border-2 border-gray-200 flex items-center justify-center mx-auto mb-6">
                <View className="i-mdi-office-building text-6xl text-muted-foreground" />
              </View>
              <Text className="text-xl font-bold text-foreground mb-2">暂无可用租户</Text>
              <Text className="text-sm text-muted-foreground mb-6">请联系管理员添加租户或刷新列表</Text>

              {errorInfo && (
                <View className="bg-blue-100 rounded-lg p-4 mb-6">
                  <View className="flex items-start gap-2">
                    <View className="i-mdi-alert-circle text-xl text-red-600 flex-shrink-0 mt-0.5" />
                    <Text className="text-sm text-red-600 text-left flex-1">{errorInfo}</Text>
                  </View>
                </View>
              )}

              <View className="space-y-3">
                <Button
                  className="w-full bg-blue-100 text-white py-4 rounded-lg break-keep text-base"
                  size="default"
                  onClick={() => {
                    console.log('🔄 手动刷新租户列表')
                    loadData()
                  }}>
                  <View className="flex items-center justify-center gap-2">
                    <View className="i-mdi-refresh text-xl text-foreground" />
                    <Text className="text-blue-600">刷新租户列表</Text>
                  </View>
                </Button>

                <Button
                  className="w-full bg-gray-500 text-white py-4 rounded-lg break-keep text-base"
                  size="default"
                  onClick={() => {
                    console.log('🚪 退出登录')
                    logout()
                  }}>
                  <View className="flex items-center justify-center gap-2">
                    <View className="i-mdi-logout text-xl text-white" />
                    <Text className="text-white">退出登录</Text>
                  </View>
                </Button>
              </View>

              {user && (
                <View className="mt-6 bg-gray-50 rounded-lg p-4">
                  <Text className="text-xs text-muted-foreground font-bold mb-2">调试信息</Text>
                  <Text className="text-xs text-muted-foreground">用户ID: {user.id}</Text>
                  <Text className="text-xs text-muted-foreground">
                    电话: {user.phone || user.user_metadata?.phone || '未设置'}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View className="space-y-4 mb-20">
              {tenants.map((tenant) => (
                <View
                  key={tenant.id}
                  className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-md active:opacity-70 transition-all"
                  onClick={() => handleSelectTenant(tenant)}>
                  {/* 租户头部 */}
                  <View className="flex items-start justify-between mb-4">
                    <View className="flex items-center gap-3 flex-1">
                      <View className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <View className="i-mdi-office-building text-3xl text-blue-600" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-foreground mb-1">{tenant.name}</Text>
                        {tenant.industry && <Text className="text-sm text-muted-foreground">{tenant.industry}</Text>}
                      </View>
                    </View>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        tenant.status === 'active' ? 'bg-blue-100' : 'bg-gray-400'
                      } flex-shrink-0`}>
                      <Text className="text-xs text-foreground font-bold">
                        {tenant.status === 'active' ? '运营中' : '已停用'}
                      </Text>
                    </View>
                  </View>

                  {/* 统计信息 */}
                  <View className="flex items-center gap-6 mb-4">
                    <View className="flex items-center gap-2">
                      <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <View className="i-mdi-store text-lg text-blue-600" />
                      </View>
                      <Text className="text-sm text-foreground font-medium">{tenant.store_count} 家店铺</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <View className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <View className="i-mdi-account-group text-lg text-blue-600" />
                      </View>
                      <Text className="text-sm text-foreground font-medium">{tenant.employee_count} 名员工</Text>
                    </View>
                  </View>

                  {/* 套餐信息 */}
                  <View className="pt-4 border-t border-border flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                        <View className="i-mdi-package-variant text-sm text-blue-600" />
                      </View>
                      <Text className="text-sm text-muted-foreground font-medium">
                        {tenant.package_type === 'enterprise'
                          ? '企业版'
                          : tenant.package_type === 'standard'
                            ? '标准版'
                            : '基础版'}
                      </Text>
                    </View>
                    <View className="i-mdi-chevron-right text-2xl text-muted-foreground" />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default TenantSelect
