/**
 * 培训管理页面（HR端）
 *
 * 功能：
 * - 查看所有培训记录
 * - 管理培训计划
 * - 查看培训评估结果
 * - 统计培训完成情况
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  createTrainingRecord,
  getTenantTrainingRecords,
  type TrainingRecord,
  updateTrainingRecord
} from '@/db/api-interview-flow'
import {useTenantStore} from '@/store/tenant'

const TrainingManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'in_progress' | 'completed'>('in_progress')
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // 新增培训记录表单
  const [addForm, setAddForm] = useState({
    employee_id: '',
    course_id: '',
    assigned_date: '',
    trainer_id: '',
    feedback: ''
  })

  // 加载培训记录
  const loadRecords = useCallback(async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const allRecords = await getTenantTrainingRecords(currentTenant.id)
      setRecords(allRecords)
    } catch (error) {
      console.error('加载培训记录失败:', error)
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
    loadRecords()
  })

  // 打开详情
  const handleOpenDetail = (record: TrainingRecord) => {
    setSelectedRecord(record)
    setShowDetailModal(true)
  }

  // 打开新增弹窗
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0]
    setAddForm({
      employee_id: '',
      course_id: '',
      assigned_date: today,
      trainer_id: '',
      feedback: ''
    })
    setShowAddModal(true)
  }

  // 提交新增培训记录
  const handleSubmitAdd = async () => {
    if (!currentTenant) return

    // 验证必填项
    if (!addForm.employee_id || !addForm.course_id || !addForm.assigned_date) {
      Taro.showToast({
        title: '请填写所有必填项',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      Taro.showLoading({title: '创建中...'})

      const result = await createTrainingRecord({
        tenant_id: currentTenant.id,
        employee_id: addForm.employee_id,
        course_id: addForm.course_id,
        assigned_date: addForm.assigned_date,
        start_date: null,
        completion_date: null,
        status: 'pending',
        score: null,
        passed: null,
        trainer_id: addForm.trainer_id || null,
        feedback: addForm.feedback || null
      })

      Taro.hideLoading()

      if (result) {
        Taro.showToast({
          title: '创建成功！',
          icon: 'success',
          duration: 2000
        })

        setShowAddModal(false)
        loadRecords()
      } else {
        Taro.showToast({
          title: '创建失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('创建培训记录失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 完成培训
  const handleCompleteTraining = async (recordId: string) => {
    try {
      const result = await Taro.showModal({
        title: '确认完成',
        content: '确定该培训已完成吗？',
        confirmText: '确定',
        cancelText: '取消'
      })

      if (!result.confirm) return

      Taro.showLoading({title: '处理中...'})

      const success = await updateTrainingRecord(recordId, {
        status: 'completed',
        completion_date: new Date().toISOString().split('T')[0]
      })

      Taro.hideLoading()

      if (success) {
        Taro.showToast({
          title: '培训已完成！',
          icon: 'success',
          duration: 2000
        })

        setShowDetailModal(false)
        loadRecords()
      } else {
        Taro.showToast({
          title: '操作失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('完成培训失败:', error)
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
      scheduled: {text: '已安排', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      in_progress: {text: '进行中', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      completed: {text: '已完成', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      cancelled: {text: '已取消', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
    }
    return statusMap[status] || {text: status, color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 获取评分颜色
  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 90) return 'text-muted-foreground'
    if (score >= 80) return 'text-muted-foreground'
    if (score >= 70) return 'text-muted-foreground'
    return 'text-red-600'
  }

  // 获取显示的培训列表
  const displayRecords =
    activeTab === 'in_progress'
      ? records.filter((r) => r.status === 'pending' || r.status === 'in_progress')
      : records.filter((r) => r.status === 'completed')

  // 计算统计数据
  const stats = {
    total: records.length,
    inProgress: records.filter((r) => r.status === 'pending' || r.status === 'in_progress').length,
    completed: records.filter((r) => r.status === 'completed').length,
    avgScore:
      records.filter((r) => r.score).length > 0
        ? Math.round(
            records.filter((r) => r.score).reduce((sum, r) => sum + (r.score || 0), 0) /
              records.filter((r) => r.score).length
          )
        : 0
  }

  // 租户检查
  if (!currentTenant) {
    return (
      <View className="@container min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border bg-transparent">
          <View className="p-4 max-sm:p-3">
            <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200">
              <View className="flex flex-col items-center justify-center py-12 max-sm:py-8 max-sm:py-6">
                <View className="i-mdi-alert-circle text-6xl text-muted-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
                <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
                  请先选择租户
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-6 text-center">
                  您需要先选择一个租户才能访问培训管理功能
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
                <View className="i-mdi-school text-4xl max-sm:text-3xl text-muted-foreground mr-3 max-sm:mr-2" />
                <View className="flex-1">
                  <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">
                    培训管理
                  </Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                    管理员工培训计划和评估
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
            <View className="grid grid-cols-2 gap-3 max-sm:gap-2 max-sm:gap-1.5">
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">全部培训</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600 mt-1">
                  {stats.total}
                </Text>
              </View>
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">进行中</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.inProgress}
                </Text>
              </View>
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">已完成</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.completed}
                </Text>
              </View>
              <View className="bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">平均分</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.avgScore}
                </Text>
              </View>
            </View>
          </View>

          {/* 标签切换 */}
          <View className="flex flex-row gap-2 max-sm:gap-1.5">
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all ${
                activeTab === 'in_progress' ? 'bg-blue-100 text-white' : 'bg-white text-muted-foreground'
              }`}
              size="default"
              onClick={() => setActiveTab('in_progress')}>
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

          {/* 培训记录列表 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              {activeTab === 'in_progress' ? '进行中的培训' : '已完成的培训'}
            </Text>

            {loading ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-loading text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
              </View>
            ) : displayRecords.length === 0 ? (
              <View className="text-center py-8 max-sm:py-6">
                <View className="i-mdi-school-outline text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                  {activeTab === 'in_progress' ? '暂无进行中的培训' : '暂无已完成的培训'}
                </Text>
              </View>
            ) : (
              <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                {displayRecords.map((record) => {
                  const statusInfo = getStatusInfo(record.status)

                  return (
                    <View key={record.id} className="border border-border rounded-xl p-4 max-sm:p-3">
                      {/* 培训标题 */}
                      <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex-1">
                          <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                            课程ID: {record.course_id}
                          </Text>
                          <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                            员工ID: {record.employee_id.substring(0, 8)}
                          </Text>
                        </View>
                        <View className={`${statusInfo.bgColor} px-3 max-sm:px-2 py-1 rounded-full`}>
                          <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                            {statusInfo.text}
                          </Text>
                        </View>
                      </View>

                      {/* 培训信息 */}
                      <View className="space-y-2 max-sm:space-y-1.5 mb-3 max-sm:mb-2 max-sm:mb-1.5">
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                            分配日期
                          </Text>
                          <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                            {formatDate(record.assigned_date)}
                          </Text>
                        </View>
                        {record.trainer_id && (
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              培训师ID
                            </Text>
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                              {record.trainer_id.substring(0, 8)}
                            </Text>
                          </View>
                        )}
                        {record.score && (
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              评估分数
                            </Text>
                            <Text
                              className={`text-sm max-sm:text-xs max-sm:text-[10px] font-bold ${getScoreColor(record.score)}`}>
                              {record.score}分
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 操作按钮 */}
                      <View className="flex flex-row gap-2 max-sm:gap-1.5">
                        <Button
                          className="flex-1 bg-blue-100 text-white py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                          size="default"
                          onClick={() => handleOpenDetail(record)}>
                          查看详情
                        </Button>
                        {(record.status === 'pending' || record.status === 'in_progress') && (
                          <Button
                            className="flex-1 bg-green-600 text-blue-600 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                            size="default"
                            onClick={() => handleCompleteTraining(record.id)}>
                            完成培训
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
          <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground font-medium mb-1">
                  温馨提示
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                  • 新员工入职后应及时安排岗前培训{'\n'}• 培训结束后应进行评估考核{'\n'}• 建议定期组织技能提升培训
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 详情弹窗 */}
      {showDetailModal && selectedRecord && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{zIndex: 1000}}
          onClick={() => setShowDetailModal(false)}>
          <View
            className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mx-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{maxHeight: '80vh', overflowY: 'auto'}}>
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              培训详情
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 基本信息 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  基本信息
                </Text>
                <View className="space-y-2 max-sm:space-y-1.5">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">课程ID</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {selectedRecord.course_id}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">员工ID</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {selectedRecord.employee_id.substring(0, 8)}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">分配日期</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {formatDate(selectedRecord.assigned_date)}
                    </Text>
                  </View>
                  {selectedRecord.trainer_id && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">培训师ID</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        {selectedRecord.trainer_id.substring(0, 8)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 评估信息 */}
              {selectedRecord.score && (
                <View>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                    评估信息
                  </Text>
                  <View className="space-y-2 max-sm:space-y-1.5">
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">评估分数</Text>
                      <Text
                        className={`text-sm max-sm:text-xs max-sm:text-[10px] font-bold ${getScoreColor(selectedRecord.score)}`}>
                        {selectedRecord.score}分
                      </Text>
                    </View>
                    {selectedRecord.feedback && (
                      <View>
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-1">
                          反馈意见
                        </Text>
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-foreground">
                          {selectedRecord.feedback}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* 状态信息 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  状态信息
                </Text>
                <View className="space-y-2 max-sm:space-y-1.5">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">当前状态</Text>
                    <Text
                      className={`text-sm max-sm:text-xs max-sm:text-[10px] font-medium ${getStatusInfo(selectedRecord.status).color}`}>
                      {getStatusInfo(selectedRecord.status).text}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={() => setShowDetailModal(false)}>
                关闭
              </Button>
              {(selectedRecord.status === 'pending' || selectedRecord.status === 'in_progress') && (
                <Button
                  className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                  size="default"
                  onClick={() => handleCompleteTraining(selectedRecord.id)}>
                  完成培训
                </Button>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 新增培训记录弹窗 */}
      {showAddModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 max-sm:p-3">
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 w-full max-w-md">
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              新增培训记录
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 员工ID */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  员工ID <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入员工ID"
                    value={addForm.employee_id}
                    onInput={(e) => setAddForm({...addForm, employee_id: e.detail.value})}
                  />
                </View>
              </View>

              {/* 课程ID */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  课程ID <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入课程ID"
                    value={addForm.course_id}
                    onInput={(e) => setAddForm({...addForm, course_id: e.detail.value})}
                  />
                </View>
              </View>

              {/* 分配日期 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  分配日期 <Text className="text-red-500">*</Text>
                </Text>
                <Picker
                  mode="date"
                  value={addForm.assigned_date}
                  onChange={(e) => setAddForm({...addForm, assigned_date: e.detail.value})}>
                  <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                    <Text className="text-foreground">{addForm.assigned_date || '请选择分配日期'}</Text>
                  </View>
                </Picker>
              </View>

              {/* 培训师ID */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  培训师ID
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入培训师ID（选填）"
                    value={addForm.trainer_id}
                    onInput={(e) => setAddForm({...addForm, trainer_id: e.detail.value})}
                  />
                </View>
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
                    value={addForm.feedback}
                    onInput={(e) => setAddForm({...addForm, feedback: e.detail.value})}
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

export default TrainingManagement
