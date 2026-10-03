/**
 * 权限管理页面
 * 管理员可以配置员工的功能模块访问权限
 */

import {Button, Checkbox, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getEmployeesByTenantId} from '@/db/api'
import {
  applyPositionTemplateToEmployee,
  batchSetEmployeePermissions,
  batchSetPositionTemplate,
  getEmployeePermissions,
  getFunctionModuleTree,
  getPositionTemplatesByName,
  getTenantPositionNames
} from '@/db/api-permission'
import type {Employee} from '@/db/types'
import type {BatchPermissionSetting, FunctionModuleTree} from '@/db/types-permission'
import {useTenantStore} from '@/store/tenant'

type TabType = 'employee' | 'position'

const PermissionManagement: React.FC = () => {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [activeTab, setActiveTab] = useState<TabType>('employee')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [positions, setPositions] = useState<string[]>([])
  const [modules, setModules] = useState<FunctionModuleTree[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<string>('')
  const [permissions, setPermissions] = useState<Map<string, BatchPermissionSetting>>(new Map())
  const [loading, setLoading] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant) {
      console.log('=== 权限管理：没有当前租户 ===')
      return
    }

    try {
      console.log('=== 权限管理：开始加载数据 ===', {tenantId: currentTenant.id})
      setLoading(true)

      console.log('=== 权限管理：加载员工列表 ===')
      const employeeList = await getEmployeesByTenantId(currentTenant.id)
      console.log('=== 权限管理：员工列表加载完成 ===', {员工数量: employeeList.length})

      console.log('=== 权限管理：加载功能模块树 ===')
      const moduleTree = await getFunctionModuleTree()
      console.log('=== 权限管理：功能模块树加载完成 ===', {模块数量: moduleTree.length})

      console.log('=== 权限管理：加载岗位列表 ===')
      const positionList = await getTenantPositionNames(currentTenant.id)
      console.log('=== 权限管理：岗位列表加载完成 ===', {岗位数量: positionList.length})

      setEmployees(employeeList)
      setModules(moduleTree)
      setPositions(positionList)

      console.log('=== 权限管理：数据加载成功 ===')
    } catch (error) {
      console.error('=== 权限管理：加载数据失败 ===', error)
      Taro.showToast({
        title: `加载失败: ${error instanceof Error ? error.message : '未知错误'}`,
        icon: 'none',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant])

  useDidShow(() => {
    loadData()
  })

  // 加载员工权限
  const loadEmployeePermissions = useCallback(async (employee: Employee) => {
    try {
      setLoading(true)
      const perms = await getEmployeePermissions(employee.id)
      const permMap = new Map<string, BatchPermissionSetting>()

      for (const perm of perms) {
        permMap.set(perm.module_id, {
          module_id: perm.module_id,
          can_view: perm.can_view,
          can_edit: perm.can_edit,
          can_delete: perm.can_delete
        })
      }

      setPermissions(permMap)
      setSelectedEmployee(employee)
    } catch (error) {
      console.error('加载员工权限失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // 加载岗位权限模板
  const loadPositionTemplate = useCallback(
    async (positionName: string) => {
      if (!currentTenant) return

      try {
        setLoading(true)
        const templates = await getPositionTemplatesByName(currentTenant.id, positionName)
        const permMap = new Map<string, BatchPermissionSetting>()

        for (const template of templates) {
          permMap.set(template.module_id, {
            module_id: template.module_id,
            can_view: template.can_view,
            can_edit: template.can_edit,
            can_delete: template.can_delete
          })
        }

        setPermissions(permMap)
        setSelectedPosition(positionName)
      } catch (error) {
        console.error('加载岗位模板失败:', error)
        Taro.showToast({
          title: '加载失败',
          icon: 'error'
        })
      } finally {
        setLoading(false)
      }
    },
    [currentTenant]
  )

  // 切换权限
  const togglePermission = (moduleId: string, permType: 'view' | 'edit' | 'delete') => {
    const newPermissions = new Map(permissions)
    const current = newPermissions.get(moduleId) || {
      module_id: moduleId,
      can_view: false,
      can_edit: false,
      can_delete: false
    }

    if (permType === 'view') {
      current.can_view = !current.can_view
      // 如果取消查看权限，也取消编辑和删除权限
      if (!current.can_view) {
        current.can_edit = false
        current.can_delete = false
      }
    } else if (permType === 'edit') {
      current.can_edit = !current.can_edit
      // 如果开启编辑权限，自动开启查看权限
      if (current.can_edit) {
        current.can_view = true
      }
    } else if (permType === 'delete') {
      current.can_delete = !current.can_delete
      // 如果开启删除权限，自动开启查看权限
      if (current.can_delete) {
        current.can_view = true
      }
    }

    newPermissions.set(moduleId, current)
    setPermissions(newPermissions)
  }

  // 切换模块展开/收起
  const toggleModuleExpand = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  // 全部展开
  const expandAll = () => {
    const allModuleIds = new Set<string>()
    const collectModuleIds = (moduleList: FunctionModuleTree[]) => {
      for (const module of moduleList) {
        if (module.children && module.children.length > 0) {
          allModuleIds.add(module.id)
          collectModuleIds(module.children)
        }
      }
    }
    collectModuleIds(modules)
    setExpandedModules(allModuleIds)
  }

  // 全部收起
  const collapseAll = () => {
    setExpandedModules(new Set())
  }

  // 全选所有权限
  const selectAllPermissions = () => {
    const newPermissions = new Map<string, BatchPermissionSetting>()
    const collectAllModules = (moduleList: FunctionModuleTree[]) => {
      for (const module of moduleList) {
        newPermissions.set(module.id, {
          module_id: module.id,
          can_view: true,
          can_edit: true,
          can_delete: true
        })
        if (module.children && module.children.length > 0) {
          collectAllModules(module.children)
        }
      }
    }
    collectAllModules(modules)
    setPermissions(newPermissions)
    Taro.showToast({title: '已全选所有权限', icon: 'success', duration: 1500})
  }

  // 取消所有权限
  const clearAllPermissions = () => {
    setPermissions(new Map())
    Taro.showToast({title: '已清除所有权限', icon: 'success', duration: 1500})
  }

  // 保存员工权限
  const saveEmployeePermissions = async () => {
    if (!currentTenant || !selectedEmployee) {
      Taro.showToast({
        title: '请选择员工',
        icon: 'none'
      })
      return
    }

    try {
      setLoading(true)
      const permList = Array.from(permissions.values())
      await batchSetEmployeePermissions(currentTenant.id, selectedEmployee.id, permList)

      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 保存岗位权限模板
  const savePositionTemplate = async () => {
    if (!currentTenant || !selectedPosition) {
      Taro.showToast({
        title: '请选择岗位',
        icon: 'none'
      })
      return
    }

    try {
      setLoading(true)
      const permList = Array.from(permissions.values())
      await batchSetPositionTemplate(currentTenant.id, selectedPosition, permList)

      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({
        title: '保存失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 应用岗位模板到员工
  const applyTemplateToEmployee = async () => {
    if (!currentTenant || !selectedEmployee || !selectedPosition) {
      Taro.showToast({
        title: '请先选择员工和岗位',
        icon: 'none'
      })
      return
    }

    const res = await Taro.showModal({
      title: '确认应用',
      content: `确定要将"${selectedPosition}"岗位的权限模板应用到"${selectedEmployee.name}"吗？这将覆盖该员工的现有权限。`
    })

    if (!res.confirm) return

    try {
      setLoading(true)
      await applyPositionTemplateToEmployee(currentTenant.id, selectedEmployee.id, selectedPosition)

      Taro.showToast({
        title: '应用成功',
        icon: 'success'
      })

      // 重新加载员工权限
      loadEmployeePermissions(selectedEmployee)
    } catch (error) {
      console.error('应用失败:', error)
      Taro.showToast({
        title: '应用失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 渲染模块权限复选框
  const renderModulePermissions = (module: FunctionModuleTree, level = 0) => {
    const perm = permissions.get(module.id)
    const hasPermission = !!perm
    const hasChildren = module.children && module.children.length > 0
    const isExpanded = expandedModules.has(module.id)

    return (
      <View key={module.id}>
        <View className={`flex items-center justify-between py-3 ${level > 0 ? 'pl-8' : ''}`}>
          <View className="flex items-center gap-2 flex-1">
            {/* 展开/收起图标 */}
            {hasChildren && (
              <View
                className={`${isExpanded ? 'i-mdi-chevron-down' : 'i-mdi-chevron-right'} text-lg text-muted-foreground`}
                onClick={() => toggleModuleExpand(module.id)}
              />
            )}
            {!hasChildren && <View className="w-6" />}

            {module.icon && <View className={`${module.icon} text-lg text-indigo-500`} />}
            <Text className="text-sm text-foreground">{module.module_name}</Text>
          </View>

          <View className="flex items-center gap-3">
            <View className="flex items-center gap-1">
              <Checkbox
                value="view"
                checked={perm?.can_view || false}
                onClick={() => togglePermission(module.id, 'view')}
                className="scale-75"
              />
              <Text className="text-xs text-muted-foreground">查看</Text>
            </View>

            <View className="flex items-center gap-1">
              <Checkbox
                value="edit"
                checked={perm?.can_edit || false}
                onClick={() => togglePermission(module.id, 'edit')}
                disabled={!hasPermission || !perm?.can_view}
                className="scale-75"
              />
              <Text
                className={`text-xs ${!hasPermission || !perm?.can_view ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                编辑
              </Text>
            </View>

            <View className="flex items-center gap-1">
              <Checkbox
                value="delete"
                checked={perm?.can_delete || false}
                onClick={() => togglePermission(module.id, 'delete')}
                disabled={!hasPermission || !perm?.can_view}
                className="scale-75"
              />
              <Text
                className={`text-xs ${!hasPermission || !perm?.can_view ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                删除
              </Text>
            </View>
          </View>
        </View>

        {hasChildren && isExpanded && (
          <View className="border-l-2 border-gray-200 ml-4">
            {module.children.map((child) => renderModulePermissions(child, level + 1))}
          </View>
        )}
      </View>
    )
  }

  if (!currentTenant) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center mx-4">
          <View className="i-mdi-alert-circle-outline text-6xl text-indigo-500 mx-auto mb-4" />
          <Text className="text-base text-foreground block mb-2">请先选择租户</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen bg-transparent">
        <View className="p-4">
          {/* 头部说明 */}
          <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
            <View className="flex items-center gap-3 mb-2">
              <View className="i-mdi-shield-account text-2xl text-indigo-500" />
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground block mb-1">权限管理</Text>
                <Text className="text-xs text-muted-foreground block">配置员工的功能模块访问权限</Text>
              </View>
            </View>
          </View>

          {/* 标签页切换 */}
          <View className="bg-white rounded-xl p-2 mb-4 shadow-sm flex gap-2 border-2 border-gray-200">
            <Button
              className={`flex-1 py-2 rounded-lg text-sm break-keep ${
                activeTab === 'employee' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
              }`}
              size="default"
              onClick={() => {
                setActiveTab('employee')
                setSelectedEmployee(null)
                setPermissions(new Map())
              }}>
              员工权限
            </Button>
            <Button
              className={`flex-1 py-2 rounded-lg text-sm break-keep ${
                activeTab === 'position' ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
              }`}
              size="default"
              onClick={() => {
                setActiveTab('position')
                setSelectedPosition('')
                setPermissions(new Map())
              }}>
              岗位模板
            </Button>
          </View>

          {/* 员工权限配置 */}
          {activeTab === 'employee' && (
            <View>
              {/* 员工选择 */}
              <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <Text className="text-sm font-bold text-foreground mb-3">选择员工</Text>
                {employees.length === 0 ? (
                  <Text className="text-sm text-muted-foreground text-center py-4">暂无员工</Text>
                ) : (
                  <View className="flex flex-wrap gap-2">
                    {employees.map((emp) => (
                      <Button
                        key={emp.id}
                        className={`px-4 py-2 rounded-lg text-sm break-keep ${
                          selectedEmployee?.id === emp.id ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
                        }`}
                        size="default"
                        onClick={() => loadEmployeePermissions(emp)}>
                        {emp.name}
                      </Button>
                    ))}
                  </View>
                )}
              </View>

              {/* 岗位模板应用 */}
              {selectedEmployee && positions.length > 0 && (
                <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <Text className="text-sm font-bold text-foreground mb-3">快速应用岗位模板</Text>
                  <View className="flex flex-wrap gap-2">
                    {positions.map((pos) => (
                      <Button
                        key={pos}
                        className="px-4 py-2 rounded-lg text-sm break-keep bg-blue-100 text-white"
                        size="default"
                        onClick={() => {
                          setSelectedPosition(pos)
                          applyTemplateToEmployee()
                        }}>
                        {pos}
                      </Button>
                    ))}
                  </View>
                </View>
              )}

              {/* 权限配置 */}
              {selectedEmployee && (
                <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <View className="flex items-center justify-between mb-3">
                    <Text className="text-sm font-bold text-foreground">功能权限配置</Text>

                    {/* 快捷操作按钮 */}
                    <View className="flex gap-2">
                      <Button
                        className="px-3 py-1 rounded text-xs break-keep bg-blue-100 text-white"
                        size="mini"
                        onClick={expandAll}>
                        全部展开
                      </Button>
                      <Button
                        className="px-3 py-1 rounded text-xs break-keep bg-muted text-muted-foreground"
                        size="mini"
                        onClick={collapseAll}>
                        全部收起
                      </Button>
                      <Button
                        className="px-3 py-1 rounded text-xs break-keep bg-blue-100 text-muted-foreground"
                        size="mini"
                        onClick={selectAllPermissions}>
                        全选
                      </Button>
                      <Button
                        className="px-3 py-1 rounded text-xs break-keep bg-blue-100 text-red-600"
                        size="mini"
                        onClick={clearAllPermissions}>
                        清空
                      </Button>
                    </View>
                  </View>

                  <View className="space-y-2">{modules.map((module) => renderModulePermissions(module))}</View>

                  <View className="mt-4">
                    <Button
                      className="w-full bg-blue-100 text-white py-3 rounded-lg text-sm break-keep"
                      size="default"
                      onClick={saveEmployeePermissions}
                      disabled={loading}>
                      保存权限
                    </Button>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* 岗位模板配置 */}
          {activeTab === 'position' && (
            <View>
              {/* 岗位选择 */}
              <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
                <Text className="text-sm font-bold text-foreground mb-3">选择岗位</Text>
                {positions.length === 0 ? (
                  <Text className="text-sm text-muted-foreground text-center py-4">暂无岗位模板</Text>
                ) : (
                  <View className="flex flex-wrap gap-2">
                    {positions.map((pos) => (
                      <Button
                        key={pos}
                        className={`px-4 py-2 rounded-lg text-sm break-keep ${
                          selectedPosition === pos ? 'bg-blue-100 text-white' : 'bg-muted text-muted-foreground'
                        }`}
                        size="default"
                        onClick={() => loadPositionTemplate(pos)}>
                        {pos}
                      </Button>
                    ))}
                  </View>
                )}
              </View>

              {/* 权限配置 */}
              {selectedPosition && (
                <View className="bg-white rounded-xl p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <View className="flex items-center justify-between mb-3">
                    <Text className="text-sm font-bold text-foreground">功能权限配置</Text>

                    {/* 快捷操作按钮 */}
                    <View className="flex gap-2">
                      <Button
                        className="px-3 py-1 rounded text-xs break-keep bg-blue-100 text-white"
                        size="mini"
                        onClick={expandAll}>
                        全部展开
                      </Button>
                      <Button
                        className="px-3 py-1 rounded text-xs break-keep bg-muted text-muted-foreground"
                        size="mini"
                        onClick={collapseAll}>
                        全部收起
                      </Button>
                      <Button
                        className="px-3 py-1 rounded text-xs break-keep bg-blue-100 text-muted-foreground"
                        size="mini"
                        onClick={selectAllPermissions}>
                        全选
                      </Button>
                      <Button
                        className="px-3 py-1 rounded text-xs break-keep bg-blue-100 text-red-600"
                        size="mini"
                        onClick={clearAllPermissions}>
                        清空
                      </Button>
                    </View>
                  </View>

                  <View className="space-y-2">{modules.map((module) => renderModulePermissions(module))}</View>

                  <View className="mt-4">
                    <Button
                      className="w-full bg-blue-100 text-white py-3 rounded-lg text-sm break-keep"
                      size="default"
                      onClick={savePositionTemplate}
                      disabled={loading}>
                      保存模板
                    </Button>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

export default PermissionManagement
