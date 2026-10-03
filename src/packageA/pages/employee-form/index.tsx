import {Button, Input, Picker, ScrollView, Switch, Text, View} from '@tarojs/components'
import {getCurrentInstance, navigateBack, showToast} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {createEmployee, getEmployeeById, getStoresByTenantId, updateEmployee} from '@/db/api'
import {getPositionConfigs} from '@/db/api-revenue-detail'
import type {DepartmentType, PositionConfig, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const EmployeeForm: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore) // ✅ 获取当前选择的门店
  const [stores, setStores] = useState<Store[]>([])
  const [positions, setPositions] = useState<PositionConfig[]>([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    position: '',
    employee_type: 'full_time',
    department: 'front_hall' as DepartmentType,
    store_id: '',
    monthly_salary: '',
    daily_work_hours: '8',
    // 新增字段
    is_core_position: false,
    position_fixed_backup: false,
    can_backup_positions: [] as string[]
  })
  const [storeIndex, setStoreIndex] = useState(0)
  const [typeIndex, setTypeIndex] = useState(0)
  const [departmentIndex, setDepartmentIndex] = useState(0)
  const [positionIndex, setPositionIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [employeeId, setEmployeeId] = useState<string>('')

  const employeeTypes = ['正式员工', '兼职员工']
  const employeeTypeValues = ['full_time', 'part_time']
  const departments = ['前厅', '后厨']
  const departmentValues: DepartmentType[] = ['front_hall', 'kitchen']

  const loadStores = useCallback(async () => {
    if (!currentTenant) return

    try {
      const storesData = await getStoresByTenantId(currentTenant.id)
      setStores(storesData)

      // ✅ 修复：优先使用用户在首页选择的门店作为默认值
      if (currentStore && storesData.some((s) => s.id === currentStore.id)) {
        // 如果当前门店存在于门店列表中，使用它
        setFormData((prev) => ({...prev, store_id: currentStore.id}))
        const index = storesData.findIndex((s) => s.id === currentStore.id)
        if (index !== -1) {
          setStoreIndex(index)
        }
      } else if (storesData.length > 0) {
        // 否则使用第一个门店
        setFormData((prev) => ({...prev, store_id: storesData[0].id}))
        setStoreIndex(0)
      }
    } catch (error) {
      console.error('加载店铺列表失败:', error)
      showToast({title: '加载店铺失败', icon: 'none'})
    }
  }, [currentTenant, currentStore]) // ✅ 添加 currentStore 到依赖项

  const loadPositions = useCallback(async () => {
    if (!currentTenant) return

    try {
      const positionsData = await getPositionConfigs({
        tenantId: currentTenant.id,
        isActive: true
      })
      setPositions(positionsData)
    } catch (error) {
      console.error('加载岗位列表失败:', error)
      showToast({title: '加载岗位失败', icon: 'none'})
    }
  }, [currentTenant])

  const loadEmployee = useCallback(
    async (id: string) => {
      try {
        const employee = await getEmployeeById(id)
        if (employee) {
          setFormData({
            name: employee.name,
            phone: employee.phone || '',
            position: employee.position || '',
            employee_type: employee.employee_type,
            department: employee.department,
            store_id: employee.store_id,
            monthly_salary: employee.monthly_salary?.toString() || '',
            daily_work_hours: employee.daily_work_hours?.toString() || '8',
            is_core_position: employee.is_core_position || false,
            position_fixed_backup: employee.position_fixed_backup || false,
            can_backup_positions: employee.can_backup_positions || []
          })
          setTypeIndex(employeeTypeValues.indexOf(employee.employee_type))
          setDepartmentIndex(departmentValues.indexOf(employee.department))
          // 等待店铺加载完成后设置店铺索引
          const storesData = await getStoresByTenantId(currentTenant?.id || '')
          const index = storesData.findIndex((s) => s.id === employee.store_id)
          if (index !== -1) {
            setStoreIndex(index)
          }
          // 设置岗位索引
          const positionsData = await getPositionConfigs({
            tenantId: currentTenant?.id || '',
            isActive: true
          })
          const posIndex = positionsData.findIndex((p) => p.position_name === employee.position)
          if (posIndex !== -1) {
            setPositionIndex(posIndex)
          }
        } else {
          showToast({title: '员工不存在', icon: 'none'})
          setTimeout(() => navigateBack(), 1000)
        }
      } catch (error) {
        console.error('加载员工数据失败:', error)
        showToast({title: '加载失败', icon: 'none'})
      }
    },
    [currentTenant]
  )

  useEffect(() => {
    loadStores()
    loadPositions()

    // 检查是否为编辑模式
    const instance = getCurrentInstance()
    const id = instance.router?.params?.id
    if (id) {
      setIsEditMode(true)
      setEmployeeId(id)
      loadEmployee(id)
    }
  }, [loadStores, loadPositions, loadEmployee])

  const handleSubmit = async () => {
    if (!currentTenant) {
      console.error('❌ 缺少租户信息', {currentTenant})
      showToast({title: '缺少租户信息，请重新登录', icon: 'none', duration: 2000})
      return
    }

    // 验证必填字段
    if (!formData.name.trim()) {
      showToast({title: '请输入员工姓名', icon: 'none'})
      return
    }

    if (!formData.store_id) {
      showToast({title: '请选择所属店铺', icon: 'none'})
      return
    }

    // 验证薪酬（正式工必填）
    if (formData.employee_type === 'full_time' && !formData.monthly_salary) {
      showToast({title: '请输入正式工月薪', icon: 'none'})
      return
    }

    // 验证每日工作小时数（正式工必填）
    if (formData.employee_type === 'full_time' && !formData.daily_work_hours) {
      showToast({title: '请输入每日工作小时数', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      // 获取选中门店的brand_id
      const selectedStore = stores.find((s) => s.id === formData.store_id)
      const brandId = selectedStore?.brand_id || null

      const employeeData = {
        store_id: formData.store_id,
        brand_id: brandId, // 添加brand_id
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        position: formData.position.trim() || null,
        employee_type: formData.employee_type as 'full_time' | 'part_time',
        department: formData.department,
        monthly_salary: formData.monthly_salary ? Number(formData.monthly_salary) : null,
        daily_work_hours: formData.daily_work_hours ? Number(formData.daily_work_hours) : null,
        // 新增字段
        is_core_position: formData.is_core_position,
        position_fixed_backup: formData.position_fixed_backup,
        can_backup_positions: formData.can_backup_positions
      }

      console.log('=== 开始保存员工 ===')
      console.log('租户信息:', {
        tenantId: currentTenant.id,
        tenantName: currentTenant.name
      })
      console.log('提交表单数据:', employeeData)
      console.log('是否编辑模式:', isEditMode)
      console.log('员工ID:', employeeId)

      if (isEditMode) {
        // 更新员工
        console.log('开始更新员工...')
        const success = await updateEmployee(employeeId, employeeData)
        console.log('更新结果:', success)

        if (success) {
          console.log('✅ 更新成功')
          showToast({title: '更新成功', icon: 'success'})
          setTimeout(() => {
            navigateBack()
          }, 500)
        } else {
          console.error('❌ 更新失败')
          showToast({title: '更新失败，请查看控制台日志', icon: 'none', duration: 2000})
        }
      } else {
        // 创建员工
        console.log('========== 创建员工 ==========')
        console.log('租户ID:', currentTenant.id)
        console.log('员工类型:', formData.employee_type)
        console.log('完整数据:', {
          tenant_id: currentTenant.id,
          ...employeeData,
          status: 'active'
        })

        const result = await createEmployee({
          tenant_id: currentTenant.id,
          ...employeeData,
          status: 'active'
        })

        console.log('创建结果:', result)

        if (result) {
          console.log('✅ 员工创建成功')
          console.log('返回数据:', result)

          // 显示成功提示
          showToast({
            title: formData.employee_type === 'part_time' ? '兼职员工添加成功' : '正式员工添加成功',
            icon: 'success'
          })

          // 延迟返回，确保数据已保存
          setTimeout(() => {
            console.log('🔄 返回上一页，触发列表刷新')
            navigateBack()
          }, 800)
        } else {
          console.error('❌ 创建失败，API返回null')
          showToast({
            title: '添加失败，请检查数据是否完整',
            icon: 'none',
            duration: 2000
          })
        }
      }
    } catch (error) {
      console.error('❌ 操作失败，异常详情:', error)
      const errorMessage = error instanceof Error ? error.message : '操作失败'
      showToast({title: errorMessage.length > 30 ? '操作失败，请重试' : errorMessage, icon: 'none', duration: 3000})
    } finally {
      setLoading(false)
    }
  }

  // 处理可顶岗岗位的多选
  const handleBackupPositionToggle = (positionName: string) => {
    const currentPositions = [...formData.can_backup_positions]
    const index = currentPositions.indexOf(positionName)

    if (index > -1) {
      // 已选中，取消选中
      currentPositions.splice(index, 1)
    } else {
      // 未选中，添加选中
      currentPositions.push(positionName)
    }

    setFormData({...formData, can_backup_positions: currentPositions})
  }

  if (!currentTenant) {
    return null
  }

  // 根据部门筛选岗位
  const filteredPositions = positions.filter((p) => {
    if (formData.department === 'front_hall') {
      return p.position_category === 'front'
    } else if (formData.department === 'kitchen') {
      return p.position_category === 'kitchen'
    }
    return true
  })

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
            {/* 员工姓名 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground block mb-2">
                员工姓名 <Text className="text-red-500">*</Text>
              </Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-foreground"
                  placeholder="请输入员工姓名"
                  value={formData.name}
                  onInput={(e) => setFormData({...formData, name: e.detail.value})}
                />
              </View>
            </View>

            {/* 手机号 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground block mb-2">手机号</Text>
              <View style={{overflow: 'hidden'}}>
                <Input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-foreground"
                  placeholder="请输入手机号"
                  type="number"
                  value={formData.phone}
                  onInput={(e) => setFormData({...formData, phone: e.detail.value})}
                />
              </View>
            </View>

            {/* 部门 */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground block mb-2">
                所属部门 <Text className="text-red-500">*</Text>
              </Text>
              <Picker
                mode="selector"
                range={departments}
                value={departmentIndex}
                onChange={(e) => {
                  const index = Number(e.detail.value)
                  setDepartmentIndex(index)
                  setFormData({...formData, department: departmentValues[index], position: ''})
                  setPositionIndex(0)
                }}>
                <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
                  <Text className="text-foreground">{departments[departmentIndex]}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
                </View>
              </Picker>
            </View>

            {/* 职位（从岗位配置中选择） */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground block mb-2">职位</Text>
              {filteredPositions.length > 0 ? (
                <Picker
                  mode="selector"
                  range={filteredPositions.map((p) => p.position_name)}
                  value={positionIndex}
                  onChange={(e) => {
                    const index = Number(e.detail.value)
                    setPositionIndex(index)
                    const selectedPosition = filteredPositions[index]
                    setFormData({
                      ...formData,
                      position: selectedPosition.position_name,
                      is_core_position: selectedPosition.is_core
                    })
                  }}>
                  <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
                    <Text className="text-foreground">
                      {formData.position || filteredPositions[positionIndex]?.position_name || '请选择职位'}
                    </Text>
                    <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
                  </View>
                </Picker>
              ) : (
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-foreground"
                    placeholder="请输入职位，如：服务员、厨师等"
                    value={formData.position}
                    onInput={(e) => setFormData({...formData, position: e.detail.value})}
                  />
                </View>
              )}
              <Text className="text-xs text-muted-foreground mt-1">可从预设岗位中选择，或手动输入</Text>
            </View>

            {/* 是否核心岗位 */}
            <View className="mb-4 bg-blue-100 rounded-xl p-4 border-2 border-orange-200">
              <View className="flex items-center justify-between">
                <View className="flex-1">
                  <View className="flex items-center gap-2 mb-1">
                    <View className="i-mdi-star-circle text-lg text-muted-foreground" />
                    <Text className="text-sm font-bold text-foreground">核心岗位</Text>
                  </View>
                  <Text className="text-xs text-foreground">如：店长、厨师长等关键岗位</Text>
                </View>
                <Switch
                  checked={formData.is_core_position}
                  onChange={(e) => setFormData({...formData, is_core_position: e.detail.value})}
                />
              </View>
            </View>

            {/* 是否需要固定顶岗 */}
            <View className="mb-4 bg-blue-100 rounded-xl p-4 border-2 border-purple-200">
              <View className="flex items-center justify-between">
                <View className="flex-1">
                  <View className="flex items-center gap-2 mb-1">
                    <View className="i-mdi-account-switch text-lg text-muted-foreground" />
                    <Text className="text-sm font-bold text-foreground">需固定顶岗</Text>
                  </View>
                  <Text className="text-xs text-foreground">该岗位是否需要其他人员顶岗</Text>
                </View>
                <Switch
                  checked={formData.position_fixed_backup}
                  onChange={(e) => setFormData({...formData, position_fixed_backup: e.detail.value})}
                />
              </View>
            </View>

            {/* 可顶岗岗位（多选） */}
            <View className="mb-4">
              <View className="flex items-center gap-2 mb-2">
                <View className="i-mdi-account-multiple text-lg text-muted-foreground" />
                <Text className="text-sm font-bold text-foreground">可顶岗岗位</Text>
              </View>
              <Text className="text-xs text-muted-foreground mb-3">选择该员工可以顶岗的其他岗位</Text>
              <View className="bg-muted rounded-xl p-3 border border-gray-200">
                {filteredPositions.length > 0 ? (
                  <View className="space-y-2">
                    {filteredPositions.map((position) => (
                      <View
                        key={position.id}
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          formData.can_backup_positions.includes(position.position_name)
                            ? 'bg-blue-100 border-green-500'
                            : 'bg-white border-gray-200'
                        }`}
                        onClick={() => handleBackupPositionToggle(position.position_name)}>
                        <View className="flex items-center gap-2">
                          <View
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              formData.can_backup_positions.includes(position.position_name)
                                ? 'bg-blue-100 border-green-500'
                                : 'border-gray-300'
                            }`}>
                            {formData.can_backup_positions.includes(position.position_name) && (
                              <View className="i-mdi-check text-xs text-blue-600" />
                            )}
                          </View>
                          <Text
                            className={`text-sm ${
                              formData.can_backup_positions.includes(position.position_name)
                                ? 'text-foreground font-semibold'
                                : 'text-foreground'
                            }`}>
                            {position.position_name}
                          </Text>
                        </View>
                        {position.is_core && (
                          <View className="px-2 py-0.5 bg-orange-100 rounded">
                            <Text className="text-xs text-muted-foreground font-medium">核心</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-sm text-muted-foreground text-center py-4">暂无可选岗位</Text>
                )}
              </View>
              {formData.can_backup_positions.length > 0 && (
                <View className="flex items-center gap-1 mt-2">
                  <View className="i-mdi-check-circle text-sm text-muted-foreground" />
                  <Text className="text-xs text-muted-foreground font-medium">
                    已选择 {formData.can_backup_positions.length} 个岗位
                  </Text>
                </View>
              )}
            </View>

            {/* 员工类型 */}
            <View className="mb-4">
              <Text className="text-sm text-foreground block mb-2">
                员工类型 <Text className="text-red-500">*</Text>
              </Text>
              <Picker
                mode="selector"
                range={employeeTypes}
                value={typeIndex}
                onChange={(e) => {
                  const index = Number(e.detail.value)
                  setTypeIndex(index)
                  setFormData({...formData, employee_type: employeeTypeValues[index]})
                }}>
                <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
                  <Text className="text-foreground">{employeeTypes[typeIndex]}</Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
                </View>
              </Picker>
            </View>

            {/* 月薪（正式工必填） */}
            {formData.employee_type === 'full_time' && (
              <View className="mb-4">
                <Text className="text-sm text-foreground block mb-2">
                  月薪（元） <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    type="digit"
                    placeholder="请输入月薪"
                    value={formData.monthly_salary}
                    onInput={(e) => setFormData({...formData, monthly_salary: e.detail.value})}
                  />
                </View>
              </View>
            )}

            {/* 每日工作小时数（正式工必填） */}
            {formData.employee_type === 'full_time' && (
              <View className="mb-4">
                <Text className="text-sm text-foreground block mb-2">
                  每日工作小时数 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                    type="digit"
                    placeholder="请输入每日工作小时数"
                    value={formData.daily_work_hours}
                    onInput={(e) => setFormData({...formData, daily_work_hours: e.detail.value})}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">用于计算人力成本，默认8小时</Text>
              </View>
            )}

            {/* 所属店铺 */}
            <View className="mb-6">
              <Text className="text-sm text-foreground block mb-2">
                所属店铺 <Text className="text-red-500">*</Text>
              </Text>
              {stores.length === 0 ? (
                <View className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
                  <Text className="text-muted-foreground">暂无店铺，请先添加店铺</Text>
                </View>
              ) : (
                <Picker
                  mode="selector"
                  range={stores.map((s) => s.name)}
                  value={storeIndex}
                  onChange={(e) => {
                    const index = Number(e.detail.value)
                    setStoreIndex(index)
                    setFormData({...formData, store_id: stores[index].id})
                  }}>
                  <View className="w-full px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
                    <Text className="text-foreground">{stores[storeIndex]?.name || '请选择店铺'}</Text>
                    <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
                  </View>
                </Picker>
              )}
            </View>

            {/* 提交按钮 */}
            <View className="flex gap-3">
              <Button
                className="flex-1 bg-muted text-foreground rounded-xl text-sm break-keep py-3"
                size="default"
                onClick={() => navigateBack()}>
                取消
              </Button>
              <Button
                className="flex-1 bg-blue-100 text-white rounded-xl text-sm break-keep py-3"
                size="default"
                loading={loading}
                disabled={loading || stores.length === 0}
                onClick={handleSubmit}>
                {loading ? '提交中...' : isEditMode ? '确认更新' : '确认添加'}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default EmployeeForm
