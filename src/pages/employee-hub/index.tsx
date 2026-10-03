/**
 * 员工中心页面 - 员工全生命周期管理核心页面
 */

import {Input, ScrollView, Text, View} from '@tarojs/components'
import Taro, {getEnv, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getAllEmployees, getDepartments, getEmployeeStats, getPositions} from '@/db/api-employee-hub'
import type {Employee, EmployeeStats} from '@/db/types-employee-hub'
import {exportEmployeesToExcel} from '@/utils/export-employee'

export default function EmployeeHub() {
  const {user} = useAuth({guard: true})
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [stats, setStats] = useState<EmployeeStats | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [_departments, setDepartments] = useState<string[]>([])
  const [_positions, setPositions] = useState<string[]>([])

  // 加载员工列表和统计数据
  const loadData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const [employeesData, statsData, deptData, posData] = await Promise.all([
        getAllEmployees(),
        getEmployeeStats(),
        getDepartments(),
        getPositions()
      ])

      setEmployees(employeesData)
      setFilteredEmployees(employeesData)
      setStats(statsData)
      setDepartments(deptData)
      setPositions(posData)
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

  // 搜索员工
  const handleSearch = useCallback(
    (keyword: string) => {
      setSearchKeyword(keyword)
      if (!keyword.trim()) {
        setFilteredEmployees(employees)
        return
      }

      const filtered = employees.filter(
        (emp) => emp.name?.toLowerCase().includes(keyword.toLowerCase()) || emp.phone?.includes(keyword)
      )
      setFilteredEmployees(filtered)
    },
    [employees]
  )

  // 筛选员工
  const handleFilter = useCallback(
    (filter: string) => {
      setActiveFilter(filter)
      let filtered = employees

      switch (filter) {
        case 'active':
          filtered = employees.filter((emp) => emp.status === 'active')
          break
        case 'on_leave':
          filtered = employees.filter((emp) => emp.status === 'on_leave')
          break
        case 'part_time':
          filtered = employees.filter((emp) => emp.employee_type === 'part_time')
          break
        case 'resigned':
          filtered = employees.filter((emp) => emp.status === 'resigned')
          break
        default:
          filtered = employees
      }

      setFilteredEmployees(filtered)
    },
    [employees]
  )

  // 导出员工数据
  const handleExportEmployees = () => {
    // 检查是否在H5环境
    const env = getEnv()
    if (env !== 'WEB') {
      Taro.showToast({
        title: '导出功能仅支持WEB端',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 检查是否有数据
    if (filteredEmployees.length === 0) {
      Taro.showToast({
        title: '暂无数据可导出',
        icon: 'none',
        duration: 2000
      })
      return
    }

    try {
      // 根据当前筛选条件确定文件名
      let filename = '员工数据'
      switch (activeFilter) {
        case 'full_time':
          filename = '全职员工数据'
          break
        case 'part_time':
          filename = '兼职员工数据'
          break
        case 'active':
          filename = '在职员工数据'
          break
        case 'on_leave':
          filename = '请假员工数据'
          break
        case 'resigned':
          filename = '离职员工数据'
          break
        default:
          filename = '全部员工数据'
      }

      // 导出数据
      exportEmployeesToExcel(filteredEmployees, filename)

      Taro.showToast({
        title: '导出成功',
        icon: 'success',
        duration: 2000
      })
    } catch (error) {
      console.error('导出失败:', error)
      Taro.showToast({
        title: '导出失败，请重试',
        icon: 'error',
        duration: 2000
      })
    }
  }

  // 快捷操作
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add':
        Taro.showToast({title: '添加员工功能开发中', icon: 'none'})
        break
      case 'import':
        // 跳转到员工导入页面
        Taro.navigateTo({url: '/packageA/pages/employee-import/employee-import/index'})
        break
      case 'export':
        // 导出员工数据为Excel
        handleExportEmployees()
        break
      case 'stats':
        Taro.showToast({title: '统计分析功能开发中', icon: 'none'})
        break
      case 'invite':
        // 跳转到邀请员工页面
        Taro.navigateTo({
          url: '/packageD/pages/invite-employee/index'
        })
        break
      case 'onboarding':
        // 跳转到入职管理中心
        Taro.navigateTo({
          url: '/packageH/pages/onboarding-management/index'
        })
        break
      case 'resignation':
        // 跳转到离职管理中心
        Taro.navigateTo({
          url: '/packageH/pages/resignation-management/index'
        })
        break
      case 'part_time':
        // 跳转到兼职管理中心
        Taro.navigateTo({
          url: '/packageA/pages/part-time-management/index'
        })
        break
      default:
        Taro.showToast({title: '功能开发中', icon: 'none'})
    }
  }

  // 查看员工详情
  const handleEmployeeDetail = (_employeeId: string) => {
    Taro.showToast({title: '员工详情页面开发中', icon: 'none'})
  }

  // 获取员工状态标签
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return {text: '在职', bgColor: 'bg-blue-100', textColor: 'text-white'}
      case 'on_leave':
        return {text: '休假', bgColor: 'bg-blue-100', textColor: 'text-white'}
      case 'resigned':
        return {text: '离职', bgColor: 'bg-gray-50', textColor: 'text-blue-600'}
      case 'terminated':
        return {text: '解雇', bgColor: 'bg-blue-100', textColor: 'text-white'}
      default:
        return {text: '未知', bgColor: 'bg-gray-200', textColor: 'text-muted-foreground'}
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        {/* 使用容器查询支持WEB端响应式 */}
        <View className="@container">
          <View className="p-4 max-w-7xl mx-auto">
            {/* 页面标题 */}
            <View className="mb-6">
              <View className="flex items-center gap-3 mb-2">
                <View className="w-12 h-12 rounded-lg bg-white backdrop-blur flex items-center justify-center">
                  <View className="i-mdi-account-group text-3xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-2xl max-sm:text-xl font-bold text-foreground">员工中心</Text>
                  <Text className="text-sm text-blue-600/80">全生命周期管理</Text>
                </View>
              </View>
            </View>

            {/* 统计卡片 */}
            {stats && (
              <View className="bg-white backdrop-blur rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-md">
                <View className="grid grid-cols-4 gap-3">
                  <View className="text-center">
                    <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <View className="i-mdi-account-multiple text-2xl text-blue-600" />
                    </View>
                    <Text className="text-2xl font-bold text-foreground">{stats.total}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">总人数</Text>
                  </View>
                  <View className="text-center">
                    <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <View className="i-mdi-account-check text-2xl text-blue-600" />
                    </View>
                    <Text className="text-2xl font-bold text-foreground">{stats.active}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">在职</Text>
                  </View>
                  <View className="text-center">
                    <View className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <View className="i-mdi-account-clock text-2xl text-blue-600" />
                    </View>
                    <Text className="text-2xl font-bold text-foreground">{stats.on_leave}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">休假</Text>
                  </View>
                  <View className="text-center">
                    <View className="w-12 h-12 rounded-lg bg-gray-400 flex items-center justify-center mx-auto mb-2">
                      <View className="i-mdi-account-off text-2xl text-white" />
                    </View>
                    <Text className="text-2xl font-bold text-foreground">{stats.resigned}</Text>
                    <Text className="text-xs text-muted-foreground mt-1">离职</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 搜索框 - 修复显示问题 */}
            <View className="bg-white backdrop-blur rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-md">
              <View style={{overflow: 'hidden'}}>
                <View className="flex items-center bg-gray-50 rounded-lg px-4 py-3">
                  <View className="i-mdi-magnify text-2xl text-muted-foreground mr-2 flex-shrink-0" />
                  <Input
                    className="flex-1 text-sm text-foreground"
                    placeholder="搜索员工姓名、手机号..."
                    value={searchKeyword}
                    onInput={(e) => handleSearch(e.detail.value)}
                  />
                </View>
              </View>
            </View>

            {/* 筛选标签 */}
            <View className="flex items-center gap-2 mb-4 overflow-x-auto">
              <View
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === 'all' ? 'bg-green-500 text-white shadow-md' : 'bg-white text-foreground'
                }`}
                onClick={() => handleFilter('all')}>
                <Text className={activeFilter === 'all' ? 'text-white' : 'text-foreground'}>全部</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === 'active' ? 'bg-blue-100 text-white shadow-md' : 'bg-white text-foreground'
                }`}
                onClick={() => handleFilter('active')}>
                <Text className={activeFilter === 'active' ? 'text-blue-600' : 'text-foreground'}>在职</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === 'on_leave' ? 'bg-blue-100 text-white shadow-md' : 'bg-white text-foreground'
                }`}
                onClick={() => handleFilter('on_leave')}>
                <Text className={activeFilter === 'on_leave' ? 'text-blue-600' : 'text-foreground'}>休假</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === 'part_time' ? 'bg-blue-100 text-white shadow-md' : 'bg-white text-foreground'
                }`}
                onClick={() => handleFilter('part_time')}>
                <Text className={activeFilter === 'part_time' ? 'text-blue-600' : 'text-foreground'}>兼职</Text>
              </View>
              <View
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeFilter === 'resigned' ? 'bg-gray-400 text-white shadow-md' : 'bg-white text-foreground'
                }`}
                onClick={() => handleFilter('resigned')}>
                <Text className={activeFilter === 'resigned' ? 'text-white' : 'text-foreground'}>离职</Text>
              </View>
            </View>

            {/* 快速操作 */}
            <View className="bg-white backdrop-blur rounded-lg p-6 border-2 border-gray-200 mb-4 shadow-md">
              <View className="flex items-center gap-3 mb-4">
                <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <View className="i-mdi-lightning-bolt text-2xl text-blue-600" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">快速操作</Text>
                  <Text className="text-xs text-muted-foreground">常用功能快捷入口</Text>
                </View>
              </View>

              <View className="grid grid-cols-2 @md:grid-cols-4 gap-3">
                {/* 入职管理 - 优化文字排版 */}
                <View
                  className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200 active:opacity-70 transition-all shadow-sm cursor-pointer"
                  onClick={() => handleQuickAction('onboarding')}>
                  <View className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                    <View className="i-mdi-account-multiple-plus text-2xl text-white" />
                  </View>
                  <Text className="text-sm font-bold text-foreground mb-1 break-keep">入职管理</Text>
                  <Text className="text-xs text-muted-foreground leading-tight">候选人·面试·Offer</Text>
                </View>

                {/* 离职管理 - 优化文字排版 */}
                <View
                  className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border-2 border-orange-200 active:opacity-70 transition-all shadow-sm cursor-pointer"
                  onClick={() => handleQuickAction('resignation')}>
                  <View className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-3">
                    <View className="i-mdi-exit-to-app text-2xl text-white" />
                  </View>
                  <Text className="text-sm font-bold text-foreground mb-1 break-keep">离职管理</Text>
                  <Text className="text-xs text-muted-foreground leading-tight">申请·审批·统计</Text>
                </View>

                {/* 邀请员工 - 新增功能 */}
                <View
                  className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200 active:opacity-70 transition-all shadow-sm cursor-pointer"
                  onClick={() => handleQuickAction('invite')}>
                  <View className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                    <View className="i-mdi-account-plus-outline text-2xl text-white" />
                  </View>
                  <Text className="text-sm font-bold text-foreground mb-1 break-keep">邀请员工</Text>
                  <Text className="text-xs text-muted-foreground leading-tight">生成邀请码·快速加入</Text>
                </View>

                {/* 添加员工 - 优化文字排版 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all shadow-sm cursor-pointer"
                  onClick={() => handleQuickAction('add')}>
                  <View className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <View className="i-mdi-account-plus text-2xl text-blue-600" />
                  </View>
                  <Text className="text-sm font-bold text-foreground break-keep">添加员工</Text>
                </View>

                {/* 批量导入 - 优化文字排版 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all shadow-sm cursor-pointer"
                  onClick={() => handleQuickAction('import')}>
                  <View className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <View className="i-mdi-file-import text-2xl text-blue-600" />
                  </View>
                  <Text className="text-sm font-bold text-foreground break-keep">批量导入</Text>
                </View>

                {/* 导出数据 - 优化文字排版 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all shadow-sm cursor-pointer"
                  onClick={() => handleQuickAction('export')}>
                  <View className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <View className="i-mdi-file-export text-2xl text-blue-600" />
                  </View>
                  <Text className="text-sm font-bold text-foreground break-keep">导出数据</Text>
                </View>

                {/* 统计分析 - 优化文字排版 */}
                <View
                  className="bg-white rounded-lg p-4 border-2 border-gray-200 active:opacity-70 transition-all shadow-sm cursor-pointer"
                  onClick={() => handleQuickAction('stats')}>
                  <View className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <View className="i-mdi-chart-bar text-2xl text-blue-600" />
                  </View>
                  <Text className="text-sm font-bold text-foreground break-keep">统计分析</Text>
                </View>

                {/* 兼职管理 - 优化文字排版 */}
                <View
                  className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border-2 border-purple-200 active:opacity-70 transition-all shadow-sm cursor-pointer"
                  onClick={() => handleQuickAction('part_time')}>
                  <View className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                    <View className="i-mdi-account-clock text-2xl text-white" />
                  </View>
                  <Text className="text-sm font-bold text-foreground mb-1 break-keep">兼职管理</Text>
                  <Text className="text-xs text-muted-foreground leading-tight">独立管理·工时统计</Text>
                </View>
              </View>
            </View>

            {/* 员工列表 */}
            <View className="mb-4">
              <View className="flex items-center justify-between mb-3">
                <Text className="text-lg font-bold text-foreground">员工列表</Text>
                <View className="bg-blue-100 px-3 py-1 rounded-full shadow-sm">
                  <Text className="text-sm text-blue-600 font-medium">{filteredEmployees.length}人</Text>
                </View>
              </View>

              {loading ? (
                <View className="bg-white backdrop-blur rounded-lg p-8 border-2 border-gray-200 shadow-md text-center">
                  <View className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <View className="i-mdi-loading text-4xl text-blue-600 animate-spin" />
                  </View>
                  <Text className="text-sm text-muted-foreground">加载中...</Text>
                </View>
              ) : filteredEmployees.length === 0 ? (
                <View className="bg-white backdrop-blur rounded-lg p-8 border-2 border-gray-200 shadow-md text-center">
                  <View className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center mx-auto mb-6">
                    <View className="i-mdi-account-off text-6xl text-muted-foreground" />
                  </View>
                  <Text className="text-xl font-bold text-foreground mb-2">暂无员工数据</Text>
                  <Text className="text-sm text-muted-foreground">请添加员工或调整筛选条件</Text>
                </View>
              ) : (
                <View className="space-y-3 mb-20">
                  {filteredEmployees.map((employee) => {
                    const statusBadge = getStatusBadge(employee.status)
                    return (
                      <View
                        key={employee.id}
                        className="bg-white backdrop-blur rounded-lg p-5 border-2 border-gray-200 shadow-md active:opacity-70 transition-all"
                        onClick={() => handleEmployeeDetail(employee.id)}>
                        <View className="flex items-start justify-between mb-3">
                          <View className="flex items-center gap-3 flex-1">
                            <View className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <View className="i-mdi-account text-3xl text-blue-600" />
                            </View>
                            <View className="flex-1">
                              <View className="flex items-center gap-2 mb-1">
                                <Text className="text-base font-bold text-foreground">{employee.name || '未命名'}</Text>
                                <View className={`px-2 py-1 rounded-full ${statusBadge.bgColor}`}>
                                  <Text className={`text-xs font-bold ${statusBadge.textColor}`}>
                                    {statusBadge.text}
                                  </Text>
                                </View>
                              </View>
                              <Text className="text-xs text-muted-foreground">{employee.phone || '无手机号'}</Text>
                            </View>
                          </View>
                          <View className="i-mdi-chevron-right text-2xl text-muted-foreground flex-shrink-0" />
                        </View>

                        <View className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          <View className="flex items-center gap-1">
                            <View className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                              <View className="i-mdi-office-building text-sm text-blue-600" />
                            </View>
                            <Text>{employee.department || '未分配'}</Text>
                          </View>
                          <View className="flex items-center gap-1">
                            <View className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                              <View className="i-mdi-briefcase text-sm text-blue-600" />
                            </View>
                            <Text>{employee.position || '未设置'}</Text>
                          </View>
                        </View>

                        {employee.monthly_salary && (
                          <View className="bg-blue-100 rounded-lg px-3 py-2">
                            <Text className="text-xs text-foreground">
                              <Text className="font-bold">月薪：</Text>¥{employee.monthly_salary}
                            </Text>
                          </View>
                        )}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
