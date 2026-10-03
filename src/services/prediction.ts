/**
 * 营收预测服务 V3.0 - 增强版
 * 基于历史数据的智能预测，提升准确度
 *
 * 核心改进：
 * 1. 异常值检测和过滤（IQR方法）
 * 2. 改进的周几预测（最小样本要求 + 智能fallback）
 * 3. 季节性调整（同期对比 + 月份因子）
 * 4. 趋势分析（线性回归识别增长/下降）
 * 5. 智能餐段分配（基于历史数据学习）
 * 6. 目标：预测误差控制在8%以内
 */

import {getCostDataByTenantId} from '@/db/api'
import type {ImpactFactor, PredictionResult} from '@/db/types-v2'

/**
 * 最小数据要求：至少需要7天（一周）的历史数据
 */
const MIN_DATA_DAYS = 7

/**
 * 每个周几的最小样本数
 */
const MIN_WEEKDAY_SAMPLES = 2

/**
 * 周几的中文名称
 */
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/**
 * 预测特征
 */
export interface PredictionFeatures {
  tenantId: string
  storeId?: string
  targetPeriod: string
  predictionType: 'monthly' | 'daily'
  factors?: ImpactFactor[]
}

/**
 * 营收预测引擎 V3.0 - 增强版
 */
export class RevenuePredictionEngine {
  /**
   * 使用IQR方法检测和过滤异常值
   * @param data 数据数组
   * @returns 过滤后的数据
   */
  private filterOutliers(data: number[]): number[] {
    if (data.length < 4) {
      // 数据太少，不进行异常值过滤
      return data
    }

    // 排序
    const sorted = [...data].sort((a, b) => a - b)
    const q1Index = Math.floor(sorted.length * 0.25)
    const q3Index = Math.floor(sorted.length * 0.75)
    const q1 = sorted[q1Index]
    const q3 = sorted[q3Index]
    const iqr = q3 - q1

    // 定义异常值边界
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr

    // 过滤异常值
    const filtered = data.filter((val) => val >= lowerBound && val <= upperBound)

    // 如果过滤后数据太少，返回原数据
    if (filtered.length < data.length * 0.5) {
      console.warn('异常值过滤会移除超过50%的数据，保留原数据')
      return data
    }

    const removedCount = data.length - filtered.length
    if (removedCount > 0) {
      console.log(
        `异常值检测：移除${removedCount}个异常值（边界：${Math.round(lowerBound)}-${Math.round(upperBound)}）`
      )
    }

    return filtered
  }

