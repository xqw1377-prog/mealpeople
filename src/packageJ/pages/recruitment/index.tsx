/**
 * 招聘管理页面 - 员工全旅程管理的起点
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getAllCandidates, getAllPositions, getRecruitmentOverview} from '@/db/api-recruitment'
import type {Candidate, RecruitmentOverview, RecruitmentPosition} from '@/db/types-recruitment'

export default function Recruitment() {
  const {user} = useAuth({guard: true})
  const [overview, setOverview] = useState<RecruitmentOverview | null>(null)
  const [positions, setPositions] = useState<RecruitmentPosition[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [activeTab, setActiveTab] = useState<'positions' | 'candidates'>('positions')
  const [loading, setLoading] = useState(true)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const [overviewData, positionsData, candidatesData] = await Promise.all([
        getRecruitmentOverview(),
        getAllPositions({status: 'published'}),
        getAllCandidates()
      ])

      setOverview(overviewData)
      setPositions(positionsData)
      setCandidates(candidatesData)
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

  // 快捷操作
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add_position':
        Taro.showToast({title: '发布职位功能开发中', icon: 'none'})
        break
      case 'add_candidate':
        Taro.showToast({title: '添加候选人功能开发中', icon: 'none'})
        break
      case 'schedule_interview':
        Taro.showToast({title: '安排面试功能开发中', icon: 'none'})
        break
      case 'stats':
        Taro.showToast({title: '招聘统计功能开发中', icon: 'none'})
        break
      default:
        Taro.showToast({title: '功能开发中', icon: 'none'})
    }
  }

  // 查看职位详情
  const handlePositionDetail = (_positionId: string) => {
    Taro.showToast({title: '职位详情页面开发中', icon: 'none'})
  }

  // 查看候选人详情
  const handleCandidateDetail = (candidateId: string) => {
    Taro.navigateTo({url: `/pages/recruitment-candidate-detail/index?id=${candidateId}`})
  }

  // 获取候选人状态标签
  const getCandidateStatusBadge = (status?: string) => {
    switch (status) {
      case 'new':
        return {text: '新简历', color: 'text-blue-600 bg-blue-100'}
      case 'screening':
        return {text: '筛选中', color: 'text-secondary bg-secondary/10'}
      case 'interview':
        return {text: '面试中', color: 'text-accent bg-accent/10'}
      case 'offer':
        return {text: '已发Offer', color: 'text-accent bg-accent/10'}
      case 'hired':
        return {text: '已入职', color: 'text-accent bg-accent/10'}
      case 'rejected':
        return {text: '已淘汰', color: 'text-muted-foreground bg-gray-50'}
      default:
        return {text: '未知', color: 'text-muted-foreground bg-gray-50'}
    }
  }

  // 获取职位状态标签
  const getPositionStatusBadge = (status?: string) => {
    switch (status) {
      case 'draft':
        return {text: '草稿', color: 'text-muted-foreground bg-gray-50'}
      case 'published':
        return {text: '招聘中', color: 'text-accent bg-accent/10'}
      case 'closed':
        return {text: '已关闭', color: 'text-muted-foreground bg-gray-50'}
      default:
        return {text: '未知', color: 'text-muted-foreground bg-gray-50'}
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground">招聘管理</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">员工全旅程的起点</Text>
          </View>

          {/* 招聘概览 */}
          {overview && (
            <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <View className="flex items-center mb-3">
                <View className="i-mdi-chart-line text-2xl text-blue-600 mr-2" />
                <Text className="text-base font-semibold text-foreground">招聘概览</Text>
              </View>

              <View className="grid grid-cols-4 gap-3 mb-3">
                <View className="text-center">
                  <Text className="text-2xl font-bold text-blue-600 block">{overview.active_positions}</Text>
                  <Text className="text-xs text-muted-foreground mt-1 block">在招职位</Text>
                </View>
                <View className="text-center">
                  <Text className="text-2xl font-bold text-accent block">{overview.total_candidates}</Text>
                  <Text className="text-xs text-muted-foreground mt-1 block">候选人</Text>
                </View>
                <View className="text-center">
                  <Text className="text-2xl font-bold text-secondary block">{overview.interviews_this_week}</Text>
                  <Text className="text-xs text-muted-foreground mt-1 block">本周面试</Text>
                </View>
                <View className="text-center">
                  <Text className="text-2xl font-bold text-accent block">{overview.hired_this_month}</Text>
                  <Text className="text-xs text-muted-foreground mt-1 block">本月入职</Text>
                </View>
              </View>

              <View className="bg-gray-50 rounded-lg p-3">
                <View className="flex items-center justify-between text-sm">
                  <Text className="text-muted-foreground">转化率</Text>
                  <Text className="text-blue-600 font-semibold">{overview.conversion_rate}%</Text>
                </View>
              </View>
            </View>
          )}

          {/* 快速操作 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center mb-3">
              <View className="i-mdi-lightning-bolt text-2xl text-blue-600 mr-2" />
              <Text className="text-base font-semibold text-foreground">快速操作</Text>
            </View>

            <View className="grid grid-cols-2 gap-3">
              {/* 发布职位 */}
              <View
                className="bg-gray-50 rounded-lg p-3 flex items-center"
                onClick={() => handleQuickAction('add_position')}>
                <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <View className="i-mdi-briefcase-plus text-xl text-blue-600" />
                </View>
                <Text className="text-sm text-foreground font-medium">发布职位</Text>
              </View>

              {/* 添加候选人 */}
              <View
                className="bg-gray-50 rounded-lg p-3 flex items-center"
                onClick={() => handleQuickAction('add_candidate')}>
                <View className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mr-3">
                  <View className="i-mdi-account-plus text-xl text-accent" />
                </View>
                <Text className="text-sm text-foreground font-medium">添加候选人</Text>
              </View>

              {/* 安排面试 */}
              <View
                className="bg-gray-50 rounded-lg p-3 flex items-center"
                onClick={() => handleQuickAction('schedule_interview')}>
                <View className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center mr-3">
                  <View className="i-mdi-calendar-clock text-xl text-secondary" />
                </View>
                <Text className="text-sm text-foreground font-medium">安排面试</Text>
              </View>

              {/* 招聘统计 */}
              <View className="bg-gray-50 rounded-lg p-3 flex items-center" onClick={() => handleQuickAction('stats')}>
                <View className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <View className="i-mdi-chart-bar text-xl text-blue-600" />
                </View>
                <Text className="text-sm text-foreground font-medium">招聘统计</Text>
              </View>
            </View>
          </View>

          {/* 标签页切换 */}
          <View className="flex items-center gap-2 mb-4">
            <View
              className={`flex-1 py-3 rounded-lg text-center ${
                activeTab === 'positions' ? 'bg-green-500 text-white' : 'bg-white text-foreground'
              }`}
              onClick={() => setActiveTab('positions')}>
              <Text className="text-sm font-medium">招聘职位 ({positions.length})</Text>
            </View>
            <View
              className={`flex-1 py-3 rounded-lg text-center ${
                activeTab === 'candidates' ? 'bg-green-500 text-white' : 'bg-white text-foreground'
              }`}
              onClick={() => setActiveTab('candidates')}>
              <Text className="text-sm font-medium">候选人 ({candidates.length})</Text>
            </View>
          </View>

          {/* 招聘职位列表 */}
          {activeTab === 'positions' && (
            <View className="mb-4">
              {loading ? (
                <View className="text-center py-8">
                  <Text className="text-sm text-muted-foreground">加载中...</Text>
                </View>
              ) : positions.length === 0 ? (
                <View className="text-center py-8">
                  <Text className="text-sm text-muted-foreground">暂无招聘职位</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {positions.map((position) => {
                    const statusBadge = getPositionStatusBadge(position.status)
                    return (
                      <View
                        key={position.id}
                        className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm"
                        onClick={() => handlePositionDetail(position.id)}>
                        <View className="flex items-start justify-between mb-2">
                          <View className="flex-1">
                            <View className="flex items-center gap-2 mb-1">
                              <Text className="text-base font-semibold text-foreground">{position.title}</Text>
                              <View className={`px-2 py-0.5 rounded text-xs ${statusBadge.color}`}>
                                <Text>{statusBadge.text}</Text>
                              </View>
                            </View>
                            <Text className="text-xs text-muted-foreground">{position.department || '未分配部门'}</Text>
                          </View>
                          <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
                        </View>

                        {position.salary_range && (
                          <View className="flex items-center text-sm text-blue-600 mb-2">
                            <View className="i-mdi-currency-cny text-base mr-1" />
                            <Text>{position.salary_range}</Text>
                          </View>
                        )}

                        {position.description && (
                          <Text className="text-xs text-muted-foreground line-clamp-2">{position.description}</Text>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )}

          {/* 候选人列表 */}
          {activeTab === 'candidates' && (
            <View className="mb-4">
              {loading ? (
                <View className="text-center py-8">
                  <Text className="text-sm text-muted-foreground">加载中...</Text>
                </View>
              ) : candidates.length === 0 ? (
                <View className="text-center py-8">
                  <Text className="text-sm text-muted-foreground">暂无候选人</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {candidates.map((candidate) => {
                    const statusBadge = getCandidateStatusBadge(candidate.status)
                    return (
                      <View
                        key={candidate.id}
                        className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm"
                        onClick={() => handleCandidateDetail(candidate.id)}>
                        <View className="flex items-start justify-between mb-2">
                          <View className="flex items-center flex-1">
                            <View className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <View className="i-mdi-account text-2xl text-blue-600" />
                            </View>
                            <View className="flex-1">
                              <View className="flex items-center gap-2">
                                <Text className="text-base font-semibold text-foreground">{candidate.name}</Text>
                                <View className={`px-2 py-0.5 rounded text-xs ${statusBadge.color}`}>
                                  <Text>{statusBadge.text}</Text>
                                </View>
                              </View>
                              <Text className="text-xs text-muted-foreground mt-1">
                                {candidate.phone || '无手机号'}
                              </Text>
                            </View>
                          </View>
                          <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
                        </View>

                        <View className="flex items-center gap-4 text-xs text-muted-foreground">
                          {candidate.education && (
                            <View className="flex items-center">
                              <View className="i-mdi-school text-base mr-1" />
                              <Text>{candidate.education}</Text>
                            </View>
                          )}
                          {candidate.work_experience && (
                            <View className="flex items-center">
                              <View className="i-mdi-briefcase text-base mr-1" />
                              <Text>{candidate.work_experience}</Text>
                            </View>
                          )}
                        </View>

                        {candidate.current_stage && (
                          <View className="mt-2 text-xs text-muted-foreground">
                            <Text>当前阶段：{candidate.current_stage}</Text>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )}

          {/* 底部占位 */}
          <View className="h-4" />
        </View>
      </ScrollView>
    </View>
  )
}
