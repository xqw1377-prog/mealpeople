/**
 * 智能排班生成算法
 * 基于约束满足和启发式优化的排班生成系统
 */

import type {
  DailyScheduleRequirement,
  EmployeeScheduleConstraint,
  GenerateScheduleRequest,
  MonthlyScheduleResult,
  ScheduleConflict,
  ScheduleResult,
  ScheduleStatistics
} from '@/db/types-schedule-generation'

/**
 * 智能排班生成器
 */
export class ScheduleGenerator {
  private config: GenerateScheduleRequest['config']
  private employees: EmployeeScheduleConstraint[]
  private dailyRequirements: DailyScheduleRequirement[]
  private schedules: Map<string, ScheduleResult[]> = new Map() // date -> schedules

  constructor(request: GenerateScheduleRequest) {
    this.config = request.config
    this.employees = request.employees
    this.dailyRequirements = request.daily_requirements
  }

  /**
   * 生成月度排班
   */
  async generate(): Promise<MonthlyScheduleResult> {
    // 1. 初始化排班表
    this.initializeSchedules()

    // 2. 处理请假和固定休息日
    this.handleLeaveRequests()

    // 3. 分配核心岗位
    this.assignCorePositions()

    // 4. 分配普通岗位
    this.assignRegularPositions()

    // 5. 优化排班
    this.optimizeSchedules()

    // 6. 检测冲突
    const conflicts = this.detectConflicts()

    // 7. 生成统计
    const statistics = this.calculateStatistics()

    // 8. 生成建议
    const suggestions = this.generateSuggestions(conflicts, statistics)

    // 9. 转换为结果格式
    const schedules = this.convertToResults()

    return {
      tenant_id: this.config.tenant_id,
      store_id: this.config.store_id,
      year: this.config.year,
      month: this.config.month,
      schedules,
      statistics,
      conflicts,
      suggestions
    }
  }

