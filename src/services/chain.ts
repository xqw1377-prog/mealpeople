/**
 * 连锁店协同管理系统
 * 提供跨店数据同步、人员调配和数据汇总功能
 */

import {getCostDataByTenantId, getEmployeesByTenantId, getScheduleLogsByTenantId, getStoresByTenantId} from '@/db/api'
import type {Employee} from '@/db/types'

/**
 * 店铺数据汇总
 */
export interface StoreDataSummary {
  storeId: string
  storeName: string
  // 营收数据
  totalRevenue: number
  avgRevenue: number
  revenueGrowth: number
  // 成本数据
  totalCost: number
  avgCost: number
  costRatio: number
  // 人员数据
  employeeCount: number
  avgEfficiency: number
  // 排班数据
  totalShifts: number
  completionRate: number
  excellentRate: number
}

/**
 * 连锁店对比分析
 */
export interface ChainComparison {
  metric: string // 指标名称
  stores: Array<{
    storeId: string
    storeName: string
    value: number
    rank: number
  }>
  average: number // 平均值
  best: {storeId: string; storeName: string; value: number} // 最佳
  worst: {storeId: string; storeName: string; value: number} // 最差
}

/**
 * 人员调配建议
 */
export interface StaffTransferSuggestion {
  id: string
  priority: 'high' | 'medium' | 'low' // 优先级
  fromStore: {id: string; name: string} // 来源店铺
  toStore: {id: string; name: string} // 目标店铺
  employees: Array<{
    id: string
    name: string
    position: string
    reason: string
  }>
  reason: string // 调配原因
  expectedBenefit: string // 预期收益
}

/**
 * 连锁店协同管理服务
 */
export class ChainManagementService {
  /**
   * 获取所有店铺数据汇总
   */
  async getStoresSummary(tenantId: string, days: number = 30): Promise<StoreDataSummary[]> {
    try {
      // 计算日期范围
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString().substring(0, 10)

      // 获取数据
      const [stores, employees, costData, scheduleLogs] = await Promise.all([
        getStoresByTenantId(tenantId),
        getEmployeesByTenantId(tenantId),
        getCostDataByTenantId(tenantId),
        getScheduleLogsByTenantId(tenantId, {startDate: startDateStr})
      ])

      // 过滤时间范围内的数据
      const filteredCostData = costData.filter((item) => {
        const itemDate = new Date(item.data_date)
        return itemDate >= startDate && itemDate <= endDate
      })

      // 为每个店铺生成汇总数据
      const summaries: StoreDataSummary[] = stores.map((store) => {
        // 过滤该店铺的数据
        const storeCostData = filteredCostData.filter((item) => item.store_id === store.id)
        const storeEmployees = employees.filter((emp) => emp.store_id === store.id)
        const storeScheduleLogs = scheduleLogs.filter((log) => {
          const employee = employees.find((e) => e.id === log.employee_id)
          return employee?.store_id === store.id
        })

        // 营收数据
        const revenues = storeCostData.map((d) => d.revenue || 0)
        const totalRevenue = revenues.reduce((sum, val) => sum + val, 0)
        const avgRevenue = revenues.length > 0 ? totalRevenue / revenues.length : 0

        // 计算营收增长率
        const midPoint = Math.floor(revenues.length / 2)
        const firstHalf = revenues.slice(0, midPoint)
        const secondHalf = revenues.slice(midPoint)
        const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length : 0
        const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length : 0
        const revenueGrowth = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

        // 成本数据
        const costs = storeCostData.map((d) => d.labor_cost || 0)
        const totalCost = costs.reduce((sum, val) => sum + val, 0)
        const avgCost = costs.length > 0 ? totalCost / costs.length : 0
        const costRatio = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0

        // 人员数据
        const employeeCount = storeEmployees.length
        const efficiencies = storeCostData.map((d) => d.avg_efficiency || 0).filter((v) => v > 0)
        const avgEfficiency =
          efficiencies.length > 0 ? efficiencies.reduce((sum, val) => sum + val, 0) / efficiencies.length : 0

        // 排班数据
        const totalShifts = storeScheduleLogs.length
        const completedShifts = storeScheduleLogs.filter((log) => log.completion_status === 'completed').length
        const excellentShifts = storeScheduleLogs.filter((log) => (log.score || 0) >= 90).length
        const completionRate = totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0
        const excellentRate = totalShifts > 0 ? (excellentShifts / totalShifts) * 100 : 0

        return {
          storeId: store.id,
          storeName: store.name,
          totalRevenue,
          avgRevenue,
          revenueGrowth,
          totalCost,
          avgCost,
          costRatio,
          employeeCount,
          avgEfficiency,
          totalShifts,
          completionRate,
          excellentRate
        }
      })

      return summaries
    } catch (error) {
      console.error('获取店铺汇总数据失败:', error)
      return []
    }
  }

