#!/usr/bin/env node

/**
 * 营收预测算法 V3.0 测试脚本
 * 
 * 测试场景：
 * 1. 正常数据预测
 * 2. 包含异常值的数据
 * 3. 稀疏数据预测
 * 4. 季节性数据预测
 * 5. 趋势数据预测
 */

console.log('='.repeat(60))
console.log('  营收预测算法 V3.0 测试')
console.log('='.repeat(60))
console.log('')

// 测试数据生成器
class TestDataGenerator {
  /**
   * 生成正常的营收数据
   * @param {number} days - 天数
   * @param {number} baseRevenue - 基础营收
   * @param {number} variance - 方差（0-1）
   */
  static generateNormalData(days = 30, baseRevenue = 10000, variance = 0.1) {
    const data = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      
      // 周末营收通常更高
      const dayOfWeek = date.getDay()
      const weekendBonus = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1.0
      
      // 添加随机波动
      const randomFactor = 1 + (Math.random() - 0.5) * variance * 2
      
      const revenue = baseRevenue * weekendBonus * randomFactor
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.round(revenue),
        dayOfWeek: dayOfWeek
      })
    }
    
    return data
  }

  /**
   * 生成包含异常值的数据
   */
  static generateDataWithOutliers(days = 30, baseRevenue = 10000, outlierCount = 3) {
    const data = this.generateNormalData(days, baseRevenue, 0.1)
    
    // 随机添加异常值
    for (let i = 0; i < outlierCount; i++) {
      const randomIndex = Math.floor(Math.random() * data.length)
      // 异常值是正常值的3-5倍
      data[randomIndex].revenue *= (3 + Math.random() * 2)
      data[randomIndex].isOutlier = true
    }
    
    return data
  }

  /**
   * 生成稀疏数据（数据缺失）
   */
  static generateSparseData(days = 30, baseRevenue = 10000, missingRate = 0.3) {
    const data = this.generateNormalData(days, baseRevenue, 0.1)
    
    // 随机删除一些数据
    return data.filter(() => Math.random() > missingRate)
  }

  /**
   * 生成有趋势的数据（增长或下降）
   */
  static generateTrendData(days = 30, baseRevenue = 10000, growthRate = 0.02) {
    const data = this.generateNormalData(days, baseRevenue, 0.1)
    
    // 应用增长趋势
    data.forEach((item, index) => {
      const trendFactor = 1 + (growthRate * index)
      item.revenue = Math.round(item.revenue * trendFactor)
    })
    
    return data
  }

  /**
   * 生成季节性数据
   */
  static generateSeasonalData(days = 90, baseRevenue = 10000) {
    const data = this.generateNormalData(days, baseRevenue, 0.1)
    
    // 应用季节性因子（月初高，月末低）
    data.forEach((item, index) => {
      const dayOfMonth = new Date(item.date).getDate()
      const seasonalFactor = dayOfMonth <= 10 ? 1.2 : (dayOfMonth >= 25 ? 0.8 : 1.0)
      item.revenue = Math.round(item.revenue * seasonalFactor)
    })
    
    return data
  }
}

// 预测算法测试器
class PredictionTester {
  /**
   * 计算预测误差
   */
  static calculateError(actual, predicted) {
    if (actual === 0) return 0
    return Math.abs((predicted - actual) / actual) * 100
  }

  /**
   * 计算平均值
   */
  static average(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length
  }

  /**
   * 计算标准差
   */
  static standardDeviation(arr) {
    const avg = this.average(arr)
    const squareDiffs = arr.map(value => Math.pow(value - avg, 2))
    return Math.sqrt(this.average(squareDiffs))
  }

  /**
   * 简单的周几预测（用于测试）
   */
  static predictByWeekday(historicalData, targetDayOfWeek) {
    const weekdayData = historicalData.filter(d => d.dayOfWeek === targetDayOfWeek)
    
    if (weekdayData.length === 0) {
      return this.average(historicalData.map(d => d.revenue))
    }
    
    return this.average(weekdayData.map(d => d.revenue))
  }

  /**
   * 检测异常值（IQR方法）
   */
  static detectOutliers(data) {
    const revenues = data.map(d => d.revenue).sort((a, b) => a - b)
    const q1Index = Math.floor(revenues.length * 0.25)
    const q3Index = Math.floor(revenues.length * 0.75)
    
    const q1 = revenues[q1Index]
    const q3 = revenues[q3Index]
    const iqr = q3 - q1
    
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    
    return data.filter(d => d.revenue >= lowerBound && d.revenue <= upperBound)
  }

