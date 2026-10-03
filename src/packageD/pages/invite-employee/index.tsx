import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  deactivateInvitationCode,
  generateInvitationCode,
  getInvitationCodesByTenantId,
  getStoresByTenantId
} from '@/db/api'
import type {InvitationCode, Store, UserRole} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const InviteEmployee: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentUser = useTenantStore((state) => state.currentUser)

  const [stores, setStores] = useState<Store[]>([])
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // 表单状态
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(0)
  const [selectedRole, setSelectedRole] = useState('employee')
  const [maxUses, setMaxUses] = useState('1')
  const [expiresInDays, setExpiresInDays] = useState('7')

  // 角色选项
  const roleOptions = [
    {label: '普通员工', value: 'employee'},
    {label: '店经理', value: 'store_manager'},
    {label: '租户管理员', value: 'tenant_admin'}
  ]
  const [roleIndex, setRoleIndex] = useState(0)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant?.id) {
      Taro.navigateTo({url: '/pages/tenant-select/index'})
      return
    }

    setLoading(true)
    try {
      const [storesData, codesData] = await Promise.all([
        getStoresByTenantId(currentTenant.id),
        getInvitationCodesByTenantId(currentTenant.id)
      ])

      setStores(storesData)
      setInvitationCodes(codesData)
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

  // 生成邀请码
  const handleGenerate = async () => {
    if (!currentTenant?.id || !user?.id) {
      Taro.showToast({title: '缺少必要信息', icon: 'none'})
      return
    }

    const uses = Number(maxUses)
    const days = Number(expiresInDays)

    if (!uses || uses <= 0) {
      Taro.showToast({title: '请输入有效的使用次数', icon: 'none'})
      return
    }

    if (!days || days <= 0) {
      Taro.showToast({title: '请输入有效的有效天数', icon: 'none'})
      return
    }

    setGenerating(true)
    try {
      const storeId = stores.length > 0 ? stores[selectedStoreIndex].id : null

      console.log('准备生成邀请码:', {
        tenantId: currentTenant.id,
        storeId,
        role: selectedRole,
        maxUses: uses,
        expiresInDays: days,
        createdBy: user.id
      })

      // 计算过期时间
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)

      const result = await generateInvitationCode(currentTenant.id, user.id, {
        maxUses: uses,
        expiresAt: expiresAt.toISOString(),
        role: selectedRole as UserRole
      })

      if (result) {
        // G0-Z-R2: 明文仅显示一次（DB 只存 hash，之后不可再查看）
        Taro.showModal({
          title: '邀请码已生成（仅显示一次）',
          content: `${result.code}\n\n请立即复制并发给员工。以普通员工身份加入；管理角色由管理员另行指派。`,
          confirmText: '复制',
          cancelText: '关闭',
          success: (res) => {
            if (res.confirm) {
              Taro.setClipboardData({data: result.code})
            }
          }
        })
        loadData()
      } else {
        Taro.showToast({title: '生成失败，请查看控制台日志', icon: 'none', duration: 3000})
      }
    } catch (error) {
      console.error('生成邀请码异常:', error)
      Taro.showToast({title: '生成异常，请查看控制台日志', icon: 'none', duration: 3000})
    } finally {
      setGenerating(false)
    }
  }

  // 复制邀请码
  const handleCopy = (code: string) => {
    Taro.setClipboardData({
      data: code,
      success: () => {
        Taro.showToast({title: '已复制', icon: 'success'})
      }
    })
  }

  // 停用邀请码
  const handleDeactivate = async (codeId: string) => {
    const result = await Taro.showModal({
      title: '确认停用',
      content: '停用后该邀请码将无法使用，确定要停用吗？'
    })

    if (!result.confirm) return

    try {
      const success = await deactivateInvitationCode(codeId)
      if (success) {
        Taro.showToast({title: '已停用', icon: 'success'})
        loadData()
      } else {
        Taro.showToast({title: '停用失败', icon: 'none'})
      }
    } catch (error) {
      console.error('停用邀请码失败:', error)
      Taro.showToast({title: '停用失败', icon: 'none'})
    }
  }

  // 处理店铺选择
  const handleStoreChange = (e: any) => {
    setSelectedStoreIndex(e.detail.value)
  }

  // 处理角色选择
  const handleRoleChange = (e: any) => {
    const index = e.detail.value
    setRoleIndex(index)
    setSelectedRole(roleOptions[index].value)
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 获取角色标签
  const getRoleLabel = (role: string) => {
    const option = roleOptions.find((r) => r.value === role)
    return option ? option.label : role
  }

  // 获取状态标签
  const getStatusBadge = (code: InvitationCode) => {
    if (code.status !== 'active') {
      return {text: '已停用', color: 'bg-muted text-muted-foreground'}
    }
    if (new Date(code.expires_at) < new Date()) {
      return {text: '已过期', color: 'bg-red-100 text-red-600'}
    }
    if (code.used_count >= code.max_uses) {
      return {text: '已用完', color: 'bg-orange-100 text-muted-foreground'}
    }
    return {text: '有效', color: 'bg-green-100 text-muted-foreground'}
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

  const storeNames = stores.map((s) => s.name)

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4 space-y-4">
          {/* 标题 */}
          <View>
            <Text className="text-lg font-bold text-foreground block mb-1">邀请员工</Text>
            <Text className="text-sm text-muted-foreground block">生成邀请码，分享给员工加入团队</Text>
          </View>

          {/* 生成邀请码表单 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <Text className="text-base font-bold text-foreground block mb-3">生成新邀请码</Text>

            <View className="space-y-3">
              {/* 选择店铺 */}
              {stores.length > 0 && (
                <View>
                  <Text className="text-sm text-foreground mb-2 block">指定店铺（可选）</Text>
                  <Picker mode="selector" range={storeNames} value={selectedStoreIndex} onChange={handleStoreChange}>
                    <View className="border border-gray-300 rounded-lg p-3 bg-muted flex items-center justify-between">
                      <Text className="text-foreground">{storeNames[selectedStoreIndex] || '请选择店铺'}</Text>
                      <View className="i-mdi-chevron-down text-muted-foreground" />
                    </View>
                  </Picker>
                  <Text className="text-xs text-muted-foreground mt-1">员工加入后将自动分配到该店铺</Text>
                </View>
              )}

              {/* 选择角色 */}
              <View>
                <Text className="text-sm text-foreground mb-2 block">员工角色</Text>
                <Picker
                  mode="selector"
                  range={roleOptions.map((r) => r.label)}
                  value={roleIndex}
                  onChange={handleRoleChange}>
                  <View className="border border-gray-300 rounded-lg p-3 bg-muted flex items-center justify-between">
                    <Text className="text-foreground">{roleOptions[roleIndex].label}</Text>
                    <View className="i-mdi-chevron-down text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 使用次数 */}
              <View>
                <Text className="text-sm text-foreground mb-2 block">使用次数</Text>
                <Input
                  type="number"
                  value={maxUses}
                  onInput={(e) => setMaxUses(e.detail.value)}
                  placeholder="请输入使用次数"
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                />
                <Text className="text-xs text-muted-foreground mt-1">该邀请码可以被使用的次数</Text>
              </View>

              {/* 有效天数 */}
              <View>
                <Text className="text-sm text-foreground mb-2 block">有效天数</Text>
                <Input
                  type="number"
                  value={expiresInDays}
                  onInput={(e) => setExpiresInDays(e.detail.value)}
                  placeholder="请输入有效天数"
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                />
                <Text className="text-xs text-muted-foreground mt-1">邀请码的有效期限</Text>
              </View>

              {/* 生成按钮 */}
              <Button
                onClick={handleGenerate}
                loading={generating}
                disabled={loading}
                className="w-full bg-blue-100 text-white rounded-xl py-3 font-semibold text-base">
                {generating ? '生成中...' : '生成邀请码'}
              </Button>
            </View>
          </View>

          {/* 邀请码列表 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            <Text className="text-base font-bold text-foreground block mb-3">邀请码列表</Text>

            {invitationCodes.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-ticket-outline text-5xl text-gray-300 mx-auto mb-2"></View>
                <Text className="text-sm text-muted-foreground">暂无邀请码</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {invitationCodes.map((code) => {
                  const statusBadge = getStatusBadge(code)
                  const storeName = stores.find((s) => s.id === code.store_id)?.name || '未指定店铺'

                  return (
                    <View key={code.id} className="border border-gray-200 rounded-xl p-3">
                      {/* 邀请码和状态 */}
                      <View className="flex items-center justify-between mb-2">
                        <View className="flex items-center gap-2">
                          {/* G0-Z-R2: 库中只存 hash，列表仅显示尾 4 位提示 */}
                          <Text className="text-xl font-bold text-muted-foreground">
                            {code.token_hint ? `****${code.token_hint}` : (code.code || '（历史码已退休）')}
                          </Text>
                          <View className={`px-2 py-1 rounded text-xs ${statusBadge.color}`}>
                            <Text className="text-xs">{statusBadge.text}</Text>
                          </View>
                        </View>
                        <Button
                          size="mini"
                          onClick={() =>
                            Taro.showToast({
                              title: '明文仅生成时显示一次，无法复制',
                              icon: 'none'
                            })
                          }
                          className="bg-blue-100 text-white border-0">
                          复制
                        </Button>
                      </View>

                      {/* 详细信息 */}
                      <View className="space-y-1">
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-store text-sm text-muted-foreground"></View>
                          <Text className="text-xs text-muted-foreground">{storeName}</Text>
                        </View>
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-account text-sm text-muted-foreground"></View>
                          <Text className="text-xs text-muted-foreground">{getRoleLabel(code.role)}</Text>
                        </View>
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-counter text-sm text-muted-foreground"></View>
                          <Text className="text-xs text-muted-foreground">
                            已使用 {code.used_count}/{code.max_uses} 次
                          </Text>
                        </View>
                        <View className="flex items-center gap-2">
                          <View className="i-mdi-calendar text-sm text-muted-foreground"></View>
                          <Text className="text-xs text-muted-foreground">有效期至 {formatDate(code.expires_at)}</Text>
                        </View>
                      </View>

                      {/* 操作按钮 */}
                      {code.status === 'active' && (
                        <View className="mt-2 pt-2 border-t border-gray-100">
                          <Button
                            size="mini"
                            onClick={() => handleDeactivate(code.id)}
                            className="bg-blue-100 text-red-600 border-0">
                            停用
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
            <Text className="text-sm font-semibold text-foreground mb-2 block">📋 使用说明</Text>
            <View className="space-y-1">
              <Text className="text-xs text-foreground block">• 生成邀请码后，将邀请码分享给员工</Text>
              <Text className="text-xs text-foreground block">• 员工在加入页面输入邀请码即可加入团队</Text>
              <Text className="text-xs text-foreground block">• 邀请码可设置使用次数和有效期</Text>
              <Text className="text-xs text-foreground block">• 已停用或过期的邀请码无法使用</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default InviteEmployee
