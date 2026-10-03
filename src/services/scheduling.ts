/**
 * 排班计算服务
 * 反向排班计算、智能休假推荐、排班优化
 */

import {getScheduleLogsByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'
import type {RestRecommendation} from '@/db/types-v2'

// 重新导出类型
export type {OptimizationSuggestion} from '@/db/types-v2'

/**
 * 优化建议（用于页面显示）
 */
export interface OptimizationSuggestionDisplay {
  id: string
  tenant_id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  expected_benefit: string
  created_at: string
}

/**
 * 排班需求计算结果
 */
export interface SchedulingResult {
  requiredStaff: number
  estimatedCost: number
  costRatio: number
  feasible: boolean
  reason?: string
}

/**
 * 休假推荐
 */
export interface VacationRecommendation {
  employeeId: string
  employeeName: string
  recommendedDate: string
  days: number
  priority: 'high' | 'medium' | 'low'
  reason: string
}

/**
 * 反向排班计算参数
 */
export interface ReverseSchedulingParams {
  targetRevenue: number
  efficiencyStandard: number
  availableEmployees: Employee[]
  targetDate: string
  tenantId?: string
}

/**
 * 反向排班计算结果
 */
export interface ReverseSchedulingResult {
  targetEmployeeCount: number
  availableCount: number
  restRequired: number
  recommendedRest: RestRecommendation[]
  partTimeRequired: number
  corePositionsCovered: boolean
  warnings: string[]
}

/**
 * 排班计算引擎
 */
export class SchedulingEngine {
  /**
   * 反向排班计算
   * 根据目标营收和人效标准，计算所需人力
   */
  async reverseCalculate(params: ReverseSchedulingParams): Promise<ReverseSchedulingResult> {
    try {
      const {targetRevenue, efficiencyStandard, availableEmployees, targetDate, tenantId} = params

      // 1. 计算理论需求人数
      const targetEmployeeCount = targetRevenue / efficiencyStandard

      // 2. 计算可休人数
      const availableCount = availableEmployees.length
      const restRequired = availableCount - targetEmployeeCount

      // 3. 生成休假推荐
      const recommendedRest = await this.recommendRestEmployees(
        availableEmployees,
        Math.ceil(restRequired),
        targetDate,
        tenantId
      )

      // 4. 检查核心岗位覆盖
      const corePositionsCovered = this.checkCorePositions(availableEmployees, recommendedRest)

      // 5. 计算兼职需求
      const partTimeRequired = Math.max(0, targetEmployeeCount - availableCount)

      // 6. 生成警告信息
      const warnings = this.generateWarnings({
        targetEmployeeCount,
        availableCount,
        restRequired,
        corePositionsCovered,
        partTimeRequired
      })

      return {
        targetEmployeeCount: Math.round(targetEmployeeCount * 10) / 10,
        availableCount,
        restRequired: Math.round(restRequired * 10) / 10,
        recommendedRest,
        partTimeRequired: Math.round(partTimeRequired * 10) / 10,
        corePositionsCovered,
        warnings
      }
    } catch (error) {
      console.error('反向排班计算失败:', error)
      throw error
    }
  }

  /**
   * 智能休假推荐
   */
  private async recommendRestEmployees(
    employees: Employee[],
    count: number,
    targetDate: string,
    tenantId?: string
  ): Promise<RestRecommendation[]> {
    const recommendations: RestRecommendation[] = []

    for (const employee of employees) {
      const score = await this.calculateRestScore(employee, targetDate, tenantId)

      recommendations.push({
        employee_id: employee.id,
        employee_name: employee.name,
        position: employee.position,
        score,
        reasons: this.generateRestReasons(employee, score),
        cost_saving: employee.monthly_salary ? Math.round(employee.monthly_salary / 30) : 0,
        risk_level: this.assessRestRisk(employee, score)
      })
    }

    // 按分数排序，返回前N个
    recommendations.sort((a, b) => b.score - a.score)
    return recommendations.slice(0, Math.max(0, count))
  }

  /**
   * 计算休假推荐分数
   */
  private async calculateRestScore(employee: Employee, targetDate: string, tenantId?: string): Promise<number> {
    try {
      // 1. 技能可替代性 (30%)
      const substitutability = await this.assessSubstitutability(employee)

      // 2. 工作负荷平衡 (25%)
      const workloadBalance = await this.assessWorkloadBalance(employee, targetDate, tenantId)

      // 3. 员工偏好 (20%) - 暂时使用默认值
      const preference = 0.5

      // 4. 团队协作 (15%) - 暂时使用默认值
      const teamCollaboration = 0.5

      // 5. 成本优化 (10%)
      const costOptimization = this.assessCostImpact(employee)

      // 综合评分
      const score =
        substitutability * 0.3 +
        workloadBalance * 0.25 +
        preference * 0.2 +
        teamCollaboration * 0.15 +
        costOptimization * 0.1

      return Math.round(score * 100)
    } catch (error) {
      console.error('计算休假分数失败:', error)
      return 50 // 默认中等分数
    }
  }

  /**
   * 评估技能可替代性
   */
  private async assessSubstitutability(employee: Employee): Promise<number> {
    // 核心岗位（主厨、店长）可替代性低
    const corePositions = ['主厨', '店长', '经理']
    if (corePositions.some((pos) => employee.position.includes(pos))) {
      return 0.2
    }

    // 普通岗位可替代性高
    return 0.8
  }

  /**
   * 评估工作负荷平衡
   */
  private async assessWorkloadBalance(employee: Employee, targetDate: string, tenantId?: string): Promise<number> {
    try {
      if (!tenantId) {
        return 0.5 // 默认中等分数
      }

      // 获取最近30天的排班记录
      const endDate = new Date(targetDate)
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 30)

      const allLogs = await getScheduleLogsByTenantId(tenantId, {
        startDate: startDate.toISOString().substring(0, 10),
        endDate: endDate.toISOString().substring(0, 10)
      })

      // 过滤该员工的记录
      const logs = allLogs.filter((log) => log.employee_id === employee.id)

      // 计算工作天数
      const workDays = logs.length

      // 工作天数越多，越需要休息，分数越高
      // 30天工作25天以上 -> 高分
      // 30天工作20天以下 -> 低分
      if (workDays >= 25) return 1.0
      if (workDays >= 22) return 0.8
      if (workDays >= 20) return 0.6
      if (workDays >= 15) return 0.4
      return 0.2
    } catch (error) {
      console.error('评估工作负荷失败:', error)
      return 0.5
    }
  }

  /**
   * 评估成本影响
   */
  private assessCostImpact(employee: Employee): number {
    if (!employee.monthly_salary) {
      return 0.5
    }

    // 薪资越高，休假节省成本越多，分数越高
    // 但要考虑岗位重要性
    const dailySalary = employee.monthly_salary / 30

    if (dailySalary >= 300) return 0.8
    if (dailySalary >= 200) return 0.6
    if (dailySalary >= 150) return 0.5
    return 0.3
  }

  /**
   * 生成休假推荐原因
   */
  private generateRestReasons(employee: Employee, score: number): string[] {
    const reasons: string[] = []

    if (score >= 80) {
      reasons.push('综合评分优秀，强烈推荐休假')
    }

    // 根据岗位判断
    const corePositions = ['主厨', '店长', '经理']
    if (!corePositions.some((pos) => employee.position.includes(pos))) {
      reasons.push('岗位技能可替代性高')
    } else {
      reasons.push('核心岗位，需确认替补到位')
    }

    // 根据薪资判断
    if (employee.monthly_salary && employee.monthly_salary / 30 >= 200) {
      reasons.push(`可节省成本约¥${Math.round(employee.monthly_salary / 30)}`)
    }

    return reasons
  }

  /**
   * 评估休假风险
   */
  private assessRestRisk(employee: Employee, score: number): 'low' | 'medium' | 'high' {
    const corePositions = ['主厨', '店长', '经理']
    const isCore = corePositions.some((pos) => employee.position.includes(pos))

    if (isCore) {
      return 'high'
    }

    if (score >= 80) {
      return 'low'
    }

    return 'medium'
  }

  /**
   * 检查核心岗位覆盖
   */
  private checkCorePositions(allEmployees: Employee[], restEmployees: RestRecommendation[]): boolean {
    const corePositions = ['主厨', '店长', '经理']
    const restIds = new Set(restEmployees.map((r) => r.employee_id))

    // 检查每个核心岗位是否至少有1人在岗
    for (const position of corePositions) {
      const positionEmployees = allEmployees.filter((e) => e.position.includes(position))
      const onDutyCount = positionEmployees.filter((e) => !restIds.has(e.id)).length

      if (onDutyCount === 0) {
        return false
      }
    }

    return true
  }

  /**
   * 生成警告信息
   */
  private generateWarnings(data: {
    targetEmployeeCount: number
    availableCount: number
    restRequired: number
    corePositionsCovered: boolean
    partTimeRequired: number
  }): string[] {
    const warnings: string[] = []

    // 人员不足警告
    if (data.availableCount < data.targetEmployeeCount) {
      warnings.push(`人员不足，建议增加${Math.ceil(data.partTimeRequired)}名兼职`)
    }

    // 核心岗位警告
    if (!data.corePositionsCovered) {
      warnings.push('核心岗位覆盖不足，请谨慎安排休假')
    }

    // 休假人数过多警告
    if (data.restRequired > data.availableCount * 0.3) {
      warnings.push('建议休假人数较多，请确认营收预测准确性')
    }

    // 休假人数为负警告
    if (data.restRequired < 0) {
      warnings.push('人员紧张，建议所有人员在岗')
    }

    return warnings
  }

  /**
   * 生成动态调整建议
   */
  async generateAdjustmentSuggestions(
    currentRevenue: number,
    targetRevenue: number,
    currentEmployees: Employee[],
    availableEmployees: Employee[]
  ): Promise<OptimizationSuggestionDisplay[]> {
    const suggestions: OptimizationSuggestionDisplay[] = []

    // 计算营收差异
    const revenueDiff = targetRevenue - currentRevenue
    const diffRate = revenueDiff / currentRevenue

    // 如果营收超出预期20%以上，建议增加人手
    if (diffRate > 0.2) {
      const additionalEmployees = availableEmployees.filter((e) => !currentEmployees.some((ce) => ce.id === e.id))

      for (const employee of additionalEmployees.slice(0, 3)) {
        const costImpact = employee.monthly_salary ? employee.monthly_salary / 30 : 150
        const revenueImpact = 800 // 假设每人可增加800元营收
        const roi = revenueImpact / costImpact

        suggestions.push({
          id: `opt_${Date.now()}_${employee.id}`,
          tenant_id: employee.tenant_id,
          title: `增加员工：${employee.name}`,
          description: `营收超预期${Math.round(diffRate * 100)}%，建议增加${employee.position}岗位人手`,
          priority: roi > 5 ? 'high' : 'medium',
          expected_benefit: `预计增加营收${revenueImpact}元，成本${costImpact}元，ROI: ${Math.round(roi * 10) / 10}`,
          created_at: new Date().toISOString()
        })
      }
    }

    // 如果营收低于预期20%以上，建议减少人手
    if (diffRate < -0.2) {
      const nonCoreEmployees = currentEmployees.filter((e) => {
        const corePositions = ['主厨', '店长', '经理']
        return !corePositions.some((pos) => e.position.includes(pos))
      })

      for (const employee of nonCoreEmployees.slice(0, 2)) {
        const costImpact = employee.monthly_salary ? employee.monthly_salary / 30 : 150

        suggestions.push({
          id: `opt_${Date.now()}_${employee.id}`,
          tenant_id: employee.tenant_id,
          title: `减少员工：${employee.name}`,
          description: `营收低于预期${Math.round(Math.abs(diffRate) * 100)}%，建议减少${employee.position}岗位人手`,
          priority: 'medium',
          expected_benefit: `预计节省成本${costImpact}元`,
          created_at: new Date().toISOString()
        })
      }
    }

    // 按优先级排序
    const priorityOrder = {high: 1, medium: 2, low: 3}
    suggestions.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    return suggestions
  }

  /**
   * 计算排班需求
   */
  async calculateSchedulingNeeds(
    _tenantId: string,
    targetRevenue: number,
    _targetDate: string,
    _storeId?: string
  ): Promise<SchedulingResult> {
    try {
      // 假设人效标准为每人每天1000元
      const efficiencyStandard = 1000
      const requiredStaff = Math.ceil(targetRevenue / efficiencyStandard)

      // 假设人均成本为200元/天
      const avgCost = 200
      const estimatedCost = requiredStaff * avgCost
      const costRatio = (estimatedCost / targetRevenue) * 100

      // 判断可行性
      const feasible = costRatio <= 40 // 成本占比不超过40%

      return {
        requiredStaff,
        estimatedCost,
        costRatio,
        feasible,
        reason: feasible ? '排班方案可行' : '成本占比过高，建议优化排班或提高人效'
      }
    } catch (error) {
      console.error('计算排班需求失败:', error)
      throw error
    }
  }

  /**
   * 推荐休假
   */
  async recommendVacations(
    _tenantId: string,
    targetDate: string,
    _storeId?: string
  ): Promise<VacationRecommendation[]> {
    try {
      // 这里返回模拟数据，实际应该根据员工工作强度、休假历史等因素计算
      const recommendations: VacationRecommendation[] = [
        {
          employeeId: '1',
          employeeName: '张三',
          recommendedDate: targetDate,
          days: 2,
          priority: 'high',
          reason: '连续工作30天，建议安排休假'
        },
        {
          employeeId: '2',
          employeeName: '李四',
          recommendedDate: targetDate,
          days: 1,
          priority: 'medium',
          reason: '工作强度较高，建议适当休息'
        }
      ]

      return recommendations
    } catch (error) {
      console.error('推荐休假失败:', error)
      return []
    }
  }

  /**
   * 优化排班
   */
  async optimizeScheduling(
    tenantId: string,
    _targetDate: string,
    _storeId?: string
  ): Promise<OptimizationSuggestionDisplay[]> {
    try {
      // 这里返回模拟数据，实际应该根据历史数据和AI算法生成优化建议
      const suggestions: OptimizationSuggestionDisplay[] = [
        {
          id: '1',
          tenant_id: tenantId,
          title: '优化早班人员配置',
          description: '早班时段客流量较少，建议减少1-2名员工',
          priority: 'medium',
          expected_benefit: '预计节省成本15%',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          tenant_id: tenantId,
          title: '增加晚班人员',
          description: '晚班时段客流量较大，建议增加1名员工提升服务质量',
          priority: 'high',
          expected_benefit: '预计提升营收10%',
          created_at: new Date().toISOString()
        }
      ]

      return suggestions
    } catch (error) {
      console.error('优化排班失败:', error)
      return []
    }
  }
}

/**
 * 创建排班引擎实例
 */
export const schedulingEngine = new SchedulingEngine()

// 别名导出，方便使用
export const schedulingService = schedulingEngine
