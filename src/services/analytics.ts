/**
 * 智能数据分析系统
 * 提供多维度数据分析、趋势预测和异常检测功能
 */

import {getCostDataByTenantId, getEmployeesByTenantId, getScheduleLogsByTenantId} from '@/db/api'
import type {CostData, Employee, ScheduleLog} from '@/db/types'

/**
 * 数据分析结果
 */
export interface AnalyticsResult {
  // 营收分析
  revenueAnalysis: {
    total: number // 总营收
    average: number // 平均营收
    growth: number // 增长率（%）
    trend: 'up' | 'down' | 'stable' // 趋势
  }
  // 成本分析
  costAnalysis: {
    total: number // 总成本
    average: number // 平均成本
    ratio: number // 成本占比（%）
    trend: 'up' | 'down' | 'stable' // 趋势
  }
  // 效率分析
  efficiencyAnalysis: {
    average: number // 平均效率
    trend: 'up' | 'down' | 'stable' // 趋势
    topPerformers: Array<{id: string; name: string; efficiency: number}> // 高效员工
  }
  // 排班分析
  scheduleAnalysis: {
    totalShifts: number // 总排班数
    completionRate: number // 完成率（%）
    excellentRate: number // 优秀率（%）
    averageScore: number // 平均评分
  }
}

/**
 * 趋势预测结果
 */
export interface TrendPrediction {
  metric: string // 指标名称
  current: number // 当前值
  predicted: number // 预测值
  confidence: number // 置信度（0-1）
  trend: 'up' | 'down' | 'stable' // 趋势
  changeRate: number // 变化率（%）
}

/**
 * 异常检测结果
 */
export interface AnomalyDetection {
  id: string
  type: 'revenue' | 'cost' | 'efficiency' | 'schedule' // 异常类型
  severity: 'low' | 'medium' | 'high' // 严重程度
  date: string // 异常日期
  value: number // 异常值
  expected: number // 期望值
  deviation: number // 偏差率（%）
  description: string // 异常描述
}

/**
 * 智能数据分析服务
 */
export class AnalyticsService {
  /**
   * 执行多维度数据分析
   */
  async analyzeData(tenantId: string, storeId?: string, days: number = 30): Promise<AnalyticsResult> {
    try {
      // 计算日期范围
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const startDateStr = startDate.toISOString().substring(0, 10)

      // 获取数据
      const [costData, scheduleLogs, employees] = await Promise.all([
        getCostDataByTenantId(tenantId),
        getScheduleLogsByTenantId(tenantId, {startDate: startDateStr}),
        getEmployeesByTenantId(tenantId)
      ])

      // 过滤店铺数据
      let filteredCostData = costData.filter((item) => {
        const itemDate = new Date(item.data_date)
        return itemDate >= startDate && itemDate <= endDate
      })

      if (storeId) {
        filteredCostData = filteredCostData.filter((item) => item.store_id === storeId)
      }

      // 营收分析
      const revenueAnalysis = this.analyzeRevenue(filteredCostData)

      // 成本分析
      const costAnalysis = this.analyzeCost(filteredCostData)

      // 效率分析
      const efficiencyAnalysis = this.analyzeEfficiency(filteredCostData, scheduleLogs, employees)

      // 排班分析
      const scheduleAnalysis = this.analyzeSchedule(scheduleLogs)

      return {
        revenueAnalysis,
        costAnalysis,
        efficiencyAnalysis,
        scheduleAnalysis
      }
    } catch (error) {
      console.error('数据分析失败:', error)
      throw error
    }
  }

  /**
   * 营收分析
   */
  private analyzeRevenue(costData: CostData[]) {
    if (costData.length === 0) {
      return {
        total: 0,
        average: 0,
        growth: 0,
        trend: 'stable' as const
      }
    }

    const revenues = costData.map((item) => item.revenue || 0)
    const total = revenues.reduce((sum, val) => sum + val, 0)
    const average = total / revenues.length

    // 计算增长率（对比前后两半数据）
    const midPoint = Math.floor(revenues.length / 2)
    const firstHalf = revenues.slice(0, midPoint)
    const secondHalf = revenues.slice(midPoint)

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

    const growth = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

    // 判断趋势
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (growth > 5) trend = 'up'
    else if (growth < -5) trend = 'down'

    return {
      total,
      average,
      growth,
      trend
    }
  }

  /**
   * 成本分析
   */
  private analyzeCost(costData: CostData[]) {
    if (costData.length === 0) {
      return {
        total: 0,
        average: 0,
        ratio: 0,
        trend: 'stable' as const
      }
    }

    const costs = costData.map((item) => item.labor_cost || 0)
    const revenues = costData.map((item) => item.revenue || 0)

    const totalCost = costs.reduce((sum, val) => sum + val, 0)
    const totalRevenue = revenues.reduce((sum, val) => sum + val, 0)
    const average = totalCost / costs.length
    const ratio = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0

    // 计算成本趋势
    const midPoint = Math.floor(costs.length / 2)
    const firstHalf = costs.slice(0, midPoint)
    const secondHalf = costs.slice(midPoint)

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length

    const growth = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (growth > 5) trend = 'up'
    else if (growth < -5) trend = 'down'

    return {
      total: totalCost,
      average,
      ratio,
      trend
    }
  }

