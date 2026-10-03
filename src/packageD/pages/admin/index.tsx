import {Button, ScrollView, Text, View} from '@tarojs/components'
import {showModal, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {getAllProfiles, updateUserRole} from '@/db/api'
import type {Profile, UserRole} from '@/db/types'

const Admin: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [_loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllProfiles()
      setProfiles(data)
    } catch (error) {
      console.error('加载用户列表失败:', error)
      showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return '超级管理员'
      case 'tenant_admin':
        return '租户管理员'
      case 'store_manager':
        return '店经理'
      case 'employee':
        return '员工'
      default:
        return '未知'
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'text-red-600 bg-blue-100'
      case 'tenant_admin':
        return 'text-muted-foreground bg-blue-100'
      case 'store_manager':
        return 'text-white bg-blue-100'
      case 'employee':
        return 'text-muted-foreground bg-gray-50'
      default:
        return 'text-muted-foreground bg-gray-50'
    }
  }

  const handleChangeRole = (profile: Profile) => {
    const roles: UserRole[] = ['super_admin', 'tenant_admin', 'store_manager', 'employee']
    const _roleTexts = ['超级管理员', '租户管理员', '店经理', '员工']

    showModal({
      title: '修改用户角色',
      content: `当前用户：${profile.name || profile.phone || profile.email}\n当前角色：${getRoleText(profile.role)}`,
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          // 这里简化处理，实际应该弹出选择器
          const currentIndex = roles.indexOf(profile.role)
          const nextIndex = (currentIndex + 1) % roles.length
          const newRole = roles[nextIndex]

          try {
            const success = await updateUserRole(profile.id, newRole)
            if (success) {
              showToast({title: '修改成功', icon: 'success'})
              loadData()
            } else {
              showToast({title: '修改失败', icon: 'none'})
            }
          } catch (error) {
            console.error('修改角色失败:', error)
            showToast({title: '修改失败', icon: 'none'})
          }
        }
      }
    })
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          <View className="mb-4">
            <Text className="text-lg font-bold text-foreground block mb-1">系统管理</Text>
            <Text className="text-sm text-muted-foreground block">用户权限管理</Text>
          </View>

          {/* 统计卡片 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center justify-around">
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground block">{profiles.length}</Text>
                <Text className="text-xs text-muted-foreground block mt-1">总用户数</Text>
              </View>
              <View className="w-px h-8 bg-gray-200"></View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-red-600 block">
                  {profiles.filter((p) => p.role === 'super_admin').length}
                </Text>
                <Text className="text-xs text-muted-foreground block mt-1">超级管理员</Text>
              </View>
              <View className="w-px h-8 bg-gray-200"></View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground block">
                  {profiles.filter((p) => p.role === 'tenant_admin').length}
                </Text>
                <Text className="text-xs text-muted-foreground block mt-1">租户管理员</Text>
              </View>
            </View>
          </View>

          {/* 用户列表 */}
          {profiles.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
              <View className="i-mdi-account-group text-6xl text-gray-300 mx-auto mb-4"></View>
              <Text className="text-muted-foreground block">暂无用户</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {profiles.map((profile) => (
                <View key={profile.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-foreground block mb-1">
                        {profile.name || '未设置姓名'}
                      </Text>
                      <Text className="text-xs text-muted-foreground block">
                        {profile.phone || profile.email || '未绑定联系方式'}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${getRoleColor(profile.role)}`}>
                      <Text className="text-xs font-medium">{getRoleText(profile.role)}</Text>
                    </View>
                  </View>

                  {profile.id !== user?.id && (
                    <View className="pt-3 border-t border-gray-100">
                      <Button
                        className="w-full bg-blue-100 text-white rounded-xl text-xs break-keep"
                        size="mini"
                        onClick={() => handleChangeRole(profile)}>
                        修改角色
                      </Button>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default Admin
