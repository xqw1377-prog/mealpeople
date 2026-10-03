import {Button, Picker, ScrollView, Text, View} from '@tarojs/components'
import {navigateTo, showModal, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {approveResignation, getResignationsByStore} from '@/db/api'
import type {EmployeeResignation} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const ResignationList: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)
  const [resignations, setResignations] = useState<EmployeeResignation[]>([])
  const [filteredResignations, setFilteredResignations] = useState<EmployeeResignation[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [statusIndex, setStatusIndex] = useState(0)

  const statusOptions = ['全部', '待审批', '已通过', '已拒绝', '已完成']
  const statusValues = ['all', 'pending', 'approved', 'rejected', 'completed']

  // 加载离职申请列表
  const loadData = useCallback(async () => {
    if (!currentStore) {
      showToast({title: '请先选择门店', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const data = await getResignationsByStore(currentStore.id)
      setResignations(data)
      setFilteredResignations(data)
    } catch (error) {
      console.error('加载离职申请列表失败:', error)
      showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentStore])

  useEffect(() => {
    loadData()
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  // 筛选处理
  useEffect(() => {
    let filtered = resignations

    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    setFilteredResignations(filtered)
  }, [resignations, statusFilter])

  // 审批处理
  const handleApprove = async (id: string, approved: boolean) => {
    const result = await showModal({
      title: approved ? '通过申请' : '拒绝申请',
      content: `确定要${approved ? '通过' : '拒绝'}这个离职申请吗？`,
      confirmText: '确定',
      cancelText: '取消'
    })

    if (!result.confirm || !user) return

    const success = await approveResignation(id, approved, user.id)

    if (success) {
      showToast({title: approved ? '已通过' : '已拒绝', icon: 'success'})
      loadData()
    } else {
      showToast({title: '操作失败', icon: 'none'})
    }
  }

  // 状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // 状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审批'
      case 'approved':
        return '已通过'
      case 'rejected':
        return '已拒绝'
      case 'completed':
        return '已完成'
      default:
        return '未知'
    }
  }

  // 离职类型文本
  const getTypeText = (type: string) => {
    switch (type) {
      case 'voluntary':
        return '主动离职'
      case 'involuntary':
        return '被动离职'
      case 'contract_end':
        return '合同到期'
      default:
        return '未知'
    }
  }

  // 离职类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'voluntary':
        return 'text-blue-600'
      case 'involuntary':
        return 'text-red-600'
      case 'contract_end':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  if (!currentTenant || !currentStore) {
    return (
      <View className="min-h-screen bg-gray-50 p-4">
        <View className="bg-white rounded-lg p-8 text-center">
          <View className="i-mdi-alert-circle-outline text-6xl text-yellow-500 mx-auto mb-4" />
          <Text className="text-base text-gray-700 block mb-2">请先选择门店</Text>
          <Text className="text-sm text-gray-500 block">选择门店后即可查看离职申请</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border">
        <View className="p-4">
          {/* 标题和操作按钮 */}
          <View className="flex items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-foreground block mb-1">离职管理</Text>
              <Text className="text-sm text-muted-foreground block">共 {filteredResignations.length} 条申请</Text>
            </View>
            <Button
              className="bg-primary text-white rounded-xl text-xs break-keep"
              size="mini"
              onClick={() => navigateTo({url: '/packageH/pages/resignation-apply/index'})}>
              ➕ 新建申请
            </Button>
          </View>

          {/* 当前门店显示 */}
          <View className="bg-blue-50 rounded-lg p-4 mb-4">
            <View className="flex items-center gap-2">
              <View className="i-mdi-store text-2xl text-blue-600" />
              <View>
                <Text className="text-xs text-blue-600 block mb-1">当前门店</Text>
                <Text className="text-base font-bold text-foreground">{currentStore.name}</Text>
              </View>
            </View>
          </View>

          {/* 筛选器 */}
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-sm text-gray-600 mb-2">状态筛选</Text>
            <Picker
              mode="selector"
              range={statusOptions}
              value={statusIndex}
              onChange={(e) => {
                const index = Number(e.detail.value)
                setStatusIndex(index)
                setStatusFilter(statusValues[index])
              }}>
              <View className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <Text className="text-gray-700">{statusOptions[statusIndex]}</Text>
                <View className="i-mdi-chevron-down text-xl text-gray-400" />
              </View>
            </Picker>
          </View>

          {/* 离职申请列表 */}
          {loading ? (
            <View className="bg-white rounded-lg p-8 text-center">
              <Text className="text-gray-500">加载中...</Text>
            </View>
          ) : filteredResignations.length === 0 ? (
            <View className="bg-white rounded-lg p-8 text-center">
              <View className="i-mdi-file-document-outline text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-base text-gray-500 block mb-2">暂无离职申请</Text>
              <Text className="text-sm text-gray-400 block">点击右上角"新建申请"添加</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredResignations.map((item) => (
                <View key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                  {/* 员工信息 */}
                  <View className="flex items-center justify-between mb-3">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-account text-2xl text-orange-500" />
                      <View>
                        <Text className="text-base font-semibold text-gray-800 block">
                          员工ID: {item.employee_id.substring(0, 8)}
                        </Text>
                        <Text className={`text-xs font-medium ${getTypeColor(item.resignation_type)}`}>
                          {getTypeText(item.resignation_type)}
                        </Text>
                      </View>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                      <Text className="text-xs font-medium">{getStatusText(item.status)}</Text>
                    </View>
                  </View>

                  {/* 详细信息 */}
                  <View className="space-y-2 mb-3">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-calendar text-lg text-gray-400" />
                      <Text className="text-sm text-gray-600">离职日期：{item.resignation_date}</Text>
                    </View>
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-calendar-check text-lg text-gray-400" />
                      <Text className="text-sm text-gray-600">最后工作日：{item.last_working_day}</Text>
                    </View>
                    <View className="flex items-start gap-2">
                      <View className="i-mdi-text-box text-lg text-gray-400 mt-0.5" />
                      <Text className="text-sm text-gray-600 flex-1">离职原因：{item.resignation_reason}</Text>
                    </View>
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex gap-2 pt-3 border-t border-gray-100">
                    <Button
                      className="flex-1 bg-blue-50 text-blue-600 rounded-lg text-sm break-keep"
                      size="default"
                      onClick={() => navigateTo({url: `/packageH/pages/resignation-detail/index?id=${item.id}`})}>
                      查看详情
                    </Button>
                    {item.status === 'pending' && (
                      <>
                        <Button
                          className="flex-1 bg-green-50 text-green-600 rounded-lg text-sm break-keep"
                          size="default"
                          onClick={() => handleApprove(item.id, true)}>
                          通过
                        </Button>
                        <Button
                          className="flex-1 bg-red-50 text-red-600 rounded-lg text-sm break-keep"
                          size="default"
                          onClick={() => handleApprove(item.id, false)}>
                          拒绝
                        </Button>
                      </>
                    )}
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

export default ResignationList