  /**
   * 连锁店对比分析
   */
  async compareStores(tenantId: string, days: number = 30): Promise<ChainComparison[]> {
    try {
      const summaries = await this.getStoresSummary(tenantId, days)

      if (summaries.length === 0) {
        return []
      }

      const comparisons: ChainComparison[] = []

      // 营收对比
      comparisons.push(this.createComparison('平均营收', summaries, (s) => s.avgRevenue))

      // 营收增长率对比
      comparisons.push(this.createComparison('营收增长率', summaries, (s) => s.revenueGrowth))

      // 成本占比对比
      comparisons.push(this.createComparison('成本占比', summaries, (s) => s.costRatio))

      // 平均效率对比
      comparisons.push(this.createComparison('平均效率', summaries, (s) => s.avgEfficiency))

      // 完成率对比
      comparisons.push(this.createComparison('排班完成率', summaries, (s) => s.completionRate))

      // 优秀率对比
      comparisons.push(this.createComparison('排班优秀率', summaries, (s) => s.excellentRate))

      return comparisons
    } catch (error) {
      console.error('连锁店对比分析失败:', error)
      return []
    }
  }

  /**
   * 创建对比分析
   */
  private createComparison(
    metric: string,
    summaries: StoreDataSummary[],
    getValue: (s: StoreDataSummary) => number
  ): ChainComparison {
    // 提取值并排序
    const storeValues = summaries
      .map((s) => ({
        storeId: s.storeId,
        storeName: s.storeName,
        value: getValue(s)
      }))
      .sort((a, b) => b.value - a.value)

    // 添加排名
    const stores = storeValues.map((item, index) => ({
      ...item,
      rank: index + 1
    }))

    // 计算平均值
    const values = stores.map((s) => s.value)
    const average = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0

    // 最佳和最差
    const best = stores[0] || {storeId: '', storeName: '', value: 0}
    const worst = stores[stores.length - 1] || {storeId: '', storeName: '', value: 0}

    return {
      metric,
      stores,
      average,
      best: {storeId: best.storeId, storeName: best.storeName, value: best.value},
      worst: {storeId: worst.storeId, storeName: worst.storeName, value: worst.value}
    }
  }

