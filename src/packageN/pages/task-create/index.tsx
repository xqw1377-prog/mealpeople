/**
 * 任务创建页面
 * 3.0 版本 - 任务管理系统（管理员功能）
 */

import {Button, Picker, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {getEmployeesByTenantId} from '@/db/api'
import {createTask} from '@/db/api-task'
import type {Employee} from '@/db/types'
import {TASK_PRIORITY_NAMES, type TaskPriority} from '@/db/types-task'
import {useTenantStore} from '@/store/tenant'

const TaskCreate: React.FC = () => {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployeeIndex, setSelectedEmployeeIndex] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  // 加载员工列表
  const loadEmployees = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      const empList = await getEmployeesByTenantId(currentTenant.id)
      setEmployees(empList)
    } catch (error) {
      console.error('加载员工列表失败:', error)
      Taro.showToast({
        title: '加载员工列表失败',
        icon: 'none'
      })
    }
  }, [currentTenant?.id])

  // 页面显示时加载数据
  useDidShow(() => {
    loadEmployees()
  })

  // 选择日期
  const handleDateChange = (e: any) => {
    setDueDate(e.detail.value)
  }

  // 创建任务
  const handleCreateTask = async () => {
    // 验证表单
    if (!title.trim()) {
      Taro.showToast({
        title: '请输入任务标题',
        icon: 'none'
      })
      return
    }

    if (employees.length === 0) {
      Taro.showToast({
        title: '没有可分配的员工',
        icon: 'none'
      })
      return
    }

    const selectedEmployee = employees[selectedEmployeeIndex]
    if (!selectedEmployee) {
      Taro.showToast({
        title: '请选择员工',
        icon: 'none'
      })
      return
    }

    if (!currentTenant?.id || !user?.id) {
      Taro.showToast({
        title: '缺少必要信息',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    try {
      await createTask({
        tenant_id: currentTenant.id,
        employee_id: selectedEmployee.id,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        created_by: user.id
      })

      Taro.showToast({
        title: '任务创建成功',
        icon: 'success'
      })

      // 返回上一页
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('创建任务失败:', error)
      Taro.showToast({
        title: '创建任务失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const priorityOptions: TaskPriority[] = ['low', 'medium', 'high']

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="h-screen box-border bg-transparent">
        <View className="p-4">
          {/* 标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground">创建任务</Text>
            <Text className="text-sm text-muted-foreground mt-1">为员工分配新的工作任务</Text>
          </View>

          {/* 表单 */}
          <View className="space-y-4">
            {/* 任务标题 */}
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
              <Text className="text-sm font-medium text-foreground mb-2">任务标题 *</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-muted text-foreground px-3 py-2 rounded-lg border border-border w-full"
                  placeholder="请输入任务标题"
                  value={title}
                  onInput={(e) => setTitle(e.detail.value)}
                  maxlength={100}
                  autoHeight
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">{title.length}/100</Text>
            </View>

            {/* 任务描述 */}
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
              <Text className="text-sm font-medium text-foreground mb-2">任务描述</Text>
              <View style={{overflow: 'hidden'}}>
                <Textarea
                  className="bg-muted text-foreground px-3 py-2 rounded-lg border border-border w-full"
                  placeholder="请输入任务描述（可选）"
                  value={description}
                  onInput={(e) => setDescription(e.detail.value)}
                  maxlength={500}
                  autoHeight
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">{description.length}/500</Text>
            </View>

            {/* 分配给员工 */}
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
              <Text className="text-sm font-medium text-foreground mb-2">分配给 *</Text>
              <Picker
                mode="selector"
                range={employees.map((emp) => emp.name)}
                value={selectedEmployeeIndex}
                onChange={(e) => setSelectedEmployeeIndex(Number(e.detail.value))}>
                <View className="flex flex-row items-center justify-between p-3 bg-muted rounded-lg">
                  <Text className="text-foreground">
                    {employees.length > 0 ? employees[selectedEmployeeIndex]?.name : '请选择员工'}
                  </Text>
                  <View className="i-mdi-chevron-down text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 优先级 */}
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
              <Text className="text-sm font-medium text-foreground mb-3">优先级 *</Text>
              <View className="flex flex-row gap-2">
                {priorityOptions.map((p) => (
                  <View
                    key={p}
                    className={`flex-1 py-3 rounded-lg text-center ${priority === p ? 'bg-blue-100' : 'bg-gray-50'}`}
                    onClick={() => setPriority(p)}>
                    <Text className={priority === p ? 'text-blue-600 font-medium' : 'text-foreground'}>
                      {TASK_PRIORITY_NAMES[p]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 截止日期 */}
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 shadow-sm">
              <Text className="text-sm font-medium text-foreground mb-2">截止日期</Text>
              <Picker mode="date" value={dueDate} onChange={handleDateChange}>
                <View className="flex flex-row items-center justify-between p-3 bg-muted rounded-lg">
                  <Text className="text-foreground">{dueDate || '请选择截止日期（可选）'}</Text>
                  <View className="i-mdi-calendar text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {/* 提交按钮 */}
            <View className="pt-4">
              <Button
                className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
                size="default"
                onClick={handleCreateTask}
                loading={loading}
                disabled={loading}>
                {loading ? '创建中...' : '创建任务'}
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default TaskCreate