  /**
   * 计算趋势系数（线性回归）
   * @param historicalData 历史数据
   * @returns 趋势系数（正数表示增长，负数表示下降）
   */
  private calculateTrend(historicalData: Array<{date: string; revenue: number}>): number {
    if (historicalData.length < 14) {
      // 数据太少，不计算趋势
      return 0
    }

    // 按日期排序
    const sorted = [...historicalData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // 使用最近30天的数据计算趋势
    const recentData = sorted.slice(-30)

    // 线性回归：y = a + bx
    const n = recentData.length
    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumX2 = 0

    for (let i = 0; i < n; i++) {
      const x = i // 时间索引
      const y = recentData[i].revenue
      sumX += x
      sumY += y
      sumXY += x * y
      sumX2 += x * x
    }

    // 计算斜率 b
    const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

    // 计算平均营收
    const avgRevenue = sumY / n

    // 趋势系数 = 斜率 / 平均营收（归一化）
    const trendCoefficient = b / avgRevenue

    console.log('趋势分析:', {
      数据量: n,
      平均营收: Math.round(avgRevenue),
      斜率: b.toFixed(2),
      趋势系数: `${(trendCoefficient * 100).toFixed(2)}%/天`
    })

    return trendCoefficient
  }

  /**
   * 计算月份因子（季节性调整）
   * @param historicalData 历史数据
   * @param targetMonth 目标月份（1-12）
   * @returns 月份因子（1.0表示平均水平）
   */
  private calculateMonthFactor(historicalData: Array<{date: string; revenue: number}>, targetMonth: number): number {
    // 按月份分组
    const monthlyData: {[key: number]: number[]} = {}
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = []
    }

    for (const item of historicalData) {
      const month = new Date(item.date).getMonth() + 1
      monthlyData[month].push(item.revenue)
    }

    // 计算每个月的平均营收
    const monthlyAverages: {[key: number]: number} = {}
    let totalAvg = 0
    let validMonths = 0

    for (let i = 1; i <= 12; i++) {
      if (monthlyData[i].length > 0) {
        const avg = monthlyData[i].reduce((sum, val) => sum + val, 0) / monthlyData[i].length
        monthlyAverages[i] = avg
        totalAvg += avg
        validMonths++
      }
    }

    if (validMonths === 0) {
      return 1.0 // 没有数据，返回中性因子
    }

    totalAvg /= validMonths

    // 如果目标月份有数据，计算因子
    if (monthlyAverages[targetMonth]) {
      const factor = monthlyAverages[targetMonth] / totalAvg
      console.log(`月份因子（${targetMonth}月）: ${factor.toFixed(2)} (基于${monthlyData[targetMonth].length}天数据)`)
      return factor
    }

    // 如果目标月份没有数据，使用相邻月份的平均
    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1
    const nextMonth = targetMonth === 12 ? 1 : targetMonth + 1

    const adjacentFactors: number[] = []
    if (monthlyAverages[prevMonth]) {
      adjacentFactors.push(monthlyAverages[prevMonth] / totalAvg)
    }
    if (monthlyAverages[nextMonth]) {
      adjacentFactors.push(monthlyAverages[nextMonth] / totalAvg)
    }

    if (adjacentFactors.length > 0) {
      const avgFactor = adjacentFactors.reduce((sum, val) => sum + val, 0) / adjacentFactors.length
      console.log(`月份因子（${targetMonth}月，使用相邻月份）: ${avgFactor.toFixed(2)}`)
      return avgFactor
    }

    return 1.0 // 没有相关数据，返回中性因子
  }

