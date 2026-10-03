// 智能排班配置页面
import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useCallback, useState} from 'react'
import {EmptyState} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {
  cancelWorkScheduleConfig,
  deleteWorkScheduleConfig,
  getAllWorkScheduleConfigs,
  publishWorkScheduleConfig
} from '@/db/api-schedule-config'
import type {WorkScheduleConfig} from '@/db/types-schedule'

const ScheduleConfig: React.FC = () => {
  const [configs, setConfigs] = useState<WorkScheduleConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // 加载排班配置列表
  const loadConfigs = useCallback(async () => {
    try {
      const data = await getAllWorkScheduleConfigs()
      setConfigs(data)
    } catch (error) {
      console.error('加载排班配置失败:', error)
      Taro.showToast({title: '加载失败', icon: 'error'})
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // 页面显示时加载数据
  useDidShow(() => {
    loadConfigs()
  })

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadConfigs()
  }, [loadConfigs])

  // 获取状态文本和样式
  const getStatusInfo = (status: string) => {
    const statusMap = {
      draft: {text: '草稿', color: 'text-gray-500', bg: 'bg-gray-50'},
      published: {text: '已发布', color: 'text-blue-600', bg: 'bg-green-500/10'},
      completed: {text: '已完成', color: 'text-white', bg: 'bg-green-100'},
      cancelled: {text: '已取消', color: 'text-red-600', bg: 'bg-red-100'}
    }
    return statusMap[status] || statusMap.draft
  }

  // 获取类型文本
  const getTypeText = (type: string) => {
    const typeMap = {
      daily: '日常排班',
      weekly: '周期排班',
      temporary: '临时排班'
    }
    return typeMap[type] || type
  }

  // 发布排班
  const handlePublish = async (id: string) => {
    const result = await Taro.showModal({
      title: '确认发布',
      content: '发布后排班将生效，确定要发布吗？'
    })

    if (result.confirm) {
      const success = await publishWorkScheduleConfig(id)
      if (success) {
        Taro.showToast({title: '发布成功', icon: 'success'})
        loadConfigs()
      } else {
        Taro.showToast({title: '发布失败', icon: 'error'})
      }
    }
  }

  // 取消排班
  const handleCancel = async (id: string) => {
    const result = await Taro.showModal({
      title: '确认取消',
      content: '取消后排班将失效，确定要取消吗？'
    })

    if (result.confirm) {
      const success = await cancelWorkScheduleConfig(id)
      if (success) {
        Taro.showToast({title: '取消成功', icon: 'success'})
        loadConfigs()
      } else {
        Taro.showToast({title: '取消失败', icon: 'error'})
      }
    }
  }

  // 删除排班
  const handleDelete = async (id: string) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除吗？'
    })

    if (result.confirm) {
      const success = await deleteWorkScheduleConfig(id)
      if (success) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        loadConfigs()
      } else {
        Taro.showToast({title: '删除失败', icon: 'error'})
      }
    }
  }

  // 查看详情
  const handleViewDetail = (id: string) => {
    Taro.navigateTo({url: `/packageA/pages/schedule-config-detail/index?id=${id}`})
  }

  // 创建排班
  const handleCreate = () => {
    Taro.navigateTo({url: '/packageA/pages/schedule-config-create/index'})
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50">
        <SkeletonList count={5} />
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={onRefresh}>
        <View className="p-4 space-y-4">
          {/* 创建按钮 */}
          <Button
            className="w-full bg-blue-100 text-white py-4 rounded-lg break-keep text-base"
            size="default"
            onClick={handleCreate}>
            <View className="flex items-center justify-center gap-2">
              <View className="i-mdi-plus text-xl" />
              <Text>创建排班配置</Text>
            </View>
          </Button>

          {/* 排班配置列表 */}
          {configs.length === 0 ? (
            <View className="flex flex-col items-center justify-center py-12">
              <EmptyState
                icon="i-mdi-calendar-blank"
                title="暂无排班配置"
                description="点击上方按钮创建第一个排班配置"
              />
              <Button
                className="mt-4 bg-blue-100 text-white px-6 py-2 rounded break-keep text-sm"
                size="default"
                onClick={handleCreate}>
                立即创建
              </Button>
            </View>
          ) : (
            configs.map((config) => {
              const statusInfo = getStatusInfo(config.status)
              return (
                <View
                  key={config.id}
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border">
                  {/* 标题和状态 */}
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">{config.name}</Text>
                      <Text className="text-sm text-muted-foreground mt-1">{getTypeText(config.type)}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${statusInfo.bg}`}>
                      <Text className={`text-xs ${statusInfo.color}`}>{statusInfo.text}</Text>
                    </View>
                  </View>

                  {/* 描述 */}
                  {config.description && (
                    <Text className="text-sm text-muted-foreground mb-3">{config.description}</Text>
                  )}

                  {/* 日期范围 */}
                  <View className="flex items-center gap-2 mb-3">
                    <View className="i-mdi-calendar text-muted-foreground" />
                    <Text className="text-sm text-muted-foreground">
                      {config.start_date}
                      {config.end_date && ` 至 ${config.end_date}`}
                    </Text>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      className="flex-1 bg-blue-100 text-blue-600 py-2 rounded break-keep text-sm"
                      size="default"
                      onClick={() => handleViewDetail(config.id)}>
                      查看详情
                    </Button>

                    {config.status === 'draft' && (
                      <Button
                        className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-sm"
                        size="default"
                        onClick={() => handlePublish(config.id)}>
                        发布
                      </Button>
                    )}

                    {config.status === 'published' && (
                      <Button
                        className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-sm"
                        size="default"
                        onClick={() => handleCancel(config.id)}>
                        取消
                      </Button>
                    )}

                    {(config.status === 'draft' || config.status === 'cancelled') && (
                      <Button
                        className="flex-1 bg-blue-100 text-white py-2 rounded break-keep text-sm"
                        size="default"
                        onClick={() => handleDelete(config.id)}>
                        删除
                      </Button>
                    )}
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default ScheduleConfig
