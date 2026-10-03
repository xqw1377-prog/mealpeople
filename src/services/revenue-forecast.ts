/**
 * 营收预估服务
 * 整合预测算法和数据库操作，提供完整的营收预估功能
 */

import {
  createDailyRevenueDetails,
  createRevenueCalendar,
  deleteRevenueCalendar,
  getDailyRevenueDetails,
  getRevenueCalendarById,
  getRevenueCalendarsByTenant,
  getRevenueImpactFactors
} from '@/db/api-revenue-calendar'
import type {CreateDailyRevenueDetailParams, CreateRevenueCalendarParams} from '@/db/types-v2'
import {predictionEngine} from './prediction'

/**
 * 生成月度营收日历参数
 */
export interface GenerateMonthlyCalendarParams {
  tenantId: string
  storeId: string
  targetMonth: string // YYYY-MM格式
  userId: string
  useHistoricalData?: boolean // 是否使用历史数据预测
}

/**
 * 生成月度营收日历结果
 */
export interface GenerateMonthlyCalendarResult {
  success: boolean
  calendarId?: string
  message?: string
  predictedTotal?: number
  dailyCount?: number
}

/**
 * 营收预估服务类
 */
export class RevenueForecastService {
  /**
   * 智能生成月度营收日历
   */
  async generateMonthlyCalendar(params: GenerateMonthlyCalendarParams): Promise<GenerateMonthlyCalendarResult> {
    try {
      const {tenantId, storeId, targetMonth, userId, useHistoricalData = true} = params

      // 1. 检查是否已存在该月份的营收日历
      const existingCalendars = await getRevenueCalendarsByTenant(tenantId, storeId)
      const existingCalendar = existingCalendars.find((c) => c.calendar_month === targetMonth)

      // 如果已存在，先删除旧的日历（会级联删除相关的每日明细和调整记录）
      if (existingCalendar) {
        console.log(`删除已存在的营收日历: ${existingCalendar.id}`)
        const deleted = await deleteRevenueCalendar(existingCalendar.id)
        if (!deleted) {
          console.warn('删除旧营收日历失败，但继续创建新日历')
        }
      }

      // 2. 解析目标月份
      const [year, month] = targetMonth.split('-').map(Number)
      const daysInMonth = new Date(year, month, 0).getDate()

      // 3. 生成每日营收预测
      const dailyDetails: CreateDailyRevenueDetailParams[] = []
      let totalPredictedRevenue = 0

      // 获取影响因子
      const impactFactors = await getRevenueImpactFactors(tenantId, storeId)
      const activeFactors = impactFactors.filter((f) => f.is_active)

      // 获取历史数据以判断数据量
      const {getCostDataByTenantId} = await import('@/db/api')
      const costData = await getCostDataByTenantId(tenantId)

      console.log('=== 营收预测开始 ===')
      console.log('租户ID:', tenantId)
      console.log('门店ID:', storeId)
      console.log('目标月份:', targetMonth)
      console.log('原始数据总量:', costData.length)

      const filteredData = storeId ? costData.filter((item) => item.store_id === storeId) : costData
      const historicalDataCount = filteredData.length

      console.log('过滤后数据量:', historicalDataCount)

      // 打印前3条数据用于调试
      if (filteredData.length > 0) {
        console.log('历史数据示例（前3条）:')
        filteredData.slice(0, 3).forEach((item, index) => {
          console.log(`  ${index + 1}. 日期: ${item.data_date}, 营收: ${item.revenue}, 门店ID: ${item.store_id}`)
        })
      }

      // 如果使用历史数据，先进行月度预测
      let monthlyPrediction = 0
      let useSimpleAverage = false // 是否使用简单平均值

      if (useHistoricalData) {
        // 数据量少于7天：直接使用历史平均值，不进行月度预测
        if (historicalDataCount > 0 && historicalDataCount < 7) {
          console.log('⚠️ 历史数据较少，直接使用历史平均值，不应用季节性和影响因子')
          const totalRevenue = filteredData.reduce((sum, item) => sum + (item.revenue || 0), 0)
          const dailyAvg = totalRevenue / historicalDataCount
          monthlyPrediction = dailyAvg * daysInMonth
          useSimpleAverage = true

          console.log('历史总营收:', totalRevenue)
          console.log('历史日均:', dailyAvg)
          console.log('月度预测（简单平均）:', monthlyPrediction)
        } else {
          // 数据量充足：使用完整的预测模型
          try {
            // 转换影响因子格式
            const predictionFactors = activeFactors.map((f) => ({
              id: f.id,
              tenant_id: f.tenant_id,
              factor_type: f.factor_type as 'weather' | 'holiday' | 'event' | 'marketing' | 'competition' | 'internal',
              factor_name: f.factor_name,
              impact_value: f.impact_rate / 100,
              confidence: 0.8,
              effective_date: targetMonth,
              data_source: 'manual' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))

            const prediction = await predictionEngine.predict({
              tenantId,
              storeId,
              targetPeriod: targetMonth,
              predictionType: 'monthly',
              factors: predictionFactors
            })
            monthlyPrediction = prediction.baseline
            console.log('月度预测（完整模型）:', monthlyPrediction)
          } catch (error) {
            console.warn('月度预测失败，使用默认值:', error)
            monthlyPrediction = 0
          }
        }
      }

      // 3. 生成每日明细
      for (let day = 1; day <= daysInMonth; day++) {
        const revenueDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const dateObj = new Date(year, month - 1, day)
        const dayOfWeek = dateObj.getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const isHoliday = this.checkIfHoliday(revenueDate)

        // 预测当日营收
        let dailyRevenue = 0
        if (useHistoricalData && monthlyPrediction > 0) {
          if (useSimpleAverage) {
            // 数据量少时：直接使用简单平均分配
            dailyRevenue = monthlyPrediction / daysInMonth
          } else {
            // 数据量充足时：使用完整的日度预测模型
            try {
              // 转换影响因子格式
              const predictionFactors = activeFactors.map((f) => ({
                id: f.id,
                tenant_id: f.tenant_id,
                factor_type: f.factor_type as
                  | 'weather'
                  | 'holiday'
                  | 'event'
                  | 'marketing'
                  | 'competition'
                  | 'internal',
                factor_name: f.factor_name,
                impact_value: f.impact_rate / 100,
                confidence: 0.8,
                effective_date: revenueDate,
                data_source: 'manual' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }))

              const dailyPrediction = await predictionEngine.predictDaily(
                tenantId,
                storeId,
                revenueDate,
                monthlyPrediction,
                predictionFactors
              )
              dailyRevenue = dailyPrediction.baseline
            } catch (error) {
              console.warn(`日期 ${revenueDate} 预测失败:`, error)
              // 使用简单的平均分配
              dailyRevenue = monthlyPrediction / daysInMonth
            }
          }
        } else {
          // 不使用历史数据，使用默认值
          dailyRevenue = isWeekend ? 5000 : 3000 // 周末和工作日的默认值
        }

        // 分配餐段营收（默认比例：早餐15%，午餐40%，晚餐40%，其他5%）
        const breakfastRevenue = Math.round(dailyRevenue * 0.15)
        const lunchRevenue = Math.round(dailyRevenue * 0.4)
        const dinnerRevenue = Math.round(dailyRevenue * 0.4)
        const otherRevenue = dailyRevenue - breakfastRevenue - lunchRevenue - dinnerRevenue

        dailyDetails.push({
          calendar_id: '', // 临时占位符，稍后会被替换
          revenue_date: revenueDate,
          day_of_week: dayOfWeek,
          is_weekend: isWeekend,
          is_holiday: isHoliday,
          predicted_revenue: dailyRevenue,
          adjusted_revenue: dailyRevenue,
          breakfast_revenue: breakfastRevenue,
          lunch_revenue: lunchRevenue,
          dinner_revenue: dinnerRevenue,
          other_revenue: otherRevenue,
          weather_factor: null,
          event_factor: null,
          notes: null
        })

        totalPredictedRevenue += dailyRevenue
      }

      // 4. 创建营收日历
      const calendarParams: CreateRevenueCalendarParams = {
        tenant_id: tenantId,
        store_id: storeId,
        calendar_month: targetMonth,
        total_revenue_target: totalPredictedRevenue,
        predicted_total_revenue: totalPredictedRevenue,
        generated_by: useHistoricalData ? 'auto' : 'manual',
        created_by: userId
      }

      console.log('创建营收日历参数:', calendarParams)
      const calendar = await createRevenueCalendar(calendarParams)
      if (!calendar) {
        console.error('创建营收日历失败，参数:', calendarParams)
        return {
          success: false,
          message: '创建营收日历失败，请检查租户和门店信息是否正确'
        }
      }

      console.log('营收日历创建成功:', calendar.id)

      // 5. 批量创建每日明细（添加 calendar_id）
      const detailsWithCalendarId = dailyDetails.map((detail) => ({
        ...detail,
        calendar_id: calendar.id
      }))

      console.log(`准备创建 ${detailsWithCalendarId.length} 条每日明细`)
      const createSuccess = await createDailyRevenueDetails(detailsWithCalendarId)
      if (!createSuccess) {
        console.error('创建每日营收明细失败')
        return {
          success: false,
          message: '创建每日营收明细失败'
        }
      }

      console.log('每日营收明细创建成功')

      return {
        success: true,
        calendarId: calendar.id,
        predictedTotal: totalPredictedRevenue,
        dailyCount: dailyDetails.length,
        message: '营收日历生成成功'
      }
    } catch (error) {
      console.error('生成月度营收日历失败:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  /**
   * 检查是否为节假日
   * TODO: 接入节假日API或配置
   */
  private checkIfHoliday(date: string): boolean {
    // 简单的节假日判断（可以后续扩展）
    const holidays = [
      '2025-01-01', // 元旦
      '2025-02-10', // 春节
      '2025-02-11',
      '2025-02-12',
      '2025-02-13',
      '2025-02-14',
      '2025-02-15',
      '2025-02-16',
      '2025-04-05', // 清明节
      '2025-05-01', // 劳动节
      '2025-05-02',
      '2025-05-03',
      '2025-06-10', // 端午节
      '2025-09-15', // 中秋节
      '2025-10-01', // 国庆节
      '2025-10-02',
      '2025-10-03',
      '2025-10-04',
      '2025-10-05',
      '2025-10-06',
      '2025-10-07'
    ]

    return holidays.includes(date)
  }

  /**
   * 获取营收日历详情（包含每日明细）
   */
  async getCalendarWithDetails(calendarId: string) {
    try {
      const calendar = await getRevenueCalendarById(calendarId)
      if (!calendar) {
        return null
      }

      const dailyDetails = await getDailyRevenueDetails(calendarId)

      return {
        calendar,
        dailyDetails,
        summary: {
          totalDays: dailyDetails.length,
          totalRevenue: dailyDetails.reduce((sum, d) => sum + (d.adjusted_revenue || d.predicted_revenue), 0),
          weekdayCount: dailyDetails.filter((d) => !d.is_weekend).length,
          weekendCount: dailyDetails.filter((d) => d.is_weekend).length,
          holidayCount: dailyDetails.filter((d) => d.is_holiday).length
        }
      }
    } catch (error) {
      console.error('获取营收日历详情失败:', error)
      return null
    }
  }

  /**
   * 计算餐段营收分布统计
   */
  calculateMealSegmentStats(dailyDetails: any[]) {
    const totalBreakfast = dailyDetails.reduce((sum, d) => sum + (d.breakfast_revenue || 0), 0)
    const totalLunch = dailyDetails.reduce((sum, d) => sum + (d.lunch_revenue || 0), 0)
    const totalDinner = dailyDetails.reduce((sum, d) => sum + (d.dinner_revenue || 0), 0)
    const totalOther = dailyDetails.reduce((sum, d) => sum + (d.other_revenue || 0), 0)
    const total = totalBreakfast + totalLunch + totalDinner + totalOther

    return {
      breakfast: {
        amount: totalBreakfast,
        percentage: total > 0 ? Math.round((totalBreakfast / total) * 100) : 0
      },
      lunch: {
        amount: totalLunch,
        percentage: total > 0 ? Math.round((totalLunch / total) * 100) : 0
      },
      dinner: {
        amount: totalDinner,
        percentage: total > 0 ? Math.round((totalDinner / total) * 100) : 0
      },
      other: {
        amount: totalOther,
        percentage: total > 0 ? Math.round((totalOther / total) * 100) : 0
      },
      total
    }
  }
}

/**
 * 导出服务实例
 */
export const revenueForecastService = new RevenueForecastService()
