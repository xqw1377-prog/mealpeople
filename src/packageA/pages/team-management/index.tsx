/**
 * 团队协作页面
 * V3.17 优化版 - 员工视角的团队协作
 * 设计理念：查看同事、团队消息、求助协助、交接班
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'

// 团队成员类型
interface TeamMember {
  id: string
  name: string
  position: string
  department: string
  status: 'online' | 'offline' | 'busy'
  avatar?: string
}

// 快捷功能类型
interface QuickFeature {
  id: string
  name: string
  icon: string
  iconColor: string
  bgColor: string
  path?: string
  action?: () => void
}

// 快捷功能配置
const QUICK_FEATURES: QuickFeature[] = [
  {
    id: '1',
    name: '团队消息',
    icon: 'i-mdi-message-text',
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-blue-100',
    path: '/pages/team-messages/index'
  },
  {
    id: '2',
    name: '求助协助',
    icon: 'i-mdi-hand-heart',
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-blue-100',
    path: '/pages/help-request/index'
  },
  {
    id: '3',
    name: '交接班',
    icon: 'i-mdi-swap-horizontal',
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-blue-100',
    path: '/pages/shift-handover/index'
  },
  {
    id: '4',
    name: '团队日历',
    icon: 'i-mdi-calendar-month',
    iconColor: 'text-muted-foreground',
    bgColor: 'bg-blue-100',
    path: '/pages/team-calendar/index'
  }
]

export default function TeamManagement() {
  const {user} = useAuth({guard: true})
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)

  // 加载团队成员
  const loadTeamMembers = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      // TODO: 从数据库加载团队成员
      // 暂时使用模拟数据
      const mockMembers: TeamMember[] = [
        {
          id: '1',
          name: '张三',
          position: '服务员',
          department: '前厅',
          status: 'online'
        },
        {
          id: '2',
          name: '李四',
          position: '厨师',
          department: '后厨',
          status: 'online'
        },
        {
          id: '3',
          name: '王五',
          position: '收银员',
          department: '前厅',
          status: 'busy'
        },
        {
          id: '4',
          name: '赵六',
          position: '服务员',
          department: '前厅',
          status: 'offline'
        }
      ]
      setTeamMembers(mockMembers)
    } catch (error) {
      console.error('加载团队成员失败:', error)
      setTeamMembers([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useDidShow(() => {
    loadTeamMembers()
  })

  // 处理快捷功能点击
  const handleFeatureClick = (feature: QuickFeature) => {
    if (feature.action) {
      feature.action()
    } else if (feature.path) {
      // 判断页面是否存在
      Taro.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    }
  }

  // 查看成员详情
  const handleMemberClick = (member: TeamMember) => {
    Taro.showModal({
      title: member.name,
      content: `职位：${member.position}\n部门：${member.department}\n状态：${getStatusText(member.status)}`,
      showCancel: false
    })
  }

  // 获取状态文本
  const getStatusText = (status: TeamMember['status']) => {
    switch (status) {
      case 'online':
        return '在线'
      case 'offline':
        return '离线'
      case 'busy':
        return '忙碌'
      default:
        return '未知'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online':
        return 'bg-red-500'
      case 'offline':
        return 'bg-gray-400'
      case 'busy':
        return 'bg-blue-100'
      default:
        return 'bg-gray-400'
    }
  }

  // 按部门分组
  const groupedMembers = teamMembers.reduce(
    (groups, member) => {
      const dept = member.department
      if (!groups[dept]) {
        groups[dept] = []
      }
      groups[dept].push(member)
      return groups
    },
    {} as Record<string, TeamMember[]>
  )

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 团队统计卡片 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">团队概况</Text>
              <View className="i-mdi-account-group text-2xl text-blue-600" />
            </View>
            <View className="grid grid-cols-3 gap-4">
              <View className="text-center">
                <Text className="text-2xl font-bold text-blue-600">{teamMembers.length}</Text>
                <Text className="text-xs text-muted-foreground mt-1">团队人数</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">
                  {teamMembers.filter((m) => m.status === 'online').length}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">在线</Text>
              </View>
              <View className="text-center">
                <Text className="text-2xl font-bold text-muted-foreground">
                  {teamMembers.filter((m) => m.status === 'busy').length}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">忙碌</Text>
              </View>
            </View>
          </View>

          {/* 快捷功能 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">快捷功能</Text>
              <View className="i-mdi-lightning-bolt text-2xl text-blue-600" />
            </View>
            <View className="grid grid-cols-2 gap-3">
              {QUICK_FEATURES.map((feature) => (
                <View
                  key={feature.id}
                  className={`${feature.bgColor} rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70`}
                  onClick={() => handleFeatureClick(feature)}>
                  <View className={`${feature.icon} text-3xl ${feature.iconColor} mb-2`} />
                  <Text className={`text-xs ${feature.iconColor} font-medium text-center`}>{feature.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 团队成员列表 */}
          {loading ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200">
              <Text className="text-center text-muted-foreground">加载中...</Text>
            </View>
          ) : Object.keys(groupedMembers).length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200">
              <View className="flex flex-col items-center justify-center">
                <View className="i-mdi-account-off-outline text-6xl text-muted-foreground mb-4" />
                <Text className="text-base text-muted-foreground">暂无团队成员</Text>
              </View>
            </View>
          ) : (
            <View className="space-y-4">
              {Object.keys(groupedMembers).map((dept) => (
                <View key={dept} className="bg-white rounded-lg p-6 border-2 border-gray-200">
                  {/* 部门标题 */}
                  <View className="flex flex-row items-center mb-4">
                    <View className="i-mdi-office-building text-xl text-blue-600 mr-2" />
                    <Text className="text-base font-semibold text-foreground">{dept}</Text>
                    <Text className="text-sm text-muted-foreground ml-2">({groupedMembers[dept].length}人)</Text>
                  </View>

                  {/* 成员列表 */}
                  <View className="space-y-3">
                    {groupedMembers[dept].map((member) => (
                      <View
                        key={member.id}
                        className="p-4 bg-gray-50/30 rounded-xl active:bg-gray-50/50"
                        onClick={() => handleMemberClick(member)}>
                        <View className="flex flex-row items-center">
                          {/* 头像 */}
                          <View className="relative mr-3">
                            <View className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <View className="i-mdi-account text-2xl text-blue-600" />
                            </View>
                            {/* 状态指示器 */}
                            <View
                              className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(member.status)} rounded-full border-2 border-white`}
                            />
                          </View>

                          {/* 信息 */}
                          <View className="flex-1">
                            <Text className="text-base font-medium text-foreground">{member.name}</Text>
                            <Text className="text-sm text-muted-foreground mt-1">{member.position}</Text>
                          </View>

                          {/* 操作按钮 */}
                          <View className="flex flex-row items-center gap-2">
                            <View
                              className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation()
                                Taro.showToast({title: '发送消息功能开发中', icon: 'none'})
                              }}>
                              <View className="i-mdi-message text-lg text-muted-foreground" />
                            </View>
                            <View
                              className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation()
                                Taro.showToast({title: '求助功能开发中', icon: 'none'})
                              }}>
                              <View className="i-mdi-hand-heart text-lg text-muted-foreground" />
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* 底部占位 */}
          <View className="h-4" />
        </View>
      </ScrollView>
    </View>
  )
}
