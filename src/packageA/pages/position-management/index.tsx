/**
 * 岗位管理页面
 * 用于管理租户的岗位信息，为组织架构配置提供基础数据
 */

import {Button, Input, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {createPosition, deletePosition, getPositionsByTenant, updatePosition} from '@/db/api-position'
import type {CreatePositionInput, Position, PositionLevel, UpdatePositionInput} from '@/db/types-position'
import {useTenantStore} from '@/store/tenant'

export default function PositionManagement() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [loading, setLoading] = useState(false)
  const [positions, setPositions] = useState<Position[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingPosition, setEditingPosition] = useState<Position | null>(null)

  // 表单字段
  const [positionName, setPositionName] = useState('')
  const [positionLevel, setPositionLevel] = useState<PositionLevel>(3)
  const [description, setDescription] = useState('')

  // 加载岗位列表
  const loadPositions = useCallback(async () => {
    if (!currentTenant) {
      console.log('缺少租户信息', {currentTenant})
      return
    }

    try {
      setLoading(true)
      console.log('开始加载岗位列表', {tenantId: currentTenant.id})
      const data = await getPositionsByTenant(currentTenant.id)
      console.log('加载到的岗位数据:', data)
      setPositions(data)
    } catch (error) {
      console.error('加载岗位列表失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadPositions()
  })

  // 重置表单
  const resetForm = () => {
    setPositionName('')
    setPositionLevel(3)
    setDescription('')
    setEditingPosition(null)
  }

  // 打开新增对话框
  const handleAdd = () => {
    resetForm()
    setShowDialog(true)
  }

  // 打开编辑对话框
  const handleEdit = (position: Position) => {
    setEditingPosition(position)
    setPositionName(position.position_name)
    setPositionLevel(position.position_level)
    setDescription(position.description || '')
    setShowDialog(true)
  }

  // 保存岗位
  const handleSave = async () => {
    if (!currentTenant || !user) {
      console.error('❌ 缺少租户信息或用户信息', {currentTenant, user})
      Taro.showToast({
        title: '缺少租户信息',
        icon: 'error'
      })
      return
    }

    // 验证
    if (!positionName.trim()) {
      Taro.showToast({
        title: '请输入岗位名称',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      console.log('=== 开始保存岗位 ===')
      console.log('租户信息:', {
        tenantId: currentTenant.id,
        tenantName: currentTenant.name
      })
      console.log('用户信息:', {
        userId: user.id
      })

      if (editingPosition) {
        // 更新
        console.log('准备更新岗位:', editingPosition.id)
        const input: UpdatePositionInput = {
          position_name: positionName.trim(),
          position_level: positionLevel,
          description: description.trim() || undefined
        }
        console.log('更新数据:', input)
        const success = await updatePosition(editingPosition.id, input)
        if (!success) {
          throw new Error('更新失败')
        }
        console.log('✅ 更新成功')
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        // 创建
        console.log('准备创建岗位:', {
          tenant_id: currentTenant.id,
          position_name: positionName.trim(),
          position_level: positionLevel,
          created_by: user.id
        })
        const input: CreatePositionInput = {
          tenant_id: currentTenant.id,
          position_name: positionName.trim(),
          position_level: positionLevel,
          description: description.trim() || undefined,
          created_by: user.id
        }
        const result = await createPosition(input)
        console.log('创建结果:', result)
        if (!result) {
          throw new Error('创建失败')
        }
        console.log('✅ 创建成功')
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        })
      }

      // 关闭对话框并重置表单
      setShowDialog(false)
      resetForm()

      // 立即刷新岗位列表
      console.log('准备刷新岗位列表')
      await loadPositions()
      console.log('刷新完成')
    } catch (error) {
      console.error('❌ 保存岗位失败，详细错误:', error)
      const errorMessage = error instanceof Error ? error.message : '保存失败'
      Taro.showToast({
        title: errorMessage.length > 20 ? '保存失败，请重试' : errorMessage,
        icon: 'none',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }

  // 删除岗位
  const handleDelete = async (position: Position) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除岗位"${position.position_name}"吗？`
    })

    if (!res.confirm) return

    try {
      setLoading(true)
      const success = await deletePosition(position.id)
      if (!success) {
        throw new Error('删除失败')
      }
      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      })
      loadPositions()
    } catch (error) {
      console.error('删除岗位失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取层级名称
  const _getLevelName = (level: PositionLevel) => {
    switch (level) {
      case 1:
        return '一级岗位（店长级）'
      case 2:
        return '二级岗位（主管级）'
      case 3:
        return '三级岗位（员工级）'
      default:
        return '未知层级'
    }
  }

  // 按层级分组
  const groupedPositions = {
    level1: positions.filter((p) => p.position_level === 1),
    level2: positions.filter((p) => p.position_level === 2),
    level3: positions.filter((p) => p.position_level === 3)
  }

  // 层级配置
  const levelConfig = [
    {
      level: 1,
      name: '一级岗位',
      subtitle: '店长级',
      icon: 'i-mdi-crown',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    {
      level: 2,
      name: '二级岗位',
      subtitle: '主管级',
      icon: 'i-mdi-account-tie',
      color: 'text-muted-foreground',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200'
    },
    {
      level: 3,
      name: '三级岗位',
      subtitle: '员工级',
      icon: 'i-mdi-account',
      color: 'text-muted-foreground',
      bgColor: 'bg-blue-100',
      borderColor: 'border-green-200'
    }
  ]

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground block mb-2">岗位管理</Text>
            <Text className="text-sm text-muted-foreground block">配置租户的岗位信息，为组织架构提供基础数据</Text>
          </View>

          {/* 新增按钮 */}
          <View className="mb-6">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={handleAdd}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus-circle text-xl" />
                <Text className="text-blue-600">新增岗位</Text>
              </View>
            </Button>
          </View>

          {/* 岗位列表 */}
          {loading && positions.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
              <View className="i-mdi-loading animate-spin text-4xl text-blue-500 mx-auto mb-3" />
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : positions.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
              <View className="i-mdi-briefcase-outline text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-muted-foreground block mb-2">暂无岗位配置</Text>
              <Text className="text-sm text-muted-foreground block">点击上方按钮新增岗位</Text>
            </View>
          ) : (
            <View className="space-y-6">
              {levelConfig.map((config) => {
                const levelPositions =
                  config.level === 1
                    ? groupedPositions.level1
                    : config.level === 2
                      ? groupedPositions.level2
                      : groupedPositions.level3

                if (levelPositions.length === 0) return null

                return (
                  <View key={config.level} className="space-y-3">
                    {/* 层级标题 */}
                    <View className="flex items-center gap-2 mb-3">
                      <View className={`${config.icon} text-xl ${config.color}`} />
                      <Text className="text-base font-bold text-foreground">{config.name}</Text>
                      <Text className="text-sm text-muted-foreground">({config.subtitle})</Text>
                      <View className={`ml-auto px-3 py-1 rounded-full ${config.bgColor}`}>
                        <Text className={`text-xs font-medium ${config.color}`}>{levelPositions.length} 个</Text>
                      </View>
                    </View>

                    {/* 岗位卡片 */}
                    {levelPositions.map((position) => (
                      <View
                        key={position.id}
                        className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${config.borderColor}`}>
                        <View className="flex items-start justify-between mb-3">
                          <View className="flex-1">
                            <View className="flex items-center gap-2 mb-2">
                              <View className={`${config.icon} text-lg ${config.color}`} />
                              <Text className="text-lg font-bold text-foreground">{position.position_name}</Text>
                            </View>
                            {position.description && (
                              <Text className="text-sm text-muted-foreground leading-relaxed">
                                {position.description}
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* 操作按钮 */}
                        <View className="flex gap-2 pt-3 border-t border-gray-100">
                          <Button
                            className="flex-1 bg-blue-100 text-white py-2 rounded-lg text-sm break-keep"
                            size="default"
                            onClick={() => handleEdit(position)}>
                            <View className="flex items-center justify-center gap-1">
                              <View className="i-mdi-pencil text-base" />
                              <Text className="text-muted-foreground">编辑</Text>
                            </View>
                          </Button>
                          <Button
                            className="flex-1 bg-blue-100 text-red-600 py-2 rounded-lg text-sm break-keep"
                            size="default"
                            onClick={() => handleDelete(position)}>
                            <View className="flex items-center justify-center gap-1">
                              <View className="i-mdi-delete text-base" />
                              <Text className="text-red-600">删除</Text>
                            </View>
                          </Button>
                        </View>
                      </View>
                    ))}
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 新增/编辑对话框 */}
      {showDialog && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{zIndex: 1000}}
          onClick={() => setShowDialog(false)}>
          <View
            className="bg-white rounded-lg p-6 border-2 border-gray-200 w-full border border-border"
            style={{maxWidth: '500px'}}
            onClick={(e) => e.stopPropagation()}>
            {/* 标题 */}
            <View className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <View className="i-mdi-briefcase-edit text-2xl text-muted-foreground" />
              <Text className="text-xl font-bold text-foreground">{editingPosition ? '编辑岗位' : '新增岗位'}</Text>
            </View>

            {/* 岗位名称 */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-foreground mb-2 block">
                岗位名称 <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base"
                  placeholder="请输入岗位名称"
                  value={positionName}
                  onInput={(e) => setPositionName(e.detail.value)}
                />
              </View>
            </View>

            {/* 岗位层级 */}
            <View className="mb-5">
              <Text className="text-sm font-medium text-foreground mb-3 block">
                岗位层级 <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex gap-2">
                <Button
                  className={`flex-1 py-3 rounded-xl text-sm break-keep transition-all ${
                    positionLevel === 1 ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  size="default"
                  onClick={() => setPositionLevel(1)}>
                  <View className="flex flex-col items-center gap-1">
                    <View className="i-mdi-crown text-lg" />
                    <Text className={positionLevel === 1 ? 'text-white' : 'text-muted-foreground'}>店长级</Text>
                  </View>
                </Button>
                <Button
                  className={`flex-1 py-3 rounded-xl text-sm break-keep transition-all ${
                    positionLevel === 2 ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  size="default"
                  onClick={() => setPositionLevel(2)}>
                  <View className="flex flex-col items-center gap-1">
                    <View className="i-mdi-account-tie text-lg" />
                    <Text className={positionLevel === 2 ? 'text-blue-600' : 'text-muted-foreground'}>主管级</Text>
                  </View>
                </Button>
                <Button
                  className={`flex-1 py-3 rounded-xl text-sm break-keep transition-all ${
                    positionLevel === 3 ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                  size="default"
                  onClick={() => setPositionLevel(3)}>
                  <View className="flex flex-col items-center gap-1">
                    <View className="i-mdi-account text-lg" />
                    <Text className={positionLevel === 3 ? 'text-blue-600' : 'text-muted-foreground'}>员工级</Text>
                  </View>
                </Button>
              </View>
            </View>

            {/* 岗位描述 */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-foreground mb-2 block">岗位描述</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base"
                  placeholder="请输入岗位描述（选填）"
                  value={description}
                  onInput={(e) => setDescription(e.detail.value)}
                  maxlength={200}
                  style={{height: '100px'}}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">{description.length}/200</Text>
            </View>

            {/* 按钮 */}
            <View className="flex gap-3">
              <Button
                className="flex-1 bg-muted text-foreground py-3 rounded-xl text-base break-keep"
                size="default"
                onClick={() => setShowDialog(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 rounded-xl text-base break-keep"
                size="default"
                onClick={handleSave}
                disabled={loading}>
                {loading ? '保存中...' : '保存'}
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
