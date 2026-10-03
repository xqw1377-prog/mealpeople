/**
 * 离职手续办理页面
 *
 * 功能：
 * - 查看待办理离职手续的员工列表
 * - 记录各项手续办理情况
 * - 追踪手续办理进度
 * - 完成离职手续确认
 *
 * 设计理念：容易学、容易做、容易管理
 */

import {Button, ScrollView, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {supabase} from '@/client/supabase'
import {getEmployeeByUserId} from '@/db/api-employees'
import {useTenantStore} from '@/store/tenant'

// 离职手续项目类型
interface ProcedureItem {
  id: string
  name: string
  description: string
  completed: boolean
  completed_at?: string
  completed_by?: string
  notes?: string
}

// 离职手续记录类型
interface ExitProcedure {
  id: string
  employee_id: string
  employee_name: string
  department: string
  position: string
  resignation_date: string
  procedures: ProcedureItem[]
  overall_progress: number
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
}

// 默认手续项目
const DEFAULT_PROCEDURES: Omit<ProcedureItem, 'id'>[] = [
  {name: '工作交接', description: '完成工作内容交接', completed: false},
  {name: '物品归还', description: '归还公司物品（工牌、钥匙、设备等）', completed: false},
  {name: '财务结算', description: '完成工资、报销等财务结算', completed: false},
  {name: '社保公积金', description: '办理社保公积金转移手续', completed: false},
  {name: '档案转移', description: '办理人事档案转移', completed: false},
  {name: '离职证明', description: '开具离职证明', completed: false},
  {name: '系统权限', description: '注销系统账号和权限', completed: false},
  {name: '离职面谈', description: '完成离职面谈', completed: false}
]

export default function ExitProceduresPage() {
  const {user} = useAuth({guard: true})
  const {currentTenant} = useTenantStore()
  const [loading, setLoading] = useState(true)
  const [procedures, setProcedures] = useState<ExitProcedure[]>([])
  const [selectedProcedure, setSelectedProcedure] = useState<ExitProcedure | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // 加载离职手续列表
  const loadProcedures = useCallback(async () => {
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

      // 获取已通过的离职申请
      const {data: resignations, error: resignError} = await supabase
        .from('resignation_applications')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'approved')
        .order('created_at', {ascending: false})

      if (resignError) throw resignError

      // 获取员工信息
      const employeeIds = resignations?.map((r) => r.employee_id) || []
      const {data: employees, error: empError} = await supabase.from('employees').select('*').in('id', employeeIds)

      if (empError) throw empError

      // 获取已有的离职手续记录
      const {data: existingProcedures, error: procError} = await supabase
        .from('exit_procedures')
        .select('*')
        .eq('tenant_id', currentTenant.id)

      if (procError) throw procError

      // 构建离职手续列表
      const procedureList: ExitProcedure[] = []

      for (const resignation of resignations || []) {
        const employee = employees?.find((e) => e.id === resignation.employee_id)
        if (!employee) continue

        // 查找已有记录
        const existing = existingProcedures?.find((p) => p.employee_id === resignation.employee_id)

        if (existing) {
          // 使用已有记录
          const procedures = (existing.procedures as ProcedureItem[]) || []
          const completedCount = procedures.filter((p) => p.completed).length
          const progress = procedures.length > 0 ? Math.round((completedCount / procedures.length) * 100) : 0

          procedureList.push({
            id: existing.id,
            employee_id: employee.id,
            employee_name: employee.name,
            department: employee.department || '未知',
            position: employee.position || '未知',
            resignation_date: resignation.resignation_date,
            procedures,
            overall_progress: progress,
            status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending',
            created_at: existing.created_at
          })
        } else {
          // 创建新记录
          const newProcedures: ProcedureItem[] = DEFAULT_PROCEDURES.map((p, index) => ({
            id: `${resignation.employee_id}-${index}`,
            ...p
          }))

          const {data: newRecord, error: createError} = await supabase
            .from('exit_procedures')
            .insert({
              tenant_id: currentTenant.id,
              employee_id: resignation.employee_id,
              procedures: newProcedures,
              overall_progress: 0,
              status: 'pending'
            })
            .select()
            .single()

          if (createError) {
            console.error('创建离职手续记录失败:', createError)
            continue
          }

          procedureList.push({
            id: newRecord.id,
            employee_id: employee.id,
            employee_name: employee.name,
            department: employee.department || '未知',
            position: employee.position || '未知',
            resignation_date: resignation.resignation_date,
            procedures: newProcedures,
            overall_progress: 0,
            status: 'pending',
            created_at: newRecord.created_at
          })
        }
      }

      setProcedures(procedureList)
    } catch (error) {
      console.error('加载离职手续列表失败:', error)
      Taro.showToast({title: '加载失败', icon: 'none'})
    } finally {
      setLoading(false)
    }
  }, [currentTenant, user])

  useDidShow(() => {
    loadProcedures()
  })

  // 切换手续项完成状态
  const toggleProcedureItem = async (procedure: ExitProcedure, itemId: string) => {
    if (!user) return

    try {
      const currentEmployee = await getEmployeeByUserId(user.id)
      const updatedProcedures = procedure.procedures.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            completed: !item.completed,
            completed_at: !item.completed ? new Date().toISOString() : undefined,
            completed_by: !item.completed ? currentEmployee?.name || '' : undefined
          }
        }
        return item
      })

      const completedCount = updatedProcedures.filter((p) => p.completed).length
      const progress = Math.round((completedCount / updatedProcedures.length) * 100)
      const newStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending'

      const {error} = await supabase
        .from('exit_procedures')
        .update({
          procedures: updatedProcedures,
          overall_progress: progress,
          status: newStatus
        })
        .eq('id', procedure.id)

      if (error) throw error

      Taro.showToast({title: '更新成功', icon: 'success'})
      loadProcedures()
    } catch (error) {
      console.error('更新失败:', error)
      Taro.showToast({title: '更新失败', icon: 'none'})
    }
  }

  // 查看详情
  const handleViewDetail = (procedure: ExitProcedure) => {
    setSelectedProcedure(procedure)
    setShowDetailModal(true)
  }

  // 返回上一页
  const handleBack = () => {
    Taro.navigateBack()
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待办理'
      case 'in_progress':
        return '办理中'
      case 'completed':
        return '已完成'
      default:
        return '未知'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700'
      case 'in_progress':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  // 统计数据
  const statistics = {
    total: procedures.length,
    pending: procedures.filter((p) => p.status === 'pending').length,
    in_progress: procedures.filter((p) => p.status === 'in_progress').length,
    completed: procedures.filter((p) => p.status === 'completed').length
  }

  return (
    <ScrollView
      scrollY
      className="h-screen box-border"
      style={{background: 'linear-gradient(to bottom, #faf5ff, #f3e8ff)'}}>
      {/* 头部 */}
      <View className="bg-gradient-to-r from-purple-500 to-violet-500 text-white p-6 rounded-b-3xl mb-4">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <Text className="text-2xl font-bold block mb-2">离职手续办理</Text>
            <Text className="text-sm opacity-90 block">管理员工离职手续</Text>
          </View>
          <View className="i-mdi-clipboard-list text-5xl opacity-20"></View>
        </View>

        {/* 统计卡片 */}
        <View className="bg-white bg-opacity-20 rounded-xl p-4">
          <View className="grid grid-cols-4 gap-2">
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.total}</Text>
              <Text className="text-xs opacity-90 block">总数</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.pending}</Text>
              <Text className="text-xs opacity-90 block">待办理</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.in_progress}</Text>
              <Text className="text-xs opacity-90 block">办理中</Text>
            </View>
            <View className="text-center">
              <Text className="text-2xl font-bold block mb-1">{statistics.completed}</Text>
              <Text className="text-xs opacity-90 block">已完成</Text>
            </View>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="text-center py-8">
          <Text className="text-muted-foreground">加载中...</Text>
        </View>
      ) : (
        <View className="p-4">
          {/* 手续列表 */}
          <View className="mb-4">
            <Text className="text-sm text-muted-foreground mb-3 block">共 {procedures.length} 个待办理</Text>
            {procedures.map((procedure) => (
              <View key={procedure.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex items-center justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex items-center mb-2">
                      <View className="i-mdi-account-circle text-xl text-purple-600 mr-2"></View>
                      <Text className="text-base font-bold text-foreground">{procedure.employee_name}</Text>
                    </View>
                    <Text className="text-sm text-muted-foreground">
                      {procedure.department} · {procedure.position}
                    </Text>
                  </View>

                  {/* 状态标签 */}
                  <View className={`px-3 py-1 rounded-full ${getStatusColor(procedure.status)}`}>
                    <Text className="text-xs font-medium">{getStatusText(procedure.status)}</Text>
                  </View>
                </View>

                {/* 进度条 */}
                <View className="mb-3">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-sm text-muted-foreground">办理进度</Text>
                    <Text className="text-sm font-bold text-purple-600">{procedure.overall_progress}%</Text>
                  </View>
                  <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transition-all"
                      style={{width: `${procedure.overall_progress}%`}}></View>
                  </View>
                </View>

                {/* 手续项列表（简化显示） */}
                <View className="bg-gray-50 rounded-xl p-3 mb-3">
                  <Text className="text-sm text-muted-foreground mb-2 block">手续清单</Text>
                  <View className="grid grid-cols-2 gap-2">
                    {procedure.procedures.slice(0, 4).map((item) => (
                      <View key={item.id} className="flex items-center">
                        <View
                          className={`w-4 h-4 rounded mr-2 flex items-center justify-center ${item.completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                          {item.completed && <View className="i-mdi-check text-xs text-white"></View>}
                        </View>
                        <Text
                          className={`text-xs ${item.completed ? 'text-green-600 line-through' : 'text-foreground'}`}>
                          {item.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {procedure.procedures.length > 4 && (
                    <Text className="text-xs text-muted-foreground mt-2 block">
                      还有 {procedure.procedures.length - 4} 项...
                    </Text>
                  )}
                </View>

                {/* 操作按钮 */}
                <View className="flex items-center gap-2">
                  <View
                    onClick={() => handleViewDetail(procedure)}
                    className="flex-1 bg-purple-50 rounded-xl py-2 flex items-center justify-center active:bg-purple-100">
                    <View className="i-mdi-eye text-lg text-purple-600 mr-1"></View>
                    <Text className="text-sm text-purple-600 font-medium">查看详情</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* 空状态 */}
          {procedures.length === 0 && (
            <View className="text-center py-12">
              <View className="i-mdi-clipboard-list-outline text-6xl text-muted-foreground mb-4"></View>
              <Text className="text-muted-foreground text-base block">暂无待办理手续</Text>
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

      {/* 详情弹窗 */}
      {showDetailModal && selectedProcedure && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDetailModal(false)}>
          <View
            className="bg-white rounded-2xl p-6 m-4 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <View className="flex items-center justify-between mb-4">
              <Text className="text-lg font-bold text-foreground">手续办理详情</Text>
              <View
                onClick={() => setShowDetailModal(false)}
                className="i-mdi-close text-2xl text-muted-foreground"></View>
            </View>

            {/* 员工信息 */}
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <Text className="text-base font-bold text-foreground mb-2 block">{selectedProcedure.employee_name}</Text>
              <Text className="text-sm text-muted-foreground mb-1 block">部门：{selectedProcedure.department}</Text>
              <Text className="text-sm text-muted-foreground mb-1 block">职位：{selectedProcedure.position}</Text>
              <Text className="text-sm text-muted-foreground block">
                离职日期：{selectedProcedure.resignation_date}
              </Text>
            </View>

            {/* 手续清单 */}
            <View className="mb-4">
              <Text className="text-base font-bold text-foreground mb-3 block">手续清单</Text>
              {selectedProcedure.procedures.map((item) => (
                <View key={item.id} className="bg-gray-50 rounded-xl p-3 mb-2">
                  <View className="flex items-center justify-between mb-2">
                    <View className="flex items-center flex-1">
                      <View
                        onClick={() => toggleProcedureItem(selectedProcedure, item.id)}
                        className={`w-5 h-5 rounded mr-2 flex items-center justify-center ${item.completed ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {item.completed && <View className="i-mdi-check text-sm text-white"></View>}
                      </View>
                      <Text
                        className={`text-sm font-medium ${item.completed ? 'text-green-600 line-through' : 'text-foreground'}`}>
                        {item.name}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-xs text-muted-foreground ml-7 block">{item.description}</Text>
                  {item.completed && item.completed_at && (
                    <View className="ml-7 mt-2 pt-2 border-t border-gray-200">
                      <Text className="text-xs text-muted-foreground">
                        完成时间：{new Date(item.completed_at).toLocaleString('zh-CN')}
                      </Text>
                      {item.completed_by && (
                        <Text className="text-xs text-muted-foreground">办理人：{item.completed_by}</Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* 关闭按钮 */}
            <Button
              className="w-full bg-purple-500 text-white py-3 rounded-xl break-keep text-base"
              size="default"
              onClick={() => setShowDetailModal(false)}>
              关闭
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  )
}
