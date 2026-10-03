/**
 * 营收数据批量导入页面
 * 支持CSV格式批量导入营收明细数据
 */

import {Button, ScrollView, Text, Textarea, View} from '@tarojs/components'
import Taro, {navigateBack, showModal} from '@tarojs/taro'
import {useAuth} from 'miaoda-auth-taro'
import type React from 'react'
import {useCallback, useState} from 'react'
import {createDailyRevenueDetails, createRevenueCalendar, getMonthlyRevenueWithDetails} from '@/db/api-revenue-calendar'
import type {CreateDailyRevenueDetailParams} from '@/db/types-v2'
import {useTenantStore} from '@/store/tenant'

interface ParsedRow {
  date: string
  breakfastRevenue: number
  lunchRevenue: number
  dinnerRevenue: number
  otherRevenue: number
  notes?: string
}

const RevenueExcelImport: React.FC = () => {
  const {user} = useAuth({guard: true})
  // 使用 selector 方式获取 store 状态
  const currentTenant = useTenantStore((state) => state.currentTenant)
  const currentStore = useTenantStore((state) => state.currentStore)

  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)

  // 下载CSV模板
  const handleDownloadTemplate = useCallback(() => {
    const template = `日期,早餐营收,午餐营收,晚餐营收,其他营收,备注
2024-01-01,1500,4000,4500,500,元旦假期
2024-01-02,1200,3500,4000,300,正常营业
2024-01-03,1300,3800,4200,400,周末`

    showModal({
      title: 'CSV模板',
      content: `请复制以下模板内容：\n\n${template}\n\n格式说明：\n• 第一行是标题，不要修改\n• 日期格式：YYYY-MM-DD\n• 营收金额：数字，单位元\n• 备注：可选，不超过100字`,
      showCancel: false,
      confirmText: '我知道了'
    })
  }, [])

  // 显示导入说明
  const handleShowInstructions = useCallback(() => {
    showModal({
      title: '批量导入说明',
      content:
        '使用步骤：\n\n1. 点击"下载模板"查看CSV格式\n2. 按照模板格式准备数据\n3. 将数据粘贴到输入框\n4. 点击"开始导入"按钮\n\n注意事项：\n• 第一行必须是标题行\n• 日期格式必须正确\n• 营收金额必须是数字\n• 同一天只能导入一次',
      showCancel: false,
      confirmText: '我知道了'
    })
  }, [])

  // 解析CSV文本
  const parseCSV = useCallback((text: string): ParsedRow[] => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('数据为空或格式不正确')
    }

    const rows: ParsedRow[] = []
    // 跳过标题行
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const parts = line.split(',')
      if (parts.length < 5) {
        throw new Error(`第${i + 1}行数据不完整`)
      }

      const date = parts[0].trim()
      const breakfastRevenue = Number.parseFloat(parts[1].trim())
      const lunchRevenue = Number.parseFloat(parts[2].trim())
      const dinnerRevenue = Number.parseFloat(parts[3].trim())
      const otherRevenue = Number.parseFloat(parts[4].trim())
      const notes = parts[5]?.trim() || ''

      // 验证日期格式
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error(`第${i + 1}行日期格式不正确：${date}`)
      }

      // 验证营收金额
      if (
        Number.isNaN(breakfastRevenue) ||
        Number.isNaN(lunchRevenue) ||
        Number.isNaN(dinnerRevenue) ||
        Number.isNaN(otherRevenue)
      ) {
        throw new Error(`第${i + 1}行营收金额格式不正确`)
      }

      if (breakfastRevenue < 0 || lunchRevenue < 0 || dinnerRevenue < 0 || otherRevenue < 0) {
        throw new Error(`第${i + 1}行营收金额不能为负数`)
      }

      rows.push({
        date,
        breakfastRevenue,
        lunchRevenue,
        dinnerRevenue,
        otherRevenue,
        notes
      })
    }

    return rows
  }, [])

  // 执行导入
  const handleImport = useCallback(async () => {
    if (!currentTenant || !currentStore || !user) {
      Taro.showToast({title: '请先选择租户和店铺', icon: 'none'})
      return
    }

    if (!csvText.trim()) {
      Taro.showToast({title: '请输入CSV数据', icon: 'none'})
      return
    }

    setImporting(true)
    try {
      // 解析CSV
      const rows = parseCSV(csvText)
      if (rows.length === 0) {
        throw new Error('没有有效的数据行')
      }

      // 按月份分组
      const monthGroups = new Map<string, ParsedRow[]>()
      for (const row of rows) {
        const month = row.date.substring(0, 7)
        if (!monthGroups.has(month)) {
          monthGroups.set(month, [])
        }
        monthGroups.get(month)?.push(row)
      }

      let successCount = 0
      let skipCount = 0

      // 逐月导入
      for (const [month, monthRows] of monthGroups) {
        // 检查该月份是否已存在营收日历
        const {calendar} = await getMonthlyRevenueWithDetails(currentTenant.id, currentStore.id, month)

        let calendarId: string

        if (calendar) {
          // 已存在，使用现有的
          calendarId = calendar.id
          console.log(`月份 ${month} 已存在营收日历，追加数据`)
        } else {
          // 不存在，创建新的
          const totalRevenue = monthRows.reduce(
            (sum, row) => sum + row.breakfastRevenue + row.lunchRevenue + row.dinnerRevenue + row.otherRevenue,
            0
          )

          const newCalendar = await createRevenueCalendar({
            tenant_id: currentTenant.id,
            store_id: currentStore.id,
            calendar_month: month,
            total_revenue_target: totalRevenue,
            predicted_total_revenue: totalRevenue,
            generated_by: 'manual',
            created_by: user.id
          })

          if (!newCalendar) {
            throw new Error(`创建月份 ${month} 的营收日历失败`)
          }

          calendarId = newCalendar.id
          console.log(`月份 ${month} 创建新营收日历成功`)
        }

        // 创建每日明细
        const details: CreateDailyRevenueDetailParams[] = monthRows.map((row) => {
          const dateObj = new Date(row.date)
          const dayOfWeek = dateObj.getDay()
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
          const totalRevenue = row.breakfastRevenue + row.lunchRevenue + row.dinnerRevenue + row.otherRevenue

          return {
            calendar_id: calendarId,
            revenue_date: row.date,
            day_of_week: dayOfWeek,
            is_weekend: isWeekend,
            is_holiday: false,
            predicted_revenue: totalRevenue,
            adjusted_revenue: totalRevenue,
            breakfast_revenue: row.breakfastRevenue,
            lunch_revenue: row.lunchRevenue,
            dinner_revenue: row.dinnerRevenue,
            other_revenue: row.otherRevenue,
            weather_factor: null,
            event_factor: null,
            notes: row.notes || null
          }
        })

        const success = await createDailyRevenueDetails(details)
        if (success) {
          successCount += details.length
        } else {
          skipCount += details.length
        }
      }

      Taro.showToast({
        title: `导入成功${successCount}条${skipCount > 0 ? `，跳过${skipCount}条` : ''}`,
        icon: 'success',
        duration: 2000
      })

      // 清空输入框
      setCsvText('')

      // 延迟返回
      setTimeout(() => {
        navigateBack()
      }, 2000)
    } catch (error) {
      console.error('导入失败:', error)
      Taro.showToast({
        title: error instanceof Error ? error.message : '导入失败',
        icon: 'none',
        duration: 3000
      })
    } finally {
      setImporting(false)
    }
  }, [currentTenant, currentStore, user, csvText, parseCSV])

  // 返回
  const handleBack = useCallback(() => {
    navigateBack()
  }, [])

  if (!currentTenant || !currentStore) {
    return (
      <View className="min-h-screen flex items-center justify-center bg-gray-50">
        <View className="text-center">
          <View className="i-mdi-alert-circle text-4xl text-yellow-500 mb-4" />
          <Text className="text-sm text-muted-foreground">请先选择租户和店铺</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView scrollY className="h-screen bg-gray-50">
      <View className="p-4 pb-20">
        {/* 标题 */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground block mb-2">营收数据批量导入</Text>
          <Text className="text-sm text-muted-foreground block">支持CSV格式批量导入营收数据</Text>
        </View>

        {/* 当前店铺信息 */}
        <View className="bg-blue-100 rounded-xl p-3 mb-4">
          <View className="flex items-center gap-2">
            <View className="i-mdi-store text-lg text-muted-foreground" />
            <Text className="text-sm text-blue-600 font-medium">{currentStore.name}</Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View className="flex gap-3 mb-4">
          <Button
            className="flex-1 bg-blue-100 text-white rounded-xl text-sm break-keep py-3"
            size="default"
            onClick={handleDownloadTemplate}>
            <View className="flex items-center justify-center">
              <View className="i-mdi-download text-base mr-1" />
              <Text>查看模板</Text>
            </View>
          </Button>
          <Button
            className="flex-1 bg-blue-100 text-white rounded-xl text-sm break-keep py-3"
            size="default"
            onClick={handleShowInstructions}>
            <View className="flex items-center justify-center">
              <View className="i-mdi-help-circle text-base mr-1" />
              <Text>使用说明</Text>
            </View>
          </Button>
        </View>

        {/* CSV输入区域 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
          <View className="flex items-center mb-3">
            <View className="i-mdi-table text-xl text-yellow-500 mr-2" />
            <Text className="text-base font-semibold text-foreground">粘贴CSV数据</Text>
          </View>
          <Text className="text-xs text-muted-foreground block mb-2">请按照模板格式准备数据，然后粘贴到下方输入框</Text>
          <View style={{overflow: 'hidden'}}>
            <Textarea
              className="bg-muted text-foreground px-3 py-2 rounded-lg border border-border w-full text-sm"
              style={{minHeight: '200px'}}
              placeholder="日期,早餐营收,午餐营收,晚餐营收,其他营收,备注&#10;2024-01-01,1500,4000,4500,500,元旦假期&#10;2024-01-02,1200,3500,4000,300,正常营业"
              value={csvText}
              onInput={(e) => setCsvText(e.detail.value)}
              maxlength={10000}
            />
          </View>
          <View className="flex items-center justify-between mt-2">
            <Text className="text-xs text-muted-foreground">已输入 {csvText.length} / 10000 字符</Text>
            {csvText && (
              <Button
                className="bg-muted text-muted-foreground rounded-lg text-xs break-keep px-3 py-1"
                size="mini"
                onClick={() => setCsvText('')}>
                清空
              </Button>
            )}
          </View>
        </View>

        {/* 格式说明 */}
        <View className="bg-white rounded-lg p-4 border-2 border-gray-200 mb-4 shadow-sm">
          <View className="flex items-center mb-3">
            <View className="i-mdi-information text-xl text-blue-500 mr-2" />
            <Text className="text-base font-semibold text-foreground">格式说明</Text>
          </View>
          <View className="space-y-2">
            <View className="flex items-start">
              <View className="i-mdi-check-circle text-base text-green-500 mr-2 mt-0.5" />
              <Text className="text-sm text-foreground flex-1">第一行必须是标题行（不要修改）</Text>
            </View>
            <View className="flex items-start">
              <View className="i-mdi-check-circle text-base text-green-500 mr-2 mt-0.5" />
              <Text className="text-sm text-foreground flex-1">日期格式：YYYY-MM-DD</Text>
            </View>
            <View className="flex items-start">
              <View className="i-mdi-check-circle text-base text-green-500 mr-2 mt-0.5" />
              <Text className="text-sm text-foreground flex-1">营收金额：数字，单位元</Text>
            </View>
            <View className="flex items-start">
              <View className="i-mdi-check-circle text-base text-green-500 mr-2 mt-0.5" />
              <Text className="text-sm text-foreground flex-1">备注：可选，不超过100字</Text>
            </View>
            <View className="flex items-start">
              <View className="i-mdi-check-circle text-base text-green-500 mr-2 mt-0.5" />
              <Text className="text-sm text-foreground flex-1">同一天只能导入一次</Text>
            </View>
          </View>
        </View>

        {/* 注意事项 */}
        <View className="bg-amber-50 rounded-lg p-4 mb-4">
          <View className="flex items-start">
            <View className="i-mdi-alert-circle text-xl text-amber-600 mr-2 mt-0.5" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-amber-800 block mb-2">注意事项</Text>
              <Text className="text-xs text-amber-700 block mb-1">• 请确保数据格式正确，避免导入失败</Text>
              <Text className="text-xs text-amber-700 block mb-1">• 导入前请仔细检查数据，避免重复录入</Text>
              <Text className="text-xs text-amber-700 block mb-1">• 系统会自动按月份分组并创建营收日历</Text>
              <Text className="text-xs text-amber-700 block">• 如遇到问题，请查看使用说明</Text>
            </View>
          </View>
        </View>

        {/* 底部按钮 */}
        <View className="flex gap-3">
          <Button
            className="flex-1 bg-muted text-foreground rounded-xl text-sm break-keep py-3"
            size="default"
            onClick={handleBack}
            disabled={importing}>
            返回
          </Button>
          <Button
            className="flex-1 bg-blue-100 text-white rounded-xl text-sm break-keep py-3 font-semibold"
            size="default"
            onClick={handleImport}
            disabled={importing || !csvText.trim()}>
            <View className="flex items-center justify-center">
              {importing ? (
                <>
                  <View className="i-mdi-loading animate-spin text-base mr-1" />
                  <Text>导入中...</Text>
                </>
              ) : (
                <>
                  <View className="i-mdi-upload text-base mr-1" />
                  <Text>开始导入</Text>
                </>
              )}
            </View>
          </Button>
        </View>
      </View>
    </ScrollView>
  )
}

export default RevenueExcelImport
