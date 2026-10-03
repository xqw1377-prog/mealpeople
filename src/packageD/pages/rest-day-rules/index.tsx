/**
 * 排休规则配置页面（优化版）
 * 配置员工排休规则，包括休息天数、不可排休时间、存休、连休、顶岗原则等
 */

import {Button, Input, ScrollView, Switch, Text, Textarea, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useState} from 'react'
import {getEmployeesByTenantId} from '@/db/api'
import {createRestDayRule, deleteRestDayRule, getRestDayRules, updateRestDayRule} from '@/db/api-rest-day'
import type {Employee} from '@/db/types'
import type {BackupRule, RestDayRule} from '@/db/types-v2'
import {useTenantStore} from '@/store/tenant'

export default function RestDayRules() {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)
  const [rules, setRules] = useState<RestDayRule[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingRule, setEditingRule] = useState<RestDayRule | null>(null)

  // 基础规则表单状态
  const [ruleName, setRuleName] = useState('')
  const [monthlyRestDays, setMonthlyRestDays] = useState('4')
  const [maxSpecificDateRequests, setMaxSpecificDateRequests] = useState('2')
  const [allowRestAccumulation, setAllowRestAccumulation] = useState(false)
  const [maxAccumulatedDays, setMaxAccumulatedDays] = useState('2')
  const [allowConsecutiveRest, setAllowConsecutiveRest] = useState(true)
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState('2')
  const [description, setDescription] = useState('')

  // 顶岗规则表单状态
  const [enableBackupCheck, setEnableBackupCheck] = useState(false)
  const [backupRules, setBackupRules] = useState<BackupRule[]>([])
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [currentCoreEmployee, setCurrentCoreEmployee] = useState<Employee | null>(null)
  const [selectedBackupIds, setSelectedBackupIds] = useState<string[]>([])
  const [noSameDayOff, setNoSameDayOff] = useState(true)

  // 加载数据
  const loadData = useCallback(async () => {
    if (!currentTenant?.id || !currentStore?.id) {
      console.log('缺少租户或店铺信息', {currentTenant, currentStore})
      return
    }

    try {
      setLoading(true)
      // 加载排休规则
      const rulesData = await getRestDayRules(currentTenant.id, currentStore.id)
      setRules(rulesData)

      // 加载员工列表（用于顶岗配置）
      const employeesData = await getEmployeesByTenantId(currentTenant.id)
      setEmployees(employeesData)
    } catch (error) {
      console.error('加载数据失败:', error)
      Taro.showToast({
        title: '加载失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, currentStore?.id, currentStore, currentTenant])

  useDidShow(() => {
    loadData()
  })

  // 重置表单
  const resetForm = () => {
    setRuleName('')
    setMonthlyRestDays('4')
    setMaxSpecificDateRequests('2')
    setAllowRestAccumulation(false)
    setMaxAccumulatedDays('2')
    setAllowConsecutiveRest(true)
    setMaxConsecutiveDays('2')
    setDescription('')
    setEnableBackupCheck(false)
    setBackupRules([])
    setEditingRule(null)
  }

  // 打开新增对话框
  const handleCreate = () => {
    resetForm()
    setShowDialog(true)
  }

  // 打开编辑对话框
  const handleEdit = (rule: RestDayRule) => {
    setEditingRule(rule)
    setRuleName(rule.rule_name)
    setMonthlyRestDays(String(rule.monthly_rest_days))
    setMaxSpecificDateRequests(String(rule.max_specific_date_requests))
    setAllowRestAccumulation(rule.allow_rest_accumulation)
    setMaxAccumulatedDays(String(rule.max_accumulated_days))
    setAllowConsecutiveRest(rule.allow_consecutive_rest)
    setMaxConsecutiveDays(String(rule.max_consecutive_days))
    setDescription(rule.description || '')
    setEnableBackupCheck(rule.enable_backup_check)
    setBackupRules(rule.backup_rules || [])
    setShowDialog(true)
  }

  // 保存规则
  const handleSave = async () => {
    if (!currentTenant?.id || !currentStore?.id) return

    if (!ruleName.trim()) {
      Taro.showToast({title: '请输入规则名称', icon: 'none'})
      return
    }

    const monthlyDays = Number(monthlyRestDays)
    if (Number.isNaN(monthlyDays) || monthlyDays < 0) {
      Taro.showToast({title: '请输入有效的月休天数', icon: 'none'})
      return
    }

    setLoading(true)
    try {
      const ruleData: Omit<RestDayRule, 'id' | 'created_at' | 'updated_at'> = {
        tenant_id: currentTenant.id,
        store_id: currentStore.id,
        rule_name: ruleName.trim(),
        monthly_rest_days: monthlyDays,
        blocked_dates: [], // 初始化为空数组
        max_specific_date_requests: Number(maxSpecificDateRequests),
        allow_rest_accumulation: allowRestAccumulation,
        max_accumulated_days: Number(maxAccumulatedDays),
        allow_consecutive_rest: allowConsecutiveRest,
        max_consecutive_days: Number(maxConsecutiveDays),
        is_active: true, // 新规则默认激活
        applicable_employees: [], // 初始化为空数组，表示适用于所有员工
        priority: 0, // 默认优先级
        enable_backup_check: enableBackupCheck,
        backup_rules: backupRules, // 顶岗规则数组，每个规则内部包含no_same_day_off字段
        description: description.trim() || undefined
      }

      if (editingRule?.id) {
        await updateRestDayRule(editingRule.id, ruleData)
        Taro.showToast({title: '更新成功', icon: 'success'})
      } else {
        await createRestDayRule(ruleData)
        Taro.showToast({title: '创建成功', icon: 'success'})
      }

      setShowDialog(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('保存失败:', error)
      Taro.showToast({title: '保存失败，请重试', icon: 'none', duration: 2000})
    } finally {
      setLoading(false)
    }
  }

  // 删除规则
  const handleDelete = async (rule: RestDayRule) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除规则"${rule.rule_name}"吗？`,
      confirmText: '删除',
      cancelText: '取消'
    })

    if (!res.confirm) return

    setLoading(true)
    try {
      await deleteRestDayRule(rule.id)
      Taro.showToast({title: '删除成功', icon: 'success'})
      loadData()
    } catch (error) {
      console.error('删除失败:', error)
      Taro.showToast({title: '删除失败', icon: 'error'})
    } finally {
      setLoading(false)
    }
  }

  // 打开顶岗配置对话框
  const handleConfigBackup = (employee: Employee) => {
    setCurrentCoreEmployee(employee)
    // 查找该员工的现有顶岗配置
    const existingRule = backupRules.find((r) => r.core_employee_id === employee.id)
    setSelectedBackupIds(existingRule?.backup_employee_ids || [])
    setNoSameDayOff(existingRule?.no_same_day_off ?? true) // 加载是否禁止同休的值，默认为true
    setShowBackupDialog(true)
  }

  // 保存顶岗配置
  const handleSaveBackup = () => {
    if (!currentCoreEmployee) return

    if (selectedBackupIds.length === 0) {
      Taro.showToast({title: '请至少选择一个顶岗人员', icon: 'none'})
      return
    }

    // 更新或添加顶岗规则
    const newBackupRules = backupRules.filter((r) => r.core_employee_id !== currentCoreEmployee.id)
    newBackupRules.push({
      core_employee_id: currentCoreEmployee.id,
      core_position: currentCoreEmployee.position || '未知岗位', // 添加核心岗位名称
      backup_employee_ids: selectedBackupIds,
      no_same_day_off: noSameDayOff // 添加是否禁止同休字段
    })

    setBackupRules(newBackupRules)
    setShowBackupDialog(false)
    setCurrentCoreEmployee(null)
    setSelectedBackupIds([])
    setNoSameDayOff(true) // 重置为默认值

    Taro.showToast({title: '顶岗配置已保存', icon: 'success'})
  }

  // 切换顶岗人员选择
  const toggleBackupEmployee = (employeeId: string) => {
    if (selectedBackupIds.includes(employeeId)) {
      setSelectedBackupIds(selectedBackupIds.filter((id) => id !== employeeId))
    } else {
      setSelectedBackupIds([...selectedBackupIds, employeeId])
    }
  }

  // 核心岗位员工
  const coreEmployees = employees.filter((e) => e.is_core_position)

  if (!currentTenant || !currentStore) {
    return (
      <View className="min-h-screen bg-gray-50">
        <View className="flex items-center justify-center" style={{minHeight: '100vh'}}>
          <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center mx-4 shadow-sm">
            <View className="i-mdi-alert-circle-outline text-6xl text-blue-500 mx-auto mb-4" />
            <Text className="text-base text-foreground block mb-2">请先选择租户和门店</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <ScrollView scrollY className="box-border" style={{height: '100vh', background: 'transparent'}}>
        <View className="p-4">
          {/* 页面标题 */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-foreground block mb-2">排休规则配置</Text>
            <Text className="text-sm text-muted-foreground block">配置员工排休规则和顶岗原则</Text>
          </View>

          {/* 新增按钮 */}
          <View className="mb-6">
            <Button
              className="w-full bg-blue-100 text-white py-4 rounded-xl break-keep text-base"
              size="default"
              onClick={handleCreate}
              disabled={loading}>
              <View className="flex items-center justify-center gap-2">
                <View className="i-mdi-plus-circle text-xl text-foreground" />
                <Text className="text-blue-600 font-medium">新增排休规则</Text>
              </View>
            </Button>
          </View>

          {/* 规则列表 */}
          {loading && rules.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
              <View className="i-mdi-loading animate-spin text-4xl text-blue-500 mx-auto mb-3" />
              <Text className="text-muted-foreground">加载中...</Text>
            </View>
          ) : rules.length === 0 ? (
            <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center shadow-sm">
              <View className="i-mdi-calendar-remove text-6xl text-gray-300 mx-auto mb-4" />
              <Text className="text-foreground block mb-2">暂无排休规则</Text>
              <Text className="text-sm text-muted-foreground block">点击上方按钮新增排休规则</Text>
            </View>
          ) : (
            <View className="space-y-4">
              {rules.map((rule) => (
                <View
                  key={rule.id}
                  className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm border-l-4 border-blue-400">
                  {/* 规则标题 */}
                  <View className="flex items-start justify-between mb-3">
                    <View className="flex-1">
                      <View className="flex items-center gap-2 mb-2">
                        <View className="i-mdi-calendar-clock text-lg text-muted-foreground" />
                        <Text className="text-lg font-bold text-foreground">{rule.rule_name}</Text>
                      </View>
                      {rule.description && <Text className="text-sm text-muted-foreground">{rule.description}</Text>}
                    </View>
                  </View>

                  {/* 规则详情 */}
                  <View className="space-y-2 mb-3">
                    <View className="flex items-center justify-between bg-blue-100 rounded-lg p-3">
                      <Text className="text-sm text-foreground">月休天数</Text>
                      <Text className="text-sm font-bold text-muted-foreground">{rule.monthly_rest_days} 天</Text>
                    </View>

                    <View className="flex items-center justify-between bg-muted rounded-lg p-3">
                      <Text className="text-sm text-foreground">最多指定日期</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {rule.max_specific_date_requests} 次
                      </Text>
                    </View>

                    <View className="flex items-center justify-between bg-muted rounded-lg p-3">
                      <Text className="text-sm text-foreground">存休</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {rule.allow_rest_accumulation ? `允许（最多${rule.max_accumulated_days}天）` : '不允许'}
                      </Text>
                    </View>

                    <View className="flex items-center justify-between bg-muted rounded-lg p-3">
                      <Text className="text-sm text-foreground">连休</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {rule.allow_consecutive_rest ? `允许（最多${rule.max_consecutive_days}天）` : '不允许'}
                      </Text>
                    </View>

                    {rule.enable_backup_check && (
                      <View className="bg-blue-100 rounded-lg p-3">
                        <View className="flex items-center gap-2 mb-2">
                          <View className="i-mdi-account-switch text-base text-muted-foreground" />
                          <Text className="text-sm font-semibold text-foreground">已启用顶岗检查</Text>
                        </View>
                        {rule.backup_rules && rule.backup_rules.length > 0 && (
                          <Text className="text-xs text-muted-foreground mt-1">
                            已配置 {rule.backup_rules.length} 个核心岗位的顶岗规则
                          </Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* 操作按钮 */}
                  <View className="flex gap-2 pt-3 border-t border-gray-100">
                    <Button
                      className="flex-1 bg-blue-100 py-2 rounded-lg text-sm break-keep"
                      size="default"
                      onClick={() => handleEdit(rule)}
                      disabled={loading}>
                      <View className="flex items-center justify-center gap-1">
                        <View className="i-mdi-pencil text-base text-muted-foreground" />
                        <Text className="text-muted-foreground font-medium">编辑</Text>
                      </View>
                    </Button>
                    <Button
                      className="flex-1 bg-blue-100 py-2 rounded-lg text-sm break-keep"
                      size="default"
                      onClick={() => handleDelete(rule)}
                      disabled={loading}>
                      <View className="flex items-center justify-center gap-1">
                        <View className="i-mdi-delete text-base text-red-600" />
                        <Text className="text-red-600 font-medium">删除</Text>
                      </View>
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* 新增/编辑对话框 */}
      {showDialog && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{zIndex: 1000}}
          onClick={() => setShowDialog(false)}>
          <ScrollView
            scrollY
            className="bg-white rounded-lg w-full border border-border box-border"
            style={{maxWidth: '500px', maxHeight: '90vh'}}
            onClick={(e) => e.stopPropagation()}>
            <View className="p-6">
              {/* 标题 */}
              <View className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <View className="i-mdi-calendar-clock text-2xl text-muted-foreground" />
                <Text className="text-xl font-bold text-foreground">
                  {editingRule ? '编辑排休规则' : '新增排休规则'}
                </Text>
              </View>

              {/* 规则名称 */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-foreground mb-2 block">
                  规则名称 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-foreground"
                    placeholder="请输入规则名称"
                    value={ruleName}
                    onInput={(e) => setRuleName(e.detail.value)}
                  />
                </View>
              </View>

              {/* 月休天数 */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-foreground mb-2 block">
                  月休天数 <Text className="text-red-500">*</Text>
                </Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-foreground"
                    type="number"
                    placeholder="请输入月休天数"
                    value={monthlyRestDays}
                    onInput={(e) => setMonthlyRestDays(e.detail.value)}
                  />
                </View>
              </View>

              {/* 最多指定日期 */}
              <View className="mb-5">
                <Text className="text-sm font-medium text-foreground mb-2 block">最多指定日期次数</Text>
                <View style={{overflow: 'hidden'}}>
                  <Input
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-foreground"
                    type="number"
                    placeholder="请输入最多指定日期次数"
                    value={maxSpecificDateRequests}
                    onInput={(e) => setMaxSpecificDateRequests(e.detail.value)}
                  />
                </View>
              </View>

              {/* 存休设置 */}
              <View className="mb-5">
                <View className="flex items-center justify-between mb-3">
                  <Text className="text-sm font-medium text-foreground">允许存休</Text>
                  <Switch checked={allowRestAccumulation} onChange={(e) => setAllowRestAccumulation(e.detail.value)} />
                </View>
                {allowRestAccumulation && (
                  <View style={{overflow: 'hidden'}}>
                    <Input
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-foreground"
                      type="number"
                      placeholder="最多存休天数"
                      value={maxAccumulatedDays}
                      onInput={(e) => setMaxAccumulatedDays(e.detail.value)}
                    />
                  </View>
                )}
              </View>

              {/* 连休设置 */}
              <View className="mb-5">
                <View className="flex items-center justify-between mb-3">
                  <Text className="text-sm font-medium text-foreground">允许连休</Text>
                  <Switch checked={allowConsecutiveRest} onChange={(e) => setAllowConsecutiveRest(e.detail.value)} />
                </View>
                {allowConsecutiveRest && (
                  <View style={{overflow: 'hidden'}}>
                    <Input
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-foreground"
                      type="number"
                      placeholder="最多连休天数"
                      value={maxConsecutiveDays}
                      onInput={(e) => setMaxConsecutiveDays(e.detail.value)}
                    />
                  </View>
                )}
              </View>

              {/* 顶岗检查 */}
              <View className="mb-5">
                <View className="flex items-center justify-between mb-3">
                  <Text className="text-sm font-medium text-foreground">启用顶岗检查</Text>
                  <Switch checked={enableBackupCheck} onChange={(e) => setEnableBackupCheck(e.detail.value)} />
                </View>
                {enableBackupCheck && (
                  <View>
                    <View className="flex items-center justify-between mb-3">
                      <Text className="text-sm text-foreground">核心岗位与顶岗人员不可同时休息</Text>
                      <Switch checked={noSameDayOff} onChange={(e) => setNoSameDayOff(e.detail.value)} />
                    </View>

                    {/* 顶岗配置列表 */}
                    <View className="bg-muted rounded-xl p-3">
                      <Text className="text-sm font-medium text-foreground mb-3 block">顶岗配置</Text>
                      {coreEmployees.length === 0 ? (
                        <Text className="text-sm text-muted-foreground">暂无核心岗位员工</Text>
                      ) : (
                        <View className="space-y-2">
                          {coreEmployees.map((emp) => {
                            const backupRule = backupRules.find((r) => r.core_employee_id === emp.id)
                            return (
                              <View
                                key={emp.id}
                                className="flex items-center justify-between bg-white rounded-lg p-2 border-2 border-gray-200">
                                <Text className="text-sm text-foreground">{emp.name}</Text>
                                <Button
                                  className="bg-blue-100 px-3 py-1 rounded-lg text-xs break-keep"
                                  size="default"
                                  onClick={() => handleConfigBackup(emp)}>
                                  <Text className="text-muted-foreground">
                                    {backupRule ? `已配置(${backupRule.backup_employee_ids.length})` : '配置'}
                                  </Text>
                                </Button>
                              </View>
                            )
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* 描述 */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2 block">描述</Text>
                <View style={{overflow: 'hidden'}}>
                  <Textarea
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base text-foreground"
                    placeholder="请输入描述（选填）"
                    value={description}
                    onInput={(e) => setDescription(e.detail.value)}
                    maxlength={200}
                    style={{height: '100px'}}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">{description.length}/200</Text>
              </View>

              {/* 按钮 */}
              <View className="flex gap-3">
                <Button
                  className="flex-1 bg-muted py-3 rounded-xl text-base break-keep"
                  size="default"
                  onClick={() => setShowDialog(false)}>
                  <Text className="text-foreground font-medium">取消</Text>
                </Button>
                <Button
                  className="flex-1 bg-blue-100 py-3 rounded-xl text-base break-keep"
                  size="default"
                  onClick={handleSave}
                  disabled={loading}>
                  <Text className="text-blue-600 font-medium">{loading ? '保存中...' : '保存'}</Text>
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* 顶岗配置对话框 */}
      {showBackupDialog && currentCoreEmployee && (
        <View
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{zIndex: 1001}}
          onClick={() => setShowBackupDialog(false)}>
          <View
            className="bg-white rounded-lg p-6 border-2 border-gray-200 w-full border border-border"
            style={{maxWidth: '500px', maxHeight: '70vh'}}
            onClick={(e) => e.stopPropagation()}>
            {/* 标题 */}
            <View className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <View className="i-mdi-account-switch text-2xl text-muted-foreground" />
              <Text className="text-xl font-bold text-foreground">配置顶岗人员</Text>
            </View>

            <Text className="text-sm text-foreground mb-4 block">
              为 <Text className="font-bold text-foreground">{currentCoreEmployee.name}</Text> 选择顶岗人员
            </Text>

            {/* 员工列表 */}
            <ScrollView scrollY style={{maxHeight: '300px'}} className="mb-6">
              <View className="space-y-2">
                {employees
                  .filter((e) => e.id !== currentCoreEmployee.id)
                  .map((emp) => (
                    <View
                      key={emp.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        selectedBackupIds.includes(emp.id) ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'
                      }`}
                      onClick={() => toggleBackupEmployee(emp.id)}>
                      <View className="flex items-center gap-2">
                        <View
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedBackupIds.includes(emp.id) ? 'bg-blue-100 border-blue-500' : 'border-gray-300'
                          }`}>
                          {selectedBackupIds.includes(emp.id) && <View className="i-mdi-check text-xs text-blue-600" />}
                        </View>
                        <Text className="text-sm text-foreground">{emp.name}</Text>
                      </View>
                      {emp.is_core_position && (
                        <View className="px-2 py-0.5 bg-orange-100 rounded">
                          <Text className="text-xs text-muted-foreground">核心岗位</Text>
                        </View>
                      )}
                    </View>
                  ))}
              </View>
            </ScrollView>

            {/* 按钮 */}
            <View className="flex gap-3">
              <Button
                className="flex-1 bg-muted py-3 rounded-xl text-base break-keep"
                size="default"
                onClick={() => setShowBackupDialog(false)}>
                <Text className="text-foreground font-medium">取消</Text>
              </Button>
              <Button
                className="flex-1 bg-green-600 py-3 rounded-xl text-base break-keep"
                size="default"
                onClick={handleSaveBackup}>
                <Text className="text-white font-medium">确定</Text>
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
