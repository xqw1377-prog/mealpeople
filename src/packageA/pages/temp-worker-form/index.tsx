import {Button, Input, Picker, Text, View} from '@tarojs/components'
import {getCurrentInstance, navigateBack, showToast} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useEffect, useState} from 'react'
import {createEmployee, getEmployeeById, getStoresByTenantId, updateEmployee} from '@/db/api'
import type {DepartmentType, Store} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

const TempWorkerForm: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore) // ✅ 获取当前选择的门店
  const [stores, setStores] = useState<Store[]>([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    position: '',
    department: 'front_hall' as DepartmentType,
    store_id: ''
  })
  const [storeIndex, setStoreIndex] = useState(0)
  const [departmentIndex, setDepartmentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [employeeId, setEmployeeId] = useState<string>('')

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

  const loadEmployee = useCallback(
    async (id: string) => {
      try {
        const employee = await getEmployeeById(id)
        if (employee) {
          setFormData({
            name: employee.name,
            phone: employee.phone || '',
            position: employee.position || '',
            department: employee.department,
            store_id: employee.store_id
          })
          setDepartmentIndex(departmentValues.indexOf(employee.department))
          // 等待店铺加载完成后设置店铺索引
          const storesData = await getStoresByTenantId(currentTenant?.id || '')
          const index = storesData.findIndex((s) => s.id === employee.store_id)
          if (index !== -1) {
            setStoreIndex(index)
          }
        } else {
          showToast({title: '临时工不存在', icon: 'none'})
          setTimeout(() => navigateBack(), 1000)
        }
      } catch (error) {
        console.error('加载临时工数据失败:', error)
        showToast({title: '加载失败', icon: 'none'})
      }
    },
    [currentTenant]
  )

  useEffect(() => {
    loadStores()

    // 检查是否为编辑模式
    const instance = getCurrentInstance()
    const id = instance.router?.params?.id
    if (id) {
      setIsEditMode(true)
      setEmployeeId(id)
      loadEmployee(id)
    }
  }, [loadStores, loadEmployee])

  const handleSubmit = async () => {
    if (!currentTenant) return

    // 验证必填字段
    if (!formData.name.trim()) {
      showToast({title: '请输入临时工姓名', icon: 'none'})
      return
    }

    if (!formData.store_id) {
      showToast({title: '请选择所属店铺', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const employeeData = {
        store_id: formData.store_id,
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        position: formData.position.trim() || null,
        employee_type: 'part_time' as const,
        department: formData.department,
        monthly_salary: null,
        daily_work_hours: null
      }

      if (isEditMode) {
        // 更新临时工
        const success = await updateEmployee(employeeId, employeeData)

        if (success) {
          showToast({title: '更新成功', icon: 'success'})
          setTimeout(() => {
            navigateBack()
          }, 500)
        } else {
          showToast({title: '更新失败', icon: 'none'})
        }
      } else {
        // 创建临时工
        const result = await createEmployee({
          tenant_id: currentTenant.id,
          ...employeeData,
          status: 'active'
        })

        if (result) {
          showToast({title: '添加成功', icon: 'success'})
          setTimeout(() => {
            navigateBack()
          }, 500)
        } else {
          showToast({title: '添加失败', icon: 'none'})
        }
      }
    } catch (error) {
      console.error('操作失败:', error)
      showToast({title: '操作失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }

  if (!currentTenant) {
    return null
  }

  return (
    <View className="min-h-screen bg-blue-100 p-4">
      <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
        {/* 临时工姓名 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">
            姓名 <Text className="text-red-500">*</Text>
          </Text>
          <Input
            className="w-full px-4 py-3 border border-border rounded-xl"
            placeholder="请输入临时工姓名"
            value={formData.name}
            onInput={(e) => setFormData({...formData, name: e.detail.value})}
          />
        </View>

        {/* 手机号 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">手机号</Text>
          <Input
            className="w-full px-4 py-3 border border-border rounded-xl"
            placeholder="请输入手机号"
            type="number"
            value={formData.phone}
            onInput={(e) => setFormData({...formData, phone: e.detail.value})}
          />
        </View>

        {/* 职位 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">职位</Text>
          <Input
            className="w-full px-4 py-3 border border-border rounded-xl"
            placeholder="请输入职位，如：服务员、厨师等"
            value={formData.position}
            onInput={(e) => setFormData({...formData, position: e.detail.value})}
          />
        </View>

        {/* 部门 */}
        <View className="mb-4">
          <Text className="text-sm text-foreground block mb-2">
            所属部门 <Text className="text-red-500">*</Text>
          </Text>
          <Picker
            mode="selector"
            range={departments}
            value={departmentIndex}
            onChange={(e) => {
              const index = Number(e.detail.value)
              setDepartmentIndex(index)
              setFormData({...formData, department: departmentValues[index]})
            }}>
            <View className="w-full px-4 py-3 border border-border rounded-xl flex items-center justify-between">
              <Text className="text-foreground">{departments[departmentIndex]}</Text>
              <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
            </View>
          </Picker>
        </View>

        {/* 所属店铺 */}
        <View className="mb-6">
          <Text className="text-sm text-foreground block mb-2">
            所属店铺 <Text className="text-red-500">*</Text>
          </Text>
          {stores.length === 0 ? (
            <View className="w-full px-4 py-3 border border-border rounded-xl bg-gray-50">
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
              <View className="w-full px-4 py-3 border border-border rounded-xl flex items-center justify-between">
                <Text className="text-foreground">{stores[storeIndex]?.name || '请选择店铺'}</Text>
                <View className="i-mdi-chevron-down text-xl text-muted-foreground"></View>
              </View>
            </Picker>
          )}
        </View>

        {/* 提交按钮 */}
        <View className="flex gap-3">
          <Button
            className="flex-1 bg-muted text-foreground rounded-xl text-sm break-keep"
            size="default"
            onClick={() => navigateBack()}>
            取消
          </Button>
          <Button
            className="flex-1 bg-amber-500 text-blue-600 rounded-xl text-sm break-keep"
            size="default"
            loading={loading}
            disabled={loading || stores.length === 0}
            onClick={handleSubmit}>
            {loading ? '提交中...' : isEditMode ? '确认更新' : '确认添加'}
          </Button>
        </View>
      </View>
    </View>
  )
}

export default TempWorkerForm
