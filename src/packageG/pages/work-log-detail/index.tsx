// 工作日志详情页面
import {Button, Image, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useRouter} from '@tarojs/taro'
import {useCallback, useEffect, useState} from 'react'
import {Skeleton} from '@/components/Skeleton'
import {deleteWorkLog, getWorkLogById} from '@/db/api-work-log'
import type {WorkLog} from '@/db/types-schedule'

const WorkLogDetail: React.FC = () => {
  const router = useRouter()
  const {id} = router.params
  const [log, setLog] = useState<WorkLog | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载日志详情
  const loadLogDetail = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const data = await getWorkLogById(id as string)
      setLog(data)
    } catch (error) {
      console.error('加载日志详情失败:', error)
      Taro.showToast({title: '加载失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadLogDetail()
  }, [loadLogDetail])

  // 删除日志
  const handleDelete = async () => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条日志吗？'
    })

    if (result.confirm && id) {
      const success = await deleteWorkLog(id as string)
      if (success) {
        Taro.showToast({title: '删除成功', icon: 'success'})
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showToast({title: '删除失败', icon: 'error'})
      }
    }
  }

  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-muted-foreground'
    if (score >= 3.5) return 'text-blue-600'
    if (score >= 2.5) return 'text-orange-500'
    return 'text-red-500'
  }

  // 获取评分等级
  const getScoreLevel = (totalScore: number) => {
    if (totalScore >= 13) return {text: '优秀', color: 'text-muted-foreground', bg: 'bg-green-100'}
    if (totalScore >= 10) return {text: '良好', color: 'text-blue-600', bg: 'bg-blue-100'}
    if (totalScore >= 7) return {text: '合格', color: 'text-orange-500', bg: 'bg-orange-100'}
    return {text: '待改进', color: 'text-red-500', bg: 'bg-red-100'}
  }

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 p-4">
        <Skeleton variant="text" className="mb-4" />
        <Skeleton variant="rectangular" height="200px" className="mb-4" />
        <Skeleton variant="rectangular" height="150px" className="mb-4" />
        <Skeleton variant="rectangular" height="100px" />
      </View>
    )
  }

  if (!log) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <View className="text-center">
          <View className="i-mdi-alert-circle text-6xl text-muted-foreground mb-4" />
          <Text className="text-muted-foreground">日志不存在</Text>
        </View>
      </View>
    )
  }

  const scoreLevel = log.total_score ? getScoreLevel(log.total_score) : null

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen">
        <View className="p-4 space-y-4">
          {/* 日期和评分 */}
          <View className="bg-blue-100 rounded-lg p-4 text-white border border-border">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <View className="i-mdi-calendar text-xl" />
                <Text className="text-lg font-semibold">{log.log_date}</Text>
              </View>
              {scoreLevel && (
                <View className={`px-3 py-1 rounded-full ${scoreLevel.bg}`}>
                  <Text className={`text-sm font-medium ${scoreLevel.color}`}>{scoreLevel.text}</Text>
                </View>
              )}
            </View>

            {log.total_score && (
              <View className="flex items-center justify-center py-4">
                <View className="text-center">
                  <Text className="text-4xl font-bold">{log.total_score}</Text>
                  <Text className="text-sm opacity-90 mt-1">总分 / 15</Text>
                </View>
              </View>
            )}
          </View>

          {/* 评分详情 */}
          {(log.quality_score || log.efficiency_score || log.attitude_score) && (
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border">
              <Text className="text-sm font-semibold text-foreground mb-3">评分详情</Text>
              <View className="space-y-3">
                {log.quality_score && (
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-star text-yellow-500" />
                      <Text className="text-sm text-foreground">工作质量</Text>
                    </View>
                    <Text className={`text-sm font-semibold ${getScoreColor(log.quality_score)}`}>
                      {log.quality_score}/5
                    </Text>
                  </View>
                )}
                {log.efficiency_score && (
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-speedometer text-blue-500" />
                      <Text className="text-sm text-foreground">工作效率</Text>
                    </View>
                    <Text className={`text-sm font-semibold ${getScoreColor(log.efficiency_score)}`}>
                      {log.efficiency_score}/5
                    </Text>
                  </View>
                )}
                {log.attitude_score && (
                  <View className="flex items-center justify-between">
                    <View className="flex items-center gap-2">
                      <View className="i-mdi-emoticon-happy text-green-500" />
                      <Text className="text-sm text-foreground">工作态度</Text>
                    </View>
                    <Text className={`text-sm font-semibold ${getScoreColor(log.attitude_score)}`}>
                      {log.attitude_score}/5
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 工作内容 */}
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border">
            <View className="flex items-center gap-2 mb-3">
              <View className="i-mdi-text-box text-blue-600" />
              <Text className="text-sm font-semibold text-foreground">工作内容</Text>
            </View>
            <Text className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{log.work_content}</Text>
          </View>

          {/* 工作成果 */}
          {log.achievements && (
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-trophy text-yellow-500" />
                <Text className="text-sm font-semibold text-foreground">工作成果</Text>
              </View>
              <Text className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{log.achievements}</Text>
            </View>
          )}

          {/* 遇到的问题 */}
          {log.issues && (
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-alert-circle text-orange-500" />
                <Text className="text-sm font-semibold text-foreground">遇到的问题</Text>
              </View>
              <Text className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{log.issues}</Text>
            </View>
          )}

          {/* 改进建议 */}
          {log.suggestions && (
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-lightbulb text-blue-500" />
                <Text className="text-sm font-semibold text-foreground">改进建议</Text>
              </View>
              <Text className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{log.suggestions}</Text>
            </View>
          )}

          {/* 图片 */}
          {log.images && log.images.length > 0 && (
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm border border-border">
              <View className="flex items-center gap-2 mb-3">
                <View className="i-mdi-image text-purple-500" />
                <Text className="text-sm font-semibold text-foreground">工作照片 ({log.images.length})</Text>
              </View>
              <View className="grid grid-cols-3 gap-2">
                {log.images.map((img, index) => (
                  <Image
                    key={index}
                    src={img}
                    mode="aspectFill"
                    className="w-full h-24 rounded"
                    onClick={() => {
                      Taro.previewImage({
                        urls: log.images || [],
                        current: img
                      })
                    }}
                  />
                ))}
              </View>
            </View>
          )}

          {/* 操作按钮 */}
          <View className="flex gap-3 pb-4">
            <Button
              className="flex-1 bg-blue-100 text-white py-4 rounded-lg break-keep text-base"
              size="default"
              onClick={handleDelete}>
              删除日志
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default WorkLogDetail