  /**
   * 初始化排班表
   */
  private initializeSchedules(): void {
    const daysInMonth = new Date(this.config.year, this.config.month, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${this.config.year}-${String(this.config.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      this.schedules.set(date, [])
    }
  }

  /**
   * 处理请假和固定休息日
   */
  private handleLeaveRequests(): void {
    for (const employee of this.employees) {
      for (const leaveDate of employee.rest_day_requests) {
        const daySchedules = this.schedules.get(leaveDate) || []
        daySchedules.push({
          date: leaveDate,
          employee_id: employee.employee_id,
          employee_name: employee.employee_name,
          position: employee.position,
          shift_type: 'leave'
        })
        this.schedules.set(leaveDate, daySchedules)
      }
    }
  }

  /**
   * 分配核心岗位
   */
  private assignCorePositions(): void {
    const coreEmployees = this.employees.filter((e) => e.is_core_position)

    for (const [date, requirement] of this.getDailyRequirementsMap()) {
      const corePositions = requirement.required_positions.filter((p) => p.is_required)

      for (const positionReq of corePositions) {
        const availableEmployees = coreEmployees.filter(
          (e) => e.position === positionReq.position && this.canWorkOnDate(e, date)
        )

        // 按工作天数排序，优先分配工作天数少的员工（公平性）
        availableEmployees.sort((a, b) => {
          const aWorkDays = this.getEmployeeWorkDays(a.employee_id)
          const bWorkDays = this.getEmployeeWorkDays(b.employee_id)
          return aWorkDays - bWorkDays
        })

        // 分配员工
        const assignCount = Math.min(positionReq.min_count, availableEmployees.length)
        for (let i = 0; i < assignCount; i++) {
          this.assignEmployeeToDate(availableEmployees[i], date, 'work')
        }
      }
    }
  }

  /**
   * 分配普通岗位
   */
  private assignRegularPositions(): void {
    for (const [date, requirement] of this.getDailyRequirementsMap()) {
      const currentStaffCount = this.getDateStaffCount(date)
      const neededCount = requirement.min_staff_count - currentStaffCount

      if (neededCount <= 0) continue

      // 获取可用员工
      const availableEmployees = this.employees.filter((e) => this.canWorkOnDate(e, date))

      // 按多个因素排序：工作天数、岗位匹配度、成本
      availableEmployees.sort((a, b) => {
        const aWorkDays = this.getEmployeeWorkDays(a.employee_id)
        const bWorkDays = this.getEmployeeWorkDays(b.employee_id)

        // 优先分配工作天数少的员工
        if (aWorkDays !== bWorkDays) {
          return aWorkDays - bWorkDays
        }

        // 其次考虑岗位匹配度
        const aPositionMatch = requirement.required_positions.some((p) => p.position === a.position)
        const bPositionMatch = requirement.required_positions.some((p) => p.position === b.position)

        if (aPositionMatch !== bPositionMatch) {
          return aPositionMatch ? -1 : 1
        }

        return 0
      })

      // 分配员工
      const assignCount = Math.min(neededCount, availableEmployees.length)
      for (let i = 0; i < assignCount; i++) {
        this.assignEmployeeToDate(availableEmployees[i], date, 'work')
      }
    }
  }

  /**
   * 优化排班
   */
  private optimizeSchedules(): void {
    // 1. 确保每个员工的休息天数符合要求
    this.ensureRestDays()

    // 2. 避免连续工作天数过多
    this.avoidExcessiveConsecutiveWorkDays()

    // 3. 优先周末休息（如果配置了）
    if (this.config.prefer_weekend_rest) {
      this.preferWeekendRest()
    }

    // 4. 平衡员工工作负荷
    this.balanceWorkload()
  }

  /**
   * 确保休息天数
   */
  private ensureRestDays(): void {
    const minRestDays = this.config.min_rest_days || 4

    for (const employee of this.employees) {
      const workDays = this.getEmployeeWorkDays(employee.employee_id)
      const daysInMonth = this.schedules.size
      const restDays = daysInMonth - workDays - employee.rest_day_requests.length

      if (restDays < minRestDays) {
        // 需要增加休息天数
        const needRestDays = minRestDays - restDays
        this.addRestDaysForEmployee(employee, needRestDays)
      }
    }
  }

  /**
   * 为员工添加休息天数
   */
  private addRestDaysForEmployee(employee: EmployeeScheduleConstraint, count: number): void {
    const workDates = this.getEmployeeWorkDates(employee.employee_id)

    // 优先选择非核心日期休息
    workDates.sort((a, b) => {
      const aReq = this.getDailyRequirement(a)
      const bReq = this.getDailyRequirement(b)
      return (aReq?.predicted_revenue || 0) - (bReq?.predicted_revenue || 0)
    })

    for (let i = 0; i < Math.min(count, workDates.length); i++) {
      this.changeEmployeeShift(employee.employee_id, workDates[i], 'rest')
    }
  }

  /**
   * 避免连续工作天数过多
   */
  private avoidExcessiveConsecutiveWorkDays(): void {
    const maxConsecutiveDays = this.config.max_consecutive_work_days || 6

    for (const employee of this.employees) {
      const workDates = this.getEmployeeWorkDates(employee.employee_id).sort()

      let consecutiveDays = 0
      let lastDate: Date | null = null

      for (const dateStr of workDates) {
        const currentDate = new Date(dateStr)

        if (lastDate) {
          const dayDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

          if (dayDiff === 1) {
            consecutiveDays++

            if (consecutiveDays >= maxConsecutiveDays) {
              // 需要插入休息日
              this.changeEmployeeShift(employee.employee_id, dateStr, 'rest')
              consecutiveDays = 0
            }
          } else {
            consecutiveDays = 1
          }
        } else {
          consecutiveDays = 1
        }

        lastDate = currentDate
      }
    }
  }

  /**
   * 优先周末休息
   */
  private preferWeekendRest(): void {
    for (const employee of this.employees) {
      const workDates = this.getEmployeeWorkDates(employee.employee_id)
      const weekendWorkDates = workDates.filter((date) => {
        const dayOfWeek = new Date(date).getDay()
        return dayOfWeek === 0 || dayOfWeek === 6 // 周日或周六
      })

      // 如果周末工作天数过多，尝试调整
      if (weekendWorkDates.length > 2) {
        const adjustCount = weekendWorkDates.length - 2
        for (let i = 0; i < adjustCount; i++) {
          this.changeEmployeeShift(employee.employee_id, weekendWorkDates[i], 'rest')
        }
      }
    }
  }

  /**
   * 平衡工作负荷
   */
  private balanceWorkload(): void {
    const workDaysMap = new Map<string, number>()

    for (const employee of this.employees) {
      workDaysMap.set(employee.employee_id, this.getEmployeeWorkDays(employee.employee_id))
    }

    const avgWorkDays = Array.from(workDaysMap.values()).reduce((a, b) => a + b, 0) / workDaysMap.size

    // 找出工作天数偏离平均值较大的员工
    for (const [employeeId, workDays] of workDaysMap) {
      const deviation = workDays - avgWorkDays

      if (Math.abs(deviation) > 3) {
        // 偏离超过3天，需要调整
        const employee = this.employees.find((e) => e.employee_id === employeeId)
        if (!employee) continue

        if (deviation > 0) {
          // 工作天数过多，减少工作天数
          this.addRestDaysForEmployee(employee, Math.floor(deviation / 2))
        }
        // 工作天数过少的情况在分配阶段已经处理
      }
    }
  }

  /**
   * 检测冲突
   */
  private detectConflicts(): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = []

    for (const [date, requirement] of this.getDailyRequirementsMap()) {
      const staffCount = this.getDateStaffCount(date)

      // 检查人员不足
      if (staffCount < requirement.min_staff_count) {
        conflicts.push({
          type: 'understaffed',
          date,
          severity: 'high',
          description: `${date} 人员不足，需要 ${requirement.min_staff_count} 人，实际 ${staffCount} 人`,
          suggestion: '建议增加排班人员或调整其他日期的排班'
        })
      }

      // 检查人员过多
      if (staffCount > requirement.max_staff_count) {
        conflicts.push({
          type: 'overstaffed',
          date,
          severity: 'medium',
          description: `${date} 人员过多，最多 ${requirement.max_staff_count} 人，实际 ${staffCount} 人`,
          suggestion: '建议减少排班人员以控制成本'
        })
      }

      // 检查成本超标
      const dayCost = this.getDateCost(date)
      if (dayCost > requirement.target_cost * 1.1) {
        conflicts.push({
          type: 'cost_exceeded',
          date,
          severity: 'high',
          description: `${date} 人力成本超标，目标 ${requirement.target_cost} 元，实际 ${dayCost.toFixed(2)} 元`,
          suggestion: '建议调整排班人员或优化岗位配置'
        })
      }
    }

    // 检查员工约束违反
    for (const employee of this.employees) {
      const workDays = this.getEmployeeWorkDays(employee.employee_id)

      if (workDays < employee.min_work_days) {
        conflicts.push({
          type: 'constraint_violation',
          date: '',
          severity: 'medium',
          description: `员工 ${employee.employee_name} 工作天数不足，最少 ${employee.min_work_days} 天，实际 ${workDays} 天`,
          affected_employees: [employee.employee_id],
          suggestion: '建议增加该员工的排班天数'
        })
      }

      if (workDays > employee.max_work_days) {
        conflicts.push({
          type: 'constraint_violation',
          date: '',
          severity: 'high',
          description: `员工 ${employee.employee_name} 工作天数过多，最多 ${employee.max_work_days} 天，实际 ${workDays} 天`,
          affected_employees: [employee.employee_id],
          suggestion: '建议减少该员工的排班天数'
        })
      }
    }

    return conflicts
  }

  /**
   * 计算统计数据
   */
  private calculateStatistics(): ScheduleStatistics {
    let totalWorkDays = 0
    let totalRestDays = 0
    let totalCost = 0
    const positionDistribution: Record<string, number> = {}
    const employeeWorkDays: Record<string, number> = {}

    for (const [_date, daySchedules] of this.schedules) {
      for (const schedule of daySchedules) {
        if (schedule.shift_type === 'work') {
          totalWorkDays++
          totalCost += schedule.cost || 0

          positionDistribution[schedule.position] = (positionDistribution[schedule.position] || 0) + 1
          employeeWorkDays[schedule.employee_id] = (employeeWorkDays[schedule.employee_id] || 0) + 1
        } else if (schedule.shift_type === 'rest') {
          totalRestDays++
        }
      }
    }

    const totalRevenue = this.dailyRequirements.reduce((sum, req) => sum + req.predicted_revenue, 0)
    const costRate = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0
    const averageCostPerDay = totalCost / this.schedules.size
    const staffUtilization = (totalWorkDays / (this.employees.length * this.schedules.size)) * 100

    return {
      total_work_days: totalWorkDays,
      total_rest_days: totalRestDays,
      total_cost: totalCost,
      average_cost_per_day: averageCostPerDay,
      cost_rate: costRate,
      staff_utilization: staffUtilization,
      position_distribution: positionDistribution,
      employee_work_days: employeeWorkDays
    }
  }

  /**
   * 生成建议
   */
  private generateSuggestions(conflicts: ScheduleConflict[], statistics: ScheduleStatistics): string[] {
    const suggestions: string[] = []

    // 基于冲突生成建议
    if (conflicts.length > 0) {
      const highSeverityCount = conflicts.filter((c) => c.severity === 'high').length
      if (highSeverityCount > 0) {
        suggestions.push(`发现 ${highSeverityCount} 个高优先级问题，建议优先解决`)
      }
    }

    // 基于统计数据生成建议
    if (statistics.cost_rate > (this.config.max_cost_rate || 30)) {
      suggestions.push(`人力成本率 ${statistics.cost_rate.toFixed(2)}% 超过目标，建议优化排班降低成本`)
    }

    if (statistics.staff_utilization < 70) {
      suggestions.push(`人员利用率 ${statistics.staff_utilization.toFixed(2)}% 偏低，建议优化排班提高效率`)
    }

    if (statistics.staff_utilization > 90) {
      suggestions.push(`人员利用率 ${statistics.staff_utilization.toFixed(2)}% 过高，建议增加休息时间避免员工疲劳`)
    }

    // 基于员工工作天数生成建议
    const workDaysArray = Object.values(statistics.employee_work_days)
    const _avgWorkDays = workDaysArray.reduce((a, b) => a + b, 0) / workDaysArray.length
    const maxWorkDays = Math.max(...workDaysArray)
    const minWorkDays = Math.min(...workDaysArray)

    if (maxWorkDays - minWorkDays > 5) {
      suggestions.push(`员工工作天数差异较大（${minWorkDays}-${maxWorkDays}天），建议平衡工作负荷`)
    }

    if (suggestions.length === 0) {
      suggestions.push('排班方案整体合理，无明显问题')
    }

    return suggestions
  }

  /**
   * 转换为结果格式
   */
  private convertToResults(): ScheduleResult[] {
    const results: ScheduleResult[] = []

    for (const [_date, daySchedules] of this.schedules) {
      results.push(...daySchedules)
    }

    // 为所有员工添加未排班的日期（标记为休息）
    for (const employee of this.employees) {
      for (const [date] of this.schedules) {
        const hasSchedule = results.some((r) => r.date === date && r.employee_id === employee.employee_id)

        if (!hasSchedule) {
          results.push({
            date,
            employee_id: employee.employee_id,
            employee_name: employee.employee_name,
            position: employee.position,
            shift_type: 'rest'
          })
        }
      }
    }

    return results.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.employee_name.localeCompare(b.employee_name)
    })
  }

  // ============================================
  // 辅助方法
  // ============================================

  private getDailyRequirementsMap(): Map<string, DailyScheduleRequirement> {
    const map = new Map<string, DailyScheduleRequirement>()
    for (const req of this.dailyRequirements) {
      map.set(req.date, req)
    }
    return map
  }

  private getDailyRequirement(date: string): DailyScheduleRequirement | undefined {
    return this.dailyRequirements.find((r) => r.date === date)
  }

  private canWorkOnDate(employee: EmployeeScheduleConstraint, date: string): boolean {
    // 检查是否已经请假
    if (employee.rest_day_requests.includes(date)) {
      return false
    }

    // 检查是否已经被分配
    const daySchedules = this.schedules.get(date) || []
    const hasSchedule = daySchedules.some((s) => s.employee_id === employee.employee_id)

    return !hasSchedule
  }

  private getEmployeeWorkDays(employeeId: string): number {
    let count = 0
    for (const [, daySchedules] of this.schedules) {
      for (const schedule of daySchedules) {
        if (schedule.employee_id === employeeId && schedule.shift_type === 'work') {
          count++
        }
      }
    }
    return count
  }

  private getEmployeeWorkDates(employeeId: string): string[] {
    const dates: string[] = []
    for (const [date, daySchedules] of this.schedules) {
      for (const schedule of daySchedules) {
        if (schedule.employee_id === employeeId && schedule.shift_type === 'work') {
          dates.push(date)
        }
      }
    }
    return dates
  }

  private getDateStaffCount(date: string): number {
    const daySchedules = this.schedules.get(date) || []
    return daySchedules.filter((s) => s.shift_type === 'work').length
  }

  private getDateCost(date: string): number {
    const daySchedules = this.schedules.get(date) || []
    return daySchedules.filter((s) => s.shift_type === 'work').reduce((sum, s) => sum + (s.cost || 0), 0)
  }

  private assignEmployeeToDate(employee: EmployeeScheduleConstraint, date: string, shiftType: 'work' | 'rest'): void {
    const daySchedules = this.schedules.get(date) || []

    // 检查是否已经存在
    const existingIndex = daySchedules.findIndex((s) => s.employee_id === employee.employee_id)

    if (existingIndex >= 0) {
      daySchedules[existingIndex].shift_type = shiftType
    } else {
      daySchedules.push({
        date,
        employee_id: employee.employee_id,
        employee_name: employee.employee_name,
        position: employee.position,
        shift_type: shiftType,
        work_hours: shiftType === 'work' ? 8 : undefined,
        cost: shiftType === 'work' ? 200 : undefined // 默认成本，实际应该从员工数据获取
      })
    }

    this.schedules.set(date, daySchedules)
  }

  private changeEmployeeShift(employeeId: string, date: string, newShiftType: 'work' | 'rest'): void {
    const daySchedules = this.schedules.get(date) || []
    const schedule = daySchedules.find((s) => s.employee_id === employeeId)

    if (schedule) {
      schedule.shift_type = newShiftType
      schedule.work_hours = newShiftType === 'work' ? 8 : undefined
      schedule.cost = newShiftType === 'work' ? 200 : undefined
    }
  }
}

/**
 * 生成月度排班
 */
export async function generateMonthlySchedule(request: GenerateScheduleRequest): Promise<MonthlyScheduleResult> {
  const generator = new ScheduleGenerator(request)
  return generator.generate()
}