  /**
   * 效率分析
   */
  private analyzeEfficiency(costData: CostData[], scheduleLogs: ScheduleLog[], employees: Employee[]) {
    if (costData.length === 0) {
      return {
        average: 0,
        trend: 'stable' as const,
        topPerformers: []
      }
    }

    const efficiencies = costData.map((item) => item.avg_efficiency || 0).filter((val) => val > 0)
    const average = efficiencies.length > 0 ? efficiencies.reduce((sum, val) => sum + val, 0) / efficiencies.length : 0

    // 计算效率趋势
    const midPoint = Math.floor(efficiencies.length / 2)
    const firstHalf = efficiencies.slice(0, midPoint)
    const secondHalf = efficiencies.slice(midPoint)

    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length : 0
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length : 0

    const growth = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (growth > 5) trend = 'up'
    else if (growth < -5) trend = 'down'

    // 计算高效员工（基于排班日志的评分）
    const employeeScores = new Map<string, {total: number; count: number}>()

    scheduleLogs.forEach((log) => {
      if (log.score && log.score > 0) {
        const current = employeeScores.get(log.employee_id) || {total: 0, count: 0}
        employeeScores.set(log.employee_id, {
          total: current.total + log.score,
          count: current.count + 1
        })
      }
    })

    const topPerformers = Array.from(employeeScores.entries())
      .map(([employeeId, {total, count}]) => {
        const employee = employees.find((e) => e.id === employeeId)
        return {
          id: employeeId,
          name: employee?.name || '未知',
          efficiency: total / count
        }
      })
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5)

