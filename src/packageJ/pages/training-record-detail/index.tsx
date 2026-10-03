/**
 * 培训记录详情页面
 * 3.0 版本 - 培训管理系统
 */

import {Button, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow, useRouter} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getTrainingRecordById, updateTrainingRecord} from '@/db/api-training'
import type {TrainingRecordDetail as TrainingRecordDetailType, TrainingStatus} from '@/db/types-training'
import {TRAINING_STATUS_COLORS, TRAINING_STATUS_NAMES} from '@/db/types-training'

const TrainingRecordDetail: React.FC = () => {
  const {user} = useAuth({guard: true})
  const router = useRouter()
  const recordId = router.params.id || ''

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [record, setRecord] = useState<TrainingRecordDetailType | null>(null)

  // 编辑模式
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    status: 'enrolled' as TrainingStatus,
    progress: 0,
    score: null as number | null,
    feedback: ''
  })

  // 状态选项
  const statusOptions = Object.entries(TRAINING_STATUS_NAMES).map(([value, label]) => ({
    value,
    label
  }))

  const [statusIndex, setStatusIndex] = useState(0)

  // 加载培训记录
  const loadRecord = useCallback(async () => {
    if (!recordId) return

    setLoading(true)
    try {
      const data = await getTrainingRecordById(recordId)
      if (data) {
        setRecord(data)
        setEditData({
          status: data.status,
          progress: data.progress,
          score: data.score,
          feedback: data.feedback || ''
        })

        // 设置状态索引
        const index = statusOptions.findIndex((o) => o.value === data.status)
        if (index >= 0) {
          setStatusIndex(index)
        }
      }
    } catch (error) {
      console.error('加载培训记录失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [recordId, statusOptions.findIndex])

  useDidShow(() => {
    loadRecord()
  })

  // 处理状态选择
  const handleStatusChange = (e: any) => {
    const index = e.detail.value
    setStatusIndex(index)
    setEditData({
      ...editData,
      status: statusOptions[index].value as TrainingStatus
    })
  }

  // 保存修改
  const handleSave = async () => {
    // 验证数据
    if (editData.progress < 0 || editData.progress > 100) {
      Taro.showToast({
        title: '进度必须在0-100之间',
        icon: 'none'
      })
      return
    }

    if (editData.score !== null && (editData.score < 0 || editData.score > 100)) {
      Taro.showToast({
        title: '分数必须在0-100之间',
        icon: 'none'
      })
      return
    }

    setSubmitting(true)
    try {
      await updateTrainingRecord(recordId, {
        status: editData.status,
        progress: editData.progress,
        score: editData.score,
        feedback: editData.feedback || null,
        started_at: editData.status === 'in_progress' && !record?.started_at ? new Date().toISOString() : undefined,
        completed_at: editData.status === 'completed' && !record?.completed_at ? new Date().toISOString() : undefined
      })

      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setIsEditing(false)
      loadRecord()
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50">
        <View className="p-4">
          <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
            <View className="i-mdi-loading animate-spin text-4xl text-blue-600 mb-2" />
            <Text className="text-muted-foreground">加载中...</Text>
          </View>
        </View>
      </View>
    )
  }

  if (!record) {
    return (
      <View className="min-h-screen bg-gray-50">
        <View className="p-4">
          <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
            <View className="i-mdi-alert-circle text-4xl text-red-500 mb-2" />
            <Text className="text-muted-foreground">培训记录不存在</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex flex-row items-center gap-3">
              <View className="i-mdi-clipboard-text text-3xl text-blue-600" />
              <View>
                <Text className="text-2xl font-bold text-foreground">培训记录详情</Text>
                <Text className="text-sm text-muted-foreground mt-1">查看和管理培训进度</Text>
              </View>
            </View>
          </View>

          {/* 课程信息 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm space-y-3">
            <Text className="text-lg font-bold text-foreground">课程信息</Text>
            <View className="space-y-2">
              <View>
                <Text className="text-sm text-muted-foreground">课程名称</Text>
                <Text className="text-base text-foreground mt-1">{record.course?.title || record.course_title}</Text>
              </View>
              <View>
                <Text className="text-sm text-muted-foreground">课程时长</Text>
                <Text className="text-base text-foreground mt-1">
                  {record.course?.duration_hours || record.course_duration_hours} 小时
                </Text>
              </View>
              {(record.course?.instructor || record.course_instructor) && (
                <View>
                  <Text className="text-sm text-muted-foreground">讲师</Text>
                  <Text className="text-base text-foreground mt-1">
                    {record.course?.instructor || record.course_instructor}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 员工信息 */}
          {record.employee && (
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm space-y-3">
              <Text className="text-lg font-bold text-foreground">员工信息</Text>
              <View className="space-y-2">
                <View>
                  <Text className="text-sm text-muted-foreground">姓名</Text>
                  <Text className="text-base text-foreground mt-1">{record.employee.name}</Text>
                </View>
                {record.employee.position && (
                  <View>
                    <Text className="text-sm text-muted-foreground">岗位</Text>
                    <Text className="text-base text-foreground mt-1">{record.employee.position}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 培训状态 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm space-y-4">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">培训状态</Text>
              {!isEditing && (
                <Button
                  className="bg-blue-100 text-white px-4 py-2 rounded-lg break-keep text-sm"
                  size="mini"
                  onClick={() => setIsEditing(true)}>
                  编辑
                </Button>
              )}
            </View>

            {isEditing ? (
              <View className="space-y-4">
                {/* 状态选择 */}
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">培训状态</Text>
                  <Picker mode="selector" range={statusOptions.map((o) => o.label)} onChange={handleStatusChange}>
                    <View className="w-full px-4 py-3 bg-muted rounded-lg flex flex-row items-center justify-between">
                      <Text className="text-foreground">{statusOptions[statusIndex].label}</Text>
                      <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                    </View>
                  </Picker>
                </View>

                {/* 进度 */}
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">完成进度（%）</Text>
                  <View style={{overflow: 'hidden'}}>
                    <Textarea
                      className="w-full px-4 py-3 bg-muted rounded-lg text-foreground"
                      value={editData.progress.toString()}
                      maxlength={3}
                      style={{height: '50px'}}
                      onInput={(e) => {
                        const value = Number.parseInt(e.detail.value, 10) || 0
                        setEditData({
                          ...editData,
                          progress: Math.min(100, Math.max(0, value))
                        })
                      }}
                    />
                  </View>
                </View>

                {/* 分数 */}
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">考核分数（可选）</Text>
                  <View style={{overflow: 'hidden'}}>
                    <Textarea
                      className="w-full px-4 py-3 bg-muted rounded-lg text-foreground"
                      value={editData.score?.toString() || ''}
                      placeholder="请输入分数"
                      maxlength={3}
                      style={{height: '50px'}}
                      onInput={(e) => {
                        const value = e.detail.value
                        setEditData({
                          ...editData,
                          score: value ? Number.parseInt(value, 10) : null
                        })
                      }}
                    />
                  </View>
                </View>

                {/* 反馈 */}
                <View>
                  <Text className="text-sm font-medium text-foreground mb-2">培训反馈（可选）</Text>
                  <View style={{overflow: 'hidden'}}>
                    <Textarea
                      className="w-full px-4 py-3 bg-muted rounded-lg text-foreground"
                      value={editData.feedback}
                      placeholder="请输入培训反馈"
                      maxlength={500}
                      style={{height: '120px'}}
                      onInput={(e) =>
                        setEditData({
                          ...editData,
                          feedback: e.detail.value
                        })
                      }
                    />
                  </View>
                  <Text className="text-xs text-muted-foreground mt-1">{editData.feedback.length}/500</Text>
                </View>

                {/* 操作按钮 */}
                <View className="flex flex-row gap-2">
                  <Button
                    className="flex-1 bg-blue-100 text-white py-3 rounded-lg break-keep text-base"
                    size="default"
                    disabled={submitting}
                    onClick={handleSave}>
                    {submitting ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    className="flex-1 bg-white text-foreground py-3 rounded-lg break-keep text-base border border-border"
                    size="default"
                    onClick={() => {
                      setIsEditing(false)
                      setEditData({
                        status: record.status,
                        progress: record.progress,
                        score: record.score,
                        feedback: record.feedback || ''
                      })
                    }}>
                    取消
                  </Button>
                </View>
              </View>
            ) : (
              <View className="space-y-3">
                <View>
                  <Text className="text-sm text-muted-foreground">状态</Text>
                  <View className="mt-1">
                    <View className={`inline-block px-3 py-1 rounded ${TRAINING_STATUS_COLORS[record.status]}`}>
                      <Text className="text-sm">{TRAINING_STATUS_NAMES[record.status]}</Text>
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-sm text-muted-foreground">完成进度</Text>
                  <View className="mt-2">
                    <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <View className="h-full bg-blue-100" style={{width: `${record.progress}%`}} />
                    </View>
                    <Text className="text-sm text-foreground mt-1">{record.progress}%</Text>
                  </View>
                </View>

                {record.score !== null && (
                  <View>
                    <Text className="text-sm text-muted-foreground">考核分数</Text>
                    <Text className="text-base text-foreground mt-1">{record.score} 分</Text>
                  </View>
                )}

                {record.feedback && (
                  <View>
                    <Text className="text-sm text-muted-foreground">培训反馈</Text>
                    <Text className="text-base text-foreground mt-1">{record.feedback}</Text>
                  </View>
                )}

                <View>
                  <Text className="text-sm text-muted-foreground">报名时间</Text>
                  <Text className="text-base text-foreground mt-1">
                    {new Date(record.enrolled_at).toLocaleString('zh-CN')}
                  </Text>
                </View>

                {record.started_at && (
                  <View>
                    <Text className="text-sm text-muted-foreground">开始时间</Text>
                    <Text className="text-base text-foreground mt-1">
                      {new Date(record.started_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                )}

                {record.completed_at && (
                  <View>
                    <Text className="text-sm text-muted-foreground">完成时间</Text>
                    <Text className="text-base text-foreground mt-1">
                      {new Date(record.completed_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 返回按钮 */}
          <View className="pb-4">
            <Button
              className="w-full bg-white text-foreground py-4 rounded-xl break-keep text-base border border-border"
              size="default"
              onClick={() => Taro.navigateBack()}>
              返回
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default TrainingRecordDetail
