/**
 * 添加Agent页面
 * 将现有员工提升为Agent角色
 */

import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getUsersByTenantId, type Profile, updateUserToAgent} from '@/db/api'
import {useTenantStore} from '@/store/tenant'

export default function AgentAdd() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  // 加载用户列表（排除已是Agent的用户）
  const loadProfiles = useCallback(async () => {
    if (!currentTenant) return

    try {
      const allProfiles = await getUsersByTenantId(currentTenant.id)
      // 过滤掉已经是Agent或管理员的用户
      const availableProfiles = allProfiles.filter(
        (profile) => profile.role !== 'agent' && profile.role !== 'tenant_admin' && profile.role !== 'super_admin'
      )
      setProfiles(availableProfiles)
    } catch (error) {
      console.error('加载用户列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  }, [currentTenant])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  // 提交
  const handleSubmit = async () => {
    if (profiles.length === 0) {
      Taro.showToast({
        title: '没有可选员工',
        icon: 'none'
      })
      return
    }

    const selectedProfile = profiles[selectedIndex]

    Taro.showModal({
      title: '确认提升',
      content: `确定将 ${selectedProfile.name || '该员工'} 提升为Agent吗？`,
      success: async (res) => {
        if (res.confirm) {
          setLoading(true)
          try {
            const success = await updateUserToAgent(selectedProfile.id)

            if (success) {
              Taro.showToast({
                title: '添加成功',
                icon: 'success'
              })

              setTimeout(() => {
                Taro.navigateBack()
              }, 1500)
            } else {
              Taro.showToast({
                title: '添加失败',
                icon: 'error'
              })
            }
          } catch (error) {
            console.error('添加Agent失败:', error)
            Taro.showToast({
              title: '添加失败',
              icon: 'error'
            })
          } finally {
            setLoading(false)
          }
        }
      }
    })
  }

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #eff6ff, #ffffff)'}}>
      <ScrollView scrollY className="h-screen box-border" style={{background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <View className="flex items-center gap-3 mb-2">
              <View className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <View className="i-mdi-account-plus text-3xl text-blue-600" />
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 block">添加Agent</Text>
                <Text className="text-sm text-gray-600 block">从现有员工中选择</Text>
              </View>
            </View>
          </View>

          {/* 表单 */}
          <View className="bg-white rounded-2xl p-6 mb-6 border-2 border-gray-100">
            {/* 选择员工 */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-900 block mb-2">选择员工</Text>
              {profiles.length === 0 ? (
                <View className="bg-gray-50 rounded-lg p-4 text-center">
                  <Text className="text-sm text-gray-600">暂无可选员工</Text>
                </View>
              ) : (
                <Picker
                  mode="selector"
                  range={profiles.map((emp) => emp.name || '未命名')}
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(Number(e.detail.value))}>
                  <View className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <Text className="text-base text-gray-900">{profiles[selectedIndex]?.name || '请选择员工'}</Text>
                    <View className="i-mdi-chevron-down text-xl text-gray-600" />
                  </View>
                </Picker>
              )}
            </View>

            {/* 选中员工信息 */}
            {profiles.length > 0 && profiles[selectedIndex] && (
              <View className="bg-blue-50 rounded-lg p-4 mb-6">
                <Text className="text-sm font-semibold text-blue-900 block mb-2">员工信息</Text>
                <View className="space-y-2">
                  <View className="flex items-center gap-2">
                    <View className="i-mdi-account text-base text-blue-600" />
                    <Text className="text-sm text-blue-800">姓名：{profiles[selectedIndex].name || '未命名'}</Text>
                  </View>
                  {profiles[selectedIndex].phone && (
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-phone text-base text-blue-600" />
                      <Text className="text-sm text-blue-800">电话：{profiles[selectedIndex].phone}</Text>
                    </View>
                  )}
                  <View className="flex items-center gap-2">
                    <View className="i-mdi-shield-account text-base text-blue-600" />
                    <Text className="text-sm text-blue-800">
                      当前角色：{profiles[selectedIndex].role === 'employee' ? '普通员工' : '店经理'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 提交按钮 */}
            <Button
              className="w-full bg-blue-600 text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={handleSubmit}
              disabled={loading || profiles.length === 0}>
              {loading ? '提交中...' : '确认添加'}
            </Button>
          </View>

          {/* 说明 */}
          <View className="bg-yellow-50 rounded-xl p-4">
            <View className="flex items-start gap-2">
              <View className="i-mdi-information text-xl text-yellow-600 flex-shrink-0 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-yellow-900 block mb-1">温馨提示</Text>
                <Text className="text-xs text-yellow-800 leading-relaxed block mb-2">• Agent角色可以管理多个门店</Text>
                <Text className="text-xs text-yellow-800 leading-relaxed block mb-2">
                  • 提升为Agent后，可以查看所管理门店的数据
                </Text>
                <Text className="text-xs text-yellow-800 leading-relaxed block">
                  • 添加后需要在Agent管理页面分配门店
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
