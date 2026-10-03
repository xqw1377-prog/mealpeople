import {Button, Input, Picker, ScrollView, Text, View} from '@tarojs/components'
import Taro, {navigateTo, showModal, showToast, useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {EmptyEmployees, EmptySearchResults} from '@/components/EmptyState'
import {SkeletonList} from '@/components/Skeleton'
import {deleteEmployee, getEmployeesByStoreId} from '@/db/api'
import type {Employee} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const Employees: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore) // 使用全局门店
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')

  // 筛选条件（删除门店筛选）
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [typeIndex, setTypeIndex] = useState(0)
  const [departmentIndex, setDepartmentIndex] = useState(0)

  const loadData = useCallback(async () => {
    if (!currentTenant) {
      navigateTo({url: '/pages/tenant-select/index'})
      return
    }

    if (!currentStore) {
      console.log('=== 等待门店选择 ===')
      showToast({title: '请先在首页选择门店', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      console.log('========== 加载员工列表 ==========')
      console.log('租户ID:', currentTenant.id)
      console.log('门店ID:', currentStore.id)
      console.log('门店名称:', currentStore.name)

      const employeesData = await getEmployeesByStoreId(currentStore.id)

      console.log('========== 员工列表加载完成 ==========')
      console.log('总员工数:', employeesData.length)
      console.log('正式员工:', employeesData.filter((e) => e.employee_type === 'full_time').length)
      console.log('兼职员工:', employeesData.filter((e) => e.employee_type === 'part_time').length)
      console.log(
        '员工列表:',
        employeesData.map((e) => ({
          name: e.name,
          type: e.employee_type,
          department: e.department
        }))
      )

      setEmployees(employeesData)
      setFilteredEmployees(employeesData)
    } catch (error) {
      console.error('❌ 加载员工列表失败:', error)
      showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, currentStore])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 🔥 监听门店切换事件
  useEffect(() => {
    const handleStoreChange = (data: any) => {
      console.log('=== 员工管理收到门店切换事件 ===', data)
      // 重新加载数据
      loadData()
    }

    Taro.eventCenter.on('storeChanged', handleStoreChange)

    return () => {
      Taro.eventCenter.off('storeChanged', handleStoreChange)
    }
  }, [loadData])

  useDidShow(() => {
    loadData()
  })

  // 下拉刷新处理
  const handleRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await loadData()
      setTimeout(() => {
        setRefreshing(false)
        showToast({title: '刷新成功', icon: 'success', duration: 1500})
      }, 500)
    } catch (_error) {
      setRefreshing(false)
      showToast({title: '刷新失败', icon: 'error'})
    }
  }

  // 应用筛选和搜索
  const displayEmployees = useMemo(() => {
    let filtered = [...employees]

    // 按员工类型筛选
    if (selectedType !== 'all') {
      filtered = filtered.filter((emp) => emp.employee_type === selectedType)
    }

    // 按部门筛选
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter((emp) => emp.department === selectedDepartment)
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim()
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(keyword) ||
          emp.phone?.toLowerCase().includes(keyword) ||
          emp.department?.toLowerCase().includes(keyword) ||
          emp.position?.toLowerCase().includes(keyword)
      )
    }

    return filtered
  }, [employees, selectedType, selectedDepartment, searchKeyword])

  // 清空搜索
  const handleClearSearch = () => {
    setSearchKeyword('')
  }

  // 同步 filteredEmployees（保持兼容性）
  useEffect(() => {
    setFilteredEmployees(displayEmployees)
  }, [displayEmployees])

  const handleTypeChange = useCallback((e: any) => {
    const index = Number(e.detail.value)
    setTypeIndex(index)
    const typeValues = ['all', 'full_time', 'part_time']
    setSelectedType(typeValues[index])
  }, [])

  const handleDepartmentChange = useCallback((e: any) => {
    const index = Number(e.detail.value)
    setDepartmentIndex(index)
    const departmentValues = ['all', 'front_hall', 'kitchen']
    setSelectedDepartment(departmentValues[index])
  }, [])

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      const result = await showModal({
        title: '确认删除',
        content: `确定要删除员工"${name}"吗？`,
        confirmText: '删除',
        cancelText: '取消'
      })

      if (result.confirm) {
        const success = await deleteEmployee(id)
        if (success) {
          showToast({title: '删除成功', icon: 'success'})
          loadData()
        } else {
          showToast({title: '删除失败', icon: 'none'})
        }
      }
    },
    [loadData]
  )

  // 下载Excel模板
  const handleDownloadTemplate = useCallback(() => {
    showModal({
      title: 'Excel模板说明',
      content:
        '模板包含以下字段：\n\n必填字段：\n• 姓名\n• 员工类型（全职/兼职）\n• 部门（前厅/后厨）\n• 手机号\n\n可选字段：\n• 职位\n• 入职日期\n• 基础工资\n• 备注\n\n请按照模板格式填写数据后导入',
      confirmText: '我知道了',
      showCancel: false
    })

    // TODO: 实际下载模板文件
    // 这里可以生成一个示例Excel文件供用户下载
  }, [])

  if (!currentTenant) {
    return null
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView
        scrollY
        className="h-screen bg-transparent"
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={handleRefresh}>
        <View className="p-4">
          <View className="flex items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-foreground block mb-1">员工管理</Text>
              <Text className="text-sm text-muted-foreground block">
                共 {filteredEmployees.length} 名员工{filteredEmployees.length !== employees.length && ` (已筛选)`}
              </Text>
            </View>
            <View className="flex gap-2 flex-wrap justify-end">
              <Button
                className="bg-green-500 text-white rounded-xl text-xs break-keep"
                size="mini"
                onClick={() => navigateTo({url: '/packageH/pages/onboarding-list/index'})}>
                📝 入职
              </Button>
              <Button
                className="bg-orange-500 text-white rounded-xl text-xs break-keep"
                size="mini"
                onClick={() => navigateTo({url: '/packageH/pages/resignation-list/index'})}>
                👋 离职
              </Button>
              <Button
                className="bg-blue-100 text-white rounded-xl text-xs break-keep"
                size="mini"
                onClick={() => navigateTo({url: '/packageA/pages/temp-workers/index'})}>
                👷 临时工
              </Button>
              <Button
                className="bg-blue-100 text-white rounded-xl text-xs break-keep"
                size="mini"
                onClick={handleDownloadTemplate}>
                📥 模板
              </Button>
              <Button
                className="bg-blue-100 text-white rounded-xl text-xs break-keep"
                size="mini"
                onClick={() => navigateTo({url: '/packageA/pages/employee-import/index'})}>
                📂 导入
              </Button>
              <Button
                className="bg-blue-100 text-white rounded-xl text-xs break-keep"
                size="mini"
                onClick={() => navigateTo({url: '/packageA/pages/employee-form/index'})}>
                ➕ 添加
              </Button>
            </View>
          </View>

          {/* 当前门店显示 */}
          {currentStore && (
            <View className="mb-4 bg-blue-100 rounded-xl p-3 shadow-sm">
              <View className="flex items-center gap-2">
                <View className="i-mdi-store text-base text-muted-foreground"></View>
                <Text className="text-sm font-semibold text-foreground">当前门店：</Text>
                <Text className="text-sm font-bold text-muted-foreground">{currentStore.name}</Text>
              </View>
            </View>
          )}

          {/* 搜索框 */}
          <View className="mb-4">
            <View className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-sm flex flex-row items-center">
              <View className="i-mdi-magnify text-xl text-muted-foreground mr-2" />
              <View className="flex-1" style={{overflow: 'hidden'}}>
                <Input
                  className="text-sm text-foreground"
                  placeholder="搜索员工姓名、手机号、部门、职位..."
                  value={searchKeyword}
                  onInput={(e) => setSearchKeyword(e.detail.value)}
                />
              </View>
              {searchKeyword && (
                <View className="i-mdi-close-circle text-xl text-muted-foreground ml-2" onClick={handleClearSearch} />
              )}
            </View>
            {searchKeyword && (
              <Text className="text-xs text-muted-foreground mt-2">找到 {displayEmployees.length} 名员工</Text>
            )}
          </View>

          {/* 筛选器（删除门店筛选） */}
          <View className="mb-4 space-y-2">
            {/* 员工类型筛选 */}
            <Picker mode="selector" range={['全部类型', '全职', '兼职']} value={typeIndex} onChange={handleTypeChange}>
              <View className="bg-white rounded-xl p-3 border-2 border-gray-200 flex items-center justify-between shadow-sm">
                <View className="flex items-center gap-2">
                  <View className="i-mdi-account-group text-base text-blue-500"></View>
                  <Text className="text-sm text-foreground">{['全部类型', '全职', '兼职'][typeIndex]}</Text>
                </View>
                <View className="i-mdi-chevron-down text-base text-muted-foreground"></View>
              </View>
            </Picker>

            {/* 部门筛选 */}
            <Picker
              mode="selector"
              range={['全部部门', '前厅', '后厨']}
              value={departmentIndex}
              onChange={handleDepartmentChange}>
              <View className="bg-white rounded-xl p-3 border-2 border-gray-200 flex items-center justify-between shadow-sm">
                <View className="flex items-center gap-2">
                  <View className="i-mdi-office-building text-base text-green-500"></View>
                  <Text className="text-sm text-foreground">{['全部部门', '前厅', '后厨'][departmentIndex]}</Text>
                </View>
                <View className="i-mdi-chevron-down text-base text-muted-foreground"></View>
              </View>
            </Picker>
          </View>

          {loading ? (
            <View className="px-4">
              <SkeletonList count={5} />
            </View>
          ) : filteredEmployees.length === 0 ? (
            searchKeyword || selectedType !== 'all' || selectedDepartment !== 'all' ? (
              <EmptySearchResults keyword={searchKeyword} />
            ) : (
              <EmptyEmployees
                onAction={() => {
                  navigateTo({url: '/packageA/pages/employee-form/index'})
                }}
              />
            )
          ) : (
            <View className="space-y-3">
              {filteredEmployees.map((employee) => (
                <View key={employee.id} className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-base font-bold text-foreground block">{employee.name}</Text>
                    <View className="flex items-center gap-2">
                      <View
                        className={`px-3 py-1 rounded-full ${
                          employee.department === 'front_hall' ? 'bg-blue-100' : 'bg-blue-100'
                        }`}>
                        <Text
                          className={`text-xs ${
                            employee.department === 'front_hall' ? 'text-muted-foreground' : 'text-muted-foreground'
                          }`}>
                          {employee.department === 'front_hall' ? '前厅' : '后厨'}
                        </Text>
                      </View>
                      <View
                        className={`px-3 py-1 rounded-full ${
                          employee.employee_type === 'full_time' ? 'bg-blue-100' : 'bg-blue-100'
                        }`}>
                        <Text
                          className={`text-xs ${
                            employee.employee_type === 'full_time' ? 'text-muted-foreground' : 'text-muted-foreground'
                          }`}>
                          {employee.employee_type === 'full_time' ? '正式' : '兼职'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {employee.phone && <Text className="text-sm text-muted-foreground block mb-1">{employee.phone}</Text>}
                  {employee.position && (
                    <Text className="text-xs text-muted-foreground block mb-3">{employee.position}</Text>
                  )}

                  {/* 操作按钮 */}
                  <View className="flex items-center gap-2 pt-3 border-t border-border">
                    <View
                      className="flex-1 bg-blue-100 text-white rounded-xl py-2 flex items-center justify-center gap-1"
                      onClick={() => navigateTo({url: `/packageA/pages/employee-form/index?id=${employee.id}`})}>
                      <View className="i-mdi-pencil text-base"></View>
                      <Text className="text-sm font-medium text-muted-foreground">编辑</Text>
                    </View>
                    <View
                      className="flex-1 bg-blue-100 text-red-600 rounded-xl py-2 flex items-center justify-center gap-1"
                      onClick={() => handleDelete(employee.id, employee.name)}>
                      <View className="i-mdi-delete text-base"></View>
                      <Text className="text-sm font-medium text-red-600">删除</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default Employees
