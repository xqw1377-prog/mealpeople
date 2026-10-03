/**
 * 员工列表管理页面
 *
 * 功能：
 * - 查看租户下所有员工列表
 * - 按部门、职位筛选员工
 * - 搜索员工
 * - 查看员工详细档案
 * - 快速统计员工数据
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

// 员工统计类型
interface EmployeeStatistics {
  total: number
  byDepartment: {[key: string]: number}
  byStatus: {[key: string]: number}
}

export default function EmployeeListPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [statistics, setStatistics] = useState<EmployeeStatistics | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterDepartment, setFilterDepartment] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // 部门选项
  const departmentOptions = ['全部', '前厅', '后厨']
  const [departmentIndex, setDepartmentIndex] = useState(0)

  // 状态选项
  const statusOptions = ['全部', '在职', '离职', '试用期']
  const [statusIndex, setStatusIndex] = useState(0)

  // 加载员工列表
  const loadEmployees = useCallback(async () => {
    if (!currentTenant) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 检查权限
      const currentEmployee = await getEmployeeByUserId(user?.id)
      if (!currentEmployee) {
        Taro.showToast({title: '无权限访问', icon: 'none'})
        setLoading(false)
        return
      }

      // 获取租户下所有员工
      const {data: employeeList, error} = await supabase
        .from('employees')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .order('created_at', {ascending: false})

      if (error) throw error

      setEmployees(employeeList || [])
      setFilteredEmployees(employeeList || [])

      // 计算统计数据
      const stats: EmployeeStatistics = {
        total: employeeList?.length || 0,
        byDepartment: {},
        byStatus: {}
      }

      employeeList?.forEach((emp) => {
        // 按部门统计
        const dept = emp.department || '未分配'
        stats.byDepartment[dept] = (stats.byDepartment[dept] || 0) + 1

        // 按状态统计
        const status = emp.status || '未知'
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1
      })

      setStatistics(stats)
    } catch (error) {
      console.error('加载员工列表失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useDidShow(() => {
    loadEmployees()
  })

  // 刷新数据
  const handleRefresh = () => {
    Taro.showLoading({title: '刷新中...'})
    loadEmployees().finally(() => {
      Taro.hideLoading()
      Taro.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    })
  }

  // 筛选员工
  const filterEmployees = useCallback(() => {
    let filtered = [...employees]

    // 按搜索关键词筛选
    if (searchKeyword) {
      filtered = filtered.filter(
        (emp) =>
          emp.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          emp.phone?.includes(searchKeyword) ||
          emp.position?.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    }

    // 按部门筛选
    if (filterDepartment !== 'all') {
      filtered = filtered.filter((emp) => emp.department === filterDepartment)
    }

    // 按状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter((emp) => emp.status === filterStatus)
    }

    setFilteredEmployees(filtered)
  }, [employees, searchKeyword, filterDepartment, filterStatus])

  // 监听筛选条件变化
  useCallback(() => {
    filterEmployees()
  }, [filterEmployees])()

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    filterEmployees()
  }

  // 处理部门筛选
  const handleDepartmentChange = (e: any) => {
    const index = e.detail.value
    setDepartmentIndex(index)
    const dept = index === 0 ? 'all' : departmentOptions[index]
    setFilterDepartment(dept)
    filterEmployees()
  }

  // 处理状态筛选
  const handleStatusChange = (e: any) => {
    const index = e.detail.value
    setStatusIndex(index)
    const status = index === 0 ? 'all' : statusOptions[index]
    setFilterStatus(status)
    filterEmployees()
  }

  // 查看员工详情
  const handleViewProfile = (employeeId: string) => {
    Taro.navigateTo({url: `/pages/employee-profile/index?id=${employeeId}`})
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '在职':
        return 'bg-green-100 text-green-700'
      case '离职':
        return 'bg-gray-100 text-gray-700'
      case '试用期':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #f0f9ff, #e0f2fe)'}}>
      {/* 头部 */}
      <View className="bg-primary text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">员工列表</Text>
            <Text className="text-sm opacity-90 block">管理租户下所有员工</Text>
          </View>
          <View className="flex items-center gap-3">
            {/* 刷新按钮 */}
            <View
              className="w-10 h-10 rounded-lg bg-white bg-opacity-20 flex items-center justify-center active:opacity-70"
              onClick={handleRefresh}>
              <View className="i-mdi-refresh text-xl text-white" />
            </View>
            <View className="i-mdi-account-group text-5xl opacity-20"></View>
          </View>
        </View>

        {/* 统计卡片 */}
        {statistics && (
          <View className="bg-white bg-opacity-20 rounded-xl p-4">
            <View className="flex items-center justify-between">
              <View className="text-center flex-1">
                <Text className="text-3xl font-bold block mb-1">{statistics.total}</Text>
                <Text className="text-xs opacity-90 block">总员工数</Text>
              </View>
              <View className="w-px h-12 bg-white bg-opacity-30"></View>
              <View className="text-center flex-1">
                <Text className="text-3xl font-bold block mb-1">{statistics.byDepartment.前厅 || 0}</Text>
                <Text className="text-xs opacity-90 block">前厅</Text>
              </View>
              <View className="w-px h-12 bg-white bg-opacity-30"></View>
              <View className="text-center flex-1">
                <Text className="text-3xl font-bold block mb-1">{statistics.byDepartment.后厨 || 0}</Text>
                <Text className="text-xs opacity-90 block">后厨</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 搜索和筛选 */}
          <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
            {/* 搜索框 */}
            <View className="mb-3" style={{overflow: 'hidden'}}>
              <Input
                className="bg-gray-100 text-foreground px-4 py-3 rounded-xl w-full"
                value={searchKeyword}
                onInput={(e) => handleSearch(e.detail.value)}
                placeholder="搜索员工姓名、手机号、职位"
              />
            </View>

            {/* 筛选器 */}
            <View className="flex items-center gap-3">
              {/* 部门筛选 */}
              <Picker
                mode="selector"
                range={departmentOptions}
                value={departmentIndex}
                onChange={handleDepartmentChange}>
                <View className="flex-1 bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                  <View className="flex flex-row items-center">
                    <View className="i-mdi-office-building text-lg text-muted-foreground mr-2"></View>
                    <Text className="text-sm text-foreground">{departmentOptions[departmentIndex]}</Text>
                  </View>
                  <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                </View>
              </Picker>

              {/* 状态筛选 */}
              <Picker mode="selector" range={statusOptions} value={statusIndex} onChange={handleStatusChange}>
                <View className="flex-1 bg-gray-100 rounded-xl px-4 py-3 flex flex-row items-center justify-between">
                  <View className="flex flex-row items-center">
                    <View className="i-mdi-account-check text-lg text-muted-foreground mr-2"></View>
                    <Text className="text-sm text-foreground">{statusOptions[statusIndex]}</Text>
                  </View>
                  <View className="i-mdi-chevron-down text-lg text-muted-foreground"></View>
                </View>
              </Picker>
            </View>
          </View>

          {/* 员工列表 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-3 block">共 {filteredEmployees.length} 名员工</Text>
            {filteredEmployees.map((employee) => (
              <View
                key={employee.id}
                onClick={() => handleViewProfile(employee.id)}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm active:scale-98 transition-transform">
                <View className="flex items-center justify-between">
                  <View className="flex items-center flex-1">
                    {/* 头像 */}
                    <View className="w-12 h-12 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center mr-3">
                      <Text className="text-white text-lg font-bold">{employee.name?.charAt(0) || 'U'}</Text>
                    </View>

                    {/* 员工信息 */}
                    <View className="flex-1">
                      <View className="flex items-center mb-1">
                        <Text className="text-base font-bold text-foreground mr-2">{employee.name || '未命名'}</Text>
                        <View className={`px-2 py-0.5 rounded-full ${getStatusColor(employee.status)}`}>
                          <Text className="text-xs font-medium">{employee.status}</Text>
                        </View>
                      </View>
                      <View className="flex items-center">
                        <View className="i-mdi-office-building text-sm text-muted-foreground mr-1"></View>
                        <Text className="text-sm text-muted-foreground mr-3">{employee.department || '未分配'}</Text>
                        <View className="i-mdi-briefcase text-sm text-muted-foreground mr-1"></View>
                        <Text className="text-sm text-muted-foreground">{employee.position || '未分配'}</Text>
                      </View>
                    </View>
                  </View>

                  {/* 箭头 */}
                  <View className="i-mdi-chevron-right text-2xl text-muted-foreground"></View>
                </View>
              </View>
            ))}
          </View>

          {/* 空状态 */}
          {filteredEmployees.length === 0 && (
            <View className="text-center py-12">
              <View className="i-mdi-account-off text-6xl text-muted-foreground mb-4"></View>
              <Text className="text-muted-foreground text-base block">暂无员工数据</Text>
              <Text className="text-muted-foreground text-sm block mt-2">请调整筛选条件或添加新员工</Text>
            </View>
          )}

          {/* 返回按钮 */}
          <View className="mt-6">
            <View
              onClick={handleBack}
              className="bg-white border-2 border-gray-200 rounded-xl py-3 px-6 flex items-center justify-center active:bg-gray-50">
              <View className="i-mdi-arrow-left text-xl text-foreground mr-2"></View>
              <Text className="text-foreground font-medium">返回</Text>
            </View>
          </View>

          {/* 底部间距 */}
          <View className="h-6"></View>
        </View>
      )}
    </ScrollView>
  )
}
