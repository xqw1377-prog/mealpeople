/**
 * 部门表单页面
 * 新增/编辑部门
 */

import type {CommonEventFunction} from '@tarojs/components'
import {Button, Input, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import type {PickerSelectorProps} from '@tarojs/components/types/Picker'
import Taro, {useLoad} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {LoadingCards, PageHeader} from '@/components/common'
import {getEmployeesByTenantId} from '@/db/api'
import {
  createDepartment,
  getAvailableParentDepartments,
  getDepartmentWithDetails,
  updateDepartment
} from '@/db/api-department'
import type {Employee} from '@/db/types'
import type {Department} from '@/db/types-department'
import {useTenantStore} from '@/store/tenant'

export default function DepartmentForm() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [departmentId, setDepartmentId] = useState<string>()
  const [isEdit, setIsEdit] = useState(false)

  // 表单数据
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [parentId, setParentId] = useState<string>()
  const [managerId, setManagerId] = useState<string>()
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [sortOrder, setSortOrder] = useState(0)

  // 选择器数据
  const [parentDepartments, setParentDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedParentIndex, setSelectedParentIndex] = useState(0)
  const [selectedManagerIndex, setSelectedManagerIndex] = useState(0)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // 加载员工列表和可选父部门
      const [employeeList, parentList] = await Promise.all([
        getEmployeesByTenantId(currentTenant.id),
        getAvailableParentDepartments(currentTenant.id, departmentId)
      ])

      setEmployees(employeeList)
      setParentDepartments(parentList)

      // 如果是编辑模式，加载部门详情
      if (departmentId) {
        const dept = await getDepartmentWithDetails(departmentId)
        if (dept) {
          setName(dept.name)
          setCode(dept.code || '')
          setParentId(dept.parent_id)
          setManagerId(dept.manager_id)
          setDescription(dept.description || '')
          setStatus(dept.status)
          setSortOrder(dept.sort_order)

          // 设置选择器索引
          if (dept.parent_id) {
            const parentIndex = parentList.findIndex((p) => p.id === dept.parent_id)
            if (parentIndex >= 0) {
              setSelectedParentIndex(parentIndex + 1) // +1 因为第一项是"无"
            }
          }

          if (dept.manager_id) {
            const managerIndex = employeeList.findIndex((e) => e.id === dept.manager_id)
            if (managerIndex >= 0) {
              setSelectedManagerIndex(managerIndex + 1) // +1 因为第一项是"无"
            }
          }
        }
      }
    } catch (error) {
      console.error('[部门表单] 加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, departmentId])

  useLoad((options) => {
    if (options.id) {
      setDepartmentId(options.id)
      setIsEdit(true)
    }
    loadData()
  })

  // 父部门选择
  const handleParentChange: CommonEventFunction<PickerSelectorProps.ChangeEventDetail> = (e) => {
    const index = typeof e.detail.value === 'number' ? e.detail.value : Number.parseInt(e.detail.value, 10)
    setSelectedParentIndex(index)
    if (index === 0) {
      setParentId(undefined)
    } else {
      setParentId(parentDepartments[index - 1].id)
    }
  }

  // 负责人选择
  const handleManagerChange: CommonEventFunction<PickerSelectorProps.ChangeEventDetail> = (e) => {
    const index = typeof e.detail.value === 'number' ? e.detail.value : Number.parseInt(e.detail.value, 10)
    setSelectedManagerIndex(index)
    if (index === 0) {
      setManagerId(undefined)
    } else {
      setManagerId(employees[index - 1].id)
    }
  }

  // 状态选择
  const handleStatusChange: CommonEventFunction<PickerSelectorProps.ChangeEventDetail> = (e) => {
    const index = typeof e.detail.value === 'number' ? e.detail.value : Number.parseInt(e.detail.value, 10)
    setStatus(index === 0 ? 'active' : 'inactive')
  }

  // 提交表单
  const handleSubmit = async () => {
    // 验证
    if (!name.trim()) {
      Taro.showToast({
        title: '请输入部门名称',
        icon: 'none'
      })
      return
    }

    if (!currentTenant?.id) {
      Taro.showToast({
        title: '租户信息缺失',
        icon: 'none'
      })
      return
    }

    try {
      setSubmitting(true)

      const formData = {
        name: name.trim(),
        code: code.trim() || undefined,
        parent_id: parentId,
        manager_id: managerId,
        description: description.trim() || undefined,
        status,
        sort_order: sortOrder
      }

      if (isEdit && departmentId) {
        await updateDepartment(departmentId, formData)
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
      } else {
        await createDepartment(currentTenant.id, formData)
        Taro.showToast({
          title: '创建成功',
          icon: 'success'
        })
      }

      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('[部门表单] 提交失败:', error)
      Taro.showToast({
        title: error instanceof Error ? error.message : '操作失败',
        icon: 'none'
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <View className="min-h-screen" style={{background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)'}}>
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          <PageHeader
            icon="i-mdi-sitemap"
            title={isEdit ? '编辑部门' : '新增部门'}
            description={isEdit ? '修改部门信息' : '创建新的部门'}
          />

          {loading ? (
            <LoadingCards count={3} />
          ) : (
            <View className="bg-white rounded-lg p-4 border border-border">
              {/* 部门名称 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground block mb-2">
                  部门名称 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    placeholder="请输入部门名称"
                    value={name}
                    onInput={(e) => setName(e.detail.value)}
                  />
                </View>
              </View>

              {/* 部门编码 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground block mb-2">部门编码</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    placeholder="请输入部门编码（可选）"
                    value={code}
                    onInput={(e) => setCode(e.detail.value)}
                  />
                </View>
              </View>

              {/* 上级部门 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground block mb-2">上级部门</Text>
                <Picker
                  mode="selector"
                  range={['无', ...parentDepartments.map((d) => d.name)]}
                  value={selectedParentIndex}
                  onChange={handleParentChange}>
                  <View className="bg-input text-foreground px-3 py-2 rounded border border-border flex items-center justify-between">
                    <Text className={selectedParentIndex === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                      {selectedParentIndex === 0 ? '无' : parentDepartments[selectedParentIndex - 1].name}
                    </Text>
                    <View className="i-mdi-chevron-down text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 部门负责人 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground block mb-2">部门负责人</Text>
                <Picker
                  mode="selector"
                  range={['无', ...employees.map((e) => e.name)]}
                  value={selectedManagerIndex}
                  onChange={handleManagerChange}>
                  <View className="bg-input text-foreground px-3 py-2 rounded border border-border flex items-center justify-between">
                    <Text className={selectedManagerIndex === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                      {selectedManagerIndex === 0 ? '无' : employees[selectedManagerIndex - 1].name}
                    </Text>
                    <View className="i-mdi-chevron-down text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 部门描述 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground block mb-2">部门描述</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    placeholder="请输入部门描述（可选）"
                    value={description}
                    onInput={(e) => setDescription(e.detail.value)}
                    maxlength={200}
                    style={{minHeight: '80px'}}
                  />
                </View>
              </View>

              {/* 状态 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground block mb-2">状态</Text>
                <Picker
                  mode="selector"
                  range={['启用', '停用']}
                  value={status === 'active' ? 0 : 1}
                  onChange={handleStatusChange}>
                  <View className="bg-input text-foreground px-3 py-2 rounded border border-border flex items-center justify-between">
                    <Text className="text-foreground">{status === 'active' ? '启用' : '停用'}</Text>
                    <View className="i-mdi-chevron-down text-muted-foreground" />
                  </View>
                </Picker>
              </View>

              {/* 排序 */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground block mb-2">排序</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="bg-input text-foreground px-3 py-2 rounded border border-border w-full"
                    placeholder="请输入排序数字（越小越靠前）"
                    type="number"
                    value={sortOrder.toString()}
                    onInput={(e) => setSortOrder(Number.parseInt(e.detail.value, 10) || 0)}
                  />
                </View>
              </View>

              {/* 提交按钮 */}
              <Button
                className="w-full bg-primary text-white py-3 rounded-lg break-keep text-base border-0 mt-4"
                size="default"
                onClick={handleSubmit}
                disabled={submitting}>
                {submitting ? '提交中...' : isEdit ? '保存修改' : '创建部门'}
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
