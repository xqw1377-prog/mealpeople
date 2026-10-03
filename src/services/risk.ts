/**
 * 风险预警服务
 * 实时监控排班风险，提前预警潜在问题
 */

import {getCostDataByTenantId, getEmployeesByStoreId, getScheduleLogsByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'

/**
 * 风险预警（用于页面显示）
 */
export interface RiskAlert {
  id: string
  type: string
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  suggestion: string
  created_at: string
}

/**
 * 风险检测结果
 */
export interface RiskDetectionResult {
  highRisks: RiskAlert[]
  mediumRisks: RiskAlert[]
  lowRisks: RiskAlert[]
  totalCount: number
}

/**
 * 风险预警引擎
 */
export class RiskAlertEngine {
  /**
   * 检测所有风险
   */
  async detectAllRisks(tenantId: string, storeId?: string): Promise<RiskDetectionResult> {
    const risks: RiskAlert[] = []

    try {
      // 1. 检测人员风险
      const personnelRisks = await this.detectPersonnelRisks(tenantId, storeId)
      risks.push(...personnelRisks)

      // 2. 检测成本风险
      const costRisks = await this.detectCostRisks(tenantId, storeId)
      risks.push(...costRisks)

      // 3. 检测运营风险
      const operationRisks = await this.detectOperationRisks(tenantId, storeId)
      risks.push(...operationRisks)

      // 按风险等级分类
      const highRisks = risks.filter((r) => r.severity === 'high')
      const mediumRisks = risks.filter((r) => r.severity === 'medium')
      const lowRisks = risks.filter((r) => r.severity === 'low')

      return {
        highRisks,
        mediumRisks,
        lowRisks,
        totalCount: risks.length
      }
    } catch (error) {
      console.error('风险检测失败:', error)
      return {
        highRisks: [],
        mediumRisks: [],
        lowRisks: [],
        totalCount: 0
      }
    }
  }

  /**
   * 检测人员风险
   */
  private async detectPersonnelRisks(tenantId: string, storeId?: string): Promise<RiskAlert[]> {
    const risks: RiskAlert[] = []

    try {
      // 获取员工数据
      const employees = storeId ? await getEmployeesByStoreId(storeId) : []

      // 1. 核心岗位备份不足
      const corePositionRisk = this.checkCorePositionBackup(employees, tenantId, storeId)
      if (corePositionRisk) {
        risks.push(corePositionRisk)
      }

      // 2. 员工工作强度过高
      for (const employee of employees) {
        const workloadRisk = await this.checkEmployeeWorkload(employee, tenantId, storeId)
        if (workloadRisk) {
          risks.push(workloadRisk)
        }
      }

      // 3. 技能覆盖不完整
      const skillCoverageRisk = this.checkSkillCoverage(employees, tenantId, storeId)
      if (skillCoverageRisk) {
        risks.push(skillCoverageRisk)
      }
    } catch (error) {
      console.error('检测人员风险失败:', error)
    }

    return risks
  }

  /**
   * 检查核心岗位备份
   */
  private checkCorePositionBackup(employees: Employee[], _tenantId: string, _storeId?: string): RiskAlert | null {
    const corePositions = ['主厨', '店长', '经理']
    const insufficientPositions: string[] = []

    for (const position of corePositions) {
      const count = employees.filter((e) => e.position.includes(position)).length
      if (count < 2) {
        insufficientPositions.push(`${position}(${count}人)`)
      }
    }

    if (insufficientPositions.length > 0) {
      return {
        id: `risk_${Date.now()}_core_position`,
        type: 'personnel',
        severity: 'high',
        title: '核心岗位备份不足',
        description: `以下核心岗位人员不足：${insufficientPositions.join('、')}。一旦核心人员请假或离职，将严重影响运营`,
        suggestion: '从现有员工中选拔培养核心岗位后备人才，或招聘新员工补充',
        created_at: new Date().toISOString()
      }
    }

    return null
  }

  /**
   * 检查员工工作强度
   */
  private async checkEmployeeWorkload(
    employee: Employee,
    tenantId: string,
    storeId?: string
  ): Promise<RiskAlert | null> {
    try {
      // 获取最近30天的排班记录
      const scheduleLogs = await getScheduleLogsByTenantId(tenantId)
      const employeeLogs = scheduleLogs.filter(
        (log) => log.employee_id === employee.id && (!storeId || log.store_id === storeId)
      )

      // 计算连续工作天数
      const recentLogs = employeeLogs.slice(-30)
      let consecutiveDays = 0
      for (let i = recentLogs.length - 1; i >= 0; i--) {
        if (recentLogs[i].completion_status === 'completed') {
          consecutiveDays++
        } else {
          break
        }
      }

      // 如果连续工作超过15天，发出预警
      if (consecutiveDays >= 15) {
        return {
          id: `risk_${Date.now()}_workload_${employee.id}`,
          type: 'personnel',
          severity: consecutiveDays >= 20 ? 'high' : 'medium',
          title: `员工${employee.name}工作强度过高`,
          description: `已连续工作${consecutiveDays}天，存在过劳风险`,
          suggestion: '建议安排休假，避免员工过度疲劳影响工作质量和身体健康',
          created_at: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('检查员工工作强度失败:', error)
    }

    return null
  }

  /**
   * 检查技能覆盖
   */
  private checkSkillCoverage(employees: Employee[], _tenantId: string, _storeId?: string): RiskAlert | null {
    // 定义必需技能
    const requiredSkills = ['烹饪', '服务', '收银', '清洁']
    const missingSkills: string[] = []

    for (const skill of requiredSkills) {
      const hasSkill = employees.some((e) => e.position.includes(skill) || e.name.includes(skill))
      if (!hasSkill) {
        missingSkills.push(skill)
      }
    }

    if (missingSkills.length > 0) {
      return {
        id: `risk_${Date.now()}_skill_coverage`,
        type: 'personnel',
        severity: 'medium',
        title: '技能覆盖不完整',
        description: `缺少以下技能人员：${missingSkills.join('、')}`,
        suggestion: '招聘或培训员工，确保所有必需技能都有人员覆盖',
        created_at: new Date().toISOString()
      }
    }

    return null
  }

  /**
   * 检测成本风险
   */
  private async detectCostRisks(tenantId: string, storeId?: string): Promise<RiskAlert[]> {
    const risks: RiskAlert[] = []

    try {
      // 获取成本数据
      const costData = await getCostDataByTenantId(tenantId)
      const relevantData = storeId ? costData.filter((d) => d.store_id === storeId) : costData

      if (relevantData.length === 0) {
        return risks
      }

      // 1. 人力成本占比过高
      const avgCostRatio = relevantData.reduce((sum, d) => sum + (d.labor_cost_ratio || 0), 0) / relevantData.length

      if (avgCostRatio > 40) {
        risks.push({
          id: `risk_${Date.now()}_cost_ratio`,
          type: 'cost',
          severity: avgCostRatio > 50 ? 'high' : 'medium',
          title: '人力成本占比过高',
          description: `当前人力成本占比${avgCostRatio.toFixed(1)}%，超过健康水平（40%）`,
          suggestion: '优化排班，提高人效，或考虑调整薪资结构',
          created_at: new Date().toISOString()
        })
      }

      // 2. 人效下降
      const recentData = relevantData.slice(-7)
      const olderData = relevantData.slice(-14, -7)

      if (recentData.length > 0 && olderData.length > 0) {
        const recentEfficiency = recentData.reduce((sum, d) => sum + (d.avg_efficiency || 0), 0) / recentData.length
        const olderEfficiency = olderData.reduce((sum, d) => sum + (d.avg_efficiency || 0), 0) / olderData.length

        const efficiencyChange = ((recentEfficiency - olderEfficiency) / olderEfficiency) * 100

        if (efficiencyChange < -10) {
          risks.push({
            id: `risk_${Date.now()}_efficiency_drop`,
            type: 'cost',
            severity: efficiencyChange < -20 ? 'high' : 'medium',
            title: '人效下降',
            description: `近期人效下降${Math.abs(efficiencyChange).toFixed(1)}%`,
            suggestion: '分析人效下降原因，可能需要培训员工或优化工作流程',
            created_at: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.error('检测成本风险失败:', error)
    }

    return risks
  }

  /**
   * 检测运营风险
   */
  private async detectOperationRisks(_tenantId: string, _storeId?: string): Promise<RiskAlert[]> {
    const risks: RiskAlert[] = []

    // 这里可以添加更多运营风险检测逻辑
    // 例如：排班冲突、班次覆盖不足等

    return risks
  }

  /**
   * 生成风险报告
   */
  async generateRiskReport(tenantId: string, storeId?: string): Promise<string> {
    const result = await this.detectAllRisks(tenantId, storeId)

    let report = '=== 风险预警报告 ===\n\n'

    if (result.totalCount === 0) {
      report += '✅ 暂无风险预警\n'
      return report
    }

    const {highRisks, mediumRisks, lowRisks} = result

    if (highRisks.length > 0) {
      report += `🔴 高风险警告（${highRisks.length}项）\n`
      for (const risk of highRisks) {
        report += `  - ${risk.title}: ${risk.description}\n`
        report += `    建议：${risk.suggestion}\n\n`
      }
    }

    if (mediumRisks.length > 0) {
      report += `🟡 中风险提示（${mediumRisks.length}项）\n`
      for (const risk of mediumRisks) {
        report += `  - ${risk.title}: ${risk.description}\n`
        report += `    建议：${risk.suggestion}\n\n`
      }
    }

    if (lowRisks.length > 0) {
      report += `ℹ️  低风险监控（${lowRisks.length}项）\n`
    }

    return report
  }

  /**
   * detectRisks别名方法，指向detectAllRisks
   */
  async detectRisks(tenantId: string, storeId?: string): Promise<RiskDetectionResult> {
    return this.detectAllRisks(tenantId, storeId)
  }
}

/**
 * 创建风险预警引擎实例
 */
export const riskAlertEngine = new RiskAlertEngine()

// 别名导出，方便使用
export const riskWarningService = riskAlertEngine
