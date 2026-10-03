import {ScrollView, Text, View} from '@tarojs/components'
import {navigateTo} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useTenantStore} from '@/store/tenant'

// 配置项分类
interface ConfigCategory {
  title: string
  description: string
  icon: string
  color: string
  items: ConfigItem[]
}

interface ConfigItem {
  title: string
  icon: string
  color: string
  path: string
  description: string
  badge?: string
}

const StartupCenter: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  if (!currentTenant) {
    return null
  }

  // 配置项分类
  const categories: ConfigCategory[] = [
    {
      title: '基础配置',
      description: '系统初始化必备配置',
      icon: 'i-mdi-cog-outline',
      color: 'from-blue-500 to-blue-600',
      items: [
        {
          title: '使用教程',
          icon: 'i-mdi-book-open-variant',
          color: 'from-blue-500 to-blue-600',
          path: '/packageF/pages/tutorial/index',
          description: '查看系统使用教程和帮助文档',
          badge: '推荐'
        },
        {
          title: '岗位管理',
          icon: 'i-mdi-badge-account',
          color: 'from-indigo-500 to-indigo-600',
          path: '/packageA/pages/position-management/index',
          description: '管理租户的岗位信息'
        },
        {
          title: '门店组织架构',
          icon: 'i-mdi-sitemap',
          color: 'from-cyan-500 to-cyan-600',
          path: '/packageF/pages/store-hierarchy/index',
          description: '配置排班原则和组织架构'
        },
        {
          title: '经营区域管理',
          icon: 'i-mdi-map-marker-multiple',
          color: 'from-teal-500 to-teal-600',
          path: '/packageD/pages/business-areas/index',
          description: '配置经营区域和岗位编制'
        }
      ]
    },
    {
      title: '排班配置',
      description: '排班规则和人力配置',
      icon: 'i-mdi-calendar-clock',
      color: 'from-purple-500 to-purple-600',
      items: [
        {
          title: '效能配置',
          icon: 'i-mdi-speedometer',
          color: 'from-green-500 to-green-600',
          path: '/packageD/pages/efficiency-config/index',
          description: '配置营收效能标准'
        },
        {
          title: '核心岗位顶岗配置',
          icon: 'i-mdi-account-switch',
          color: 'from-purple-500 to-purple-600',
          path: '/packageF/pages/core-position-backup/index',
          description: '配置核心岗位的顶岗人员'
        },
        {
          title: '最低营收岗位配置',
          icon: 'i-mdi-cash-multiple',
          color: 'from-amber-500 to-amber-600',
          path: '/packageD/pages/min-revenue-config/index',
          description: '配置最低营收场景的必要岗位'
        },
        {
          title: '排休规则配置',
          icon: 'i-mdi-calendar-remove',
          color: 'from-rose-500 to-rose-600',
          path: '/packageD/pages/rest-day-rules/index',
          description: '配置员工排休规则和限制'
        },
        {
          title: '营业餐段配置',
          icon: 'i-mdi-calendar-clock',
          color: 'from-blue-500 to-blue-600',
          path: '/packageD/pages/meal-periods/index',
          description: '配置午餐、晚餐等营业时段'
        },
        {
          title: '工作班次配置',
          icon: 'i-mdi-clock-time-eight',
          color: 'from-teal-500 to-teal-600',
          path: '/packageB/pages/work-shifts/index',
          description: '配置早班、中班、晚班等班次'
        }
      ]
    },
    {
      title: '数据管理',
      description: '数据导入和系统调试',
      icon: 'i-mdi-database',
      color: 'from-orange-500 to-orange-600',
      items: [
        {
          title: '影响因子配置',
          icon: 'i-mdi-tune',
          color: 'from-violet-500 to-violet-600',
          path: '/packageB/pages/impact-factors/index',
          description: '配置营收影响因子和权重'
        },
        {
          title: '历史营收数据导入',
          icon: 'i-mdi-database-import',
          color: 'from-orange-500 to-orange-600',
          path: '/packageB/pages/revenue-history-import/index',
          description: '批量导入历史营收数据，支持Excel格式'
        }
      ]
    }
  ]

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 pb-8">
          {/* 页面标题 */}
          <View className="mb-6 pt-2">
            <View className="flex items-center gap-3 mb-2">
              <View className="i-mdi-rocket-launch text-3xl text-white" />
              <Text className="text-2xl font-bold text-white block">启动中心</Text>
            </View>
            <Text className="text-sm text-white/80 block ml-11">系统配置与初始化 · 让管理更简单</Text>
          </View>

          {/* 分类卡片 */}
          {categories.map((category, categoryIndex) => (
            <View key={categoryIndex} className="mb-6">
              {/* 分类标题 */}
              <View className="mb-3 px-2">
                <View className="flex items-center gap-2 mb-1">
                  <View className={`${category.icon} text-xl text-white`} />
                  <Text className="text-lg font-bold text-white block">{category.title}</Text>
                </View>
                <Text className="text-xs text-white/70 block ml-7">{category.description}</Text>
              </View>

              {/* 功能项列表 */}
              <View className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <View
                    key={itemIndex}
                    className="bg-white-sm rounded-lg p-4 border-2 border-gray-200 active:scale-98 transition-all"
                    onClick={() => navigateTo({url: item.path})}>
                    <View className="flex items-center gap-4">
                      {/* 图标 */}
                      <View
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                        <View className={`${item.icon} text-2xl text-white`} />
                      </View>

                      {/* 内容 */}
                      <View className="flex-1 min-w-0">
                        <View className="flex items-center gap-2 mb-1">
                          <Text className="text-base font-semibold text-foreground block">{item.title}</Text>
                          {item.badge && (
                            <View
                              className={`px-2 py-0.5 rounded-full ${
                                item.badge === '推荐'
                                  ? 'bg-blue-100'
                                  : item.badge === '调试'
                                    ? 'bg-red-100'
                                    : 'bg-gray-50'
                              }`}>
                              <Text
                                className={`text-xs font-medium ${
                                  item.badge === '推荐'
                                    ? 'text-muted-foreground'
                                    : item.badge === '调试'
                                      ? 'text-red-600'
                                      : 'text-muted-foreground'
                                }`}>
                                {item.badge}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-xs text-muted-foreground block leading-relaxed">{item.description}</Text>
                      </View>

                      {/* 箭头 */}
                      <View className="i-mdi-chevron-right text-xl text-muted-foreground" />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {/* 底部提示 */}
          <View className="mt-4 bg-white backdrop-blur-sm rounded-lg p-4 border-2 border-gray-200 border border-white/20">
            <View className="flex items-start gap-3">
              <View className="i-mdi-lightbulb-on text-xl text-yellow-300 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-white block mb-2">💡 使用提示</Text>
                <Text className="text-xs text-white/90 leading-relaxed block mb-1">
                  • 首次使用建议先查看"使用教程"了解系统功能
                </Text>
                <Text className="text-xs text-white/90 leading-relaxed block mb-1">
                  • 按照"基础配置 → 排班配置 → 数据管理"的顺序进行配置
                </Text>
                <Text className="text-xs text-white/90 leading-relaxed block">• 配置完成后即可开始使用排班功能</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default StartupCenter
