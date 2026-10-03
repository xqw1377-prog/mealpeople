/**
 * 我的薪酬页面 - 员工薪酬福利管理
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeeByUserId} from '@/db/api'
import {calculateTotalSalary, formatCurrency, getEmployeeSalaryBenefitData} from '@/db/api-salary'
import type {SalaryBenefitData} from '@/db/types-salary'
import {
  BENEFIT_CATEGORY_NAMES,
  BENEFIT_STATUS_COLORS,
  BENEFIT_STATUS_NAMES,
  SALARY_STATUS_COLORS,
  SALARY_STATUS_NAMES
} from '@/db/types-salary'

export default function MySalary() {
  const {user} = useAuth({guard: true})
  const [salaryData, setSalaryData] = useState<SalaryBenefitData | null>(null)
  const [loading, setLoading] = useState(true)

  // 加载薪酬福利数据
  const loadSalaryData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // 获取员工信息
      const employee = await getEmployeeByUserId(user.id)
      if (!employee) {
        throw new Error('未找到员工信息')
      }

      // 获取薪酬福利数据
      const data = await getEmployeeSalaryBenefitData(employee.id)
      setSalaryData(data)
    } catch (error) {
      console.error('加载薪酬福利数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadSalaryData()
  })

  // 格式化年月
  const formatYearMonth = (year: number, month: number) => {
    return `${year}年${month}月`
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">加载中...</Text>
      </View>
    )
  }

  if (!salaryData) {
    return (
      <View className="flex items-center justify-center h-screen">
        <Text className="text-muted-foreground">暂无薪酬数据</Text>
      </View>
    )
  }

  const {current_structure, recent_records, benefits, salary_statistics, benefit_statistics} = salaryData

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">我的薪酬</Text>
            <Text className="text-sm text-muted-foreground mt-1 block">薪酬福利管理</Text>
          </View>

          {/* 当月薪酬卡片 */}
          <View className="bg-blue-100 rounded-lg p-6 mb-4">
            <View className="flex flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-blue-600/80 text-sm">本月薪酬</Text>
                <Text className="text-foreground text-3xl font-bold mt-1">
                  {formatCurrency(salary_statistics.current_month_salary)}
                </Text>
              </View>
              <View className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <View className="i-mdi-cash text-4xl text-blue-600" />
              </View>
            </View>

            <View className="flex flex-row items-center justify-between pt-4 border-t border-white/20">
              <View>
                <Text className="text-blue-600/80 text-xs">上月薪酬</Text>
                <Text className="text-foreground text-lg font-bold mt-1">
                  {formatCurrency(salary_statistics.last_month_salary)}
                </Text>
              </View>
              <View>
                <Text className="text-blue-600/80 text-xs">年度累计</Text>
                <Text className="text-foreground text-lg font-bold mt-1">
                  {formatCurrency(salary_statistics.year_total_salary)}
                </Text>
              </View>
            </View>
          </View>

          {/* 薪酬结构 */}
          {current_structure && (
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
              <View className="flex flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-foreground">薪酬结构</Text>
                <View className="i-mdi-file-document text-2xl text-blue-600" />
              </View>

              <View className="space-y-3">
                <View className="flex flex-row items-center justify-between p-3 bg-blue-100 rounded-lg">
                  <Text className="text-sm text-foreground">基本工资</Text>
                  <Text className="text-base font-bold text-muted-foreground">
                    {formatCurrency(Number(current_structure.base_salary))}
                  </Text>
                </View>

                {Number(current_structure.performance_salary) > 0 && (
                  <View className="flex flex-row items-center justify-between p-3 bg-blue-100 rounded-lg">
                    <Text className="text-sm text-foreground">绩效工资</Text>
                    <Text className="text-base font-bold text-muted-foreground">
                      {formatCurrency(Number(current_structure.performance_salary))}
                    </Text>
                  </View>
                )}

                {Number(current_structure.position_allowance) > 0 && (
                  <View className="flex flex-row items-center justify-between p-3 bg-blue-100 rounded-lg">
                    <Text className="text-sm text-foreground">岗位津贴</Text>
                    <Text className="text-base font-bold text-muted-foreground">
                      {formatCurrency(Number(current_structure.position_allowance))}
                    </Text>
                  </View>
                )}

                {Number(current_structure.meal_allowance) > 0 && (
                  <View className="flex flex-row items-center justify-between p-3 bg-blue-100 rounded-lg">
                    <Text className="text-sm text-foreground">餐补</Text>
                    <Text className="text-base font-bold text-muted-foreground">
                      {formatCurrency(Number(current_structure.meal_allowance))}
                    </Text>
                  </View>
                )}

                {Number(current_structure.transport_allowance) > 0 && (
                  <View className="flex flex-row items-center justify-between p-3 bg-cyan-50 rounded-lg">
                    <Text className="text-sm text-foreground">交通补贴</Text>
                    <Text className="text-base font-bold text-cyan-600">
                      {formatCurrency(Number(current_structure.transport_allowance))}
                    </Text>
                  </View>
                )}

                {Number(current_structure.housing_allowance) > 0 && (
                  <View className="flex flex-row items-center justify-between p-3 bg-blue-100 rounded-lg">
                    <Text className="text-sm text-foreground">住房补贴</Text>
                    <Text className="text-base font-bold text-pink-600">
                      {formatCurrency(Number(current_structure.housing_allowance))}
                    </Text>
                  </View>
                )}

                <View className="flex flex-row items-center justify-between p-3 bg-muted rounded-lg border-2 border-border">
                  <Text className="text-base font-semibold text-foreground">应发合计</Text>
                  <Text className="text-xl font-bold text-foreground">
                    {formatCurrency(calculateTotalSalary(current_structure))}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 工资记录 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">工资记录</Text>
              <View className="i-mdi-history text-2xl text-blue-600" />
            </View>

            {recent_records.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-file-document-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无工资记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {recent_records.map((record) => (
                  <View key={record.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-3">
                      <Text className="text-base font-medium text-foreground">
                        {formatYearMonth(record.year, record.month)}
                      </Text>
                      <View
                        className={`px-2 py-1 rounded ${record.status === 'paid' ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <Text className={`text-xs ${SALARY_STATUS_COLORS[record.status]}`}>
                          {SALARY_STATUS_NAMES[record.status]}
                        </Text>
                      </View>
                    </View>

                    <View className="space-y-2">
                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-muted-foreground">应发工资</Text>
                        <Text className="text-sm font-medium text-foreground">
                          {formatCurrency(
                            Number(record.base_salary) +
                              Number(record.performance_salary) +
                              Number(record.allowances) +
                              Number(record.overtime_pay) +
                              Number(record.bonus)
                          )}
                        </Text>
                      </View>

                      <View className="flex flex-row items-center justify-between">
                        <Text className="text-xs text-muted-foreground">扣款合计</Text>
                        <Text className="text-sm font-medium text-red-600">
                          -
                          {formatCurrency(
                            Number(record.deductions) +
                              Number(record.social_insurance) +
                              Number(record.housing_fund) +
                              Number(record.tax)
                          )}
                        </Text>
                      </View>

                      <View className="flex flex-row items-center justify-between pt-2 border-t border-border">
                        <Text className="text-sm font-semibold text-foreground">实发工资</Text>
                        <Text className="text-lg font-bold text-muted-foreground">
                          {formatCurrency(Number(record.net_salary))}
                        </Text>
                      </View>
                    </View>

                    {record.paid_at && (
                      <Text className="text-xs text-muted-foreground mt-2">
                        发放时间: {new Date(record.paid_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 福利项目 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">福利项目</Text>
              <View className="i-mdi-gift text-2xl text-blue-600" />
            </View>

            {/* 福利统计 */}
            <View className="grid grid-cols-3 gap-3 mb-4">
              <View className="text-center p-3 bg-blue-100 rounded-lg">
                <Text className="text-2xl font-bold text-muted-foreground">{benefit_statistics.total_benefits}</Text>
                <Text className="text-xs text-muted-foreground mt-1">总福利</Text>
              </View>
              <View className="text-center p-3 bg-blue-100 rounded-lg">
                <Text className="text-2xl font-bold text-muted-foreground">{benefit_statistics.active_benefits}</Text>
                <Text className="text-xs text-muted-foreground mt-1">生效中</Text>
              </View>
              <View className="text-center p-3 bg-blue-100 rounded-lg">
                <Text className="text-2xl font-bold text-muted-foreground">
                  {formatCurrency(benefit_statistics.remaining_quota)}
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">剩余额度</Text>
              </View>
            </View>

            {benefits.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-gift-outline text-5xl text-muted-foreground/30 mb-2" />
                <Text className="text-sm text-muted-foreground">暂无福利项目</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {benefits.map((benefit) => (
                  <View key={benefit.id} className="p-4 bg-muted rounded-xl">
                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-foreground">{benefit.benefit_type.type_name}</Text>
                      <View
                        className={`px-2 py-1 rounded ${benefit.status === 'active' ? 'bg-green-100' : 'bg-gray-50'}`}>
                        <Text className={`text-xs ${BENEFIT_STATUS_COLORS[benefit.status]}`}>
                          {BENEFIT_STATUS_NAMES[benefit.status]}
                        </Text>
                      </View>
                    </View>

                    <View className="flex flex-row items-center justify-between mb-2">
                      <Text className="text-xs text-muted-foreground">
                        {BENEFIT_CATEGORY_NAMES[benefit.benefit_type.category]}
                      </Text>
                      {benefit.amount && (
                        <Text className="text-xs font-medium text-blue-600">
                          {formatCurrency(Number(benefit.amount))}
                        </Text>
                      )}
                    </View>

                    {benefit.quota && (
                      <View className="mb-2">
                        <View className="flex flex-row items-center justify-between mb-1">
                          <Text className="text-xs text-muted-foreground">使用额度</Text>
                          <Text className="text-xs text-muted-foreground">
                            {formatCurrency(Number(benefit.used_quota))}/{formatCurrency(Number(benefit.quota))}
                          </Text>
                        </View>
                        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-blue-100 rounded-full"
                            style={{
                              width: `${Math.min((Number(benefit.used_quota) / Number(benefit.quota)) * 100, 100)}%`
                            }}
                          />
                        </View>
                      </View>
                    )}

                    <Text className="text-xs text-muted-foreground">
                      生效日期: {benefit.start_date}
                      {benefit.end_date && ` - ${benefit.end_date}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 快捷操作 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">薪酬管理</Text>
              <View className="i-mdi-cog text-2xl text-blue-600" />
            </View>

            <View className="grid grid-cols-2 gap-3">
              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '工资单详情功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-file-document-outline text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">工资单详情</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '薪酬历史功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-history text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">薪酬历史</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '福利使用功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-gift text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">福利使用</Text>
              </View>

              <View
                className="bg-blue-100 rounded-xl p-4 flex flex-col items-center justify-center active:opacity-70"
                onClick={() => {
                  Taro.showToast({
                    title: '薪酬报告功能开发中',
                    icon: 'none'
                  })
                }}>
                <View className="i-mdi-file-chart text-3xl text-muted-foreground mb-2" />
                <Text className="text-xs text-muted-foreground font-medium text-center">薪酬报告</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
