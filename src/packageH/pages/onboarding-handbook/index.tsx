/**
 * 入职手册页面（增强版）
 *
 * 功能：
 * - 展示公司介绍、规章制度、企业文化等内容
 * - 支持章节导航和快速跳转
 * - 阅读进度追踪
 * - 响应式设计和优雅动画
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api'

// 手册章节接口
interface HandbookSection {
  id: string
  title: string
  icon: string
  color: string
  content: string
  subsections?: {
    id: string
    title: string
    content: string
  }[]
}

// 手册内容
const HANDBOOK_SECTIONS: HandbookSection[] = [
  {
    id: 'company-intro',
    title: '公司介绍',
    icon: 'i-mdi-office-building',
    color: 'blue',
    content: '欢迎加入我们的大家庭！',
    subsections: [
      {
        id: 'company-history',
        title: '公司发展历程',
        content:
          '我们是一家致力于提供优质服务的企业，秉承"客户至上、员工为本"的经营理念。\n\n公司成立以来，始终坚持创新发展，为客户提供专业、高效的服务。\n\n我们拥有一支专业的团队，致力于为每一位员工提供良好的工作环境和发展机会。'
      },
      {
        id: 'company-vision',
        title: '公司愿景与使命',
        content:
          '愿景：成为行业领先的服务提供商\n\n使命：为客户创造价值，为员工创造机会\n\n目标：持续创新，追求卓越，实现可持续发展'
      }
    ]
  },
  {
    id: 'company-culture',
    title: '企业文化',
    icon: 'i-mdi-heart-multiple',
    color: 'red',
    content: '核心价值观与团队精神',
    subsections: [
      {
        id: 'core-values',
        title: '核心价值观',
        content:
          '诚信：言行一致，信守承诺\n\n专业：精益求精，追求卓越\n\n创新：勇于突破，持续改进\n\n共赢：合作共享，互利互惠'
      },
      {
        id: 'team-spirit',
        title: '团队精神',
        content:
          '相互尊重：尊重每一位同事的意见和贡献\n\n协作共赢：团队合作，共同成长\n\n追求卓越：不断学习，持续进步\n\n客户至上：以客户需求为导向'
      }
    ]
  },
  {
    id: 'work-rules',
    title: '工作制度',
    icon: 'i-mdi-clock-outline',
    color: 'green',
    content: '规范的工作时间和考勤制度',
    subsections: [
      {
        id: 'work-time',
        title: '工作时间',
        content: '工作时间：周一至周五 9:00-18:00\n\n午休时间：12:00-13:00\n\n周末双休，法定节假日按国家规定执行'
      },
      {
        id: 'attendance',
        title: '考勤制度',
        content:
          '打卡要求：按时打卡，不得代打卡\n\n迟到早退：迟到早退需提前申请\n\n旷工处理：无故旷工将按规定处理\n\n考勤统计：每月统计并公示'
      },
      {
        id: 'leave',
        title: '请假制度',
        content:
          '事假：提前一天申请，经主管批准\n\n病假：提供医院证明，及时报备\n\n年假：工作满一年享有带薪年假\n\n婚假/产假：按国家规定执行'
      },
      {
        id: 'overtime',
        title: '加班制度',
        content:
          '加班申请：需提前申请，经批准后执行\n\n加班补偿：可选择调休或加班费\n\n加班统计：每月统计并结算\n\n健康保障：合理安排，避免过度加班'
      }
    ]
  },
  {
    id: 'salary-benefits',
    title: '薪资福利',
    icon: 'i-mdi-cash-multiple',
    color: 'amber',
    content: '完善的薪资体系和福利待遇',
    subsections: [
      {
        id: 'salary',
        title: '薪资发放',
        content:
          '发放时间：每月15日发放上月工资\n\n薪资构成：基本工资+绩效奖金+各项补贴\n\n调薪机制：每年进行薪资调整评估\n\n保密原则：薪资信息严格保密'
      },
      {
        id: 'insurance',
        title: '五险一金',
        content:
          '社会保险：养老、医疗、失业、工伤、生育\n\n住房公积金：按规定比例缴纳\n\n缴纳时间：入职即缴纳\n\n缴纳基数：按实际工资缴纳'
      },
      {
        id: 'welfare',
        title: '员工福利',
        content:
          '年假制度：工作满一年享有带薪年假\n\n节日福利：传统节日发放节日礼品\n\n生日福利：生日当月享有生日礼金\n\n体检福利：每年组织员工体检\n\n培训机会：定期组织专业培训\n\n团建活动：定期组织团队建设活动'
      }
    ]
  },
  {
    id: 'career-development',
    title: '职业发展',
    icon: 'i-mdi-chart-line',
    color: 'purple',
    content: '清晰的职业发展路径',
    subsections: [
      {
        id: 'career-path',
        title: '晋升通道',
        content:
          '专业通道：初级→中级→高级→专家\n\n管理通道：主管→经理→总监→副总\n\n双通道发展：可在专业和管理间转换\n\n晋升标准：能力、业绩、潜力综合评估'
      },
      {
        id: 'training',
        title: '培训体系',
        content:
          '新员工培训：入职培训、岗位培训\n\n在职培训：专业技能、管理能力\n\n外部培训：行业交流、专业认证\n\n学习资源：在线课程、图书资料'
      },
      {
        id: 'performance',
        title: '绩效考核',
        content:
          '考核周期：季度考核+年度考核\n\n考核内容：工作业绩、能力素质、工作态度\n\n考核结果：与薪资调整、晋升挂钩\n\n反馈机制：及时沟通，持续改进'
      }
    ]
  },
  {
    id: 'work-environment',
    title: '工作环境',
    icon: 'i-mdi-domain',
    color: 'cyan',
    content: '舒适的办公环境和设施',
    subsections: [
      {
        id: 'office',
        title: '办公设施',
        content:
          '办公设备：电脑、电话、打印机等\n\n办公用品：笔、纸、文件夹等\n\n茶水间：咖啡、茶、零食\n\n休息区：沙发、书籍、游戏'
      },
      {
        id: 'safety',
        title: '安全保障',
        content:
          '消防安全：定期演练，设施完善\n\n门禁系统：刷卡进出，安全可靠\n\n监控系统：24小时监控\n\n应急预案：完善的应急处理机制'
      }
    ]
  },
  {
    id: 'contact',
    title: '联系方式',
    icon: 'i-mdi-phone',
    color: 'teal',
    content: '重要联系方式',
    subsections: [
      {
        id: 'hr-contact',
        title: 'HR部门',
        content:
          '人力资源部：负责招聘、培训、薪酬福利\n\n联系电话：010-12345678\n\n邮箱：hr@company.com\n\n办公地点：总部3楼'
      },
      {
        id: 'it-contact',
        title: 'IT支持',
        content: 'IT部门：负责技术支持、设备维护\n\n联系电话：010-87654321\n\n邮箱：it@company.com\n\n办公地点：总部2楼'
      },
      {
        id: 'admin-contact',
        title: '行政部门',
        content:
          '行政部：负责办公用品、设施维护\n\n联系电话：010-11112222\n\n邮箱：admin@company.com\n\n办公地点：总部1楼'
      }
    ]
  }
]

export default function OnboardingHandbook() {
  const {user} = useAuth({guard: true})
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string>('company-intro')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['company-intro']))
  const [readSections, setReadSections] = useState<Set<string>>(new Set())
  const [showNav, setShowNav] = useState(false)

  // 加载阅读进度
  const loadReadingProgress = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) return

      // 从数据库加载阅读进度（如果有的话）
      const {data} = await supabase
        .from('handbook_reading_progress')
        .select('section_id')
        .eq('employee_id', employee.id)

      if (data) {
        setReadSections(new Set(data.map((item) => item.section_id)))
      }
    } catch (error) {
      console.error('加载阅读进度失败:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadReadingProgress()
  }, [loadReadingProgress])

  // 切换章节展开状态
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
    setActiveSection(sectionId)
  }

  // 标记为已读
  const markAsRead = async (sectionId: string) => {
    if (!user?.id) return

    try {
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) return

      // 保存到数据库
      await supabase.from('handbook_reading_progress').upsert({
        employee_id: employee.id,
        section_id: sectionId,
        read_at: new Date().toISOString()
      })

      // 更新本地状态
      setReadSections(new Set([...readSections, sectionId]))

      Taro.showToast({
        title: '已标记为已读',
        icon: 'success'
      })
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  // 计算阅读进度
  const progress = useMemo(() => {
    const totalSections = HANDBOOK_SECTIONS.reduce((sum, section) => {
      return sum + 1 + (section.subsections?.length || 0)
    }, 0)
    const readCount = readSections.size
    return Math.round((readCount / totalSections) * 100)
  }, [readSections])

  if (loading) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center">
        <View className="text-center">
          <View className="i-mdi-loading animate-spin text-4xl text-primary mb-2" />
          <Text className="text-sm text-muted-foreground">加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh'}}>
        <View className="p-4 max-sm:p-3">
          {/* 页面标题 */}
          <View className="bg-white rounded-2xl p-6 max-sm:p-4 shadow-lg mb-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <View className="flex flex-row items-center flex-1">
                <View className="w-14 h-14 max-sm:w-12 max-sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-md">
                  <View className="i-mdi-book-open-page-variant text-3xl max-sm:text-2xl text-white" />
                </View>
                <View className="flex-1">
                  <Text className="text-2xl max-sm:text-xl font-bold text-gray-900 mb-1">入职手册</Text>
                  <Text className="text-sm max-sm:text-xs text-gray-600">了解公司文化和规章制度</Text>
                </View>
              </View>
              <View
                className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center active:scale-95 transition-all"
                onClick={() => setShowNav(!showNav)}>
                <View className={`i-mdi-${showNav ? 'close' : 'menu'} text-2xl text-blue-600`} />
              </View>
            </View>

            {/* 阅读进度 */}
            <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 max-sm:p-3">
              <View className="flex flex-row items-center justify-between mb-2">
                <Text className="text-sm max-sm:text-xs font-medium text-gray-700">阅读进度</Text>
                <Text className="text-lg max-sm:text-base font-bold text-blue-600">{progress}%</Text>
              </View>
              <View className="w-full h-3 bg-white rounded-full overflow-hidden shadow-inner">
                <View
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{width: `${progress}%`}}
                />
              </View>
              <Text className="text-xs text-gray-500 mt-2">
                已阅读 {readSections.size} /{' '}
                {HANDBOOK_SECTIONS.reduce((sum, s) => sum + 1 + (s.subsections?.length || 0), 0)} 个章节
              </Text>
            </View>
          </View>

          {/* 快速导航（可折叠） */}
          {showNav && (
            <View className="bg-white rounded-2xl p-4 max-sm:p-3 shadow-lg mb-4">
              <Text className="text-lg max-sm:text-base font-bold text-gray-900 mb-3">快速导航</Text>
              <View className="grid grid-cols-2 gap-2">
                {HANDBOOK_SECTIONS.map((section) => (
                  <View
                    key={section.id}
                    className={`p-3 rounded-xl border-2 transition-all active:scale-95 ${
                      activeSection === section.id ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent'
                    }`}
                    onClick={() => {
                      setActiveSection(section.id)
                      setShowNav(false)
                    }}>
                    <View className="flex flex-row items-center">
                      <View className={`${section.icon} text-xl text-${section.color}-600 mr-2`} />
                      <Text className="text-sm max-sm:text-xs font-medium text-gray-900">{section.title}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 手册内容 */}
          <View className="space-y-4">
            {HANDBOOK_SECTIONS.map((section) => (
              <View key={section.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* 章节标题 */}
                <View
                  className="p-4 max-sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 active:scale-[0.99] transition-all"
                  onClick={() => toggleSection(section.id)}>
                  <View className="flex flex-row items-center justify-between">
                    <View className="flex flex-row items-center flex-1">
                      <View className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                        <View className={`${section.icon} text-2xl text-${section.color}-600`} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg max-sm:text-base font-bold text-gray-900">{section.title}</Text>
                        <Text className="text-xs text-gray-600 mt-0.5">{section.content}</Text>
                      </View>
                    </View>
                    <View className="flex flex-row items-center gap-2">
                      {readSections.has(section.id) && <View className="i-mdi-check-circle text-xl text-green-500" />}
                      <View
                        className={`i-mdi-chevron-${expandedSections.has(section.id) ? 'up' : 'down'} text-2xl text-gray-400`}
                      />
                    </View>
                  </View>
                </View>

                {/* 章节内容 */}
                {expandedSections.has(section.id) && (
                  <View className="p-4 max-sm:p-3">
                    {section.subsections?.map((subsection) => (
                      <View key={subsection.id} className="mb-4 last:mb-0">
                        <View className="flex flex-row items-center justify-between mb-2">
                          <Text className="text-base max-sm:text-sm font-semibold text-gray-800">
                            {subsection.title}
                          </Text>
                          {readSections.has(subsection.id) ? (
                            <View className="flex flex-row items-center gap-1 px-2 py-1 bg-green-50 rounded-lg">
                              <View className="i-mdi-check text-sm text-green-600" />
                              <Text className="text-xs text-green-600">已读</Text>
                            </View>
                          ) : (
                            <View
                              className="px-3 py-1 bg-blue-50 rounded-lg active:scale-95 transition-all"
                              onClick={() => markAsRead(subsection.id)}>
                              <Text className="text-xs text-blue-600 font-medium">标记已读</Text>
                            </View>
                          )}
                        </View>
                        <View className="bg-gray-50 rounded-xl p-3 max-sm:p-2">
                          <Text className="text-sm max-sm:text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                            {subsection.content}
                          </Text>
                        </View>
                      </View>
                    ))}

                    {/* 章节底部操作 */}
                    <View className="flex flex-row items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <View className="flex flex-row items-center gap-2">
                        <View className="i-mdi-book-open text-lg text-blue-600" />
                        <Text className="text-xs text-gray-600">
                          {section.subsections?.filter((s) => readSections.has(s.id)).length || 0} /{' '}
                          {section.subsections?.length || 0} 已读
                        </Text>
                      </View>
                      {!readSections.has(section.id) && (
                        <View
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl active:scale-95 transition-all shadow-md"
                          onClick={() => markAsRead(section.id)}>
                          <Text className="text-sm text-white font-medium">完成本章</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* 底部提示 */}
          <View className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 max-sm:p-4 shadow-lg">
            <View className="flex flex-row items-center mb-3">
              <View className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mr-3">
                <View className="i-mdi-lightbulb-on text-2xl text-white" />
              </View>
              <Text className="text-lg max-sm:text-base font-bold text-white">温馨提示</Text>
            </View>
            <Text className="text-sm max-sm:text-xs text-white leading-relaxed">
              建议您仔细阅读入职手册，了解公司的各项规章制度和企业文化。如有任何疑问，请随时联系HR部门。
            </Text>
            {progress === 100 && (
              <View className="mt-4 p-3 bg-white bg-opacity-20 rounded-xl">
                <View className="flex flex-row items-center">
                  <View className="i-mdi-trophy text-2xl text-yellow-300 mr-2" />
                  <Text className="text-sm text-white font-medium">恭喜！您已完成所有章节的阅读 🎉</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