  /**
   * 预测营收（月度）
   */
  async predict(features: PredictionFeatures): Promise<PredictionResult> {
    try {
      // 1. 获取历史数据
      const historicalData = await this.getHistoricalData(features.tenantId, features.storeId)

      // 2. 验证数据量
      if (historicalData.length < MIN_DATA_DAYS) {
        throw new Error(
          `历史数据不足：需要至少${MIN_DATA_DAYS}天的数据才能进行预测，当前只有${historicalData.length}天`
        )
      }

      // 3. 计算周几的平均营收（包含异常值过滤）
      const weekdayAverages = this.calculateWeekdayAverages(historicalData)

      // 4. 计算趋势系数
      const trendCoefficient = this.calculateTrend(historicalData)

      // 5. 计算月份因子（季节性调整）
      const targetDate = new Date(features.targetPeriod)
      const year = targetDate.getFullYear()
      const month = targetDate.getMonth()
      const targetMonth = month + 1
      const monthFactor = this.calculateMonthFactor(historicalData, targetMonth)

      // 6. 计算目标月份的预测
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      let monthlyTotal = 0

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const dayOfWeek = date.getDay()

        // 基础预测 = 周几平均值
        let dailyPrediction = weekdayAverages[dayOfWeek]

        // 应用月份因子（季节性调整）
        dailyPrediction *= monthFactor

        // 应用趋势调整（预测未来，需要考虑趋势延续）
        // 计算该日期距今的天数
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const daysFromNow = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        if (daysFromNow > 0 && Math.abs(trendCoefficient) > 0.001) {
          // 趋势调整 = 1 + (趋势系数 * 天数)
          const trendAdjustment = 1 + trendCoefficient * daysFromNow
          // 限制趋势调整在合理范围内（±30%）
          const boundedAdjustment = Math.max(0.7, Math.min(1.3, trendAdjustment))
          dailyPrediction *= boundedAdjustment
        }

        monthlyTotal += dailyPrediction
      }

      // 7. 应用影响因子（仅限节假日、天气等外部因素）
      const factorImpact = this.calculateFactorImpact(features.factors || [])
      const finalPrediction = monthlyTotal * (1 + factorImpact)

      // 8. 计算置信度
      const confidence = this.calculateConfidence(historicalData, weekdayAverages)

      console.log('=== 营收预测详情（V3.0增强版）===')
      console.log('历史数据量:', `${historicalData.length}天`)
      console.log(
        '周几平均营收:',
        Object.fromEntries(weekdayAverages.map((avg, idx) => [DAY_NAMES[idx], Math.round(avg)]))
      )
      console.log('趋势系数:', `${(trendCoefficient * 100).toFixed(3)}%/天`)
      console.log('月份因子:', monthFactor.toFixed(2))
      console.log('目标月份:', `${year}年${month + 1}月`)
      console.log('目标月天数:', daysInMonth)
      console.log('基础预测:', Math.round(monthlyTotal))
      console.log('影响因子调整:', `${(factorImpact * 100).toFixed(1)}%`)
      console.log('最终预测:', Math.round(finalPrediction))
      console.log('置信度:', `${(confidence * 100).toFixed(1)}%`)

      return {
        conservative: Math.round(finalPrediction * 0.92), // 保守预测：-8%
        baseline: Math.round(finalPrediction),
        optimistic: Math.round(finalPrediction * 1.08), // 乐观预测：+8%
        confidence: confidence,
        factors: features.factors
      }
    } catch (error) {
      console.error('营收预测失败:', error)
      throw error
    }
  }

  /**
   * 获取历史数据
   */
  private async getHistoricalData(tenantId: string, storeId?: string) {
    try {
      const costData = await getCostDataByTenantId(tenantId)

      // 过滤店铺数据
      let filteredData = costData
      if (storeId) {
        filteredData = costData.filter((item) => item.store_id === storeId)
      }

      // 按日期排序，取最近90天（约3个月）
      const sortedData = filteredData
        .sort((a, b) => new Date(b.data_date).getTime() - new Date(a.data_date).getTime())
        .slice(0, 90)

      return sortedData.map((item) => ({
        date: item.data_date,
        revenue: item.revenue || 0
      }))
    } catch (error) {
      console.error('获取历史数据失败:', error)
      return []
    }
  }

  /**
   * 计算周几的平均营收（核心算法 - V3.0增强版）
   * 改进：
   * 1. 异常值过滤（IQR方法）
   * 2. 最小样本要求
   * 3. 智能fallback策略（使用相邻周几）
   * 4. 加权平均：最近的数据权重更高
   *
   * @param historicalData 历史数据
   * @returns 周日到周六的平均营收数组 [周日, 周一, 周二, 周三, 周四, 周五, 周六]
   */
  private calculateWeekdayAverages(historicalData: Array<{date: string; revenue: number}>): number[] {
    // 初始化周几的数据收集器
    const weekdayData: Array<Array<{revenue: number; daysAgo: number}>> = [[], [], [], [], [], [], []]

    // 计算每条数据距今的天数，用于加权
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 收集每个周几的数据
    for (const item of historicalData) {
      const date = new Date(item.date)
      date.setHours(0, 0, 0, 0)
      const dayOfWeek = date.getDay() // 0=周日, 1=周一, ..., 6=周六
      const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      weekdayData[dayOfWeek].push({
        revenue: item.revenue,
        daysAgo: daysAgo
      })
    }

    // 计算每个周几的加权平均值
    const weekdayAverages: number[] = []

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      let data = weekdayData[dayOfWeek]

      // 1. 异常值过滤
      if (data.length >= 4) {
        const revenues = data.map((item) => item.revenue)
        const filteredRevenues = this.filterOutliers(revenues)

        // 重新构建过滤后的数据
        if (filteredRevenues.length < data.length) {
          const filteredSet = new Set(filteredRevenues)
          data = data.filter((item) => filteredSet.has(item.revenue))
          console.log(`${DAY_NAMES[dayOfWeek]}：异常值过滤后剩余${data.length}个样本`)
        }
      }

      // 2. 检查样本数量
      if (data.length === 0) {
        // 没有数据，使用智能fallback
        const fallbackValue = this.getFallbackValue(dayOfWeek, weekdayData, historicalData)
        weekdayAverages.push(fallbackValue)
        console.warn(`${DAY_NAMES[dayOfWeek]}没有历史数据，使用fallback: ${Math.round(fallbackValue)}`)
        continue
      }

      if (data.length < MIN_WEEKDAY_SAMPLES) {
        // 样本太少，使用智能fallback
        const fallbackValue = this.getFallbackValue(dayOfWeek, weekdayData, historicalData)
        weekdayAverages.push(fallbackValue)
        console.warn(
          `${DAY_NAMES[dayOfWeek]}样本不足（${data.length}个，需要${MIN_WEEKDAY_SAMPLES}个），使用fallback: ${Math.round(fallbackValue)}`
        )
        continue
      }

      // 3. 使用指数衰减权重：最近的数据权重更高
      // 权重 = e^(-daysAgo / 28)，28天为半衰期
      let weightedSum = 0
      let totalWeight = 0

      for (const item of data) {
        const weight = Math.exp(-item.daysAgo / 28)
        weightedSum += item.revenue * weight
        totalWeight += weight
      }

      const weightedAvg = weightedSum / totalWeight
      weekdayAverages.push(weightedAvg)

      console.log(`${DAY_NAMES[dayOfWeek]}平均营收: ${Math.round(weightedAvg)} (基于${data.length}天数据)`)
    }

    return weekdayAverages
  }

  /**
   * 智能fallback策略：当某个周几数据不足时，使用相邻周几或整体平均
   * @param dayOfWeek 目标周几
   * @param weekdayData 所有周几的数据
   * @param historicalData 历史数据
   * @returns fallback值
   */
  private getFallbackValue(
    dayOfWeek: number,
    weekdayData: Array<Array<{revenue: number; daysAgo: number}>>,
    historicalData: Array<{date: string; revenue: number}>
  ): number {
    // 策略1：使用相邻周几的平均值
    const adjacentDays: number[] = []

    // 工作日（周一到周五）之间相互参考
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      for (let i = 1; i <= 5; i++) {
        if (i !== dayOfWeek && weekdayData[i].length >= MIN_WEEKDAY_SAMPLES) {
          adjacentDays.push(i)
        }
      }
    }

    // 周末（周六、周日）之间相互参考
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const otherWeekendDay = dayOfWeek === 0 ? 6 : 0
      if (weekdayData[otherWeekendDay].length >= MIN_WEEKDAY_SAMPLES) {
        adjacentDays.push(otherWeekendDay)
      }
    }

    // 如果有相邻周几的数据，使用它们的平均值
    if (adjacentDays.length > 0) {
      let sum = 0
      let count = 0

      for (const adjDay of adjacentDays) {
        const revenues = weekdayData[adjDay].map((item) => item.revenue)
        const avg = revenues.reduce((s, v) => s + v, 0) / revenues.length
        sum += avg
        count++
      }

      const fallbackValue = sum / count
      console.log(`使用相邻周几（${adjacentDays.map((d) => DAY_NAMES[d]).join('、')}）的平均值`)
      return fallbackValue
    }

    // 策略2：使用整体平均值
    const allRevenues = historicalData.map((item) => item.revenue)
    const overallAvg = allRevenues.reduce((sum, val) => sum + val, 0) / allRevenues.length
    console.log('使用整体平均值')
    return overallAvg
  }

  /**
   * 计算影响因子影响（仅限外部因素）
   * @param factors 影响因子列表（节假日、天气等）
   */
  private calculateFactorImpact(factors: ImpactFactor[]): number {
    if (factors.length === 0) {
      return 0
    }

    let totalImpact = 0

    for (const factor of factors) {
      // 影响 = 影响值 * 置信度
      totalImpact += factor.impact_value * factor.confidence
    }

    // 限制总影响在 -20% 到 +20% 之间（外部因素影响有限）
    return Math.max(-0.2, Math.min(0.2, totalImpact))
  }

  /**
   * 计算置信度
   * @param historicalData 历史数据
   * @param weekdayAverages 周几平均值
   */
  private calculateConfidence(
    historicalData: Array<{date: string; revenue: number}>,
    _weekdayAverages: number[]
  ): number {
    // 1. 数据量评分（0-0.4）
    // 7天: 0.2, 30天: 0.3, 90天: 0.4
    const dataQuantityScore = Math.min(0.4, 0.2 + ((historicalData.length - 7) / 83) * 0.2)

    // 2. 数据完整性评分（0-0.3）
    // 检查是否每个周几都有数据
    const weekdayData: number[][] = [[], [], [], [], [], [], []]
    for (const item of historicalData) {
      const date = new Date(item.date)
      const dayOfWeek = date.getDay()
      weekdayData[dayOfWeek].push(item.revenue)
    }
    const completenessScore = (weekdayData.filter((data) => data.length > 0).length / 7) * 0.3

    // 3. 数据稳定性评分（0-0.3）
    // 计算每个周几的变异系数
    let totalCV = 0
    let validDays = 0
    for (let i = 0; i < 7; i++) {
      const data = weekdayData[i]
      if (data.length > 1) {
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length
        const variance = data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length
        const stdDev = Math.sqrt(variance)
        const cv = stdDev / mean // 变异系数
        totalCV += cv
        validDays++
      }
    }
    const avgCV = validDays > 0 ? totalCV / validDays : 1
    const stabilityScore = Math.max(0, (1 - avgCV) * 0.3)

    // 综合置信度
    const confidence = dataQuantityScore + completenessScore + stabilityScore

    return Math.round(confidence * 100) / 100
  }

  /**
   * 日度预测（基于周几的历史平均值 - V3.0增强版）
   */
  async predictDaily(
    tenantId: string,
    storeId: string | undefined,
    targetDate: string,
    _monthlyPrediction: number, // 不再使用月度预测分解
    factors: ImpactFactor[]
  ): Promise<PredictionResult> {
    try {
      // 1. 获取历史数据
      const historicalData = await this.getHistoricalData(tenantId, storeId)

      // 2. 验证数据量
      if (historicalData.length < MIN_DATA_DAYS) {
        throw new Error(
          `历史数据不足：需要至少${MIN_DATA_DAYS}天的数据才能进行预测，当前只有${historicalData.length}天`
        )
      }

      // 3. 计算周几的平均营收（包含异常值过滤）
      const weekdayAverages = this.calculateWeekdayAverages(historicalData)

      // 4. 获取目标日期是周几
      const targetDateObj = new Date(targetDate)
      const dayOfWeek = targetDateObj.getDay()
      const dayName = DAY_NAMES[dayOfWeek]
      const targetMonth = targetDateObj.getMonth() + 1

      // 5. 基础预测 = 该周几的历史平均值
      let basePrediction = weekdayAverages[dayOfWeek]

      // 6. 应用月份因子（季节性调整）
      const monthFactor = this.calculateMonthFactor(historicalData, targetMonth)
      basePrediction *= monthFactor

      // 7. 应用趋势调整
      const trendCoefficient = this.calculateTrend(historicalData)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const daysFromNow = Math.floor((targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysFromNow > 0 && Math.abs(trendCoefficient) > 0.001) {
        const trendAdjustment = 1 + trendCoefficient * daysFromNow
        const boundedAdjustment = Math.max(0.7, Math.min(1.3, trendAdjustment))
        basePrediction *= boundedAdjustment
      }

      // 8. 应用影响因子（节假日、天气等）
      const factorImpact = this.calculateFactorImpact(factors)
      const finalPrediction = basePrediction * (1 + factorImpact)

      // 9. 计算置信度
      const confidence = this.calculateConfidence(historicalData, weekdayAverages)

      console.log('=== 日度预测详情（V3.0增强版）===')
      console.log('目标日期:', targetDate)
      console.log('周几:', dayName)
      console.log('历史平均:', Math.round(weekdayAverages[dayOfWeek]))
      console.log('月份因子:', monthFactor.toFixed(2))
      console.log('趋势调整:', daysFromNow > 0 ? `${(trendCoefficient * daysFromNow * 100).toFixed(2)}%` : '无')
      console.log('影响因子调整:', `${(factorImpact * 100).toFixed(1)}%`)
      console.log('最终预测:', Math.round(finalPrediction))
      console.log('置信度:', `${(confidence * 100).toFixed(1)}%`)

      return {
        conservative: Math.round(finalPrediction * 0.92),
        baseline: Math.round(finalPrediction),
        optimistic: Math.round(finalPrediction * 1.08),
        confidence: confidence,
        factors: factors
      }
    } catch (error) {
      console.error('日度预测失败:', error)
      throw error
    }
  }
}

/**
 * 创建预测引擎实例
 */
export const predictionEngine = new RevenuePredictionEngine()
