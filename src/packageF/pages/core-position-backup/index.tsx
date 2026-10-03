/**
 * 核心岗位顶岗配置页面
 * 配置核心岗位的顶岗人员，确保核心岗位与顶岗人员不可同休
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getEmployeesByTenantId} from '@/db/api'
import {
  createCorePositionBackup,
  deleteCorePositionBackup,
  getCorePositionBackups,
  updateCorePositionBackup
} from '@/db/api-core-position'
import type {Employee} from '@/db/types'
import type {CorePositionBackup} from '@/db/types-v2'
import {useTenantStore} from '@/store/tenant'

const CorePositionBackupPage: React.FC = () => {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [coreEmployees, setCoreEmployees] = useState<Employee[]>([])
  const [backupConfigs, setBackupConfigs] = useState<CorePositionBackup[]>([])
  const [loading, setLoading] = useState(false)

  // 配置对话框状态
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [currentCoreEmployee, setCurrentCoreEmployee] = useState<Employee | null>(null)
  const [selectedBackupIds, setSelectedBackupIds] = useState<string[]>([])
  const [noSameDayOff, setNoSameDayOff] = useState(true)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant) return

    setLoading(true)
    try {
      // 加载所有员工
      const allEmployees = await getEmployeesByTenantId(currentTenant.id)
      setEmployees(allEmployees)

      // 筛选核心岗位员工
      const core = allEmployees.filter((emp) => emp.is_core_position)
      setCoreEmployees(core)

      // 加载顶岗配置
      const configs = await getCorePositionBackups(currentTenant.id)
      setBackupConfigs(configs)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadData()
  })

  // 打开配置对话框
  const handleOpenConfig = (employee: Employee) => {
    setCurrentCoreEmployee(employee)

    // 查找现有配置
    const existingConfig = backupConfigs.find((c) => c.core_employee_id === employee.id)
    if (existingConfig) {
      setSelectedBackupIds(existingConfig.backup_employee_ids)
      setNoSameDayOff(existingConfig.no_same_day_off)
    } else {
      setSelectedBackupIds([])
      setNoSameDayOff(true)
    }

    setShowConfigDialog(true)
  }

  // 切换顶岗人员选择
  const handleToggleBackup = (employeeId: string) => {
    setSelectedBackupIds((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
    )
  }

  // 保存配置
  const handleSaveConfig = useCallback(async () => {
    if (!currentCoreEmployee || !currentTenant) return

    if (selectedBackupIds.length === 0) {
      Taro.showToast({
        title: '请选择顶岗人员',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      const existingConfig = backupConfigs.find((c) => c.core_employee_id === currentCoreEmployee.id)

      if (existingConfig) {
        // 更新现有配置
        await updateCorePositionBackup(existingConfig.id, {
          backup_employee_ids: selectedBackupIds,
          no_same_day_off: noSameDayOff
        })
      } else {
        // 创建新配置
        await createCorePositionBackup({
          tenant_id: currentTenant.id,
          store_id: currentCoreEmployee.store_id,
          core_employee_id: currentCoreEmployee.id,
          core_position: currentCoreEmployee.position,
          backup_employee_ids: selectedBackupIds,
          no_same_day_off: noSameDayOff,
          created_by: user?.id
        })
      }

      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })

      setShowConfigDialog(false)
      loadData()
    } catch (error) {
      console.error('保存配置失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentCoreEmployee, currentTenant, selectedBackupIds, noSameDayOff, user, backupConfigs, loadData])

  // 删除配置
  const handleDeleteConfig = async (configId: string) => {
    const result = await Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个顶岗配置吗？'
    })

    if (!result.confirm) return

    setLoading(true)
    try {
      await deleteCorePositionBackup(configId)
      Taro.showToast({
        title: '删除成功',
        icon: 'success'
      })
      loadData()
    } catch (error) {
      console.error('删除配置失败:', error)
      Taro.showToast({
        title: '删除失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 获取员工姓名
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId)
    return employee?.name || '未知'
  }

  // 获取可选的顶岗人员
  const getAvailableBackupEmployees = () => {
    if (!currentCoreEmployee) return []

    return employees.filter(
      (emp) => emp.id !== currentCoreEmployee.id && emp.can_backup_positions?.includes(currentCoreEmployee.position)
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          {/* 头部说明 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center gap-3 mb-2">
              <View className="i-mdi-account-switch text-2xl text-indigo-500" />
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground block mb-1">核心岗位顶岗配置</Text>
                <Text className="text-xs text-muted-foreground block">配置核心岗位的顶岗人员，确保不可同休</Text>
              </View>
            </View>
          </View>

          {/* 核心岗位列表 */}
          {loading ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-loading text-4xl text-indigo-500 animate-spin mx-auto mb-4" />
              <Text className="text-sm text-muted-foreground">加载中...</Text>
            </View>
          ) : coreEmployees.length === 0 ? (
            <View className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <View className="i-mdi-account-alert text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-base text-muted-foreground block mb-2">暂无核心岗位员工</Text>
              <Text className="text-sm text-muted-foreground block">请先在员工管理中标记核心岗位</Text>
            </View>
          ) : (
            <View className="space-y-3">
              {coreEmployees.map((employee) => {
                const config = backupConfigs.find((c) => c.core_employee_id === employee.id)

                return (
                  <View key={employee.id} className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                    {/* 核心岗位信息 */}
                    <View className="flex items-center justify-between mb-3">
                      <View className="flex-1">
                        <View className="flex items-center gap-2 mb-1">
                          <Text className="text-base font-bold text-foreground">{employee.name}</Text>
                          <View className="px-2 py-0.5 bg-red-100 rounded">
                            <Text className="text-xs text-red-600">核心岗位</Text>
                          </View>
                        </View>
                        <Text className="text-sm text-muted-foreground">{employee.position}</Text>
                      </View>
                      <Button
                        className="bg-blue-100 text-white px-4 py-2 rounded-lg text-sm break-keep"
                        size="default"
                        onClick={() => handleOpenConfig(employee)}>
                        {config ? '编辑' : '配置'}
                      </Button>
                    </View>

                    {/* 顶岗人员列表 */}
                    {config && config.backup_employee_ids.length > 0 && (
                      <View className="mt-3 pt-3 border-t border-gray-100">
                        <Text className="text-sm text-muted-foreground mb-2">顶岗人员：</Text>
                        <View className="flex flex-wrap gap-2">
                          {config.backup_employee_ids.map((backupId) => (
                            <View key={backupId} className="px-3 py-1 bg-blue-100 rounded-full">
                              <Text className="text-sm text-indigo-600">{getEmployeeName(backupId)}</Text>
                            </View>
                          ))}
                        </View>
                        {config.no_same_day_off && (
                          <View className="mt-2 flex items-center gap-1">
                            <View className="i-mdi-alert-circle text-sm text-muted-foreground" />
                            <Text className="text-xs text-muted-foreground">不可与顶岗人员同休</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* 删除按钮 */}
                    {config && (
                      <View className="mt-3 pt-3 border-t border-gray-100">
                        <Button
                          className="w-full bg-blue-100 text-red-600 py-2 rounded-lg text-sm break-keep"
                          size="default"
                          onClick={() => handleDeleteConfig(config.id)}>
                          删除配置
                        </Button>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 配置对话框 */}
      {showConfigDialog && currentCoreEmployee && (
        <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <View className="bg-white rounded-lg p-6 border-2 border-gray-200 m-4 max-w-md w-full max-h-[80vh] overflow-auto">
            <Text className="text-lg font-bold text-foreground mb-4">配置顶岗人员 - {currentCoreEmployee.name}</Text>

            {/* 顶岗人员选择 */}
            <View className="mb-4">
              <Text className="text-sm text-muted-foreground mb-2">选择顶岗人员：</Text>
              <View className="space-y-2 max-h-60 overflow-auto">
                {getAvailableBackupEmployees().map((employee) => (
                  <View
                    key={employee.id}
                    className={`p-3 rounded-lg border cursor-pointer ${
                      selectedBackupIds.includes(employee.id)
                        ? 'bg-blue-100 border-indigo-500'
                        : 'bg-muted border-gray-200'
                    }`}
                    onClick={() => handleToggleBackup(employee.id)}>
                    <View className="flex items-center justify-between">
                      <View>
                        <Text className="text-sm font-medium text-foreground">{employee.name}</Text>
                        <Text className="text-xs text-muted-foreground">{employee.position}</Text>
                      </View>
                      {selectedBackupIds.includes(employee.id) && (
                        <View className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                          <View className="i-mdi-check text-sm text-blue-600" />
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              {getAvailableBackupEmployees().length === 0 && (
                <Text className="text-sm text-muted-foreground text-center py-4">
                  暂无可选的顶岗人员，请先在员工管理中配置可顶岗岗位
                </Text>
              )}
            </View>

            {/* 不可同休开关 */}
            <View className="mb-6">
              <View
                className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer"
                onClick={() => setNoSameDayOff(!noSameDayOff)}>
                <Text className="text-sm text-foreground">不可与顶岗人员同休</Text>
                <View
                  className={`w-12 h-6 rounded-full transition-colors ${noSameDayOff ? 'bg-blue-100' : 'bg-gray-300'}`}>
                  <View
                    className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-transform ${
                      noSameDayOff ? 'ml-6' : 'ml-0.5'
                    }`}
                  />
                </View>
              </View>
              <Text className="text-xs text-muted-foreground mt-1">开启后，核心岗位与顶岗人员不能在同一天休息</Text>
            </View>

            {/* 按钮 */}
            <View className="flex gap-3">
              <Button
                className="flex-1 bg-muted text-foreground py-3 rounded-lg text-sm break-keep"
                size="default"
                onClick={() => setShowConfigDialog(false)}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white py-3 rounded-lg text-sm break-keep"
                size="default"
                onClick={handleSaveConfig}
                disabled={loading}>
                保存
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default CorePositionBackupPage
