/**
 * 我的晋升页面 - 员工晋升管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {calculateLevelGap, formatTenure, getEmployeePromotionData} from '@/db/api-promotion'
import type {PromotionData} from '@/db/types-promotion'
import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_NAMES,
  PROMOTION_TYPE_NAMES,
  REQUIREMENT_TYPE_NAMES
} from '@/db/types-promotion'

export default function MyPromotion() {
  const {user} = useAuth({guard: true})
  const [promotionData, setPromotionData] = useState<PromotionData | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载晋升数据
  const loadPromotionData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 获取晋升数据
      const data = await getEmployeePromotionData(
        employee.id,
        employee.tenant_id,
        employee.position || '员工',
        1 // 默认职级
      )
      setPromotionData(data)
    } catch (error) {
      console.error('加载晋升数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadPromotionData()
  })

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!promotionData) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">暂无晋升数据</Text>
      </View>
    )
  }

  const {available_paths, my_applications, promotion_history, statistics} = promotionData

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的晋升</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">职业发展管理</Text>
          </View>

          {/* 晋升统计卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 mb-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-blue-600/80 text-sm">晋升次数</Text>
                <Text className="text-foreground text-3xl font-bold mt-1">{statistics.total_promotions}</Text>
              </View>
              <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <View className="i-mdi-trending-up text-4xl text-blue-600" />
              </View>
            </View>

            <View className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
              <View>
                <Text className="text-blue-600/80 text-xs">总申请</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.total_applications}</Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">待审核</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.pending_applications}</Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">已批准</Text>
                <Text className="text-foreground text-lg font-bold mt-1">{statistics.approved_applications}</Text>
              </View>
            </View>
          </View>

          {/* 可用晋升路径 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">晋升路径</Text>
              <View className="i-mdi-map-marker-path text-2xl text-blue-600" />
            </View>

            {available_paths.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-map-marker-path text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无可用晋升路径</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {available_paths.map((path) => (
                  <View key={path.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">
                          {path.from_position} → {path.to_position}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-1">
                          L{path.from_level} → L{path.to_level} (晋升{calculateLevelGap(path.from_level, path.to_level)}
                          级)
                        </Text>
                      </View>
                      <View className="px-3 py-1 bg-blue-100 rounded">
                        <Text className="text-xs text-muted-foreground">{formatTenure(path.min_tenure_months)}</Text>
                      </View>
                    </View>

                    {path.description && <Text className="text-xs text-muted-foreground mb-3">{path.description}</Text>}

                    {/* 晋升条件 */}
                    {path.requirements && path.requirements.length > 0 && (
                      <View className="space-y-2">
                        <Text className="text-xs font-medium text-foreground">晋升条件：</Text>
                        {path.requirements.map((req) => (
                          <View key={req.id} className="flex flex-row items-start">
                            <View className="i-mdi-check-circle text-sm text-muted-foreground mt-0.5 mr-2" />
                            <View className="flex-1">
                              <Text className="text-xs text-foreground">
                                {REQUIREMENT_TYPE_NAMES[req.requirement_type]}: {req.requirement_name}
                              </Text>
                              <Text className="text-xs text-muted-foreground">
                                {req.requirement_value}
                                {req.is_mandatory && ' (必须)'}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}

                    <View
                      className="mt-3 bg-green-500 rounded-lg py-2 px-4 flex items-center justify-center active:opacity-70"
                      onClick={() => {
                        Taro.showToast({
                          title: '申请晋升功能开发中',
                          icon: 'none'
                        })
                      }}>
                      <Text className="text-sm text-white font-medium">申请晋升</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 我的申请 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">我的申请</Text>
              <View className="i-mdi-file-document text-2xl text-blue-600" />
            </View>

            {my_applications.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-file-document-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无申请记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {my_applications.map((application) => (
                  <View key={application.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-medium text-foreground">
                          {application.current_position} → {application.target_position}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-1">
                          L{application.current_level} → L{application.target_level}
                        </Text>
                      </View>
                      <View
                        className={`px-2 py-1 rounded ${application.status === 'approved' ? 'bg-green-100' : application.status === 'rejected' ? 'bg-red-100' : 'bg-orange-100'}`}>
                        <Text className={`text-xs ${APPLICATION_STATUS_COLORS[application.status]}`}>
                          {APPLICATION_STATUS_NAMES[application.status]}
                        </Text>
                      </View>
                    </View>

                    {application.reason && (
                      <View className="mb-3">
                        <Text className="text-xs text-muted-foreground">申请理由：</Text>
                        <Text className="text-xs text-foreground mt-1">{application.reason}</Text>
                      </View>
                    )}

                    <View className="flex flex-row items-center justify-between text-xs text-muted-foreground">
                      <Text className="text-xs text-muted-foreground">
                        申请时间: {new Date(application.application_date).toLocaleDateString()}
                      </Text>
                      {application.status === 'pending' && (
                        <View
                          className="text-xs text-red-600 active:opacity-70"
                          onClick={() => {
                            Taro.showToast({
                              title: '取消申请功能开发中',
                              icon: 'none'
                            })
                          }}>
                          <Text className="text-xs text-red-600">取消申请</Text>
                        </View>
                      )}
                    </View>

                    {application.approved_at && (
                      <View className="mt-2 pt-2 border-t border-border">
                        <Text className="text-xs text-muted-foreground">
                          批准时间: {new Date(application.approved_at).toLocaleDateString()}
                        </Text>
                        {application.effective_date && (
                          <Text className="text-xs text-muted-foreground mt-1">
                            生效日期: {new Date(application.effective_date).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 晋升历史 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">晋升历史</Text>
              <View className="i-mdi-history text-2xl text-blue-600" />
            </View>

            {promotion_history.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-history text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无晋升历史</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {promotion_history.map((history, index) => (
                  <View key={history.id} className="relative">
                    {/* 时间线 */}
                    {index < promotion_history.length - 1 && (
                      <View className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-200" />
                    )}

                    <View className="flex flex-row items-start">
                      <View className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <View className="i-mdi-check text-lg text-muted-foreground" />
                      </View>

                      <View className="flex-1 pb-4">
                        <View className="flex flex-row items-center justify-between mb-2">
                          <Text className="text-base font-medium text-foreground">
                            {history.from_position} → {history.to_position}
                          </Text>
                          <View className="px-2 py-1 bg-purple-100 rounded">
                            <Text className="text-xs text-muted-foreground">
                              {PROMOTION_TYPE_NAMES[history.promotion_type]}
                            </Text>
                          </View>
                        </View>

                        <Text className="text-xs text-muted-foreground mb-2">
                          L{history.from_level} → L{history.to_level} (晋升
                          {calculateLevelGap(history.from_level, history.to_level)}级)
                        </Text>

                        {history.salary_increase && Number(history.salary_increase) > 0 && (
                          <Text className="text-xs text-muted-foreground mb-2">
                            薪资增长: +¥{Number(history.salary_increase).toFixed(2)}
                          </Text>
                        )}

                        <Text className="text-xs text-muted-foreground">
                          晋升日期: {new Date(history.promotion_date).toLocaleDateString()}
                        </Text>

                        {history.notes && (
                          <Text className="text-xs text-muted-foreground mt-2">备注: {history.notes}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 快捷操作 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">晋升管理</Text>
              <View className="i-mdi-cog text-2xl text-blue-600" />
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '晋升路径功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-map-marker-path text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">晋升路径</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '申请记录功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-file-document text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">申请记录</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '晋升条件功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-check-circle text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">晋升条件</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '晋升报告功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-file-chart text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">晋升报告</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
