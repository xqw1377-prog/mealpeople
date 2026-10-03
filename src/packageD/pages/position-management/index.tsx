/**
 * 岗位管理页面
 * 配置岗位信息和职级体系
 */

import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {EmptyState, LoadingCards, PageHeader} from '@/components/common'
import {createPosition, deletePosition, getCurrentUser, getPositionsByTenantId, updatePosition} from '@/db/api'
import type {PositionConfig, Profile} from '@/db/types'

export default function PositionManagement() {
  const {user} = useAuth({guard: true})
  const [profile, setProfile] = useState<Profile | null>(null)
  const [positions, setPositions] = useState<PositionConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  // 表单数据
  const [editingPosition, setEditingPosition] = useState<PositionConfig | null>(null)
  const [positionName, setPositionName] = useState('')
  const [positionDescription, setPositionDescription] = useState('')

  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const p = await getCurrentUser()
      setProfile(p)

      // 检查权限
      if (p?.role !== 'super_admin' && p?.role !== 'tenant_admin') {
        Taro.showModal({
          title: '权限不足',
          content: '只有管理员可以访问此页面',
          showCancel: false,
          success: () => {
            Taro.navigateBack()
          }
        })
        return
      }

      // 加载岗位列表
      if (p?.tenant_id) {
        const positionList = await getPositionsByTenantId(p.tenant_id)
        setPositions(positionList)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadData()
  })

  const handleAdd = () => {
    setEditingPosition(null)
    setPositionName('')
    setPositionDescription('')
    setShowAddForm(true)
  }

  const handleEdit = (position: PositionConfig) => {
    setEditingPosition(position)
    setPositionName(position.position_name || '')
    setPositionDescription('')
    setShowAddForm(true)
  }

  const handleSave = async () => {
    if (!profile?.tenant_id) {
      Taro.showToast({
        title: '租户信息不存在',
        icon: 'none'
      })
      return
    }

    if (!positionName.trim()) {
      Taro.showToast({
        title: '请输入岗位名称',
        icon: 'none'
      })
      return
    }

    try {
      if (editingPosition) {
        // 更新岗位
        await updatePosition(editingPosition.id, {
          position_name: positionName.trim(),
          is_active: true
        })
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        // 创建岗位
        await createPosition({
          tenant_id: profile.tenant_id,
          position_name: positionName.trim(),
          position_category: 'front',
          is_core: false,
          display_order: 0,
          is_active: true
        })
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        })
      }

      setShowAddForm(false)
      loadData()
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  }

  const handleDelete = (position: PositionConfig) => {
    Taro.showModal({
      title: '确认删除',
      content: `确定要删除岗位"${position.position_name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await deletePosition(position.id)
            Taro.showToast({
              title: '删除成功',
              icon: 'success'
            })
            loadData()
          } catch (error) {
            console.error('删除失败:', error)
            Taro.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border bg-transparent">
          <View className="p-4 space-y-4">
            <PageHeader icon="i-mdi-briefcase" title="岗位管理" description="配置岗位信息和职级体系" />
            <LoadingCards count={3} />
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          <PageHeader icon="i-mdi-briefcase" title="岗位管理" description="配置岗位信息和职级体系" />

          {/* 添加按钮 */}
          {!showAddForm && (
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded break-keep text-base mb-4"
              size="default"
              onClick={handleAdd}>
              <View className="flex items-center justify-center">
                <View className="i-mdi-plus text-xl mr-2" />
                <Text>添加岗位</Text>
              </View>
            </Button>
          )}

          {/* 添加/编辑表单 */}
          {showAddForm && (
            <View className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm">
              <View className="flex items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">
                  {editingPosition ? '编辑岗位' : '添加岗位'}
                </Text>
                <View className="i-mdi-close text-xl text-muted-foreground" onClick={() => setShowAddForm(false)} />
              </View>

              {/* 岗位名称 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">岗位名称 *</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    placeholder="请输入岗位名称"
                    value={positionName}
                    onInput={(e) => setPositionName(e.detail.value)}
                  />
                </View>
              </View>

              {/* 岗位描述 */}
              <View className="mb-4">
                <Text className="text-sm text-muted-foreground mb-2 block">岗位描述</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    placeholder="请输入岗位描述"
                    value={positionDescription}
                    onInput={(e) => setPositionDescription(e.detail.value)}
                  />
                </View>
              </View>

              {/* 保存按钮 */}
              <Button
                className="w-full bg-blue-100 text-white py-4 rounded break-keep text-base"
                size="default"
                onClick={handleSave}>
                保存
              </Button>
            </View>
          )}

          {/* 岗位列表 */}
          {positions.length === 0 ? (
            <EmptyState icon="i-mdi-briefcase-outline" title="暂无岗位" description="点击上方按钮添加第一个岗位" />
          ) : (
            <View className="space-y-3">
              {positions.map((position) => (
                <View key={position.id} className="bg-gray-50 rounded-lg p-4 shadow-sm">
                  <View className="flex items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground mb-1">{position.position_name}</Text>
                      <View className="flex items-center">
                        <View className={`px-2 py-0.5 rounded ${position.is_active ? 'bg-green-100' : 'bg-gray-50'}`}>
                          <Text
                            className={`text-xs ${position.is_active ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                            {position.is_active ? '启用' : '停用'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex gap-2 mt-3">
                    <Button
                      className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-sm"
                      size="default"
                      onClick={() => handleEdit(position)}>
                      编辑
                    </Button>
                    <Button
                      className="flex-1 bg-blue-100 text-red-600 py-2 rounded break-keep text-sm"
                      size="default"
                      onClick={() => handleDelete(position)}>
                      删除
                    </Button>
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