  /**
   * 生成人员调配建议
   */
  async generateTransferSuggestions(tenantId: string, days: number = 30): Promise<StaffTransferSuggestion[]> {
    try {
      const summaries = await this.getStoresSummary(tenantId, days)
      const employees = await getEmployeesByTenantId(tenantId)

      if (summaries.length < 2) {
        return []
      }

      const suggestions: StaffTransferSuggestion[] = []

      // 1. 基于人员效率的调配建议
      suggestions.push(...this.suggestEfficiencyBasedTransfer(summaries, employees))

      // 2. 基于人员负载的调配建议
      suggestions.push(...this.suggestWorkloadBasedTransfer(summaries, employees))

      // 3. 基于业绩的调配建议
      suggestions.push(...this.suggestPerformanceBasedTransfer(summaries, employees))

      return suggestions.sort((a, b) => {
        const priorityOrder = {high: 3, medium: 2, low: 1}
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
    } catch (error) {
      console.error('生成人员调配建议失败:', error)
      return []
    }
  }

  /**
   * 基于效率的调配建议
   */
  private suggestEfficiencyBasedTransfer(
    summaries: StoreDataSummary[],
    employees: Employee[]
  ): StaffTransferSuggestion[] {
    const suggestions: StaffTransferSuggestion[] = []

    // 找出效率最高和最低的店铺
    const sortedByEfficiency = [...summaries].sort((a, b) => b.avgEfficiency - a.avgEfficiency)
    const bestStore = sortedByEfficiency[0]
    const worstStore = sortedByEfficiency[sortedByEfficiency.length - 1]

    // 如果效率差距超过20%，建议调配
    if (bestStore && worstStore && bestStore.avgEfficiency > 0) {
      const gap = ((bestStore.avgEfficiency - worstStore.avgEfficiency) / bestStore.avgEfficiency) * 100

      if (gap > 20) {
        // 从高效店铺选择优秀员工
        const bestStoreEmployees = employees.filter(
          (emp) => emp.store_id === bestStore.storeId && emp.status === 'active'
        )

        if (bestStoreEmployees.length > 0) {
          // 选择1-2名员工
          const selectedEmployees = bestStoreEmployees.slice(0, Math.min(2, Math.floor(bestStoreEmployees.length / 3)))

          if (selectedEmployees.length > 0) {
            suggestions.push({
              id: `transfer_efficiency_${Date.now()}`,
              priority: gap > 40 ? 'high' : 'medium',
              fromStore: {id: bestStore.storeId, name: bestStore.storeName},
              toStore: {id: worstStore.storeId, name: worstStore.storeName},
              employees: selectedEmployees.map((emp) => ({
                id: emp.id,
                name: emp.name,
                position: emp.position || '员工',
                reason: '高效率员工，可带动团队提升'
              })),
              reason: `${worstStore.storeName}效率较低（${worstStore.avgEfficiency.toFixed(1)}），建议从${bestStore.storeName}调配优秀员工进行帮扶`,
              expectedBenefit: `预计可提升${worstStore.storeName}效率10-15%`
            })
          }
        }
      }
    }

    return suggestions
  }

  /**
   * 基于工作负载的调配建议
   */
  private suggestWorkloadBasedTransfer(
    summaries: StoreDataSummary[],
    employees: Employee[]
  ): StaffTransferSuggestion[] {
    const suggestions: StaffTransferSuggestion[] = []

    // 计算每个店铺的人均排班数
    const storesWithWorkload = summaries.map((s) => ({
      ...s,
      shiftsPerEmployee: s.employeeCount > 0 ? s.totalShifts / s.employeeCount : 0
    }))

    // 找出负载最高和最低的店铺
    const sortedByWorkload = [...storesWithWorkload].sort((a, b) => b.shiftsPerEmployee - a.shiftsPerEmployee)
    const busiestStore = sortedByWorkload[0]
    const lightestStore = sortedByWorkload[sortedByWorkload.length - 1]

    // 如果负载差距超过30%，建议调配
    if (busiestStore && lightestStore && busiestStore.shiftsPerEmployee > 0) {
      const gap =
        ((busiestStore.shiftsPerEmployee - lightestStore.shiftsPerEmployee) / busiestStore.shiftsPerEmployee) * 100

      if (gap > 30 && lightestStore.employeeCount > 2) {
        // 从轻松店铺选择员工
        const lightStoreEmployees = employees.filter(
          (emp) => emp.store_id === lightestStore.storeId && emp.status === 'active'
        )

        if (lightStoreEmployees.length > 0) {
          // 选择1名员工
          const selectedEmployees = lightStoreEmployees.slice(0, 1)

          suggestions.push({
            id: `transfer_workload_${Date.now()}`,
            priority: gap > 50 ? 'high' : 'medium',
            fromStore: {id: lightestStore.storeId, name: lightestStore.storeName},
            toStore: {id: busiestStore.storeId, name: busiestStore.storeName},
            employees: selectedEmployees.map((emp) => ({
              id: emp.id,
              name: emp.name,
              position: emp.position || '员工',
              reason: '来自负载较轻店铺，可支援繁忙店铺'
            })),
            reason: `${busiestStore.storeName}人均排班数较高（${busiestStore.shiftsPerEmployee.toFixed(1)}），建议从${lightestStore.storeName}调配人员支援`,
            expectedBenefit: `预计可降低${busiestStore.storeName}人员工作强度20%`
          })
        }
      }
    }

    return suggestions
  }

  /**
   * 基于业绩的调配建议
   */
  private suggestPerformanceBasedTransfer(
    summaries: StoreDataSummary[],
    employees: Employee[]
  ): StaffTransferSuggestion[] {
    const suggestions: StaffTransferSuggestion[] = []

    // 找出营收增长最好和最差的店铺
    const sortedByGrowth = [...summaries].sort((a, b) => b.revenueGrowth - a.revenueGrowth)
    const bestGrowthStore = sortedByGrowth[0]
    const worstGrowthStore = sortedByGrowth[sortedByGrowth.length - 1]

    // 如果增长率差距明显（最好的在增长，最差的在下降）
    if (
      bestGrowthStore &&
      worstGrowthStore &&
      bestGrowthStore.revenueGrowth > 10 &&
      worstGrowthStore.revenueGrowth < -10
    ) {
      // 从增长好的店铺选择员工
      const bestStoreEmployees = employees.filter(
        (emp) => emp.store_id === bestGrowthStore.storeId && emp.status === 'active'
      )

      if (bestStoreEmployees.length > 1) {
        // 选择1名员工
        const selectedEmployees = bestStoreEmployees.slice(0, 1)

        suggestions.push({
          id: `transfer_performance_${Date.now()}`,
          priority: 'medium',
          fromStore: {id: bestGrowthStore.storeId, name: bestGrowthStore.storeName},
          toStore: {id: worstGrowthStore.storeId, name: worstGrowthStore.storeName},
          employees: selectedEmployees.map((emp) => ({
            id: emp.id,
            name: emp.name,
            position: emp.position || '员工',
            reason: '来自高增长店铺，可分享成功经验'
          })),
          reason: `${worstGrowthStore.storeName}营收下降（${worstGrowthStore.revenueGrowth.toFixed(1)}%），建议从${bestGrowthStore.storeName}调配员工分享经验`,
          expectedBenefit: `预计可帮助${worstGrowthStore.storeName}扭转营收下降趋势`
        })
      }
    }

    return suggestions
  }

  /**
   * 跨店数据同步状态检查
   */
  async checkSyncStatus(tenantId: string): Promise<{
    lastSyncTime: string
    syncedStores: number
    totalStores: number
    pendingUpdates: number
    status: 'synced' | 'syncing' | 'error'
  }> {
    try {
      const stores = await getStoresByTenantId(tenantId)

      // 这里简化处理，实际应该检查真实的同步状态
      return {
        lastSyncTime: new Date().toISOString(),
        syncedStores: stores.length,
        totalStores: stores.length,
        pendingUpdates: 0,
        status: 'synced'
      }
    } catch (error) {
      console.error('检查同步状态失败:', error)
      return {
        lastSyncTime: '',
        syncedStores: 0,
        totalStores: 0,
        pendingUpdates: 0,
        status: 'error'
      }
    }
  }
}

// 导出单例
export const chainManagementService = new ChainManagementService()