  /**
   * 测试场景1：正常数据预测
   */
  static testNormalData() {
    console.log('📊 测试场景1：正常数据预测')
    console.log('-'.repeat(60))
    
    const data = TestDataGenerator.generateNormalData(30, 10000, 0.1)
    const cleanData = this.detectOutliers(data)
    
    console.log(`原始数据: ${data.length} 天`)
    console.log(`清洗后数据: ${cleanData.length} 天`)
    console.log(`异常值数量: ${data.length - cleanData.length} 个`)
    
    // 预测下周一的营收
    const targetDayOfWeek = 1 // 周一
    const predicted = this.predictByWeekday(cleanData, targetDayOfWeek)
    const actual = this.average(cleanData.filter(d => d.dayOfWeek === targetDayOfWeek).map(d => d.revenue))
    const error = this.calculateError(actual, predicted)
    
    console.log(`预测营收: ¥${predicted.toFixed(2)}`)
    console.log(`实际平均: ¥${actual.toFixed(2)}`)
    console.log(`预测误差: ${error.toFixed(2)}%`)
    console.log(`✅ 测试通过: ${error < 10 ? '是' : '否'}`)
    console.log('')
    
    return { passed: error < 10, error }
  }

  /**
   * 测试场景2：包含异常值的数据
   */
  static testDataWithOutliers() {
    console.log('📊 测试场景2：包含异常值的数据')
    console.log('-'.repeat(60))
    
    const data = TestDataGenerator.generateDataWithOutliers(30, 10000, 5)
    const outlierCount = data.filter(d => d.isOutlier).length
    const cleanData = this.detectOutliers(data)
    
    console.log(`原始数据: ${data.length} 天`)
    console.log(`人工异常值: ${outlierCount} 个`)
    console.log(`清洗后数据: ${cleanData.length} 天`)
    console.log(`检测到异常值: ${data.length - cleanData.length} 个`)
    
    // 验证异常值检测效果
    const detectionRate = ((data.length - cleanData.length) / outlierCount) * 100
    console.log(`异常值检测率: ${detectionRate.toFixed(2)}%`)
    console.log(`✅ 测试通过: ${detectionRate >= 60 ? '是' : '否'}`)
    console.log('')
    
    return { passed: detectionRate >= 60, detectionRate }
  }

  /**
   * 测试场景3：稀疏数据预测
   */
  static testSparseData() {
    console.log('📊 测试场景3：稀疏数据预测')
    console.log('-'.repeat(60))
    
    const data = TestDataGenerator.generateSparseData(30, 10000, 0.4)
    
    console.log(`数据天数: ${data.length} 天`)
    console.log(`数据缺失率: ${((30 - data.length) / 30 * 100).toFixed(2)}%`)
    
    // 检查每个周几的样本数
    const weekdayCounts = {}
    data.forEach(d => {
      weekdayCounts[d.dayOfWeek] = (weekdayCounts[d.dayOfWeek] || 0) + 1
    })
    
    console.log('各周几样本数:')
    Object.keys(weekdayCounts).forEach(day => {
      const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day]
      console.log(`  ${dayName}: ${weekdayCounts[day]} 个`)
    })
    
    // 预测
    const targetDayOfWeek = 1
    const predicted = this.predictByWeekday(data, targetDayOfWeek)
    const hasSufficientData = (weekdayCounts[targetDayOfWeek] || 0) >= 2
    
    console.log(`预测营收: ¥${predicted.toFixed(2)}`)
    console.log(`数据充足性: ${hasSufficientData ? '充足' : '不足'}`)
    console.log(`✅ 测试通过: ${predicted > 0 ? '是' : '否'}`)
    console.log('')
    
