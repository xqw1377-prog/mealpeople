import {Button, Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {getRegularizationsByTenant} from '@/db/api'
import type {RegularizationApplication} from '@/db/types'

const RegularizationList: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [regularizations, setRegularizations] = useState<RegularizationApplication[]>([])
  const [searchText, setSearchText] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // 加载转正申请列表
  const loadRegularizations = useCallback(async () => {
    setLoading(true)
    try {
      const tenantId = '00000000-0000-0000-0000-000000000001'
      const data = await getRegularizationsByTenant(tenantId)
      setRegularizations(data)
    } catch (error) {
      console.error('加载转正申请失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRegularizations()
  }, [loadRegularizations])

  // 页面显示时刷新数据
  useDidShow(() => {
    loadRegularizations()
  })

  // 筛选申请
  const filteredRegularizations = regularizations.filter((item) => {
    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      const matchId = item.employee_id.toLowerCase().includes(searchLower)
      if (!matchId) return false
    }

    // 状态过滤
    if (filterStatus !== 'all' && item.status !== filterStatus) {
      return false
    }

    return true
  })

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      pending: {text: '待审批', color: 'text-yellow-700', bgColor: 'bg-yellow-100'},
      approved: {text: '已通过', color: 'text-green-700', bgColor: 'bg-green-100'},
      rejected: {text: '已拒绝', color: 'text-red-700', bgColor: 'bg-red-100'}
    }
    return statusMap[status] || {text: status, color: 'text-gray-700', bgColor: 'bg-gray-100'}
  }

  // 查看详情
  const handleViewDetail = useCallback((id: string) => {
    Taro.navigateTo({
      url: `/packageH/pages/regularization-detail/index?id=${id}`
    })
  }, [])

  return (
    <View className="min-h-screen bg-background">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground">转正审批</Text>
            <Text className="text-sm text-muted-foreground mt-1">共 {regularizations.length} 条申请</Text>
          </View>

          {/* 搜索框 */}
          <View className="mb-4">
            <View style={{overflow: 'hidden'}}>
              <Input
                className="bg-card text-foreground px-4 py-3 rounded-lg border border-border w-full"
                placeholder="搜索员工工号"
                value={searchText}
                onInput={(e) => setSearchText(e.detail.value)}
              />
            </View>
          </View>

          {/* 状态筛选 */}
          <View className="flex flex-row gap-2 mb-4 overflow-x-auto">
            <Button
              className={`py-2 px-4 rounded-lg break-keep text-sm whitespace-nowrap ${
                filterStatus === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
              size="default"
              onClick={() => setFilterStatus('all')}>
              全部
            </Button>
            <Button
              className={`py-2 px-4 rounded-lg break-keep text-sm whitespace-nowrap ${
                filterStatus === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
              size="default"
              onClick={() => setFilterStatus('pending')}>
              待审批
            </Button>
            <Button
              className={`py-2 px-4 rounded-lg break-keep text-sm whitespace-nowrap ${
                filterStatus === 'approved' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
              size="default"
              onClick={() => setFilterStatus('approved')}>
              已通过
            </Button>
            <Button
              className={`py-2 px-4 rounded-lg break-keep text-sm whitespace-nowrap ${
                filterStatus === 'rejected' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
              }`}
              size="default"
              onClick={() => setFilterStatus('rejected')}>
              已拒绝
            </Button>
          </View>

          {/* 申请列表 */}
          {loading ? (
            <View className="flex items-center justify-center py-20">
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : filteredRegularizations.length === 0 ? (
            <View className="flex items-center justify-center py-20">
              <View className="i-mdi-file-document-outline text-6xl text-muted-foreground mb-4" />
              <Text className="text-muted-foreground">暂无转正申请</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredRegularizations.map((item) => {
                const statusDisplay = getStatusDisplay(item.status)

                return (
                  <View key={item.id} className="bg-card rounded-lg p-4 shadow-sm">
                    {/* 状态标签 */}
                    <View className="flex flex-row items-center justify-between mb-3">
                      <View className={`px-3 py-1 rounded-full ${statusDisplay.bgColor}`}>
                        <Text className={`text-sm font-semibold ${statusDisplay.color}`}>{statusDisplay.text}</Text>
                      </View>
                      <Text className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('zh-CN')}
                      </Text>
                    </View>

                    {/* 员工信息 */}
                    <View className="mb-3">
                      <View className="flex flex-row items-center gap-2 mb-2">
                        <View className="i-mdi-account text-lg text-primary" />
                        <Text className="text-base font-semibold text-foreground">员工工号：{item.employee_id}</Text>
                      </View>
                    </View>

                    {/* 自我评价预览 */}
                    <View className="bg-muted rounded-lg p-3 mb-3">
                      <Text className="text-xs text-muted-foreground mb-1">自我评价</Text>
                      <Text className="text-sm text-foreground line-clamp-2">{item.self_evaluation}</Text>
                    </View>

                    {/* 工作成果预览 */}
                    <View className="bg-muted rounded-lg p-3 mb-3">
                      <Text className="text-xs text-muted-foreground mb-1">工作成果</Text>
                      <Text className="text-sm text-foreground line-clamp-2">{item.work_summary || '暂无'}</Text>
                    </View>

                    {/* 审批信息 */}
                    {item.approval_comment && (
                      <View className="bg-blue-50 rounded-lg p-3 mb-3">
                        <Text className="text-xs text-blue-700 mb-1">审批意见</Text>
                        <Text className="text-sm text-blue-900">{item.approval_comment}</Text>
                      </View>
                    )}

                    {/* 操作按钮 */}
                    <View className="flex flex-row gap-2">
                      <Button
                        className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm break-keep"
                        size="default"
                        onClick={() => handleViewDetail(item.id)}>
                        查看详情
                      </Button>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default RegularizationList
