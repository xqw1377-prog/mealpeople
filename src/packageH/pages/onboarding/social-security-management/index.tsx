/**
 * 社保管理页面（HR端）
 *
 * 功能：
 * - 查看所有员工的社保信息
 * - 管理社保缴纳记录
 * - 批量生成月度缴纳记录
 * - 统计分析
 *
 * 设计理念：容易学、容易做、容易管
 */

import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {
  calculateSocialSecurity,
  createSocialSecurityRecord,
  generateMonthlySocialSecurityPayments,
  getTenantPaymentRecords,
  getTenantSocialSecurityRecords
} from '@/db/api-employment'
import type {SocialSecurityPayment, SocialSecurityRecord} from '@/db/types-employment'
import {useTenantStore} from '@/store/tenant'

const SocialSecurityManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  // 状态管理
  const [socialSecurityRecords, setSocialSecurityRecords] = useState<SocialSecurityRecord[]>([])
  const [paymentRecords, setPaymentRecords] = useState<SocialSecurityPayment[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'records' | 'payments'>('records')
  const [selectedRecord, setSelectedRecord] = useState<SocialSecurityRecord | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // 新增社保记录表单
  const [addForm, setAddForm] = useState({
    employee_id: '',
    social_security_number: '',
    start_date: '',
    salary: '',
    notes: ''
  })

  // 月份选择器
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0)
  const months = Array.from({length: 12}, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })

  // 加载社保记录
  const loadSocialSecurityRecords = useCallback(async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const records = await getTenantSocialSecurityRecords(currentTenant.id)
      setSocialSecurityRecords(records)
    } catch (error) {
      console.error('加载社保记录失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  // 加载缴纳记录
  const loadPaymentRecords = useCallback(async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const selectedMonth = months[selectedMonthIndex]
      const records = await getTenantPaymentRecords(currentTenant.id, selectedMonth)
      setPaymentRecords(records)
    } catch (error) {
      console.error('加载缴纳记录失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error',
        duration: 2000
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant, selectedMonthIndex, months])

  useDidShow(() => {
    if (activeTab === 'records') {
      loadSocialSecurityRecords()
    } else {
      loadPaymentRecords()
    }
  })

  // 切换标签
  const handleTabChange = (tab: 'records' | 'payments') => {
    setActiveTab(tab)
    if (tab === 'records') {
      loadSocialSecurityRecords()
    } else {
      loadPaymentRecords()
    }
  }

  // 打开详情
  const handleOpenDetail = (record: SocialSecurityRecord) => {
    setSelectedRecord(record)
    setShowDetailModal(true)
  }

  // 批量生成月度缴纳记录
  const handleGenerateMonthlyRecords = async () => {
    if (!currentTenant) return

    try {
      const result = await Taro.showModal({
        title: '确认生成',
        content: `确定要为 ${months[selectedMonthIndex]} 月生成社保缴纳记录吗？`,
        confirmText: '确定',
        cancelText: '取消'
      })

      if (!result.confirm) return

      Taro.showLoading({title: '生成中...'})

      const selectedMonth = months[selectedMonthIndex]
      const payments = await generateMonthlySocialSecurityPayments(currentTenant.id, selectedMonth)
      const count = payments.length

      Taro.hideLoading()

      if (count > 0) {
        Taro.showToast({
          title: `成功生成${count}条记录！`,
          icon: 'success',
          duration: 2000
        })
        loadPaymentRecords()
      } else {
        Taro.showToast({
          title: '没有需要生成的记录',
          icon: 'none',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('生成缴纳记录失败:', error)
      Taro.showToast({
        title: '生成失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 打开新增社保记录弹窗
  const handleOpenAdd = () => {
    const today = new Date().toISOString().split('T')[0]
    setAddForm({
      employee_id: '',
      social_security_number: '',
      start_date: today,
      salary: '',
      notes: ''
    })
    setShowAddModal(true)
  }

  // 提交新增社保记录
  const handleSubmitAdd = async () => {
    if (!currentTenant) return

    // 验证必填项
    if (!addForm.employee_id || !addForm.start_date || !addForm.salary) {
      Taro.showToast({
        title: '请填写所有必填项',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 验证薪资是否为有效数字
    const salary = Number.parseFloat(addForm.salary)
    if (Number.isNaN(salary) || salary <= 0) {
      Taro.showToast({
        title: '请输入有效的薪资金额',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      Taro.showLoading({title: '创建中...'})

      // 使用calculateSocialSecurity自动计算社保金额
      const calculatedData = calculateSocialSecurity(salary)

      // 创建社保记录
      const result = await createSocialSecurityRecord({
        ...calculatedData,
        tenant_id: currentTenant.id,
        employee_id: addForm.employee_id,
        social_security_number: addForm.social_security_number || null,
        start_date: addForm.start_date,
        notes: addForm.notes || null
      })

      Taro.hideLoading()

      if (result) {
        Taro.showToast({
          title: '创建成功！',
          icon: 'success',
          duration: 2000
        })

        setShowAddModal(false)
        loadSocialSecurityRecords()
      } else {
        Taro.showToast({
          title: '创建失败，请重试',
          icon: 'error',
          duration: 2000
        })
      }
    } catch (error) {
      Taro.hideLoading()
      console.error('创建社保记录失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 获取社保状态信息
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      active: {text: '正常缴纳', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      suspended: {text: '暂停缴纳', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      terminated: {text: '已终止', color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
    }
    return statusMap[status] || {text: status, color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 获取缴纳状态信息
  const getPaymentStatusInfo = (status: string) => {
    const statusMap: Record<string, {text: string; color: string; bgColor: string}> = {
      pending: {text: '待缴纳', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      paid: {text: '已缴纳', color: 'text-muted-foreground', bgColor: 'bg-blue-100'},
      overdue: {text: '逾期', color: 'text-red-600', bgColor: 'bg-blue-100'}
    }
    return statusMap[status] || {text: status, color: 'text-muted-foreground', bgColor: 'bg-gray-50'}
  }

  // 计算统计数据
  const stats = {
    totalRecords: socialSecurityRecords.length,
    activeRecords: socialSecurityRecords.filter((r) => r.status === 'active').length,
    totalPayments: paymentRecords.length,
    paidPayments: paymentRecords.filter((p) => p.payment_status === 'paid').length,
    totalAmount: paymentRecords.reduce((sum, p) => sum + p.total_amount, 0)
  }

  // 租户检查
  if (!currentTenant) {
    return (
      <View className="@container min-h-screen bg-gray-50">
        <ScrollView scrollY className="h-screen box-border bg-transparent">
          <View className="p-4 max-sm:p-3">
            <View className="bg-white rounded-lg p-8 max-sm:p-6 border-2 border-gray-200">
              <View className="flex flex-col items-center justify-center py-12 max-sm:py-8 max-sm:py-6">
                <View className="i-mdi-alert-circle text-6xl text-muted-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5" />
                <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-2 max-sm:mb-1.5">
                  请先选择租户
                </Text>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mb-6 text-center">
                  您需要先选择一个租户才能访问社保管理功能
                </Text>
                <Button
                  size="default"
                  className="bg-blue-100 text-white px-6 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                  onClick={() => {
                    Taro.navigateTo({url: '/pages/tenant-select/index'})
                  }}>
                  选择租户
                </Button>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View className="@container min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4 max-sm:p-3 space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
          {/* 顶部标题卡片 */}
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
            <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              <View className="flex flex-row items-center flex-1">
                <View className="i-mdi-shield-account text-4xl max-sm:text-3xl text-muted-foreground mr-3 max-sm:mr-2" />
                <View className="flex-1">
                  <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">
                    社保管理
                  </Text>
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                    管理所有员工的社保信息
                  </Text>
                </View>
              </View>
              <Button
                className="bg-green-500 text-white active:opacity-80 transition-all px-4 max-sm:px-3 max-sm:px-2 py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                size="default"
                onClick={handleOpenAdd}>
                <View className="flex flex-row items-center gap-1">
                  <View className="i-mdi-plus text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px]" />
                  <Text className="text-white">新增</Text>
                </View>
              </Button>
            </View>

            {/* 统计信息 */}
            <View className="flex flex-row gap-4 max-sm:p-3">
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">社保人数</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600 mt-1">
                  {stats.totalRecords}
                </Text>
              </View>
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">正常缴纳</Text>
                <Text className="text-2xl max-sm:text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  {stats.activeRecords}
                </Text>
              </View>
              <View className="flex-1 bg-blue-100 rounded-xl p-3">
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">本月金额</Text>
                <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground mt-1">
                  ¥{stats.totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* 标签切换 */}
          <View className="flex flex-row gap-2 max-sm:gap-1.5">
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all ${
                activeTab === 'records' ? 'bg-blue-100 text-white' : 'bg-white text-muted-foreground'
              }`}
              size="default"
              onClick={() => handleTabChange('records')}>
              社保记录
            </Button>
            <Button
              className={`flex-1 py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all ${
                activeTab === 'payments' ? 'bg-blue-100 text-white' : 'bg-white text-muted-foreground'
              }`}
              size="default"
              onClick={() => handleTabChange('payments')}>
              缴纳记录
            </Button>
          </View>

          {/* 社保记录列表 */}
          {activeTab === 'records' && (
            <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
              <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                社保记录列表
              </Text>

              {loading ? (
                <View className="text-center py-8 max-sm:py-6">
                  <View className="i-mdi-loading text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-2 max-sm:mb-1.5" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
                </View>
              ) : socialSecurityRecords.length === 0 ? (
                <View className="text-center py-8 max-sm:py-6">
                  <View className="i-mdi-shield-outline text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">暂无社保记录</Text>
                </View>
              ) : (
                <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                  {socialSecurityRecords.map((record) => {
                    const statusInfo = getStatusInfo(record.status)

                    return (
                      <View key={record.id} className="border border-border rounded-xl p-4 max-sm:p-3">
                        {/* 记录标题 */}
                        <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                          <View className="flex-1">
                            <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                              员工ID: {record.employee_id.substring(0, 8)}
                            </Text>
                            <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                              社保编号：{record.social_security_number}
                            </Text>
                          </View>
                          <View className={`${statusInfo.bgColor} px-3 max-sm:px-2 py-1 rounded-full`}>
                            <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                              {statusInfo.text}
                            </Text>
                          </View>
                        </View>

                        {/* 社保信息 */}
                        <View className="space-y-2 max-sm:space-y-1.5 mb-3 max-sm:mb-2 max-sm:mb-1.5">
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              缴纳基数
                            </Text>
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                              ¥{record.pension_base.toLocaleString()}
                            </Text>
                          </View>
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              个人缴纳
                            </Text>
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                              ¥{record.total_personal_contribution.toLocaleString()}
                            </Text>
                          </View>
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              公司缴纳
                            </Text>
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                              ¥{record.total_company_contribution.toLocaleString()}
                            </Text>
                          </View>
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              合计
                            </Text>
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">
                              ¥
                              {(
                                record.total_personal_contribution + record.total_company_contribution
                              ).toLocaleString()}
                            </Text>
                          </View>
                          <View className="flex flex-row items-center justify-between">
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                              开始日期
                            </Text>
                            <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                              {formatDate(record.start_date)}
                            </Text>
                          </View>
                        </View>

                        {/* 操作按钮 */}
                        <Button
                          className="w-full bg-blue-100 text-white py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                          size="default"
                          onClick={() => handleOpenDetail(record)}>
                          查看详情
                        </Button>
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )}

          {/* 缴纳记录列表 */}
          {activeTab === 'payments' && (
            <>
              {/* 月份选择和生成按钮 */}
              <View className="bg-white rounded-lg p-4 max-sm:p-3 border-2 border-gray-200">
                <View className="flex flex-row items-center gap-3 max-sm:gap-2 max-sm:gap-1.5">
                  <View className="flex-1">
                    <Picker
                      mode="selector"
                      range={months}
                      value={selectedMonthIndex}
                      onChange={(e) => {
                        setSelectedMonthIndex(Number(e.detail.value))
                        setTimeout(() => loadPaymentRecords(), 100)
                      }}>
                      <View className="flex flex-row items-center justify-between bg-muted rounded-lg px-4 max-sm:px-3 max-sm:px-2 py-3 max-sm:py-2">
                        <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                          {months[selectedMonthIndex]}
                        </Text>
                        <View className="i-mdi-chevron-down text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground" />
                      </View>
                    </Picker>
                  </View>
                  <Button
                    className="bg-green-500 text-white active:opacity-80 transition-all px-4 max-sm:px-3 max-sm:px-2 py-3 max-sm:py-2 rounded-lg break-keep text-sm max-sm:text-xs max-sm:text-[10px]"
                    size="default"
                    onClick={handleGenerateMonthlyRecords}>
                    生成记录
                  </Button>
                </View>
              </View>

              <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200">
                <View className="flex flex-row items-center justify-between mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
                  <Text className="text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                    缴纳记录列表
                  </Text>
                  <View className="flex flex-row items-center gap-2 max-sm:gap-1.5">
                    <Text className="text-xs max-sm:text-[10px] text-muted-foreground">已缴纳</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-muted-foreground">
                      {stats.paidPayments}/{stats.totalPayments}
                    </Text>
                  </View>
                </View>

                {loading ? (
                  <View className="text-center py-8 max-sm:py-6">
                    <View className="i-mdi-loading text-4xl max-sm:text-3xl text-blue-600 animate-spin mb-2 max-sm:mb-1.5" />
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">加载中...</Text>
                  </View>
                ) : paymentRecords.length === 0 ? (
                  <View className="text-center py-8 max-sm:py-6">
                    <View className="i-mdi-file-document-outline text-4xl max-sm:text-3xl text-muted-foreground mb-2 max-sm:mb-1.5" />
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                      暂无缴纳记录
                    </Text>
                    <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-2">
                      点击"生成记录"按钮创建本月缴纳记录
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                    {paymentRecords.map((payment) => {
                      const statusInfo = getPaymentStatusInfo(payment.payment_status)

                      return (
                        <View key={payment.id} className="border border-border rounded-xl p-4 max-sm:p-3">
                          {/* 记录标题 */}
                          <View className="flex flex-row items-center justify-between mb-3 max-sm:mb-2 max-sm:mb-1.5">
                            <View className="flex-1">
                              <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground">
                                员工ID: {payment.employee_id.substring(0, 8)}
                              </Text>
                              <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                                缴纳月份：{payment.payment_month}
                              </Text>
                            </View>
                            <View className={`${statusInfo.bgColor} px-3 max-sm:px-2 py-1 rounded-full`}>
                              <Text className={`text-xs max-sm:text-[10px] font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                              </Text>
                            </View>
                          </View>

                          {/* 缴纳信息 */}
                          <View className="space-y-2 max-sm:space-y-1.5">
                            <View className="flex flex-row items-center justify-between">
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                                个人缴纳
                              </Text>
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                                ¥{payment.personal_amount.toLocaleString()}
                              </Text>
                            </View>
                            <View className="flex flex-row items-center justify-between">
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                                公司缴纳
                              </Text>
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                                ¥{payment.company_amount.toLocaleString()}
                              </Text>
                            </View>
                            <View className="flex flex-row items-center justify-between">
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                                合计金额
                              </Text>
                              <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                                ¥{payment.total_amount.toLocaleString()}
                              </Text>
                            </View>
                            {payment.payment_date && (
                              <View className="flex flex-row items-center justify-between">
                                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">
                                  缴纳日期
                                </Text>
                                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
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
            </>
          )}

          {/* 温馨提示 */}
          <View className="bg-blue-100 rounded-xl p-4 max-sm:p-3">
            <View className="flex flex-row items-start">
              <View className="i-mdi-information text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground font-medium mb-1">
                  温馨提示
                </Text>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground">
                  • 每月需要生成当月的社保缴纳记录{'\n'}• 社保基数变更会自动更新缴纳金额{'\n'}•
                  请及时完成社保缴纳，避免逾期
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 社保详情弹窗 */}
      {showDetailModal && selectedRecord && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{zIndex: 1000}}
          onClick={() => setShowDetailModal(false)}>
          <View
            className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 mx-4 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{maxHeight: '80vh', overflowY: 'auto'}}>
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              社保详情
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 基本信息 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  基本信息
                </Text>
                <View className="space-y-2 max-sm:space-y-1.5">
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">员工ID</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {selectedRecord.employee_id.substring(0, 8)}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">社保编号</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {selectedRecord.social_security_number}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">缴纳基数</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                      ¥{selectedRecord.pension_base.toLocaleString()}
                    </Text>
                  </View>
                  <View className="flex flex-row justify-between">
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">开始日期</Text>
                    <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                      {formatDate(selectedRecord.start_date)}
                    </Text>
                  </View>
                  {selectedRecord.end_date && (
                    <View className="flex flex-row justify-between">
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] text-muted-foreground">结束日期</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        {formatDate(selectedRecord.end_date)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 缴纳明细 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                  缴纳明细
                </Text>
                <View className="space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
                  {/* 养老保险 */}
                  <View className="bg-blue-100 rounded-lg p-3">
                    <Text className="text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                      养老保险
                    </Text>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">个人</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        ¥{selectedRecord.personal_pension.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between mt-1">
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">公司</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        ¥{selectedRecord.company_pension.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* 医疗保险 */}
                  <View className="bg-blue-100 rounded-lg p-3">
                    <Text className="text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                      医疗保险
                    </Text>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">个人</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        ¥{selectedRecord.personal_medical.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between mt-1">
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">公司</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        ¥{selectedRecord.company_medical.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* 失业保险 */}
                  <View className="bg-blue-100 rounded-lg p-3">
                    <Text className="text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                      失业保险
                    </Text>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">个人</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        ¥{selectedRecord.personal_unemployment.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between mt-1">
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">公司</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        ¥{selectedRecord.company_unemployment.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* 公积金 */}
                  <View className="bg-blue-100 rounded-lg p-3">
                    <Text className="text-xs max-sm:text-[10px] font-medium text-muted-foreground mb-2 max-sm:mb-1.5">
                      住房公积金
                    </Text>
                    <View className="flex flex-row justify-between">
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">个人</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        ¥{selectedRecord.personal_housing_fund.toLocaleString()}
                      </Text>
                    </View>
                    <View className="flex flex-row justify-between mt-1">
                      <Text className="text-xs max-sm:text-[10px] text-muted-foreground">公司</Text>
                      <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground">
                        ¥{selectedRecord.company_housing_fund.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 合计 */}
              <View className="bg-blue-100 rounded-lg p-3">
                <View className="flex flex-row justify-between mb-2 max-sm:mb-1.5">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground">
                    个人合计
                  </Text>
                  <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                    ¥{selectedRecord.total_personal_contribution.toLocaleString()}
                  </Text>
                </View>
                <View className="flex flex-row justify-between">
                  <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-muted-foreground">
                    公司合计
                  </Text>
                  <Text className="text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-blue-600">
                    ¥{selectedRecord.total_company_contribution.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* 关闭按钮 */}
            <Button
              className="w-full bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all mt-6"
              size="default"
              onClick={() => setShowDetailModal(false)}>
              关闭
            </Button>
          </View>
        </View>
      )}

      {/* 新增社保记录弹窗 */}
      {showAddModal && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 max-sm:p-3">
          <View className="bg-white rounded-lg p-6 max-sm:p-4 border-2 border-gray-200 w-full max-w-md">
            <Text className="text-xl max-sm:text-lg max-sm:text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold text-foreground mb-4 max-sm:mb-3 max-sm:mb-2 max-sm:mb-1.5">
              新增社保记录
            </Text>

            <View className="space-y-4 max-sm:space-y-3 max-sm:space-y-2 max-sm:space-y-1.5">
              {/* 员工ID */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  员工ID <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入员工ID"
                    value={addForm.employee_id}
                    onInput={(e) => setAddForm({...addForm, employee_id: e.detail.value})}
                  />
                </View>
              </View>

              {/* 社保编号 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  社保编号
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入社保编号（可选）"
                    value={addForm.social_security_number}
                    onInput={(e) => setAddForm({...addForm, social_security_number: e.detail.value})}
                  />
                </View>
              </View>

              {/* 开始日期 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  开始日期 <Text className="text-red-500">*</Text>
                </Text>
                <Picker
                  mode="date"
                  value={addForm.start_date}
                  onChange={(e) => setAddForm({...addForm, start_date: e.detail.value})}>
                  <View className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full">
                    <Text className="text-foreground">{addForm.start_date || '请选择开始日期'}</Text>
                  </View>
                </Picker>
              </View>

              {/* 薪资（用于计算社保基数） */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  薪资 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入薪资（用于计算社保基数）"
                    type="digit"
                    value={addForm.salary}
                    onInput={(e) => setAddForm({...addForm, salary: e.detail.value})}
                  />
                </View>
                <Text className="text-xs max-sm:text-[10px] text-muted-foreground mt-1">
                  系统将根据薪资自动计算社保缴纳金额
                </Text>
              </View>

              {/* 备注 */}
              <View>
                <Text className="text-sm max-sm:text-xs max-sm:text-[10px] font-medium text-foreground mb-2 max-sm:mb-1.5">
                  备注
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-input text-foreground px-3 max-sm:px-2 py-2 rounded border border-border w-full"
                    placeholder="请输入备注信息"
                    value={addForm.notes}
                    onInput={(e) => setAddForm({...addForm, notes: e.detail.value})}
                    maxlength={200}
                  />
                </View>
              </View>
            </View>

            {/* 按钮 */}
            <View className="flex flex-row gap-3 max-sm:gap-2 max-sm:gap-1.5 mt-6">
              <Button
                className="flex-1 bg-muted text-muted-foreground py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={() => setShowAddModal(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 max-sm:py-2 rounded-lg break-keep text-base max-sm:text-sm max-sm:text-xs max-sm:text-[10px] font-bold transition-all"
                size="default"
                onClick={handleSubmitAdd}>
                确定
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default SocialSecurityManagement
