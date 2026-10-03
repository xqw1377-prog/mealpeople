/**
 * 我的社保页面（员工端）
 *
 * 功能：
 * - 查看社保缴纳信息
 * - 查看缴纳记录
 * - 查看缴纳明细
 *
 * 设计理念：容易学、容易做、容易管
 */

import {ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getEmployeeSocialSecurityPayments, getEmployeeSocialSecurityRecord} from '@/db/api-employment'
import type {SocialSecurityPayment, SocialSecurityRecord} from '@/db/types-employment'

const MySocialSecurity: React.FC = () => {
  const {user} = useAuth({guard: true})

  // 状态管理
  const [record, setRecord] = useState<SocialSecurityRecord | null>(null)
  const [payments, setPayments] = useState<SocialSecurityPayment[]>([])
  const [loading, setLoading] = useState(false)

  // 加载社保信息
  const loadSocialSecurity = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const recordData = await getEmployeeSocialSecurityRecord(user.id)
      const paymentsData = await getEmployeeSocialSecurityPayments(user.id)

      setRecord(recordData)
      setPayments(paymentsData)
    } catch (error) {
      console.error('加载社保信息失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useDidShow(() => {
    loadSocialSecurity()
  })

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 获取缴纳状态信息
  const getPaymentStatusInfo = (status: string) => {
    if (status === 'paid') {
      return {text: '已缴纳', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    }
    if (status === 'pending') {
      return {text: '待缴纳', color: 'text-muted-foreground', bgColor: 'bg-blue-100'}
    }
    if (status === 'failed') {
      return {text: '缴纳失败', color: 'text-red-600', bgColor: 'bg-blue-100'}
    }
    return {text: status, color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 space-y-4">
          {/* 顶部标题卡片 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <View className="flex flex-row items-center mb-4">
              <View className="i-mdi-shield-account text-4xl text-blue-600 mr-3" />
              <View className="flex-1">
                <Text className="text-2xl font-bold text-blue-600">我的社保</Text>
                <Text className="text-sm text-muted-foreground mt-1">查看社保缴纳信息和记录</Text>
              </View>
            </View>

            {loading ? (
              <View className="text-center py-4">
                <View className="i-mdi-loading text-3xl text-blue-600 animate-spin mb-2" />
                <Text className="text-sm text-muted-foreground">加载中...</Text>
              </View>
            ) : !record ? (
              <View className="text-center py-4">
                <View className="i-mdi-shield-off text-3xl text-muted-foreground mb-2" />
                <Text className="text-sm text-muted-foreground">暂无社保信息</Text>
              </View>
            ) : (
              <>
                {/* 社保状态 */}
                <View className="flex flex-row items-center justify-between mb-4">
                  <Text className="text-sm text-muted-foreground">社保状态</Text>
                  <View
                    className={`px-3 py-1 rounded-full ${record.status === 'active' ? 'bg-blue-100' : 'bg-gray-50'}`}>
                    <Text
                      className={`text-xs font-medium ${record.status === 'active' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                      {record.status === 'active' ? '正常缴纳' : record.status === 'suspended' ? '暂停缴纳' : '已终止'}
                    </Text>
                  </View>
                </View>

                {/* 月度缴纳金额 */}
                <View className="flex flex-row gap-4">
                  <View className="flex-1 bg-blue-100 rounded-xl p-3">
                    <Text className="text-xs text-muted-foreground">公司缴纳</Text>
                    <Text className="text-xl font-bold text-blue-600 mt-1">
                      ¥{record.total_company_contribution.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex-1 bg-blue-100 rounded-xl p-3">
                    <Text className="text-xs text-muted-foreground">个人缴纳</Text>
                    <Text className="text-xl font-bold text-muted-foreground mt-1">
                      ¥{record.total_personal_contribution.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* 社保明细 */}
          {record && (
            <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
              <Text className="text-lg font-bold text-foreground mb-4">缴纳明细</Text>

              <View className="space-y-4">
                {/* 养老保险 */}
                <View>
                  <View className="flex flex-row items-center mb-2">
                    <View className="i-mdi-account-heart text-xl text-blue-600 mr-2" />
                    <Text className="text-sm font-medium text-foreground">养老保险</Text>
                  </View>
                  <View className="bg-muted rounded-lg p-3 space-y-2">
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">缴纳基数</Text>
                      <Text className="text-xs font-medium text-foreground">
                        ¥{record.pension_base.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">公司缴纳</Text>
                      <Text className="text-xs font-medium text-blue-600">
                        ¥{record.company_pension.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">个人缴纳</Text>
                      <Text className="text-xs font-medium text-muted-foreground">
                        ¥{record.personal_pension.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 医疗保险 */}
                <View>
                  <View className="flex flex-row items-center mb-2">
                    <View className="i-mdi-hospital-box text-xl text-blue-600 mr-2" />
                    <Text className="text-sm font-medium text-foreground">医疗保险</Text>
                  </View>
                  <View className="bg-muted rounded-lg p-3 space-y-2">
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">缴纳基数</Text>
                      <Text className="text-xs font-medium text-foreground">
                        ¥{record.medical_base.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">公司缴纳</Text>
                      <Text className="text-xs font-medium text-blue-600">
                        ¥{record.company_medical.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">个人缴纳</Text>
                      <Text className="text-xs font-medium text-muted-foreground">
                        ¥{record.personal_medical.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 失业保险 */}
                <View>
                  <View className="flex flex-row items-center mb-2">
                    <View className="i-mdi-briefcase-off text-xl text-blue-600 mr-2" />
                    <Text className="text-sm font-medium text-foreground">失业保险</Text>
                  </View>
                  <View className="bg-muted rounded-lg p-3 space-y-2">
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">缴纳基数</Text>
                      <Text className="text-xs font-medium text-foreground">
                        ¥{record.unemployment_base.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">公司缴纳</Text>
                      <Text className="text-xs font-medium text-blue-600">
                        ¥{record.company_unemployment.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">个人缴纳</Text>
                      <Text className="text-xs font-medium text-muted-foreground">
                        ¥{record.personal_unemployment.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 住房公积金 */}
                <View>
                  <View className="flex flex-row items-center mb-2">
                    <View className="i-mdi-home text-xl text-blue-600 mr-2" />
                    <Text className="text-sm font-medium text-foreground">住房公积金</Text>
                  </View>
                  <View className="bg-muted rounded-lg p-3 space-y-2">
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">缴纳基数</Text>
                      <Text className="text-xs font-medium text-foreground">
                        ¥{record.housing_fund_base.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">公司缴纳</Text>
                      <Text className="text-xs font-medium text-blue-600">
                        ¥{record.company_housing_fund.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs text-muted-foreground">个人缴纳</Text>
                      <Text className="text-xs font-medium text-muted-foreground">
                        ¥{record.personal_housing_fund.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 缴纳记录 */}
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-sm">
            <Text className="text-lg font-bold text-foreground mb-4">缴纳记录</Text>

            {payments.length === 0 ? (
              <View className="text-center py-8">
                <View className="i-mdi-file-document-outline text-4xl text-muted-foreground mb-2" />
                <Text className="text-sm text-muted-foreground">暂无缴纳记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {payments.map((payment) => {
                  const statusInfo = getPaymentStatusInfo(payment.payment_status)

                  return (
                    <View key={payment.id} className="border border-border rounded-xl p-4">
                      {/* 缴纳月份 */}
                      <View className="flex flex-row items-center justify-between mb-3">
                        <Text className="text-base font-bold text-foreground">{payment.payment_month}</Text>
                        <View className={`${statusInfo.bgColor} px-3 py-1 rounded-full`}>
                          <Text className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</Text>
                        </View>
                      </View>

                      {/* 缴纳金额 */}
                      <View className="space-y-2">
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm text-muted-foreground">公司缴纳</Text>
                          <Text className="text-sm font-medium text-blue-600">
                            ¥{payment.company_amount.toLocaleString()}
                          </Text>
                        </View>
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm text-muted-foreground">个人缴纳</Text>
                          <Text className="text-sm font-medium text-muted-foreground">
                            ¥{payment.personal_amount.toLocaleString()}
                          </Text>
                        </View>
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-sm text-muted-foreground">合计</Text>
                          <Text className="text-sm font-bold text-foreground">
                            ¥{payment.total_amount.toLocaleString()}
                          </Text>
                        </View>
                        {payment.payment_date && (
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm text-muted-foreground">缴纳日期</Text>
                            <Text className="text-sm font-medium text-foreground">
                              {formatDate(payment.payment_date)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </View>

          {/* 温馨提示 */}
          <View className="bg-blue-100 rounded-xl p-4">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-xl text-blue-600 mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm text-blue-600 font-medium mb-1">温馨提示</Text>
                <Text className="text-xs text-muted-foreground">
                  • 社保每月由公司统一缴纳{'\n'}• 个人缴纳部分从工资中扣除{'\n'}• 如有疑问请联系HR部门
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default MySocialSecurity