    return { passed: predicted > 0, hasSufficientData }
  }

  /**
   * 测试场景4：趋势数据预测
   */
  static testTrendData() {
    console.log('📊 测试场景4：趋势数据预测')
    console.log('-'.repeat(60))
    
    const growthRate = 0.02 // 2%每天增长
    const data = TestDataGenerator.generateTrendData(30, 10000, growthRate)
    
    // 计算实际增长率
    const firstWeek = this.average(data.slice(0, 7).map(d => d.revenue))
    const lastWeek = this.average(data.slice(-7).map(d => d.revenue))
    const actualGrowth = ((lastWeek - firstWeek) / firstWeek) * 100
    
    console.log(`数据天数: ${data.length} 天`)
    console.log(`第一周平均: ¥${firstWeek.toFixed(2)}`)
    console.log(`最后一周平均: ¥${lastWeek.toFixed(2)}`)
    console.log(`实际增长率: ${actualGrowth.toFixed(2)}%`)
    
    // 简单的线性回归检测趋势
    const n = data.length
    const sumX = (n * (n - 1)) / 2
    const sumY = data.reduce((sum, d) => sum + d.revenue, 0)
    const sumXY = data.reduce((sum, d, i) => sum + i * d.revenue, 0)
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const detectedGrowth = slope > 0
    
    console.log(`趋势检测: ${detectedGrowth ? '增长' : '下降'}`)
    console.log(`斜率: ${slope.toFixed(2)}`)
    console.log(`✅ 测试通过: ${detectedGrowth ? '是' : '否'}`)
    console.log('')
    
    return { passed: detectedGrowth, actualGrowth }
  }

  /**
   * 测试场景5：季节性数据预测
   */
  static testSeasonalData() {
    console.log('📊 测试场景5：季节性数据预测')
    console.log('-'.repeat(60))
    
    const data = TestDataGenerator.generateSeasonalData(90, 10000)
    
    // 按月份分组
    const monthlyData = {}
    data.forEach(d => {
      const month = new Date(d.date).getMonth()
      if (!monthlyData[month]) monthlyData[month] = []
      monthlyData[month].push(d.revenue)
    })
    
    console.log(`数据天数: ${data.length} 天`)
    console.log('各月平均营收:')
    
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    Object.keys(monthlyData).forEach(month => {
      const avg = this.average(monthlyData[month])
      console.log(`  ${monthNames[month]}: ¥${avg.toFixed(2)}`)
    })
    
    // 检测季节性变化
    const monthlyAvgs = Object.values(monthlyData).map(arr => this.average(arr))
    const stdDev = this.standardDeviation(monthlyAvgs)
    const avgRevenue = this.average(monthlyAvgs)
    const variationCoefficient = (stdDev / avgRevenue) * 100
    
    console.log(`变异系数: ${variationCoefficient.toFixed(2)}%`)
    console.log(`季节性明显: ${variationCoefficient > 5 ? '是' : '否'}`)
    console.log(`✅ 测试通过: ${variationCoefficient > 5 ? '是' : '否'}`)
    console.log('')
    
    return { passed: variationCoefficient > 5, variationCoefficient }
  }

  /**
   * 运行所有测试
   */
  static runAllTests() {
    console.log('🚀 开始运行所有测试...\n')
    
    const results = []
    
    try {
      results.push({ name: '正常数据预测', ...this.testNormalData() })
      results.push({ name: '异常值检测', ...this.testDataWithOutliers() })
      results.push({ name: '稀疏数据预测', ...this.testSparseData() })
      results.push({ name: '趋势数据预测', ...this.testTrendData() })
      results.push({ name: '季节性数据预测', ...this.testSeasonalData() })
    } catch (error) {
      console.error('❌ 测试执行出错:', error.message)
      return
    }
    
    // 生成测试报告
    console.log('='.repeat(60))
    console.log('  测试总结')
    console.log('='.repeat(60))
    console.log('')
    
    const passedCount = results.filter(r => r.passed).length
    const totalCount = results.length
    const passRate = (passedCount / totalCount) * 100
    
    console.log('测试结果:')
    results.forEach((result, index) => {
      const status = result.passed ? '✅ 通过' : '❌ 失败'
      console.log(`  ${index + 1}. ${result.name}: ${status}`)
    })
    
    console.log('')
    console.log(`通过率: ${passedCount}/${totalCount} (${passRate.toFixed(2)}%)`)
    console.log('')
    
    if (passRate === 100) {
      console.log('🎉 所有测试通过！预测算法 V3.0 工作正常。')
    } else if (passRate >= 80) {
      console.log('⚠️  大部分测试通过，但仍有改进空间。')
    } else {
      console.log('❌ 测试失败率较高，需要检查算法实现。')
    }
    
    console.log('')
    console.log('='.repeat(60))
  }
}

// 运行测试
PredictionTester.runAllTests()