    return {
      average,
      trend,
      topPerformers
    }
  }

  /**
   * 排班分析
   */
  private analyzeSchedule(scheduleLogs: ScheduleLog[]) {
    if (scheduleLogs.length === 0) {
      return {
        totalShifts: 0,
        completionRate: 0,
        excellentRate: 0,
        averageScore: 0
      }
    }

    const totalShifts = scheduleLogs.length
    const completedShifts = scheduleLogs.filter((log) => log.completion_status === 'completed').length
    const excellentShifts = scheduleLogs.filter((log) => (log.score || 0) >= 90).length

    const completionRate = totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0
    const excellentRate = totalShifts > 0 ? (excellentShifts / totalShifts) * 100 : 0

    const scores = scheduleLogs.map((log) => log.score || 0).filter((score) => score > 0)
    const averageScore = scores.length > 0 ? scores.reduce((sum, val) => sum + val, 0) / scores.length : 0

    return {
      totalShifts,
      completionRate,
      excellentRate,
      averageScore
    }
  }

  /**
   * 趋势预测
   */
  async predictTrends(tenantId: string, storeId?: string, days: number = 30): Promise<TrendPrediction[]> {
    try {
      // 获取历史数据
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days * 2) // 获取两倍时间的数据用于预测
      const _startDateStr = startDate.toISOString().substring(0, 10)

      const costData = await getCostDataByTenantId(tenantId)

      // 过滤数据
      let filteredData = costData.filter((item) => {
        const itemDate = new Date(item.data_date)
        return itemDate >= startDate && itemDate <= endDate
      })

      if (storeId) {
        filteredData = filteredData.filter((item) => item.store_id === storeId)
      }

      if (filteredData.length < 7) {
        return []
      }

      // 按日期排序
      filteredData.sort((a, b) => new Date(a.data_date).getTime() - new Date(b.data_date).getTime())

      const predictions: TrendPrediction[] = []

      // 营收趋势预测
      predictions.push(
        this.predictMetric(
          '营收',
          filteredData.map((d) => d.revenue || 0)
        )
      )

      // 成本趋势预测
      predictions.push(
        this.predictMetric(
          '人力成本',
          filteredData.map((d) => d.labor_cost || 0)
        )
      )

      // 效率趋势预测
      const efficiencies = filteredData.map((d) => d.avg_efficiency || 0).filter((v) => v > 0)
      if (efficiencies.length > 0) {
        predictions.push(this.predictMetric('平均效率', efficiencies))
      }

      return predictions
    } catch (error) {
      console.error('趋势预测失败:', error)
      return []
    }
  }

  /**
   * 预测单个指标
   */
  private predictMetric(metricName: string, values: number[]): TrendPrediction {
    if (values.length < 2) {
      return {
        metric: metricName,
        current: values[0] || 0,
        predicted: values[0] || 0,
        confidence: 0,
        trend: 'stable',
        changeRate: 0
      }
    }

    // 使用简单线性回归预测
    const n = values.length
    const current = values[n - 1]

    // 计算平均值
    const avg = values.reduce((sum, val) => sum + val, 0) / n

    // 计算趋势（最近7天的平均斜率）
    const recentDays = Math.min(7, n)
    const recentValues = values.slice(-recentDays)
    let totalSlope = 0

    for (let i = 1; i < recentValues.length; i++) {
      totalSlope += recentValues[i] - recentValues[i - 1]
    }

    const avgSlope = totalSlope / (recentValues.length - 1)
    const predicted = current + avgSlope

    // 计算置信度（基于数据稳定性）
    const variance = values.reduce((sum, val) => sum + (val - avg) ** 2, 0) / n
    const stdDev = Math.sqrt(variance)
    const cv = avg > 0 ? stdDev / avg : 1 // 变异系数
    const confidence = Math.max(0, Math.min(1, 1 - cv))

    // 判断趋势
    const changeRate = current > 0 ? ((predicted - current) / current) * 100 : 0
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (changeRate > 5) trend = 'up'
    else if (changeRate < -5) trend = 'down'

    return {
      metric: metricName,
      current,
      predicted,
      confidence,
      trend,
      changeRate
    }
  }

  /**
   * 异常检测
   */
  async detectAnomalies(tenantId: string, storeId?: string, days: number = 30): Promise<AnomalyDetection[]> {
    try {
      // 获取历史数据
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const _startDateStr = startDate.toISOString().substring(0, 10)

      const costData = await getCostDataByTenantId(tenantId)

      // 过滤数据
      let filteredData = costData.filter((item) => {
        const itemDate = new Date(item.data_date)
        return itemDate >= startDate && itemDate <= endDate
      })

      if (storeId) {
        filteredData = filteredData.filter((item) => item.store_id === storeId)
      }

      if (filteredData.length < 7) {
        return []
      }

      const anomalies: AnomalyDetection[] = []

      // 检测营收异常
      anomalies.push(...this.detectMetricAnomalies('revenue', '营收', filteredData, tenantId, storeId))

      // 检测成本异常
      anomalies.push(...this.detectMetricAnomalies('cost', '人力成本', filteredData, tenantId, storeId))

      // 检测效率异常
      anomalies.push(...this.detectMetricAnomalies('efficiency', '效率', filteredData, tenantId, storeId))

      return anomalies.sort((a, b) => {
        const severityOrder = {high: 3, medium: 2, low: 1}
        return severityOrder[b.severity] - severityOrder[a.severity]
      })
    } catch (error) {
      console.error('异常检测失败:', error)
      return []
    }
  }

  /**
   * 检测指标异常
   */
  private detectMetricAnomalies(
    type: 'revenue' | 'cost' | 'efficiency',
    metricName: string,
    costData: CostData[],
    _tenantId: string,
    _storeId?: string
  ): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = []

    // 提取指标值
    let values: Array<{date: string; value: number}>
    if (type === 'revenue') {
      values = costData.map((d) => ({date: d.data_date, value: d.revenue || 0}))
    } else if (type === 'cost') {
      values = costData.map((d) => ({date: d.data_date, value: d.labor_cost || 0}))
    } else {
      values = costData.map((d) => ({date: d.data_date, value: d.avg_efficiency || 0})).filter((v) => v.value > 0)
    }

    if (values.length < 7) {
      return anomalies
    }

    // 计算统计指标
    const nums = values.map((v) => v.value)
    const mean = nums.reduce((sum, val) => sum + val, 0) / nums.length
    const variance = nums.reduce((sum, val) => sum + (val - mean) ** 2, 0) / nums.length
    const stdDev = Math.sqrt(variance)

    // 使用3-sigma规则检测异常
    const threshold = 2 // 2倍标准差

    values.forEach((item) => {
      const deviation = Math.abs(item.value - mean)
      const deviationRate = mean > 0 ? (deviation / mean) * 100 : 0

      if (deviation > threshold * stdDev && deviationRate > 20) {
        // 判断严重程度
        let severity: 'low' | 'medium' | 'high' = 'low'
        if (deviationRate > 50) severity = 'high'
        else if (deviationRate > 30) severity = 'medium'

        // 生成描述
        const direction = item.value > mean ? '偏高' : '偏低'
        const description = `${metricName}${direction}，偏差${deviationRate.toFixed(1)}%`

        anomalies.push({
          id: `anomaly_${Date.now()}_${type}_${item.date}`,
          type,
          severity,
          date: item.date,
          value: item.value,
          expected: mean,
          deviation: deviationRate,
          description
        })
      }
    })

    return anomalies
  }
}

// 导出单例
export const analyticsService = new AnalyticsService()
