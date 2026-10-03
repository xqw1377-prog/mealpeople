import {Button, Input, Picker, Text, View} from '@tarojs/components'
import Taro, {useDidShow} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import {useCallback, useEffect, useState} from 'react'
import {supabase} from '@/client/supabase'
import {
  calculateRevenueZone,
  createPartTimeShift,
  createSchedule,
  createScheduleLog,
  deletePartTimeShift,
  getDailyOperation,
  getEmployeesByStoreId,
  getPartTimeShiftsByDate,
  getScheduleAdjustmentHistory,
  getScheduleResultByDate,
  getStoreEfficiencyStandard,
  getTenantSettings,
  insertScheduleResult,
  updatePartTimeShift,
  upsertDailyOperation,
  upsertScheduleResult
} from '@/db/api'
import {getMealPeriods, type MealPeriod} from '@/db/api-meal-periods' // ✅ 导入餐段API
import type {EfficiencyStandard, Employee, PartTimeShift, TenantSettings} from '@/db/types'
import {useTenantStore} from '@/store/tenant'

export default function SchedulePlanning() {
  const {user} = useAuth({guard: true})
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore) // 使用全局门店
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [estimatedRevenue, setEstimatedRevenue] = useState('')
  const [plannedStaffCount, setPlannedStaffCount] = useState('') // 改为人数
  const [plannedPartTimeHours, setPlannedPartTimeHours] = useState('') // 兼职工时
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [standard, setStandard] = useState<EfficiencyStandard | null>(null)
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null)
  const [zoneInfo, setZoneInfo] = useState<{
    zone: string
    zoneName: string
    efficiencyStandard: number
    managementMotto: string
    targetStaffCount: number // 改为人数
    targetTotalHours: number // 总人数
  } | null>(null)

  // ✅ 新增：餐段配置状态
  const [_mealPeriods, setMealPeriods] = useState<MealPeriod[]>([])
  const [mealPeriodNames, setMealPeriodNames] = useState<string[]>([])

  // 第四步相关state
  const [employees, setEmployees] = useState<Employee[]>([]) // 员工列表
  const [partTimeShifts, setPartTimeShifts] = useState<PartTimeShift[]>([]) // 兼职记录列表
  const [showQuickRestModal, setShowQuickRestModal] = useState(false) // 快速排休弹窗
  const [showPartTimeModal, setShowPartTimeModal] = useState(false) // 增加兼职弹窗
  const [scheduleResult, setScheduleResult] = useState<any>(null) // 排班结果
  const [restEmployeeIds, setRestEmployeeIds] = useState<string[]>([]) // 排休员工ID列表
  const [restMealPeriod, setRestMealPeriod] = useState<string>('all_day') // ✅ 改为string类型，支持动态餐段
  const [restHours, setRestHours] = useState<string>('') // 排休小时数（弹窗中输入）
  const [confirmedRestMealPeriod, setConfirmedRestMealPeriod] = useState<string>('all_day') // ✅ 改为string类型
  const [confirmedRestHours, setConfirmedRestHours] = useState<number>(0) // 已确认的排休小时数

  // 当选择全天时，自动设置为工作时长
  useEffect(() => {
    if (restMealPeriod === 'all_day' && tenantSettings?.default_daily_work_hours) {
      setRestHours(tenantSettings.default_daily_work_hours.toString())
    }
  }, [restMealPeriod, tenantSettings?.default_daily_work_hours])

  // 兼职表单state
  const [partTimeForm, setPartTimeForm] = useState({
    employee_name: '',
    phone: '', // 新增：电话字段
    work_hours: '',
    hourly_rate: '',
    meal_period: '',
    notes: ''
  })
  const [editingPartTimeId, setEditingPartTimeId] = useState<string | null>(null) // 正在编辑的兼职ID

  // 编辑模式state
  const [isEditMode, setIsEditMode] = useState(false) // 是否处于编辑模式
  const [adjustmentHistory, setAdjustmentHistory] = useState<any[]>([]) // 调整历史记录
  const [showHistory, setShowHistory] = useState(false) // 是否显示历史记录

  // 加载店铺列表
  // 加载租户配置
  const loadTenantSettings = useCallback(async () => {
    if (!currentTenant?.id) return
    const settings = await getTenantSettings(currentTenant?.id)
    setTenantSettings(settings)
  }, [currentTenant?.id])

  // ✅ 新增：加载餐段配置
  const loadMealPeriods = useCallback(async () => {
    if (!currentTenant?.id) return

    try {
      // 优先加载门店级别的餐段配置，如果没有则加载租户级别的
      let periods = await getMealPeriods(currentTenant.id, currentStore?.id)

      // 如果门店级别没有配置，尝试加载租户级别的
      if (periods.length === 0 && currentStore?.id) {
        periods = await getMealPeriods(currentTenant.id)
      }

      // 过滤出激活的餐段
      const activePeriods = periods.filter((p) => p.is_active)
      setMealPeriods(activePeriods)

      // 提取餐段名称用于选择器
      const names = activePeriods.map((p) => p.period_name)
      setMealPeriodNames(names)

      console.log('✅ 加载餐段配置成功:', {
        租户ID: currentTenant.id,
        门店ID: currentStore?.id,
        餐段数量: activePeriods.length,
        餐段列表: names
      })
    } catch (error) {
      console.error('❌ 加载餐段配置失败:', error)
      // 如果加载失败，使用默认餐段
      setMealPeriodNames([])
    }
  }, [currentTenant?.id, currentStore?.id])

  // 加载效能标准
  const loadStandard = useCallback(async () => {
    if (!currentTenant?.id || !currentStore?.id) {
      console.log('loadStandard: 缺少必要参数', {
        tenantId: currentTenant?.id,
        storeId: currentStore?.id
      })
      return
    }

    console.log('loadStandard: 开始加载效能标准', {
      tenantId: currentTenant?.id,
      storeId: currentStore.id
    })

    const config = await getStoreEfficiencyStandard(currentTenant?.id, currentStore.id)
    console.log('loadStandard: 加载结果', config)
    setStandard(config)
  }, [currentTenant?.id, currentStore?.id])

  // 加载已有的运营记录
  const loadOperation = useCallback(async () => {
    if (!currentTenant?.id || !currentStore?.id || !selectedDate) return

    setLoading(true)
    try {
      const operation = await getDailyOperation(currentTenant?.id, currentStore.id, selectedDate)
      if (operation) {
        setEstimatedRevenue(operation.estimated_revenue?.toString() || '')
        setPlannedStaffCount(operation.planned_staff_count?.toString() || '')
        setPlannedPartTimeHours(operation.planned_part_time_hours?.toString() || '0')
      } else {
        setEstimatedRevenue('')
        setPlannedStaffCount('')
        setPlannedPartTimeHours('0')
      }
    } finally {
      setLoading(false)
    }
  }, [currentTenant?.id, selectedDate, currentStore?.id])

  // 加载员工列表
  const loadEmployees = useCallback(async () => {
    if (!currentStore?.id) {
      console.log('=== loadEmployees: 缺少store_id，跳过加载 ===', {
        storeId: currentStore?.id
      })
      return
    }

    console.log('=== 开始加载员工数据 ===', {
      storeId: currentStore.id,
      storeName: currentStore.name
    })

    const employeeList = await getEmployeesByStoreId(currentStore.id)
    console.log('=== 员工数据加载完成 ===', {
      员工数量: employeeList.length,
      员工列表: employeeList
    })

    setEmployees(employeeList)
  }, [currentStore?.id, currentStore?.name])

  // 加载兼职记录
  const loadPartTimeShifts = useCallback(async () => {
    if (!currentTenant?.id || !currentStore?.id || !selectedDate) return
    const shifts = await getPartTimeShiftsByDate(currentTenant?.id, currentStore.id, selectedDate)
    setPartTimeShifts(shifts)
  }, [currentTenant?.id, selectedDate, currentStore?.id])

  // 加载调整历史
  const loadAdjustmentHistory = useCallback(async () => {
    if (!currentTenant?.id || !currentStore?.id || !selectedDate) return
    const history = await getScheduleAdjustmentHistory(currentTenant.id, currentStore.id, selectedDate, selectedDate)
    console.log('=== 调整历史加载完成 ===', {
      历史记录数: history.length,
      历史记录: history
    })
    setAdjustmentHistory(history)
  }, [currentTenant?.id, currentStore?.id, selectedDate])

  // 加载排班结果
  const loadScheduleResult = useCallback(async () => {
    if (!currentTenant?.id || !currentStore?.id || !selectedDate) return

    console.log('=== loadScheduleResult 开始 ===', {
      tenantId: currentTenant?.id,
      storeId: currentStore.id,
      date: selectedDate
    })

    const result = await getScheduleResultByDate(currentTenant?.id, currentStore.id, selectedDate)
    console.log('=== 查询到的排班结果 ===', result)

    if (result) {
      // 重新查询员工和兼职数据，避免依赖state导致循环更新
      const employeeList = await getEmployeesByStoreId(currentStore.id)
      const partTimeList = await getPartTimeShiftsByDate(currentTenant?.id, currentStore.id, selectedDate)

      console.log('=== 员工和兼职数据 ===', {
        员工数: employeeList.length,
        兼职数: partTimeList.length
      })

      // 从数据库中获取排班记录，确定哪些员工有排班（上岗）
      const {data: schedules} = await supabase
        .from('schedules')
        .select('employee_id')
        .eq('tenant_id', currentTenant?.id)
        .eq('store_id', currentStore.id)
        .eq('schedule_date', selectedDate)

      console.log('=== 排班记录 ===', schedules)

      // 有排班记录的员工ID列表（上岗员工）
      const workingEmployeeIds = schedules ? schedules.map((s) => s.employee_id) : []

      // 计算上岗员工（有排班记录的员工）
      const workingEmployees = employeeList.filter((emp) => workingEmployeeIds.includes(emp.id))
      const monthlyDays = 30

      console.log('=== 上岗员工 ===', {
        上岗员工数: workingEmployees.length,
        上岗员工: workingEmployees.map((e) => e.name)
      })

      // 计算正式员工成本
      let regularCost = 0
      if (workingEmployees.some((emp) => emp.monthly_salary)) {
        regularCost = workingEmployees.reduce((sum, emp) => {
          const monthlySalary = emp.monthly_salary || 5000
          const dailySalary = monthlySalary / monthlyDays
          return sum + dailySalary
        }, 0)
      } else {
        const avgSalary = 5000
        const dailySalary = avgSalary / monthlyDays
        regularCost = result.planned_staff_count * dailySalary
      }

      // 计算兼职成本
      const partTimeCost = partTimeList.reduce((sum, shift) => sum + shift.total_cost, 0)

      console.log('=== 成本计算 ===', {
        正式员工成本: regularCost.toFixed(2),
        兼职成本: partTimeCost.toFixed(2),
        总成本: (regularCost + partTimeCost).toFixed(2)
      })

      // 设置完整的排班结果
      const fullResult = {
        ...result,
        regular_cost: regularCost,
        part_time_cost: partTimeCost,
        working_employee_count: workingEmployees.length || result.planned_staff_count
      }

      console.log('=== 设置排班结果到state ===', fullResult)
      setScheduleResult(fullResult)
    } else {
      console.log('=== 没有找到排班结果 ===')
      setScheduleResult(null)
    }
  }, [currentTenant?.id, selectedDate, currentStore?.id])

  // 计算营收区间信息
  useEffect(() => {
    if (estimatedRevenue && standard && tenantSettings) {
      const revenue = Number(estimatedRevenue)
      if (revenue > 0) {
        const info = calculateRevenueZone(revenue, standard)

        // 计算目标人数和工时
        // 效能标准单位：元/人/日
        // 目标人数 = 预估营收 ÷ 效能标准
        const targetStaffCount = revenue / info.efficiency
        const dailyHours = tenantSettings.default_daily_work_hours || 8
        // 目标总工时 = 目标人数 × 每天工作小时数
        const targetTotalHours = targetStaffCount * dailyHours

        // 直接使用返回的目标人数和目标工时
        setZoneInfo({
          zone: info.zone,
          zoneName: info.zone === 'low' ? '低营收' : info.zone === 'normal' ? '正常营收' : '高营收',
          efficiencyStandard: info.efficiency,
          managementMotto: info.motto,
          targetStaffCount: Math.ceil(targetStaffCount), // 向上取整
          targetTotalHours: targetTotalHours
        })

        // 自动填充目标人数
        if (!plannedStaffCount) {
          setPlannedStaffCount(Math.ceil(targetStaffCount).toString())
        }
      } else {
        setZoneInfo(null)
      }
    } else {
      setZoneInfo(null)
    }
  }, [estimatedRevenue, standard, tenantSettings, plannedStaffCount])

  // 保存排班规划并生成排班结果
  const handleSave = async () => {
    console.log('=== 开始保存排班规划 ===')

    if (!currentTenant?.id || !currentStore?.id) {
      console.error('缺少必要信息: tenant_id或store_id为空')
      Taro.showToast({title: '缺少必要信息', icon: 'none'})
      return
    }

    if (!estimatedRevenue || !plannedStaffCount) {
      console.warn('用户未填写完整信息')
      Taro.showToast({title: '请填写完整信息', icon: 'none'})
      return
    }

    const revenue = Number(estimatedRevenue)
    const staffCount = Number(plannedStaffCount)

    if (revenue <= 0 || staffCount <= 0) {
      console.warn('数值无效:', {revenue, staffCount})
      Taro.showToast({title: '请输入有效的数值', icon: 'none'})
      return
    }

    // 验证正式工人数不能超过在职员工数
    const fullTimeCount = employees.filter((emp) => emp.employee_type === 'full_time').length
    if (staffCount > fullTimeCount) {
      Taro.showToast({
        title: `正式工人数（${staffCount}）不能超过在职员工数（${fullTimeCount}）`,
        icon: 'none',
        duration: 2000
      })
      return
    }

    setSaving(true)
    try {
      // 计算排休人数
      const restStaffCount = restEmployeeIds.length

      // 1. 保存运营数据（包含排休人数）
      const operationData = {
        tenant_id: currentTenant.id, // 移除可选链，因为前面已经检查过了
        store_id: currentStore.id,
        operation_date: selectedDate,
        estimated_revenue: revenue,
        planned_staff_count: staffCount,
        planned_rest_count: restStaffCount // 添加计划排休人数
      }
      await upsertDailyOperation(operationData)

      // 2. 生成排班结果
      if (zoneInfo && tenantSettings && standard) {
        // 计算排班结果
        const dailyHours = tenantSettings.default_daily_work_hours || 8
        const totalEmployees = employees.length

        // 排休人数应该使用实际选择的排休员工数量
        const restStaffCount = restEmployeeIds.length

        console.log('=== 排班人员统计 ===', {
          总员工数: totalEmployees,
          计划上岗人数: staffCount,
          实际排休人数: restStaffCount,
          排休员工IDs: restEmployeeIds,
          排休员工名单: employees.filter((e) => restEmployeeIds.includes(e.id)).map((e) => e.name)
        })

        const partTimeCount = partTimeShifts.length
        const totalPartTimeHours = partTimeShifts.reduce((sum, shift) => sum + shift.work_hours, 0)

        // 计算总工时
        const regularTotalHours = staffCount * dailyHours
        const actualTotalHours = regularTotalHours + totalPartTimeHours

        // 计算达成率
        const achievementRate = zoneInfo.targetTotalHours > 0 ? (actualTotalHours / zoneInfo.targetTotalHours) * 100 : 0

        // 计算人力成本 - 使用实际员工薪酬
        // 1. 计算上岗员工的日薪总和
        const workingEmployees = employees.filter((emp) => !restEmployeeIds.includes(emp.id))
        const monthlyDays = 30
        let regularCost = 0

        // 如果有实际薪酬数据，使用实际数据；否则使用默认值
        if (workingEmployees.some((emp) => emp.monthly_salary)) {
          regularCost = workingEmployees.reduce((sum, emp) => {
            const monthlySalary = emp.monthly_salary || 5000 // 如果没有薪酬数据，使用默认5000
            // 日薪 = 月薪总额 / 月总天数（月薪已包含公休天数的工资）
            const dailySalary = monthlySalary / monthlyDays
            return sum + dailySalary
          }, 0)
        } else {
          // 如果所有员工都没有薪酬数据，使用平均值估算
          const avgSalary = 5000
          const dailySalary = avgSalary / monthlyDays
          regularCost = staffCount * dailySalary
        }

        // 2. 计算兼职成本
        const partTimeCost = partTimeShifts.reduce((sum, shift) => sum + shift.total_cost, 0)

        // 3. 总人力成本
        const totalLaborCost = regularCost + partTimeCost

        // 计算人力成本率
        const laborCostRate = revenue > 0 ? (totalLaborCost / revenue) * 100 : 0

        // 判断成本是否合格（餐饮业人力成本率应控制在25%以内，20%以内为优秀）
        const isCostQualified = laborCostRate <= 25

        // 确保所有必需字段都有有效值
        const targetStaffCount = Math.max(1, zoneInfo.targetStaffCount || 1) // 确保至少为1
        const safeRestStaffCount = Math.max(0, restStaffCount) // 确保非负
        const safePartTimeCount = Math.max(0, partTimeCount) // 确保非负
        const safePartTimeHours = Math.max(0, totalPartTimeHours) // 确保非负
        const safeAchievementRate = Math.max(0, achievementRate) // 确保非负
        const safeTotalLaborCost = Math.max(0, totalLaborCost) // 确保非负
        const safeLaborCostRate = Math.max(0, laborCostRate) // 确保非负

        // 计算排休天数（如果有排休小时数，则计算；否则默认为0）
        const restDays = restHours ? Number(restHours) / 8 : 0

        const scheduleResultData = {
          tenant_id: currentTenant.id, // 移除可选链，因为前面已经检查过了
          store_id: currentStore.id,
          operation_date: selectedDate,
          estimated_revenue: revenue,
          target_staff_count: targetStaffCount,
          planned_staff_count: staffCount,
          rest_staff_count: safeRestStaffCount,
          rest_days: restDays, // 添加排休天数
          part_time_count: safePartTimeCount,
          part_time_hours: safePartTimeHours,
          achievement_rate: safeAchievementRate,
          total_labor_cost: safeTotalLaborCost,
          labor_cost_rate: safeLaborCostRate,
          is_cost_qualified: isCostQualified,
          efficiency_zone: zoneInfo.zone
        }

        console.log('=== 排班结果数据 ===', {
          上岗员工数: workingEmployees.length,
          正式员工成本: regularCost.toFixed(2),
          兼职成本: partTimeCost.toFixed(2),
          总人力成本: totalLaborCost.toFixed(2),
          人力成本率: `${laborCostRate.toFixed(2)}%`,
          完整数据: scheduleResultData
        })

        console.log('=== 开始保存排班结果到数据库 ===')

        // 判断是首次规划还是重新规划
        const existingResult = scheduleResult
        const isReplan = isEditMode && existingResult

        let finalScheduleResultData: any = {...scheduleResultData}

        if (isReplan) {
          // 重新规划：记录调整信息
          const adjustmentDetails = {
            revenue: {
              old: existingResult.estimated_revenue,
              new: revenue
            },
            staffCount: {
              old: existingResult.planned_staff_count,
              new: staffCount
            },
            restStaff: {
              old: existingResult.rest_staff_count,
              new: safeRestStaffCount
            },
            tempWorkers: {
              old: existingResult.part_time_count,
              new: safePartTimeCount
            }
          }

          finalScheduleResultData = {
            ...scheduleResultData,
            adjustment_type: '重新规划',
            previous_result_id: existingResult.id,
            adjustment_details: adjustmentDetails,
            adjusted_by: user?.id,
            is_latest: true
          }

          console.log('=== 重新规划，记录调整信息 ===', {
            调整类型: '重新规划',
            上一次结果ID: existingResult.id,
            调整详情: adjustmentDetails
          })
        } else {
          // 首次规划
          finalScheduleResultData = {
            ...scheduleResultData,
            adjustment_type: '首次规划',
            is_latest: true
          }

          console.log('=== 首次规划 ===')
        }

        // 使用insertScheduleResult插入新记录
        const result = await insertScheduleResult(finalScheduleResultData)
        console.log('=== 排班结果保存完成 ===', result)

        if (!result) {
          console.error('=== 排班结果保存失败，返回null ===')
          throw new Error('保存排班结果失败，请检查数据库连接或数据格式')
        }

        // 保存额外的成本明细到state，用于显示
        const fullScheduleResult = {
          ...result,
          regular_cost: regularCost,
          part_time_cost: partTimeCost,
          working_employee_count: workingEmployees.length
        }
        console.log('=== 排班结果已更新到state ===', {
          排休人数: fullScheduleResult.rest_staff_count,
          上岗人数: fullScheduleResult.working_employee_count,
          计划人数: fullScheduleResult.planned_staff_count,
          完整结果: fullScheduleResult
        })
        setScheduleResult(fullScheduleResult)
      } else {
        console.warn('=== 缺少必要信息，无法生成排班结果 ===', {
          hasZoneInfo: !!zoneInfo,
          hasTenantSettings: !!tenantSettings,
          hasStandard: !!standard
        })
      }

      // 3. 为上岗员工创建排班任务和排班日志
      const workingEmployees = employees.filter((emp) => !restEmployeeIds.includes(emp.id))
      console.log('=== 开始创建排班任务和日志 ===', {
        上岗员工数: workingEmployees.length,
        员工列表: workingEmployees.map((e) => e.name)
      })

      for (const employee of workingEmployees) {
        try {
          // 创建排班任务
          const schedule = await createSchedule({
            tenant_id: currentTenant.id, // 移除可选链
            store_id: currentStore.id,
            employee_id: employee.id,
            schedule_date: selectedDate,
            shift_type: 'regular', // 正常班次
            status: 'pending', // 待执行
            notes: `排班规划自动生成 - 预估营收: ¥${revenue}`
          })

          if (schedule) {
            // 创建排班日志（初始状态）
            await createScheduleLog({
              tenant_id: currentTenant.id, // 移除可选链
              schedule_id: schedule.id,
              employee_id: employee.id,
              store_id: currentStore.id,
              log_date: selectedDate,
              completion_status: 'pending', // 待完成
              notes: '排班规划自动生成'
            })
            console.log(`✓ 已为员工 ${employee.name} 创建排班任务和日志`)
          }
        } catch (error) {
          console.error(`为员工 ${employee.name} 创建排班任务失败:`, error)
        }
      }

      console.log('=== 排班任务和日志创建完成 ===')

      // 如果是编辑模式，退出编辑模式
      if (isEditMode) {
        setIsEditMode(false)
      }

      // 🔥 添加延迟确保数据已保存到数据库
      console.log('=== 等待数据库写入完成 ===')
      await new Promise((resolve) => setTimeout(resolve, 800))

      // 重新加载数据
      console.log('=== 开始重新加载排班结果 ===')
      await loadScheduleResult()
      console.log('=== 排班结果加载完成 ===')

      // 重新加载调整历史
      console.log('=== 开始重新加载调整历史 ===')
      await loadAdjustmentHistory()
      console.log('=== 调整历史加载完成 ===')

      // 显示成功提示
      if (isEditMode) {
        Taro.showToast({title: '排班调整已保存', icon: 'success'})
      } else {
        Taro.showToast({title: '保存成功', icon: 'success'})
      }

      // 触发首页数据刷新事件
      console.log('=== 触发首页数据刷新事件 ===', {
        date: selectedDate,
        storeId: currentStore.id,
        tenantId: currentTenant.id
      })
      Taro.eventCenter.trigger('scheduleDataUpdated', {
        date: selectedDate,
        storeId: currentStore.id,
        tenantId: currentTenant.id
      })
      console.log('=== 事件已触发 ===')
    } catch (err) {
      console.error('保存排班规划时发生异常:', err)
      Taro.showToast({
        title: `保存失败: ${err instanceof Error ? err.message : '未知错误'}`,
        icon: 'none',
        duration: 3000
      })
    } finally {
      setSaving(false)
    }
  }

  // 添加/编辑兼职记录
  const handleAddPartTime = async () => {
    if (!currentTenant?.id || !currentStore?.id) {
      Taro.showToast({title: '缺少必要信息', icon: 'none'})
      return
    }

    if (!partTimeForm.employee_name || !partTimeForm.work_hours || !partTimeForm.hourly_rate) {
      Taro.showToast({title: '请填写完整信息', icon: 'none'})
      return
    }

    const workHours = Number(partTimeForm.work_hours)
    const hourlyRate = Number(partTimeForm.hourly_rate)

    if (workHours <= 0 || hourlyRate <= 0) {
      Taro.showToast({title: '请输入有效的数值', icon: 'none'})
      return
    }

    const totalCost = workHours * hourlyRate

    try {
      const shiftData = {
        tenant_id: currentTenant?.id,
        store_id: currentStore.id,
        operation_date: selectedDate,
        employee_name: partTimeForm.employee_name,
        phone: partTimeForm.phone || null,
        work_hours: workHours,
        hourly_rate: hourlyRate,
        total_cost: totalCost,
        meal_period: partTimeForm.meal_period || null,
        notes: partTimeForm.notes || null
      }

      if (editingPartTimeId) {
        // 编辑模式：更新现有记录
        console.log('更新兼职记录:', {id: editingPartTimeId, data: shiftData})
        const result = await updatePartTimeShift(editingPartTimeId, shiftData)
        if (result) {
          Taro.showToast({title: '修改成功', icon: 'success'})
        } else {
          throw new Error('更新失败')
        }
      } else {
        // 新增模式：创建新记录
        console.log('创建兼职记录:', shiftData)
        const result = await createPartTimeShift(shiftData)
        if (result) {
          Taro.showToast({title: '添加成功', icon: 'success'})
        } else {
          throw new Error('创建失败')
        }
      }

      setShowPartTimeModal(false)
      setEditingPartTimeId(null)
      setPartTimeForm({
        employee_name: '',
        phone: '',
        work_hours: '',
        hourly_rate: '',
        meal_period: '',
        notes: ''
      })
      await loadPartTimeShifts()
    } catch (err) {
      console.error('保存兼职记录失败:', err)
      Taro.showToast({title: `保存失败: ${err.message || '未知错误'}`, icon: 'none', duration: 3000})
    }
  }

  // 编辑兼职记录
  const handleEditPartTime = (shift: PartTimeShift) => {
    setEditingPartTimeId(shift.id)
    setPartTimeForm({
      employee_name: shift.employee_name,
      phone: shift.phone || '',
      work_hours: shift.work_hours.toString(),
      hourly_rate: shift.hourly_rate.toString(),
      meal_period: shift.meal_period || '',
      notes: shift.notes || ''
    })
    setShowPartTimeModal(true)
  }

  // 删除兼职记录
  const handleDeletePartTime = async (shiftId: string) => {
    try {
      const result = await Taro.showModal({
        title: '确认删除',
        content: '确定要删除这条兼职记录吗？',
        confirmText: '删除',
        cancelText: '取消'
      })

      if (result.confirm) {
        console.log('删除兼职记录:', shiftId)
        const success = await deletePartTimeShift(shiftId)
        if (success) {
          Taro.showToast({title: '删除成功', icon: 'success'})
          await loadPartTimeShifts()
        } else {
          throw new Error('删除失败')
        }
      }
    } catch (err) {
      console.error('删除兼职记录失败:', err)
      Taro.showToast({title: `删除失败: ${err.message || '未知错误'}`, icon: 'none', duration: 3000})
    }
  }

  // 切换员工排休状态
  const toggleRestEmployee = (employeeId: string) => {
    setRestEmployeeIds((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId)
      }
      return [...prev, employeeId]
    })
  }

  // 确认快速排休
  const handleConfirmRest = async () => {
    if (restEmployeeIds.length === 0) {
      Taro.showToast({title: '请至少选择一名员工排休', icon: 'none'})
      return
    }

    // 验证小时数
    const hours = restHours ? Number(restHours) : 0
    const maxHours = tenantSettings?.default_daily_work_hours || 8

    if (hours <= 0) {
      Taro.showToast({title: '请输入有效的排休小时数', icon: 'none', duration: 2000})
      return
    }

    if (hours > maxHours) {
      Taro.showToast({
        title: `排休小时数不能超过工作时长（${maxHours}小时）`,
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 计算排休天数（8小时=1天）
    const days = hours / 8

    // ✅ 获取餐段名称（支持动态餐段）
    const periodName = restMealPeriod === 'all_day' ? '全天' : restMealPeriod

    try {
      // 保存已确认的餐段和时长
      setConfirmedRestMealPeriod(restMealPeriod)
      setConfirmedRestHours(hours)

      // 如果已经有排班结果，更新排休信息
      if (scheduleResult) {
        const updatedResult = {
          ...scheduleResult,
          rest_staff_count: restEmployeeIds.length,
          rest_days: days
        }

        // 保存到数据库
        const result = await upsertScheduleResult(updatedResult)
        if (result) {
          setScheduleResult(result)
          console.log('✅ 排休信息已更新到排班结果', {
            排休人数: restEmployeeIds.length,
            排休天数: days,
            排休小时: hours,
            排休餐段: periodName
          })
        }
      }

      Taro.showToast({
        title: `已为 ${restEmployeeIds.length} 名员工排休（${periodName} ${hours}小时/${days}天）`,
        icon: 'success',
        duration: 2000
      })
      setShowQuickRestModal(false)
      // 重置餐段选择和小时数为默认值
      setRestMealPeriod('all_day')
      setRestHours('')

      // 重新加载排班结果
      loadScheduleResult()
    } catch (error) {
      console.error('保存排休信息失败:', error)
      Taro.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    }
  }

  // 启用编辑模式
  const handleEnableEdit = () => {
    setIsEditMode(true)
    Taro.showToast({
      title: '已进入编辑模式，可以修改数据',
      icon: 'none',
      duration: 2000
    })
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditMode(false)
    // 恢复原始数据
    loadOperation()
    loadScheduleResult()
    Taro.showToast({
      title: '已取消调整，恢复原始数据',
      icon: 'none',
      duration: 2000
    })
  }

  // 首次加载租户配置
  useEffect(() => {
    loadTenantSettings()
  }, [loadTenantSettings])

  // 当门店选择后加载数据
  useEffect(() => {
    console.log('=== useEffect触发（门店变化） ===', {
      currentStoreId: currentStore?.id,
      currentStoreName: currentStore?.name,
      currentTenantId: currentTenant?.id
    })
    if (currentStore?.id && currentTenant?.id) {
      console.log('=== 门店已选择，开始加载数据 ===')
      loadStandard()
      loadOperation()
      loadEmployees()
      loadPartTimeShifts()
      loadScheduleResult()
      loadAdjustmentHistory()
    } else {
      console.log('=== 门店或租户未选择，跳过数据加载 ===')
    }
  }, [
    currentStore?.id,
    currentTenant?.id,
    loadStandard,
    loadOperation,
    loadEmployees,
    loadPartTimeShifts,
    loadScheduleResult,
    loadAdjustmentHistory,
    currentStore?.name
  ])

  useDidShow(() => {
    console.log('=== useDidShow触发，重新加载所有数据 ===', {
      currentStoreId: currentStore?.id,
      currentStoreName: currentStore?.name,
      currentTenantId: currentTenant?.id
    })
    loadTenantSettings()
    loadMealPeriods() // ✅ 加载餐段配置
    if (currentStore?.id && currentTenant?.id) {
      console.log('=== 门店已选择，开始加载数据 ===')
      loadStandard()
      loadOperation()
      loadEmployees()
      loadPartTimeShifts()
      loadScheduleResult()
      loadAdjustmentHistory()
    } else {
      console.log('=== 门店或租户未选择，跳过数据加载 ===')
    }
  })

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'low':
        return 'text-red-600'
      case 'normal':
        return 'text-muted-foreground'
      case 'high':
        return 'text-muted-foreground'
      default:
        return 'text-muted-foreground'
    }
  }

  const getZoneBgColor = (zone: string) => {
    switch (zone) {
      case 'low':
        return 'bg-blue-100'
      case 'normal':
        return 'bg-blue-100'
      case 'high':
        return 'bg-blue-100'
      default:
        return 'bg-gray-50'
    }
  }

  return (
    <View className="min-h-screen bg-gray-50">
      <View className="p-4">
        {/* 当前门店显示 - 优化显示效果 */}
        {currentStore && (
          <View className="bg-blue-100 rounded-lg p-4 mb-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <View className="i-mdi-store text-2xl text-blue-600" />
                <View>
                  <Text className="text-xs text-blue-100 block mb-1">当前门店</Text>
                  <Text className="text-base font-bold text-foreground">{currentStore.name}</Text>
                </View>
              </View>
              <View className="bg-white rounded-full px-3 py-1">
                <Text className="text-xs text-blue-600">已同步</Text>
              </View>
            </View>
            {currentStore.address && (
              <View className="flex items-center gap-1 mt-2">
                <View className="i-mdi-map-marker text-sm text-blue-100" />
                <Text className="text-xs text-blue-100">{currentStore.address}</Text>
              </View>
            )}
          </View>
        )}

        {!currentStore ? (
          <View className="bg-blue-100 rounded-lg p-8 text-center mb-4">
            <View className="i-mdi-alert-circle-outline text-6xl text-yellow-500 mx-auto mb-4" />
            <Text className="text-base text-foreground block mb-2">请先在首页选择门店</Text>
            <Text className="text-sm text-muted-foreground block">选择门店后即可进行排班规划</Text>
          </View>
        ) : (
          <>
            {/* 日期选择 */}
            <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
              <Text className="text-sm text-muted-foreground mb-2">选择日期</Text>
              <Picker mode="date" value={selectedDate} onChange={(e) => setSelectedDate(e.detail.value)}>
                <View className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <Text className="text-foreground">{selectedDate}</Text>
                  <View className="i-mdi-calendar text-xl text-muted-foreground" />
                </View>
              </Picker>
            </View>

            {loading ? (
              <View className="bg-white rounded-lg p-8 border-2 border-gray-200 text-center">
                <Text className="text-muted-foreground">加载中...</Text>
              </View>
            ) : (
              <>
                {/* 效能标准检查提示 */}
                {!standard && (
                  <View className="bg-blue-100 border border-yellow-200 rounded-lg p-4 mb-4">
                    <View className="flex items-center mb-2">
                      <View className="i-mdi-alert text-2xl text-yellow-600 mr-2" />
                      <Text className="text-base font-semibold text-yellow-800">未配置效能标准</Text>
                    </View>
                    <Text className="text-sm text-yellow-700 mb-2">
                      当前店铺尚未配置效能标准，无法自动计算目标人数。
                    </Text>
                    <Button
                      size="mini"
                      className="bg-blue-100 text-white"
                      onClick={() => Taro.navigateTo({url: '/packageD/pages/efficiency-config/index'})}>
                      <Text className="text-xs">前往配置</Text>
                    </Button>
                  </View>
                )}

                {/* 重新规划提示 */}
                {scheduleResult && !isEditMode && (
                  <View className="bg-blue-100 border border-yellow-200 rounded-lg p-4 mb-4">
                    <View className="flex items-center justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="text-sm font-semibold text-yellow-800 mb-1">💡 需要调整排班？</Text>
                        <Text className="text-xs text-yellow-700">
                          您可以修改预估营收和排班人数，系统将重新计算并允许您重新排休和增加兼职
                        </Text>
                      </View>
                      <Button
                        onClick={handleEnableEdit}
                        className="bg-blue-100 text-white px-4 py-2 rounded-lg"
                        size="default">
                        <Text className="text-sm break-keep">重新规划</Text>
                      </Button>
                    </View>
                  </View>
                )}

                {/* 预估营收输入 */}
                <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-cash text-2xl text-blue-500 mr-2" />
                    <Text className="text-base font-semibold text-foreground">第一步：预估营收</Text>
                    {isEditMode && (
                      <View className="ml-2 bg-blue-100 px-2 py-1 rounded">
                        <Text className="text-xs text-blue-600 font-semibold">编辑中</Text>
                      </View>
                    )}
                  </View>

                  <View className="mb-2">
                    <Text className="text-sm text-muted-foreground mb-2">预估次日营收（元）</Text>
                    <Input
                      type="digit"
                      value={estimatedRevenue}
                      onInput={(e) => setEstimatedRevenue(e.detail.value)}
                      disabled={scheduleResult && !isEditMode}
                      placeholder="请输入预估营收"
                      className={`border rounded-lg p-3 text-lg ${
                        scheduleResult && !isEditMode
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-muted border-border'
                      }`}
                    />
                  </View>

                  {estimatedRevenue && (
                    <View className="bg-blue-100 rounded-lg p-3 mt-3">
                      <Text className="text-sm text-blue-600">
                        💡 预估营收：¥{Number(estimatedRevenue).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 查表结果 */}
                {zoneInfo && (
                  <View className={`rounded-lg p-4 mb-4 shadow-sm ${getZoneBgColor(zoneInfo.zone)}`}>
                    <View className="flex items-center mb-3">
                      <View className="i-mdi-table-search text-2xl text-foreground mr-2" />
                      <Text className="text-base font-semibold text-foreground">第二步：查表结果</Text>
                    </View>

                    <View className="space-y-3">
                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-muted-foreground">所属区间</Text>
                        <Text className={`text-base font-semibold ${getZoneColor(zoneInfo.zone)}`}>
                          {zoneInfo.zoneName}
                        </Text>
                      </View>

                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-muted-foreground">效能标准</Text>
                        <Text className="text-base font-semibold text-foreground">
                          {zoneInfo.efficiencyStandard}元/人/日
                        </Text>
                      </View>

                      <View className="bg-blue-100 rounded-lg p-3 mt-2 mb-2">
                        <Text className="text-xs text-muted-foreground mb-1">💡 计算说明</Text>
                        <Text className="text-xs text-foreground">
                          目标人数 = 预计营收 ÷ 效能标准 = {estimatedRevenue} ÷ {zoneInfo.efficiencyStandard} ≈{' '}
                          {(Number(estimatedRevenue) / zoneInfo.efficiencyStandard).toFixed(2)} 人
                        </Text>
                        <Text className="text-xs text-foreground mt-1">
                          目标工时 = 目标人数 × 8小时 ={' '}
                          {(Number(estimatedRevenue) / zoneInfo.efficiencyStandard).toFixed(2)} × 8 ≈{' '}
                          {Math.round(zoneInfo.targetTotalHours)} 小时
                        </Text>
                      </View>

                      <View className="flex items-center justify-between">
                        <Text className="text-sm text-muted-foreground">目标人数</Text>
                        <Text className="text-lg font-bold text-muted-foreground">{zoneInfo.targetStaffCount} 人</Text>
                      </View>

                      <View className="flex items-center justify-between mt-2">
                        <Text className="text-sm text-muted-foreground">目标总工时</Text>
                        <Text className="text-base font-semibold text-foreground">
                          {Math.round(zoneInfo.targetTotalHours)} 小时
                        </Text>
                      </View>

                      <View className="bg-white bg-opacity-70 rounded-lg p-3 border-2 border-gray-200 mt-2">
                        <Text className="text-sm font-semibold text-foreground mb-1">管理口令</Text>
                        <Text className="text-base text-foreground">{zoneInfo.managementMotto}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* 排班人数输入 - 始终显示 */}
                <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-account-group text-2xl text-green-500 mr-2" />
                    <Text className="text-base font-semibold text-foreground">
                      {zoneInfo ? '第三步：排班人数' : '第二步：排班人数'}
                    </Text>
                    {isEditMode && (
                      <View className="ml-2 bg-blue-100 px-2 py-1 rounded">
                        <Text className="text-xs text-blue-600 font-semibold">编辑中</Text>
                      </View>
                    )}
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm text-muted-foreground mb-2">正式工人数（人）</Text>
                    <Input
                      type="digit"
                      value={plannedStaffCount}
                      onInput={(e) => {
                        const value = e.detail.value
                        const fullTimeCount = employees.filter((emp) => emp.employee_type === 'full_time').length

                        // 实时验证
                        if (value && Number(value) > fullTimeCount) {
                          Taro.showToast({
                            title: `正式工人数不能超过在职员工数（${fullTimeCount}人）`,
                            icon: 'none',
                            duration: 2000
                          })
                          return
                        }

                        setPlannedStaffCount(value)
                      }}
                      disabled={scheduleResult && !isEditMode}
                      placeholder="请输入正式工人数"
                      className={`border rounded-lg p-3 text-lg ${
                        scheduleResult && !isEditMode
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-muted border-border'
                      }`}
                    />
                    {tenantSettings && (
                      <Text className="text-xs text-muted-foreground mt-1">
                        每人每天工作 {tenantSettings.default_daily_work_hours} 小时
                      </Text>
                    )}
                    {employees.length > 0 && (
                      <Text className="text-xs text-muted-foreground mt-1">
                        💡 当前在职正式员工：
                        {employees.filter((emp) => emp.employee_type === 'full_time').length} 人
                      </Text>
                    )}
                  </View>

                  <View className="mb-2">
                    <Text className="text-sm text-muted-foreground mb-2">兼职工时（小时）</Text>
                    <Input
                      type="digit"
                      value={plannedPartTimeHours}
                      onInput={(e) => setPlannedPartTimeHours(e.detail.value)}
                      placeholder="请输入兼职工时（可选）"
                      className="border border-border rounded-lg p-3 bg-muted text-lg"
                    />
                  </View>

                  {plannedStaffCount && zoneInfo && tenantSettings && (
                    <View className="mt-3">
                      {(() => {
                        const totalHours =
                          Number(plannedStaffCount) * tenantSettings.default_daily_work_hours +
                          Number(plannedPartTimeHours || 0)
                        return totalHours <= zoneInfo.targetTotalHours ? (
                          <View className="bg-blue-100 rounded-lg p-3">
                            <Text className="text-sm text-green-600">
                              ✅ 优秀！总工时 {totalHours} 小时在目标范围内
                            </Text>
                          </View>
                        ) : (
                          <View className="bg-blue-100 rounded-lg p-3">
                            <Text className="text-sm text-yellow-700">
                              ⚠️ 注意：总工时 {totalHours} 小时超出目标{' '}
                              {(totalHours - zoneInfo.targetTotalHours).toFixed(1)} 小时
                            </Text>
                          </View>
                        )
                      })()}
                    </View>
                  )}

                  {plannedStaffCount && !zoneInfo && tenantSettings && (
                    <View className="bg-blue-100 rounded-lg p-3 mt-3">
                      <Text className="text-sm text-blue-600">
                        💡 计划总工时：
                        {Number(plannedStaffCount) * tenantSettings.default_daily_work_hours +
                          Number(plannedPartTimeHours || 0)}{' '}
                        小时
                      </Text>
                    </View>
                  )}
                </View>

                {/* 排班建议 */}
                {zoneInfo && (
                  <View className="bg-blue-100 rounded-lg p-4 mb-4">
                    <Text className="text-sm font-semibold text-foreground mb-2">📋 排班建议</Text>
                    <View className="mb-1">
                      <Text className="text-xs text-foreground">
                        • 排班总工时不得超过 {Math.round(zoneInfo.targetTotalHours)} 小时
                      </Text>
                    </View>
                    <View className="mb-1">
                      <Text className="text-xs text-foreground">• 建议正式工 {zoneInfo.targetStaffCount} 人</Text>
                    </View>
                    <View className="mb-1">
                      <Text className="text-xs text-foreground">• 应尽可能优化，向目标工时靠近</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-foreground">• 合理安排班次，确保服务质量</Text>
                    </View>
                  </View>
                )}

                {/* 第四步：快速排休和增加兼职 */}
                <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                  <View className="flex items-center mb-3">
                    <View className="i-mdi-calendar-clock text-2xl text-purple-500 mr-2" />
                    <Text className="text-base font-semibold text-foreground">
                      {zoneInfo ? '第四步：排休与兼职' : '第三步：排休与兼职'}
                    </Text>
                  </View>

                  <View className="flex gap-3">
                    <Button
                      onClick={() => setShowQuickRestModal(true)}
                      className="flex-1 bg-blue-100 text-white rounded-lg">
                      <View className="flex items-center justify-center">
                        <View className="i-mdi-calendar-remove text-lg mr-1" />
                        <Text className="text-sm">快速排休</Text>
                      </View>
                    </Button>

                    <Button
                      onClick={() => setShowPartTimeModal(true)}
                      className="flex-1 bg-blue-100 text-white rounded-lg">
                      <View className="flex items-center justify-center">
                        <View className="i-mdi-account-plus text-lg mr-1" />
                        <Text className="text-sm">增加兼职</Text>
                      </View>
                    </Button>
                  </View>

                  {/* 兼职记录列表 */}
                  {partTimeShifts.length > 0 && (
                    <View className="mt-4">
                      <Text className="text-sm font-semibold text-foreground mb-2">兼职记录</Text>
                      {partTimeShifts.map((shift) => (
                        <View key={shift.id} className="bg-muted rounded-lg p-3 mb-2">
                          <View className="flex items-center justify-between mb-1">
                            <View className="flex-1">
                              <Text className="text-sm font-semibold text-foreground">{shift.employee_name}</Text>
                              {shift.phone && (
                                <Text className="text-xs text-muted-foreground mt-0.5">📞 {shift.phone}</Text>
                              )}
                            </View>
                            <Text className="text-sm text-muted-foreground">¥{shift.total_cost.toFixed(2)}</Text>
                          </View>
                          <View className="flex items-center justify-between mb-2">
                            <Text className="text-xs text-muted-foreground">
                              {shift.work_hours}小时 × ¥{shift.hourly_rate}/小时
                            </Text>
                            {shift.meal_period && (
                              <Text className="text-xs text-muted-foreground">{shift.meal_period}</Text>
                            )}
                          </View>
                          {shift.notes && (
                            <Text className="text-xs text-muted-foreground mb-2">备注：{shift.notes}</Text>
                          )}
                          <View className="flex gap-2 mt-2">
                            <Button
                              onClick={() => handleEditPartTime(shift)}
                              className="flex-1 bg-blue-100 text-white py-1"
                              size="mini">
                              <Text className="text-xs">编辑</Text>
                            </Button>
                            <Button
                              onClick={() => handleDeletePartTime(shift.id)}
                              className="flex-1 bg-blue-100 text-red-600 py-1"
                              size="mini">
                              <Text className="text-xs">删除</Text>
                            </Button>
                          </View>
                        </View>
                      ))}
                      <View className="bg-blue-100 rounded-lg p-2 mt-2">
                        <Text className="text-xs text-blue-600">
                          共 {partTimeShifts.length} 人，总工时{' '}
                          {partTimeShifts.reduce((sum, shift) => sum + shift.work_hours, 0)} 小时，总费用 ¥
                          {partTimeShifts.reduce((sum, shift) => sum + shift.total_cost, 0).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* 排班结果展示 */}
                {scheduleResult && (
                  <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                    <View className="flex items-center mb-3">
                      <View className="i-mdi-chart-box text-2xl text-indigo-500 mr-2" />
                      <Text className="text-base font-semibold text-foreground">排班结果</Text>
                    </View>

                    <View className="space-y-2">
                      {/* 人员统计 */}
                      <View className="bg-blue-100 rounded-lg p-3 mb-2">
                        <Text className="text-xs text-blue-600 font-semibold mb-1">人员统计</Text>
                        <View className="flex items-center justify-between">
                          <Text className="text-xs text-muted-foreground">上岗人数</Text>
                          <Text className="text-xs font-semibold text-blue-600">
                            {(scheduleResult as any).working_employee_count || scheduleResult.planned_staff_count} 人
                          </Text>
                        </View>
                        <View className="flex items-center justify-between mt-1">
                          <Text className="text-xs text-muted-foreground">排休人数</Text>
                          <Text className="text-xs font-semibold text-blue-600">
                            {scheduleResult.rest_staff_count} 人
                            {scheduleResult.rest_days > 0 && ` / ${scheduleResult.rest_days}天`}
                          </Text>
                        </View>
                        {scheduleResult.part_time_count > 0 && (
                          <View className="flex items-center justify-between mt-1">
                            <Text className="text-xs text-muted-foreground">兼职人数</Text>
                            <Text className="text-xs font-semibold text-blue-600">
                              {scheduleResult.part_time_count} 人
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 薪酬明细 */}
                      <View className="bg-blue-100 rounded-lg p-3 mb-2">
                        <Text className="text-xs text-green-600 font-semibold mb-1">当日薪酬明细</Text>
                        <View className="flex items-center justify-between">
                          <Text className="text-xs text-muted-foreground">正式员工薪酬</Text>
                          <Text className="text-xs font-semibold text-green-600">
                            ¥{((scheduleResult as any).regular_cost || 0).toFixed(2)}
                          </Text>
                        </View>
                        {scheduleResult.part_time_count > 0 && (
                          <View className="flex items-center justify-between mt-1">
                            <Text className="text-xs text-muted-foreground">兼职薪酬</Text>
                            <Text className="text-xs font-semibold text-green-600">
                              ¥{((scheduleResult as any).part_time_cost || 0).toFixed(2)}
                            </Text>
                          </View>
                        )}
                        <View className="flex items-center justify-between mt-1 pt-1 border-t border-border">
                          <Text className="text-xs text-green-600 font-bold">总人力成本</Text>
                          <Text className="text-xs font-bold text-green-600">
                            ¥{scheduleResult.total_labor_cost.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {/* 日均薪酬分析 */}
                      {(() => {
                        // 计算餐厅平均日均薪酬
                        const monthlyDays = 30
                        const totalMonthlySalary = employees.reduce((sum, emp) => sum + (emp.monthly_salary || 5000), 0)
                        const avgRestDays =
                          employees.length > 0
                            ? employees.reduce((sum, emp) => sum + (emp.rest_days_per_month || 4), 0) / employees.length
                            : 4
                        const restaurantAvgDailySalary =
                          employees.length > 0 ? totalMonthlySalary / employees.length / (monthlyDays - avgRestDays) : 0

                        // 计算当天日均薪酬
                        const workingCount =
                          (scheduleResult as any).working_employee_count || scheduleResult.planned_staff_count
                        const todayAvgDailySalary =
                          workingCount > 0 ? scheduleResult.total_labor_cost / workingCount : 0

                        // 对比分析
                        const dailySalaryRatio =
                          restaurantAvgDailySalary > 0 ? (todayAvgDailySalary / restaurantAvgDailySalary) * 100 : 0
                        const isDailySalaryWarning = dailySalaryRatio > 110 // 超过10%为警告

                        return (
                          <View className="bg-blue-100 rounded-lg p-3 mb-2">
                            <Text className="text-xs text-purple-700 font-semibold mb-1">日均薪酬分析</Text>
                            <View className="flex items-center justify-between">
                              <Text className="text-xs text-muted-foreground">餐厅平均日均薪酬</Text>
                              <Text className="text-xs font-semibold text-purple-800">
                                ¥{restaurantAvgDailySalary.toFixed(2)}
                              </Text>
                            </View>
                            <View className="flex items-center justify-between mt-1">
                              <Text className="text-xs text-muted-foreground">当天日均薪酬</Text>
                              <Text className="text-xs font-semibold text-purple-800">
                                ¥{todayAvgDailySalary.toFixed(2)}
                              </Text>
                            </View>
                            <View className="flex items-center justify-between mt-1 pt-1 border-t border-border">
                              <Text className="text-xs text-purple-700 font-bold">对比餐厅平均</Text>
                              <Text
                                className={`text-xs font-bold ${
                                  isDailySalaryWarning
                                    ? 'text-red-600'
                                    : dailySalaryRatio > 100
                                      ? 'text-muted-foreground'
                                      : 'text-muted-foreground'
                                }`}>
                                {dailySalaryRatio.toFixed(1)}%{isDailySalaryWarning && ' ⚠️'}
                              </Text>
                            </View>
                            {isDailySalaryWarning && (
                              <View className="mt-2 bg-red-100 rounded px-2 py-1">
                                <Text className="text-xs text-red-600">
                                  ⚠️ 当天日均薪酬高出平均值10%以上，建议优化排班
                                </Text>
                              </View>
                            )}
                            {dailySalaryRatio > 100 && !isDailySalaryWarning && (
                              <View className="mt-2 bg-orange-100 rounded px-2 py-1">
                                <Text className="text-xs text-orange-600">
                                  提示：当天日均薪酬略高于平均值，请关注成本控制
                                </Text>
                              </View>
                            )}
                            {dailySalaryRatio <= 100 && (
                              <View className="mt-2 bg-green-100 rounded px-2 py-1">
                                <Text className="text-xs text-green-600">✅ 当天日均薪酬合理，成本控制良好</Text>
                              </View>
                            )}
                          </View>
                        )
                      })()}

                      {/* 其他指标 */}
                      <View className="flex items-center justify-between py-2 border-b border-border">
                        <Text className="text-sm text-muted-foreground">排班达成率</Text>
                        <Text
                          className={`text-sm font-semibold ${
                            scheduleResult.achievement_rate >= 95 ? 'text-muted-foreground' : 'text-yellow-600'
                          }`}>
                          {scheduleResult.achievement_rate.toFixed(1)}%
                        </Text>
                      </View>

                      <View className="flex items-center justify-between py-2 border-b border-border">
                        <Text className="text-sm text-muted-foreground">人力成本率</Text>
                        <Text className="text-sm font-semibold text-foreground">
                          {scheduleResult.labor_cost_rate.toFixed(1)}%
                        </Text>
                      </View>

                      <View className="flex items-center justify-between py-2">
                        <Text className="text-sm text-muted-foreground">成本是否合格</Text>
                        <Text
                          className={`text-sm font-semibold ${
                            scheduleResult.is_cost_qualified ? 'text-muted-foreground' : 'text-red-600'
                          }`}>
                          {scheduleResult.is_cost_qualified ? '✅ 合格' : '❌ 不合格'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* 排班结构表 */}
                {scheduleResult && (
                  <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                    <View className="flex items-center mb-3">
                      <View className="i-mdi-table text-2xl text-purple-500 mr-2" />
                      <Text className="text-base font-semibold text-foreground">排班结构表</Text>
                    </View>

                    {/* 上岗员工 */}
                    <View className="mb-4">
                      <View className="flex items-center mb-2">
                        <View className="i-mdi-account-check text-lg text-muted-foreground mr-1" />
                        <Text className="text-sm font-semibold text-foreground">
                          上岗员工 ({employees.filter((emp) => !restEmployeeIds.includes(emp.id)).length}人)
                        </Text>
                      </View>
                      <View className="bg-blue-100 rounded-lg p-3">
                        {employees.filter((emp) => !restEmployeeIds.includes(emp.id)).length > 0 ? (
                          employees
                            .filter((emp) => !restEmployeeIds.includes(emp.id))
                            .map((emp, index) => (
                              <View
                                key={emp.id}
                                className={`flex items-center justify-between py-2 ${
                                  index < employees.filter((e) => !restEmployeeIds.includes(e.id)).length - 1
                                    ? 'border-b border-border'
                                    : ''
                                }`}>
                                <View className="flex items-center">
                                  <View className="i-mdi-account text-base text-muted-foreground mr-2" />
                                  <Text className="text-sm text-foreground">{emp.name}</Text>
                                </View>
                                <View className="flex items-center">
                                  <Text className="text-xs text-muted-foreground mr-2">
                                    {emp.department === 'front_hall' ? '前厅' : '后厨'}
                                  </Text>
                                  <Text className="text-xs text-muted-foreground">{emp.position || '员工'}</Text>
                                </View>
                              </View>
                            ))
                        ) : (
                          <Text className="text-xs text-muted-foreground text-center py-2">暂无上岗员工</Text>
                        )}
                      </View>
                    </View>

                    {/* 排休员工 */}
                    {restEmployeeIds.length > 0 && (
                      <View className="mb-4">
                        <View className="flex items-center mb-2">
                          <View className="i-mdi-account-off text-lg text-muted-foreground mr-1" />
                          <Text className="text-sm font-semibold text-foreground">
                            排休员工 ({restEmployeeIds.length}人)
                          </Text>
                        </View>
                        <View className="bg-blue-100 rounded-lg p-3">
                          {employees
                            .filter((emp) => restEmployeeIds.includes(emp.id))
                            .map((emp, index) => (
                              <View
                                key={emp.id}
                                className={`py-2 ${
                                  index < restEmployeeIds.length - 1 ? 'border-b border-border' : ''
                                }`}>
                                <View className="flex items-center justify-between mb-1">
                                  <View className="flex items-center">
                                    <View className="i-mdi-account text-base text-muted-foreground mr-2" />
                                    <Text className="text-sm text-foreground">{emp.name}</Text>
                                  </View>
                                  <View className="flex items-center">
                                    <Text className="text-xs text-muted-foreground mr-2">
                                      {emp.department === 'front_hall' ? '前厅' : '后厨'}
                                    </Text>
                                    <Text className="text-xs text-muted-foreground">{emp.position || '员工'}</Text>
                                  </View>
                                </View>
                                {/* 显示排休餐段和时长 */}
                                {confirmedRestHours > 0 && (
                                  <View className="flex items-center justify-between ml-6">
                                    <Text className="text-xs text-muted-foreground">
                                      {confirmedRestMealPeriod === 'all_day' ? '全天' : confirmedRestMealPeriod}
                                    </Text>
                                    <Text className="text-xs text-muted-foreground font-semibold">
                                      {confirmedRestHours}小时
                                    </Text>
                                  </View>
                                )}
                              </View>
                            ))}
                        </View>
                      </View>
                    )}

                    {/* 兼职排班 */}
                    {partTimeShifts.length > 0 && (
                      <View>
                        <View className="flex items-center mb-2">
                          <View className="i-mdi-clock-outline text-lg text-muted-foreground mr-1" />
                          <Text className="text-sm font-semibold text-foreground">
                            兼职排班 ({partTimeShifts.length}人)
                          </Text>
                        </View>
                        <View className="bg-blue-100 rounded-lg p-3">
                          {partTimeShifts.map((shift, index) => (
                            <View
                              key={shift.id}
                              className={`py-2 ${index < partTimeShifts.length - 1 ? 'border-b border-border' : ''}`}>
                              <View className="flex items-center justify-between mb-1">
                                <View className="flex items-center">
                                  <View className="i-mdi-account-clock text-base text-muted-foreground mr-2" />
                                  <Text className="text-sm text-foreground">{shift.employee_name}</Text>
                                </View>
                                <Text className="text-xs text-muted-foreground font-semibold">
                                  {shift.work_hours}小时
                                </Text>
                              </View>
                              <View className="flex items-center justify-between ml-6">
                                <Text className="text-xs text-muted-foreground">{shift.meal_period || '全天'}</Text>
                                <Text className="text-xs text-muted-foreground">¥{shift.total_cost.toFixed(2)}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* 调整历史记录 */}
                {adjustmentHistory.length > 1 && (
                  <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
                    <View
                      className="flex items-center justify-between mb-3 cursor-pointer"
                      onClick={() => setShowHistory(!showHistory)}>
                      <View className="flex items-center">
                        <View className="i-mdi-history text-2xl text-indigo-500 mr-2" />
                        <Text className="text-base font-semibold text-foreground">调整历史</Text>
                        <View className="ml-2 bg-indigo-100 rounded-full px-2 py-0.5">
                          <Text className="text-xs text-indigo-600">{adjustmentHistory.length}条记录</Text>
                        </View>
                      </View>
                      <View
                        className={`i-mdi-chevron-down text-xl text-muted-foreground transition-transform ${
                          showHistory ? 'rotate-180' : ''
                        }`}
                      />
                    </View>

                    {showHistory && (
                      <View className="space-y-3">
                        {adjustmentHistory.map((record, index) => (
                          <View
                            key={record.id}
                            className={`p-3 rounded-lg ${
                              index === 0 ? 'bg-blue-100 border-2 border-indigo-200' : 'bg-gray-50'
                            }`}>
                            <View className="flex items-center justify-between mb-2">
                              <View className="flex items-center">
                                <View
                                  className={`i-mdi-${
                                    record.adjustment_type === '首次规划' ? 'plus-circle' : 'pencil-circle'
                                  } text-lg ${index === 0 ? 'text-indigo-600' : 'text-muted-foreground'} mr-1`}
                                />
                                <Text
                                  className={`text-sm font-medium ${
                                    index === 0 ? 'text-indigo-700' : 'text-foreground'
                                  }`}>
                                  {record.adjustment_type}
                                </Text>
                                {index === 0 && (
                                  <View className="ml-2 bg-indigo-600 rounded-full px-2 py-0.5">
                                    <Text className="text-xs text-blue-600">当前</Text>
                                  </View>
                                )}
                              </View>
                              <Text className="text-xs text-muted-foreground">
                                {new Date(record.created_at).toLocaleString('zh-CN', {
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </View>

                            {/* 调整详情 */}
                            {record.adjustment_details && (
                              <View className="space-y-1 mt-2 pt-2 border-t border-border">
                                {record.adjustment_details.revenue && (
                                  <View className="flex items-center justify-between">
                                    <Text className="text-xs text-muted-foreground">预估营收</Text>
                                    <Text className="text-xs text-foreground">
                                      ¥{record.adjustment_details.revenue.old.toFixed(0)} → ¥
                                      {record.adjustment_details.revenue.new.toFixed(0)}
                                    </Text>
                                  </View>
                                )}
                                {record.adjustment_details.staffCount && (
                                  <View className="flex items-center justify-between">
                                    <Text className="text-xs text-muted-foreground">排班人数</Text>
                                    <Text className="text-xs text-foreground">
                                      {record.adjustment_details.staffCount.old}人 →{' '}
                                      {record.adjustment_details.staffCount.new}人
                                    </Text>
                                  </View>
                                )}
                                {record.adjustment_details.restStaff && (
                                  <View className="flex items-center justify-between">
                                    <Text className="text-xs text-muted-foreground">排休人数</Text>
                                    <Text className="text-xs text-foreground">
                                      {record.adjustment_details.restStaff.old}人 →{' '}
                                      {record.adjustment_details.restStaff.new}人
                                    </Text>
                                  </View>
                                )}
                                {record.adjustment_details.tempWorkers && (
                                  <View className="flex items-center justify-between">
                                    <Text className="text-xs text-muted-foreground">兼职人数</Text>
                                    <Text className="text-xs text-foreground">
                                      {record.adjustment_details.tempWorkers.old}人 →{' '}
                                      {record.adjustment_details.tempWorkers.new}人
                                    </Text>
                                  </View>
                                )}
                              </View>
                            )}

                            {/* 调整原因 */}
                            {record.adjustment_reason && (
                              <View className="mt-2 pt-2 border-t border-border">
                                <Text className="text-xs text-muted-foreground">
                                  调整原因：{record.adjustment_reason}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* 保存按钮 */}
                {isEditMode ? (
                  <View className="flex gap-3">
                    <Button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-300 text-foreground rounded-lg py-3"
                      size="default">
                      <Text className="text-base break-keep">取消调整</Text>
                    </Button>
                    <Button
                      onClick={handleSave}
                      loading={saving}
                      disabled={!estimatedRevenue || !plannedStaffCount}
                      className={`flex-1 rounded-lg py-3 ${
                        !estimatedRevenue || !plannedStaffCount
                          ? 'bg-gray-300 text-muted-foreground'
                          : 'bg-blue-100 text-white'
                      }`}
                      size="default">
                      <Text className="text-base break-keep">
                        {!estimatedRevenue || !plannedStaffCount ? '请填写完整信息' : '保存调整'}
                      </Text>
                    </Button>
                  </View>
                ) : (
                  <Button
                    onClick={handleSave}
                    loading={saving}
                    disabled={!estimatedRevenue || !plannedStaffCount}
                    className={`rounded-lg w-full py-3 ${
                      !estimatedRevenue || !plannedStaffCount
                        ? 'bg-gray-300 text-muted-foreground'
                        : 'bg-blue-100 text-white'
                    }`}
                    size="default">
                    <Text className="text-base break-keep">
                      {!estimatedRevenue || !plannedStaffCount ? '请填写完整信息' : '保存排班规划'}
                    </Text>
                  </Button>
                )}

                {/* 快速排休弹窗 */}
                {showQuickRestModal && (
                  <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <View className="bg-white rounded-lg p-6 border-2 border-gray-200 m-4 w-full max-w-md max-h-96 overflow-y-auto">
                      <Text className="text-lg font-semibold text-foreground mb-4">快速排休</Text>

                      {/* 餐段选择 */}
                      <View className="mb-4">
                        <Text className="text-sm text-foreground mb-2 block">选择餐段</Text>
                        <View className="flex gap-2 flex-wrap">
                          {/* 全天选项 */}
                          <View
                            onClick={() => setRestMealPeriod('all_day')}
                            className={`flex-1 text-center py-2 px-3 rounded-lg border-2 cursor-pointer ${
                              restMealPeriod === 'all_day' ? 'border-border bg-blue-100' : 'border-border bg-white'
                            }`}>
                            <Text
                              className={`text-sm font-medium ${
                                restMealPeriod === 'all_day' ? 'text-muted-foreground' : 'text-muted-foreground'
                              }`}>
                              全天
                            </Text>
                          </View>

                          {/* ✅ 动态生成餐段选项 */}
                          {mealPeriodNames.map((periodName) => (
                            <View
                              key={periodName}
                              onClick={() => setRestMealPeriod(periodName)}
                              className={`flex-1 text-center py-2 px-3 rounded-lg border-2 cursor-pointer ${
                                restMealPeriod === periodName ? 'border-border bg-blue-100' : 'border-border bg-white'
                              }`}>
                              <Text
                                className={`text-sm font-medium ${
                                  restMealPeriod === periodName ? 'text-muted-foreground' : 'text-muted-foreground'
                                }`}>
                                {periodName}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* 排休小时数输入 */}
                      <View className="mb-4">
                        <Text className="text-sm text-foreground mb-2 block">
                          排休小时数 <Text className="text-red-500">*</Text>
                        </Text>
                        <View style={{overflow: 'hidden'}}>
                          <Input
                            type="digit"
                            value={restHours}
                            onInput={(e) => setRestHours(e.detail.value)}
                            placeholder={
                              restMealPeriod === 'all_day'
                                ? `全天排休（${tenantSettings?.default_daily_work_hours || 8}小时）`
                                : `请输入排休小时数（1-${tenantSettings?.default_daily_work_hours || 8}）`
                            }
                            disabled={restMealPeriod === 'all_day'}
                            className={`border border-border rounded-lg p-3 w-full ${
                              restMealPeriod === 'all_day' ? 'bg-muted text-muted-foreground' : 'bg-gray-50'
                            }`}
                          />
                        </View>
                        <Text className="text-xs text-muted-foreground mt-1 block">
                          {restMealPeriod === 'all_day'
                            ? `💡 全天排休自动设置为${tenantSettings?.default_daily_work_hours || 8}小时`
                            : `💡 排休小时数不能超过工作时长（${tenantSettings?.default_daily_work_hours || 8}小时）`}
                        </Text>
                      </View>

                      {/* 员工列表 */}
                      {employees.length === 0 ? (
                        <View className="text-center py-8">
                          <Text className="text-muted-foreground">暂无员工数据</Text>
                        </View>
                      ) : (
                        <View className="space-y-2">
                          {employees.map((employee) => (
                            <View
                              key={employee.id}
                              onClick={() => toggleRestEmployee(employee.id)}
                              className={`border rounded-lg p-3 cursor-pointer ${
                                restEmployeeIds.includes(employee.id)
                                  ? 'border-border bg-blue-100'
                                  : 'border-border bg-white'
                              }`}>
                              <View className="flex items-center justify-between">
                                <View className="flex items-center gap-2">
                                  <View
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      restEmployeeIds.includes(employee.id)
                                        ? 'border-border bg-blue-100'
                                        : 'border-border'
                                    }`}>
                                    {restEmployeeIds.includes(employee.id) && (
                                      <View className="i-mdi-check text-blue-600 text-sm" />
                                    )}
                                  </View>
                                  <View>
                                    <Text className="text-sm font-semibold text-foreground">{employee.name}</Text>
                                    <Text className="text-xs text-muted-foreground">
                                      {employee.department === 'front_hall' ? '前厅' : '后厨'} ·{' '}
                                      {employee.position || '无职位'}
                                    </Text>
                                    {employee.monthly_salary && (
                                      <Text className="text-xs text-muted-foreground font-semibold mt-0.5">
                                        薪酬: ¥{employee.monthly_salary.toLocaleString()}/月
                                      </Text>
                                    )}
                                  </View>
                                </View>
                                <View
                                  className={`px-2 py-1 rounded ${
                                    employee.employee_type === 'full_time' ? 'bg-blue-100' : 'bg-orange-100'
                                  }`}>
                                  <Text
                                    className={`text-xs ${
                                      employee.employee_type === 'full_time'
                                        ? 'text-muted-foreground'
                                        : 'text-muted-foreground'
                                    }`}>
                                    {employee.employee_type === 'full_time' ? '正式' : '兼职'}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      <View className="flex gap-3 mt-4">
                        <Button
                          onClick={() => {
                            setShowQuickRestModal(false)
                            setRestEmployeeIds([])
                          }}
                          className="flex-1 bg-gray-300 text-foreground">
                          <Text className="text-sm">取消</Text>
                        </Button>
                        <Button onClick={handleConfirmRest} className="flex-1 bg-blue-100 text-white">
                          <Text className="text-sm">确定（{restEmployeeIds.length}人）</Text>
                        </Button>
                      </View>
                    </View>
                  </View>
                )}

                {/* 增加兼职弹窗 */}
                {showPartTimeModal && (
                  <View className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <View className="bg-white rounded-lg p-6 border-2 border-gray-200 m-4 w-full max-w-md max-h-[80vh] overflow-y-auto">
                      <Text className="text-lg font-semibold text-foreground mb-4">
                        {editingPartTimeId ? '编辑兼职' : '增加兼职'}
                      </Text>

                      <View className="mb-3">
                        <Text className="text-sm text-muted-foreground mb-2">员工姓名 *</Text>
                        <Input
                          value={partTimeForm.employee_name}
                          onInput={(e) => setPartTimeForm({...partTimeForm, employee_name: e.detail.value})}
                          placeholder="请输入员工姓名"
                          className="border border-border rounded-lg p-3 bg-gray-50"
                        />
                      </View>

                      <View className="mb-3">
                        <Text className="text-sm text-muted-foreground mb-2">联系电话</Text>
                        <Input
                          type="number"
                          value={partTimeForm.phone}
                          onInput={(e) => setPartTimeForm({...partTimeForm, phone: e.detail.value})}
                          placeholder="请输入联系电话"
                          className="border border-border rounded-lg p-3 bg-gray-50"
                        />
                      </View>

                      <View className="mb-3">
                        <Text className="text-sm text-muted-foreground mb-2">工作工时（小时）*</Text>
                        <Input
                          type="digit"
                          value={partTimeForm.work_hours}
                          onInput={(e) => setPartTimeForm({...partTimeForm, work_hours: e.detail.value})}
                          placeholder="请输入工作工时"
                          className="border border-border rounded-lg p-3 bg-gray-50"
                        />
                      </View>

                      <View className="mb-3">
                        <Text className="text-sm text-muted-foreground mb-2">时薪（元/小时）*</Text>
                        <Input
                          type="digit"
                          value={partTimeForm.hourly_rate}
                          onInput={(e) => setPartTimeForm({...partTimeForm, hourly_rate: e.detail.value})}
                          placeholder="请输入时薪"
                          className="border border-border rounded-lg p-3 bg-gray-50"
                        />
                      </View>

                      <View className="mb-3">
                        <Text className="text-sm text-muted-foreground mb-2">餐段（可选）</Text>
                        <Picker
                          mode="selector"
                          range={mealPeriodNames}
                          onChange={(e) => {
                            setPartTimeForm({...partTimeForm, meal_period: mealPeriodNames[Number(e.detail.value)]})
                          }}>
                          <View className="border border-border rounded-lg p-3 bg-gray-50">
                            <Text className="text-foreground">{partTimeForm.meal_period || '请选择餐段'}</Text>
                          </View>
                        </Picker>
                      </View>

                      <View className="mb-4">
                        <Text className="text-sm text-muted-foreground mb-2">备注（可选）</Text>
                        <Input
                          value={partTimeForm.notes}
                          onInput={(e) => setPartTimeForm({...partTimeForm, notes: e.detail.value})}
                          placeholder="请输入备注"
                          className="border border-border rounded-lg p-3 bg-gray-50"
                        />
                      </View>

                      <View className="flex gap-3">
                        <Button
                          onClick={() => {
                            setShowPartTimeModal(false)
                            setEditingPartTimeId(null)
                            setPartTimeForm({
                              employee_name: '',
                              phone: '',
                              work_hours: '',
                              hourly_rate: '',
                              meal_period: '',
                              notes: ''
                            })
                          }}
                          className="flex-1 bg-gray-300 text-foreground">
                          <Text className="text-sm">取消</Text>
                        </Button>
                        <Button onClick={handleAddPartTime} className="flex-1 bg-blue-100 text-white">
                          <Text className="text-sm">{editingPartTimeId ? '保存' : '确定'}</Text>
                        </Button>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </View>
    </View>
  )
}
