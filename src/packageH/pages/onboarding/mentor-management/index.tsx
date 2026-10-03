/**
 * 导师分配管理页面（HR端）
 *
 * 功能：
 * - 查看所有导师分配记录
 * - 为新员工分配导师
 * - 管理导师-学员关系
 * - 查看导师带教情况
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  createMentorRelationship,
  getTenantMentorRelationships,
  type MentorRelationship,
  updateMentorRelationship
} from '@/db/api-interview-flow'
import {useTenantStore} from '@/store/tenant'

const MentorManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [assignments, setAssignments] = useState<MentorRelationship[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [selectedAssignment, setSelectedAssignment] = useState<MentorRelationship | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // 新增导师关系表单
  const [addForm, setAddForm] = useState({
    mentor_id: '',
    mentee_id: '',
    start_date: '',
    notes: ''
  })

  // 加载导师分配记录
  const loadAssignments = useCallback(async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const allAssignments = await getTenantMentorRelationships(currentTenant.id)
      setAssignments(allAssignments)
    } catch (error) {
      console.error('加载导师分配记录失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadAssignments()
  })

  // 打开详情
  const handleOpenDetail = (assignment: MentorRelationship) => {
    setSelectedAssignment(assignment)
    setShowDetailModal(true)
  }

  // 打开新增弹窗
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0]
    setAddForm({
      mentor_id: '',
      mentee_id: '',
      start_date: today,
      notes: ''
    })
    setShowAddModal(true)
  }

  // 提交新增导师关系
  const handleSubmitAdd = async () => {
    if (!currentTenant) return

    // 验证必填项
    if (!addForm.mentor_id || !addForm.mentee_id || !addForm.start_date) {
      Taro.showToast({
        title: '请填写所有必填项',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      Taro.showLoading({title: '创建中...'})

      const result = await createMentorRelationship({
        tenant_id: currentTenant.id,
        mentor_id: addForm.mentor_id,
        mentee_id: addForm.mentee_id,
        start_date: addForm.start_date,
        end_date: null,
        status: 'active',
        notes: addForm.notes || null
      })

      Taro.hideLoading()

      if (result) {
        Taro.showToast({
          title: '创建成功！',
          icon: 'success',
          duration: 2000
        })

        setShowAddModal(false)
        loadAssignments()
      } else {
        Taro.showToast({
          title: '创建失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('创建导师关系失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 完成带教
  const handleCompleteAssignment = async (assignmentId: string) => {
    try {
      const result = await Taro.showModal({
        title: '确认完成',
        content: '确定该导师带教已完成吗？',
        confirmText: '确定',
        cancelText: '取消'
      })

      if (!result.confirm) return

      Taro.showLoading({title: '处理中...'})

      const success = await updateMentorRelationship(assignmentId, {
        status: 'completed',
        end_date: new Date().toISOString().split('T')[0]
      })

      Taro.hideLoading()

      if (success) {
        Taro.showToast({
          title: '带教已完成！',
          icon: 'success',
          duration: 2000
        })

        setShowDetailModal(false)
        loadAssignments()
      } else {
        Taro.showToast({
          title: '操作失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('完成带教失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 获取状态信息
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      active: {text: '进行中', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      completed: {text: '已完成', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      cancelled: {text: '已取消', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
    }
    return statusMap[status] || {text: status, color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 计算带教天数
  const calculateDays = (startDate: string, endDate: string | null) => {
    const start = new Date(startDate)
    const end = endDate ? new Date(endDate) : new Date()
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // 获取显示的分配列表
  const displayAssignments =
    activeTab === 'active'
      ? assignments.filter((a) => a.status === 'active')
      : assignments.filter((a) => a.status === 'completed')

  // 计算统计数据
  const stats = {
    total: assignments.length,
    active: assignments.filter((a) => a.status === 'active').length,
    completed: assignments.filter((a) => a.status === 'completed').length
  }

  // 租户检查
  if (!currentTenant) {
    return (
      <View className="@container min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border bg-transparent">
          <View className="p-4 max-sm:p-3">
            <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200">
              <View className="flex flex-col items-center justify-center py-12 max-sm:py-8 max-sm:py-6">
                <View className="i-mdi-alert-circle text-6xl text-amber-600 mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
                <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
                  请先选择租户
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-6 text-center">
                  您需要先选择一个租户才能访问导师分配管理功能
                </Text>
                <Button
                  size="default"
                  className="bg-blue-100 text-white px-6 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                  onClick={() => {
                    Taro.navigateTo({url: '/pages/tenant-select/index'})
                  }}>
                  选择租户
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 max-sm:p-3 space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
          {/* 顶部标题卡片 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="flex flex-row items-center flex-1">
                <View className="i-mdi-account-supervisor text-4xl max-sm:text-3xl text-amber-600 mr-3 max-sm:mr-2" />
                <View className="flex-1">
                  <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-amber-600">
                    导师分配管理
                  </Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                    管理导师带教关系
                  </Text>
                </View>
              </View>
              <Button
                className="bg-green-500 text-white active:opacity-80 transition-all px-4 max-sm:px-3 max-sm:px-2 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                size="default"
                onClick={handleOpenAdd}>
                <View className="flex flex-row items-center gap-1">
                  <View className="i-mdi-plus text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px]" />
                  <Text className="text-white">新增</Text>
                </View>
              </Button>
            </View>

            {/* 统计信息 */}
            <View className="flex flex-row gap-4 max-sm:p-3">
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">全部分配</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600 mt-1">
                  {stats.total}
                </Text>
              </View>
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">进行中</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.active}
                </Text>
              </View>
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">已完成</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.completed}
                </Text>
              </View>
            </View>
          </View>

          {/* 标签切换 */}
          <View className="flex flex-row gap-2 max-sm:gap-1.5">
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all ${
                activeTab === 'active' ? 'bg-blue-100 text-white' : 'bg-white text-muted-foreground'
              }`}
              size="default"
              onClick={() => setActiveTab('active')}>
              进行中
            </Button>
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all ${
                activeTab === 'completed' ? 'bg-blue-100 text-white' : 'bg-white text-muted-foreground'
              }`}
              size="default"
              onClick={() => setActiveTab('completed')}>
              已完成
            </Button>
          </View>

          {/* 导师分配列表 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              {activeTab === 'active' ? '进行中的带教' : '已完成的带教'}
            </Text>

            {loading ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-loading text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
              </View>
            ) : displayAssignments.length === 0 ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-account-off text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                  {activeTab === 'active' ? '暂无进行中的带教' : '暂无已完成的带教'}
                </Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {displayAssignments.map((assignment) => {
                  const statusInfo = getStatusInfo(assignment.status)
                  const days = calculateDays(assignment.start_date, assignment.end_date)

                  return (
                    <View key={assignment.id} className="border border-border rounded-xl p-4 max-sm:p-3">
                      {/* 分配标题 */}
                      <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex-1">
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                            导师ID: {assignment.mentor_id.substring(0, 8)}
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                            学员ID: {assignment.mentee_id.substring(0, 8)}
                          </Text>
                        </View>
                        <View className={`${statusInfo.bgColor} px-3 max-sm:px-2 py-1 rounded-full`}>
                          <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>

                      {/* 分配信息 */}
                      <View className="space-y-2 max-sm:space-y-1.5 mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            开始日期
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {formatDate(assignment.start_date)}
                          </Text>
                        </View>
                        {assignment.end_date && (
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              结束日期
                            </Text>
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                              {formatDate(assignment.end_date)}
                            </Text>
                          </View>
                        )}
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            带教天数
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {days}天
                          </Text>
                        </View>
                      </View>

                      {/* 操作按钮 */}
                      <View className="flex flex-row gap-2 max-sm:gap-1.5">
                        <Button
                          className="flex-1 bg-blue-100 text-white py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                          size="default"
                          onClick={() => handleOpenDetail(assignment)}>
                          查看详情
                        </Button>
                        {assignment.status === 'active' && (
                          <Button
                            className="flex-1 bg-green-600 text-blue-600 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                            size="default"
                            onClick={() => handleCompleteAssignment(assignment.id)}>
                            完成带教
                          </Button>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 温馨提示 */}
          <View className="bg-amber-50 rounded-xl p-4 max-sm:p-3">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-amber-600 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-amber-600 font-medium mb-1">
                  温馨提示
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                  • 导师应具备丰富的工作经验和良好的沟通能力{'\n'}• 建议导师每周与学员进行至少一次沟通{'\n'}•
                  带教期间应定期评估学员的学习进度
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 详情弹窗 */}
      {showDetailModal && selectedAssignment && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{zIndex: 1000}}
          onClick={() => setShowDetailModal(false)}>
          <View
            className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mx-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{maxHeight: '80vh', overflowY: 'auto'}}>
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              导师分配详情
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 基本信息 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  基本信息
                </Text>
                <View className="space-y-2 max-sm:space-y-1.5">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">导师ID</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {selectedAssignment.mentor_id.substring(0, 8)}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">学员ID</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {selectedAssignment.mentee_id.substring(0, 8)}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">开始日期</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {formatDate(selectedAssignment.start_date)}
                    </Text>
                  </View>
                  {selectedAssignment.end_date && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">结束日期</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        {formatDate(selectedAssignment.end_date)}
                      </Text>
                    </View>
                  )}
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">带教天数</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {calculateDays(selectedAssignment.start_date, selectedAssignment.end_date)}天
                    </Text>
                  </View>
                </View>
              </View>

              {/* 状态信息 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  状态信息
                </Text>
                <View className="space-y-2 max-sm:space-y-1.5">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">当前状态</Text>
                    <Text
                      className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium ${getStatusInfo(selectedAssignment.status).color}`}>
                      {getStatusInfo(selectedAssignment.status).text}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedAssignment.notes && (
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                    备注
                  </Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                    {selectedAssignment.notes}
                  </Text>
                </View>
              )}
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
              {selectedAssignment.status === 'active' && (
                <Button
                  className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                  size="default"
                  onClick={() => handleCompleteAssignment(selectedAssignment.id)}>
                  完成带教
                </Button>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 新增导师关系弹窗 */}
      {showAddModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 max-sm:p-3">
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 w-full max-w-md">
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              新增导师关系
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 导师ID */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  导师ID <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入导师员工ID"
                    value={addForm.mentor_id}
                    onInput={(e) => setAddForm({...addForm, mentor_id: e.detail.value})}
                  />
                </View>
              </View>

              {/* 学员ID */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  学员ID <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入学员员工ID"
                    value={addForm.mentee_id}
                    onInput={(e) => setAddForm({...addForm, mentee_id: e.detail.value})}
                  />
                </View>
              </View>

              {/* 开始日期 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  开始日期 <Text className="text-red-500">*</Text>
                </Text>
                <Picker
                  mode="date"
                  value={addForm.start_date}
                  onChange={(e) => setAddForm({...addForm, start_date: e.detail.value})}>
                  <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                    <Text className="text-foreground">{addForm.start_date || '请选择开始日期'}</Text>
                  </View>
                </Picker>
              </View>

              {/* 备注 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  备注
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入备注信息"
                    value={addForm.notes}
                    onInput={(e) => setAddForm({...addForm, notes: e.detail.value})}
                    maxlength={200}
                  />
                </View>
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={handleSubmitAdd}>
                确定
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default MentorManagement
