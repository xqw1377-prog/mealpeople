/**
 * 我的技能页面
 * 显示员工的技能等级和技能成长
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  EmptyState,
  LabeledProgressBar,
  LoadingCards,
  LoadingStatCard,
  PageHeader,
  SimpleStatCard
} from '@/components/common'
import {getEmployeeByUserId} from '@/db/api'

// 技能信息类型
interface SkillInfo {
  id: string
  skill_name: string
  category: string
  current_level: number
  max_level: number
  progress: number
  icon: string
  color: string
  bgColor: string
  last_updated: string
}

// 技能成长记录类型
interface SkillGrowthRecord {
  id: string
  skill_name: string
  from_level: number
  to_level: number
  growth_date: string
  reason: string
  evaluator_name?: string
}

// 技能统计类型
interface SkillStatistics {
  total: number
  advanced: number
  intermediate: number
  basic: number
  avgLevel: number
}

const MySkill: React.FC = () => {
  const {user} = useAuth({guard: true})
  const [skills, setSkills] = useState<SkillInfo[]>([])
  const [growthRecords, setGrowthRecords] = useState<SkillGrowthRecord[]>([])
  const [statistics, setStatistics] = useState<SkillStatistics | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载技能数据
  const loadSkillData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 模拟技能数据
      const mockSkills: SkillInfo[] = [
        {
          id: '1',
          skill_name: '服务技能',
          category: '核心技能',
          current_level: 5,
          max_level: 5,
          progress: 100,
          icon: 'i-mdi-account-heart',
          color: 'text-muted-foreground',
          bgColor: 'bg-blue-100',
          last_updated: '2024-03-15'
        },
        {
          id: '2',
          skill_name: '沟通能力',
          category: '软技能',
          current_level: 4,
          max_level: 5,
          progress: 80,
          icon: 'i-mdi-message-text',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          last_updated: '2024-03-10'
        },
        {
          id: '3',
          skill_name: '团队协作',
          category: '软技能',
          current_level: 4,
          max_level: 5,
          progress: 85,
          icon: 'i-mdi-account-group',
          color: 'text-muted-foreground',
          bgColor: 'bg-blue-100',
          last_updated: '2024-03-01'
        },
        {
          id: '4',
          skill_name: '问题解决',
          category: '核心技能',
          current_level: 3,
          max_level: 5,
          progress: 65,
          icon: 'i-mdi-lightbulb',
          color: 'text-yellow-600',
          bgColor: 'bg-blue-100',
          last_updated: '2024-02-20'
        },
        {
          id: '5',
          skill_name: '时间管理',
          category: '软技能',
          current_level: 4,
          max_level: 5,
          progress: 75,
          icon: 'i-mdi-clock-time-four',
          color: 'text-muted-foreground',
          bgColor: 'bg-blue-100',
          last_updated: '2024-02-15'
        },
        {
          id: '6',
          skill_name: '专业知识',
          category: '核心技能',
          current_level: 3,
          max_level: 5,
          progress: 60,
          icon: 'i-mdi-book-open-page-variant',
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-50',
          last_updated: '2024-02-10'
        }
      ]

      // 模拟成长记录
      const mockRecords: SkillGrowthRecord[] = [
        {
          id: '1',
          skill_name: '服务技能',
          from_level: 4,
          to_level: 5,
          growth_date: '2024-03-15',
          reason: '连续3个月获得客户好评',
          evaluator_name: '张经理'
        },
        {
          id: '2',
          skill_name: '团队协作',
          from_level: 3,
          to_level: 4,
          growth_date: '2024-03-01',
          reason: '成功协调完成团队项目',
          evaluator_name: '王组长'
        },
        {
          id: '3',
          skill_name: '沟通能力',
          from_level: 3,
          to_level: 4,
          growth_date: '2024-02-20',
          reason: '客户满意度提升显著',
          evaluator_name: '李主管'
        }
      ]

      // 模拟统计数据
      const mockStatistics: SkillStatistics = {
        total: mockSkills.length,
        advanced: mockSkills.filter((s) => s.current_level >= 4).length,
        intermediate: mockSkills.filter((s) => s.current_level === 3).length,
        basic: mockSkills.filter((s) => s.current_level <= 2).length,
        avgLevel: mockSkills.reduce((sum, s) => sum + s.current_level, 0) / mockSkills.length
      }

      setSkills(mockSkills)
      setGrowthRecords(mockRecords)
      setStatistics(mockStatistics)
    } catch (error) {
      console.error('加载技能数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadSkillData()
  })

  // 渲染星级
  const renderStars = (level: number, maxLevel: number) => {
    return (
      <View className="flex items-center">
        {Array.from({length: maxLevel}).map((_, index) => (
          <View key={index} className={`i-mdi-star text-lg ${index < level ? 'text-yellow-500' : 'text-gray-300'}`} />
        ))}
      </View>
    )
  }

  // 获取等级标签
  const getLevelLabel = (level: number) => {
    switch (level) {
      case 5:
        return {label: '精通', color: 'text-muted-foreground', bg: 'bg-green-100'}
      case 4:
        return {label: '熟练', color: 'text-muted-foreground', bg: 'bg-blue-100'}
      case 3:
        return {label: '良好', color: 'text-yellow-600', bg: 'bg-yellow-100'}
      case 2:
        return {label: '一般', color: 'text-muted-foreground', bg: 'bg-orange-100'}
      default:
        return {label: '初级', color: 'text-muted-foreground', bg: 'bg-gray-50'}
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 页面标题 */}
          <PageHeader icon="i-mdi-star" title="我的技能" description="查看您的技能等级和成长记录" />

          {loading ? (
            <>
              {/* 加载状态 */}
              <LoadingStatCard />
              <LoadingCards count={3} />
            </>
          ) : skills.length === 0 ? (
            <>
              {/* 空状态 */}
              <EmptyState
                icon="i-mdi-star"
                title="暂无技能记录"
                description="您还没有技能评估记录"
                action={{
                  label: '刷新',
                  onClick: loadSkillData
                }}
              />
            </>
          ) : (
            <>
              {/* 技能统计概览 */}
              {statistics && (
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-center mb-4">
                    <View className="i-mdi-chart-box text-2xl text-blue-600 mr-2" />
                    <Text className="text-lg font-bold text-foreground">技能概览</Text>
                  </View>
                  <View className="grid grid-cols-4 gap-3">
                    <SimpleStatCard label="总技能" value={statistics.total} color="text-blue-600" />
                    <SimpleStatCard label="精通" value={statistics.advanced} color="text-muted-foreground" />
                    <SimpleStatCard label="良好" value={statistics.intermediate} color="text-yellow-600" />
                    <SimpleStatCard label="平均" value={statistics.avgLevel.toFixed(1)} color="text-muted-foreground" />
                  </View>
                </View>
              )}

              {/* 技能列表 */}
              <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                <View className="flex items-center mb-4">
                  <View className="i-mdi-format-list-bulleted text-2xl text-blue-600 mr-2" />
                  <Text className="text-lg font-bold text-foreground">技能详情</Text>
                </View>
                <View className="space-y-3">
                  {skills.map((skill) => {
                    const levelInfo = getLevelLabel(skill.current_level)
                    return (
                      <View key={skill.id} className={`p-4 ${skill.bgColor} rounded-lg`}>
                        <View className="flex items-center justify-between mb-3">
                          <View className="flex items-center">
                            <View className={`${skill.icon} text-2xl ${skill.color} mr-3`} />
                            <View>
                              <Text className="text-base font-bold text-foreground">{skill.skill_name}</Text>
                              <Text className="text-xs text-muted-foreground mt-1">{skill.category}</Text>
                            </View>
                          </View>
                          <View className="flex items-center">
                            {renderStars(skill.current_level, skill.max_level)}
                            <View className={`${levelInfo.bg} px-2 py-1 rounded-full ml-2`}>
                              <Text className={`text-xs ${levelInfo.color} font-medium`}>{levelInfo.label}</Text>
                            </View>
                          </View>
                        </View>

                        {/* 技能进度条 */}
                        <LabeledProgressBar
                          label={`等级 ${skill.current_level}/${skill.max_level}`}
                          progress={skill.progress}
                          color="bg-blue-100"
                        />

                        {/* 最后更新时间 */}
                        <View className="flex items-center mt-2">
                          <View className="i-mdi-clock-outline text-sm text-muted-foreground mr-1" />
                          <Text className="text-xs text-muted-foreground">最后更新：{skill.last_updated}</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>

              {/* 技能成长记录 */}
              {growthRecords.length > 0 && (
                <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-center mb-4">
                    <View className="i-mdi-trending-up text-2xl text-blue-600 mr-2" />
                    <Text className="text-lg font-bold text-foreground">成长记录</Text>
                  </View>
                  <View className="space-y-3">
                    {growthRecords.map((record, index) => (
                      <View key={record.id} className="relative">
                        {/* 时间线 */}
                        {index < growthRecords.length - 1 && (
                          <View className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-50" />
                        )}

                        <View className="flex">
                          {/* 时间线节点 */}
                          <View className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <View className="i-mdi-arrow-up text-blue-600 text-sm" />
                          </View>

                          {/* 记录内容 */}
                          <View className="flex-1 pb-4">
                            <View className="bg-gray-50/30 rounded-lg p-4">
                              <View className="flex items-center justify-between mb-2">
                                <Text className="text-base font-bold text-foreground">{record.skill_name}</Text>
                                <Text className="text-xs text-muted-foreground">{record.growth_date}</Text>
                              </View>

                              {/* 等级变化 */}
                              <View className="flex items-center mb-2">
                                <View className="bg-blue-100 px-3 py-1 rounded-full">
                                  <Text className="text-sm text-muted-foreground font-medium">
                                    Lv.{record.from_level}
                                  </Text>
                                </View>
                                <View className="i-mdi-arrow-right text-xl text-muted-foreground mx-2" />
                                <View className="bg-green-100 px-3 py-1 rounded-full">
                                  <Text className="text-sm text-muted-foreground font-medium">
                                    Lv.{record.to_level}
                                  </Text>
                                </View>
                              </View>

                              {/* 成长原因 */}
                              <View className="p-3 bg-gray-50/50 rounded-lg">
                                <Text className="text-sm text-foreground">{record.reason}</Text>
                              </View>

                              {/* 评估人 */}
                              {record.evaluator_name && (
                                <View className="flex items-center mt-2">
                                  <View className="i-mdi-account text-sm text-muted-foreground mr-1" />
                                  <Text className="text-xs text-muted-foreground">评估人：{record.evaluator_name}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 技能提升建议 */}
              <View className="bg-blue-100 rounded-lg p-6 shadow-sm border-2 border-blue-200">
                <View className="flex items-center mb-3">
                  <View className="i-mdi-lightbulb text-2xl text-muted-foreground mr-2" />
                  <Text className="text-lg font-bold text-muted-foreground">技能提升建议</Text>
                </View>
                <View className="space-y-2">
                  {skills
                    .filter((s) => s.current_level < s.max_level)
                    .slice(0, 3)
                    .map((skill) => (
                      <View key={skill.id} className="flex items-center">
                        <View className="i-mdi-check-circle text-sm text-muted-foreground mr-2" />
                        <Text className="text-sm text-blue-600">
                          继续提升「{skill.skill_name}」，距离下一等级还需努力
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default MySkill
