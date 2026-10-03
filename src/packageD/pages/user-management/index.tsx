import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {deleteUser, getStoresByTenantId, getTenantUsers, updateUserRole, updateUserStatus} from '@/db/api'
import type {Profile, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const UserManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentUser = useTenantStore((state) => state.currentUser)

  const [users, setUsers] = useState<Profile[]>([])
  const [_stores, setStores] = useState<Store[]>([])
  const [_loading, setLoading] = useState(false)

  // 角色选项
  const roleOptions = [
    {label: '普通员工', value: 'employee'},
    {label: '店经理', value: 'store_manager'},
    {label: '租户管理员', value: 'tenant_admin'}
  ]

  // 状态选项
  const _statusOptions = [
    {label: '正常', value: 'active'},
    {label: '停用', value: 'inactive'}
  ]

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant?.id) {
      Taro.navigateTo({url: '/pages/tenant-select/index'})
      return
    }

    setLoading(true)
    try {
      const [usersData, storesData] = await Promise.all([
        getTenantUsers(currentTenant.id),
        getStoresByTenantId(currentTenant.id)
      ])

      setUsers(usersData)
      setStores(storesData)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadData()
  })

  // 更新用户角色
  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const _roleIndex = roleOptions.findIndex((r) => r.value === currentRole)

    const result = await Taro.showActionSheet({
      itemList: roleOptions.map((r) => r.label)
    })

    if (result.tapIndex === undefined) return

    const newRole = roleOptions[result.tapIndex].value

    if (newRole === currentRole) {
      Taro.showToast({title: '角色未变更', icon: 'none'})
      return
    }

    try {
      const success = await updateUserRole(userId, newRole as any)
      if (success) {
        Taro.showToast({title: '角色更新成功', icon: 'success'})
        loadData()
      } else {
        Taro.showToast({title: '角色更新失败', icon: 'none'})
      }
    } catch (error) {
      console.error('更新角色失败:', error)
      Taro.showToast({title: '更新失败', icon: 'none'})
    }
  }

  // 更新用户状态
  const handleUpdateStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const statusText = newStatus === 'active' ? '启用' : '停用'

    const result = await Taro.showModal({
      title: '确认操作',
      content: `确定要${statusText}该用户吗？`
    })

    if (!result.confirm) return

    try {
      const success = await updateUserStatus(userId, newStatus)
      if (success) {
        Taro.showToast({title: `${statusText}成功`, icon: 'success'})
        loadData()
      } else {
        Taro.showToast({title: `${statusText}失败`, icon: 'none'})
      }
    } catch (error) {
      console.error('更新状态失败:', error)
      Taro.showToast({title: '更新失败', icon: 'none'})
    }
  }

  // 删除用户
  const handleDeleteUser = async (userId: string, userName: string) => {
    // 不能删除自己
    if (userId === user?.id) {
      Taro.showToast({title: '不能删除自己', icon: 'none'})
      return
    }

    const result = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除用户"${userName}"吗？此操作不可恢复，将同时删除该用户的所有关联数据。`
    })

    if (!result.confirm) return

    try {
      const success = await deleteUser(userId)
      if (success) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        loadData()
      } else {
        Taro.showToast({title: '删除失败', icon: 'none'})
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      Taro.showToast({title: '删除失败', icon: 'none'})
    }
  }

  // 获取角色标签
  const getRoleLabel = (role: string) => {
    const option = roleOptions.find((r) => r.value === role)
    return option ? option.label : role
  }

  // 获取角色颜色
  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      employee: 'bg-blue-100 text-muted-foreground',
      store_manager: 'bg-purple-100 text-muted-foreground',
      tenant_admin: 'bg-red-100 text-red-600'
    }
    return colorMap[role] || 'bg-muted text-muted-foreground'
  }

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return {text: '正常', color: 'bg-green-100 text-muted-foreground'}
    }
    return {text: '停用', color: 'bg-muted text-muted-foreground'}
  }

  if (!currentTenant) {
    return null
  }

  // 只有租户管理员可以访问
  if (currentUser?.role !== 'tenant_admin' && currentUser?.role !== 'super_admin') {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="text-center">
          <View className="i-mdi-lock text-6xl text-muted-foreground mx-auto mb-4"></View>
          <Text className="text-lg text-muted-foreground">您没有权限访问此页面</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4 space-y-4">
          {/* 标题 */}
          <View>
            <Text className="text-lg font-bold text-foreground block mb-1">权限管理</Text>
            <Text className="text-sm text-muted-foreground block">管理用户角色和权限</Text>
          </View>

          {/* 统计卡片 */}
          <View className="grid grid-cols-3 gap-3">
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-sm text-center">
              <Text className="text-2xl font-bold text-muted-foreground block">{users.length}</Text>
              <Text className="text-xs text-muted-foreground mt-1">总用户数</Text>
            </View>
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-sm text-center">
              <Text className="text-2xl font-bold text-muted-foreground block">
                {users.filter((u) => u.status === 'active').length}
              </Text>
              <Text className="text-xs text-muted-foreground mt-1">正常用户</Text>
            </View>
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-sm text-center">
              <Text className="text-2xl font-bold text-red-600 block">
                {users.filter((u) => u.role === 'tenant_admin').length}
              </Text>
              <Text className="text-xs text-muted-foreground mt-1">管理员</Text>
            </View>
          </View>

          {/* 用户列表 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <Text className="text-base font-bold text-foreground block mb-3">用户列表</Text>

            {users.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-account-multiple-outline text-5xl text-gray-300 mx-auto mb-2"></View>
                <Text className="text-sm text-muted-foreground">暂无用户</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {users.map((u) => {
                  const statusBadge = getStatusBadge(u.status)
                  const roleColor = getRoleColor(u.role)
                  const isCurrentUser = u.id === user?.id

                  return (
                    <View key={u.id} className="border border-gray-200 rounded-xl p-3">
                      {/* 用户信息 */}
                      <View className="flex items-center justify-between mb-2">
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-account-circle text-3xl text-muted-foreground"></View>
                          <View>
                            <View className="flex items-center gap-2">
                              <Text className="text-base font-semibold text-foreground">{u.name}</Text>
                              {isCurrentUser && (
                                <View className="bg-blue-100 px-2 py-0.5 rounded">
                                  <Text className="text-xs text-muted-foreground">当前用户</Text>
                                </View>
                              )}
                            </View>
                            <Text className="text-xs text-muted-foreground">
                              {u.phone || u.email || '未设置联系方式'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* 角色和状态 */}
                      <View className="flex items-center gap-2 mb-2">
                        <View className={`px-2 py-1 rounded ${roleColor}`}>
                          <Text className="text-xs">{getRoleLabel(u.role)}</Text>
                        </View>
                        <View className={`px-2 py-1 rounded ${statusBadge.color}`}>
                          <Text className="text-xs">{statusBadge.text}</Text>
                        </View>
                      </View>

                      {/* 租户信息 */}
                      <View className="flex items-center gap-2 mb-2">
                        <View className="i-mdi-office-building text-sm text-muted-foreground"></View>
                        <Text className="text-xs text-muted-foreground">{currentTenant?.name || '未知租户'}</Text>
                      </View>

                      {/* 操作按钮 */}
                      {!isCurrentUser && (
                        <View className="mt-2 pt-2 border-t border-gray-100 flex gap-2">
                          <Button
                            size="mini"
                            onClick={() => handleUpdateRole(u.id, u.role)}
                            className="flex-1 bg-blue-100 text-white border-0">
                            修改角色
                          </Button>
                          <Button
                            size="mini"
                            onClick={() => handleUpdateStatus(u.id, u.status)}
                            className={`flex-1 border-0 ${u.status === 'active' ? 'bg-blue-100 text-muted-foreground' : 'bg-blue-100 text-muted-foreground'}`}>
                            {u.status === 'active' ? '停用' : '启用'}
                          </Button>
                          <Button
                            size="mini"
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="flex-1 bg-blue-100 text-red-600 border-0">
                            删除
                          </Button>
                        </View>
                      )}
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 使用说明 */}
          <View className="bg-blue-100 rounded-lg p-4">
            <Text className="text-sm font-semibold text-foreground mb-2 block">📋 权限说明</Text>
            <View className="space-y-1">
              <Text className="text-xs text-foreground block">• 普通员工：可查看和记录排班日志</Text>
              <Text className="text-xs text-foreground block">• 店经理：可管理本店员工和排班</Text>
              <Text className="text-xs text-foreground block">• 租户管理员：可管理所有店铺和员工</Text>
              <Text className="text-xs text-foreground block">• 停用用户将无法登录系统</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default UserManagement
