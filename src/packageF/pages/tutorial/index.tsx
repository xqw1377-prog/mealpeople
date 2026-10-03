/**
 * 使用教程页面
 * 帮助用户快速上手系统
 */

import {Input, ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useState} from 'react'

// 教程分类
type TutorialCategory = 'getting-started' | 'features' | 'advanced' | 'faq'

// 教程项目
interface TutorialItem {
  id: string
  title: string
  category: TutorialCategory
  icon: string
  content: string[]
  tips?: string[]
}

export default function Tutorial() {
  const [activeCategory, setActiveCategory] = useState<TutorialCategory>('getting-started')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // 分类配置
  const categories = [
    {key: 'getting-started', label: '新手入门', icon: 'i-mdi-rocket-launch'},
    {key: 'features', label: '功能教程', icon: 'i-mdi-book-open-page-variant'},
    {key: 'advanced', label: '高级功能', icon: 'i-mdi-star'},
    {key: 'faq', label: '常见问题', icon: 'i-mdi-help-circle'}
  ]

  // 教程内容
  const tutorials: TutorialItem[] = [
    // 新手入门
    {
      id: 'intro',
      title: '系统介绍',
      category: 'getting-started',
      icon: 'i-mdi-information',
      content: [
        '餐饮员工工作旅途操作系统是一款专为餐饮行业设计的智能管理工具',
        '帮助企业实现科学排班、成本控制和数据分析',
        '支持多租户管理，数据完全隔离，安全可靠',
        '提供WEB端和小程序端双平台支持'
      ],
      tips: ['建议先完成新手入门教程', '遇到问题可查看常见问题']
    },
    {
      id: 'quick-start',
      title: '快速开始',
      category: 'getting-started',
      icon: 'i-mdi-play-circle',
      content: [
        '1. 使用微信ID或手机号登录系统',
        '2. 首次登录会自动成为管理员',
        '3. 建议绑定微信，方便后续一键登录',
        '4. 在管理中心添加店铺和员工',
        '5. 开始创建排班计划',
        '6. 查看今日运营数据'
      ],
      tips: ['首次使用建议先添加测试数据', '可以使用Demo租户体验功能', '绑定微信后登录更便捷']
    },
    {
      id: 'wechat-bind',
      title: '微信绑定教程',
      category: 'getting-started',
      icon: 'i-mdi-wechat',
      content: [
        '1. 进入"我的"页面',
        '2. 点击"绑定微信"菜单',
        '3. 点击"立即绑定微信"按钮',
        '4. 系统会自动获取微信授权',
        '5. 绑定成功后，下次可以使用微信一键登录',
        '注意：此功能仅在微信小程序中可用'
      ],
      tips: [
        '绑定微信后登录更便捷，无需输入手机号和验证码',
        '一个微信账号只能绑定一个系统账号',
        '绑定后可随时解绑，但解绑后需重新绑定才能使用微信登录'
      ]
    },
    {
      id: 'wechat-login',
      title: '微信登录教程',
      category: 'getting-started',
      icon: 'i-mdi-login',
      content: [
        '首次登录（未绑定微信）：',
        '1. 打开小程序，进入登录页面',
        '2. 选择"手机号登录"',
        '3. 输入手机号，获取验证码',
        '4. 输入验证码，完成登录',
        '5. 登录后建议立即绑定微信',
        '',
        '已绑定微信的登录：',
        '1. 打开小程序，进入登录页面',
        '2. 点击"微信一键登录"按钮',
        '3. 授权后自动登录，无需输入任何信息'
      ],
      tips: ['微信登录更快捷安全', '首次登录建议使用手机号，然后绑定微信']
    },
    {
      id: 'basic-concepts',
      title: '基本概念',
      category: 'getting-started',
      icon: 'i-mdi-lightbulb',
      content: [
        '租户：独立的企业或组织，数据完全隔离',
        '店铺：租户下的门店，可以有多个',
        '员工：店铺的工作人员，可以分配不同角色',
        '排班：员工的工作安排和班次',
        '效能标准：衡量员工工作效率的指标'
      ]
    },

    // 功能教程
    {
      id: 'dashboard',
      title: '今日运营使用指南',
      category: 'features',
      icon: 'i-mdi-view-dashboard',
      content: [
        '今日运营页面展示当日和当月的关键指标',
        '包括排班完成情况、质量情况、人员参与等',
        '可以查看异常情况和效率指标',
        '支持数据对比和趋势分析',
        '点击卡片可查看详细数据'
      ],
      tips: ['每天早上查看今日运营，了解整体情况', '关注异常提醒，及时处理问题']
    },
    {
      id: 'schedule',
      title: '排班管理教程',
      category: 'features',
      icon: 'i-mdi-calendar-clock',
      content: [
        '1. 进入排班管理页面',
        '2. 选择店铺和日期',
        '3. 点击"新建排班"按钮',
        '4. 选择员工和班次类型',
        '5. 设置排班时间和要求',
        '6. 保存排班计划',
        '7. 员工可以在排班日志中查看和执行'
      ],
      tips: ['建议提前一周规划排班', '可以使用智能优化功能', '注意员工的休息时间']
    },
    {
      id: 'employee',
      title: '员工管理教程',
      category: 'features',
      icon: 'i-mdi-account-group',
      content: [
        '1. 进入管理中心页面',
        '2. 点击"添加员工"按钮',
        '3. 填写员工基本信息',
        '4. 设置员工岗位和角色',
        '5. 配置员工权限（可选）',
        '6. 保存员工信息',
        '也可以使用Excel批量导入员工'
      ],
      tips: ['正式员工和兼职员工分开管理', '定期更新员工信息', '合理分配员工权限']
    },
    {
      id: 'cost',
      title: '成本管控教程',
      category: 'features',
      icon: 'i-mdi-cash-multiple',
      content: [
        '成本管控模块帮助您管理和分析成本数据',
        '1. 录入每日营收和成本数据',
        '2. 系统自动计算成本占比',
        '3. 查看成本趋势图表',
        '4. 分析成本异常情况',
        '5. 导出成本报表'
      ],
      tips: ['每日及时录入数据', '关注成本占比变化', '定期分析成本结构']
    },
    {
      id: 'analytics',
      title: '数据分析教程',
      category: 'features',
      icon: 'i-mdi-chart-line',
      content: [
        '数据分析模块提供多维度的数据分析',
        '概览：查看核心指标概览',
        '营收：分析营收数据和趋势',
        '成本：分析成本数据和占比',
        '效率：查看员工效率排行',
        '排班：分析排班完成情况',
        '趋势：查看未来趋势预测',
        '异常：发现和处理异常情况'
      ],
      tips: ['定期查看数据分析', '关注趋势变化', '及时处理异常']
    },
    {
      id: 'revenue',
      title: '营收预测教程',
      category: 'features',
      icon: 'i-mdi-currency-cny',
      content: [
        '营收预测模块帮助您预测未来营收',
        '1. 选择预测周期',
        '2. 系统基于历史数据生成预测',
        '3. 查看预测结果和置信度',
        '4. 调整预测参数',
        '5. 导出预测报告'
      ],
      tips: ['历史数据越多，预测越准确', '定期更新预测', '结合实际情况调整']
    },

    // 高级功能
    {
      id: 'smart-schedule',
      title: '智能排班优化',
      category: 'advanced',
      icon: 'i-mdi-brain',
      content: [
        '智能排班优化使用AI算法优化排班计划',
        '1. 创建初始排班计划',
        '2. 点击"智能优化"按钮',
        '3. 系统分析员工能力和历史数据',
        '4. 生成优化建议',
        '5. 查看优化结果',
        '6. 应用优化方案'
      ],
      tips: ['优化前确保数据完整', '可以多次优化', '结合实际情况调整']
    },
    {
      id: 'data-export',
      title: '数据导出',
      category: 'advanced',
      icon: 'i-mdi-file-export',
      content: [
        '系统支持多种数据导出功能',
        '1. 在数据分析页面点击导出按钮',
        '2. 选择导出格式（Excel/PDF）',
        '3. 选择导出内容',
        '4. 点击确认导出',
        '5. 下载导出文件'
      ],
      tips: ['定期导出数据备份', '导出前检查数据完整性']
    },
    {
      id: 'permission',
      title: '权限管理',
      category: 'advanced',
      icon: 'i-mdi-shield-account',
      content: [
        '权限管理帮助您控制员工的系统访问权限',
        '1. 进入员工管理页面',
        '2. 选择要配置权限的员工',
        '3. 点击"权限配置"按钮',
        '4. 勾选允许访问的模块',
        '5. 设置每个模块的操作权限',
        '6. 保存权限配置'
      ],
      tips: ['遵循最小权限原则', '定期审查权限配置', '重要操作需要管理员权限']
    },
    {
      id: 'system-config',
      title: '系统配置',
      category: 'advanced',
      icon: 'i-mdi-cog',
      content: [
        '系统配置允许您自定义系统参数',
        '1. 进入系统设置页面',
        '2. 配置效能标准',
        '3. 设置排班规则',
        '4. 配置通知提醒',
        '5. 保存配置'
      ],
      tips: ['配置前了解各参数含义', '重要配置建议备份', '配置后测试验证']
    },

    // 常见问题
    {
      id: 'faq-login',
      title: '登录相关问题',
      category: 'faq',
      icon: 'i-mdi-login',
      content: [
        'Q: 忘记密码怎么办？',
        'A: 使用微信ID登录无需密码，手机号登录可通过验证码登录',
        '',
        'Q: 微信登录失败怎么办？',
        'A: 检查网络连接，确保在微信环境中打开小程序',
        '',
        'Q: 如何切换账号？',
        'A: 点击"我的"页面，选择"退出登录"，然后重新登录'
      ]
    },
    {
      id: 'faq-schedule',
      title: '排班相关问题',
      category: 'faq',
      icon: 'i-mdi-calendar-question',
      content: [
        'Q: 如何修改已创建的排班？',
        'A: 在排班管理页面找到对应排班，点击编辑按钮进行修改',
        '',
        'Q: 如何删除排班？',
        'A: 只有管理员可以删除排班，在排班详情页点击删除按钮',
        '',
        'Q: 员工看不到排班怎么办？',
        'A: 检查员工是否有排班日志查看权限，确认排班已保存'
      ]
    },
    {
      id: 'faq-data',
      title: '数据相关问题',
      category: 'faq',
      icon: 'i-mdi-database-question',
      content: [
        'Q: 数据不准确怎么办？',
        'A: 检查数据录入是否完整，确认时间范围选择正确',
        '',
        'Q: 如何导出数据？',
        'A: 在数据分析页面点击导出按钮，选择导出格式',
        '',
        'Q: 数据可以恢复吗？',
        'A: 系统自动备份数据，如需恢复请联系管理员'
      ]
    },
    {
      id: 'faq-permission',
      title: '权限相关问题',
      category: 'faq',
      icon: 'i-mdi-shield-question',
      content: [
        'Q: 员工无法访问某个功能怎么办？',
        'A: 检查员工的权限配置，确保已授予相应模块的访问权限',
        '',
        'Q: 如何成为管理员？',
        'A: 首次登录的用户自动成为管理员，其他用户需要管理员授权',
        '',
        'Q: 权限配置后不生效怎么办？',
        'A: 退出登录后重新登录，权限配置即可生效'
      ]
    }
  ]

  // 过滤教程
  const filteredTutorials = tutorials.filter((tutorial) => {
    const matchCategory = tutorial.category === activeCategory
    const matchKeyword =
      !searchKeyword ||
      tutorial.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      tutorial.content.some((c) => c.toLowerCase().includes(searchKeyword.toLowerCase()))
    return matchCategory && matchKeyword
  })

  // 切换展开/收起
  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  // 渲染教程项目
  const renderTutorialItem = (tutorial: TutorialItem) => {
    const isExpanded = expandedItems.has(tutorial.id)

    return (
      <View key={tutorial.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-3 shadow-sm">
        {/* 标题 */}
        <View className="flex items-center justify-between" onClick={() => toggleExpand(tutorial.id)}>
          <View className="flex items-center gap-3 flex-1">
            <View className={`${tutorial.icon} text-2xl text-blue-600`} />
            <Text className="text-base font-semibold text-foreground">{tutorial.title}</Text>
          </View>
          <View
            className={`i-mdi-chevron-down text-xl text-muted-foreground transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </View>

        {/* 内容 */}
        {isExpanded && (
          <View className="mt-4 space-y-3">
            {/* 教程内容 */}
            <View className="space-y-2">
              {tutorial.content.map((line, index) => (
                <View key={index}>
                  {line ? (
                    <Text className="text-sm text-foreground leading-relaxed">{line}</Text>
                  ) : (
                    <View className="h-2" />
                  )}
                </View>
              ))}
            </View>

            {/* 提示 */}
            {tutorial.tips && tutorial.tips.length > 0 && (
              <View className="bg-blue-100 border border-border/20 rounded-lg p-3 mt-3">
                <View className="flex items-center gap-2 mb-2">
                  <View className="i-mdi-lightbulb text-blue-500" />
                  <Text className="text-sm font-semibold text-blue-500">小提示</Text>
                </View>
                <View className="space-y-1">
                  {tutorial.tips.map((tip, index) => (
                    <View key={index} className="flex items-start gap-2">
                      <View className="i-mdi-circle-small text-blue-500 mt-0.5" />
                      <Text className="text-sm text-foreground flex-1">{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    )
  }

  return (
    <View
      className="bg-gray-50"
      style={{
        minHeight: '100vh'
      }}>
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="pb-4">
          {/* 搜索框 */}
          <View className="bg-white p-4 mb-4 shadow-sm">
            <View className="flex items-center gap-2 bg-input border border-border rounded-lg px-3 py-2">
              <View className="i-mdi-magnify text-xl text-muted-foreground" />
              <View style={{overflow: 'hidden'}} className="flex-1">
                <Input
                  className="text-foreground text-sm"
                  placeholder="搜索教程内容..."
                  value={searchKeyword}
                  onInput={(e) => setSearchKeyword(e.detail.value)}
                />
              </View>
              {searchKeyword && (
                <View
                  className="i-mdi-close-circle text-xl text-muted-foreground"
                  onClick={() => setSearchKeyword('')}
                />
              )}
            </View>
          </View>

          {/* 分类Tab */}
          <View className="bg-white px-2 py-3 mb-4 shadow-sm">
            <ScrollView scrollX className="box-border">
              <View className="flex flex-row gap-2">
                {categories.map((category) => (
                  <View
                    key={category.key}
                    className={`px-4 py-2 rounded-full flex flex-row items-center gap-2 ${
                      activeCategory === category.key ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    onClick={() => setActiveCategory(category.key as TutorialCategory)}>
                    <View className={`${category.icon} text-base`} />
                    <Text
                      className={`text-sm font-medium whitespace-nowrap ${
                        activeCategory === category.key ? 'text-white' : 'text-muted-foreground'
                      }`}>
                      {category.label}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 教程列表 */}
          <View className="px-4">
            {filteredTutorials.length > 0 ? (
              <View>{filteredTutorials.map((tutorial) => renderTutorialItem(tutorial))}</View>
            ) : (
              <View className="bg-white rounded-xl p-8 border-2 border-gray-200 flex flex-col items-center justify-center">
                <View className="i-mdi-file-search text-6xl text-muted-foreground/30 mb-4" />
                <Text className="text-muted-foreground">未找到相关教程</Text>
                <Text className="text-sm text-muted-foreground mt-2">试试其他关键词</Text>
              </View>
            )}
          </View>

          {/* 联系支持 */}
          <View className="px-4 mt-6">
            <View className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
              <View className="flex items-center gap-2 mb-2">
                <View className="i-mdi-help-circle text-xl text-blue-600" />
                <Text className="text-base font-semibold text-foreground">需要帮助？</Text>
              </View>
              <Text className="text-sm text-muted-foreground mb-3">
                如果您在使用过程中遇到问题，可以联系我们的技术支持团队。
              </Text>
              <View
                className="bg-blue-100 text-white rounded-lg px-4 py-2 flex items-center justify-center"
                onClick={() => {
                  Taro.showToast({
                    title: '功能开发中',
                    icon: 'none'
                  })
                }}>
                <Text className="text-sm font-medium text-white">联系支持</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
